// Dessin d'un niveau (décor, personnages, tirs, effets) et de la barre du haut.
import { FC, Pix, Color } from '../art';
import * as C from './config';
import { World, WEAPON_ORDER, rainStage } from './world';
import { enemySprite, elecOn, elecSoon, cablePoint, jetState, jetOrigin, jetCircles, enemyCenter, spriteOffset, lavaState } from './things';
import { heroSprite } from './rewards';

// apparence de la soucoupe choisie par le joueur
let heroSkin = 'classic', heroCat = 'classic';
export function setHeroSkin(id: string, cat = heroCat) { heroSkin = id; heroCat = cat; }

const P = FC.P;
const BONUS_SPRITE: Record<string, string> = {
  verm: 'bVerm', drag: 'bDrag', pinata: 'bPinata', jaw: 'bJaw', heart: 'bLife', life: 'b1up', bomb: 'bBomb', ghost: 'bGhost',
};

function far(p: Pix, tint: Color, k: number) { const q = new FC.Pix(p.w, p.h); q.blit(p, 0, 0); return q.tint(tint, k); }
function hash(n: number) { n = (n << 13) ^ n; return ((n * (n * n * 15731 + 789221) + 1376312589) & 0x7fffffff) / 0x7fffffff; }

// ---------- décors ----------
function decorSpace(scr: Pix, w: World) {
  const d = FC.mk('decorSpace', () => {
    const tint = FC.col('12123f');
    return {
      bg: FC.bg('n1', C.W, C.H, [[0, '070722'], [0.55, '12123f'], [1, '24154f']]), stars: FC.stars(11, C.W, C.H, 140),
      far: [far(FC.donutPlanet(9, 'p', 4), tint, 0.55), far(FC.cakePlanet(6, 'g', 'W', 5), tint, 0.55), far(FC.macaronPlanet(8, 'b', 'W'), tint, 0.55)],
    };
  }), t = w.t;
  scr.d.set(d.bg.d);
  FC.drawStars(scr, d.stars, t, [3, 9, 20]);
  scr.blit(d.far[0], FC.wx(210, 5, t, C.W + 120, 40), 34);
  scr.blit(d.far[1], FC.wx(90, 5, t, C.W + 120, 40), 140);
  scr.blit(d.far[2], FC.wx(320, 5, t, C.W + 120, 40), 96);
}

function decorNebula(scr: Pix, w: World) {
  const d = FC.mk('decorNebula', () => {
    const neb = new FC.Pix(640, C.H), R = FC.rng(5);
    for (let i = 0; i < 16; i++) {
      const c = [FC.col('ff6fb5'), FC.col('4fd6d0'), FC.col('b07bff')][i % 3], x = R() * 640, y = R() * C.H, r = 20 + R() * 40;
      for (const ox of [-640, 0, 640]) { // dessiné aussi de l'autre côté pour que le nuage boucle sans coupure
        neb.ell(x + ox, y, r * 1.6, r, (px: number, py: number, dx: number, dy: number) => {
          const q = dx * dx + dy * dy; if (q > 0.75 && (px + py) % 2) return null;
          return FC.alpha(c, q < 0.3 ? 70 : 40);
        });
      }
    }
    const tint = FC.col('3b1460');
    return {
      bg: FC.bg('n2', C.W, C.H, [[0, '1a0b3d'], [0.5, '3b1460'], [1, '5c1f6e']]), neb, stars: FC.stars(21, C.W, C.H, 150),
      far: [far(FC.ringPlanet(7, 'b', 'P', 'W'), tint, 0.5), far(FC.donutPlanet(8, 'y', 9), tint, 0.5), far(FC.macaronPlanet(7, 'P', 'W'), tint, 0.5)],
      giant: FC.giantPlanet(100),
    };
  }), t = w.t;
  scr.d.set(d.bg.d);
  const nx = -Math.floor((t * 4) % 640);
  scr.blit(d.neb, nx, 0); scr.blit(d.neb, nx + 640, 0);
  FC.drawStars(scr, d.stars, t, [4, 10, 22]);
  scr.blit(d.far[0], FC.wx(150, 6, t, C.W + 120, 40), 40);
  scr.blit(d.far[1], FC.wx(300, 6, t, C.W + 120, 40), 128);
  scr.blit(d.far[2], FC.wx(40, 6, t, C.W + 120, 40), 84);
  // la grosse planète approche à la fin du niveau
  let k = Math.max(0, (w.progress - 0.84) / 0.16);
  if (w.state === 'cleared') k = 1 + w.stateT * 0.35;
  if (k > 0) scr.blit(d.giant, Math.round(C.W + 10 - k * 115), -22);
}

function hills(scr: Pix, t: number, sp: number, base: number, amp: number, c: Color, top: Color, seed: number) {
  const off = t * sp;
  for (let x = 0; x < scr.w; x++) {
    const u = x + off;
    const h = Math.round(base + Math.sin(u * 0.031 + seed) * amp + Math.sin(u * 0.083 + seed * 2) * amp * 0.4);
    scr.rect(x, h, 1, scr.h - h, c); scr.put(x, h, top);
  }
}

function decorPlanet(scr: Pix, w: World) {
  const d = FC.mk('decorPlanet', () => {
    const sky = FC.col('c27fc4');
    return {
      bg: FC.bg('n3', C.W, C.H, [[0, '5b3f9a'], [0.55, 'c27fc4'], [1, 'ffc1a6']]),
      ring: far(FC.ringPlanet(16, 'y', 'P', 'W'), sky, 0.35), moon: FC.cakePlanet(6, 'b', 'W', 31),
    };
  }), t = w.t;
  scr.d.set(d.bg.d);
  scr.blit(d.ring, 200, 22); scr.blit(d.moon, 120, 30);
  hills(scr, t, 6, 112, 10, FC.col('ffe1ef'), P.W, 1);
  hills(scr, t, 14, 130, 7, FC.col('9fe8c8'), FC.col('d8fff0'), 4);
}

// sol en gâteau : glaçage, génoise, crème, chocolat
function cakeGround(scr: Pix, t: number, sp: number, y0: number) {
  const off = Math.floor(t * sp);
  for (let x = 0; x < scr.w; x++) {
    const u = x + off, drip = hash(Math.floor(u / 3)) > 0.7 ? 2 + Math.floor(hash(Math.floor(u / 3) + 9) * 4) : 0;
    scr.rect(x, y0, 1, 6 + drip, (u % 9 === 0) ? P.q : P.P);
    scr.rect(x, y0 + 6 + drip, 1, 8 - drip, P.d);
    scr.rect(x, y0 + 14, 1, 2, P.W);
    scr.rect(x, y0 + 16, 1, 6, P.D);
    scr.rect(x, y0 + 22, 1, scr.h - y0 - 22, P.l);
    if (hash(u * 7) > 0.86) scr.put(x, y0 + 2 + (u % 3), FC.SPRINKLES[u % 7]);
  }
  scr.rect(0, y0 - 1, scr.w, 1, P.K);
}

