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
          PBD (criterio clásico): positiva si ΔFEV1 o ΔFVC ≥12% del basal Y ≥200 ml.
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
          <div><strong>FEV1 % pred:</strong> ${current.fev1Pct.toFixed(0)}%</div>
          <div><strong>FVC % pred:</strong> ${current.fvcPct.toFixed(0)}%</div>
        </div>
      </div>

      <div class="hrline" style="margin:12px 0;"></div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
        <div>
          <div><strong>FEV1 post:</strong> ${current.fev1Post.toFixed(2)} L</div>
          <div><strong>FVC post:</strong> ${current.fvcPost.toFixed(2)} L</div>
        </div>
        <div class="small">
          Calcula Δ en litros y porcentaje respecto al basal.
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
    `;
  });

  function genCase(){
    const age = Math.floor(rand(18, 86));
    const sex = Math.random() < 0.5 ? 'Varón' : 'Mujer';
    const height = Math.floor(rand(150, 196));
    const weight = 80;

    const profiles = [
      { name: 'Sospecha asma', symptoms: 'Tos y sibilancias episódicas' },
      { name: 'Sospecha EPOC', symptoms: 'Disnea progresiva y tabaquismo' },
      { name: 'Disnea no aclarada', symptoms: 'Disnea de esfuerzo' },
      { name: 'Control', symptoms: 'Revisión sin síntomas relevantes' }
    ];
    const pick = profiles[Math.floor(Math.random()*profiles.length)];

    const fvcPre = rand(2.4, 5.0);

    const roll = Math.random();
    let target = roll < 0.25 ? 'normal'
      : roll < 0.55 ? 'obstructivo'
      : roll < 0.75 ? 'restrictivo'
      : 'mixto';

    let ratio = target === 'obstructivo' || target === 'mixto'
      ? rand(0.35, 0.68)
      : rand(0.70, 0.90);

    let fvcPct = target === 'restrictivo' || target === 'mixto'
      ? rand(55,79)
      : rand(80,110);

    let fev1Pct = target === 'obstructivo' || target === 'mixto'
      ? rand(25,85)
      : rand(80,115);

    const fev1Pre = fvcPre * ratio;

    let fev1Post = fev1Pre;
    let fvcPost = fvcPre;

    const wantPos = Math.random() < 0.35;

    if (wantPos){
      if (Math.random() < 0.6){
        fev1Post = fev1Pre + rand(0.20,0.60);
      } else {
        fvcPost = fvcPre + rand(0.20,0.60);
      }
    } else {
      fev1Post = fev1Pre + rand(-0.05,0.18);
      fvcPost = fvcPre + rand(-0.05,0.18);
    }

    const dFev1 = fev1Post - fev1Pre;
    const dFvc = fvcPost - fvcPre;

    const pcFev1 = (dFev1 / fev1Pre) * 100;
    const pcFvc = (dFvc / fvcPre) * 100;

    const fev1Ok = pcFev1 >= 12 && dFev1 >= 0.2;
    const fvcOk = pcFvc >= 12 && dFvc >= 0.2;

    const pbdPos = fev1Ok || fvcOk;

    const sev = (target === 'obstructivo' || target === 'mixto')
      ? (fev1Pct >= 80 ? 'leve'
        : fev1Pct >= 50 ? 'moderada'
        : fev1Pct >= 30 ? 'grave'
        : 'muygrave')
      : 'na';

    return {
      age,
      sex,
      height,
      weight,
      symptoms: pick.symptoms,
      profile: pick.name,
      fev1Pre,
      fvcPre,
      fev1Post,
      fvcPost,
      fev1Pct,
      fvcPct,
      pattern: target,
      pbdPos,
      sev,
      whyPattern: '',
      whyPbd: `ΔFEV1 ${dFev1.toFixed(2)}L (${pcFev1.toFixed(0)}%) · ΔFVC ${dFvc.toFixed(2)}L (${pcFvc.toFixed(0)}%).`
    };
  }

  function rand(a,b){ return a + Math.random()*(b-a); }
}
