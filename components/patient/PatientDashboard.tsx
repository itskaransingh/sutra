"use client";

import { useState, useEffect, useRef } from "react";
import { BottomNav } from "@/components/shared/BottomNav";
import { HealthSummaryCard } from "@/components/patient/HealthSummaryCard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { User } from "@/lib/types/database";
import {
  Clock,
  MessageSquare,
  Stethoscope,
  Sparkles,
  Share2,
  Download,
} from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "@/lib/utils";
import { QRCodeSVG } from "qrcode.react";

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
  const [qrUrl, setQrUrl] = useState("");
  const qrRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const baseUrl = window.location.origin;
    setTimeout(() => {
      setQrUrl(`${baseUrl}/${user.id}/new`);
    }, 100);
  }, [user.id]);

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "My Sutra ID",
          text: "Scan this QR code to access my medical history",
          url: qrUrl,
        });
      } catch (err) {
        console.log("Share cancelled");
      }
    } else {
      await navigator.clipboard.writeText(qrUrl);
      alert("Link copied to clipboard!");
    }
  };

  const handleDownload = () => {
    const svg = qrRef.current?.querySelector("svg");
    if (!svg) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const data = new XMLSerializer().serializeToString(svg);
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx?.drawImage(img, 0, 0, 512, 512);
      const link = document.createElement("a");
      link.download = "sutra-id.png";
      link.href = canvas.toDataURL("image/png");
      link.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(data)));
  };

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
        {/* Sutra ID QR - Inline Display */}
        <Card className="sutra-gradient-border overflow-hidden">
          <CardContent className="p-0">
            {/* Header with actions */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <div>
                <p className="font-semibold text-sm">Your Sutra ID</p>
                <p className="text-xs text-muted-foreground">Show to doctors</p>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-sutra-cyan"
                  onClick={handleShare}
                >
                  <Share2 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-sutra-cyan"
                  onClick={handleDownload}
                >
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* QR Code with logo */}
            <div className="flex justify-center py-6 bg-gradient-to-b from-sutra-cyan/5 to-transparent">
              <div ref={qrRef} className="relative p-3 bg-white rounded-xl shadow-sm">
                <QRCodeSVG
                  value={qrUrl || "loading"}
                  size={250}
                  level="H"
                  bgColor="#ffffff"
                  fgColor="#0d7377"
                  imageSettings={{
                    src: "/Logo.png",
                    height: 60,
                    width: 60,
                    excavate: true,
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Summary */}
        <HealthSummaryCard user={user} />

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
          <Link href="/me/copilot?prompt=find-doctors">
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center mx-auto mb-2">
                  <Stethoscope className="w-5 h-5 text-cyan-600" />
                </div>
                <p className="text-sm font-medium">Find Doctors</p>
                <p className="text-xs text-muted-foreground">
                  Best specialists for you
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

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

 
      </main>

      {/* Bottom Navigation */}
      <BottomNav variant="patient" />
    </div>
  );
}

