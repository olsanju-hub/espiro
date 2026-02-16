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
      <form class="form" id="formSim">
        <div class="row2">
          <div class="field">
            <label>FEV1 pre (L)</label>
            <input inputmode="decimal" id="fev1Pre" placeholder="Ej: 2.10" />
          </div>
          <div class="field">
            <label>FVC pre (L)</label>
            <input inputmode="decimal" id="fvcPre" placeholder="Ej: 3.40" />
          </div>
        </div>

        <div class="row2">
          <div class="field">
            <label>FEV1 % pred (recomendado)</label>
            <input inputmode="decimal" id="fev1Pct" placeholder="Ej: 62" />
            <div class="small">Si lo aportas, la app puede confirmar normalidad y graduar obstrucción.</div>
          </div>
          <div class="field">
            <label>FVC % pred (recomendado)</label>
            <input inputmode="decimal" id="fvcPct" placeholder="Ej: 74" />
            <div class="small">Umbral operativo: FVC &lt; 80% pred sugiere restricción (orientativo; confirmar con volúmenes si procede).</div>
          </div>
        </div>

        <div class="card" style="border-radius:16px; margin-top:6px;">
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
          <div class="small">Por defecto usa 0,70. Si eliges LLN, se usa el valor que introduzcas.</div>
        </div>

        <div class="card" style="border-radius:16px; margin-top:12px;">
          <strong>Prueba broncodilatadora (PBD)</strong>
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
    const fev1Pct = num(root.querySelector('#fev1Pct').value);
    const fvcPct  = num(root.querySelector('#fvcPct').value);

    if (fev1Pre == null || fvcPre == null || fvcPre <= 0){
      out.className = 'result warn';
      out.textContent = 'Faltan FEV1 pre y/o FVC pre (en litros).';
      return;
    }

    const ratioPre = fev1Pre / fvcPre;

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

    const hasFev1Pct = (fev1Pct != null);
    const hasFvcPct  = (fvcPct != null);

    const isObs = ratioPre < cutoff;
    const isLowFvc = hasFvcPct ? (fvcPct < 80) : false;

    // Patrón (con aviso si faltan %pred)
    let pattern = 'Indeterminado';
    const why = [];

    if (isObs && hasFvcPct && isLowFvc){
      pattern = 'Mixto (obstrucción + posible restricción)';
      why.push(`FEV1/FVC pre ${ratioPre.toFixed(2)} < ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} < 80`);
      why.push('Confirmar restricción con volúmenes pulmonares (TLC/pletismografía) si procede.');
    } else if (isObs){
      pattern = 'Obstructivo';
      why.push(`FEV1/FVC pre ${ratioPre.toFixed(2)} < ${cutoff.toFixed(2)}`);
      if (!hasFev1Pct) why.push('Falta FEV1 %pred: no se puede graduar severidad.');
    } else if (!isObs && hasFvcPct && isLowFvc){
      pattern = 'Sugerente de restricción';
      why.push(`FEV1/FVC pre ${ratioPre.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} < 80`);
      why.push('Confirmar restricción con volúmenes pulmonares si es relevante clínicamente.');
    } else if (!isObs && hasFvcPct && !isLowFvc){
      // Aquí integramos FEV1%pred si lo tienes (tu punto 7)
      if (hasFev1Pct && fev1Pct < 80){
        pattern = 'Sin obstrucción por ratio; FEV1 %pred bajo (revisar contexto)';
        why.push(`FEV1/FVC pre ${ratioPre.toFixed(2)} ≥ ${cutoff.toFixed(2)} y FVC %pred ${fvcPct.toFixed(0)} ≥ 80`);
        why.push(`Pero FEV1 %pred ${fev1Pct.toFixed(0)} < 80: revisar calidad, técnica, y clínica.`);
      } else {
        pattern = 'Normal (según estos parámetros)';
        why.push(`FEV1/FVC pre ${ratioPre.toFixed(2)} ≥ ${cutoff.toFixed(2)}`);
        why.push(`FVC %pred ${fvcPct.toFixed(0)} ≥ 80`);
        if (hasFev1Pct) why.push(`FEV1 %pred ${fev1Pct.toFixed(0)} ≥ 80`);
        else why.push('Falta FEV1 %pred: normalidad “incompleta” (aporta FEV1 %pred si lo tienes).');
      }
    } else {
      pattern = isObs
        ? 'Obstructivo'
        : 'Sin obstrucción por ratio; faltan %pred para clasificar restricción/normalidad';
      if (!hasFvcPct) why.push('Falta FVC %pred: no puedo clasificar restricción/mixto con seguridad.');
      if (!hasFev1Pct) why.push('Falta FEV1 %pred: no puedo confirmar normalidad ni graduar.');
    }

    // Gravedad (solo si obstructivo/mixto y hay FEV1%pred)
    let severity = null;
    if ((pattern.startsWith('Obstructivo') || pattern.startsWith('Mixto')) && hasFev1Pct){
      const p = fev1Pct;
      if (p >= 80) severity = 'Leve (FEV1 ≥80% pred)';
      else if (p >= 50) severity = 'Moderada (FEV1 50–79% pred)';
      else if (p >= 30) severity = 'Grave (FEV1 30–49% pred)';
      else severity = 'Muy grave (FEV1 <30% pred)';
    }

    // PBD (cálculo directo, sin depender de pctChange())
    const fev1Post = num(root.querySelector('#fev1Post').value);
    const fvcPost  = num(root.querySelector('#fvcPost').value);

    const deltaInfo = (pre, post)=>{
      const d = post - pre;
      const pct = pre > 0 ? (d / pre) * 100 : null;
      return { d, pct };
    };

    let pbd = null;
    if (fev1Post != null || fvcPost != null){
      const parts = [];
      let positive = false;

      if (fev1Post != null){
        const { d, pct } = deltaInfo(fev1Pre, fev1Post);
        const ok = (d >= 0.20) && (pct != null && pct >= 12);
        if (ok) positive = true;
        parts.push(`FEV1: ${d>=0?'+':''}${d.toFixed(2)} L (${pct!=null ? pct.toFixed(1) : '—'}%) ${ok ? '→ cumple' : ''}`);
      }

      if (fvcPost != null){
        const { d, pct } = deltaInfo(fvcPre, fvcPost);
        const ok = (d >= 0.20) && (pct != null && pct >= 12);
        if (ok) positive = true;
        parts.push(`FVC: ${d>=0?'+':''}${d.toFixed(2)} L (${pct!=null ? pct.toFixed(1) : '—'}%) ${ok ? '→ cumple' : ''}`);
      }

      pbd = { positive, detail: parts.join('<br>') };
    }

    const html = `
      <div><strong>Patrón:</strong> ${escapeHTML(pattern)}</div>
      <div class="small" style="margin-top:6px;">${why.map(x=>`• ${escapeHTML(x)}`).join('<br>')}</div>

      <div style="margin-top:10px;"><strong>FEV1/FVC (pre):</strong> ${ratioPre.toFixed(2)} (umbral ${cutoff.toFixed(2)} · modo ${mode === 'fixed' ? '0,70' : 'LLN'})</div>

      ${hasFev1Pct ? `<div style="margin-top:6px;"><strong>FEV1 %pred:</strong> ${fev1Pct.toFixed(0)}%</div>` : ''}
      ${hasFvcPct ? `<div style="margin-top:6px;"><strong>FVC %pred:</strong> ${fvcPct.toFixed(0)}%</div>` : ''}

      ${severity ? `<div style="margin-top:10px;"><strong>Gravedad (si aplica):</strong> ${escapeHTML(severity)}</div>` : ''}

      ${pbd ? `
        <div style="margin-top:12px;"><strong>PBD:</strong> ${pbd.positive ? 'Positiva' : 'No positiva (≥12% y ≥200 ml)'}</div>
        <div class="small" style="margin-top:6px;">${pbd.detail}</div>
        <div class="small" style="margin-top:8px;">Nota: PBD positiva no equivale automáticamente a diagnóstico de asma; integrar con clínica y evolución.</div>
      ` : ''}

      <div class="small" style="margin-top:10px;">
        Recuerda: interpretar solo si aceptabilidad/repetibilidad son correctas.
      </div>
    `;

    out.className = 'result';
    out.innerHTML = html;
  });
}
