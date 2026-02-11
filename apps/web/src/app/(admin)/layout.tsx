'use client';

import { ReactNode, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Shield,
  Key,
  Settings,
  Building2,
  ArrowLeft,
  ArrowLeftRight,
  Bell,
  Search,
  Crown,
} from 'lucide-react';

const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Users, label: 'Gebruikers', href: '/admin/users' },
  { icon: Shield, label: 'Audit Logs', href: '/admin/audit-logs' },
  { icon: Key, label: 'API Sleutels', href: '/admin/credentials' },
  { icon: Settings, label: 'Instellingen', href: '/admin/settings' },
  { icon: Building2, label: 'Praktijken', href: '/admin/practices' },
];

export default function AdminLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    fetch('/api/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data || (data.role !== 'PRACTICE_ADMIN' && data.role !== 'SUPER_ADMIN')) {
          router.push('/dashboard');
          return;
        }
        setUser(data);
        setLoading(false);
      })
      .catch(() => router.push('/dashboard'));
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400 border-t-transparent"></div>
      </div>
    );
  }

  const initials = user
    ? `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`
    : 'AD';

  return (
    <div className="min-h-screen flex">
      {/* Admin Sidebar */}
      <aside className="w-16 lg:w-64 glass-sidebar hidden md:flex flex-col fixed h-screen z-10 transition-all duration-300" style={{ borderRight: '1px solid rgba(139, 92, 246, 0.15)' }}>
        <div className="p-6 border-b border-violet-500/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-violet-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
              <Crown className="h-4 w-4 text-white" />
            </div>
            <div className="hidden lg:block">
              <span className="font-semibold text-lg text-white/90">DentFlow</span>
              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded-md bg-violet-500/20 text-violet-300 border border-violet-500/20 font-medium uppercase tracking-wider">Admin</span>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="hidden lg:block px-4 pt-4">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
            <input
              type="text"
              placeholder="Zoeken..."
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
            />
          </div>
        </div>
        <div className="lg:hidden flex justify-center pt-3">
          <Search className="h-5 w-5 text-white/30" />
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {adminNavItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 min-h-[44px] ${
                  isActive
                    ? 'bg-violet-500/20 text-violet-300 shadow-lg shadow-violet-500/5'
                    : 'text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                <span className="hidden lg:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Back to portal */}
        <div className="p-4 border-t border-violet-500/10">
          <Link
            href="/select-portal"
            className="flex items-center justify-center lg:justify-start gap-3 px-0 lg:px-3 py-2.5 rounded-xl hover:bg-white/10 transition-all duration-200 group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
              <span className="text-xs font-bold text-white">{initials}</span>
            </div>
            <div className="flex-1 min-w-0 hidden lg:block">
              <p className="text-sm font-medium text-white/90 truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-xs text-violet-300/60 truncate flex items-center gap-1">
                <ArrowLeftRight className="h-3 w-3" />
                Portaal wisselen
              </p>
            </div>
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-h-screen md:ml-16 lg:ml-64 transition-all duration-300">
        <header className="h-16 glass border-b border-violet-500/10 flex items-center justify-between px-6 sticky top-0 z-10">
          <h1 className="text-lg font-semibold text-white/90">Admin Portaal</h1>
          <div className="flex items-center gap-4">
            <button className="relative p-2 rounded-xl hover:bg-white/10 transition-colors">
              <Bell className="h-5 w-5 text-white/60" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violet-400 rounded-full"></span>
            </button>
            <span className="text-sm text-white/50">
              {user?.practice?.name || 'Praktijk'}
            </span>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
