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
      <div class="small">Recordatorio: interpretar solo si la maniobra es aceptable y reproducible.</div>

      <form class="form" id="formSim" style="margin-top:10px;">
        <!-- 1) BASAL (imprescindible) -->
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

          <div class="small" style="margin-top:8px;">
            <strong>FEV1/FVC (calculado):</strong> <span id="ratioLive">—</span>
          </div>

          <!-- opcional plegado -->
          <details style="margin-top:10px;">
            <summary class="small" style="cursor:pointer;"><strong>Opcional:</strong> valores predichos en litros (si tu informe los trae)</summary>
            <div class="card" style="border-radius:14px; margin-top:10px;">
              <strong>Pred (L)</strong>
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
              <div class="small">Si los introduces, la app puede calcular FEV1% y FVC% pred si dejas vacíos los campos de %.</div>
            </div>
          </details>
        </div>

        <!-- 2) UMBRAL FEV1/FVC -->
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

        <!-- 3) % PREDICHO (según tu algoritmo) -->
        <div class="card" style="border-radius:16px; margin-top:12px;">
          <strong>3) % predicho</strong>
          <div class="row2" style="margin-top:10px;">
            <div class="field">
              <label>FEV1 % pred (recomendado para gravedad)</label>
              <input inputmode="decimal" id="fev1Pct" placeholder="Ej: 62" />
              <div class="small">Si lo dejas vacío y pusiste FEV1 pred (L), lo calculo.</div>
            </div>
            <div class="field">
              <label>FVC % pred (clave para restricción/mixto)</label>
              <input inputmode="decimal" id="fvcPct" placeholder="Ej: 74" />
              <div class="small">Si lo dejas vacío y pusiste FVC pred (L), lo calculo.</div>
            </div>
          </div>
        </div>

        <!-- 4) PBD (clásico: ≥12% y ≥200 mL vs basal, en FEV1 o FVC) -->
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
          <div class="small">Criterio clásico: positiva si cumple <strong>≥12% y ≥200 mL</strong> en <strong>FEV1 o FVC</strong> (vs basal).</div>
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

  const fev1PreEl = root.querySelector('#fev1Pre');
  const fvcPreEl  = root.querySelector('#fvcPre');
  const ratioLive = root.querySelector('#ratioLive');

  function updateRatioLive(){
    const fev1Pre = num(fev1PreEl.value);
    const fvcPre  = num(fvcPreEl.value);
    if (fev1Pre == null || fvcPre == null || fvcPre <= 0){
      ratioLive.textContent = '—';
      return;
    }
    const ratio = fev1Pre / fvcPre;
    ratioLive.textContent = `${ratio.toFixed(2)} (${Math.round(ratio*100)}%)`;
  }

  fev1PreEl.addEventListener('input', updateRatioLive);
  fvcPreEl.addEventListener('input', updateRatioLive);

  root.querySelector('#resetBtn').addEventListener('click', ()=>{
    form.reset();
    ratioLive.textContent = '—';
    out.className = 'result warn';
    out.textContent = 'Introduce datos y pulsa “Interpretar”.';
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    const fev1Pre = num(root.querySelector('#fev1Pre').value);
    const fvcPre  = num(root.querySelector('#fvcPre').value);

    const fev1Pred = num(root.querySelector('#fev1Pred')?.value);
    const fvcPred  = num(root.querySelector('#fvcPred')?.value);

    let fev1Pct = num(root.querySelector('#fev1Pct').value);
    let fvcPct  = num(root.querySelector('#fvcPct').value);

    if (fev1Pre == null || fvcPre == null || fvcPre <= 0){
      out.className = 'result warn';
      out.textContent = 'Faltan FEV1 pre y/o FVC pre (en litros).';
      return;
    }

    // Autocalcular %pred si hay pred(L) y % vacío
    if (fev1Pct == null && fev1Pred != null && fev1Pred > 0){
      fev1Pct = (fev1Pre / fev1Pred) * 100;
    }
    if (fvcPct == null && fvcPred != null && fvcPred > 0){
      fvcPct = (fvcPre / fvcPred) * 100;
    }

    const ratio = fev1Pre / fvcPre;

    // Umbral ratio
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

    // Clasificación (coherente con tu diagrama)
    const hasFvcPct = (fvcPct != null);
    const isObs = ratio < cutoff;
    const isLowFvc = hasFvcPct ? (fvcPct < 80) : false;

    let pattern = 'Indeterminado';
    const why = [];

    if (isObs && hasFvcPct && isLowFvc){
      pattern = 'Patrón mixto (obstrucción + posible restricción)';
      why.push(`FEV1/FVC ${ratio.toFixed(2)} < ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} < 80`);
      why.push('Si importa clínicamente, confirmar restricción con volúmenes (TLC).');
    } else if (isObs){
      pattern = 'Patrón obstructivo';
      why.push(`FEV1/FVC ${ratio.toFixed(2)} < ${cutoff.toFixed(2)}`);
      if (hasFvcPct) why.push(`FVC %pred ${fvcPct.toFixed(0)} ${isLowFvc ? '< 80 (ojo: podría ser mixto si se confirma)' : '≥ 80 (no sugiere restricción por %pred)'}`);
    } else if (!isObs && hasFvcPct && isLowFvc){
      pattern = 'Patrón restrictivo (sugerente)';
      why.push(`FEV1/FVC ${ratio.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} < 80`);
      why.push('Confirmar restricción con TLC/volúmenes si procede.');
    } else if (!isObs && hasFvcPct && !isLowFvc){
      pattern = 'Patrón normal (con estos parámetros)';
      why.push(`FEV1/FVC ${ratio.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} ≥ 80`);
    } else {
      pattern = isObs
        ? 'Obstructivo (pero falta FVC %pred para decidir mixto)'
        : 'Sin obstrucción por ratio; falta FVC %pred para decidir restricción';
      why.push('Falta FVC %pred (o FVC pred en L).');
    }

    // Gravedad (GOLD) por FEV1% pred si hay obstrucción
    let severity = null;
    if (isObs && fev1Pct != null){
      const p = fev1Pct;
      if (p >= 80) severity = 'Leve (FEV1 ≥80% pred)';
      else if (p >= 50) severity = 'Moderada (FEV1 50–79% pred)';
      else if (p >= 30) severity = 'Grave (FEV1 30–49% pred)';
      else severity = 'Muy grave (FEV1 <30% pred)';
    }

    // PBD (clásico): positiva si cumple ≥12% y ≥200 mL en FEV1 o FVC
    const fev1Post = num(root.querySelector('#fev1Post').value);
    const fvcPost  = num(root.querySelector('#fvcPost').value);

    let pbd = null;
    if (fev1Post != null || fvcPost != null){
      const lines = [];
      let positive = false;

      if (fev1Post != null){
        const d = fev1Post - fev1Pre;
        const pc = pctChange(fev1Post, fev1Pre);
        const ok = (pc != null && pc >= 12) && (d >= 0.2);
        if (ok) positive = true;
        lines.push(`FEV1: ${d >= 0 ? '+' : ''}${d.toFixed(2)} L (${pc?.toFixed(1)}%) ${ok ? '→ cumple' : ''}`);
      } else {
        lines.push('FEV1: —');
      }

      if (fvcPost != null){
        const d = fvcPost - fvcPre;
        const pc = pctChange(fvcPost, fvcPre);
        const ok = (pc != null && pc >= 12) && (d >= 0.2);
        if (ok) positive = true;
        lines.push(`FVC: ${d >= 0 ? '+' : ''}${d.toFixed(2)} L (${pc?.toFixed(1)}%) ${ok ? '→ cumple' : ''}`);
      } else {
        lines.push('FVC: —');
      }

      pbd = { positive, detail: lines.join('<br>') };
    }

    const html = `
      <div style="font-size:18px;">
        <strong>FEV1/FVC:</strong> ${ratio.toFixed(2)} (${Math.round(ratio*100)}%)
        <span class="small">· umbral ${cutoff.toFixed(2)} (${mode === 'fixed' ? '0,70' : 'LLN'})</span>
      </div>

      <div style="margin-top:10px;"><strong>Patrón:</strong> ${escapeHTML(pattern)}</div>
      <div class="small" style="margin-top:6px;">${why.map(x=>`• ${escapeHTML(x)}`).join('<br>')}</div>

      <div style="margin-top:10px;">
        <strong>% pred:</strong>
        FEV1 ${fev1Pct != null ? fev1Pct.toFixed(0)+'%' : '—'} ·
        FVC ${fvcPct != null ? fvcPct.toFixed(0)+'%' : '—'}
      </div>

      ${severity ? `<div style="margin-top:6px;"><strong>Gravedad (si obstructivo):</strong> ${escapeHTML(severity)}</div>` : ''}

      ${pbd ? `
        <div style="margin-top:10px;"><strong>PBD:</strong> ${pbd.positive ? 'Positiva' : 'No positiva'} <span class="small">(criterio ≥12% y ≥200 mL en FEV1 o FVC)</span></div>
        <div class="small" style="margin-top:6px;">${pbd.detail}</div>
        <div class="small" style="margin-top:8px; opacity:.75;">Nota: PBD positiva ≠ asma. Integrar con clínica, evolución y contexto.</div>
      ` : ''}
    `;

    out.className = 'result';
    out.innerHTML = html;
  });
}
