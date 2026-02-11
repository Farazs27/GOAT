import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Use Gemini to extract patient search info and intent from the user message.
 */
async function parseUserIntent(message: string, history: ChatMessage[]): Promise<{
  patientSearch: string | null;
  intent: string;
  directAnswer: string | null;
}> {
  const historyContext = history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

  const prompt = `Je bent een assistent voor een tandartspraktijk. Analyseer het bericht van de tandarts en bepaal:
1. Of er een patiënt wordt gezocht (naam, patiëntnummer, of andere identifier)
2. Wat de tandarts wil weten

Context van eerdere berichten:
${historyContext || '(geen)'}

Nieuw bericht: "${message}"

Retourneer JSON:
{
  "patientSearch": "zoekterm voor patiënt of null als geen specifieke patiënt",
  "intent": "wat de tandarts wil weten (bijv. 'afspraken', 'behandelgeschiedenis', 'medicatie', 'facturen', 'algemene info', 'allergieen', 'notities')",
  "directAnswer": "als de vraag NIET over een specifieke patiënt gaat maar een algemene tandheelkundige vraag is, geef dan direct antwoord. Anders null."
}

Alleen JSON retourneren, geen extra tekst.`;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, maxOutputTokens: 512, responseMimeType: 'application/json' },
    }),
  });

  if (!res.ok) throw new ApiError('AI analyse mislukt', 502);
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new ApiError('Geen AI response', 502);
  return JSON.parse(text);
}

/**
 * Search for a patient by name or patient number.
 */
async function findPatient(search: string, practiceId: string) {
  const patients = await prisma.patient.findMany({
    where: {
      practiceId,
      isActive: true,
      OR: [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { patientNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ],
    },
    take: 5,
    select: {
      id: true, firstName: true, lastName: true, patientNumber: true,
      dateOfBirth: true, email: true, phone: true,
    },
  });
  return patients;
}

/**
 * Gather comprehensive patient data for the AI to answer questions.
 */
async function getPatientData(patientId: string, intent: string) {
  const data: Record<string, unknown> = {};

  // Always get basic patient info
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      firstName: true, lastName: true, patientNumber: true, dateOfBirth: true,
      gender: true, email: true, phone: true, addressStreet: true, addressCity: true,
      addressPostal: true, insuranceCompany: true, insuranceNumber: true, insuranceType: true,
      medicalAlerts: true, medications: true, bloodType: true, createdAt: true,
    },
  });
  data.patient = patient;

  // Fetch relevant data based on intent
  const fetchAll = intent === 'algemene info' || intent === 'overzicht';

  if (fetchAll || intent.includes('afspra') || intent.includes('agenda') || intent.includes('bezoek')) {
    data.appointments = await prisma.appointment.findMany({
      where: { patientId },
      orderBy: { startTime: 'desc' },
      take: 10,
      select: {
        startTime: true, endTime: true, appointmentType: true, status: true,
        notes: true, room: true,
        practitioner: { select: { firstName: true, lastName: true } },
      },
    });
  }

  if (fetchAll || intent.includes('behandel') || intent.includes('treatment') || intent.includes('historie')) {
    data.treatments = await prisma.treatment.findMany({
      where: { patientId },
      orderBy: { performedAt: 'desc' },
      take: 15,
      select: {
        description: true, status: true, performedAt: true, toothId: true,
        quantity: true, unitPrice: true, totalPrice: true, notes: true,
        nzaCode: { select: { code: true, descriptionNl: true } },
        tooth: { select: { toothNumber: true } },
      },
    });

    data.treatmentPlans = await prisma.treatmentPlan.findMany({
      where: { patientId },
      orderBy: { proposedAt: 'desc' },
      take: 5,
      select: {
        title: true, description: true, status: true, proposedAt: true,
        totalEstimate: true, insuranceEstimate: true, patientEstimate: true,
      },
    });
  }

  if (fetchAll || intent.includes('notit') || intent.includes('note') || intent.includes('bevinding')) {
    data.clinicalNotes = await prisma.clinicalNote.findMany({
      where: { patientId, isConfidential: false },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        noteType: true, content: true, createdAt: true,
        author: { select: { firstName: true, lastName: true } },
      },
    });
  }

  if (fetchAll || intent.includes('factuur') || intent.includes('betaling') || intent.includes('kosten') || intent.includes('financ')) {
    data.invoices = await prisma.invoice.findMany({
      where: { patientId },
      orderBy: { invoiceDate: 'desc' },
      take: 10,
      select: {
        invoiceNumber: true, invoiceDate: true, total: true, status: true,
        paidAmount: true, insuranceAmount: true, patientAmount: true,
      },
    });
  }

  if (fetchAll || intent.includes('recept') || intent.includes('medicatie') || intent.includes('medicijn')) {
    data.prescriptions = await prisma.prescription.findMany({
      where: { patientId },
      orderBy: { prescribedAt: 'desc' },
      take: 10,
      select: {
        medicationName: true, dosage: true, frequency: true, duration: true,
        instructions: true, status: true, prescribedAt: true,
      },
    });
  }

  if (fetchAll || intent.includes('allergi') || intent.includes('medisch') || intent.includes('anamnese')) {
    data.anamnesis = await prisma.anamnesis.findMany({
      where: { patientId },
      orderBy: { completedAt: 'desc' },
      take: 1,
      select: { data: true, completedAt: true, version: true },
    });
  }

  if (fetchAll || intent.includes('tand') || intent.includes('gebit') || intent.includes('element') || intent.includes('odonto')) {
    data.teeth = await prisma.tooth.findMany({
      where: { patientId },
      select: {
        toothNumber: true, status: true, isPrimary: true, notes: true,
        surfaces: { select: { surface: true, condition: true, material: true } },
      },
    });
  }

  return data;
}

