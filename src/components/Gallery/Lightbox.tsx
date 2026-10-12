import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export interface Shot { lg: string; alt: string; tag: string }

/**
 * Visor a pantalla completa de la galería: flechas (y teclado ←/→), Escape o clic fuera para
 * cerrar, fondo inerte y el foco vuelve a la foto que lo abrió.
 */
export function Lightbox({ shots, index, onIndex, onClose }: {
  shots: readonly Shot[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const n = shots.length;
  const go = (d: number) => onIndex((index + d + n) % n);

  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    const behind = [...document.querySelectorAll<HTMLElement>('header.topbar, main, footer.footer')];
    behind.forEach((el) => el.setAttribute('inert', ''));
    ref.current?.querySelector<HTMLElement>('.lb-close')?.focus();
    return () => {
      root.style.overflow = '';
      behind.forEach((el) => el.removeAttribute('inert'));
      before?.focus?.();
    };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') onIndex((index + 1) % n);
      else if (e.key === 'ArrowLeft') onIndex((index - 1 + n) % n);
      else if (e.key === 'Tab' && ref.current) {
        const items = [...ref.current.querySelectorAll<HTMLElement>('button')];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [index, n, onClose, onIndex]);

  const shot = shots[index];
  return createPortal(
    <div
      ref={ref}
      className="lb theme-dark"
      role="dialog"
      aria-modal="true"
      aria-label="Galerie"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <figure className="lb-figure" key={index}>
        <img src={shot.lg} alt={shot.alt} />
        <figcaption>
          <span>{String(index + 1).padStart(2, '0')}</span> / {String(n).padStart(2, '0')} — {shot.tag}
        </figcaption>
      </figure>
      <button type="button" className="lb-btn lb-close" onClick={onClose} aria-label="Fermer la galerie">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 3l10 10M13 3 3 13" /></svg>
      </button>
      <button type="button" className="lb-btn lb-prev" onClick={() => go(-1)} aria-label="Photo précédente">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M15 8H2M7 3 2 8l5 5" /></svg>
      </button>
      <button type="button" className="lb-btn lb-next" onClick={() => go(1)} aria-label="Photo suivante">
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 8h13M9 3l5 5-5 5" /></svg>
      </button>
    </div>,
    document.body,
  );
}
