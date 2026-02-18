"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { authFetch } from "@/lib/auth-fetch";
import {
  Send,
  Plus,
  Users,
  Search,
  X,
  Check,
  MessageSquare,
} from "lucide-react";

interface ChatMember {
  id: string;
  name: string;
  role: string;
}

interface ChatPreview {
  id: string;
  name: string;
  isGroup: boolean;
  members: ChatMember[];
  lastMessage: {
    content: string;
    senderName: string;
    createdAt: string;
  } | null;
  unreadCount: number;
  updatedAt: string;
}

interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; role: string };
}

interface StaffUser {
  id: string;
  name: string;
  role: string;
  email: string;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0)
    return d.toLocaleTimeString("nl-NL", { hour: "2-digit", minute: "2-digit" });
  if (diffDays === 1) return "Gisteren";
  if (diffDays < 7)
    return d.toLocaleDateString("nl-NL", { weekday: "short" });
  return d.toLocaleDateString("nl-NL", { day: "numeric", month: "short" });
}

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const ROLE_LABELS: Record<string, string> = {
  DENTIST: "Tandarts",
  HYGIENIST: "Mondhygienist",
  ASSISTANT: "Assistent",
  PRACTICE_ADMIN: "Praktijkbeheerder",
  ADMIN: "Admin",
};

