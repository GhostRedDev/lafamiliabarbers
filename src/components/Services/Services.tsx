import { useState, type CSSProperties } from 'react';
import cut from '../../assets/photos/cut-800.webp';
import fade from '../../assets/photos/fade-800.webp';
import tools from '../../assets/photos/tools-800.webp';
import { priceLabel, services } from '../../content/services';

const PHOTOS: Record<string, string> = { coupe: cut, degrade: fade, rituel: tools };

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/**
 * Carta de precios editorial: una fila por servicio (número, nombre, descripción, duración,
 * precio y su "Réserver"). En escritorio la foto del servicio activo acompaña a la lista.
 */
export function Services({ onBook }: { onBook: (svc: number) => void }) {
  const [active, setActive] = useState(0);

  return (
    <section className="services" id="services" aria-labelledby="services-title">
      <div className="wrap">
        <header className="services-head">
          <p className="kicker" data-reveal="">Nos services</p>
          <h2 className="title" id="services-title" data-reveal="">
            Votre style. <em>Votre choix.</em>
          </h2>
          <p className="lead" data-reveal="">
            Trois expériences pensées pour révéler votre style, de la coupe classique au rituel complet.
          </p>
        </header>

        <div className="services-body">
          <ol className="menu">
            {services.map((s, i) => (
              <li
                key={s.key}
                className={`menu-row${active === i ? ' is-active' : ''}`}
                data-reveal=""
                style={{ '--delay': `${i * 90}ms` } as CSSProperties}
                onMouseEnter={() => setActive(i)}
                onFocus={() => setActive(i)}
              >
                <span className="menu-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="menu-main">
                  <h3 className="menu-name">{s.name}</h3>
                  <p className="menu-desc">{s.description}</p>
                </div>
                <p className="menu-meta">
                  <span className="menu-price">{priceLabel(s.price)}<small> CAD</small></span>
                  <span className="menu-time">{s.minutes} min</span>
                </p>
                <button type="button" className="menu-book" onClick={() => onBook(i)}>
                  Réserver<span className="sr-only"> — {s.name}</span>
                  <Arrow />
                </button>
              </li>
            ))}
          </ol>

          <figure className="services-photo" aria-hidden="true">
            {services.map((s, i) => (
              <img
                key={s.key}
                src={PHOTOS[s.key]}
                alt=""
                loading="lazy"
                decoding="async"
                className={active === i ? 'is-shown' : undefined}
              />
            ))}
            <figcaption>
              <span>{String(active + 1).padStart(2, '0')}</span> / 03 — {services[active].name}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
