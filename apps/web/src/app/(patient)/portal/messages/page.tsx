"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  Paperclip,
  ArrowLeft,
  Plus,
  CheckCircle,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

/* ---------- Types ---------- */

interface Practitioner {
  id: string;
  name: string;
  role: string;
}

interface ConversationSummary {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  practitioner: Practitioner;
  lastMessage: {
    content: string;
    createdAt: string;
    senderType: "PATIENT" | "STAFF";
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface Attachment {
  id: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
}

interface Message {
  id: string;
  content: string;
  senderType: "PATIENT" | "STAFF";
  isRead: boolean;
  createdAt: string;
  sender?: { firstName: string; lastName: string } | null;
  attachments: Attachment[];
}

interface ConversationDetail {
  id: string;
  subject: string;
  status: "OPEN" | "CLOSED";
  practitioner: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
  messages: Message[];
}

/* ---------- Helpers ---------- */

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.floor(
    (today.getTime() - msgDate.getTime()) / (1000 * 60 * 60 * 24)
  );
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");

  if (diffDays === 0) return `${hh}:${mm}`;
  if (diffDays === 1) return `Gisteren`;
  if (diffDays < 7) {
    const days = ["zo", "ma", "di", "wo", "do", "vr", "za"];
    return days[date.getDay()];
  }
  return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  const days = ["zondag", "maandag", "dinsdag", "woensdag", "donderdag", "vrijdag", "zaterdag"];
  const months = ["januari", "februari", "maart", "april", "mei", "juni", "juli", "augustus", "september", "oktober", "november", "december"];
  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;
}

function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
}

function shouldShowDateSeparator(current: Message, previous: Message | null): boolean {
  if (!previous) return true;
  const a = new Date(current.createdAt);
  const b = new Date(previous.createdAt);
  return a.getDate() !== b.getDate() || a.getMonth() !== b.getMonth() || a.getFullYear() !== b.getFullYear();
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();
}

/* ---------- Component ---------- */

