/*
  Animaciones que también se ven en el celular (sin ratón), con IntersectionObserver:
  - [data-count]: el número del precio sube de 0 a su valor al entrar en pantalla (35$, 70$+…);
  - foco al hacer scroll: la fila que pasa por el centro de la pantalla se enciende (.is-focus):
    los valores del salón siempre y las filas de precios solo en táctil (con ratón ya lo hace el hover);
  - galería en móvil: la tira avanza sola y la foto centrada se ve a color (.is-focus); se pausa
    mientras el visitante la toca y cuando no está en pantalla.
  Con prefers-reduced-motion no se arranca nada (los precios ya están escritos en el HTML).
*/

const ease = (t: number) => 1 - (1 - t) ** 3;

function countUp(el: HTMLElement) {
  const to = Number(el.dataset.count);
  const text = el.textContent ?? '';
  if (!Number.isFinite(to) || !/\d+/.test(text)) return;
  const start = performance.now();
  const dur = 900 + Math.min(to, 100) * 4;
  const tick = (now: number) => {
    const t = Math.min(1, (now - start) / dur);
    el.textContent = text.replace(/\d+/, String(Math.round(to * ease(t))));
    if (t < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

export function startFx(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined;
  const cleanups: Array<() => void> = [];

  // Precios que cuentan: solo los que todavía no se ven (los visibles ya están leídos).
  const counters = new IntersectionObserver((entries, obs) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      obs.unobserve(e.target);
      countUp(e.target as HTMLElement);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll<HTMLElement>('[data-count]').forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    el.textContent = (el.textContent ?? '').replace(/\d+/, '0');
    counters.observe(el);
  });
  cleanups.push(() => counters.disconnect());

  // Foco al pasar por el centro de la pantalla.
  const touch = window.matchMedia('(hover: none), (max-width: 1023px)').matches;
  const focus = new IntersectionObserver((entries) => {
    entries.forEach((e) => e.target.classList.toggle('is-focus', e.isIntersecting));
  }, { rootMargin: '-48% 0px -48% 0px' });
  document.querySelectorAll(touch ? '.value, .menu-row' : '.value').forEach((el) => focus.observe(el));
  cleanups.push(() => focus.disconnect());

  // Galería: tira horizontal en móvil.
  const strip = document.querySelector<HTMLElement>('.mosaic');
  if (strip && window.matchMedia('(max-width: 599px)').matches) {
    const tiles = Array.from(strip.querySelectorAll<HTMLElement>('.tile'));
    const centered = new IntersectionObserver((entries) => {
      entries.forEach((e) => e.target.classList.toggle('is-focus', e.intersectionRatio > 0.75));
    }, { root: strip, threshold: [0, 0.75, 1] });
    tiles.forEach((t) => centered.observe(t));

    let visible = false;
    let pausedUntil = 0;
    const seen = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.5 });
    seen.observe(strip);
    const pause = () => { pausedUntil = Date.now() + 7000; };
    strip.addEventListener('pointerdown', pause, { passive: true });
    strip.addEventListener('touchstart', pause, { passive: true });
    strip.addEventListener('wheel', pause, { passive: true });

    const timer = window.setInterval(() => {
      if (!visible || Date.now() < pausedUntil || document.hidden) return;
      const step = tiles[0] ? tiles[0].offsetWidth + 10 : strip.clientWidth * 0.8;
      const atEnd = strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 8;
      strip.scrollTo({ left: atEnd ? 0 : strip.scrollLeft + step, behavior: 'smooth' });
    }, 3200);

    cleanups.push(() => {
      window.clearInterval(timer);
      centered.disconnect();
      seen.disconnect();
      strip.removeEventListener('pointerdown', pause);
      strip.removeEventListener('touchstart', pause);
      strip.removeEventListener('wheel', pause);
    });
  }

  return () => cleanups.forEach((fn) => fn());
}
