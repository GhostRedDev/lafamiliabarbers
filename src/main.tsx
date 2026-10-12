import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource-variable/oswald';
import '@fontsource-variable/manrope';
import './styles/tokens.css';
import './styles/base.css';
import './components/Header/Header.css';
import './components/Hero/Hero.css';
import './components/Manifesto/Manifesto.css';
import './components/Services/Services.css';
import './components/BookBand/BookBand.css';
import './components/Team/Team.css';
import './components/Gallery/Gallery.css';
import './components/Gallery/Lightbox.css';
import './components/Location/Location.css';
import './components/Faq/Faq.css';
import './components/FinalCta/FinalCta.css';
import './components/Footer/Footer.css';
import './components/Booking/BookingModal.css';
import './components/ThemeToggle/ThemeToggle.css';
import './components/Marquee/Marquee.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
