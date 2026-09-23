import { useEffect, useState, useCallback, useRef } from 'react';

export interface UseSessionGuardOptions {
  onSessionReset: () => void;
  initialEnabled?: boolean;
}

/**
 * Hook para la detección de pérdida de foco y borrado efímero de sesión (Modo Examen / Integridad).
 * Si el estudiante cambia de pestaña o minimiza el navegador, se borra el código y la consola.
 */
export function useSessionGuard(options: UseSessionGuardOptions) {
  const { onSessionReset, initialEnabled = false } = options;
  const [isEnabled, setIsEnabled] = useState<boolean>(initialEnabled);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerReset = useCallback(() => {
    onSessionReset();
    setToastMessage('⚠️ Sesión limpiada por pérdida de foco');

    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  }, [onSessionReset]);

  useEffect(() => {
    if (!isEnabled) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        triggerReset();
      }
    };

    const handleWindowBlur = () => {
      triggerReset();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    };
  }, [isEnabled, triggerReset]);

  const toggleGuard = useCallback(() => {
    setIsEnabled((prev) => !prev);
  }, []);

  return {
    isGuardEnabled: isEnabled,
    toggleGuard,
    toastMessage,
    clearToast: () => setToastMessage(null),
  };
}
