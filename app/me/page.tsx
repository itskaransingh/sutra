import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PatientDashboard } from "@/components/patient/PatientDashboard";

export default async function PatientHomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile || !profile.onboarded) {
    redirect("/auth/onboarding");
  }

  // Get recent sessions
  const { data: sessions } = await supabase
    .from("sessions")
    .select(
      `
      id,
      created_at,
      status,
      created_by_doctor_id,
      doctors:created_by_doctor_id (
        display_name,
        specialty
      )
    `
    )
    .eq("patient_id", user.id)
    .order("created_at", { ascending: false })
    .limit(5);

  return (
    <PatientDashboard
      user={profile}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      sessions={(sessions || []) as any}
    />
  );
}
