import React, { useState, useRef } from 'react';
import { UploadCloud, FileText, Loader2, Sparkles } from 'lucide-react';

interface HashDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isAnalyzing: boolean;
  progress: { current: number; total: number };
}

export const HashDropzone: React.FC<HashDropzoneProps> = ({
  onFilesSelected,
  isAnalyzing,
  progress,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const pdfFiles = Array.from(e.dataTransfer.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const pdfFiles = Array.from(e.target.files).filter(
        (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
      );
      if (pdfFiles.length > 0) {
        onFilesSelected(pdfFiles);
      }
    }
    // Limpiar input para permitir re-selección
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => {
        if (!isAnalyzing) fileInputRef.current?.click();
      }}
      className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer p-8 sm:p-10 flex flex-col items-center justify-center text-center overflow-hidden ${
        isDragOver
          ? 'border-sky-500 bg-sky-500/10 scale-[1.005]'
          : 'border-[var(--border-color)] hover:border-sky-500/50 bg-[var(--bg-surface)] hover:bg-[var(--bg-hover)]'
      } ${isAnalyzing ? 'pointer-events-none opacity-80' : ''}`}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleFileInputChange}
      />

      {/* Glow de fondo */}
      <div className="absolute inset-0 bg-radial from-sky-500/5 to-transparent pointer-events-none" />

      {isAnalyzing ? (
        <div className="flex flex-col items-center space-y-4 py-4 z-10">
          <div className="w-16 h-16 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 animate-spin">
            <Loader2 className="w-8 h-8" />
          </div>
          <div>
            <h4 className="font-bold text-base text-[var(--text-primary)]">
              Decodificando Entregas PDF y Verificando Firmas...
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-mono">
              Procesando documento {progress.current} de {progress.total} (
              {Math.round((progress.current / (progress.total || 1)) * 100)}%)
            </p>
          </div>

          {/* Barra de Progreso */}
          <div className="w-64 max-w-full h-2 rounded-full bg-[var(--bg-surface-subtle)] border border-[var(--border-color)] overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-200 rounded-full"
              style={{
                width: `${(progress.current / (progress.total || 1)) * 100}%`,
              }}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-3 z-10">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 border border-sky-500/30 flex items-center justify-center text-sky-500 dark:text-sky-400 shadow-md">
            <UploadCloud className="w-8 h-8" />
          </div>

          <div>
            <h4 className="font-bold text-base text-[var(--text-primary)]">
              Carga Masiva de Entregas PDF
            </h4>
            <p className="text-xs text-[var(--text-secondary)] mt-1 max-w-md">
              Arrastra y suelta aquí los archivos PDF exportados por los estudiantes o{' '}
              <span className="text-sky-500 font-semibold underline underline-offset-2">
                haz clic para seleccionarlos
              </span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2 text-[11px] text-[var(--text-muted)] font-mono">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-color)]">
              <FileText className="w-3.5 h-3.5 text-sky-500" />
              Soporta múltiples .pdf
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--bg-surface-subtle)] border border-[var(--border-color)]">
              <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
              100% en el cliente (privacidad total)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
