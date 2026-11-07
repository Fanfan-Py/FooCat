// Niveau secret 2 : « Le casse-bonbons ».
// La soucoupe sert de raquette en bas de l'écran et renvoie une bonbille sur un mur de briques en bonbons.
// Les sucres (blancs) demandent 2 coups, le caramel doré est incassable. Des capsules-bonus tombent :
// L (soucoupe plus large), M (3 bonbilles), T (la bonbille traverse tout). Bonbille perdue = un cœur en moins.
// Quand le mur est vide, on passe au tableau suivant, plus dur.
import { FC, Pix } from '../art';
import * as C from './config';
import type { Controls, Sfx } from './world';

const P = FC.P;
export const CASSE = {
  lives: 3, maxLives: 6, paddleY: 146, speed: 170, ballSpeed: 140, ballMax: 215, bonusChance: 0.14,
  cols: 13, bw: 22, bh: 9, top: 22,
};
type Brick = 'choc' | 'fraise' | 'menthe' | 'citron' | 'sucre' | 'caramel';
const POINTS: Record<Brick, number> = { choc: 10, fraise: 10, menthe: 15, citron: 15, sucre: 30, caramel: 0 };
interface Cell { kind: Brick; hp: number; x: number; y: number }
interface Ball { x: number; y: number; vx: number; vy: number; stuck: boolean }
type BonusKind = 'L' | 'M' | 'T';
interface Capsule { kind: BonusKind; x: number; y: number }
interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number[] }
const R = 3.5; // rayon de la bonbille

// les tableaux : une lettre par brique (. = vide ; C chocolat, F fraise, M menthe, J citron, S sucre, O caramel)
const TABLEAUX = [
  ['.............', '.FFFFFFFFFFF.', '.MMMMMMMMMMM.', '.JJJJJJJJJJJ.', '.CCCCCCCCCCC.'],
  ['CCCCCCCCCCCCC', 'FF.FF.F.FF.FF', 'MMMMMMMMMMMMM', 'JJ.JJJ.JJJ.JJ', 'SSSSSSSSSSSSS'],
  ['OCCOCCOCCOCCO', 'FFFFFFFFFFFFF', 'MMMMMMMMMMMMM', 'JJJJJJJJJJJJJ', 'S.S.S.S.S.S.S', '.SSSSSSSSSSS.'],
  ['......F......', '.....FMF.....', '....FMJMF....', '...FMJSJMF...', '..FMJSOSJMF..', '.CCCCCCCCCCC.', 'O...........O'],
  ['SCSCSCSCSCSCS', 'O.O.O.O.O.O.O', 'FFFFFFFFFFFFF', 'MMMMMMMMMMMMM', 'JJJJJJJJJJJJJ', 'CCCCCCCCCCCCC', 'SSSSSSSSSSSSS'],
];
const LETTER: Record<string, Brick> = { C: 'choc', F: 'fraise', M: 'menthe', J: 'citron', S: 'sucre', O: 'caramel' };

export class Casse {
  t = 0; stateT = 0;
  state: 'play' | 'dying' | 'over' = 'play';
  score = 0; lives = CASSE.lives; tableau = 0;
  paddle = { x: 140, wide: 0, through: 0 };
  balls: Ball[] = []; bricks: Cell[] = []; caps: Capsule[] = []; parts: Part[] = [];
  banner: { text: string; t: number } | null = null;
  private stars = FC.stars(77, C.W, C.H, 80);
  private rnd: () => number;
  private serveT = 0;
  private between = 0; // pause entre deux tableaux

  constructor(private sfx: Sfx, seed = Date.now() % 100000) {
    this.rnd = FC.rng(seed);
    this.nextTableau();
  }

  private get speedUp() { return Math.min(CASSE.ballMax, CASSE.ballSpeed + this.tableau * 8); }
  private get pw() { return this.paddle.wide > 0 ? 58 : 36; } // largeur de la raquette
  private get px() { return this.paddle.x + 20 - this.pw / 2; }

