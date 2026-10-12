/*
  Movimiento ligado al scroll y al puntero, en un solo bucle requestAnimationFrame que solo
  escribe variables CSS (el CSS decide qué mover):
  - <html> --progress: 0…1, avance de la página (barra roja de la cabecera);
  - [data-parallax] --p: posición del elemento respecto al centro de la pantalla (-1…1 aprox.);
  - .hero --hp: 0…1 a medida que la portada sale de la pantalla;
  - [data-magnetic]: el botón se acerca un poco al puntero (solo ratón).
  Con prefers-reduced-motion no se arranca nada.
*/

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));

export function startMotion(): () => void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return () => undefined;

  const root = document.documentElement;
  let frame = 0;

  const update = () => {
    frame = 0;
    const vh = window.innerHeight;
    const max = Math.max(1, root.scrollHeight - vh);
    root.style.setProperty('--progress', (window.scrollY / max).toFixed(4));

    const hero = document.querySelector<HTMLElement>('.hero');
    if (hero) hero.style.setProperty('--hp', clamp(window.scrollY / hero.offsetHeight, 0, 1).toFixed(4));

    document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      el.style.setProperty('--p', ((r.top + r.height / 2 - vh / 2) / vh).toFixed(4));
    });
  };
  const request = () => { if (!frame) frame = requestAnimationFrame(update); };
  window.addEventListener('scroll', request, { passive: true });
  window.addEventListener('resize', request);
  update();

  // Botones magnéticos.
  const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
  let current: HTMLElement | null = null;
  const release = () => { if (current) current.style.translate = ''; current = null; };
  const onMove = (e: PointerEvent) => {
    if (!fine.matches) return;
    const el = (e.target as Element | null)?.closest<HTMLElement>('[data-magnetic]') ?? null;
    if (el !== current) release();
    if (!el) return;
    current = el;
    const r = el.getBoundingClientRect();
    const dx = clamp((e.clientX - (r.left + r.width / 2)) * 0.22, -10, 10);
    const dy = clamp((e.clientY - (r.top + r.height / 2)) * 0.35, -8, 8);
    el.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
  };
  document.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('pointerleave', release);

  return () => {
    if (frame) cancelAnimationFrame(frame);
    window.removeEventListener('scroll', request);
    window.removeEventListener('resize', request);
    document.removeEventListener('pointermove', onMove);
    document.removeEventListener('pointerleave', release);
    release();
  };
}
