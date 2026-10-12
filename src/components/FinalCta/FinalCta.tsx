import interiorLg from '../../assets/photos/interior-1600.webp';

export function FinalCta({ onBook }: { onBook: () => void }) {
  return (
    <section className="final theme-dark" aria-labelledby="final-title" data-parallax="">
      <img className="final-img" src={interiorLg} alt="" loading="lazy" decoding="async" />
      <div className="final-veil" />
      <div className="wrap final-inner">
        <p className="kicker" data-reveal="">Prêt à passer au salon</p>
        <h2 className="final-title" id="final-title" data-reveal="">
          <span>Votre prochain look</span> <em>commence ici.</em>
        </h2>
        <div data-reveal="">
          <button type="button" className="btn btn--red" onClick={onBook} data-magnetic="">
            Réserver maintenant
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <path d="M1 8h13M9 3l5 5-5 5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          </button>
        </div>
      </div>
    </section>
  );
}
