// js/pwa.js
export function initPWA(){
  // Registrar SW solo en contextos correctos
  if (!('serviceWorker' in navigator)) return;

  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const isSecure = location.protocol === 'https:' || isLocal;

  if (!isSecure) return;

  window.addEventListener('load', async ()=>{
    try{
      const reg = await navigator.serviceWorker.register('./sw.js', { scope: './' });

      // Si hay update, forzar activación
      reg.addEventListener('updatefound', ()=>{
        const sw = reg.installing;
        if (!sw) return;
        sw.addEventListener('statechange', ()=>{
          if (sw.state === 'installed' && navigator.serviceWorker.controller){
            // Hay nueva versión lista: recarga “limpia”
            sw.postMessage({ type:'SKIP_WAITING' });
          }
        });
      });

      // Cuando cambie controller, recargar
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', ()=>{
        if (refreshing) return;
        refreshing = true;
        location.reload();
      });

    }catch(_){
      // en dev no pasa nada si falla
    }
  });
}