export default function MessagesPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ConversationDetail | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newPractitionerId, setNewPractitionerId] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getToken = () => localStorage.getItem("patient_token");

  /* Fetch conversation list */
  const fetchConversations = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) { setError("Niet ingelogd"); setIsLoading(false); return; }
      const res = await fetch("/api/patient-portal/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setConversations(data.conversations);
      setPractitioners(data.practitioners);
      setError(null);
    } catch {
      setError("Kon gesprekken niet laden");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /* Fetch single conversation detail */
  const fetchDetail = useCallback(async (id: string) => {
    try {
      const token = getToken();
      const res = await fetch(`/api/patient-portal/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setDetail(data);
    } catch {
      setError("Kon berichten niet laden");
    }
  }, []);

  /* Initial load */
  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  /* Poll every 10s when a conversation is open */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations();
      if (selectedId) fetchDetail(selectedId);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations, fetchDetail, selectedId]);

  /* Auto-scroll on new messages */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [detail?.messages]);

  /* Select a conversation */
  const selectConversation = (id: string) => {
    setSelectedId(id);
    setMobileShowChat(true);
    fetchDetail(id);
  };

  /* Send message */
  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending || !selectedId) return;
    setIsSending(true);
    try {
      const token = getToken();
      const res = await fetch(`/api/patient-portal/conversations/${selectedId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Kon bericht niet versturen");
      }
      setInputValue("");
      await fetchDetail(selectedId);
      await fetchConversations();
      inputRef.current?.focus();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Kon bericht niet versturen");
    } finally {
      setIsSending(false);
    }
  };

  /* Handle file attachment */
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedId || !detail) return;

    // First send a message, then attach file
    const token = getToken();
    try {
      const msgRes = await fetch(`/api/patient-portal/conversations/${selectedId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ content: `[Bijlage: ${file.name}]` }),
      });
      if (!msgRes.ok) throw new Error("Kon bericht niet versturen");
      const msg = await msgRes.json();

      const formData = new FormData();
      formData.append("file", file);
      formData.append("messageId", msg.id);

      await fetch(`/api/patient-portal/conversations/${selectedId}/attachments`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      await fetchDetail(selectedId);
      await fetchConversations();
    } catch {
      setError("Kon bijlage niet uploaden");
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* Create new conversation */
  const handleCreateConversation = async () => {
    if (!newPractitionerId || !newSubject.trim() || !newMessage.trim()) return;
    setIsCreating(true);
    try {
      const token = getToken();
      const res = await fetch("/api/patient-portal/conversations", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          practitionerId: newPractitionerId,
          subject: newSubject.trim(),
          message: newMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setShowNewDialog(false);
      setNewSubject("");
      setNewMessage("");
      setNewPractitionerId("");
      await fetchConversations();
      selectConversation(data.id);
    } catch {
      setError("Kon gesprek niet aanmaken");
    } finally {
      setIsCreating(false);
    }
  };

  /* Reopen conversation */
  const handleReopen = async () => {
    if (!selectedId) return;
    try {
      const token = getToken();
      await fetch(`/api/patient-portal/conversations/${selectedId}/status`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });
      await fetchDetail(selectedId);
      await fetchConversations();
    } catch {
      setError("Kon gesprek niet heropenen");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  /* Auto-resize textarea */
  useEffect(() => {
    const ta = inputRef.current;
    if (ta) { ta.style.height = "auto"; ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`; }
  }, [inputValue]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white/95 mb-2">Berichten</h1>
          <p className="text-lg text-white/50">Communiceer met uw tandartspraktijk</p>
        </div>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
        </div>
      </div>
    );
  }

  /* ---- Conversation list panel ---- */
  const listPanel = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.12] flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white/95">Berichten</h1>
          <p className="text-sm text-white/40">Uw gesprekken</p>
        </div>
        <button
          onClick={() => setShowNewDialog(true)}
          className="h-10 w-10 rounded-2xl bg-[#e8945a] hover:bg-[#d4864a] flex items-center justify-center transition-all shadow-lg shadow-[#e8945a]/25"
        >
          <Plus className="w-5 h-5 text-white" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-14 h-14 rounded-2xl bg-[#e8945a]/10 flex items-center justify-center border border-[#e8945a]/20 mb-4">
              <MessageSquare className="w-7 h-7 text-[#e8945a]/60" />
            </div>
            <h3 className="text-base font-medium text-white/70 mb-1">Nog geen gesprekken</h3>
            <p className="text-sm text-white/40">Start een nieuw gesprek met uw behandelaar.</p>
          </div>
        ) : (
          conversations.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={`w-full text-left px-5 py-4 border-b border-white/[0.06] hover:bg-white/[0.06] transition-all ${
                selectedId === c.id ? "bg-white/[0.09] border-l-2 border-l-[#e8945a]" : ""
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e8945a]/20 to-[#d4783e]/20 flex items-center justify-center border border-[#e8945a]/15 shrink-0">
                  <span className="text-xs font-bold text-[#e8945a]">
                    {getInitials(c.practitioner.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${c.unreadCount > 0 ? "font-bold text-white" : "font-medium text-white/80"}`}>
                      {c.subject}
                    </span>
                    <span className="text-xs text-white/30 shrink-0">
                      {c.lastMessage ? formatTime(c.lastMessage.createdAt) : ""}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2 mt-0.5">
                    <span className="text-xs text-white/40 truncate">
                      {c.practitioner.name}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {c.status === "OPEN" ? (
                        <span className="w-2 h-2 rounded-full bg-green-500" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-white/20" />
                      )}
                      {c.unreadCount > 0 && (
                        <span className="bg-[#e8945a] text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                  {c.lastMessage && (
                    <p className="text-xs text-white/30 truncate mt-1">
                      {c.lastMessage.senderType === "PATIENT" ? "U: " : ""}
                      {c.lastMessage.content}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );

  /* ---- Chat panel ---- */
  const chatPanel = detail ? (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="px-5 py-4 border-b border-white/[0.12] flex items-center gap-3">
        <button
          onClick={() => { setMobileShowChat(false); setSelectedId(null); setDetail(null); }}
          className="lg:hidden h-8 w-8 rounded-xl bg-white/[0.06] flex items-center justify-center hover:bg-white/[0.12] transition-all"
        >
          <ArrowLeft className="w-4 h-4 text-white/70" />
        </button>
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#e8945a]/20 to-[#d4783e]/20 flex items-center justify-center border border-[#e8945a]/15">
          <span className="text-xs font-bold text-[#e8945a]">
            {getInitials(`${detail.practitioner.firstName} ${detail.practitioner.lastName}`)}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-white/90 text-sm truncate">{detail.subject}</h2>
          <p className="text-xs text-white/40">{detail.practitioner.firstName} {detail.practitioner.lastName}</p>
        </div>
        <div className="flex items-center gap-2">
          {detail.status === "OPEN" ? (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
              <CheckCircle className="w-3 h-3" /> Open
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-white/40 bg-white/[0.06] px-2 py-1 rounded-full border border-white/[0.12]">
              Gesloten
            </span>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-3">
        {detail.messages.map((msg, idx) => {
          const prev = idx > 0 ? detail.messages[idx - 1] : null;
          const showDate = shouldShowDateSeparator(msg, prev);
          const isOwn = msg.senderType === "PATIENT";

          return (
            <div key={msg.id}>
              {showDate && (
                <div className="flex items-center justify-center my-4">
                  <div className="bg-white/[0.06] backdrop-blur-2xl px-4 py-1 rounded-full border border-white/[0.12]">
                    <span className="text-xs text-white/40 font-medium">{formatFullDate(msg.createdAt)}</span>
                  </div>
                </div>
              )}
              <div className={`flex gap-2 ${isOwn ? "justify-end" : ""}`}>
                {!isOwn && (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#e8945a]/20 to-[#d4783e]/20 flex items-center justify-center shrink-0 border border-[#e8945a]/15 mt-1">
                    <span className="text-[10px] font-bold text-[#e8945a]">
                      {msg.sender ? getInitials(`${msg.sender.firstName} ${msg.sender.lastName}`) : "?"}
                    </span>
                  </div>
                )}
                <div className={`max-w-[80%] lg:max-w-[70%]`}>
                  {!isOwn && msg.sender && (
                    <p className="text-[10px] text-white/30 mb-0.5 ml-1">{msg.sender.firstName} {msg.sender.lastName}</p>
                  )}
                  <div className={`rounded-2xl px-4 py-2.5 ${
                    isOwn
                      ? "bg-[#e8945a] text-white rounded-tr-lg shadow-lg shadow-[#e8945a]/25"
                      : "bg-white/[0.06] border border-white/[0.12] backdrop-blur-2xl text-white/90 rounded-tl-lg"
                  }`}>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    {/* Attachments */}
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        {msg.attachments.map((att) => (
                          <a
                            key={att.id}
                            href={att.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs transition-all ${
                              isOwn
                                ? "bg-white/20 hover:bg-white/30 text-white"
                                : "bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.12] text-white/70"
                            }`}
                          >
                            {att.mimeType.startsWith("image/") ? (
                              <ImageIcon className="w-4 h-4 shrink-0" />
                            ) : (
                              <FileText className="w-4 h-4 shrink-0" />
                            )}
                            <span className="truncate">{att.fileName}</span>
                            <span className="shrink-0 opacity-60">{formatFileSize(att.fileSize)}</span>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className={`text-[10px] text-white/25 mt-1 block ${isOwn ? "text-right mr-1" : "ml-1"}`}>
                    {formatMessageTime(msg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      {detail.status === "OPEN" ? (
        <div className="px-4 lg:px-6 py-3 border-t border-white/[0.12] bg-white/[0.04]">
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="h-10 w-10 rounded-xl bg-white/[0.06] border border-white/[0.12] flex items-center justify-center hover:bg-white/[0.12] transition-all shrink-0"
            >
              <Paperclip className="w-4 h-4 text-white/50" />
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <div className="flex-1">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Typ uw bericht..."
                disabled={isSending}
                rows={1}
                className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-4 py-2.5 text-white/90 placeholder:text-white/30 resize-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 outline-none disabled:opacity-50 transition-all text-sm"
                style={{ minHeight: "40px", maxHeight: "120px" }}
              />
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="h-10 w-10 rounded-xl bg-[#e8945a] hover:bg-[#d4864a] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center transition-all shadow-lg shadow-[#e8945a]/25 shrink-0"
            >
              {isSending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
            </button>
          </div>
        </div>
      ) : (
        <div className="px-4 lg:px-6 py-3 border-t border-white/[0.12] bg-white/[0.04]">
          <div className="flex items-center justify-center gap-3">
            <p className="text-sm text-white/40">Dit gesprek is gesloten</p>
            <button
              onClick={handleReopen}
              className="text-sm text-[#e8945a] hover:text-[#f0a06a] font-medium transition-colors"
            >
              Heropen gesprek
            </button>
          </div>
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center h-full text-center px-6">
      <div className="w-16 h-16 rounded-2xl bg-[#e8945a]/10 flex items-center justify-center border border-[#e8945a]/20 mb-4">
        <MessageSquare className="w-8 h-8 text-[#e8945a]/60" />
      </div>
      <h3 className="text-lg font-medium text-white/70 mb-1">Selecteer een gesprek</h3>
      <p className="text-sm text-white/40">Kies een gesprek uit de lijst of start een nieuw gesprek.</p>
    </div>
  );

  return (
    <div className="h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] flex flex-col">
      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-3 flex items-center gap-3 text-red-300 mb-4">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <p className="text-sm flex-1">{error}</p>
          <button onClick={() => setError(null)}><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Two-panel layout */}
      <div className="flex-1 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl overflow-hidden shadow-xl shadow-black/10 flex min-h-0">
        {/* Left: conversation list */}
        <div className={`w-full lg:w-[360px] lg:border-r border-white/[0.08] ${mobileShowChat ? "hidden lg:flex lg:flex-col" : "flex flex-col"}`}>
          {listPanel}
        </div>
        {/* Right: chat */}
        <div className={`flex-1 ${mobileShowChat ? "flex flex-col" : "hidden lg:flex lg:flex-col"}`}>
          {chatPanel}
        </div>
      </div>

      {/* New conversation modal */}
      {showNewDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/[0.12] rounded-3xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-4 border-b border-white/[0.12] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white/90">Nieuw gesprek</h2>
              <button onClick={() => setShowNewDialog(false)} className="text-white/40 hover:text-white/70 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Behandelaar</label>
                <select
                  value={newPractitionerId}
                  onChange={(e) => setNewPractitionerId(e.target.value)}
                  className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-4 py-3 text-white/90 focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 outline-none appearance-none"
                >
                  <option value="" className="bg-[#1a1a2e]">Selecteer een behandelaar...</option>
                  {practitioners.map((p) => (
                    <option key={p.id} value={p.id} className="bg-[#1a1a2e]">
                      {p.name} ({p.role === "DENTIST" ? "Tandarts" : "Mondhygienist"})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Onderwerp</label>
                <input
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Bijv. Vraag over behandeling"
                  className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-4 py-3 text-white/90 placeholder:text-white/30 focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Bericht</label>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Typ uw bericht..."
                  rows={4}
                  className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-4 py-3 text-white/90 placeholder:text-white/30 resize-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 outline-none"
                />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-white/[0.12] flex justify-end gap-3">
              <button
                onClick={() => setShowNewDialog(false)}
                className="px-4 py-2.5 rounded-2xl text-sm text-white/50 hover:text-white/70 hover:bg-white/[0.06] transition-all"
              >
                Annuleren
              </button>
              <button
                onClick={handleCreateConversation}
                disabled={!newPractitionerId || !newSubject.trim() || !newMessage.trim() || isCreating}
                className="px-6 py-2.5 rounded-2xl text-sm font-medium bg-[#e8945a] hover:bg-[#d4864a] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-[#e8945a]/25"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Versturen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
