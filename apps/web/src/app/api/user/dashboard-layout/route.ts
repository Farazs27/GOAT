import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, handleError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { dashboardLayout: true },
    });
    return Response.json(dbUser?.dashboardLayout || null);
  } catch (error) {
    return handleError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await withAuth(request);
    const body = await request.json();

    await prisma.user.update({
      where: { id: user.id },
      data: { dashboardLayout: body },
    });

    return Response.json({ success: true });
  } catch (error) {
    return handleError(error);
  }
}
