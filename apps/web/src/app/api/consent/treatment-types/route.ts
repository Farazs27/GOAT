import { NextRequest } from 'next/server';
import { withAuth, handleError } from '@/lib/auth';
import { CONSENT_TEMPLATES } from '@/lib/consent-templates';

export async function GET(request: NextRequest) {
  try {
    await withAuth(request);

    const types = Object.entries(CONSENT_TEMPLATES).map(([key, val]) => ({
      value: key,
      label: val.title,
    }));

    return Response.json(types);
  } catch (error) {
    return handleError(error);
  }
}
