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
      <div class="small">Recordatorio: interpretar solo si la prueba es aceptable y reproducible.</div>

      <form class="form" id="formSim" style="margin-top:10px;">

        <!-- ESENCIAL (siempre visible) -->
        <div class="card" style="border-radius:16px;">
          <strong>1) Basal (imprescindible)</strong>

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

          <div class="field" style="margin-top:10px;">
            <label>FVC % pred (recomendado para restricción/mixto)</label>
            <input inputmode="decimal" id="fvcPct" placeholder="Ej: 74" />
            <div class="small">Umbral operativo: FVC &lt; 80% pred sugiere restricción (confirmar con volúmenes si procede).</div>
          </div>
        </div>

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
              <div class="small" id="llnHint" style="display:none;">Introduce un LLN válido (0&lt;LLN&lt;1).</div>
            </div>
          </div>

          <div class="small">Por defecto usa 0,70. Si eliges LLN, se usa el valor que introduzcas.</div>
        </div>

        <!-- OPCIONALES (plegados) -->
        <details class="card" style="border-radius:16px; margin-top:12px;">
          <summary style="cursor:pointer; user-select:none;">
            <strong>Opcionales (desplegar si los tienes)</strong>
            <span class="small" style="margin-left:8px;">% pred, valores teóricos, PBD post</span>
          </summary>

          <div style="margin-top:12px;">
            <div class="card" style="border-radius:14px;">
              <strong>Valores teóricos (predicho, en L)</strong>
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
              <div class="small">
                Si los introduces, la app puede (1) autocalcular % pred si lo dejas vacío, y (2) evaluar PBD por criterio ≥10% del valor teórico.
              </div>
            </div>

            <div class="card" style="border-radius:14px; margin-top:12px;">
              <strong>% predicho (si te lo dan ya calculado)</strong>
              <div class="row2" style="margin-top:10px;">
                <div class="field">
                  <label>FEV1 % pred (opcional; gravedad)</label>
                  <input inputmode="decimal" id="fev1Pct" placeholder="Ej: 62" />
                  <div class="small">Si lo dejas vacío y pusiste FEV1 pred (L), lo calculo.</div>
                </div>
                <div class="field">
                  <label>FVC % pred (si prefieres ponerlo aquí)</label>
                  <input inputmode="decimal" id="fvcPct2" placeholder="Ej: 74" />
                  <div class="small">Si rellenas este, se usa en lugar del FVC % pred de arriba.</div>
                </div>
              </div>
            </div>

            <div class="card" style="border-radius:14px; margin-top:12px;">
              <strong>Prueba broncodilatadora (PBD) post</strong>
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

              <div class="small" style="margin-top:8px;">
                Criterio principal si hay “predicho”: positiva si ΔFEV1 o ΔFVC ≥10% del valor teórico (predicho). Si no hay predicho, se usa criterio alternativo ≥12% del basal y ≥200 mL.
              </div>

              <div class="small" style="margin-top:8px;">
                Nota: PBD positiva no equivale automáticamente a asma; integrar con clínica y evolución. 
              </div>
            </div>
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

  // UI: hint LLN
  const ratioModeEl = root.querySelector('#ratioMode');
  const llnHint = root.querySelector('#llnHint');
  ratioModeEl.addEventListener('change', ()=>{
    llnHint.style.display = (ratioModeEl.value === 'lln') ? 'block' : 'none';
  });

  root.querySelector('#resetBtn').addEventListener('click', ()=>{
    form.reset();
    llnHint.style.display = 'none';
    out.className = 'result warn';
    out.textContent = 'Introduce datos y pulsa “Interpretar”.';
  });

  form.addEventListener('submit', (e)=>{
    e.preventDefault();

    const fev1Pre = num(root.querySelector('#fev1Pre').value);
    const fvcPre  = num(root.querySelector('#fvcPre').value);

    if (fev1Pre == null || fvcPre == null || fvcPre <= 0){
      out.className = 'result warn';
      out.textContent = 'Faltan FEV1 pre y/o FVC pre (en litros).';
      return;
    }

    // FVC % pred: puede venir del campo esencial o del opcional
    const fvcPctEssential = num(root.querySelector('#fvcPct').value);
    const fvcPctOptional  = num(root.querySelector('#fvcPct2').value);
    const fvcPct = (fvcPctOptional != null) ? fvcPctOptional : fvcPctEssential;

    const ratio = fev1Pre / fvcPre;

    // Umbral
    const mode = ratioModeEl.value;
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

    // Patrón
    let pattern = 'Indeterminado';
    let patternWhy = [];

    if (isObs && hasFvcPct && isLowFvc) {
      pattern = 'Mixto (obstrucción + posible restricción)';
      patternWhy.push(`FEV1/FVC ${ratio.toFixed(2)} < ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} < 80`);
      patternWhy.push('Confirmar restricción con volúmenes pulmonares si es relevante clínicamente.');
    } else if (isObs) {
      pattern = 'Obstructivo';
      patternWhy.push(`FEV1/FVC ${ratio.toFixed(2)} < ${cutoff.toFixed(2)}`);
      if (!hasFvcPct) patternWhy.push('Falta FVC % pred: no puedo valorar componente restrictivo/mixto.');
    } else if (!isObs && hasFvcPct && isLowFvc) {
      pattern = 'Sugerente de restricción';
      patternWhy.push(`FEV1/FVC ${ratio.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} < 80`);
      patternWhy.push('Confirmar restricción con TLC/volúmenes si procede.');
    } else if (!isObs && hasFvcPct && !isLowFvc) {
      pattern = 'Normal (según estos parámetros)';
      patternWhy.push(`FEV1/FVC ${ratio.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} ≥ 80`);
    } else {
      pattern = isObs ? 'Obstructivo' : 'Sin obstrucción por ratio; falta FVC % pred';
      patternWhy.push('Falta FVC % pred: añade el % predicho para poder clasificar restricción/mixto.');
    }

    // Gravedad (solo si hay FEV1 % pred)
    const fev1Pred = num(root.querySelector('#fev1Pred').value);
    const fvcPred  = num(root.querySelector('#fvcPred').value);
    let fev1Pct = num(root.querySelector('#fev1Pct').value);

    // Autocalcular FEV1% pred si posible
    if (fev1Pct == null && fev1Pred != null && fev1Pred > 0){
      fev1Pct = (fev1Pre / fev1Pred) * 100;
    }

    let severity = null;
    if (isObs && fev1Pct != null){
      const p = fev1Pct;
      if (p >= 80) severity = 'Leve (FEV1 ≥80% pred)';
      else if (p >= 50) severity = 'Moderada (FEV1 50–79% pred)';
      else if (p >= 30) severity = 'Grave (FEV1 30–49% pred)';
      else severity = 'Muy grave (FEV1 <30% pred)';
    }

    // PBD (si hay post)
    const fev1Post = num(root.querySelector('#fev1Post').value);
    const fvcPost  = num(root.querySelector('#fvcPost').value);

    let pbd = null;
    if (fev1Post != null || fvcPost != null){
      const parts = [];
      let positive = false;

      // Helpers: criterio 10% del teórico si hay pred; si no, fallback clásico 12% basal + 0.2L
      function evalDelta(name, post, pre, pred){
        const d = (post != null) ? (post - pre) : null;
        if (d == null) return null;

        const pcBasal = pctChange(post, pre); // % sobre basal
        const absOk = d >= 0.2;
        const pcOk = (pcBasal != null && pcBasal >= 12);

        const predPct = (pred != null && pred > 0) ? (d / pred * 100) : null;
        const predOk = (predPct != null && predPct >= 10);

        // Regla: si hay pred -> manda predOk; si no -> usa clásico
        const ok = (predPct != null) ? predOk : (pcOk && absOk);

        const detail = (predPct != null)
          ? `${name}: Δ ${d.toFixed(2)} L = ${(predPct).toFixed(1)}% del teórico ${ok ? '→ cumple' : ''}`
          : `${name}: Δ ${d.toFixed(2)} L (${pcBasal?.toFixed(1)}% basal) ${ok ? '→ cumple (≥12% + ≥200 ml)' : ''}`;

        return { ok, detail };
      }

      const rFev1 = (fev1Post != null) ? evalDelta('FEV1', fev1Post, fev1Pre, fev1Pred) : null;
      const rFvc  = (fvcPost  != null) ? evalDelta('FVC',  fvcPost,  fvcPre,  fvcPred)  : null;

      if (rFev1?.ok || rFvc?.ok) positive = true;

      if (rFev1) parts.push(rFev1.detail);
      if (rFvc)  parts.push(rFvc.detail);

      pbd = { positive, detail: parts.join('<br>') };
    }

    const html = `
      <div style="font-size:18px;"><strong>FEV1/FVC:</strong> ${ratio.toFixed(2)} (umbral ${cutoff.toFixed(2)} · ${mode === 'fixed' ? '0,70' : 'LLN'})</div>

      <div style="margin-top:10px;"><strong>Patrón:</strong> ${escapeHTML(pattern)}</div>
      <div class="small" style="margin-top:6px;">${patternWhy.map(x=>`• ${escapeHTML(x)}`).join('<br>')}</div>

      <div style="margin-top:10px;"><strong>FVC % pred:</strong> ${fvcPct != null ? fvcPct.toFixed(0)+'%' : '—'}</div>

      ${severity ? `<div style="margin-top:6px;"><strong>Gravedad obstrucción:</strong> ${escapeHTML(severity)}</div>` : ''}

      ${pbd ? `
        <div style="margin-top:10px;"><strong>PBD:</strong> ${pbd.positive ? 'Positiva' : 'No positiva'} </div>
        <div class="small" style="margin-top:6px;">${pbd.detail}</div>
        <div class="small" style="margin-top:8px;">
          Nota: PBD positiva no equivale automáticamente a asma; integrar con clínica y evolución.
        </div>
      ` : ''}
    `;

    out.className = 'result';
    out.innerHTML = html;
  });
}
