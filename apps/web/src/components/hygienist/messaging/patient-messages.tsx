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
} from "lucide-react";
import { MessageTemplates } from "./message-templates";

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
        {/* Search */}
        <div className="p-3 border-b border-white/[0.06]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Zoek patient..."
              className="w-full glass-input rounded-xl pl-9 pr-3 py-2 text-sm outline-none"
            />
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
