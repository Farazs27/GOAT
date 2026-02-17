import { PatientContext } from "./patient-data-fetcher";

export interface PracticeAiConfig {
  enabled: boolean;
  practiceInfo?: string;
  customFaq?: Array<{ q: string; a: string }>;
  nudgesEnabled?: boolean;
  overdueThresholdMonths?: number;
  maxNudges?: number;
}

export function buildPatientSystemPrompt(
  context: PatientContext,
  practiceConfig?: PracticeAiConfig
): string {
  const sections: string[] = [];

  // 1. Identity
  sections.push(
    `Je bent Nexiom Assistant, de digitale assistent van de tandartspraktijk. Je spreekt professioneel Nederlands.`
  );

  // 2. Scope rules
  sections.push(
    `SCOPE: Je legt alleen bestaande behandelingen, facturen en afspraken uit. Je geeft NOOIT medisch advies of diagnoses. Je mag geen nieuwe behandelingen voorstellen of klinische beoordelingen maken.`
  );

  // 3. Tone
  sections.push(
    `TOON: Wees professioneel, helder en beknopt. Antwoord in 2-3 zinnen tenzij meer detail nodig is. Als de patient in een andere taal schrijft, schakel dan over naar die taal.`
  );

  // 4. Empathy
  sections.push(
    `EMPATHIE: Als de patient angstig of gefrustreerd klinkt, wees extra geruststellend. Erken hun gevoel voordat je inhoudelijk antwoordt.`
  );

  // 5. NZa codes
  sections.push(
    `NZA CODES: Leg NZa codes uit in eenvoudige taal, bijv. V11 = controle-afspraak, C11 = consult, M32 = gebitsreiniging. Gebruik geen jargon.`
  );

  // 6. Context-awareness
  if (context.currentPage) {
    const pageLabels: Record<string, string> = {
      appointments: "afspraken",
      invoices: "facturen",
      "treatment-plans": "behandelplannen",
      documents: "documenten",
      messages: "berichten",
      consent: "toestemmingsformulieren",
      profile: "profiel",
    };
    const label = pageLabels[context.currentPage] || context.currentPage;
    sections.push(
      `CONTEXT: De patient bekijkt momenteel de pagina "${label}". Je kunt vragen: "Wilt u dat ik naar uw ${label} kijk?"`
    );
  }

  // 7. Practice config
  if (practiceConfig?.practiceInfo) {
    sections.push(`PRAKTIJKINFO: ${practiceConfig.practiceInfo}`);
  }
  if (practiceConfig?.customFaq && practiceConfig.customFaq.length > 0) {
    const faqText = practiceConfig.customFaq
      .map((f) => `V: ${f.q}\nA: ${f.a}`)
      .join("\n\n");
    sections.push(`VEELGESTELDE VRAGEN:\n${faqText}`);
  }

  // 9. Booking capability
  sections.push(
    `AFSPRAKEN: Je kunt afspraken inplannen voor de patient. Vraag stap voor stap: type behandeling, voorkeur behandelaar, voorkeursdatum en -tijd.`
  );

  // 10. Handoff
  sections.push(
    `DOORVERWIJZING: Als je iets niet kunt beantwoorden, zeg dan dat een medewerker van de praktijk contact zal opnemen.`
  );

  // 11. PII guard
  sections.push(
    `PII BEVEILIGING: Noem NOOIT de naam, BSN, geboortedatum, adres, e-mailadres of telefoonnummer van de patient in je antwoorden.`
  );

  // 12. Patient context data
  const contextData: Record<string, unknown> = {};

  if (context.gender) contextData.geslacht = context.gender;
  if (context.insuranceType) contextData.verzekering = context.insuranceType;
  if (context.medicalAlerts.length > 0)
    contextData.medischeWaarschuwingen = context.medicalAlerts;
  if (context.appointments.length > 0)
    contextData.afspraken = context.appointments;
  if (context.treatmentPlans.length > 0)
    contextData.behandelplannen = context.treatmentPlans;
  if (context.invoices.length > 0) contextData.facturen = context.invoices;
  if (context.clinicalNotes.length > 0)
    contextData.klinischeNotities = context.clinicalNotes;
  if (context.pendingConsents.length > 0)
    contextData.openstaandeToestemmingen = context.pendingConsents;
  if (context.recentImages.length > 0)
    contextData.recenteBeelden = context.recentImages;

  if (Object.keys(contextData).length > 0) {
    sections.push(
      `PATIENTGEGEVENS (geanonimiseerd):\n${JSON.stringify(contextData, null, 2)}`
    );
  }

  return sections.join("\n\n");
}
