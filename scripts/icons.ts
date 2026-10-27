// Dessine les icônes de l'application (écran d'accueil du téléphone) avec le moteur pixel art.
import { FC } from '../src/art';
import { savePng } from '../tests/png';

function icon(base: number, k: number, file: string, heroScale = 1) {
  const p = new FC.Pix(base, base);
  p.vgrad([[0, FC.col('0b0a26')], [0.6, FC.col('1d1450')], [1, FC.col('3a1d6e')]]);
  const R = FC.rng(4);
  for (let i = 0; i < base / 3; i++) p.put(Math.floor(R() * base), Math.floor(R() * base), i % 4 ? FC.col('c9c4ff') : FC.P.y);
  let hero = FC.spr('hero', 0);
  if (heroScale > 1) hero = hero.scale(heroScale);
  const hx = Math.round((base - hero.w) / 2) + 2, hy = Math.round((base - hero.h) / 2);
  for (let i = 0; i < 6; i++) p.rect(0, hy + hero.h - 12 + i, hx + 6, 1, FC.RAINBOW[i]); // traînée arc-en-ciel
  p.blit(hero, hx, hy);
  savePng(p, k, 'public/icons/' + file);
}
icon(45, 4, 'icon-180.png');
icon(48, 4, 'icon-192.png');
icon(64, 8, 'icon-512.png');
icon(64, 8, 'icon-maskable-512.png');
console.log('icônes créées dans public/icons');
