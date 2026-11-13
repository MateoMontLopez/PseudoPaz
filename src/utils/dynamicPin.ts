/**
 * Utilidades de Clave Dinámica para salida de Modo Examen.
 * Transforma la hora actual en formato de 24 horas (HHMM) a una clave alfabética
 * de 4 caracteres usando el mapeo de sustitución docente:
 * 1 -> a, 2 -> b, 3 -> c, 4 -> d, 5 -> e, 6 -> f, 7 -> g, 8 -> h, 9 -> i, 0 -> j
 */

export const DIGIT_TO_LETTER: Record<string, string> = {
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
};

/**
 * Genera la clave alfabética esperada de 4 letras correspondiente a la hora local (HHMM).
 * @param date Objeto Date de referencia (por defecto new Date())
 * @returns Cadena de 4 letras minúsculas (ej. 14:30 -> "adcj", 09:05 -> "jije")
 */
export function getExpectedExamExitCode(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const timeDigits = `${hours}${minutes}`;

  return timeDigits
    .split('')
    .map((digit) => DIGIT_TO_LETTER[digit] || digit)
    .join('');
}

/**
 * Alias de retrocompatibilidad para getExpectedExamExitCode.
 */
export const getDynamicExamPin = getExpectedExamExitCode;

/**
 * Valida si la clave ingresada por el usuario coincide con el código alfabético esperado.
 * Es insensible a mayúsculas/minúsculas y tolera un desfase de 1 minuto previo por si el reloj
 * del sistema avanzó de minuto mientras se digitaba la clave.
 * 
 * @param inputCode Clave ingresada por el usuario
 * @param date Fecha de referencia para validación (por defecto new Date())
 * @returns true si la clave es válida, false en caso contrario
 */
export function validateDynamicExamPin(inputCode: string, date: Date = new Date()): boolean {
  const cleanInput = inputCode.trim().toLowerCase();
  if (cleanInput.length !== 4 || !/^[a-j]{4}$/.test(cleanInput)) {
    return false;
  }

  const currentCode = getExpectedExamExitCode(date);
  if (cleanInput === currentCode) {
    return true;
  }

  // Tolerancia de 1 minuto previo
  const prevMinute = new Date(date.getTime() - 60000);
  const prevCode = getExpectedExamExitCode(prevMinute);
  if (cleanInput === prevCode) {
    return true;
  }

  return false;
}
