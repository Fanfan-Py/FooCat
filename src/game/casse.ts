// Niveau secret 2 : « Le casse-bonbons ».
// La soucoupe sert de raquette en bas de l'écran et renvoie une bonbille sur un mur de briques en bonbons.
// Les sucres (blancs) demandent 2 coups, le caramel doré est incassable. Des capsules tombent des briques cassées :
// L (soucoupe plus large), M (3 bonbilles), T (la bonbille traverse tout), V (la soucoupe tire des vermicelles),
// C (la bonbille colle à la soucoupe ; on tire pour la renvoyer) et un piège, Z (la soucoupe s'endort et ralentit).
// Bonbille perdue = un cœur en moins. Quand le mur est vide, un passage secret s'ouvre dans le mur de sucre d'orge,
// à droite ou à gauche : on y fait entrer la soucoupe pour passer au tableau suivant.
// Des monstres en bonbons (3 au plus) sortent de trappes en haut de l'écran et descendent doucement ; ils ne font
// rien au chat. Touchés par la bonbille, un vermicelle ou la soucoupe, ils explosent, et un autre sort d'une trappe.
import { FC, Pix } from '../art';
import * as C from './config';
import type { Controls, Sfx } from './world';

const P = FC.P;
export const CASSE = {
  lives: 3, maxLives: 6, paddleY: 146, speed: 170, ballSpeed: 140, ballMax: 215, bonusChance: 0.15,
  cols: 13, bw: 22, bh: 9, top: 22, wall: 6, // largeur des murs en sucre d'orge
  wide: 15, through: 8, gun: 8, gunRate: 7, glue: 15, glueHold: 2.5, slow: 3, slowFactor: 0.35,
  // monstres : nombre maximum, premier après, attente avant le suivant, vitesse de descente, points
  monsters: 3, firstMonster: 4, nextMonster: 2.2, monsterSpeed: 9, monsterPoints: 100,
};
const HATCHES = [70, 160, 250]; // les trappes en haut de l'écran
type MonsterKind = 'invGuimauve' | 'invBerlingot' | 'invReglisse';
// trappe : open (0 à 1) ; monstre : il sort de la trappe hatch, puis descend en se balançant
interface Monster { kind: MonsterKind; hatch: number; x: number; y: number; ph: number }
type Brick = 'choc' | 'fraise' | 'menthe' | 'citron' | 'sucre' | 'reglisse' | 'caramel';
const POINTS: Record<Brick, number> = { choc: 10, fraise: 10, menthe: 15, citron: 15, sucre: 30, reglisse: 50, caramel: 0 };
const HP: Record<Brick, number> = { choc: 1, fraise: 1, menthe: 1, citron: 1, sucre: 2, reglisse: 3, caramel: 99 };
// w, h : taille de la brique (les petites briques servent à écrire des mots)
interface Cell { kind: Brick; hp: number; x: number; y: number; w: number; h: number; small: boolean }
// stuck : posée sur la soucoupe (off : décalage depuis le milieu ; hold : temps avant de partir toute seule)
interface Ball { x: number; y: number; vx: number; vy: number; stuck: boolean; off: number; hold: number }
export type CapsuleKind = 'L' | 'M' | 'T' | 'V' | 'C' | 'Z';
interface Capsule { kind: CapsuleKind; x: number; y: number }
interface Part { x: number; y: number; vx: number; vy: number; life: number; c: number[] }
const R = 3.5; // rayon de la bonbille
// chance de chaque capsule (Z est un piège)
const CAPSULES: [CapsuleKind, number][] = [['L', 2], ['M', 2], ['T', 1], ['V', 2], ['C', 2], ['Z', 2]];
const CAP_COLOR: Record<CapsuleKind, number[]> = { L: P.b, M: P.g, T: P.y, V: P.r, C: P.o, Z: P.u };

