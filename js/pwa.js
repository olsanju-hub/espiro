// js/pwa.js
export function initPWA() {
  if (!('serviceWorker' in navigator)) return;

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });

      // Pide update al entrar (sin que el usuario haga hard refresh)
      try { await reg.update(); } catch (_) {}

      // Si encuentra SW nuevo, lo activa y recarga
      reg.addEventListener('updatefound', () => {
        const sw = reg.installing;
        if (!sw) return;

        sw.addEventListener('statechange', () => {
          if (sw.state === 'installed') {
            // Si ya había controller -> hay update
            if (navigator.serviceWorker.controller) {
              try { sw.postMessage({ type: 'SKIP_WAITING' }); } catch (_) {}
            }
          }
        });
      });

      let reloaded = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (reloaded) return;
        reloaded = true;
        window.location.reload();
      });

    } catch (e) {
      // si falla, no rompe la app
      console.warn('PWA init error', e);
    }
  });
}
