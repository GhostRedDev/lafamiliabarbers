import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// /api/connek/* lo atiende el conector (server/server.cjs: `npm run api`, puerto 3023). Sin el
// conector corriendo, la reserva funciona en modo degradado (horas de referencia) y el envío falla
// con un error honesto: nunca un falso "confirmado".
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5183,
    strictPort: true,
    proxy: { '/api/connek': { target: 'http://127.0.0.1:3023', changeOrigin: false } },
  },
  preview: {
    port: 4183,
    strictPort: true,
    proxy: { '/api/connek': { target: 'http://127.0.0.1:3023', changeOrigin: false } },
  },
});
