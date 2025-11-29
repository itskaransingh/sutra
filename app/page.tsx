import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { LandingPage } from "@/components/patient/LandingPage";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    // Check if anonymous user (doctor)
    if (user.is_anonymous) {
      redirect("/doctor");
    }

    // Check if patient has completed onboarding
    const { data } = await supabase
      .from("users")
      .select("onboarded")
      .eq("id", user.id)
      .single();

    if (!data || data.onboarded !== true) {
      redirect("/auth/onboarding");
    } else {
      redirect("/me");
    }
  }

  return <LandingPage />;
}
