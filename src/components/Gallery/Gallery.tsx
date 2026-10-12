import { useState, type CSSProperties } from 'react';
import beardFadeLg from '../../assets/photos/beard-fade-1500.webp';
import beardFadeSm from '../../assets/photos/beard-fade-800.webp';
import beardTrim from '../../assets/photos/beard-trim.webp';
import blondeLg from '../../assets/photos/blonde-crop-1500.webp';
import blondeSm from '../../assets/photos/blonde-crop-800.webp';
import braidsBackLg from '../../assets/photos/braids-back-1500.webp';
import braidsBackSm from '../../assets/photos/braids-back-800.webp';
import braidsDuoLg from '../../assets/photos/braids-duo-1500.webp';
import braidsDuoSm from '../../assets/photos/braids-duo-800.webp';
import braidsFrontLg from '../../assets/photos/braids-front-1500.webp';
import braidsFrontSm from '../../assets/photos/braids-front-800.webp';
import braidsSideLg from '../../assets/photos/braids-side-1500.webp';
import braidsSideSm from '../../assets/photos/braids-side-800.webp';
import braidsTopLg from '../../assets/photos/braids-top-1500.webp';
import braidsTopSm from '../../assets/photos/braids-top-800.webp';
import clientFade from '../../assets/photos/client-fade-800.webp';
import designBarberLg from '../../assets/photos/design-barber-1320.webp';
import designBarberSm from '../../assets/photos/design-barber-800.webp';
import designLg from '../../assets/photos/design-flames-1500.webp';
import designSm from '../../assets/photos/design-flames-800.webp';
import hotTowel from '../../assets/photos/hot-towel.webp';
import { links } from '../../content/site';
import { Lightbox } from './Lightbox';

// Fotos reales del salón. Dos bloques de seis en espejo (g-a…g-f y g-g…g-l, ver Gallery.css);
// `pos` = encuadre dentro de la celda.
const SHOTS = [
  { cls: 'g-a', sm: designSm, lg: designLg, w: 1500, h: 2000, pos: '50% 40%', alt: 'Coupe avec motif tracé au rasoir, vue de dos', tag: 'Design' },
  { cls: 'g-b', sm: beardTrim, lg: beardTrim, w: 808, h: 540, pos: '50% 40%', alt: 'Barbier taillant une barbe au salon', tag: 'Barbe' },
  { cls: 'g-c', sm: designBarberSm, lg: designBarberLg, w: 1320, h: 1760, pos: '50% 65%', alt: 'Barbier traçant un motif à la tondeuse', tag: 'Motif' },
  { cls: 'g-d', sm: hotTowel, lg: hotTowel, w: 808, h: 1010, pos: '50% 50%', alt: 'Serviette chaude avant le rasage', tag: 'Serviette chaude' },
  { cls: 'g-e', sm: braidsSideSm, lg: braidsSideLg, w: 1500, h: 2000, pos: '50% 40%', alt: 'Tresses collées avec dégradé sur les côtés', tag: 'Tresses' },
  { cls: 'g-f', sm: blondeSm, lg: blondeLg, w: 1500, h: 2000, pos: '50% 35%', alt: 'Coupe courte blonde avec dégradé', tag: 'Coupe' },
  { cls: 'g-g', sm: clientFade, lg: clientFade, w: 640, h: 1136, pos: '50% 30%', alt: 'Dégradé à blanc réalisé au salon', tag: 'Dégradé' },
  { cls: 'g-h', sm: braidsTopSm, lg: braidsTopLg, w: 1500, h: 2000, pos: '50% 55%', alt: 'Tresses vues du dessus', tag: 'Tresses' },
  { cls: 'g-i', sm: braidsDuoSm, lg: braidsDuoLg, w: 1500, h: 2000, pos: '50% 50%', alt: 'Tresseuse et client aux tresses fraîchement faites', tag: 'Tresses' },
  { cls: 'g-j', sm: braidsBackSm, lg: braidsBackLg, w: 1500, h: 2000, pos: '50% 45%', alt: 'Nattes collées vues de dos', tag: 'Nattes' },
  { cls: 'g-k', sm: braidsFrontSm, lg: braidsFrontLg, w: 1500, h: 2000, pos: '50% 40%', alt: 'Tresses et contours nets', tag: 'Contours' },
  { cls: 'g-l', sm: beardFadeSm, lg: beardFadeLg, w: 1500, h: 2000, pos: '50% 40%', alt: 'Barbe taillée et dégradé court', tag: 'Barbe' },
];

export function Gallery() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="gallery" id="galerie" aria-labelledby="gallery-title">
      <div className="wrap">
        <header className="gallery-head">
          <div>
            <p className="kicker" data-reveal="">Nos réalisations</p>
            <h2 className="title" id="gallery-title" data-reveal="">
              Le style <em>se voit.</em>
            </h2>
          </div>
          <p className="lead" data-reveal="">Coupes, dégradés, designs, barbes et tresses : le travail de l’équipe, au salon.</p>
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
                  style={{ objectPosition: s.pos }}
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
