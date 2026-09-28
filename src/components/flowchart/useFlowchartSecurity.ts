import { useEffect, useRef } from 'react';

export interface UseFlowchartSecurityOptions {
  containerRef: React.RefObject<HTMLDivElement | null>;
  isExamMode: boolean;
  onSecurityReset: () => void;
  onWarning?: (message: string) => void;
}

/**
 * Hook de seguridad académica para el módulo de diagramación DFD.
 * - Bloquea la importación o pegado de diagramas externos.
 * - Solo permite arrastrar nodos desde la barra lateral autorizada.
 * - Resetea el canvas si se pierde el foco en Modo Examen.
 */
export function useFlowchartSecurity({
  containerRef,
  isExamMode,
  onSecurityReset,
  onWarning,
}: UseFlowchartSecurityOptions) {
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const notify = (msg: string) => {
    if (onWarning) onWarning(msg);
  };

  // 1. Borrado efímero ante pérdida de foco en Modo Examen
  useEffect(() => {
    if (!isExamMode) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        onSecurityReset();
      }
    };

    const handleWindowBlur = () => {
      onSecurityReset();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [isExamMode, onSecurityReset]);

  // 2. Bloqueo de pegado y arrastre de archivos externos
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      notify('Pegado de esquemas o imágenes bloqueado. Diseña el diagrama en el lienzo.');
    };

    const handleDrop = (e: DragEvent) => {
      // Si el elemento arrastrado NO proviene de la paleta interna de reactflow
      const isInternal = e.dataTransfer?.types.includes('application/reactflow');
      if (!isInternal) {
        e.preventDefault();
        e.stopPropagation();
        notify('Importación de archivos externos bloqueada.');
      }
    };

    container.addEventListener('paste', handlePaste, true);
    container.addEventListener('drop', handleDrop, true);

    return () => {
      container.removeEventListener('paste', handlePaste, true);
      container.removeEventListener('drop', handleDrop, true);
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [containerRef]);
}
