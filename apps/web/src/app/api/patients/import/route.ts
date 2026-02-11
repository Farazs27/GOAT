import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@dentflow/database";
import { withAuth, handleError, ApiError } from "@/lib/auth";

// Dynamic import for pdf-parse to handle serverless environment
async function parsePdf(buffer: Buffer): Promise<{ text: string }> {
  const pdfModule: any = await import("pdf-parse");
  // Handle both CommonJS and ESM exports
  const parse = pdfModule.default || pdfModule;
  return parse(buffer);
}

// Comprehensive mapping from old dental system codes to NZA codes
const CODE_ALIASES: Record<string, string> = {
  // Vullingen (old shorthand → NZA)
  "1C": "V21",
  "2C": "V22",
  "3C": "V23",
  "4C": "V24",
  "1V": "V21",
  "2V": "V22",
  "3V": "V23",
  "4V": "V24",
  // Anesthesie
  GIA: "A10",
  ANESTH: "A10",
  // Cofferdam
  COF: "A15",
  COFFERDAM: "A15",
  // Gebitsreiniging (old 4-digit → NZA 3-char)
  M0340: "M03",
  M0330: "M03",
  M0320: "M03",
  M340: "M03",
  M330: "M03",
  M320: "M03",
  // Röntgen
  BW2: "X02",
  BW4: "X03",
  OPG: "X21",
  // Consulten (old 3-digit with leading zero → NZA 2-digit)
  C001: "C01",
  C002: "C02",
  C003: "C03",
  C011: "C11",
  C013: "C13",
  // PPS score
  PPS: "M05",
};

// Codes to skip (not real treatments)
const SKIP_CODES = new Set(["FACTU", "OPROEP", "BEGIN", "#", "GEPIND"]);

// Parse DD-MM-YY or DD-MM-YYYY to YYYY-MM-DD
function parseDate(dateStr: string): string | null {
  const m = dateStr.trim().match(/^(\d{1,2})-(\d{1,2})-(\d{2,4})$/);
  if (!m) return null;
  const day = m[1].padStart(2, "0");
  const month = m[2].padStart(2, "0");
  let year = m[3];
  if (year.length === 2) {
    const y = parseInt(year);
    year = (y > 50 ? "19" : "20") + year;
  }
  return `${year}-${month}-${day}`;
}

// Parse the header section of PatientenKaart
function parsePatientHeader(text: string) {
  const get = (label: string): string => {
    // Match "Label: value" or "Label:\nvalue" patterns
    const regex = new RegExp(`${label}:\\s*(.+?)(?:\\n|$)`, "i");
    const match = text.match(regex);
    return match ? match[1].trim() : "";
  };

  const rawName = get("Naam");
  const voornaam = get("Voornaam");
  const geslacht = get("Geslacht");
  const geboortedatum = get("Geboortedatum");
  const adres = get("Adres");
  const woonplaats = get("Woonplaats");
  const bsn = get("BSN");
  const mobielnr = get("Mobielnr\\.?") || get("Mobielnr");
  const telnrPrive = get("Telnr\\.privé") || get("Telnr\\.prive");
  const code = get("Code");

  // Parse insurance from BasisVerz line
  const basisVerz = get("BasisVerz\\.?") || get("BasisVerz");
  const polisNr = get("Polisnr\\. basis\\.?") || get("Polisnr\\. basis");

  // Extract last name from "F. (Faysal) MULLER" format
  let lastName = "";
  let firstName = voornaam;
  if (rawName) {
    // Try "F. (Faysal) MULLER" or "MULLER" pattern
    const nameMatch = rawName.match(/(?:\w+\.\s*)?(?:\([^)]+\)\s*)?(.+)/);
    if (nameMatch) {
      lastName = nameMatch[1].trim();
    }
  }
  if (!firstName && rawName) {
    const fnMatch = rawName.match(/\(([^)]+)\)/);
    if (fnMatch) firstName = fnMatch[1];
  }

  // Parse woonplaats into postal + city
  let addressPostal = "";
  let addressCity = "";
  if (woonplaats) {
    const postalMatch = woonplaats.match(/^(\d{4}\s*[A-Z]{2})\s+(.+)/);
    if (postalMatch) {
      addressPostal = postalMatch[1];
      addressCity = postalMatch[2];
    } else {
      addressCity = woonplaats;
    }
  }

  // Extract email from oproep lines
  let email = "";
  const emailMatch = text.match(/Opgeroepen per email\s*\(([^)]+)\)/i);
  if (emailMatch) {
    email = emailMatch[1].trim();
  }

  // Clean insurance name (remove "O 3311 " prefix)
  let insuranceCompany = basisVerz;
  const insMatch = basisVerz.match(/^O\s+\d+\s+(.+)/);
  if (insMatch) {
    insuranceCompany = insMatch[1];
  }

  return {
    patientNumber: code,
    firstName,
    lastName,
    dateOfBirth: parseDate(geboortedatum) || "",
    gender: geslacht === "M" ? "M" : geslacht === "V" ? "F" : geslacht,
    phone: mobielnr || telnrPrive,
    email,
    bsn: bsn.replace(/\D/g, ""),
    addressStreet: adres,
    addressCity,
    addressPostal,
    insuranceCompany,
    insuranceNumber: polisNr.replace(/\D/g, "") || bsn.replace(/\D/g, ""),
  };
}

