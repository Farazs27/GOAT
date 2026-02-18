'use client';

import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';

interface CareNote {
  id: string;
  createdAt: string;
  authorName: string;
  homeCareInstructions: string;
  nextVisitRecommendation: string;
}

export default function CareNotesPage() {
  const [notes, setNotes] = useState<CareNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('patient_token');
    if (!token) return;

    fetch('/api/patient-portal/hygienist-notes', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setNotes(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#e8945a] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Heart className="w-6 h-6 text-[#e8945a]" />
        <h1 className="text-2xl font-bold text-white/90">Verzorgingsadvies</h1>
      </div>

      {notes.length === 0 ? (
        <div
          className="rounded-2xl p-8 text-center"
          style={{
            background: 'rgba(255, 255, 255, 0.06)',
            backdropFilter: 'blur(40px)',
            WebkitBackdropFilter: 'blur(40px)',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Heart className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Nog geen verzorgingsadvies beschikbaar</p>
        </div>
      ) : (
        <div className="space-y-4">
          {notes.map((note) => (
            <div
              key={note.id}
              className="rounded-2xl p-6 transition-all duration-300 hover:bg-white/[0.09] hover:border-white/[0.18]"
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                backdropFilter: 'blur(40px)',
                WebkitBackdropFilter: 'blur(40px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-medium text-[#e8945a]">{note.authorName}</span>
                <span className="text-xs text-white/40">
                  {new Date(note.createdAt).toLocaleDateString('nl-NL', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>

              {note.homeCareInstructions && (
                <div className="mb-3">
                  <p className="text-xs text-white/40 mb-1">Thuiszorg instructies</p>
                  <p className="text-sm text-white/80 leading-relaxed">{note.homeCareInstructions}</p>
                </div>
              )}

              {note.nextVisitRecommendation && (
                <div>
                  <p className="text-xs text-white/40 mb-1">Aanbeveling volgend bezoek</p>
                  <p className="text-sm text-white/80 leading-relaxed">{note.nextVisitRecommendation}</p>
                </div>
              )}

              {!note.homeCareInstructions && !note.nextVisitRecommendation && (
                <p className="text-sm text-white/30 italic">Nog geen details toegevoegd</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
