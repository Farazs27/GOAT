"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Home,
  Calendar,
  MessageSquare,
  ClipboardList,
  Receipt,
  FileText,
  ClipboardSignature,
  Bot,
  Heart,
  UserCircle,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import Image from "next/image";

interface BadgeCounts {
  unreadMessages: number;
  unpaidInvoices: number;
  unsignedConsent: number;
}

const navItems = [
  { label: "Home", href: "/portal", icon: Home, badgeKey: null },
  { label: "Afspraken", href: "/portal/appointments", icon: Calendar, badgeKey: null },
  { label: "Berichten", href: "/portal/messages", icon: MessageSquare, badgeKey: "unreadMessages" as const },
  { label: "Behandelplannen", href: "/portal/behandelplan", icon: ClipboardList, badgeKey: null },
  { label: "Facturen", href: "/portal/invoices", icon: Receipt, badgeKey: "unpaidInvoices" as const },
  { label: "Toestemming", href: "/portal/consent", icon: ClipboardSignature, badgeKey: "unsignedConsent" as const },
  { label: "Documenten", href: "/portal/documents", icon: FileText, badgeKey: null },
  { label: "Verzorgingsadvies", href: "/portal/care-notes", icon: Heart, badgeKey: null },
  { label: "Assistent", href: "/portal/assistant", icon: Bot, badgeKey: null },
  { label: "Profiel", href: "/portal/profile", icon: UserCircle, badgeKey: null },
];

