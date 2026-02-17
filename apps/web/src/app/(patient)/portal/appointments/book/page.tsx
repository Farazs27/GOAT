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
  HeartPulse,
  ArrowRight,
  Info,
} from "lucide-react";

// Appointment types per plan spec
const appointmentTypes = [
  {
    id: "CHECKUP",
    label: "Controle",
    description: "Periodieke controle van uw gebit en tandvlees",
    duration: "30 min",
    durationMinutes: 30,
    icon: Stethoscope,
  },
  {
    id: "CLEANING",
    label: "Reiniging",
    description: "Professionele gebitsreiniging en poetsinstructie",
    duration: "45 min",
    durationMinutes: 45,
    icon: Sparkles,
  },
  {
    id: "EMERGENCY",
    label: "Spoed",
    description: "Dringende hulp bij pijn of ongeval",
    duration: "15 min",
    durationMinutes: 15,
    icon: HeartPulse,
  },
];

const steps = [
  { id: 1, label: "Type", description: "Kies afspraaktype" },
  { id: 2, label: "Behandelaar", description: "Kies behandelaar" },
  { id: 3, label: "Datum & Tijd", description: "Selecteer moment" },
  { id: 4, label: "Bevestig", description: "Controleer en bevestig" },
];

interface Practitioner {
  id: string;
  name: string;
  role: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
}

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

  // Selection states
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedPractitioner, setSelectedPractitioner] =
    useState<Practitioner | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Data states
  const [practitioners, setPractitioners] = useState<Practitioner[]>([]);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [loading, setLoading] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [bookingWindow, setBookingWindow] = useState({
    minNoticeDays: 1,
    bookingWindowDays: 90,
  });

  useEffect(() => {
    setMounted(true);
    fetchPendingCount();
  }, []);

  const getToken = () => localStorage.getItem("patient_token");

  const fetchPendingCount = async () => {
    try {
      const res = await fetch("/api/patient-portal/appointments?status=PENDING_APPROVAL", {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPendingCount(
          Array.isArray(data.appointments) ? data.appointments.length : 0,
        );
      }
    } catch {
      // ignore
    }
  };

  const fetchPractitioners = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        "/api/patient-portal/appointments/availability?listPractitioners=true",
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setPractitioners(data.practitioners || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const fetchSlots = async (date: Date) => {
    if (!selectedPractitioner || !selectedType) return;
    const typeInfo = appointmentTypes.find((t) => t.id === selectedType);
    if (!typeInfo) return;

    setLoadingSlots(true);
    setSlots([]);
    try {
      const dateStr = date.toISOString().split("T")[0];
      const res = await fetch(
        `/api/patient-portal/appointments/availability?practitionerId=${selectedPractitioner.id}&date=${dateStr}&durationMinutes=${typeInfo.durationMinutes}`,
        { headers: { Authorization: `Bearer ${getToken()}` } },
      );
      if (res.ok) {
        const data = await res.json();
        setSlots(data.slots || []);
        if (data.bookingWindow) {
          setBookingWindow(data.bookingWindow);
        }
      }
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    setSelectedPractitioner(null);
    setSelectedDate(null);
    setSelectedTime(null);
    fetchPractitioners();
    setTimeout(() => setStep(2), 200);
  };

  const handlePractitionerSelect = (p: Practitioner) => {
    setSelectedPractitioner(p);
    setSelectedDate(null);
    setSelectedTime(null);
    setTimeout(() => setStep(3), 200);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setSelectedTime(null);
    fetchSlots(date);
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setTimeout(() => setStep(4), 200);
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime || !selectedType || !selectedPractitioner)
      return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/patient-portal/appointments/book", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({
          date: selectedDate.toISOString().split("T")[0],
          startTime: selectedTime,
          appointmentType: selectedType,
          practitionerId: selectedPractitioner.id,
          notes: notes || undefined,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push("/portal/appointments"), 2000);
      } else {
        const data = await res.json();
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
    const startDayOfWeek =
      firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++)
      days.push(new Date(year, month, i));
    return days;
  };

  const isDateDisabled = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const minDate = new Date(today);
    minDate.setDate(minDate.getDate() + bookingWindow.minNoticeDays);

    const maxDate = new Date(today);
    maxDate.setDate(maxDate.getDate() + bookingWindow.bookingWindowDays);

    // Disable weekends (Sat=5, Sun=6 in our 0=Monday scheme)
    const jsDay = date.getDay();
    const dayOfWeek = jsDay === 0 ? 6 : jsDay - 1;
    if (dayOfWeek >= 5) return true;

    return date < minDate || date > maxDate;
  };

  const isDateSelected = (date: Date) =>
    selectedDate?.toISOString().split("T")[0] ===
    date.toISOString().split("T")[0];

  const getSelectedTypeInfo = () =>
    appointmentTypes.find((t) => t.id === selectedType);

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      DENTIST: "Tandarts",
      HYGIENIST: "Mondhygienist",
    };
    return map[role] || role;
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
            Afspraak Aangevraagd!
          </h2>
          <p className="text-white/50 mb-2">
            Uw afspraak is ingediend en wacht op bevestiging van de praktijk.
          </p>
          <p className="text-[#e8945a] text-sm font-medium mb-6">
            Wacht op bevestiging
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

      {/* Pending bookings warning */}
      {pendingCount >= 2 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-amber-300 text-sm">
            U heeft al 2 afspraken in afwachting van goedkeuring. U kunt pas een
            nieuwe afspraak maken als er een is bevestigd of geannuleerd.
          </p>
        </div>
      )}
      {pendingCount === 1 && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-center gap-3">
          <Info className="w-5 h-5 text-blue-400 shrink-0" />
          <p className="text-blue-300 text-sm">
            U heeft 1 afspraak in afwachting van goedkeuring. U kunt nog 1
            extra afspraak aanvragen.
          </p>
        </div>
      )}

      {/* Progress Steps */}
      <div className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-4">
        <div className="flex items-center justify-between">
          {steps.map((s, index) => {
            const isActive = step === s.id;
            const isCompleted = step > s.id;
            const isClickable = step > s.id;

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

      {/* Step 1: Appointment Type */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-white/90 mb-2">
              Welk type afspraak wilt u maken?
            </h2>
            <p className="text-white/40 text-sm">
              Kies het type dat het beste bij uw behoeften past
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {appointmentTypes.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              const isEmergency = type.id === "EMERGENCY";
              const disabled = pendingCount >= 2;

              return (
                <button
                  key={type.id}
                  onClick={() => !disabled && handleTypeSelect(type.id)}
                  disabled={disabled}
                  className={`group relative p-6 rounded-2xl border text-left transition-all duration-300 ${
                    disabled
                      ? "opacity-50 cursor-not-allowed bg-white/[0.02] border-white/[0.06]"
                      : isSelected
                        ? isEmergency
                          ? "bg-red-500/10 border-red-500/50"
                          : "bg-white/[0.06] border-[#e8945a]"
                        : "bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className="flex flex-col items-center text-center gap-3">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                        isSelected
                          ? isEmergency
                            ? "bg-red-500/20"
                            : "bg-[#e8945a]/20"
                          : "bg-white/[0.06]"
                      }`}
                    >
                      <Icon
                        className={`w-7 h-7 ${
                          isSelected
                            ? isEmergency
                              ? "text-red-400"
                              : "text-[#e8945a]"
                            : "text-white/50"
                        }`}
                      />
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-semibold mb-1 ${
                          isSelected ? "text-white" : "text-white/80"
                        }`}
                      >
                        {type.label}
                      </h3>
                      <p className="text-sm text-white/40 mb-2">
                        {type.description}
                      </p>
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
                    </div>
                  </div>

                  {isSelected && (
                    <div className="absolute top-3 right-3">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isEmergency ? "bg-red-500" : "bg-[#e8945a]"
                        }`}
                      >
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 2: Practitioner Selection */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Type summary */}
          <SummaryChip
            icon={getSelectedTypeInfo()?.icon || Stethoscope}
            label={getSelectedTypeInfo()?.label || ""}
            sub={getSelectedTypeInfo()?.duration || ""}
            onEdit={() => setStep(1)}
          />

          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-white/90 mb-2">
              Kies uw behandelaar
            </h2>
            <p className="text-white/40 text-sm">
              Selecteer bij welke behandelaar u een afspraak wilt
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-[#e8945a] animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {practitioners.map((p) => {
                const isSelected = selectedPractitioner?.id === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handlePractitionerSelect(p)}
                    className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 ${
                      isSelected
                        ? "bg-white/[0.06] border-[#e8945a]"
                        : "bg-white/[0.04] border-white/[0.08] hover:border-white/[0.15] hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${
                          isSelected ? "bg-[#e8945a]/20" : "bg-white/[0.06]"
                        }`}
                      >
                        <User
                          className={`w-6 h-6 ${
                            isSelected ? "text-[#e8945a]" : "text-white/50"
                          }`}
                        />
                      </div>
                      <div className="flex-1">
                        <h3
                          className={`font-semibold ${
                            isSelected ? "text-white" : "text-white/80"
                          }`}
                        >
                          {p.name}
                        </h3>
                        <p className="text-sm text-white/40">
                          {roleLabel(p.role)}
                        </p>
                      </div>
                      <ArrowRight
                        className={`w-5 h-5 transition-all ${
                          isSelected
                            ? "text-[#e8945a] opacity-100"
                            : "text-white/20 opacity-0 group-hover:opacity-100"
                        }`}
                      />
                    </div>
                    {isSelected && (
                      <div className="absolute top-3 right-3">
                        <div className="w-6 h-6 rounded-full bg-[#e8945a] flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
              {practitioners.length === 0 && !loading && (
                <p className="text-white/40 text-center col-span-2 py-8">
                  Geen behandelaars beschikbaar
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Date & Time */}
      {step === 3 && selectedPractitioner && (
        <div className="space-y-6">
          {/* Summary chips */}
          <div className="space-y-2">
            <SummaryChip
              icon={getSelectedTypeInfo()?.icon || Stethoscope}
              label={getSelectedTypeInfo()?.label || ""}
              sub={getSelectedTypeInfo()?.duration || ""}
              onEdit={() => setStep(1)}
            />
            <SummaryChip
              icon={User}
              label={selectedPractitioner.name}
              sub={roleLabel(selectedPractitioner.role)}
              onEdit={() => setStep(2)}
            />
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

                const disabled = isDateDisabled(date);
                const selected = isDateSelected(date);

                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => !disabled && handleDateSelect(date)}
                    disabled={disabled}
                    className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all ${
                      selected
                        ? "bg-[#e8945a] text-white shadow-[0_0_15px_rgba(232,148,90,0.4)]"
                        : disabled
                          ? "text-white/15 cursor-not-allowed"
                          : "bg-white/[0.04] text-white/70 hover:bg-[#e8945a]/20 hover:text-[#e8945a]"
                    }`}
                  >
                    <span className="text-sm font-medium">
                      {date.getDate()}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Time slots */}
          {selectedDate && (
            <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <Clock className="w-5 h-5 text-[#e8945a]" />
                <h3 className="text-lg font-semibold text-white/90">
                  Beschikbare Tijden -{" "}
                  {formatDateNL(selectedDate)}
                </h3>
              </div>

              {loadingSlots ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-[#e8945a] animate-spin" />
                </div>
              ) : slots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                  {slots.map((slot) => (
                    <button
                      key={slot.startTime}
                      onClick={() => handleTimeSelect(slot.startTime)}
                      className={`py-3 px-4 rounded-xl text-sm font-medium transition-all ${
                        selectedTime === slot.startTime
                          ? "bg-[#e8945a] text-white shadow-[0_0_15px_rgba(232,148,90,0.4)]"
                          : "bg-white/[0.06] text-white/70 hover:bg-[#e8945a]/20 hover:text-[#e8945a]"
                      }`}
                    >
                      {slot.startTime}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40">
                    Geen beschikbare tijden op deze datum
                  </p>
                  <p className="text-white/30 text-sm mt-1">
                    Probeer een andere datum
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Step 4: Details & Confirm */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <h2 className="text-xl font-semibold text-white/90 mb-2">
              Controleer en bevestig
            </h2>
            <p className="text-white/40 text-sm">
              Controleer alle details voordat u de afspraak aanvraagt
            </p>
          </div>

          {/* Full Summary Card */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6 space-y-5">
            {(() => {
              const type = getSelectedTypeInfo();
              if (!type) return null;
              const Icon = type.icon;
              return (
                <div className="flex items-center gap-4 pb-5 border-b border-white/[0.08]">
                  <div className="w-14 h-14 rounded-2xl bg-[#e8945a]/20 flex items-center justify-center">
                    <Icon className="w-7 h-7 text-[#e8945a]" />
                  </div>
                  <div>
                    <p className="text-white/40 text-sm">Type afspraak</p>
                    <p className="text-xl font-semibold text-white">
                      {type.label}
                    </p>
                    <p className="text-white/50 text-sm">{type.duration}</p>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <User className="w-5 h-5 text-[#e8945a]" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Behandelaar</p>
                  <p className="text-white font-medium">
                    {selectedPractitioner?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-[#e8945a]" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Datum</p>
                  <p className="text-white font-medium">
                    {formatDateNL(selectedDate!)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/[0.06] flex items-center justify-center">
                  <Clock className="w-5 h-5 text-[#e8945a]" />
                </div>
                <div>
                  <p className="text-white/40 text-xs">Tijd</p>
                  <p className="text-white font-medium">{selectedTime}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-5 h-5 text-[#e8945a]" />
              <h3 className="text-lg font-semibold text-white/90">
                Eventuele opmerkingen
              </h3>
            </div>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Bijvoorbeeld: Ik heb last van mijn kies linksboven..."
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/[0.06] border border-white/[0.08] text-white/80 placeholder:text-white/30 focus:outline-none focus:border-[#e8945a]/40 focus:ring-2 focus:ring-[#e8945a]/20 resize-none transition-colors"
            />
          </div>

          {/* Pending approval notice */}
          <div className="bg-[#e8945a]/5 border border-[#e8945a]/20 rounded-2xl p-4">
            <p className="text-white/60 text-sm text-center">
              Na het indienen wordt uw afspraak beoordeeld door de praktijk.
              U ontvangt een bevestiging zodra de afspraak is goedgekeurd.
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

        {step === 4 && (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-8 py-3 rounded-2xl bg-[#e8945a] text-white font-medium hover:bg-[#d4864a] shadow-lg shadow-[#e8945a]/25 hover:shadow-[#e8945a]/40 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {submitting ? "Bezig..." : "Afspraak Aanvragen"}
          </button>
        )}
      </div>
    </div>
  );
}

// Summary chip component for showing previous selections
function SummaryChip({
  icon: Icon,
  label,
  sub,
  onEdit,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  sub: string;
  onEdit: () => void;
}) {
  return (
    <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-2xl p-3 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#e8945a]/20 flex items-center justify-center">
        <Icon className="w-5 h-5 text-[#e8945a]" />
      </div>
      <div className="flex-1">
        <p className="text-white/90 font-medium text-sm">{label}</p>
        <p className="text-white/40 text-xs">{sub}</p>
      </div>
      <button
        onClick={onEdit}
        className="text-xs text-[#e8945a] hover:text-[#f0a06a] transition-colors"
      >
        Wijzigen
      </button>
    </div>
  );
}
