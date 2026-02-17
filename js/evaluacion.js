// js/evaluacion.js
import { escapeHTML } from './utils.js';

export function renderEvaluacion(root){
  root.innerHTML = `
    <div class="section-title">
      <h2>Evaluación</h2>
      <span class="badge">Casos</span>
    </div>
    <div class="hrline"></div>

    <div class="card">
      <div class="action-row">
        <button class="btn primary" type="button" id="newCase">Nuevo caso</button>
      </div>

      <div class="card" style="margin-top:12px;">
        <h3>Datos del caso</h3>
        <div id="caseBox" class="result warn">Pulsa “Nuevo caso”.</div>
        <div class="small" style="margin-top:10px;">
          PBD (criterio usado aquí): positiva si ΔFEV1 o ΔFVC ≥10% del valor teórico/predicho.
          (No se muestra el veredicto: debes calcularlo tú.)
        </div>
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
    const ratio = current.fev1Pre / current.fvcPre;

    caseBox.className = 'result';
    caseBox.innerHTML = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <div><strong>Edad:</strong> ${current.age} años</div>
          <div><strong>Sexo:</strong> ${escapeHTML(current.sex)}</div>
          <div><strong>Talla:</strong> ${current.height} cm</div>
          <div><strong>Peso:</strong> ${current.weight} kg</div>
        </div>
        <div>
          <div><strong>Síntomas:</strong> ${escapeHTML(current.symptoms)}</div>
          <div><strong>Perfil clínico:</strong> ${escapeHTML(current.profile)}</div>
          <div class="small" style="margin-top:6px;">(No es bloqueante: solo contextualiza)</div>
        </div>
      </div>

      <div class="hrline" style="margin:12px 0;"></div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <div><strong>FEV1 % pred:</strong> ${current.fev1Pct.toFixed(0)}%</div>
          <div><strong>FVC % pred:</strong> ${current.fvcPct.toFixed(0)}%</div>
          <div><strong>FEV1/FVC:</strong> ${ratio.toFixed(2)} (umbral 0,70)</div>
        </div>
        <div>
          <div><strong>FEV1 pre:</strong> ${current.fev1Pre.toFixed(2)} L</div>
          <div><strong>FVC pre:</strong> ${current.fvcPre.toFixed(2)} L</div>
        </div>
      </div>

      <div class="hrline" style="margin:12px 0;"></div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <div><strong>FEV1 post:</strong> ${current.fev1Post.toFixed(2)} L</div>
          <div><strong>FVC post:</strong> ${current.fvcPost.toFixed(2)} L</div>
        </div>
        <div class="small">
          PBD: calcula ΔFEV1 y ΔFVC y compáralo con el 10% del valor teórico (predicho).
        </div>
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
      <div><strong>Patrón:</strong> ${ok1 ? '✅' : '❌'} (correcto: ${escapeHTML(current.pattern)})</div>
      <div class="small">${escapeHTML(current.whyPattern)}</div>

      <div style="margin-top:8px;"><strong>PBD:</strong> ${ok2 ? '✅' : '❌'} (correcto: ${current.pbdPos ? 'pos' : 'neg'})</div>
      <div class="small">${escapeHTML(current.whyPbd)}</div>

      <div style="margin-top:8px;"><strong>Gravedad:</strong> ${ok3 ? '✅' : '❌'} (correcto: ${escapeHTML(current.sev)})</div>
      <div class="small">Nota: si marcas “No aplica / no sé” en gravedad, no penaliza.</div>
    `;
  });

  function genCase(){
    // Demografía
    const age = Math.floor(rand(18, 86));
    const sex = Math.random() < 0.5 ? 'Varón' : 'Mujer';
    const height = Math.floor(rand(150, 196));
    const weight = 80;

    // Perfil clínico (no bloqueante)
    const profiles = [
      { name: 'Sospecha asma (variabilidad)', symptoms: 'Tos + sibilancias episódicas, empeora con ejercicio/frío' },
      { name: 'Sospecha EPOC', symptoms: 'Disnea progresiva + tos crónica, fumador' },
      { name: 'Disnea de causa no aclarada', symptoms: 'Disnea de esfuerzo + fatiga, sin sibilancias claras' },
      { name: 'Control/seguimiento', symptoms: 'Asintomático o síntomas leves, revisión' }
    ];
    const pick = profiles[Math.floor(Math.random()*profiles.length)];
    const profile = pick.name;
    const symptoms = pick.symptoms;

    // Generación base
    const fvcPre = rand(2.4, 5.0);

    // Decide patrón objetivo
    const roll = Math.random();
    let target = 'obstructivo';
    if (roll < 0.25) target = 'normal';
    else if (roll < 0.55) target = 'obstructivo';
    else if (roll < 0.75) target = 'restrictivo';
    else target = 'mixto';

    let ratio = 0.78;
    let fvcPct = 92;
    let fev1Pct = 88;

    if (target === 'normal'){
      ratio = rand(0.70, 0.90);
      fvcPct = rand(80, 110);
      fev1Pct = rand(80, 115);
    }
    if (target === 'obstructivo'){
      ratio = rand(0.35, 0.68);
      fvcPct = rand(80, 110);
      fev1Pct = rand(25, 85);
    }
    if (target === 'restrictivo'){
      ratio = rand(0.70, 0.90);
      fvcPct = rand(55, 79);
      fev1Pct = rand(60, 110);
    }
    if (target === 'mixto'){
      ratio = rand(0.35, 0.68);
      fvcPct = rand(55, 79);
      fev1Pct = rand(25, 85);
    }

    const fev1Pre = fvcPre * ratio;

    // Derivar predichos desde % (para poder aplicar criterio ≥10% predicho)
    const fev1Pred = fev1Pre / (fev1Pct/100);
    const fvcPred  = fvcPre  / (fvcPct/100);

    // Probabilidad de PBD según perfil
    let pbdProb = 0.30;
    if (profile.includes('asma')) pbdProb = 0.55;
    if (profile.includes('EPOC')) pbdProb = 0.25;

    // Genera post
    let fev1Post = fev1Pre;
    let fvcPost = fvcPre;

    const wantPos = Math.random() < pbdProb;

    if (wantPos){
      // Asegurar que cumple ≥10% del predicho en FEV1 o FVC
      if (Math.random() < 0.65){
        fev1Post = fev1Pre + rand(0.10*fev1Pred, 0.18*fev1Pred);
        fvcPost  = fvcPre  + rand(-0.03, 0.08);
      } else {
        fvcPost  = fvcPre  + rand(0.10*fvcPred, 0.18*fvcPred);
        fev1Post = fev1Pre + rand(-0.03, 0.08);
      }
    } else {
      // No cumple
      fev1Post = fev1Pre + rand(-0.05, 0.08*fev1Pred);
      fvcPost  = fvcPre  + rand(-0.05, 0.08*fvcPred);
    }

    const dFev1 = fev1Post - fev1Pre;
    const dFvc  = fvcPost  - fvcPre;
    const pbdPos = (dFev1 >= 0.10*fev1Pred) || (dFvc >= 0.10*fvcPred);

    const sev = (target === 'obstructivo' || target === 'mixto') ? sevFromFev1(fev1Pct) : 'na';

    const whyPattern = buildWhyPattern(target, ratio, fvcPct);
    const whyPbd = buildWhyPbd(pbdPos, dFev1, dFvc, fev1Pred, fvcPred);

    return {
      age, sex, height, weight,
      symptoms, profile,
      fev1Pre, fvcPre, fev1Post, fvcPost,
      fev1Pct, fvcPct,
      fev1Pred, fvcPred,
      pattern: target,
      pbdPos,
      sev,
      whyPattern,
      whyPbd
    };
  }

  function buildWhyPattern(target, ratio, fvcPct){
    if (target === 'obstructivo'){
      return `FEV1/FVC ${ratio.toFixed(2)} < 0,70 ⇒ obstrucción. FVC% pred ${Math.round(fvcPct)} ≥80 ⇒ no sugiere restricción.`;
    }
    if (target === 'mixto'){
      return `FEV1/FVC ${ratio.toFixed(2)} < 0,70 + FVC% pred ${Math.round(fvcPct)} <80 ⇒ mixto (confirmar restricción con volúmenes si procede).`;
    }
    if (target === 'restrictivo'){
      return `FEV1/FVC ${ratio.toFixed(2)} ≥ 0,70 + FVC% pred ${Math.round(fvcPct)} <80 ⇒ sugerente de restricción (confirmar con TLC/volúmenes).`;
    }
    return `FEV1/FVC ${ratio.toFixed(2)} ≥ 0,70 y FVC% pred ${Math.round(fvcPct)} ≥80 ⇒ patrón normal con estos parámetros (si clínica manda, seguir estudiando).`;
  }

  function buildWhyPbd(pbdPos, dFev1, dFvc, fev1Pred, fvcPred){
    const fev1Ok = dFev1 >= 0.10*fev1Pred;
    const fvcOk  = dFvc  >= 0.10*fvcPred;
    if (pbdPos){
      return `Positiva porque ${fev1Ok ? 'ΔFEV1' : 'ΔFVC'} ≥10% del predicho. (ΔFEV1 ${dFev1.toFixed(2)}L vs 10%pred ${(0.10*fev1Pred).toFixed(2)}L · ΔFVC ${dFvc.toFixed(2)}L vs 10%pred ${(0.10*fvcPred).toFixed(2)}L).`;
    }
    return `No positiva: ni ΔFEV1 ni ΔFVC alcanzan ≥10% del predicho. (ΔFEV1 ${dFev1.toFixed(2)}L · ΔFVC ${dFvc.toFixed(2)}L).`;
  }

  function sevFromFev1(p){
    if (p >= 80) return 'leve';
    if (p >= 50) return 'moderada';
    if (p >= 30) return 'grave';
    return 'muygrave';
  }

  function rand(a,b){ return a + Math.random()*(b-a); }
}