interface ParsedTreatment {
  date: string;
  toothNumber: string;
  code: string;
  description: string;
  surface: string;
  patientCost: number;
  practitioner: string;
}

interface ParsedInvoice {
  date: string;
  invoiceNumber: string;
  totalAmount: number;
}

// Parse treatment lines from the table section
function parseTreatmentLines(text: string): {
  treatments: ParsedTreatment[];
  invoices: ParsedInvoice[];
} {
  const treatments: ParsedTreatment[] = [];
  const invoices: ParsedInvoice[] = [];
  const lines = text.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Skip email lines
    if (trimmed.includes("Email uit:")) continue;

    // Parse invoice lines: "21-03-21 -----F/1900056---... 78,38 F*"
    const invoiceMatch = trimmed.match(
      /^(\d{1,2}-\d{1,2}-\d{2,4})\s+-----F\/(\d+)-+\s+([\d,.]+)/,
    );
    if (invoiceMatch) {
      const date = parseDate(invoiceMatch[1]);
      if (date) {
        invoices.push({
          date,
          invoiceNumber: invoiceMatch[2],
          totalAmount: parseFloat(invoiceMatch[3].replace(",", ".")),
        });
      }
      continue;
    }

    // Parse treatment lines: "13-03-21 C11 1e bezoek nieuwe patient 0,00 >> FA"
    // Or with tooth: "20-03-21 26 2c 2 vlaks composiet [.mo-MO] 63,31 ** FA"
    // Format: DATE [TOOTH] CODE DESCRIPTION COST [INSURANCE_INDICATOR] PRACTITIONER
    const dateMatch = trimmed.match(/^(\d{1,2}-\d{1,2}-\d{2,4})\s+(.+)/);
    if (!dateMatch) continue;

    const date = parseDate(dateMatch[1]);
    if (!date) continue;

    const rest = dateMatch[2];

    // Skip non-treatment lines
    if (
      rest.startsWith("-----") ||
      rest.startsWith("#") ||
      rest.startsWith("begin")
    )
      continue;
    if (/^(factu|oproep|gepind)/i.test(rest)) continue;

    // Try to parse: [toothNumber] code description cost [indicator] practitioner
    // Tooth number is 2 digits (11-48), code is alphanumeric
    let toothNumber = "";
    let remaining = rest;

    // Check if starts with tooth number (2 digits, range 11-48)
    const toothMatch = remaining.match(/^(\d{2})\s+(.+)/);
    if (toothMatch) {
      const num = parseInt(toothMatch[1]);
      if (num >= 11 && num <= 48) {
        toothNumber = toothMatch[1];
        remaining = toothMatch[2];
      }
    }

    // Extract code (first word - alphanumeric, like C11, M0340, 2c, gia, cof, A10, pps, bw2)
    const codeMatch = remaining.match(/^([A-Za-z]\w*|\d[A-Za-z]\w*)\s+(.+)/);
    if (!codeMatch) continue;

    const code = codeMatch[1];
    remaining = codeMatch[2];

    // Skip non-treatment codes
    if (SKIP_CODES.has(code.toUpperCase())) continue;

    // Extract cost and practitioner from the end
    // Pattern: "description 63,31 ** FA" or "description 0,00 >> FA"
    let patientCost = 0;
    let practitioner = "";
    let description = remaining;
    let surface = "";

    // Try to extract cost + indicator + practitioner from end
    const costMatch = remaining.match(
      /^(.+?)\s+([\d,.]+)\s+([*>]+|F\*?)\s*([A-Z]{1,3})\s*$/,
    );
    if (costMatch) {
      description = costMatch[1].trim();
      patientCost = parseFloat(costMatch[2].replace(",", ".")) || 0;
      practitioner = costMatch[4];
    } else {
      // Try without cost (some lines just have practitioner)
      const practMatch = remaining.match(/^(.+?)\s+([A-Z]{2,3})\s*$/);
      if (practMatch) {
        description = practMatch[1].trim();
        practitioner = practMatch[2];
      }
    }

    // Extract surface info from description like "[.mo-MO]" or "[.b-B]"
    const surfaceMatch = description.match(/\[\.([^\]]+)\]/);
    if (surfaceMatch) {
      surface = surfaceMatch[1];
    }

    treatments.push({
      date,
      toothNumber,
      code,
      description,
      surface,
      patientCost,
      practitioner,
    });
  }

  return { treatments, invoices };
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      throw new ApiError("PDF bestand is vereist", 400);
    }

    if (!file.type.includes("pdf")) {
      throw new ApiError("Alleen PDF bestanden worden ondersteund", 400);
    }

    // Extract text from PDF
    const bytes = await file.arrayBuffer();
    const pdfData = await parsePdf(Buffer.from(bytes));
    const text = pdfData.text;

    if (!text || text.length < 50) {
      throw new ApiError("PDF bevat geen leesbare tekst", 400);
    }

    // Parse patient header
    const patientInfo = parsePatientHeader(text);

    if (!patientInfo.firstName || !patientInfo.lastName) {
      throw new ApiError("Geen patiëntgegevens gevonden in PDF", 400);
    }

    // Parse treatment lines
    const { treatments, invoices } = parseTreatmentLines(text);

    // Check if patient already exists (by BSN or name + DOB)
    const existingPatient = await prisma.patient.findFirst({
      where: {
        practiceId: user.practiceId,
        OR: [
          ...(patientInfo.bsn ? [{ bsn: patientInfo.bsn }] : []),
          {
            firstName: {
              equals: patientInfo.firstName,
              mode: "insensitive" as const,
            },
            lastName: {
              equals: patientInfo.lastName,
              mode: "insensitive" as const,
            },
            ...(patientInfo.dateOfBirth
              ? { dateOfBirth: new Date(patientInfo.dateOfBirth) }
              : {}),
          },
        ],
      },
    });

    if (existingPatient) {
      throw new ApiError(
        `Patiënt "${patientInfo.firstName} ${patientInfo.lastName}" bestaat al (${existingPatient.patientNumber})`,
        409,
      );
    }

    // Generate patient number
    const lastPatient = await prisma.patient.findFirst({
      where: { practiceId: user.practiceId },
      orderBy: { patientNumber: "desc" },
    });
    const nextNumber = lastPatient
      ? parseInt(lastPatient.patientNumber.split("-")[2]) + 1
      : 1;
    const patientNumber = `P-${new Date().getFullYear()}-${String(nextNumber).padStart(4, "0")}`;

    // Create patient
    const patient = await prisma.patient.create({
      data: {
        practiceId: user.practiceId,
        patientNumber,
        firstName: patientInfo.firstName,
        lastName: patientInfo.lastName,
        dateOfBirth: patientInfo.dateOfBirth
          ? new Date(patientInfo.dateOfBirth)
          : new Date(),
        gender: patientInfo.gender || null,
        phone: patientInfo.phone || null,
        email: patientInfo.email || null,
        bsn: patientInfo.bsn || null,
        addressStreet: patientInfo.addressStreet || null,
        addressCity: patientInfo.addressCity || null,
        addressPostal: patientInfo.addressPostal || null,
        insuranceCompany: patientInfo.insuranceCompany || null,
        insuranceNumber: patientInfo.insuranceNumber || null,
        medicalAlerts: [],
        medications: [],
        gdprConsentAt: new Date(),
        isActive: true,
      },
    });

    // Initialize 32 adult teeth
    const adultTeeth = [
      11, 12, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 25, 26, 27, 28, 31, 32,
      33, 34, 35, 36, 37, 38, 41, 42, 43, 44, 45, 46, 47, 48,
    ];
    await prisma.tooth.createMany({
      data: adultTeeth.map((toothNumber) => ({
        patientId: patient.id,
        practiceId: user.practiceId,
        toothNumber,
        status: "PRESENT",
        isPrimary: false,
      })),
    });

    // Load teeth for lookup
    const teeth = await prisma.tooth.findMany({
      where: { patientId: patient.id },
    });
    const toothMap = new Map(teeth.map((t) => [t.toothNumber, t.id]));

    // Load NZA codes
    const nzaCodes = await prisma.nzaCode.findMany({
      where: { isActive: true },
    });
    const codeMap = new Map(nzaCodes.map((c) => [c.code.toUpperCase(), c]));

    // Resolve NZA code with multiple matching strategies
    function resolveNzaCode(rawCode: string) {
      const upper = rawCode.toUpperCase().trim();
      // Direct match
      let nza = codeMap.get(upper);
      if (nza) return nza;
      // Alias
      if (CODE_ALIASES[upper]) {
        nza = codeMap.get(CODE_ALIASES[upper]);
        if (nza) return nza;
      }
      // Strip leading zeros: C002 → C2, then pad: C2 → C02
      const stripped = upper.replace(/^([A-Z]+)0+(\d+)$/, "$1$2");
      if (stripped !== upper) {
        nza = codeMap.get(stripped);
        if (nza) return nza;
        const padded = stripped.replace(/^([A-Z]+)(\d)$/, "$10$2");
        nza = codeMap.get(padded);
        if (nza) return nza;
      }
      // Pad single digit: C2 → C02
      const padded = upper.replace(/^([A-Z]+)(\d)$/, "$10$2");
      if (padded !== upper) {
        nza = codeMap.get(padded);
        if (nza) return nza;
      }
      return null;
    }

    let importedTreatments = 0;
    const treatmentNotes: string[] = [];

    for (const t of treatments) {
      const nza = resolveNzaCode(t.code);
      const toothNum = t.toothNumber ? parseInt(t.toothNumber) : null;
      const performedAt = new Date(t.date);

      if (nza) {
        const toothId = toothNum ? toothMap.get(toothNum) || null : null;
        let description = t.description || nza.descriptionNl;
        if (t.surface) description += ` [${t.surface}]`;

        await prisma.treatment.create({
          data: {
            practiceId: user.practiceId,
            patientId: patient.id,
            performedBy: user.id,
            nzaCodeId: nza.id,
            toothId,
            description,
            status: "COMPLETED",
            performedAt,
            quantity: 1,
            unitPrice: t.patientCost || Number(nza.maxTariff),
            totalPrice: t.patientCost || Number(nza.maxTariff),
            notes: `Geïmporteerd (code: ${t.code}${t.practitioner ? ", mw: " + t.practitioner : ""})`,
          },
        });
        importedTreatments++;
      } else {
        treatmentNotes.push(
          `${t.date} | ${t.code} | El ${t.toothNumber || "-"} | ${t.description} | €${t.patientCost.toFixed(2)}`,
        );
      }
    }

    // Create invoices
    let invoicesCreated = 0;
    for (const inv of invoices) {
      if (inv.totalAmount <= 0) continue;
      const invoiceNumber = `IMP-${inv.invoiceNumber}`;
      const existing = await prisma.invoice.findFirst({
        where: { practiceId: user.practiceId, invoiceNumber },
      });
      if (existing) continue;

      const invoiceDate = new Date(inv.date);
      const dueDate = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + 30);

      await prisma.invoice.create({
        data: {
          practiceId: user.practiceId,
          patientId: patient.id,
          invoiceNumber,
          invoiceDate,
          dueDate,
          subtotal: inv.totalAmount,
          taxAmount: 0,
          total: inv.totalAmount,
          insuranceAmount: 0,
          patientAmount: inv.totalAmount,
          status: "PAID",
          paidAmount: inv.totalAmount,
          notes: `Geïmporteerd (origineel: F/${inv.invoiceNumber})`,
        },
      });
      invoicesCreated++;
    }

    // Save unmatched as clinical note
    if (treatmentNotes.length > 0) {
      await prisma.clinicalNote.create({
        data: {
          practiceId: user.practiceId,
          patientId: patient.id,
          authorId: user.id,
          noteType: "PROGRESS",
          content: `Geïmporteerde behandelingen (niet-gekoppelde codes):\n\n${treatmentNotes.join("\n")}`,
          isConfidential: false,
        },
      });
    }

    // Summary note
    await prisma.clinicalNote.create({
      data: {
        practiceId: user.practiceId,
        patientId: patient.id,
        authorId: user.id,
        noteType: "PROGRESS",
        content: [
          `Import samenvatting uit oud systeem:`,
          `- ${importedTreatments} behandelingen geïmporteerd`,
          `- ${treatmentNotes.length} behandelingen niet-gekoppeld`,
          `- ${invoicesCreated} facturen geïmporteerd`,
          `- Oorspronkelijk patiëntnummer: ${patientInfo.patientNumber}`,
          patientInfo.email ? `- Email: ${patientInfo.email}` : "",
        ]
          .filter(Boolean)
          .join("\n"),
        isConfidential: false,
      },
    });

    return NextResponse.json(
      {
        success: true,
        patient: {
          id: patient.id,
          patientNumber: patient.patientNumber,
          firstName: patient.firstName,
          lastName: patient.lastName,
          email: patient.email,
        },
        stats: {
          treatmentsImported: importedTreatments,
          treatmentsUnmatched: treatmentNotes.length,
          totalTreatments: treatments.length,
          invoicesCreated,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    return handleError(error);
  }
}
