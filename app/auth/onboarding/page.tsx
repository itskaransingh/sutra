import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OnboardingWizard } from "@/components/patient/OnboardingWizard";

export default async function OnboardingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // If already onboarded, redirect to dashboard
  const { data: profile } = await supabase
    .from("users")
    .select("onboarded, full_name, email")
    .eq("id", user.id)
    .single();

  if (profile?.onboarded) {
    redirect("/me");
  }

  return (
    <div className="min-h-screen bg-background">
      <OnboardingWizard
        userId={user.id}
        initialName={profile?.full_name || user.user_metadata?.full_name || ""}
        email={profile?.email || user.email || ""}
      />
    </div>
  );
}
