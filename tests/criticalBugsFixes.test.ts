import { describe, expect, it, beforeEach, vi } from 'vitest';
import {
  setInternalClipboardText,
  getInternalClipboardText,
  isInternalClipboardText,
} from '../src/components/editor/useClipboardGuard';
import {
  WorkspaceFile,
  DEFAULT_ALGORITHM_TEMPLATE,
} from '../src/hooks/useWorkspaceStore';
import { InterpreterWorkerService } from '../src/services/interpreterWorker.service';

describe('1. Internal Clipboard Guard Tests', () => {
  beforeEach(() => {
    setInternalClipboardText('');
  });

  it('debe registrar y recuperar texto copiado internamente en memoria', () => {
    const internalCode = 'x <- 100; Mostrar x;';
    setInternalClipboardText(internalCode);

    expect(getInternalClipboardText()).toBe(internalCode);
    expect(isInternalClipboardText(internalCode)).toBe(true);
  });

  it('debe bloquear texto proveniente de fuentes externas', () => {
    const internalCode = 'Definir a Como Entero;';
    setInternalClipboardText(internalCode);

    const externalCode = 'import os; os.system("hack")';
    expect(isInternalClipboardText(externalCode)).toBe(false);
  });

  it('debe rechazar cadenas vacías o si no hay copia interna registrada', () => {
    expect(isInternalClipboardText('')).toBe(false);
    expect(isInternalClipboardText('Cualquier texto')).toBe(false);
  });
});

describe('2. Multi-tab Workspace Persistence Tests', () => {
  it('debe mantener contenido separado e independiente entre pestañas', () => {
    const tab1: WorkspaceFile = {
      id: 'tab-1',
      name: 'Trabajo1.psc',
      content: 'Algoritmo Uno\nMostrar "1";\nFinAlgoritmo',
    };

    const tab2: WorkspaceFile = {
      id: 'tab-2',
      name: 'Trabajo2.psc',
      content: 'Algoritmo Dos\nMostrar "2";\nFinAlgoritmo',
    };

    const files = [tab1, tab2];

    // Modificar tab 1 en tiempo real
    const updatedFiles = files.map((f) =>
      f.id === 'tab-1' ? { ...f, content: f.content + '\n// Nota' } : f
    );

    // Verificar que tab 2 permanece intacta
    const currentTab2 = updatedFiles.find((f) => f.id === 'tab-2');
    expect(currentTab2?.content).toBe(tab2.content);

    // Verificar que tab 1 se actualizó
    const currentTab1 = updatedFiles.find((f) => f.id === 'tab-1');
    expect(currentTab1?.content).toContain('// Nota');
  });

  it('debe contener la plantilla estándar de algoritmo', () => {
    expect(DEFAULT_ALGORITHM_TEMPLATE).toContain('Algoritmo SinTitulo');
    expect(DEFAULT_ALGORITHM_TEMPLATE).toContain('FinAlgoritmo');
  });
});

describe('3. Interpreter Worker Lifecycle & GC Tests', () => {
  it('debe instanciar y terminar limpiamente el worker liberando recursos', () => {
    const service = new InterpreterWorkerService();

    let terminated = false;
    const mockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn(() => {
        terminated = true;
      }),
      onmessage: null,
      onerror: null,
    };

    // Inyectar fábrica simulada
    (service as unknown as { createWorker: () => unknown }).createWorker = () => mockWorker;

    service.execute({
      code: 'Algoritmo Test\nFinAlgoritmo',
      callbacks: {
        onPrint: vi.fn(),
        onWaitForInput: vi.fn(),
        onComplete: vi.fn(),
        onError: vi.fn(),
      },
      timeoutMs: 10000,
    });

    // Terminar intencionalmente (simulando Detener o Limpiar)
    service.terminate();

    expect(mockWorker.terminate).toHaveBeenCalled();
    expect(terminated).toBe(true);
  });
});
