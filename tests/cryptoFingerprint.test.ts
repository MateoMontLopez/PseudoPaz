import { describe, it, expect } from 'vitest';
import { createCryptoFingerprint, computeSha256, generateSessionUUID } from '../src/services/pdf/cryptoFingerprint';

describe('Servicio Criptográfico Anti-Copia (Fase 4)', () => {
  it('debe calcular hashes SHA-256 usando Web Crypto API', async () => {
    const hash = await computeSha256('test');
    expect(hash).toHaveLength(64);
    expect(hash).toBe('9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08');
  });

  it('debe generar UUID v4 de sesión válido', () => {
    const uuid = generateSessionUUID();
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('debe generar un hash SHA-256 válido, ID resumido XXXX-XXXX-XXXX-XXXX y marca de agua', async () => {
    const fingerprint = await createCryptoFingerprint({
      studentName: 'mateo lopez',
      subject: 'Algoritmos y Programación',
      course: 'D1',
      workTitle: 'Taller 1',
      code: 'inicio\nescribir("Hola");\nfin',
      sessionId: 'test-session-uuid-1234',
      timestamp: '2026-09-28T04:00:00.000Z',
    });

    expect(fingerprint.fullHash).toHaveLength(64);
    expect(fingerprint.fullHash).toMatch(/^[a-f0-9]{64}$/);
    expect(fingerprint.shortHash).toMatch(/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(fingerprint.watermarkText).toBe(`ENTREGA DE: MATEO LOPEZ | CURSO: D1 | ID: ${fingerprint.shortHash}`);
  });

  it('debe generar hashes distintos si el código o el estudiante cambian', async () => {
    const fixedSession = 'fixed-uuid';
    const fixedTime = '2026-09-28T04:00:00.000Z';

    const fp1 = await createCryptoFingerprint({
      studentName: 'CARLOS GOMEZ',
      subject: 'Lógica',
      course: 'D1',
      workTitle: 'Taller 1',
      code: 'inicio\nescribir(1);\nfin',
      sessionId: fixedSession,
      timestamp: fixedTime,
    });

    const fp2 = await createCryptoFingerprint({
      studentName: 'ANDRES SANCHEZ',
      subject: 'Lógica',
      course: 'D1',
      workTitle: 'Taller 1',
      code: 'inicio\nescribir(1);\nfin',
      sessionId: fixedSession,
      timestamp: fixedTime,
    });

    const fp3 = await createCryptoFingerprint({
      studentName: 'CARLOS GOMEZ',
      subject: 'Lógica',
      course: 'D1',
      workTitle: 'Taller 1',
      code: 'inicio\nescribir(2);\nfin',
      sessionId: fixedSession,
      timestamp: fixedTime,
    });

    expect(fp1.fullHash).not.toBe(fp2.fullHash);
    expect(fp1.fullHash).not.toBe(fp3.fullHash);
    expect(fp1.shortHash).not.toBe(fp2.shortHash);
  });
});
