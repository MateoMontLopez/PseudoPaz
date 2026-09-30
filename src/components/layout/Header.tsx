import React from 'react';
import {
  Play,
  Square,
  FileDown,
  BookOpen,
  PanelLeftClose,
  PanelLeftOpen,
  ShieldAlert,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react';
import { RunnerStatus } from '../../hooks/usePseudocodeRunner';
import { ModeSwitch, AppMode } from './ModeSwitch';
import { InstallPWAButton } from '../pwa/InstallPWAButton';
import { useTheme } from '../../hooks/useTheme';

interface HeaderProps {
  mode: AppMode;
  onModeChange: (mode: AppMode) => void;
  status: RunnerStatus;
  isGuardEnabled: boolean;
  onRun: () => void;
  onStop: () => void;
  onToggleGuard: () => void;
  onOpenExportModal: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isGuideOpen: boolean;
  onToggleGuide: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  mode,
  onModeChange,
  status,
  isGuardEnabled,
  onRun,
  onStop,
  onToggleGuard,
  onOpenExportModal,
  isSidebarOpen,
  onToggleSidebar,
  isGuideOpen,
  onToggleGuide,
}) => {
  const { toggleTheme, isDark } = useTheme();
  const isRunning = status === 'running' || status === 'waiting_input';

  return (
    <header className="h-12 w-full bg-[var(--bg-header)] border-b border-[var(--border-color)] px-3 flex items-center justify-between select-none shrink-0 z-20 transition-colors duration-150">
      {/* 1. Extremo Izquierdo: Brand/Logo ("Pseudocode & DFD IDE") y toggle de explorador */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Ocultar explorador de archivos' : 'Mostrar explorador de archivos'}
          className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors cursor-pointer"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-sky-500 dark:text-sky-400" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-sky-500/15 border border-sky-400/40 text-sky-500 dark:text-sky-400 font-bold font-mono text-xs shadow-xs">
            λ
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-tight text-[var(--text-primary)] leading-tight">
              Pseudocode & DFD IDE
            </span>
            <span className="text-[9.5px] font-mono text-[var(--text-muted)] leading-none">
              PseudoPaz v2.0
            </span>
          </div>
        </div>
      </div>

      {/* 2. Centro: Conmutador de Modo Principal y Zona de Ejecución */}
      <div className="flex items-center space-x-3">
        {/* Conmutador de Modo */}
        <ModeSwitch mode={mode} onModeChange={onModeChange} />

        {/* Zona de Ejecución (Play / Stop) */}
        {mode === 'code' && (
          <div className="flex items-center space-x-2">
            {!isRunning ? (
              <button
                onClick={onRun}
                title="Ejecutar código (Ctrl+Enter / F5)"
                className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-semibold transition-all shadow-md shadow-emerald-950/20 active:scale-95 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Ejecutar</span>
                <span className="hidden lg:inline text-[10px] opacity-75 font-mono ml-0.5">
                  F5
                </span>
              </button>
            ) : (
              <button
                onClick={onStop}
                title="Detener ejecución en el Web Worker"
                className="flex items-center space-x-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-all shadow-md shadow-rose-950/20 active:scale-95 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Detener</span>
              </button>
            )}

            {/* Micro-indicador de estado de ejecución */}
            <div className="hidden xl:flex items-center text-[11px] font-mono text-[var(--text-secondary)]">
              {status === 'running' && (
                <span className="flex items-center space-x-1 text-emerald-500 dark:text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Ejecutando</span>
                </span>
              )}
              {status === 'waiting_input' && (
                <span className="flex items-center space-x-1 text-sky-500 dark:text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <span>Esperando Leer</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Extremo Derecho: Seguridad, PWA, PDF, Guía de Sintaxis y Conmutador de Tema */}
      <div className="flex items-center space-x-2">
        {/* Badge discreto de estado: Anti-Paste Activo */}
        <div
          title="Seguridad Anti-Copia: Bloqueo explícito de pegado, arrastrado y menú contextual para evaluación académica."
          className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10.5px] font-medium font-mono"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
          <span className="hidden sm:inline">Anti-Paste Activo</span>
        </div>

        {/* Toggle Modo Examen (Session Guard) */}
        <button
          onClick={onToggleGuard}
          title={
            isGuardEnabled
              ? 'Modo Examen ACTIVO: Al perder el foco (cambiar de ventana) se borrará la sesión.'
              : 'Modo Práctica: Haz clic para activar el Modo Examen con Session Guard.'
          }
          className={`flex items-center space-x-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer border ${
            isGuardEnabled
              ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              : 'bg-[var(--bg-surface-subtle)] text-[var(--text-secondary)] border-[var(--border-color)] hover:text-[var(--text-primary)]'
          }`}
        >
          {isGuardEnabled ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              <span className="hidden md:inline font-mono text-[11px]">Examen</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="hidden md:inline font-mono text-[11px]">Práctica</span>
            </>
          )}
        </button>

        {/* Botón [ 📄 Exportar PDF ] */}
        <button
          onClick={onOpenExportModal}
          title="Exportar entrega académica a PDF con certificación criptográfica SHA-256"
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] text-sky-600 dark:text-sky-400 hover:text-sky-500 dark:hover:text-sky-300 border border-[var(--border-color)] hover:border-sky-500/40 rounded text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>

        {/* Botón [ ⬇️ Instalar App ] (PWA) */}
        <InstallPWAButton />

        {/* Botón colapsable: [ 📖 Guía Sintaxis ] */}
        <button
          onClick={onToggleGuide}
          title="Mostrar u ocultar la Guía de Sintaxis Rápida"
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all cursor-pointer border ${
            isGuideOpen
              ? 'bg-sky-500/20 text-sky-600 dark:text-sky-300 border-sky-500/50'
              : 'bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border-[var(--border-color)]'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Guía Sintaxis</span>
        </button>

        {/* Botón Conmutador de Tema (Dark / Light) */}
        <button
          onClick={toggleTheme}
          title={isDark ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro'}
          className="p-1.5 rounded transition-all cursor-pointer border bg-[var(--bg-surface-subtle)] hover:bg-[var(--bg-hover)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-3.5 h-3.5 text-amber-400 hover:rotate-45 transition-transform" />
          ) : (
            <Moon className="w-3.5 h-3.5 text-indigo-600 hover:-rotate-12 transition-transform" />
          )}
        </button>
      </div>
    </header>
  );
};
