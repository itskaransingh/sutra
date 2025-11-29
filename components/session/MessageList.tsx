"use client";

import { ChatMessage } from "@/components/session/ChatMessage";
import type { Message, SessionParticipant, Doctor } from "@/lib/types/database";

interface MessageListProps {
  messages: Message[];
  currentUserId: string;
  isPatient: boolean;
  currentDoctorId: string | null;
  participants: (SessionParticipant & { doctor: Doctor })[];
}

export function MessageList({
  messages,
  currentUserId,
  isPatient,
  currentDoctorId,
  participants,
}: MessageListProps) {
  // Create a map of doctor IDs to names
  const doctorNames = new Map<string, string>();
  participants?.forEach((p) => {
    if (p.doctor) {
      doctorNames.set(p.doctor.id, p.doctor.display_name || "Doctor");
    }
  });

  if (messages.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        <p className="text-sm">No messages yet. Start the conversation!</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {messages.map((message) => {
        const isOwnMessage =
          (isPatient && message.sender_type === "patient") ||
          (!isPatient &&
            message.sender_type === "doctor" &&
            message.sender_id === currentDoctorId);

        const senderName =
          message.sender_type === "patient"
            ? "Patient"
            : message.sender_type === "doctor"
            ? doctorNames.get(message.sender_id || "") || "Doctor"
            : "System";

        return (
          <ChatMessage
            key={message.id}
            message={message}
            isOwnMessage={isOwnMessage}
            senderName={senderName}
          />
        );
      })}
    </div>
  );
}

