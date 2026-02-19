import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, requireRoles, handleError, ApiError } from "@/lib/auth";
import { UserRole } from "@nexiom/shared-types";
import {
  buildHealthAnalysisPrompt,
  parseHealthAnalysisResponse,
  HealthInsight,
  getHealthInsightsCacheKey,
  isCacheValid,
} from "@/lib/ai/health-analysis";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

// In-memory cache for health insights (per patient)
const insightsCache = new Map<
  string,
  { data: HealthInsight; timestamp: string }
>();

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const patientId = user.patientId;
    if (!patientId) {
      throw new ApiError("Patient ID niet gevonden", 400);
    }

    // Check cache first
    const cacheKey = getHealthInsightsCacheKey(patientId);
    const cached = insightsCache.get(cacheKey);
    if (cached && isCacheValid(cached.timestamp)) {
      return Response.json({
        ...cached.data,
        cached: true,
        cachedAt: cached.timestamp,
      });
    }

    // Fetch patient's latest periodontal charts
    const periodontalCharts = await prisma.periodontalChart.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 3,
      select: {
        chartData: true,
        createdAt: true,
      },
    });

    // Fetch recent clinical notes
    const clinicalNotes = await prisma.clinicalNote.findMany({
      where: { patientId },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        content: true,
        createdAt: true,
        noteType: true,
      },
    });

    // Fetch last visit date
    const lastAppointment = await prisma.appointment.findFirst({
      where: {
        patientId,
        status: "COMPLETED",
      },
      orderBy: { startTime: "desc" },
      select: { startTime: true },
    });

    // If no data available, return default response
    const hasData = periodontalCharts.length > 0 || clinicalNotes.length > 0;

    if (!hasData) {
      const defaultInsight: HealthInsight = {
        overallScore: 50,
        riskLevel: "MEDIUM",
        keyFindings: [
          "Nog geen parodontale metingen beschikbaar",
          "Regelmatige controles zijn belangrijk voor preventie",
        ],
        personalizedTips: [
          {
            icon: "Calendar",
            title: "Plan een controle",
            description:
              "Regelmatige controles helpen problemen vroegtijdig te signaleren",
          },
          {
            icon: "Sparkles",
            title: "Poets tweemaal daags",
            description:
              "Poets 2 minuten, minstens 2 keer per dag met fluoride tandpasta",
          },
          {
            icon: "Heart",
            title: "Gebruik interdentaal reiniging",
            description:
              "Reinig tussen uw tanden met ragers of floss dagelijks",
          },
        ],
        areasNeedingAttention: ["Plan uw eerste parodontale screening"],
        analyzedAt: new Date().toISOString(),
      };

      insightsCache.set(cacheKey, {
        data: defaultInsight,
        timestamp: defaultInsight.analyzedAt,
      });
      return Response.json(defaultInsight);
    }

    // If no Gemini API key, return basic analysis
    if (!GEMINI_API_KEY) {
      const basicInsight = generateBasicInsight(
        periodontalCharts,
        clinicalNotes,
        lastAppointment?.startTime,
      );
      insightsCache.set(cacheKey, {
        data: basicInsight,
        timestamp: basicInsight.analyzedAt,
      });
      return Response.json(basicInsight);
    }

    // Build prompt and call Gemini
    const prompt = buildHealthAnalysisPrompt({
      periodontalCharts: periodontalCharts.map((chart) => ({
        chartData: chart.chartData as any,
        createdAt: chart.createdAt.toISOString(),
      })),
      clinicalNotes: clinicalNotes.map((note) => ({
        content: note.content,
        createdAt: note.createdAt.toISOString(),
        noteType: note.noteType,
      })),
      lastVisitDate: lastAppointment?.startTime?.toISOString(),
    });

    // Call Gemini API
    const geminiResponse = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.2,
          topP: 0.9,
          maxOutputTokens: 2048,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errText = await geminiResponse.text();
      console.error("Gemini API error:", errText);
      // Fall back to basic analysis
      const basicInsight = generateBasicInsight(
        periodontalCharts,
        clinicalNotes,
        lastAppointment?.startTime,
      );
      insightsCache.set(cacheKey, {
        data: basicInsight,
        timestamp: basicInsight.analyzedAt,
      });
      return Response.json(basicInsight);
    }

    const geminiData = await geminiResponse.json();
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      const basicInsight = generateBasicInsight(
        periodontalCharts,
        clinicalNotes,
        lastAppointment?.startTime,
      );
      insightsCache.set(cacheKey, {
        data: basicInsight,
        timestamp: basicInsight.analyzedAt,
      });
      return Response.json(basicInsight);
    }

    // Parse the response
    const parsedInsight = parseHealthAnalysisResponse(responseText);

    if (!parsedInsight) {
      console.error("Failed to parse Gemini response:", responseText);
      const basicInsight = generateBasicInsight(
        periodontalCharts,
        clinicalNotes,
        lastAppointment?.startTime,
      );
      insightsCache.set(cacheKey, {
        data: basicInsight,
        timestamp: basicInsight.analyzedAt,
      });
      return Response.json(basicInsight);
    }

    // Cache and return
    insightsCache.set(cacheKey, {
      data: parsedInsight,
      timestamp: parsedInsight.analyzedAt,
    });
    return Response.json({
      ...parsedInsight,
      cached: false,
    });
  } catch (error) {
    return handleError(error);
  }
}

