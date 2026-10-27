// Dessin d'un niveau (décor, personnages, tirs, effets) et de la barre du haut.
import { FC, Pix, Color } from '../art';
import * as C from './config';
import { World, WEAPON_ORDER, rainStage } from './world';
import { enemySprite, elecOn, elecSoon, cablePoint } from './things';

const P = FC.P;
const BONUS_SPRITE: Record<string, string> = {
  verm: 'bVerm', drag: 'bDrag', jaw: 'bJaw', heart: 'bLife', life: 'b1up', bomb: 'bBomb', ghost: 'bGhost',
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

const DECOR = { space: decorSpace, nebula: decorNebula, planet: decorPlanet, iron: decorIron, fortress: decorFortress };

// ---------- le niveau ----------
export function drawWorld(scr: Pix, w: World) {
  const t = w.t, h = w.hero;
  DECOR[w.level.decor](scr, w);

  const top = w.top;
  for (const o of w.obstacles) {
    if (o.kind === 'web') { // fils qui retiennent la toile
      const r = o.pix.w / 2, c = FC.alpha(P.W, 150);
      scr.line(o.x + r * 0.55, top, o.x + r * 0.55, o.y + r * 0.35, c);
      scr.line(o.x + r * 1.45, top, o.x + r * 1.45, o.y + r * 0.35, c);
    }
    if (o.kind === 'cable') { // attaches qui pendent du ciel
      const c = FC.alpha(P.M, 220);
      scr.line(o.x + 2, top, o.x + 2, o.y + 1, c); scr.line(o.x + o.pix.w - 3, top, o.x + o.pix.w - 3, o.y + 1, c);
    }
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

  for (const b of w.bonuses) scr.blit(FC.spr(BONUS_SPRITE[b.kind]), b.x, b.y);
  for (const e of w.enemies) {
    if (e.kind === 'hanger') scr.line(e.x + 11, top, e.x + 11, e.y + 4, FC.alpha(P.W, 190));
    scr.blit(enemySprite(e, t), e.x, e.y, false, e.flash > 0 ? 0.4 : 1);
  }
  for (const s of w.eshots) {
    if (s.kind === 'web') scr.blit(FC.spr('web', Math.floor(t * 8) % 4), s.x, s.y);
    else if (s.kind === 'bullet') { scr.rect(s.x - 1, s.y - 1, 5, 5, FC.alpha(P.R, 90)); scr.rect(s.x, s.y, 3, 3, P.R); scr.put(s.x + 1, s.y + 1, P.q); }
    else scr.blit(FC.spr('sugar'), s.x, s.y);
  }

  if (w.boss) drawBoss(scr, w);

  // le chat
  if (h.dead <= 0 && !(h.inv > 0 && Math.floor(t * 14) % 2)) {
    const by = Math.round(Math.sin(t * 2.4) * 1.5), op = h.ghost > 0 ? 0.45 : 1;
    FC.trail(scr, h.x + 4, h.y + 25 + by, t);
    scr.blit(FC.spr('hero', Math.floor(t * 5) % 4), h.x, h.y + by, false, op);
    if (h.slow > 0) scr.blit(FC.spr('stuck'), h.x + 8, h.y + 6 + by);
  }

  for (const s of w.shots) {
    if (s.kind === 'verm') {
      const c = FC.SPRINKLES[s.frame], slope = s.vy / s.vx;
      for (let i = 0; i < 4; i++) scr.put(s.x + i, s.y + Math.round(i * slope), c);
      scr.put(s.x - 1, s.y - Math.round(slope), FC.alpha(c, 110));
    } else if (s.kind === 'drag') {
      scr.blit(FC.spr('bigDrag', s.frame), s.x, s.y);
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

const ICONS = { verm: 'icoVerm', drag: 'icoDrag', rain: 'icoRain', jaw: 'icoJaw' };

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
  scr.blit(FC.spr('lifeIcon'), 90, 2);
  FC.text(scr, 'x' + Math.max(0, h.lives), 101, 4, P.W);
  // progression vers le niveau suivant
  const nx = FC.text(scr, 'NIV.' + w.level.num, 114, 4, P.q);
  const bw = 40, bx = nx + 4;
  scr.rect(bx, 4, bw + 2, 5, P.k);
  const fill = Math.round(bw * w.progress);
  for (let b = 0; b < fill; b++) scr.rect(bx + 1 + b, 5, 1, 3, FC.RAINBOW[Math.floor(b / bw * 6)]);
  // armes
  const slots: (keyof typeof ICONS)[] = [...WEAPON_ORDER, 'jaw'];
  const x0 = C.W - 124;
  slots.forEach((k, i) => {
    const sx = x0 + i * 31;
    const n = k === 'rain' ? '~' : String(h.ammo[k]);
    const empty = n === '0';
    if (k === h.weapon) {
      scr.rect(sx, 1, 29, 1, P.y); scr.rect(sx, 11, 29, 1, P.y); scr.rect(sx, 1, 1, 11, P.y); scr.rect(sx + 28, 1, 1, 11, P.y);
    }
    if (k === 'jaw') scr.rect(sx, 12, 29, 1, FC.alpha(P.o, 160));
    scr.blit(FC.spr(ICONS[k]), sx + 2, 3, false, empty ? 0.35 : 1);
    FC.text(scr, n, sx + 12, 4, empty ? P.M : P.W);
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

function drawBoss(scr: Pix, w: World) {
  const b = w.boss!, t = w.t;
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

function drawBossBar(scr: Pix, w: World) {
  const b = w.boss!;
  scr.rect(0, 165, C.W, 15, FC.alpha(P.K, 200));
  const nx = FC.text(scr, 'ARAIGNÉE DE FER', 6, 170, P.W);
  const bw = C.W - nx - 16, fill = Math.round((bw - 2) * b.hp / b.maxHp);
  scr.rect(nx + 8, 169, bw, 7, P.K); scr.rect(nx + 9, 170, bw - 2, 5, FC.col('4a1020'));
  scr.rect(nx + 9, 170, fill, 5, P.R); scr.rect(nx + 9, 170, fill, 1, P.p);
  // repères des phases
  scr.rect(nx + 9 + Math.round((bw - 2) * 0.33), 169, 1, 7, P.W); scr.rect(nx + 9 + Math.round((bw - 2) * 0.66), 169, 1, 7, P.W);
}
