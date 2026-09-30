export interface ServiceWorkerRegistrationOptions {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (error: unknown) => void;
}

/**
 * Registra el Service Worker de la PWA para habilitar soporte offline 100% autónomo.
 * En modo desarrollo local (Vite dev) se desactiva para no interferir con HMR (Hot Module Replacement).
 * En producción se registra automáticamente contra `/sw.js`.
 */
export function registerServiceWorker(options: ServiceWorkerRegistrationOptions = {}): (() => void) | undefined {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  // En desarrollo local no registramos el SW para permitir HMR fluido y evitar conflictos de caché
  if (import.meta.env.DEV) {
    console.debug('[PWA] Service Worker omitido en entorno de desarrollo local (HMR activo).');
    return undefined;
  }

  const register = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (installingWorker.state === 'installed') {
            if (navigator.serviceWorker.controller) {
              // Hay una nueva versión lista
              options.onNeedRefresh?.();
            } else {
              // Contenido precacheado listo para uso offline
              options.onOfflineReady?.();
            }
          }
        });
      });

      options.onRegistered?.(registration);
    } catch (error) {
      options.onRegisterError?.(error);
    }
  };

  if (document.readyState === 'complete') {
    void register();
  } else {
    window.addEventListener('load', () => void register());
  }

  return () => {
    void navigator.serviceWorker.getRegistration().then((reg) => reg?.update());
  };
}
