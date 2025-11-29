import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BottomNav } from "@/components/shared/BottomNav";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pill, CheckCircle2, Circle } from "lucide-react";

export default async function MedsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  // Get medicine todos
  const { data: meds } = await supabase
    .from("medicine_todos")
    .select("*")
    .eq("patient_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Get user's current meds from profile
  const { data: profile } = await supabase
    .from("users")
    .select("medical_profile")
    .eq("id", user.id)
    .single();

  const profileMeds = profile?.medical_profile?.current_meds || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <PageHeader title="Medications" subtitle="Track your medicines" />

      <main className="px-4 py-4 space-y-4 max-w-md mx-auto">
        {/* Active Prescriptions from Sessions */}
        {meds && meds.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground px-1">
              FROM SESSIONS
            </h2>
            {meds.map((med) => (
              <Card key={med.id}>
                <CardContent className="p-4 flex items-center gap-3">
                  <button className="text-muted-foreground hover:text-sutra-emerald transition-colors">
                    <Circle className="w-6 h-6" />
                  </button>
                  <div className="flex-1">
                    <p className="font-medium">{med.medicine_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {med.dosage}
                      {med.frequency && ` • ${med.frequency}`}
                    </p>
                  </div>
                  {med.duration && (
                    <Badge variant="secondary" className="text-xs">
                      {med.duration}
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Current Meds from Profile */}
        {profileMeds.length > 0 && (
          <div className="space-y-2">
            <h2 className="text-sm font-medium text-muted-foreground px-1">
              YOUR MEDICATIONS
            </h2>
            {profileMeds.map((med: { name: string; dosage?: string; frequency?: string }, index: number) => (
              <Card key={index}>
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Pill className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{med.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {med.dosage || "No dosage specified"}
                      {med.frequency && ` • ${med.frequency}`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {(!meds || meds.length === 0) && profileMeds.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Pill className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No medications tracked</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Medications prescribed during your sessions will appear here
            </p>
          </div>
        )}
      </main>

      <BottomNav variant="patient" />
    </div>
  );
}

