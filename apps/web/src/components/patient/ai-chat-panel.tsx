"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Sun, ThumbsUp, ThumbsDown } from "lucide-react";
import { VoiceInputButton, useTTS, TTSToggleButton } from "./ai-voice-controls";

interface ChatMessage {
  id?: string;
  role: "user" | "assistant";
  content: string;
  richCards?: any;
  feedback?: string | null;
  createdAt?: string;
}

interface AiChatPanelProps {
  sessionId?: string | null;
  onSessionCreated?: (id: string) => void;
  currentPage?: string;
  initialMessages?: ChatMessage[];
  autoSendText?: string | null;
}

export default function AiChatPanel({
  sessionId: sessionIdProp,
  onSessionCreated,
  currentPage,
  initialMessages,
  autoSendText,
}: AiChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(sessionIdProp || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const tts = useTTS();

  // Sync prop changes
  useEffect(() => {
    setSessionId(sessionIdProp || null);
  }, [sessionIdProp]);

  useEffect(() => {
    if (initialMessages) setMessages(initialMessages);
  }, [initialMessages]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = useCallback(
    async (text?: string) => {
      const msg = (text || input).trim();
      if (!msg || isStreaming) return;
      if (!text) setInput("");

      const userMsg: ChatMessage = { role: "user", content: msg };
      const assistantMsg: ChatMessage = { role: "assistant", content: "" };
      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsStreaming(true);

      try {
        const token = localStorage.getItem("patient_token");
        const res = await fetch("/api/patient-portal/ai-chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ message: msg, sessionId, currentPage }),
        });

        if (!res.ok || !res.body) {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: "Er ging iets mis. Probeer het opnieuw.",
            };
            return copy;
          });
          setIsStreaming(false);
          return;
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        let fullText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            const match = line.match(/^data:\s*(.+)$/m);
            if (!match) continue;
            try {
              const data = JSON.parse(match[1]);
              if (data.done) {
                if (data.sessionId && data.sessionId !== sessionId) {
                  setSessionId(data.sessionId);
                  onSessionCreated?.(data.sessionId);
                }
              } else if (data.text) {
                fullText += data.text;
                const captured = fullText;
                setMessages((prev) => {
                  const copy = [...prev];
                  copy[copy.length - 1] = {
                    ...copy[copy.length - 1],
                    content: captured,
                    id: data.messageId || copy[copy.length - 1].id,
                  };
                  return copy;
                });
              }
            } catch {
              // skip parse errors
            }
          }
        }

        // TTS
        if (fullText) tts.speak(fullText);
      } catch {
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "Verbinding mislukt. Probeer het opnieuw.",
          };
          return copy;
        });
      } finally {
        setIsStreaming(false);
      }
    },
    [input, isStreaming, sessionId, currentPage, onSessionCreated, tts]
  );

  // Auto-send on mount if autoSendText provided
  const autoSentRef = useRef(false);
  useEffect(() => {
    if (autoSendText && !autoSentRef.current) {
      autoSentRef.current = true;
      sendMessage(autoSendText);
    }
  }, [autoSendText, sendMessage]);

  const handleFeedback = async (messageId: string, type: "thumbs_up" | "thumbs_down") => {
    const token = localStorage.getItem("patient_token");
    await fetch("/api/patient-portal/ai-chat/feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ messageId, feedback: type }),
    }).catch(() => {});

    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, feedback: type } : m))
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with TTS toggle */}
      <div className="flex items-center justify-end px-4 py-2 border-b border-white/[0.06]">
        <TTSToggleButton enabled={tts.enabled} onToggle={tts.toggle} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex gap-3 max-w-[85%]">
              {msg.role === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-[#e8945a]/20 mt-1">
                  <Sun className="w-4 h-4 text-[#e8945a]" />
                </div>
              )}
              <div>
                <div
                  className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-[#e8945a]/20 border border-[#e8945a]/30 text-white/90"
                      : "bg-white/[0.06] backdrop-blur-2xl border border-white/[0.12] text-white/80"
                  }`}
                >
                  {msg.content ||
                    (isStreaming && i === messages.length - 1 ? (
                      <span className="inline-flex gap-1">
                        <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                    ) : null)}
                </div>
                {/* Feedback buttons */}
                {msg.role === "assistant" && msg.content && msg.id && (
                  <div className="flex gap-1 mt-1 ml-1">
                    <button
                      onClick={() => handleFeedback(msg.id!, "thumbs_up")}
                      className={`p-1 rounded-lg transition-all ${
                        msg.feedback === "thumbs_up"
                          ? "text-[#e8945a]"
                          : "text-white/20 hover:text-white/50"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(msg.id!, "thumbs_down")}
                      className={`p-1 rounded-lg transition-all ${
                        msg.feedback === "thumbs_down"
                          ? "text-red-400"
                          : "text-white/20 hover:text-white/50"
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pb-4 pt-2 border-t border-white/[0.06]">
        <div className="flex items-end gap-2 bg-white/[0.05] border border-white/[0.12] rounded-2xl px-3 py-2 backdrop-blur-xl focus-within:border-[#e8945a]/50 focus-within:ring-2 focus-within:ring-[#e8945a]/20 transition-all">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel een vraag..."
            rows={1}
            className="flex-1 bg-transparent text-white/90 placeholder-white/30 text-sm resize-none outline-none max-h-32"
            style={{ minHeight: "36px" }}
          />
          <VoiceInputButton onTranscript={(t) => setInput(t)} />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isStreaming}
            className="p-2.5 rounded-xl bg-[#e8945a] hover:bg-[#d4864a] text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#e8945a]/25"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
