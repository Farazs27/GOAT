'use client';

import { MessageSquare, Phone, Clock } from 'lucide-react';

export default function MessagesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white/95 mb-2">Berichten</h1>
        <p className="text-lg text-white/50">Communiceer met uw tandartspraktijk</p>
      </div>

      {/* Coming soon card */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#e8945a]/[0.06] via-transparent to-[#e8945a]/[0.03] pointer-events-none" />
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#e8945a]/15 to-[#d4783e]/15 flex items-center justify-center border border-[#e8945a]/20 mx-auto mb-6 shadow-lg shadow-[#e8945a]/10">
            <MessageSquare className="w-10 h-10 text-[#e8945a]/70" strokeWidth={1.5} />
          </div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">Binnenkort beschikbaar</h2>
          <p className="text-base text-white/50 max-w-md mx-auto mb-8">
            We werken aan een berichtensysteem waarmee u direct kunt communiceren met uw tandartspraktijk. Heeft u nu een vraag? Bel ons gerust.
          </p>

          <a
            href="tel:+31201234567"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-[#e8945a] to-[#d4783e] hover:from-[#f0a06a] hover:to-[#e8945a] text-white font-semibold text-lg shadow-lg shadow-[#e8945a]/20 transition-all"
          >
            <Phone className="w-5 h-5" />
            Bel de praktijk
          </a>
        </div>
      </div>

      {/* Mock message preview */}
      <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 opacity-60">
        <div className="flex items-center gap-2 mb-5">
          <Clock className="w-4 h-4 text-white/30" />
          <h3 className="text-sm font-semibold text-white/40 uppercase tracking-wider">Voorbeeld</h3>
        </div>
        <div className="space-y-4">
          {/* Mock message from practice */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e8945a]/20 to-[#d4783e]/20 flex items-center justify-center shrink-0 border border-[#e8945a]/15">
              <span className="text-xs font-bold text-[#e8945a]/80">TA</span>
            </div>
            <div className="max-w-[70%]">
              <div className="rounded-2xl rounded-tl-lg bg-white/[0.05] border border-white/[0.08] px-5 py-3">
                <p className="text-sm text-white/70">Goedemiddag! Vergeet u niet uw afspraak morgen om 10:00.</p>
              </div>
              <p className="text-xs text-white/25 mt-1.5 ml-1">Tandartspraktijk Amsterdam - 14:30</p>
            </div>
          </div>

          {/* Mock message from patient */}
          <div className="flex gap-3 justify-end">
            <div className="max-w-[70%]">
              <div className="rounded-2xl rounded-tr-lg bg-[#e8945a]/10 border border-[#e8945a]/20 px-5 py-3">
                <p className="text-sm text-[#e8945a]/80">Bedankt voor de herinnering! Ik ben er om 10:00.</p>
              </div>
              <p className="text-xs text-white/25 mt-1.5 mr-1 text-right">U - 15:02</p>
            </div>
          </div>

          {/* Third mock message */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#e8945a]/20 to-[#d4783e]/20 flex items-center justify-center shrink-0 border border-[#e8945a]/15">
              <span className="text-xs font-bold text-[#e8945a]/80">TA</span>
            </div>
            <div className="max-w-[70%]">
              <div className="rounded-2xl rounded-tl-lg bg-white/[0.05] border border-white/[0.08] px-5 py-3">
                <p className="text-sm text-white/70">Top! Tot morgen. Vergeet niet om nuchter te komen.</p>
              </div>
              <p className="text-xs text-white/25 mt-1.5 ml-1">Tandartspraktijk Amsterdam - 15:05</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
