# La Familia — Salon de barbier (Laval)

Rediseño del sitio de La Familia Barber (export original en `_export-original/`). React 18 + Vite +
TypeScript, en francés, estilo oscuro rojo (rojo oscuro / rojo claro). Reservas con el mismo
mecanismo de Connek que Punta Cana Barbers.

## Desarrollo

```bash
npm install
npm run dev        # web en http://localhost:5183 (proxy /api/connek → 127.0.0.1:3023)
npm run api        # conector Connek en 127.0.0.1:3023 (lee server/.env)
npm run build      # tsc + vite build → dist/
node --test server/server.test.cjs
```

## Estructura

- `src/components/*`: Header (menú a pantalla completa), Hero, Manifesto, Services, BookBand
  (bloque rojo de reserva), Team, Gallery, Location, Faq, FinalCta, Footer y Booking/BookingModal.
- `src/hooks/useBooking.ts`: flujo de reserva en 6 pasos (servicio, barbero, fecha, hora, datos,
  confirmación).
- `src/content/`: datos del salón (`site.ts`) y servicios con precios (`services.ts`).
- `server/server.cjs`: conector Connek (HMAC) + correo de respaldo con Resend.
- `api/connek/*.js`: funciones de Vercel que delegan en el mismo servidor.

## Temas y movimiento

- Claro y oscuro: `<html data-theme>`, fijado antes de pintar en `index.html` (elección guardada en
  `localStorage` `lafamilia-theme`, si no la del sistema). Tokens en `src/styles/tokens.css`; las
  zonas siempre oscuras llevan `.theme-dark` (portada, bloque rojo, cierre, menú, fotos) y
  `.theme-page` devuelve el tema de la página dentro de ellas. Botón: `ThemeToggle` (revelado en
  círculo con View Transitions donde existe).
- Movimiento: `src/lib/motion.ts` (parallax `[data-parallax]` → `--p`, portada `--hp`, avance
  `--progress`, botones `[data-magnetic]`), revelados `[data-reveal]` (títulos con máscara,
  fotos `data-reveal="wipe"`) en `App.tsx`, cintas `Marquee`, contadores `CountUp`, telón de
  entrada una vez por sesión. Todo se desactiva con `prefers-reduced-motion`.

## Reservas (Connek)

- `GET /api/connek/team?service=` → equipo que recibe reservas (`/v1/staff`). Sin equipo, el paso
  "Barbier" se salta y la sección Équipe muestra datos del salón (no se inventan personas).
- `GET /api/connek/availability` → horas libres reales. Si Connek no responde, se ofrecen horas de
  referencia dentro del horario y el salón confirma.
- `POST /api/connek/booking` → ficha + cita; `409` = hora ocupada (vuelve a las horas);
  `400 invalid_phone`. Si no hay reserva posible queda como lead y se envía correo de respaldo.
- Sin claves ni Resend configurados el envío falla de forma visible: nunca hay confirmación falsa.

Variables (Vercel → Settings → Environment Variables, o `server/.env`; ver `server/.env.example`):
`CONNEK_API_KEY_ID`, `CONNEK_API_KEY_SECRET`, `CONNEK_API_BASE_URL`, `CONNEK_GATEWAY_KEY`,
`CONNEK_SERVICES` (`coupe:ID,coupe-barbe:ID,…`; claves en `src/content/services.ts`), `CONNEK_SERVICE_ID`, `CONNEK_BOOKING_MINUTES`,
`CONNEK_TZ`, `CONNEK_MIN_LEAD_MINUTES`, `CONNEK_DEFAULT_COUNTRY_CODE`, `RESEND_API_KEY`,
`FROM_EMAIL`, `BUSINESS_NOTIFY_EMAIL`, `RESEND_MODE`.

## Pendiente del cliente

- Confirmar dirección: el export trae "255 Boulevard de la Concorde Ouest" y el conector de Punta
  Cana "225 … #9, H7N 5T1" (se usa la segunda).
- Confirmar horario (el export lo marcaba "à confirmer").
- Enlaces de Instagram, WhatsApp y reseña de Google (`src/content/site.ts`; vacíos = ocultos).
- Equipo y servicios dados de alta en Connek (IDs para `CONNEK_SERVICES`).
- Fotos reales del salón: solo el dégradé (`client-fade`) es del salón; el resto es de stock.
