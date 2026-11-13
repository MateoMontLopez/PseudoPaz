import { describe, expect, it } from 'vitest';
import {
  getExpectedExamExitCode,
  getDynamicExamPin,
  validateDynamicExamPin,
  DIGIT_TO_LETTER,
} from '../src/utils/dynamicPin';

describe('Clave Alfabética Dinámica de Salida de Modo Examen', () => {
  it('debe tener el mapeo exacto de dígitos a letras (1->a ... 9->i, 0->j)', () => {
    expect(DIGIT_TO_LETTER).toEqual({
      '1': 'a',
      '2': 'b',
      '3': 'c',
      '4': 'd',
      '5': 'e',
      '6': 'f',
      '7': 'g',
      '8': 'h',
      '9': 'i',
      '0': 'j',
    });
  });

  it('debe generar el código alfabético de 4 letras según la hora actual en formato 24h', () => {
    // 00:00 -> "0000" -> "jjjj"
    const dateMidnight = new Date(2026, 10, 12, 0, 0, 15);
    expect(getExpectedExamExitCode(dateMidnight)).toBe('jjjj');

    // 12:34 -> "1234" -> "abcd"
    const date1234 = new Date(2026, 10, 12, 12, 34, 0);
    expect(getExpectedExamExitCode(date1234)).toBe('abcd');

    // 19:50 -> "1950" -> "aiej"
    const date1950 = new Date(2026, 10, 12, 19, 50, 40);
    expect(getExpectedExamExitCode(date1950)).toBe('aiej');

    // 14:30 -> "1430" -> "adcj"
    const date1430 = new Date(2026, 10, 12, 14, 30, 0);
    expect(getExpectedExamExitCode(date1430)).toBe('adcj');

    // 09:05 -> "0905" -> "jije"
    const date0905 = new Date(2026, 10, 12, 9, 5, 59);
    expect(getExpectedExamExitCode(date0905)).toBe('jije');

    // 23:59 -> "2359" -> "bcei"
    const date2359 = new Date(2026, 10, 12, 23, 59, 0);
    expect(getExpectedExamExitCode(date2359)).toBe('bcei');
  });

  it('el alias getDynamicExamPin debe ser equivalente a getExpectedExamExitCode', () => {
    const date = new Date(2026, 10, 12, 16, 28, 0);
    expect(getDynamicExamPin(date)).toBe(getExpectedExamExitCode(date));
  });

  it('debe validar exitosamente en minúsculas y mayúsculas (insensible a capitalización)', () => {
    const refDate = new Date(2026, 10, 12, 12, 34, 10);
    // Minúsculas exactas
    expect(validateDynamicExamPin('abcd', refDate)).toBe(true);
    // Mayúsculas completas (ej. Bloq Mayús activo)
    expect(validateDynamicExamPin('ABCD', refDate)).toBe(true);
    // Mixto
    expect(validateDynamicExamPin('AbCd', refDate)).toBe(true);
    // Con espacios al inicio o final
    expect(validateDynamicExamPin('  abcd  ', refDate)).toBe(true);
  });

  it('debe admitir tolerancia de 1 minuto previo por si el reloj avanzó mientras se digitaba', () => {
    // A las 12:35:05, la clave "abcd" del minuto 12:34 sigue siendo válida
    const refDate = new Date(2026, 10, 12, 12, 35, 5);
    expect(validateDynamicExamPin('abcd', refDate)).toBe(true);
    // Y la clave del minuto actual "abce" también es válida
    expect(validateDynamicExamPin('abce', refDate)).toBe(true);
  });

  it('debe rechazar claves incorrectas o desfasadas', () => {
    const refDate = new Date(2026, 10, 12, 12, 34, 0);
    expect(validateDynamicExamPin('jjjj', refDate)).toBe(false);
    expect(validateDynamicExamPin('aiej', refDate)).toBe(false);
    expect(validateDynamicExamPin('bbbb', refDate)).toBe(false);
  });

  it('debe rechazar entradas numéricas, incompletas o con caracteres fuera de rango', () => {
    const refDate = new Date(2026, 10, 12, 12, 34, 0);
    // Numéricas (formato anterior)
    expect(validateDynamicExamPin('1234', refDate)).toBe(false);
    // Vacío
    expect(validateDynamicExamPin('', refDate)).toBe(false);
    // Longitud incorrecta
    expect(validateDynamicExamPin('abc', refDate)).toBe(false);
    expect(validateDynamicExamPin('abcde', refDate)).toBe(false);
    // Caracteres fuera del rango a-j
    expect(validateDynamicExamPin('wxyz', refDate)).toBe(false);
    expect(validateDynamicExamPin('abck', refDate)).toBe(false);
  });
});
