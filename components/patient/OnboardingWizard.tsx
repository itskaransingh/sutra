"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { defineStepper } from "@stepperize/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { saveOnboarding } from "@/app/actions/onboarding";
import {
  onboardingSchema,
  type OnboardingFormData,
} from "@/lib/validations/onboarding";
import {
  User,
  Heart,
  Pill,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Plus,
  X,
  Loader2,
} from "lucide-react";

const { useStepper, steps } = defineStepper(
  { id: "basic", title: "Basic Info", icon: User },
  { id: "medical", title: "Medical History", icon: Heart },
  { id: "medications", title: "Medications", icon: Pill },
  { id: "review", title: "Review", icon: CheckCircle2 }
);

interface OnboardingWizardProps {
  userId: string;
  initialName: string;
  email: string;
}

const genderOptions = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
  { value: "prefer_not_to_say", label: "Prefer not to say" },
];

const bloodTypeOptions = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];

const commonAllergies = [
  "Penicillin",
  "Peanuts",
  "Shellfish",
  "Latex",
  "Aspirin",
  "Sulfa drugs",
];

const commonConditions = [
  "Diabetes",
  "Hypertension",
  "Asthma",
  "Heart Disease",
  "Thyroid",
];

export function OnboardingWizard({
  userId,
  initialName,
}: OnboardingWizardProps) {
  const stepper = useStepper();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newAllergy, setNewAllergy] = useState("");
  const [newCondition, setNewCondition] = useState("");
  const [newMed, setNewMed] = useState({ name: "", dosage: "", frequency: "" });

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: initialName,
      dob: "",
      gender: undefined,
      bloodType: undefined,
      emergencyContactName: "",
      emergencyContactPhone: "",
      emergencyContactRelation: "",
      allergies: [],
      chronicConditions: [],
      currentMedications: [],
    },
  });

  const allergies = form.watch("allergies");
  const chronicConditions = form.watch("chronicConditions");
  const currentMedications = form.watch("currentMedications");

  const addAllergy = (allergy: string) => {
    if (allergy && !allergies.includes(allergy)) {
      form.setValue("allergies", [...allergies, allergy]);
    }
    setNewAllergy("");
  };

  const removeAllergy = (allergy: string) => {
    form.setValue(
      "allergies",
      allergies.filter((a) => a !== allergy)
    );
  };

  const addCondition = (condition: string) => {
    if (condition && !chronicConditions.includes(condition)) {
      form.setValue("chronicConditions", [...chronicConditions, condition]);
    }
    setNewCondition("");
  };

  const removeCondition = (condition: string) => {
    form.setValue(
      "chronicConditions",
      chronicConditions.filter((c) => c !== condition)
    );
  };

  const addMedication = () => {
    if (newMed.name) {
      form.setValue("currentMedications", [
        ...currentMedications,
        { ...newMed },
      ]);
      setNewMed({ name: "", dosage: "", frequency: "" });
    }
  };

  const removeMedication = (index: number) => {
    form.setValue(
      "currentMedications",
      currentMedications.filter((_, i) => i !== index)
    );
  };

  const handleSubmit = async (data: OnboardingFormData) => {
    setIsSubmitting(true);
    try {
      await saveOnboarding(userId, {
        fullName: data.fullName,
        dob: data.dob || "",
        gender: data.gender || "",
        bloodType: data.bloodType || "",
        emergencyContactName: data.emergencyContactName || "",
        emergencyContactPhone: data.emergencyContactPhone || "",
        emergencyContactRelation: data.emergencyContactRelation || "",
        allergies: data.allergies,
        chronicConditions: data.chronicConditions,
        currentMedications: data.currentMedications.map((m) => ({
          name: m.name,
          dosage: m.dosage || "",
          frequency: m.frequency || "",
        })),
      });
    } catch (error) {
      console.error("Onboarding error:", error);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="px-6 py-4 border-b bg-background">
        <div className="max-w-md mx-auto">
          <h1 className="text-xl font-semibold sutra-gradient-text">Sutra</h1>
          <p className="text-sm text-muted-foreground">Complete your profile</p>
        </div>
      </header>

      {/* Progress Steps */}
      <div className="px-6 py-4 border-b bg-muted/30">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = stepper.current.id === step.id;
              const isCompleted = stepper.all.indexOf(stepper.current) > index;

              return (
                <div key={step.id} className="flex items-center">
                  <div
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-full transition-all",
                      isActive && "bg-sutra-cyan text-white",
                      isCompleted && "bg-sutra-emerald text-white",
                      !isActive && !isCompleted && "bg-muted text-muted-foreground"
                    )}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={cn(
                        "w-8 h-0.5 mx-1",
                        isCompleted ? "bg-sutra-emerald" : "bg-muted"
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-sm font-medium mt-3 text-center">
            {stepper.current.title}
          </p>
        </div>
      </div>

      {/* Content */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex-1 flex flex-col"
        >
          <main className="flex-1 px-6 py-6 overflow-auto">
            <div className="max-w-md mx-auto space-y-6">
              {/* Step 1: Basic Info */}
              {stepper.when("basic", () => (
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your full name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dob"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {genderOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bloodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select blood type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {bloodTypeOptions.map((option) => (
                              <SelectItem key={option} value={option}>
                                {option === "unknown" ? "Unknown" : option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Card className="bg-muted/50">
                    <CardContent className="pt-4 space-y-3">
                      <p className="text-sm font-medium">Emergency Contact</p>
                      <FormField
                        control={form.control}
                        name="emergencyContactName"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Contact Name" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emergencyContactPhone"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Phone Number"
                                type="tel"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="emergencyContactRelation"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input
                                placeholder="Relationship (e.g., Spouse, Parent)"
                                {...field}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </CardContent>
                  </Card>
                </div>
              ))}

              {/* Step 2: Medical History */}
              {stepper.when("medical", () => (
                <div className="space-y-6">
                  {/* Allergies */}
                  <div className="space-y-3">
                    <FormLabel>Known Allergies</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {commonAllergies.map((allergy) => (
                        <Badge
                          key={allergy}
                          variant={
                            allergies.includes(allergy) ? "default" : "outline"
                          }
                          className={cn(
                            "cursor-pointer transition-all",
                            allergies.includes(allergy) &&
                              "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"
                          )}
                          onClick={() => {
                            if (allergies.includes(allergy)) {
                              removeAllergy(allergy);
                            } else {
                              addAllergy(allergy);
                            }
                          }}
                        >
                          {allergy}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add other allergy"
                        value={newAllergy}
                        onChange={(e) => setNewAllergy(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addAllergy(newAllergy))
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => addAllergy(newAllergy)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    {allergies.filter((a) => !commonAllergies.includes(a)).length >
                      0 && (
                      <div className="flex flex-wrap gap-1">
                        {allergies
                          .filter((a) => !commonAllergies.includes(a))
                          .map((allergy) => (
                            <Badge key={allergy} variant="secondary" className="gap-1">
                              {allergy}
                              <X
                                className="w-3 h-3 cursor-pointer"
                                onClick={() => removeAllergy(allergy)}
                              />
                            </Badge>
                          ))}
                      </div>
                    )}
                  </div>

                  {/* Chronic Conditions */}
                  <div className="space-y-3">
                    <FormLabel>Chronic Conditions</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {commonConditions.map((condition) => (
                        <Badge
                          key={condition}
                          variant={
                            chronicConditions.includes(condition)
                              ? "default"
                              : "outline"
                          }
                          className={cn(
                            "cursor-pointer transition-all",
                            chronicConditions.includes(condition) &&
                              "bg-amber-100 text-amber-700 hover:bg-amber-200 border-amber-200"
                          )}
                          onClick={() => {
                            if (chronicConditions.includes(condition)) {
                              removeCondition(condition);
                            } else {
                              addCondition(condition);
                            }
                          }}
                        >
                          {condition}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Add other condition"
                        value={newCondition}
                        onChange={(e) => setNewCondition(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" && (e.preventDefault(), addCondition(newCondition))
                        }
                      />
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => addCondition(newCondition)}
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Step 3: Medications */}
              {stepper.when("medications", () => (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Add any medications you&apos;re currently taking. You can skip
                    this step if you prefer.
                  </p>

                  {currentMedications.length > 0 && (
                    <div className="space-y-2">
                      {currentMedications.map((med, index) => (
                        <Card key={index} className="bg-muted/50">
                          <CardContent className="p-3 flex items-center justify-between">
                            <div>
                              <p className="font-medium">{med.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {med.dosage} • {med.frequency}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeMedication(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}

                  <Card>
                    <CardContent className="pt-4 space-y-3">
                      <Input
                        placeholder="Medicine name"
                        value={newMed.name}
                        onChange={(e) =>
                          setNewMed({ ...newMed, name: e.target.value })
                        }
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <Input
                          placeholder="Dosage (e.g., 500mg)"
                          value={newMed.dosage}
                          onChange={(e) =>
                            setNewMed({ ...newMed, dosage: e.target.value })
                          }
                        />
                        <Input
                          placeholder="Frequency (e.g., Twice daily)"
                          value={newMed.frequency}
                          onChange={(e) =>
                            setNewMed({ ...newMed, frequency: e.target.value })
                          }
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={addMedication}
                        disabled={!newMed.name}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add Medication
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              ))}

              {/* Step 4: Review */}
              {stepper.when("review", () => {
                const values = form.getValues();
                return (
                  <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                      Please review your information before completing your
                      profile.
                    </p>

                    <Card>
                      <CardContent className="pt-4 space-y-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Name</p>
                          <p className="font-medium">
                            {values.fullName || "Not provided"}
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Date of Birth
                            </p>
                            <p className="font-medium">
                              {values.dob || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Blood Type
                            </p>
                            <p className="font-medium">
                              {values.bloodType || "Not provided"}
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium">
                            {genderOptions.find((g) => g.value === values.gender)
                              ?.label || "Not provided"}
                          </p>
                        </div>
                      </CardContent>
                    </Card>

                    {allergies.length > 0 && (
                      <Card className="border-red-200 bg-red-50/50">
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium text-red-700 mb-2">
                            Allergies
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {allergies.map((allergy) => (
                              <Badge
                                key={allergy}
                                className="bg-red-100 text-red-700"
                              >
                                {allergy}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {chronicConditions.length > 0 && (
                      <Card className="border-amber-200 bg-amber-50/50">
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium text-amber-700 mb-2">
                            Chronic Conditions
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {chronicConditions.map((condition) => (
                              <Badge
                                key={condition}
                                className="bg-amber-100 text-amber-700"
                              >
                                {condition}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {currentMedications.length > 0 && (
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium mb-2">
                            Current Medications
                          </p>
                          <div className="space-y-2">
                            {currentMedications.map((med, index) => (
                              <div key={index} className="text-sm">
                                <span className="font-medium">{med.name}</span>
                                <span className="text-muted-foreground">
                                  {" "}
                                  • {med.dosage} • {med.frequency}
                                </span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {values.emergencyContactName && (
                      <Card>
                        <CardContent className="pt-4">
                          <p className="text-sm font-medium mb-2">
                            Emergency Contact
                          </p>
                          <p className="text-sm">
                            {values.emergencyContactName} (
                            {values.emergencyContactRelation})
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {values.emergencyContactPhone}
                          </p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                );
              })}
            </div>
          </main>

          {/* Footer Navigation */}
          <footer className="px-6 py-4 border-t bg-background safe-bottom">
            <div className="max-w-md mx-auto flex gap-3">
              {!stepper.isFirst && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => stepper.prev()}
                  disabled={isSubmitting}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Back
                </Button>
              )}
              {stepper.isLast ? (
                <Button
                  type="submit"
                  className="flex-1 bg-sutra-emerald hover:bg-sutra-emerald/90"
                  disabled={isSubmitting || !form.getValues().fullName}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete Profile
                      <CheckCircle2 className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  className="flex-1 bg-sutra-cyan hover:bg-sutra-cyan/90"
                  onClick={() => stepper.next()}
                >
                  Continue
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>
          </footer>
        </form>
      </Form>
    </div>
  );
}
