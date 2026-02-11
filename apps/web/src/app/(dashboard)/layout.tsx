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
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
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
  { icon: Settings, label: "Instellingen", href: "/settings" },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Desktop & iPad Sidebar - Always visible on md+ */}
      <aside className="w-16 lg:w-[260px] xl:w-[280px] 2xl:w-[300px] bg-[var(--bg-secondary)] border-r border-[var(--border-color)] hidden md:flex flex-col fixed h-screen z-20 transition-all duration-300">
        {/* Logo Section */}
        <div className="p-4 lg:p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-11 lg:h-11 bg-[var(--accent)] rounded-xl flex items-center justify-center shadow-lg shadow-[var(--accent)]/20 flex-shrink-0">
                <span className="text-base lg:text-lg font-bold text-white">
                  DF
                </span>
              </div>
              <span className="font-semibold text-base lg:text-lg text-[var(--text-primary)] hidden lg:inline">
                DentFlow
              </span>
            </div>
            <div className="hidden lg:block">
              <ThemeToggle />
            </div>
          </div>
        </div>

        {/* Search - Hidden on collapsed sidebar */}
        <div className="hidden lg:block px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Zoeken..."
              className="w-full glass-input rounded-xl pl-9 pr-3 py-3 text-sm outline-none"
            />
          </div>
        </div>
        {/* Search icon only on collapsed sidebar */}
        <div className="lg:hidden flex justify-center pt-3">
          <div className="p-2.5 rounded-xl text-[var(--text-muted)]">
            <Search className="h-5 w-5" />
          </div>
        </div>

        {/* Navigation - Touch optimized */}
        <nav className="flex-1 p-3 lg:p-4 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-4 py-3 lg:py-3.5 rounded-xl text-sm lg:text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all duration-200 min-h-[44px]"
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span className="truncate hidden lg:inline">{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-3 lg:p-4 border-t border-[var(--border-color)]">
          <Link
            href="/select-portal"
            className="flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-4 py-3 rounded-xl hover:bg-[var(--bg-card-hover)] transition-all duration-200 group min-h-[44px]"
          >
            <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
              <span className="text-xs lg:text-sm font-bold text-white">
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

      {/* Mobile Header - Visible only on mobile */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-b border-[var(--border-color)] flex items-center justify-between px-4 z-30">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center">
            <span className="text-sm font-bold text-white">DF</span>
          </div>
          <span className="font-semibold text-[var(--text-primary)]">
            DentFlow
          </span>
        </div>
        <button
          className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors touch-target"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6 text-[var(--text-secondary)]" />
        </button>
      </header>

      {/* Mobile Navigation Drawer */}
      <div className="md:hidden fixed inset-0 z-40 bg-black/50 hidden">
        <div className="absolute right-0 top-0 bottom-0 w-72 bg-[var(--bg-secondary)]">
          <div className="flex items-center justify-between p-4 border-b border-[var(--border-color)]">
            <span className="font-semibold text-[var(--text-primary)]">
              Menu
            </span>
            <button className="p-2 rounded-xl hover:bg-[var(--bg-card-hover)] touch-target">
              <X className="h-5 w-5" />
            </button>
          </div>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 px-4 py-4 rounded-xl text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all touch-target"
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-16 lg:ml-[260px] xl:ml-[280px] 2xl:ml-[300px] pt-16 md:pt-0 transition-all duration-300">
        {/* Desktop Header */}
        <header className="hidden md:flex h-16 lg:h-[72px] bg-[var(--bg-card)] border-b border-[var(--border-color)] items-center justify-between px-4 lg:px-8 sticky top-0 z-10">
          <h1 className="text-lg lg:text-xl font-semibold text-[var(--text-primary)]">
            Dashboard
          </h1>
          <div className="flex items-center gap-3 lg:gap-6">
            <button className="relative p-2.5 lg:p-3 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors touch-target min-h-[44px] min-w-[44px]">
              <Bell className="h-5 w-5 lg:h-6 lg:w-6 text-[var(--text-secondary)]" />
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-[var(--accent)] rounded-full"></span>
            </button>
            <span className="text-sm lg:text-base text-[var(--text-tertiary)] hidden sm:block">
              Tandartspraktijk Amsterdam
            </span>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto smooth-scroll">
          <div className="max-w-7xl mx-auto">{children}</div>
        </div>
      </main>

      <AiChat />
    </div>
  );
}
