// Le niveau en cours : le chat, les ennemis, les obstacles, les tirs, le score.
import { FC, Color } from '../art';
import * as C from './config';
import {
  Box, Shape, Enemy, Shot, EShot, Obstacle, Bonus, Particle, Popup, Message, ObstacleDef,
  WeaponKind, BonusKind, EnemyKind, newEnemy, overlap, hitObstacle, shapeCenter, vrange, enemyBox, enemyCenter,
  planetDefs, fireRockDefs, dragonetJet, fireTreeDef, lavaBox, beltDefs, lollipopDef, cottonDef, webDef, fenceDef, pillarDef, cableDef, cablePoint, elecOn, pickWeighted,
  iceDef, dropDef, jetRockDef, jetState, jetCircles, boxEllipse, algaePix, herseDef,
} from './things';
import { Boss, BossHost } from './boss';
import { SkelBoss, SkelHost } from './skel';
import { Setup, ModeCfg } from './modes';

export type { WeaponKind } from './things';
export const WEAPON_ORDER: WeaponKind[] = ['verm', 'drag', 'pinata', 'rain'];

// Ce que le joueur fait à cette image
export interface Controls {
  dx: number; dy: number; // -1..1
  fire: boolean; // maintenu
  special: boolean; // casse-dents, appuyé à cette image
  swap: boolean; // changer d'arme, appuyé à cette image
  select: number; // -1, ou 0..2 pour choisir une arme
}
export interface Sfx {
  play(name: string): void; music?(theme: string | null): void; pauseMusic?(paused: boolean): void;
  setVolumes?(music: number, sfx: number): void; setVibrate?(on: boolean): void;
}

// Ce qu'on garde d'un niveau à l'autre
export interface Carry { score: number; lives: number; ammo: { verm: number; drag: number; pinata: number; jaw: number } }

const HERO_BOX = { x: 8, y: 9, w: 24, h: 16 };
const RAIN_SIZE = [1, 1.45, 1.9];
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const rad = (deg: number) => deg * Math.PI / 180;

// taille de l'arc-en-ciel selon son âge (il grandit en avançant)
export function rainStage(age: number) { return age < 0.18 ? 0 : age < 0.42 ? 1 : 2; }
export function shotBox(s: Shot): Box {
  if (s.kind === 'verm') return { x: s.x, y: s.y - 1, w: 5, h: 3 };
  if (s.kind === 'drag') return { x: s.x, y: s.y, w: 9, h: 8 };
  if (s.kind === 'jaw') return { x: s.x, y: s.y, w: 11, h: 11 };
  if (s.kind === 'pinata') return { x: s.x + 2, y: s.y + 1, w: 15, h: 11 };
  if (s.kind === 'shard') return { x: s.x, y: s.y, w: 5, h: 5 };
  const k = RAIN_SIZE[rainStage(s.age)], w = Math.round(9 * k), h = Math.round(13 * k);
  return { x: s.x + 1, y: s.y - h / 2 + 1, w: w - 1, h: h - 2 };
}

// setup : niveau et difficulté sur mesure (mode infini, défi du jour)
export interface WorldOptions { level?: number; seed?: number; mode?: C.Mode; carry?: Carry; setup?: Setup }

export class World implements BossHost, SkelHost {
  t = 0;
  boss: Boss | SkelBoss | null = null;
  score: number;
  readonly startScore: number;
  readonly levelIndex: number;
  readonly level: C.Level;
  mode: ModeCfg;
  readonly label: string; // affiché dans le bandeau du haut (NIV.3, ZONE 4, DÉFI)
  state: 'play' | 'dying' | 'over' | 'cleared' = 'play';
  stateT = 0;
  flash = 0;
  flashColor: Color = [255, 255, 255, 255];
  banner: Message | null = null; // grand message (événement)
  weaponMsg: Message | null = null; // nom de l'arme choisie
  hero;
  enemies: Enemy[] = [];
  shots: Shot[] = [];
  eshots: EShot[] = [];
  obstacles: Obstacle[] = [];
  bonuses: Bonus[] = [];
  parts: Particle[] = [];
  popups: Popup[] = [];
  hits = 0; // nombre de coups reçus
  // pour le bilan de fin de niveau et les succès
  stats = { kills: 0, shots: 0, hitShots: 0, bonuses: 0, livesLost: 0 };
  events: { type: string; kind?: string; by?: string }[] = []; // lus (puis vidés) par l'application
  private shotSeq = 0;
  private pinataKills = new Map<number, number>();
  hitLog: Record<string, number> = {}; // d'où viennent les coups (pour régler la difficulté)
  private phaseIdx = -1;
  private timers = { obstacle: 3.5, wave: 2.5, bonus: C.BONUS_EVERY };
  private belt = { active: false, done: false, col: 0, timer: 0, hitsAtStart: 0 };
  private groups = new Map<number, { left: number; ok: boolean }>();
  private groupSeq = 0;
  private dist = 0;
  // anti-planque : temps passé collé au bord du haut ou du bas
  private edge = { side: 0, t: 0 };
  private rnd: () => number;

  constructor(private sfx: Sfx, o: WorldOptions = {}) {
    this.rnd = FC.rng(o.seed ?? Date.now() % 100000);
    this.levelIndex = o.setup ? o.setup.levelIndex : Math.min(o.level ?? 0, C.LEVELS.length - 1);
    this.level = o.setup ? o.setup.level : C.LEVELS[this.levelIndex];
    this.mode = o.setup ? o.setup.mode : C.MODES[o.mode ?? 'normal'];
    this.label = o.setup ? o.setup.label : 'NIV.' + this.level.num;
    const W = C.WEAPONS, carry = o.carry;
    this.score = this.startScore = carry ? carry.score : 0;
    this.hero = {
      x: C.HERO_START.x, y: C.HERO_START.y, energy: this.mode.energy, energyMax: this.mode.energy,
      lives: carry ? carry.lives : this.mode.lives,
      inv: C.INVINCIBLE_AFTER_RESPAWN, slow: 0, ghost: 0, dead: 0, sleep: 0, fireCD: 0, jawCD: 0, shotCount: 0,
      weapon: 'verm' as WeaponKind,
      // (une ancienne sauvegarde n'a pas encore de Piñatas : on en donne le stock de départ)
      ammo: carry ? { ...carry.ammo, pinata: carry.ammo.pinata ?? W.pinata.start } : { verm: W.verm.start, drag: W.drag.start, pinata: W.pinata.start, jaw: W.jaw.start },
    };
    if (this.hero.ammo.verm <= 0 && this.hero.ammo.drag > 0) this.hero.weapon = 'drag';
  }

  carry(): Carry { const h = this.hero; return { score: this.score, lives: Math.max(1, h.lives), ammo: { ...h.ammo } }; }
  get progress() { return Math.max(0, Math.min(1, (this.score - this.startScore) / this.level.points)); }
  get phase(): C.Phase { return this.level.phases[Math.max(0, this.phaseIdx)]; }
  get beltActive() { return this.belt.active; }
  get floor() { return this.level.ground ?? C.H; }
  get top() { return this.level.ceiling ?? C.HUD_H; }
  heroBox(): Box { const h = this.hero; return { x: h.x + HERO_BOX.x, y: h.y + HERO_BOX.y, w: HERO_BOX.w, h: HERO_BOX.h }; }
  heroAlive() { return this.hero.dead <= 0 && this.state !== 'over'; }

  update(dt: number, c: Controls) {
    this.t += dt; this.stateT += dt;
    this.flash = Math.max(0, this.flash - dt);
    if (this.banner && (this.banner.t += dt) > 2.8) this.banner = null;
    if (this.weaponMsg && (this.weaponMsg.t += dt) > 1.3) this.weaponMsg = null;
    const h = this.hero;

    if (this.state === 'play' && this.heroAlive()) {
      const cy = h.y + 17, side = cy < this.top + 40 ? -1 : cy > this.floor - 40 ? 1 : 0;
      if (side && side === this.edge.side) this.edge.t += dt; else this.edge = { side, t: 0 };
      this.dist += dt * C.POINTS.perSecond;
      while (this.dist >= 10) { this.dist -= 10; this.score += 10; }
    }
    this.updateHero(dt, c);
    if (this.state === 'play' && this.t > 2) { this.updatePhase(); this.spawn(dt); }
    this.updateEnemies(dt);
    this.updateEShots(dt);
    this.updateShots(dt);
    this.updateObstacles(dt);
    this.updateBonuses(dt);
    this.updateFx(dt);
    if (this.boss) this.updateBoss(dt);

    if (this.state === 'play' && !this.belt.active && (this.level.boss ? !!this.boss?.dead : this.progress >= 1)) {
      this.state = 'cleared'; this.stateT = 0;
      this.eshots = [];
      for (const e of this.enemies) e.holdT = 0;
      this.sfx.play('level');
    }
    if (this.state === 'dying' && this.stateT > 1.8) { this.state = 'over'; this.stateT = 0; }
    if (h.dead > 0) {
      h.dead -= dt;
      if (h.dead <= 0 && this.state === 'play') this.respawn();
    }
  }

  private say(text: string) { this.banner = { text, t: 0 }; }

  private updateHero(dt: number, c: Controls) {
    const h = this.hero;
    h.inv = Math.max(0, h.inv - dt); h.slow = Math.max(0, h.slow - dt); h.ghost = Math.max(0, h.ghost - dt);
    h.fireCD -= dt; h.jawCD -= dt;
    if (h.dead > 0) return;
    if (this.state === 'cleared') { // le chat file vers la droite
      if (this.stateT > 0.8) h.x += 150 * dt;
      return;
    }
    if (this.state !== 'play') return;
    if (h.sleep > 0) { h.sleep -= dt; return; } // endormi par une bulle : ni mouvement ni tir
    const sp = C.HERO_SPEED * (h.slow > 0 ? C.WEB_SLOW.factor : 1);
    let dx = c.dx, dy = c.dy;
    const len = Math.hypot(dx, dy); if (len > 1) { dx /= len; dy /= len; }
    h.x = Math.max(0, Math.min(C.W - 40, h.x + dx * sp * dt));
    h.y = Math.max(this.top - 4, Math.min(this.floor - 30, h.y + dy * sp * dt));

    // choix de l'arme
    const ok = (k: WeaponKind) => k === 'rain' || h.ammo[k] > 0;
    const pick = (k: WeaponKind) => { h.weapon = k; this.weaponMsg = { text: C.WEAPON_NAMES[k], t: 0 }; this.sfx.play('swap'); };
    if (c.select >= 0 && ok(WEAPON_ORDER[c.select])) pick(WEAPON_ORDER[c.select]);
    if (c.swap) {
      let i = WEAPON_ORDER.indexOf(h.weapon);
      for (let n = 0; n < WEAPON_ORDER.length; n++) { i = (i + 1) % WEAPON_ORDER.length; if (ok(WEAPON_ORDER[i])) break; }
      pick(WEAPON_ORDER[i]);
    }
    if (!ok(h.weapon)) { // arme vide : on prend l'autre bonbon, sinon la corne prend le relais
      const next = WEAPON_ORDER.find(ok)!;
      this.weaponMsg = { text: 'PLUS DE ' + C.WEAPON_NAMES[h.weapon] + ' : ' + C.WEAPON_NAMES[next], t: 0 };
      h.weapon = next;
    }

    if (c.fire && h.fireCD <= 0) this.fire(h.weapon);
    if (c.special && h.jawCD <= 0 && h.ammo.jaw > 0) {
      const J = C.WEAPONS.jaw;
      h.ammo.jaw--; h.jawCD = 1 / J.rate; this.stats.shots++;
      this.shots.push({ kind: 'jaw', x: h.x + 32, y: h.y + 9, vx: J.speed, vy: 0, dmg: J.dmg, life: 4, age: 0, frame: 0, bounces: 0, hit: [], dead: false });
      this.sfx.play('jaw');
    }
  }