function generateBasicInsight(
  charts: any[],
  notes: any[],
  lastVisit?: Date,
): HealthInsight {
  const latestChart = charts[0];
  let score = 75;
  const findings: string[] = [];
  const tips: HealthInsight["personalizedTips"] = [];
  const attentionAreas: string[] = [];
  let riskLevel: HealthInsight["riskLevel"] = "LOW";

  // Analyze periodontal data if available
  if (latestChart) {
    const data = latestChart.chartData as any;
    const teeth = data?.teeth || [];

    let totalDepth = 0;
    let count = 0;
    let bleedingCount = 0;
    let bleedingTotal = 0;
    let sitesOver5mm = 0;

    for (const tooth of teeth) {
      if (tooth.pocketDepths) {
        for (const depth of tooth.pocketDepths) {
          totalDepth += depth;
          count++;
          if (depth > 5) sitesOver5mm++;
        }
      }
      if (tooth.bleedingPoints) {
        bleedingTotal += tooth.bleedingPoints.length;
        bleedingCount += tooth.bleedingPoints.filter((b: boolean) => b).length;
      }
    }

    const avgDepth = count > 0 ? totalDepth / count : 0;
    const bleedingPct =
      bleedingTotal > 0 ? (bleedingCount / bleedingTotal) * 100 : 0;

    // Calculate score based on metrics
    if (avgDepth > 4) {
      score -= 15;
      findings.push(
        `Gemiddelde pocketdiepte van ${avgDepth.toFixed(1)}mm vereist aandacht`,
      );
      attentionAreas.push("Pocketdieptes verminderen");
    } else if (avgDepth > 3) {
      score -= 8;
      findings.push(
        `Gemiddelde pocketdiepte van ${avgDepth.toFixed(1)}mm is acceptabel maar kan beter`,
      );
    } else {
      findings.push(
        `Goede pocketdieptes gemeten (${avgDepth.toFixed(1)}mm gemiddeld)`,
      );
    }

    if (bleedingPct > 20) {
      score -= 10;
      findings.push(
        `${Math.round(bleedingPct)}% van de locaties toonde bloeding bij onderzoek`,
      );
      attentionAreas.push("Tandvleesontsteking verminderen");
      tips.push({
        icon: "Heart",
        title: "Verbeter uw tandvleesverzorging",
        description:
          "Bloedend tandvlees kan duiden op ontsteking. Poets zachtjes langs de tandvleesrand",
      });
    } else {
      findings.push("Weinig tot geen bloeding bij onderzoek - goed teken!");
    }

    if (sitesOver5mm > 3) {
      score -= 10;
      attentionAreas.push("Diepe pockets (>5mm) behandelen");
    }
  } else {
    findings.push("Nog geen parodontale metingen beschikbaar");
    score -= 10;
  }

  // Check last visit
  if (lastVisit) {
    const daysSince = Math.floor(
      (Date.now() - lastVisit.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (daysSince > 365) {
      score -= 20;
      findings.push(`Laatste bezoek was meer dan een jaar geleden`);
      attentionAreas.push("Plan een controleafspraak");
      tips.push({
        icon: "Calendar",
        title: "Plan een controle",
        description:
          "Het is meer dan een jaar geleden sinds uw laatste bezoek. Regelmatige controles zijn essentieel",
      });
    } else if (daysSince > 180) {
      score -= 10;
      findings.push(
        `Laatste bezoek was ${Math.round(daysSince / 30)} maanden geleden`,
      );
    } else {
      findings.push("Recent tandartsbezoek - goede zorg!");
    }
  } else {
    score -= 15;
    findings.push("Geen recent tandartsbezoek geregistreerd");
    attentionAreas.push("Plan een eerste controle");
  }

  // Determine risk level
  if (score < 50) {
    riskLevel = "HIGH";
  } else if (score < 75) {
    riskLevel = "MEDIUM";
  }

  // Add default tips if not enough
  if (tips.length < 3) {
    tips.push(
      {
        icon: "Sparkles",
        title: "Poets tweemaal daags",
        description:
          "Poets 2 minuten, minstens 2 keer per dag met fluoride tandpasta",
      },
      {
        icon: "Target",
        title: "Reinig tussen de tanden",
        description:
          "Gebruik tandenragers of floss dagelijks voor een complete reiniging",
      },
    );
  }

  return {
    overallScore: Math.max(0, Math.min(100, score)),
    riskLevel,
    keyFindings: findings.slice(0, 4),
    personalizedTips: tips.slice(0, 5),
    areasNeedingAttention: attentionAreas.slice(0, 3),
    analyzedAt: new Date().toISOString(),
  };
}
