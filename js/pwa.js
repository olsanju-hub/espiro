// js/app.js
import { Router } from './router.js';
import { initDrawer } from './drawer.js';
import { initBibliografia } from './bibliografia.js';
import { initModal } from './gallery.js';
import { initPWA } from './pwa.js';initPWA

import { renderPortada, renderMenu } from './routerViews.js';
import { renderTecnica } from './tecnica.js';
import { renderAlgoritmo } from './algoritmo.js';
import { renderSimulador } from './simulador.js';
import { renderEvaluacion } from './evaluacion.js';
import { initPresentacion } from './presentacion.js';

const els = {
  view: document.getElementById('view'),
  topbar: document.getElementById('topbar'),
  drawer: document.getElementById('drawer'),
  drawerBtn: document.getElementById('drawerBtn'),
  biblioTab: document.getElementById('biblioTab'),
};

const router = new Router({
  onRoute: (route) => {
    // Vistas “sin chrome”
    const noChrome = (route === 'portada' || route === 'menu' || route === 'presentacion');
    els.topbar.setAttribute('aria-hidden', noChrome ? 'true' : 'false');
    els.biblioTab.classList.toggle('isHidden', noChrome);

    // Drawer solo en internas
    if (noChrome) {
      els.drawer.classList.remove('isOpen');
      els.drawer.setAttribute('aria-hidden', 'true');
    }

    // Render
    els.view.innerHTML = '';
    switch(route){
      case 'portada': renderPortada(els.view, router); break;
      case 'menu': renderMenu(els.view, router); break;
      case 'tecnica': renderTecnica(els.view); break;
      case 'algoritmo': renderAlgoritmo(els.view); break;
      case 'simulador': renderSimulador(els.view); break;
      case 'evaluacion': renderEvaluacion(els.view); break;
      case 'presentacion': /* se abre desde presentacion.js */ break;
      default: router.go('portada'); return;
    }
  }
});

initDrawer(router);
initBibliografia(router);
initModal();
initPresentacion(router);
initPWA();

router.start();
