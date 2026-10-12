import { address, hours, links, mapsEmbed, mapsLink, whatsappHref } from '../../content/site';

/** Índice de `hours` que corresponde a hoy en Laval (lun–vie, sáb, dom). */
function todayIndex(): number {
  const dow = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' })).getDay();
  return dow === 0 ? 2 : dow === 6 ? 1 : 0;
}

export function Location({ onBook }: { onBook: () => void }) {
  const today = todayIndex();
  const wa = whatsappHref('Bonjour La Familia, j’aimerais prendre rendez-vous.');

  return (
    <section className="location" id="nous-trouver" aria-labelledby="location-title">
      <div className="wrap location-grid">
        <div className="location-info">
          <p className="kicker" data-reveal="">Nous trouver</p>
          <h2 className="title" id="location-title" data-reveal="">
            On se retrouve <em>à Laval.</em>
          </h2>

          <address className="location-address" data-reveal="">
            {address.street}
            <br />
            {address.city}
          </address>

          <div className="location-hours" data-reveal="">
            <p className="location-label">Heures d’ouverture</p>
            <dl>
              {hours.map((h, i) => (
                <div key={h.days} className={`${i === today ? 'is-today' : ''}${h.closed ? ' is-closed' : ''}`.trim() || undefined}>
                  <dt>
                    {h.days}
                    {i === today && <span className="location-today">Aujourd’hui</span>}
                  </dt>
                  <dd>{h.time}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="location-actions" data-reveal="">
            <button type="button" className="btn btn--red" onClick={onBook} data-magnetic="">Réserver maintenant</button>
            <a className="btn btn--line" href={mapsLink} target="_blank" rel="noreferrer">Obtenir l’itinéraire</a>
            {wa && (
              <a className="underline-link" href={wa} target="_blank" rel="noreferrer">WhatsApp</a>
            )}
          </div>
        </div>

        <div className="location-map" data-reveal="wipe">
          <iframe
            title={`Carte — ${address.mapsQuery}`}
            src={mapsEmbed}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
          {links.googleReview && (
            <a className="location-review" href={links.googleReview} target="_blank" rel="noreferrer">
              Laisser un avis Google
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
