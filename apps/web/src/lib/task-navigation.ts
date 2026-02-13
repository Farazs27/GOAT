export function buildTaskNavigationPath(
  type: string,
  patientId: string | null
): string | null {
  if (!patientId && type !== 'invoice') return null;
  switch (type) {
    case 'clinical-note': return `/patients/${patientId}?section=notities`;
    case 'invoice': return `/billing?patientId=${patientId}`;
    case 'prescription': return `/patients/${patientId}?tab=prescriptions`;
    case 'treatment-plan': return `/patients/${patientId}?section=behandelingen`;
    case 'treatment': return `/patients/${patientId}?section=behandelingen`;
    case 'custom': return patientId ? `/patients/${patientId}` : null;
    default: return patientId ? `/patients/${patientId}` : null;
  }
}
