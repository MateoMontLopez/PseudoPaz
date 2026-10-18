import { describe, expect, it } from 'vitest';
import { getDynamicExamPin, validateDynamicExamPin } from '../src/utils/dynamicPin';

describe('Dynamic Exam PIN (HHMM 24h format) Tests', () => {
  it('debe generar el PIN de 4 dígitos correspondiente a la hora actual en formato 24h', () => {
    // Caso 1: 14:05 -> "1405"
    const date1 = new Date(2026, 9, 18, 14, 5, 20);
    expect(getDynamicExamPin(date1)).toBe('1405');

    // Caso 2: 08:09 -> "0809"
    const date2 = new Date(2026, 9, 18, 8, 9, 0);
    expect(getDynamicExamPin(date2)).toBe('0809');

    // Caso 3: Medianoche 00:00 -> "0000"
    const date3 = new Date(2026, 9, 18, 0, 0, 45);
    expect(getDynamicExamPin(date3)).toBe('0000');

    // Caso 4: 23:59 -> "2359"
    const date4 = new Date(2026, 9, 18, 23, 59, 10);
    expect(getDynamicExamPin(date4)).toBe('2359');
  });

  it('debe validar exitosamente cuando el PIN coincide con el minuto actual', () => {
    const refDate = new Date(2026, 9, 18, 16, 30, 15);
    expect(validateDynamicExamPin('1630', refDate)).toBe(true);
    expect(validateDynamicExamPin(' 1630 ', refDate)).toBe(true);
  });

  it('debe admitir tolerancia de 1 minuto previo por si el reloj avanzó mientras se digitaba', () => {
    // A las 16:31:05, la clave "1630" del minuto anterior sigue siendo válida
    const refDate = new Date(2026, 9, 18, 16, 31, 5);
    expect(validateDynamicExamPin('1630', refDate)).toBe(true);
    expect(validateDynamicExamPin('1631', refDate)).toBe(true);
  });

  it('debe rechazar claves incorrectas o con desfase mayor', () => {
    const refDate = new Date(2026, 9, 18, 16, 30, 0);
    expect(validateDynamicExamPin('1628', refDate)).toBe(false);
    expect(validateDynamicExamPin('1632', refDate)).toBe(false);
    expect(validateDynamicExamPin('0000', refDate)).toBe(false);
    expect(validateDynamicExamPin('1234', refDate)).toBe(false);
  });

  it('debe rechazar entradas con formato inválido', () => {
    const refDate = new Date(2026, 9, 18, 10, 20, 0);
    expect(validateDynamicExamPin('', refDate)).toBe(false);
    expect(validateDynamicExamPin('102', refDate)).toBe(false);
    expect(validateDynamicExamPin('10200', refDate)).toBe(false);
    expect(validateDynamicExamPin('abcd', refDate)).toBe(false);
  });
});
