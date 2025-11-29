import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { SessionClient } from "@/components/session/SessionClient";
import { addDoctorToSession } from "@/app/actions/session";

interface Props {
  params: Promise<{ patientId: string; sessionId: string }>;
  searchParams: Promise<{ ref?: string }>;
}

export default async function SessionPage({ params, searchParams }: Props) {
  const { patientId, sessionId } = await params;
  const { ref: referralCode } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/${patientId}/new`);
  }

  // Fetch session with patient and participants
  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(
      `
      *,
      patient:users!patient_id (
        id,
        full_name,
        personal_details,
        medical_profile
      ),
      created_by_doctor:doctors!created_by_doctor_id (
        id,
        display_name,
        specialty
      ),
      participants:session_participants (
        id,
        doctor_id,
        role,
        joined_at,
        doctor:doctors (
          id,
          display_name,
          specialty,
          anonymous_id
        )
      )
    `
    )
    .eq("id", sessionId)
    .eq("patient_id", patientId)
    .single();

  if (sessionError || !session) {
    notFound();
  }

  // Check if user has access
  const isPatient = user.id === patientId;
  const isDoctor = user.is_anonymous;

  let currentDoctorId: string | null = null;
  let currentDoctorName: string | null = null;
  let hasAccess = isPatient;

  if (isDoctor) {
    // Check if doctor is a participant
    const participant = session.participants?.find(
      (p: { doctor: { anonymous_id: string } | null }) =>
        p.doctor?.anonymous_id === user.id
    );

    if (participant) {
      hasAccess = true;
      currentDoctorId = participant.doctor_id;
      currentDoctorName = participant.doctor?.display_name;
    } else if (referralCode) {
      // Try to join via referral
      const { data: doctor } = await supabase
        .from("doctors")
        .select("id, display_name")
        .eq("anonymous_id", user.id)
        .single();

      if (doctor) {
        const result = await addDoctorToSession(
          sessionId,
          doctor.id,
          referralCode
        );
        if (!result.error) {
          hasAccess = true;
          currentDoctorId = doctor.id;
          currentDoctorName = doctor.display_name;
        }
      }
    }
  }

  if (!hasAccess) {
    redirect(`/${patientId}/new`);
  }

  // Fetch messages
  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  return (
    <SessionClient
      session={session}
      messages={messages || []}
      currentUserId={user.id}
      isPatient={isPatient}
      currentDoctorId={currentDoctorId}
      currentDoctorName={currentDoctorName}
    />
  );
}
