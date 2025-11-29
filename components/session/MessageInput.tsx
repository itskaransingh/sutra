"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendTextMessage, sendFileMessage } from "@/app/actions/message";
import { createClient } from "@/lib/supabase/client";
import type { Message } from "@/lib/types/database";
import {
  Send,
  Mic,
  Loader2,
  Paperclip,
  Keyboard,
  X,
  Square,
  FileText,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  sessionId: string;
  senderId: string;
  senderType: "patient" | "doctor";
  onMessageSent: (message: Message) => void;
}

type InputMode = "idle" | "recording" | "typing" | "file";
type RecordingState = "ready" | "active" | "preview" | "processing";

export function MessageInput({
  sessionId,
  senderId,
  senderType,
  onMessageSent,
}: MessageInputProps) {
  const [mode, setMode] = useState<InputMode>("idle");
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Recording state
  const [recordingState, setRecordingState] = useState<RecordingState>("ready");
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [processingStatus, setProcessingStatus] = useState("");
  const [audioLevels, setAudioLevels] = useState<number[]>(
    Array(24).fill(0.15)
  );

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Refs
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (animationFrameRef.current)
        cancelAnimationFrame(animationFrameRef.current);
      if (mediaRecorder.current?.state === "recording") {
        mediaRecorder.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  // ========== TEXT HANDLING ==========
  const handleSend = async () => {
    if (!text.trim() || isSending) return;

    setIsSending(true);
    const messageText = text.trim();
    setText("");

    try {
      const result = await sendTextMessage(
        sessionId,
        senderId,
        senderType,
        messageText
      );
      if (result.message) {
        onMessageSent(result.message);
      }
      setMode("idle");
    } catch (err) {
      console.error("Failed to send message:", err);
      setText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ========== AUDIO VISUALIZATION ==========
  const updateAudioLevels = useCallback(() => {
    if (!analyserRef.current) return;

    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);

    // Sample 24 bars from the frequency data
    const levels: number[] = [];
    const step = Math.floor(dataArray.length / 24);
    for (let i = 0; i < 24; i++) {
      const value = dataArray[i * step] / 255;
      levels.push(Math.max(0.15, value));
    }
    setAudioLevels(levels);

    if (recordingState === "active") {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevels);
    }
  }, [recordingState]);

  // ========== VOICE RECORDING ==========
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Setup audio analyzer for visualization
      audioContextRef.current = new AudioContext();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 64;
      source.connect(analyserRef.current);

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm")
          ? "audio/webm"
          : "audio/mp4",
      });

      audioChunks.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunks.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunks.current, { type: recorder.mimeType });
        setAudioBlob(blob);
        setRecordingState("preview");
        stream.getTracks().forEach((track) => track.stop());
        if (animationFrameRef.current)
          cancelAnimationFrame(animationFrameRef.current);
        setAudioLevels(Array(24).fill(0.15));
      };

      mediaRecorder.current = recorder;
      recorder.start(100);

      setRecordingState("active");
      startTimeRef.current = Date.now();
      setDuration(0);

      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 100);

      // Start visualization
      updateAudioLevels();
    } catch (err) {
      console.error("Failed to start recording:", err);
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingState("ready");
    setDuration(0);
    setMode("idle");
  };

  const sendRecording = async () => {
    if (!audioBlob) return;

    setRecordingState("processing");
    setProcessingStatus("Uploading...");

    try {
      const supabase = createClient();
      const fileName = `voice-${sessionId}-${Date.now()}.webm`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("voice-notes")
        .upload(fileName, audioBlob, { contentType: audioBlob.type });

      if (uploadError) console.warn("Upload failed:", uploadError);

      const audioUrl = uploadData
        ? supabase.storage.from("voice-notes").getPublicUrl(uploadData.path)
            .data.publicUrl
        : `mock://voice-note-${Date.now()}`;

      setProcessingStatus("Processing with AI...");

      // AI processing
      let aiProcessed = null;
      try {
        const aiApiUrl = process.env.NEXT_PUBLIC_AI_API_URL;
        if (aiApiUrl) {
          const reader = new FileReader();
          const base64Promise = new Promise<string>((resolve) => {
            reader.onloadend = () =>
              resolve((reader.result as string).split(",")[1]);
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

          if (response.ok) aiProcessed = await response.json();
        }
      } catch (aiError) {
        console.warn("AI processing failed:", aiError);
      }

      // Mock AI response for demo
      if (!aiProcessed) {
        aiProcessed = {
          transcription: "Voice note recorded",
          summary: "Voice note from consultation",
          language_detected: "en",
          entities: { medicines: [], conditions: [] },
        };
      }

      setProcessingStatus("Sending...");

      const { sendVoiceMessage } = await import("@/app/actions/message");
      const result = await sendVoiceMessage(
        sessionId,
        senderId,
        senderType,
        audioUrl,
        duration,
        aiProcessed
      );

      if (result.message) onMessageSent(result.message);

      setMode("idle");
      setRecordingState("ready");
      setAudioBlob(null);
      setDuration(0);
    } catch (err) {
      console.error("Failed to send recording:", err);
      setRecordingState("preview");
    }
  };

  // ========== FILE HANDLING ==========
  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
      setMode("file");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelFile = () => {
    setSelectedFile(null);
    setMode("idle");
    setUploadProgress(0);
  };

  const sendFile = async () => {
    if (!selectedFile) return;

    setIsSending(true);
    setUploadProgress(10);

    try {
      const supabase = createClient();

      // Upload to Supabase storage
      const fileName = `docs-${sessionId}-${Date.now()}-${selectedFile.name}`;
      setUploadProgress(30);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("documents")
        .upload(fileName, selectedFile, {
          contentType: selectedFile.type,
        });

      if (uploadError) {
        console.error("Upload failed:", uploadError);
        throw uploadError;
      }

      setUploadProgress(60);

      const fileUrl = supabase.storage
        .from("documents")
        .getPublicUrl(uploadData.path).data.publicUrl;

      setUploadProgress(80);

      // Send message first
      const result = await sendFileMessage(
        sessionId,
        senderId,
        senderType,
        fileUrl,
        "pdf",
        selectedFile.name
      );

      if (result.message) {
        onMessageSent(result.message);

        // Call AI backend to summarize PDF (fire and forget for UX)
        const aiApiUrl = process.env.NEXT_PUBLIC_AI_API_URL;
        if (aiApiUrl) {
          fetch(`${aiApiUrl}/api/pdf/summarize`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              file_url: fileUrl,
              message_id: result.message.id,
              session_id: sessionId,
            }),
          }).catch((err) => console.warn("PDF summarization failed:", err));
        }
      }

      setUploadProgress(100);
      setMode("idle");
      setSelectedFile(null);
    } catch (err) {
      console.error("Failed to send file:", err);
    } finally {
      setIsSending(false);
      setUploadProgress(0);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  // ========== RENDER ==========

  // IDLE MODE - 3 buttons spanning width, mic elevated
  if (mode === "idle") {
    return (
      <div className="relative pt-4 pb-3 px-4">
        <div className="flex items-end justify-between mx-10">
          {/* File attachment */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full text-muted-foreground hover:text-sutra-cyan hover:bg-sutra-cyan/10 transition-all"
            onClick={handleFileSelect}
          >
            <Paperclip className="w-5 h-5" />
          </Button>

          {/* Voice recorder - center, elevated popup effect */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-10">
            <Button
              size="icon"
              className="h-[72px] w-[72px] rounded-full bg-gradient-to-br from-sutra-cyan to-sutra-emerald hover:opacity-90 shadow-xl shadow-sutra-cyan/30 transition-all hover:scale-105 border-4 border-background"
              onClick={() => {
                setMode("recording");
                startRecording();
              }}
            >
              <Mic className="w-7 h-7" />
            </Button>
          </div>

          {/* Keyboard */}
          <Button
            variant="ghost"
            size="icon"
            className="h-12 w-12 rounded-full text-muted-foreground hover:text-sutra-cyan hover:bg-sutra-cyan/10 transition-all"
            onClick={() => setMode("typing")}
          >
            <Keyboard className="w-5 h-5" />
          </Button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
    );
  }

  // RECORDING MODE - full width with waveform
  if (mode === "recording") {
    return (
      <div className="p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-3 bg-gradient-to-r from-stone-900/5 to-stone-800/5 rounded-full px-4 py-2">
          {/* Cancel */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-stone-400 hover:text-red-500 hover:bg-red-500/10 shrink-0"
            onClick={cancelRecording}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Waveform visualization */}
          <div className="flex-1 flex items-center justify-center gap-[2px] h-10 overflow-hidden">
            {recordingState === "active" && (
              <>
                <div className="relative flex items-center gap-[3px] mr-3">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-stone-600 tabular-nums">
                    {formatDuration(duration)}
                  </span>
                </div>
                {audioLevels.map((level, i) => (
                  <div
                    key={i}
                    className="w-[3px] bg-gradient-to-t from-sutra-cyan to-sutra-emerald rounded-full transition-all duration-75"
                    style={{
                      height: `${Math.max(4, level * 32)}px`,
                    }}
                  />
                ))}
              </>
            )}

            {recordingState === "preview" && (
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <Check className="w-4 h-4 text-sutra-emerald" />
                <span>{formatDuration(duration)} recorded</span>
              </div>
            )}

            {recordingState === "processing" && (
              <div className="flex items-center gap-2 text-sm text-stone-500">
                <Loader2 className="w-4 h-4 animate-spin text-sutra-cyan" />
                <span>{processingStatus}</span>
              </div>
            )}
          </div>

          {/* Stop / Send */}
          {recordingState === "active" && (
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-red-500 hover:bg-red-600 shrink-0"
              onClick={stopRecording}
            >
              <Square className="w-4 h-4 fill-current" />
            </Button>
          )}

          {recordingState === "preview" && (
            <Button
              size="icon"
              className="h-10 w-10 rounded-full bg-sutra-cyan hover:bg-sutra-cyan/90 shrink-0"
              onClick={sendRecording}
            >
              <Send className="w-4 h-4" />
            </Button>
          )}

          {recordingState === "processing" && (
            <div className="h-10 w-10 flex items-center justify-center shrink-0">
              <Loader2 className="w-5 h-5 animate-spin text-sutra-cyan" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // TYPING MODE - full width text input
  if (mode === "typing") {
    return (
      <div className="p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-end gap-2">
          {/* Minimize to mic */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-stone-400 hover:text-sutra-cyan hover:bg-sutra-cyan/10 shrink-0 mb-0.5"
            onClick={() => setMode("idle")}
          >
            <Mic className="w-5 h-5" />
          </Button>

          <Textarea
            placeholder="Type a message..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="min-h-[44px] max-h-[120px] resize-none flex-1 rounded-2xl bg-stone-100 border-0 focus-visible:ring-sutra-cyan/50"
            rows={1}
            disabled={isSending}
            autoFocus
          />

          <Button
            size="icon"
            className={cn(
              "h-10 w-10 rounded-full shrink-0 mb-0.5 transition-all",
              text.trim()
                ? "bg-sutra-cyan hover:bg-sutra-cyan/90"
                : "bg-stone-200 text-stone-400"
            )}
            onClick={handleSend}
            disabled={!text.trim() || isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    );
  }

  // FILE MODE - file preview and send
  if (mode === "file" && selectedFile) {
    return (
      <div className="p-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
        <div className="flex items-center gap-3 bg-gradient-to-r from-stone-900/5 to-stone-800/5 rounded-2xl px-4 py-3">
          {/* Cancel */}
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10 rounded-full text-stone-400 hover:text-red-500 hover:bg-red-500/10 shrink-0"
            onClick={cancelFile}
            disabled={isSending}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* File info */}
          <div className="flex-1 flex items-center gap-3 min-w-0">
            <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-stone-800 truncate">
                {selectedFile.name}
              </p>
              <p className="text-xs text-stone-500">
                {uploadProgress > 0
                  ? `Uploading... ${uploadProgress}%`
                  : `${(selectedFile.size / 1024).toFixed(1)} KB`}
              </p>
            </div>
          </div>

          {/* Send */}
          <Button
            size="icon"
            className="h-10 w-10 rounded-full bg-sutra-cyan hover:bg-sutra-cyan/90 shrink-0"
            onClick={sendFile}
            disabled={isSending}
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Progress bar */}
        {uploadProgress > 0 && (
          <div className="mt-2 h-1 bg-stone-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sutra-cyan to-sutra-emerald transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  return null;
}
