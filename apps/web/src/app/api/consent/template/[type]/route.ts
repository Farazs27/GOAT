import { NextRequest } from 'next/server';
import { withAuth, handleError } from '@/lib/auth';
import { CONSENT_TEMPLATES } from '@/lib/consent-templates';

export async function GET(request: NextRequest, { params }: { params: Promise<{ type: string }> }) {
  try {
    await withAuth(request);
    const { type } = await params;

    const template = CONSENT_TEMPLATES[type] || CONSENT_TEMPLATES['GENERAL'];
    return Response.json(template);
  } catch (error) {
    return handleError(error);
  }
}
