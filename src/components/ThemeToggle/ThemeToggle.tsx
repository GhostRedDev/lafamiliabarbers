import { useRef } from 'react';
import { flushSync } from 'react-dom';
import { useTheme, type Theme } from '../../hooks/useTheme';

type DocWithVT = Document & { startViewTransition?: (cb: () => void) => { ready: Promise<void> } };

/**
 * Selector tipográfico "NUIT | JOUR", en la misma letra que MENU (forma parte de la cabecera,
 * no es un icono suelto). Donde el navegador lo permite, el tema nuevo se abre en círculo desde el
 * propio botón (View Transitions); si no, o con movimiento reducido, cambia sin animación.
 */
export function ThemeToggle({ tabIndex, className = '' }: { tabIndex?: number; className?: string }) {
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLButtonElement>(null);
  const next: Theme = theme === 'dark' ? 'light' : 'dark';

  const toggle = () => {
    const doc = document as DocWithVT;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!doc.startViewTransition || reduced || !ref.current) {
      setTheme(next);
      return;
    }
    const r = ref.current.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const end = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));
    const vt = doc.startViewTransition(() => { flushSync(() => setTheme(next)); });
    vt.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${end}px at ${x}px ${y}px)`] },
        { duration: 700, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', pseudoElement: '::view-transition-new(root)' },
      );
    }).catch(() => undefined);
  };

  return (
    <button
      ref={ref}
      type="button"
      className={`theme-toggle ${className}`.trim()}
      tabIndex={tabIndex}
      onClick={toggle}
      aria-label={`Nuit / Jour : passer en mode ${next === 'light' ? 'jour' : 'nuit'}`}
    >
      <span className="tt-opt tt-night">Nuit</span>
      <span className="tt-sep" aria-hidden="true" />
      <span className="tt-opt tt-day">Jour</span>
    </button>
  );
}
