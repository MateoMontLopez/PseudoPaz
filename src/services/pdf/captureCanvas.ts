import { toPng } from 'html-to-image';

export interface CaptureCanvasOptions {
  pixelRatio?: number;
  backgroundColor?: string;
  padding?: number;
}

export interface CaptureFlowchartResult {
  dataUrl: string;
  width: number;
  height: number;
}

/**
 * Calcula el rectángulo envolvente (bounding box) de todos los nodos y aristas de React Flow
 * en coordenadas del espacio no transformado del lienzo.
 */
function calculateFlowchartBounds(viewport: HTMLElement, padding: number) {
  const nodes = viewport.querySelectorAll<HTMLElement>('.react-flow__node');
  if (nodes.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    let x = 0;
    let y = 0;
    const transform = node.style.transform;
    const match = transform.match(
      /translate(?:3d)?\(\s*(-?\d+(?:\.\d+)?)(?:px)?,\s*(-?\d+(?:\.\d+)?)(?:px)?/
    );

    if (match) {
      x = parseFloat(match[1]);
      y = parseFloat(match[2]);
    } else {
      x = node.offsetLeft;
      y = node.offsetTop;
    }

    const w = node.offsetWidth || node.clientWidth || 180;
    const h = node.offsetHeight || node.clientHeight || 90;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + w);
    maxY = Math.max(maxY, y + h);
  });

  // Intentar obtener los límites de las aristas SVG
  const edgesSvg = viewport.querySelector<SVGSVGElement>('.react-flow__edges');
  if (edgesSvg) {
    try {
      const bbox = edgesSvg.getBBox();
      if (bbox.width > 0 && bbox.height > 0) {
        minX = Math.min(minX, bbox.x);
        minY = Math.min(minY, bbox.y);
        maxX = Math.max(maxX, bbox.x + bbox.width);
        maxY = Math.max(maxY, bbox.y + bbox.height);
      }
    } catch {
      // getBBox puede no estar disponible en entornos sin renderizado gráfico completo
    }
  }

  if (minX === Infinity || minY === Infinity) return null;

  const width = Math.max(100, Math.ceil(maxX - minX + padding * 2));
  const height = Math.max(100, Math.ceil(maxY - minY + padding * 2));
  const x = Math.floor(minX - padding);
  const y = Math.floor(minY - padding);

  return { x, y, width, height };
}

/**
 * Captura el diagrama React Flow completo adaptándolo a su Bounding Box real
 * y lo convierte a una imagen PNG en alta resolución (300 DPI) lista para incrustar en PDF.
 */
export async function captureFlowchartCanvas(
  element: HTMLElement | null,
  options: CaptureCanvasOptions = {}
): Promise<CaptureFlowchartResult | null> {
  if (!element) return null;

  try {
    const flowViewport = element.querySelector('.react-flow__viewport') as HTMLElement | null;
    const targetElement = flowViewport || element;

    // Filtro para excluir controles de zoom, paneles flotantes o marcas de agua del DOM
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

    const padding = options.padding ?? 45;
    const bounds = flowViewport ? calculateFlowchartBounds(flowViewport, padding) : null;

    let dataUrl: string;
    let width: number;
    let height: number;

    if (flowViewport && bounds) {
      width = bounds.width;
      height = bounds.height;

      dataUrl = await toPng(flowViewport, {
        quality: 0.98,
        pixelRatio: options.pixelRatio ?? 2.5, // Alta densidad de píxeles para PDF nítido
        backgroundColor: options.backgroundColor ?? '#ffffff',
        width: bounds.width,
        height: bounds.height,
        style: {
          width: `${bounds.width}px`,
          height: `${bounds.height}px`,
          transform: `translate(${-bounds.x}px, ${-bounds.y}px) scale(1)`,
          transformOrigin: '0 0',
        },
        filter: filter as (domNode: Node) => boolean,
      });
    } else {
      width = targetElement.offsetWidth || 800;
      height = targetElement.offsetHeight || 600;

      dataUrl = await toPng(targetElement, {
        quality: 0.98,
        pixelRatio: options.pixelRatio ?? 2.5,
        backgroundColor: options.backgroundColor ?? '#ffffff',
        filter: filter as (domNode: Node) => boolean,
      });
    }

    return {
      dataUrl,
      width,
      height,
    };
  } catch (error) {
    console.error('Error al capturar el lienzo de diagrama de flujo:', error);
    return null;
  }
}
