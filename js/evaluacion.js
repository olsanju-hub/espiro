// js/evaluacion.js
import { escapeHTML } from './utils.js';

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
        <h3>Tu respuesta (orden del algoritmo)</h3>

        <!-- Resumen horizontal en 3 columnas -->
        <div class="eval-grid" style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
          <div class="field">
            <label>1) Patrón</label>
            <select id="ansPattern">
              <option value="normal">Normal</option>
              <option value="obstructivo">Obstructivo</option>
              <option value="restrictivo">Restrictivo</option>
              <option value="mixto">Mixto</option>
            </select>
          </div>

          <div class="field">
            <label>2) PBD</label>
            <select id="ansPbd">
              <option value="pos">Positiva</option>
              <option value="neg">No positiva</option>
            </select>
          </div>

          <div class="field">
            <label>3) Gravedad (si obstructivo/mixto)</label>
            <select id="ansSev">
              <option value="na">No aplica / no sé</option>
              <option value="leve">Leve</option>
              <option value="moderada">Moderada</option>
              <option value="grave">Grave</option>
              <option value="muygrave">Muy grave</option>
            </select>
          </div>
        </div>

        <div class="action-row" style="margin-top:12px;">
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
      <div><strong>FEV1/FVC pre:</strong> ${current.ratioPre.toFixed(2)} (umbral 0,70)</div>

      <div style="margin-top:8px;"><strong>FEV1 post:</strong> ${current.fev1Post.toFixed(2)} L</div>
      <div><strong>FVC post:</strong> ${current.fvcPost.toFixed(2)} L</div>
      <div><strong>FEV1/FVC post:</strong> ${current.ratioPost.toFixed(2)}</div>

      <div style="margin-top:8px;"><strong>FEV1% pred (pre):</strong> ${current.fev1PctPre.toFixed(0)}%</div>
      ${current.fev1PctPost != null
        ? `<div><strong>FEV1% pred (post):</strong> ${current.fev1PctPost.toFixed(0)}%</div>`
        : `<div class="small">FEV1% pred post: no disponible en este caso.</div>`
      }
      <div><strong>FVC% pred:</strong> ${current.fvcPct.toFixed(0)}%</div>

      <div class="small" style="margin-top:8px;">
        PBD positiva si Δ ≥12% y ≥200 ml (FEV1 o FVC). Patrones por FEV1/FVC 0,70 y FVC%pred 80.
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

    const okPattern = ansPattern === current.pattern;
    const okPbd = ansPbd === (current.pbdPos ? 'pos' : 'neg');

    const needsSev = (current.pattern === 'obstructivo' || current.pattern === 'mixto');
    const okSev = !needsSev ? true : (ansSev === current.sev || ansSev === 'na');

    // Explicaciones breves (2–3 líneas)
    const patternExplain = explainPattern(current);
    const pbdExplain = explainPbd(current);
    const sevExplain = explainSeverity(current);

    // Resumen correcto en una sola línea + detalle
    const correctLine = `Correcto: ${current.pattern} · ${current.pbdPos ? 'PBD positiva' : 'PBD no positiva'} · ${needsSev ? current.sev : '—'}`;

    feedback.className = 'result';
    feedback.innerHTML = `
      <div><strong>${escapeHTML(correctLine)}</strong></div>

      <div style="margin-top:10px;"><strong>1) Patrón:</strong> ${okPattern ? '✅' : '❌'} (correcto: ${current.pattern})</div>
      <div class="small" style="margin-top:4px;">${escapeHTML(patternExplain)}</div>

      <div style="margin-top:10px;"><strong>2) PBD:</strong> ${okPbd ? '✅' : '❌'} (correcto: ${current.pbdPos ? 'pos' : 'neg'})</div>
      <div class="small" style="margin-top:4px;">${escapeHTML(pbdExplain)}</div>

      <div style="margin-top:10px;"><strong>3) Gravedad:</strong> ${okSev ? '✅' : '❌'} (correcto: ${needsSev ? current.sev : 'na'})</div>
      <div class="small" style="margin-top:4px;">${escapeHTML(sevExplain)}</div>

      <div class="small" style="margin-top:10px;">
        Nota: una PBD positiva no equivale automáticamente a diagnóstico de asma; integrar con clínica.
      </div>
    `;
  });

  // --------- Explicaciones ----------
  function explainPattern(c){
    if (c.pattern === 'obstructivo'){
      return `FEV1/FVC pre ${c.ratioPre.toFixed(2)} < 0,70 → obstrucción. FVC%pred ${c.fvcPct.toFixed(0)} ≥80 (no sugiere restricción por este criterio).`;
    }
    if (c.pattern === 'mixto'){
      return `FEV1/FVC pre ${c.ratioPre.toFixed(2)} < 0,70 (obstrucción) y FVC%pred ${c.fvcPct.toFixed(0)} <80 → mixto (confirmar restricción real con volúmenes si procede).`;
    }
    if (c.pattern === 'restrictivo'){
      return `FEV1/FVC pre ${c.ratioPre.toFixed(2)} ≥ 0,70 (sin obstrucción) y FVC%pred ${c.fvcPct.toFixed(0)} <80 → sugestivo de restricción (confirmar con TLC/volúmenes).`;
    }
    return `FEV1/FVC pre ${c.ratioPre.toFixed(2)} ≥ 0,70 y FVC%pred ${c.fvcPct.toFixed(0)} ≥80 → patrón normal por estos parámetros.`;
  }

  function explainPbd(c){
    const fev1 = deltaInfo(c.fev1Pre, c.fev1Post);
    const fvc  = deltaInfo(c.fvcPre, c.fvcPost);

    const fev1Ok = meetsPbd(fev1);
    const fvcOk  = meetsPbd(fvc);

    const parts = [];
    parts.push(`ΔFEV1 ${fmtDelta(fev1)}${fev1Ok ? ' (cumple)' : ''}`);
    parts.push(`ΔFVC ${fmtDelta(fvc)}${fvcOk ? ' (cumple)' : ''}`);

    return c.pbdPos
      ? `${parts.join(' · ')} → PBD positiva (≥12% y ≥200 ml en FEV1 o FVC).`
      : `${parts.join(' · ')} → no cumple criterio de positividad.`;
  }

  function explainSeverity(c){
    if (!(c.pattern === 'obstructivo' || c.pattern === 'mixto')) return 'No aplica (no hay patrón obstructivo por criterio).';

    if (c.fev1PctPost != null){
      return `Se usa FEV1% pred post (disponible): ${c.fev1PctPost.toFixed(0)}% → ${c.sev}.`;
    }
    return `No hay FEV1% pred post; se usa FEV1% pred pre: ${c.fev1PctPre.toFixed(0)}% → ${c.sev} (orientativo).`;
  }

  // --------- Utilidades ----------
  function sevFromFev1(p){
    if (p >= 80) return 'leve';
    if (p >= 50) return 'moderada';
    if (p >= 30) return 'grave';
    return 'muygrave';
  }

  function deltaInfo(pre, post){
    const d = post - pre;
    const pct = pre > 0 ? (d / pre) * 100 : null;
    return { d, pct };
  }

  function meetsPbd(x){
    return (x.d >= 0.20) && (x.pct != null && x.pct >= 12);
  }

  function fmtDelta(x){
    const d = `${x.d>=0?'+':''}${x.d.toFixed(2)} L`;
    const p = x.pct == null ? '—' : `${x.pct.toFixed(0)}%`;
    return `${d} (${p})`;
  }

  function clamp(x, a, b){
    return Math.max(a, Math.min(b, x));
  }

  // --------- Generador de casos (coherente, pero “infinito”) ----------
  function genCase(){
    // Volúmenes pre
    const fvcPre = rand(2.4, 5.0);

    // Distribución equilibrada de patrones 25% cada uno
    const r = Math.random();
    let forced = 'normal';
    if (r < 0.25) forced = 'normal';
    else if (r < 0.50) forced = 'obstructivo';
    else if (r < 0.75) forced = 'restrictivo';
    else forced = 'mixto';

    // ratio y %pred según patrón
    let ratioPre;
    let fvcPct;

    if (forced === 'obstructivo'){
      ratioPre = rand(0.35, 0.68);
      fvcPct = rand(80, 110);
    } else if (forced === 'restrictivo'){
      ratioPre = rand(0.70, 0.90);
      fvcPct = rand(55, 79);
    } else if (forced === 'mixto'){
      ratioPre = rand(0.35, 0.68);
      fvcPct = rand(55, 79);
    } else { // normal
      ratioPre = rand(0.70, 0.90);
      fvcPct = rand(80, 110);
    }

    const fev1Pre = fvcPre * ratioPre;

    // FEV1% pred pre (coherente con patrón)
    let fev1PctPre;
    if (forced === 'obstructivo' || forced === 'mixto'){
      fev1PctPre = rand(25, 85);
    } else {
      fev1PctPre = rand(80, 115);
    }

    // PBD: proporción moderada; generar post y calcular positividad real
    const wantPos = Math.random() < 0.35;

    let fev1Post = fev1Pre;
    let fvcPost  = fvcPre;

    if (wantPos){
      const target = Math.random() < 0.6 ? 'fev1' : 'fvc';
      if (target === 'fev1'){
        const minDelta = Math.max(0.20, 0.12 * fev1Pre);
        fev1Post = fev1Pre + rand(minDelta, minDelta + 0.35);
        fvcPost  = fvcPre + rand(-0.03, 0.08);
      } else {
        const minDelta = Math.max(0.20, 0.12 * fvcPre);
        fvcPost  = fvcPre + rand(minDelta, minDelta + 0.35);
        fev1Post = fev1Pre + rand(-0.03, 0.08);
      }
    } else {
      fev1Post = fev1Pre + rand(-0.05, 0.15);
      fvcPost  = fvcPre  + rand(-0.05, 0.15);

      // evitar positividad accidental
      if (meetsPbd(deltaInfo(fev1Pre, fev1Post))){
        fev1Post = Math.min(fev1Post, fev1Pre + 0.19);
      }
      if (meetsPbd(deltaInfo(fvcPre, fvcPost))){
        fvcPost = Math.min(fvcPost, fvcPre + 0.19);
      }
    }

    const ratioPost = fev1Post / fvcPost;
    const pbdPos = meetsPbd(deltaInfo(fev1Pre, fev1Post)) || meetsPbd(deltaInfo(fvcPre, fvcPost));

    // FEV1% post: a veces disponible (soporta ambos)
    const hasPostPct = Math.random() < 0.55;
    const fev1PctPost = hasPostPct ? clamp(fev1PctPre + rand(-5, +12), 15, 130) : null;

    // severidad usando post si existe, si no pre
    const sevBasis = (fev1PctPost != null) ? fev1PctPost : fev1PctPre;
    const sev = (forced === 'obstructivo' || forced === 'mixto') ? sevFromFev1(sevBasis) : 'na';

    return {
      fev1Pre, fvcPre, fev1Post, fvcPost,
      ratioPre, ratioPost,
      fev1PctPre, fev1PctPost,
      fvcPct,
      pattern: forced,
      pbdPos,
      sev
    };
  }

  function rand(a,b){
    return a + Math.random()*(b-a);
  }
}
