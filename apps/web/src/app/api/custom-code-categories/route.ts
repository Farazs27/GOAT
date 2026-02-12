import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);

    const categories = await prisma.customCodeCategory.findMany({
      where: { practiceId: user.practiceId },
      orderBy: { createdAt: 'desc' },
      include: {
        codes: {
          include: {
            nzaCode: {
              select: {
                id: true,
                code: true,
                descriptionNl: true,
                maxTariff: true,
              },
            },
          },
        },
      },
    });

    return Response.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        description: cat.description,
        codes: cat.codes.map((c) => ({
          nzaCodeId: c.nzaCode.id,
          code: c.nzaCode.code,
          descriptionNl: c.nzaCode.descriptionNl,
          maxTariff: c.nzaCode.maxTariff,
        })),
      })),
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();
    const { name, description, nzaCodeIds } = body;

    if (!name || !Array.isArray(nzaCodeIds) || nzaCodeIds.length === 0) {
      throw new ApiError('Naam en minimaal één code zijn verplicht', 400);
    }

    const category = await prisma.customCodeCategory.create({
      data: {
        name,
        description: description || null,
        practiceId: user.practiceId,
        createdBy: user.id,
        codes: {
          create: nzaCodeIds.map((nzaCodeId: string) => ({
            nzaCodeId,
          })),
        },
      },
      include: {
        codes: {
          include: {
            nzaCode: {
              select: {
                id: true,
                code: true,
                descriptionNl: true,
                maxTariff: true,
              },
            },
          },
        },
      },
    });

    return Response.json({
      id: category.id,
      name: category.name,
      description: category.description,
      codes: category.codes.map((c) => ({
        nzaCodeId: c.nzaCode.id,
        code: c.nzaCode.code,
        descriptionNl: c.nzaCode.descriptionNl,
        maxTariff: c.nzaCode.maxTariff,
      })),
    }, { status: 201 });
  } catch (error) {
    return handleError(error);
  }
}
