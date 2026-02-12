import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError, ApiError } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;
    const body = await request.json();
    const { name, description, nzaCodeIds } = body;

    const existing = await prisma.customCodeCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError('Categorie niet gevonden', 404);
    }
    if (existing.practiceId !== user.practiceId) {
      throw new ApiError('Onvoldoende rechten', 403);
    }

    const category = await prisma.$transaction(async (tx) => {
      if (nzaCodeIds && Array.isArray(nzaCodeIds)) {
        await tx.customCodeCategoryCode.deleteMany({ where: { categoryId: id } });
        await tx.customCodeCategoryCode.createMany({
          data: nzaCodeIds.map((nzaCodeId: string) => ({
            categoryId: id,
            nzaCodeId,
          })),
        });
      }

      return tx.customCodeCategory.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(description !== undefined && { description }),
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
    });
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await withAuth(request);
    const { id } = await params;

    const existing = await prisma.customCodeCategory.findUnique({ where: { id } });
    if (!existing) {
      throw new ApiError('Categorie niet gevonden', 404);
    }
    if (existing.practiceId !== user.practiceId) {
      throw new ApiError('Onvoldoende rechten', 403);
    }

    await prisma.customCodeCategory.delete({ where: { id } });

    return Response.json({ message: 'Categorie verwijderd' });
  } catch (error) {
    return handleError(error);
  }
}
