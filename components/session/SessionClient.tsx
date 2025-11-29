"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { PageHeader } from "@/components/shared/PageHeader";
import { HealthStateCard } from "@/components/session/HealthStateCard";
import { MessageList } from "@/components/session/MessageList";
import { MessageInput } from "@/components/session/MessageInput";
import { Button } from "@/components/ui/button";
import type { Message, Session, User, Doctor, SessionParticipant } from "@/lib/types/database";
import { UserPlus } from "lucide-react";

interface SessionWithRelations extends Session {
  patient: User;
  created_by_doctor: Doctor | null;
  participants: (SessionParticipant & { doctor: Doctor })[];
}

interface SessionClientProps {
  session: SessionWithRelations;
  messages: Message[];
  currentUserId: string;
  isPatient: boolean;
  currentDoctorId: string | null;
  currentDoctorName: string | null;
}

export function SessionClient({
  session,
  messages: initialMessages,
  currentUserId,
  isPatient,
  currentDoctorId,
  currentDoctorName,
}: SessionClientProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [showReferral, setShowReferral] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`session-${session.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `session_id=eq.${session.id}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicates
            if (prev.some((m) => m.id === newMessage.id)) {
              return prev;
            }
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session.id, supabase]);

  const handleNewMessage = (message: Message) => {
    // Optimistic update - message will also come via real-time
    setMessages((prev) => {
      if (prev.some((m) => m.id === message.id)) {
        return prev;
      }
      return [...prev, message];
    });
  };

  const doctorNames = session.participants
    ?.map((p) => p.doctor?.display_name)
    .filter(Boolean)
    .join(", ");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <PageHeader
        title={isPatient ? doctorNames || "Doctor" : session.patient?.full_name || "Patient"}
        subtitle={isPatient ? "Session" : `Session #${session.id.slice(0, 8)}`}
        backHref={isPatient ? "/me" : "/doctor"}
        actions={
          !isPatient && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowReferral(true)}
              title="Create Referral"
            >
              <UserPlus className="w-5 h-5" />
            </Button>
          )
        }
      />

      {/* Health State Card (for doctors) */}
      {!isPatient && session.health_snapshot && (
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="max-w-2xl mx-auto">
            <HealthStateCard healthSnapshot={session.health_snapshot} />
          </div>
        </div>
      )}

      {/* Messages */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-2xl mx-auto">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
            isPatient={isPatient}
            currentDoctorId={currentDoctorId}
            participants={session.participants}
          />
          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Message Input */}
      <div className="border-t bg-background safe-bottom">
        <div className="max-w-2xl mx-auto">
          <MessageInput
            sessionId={session.id}
            senderId={isPatient ? currentUserId : currentDoctorId!}
            senderType={isPatient ? "patient" : "doctor"}
            onMessageSent={handleNewMessage}
          />
        </div>
      </div>

      {/* Referral Modal */}
      {showReferral && (
        <CreateReferralModal
          sessionId={session.id}
          patientId={session.patient_id}
          doctorId={currentDoctorId!}
          onClose={() => setShowReferral(false)}
          onCreated={handleNewMessage}
        />
      )}
    </div>
  );
}

// Inline referral modal for now
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Loader2, QrCode } from "lucide-react";
import { createReferral } from "@/app/actions/referral";

function CreateReferralModal({
  sessionId,
  patientId,
  doctorId,
  onClose,
  onCreated,
}: {
  sessionId: string;
  patientId: string;
  doctorId: string;
  onClose: () => void;
  onCreated: (message: Message) => void;
}) {
  const [specialty, setSpecialty] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await createReferral(sessionId, doctorId, specialty, notes);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.message) {
        onCreated(result.message);
      }
      onClose();
    } catch (err) {
      setError("Failed to create referral");
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Create Referral</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="specialty">Refer to Specialty</Label>
            <Input
              id="specialty"
              placeholder="e.g., Cardiology, Surgery, ENT"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes for the specialist</Label>
            <Textarea
              id="notes"
              placeholder="Brief summary of findings and reason for referral..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            className="w-full bg-sutra-cyan hover:bg-sutra-cyan/90"
            onClick={handleCreate}
            disabled={isLoading || !specialty}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <QrCode className="w-4 h-4 mr-2" />
                Create Referral QR
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

