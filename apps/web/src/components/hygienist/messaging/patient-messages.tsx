"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  Send,
  Inbox,
  CheckCircle2,
  ArrowRightLeft,
  Plus,
  Search,
  MessageSquare,
  X as XIcon,
  Loader2,
  User,
} from "lucide-react";
import { MessageTemplates } from "./message-templates";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  patientNumber: string;
}

interface Conversation {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  patient: { id: string; name: string };
  lastMessage: { content: string; createdAt: string; senderType: string } | null;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  senderType: "PATIENT" | "STAFF";
  senderId: string | null;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { firstName: string; lastName: string } | null;
  attachments: { id: string; fileName: string; fileUrl: string }[];
}

interface ConversationDetail {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  patient: { id: string; firstName: string; lastName: string };
  practitioner: { id: string; firstName: string; lastName: string };
  messages: Message[];
}

interface Practitioner {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
}

export function PatientMessages() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [replyText, setReplyText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showHandoff, setShowHandoff] = useState(false);
  const [dentists, setDentists] = useState<Practitioner[]>([]);
  const [handingOff, setHandingOff] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // New conversation state
  const [showNewConv, setShowNewConv] = useState(false);
  const [newPatientSearch, setNewPatientSearch] = useState("");
  const [patientResults, setPatientResults] = useState<Patient[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [creatingConv, setCreatingConv] = useState(false);

  const fetchConversations = useCallback(async () => {
    const res = await authFetch("/api/hygienist/conversations");
    if (res.ok) {
      const data = await res.json();
      setConversations(data.conversations);
    }
    setLoading(false);
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    const res = await authFetch(`/api/dashboard/conversations/${id}`);
    if (res.ok) {
      const data = await res.json();
      setDetail(data);
    }
  }, []);

  const fetchDentists = useCallback(async () => {
    const res = await authFetch("/api/schedules?listPractitioners=true");
    if (res.ok) {
      const data = await res.json();
      if (data.practitioners) {
        setDentists(data.practitioners.filter((p: Practitioner) => p.role === "DENTIST"));
      }
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedId) {
      fetchDetail(selectedId);
      fetchDentists();
    }
  }, [selectedId, fetchDetail, fetchDentists]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const handleReply = async () => {
    if (!replyText.trim() || !selectedId || sending) return;
    setSending(true);
    const res = await authFetch(`/api/dashboard/conversations/${selectedId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: replyText }),
    });
    if (res.ok) {
      setReplyText("");
      fetchDetail(selectedId);
      fetchConversations();
    }
    setSending(false);
  };

  const handleHandoff = async (dentistId: string) => {
    if (!selectedId || handingOff) return;
    setHandingOff(true);
    const res = await authFetch(`/api/dashboard/conversations/${selectedId}/reassign`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ practitionerId: dentistId }),
    });
    if (res.ok) {
      setShowHandoff(false);
      setSelectedId(null);
      setDetail(null);
      fetchConversations();
    }
    setHandingOff(false);
  };

  const searchPatients = async (q: string) => {
    if (q.length < 2) { setPatientResults([]); return; }
    try {
      const res = await authFetch(`/api/patients?search=${encodeURIComponent(q)}&limit=5`);
      const data = await res.json();
      setPatientResults(data.data || []);
    } catch { setPatientResults([]); }
  };

  const createConversation = async () => {
    if (!selectedPatient || !newMessage.trim() || creatingConv) return;
    setCreatingConv(true);
    try {
      const res = await authFetch("/api/hygienist/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          initialMessage: newMessage.trim(),
          subject: newSubject.trim() || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShowNewConv(false);
        setSelectedPatient(null);
        setNewPatientSearch("");
        setNewSubject("");
        setNewMessage("");
        fetchConversations();
        if (data.id) setSelectedId(data.id);
      }
    } catch (e) {
      console.error("Failed to create conversation", e);
    } finally {
      setCreatingConv(false);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / 86400000);
    if (diffDays === 0) return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
    if (diffDays === 1) return "Gisteren";
    if (diffDays < 7) return d.toLocaleDateString("nl-NL", { weekday: "short" });
    return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
  };

  const filteredConversations = searchQuery
    ? conversations.filter((c) =>
        c.patient.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/30" />
      </div>
    );
  }

  return (
    <div className="flex h-full gap-4">
      {/* Left Panel - Conversation List */}
      <div className="w-80 flex-shrink-0 flex flex-col glass-card rounded-2xl overflow-hidden">
        {/* Search + New */}
        <div className="p-3 border-b border-white/[0.06] space-y-2">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek patient..."
                className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
              />
            </div>
            <button
              onClick={() => setShowNewConv(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 transition-all flex-shrink-0"
            >
              <Plus className="h-3.5 w-3.5" />
              Nieuw
            </button>
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {filteredConversations.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-[var(--text-tertiary)]">
              <Inbox className="h-10 w-10 mb-3 opacity-40" />
              <p className="text-sm">Geen gesprekken</p>
            </div>
          ) : (
            filteredConversations.map((conv) => (
              <button
                key={conv.id}
                onClick={() => setSelectedId(conv.id)}
                className={`w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-all hover:bg-white/[0.04] ${
                  selectedId === conv.id ? "bg-white/[0.06]" : ""
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm truncate ${
                          conv.unreadCount > 0
                            ? "font-semibold text-[var(--text-primary)]"
                            : "font-medium text-[var(--text-secondary)]"
                        }`}
                      >
                        {conv.patient.name}
                      </span>
                      {conv.status === "CLOSED" && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-green-400 flex-shrink-0" />
                      )}
                    </div>
                    {conv.lastMessage && (
                      <p className="text-xs text-[var(--text-muted)] truncate mt-1">
                        {conv.lastMessage.senderType === "STAFF" ? "Jij: " : ""}
                        {conv.lastMessage.content}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] text-[var(--text-muted)]">
                      {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ""}
                    </span>
                    {conv.unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#e8945a] text-[10px] font-bold text-white">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Right Panel - Conversation Detail */}
      <div className="flex-1 flex flex-col glass-card rounded-2xl overflow-hidden">
        {!detail ? (
          <div className="flex-1 flex flex-col items-center justify-center text-[var(--text-tertiary)]">
            <MessageSquare className="h-12 w-12 mb-3 opacity-30" />
            <p className="text-sm">Selecteer een gesprek</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.06]">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[var(--text-primary)] truncate">
                  {detail.patient.firstName} {detail.patient.lastName}
                </h2>
                <p className="text-xs text-[var(--text-tertiary)] truncate">
                  {detail.subject}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {/* Handoff to Dentist */}
                <div className="relative">
                  <button
                    onClick={() => setShowHandoff(!showHandoff)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-white/[0.06] rounded-xl transition-all"
                  >
                    <ArrowRightLeft className="h-3.5 w-3.5" />
                    Doorsturen naar tandarts
                  </button>
                  {showHandoff && (
                    <div className="absolute right-0 top-full mt-1 w-56 glass-card rounded-xl border border-white/[0.1] shadow-xl z-10 py-1">
                      {dentists.length === 0 ? (
                        <div className="px-4 py-3 text-xs text-[var(--text-muted)]">Geen tandartsen beschikbaar</div>
                      ) : (
                        dentists.map((d) => (
                          <button
                            key={d.id}
                            onClick={() => handleHandoff(d.id)}
                            disabled={handingOff}
                            className="w-full text-left px-4 py-2.5 text-sm text-[var(--text-secondary)] hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                          >
                            {d.firstName} {d.lastName}
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-5 py-4 space-y-3">
              {detail.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.senderType === "STAFF" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm ${
                      msg.senderType === "STAFF"
                        ? "bg-[#e8945a]/20 text-[var(--text-primary)] rounded-br-md"
                        : "bg-white/[0.06] text-[var(--text-secondary)] rounded-bl-md"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className="flex items-center justify-end gap-2 mt-1">
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {msg.sender
                          ? `${msg.sender.firstName} ${msg.sender.lastName}`
                          : "Patient"}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    {msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-[#e8945a] hover:underline block"
                          >
                            {att.fileName}
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Reply Input */}
            {detail.status === "OPEN" && (
              <div className="px-5 py-3 border-t border-white/[0.06]">
                <div className="flex gap-2 items-end">
                  <MessageTemplates
                    patientName={`${detail.patient.firstName} ${detail.patient.lastName}`}
                    onSelect={(text) => setReplyText(text)}
                  />
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleReply()}
                    placeholder="Typ een bericht..."
                    className="flex-1 glass-input rounded-2xl px-4 py-3 text-sm outline-none"
                  />
                  <button
                    onClick={handleReply}
                    disabled={!replyText.trim() || sending}
                    className="p-3 rounded-2xl btn-liquid-primary disabled:opacity-40 transition-all"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {/* New Conversation Modal */}
      {showNewConv && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-2xl rounded-2xl border border-white/[0.12] shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-5 border-b border-white/[0.08]">
              <h2 className="text-lg font-semibold text-white/90">Nieuw bericht aan patiënt</h2>
              <button onClick={() => { setShowNewConv(false); setSelectedPatient(null); setNewPatientSearch(""); setNewSubject(""); setNewMessage(""); }} className="p-1.5 rounded-lg text-white/40 hover:text-white/60 hover:bg-white/[0.06] transition-all">
                <XIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {/* Patient search */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Patiënt</label>
                {selectedPatient ? (
                  <div className="flex items-center justify-between bg-white/[0.06] rounded-xl px-3 py-2.5 border border-white/[0.12]">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                        <User className="w-4 h-4 text-emerald-300" />
                      </div>
                      <span className="text-sm text-white/80">{selectedPatient.firstName} {selectedPatient.lastName}</span>
                    </div>
                    <button onClick={() => { setSelectedPatient(null); setNewPatientSearch(""); }} className="text-white/30 hover:text-white/50">
                      <XIcon className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                    <input
                      value={newPatientSearch}
                      onChange={(e) => { setNewPatientSearch(e.target.value); searchPatients(e.target.value); }}
                      placeholder="Zoek patiënt..."
                      className="w-full pl-9 pr-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                    />
                    {patientResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a1a2e] border border-white/[0.12] rounded-xl overflow-hidden z-10 shadow-xl">
                        {patientResults.map((p) => (
                          <button
                            key={p.id}
                            onClick={() => { setSelectedPatient(p); setPatientResults([]); }}
                            className="w-full px-3 py-2.5 text-left text-sm text-white/70 hover:bg-white/[0.06] transition-colors flex items-center gap-2"
                          >
                            <User className="w-4 h-4 text-white/30" />
                            {p.firstName} {p.lastName} <span className="text-white/30">#{p.patientNumber}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Subject */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Onderwerp (optioneel)</label>
                <input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Bijv. Afspraak herinnering..."
                  className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all"
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-medium text-white/50 mb-1.5 block">Bericht</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                  placeholder="Typ uw bericht..."
                  className="w-full px-3 py-2.5 bg-white/[0.05] border border-white/[0.12] rounded-xl text-sm text-white/80 placeholder-white/30 focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 outline-none transition-all resize-none"
                />
              </div>

              <button
                onClick={createConversation}
                disabled={!selectedPatient || !newMessage.trim() || creatingConv}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {creatingConv && <Loader2 className="w-4 h-4 animate-spin" />}
                <Send className="w-4 h-4" />
                Bericht versturen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function useUnreadCount() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    async function fetch_() {
      const res = await authFetch("/api/hygienist/conversations");
      if (res.ok) {
        const data = await res.json();
        const total = (data.conversations || []).reduce(
          (sum: number, c: { unreadCount: number }) => sum + c.unreadCount,
          0
        );
        setCount(total);
      }
    }
    fetch_();
  }, []);

  return count;
}
