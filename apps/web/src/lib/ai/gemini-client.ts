/**
 * Shared Gemini API client — reusable across all AI endpoints.
 */

import { ApiError } from '@/lib/auth';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

export interface GeminiOptions {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

/**
 * Call the Gemini API with a text prompt and return the raw response text.
 */
export async function callGemini(
  prompt: string,
  options: GeminiOptions = {}
): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new ApiError('Gemini API key niet geconfigureerd', 500);
  }

  const { maxTokens = 4096, temperature = 0, topP = 0.8 } = options;

  const response = await fetch(`${GEMINI_URL}?key=${GEMINI_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        topP,
        maxOutputTokens: maxTokens,
        responseMimeType: 'application/json',
      },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Gemini API error:', errText);
    throw new ApiError('AI verwerking mislukt', 502);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new ApiError('Geen AI-antwoord ontvangen', 502);
  }

  return text;
}

/**
 * Safely parse a JSON response from Gemini.
 */
export function parseGeminiJson<T>(response: string): T {
  try {
    return JSON.parse(response) as T;
  } catch {
    console.error('Failed to parse Gemini JSON response:', response);
    throw new ApiError('AI-antwoord kon niet worden verwerkt', 502);
  }
}