export default function PatientPortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [patientData, setPatientData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [badges, setBadges] = useState<BadgeCounts>({ unreadMessages: 0, unpaidInvoices: 0, unsignedConsent: 0 });

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("patient_token");
    if (!token) {
      router.push("/patient-login");
      return;
    }
    const data = localStorage.getItem("patient_data");
    if (data) {
      setPatientData(JSON.parse(data));
    }

    // Fetch badge counts
    fetch("/api/patient-portal/dashboard", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((d) => {
        setBadges((prev) => ({
          ...prev,
          unreadMessages: d.unreadMessages || 0,
          unpaidInvoices: d.unpaidInvoices?.count || 0,
        }));
      })
      .catch(() => {});

    // Fetch unsigned consent count
    fetch("/api/patient-portal/consent", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((forms: any[]) => {
        const unsigned = Array.isArray(forms) ? forms.filter((f) => f.status === "PENDING").length : 0;
        setBadges((prev) => ({ ...prev, unsignedConsent: unsigned }));
      })
      .catch(() => {});
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("patient_token");
    localStorage.removeItem("patient_refresh_token");
    localStorage.removeItem("patient_data");
    router.push("/patient-login");
  };

  const initials = patientData
    ? `${(patientData.firstName || "")[0] || ""}${(patientData.lastName || "")[0] || ""}`
    : "?";

  const isActive = (href: string) => {
    if (href === "/portal") return pathname === "/portal";
    return pathname.startsWith(href);
  };

  const getBadgeCount = (badgeKey: "unreadMessages" | "unpaidInvoices" | "unsignedConsent" | null): number => {
    if (!badgeKey) return 0;
    return badges[badgeKey] || 0;
  };

  return (
    <div className="min-h-screen patient-gradient-bg relative overflow-hidden">
      {/* Subtle noise overlay */}
      <div className="noise-overlay" />

      <div className="flex min-h-screen relative z-10">
        {/* Desktop Sidebar - Premium Glass */}
        <aside
          className="hidden md:flex md:w-56 lg:w-72 flex-col fixed h-screen z-20"
          style={{
            background: "rgba(255, 255, 255, 0.04)",
            backdropFilter: "blur(64px)",
            WebkitBackdropFilter: "blur(64px)",
            borderRight: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "4px 0 24px rgba(0, 0, 0, 0.2)",
            opacity: mounted ? 1 : 0,
            transform: mounted ? "translateX(0)" : "translateX(-20px)",
            transition: "opacity 0.5s ease, transform 0.5s ease",
          }}
        >
          {/* Logo Section */}
          <div className="p-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 shadow-lg shadow-[#e8945a]/30">
                <Image src="/images/nexiom-logo-sm.png" alt="Nexiom" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white/90">
                  NEXIOM
                </span>
                <span className="text-xs block text-white/30">
                  Patientenportaal
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              const badgeCount = getBadgeCount(item.badgeKey);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                    isActive(item.href)
                      ? "text-[#e8945a]"
                      : "text-white/50 hover:text-white/80"
                  }`}
                  style={{
                    background: isActive(item.href)
                      ? "rgba(232, 148, 90, 0.12)"
                      : "transparent",
                    borderLeft: isActive(item.href)
                      ? "3px solid #e8945a"
                      : "3px solid transparent",
                    borderRadius: isActive(item.href) ? "12px" : undefined,
                    marginLeft: isActive(item.href) ? "0" : "3px",
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? "translateX(0)" : "translateX(-10px)",
                    transition: `opacity 0.3s ease ${index * 50}ms, transform 0.3s ease ${index * 50}ms, background-color 0.2s, color 0.2s`,
                  }}
                >
                  <span
                    className={`transition-colors duration-200 ${
                      isActive(item.href)
                        ? "text-[#e8945a]"
                        : "text-white/40 group-hover:text-white/70"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                  </span>
                  <span className="tracking-tight">{item.label}</span>
                  {badgeCount > 0 && (
                    <span className="ml-auto bg-[#e8945a] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                      {badgeCount}
                    </span>
                  )}
                  {badgeCount === 0 && isActive(item.href) && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#e8945a]" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section - Premium Card */}
          <div className="p-4 border-t border-white/[0.06]">
            <div
              className="p-4 rounded-2xl transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.18]"
              style={{
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                backdropFilter: "blur(40px)",
                WebkitBackdropFilter: "blur(40px)",
                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center p-[2px] transition-transform duration-200 hover:scale-105"
                  style={{
                    background: "linear-gradient(135deg, #e8945a, #d4864a)",
                  }}
                >
                  <div
                    className="w-full h-full rounded-[10px] flex items-center justify-center"
                    style={{ background: "#1a1a1a" }}
                  >
                    <span className="text-sm font-bold text-[#e8945a]">
                      {initials}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate tracking-tight">
                    {patientData?.firstName} {patientData?.lastName}
                  </p>
                  <p className="text-xs text-white/30 truncate">
                    {patientData?.email}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-white/40 hover:text-red-400 hover:bg-red-500/[0.08]"
              >
                <LogOut className="w-4 h-4" />
                Uitloggen
              </button>
            </div>
          </div>
        </aside>

        {/* Mobile Header - Premium Glass */}
        <div
          className="md:hidden fixed top-0 left-0 right-0 z-30"
          style={{
            background: "rgba(255, 255, 255, 0.03)",
            backdropFilter: "blur(40px)",
            WebkitBackdropFilter: "blur(40px)",
            borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          }}
        >
          <div className="flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <div
                className="w-9 h-9 rounded-lg overflow-hidden shadow-md shadow-[#e8945a]/30"
              >
                <Image src="/images/nexiom-logo-sm.png" alt="Nexiom" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <span className="font-bold text-white/90 tracking-tight">
                NEXIOM
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl transition-all duration-200 text-white/50 hover:text-white/80 hover:bg-white/[0.06] active:scale-95"
            >
              {sidebarOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Mobile Navigation Dropdown */}
          {sidebarOpen && (
            <div
              className="px-4 pb-4 space-y-1 border-t border-white/[0.06] pt-3"
              style={{
                animation: "slideInUp 0.3s ease forwards",
              }}
            >
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const badgeCount = getBadgeCount(item.badgeKey);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "text-[#e8945a] bg-[#e8945a]/10"
                        : "text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
                    }`}
                    style={{
                      animationDelay: `${index * 30}ms`,
                    }}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                    {badgeCount > 0 && (
                      <span className="ml-auto bg-[#e8945a] text-white text-xs font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center px-1.5">
                        {badgeCount}
                      </span>
                    )}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-red-400 hover:bg-red-500/[0.08] transition-all"
              >
                <LogOut className="w-4 h-4" />
                Uitloggen
              </button>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 md:ml-56 lg:ml-72 pt-20 md:pt-0 transition-all duration-300">
          <div className="p-5 md:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
