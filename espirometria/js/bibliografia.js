// js/bibliografia.js
export function initBibliografia(router){
  const tab = document.getElementById('biblioTab');
  const panel = document.getElementById('biblioPanel');
  const closeBtn = document.getElementById('biblioClose');
  const body = document.getElementById('biblioBody');

  const open = () => { panel.classList.add('isOpen'); panel.setAttribute('aria-hidden','false'); };
  const close = () => { panel.classList.remove('isOpen'); panel.setAttribute('aria-hidden','true'); };

  tab.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  document.addEventListener('keydown', (e)=>{
    if (e.key === 'Escape') close();
  });

  // Lista (edítala a tu gusto; es “toda tu bibliografía subida” sin inventar fuentes externas)
  const refs = [
    'IPCRG. DTH No.14 Guía rápida para la espirometría (ES). 2023.',
    'García-Río F, et al. Recomendaciones para la espirometría. Arch Bronconeumol. 2013;49(9):388–401.',
    'Neumosur/semFYC/SEMERGEN-Andalucía. Documento de consenso sobre espirometría en Andalucía. Rev Esp Patol Torac. 2009;21(2):116–132.',
    'SEMERGEN. Manejo práctico del paciente con EPOC (documento “Safari.pdf” aportado).',
    'Rivero-Yeverino D. Espirometría. Rev Alerg Mex. 2019;66(1):76–84 (documento “espiro.pdf” aportado).',
    'Interpretación espirometría FAES (PDF aportado).',
    'Otros PDFs aportados en carpeta del proyecto (Espirometría.pdf, Guía Rápida.pdf, etc.).'
  ];

  body.innerHTML = `
    <ol>
      ${refs.map(r=>`<li>${escapeHTML(r)}</li>`).join('')}
    </ol>
    <small>Nota: la app no sustituye juicio clínico. Integrar siempre con contexto del paciente.</small>
  `;

  // Si cambias de ruta, cierra el panel para que no moleste
  const origGo = router.go.bind(router);
  router.go = (r)=>{
    close();
    origGo(r);
  };
}

function escapeHTML(s){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#039;");
}