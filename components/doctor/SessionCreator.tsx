"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createSession } from "@/app/actions/session";
import { Loader2, User, Stethoscope } from "lucide-react";

interface SessionCreatorProps {
  patientId: string;
  patientName: string;
  doctorId?: string;
  doctorName?: string | null;
  needsAuth: boolean;
  needsName: boolean;
}

export function SessionCreator({
  patientId,
  patientName,
  doctorId,
  doctorName,
  needsAuth,
  needsName,
}: SessionCreatorProps) {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(doctorName || "");
  const [specialty, setSpecialty] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"auth" | "name" | "creating">(
    needsAuth ? "auth" : needsName ? "name" : "creating"
  );

  // Auto-authenticate if needed
  useEffect(() => {
    if (step === "auth") {
      handleAnonymousAuth();
    } else if (step === "creating" && doctorId) {
      handleCreateSession(doctorId);
    }
  }, [step]);

  const handleAnonymousAuth = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase.auth.signInAnonymously();

      if (error) {
        setError("Failed to authenticate. Please try again.");
        setIsLoading(false);
        return;
      }

      if (data.user) {
        // Move to name entry step
        setStep("name");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
      setIsLoading(false);
    }
  };

  const handleNameSubmit = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Authentication required");
        setStep("auth");
        return;
      }

      // Create or update doctor record
      const { data: existingDoctor } = await supabase
        .from("doctors")
        .select("id")
        .eq("anonymous_id", user.id)
        .single();

      let newDoctorId: string;

      if (existingDoctor) {
        // Update existing doctor
        await supabase
          .from("doctors")
          .update({ display_name: name, specialty: specialty || null })
          .eq("id", existingDoctor.id);
        newDoctorId = existingDoctor.id;
      } else {
        // Create new doctor record
        const { data: newDoctor, error: createError } = await supabase
          .from("doctors")
          .insert({
            anonymous_id: user.id,
            display_name: name,
            specialty: specialty || null,
          })
          .select("id")
          .single();

        if (createError || !newDoctor) {
          setError("Failed to create doctor profile");
          setIsLoading(false);
          return;
        }

        newDoctorId = newDoctor.id;
      }

      // Create the session
      await handleCreateSession(newDoctorId);
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred");
      setIsLoading(false);
    }
  };

  const handleCreateSession = async (docId: string) => {
    setIsLoading(true);
    setStep("creating");

    try {
      const result = await createSession(patientId, docId);

      if (result.error) {
        setError(result.error);
        setIsLoading(false);
        return;
      }

      if (result.sessionId) {
        router.push(`/${patientId}/${result.sessionId}`);
      }
    } catch (err) {
      setError("Failed to create session");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sutra-cyan/20 to-sutra-emerald/20 flex items-center justify-center mx-auto mb-4">
            <Stethoscope className="w-8 h-8 text-sutra-cyan" />
          </div>
          <CardTitle className="text-xl">
            {step === "creating" ? "Starting Session..." : "Start Consultation"}
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            with <span className="font-medium text-foreground">{patientName}</span>
          </p>
        </CardHeader>

        <CardContent>
          {step === "auth" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-sutra-cyan mb-4" />
              <p className="text-sm text-muted-foreground">
                Setting up secure session...
              </p>
            </div>
          )}

          {step === "name" && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                Enter your details to continue
              </p>

              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  placeholder="Dr. Smith"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">
                  Specialty{" "}
                  <span className="text-muted-foreground">(optional)</span>
                </Label>
                <Input
                  id="specialty"
                  placeholder="e.g., General Physician, Cardiologist"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              {error && (
                <p className="text-sm text-destructive text-center">{error}</p>
              )}

              <Button
                className="w-full bg-sutra-cyan hover:bg-sutra-cyan/90"
                onClick={handleNameSubmit}
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Session...
                  </>
                ) : (
                  <>
                    <User className="w-4 h-4 mr-2" />
                    Start Consultation
                  </>
                )}
              </Button>
            </div>
          )}

          {step === "creating" && (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-sutra-cyan mb-4" />
              <p className="text-sm text-muted-foreground">
                Creating consultation session...
              </p>
              {error && (
                <p className="text-sm text-destructive mt-4">{error}</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

