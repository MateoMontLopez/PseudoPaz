import { ExecutionController, ExecutionControllerCallbacks } from '../engine/worker/ExecutionController';

export interface RunWorkerOptions {
  code: string;
  callbacks: ExecutionControllerCallbacks;
  timeoutMs?: number; // Por defecto 10000 ms (10s)
}

/**
 * Servicio para la gestión estricta del ciclo de vida del Web Worker:
 * - Termina y recolecta basura (GC) de instancias de worker previas antes de cada nueva ejecución.
 * - Instancia un Web Worker nuevo y limpio para cada ejecución.
 * - Aplica un Timeout de Seguridad de 10 segundos contra bucles infinitos.
 * - Destruye la instancia inmediatamente al finalizar, detener o limpiar.
 */
export class InterpreterWorkerService {
  private controller: ExecutionController | null = null;

  /**
   * Fábrica para crear una instancia fresca de Web Worker usando Vite URL.
   */
  private createWorker(): Worker {
    return new Worker(
      new URL('../engine/worker/interpreter.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }

  /**
   * Inicia la compilación y ejecución de un algoritmo asegurando un entorno limpio.
   */
  public execute(options: RunWorkerOptions): void {
    // 1. Si existe un worker previo activo, terminarlo y limpiar referencias
    this.terminate();

    // 2. Crear un nuevo ExecutionController con su fábrica de workers y timeout de 10s
    this.controller = new ExecutionController({
      workerFactory: () => this.createWorker(),
      callbacks: {
        onPrint: (text) => {
          options.callbacks.onPrint(text);
        },
        onWaitForInput: (varName, type) => {
          options.callbacks.onWaitForInput(varName, type);
        },
        onComplete: (durationMs) => {
          try {
            options.callbacks.onComplete(durationMs);
          } finally {
            // Destruir worker inmediatamente al completar para liberar memoria
            this.terminate();
          }
        },
        onError: (err) => {
          try {
            options.callbacks.onError(err);
          } finally {
            // Destruir worker inmediatamente en caso de error o timeout
            this.terminate();
          }
        },
      },
      timeoutMs: options.timeoutMs ?? 10000, // 10 segundos
    });

    // 3. Iniciar ejecución
    this.controller.run(options.code);
  }

  /**
   * Provee un dato de entrada al worker en espera de 'Leer'.
   */
  public provideInput(value: string): void {
    if (this.controller) {
      this.controller.provideInput(value);
    }
  }

  /**
   * Destruye de forma segura la instancia del worker y desvincula controladores.
   */
  public terminate(): void {
    if (this.controller) {
      try {
        this.controller.terminate();
      } catch (err) {
        console.warn('[InterpreterWorkerService] Error al terminar worker:', err);
      }
      this.controller = null;
    }
  }
}

// Exportar instancia singleton para el ciclo de vida de la aplicación
export const interpreterWorkerService = new InterpreterWorkerService();
