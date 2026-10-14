import { useState, useEffect, useCallback } from 'react';

export function useServiceWorkerUpdate() {
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [hasCachedData, setHasCachedData] = useState(false);

  useEffect(() => {
    // 1. Verifica se existem caches locais preenchidos
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches.keys().then(async (keys) => {
        let itemsCount = 0;
        for (const key of keys) {
          const cache = await caches.open(key);
          const reqs = await cache.keys();
          itemsCount += reqs.length;
        }
        setHasCachedData(itemsCount > 3);
      }).catch(() => {
        setHasCachedData(false);
      });
    }

    // 2. Registro e monitoramento do Service Worker
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });

    navigator.serviceWorker.ready.then((registration) => {
      // Se já houver um worker esperando ativação
      if (registration.waiting) {
        setWaitingWorker(registration.waiting);
        setHasUpdate(true);
      }

      // Escuta detecção de novos updates
      registration.addEventListener('updatefound', () => {
        const installingWorker = registration.installing;
        if (!installingWorker) return;

        installingWorker.addEventListener('statechange', () => {
          if (
            installingWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            setWaitingWorker(installingWorker);
            setHasUpdate(true);
          }
        });
      });
    }).catch(() => {});
  }, []);

  const updateApp = useCallback(() => {
    if (waitingWorker) {
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    }
  }, [waitingWorker]);

  return {
    hasUpdate,
    updateApp,
    hasCachedData,
  };
}
