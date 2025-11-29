"use client";

import { cn } from "@/lib/utils";
import { Home, Pill, MessageCircle, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  icon: React.ReactNode;
  label: string;
}

interface BottomNavProps {
  variant: "patient" | "doctor";
}

const patientNav: NavItem[] = [
  { href: "/me", icon: <Home className="h-5 w-5" />, label: "Home" },
  { href: "/me/meds", icon: <Pill className="h-5 w-5" />, label: "Meds" },
  {
    href: "/me/copilot",
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Copilot",
  },
];

const doctorNav: NavItem[] = [
  { href: "/doctor", icon: <Users className="h-5 w-5" />, label: "Sessions" },
  {
    href: "/doctor/copilot",
    icon: <MessageCircle className="h-5 w-5" />,
    label: "Copilot",
  },
];

export function BottomNav({ variant }: BottomNavProps) {
  const pathname = usePathname();
  const navItems = variant === "patient" ? patientNav : doctorNav;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-bottom">
      <div className="mx-auto flex h-16 max-w-md items-center justify-around px-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/me" &&
              item.href !== "/doctor" &&
              pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[64px]",
                isActive
                  ? "text-sutra-cyan"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "transition-transform",
                  isActive && "scale-110"
                )}
              >
                {item.icon}
              </div>
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

