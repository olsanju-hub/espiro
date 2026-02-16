// js/drawer.js
export function initDrawer(router){
  const drawer = document.getElementById('drawer');
  const btn = document.getElementById('drawerBtn');

  const open = () => { drawer.classList.add('isOpen'); drawer.setAttribute('aria-hidden','false'); };
  const close = () => { drawer.classList.remove('isOpen'); drawer.setAttribute('aria-hidden','true'); };

  btn?.addEventListener('click', () => {
    drawer.classList.contains('isOpen') ? close() : open();
  });

  // Cerrar al click fuera (solo si está abierto)
  document.addEventListener('click', (e) => {
    if (!drawer.classList.contains('isOpen')) return;
    const within = drawer.contains(e.target) || btn.contains(e.target);
    if (!within) close();
  });

  drawer.querySelectorAll('.drawer-link').forEach(b=>{
    b.addEventListener('click', ()=>{
      close();
      router.go(b.dataset.go);
    });
  });

  // Esc
  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') close();
  });
}