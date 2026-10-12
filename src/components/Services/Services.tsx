import { useState, type CSSProperties } from 'react';
import braids from '../../assets/photos/braids-top-800.webp';
import design from '../../assets/photos/design-flames-800.webp';
import towel from '../../assets/photos/hot-towel.webp';
import { categories, comboOf, priceLabel, services, type CategoryId } from '../../content/services';

const PHOTOS: Record<CategoryId, string> = { coupes: design, barbe: towel, tresses: braids };

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/**
 * Liste des prix: una tabla por categoría (nombre, precio, "Réserver" y, si existe, la variante
 * "+ barbe" que reserva ese combo). En escritorio la foto de la categoría activa acompaña a la lista.
 */
export function Services({ onBook }: { onBook: (svc: number) => void }) {
  const [active, setActive] = useState(0);

  return (
    <section className="services" id="services" aria-labelledby="services-title">
      <div className="wrap">
        <header className="services-head">
          <p className="kicker" data-reveal="">Liste des prix</p>
          <h2 className="title" id="services-title" data-reveal="">
            Votre style. <em>Votre choix.</em>
          </h2>
          <p className="lead" data-reveal="">
            Ce n’est pas qu’une coupe, c’est un style de vie. Choisissez votre service et réservez en ligne.
          </p>
        </header>

        <div className="services-body">
          <div className="menu">
            {categories.map((c, ci) => (
              <section
                key={c.id}
                className={`menu-group${active === ci ? ' is-active' : ''}`}
                aria-labelledby={`menu-${c.id}`}
                onMouseEnter={() => setActive(ci)}
                onFocus={() => setActive(ci)}
              >
                <h3 className="menu-cat" id={`menu-${c.id}`} data-reveal="">
                  <span>{String(ci + 1).padStart(2, '0')}</span>
                  {c.label}
                </h3>
                <ul className="menu-list">
                  {services.map((s, i) => {
                    if (s.category !== c.id || s.combo) return null;
                    const combo = comboOf(i);
                    return (
                      <li key={s.key} className="menu-row" data-reveal="" style={{ '--delay': `${(i % 4) * 60}ms` } as CSSProperties}>
                        <p className="menu-name">
                          {s.name}
                          {s.note && <small>{s.note}</small>}
                        </p>
                        <p className="menu-price">{priceLabel(s)}</p>
                        <div className="menu-actions">
                          {combo >= 0 && (
                            <button type="button" className="menu-combo" onClick={() => onBook(combo)}>
                              + barbe {priceLabel(services[combo])}
                              <span className="sr-only"> — réserver {services[combo].name}</span>
                            </button>
                          )}
                          <button type="button" className="menu-book" onClick={() => onBook(i)}>
                            Réserver<span className="sr-only"> — {s.name}</span>
                            <Arrow />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            <p className="menu-foot" data-reveal="">Prix en dollars canadiens. « Dès » : le prix final dépend de la longueur et du volume.</p>
          </div>

          <figure className="services-photo" aria-hidden="true">
            {categories.map((c, ci) => (
              <img
                key={c.id}
                src={PHOTOS[c.id]}
                alt=""
                loading="lazy"
                decoding="async"
                className={active === ci ? 'is-shown' : undefined}
              />
            ))}
            <figcaption>
              <span>{String(active + 1).padStart(2, '0')}</span> / {String(categories.length).padStart(2, '0')} — {categories[active].label}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
