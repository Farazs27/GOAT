"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  CreditCard,
  BarChart3,
  Mail,
  MessageSquare,
  Sparkles,
  Bot,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  icon: LucideIcon;
  label: string;
  href: string;
}

const allNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Patienten", href: "/patients" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: MessageSquare, label: "Berichten", href: "/dashboard/berichten" },
  { icon: Mail, label: "Email", href: "/email" },
  { icon: MessageSquare, label: "WhatsApp", href: "/whatsapp" },
  { icon: FileText, label: "Facturen", href: "/billing" },
  { icon: CreditCard, label: "Betalingen", href: "/payments" },
  { icon: BarChart3, label: "Rapportage", href: "/reports" },
  { icon: Sparkles, label: "Smile Design", href: "/smile-design" },
  { icon: Bot, label: "AI Logs", href: "/dashboard/ai-logs" },
  { icon: Settings, label: "Instellingen", href: "/settings" },
];

const HYGIENIST_HIDDEN = ["/smile-design", "/settings"];

export function RoleNav({ variant }: { variant: "desktop" | "mobile" }) {
  const [items, setItems] = useState(allNavItems);

  useEffect(() => {
    try {
      const userJson = localStorage.getItem("user");
      if (userJson) {
        const user = JSON.parse(userJson);
        if (user.role === "HYGIENIST") {
          setItems(
            allNavItems.filter(
              (item) => !HYGIENIST_HIDDEN.some((h) => item.href.startsWith(h))
            )
          );
          return;
        }
      }
    } catch {
      // fallback to all items
    }
    setItems(allNavItems);
  }, []);

  if (variant === "mobile") {
    return (
      <>
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] transition-all touch-target"
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </Link>
        ))}
      </>
    );
  }

  return (
    <>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className="flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-4 py-3 lg:py-3.5 rounded-2xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] transition-all duration-300 min-h-[44px]"
        >
          <item.icon className="h-5 w-5 flex-shrink-0" />
          <span className="truncate hidden lg:inline">{item.label}</span>
        </Link>
      ))}
    </>
  );
}
