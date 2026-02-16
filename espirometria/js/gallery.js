// js/gallery.js
let state = {
  list: [],
  idx: 0,
  isOpen: false,
};

export function initModal(){
  const modal = document.getElementById('modal');
  const modalImg = document.getElementById('modalImg');
  const closeBtn = document.getElementById('modalClose');

  const close = () => {
    state.isOpen = false;
    modal.classList.remove('isOpen');
    modal.setAttribute('aria-hidden','true');
    modalImg.src = '';
  };

  closeBtn.addEventListener('click', close);

  // Click fuera cierra
  modal.addEventListener('click', (e)=>{
    if (e.target === modal) close();
  });

  // Teclado: solo si modal abierto
  document.addEventListener('keydown', (e)=>{
    if (!state.isOpen) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowRight') show(state.idx + 1);
    if (e.key === 'ArrowLeft') show(state.idx - 1);
  });

  // Swipe (móvil/tablet)
  let startX = null;
  modal.addEventListener('touchstart', (e)=>{
    if (!state.isOpen) return;
    startX = e.touches[0]?.clientX ?? null;
  }, {passive:true});

  modal.addEventListener('touchend', (e)=>{
    if (!state.isOpen || startX === null) return;
    const endX = e.changedTouches[0]?.clientX ?? startX;
    const dx = endX - startX;
    startX = null;
    if (Math.abs(dx) < 40) return;
    if (dx < 0) show(state.idx + 1);
    else show(state.idx - 1);
  }, {passive:true});

  function show(nextIdx){
    if (!state.list.length) return;
    const clamped = (nextIdx + state.list.length) % state.list.length;
    state.idx = clamped;
    modalImg.src = state.list[state.idx];
  }

  // Exponer API global mínima
  window.__openImageViewer = (list, startIndex=0) => {
    state.list = list;
    state.idx = Math.max(0, Math.min(startIndex, list.length-1));
    state.isOpen = true;
    modal.classList.add('isOpen');
    modal.setAttribute('aria-hidden','false');
    modalImg.src = state.list[state.idx];
  };

  window.__openSingleImage = (src) => {
    window.__openImageViewer([src], 0);
  };
}