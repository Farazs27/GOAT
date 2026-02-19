'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Stethoscope,
  Shield,
  Heart,
  ArrowRight,
  LogOut,
  Sun,
  Sunset,
  Moon,
  Sparkles,
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

function getGreeting(): { text: string; icon: typeof Sun } {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return { text: 'Goedemorgen', icon: Sun };
  if (hour >= 12 && hour < 18) return { text: 'Goedemiddag', icon: Sunset };
  return { text: 'Goedenavond', icon: Moon };
}

const ROLE_LABELS: Record<string, string> = {
  DENTIST: 'Tandarts',
  PRACTICE_ADMIN: 'Praktijk Admin',
  SUPER_ADMIN: 'Super Admin',
  HYGIENIST: 'Mondhygiënist',
  ASSISTANT: 'Assistent',
  RECEPTIONIST: 'Receptionist',
};

const portals = [
  {
    id: 'dentist',
    title: 'Tandarts Portaal',
    description: 'Agenda, patiënten, behandelingen en declaraties',
    href: '/dashboard',
    icon: Stethoscope,
    roles: null as string[] | null,
    gradient: 'from-blue-500/80 to-cyan-400/80',
    borderHover: 'hover:border-blue-400/40',
    shadowHover: 'hover:shadow-blue-500/20',
    iconBg: 'from-blue-500 to-cyan-500',
    glowColor: 'bg-blue-500/10',
    arrowColor: 'group-hover:text-blue-400',
    ringColor: 'group-hover:ring-blue-500/20',
  },
  {
    id: 'hygienist',
    title: 'Mondhygiënist Portaal',
    description: 'Periodontogram, notities en patiëntoverzicht',
    href: '/hygienist/dashboard',
    icon: Sparkles,
    roles: ['HYGIENIST', 'PRACTICE_ADMIN', 'SUPER_ADMIN', 'DENTIST'],
    gradient: 'from-emerald-500/80 to-teal-400/80',
    borderHover: 'hover:border-emerald-400/40',
    shadowHover: 'hover:shadow-emerald-500/20',
    iconBg: 'from-emerald-500 to-teal-500',
    glowColor: 'bg-emerald-500/10',
    arrowColor: 'group-hover:text-emerald-400',
    ringColor: 'group-hover:ring-emerald-500/20',
  },
  {
    id: 'admin',
    title: 'Admin Portaal',
    description: 'Gebruikersbeheer, audit logs en systeeminstellingen',
    href: '/admin',
    icon: Shield,
    roles: ['PRACTICE_ADMIN', 'SUPER_ADMIN'],
    gradient: 'from-violet-500/80 to-purple-400/80',
    borderHover: 'hover:border-violet-400/40',
    shadowHover: 'hover:shadow-violet-500/20',
    iconBg: 'from-violet-500 to-purple-500',
    glowColor: 'bg-violet-500/10',
    arrowColor: 'group-hover:text-violet-400',
    ringColor: 'group-hover:ring-violet-500/20',
  },
  {
    id: 'patient',
    title: 'Patiënt Portaal',
    description: 'Afspraken, documenten en gezondheidsgegevens',
    href: '/patient-login',
    icon: Heart,
    roles: null as string[] | null,
    gradient: 'from-orange-500/80 to-amber-400/80',
    borderHover: 'hover:border-orange-400/40',
    shadowHover: 'hover:shadow-orange-500/20',
    iconBg: 'from-[#e8945a] to-amber-500',
    glowColor: 'bg-orange-500/10',
    arrowColor: 'group-hover:text-orange-400',
    ringColor: 'group-hover:ring-orange-500/20',
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0a0b14, #0f1120, #0d0f1e, #12091f)' }}>
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  const greeting = getGreeting();
  const GreetingIcon = greeting.icon;
  const availablePortals = portals.filter(
    (p) => !p.roles || p.roles.includes(user.role)
  );
  const roleLabel = ROLE_LABELS[user.role] || user.role?.replace('_', ' ');

  return (
    <>
      <style jsx>{`
        .select-portal-bg {
          background: linear-gradient(160deg, #060714 0%, #0c0e1f 25%, #0a0d1c 50%, #100820 75%, #060714 100%);
          min-height: 100vh;
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(28px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
        }
        .portal-card {
          animation: fadeSlideUp 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .portal-card:nth-child(1) { animation-delay: 0.08s; }
        .portal-card:nth-child(2) { animation-delay: 0.16s; }
        .portal-card:nth-child(3) { animation-delay: 0.24s; }
        .portal-card:nth-child(4) { animation-delay: 0.32s; }
        .header-fade {
          animation: fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .footer-fade {
          animation: fadeIn 0.8s ease 0.5s both;
        }
        .glass-card {
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.04) 0%,
            rgba(255, 255, 255, 0.02) 50%,
            rgba(255, 255, 255, 0.05) 100%
          );
          backdrop-filter: blur(24px) saturate(150%);
          -webkit-backdrop-filter: blur(24px) saturate(150%);
        }
        .glass-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.08) 0%,
            transparent 40%,
            transparent 60%,
            rgba(255, 255, 255, 0.04) 100%
          );
          pointer-events: none;
          z-index: 1;
        }
        .glass-card:hover::before {
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.12) 0%,
            transparent 40%,
            transparent 60%,
            rgba(255, 255, 255, 0.06) 100%
          );
        }
        .icon-glass {
          background: linear-gradient(135deg,
            rgba(255, 255, 255, 0.08) 0%,
            rgba(255, 255, 255, 0.03) 100%
          );
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .shimmer-text {
          background: linear-gradient(110deg,
            rgba(255,255,255,0.5) 0%,
            rgba(255,255,255,0.8) 45%,
            rgba(255,255,255,1) 50%,
            rgba(255,255,255,0.8) 55%,
            rgba(255,255,255,0.5) 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: shimmer 4s linear infinite;
        }
        .orb { animation: breathe 8s ease-in-out infinite; }
        .orb-2 { animation: breathe 10s ease-in-out infinite; animation-delay: 3s; }
        .orb-3 { animation: breathe 12s ease-in-out infinite; animation-delay: 6s; }
      `}</style>

      <div className="select-portal-bg relative overflow-hidden flex flex-col">
        {/* Ambient orbs */}
        <div className="orb absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/[0.06] blur-[120px] pointer-events-none" />
        <div className="orb-2 absolute bottom-[-10%] right-[-5%] w-[450px] h-[450px] rounded-full bg-violet-600/[0.06] blur-[120px] pointer-events-none" />
        <div className="orb-3 absolute top-[40%] left-[50%] translate-x-[-50%] w-[350px] h-[350px] rounded-full bg-teal-500/[0.04] blur-[100px] pointer-events-none" />

        {/* Grain overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat',
        }} />

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">

          {/* Header */}
          <div className="header-fade flex flex-col items-center mb-12">
            {/* Logo */}
            <div className="mb-10">
              <img src="/images/nexiom-logo.png" alt="NEXIOM" className="h-14 w-auto mx-auto opacity-90" />
            </div>

            {/* Greeting */}
            <div className="flex items-center gap-2.5 mb-4">
              <GreetingIcon className="h-5 w-5 text-amber-400/70" />
              <span className="text-sm font-medium text-white/40 tracking-wide">{greeting.text}</span>
            </div>

            {/* User name */}
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-3">
              <span className="shimmer-text">{user.firstName} {user.lastName}</span>
            </h1>

            {/* Role badge */}
            <span className="inline-flex items-center gap-1.5 text-[11px] px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-white/40 font-semibold tracking-[0.15em] uppercase backdrop-blur-sm">
              {roleLabel}
            </span>
          </div>

          {/* Section title */}
          <p className="header-fade text-sm text-white/30 mb-10 font-medium tracking-[0.08em] uppercase">
            Kies een portaal
          </p>

          {/* Portal cards - 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-[680px] w-full">
            {availablePortals.map((portal) => {
              const Icon = portal.icon;

              return (
                <button
                  key={portal.id}
                  onClick={() => router.push(portal.href)}
                  className={`portal-card glass-card group relative rounded-2xl border border-white/[0.07] transition-all duration-500 ease-out cursor-pointer text-left ring-1 ring-transparent ${portal.borderHover} ${portal.shadowHover} ${portal.ringColor} hover:scale-[1.02] hover:bg-white/[0.03]`}
                  style={{ padding: '28px 28px 24px' }}
                >
                  {/* Glow on hover */}
                  <div className={`absolute inset-0 rounded-2xl ${portal.glowColor} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  <div className="relative z-10">
                    {/* Icon with glass background */}
                    <div className="icon-glass w-12 h-12 rounded-xl border border-white/[0.08] flex items-center justify-center mb-5 group-hover:border-white/[0.14] transition-all duration-300">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${portal.iconBg} flex items-center justify-center`}>
                        <Icon className="h-4 w-4 text-white" />
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="text-base font-semibold text-white/85 mb-1.5 tracking-tight group-hover:text-white/95 transition-colors duration-300">
                      {portal.title}
                    </h3>

                    {/* Description */}
                    <p className="text-[13px] text-white/30 mb-5 leading-relaxed group-hover:text-white/40 transition-colors duration-300">
                      {portal.description}
                    </p>

                    {/* CTA */}
                    <div className={`flex items-center gap-1.5 text-xs font-medium text-white/20 ${portal.arrowColor} transition-all duration-300`}>
                      <span>Openen</span>
                      <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="footer-fade relative z-10 flex flex-col items-center gap-3 pb-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-white/25 text-sm font-medium hover:text-red-400/80 hover:bg-white/[0.03] transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </button>
          <p className="text-[11px] text-white/[0.12] font-medium tracking-[0.2em] uppercase">
            Nexiom &copy; 2026
          </p>
        </div>
      </div>
    </>
  );
}
