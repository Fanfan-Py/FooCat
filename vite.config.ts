import { defineConfig } from 'vite';

// base relative : le jeu marche depuis n'importe quel dossier ou hébergement
export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
});
