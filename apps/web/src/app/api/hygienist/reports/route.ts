import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { withAuth, handleError } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "perio-overview";

    if (type === "perio-overview") {
      const sessions = await prisma.perioSession.findMany({
        where: { practiceId: user.practiceId },
        include: {
          sites: true,
          patient: { select: { id: true } },
        },
      });

      const patientIds = new Set(sessions.map((s) => s.patientId));
      const totalSites = sessions.flatMap((s) => s.sites);
      const bleedingSites = totalSites.filter((s) => s.bleeding).length;
      const plaqueSites = totalSites.filter((s) => s.plaque).length;
      const avgBop = totalSites.length > 0 ? Math.round((bleedingSites / totalSites.length) * 100) : 0;
      const avgPlaque = totalSites.length > 0 ? Math.round((plaqueSites / totalSites.length) * 100) : 0;

      // High risk = patients with BOP > 30%
      const patientBop: Record<string, { bleeding: number; total: number }> = {};
      for (const s of sessions) {
        for (const site of s.sites) {
          if (!patientBop[s.patientId]) patientBop[s.patientId] = { bleeding: 0, total: 0 };
          patientBop[s.patientId].total++;
          if (site.bleeding) patientBop[s.patientId].bleeding++;
        }
      }
      const highRisk = Object.values(patientBop).filter(
        (p) => p.total > 0 && (p.bleeding / p.total) * 100 > 30
      ).length;

      return NextResponse.json({
        totalPatients: patientIds.size,
        avgBop,
        avgPlaque,
        highRiskCount: highRisk,
        totalSessions: sessions.length,
      });
    }

    if (type === "trends") {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const sessions = await prisma.perioSession.findMany({
        where: {
          practiceId: user.practiceId,
          createdAt: { gte: sixMonthsAgo },
        },
        include: { sites: true },
        orderBy: { createdAt: "asc" },
      });

      const monthly: Record<string, { bopTotal: number; siteTotal: number; sessionCount: number }> = {};
      for (const s of sessions) {
        const key = `${s.createdAt.getFullYear()}-${String(s.createdAt.getMonth() + 1).padStart(2, "0")}`;
        if (!monthly[key]) monthly[key] = { bopTotal: 0, siteTotal: 0, sessionCount: 0 };
        monthly[key].sessionCount++;
        for (const site of s.sites) {
          monthly[key].siteTotal++;
          if (site.bleeding) monthly[key].bopTotal++;
        }
      }

      const trends = Object.entries(monthly)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, data]) => ({
          month,
          bopPercent: data.siteTotal > 0 ? Math.round((data.bopTotal / data.siteTotal) * 100) : 0,
          sessionCount: data.sessionCount,
        }));

      return NextResponse.json({ trends });
    }

    if (type === "treatment-stats") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const invoices = await prisma.invoice.findMany({
        where: {
          practiceId: user.practiceId,
          createdAt: { gte: startOfMonth },
        },
        include: {
          lines: { include: { nzaCodeRef: true } },
        },
      });

      const totalRevenue = invoices.reduce((sum, inv) => sum + Number(inv.total), 0);
      const totalTreatments = invoices.reduce((sum, inv) => sum + inv.lines.length, 0);

      // Top 5 procedure codes
      const codeCounts: Record<string, { code: string; description: string; count: number }> = {};
      for (const inv of invoices) {
        for (const item of inv.lines) {
          const code = item.nzaCodeRef?.code || item.description;
          if (!codeCounts[code]) {
            codeCounts[code] = {
              code,
              description: item.nzaCodeRef?.descriptionNl || item.description,
              count: 0,
            };
          }
          codeCounts[code].count++;
        }
      }
      const topCodes = Object.values(codeCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      return NextResponse.json({
        totalTreatments,
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        topCodes,
      });
    }

    if (type === "compliance") {
      const patients = await prisma.patient.findMany({
        where: { practiceId: user.practiceId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          recallSchedules: { take: 1 },
          perioSessions: {
            orderBy: { createdAt: "desc" },
            take: 2,
            include: { sites: true },
          },
          appointments: {
            orderBy: { startTime: "desc" },
            take: 1,
            select: { startTime: true },
          },
        },
      });

      const compliance = patients.map((p) => {
        const recall = p.recallSchedules[0];
        const lastVisit = p.appointments[0]?.startTime || null;

        // BOP trend
        let bopTrend: "up" | "down" | "stable" = "stable";
        if (p.perioSessions.length >= 2) {
          const calcBop = (sites: { bleeding: boolean }[]) =>
            sites.length > 0 ? (sites.filter((s) => s.bleeding).length / sites.length) * 100 : 0;
          const recent = calcBop(p.perioSessions[0].sites);
          const previous = calcBop(p.perioSessions[1].sites);
          if (recent > previous + 5) bopTrend = "up";
          else if (recent < previous - 5) bopTrend = "down";
        }

        const latestBop = p.perioSessions[0]?.sites
          ? Math.round(
              (p.perioSessions[0].sites.filter((s) => s.bleeding).length /
                Math.max(p.perioSessions[0].sites.length, 1)) *
                100
            )
          : null;

        return {
          id: p.id,
          name: `${p.firstName} ${p.lastName}`,
          lastVisit,
          recallStatus: recall?.status || null,
          recallDue: recall?.nextDueDate || null,
          bopPercent: latestBop,
          bopTrend,
          riskLevel:
            latestBop !== null ? (latestBop > 30 ? "high" : latestBop > 15 ? "medium" : "low") : null,
        };
      });

      return NextResponse.json({ compliance });
    }

    return NextResponse.json({ error: "Invalid type parameter" }, { status: 400 });
  } catch (error) {
    return handleError(error);
  }
}
