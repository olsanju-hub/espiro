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

        <div class="field" style="margin-top:8px;">
          <label>Diagnóstico más probable (no bloqueante)</label>
          <select id="ansDx">
            <option value="asma">Asma</option>
            <option value="epoc">EPOC</option>
            <option value="normal">Normal</option>
            <option value="indeterminado">Indeterminado (seguir estudio)</option>
          </select>
          <div class="small">Se corrige con el perfil clínico del caso. No afecta al resto.</div>
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
          <div><strong>FEV1 pre:</strong> ${current.fev1Pre.toFixed(2)} L</div>
          <div><strong>FVC pre:</strong> ${current.fvcPre.toFixed(2)} L</div>
          <div><strong>FEV1/FVC:</strong> ${ratio.toFixed(2)} (umbral 0,70)</div>
        </div>
        <div>
          <div><strong>FEV1 post:</strong> ${current.fev1Post.toFixed(2)} L</div>
          <div><strong>FVC post:</strong> ${current.fvcPost.toFixed(2)} L</div>
          <div><strong>FEV1 % pred:</strong> ${current.fev1Pct.toFixed(0)}%</div>
          <div><strong>FVC % pred:</strong> ${current.fvcPct.toFixed(0)}%</div>
        </div>
      </div>

      <div class="small" style="margin-top:10px;">
        PBD: Se considera (+) el Aumento de FEV1 o FVC ≥ 12% y aumento absoluto de ≥ 200 ml respecto al valor basal.
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
    const ansDx = root.querySelector('#ansDx').value;

    const ok1 = ansPattern === current.pattern;
    const ok2 = ansPbd === (current.pbdPos ? 'pos' : 'neg');
    const ok3 = (current.pattern === 'obstructivo' || current.pattern === 'mixto')
      ? (ansSev === current.sev || ansSev === 'na')
      : true;

    const okDx = ansDx === current.dxExpected;

    feedback.className = 'result';
    feedback.innerHTML = `
      <div><strong>Patrón:</strong> ${ok1 ? '✅' : '❌'} (correcto: ${escapeHTML(current.pattern)})</div>
      <div class="small">${escapeHTML(current.whyPattern)}</div>

      <div style="margin-top:8px;"><strong>PBD:</strong> ${ok2 ? '✅' : '❌'} (correcto: ${current.pbdPos ? 'pos' : 'neg'})</div>
      <div class="small">${escapeHTML(current.whyPbd)}</div>
      ${current.pbdPos ? `<div class="small-note">Nota: una PBD positiva no equivale automáticamente a diagnóstico de asma. Interpretar con clínica.</div>` : ''}

      <div style="margin-top:8px;"><strong>Gravedad:</strong> ${ok3 ? '✅' : '❌'} (correcto: ${escapeHTML(current.sev)})</div>
      <div class="small">Nota: si marcas “No aplica / no sé” en gravedad, no penaliza.</div>

      <div style="margin-top:10px;"><strong>Diagnóstico más probable:</strong> ${okDx ? '✅' : '❌'}
        (correcto: ${escapeHTML(labelDx(current.dxExpected))})
      </div>
      <div class="small">${escapeHTML(current.whyDx)}</div>
    `;
  });

  function genCase(){
    const age = Math.floor(rand(18, 86));
    const sex = Math.random() < 0.5 ? 'Varón' : 'Mujer';
    const height = Math.floor(rand(150, 196));
    const weight = 80;

    const profiles = [
      { name: 'Sospecha asma (variabilidad)', symptoms: 'Tos + sibilancias episódicas, empeora con ejercicio/frío', dx: 'asma' },
      { name: 'Sospecha EPOC', symptoms: 'Disnea progresiva + tos crónica, fumador', dx: 'epoc' },
      { name: 'Disnea de causa no aclarada', symptoms: 'Disnea de esfuerzo + fatiga, sin sibilancias claras', dx: 'indeterminado' },
      { name: 'Control/seguimiento', symptoms: 'Asintomático o síntomas leves, revisión', dx: 'normal' }
    ];
    const pick = profiles[Math.floor(Math.random()*profiles.length)];
    const profile = pick.name;
    const symptoms = pick.symptoms;

    const fvcPre = rand(2.4, 5.0);

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

    let pbdProb = 0.30;
    if (profile.includes('asma')) pbdProb = 0.55;
    if (profile.includes('EPOC')) pbdProb = 0.25;

    const pbdPos = Math.random() < pbdProb;

    let fev1Post = fev1Pre;
    let fvcPost = fvcPre;

    if (pbdPos){
      if (Math.random() < 0.65){
        fev1Post = fev1Pre + rand(0.20, 0.55);
      } else {
        fvcPost = fvcPre + rand(0.20, 0.55);
      }
    } else {
      fev1Post = Math.min(fev1Pre + rand(-0.05, 0.15), fev1Pre + 0.18);
      fvcPost  = Math.min(fvcPre + rand(-0.05, 0.15), fvcPre + 0.18);
    }

    const sev = (target === 'obstructivo' || target === 'mixto') ? sevFromFev1(fev1Pct) : 'na';

    const whyPattern = buildWhyPattern(target, ratio, fvcPct);
    const whyPbd = buildWhyPbd(pbdPos, fev1Pre, fev1Post, fvcPre, fvcPost);

    const dxExpected = pick.dx;
    const whyDx = buildWhyDx(dxExpected, profile, target, pbdPos);

    return {
      age, sex, height, weight,
      symptoms, profile,
      fev1Pre, fvcPre, fev1Post, fvcPost,
      fev1Pct, fvcPct,
      pattern: target,
      pbdPos,
      sev,
      whyPattern,
      whyPbd,
      dxExpected,
      whyDx
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

  function buildWhyPbd(pbdPos, fev1Pre, fev1Post, fvcPre, fvcPost){
    const dFev1 = fev1Post - fev1Pre;
    const dFvc  = fvcPost - fvcPre;
    const pcFev1 = (fev1Pre > 0) ? (dFev1/fev1Pre*100) : 0;
    const pcFvc  = (fvcPre > 0) ? (dFvc/fvcPre*100) : 0;

    const fev1Ok = (pcFev1 >= 12) && (dFev1 >= 0.2);
    const fvcOk  = (pcFvc  >= 12) && (dFvc  >= 0.2);

    if (pbdPos){
      const which = fev1Ok ? 'FEV1' : (fvcOk ? 'FVC' : 'FEV1/FVC');
      return `Cumple criterio en ${which} (≥12% y ≥200 ml). (FEV1 +${dFev1.toFixed(2)}L ${pcFev1.toFixed(0)}% · FVC +${dFvc.toFixed(2)}L ${pcFvc.toFixed(0)}%).`;
    }
    return `No cumple ≥12% y ≥200 ml (FEV1 +${dFev1.toFixed(2)}L ${pcFev1.toFixed(0)}% · FVC +${dFvc.toFixed(2)}L ${pcFvc.toFixed(0)}%).`;
  }

  function buildWhyDx(dx, profile, pattern, pbdPos){
    if (dx === 'asma'){
      return `Perfil sugiere variabilidad. Una PBD ${pbdPos ? 'positiva apoya reversibilidad' : 'no positiva no descarta'}; el diagnóstico final depende de la clínica y evolución.`;
    }
    if (dx === 'epoc'){
      return `Perfil de fumador/disnea progresiva. La PBD puede ser ${pbdPos ? 'positiva sin convertirlo en asma' : 'no positiva'}; integrar con clínica.`;
    }
    if (dx === 'normal'){
      return `Contexto de control/seguimiento. Un patrón ${pattern} podría obligar a ampliar estudio, pero este caso está planteado como “normal/seguimiento”.`;
    }
    return `Perfil no orienta claramente a asma/EPOC. Si síntomas persisten, seguir estudio según contexto clínico.`;
  }

  function labelDx(v){
    if (v === 'asma') return 'Asma';
    if (v === 'epoc') return 'EPOC';
    if (v === 'normal') return 'Normal';
    return 'Indeterminado (seguir estudio)';
  }

  function sevFromFev1(p){
    if (p >= 80) return 'leve';
    if (p >= 50) return 'moderada';
    if (p >= 30) return 'grave';
    return 'muygrave';
  }

  function rand(a,b){ return a + Math.random()*(b-a); }
}
