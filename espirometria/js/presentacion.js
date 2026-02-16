// js/presentacion.js
import { pad3, clamp } from './utils.js';
import { initDiscurso } from './discurso.js';

export function initPresentacion(router){
  const presenter = document.getElementById('presenter');
  const slideImg = document.getElementById('slideImg');
  const slideCounter = document.getElementById('slideCounter');

  const backBtn = document.getElementById('presentBack');
  const discBtn = document.getElementById('discBtn');

  const disc = initDiscurso();

  const TOTAL = 17;
  let idx = 1;
  let isOpen = false;

  function srcFor(i){
    return `assets/slides/${pad3(i)}.webp`;
  }

  async function open(){
    isOpen = true;
    presenter.classList.add('isOpen');
    presenter.setAttribute('aria-hidden','false');

    // Fullscreen real si se puede (si falla, no bloquea)
    try{
      if (!document.fullscreenElement){
        await presenter.requestFullscreen();
      }
    }catch(_){}

    idx = 1;
    render();
  }

  async function close(){
    isOpen = false;
    disc.close();
    presenter.classList.remove('isOpen');
    presenter.setAttribute('aria-hidden','true');

    try{
      if (document.fullscreenElement){
        await document.exitFullscreen();
      }
    }catch(_){}

    router.go('menu');
  }

  function render(){
    slideImg.src = srcFor(idx);
    slideCounter.textContent = `${pad3(idx)} / ${pad3(TOTAL)}`;

    // Sincroniza SIEMPRE tras actualizar idx
    // (y no depende de que el panel esté abierto)
    disc.setSlide(idx);
  }

  function next(){
    idx = clamp(idx + 1, 1, TOTAL);
    render();
  }
  function prev(){
    idx = clamp(idx - 1, 1, TOTAL);
    render();
  }

  // Teclado (solo si abierto)
  document.addEventListener('keydown', (e)=>{
    if (!isOpen) return;

    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); next(); return; }
    if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); prev(); return; }
  });

  // Swipe
  let startX = null;
  presenter.addEventListener('touchstart', (e)=>{
    if (!isOpen) return;
    startX = e.touches[0]?.clientX ?? null;
  }, {passive:true});

  presenter.addEventListener('touchend', (e)=>{
    if (!isOpen || startX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX;
    const dx = endX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) next();
    else prev();
  }, {passive:true});

  backBtn.addEventListener('click', close);

  discBtn.addEventListener('click', async ()=>{
    // Si abres discurso por primera vez y había caché vieja, fuerza recarga
    // (sin romper si ya está cargado)
    try{ await disc.reload(); }catch(_){}
    disc.toggle();
  });

  // Hook router para abrir overlay
  const origGo = router.go.bind(router);
  router.go = (r)=>{
    if (r === 'presentacion'){
      open();
      return;
    }
    origGo(r);
  };
}