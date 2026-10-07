import * as pdfMakeModule from 'pdfmake/build/pdfmake';
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, Content, ContextPageSize } from 'pdfmake/interfaces';
import { FingerprintResult } from './cryptoFingerprint';
import { ConsoleOutputItem } from '../../hooks/usePseudocodeRunner';
import {
  renderHeaderCard,
  chunkCodeLines,
  renderCodeChunk,
  renderConsoleCard,
  renderSectionTitle,
} from './renderDocumentSnapshots';

// Configuración de fuentes virtuales en el cliente de forma compatible con Vite/Rollup ESM
const pdfMake: typeof pdfMakeModule & { vfs?: unknown } =
  (pdfMakeModule as { default?: typeof pdfMakeModule }).default || pdfMakeModule;
const pdfFonts: unknown =
  (pdfFontsModule as { default?: unknown }).default || pdfFontsModule;

const vfsFonts =
  (pdfFonts as { pdfMake?: { vfs: unknown } })?.pdfMake?.vfs ||
  (pdfFonts as { vfs?: unknown })?.vfs ||
  pdfFonts;

if (vfsFonts) {
  pdfMake.vfs = vfsFonts;
}

export type ExportContentType = 'code_only' | 'dfd_only' | 'both';

export interface GeneratePdfOptions {
  studentName: string;
  subject: string;
  course: string;
  workTitle: string;
  code: string;
  outputs: ConsoleOutputItem[];
  dfdImageBase64?: string | null;
  exportMode: ExportContentType;
  fingerprint: FingerprintResult;
}

/**
 * Convierte la imagen estática /logo-universidad.png (almacenada en public/)
 * a Data URL (Base64) antes de armar la definición del PDF.
 */
const getLogoBase64 = async (): Promise<string | null> => {
  try {
    const response = await fetch('/logo-universidad.png');
    if (!response.ok) return null;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null; // Fallback elegante si no carga la imagen
  }
};

/**
 * Genera y descarga el documento PDF con certificación de autenticidad criptográfica e inmovilización anti-copia.
 * Todo el contenido sensible se incrusta como capas visuales rasterizadas de alta resolución (300 DPI)
 * con la marca de agua y hashes criptográficos fusionados en los píxeles, haciendo imposible la selección o copia de texto.
 */
