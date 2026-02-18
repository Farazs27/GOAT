"use client";

import { useState } from "react";
import { MessageSquare, Users } from "lucide-react";
import { PatientMessages, useUnreadCount } from "@/components/hygienist/messaging/patient-messages";
import dynamic from "next/dynamic";

// Lazy load staff chat (reuse dashboard berichten page as staff chat)
const StaffChat = dynamic(
  () => import("@/app/(dashboard)/dashboard/berichten/page"),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30" /></div> }
);

type Tab = "patients" | "team";

export default function HygienistBerichtenPage() {
  const [activeTab, setActiveTab] = useState<Tab>("patients");
  const unreadCount = useUnreadCount();

  const tabs: { key: Tab; label: string; icon: typeof MessageSquare; badge?: number }[] = [
    { key: "patients", label: "Patienten", icon: Users, badge: unreadCount },
    { key: "team", label: "Team", icon: MessageSquare },
  ];

  return (
    <div className="space-y-4 h-[calc(100vh-140px)]">
      {/* Tab Bar */}
      <div className="flex gap-1 p-1 glass-card rounded-2xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${
                activeTab === tab.key
                  ? "bg-white/[0.08] text-[var(--text-primary)]"
                  : "text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge && tab.badge > 0 ? (
                <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-[#e8945a] text-[10px] font-bold text-white px-1">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="h-[calc(100%-56px)]">
        {activeTab === "patients" ? <PatientMessages /> : <StaffChat />}
      </div>
    </div>
  );
}