// ---------- niveau 4 : les terres de fer ----------
function decorIron(scr: Pix, w: World) {
  const d = FC.mk('decorIron', () => {
    const smoke = new FC.Pix(640, C.H), R = FC.rng(8);
    for (let i = 0; i < 14; i++) {
      const x = R() * 640, y = 50 + R() * 90, r = 20 + R() * 30;
      for (const ox of [-640, 0, 640]) {
        smoke.ell(x + ox, y, r * 1.8, r * 0.7, (px: number, py: number, dx: number, dy: number) => (dx * dx + dy * dy > 0.6 && (px + py) % 2) ? null : FC.alpha(FC.col('1a0610'), 90));
      }
    }
    return { bg: FC.bg('n4', C.W, C.H, [[0, '14060f'], [0.5, '3e0c22'], [1, '7a2330']]), stars: FC.stars(41, C.W, 90, 50), smoke, fort: FC.fortress() };
  }), t = w.t;
  scr.d.set(d.bg.d);
  FC.drawStars(scr, d.stars, t, [2, 4, 8]);
  scr.ell(250, 40, 18, 18, FC.alpha(FC.col('ff5a3c'), 90)); scr.ell(250, 40, 12, 12, FC.col('ff7a4a'));
  // la forteresse se rapproche au fil du niveau
  let k = w.progress; if (w.state === 'cleared') k = 1 + w.stateT * 0.4;
  scr.blit(d.fort, Math.round(C.W + 10 - k * 170), (w.level.ground ?? C.H) - 72);
  const sx = -Math.floor((t * 10) % 640); scr.blit(d.smoke, sx, 0); scr.blit(d.smoke, sx + 640, 0);
}
function metalGround(scr: Pix, t: number, sp: number, y0: number) {
  const off = Math.floor(t * sp);
  for (let x = 0; x < scr.w; x++) {
    const u = x + off;
    scr.rect(x, y0, 1, 3, (u >> 2) % 2 ? P.Y : P.x);
    scr.rect(x, y0 + 3, 1, scr.h - y0 - 3, u % 24 === 0 ? P.N : P.M);
    if (u % 24 === 3 || u % 24 === 20) { scr.put(x, y0 + 6, P.m); scr.put(x, y0 + 22, P.m); }
    scr.put(x, y0 + 12, P.n); scr.put(x, y0 + 13, (u % 6 < 3) ? P.m : P.n);
  }
  scr.rect(0, y0 - 1, scr.w, 1, P.K);
}

// ---------- niveau 5 : dans la forteresse ----------
function decorFortress(scr: Pix, w: World) {
  const wall = FC.mk('fortWall', () => {
    const p = new FC.Pix(640, C.H), seam = FC.col('151a2a'), hi = FC.col('2a3048');
    for (let y = 0; y < C.H; y++) for (let x = 0; x < 640; x++) {
      const px = x % 32, py = y % 24;
      let c = P.N;
      if (px === 0 || py === 0) c = seam; else if ((px === 3 || px === 28) && (py === 3 || py === 20)) c = P.n; else if (py === 1) c = hi;
      p.put(x, y, c);
    }
    for (let k = 0; k < 640; k += 80) { p.rect(k + 10, 0, 4, C.H, P.n); p.rect(k + 11, 0, 1, C.H, P.M); }
    return p;
  }), t = w.t;
  const o = -Math.floor((t * 8) % 640);
  scr.blit(wall, o, 0); scr.blit(wall, o + 640, 0);
  const on = Math.floor(t * 3) % 2;
  for (let k = 0; k < 4; k++) {
    const lx = ((k * 96 + 40 - t * 8) % 384 + 384) % 384 - 32;
    scr.ell(lx, 34, 3, 3, on ? P.R : FC.col('5a1020'));
    if (on) scr.ell(lx, 34, 7, 7, FC.alpha(P.R, 50));
  }
}
// plafond et sol de la forteresse (dessinés devant les piliers)
function fortressBands(scr: Pix, w: World) {
  const top = w.level.ceiling ?? C.HUD_H, G = w.level.ground ?? C.H, off = Math.floor(w.t * w.level.scroll);
  scr.rect(0, C.HUD_H, C.W, top - C.HUD_H, P.M); scr.rect(0, top - 1, C.W, 1, P.K);
  for (let x = 0; x < C.W; x++) if (((x + off) >> 2) % 2) scr.put(x, top - 4, P.Y);
  scr.rect(0, G, C.W, C.H - G, P.n); scr.rect(0, G, C.W, 1, P.K); scr.rect(0, G + 1, C.W, 1, P.M);
  for (let x = 0; x < C.W; x++) if ((x + off) % 6 < 2) scr.rect(x, G + 4, 1, C.H - G - 4, P.N);
}

