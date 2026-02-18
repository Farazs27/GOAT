"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  Users,
  Activity,
  FileText,
  MessageSquare,
  Receipt,
  BarChart3,
  Bell,
  ClipboardCheck,
  Send,
  FolderOpen,
  Settings,
  LogOut,
  Menu,
  X,
  ArrowLeftRight,
  Sparkles,
} from "lucide-react";
import Image from "next/image";

const navGroups = [
  {
    label: "Klinisch",
    items: [
      { label: "Dashboard", href: "/hygienist/dashboard", icon: LayoutDashboard },
      { label: "Agenda", href: "/hygienist/agenda", icon: Calendar },
      { label: "Patiënten", href: "/hygienist/patients", icon: Users },
      { label: "Periodontogram", href: "/hygienist/periodontogram", icon: Activity },
      { label: "Klinische Notities", href: "/hygienist/notes", icon: FileText },
    ],
  },
  {
    label: "Communicatie",
    items: [
      { label: "Berichten", href: "/hygienist/berichten", icon: MessageSquare },
    ],
  },
  {
    label: "Administratie",
    items: [
      { label: "Declaratie", href: "/hygienist/billing", icon: Receipt },
      { label: "Rapporten", href: "/hygienist/reports", icon: BarChart3 },
      { label: "Recall", href: "/hygienist/recalls", icon: Bell },
    ],
  },
  {
    label: "Beheer",
    items: [
      { label: "Toestemming", href: "/hygienist/consent", icon: ClipboardCheck },
      { label: "Verwijzingen", href: "/hygienist/referrals", icon: Send },
      { label: "Documenten", href: "/hygienist/documents", icon: FolderOpen },
      { label: "Instellingen", href: "/hygienist/settings", icon: Settings },
    ],
  },
];

const navItems = navGroups.flatMap((g) => g.items);

export default function HygienistLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [userData, setUserData] = useState<any>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem("access_token");
    if (!token) {
      router.push("/login");
      return;
    }
    const userStr = localStorage.getItem("user");
    if (userStr) {
      const user = JSON.parse(userStr);
      setUserData(user);
      // Allow HYGIENIST and staff roles that have access via select-portal
      const allowedRoles = ["HYGIENIST", "DENTIST", "PRACTICE_ADMIN", "SUPER_ADMIN"];
      if (!allowedRoles.includes(user.role)) {
        router.push("/select-portal");
      }
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  const initials = userData
    ? `${(userData.firstName || "")[0] || ""}${(userData.lastName || "")[0] || ""}`
    : "?";

  const isActive = (href: string) => {
    if (href === "/hygienist/dashboard") return pathname === "/hygienist/dashboard";
    return pathname === href || pathname.startsWith(href + "/");
  };

  return (
    <div className="min-h-screen patient-gradient-bg relative overflow-hidden">
      <div className="noise-overlay" />

      <div className="flex min-h-screen relative z-10">
        {/* Desktop Sidebar */}
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
          {/* Logo */}
          <div className="p-6 border-b border-white/[0.06]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden transition-transform duration-300 hover:scale-105 shadow-lg shadow-emerald-500/30">
                <Image src="/images/nexiom-logo-sm.png" alt="Nexiom" width={40} height={40} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-white/90">NEXIOM</span>
                <span className="text-xs block text-white/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Mondhygiënist
                </span>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 overflow-y-auto">
            {navGroups.map((group, gi) => {
              let itemIndex = navGroups.slice(0, gi).reduce((s, g) => s + g.items.length, 0);
              return (
                <div key={group.label}>
                  {gi > 0 && <div className="border-t border-white/10 my-2" />}
                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      const idx = itemIndex++;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 group ${
                            isActive(item.href)
                              ? "text-emerald-400"
                              : "text-white/50 hover:text-white/80"
                          }`}
                          style={{
                            background: isActive(item.href) ? "rgba(52, 211, 153, 0.12)" : "transparent",
                            borderLeft: isActive(item.href) ? "3px solid #34d399" : "3px solid transparent",
                            borderRadius: isActive(item.href) ? "12px" : undefined,
                            marginLeft: isActive(item.href) ? "0" : "3px",
                            opacity: mounted ? 1 : 0,
                            transform: mounted ? "translateX(0)" : "translateX(-10px)",
                            transition: `opacity 0.3s ease ${idx * 50}ms, transform 0.3s ease ${idx * 50}ms, background-color 0.2s, color 0.2s`,
                          }}
                        >
                          <span
                            className={`transition-colors duration-200 ${
                              isActive(item.href) ? "text-emerald-400" : "text-white/40 group-hover:text-white/70"
                            }`}
                          >
                            <Icon className="w-5 h-5" />
                          </span>
                          <span className="tracking-tight">{item.label}</span>
                          {isActive(item.href) && (
                            <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          )}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>

          {/* User Section */}
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
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center p-[2px] transition-transform duration-200 hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #34d399, #10b981)" }}
                >
                  <div className="w-full h-full rounded-[10px] flex items-center justify-center" style={{ background: "#1a1a1a" }}>
                    <span className="text-sm font-bold text-emerald-400">{initials}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-white/90 truncate tracking-tight">
                    {userData?.firstName} {userData?.lastName}
                  </p>
                  <p className="text-xs text-white/30 truncate">{userData?.email}</p>
                </div>
              </div>
              <div className="space-y-1">
                <Link
                  href="/select-portal"
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-white/40 hover:text-emerald-400 hover:bg-emerald-500/[0.08]"
                >
                  <ArrowLeftRight className="w-4 h-4" />
                  Portaal wisselen
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-white/40 hover:text-red-400 hover:bg-red-500/[0.08]"
                >
                  <LogOut className="w-4 h-4" />
                  Uitloggen
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header */}
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
              <div className="w-9 h-9 rounded-lg overflow-hidden shadow-md shadow-emerald-500/30">
                <Image src="/images/nexiom-logo-sm.png" alt="Nexiom" width={36} height={36} className="w-full h-full object-cover" />
              </div>
              <div>
                <span className="font-bold text-white/90 tracking-tight">NEXIOM</span>
                <span className="text-[10px] block text-emerald-400/70">Mondhygiënist</span>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 rounded-xl transition-all duration-200 text-white/50 hover:text-white/80 hover:bg-white/[0.06] active:scale-95"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

          {sidebarOpen && (
            <div className="px-4 pb-4 space-y-1 border-t border-white/[0.06] pt-3" style={{ animation: "slideInUp 0.3s ease forwards" }}>
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive(item.href)
                        ? "text-emerald-400 bg-emerald-500/10"
                        : "text-white/50 hover:text-white/70 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/select-portal"
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-emerald-400 hover:bg-emerald-500/[0.08] transition-all"
              >
                <ArrowLeftRight className="w-4 h-4" />
                Portaal wisselen
              </Link>
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

        {/* Main Content */}
        <main className="flex-1 md:ml-56 lg:ml-72 pt-20 md:pt-0 transition-all duration-300">
          <div className="p-5 md:p-6 lg:p-8 xl:p-10 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
