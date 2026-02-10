'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, MapPin, Phone, Mail, Settings } from 'lucide-react';

interface PracticeDetails {
  id: string;
  name: string;
  slug: string;
  agbCode: string | null;
  kvkNumber: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostal: string | null;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: string;
  users: Array<{
    id: string;
    firstName: string | null;
    lastName: string | null;
    email: string;
    role: string;
    isActive: boolean;
  }>;
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PRACTICE_ADMIN: 'Beheerder',
  DENTIST: 'Tandarts',
  HYGIENIST: 'Mondhygienist',
  RECEPTIONIST: 'Receptionist',
};

const roleColors: Record<string, string> = {
  PRACTICE_ADMIN: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
  DENTIST: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  HYGIENIST: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  RECEPTIONIST: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
};

export default function AdminPracticesPage() {
  const [practice, setPractice] = useState<PracticeDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };
    // Get practice ID from user profile, then fetch full practice details
    fetch('/api/users/me', { headers })
      .then((r) => r.ok ? r.json() : null)
      .then((user) => {
        if (!user?.practice?.id) return;
        return fetch(`/api/practices/${user.practice.id}`, { headers }).then((r) => r.ok ? r.json() : null);
      })
      .then((data) => { if (data) setPractice(data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400 border-t-transparent"></div>
      </div>
    );
  }

  if (!practice) {
    return (
      <div className="glass-card rounded-2xl p-12 text-center">
        <Building2 className="h-12 w-12 mx-auto mb-4 text-white/20" />
        <p className="text-white/40">Praktijkgegevens niet gevonden</p>
      </div>
    );
  }

  const usersByRole = practice.users.reduce((acc, u) => {
    acc[u.role] = (acc[u.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Praktijkbeheer</h2>
        <p className="text-white/50">Overzicht en beheer van uw praktijk.</p>
      </div>

      {/* Practice Card */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/20 flex-shrink-0">
            <Building2 className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-white">{practice.name}</h3>
              {practice.isActive ? (
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Actief</span>
              ) : (
                <span className="text-xs px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/20">Inactief</span>
              )}
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-sm text-white/50">
              {practice.addressStreet && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5" />
                  {practice.addressStreet}, {practice.addressPostal} {practice.addressCity}
                </div>
              )}
              {practice.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" />
                  {practice.phone}
                </div>
              )}
              {practice.email && (
                <div className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  {practice.email}
                </div>
              )}
            </div>
          </div>
          <a
            href="/admin/settings"
            className="flex items-center gap-2 px-3 py-2 glass rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <Settings className="h-4 w-4" />
            Bewerken
          </a>
        </div>

        {/* Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">AGB-code</p>
            <p className="text-sm text-white/80 font-mono">{practice.agbCode || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">KvK-nummer</p>
            <p className="text-sm text-white/80 font-mono">{practice.kvkNumber || '—'}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Slug</p>
            <p className="text-sm text-white/80 font-mono">{practice.slug}</p>
          </div>
          <div>
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Geregistreerd</p>
            <p className="text-sm text-white/80">{new Date(practice.createdAt).toLocaleDateString('nl-NL')}</p>
          </div>
        </div>
      </div>

      {/* Team Summary */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Object.entries(usersByRole).map(([role, count]) => (
          <div key={role} className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-white/40 uppercase tracking-wider">{roleLabels[role] || role}</p>
              <Users className="h-4 w-4 text-white/30" />
            </div>
            <div className="text-2xl font-bold text-white">{count}</div>
          </div>
        ))}
      </div>

      {/* Team Members */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wider">Teamleden</h3>
          <a href="/admin/users" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">
            Beheren &rarr;
          </a>
        </div>
        <div className="space-y-2">
          {practice.users.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-3 glass-light rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg">
                  <span className="text-xs font-bold text-white">
                    {(user.firstName || '?')[0]}{(user.lastName || '?')[0]}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90">{user.firstName} {user.lastName}</p>
                  <p className="text-xs text-white/40">{user.email}</p>
                </div>
              </div>
              <span className={`text-xs px-2.5 py-0.5 rounded-lg border ${roleColors[user.role] || 'bg-white/10 text-white/50 border-white/10'}`}>
                {roleLabels[user.role] || user.role}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