// ---------- niveau 6 : retour dans l'espace ----------
function decorSpace2(scr: Pix, w: World) {
  const d = FC.mk('decorSpace2', () => {
    const tint = FC.col('0f1f4a');
    return { bg: FC.bg('n6', C.W, C.H, [[0, '050a1f'], [0.6, '0f1f4a'], [1, '1d3a6e']]), stars: FC.stars(61, C.W, C.H, 150), ocean: far(FC.oceanPlanet(14), tint, 0.4) };
  }), t = w.t;
  scr.d.set(d.bg.d);
  FC.drawStars(scr, d.stars, t, [3, 9, 20]);
  scr.blit(d.ocean, C.W - 70 - Math.round(w.progress * 30), 22);
}
// ---------- niveau 11 : retour dans l'espace, Vulcano au loin ----------
function decorSpace3(scr: Pix, w: World) {
  const d = FC.mk('decorSpace3', () => ({ bg: FC.bg('n11', C.W, C.H, [[0, '0a0618'], [0.6, '1a0e2e'], [1, '2e1020']]), stars: FC.stars(111, C.W, C.H, 150) }));
  scr.d.set(d.bg.d);
  FC.drawStars(scr, d.stars, w.t, [3, 9, 20]);
  scr.blit(FC.vulcanoPlanet(16), C.W - 54 - Math.round(w.progress * 30), 24, false, 0.7);
}
// ---------- niveau 12 : approche de Vulcano, le ciel passe du bleu nuit au rouge orangé ----------
const SKY12 = { s: ['0b0a26', '1d1450', '3a1d6e'], v: ['5a1408', 'c4401a', 'ffb040'] };
function decorApproach(scr: Pix, w: World) {
  const d = FC.mk('decorApproach', () => ({ stars: FC.stars(121, C.W, C.H, 120), s: SKY12.s.map((c) => FC.col(c)), v: SKY12.v.map((c) => FC.col(c)) }));
  let u = Math.min(1, w.progress * 1.1); if (w.state === 'cleared') u = 1;
  const top = FC.mix(d.s[0], d.v[0], u), mid = FC.mix(d.s[1], d.v[1], u), bot = FC.mix(d.s[2], d.v[2], u);
  for (let y = 0; y < C.H; y += 2) {
    const q = y / (C.H - 1), c = q < 0.6 ? FC.mix(top, mid, q / 0.6) : FC.mix(mid, bot, (q - 0.6) / 0.4);
    scr.rect(0, y, C.W, 2, c);
  }
  if (u < 0.85) FC.drawStars(scr, d.stars, w.t, [3, 9, 20]);
  let k = u; if (w.state === 'cleared') k = 1 + w.stateT * 0.3;
  const pl = FC.vulcanoPlanet(16 + Math.round(Math.min(k, 1.6) * 10) * 4); // Vulcano grossit à mesure qu'on approche
  scr.blit(pl, C.W - pl.w * 0.55 + 10 - Math.round(k * 10), 90 - pl.h / 2);
}
// ---------- niveau 13 : sur la planète Vulcano ----------
const LV = { y: FC.col('ffd23f'), o: FC.col('ff9a3c'), r: FC.col('ff4d2e'), d: FC.col('b3201a') };
function decorVulcano(scr: Pix, w: World) {
  const d = FC.mk('decorVulcano', () => ({ bg: FC.bg('n13', C.W, C.H, [[0, '2a0810'], [0.55, '8a2418'], [1, 'ff8a3c']]), volcano: FC.volcanoBg().scale(2) }));
  const t = w.t;
  scr.d.set(d.bg.d);
  const vx = C.W - 230 - Math.round(w.progress * 60);
  scr.blit(d.volcano, vx, 150 - d.volcano.h + 4);
  // le volcan fume (les vraies boules de feu, dangereuses, sont des tirs ennemis)
  for (let s2 = 0; s2 < 4; s2++) { const sp = (t * 0.3 + s2 / 4) % 1; scr.ell(vx + 150 + Math.sin(sp * 5 + s2) * 10, 22 - sp * 30, 4 + sp * 10, 3 + sp * 6, FC.alpha(FC.col('5a4048'), 140 * (1 - sp))); }
}
function vulcanoGround(scr: Pix, w: World) { // sol de roche sombre avec des mares de lave
  const G = w.level.ground!, off = Math.floor(w.t * w.level.scroll), t = w.t;
  for (let x = 0; x < C.W; x++) {
    const u = x + off, pool = (u % 150) > 96 && (u % 150) < 136;
    const h = G + Math.round(Math.sin(u * 0.07) * 1.5);
    if (pool) {
      const ly = h + 3 + Math.round(Math.sin(u * 0.3 + t * 3) * 1);
      scr.rect(x, h, 1, ly - h, FC.col('3e2c30')); scr.put(x, ly, LV.y); scr.rect(x, ly + 1, 1, C.H - ly, (u + Math.floor(t * 8)) % 7 === 0 ? LV.o : LV.r);
    } else {
      scr.rect(x, h, 1, C.H - h, FC.col('3e2c30')); scr.put(x, h, FC.col('6b4a48'));
      if ((u * 13) % 23 === 0) scr.put(x, h + 6, FC.col('261a20'));
      if ((u * 7) % 31 === 0) scr.put(x, h + 3 + (u % 9), LV.o);
    }
  }
}
// ---------- niveau 14 : dans l'antre du volcan ----------
function decorCave(scr: Pix, w: World) {
  const d = FC.mk('decorCave', () => ({ bg: FC.bg('n14', C.W, C.H, [[0, '1a0608'], [0.6, '3a0e10'], [1, '5a1810']]) }));
  scr.d.set(d.bg.d);
  const off = Math.floor(w.t * 10);
  for (let k = -1; k < 5; k++) { // piliers de roche au loin, fissures qui brillent
    const x = 40 + k * 90 - (off % 90);
    scr.rect(x, 0, 18, C.H, FC.col('2a0c10')); scr.rect(x, 0, 3, C.H, FC.col('3e1418'));
    for (let y = 40; y < 150; y += 37) scr.line(x + 6, y, x + 11, y + 10, FC.alpha(LV.o, 120));
  }
}
function caveFront(scr: Pix, w: World) {
  const top = w.top, G = w.level.ground!, off = Math.floor(w.t * w.level.scroll), t = w.t, rock = FC.col('261a20'), edge = FC.col('3e2c30');
  scr.rect(0, C.HUD_H, C.W, top - C.HUD_H, rock); scr.rect(0, top - 1, C.W, 1, edge);
  for (let x = -20; x < C.W + 20; x += 1) { // stalactites
    const u = x + off, k = ((u % 23) + 23) % 23, len = (u * 7) % 3 === 0 ? 10 : 6;
    if (k < 8) scr.rect(x, top, 1, Math.max(0, Math.round(len * (1 - Math.abs(k - 4) / 4))), rock);
  }
  scr.rect(0, G, C.W, C.H - G, rock); scr.rect(0, G, C.W, 1, edge);
  for (let x = 0; x < C.W; x++) { const ly = C.H - 6 + Math.round(Math.sin((x + off) * 0.2 + t * 2)); scr.rect(x, ly, 1, C.H - ly, (x + off) % 9 === 0 ? LV.y : LV.r); } // rivière de lave
}

