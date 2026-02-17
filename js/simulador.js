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

        <!-- IMPRESCINDIBLE (sin scroll excesivo; lo demás plegado) -->
        <div class="card" style="border-radius:16px;">
          <strong>Imprescindible (como en el informe)</strong>

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

          <div class="row2" style="margin-top:12px;">
            <div class="field">
              <label>FEV1 %REF</label>
              <input inputmode="decimal" id="fev1Pct" placeholder="Ej: 62" />
            </div>
            <div class="field">
              <label>FVC %REF</label>
              <input inputmode="decimal" id="fvcPct" placeholder="Ej: 74" />
            </div>
          </div>

          <div class="field" style="margin-top:10px;">
            <label>FEV1/FVC %REF</label>
            <input inputmode="decimal" id="ratioPct" placeholder="Ej: 78" />
            <div class="small">Este %REF se muestra y se conserva como en el informe. La obstrucción se decide por el umbral (0,70 o LLN).</div>
          </div>
        </div>

        <!-- PBD (imprescindible) -->
        <div class="card" style="border-radius:16px; margin-top:12px;">
          <strong>PBD (post broncodilatador)</strong>
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
          <div class="small">Criterio clásico en app: positiva si ≥12% y ≥200 mL en FEV1 o FVC (vs basal). (Nota clínica: PBD positiva ≠ asma).</div>
        </div>

        <!-- OPCIONALES (plegados) -->
        <details style="margin-top:12px;">
          <summary class="small" style="cursor:pointer;"><strong>Opcional:</strong> umbral y valores teóricos</summary>

          <div class="card" style="border-radius:16px; margin-top:10px;">
            <strong>Umbral FEV1/FVC</strong>
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
            <div class="small">Por defecto usa 0,70 (como tu algoritmo). Si eliges LLN, se usa el valor que introduzcas.</div>
          </div>

          <div class="card" style="border-radius:16px; margin-top:10px;">
            <strong>Pred (L) (si los tienes)</strong>
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
            <div class="small">Si introduces pred (L) y dejas %REF vacíos, la app los calcula.</div>
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

    let fev1Pct = num(root.querySelector('#fev1Pct').value); // %REF
    let fvcPct  = num(root.querySelector('#fvcPct').value);  // %REF
    const ratioPct = num(root.querySelector('#ratioPct').value); // %REF ratio (solo informativo)

    // opcionales
    const fev1Pred = num(root.querySelector('#fev1Pred')?.value);
    const fvcPred  = num(root.querySelector('#fvcPred')?.value);

    if (fev1Pre == null || fvcPre == null || fvcPre <= 0){
      out.className = 'result warn';
      out.textContent = 'Faltan FEV1 pre y/o FVC pre (en litros).';
      return;
    }

    // Si %REF faltan pero hay pred(L), los calculo
    if (fev1Pct == null && fev1Pred != null && fev1Pred > 0){
      fev1Pct = (fev1Pre / fev1Pred) * 100;
    }
    if (fvcPct == null && fvcPred != null && fvcPred > 0){
      fvcPct = (fvcPre / fvcPred) * 100;
    }

    const ratio = fev1Pre / fvcPre;

    // Umbral ratio (por defecto fijo 0,70; LLN opcional si el usuario lo abre)
    const ratioModeEl = root.querySelector('#ratioMode');
    const mode = ratioModeEl ? ratioModeEl.value : 'fixed';
    let cutoff = 0.70;

    if (mode === 'lln'){
      const lln = num(root.querySelector('#llnRatio')?.value);
      if (lln == null || lln <= 0 || lln >= 1){
        out.className = 'result warn';
        out.textContent = 'Modo LLN seleccionado: introduce un LLN válido (ej. 0.68).';
        return;
      }
      cutoff = lln;
    }

    // Patrón (coherente con tu algoritmo: obstrucción por ratio; restricción/mixto por FVC %REF <80)
    const hasFvcPct = (fvcPct != null);
    const isObs = ratio < cutoff;
    const isLowFvc = hasFvcPct ? (fvcPct < 80) : false;

    let pattern = 'Indeterminado';
    const why = [];

    if (isObs && hasFvcPct && isLowFvc){
      pattern = 'Patrón mixto (obstrucción + posible restricción)';
      why.push(`FEV1/FVC ${ratio.toFixed(2)} < ${cutoff.toFixed(2)} y FVC %REF ${fvcPct.toFixed(0)} < 80`);
      why.push('Confirmar restricción con volúmenes (TLC) si procede.');
    } else if (isObs){
      pattern = 'Patrón obstructivo';
      why.push(`FEV1/FVC ${ratio.toFixed(2)} < ${cutoff.toFixed(2)}`);
      if (hasFvcPct) why.push(`FVC %REF ${fvcPct.toFixed(0)} ${isLowFvc ? '< 80 (ojo mixto si se confirma)' : '≥ 80'}`);
    } else if (!isObs && hasFvcPct && isLowFvc){
      pattern = 'Patrón restrictivo (sugerente)';
      why.push(`FEV1/FVC ${ratio.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %REF ${fvcPct.toFixed(0)} < 80`);
      why.push('Confirmar restricción con TLC/volúmenes si procede.');
    } else if (!isObs && hasFvcPct && !isLowFvc){
      pattern = 'Patrón normal (con estos parámetros)';
      why.push(`FEV1/FVC ${ratio.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %REF ${fvcPct.toFixed(0)} ≥ 80`);
    } else {
      pattern = isObs
        ? 'Obstructivo (pero falta FVC %REF para decidir mixto)'
        : 'Sin obstrucción por ratio; falta FVC %REF para decidir restricción';
      why.push('Falta FVC %REF (o FVC pred en L).');
    }

    // Gravedad (si obstructivo/mixto) por FEV1 %REF
    let severity = null;
    if ((pattern.startsWith('Patrón obstructivo') || pattern.startsWith('Patrón mixto')) && fev1Pct != null){
      const p = fev1Pct;
      if (p >= 80) severity = 'Leve (FEV1 ≥80% ref)';
      else if (p >= 50) severity = 'Moderada (FEV1 50–79% ref)';
      else if (p >= 30) severity = 'Grave (FEV1 30–49% ref)';
      else severity = 'Muy grave (FEV1 <30% ref)';
    }

    // PBD (clásico ≥12% y ≥200 mL en FEV1 o FVC)
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

      <div style="margin-top:8px;"><strong>%REF (informe):</strong>
        FEV1 ${fev1Pct != null ? fev1Pct.toFixed(0)+'%' : '—'} ·
        FVC ${fvcPct != null ? fvcPct.toFixed(0)+'%' : '—'} ·
        FEV1/FVC ${ratioPct != null ? ratioPct.toFixed(0)+'%' : '—'}
      </div>

      <div style="margin-top:10px;"><strong>Patrón:</strong> ${escapeHTML(pattern)}</div>
      <div class="small" style="margin-top:6px;">${why.map(x=>`• ${escapeHTML(x)}`).join('<br>')}</div>

      ${severity ? `<div style="margin-top:8px;"><strong>Gravedad (si obstructivo/mixto):</strong> ${escapeHTML(severity)}</div>` : ''}

      ${pbd ? `
        <div style="margin-top:10px;"><strong>PBD:</strong> ${pbd.positive ? 'Positiva' : 'No positiva'} <span class="small">(≥12% y ≥200 mL en FEV1 o FVC)</span></div>
        <div class="small" style="margin-top:6px;">${pbd.detail}</div>
        <div class="small" style="margin-top:8px; opacity:.75;">Nota: PBD positiva ≠ asma. Integrar con clínica y evolución.</div>
      ` : ''}
    `;

    out.className = 'result';
    out.innerHTML = html;
  });
}
