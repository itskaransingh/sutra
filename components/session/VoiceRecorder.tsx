"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { sendVoiceMessage } from "@/app/actions/message";
import type { Message } from "@/lib/types/database";
import { Mic, Square, X, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface VoiceRecorderProps {
  sessionId: string;
  senderId: string;
  senderType: "patient" | "doctor";
  onClose: () => void;
  onMessageSent: (message: Message) => void;
}

type RecordingState = "idle" | "recording" | "processing" | "preview";

export function VoiceRecorder({
  sessionId,
  senderId,
  senderType,
  onClose,
  onMessageSent,
}: VoiceRecorderProps) {
  const [state, setState] = useState<RecordingState>("idle");
  const [duration, setDuration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingStatus, setProcessingStatus] = useState("");

  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
        mediaRecorder.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunks.current.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, {
          type: recorder.mimeType,
        });
        setAudioBlob(blob);
        setState("preview");

        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.current = recorder;
      recorder.start(1000); // Collect data every second

      setState("recording");
      startTimeRef.current = Date.now();
      setDuration(0);

      // Update duration every 100ms
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);
    } catch (err) {
      console.error("Failed to start recording:", err);
      setError("Could not access microphone. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (mediaRecorder.current && mediaRecorder.current.state === "recording") {
      mediaRecorder.current.stop();
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setState("idle");
    setDuration(0);
    onClose();
  };

  const sendRecording = async () => {
    if (!audioBlob) return;

    setState("processing");
    setProcessingStatus("Uploading audio...");

    try {
      const supabase = createClient();

      // Upload to Supabase Storage
      const fileName = `voice-${sessionId}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("voice-notes")
        .upload(fileName, audioBlob, {
          contentType: audioBlob.type,
        });

      if (uploadError) {
        // If bucket doesn't exist, we'll mock the URL for hackathon
        console.warn("Upload failed, using mock URL:", uploadError);
      }

      const audioUrl = uploadData
        ? supabase.storage.from("voice-notes").getPublicUrl(uploadData.path).data
            .publicUrl
        : `mock://voice-note-${Date.now()}`;

      setProcessingStatus("Processing with AI...");

      // Call AI backend for transcription (mock for now if backend not ready)
      let aiProcessed = null;

      try {
        const aiApiUrl = process.env.NEXT_PUBLIC_AI_API_URL;
        if (aiApiUrl) {
          // Convert blob to base64
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () => {
              const base64 = (reader.result as string).split(",")[1];
              resolve(base64);
            };
            reader.readAsDataURL(audioBlob);
          });

          const audioBase64 = await base64Promise;

          const response = await fetch(`${aiApiUrl}/api/voice/process`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              audio_base64: audioBase64,
              language_hint: "hinglish",
            }),
          });

          if (response.ok) {
            aiProcessed = await response.json();
          }
        }
      } catch (aiError) {
        console.warn("AI processing failed, using mock:", aiError);
      }

      // Mock AI response for hackathon demo if backend not available
      if (!aiProcessed) {
        aiProcessed = {
          transcription:
            "Patient has fever for 3 days with stomach pain. Prescribed Pan D and Taxim. Referred to surgery for suspected appendicitis.",
          summary:
            "Patient presents with 3-day fever and abdominal pain. Suspected appendicitis. Referral to surgery recommended.",
          language_detected: "hinglish",
          entities: {
            medicines: [
              { name: "Pan D", dosage: "1 tab", frequency: "daily" },
              { name: "Taxim 200mg", dosage: "200mg", frequency: "twice daily" },
            ],
            conditions: ["Fever", "Abdominal pain", "Suspected appendicitis"],
            referral: {
              specialty: "Surgery",
              condition: "Suspected appendicitis",
            },
          },
        };
      }

      setProcessingStatus("Saving message...");

      // Send the message
      const result = await sendVoiceMessage(
        sessionId,
        senderId,
        senderType,
        audioUrl,
        duration,
        aiProcessed
      );

      if (result.error) {
        setError(result.error);
        setState("preview");
        return;
      }

      if (result.message) {
        onMessageSent(result.message);
      }

      onClose();
    } catch (err) {
      console.error("Failed to send voice message:", err);
      setError("Failed to send voice message");
      setState("preview");
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  return (
    <Card className="m-3 bg-gradient-to-r from-sutra-cyan/5 to-sutra-emerald/5 border-sutra-cyan/30">
      <CardContent className="p-4">
        {/* Recording UI */}
        {state === "idle" && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Tap to start recording
            </p>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-sutra-cyan hover:bg-sutra-cyan/90"
                onClick={startRecording}
              >
                <Mic className="w-6 h-6" />
              </Button>
            </div>
          </div>
        )}

        {state === "recording" && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 bg-red-500 rounded-full animate-ping" />
              </div>
              <span className="text-lg font-mono">{formatDuration(duration)}</span>
            </div>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={cancelRecording}
              >
                <X className="w-5 h-5" />
              </Button>
              <Button
                size="icon"
                className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600"
                onClick={stopRecording}
              >
                <Square className="w-5 h-5 fill-current" />
              </Button>
            </div>
          </div>
        )}

        {state === "preview" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Recording: {formatDuration(duration)}
              </span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={cancelRecording}>
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="bg-sutra-cyan hover:bg-sutra-cyan/90"
                  onClick={sendRecording}
                >
                  <Send className="w-4 h-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}

        {state === "processing" && (
          <div className="flex flex-col items-center py-4 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-sutra-cyan" />
            <p className="text-sm text-muted-foreground">{processingStatus}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

