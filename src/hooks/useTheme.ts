import { useCallback, useEffect, useState } from 'react';

/*
  Tema claro / oscuro. index.html ya fija <html data-theme> antes de pintar (sin parpadeo):
  la elección guardada o, si no hay, la del sistema. Mientras el visitante no elija, se sigue
  al sistema también en vivo; otra pestaña que cambie el tema se sincroniza por `storage`.
  (El color de la barra del navegador lo decide Header según lo que hay arriba de la pantalla.)
*/
export type Theme = 'light' | 'dark';

const KEY = 'lafamilia-theme';

const stored = (): Theme | null => {
  try {
    const v = localStorage.getItem(KEY);
    return v === 'light' || v === 'dark' ? v : null;
  } catch {
    return null;
  }
};

const current = (): Theme => (document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');

function apply(t: Theme) {
  const root = document.documentElement;
  // Sin transiciones de color durante el cambio (ver .theme-switching en tokens.css). La clase
  // se pone antes de cambiar el tema, en el mismo paso, y se quita dos fotogramas después.
  root.classList.add('theme-switching');
  root.dataset.theme = t;
  requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('theme-switching')));
}

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>(current);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: light)');
    const sync = (t: Theme) => { apply(t); setThemeState(t); };
    const onChange = (e: MediaQueryListEvent) => {
      if (stored()) return;
      sync(e.matches ? 'light' : 'dark');
    };
    // Otra pestaña eligió o borró el tema (key null = localStorage.clear()).
    const onStorage = (e: StorageEvent) => {
      if (e.key !== KEY && e.key !== null) return;
      sync(stored() ?? (mq.matches ? 'light' : 'dark'));
    };
    // Por si hay más de un selector montado: todos reflejan el tema real.
    const mo = new MutationObserver(() => setThemeState(current()));
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    mq.addEventListener('change', onChange);
    window.addEventListener('storage', onStorage);
    return () => {
      mo.disconnect();
      mq.removeEventListener('change', onChange);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  const setTheme = useCallback((t: Theme) => {
    apply(t);
    setThemeState(t);
    try { localStorage.setItem(KEY, t); } catch { /* modo privado: solo para esta visita */ }
  }, []);

  return { theme, setTheme };
}
