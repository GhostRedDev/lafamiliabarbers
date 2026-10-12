import { useEffect, useState, type CSSProperties } from 'react';
import type { Barber } from '../../hooks/useBooking';

/**
 * El equipo sale de Connek (GET /api/connek/team): nombre y foto de quien recibe reservas.
 * Mientras el salón no lo tenga cargado la sección no se muestra: no se inventan personas ni se
 * rellena con cifras.
 */
export function Team({ onBook }: { onBook: () => void }) {
  const [team, setTeam] = useState<Barber[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/connek/team')
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .then((j) => { if (alive && Array.isArray(j.data)) setTeam(j.data.filter((b: Barber) => b && b.name)); })
      .catch(() => undefined);
    return () => { alive = false; };
  }, []);

  if (team.length === 0) return null;

  return (
    <section className="team" id="equipe" aria-labelledby="team-title">
      <div className="wrap">
        <header className="team-head">
          <p className="kicker" data-reveal="">L’équipe</p>
          <h2 className="title" id="team-title" data-reveal="">
            Ceux qui prennent soin <em>de votre style.</em>
          </h2>
          <p className="lead" data-reveal="">
            Une même exigence&nbsp;: vous offrir une expérience à la hauteur de votre style.
          </p>
        </header>

        <ul className="crew">
          {team.map((b, i) => (
            <li key={b.id ?? b.name} className="crew-card" data-reveal="" style={{ '--delay': `${i * 80}ms` } as CSSProperties}>
              <div className="crew-photo theme-dark">
                {b.image ? (
                  <img src={b.image} alt={`Portrait de ${b.name}`} loading="lazy" decoding="async" />
                ) : (
                  <span className="crew-initial" aria-hidden="true">{b.name.trim().charAt(0)}</span>
                )}
              </div>
              <div className="crew-foot">
                <span className="crew-num">{String(i + 1).padStart(2, '0')}</span>
                <h3 className="crew-name">{b.name}</h3>
              </div>
            </li>
          ))}
        </ul>

        <div className="team-foot" data-reveal="">
          <p>Choisissez votre barbier au moment de réserver — ou laissez «&nbsp;Sans préférence&nbsp;».</p>
          <button type="button" className="underline-link" onClick={onBook}>Réserver</button>
        </div>
      </div>
    </section>
  );
}
