"use server";

import { createClient } from "@/lib/supabase/server";
import type { HealthSnapshot } from "@/lib/types/database";
import { calculateAge } from "@/lib/utils";

export async function createSession(patientId: string, doctorId: string) {
  const supabase = await createClient();

  // Verify doctor is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify doctor record exists and matches
  const { data: doctor } = await supabase
    .from("doctors")
    .select("id, anonymous_id")
    .eq("id", doctorId)
    .single();

  if (!doctor || doctor.anonymous_id !== user.id) {
    return { error: "Invalid doctor" };
  }

  // Get patient data for health snapshot
  const { data: patient } = await supabase
    .from("users")
    .select("full_name, personal_details, medical_profile")
    .eq("id", patientId)
    .single();

  if (!patient) {
    return { error: "Patient not found" };
  }

  // Create health snapshot
  const healthSnapshot: HealthSnapshot = {
    name: patient.full_name || "Patient",
    age: patient.personal_details?.dob
      ? calculateAge(patient.personal_details.dob)
      : 0,
    blood_type: patient.personal_details?.blood_type,
    allergies: patient.medical_profile?.allergies || [],
    chronic_conditions: patient.medical_profile?.chronic_conditions || [],
    current_medications: patient.medical_profile?.current_meds || [],
    emergency_contact: patient.personal_details?.emergency_contact
      ? {
          name: patient.personal_details.emergency_contact.name,
          phone: patient.personal_details.emergency_contact.phone,
        }
      : undefined,
    generated_at: new Date().toISOString(),
  };

  // Create session
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert({
      patient_id: patientId,
      created_by_doctor_id: doctorId,
      health_snapshot: healthSnapshot,
      status: "active",
    })
    .select("id")
    .single();

  if (sessionError || !session) {
    console.error("Session creation error:", sessionError);
    return { error: "Failed to create session" };
  }

  // Add doctor as primary participant
  const { error: participantError } = await supabase
    .from("session_participants")
    .insert({
      session_id: session.id,
      doctor_id: doctorId,
      role: "primary",
    });

  if (participantError) {
    console.error("Participant error:", participantError);
    // Session was created, so continue
  }

  // Create system message for session start
  await supabase.from("messages").insert({
    session_id: session.id,
    sender_type: "system",
    message_type: "system",
    content: {
      event: "session_created",
      actor_name: doctor.id,
      metadata: {
        doctor_id: doctorId,
        patient_id: patientId,
      },
    },
  });

  return { sessionId: session.id };
}

export async function addDoctorToSession(
  sessionId: string,
  doctorId: string,
  referralCode?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // Verify doctor
  const { data: doctor } = await supabase
    .from("doctors")
    .select("id, display_name, anonymous_id")
    .eq("id", doctorId)
    .single();

  if (!doctor || doctor.anonymous_id !== user.id) {
    return { error: "Invalid doctor" };
  }

  // If referral code provided, verify it
  if (referralCode) {
    const { data: referral } = await supabase
      .from("referrals")
      .select("id, session_id, status")
      .eq("referral_code", referralCode)
      .eq("session_id", sessionId)
      .single();

    if (!referral) {
      return { error: "Invalid referral code" };
    }

    if (referral.status === "accepted") {
      // Already accepted, just redirect
      return { success: true };
    }

    // Update referral status
    await supabase
      .from("referrals")
      .update({
        status: "accepted",
        accepted_by_doctor_id: doctorId,
        accepted_at: new Date().toISOString(),
      })
      .eq("id", referral.id);
  }

  // Check if already a participant
  const { data: existingParticipant } = await supabase
    .from("session_participants")
    .select("id")
    .eq("session_id", sessionId)
    .eq("doctor_id", doctorId)
    .single();

  if (!existingParticipant) {
    // Add as participant
    await supabase.from("session_participants").insert({
      session_id: sessionId,
      doctor_id: doctorId,
      role: "referred",
    });

    // Add system message
    await supabase.from("messages").insert({
      session_id: sessionId,
      sender_type: "system",
      message_type: "system",
      content: {
        event: "doctor_joined",
        actor_name: doctor.display_name || "Doctor",
        metadata: {
          doctor_id: doctorId,
          via_referral: !!referralCode,
        },
      },
    });
  }

  return { success: true };
}

