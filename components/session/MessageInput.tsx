"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendTextMessage } from "@/app/actions/message";
import type { Message } from "@/lib/types/database";
import { Send, Mic, Loader2 } from "lucide-react";
import { VoiceRecorder } from "@/components/session/VoiceRecorder";

interface MessageInputProps {
  sessionId: string;
  senderId: string;
  senderType: "patient" | "doctor";
  onMessageSent: (message: Message) => void;
}

export function MessageInput({
  sessionId,
  senderId,
  senderType,
  onMessageSent,
}: MessageInputProps) {
  const [text, setText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [showVoice, setShowVoice] = useState(false);

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
    } catch (err) {
      console.error("Failed to send message:", err);
      setText(messageText); // Restore text on error
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

  if (showVoice) {
    return (
      <VoiceRecorder
        sessionId={sessionId}
        senderId={senderId}
        senderType={senderType}
        onClose={() => setShowVoice(false)}
        onMessageSent={onMessageSent}
      />
    );
  }

  return (
    <div className="p-3 flex items-end gap-2">
      <Button
        variant="ghost"
        size="icon"
        className="shrink-0 text-sutra-cyan hover:text-sutra-cyan hover:bg-sutra-cyan/10"
        onClick={() => setShowVoice(true)}
      >
        <Mic className="w-5 h-5" />
      </Button>

      <Textarea
        placeholder="Type a message..."
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        className="min-h-[44px] max-h-[120px] resize-none"
        rows={1}
        disabled={isSending}
      />

      <Button
        size="icon"
        className="shrink-0 bg-sutra-cyan hover:bg-sutra-cyan/90"
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
  );
}

