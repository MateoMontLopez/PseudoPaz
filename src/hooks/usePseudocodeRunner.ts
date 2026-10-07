import { useCallback, useEffect, useState } from 'react';
import { interpreterWorkerService } from '../services/interpreterWorker.service';
import { WorkerExecutionError } from '../engine/worker/worker.protocol';
import { DataType } from '../engine/parser/ast';

export type RunnerStatus = 'idle' | 'running' | 'waiting_input' | 'completed' | 'error';

export interface ConsoleOutputItem {
  id: string;
  type: 'stdout' | 'stdin' | 'system' | 'error';
  text: string;
  timestamp: string;
  line?: number;
  column?: number;
}

export interface InputPromptState {
  variableName: string;
  expectedType: DataType;
}

/**
 * Hook para la gestión del flujo de ejecución del pseudocódigo en el Web Worker:
 * - Ciclo de vida estricto: limpia y recrea el worker en cada ejecución.
 * - Timeout de 10 segundos contra bucles infinitos.
 * - Recolección de basura inmediata al detener o limpiar consola.
 */
export function usePseudocodeRunner() {
  const [status, setStatus] = useState<RunnerStatus>('idle');
  const [outputs, setOutputs] = useState<ConsoleOutputItem[]>([]);
  const [inputPrompt, setInputPrompt] = useState<InputPromptState | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const appendOutput = useCallback((type: ConsoleOutputItem['type'], text: string, line?: number, column?: number) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    setOutputs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        text,
        timestamp: timeStr,
        line,
        column,
      },
    ]);
  }, []);

  // Limpiar consola y destruir worker activo para liberar recursos
  const clearConsole = useCallback(() => {
    interpreterWorkerService.terminate();
    setOutputs([]);
    setInputPrompt(null);
    setExecutionTimeMs(null);
    setStatus('idle');
  }, []);

  // Detener ejecución y destruir worker
  const stop = useCallback(() => {
    interpreterWorkerService.terminate();
    setStatus('idle');
    setInputPrompt(null);
    appendOutput('system', 'Ejecución cancelada por el usuario.');
  }, [appendOutput]);

  // Iniciar ejecución con worker nuevo y limpio
  const run = useCallback(
    (code: string) => {
      // 1. Terminar worker previo si existe
      interpreterWorkerService.terminate();

      setExecutionTimeMs(null);
      setInputPrompt(null);
      setStatus('running');

      appendOutput('system', 'Iniciando compilación y ejecución...');

      // 2. Ejecutar con timeout de 10 segundos
      interpreterWorkerService.execute({
        code,
        timeoutMs: 10000,
        callbacks: {
          onPrint: (text: string) => {
            appendOutput('stdout', text);
          },
          onWaitForInput: (variableName: string, expectedType: DataType) => {
            setStatus('waiting_input');
            setInputPrompt({ variableName, expectedType });
          },
          onComplete: (durationMs: number) => {
            setStatus('completed');
            setInputPrompt(null);
            setExecutionTimeMs(durationMs);
            appendOutput('system', `Ejecución finalizada con éxito en ${durationMs} ms.`);
          },
          onError: (err: WorkerExecutionError) => {
            setStatus('error');
            setInputPrompt(null);

            let prefix = 'Error';
            if (err.phase === 'lexer') prefix = 'Error Léxico';
            else if (err.phase === 'parser') prefix = 'Error Sintáctico';
            else if (err.phase === 'runtime') prefix = 'Error en Ejecución';
            else if (err.phase === 'timeout') prefix = 'Tiempo Excedido (Timeout)';

            const location = err.line ? ` [Línea ${err.line}, Col ${err.column ?? 1}]` : '';
            appendOutput('error', `${prefix}${location}: ${err.message}`, err.line, err.column);
          },
        },
      });
    },
    [appendOutput]
  );

  const provideInput = useCallback(
    (value: string) => {
      if (status !== 'waiting_input' || !inputPrompt) {
        return;
      }

      appendOutput('stdin', `> ${value}`);
      setInputPrompt(null);
      setStatus('running');
      interpreterWorkerService.provideInput(value);
    },
    [appendOutput, inputPrompt, status]
  );

  // Limpieza al desmontar el componente
  useEffect(() => {
    return () => {
      interpreterWorkerService.terminate();
    };
  }, []);

  return {
    status,
    outputs,
    inputPrompt,
    executionTimeMs,
    run,
    stop,
    provideInput,
    clearConsole,
  };
}