  private fire(k: WeaponKind) {
    const h = this.hero;
    h.shotCount++;
    this.stats.shots++;
    const shot = (o: Partial<Shot>) => this.shots.push({ kind: k, x: 0, y: 0, vx: 0, vy: 0, dmg: 1, life: 2, age: 0, frame: 0, bounces: 0, hit: [], dead: false, src: ++this.shotSeq, ...o });
    if (k === 'verm') {
      const V = C.WEAPONS.verm, a = rad((this.rnd() * 2 - 1) * V.spread);
      h.fireCD = 1 / V.rate; h.ammo.verm--;
      shot({ x: h.x + 37, y: h.y + 14, vx: Math.cos(a) * V.speed, vy: Math.sin(a) * V.speed, dmg: V.dmg, life: 1.4, frame: h.shotCount % 7 });
    } else if (k === 'drag') {
      const D = C.WEAPONS.drag, a = rad(D.angle * (h.shotCount % 2 ? 1 : -1));
      h.fireCD = 1 / D.rate; h.ammo.drag--;
      shot({ x: h.x + 33, y: h.y + 10, vx: Math.cos(a) * D.speed, vy: Math.sin(a) * D.speed, dmg: D.dmg, life: 3.2, frame: h.shotCount % 6, bounces: D.bounces });
    } else if (k === 'pinata') {
      const PI = C.WEAPONS.pinata;
      h.fireCD = 1 / PI.rate; h.ammo.pinata--;
      shot({ x: h.x + 26, y: h.y + 8, vx: PI.speed, dmg: PI.dmg, life: PI.life, frame: h.shotCount % 4 });
    } else {
      const R = C.WEAPONS.rain;
      h.fireCD = 1 / R.rate;
      shot({ x: h.x + 26, y: h.y + 8, vx: R.speed, dmg: R.dmg, life: R.range / R.speed });
    }
    this.sfx.play('shoot_' + k);
  }

  // ---------- déroulement du niveau ----------
  private updatePhase() {
    const ph = this.level.phases, p = this.progress;
    while (this.phaseIdx + 1 < ph.length && ph[this.phaseIdx + 1].from <= p) {
      this.phaseIdx++;
      const cur = ph[this.phaseIdx];
      if (cur.banner) this.say(cur.banner);
      if (cur.event === 'boss' && !this.boss) { this.boss = this.level.boss === 'skel' ? new SkelBoss(this.top, this.floor, this.mode.bossHp ?? 1) : new Boss(this.mode.bossHp ?? 1); this.sfx.play('alarm'); this.sfx.music?.(this.level.boss === 'skel' ? 'skelboss' : 'boss'); }
      if (cur.event === 'belt' && !this.belt.done) {
        Object.assign(this.belt, { active: true, col: 0, timer: 2.2, hitsAtStart: this.hits });
        this.sfx.play('alarm');
      }
    }
  }

  private spawn(dt: number) {
    const ph = this.phase, p = this.progress, m = this.mode, T = this.timers;
    T.wave -= dt; T.bonus -= dt;
    if (this.belt.active) this.updateBelt(dt);
    else {
      T.obstacle -= dt;
      if (T.obstacle <= 0) {
        const k = pickWeighted(ph.obstacles, this.rnd);
        if (k) this.spawnObstacle(k);
        T.obstacle = ph.obstacle / (m.obstacle ?? m.spawn) * (0.75 + this.rnd() * 0.5);
      }
    }
    if (T.wave <= 0) {
      const wk = this.belt.active ? 'solo' : pickWeighted(ph.waves, this.rnd);
      if (wk) this.spawnWave(wk, ph.gold);
      // le chat reste collé à un bord depuis plus de 5 s : une rangée d'ennemis arrive à sa hauteur
      if (this.edge.t > 5 && !this.belt.active) { this.spawnFormation('line', ph.gold, this.edge.side); this.edge.t = 0; }
      T.wave = (this.belt.active ? 5 : ph.wave) / m.spawn * (0.8 + this.rnd() * 0.4) * lerp(1.1, 0.9, p);
    }
    if (T.bonus <= 0) { // pendant le combat contre le boss, des munitions arrivent plus souvent
      const fight = !!this.boss?.alive;
      const kind = fight ? pickWeighted({ verm: 3, drag: 2, pinata: 2, heart: 1, jaw: 1 }, this.rnd) as BonusKind : undefined;
      this.spawnBonus(C.W + 4, this.top + 16 + this.rnd() * (this.floor - this.top - 50), this.level.scroll * 0.8, kind);
      T.bonus = (fight ? 6 : C.BONUS_EVERY / (this.mode.bonus ?? 1)) * (0.8 + this.rnd() * 0.4);
    }
  }

  private updateBelt(dt: number) {
    const B = this.belt;
    B.timer -= dt;
    if (B.col < C.BELT.columns && B.timer <= 0) { this.spawnBeltColumn(B.col++); B.timer = C.BELT.every; }
    if (B.col >= C.BELT.columns && !this.obstacles.some(o => o.belt)) {
      B.active = false; B.done = true;
      this.timers.obstacle = 3;
      if (this.hits === B.hitsAtStart) {
        this.score += C.POINTS.belt;
        this.say('TRAVERSÉE PARFAITE ! +' + C.POINTS.belt);
        this.events.push({ type: 'belt' });
        this.sfx.play('level');
      }
    }
  }

  private place(d: ObstacleDef, y: number, speed: number, belt = false, dx = 0) {
    this.obstacles.push({ kind: d.kind, pix: d.pix, x: C.W + 4 + dx, y, shapes: d.shapes, speed, dead: false, belt });
  }

  private spawnBeltColumn(i: number) {
    const defs = beltDefs(), mid = (C.HUD_H + C.H) / 2;
    const gapC = mid + Math.sin(i * 0.95 + 0.5) * 42, top = gapC - C.BELT.gap / 2, bot = gapC + C.BELT.gap / 2;
    const add = (cy: number) => { const d = defs[Math.floor(this.rnd() * defs.length)]; this.place(d, cy - d.pix.h / 2, C.BELT.speed, true, this.rnd() * 6); };
    for (let cy = top - 13; cy + 13 > C.HUD_H - 6; cy -= 25) add(cy);
    for (let cy = bot + 13; cy - 13 < C.H + 6; cy += 25) add(cy);
    // des mouches dans le passage : elles avancent avec la ceinture, il faut les abattre pour passer
    if (i > 0 && this.rnd() < C.BELT.flies) {
      const kind: EnemyKind = this.rnd() < 0.25 ? 'flyGold' : 'fly';
      this.enemies.push(newEnemy(kind, C.W + 16, gapC - 7, { speed: C.BELT.speed + 6, amp: 9, phase: this.rnd() * 6 }));
    }
  }

  // vérifie qu'il reste un passage d'au moins 46 pixels de haut près de cet endroit
  private passageOk(d: ObstacleDef, y: number) {
    const probe: Obstacle = { kind: d.kind, pix: d.pix, x: C.W + 4, y, shapes: d.shapes, speed: 0, dead: false, belt: false };
    const ranges = [vrange(probe)];
    for (const o of this.obstacles) if (o.x + o.pix.w > C.W - 90 && o.shapes.length) ranges.push(vrange(o));
    ranges.sort((a, b) => a[0] - b[0]);
    let free = this.top;
    for (const [a, b] of ranges) { if (a - free >= 46) return true; free = Math.max(free, b); }
    return this.floor - free >= 46;
  }

