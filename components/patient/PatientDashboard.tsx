"use client";

import { useState } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { HealthSummaryCard } from "@/components/patient/HealthSummaryCard";
import { SutraQR } from "@/components/patient/SutraQR";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/lib/types/database";
import {
  QrCode,
  Clock,
  MessageSquare,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";

interface SessionData {
  id: string;
  created_at: string;
  status: string;
  doctors: { display_name?: string; specialty?: string } | { display_name?: string; specialty?: string }[] | null;
}

interface PatientDashboardProps {
  user: User;
  sessions: SessionData[];
}

export function PatientDashboard({ user, sessions }: PatientDashboardProps) {
  const [showQR, setShowQR] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <header className="px-4 pt-6 pb-4">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Welcome back,</p>
            <h1 className="text-xl font-semibold">{user.full_name || "Patient"}</h1>
          </div>
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-gradient-to-br from-sutra-cyan to-sutra-emerald text-white">
              {user.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
        </div>
      </header>

      <main className="px-4 space-y-4 max-w-md mx-auto">
        {/* QR Code Button */}
        <Card
          className="sutra-gradient-border cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => setShowQR(true)}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-sutra-cyan to-sutra-emerald flex items-center justify-center">
              <QrCode className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold">Show Sutra ID</p>
              <p className="text-sm text-muted-foreground">
                Let doctors scan to access your history
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </CardContent>
        </Card>

        {/* Health Summary */}
        <HealthSummaryCard user={user} />

        {/* Recent Sessions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-sutra-cyan" />
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {sessions.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No sessions yet</p>
                <p className="text-xs">
                  Show your QR code to a doctor to start
                </p>
              </div>
            ) : (
              sessions.map((session) => {
                const doctor = Array.isArray(session.doctors) 
                  ? session.doctors[0] 
                  : session.doctors;
                return (
                  <Link
                    key={session.id}
                    href={`/${user.id}/${session.id}`}
                    className="block"
                  >
                    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-gradient-to-br from-sutra-cyan to-sutra-blue text-white">
                          {doctor?.display_name?.charAt(0) || "D"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {doctor?.display_name || "Doctor"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {doctor?.specialty || "General"}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={
                            session.status === "active" ? "success" : "secondary"
                          }
                          className="text-xs"
                        >
                          {session.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(session.created_at)}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/me/meds">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mx-auto mb-2">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <p className="text-sm font-medium">Medicine Tracker</p>
                <p className="text-xs text-muted-foreground">
                  Track your medications
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link href="/me/copilot">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mx-auto mb-2">
                  <MessageSquare className="w-5 h-5 text-cyan-600" />
                </div>
                <p className="text-sm font-medium">AI Copilot</p>
                <p className="text-xs text-muted-foreground">
                  Ask about your health
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </main>

      {/* Bottom Navigation */}
      <BottomNav variant="patient" />

      {/* QR Modal */}
      {showQR && (
        <SutraQR userId={user.id} onClose={() => setShowQR(false)} />
      )}
    </div>
  );
}

