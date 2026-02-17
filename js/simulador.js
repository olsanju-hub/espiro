// js/simulador.js
import { num, pctChange, escapeHTML } from './utils.js';

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

        <!-- ESENCIALES (rápidos, en %) -->
        <div class="card" style="border-radius:16px;">
          <strong>1) Esenciales</strong>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1/FVC (%, pre)</label>
              <input inputmode="decimal" id="ratioPct" placeholder="Ej: 63" />
              <div class="small">Introduce porcentaje (63), no 0,63.</div>
            </div>
            <div class="field">
              <label>FEV1 % pred (pre)</label>
              <input inputmode="decimal" id="fev1PctPre" placeholder="Ej: 58" />
              <div class="small">Para gravedad (idealmente usar post si lo tienes).</div>
            </div>
          </div>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FVC % pred (pre)</label>
              <input inputmode="decimal" id="fvcPctPre" placeholder="Ej: 74" />
              <div class="small">Para restricción/mixto (umbral operativo: &lt;80%).</div>
            </div>
            <div class="field">
              <label>FEV1 % pred (post, opcional)</label>
              <input inputmode="decimal" id="fev1PctPost" placeholder="Ej: 66" />
              <div class="small">Si hay obstrucción, se usa para gravedad si lo rellenas.</div>
            </div>
          </div>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FVC % pred (post, opcional)</label>
              <input inputmode="decimal" id="fvcPctPost" placeholder="Ej: 78" />
            </div>
            <div class="field">
              <label>&nbsp;</label>
              <div class="small">—</div>
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
          <div class="small">Por defecto: obstrucción si FEV1/FVC &lt; 70% (como en tu algoritmo visual).</div>
        </div>

        <!-- PBD CLÁSICA (plegada, mínima en litros) -->
        <details class="card" style="border-radius:16px; margin-top:12px;">
          <summary><strong>3) PBD (criterio clásico) — desplegable</strong></summary>

          <div class="small" style="margin-top:8px;">
            Criterio clásico: <strong>positiva si</strong> ΔFEV1 <strong>o</strong> ΔFVC <strong>≥12%</strong> del basal <strong>y</strong> <strong>≥200 ml</strong>.
            (Para calcularlo bien hacen falta litros.)
          </div>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 pre (L) *</label>
              <input inputmode="decimal" id="fev1PreL" placeholder="Ej: 1.82" />
            </div>
            <div class="field">
              <label>FEV1 post (L) *</label>
              <input inputmode="decimal" id="fev1PostL" placeholder="Ej: 2.05" />
            </div>
          </div>

          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FVC pre (L) (opcional)</label>
              <input inputmode="decimal" id="fvcPreL" placeholder="Ej: 3.40" />
            </div>
            <div class="field">
              <label>FVC post (L) (opcional)</label>
              <input inputmode="decimal" id="fvcPostL" placeholder="Ej: 3.70" />
            </div>
          </div>

          <div class="small" style="margin-top:10px;">
            Nota clínica: PBD positiva <strong>no equivale automáticamente</strong> a asma; integrar con clínica y evolución.
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

    // Esenciales (%)
    const ratioPct = num(root.querySelector('#ratioPct').value);
    const fev1PctPre = num(root.querySelector('#fev1PctPre').value);
    const fvcPctPre  = num(root.querySelector('#fvcPctPre').value);
    const fev1PctPost = num(root.querySelector('#fev1PctPost').value);
    const fvcPctPost  = num(root.querySelector('#fvcPctPost').value);

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

    // Patrón (clásico operativo)
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

    // Gravedad (GOLD clásico, usando FEV1% post si existe; si no, pre)
    const fev1ForSeverity = (fev1PctPost != null) ? fev1PctPost : fev1PctPre;
    let severity = null;
    if (isObs && fev1ForSeverity != null){
      const p = fev1ForSeverity;
      if (p >= 80) severity = 'Leve (FEV1 ≥80% pred)';
      else if (p >= 50) severity = 'Moderada (FEV1 50–79% pred)';
      else if (p >= 30) severity = 'Grave (FEV1 30–49% pred)';
      else severity = 'Muy grave (FEV1 <30% pred)';
    }

    // PBD clásica (solo si hay litros mínimos)
    const fev1PreL  = num(root.querySelector('#fev1PreL').value);
    const fev1PostL = num(root.querySelector('#fev1PostL').value);
    const fvcPreL   = num(root.querySelector('#fvcPreL').value);
    const fvcPostL  = num(root.querySelector('#fvcPostL').value);

    let pbd = null;

    const hasFev1Liters = (fev1PreL != null && fev1PostL != null && fev1PreL > 0);
    const hasFvcLiters  = (fvcPreL != null && fvcPostL != null && fvcPreL > 0);

    if (hasFev1Liters || hasFvcLiters){
      const parts = [];
      let positive = false;

      if (hasFev1Liters){
        const d = fev1PostL - fev1PreL;
        const pc = pctChange(fev1PostL, fev1PreL); // %
        const ok = (pc != null && pc >= 12) && (d >= 0.2);
        if (ok) positive = true;
        parts.push(`FEV1: Δ ${d.toFixed(2)} L · ${pc?.toFixed(1)}% ${ok ? '→ cumple (≥12% y ≥200 ml)' : ''}`);
      } else {
        parts.push('FEV1: (faltan litros pre/post para calcular criterio clásico)');
      }

      if (hasFvcLiters){
        const d = fvcPostL - fvcPreL;
        const pc = pctChange(fvcPostL, fvcPreL);
        const ok = (pc != null && pc >= 12) && (d >= 0.2);
        if (ok) positive = true;
        parts.push(`FVC: Δ ${d.toFixed(2)} L · ${pc?.toFixed(1)}% ${ok ? '→ cumple (≥12% y ≥200 ml)' : ''}`);
      } else {
        parts.push('FVC: (opcional; si no pones litros, solo valoro FEV1)');
      }

      pbd = { positive, detail: parts.join('<br>') };
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
        <div style="margin-top:10px;"><strong>PBD (clásica):</strong> ${pbd.positive ? 'Positiva' : 'No positiva'} (≥12% y ≥200 ml en FEV1 o FVC)</div>
        <div class="small" style="margin-top:6px;">${pbd.detail}</div>
        <div class="small" style="margin-top:10px;">Nota: PBD positiva no equivale automáticamente a asma; integrar con clínica y evolución.</div>
      ` : `
        <div class="small" style="margin-top:10px;">
          PBD clásica: si quieres que la app la calcule, abre el desplegable y rellena al menos FEV1 pre/post (L).
        </div>
      `}
    `;

    out.className = 'result';
    out.innerHTML = html;
  });
}
