import React, { useEffect, useRef, useState } from 'react';
import {
  Terminal,
  Play,
  Square,
  RotateCcw,
  Trash2,
  X,
  Maximize2,
  Minimize2,
  StepForward,
  Clock,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  ConsoleOutputItem,
  InputPromptState,
  RunnerStatus,
} from '../../hooks/usePseudocodeRunner';
import { ConsoleInput } from './ConsoleInput';

interface ExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: RunnerStatus;
  outputs: ConsoleOutputItem[];
  inputPrompt: InputPromptState | null;
  executionTimeMs: number | null;
  isStepMode: boolean;
  activeExecutionLine: number | null;
  scopeVariables: Record<string, any>;
  onRun: () => void;
  onStep: () => void;
  onStop: () => void;
  onProvideInput: (value: string) => void;
  onClearConsole: () => void;
  algorithmName?: string;
}

export const ExecutionModal: React.FC<ExecutionModalProps> = ({
  isOpen,
  onClose,
  status,
  outputs,
  inputPrompt,
  executionTimeMs,
  isStepMode,
  activeExecutionLine,
  scopeVariables,
  onRun,
  onStep,
  onStop,
  onProvideInput,
  onClearConsole,
  algorithmName = 'Algoritmo',
}) => {
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [showInspector, setShowInspector] = useState<boolean>(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const isRunning = status === 'running' || status === 'waiting_input' || status === 'paused_step';

  // Auto-scroll al final con cada nuevo output
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputs, inputPrompt]);

  // Manejo de atajos en la ventana emergente
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'F10') {
        e.preventDefault();
        onStep();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, onStep]);

  if (!isOpen) return null;

  const variableEntries = Object.entries(scopeVariables);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className={`bg-[var(--bg-app)] border border-[var(--border-color)] rounded-xl shadow-2xl flex flex-col overflow-hidden transition-all duration-150 ${
          isMaximized ? 'w-full h-full rounded-none' : 'w-full max-w-4xl h-[620px] max-h-[92vh]'
        }`}
      >
        {/* Cabecera estilo ventana de sistema operativo (PSeInt Moderno) */}
        <div className="h-10 px-3.5 bg-[var(--console-header-bg)] border-b border-[var(--border-color)] flex items-center justify-between select-none shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex items-center justify-center w-5 h-5 rounded bg-emerald-500/20 text-emerald-500 dark:text-emerald-400 font-bold">
              <Terminal className="w-3.5 h-3.5" />
            </div>
            <span className="font-semibold text-xs text-[var(--text-primary)] tracking-tight">
              Ejecución: <span className="text-sky-500 dark:text-sky-400 font-mono">{algorithmName}</span>
            </span>

            {/* Micro-badge de estado */}
            {status === 'running' && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                Ejecutando
              </span>
            )}
            {status === 'waiting_input' && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                Esperando Entrada
              </span>
            )}
            {status === 'paused_step' && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Depurando (Línea {activeExecutionLine ?? '?'})
              </span>
            )}
            {status === 'completed' && executionTimeMs !== null && (
              <span className="flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded bg-[var(--bg-surface-subtle)] text-[var(--text-muted)] border border-[var(--border-color)]">
                <Clock className="w-3 h-3 text-[var(--text-muted)]" />
                {executionTimeMs} ms
              </span>
            )}
          </div>

          {/* Acciones de la ventana emergente */}
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setShowInspector((prev) => !prev)}
              title={showInspector ? 'Ocultar inspector de variables' : 'Ver inspector de variables'}
              className={`p-1.5 rounded hover:bg-[var(--bg-hover)] transition-colors cursor-pointer ${
                showInspector ? 'text-sky-500 dark:text-sky-400' : 'text-[var(--text-muted)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsMaximized((prev) => !prev)}
              title={isMaximized ? 'Restaurar tamaño' : 'Maximizar'}
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors cursor-pointer"
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={onClose}
              title="Cerrar ventana (Esc)"
              className="p-1.5 text-[var(--text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Barra de herramientas interactiva (Play, Step, Stop, Reiniciar, Limpiar) */}
        <div className="px-3.5 py-1.5 bg-[var(--bg-surface-subtle)] border-b border-[var(--border-color)] flex items-center justify-between select-none">
          <div className="flex items-center space-x-2">
            {!isRunning ? (
              <button
                onClick={onRun}
                title="Ejecutar algoritmo completo"
                className="flex items-center space-x-1.5 px-3 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Ejecutar</span>
              </button>
            ) : (
              <button
                onClick={onStop}
                title="Detener ejecución activa"
                className="flex items-center space-x-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
                <span>Detener</span>
              </button>
            )}

            {/* Botón Paso a Paso */}
            <button
              onClick={onStep}
              title={
                status === 'paused_step'
                  ? 'Avanzar a la siguiente sentencia (F10)'
                  : 'Iniciar ejecución paso a paso guiada'
              }
              className={`flex items-center space-x-1.5 px-3 py-1 rounded text-xs font-semibold shadow-xs transition-all active:scale-95 cursor-pointer border ${
                status === 'paused_step'
                  ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 hover:bg-amber-400 animate-pulse'
                  : 'bg-[var(--bg-app)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] border-[var(--border-color)]'
              }`}
            >
              <StepForward className="w-3 h-3" />
              <span>{status === 'paused_step' ? 'Siguiente Paso (F10)' : 'Paso a Paso'}</span>
            </button>

            {/* Reiniciar */}
            <button
              onClick={() => {
                onStop();
                onClearConsole();
                setTimeout(() => onRun(), 80);
              }}
              title="Reiniciar ejecución desde cero"
              className="flex items-center space-x-1 px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] border border-[var(--border-color)] rounded transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3 text-sky-500" />
              <span className="hidden sm:inline">Reiniciar</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {outputs.length > 0 && (
              <button
                onClick={onClearConsole}
                title="Limpiar salida de la consola"
                className="flex items-center space-x-1 px-2 py-1 text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-hover)] rounded transition-colors cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                <span>Limpiar</span>
              </button>
            )}
          </div>
        </div>

        {/* Contenido dividido: Consola de ejecución + Inspector de variables */}
        <div className="flex-1 flex flex-row min-h-0 overflow-hidden">
          {/* Panel de Consola I/O */}
          <div ref={scrollRef} className="flex-1 p-3.5 bg-[var(--console-bg)] overflow-y-auto space-y-1.5 font-mono text-xs select-text">
            {outputs.length === 0 && status === 'idle' && (
              <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-2 select-none py-12">
                <Terminal className="w-10 h-10 opacity-30 stroke-[1.5]" />
                <p className="text-xs font-sans">Ventana lista para ejecutar.</p>
                <p className="text-[11px] opacity-70 font-sans">
                  Haz clic en 'Ejecutar' o 'Paso a Paso' para iniciar.
                </p>
              </div>
            )}

            {outputs.map((item) => {
              switch (item.type) {
                case 'stdout':
                  return (
                    <div key={item.id} className="text-[var(--text-primary)] leading-relaxed break-words whitespace-pre-wrap">
                      {item.text}
                    </div>
                  );
                case 'stdin':
                  return (
                    <div key={item.id} className="text-sky-600 dark:text-sky-300 font-semibold break-words">
                      {item.text}
                    </div>
                  );
                case 'system':
                  return (
                    <div key={item.id} className="text-[var(--text-muted)] text-[11px] italic py-0.5">
                      [{item.timestamp}] {item.text}
                    </div>
                  );
                case 'error':
                  return (
                    <div
                      key={item.id}
                      className="p-2.5 my-1 bg-rose-500/10 border border-rose-500/30 rounded text-rose-600 dark:text-rose-300 text-xs leading-normal whitespace-pre-wrap break-words"
                    >
                      <span className="font-semibold">{item.text}</span>
                    </div>
                  );
                default:
                  return null;
              }
            })}

            {/* Input interactivo si se espera 'Leer' */}
            {inputPrompt && (
              <ConsoleInput
                variableName={inputPrompt.variableName}
                expectedType={inputPrompt.expectedType}
                onSubmit={onProvideInput}
              />
            )}
          </div>

          {/* Panel Lateral: Inspector de Variables en Vivo (Modo Depurador) */}
          {showInspector && (
            <div className="w-72 bg-[var(--bg-surface-subtle)] border-l border-[var(--border-color)] flex flex-col shrink-0 overflow-hidden select-none">
              <div className="px-3 py-2 border-b border-[var(--border-color)] flex items-center justify-between text-xs font-semibold text-[var(--text-primary)]">
                <div className="flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-sky-500" />
                  <span>Variables en Memoria</span>
                </div>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-app)] border border-[var(--border-color)] text-[var(--text-muted)]">
                  {variableEntries.length}
                </span>
              </div>

              <div className="flex-1 p-2.5 overflow-y-auto space-y-1.5 font-mono text-[11px]">
                {variableEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center text-[var(--text-muted)] text-[11px] font-sans p-4 space-y-1">
                    <p>No hay variables activas en este ámbito.</p>
                    <p className="text-[10px] opacity-75">
                      Avanza paso a paso para ver la asignación de valores en tiempo real.
                    </p>
                  </div>
                ) : (
                  variableEntries.map(([key, variable]) => (
                    <div
                      key={key}
                      className="p-2 rounded bg-[var(--bg-app)] border border-[var(--border-color)] hover:border-sky-500/30 transition-all flex flex-col space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sky-600 dark:text-sky-400">{variable.name}</span>
                        {variable.type && (
                          <span className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-[var(--bg-surface)] text-[var(--text-muted)] border border-[var(--border-color)]">
                            {variable.type}
                          </span>
                        )}
                      </div>

                      <div className="text-[10.5px] text-[var(--text-primary)] font-mono break-all">
                        {variable.isArray ? (
                          <div className="space-y-0.5 mt-1">
                            <span className="text-[9.5px] text-[var(--text-muted)] block">
                              Arreglo [{variable.dimensions?.join(', ')}]
                            </span>
                            {Object.entries(variable.value || {}).map(([idxKey, idxVal]) => (
                              <div key={idxKey} className="flex justify-between pl-2 text-[10px]">
                                <span className="text-amber-500">[{idxKey}]:</span>
                                <span className="font-semibold">{String(idxVal)}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {String(variable.value)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer informativo */}
        <div className="h-6 px-3 bg-[var(--console-header-bg)] border-t border-[var(--border-color)] flex items-center justify-between text-[10px] font-mono text-[var(--text-muted)] select-none">
          <span>
            Presiona [F10] Siguiente Paso • [Esc] Cerrar Ventana
            {isStepMode && ' • Modo Depurador Activo'}
          </span>
          <span>PseudoPaz Engine v2.1</span>
        </div>
      </div>
    </div>
  );
};
