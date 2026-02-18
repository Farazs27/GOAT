'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Mic, MicOff, Check, X } from 'lucide-react';

interface VoiceInputResult {
  tooth: number;
  values: [number, number, number, number, number, number];
}

interface VoiceInputButtonProps {
  onResult: (result: VoiceInputResult) => void;
}

export function parsePerioVoiceInput(transcript: string): VoiceInputResult | null {
  const pattern = /(?:tooth|tand)\s*(\d{2})\s*:?\s*([\d\s]+)/i;
  const match = transcript.match(pattern);
  if (!match) return null;

  const tooth = parseInt(match[1], 10);
  if (tooth < 11 || tooth > 48) return null;

  const nums = match[2].trim().split(/\s+/).map(Number);
  if (nums.length !== 6 || nums.some(isNaN)) return null;

  return {
    tooth,
    values: nums as [number, number, number, number, number, number],
  };
}

// Extend Window for webkit prefix
interface SpeechRecognitionEvent {
  results: { [index: number]: { [index: number]: { transcript: string }; isFinal: boolean }; length: number };
  resultIndex: number;
}

export default function VoiceInputButton({ onResult }: VoiceInputButtonProps) {
  const [isSupported, setIsSupported] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState('');
  const [feedback, setFeedback] = useState<{ success: boolean; text: string } | null>(null);
  const recognitionRef = useRef<unknown>(null);
  const feedbackTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setIsSupported(false);
    }
    return () => {
      if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
    };
  }, []);

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = 'nl-NL';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }

      if (interim) setInterimText(interim);

      if (final) {
        setInterimText('');
        const parsed = parsePerioVoiceInput(final);
        if (parsed) {
          setFeedback({ success: true, text: `Tand ${parsed.tooth}: ${parsed.values.join(' ')}` });
          onResult(parsed);
        } else {
          setFeedback({ success: false, text: 'Niet herkend' });
        }
        if (feedbackTimeoutRef.current) clearTimeout(feedbackTimeoutRef.current);
        feedbackTimeoutRef.current = setTimeout(() => setFeedback(null), 3000);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimText('');
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
    setFeedback(null);
  }, [onResult]);

  const stopListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = recognitionRef.current as any;
    if (recognition) {
      recognition.stop();
    }
    setIsListening(false);
    setInterimText('');
  }, []);

  if (!isSupported) {
    return (
      <div className="relative group">
        <button
          disabled
          className="p-2 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-600 cursor-not-allowed"
        >
          <MicOff className="w-4 h-4" />
        </button>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-[10px] text-slate-300 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Spraakherkenning niet beschikbaar in deze browser
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isListening ? stopListening : startListening}
        className={`p-2 rounded-xl border transition-all ${
          isListening
            ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse ring-2 ring-red-500/30'
            : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:bg-slate-700/50 hover:text-slate-200'
        }`}
      >
        {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
      </button>

      {/* Interim text */}
      {isListening && interimText && (
        <span className="text-[10px] text-slate-400 italic max-w-40 truncate">{interimText}</span>
      )}

      {/* Feedback */}
      {feedback && (
        <span className={`flex items-center gap-1 text-[10px] font-semibold ${feedback.success ? 'text-emerald-400' : 'text-red-400'}`}>
          {feedback.success ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
          {feedback.text}
        </span>
      )}
    </div>
  );
}
