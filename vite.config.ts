/**
 * vite.config.ts
 *
 * ATENÇÃO: No Wix Vibe com Astro, o Vite principal é configurado
 * dentro de astro.config.mjs (seção vite:). Este arquivo só é
 * usado por ferramentas auxiliares como vitest.
 *
 * Correções aplicadas:
 *   - 'dirname' → fileURLToPath(import.meta.url) correto para ESM
 *     (o projeto é "type":"module" — dirname não existe em ESM)
 *   - Removido @vitejs/plugin-react (não está no package.json)
 *   - Mantido apenas o alias @ necessário para vitest funcionar
 */

import { defineConfig } from 'vite';
import path             from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
