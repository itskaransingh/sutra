"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type {
  Message,
  TextMessageContent,
  VoiceMessageContent,
  VoiceAIProcessed,
  ReferralMessageContent,
  SystemMessageContent,
  PrescriptionMessageContent,
  UploadMessageContent,
} from "@/lib/types/database";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "@/lib/utils";
import {
  Mic,
  FileText,
  QrCode,
  Pill,
  Play,
  AlertTriangle,
  Download,
  File,
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
      <div className="flex justify-center my-2">
        <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
          {content.event === "session_created" && "Session started"}
          {content.event === "doctor_joined" &&
            `${content.actor_name || "Doctor"} joined`}
          {content.event === "referral_created" && "Referral created"}
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex gap-1.5",
        isOwnMessage ? "justify-end" : "justify-start"
      )}
    >
      {!isOwnMessage && (
        <Avatar className="h-6 w-6 shrink-0">
          <AvatarFallback
            className={cn(
              "text-[10px]",
              message.sender_type === "doctor"
                ? "bg-sutra-cyan/10 text-sutra-cyan"
                : "bg-muted"
            )}
          >
            {senderName.charAt(0)}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[75%] space-y-0.5",
          isOwnMessage && "items-end"
        )}
      >
        <MessageContent message={message} isOwnMessage={isOwnMessage} />

        <p
          className={cn(
            "text-[10px] text-muted-foreground/70 px-0.5",
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

    case "upload":
      return (
        <UploadMessage
          content={message.content as UploadMessageContent}
          isOwn={isOwnMessage}
        />
      );

    default:
      return (
        <div className={cn("px-3 py-1.5 rounded-2xl text-xs text-muted-foreground", isOwnMessage ? "bg-muted/50" : "bg-muted")}>
          Unsupported message
        </div>
      );
  }
}

