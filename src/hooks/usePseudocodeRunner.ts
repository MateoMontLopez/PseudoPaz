import { useCallback, useRef, useState } from 'react';
import { ExecutionController } from '../engine/worker/ExecutionController';
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

export function usePseudocodeRunner() {
  const [status, setStatus] = useState<RunnerStatus>('idle');
  const [outputs, setOutputs] = useState<ConsoleOutputItem[]>([]);
  const [inputPrompt, setInputPrompt] = useState<InputPromptState | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const controllerRef = useRef<ExecutionController | null>(null);

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

  const clearConsole = useCallback(() => {
    setOutputs([]);
    setInputPrompt(null);
    setExecutionTimeMs(null);
    if (status !== 'running' && status !== 'waiting_input') {
      setStatus('idle');
    }
  }, [status]);

  const stop = useCallback(() => {
    if (controllerRef.current) {
      controllerRef.current.terminate();
    }
    setStatus('idle');
    setInputPrompt(null);
    appendOutput('system', 'Ejecución cancelada por el usuario.');
  }, [appendOutput]);

  const run = useCallback(
    (code: string) => {
      if (controllerRef.current) {
        controllerRef.current.terminate();
      }

      setExecutionTimeMs(null);
      setInputPrompt(null);
      setStatus('running');

      appendOutput('system', 'Iniciando compilación y ejecución...');

      const controller = new ExecutionController({
        workerFactory: () => {
          return new Worker(new URL('../engine/worker/interpreter.worker.ts', import.meta.url), {
            type: 'module',
          });
        },
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
        timeoutMs: 3000,
      });

      controllerRef.current = controller;
      controller.run(code);
    },
    [appendOutput]
  );

  const provideInput = useCallback(
    (value: string) => {
      if (!controllerRef.current || status !== 'waiting_input' || !inputPrompt) {
        return;
      }

      appendOutput('stdin', `> ${value}`);
      setInputPrompt(null);
      setStatus('running');
      controllerRef.current.provideInput(value);
    },
    [appendOutput, inputPrompt, status]
  );

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
