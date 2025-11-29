"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type {
  Message,
  TextMessageContent,
  VoiceMessageContent,
  VoiceAIProcessed,
  ReferralMessageContent,
  SystemMessageContent,
  PrescriptionMessageContent,
} from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils";
import {
  Mic,
  FileText,
  QrCode,
  UserPlus,
  Pill,
  Play,
  AlertTriangle,
} from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useState } from "react";

interface ChatMessageProps {
  message: Message;
  isOwnMessage: boolean;
  senderName: string;
}

export function ChatMessage({
  message,
  isOwnMessage,
  senderName,
}: ChatMessageProps) {
  // System messages
  if (message.message_type === "system") {
    const content = message.content as SystemMessageContent;
    return (
      <div className="flex justify-center my-4">
        <Badge variant="secondary" className="text-xs font-normal gap-1">
          {content.event === "doctor_joined" && <UserPlus className="w-3 h-3" />}
          {content.event === "session_created" && "Session started"}
          {content.event === "doctor_joined" &&
            `${content.actor_name || "Doctor"} joined`}
          {content.event === "referral_created" && "Referral created"}
        </Badge>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-2",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {!isOwnMessage && (
        <Avatar className="h-8 w-8">
          <AvatarFallback
            className={cn(
              message.sender_type === "doctor" &&
                "bg-gradient-to-br from-sutra-cyan to-sutra-blue text-white"
            )}
          >
            {senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[80%] space-y-1",
          isOwnMessage && "items-end"
        )}
      >
        {!isOwnMessage && (
          <p className="text-xs text-muted-foreground px-1">{senderName}</p>
        )}

        <MessageContent message={message} isOwnMessage={isOwnMessage} />

        <p
          className={cn(
            "text-xs text-muted-foreground px-1",
            isOwnMessage && "text-right"
          )}
        >
          {formatDistanceToNow(message.created_at)}
        </p>
      </div>
    </div>
  );
}

function MessageContent({
  message,
  isOwnMessage,
}: {
  message: Message;
  isOwnMessage: boolean;
}) {
  switch (message.message_type) {
    case "text":
      return <TextMessage content={message.content as TextMessageContent} isOwn={isOwnMessage} />;

    case "voice":
      return (
        <VoiceMessage
          content={message.content as VoiceMessageContent}
          aiProcessed={message.ai_processed}
          isOwn={isOwnMessage}
        />
      );

    case "prescription":
      return (
        <PrescriptionMessage
          content={message.content as PrescriptionMessageContent}
          isOwn={isOwnMessage}
        />
      );

    case "referral":
      return (
        <ReferralMessage
          content={message.content as ReferralMessageContent}
          isOwn={isOwnMessage}
        />
      );

    default:
      return (
        <Card className={cn(isOwnMessage ? "bg-sutra-cyan text-white" : "bg-muted")}>
          <CardContent className="p-3">
            <p className="text-sm">Unknown message type</p>
          </CardContent>
        </Card>
      );
  }
}

function TextMessage({ content, isOwn }: { content: TextMessageContent; isOwn: boolean }) {
  return (
    <Card className={cn(isOwn ? "bg-sutra-cyan text-white" : "bg-muted")}>
      <CardContent className="p-3">
        <p className="text-sm whitespace-pre-wrap">{content.text}</p>
      </CardContent>
    </Card>
  );
}

