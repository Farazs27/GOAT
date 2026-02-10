'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Shield,
  Heart,
  ArrowRight,
  LogOut,
} from 'lucide-react';

interface UserPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
}

function getUserFromToken(): UserPayload | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('access_token');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}

const portals = [
  {
    id: 'dentist',
    title: 'Tandarts Portaal',
    description: 'Agenda, patiënten en behandelingen',
    href: '/dashboard',
    icon: Stethoscope,
    gradient: 'from-blue-400 to-blue-600',
    shadow: 'shadow-blue-500/25',
    glow: 'hover:shadow-blue-500/40',
    border: 'border-blue-500/20 hover:border-blue-400/40',
    iconBg: 'from-blue-400 to-blue-600',
    roles: null, // everyone
  },
  {
    id: 'admin',
    title: 'Admin Portaal',
    description: 'Gebruikers, audit logs en instellingen',
    href: '/admin',
    icon: Shield,
    gradient: 'from-violet-400 to-purple-600',
    shadow: 'shadow-violet-500/25',
    glow: 'hover:shadow-violet-500/40',
    border: 'border-violet-500/20 hover:border-violet-400/40',
    iconBg: 'from-violet-400 to-purple-600',
    roles: ['PRACTICE_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'patient',
    title: 'Patiënt Portaal',
    description: 'Afspraken, documenten en berichten',
    href: '/portal',
    icon: Heart,
    gradient: 'from-teal-400 to-cyan-600',
    shadow: 'shadow-teal-500/25',
    glow: 'hover:shadow-teal-500/40',
    border: 'border-teal-500/20 hover:border-teal-400/40',
    iconBg: 'from-teal-400 to-cyan-600',
    roles: null,
  },
];

export default function SelectPortalPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserPayload | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const u = getUserFromToken();
    if (!u) {
      router.push('/login');
      return;
    }
    setUser(u);
  }, [router]);

  function handleLogout() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    router.push('/login');
  }

  if (!mounted || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #1a1d2e, #16213e, #1a1a2e, #2d1b3d)' }}
      >
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  const initials = `${(user.firstName || '')[0] || ''}${(user.lastName || '')[0] || ''}`.toUpperCase();
  const availablePortals = portals.filter(
    (p) => !p.roles || p.roles.includes(user.role)
  );

  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6 py-12"
      style={{ background: 'linear-gradient(135deg, #1a1d2e, #16213e, #1a1a2e, #2d1b3d)' }}
    >
      {/* Decorative orbs */}
      <div className="absolute top-[-120px] left-[-80px] w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] right-[-60px] w-[350px] h-[350px] rounded-full bg-violet-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-[250px] h-[250px] rounded-full bg-teal-500/8 blur-[100px] pointer-events-none" />

      {/* User info */}
      <div className="relative z-10 flex flex-col items-center mb-12">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-xl shadow-emerald-500/25 mb-5">
          <span className="text-2xl font-bold text-white">{initials}</span>
        </div>
        <h1 className="text-2xl font-bold text-white/90 mb-1">
          {user.firstName} {user.lastName}
        </h1>
        <p className="text-sm text-white/40">{user.email}</p>
        <span className="mt-2 text-[11px] px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-white/50 uppercase tracking-wider font-medium">
          {user.role?.replace('_', ' ')}
        </span>
      </div>

      {/* Title */}
      <h2 className="relative z-10 text-lg font-medium text-white/60 mb-8">
        Kies een portaal
      </h2>

      {/* Portal cards */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 max-w-4xl">
        {availablePortals.map((portal) => (
          <button
            key={portal.id}
            onClick={() => router.push(portal.href)}
            className={`group w-[280px] p-8 rounded-3xl border backdrop-blur-xl bg-white/[0.04] transition-all duration-300 cursor-pointer text-left
              ${portal.border}
              shadow-xl ${portal.shadow}
              ${portal.glow}
              hover:scale-[1.03] hover:bg-white/[0.07]
            `}
          >
            <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${portal.iconBg} flex items-center justify-center shadow-lg mb-6`}>
              <portal.icon className="h-7 w-7 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white/90 mb-2">
              {portal.title}
            </h3>
            <p className="text-sm text-white/40 mb-6 leading-relaxed">
              {portal.description}
            </p>
            <div className="flex items-center gap-2 text-sm font-medium text-white/30 group-hover:text-white/60 transition-colors">
              <span>Openen</span>
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </div>
          </button>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="relative z-10 mt-14 flex items-center gap-2.5 px-6 py-3 rounded-xl backdrop-blur-xl bg-white/[0.04] border border-white/10 text-red-400 text-sm font-medium hover:bg-red-500/10 hover:border-red-500/20 transition-all duration-200 cursor-pointer"
      >
        <LogOut className="h-4 w-4" />
        Uitloggen
      </button>
    </div>
  );
}
