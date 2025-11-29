import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SessionCreator } from "@/components/doctor/SessionCreator";

interface Props {
  params: Promise<{ patientId: string }>;
}

export default async function NewSessionPage({ params }: Props) {
  const { patientId } = await params;
  const supabase = await createClient();

  // Get current user (may be patient or anonymous doctor)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // If authenticated patient visiting their own QR, redirect to dashboard
  if (user && !user.is_anonymous && user.id === patientId) {
    redirect("/me");
  }

  // Verify the patient exists
  const { data: patient, error: patientError } = await supabase
    .from("users")
    .select("id, full_name, personal_details, medical_profile, onboarded")
    .eq("id", patientId)
    .single();

  if (patientError || !patient || !patient.onboarded) {
    // Invalid patient ID
    redirect("/?error=invalid_patient");
  }

  // If user is already authenticated as anonymous (returning doctor)
  if (user?.is_anonymous) {
    // Check if doctor exists
    const { data: doctor } = await supabase
      .from("doctors")
      .select("id, display_name")
      .eq("anonymous_id", user.id)
      .single();

    if (doctor) {
      // Create session and redirect
      return (
        <SessionCreator
          patientId={patientId}
          patientName={patient.full_name || "Patient"}
          doctorId={doctor.id}
          doctorName={doctor.display_name}
          needsAuth={false}
          needsName={!doctor.display_name}
        />
      );
    }
  }

  // New doctor needs to authenticate anonymously and enter name
  return (
    <SessionCreator
      patientId={patientId}
      patientName={patient.full_name || "Patient"}
      needsAuth={!user?.is_anonymous}
      needsName={true}
    />
  );
}