function VoiceMessage({
  content,
  aiProcessed,
  isOwn,
}: {
  content: VoiceMessageContent;
  aiProcessed: VoiceAIProcessed | null;
  isOwn: boolean;
}) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <Card className={cn("overflow-hidden", isOwn ? "bg-sutra-cyan/10" : "bg-muted")}>
      <CardContent className="p-3 space-y-3">
        {/* Audio Player */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-10 h-10 rounded-full bg-sutra-cyan flex items-center justify-center text-white"
          >
            {isPlaying ? (
              <div className="w-3 h-3 bg-white rounded-sm" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-1">
              <Mic className="w-3 h-3 text-sutra-cyan" />
              <span className="text-xs text-muted-foreground">Voice note</span>
            </div>
            {content.duration_seconds && (
              <p className="text-xs text-muted-foreground">
                {Math.floor(content.duration_seconds / 60)}:
                {String(Math.floor(content.duration_seconds % 60)).padStart(2, "0")}
              </p>
            )}
          </div>
        </div>

        {/* AI Processed Content */}
        {aiProcessed && (
          <div className="border-t pt-3 space-y-3">
            {/* Transcription */}
            {aiProcessed.transcription && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <FileText className="w-3 h-3" />
                  Transcription
                </p>
                <p className="text-sm">{aiProcessed.transcription}</p>
              </div>
            )}

            {/* Summary */}
            {aiProcessed.summary && (
              <div className="bg-gradient-to-r from-sutra-cyan/10 to-sutra-emerald/10 rounded-lg p-3">
                <p className="text-xs font-medium text-sutra-cyan mb-1">
                  📝 Summary
                </p>
                <p className="text-sm">{aiProcessed.summary}</p>
              </div>
            )}

            {/* Extracted Entities */}
            {aiProcessed.entities && (
              <div className="space-y-2">
                {/* Medicines */}
                {aiProcessed.entities.medicines?.length > 0 && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                      <Pill className="w-3 h-3" />
                      Prescribed
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {aiProcessed.entities.medicines.map((med, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {med.name}
                          {med.dosage && ` ${med.dosage}`}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Conditions */}
                {aiProcessed.entities.conditions?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {aiProcessed.entities.conditions.map((cond, i) => (
                      <Badge key={i} variant="warning" className="text-xs">
                        {cond}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Referral suggestion */}
                {aiProcessed.entities.referral && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <AlertTriangle className="w-4 h-4" />
                    <span>
                      Referral suggested:{" "}
                      {aiProcessed.entities.referral.specialty}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PrescriptionMessage({
  content,
  isOwn,
}: {
  content: PrescriptionMessageContent;
  isOwn: boolean;
}) {
  return (
    <Card className="bg-emerald-50 border-emerald-200">
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center gap-2 text-emerald-700">
          <Pill className="w-4 h-4" />
          <span className="text-sm font-medium">Prescription</span>
        </div>
        <div className="space-y-1">
          {content.medicines.map((med, i) => (
            <div key={i} className="text-sm">
              <span className="font-medium">{med.name}</span>
              <span className="text-muted-foreground">
                {" "}
                • {med.dosage} • {med.frequency}
                {med.duration && ` • ${med.duration}`}
              </span>
            </div>
          ))}
        </div>
        {content.instructions && (
          <p className="text-xs text-muted-foreground mt-2">
            {content.instructions}
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function ReferralMessage({
  content,
  isOwn,
}: {
  content: ReferralMessageContent;
  isOwn: boolean;
}) {
  return (
    <Card className="bg-amber-50 border-amber-200">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-amber-700">
          <QrCode className="w-4 h-4" />
          <span className="text-sm font-medium">Referral</span>
        </div>

        {content.target_specialty && (
          <p className="text-sm">
            <span className="text-muted-foreground">To: </span>
            <span className="font-medium">{content.target_specialty}</span>
          </p>
        )}

        {content.notes && (
          <p className="text-sm text-muted-foreground">{content.notes}</p>
        )}

        {/* QR Code */}
        <div className="flex justify-center p-2 bg-white rounded-lg">
          <QRCodeSVG
            value={content.qr_data}
            size={120}
            level="M"
            bgColor="#ffffff"
            fgColor="#1e3a5f"
          />
        </div>

        <p className="text-xs text-center text-muted-foreground">
          Code: {content.referral_code}
        </p>
      </CardContent>
    </Card>
  );
}

