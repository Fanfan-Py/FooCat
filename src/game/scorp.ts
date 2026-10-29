// Le boss du niveau 15 : le Scorpion volant de feu. Il faut le vaincre 3 fois :
// armure de fer, puis carapace de feu, puis scorpion squelette (sa jauge se remplit à chaque fois).
// Seule sa tête est fragile (le casse-dents et la Piñata l'abîment partout).
// Il vole vite, crache un jet de feu (annoncé par de la fumée), lance des boules de feu,
// et se retourne : il fonce (une ligne rouge l'annonce), passe derrière le chat, lui lance des boules de feu, puis revient.
import * as C from './config';
import { Box, boxEllipse } from './things';

export type ScorpForm = 'iron' | 'fire' | 'skel';
export const SCORP_FORMS: ScorpForm[] = ['iron', 'fire', 'skel'];
export const SCORP_FORM_NAMES = ['ARMURE DE FER', 'CARAPACE DE FEU', 'SQUELETTE'];

export interface ScorpHost {
  heroCenter(): [number, number];
  bossFireballs(x: number, y: number, n: number, toRight: boolean): void;
  bossEscort(form: number, x: number, y: number): void;
  bossShell(x: number, y: number, form: number): void;
  bossExplosion(x: number, y: number, big: boolean): void;
  sound(name: string): void;
}

type Move = 'fly' | 'warn' | 'dash' | 'behind' | 'back' | 'break';

export class ScorpBoss {
  readonly kind = 'scorp' as const;
  readonly name = 'SCORPION DE FEU';
  x = C.W + 10;
  y = 50;
  t = 0;
  hp: number;
  readonly maxHp: number;
  formIdx = 0;
  entering = true;
  dying = 0;
  dead = false;
  flash = 0;
  move: Move = 'fly';
  facingRight = false; // retourné, derrière le chat
  dashY = 0;
  breath: 'none' | 'warn' | 'fire' = 'none';
  private moveT = 0;
  private breathT = 3;
  private shootT = 2;
  private turnT = 9;
  private escortT = 3;

  static readonly W = 100;
  static readonly H = 68;

  constructor(private top: number, private bottom: number, hpMul = 1) { this.hp = this.maxHp = Math.round(C.SCORP.hp * hpMul); }

  get form(): ScorpForm { return SCORP_FORMS[this.formIdx]; }
  get stage() { return this.formIdx + 1; }
  get alive() { return !this.dead && this.dying <= 0; }
  get charging() { return this.move === 'warn' || this.move === 'dash'; }
  // la tête (à gauche, ou à droite quand il est retourné)
  core(): [number, number] { return [this.x + (this.facingRight ? ScorpBoss.W - 22 : 22), this.y + 38]; }
  coreBox(): Box { const [cx, cy] = this.core(); return { x: cx - (this.facingRight ? 18 : 12), y: cy - 11, w: 30, h: 22 }; } // la tête et le cou
  hitsBody(b: Box) {
    const fx = (x: number) => this.facingRight ? this.x + ScorpBoss.W - x : this.x + x;
    return boxEllipse(b, fx(50), this.y + 38, 28, 9) || boxEllipse(b, fx(22), this.y + 38, 10, 8);
  }
  // le jet de feu, devant sa gueule
  breathBox(): Box { return { x: this.x - C.SCORP.breath, y: this.y + 33, w: C.SCORP.breath + 4, h: 14 }; }

  damage(n: number): boolean {
    if (!this.alive || this.entering || this.move === 'break') return false;
    this.hp -= n; this.flash = 0.06;
    if (this.hp > 0) return false;
    this.hp = 0;
    if (this.formIdx < 2) { this.move = 'break'; this.moveT = 1.5; this.breath = 'none'; return false; } // sa carapace vole en éclats
    this.dying = 2.6; this.breath = 'none'; return true;
  }

