// Niveau secret 1 : « L'invasion des bonbons ».
// Le personnage reste en bas et se déplace de gauche à droite ; il tire des vermicelles (illimités) vers le haut.
// Les monstres en bonbons descendent en vagues. Un monstre qui touche la ligne rouge, ou une goutte qui touche
// le personnage, fait perdre un cœur. Sans fin : un cœur en plus tous les 50 monstres abattus.
// Les lettres FANFAN PY servent de bouclier (contre les monstres et leurs gouttes ; nos tirs passent à travers).
import { FC, Pix } from '../art';
import * as C from './config';
import type { Controls, Sfx } from './world';

const P = FC.P;
export const INVASION = {
  lives: 3, maxLives: 6, heartEvery: 50,
  heroY: 143, heroSpeed: 150, fireRate: 9, shotSpeed: 270,
  line: 176, // la ligne rouge à défendre
  shieldY: 116, block: 4, shieldHp: 2,
};
type Kind = 'invBerlingot' | 'invGuimauve' | 'invReglisse';
const KINDS: Record<Kind, { hp: number; w: number; h: number }> = {
  invBerlingot: { hp: 1, w: 15, h: 13 }, invGuimauve: { hp: 2, w: 14, h: 14 }, invReglisse: { hp: 3, w: 15, h: 15 },
};
interface Foe { kind: Kind; col: number; row: number; x: number; y: number; hp: number; flash: number; dive: number; vx: number; vy: number; dead: boolean }
interface Shot { x: number; y: number; vx: number; dead: boolean; c: number }
interface Drop { x: number; y: number; vy: number; dead: boolean }
interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number[] }

export class Invasion {
  t = 0; stateT = 0;
  state: 'play' | 'dying' | 'over' = 'play';
  kills = 0; wave = 0; lives = INVASION.lives;
  get score() { return this.kills; } // le score de ce niveau : le nombre de monstres abattus
  hero = { x: 140, inv: 0, cd: 0, hit: 0 };
  foes: Foe[] = []; shots: Shot[] = []; drops: Drop[] = []; parts: Part[] = [];
  popups: { text: string; x: number; y: number; t: number }[] = [];
  banner: { text: string; t: number } | null = null;
  private form = { x: 0, y: 0, speed: 0, dropRate: 0, diveRate: 0, ph: 0 };
  private shield = new Map<number, number>(); // morceau de sucre -> solidité
  private shieldX = 0;
  private stars = FC.starsDown(90, 5, C.W, C.H);
  private rnd: () => number;
  private nextWaveT = 1.2;

  constructor(private sfx: Sfx, seed = Date.now() % 100000) {
    this.rnd = FC.rng(seed);
    this.buildShield();
  }

  private buildShield() {
    const txt = FC.shieldText(), k = INVASION.block;
    this.shieldX = Math.round((C.W - txt.w * k) / 2) + 6;
    for (let y = 0; y < 5; y++) for (let x = 0; x < txt.w; x++) if (txt.on(x, y)) this.shield.set(y * 100 + x, INVASION.shieldHp);
  }
  // le bouclier touché au point (x, y) ? on abîme le morceau
  private hitShield(x: number, y: number, w = 1, h = 1): boolean {
    const k = INVASION.block, y0 = INVASION.shieldY;
    if (y + h < y0 || y > y0 + 5 * k || x + w < this.shieldX || x > this.shieldX + 48 * k) return false;
    for (let by = Math.max(0, Math.floor((y - y0) / k)); by <= Math.min(4, Math.floor((y + h - y0) / k)); by++)
      for (let bx = Math.max(0, Math.floor((x - this.shieldX) / k)); bx <= Math.min(47, Math.floor((x + w - this.shieldX) / k)); bx++) {
        const key = by * 100 + bx, hp = this.shield.get(key);
        if (!hp) continue;
        if (hp <= 1) this.shield.delete(key); else this.shield.set(key, hp - 1);
        this.burst(this.shieldX + bx * k + 2, y0 + by * k + 2, P.q, 3);
        return true;
      }
    return false;
  }

