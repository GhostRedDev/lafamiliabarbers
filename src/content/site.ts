// Datos del negocio. Fuente: export del cliente (La-Familia-Barber-V2.zip, brand-spec.md) y el
// conector de Punta Cana Barbers (mismo salón de Laval). Lo marcado "por confirmar" no lo ha
// validado el salón todavía.

export const BRAND = 'La Familia';
export const BRAND_FULL = 'La Familia — Salon de barbier';

export const address = {
  // El pie del export y el conector de Punta Cana dicen 225 #9; la sección "Localisation" del
  // export decía 255 sin unidad. Se usa la del conector (la que ya recibe a los clientes): confirmar.
  // Espacio insecable: el «9» nunca queda solo en una línea.
  street: '225 Boul. de la Concorde O, local\u00a09',
  city: 'Laval (QC) H7N 5T1',
  mapsQuery: '225 Boulevard de la Concorde Ouest, Laval, QC H7N 5T1',
};

export const mapsLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address.mapsQuery)}`;
export const mapsEmbed = `https://www.google.com/maps?q=${encodeURIComponent(address.mapsQuery)}&hl=fr&z=16&output=embed`;

/** Horario (por confirmar con el salón; venía como ejemplo en el export). */
export const hours: ReadonlyArray<{ days: string; time: string; closed?: boolean }> = [
  { days: 'Lundi — Vendredi', time: '10\u00a0h – 19\u00a0h' },
  { days: 'Samedi', time: '9\u00a0h – 17\u00a0h' },
  { days: 'Dimanche', time: 'Fermé', closed: true },
];

/**
 * Redes y contacto: vacíos hasta tener los reales (en el export eran href="#"). Lo que está vacío
 * no se muestra. WhatsApp: solo dígitos con indicativo (p. ej. 15145550100).
 */
export const links = {
  instagram: '',
  whatsapp: '',
  googleReview: '',
};

export const whatsappHref = (text: string) =>
  links.whatsapp ? `https://wa.me/${links.whatsapp}?text=${encodeURIComponent(text)}` : '';

/**
 * El mismo horario en horas (0 = domingo … 6 = sábado; null = cerrado), para el estado
 * "Ouvert / Fermé" en vivo. Si cambia `hours`, cambiar también esto.
 */
const SCHEDULE: ReadonlyArray<readonly [number, number] | null> = [
  null, [10, 19], [10, 19], [10, 19], [10, 19], [10, 19], [9, 17],
];
const DAY_NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];

/** Hora actual en Laval (America/Toronto), sin depender de la zona del visitante. */
export function lavalNow(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Toronto' }));
}

/** "Ouvert · jusqu'à 19 h" / "Fermé · ouvre demain à 10 h", calculado con la hora de Laval. */
export function openStatus(now: Date = lavalNow()): { open: boolean; label: string } {
  const dow = now.getDay();
  const h = now.getHours() + now.getMinutes() / 60;
  const today = SCHEDULE[dow];
  if (today && h >= today[0] && h < today[1]) return { open: true, label: `Ouvert · jusqu’à ${today[1]}\u00a0h` };
  for (let k = 0; k < 7; k += 1) {
    const d = (dow + k) % 7;
    const slot = SCHEDULE[d];
    if (!slot || (k === 0 && h >= slot[0])) continue;
    const when = k === 0 ? 'aujourd’hui' : k === 1 ? 'demain' : DAY_NAMES[d];
    return { open: false, label: `Fermé · ouvre ${when} à ${slot[0]}\u00a0h` };
  }
  return { open: false, label: 'Fermé' };
}
