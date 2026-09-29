import { registerSW } from 'virtual:pwa-register';

export interface ServiceWorkerRegistrationOptions {
  onNeedRefresh?: () => void;
  onOfflineReady?: () => void;
  onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void;
  onRegisterError?: (error: unknown) => void;
}

/**
 * Registra el Service Worker de la PWA para habilitar soporte offline 100% autónomo.
 */
export function registerServiceWorker(options: ServiceWorkerRegistrationOptions = {}): (() => void) | undefined {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return undefined;
  }

  try {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (options.onNeedRefresh) {
          options.onNeedRefresh();
        }
      },
      onOfflineReady() {
        if (options.onOfflineReady) {
          options.onOfflineReady();
        }
      },
      onRegisteredSW(_swUrl, r) {
        if (options.onRegistered) {
          options.onRegistered(r);
        }
      },
      onRegisterError(error) {
        if (options.onRegisterError) {
          options.onRegisterError(error);
        }
      },
    });

    return updateSW;
  } catch (err) {
    if (options.onRegisterError) {
      options.onRegisterError(err);
    }
    return undefined;
  }
}
