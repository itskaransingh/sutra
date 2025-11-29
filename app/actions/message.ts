"use server";

import { createClient } from "@/lib/supabase/server";
import type { Message, TextMessageContent } from "@/lib/types/database";

export async function sendTextMessage(
  sessionId: string,
  senderId: string,
  senderType: "patient" | "doctor",
  text: string
): Promise<{ message?: Message; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify sender has access to session
  const { data: session } = await supabase
    .from("sessions")
    .select("id, patient_id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { error: "Session not found" };
  }

  // Verify access
  if (senderType === "patient" && session.patient_id !== user.id) {
    return { error: "Unauthorized" };
  }

  if (senderType === "doctor") {
    const { data: participant } = await supabase
      .from("session_participants")
      .select("id, doctor:doctors(anonymous_id)")
      .eq("session_id", sessionId)
      .eq("doctor_id", senderId)
      .single();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doctorData = participant?.doctor as any;
    const anonymousId = Array.isArray(doctorData) ? doctorData[0]?.anonymous_id : doctorData?.anonymous_id;
    
    if (!participant || anonymousId !== user.id) {
      return { error: "Unauthorized" };
    }
  }

  const content: TextMessageContent = { text };

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      sender_type: senderType,
      sender_id: senderId,
      message_type: "text",
      content,
    })
    .select()
    .single();

  if (error) {
    console.error("Message insert error:", error);
    return { error: "Failed to send message" };
  }

  return { message };
}

export async function sendVoiceMessage(
  sessionId: string,
  senderId: string,
  senderType: "patient" | "doctor",
  audioUrl: string,
  durationSeconds: number,
  aiProcessed?: {
    transcription: string;
    summary: string;
    language_detected: string;
    entities: {
      medicines: { name: string; dosage?: string; frequency?: string; duration?: string }[];
      conditions: string[];
      referral?: { specialty: string; doctor_name?: string; condition?: string };
      follow_up?: { condition: string; timeframe: string; action: string };
    };
  }
): Promise<{ message?: Message; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const content = {
    audio_url: audioUrl,
    duration_seconds: durationSeconds,
    transcription: aiProcessed?.transcription,
    language_detected: aiProcessed?.language_detected,
  };

  const { data: message, error } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      sender_type: senderType,
      sender_id: senderId,
      message_type: "voice",
      content,
      ai_processed: aiProcessed || null,
    })
    .select()
    .single();

  if (error) {
    console.error("Voice message insert error:", error);
    return { error: "Failed to send voice message" };
  }

  // If AI extracted medicines, create medicine todos
  if (aiProcessed?.entities?.medicines && aiProcessed.entities.medicines.length > 0) {
    const { data: session } = await supabase
      .from("sessions")
      .select("patient_id")
      .eq("id", sessionId)
      .single();

    if (session) {
      const medicineTodos = aiProcessed.entities.medicines.map((med) => ({
        patient_id: session.patient_id,
        session_id: sessionId,
        message_id: message.id,
        medicine_name: med.name,
        dosage: med.dosage || null,
        frequency: med.frequency || null,
        duration: med.duration || null,
        is_active: true,
      }));

      await supabase.from("medicine_todos").insert(medicineTodos);
    }
  }

  // If AI extracted follow-up, create reminder
  if (aiProcessed?.entities?.follow_up) {
    const { data: session } = await supabase
      .from("sessions")
      .select("patient_id")
      .eq("id", sessionId)
      .single();

    if (session) {
      await supabase.from("follow_up_reminders").insert({
        patient_id: session.patient_id,
        session_id: sessionId,
        message_id: message.id,
        reminder_text: aiProcessed.entities.follow_up.action,
        trigger_condition: aiProcessed.entities.follow_up.condition,
        trigger_value: aiProcessed.entities.follow_up.timeframe,
        is_triggered: false,
      });
    }
  }

  return { message };
}

