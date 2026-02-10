'use client';

export default function MessagesPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white/95 mb-2">Berichten</h1>
        <p className="text-lg text-white/50">Communiceer met uw tandartspraktijk</p>
      </div>

      {/* Coming soon card */}
      <div className="patient-glass-card rounded-3xl p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-gradient-to-br from-teal-500/5 via-transparent to-purple-500/5 pointer-events-none" />
        <div className="relative z-10">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-teal-400/15 to-cyan-400/15 flex items-center justify-center border border-teal-400/15 mx-auto mb-6">
            <svg className="w-10 h-10 text-teal-300/60" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">Berichtenfunctie binnenkort beschikbaar</h2>
          <p className="text-lg text-white/50 max-w-md mx-auto mb-8">
            Binnenkort kunt u direct berichten sturen naar uw tandartspraktijk. Heeft u nu een vraag? Bel ons gerust.
          </p>

          <a
            href="tel:+31201234567"
            className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-white font-semibold text-lg shadow-lg shadow-teal-500/20 transition-all"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
            </svg>
            Bel de praktijk
          </a>
        </div>
      </div>

      {/* Mock message preview */}
      <div className="patient-glass-card rounded-3xl p-8 opacity-50">
        <h3 className="text-lg font-semibold text-white/70 mb-4">Hoe het eruit zal zien</h3>
        <div className="space-y-4">
          {/* Mock message from practice */}
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-400/20 to-blue-500/20 flex items-center justify-center shrink-0 border border-blue-400/15">
              <span className="text-xs font-bold text-blue-300">TA</span>
            </div>
            <div className="max-w-[70%]">
              <div className="rounded-2xl rounded-tl-lg bg-white/5 border border-white/8 px-5 py-3">
                <p className="text-base text-white/70">Goedemiddag! Vergeet u niet uw afspraak morgen om 10:00.</p>
              </div>
              <p className="text-xs text-white/30 mt-1 ml-1">Tandartspraktijk Amsterdam - 14:30</p>
            </div>
          </div>

          {/* Mock message from patient */}
          <div className="flex gap-3 justify-end">
            <div className="max-w-[70%]">
              <div className="rounded-2xl rounded-tr-lg bg-teal-500/15 border border-teal-500/20 px-5 py-3">
                <p className="text-base text-teal-200">Bedankt voor de herinnering! Ik ben er om 10:00.</p>
              </div>
              <p className="text-xs text-white/30 mt-1 mr-1 text-right">U - 15:02</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
