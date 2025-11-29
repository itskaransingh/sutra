import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { DoctorDashboard } from "@/components/doctor/DoctorDashboard";

export default async function DoctorPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only allow anonymous users (doctors)
  if (!user || !user.is_anonymous) {
    redirect("/");
  }

  // Get doctor profile
  const { data: doctor } = await supabase
    .from("doctors")
    .select("*")
    .eq("anonymous_id", user.id)
    .single();

  if (!doctor) {
    // No doctor record yet - they need to scan a patient QR first
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sutra-cyan/20 to-sutra-emerald/20 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-sutra-cyan"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold mb-2">Welcome to Sutra</h1>
          <p className="text-muted-foreground mb-6">
            Scan a patient&apos;s Sutra ID QR code to start your first
            consultation session.
          </p>
          <p className="text-sm text-muted-foreground">
            Your session history will appear here after your first consultation.
          </p>
        </div>
      </div>
    );
  }

  // Get doctor's sessions
  const { data: participations } = await supabase
    .from("session_participants")
    .select(
      `
      id,
      role,
      joined_at,
      session:sessions (
        id,
        patient_id,
        status,
        created_at,
        health_snapshot,
        patient:users!patient_id (
          id,
          full_name,
          personal_details
        )
      )
    `
    )
    .eq("doctor_id", doctor.id)
    .order("joined_at", { ascending: false });

  // Extract sessions from participations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sessions = (participations || [])
    .map((p: any) => {
      const session = Array.isArray(p.session) ? p.session[0] : p.session;
      if (!session) return null;
      return {
        ...session,
        role: p.role,
        joined_at: p.joined_at,
      };
    })
    .filter((s: any) => s && s.id);

  return <DoctorDashboard doctor={doctor} sessions={sessions} />;
}