// ---------- niveau 15 : la salle du trône du volcan ----------
function decorVolcanoThrone(scr: Pix, w: World) {
  const d = FC.mk('decorVThrone', () => ({ bg: FC.bg('n15', C.W, C.H, [[0, '0c0610'], [0.6, '1e0c18'], [1, '4a1010']]) }));
  const t = w.t, off = Math.floor(t * 12);
  scr.d.set(d.bg.d);
  // le trône au fond
  const tx = 132 - Math.round(w.progress * 20);
  scr.rect(tx, 40, 56, 118, FC.col('1a0e18')); scr.tri(tx, 40, tx + 28, 16, tx + 56, 40, FC.col('1a0e18')); scr.rect(tx + 10, 60, 36, 40, FC.col('2a1420'));
  scr.ell(tx + 28, 36, 6, 6, FC.alpha(LV.r, 120 + Math.round(Math.sin(t * 3) * 60)));
  // colonnes d'obsidienne avec des veines de lave
  for (let k = -1; k < 5; k++) {
    const x = 24 + k * 90 - (off % 90);
    scr.rect(x - 9, 14, 18, 146, FC.col('140a14')); scr.rect(x - 9, 14, 3, 146, FC.col('3a2a40'));
    for (let y = 20; y < 160; y += 2) scr.put(x + Math.round(Math.sin(y * 0.12 + k) * 3), y, (y + Math.floor(t * 10)) % 12 < 2 ? LV.y : FC.alpha(LV.r, 150));
  }
}
function volcanoThroneFront(scr: Pix, w: World) { // plafond d'obsidienne, fossé de lave
  const top = w.top, G = w.level.ground!, t = w.t, off = Math.floor(t * w.level.scroll);
  scr.rect(0, C.HUD_H, C.W, top - C.HUD_H, FC.col('140a14')); scr.rect(0, top - 1, C.W, 1, FC.col('3a2a40'));
  for (let x = 0; x < C.W; x++) {
    const h = G + Math.round(Math.sin((x + off) * 0.13 + t * 2) * 1.5 + Math.sin((x + off) * 0.05 - t) * 1);
    scr.put(x, h, LV.y); scr.rect(x, h + 1, 1, 2, LV.o); scr.rect(x, h + 3, 1, C.H - h - 3, (x + off) % 9 === 0 ? LV.o : LV.r);
  }
}

// ---------- niveau 16 : le vaisseau des boss ----------
function decorShip(scr: Pix, w: World) {
  const d = FC.mk('decorShip', () => ({ bg: FC.bg('n16', C.W, C.H, [[0, '1e2638'], [1, '2a3248']]), stars: FC.stars(161, C.W, C.H, 80) }));
  const t = w.t, off = Math.floor(t * 14);
  scr.d.set(d.bg.d);
  for (let k = -1; k < 6; k++) { // plaques de métal et hublots qui donnent sur l'espace
    const x = k * 64 - (off % 64);
    scr.rect(x, 14, 1, C.H, FC.col('141a2a'));
    for (let y = 30; y < 150; y += 20) scr.put(x + 4, y, P.m);
    const hx = x + 32, hy = 70;
    scr.ell(hx, hy, 15, 15, P.n); scr.ell(hx, hy, 12, 12, FC.col('050a1f'));
    for (let s2 = 0; s2 < 5; s2++) { const sx = hx - 10 + ((s2 * 7 + Math.floor(t * 30)) % 20), sy = hy - 8 + (s2 * 5) % 16; if ((sx - hx) ** 2 + (sy - hy) ** 2 < 120) scr.put(sx, sy, P.W); }
    for (let r = 0; r < 8; r++) { const a = r / 8 * Math.PI * 2; scr.put(hx + Math.cos(a) * 15, hy + Math.sin(a) * 15, P.m); }
  }
  for (let v = 0; v < 6; v++) scr.put(20 + v * 56, 30, (Math.floor(t * 3) + v) % 2 ? P.R : FC.col('5a1020')); // voyants rouges
}
function shipFront(scr: Pix, w: World) { // tuyaux au plafond, sol à bandes de danger
  const top = w.top, G = w.level.ground!, off = Math.floor(w.t * w.level.scroll);
  scr.rect(0, C.HUD_H, C.W, top - C.HUD_H, P.n); scr.rect(0, top - 4, C.W, 1, P.M); scr.rect(0, top - 1, C.W, 1, P.K);
  scr.rect(0, G, C.W, C.H - G, P.n); scr.rect(0, G, C.W, 1, P.m);
  for (let x = -8; x < C.W; x += 8) scr.rect(x + (8 - off % 8), G + 2, 4, 3, P.Y);
}

// ---------- niveau 7 : vers la planète aquatique ----------
function decorOcean(scr: Pix, w: World) {
  const d = FC.mk('decorOcean', () => ({ bg: FC.bg('n7', C.W, C.H, [[0, '06142e'], [0.6, '0d3360'], [1, '1a5a8a']]), stars: FC.stars(71, C.W, C.H, 120), ocean: FC.oceanPlanet(92) }));
  const t = w.t;
  scr.d.set(d.bg.d);
  FC.drawStars(scr, d.stars, t, [3, 8, 18]);
  let k = w.progress; if (w.state === 'cleared') k = 1 + w.stateT * 0.5;
  scr.blit(d.ocean, Math.round(C.W + 10 - k * 120), -6);
}

// jet de paillettes : il jaillit en biais du rocher, scintille juste avant, et peut cacher des monstres
function drawJet(scr: Pix, o: any, t: number) {
  const st = jetState(o, t), g = jetOrigin(o);
  if (st === 'off') return;
  if (st === 'warn') { for (let k = 0; k < 8; k++) scr.put(g.x - 5 + ((k * 5 + Math.floor(t * 20)) % 11), g.y + g.dy * (2 + (k % 3)), FC.alpha(FC.RAINBOW[k % 6], 220)); return; }
  const L = C.JET.length, px = -g.dy, py = g.dx; // direction en travers du jet
  for (let i = 0; i < 360; i++) {
    const ph = (((i * 37) % 100) / 100 + t * 0.9) % 1, spread = (i % 11 - 5) * (1.5 + ph * 5);
    const x = g.x + g.dx * ph * L + px * spread * 0.9, y = g.y + g.dy * ph * L + py * spread * 0.9;
    const c = FC.alpha(i % 5 ? FC.RAINBOW[i % 6] : P.W, 240 * (1 - ph * 0.5));
    scr.put(x, y, c); if (i % 3 === 0) scr.put(x + 1, y, c);
  }
}
// un monstre est-il caché dans un jet allumé ?
function inJet(w: World, x: number, y: number) {
  return w.obstacles.some((o) => o.jet && jetState(o, w.t) === 'on' && jetCircles(o).some(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 < (r + 6) ** 2));
}

