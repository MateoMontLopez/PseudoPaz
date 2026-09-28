export interface FingerprintInput {
  studentName: string;
  subject: string;
  course: string;
  workTitle: string;
  code: string;
  sessionId?: string;
  timestamp?: string;
}

export interface FingerprintResult {
  fullHash: string;
  shortHash: string;
  watermarkText: string;
  timestampIso: string;
  timestampFormatted: string;
  sessionId: string;
  codeHash: string;
}

/**
 * Calcula el digest SHA-256 de una cadena de texto utilizando Web Crypto API nativa.
 */
export async function computeSha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Genera un UUID v4 simple para trazabilidad de sesión.
 */
export function generateSessionUUID(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Genera la huella criptográfica de autenticidad para el documento PDF.
 * Nivel 1 y Nivel 2 de protección anti-plagio.
 */
export async function createCryptoFingerprint(input: FingerprintInput): Promise<FingerprintResult> {
  const studentUpper = input.studentName.trim().toUpperCase();
  const subjectTrimmed = input.subject.trim();
  const courseTrimmed = input.course.trim();
  const workTitleTrimmed = input.workTitle.trim();
  const codeContent = input.code || '';
  const timestampIso = input.timestamp || new Date().toISOString();
  const sessionId = input.sessionId || generateSessionUUID();

  // 1. Hash del código fuente puro
  const codeHash = await computeSha256(codeContent);

  // 2. Combinación determinista para el Hash de Integridad Global
  const payloadToHash = [
    studentUpper,
    subjectTrimmed,
    courseTrimmed,
    workTitleTrimmed,
    timestampIso,
    codeHash,
    sessionId,
  ].join('|');

  const fullHash = await computeSha256(payloadToHash);

  // 3. Hash resumido en bloques de 4 caracteres para encabezado y marcas legibles
  const rawShort = fullHash.substring(0, 16).toUpperCase();
  const shortHash = rawShort.match(/.{1,4}/g)?.join('-') || rawShort;

  // 4. Marca de agua personalizada repetible
  const watermarkText = `ENTREGA DE: ${studentUpper} | CURSO: ${courseTrimmed} | ID: ${shortHash}`;

  const timestampFormatted = new Date(timestampIso).toLocaleString('es-CO', {
    dateStyle: 'full',
    timeStyle: 'medium',
  });

  return {
    fullHash,
    shortHash,
    watermarkText,
    timestampIso,
    timestampFormatted,
    sessionId,
    codeHash,
  };
}
