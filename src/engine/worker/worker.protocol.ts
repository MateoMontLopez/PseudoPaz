import { DataType } from '../parser/ast';

export type WorkerErrorPhase = 'lexer' | 'parser' | 'runtime' | 'timeout' | 'unknown';

export interface WorkerExecutionError {
  phase: WorkerErrorPhase;
  message: string;
  line?: number;
  column?: number;
}

// ---------------- MENSAJES HACIA EL WORKER (MAIN -> WORKER) ----------------

export interface StartExecutionMessage {
  type: 'START_EXECUTION';
  code: string;
  mode?: 'run' | 'step';
}

export interface ProvideInputMessage {
  type: 'PROVIDE_INPUT';
  value: string;
}

export interface StepNextMessage {
  type: 'STEP_NEXT';
}

export interface TerminateMessage {
  type: 'TERMINATE';
}

export type MainToWorkerMessage =
  | StartExecutionMessage
  | ProvideInputMessage
  | StepNextMessage
  | TerminateMessage;

// ---------------- MENSAJES DESDE EL WORKER (WORKER -> MAIN) ----------------

export interface PrintOutputMessage {
  type: 'PRINT_OUTPUT';
  text: string;
}

export interface WaitForInputMessage {
  type: 'WAIT_FOR_INPUT';
  variableName: string;
  expectedType: DataType;
}

export interface StepPausedMessage {
  type: 'STEP_PAUSED';
  line: number;
  column?: number;
  variables?: Record<string, any>;
}

export interface ExecutionCompleteMessage {
  type: 'EXECUTION_COMPLETE';
  executionTimeMs: number;
}

export interface ExecutionErrorMessage {
  type: 'EXECUTION_ERROR';
  error: WorkerExecutionError;
}

export type WorkerToMainMessage =
  | PrintOutputMessage
  | WaitForInputMessage
  | StepPausedMessage
  | ExecutionCompleteMessage
  | ExecutionErrorMessage;
