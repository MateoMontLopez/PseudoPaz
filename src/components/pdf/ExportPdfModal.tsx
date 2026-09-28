import React, { useState, useEffect } from 'react';
import { X, FileText, Download, Loader2 } from 'lucide-react';
import { SecurityBadge } from './SecurityBadge';
import { ExportContentType } from '../../services/pdf/pdfGenerator.service';
import { createCryptoFingerprint, FingerprintResult } from '../../services/pdf/cryptoFingerprint';

interface ExportPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmExport: (config: ExportConfig) => Promise<void>;
  code: string;
}

export interface ExportConfig {
  studentName: string;
  subject: string;
  course: string;
  workTitle: string;
  exportMode: ExportContentType;
  fingerprint: FingerprintResult;
}

const COURSES = ['D1', 'N1', 'D2', 'N2', 'S1', 'A1', 'B1'];

export const ExportPdfModal: React.FC<ExportPdfModalProps> = ({
  isOpen,
  onClose,
  onConfirmExport,
  code,
}) => {
  const [studentName, setStudentName] = useState('');
  const [subject, setSubject] = useState('Lógica de Programación I');
  const [course, setCourse] = useState('D1');
  const [workTitle, setWorkTitle] = useState('Taller 1 - Estructuras de Control');
  const [exportMode, setExportMode] = useState<ExportContentType>('both');
  const [isGenerating, setIsGenerating] = useState(false);

  const [fingerprint, setFingerprint] = useState<FingerprintResult | null>(null);

  // Recalcular huella criptográfica SHA-256 cuando cambian los datos del estudiante o código
  useEffect(() => {
    let isCancelled = false;

    const updateFingerprint = async () => {
      const result = await createCryptoFingerprint({
        studentName: studentName.trim() || 'ESTUDIANTE UNIPAZ',
        subject: subject.trim() || 'Lógica de Programación',
        course,
        workTitle: workTitle.trim() || 'Actividad Práctica',
        code,
      });

      if (!isCancelled) {
        setFingerprint(result);
      }
    };

    void updateFingerprint();

    return () => {
      isCancelled = true;
    };
  }, [studentName, subject, course, workTitle, code]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentName.trim() || !workTitle.trim() || !fingerprint) return;

    try {
      setIsGenerating(true);
      await onConfirmExport({
        studentName: studentName.trim().toUpperCase(),
        subject: subject.trim(),
        course,
        workTitle: workTitle.trim(),
        exportMode,
        fingerprint,
      });
      onClose();
    } catch (err) {
      console.error('Error al exportar PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150 select-none">
      <div className="relative w-full max-w-lg bg-[#0f0f13] border border-zinc-800 rounded-lg shadow-2xl overflow-hidden font-sans text-zinc-100 animate-in zoom-in-95 duration-200">
        {/* Cabecera del Modal */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-900/60 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded bg-sky-950/60 text-sky-400 border border-sky-800/50">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">Exportar Entrega a PDF Certificado</h2>
              <p className="text-[11px] text-zinc-500">Trazabilidad criptográfica e identificación anti-copia</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* Nombre del Estudiante (Conversión obligatoria a MAYÚSCULAS) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nombre Completo del Estudiante <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value.toUpperCase())}
              placeholder="EJ: MIGUEL ÁNGEL PÉREZ GÓMEZ"
              required
              autoFocus
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs font-mono text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500 uppercase tracking-wide"
            />
            <span className="text-[10.5px] text-zinc-500 block mt-1">
              Se forzará a MAYÚSCULAS y se estampará en la marca de agua del documento.
            </span>
          </div>

          {/* Materia y Curso */}
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Asignatura / Materia
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Lógica de Programación"
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1">
                Curso / Sección
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs font-mono text-zinc-100 focus:outline-none focus:border-sky-500"
              >
                {COURSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Título de la Guía o Taller */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Nombre de la Actividad o Guía <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={workTitle}
              onChange={(e) => setWorkTitle(e.target.value)}
              placeholder="Taller 1 - Estructuras de Control"
              required
              className="w-full px-3 py-2 bg-zinc-950 border border-zinc-800 rounded-md text-xs text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Contenido a Exportar (Radio Buttons) */}
          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1.5">
              Contenido a Exportar en el PDF
            </label>
            <div className="grid grid-cols-1 gap-2 text-xs">
              <label className="flex items-center gap-2.5 p-2 rounded border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/30 cursor-pointer">
                <input
                  type="radio"
                  name="exportMode"
                  value="both"
                  checked={exportMode === 'both'}
                  onChange={() => setExportMode('both')}
                  className="accent-sky-500"
                />
                <span className="font-medium text-zinc-200">
                  Ambos (Pseudocódigo en Pág 1 y Diagrama DFD en Pág 2)
                </span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/30 cursor-pointer">
                <input
                  type="radio"
                  name="exportMode"
                  value="code_only"
                  checked={exportMode === 'code_only'}
                  onChange={() => setExportMode('code_only')}
                  className="accent-sky-500"
                />
                <span className="text-zinc-300">Solo Pseudocódigo + Historial de Consola I/O</span>
              </label>

              <label className="flex items-center gap-2.5 p-2 rounded border border-zinc-800/80 bg-zinc-950/40 hover:bg-zinc-800/30 cursor-pointer">
                <input
                  type="radio"
                  name="exportMode"
                  value="dfd_only"
                  checked={exportMode === 'dfd_only'}
                  onChange={() => setExportMode('dfd_only')}
                  className="accent-sky-500"
                />
                <span className="text-zinc-300">Solo Diagrama de Flujo (DFD)</span>
              </label>
            </div>
          </div>

          {/* Componente de Seguridad Criptográfica Anti-Copia */}
          <SecurityBadge fingerprint={fingerprint} />

          {/* Botones de Acción */}
          <div className="flex items-center justify-end space-x-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isGenerating}
              className="px-3.5 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isGenerating || !studentName.trim() || !workTitle.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white rounded-md text-xs font-medium transition-all shadow-md active:scale-95 cursor-pointer disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generando PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Generar y Descargar PDF</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