  private spawnObstacle(kind: C.ObstacleKind) {
    const G = this.level.ground, p = this.progress;
    const speed = G ? this.level.scroll : this.level.scroll * (1 + 0.35 * p);
    if (kind === 'planet' || kind === 'fireRock') {
      const defs = kind === 'planet' ? planetDefs() : fireRockDefs(), d = defs[Math.floor(this.rnd() * defs.length)];
      for (let tries = 0; tries < 8; tries++) {
        const y = C.HUD_H - d.pix.h * 0.3 + this.rnd() * (this.floor - C.HUD_H - d.pix.h * 0.4);
        if (this.passageOk(d, y)) { this.place(d, y, speed); return; }
      }
      return;
    }
    if (kind === 'fireTree') { // arbre en feu, planté au sol, de taille variable
      if (!G) return;
      const h = Math.round(40 + this.rnd() * 44), treeSeed = 1 + Math.floor(this.rnd() * 6), d = fireTreeDef(h, treeSeed);
      if (this.obstacles.some(o => o.x > C.W - 36) || !this.passageOk(d, G - h + 2)) return;
      this.place(d, G - h + 2, speed);
      this.obstacles[this.obstacles.length - 1].tree = { h, seed: treeSeed };
      return;
    }
    if (kind === 'liana') { // liane qui pend du ciel : elle s'allonge et rétrécit, ou elle se détache et tombe
      const max = 46 + this.rnd() * 50, drop = this.rnd() < 0.35, seed = Math.floor(this.rnd() * 9);
      const d = { kind: 'liana' as const, pix: FC.liana(max, 0, seed), shapes: [{ t: 'r' as const, x: 3, y: 0, w: 8, h: max + 3 }] };
      if (this.obstacles.some(o => o.x > C.W - 30) || !this.passageOk(d, this.top)) return;
      this.place(d, this.top, speed);
      this.obstacles[this.obstacles.length - 1].liana = { len: drop ? max : max * 0.6, min: max * 0.45, max, ph: this.rnd() * 6, seed, drop, at: 90 + this.rnd() * 150, vy: 0 };
      return;
    }
    if (kind === 'lavaFall') { // coulée de lave verticale, du plafond au sol (on la traverse quand elle est éteinte)
      if (this.obstacles.some(o => o.lava && o.x > C.W - 90)) return;
      this.obstacles.push({ kind: 'lavaFall', pix: new FC.Pix(9, 1), x: C.W + 4, y: this.top, shapes: [], speed, dead: false, belt: false, lava: { offset: this.rnd() * 6 } });
      return;
    }
    if (this.phase.slalom) return this.spawnSlalom(speed);
    if (kind === 'algae') { // au sol ou au plafond ; on garde un passage en comptant leur taille maximale
      const top = this.level.ceiling !== null && this.rnd() < 0.45, max = C.ALGAE.min + this.rnd() * (C.ALGAE.max - C.ALGAE.min);
      this.placeAlgae(top, max, speed, true);
      return;
    }
    if (kind === 'coral') { // petit corail planté dans le sable : on ne passe pas au travers
      if (!G || this.obstacles.some(o => o.x > C.W - 30)) return;
      const seed = Math.floor(this.rnd() * 3), pix = FC.coral(seed);
      const d = { kind: 'coral' as const, pix, shapes: [{ t: 'r' as const, x: 3, y: 2, w: 18, h: 20 }] };
      if (this.passageOk(d, G - 20)) this.place(d, G - 20, speed);
      return;
    }
    if (kind === 'herse') {
      if (this.obstacles.some(o => o.x > C.W - 40)) return;
      this.place(herseDef(), this.top - 54, speed);
      this.obstacles[this.obstacles.length - 1].herse = { offset: this.rnd() * 6 };
      return;
    }
    if (kind === 'ice' || kind === 'drop') {
      const d = kind === 'ice' ? iceDef(this.rnd) : dropDef(this.rnd);
      for (let tries = 0; tries < 8; tries++) {
        const y = this.top + 4 + this.rnd() * (this.floor - this.top - d.pix.h - 8);
        if (this.passageOk(d, y)) { this.place(d, y, speed); return; }
      }
      return;
    }
    if (kind === 'jet') { // rocher posé en bas (jet vers le haut) ou en haut (jet vers le bas)
      const d = jetRockDef(), down = this.rnd() < 0.5;
      const y = down ? this.top - d.pix.h * 0.45 : this.floor - d.pix.h * 0.55;
      if (this.obstacles.some(o => o.x > C.W - 60)) return;
      this.place(d, y, speed);
      this.obstacles[this.obstacles.length - 1].jet = { offset: this.rnd() * 4, down };
      return;
    }
    if (kind === 'web') {
      const d = webDef(this.rnd);
      for (let tries = 0; tries < 6; tries++) {
        const y = this.top + 8 + this.rnd() * (this.floor - this.top - 70) - d.pix.h / 4;
        if (this.passageOk(d, y)) { this.place(d, y, speed); return; }
      }
      return;
    }
    if (!G) return; // les arbres et les clôtures ont besoin d'un sol
    if (this.obstacles.some(o => o.x > C.W - 40)) return; // pas deux obstacles collés
    if (kind === 'fence') {
      const d = fenceDef(this.rnd), y = G - d.pix.h;
      if (this.passageOk(d, y)) {
        this.place(d, y, speed);
        const o = this.obstacles[this.obstacles.length - 1];
        // un bonus précieux coincé entre les poteaux : il faut passer quand le courant est coupé.
        // Dans ce cas, le courant reste coupé plus longtemps (1,8 s au lieu de 1 s).
        const withBonus = this.rnd() < (this.phase.banner === 'ZONE ÉLECTRIQUE !' ? 0.7 : 0.45);
        o.elec = { ...d.elec!, on: 1.6, off: withBonus ? 1.8 : 1.0, offset: this.rnd() * 3.4 };
        if (withBonus) {
          const kind = pickWeighted({ jaw: 2, heart: 2, drag: 2, life: 1, bomb: 1 }, this.rnd) as BonusKind;
          this.spawnBonus(o.x + 30, o.y + o.elec.y + o.elec.h / 2 - 8, speed, kind);
        }
      }
      return;
    }
    if (kind === 'cable') {
      const d = cableDef(this.rnd);
      for (let tries = 0; tries < 6; tries++) {
        const y = this.top + 20 + this.rnd() * (this.floor - this.top - 90);
        if (this.passageOk(d, y)) { this.place(d, y, speed); return; }
      }
      return;
    }
    if (kind === 'pillar') {
      const d = pillarDef(this.rnd), fromTop = this.level.ceiling !== null && this.rnd() < 0.5;
      const y = fromTop ? this.top - 2 : G - d.pix.h + 2;
      if (this.passageOk(d, y)) { this.place(d, y, speed); this.obstacles[this.obstacles.length - 1].top = fromTop; }
      return;
    }
    const d = kind === 'lollipop' ? lollipopDef(this.rnd) : cottonDef(this.rnd);
    const y = G - d.pix.h + 3;
    if (this.passageOk(d, y)) this.place(d, y, speed);
  }