export default function TeamChatPage() {
  const [chats, setChats] = useState<ChatPreview[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string[]>([]);
  const [groupName, setGroupName] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [staffSearch, setStaffSearch] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Get current user
  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem("user") || "{}");
      setCurrentUserId(user.id || "");
    } catch {}
  }, []);

  // Fetch chats
  const fetchChats = useCallback(async () => {
    try {
      const res = await authFetch("/api/staff-chat");
      if (res.ok) {
        const data = await res.json();
        setChats(data);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchChats();
    const interval = setInterval(fetchChats, 5000);
    return () => clearInterval(interval);
  }, [fetchChats]);

  // Fetch messages for active chat
  const fetchMessages = useCallback(async () => {
    if (!activeChatId) return;
    try {
      const res = await authFetch(`/api/staff-chat/${activeChatId}/messages`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch {}
  }, [activeChatId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Mark as read when opening chat
  useEffect(() => {
    if (!activeChatId) return;
    authFetch(`/api/staff-chat/${activeChatId}/read`, { method: "POST" }).catch(
      () => {}
    );
  }, [activeChatId]);

  // Auto-scroll
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleScroll = () => {
    const el = messagesContainerRef.current;
    if (el) {
      isAtBottomRef.current =
        el.scrollHeight - el.scrollTop - el.clientHeight < 50;
    }
  };

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim() || !activeChatId) return;
    const content = newMessage.trim();
    setNewMessage("");
    try {
      await authFetch(`/api/staff-chat/${activeChatId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      fetchMessages();
      fetchChats();
    } catch {}
  };

  // Fetch staff for new chat
  const openNewChat = async () => {
    setShowNewChat(true);
    setSelectedStaff([]);
    setGroupName("");
    setStaffSearch("");
    try {
      const res = await authFetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        const users = Array.isArray(data) ? data : data.users || [];
        setStaffList(
          users.filter((u: StaffUser) => u.id !== currentUserId)
        );
      }
    } catch {}
  };

  // Create chat
  const createChat = async () => {
    if (selectedStaff.length === 0) return;
    try {
      const isGroup = selectedStaff.length > 1;
      const res = await authFetch("/api/staff-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberIds: selectedStaff,
          name: isGroup ? groupName || undefined : undefined,
          isGroup,
        }),
      });
      if (res.ok) {
        const chat = await res.json();
        setShowNewChat(false);
        setActiveChatId(chat.id);
        fetchChats();
      }
    } catch {}
  };

  const activeChat = chats.find((c) => c.id === activeChatId);
  const filteredStaff = staffList.filter(
    (s) =>
      s.name.toLowerCase().includes(staffSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(staffSearch.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] gap-4">
      {/* Left Panel: Chat List */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Team Chat
          </h2>
          <button
            onClick={openNewChat}
            className="p-2 rounded-xl hover:bg-white/[0.08] transition-all"
            title="Nieuw gesprek"
          >
            <Plus className="h-5 w-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {chats.length === 0 && (
            <div className="p-8 text-center text-[var(--text-muted)]">
              <MessageSquare className="h-10 w-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Nog geen gesprekken</p>
              <p className="text-xs mt-1">Start een nieuw gesprek</p>
            </div>
          )}
          {chats.map((chat) => (
            <button
              key={chat.id}
              onClick={() => setActiveChatId(chat.id)}
              className={`w-full text-left px-4 py-3 flex items-center gap-3 transition-all duration-200 border-b border-white/[0.04] ${
                activeChatId === chat.id
                  ? "bg-white/[0.10] border-l-2 border-l-[#e8945a]"
                  : "hover:bg-white/[0.06]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  chat.isGroup
                    ? "bg-[#e8945a]/20 text-[#e8945a]"
                    : "bg-white/[0.10] text-[var(--text-secondary)]"
                }`}
              >
                {chat.isGroup ? (
                  <Users className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">
                    {getInitials(chat.name || "?")}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-[var(--text-primary)] truncate">
                    {chat.name}
                  </span>
                  {chat.lastMessage && (
                    <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0 ml-2">
                      {formatTime(chat.lastMessage.createdAt)}
                    </span>
                  )}
                </div>
                {chat.lastMessage && (
                  <p className="text-xs text-[var(--text-muted)] truncate mt-0.5">
                    <span className="text-[var(--text-tertiary)]">
                      {chat.lastMessage.senderName}:
                    </span>{" "}
                    {chat.lastMessage.content}
                  </p>
                )}
              </div>
              {chat.unreadCount > 0 && (
                <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-[#e8945a] text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                  {chat.unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Right Panel: Conversation */}
      <div className="flex-1 flex flex-col bg-white/[0.06] backdrop-blur-2xl shadow-xl shadow-black/10 border border-white/[0.12] rounded-2xl overflow-hidden">
        {!activeChatId ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-[var(--text-muted)]">
              <MessageSquare className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p className="text-lg font-medium">Selecteer een gesprek</p>
              <p className="text-sm mt-1">
                Of start een nieuw gesprek met het + icoon
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-white/[0.08] flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  activeChat?.isGroup
                    ? "bg-[#e8945a]/20 text-[#e8945a]"
                    : "bg-white/[0.10] text-[var(--text-secondary)]"
                }`}
              >
                {activeChat?.isGroup ? (
                  <Users className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">
                    {getInitials(activeChat?.name || "?")}
                  </span>
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                  {activeChat?.name}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {activeChat?.members.map((m) => m.name).join(", ")}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              onScroll={handleScroll}
              className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3"
            >
              {messages.map((msg) => {
                const isOwn = msg.senderId === currentUserId;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                        isOwn
                          ? "bg-[#e8945a]/90 text-white"
                          : "bg-white/[0.08] border border-white/[0.10] text-[var(--text-primary)]"
                      }`}
                    >
                      {!isOwn && activeChat?.isGroup && (
                        <p className="text-[10px] font-semibold text-[#e8945a] mb-0.5">
                          {msg.sender.name}
                        </p>
                      )}
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {msg.content}
                      </p>
                      <p
                        className={`text-[10px] mt-1 ${
                          isOwn ? "text-white/60" : "text-[var(--text-muted)]"
                        }`}
                      >
                        {formatTime(msg.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      sendMessage();
                    }
                  }}
                  placeholder="Typ een bericht..."
                  className="flex-1 bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 transition-all"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="p-3 rounded-2xl bg-[#e8945a] hover:bg-[#d4864a] shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send className="h-5 w-5 text-white" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* New Chat Dialog */}
      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="w-[420px] max-h-[80vh] bg-[#1a1a2e]/95 backdrop-blur-2xl border border-white/[0.12] rounded-2xl shadow-2xl flex flex-col">
            <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Nieuw gesprek
              </h3>
              <button
                onClick={() => setShowNewChat(false)}
                className="p-2 rounded-xl hover:bg-white/[0.08] transition-all"
              >
                <X className="h-5 w-5 text-[var(--text-secondary)]" />
              </button>
            </div>

            <div className="p-4 border-b border-white/[0.06]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={staffSearch}
                  onChange={(e) => setStaffSearch(e.target.value)}
                  placeholder="Zoek collega..."
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl pl-9 pr-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#e8945a]/50"
                />
              </div>
            </div>

            {selectedStaff.length > 1 && (
              <div className="px-4 pt-3">
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Groepsnaam (optioneel)"
                  className="w-full bg-white/[0.05] border border-white/[0.12] rounded-xl px-4 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[#e8945a]/50"
                />
              </div>
            )}

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
              {/* Predefined groups */}
              {staffSearch === "" && (
                <div className="px-2 pb-2">
                  <p className="text-[10px] uppercase tracking-wider text-[var(--text-muted)] px-2 py-2">
                    Snelkeuze
                  </p>
                  {[
                    {
                      label: "Volledig Team",
                      filter: () => true,
                    },
                    {
                      label: "Mondhygienisten",
                      filter: (s: StaffUser) => s.role === "HYGIENIST",
                    },
                  ].map((preset) => {
                    const ids = staffList
                      .filter(preset.filter)
                      .map((s) => s.id);
                    return (
                      <button
                        key={preset.label}
                        onClick={() => {
                          setSelectedStaff(ids);
                          setGroupName(preset.label);
                        }}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-white/[0.06] flex items-center gap-3 transition-all"
                      >
                        <Users className="h-4 w-4 text-[#e8945a]" />
                        <span className="text-sm text-[var(--text-primary)]">
                          {preset.label}
                        </span>
                        <span className="text-xs text-[var(--text-muted)] ml-auto">
                          {ids.length} leden
                        </span>
                      </button>
                    );
                  })}
                  <div className="border-t border-white/[0.06] my-2" />
                </div>
              )}

              {filteredStaff.map((s) => {
                const selected = selectedStaff.includes(s.id);
                return (
                  <button
                    key={s.id}
                    onClick={() =>
                      setSelectedStaff((prev) =>
                        selected
                          ? prev.filter((id) => id !== s.id)
                          : [...prev, s.id]
                      )
                    }
                    className={`w-full text-left px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${
                      selected ? "bg-[#e8945a]/10" : "hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-white/[0.10] flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                      {getInitials(s.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {s.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {ROLE_LABELS[s.role] || s.role}
                      </p>
                    </div>
                    {selected && (
                      <Check className="h-4 w-4 text-[#e8945a] flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="p-4 border-t border-white/[0.08]">
              <button
                onClick={createChat}
                disabled={selectedStaff.length === 0}
                className="w-full py-3 rounded-2xl bg-[#e8945a] hover:bg-[#d4864a] shadow-lg shadow-[#e8945a]/25 text-white font-medium text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedStaff.length > 1
                  ? `Groep starten (${selectedStaff.length} leden)`
                  : selectedStaff.length === 1
                    ? "Gesprek starten"
                    : "Selecteer een collega"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
