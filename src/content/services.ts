// Servicios del export del cliente (sección "Nos services"). `key` = la clave que el conector
// traduce a un servicio de Connek (CONNEK_SERVICES en server/.env).

export interface Service {
  key: 'coupe' | 'degrade' | 'rituel';
  name: string;
  price: number;
  minutes: number;
  description: string;
}

export const services: readonly Service[] = [
  {
    key: 'coupe',
    name: 'Coupe & Styling',
    price: 45,
    minutes: 45,
    description:
      'Une coupe sur mesure, adaptée à la forme de votre visage et à votre style de vie, finie au rasoir pour une netteté parfaite.',
  },
  {
    key: 'degrade',
    name: 'Dégradé Signature',
    price: 55,
    minutes: 50,
    description:
      'Notre fade maison\u00a0: transitions impeccables, contours précis au coupe-chou, fini irréprochable dès la première visite.',
  },
  {
    key: 'rituel',
    name: 'Rituel Complet',
    price: 85,
    minutes: 75,
    description:
      'Coupe, serviette chaude, rasage traditionnel et soin du visage — l’expérience La Familia dans son intégralité.',
  },
];

export const priceLabel = (price: number) => `${price} $`;
