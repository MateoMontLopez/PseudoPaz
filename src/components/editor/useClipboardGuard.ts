import { useEffect, useRef, useState, useCallback } from 'react';

// Variable en memoria a nivel de sesión para registrar texto copiado internamente
let internalClipboardText: string = '';

export function setInternalClipboardText(text: string): void {
  internalClipboardText = text;
}

export function getInternalClipboardText(): string {
  return internalClipboardText;
}

export function isInternalClipboardText(text: string): boolean {
  if (!text || !internalClipboardText) return false;
  return text.trim() === internalClipboardText.trim();
}

export interface UseClipboardGuardOptions {
  enabled?: boolean;
  onPasteInternal?: (text: string) => void;
  onViolation?: (action: 'paste' | 'drop' | 'contextmenu', message?: string) => void;
}

/**
 * Hook para el control estricto del portapapeles (Internal Clipboard Guard):
 * - Permite copiar y pegar código creado DENTRO de la misma interfaz/sesión.
 * - Bloquea la entrada de código proveniente de fuentes EXTERNAS al navegador.
 * - Muestra una advertencia discreta ante intentos de pegado externo.
 */
export function useClipboardGuard(options: UseClipboardGuardOptions = {}) {
  const { enabled = true, onPasteInternal, onViolation } = options;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showWarning = useCallback((action: 'paste' | 'drop' | 'contextmenu', customMsg?: string) => {
    const msg = customMsg || (action === 'contextmenu'
      ? 'Menú contextual deshabilitado en esta sesión.'
      : 'Pegado externo no permitido en esta sesión.');

    setWarningMessage(msg);
    if (onViolation) onViolation(action, msg);

    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 2800);
  }, [onViolation]);

  useEffect(() => {
    if (!enabled) return;

    const container = containerRef.current;
    if (!container) return;

    // 1. Interceptar Copiar y Cortar para registrar el texto interno
    const handleCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString() || '';
      if (selection) {
        setInternalClipboardText(selection);
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', selection);
          e.clipboardData.setData('application/x-pseudopaz-internal', 'true');
          e.preventDefault();
        }
      }
    };

    const handleCut = (e: ClipboardEvent) => {
      const selection = window.getSelection()?.toString() || '';
      if (selection) {
        setInternalClipboardText(selection);
        if (e.clipboardData) {
          e.clipboardData.setData('text/plain', selection);
          e.clipboardData.setData('application/x-pseudopaz-internal', 'true');
        }
      }
    };

    // 2. Interceptar Pegado y validar procedencia
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      e.stopPropagation();

      const pastedText = e.clipboardData?.getData('text/plain') || '';
      const hasInternalMeta = e.clipboardData?.getData('application/x-pseudopaz-internal') === 'true';
      const isInternal = hasInternalMeta || isInternalClipboardText(pastedText);

      if (isInternal && pastedText) {
        // Procedencia interna autorizada: insertar en el cursor
        if (onPasteInternal) {
          onPasteInternal(pastedText);
        }
      } else {
        // Procedencia externa no autorizada: bloquear
        showWarning('paste', 'Pegado externo no permitido en esta sesión');
      }
    };

    // 3. Bloquear arrastre de texto externo
    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      showWarning('drop', 'Arrastrar texto externo está deshabilitado en esta sesión');
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    // 4. Menú contextual
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      showWarning('contextmenu');
    };

    container.addEventListener('copy', handleCopy, true);
    container.addEventListener('cut', handleCut, true);
    container.addEventListener('paste', handlePaste, true);
    container.addEventListener('drop', handleDrop, true);
    container.addEventListener('dragover', handleDragOver, true);
    container.addEventListener('contextmenu', handleContextMenu, true);

    return () => {
      container.removeEventListener('copy', handleCopy, true);
      container.removeEventListener('cut', handleCut, true);
      container.removeEventListener('paste', handlePaste, true);
      container.removeEventListener('drop', handleDrop, true);
      container.removeEventListener('dragover', handleDragOver, true);
      container.removeEventListener('contextmenu', handleContextMenu, true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [enabled, onPasteInternal, showWarning]);

  return {
    containerRef,
    warningMessage,
  };
}
