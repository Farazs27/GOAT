"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Menu, X, MessageSquare } from "lucide-react";
import Image from "next/image";
import AiChatPanel from "@/components/patient/ai-chat-panel";

interface Session {
  id: string;
  title: string | null;
  createdAt: string;
  _count?: { messages: number };
}

const QUICK_ACTIONS = [
  "Mijn afspraken",
  "Behandelplan uitleg",
  "Factuur vraag",
  "Afspraak maken",
  "NZa code uitleg",
];

function relativeDate(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return "Vandaag";
  if (diffDays === 1) return "Gisteren";
  if (diffDays < 7) return `${diffDays} dagen geleden`;
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function groupSessions(
  sessions: Session[]
): { label: string; items: Session[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

  const groups: { label: string; items: Session[] }[] = [
    { label: "Vandaag", items: [] },
    { label: "Deze week", items: [] },
    { label: "Eerder", items: [] },
  ];

  for (const s of sessions) {
    const d = new Date(s.createdAt);
    if (d >= today) groups[0].items.push(s);
    else if (d >= weekAgo) groups[1].items.push(s);
    else groups[2].items.push(s);
  }

  return groups.filter((g) => g.items.length > 0);
}

export default function AssistantPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [initialMessages, setInitialMessages] = useState<any[] | undefined>(undefined);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [autoSendText, setAutoSendText] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    const token = localStorage.getItem("patient_token");
    if (!token) return;
    try {
      const res = await fetch("/api/patient-portal/ai-chat/sessions", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const loadSession = async (id: string) => {
    setSelectedSessionId(id);
    setInitialMessages(undefined);
    setSidebarOpen(false);

    const token = localStorage.getItem("patient_token");
    if (!token) return;
    try {
      const res = await fetch(`/api/patient-portal/ai-chat/sessions/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInitialMessages(data.messages || []);
      }
    } catch {
      // ignore
    }
  };

  const startNewSession = () => {
    setSelectedSessionId(null);
    setInitialMessages(undefined);
    setAutoSendText(null);
    setSidebarOpen(false);
  };

  const handleSessionCreated = (id: string) => {
    setSelectedSessionId(id);
    fetchSessions();
  };

  const handleQuickAction = (text: string) => {
    // Create a temporary "new session" and auto-send
    setAutoSendText(text);
    setSelectedSessionId(null);
    setInitialMessages(undefined);
  };

  // When autoSendText is set and we render the chat panel, we need to pass it
  const showChat = selectedSessionId || autoSendText;

  const grouped = groupSessions(sessions);

  return (
    <div className="flex h-[calc(100vh-5rem)] md:h-screen md:-m-6 lg:-m-8 xl:-m-10 overflow-hidden">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="md:hidden fixed top-[4.5rem] left-4 z-50 p-2 rounded-xl bg-white/[0.06] border border-white/[0.12] text-white/60 hover:text-white/80 backdrop-blur-xl"
      >
        {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 fixed md:relative z-40 md:z-auto w-[280px] h-full flex-shrink-0 flex flex-col transition-transform duration-300`}
        style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(40px)",
          WebkitBackdropFilter: "blur(40px)",
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
        }}
      >
        {/* Sidebar header */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl overflow-hidden shadow-lg shadow-[#e8945a]/25">
              <Image src="/images/nexiom-logo-sm.png" alt="Nexiom" width={36} height={36} className="w-full h-full object-cover" />
            </div>
            <div>
              <span className="font-bold text-white/90 tracking-tight">
                Nexiom Assistant
              </span>
            </div>
          </div>
          <button
            onClick={startNewSession}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[#e8945a] hover:bg-[#d4864a] text-white font-medium text-sm transition-all shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
          >
            <Plus className="w-4 h-4" />
            Nieuw gesprek
          </button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {grouped.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-medium text-white/30 uppercase tracking-wider px-2 mb-2">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((session) => (
                  <button
                    key={session.id}
                    onClick={() => loadSession(session.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                      selectedSessionId === session.id
                        ? "bg-white/[0.09] border border-[#e8945a]/40"
                        : "bg-white/[0.06] border border-white/[0.12] hover:bg-white/[0.09]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                      <span className="text-sm text-white/70 truncate">
                        {session.title || "Nieuw gesprek"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1 ml-5.5">
                      <span className="text-xs text-white/25">
                        {relativeDate(session.createdAt)}
                      </span>
                      {session._count?.messages ? (
                        <span className="text-xs text-white/20">
                          {session._count.messages}
                        </span>
                      ) : null}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="text-center text-white/20 text-sm py-8">
              Geen eerdere gesprekken
            </p>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {showChat ? (
          <AiChatPanel
            sessionId={selectedSessionId}
            onSessionCreated={handleSessionCreated}
            currentPage="assistant"
            initialMessages={initialMessages}
            autoSendText={autoSendText}
            key={selectedSessionId || autoSendText || "new"}
          />
        ) : (
          /* Welcome screen */
          <div className="flex-1 flex flex-col items-center justify-center px-6">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl shadow-[#e8945a]/30 mb-6">
              <Image src="/images/nexiom-logo-sm.png" alt="Nexiom" width={64} height={64} className="w-full h-full object-cover" />
            </div>
            <h1 className="text-2xl font-bold text-white/90 mb-2 tracking-tight">
              Hoe kan ik u helpen?
            </h1>
            <p className="text-white/40 text-sm mb-8 text-center max-w-md">
              Stel een vraag over uw afspraken, behandelingen, facturen of
              andere tandheelkundige onderwerpen.
            </p>
            <div className="flex flex-wrap justify-center gap-3 max-w-lg">
              {QUICK_ACTIONS.map((action) => (
                <button
                  key={action}
                  onClick={() => handleQuickAction(action)}
                  className="bg-white/[0.06] border border-white/[0.12] rounded-full px-4 py-2 text-white/60 hover:text-white/80 hover:bg-white/[0.09] text-sm transition-all duration-200"
                >
                  {action}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
