'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';

interface BadgeData {
  pendingBookings: number;
}

export function SidebarBadges() {
  const [badges, setBadges] = useState<BadgeData>({ pendingBookings: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await authFetch('/api/appointments?status=PENDING_APPROVAL');
        if (res.ok) {
          const data = await res.json();
          setBadges({ pendingBookings: Array.isArray(data) ? data.length : 0 });
        }
      } catch {}
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  if (badges.pendingBookings === 0) return null;

  return (
    <div
      id="sidebar-badge-agenda"
      className="fixed z-30 pointer-events-none"
      style={{
        // Position over the Agenda nav item (3rd item, ~index 2)
        // This uses a portal-style overlay approach
        display: 'none',
      }}
    >
      {/* Badge rendered via CSS adjacent to Agenda link */}
      <style>{`
        [href="/agenda"]::after {
          content: '${badges.pendingBookings}';
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 18px;
          height: 18px;
          padding: 0 5px;
          margin-left: auto;
          font-size: 10px;
          font-weight: 700;
          color: white;
          background: linear-gradient(135deg, #f97316, #ea580c);
          border-radius: 9px;
          box-shadow: 0 2px 8px rgba(249, 115, 22, 0.4);
        }
      `}</style>
    </div>
  );
}
