import type { CSSProperties } from 'react';
import chair from '../../assets/photos/chair-800.webp';
import { priceLabel, services } from '../../content/services';

const STEPS = ['Service', 'Barbier', 'Date', 'Heure', 'Détails', 'Confirmation'];

/**
 * Bloque rojo de reserva (referencia Raw Shave): titular grande, los seis pasos del flujo y una
 * ficha oscura para empezar ya con el servicio elegido.
 */
export function BookBand({ onBook }: { onBook: (svc?: number) => void }) {
  return (
    <section className="band theme-dark" id="reserver" aria-labelledby="band-title">
      <div className="wrap band-grid">
        <div className="band-copy">
          <p className="kicker band-kicker" data-reveal="">Réservation</p>
          <h2 className="band-title" id="band-title" data-reveal="">
            Réserver, <span>sans complication.</span>
          </h2>
          <ol className="band-steps">
            {STEPS.map((s, i) => (
              <li key={s} data-reveal="" style={{ '--delay': `${i * 60}ms`, '--si': i } as CSSProperties}>
                <span>{String(i + 1).padStart(2, '0')}</span>
                {s}
              </li>
            ))}
          </ol>
        </div>

        <div className="band-card" data-reveal="">
          <img className="band-card-photo" src={chair} alt="" loading="lazy" decoding="async" />
          <div className="band-card-body">
            <p className="band-card-label">Commencez par votre service</p>
            <ul className="band-picks">
              {services.map((s, i) => s.featured && (
                <li key={s.key}>
                  <button type="button" className="band-pick" onClick={() => onBook(i)}>
                    <span className="band-pick-name">{s.name}</span>
                    <span className="band-pick-meta">{priceLabel(s)}</span>
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" className="btn btn--red band-cta" onClick={() => onBook()} data-magnetic="">
              Réserver maintenant
              <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
