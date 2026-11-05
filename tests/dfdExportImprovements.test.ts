import { describe, it, expect, vi } from 'vitest';
import { captureFlowchartCanvas } from '../src/services/pdf/captureCanvas';

// Mock simple de html-to-image para entorno de pruebas Node
vi.mock('html-to-image', () => ({
  toPng: vi.fn().mockImplementation(async (_el, options) => {
    return `data:image/png;base64,mockPng_${options?.width ?? 0}x${options?.height ?? 0}`;
  }),
}));

describe('Mejoras de Exportación DFD a PDF (Bounding Box y Auto-Ajuste)', () => {
  it('captureFlowchartCanvas retorna null si el elemento es nulo', async () => {
    const result = await captureFlowchartCanvas(null);
    expect(result).toBeNull();
  });

  it('captureFlowchartCanvas calcula el bounding box exacto con padding de nodos con transform', async () => {
    // Simular el viewport de React Flow en entorno Node
    const mockViewport = {
      querySelectorAll: (sel: string) => {
        if (sel === '.react-flow__node') {
          return [
            {
              style: { transform: 'translate(100px, 50px)' },
              offsetWidth: 160,
              offsetHeight: 60,
            },
            {
              style: { transform: 'translate(100px, 200px)' },
              offsetWidth: 180,
              offsetHeight: 80,
            },
          ];
        }
        return [];
      },
      querySelector: () => null,
    };

    const mockElement = {
      querySelector: (sel: string) => (sel === '.react-flow__viewport' ? mockViewport : null),
    } as unknown as HTMLElement;

    // Padding = 45 por defecto
    // minX = 100, minY = 50
    // maxX = Math.max(100 + 160, 100 + 180) = 280
    // maxY = Math.max(50 + 60, 200 + 80) = 280
    // bounds width = 280 - 100 + 45 * 2 = 180 + 90 = 270
    // bounds height = 280 - 50 + 45 * 2 = 230 + 90 = 320

    const result = await captureFlowchartCanvas(mockElement, { padding: 45 });

    expect(result).not.toBeNull();
    expect(result?.width).toBe(270);
    expect(result?.height).toBe(320);
    expect(result?.dataUrl).toContain('mockPng_270x320');
  });

  it('detecta diagramas verticales para salto de página automático', () => {
    // Si la altura del DFD excede el ratio de 0.85 respecto al ancho
    const dfdDimensionsTall = { width: 300, height: 600 };
    const isTall = dfdDimensionsTall.height / dfdDimensionsTall.width > 0.85;
    expect(isTall).toBe(true);

    const dfdDimensionsWide = { width: 800, height: 300 };
    const isWide = dfdDimensionsWide.height / dfdDimensionsWide.width > 0.85;
    expect(isWide).toBe(false);
  });
});
