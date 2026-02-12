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
    description: 'Agenda, patiënten, behandelingen en meer',
    href: '/dashboard',
    icon: Stethoscope,
    roles: null as string[] | null,
  },
  {
    id: 'admin',
    title: 'Admin Portaal',
    description: 'Gebruikersbeheer, audit logs en systeeminstellingen',
    href: '/admin',
    icon: Shield,
    roles: ['PRACTICE_ADMIN', 'SUPER_ADMIN'],
  },
  {
    id: 'patient',
    title: 'Patiënt Portaal',
    description: 'Uw afspraken, documenten en gezondheidsgegevens',
    href: '/patient-login',
    icon: Heart,
    roles: null as string[] | null,
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
      <div className="select-portal-bg min-h-screen flex items-center justify-center">
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
          background: linear-gradient(135deg, #0a0b14, #0f1120, #0d0f1e, #12091f);
          background-size: 400% 400%;
          animation: gradientShift 15s ease infinite;
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes fadeSlideUp {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes floatIcon {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        .portal-card {
          animation: fadeSlideUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .portal-card:nth-child(1) { animation-delay: 0.1s; }
        .portal-card:nth-child(2) { animation-delay: 0.25s; }
        .portal-card:nth-child(3) { animation-delay: 0.4s; }
        .portal-card:hover .portal-icon {
          animation: floatIcon 2s ease-in-out infinite;
        }
        .portal-card:hover .portal-arrow {
          transform: translateX(4px);
        }
        .header-fade {
          animation: fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .footer-fade {
          animation: fadeIn 0.8s ease 0.6s both;
        }
        .noise-overlay {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
          background-repeat: repeat;
        }
      `}</style>

      <div className="select-portal-bg min-h-screen relative overflow-hidden flex flex-col">
        {/* Noise texture overlay */}
        <div className="noise-overlay absolute inset-0 z-0 pointer-events-none" />

        {/* Ambient glow orbs */}
        <div className="absolute top-[-200px] left-[-150px] w-[600px] h-[600px] rounded-full bg-blue-600/[0.07] blur-[150px] pointer-events-none" />
        <div className="absolute bottom-[-150px] right-[-100px] w-[500px] h-[500px] rounded-full bg-violet-600/[0.07] blur-[150px] pointer-events-none" />
        <div className="absolute top-[30%] right-[10%] w-[400px] h-[400px] rounded-full bg-teal-600/[0.05] blur-[130px] pointer-events-none" />

        {/* Main content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16">

          {/* Header / Logo + greeting */}
          <div className="header-fade flex flex-col items-center mb-14">
            {/* Logo */}
            <div className="mb-8">
              <img src="/images/nexiom-logo-md.png" alt="NEXIOM" className="h-16 w-auto mx-auto" />
            </div>

            {/* Greeting */}
            <div className="flex items-center gap-2 mb-3">
              <GreetingIcon className="h-5 w-5 text-amber-400/80" />
              <span className="text-sm font-medium text-white/50">{greeting.text}</span>
            </div>

            {/* User name */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight mb-2">
              {user.firstName} {user.lastName}
            </h1>

            {/* Role badge */}
            <span className="mt-1 inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-white/50 font-medium tracking-wide uppercase">
              {roleLabel}
            </span>
          </div>

          {/* Section title */}
          <p className="header-fade text-base text-white/40 mb-10 font-medium tracking-wide">
            Kies een portaal om verder te gaan
          </p>

          {/* Portal cards */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-6 max-w-5xl w-full">
            {availablePortals.map((portal) => {
              const Icon = portal.icon;

              const cardClasses: Record<string, string> = {
                dentist: 'hover:border-blue-500/30 hover:shadow-blue-500/10',
                admin: 'hover:border-violet-500/30 hover:shadow-violet-500/10',
                patient: 'hover:border-teal-500/30 hover:shadow-teal-500/10',
              };
              const iconBgClasses: Record<string, string> = {
                dentist: 'from-blue-500 to-blue-600',
                admin: 'from-violet-500 to-purple-600',
                patient: 'from-teal-500 to-cyan-600',
              };
              const glowClasses: Record<string, string> = {
                dentist: 'bg-blue-500/[0.08]',
                admin: 'bg-violet-500/[0.08]',
                patient: 'bg-teal-500/[0.08]',
              };
              const arrowColors: Record<string, string> = {
                dentist: 'group-hover:text-blue-400',
                admin: 'group-hover:text-violet-400',
                patient: 'group-hover:text-teal-400',
              };

              return (
                <button
                  key={portal.id}
                  onClick={() => router.push(portal.href)}
                  className={`portal-card group relative w-full sm:w-[300px] p-8 rounded-3xl border border-white/[0.06] backdrop-blur-2xl bg-white/[0.02] transition-all duration-500 ease-out cursor-pointer text-left shadow-2xl shadow-black/20 hover:scale-[1.03] hover:bg-white/[0.05] ${cardClasses[portal.id]}`}
                >
                  {/* Subtle glow behind card on hover */}
                  <div className={`absolute inset-0 rounded-3xl ${glowClasses[portal.id]} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  <div className="relative z-10">
                    {/* Icon */}
                    <div className={`portal-icon w-14 h-14 rounded-2xl bg-gradient-to-br ${iconBgClasses[portal.id]} flex items-center justify-center shadow-lg mb-6`}>
                      <Icon className="h-7 w-7 text-white" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-white/90 mb-2 tracking-tight">
                      {portal.title}
                    </h3>

                    {/* Description */}
                    <p className="text-sm text-white/35 mb-8 leading-relaxed">
                      {portal.description}
                    </p>

                    {/* CTA */}
                    <div className={`flex items-center gap-2 text-sm font-medium text-white/25 ${arrowColors[portal.id]} transition-colors duration-300`}>
                      <span>Openen</span>
                      <ArrowRight className="portal-arrow h-4 w-4 transition-transform duration-300" />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="footer-fade relative z-10 flex flex-col items-center gap-4 pb-8">
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white/30 text-sm font-medium hover:text-red-400 hover:bg-white/[0.04] transition-all duration-200 cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Uitloggen
          </button>
          <p className="text-xs text-white/15 font-medium tracking-wider">
            NEXIOM &copy; 2026 &middot; v1.0
          </p>
        </div>
      </div>
    </>
  );
}
