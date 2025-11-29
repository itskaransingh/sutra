"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { PersonalDetails, MedicalProfile } from "@/lib/types/database";

interface OnboardingData {
  fullName: string;
  dob: string;
  gender: string;
  bloodType: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  allergies: string[];
  chronicConditions: string[];
  currentMedications: { name: string; dosage: string; frequency: string }[];
}

export async function saveOnboarding(userId: string, data: OnboardingData) {
  const supabase = await createClient();

  // Verify the user is authenticated and matches
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id !== userId) {
    throw new Error("Unauthorized");
  }

  // Format personal details
  const personalDetails: PersonalDetails = {
    dob: data.dob || undefined,
    gender: data.gender?.toLowerCase().replace(/ /g, "_") as PersonalDetails["gender"],
    blood_type: data.bloodType as PersonalDetails["blood_type"],
    emergency_contact: data.emergencyContactName
      ? {
          name: data.emergencyContactName,
          phone: data.emergencyContactPhone,
          relationship: data.emergencyContactRelation,
        }
      : undefined,
  };

  // Format medical profile
  const medicalProfile: MedicalProfile = {
    allergies: data.allergies.length > 0 ? data.allergies : undefined,
    chronic_conditions:
      data.chronicConditions.length > 0 ? data.chronicConditions : undefined,
    current_meds:
      data.currentMedications.length > 0
        ? data.currentMedications.map((med) => ({
            name: med.name,
            dosage: med.dosage || undefined,
            frequency: med.frequency || undefined,
          }))
        : undefined,
  };

  // Update the user record
  const { error } = await supabase
    .from("users")
    .update({
      full_name: data.fullName,
      personal_details: personalDetails,
      medical_profile: medicalProfile,
      onboarded: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    console.error("Error saving onboarding:", error);
    throw new Error("Failed to save profile");
  }

  redirect("/me");
}

