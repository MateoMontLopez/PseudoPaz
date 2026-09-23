import { useEffect, useRef, useState } from 'react';

export interface UseClipboardGuardOptions {
  enabled?: boolean;
  onViolation?: (action: 'paste' | 'drop' | 'contextmenu') => void;
}

/**
 * Hook para restringir el pegado, arrastrado de texto y menú contextual en el editor,
 * forzando la digitación manual con fines pedagógicos y de evaluación.
 */
export function useClipboardGuard(options: UseClipboardGuardOptions = {}) {
  const { enabled = true, onViolation } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWarning = (action: 'paste' | 'drop' | 'contextmenu') => {
    let msg = 'Acción bloqueada: Debe digitar el código manualmente.';
    if (action === 'contextmenu') {
      msg = 'Menú contextual deshabilitado.';
    }

    setWarningMessage(msg);
    if (onViolation) onViolation(action);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 2800);
  };

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showWarning('paste');
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showWarning('drop');
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showWarning('contextmenu');
    };

    container.addEventListener('paste', handlePaste, true);
    container.addEventListener('drop', handleDrop, true);
    container.addEventListener('dragover', handleDragOver, true);
    container.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      container.removeEventListener('paste', handlePaste, true);
      container.removeEventListener('drop', handleDrop, true);
      container.removeEventListener('dragover', handleDragOver, true);
      container.removeEventListener('contextmenu', handleContextMenu, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled]);

  return {
    containerRef,
    warningMessage,
  };
}
