// js/simulador.js
import { num, escapeHTML } from './utils.js';

export function renderSimulador(root){
  root.innerHTML = `
    <div class="section-title">
      <h2>Simulador</h2>
      <span class="badge">Cálculo</span>
    </div>
    <div class="hrline"></div>

    <div class="card">
      <div class="small">
        Recordatorio: interpretar solo si la prueba es aceptable y reproducible.
      </div>

      <form class="form" id="formSim" style="margin-top:10px;">
        <!-- ESENCIALES (sin scroll innecesario): todo en % -->
        <div class="card" style="border-radius:16px;">
          <strong>1) Valores esenciales (% pred / %)</strong>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1/FVC (%, pre)</label>
              <input inputmode="decimal" id="ratioPct" placeholder="Ej: 45" />
              <div class="small">Introduce el porcentaje (no 0,45).</div>
            </div>
            <div class="field">
              <label>FVC % pred (pre)</label>
              <input inputmode="decimal" id="fvcPctPre" placeholder="Ej: 93" />
            </div>
          </div>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 % pred (pre)</label>
              <input inputmode="decimal" id="fev1PctPre" placeholder="Ej: 84" />
              <div class="small">Si hay obstrucción, se usa para graduar (mejor con valor post si lo tienes).</div>
            </div>
            <div class="field">
              <label>FEV1 % pred (post, opcional)</label>
              <input inputmode="decimal" id="fev1PctPost" placeholder="Ej: 92" />
            </div>
          </div>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FVC % pred (post, opcional)</label>
              <input inputmode="decimal" id="fvcPctPost" placeholder="Ej: 101" />
            </div>
            <div class="field">
              <label>FVC % pred (pre) ya arriba</label>
              <div class="small">Dejo esta columna libre para que en móvil quede simétrico.</div>
            </div>
          </div>
        </div>

        <!-- UMBRAL -->
        <div class="card" style="border-radius:16px; margin-top:12px;">
          <strong>2) Umbral FEV1/FVC</strong>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>Modo</label>
              <select id="ratioMode">
                <option value="fixed" selected>Fijo 70%</option>
                <option value="lln">LLN (si lo tienes)</option>
              </select>
            </div>
            <div class="field">
              <label>LLN (%, si modo LLN)</label>
              <input inputmode="decimal" id="llnPct" placeholder="Ej: 68" />
            </div>
          </div>
          <div class="small">Por defecto: obstrucción si FEV1/FVC &lt; 70%.</div>
        </div>

        <!-- PBD -->
        <div class="card" style="border-radius:16px; margin-top:12px;">
          <strong>3) Prueba broncodilatadora (PBD)</strong>
          <div class="small" style="margin-top:6px;">
            Criterio usado (según lo que me has dicho): <strong>positiva si ΔFEV1 o ΔFVC ≥10 puntos porcentuales de % pred</strong>
            (equivale a ≥10% del predicho).
          </div>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 % pred (post)</label>
              <input inputmode="decimal" id="fev1PctPost2" placeholder="Ej: 92" />
              <div class="small">Si lo rellenas aquí, prevalece sobre el post de arriba.</div>
            </div>
            <div class="field">
              <label>FVC % pred (post)</label>
              <input inputmode="decimal" id="fvcPctPost2" placeholder="Ej: 101" />
              <div class="small">Si lo rellenas aquí, prevalece sobre el post de arriba.</div>
            </div>
          </div>

          <div class="small" style="margin-top:10px;">
            Nota clínica: PBD positiva <strong>no equivale automáticamente</strong> a asma; integrar con clínica y evolución.
          </div>
        </div>

        <!-- OPCIONALES PLEGADOS (LITROS) -->
        <details class="card" style="border-radius:16px; margin-top:12px;">
          <summary><strong>Opcional (plegado): introducir litros / predichos en litros</strong></summary>
          <div class="small" style="margin-top:8px;">
            Solo si quieres registrar el informe “tal cual” o comprobar coherencias.
          </div>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 pre (L)</label>
              <input inputmode="decimal" id="fev1PreL" placeholder="Ej: 1.82" />
            </div>
            <div class="field">
              <label>FVC pre (L)</label>
              <input inputmode="decimal" id="fvcPreL" placeholder="Ej: 4.02" />
            </div>
          </div>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 post (L)</label>
              <input inputmode="decimal" id="fev1PostL" placeholder="Ej: 1.93" />
            </div>
            <div class="field">
              <label>FVC post (L)</label>
              <input inputmode="decimal" id="fvcPostL" placeholder="Ej: 4.00" />
            </div>
          </div>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 pred (L)</label>
              <input inputmode="decimal" id="fev1PredL" placeholder="Ej: 2.17" />
            </div>
            <div class="field">
              <label>FVC pred (L)</label>
              <input inputmode="decimal" id="fvcPredL" placeholder="Ej: 4.32" />
            </div>
          </div>
          <div class="small" style="margin-top:8px;">
            Si rellenas predichos en litros y los valores en litros, puedo calcular % pred automáticamente.
          </div>
        </details>

        <div class="action-row" style="margin-top:12px;">
          <button class="btn primary" type="submit">Interpretar</button>
          <button class="btn" type="button" id="resetBtn">Limpiar</button>
        </div>
      </form>
    </div>

    <div class="card" style="margin-top:14px;">
      <h3>Resultado</h3>
      <div id="out" class="result warn">Introduce datos y pulsa “Interpretar”.</div>
    </div>
  `;

  const form = root.querySelector('#formSim');
  const out = root.querySelector('#out');

  root.querySelector('#resetBtn').addEventListener('click', ()=>{
    form.reset();
    out.className = 'result warn';
    out.textContent = 'Introduce datos y pulsa “Interpretar”.';
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    // Primario (%)
    let ratioPct = num(root.querySelector('#ratioPct').value);
    let fev1PctPre = num(root.querySelector('#fev1PctPre').value);
    let fvcPctPre  = num(root.querySelector('#fvcPctPre').value);

    // Post (%), dos sitios: si el de PBD está relleno, manda
    const fev1PctPostA = num(root.querySelector('#fev1PctPost').value);
    const fvcPctPostA  = num(root.querySelector('#fvcPctPost').value);
    const fev1PctPostB = num(root.querySelector('#fev1PctPost2').value);
    const fvcPctPostB  = num(root.querySelector('#fvcPctPost2').value);

    const fev1PctPost = (fev1PctPostB != null) ? fev1PctPostB : fev1PctPostA;
    const fvcPctPost  = (fvcPctPostB != null) ? fvcPctPostB  : fvcPctPostA;

    // Secundario (L) -> por si el usuario mete solo litros/predichos
    const fev1PreL  = num(root.querySelector('#fev1PreL').value);
    const fvcPreL   = num(root.querySelector('#fvcPreL').value);
    const fev1PostL = num(root.querySelector('#fev1PostL').value);
    const fvcPostL  = num(root.querySelector('#fvcPostL').value);
    const fev1PredL = num(root.querySelector('#fev1PredL').value);
    const fvcPredL  = num(root.querySelector('#fvcPredL').value);

    // Autocompletar % pred si falta y se dieron L+pred(L)
    if (fev1PctPre == null && fev1PreL != null && fev1PredL != null && fev1PredL > 0){
      fev1PctPre = (fev1PreL / fev1PredL) * 100;
    }
    if (fvcPctPre == null && fvcPreL != null && fvcPredL != null && fvcPredL > 0){
      fvcPctPre = (fvcPreL / fvcPredL) * 100;
    }

    // Autocompletar ratio% si falta y se dieron FEV1/FVC en L
    if (ratioPct == null && fev1PreL != null && fvcPreL != null && fvcPreL > 0){
      ratioPct = (fev1PreL / fvcPreL) * 100;
    }

    if (ratioPct == null || fvcPctPre == null){
      out.className = 'result warn';
      out.textContent = 'Faltan datos esenciales: FEV1/FVC (%) y FVC % pred (pre).';
      return;
    }

    // Umbral
    const mode = root.querySelector('#ratioMode').value;
    let cutoffPct = 70;
    if (mode === 'lln'){
      const lln = num(root.querySelector('#llnPct').value);
      if (lln == null || lln <= 0 || lln >= 100){
        out.className = 'result warn';
        out.textContent = 'Modo LLN seleccionado: introduce un LLN válido en % (ej. 68).';
        return;
      }
      cutoffPct = lln;
    }

    const isObs = ratioPct < cutoffPct;
    const isLowFvc = (fvcPctPre < 80);

    // Patrón (clásico)
    let pattern = 'Indeterminado';
    const why = [];

    if (isObs && isLowFvc){
      pattern = 'Mixto (obstrucción + posible restricción)';
      why.push(`FEV1/FVC ${ratioPct.toFixed(0)}% < ${cutoffPct.toFixed(0)}% y FVC %pred ${fvcPctPre.toFixed(0)}% < 80%`);
      why.push('Confirmar restricción con volúmenes pulmonares si procede.');
    } else if (isObs){
      pattern = 'Obstructivo';
      why.push(`FEV1/FVC ${ratioPct.toFixed(0)}% < ${cutoffPct.toFixed(0)}%`);
    } else if (!isObs && isLowFvc){
      pattern = 'Sugerente de restricción';
      why.push(`FEV1/FVC ${ratioPct.toFixed(0)}% ≥ ${cutoffPct.toFixed(0)}% y FVC %pred ${fvcPctPre.toFixed(0)}% < 80%`);
      why.push('Confirmar restricción con TLC/volúmenes si es relevante.');
    } else {
      pattern = 'Normal (según estos parámetros)';
      why.push(`FEV1/FVC ${ratioPct.toFixed(0)}% ≥ ${cutoffPct.toFixed(0)}% y FVC %pred ${fvcPctPre.toFixed(0)}% ≥ 80%`);
    }

    // Gravedad (GOLD clásico, idealmente con FEV1% post si existe)
    const fev1ForSeverity = (fev1PctPost != null) ? fev1PctPost : fev1PctPre;
    let severity = null;
    if (isObs && fev1ForSeverity != null){
      const p = fev1ForSeverity;
      if (p >= 80) severity = 'Leve (FEV1 ≥80% pred)';
      else if (p >= 50) severity = 'Moderada (FEV1 50–79% pred)';
      else if (p >= 30) severity = 'Grave (FEV1 30–49% pred)';
      else severity = 'Muy grave (FEV1 <30% pred)';
    }

    // PBD (Δ%pred >= 10 puntos)
    let pbd = null;
    if (fev1PctPre != null && fvcPctPre != null && (fev1PctPost != null || fvcPctPost != null)){
      const dFev1 = (fev1PctPost != null) ? (fev1PctPost - fev1PctPre) : null;
      const dFvc  = (fvcPctPost  != null) ? (fvcPctPost  - fvcPctPre)  : null;

      const fev1Ok = (dFev1 != null) ? (dFev1 >= 10) : false;
      const fvcOk  = (dFvc  != null) ? (dFvc  >= 10) : false;

      pbd = {
        positive: fev1Ok || fvcOk,
        dFev1, dFvc,
        fev1Ok, fvcOk
      };
    }

    const html = `
      <div style="font-size:18px;"><strong>FEV1/FVC:</strong> ${ratioPct.toFixed(0)}% (umbral ${cutoffPct.toFixed(0)}% · ${mode === 'fixed' ? '70%' : 'LLN'})</div>

      <div style="margin-top:10px;"><strong>Patrón:</strong> ${escapeHTML(pattern)}</div>
      <div class="small" style="margin-top:6px;">${why.map(x=>`• ${escapeHTML(x)}`).join('<br>')}</div>

      <div style="margin-top:10px;"><strong>% pred (pre):</strong>
        FEV1 ${fev1PctPre != null ? fev1PctPre.toFixed(0)+'%' : '—'} ·
        FVC ${fvcPctPre != null ? fvcPctPre.toFixed(0)+'%' : '—'}
      </div>

      ${(fev1PctPost != null || fvcPctPost != null) ? `
        <div style="margin-top:6px;"><strong>% pred (post):</strong>
          FEV1 ${fev1PctPost != null ? fev1PctPost.toFixed(0)+'%' : '—'} ·
          FVC ${fvcPctPost != null ? fvcPctPost.toFixed(0)+'%' : '—'}
        </div>
      ` : ''}

      ${severity ? `<div style="margin-top:10px;"><strong>Gravedad obstrucción:</strong> ${escapeHTML(severity)}</div>` : ''}

      ${pbd ? `
        <div style="margin-top:10px;"><strong>PBD:</strong> ${pbd.positive ? 'Positiva' : 'No positiva'} (criterio Δ%pred ≥10 puntos)</div>
        <div class="small" style="margin-top:6px;">
          • ΔFEV1: ${pbd.dFev1 != null ? (pbd.dFev1.toFixed(0)+' puntos') : '—'} ${pbd.fev1Ok ? '→ cumple' : ''}<br>
          • ΔFVC: ${pbd.dFvc != null ? (pbd.dFvc.toFixed(0)+' puntos') : '—'} ${pbd.fvcOk ? '→ cumple' : ''}
        </div>
      ` : ''}

      <div class="small" style="margin-top:10px;">
        Nota: PBD positiva no equivale automáticamente a asma; integrar con clínica y evolución.
      </div>
    `;

    out.className = 'result';
    out.innerHTML = html;
  });
}
