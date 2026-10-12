import { Fragment, useEffect, useRef, useState, type CSSProperties } from 'react';
import heroLg from '../../assets/photos/hero-1600.webp';
import heroSm from '../../assets/photos/hero-800.webp';
import logo from '../../assets/logo-la-familia.png';
import { openStatus } from '../../content/site';

// Titular en palabras; `em` = palabra en rojo. Cada letra sube desde la máscara de su palabra.
const LINES: ReadonlyArray<ReadonlyArray<{ w: string; em?: boolean }>> = [
  [{ w: 'Votre' }, { w: 'style' }, { w: 'mérite' }, { w: 'plus', em: true }],
  [{ w: 'qu’un' }, { w: 'simple' }, { w: 'rendez-vous.' }],
];
const TITLE = 'Votre style mérite plus qu’un simple rendez-vous.';
const SEAL = 'Réserver · La Familia · Salon de barbier · ';

function Title() {
  let ci = 0;
  return (
    <h1 className="hero-title" id="hero-title">
      <span className="sr-only">{TITLE}</span>
      <span aria-hidden="true">
        {LINES.map((line, li) => (
          <span className="hero-line" key={li}>
            {line.map(({ w, em }, wi) => {
              const word = (
                <span className="hw" key={w}>
                  {[...w].map((ch) => {
                    const i = ci++;
                    return <span className="hc" key={i} style={{ '--ci': i } as CSSProperties}>{ch}</span>;
                  })}
                </span>
              );
              return (
                <Fragment key={w}>
                  {wi > 0 && ' '}
                  {em ? <em>{word}</em> : word}
                </Fragment>
              );
            })}
          </span>
        ))}
      </span>
    </h1>
  );
}

/** Estado del salón en vivo (hora de Laval), refrescado cada minuto. */
function useOpenStatus() {
  const [s, setS] = useState(openStatus);
  useEffect(() => {
    const t = window.setInterval(() => setS(openStatus()), 60_000);
    return () => window.clearInterval(t);
  }, []);
  return s;
}

/**
 * Portada inspirada en la referencia "Franklin": foto oscura a sangre, marca espaciada, titular
 * centrado con una palabra en rojo, "FAMILIA" gigante en contorno y barra inferior de tres
 * columnas. Encima: telón de entrada (una vez por sesión, ver index.html), luz roja que sigue al
 * puntero, parallax de ratón y de scroll, y un sello giratorio de reserva.
 */
export function Hero({ onBook }: { onBook: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const status = useOpenStatus();

  // Puntero → --mx/--my (-1…1, suavizado) y --sx/--sy (px) para la luz. Solo con ratón.
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    let tx = 0, ty = 0, x = 0, y = 0, raf = 0;
    const tick = () => {
      x += (tx - x) * 0.08;
      y += (ty - y) * 0.08;
      el.style.setProperty('--mx', x.toFixed(4));
      el.style.setProperty('--my', y.toFixed(4));
      raf = Math.abs(tx - x) + Math.abs(ty - y) > 0.001 ? requestAnimationFrame(tick) : 0;
    };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width) * 2 - 1;
      ty = ((e.clientY - r.top) / r.height) * 2 - 1;
      el.style.setProperty('--sx', `${Math.round(e.clientX - r.left)}px`);
      el.style.setProperty('--sy', `${Math.round(e.clientY - r.top)}px`);
      el.classList.add('is-lit');
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const onLeave = () => { tx = 0; ty = 0; el.classList.remove('is-lit'); if (!raf) raf = requestAnimationFrame(tick); };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <section className="hero theme-dark" id="top" aria-labelledby="hero-title" ref={ref}>
      <div className="hero-intro" aria-hidden="true">
        <img src={logo} alt="" width="96" height="96" />
        <span className="hero-intro-line" />
      </div>

      <div className="hero-media" aria-hidden="true">
        <img
          className="hero-img"
          src={heroLg}
          srcSet={`${heroSm} 800w, ${heroLg} 1600w`}
          sizes="100vw"
          alt=""
          // React 18 no conoce fetchPriority: se pasa el atributo en minúsculas.
          {...{ fetchpriority: 'high' }}
        />
        <div className="hero-veil" />
        <div className="hero-spot" />
      </div>

      <p className="hero-outline" aria-hidden="true">
        {[...'Familia'].map((ch, i) => (
          <span key={i} style={{ '--oi': i } as CSSProperties}>{ch}</span>
        ))}
      </p>

      <div className="hero-center">
        <p className="hero-brand">
          <span>La Familia</span>
          <span className="hero-brand-sub">Salon de barbier · Laval</span>
        </p>
        <Title />
      </div>

      <button type="button" className="hero-seal" onClick={onBook} data-magnetic="">
        <svg viewBox="0 0 200 200" aria-hidden="true">
          <defs>
            <path id="hero-seal-path" d="M100,100 m-78,0 a78,78 0 1,1 156,0 a78,78 0 1,1 -156,0" />
          </defs>
          <text>
            <textPath href="#hero-seal-path" textLength="486" lengthAdjust="spacing">{SEAL}</textPath>
          </text>
        </svg>
        <span className="hero-seal-core" aria-hidden="true">
          <svg viewBox="0 0 16 16" fill="none">
            <path d="M3 13 13 3M5 3h8v8" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        </span>
        <span className="sr-only">Réserver un rendez-vous</span>
      </button>

      <div className="hero-bottom theme-page">
        <p className="hero-bottom-cell hero-bottom-left">Coupes · Dégradés · Rasage</p>
        <div className="hero-bottom-cell hero-bottom-center">
          <button type="button" className="underline-link" onClick={onBook}>
            Réserver
          </button>
        </div>
        <p className={`hero-bottom-cell hero-bottom-right${status.open ? ' is-open' : ''}`}>
          <span className="hero-dot" aria-hidden="true" />
          {status.label}
        </p>
      </div>

    </section>
  );
}
