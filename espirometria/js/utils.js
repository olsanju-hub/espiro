// js/utils.js
export function num(v){
  const x = Number(String(v).replace(',','.'));
  return Number.isFinite(x) ? x : null;
}
export function clamp(n, a, b){
  return Math.max(a, Math.min(b, n));
}
export function pad3(n){
  return String(n).padStart(3,'0');
}
export function pctChange(post, pre){
  if (pre === 0) return null;
  return ((post - pre) / pre) * 100;
}
export function escapeHTML(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}