import { ReactNode } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  Settings,
  CreditCard,
  Bell,
  Search,
  BarChart3,
  ArrowLeftRight,
  Mail,
  MessageSquare,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import AiChat from "@/components/AiChat";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: Users, label: "Patiënten", href: "/patients" },
  { icon: Calendar, label: "Agenda", href: "/agenda" },
  { icon: Mail, label: "Email", href: "/email" },
  { icon: MessageSquare, label: "WhatsApp", href: "/whatsapp" },
  { icon: FileText, label: "Facturen", href: "/billing" },
  { icon: CreditCard, label: "Betalingen", href: "/payments" },
  { icon: BarChart3, label: "Rapportage", href: "/reports" },
  { icon: Sparkles, label: "Smile Design", href: "/smile-design" },
  { icon: Settings, label: "Instellingen", href: "/settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex liquid-glass-bg">
      {/* Ambient floating blobs */}
      <div className="ambient-blob ambient-blob-1" />
      <div className="ambient-blob ambient-blob-2" />
      <div className="ambient-blob ambient-blob-3" />

      {/* Desktop & iPad Sidebar */}
      <aside className="w-16 lg:w-[200px] xl:w-[220px] 2xl:w-[240px] hidden md:flex flex-col fixed h-screen z-20 transition-all duration-300 glass-sidebar">
        {/* Logo Section */}
        <div className="p-4 lg:p-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-11 lg:h-11 rounded-2xl flex items-center justify-center flex-shrink-0 btn-liquid-primary shadow-none">
                <span className="text-base lg:text-lg font-bold">DF</span>
              </div>
              <span className="font-semibold text-base lg:text-lg text-[var(--text-primary)] hidden lg:inline tracking-tight">DentFlow</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="hidden lg:block px-4 pt-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Zoeken..."
              className="w-full glass-input rounded-2xl pl-10 pr-4 py-3 text-sm outline-none"
            />
          </div>
        </div>
        {/* Search icon on collapsed sidebar */}
        <div className="lg:hidden flex justify-center pt-4">
          <div className="p-2.5 rounded-xl text-[var(--text-muted)]">
            <Search className="h-5 w-5" />
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto custom-scrollbar mt-2">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-4 py-3 lg:py-3.5 rounded-2xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] transition-all duration-300 min-h-[44px]"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate hidden lg:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 lg:p-4 border-t border-white/[0.06]">
          <Link
            href="/select-portal"
            className="flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-4 py-3 rounded-2xl hover:bg-white/[0.03] transition-all duration-300 group min-h-[44px]"
          >
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-2xl btn-liquid-primary shadow-none flex items-center justify-center flex-shrink-0">
              <span className="text-xs lg:text-sm font-bold">
                FS
              </span>
            </div>
            <div className="flex-1 min-w-0 hidden lg:block">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                Faraz Sharifi
              </p>
              <p className="text-xs text-[var(--text-tertiary)] truncate flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3" />
                Portaal wisselen
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 glass-sidebar flex items-center justify-between px-4 z-30 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl btn-liquid-primary shadow-none flex items-center justify-center">
            <span className="text-sm font-bold">DF</span>
          </div>
          <span className="font-semibold text-[var(--text-primary)] tracking-tight">DentFlow</span>
        </div>
        <button
          className="p-2 rounded-xl hover:bg-white/[0.04] transition-colors touch-target"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6 text-[var(--text-secondary)]" />
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className="md:hidden fixed inset-0 z-40 bg-black/50 hidden">
        <div className="absolute right-0 top-0 bottom-0 w-72 glass-sidebar">
          <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
            <span className="font-semibold text-[var(--text-primary)]">
              Menu
            </span>
            <button className="p-2 rounded-xl hover:bg-white/[0.04] touch-target">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-4 rounded-2xl text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-white/[0.03] transition-all touch-target"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-16 lg:ml-[200px] xl:ml-[220px] 2xl:ml-[240px] pt-16 md:pt-0 transition-all duration-300">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 lg:h-[72px] items-center justify-between px-6 lg:px-10 sticky top-0 z-10 border-b border-white/[0.04]" style={{ background: 'rgba(14, 12, 10, 0.6)', backdropFilter: 'blur(24px) saturate(140%)', WebkitBackdropFilter: 'blur(24px) saturate(140%)' }}>
          <h1 className="text-lg lg:text-xl font-semibold text-[var(--text-primary)] tracking-tight">
            Dashboard
          </h1>
          <div className="flex items-center gap-4 lg:gap-6">
            <button className="relative p-2.5 lg:p-3 rounded-2xl hover:bg-white/[0.04] transition-all duration-300 touch-target min-h-[44px] min-w-[44px]">
              <Bell className="h-5 w-5 lg:h-5 lg:w-5 text-[var(--text-secondary)]" />
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full" style={{ background: 'linear-gradient(135deg, #F5E6D3, #DCC3A5)', boxShadow: '0 0 8px rgba(245,230,211,0.5)' }}></span>
            </button>
            <span className="text-sm text-[var(--text-tertiary)] hidden sm:block font-medium">
              Tandartspraktijk Amsterdam
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-5 sm:p-8 lg:p-10 overflow-auto smooth-scroll">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      <AiChat />
    </div>
  );
}
