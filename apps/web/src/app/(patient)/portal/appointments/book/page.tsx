"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Clock,
  User,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  Stethoscope,
  Sparkles,
  MessageCircle,
  HeartPulse,
  ArrowRight,
} from "lucide-react";

// Appointment Type Definitions with Enhanced Descriptions
const appointmentTypes = [
  {
    id: "CHECKUP",
    label: "Controle",
    description: "Periodieke controle van uw gebit en tandvlees",
    duration: "30 min",
    durationMinutes: 30,
    icon: Stethoscope,
    color: "#e8945a",
  },
  {
    id: "TREATMENT",
    label: "Behandeling",
    description: "Tandheelkundige behandeling zoals vullen of trekken",
    duration: "45-60 min",
    durationMinutes: 60,
    icon: HeartPulse,
    color: "#e8945a",
  },
  {
    id: "CONSULTATION",
    label: "Consult",
    description: "Vrijblijvend gesprek over uw wensen",
    duration: "30 min",
    durationMinutes: 30,
    icon: MessageCircle,
    color: "#e8945a",
  },
  {
    id: "HYGIENE",
    label: "Mondhygiëne",
    description: "Professionele reiniging en poetsinstructie",
    duration: "45 min",
    durationMinutes: 45,
    icon: Sparkles,
    color: "#e8945a",
  },
  {
    id: "EMERGENCY",
    label: "Spoed",
    description: "Dringende hulp bij pijn of ongeval",
    duration: "30 min",
    durationMinutes: 30,
    icon: AlertCircle,
    color: "#ef4444",
  },
];

const steps = [
  { id: 1, label: "Type", description: "Kies afspraaktype" },
  { id: 2, label: "Datum", description: "Selecteer datum" },
  { id: 3, label: "Tijd", description: "Kies een tijdslot" },
  { id: 4, label: "Details", description: "Extra informatie" },
  { id: 5, label: "Bevestig", description: "Controleer en bevestig" },
];

function getMonthName(date: Date): string {
  return date.toLocaleDateString("nl-NL", { month: "long" });
}

function getWeekday(date: Date): string {
  return date.toLocaleDateString("nl-NL", { weekday: "long" });
}

