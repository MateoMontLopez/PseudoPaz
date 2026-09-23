import React from 'react';
import { Play, Square, RotateCcw, ShieldCheck, ShieldAlert, Cpu } from 'lucide-react';
import { RunnerStatus } from '../../hooks/usePseudocodeRunner';

interface HeaderProps {
  status: RunnerStatus;
  isGuardEnabled: boolean;
  onRun: () => void;
  onStop: () => void;
  onClearEditor: () => void;
  onToggleGuard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  status,
  isGuardEnabled,
  onRun,
  onStop,
  onClearEditor,
  onToggleGuard,
}) => {
  const isRunning = status === 'running' || status === 'waiting_input';

  return (
    <header className="h-12 w-full bg-zinc-950/90 border-b border-zinc-800/80 px-4 flex items-center justify-between select-none">
      {/* Logo y título */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-7 h-7 rounded bg-zinc-900 border border-zinc-800 text-sky-400 font-bold font-mono text-sm shadow-sm">
          λ
        </div>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm tracking-tight text-zinc-100">PseudoPaz</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono border border-zinc-700/50">
            Fase 2
          </span>
        </div>
      </div>

      {/* Acciones principales: Ejecutar / Detener / Limpiar */}
      <div className="flex items-center space-x-2">
        {!isRunning ? (
          <button
            onClick={onRun}
            title="Ejecutar código (Ctrl+Enter)"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Ejecutar</span>
          </button>
        ) : (
          <button
            onClick={onStop}
            title="Detener ejecución del Worker"
            className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-md text-xs font-medium transition-all shadow-sm active:scale-95 cursor-pointer"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Detener</span>
          </button>
        )}

        <button
          onClick={onClearEditor}
          title="Limpiar código del editor"
          className="flex items-center space-x-1 px-3 py-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-zinc-800 rounded-md text-xs transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Limpiar</span>
        </button>
      </div>

      {/* Indicadores de estado y Control de Modo Examen */}
      <div className="flex items-center space-x-4">
        {/* Estado del compilador / worker */}
        <div className="flex items-center space-x-2 text-xs font-mono">
          {status === 'idle' && (
            <span className="flex items-center space-x-1.5 text-zinc-400">
              <span className="w-2 h-2 rounded-full bg-zinc-600"></span>
              <span>Listo</span>
            </span>
          )}
          {status === 'running' && (
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Ejecutando...</span>
            </span>
          )}
          {status === 'waiting_input' && (
            <span className="flex items-center space-x-1.5 text-sky-400">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse"></span>
              <span>Esperando Entrada</span>
            </span>
          )}
          {status === 'completed' && (
            <span className="flex items-center space-x-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span>Completado</span>
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center space-x-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>Error</span>
            </span>
          )}
        </div>

        <div className="h-4 w-[1px] bg-zinc-800"></div>

        {/* Toggle para Modo Examen / Focus Guard */}
        <button
          onClick={onToggleGuard}
          title={
            isGuardEnabled
              ? 'Modo Examen ACTIVO: Al perder el foco (cambiar de ventana) se borrará el código.'
              : 'Modo Práctica: La sesión no se borra al perder el foco. Haz clic para activar Modo Examen.'
          }
          className={`flex items-center space-x-1.5 px-2.5 py-1 rounded text-xs transition-colors cursor-pointer border ${
            isGuardEnabled
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/40 hover:bg-amber-500/20'
              : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-300'
          }`}
        >
          {isGuardEnabled ? (
            <>
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>Modo Examen</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-3.5 h-3.5 text-zinc-500" />
              <span>Modo Práctica</span>
            </>
          )}
        </button>

        {/* Sandbox badge */}
        <div className="hidden sm:flex items-center space-x-1 text-[11px] text-zinc-500 font-mono">
          <Cpu className="w-3 h-3 text-zinc-600" />
          <span>Worker Sandbox</span>
        </div>
      </div>
    </header>
  );
};
