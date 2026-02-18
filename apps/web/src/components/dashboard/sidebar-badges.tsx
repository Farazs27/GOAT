'use client';

import { useEffect, useState } from 'react';
import { authFetch } from '@/lib/auth-fetch';

interface BadgeData {
  pendingBookings: number;
  teamChatUnread: number;
}

export function SidebarBadges() {
  const [badges, setBadges] = useState<BadgeData>({ pendingBookings: 0, teamChatUnread: 0 });

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const [apptRes, chatRes] = await Promise.all([
          authFetch('/api/appointments?status=PENDING_APPROVAL'),
          authFetch('/api/staff-chat'),
        ]);
        let pendingBookings = 0;
        let teamChatUnread = 0;
        if (apptRes.ok) {
          const data = await apptRes.json();
          pendingBookings = Array.isArray(data) ? data.length : 0;
        }
        if (chatRes.ok) {
          const chats = await chatRes.json();
          teamChatUnread = Array.isArray(chats)
            ? chats.reduce((sum: number, c: { unreadCount?: number }) => sum + (c.unreadCount || 0), 0)
            : 0;
        }
        setBadges({ pendingBookings, teamChatUnread });
      } catch {}
    };
    fetchBadges();
    const interval = setInterval(fetchBadges, 60000);
    return () => clearInterval(interval);
  }, []);

  if (badges.pendingBookings === 0 && badges.teamChatUnread === 0) return null;

  return (
    <div
      id="sidebar-badge-agenda"
      className="fixed z-30 pointer-events-none"
      style={{
        display: 'none',
      }}
    >
      <style>{`
        ${badges.pendingBookings > 0 ? `
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
        }` : ''}
        ${badges.teamChatUnread > 0 ? `
        [href="/dashboard/team-chat"]::after {
          content: '${badges.teamChatUnread}';
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
        }` : ''}
      `}</style>
    </div>
  );
}
