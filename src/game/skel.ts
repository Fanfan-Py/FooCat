// Le boss du niveau 10 : le poisson squelette de la mort.
// Seul son œil est fragile (le casse-dents l'abîme partout).
// Phase 1, avec armure : lance des arêtes en éventail, souffle des bulles soporifiques, charge pour mordre.
// Quand sa jauge est vide, l'armure vole en éclats et la jauge se remplit à nouveau.
// Phase 2, sans armure : plus rapide, plus d'arêtes, et des mini-poissons squelettes de plus en plus nombreux.
import * as C from './config';
import { Box, boxEllipse } from './things';

export interface SkelHost {
  heroCenter(): [number, number];
  bossBones(x: number, y: number, spread: number[]): void;
  bossBubbles(x: number, y: number, n: number): void;
  bossMinis(x: number, y: number, n: number): void;
  bossArmorBreak(x: number, y: number): void;
  bossExplosion(x: number, y: number, big: boolean): void;
  sound(name: string): void;
}

type Move = 'swim' | 'warn' | 'dash' | 'back' | 'break';

export class SkelBoss {
  readonly kind = 'skel' as const;
  readonly name = 'POISSON SQUELETTE';
  x = C.W + 10;
  y = 40;
  t = 0;
  hp: number;
  readonly maxHp: number;
  armored = true;
  entering = true;
  dying = 0; // > 0 pendant l'explosion finale
  dead = false;
  flash = 0;
  move: Move = 'swim';
  dashY = 0; // hauteur de la charge (annoncée pendant l'avertissement)
  mouth = 0; // > 0 : la bouche est ouverte
  private moveT = 0;
  private shootT = 2.5;
  private bubbleT = 4;
  private chargeT = 7;
  private spawnT = 3;

  static readonly HOME_X = C.W - 136;

  constructor(private top: number, private bottom: number, hpMul = 1) { this.hp = this.maxHp = Math.round(C.SKEL.hp * hpMul); }

  get stage() { return this.armored ? 1 : 2; }
  get alive() { return !this.dead && this.dying <= 0; }
  get charging() { return this.move === 'warn' || this.move === 'dash'; }
  // l'œil : petit sous le casque, plus gros quand l'armure est cassée
  core(): [number, number] { return [this.x + 26, this.y + 36]; }
  coreBox(): Box { const [cx, cy] = this.core(), r = this.armored ? 10 : 12; return { x: cx - r, y: cy - r, w: r * 2, h: r * 2 }; }
  hitsBody(b: Box) {
    return boxEllipse(b, this.x + 32, this.y + 44, 20, 16) || boxEllipse(b, this.x + 82, this.y + 45, 28, 15);
  }

  // retourne true quand ce coup a vaincu le boss
  damage(n: number): boolean {
    if (!this.alive || this.entering || this.move === 'break') return false;
    this.hp -= n; this.flash = 0.06;
    if (this.hp > 0) return false;
    if (this.armored) { // l'armure vole en éclats, la jauge se remplit
      this.hp = 0; this.armored = false; this.move = 'break'; this.moveT = 1.6;
      return false;
    }
    this.hp = 0; this.dying = 2.6; return true;
  }

  update(dt: number, host: SkelHost) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt); this.mouth = Math.max(0, this.mouth - dt);
    if (this.dead) return;
    if (this.dying > 0) { // grande explosion finale
      this.dying -= dt;
      this.x += Math.sin(this.t * 50) * 0.8; this.y += 10 * dt;
      if (Math.floor(this.t * 12) !== Math.floor((this.t - dt) * 12)) {
        host.bossExplosion(this.x + 10 + Math.random() * 110, this.y + 10 + Math.random() * 70, false);
      }
      if (this.dying <= 0) { this.dead = true; host.bossExplosion(this.x + 60, this.y + 44, true); }
      return;
    }
    if (this.entering) {
      this.x -= 40 * dt; this.y = 40 + Math.sin(this.t) * 6;
      if (this.x <= SkelBoss.HOME_X) { this.x = SkelBoss.HOME_X; this.entering = false; }
      return;
    }
    const [, hy] = host.heroCenter(), p2 = !this.armored;
    const minY = this.top - 4, maxY = this.bottom - 80;
    const clampY = () => { this.y = Math.max(minY, Math.min(maxY, this.y)); };

    switch (this.move) {
      case 'break': { // l'armure casse : secousses, la jauge se remplit
        if (this.moveT === 1.6) host.bossArmorBreak(this.x + 50, this.y + 40);
        this.moveT -= dt;
        this.hp = Math.min(this.maxHp, this.maxHp * (1 - this.moveT / 1.6));
        if (this.moveT <= 0) { this.hp = this.maxHp; this.move = 'back'; this.chargeT = 4; this.spawnT = 1; }
        return;
      }
      case 'warn': // il tremble, la bouche ouverte, et vise la hauteur du chat
        this.moveT -= dt; this.mouth = 0.2;
        this.y += Math.max(-50 * dt, Math.min(50 * dt, hy - 44 - this.y)); clampY();
        this.dashY = this.y;
        if (this.moveT <= 0) { this.move = 'dash'; host.sound('dive'); }
        return;
      case 'dash': // il fonce pour mordre, tout droit
        this.mouth = 0.2;
        this.x -= (p2 ? 260 : 220) * dt;
        if (this.x <= -140) { this.move = 'back'; this.x = C.W + 10; } // ressort à gauche, revient par la droite
        return;
      case 'back':
        if (this.x > SkelBoss.HOME_X) this.x = Math.max(SkelBoss.HOME_X, this.x - 70 * dt);
        else this.x = Math.min(SkelBoss.HOME_X, this.x + 70 * dt);
        if (this.x === SkelBoss.HOME_X) this.move = 'swim';
        break;
      case 'swim': break;
    }

    // déplacement : lent avec l'armure, plus vif sans
    const mid = (minY + maxY) / 2;
    const ty = p2 ? mid + Math.sin(this.t * 1.5) * 30 + (hy - 44 - mid) * 0.3 : mid + Math.sin(this.t * 0.8) * 18;
    this.y += Math.max(-(p2 ? 50 : 30) * dt, Math.min((p2 ? 50 : 30) * dt, ty - this.y)); clampY();
    if (this.move !== 'swim') return;

    const lost = 1 - this.hp / this.maxHp;
    // arêtes en éventail, lancées par la bouche
    this.shootT -= dt;
    if (this.shootT <= 0) {
      host.bossBones(this.x + 6, this.y + 48, p2 ? [-28, -14, 0, 14, 28] : [-16, 0, 16]);
      this.shootT = p2 ? 2.6 : 2.8; this.mouth = 0.3;
    }
    // bulles soporifiques
    this.bubbleT -= dt;
    if (this.bubbleT <= 0) {
      host.bossBubbles(this.x + 4, this.y + 50, 1);
      this.bubbleT = p2 ? 12 : 8.5; this.mouth = 0.4;
    }
    // escorte de mini-poissons squelettes (phase 2), de plus en plus nombreux
    if (p2) {
      this.spawnT -= dt;
      if (this.spawnT <= 0) { host.bossMinis(this.x - 14, this.y + 44, 1 + Math.floor(lost * 2.5)); this.spawnT = 5.5 - 2 * lost; }
    }
    // la charge
    this.chargeT -= dt;
    if (this.chargeT <= 0) {
      this.move = 'warn'; this.moveT = 0.85; this.chargeT = p2 ? 5.5 : 8;
      host.sound('charge');
    }
  }
}
