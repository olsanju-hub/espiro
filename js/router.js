// js/router.js
export class Router{
  constructor({ onRoute }){
    this.onRoute = onRoute;
    this._bound = () => this._handle();
  }
  start(){
    window.addEventListener('hashchange', this._bound);
    this._handle(true);
  }
  route(){
    const h = (location.hash || '#/portada').replace('#/','').trim();
    return h || 'portada';
  }
  go(route){
    location.hash = `#/${route}`;
  }
  _handle(first=false){
    const r = this.route();
    this.onRoute?.(r, { first });
  }
}