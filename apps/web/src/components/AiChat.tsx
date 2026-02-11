'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { MessageCircle, X, Send, Bot, User, Loader2, Minimize2, Maximize2 } from 'lucide-react';
import { authFetch } from '@/lib/auth-fetch';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function AiChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Hallo! Ik ben uw AI-assistent. Stel me vragen over patiënten, behandelingen, afspraken of facturen. Bijvoorbeeld:\n\n• "Wat is de behandelgeschiedenis van Jan de Vries?"\n• "Heeft patiënt P001 openstaande facturen?"\n• "Welke afspraken heeft Maria Jansen?"' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: 'user', content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      // Send only conversation history (excluding the welcome message)
      const history = newMessages.filter((_, i) => i > 0).map(m => ({ role: m.role, content: m.content }));

      const res = await authFetch('/api/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ message: text, history }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Fout bij AI-verzoek');
      }

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Er is een fout opgetreden';
      setMessages(prev => [...prev, { role: 'assistant', content: `Fout: ${errorMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-2xl bg-[var(--accent)] text-white shadow-lg hover:bg-[var(--accent-hover)] transition-all duration-200 flex items-center justify-center hover:scale-105"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    );
  }

  const panelClasses = isExpanded
    ? 'fixed inset-4 z-50'
    : 'fixed bottom-6 right-6 z-50 w-[420px] h-[600px]';

  return (
    <div className={`${panelClasses} flex flex-col bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl shadow-2xl overflow-hidden`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[var(--bg-card)] border-b border-[var(--border-color)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
            <Bot className="h-4 w-4 text-[var(--accent)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">AI Assistent</h3>
            <p className="text-[10px] text-[var(--text-muted)]">Patiëntinformatie & meer</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            {isExpanded ? <Minimize2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" /> : <Maximize2 className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />}
          </button>
          <button
            onClick={() => { setIsOpen(false); setIsExpanded(false); }}
            className="w-7 h-7 rounded-lg flex items-center justify-center hover:bg-[var(--bg-card-hover)] transition-colors"
          >
            <X className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center ${
              msg.role === 'assistant'
                ? 'bg-[var(--accent-light)]'
                : 'bg-violet-500/10'
            }`}>
              {msg.role === 'assistant'
                ? <Bot className="h-3.5 w-3.5 text-[var(--accent)]" />
                : <User className="h-3.5 w-3.5 text-violet-500" />
              }
            </div>
            <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[var(--accent)] text-white'
                : 'bg-[var(--bg-card)] text-[var(--text-primary)] border border-[var(--border-color)]'
            }`}>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-2.5">
            <div className="w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center bg-[var(--accent-light)]">
              <Bot className="h-3.5 w-3.5 text-[var(--accent)]" />
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5">
              <Loader2 className="h-4 w-4 text-[var(--accent)] animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-[var(--border-color)] bg-[var(--bg-card)]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Stel een vraag over een patiënt..."
            disabled={loading}
            className="flex-1 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-3.5 py-2.5 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] outline-none focus:border-[var(--accent)] transition-colors disabled:opacity-50"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-10 h-10 rounded-xl bg-[var(--accent)] text-white flex items-center justify-center hover:bg-[var(--accent-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
