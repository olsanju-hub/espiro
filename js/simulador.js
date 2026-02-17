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
        <!-- 1) Medidas basales -->
        <div class="card" style="border-radius:16px;">
          <strong>1) Basal</strong>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 pre (L)</label>
              <input inputmode="decimal" id="fev1Pre" placeholder="Ej: 2.10" />
            </div>
            <div class="field">
              <label>FVC pre (L)</label>
              <input inputmode="decimal" id="fvcPre" placeholder="Ej: 3.40" />
            </div>
          </div>

          <div class="card" style="border-radius:14px; margin-top:10px;">
            <strong>Valores de referencia (opcional)</strong>
            <div class="row2" style="margin-top:10px;">
              <div class="field">
                <label>FEV1 pred (L)</label>
                <input inputmode="decimal" id="fev1Pred" placeholder="Ej: 3.20" />
              </div>
              <div class="field">
                <label>FVC pred (L)</label>
                <input inputmode="decimal" id="fvcPred" placeholder="Ej: 4.10" />
              </div>
            </div>
            <div class="small">Si los introduces, la app calcula FEV1% y FVC% pred automáticamente si dejas vacíos los campos de %.</div>
          </div>
        </div>

        <!-- 2) Umbral FEV1/FVC -->
        <div class="card" style="border-radius:16px; margin-top:12px;">
          <strong>2) Umbral FEV1/FVC</strong>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>Modo</label>
              <select id="ratioMode">
                <option value="fixed" selected>Fijo 0,70</option>
                <option value="lln">LLN (si lo tienes)</option>
              </select>
            </div>
            <div class="field">
              <label>LLN (si modo LLN)</label>
              <input inputmode="decimal" id="llnRatio" placeholder="Ej: 0.68" />
            </div>
          </div>
          <div class="small">Por defecto usa 0,70. Si eliges LLN, se usa el valor que introduzcas.</div>
        </div>

        <!-- 3) %pred (puede venir por cálculo o manual) -->
        <div class="card" style="border-radius:16px; margin-top:12px;">
          <strong>3) % predicho</strong>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 % pred (opcional)</label>
              <input inputmode="decimal" id="fev1Pct" placeholder="Ej: 62" />
              <div class="small">Si lo dejas vacío y pusiste FEV1 pred (L), lo calculo.</div>
            </div>
            <div class="field">
              <label>FVC % pred (recomendado)</label>
              <input inputmode="decimal" id="fvcPct" placeholder="Ej: 74" />
              <div class="small">Si lo dejas vacío y pusiste FVC pred (L), lo calculo.</div>
            </div>
          </div>
        </div>

        <!-- 4) PBD -->
        <div class="card" style="border-radius:16px; margin-top:12px;">
          <strong>4) Prueba broncodilatadora (PBD)</strong>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 post (L)</label>
              <input inputmode="decimal" id="fev1Post" placeholder="Ej: 2.35" />
            </div>
            <div class="field">
              <label>FVC post (L)</label>
              <input inputmode="decimal" id="fvcPost" placeholder="Ej: 3.55" />
            </div>
          </div>
          <div class="small">Positiva si ≥12% y ≥200 ml en FEV1 o FVC (vs basal).</div>
        </div>

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

    const fev1Pre = num(root.querySelector('#fev1Pre').value);
    const fvcPre  = num(root.querySelector('#fvcPre').value);
    const fev1Pred = num(root.querySelector('#fev1Pred').value);
    const fvcPred  = num(root.querySelector('#fvcPred').value);

    let fev1Pct = num(root.querySelector('#fev1Pct').value);
    let fvcPct  = num(root.querySelector('#fvcPct').value);

    if (fev1Pre == null || fvcPre == null || fvcPre <= 0){
      out.className = 'result warn';
      out.textContent = 'Faltan FEV1 pre y/o FVC pre (en litros).';
      return;
    }

    // Autocalcular %pred si posible y no se ha puesto
    if (fev1Pct == null && fev1Pred != null && fev1Pred > 0){
      fev1Pct = (fev1Pre / fev1Pred) * 100;
    }
    if (fvcPct == null && fvcPred != null && fvcPred > 0){
      fvcPct = (fvcPre / fvcPred) * 100;
    }

    const ratio = fev1Pre / fvcPre;

    const mode = root.querySelector('#ratioMode').value;
    let cutoff = 0.70;
    if (mode === 'lln'){
      const lln = num(root.querySelector('#llnRatio').value);
      if (lln == null || lln <= 0 || lln >= 1){
        out.className = 'result warn';
        out.textContent = 'Modo LLN seleccionado: introduce un LLN válido (ej. 0.68).';
        return;
      }
      cutoff = lln;
    }

    const hasFvcPct = (fvcPct != null);
    const isObs = ratio < cutoff;
    const isLowFvc = hasFvcPct ? (fvcPct < 80) : false;

    let pattern = 'Indeterminado';
    let patternWhy = [];

    if (isObs && hasFvcPct && isLowFvc) {
      pattern = 'Mixto (obstrucción + posible restricción)';
      patternWhy.push(`FEV1/FVC ${ratio.toFixed(2)} < ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} < 80`);
      patternWhy.push('Confirmar restricción con volúmenes pulmonares si es relevante clínicamente.');
    } else if (isObs) {
      pattern = 'Obstructivo';
      patternWhy.push(`FEV1/FVC ${ratio.toFixed(2)} < ${cutoff.toFixed(2)}`);
    } else if (!isObs && hasFvcPct && isLowFvc) {
      pattern = 'Sugerente de restricción';
      patternWhy.push(`FEV1/FVC ${ratio.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} < 80`);
      patternWhy.push('Confirmar restricción con TLC/volúmenes si procede.');
    } else if (!isObs && hasFvcPct && !isLowFvc) {
      pattern = 'Normal (según estos parámetros)';
      patternWhy.push(`FEV1/FVC ${ratio.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} ≥ 80`);
    } else {
      pattern = isObs ? 'Obstructivo' : 'Sin obstrucción por ratio; falta FVC %pred para clasificar restricción';
      if (!hasFvcPct) patternWhy.push('Falta FVC %pred (o FVC pred): no puedo clasificar restricción/mixto con seguridad.');
    }

    // Gravedad (si obstructivo/mixto y hay FEV1% pred)
    let severity = null;
    if (isObs && fev1Pct != null){
      const p = fev1Pct;
      if (p >= 80) severity = 'Leve (FEV1 ≥80% pred)';
      else if (p >= 50) severity = 'Moderada (FEV1 50–79% pred)';
      else if (p >= 30) severity = 'Grave (FEV1 30–49% pred)';
      else severity = 'Muy grave (FEV1 <30% pred)';
    }

    // PBD
    const fev1Post = num(root.querySelector('#fev1Post').value);
    const fvcPost  = num(root.querySelector('#fvcPost').value);

    let pbd = null;
    if (fev1Post != null || fvcPost != null){
      const parts = [];
      let positive = false;

      if (fev1Post != null){
        const d = fev1Post - fev1Pre;
        const pc = pctChange(fev1Post, fev1Pre);
        const ok = (pc != null && pc >= 12) && (d >= 0.2);
        if (ok) positive = true;
        parts.push(`FEV1: +${d.toFixed(2)} L (${pc?.toFixed(1)}%) ${ok ? '→ cumple' : ''}`);
      }

      if (fvcPost != null){
        const d = fvcPost - fvcPre;
        const pc = pctChange(fvcPost, fvcPre);
        const ok = (pc != null && pc >= 12) && (d >= 0.2);
        if (ok) positive = true;
        parts.push(`FVC: +${d.toFixed(2)} L (${pc?.toFixed(1)}%) ${ok ? '→ cumple' : ''}`);
      }

      pbd = { positive, detail: parts.join('<br>') };
    }

    const html = `
      <div style="font-size:18px;"><strong>FEV1/FVC:</strong> ${ratio.toFixed(2)} (umbral ${cutoff.toFixed(2)} · ${mode === 'fixed' ? '0,70' : 'LLN'})</div>
      <div style="margin-top:10px;"><strong>Patrón:</strong> ${escapeHTML(pattern)}</div>
      <div class="small" style="margin-top:6px;">${patternWhy.map(x=>`• ${escapeHTML(x)}`).join('<br>')}</div>

      <div style="margin-top:10px;"><strong>% pred:</strong>
        FEV1 ${fev1Pct != null ? fev1Pct.toFixed(0)+'%' : '—'} ·
        FVC ${fvcPct != null ? fvcPct.toFixed(0)+'%' : '—'}
      </div>

      ${severity ? `<div style="margin-top:6px;"><strong>Gravedad obstrucción:</strong> ${escapeHTML(severity)}</div>` : ''}

      ${pbd ? `
        <div style="margin-top:10px;"><strong>PBD:</strong> ${pbd.positive ? 'Positiva' : 'No positiva por criterio ≥12% y ≥200 ml'}</div>
        <div class="small" style="margin-top:6px;">${pbd.detail}</div>
      ` : ''}

      <div class="small" style="margin-top:10px;">
        Nota: PBD positiva no equivale automáticamente a asma; integrar con clínica y evolución.
      </div>
    `;

    out.className = 'result';
    out.innerHTML = html;
  });
}