function formatDateNL(date: Date): string {
  return date.toLocaleDateString("nl-NL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BookAppointmentPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(1);
  const [cardsAnimated, setCardsAnimated] = useState(false);

  // Selection states
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPractitioner, setSelectedPractitioner] = useState<
    string | null
  >(null);
  const [notes, setNotes] = useState("");

  // Data states
  const [availability, setAvailability] = useState<
    Record<
      string,
      { slots: string[]; practitioners: { id: string; name: string }[] }
    >
  >({});
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Trigger card animations after mount
    setTimeout(() => setCardsAnimated(true), 100);
  }, []);

  // Fetch availability when type or month changes
  useEffect(() => {
    if (selectedType) {
      fetchAvailability();
    }
  }, [selectedType, currentMonth]);

  const fetchAvailability = async () => {
    const startOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      1,
    );
    const endOfMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      0,
    );

    const token = localStorage.getItem("patient_token");
    setLoading(true);

    try {
      const response = await fetch(
        `/api/patient-portal/availability?startDate=${startOfMonth.toISOString().split("T")[0]}&endDate=${endOfMonth.toISOString().split("T")[0]}&type=${selectedType}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability);
      } else {
        setAvailability({});
      }
    } catch {
      setAvailability({});
    } finally {
      setLoading(false);
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setTimeout(() => setStep(2), 300);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setTimeout(() => setStep(3), 300);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setTimeout(() => setStep(4), 300);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedType) return;

    setSubmitting(true);
    setError(null);

    const token = localStorage.getItem("patient_token");

    try {
      const response = await fetch("/api/patient-portal/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          date: selectedDate.toISOString().split("T")[0],
          time: selectedTime,
          appointmentType: selectedType,
          practitionerId: selectedPractitioner,
          notes,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/portal/appointments");
        }, 2000);
      } else {
        const data = await response.json();
        setError(data.message || "Er is iets misgegaan");
      }
    } catch {
      setError("Er is iets misgegaan bij het boeken");
    } finally {
      setSubmitting(false);
    }
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateAvailable = (date: Date) => {
    const dateStr = date.toISOString().split("T")[0];
    return availability[dateStr] && availability[dateStr].slots.length > 0;
  };

  const isDateSelected = (date: Date) => {
    return (
      selectedDate?.toISOString().split("T")[0] ===
      date.toISOString().split("T")[0]
    );
  };

  const isPastDate = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const getAvailableSlots = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return availability[dateStr]?.slots || [];
  };

  const getAvailablePractitioners = () => {
    if (!selectedDate) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return availability[dateStr]?.practitioners || [];
  };

  const getSelectedTypeInfo = () => {
    return appointmentTypes.find((t) => t.id === selectedType);
  };

  const canProceedToConfirm = () => {
    return selectedType && selectedDate && selectedTime;
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div
          className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-12 text-center max-w-md"
          style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
        >
          <div className="w-20 h-20 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white/90 mb-3">
            Afspraak Geboekt!
          </h2>
          <p className="text-white/50 mb-6">
            Uw afspraak is succesvol ingepland. U wordt doorgestuurd naar uw
            afsprakenoverzicht.
          </p>
          <Link
            href="/portal/appointments"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e8945a]/15 border border-[#e8945a]/30 text-[#e8945a] font-medium hover:bg-[#e8945a]/25 transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
            Terug naar afspraken
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="space-y-6"
      style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/portal/appointments"
          className="p-2 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-all"
        >
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-white/95 mb-2">
            Afspraak Maken
          </h1>
          <p className="text-base text-white/40">
            Plan uw volgende afspraak in enkele stappen
          </p>
        </div>
      </div>

      {/* Progress Steps */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            const isClickable = step > s.id || (s.id === 1 && step === 1);

            return (
              <div key={s.id} className="flex items-center">
                <button
                  onClick={() => isClickable && setStep(s.id)}
                  disabled={!isClickable}
                  className={`flex flex-col items-center gap-2 transition-all ${
                    isClickable ? "cursor-pointer" : "cursor-default"
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                      isActive
                        ? "bg-[#e8945a] text-white shadow-[0_0_20px_rgba(232,148,90,0.4)]"
                        : isCompleted
                          ? "bg-[#e8945a]/30 text-[#e8945a] border border-[#e8945a]/50"
                          : "bg-white/[0.06] text-white/30 border border-white/[0.08]"
                    }`}
                  >
                    {isCompleted ? <Check className="w-5 h-5" /> : s.id}
                  </div>
                  <div className="hidden sm:flex flex-col items-center">
                    <span
                      className={`text-xs font-medium transition-colors ${
                        isActive
                          ? "text-[#e8945a]"
                          : isCompleted
                            ? "text-white/60"
                            : "text-white/30"
                      }`}
                    >
                      {s.label}
                    </span>
                    <span
                      className={`text-[10px] transition-colors ${
                        isActive
                          ? "text-white/50"
                          : isCompleted
                            ? "text-white/30"
                            : "text-white/20"
                      }`}
                    >
                      {s.description}
                    </span>
                  </div>
                </button>
                {index < steps.length - 1 && (
                  <div
                    className={`w-8 sm:w-12 md:w-16 h-px mx-2 sm:mx-3 transition-colors duration-300 ${
                      isCompleted ? "bg-[#e8945a]/50" : "bg-white/[0.08]"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Step 1: Appointment Type Selection */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-xl font-semibold text-white/90 mb-2">
              Welk type afspraak wilt u maken?
            </h2>
            <p className="text-white/40 text-sm">
              Kies het type dat het beste bij uw behoeften past
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {appointmentTypes.map((type, index) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              const isEmergency = type.id === "EMERGENCY";

              return (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 transform hover:scale-[1.02] ${
                    isSelected
                      ? isEmergency
                        ? "bg-red-500/10 border-red-500/50 shadow-[0_0_30px_rgba(239,68,68,0.2)]"
                        : "bg-white/[0.06] border-[#e8945a] shadow-[0_0_30px_rgba(232,148,90,0.15)]"
                      : "bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]"
                  }`}
                  style={{
                    opacity: cardsAnimated ? 1 : 0,
                    transform: cardsAnimated
                      ? "translateY(0)"
                      : "translateY(20px)",
                    transition: `all 0.5s ease ${index * 0.1}s`,
                  }}
                >
                  {/* Selected indicator */}
                  {isSelected && (
                    <div
                      className={`absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center ${
                        isEmergency ? "bg-red-500" : "bg-[#e8945a]"
                      }`}
                    >
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isSelected
                          ? isEmergency
                            ? "bg-red-500/20"
                            : "bg-[#e8945a]/20"
                          : "bg-white/[0.06] group-hover:bg-white/[0.1]"
                      }`}
                    >
                      <Icon
                        className={`w-7 h-7 transition-colors ${
                          isSelected
                            ? isEmergency
                              ? "text-red-400"
                              : "text-[#e8945a]"
                            : "text-white/50 group-hover:text-white/70"
                        }`}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3
                        className={`text-lg font-semibold mb-1 transition-colors ${
                          isSelected ? "text-white" : "text-white/80"
                        }`}
                      >
                        {type.label}
                      </h3>
                      <p
                        className={`text-sm mb-3 transition-colors ${
                          isSelected ? "text-white/60" : "text-white/40"
                        }`}
                      >
                        {type.description}
                      </p>

                      <div className="flex items-center gap-2">
                        <div
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            isSelected
                              ? isEmergency
                                ? "bg-red-500/20 text-red-300"
                                : "bg-[#e8945a]/20 text-[#e8945a]"
                              : "bg-white/[0.06] text-white/40"
                          }`}
                        >
                          <Clock className="w-3 h-3" />
                          {type.duration}
                        </div>
                        {isEmergency && (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                            <AlertCircle className="w-3 h-3" />
                            Direct
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover arrow */}
                  <div
                    className={`absolute bottom-4 right-4 transition-all duration-300 ${
                      isSelected
                        ? "opacity-100 translate-x-0"
                        : "opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                    }`}
                  >
                    <ArrowRight
                      className={`w-5 h-5 ${
                        isEmergency ? "text-red-400" : "text-[#e8945a]"
                      }`}
                    />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Date Selection */}
      {step === 2 && selectedType && (
        <div className="space-y-6">
          {/* Selected Type Summary */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 flex items-center gap-4">
            {(() => {
              const type = getSelectedTypeInfo();
              if (!type) return null;
              const Icon = type.icon;
              return (
                <>
                  <div className="w-12 h-12 rounded-xl bg-[#e8945a]/20 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-[#e8945a]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white/90 font-medium">{type.label}</h3>
                    <p className="text-white/40 text-sm">{type.description}</p>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-sm text-[#e8945a] hover:text-[#f0a06a] transition-colors"
                  >
                    Wijzigen
                  </button>
                </>
              );
            })()}
          </div>

          {/* Calendar */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-[#e8945a]" />
                <h3 className="text-lg font-semibold text-white/90">
                  Kies een Datum
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() - 1,
                      ),
                    )
                  }
                  className="p-2 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-white/70 font-medium min-w-[120px] text-center">
                  {getMonthName(currentMonth)} {currentMonth.getFullYear()}
                </span>
                <button
                  onClick={() =>
                    setCurrentMonth(
                      new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth() + 1,
                      ),
                    )
                  }
                  className="p-2 rounded-xl border border-white/[0.08] text-white/40 hover:text-white/70 hover:border-white/[0.15] transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
              </div>
            ) : (
              <>
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
                    <div
                      key={day}
                      className="text-center text-xs text-white/30 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {generateCalendarDays().map((date, index) => {
                    if (!date) {
                      return (
                        <div key={`empty-${index}`} className="aspect-square" />
                      );
                    }

                    const available = isDateAvailable(date);
                    const selected = isDateSelected(date);
                    const past = isPastDate(date);

                    return (
                      <button
                        key={date.toISOString()}
                        onClick={() =>
                          !past && available && handleDateSelect(date)
                        }
                        disabled={past || !available}
                        className={`aspect-square rounded-xl flex flex-col items-center justify-center gap-1 transition-all ${
                          selected
                            ? "bg-[#e8945a] text-white shadow-[0_0_15px_rgba(232,148,90,0.4)]"
                            : past
                              ? "text-white/20 cursor-not-allowed"
                              : available
                                ? "bg-white/[0.06] text-white/80 hover:bg-[#e8945a]/20 hover:text-[#e8945a]"
                                : "text-white/20 cursor-not-allowed"
                        }`}
                      >
                        <span className="text-sm font-medium">
                          {date.getDate()}
                        </span>
                        {available && !past && !selected && (
                          <div className="w-1.5 h-1.5 rounded-full bg-[#e8945a]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-4 mt-4 text-xs text-white/30">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#e8945a]" />
                    <span>Beschikbaar</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[#e8945a]" />
                    <span>Geselecteerd</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Time Selection */}
      {step === 3 && selectedDate && (
        <div className="space-y-6">
          {/* Selection Summary */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 space-y-3">
            {(() => {
              const type = getSelectedTypeInfo();
              if (!type) return null;
              const Icon = type.icon;
              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e8945a]/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#e8945a]" />
                    </div>
                    <div>
                      <p className="text-white/90 font-medium">{type.label}</p>
                      <p className="text-white/40 text-xs">{type.duration}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-[#e8945a] hover:text-[#f0a06a]"
                  >
                    Wijzigen
                  </button>
                </div>
              );
            })()}
            <div className="h-px bg-white/[0.08]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <p className="text-white/90 font-medium">
                    {formatDateNL(selectedDate)}
                  </p>
                  <p className="text-white/40 text-xs">
                    {getWeekday(selectedDate)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs text-[#e8945a] hover:text-[#f0a06a]"
              >
                Wijzigen
              </button>
            </div>
          </div>

          {/* Time Slots */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Clock className="w-5 h-5 text-[#e8945a]" />
              <h3 className="text-lg font-semibold text-white/90">
                Kies een Tijd
              </h3>
            </div>

            {getAvailableSlots().length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                {getAvailableSlots().map((slot) => (
                  <button
                    key={slot}
                    onClick={() => handleTimeSelect(slot)}
                    className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                      selectedTime === slot
                        ? "bg-[#e8945a] text-white shadow-[0_0_15px_rgba(232,148,90,0.4)]"
                        : "bg-white/[0.06] text-white/70 hover:bg-[#e8945a]/20 hover:text-[#e8945a]"
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
                <p className="text-white/40">
                  Geen beschikbare tijden op deze datum
                </p>
                <button
                  onClick={() => setStep(2)}
                  className="mt-4 text-sm text-[#e8945a] hover:text-[#f0a06a]"
                >
                  Kies een andere datum
                </button>
              </div>
            )}
          </div>

          {/* Practitioner Selection */}
          {selectedTime && getAvailablePractitioners().length > 0 && (
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <User className="w-5 h-5 text-[#e8945a]" />
                <h3 className="text-lg font-semibold text-white/90">
                  Behandelaar (optioneel)
                </h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedPractitioner(null)}
                  className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    selectedPractitioner === null
                      ? "bg-[#e8945a] text-white"
                      : "bg-white/[0.06] text-white/70 hover:bg-[#e8945a]/20 hover:text-[#e8945a]"
                  }`}
                >
                  Geen voorkeur
                </button>
                {getAvailablePractitioners().map((practitioner) => (
                  <button
                    key={practitioner.id}
                    onClick={() => setSelectedPractitioner(practitioner.id)}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedPractitioner === practitioner.id
                        ? "bg-[#e8945a] text-white"
                        : "bg-white/[0.06] text-white/70 hover:bg-[#e8945a]/20 hover:text-[#e8945a]"
                    }`}
                  >
                    {practitioner.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Details */}
      {step === 4 && (
        <div className="space-y-6">
          {/* Selection Summary */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4 space-y-3">
            {(() => {
              const type = getSelectedTypeInfo();
              if (!type) return null;
              const Icon = type.icon;
              return (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#e8945a]/20 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-[#e8945a]" />
                    </div>
                    <div>
                      <p className="text-white/90 font-medium">{type.label}</p>
                      <p className="text-white/40 text-xs">{type.duration}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setStep(1)}
                    className="text-xs text-[#e8945a] hover:text-[#f0a06a]"
                  >
                    Wijzigen
                  </button>
                </div>
              );
            })()}
            <div className="h-px bg-white/[0.08]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <p className="text-white/90 font-medium">
                    {formatDateNL(selectedDate!)}
                  </p>
                  <p className="text-white/40 text-xs">
                    {getWeekday(selectedDate!)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setStep(2)}
                className="text-xs text-[#e8945a] hover:text-[#f0a06a]"
              >
                Wijzigen
              </button>
            </div>
            <div className="h-px bg-white/[0.08]" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-white/50" />
                </div>
                <div>
                  <p className="text-white/90 font-medium">{selectedTime}</p>
                  <p className="text-white/40 text-xs">Geselecteerde tijd</p>
                </div>
              </div>
              <button
                onClick={() => setStep(3)}
                className="text-xs text-[#e8945a] hover:text-[#f0a06a]"
              >
                Wijzigen
              </button>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-[#e8945a]" />
              <h3 className="text-lg font-semibold text-white/90">
                Opmerkingen (optioneel)
              </h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijvoorbeeld: Ik heb last van mijn kies linksboven, of specifieke wensen voor de afspraak..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-[#e8945a]/40 resize-none transition-colors"
            />
            <p className="text-white/30 text-xs mt-2">
              Deze informatie helpt ons om u beter te helpen tijdens uw
              afspraak.
            </p>
          </div>
        </div>
      )}

      {/* Step 5: Confirmation */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold text-white/90 mb-2">
              Controleer uw afspraak
            </h2>
            <p className="text-white/40 text-sm">
              Controleer alle details voordat u bevestigt
            </p>
          </div>

          {/* Full Summary Card */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 space-y-6">
            {(() => {
              const type = getSelectedTypeInfo();
              if (!type) return null;
              const Icon = type.icon;
              return (
                <div className="flex items-center gap-4 pb-6 border-b border-white/[0.08]">
                  <div className="w-16 h-16 rounded-2xl bg-[#e8945a]/20 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-[#e8945a]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-sm">Type afspraak</p>
                    <p className="text-xl font-semibold text-white">
                      {type.label}
                    </p>
                    <p className="text-white/50 text-sm">{type.description}</p>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-[#e8945a]" />
                </div>
                <div>
                  <p className="text-white/40 text-sm">Datum</p>
                  <p className="text-white font-medium">
                    {formatDateNL(selectedDate!)}
                  </p>
                  <p className="text-white/50 text-xs">
                    {getWeekday(selectedDate!)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Clock className="w-6 h-6 text-[#e8945a]" />
                </div>
                <div>
                  <p className="text-white/40 text-sm">Tijd</p>
                  <p className="text-white font-medium">{selectedTime}</p>
                  <p className="text-white/50 text-xs">
                    {getSelectedTypeInfo()?.duration}
                  </p>
                </div>
              </div>
            </div>

            {notes && (
              <div className="pt-6 border-t border-white/[0.08]">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/[0.06] flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-[#e8945a]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-sm mb-1">Opmerkingen</p>
                    <p className="text-white/80">{notes}</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Terms */}
          <div className="bg-[#e8945a]/5 border border-[#e8945a]/20 rounded-2xl p-4">
            <p className="text-white/60 text-sm text-center">
              Door te bevestigen gaat u akkoord met onze{" "}
              <Link
                href="/portal/terms"
                className="text-[#e8945a] hover:underline"
              >
                algemene voorwaarden
              </Link>{" "}
              en annuleringsbeleid.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-4">
        {step > 1 ? (
          <button
            onClick={() => setStep(step - 1)}
            className="px-6 py-3 rounded-xl border border-white/[0.08] text-white/50 hover:text-white/80 hover:border-white/[0.15] transition-all flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" />
            Terug
          </button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <button
            onClick={() => setStep(step + 1)}
            disabled={
              (step === 1 && !selectedType) ||
              (step === 2 && !selectedDate) ||
              (step === 3 && !selectedTime)
            }
            className="px-8 py-3 rounded-xl bg-[#e8945a] text-white font-medium hover:bg-[#f0a06a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            Volgende
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : step === 4 ? (
          <button
            onClick={() => setStep(5)}
            className="px-8 py-3 rounded-xl bg-[#e8945a] text-white font-medium hover:bg-[#f0a06a] transition-all flex items-center gap-2"
          >
            Bevestigen
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 rounded-xl bg-[#e8945a] text-white font-medium hover:bg-[#f0a06a] transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Bezig..." : "Afspraak Bevestigen"}
          </button>
        )}
      </div>
    </div>
  );
}