// ---------- niveau 8 : la planète sous-marine ----------
function floatBits(scr: Pix, t: number, n: number) { // petites particules qui remontent
  for (let k = 0; k < n; k++) {
    const x = (k * 53 + 20) % scr.w, y = scr.h - ((t * (8 + k % 5) + k * 31) % scr.h);
    scr.put(x + Math.sin(t + k) * 2, y, FC.alpha(P.W, 110));
  }
}
function decorSea(scr: Pix, w: World) {
  const d = FC.mk('decorSea', () => ({ bg: FC.bg('n8', C.W, C.H, [[0, '1d7fb8'], [0.5, '0e4f8a'], [1, '0a2a55']]) })), t = w.t;
  scr.d.set(d.bg.d);
  for (let k = 0; k < 5; k++) { // rayons de lumière
    const x = ((k * 83 + t * 6) % 420) - 60;
    for (let y = 26; y < 150; y++) scr.rect(x + y * 0.45, y, 10, 1, FC.alpha(P.W, 14));
  }
  const dark = FC.col('0b3a63');
  for (let x = 0; x < C.W; x++) { const h = 122 + Math.round(Math.sin((x + t * 10) * 0.04) * 8); scr.rect(x, h, 1, C.H - h, dark); }
  floatBits(scr, t, 30);
}
// devant les obstacles : plafond de roche, sable et coraux
function seaFront(scr: Pix, w: World) {
  const t = w.t, off = Math.floor(t * w.level.scroll), top = w.top, G = w.level.ground!;
  const rock = FC.col('1b2f4f'), rockHi = FC.col('3a5a80'), sand = FC.col('e8c98a'), sandHi = FC.col('fff0c0'), dot = FC.col('c9a46a');
  for (let x = 0; x < C.W; x++) {
    const u = x + off, h = top + Math.round(Math.sin(u * 0.07) * 2 + Math.sin(u * 0.19) * 1.5);
    scr.rect(x, C.HUD_H, 1, h - C.HUD_H, rock); scr.put(x, h, rockHi);
    const g = G + Math.round(Math.sin(u * 0.05) * 2 + Math.sin(u * 0.13));
    scr.rect(x, g, 1, C.H - g, sand); scr.put(x, g, sandHi);
    if ((u * 13) % 17 === 0) scr.put(x, g + 6, dot);
    if ((u * 7) % 41 === 0) scr.put(x, g + 3, P.q);
  }
}
// ---------- niveau 9 : le château marin ----------
function decorCastle(scr: Pix, w: World) {
  const wall = FC.mk('seaWall', () => {
    const p = new FC.Pix(640, C.H), stone = FC.col('2a2d5c'), seam = FC.col('1a1c40'), moss = FC.col('2f8f7a'), glow = FC.alpha(FC.col('7fe0ff'), 120);
    for (let y = 0; y < C.H; y++) for (let x = 0; x < 640; x++) {
      const row = Math.floor(y / 12), bx = (x + (row % 2) * 10) % 20;
      p.put(x, y, y % 12 === 0 || bx === 0 ? seam : (x * 7 + y * 3) % 53 === 0 ? moss : stone);
    }
    for (let k = 0; k < 640; k += 160) { // fenêtres en arc qui brillent, colonnes
      p.ell(k + 80, 70, 16, 22, glow, (_x: number, _y: number, _dx: number, dy: number) => dy < 0.6);
      p.rect(k + 64, 70, 32, 18, glow);
      p.rect(k + 40, 0, 10, C.H, FC.col('3a3f78')); p.rect(k + 40, 0, 2, C.H, FC.col('5a60a0'));
    }
    return p;
  }), t = w.t, o = -Math.floor((t * 10) % 640);
  scr.blit(wall, o, 0); scr.blit(wall, o + 640, 0);
  floatBits(scr, t, 20);
}
function castleFront(scr: Pix, w: World) {
  const top = w.top, G = w.level.ground!, dark = FC.col('1a1c40'), off = Math.floor(w.t * w.level.scroll);
  scr.rect(0, C.HUD_H, C.W, top - C.HUD_H, dark); scr.rect(0, top - 1, C.W, 1, P.K);
  scr.rect(0, G, C.W, C.H - G, dark); scr.rect(0, G, C.W, 1, P.K);
  for (let x = 0; x < C.W; x++) if ((x + off) % 16 === 0) scr.rect(x, G + 1, 1, C.H - G - 1, P.K);
}

// salle du trône (niveau 10) : grande salle sombre, colonnes et torches vertes
function decorThrone(scr: Pix, w: World) {
  const bg = FC.bg('throne', C.W, C.H, [[0, '0a1030'], [0.6, '141a4a'], [1, '1f1440']]), t = w.t;
  scr.d.set(bg.d);
  const pillar = FC.col('23285a'), light = FC.col('343a7a'), o = Math.floor((t * 12) % 90);
  for (let k = -1; k < 5; k++) {
    const x = 30 + k * 90 - o;
    scr.rect(x, C.HUD_H, 14, C.H, pillar); scr.rect(x, C.HUD_H, 3, C.H, light);
    // torche : flamme verte qui vacille
    const fy = 74, fl = Math.sin(t * 9 + k * 2) * 1.5;
    scr.ell(x + 7, fy - 2, 9 + fl, 9 + fl, FC.alpha(FC.col('6dff9a'), 40));
    scr.rect(x + 5, fy, 5, 3, P.M);
    scr.ell(x + 7, fy - 3, 2.5, 3.5 + fl * 0.5, FC.col('6dff9a')); scr.put(x + 7, fy - 2, P.W);
  }
  floatBits(scr, t, 40);
}

const DECOR = { space: decorSpace, nebula: decorNebula, planet: decorPlanet, iron: decorIron, fortress: decorFortress, space2: decorSpace2, ocean: decorOcean, sea: decorSea, castle: decorCastle, throne: decorThrone, space3: decorSpace3, approach: decorApproach, vulcano: decorVulcano, cave: decorCave, volcanoThrone: decorVolcanoThrone, ship: decorShip };

