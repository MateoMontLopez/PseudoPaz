import { useCallback, useEffect, useRef, useState } from 'react';
import { interpreterWorkerService } from '../services/interpreterWorker.service';
import { WorkerExecutionError } from '../engine/worker/worker.protocol';
import { DataType } from '../engine/parser/ast';
import { ExecutionRunRecord } from '../types/executionHistory';

export type RunnerStatus = 'idle' | 'running' | 'waiting_input' | 'paused_step' | 'completed' | 'error';

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
 * - Modo Depurador / Paso a Paso con pausa en cada sentencia y variables vivas.
 * - Registro histórico de ejecuciones para auditoría y exportación a PDF.
 * - Timeout de 10 segundos contra bucles infinitos (pausado durante espera de input o depuración).
 * - Recolección de basura inmediata al detener o limpiar consola.
 */
export function usePseudocodeRunner() {
  const [status, setStatus] = useState<RunnerStatus>('idle');
  const [outputs, setOutputs] = useState<ConsoleOutputItem[]>([]);
  const [inputPrompt, setInputPrompt] = useState<InputPromptState | null>(null);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  // Estados de depuración paso a paso
  const [isStepMode, setIsStepMode] = useState<boolean>(false);
  const [activeExecutionLine, setActiveExecutionLine] = useState<number | null>(null);
  const [scopeVariables, setScopeVariables] = useState<Record<string, any>>({});

  // Historial de corridas/pruebas ejecutadas
  const [executionHistory, setExecutionHistory] = useState<ExecutionRunRecord[]>([]);

  // Referencias para capturar datos de la corrida en curso
  const currentRunCodeRef = useRef<string>('');
  const currentRunInputsRef = useRef<string[]>([]);
  const currentRunOutputsRef = useRef<ConsoleOutputItem[]>([]);
  const currentRunModeRef = useRef<'run' | 'step'>('run');

  const appendOutput = useCallback((type: ConsoleOutputItem['type'], text: string, line?: number, column?: number) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    const newItem: ConsoleOutputItem = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      text,
      timestamp: timeStr,
      line,
      column,
    };

    currentRunOutputsRef.current.push(newItem);
    setOutputs((prev) => [...prev, newItem]);
  }, []);

  // Extrae el nombre del algoritmo desde el código fuente
  const extractAlgorithmName = (code: string): string => {
    const match = code.match(/Algoritmo\s+([a-zA-Z0-9_]+)/i) || code.match(/Proceso\s+([a-zA-Z0-9_]+)/i);
    return match ? match[1] : 'SinTitulo';
  };

  // Registrar la ejecución en el historial
  const recordRun = useCallback(
    (runStatus: 'completed' | 'error' | 'stopped', durationMs: number | null, errorMessage?: string) => {
      const runIndex = executionHistory.length + 1;
      const now = new Date();
      const timestamp = now.toLocaleString();

      const newRecord: ExecutionRunRecord = {
        id: `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        runIndex,
        timestamp,
        algorithmName: extractAlgorithmName(currentRunCodeRef.current),
        codeSnapshot: currentRunCodeRef.current,
        durationMs,
        status: runStatus,
        inputs: [...currentRunInputsRef.current],
        outputs: [...currentRunOutputsRef.current],
        errorMessage,
        mode: currentRunModeRef.current,
      };

      setExecutionHistory((prev) => [...prev, newRecord]);
    },
    [executionHistory.length]
  );

  // Limpiar consola y destruir worker activo para liberar recursos
  const clearConsole = useCallback(() => {
    interpreterWorkerService.terminate();
    setOutputs([]);
    setInputPrompt(null);
    setExecutionTimeMs(null);
    setActiveExecutionLine(null);
    setScopeVariables({});
    setIsStepMode(false);
    setStatus('idle');
  }, []);

  const clearExecutionHistory = useCallback(() => {
    setExecutionHistory([]);
  }, []);

  // Detener ejecución y destruir worker
  const stop = useCallback(() => {
    interpreterWorkerService.terminate();
    setStatus('idle');
    setInputPrompt(null);
    setActiveExecutionLine(null);
    setIsStepMode(false);
    appendOutput('system', 'Ejecución cancelada por el usuario.');
    recordRun('stopped', null, 'Cancelado por el usuario');
  }, [appendOutput, recordRun]);

  // Iniciar ejecución estándar o paso a paso
  const run = useCallback(
    (code: string, mode: 'run' | 'step' = 'run') => {
      // 1. Terminar worker previo si existe
      interpreterWorkerService.terminate();

      currentRunCodeRef.current = code;
      currentRunInputsRef.current = [];
      currentRunOutputsRef.current = [];
      currentRunModeRef.current = mode;

      const isStep = mode === 'step';
      setIsStepMode(isStep);
      setActiveExecutionLine(null);
      setScopeVariables({});
      setExecutionTimeMs(null);
      setInputPrompt(null);
      setStatus(isStep ? 'paused_step' : 'running');

      appendOutput('system', isStep ? 'Iniciando depuración paso a paso...' : 'Iniciando compilación y ejecución...');

      // 2. Ejecutar con Web Worker protegido
      interpreterWorkerService.execute({
        code,
        mode,
        timeoutMs: 10000,
        callbacks: {
          onPrint: (text: string) => {
            appendOutput('stdout', text);
          },
          onWaitForInput: (variableName: string, expectedType: DataType) => {
            setStatus('waiting_input');
            setInputPrompt({ variableName, expectedType });
          },
          onStepPaused: (line: number, _column?: number, variables?: Record<string, any>) => {
            setStatus('paused_step');
            setActiveExecutionLine(line);
            if (variables) {
              setScopeVariables(variables);
            }
          },
          onComplete: (durationMs: number) => {
            setStatus('completed');
            setInputPrompt(null);
            setActiveExecutionLine(null);
            setIsStepMode(false);
            setExecutionTimeMs(durationMs);
            appendOutput('system', `Ejecución finalizada con éxito en ${durationMs} ms.`);
            recordRun('completed', durationMs);
          },
          onError: (err: WorkerExecutionError) => {
            setStatus('error');
            setInputPrompt(null);
            setActiveExecutionLine(err.line ?? null);
            setIsStepMode(false);

            let prefix = 'Error';
            if (err.phase === 'lexer') prefix = 'Error Léxico';
            else if (err.phase === 'parser') prefix = 'Error Sintáctico';
            else if (err.phase === 'runtime') prefix = 'Error en Ejecución';
            else if (err.phase === 'timeout') prefix = 'Tiempo Excedido (Timeout)';

            const location = err.line ? ` [Línea ${err.line}, Col ${err.column ?? 1}]` : '';
            const fullMsg = `${prefix}${location}: ${err.message}`;
            appendOutput('error', fullMsg, err.line, err.column);
            recordRun('error', null, fullMsg);
          },
        },
      });
    },
    [appendOutput, recordRun]
  );

  // Iniciar depuración paso a paso o avanzar al siguiente paso si ya está en pausa
  const step = useCallback(
    (code: string) => {
      if (status === 'paused_step') {
        interpreterWorkerService.stepNext();
      } else {
        run(code, 'step');
      }
    },
    [run, status]
  );

  const stepNext = useCallback(() => {
    if (status === 'paused_step') {
      interpreterWorkerService.stepNext();
    }
  }, [status]);

  const provideInput = useCallback(
    (value: string) => {
      if (status !== 'waiting_input' || !inputPrompt) {
        return;
      }

      currentRunInputsRef.current.push(value);
      appendOutput('stdin', `> ${value}`);
      setInputPrompt(null);
      setStatus(isStepMode ? 'paused_step' : 'running');
      interpreterWorkerService.provideInput(value);
    },
    [appendOutput, inputPrompt, isStepMode, status]
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
    isStepMode,
    activeExecutionLine,
    scopeVariables,
    executionHistory,
    run,
    step,
    stepNext,
    stop,
    provideInput,
    clearConsole,
    clearExecutionHistory,
  };
}
