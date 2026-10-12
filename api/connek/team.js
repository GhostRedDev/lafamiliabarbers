// Vercel: misma ruta que en el VPS, atendida por el MISMO conector (server/server.cjs).
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { server } = require('../../server/server.cjs');

export default function handler(req, res) {
  server.emit('request', req, res);
}