export async function generateAcademicPdf(options: GeneratePdfOptions): Promise<void> {
  const {
    studentName,
    subject,
    course,
    workTitle,
    code,
    outputs,
    dfdImageBase64,
    exportMode,
    fingerprint,
  } = options;

  const content: Content[] = [];

  // ================= 0. CARGA DEL LOGO INSTITUCIONAL EN BASE64 =================
  const logoDataUrl = await getLogoBase64();

  // ================= 1. MEMBRETE Y CREDENCIALES (INALTERABLE / NO COPIABLE) =================
  const headerCardImage = renderHeaderCard({
    studentName,
    subject,
    course,
    workTitle,
    fingerprint,
  });

  content.push({
    image: headerCardImage,
    width: 515,
    margin: [0, 0, 0, 10],
  });

  // ================= 2. SECCIÓN PSEUDOCÓDIGO (RASTERIZADO NO SELECCIONABLE) =================
  if (exportMode === 'code_only' || exportMode === 'both') {
    const rawLines = code.split('\n');
    const chunks = chunkCodeLines(rawLines);

    chunks.forEach((chunkLines, chunkIdx) => {
      const startLineNumber = chunkIdx === 0 ? 1 : 31 + (chunkIdx - 1) * 45;
      const chunkImage = renderCodeChunk({
        lines: chunkLines,
        startLineNumber,
        isFirstChunk: chunkIdx === 0,
        watermarkText: fingerprint.watermarkText,
      });

      content.push({
        image: chunkImage,
        width: 515,
        margin: [0, 0, 0, 12],
        pageBreak: chunkIdx > 0 ? 'before' : undefined,
      });
    });

    // Consola Virtual I/O rasterizada
    if (outputs.length > 0) {
      const consoleImage = renderConsoleCard(outputs);
      if (consoleImage) {
        content.push({
          image: consoleImage,
          width: 515,
          margin: [0, 0, 0, 14],
          pageBreak: chunks.length > 1 || rawLines.length > 18 ? 'before' : undefined,
        });
      }
    }
  }

  // ================= 3. SECCIÓN DIAGRAMA DE FLUJO (DFD) =================
  if (exportMode === 'dfd_only' || exportMode === 'both') {
    const isPageBreakNeeded = exportMode === 'both';

    // Título de la sección como imagen vectorizada no seleccionable
    const dfdTitleImage = renderSectionTitle('2. DIAGRAMA DE FLUJO (DFD)');
    content.push({
      image: dfdTitleImage,
      width: 515,
      pageBreak: isPageBreakNeeded ? 'before' : undefined,
      margin: [0, 5, 0, 12],
    });

    if (dfdImageBase64) {
      content.push({
        image: dfdImageBase64,
        width: 515, // Ancho exacto imprimible en página A4 con márgenes de 40
        alignment: 'center',
        margin: [0, 0, 0, 15],
      });
    } else {
      content.push({
        text: 'Lienzo de diagrama de flujo vacío.',
        fontSize: 9,
        italics: true,
        color: '#64748b',
        alignment: 'center',
      });
    }
  }

  // ================= DEFINICIÓN COMPLETA DEL DOCUMENTO PDF =================
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 45, 40, 45],

    // Fondo con marca de agua institucional (logo universitario central difuminado)
    background: function (_currentPage: number, pageSize: ContextPageSize) {
      if (!logoDataUrl) return null;
      return {
        image: logoDataUrl,
        width: 300,
        opacity: 0.08, // Transparencia tenue para no obstaculizar la lectura del código
        absolutePosition: {
          x: (pageSize.width - 300) / 2,
          y: (pageSize.height - 300) / 2,
        },
      };
    },

    // Marca de agua diagonal semitransparente inalterable (Nivel 2 de seguridad)
    watermark: {
      text: fingerprint.watermarkText,
      color: '#64748b',
      opacity: 0.08,
      bold: true,
      fontSize: 10,
      angle: -40,
    },

    // Encabezado superior en cada página
    header: (currentPage: number, pageCount: number) => {
      return {
        columns: [
          {
            text: `UNIPAZ • CÓDIGO DE AUTENTICIDAD: ${fingerprint.shortHash}`,
            fontSize: 7.5,
            font: 'Roboto',
            color: '#64748b',
            margin: [40, 20, 0, 0],
          },
          {
            text: `Pág ${currentPage} de ${pageCount}`,
            fontSize: 7.5,
            color: '#64748b',
            alignment: 'right',
            margin: [0, 20, 40, 0],
          },
        ],
      };
    },

    // Pie de página en cada página
    footer: () => {
      return {
        stack: [
          {
            canvas: [{ type: 'line', x1: 40, y1: 0, x2: 555, y2: 0, lineWidth: 0.5, lineColor: '#e2e8f0' }],
          },
          {
            columns: [
              {
                text: `HASH DE INTEGRIDAD SHA-256: ${fingerprint.fullHash.substring(0, 36)}...`,
                fontSize: 6.5,
                color: '#94a3b8',
                margin: [40, 4, 0, 0],
              },
              {
                text: `EMISIÓN: ${fingerprint.timestampFormatted}`,
                fontSize: 6.5,
                color: '#94a3b8',
                alignment: 'right',
                margin: [0, 4, 40, 0],
              },
            ],
          },
        ],
      };
    },

    // Metadatos ocultos del archivo PDF (Nivel 3: Huella Digital Esteganográfica)
    info: {
      title: `${workTitle} — ${studentName}`,
      author: `${studentName} (UNIPAZ - Curso ${course})`,
      subject: `Entrega de ${subject} - Verificación Criptográfica`,
      keywords: `UNIPAZ, PseudoPaz, SHA256:${fingerprint.fullHash}, ID:${fingerprint.shortHash}, Session:${fingerprint.sessionId}`,
      creator: 'PseudoPaz IDE (UNIPAZ Academic Engine)',
      producer: 'PseudoPaz Anti-Plagiarism Protocol v4.0',
    },

    content,

    defaultStyle: {
      font: 'Roboto',
      color: '#0f172a',
    },
  };

  const filename = `${studentName.replace(/\s+/g, '_')}_${course}_${workTitle.replace(/\s+/g, '_')}.pdf`;

  // Descarga directa en el navegador
  pdfMake.createPdf(docDefinition).download(filename);
}
