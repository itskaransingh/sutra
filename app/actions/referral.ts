"use server";

import { createClient } from "@/lib/supabase/server";
import type { Message, ReferralMessageContent } from "@/lib/types/database";
import { nanoid } from "nanoid";

export async function createReferral(
  sessionId: string,
  doctorId: string,
  targetSpecialty: string,
  notes?: string
): Promise<{ message?: Message; error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify doctor is participant
  const { data: participant } = await supabase
    .from("session_participants")
    .select("id, doctor:doctors(anonymous_id)")
    .eq("session_id", sessionId)
    .eq("doctor_id", doctorId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doctorData = participant?.doctor as any;
  const anonymousId = Array.isArray(doctorData) ? doctorData[0]?.anonymous_id : doctorData?.anonymous_id;
  
  if (!participant || anonymousId !== user.id) {
    return { error: "Unauthorized" };
  }

  // Get session for patient ID
  const { data: session } = await supabase
    .from("sessions")
    .select("patient_id")
    .eq("id", sessionId)
    .single();

  if (!session) {
    return { error: "Session not found" };
  }

  // Generate referral code
  const referralCode = nanoid(6).toUpperCase();

  // Create referral record
  const { data: referral, error: referralError } = await supabase
    .from("referrals")
    .insert({
      session_id: sessionId,
      created_by_doctor_id: doctorId,
      referral_code: referralCode,
      target_specialty: targetSpecialty,
      notes: notes || null,
      status: "pending",
    })
    .select()
    .single();

  if (referralError || !referral) {
    console.error("Referral creation error:", referralError);
    return { error: "Failed to create referral" };
  }

  // Generate QR URL - Use the current origin or a configured base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const qrData = `${baseUrl}/${session.patient_id}/${sessionId}?ref=${referralCode}`;

  const content: ReferralMessageContent = {
    referral_id: referral.id,
    referral_code: referralCode,
    target_specialty: targetSpecialty,
    notes: notes || undefined,
    qr_data: qrData,
  };

  // Create referral message
  const { data: message, error: messageError } = await supabase
    .from("messages")
    .insert({
      session_id: sessionId,
      sender_type: "doctor",
      sender_id: doctorId,
      message_type: "referral",
      content,
    })
    .select()
    .single();

  if (messageError) {
    console.error("Referral message error:", messageError);
    return { error: "Failed to create referral message" };
  }

  return { message };
}

