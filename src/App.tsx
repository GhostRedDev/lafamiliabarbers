import { useEffect } from 'react';
import { BookBand } from './components/BookBand/BookBand';
import { BookingModal } from './components/Booking/BookingModal';
import { Faq } from './components/Faq/Faq';
import { FinalCta } from './components/FinalCta/FinalCta';
import { Footer } from './components/Footer/Footer';
import { Gallery } from './components/Gallery/Gallery';
import { Header } from './components/Header/Header';
import { Hero } from './components/Hero/Hero';
import { Location } from './components/Location/Location';
import { Manifesto } from './components/Manifesto/Manifesto';
import { Marquee } from './components/Marquee/Marquee';
import { Services } from './components/Services/Services';
import { Team } from './components/Team/Team';
import { useBooking } from './hooks/useBooking';
import { startMotion } from './lib/motion';

/**
 * Aparición al hacer scroll de todo lo marcado con `data-reveal` (también lo que llega después).
 * Los titulares se ocultan con clip-path y Chrome tiene en cuenta ese recorte en el
 * IntersectionObserver: les queda 1 px visible y se vigilan con umbral 0 (entran cuando ese
 * borde superior pasa del 88 % de la pantalla).
 */
const CLIPPED = '.title, .band-title, .final-title';

function useReveal() {
  useEffect(() => {
    const show = (entries: IntersectionObserverEntry[], obs: IntersectionObserver) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        obs.unobserve(e.target);
      });
    const io = new IntersectionObserver(show, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    const ioClip = new IntersectionObserver(show, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
    const scan = () =>
      document.querySelectorAll('[data-reveal]:not(.is-in)').forEach((el) => (el.matches(CLIPPED) ? ioClip : io).observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => { io.disconnect(); ioClip.disconnect(); mo.disconnect(); };
  }, []);
}

export function App() {
  const booking = useBooking();
  const book = (svc?: number) => booking.openBooking(svc);
  useReveal();
  useEffect(() => startMotion(), []);

  return (
    <>
      <Header onBook={() => book()} />
      <main>
        <Hero onBook={() => book()} />
        <Manifesto />
        {/* Palabras del propio texto del salón (pie del export), no los nombres de los servicios,
            que salen justo debajo. */}
        <Marquee className="marquee--big" speed={55}>
          {['Coupes précises', 'Rasage traditionnel', 'Ambiance urbaine', 'La Familia'].map((t) => (
            <span className="marquee-item" key={t}><span>{t}</span></span>
          ))}
        </Marquee>
        <Services onBook={book} />
        <BookBand onBook={book} />
        <Team onBook={() => book()} />
        <Gallery />
        <Location onBook={() => book()} />
        <Faq />
        <FinalCta onBook={() => book()} />
      </main>
      <Footer />
      <BookingModal b={booking} />
    </>
  );
}
