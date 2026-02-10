'use client';

import { useState, useEffect, useCallback } from 'react';
import { Shield, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  userId: string | null;
  action: string;
  resourceType: string;
  resourceId: string | null;
  oldValues: any;
  newValues: any;
  ipAddress: string | null;
  bsnAccessed: boolean;
  createdAt: string;
  user: { firstName: string; lastName: string; email: string } | null;
}

interface AuditResponse {
  data: AuditLog[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

const actionLabels: Record<string, string> = {
  CREATE: 'Aangemaakt',
  UPDATE: 'Bijgewerkt',
  DELETE: 'Verwijderd',
  LOGIN: 'Ingelogd',
  LOGOUT: 'Uitgelogd',
  VIEW: 'Bekeken',
  EXPORT: 'Geexporteerd',
  BSN_ACCESS: 'BSN Toegang',
};

const actionColors: Record<string, string> = {
  CREATE: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/20',
  UPDATE: 'bg-blue-500/20 text-blue-300 border-blue-500/20',
  DELETE: 'bg-red-500/20 text-red-300 border-red-500/20',
  LOGIN: 'bg-violet-500/20 text-violet-300 border-violet-500/20',
  LOGOUT: 'bg-white/10 text-white/50 border-white/10',
  VIEW: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/20',
  BSN_ACCESS: 'bg-amber-500/20 text-amber-300 border-amber-500/20',
};

const resourceLabels: Record<string, string> = {
  PATIENT: 'Patient',
  APPOINTMENT: 'Afspraak',
  INVOICE: 'Factuur',
  USER: 'Gebruiker',
  PRACTICE: 'Praktijk',
  CREDENTIAL: 'API Sleutel',
  TREATMENT: 'Behandeling',
  CLINICAL_NOTE: 'Klinische notitie',
  ODONTOGRAM: 'Odontogram',
};

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [meta, setMeta] = useState({ total: 0, page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const headers = { Authorization: `Bearer ${localStorage.getItem('access_token')}` };

  const fetchLogs = useCallback((page = 1) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: '25' });
    if (actionFilter) params.set('action', actionFilter);
    if (resourceFilter) params.set('resourceType', resourceFilter);
    if (startDate) params.set('startDate', new Date(startDate).toISOString());
    if (endDate) params.set('endDate', new Date(endDate + 'T23:59:59').toISOString());

    fetch(`/api/audit-logs?${params}`, { headers })
      .then((r) => r.ok ? r.json() : { data: [], meta: { total: 0, page: 1, totalPages: 1 } })
      .then((res: AuditResponse) => {
        setLogs(res.data);
        setMeta({ total: res.meta.total, page: res.meta.page, totalPages: res.meta.totalPages });
      })
      .finally(() => setLoading(false));
  }, [actionFilter, resourceFilter, startDate, endDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white">Audit Logs</h2>
        <p className="text-white/50">Volledige activiteitenhistorie van uw praktijk.</p>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-2xl p-4">
        <div className="flex flex-wrap gap-3">
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-sm outline-none min-w-[140px]"
          >
            <option value="">Alle acties</option>
            <option value="CREATE">Aangemaakt</option>
            <option value="UPDATE">Bijgewerkt</option>
            <option value="DELETE">Verwijderd</option>
            <option value="LOGIN">Ingelogd</option>
            <option value="VIEW">Bekeken</option>
            <option value="BSN_ACCESS">BSN Toegang</option>
          </select>
          <select
            value={resourceFilter}
            onChange={(e) => setResourceFilter(e.target.value)}
            className="glass-input rounded-xl px-3 py-2 text-sm outline-none min-w-[140px]"
          >
            <option value="">Alle types</option>
            <option value="PATIENT">Patient</option>
            <option value="APPOINTMENT">Afspraak</option>
            <option value="INVOICE">Factuur</option>
            <option value="USER">Gebruiker</option>
            <option value="TREATMENT">Behandeling</option>
            <option value="CREDENTIAL">API Sleutel</option>
          </select>
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/40">Van</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-white/40">Tot</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="glass-input rounded-xl px-3 py-2 text-sm outline-none"
            />
          </div>
          {(actionFilter || resourceFilter || startDate || endDate) && (
            <button
              onClick={() => { setActionFilter(''); setResourceFilter(''); setStartDate(''); setEndDate(''); }}
              className="glass rounded-xl px-3 py-2 text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              Filters wissen
            </button>
          )}
        </div>
      </div>

      {/* Logs */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-violet-400 border-t-transparent"></div>
        </div>
      ) : logs.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-white/20" />
          <p className="text-white/40">Geen audit logs gevonden</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div key={log.id} className="glass-card rounded-xl p-4 flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-400/20 to-purple-400/20 flex items-center justify-center border border-violet-500/20 flex-shrink-0 mt-0.5">
                <Shield className="h-4 w-4 text-violet-300" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-sm text-white/90">
                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Systeem'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-lg border ${actionColors[log.action] || 'bg-white/10 text-white/50 border-white/10'}`}>
                    {actionLabels[log.action] || log.action}
                  </span>
                  <span className="text-xs text-white/40">
                    {resourceLabels[log.resourceType] || log.resourceType}
                  </span>
                  {log.bsnAccessed && (
                    <span className="text-xs px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/20">
                      BSN
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-1">
                  {log.resourceId && (
                    <span className="text-xs text-white/30 font-mono">{log.resourceId.substring(0, 8)}...</span>
                  )}
                  {log.ipAddress && (
                    <span className="text-xs text-white/30">{log.ipAddress}</span>
                  )}
                </div>
              </div>
              <span className="text-xs text-white/30 flex-shrink-0">
                {new Date(log.createdAt).toLocaleString('nl-NL', {
                  day: '2-digit',
                  month: '2-digit',
                  year: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                })}
              </span>
            </div>
          ))}

          {/* Pagination */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <span className="text-xs text-white/40">{meta.total} logs totaal</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => fetchLogs(meta.page - 1)}
                  disabled={meta.page <= 1}
                  className="p-2 rounded-xl glass text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-white/50">
                  {meta.page} / {meta.totalPages}
                </span>
                <button
                  onClick={() => fetchLogs(meta.page + 1)}
                  disabled={meta.page >= meta.totalPages}
                  className="p-2 rounded-xl glass text-white/40 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
