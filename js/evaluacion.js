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
      <div><strong>FEV1/FVC pre:</strong> ${current.ratioPre.toFixed(2)} (umbral 0,70)</div>

      <div style="margin-top:8px;"><strong>FEV1 post:</strong> ${current.fev1Post.toFixed(2)} L</div>
      <div><strong>FVC post:</strong> ${current.fvcPost.toFixed(2)} L</div>
      <div><strong>FEV1/FVC post:</strong> ${current.ratioPost.toFixed(2)}</div>

      <div style="margin-top:8px;"><strong>FEV1% pred (pre):</strong> ${current.fev1PctPre.toFixed(0)}%</div>
      ${current.fev1PctPost != null ? `<div><strong>FEV1% pred (post):</strong> ${current.fev1PctPost.toFixed(0)}%</div>` : `<div class="small">FEV1% pred post: no disponible en este caso.</div>`}
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

    const patternExplain = explainPattern(current);
    const pbdExplain = explainPbd(current);
    const sevExplain = explainSeverity(current);

    feedback.className = 'result';
    feedback.innerHTML = `
      <div><strong>Patrón:</strong> ${okPattern ? '✅' : '❌'} (correcto: ${current.pattern})</div>
      <div class="small" style="margin-top:4px;">${escapeHTML(patternExplain)}</div>

      <div style="margin-top:10px;"><strong>PBD:</strong> ${okPbd ? '✅' : '❌'} (correcto: ${current.pbdPos ? 'pos' : 'neg'})</div>
      <div class="small" style="margin-top:4px;">${escapeHTML(pbdExplain)}</div>

      <div style="margin-top:10px;"><strong>Gravedad:</strong> ${okSev ? '✅' : '❌'} (correcto: ${current.sev})</div>
      <div class="small" style="margin-top:4px;">${escapeHTML(sevExplain)}</div>

      <div class="small" style="margin-top:10px;">
        Nota: una PBD positiva no equivale automáticamente a diagnóstico de asma; integrar con clínica.
      </div>
    `;
  });

  // ---------- Lógica clínica (operativa) ----------
  function explainPattern(c){
    if (c.pattern === 'obstructivo'){
      return `FEV1/FVC pre ${c.ratioPre.toFixed(2)} < 0,70 → obstrucción. FVC%pred ${c.fvcPct.toFixed(0)} ≥80 sugiere que no hay restricción asociada por este criterio.`;
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

    if (c.pbdPos){
      return `${parts.join(' · ')} → PBD positiva (≥12% y ≥200 ml en FEV1 o FVC).`;
    }
    return `${parts.join(' · ')} → no cumple criterio de positividad.`;
  }

  function explainSeverity(c){
    if (!(c.pattern === 'obstructivo' || c.pattern === 'mixto')) return 'No aplica (no hay patrón obstructivo por criterio).';

    if (c.fev1PctPost != null){
      return `Se usa FEV1% pred post (disponible): ${c.fev1PctPost.toFixed(0)}% → ${c.sev}.`;
    }
    return `No hay FEV1% pred post; se usa FEV1% pred pre: ${c.fev1PctPre.toFixed(0)}% → ${c.sev} (interpretación orientativa).`;
  }

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

  // ---------- Generación del caso ----------
  function genCase(){
    // Volúmenes pre
    const fvcPre = rand(2.4, 5.0);

    // Decidir si obstructivo o no
    const isObs = Math.random() < 0.55;

    // ratio pre
    const ratioPre = isObs ? rand(0.35, 0.68) : rand(0.70, 0.90);
    const fev1Pre = fvcPre * ratioPre;

    // %pred
    const fvcPct = Math.random() < 0.25 ? rand(55,79) : rand(80,110);
    const fev1PctPre = isObs ? rand(25,85) : rand(80,115);

    // Patrón por criterio operativo
    const mixed = (ratioPre < 0.70) && (fvcPct < 80);
    const pattern =
      mixed ? 'mixto' :
      (ratioPre < 0.70 ? 'obstructivo' :
      (fvcPct < 80 ? 'restrictivo' : 'normal'));

    // PBD: generar post y calcular positividad real
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

      // capar si cumple accidentalmente
      if (meetsPbd(deltaInfo(fev1Pre, fev1Post))){
        fev1Post = Math.min(fev1Post, fev1Pre + 0.19);
        if (meetsPbd(deltaInfo(fev1Pre, fev1Post))) fev1Post = fev1Pre * 1.11;
      }
      if (meetsPbd(deltaInfo(fvcPre, fvcPost))){
        fvcPost = Math.min(fvcPost, fvcPre + 0.19);
        if (meetsPbd(deltaInfo(fvcPre, fvcPost))) fvcPost = fvcPre * 1.11;
      }
    }

    const ratioPost = fev1Post / fvcPost;
    const pbdPos = meetsPbd(deltaInfo(fev1Pre, fev1Post)) || meetsPbd(deltaInfo(fvcPre, fvcPost));

    // FEV1% post: a veces disponible (como en tu práctica, soportar ambos)
    const hasPostPct = Math.random() < 0.55; // ajustable
    const fev1PctPost = hasPostPct
      ? clamp(fev1PctPre + rand(-5, +12), 15, 130)
      : null;

    // severidad usando post si existe, si no pre (y lo diremos)
    const sevBasis = (fev1PctPost != null) ? fev1PctPost : fev1PctPre;
    const sev = (pattern === 'obstructivo' || pattern === 'mixto') ? sevFromFev1(sevBasis) : 'na';

    return {
      fev1Pre, fvcPre, fev1Post, fvcPost,
      ratioPre, ratioPost,
      fev1PctPre, fev1PctPost,
      fvcPct,
      pattern, pbdPos, sev
    };
  }

  function rand(a,b){
    return a + Math.random()*(b-a);
  }
}
