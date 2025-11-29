import { z } from "zod";

export const onboardingSchema = z.object({
  fullName: z.string().min(2, "Name must be at least 2 characters"),
  dob: z.string().optional(),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]).optional(),
  bloodType: z
    .enum(["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"])
    .optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  emergencyContactRelation: z.string().optional(),
  allergies: z.array(z.string()),
  chronicConditions: z.array(z.string()),
  currentMedications: z.array(
    z.object({
      name: z.string(),
      dosage: z.string().optional(),
      frequency: z.string().optional(),
    })
  ),
});

export type OnboardingFormData = z.infer<typeof onboardingSchema>;