// les tableaux : une lettre par brique (. = vide ; C chocolat, F fraise, M menthe, J citron, S sucre, R réglisse, O caramel)
// small : petites briques (27 colonnes de 11 pixels, lignes de 6 pixels)
const LETTER: Record<string, Brick> = { C: 'choc', F: 'fraise', M: 'menthe', J: 'citron', S: 'sucre', R: 'reglisse', O: 'caramel' };
// écrit un mot en lettres-briques dans une grille (tall : lettres deux fois plus hautes)
function word(map: string[], text: string, r0: number, c0: number, letters: string | string[], tall = false) {
  const p = new FC.Pix(80, 6) as Pix;
  FC.text(p, text, 0, 0, P.W);
  let x = 0, n = 0;
  for (const ch of text) {
    const gw = FC.textWidth(ch);
    for (let gy = 0; gy < 5; gy++) for (let gx = 0; gx < gw; gx++) if (p.on(x + gx, gy)) {
      const L = typeof letters === 'string' ? letters : letters[n % letters.length];
      for (let k = 0; k < (tall ? 2 : 1); k++) { const r = r0 + gy * (tall ? 2 : 1) + k, c = c0 + x + gx; map[r] = map[r].slice(0, c) + L + map[r].slice(c + 1); }
    }
    if (ch !== ' ') n++;
    x += gw + 1;
  }
  return map;
}
const blank = (rows: number, cols: number) => Array.from({ length: rows }, () => '.'.repeat(cols));
function mapFanfan() {
  const m = blank(15, 27);
  m[0] = 'O'.repeat(27); m[14] = 'OOOO...OOOOO...OOOOO...OOOO';
  for (let r = 1; r < 14; r++) m[r] = 'O' + m[r].slice(1, 26) + 'O';
  word(m, 'FANFAN', 2, 1, ['F', 'J', 'M', 'F', 'J', 'M']);
  return word(m, 'PY', 8, 10, 'C');
}
function mapFoocat() {
  const m = blank(14, 27);
  m[0] = '..' + 'S'.repeat(23) + '..';
  word(m, 'FOOCAT', 2, 2, 'R', true);
  m[13] = '..SSS.SSS.SSS.SSS.SSS.SSS..';
  return m;
}
export const TABLEAUX: { name: string; map: string[]; small?: boolean }[] = [
  { name: 'LES RANGÉES', map: ['.............', '.FFFFFFFFFFF.', '.MMMMMMMMMMM.', '.JJJJJJJJJJJ.', '.CCCCCCCCCCC.'] },
  { name: 'LE COEUR', map: ['.FFF.....FFF.', 'FFFFF...FFFFF', 'FSFFFFFFFFFFF', 'FFFFFFFFFFFFF', '.FFFFFFFFFFF.', '..FFFFFFFFF..', '...FFFFFFF...', '....FFFFF....', '.....FFF.....'] },
  { name: "L'ARC-EN-CIEL", map: ['....FFFFF....', '..FFJJJJJFF..', '.FJJMMMMMJJF.', '.FJM.....MJF.', 'FJM.......MJF', 'FJM.......MJF', 'SSS.......SSS'] },
  { name: 'LE CHAT DORÉ', map: ['......O......', '.S....O....S.', '.SS..JOJ..SS.', '.JJJJJJJJJJJ.', 'JJCCJJJJJCCJJ', 'JJCCJJJJJCCJJ', 'JFJJJJFJJJJFJ', '.JJJJJJJJJJJ.', '..JJJJJJJJJ..'] },
  { name: 'LA FORTERESSE DE SUCRE', map: ['OO.OOOOOOO.OO', 'SSSSSSSSSSSSS', 'CFCFCFCFCFCFC', 'MMMMMMMMMMMMM', 'JJJJJJJJJJJJJ', 'SSSSSSSSSSSSS', 'O..O..O..O..O'] },
  { name: 'FANFAN PY', small: true, map: mapFanfan() },
  { name: 'LA MINE DE CARAMEL', map: ['OOOOOOOOOOOOO', 'O.SO..S..OS.O', 'O..O.....O..O', 'OO.OOO.OOO.OO', 'O...........O', 'O.SO.OOO.OS.O', 'O..O..S..O..O', 'OO.OO...OO.OO'] },
  { name: 'FOOCAT', small: true, map: mapFoocat() },
  { name: 'LE LABYRINTHE', map: ['OOOOOOOOOOOOO', 'OFFFO...OJJJO', 'OFFFO.O.OJJJO', 'O.OOO.O.OO.OO', 'O.....O.....O', 'OOOO.OOO.OOOO', 'OMMO.....OSSO', 'OMMOO.O.OOSSO', 'O.........O.O'] },
];
function build(n: number): Cell[] { // le tableau n (1, 2, 3...)
  const T = TABLEAUX[(n - 1) % TABLEAUX.length], out: Cell[] = [];
  const w = T.small ? 11 : CASSE.bw, h = T.small ? 5 : CASSE.bh, sx = T.small ? 11 : CASSE.bw + 1, sy = T.small ? 6 : CASSE.bh + 1;
  const x0 = Math.round((C.W - T.map[0].length * sx) / 2) + (T.small ? 0 : 1);
  T.map.forEach((row, r) => [...row].forEach((ch, c) => {
    const kind = LETTER[ch];
    if (kind) out.push({ kind, hp: HP[kind], x: x0 + c * sx, y: CASSE.top + r * sy, w, h, small: !!T.small });
  }));
  return out;
}