// ---------- le niveau ----------
export function drawWorld(scr: Pix, w: World) {
  const t = w.t, h = w.hero;
  DECOR[w.level.decor](scr, w);

  const top = w.top;
  for (const o of w.obstacles) {
    if (o.kind === 'web') { // fils qui retiennent la toile (au ciel, ou au sol)
      const r = o.pix.w / 2, c = o.webGround ? FC.alpha(P.U, 200) : FC.alpha(P.W, 150);
      if (o.webGround) {
        scr.line(o.x + r * 0.55, o.y + r * 1.65, o.x + r * 0.3, w.floor, c);
        scr.line(o.x + r * 1.45, o.y + r * 1.65, o.x + r * 1.7, w.floor, c);
      } else {
        scr.line(o.x + r * 0.55, top, o.x + r * 0.55, o.y + r * 0.35, c);
        scr.line(o.x + r * 1.45, top, o.x + r * 1.45, o.y + r * 0.35, c);
      }
    }
    if (o.kind === 'cable') { // attaches qui pendent du ciel
      const c = FC.alpha(P.M, 220);
      scr.line(o.x + 2, top, o.x + 2, o.y + 1, c); scr.line(o.x + o.pix.w - 3, top, o.x + o.pix.w - 3, o.y + 1, c);
    }
    if (o.lava) { const [st, k] = lavaState(o, t); if (st !== 'off') FC.lavaFall(scr, o.x + 4, w.top, w.floor, st, k, t); continue; }
    scr.blit(o.pix, o.x, o.y);
    if (o.elec) drawElec(scr, o, t);
    if (o.kind === 'cable') { // étincelles qui courent le long du câble
      for (let k = 0; k < 4; k++) {
        const [px, py] = cablePoint(o, (t * 0.7 + k / 4) % 1), c = [P.y, P.b, P.W][(k + Math.floor(t * 10)) % 3];
        scr.put(px, py, c); scr.put(px - 1, py, FC.alpha(c, 160)); scr.put(px, py - 1, FC.alpha(c, 120)); scr.put(px, py + 1, FC.alpha(c, 120));
      }
      if (Math.floor(t * 8) % 3 === 0) { const [gx, gy] = cablePoint(o, (Math.sin(t * 3) + 1) / 2); scr.ell(gx, gy, 4, 3, FC.alpha(P.y, 60)); }
    }
  }
  if (w.level.decor === 'planet') cakeGround(scr, t, w.level.scroll, w.level.ground!);
  if (w.level.decor === 'iron') metalGround(scr, t, w.level.scroll, w.level.ground!);
  if (w.level.decor === 'fortress') fortressBands(scr, w);
  if (w.level.decor === 'sea') seaFront(scr, w);
  if (w.level.decor === 'castle' || w.level.decor === 'throne') castleFront(scr, w);
  if (w.level.decor === 'vulcano') vulcanoGround(scr, w);
  if (w.level.decor === 'cave') caveFront(scr, w);
  if (w.level.decor === 'volcanoThrone') volcanoThroneFront(scr, w);
  if (w.level.decor === 'ship') shipFront(scr, w);

  for (const b of w.bonuses) scr.blit(FC.spr(BONUS_SPRITE[b.kind]), b.x, b.y);
  const jets = w.obstacles.some((o) => o.jet);
  for (const e of w.enemies) {
    if (e.kind === 'hanger') scr.line(e.x + 11, top, e.x + 11, e.y + 4, FC.alpha(P.W, 190));
    const hidden = jets && inJet(w, ...enemyCenter(e));
    if (e.kind === 'magmaSnake') { // une mare de lave qui bouillonne, puis le serpent qui jaillit en arc
      const G = e.baseY;
      scr.ell(e.holdX, G + 2, 10, 3, LV.r); scr.ell(e.holdX, G + 1, 7, 1.5, LV.y);
      if (e.stage === 0) { for (let b = 0; b < 4; b++) { const bp = (t * 2 + b / 4) % 1; scr.ell(e.holdX - 6 + b * 4, G - bp * 8, 1 + bp, 1 + bp, FC.alpha(LV.o, 220 * (1 - bp))); } }
      else FC.magmaSnake(scr, e.holdX, G + 2, e.vy, t, e.amp, e.speed);
      continue;
    }
    const [ox, oy] = spriteOffset(e);
    scr.blit(enemySprite(e, t), e.x + ox, e.y + oy, false, hidden ? 0.3 : e.flash > 0 ? 0.4 : 1);
  }
  for (const o of w.obstacles) if (o.jet) drawJet(scr, o, t); // les paillettes passent par-dessus les monstres
  for (const e of w.enemies) if (e.kind === 'dragonet' && e.stage >= 2) FC.fireJet(scr, e.x + 1, e.y + 11, e.stage === 3 ? C.DRAGONET.length : 0, t, e.stage === 2);
  for (const s of w.eshots) {
    if (s.kind === 'web') scr.blit(FC.spr('web', Math.floor(t * 8) % 4), s.x, s.y);
    else if (s.kind === 'note') scr.blit(FC.spr('note', Math.floor(t * 8) % 3), s.x, s.y);
    else if (s.kind === 'juice') scr.blit(FC.spr('juice', Math.floor(t * 8)), s.x, s.y);
    else if (s.kind === 'maraca') scr.blit(FC.spr('maraca', Math.floor(t * 12)), s.x, s.y);
    else if (s.kind === 'bone') scr.blit(FC.spr('bone', Math.floor(t * 8) % 2), s.x, s.y);
    else if (s.kind === 'sorbet') scr.blit(FC.spr('sorbetBall', Math.floor(t * 6) % 2), s.x, s.y);
    else if (s.kind === 'drop') scr.blit(FC.spr('fireDrop', Math.floor(t * 8) % 2), s.x, s.y);
    else if (s.kind === 'fireball') scr.blit(FC.spr('fireball', Math.floor(t * 8)), s.x, s.y);
    else if (s.kind === 'ember') { scr.rect(s.x - 1, s.y - 1, 6, 6, FC.alpha(P.o, 90)); scr.rect(s.x, s.y, 4, 4, P.o); scr.rect(s.x + 1, s.y + 1, 2, 2, P.y); }
    else if (s.kind === 'bullet') { scr.rect(s.x - 1, s.y - 1, 5, 5, FC.alpha(P.R, 90)); scr.rect(s.x, s.y, 3, 3, P.R); scr.put(s.x + 1, s.y + 1, P.q); }
    else scr.blit(FC.spr('sugar'), s.x, s.y);
  }

  if (w.boss) drawBoss(scr, w);

  // le chat
  if (h.dead <= 0 && !(h.inv > 0 && Math.floor(t * 14) % 2)) {
    const by = Math.round(Math.sin(t * 2.4) * 1.5), op = h.ghost > 0 ? 0.45 : 1;
    FC.trail(scr, h.x + 4, h.y + 25 + by, t);
    scr.blit(heroSprite(heroSkin, Math.floor(t * 5) % 4, heroCat), h.x, h.y + by, false, op);
    if (h.slow > 0) scr.blit(FC.spr('stuck'), h.x + 8, h.y + 6 + by);
    if (w.level.water) for (let k = 0; k < 4; k++) { // bulles du scaphandre
      const ph = (t * 0.7 + k / 4) % 1;
      scr.ell(h.x + 24 + Math.sin(ph * 9 + k) * 2, h.y + 2 + by - ph * 34, 1 + ph, 1 + ph, FC.alpha(P.W, 190 * (1 - ph)));
    }
    if (h.sleep > 0) { // endormi : des Z qui montent
      for (let k = 0; k < 3; k++) { const ph = (t * 0.8 + k / 3) % 1; FC.text(scr, 'Z', h.x + 24 + k * 4 + ph * 6, h.y - 2 - ph * 14, FC.alpha(P.W, 255 * (1 - ph)), { outline: P.U }); }
    }
  }

  for (const s of w.shots) {
    if (s.kind === 'verm') {
      const c = FC.SPRINKLES[s.frame], slope = s.vy / s.vx;
      for (let i = 0; i < 4; i++) scr.put(s.x + i, s.y + Math.round(i * slope), c);
      scr.put(s.x - 1, s.y - Math.round(slope), FC.alpha(c, 110));
    } else if (s.kind === 'drag') {
      scr.blit(FC.spr('bigDrag', s.frame), s.x, s.y);
    } else if (s.kind === 'pinata') {
      scr.blit(FC.spr('bigCandy', (s.frame + Math.floor(t * 8)) % 4), s.x, s.y);
    } else if (s.kind === 'shard') {
      scr.blit(FC.spr('candyBit', s.frame), s.x, s.y, false, Math.min(1, s.life * 4));
    } else if (s.kind === 'rain') {
      const r = FC.spr('rainArc', rainStage(s.age));
      scr.blit(r, s.x, s.y - r.h / 2, false, Math.min(1, s.life * 5));
    } else {
      for (let k = 1; k <= 4; k++) scr.put(s.x - k * 3, s.y + 5 + Math.sin((t + k) * 9) * 2, FC.alpha(FC.RAINBOW[k], 220 - k * 40));
      scr.blit(FC.spr('jaw', Math.floor(t * 10) % 8), s.x, s.y);
    }
  }
  for (const p of w.parts) scr.put(p.x, p.y, FC.alpha(p.color, 255 * Math.min(1, p.life / p.max * 1.5)));
  for (const p of w.popups) FC.text(scr, p.text, Math.round(p.x), Math.round(p.y - p.t * 12), P.y, { outline: P.K });

  if (w.flash > 0) scr.rect(0, 0, C.W, C.H, FC.alpha(w.flashColor, Math.min(120, w.flash * 500)));
  // fondu de fin de niveau (on plonge dans la planète, on entre dans la forteresse...)
  if (w.level.outro && w.state === 'cleared' && w.stateT > 1.8) scr.rect(0, 0, C.W, C.H, FC.alpha(P[w.level.outro], Math.min(255, (w.stateT - 1.8) * 220)));
  if (w.boss && (w.boss.alive || w.boss.dying > 0)) drawBossBar(scr, w);
  drawHud(scr, w);
  // nom de l'arme choisie, sous la barre du haut
  if (w.weaponMsg) {
    const s = w.weaponMsg.text, x = Math.round((C.W - FC.textWidth(s)) / 2);
    FC.text(scr, s, x, 18, w.weaponMsg.t < 1 || Math.floor(w.t * 10) % 2 ? P.y : P.Y, { outline: P.K });
  }
  // grand message d'événement
  if (w.banner && Math.floor(w.banner.t * 4) % 4 !== 3) {
    const s = w.banner.text, x = Math.round((C.W - FC.textWidth(s, 2)) / 2);
    FC.text(scr, s, x, 70, P.W, { sc: 2, outline: P.P });
  }
}

