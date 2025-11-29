import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SutraQR } from "@/components/patient/SutraQR";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default async function QRPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Back button */}
      <Link
        href="/me"
        className="absolute top-4 left-4 flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors z-50"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </Link>

      <SutraQR userId={user.id} />
    </div>
  );
}

