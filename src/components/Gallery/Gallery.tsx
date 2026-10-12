import { useState, type CSSProperties } from 'react';
import clientFade from '../../assets/photos/client-fade-800.webp';
import clipperLg from '../../assets/photos/clipper-1600.webp';
import clipperSm from '../../assets/photos/clipper-800.webp';
import cutLg from '../../assets/photos/cut-1600.webp';
import cutSm from '../../assets/photos/cut-800.webp';
import fadeLg from '../../assets/photos/fade-1600.webp';
import fadeSm from '../../assets/photos/fade-800.webp';
import interiorLg from '../../assets/photos/interior-1600.webp';
import interiorSm from '../../assets/photos/interior-800.webp';
import toolsLg from '../../assets/photos/tools-1600.webp';
import toolsSm from '../../assets/photos/tools-800.webp';
import { links } from '../../content/site';
import { Lightbox } from './Lightbox';

// La única foto real del salón es la del dégradé (client-fade); el resto es de stock. Por eso
// la sección dice "Galerie" y no "Portfolio / nos réalisations": con las fotos del salón, cambiar
// SHOTS y recuperar el texto del export ("Le style se voit. Une coupe réussie…").
const SHOTS = [
  { cls: 'g-a', sm: clientFade, lg: clientFade, w: 640, h: 1136, alt: 'Dégradé à blanc réalisé au salon', tag: 'Dégradé' },
  { cls: 'g-b', sm: cutSm, lg: cutLg, w: 1600, h: 1063, alt: 'Barbier finissant une coupe aux ciseaux', tag: 'Coupe' },
  { cls: 'g-c', sm: clipperSm, lg: clipperLg, w: 1100, h: 1648, alt: 'Contours à la tondeuse', tag: 'Contours' },
  { cls: 'g-d', sm: interiorSm, lg: interiorLg, w: 1600, h: 1063, alt: 'Fauteuils de barbier dans un salon', tag: 'Ambiance' },
  { cls: 'g-e', sm: fadeSm, lg: fadeLg, w: 1200, h: 1596, alt: 'Dégradé travaillé à la tondeuse', tag: 'Fade' },
  { cls: 'g-f', sm: toolsSm, lg: toolsLg, w: 1600, h: 1067, alt: 'Rasoir, ciseaux et peignes de barbier', tag: 'Rasage' },
];

export function Gallery() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="gallery" id="galerie" aria-labelledby="gallery-title">
      <div className="wrap">
        <header className="gallery-head">
          <div>
            <p className="kicker" data-reveal="">Galerie</p>
            <h2 className="title" id="gallery-title" data-reveal="">
              Le style <em>se voit.</em>
            </h2>
          </div>
        </header>

        <ul className="mosaic">
          {SHOTS.map((s, i) => (
            <li key={s.cls} className={`tile theme-dark ${s.cls}`} data-reveal="wipe" data-parallax="" style={{ '--delay': `${(i % 3) * 110}ms` } as CSSProperties}>
              <button
                type="button"
                className="tile-open"
                onClick={() => setOpen(i)}
                aria-label={`Agrandir : ${s.alt}`}
                // Tira horizontal en móvil: la foto enfocada con Tab entra en pantalla.
                onFocus={(e) => {
                  const b = e.currentTarget;
                  if (!b.matches(':focus-visible')) return;
                  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
                  b.parentElement?.scrollIntoView({ block: 'nearest', inline: 'start', behavior: reduced ? 'auto' : 'smooth' });
                }}
              >
                <img
                  src={s.lg}
                  srcSet={s.sm === s.lg ? undefined : `${s.sm} 800w, ${s.lg} ${s.w}w`}
                  sizes="(max-width: 767px) 100vw, 40vw"
                  alt=""
                  width={s.w}
                  height={s.h}
                  loading="lazy"
                  decoding="async"
                />
                <span className="tile-tag" aria-hidden="true">
                  <span>{String(i + 1).padStart(2, '0')}</span>
                  {s.tag}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {open !== null && (
          <Lightbox shots={SHOTS} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
        )}

        {links.instagram && (
          <p className="gallery-more" data-reveal="">
            <a className="underline-link" href={links.instagram} target="_blank" rel="noreferrer">
              Plus de réalisations sur Instagram
            </a>
          </p>
        )}
      </div>
    </section>
  );
}
