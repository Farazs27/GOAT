import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

interface ParsedPatient {
  patientNumber: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  email: string;
  bsn: string;
  addressStreet: string;
  addressCity: string;
  addressPostal: string;
  insuranceCompany: string;
  insuranceNumber: string;
}

interface ParsedTreatment {
  date: string;
  toothNumber: string;
  code: string;
  description: string;
  patientCost: string;
  insuranceCost: string;
  practitioner: string;
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);

    if (!GEMINI_API_KEY) {
      throw new ApiError('Gemini API key niet geconfigureerd', 500);
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      throw new ApiError('PDF bestand is vereist', 400);
    }

    if (!file.type.includes('pdf')) {
      throw new ApiError('Alleen PDF bestanden worden ondersteund', 400);
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');

    // Use Gemini to parse the PDF
    const prompt = `Analyseer deze Patiëntenkaart PDF van een tandartspraktijk en extraheer ALLE gegevens.

RETOURNEER EXACT dit JSON formaat:
{
  "patient": {
    "patientNumber": "het code/patiëntnummer (bijv. '20')",
    "firstName": "voornaam",
    "lastName": "achternaam",
    "dateOfBirth": "YYYY-MM-DD formaat",
    "gender": "M of F",
    "phone": "mobiel of telefoonnummer",
    "email": "email als beschikbaar, anders lege string",
    "bsn": "BSN nummer",
    "addressStreet": "straat + huisnummer",
    "addressCity": "stad",
    "addressPostal": "postcode",
    "insuranceCompany": "naam verzekeraar",
    "insuranceNumber": "polisnummer"
  },
  "treatments": [
    {
      "date": "YYYY-MM-DD",
      "toothNumber": "elementnummer of lege string",
      "code": "NZa/behandelcode (bijv. C11, M0340, 2c, gia, X21, C002, etc.)",
      "description": "omschrijving van de behandeling",
      "patientCost": "bedrag patiënt of 0",
      "insuranceCost": "bedrag verzekeraar of 0",
      "practitioner": "medewerker initialen (Me kolom)"
    }
  ]
}

BELANGRIJK:
- Neem ALLEEN echte behandelingen op (met een code), GEEN emails, factuurregels (F/...), of oproepen
- Datums converteren naar YYYY-MM-DD
- Bij woonplaats: splits postcode en stad (bijv. "1051 GS Amsterdam" → postal: "1051 GS", city: "Amsterdam")
- Bij geslacht: M voor man, F voor vrouw
- Filter regels met codes zoals "factu", "oproep", of die beginnen met "Email uit:" of "-----F/"
- Retourneer ALLEEN geldige JSON, geen extra tekst`;

    const requestBody = JSON.stringify({
      contents: [{
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'application/pdf',
              data: base64,
            },
          },
        ],
      }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
      },
    });

    // Retry up to 3 times with exponential backoff for rate limits
    let geminiResponse: Response | null = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: requestBody,
      });
      if (geminiResponse.status !== 429) break;
      console.log(`Gemini rate limited, retrying in ${(attempt + 1) * 5}s...`);
      await new Promise(r => setTimeout(r, (attempt + 1) * 5000));
    }

    if (!geminiResponse || !geminiResponse.ok) {
      const errText = geminiResponse ? await geminiResponse.text() : 'No response';
      console.error('Gemini PDF parse error:', errText);
      if (geminiResponse?.status === 429) {
        throw new ApiError('AI service is overbelast. Probeer het over 1 minuut opnieuw.', 429);
      }
      throw new ApiError('PDF analyse mislukt', 502);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new ApiError('Geen data uit PDF geëxtraheerd', 502);
    }

    let parsed: { patient: ParsedPatient; treatments: ParsedTreatment[] };
    try {
      parsed = JSON.parse(responseText);
    } catch {
      console.error('Failed to parse Gemini response:', responseText);
      throw new ApiError('PDF data kon niet worden verwerkt', 502);
    }

    if (!parsed.patient?.firstName || !parsed.patient?.lastName) {
      throw new ApiError('Geen patiëntgegevens gevonden in PDF', 400);
    }

    // Check if patient already exists (by BSN or name + DOB)
    const existingPatient = await prisma.patient.findFirst({
      where: {
        practiceId: user.practiceId,
        OR: [
          ...(parsed.patient.bsn ? [{ bsn: parsed.patient.bsn }] : []),
          {
            firstName: { equals: parsed.patient.firstName, mode: 'insensitive' as const },
            lastName: { equals: parsed.patient.lastName, mode: 'insensitive' as const },
            dateOfBirth: new Date(parsed.patient.dateOfBirth),
          },
        ],
      },
    });

    if (existingPatient) {
      throw new ApiError(
        `Patiënt "${parsed.patient.firstName} ${parsed.patient.lastName}" bestaat al (${existingPatient.patientNumber})`,
        409
      );
    }

    // Generate patient number
    const lastPatient = await prisma.patient.findFirst({
      where: { practiceId: user.practiceId },
      orderBy: { patientNumber: 'desc' },
    });
    const nextNumber = lastPatient
      ? parseInt(lastPatient.patientNumber.split('-')[2]) + 1
      : 1;
    const patientNumber = `P-${new Date().getFullYear()}-${String(nextNumber).padStart(4, '0')}`;

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        practiceId: user.practiceId,
        patientNumber,
        firstName: parsed.patient.firstName,
        lastName: parsed.patient.lastName,
        dateOfBirth: new Date(parsed.patient.dateOfBirth),
        gender: parsed.patient.gender || null,
        phone: parsed.patient.phone || null,
        email: parsed.patient.email || null,
        bsn: parsed.patient.bsn || null,
        addressStreet: parsed.patient.addressStreet || null,
        addressCity: parsed.patient.addressCity || null,
        addressPostal: parsed.patient.addressPostal || null,
        insuranceCompany: parsed.patient.insuranceCompany || null,
        insuranceNumber: parsed.patient.insuranceNumber || null,
        medicalAlerts: [],
        medications: [],
        gdprConsentAt: new Date(),
        isActive: true,
      },
    });

    // Initialize 32 adult teeth
    const adultTeeth = [
      11, 12, 13, 14, 15, 16, 17, 18,
      21, 22, 23, 24, 25, 26, 27, 28,
      31, 32, 33, 34, 35, 36, 37, 38,
      41, 42, 43, 44, 45, 46, 47, 48,
    ];
    await prisma.tooth.createMany({
      data: adultTeeth.map(toothNumber => ({
        patientId: patient.id,
        practiceId: user.practiceId,
        toothNumber,
        status: 'PRESENT',
        isPrimary: false,
      })),
    });

    // Map old codes to NZA codes and create treatment records
    const nzaCodes = await prisma.nzaCode.findMany({ where: { isActive: true } });
    const codeMap = new Map(nzaCodes.map(c => [c.code.toUpperCase(), c]));

    // Code mapping from old system to NZA
    const CODE_ALIASES: Record<string, string> = {
      '1C': 'V21', '2C': 'V22', '3C': 'V23', '4C': 'V24',
      'GIA': 'A10', 'COF': 'A15',
      'M0340': 'M03', 'M0330': 'M03',
      'BW2': 'X02', 'BW4': 'X03',
    };

    let importedTreatments = 0;
    const treatmentNotes: string[] = [];

    for (const t of parsed.treatments || []) {
      const upperCode = (t.code || '').toUpperCase().trim();
      if (!upperCode) continue;

      // Try direct match, then alias
      const nza = codeMap.get(upperCode) || codeMap.get(CODE_ALIASES[upperCode] || '');

      const toothNum = t.toothNumber ? parseInt(t.toothNumber) : null;
      const performedAt = t.date ? new Date(t.date) : new Date();

      if (nza) {
        // Find tooth record if applicable
        let toothId: string | null = null;
        if (toothNum) {
          const tooth = await prisma.tooth.findFirst({
            where: { patientId: patient.id, toothNumber: toothNum },
          });
          toothId = tooth?.id || null;
        }

        await prisma.treatment.create({
          data: {
            practiceId: user.practiceId,
            patientId: patient.id,
            performedBy: user.id,
            nzaCodeId: nza.id,
            toothId,
            description: t.description || nza.descriptionNl,
            status: 'COMPLETED',
            performedAt,
            quantity: 1,
            unitPrice: parseFloat(t.patientCost) || Number(nza.maxTariff),
            totalPrice: parseFloat(t.patientCost) || Number(nza.maxTariff),
            notes: `Geïmporteerd uit oud systeem (code: ${t.code})`,
          },
        });
        importedTreatments++;
      } else {
        // Log unmatched codes as clinical notes
        treatmentNotes.push(`${t.date} | ${t.code} | El ${t.toothNumber || '-'} | ${t.description} | €${t.patientCost}`);
      }
    }

    // Create a clinical note with unmatched treatments
    if (treatmentNotes.length > 0) {
      await prisma.clinicalNote.create({
        data: {
          practiceId: user.practiceId,
          patientId: patient.id,
          authorId: user.id,
          noteType: 'PROGRESS',
          content: `Geïmporteerde behandelingen (niet-gekoppelde codes):\n\n${treatmentNotes.join('\n')}`,
          isConfidential: false,
        },
      });
    }

    return Response.json({
      success: true,
      patient: {
        id: patient.id,
        patientNumber: patient.patientNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
      },
      stats: {
        treatmentsImported: importedTreatments,
        treatmentsUnmatched: treatmentNotes.length,
        totalTreatments: (parsed.treatments || []).length,
      },
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
