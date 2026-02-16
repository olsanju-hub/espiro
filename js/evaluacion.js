// js/evaluacion.js
import { clamp } from './utils.js';

export function renderEvaluacion(root){
  root.innerHTML = `
    <div class="section-title">
      <h2>Evaluación</h2>
      <span class="badge">Casos infinitos</span>
    </div>
    <div class="hrline"></div>

    <div class="card">
      <div class="action-row">
        <button class="btn primary" type="button" id="newCase">Nuevo caso</button>
      </div>

      <div class="card" style="margin-top:12px;">
        <h3>Datos</h3>
        <div id="caseBox" class="result warn">Pulsa “Nuevo caso”.</div>
      </div>

      <div class="card" style="margin-top:12px;">
        <h3>Tu respuesta</h3>
        <div class="row2">
          <div class="field">
            <label>Patrón</label>
            <select id="ansPattern">
              <option value="normal">Normal</option>
              <option value="obstructivo">Obstructivo</option>
              <option value="restrictivo">Restrictivo</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>
          <div class="field">
            <label>PBD</label>
            <select id="ansPbd">
              <option value="pos">Positiva</option>
              <option value="neg">No positiva</option>
            </select>
          </div>
        </div>

        <div class="field">
          <label>Gravedad (si obstructivo/mixto)</label>
          <select id="ansSev">
            <option value="na">No aplica / no sé</option>
            <option value="leve">Leve</option>
            <option value="moderada">Moderada</option>
            <option value="grave">Grave</option>
            <option value="muygrave">Muy grave</option>
          </select>
        </div>

        <div class="action-row">
          <button class="btn" type="button" id="check">Corregir</button>
        </div>

        <div id="feedback" class="result warn" style="margin-top:12px;">—</div>
      </div>
    </div>
  `;

  const caseBox = root.querySelector('#caseBox');
  const feedback = root.querySelector('#feedback');

  let current = null;

  root.querySelector('#newCase').addEventListener('click', ()=>{
    current = genCase();

    caseBox.className = 'result';
    caseBox.innerHTML = `
      <div><strong>FEV1 pre:</strong> ${current.fev1Pre.toFixed(2)} L</div>
      <div><strong>FVC pre:</strong> ${current.fvcPre.toFixed(2)} L</div>
      <div><strong>FEV1/FVC pre:</strong> ${current.ratioPre.toFixed(2)}</div>

      <div style="margin-top:8px;"><strong>FEV1 post:</strong> ${current.fev1Post.toFixed(2)} L</div>
      <div><strong>FVC post:</strong> ${current.fvcPost.toFixed(2)} L</div>
      <div><strong>FEV1/FVC post:</strong> ${current.ratioPost.toFixed(2)}</div>

      <div style="margin-top:8px;"><strong>FEV1% pred:</strong> ${current.fev1Pct.toFixed(0)}%</div>
      <div><strong>FVC% pred:</strong> ${current.fvcPct.toFixed(0)}%</div>

      <div class="small" style="margin-top:8px;">
        Umbral evaluación: FEV1/FVC fijo 0,70. PBD positiva si Δ ≥12% y ≥200 ml (FEV1 o FVC).
      </div>
    `;

    feedback.className = 'result warn';
    feedback.textContent = '—';
  });

  root.querySelector('#check').addEventListener('click', ()=>{
    if (!current){
      feedback.className = 'result warn';
      feedback.textContent = 'Primero genera un caso.';
      return;
    }

    const ansPattern = root.querySelector('#ansPattern').value;
    const ansPbd = root.querySelector('#ansPbd').value;
    const ansSev = root.querySelector('#ansSev').value;

    const ok1 = ansPattern === current.pattern;
    const ok2 = ansPbd === (current.pbdPos ? 'pos' : 'neg');

    const ok3 = (current.pattern === 'obstructivo' || current.pattern === 'mixto')
      ? (ansSev === current.sev || ansSev === 'na')
      : true;

    feedback.className = 'result';
    feedback.innerHTML = `
      <div><strong>Patrón:</strong> ${ok1 ? '✅' : '❌'} (correcto: ${current.pattern})</div>
      <div><strong>PBD:</strong> ${ok2 ? '✅' : '❌'} (correcto: ${current.pbdPos ? 'pos' : 'neg'})</div>
      <div><strong>Gravedad:</strong> ${ok3 ? '✅' : '❌'} (correcto: ${current.sev})</div>

      <div class="small" style="margin-top:8px;">
        ΔFEV1: ${fmtDelta(current.fev1Pre, current.fev1Post)} ·
        ΔFVC: ${fmtDelta(current.fvcPre, current.fvcPost)}
      </div>

      <div class="small" style="margin-top:6px;">
        Nota: si marcas “No aplica / no sé” en gravedad, no penaliza.
      </div>
    `;
  });

  function fmtDelta(pre, post){
    const d = post - pre;
    const pct = pre > 0 ? (d / pre) * 100 : 0;
    return `${d >= 0 ? '+' : ''}${d.toFixed(2)} L (${pct.toFixed(0)}%)`;
  }

  function isPbdPositive(pre, post){
    const d = post - pre;
    const pct = pre > 0 ? d / pre : 0;
    return (d >= 0.20) && (pct >= 0.12);
  }

  function genCase(){
    // --- Generar "predichos" implícitos a partir de %pred y valores (para coherencia) ---
    const fvcPct = Math.random() < 0.25 ? rand(55,79) : rand(80,110);

    // Patrón base
    const isObs = Math.random() < 0.55;

    // Volúmenes pre plausibles
    const fvcPre = rand(2.4, 5.0);
    let ratioPre = isObs ? rand(0.35, 0.68) : rand(0.70, 0.90);
    let fev1Pre = fvcPre * ratioPre;

    // %pred para FEV1 (coherente con patrón)
    const fev1Pct = isObs ? rand(25,85) : rand(80,115);

    // Si FVC%pred bajo y ratio bajo => mixto; si ratio normal y FVC%pred bajo => restrictivo
    const mixed = (ratioPre < 0.70) && (fvcPct < 80);
    const pattern =
      mixed ? 'mixto' :
      (ratioPre < 0.70 ? 'obstructivo' :
      (fvcPct < 80 ? 'restrictivo' : 'normal'));

    const sev = (pattern === 'obstructivo' || pattern === 'mixto') ? sevFromFev1(fev1Pct) : 'na';

    // --- PBD: generar post y CALCULAR positividad real ---
    const wantPos = Math.random() < 0.35;

    let fev1Post = fev1Pre;
    let fvcPost = fvcPre;

    if (wantPos){
      // Elegir si responde FEV1 o FVC, pero forzar criterio real:
      const target = Math.random() < 0.6 ? 'fev1' : 'fvc';

      if (target === 'fev1'){
        const minDelta = Math.max(0.20, 0.12 * fev1Pre);
        fev1Post = fev1Pre + rand(minDelta, minDelta + 0.35);
        // pequeños cambios en FVC
        fvcPost = fvcPre + rand(-0.03, 0.08);
      } else {
        const minDelta = Math.max(0.20, 0.12 * fvcPre);
        fvcPost = fvcPre + rand(minDelta, minDelta + 0.35);
        fev1Post = fev1Pre + rand(-0.03, 0.08);
      }
    } else {
      // No positiva: asegurar que NO cumpla (fallar por ml o por % o ambos)
      fev1Post = fev1Pre + rand(-0.05, 0.15);
      fvcPost = fvcPre + rand(-0.05, 0.15);

      // Si accidentalmente cumple, lo "capamos"
      if (isPbdPositive(fev1Pre, fev1Post)){
        // bajar por ml o por %
        fev1Post = Math.min(fev1Post, fev1Pre + 0.19);
        if (isPbdPositive(fev1Pre, fev1Post)){
          fev1Post = fev1Pre * 1.11; // 11%
        }
      }
      if (isPbdPositive(fvcPre, fvcPost)){
        fvcPost = Math.min(fvcPost, fvcPre + 0.19);
        if (isPbdPositive(fvcPre, fvcPost)){
          fvcPost = fvcPre * 1.11;
        }
      }
    }

    // Recalcular ratios pre/post
    ratioPre = fev1Pre / fvcPre;
    const ratioPost = fev1Post / fvcPost;

    const pbdPos = isPbdPositive(fev1Pre, fev1Post) || isPbdPositive(fvcPre, fvcPost);

    return {
      fev1Pre, fvcPre, fev1Post, fvcPost,
      ratioPre, ratioPost,
      fev1Pct, fvcPct,
      pattern, pbdPos, sev
    };
  }

  function sevFromFev1(p){
    if (p >= 80) return 'leve';
    if (p >= 50) return 'moderada';
    if (p >= 30) return 'grave';
    return 'muygrave';
  }

  function rand(a,b){
    return a + Math.random()*(b-a);
  }
}