  private startWave() {
    this.wave++;
    const n = this.wave, rows = Math.min(5, 2 + Math.ceil(n / 2)), cols = 7;
    const order: Kind[] = ['invReglisse', 'invGuimauve', 'invGuimauve', 'invBerlingot', 'invBerlingot'];
    const kinds = order.slice(order.length - rows);
    this.foes = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const kind = n < 3 && kinds[r] === 'invReglisse' ? 'invGuimauve' : kinds[r];
      this.foes.push({ kind, col: c, row: r, x: 0, y: 0, hp: KINDS[kind].hp, flash: 0, dive: 0, vx: 0, vy: 0, dead: false });
    }
    this.form = { x: 0, y: 20 - rows * 3, speed: Math.min(11, 2.2 + n * 0.55), dropRate: Math.min(2.4, 0.45 + n * 0.14), diveRate: n < 2 ? 0 : Math.min(0.9, 0.12 + n * 0.06), ph: this.rnd() * 6 };
    if (n > 1 && n % 5 === 1) { this.shield.clear(); this.buildShield(); } // le bouclier se répare toutes les 5 vagues
    this.banner = { text: 'VAGUE ' + n, t: 0 };
    this.sfx.play(n > 1 ? 'wave' : 'start');
  }

  update(dt: number, c: Controls) {
    this.t += dt; this.stateT += dt;
    const h = this.hero, I = INVASION;
    if (this.banner && (this.banner.t += dt) > 1.8) this.banner = null;
    h.inv = Math.max(0, h.inv - dt); h.cd -= dt; h.hit = Math.max(0, h.hit - dt);
    if (this.state === 'play') {
      h.x = Math.max(0, Math.min(C.W - 40, h.x + c.dx * I.heroSpeed * dt));
      if (c.fire && h.cd <= 0) {
        h.cd = 1 / I.fireRate;
        this.shots.push({ x: h.x + 19, y: I.heroY + 2, vx: (this.rnd() * 2 - 1) * 14, dead: false, c: Math.floor(this.rnd() * 7) });
        this.sfx.play('shoot_verm');
      }
      if (!this.foes.some((f) => !f.dead)) {
        this.nextWaveT -= dt;
        if (this.nextWaveT <= 0) { this.startWave(); this.nextWaveT = 1.6; }
      }
    }
    if (this.state === 'dying' && this.stateT > 1.8) { this.state = 'over'; this.stateT = 0; }
    this.updateFoes(dt);
    this.updateShots(dt);
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
    for (const p of this.popups) { p.t += dt; p.y -= 14 * dt; }
    this.popups = this.popups.filter((p) => p.t < 1.2);
  }

  private updateFoes(dt: number) {
    const F = this.form, I = INVASION, h = this.hero;
    F.y += F.speed * dt;
    const sway = Math.sin(this.t * 0.9 + F.ph) * 34;
    const alive = this.foes.filter((f) => !f.dead);
    for (const f of alive) {
      const k = KINDS[f.kind];
      f.flash = Math.max(0, f.flash - dt);
      if (f.dive > 0) { // il a quitté la formation et plonge
        f.dive += dt; f.x += f.vx * dt; f.y += f.vy * dt;
        if (f.x < 0 || f.x > C.W - k.w) f.vx = -f.vx;
      } else {
        f.x = 48 + f.col * 34 + sway + Math.sin(this.t * 2 + f.row) * 3;
        f.y = F.y + f.row * 19;
      }
      // il touche le bouclier : il le casse et éclate
      if (this.hitShield(f.x, f.y, k.w, k.h)) { this.hitShield(f.x + k.w / 2, f.y + k.h - 2, 2, 2); this.killFoe(f, false); continue; }
      // il touche le personnage
      if (this.state === 'play' && h.inv <= 0 && f.y + k.h > I.heroY + 12 && f.x + k.w > h.x + 8 && f.x < h.x + 32) { this.killFoe(f, false); this.loseHeart(); continue; }
      // il atteint la ligne rouge
      if (f.y + k.h >= I.line) { this.killFoe(f, false); if (this.state === 'play') this.loseHeart(true); }
    }
    if (this.state !== 'play' || !alive.length) return;
    // des gouttes tombent des monstres du bas de chaque colonne
    if (this.rnd() < F.dropRate * dt) {
      const front = alive.filter((f) => !alive.some((g) => g.col === f.col && g.row > f.row && !g.dive));
      const f = front[Math.floor(this.rnd() * front.length)];
      if (f) this.drops.push({ x: f.x + 5, y: f.y + 12, vy: 70 + this.wave * 4, dead: false });
    }
    // un monstre plonge vers le personnage
    if (this.rnd() < F.diveRate * dt) {
      const cand = alive.filter((f) => !f.dive);
      const f = cand[Math.floor(this.rnd() * cand.length)];
      if (f) { f.dive = 0.01; const dx = h.x + 14 - f.x; f.vx = Math.max(-60, Math.min(60, dx * 0.4)); f.vy = 55 + this.wave * 2; this.sfx.play('dive'); }
    }
  }

  private updateShots(dt: number) {
    const I = INVASION, h = this.hero;
    for (const s of this.shots) {
      s.y -= I.shotSpeed * dt; s.x += s.vx * dt;
      if (s.y < 14) { s.dead = true; continue; }
      for (const f of this.foes) {
        if (f.dead) continue;
        const k = KINDS[f.kind];
        if (s.x + 1 > f.x && s.x < f.x + k.w && s.y < f.y + k.h && s.y + 4 > f.y) {
          s.dead = true; f.flash = 0.08;
          if (--f.hp <= 0) this.killFoe(f, true); else this.sfx.play('pop');
          break;
        }
      }
    }
    this.shots = this.shots.filter((s) => !s.dead);
    for (const d of this.drops) {
      d.y += d.vy * dt;
      if (d.y > C.H) d.dead = true;
      else if (this.hitShield(d.x, d.y, 4, 6)) d.dead = true;
      else if (this.state === 'play' && h.inv <= 0 && d.y + 6 > I.heroY + 10 && d.y < I.heroY + 26 && d.x + 4 > h.x + 9 && d.x < h.x + 31) { d.dead = true; this.loseHeart(); }
    }
    this.drops = this.drops.filter((d) => !d.dead);
  }

  private killFoe(f: Foe, byHero: boolean) {
    f.dead = true;
    const k = KINDS[f.kind];
    this.burst(f.x + k.w / 2, f.y + k.h / 2, null, 10);
    if (!byHero) { this.sfx.play('pop'); return; }
    this.kills++; this.sfx.play('kill');
    if (this.kills % INVASION.heartEvery === 0) {
      if (this.lives < INVASION.maxLives) { this.lives++; this.popups.push({ text: '+1 COEUR', x: this.hero.x + 4, y: INVASION.heroY - 10, t: 0 }); }
      this.banner = { text: this.kills + ' MONSTRES : UN COEUR EN PLUS !', t: 0 };
      this.sfx.play('pickup');
    }
  }

  private loseHeart(line = false) {
    const h = this.hero;
    this.lives--; h.inv = 1.6; h.hit = 0.4;
    this.sfx.play(this.lives > 0 ? 'hurt' : 'lose');
    if (line) this.banner = { text: 'UN MONSTRE A PASSÉ LA LIGNE !', t: 0 };
    if (this.lives <= 0) {
      this.lives = 0; this.state = 'dying'; this.stateT = 0;
      this.burst(h.x + 20, INVASION.heroY + 16, null, 30);
    }
  }

  private burst(x: number, y: number, c: number[] | null, n: number) {
    for (let i = 0; i < n; i++) {
      const a = this.rnd() * Math.PI * 2, v = 20 + this.rnd() * 60;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.3 + this.rnd() * 0.4, c: c ?? FC.RAINBOW[i % 6] });
    }
  }

  draw(scr: Pix, hero: (f: number) => Pix) {
    const t = this.t, I = INVASION, h = this.hero;
    scr.d.set(FC.bg('secretBg', C.W, C.H, [[0, '0b0618'], [0.7, '1a0e3a'], [1, '2e1458']]).d);
    FC.drawStarsDown(scr, this.stars, t);
    // le bouclier FANFAN PY
    const k = I.block;
    for (const [key, hp] of this.shield) {
      const bx = this.shieldX + (key % 100) * k, by = I.shieldY + Math.floor(key / 100) * k;
      scr.rect(bx, by, k - 1, k - 1, hp > 1 ? P.q : P.p); scr.rect(bx, by, k - 1, 1, P.W);
      if (hp <= 1) scr.put(bx + 1, by + 1, P.i);
    }
    for (const f of this.foes) {
      if (f.dead) continue;
      const s = FC.spr(f.kind, Math.floor(t * 4 + f.col));
      scr.blit(s, Math.round(f.x), Math.round(f.y), false, 1);
      if (f.flash > 0) scr.rect(Math.round(f.x) + 2, Math.round(f.y) + 2, KINDS[f.kind].w - 4, KINDS[f.kind].h - 4, FC.alpha(P.W, 150));
    }
    for (const d of this.drops) scr.blit(FC.spr('invDrop', Math.floor(t * 6)), Math.round(d.x), Math.round(d.y));
    for (const s of this.shots) scr.rect(Math.round(s.x), Math.round(s.y), 1, 4, FC.SPRINKLES[s.c]);
    for (const p of this.parts) scr.rect(Math.round(p.x), Math.round(p.y), 2, 2, p.c);
    // le personnage
    if (this.state !== 'dying' && this.state !== 'over' && !(h.inv > 0 && Math.floor(t * 12) % 2)) {
      FC.trail(scr, h.x + 4, I.heroY + 25, t);
      scr.blit(hero(Math.floor(t * 5) % 4), Math.round(h.x), I.heroY);
    }
    // la ligne à défendre
    for (let x = 0; x < C.W; x += 6) scr.rect(x + Math.floor(t * 12) % 6, I.line + 1, 3, 1, h.hit > 0 ? P.W : P.R);
    for (const p of this.popups) FC.text(scr, p.text, Math.round(p.x), Math.round(p.y), P.p, { outline: P.K });
    // le bandeau du haut
    scr.rect(0, 0, C.W, 13, FC.alpha(P.K, 210)); scr.rect(0, 13, C.W, 1, P.U);
    FC.text(scr, 'INVASION', 4, 4, P.y);
    const label = 'MONSTRES ABATTUS : ' + String(this.kills).padStart(3, '0');
    FC.text(scr, label, Math.round(C.W / 2 - FC.textWidth(label) / 2), 4, P.W);
    const shown = Math.max(INVASION.lives, this.lives);
    for (let i = 0; i < shown; i++) scr.blit(FC.spr('heart'), C.W - 4 - shown * 9 + i * 9, 3, false, i < this.lives ? 1 : 0.2);
    if (this.banner && Math.floor(this.banner.t * 4) % 4 !== 3) {
      const b = this.banner.text;
      FC.text(scr, b, Math.round(C.W / 2 - FC.textWidth(b) / 2), 96, P.q, { outline: P.K });
    }
  }
}