  private spawnWave(kind: C.WaveKind, gold: number) {
    const R = this.rnd, G = this.level.ground, sp = this.mode.speed;
    const playBottom = this.floor - 16, top = this.top;
    switch (kind) {
      case 'drone': {
        if (this.enemies.filter(e => e.kind === 'drone').length >= 2) return this.spawnFormation('solo', gold);
        return void this.enemies.push(newEnemy('drone', C.W + 6, top + 10 + R() * (playBottom - top - 30), {
          phase: R() * 6, speed: 55, amp: 8, holdX: 200 + R() * 80, holdT: 3.5 + R() * 1.5, shootT: 1.6,
        }));
      }
      case 'turret': {
        if (!G) return this.spawnFormation('solo', gold);
        const n = 1 + Math.floor(R() * (1 + this.progress));
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('turret', C.W + 6 + i * 70, G - 13, { shootT: 1 + R() * 1.5 }));
        return;
      }
      case 'batShrimp': { // 1 à 3 crevettes qui volent en grandes vagues
        const n = 1 + Math.floor(R() * (2 + this.progress));
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('batShrimp', C.W + 6 + i * 30, top + 40 + R() * (playBottom - top - 70), { phase: R() * 6 + i, speed: (55 + R() * 14) * sp, amp: 14 + R() * 12 }));
        return;
      }
      case 'guitar': {
        if (this.enemies.filter(e => e.kind === 'guitarFish').length >= 3) return this.spawnFormation('solo', gold);
        return void this.enemies.push(newEnemy('guitarFish', C.W + 6, top + 20 + R() * (playBottom - top - 40), {
          phase: R() * 6, speed: 55, amp: 10, holdX: 190 + R() * 90, holdT: 5 + R() * 2, shootT: 1.2,
        }));
      }
      case 'sorbets': { // 1 ou 2 sorbets volants qui s'arrêtent pour tirer
        if (this.enemies.filter(e => e.kind === 'sorbet').length >= 3) return this.spawnFormation('solo', gold);
        const n = 1 + (R() < 0.4 + this.progress * 0.4 ? 1 : 0);
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('sorbet', C.W + 6 + i * 30, top + 14 + R() * (playBottom - top - 40), {
          phase: R() * 6, speed: 50, amp: 8, holdX: 180 + R() * 100, holdT: 5 + R() * 2, shootT: 1 + i * 0.8,
        }));
        return;
      }
      case 'scouts': { // 3 éclaireurs en V, qui plongent vers le chat
        const y0 = top + 30 + R() * (playBottom - top - 60);
        const hx = 120 + R() * 70; // ils plongent l'un après l'autre
        [[0, 0], [16, -14], [16, 14]].forEach(([dx, dy], i) => this.enemies.push(newEnemy('scout', C.W + 6 + dx, y0 + dy, { phase: i, speed: 78 * sp, holdX: hx + i * 34 })));
        return;
      }
      case 'emberBats': { // une nuée de chauves-souris de braise
        const n = 3 + Math.floor(R() * (2.5 + this.progress * 1.5)), y0 = top + 30 + R() * (playBottom - top - 70);
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('emberBat', C.W + 6 + i * 16, y0 + (R() - 0.5) * 30, { phase: i * 0.9, speed: (60 + R() * 10) * sp, amp: 14 + R() * 8 }));
        return;
      }
      case 'dragonet': {
        if (this.enemies.filter(e => e.kind === 'dragonet').length >= 2) return this.spawnFormation('solo', gold);
        return void this.enemies.push(newEnemy('dragonet', C.W + 6, top + 16 + R() * (playBottom - top - 40), {
          phase: R() * 6, speed: 60, amp: 5, holdX: 170 + R() * 100, holdT: 6 + R() * 2, shootT: 0.8,
        }));
      }
      case 'salamanders': {
        if (!G) return this.spawnFormation('solo', gold);
        const n = 1 + Math.floor(R() * (1.5 + this.progress));
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('salamander', C.W + 6 + i * 40, G - 13, { phase: R() * 6, shootT: 1 + R() * 1.2, holdT: 0.5 + R() }));
        return;
      }
      case 'magma': { // un serpent de magma jaillira du sol (des bulles préviennent)
        if (!G) return this.spawnFormation('solo', gold);
        const x = 190 + R() * 120;
        return void this.enemies.push(newEnemy('magmaSnake', x, C.H + 10, { holdX: x, baseY: G, vx: C.MAGMA.warn, amp: 70 + R() * 30, speed: 60 + R() * 45 }));
      }
      case 'fireballs': { // le volcan crache des boules de feu qui retombent
        const n = 1 + Math.floor(R() * 2);
        for (let i = 0; i < n; i++) this.eshots.push({ kind: 'fireball', x: 100 + R() * 220, y: top - 14 - i * 12, vx: -(20 + R() * 40) * sp, vy: 15, g: 80 * sp, dead: false });
        this.sfx.play('bomb');
        return;
      }
      case 'miniScorps': { // mini-scorpions volants : ils se placent n'importe où sur l'écran
        const n = 1 + Math.floor(R() * (0.6 + this.progress));
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('miniScorp', C.W + 6 + i * 20, top + 10 + R() * (playBottom - top - 20), {
          phase: R() * 6, holdX: 130 + R() * 170, amp: top + 10 + R() * (playBottom - top - 20), holdT: 1.2 + R() * 0.5 + i * 0.7,
        }));
        return;
      }
      case 'phoenix':
        return void this.enemies.push(newEnemy('phoenix', C.W + 6, top + 20 + R() * (playBottom - top - 50), { phase: R() * 6, speed: (52 + R() * 12) * sp, amp: 16 + R() * 10 }));
      case 'golem': {
        if (!G || this.enemies.some(e => e.kind === 'golem')) return this.spawnFormation('solo', gold);
        return void this.enemies.push(newEnemy('golem', C.W + 6, G - 34, { phase: R() * 6, speed: this.level.scroll + 6 }));
      }
      case 'comets': { // météorites : du haut en descendant, du bas en remontant, ou à l'horizontale à toutes les hauteurs
        const n = 1 + Math.floor(R() * 2);
        for (let i = 0; i < n; i++) {
          const k = R(), vx = -(150 + R() * 50) * sp;
          const [y, vy] = k < 0.4 ? [top - 6 + R() * 50, (55 + R() * 40) * sp]
            : k < 0.7 ? [this.floor - 14 - R() * 40, -(55 + R() * 40) * sp]
              : [top + R() * (playBottom - top), (R() - 0.5) * 30 * sp];
          this.enemies.push(newEnemy('comet', C.W + 10 + R() * 120, y, { vx, vy, phase: R() * 6 }));
        }
        return;
      }
      case 'crab': {
        if (!G) return this.spawnFormation('solo', gold);
        const n = 1 + Math.floor(R() * (1 + this.progress));
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('crab', C.W + 6 + i * 44, G - 17, { phase: R() * 6, shootT: 1.2 + R() * 1.5, holdT: 0.5 + R() }));
        return;
      }
      case 'jellyBlue': case 'jellyPink': {
        if (this.enemies.filter(e => e.kind === 'jellyBlue' || e.kind === 'jellyPink').length >= 2) return this.spawnFormation('solo', gold);
        return void this.enemies.push(newEnemy(kind, C.W + 6, top + 26 + R() * (playBottom - top - 56), {
          phase: R() * 6, speed: 40, amp: kind === 'jellyPink' ? 26 : 18, holdX: 180 + R() * 100, holdT: 6 + R() * 2, shootT: 1.5,
        }));
      }
      case 'bubbles': { // 2 à 3 bulles soporifiques qui montent du fond
        const n = 1 + Math.floor(R() * 2);
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('sleepBubble', 150 + R() * 170, playBottom + 4 + i * 20, { phase: R() * 6, speed: 13 + R() * 7 }));
        return;
      }
      case 'hanging': { // crevettes accrochées au plafond
        const n = 1 + Math.floor(R() * 2);
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('hangShrimp', C.W + 6 + i * 50, top - 4, { phase: R() * 6 }));
        return;
      }
      case 'scorpion': {
        if (!G) return this.spawnFormation('solo', gold);
        const n = 1 + Math.floor(R() * (1 + this.progress));
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('scorpion', C.W + 6 + i * 60, G - 17, { phase: R() * 6, shootT: 1.2 + R() }));
        return;
      }
      case 'droneSquad': { // escadrille de 3 drones en V qui traverse l'écran sans s'arrêter
        if (this.enemies.filter(e => e.kind === 'drone').length > 3) return this.spawnFormation('v', gold);
        const baseY = top + 26 + R() * (playBottom - top - 52), id = ++this.groupSeq;
        this.groups.set(id, { left: 3, ok: true });
        for (const [dx, dy] of [[0, 0], [22, -18], [22, 18]]) {
          this.enemies.push(newEnemy('drone', C.W + 6 + dx, baseY + dy, { phase: R() * 6, speed: 68 * sp, amp: 4, holdX: -100, shootT: 1 + R() * 1.5, group: id }));
        }
        return;
      }
      case 'spiderling': {
        const n = 2 + Math.floor(R() * 2);
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('spiderling', C.W + 6 + i * 20, top + 10 + R() * (playBottom - top - 20), { phase: R() * 6, speed: (62 + R() * 18) * sp }));
        return;
      }
      case 'spider':
        if (this.enemies.filter(e => e.kind === 'spider').length >= 2) return this.spawnFormation('solo', gold);
        return void this.enemies.push(newEnemy('spider', C.W + 6, top + 16 + R() * (playBottom - top - 36), {
          phase: R() * 6, speed: 60, amp: 6, holdX: 220 + R() * 60, holdT: 5 + R() * 2, shootT: 1.2,
        }));
      case 'wasps': {
        const n = 1 + Math.floor(R() * (1.5 + this.progress));
        for (let i = 0; i < n; i++) {
          this.enemies.push(newEnemy('wasp', C.W + 6 + i * 26, top + 14 + R() * (playBottom - top - 26), {
            phase: R() * 6, speed: 80 * sp, holdX: 190 + R() * 80, holdT: 0.9 + i * 0.45,
          }));
        }
        return;
      }
      case 'mints': {
        const n = 3 + Math.floor(R() * 3);
        for (let i = 0; i < n; i++) {
          this.enemies.push(newEnemy('mint', C.W + 6 + i * 22 + R() * 30, top + 4 + R() * (playBottom - top - 10), {
            phase: R() * 6, size: 4 + Math.floor(R() * 4), speed: (this.level.scroll * 1.3 + R() * 25) * sp, vy: (R() - 0.5) * 24,
          }));
        }
        return;
      }
      case 'ants': {
        if (!G) return this.spawnFormation('solo', gold);
        const n = 1 + Math.floor(R() * 2 + this.progress);
        for (let i = 0; i < n; i++) this.enemies.push(newEnemy('ant', C.W + 6 + i * 34, G - 15, { phase: R() * 6, shootT: 1 + R() * 1.5, holdT: 0.4 + R() * 1.2 }));
        return;
      }
      case 'hanger':
        return void this.enemies.push(newEnemy('hanger', C.W + 8, 0, { phase: R() * 6, baseY: top + 26 + R() * 46, amp: 20 + R() * 22 })); // descend du plafond, parfois très bas
      default:
        return this.spawnFormation(kind, gold);
    }
  }

  // une algue (qui poussera jusqu'à « max »), au sol ou au plafond
  private placeAlgae(top: boolean, max: number, speed: number, check: boolean) {
    const kindA = Math.floor(this.rnd() * 3), probe = algaePix(max, kindA, top, 0);
    const d = { kind: 'algae' as const, pix: probe, shapes: [{ t: 'r' as const, x: 3, y: 0, w: 10, h: probe.h }] };
    const y = top ? this.top - 2 : this.floor - probe.h + 2;
    if (check && (this.obstacles.some(o => o.x > C.W - 30) || !this.passageOk(d, y))) return;
    this.place(d, y, speed);
    this.obstacles[this.obstacles.length - 1].grow = { h: check ? max * 0.4 : max, max, kind: kindA, top };
  }

  // slalom : un obstacle en haut, puis un en bas, puis en haut... il faut zigzaguer entre eux
  private slalomTop = false;
  private spawnSlalom(speed: number) {
    if (this.obstacles.some(o => o.x > C.W - 72)) return; // assez de place entre deux obstacles pour passer
    this.slalomTop = !this.slalomTop;
    const max = 56 + this.rnd() * 20; // grandes algues : elles laissent toujours un passage de l'autre côté
    if (this.slalomTop && this.phase.obstacles.herse && this.rnd() < 0.6) {
      this.place(herseDef(), this.top - 54, speed);
      this.obstacles[this.obstacles.length - 1].herse = { offset: this.rnd() * 6 };
    } else this.placeAlgae(this.slalomTop, max, speed, false);
  }

  private spawnFormation(f: C.WaveKind, gold: number, side = 0) { // side : -1 tout en haut, 1 tout en bas
    const R = this.rnd, p = this.progress;
    let pts: number[][], amp = 10 + R() * 10, wave = 0.55;
    if (f === 'line') { const n = 4 + Math.floor(R() * 3); pts = []; for (let i = 0; i < n; i++) pts.push([i * 18, 0]); amp = 14; }
    else if (f === 'v') { pts = [[0, 0], [14, -12], [14, 12], [28, -24], [28, 24]]; amp = 3; wave = 0; }
    else if (f === 'column') { pts = [[0, -27], [0, -9], [0, 9], [0, 27]]; amp = 4; wave = 0; }
    else if (f === 'swarm') { pts = []; for (let i = 0; i < 8; i++) pts.push([R() * 56, R() * 64 - 32]); amp = 8; wave = 2.1; }
    else pts = [[0, 0]];
    const ys = pts.map(q => q[1]), minY = Math.min(...ys), maxY = Math.max(...ys);
    const lo = this.top + 4 - minY + amp, hi = this.floor - 16 - maxY - amp;
    const baseY = side < 0 ? lo : side > 0 ? Math.max(lo, hi) : lo + R() * Math.max(0, hi - lo);
    const speed = (46 + R() * 14 + p * 20) * this.mode.speed;
    const id = ++this.groupSeq;
    if (pts.length > 1) this.groups.set(id, { left: pts.length, ok: true });
    pts.forEach(([dx, dy], i) => {
      const kind: EnemyKind = this.level.water ? 'fish' : this.level.fire ? 'firefly' : R() < gold ? 'flyGold' : 'fly';
      this.enemies.push(newEnemy(kind, C.W + 6 + dx, baseY + dy, { phase: i * wave + (f === 'swarm' ? R() * 6 : 0), speed, amp, group: id }));
    });
  }

  private spawnBonus(x: number, y: number, speed: number, kind?: BonusKind) {
    kind = kind ?? pickWeighted(C.BONUS_WEIGHTS, this.rnd) as BonusKind;
    this.bonuses.push({ kind, x, y, baseY: y, speed, t: this.rnd() * 6, dead: false });
  }

  // ---------- mise à jour ----------
  private updateEnemies(dt: number) {
    const h = this.hero, hb = this.heroBox(), p = this.progress, m = this.mode, cleared = this.state === 'cleared';
    for (const e of this.enemies) {
      if (!e.tough) { e.tough = true; e.hp = Math.max(1, Math.round(e.hp * (m.hp ?? 1))); } // plus résistants selon le mode
      e.flash = Math.max(0, e.flash - dt);
      switch (e.kind) {
        case 'fly': case 'flyGold': case 'fish': case 'firefly':
          e.x -= e.speed * dt * (cleared ? 2 : 1);
          e.y = e.baseY + Math.sin(this.t * 2.6 + e.phase) * e.amp;
          break;
        case 'spider':
          if (e.x > e.holdX && e.holdT > 0) e.x -= e.speed * dt;
          else {
            e.holdT -= dt;
            if (e.holdT <= 0) e.x -= 75 * dt;
            e.shootT -= dt;
            if (e.shootT <= 0 && e.holdT > 0 && this.canAim(e)) {
              e.shootT = lerp(2.7, 1.6, p) / m.enemyFire;
              this.aimShot('web', e.x + 2, e.y + 6, (64 + 24 * p) * m.speed);
            }
          }
          e.y = e.baseY + Math.sin(this.t * 1.5 + e.phase) * e.amp;
          break;
        case 'wasp':
          if (e.stage === 0) { e.x -= e.speed * dt; e.y = e.baseY + Math.sin(this.t * 3 + e.phase) * 4; if (e.x <= e.holdX) e.stage = 1; }
          else if (e.stage === 1) {
            e.holdT -= dt; e.y += Math.sin(this.t * 20) * 0.3;
            if (e.holdT <= 0 || cleared) { // vise le chat et fonce
              const tx = h.x + 20, ty = h.y + 16, d = Math.hypot(tx - e.x, ty - e.y) || 1, v = 125 * m.speed;
              e.vx = (tx - e.x) / d * v; e.vy = (ty - e.y) / d * v; e.stage = 2;
              if (e.vx > -40) e.vx = -40;
              this.sfx.play('dive');
            }
          } else { e.x += e.vx * dt; e.y += e.vy * dt; }
          break;
        case 'mint':
          e.x -= e.speed * dt; e.y += e.vy * dt;
          if ((e.y < this.top && e.vy < 0) || (e.y > this.floor - e.size * 2 - 4 && e.vy > 0)) e.vy = -e.vy;
          break;
        case 'ant': {
          e.x -= (this.level.scroll + 12) * dt;
          // petits bonds, et un grand saut quand le chat vole bas juste devant
          e.holdT -= dt;
          if (e.vy !== 0 || e.y < e.baseY) {
            e.vy += 330 * dt; e.y += e.vy * dt;
            if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; }
          } else if (e.holdT <= 0) {
            const near = e.x > h.x + 30 && e.x - h.x < 120 && h.y + 30 > this.floor - 75;
            e.vy = near ? -175 : -95; e.holdT = 1.1 + this.rnd() * 1.3;
            if (near) this.sfx.play('hop');
          }
          e.shootT -= dt;
          if (e.shootT <= 0 && e.stage < (p > 0.5 ? 2 : 1) && this.canAim(e) && e.x < C.W - 20) {
            e.shootT = 3.2 / m.enemyFire; e.stage++; // un ou deux lancers par fourmi
            this.lobSugar(e.x + 9, e.y + 1);
          }
          break;
        }
        case 'hanger':
          e.x -= this.level.scroll * dt;
          e.y = e.baseY + Math.sin(this.t * 1.1 + e.phase) * e.amp;
          break;
        case 'drone': // comme l'araignée, mais tire des rafales ; en escadrille, il traverse sans s'arrêter
          if (e.holdX < 0) {
            e.x -= e.speed * dt; e.shootT -= dt;
            if (e.shootT <= 0 && this.canAim(e)) { this.aimShot('bullet', e.x + 4, e.y + 10, (66 + 16 * p) * m.speed); e.shootT = 3.2 / m.enemyFire; }
          } else if (e.x > e.holdX && e.holdT > 0) e.x -= e.speed * dt;
          else {
            e.holdT -= dt;
            if (e.holdT <= 0) e.x -= 80 * dt;
            e.shootT -= dt;
            if (e.shootT <= 0 && e.holdT > 0 && this.canAim(e)) {
              this.aimShot('bullet', e.x + 4, e.y + 10, (72 + 18 * p) * m.speed);
              e.stage++;
              if (e.stage < 2) e.shootT = 0.25; else { e.stage = 0; e.shootT = lerp(2.8, 2.0, p) / m.enemyFire; }
            }
          }
          e.y = e.baseY + Math.sin(this.t * 1.7 + e.phase) * e.amp;
          break;
        case 'turret':
          e.x -= this.level.scroll * dt;
          e.shootT -= dt;
          if (e.shootT <= 0 && this.canAim(e) && e.x < C.W - 10) {
            e.shootT = (3 + this.rnd() * 1.2) / m.enemyFire;
            this.aimShot('bullet', e.x + 3, e.y + 2, (70 + 18 * p) * m.speed);
          }
          break;
        case 'crab': { // marche au fond, saute, lance des maracas qui rebondissent
          e.x -= (this.level.scroll + 8) * dt;
          e.holdT -= dt;
          if (e.vy !== 0 || e.y < e.baseY) {
            e.vy += 330 * dt; e.y += e.vy * dt;
            if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; }
          } else if (e.holdT <= 0) {
            const near = e.x > h.x + 30 && e.x - h.x < 120 && h.y + 30 > this.floor - 80;
            e.vy = near ? -160 : -105; e.holdT = 1.4 + this.rnd() * 1.2;
            this.sfx.play('hop');
          }
          e.shootT -= dt;
          if (e.shootT <= 0 && this.canAim(e) && e.x < C.W - 20) {
            e.shootT = 4.2 / m.enemyFire;
            const [hx, hy] = this.heroCenter(), g = 120, T = 1.45, sx = e.x + 4, sy = e.y;
            this.eshots.push({ kind: 'maraca', x: sx, y: sy, vx: (hx - sx + (this.rnd() - 0.5) * 50) / T, vy: (hy - sy - 0.5 * g * T * T) / T, g, dead: false, bounces: 2 });
            this.sfx.play('throw');
          }
          break;
        }
        case 'jellyBlue': case 'jellyPink': { // monte et descend lentement, lance du jus de fraise
          if (e.x > e.holdX && e.holdT > 0) e.x -= e.speed * dt;
          else {
            e.holdT -= dt;
            if (e.holdT <= 0) e.x -= 60 * dt;
            e.shootT -= dt;
            if (e.shootT <= 0 && e.holdT > 0 && this.canAim(e)) {
              const pink = e.kind === 'jellyPink';
              e.shootT = (pink ? 3.2 : 2.8) / m.enemyFire;
              this.fanJuice(e.x + 4, e.y + 12, pink ? [-18, 0, 18] : [0], (58 + 14 * p) * m.speed);
            }
          }
          e.y = e.baseY + Math.sin(this.t * (e.kind === 'jellyPink' ? 1.4 : 0.9) + e.phase) * e.amp;
          break;
        }
        case 'miniSkel': { // fonce vers la gauche en se rapprochant de la hauteur du chat
          e.x -= e.speed * dt;
          const dy = h.y + 12 - e.y;
          e.y += Math.max(-12 * dt, Math.min(12 * dt, dy)) + Math.sin(this.t * 5 + e.phase) * 0.4;
          break;
        }
        case 'sleepBubble': // monte doucement en ondulant
          e.x -= (e.vx < 0 ? -e.vx : this.level.scroll * 0.6) * dt; e.y -= e.speed * dt; e.x += Math.sin(this.t * 2 + e.phase) * 0.3;
          if (e.y < this.top - 10) this.removeEnemy(e, false);
          break;
        case 'hangShrimp': // accrochée au plafond ; se laisse tomber quand le chat passe dessous
          if (e.stage === 0) {
            e.x -= this.level.scroll * dt;
            if (e.x - (h.x + 20) < 90 && e.x > h.x && this.state === 'play') { e.stage = 1; e.vy = 10; e.vx = -40; this.sfx.play('dive'); } // elle tombe devant le chat
          } else if (e.stage === 1) {
            e.vy += 110 * dt; e.x += e.vx * dt; e.y += e.vy * dt;
            if (e.y > e.baseY + 60) { e.stage = 2; e.baseY = e.y; }
          } else { e.x -= 75 * dt; e.y = e.baseY + Math.sin(this.t * 2.4 + e.phase) * 14; }
          break;
        case 'batShrimp': // vole en grandes vagues
          e.x -= e.speed * dt * (cleared ? 2 : 1);
          e.y = e.baseY + Math.sin(this.t * 2.2 + e.phase) * e.amp;
          break;
        case 'comet':
          e.x += e.vx * dt; e.y += e.vy * dt;
          break;
        case 'salamander': { // marche au sol, saute, crache des gouttes de feu en cloche
          e.x -= (this.level.scroll + 14) * dt;
          e.holdT -= dt;
          if (e.vy !== 0 || e.y < e.baseY) { e.vy += 330 * dt; e.y += e.vy * dt; if (e.y >= e.baseY) { e.y = e.baseY; e.vy = 0; } }
          else if (e.holdT <= 0) { const near = e.x > h.x + 30 && e.x - h.x < 120 && h.y + 30 > this.floor - 75; e.vy = near ? -170 : -90; e.holdT = 1 + this.rnd() * 1.2; }
          e.shootT -= dt;
          if (e.shootT <= 0 && e.stage < 2 && this.canAim(e) && e.x < C.W - 20) { e.shootT = 3.0 / m.enemyFire; e.stage++; this.lobSugar(e.x + 3, e.y + 4, 'drop'); } // 2 crachats au plus
          break;
        }
        case 'magmaSnake': { // bulles (stage 0), puis saut en arc (stage 1)
          e.holdX -= this.level.scroll * dt;
          if (e.stage === 0) { e.vx -= dt; e.x = e.holdX; e.y = C.H + 10; if (e.vx <= 0) { e.stage = 1; e.vy = 0; this.sfx.play('splash'); } }
          else {
            e.vy += dt / C.MAGMA.leap;
            if (e.vy >= 1) { this.removeEnemy(e, false); continue; }
            e.x = e.holdX - e.vy * e.amp - 7; e.y = e.baseY - Math.sin(e.vy * Math.PI) * e.speed - 6;
          }
          break;
        }
        case 'miniScorp': { // va se placer (stage 0), s'arrête et vise (stage 1), puis fonce (stage 2)
          if (e.stage === 0) {
            const dx = e.holdX - e.x, dy = e.amp - e.y, d = Math.hypot(dx, dy);
            if (d < 3 || cleared) e.stage = 1;
            else { const v = Math.min(d / dt, 120 * m.speed); e.x += dx / d * v * dt; e.y += dy / d * v * dt; }
          } else if (e.stage === 1) {
            e.holdT -= dt; e.y += Math.sin(this.t * 24) * 0.3;
            if (e.holdT <= 0) {
              const tx = h.x + 20, ty = h.y + 16, d = Math.hypot(tx - e.x, ty - e.y) || 1, v = 100 * m.speed;
              e.vx = (tx - e.x) / d * v; e.vy = (ty - e.y) / d * v; e.stage = 2; this.sfx.play('dive');
            }
          } else { e.x += e.vx * dt; e.y += e.vy * dt; }
          break;
        }
        case 'phoenix':
          if (e.stage === 1) { // des cendres : il renaît si on ne tire pas dessus
            e.x -= this.level.scroll * 0.5 * dt; e.holdT -= dt;
            if (e.holdT <= 0) {
              e.stage = 2; e.hp = Math.max(1, Math.round(C.ENEMIES.phoenix.hp * (m.hp ?? 1)));
              this.burst(e.x + 8, e.y + 12, 14, [FC.P.y, FC.P.o, FC.P.r], 60); this.sfx.play('respawn');
            }
          } else { e.x -= e.speed * dt; e.y = e.baseY + Math.sin(this.t * 2.4 + e.phase) * e.amp; }
          break;
        case 'golem':
          e.x -= e.speed * dt;
          break;
        case 'sorbet': // s'arrête, flotte et lance des boules de sorbet qui ralentissent
          if (e.x > e.holdX && e.holdT > 0) e.x -= e.speed * dt;
          else {
            e.holdT -= dt;
            if (e.holdT <= 0) e.x -= 70 * dt;
            e.shootT -= dt;
            if (e.shootT <= 0 && e.holdT > 0 && this.canAim(e)) {
              e.shootT = lerp(3.0, 2.3, p) / m.enemyFire;
              this.aimShot('sorbet', e.x + 2, e.y + 10, 64 * m.speed);
            }
          }
          e.y = e.baseY + Math.sin(this.t * 1.6 + e.phase) * e.amp;
          break;
        case 'scout': // en formation, puis plonge vers le chat
          if (e.stage === 0) {
            e.x -= e.speed * dt; e.y = e.baseY + Math.sin(this.t * 3 + e.phase) * 3;
            if (e.x <= e.holdX || cleared) {
              const ty = h.y + 16, d = Math.hypot(h.x + 20 - e.x, ty - e.y) || 1, v = 110 * m.speed;
              e.vx = Math.min(-60, (h.x + 20 - e.x) / d * v); e.vy = (ty - e.y) / d * v; e.stage = 1; this.sfx.play('dive');
            }
          } else { e.x += e.vx * dt; e.y += e.vy * dt; }
          break;
        case 'emberBat': // en nuée, grandes vagues rapides
          e.x -= e.speed * dt * (cleared ? 2 : 1);
          e.y = e.baseY + Math.sin(this.t * 3.4 + e.phase) * e.amp;
          break;
        case 'dragonet': { // s'arrête ; fumée pour prévenir (stage 2), puis jet de feu (stage 3)
          if (e.stage === 0) { e.x -= e.speed * dt; if (e.x <= e.holdX) e.stage = 1; }
          else {
            e.holdT -= dt;
            if (e.holdT <= 0 && e.stage === 1) e.x -= 70 * dt;
            if (e.stage === 1) { e.shootT -= dt; if (e.shootT <= 0 && e.holdT > 0) { e.stage = 2; e.vx = C.DRAGONET.warn; this.sfx.play('charge'); } }
            else {
              e.vx -= dt;
              if (e.stage === 2 && e.vx <= 0) { e.stage = 3; e.vx = C.DRAGONET.fire; this.sfx.play('laser'); }
              else if (e.stage === 3 && e.vx <= 0) { e.stage = 1; e.shootT = C.DRAGONET.every / m.enemyFire; }
            }
          }
          e.y = e.baseY + Math.sin(this.t * 2 + e.phase) * e.amp;
          if (e.stage === 3 && this.heroAlive() && h.inv <= 0 && overlap(hb, dragonetJet(e))) this.hurt(C.DAMAGE.web, 'souffle de feu');
          break;
        }
        case 'guitarFish': // s'arrête, ondule et lance des notes de feu
          if (e.x > e.holdX && e.holdT > 0) e.x -= e.speed * dt;
          else {
            e.holdT -= dt;
            if (e.holdT <= 0) e.x -= 70 * dt;
            e.shootT -= dt;
            if (e.shootT <= 0 && e.holdT > 0 && this.canAim(e)) {
              e.shootT = lerp(2.8, 2.0, p) / m.enemyFire;
              const [hx, hy] = this.heroCenter(), sx = e.x, sy = e.y + 4, d = Math.hypot(hx - sx, hy - sy) || 1, v = 60 * m.speed;
              this.eshots.push({ kind: 'note', x: sx, y: sy, vx: (hx - sx) / d * v, vy: (hy - sy) / d * v, g: 0, dead: false, age: 0 });
              this.sfx.play('note');
            }
          }
          e.y = e.baseY + Math.sin(this.t * 1.8 + e.phase) * e.amp;
          break;
        case 'scorpion': // marche au sol, sa queue tire 3 balles en éventail
          e.x -= (this.level.scroll + 10) * dt;
          e.shootT -= dt;
          if (e.shootT <= 0 && this.canAim(e) && e.x < C.W - 10) {
            e.shootT = 3.6 / m.enemyFire;
            this.fan('bullet', e.x + 14, e.y + 3, [-16, 0, 16], (58 + 14 * p) * m.speed);
          }
          break;
        case 'spiderling': { // fonce vers le chat en corrigeant sa hauteur
          e.x -= e.speed * dt;
          const ty = h.y + 12;
          e.y += Math.max(-38 * dt, Math.min(38 * dt, ty - e.y));
          break;
        }
      }
      if (e.x < -32 || e.x > C.W + 220 || e.y < -40 || e.y > C.H + 40) { this.removeEnemy(e, false); continue; }
      // contact avec le chat
      if (!e.dead && this.heroAlive() && h.inv <= 0 && !(e.kind === 'phoenix' && e.stage === 1) && !(e.kind === 'magmaSnake' && e.stage === 0) && overlap(hb, enemyBox(e))) {
        if (e.kind === 'sleepBubble') { // la bulle éclate et le chat s'endort, sans perdre de cœur
          this.killEnemy(e, false, false); h.sleep = C.SLEEP_TIME; this.hitLog['bulle soporifique'] = (this.hitLog['bulle soporifique'] || 0) + 1;
          this.sfx.play('yawn'); continue;
        }
        this.killEnemy(e, false);
        this.hurt(C.DAMAGE.enemy, 'contact ' + e.kind);
      }
    }
    this.enemies = this.enemies.filter(e => !e.dead);
  }

  private canAim(e: Enemy) { return this.heroAlive() && this.state === 'play' && e.x > this.hero.x + 40; }

  private aimShot(kind: 'web' | 'bullet' | 'sorbet', sx: number, sy: number, v: number) {
    const h = this.hero, tx = h.x + 20, ty = h.y + 16, d = Math.hypot(tx - sx, ty - sy) || 1;
    this.eshots.push({ kind, x: sx, y: sy, vx: (tx - sx) / d * v, vy: (ty - sy) / d * v, g: 0, dead: false });
    this.sfx.play(kind === 'web' ? 'web' : 'pew');
  }

  // plusieurs tirs en éventail vers le chat
  private fan(kind: 'web' | 'bullet', x: number, y: number, degs: number[], v: number) {
    const [hx, hy] = this.heroCenter(), base = Math.atan2(hy - y, hx - x);
    for (const d of degs) {
      const a = base + d * Math.PI / 180;
      this.eshots.push({ kind, x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, dead: false });
    }
    this.sfx.play(kind === 'web' ? 'web' : 'pew');
  }

  // jus de fraise des méduses (un seul jet, ou trois en éventail)
  private fanJuice(x: number, y: number, degs: number[], v: number) {
    const [hx, hy] = this.heroCenter(), base = Math.atan2(hy - y, hx - x);
    for (const d of degs) {
      const a = base + d * Math.PI / 180;
      this.eshots.push({ kind: 'juice', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, dead: false });
    }
    this.sfx.play('splash');
  }

  // un morceau de sucre lancé en cloche vers le chat
  private lobSugar(sx: number, sy: number, kind: 'sugar' | 'drop' = 'sugar') {
    const fire = kind === 'drop', h = this.hero, g = 110, T = fire ? 1.8 : 1.5; // les gouttes de feu sont plus lentes et moins précises
    const tx = h.x + 20 + (this.rnd() - 0.5) * (fire ? 60 : 36), ty = h.y + 16 + (this.rnd() - 0.5) * (fire ? 40 : 24);
    this.eshots.push({ kind, x: sx, y: sy, vx: (tx - sx) / T, vy: (ty - sy - 0.5 * g * T * T) / T, g, dead: false });
    this.sfx.play('throw');
  }

  private updateEShots(dt: number) {
    const h = this.hero, hb = this.heroBox();
    for (const s of this.eshots) {
      s.vy += s.g * dt; s.x += s.vx * dt; s.y += s.vy * dt;
      if (s.kind === 'note') { s.age = (s.age || 0) + dt; s.y += Math.cos(s.age * 7) * 34 * dt; } // la note ondule
      if (s.kind === 'maraca' && s.y > this.floor - 10 && s.vy > 0 && (s.bounces ?? 0) > 0) { // les maracas rebondissent
        s.y = this.floor - 10; s.vy = -s.vy * 0.5; s.bounces = (s.bounces ?? 0) - 1; this.sfx.play('bounce');
      }
      if (s.x < -12 || s.x > C.W + 12 || s.y < -40 || s.y > this.floor) s.dead = true;
      const b = s.kind === 'web' ? { x: s.x + 2, y: s.y + 2, w: 7, h: 7 } : s.kind === 'bullet' ? { x: s.x, y: s.y, w: 3, h: 3 }
        : s.kind === 'note' ? { x: s.x + 2, y: s.y + 2, w: 8, h: 10 } : s.kind === 'juice' ? { x: s.x + 1, y: s.y, w: 7, h: 5 }
          : s.kind === 'maraca' ? { x: s.x + 1, y: s.y + 1, w: 6, h: 9 } : s.kind === 'bone' ? { x: s.x + 2, y: s.y + 1, w: 7, h: 5 }
            : s.kind === 'sorbet' ? { x: s.x + 1, y: s.y + 1, w: 6, h: 6 } : s.kind === 'ember' ? { x: s.x, y: s.y, w: 4, h: 4 }
              : s.kind === 'drop' ? { x: s.x + 1, y: s.y + 1, w: 4, h: 5 } : s.kind === 'fireball' ? { x: s.x + 3, y: s.y + 3, w: 10, h: 10 } : { x: s.x, y: s.y, w: 5, h: 5 };
      if (!s.dead && this.heroAlive() && h.inv <= 0 && overlap(hb, b)) {
        s.dead = true;
        if (s.kind === 'web' || s.kind === 'sorbet') h.slow = C.WEB_SLOW.time; // la toile et le sorbet ralentissent
        this.hurt(s.kind === 'juice' ? C.DAMAGE.juice : C.DAMAGE.shot, 'tir ' + s.kind);
      }
    }
    this.eshots = this.eshots.filter(s => !s.dead);
  }

  private updateShots(dt: number) {
    const bottom = this.floor, born: Shot[] = []; // born : les éclats de Piñata créés pendant cette image
    for (const s of this.shots) {
      s.x += s.vx * dt; s.y += s.vy * dt; s.life -= dt; s.age += dt;
      if (s.life <= 0 || s.x > C.W + 10 || s.x < -20 || s.y < -20 || s.y > bottom + 4) {
        s.dead = true;
        if (s.kind === 'pinata' && s.life <= 0 && s.x < C.W) this.pinataBurst(s, null, born); // éclate au bout de sa course
        continue;
      }
      // les dragibus rebondissent sur le haut, le bas et le sol
      if (s.kind === 'drag' && s.bounces > 0 && ((s.y < C.HUD_H + 1 && s.vy < 0) || (s.y > bottom - 8 && s.vy > 0))) {
        s.vy = -s.vy; s.bounces--; this.sfx.play('bounce');
      }
      const sb = shotBox(s);
      for (const e of this.enemies) {
        if (e.dead || s.hit.includes(e) || !overlap(sb, enemyBox(e))) continue;
        e.hp -= s.dmg; e.flash = 0.08;
        if (!s.touched && s.kind !== 'shard') { s.touched = true; this.stats.hitShots++; }
        if (s.kind === 'jaw' || s.kind === 'rain') s.hit.push(e); else s.dead = true;
        if (s.kind === 'pinata') this.pinataBurst(s, e, born);
        if (e.hp <= 0) this.killEnemy(e, true, true, s); else this.sfx.play('hit');
        if (s.dead) break;
      }
      for (const e of this.eshots) { // un tir détruit les morceaux de sucre
        if (e.dead || (e.kind !== 'sugar' && e.kind !== 'maraca' && e.kind !== 'drop') || !overlap(sb, { x: e.x - 1, y: e.y - 1, w: 7, h: 7 })) continue;
        e.dead = true; this.score += 10; this.burst(e.x + 2, e.y + 2, 6, [FC.P.W, FC.P.v], 40);
        if (s.kind === 'verm' || s.kind === 'drag' || s.kind === 'shard') s.dead = true;
        if (s.kind === 'pinata') { s.dead = true; this.pinataBurst(s, null, born); }
      }
      if (!s.dead && this.boss) this.shotVsBoss(s, sb, born);
      if (s.dead || s.kind === 'rain') continue; // l'arc-en-ciel traverse les obstacles
      for (const o of this.obstacles) {
        if (o.dead || o.kind === 'cable') continue; // les tirs passent à côté des câbles
        const shape = hitObstacle(o, sb);
        if (!shape) continue;
        if (s.kind === 'jaw') { s.dead = true; this.breakObstacle(o); }
        else if (s.kind === 'drag' && s.bounces > 0 && o.kind !== 'web') this.bounceOff(s, sb, o, shape);
        else if (s.kind === 'pinata') { s.dead = true; this.pinataBurst(s, null, born); }
        else { s.dead = true; this.burst(s.x + 2, s.y + 1, 3, [[255, 255, 255, 255]], 30); }
        break;
      }
    }
    this.shots = this.shots.filter(s => !s.dead).concat(born);
  }

  // la Piñata éclate : des petits bonbons partent en étoile (sauf vers le monstre déjà touché)
  private pinataBurst(s: Shot, touched: Enemy | null, out: Shot[]) {
    const PI = C.WEAPONS.pinata, b = shotBox(s), cx = b.x + b.w / 2, cy = b.y + b.h / 2;
    for (let i = 0; i < PI.shards; i++) {
      const a = i / PI.shards * Math.PI * 2 + this.rnd() * 0.4;
      out.push({
        kind: 'shard', x: cx - 2, y: cy - 2, vx: Math.cos(a) * PI.shardSpeed, vy: Math.sin(a) * PI.shardSpeed,
        dmg: PI.shardDmg, life: PI.shardLife, age: 0, frame: i, bounces: 0, hit: touched ? [touched] : [], dead: false, src: s.src,
      });
    }
    this.burst(cx, cy, 14, [FC.P.P, FC.P.W, FC.P.y, FC.P.q], 60);
    this.sfx.play('pop');
  }

  // rebond d'un dragibus sur un obstacle
  private bounceOff(s: Shot, sb: Box, o: Obstacle, shape: Shape) {
    const px = sb.x + sb.w / 2, py = sb.y + sb.h / 2;
    let nx: number, ny: number;
    if (shape.t === 'e') {
      const [cx, cy] = shapeCenter(o, shape);
      nx = (px - cx) / (shape.rx * shape.rx); ny = (py - cy) / (shape.ry * shape.ry);
    } else {
      const inX = px > o.x + shape.x && px < o.x + shape.x + shape.w;
      nx = inX ? 0 : (px < o.x + shape.x ? -1 : 1); ny = inX ? (py < o.y + shape.y ? -1 : 1) : 0;
    }
    const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n;
    const dot = s.vx * nx + s.vy * ny;
    if (dot < 0) { s.vx -= 2 * dot * nx; s.vy -= 2 * dot * ny; }
    s.x += nx * 3; s.y += ny * 3;
    s.bounces--;
    this.sfx.play('bounce');
  }

  private updateObstacles(dt: number) {
    const h = this.hero, hb = this.heroBox();
    for (const o of this.obstacles) {
      o.x -= o.speed * dt;
      if (o.x + o.pix.w < -4) o.dead = true;
      if (o.grow) { // l'algue pousse dès qu'elle entre dans l'écran
        const g = o.grow;
        if (o.x < C.W - 10) g.h = Math.min(g.max, g.h + C.ALGAE.grow * dt);
        o.pix = algaePix(g.h, g.kind, g.top, Math.floor(this.t * 3 + g.kind) % 4);
        o.y = g.top ? this.top - 2 : this.floor - o.pix.h + 2;
        o.shapes = [{ t: 'r', x: 3, y: g.top ? 0 : 3, w: 10, h: o.pix.h - 3 }]; // toute la largeur de l'algue
      }
      if (o.herse) o.y = this.top - 64 + 40 + Math.sin((this.t + o.herse.offset) * 1.0) * 30; // la herse monte et descend
      if (o.tree) o.pix = FC.fireTree(o.tree.h, o.tree.seed, Math.floor(this.t * 6) % 4); // les flammes dansent
      if (o.liana) {
        const L = o.liana;
        if (L.drop) { if (o.x < L.at || L.vy > 0) { L.vy += 160 * dt; o.y += L.vy * dt; if (o.y > C.H) o.dead = true; } } // elle se détache et tombe
        else L.len = L.min + (L.max - L.min) * (0.5 + 0.5 * Math.sin(this.t * 0.9 + L.ph)); // elle s'allonge et rétrécit
        o.pix = FC.liana(L.len, Math.floor(this.t * 4), L.seed);
        o.shapes = [{ t: 'r', x: 3, y: 0, w: 8, h: L.len + 3 }];
      }
      if (o.dead || !this.heroAlive() || h.ghost > 0) continue;
      if (o.jet && h.inv <= 0 && jetState(o, this.t) === 'on' && jetCircles(o).some(([cx, cy, r]) => boxEllipse(hb, cx, cy, r, r))) {
        this.flash = 0.2; this.flashColor = [255, 120, 200, 255];
        this.hurt(C.DAMAGE.web, 'paillettes');
        continue;
      }
      if (o.elec && h.inv <= 0 && elecOn(o, this.t) && overlap(hb, { x: o.x + o.elec.x, y: o.y + o.elec.y, w: o.elec.w, h: o.elec.h })) {
        this.flash = 0.2; this.flashColor = [255, 230, 80, 255];
        this.hurt(C.DAMAGE.web, 'électricité');
        continue;
      }
      if (o.lava) { // la coulée brûle seulement quand elle coule
        const lb = lavaBox(o, this.t, this.top, this.floor);
        if (lb && h.inv <= 0 && overlap(hb, lb)) { this.flash = 0.2; this.flashColor = [255, 140, 40, 255]; this.hurt(C.DAMAGE.obstacle, 'coulée de lave'); }
        continue;
      }
      if (!hitObstacle(o, hb)) continue;
      if (o.kind === 'cable') {
        if (h.inv > 0) continue;
        // le chat est repoussé du côté où il est arrivé
        const [, cy] = cablePoint(o, Math.max(0, Math.min(1, (h.x + 20 - o.x - 2) / (o.pix.w - 4))));
        h.y = Math.max(this.top - 4, Math.min(this.floor - 30, h.y + (h.y + 17 < cy ? -14 : 14)));
        this.flash = 0.2; this.flashColor = [255, 230, 80, 255];
        this.hurt(C.DAMAGE.web, 'câble électrique');
        continue;
      }
      if (o.kind === 'web') { // la toile colle le chat, puis se déchire
        if (h.inv > 0) continue;
        h.slow = C.BIG_WEB_SLOW;
        this.tear(o);
        this.hurt(C.DAMAGE.web, 'toile géante');
      } else if (h.inv <= 0) {
        h.x = Math.max(0, h.x - 10);
        this.hurt(o.kind === 'fence' || o.kind === 'herse' || o.kind === 'algae' || o.kind === 'coral' || o.kind === 'liana' ? C.DAMAGE.web : C.DAMAGE.obstacle, 'obstacle ' + o.kind);
      }
    }
    this.obstacles = this.obstacles.filter(o => !o.dead);
  }

  private updateBonuses(dt: number) {
    const hb = this.heroBox();
    for (const b of this.bonuses) {
      b.t += dt; b.x -= b.speed * dt; b.y = b.baseY + Math.sin(b.t * 3) * 3;
      if (b.x < -20) b.dead = true;
      if (!b.dead && this.heroAlive() && overlap(hb, { x: b.x + 2, y: b.y + 2, w: 12, h: 12 })) { b.dead = true; this.take(b); }
    }
    this.bonuses = this.bonuses.filter(b => !b.dead);
  }

  private updateFx(dt: number) {
    for (const p of this.parts) { p.life -= dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vy += p.g * dt; }
    this.parts = this.parts.filter(p => p.life > 0);
    for (const p of this.popups) p.t += dt;
    this.popups = this.popups.filter(p => p.t < 1);
  }

  // ---------- événements ----------
  private take(b: Bonus) {
    const h = this.hero, W = C.WEAPONS;
    this.score += C.POINTS.bonus;
    this.stats.bonuses++; this.events.push({ type: 'bonus' });
    let label = '';
    switch (b.kind) {
      case 'verm': h.ammo.verm = Math.min(W.verm.max, h.ammo.verm + W.verm.pickup); label = '+' + W.verm.pickup + ' VERMICELLES'; break;
      case 'drag': h.ammo.drag = Math.min(W.drag.max, h.ammo.drag + W.drag.pickup); label = '+' + W.drag.pickup + ' DRAGIBUS'; break;
      case 'pinata': h.ammo.pinata = Math.min(W.pinata.max, h.ammo.pinata + W.pinata.pickup); label = '+' + W.pinata.pickup + ' PIÑATAS'; break;
      case 'jaw': h.ammo.jaw = Math.min(W.jaw.max, h.ammo.jaw + W.jaw.pickup); label = '+1 CASSE-DENTS'; break;
      case 'heart': h.energy = h.energyMax; label = 'ÉNERGIE'; break;
      case 'life': h.lives = Math.min(C.LIVES_MAX, h.lives + 1); label = '1UP'; break;
      case 'ghost': h.ghost = C.GHOST_TIME; label = 'FANTÔME'; break;
      case 'bomb': this.bomb(); label = 'CHANTILLY !'; break;
    }
    this.popups.push({ text: label, x: Math.max(2, Math.min(b.x - 4, C.W - FC.textWidth(label) - 2)), y: b.y - 4, t: 0 });
    this.sfx.play(b.kind === 'bomb' ? 'bomb' : 'pickup');
  }

  private bomb() {
    for (const e of this.enemies) this.killEnemy(e, true, false);
    this.eshots = [];
    this.flash = 0.3; this.flashColor = [255, 255, 255, 255];
  }

  // un ennemi disparaît : tué par le joueur (scored) ou non
  private removeEnemy(e: Enemy, scored: boolean) {
    if (e.dead) return;
    e.dead = true;
    const g = this.groups.get(e.group);
    if (!g) return;
    g.left--; if (!scored) g.ok = false;
    if (g.left <= 0) {
      this.groups.delete(e.group);
      if (g.ok) {
        this.score += C.POINTS.wave;
        this.popups.push({ text: 'VAGUE +' + C.POINTS.wave, x: Math.max(2, Math.min(e.x, C.W - 50)), y: e.y - 10, t: 0 });
        this.sfx.play('wave');
        this.events.push({ type: 'wave' });
      }
    }
  }

  private killEnemy(e: Enemy, scored: boolean, sound = true, by?: Shot) {
    if (e.dead) return;
    if (e.kind === 'phoenix' && e.stage === 0 && scored) { // il tombe en cendres... et renaîtra si on ne tire pas dessus
      e.stage = 1; e.hp = 2; e.holdT = 2.6;
      this.burst(e.x + 8, e.y + 10, 12, [FC.P.o, FC.P.r, [90, 80, 96, 255]], 50); this.sfx.play('kill');
      return;
    }
    if (scored) {
      this.stats.kills++;
      this.events.push({ type: 'kill', kind: e.kind, by: by?.kind });
      if (by && by.src && (by.kind === 'pinata' || by.kind === 'shard')) { // combien d'ennemis pour une même Piñata ?
        const n = (this.pinataKills.get(by.src) || 0) + 1;
        this.pinataKills.set(by.src, n);
        if (n === 5) this.events.push({ type: 'pinata5' });
      }
    }
    const [cx, cy] = enemyCenter(e);
    if (e.kind === 'emberBat') for (let k = 0; k < 3; k++) { // elle éclate en 3 étincelles qui tombent
      this.eshots.push({ kind: 'ember', x: cx - 2, y: cy - 2, vx: (k - 1) * 22 - 10, vy: -40 - this.rnd() * 20, g: 140, dead: false });
    }
    const colors = e.kind === 'flyGold' || e.kind === 'wasp' ? [FC.P.y, FC.P.Y, FC.P.W] : e.kind === 'mint' ? [FC.P.r, FC.P.W] : FC.SPRINKLES;
    this.burst(cx, cy, e.kind === 'spider' || e.kind === 'hanger' ? 18 : 10, colors, 60);
    if (sound) this.sfx.play('kill');
    if (scored) {
      const E = C.ENEMIES[e.kind];
      this.score += E.points;
      this.popups.push({ text: '+' + E.points, x: cx - 8, y: cy - 8, t: 0 });
      if (this.rnd() < E.drop) this.spawnBonus(cx - 8, Math.min(cy - 8, this.floor - 24), this.level.scroll * 0.6);
    }
    this.removeEnemy(e, scored);
  }

  private tear(o: Obstacle) {
    o.dead = true;
    const [cx, cy] = shapeCenter(o);
    this.burst(cx, cy, 24, [FC.P.s, FC.P.W], 70, 60);
    this.sfx.play('tear');
  }

  private breakObstacle(o: Obstacle) {
    this.events.push({ type: 'break' });
    if (o.kind === 'web') { this.tear(o); this.score += C.POINTS.planet; return; }
    o.dead = true;
    const [cx, cy] = shapeCenter(o), J = C.WEAPONS.jaw;
    this.burst(cx, cy, 40, [FC.P.P, FC.P.q, FC.P.d, FC.P.D, FC.P.y, FC.P.W], 80, 90);
    this.score += C.POINTS.planet;
    this.popups.push({ text: '+' + C.POINTS.planet, x: cx - 8, y: cy - 6, t: 0 });
    this.flash = 0.12; this.flashColor = [255, 255, 255, 255];
    this.sfx.play('break');
    // les éclats blessent les ennemis proches
    for (const e of this.enemies) {
      const [ex, ey] = enemyCenter(e);
      if (e.dead || Math.hypot(ex - cx, ey - cy) > J.blast + 12) continue;
      e.hp -= J.blastDmg; e.flash = 0.1;
      if (e.hp <= 0) this.killEnemy(e, true, false);
    }
  }

  private hurt(n: number, cause: string) {
    const h = this.hero;
    if (h.inv > 0 || h.dead > 0 || this.state !== 'play') return;
    this.hitLog[cause] = (this.hitLog[cause] || 0) + 1;
    h.energy -= n; h.inv = C.INVINCIBLE_AFTER_HIT; this.hits++;
    this.flash = 0.15; this.flashColor = [255, 40, 80, 255];
    if (h.energy <= 0) this.loseLife(); else this.sfx.play('hurt');
  }

  private loseLife() {
    const h = this.hero;
    h.energy = 0; h.lives--; h.dead = 1.4; h.slow = 0; h.ghost = 0; h.sleep = 0; this.stats.livesLost++;
    this.burst(h.x + 20, h.y + 16, 50, FC.RAINBOW.concat([FC.P.W, FC.P.P]), 110);
    this.eshots = [];
    this.sfx.play('lose');
    if (h.lives <= 0) { this.state = 'dying'; this.stateT = 0; }
  }

  private respawn() {
    const h = this.hero;
    h.x = C.HERO_START.x; h.y = Math.min(C.HERO_START.y, this.floor - 40); h.energy = h.energyMax; h.inv = C.INVINCIBLE_AFTER_RESPAWN;
    h.ammo.verm = Math.max(h.ammo.verm, 60); // petit coup de pouce
    if (this.belt.active) h.ghost = 2; // pour ne pas réapparaître coincé dans la ceinture
    this.sfx.play('respawn');
  }

  // ---------- le boss ----------
  private updateBoss(dt: number) {
    const b = this.boss!, h = this.hero, hb = this.heroBox();
    b.update(dt, this);
    if (!b.alive || b.entering || !this.heroAlive() || h.inv > 0) return;
    if (b.hitsBody(hb)) {
      h.x = Math.max(0, h.x - 14);
      if (b.kind === 'skel') { h.y += h.y + 17 < b.y + 44 ? -10 : 10; this.hurt(C.SKEL.contact, b.move === 'dash' ? 'morsure' : 'contact boss'); }
      else this.hurt(C.BOSS.contact, 'contact boss');
    } else if (b.kind === 'spider' && b.laser === 'fire' && overlap(hb, b.laserBox())) this.hurt(C.BOSS.laser, 'laser');
  }

  // un tir du chat contre le boss : seul le cœur est fragile, sauf pour le casse-dents
  private shotVsBoss(s: Shot, sb: Box, born: Shot[]) {
    const b = this.boss!;
    if (!b.alive || s.hitBoss) return;
    // les tirs passent entre les plaques de métal : seul le cœur compte (le casse-dents, lui, explose sur la carapace)
    const core = overlap(sb, b.coreBox()), body = b.hitsBody(sb);
    if (!core && !((s.kind === 'jaw' || s.kind === 'pinata') && body)) return;
    if (core || s.kind === 'jaw') {
      if (!s.touched && s.kind !== 'shard') { s.touched = true; this.stats.hitShots++; }
      const killed = b.damage(s.dmg);
      this.score += s.dmg * 5;
      this.burst(sb.x + sb.w / 2, sb.y + sb.h / 2, 4, [FC.P.q, FC.P.W, FC.P.P], 40);
      this.sfx.play(killed ? 'break' : 'hit');
      if (killed) this.bossDefeated();
    }
    if (s.kind === 'pinata') this.pinataBurst(s, null, born); // la Piñata éclate aussi sur la carapace
    if (s.kind === 'rain') s.hitBoss = true; else s.dead = true;
  }

  private bossDefeated() {
    const skel = this.boss?.kind === 'skel';
    this.events.push({ type: 'boss', kind: this.boss?.kind });
    this.score += skel ? C.SKEL.points : C.BOSS.points;
    this.say(skel ? 'LE POISSON SQUELETTE EST VAINCU !' : "L'ARAIGNÉE DE FER EST VAINCUE !");
    for (const e of this.enemies) this.killEnemy(e, true, false);
    this.eshots = [];
  }

  // ce que le boss demande au niveau
  heroCenter(): [number, number] { return [this.hero.x + 20, this.hero.y + 17]; }
  bossWebs(x: number, y: number, spread: number[]) {
    const [hx, hy] = this.heroCenter(), base = Math.atan2(hy - y, hx - x), v = 62 * this.mode.speed;
    for (const deg of spread) {
      const a = base + deg * Math.PI / 180;
      this.eshots.push({ kind: 'web', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, dead: false });
    }
    this.sfx.play('web');
  }
  // renforts appelés par le boss (de plus en plus nombreux quand sa vie baisse)
  bossReinforcements(x: number, y: number, n: number, drone: boolean) {
    if (this.enemies.length > 8) return; // pas plus de 8 ennemis à la fois
    for (let i = 0; i < n; i++) this.enemies.push(newEnemy('spiderling', x - i * 12, y - i * 10, { phase: this.rnd() * 6, speed: 58 * this.mode.speed }));
    if (drone) this.spawnWave('drone', 0);
  }
  // le poisson squelette
  bossBones(x: number, y: number, spread: number[]) {
    const [hx, hy] = this.heroCenter(), base = Math.atan2(hy - y, hx - x), v = 60 * this.mode.speed;
    for (const deg of spread) {
      const a = base + deg * Math.PI / 180;
      this.eshots.push({ kind: 'bone', x: x - 5, y: y - 3, vx: Math.cos(a) * v, vy: Math.sin(a) * v, g: 0, dead: false });
    }
    this.sfx.play('throw');
  }
  bossBubbles(x: number, y: number, n: number) {
    for (let i = 0; i < n; i++) {
      this.enemies.push(newEnemy('sleepBubble', x - 8, y - 8 + i * 14, { phase: this.rnd() * 6, speed: 8 + this.rnd() * 6, vx: -(35 + i * 12) * this.mode.speed }));
    }
    this.sfx.play('splash');
  }
  bossMinis(x: number, y: number, n: number) {
    if (this.enemies.length > 9) return; // pas trop d'ennemis à la fois
    for (let i = 0; i < n; i++) {
      const yy = Math.max(this.top + 4, Math.min(this.floor - 16, y + (i - (n - 1) / 2) * 26));
      this.enemies.push(newEnemy('miniSkel', x + i * 10, yy, { phase: this.rnd() * 6, speed: (55 + this.rnd() * 15) * this.mode.speed }));
    }
  }
  bossArmorBreak(x: number, y: number) {
    this.burst(x, y, 50, [FC.P.M, FC.P.m, FC.P.n, FC.P.W], 120, 120);
    this.flash = 0.3; this.flashColor = [255, 255, 255, 255];
    this.say("L'ARMURE EST BRISÉE !");
    this.sfx.play('break');
  }
  bossExplosion(x: number, y: number, big: boolean) {
    this.burst(x, y, big ? 80 : 16, big ? FC.RAINBOW.concat([FC.P.W, FC.P.P]) : [FC.P.y, FC.P.o, FC.P.W, FC.P.m], big ? 140 : 70);
    this.flash = big ? 0.5 : 0.08; this.flashColor = [255, 255, 255, 255];
    this.sfx.play(big ? 'bomb' : 'kill');
  }
  sound(name: string) { this.sfx.play(name); }

  burst(x: number, y: number, n: number, colors: Color[], speed: number, g = 0) {
    for (let i = 0; i < n; i++) {
      const a = this.rnd() * Math.PI * 2, v = speed * (0.3 + this.rnd() * 0.7), life = 0.35 + this.rnd() * 0.45;
      this.parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life, max: life, color: colors[i % colors.length], g });
    }
  }
}
