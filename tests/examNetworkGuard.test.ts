import { describe, it, expect } from 'vitest';

describe('Protocolo Anti-Fraude: Detección de Internet en Modo Examen', () => {
  function computeExamNetworkBlock(isExamMode: boolean, isOnline: boolean): boolean {
    return isExamMode && isOnline;
  }

  it('debe activar el bloqueo si el Modo Examen está activo y hay conexión a internet', () => {
    expect(computeExamNetworkBlock(true, true)).toBe(true);
  });

  it('no debe activar el bloqueo si el Modo Examen está activo pero el equipo está desconectado (offline)', () => {
    expect(computeExamNetworkBlock(true, false)).toBe(false);
  });

  it('no debe activar el bloqueo si el Modo Examen está inactivo (Modo Práctica)', () => {
    // En modo práctica, el estudiante puede tener conexión o estar offline sin bloqueos
    expect(computeExamNetworkBlock(false, true)).toBe(false);
    expect(computeExamNetworkBlock(false, false)).toBe(false);
  });

  it('debe desbloquear automáticamente al pasar de online a offline durante el examen', () => {
    let isOnline = true;
    const isExamMode = true;

    // Al inicio está conectado -> bloqueado
    expect(computeExamNetworkBlock(isExamMode, isOnline)).toBe(true);

    // El estudiante desconecta el Wi-Fi o activa Modo Avión
    isOnline = false;
    expect(computeExamNetworkBlock(isExamMode, isOnline)).toBe(false);
  });

  it('debe bloquear de inmediato si el estudiante activa internet en mitad del examen', () => {
    let isOnline = false;
    const isExamMode = true;

    // Trabajando offline sin bloqueo
    expect(computeExamNetworkBlock(isExamMode, isOnline)).toBe(false);

    // Se conecta a internet durante el examen
    isOnline = true;
    expect(computeExamNetworkBlock(isExamMode, isOnline)).toBe(true);
  });
});
