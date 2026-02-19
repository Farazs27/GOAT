import { NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';
import { withAuth, requireRoles, handleError } from '@/lib/auth';
import { UserRole } from '@nexiom/shared-types';
import { fetchPatientContext } from '@/lib/ai/patient-data-fetcher';
import { buildPatientSystemPrompt, PracticeAiConfig } from '@/lib/ai/patient-system-prompt';
import { assertNoPII } from '@/lib/ai/pii-guard';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_STREAM_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:streamGenerateContent';

// In-memory rate limiting
const rateLimits = new Map<string, { hourCount: number; dayCount: number; hourReset: number; dayReset: number }>();

function checkRateLimit(patientId: string): boolean {
  const now = Date.now();
  let entry = rateLimits.get(patientId);

  if (!entry) {
    entry = { hourCount: 0, dayCount: 0, hourReset: now + 3600_000, dayReset: now + 86400_000 };
    rateLimits.set(patientId, entry);
  }

  if (now > entry.hourReset) {
    entry.hourCount = 0;
    entry.hourReset = now + 3600_000;
  }
  if (now > entry.dayReset) {
    entry.dayCount = 0;
    entry.dayReset = now + 86400_000;
  }

  if (entry.hourCount >= 30 || entry.dayCount >= 200) {
    return false;
  }

  entry.hourCount++;
  entry.dayCount++;
  return true;
}

export async function POST(request: NextRequest) {
  try {
    const user = await withAuth(request);
    requireRoles(user, [UserRole.PATIENT]);

    const patientId = user.patientId!;
    const practiceId = user.practiceId;

    // Rate limiting
    if (!checkRateLimit(patientId)) {
      return Response.json(
        { message: 'U heeft veel berichten verstuurd. Probeer het over een uurtje opnieuw.' },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { message, sessionId: inputSessionId, currentPage } = body as {
      message: string;
      sessionId?: string;
      currentPage?: string;
    };

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ message: 'Bericht is vereist' }, { status: 400 });
    }

    // Check practice AI settings
    const practice = await prisma.practice.findUnique({
      where: { id: practiceId },
      select: { settings: true },
    });

    const settings = (practice?.settings as Record<string, unknown>) ?? {};
    const aiConfig = (settings.aiAssistant as PracticeAiConfig | undefined) ?? { enabled: true };

    if (!aiConfig.enabled) {
      return Response.json(
        { message: 'AI-assistent is niet beschikbaar voor deze praktijk.' },
        { status: 403 }
      );
    }

    // Session handling
    let sessionId = inputSessionId;
    if (sessionId) {
      const session = await prisma.aiChatSession.findFirst({
        where: { id: sessionId, patientId },
      });
      if (!session) {
        return Response.json({ message: 'Sessie niet gevonden' }, { status: 404 });
      }
    } else {
      const newSession = await prisma.aiChatSession.create({
        data: {
          practiceId,
          patientId,
          title: message.slice(0, 50),
        },
      });
      sessionId = newSession.id;
    }

    // Build context and system prompt
    const patientContext = await fetchPatientContext(patientId, currentPage);
    if (!patientContext) {
      return Response.json({ message: 'Patient niet gevonden' }, { status: 404 });
    }

    // Build rich cards from patient data for inline display
    const richCards: Array<Record<string, unknown>> = [];
    const msgLower = message.toLowerCase();
    if (msgLower.includes('afspraak') || msgLower.includes('appointment')) {
      for (const appt of (patientContext.appointments || []).slice(0, 3)) {
        richCards.push({
          type: 'appointment',
          appointmentType: appt.type || 'CHECKUP',
          practitionerName: appt.practitionerName || '',
          date: appt.date || '',
          startTime: appt.time || '',
          endTime: '',
          status: appt.status || 'CONFIRMED',
        });
      }
    }
    if (msgLower.includes('behandelplan') || msgLower.includes('treatment')) {
      for (const plan of (patientContext.treatmentPlans || []).slice(0, 2)) {
        const completed = plan.treatments.filter((t) => t.status === 'COMPLETED').length;
        richCards.push({
          type: 'treatment_plan',
          name: plan.title || 'Behandelplan',
          status: plan.status || 'ACTIVE',
          treatments: plan.treatments.map((t) => ({
            description: t.description,
            toothNumber: t.toothNumber,
            nzaCode: t.nzaCode,
          })),
          completedCount: completed,
          totalCount: plan.treatments.length,
        });
      }
    }
    if (msgLower.includes('factuur') || msgLower.includes('invoice') || msgLower.includes('rekening')) {
      for (const inv of (patientContext.invoices || []).slice(0, 3)) {
        richCards.push({
          type: 'invoice',
          invoiceNumber: inv.invoiceNumber || '',
          date: inv.date || '',
          total: inv.total || 0,
          status: inv.status || 'SENT',
        });
      }
    }

    const systemPrompt = buildPatientSystemPrompt(patientContext, aiConfig);

    // Load conversation history (last 20 messages)
    const history = await prisma.aiChatMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      take: 20,
      select: { role: true, content: true },
    });

    // Load cross-session memory (last 3 session summaries)
    const previousSessions = await prisma.aiChatSession.findMany({
      where: { patientId, id: { not: sessionId } },
      orderBy: { updatedAt: 'desc' },
      take: 3,
      select: { metadata: true },
    });

    const memorySummaries = previousSessions
      .map((s) => {
        const meta = s.metadata as Record<string, unknown> | null;
        return meta?.memorySummary as string | undefined;
      })
      .filter(Boolean);

    // Build Gemini contents array
    const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    // System prompt as first user message
    let systemText = systemPrompt;
    if (memorySummaries.length > 0) {
      systemText += '\n\nEERDERE GESPREKKEN SAMENVATTING:\n' + memorySummaries.join('\n');
    }
    contents.push({ role: 'user', parts: [{ text: systemText }] });
    contents.push({ role: 'model', parts: [{ text: 'Begrepen. Ik ben klaar om te helpen.' }] });

    // Add history
    for (const msg of history) {
      const role = msg.role === 'user' ? 'user' : 'model';
      const last = contents[contents.length - 1];
      if (last && last.role === role) {
        // Merge consecutive same-role messages
        last.parts[0].text += '\n' + msg.content;
      } else {
        contents.push({ role, parts: [{ text: msg.content }] });
      }
    }

    // Add current message
    const lastEntry = contents[contents.length - 1];
    if (lastEntry && lastEntry.role === 'user') {
      lastEntry.parts[0].text += '\n' + message;
    } else {
      contents.push({ role: 'user', parts: [{ text: message }] });
    }

    // PII check on full prompt
    const fullPromptText = contents.map((c) => c.parts.map((p) => p.text).join(' ')).join(' ');
    try {
      assertNoPII(fullPromptText);
    } catch (piiError) {
      console.error('PII detected in AI prompt:', piiError);
      return Response.json(
        { message: 'Persoonlijke gegevens gedetecteerd. Verwijder deze en probeer opnieuw.' },
        { status: 400 }
      );
    }

    // Call Gemini streaming
    if (!GEMINI_API_KEY) {
      return Response.json({ message: 'AI service niet geconfigureerd' }, { status: 500 });
    }

    const geminiResponse = await fetch(
      `${GEMINI_STREAM_URL}?alt=sse&key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 1024,
          },
        }),
      }
    );

    if (!geminiResponse.ok || !geminiResponse.body) {
      console.error('Gemini streaming error:', geminiResponse.status);
      const errorStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode('data: {"error":"Er ging iets mis. Probeer het opnieuw."}\n\n')
          );
          controller.close();
        },
      });
      return new Response(errorStream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          Connection: 'keep-alive',
        },
      });
    }

    // Transform Gemini SSE to client SSE
    let fullResponse = '';
    const finalSessionId = sessionId;
    const userMessage = message;
    const finalRichCards = richCards;

    const reader = geminiResponse.body.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let buffer = '';

    const stream = new ReadableStream({
      async pull(controller) {
        try {
          const { done, value } = await reader.read();

          if (done) {
            // Persist messages after stream completes
            try {
              await prisma.aiChatMessage.createMany({
                data: [
                  { sessionId: finalSessionId, role: 'user', content: userMessage },
                  { sessionId: finalSessionId, role: 'assistant', content: fullResponse || '...' },
                ],
              });
              await prisma.aiChatSession.update({
                where: { id: finalSessionId },
                data: { updatedAt: new Date() },
              });
            } catch (dbErr) {
              console.error('Failed to persist chat messages:', dbErr);
            }

            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ done: true, sessionId: finalSessionId, richCards: finalRichCards.length > 0 ? finalRichCards : undefined })}\n\n`)
            );
            controller.close();
            return;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === '[DONE]') continue;

            try {
              const parsed = JSON.parse(jsonStr);
              const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                fullResponse += text;
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
                );
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        } catch (err) {
          console.error('Stream read error:', err);
          controller.enqueue(
            encoder.encode('data: {"error":"Er ging iets mis. Probeer het opnieuw."}\n\n')
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    return handleError(error);
  }
}
