"use client";

import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { X, Download, Share2 } from "lucide-react";
import { useEffect, useState } from "react";

interface SutraQRProps {
  userId: string;
  onClose?: () => void;
  fullScreen?: boolean;
}

export function SutraQR({ userId, onClose, fullScreen = true }: SutraQRProps) {
  const [qrUrl, setQrUrl] = useState("");

  useEffect(() => {
    // Generate the URL for doctors to scan
    const baseUrl = window.location.origin;
    setQrUrl(`${baseUrl}/${userId}/new`);
  }, [userId]);

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
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(qrUrl);
      alert("Link copied to clipboard!");
    }
  };

  if (!fullScreen) {
    return (
      <div className="flex flex-col items-center">
        <div className="p-4 bg-white rounded-2xl sutra-gradient-border">
          <QRCodeSVG
            value={qrUrl || "loading"}
            size={200}
            level="H"
            includeMargin
            bgColor="#ffffff"
            fgColor="#1e3a5f"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm animate-in fade-in">
      <div className="flex flex-col items-center justify-center min-h-screen px-6 py-8">
        {/* Close Button */}
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4"
            onClick={onClose}
          >
            <X className="w-6 h-6" />
          </Button>
        )}

        {/* Logo */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold sutra-gradient-text">Sutra ID</h1>
        </div>

        {/* QR Code */}
        <div className="relative">
          {/* Gradient border effect */}
          <div className="absolute -inset-1 sutra-gradient rounded-3xl opacity-75 blur-sm" />
          <div className="relative p-6 bg-white rounded-2xl shadow-xl">
            <QRCodeSVG
              value={qrUrl || "loading"}
              size={256}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor="#1e3a5f"
              imageSettings={{
                src: "",
                height: 0,
                width: 0,
                excavate: false,
              }}
            />
          </div>
        </div>

        {/* Instructions */}
        <p className="mt-6 text-center text-muted-foreground max-w-xs">
          Show this QR code to your doctor. They&apos;ll scan it to access your
          medical history and start a consultation session.
        </p>

        {/* Actions */}
        <div className="flex gap-3 mt-8">
          <Button variant="outline" className="gap-2" onClick={handleShare}>
            <Share2 className="w-4 h-4" />
            Share
          </Button>
          <Button
            className="gap-2 bg-sutra-cyan hover:bg-sutra-cyan/90"
            onClick={() => window.print()}
          >
            <Download className="w-4 h-4" />
            Print
          </Button>
        </div>

        {/* Print styles */}
        <style jsx global>{`
          @media print {
            body * {
              visibility: hidden;
            }
            .fixed {
              position: absolute;
              visibility: visible;
            }
            .fixed * {
              visibility: visible;
            }
            button {
              display: none !important;
            }
          }
        `}</style>
      </div>
    </div>
  );
}

