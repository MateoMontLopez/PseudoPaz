import { describe, expect, it } from 'vitest';
import { WorkerRuntime } from '../src/engine/worker/interpreter.worker';
import {
  ExecutionController,
  ExecutionControllerCallbacks,
} from '../src/engine/worker/ExecutionController';
import {
  MainToWorkerMessage,
  WorkerToMainMessage,
} from '../src/engine/worker/worker.protocol';

describe('Web Worker & Execution Guard', () => {
  it('debe comunicarse mediante el protocolo de mensajes y procesar I/O', async () => {
    const messagesToMain: WorkerToMainMessage[] = [];
    const runtime = new WorkerRuntime((msg) => {
      messagesToMain.push(msg);
    });

    const code = `
      Algoritmo TestWorker
        Var nombre: cadena;
        Mostrar "Ingrese su nombre:";
        Leer nombre;
        Mostrar "Bienvenido", nombre;
      FinAlgoritmo
    `;

    // 1. Iniciar ejecución
    const executionPromise = runtime.handleMessage({
      type: 'START_EXECUTION',
      code,
    });

    // Permitir micro-tareas para que alcance el 'Leer'
    await new Promise((r) => setTimeout(r, 20));

    expect(messagesToMain).toContainEqual({
      type: 'PRINT_OUTPUT',
      text: 'Ingrese su nombre:',
    });

    expect(messagesToMain).toContainEqual({
      type: 'WAIT_FOR_INPUT',
      variableName: 'nombre',
      expectedType: 'cadena',
    });

    // 2. Proporcionar input
    await runtime.handleMessage({
      type: 'PROVIDE_INPUT',
      value: 'Carlos',
    });

    await executionPromise;

    expect(messagesToMain).toContainEqual({
      type: 'PRINT_OUTPUT',
      text: 'Bienvenido Carlos',
    });

    const completeMsg = messagesToMain.find((m) => m.type === 'EXECUTION_COMPLETE');
    expect(completeMsg).toBeDefined();
  });

  it('debe cancelar y reportar error de timeout si excede el límite (Execution Guard)', async () => {
    // Simular un mock Worker que simula un bucle infinito que nunca responde
    class MockInfiniteWorker {
      public onmessage: ((e: MessageEvent<WorkerToMainMessage>) => void) | null = null;
      public onerror: ((e: ErrorEvent) => void) | null = null;
      public isTerminated = false;

      public postMessage(msg: MainToWorkerMessage) {
        // En un bucle infinito real en Web Worker, el hilo del worker está ocupado al 100% y no emite mensajes
      }

      public terminate() {
        this.isTerminated = true;
      }
    }

    let mockWorkerInstance: MockInfiniteWorker | null = null;

    const errorPromise = new Promise<{ phase: string; message: string }>((resolve) => {
      const callbacks: ExecutionControllerCallbacks = {
        onPrint: () => {},
        onWaitForInput: () => {},
        onComplete: () => {},
        onError: (err) => resolve(err),
      };

      const controller = new ExecutionController({
        workerFactory: () => {
          mockWorkerInstance = new MockInfiniteWorker() as unknown as Worker;
          return mockWorkerInstance as unknown as Worker;
        },
        callbacks,
        timeoutMs: 80, // Límite corto para el test (80ms)
      });

      controller.run('Mientras Verdadero Hacer FinMientras');
    });

    const errorResult = await errorPromise;
    expect(errorResult.phase).toBe('timeout');
    expect(errorResult.message).toContain('Tiempo de ejecución excedido');
    expect(mockWorkerInstance?.isTerminated).toBe(true);
  });
});
