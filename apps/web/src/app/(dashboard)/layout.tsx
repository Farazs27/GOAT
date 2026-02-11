import { ReactNode } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import AiChat from '@/components/AiChat';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Patiënten', href: '/patients' },
  { icon: Calendar, label: 'Agenda', href: '/agenda' },
  { icon: FileText, label: 'Facturen', href: '/billing' },
  { icon: CreditCard, label: 'Betalingen', href: '/payments' },
  { icon: BarChart3, label: 'Rapportage', href: '/reports' },
  { icon: Settings, label: 'Instellingen', href: '/settings' },
];

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex bg-[var(--bg-primary)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--bg-secondary)] border-r border-[var(--border-color)] hidden md:flex flex-col fixed h-screen z-10">
        <div className="p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[var(--accent)] rounded-xl flex items-center justify-center">
                <span className="text-sm font-bold text-white">DF</span>
              </div>
              <span className="font-semibold text-lg text-[var(--text-primary)]">DentFlow</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Search */}
        <div className="px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Zoeken..."
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-card-hover)] transition-all duration-200"
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[var(--border-color)]">
          <Link
            href="/select-portal"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[var(--bg-card-hover)] transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center">
              <span className="text-xs font-bold text-white">FS</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[var(--text-primary)] truncate">Faraz Sharifi</p>
              <p className="text-xs text-[var(--text-tertiary)] truncate flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3" />
                Portaal wisselen
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-64">
        <header className="h-16 bg-[var(--bg-card)] border-b border-[var(--border-color)] flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-[var(--text-primary)]">Dashboard</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-[var(--bg-card-hover)] transition-colors">
              <Bell className="h-5 w-5 text-[var(--text-secondary)]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[var(--accent)] rounded-full"></span>
            </button>
            <span className="text-sm text-[var(--text-tertiary)]">
              Tandartspraktijk Amsterdam
            </span>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
      <AiChat />
    </div>
  );
}
