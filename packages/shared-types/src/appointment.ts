export interface AppointmentDto {
  id: string;
  patientId: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  appointmentType: AppointmentType;
  status: AppointmentStatus;
  room: string | null;
  notes: string | null;
}

export enum AppointmentType {
  CHECKUP = 'CHECKUP',
  TREATMENT = 'TREATMENT',
  EMERGENCY = 'EMERGENCY',
  CONSULTATION = 'CONSULTATION',
  HYGIENE = 'HYGIENE',
}

export enum AppointmentStatus {
  SCHEDULED = 'SCHEDULED',
  CONFIRMED = 'CONFIRMED',
  CHECKED_IN = 'CHECKED_IN',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED',
}

export interface CreateAppointmentDto {
  patientId: string;
  practitionerId: string;
  startTime: Date;
  durationMinutes: number;
  appointmentType: AppointmentType;
  room?: string;
  notes?: string;
}

export interface AvailableSlotDto {
  startTime: Date;
  endTime: Date;
  practitionerId: string;
  practitionerName: string;
}
