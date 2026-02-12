import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const all = url.searchParams.get('all') === 'true';
    const grouped = url.searchParams.get('grouped') === 'true';

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { descriptionNl: { contains: search, mode: 'insensitive' } },
      ];
    }

    const codes = await prisma.nzaCode.findMany({
      where,
      ...(all || grouped ? {} : { take: limit }),
      orderBy: { code: 'asc' },
      select: {
        id: true,
        code: true,
        category: true,
        descriptionNl: true,
        descriptionEn: true,
        maxTariff: true,
        unit: true,
        requiresTooth: true,
        requiresSurface: true,
        validFrom: true,
        validUntil: true,
        subcategory: true,
        toelichting: true,
        points: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (grouped) {
      const categoryMap = new Map<string, { code: string; name: string; subcategories: Map<string, any[]> }>();

      for (const nzaCode of codes) {
        const catCode = nzaCode.category;
        if (!categoryMap.has(catCode)) {
          categoryMap.set(catCode, { code: catCode, name: catCode, subcategories: new Map() });
        }
        const cat = categoryMap.get(catCode)!;
        const subName = nzaCode.subcategory || 'Overig';
        if (!cat.subcategories.has(subName)) {
          cat.subcategories.set(subName, []);
        }
        cat.subcategories.get(subName)!.push({
          id: nzaCode.id,
          code: nzaCode.code,
          descriptionNl: nzaCode.descriptionNl,
          maxTariff: nzaCode.maxTariff,
          points: nzaCode.points,
          toelichting: nzaCode.toelichting,
          requiresTooth: nzaCode.requiresTooth,
        });
      }

      const categories = Array.from(categoryMap.values()).map((cat) => ({
        code: cat.code,
        name: cat.name,
        subcategories: Array.from(cat.subcategories.entries()).map(([name, codes]) => ({
          name,
          codes,
        })),
      }));

      return Response.json({ categories });
    }

    return Response.json(codes);
  } catch (error) {
    return handleError(error);
  }
}
