import { useEffect, useRef, useState, type CSSProperties } from 'react';
import logo from '../../assets/logo-la-familia.png';
import { address, hours } from '../../content/site';
import { ThemeToggle } from '../ThemeToggle/ThemeToggle';

const NAV = [
  { href: '#manifeste', label: 'Le salon' },
  { href: '#services', label: 'Services' },
  { href: '#reserver', label: 'Réserver' },
  { href: '#galerie', label: 'Galerie' },
  { href: '#nous-trouver', label: 'Nous trouver' },
  { href: '#faq', label: 'FAQ' },
];

/**
 * Barra fija: sobre la portada es transparente (menú · logo · dirección, como la referencia);
 * al bajar pasa a una barra oscura con el CTA de reserva. El menú es una capa a pantalla completa
 * en rojo oscuro, con foco atrapado, Escape y el resto de la página inerte.
 */
export function Header({ onBook }: { onBook: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  // Al bajar la barra se esconde; al subir vuelve (solo pasada la portada).
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // La barra toma su fondo en cuanto la franja .hero-bottom (papel en tema claro) pasa por
      // debajo. 96 ≥ alto de la barra sin compactar (94 desde 768 px, 86 en móvil); no se usa el
      // alto vivo porque encoge a ~66 y oscilaría.
      const strip = document.querySelector<HTMLElement>('.hero-bottom');
      setScrolled(strip ? strip.getBoundingClientRect().top < 96 : y > 24);
      if (Math.abs(y - last) > 6) {
        setHidden(y > last && y > window.innerHeight * 1.2);
        last = y;
      }
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const root = document.documentElement;
    root.style.overflow = 'hidden';
    const behind = [...document.querySelectorAll<HTMLElement>('main, footer.footer')];
    behind.forEach((el) => el.setAttribute('inert', ''));
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if (e.key !== 'Tab' || !panelRef.current) return;
      const f = [toggleRef.current, ...panelRef.current.querySelectorAll<HTMLElement>('a, button')].filter(Boolean) as HTMLElement[];
      const first = f[0];
      const last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      root.style.overflow = '';
      behind.forEach((el) => el.removeAttribute('inert'));
      document.removeEventListener('keydown', onKey);
      toggleRef.current?.focus();
    };
  }, [open]);

  // Color de la barra del navegador = lo que hay arriba: portada o menú oscuros, o la barra clara
  // al bajar en tema claro. Se observa data-theme porque el selector de tema vive en otro componente.
  useEffect(() => {
    const meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) return undefined;
    const sync = () => {
      const paper = scrolled && !open && document.documentElement.dataset.theme === 'light';
      meta.setAttribute('content', paper ? '#f4eeea' : '#0c0909');
    };
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => mo.disconnect();
  }, [scrolled, open]);

  const go = () => setOpen(false);

  return (
    <header className={`topbar${scrolled ? ' is-scrolled' : ''}${open ? ' is-open' : ''}${hidden && !open ? ' is-hidden' : ''}`}>
      {/* Sobre la portada o con el menú abierto la barra va sobre oscuro en los dos temas. */}
      <div className={`topbar-inner${!scrolled || open ? ' theme-dark' : ''}`}>
        <div className="topbar-left">
          <button
            ref={toggleRef}
            type="button"
            className="topbar-menu"
            aria-expanded={open}
            aria-controls="menu-panel"
            onClick={() => setOpen(!open)}
          >
            <span className="topbar-menu-lines" aria-hidden="true" />
            <span>{open ? 'Fermer' : 'Menu'}</span>
          </button>
          <ThemeToggle className="theme-toggle--bar" />
        </div>

        <a className="topbar-logo" href="#top" aria-label="La Familia — retour en haut" onClick={go}>
          <img src={logo} alt="" width="58" height="58" />
        </a>

        <div className="topbar-right">
          <p className="topbar-address">
            <span>{address.street}</span>
            <span>{address.city}</span>
          </p>
          <button type="button" className="btn btn--red topbar-cta" onClick={onBook} data-magnetic="">
            Réserver
          </button>
        </div>
      </div>

      <div ref={panelRef} id="menu-panel" className="menu-panel theme-dark" aria-hidden={!open}>
        <nav aria-label="Navigation principale">
          <ol className="menu-list">
            {NAV.map((item, i) => (
              <li key={item.href} style={{ '--i': i } as CSSProperties}>
                <a href={item.href} onClick={go} tabIndex={open ? 0 : -1}>
                  <span className="menu-num">{String(i + 1).padStart(2, '0')}</span>
                  {item.label}
                </a>
              </li>
            ))}
          </ol>
        </nav>
        <div className="menu-aside">
          <p className="kicker">Nous trouver</p>
          <p className="menu-address">{address.street}<br />{address.city}</p>
          <dl className="menu-hours">
            {hours.map((h) => (
              <div key={h.days}><dt>{h.days}</dt><dd>{h.time}</dd></div>
            ))}
          </dl>
          {/* En móvil el selector de tema vive aquí (en la barra no cabe junto al logo). */}
          <div className="menu-theme">
            <span className="menu-theme-label">Ambiance</span>
            <ThemeToggle tabIndex={open ? 0 : -1} />
          </div>
          <button type="button" className="btn btn--red" tabIndex={open ? 0 : -1} onClick={() => { go(); onBook(); }}>
            Réserver un rendez-vous
          </button>
        </div>
      </div>
    </header>
  );
}
