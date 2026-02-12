"use client";

import { useState } from "react";
import {
  Mail,
  RefreshCw,
  Plus,
  Search,
  Star,
  Archive,
  MoreVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmailPage() {
  const [isConnected] = useState(false);

  if (!isConnected) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Mail className="w-10 h-10 text-[var(--accent)]" />
          </div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
            Gmail Koppelen
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Verbind uw Gmail-account om e-mails te verzenden en ontvangen via
            NEXIOM.
          </p>
          <Button
            className="bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white"
            onClick={() => (window.location.href = "/api/gmail/oauth/connect")}
          >
            <Mail className="w-4 h-4 mr-2" />
            Gmail Verbinden
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left Sidebar - Labels */}
      <div className="w-56 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-4">
        <Button className="w-full bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white mb-4">
          <Plus className="w-4 h-4 mr-2" />
          Nieuw Bericht
        </Button>

        <nav className="space-y-1">
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-primary)] bg-[var(--accent)]/10">
            <Mail className="w-4 h-4" />
            Postvak IN
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]">
            <Star className="w-4 h-4" />
            Met ster
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-card-hover)]">
            <Archive className="w-4 h-4" />
            Verzonden
          </button>
        </nav>
      </div>

      {/* Center - Thread List */}
      <div className="flex-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Zoeken in e-mails..."
              className="w-full glass-input rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
            />
          </div>
          <Button variant="ghost" size="sm">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          <div className="text-center text-[var(--text-secondary)] py-12">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Geen e-mails gevonden</p>
            <p className="text-sm opacity-70 mt-1">
              Synchroniseer om uw e-mails te laden
            </p>
          </div>
        </div>
      </div>

      {/* Right - Thread Detail */}
      <div className="flex-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] p-6">
        <div className="h-full flex items-center justify-center text-[var(--text-secondary)]">
          <div className="text-center">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Selecteer een e-mail om te bekijken</p>
          </div>
        </div>
      </div>
    </div>
  );
}