export class Casse {
  t = 0; stateT = 0;
  state: 'play' | 'dying' | 'over' = 'play';
  score = 0; lives = CASSE.lives; tableau = 0;
  paddle = { x: 140, wide: 0, through: 0, gun: 0, glue: 0, slow: 0, gunCD: 0 };
  balls: Ball[] = []; bricks: Cell[] = []; caps: Capsule[] = []; parts: Part[] = [];
  shots: { x: number; y: number }[] = []; // vermicelles de la soucoupe (capsule V)
  // passage secret : side 0 à gauche, 1 à droite ; open : ouverture (0 à 1) ; slide : glissement vers le tableau suivant
  exit: { side: number; open: number; slide: number; next: Cell[] } | null = null;
  monsters: Monster[] = [];
  hatches = HATCHES.map(() => 0); // ouverture de chaque trappe
  private monsterT = CASSE.firstMonster; // temps avant le prochain monstre
  banner: { text: string; t: number } | null = null;
  popups: { text: string; x: number; y: number; t: number }[] = [];
  private stars = FC.stars(77, C.W, C.H, 80);
  private rnd: () => number;
  private prevFire = false;

  constructor(private sfx: Sfx, seed = Date.now() % 100000) {
    this.rnd = FC.rng(seed);
    this.nextTableau();
  }

  private get speedUp() { return Math.min(CASSE.ballMax, CASSE.ballSpeed + this.tableau * 8); }
  private get pw() { return this.paddle.wide > 0 ? 58 : 36; } // largeur de la raquette
  private get px() { return this.paddle.x + 20 - this.pw / 2; }

  private nextTableau() {
    this.tableau++;
    this.bricks = build(this.tableau);
    const pd = this.paddle;
    Object.assign(pd, { x: 140, wide: 0, through: 0, gun: 0, glue: 0, slow: 0 });
    this.caps = []; this.shots = []; this.exit = null;
    this.monsters = []; this.monsterT = CASSE.firstMonster;
    this.serve();
    this.banner = { text: 'TABLEAU ' + this.tableau + ' : ' + TABLEAUX[(this.tableau - 1) % TABLEAUX.length].name, t: 0 };
    this.sfx.play(this.tableau > 1 ? 'level' : 'start');
  }
  private serve() { this.balls = [{ x: 0, y: 0, vx: 0, vy: 0, stuck: true, off: 0, hold: 2.5 }]; }
  private launch(b: Ball) {
    const u = Math.max(-1, Math.min(1, b.off / (this.pw / 2)));
    const a = -Math.PI / 2 + (b.off ? u * 1.05 : (this.rnd() - 0.5) * 0.6);
    b.stuck = false; b.vx = Math.cos(a) * this.speedUp; b.vy = Math.sin(a) * this.speedUp;
    this.sfx.play('bounce');
  }

