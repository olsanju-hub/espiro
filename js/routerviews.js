// js/routerViews.js
export function renderPortada(root, router){
  root.classList.add('view');
  root.innerHTML = `
    <section class="cover">
      <div class="cover-left">
        <h1 class="cover-title">ESPIROMETRÍA</h1>
        <div class="hrline"></div>
        <div class="cover-sub">Interpretación AP</div>
        <div class="cover-author">Guillermo José Olivero Sanjuanelo</div>
        <div class="cover-btnwrap">
          <button class="primary-btn" type="button" id="toMenu">Entrar</button>
        </div>
      </div>
      <div class="cover-right">
        <img src="assets/images/pulmon.png" alt="Pulmón" />
      </div>
    </section>
  `;
  root.querySelector('#toMenu').addEventListener('click', () => router.go('menu'));
}

export function renderMenu(root, router){
  root.innerHTML = `
    <section class="menu">
      <div class="card menu-card">
        <div class="menu-title">
          <h2>Espirometría</h2>
          <div class="hrline"></div>
        </div>
        <img class="menu-lung" src="assets/images/pulmon.png" alt="Pulmón" />
        <div class="menu-btns">
          <button class="menu-btn" data-go="presentacion" type="button">Presentación</button>
          <button class="menu-btn" data-go="tecnica" type="button">Técnica</button>
          <button class="menu-btn" data-go="algoritmo" type="button">Algoritmo</button>
          <button class="menu-btn" data-go="simulador" type="button">Simulador</button>
          <button class="menu-btn" data-go="evaluacion" type="button">Evaluación</button>
        </div>
      </div>
    </section>
  `;
  root.querySelectorAll('[data-go]').forEach(btn=>{
    btn.addEventListener('click', () => router.go(btn.dataset.go));
  });
}