/**
 * Generate a natural language response from patient data.
 */
async function generateResponse(
  message: string,
  patientData: Record<string, unknown>,
  history: ChatMessage[]
): Promise<string> {
  const historyContext = history.slice(-6).map(m => `${m.role}: ${m.content}`).join('\n');

  const prompt = `Je bent een behulpzame AI-assistent voor een tandartspraktijk. Je helpt tandartsen door vragen over patiënten te beantwoorden op basis van de beschikbare data.

EERDERE BERICHTEN:
${historyContext || '(geen)'}

VRAAG VAN DE TANDARTS:
${message}

BESCHIKBARE PATIËNTDATA:
${JSON.stringify(patientData, null, 2)}

INSTRUCTIES:
- Antwoord in het Nederlands
- Wees beknopt maar volledig
- Gebruik duidelijke structuur (opsommingen, kopjes) wanneer nuttig
- Als data ontbreekt, zeg dat eerlijk
- Noem relevante datums en bedragen
- Geef GEEN medisch advies, alleen data samenvatting
- Als er meerdere patiënten gevonden zijn, vraag om verduidelijking
- Formateer bedragen als €X,XX`;

  const res = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.3, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok) throw new ApiError('AI response mislukt', 502);
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Geen antwoord ontvangen.';
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { message, history = [] } = body as { message: string; history: ChatMessage[] };

    if (!message?.trim()) {
      throw new ApiError('Bericht is vereist', 400);
    }

    if (!GEMINI_API_KEY) {
      throw new ApiError('Gemini API key niet geconfigureerd', 500);
    }

    // Step 1: Parse user intent
    const { patientSearch, intent, directAnswer } = await parseUserIntent(message, history);

    // If it's a general question (not patient-specific), return direct answer
    if (directAnswer && !patientSearch) {
      return Response.json({ response: directAnswer, type: 'general' });
    }

    // Step 2: Find patient
    if (!patientSearch) {
      return Response.json({
        response: 'Over welke patiënt wilt u informatie? Noem de naam of het patiëntnummer.',
        type: 'clarification',
      });
    }

    const patients = await findPatient(patientSearch, user.practiceId);

    if (patients.length === 0) {
      return Response.json({
        response: `Geen patiënt gevonden met "${patientSearch}". Controleer de spelling of probeer het patiëntnummer.`,
        type: 'not_found',
      });
    }

    // If multiple matches, ask for clarification
    if (patients.length > 1) {
      const list = patients.map(p =>
        `- **${p.firstName} ${p.lastName}** (${p.patientNumber})${p.dateOfBirth ? ` - geb. ${new Date(p.dateOfBirth).toLocaleDateString('nl-NL')}` : ''}`
      ).join('\n');
      return Response.json({
        response: `Meerdere patiënten gevonden:\n${list}\n\nKunt u verduidelijken welke patiënt u bedoelt?`,
        type: 'multiple_matches',
        patients: patients.map(p => ({ id: p.id, name: `${p.firstName} ${p.lastName}`, number: p.patientNumber })),
      });
    }

    // Step 3: Get patient data based on intent
    const patientData = await getPatientData(patients[0].id, intent);

    // Step 4: Generate natural language response
    const response = await generateResponse(message, patientData, history);

    return Response.json({
      response,
      type: 'answer',
      patient: { id: patients[0].id, name: `${patients[0].firstName} ${patients[0].lastName}` },
    });
  } catch (error) {
    return handleError(error);
  }
}
