import { toPng } from 'html-to-image';

export interface CaptureCanvasOptions {
  pixelRatio?: number;
  backgroundColor?: string;
}

/**
 * Captura el contenedor del lienzo React Flow y lo convierte a una imagen PNG en alta resolución (300 DPI).
 */
export async function captureFlowchartCanvas(
  element: HTMLElement | null,
  options: CaptureCanvasOptions = {}
): Promise<string | null> {
  if (!element) return null;

  try {
    // Buscar el viewport de React Flow
    const flowViewport = element.querySelector('.react-flow__viewport') as HTMLElement | null;
    const targetElement = flowViewport || element;

    // Filtro para excluir controles de zoom o advertencias de la captura
    const filter = (node: HTMLElement) => {
      if (node.classList && typeof node.classList.contains === 'function') {
        if (
          node.classList.contains('react-flow__controls') ||
          node.classList.contains('react-flow__panel') ||
          node.classList.contains('react-flow__attribution')
        ) {
          return false;
        }
      }
      return true;
    };

    const dataUrl = await toPng(targetElement, {
      quality: 0.98,
      pixelRatio: options.pixelRatio ?? 2.5, // Alta resolución para impresión en PDF
      backgroundColor: options.backgroundColor ?? '#ffffff',
      filter: filter as (domNode: Node) => boolean,
    });

    return dataUrl;
  } catch (error) {
    console.error('Error al capturar el lienzo de diagrama de flujo:', error);
    return null;
  }
}
