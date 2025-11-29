"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { HealthSnapshot } from "@/lib/types/database";
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Pill,
  Droplets,
  Phone,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HealthStateCardProps {
  healthSnapshot: HealthSnapshot;
  defaultExpanded?: boolean;
}

export function HealthStateCard({
  healthSnapshot,
  defaultExpanded = false,
}: HealthStateCardProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  const {
    name,
    age,
    blood_type,
    allergies,
    chronic_conditions,
    current_medications,
    emergency_contact,
  } = healthSnapshot;

  const hasAllergies = allergies && allergies.length > 0;
  const hasConditions = chronic_conditions && chronic_conditions.length > 0;
  const hasMeds = current_medications && current_medications.length > 0;

  return (
    <Card className="bg-gradient-to-r from-sutra-cyan/5 to-sutra-emerald/5 border-sutra-cyan/20">
      <CardContent className="p-3">
        {/* Collapsed view - always visible */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sutra-cyan to-sutra-emerald flex items-center justify-center text-white font-semibold">
            {name.charAt(0)}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold truncate">{name}</p>
              {age > 0 && (
                <span className="text-sm text-muted-foreground">
                  {age}y
                </span>
              )}
              {blood_type && (
                <Badge variant="info" className="text-xs gap-0.5">
                  <Droplets className="w-2.5 h-2.5" />
                  {blood_type}
                </Badge>
              )}
            </div>

            {/* Quick badges */}
            <div className="flex items-center gap-1 mt-1 flex-wrap">
              {hasAllergies && (
                <Badge
                  variant="destructive"
                  className="text-xs bg-red-100 text-red-700 gap-0.5"
                >
                  <AlertTriangle className="w-2.5 h-2.5" />
                  {allergies.length} allerg{allergies.length > 1 ? "ies" : "y"}
                </Badge>
              )}
              {hasConditions && (
                <Badge variant="warning" className="text-xs gap-0.5">
                  {chronic_conditions.length} condition
                  {chronic_conditions.length > 1 ? "s" : ""}
                </Badge>
              )}
              {hasMeds && (
                <Badge variant="secondary" className="text-xs gap-0.5">
                  <Pill className="w-2.5 h-2.5" />
                  {current_medications.length} med
                  {current_medications.length > 1 ? "s" : ""}
                </Badge>
              )}
            </div>
          </div>

          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8">
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Expanded view */}
        <div
          className={cn(
            "overflow-hidden transition-all duration-300",
            expanded ? "max-h-[500px] mt-4" : "max-h-0"
          )}
        >
          <div className="space-y-3 border-t pt-3">
            {/* Allergies */}
            {hasAllergies && (
              <div>
                <p className="text-xs font-medium text-red-600 mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  ALLERGIES
                </p>
                <div className="flex flex-wrap gap-1">
                  {allergies.map((allergy) => (
                    <Badge
                      key={allergy}
                      className="bg-red-100 text-red-700 text-xs"
                    >
                      {allergy}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Chronic Conditions */}
            {hasConditions && (
              <div>
                <p className="text-xs font-medium text-amber-600 mb-1">
                  CHRONIC CONDITIONS
                </p>
                <div className="flex flex-wrap gap-1">
                  {chronic_conditions.map((condition) => (
                    <Badge
                      key={condition}
                      className="bg-amber-100 text-amber-700 text-xs"
                    >
                      {condition}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Current Medications */}
            {hasMeds && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Pill className="w-3 h-3" />
                  CURRENT MEDICATIONS
                </p>
                <div className="space-y-1">
                  {current_medications.map((med, index) => (
                    <div
                      key={index}
                      className="text-sm bg-muted/50 rounded px-2 py-1"
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

            {/* Emergency Contact */}
            {emergency_contact && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                  <Phone className="w-3 h-3" />
                  EMERGENCY CONTACT
                </p>
                <div className="text-sm">
                  <span className="font-medium">{emergency_contact.name}</span>
                  <span className="text-muted-foreground">
                    {" "}
                    • {emergency_contact.phone}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