function TextMessage({ content, isOwn }: { content: TextMessageContent; isOwn: boolean }) {
  return (
    <div
      className={cn(
        "px-3 py-1.5 rounded-2xl text-sm",
        isOwn
          ? "bg-sutra-cyan text-white rounded-br-md"
          : "bg-muted rounded-bl-md"
      )}
    >
      <p className="whitespace-pre-wrap">{content.text}</p>
    </div>
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
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        isOwn ? "bg-sutra-cyan/5 rounded-br-md" : "bg-muted rounded-bl-md"
      )}
    >
      {/* Audio Player */}
      <div className="flex items-center gap-2 p-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className="w-8 h-8 rounded-full bg-sutra-cyan flex items-center justify-center text-white shrink-0"
        >
          {isPlaying ? (
            <div className="w-2 h-2 bg-white rounded-sm" />
          ) : (
            <Play className="w-3 h-3 ml-0.5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <Mic className="w-3 h-3 text-sutra-cyan shrink-0" />
            <span className="text-[11px] text-muted-foreground">Voice</span>
            {content.duration_seconds && (
              <span className="text-[11px] text-muted-foreground">
                • {Math.floor(content.duration_seconds / 60)}:
                {String(Math.floor(content.duration_seconds % 60)).padStart(2, "0")}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* AI Processed Content */}
      {aiProcessed && (
        <div className="border-t border-border/50 p-2 space-y-2">
          {/* Transcription */}
          {aiProcessed.transcription && (
            <p className="text-xs text-foreground/80">{aiProcessed.transcription}</p>
          )}

          {/* Summary */}
          {aiProcessed.summary && (
            <div className="bg-sutra-cyan/5 rounded-lg px-2 py-1.5">
              <p className="text-[10px] font-medium text-sutra-cyan mb-0.5">Summary</p>
              <p className="text-xs">{aiProcessed.summary}</p>
            </div>
          )}

          {/* Extracted Entities */}
          {aiProcessed.entities && (
            <div className="space-y-1">
              {/* Medicines */}
              {aiProcessed.entities.medicines?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {aiProcessed.entities.medicines.map((med, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-emerald-500/10 text-emerald-700 px-1.5 py-0.5 rounded"
                    >
                      {med.name}
                    </span>
                  ))}
                </div>
              )}

              {/* Conditions */}
              {aiProcessed.entities.conditions?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {aiProcessed.entities.conditions.map((cond, i) => (
                    <span
                      key={i}
                      className="text-[10px] bg-amber-500/10 text-amber-700 px-1.5 py-0.5 rounded"
                    >
                      {cond}
                    </span>
                  ))}
                </div>
              )}

              {/* Referral suggestion */}
              {aiProcessed.entities.referral && (
                <div className="flex items-center gap-1 text-[11px] text-amber-600">
                  <AlertTriangle className="w-3 h-3" />
                  <span>→ {aiProcessed.entities.referral.specialty}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
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
    <div className="bg-emerald-50 rounded-2xl rounded-bl-md p-2 space-y-1.5">
      <div className="flex items-center gap-1.5 text-emerald-700">
        <Pill className="w-3 h-3" />
        <span className="text-xs font-medium">Prescription</span>
      </div>
      <div className="space-y-0.5">
        {content.medicines.map((med, i) => (
          <div key={i} className="text-xs">
            <span className="font-medium">{med.name}</span>
            <span className="text-muted-foreground">
              {" "}
              • {med.dosage} • {med.frequency}
            </span>
          </div>
        ))}
      </div>
      {content.instructions && (
        <p className="text-[10px] text-muted-foreground">
          {content.instructions}
        </p>
      )}
    </div>
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
    <div className="bg-amber-50 rounded-2xl rounded-bl-md p-2.5 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-amber-700">
          <QrCode className="w-3 h-3" />
          <span className="text-xs font-medium">Referral</span>
        </div>
        {content.target_specialty && (
          <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
            {content.target_specialty}
          </span>
        )}
      </div>

      {content.notes && (
        <p className="text-[11px] text-muted-foreground">{content.notes}</p>
      )}

      {/* QR Code - smaller */}
      <div className="flex justify-center py-1">
        <QRCodeSVG
          value={content.qr_data}
          size={80}
          level="M"
          bgColor="transparent"
          fgColor="#b45309"
        />
      </div>

      <p className="text-[10px] text-center text-amber-600 font-mono">
        {content.referral_code}
      </p>
    </div>
  );
}

function UploadMessage({
  content,
  isOwn,
}: {
  content: UploadMessageContent;
  isOwn: boolean;
}) {
  const isPdf = content.file_type === "pdf";
  const isImage = content.file_type === "image";

  return (
    <div
      className={cn(
        "rounded-2xl overflow-hidden",
        isOwn ? "bg-sutra-cyan/5 rounded-br-md" : "bg-muted rounded-bl-md"
      )}
    >
      {/* File preview for images */}
      {isImage && content.file_url && (
        <img
          src={content.file_url}
          alt={content.file_name}
          className="max-w-full h-auto"
        />
      )}

      {/* File info bar */}
      <a
        href={content.file_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 p-2 hover:bg-black/5 transition-colors group"
      >
        <div
          className={cn(
            "h-8 w-8 rounded-lg flex items-center justify-center shrink-0",
            isPdf ? "bg-red-500/10" : "bg-muted"
          )}
        >
          {isPdf ? (
            <FileText className="w-4 h-4 text-red-500" />
          ) : (
            <File className="w-4 h-4 text-muted-foreground" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium truncate">{content.file_name}</p>
          <p className="text-[10px] text-muted-foreground uppercase">
            {content.file_type}
          </p>
        </div>

        <Download className="w-3.5 h-3.5 text-muted-foreground group-hover:text-sutra-cyan transition-colors shrink-0" />
      </a>

      {/* AI extracted text if available */}
      {content.ai_extracted_text && (
        <div className="border-t border-border/50 p-2">
          <p className="text-[10px] font-medium text-sutra-cyan mb-0.5">Summary</p>
          <p className="text-xs">{content.ai_extracted_text}</p>
        </div>
      )}
    </div>
  );
}

