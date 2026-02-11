"use client";

import { useState } from "react";
import { MessageSquare, Search, Send, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function WhatsAppPage() {
  const [isConfigured] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<
    string | null
  >(null);

  if (!isConfigured) {
    return (
      <div className="h-[calc(100vh-8rem)] flex flex-col items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)] mb-3">
            WhatsApp Koppelen
          </h2>
          <p className="text-[var(--text-secondary)] mb-6">
            Configureer Twilio om WhatsApp-berichten te verzenden en ontvangen
            met patiënten.
          </p>
          <Button
            className="bg-green-600 hover:bg-green-700 text-white"
            onClick={() => (window.location.href = "/settings")}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Naar Instellingen
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* Left - Conversations List */}
      <div className="w-80 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] flex flex-col">
        <div className="p-4 border-b border-[var(--border-color)]">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
            <input
              type="text"
              placeholder="Zoek gesprekken..."
              className="w-full glass-input rounded-lg pl-9 pr-3 py-2 text-sm outline-none"
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2">
          <div className="text-center text-[var(--text-secondary)] py-12">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>Geen gesprekken gevonden</p>
            <p className="text-sm opacity-70 mt-1">Start een nieuw gesprek</p>
          </div>
        </div>
      </div>

      {/* Right - Chat Area */}
      <div className="flex-1 bg-[var(--bg-card)] rounded-xl border border-[var(--border-color)] flex flex-col">
        {!selectedConversation ? (
          <div className="flex-1 flex items-center justify-center text-[var(--text-secondary)]">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Selecteer een gesprek</p>
              <p className="text-sm opacity-70 mt-2">
                of start een nieuw gesprek
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-[var(--border-color)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Phone className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <h3 className="font-medium text-[var(--text-primary)]">
                  Patient Name
                </h3>
                <p className="text-sm text-[var(--text-tertiary)]">
                  +31 6 12345678
                </p>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-auto p-4 space-y-4">
              <div className="text-center text-[var(--text-muted)] text-sm py-8">
                Start van het gesprek
              </div>
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-[var(--border-color)]">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Typ een bericht..."
                  className="flex-1 glass-input rounded-lg px-4 py-2 text-sm outline-none"
                />
                <Button className="bg-green-600 hover:bg-green-700 text-white">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
