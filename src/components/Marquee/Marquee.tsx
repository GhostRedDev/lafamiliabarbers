import { useEffect, useRef, type ReactNode } from 'react';

/**
 * Cinta infinita que avanza sola y acelera con la velocidad del scroll (y cambia de sentido
 * cuando el visitante sube). Solo se anima mientras está en pantalla; con movimiento reducido
 * queda quieta.
 */
export function Marquee({ children, className = '', speed = 40 }: { children: ReactNode; className?: string; speed?: number }) {
  const box = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = track.current;
    if (!el || !box.current) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let x = 0, vel = 0, dir = -1, raf = 0, visible = false;
    let last = performance.now();
    let lastY = window.scrollY;
    const tick = (t: number) => {
      const dt = Math.min(64, t - last);
      last = t;
      const dy = window.scrollY - lastY;
      lastY = window.scrollY;
      if (dy) dir = dy > 0 ? -1 : 1;
      vel += (Math.abs(dy) - vel) * 0.08;
      x += (dir * speed * (1 + Math.min(vel, 80) * 0.09) * dt) / 1000;
      const half = el.scrollWidth / 2;
      if (half > 0) { if (x <= -half) x += half; if (x > 0) x -= half; }
      el.style.transform = `translate3d(${x.toFixed(2)}px, 0, 0)`;
      raf = visible ? requestAnimationFrame(tick) : 0;
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !raf) { last = performance.now(); lastY = window.scrollY; raf = requestAnimationFrame(tick); }
    });
    io.observe(box.current);
    return () => { io.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [speed]);

  return (
    <div className={`marquee ${className}`} ref={box} aria-hidden="true">
      <div className="marquee-track" ref={track}>
        <div className="marquee-group">{children}</div>
        <div className="marquee-group">{children}</div>
      </div>
    </div>
  );
}
