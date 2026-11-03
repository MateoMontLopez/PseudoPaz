import { describe, it, expect } from 'vitest';
import { WorkerRuntime } from '../src/engine/worker/interpreter.worker';
import { WorkerToMainMessage } from '../src/engine/worker/worker.protocol';
import { ConsoleOutputItem } from '../src/hooks/usePseudocodeRunner';
import { pseudocodeCompletionSource } from '../src/components/editor/pseudocodeAutocomplete';
import { CompletionContext } from '@codemirror/autocomplete';

/**
 * Simula la lógica de agregación y concatenación de la terminal activa
 * que implementa `usePseudocodeRunner.ts`.
 */
class TerminalBufferSimulator {
  public outputs: ConsoleOutputItem[] = [];
  public activeLineId: string | null = null;

  public handleStdout(text: string, sinSaltar?: boolean): void {
    const isSinSaltar = Boolean(sinSaltar);

    if (this.activeLineId !== null) {
      const activeId = this.activeLineId;
      const targetIndex = this.outputs.findIndex((item) => item.id === activeId);

      if (targetIndex !== -1) {
        this.outputs[targetIndex] = {
          ...this.outputs[targetIndex],
          text: this.outputs[targetIndex].text + text,
        };

        if (!isSinSaltar) {
          this.activeLineId = null;
        }
        return;
      } else {
        this.activeLineId = null;
      }
    }

    const newItem: ConsoleOutputItem = {
      id: `out_${this.outputs.length + 1}`,
      type: 'stdout',
      text,
      timestamp: '12:00:00',
    };

    this.outputs.push(newItem);

    if (isSinSaltar) {
      this.activeLineId = newItem.id;
    } else {
      this.activeLineId = null;
    }
  }

  public handleSystem(text: string): void {
    this.activeLineId = null;
    this.outputs.push({
      id: `sys_${this.outputs.length + 1}`,
      type: 'system',
      text,
      timestamp: '12:00:00',
    });
  }
}

describe('Terminal I/O - Formateo Alineado y Soporte Tabular', () => {
  it('debe concatenar salidas consecutivas de Escribir Sin Saltar en el mismo bloque y cerrarlo con Escribir ""', async () => {
    const messagesToMain: WorkerToMainMessage[] = [];
    const runtime = new WorkerRuntime((msg) => {
      messagesToMain.push(msg);
    });

    const terminal = new TerminalBufferSimulator();

    const code = `
      Algoritmo MatrizLineal
        Dimension M[3, 3];
        Para i <- 1 Hasta 3 Con Paso 1 Hacer
          Para j <- 1 Hasta 3 Con Paso 1 Hacer
            M[i, j] <- i * 10 + j;
            Escribir Sin Saltar "[", M[i, j], "] ";
          FinPara
          Escribir "";
        FinPara
      FinAlgoritmo
    `;

    await runtime.handleMessage({
      type: 'START_EXECUTION',
      code,
    });

    // Procesar todos los mensajes en el buffer de la terminal
    for (const msg of messagesToMain) {
      if (msg.type === 'PRINT_OUTPUT') {
        terminal.handleStdout(msg.text, msg.sinSaltar);
      }
    }

    // Deben haberse generado exactamente 3 bloques de línea (una por fila de la matriz)
    // en lugar de 9 bloques individuales separados
    expect(terminal.outputs.length).toBe(3);

    // Fila 1: columnas concatenadas en la misma línea
    expect(terminal.outputs[0].text).toBe('[ 11 ] [ 12 ] [ 13 ] ');
    // Fila 2
    expect(terminal.outputs[1].text).toBe('[ 21 ] [ 22 ] [ 23 ] ');
    // Fila 3
    expect(terminal.outputs[2].text).toBe('[ 31 ] [ 32 ] [ 33 ] ');

    // Verificar que todas las filas tengan la misma longitud para alineación monoespaciada
    expect(terminal.outputs[0].text.length).toBe(terminal.outputs[1].text.length);
    expect(terminal.outputs[1].text.length).toBe(terminal.outputs[2].text.length);
  });

  it('debe admitir sintaxis sufija (Escribir ... Sin Saltar) y comando directo (SinSaltar)', async () => {
    const messagesToMain: WorkerToMainMessage[] = [];
    const runtime = new WorkerRuntime((msg) => {
      messagesToMain.push(msg);
    });

    const terminal = new TerminalBufferSimulator();

    const code = `
      Algoritmo SintaxisVariantes
        Escribir "Col1 " Sin Saltar;
        SinSaltar "Col2 ";
        Escribir "Col3";
        Escribir "Fila2";
      FinAlgoritmo
    `;

    await runtime.handleMessage({
      type: 'START_EXECUTION',
      code,
    });

    for (const msg of messagesToMain) {
      if (msg.type === 'PRINT_OUTPUT') {
        terminal.handleStdout(msg.text, msg.sinSaltar);
      }
    }

    expect(terminal.outputs.length).toBe(2);
    expect(terminal.outputs[0].text).toBe('Col1 Col2 Col3');
    expect(terminal.outputs[1].text).toBe('Fila2');
  });

  it('los mensajes del sistema deben reiniciar cualquier línea activa previa', () => {
    const terminal = new TerminalBufferSimulator();

    terminal.handleStdout('Texto en progreso... ', true);
    expect(terminal.activeLineId).not.toBeNull();

    terminal.handleSystem('Alerta de sistema');
    expect(terminal.activeLineId).toBeNull();

    terminal.handleStdout('Nueva línea');
    expect(terminal.outputs.length).toBe(3);
    expect(terminal.outputs[0].text).toBe('Texto en progreso... ');
    expect(terminal.outputs[1].text).toBe('Alerta de sistema');
    expect(terminal.outputs[2].text).toBe('Nueva línea');
  });

  it('debe incluir sugerencias de autocompletado para Sin Saltar y Escribir Sin Saltar', () => {
    const mockContext = {
      matchBefore: () => ({ from: 0, to: 3, text: 'sin' }),
      explicit: false,
    } as unknown as CompletionContext;

    const result = pseudocodeCompletionSource(mockContext);
    expect(result).not.toBeNull();
    const labels = (result as any).options.map((opt: any) => opt.label);
    expect(labels).toContain('Sin Saltar');
    expect(labels).toContain('SinSaltar');
  });
});

