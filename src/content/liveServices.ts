import { useSyncExternalStore } from 'react';
import { categories as flyerCategories, services as flyerServices, type Category, type Service } from './services';

/*
  Carta en vivo: sale de Connek (GET /api/connek/services) — nombre, precio, duración, categoría y
  foto, tal como el dueño los tiene en la app. La carta del flyer (services.ts) solo se muestra si
  Connek no responde, para que la web nunca quede vacía.
*/

interface LiveService {
  id: number;
  name: string;
  price: number | null;
  plus?: boolean;
  category: string | null;
  description: string | null;
  image: string | null;
}

export interface Catalog {
  live: boolean;
  services: readonly Service[];
  categories: readonly Category[];
}

const slug = (t: string) => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'services';

function fromLive(list: LiveService[]): Catalog {
  const cats: Category[] = [];
  const services: Service[] = list.map((s, i) => {
    const label = s.category && s.category.toLowerCase() !== 'general' ? s.category : 'Services';
    const id = slug(label);
    if (!cats.some((c) => c.id === id)) cats.push({ id, label });
    return {
      key: String(s.id),
      name: s.name,
      price: s.price,
      plus: Boolean(s.plus),
      category: id,
      note: s.description || undefined,
      image: s.image,
      featured: i < 4,
    };
  });
  return { live: true, services, categories: cats };
}

const FALLBACK: Catalog = { live: false, services: flyerServices, categories: flyerCategories };
let catalog: Catalog = FALLBACK;
let started = false;
const listeners = new Set<() => void>();

function load() {
  if (started) return;
  started = true;
  fetch('/api/connek/services')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((j: { data?: LiveService[] }) => {
      const list = Array.isArray(j.data) ? j.data.filter((s) => s && s.name) : [];
      if (list.length) {
        catalog = fromLive(list);
        listeners.forEach((l) => l());
      }
    })
    .catch(() => undefined);
}

function subscribe(l: () => void) {
  listeners.add(l);
  load();
  return () => { listeners.delete(l); };
}

/** Carta actual: la de Connek en cuanto llega; la del flyer mientras tanto o si Connek falla. */
export function useServices(): Catalog {
  return useSyncExternalStore(subscribe, () => catalog, () => FALLBACK);
}
