// Carta de precios del salón (flyer «Liste des prix»). `key` = la clave que el conector traduce a
// un servicio de Connek (CONNEK_SERVICES en server/.env); la que no esté en esa lista reserva con
// CONNEK_SERVICE_ID. Las variantes «+ barbe» son servicios aparte (`combo`, justo después de su
// servicio base): en la carta van en la misma fila que la base y en la reserva se eligen solas.

export type CategoryId = 'coupes' | 'barbe' | 'tresses';

export interface Service {
  key: string;
  name: string;
  price: number;
  category: CategoryId;
  /** «À partir de»: el precio final depende del largo o del volumen. */
  from?: boolean;
  note?: string;
  /** Variante «+ barbe» del servicio anterior: sin fila propia en la carta. */
  combo?: boolean;
  /** Sale en la ficha rápida de la banda de reserva. */
  featured?: boolean;
}

export const categories: ReadonlyArray<{ id: CategoryId; label: string }> = [
  { id: 'coupes', label: 'Coupes' },
  { id: 'barbe', label: 'Barbe & soins' },
  { id: 'tresses', label: 'Tresses & locs' },
];

export const services: readonly Service[] = [
  { key: 'coupe', name: 'Coupe de cheveux', price: 35, category: 'coupes', featured: true },
  { key: 'coupe-barbe', name: 'Coupe de cheveux + barbe', price: 40, category: 'coupes', combo: true },
  { key: 'enfant', name: 'Coupe enfant & étudiant', price: 30, category: 'coupes' },
  { key: 'enfant-barbe', name: 'Coupe enfant & étudiant + barbe', price: 35, category: 'coupes', combo: true },
  { key: 'degrade', name: 'Dégradé (taper)', price: 25, category: 'coupes', featured: true },
  { key: 'degrade-barbe', name: 'Dégradé (taper) + barbe', price: 30, category: 'coupes', combo: true },
  { key: 'rasage', name: 'Rasage de tête', price: 25, category: 'coupes' },
  { key: 'rasage-barbe', name: 'Rasage de tête + barbe', price: 30, category: 'coupes', combo: true },
  { key: 'barbe', name: 'Barbe seulement', price: 15, category: 'barbe', featured: true },
  { key: 'serviette', name: 'Serviette chaude', price: 10, category: 'barbe' },
  { key: 'facial', name: 'Soin du visage (facial)', price: 50, category: 'barbe' },
  { key: 'masque', name: 'Masque noir sur le nez', price: 10, category: 'barbe' },
  { key: 'cire', name: 'Cire oreille ou nez', price: 15, category: 'barbe', note: 'Prix par zone' },
  { key: 'spray', name: 'Spray noir', price: 5, category: 'barbe' },
  { key: 'tresses', name: 'Tresses', price: 70, category: 'tresses', from: true, featured: true },
  { key: 'twist', name: 'Twist', price: 80, category: 'tresses', from: true },
  { key: 'locs', name: 'Retwist locs', price: 70, category: 'tresses', from: true, note: 'Selon la longueur' },
];

export const priceLabel = (s: Pick<Service, 'price' | 'from'>) => `${s.from ? 'dès ' : ''}${s.price} $`;

/** Índice de la variante «+ barbe» del servicio `i`, o -1 si no tiene. */
export const comboOf = (i: number) => (services[i + 1]?.combo ? i + 1 : -1);
