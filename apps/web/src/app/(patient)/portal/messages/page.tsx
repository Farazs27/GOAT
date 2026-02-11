"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Send,
  Loader2,
  MessageSquare,
  Phone,
  AlertCircle,
  Check,
  CheckCheck,
} from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderType: "PATIENT" | "STAFF";
  senderName: string;
  isRead: boolean;
  createdAt: string;
}

function formatDutchDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const messageDate = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.floor(
    (today.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24),
  );

  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  if (diffDays === 0) {
    return `Vandaag ${hours}:${minutes}`;
  } else if (diffDays === 1) {
    return `Gisteren ${hours}:${minutes}`;
  } else if (diffDays < 7) {
    const days = [
      "zondag",
      "maandag",
      "dinsdag",
      "woensdag",
      "donderdag",
      "vrijdag",
      "zaterdag",
    ];
    return `${days[date.getDay()]} ${hours}:${minutes}`;
  } else {
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    return `${day}-${month} ${hours}:${minutes}`;
  }
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  const days = [
    "zondag",
    "maandag",
    "dinsdag",
    "woensdag",
    "donderdag",
    "vrijdag",
    "zaterdag",
  ];
  const months = [
    "januari",
    "februari",
    "maart",
    "april",
    "mei",
    "juni",
    "juli",
    "augustus",
    "september",
    "oktober",
    "november",
    "december",
  ];

  return `${days[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function shouldShowDateSeparator(
  current: Message,
  previous: Message | null,
): boolean {
  if (!previous) return true;

  const currentDate = new Date(current.createdAt);
  const previousDate = new Date(previous.createdAt);

  return (
    currentDate.getDate() !== previousDate.getDate() ||
    currentDate.getMonth() !== previousDate.getMonth() ||
    currentDate.getFullYear() !== previousDate.getFullYear()
  );
}

export default function MessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [practiceName, setPracticeName] = useState("Tandartspraktijk");
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch messages
  const fetchMessages = useCallback(async () => {
    try {
      const token = localStorage.getItem("patient_token");
      if (!token) {
        setError("Niet ingelogd");
        setIsLoading(false);
        return;
      }

      const response = await fetch("/api/patient-portal/messages", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Kon berichten niet laden");
      }

      const data = await response.json();
      setMessages(data.messages);
      setPracticeName(data.practiceName);
      setUnreadCount(data.unreadCount);
      setError(null);
    } catch (err) {
      setError("Er is een fout opgetreden bij het laden van berichten");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // Poll for new messages every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchMessages();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchMessages]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      const unreadMessages = messages.filter(
        (m) => m.senderType === "STAFF" && !m.isRead,
      );

      for (const message of unreadMessages) {
        try {
          const token = localStorage.getItem("patient_token");
          await fetch(`/api/patient-portal/messages/${message.id}/read`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
        } catch {
          // Silent fail - will retry on next poll
        }
      }
    };

    if (messages.length > 0) {
      markAsRead();
    }
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    const content = inputValue.trim();
    if (!content || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const token = localStorage.getItem("patient_token");
      const response = await fetch("/api/patient-portal/messages", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Kon bericht niet versturen");
      }

      const newMessage = await response.json();
      setMessages((prev) => [...prev, newMessage]);
      setInputValue("");
      inputRef.current?.focus();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Kon bericht niet versturen",
      );
    } finally {
      setIsSending(false);
    }
  };

  // Handle key press (Enter to send, Shift+Enter for new line)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-white/95 mb-2">Berichten</h1>
          <p className="text-lg text-white/50">
            Communiceer met uw tandartspraktijk
          </p>
        </div>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] lg:h-[calc(100vh-80px)] flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white/95 mb-2">Berichten</h1>
            <p className="text-lg text-white/50">
              Communiceer met uw tandartspraktijk
            </p>
          </div>
          {unreadCount > 0 && (
            <div className="bg-[#e8945a] text-white px-4 py-2 rounded-full text-sm font-medium">
              {unreadCount} ongelezen
            </div>
          )}
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-center gap-3 text-red-300 flex-shrink-0">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Chat container */}
      <div className="flex-1 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-3xl flex flex-col overflow-hidden min-h-0 shadow-xl shadow-black/10">
        {/* Practice header */}
        <div className="px-6 py-4 border-b border-white/[0.12] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e8945a]/20 to-[#d4783e]/20 flex items-center justify-center border border-[#e8945a]/15">
              <span className="text-sm font-bold text-[#e8945a]">
                {practiceName
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .substring(0, 2)
                  .toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="font-semibold text-white/90">{practiceName}</h2>
              <p className="text-xs text-white/40">
                {messages.length > 0
                  ? `${messages.length} bericht${messages.length !== 1 ? "en" : ""}`
                  : "Start een gesprek"}
              </p>
            </div>
          </div>
        </div>

        {/* Messages area */}
        <div
          ref={containerRef}
          className="flex-1 overflow-y-auto px-4 lg:px-6 py-4 space-y-4"
        >
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-[#e8945a]/10 flex items-center justify-center border border-[#e8945a]/20 mb-4">
                <MessageSquare className="w-8 h-8 text-[#e8945a]/60" />
              </div>
              <h3 className="text-lg font-medium text-white/70 mb-2">
                Nog geen berichten
              </h3>
              <p className="text-sm text-white/40 max-w-sm">
                Stuur een bericht naar {practiceName}. U kunt hier terecht voor
                vragen over afspraken, behandelingen of andere zaken.
              </p>
            </div>
          ) : (
            messages.map((message, index) => {
              const prevMessage = index > 0 ? messages[index - 1] : null;
              const showDateSeparator = shouldShowDateSeparator(
                message,
                prevMessage,
              );
              const isOwn = message.senderType === "PATIENT";

              return (
                <div key={message.id}>
                  {/* Date separator */}
                  {showDateSeparator && (
                    <div className="flex items-center justify-center my-6">
                      <div className="bg-white/[0.06] backdrop-blur-2xl px-4 py-1.5 rounded-full border border-white/[0.12]">
                        <span className="text-xs text-white/40 font-medium">
                          {formatFullDate(message.createdAt)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Message bubble */}
                  <div className={`flex gap-3 ${isOwn ? "justify-end" : ""}`}>
                    {!isOwn && (
                      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#e8945a]/20 to-[#d4783e]/20 flex items-center justify-center shrink-0 border border-[#e8945a]/15">
                        <span className="text-xs font-bold text-[#e8945a]">
                          {message.senderName
                            .split(" ")
                            .map((w) => w[0])
                            .join("")
                            .substring(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                    )}

                    <div
                      className={`max-w-[80%] lg:max-w-[70%] ${isOwn ? "order-first" : ""}`}
                    >
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          isOwn
                            ? "bg-[#e8945a] text-white rounded-tr-lg shadow-lg shadow-[#e8945a]/25"
                            : "bg-white/[0.06] border border-white/[0.12] backdrop-blur-2xl text-white/90 rounded-tl-lg"
                        }`}
                      >
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">
                          {message.content}
                        </p>
                      </div>
                      <div
                        className={`flex items-center gap-1.5 mt-1.5 ${isOwn ? "justify-end" : ""}`}
                      >
                        <span className="text-xs text-white/30">
                          {formatDutchDate(message.createdAt)}
                        </span>
                        {isOwn &&
                          (message.isRead ? (
                            <CheckCheck className="w-3.5 h-3.5 text-[#e8945a]" />
                          ) : (
                            <Check className="w-3.5 h-3.5 text-white/30" />
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="px-4 lg:px-6 py-4 border-t border-white/[0.12] bg-white/[0.04] flex-shrink-0">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Typ uw bericht..."
                disabled={isSending}
                rows={1}
                className="w-full bg-white/[0.05] border border-white/[0.12] backdrop-blur-xl rounded-2xl px-4 py-3 pr-12 text-white/90 placeholder:text-white/30 resize-none focus:border-[#e8945a]/50 focus:ring-2 focus:ring-[#e8945a]/20 outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                style={{ minHeight: "48px", maxHeight: "120px" }}
              />
              <div className="absolute bottom-3 right-3 text-xs text-white/20 pointer-events-none">
                {inputValue.length}/2000
              </div>
            </div>
            <button
              onClick={handleSend}
              disabled={!inputValue.trim() || isSending}
              className="flex-shrink-0 h-12 w-12 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-[#e8945a] disabled:hover:to-[#d4783e] flex items-center justify-center transition-all shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 text-white animate-spin" />
              ) : (
                <Send className="w-5 h-5 text-white" />
              )}
            </button>
          </div>
          <p className="text-xs text-white/30 mt-2 ml-1">
            Druk op Enter om te versturen, Shift+Enter voor een nieuwe regel
          </p>
        </div>
      </div>

      {/* Contact info */}
      <div className="flex-shrink-0 bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] rounded-2xl p-4 shadow-xl shadow-black/10 hover:bg-white/[0.09] hover:border-white/[0.18] transition-all duration-300">
        <div className="flex items-center gap-3 text-white/50">
          <Phone className="w-4 h-4" />
          <p className="text-sm">
            Liever bellen? Bel de praktijk direct voor spoedgevallen of
            dringende vragen.
          </p>
        </div>
      </div>
    </div>
  );
}
