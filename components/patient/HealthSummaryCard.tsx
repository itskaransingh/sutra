"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { User } from "@/lib/types/database";
import {
  Heart,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Pill,
  Droplets,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthSummaryCardProps {
  user: User;
  defaultExpanded?: boolean;
}

export function HealthSummaryCard({
  user,
  defaultExpanded = false,
}: HealthSummaryCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const allergies = user.medical_profile?.allergies || [];
  const conditions = user.medical_profile?.chronic_conditions || [];
  const medications = user.medical_profile?.current_meds || [];
  const bloodType = user.personal_details?.blood_type;

  const hasData = allergies.length > 0 || conditions.length > 0 || medications.length > 0;

  return (
    <Card className="overflow-hidden">
      <CardHeader
        className="pb-2 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Heart className="w-4 h-4 text-sutra-cyan" />
            Health Summary
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Always visible quick info */}
        <div className="flex items-center gap-2 flex-wrap">
          {bloodType && bloodType !== "unknown" && (
            <Badge variant="info" className="gap-1">
              <Droplets className="w-3 h-3" />
              {bloodType}
            </Badge>
          )}
          {allergies.length > 0 && (
            <Badge variant="destructive" className="gap-1 bg-red-100 text-red-700">
              <AlertTriangle className="w-3 h-3" />
              {allergies.length} {allergies.length === 1 ? "Allergy" : "Allergies"}
            </Badge>
          )}
          {conditions.length > 0 && (
            <Badge variant="warning" className="gap-1">
              {conditions.length} {conditions.length === 1 ? "Condition" : "Conditions"}
            </Badge>
          )}
          {medications.length > 0 && (
            <Badge variant="secondary" className="gap-1">
              <Pill className="w-3 h-3" />
              {medications.length} {medications.length === 1 ? "Med" : "Meds"}
            </Badge>
          )}
        </div>

        {/* Expanded details */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            expanded ? "max-h-96 mt-4" : "max-h-0"
          )}
        >
          {!hasData ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No medical information recorded yet
            </p>
          ) : (
            <div className="space-y-4">
              {allergies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 text-red-500" />
                    ALLERGIES
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {allergies.map((allergy) => (
                      <Badge
                        key={allergy}
                        variant="destructive"
                        className="bg-red-100 text-red-700"
                      >
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {conditions.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">
                    CHRONIC CONDITIONS
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {conditions.map((condition) => (
                      <Badge
                        key={condition}
                        variant="warning"
                        className="bg-amber-100 text-amber-700"
                      >
                        {condition}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {medications.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                    <Pill className="w-3 h-3" />
                    CURRENT MEDICATIONS
                  </p>
                  <div className="space-y-1">
                    {medications.map((med, index) => (
                      <div
                        key={index}
                        className="text-sm bg-muted/50 rounded-lg px-3 py-2"
                      >
                        <span className="font-medium">{med.name}</span>
                        {(med.dosage || med.frequency) && (
                          <span className="text-muted-foreground">
                            {" "}
                            • {med.dosage}
                            {med.frequency && ` • ${med.frequency}`}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

