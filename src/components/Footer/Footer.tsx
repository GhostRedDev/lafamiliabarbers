import type { CSSProperties } from 'react';
import logo from '../../assets/logo-la-familia.png';
import { address, hours, links, mapsLink, whatsappHref } from '../../content/site';

export function Footer() {
  const social = [
    { label: 'Instagram', href: links.instagram },
    { label: 'WhatsApp', href: whatsappHref('Bonjour La Familia\u202f!') },
    { label: 'Avis Google', href: links.googleReview },
  ].filter((l) => l.href);

  return (
    <footer className="footer">
      <div className={`wrap footer-grid${social.length ? '' : ' footer-grid--3'}`}>
        <div className="footer-brand">
          <a href="#top" className="footer-logo" aria-label="La Familia — retour en haut">
            <img src={logo} alt="" width="72" height="72" loading="lazy" />
          </a>
          <p>Un salon de barbier premium à Laval — coupes précises, rasage traditionnel et ambiance urbaine et raffinée.</p>
        </div>

        <div className="footer-col">
          <p className="footer-label">Adresse</p>
          <a href={mapsLink} target="_blank" rel="noreferrer">
            {address.street}
            <br />
            {address.city}
          </a>
        </div>

        <div className="footer-col">
          <p className="footer-label">Horaires</p>
          <ul>
            {hours.map((h) => (
              <li key={h.days}>{h.days} · <span className="nowrap">{h.time}</span></li>
            ))}
          </ul>
        </div>

        {social.length > 0 && (
          <div className="footer-col">
            <p className="footer-label">Contact</p>
            <ul>
              {social.map((l) => (
                <li key={l.label}>
                  <a href={l.href} target="_blank" rel="noreferrer">{l.label}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Firma gigante: las letras suben al llegar y se rellenan de rojo al pasar el ratón. */}
      <p className="wrap footer-mark" aria-hidden="true" data-reveal="">
        {[...'La Familia'].map((ch, i) => (
          <span key={i} style={{ '--i': i } as CSSProperties}>{ch === ' ' ? '\u00a0' : ch}</span>
        ))}
      </p>

      <div className="wrap footer-base">
        <p>© 2026 La Familia Barber. Tous droits réservés.</p>
        <p>Conçu par Connek</p>
      </div>
    </footer>
  );
}
