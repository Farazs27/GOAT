"use client";

import { useState, useCallback, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX } from "lucide-react";

// ---------- Voice Input Hook ----------
export function useVoiceInput(onTranscript: (text: string) => void) {
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const supported =
    typeof window !== "undefined" &&
    !!(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  const startListening = useCallback(() => {
    if (!supported) return;
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "nl-NL";
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("");
      onTranscript(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognition.onerror = () => {
      setIsListening(false);
      recognitionRef.current = null;
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [supported, onTranscript]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  return { supported, isListening, startListening, stopListening };
}

// ---------- TTS Hook ----------
export function useTTS() {
  const [enabled, setEnabled] = useState(false);

  const speak = useCallback(
    (text: string) => {
      if (!enabled || typeof window === "undefined" || !window.speechSynthesis)
        return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "nl-NL";
      window.speechSynthesis.speak(utterance);
    },
    [enabled]
  );

  const toggle = useCallback(() => setEnabled((v) => !v), []);

  return { enabled, toggle, speak };
}

// ---------- Voice Input Button ----------
export function VoiceInputButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const { supported, isListening, startListening, stopListening } =
    useVoiceInput(onTranscript);

  if (!supported) return null;

  return (
    <button
      type="button"
      onClick={isListening ? stopListening : startListening}
      className={`p-2.5 rounded-xl transition-all duration-200 ${
        isListening
          ? "text-[#e8945a] bg-[#e8945a]/20 animate-pulse"
          : "text-white/40 hover:text-white/70 hover:bg-white/[0.06]"
      }`}
      title={isListening ? "Stop opname" : "Spraak invoer"}
    >
      {isListening ? (
        <MicOff className="w-5 h-5" />
      ) : (
        <Mic className="w-5 h-5" />
      )}
    </button>
  );
}

// ---------- TTS Toggle Button ----------
export function TTSToggleButton({
  enabled,
  onToggle,
}: {
  enabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-2 rounded-xl transition-all duration-200 ${
        enabled
          ? "text-[#e8945a] bg-[#e8945a]/10"
          : "text-white/30 hover:text-white/50 hover:bg-white/[0.04]"
      }`}
      title={enabled ? "Voorlezen uit" : "Voorlezen aan"}
    >
      {enabled ? (
        <Volume2 className="w-4 h-4" />
      ) : (
        <VolumeX className="w-4 h-4" />
      )}
    </button>
  );
}
