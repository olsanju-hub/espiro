// js/discurso.js
import { escapeHTML, pad3 } from './utils.js';

export function initDiscurso(){
  const panel = document.getElementById('discPanel');
  const body = document.getElementById('discBody');
  const titleEl = document.getElementById('discTitle');
  const closeBtn = document.getElementById('discClose');

  let cache = null;          // JSON ya parseado
  let lastLoadedAt = 0;      // para recargar si cambia

  function open(){
    panel.classList.add('isOpen');
    panel.setAttribute('aria-hidden','false');
  }
  function close(){
    panel.classList.remove('isOpen');
    panel.setAttribute('aria-hidden','true');
  }
  function toggle(){
    panel.classList.contains('isOpen') ? close() : open();
  }

  closeBtn?.addEventListener('click', close);

  async function load(force=false){
    // recarga cada 30s si force=false (por si editas el json en vivo)
    const now = Date.now();
    if (!force && cache && (now - lastLoadedAt) < 30000) return cache;

    try{
      // Ruta explícita a raíz + cache-buster
      const url = `./discourse.json?v=${now}`;
      const res = await fetch(url, { cache: 'no-store' });

      if (!res.ok){
        throw new Error(`No se pudo cargar discourse.json (HTTP ${res.status})`);
      }

      const data = await res.json();
      cache = data;
      lastLoadedAt = now;
      return data;
    }catch(err){
      cache = null;
      lastLoadedAt = now;
      throw err;
    }
  }

  function renderError(err){
    const msg = (err && err.message) ? err.message : String(err || 'Error desconocido');
    body.innerHTML = `
      <div class="small" style="color:rgba(255,255,255,.85);">
        <strong>Error cargando discourse.json</strong><br>
        ${escapeHTML(msg)}<br><br>
        Comprueba que el archivo está en la raíz (junto a index.html) y que se abre en:<br>
        <code style="color:rgba(255,255,255,.85)">http://127.0.0.1:5500/discourse.json</code>
      </div>
    `;
  }

  function renderNoSlide(key){
    body.innerHTML = `<div class="small">Sin discurso para la diapositiva <strong>${escapeHTML(key)}</strong>.</div>`;
  }

  function renderSlide(key, entry){
    // entry puede ser string o {title,text}
    let slideTitle = '';
    let slideText = '';

    if (typeof entry === 'string'){
      slideText = entry;
    } else if (entry && typeof entry === 'object'){
      slideTitle = (typeof entry.title === 'string') ? entry.title : '';
      slideText  = (typeof entry.text === 'string') ? entry.text : '';
    }

    if (!slideText){
      body.innerHTML = `<div class="small">La diapositiva <strong>${escapeHTML(key)}</strong> existe pero no tiene <code>text</code>.</div>`;
      return;
    }

    const paragraphs = String(slideText)
      .split(/\n+/)
      .map(s => s.trim())
      .filter(Boolean);

    body.innerHTML = `
      ${slideTitle ? `<div style="font-weight:800; margin-bottom:10px;">${escapeHTML(slideTitle)}</div>` : ``}
      ${paragraphs.map(p => `<p>${escapeHTML(p)}</p>`).join('')}
    `;
  }

  async function setSlide(n){
    const key = pad3(n);
    titleEl.textContent = `Discurso · ${key}`;

    try{
      const data = await load(false);

      if (!data || typeof data !== 'object' || !data.slides || typeof data.slides !== 'object'){
        body.innerHTML = `<div class="small"><strong>Formato inválido</strong>: falta <code>slides</code> en discourse.json.</div>`;
        return;
      }

      const entry = data.slides[key];
      if (!entry){
        renderNoSlide(key);
        return;
      }

      renderSlide(key, entry);
    }catch(err){
      renderError(err);
    }
  }

  // Extra: método para forzar recarga manual si lo necesitas en dev
  async function reload(){
    cache = null;
    lastLoadedAt = 0;
    try{
      await load(true);
    }catch(_){}
  }

  return { open, close, toggle, setSlide, reload };
}