  private nextTableau() {
    this.tableau++;
    const map = TABLEAUX[(this.tableau - 1) % TABLEAUX.length], x0 = Math.round((C.W - CASSE.cols * (CASSE.bw + 1)) / 2) + 1;
    this.bricks = [];
    map.forEach((row, r) => [...row].forEach((ch, c) => {
      const kind = LETTER[ch];
      if (kind) this.bricks.push({ kind, hp: kind === 'sucre' ? 2 : kind === 'caramel' ? 99 : 1, x: x0 + c * (CASSE.bw + 1), y: CASSE.top + r * (CASSE.bh + 1) });
    }));
    this.caps = []; this.paddle.wide = 0; this.paddle.through = 0;
    this.serve();
    this.banner = { text: 'TABLEAU ' + this.tableau, t: 0 };
    this.sfx.play(this.tableau > 1 ? 'level' : 'start');
  }
  private serve() { this.balls = [{ x: 0, y: 0, vx: 0, vy: 0, stuck: true }]; this.serveT = 2.5; }

  update(dt: number, c: Controls) {
    this.t += dt; this.stateT += dt;
    if (this.banner && (this.banner.t += dt) > 1.8) this.banner = null;
    const pd = this.paddle;
    pd.wide = Math.max(0, pd.wide - dt); pd.through = Math.max(0, pd.through - dt);
    if (this.state === 'dying' && this.stateT > 1.8) { this.state = 'over'; this.stateT = 0; }
    if (this.state === 'play') pd.x = Math.max(-2, Math.min(C.W - 38, pd.x + c.dx * CASSE.speed * dt));
    if (this.between > 0) { if ((this.between -= dt) <= 0) this.nextTableau(); }
    // la bonbille posée sur la soucoupe part quand on tire (ou toute seule au bout d'un moment)
    this.serveT -= dt;
    for (const b of this.balls) if (b.stuck) {
      b.x = pd.x + 20; b.y = CASSE.paddleY + 14 - R;
      if (this.state === 'play' && this.between <= 0 && (c.fire || this.serveT <= 0)) { b.stuck = false; const a = -Math.PI / 2 + (this.rnd() - 0.5) * 0.6; b.vx = Math.cos(a) * this.speedUp; b.vy = Math.sin(a) * this.speedUp; this.sfx.play('bounce'); }
    }
    // la bonbille avance par petits pas (pour ne pas traverser les briques)
    for (const b of this.balls) {
      if (b.stuck) continue;
      const steps = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 2);
      for (let i = 0; i < steps; i++) this.stepBall(b, dt / steps);
    }
    const before = this.balls.length;
    this.balls = this.balls.filter((b) => b.y < C.H + 8);
    if (before && !this.balls.length && this.state === 'play') this.loseHeart();
    // les capsules-bonus
    for (const k of this.caps) {
      k.y += 50 * dt;
      if (this.state === 'play' && k.y + 7 > CASSE.paddleY + 12 && k.y < CASSE.paddleY + 24 && k.x + 14 > this.px && k.x < this.px + this.pw) { k.y = C.H + 20; this.take(k.kind); }
    }
    this.caps = this.caps.filter((k) => k.y < C.H);
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
  }

  private stepBall(b: Ball, dt: number) {
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < R) { b.x = R; b.vx = Math.abs(b.vx); }
    if (b.x > C.W - R) { b.x = C.W - R; b.vx = -Math.abs(b.vx); }
    if (b.y < 14 + R) { b.y = 14 + R; b.vy = Math.abs(b.vy); }
    // la soucoupe : l'endroit touché donne la direction
    const top = CASSE.paddleY + 14;
    if (b.vy > 0 && b.y + R >= top && b.y + R <= top + 8 && b.x > this.px - R && b.x < this.px + this.pw + R) {
      const u = Math.max(-1, Math.min(1, (b.x - (this.px + this.pw / 2)) / (this.pw / 2)));
      const a = -Math.PI / 2 + u * 1.05, v = Math.min(CASSE.ballMax, Math.hypot(b.vx, b.vy) + 1.5);
      b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; b.y = top - R;
      this.sfx.play('bounce');
    }
    // les briques
    for (const k of this.bricks) {
      if (k.hp <= 0) continue;
      if (b.x + R <= k.x || b.x - R >= k.x + CASSE.bw || b.y + R <= k.y || b.y - R >= k.y + CASSE.bh) continue;
      const through = this.paddle.through > 0;
      if (!through || k.kind === 'caramel') { // rebond : du côté où la bonbille est le moins entrée
        const ox = Math.min(b.x + R - k.x, k.x + CASSE.bw - (b.x - R)), oy = Math.min(b.y + R - k.y, k.y + CASSE.bh - (b.y - R));
        if (ox < oy) { b.vx = b.x < k.x + CASSE.bw / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); b.x += b.vx > 0 ? ox : -ox; }
        else { b.vy = b.y < k.y + CASSE.bh / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); b.y += b.vy > 0 ? oy : -oy; }
      }
      this.hitBrick(k, through);
      if (!through || k.kind === 'caramel') break;
    }
  }

  private hitBrick(k: Cell, through: boolean) {
    if (k.kind === 'caramel') { this.sfx.play('web'); return; }
    k.hp -= through ? k.hp : 1;
    if (k.hp > 0) { this.sfx.play('pop'); this.burst(k.x + 11, k.y + 4, P.W, 4); return; }
    this.score += POINTS[k.kind] * (1 + Math.floor((this.tableau - 1) / TABLEAUX.length));
    this.burst(k.x + 11, k.y + 4, FC.brickColor(k.kind), 10);
    this.sfx.play('kill');
    if (this.rnd() < CASSE.bonusChance) this.caps.push({ kind: (['L', 'M', 'T'] as BonusKind[])[Math.floor(this.rnd() * 3)], x: k.x + 4, y: k.y });
    if (!this.bricks.some((b) => b.hp > 0 && b.kind !== 'caramel') && this.between <= 0) {
      this.score += 500; this.banner = { text: 'TABLEAU TERMINÉ ! +500', t: 0 };
      this.balls = []; this.between = 2.2; this.sfx.play('level');
    }
  }

  private take(kind: BonusKind) {
    this.score += 50; this.sfx.play('pickup');
    if (kind === 'L') { this.paddle.wide = 15; this.banner = { text: 'SOUCOUPE PLUS LARGE !', t: 0 }; }
    else if (kind === 'T') { this.paddle.through = 8; this.banner = { text: 'LA BONBILLE TRAVERSE TOUT !', t: 0 }; }
    else {
      this.banner = { text: '3 BONBILLES !', t: 0 };
      const src = this.balls.find((b) => !b.stuck) ?? this.balls[0];
      if (!src) return;
      for (const a of [-0.5, 0.5]) {
        const v = Math.max(this.speedUp, Math.hypot(src.vx, src.vy)), ang = Math.atan2(src.vy || -1, src.vx) + a;
        this.balls.push({ x: src.x, y: src.y, vx: Math.cos(ang) * v, vy: -Math.abs(Math.sin(ang) * v) || -v, stuck: false });
      }
    }
  }

  private loseHeart() {
    this.lives--; this.paddle.wide = 0; this.paddle.through = 0; this.caps = [];
    this.sfx.play(this.lives > 0 ? 'hurt' : 'lose');
    if (this.lives <= 0) { this.lives = 0; this.state = 'dying'; this.stateT = 0; this.burst(this.paddle.x + 20, CASSE.paddleY + 16, null, 30); return; }
    this.banner = { text: 'BONBILLE PERDUE !', t: 0 };
    this.serve();
  }

  private burst(x: number, y: number, c: number[] | null, n: number) {
    for (let i = 0; i < n; i++) {
      const a = this.rnd() * Math.PI * 2, v = 20 + this.rnd() * 50;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.3 + this.rnd() * 0.4, c: c ?? FC.RAINBOW[i % 6] });
    }
  }

  draw(scr: Pix, hero: (f: number) => Pix) {
    const t = this.t, pd = this.paddle;
    scr.d.set(FC.bg('casseBg', C.W, C.H, [[0, '0b0a26'], [0.7, '1d1450'], [1, '2a1258']]).d);
    FC.drawStars(scr, this.stars, t, [1, 3, 6]);
    for (const k of this.bricks) if (k.hp > 0) FC.brick(scr, k.x, k.y, k.kind, t, k.kind === 'sucre' && k.hp === 1);
    for (const k of this.caps) {
      const y = Math.round(k.y), x = Math.round(k.x), c = k.kind === 'L' ? P.b : k.kind === 'M' ? P.g : P.y;
      scr.rect(x, y, 14, 7, c); scr.rect(x, y, 7, 7, P.P); scr.rect(x, y, 14, 1, P.W);
      FC.text(scr, k.kind, x + 5, y + 1, P.W, { outline: P.K });
    }
    for (const p of this.parts) scr.rect(Math.round(p.x), Math.round(p.y), 2, 2, p.c);
    // la soucoupe (et son tapis de sucre quand elle est plus large)
    if (this.state === 'play') {
      if (pd.wide > 0 && !(pd.wide < 2 && Math.floor(t * 8) % 2)) {
        const x = Math.round(this.px), y = CASSE.paddleY + 24;
        for (let i = 0; i < this.pw; i++) scr.rect(x + i, y, 1, 3, FC.RAINBOW[Math.floor((i + t * 20) / 4) % 6]);
      }
      FC.trail(scr, pd.x + 4, CASSE.paddleY + 25, t);
      scr.blit(hero(Math.floor(t * 5) % 4), Math.round(pd.x), CASSE.paddleY);
    }
    // les bonbilles (arc-en-ciel quand elles traversent tout)
    for (const b of this.balls) {
      if (pd.through > 0) scr.ell(b.x, b.y, R + 2, R + 2, FC.alpha(FC.RAINBOW[Math.floor(t * 12) % 6], 140));
      scr.blit(FC.spr('bigDrag', 3), Math.round(b.x - 4.5), Math.round(b.y - 4));
    }
    // le bandeau du haut
    scr.rect(0, 0, C.W, 13, FC.alpha(P.K, 210)); scr.rect(0, 13, C.W, 1, P.U);
    FC.text(scr, 'CASSE-BONBONS', 4, 4, P.y);
    const label = 'TABLEAU ' + this.tableau + ' · SCORE ' + String(this.score).padStart(6, '0');
    FC.text(scr, label, Math.round(C.W / 2 - FC.textWidth(label) / 2) + 10, 4, P.W);
    const shown = Math.max(CASSE.lives, this.lives);
    for (let i = 0; i < shown; i++) scr.blit(FC.spr('heart'), C.W - 4 - shown * 9 + i * 9, 3, false, i < this.lives ? 1 : 0.2);
    if (this.banner && Math.floor(this.banner.t * 4) % 4 !== 3) {
      const b = this.banner.text;
      FC.text(scr, b, Math.round(C.W / 2 - FC.textWidth(b) / 2), 104, P.q, { outline: P.K });
    }
    if (this.balls.some((b) => b.stuck) && this.state === 'play' && t % 1.2 < 0.8) {
      const s = 'TIRE POUR LANCER LA BONBILLE';
      FC.text(scr, s, Math.round(C.W / 2 - FC.textWidth(s) / 2), 124, P.W, { outline: P.K });
    }
  }
}