const ICONS = { verm: 'icoVerm', drag: 'icoDrag', pinata: 'icoPinata', rain: 'icoRain', jaw: 'icoJaw' };

export function drawHud(scr: Pix, w: World) {
  const h = w.hero;
  scr.rect(0, 0, C.W, 13, FC.alpha(P.K, 200)); scr.rect(0, 13, C.W, 1, P.U);
  const x = FC.text(scr, 'SCORE', 4, 4, P.v);
  FC.text(scr, ('000000' + w.score).slice(-6), x + 4, 4, P.W);
  // jauge d'énergie (cœurs)
  for (let i = 0; i < h.energyMax; i++) {
    const full = i < h.energy, blink = !full || h.energy > 1 || Math.floor(w.t * 4) % 2 === 0;
    scr.blit(FC.spr('heart'), 56 + i * 8, 3, false, full ? (blink ? 1 : 0.4) : 0.2);
  }
  // vies
  scr.blit(FC.lifeIconCat(heroCat), 90, 2);
  FC.text(scr, 'x' + Math.max(0, h.lives), 101, 4, P.W);
  // progression vers le niveau suivant
  const nx = FC.text(scr, w.label, 114, 4, P.q);
  const bw = 40, bx = nx + 4;
  scr.rect(bx, 4, bw + 2, 5, P.k);
  const fill = Math.round(bw * w.progress);
  for (let b = 0; b < fill; b++) scr.rect(bx + 1 + b, 5, 1, 3, FC.RAINBOW[Math.floor(b / bw * 6)]);
  // armes
  const slots: (keyof typeof ICONS)[] = [...WEAPON_ORDER, 'jaw'];
  const sw = 25, x0 = C.W - slots.length * sw - 1; // 5 cases de 25 pixels
  slots.forEach((k, i) => {
    const sx = x0 + i * sw;
    const n = k === 'rain' ? '~' : String(h.ammo[k]);
    const empty = n === '0';
    if (k === h.weapon) {
      scr.rect(sx, 1, sw - 1, 1, P.y); scr.rect(sx, 11, sw - 1, 1, P.y); scr.rect(sx, 1, 1, 11, P.y); scr.rect(sx + sw - 2, 1, 1, 11, P.y);
    }
    if (k === 'jaw') scr.rect(sx, 12, sw - 1, 1, FC.alpha(P.o, 160));
    const ico = FC.spr(ICONS[k]);
    scr.blit(ico, sx + 2, 3, false, empty ? 0.35 : 1);
    FC.text(scr, n, sx + 3 + ico.w, 4, empty ? P.M : P.W);
  });
  // effets en cours
  if (h.ghost > 0) FC.text(scr, 'FANTÔME ' + Math.ceil(h.ghost), 4, 17, P.u, { outline: P.K });
}

