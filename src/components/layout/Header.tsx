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
} from 'lucide-react';
import { RunnerStatus } from '../../hooks/usePseudocodeRunner';
import { ModeSwitch, AppMode } from './ModeSwitch';
import { InstallPWAButton } from '../pwa/InstallPWAButton';

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
  const isRunning = status === 'running' || status === 'waiting_input';

  return (
    <header className="h-12 w-full bg-[#0c0f16] border-b border-zinc-800/80 px-3 flex items-center justify-between select-none shrink-0 z-20">
      {/* 1. Extremo Izquierdo: Brand/Logo ("Pseudocode & DFD IDE") y toggle de explorador */}
      <div className="flex items-center space-x-2.5">
        <button
          onClick={onToggleSidebar}
          title={isSidebarOpen ? 'Ocultar explorador de archivos' : 'Mostrar explorador de archivos'}
          className="p-1.5 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 rounded transition-colors cursor-pointer"
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-sky-400" />
          ) : (
            <PanelLeftOpen className="w-4 h-4" />
          )}
        </button>

        <div className="flex items-center space-x-2">
          <div className="flex items-center justify-center w-6 h-6 rounded bg-sky-500/15 border border-sky-400/40 text-sky-400 font-bold font-mono text-xs shadow-xs">
            λ
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-xs tracking-tight text-zinc-100 leading-tight">
              Pseudocode & DFD IDE
            </span>
            <span className="text-[9.5px] font-mono text-zinc-500 leading-none">
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
                className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-semibold transition-all shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer"
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
                className="flex items-center space-x-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-all shadow-md shadow-rose-950/40 active:scale-95 cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Detener</span>
              </button>
            )}

            {/* Micro-indicador de estado de ejecución */}
            <div className="hidden xl:flex items-center text-[11px] font-mono text-zinc-400">
              {status === 'running' && (
                <span className="flex items-center space-x-1 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>Ejecutando</span>
                </span>
              )}
              {status === 'waiting_input' && (
                <span className="flex items-center space-x-1 text-sky-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
                  <span>Esperando Leer</span>
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Extremo Derecho: Seguridad, PWA, PDF y Guía de Sintaxis */}
      <div className="flex items-center space-x-2">
        {/* Badge discreto de estado: Anti-Paste Activo */}
        <div
          title="Seguridad Anti-Copia: Bloqueo explícito de pegado, arrastrado y menú contextual para evaluación académica."
          className="flex items-center space-x-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10.5px] font-medium font-mono"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
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
              ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25'
              : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-zinc-200'
          }`}
        >
          {isGuardEnabled ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline font-mono text-[11px]">Examen</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden md:inline font-mono text-[11px]">Práctica</span>
            </>
          )}
        </button>

        {/* Botón [ 📄 Exportar PDF ] */}
        <button
          onClick={onOpenExportModal}
          title="Exportar entrega académica a PDF con certificación criptográfica SHA-256"
          className="flex items-center space-x-1.5 px-2.5 py-1 bg-zinc-900 hover:bg-zinc-800 text-sky-400 hover:text-sky-300 border border-zinc-800 hover:border-sky-500/40 rounded text-xs font-medium transition-all shadow-xs active:scale-95 cursor-pointer"
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
              ? 'bg-sky-500/20 text-sky-300 border-sky-500/50'
              : 'bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border-zinc-800'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden lg:inline">Guía Sintaxis</span>
        </button>
      </div>
    </header>
  );
};
