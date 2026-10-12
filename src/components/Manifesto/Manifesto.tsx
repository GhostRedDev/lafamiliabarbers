import realLg from '../../assets/photos/client-fade-800.webp';
import { Fragment, type CSSProperties } from 'react';

// Párrafo de la portada del export (con "La Familia" en lugar de "Punta Cana Barbier"). Las
// palabras entre * van en rojo. Se encienden una a una al hacer scroll (--p, src/lib/motion.ts).
const TEXT =
  'Une coupe précise, une attention personnalisée et une expérience pensée dans les moindres détails. Chez *La* *Familia,* chaque visite combine savoir-faire professionnel, élégance urbaine et bonne ambiance.';
const WORDS = TEXT.split(' ');

// Textos del export del cliente ("Pourquoi nous — Le détail fait la différence").
const VALUES = [
  { name: 'Professionnalisme', text: 'Des barbiers formés aux techniques classiques et modernes, exigeants sur chaque détail.' },
  { name: 'Attention personnalisée', text: 'Chaque coupe commence par une vraie conversation sur ce que vous voulez.' },
  { name: 'Rapidité & efficacité', text: 'Un service précis, sans jamais sacrifier la qualité.' },
  { name: 'Ambiance urbaine', text: 'Un salon pensé comme un lieu de vie, pas seulement un rendez-vous.' },
  { name: 'Produits premium', text: 'Des soins et produits capillaires haut de gamme, sélectionnés avec soin.' },
];

export function Manifesto() {
  return (
    <section className="manifesto" id="manifeste" aria-labelledby="manifesto-title">
      <div className="wrap manifesto-grid">
        <figure className="manifesto-media" data-reveal="wipe">
          <div className="manifesto-photo">
            <img src={realLg} alt="Dégradé à blanc et barbe taillée, réalisés au salon La Familia" width="640" height="1136" loading="lazy" decoding="async" />
          </div>
          <figcaption>Au salon · Laval</figcaption>
        </figure>

        <div className="manifesto-copy">
          <p className="kicker" data-reveal="">Le salon</p>
          <p className="manifesto-text" data-parallax="" style={{ '--wn': WORDS.length } as CSSProperties}>
            <span className="sr-only">{TEXT.replace(/\*/g, '')}</span>
            <span aria-hidden="true">
              {WORDS.map((w, i) => (
                <Fragment key={i}>
                  {i > 0 && ' '}
                  <span className={`mw${w.startsWith('*') ? ' is-em' : ''}`} style={{ '--wi': i } as CSSProperties}>
                    {w.replace(/\*/g, '')}
                  </span>
                </Fragment>
              ))}
            </span>
          </p>

          <h2 className="title manifesto-title" id="manifesto-title" data-reveal="">
            Le détail fait <em>la différence.</em>
          </h2>

          <ol className="values">
            {VALUES.map((v, i) => (
              <li key={v.name} className="value" data-reveal="" style={{ '--delay': `${i * 70}ms` } as CSSProperties}>
                <span className="value-num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="value-name">{v.name}</h3>
                <p className="value-text">{v.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
