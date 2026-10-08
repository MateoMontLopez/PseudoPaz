import React, { useState, useCallback } from 'react';
import {
  ShieldAlert,
  ArrowLeft,
  Home,
  FileCheck2,
  Sun,
  Moon,
} from 'lucide-react';
import { HashDropzone } from './HashDropzone';
import { AntiPlagiarismTable } from './AntiPlagiarismTable';
import {
  DecodedPdfData,
  analyzePdfBatch,
} from '../../services/audit/hashDecoder.service';
import { useTheme } from '../../hooks/useTheme';

interface HashAuditorProps {
  onBackToIDE: () => void;
  onGoHome: () => void;
}

export const HashAuditor: React.FC<HashAuditorProps> = ({ onBackToIDE, onGoHome }) => {
  const { toggleTheme, isDark } = useTheme();
  const [documents, setDocuments] = useState<DecodedPdfData[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [progress, setProgress] = useState<{ current: number; total: number }>({
    current: 0,
    total: 0,
  });

  const handleFilesSelected = useCallback(async (files: File[]) => {
    setIsAnalyzing(true);
    setProgress({ current: 0, total: files.length });

    try {
      const results = await analyzePdfBatch(files, (current, total) => {
        setProgress({ current, total });
      });

      setDocuments((prev) => {
        // Combinar con los existentes sin duplicar por nombre de archivo idéntico
        const combined = [...prev, ...results];
        return combined;
      });
    } catch (err) {
      console.error('[Auditor] Error al analizar lote:', err);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleClear = useCallback(() => {
    setDocuments([]);
  }, []);

  return (
    <div className="min-h-screen w-full bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200">
      {/* 1. Header Superior del Auditor */}
      <header className="h-16 w-full border-b border-[var(--border-color)] bg-[var(--bg-header)] px-4 sm:px-8 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 font-bold text-sm">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
                Auditor Criptográfico Anti-Plagio
              </h2>
              <span className="hidden sm:inline px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                UNIPAZ v2.0
              </span>
            </div>
            <p className="text-[11px] text-[var(--text-muted)] hidden sm:block">
              Verificación de firmas SHA-256 e inspección sintáctica del AST
            </p>
          </div>
        </div>

        {/* Botones de Navegación y Tema */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onGoHome}
            title="Volver a la pantalla de bienvenida"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Inicio</span>
          </button>

          <button
            onClick={onBackToIDE}
            title="Regresar al editor de Pseudocódigo"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sm transition-all cursor-pointer active:scale-95"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al IDE</span>
          </button>

          {/* Toggle de Tema */}
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-xl border border-[var(--border-color)] bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={isDark ? 'Modo Claro' : 'Modo Oscuro'}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>
        </div>
      </header>

      {/* 2. Cuerpo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {documents.length === 0 ? (
          <div className="max-w-2xl mx-auto py-8 sm:py-16 space-y-6 text-center">
            <div className="space-y-2">
              <h3 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight">
                Auditoría Masiva de Entregas Académicas
              </h3>
              <p className="text-xs sm:text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                Sube las entregas en PDF generadas por PseudoPaz para comprobar la autenticidad de las firmas SHA-256 y detectar duplicaciones o copias sintácticas de código.
              </p>
            </div>

            <HashDropzone
              onFilesSelected={handleFilesSelected}
              isAnalyzing={isAnalyzing}
              progress={progress}
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Zona compacta para añadir más PDFs */}
            <div className="p-4 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-color)] flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 rounded-xl bg-sky-500/10 text-sky-500 flex items-center justify-center shrink-0">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">
                    Lote de Auditoría en Curso: {documents.length} documento(s)
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)]">
                    Puedes soltar más entregas para evaluar la matriz de plagio ampliada.
                  </div>
                </div>
              </div>

              <div className="w-full sm:w-auto">
                <HashDropzone
                  onFilesSelected={handleFilesSelected}
                  isAnalyzing={isAnalyzing}
                  progress={progress}
                />
              </div>
            </div>

            {/* Tabla de Resultados y Matriz */}
            <AntiPlagiarismTable documents={documents} onClear={handleClear} />
          </div>
        )}
      </main>
    </div>
  );
};
