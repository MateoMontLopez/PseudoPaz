import { FingerprintResult } from './cryptoFingerprint';
import { ConsoleOutputItem } from '../../hooks/usePseudocodeRunner';

export interface HeaderSnapshotOptions {
  studentName: string;
  subject: string;
  course: string;
  workTitle: string;
  fingerprint: FingerprintResult;
}

/**
 * Renderiza el membrete institucional, la ficha del estudiante y el banner de autenticidad
 * directamente a un canvas HTML5 de alta resolución (300 DPI) para evitar cualquier selección o copia de texto.
 */
export function renderHeaderCard(options: HeaderSnapshotOptions): string {
  const { studentName, subject, course, workTitle, fingerprint } = options;

  const width = 1200;
  const height = 360;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fondo blanco nítido
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // 1. Membrete Institucional UNIPAZ
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 22px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('INSTITUTO UNIVERSITARIO DE LA PAZ — UNIPAZ', 30, 40);

  ctx.fillStyle = '#64748b';
  ctx.font = '13px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText('Escuela de Ingeniería y Logística • Ingeniería de Sistemas • Entorno de Algoritmia PseudoPaz', 30, 62);

  // Línea divisoria decorativa
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(30, 78);
  ctx.lineTo(width - 30, 78);
  ctx.stroke();

  // 2. Tabla de Credenciales Académicas
  const tableX = 30;
  const tableY = 92;
  const tableW = width - 60;
  const tableH = 144;
  const rowH = tableH / 3;
  const colMid = tableX + tableW / 2;

  // Fondo y borde de tabla
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(tableX, tableY, tableW, tableH);

  // Fondos alternados de filas
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(tableX + 1, tableY + 1, tableW - 2, rowH - 1);
  ctx.fillRect(tableX + 1, tableY + rowH * 2 + 1, tableW - 2, rowH - 2);

  // Líneas divisorias horizontales
  ctx.beginPath();
  ctx.moveTo(tableX, tableY + rowH);
  ctx.lineTo(tableX + tableW, tableY + rowH);
  ctx.moveTo(tableX, tableY + rowH * 2);
  ctx.lineTo(tableX + tableW, tableY + rowH * 2);
  // Línea divisoria vertical central
  ctx.moveTo(colMid, tableY);
  ctx.lineTo(colMid, tableY + tableH);
  ctx.stroke();

  // Textos de la Tabla
  // Fila 1
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ESTUDIANTE:', tableX + 14, tableY + 29);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(studentName, tableX + 115, tableY + 29);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ASIGNATURA:', colMid + 14, tableY + 29);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(subject, colMid + 115, tableY + 29);

  // Fila 2
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('CURSO / GRUPO:', tableX + 14, tableY + rowH + 29);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(course, tableX + 130, tableY + rowH + 29);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ACTIVIDAD:', colMid + 14, tableY + rowH + 29);
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText(workTitle, colMid + 100, tableY + rowH + 29);

  // Fila 3
  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('FECHA EMISIÓN:', tableX + 14, tableY + rowH * 2 + 29);
  ctx.fillStyle = '#334155';
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText(fingerprint.timestampFormatted, tableX + 130, tableY + rowH * 2 + 29);

  ctx.fillStyle = '#475569';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('ID AUTENTICIDAD:', colMid + 14, tableY + rowH * 2 + 29);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 13px monospace';
  ctx.fillText(fingerprint.shortHash, colMid + 140, tableY + rowH * 2 + 29);

  // 3. Banner de Verificación Criptográfica Activa
  const bannerX = 30;
  const bannerY = 252;
  const bannerW = width - 60;
  const bannerH = 92;

  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(bannerX, bannerY, bannerW, bannerH);
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 1.2;
  ctx.strokeRect(bannerX, bannerY, bannerW, bannerH);

  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('🔒 VERIFICACIÓN DE AUTENTICIDAD CRIPTOGRÁFICA ACTIVA — DOCUMENTO INMOVILIZADO', bannerX + 16, bannerY + 24);

  ctx.fillStyle = '#047857';
  ctx.font = '11px monospace';
  ctx.fillText(`Digest SHA-256: ${fingerprint.fullHash}`, bannerX + 16, bannerY + 48);

  ctx.fillStyle = '#065f46';
  ctx.font = 'italic 11px system-ui, sans-serif';
  ctx.fillText('⚠️ Protegido contra copia y manipulación: texto incrustado de forma no extraíble y marcas de agua indelebles.', bannerX + 16, bannerY + 72);

  return canvas.toDataURL('image/png');
}

/**
 * Divide el código fuente en bloques paginados (máx 32 líneas en página 1, 45 en posteriores)
 */
export function chunkCodeLines(lines: string[]): string[][] {
  const PAGE_1_MAX = 30;
  const SUBSEQUENT_MAX = 45;

  if (lines.length <= PAGE_1_MAX) {
    return [lines];
  }

  const chunks: string[][] = [];
  chunks.push(lines.slice(0, PAGE_1_MAX));

  let current = PAGE_1_MAX;
  while (current < lines.length) {
    chunks.push(lines.slice(current, current + SUBSEQUENT_MAX));
    current += SUBSEQUENT_MAX;
  }

  return chunks;
}

export interface CodeChunkOptions {
  lines: string[];
  startLineNumber: number;
  isFirstChunk: boolean;
  watermarkText: string;
}

