import { NextRequest } from 'next/server';
import { verifyToken, signAccessToken, handleError } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { refreshToken } = await request.json();

    if (!refreshToken) {
      return Response.json({ message: 'Refresh token is verplicht' }, { status: 400 });
    }

    const payload = verifyToken(refreshToken);
    const newAccessToken = signAccessToken({
      sub: payload.sub,
      email: payload.email,
      role: payload.role,
      practiceId: payload.practiceId,
      patientId: payload.patientId,
    });

    return Response.json({ access_token: newAccessToken });
  } catch {
    return Response.json({ message: 'Ongeldige refresh token' }, { status: 401 });
  }
}
