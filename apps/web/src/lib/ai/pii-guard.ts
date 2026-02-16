/**
 * PII Guard — Detects and blocks personally identifiable information
 * before it reaches external AI services (Gemini).
 *
 * Safety net to prevent patient data leakage. The routes already only
 * receive clinical text, but this prevents future regressions.
 */

const PII_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  // BSN (Dutch national ID) — 9 consecutive digits
  { pattern: /\b\d{9}\b/, label: 'BSN (burgerservicenummer)' },
  // Email addresses
  { pattern: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/, label: 'e-mailadres' },
  // Dutch phone numbers: 06-12345678, +31612345678, 06 1234 5678
  { pattern: /(?:\+31|0031|06)[\s-]?\d[\s-]?\d{3,4}[\s-]?\d{4}/, label: 'telefoonnummer' },
  // Common PII field markers (Dutch)
  { pattern: /\b(?:naam|achternaam|voornaam)\s*:/i, label: 'naam-veld' },
  { pattern: /\bgeboortedatum\s*:/i, label: 'geboortedatum-veld' },
  { pattern: /\badres\s*:/i, label: 'adres-veld' },
  { pattern: /\bpostcode\s*:\s*\d{4}\s?[A-Z]{2}/i, label: 'postcode-veld' },
];

/**
 * Throws if PII patterns are detected in the given text.
 * Call before sending any text to external AI services.
 */
export function assertNoPII(text: string): void {
  for (const { pattern, label } of PII_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(
        `PII gedetecteerd in AI-invoer: ${label}. Verwijder persoonlijke gegevens voordat de tekst naar de AI wordt gestuurd.`
      );
    }
  }
}
