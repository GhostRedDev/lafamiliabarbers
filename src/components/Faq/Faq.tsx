import { useState } from 'react';

// Preguntas y respuestas del export del cliente.
const QA = [
  {
    q: 'Comment réserver un rendez-vous\u202f?',
    a: 'Réservez en ligne en quelques clics via le bouton «\u00a0Réserver maintenant\u00a0», ou contactez-nous directement par téléphone ou WhatsApp — nous confirmons votre créneau rapidement.',
  },
  {
    q: 'Quelle est votre politique d’annulation\u202f?',
    a: 'Nous demandons un préavis d’au moins 24 heures pour toute annulation ou modification, par respect pour nos barbiers et les autres clients.',
  },
  {
    q: 'Quels moyens de paiement acceptez-vous\u202f?',
    a: 'Cartes de crédit, débit et paiement sans contact sont acceptés directement au salon.',
  },
  {
    q: 'Vendez-vous des produits de soin\u202f?',
    a: 'Oui — une sélection de produits capillaires et de soin de la barbe, les mêmes que nous utilisons en salon, est disponible à l’achat sur place.',
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section className="faq" id="faq" aria-labelledby="faq-title">
      <div className="wrap faq-grid">
        <header className="faq-head">
          <p className="kicker" data-reveal="">FAQ</p>
          <h2 className="title" id="faq-title" data-reveal="">
            Questions <em>fréquentes.</em>
          </h2>
        </header>

        <div className="faq-list">
          {QA.map((item, i) => {
            const isOpen = open === i;
            return (
              <div key={item.q} className={`faq-item${isOpen ? ' is-open' : ''}`} data-reveal="">
                <h3>
                  <button
                    type="button"
                    id={`faq-q-${i}`}
                    aria-expanded={isOpen}
                    aria-controls={`faq-a-${i}`}
                    onClick={() => setOpen(isOpen ? null : i)}
                  >
                    <span className="faq-num">{String(i + 1).padStart(2, '0')}</span>
                    <span className="faq-q">{item.q}</span>
                    <span className="faq-icon" aria-hidden="true" />
                  </button>
                </h3>
                <div className="faq-a" id={`faq-a-${i}`} role="region" aria-labelledby={`faq-q-${i}`}>
                  <div>
                    <p>{item.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
