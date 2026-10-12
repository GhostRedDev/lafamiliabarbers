import { useEffect, useRef, type CSSProperties } from 'react';
import logo from '../../assets/logo-la-familia.png';
import { STEP_COUNT, type BookingState } from '../../hooks/useBooking';
import { categories, priceLabel, services } from '../../content/services';
import { whatsappHref } from '../../content/site';

const STEPS: ReadonlyArray<[string, string]> = [
  ['Service', 'Choisissez votre service'],
  ['Barbier', 'Avec qui\u202f?'],
  ['Date', 'Quel jour\u202f?'],
  ['Heure', 'À quelle heure\u202f?'],
  ['Détails', 'Vos coordonnées'],
  ['Confirmation', 'On confirme\u202f?'],
];

/** "Samedi 3 octobre" a partir de AAAA-MM-DD (el resumen no usa la abreviatura "Auj."). */
function longDate(iso: string): string {
  const s = new Date(`${iso}T12:00:00`).toLocaleDateString('fr-CA', { weekday: 'long', day: 'numeric', month: 'long' });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

const FOCUSABLE = 'button:not([disabled]), [href], input, [tabindex]:not([tabindex="-1"])';

/**
 * Panel de reserva (lateral en escritorio, hoja inferior en móvil). Solo pinta el estado de
 * `useBooking`: equipo y horas vienen de Connek; aquí no hay datos inventados.
 */
export function BookingModal({ b }: { b: BookingState }) {
  const panelRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const { open, setOpen, step } = b;

  // Foco atrapado, Escape, fondo inerte y vuelta del foco al cerrar.
  useEffect(() => {
    if (!open) return undefined;
    const before = document.activeElement as HTMLElement | null;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    // Solo el pie del sitio: el panel tiene su propio <footer> (botones) y no debe quedar inerte.
    const behind = [...document.querySelectorAll<HTMLElement>('header.topbar, main, footer.footer')];
    behind.forEach((el) => el.setAttribute('inert', ''));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return; }
      if (e.key !== 'Tab' || !panelRef.current) return;
      const items = [...panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      root.style.overflow = '';
      behind.forEach((el) => el.removeAttribute('inert'));
      before?.focus?.();
    };
  }, [open, setOpen]);

  // Al cambiar de paso: arriba del todo y el foco en el título del paso.
  useEffect(() => {
    if (!open) return;
    bodyRef.current?.scrollTo({ top: 0 });
    panelRef.current?.querySelector<HTMLElement>('.bk-title')?.focus();
  }, [open, step]);

  if (!open) return null;

  const svc = b.service !== null ? services[b.service] : null;
  const wa = whatsappHref(
    `Bonjour La Familia, j’aimerais réserver : ${svc ? svc.name : ''} — ${longDate(b.day.iso)}${b.slot ? ` à ${b.slot.time}` : ''}.`,
  );
  const last = step === STEP_COUNT - 1;

  return (
    <div className="bk" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setOpen(false); }}>
      <div className="bk-panel" ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="bk-title">
        <header className="bk-head">
          <div>
            <p className="bk-kicker">
              <span>{String(step + 1).padStart(2, '0')}</span> / {String(STEP_COUNT).padStart(2, '0')} — {STEPS[step][0]}
            </p>
            <h2 className="bk-title" id="bk-title" tabIndex={-1}>{b.sent ? 'Merci !' : STEPS[step][1]}</h2>
          </div>
          <button type="button" className="bk-close" onClick={() => setOpen(false)} aria-label="Fermer la réservation">
            <span aria-hidden="true" />
          </button>
        </header>

        <ol className="bk-progress" aria-hidden="true">
          {STEPS.map(([label], i) => (
            <li key={label} className={i < step ? 'is-done' : i === step ? 'is-now' : undefined} />
          ))}
        </ol>

        <div className="bk-body" ref={bodyRef}>
          <div className="bk-step" key={b.sent ? 'sent' : step}>
            {step === 0 && categories.map((c) => (
              <section key={c.id} className="bk-group" aria-labelledby={`bk-${c.id}`}>
                <p className="bk-group-title" id={`bk-${c.id}`}>{c.label}</p>
                <ul className="bk-list">
                  {services.map((s, i) => s.category !== c.id ? null : (
                    <li key={s.key} style={{ '--i': i } as CSSProperties}>
                      <button type="button" className="bk-svc" aria-pressed={b.service === i} onClick={() => b.setService(i)}>
                        <span className="bk-svc-name">{s.name}</span>
                        <span className="bk-svc-meta">{priceLabel(s)}</span>
                        {s.note && <span className="bk-svc-desc">{s.note}</span>}
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            {step === 1 && !b.teamReady && <p className="bk-note" aria-live="polite">Chargement de l’équipe…</p>}
            {step === 1 && (
              <ul className="bk-barbers">
                {b.barbers.map((p, i) => (
                  <li key={p.id ?? 'any'}>
                    <button type="button" className="bk-barber" aria-pressed={b.barber === i} onClick={() => b.setBarber(i)}>
                      <span className="bk-avatar theme-dark">
                        {p.id === null ? (
                          <img src={logo} alt="" />
                        ) : p.image ? (
                          <img src={p.image} alt="" referrerPolicy="no-referrer" />
                        ) : (
                          <span aria-hidden="true">{p.name.trim().charAt(0)}</span>
                        )}
                      </span>
                      <span className="bk-barber-name">{p.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            {step === 2 && (
              <>
                {b.availStatus === 'loading' && <p className="bk-note" aria-live="polite">Chargement des disponibilités…</p>}
                <ul className="bk-days">
                  {b.dates.map((d) => {
                    const full = !b.dayHasSlots(d);
                    return (
                      <li key={d.iso}>
                        <button type="button" className="bk-day" aria-pressed={b.dateIdx === d.i} disabled={full} onClick={() => b.setDateIdx(d.i)}>
                          <span className="bk-day-dow">{d.dow}</span>
                          <span className="bk-day-num">{d.day}</span>
                          <span className="bk-day-mon">{full ? (d.sunday ? 'Fermé' : 'Complet') : d.mon}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}

            {step === 3 && (
              <>
                {b.notice === 'slotTaken' && <p className="bk-alert" role="alert">Cette heure vient d’être prise. Choisissez-en une autre.</p>}
                {b.availStatus === 'loading' && <p className="bk-note" aria-live="polite">Chargement des horaires…</p>}
                {b.availStatus === 'error' && (
                  <p className="bk-note">Horaires en direct indisponibles pour le moment&nbsp;: choisissez une heure, le salon vous la confirmera.</p>
                )}
                {b.availStatus === 'ok' && b.daySlots.length === 0 && <p className="bk-note">Plus de place ce jour-là. Choisissez une autre date.</p>}
                <ul className="bk-times">
                  {b.daySlots.map((x) => (
                    <li key={x.start_utc || x.time}>
                      <button
                        type="button"
                        className="bk-time"
                        aria-pressed={b.slot !== null && b.slot.time === x.time && b.slot.start_utc === x.start_utc}
                        onClick={() => b.setSlot(x)}
                      >
                        {x.time}
                      </button>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {step === 4 && (
              <div className="bk-form">
                <label className="bk-field">
                  <span>Nom</span>
                  <input type="text" autoComplete="name" value={b.name} onChange={(e) => b.setName(e.target.value)} placeholder="Votre nom" />
                </label>
                <label className="bk-field">
                  <span>Téléphone</span>
                  <input type="tel" autoComplete="tel" inputMode="tel" value={b.phone} onChange={(e) => b.setPhone(e.target.value)} placeholder="514 000 0000" />
                </label>
                <label className="bk-field">
                  <span>Courriel</span>
                  <input type="email" autoComplete="email" value={b.email} onChange={(e) => b.setEmail(e.target.value)} placeholder="vous@courriel.com" />
                </label>
                {b.notice === 'invalidPhone' && (
                  <p className="bk-alert" role="alert">Vérifiez le numéro&nbsp;: 10&nbsp;chiffres, ou avec l’indicatif du pays (+33…).</p>
                )}
                <p className="bk-note">
                  {b.canAdvance
                    ? 'Vos coordonnées servent uniquement à confirmer le rendez-vous.'
                    : 'Indiquez votre nom, votre téléphone et un courriel valide pour continuer.'}
                </p>
              </div>
            )}

            {step === 5 && (
              <div className="bk-summary">
                <dl className="bk-ticket theme-dark">
                  {([
                    ['Service', svc ? `${svc.name} · ${priceLabel(svc)}` : '—'],
                    ['Barbier', b.chosen.name],
                    ['Date', longDate(b.day.iso)],
                    ['Heure', b.slot ? b.slot.time : '—'],
                    ['Client', b.name.trim() || '—'],
                  ] as const).map(([k, v]) => (
                    <div key={k}>
                      <dt>{k}</dt>
                      <dd>{v}</dd>
                    </div>
                  ))}
                </dl>

                {b.sent ? (
                  <div className="bk-done" role="status">
                    <svg className="bk-check" viewBox="0 0 52 52" aria-hidden="true">
                      <circle cx="26" cy="26" r="24" />
                      <path d="M15 27l7 7 15-16" />
                    </svg>
                    <p className="bk-done-title">{b.sent === 'booking' ? 'C’est réservé.' : 'Demande envoyée.'}</p>
                    <p>
                      {b.sent === 'booking'
                        ? 'Vous recevrez la confirmation par courriel. À bientôt au salon.'
                        : 'Le salon vous contactera rapidement pour confirmer le rendez-vous.'}
                    </p>
                  </div>
                ) : (
                  <button type="button" className="btn btn--red bk-confirm" onClick={b.submit} disabled={b.sending}>
                    {b.sending ? 'Envoi en cours…' : 'Confirmer la réservation'}
                  </button>
                )}

                {b.sendError && (
                  <p className="bk-alert" role="alert">
                    L’envoi a échoué. Réessayez dans un instant{wa ? ' ou écrivez-nous sur WhatsApp' : ''}.
                  </p>
                )}
                {wa && !b.sent && (
                  <a className="btn btn--line bk-wa" href={wa} target="_blank" rel="noreferrer">Aussi par WhatsApp</a>
                )}
              </div>
            )}
          </div>
        </div>

        <footer className="bk-foot">
          {b.sent ? (
            <button type="button" className="btn btn--line bk-done-close" onClick={() => setOpen(false)}>Fermer</button>
          ) : (
            <>
              {step > 0 && (
                <button type="button" className="btn btn--line bk-back" onClick={b.goBack}>Retour</button>
              )}
              {!last && (
                <button
                  type="button"
                  className="btn btn--red bk-next"
                  disabled={!b.canAdvance}
                  onClick={() => b.canAdvance && b.goNext()}
                >
                  Continuer
                  <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                </button>
              )}
            </>
          )}
        </footer>
      </div>
    </div>
  );
}
