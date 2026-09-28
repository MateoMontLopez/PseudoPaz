import * as pdfMakeModule from 'pdfmake/build/pdfmake';
import * as pdfFontsModule from 'pdfmake/build/vfs_fonts';
import { TDocumentDefinitions, Content, TableCell } from 'pdfmake/interfaces';
import { FingerprintResult } from './cryptoFingerprint';
import { ConsoleOutputItem } from '../../hooks/usePseudocodeRunner';

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
 * Genera y descarga el documento PDF con certificación de autenticidad criptográfica e inmovilización anti-copia.
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

  // ================= ENCABEZADO INSTITUCIONAL =================
  content.push({
    table: {
      widths: ['*'],
      body: [
        [
          {
            fillColor: '#0f172a', // Slate 900
            margin: [8, 8, 8, 8],
            stack: [
              {
                text: 'INSTITUTO UNIVERSITARIO DE LA PAZ — UNIPAZ',
                fontSize: 11,
                bold: true,
                color: '#38bdf8',
                alignment: 'center',
                characterSpacing: 0.5,
              },
              {
                text: 'ENTREGA DE TRABAJO ACADÉMICO CERTIFICADO',
                fontSize: 9,
                color: '#94a3b8',
                alignment: 'center',
                margin: [0, 2, 0, 0],
              },
            ],
          },
        ],
      ],
    },
    layout: 'noBorders',
    margin: [0, 0, 0, 10],
  });

  // ================= METADATOS DEL ESTUDIANTE Y TRABAJO =================
  content.push({
    table: {
      widths: ['35%', '65%'],
      body: [
        [
          { text: 'ESTUDIANTE (AUTOR):', bold: true, fontSize: 9, color: '#334155' },
          { text: studentName, bold: true, fontSize: 10, color: '#0f172a' },
        ],
        [
          { text: 'ASIGNATURA / MATERIA:', bold: true, fontSize: 9, color: '#334155' },
          { text: subject, fontSize: 9, color: '#1e293b' },
        ],
        [
          { text: 'CURSO / SECCIÓN:', bold: true, fontSize: 9, color: '#334155' },
          { text: course, bold: true, fontSize: 9, color: '#0284c7' },
        ],
        [
          { text: 'ACTIVIDAD / GUÍA:', bold: true, fontSize: 9, color: '#334155' },
          { text: workTitle, fontSize: 9, color: '#1e293b' },
        ],
        [
          { text: 'FECHA Y HORA DE EMISIÓN:', bold: true, fontSize: 9, color: '#334155' },
          { text: fingerprint.timestampFormatted, fontSize: 8.5, color: '#475569' },
        ],
        [
          { text: 'CÓDIGO DE INTEGRIDAD (HASH):', bold: true, fontSize: 9, color: '#334155' },
          { text: fingerprint.shortHash, bold: true, fontSize: 9, color: '#047857' },
        ],
      ],
    },
    layout: {
      fillColor: (rowIndex: number) => (rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff'),
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.5,
      hLineColor: () => '#cbd5e1',
      vLineColor: () => '#cbd5e1',
    },
    margin: [0, 0, 0, 12],
  });

  // Barra de advertencia de autenticidad
  content.push({
    table: {
      widths: ['*'],
      body: [
        [
          {
            fillColor: '#ecfdf5', // Emerald 50
            border: [true, true, true, true],
            margin: [6, 4, 6, 4],
            text: [
              { text: '🔒 VERIFICACIÓN DE AUTENTICIDAD CRIPTOGRÁFICA ACTIVA\n', bold: true, fontSize: 8, color: '#065f46' },
              {
                text: `Digest SHA-256 Completo: ${fingerprint.fullHash}\n`,
                fontSize: 6.5,
                font: 'Roboto',
                color: '#047857',
              },
              {
                text: 'Este documento contiene firmas y marcas de agua esteganográficas indelebles ligadas al estudiante y a su código fuente original.',
                fontSize: 7,
                italics: true,
                color: '#065f46',
              },
            ],
          },
        ],
      ],
    },
    layout: {
      hLineColor: () => '#10b981',
      vLineColor: () => '#10b981',
    },
    margin: [0, 0, 0, 15],
  });

  // ================= SECCIÓN 1: PSEUDOCÓDIGO =================
  if (exportMode === 'code_only' || exportMode === 'both') {
    content.push({
      text: '1. CÓDIGO FUENTE (PSEUDOCÓDIGO EN ESPAÑOL)',
      fontSize: 11,
      bold: true,
      color: '#0f172a',
      margin: [0, 5, 0, 6],
    });

    const lines = code.split('\n');
    const tableBody: TableCell[][] = lines.map((line, index) => [
      {
        text: String(index + 1),
        fontSize: 8,
        color: '#64748b',
        alignment: 'right' as const,
        margin: [0, 1, 4, 1],
      },
      {
        text: line.length > 0 ? line : ' ',
        fontSize: 8.5,
        color: '#1e293b',
        font: 'Roboto',
        margin: [4, 1, 0, 1],
      },
    ]);

    content.push({
      table: {
        widths: [24, '*'],
        body: tableBody,
      },
      layout: {
        fillColor: '#f8fafc',
        hLineWidth: () => 0.5,
        vLineWidth: (i: number) => (i === 1 ? 0.5 : 0),
        hLineColor: () => '#e2e8f0',
        vLineColor: () => '#cbd5e1',
      },
      margin: [0, 0, 0, 15],
    });

    // Salidas de la consola si existen
    if (outputs.length > 0) {
      content.push({
        text: 'REGISTRO DE EJECUCIÓN (CONSOLA VIRTUAL I/O)',
        fontSize: 10,
        bold: true,
        color: '#334155',
        margin: [0, 4, 0, 4],
      });

      const consoleLines = outputs.map((out) => {
        let prefix = '[SALIDA] ';
        let color = '#0f172a';
        if (out.type === 'stdin') {
          prefix = '[ENTRADA >] ';
          color = '#0284c7';
        } else if (out.type === 'error') {
          prefix = '[ERROR] ';
          color = '#b91c1c';
        } else if (out.type === 'system') {
          prefix = '[SISTEMA] ';
          color = '#475569';
        }

        return {
          text: `${prefix}${out.text}\n`,
          fontSize: 7.5,
          font: 'Roboto',
          color,
        };
      });

      content.push({
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: '#f1f5f9',
                margin: [8, 6, 8, 6],
                stack: consoleLines,
              },
            ],
          ],
        },
        layout: {
          hLineColor: () => '#cbd5e1',
          vLineColor: () => '#cbd5e1',
        },
        margin: [0, 0, 0, 15],
      });
    }
  }

  // ================= SECCIÓN 2: DIAGRAMA DE FLUJO (DFD) =================
  if (exportMode === 'dfd_only' || exportMode === 'both') {
    const isPageBreakNeeded = exportMode === 'both';

    content.push({
      text: exportMode === 'both' ? '2. DIAGRAMA DE FLUJO (DFD)' : 'DIAGRAMA DE FLUJO (DFD)',
      fontSize: 11,
      bold: true,
      color: '#0f172a',
      pageBreak: isPageBreakNeeded ? 'before' : undefined,
      margin: [0, 5, 0, 8],
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
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: '#f8fafc',
                margin: [10, 30, 10, 30],
                text: 'No se generó captura de diagrama de flujo para este documento.',
                alignment: 'center',
                color: '#64748b',
                fontSize: 9,
                italics: true,
              },
            ],
          ],
        },
        layout: 'noBorders',
      });
    }
  }

  // ================= DEFINICIÓN COMPLETA DEL DOCUMENTO PDF =================
  const docDefinition: TDocumentDefinitions = {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [40, 45, 40, 45],

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
