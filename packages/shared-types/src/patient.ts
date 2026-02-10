export interface PatientDto {
  id: string;
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email: string | null;
  phone: string | null;
  addressStreet: string | null;
  addressCity: string | null;
  addressPostal: string | null;
  insuranceCompany: string | null;
  insuranceNumber: string | null;
  bsnMasked: string | null;
  medicalAlerts: string[];
  createdAt: Date;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth: Date;
  email?: string;
  phone?: string;
  bsn?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostal?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
  medicalAlerts?: string[];
  medications?: string[];
}

export interface UpdatePatientDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  addressStreet?: string;
  addressCity?: string;
  addressPostal?: string;
  insuranceCompany?: string;
  insuranceNumber?: string;
  medicalAlerts?: string[];
  medications?: string[];
}
