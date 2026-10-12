// Carta de precios del salón (flyer «Liste des prix»). `key` = la clave que el conector traduce a
// un servicio de Connek (CONNEK_SERVICES en server/.env); la que no esté en esa lista reserva con
// CONNEK_SERVICE_ID. Las variantes «+ barbe» son servicios aparte (`combo`, justo después de su
// servicio base): en la carta van en la misma fila que la base y en la reserva se eligen solas.

export type CategoryId = 'coupes' | 'barbe' | 'tresses';

export interface Service {
  key: string;
  /** Tal cual el flyer, incluidas las aclaraciones entre paréntesis. */
  name: string;
  price: number;
  category: CategoryId;
  /** Precio con "+" detrás (70$+): depende del largo. */
  plus?: boolean;
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

// Mismo texto, precio y orden que el flyer «Liste des prix».
export const services: readonly Service[] = [
  { key: 'coupe', name: 'Coupe de cheveux', price: 35, category: 'coupes', featured: true },
  { key: 'coupe-barbe', name: 'Coupe de cheveux + barbe', price: 40, category: 'coupes', combo: true },
  { key: 'enfant', name: 'Coupe enfant & étudiant', price: 30, category: 'coupes' },
  { key: 'enfant-barbe', name: 'Coupe enfant & étudiant + barbe', price: 35, category: 'coupes', combo: true },
  { key: 'degrade', name: 'Dégradé (Tapper)', price: 25, category: 'coupes', featured: true },
  { key: 'degrade-barbe', name: 'Dégradé (Tapper) + barbe', price: 30, category: 'coupes', combo: true },
  { key: 'rasage', name: 'Rasage de tête', price: 25, category: 'coupes' },
  { key: 'rasage-barbe', name: 'Rasage de tête + barbe', price: 30, category: 'coupes', combo: true },
  { key: 'barbe', name: 'Barbe seulement', price: 15, category: 'barbe', featured: true },
  { key: 'masque', name: 'Masque noir sur le nez', price: 10, category: 'barbe' },
  { key: 'cire', name: 'Cire oreille ou nez (chaque)', price: 15, category: 'barbe' },
  { key: 'serviette', name: 'Serviette chaude', price: 10, category: 'barbe' },
  { key: 'facial', name: 'Soin du visage (facial)', price: 50, category: 'barbe' },
  { key: 'spray', name: 'Spray noir', price: 5, category: 'barbe' },
  { key: 'tresses', name: 'Tresses (à partir de)', price: 70, category: 'tresses', featured: true },
  { key: 'twist', name: 'Twist (à partir de)', price: 80, category: 'tresses' },
  { key: 'locs', name: 'Retwist locs', price: 70, category: 'tresses', plus: true, note: 'À partir de 70$ selon la longueur' },
];

/** Precio como en el flyer: 35$, 70$+. */
export const priceLabel = (s: Pick<Service, 'price' | 'plus'>) => `${s.price}$${s.plus ? '+' : ''}`;

/** Índice de la variante «+ barbe» del servicio `i`, o -1 si no tiene. */
export const comboOf = (i: number) => (services[i + 1]?.combo ? i + 1 : -1);
