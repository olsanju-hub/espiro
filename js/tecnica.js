// js/tecnica.js
export function renderTecnica(root){
  root.innerHTML = `
    <div class="section-title">
      <h2>Técnica</h2>
      <span class="badge">Procedimiento + uso de app</span>
    </div>
    <div class="hrline"></div>

    <div class="card">
      <h3>Instrucciones de uso de la app</h3>
      <p class="muted">Qué hace cada módulo y cómo navegar.</p>
      <ul>
        <li><strong>Presentación</strong>: visor a pantalla completa. Teclado (←/→/Espacio) y swipe en móvil. Discurso opcional por diapositiva.</li>
        <li><strong>Técnica</strong>: procedimiento detallado + galería de imágenes (zoom). En escritorio/tablet: teclado ←/→ dentro del visor; en móvil: swipe. Cierre con ✕.</li>
        <li><strong>Algoritmo</strong>: solo el algoritmo visual (imagen). Click para ampliar.</li>
        <li><strong>Simulador</strong>: introduces datos de una espirometría y la app te devuelve patrón, gravedad, PBD y recordatorios prácticos.</li>
        <li><strong>Evaluación</strong>: casos aleatorios infinitos. Tú respondes patrón/PBD/gravedad y la app corrige.</li>
      </ul>
      <p class="small">Navegación: en vistas internas tienes menú lateral (☰). No aparece en portada, menú ni presentación.</p>
    </div>

    <div class="card" style="margin-top:14px;">
      <h3>Procedimiento (espirometría forzada)</h3>
      <p class="muted">Resumen operativo basado en tus guías (IPCRG / Arch Bronconeumol / consenso). Ajusta al equipo local.</p>

      <h4>Antes de empezar</h4>
      <ul>
        <li>Registrar <strong>talla, peso, edad</strong> (y verificar datos introducidos en el equipo).</li>
        <li>Paciente <strong>sentado erguido</strong>, sin cruzar piernas, sin ropa ajustada; apoyar espalda y evitar inclinarse durante la maniobra.</li>
        <li>Comprobar <strong>calibración/verificación</strong> del equipo en el día; introducir temperatura/presión/humedad si aplica.</li>
        <li>Boquilla bien sellada, lengua sin obstruir la abertura; instrucciones claras y demostración si es necesario.</li>
      </ul>

      <h4>Ejecución de la maniobra</h4>
      <ol>
        <li>Inspirar todo el aire posible hasta capacidad pulmonar total (pausa breve &lt;1 s si procede).</li>
        <li>Iniciar espiración <strong>rápida y fuerte</strong> (inicio explosivo, sin vacilación; idealmente &lt;2 s entre fin de inspiración e inicio de soplado).</li>
        <li>Continuar espiración <strong>sin parar</strong> hasta vaciar lo máximo posible (evitar terminación temprana); si se hace curva inspiratoria, inspirar enérgicamente hasta TLC sin retirar boquilla.</li>
        <li>Repetir hasta conseguir mínimo <strong>3 maniobras aceptables</strong> y al menos <strong>2 reproducibles</strong>.</li>
      </ol>

      <h4>Aceptabilidad y reproducibilidad (calidad)</h4>
      <ul>
        <li>Curva descendente suave y continua: sin tos, sin fugas, sin cierre de glotis, sin respiraciones adicionales.</li>
        <li>Finalización adecuada: meseta/terminación correcta; evitar prolongar más de lo necesario (referencias aceptan hasta 15 s en algunos protocolos).</li>
        <li>Reproducibilidad: diferencia entre las 2 mejores mediciones de FEV1 y FVC dentro de márgenes (habitualmente ≤150 ml).</li>
      </ul>

      <h4>Contraindicaciones (orientativo)</h4>
      <div class="grid2">
        <div class="card">
          <h4>Relativas</h4>
          <ul>
            <li>Falta de comprensión/colaboración.</li>
            <li>Problemas bucodentales/faciales que impidan sellado.</li>
            <li>Náuseas con la boquilla.</li>
            <li>Dolor torácico importante que impida el esfuerzo.</li>
            <li>Traqueostomía (si se considera necesaria, derivar a centro especializado).</li>
          </ul>
        </div>
        <div class="card">
          <h4>Absolutas (ejemplos)</h4>
          <ul>
            <li>Neumotórax activo o reciente.</li>
            <li>Hemoptisis activa o reciente.</li>
            <li>Enfermedad cardiovascular inestable (angina/IM/TEP).</li>
            <li>Aneurisma torácico/abdominal/cerebral.</li>
            <li>Cirugía torácica/abdominal reciente; desprendimiento de retina o cirugía ocular reciente.</li>
          </ul>
        </div>
      </div>

      <h4>Abstinencia de broncodilatadores (si el objetivo es diagnóstico)</h4>
      <ul>
        <li>SABA/SAMA: 6 h · LABA: 12 h · Ultra-LABA: 24 h</li>
        <li>LAMA: 24 h · Teofilinas retardadas: 36–48 h</li>
      </ul>
    </div>

    <div class="card" style="margin-top:14px;">
      <h3>Imágenes de técnica (zoom)</h3>
      <p class="muted">Abre una imagen para verla en grande. En escritorio/tablet: ←/→. En móvil: swipe.</p>
      <div class="thumb-grid" id="techGrid"></div>
    </div>
  `;

  // Crear thumbs 001-017 en assets/tech
  const techGrid = root.querySelector('#techGrid');
  const list = [];
  for (let i=1; i<=17; i++){
    const n = String(i).padStart(3,'0');
    list.push(`assets/tech/${n}.png`);
  }

  techGrid.innerHTML = list.map((src, idx)=>`
    <div class="thumb" data-idx="${idx}">
      <img src="${src}" alt="Técnica ${String(idx+1).padStart(3,'0')}" loading="lazy" />
    </div>
  `).join('');

  techGrid.querySelectorAll('.thumb').forEach(t=>{
    t.addEventListener('click', ()=>{
      const idx = Number(t.dataset.idx || 0);
      window.__openImageViewer(list, idx);
    });
  });
}