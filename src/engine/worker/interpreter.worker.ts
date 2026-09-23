import { Lexer, LexerError } from '../lexer/Lexer';
import { Parser, ParserError } from '../parser/Parser';
import { Interpreter } from '../interpreter/Interpreter';
import { RuntimeError } from '../interpreter/Environment';
import { DataType } from '../parser/ast';
import {
  MainToWorkerMessage,
  WorkerExecutionError,
  WorkerToMainMessage,
} from './worker.protocol';

/**
 * Lógica del Worker independiente para permitir pruebas unitarias y ejecución en Web Worker.
 */
export class WorkerRuntime {
  private currentInterpreter: Interpreter | null = null;
  private pendingInputResolver: ((value: string) => void) | null = null;
  private readonly postMessageFn: (msg: WorkerToMainMessage) => void;

  constructor(postMessageFn: (msg: WorkerToMainMessage) => void) {
    this.postMessageFn = postMessageFn;
  }

  public async handleMessage(message: MainToWorkerMessage): Promise<void> {
    switch (message.type) {
      case 'START_EXECUTION':
        await this.startExecution(message.code);
        break;

      case 'PROVIDE_INPUT':
        this.provideInput(message.value);
        break;

      case 'TERMINATE':
        this.terminate();
        break;
    }
  }

  private async startExecution(code: string): Promise<void> {
    const startTime = performance.now();

    try {
      // 1. Fase Léxica
      const lexer = new Lexer(code);
      const tokens = lexer.tokenize();

      // 2. Fase Sintáctica
      const parser = new Parser(tokens);
      const ast = parser.parse();

      // 3. Fase de Interpretación
      this.currentInterpreter = new Interpreter({
        onPrint: (text: string) => {
          this.postMessageFn({
            type: 'PRINT_OUTPUT',
            text,
          });
        },
        onRead: (variableName: string, expectedType: DataType): Promise<string> => {
          this.postMessageFn({
            type: 'WAIT_FOR_INPUT',
            variableName,
            expectedType,
          });

          return new Promise<string>((resolve) => {
            this.pendingInputResolver = resolve;
          });
        },
      });

      await this.currentInterpreter.execute(ast);

      const endTime = performance.now();
      this.postMessageFn({
        type: 'EXECUTION_COMPLETE',
        executionTimeMs: Math.round(endTime - startTime),
      });
    } catch (err: unknown) {
      const errorPayload = this.categorizeError(err);
      this.postMessageFn({
        type: 'EXECUTION_ERROR',
        error: errorPayload,
      });
    } finally {
      this.currentInterpreter = null;
      this.pendingInputResolver = null;
    }
  }

  private provideInput(value: string): void {
    if (this.pendingInputResolver) {
      const resolver = this.pendingInputResolver;
      this.pendingInputResolver = null;
      resolver(value);
    }
  }

  private terminate(): void {
    if (this.currentInterpreter) {
      this.currentInterpreter.cancel();
      this.currentInterpreter = null;
    }
    this.pendingInputResolver = null;
  }

  private categorizeError(err: unknown): WorkerExecutionError {
    if (err instanceof LexerError) {
      return {
        phase: 'lexer',
        message: err.message,
        line: err.line,
        column: err.column,
      };
    }

    if (err instanceof ParserError) {
      return {
        phase: 'parser',
        message: err.message,
        line: err.line,
        column: err.column,
      };
    }

    if (err instanceof RuntimeError) {
      return {
        phase: 'runtime',
        message: err.message,
        line: err.line,
        column: err.column,
      };
    }

    if (err instanceof Error) {
      return {
        phase: 'unknown',
        message: err.message,
      };
    }

    return {
      phase: 'unknown',
      message: String(err),
    };
  }
}

// Configuración si se ejecuta en entorno de Web Worker real del navegador
if (typeof self !== 'undefined' && typeof WorkerGlobalScope !== 'undefined' && self instanceof WorkerGlobalScope) {
  const runtime = new WorkerRuntime((msg) => {
    self.postMessage(msg);
  });

  self.onmessage = (event: MessageEvent<MainToWorkerMessage>) => {
    void runtime.handleMessage(event.data);
  };
}
