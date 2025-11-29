"use client";

import { BottomNav } from "@/components/shared/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { Doctor, Session, User, HealthSnapshot } from "@/lib/types/database";
import { Users, Clock, ChevronRight, Stethoscope } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

interface SessionWithPatient extends Session {
  patient: User;
  role: string;
  joined_at: string;
}

interface DoctorDashboardProps {
  doctor: Doctor;
  sessions: SessionWithPatient[];
}

export function DoctorDashboard({ doctor, sessions }: DoctorDashboardProps) {
  const activeSessions = sessions.filter((s) => s.status === "active");
  const pastSessions = sessions.filter((s) => s.status === "closed");

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="px-4 pt-6 pb-4 bg-gradient-to-br from-sutra-cyan/10 to-sutra-emerald/10">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-gradient-to-br from-sutra-cyan to-sutra-blue text-white">
                {doctor.display_name?.charAt(0) || "D"}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-xl font-semibold">
                {doctor.display_name || "Doctor"}
              </h1>
              {doctor.specialty && (
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <Stethoscope className="w-3 h-3" />
                  {doctor.specialty}
                </p>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <Card className="bg-white/80">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-sutra-cyan">
                  {activeSessions.length}
                </p>
                <p className="text-xs text-muted-foreground">Active Sessions</p>
              </CardContent>
            </Card>
            <Card className="bg-white/80">
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-sutra-emerald">
                  {sessions.length}
                </p>
                <p className="text-xs text-muted-foreground">Total Patients</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-6 max-w-md mx-auto">
        {/* Active Sessions */}
        {activeSessions.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <div className="w-2 h-2 bg-sutra-emerald rounded-full animate-pulse" />
              ACTIVE SESSIONS
            </h2>
            <div className="space-y-2">
              {activeSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </section>
        )}

        {/* Past Sessions */}
        {pastSessions.length > 0 && (
          <section>
            <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              PAST SESSIONS
            </h2>
            <div className="space-y-2">
              {pastSessions.map((session) => (
                <SessionCard key={session.id} session={session} />
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {sessions.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="font-medium mb-1">No sessions yet</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              Scan a patient&apos;s Sutra ID to start your first consultation
            </p>
          </div>
        )}
      </main>

      <BottomNav variant="doctor" />
    </div>
  );
}

function SessionCard({ session }: { session: SessionWithPatient }) {
  const healthSnapshot = session.health_snapshot as HealthSnapshot | null;
  const patientAge = healthSnapshot?.age;
  const hasAllergies =
    healthSnapshot?.allergies && healthSnapshot.allergies.length > 0;

  return (
    <Link href={`/${session.patient_id}/${session.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardContent className="p-4 flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback>
              {session.patient?.full_name?.charAt(0) || "P"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-medium truncate">
                {session.patient?.full_name || "Patient"}
              </p>
              {patientAge && (
                <span className="text-xs text-muted-foreground">
                  {patientAge}y
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              {session.role === "referred" && (
                <Badge variant="info" className="text-xs">
                  Referred
                </Badge>
              )}
              {hasAllergies && (
                <Badge variant="destructive" className="text-xs bg-red-100 text-red-700">
                  Allergies
                </Badge>
              )}
            </div>
          </div>
          <div className="text-right shrink-0">
            <Badge
              variant={session.status === "active" ? "success" : "secondary"}
              className="text-xs"
            >
              {session.status}
            </Badge>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(session.joined_at || session.created_at)}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

