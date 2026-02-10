export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  PRACTICE_ADMIN = 'PRACTICE_ADMIN',
  DENTIST = 'DENTIST',
  HYGIENIST = 'HYGIENIST',
  RECEPTIONIST = 'RECEPTIONIST',
  PATIENT = 'PATIENT',
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: UserRole;
  practiceId: string;
  permissions: Permission[];
}

export enum Permission {
  // Practice Management
  MANAGE_PRACTICES = 'manage:practices',
  MANAGE_USERS = 'manage:users',
  VIEW_AUDIT_LOGS = 'view:audit_logs',
  
  // BSN Access
  READ_BSN_FULL = 'read:bsn:full',
  READ_BSN_OWN = 'read:bsn:own',
  
  // Patients
  CREATE_PATIENT = 'create:patient',
  EDIT_PATIENT = 'edit:patient',
  VIEW_PATIENT = 'view:patient',
  
  // Clinical
  VIEW_ODONTOGRAM = 'view:odontogram',
  EDIT_ODONTOGRAM = 'edit:odontogram',
  CREATE_TREATMENT_PLAN = 'create:treatment_plan',
  WRITE_CLINICAL_NOTES = 'write:clinical_notes',
  
  // Scheduling
  BOOK_APPOINTMENTS = 'book:appointments',
  VIEW_AGENDA = 'view:agenda',
  
  // Billing
  CREATE_INVOICE = 'create:invoice',
  PROCESS_PAYMENTS = 'process:payments',
  SUBMIT_CLAIMS = 'submit:claims',
  
  // Analytics
  VIEW_ANALYTICS = 'view:analytics',
}

export const RolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: Object.values(Permission),
  [UserRole.PRACTICE_ADMIN]: [
    Permission.MANAGE_USERS,
    Permission.VIEW_AUDIT_LOGS,
    Permission.READ_BSN_FULL,
    Permission.CREATE_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.VIEW_PATIENT,
    Permission.VIEW_ODONTOGRAM,
    Permission.BOOK_APPOINTMENTS,
    Permission.VIEW_AGENDA,
    Permission.CREATE_INVOICE,
    Permission.PROCESS_PAYMENTS,
    Permission.SUBMIT_CLAIMS,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.DENTIST]: [
    Permission.READ_BSN_FULL,
    Permission.CREATE_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.VIEW_PATIENT,
    Permission.VIEW_ODONTOGRAM,
    Permission.EDIT_ODONTOGRAM,
    Permission.CREATE_TREATMENT_PLAN,
    Permission.WRITE_CLINICAL_NOTES,
    Permission.BOOK_APPOINTMENTS,
    Permission.VIEW_AGENDA,
    Permission.CREATE_INVOICE,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.HYGIENIST]: [
    Permission.READ_BSN_FULL,
    Permission.CREATE_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.VIEW_PATIENT,
    Permission.VIEW_ODONTOGRAM,
    Permission.EDIT_ODONTOGRAM,
    Permission.WRITE_CLINICAL_NOTES,
    Permission.BOOK_APPOINTMENTS,
    Permission.VIEW_AGENDA,
    Permission.VIEW_ANALYTICS,
  ],
  [UserRole.RECEPTIONIST]: [
    Permission.CREATE_PATIENT,
    Permission.EDIT_PATIENT,
    Permission.VIEW_PATIENT,
    Permission.BOOK_APPOINTMENTS,
    Permission.VIEW_AGENDA,
    Permission.CREATE_INVOICE,
    Permission.PROCESS_PAYMENTS,
  ],
  [UserRole.PATIENT]: [
    Permission.READ_BSN_OWN,
    Permission.EDIT_PATIENT,
    Permission.VIEW_PATIENT,
    Permission.BOOK_APPOINTMENTS,
    Permission.PROCESS_PAYMENTS,
  ],
};
