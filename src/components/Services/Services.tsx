import { useState, type CSSProperties } from 'react';
import beardFade from '../../assets/photos/beard-fade-800.webp';
import beardTrim from '../../assets/photos/beard-trim.webp';
import blonde from '../../assets/photos/blonde-crop-800.webp';
import braidsDuo from '../../assets/photos/braids-duo-800.webp';
import braidsSide from '../../assets/photos/braids-side-800.webp';
import braidsTop from '../../assets/photos/braids-top-800.webp';
import clientFade from '../../assets/photos/client-fade-800.webp';
import designBarber from '../../assets/photos/design-barber-800.webp';
import design from '../../assets/photos/design-flames-800.webp';
import towel from '../../assets/photos/hot-towel.webp';
import { categories, comboOf, priceLabel, services } from '../../content/services';

// Foto de cada servicio (clave de services.ts); los combos "+ barbe" usan la de su base.
const PHOTOS: Record<string, string> = {
  coupe: blonde, enfant: clientFade, degrade: beardFade, rasage: designBarber,
  barbe: beardTrim, serviette: towel, facial: towel, masque: towel, cire: beardFade, spray: design,
  tresses: braidsTop, twist: braidsSide, locs: braidsDuo,
};

// Servicios con fila propia (sin los combos), con su índice en `services` para reservar.
const ROWS = services.map((s, i) => ({ s, i })).filter(({ s }) => !s.combo);

const Arrow = () => (
  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

/**
 * Liste des prix: una tabla por categoría (nombre, precio, "Réserver" y, si existe, la variante
 * "+ barbe" que reserva ese combo). En escritorio la foto del servicio activo acompaña a la lista.
 */
export function Services({ onBook }: { onBook: (svc: number) => void }) {
  const [active, setActive] = useState(0);
  const current = ROWS[active].s;

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
                className={`menu-group${current.category === c.id ? ' is-active' : ''}`}
                aria-labelledby={`menu-${c.id}`}
              >
                <h3 className="menu-cat" id={`menu-${c.id}`} data-reveal="">
                  <span>{String(ci + 1).padStart(2, '0')}</span>
                  {c.label}
                </h3>
                <ul className="menu-list">
                  {ROWS.map(({ s, i }, r) => {
                    if (s.category !== c.id) return null;
                    const combo = comboOf(i);
                    return (
                      <li
                        key={s.key}
                        className={`menu-row${active === r ? ' is-active' : ''}`}
                        data-reveal=""
                        style={{ '--delay': `${(r % 4) * 60}ms` } as CSSProperties}
                        onMouseEnter={() => setActive(r)}
                        onFocus={() => setActive(r)}
                      >
                        <div className="menu-main">
                          <p className="menu-name">{s.name}</p>
                          {s.note && <p className="menu-note">({s.note})</p>}
                          {/* La promo «+ barbe» como en el flyer; al tocarla se reserva ese combo. */}
                          {combo >= 0 && (
                            <button type="button" className="menu-combo" onClick={() => onBook(combo)}>
                              (+ barbe {priceLabel(services[combo])})
                              <span className="sr-only"> — réserver {services[combo].name}</span>
                            </button>
                          )}
                        </div>
                        <p className="menu-price">{priceLabel(s)}</p>
                        <button type="button" className="menu-book" onClick={() => onBook(i)}>
                          Réserver<span className="sr-only"> — {s.name}</span>
                          <Arrow />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </section>
            ))}
            <p className="menu-foot" data-reveal="">Prix en dollars canadiens. Réservez ton style. Rejoins la Familia.</p>
          </div>

          <figure className="services-photo" aria-hidden="true">
            {ROWS.map(({ s }, r) => (
              <img
                key={s.key}
                src={PHOTOS[s.key]}
                alt=""
                loading="lazy"
                decoding="async"
                className={active === r ? 'is-shown' : undefined}
              />
            ))}
            <figcaption>
              <span>{String(active + 1).padStart(2, '0')}</span> / {String(ROWS.length).padStart(2, '0')} — {current.name}
            </figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
