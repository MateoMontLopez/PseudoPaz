import { DataType } from '../parser/ast';
import {
  MainToWorkerMessage,
  WorkerExecutionError,
  WorkerToMainMessage,
} from './worker.protocol';

export interface ExecutionControllerCallbacks {
  onPrint: (text: string) => void;
  onWaitForInput: (variableName: string, expectedType: DataType) => void;
  onComplete: (durationMs: number) => void;
  onError: (error: WorkerExecutionError) => void;
}

export interface ExecutionControllerOptions {
  workerFactory: () => Worker;
  callbacks: ExecutionControllerCallbacks;
  timeoutMs?: number; // Por defecto 3000 ms
}

export class ExecutionController {
  private worker: Worker | null = null;
  private readonly workerFactory: () => Worker;
  private readonly callbacks: ExecutionControllerCallbacks;
  private readonly timeoutMs: number;

  private isRunning: boolean = false;
  private isWaitingInput: boolean = false;
  private timerId: ReturnType<typeof setTimeout> | null = null;
  private activeComputeStartTime: number = 0;
  private accumulatedComputeMs: number = 0;

  constructor(options: ExecutionControllerOptions) {
    this.workerFactory = options.workerFactory;
    this.callbacks = options.callbacks;
    this.timeoutMs = options.timeoutMs ?? 10000;
  }

  /**
   * Inicia la ejecución de código en un nuevo Web Worker protegido.
   */
  public run(code: string): void {
    // Si ya había una ejecución en curso, terminarla primero
    this.terminate();

    this.worker = this.workerFactory();
    this.isRunning = true;
    this.isWaitingInput = false;
    this.accumulatedComputeMs = 0;

    this.worker.onmessage = (event: MessageEvent<WorkerToMainMessage>) => {
      this.handleWorkerMessage(event.data);
    };

    this.worker.onerror = (err) => {
      this.clearGuardTimer();
      this.isRunning = false;
      this.callbacks.onError({
        phase: 'unknown',
        message: `Error interno del Worker: ${err.message}`,
      });
      this.terminate();
    };

    this.startGuardTimer();

    const startMsg: MainToWorkerMessage = {
      type: 'START_EXECUTION',
      code,
    };
    this.worker.postMessage(startMsg);
  }

  /**
   * Envía el valor ingresado por el usuario al Web Worker para satisfacer una instrucción 'Leer'.
   */
  public provideInput(value: string): void {
    if (!this.isRunning || !this.isWaitingInput || !this.worker) {
      return;
    }

    this.isWaitingInput = false;
    // Reanudar el temporizador de tiempo límite de cómputo
    this.startGuardTimer();

    const inputMsg: MainToWorkerMessage = {
      type: 'PROVIDE_INPUT',
      value,
    };
    this.worker.postMessage(inputMsg);
  }

  /**
   * Detiene inmediatamente el worker y cancela todos los temporizadores.
   */
  public terminate(): void {
    this.clearGuardTimer();
    this.isRunning = false;
    this.isWaitingInput = false;

    if (this.worker) {
      try {
        this.worker.onmessage = null;
        this.worker.onerror = null;
        const termMsg: MainToWorkerMessage = { type: 'TERMINATE' };
        this.worker.postMessage(termMsg);
        this.worker.terminate();
      } catch {
        // Ignorar si ya estaba cerrado
      }
      this.worker = null;
    }
  }

  private handleWorkerMessage(message: WorkerToMainMessage): void {
    switch (message.type) {
      case 'PRINT_OUTPUT':
        this.callbacks.onPrint(message.text);
        break;

      case 'WAIT_FOR_INPUT':
        // Pausar el guardián de timeout mientras el usuario escribe
        this.pauseGuardTimer();
        this.isWaitingInput = true;
        this.callbacks.onWaitForInput(message.variableName, message.expectedType);
        break;

      case 'EXECUTION_COMPLETE':
        this.clearGuardTimer();
        this.isRunning = false;
        this.callbacks.onComplete(message.executionTimeMs);
        this.terminate();
        break;

      case 'EXECUTION_ERROR':
        this.clearGuardTimer();
        this.isRunning = false;
        this.callbacks.onError(message.error);
        this.terminate();
        break;
    }
  }

  // ---------------- GESTIÓN DEL EXECUTION GUARD (TIMEOUT) ----------------

  private startGuardTimer(): void {
    this.clearGuardTimer();
    this.activeComputeStartTime = performance.now();

    const remainingMs = Math.max(10, this.timeoutMs - this.accumulatedComputeMs);

    this.timerId = setTimeout(() => {
      this.handleTimeout();
    }, remainingMs);
  }

  private pauseGuardTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
      this.accumulatedComputeMs += performance.now() - this.activeComputeStartTime;
    }
  }

  private clearGuardTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  private handleTimeout(): void {
    if (!this.isRunning) return;

    this.clearGuardTimer();
    this.isRunning = false;

    // Forzar la terminación inmediata del Worker
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    this.callbacks.onError({
      phase: 'timeout',
      message: `Tiempo de ejecución excedido (límite de ${this.timeoutMs}ms). Es probable que su código contenga un bucle infinito.`,
    });
  }
}
