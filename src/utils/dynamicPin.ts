/**
 * Utilidades de Clave Dinámica para salida de Modo Examen (HHMM en formato 24h).
 */

/**
 * Genera la clave dinámica de 4 dígitos correspondiente a la hora local en formato 24 horas (HHMM).
 * @param date Objeto Date opcional (por defecto new Date())
 * @returns Cadena de 4 caracteres con formato HHMM
 */
export function getDynamicExamPin(date: Date = new Date()): string {
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}${minutes}`;
}

/**
 * Valida si el PIN ingresado coincide con la clave dinámica calculada (HHMM).
 * Incluye una tolerancia de 1 minuto previo para evitar fallos si el reloj del sistema
 * avanzó de minuto mientras el usuario o docente escribía la clave.
 * 
 * @param inputPin Clave ingresada por el usuario
 * @param date Fecha de referencia para validación (por defecto new Date())
 * @returns true si el PIN es correcto, false en caso contrario
 */
export function validateDynamicExamPin(inputPin: string, date: Date = new Date()): boolean {
  const cleanInput = inputPin.trim();
  if (cleanInput.length !== 4 || !/^\d{4}$/.test(cleanInput)) {
    return false;
  }

  const currentPin = getDynamicExamPin(date);
  if (cleanInput === currentPin) {
    return true;
  }

  // Tolerancia de 1 minuto anterior
  const prevMinute = new Date(date.getTime() - 60000);
  const prevPin = getDynamicExamPin(prevMinute);
  if (cleanInput === prevPin) {
    return true;
  }

  return false;
}
