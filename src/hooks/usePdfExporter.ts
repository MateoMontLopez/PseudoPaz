import { useState, useCallback } from 'react';
import { ExportConfig } from '../components/pdf/ExportPdfModal';
import { generateAcademicPdf } from '../services/pdf/pdfGenerator.service';
import { captureFlowchartCanvas } from '../services/pdf/captureCanvas';
import { ConsoleOutputItem } from './usePseudocodeRunner';

export interface UsePdfExporterOptions {
  code: string;
  outputs: ConsoleOutputItem[];
  getFlowchartElement: () => HTMLElement | null;
}

export function usePdfExporter({ code, outputs, getFlowchartElement }: UsePdfExporterOptions) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const openExportModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const closeExportModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const executeExport = useCallback(
    async (config: ExportConfig) => {
      try {
        setIsExporting(true);

        let dfdImage: string | null = null;
        if (config.exportMode === 'dfd_only' || config.exportMode === 'both') {
          const flowElement = getFlowchartElement();
          dfdImage = await captureFlowchartCanvas(flowElement);
        }

        await generateAcademicPdf({
          studentName: config.studentName,
          subject: config.subject,
          course: config.course,
          workTitle: config.workTitle,
          code,
          outputs,
          dfdImageBase64: dfdImage,
          exportMode: config.exportMode,
          fingerprint: config.fingerprint,
        });
      } catch (err) {
        console.error('Error al ejecutar la exportación del PDF:', err);
        throw err;
      } finally {
        setIsExporting(false);
      }
    },
    [code, outputs, getFlowchartElement]
  );

  return {
    isModalOpen,
    isExporting,
    openExportModal,
    closeExportModal,
    executeExport,
  };
}