  update(dt: number, c: Controls) {
    this.t += dt; this.stateT += dt;
    if (this.banner && (this.banner.t += dt) > 1.8) this.banner = null;
    const pd = this.paddle, W = CASSE.wall, ex = this.exit;
    const press = c.fire && !this.prevFire; this.prevFire = c.fire;
    for (const k of ['wide', 'through', 'gun', 'glue', 'slow'] as const) pd[k] = Math.max(0, pd[k] - dt);
    pd.gunCD -= dt;
    if (this.state === 'dying' && this.stateT > 1.8) { this.state = 'over'; this.stateT = 0; }
    // la soucoupe (quand le passage est ouvert, elle peut entrer dans le mur de ce côté)
    if (this.state === 'play' && !(ex && ex.slide >= 0)) {
      const sp = CASSE.speed * (pd.slow > 0 ? CASSE.slowFactor : 1);
      const lo = ex && ex.side === 0 && ex.open >= 1 ? -44 : W - 2, hi = ex && ex.side === 1 && ex.open >= 1 ? C.W + 4 : C.W - W - 38;
      pd.x = Math.max(lo, Math.min(hi, pd.x + c.dx * sp * dt));
    }
    if (ex) this.updateExit(dt);
    // la bonbille posée sur la soucoupe part quand on tire (ou toute seule au bout d'un moment)
    for (const b of this.balls) if (b.stuck) {
      b.x = pd.x + 20 + b.off; b.y = CASSE.paddleY + 14 - R; b.hold -= dt;
      if (this.state === 'play' && ((b.off ? press : c.fire) || b.hold <= 0)) this.launch(b);
    }
    // la mitraillette : deux vermicelles parallèles
    if (this.state === 'play' && pd.gun > 0 && c.fire && pd.gunCD <= 0 && !ex) {
      pd.gunCD = 1 / CASSE.gunRate;
      this.shots.push({ x: this.px + 5, y: CASSE.paddleY + 12 }, { x: this.px + this.pw - 6, y: CASSE.paddleY + 12 });
      this.sfx.play('shoot_verm');
    }
    for (const s of this.shots) {
      s.y -= 240 * dt;
      const k = this.bricks.find((b) => b.hp > 0 && s.x >= b.x && s.x < b.x + b.w && s.y < b.y + b.h && s.y + 4 > b.y);
      if (k) { s.y = -10; this.hitBrick(k, false); }
    }
    this.shots = this.shots.filter((s) => s.y > 14);
    // la bonbille avance par petits pas (pour ne pas traverser les briques)
    for (const b of this.balls) {
      if (b.stuck) continue;
      const steps = Math.ceil(Math.hypot(b.vx, b.vy) * dt / 2);
      for (let i = 0; i < steps && !b.stuck; i++) this.stepBall(b, dt / steps);
    }
    const before = this.balls.length;
    this.balls = this.balls.filter((b) => b.y < C.H + 8);
    if (before && !this.balls.length && this.state === 'play' && !this.exit) this.loseHeart();
    // les capsules
    for (const k of this.caps) {
      k.y += 50 * dt;
      if (this.state === 'play' && k.y + 7 > CASSE.paddleY + 12 && k.y < CASSE.paddleY + 24 && k.x + 14 > this.px && k.x < this.px + this.pw) { k.y = C.H + 20; this.take(k.kind); }
    }
    this.caps = this.caps.filter((k) => k.y < C.H);
    this.updateMonsters(dt);
    for (const p of this.popups) { p.t += dt; p.y -= 14 * dt; }
    this.popups = this.popups.filter((p) => p.t < 1);
    for (const p of this.parts) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 80 * dt; p.life -= dt; }
    this.parts = this.parts.filter((p) => p.life > 0);
  }

  // les monstres sortent des trappes, descendent, et explosent quand on les touche
  private updateMonsters(dt: number) {
    const live = this.state === 'play' && !this.exit;
    // les trappes s'ouvrent quand un monstre sort, puis se referment
    this.hatches = this.hatches.map((k, i) => {
      const busy = this.monsters.some((m) => m.hatch === i && m.y < 20);
      return Math.max(0, Math.min(1, k + (busy ? dt / 0.4 : -dt / 0.6)));
    });
    if (live && this.monsters.length < CASSE.monsters && (this.monsterT -= dt) <= 0) {
      const free = HATCHES.map((_, i) => i).filter((i) => !this.monsters.some((m) => m.hatch === i && m.y < 40));
      if (free.length) {
        const h = free[Math.floor(this.rnd() * free.length)], kinds: MonsterKind[] = ['invGuimauve', 'invBerlingot', 'invReglisse'];
        this.monsters.push({ kind: kinds[Math.floor(this.rnd() * 3)], hatch: h, x: HATCHES[h] - 7, y: 4, ph: this.rnd() * 6 });
        this.monsterT = CASSE.nextMonster; this.sfx.play('pop');
      }
    }
    for (const m of this.monsters) {
      if (this.hatches[m.hatch] < 1 && m.y < 20) continue; // la trappe s'ouvre encore
      m.y += CASSE.monsterSpeed * dt;
      const sway = Math.min(1, (m.y - 20) / 30);
      if (sway > 0) m.x = HATCHES[m.hatch] - 7 + Math.sin(this.t * 0.9 + m.ph) * 26 * sway;
      // la soucoupe le touche : il explose (il ne fait rien au chat)
      if (live && m.y + 14 > CASSE.paddleY + 12 && m.y < CASSE.paddleY + 26 && m.x + 14 > this.px && m.x < this.px + this.pw) this.popMonster(m);
      if (m.y > C.H) m.y = 1e9; // il est parti par le bas
    }
    // les vermicelles de la mitraillette
    for (const s of this.shots) for (const m of this.monsters) if (m.y < 1e8 && s.x >= m.x && s.x < m.x + 15 && s.y < m.y + 14 && s.y + 4 > m.y) { this.popMonster(m); s.y = -10; }
    this.monsters = this.monsters.filter((m) => m.y < 1e8);
  }
  private popMonster(m: Monster) {
    if (m.y >= 1e8) return;
    this.burst(m.x + 7, m.y + 7, null, 14);
    this.score += CASSE.monsterPoints; this.popups.push({ text: '+' + CASSE.monsterPoints, x: m.x, y: m.y, t: 0 });
    m.y = 1e9; this.monsterT = Math.max(this.monsterT, 1.2);
    this.sfx.play('kill');
  }

  // le passage secret : il s'ouvre, la soucoupe y entre, puis le tableau suivant glisse depuis ce côté
  private updateExit(dt: number) {
    const ex = this.exit!, pd = this.paddle;
    ex.open = Math.min(1, ex.open + dt / 0.8);
    if (ex.slide < 0) {
      if (this.state === 'play' && (ex.side ? pd.x > C.W - 14 : pd.x < -26)) { ex.slide = 0; ex.next = build(this.tableau + 1); this.sfx.play('respawn'); }
      return;
    }
    ex.slide += dt;
    if (ex.slide >= 0.9) this.nextTableau();
  }

  private stepBall(b: Ball, dt: number) {
    const W = CASSE.wall;
    b.x += b.vx * dt; b.y += b.vy * dt;
    if (b.x < W + R) { b.x = W + R; b.vx = Math.abs(b.vx); }
    if (b.x > C.W - W - R) { b.x = C.W - W - R; b.vx = -Math.abs(b.vx); }
    if (b.y < 14 + R) { b.y = 14 + R; b.vy = Math.abs(b.vy); }
    // la soucoupe : l'endroit touché donne la direction (avec la colle, la bonbille reste dessus)
    const top = CASSE.paddleY + 14;
    if (b.vy > 0 && b.y + R >= top && b.y + R <= top + 8 && b.x > this.px - R && b.x < this.px + this.pw + R) {
      if (this.paddle.glue > 0) {
        b.stuck = true; b.off = Math.max(-this.pw / 2 + 2, Math.min(this.pw / 2 - 2, b.x - (this.paddle.x + 20))) || 0.1;
        b.hold = CASSE.glueHold; this.sfx.play('web');
        return;
      }
      const u = Math.max(-1, Math.min(1, (b.x - (this.px + this.pw / 2)) / (this.pw / 2)));
      const a = -Math.PI / 2 + u * 1.05, v = Math.min(CASSE.ballMax, Math.hypot(b.vx, b.vy) + 1.5);
      b.vx = Math.cos(a) * v; b.vy = Math.sin(a) * v; b.y = top - R;
      this.sfx.play('bounce');
    }
    // les monstres : la bonbille rebondit dessus et ils explosent
    for (const m of this.monsters) {
      if (m.y >= 1e8 || m.y < 18) continue;
      if (b.x + R <= m.x + 1 || b.x - R >= m.x + 14 || b.y + R <= m.y + 1 || b.y - R >= m.y + 13) continue;
      this.bounceOff(b, m.x + 1, m.y + 1, 13, 12); this.popMonster(m);
    }
    // les briques
    for (const k of this.bricks) {
      if (k.hp <= 0) continue;
      if (b.x + R <= k.x || b.x - R >= k.x + k.w || b.y + R <= k.y || b.y - R >= k.y + k.h) continue;
      const through = this.paddle.through > 0;
      if (!through || k.kind === 'caramel') this.bounceOff(b, k.x, k.y, k.w, k.h);
      this.hitBrick(k, through);
      if (!through || k.kind === 'caramel') break;
    }
  }

  // rebond sur une boîte : du côté où la bonbille est le moins entrée
  private bounceOff(b: Ball, x: number, y: number, w: number, h: number) {
    const ox = Math.min(b.x + R - x, x + w - (b.x - R)), oy = Math.min(b.y + R - y, y + h - (b.y - R));
    if (ox < oy) { b.vx = b.x < x + w / 2 ? -Math.abs(b.vx) : Math.abs(b.vx); b.x += b.vx > 0 ? ox : -ox; }
    else { b.vy = b.y < y + h / 2 ? -Math.abs(b.vy) : Math.abs(b.vy); b.y += b.vy > 0 ? oy : -oy; }
  }

  private hitBrick(k: Cell, through: boolean) {
    if (k.kind === 'caramel') { this.sfx.play('web'); return; }
    k.hp -= through ? k.hp : 1;
    if (k.hp > 0) { this.sfx.play('pop'); this.burst(k.x + k.w / 2, k.y + k.h / 2, P.W, 4); return; }
    this.score += POINTS[k.kind] * (1 + Math.floor((this.tableau - 1) / TABLEAUX.length));
    this.burst(k.x + k.w / 2, k.y + k.h / 2, FC.brickColor(k.kind), k.small ? 6 : 10);
    this.sfx.play('kill');
    if (this.rnd() < CASSE.bonusChance && !this.exit) {
      let r = this.rnd() * CAPSULES.reduce((s, [, w]) => s + w, 0), kind: CapsuleKind = 'L';
      for (const [kk, w] of CAPSULES) { if ((r -= w) < 0) { kind = kk; break; } }
      this.caps.push({ kind, x: k.x + 4, y: k.y });
    }
    if (!this.bricks.some((b) => b.hp > 0 && b.kind !== 'caramel') && !this.exit) {
      // le mur est vide : le passage secret s'ouvre
      this.score += 500; this.banner = { text: 'TABLEAU TERMINÉ ! +500', t: 0 };
      for (const b of this.balls) this.burst(b.x, b.y, P.b, 6);
      this.balls = []; this.caps = []; this.shots = [];
      for (const m of this.monsters) this.popMonster(m);
      this.exit = { side: this.rnd() < 0.5 ? 0 : 1, open: 0, slide: -1, next: [] };
      this.sfx.play('level');
    }
  }

  private take(kind: CapsuleKind) {
    const pd = this.paddle, say = (text: string) => { this.banner = { text, t: 0 }; };
    if (kind === 'Z') { pd.slow = CASSE.slow; say("ZZZ... LA SOUCOUPE S'ENDORT !"); this.sfx.play('yawn'); return; }
    this.score += 50; this.sfx.play('pickup');
    if (kind === 'L') { pd.wide = CASSE.wide; say('SOUCOUPE PLUS LARGE !'); }
    else if (kind === 'T') { pd.through = CASSE.through; say('LA BONBILLE TRAVERSE TOUT !'); }
    else if (kind === 'V') { pd.gun = CASSE.gun; say('MITRAILLETTE : TIRE !'); }
    else if (kind === 'C') { pd.glue = CASSE.glue; say('COLLE : TIRE POUR RENVOYER !'); }
    else {
      say('3 BONBILLES !');
      const src = this.balls.find((b) => !b.stuck) ?? this.balls[0];
      if (!src) return;
      for (const a of [-0.5, 0.5]) {
        const v = Math.max(this.speedUp, Math.hypot(src.vx, src.vy)), ang = Math.atan2(src.vy || -1, src.vx) + a;
        this.balls.push({ x: src.x, y: src.stuck ? src.y - 4 : src.y, vx: Math.cos(ang) * v, vy: -Math.abs(Math.sin(ang) * v) || -v, stuck: false, off: 0, hold: 0 });
      }
    }
  }

  private loseHeart() {
    const pd = this.paddle;
    this.lives--; pd.wide = 0; pd.through = 0; pd.gun = 0; pd.glue = 0; this.caps = []; this.shots = [];
    this.sfx.play(this.lives > 0 ? 'hurt' : 'lose');
    if (this.lives <= 0) { this.lives = 0; this.state = 'dying'; this.stateT = 0; this.burst(pd.x + 20, CASSE.paddleY + 16, null, 30); return; }
    this.banner = { text: 'BONBILLE PERDUE !', t: 0 };
    this.serve();
  }

  private burst(x: number, y: number, c: number[] | null, n: number) {
    for (let i = 0; i < n; i++) {
      const a = this.rnd() * Math.PI * 2, v = 20 + this.rnd() * 50;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 20, life: 0.3 + this.rnd() * 0.4, c: c ?? FC.RAINBOW[i % 6] });
    }
  }

  // les murs en sucre d'orge, et le passage secret qui brille
  private drawWalls(scr: Pix) {
    const t = this.t, ex = this.exit, W = CASSE.wall;
    const top = ex ? Math.round(C.H - 46 * ex.open) : C.H;
    for (let side = 0; side < 2; side++) {
      const x = side ? C.W - W : 0, open = ex && ex.side === side;
      for (let y = 14; y < C.H; y++) {
        if (open && y > top && y < C.H - 2) continue;
        scr.rect(x, y, W, 1, Math.floor((y + x) / 4) % 2 ? P.r : P.W);
      }
      scr.rect(side ? C.W - W - 1 : W, 14, 1, C.H - 14, FC.alpha(P.K, 160));
    }
    if (!ex || ex.open <= 0) return;
    const right = ex.side === 1, h = C.H - 2 - top;
    for (let g = 0; g < 26; g++) scr.rect(right ? C.W - W - 1 - g : W + g, top + 2 + g * 0.3, 1, h - 2 - g * 0.3, FC.alpha(P.y, Math.max(0, 70 - g * 3)));
    scr.rect(right ? C.W - W : 0, top, W, h, FC.alpha(P.W, 200 + 40 * Math.sin(t * 8)));
    for (let i = 0; i < 6; i++) scr.rect(right ? C.W - W - 1 - i : W + i, top - 6 + i, 1, h + 6 - i, FC.RAINBOW[i]);
    for (let j = 0; j < 10; j++) {
      const d = (t * 25 + j * 9) % 30;
      scr.put(right ? C.W - 10 - d : 10 + d, top + 6 + ((j * 13) % Math.max(1, h - 8)) + Math.sin(t * 2 + j) * 2, FC.alpha(P.W, 230 - d * 7));
    }
  }

  draw(scr: Pix, hero: (f: number) => Pix) {
    const t = this.t, pd = this.paddle, ex = this.exit;
    scr.d.set(FC.bg('casseBg', C.W, C.H, [[0, '0b0a26'], [0.7, '1d1450'], [1, '2a1258']]).d);
    FC.drawStars(scr, this.stars, t, [1, 3, 6]);
    // les briques (pendant le glissement : l'ancien mur part, le nouveau arrive du côté du passage)
    const k = ex && ex.slide >= 0 ? Math.min(1, ex.slide / 0.9) : 0, dir = ex && ex.side ? 1 : -1;
    const draw = (b: Cell, dx: number) => b.small ? FC.miniBrick(scr, b.x + dx, b.y, b.kind, t, b.hp) : FC.brick(scr, b.x + dx, b.y, b.kind, t, b.kind === 'sucre' && b.hp === 1, b.hp);
    for (const b of this.bricks) if (b.hp > 0) draw(b, -dir * k * C.W);
    if (ex && ex.slide >= 0) for (const b of ex.next) draw(b, dir * (1 - k) * C.W);
    this.drawWalls(scr);
    // les monstres, puis les trappes par-dessus (ils en sortent petit à petit)
    for (const m of this.monsters) scr.blit(FC.spr(m.kind, Math.floor(t * 4 + m.ph)), Math.round(m.x), Math.round(m.y));
    HATCHES.forEach((x, i) => FC.hatch(scr, x, this.hatches[i]));
    for (const c of this.caps) {
      const y = Math.round(c.y), x = Math.round(c.x), trap = c.kind === 'Z';
      scr.rect(x, y, 14, 7, CAP_COLOR[c.kind]); scr.rect(x, y, 7, 7, trap ? P.k : P.P); scr.rect(x, y, 14, 1, trap ? P.v : P.W);
      FC.text(scr, c.kind, x + 5, y + 1, P.W, { outline: P.K });
    }
    for (const s of this.shots) { scr.rect(Math.round(s.x), Math.round(s.y), 1, 4, FC.SPRINKLES[Math.floor(s.y / 7) % 7]); }
    for (const p of this.parts) scr.rect(Math.round(p.x), Math.round(p.y), 2, 2, p.c);
    for (const p of this.popups) FC.text(scr, p.text, Math.round(p.x), Math.round(p.y), P.y, { outline: P.K });
    // la soucoupe (tapis arc-en-ciel quand elle est plus large ; canons quand elle tire ; bulle quand elle dort)
    if (this.state === 'play' && !(ex && ex.slide >= 0)) {
      const x = Math.round(this.px), y = CASSE.paddleY;
      if (pd.wide > 0 && !(pd.wide < 2 && Math.floor(t * 8) % 2)) for (let i = 0; i < this.pw; i++) scr.rect(x + i, y + 24, 1, 3, FC.RAINBOW[Math.floor((i + t * 20) / 4) % 6]);
      FC.trail(scr, pd.x + 4, y + 25, t);
      // il disparaît dans le passage : on ne dessine pas ce qui est dans le mur
      const pic: Pix = hero(Math.floor(t * 5) % 4);
      if (ex && ex.open >= 1) {
        const clip = FC.mk('casseClip', () => new FC.Pix(40, 31)) as Pix;
        clip.d.set(pic.d);
        for (let yy = 0; yy < 31; yy++) for (let xx = 0; xx < 40; xx++) { const sx = pd.x + xx; if (ex.side ? sx >= C.W - CASSE.wall : sx < CASSE.wall) clip.d[(yy * 40 + xx) * 4 + 3] = 0; }
        scr.blit(clip, Math.round(pd.x), y);
      } else scr.blit(pic, Math.round(pd.x), y);
      if (pd.gun > 0) for (const gx of [x + 4, x + this.pw - 7]) { scr.rect(gx, y + 15, 3, 4, P.M); scr.rect(gx, y + 14, 3, 1, P.r); }
      if (pd.glue > 0 && Math.floor(t * 4) % 2) scr.rect(x + 2, y + 17, this.pw - 4, 1, FC.alpha(P.o, 200));
      if (pd.slow > 0) scr.blit(FC.spr('sleepBubble', Math.floor(t * 3)), Math.round(pd.x) + 26, y - 8 - Math.round(Math.sin(t * 3) * 2));
    }
    // les bonbilles (arc-en-ciel quand elles traversent tout)
    for (const b of this.balls) {
      if (pd.through > 0) scr.ell(b.x, b.y, R + 2, R + 2, FC.alpha(FC.RAINBOW[Math.floor(t * 12) % 6], 140));
      scr.blit(FC.spr('bigDrag', 3), Math.round(b.x - 4.5), Math.round(b.y - 4));
    }
    // les capsules en cours, en bas à gauche, avec le temps qui reste
    let bx = 10;
    for (const [kk, v] of [['L', pd.wide], ['T', pd.through], ['V', pd.gun], ['C', pd.glue], ['Z', pd.slow]] as [CapsuleKind, number][]) {
      if (v <= 0) continue;
      scr.rect(bx, 170, 7, 7, CAP_COLOR[kk]); FC.text(scr, kk, bx + 2, 171, P.W);
      bx = FC.text(scr, String(Math.ceil(v)), bx + 9, 171, P.W, { outline: P.K }) + 5;
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
    if (this.state !== 'play') return;
    const msg = ex && ex.slide < 0 && ex.open >= 1 && !this.banner ? (ex.side ? 'PASSAGE SECRET : VA À DROITE !' : 'PASSAGE SECRET : VA À GAUCHE !')
      : this.balls.some((b) => b.stuck) ? (this.balls.some((b) => b.stuck && b.off) ? 'TIRE POUR RENVOYER LA BONBILLE' : 'TIRE POUR LANCER LA BONBILLE') : '';
    if (msg && t % 1.2 < 0.8) FC.text(scr, msg, Math.round(C.W / 2 - FC.textWidth(msg) / 2), 124, ex ? P.y : P.W, { outline: P.K });
    if (ex && ex.slide < 0 && ex.open >= 1) for (let q = 0; q < 2; q++) { // des flèches vers le passage
      const ax = (ex.side ? 262 + (t * 30) % 16 : 52 - (t * 30) % 16) + q * (ex.side ? 9 : -9);
      if (ex.side) scr.tri(ax, 150, ax, 162, ax + 6, 156, P.y); else scr.tri(ax + 6, 150, ax + 6, 162, ax, 156, P.y);
    }
  }
}
