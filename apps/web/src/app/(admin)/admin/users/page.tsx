'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Plus, Search, X, Edit2, Trash2, UserCheck, UserX } from 'lucide-react';

interface User {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  phone: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
}

interface UsersResponse {
  data: User[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: 'Super Admin',
  PRACTICE_ADMIN: 'Beheerder',
  DENTIST: 'Tandarts',
  HYGIENIST: 'Mondhygienist',
  RECEPTIONIST: 'Receptionist',
};

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-500/20 text-red-300 border-red-500/20',
  PRACTICE_ADMIN: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
  DENTIST: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  HYGIENIST: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  RECEPTIONIST: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
};

const avatarColors = [
  'from-pink-400 to-rose-500',
  'from-blue-400 to-cyan-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showInactive, setShowInactive] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'DENTIST',
    password: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}`, 'Content-Type': 'application/json' };

  const fetchUsers = useCallback((page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (search) params.set('search', search);
    if (roleFilter) params.set('role', roleFilter);
    if (showInactive) params.set('includeInactive', 'true');

    fetch(`/api/users?${params}`, { headers })
      .then((r) => r.ok ? r.json() : { data: [], meta: { total: 0, page: 1, totalPages: 1 } })
      .then((res: UsersResponse) => {
        setUsers(res.data);
        setMeta({ total: res.meta.total, page: res.meta.page, totalPages: res.meta.totalPages });
      })
      .finally(() => setLoading(false));
  }, [search, roleFilter, showInactive]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', role: 'DENTIST', password: '', phone: '' });
    setError('');
  };

  const openCreate = () => {
    resetForm();
    setEditingUser(null);
    setShowCreateModal(true);
  };

  const openEdit = (user: User) => {
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email,
      role: user.role,
      password: '',
      phone: user.phone || '',
    });
    setEditingUser(user);
    setShowCreateModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      if (editingUser) {
        const { password, ...rest } = formData;
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PATCH',
          headers,
          body: JSON.stringify(rest),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Fout bij opslaan');
        }
      } else {
        if (!formData.password || formData.password.length < 6) {
          throw new Error('Wachtwoord moet minimaal 6 tekens zijn');
        }
        const res = await fetch('/api/users', {
          method: 'POST',
          headers,
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.message || 'Fout bij aanmaken');
        }
      }
      setShowCreateModal(false);
      fetchUsers(meta.page);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (user: User) => {
    if (!confirm(`Weet u zeker dat u ${user.firstName} ${user.lastName} wilt deactiveren?`)) return;
    await fetch(`/api/users/${user.id}`, { method: 'DELETE', headers });
    fetchUsers(meta.page);
  };

  const handleToggleActive = async (user: User) => {
    await fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    fetchUsers(meta.page);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gebruikersbeheer</h2>
          <p className="text-white/50">Beheer alle gebruikers van uw praktijk.</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-500/80 hover:bg-violet-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all"
        >
          <Plus className="h-4 w-4" />
          Nieuwe gebruiker
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/30" />
          <input
            type="text"
            placeholder="Zoeken op naam of email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="glass-input rounded-xl px-3 py-2 text-sm outline-none min-w-[160px]"
        >
          <option value="">Alle rollen</option>
          <option value="PRACTICE_ADMIN">Beheerder</option>
          <option value="DENTIST">Tandarts</option>
          <option value="HYGIENIST">Mondhygienist</option>
          <option value="RECEPTIONIST">Receptionist</option>
        </select>
        <label className="flex items-center gap-2 glass rounded-xl px-3 py-2 text-sm text-white/60 cursor-pointer hover:bg-white/10 transition-colors">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="rounded"
          />
          Inactief tonen
        </label>
      </div>

      {/* User list */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400 border-t-transparent"></div>
        </div>
      ) : users.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Users className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40">Geen gebruikers gevonden</p>
        </div>
      ) : (
        <div className="glass-card rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-xs text-white/40 uppercase tracking-wider font-medium px-5 py-3">Gebruiker</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider font-medium px-5 py-3">Rol</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider font-medium px-5 py-3">Status</th>
                <th className="text-left text-xs text-white/40 uppercase tracking-wider font-medium px-5 py-3">Laatste login</th>
                <th className="text-right text-xs text-white/40 uppercase tracking-wider font-medium px-5 py-3">Acties</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user, idx) => {
                const initials = `${(user.firstName || '?')[0]}${(user.lastName || '?')[0]}`;
                return (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColors[idx % avatarColors.length]} flex items-center justify-center shadow-lg ${!user.isActive ? 'opacity-40' : ''}`}>
                          <span className="text-xs font-bold text-white">{initials}</span>
                        </div>
                        <div>
                          <div className={`font-medium text-sm ${user.isActive ? 'text-white/90' : 'text-white/40'}`}>
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-xs text-white/40">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-lg border ${roleColors[user.role] || 'bg-white/10 text-white/50 border-white/10'}`}>
                        {roleLabels[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      {user.isActive ? (
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/20">Actief</span>
                      ) : (
                        <span className="text-xs px-2.5 py-0.5 rounded-lg bg-red-500/20 text-red-300 border border-red-500/20">Inactief</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <span className="text-xs text-white/40">
                        {user.lastLoginAt
                          ? new Date(user.lastLoginAt).toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                          : 'Nooit'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(user)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          title="Bewerken"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
                          title={user.isActive ? 'Deactiveren' : 'Activeren'}
                        >
                          {user.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                        </button>
                        {user.isActive && (
                          <button
                            onClick={() => handleDeactivate(user)}
                            className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/40 hover:text-red-300 transition-colors"
                            title="Verwijderen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-3 border-t border-white/10">
              <span className="text-xs text-white/40">{meta.total} gebruikers totaal</span>
              <div className="flex gap-2">
                {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => fetchUsers(p)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      p === meta.page ? 'bg-violet-500/30 text-violet-300' : 'text-white/40 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl w-full max-w-lg p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                {editingUser ? 'Gebruiker bewerken' : 'Nieuwe gebruiker'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-500/20 border border-red-500/20 text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Voornaam</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Achternaam</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">E-mail</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                >
                  <option value="PRACTICE_ADMIN">Beheerder</option>
                  <option value="DENTIST">Tandarts</option>
                  <option value="HYGIENIST">Mondhygienist</option>
                  <option value="RECEPTIONIST">Receptionist</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Telefoon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            </div>

            {!editingUser && (
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider block mb-1.5">Wachtwoord</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimaal 6 tekens"
                  className="w-full glass-input rounded-xl px-3 py-2 text-sm outline-none"
                />
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="glass rounded-xl px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-violet-500/80 hover:bg-violet-500 rounded-xl text-sm font-medium text-white shadow-lg shadow-violet-500/20 transition-all disabled:opacity-50"
              >
                {saving ? 'Opslaan...' : editingUser ? 'Opslaan' : 'Aanmaken'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