  update(dt: number, host: ScorpHost) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    if (this.dead) return;
    if (this.dying > 0) {
      this.dying -= dt; this.y += 12 * dt;
      if (Math.floor(this.t * 12) !== Math.floor((this.t - dt) * 12)) host.bossExplosion(this.x + 10 + Math.random() * 80, this.y + 10 + Math.random() * 50, false);
      if (this.dying <= 0) { this.dead = true; host.bossExplosion(this.x + 50, this.y + 34, true); }
      return;
    }
    const home = C.W - ScorpBoss.W - 14, minY = this.top - 6, maxY = this.bottom - ScorpBoss.H + 4;
    if (this.entering) {
      this.x -= 60 * dt; this.y = 50 + Math.sin(this.t * 2) * 8;
      if (this.x <= home) { this.x = home; this.entering = false; }
      return;
    }
    const [, hy] = host.heroCenter(), f = this.formIdx, clampY = () => { this.y = Math.max(minY, Math.min(maxY, this.y)); };
    switch (this.move) {
      case 'break': // la carapace vole en éclats, la jauge se remplit, forme suivante
        if (this.moveT === 1.5) host.bossShell(this.x + 50, this.y + 34, f);
        this.moveT -= dt;
        this.hp = Math.min(this.maxHp, this.maxHp * (1 - this.moveT / 1.5));
        if (this.moveT <= 0) { this.formIdx++; this.hp = this.maxHp; this.move = 'fly'; this.turnT = 6; this.escortT = 1; this.facingRight = false; }
        return;
      case 'warn': // il vise la hauteur du chat ; une ligne rouge annonce sa course
        this.moveT -= dt;
        this.y += Math.max(-60 * dt, Math.min(60 * dt, hy - 38 - this.y)); clampY(); this.dashY = this.y;
        if (this.moveT <= 0) { this.move = 'dash'; host.sound('dive'); }
        return;
      case 'dash': // il fonce vers la gauche et passe derrière le chat
        this.x -= (220 + f * 30) * dt;
        if (this.x <= -ScorpBoss.W + 22) { this.x = -ScorpBoss.W + 22; this.move = 'behind'; this.moveT = 1.6; this.facingRight = true; this.y = hy < (minY + maxY) / 2 + 34 ? maxY : minY; }
        return;
      case 'behind': // retourné, au bord gauche : il lance des boules de feu dans le dos du chat
        this.moveT -= dt;
        if (this.moveT < 1.0 && this.moveT + dt >= 1.0) host.bossFireballs(this.x + ScorpBoss.W - 10, this.y + 38, 2 + f, true);
        if (this.moveT <= 0) { this.move = 'back'; this.facingRight = false; this.x = C.W + 10; }
        return;
      case 'back':
        this.x = Math.max(home, this.x - 90 * dt);
        if (this.x === home) this.move = 'fly';
        break;
      case 'fly': break;
    }
    // vol : de grandes boucles dans la moitié droite, plus vite à chaque forme
    if (this.move === 'fly') {
      const sp = 1 + f * 0.25;
      const tx = home - 30 + Math.sin(this.t * 0.7 * sp) * 40, ty = (minY + maxY) / 2 + Math.sin(this.t * 1.1 * sp) * (maxY - minY) * 0.36;
      this.x += Math.max(-70 * dt, Math.min(70 * dt, tx - this.x));
      this.y += Math.max(-80 * dt * sp, Math.min(80 * dt * sp, ty - this.y)); clampY();
    }
    if (this.move !== 'fly') return;
    // jet de feu : fumée (warn), puis feu
    this.breathT -= dt;
    if (this.breath === 'none' && this.breathT <= 0) { this.breath = 'warn'; this.breathT = 0.7; host.sound('charge'); }
    else if (this.breath === 'warn' && this.breathT <= 0) { this.breath = 'fire'; this.breathT = 1.0; host.sound('laser'); }
    else if (this.breath === 'fire' && this.breathT <= 0) { this.breath = 'none'; this.breathT = 3.6 - f * 0.4; }
    // boules de feu en cloche
    this.shootT -= dt;
    if (this.shootT <= 0 && this.breath === 'none') { host.bossFireballs(this.x + 4, this.y + 36, 1 + f, false); this.shootT = 3.8 - f * 0.3; } // 1, 2 puis 3 boules de feu
    // l'escorte change avec la forme
    this.escortT -= dt;
    if (this.escortT <= 0) { host.bossEscort(f, this.x + 20, this.y + 30); this.escortT = 8 - f * 1; }
    // il se retourne (passe derrière le chat)
    this.turnT -= dt;
    if (this.turnT <= 0 && this.breath === 'none') { this.move = 'warn'; this.moveT = 0.9; this.turnT = 11 - f * 1.5; host.sound('alarm'); }
  }
}