/**
 * Renderiza un bloque de código como una imagen rasterizada de alta definición (300 DPI)
 * con numeración de líneas y la marca de agua diagonal fusionada en los píxeles de fondo.
 */
export function renderCodeChunk(options: CodeChunkOptions): string {
  const { lines, startLineNumber, isFirstChunk, watermarkText } = options;

  const width = 1200;
  const headerH = 42;
  const lineH = 26;
  const paddingBottom = 16;
  const height = headerH + lines.length * lineH + paddingBottom;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Fondo principal del bloque de código
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 0, width, height);

  // Barra de título del bloque de código (estilo IDE)
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, width, headerH);
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, headerH);
  ctx.lineTo(width, headerH);
  ctx.stroke();

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px system-ui, sans-serif';
  const titleText = isFirstChunk
    ? '1. CÓDIGO FUENTE (PSEUDOCÓDIGO EN ESPAÑOL)'
    : '1. CÓDIGO FUENTE (CONTINUACIÓN)';
  ctx.fillText(titleText, 20, 26);

  // Botones decorativos de ventana
  const dotsX = width - 70;
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(dotsX, 21, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(dotsX + 18, 21, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#10b981';
  ctx.beginPath();
  ctx.arc(dotsX + 36, 21, 5, 0, Math.PI * 2);
  ctx.fill();

  // Columna para numeración de líneas
  const gutterW = 65;
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, headerH, gutterW, height - headerH);
  ctx.strokeStyle = '#cbd5e1';
  ctx.beginPath();
  ctx.moveTo(gutterW, headerH);
  ctx.lineTo(gutterW, height);
  ctx.stroke();

  // Marca de agua fusionada en los píxeles del fondo del código
  ctx.save();
  ctx.beginPath();
  ctx.rect(gutterW, headerH, width - gutterW, height - headerH);
  ctx.clip();

  ctx.rotate((-22 * Math.PI) / 180);
  ctx.font = 'bold 17px monospace';
  ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';

  for (let x = -500; x < width + 500; x += 480) {
    for (let y = -200; y < height + 800; y += 90) {
      ctx.fillText(watermarkText, x, y);
    }
  }
  ctx.restore();

  // Renderizado de las líneas de código y números
  lines.forEach((line, idx) => {
    const yPos = headerH + idx * lineH + 18;
    const lineNumber = startLineNumber + idx;

    // Número de línea
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Consolas, Monaco, monospace';
    ctx.textAlign = 'right';
    ctx.fillText(String(lineNumber), gutterW - 12, yPos);

    // Texto de la línea de código
    ctx.textAlign = 'left';
    ctx.fillStyle = '#0f172a';
    ctx.font = '13.5px Consolas, Monaco, "Courier New", monospace';
    ctx.fillText(line, gutterW + 16, yPos);
  });

  // Borde perimetral exterior
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

/**
 * Renderiza la consola virtual de ejecución como una tarjeta gráfica de alta resolución.
 */
export function renderConsoleCard(outputs: ConsoleOutputItem[]): string | null {
  if (outputs.length === 0) return null;

  const width = 1200;
  const headerH = 38;
  const lineH = 22;
  const paddingBottom = 16;
  const maxLines = Math.min(outputs.length, 30);
  const displayOutputs = outputs.slice(0, maxLines);
  const height = headerH + displayOutputs.length * lineH + paddingBottom;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Fondo terminal oscuro
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, width, height);

  // Barra de cabecera de la terminal
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, 0, width, headerH);
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, headerH);
  ctx.lineTo(width, headerH);
  ctx.stroke();

  ctx.fillStyle = '#cbd5e1';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('REGISTRO DE EJECUCIÓN (CONSOLA VIRTUAL I/O)', 20, 24);

  // Renderizado de líneas de la consola
  displayOutputs.forEach((out, idx) => {
    const yPos = headerH + idx * lineH + 16;

    let prefix = '[SALIDA] ';
    let prefixColor = '#38bdf8'; // Sky
    let textColor = '#f1f5f9';

    if (out.type === 'stdin') {
      prefix = '[ENTRADA >] ';
      prefixColor = '#34d399'; // Emerald
      textColor = '#a7f3d0';
    } else if (out.type === 'error') {
      prefix = '[ERROR] ';
      prefixColor = '#f87171'; // Red
      textColor = '#fecaca';
    } else if (out.type === 'system') {
      prefix = '[SISTEMA] ';
      prefixColor = '#94a3b8'; // Slate
      textColor = '#cbd5e1';
    }

    ctx.font = 'bold 11px monospace';
    ctx.fillStyle = prefixColor;
    ctx.fillText(prefix, 20, yPos);

    ctx.font = '11px monospace';
    ctx.fillStyle = textColor;
    ctx.fillText(out.text, 115, yPos);
  });

  // Borde perimetral
  ctx.strokeStyle = '#1e293b';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, width, height);

  return canvas.toDataURL('image/png');
}

/**
 * Renderiza títulos de sección como imágenes para evitar selección de texto.
 */
export function renderSectionTitle(title: string): string {
  const width = 1200;
  const height = 46;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 15px system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.fillText(title, 10, 26);

  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(10, 38);
  ctx.lineTo(width - 10, 38);
  ctx.stroke();

  return canvas.toDataURL('image/png');
}
