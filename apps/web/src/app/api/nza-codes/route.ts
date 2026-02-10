import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);
    const url = new URL(request.url);
    const search = url.searchParams.get('search') || undefined;
    const limit = parseInt(url.searchParams.get('limit') || '20');

    const where: any = { isActive: true };
    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { descriptionNl: { contains: search, mode: 'insensitive' } },
      ];
    }

    const codes = await prisma.nzaCode.findMany({
      where,
      take: limit,
      orderBy: { code: 'asc' },
    });

    return Response.json(codes);
  } catch (error) {
    return handleError(error);
  }
}