// fils électriques entre deux pylônes : allumés, ou qui grésillent juste avant de s'allumer
function drawElec(scr: Pix, o: any, t: number) {
  const e = o.elec, x0 = o.x + e.x, y0 = o.y + e.y, on = elecOn(o, t), soon = !on && elecSoon(o, t);
  // voyants en haut des pylônes : rouge = courant branché, vert = coupé, orange clignotant = il va revenir
  const blink = Math.floor(t * 8) % 2;
  const lamp = on ? P.R : soon ? (blink ? P.o : P.y) : P.g;
  for (const lx of [o.x + 7, o.x + 67]) {
    scr.ell(lx + 1, o.y + 2, 4, 4, FC.alpha(lamp, 70));
    scr.rect(lx, o.y + 1, 3, 3, lamp); scr.put(lx, o.y + 1, P.W);
  }
  if (!on && !soon) return;
  const fl = Math.floor(t * 12) % 3;
  for (let k = 0; k * 11 < e.h - 4; k++) {
    const y = y0 + k * 11;
    if (on) {
      const c = [P.y, P.b, P.W][(k + fl) % 3];
      for (let x = 0; x < e.w; x++) scr.put(x0 + x, y + Math.round(Math.sin((x + t * 60 + k * 7) * 0.5) * 1.5), c);
    } else if ((k + fl) % 2) for (let x = 0; x < e.w; x += 4) scr.put(x0 + x + fl, y, FC.alpha(P.y, 160));
  }
}

function drawSkel(scr: Pix, w: World) {
  const b = w.boss!, t = w.t;
  if (b.kind !== 'skel' || b.dead) return;
  const open = b.mouth > 0 ? 1 : 0, shake = b.move === 'warn' || b.move === 'break' ? Math.round(Math.sin(t * 60) * 1.5) : 0;
  // la charge est annoncée : ligne rouge clignotante à sa hauteur
  if (b.move === 'warn' && Math.floor(t * 12) % 2) for (let x = 0; x < b.x; x += 4) { scr.put(x, b.dashY + 44, P.R); scr.put(x + 1, b.dashY + 44, P.R); }
  const [cx, cy] = b.core();
  if (b.alive) scr.ell(cx + shake, cy, 9 + Math.sin(t * 6) * 2, 9 + Math.sin(t * 6) * 2, FC.alpha(b.armored ? P.R : FC.col('6dff9a'), 50)); // l'œil brille
  scr.blit(FC.spr(b.armored ? 'skelBossArmor' : 'skelBoss', open), b.x + shake, b.y, false, b.flash > 0 || (b.dying > 0 && Math.floor(t * 16) % 2) ? 0.5 : 1);
}

function drawBoss(scr: Pix, w: World) {
  const b = w.boss!, t = w.t;
  if (b.kind === 'skel') return drawSkel(scr, w);
  if (b.kind === 'scorp') return drawScorp(scr, w);
  if (b.dead) return;
  const f = Math.floor(t * 4) % 2;
  scr.blit(FC.spr('boss', f), b.x, b.y, false, b.flash > 0 || (b.dying > 0 && Math.floor(t * 16) % 2) ? 0.5 : 1);
  // cœur qui pulse
  const [cx, cy] = b.core();
  if (Math.floor(t * 3) % 2 && b.alive) scr.ell(cx, cy, 10, 10, FC.alpha(P.q, 60));
  // laser des yeux
  const [ex] = b.eye();
  if (b.laser === 'aim' && Math.floor(t * 12) % 2) for (let x = 0; x < ex; x += 3) scr.put(x, b.laserY, P.R);
  if (b.laser === 'fire') {
    scr.rect(0, b.laserY - 4, ex, 9, FC.alpha(P.R, 90));
    scr.rect(0, b.laserY - 2, ex, 5, P.R);
    scr.rect(0, b.laserY - 1 + (Math.floor(t * 20) % 2), ex, 1, P.q);
  }
}

function drawScorp(scr: Pix, w: World) {
  const b = w.boss!, t = w.t;
  if (b.kind !== 'scorp' || b.dead) return;
  // sa charge est annoncée par une ligne rouge
  if (b.move === 'warn' && Math.floor(t * 12) % 2) for (let x = 0; x < b.x; x += 4) { scr.put(x, b.dashY + 38, P.R); scr.put(x + 1, b.dashY + 38, P.R); }
  const shake = b.move === 'warn' || b.move === 'break' ? Math.round(Math.sin(t * 60) * 1.5) : 0;
  const [cx, cy] = b.core();
  if (b.alive) scr.ell(cx + shake, cy, 11 + Math.sin(t * 6) * 2, 10, FC.alpha(b.form === 'skel' ? FC.col('3dff7a') : LV.y, 45)); // la tête, point faible
  scr.blit(FC.fireScorp(b.form, Math.floor(t * 10)), b.x + shake, b.y, b.facingRight, b.flash > 0 || (b.dying > 0 && Math.floor(t * 16) % 2) ? 0.5 : 1);
  if (b.breath === 'warn') FC.fireJet(scr, b.x + 2, b.y + 40, 0, t, true);
  if (b.breath === 'fire') FC.fireJet(scr, b.x + 2, b.y + 40, C.SCORP.breath, t);
  if (b.move === 'behind' && Math.floor(t * 4) % 2) FC.text(scr, '!', b.x + ScorpBossW - 8, b.y + 4, P.y, { sc: 2, outline: P.K });
}
const ScorpBossW = 100;

function drawBossBar(scr: Pix, w: World) {
  const b = w.boss!;
  scr.rect(0, 165, C.W, 15, FC.alpha(P.K, 200));
  const armor = (b.kind === 'skel' && b.armored) || (b.kind === 'scorp' && b.form === 'iron');
  const label = (w.level.boss === 'rush' ? (w.rushIdx + 1) + '/3 · ' : '') + (b.kind === 'scorp' ? b.name + ' ' + (b.formIdx + 1) + '/3' : b.name + (armor ? ' · ARMURE' : ''));
  const nx = FC.text(scr, label, 6, 170, P.W);
  const bw = C.W - nx - 16, fill = Math.round((bw - 2) * b.hp / b.maxHp);
  const col = b.kind === 'scorp' ? [P.M, LV.o, FC.col('3dff7a')][b.formIdx] : armor ? P.M : P.R;
  scr.rect(nx + 8, 169, bw, 7, P.K); scr.rect(nx + 9, 170, bw - 2, 5, FC.col('4a1020'));
  scr.rect(nx + 9, 170, fill, 5, col); scr.rect(nx + 9, 170, fill, 1, armor ? P.W : P.p);
  // repères des phases (araignée)
  if (b.kind === 'spider') { scr.rect(nx + 9 + Math.round((bw - 2) * 0.33), 169, 1, 7, P.W); scr.rect(nx + 9 + Math.round((bw - 2) * 0.66), 169, 1, 7, P.W); }
}
