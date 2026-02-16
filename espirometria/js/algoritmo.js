// js/algoritmo.js
export function renderAlgoritmo(root){
  root.innerHTML = `
    <div class="section-title">
      <h2>Algoritmo</h2>
      <span class="badge">Imagen</span>
    </div>
    <div class="hrline"></div>

    <div class="card alg-wrap">
      <p class="muted">Click para ampliar.</p>
      <img id="algoImg" src="assets/algoritmo/algoritmo.png" alt="Algoritmo de interpretación" />
    </div>
  `;

  root.querySelector('#algoImg').addEventListener('click', ()=>{
    window.__openSingleImage('assets/algoritmo/algoritmo.png');
  });
}