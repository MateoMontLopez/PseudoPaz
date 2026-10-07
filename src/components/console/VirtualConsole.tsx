import React, { useEffect, useRef } from 'react';
import { Terminal, Trash2, Clock, AlertCircle } from 'lucide-react';
import { ConsoleOutputItem, InputPromptState, RunnerStatus } from '../../hooks/usePseudocodeRunner';
import { ConsoleInput } from './ConsoleInput';

interface VirtualConsoleProps {
  outputs: ConsoleOutputItem[];
  status: RunnerStatus;
  inputPrompt: InputPromptState | null;
  executionTimeMs: number | null;
  onProvideInput: (value: string) => void;
  onClearConsole: () => void;
}

export const VirtualConsole: React.FC<VirtualConsoleProps> = ({
  outputs,
  status,
  inputPrompt,
  executionTimeMs,
  onProvideInput,
  onClearConsole,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll al final cuando hay nuevos mensajes o se solicita input
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [outputs, inputPrompt]);

  return (
    <div className="flex flex-col h-full w-full bg-[var(--console-bg)] font-mono text-xs overflow-hidden select-text transition-colors duration-150">
      {/* Header de la consola */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[var(--console-header-bg)] border-b border-[var(--border-color)] select-none">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span className="font-medium text-[var(--text-primary)]">Terminal I/O</span>

          {executionTimeMs !== null && (
            <span className="flex items-center gap-1 text-[11px] text-[var(--text-secondary)] bg-[var(--bg-surface-subtle)] px-2 py-0.5 rounded border border-[var(--border-color)]">
              <Clock className="w-3 h-3 text-[var(--text-muted)]" />
              {executionTimeMs} ms
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {outputs.length > 0 && (
            <button
              onClick={onClearConsole}
              title="Limpiar consola"
              className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 rounded hover:bg-[var(--bg-hover)] transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpiar</span>
            </button>
          )}
        </div>
      </div>

      {/* Área de mensajes de la consola */}
      <div ref={scrollRef} className="flex-1 p-3.5 overflow-y-auto space-y-1.5 font-mono">
        {outputs.length === 0 && status === 'idle' && (
          <div className="flex flex-col items-center justify-center h-full text-[var(--text-muted)] space-y-1.5 select-none py-12">
            <Terminal className="w-8 h-8 opacity-40 stroke-[1.5]" />
            <p className="text-xs">Consola lista para ejecutar.</p>
            <p className="text-[11px] opacity-75">Presiona 'Ejecutar' (Ctrl+Enter) para iniciar la compilación.</p>
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
                  className="flex items-start gap-2 p-2.5 my-1 bg-rose-500/10 border border-rose-500/30 rounded text-rose-600 dark:text-rose-300 text-xs leading-normal"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 whitespace-pre-wrap break-words">
                    <span className="font-semibold">{item.text}</span>
                  </div>
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
    </div>
  );
};
