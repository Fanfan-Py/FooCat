// Le boss du niveau 5 : l'Araignée de Fer.
// Seul son cœur rose est fragile (le casse-dents l'abîme partout).
// Phase 1 : salves de toiles. Phase 2 : salves plus larges.
// Phase 3 : elle vise avec le laser de ses yeux (une ligne rouge prévient avant le tir).
import * as C from './config';
import { Box, boxEllipse } from './things';

export interface BossHost {
  heroCenter(): [number, number];
  bossWebs(x: number, y: number, spread: number[]): void;
  bossReinforcements(x: number, y: number, n: number, drone: boolean): void;
  bossExplosion(x: number, y: number, big: boolean): void;
  sound(name: string): void;
}

export class Boss {
  readonly kind = 'spider' as const;
  readonly name = 'ARAIGNÉE DE FER';
  x = C.W + 10;
  y = 40;
  t = 0;
  hp = C.BOSS.hp;
  readonly maxHp = C.BOSS.hp;
  entering = true;
  dying = 0; // > 0 pendant l'explosion finale
  dead = false;
  flash = 0;
  laser: 'idle' | 'aim' | 'fire' = 'idle';
  laserY = 0;
  private laserT = 3;
  private shootT = 2.5;
  private spawnT = 4;

  static readonly HOME_X = C.W - 134;

  get stage() { return this.hp > this.maxHp * 0.66 ? 1 : this.hp > this.maxHp * 0.33 ? 2 : 3; }
  get alive() { return !this.dead && this.dying <= 0; }
  core(): [number, number] { return [this.x + 80, this.y + 52]; }
  coreBox(): Box { const [cx, cy] = this.core(); return { x: cx - 10, y: cy - 10, w: 20, h: 20 }; }
  eye(): [number, number] { return [this.x + 42, this.y + 54]; }
  hitsBody(b: Box) {
    return boxEllipse(b, this.x + 84, this.y + 40, 30, 24) || boxEllipse(b, this.x + 50, this.y + 58, 20, 15);
  }
  laserBox(): Box { const [ex] = this.eye(); return { x: 0, y: this.laserY - 3, w: ex, h: 7 }; }

  // retourne true quand ce coup a vaincu le boss
  damage(n: number): boolean {
    if (!this.alive || this.entering) return false;
    this.hp -= n; this.flash = 0.06;
    if (this.hp <= 0) { this.hp = 0; this.dying = 2.6; this.laser = 'idle'; return true; }
    return false;
  }

  update(dt: number, host: BossHost) {
    this.t += dt; this.flash = Math.max(0, this.flash - dt);
    if (this.dead) return;
    if (this.dying > 0) { // grande explosion finale
      this.dying -= dt;
      this.x += Math.sin(this.t * 50) * 0.8; this.y += 10 * dt;
      if (Math.floor(this.t * 12) !== Math.floor((this.t - dt) * 12)) {
        host.bossExplosion(this.x + 20 + Math.random() * 100, this.y + 10 + Math.random() * 85, false);
      }
      if (this.dying <= 0) { this.dead = true; host.bossExplosion(this.x + 70, this.y + 50, true); }
      return;
    }
    if (this.entering) {
      this.x -= 40 * dt; this.y = 40 + Math.sin(this.t) * 6;
      if (this.x <= Boss.HOME_X) { this.x = Boss.HOME_X; this.entering = false; }
      return;
    }
    const stage = this.stage, [, hy] = host.heroCenter();
    // déplacement : lent, et en phase 3 il se cale sur la hauteur du chat avant le laser
    const top = (C.LEVELS[4].ceiling ?? C.HUD_H), bottom = (C.LEVELS[4].ground ?? C.H) - 104;
    let ty = 40 + Math.sin(this.t * 0.8) * 14;
    if (stage === 3 && this.laser === 'idle') ty = hy - 54;
    if (this.laser === 'idle') this.y += Math.max(-30 * dt, Math.min(30 * dt, ty - this.y));
    this.y = Math.max(top, Math.min(bottom, this.y));

    // salves de toiles
    this.shootT -= dt;
    if (this.shootT <= 0 && this.laser === 'idle') {
      const [ex, ey] = this.eye();
      host.bossWebs(ex - 4, ey - 4, stage === 1 ? [-14, 0, 14] : [-20, -7, 7, 20]);
      this.shootT = stage === 1 ? 2.5 : stage === 2 ? 2.9 : 3.4;
    }
    // renforts : plus sa vie baisse, plus il en appelle, et plus souvent
    // (vie pleine : 1 mini-araignée toutes les 6,5 s ; presque vaincu : 3 toutes les 3,7 s, avec des drones)
    const lost = 1 - this.hp / this.maxHp;
    this.spawnT -= dt;
    if (this.spawnT <= 0) {
      host.bossReinforcements(this.x + 40, this.y + 72, 1 + Math.floor(lost * 2.1), lost > 0.33 && Math.random() < 0.4);
      this.spawnT = 6.5 - 2.8 * lost;
    }
    // laser des yeux
    if (stage === 3) {
      this.laserT -= dt;
      if (this.laser === 'idle' && this.laserT <= 0) { this.laser = 'aim'; this.laserT = 1.0; this.laserY = this.eye()[1]; host.sound('charge'); }
      else if (this.laser === 'aim' && this.laserT <= 0) { this.laser = 'fire'; this.laserT = 0.9; host.sound('laser'); }
      else if (this.laser === 'fire' && this.laserT <= 0) { this.laser = 'idle'; this.laserT = 3.2; }
    }
  }
}
