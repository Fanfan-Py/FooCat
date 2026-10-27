// Les écrans du jeu : accueil (niveau + mode), partie, pause, game over, niveau terminé, fin.
import { FC, Pix } from '../art';
import * as C from './config';
import { World, Controls, Sfx, Carry } from './world';
import { drawWorld } from './draw';

const P = FC.P;
export interface AppInput extends Controls {
  confirm: boolean; pause: boolean;
  left: boolean; right: boolean; up: boolean; down: boolean; // flèches appuyées (menus)
  tapX: number; tapY: number; // endroit touché dans l'écran de jeu (-1 si rien)
}

function load(key: string): number { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } }
function save(key: string, n: number) { try { localStorage.setItem(key, String(n)); } catch { /* stockage indisponible */ } }

function center(scr: Pix, s: string, y: number, c: number[], o: any = {}) {
  FC.text(scr, s, Math.round((C.W - FC.textWidth(s, o.sc || 1)) / 2), y, c, o);
}

const MODES: C.Mode[] = ['normal', 'difficile'];
const MODE_NAMES: Record<C.Mode, string> = { normal: 'NORMAL', difficile: 'DIFFICILE' };
const THEMES = ['space', 'nebula', 'planet', 'iron', 'iron'];

// petit menu vertical (pause, game over...) : flèches haut/bas + Entrée, ou toucher une ligne
class Menu {
  idx = 0;
  constructor(public items: string[], public y0: number, public gap = 12) { }
  // renvoie la ligne choisie, ou -1
  handle(c: AppInput): number {
    if (c.up) this.idx = (this.idx + this.items.length - 1) % this.items.length;
    if (c.down) this.idx = (this.idx + 1) % this.items.length;
    if (c.tapX >= 0) {
      const i = Math.floor((c.tapY - this.y0 + 4) / this.gap);
      return i >= 0 && i < this.items.length ? i : -1;
    }
    return c.confirm ? this.idx : -1;
  }
  draw(scr: Pix, t: number) {
    this.items.forEach((s, i) => {
      const y = this.y0 + i * this.gap, on = i === this.idx, w = FC.textWidth(s) + 16, x = Math.round((C.W - w) / 2);
      if (on) { scr.rect(x, y - 3, w, 11, FC.alpha(P.P, 200)); scr.rect(x, y + 8, w, 1, P.U); }
      else scr.rect(x, y - 3, w, 11, FC.alpha(P.K, 160));
      center(scr, s, y, on ? P.W : P.v);
      if (on && Math.floor(t * 3) % 2) FC.text(scr, '>', x + 3, y, P.y);
    });
  }
}

export class App {
  state: 'title' | 'play' | 'pause' | 'over' | 'done' | 'end' = 'title';
  world: World | null = null;
  // mode développeur : choix du niveau à l'accueil (automatique sur l'ordinateur de développement,
  // ou en touchant 5 fois le logo sur le site)
  dev = load('foocat.dev') === 1;
  choice = 0; // niveau choisi à l'accueil (mode développeur)
  mode: C.Mode = 'normal';
  touch = false;
  private t = 0;
  private stateT = 0;
  private menu: Menu | null = null;
  private devRun = false; // partie lancée depuis le choix du niveau : on ne sauvegarde pas
  private logoTaps: number[] = [];
  private notice: { text: string; t: number } | null = null;
  private levelStart: Carry | null = null; // pour rejouer le niveau après un game over
  private titleStars = FC.stars(3, C.W, C.H, 120);
  private bigHero: Record<number, Pix> = {};

  constructor(private sfx: Sfx) { this.sfx.music?.('title'); this.titleMenu(); }

  setDev(on: boolean, remember = false) { this.dev = on; if (remember) save('foocat.dev', on ? 1 : 0); this.titleMenu(); }

  // sauvegarde « Continuer » : le début du dernier niveau atteint, pour chaque mode
  get saveKey() { return 'foocat.save.' + this.mode; }
  get saved(): { level: number; carry: Carry } | null {
    try { const v = JSON.parse(localStorage.getItem(this.saveKey) || 'null'); return v && typeof v.level === 'number' ? v : null; } catch { return null; }
  }
  private writeSave(v: { level: number; carry: Carry } | null) {
    try { if (v) localStorage.setItem(this.saveKey, JSON.stringify(v)); else localStorage.removeItem(this.saveKey); } catch { /* stockage indisponible */ }
  }
  get bestKey() { return this.mode === 'normal' ? 'foocat.best' : 'foocat.best.' + this.mode; }
  get best() { return load(this.bestKey); }

  private go(s: App['state'], menu: string[] | null = null, y0 = 0) {
    this.state = s; this.stateT = 0;
    this.menu = menu ? new Menu(menu, y0) : null;
    if (s === 'title') { this.sfx.music?.('title'); this.titleMenu(); }
    if (s === 'over' || s === 'end') this.sfx.music?.(null);
  }
  private startLevel(i: number, carry?: Carry) {
    // on repart toujours avec au moins les vies de départ du mode
    if (carry) carry = { ...carry, lives: Math.max(carry.lives, C.MODES[this.mode].lives) };
    this.world = new World(this.sfx, { level: i, carry, mode: this.mode });
    this.levelStart = this.world.carry();
    if (!this.devRun) this.writeSave(i > 0 ? { level: i, carry: this.levelStart } : null);
    this.go('play'); this.sfx.play('start');
    this.sfx.music?.(THEMES[i] ?? 'space');
  }
  private record() { if (this.world && this.world.score > this.best) save(this.bestKey, this.world.score); }

  update(dt: number, c: AppInput) {
    this.t += dt; this.stateT += dt;
    const w = this.world;
    switch (this.state) {
      case 'title': this.updateTitle(c); break;
      case 'play':
        if (!w) return;
        if (c.pause) { this.openPause(); return; }
        w.update(dt, c);
        if (w.state === 'over') { this.record(); this.go('over', ['REJOUER LE NIVEAU ' + w.level.num, "RETOUR À L'ACCUEIL"], 124); }
        if (w.state === 'cleared' && w.stateT > 3) {
          this.record();
          const last = w.levelIndex + 1 >= C.LEVELS.length;
          this.go('done', [last ? 'CONTINUER' : 'NIVEAU SUIVANT', "RETOUR À L'ACCUEIL"], 130);
          this.sfx.music?.(null);
        }
        break;
      case 'pause': {
        if (c.pause) { this.resume(); break; }
        const i = this.menu!.handle(c);
        if (i === 0) this.resume();
        else if (i === 1 && w) this.startLevel(w.levelIndex, this.levelStart ?? undefined);
        else if (i === 2) this.go('title');
        break;
      }
      case 'over':
      case 'done': {
        if (w) w.update(dt, { dx: 0, dy: 0, fire: false, special: false, swap: false, select: -1 });
        if (this.stateT < 1 || !w) break;
        const i = this.menu!.handle(c);
        if (i === 1) this.go('title');
        else if (i === 0) {
          if (this.state === 'over') this.startLevel(w.levelIndex, this.levelStart ?? undefined);
          else if (w.levelIndex + 1 < C.LEVELS.length) this.startLevel(w.levelIndex + 1, w.carry());
          else { if (!this.devRun) this.writeSave(null); this.go('end'); }
        }
        break;
      }
      case 'end':
        if ((c.confirm || c.tapX >= 0) && this.stateT > 1) this.go('title');
        break;
    }
  }

  // menu de l'accueil : Continuer (si une partie est sauvegardée), Nouvelle partie, Mode
  private titleMenu() {
    const sv = this.saved, items: string[] = [];
    if (sv) items.push('CONTINUER : NIVEAU ' + (sv.level + 1));
    items.push(this.dev ? 'JOUER LE NIVEAU ' + (this.choice + 1) : 'NOUVELLE PARTIE');
    items.push('MODE : ' + MODE_NAMES[this.mode]);
    const idx = this.menu ? Math.min(this.menu.idx, items.length - 1) : 0;
    this.menu = new Menu(items, this.dev ? 124 : 117, 11);
    this.menu.idx = idx;
  }

  private updateTitle(c: AppInput) {
    if (this.notice && (this.notice.t += 1 / 60) > 2.5) this.notice = null;
    // geste secret : toucher 5 fois le logo en 3 secondes active ou coupe le mode développeur
    if (c.tapX >= 0 && c.tapY < 40 && c.tapX > 90 && c.tapX < 230) {
      this.logoTaps = this.logoTaps.filter((t) => this.t - t < 3).concat(this.t);
      if (this.logoTaps.length >= 5) {
        this.dev = !this.dev; this.logoTaps = []; save('foocat.dev', this.dev ? 1 : 0);
        this.notice = { text: this.dev ? 'MODE DÉVELOPPEUR ACTIVÉ' : 'MODE DÉVELOPPEUR DÉSACTIVÉ', t: 0 };
        this.sfx.play('pickup'); this.titleMenu();
      }
      return;
    }
    const n = C.LEVELS.length;
    // mode développeur : gauche/droite (ou toucher les flèches de la ligne DEV) changent le niveau
    if (this.dev) {
      let lv = (c.right ? 1 : 0) - (c.left ? 1 : 0);
      if (c.tapX >= 0 && c.tapY >= 106 && c.tapY < 119) lv = c.tapX < 160 ? -1 : 1;
      if (lv && this.menu!.items[this.menu!.idx].startsWith('MODE') === false) {
        this.choice = (this.choice + lv + n) % n; this.sfx.play('swap'); this.titleMenu(); return;
      }
      if (c.tapX >= 0 && c.tapY >= 106 && c.tapY < 119) return;
    }
    const menu = this.menu!, modeIdx = menu.items.length - 1;
    if ((c.left || c.right) && menu.idx === modeIdx) { this.toggleMode(); return; }
    const i = menu.handle(c);
    if (i < 0) return;
    if (i === modeIdx) { this.toggleMode(); return; }
    const sv = this.saved;
    if (sv && i === 0) { this.devRun = false; this.startLevel(sv.level, sv.carry); return; }
    this.devRun = this.dev && this.choice > 0;
    this.startLevel(this.dev ? this.choice : 0);
  }

  private toggleMode() {
    this.mode = MODES[(MODES.indexOf(this.mode) + 1) % MODES.length];
    this.sfx.play('swap'); this.titleMenu();
  }

  private openPause() {
    this.go('pause', ['REPRENDRE', 'RECOMMENCER LE NIVEAU', "QUITTER : RETOUR À L'ACCUEIL"], 50);
    this.sfx.play('pause'); this.sfx.pauseMusic?.(true);
  }
  private resume() { this.state = 'play'; this.menu = null; this.sfx.play('pause'); this.sfx.pauseMusic?.(false); }

  // met le jeu en pause (onglet caché, appel...)
  pause() { if (this.state === 'play') this.openPause(); }

  draw(scr: Pix) {
    if (this.state === 'title' || !this.world) return this.drawTitle(scr);
    const w = this.world;
    if (this.state === 'end') return this.drawEnd(scr);
    drawWorld(scr, w);
    if (this.state === 'play' && w.t < 2.6 && Math.floor(w.t * 4) % 4 !== 3) {
      center(scr, 'NIVEAU ' + w.level.num, 64, P.W, { sc: 2, outline: P.K });
      center(scr, w.level.name, 84, P.q, { outline: P.K });
    }
    if (this.state === 'pause') {
      scr.rect(0, 14, C.W, C.H - 14, FC.alpha(P.K, 170));
      center(scr, 'PAUSE', 24, P.W, { sc: 3, outline: P.U });
      this.menu!.draw(scr, this.t);
      center(scr, 'LES ARMES', 90, P.W);
      const rows: [string, string, string][] = [
        ['icoVerm', 'VERMICELLES', 'RAPIDES, EN ÉVENTAIL'],
        ['icoDrag', 'DRAGIBUS', 'LOURDS, ILS REBONDISSENT'],
        ['icoPinata', 'PIÑATA', 'ÉCLATE EN PETITS BONBONS'],
        ['icoRain', 'ARC-EN-CIEL', 'INFINI, TRAVERSE TOUT'],
        ['icoJaw', 'CASSE-DENTS', 'FAIT EXPLOSER UN OBSTACLE'],
      ];
      rows.forEach(([ico, name, desc], i) => {
        const y = 101 + i * 10;
        scr.blit(FC.spr(ico), 64, y - 1);
        FC.text(scr, name, 76, y, P.y);
        FC.text(scr, desc, 128, y, P.W);
      });
      if (!this.touch) center(scr, 'ÉCHAP : REPRENDRE · M : SON · 1 À 4 : ARMES', 156, P.v);
    }
    if (this.state === 'over') {
      scr.rect(0, 14, C.W, C.H - 14, FC.alpha(P.K, Math.min(170, this.stateT * 300)));
      center(scr, 'GAME OVER', 46, P.P, { sc: 3, outline: P.K });
      center(scr, 'SCORE ' + w.score, 82, P.W);
      center(scr, 'MEILLEUR ' + this.best, 94, P.y);
      if (this.stateT > 1) this.menu!.draw(scr, this.t);
    }
    if (this.state === 'done') {
      const next = C.LEVELS[w.levelIndex + 1];
      scr.rect(0, 14, C.W, C.H - 14, FC.alpha(P.K, Math.min(150, this.stateT * 300)));
      center(scr, w.level.boss ? 'VICTOIRE !' : 'NIVEAU ' + w.level.num + ' TERMINÉ !', 40, P.y, { sc: 2, outline: P.K });
      center(scr, 'SCORE ' + w.score, 70, P.W);
      center(scr, 'MEILLEUR ' + this.best, 82, P.y);
      center(scr, next ? 'PROCHAIN : NIVEAU ' + next.num + ' · ' + next.name : (w.level.next ?? 'BRAVO !'), 104, P.q);
      if (this.stateT > 1) this.menu!.draw(scr, this.t);
    }
  }

  private drawEnd(scr: Pix) {
    this.drawTitleBackground(scr);
    const w = this.world!;
    center(scr, 'BRAVO !', 40, P.y, { sc: 3, outline: P.K });
    center(scr, 'TU AS TERMINÉ LES ' + C.LEVELS.length + ' NIVEAUX EN MODE ' + MODE_NAMES[this.mode], 72, P.W, { outline: P.K });
    center(scr, w.level.next ?? '', 84, P.q, { outline: P.K });
    center(scr, 'SCORE ' + w.score, 104, P.y, { sc: 2, outline: P.K });
    center(scr, this.mode === 'normal' ? 'ESSAIE LE MODE DIFFICILE !' : 'CHAMPION DE LA GALAXIE !', 136, P.v, { outline: P.K });
    if (this.stateT > 1 && this.t % 1.2 < 0.8) center(scr, (this.touch ? 'TOUCHE' : 'ENTRÉE') + " POUR REVENIR À L'ACCUEIL", 152, P.W, { outline: P.K });
  }

  private drawTitleBackground(scr: Pix) {
    const bg = FC.bg('title', C.W, C.H, [[0, '0b0a26'], [0.6, '1d1450'], [1, '3a1d6e']]);
    scr.d.set(bg.d);
    FC.drawStars(scr, this.titleStars, this.t, [3, 8, 18]);
  }

  private drawTitle(scr: Pix) {
    const t = this.t;
    this.drawTitleBackground(scr);
    const logo = FC.logo();
    scr.blit(logo, Math.round((C.W - logo.w) / 2), 8);
    center(scr, "LE CHAT LICORNE DE L'ESPACE", 41, P.q, { shadow: P.U });
    const f = Math.floor(t * 5) % 4;
    if (!this.bigHero[f]) this.bigHero[f] = FC.spr('hero', f).scale(2);
    const big = this.bigHero[f], by = Math.round(Math.sin(t * 2.4) * 2), hx = Math.round((C.W - big.w) / 2), hy = 48 + by;
    FC.trail(scr, hx + 8, hy + 48, t, true);
    scr.blit(big, hx, hy);
    if (!this.menu) this.titleMenu();
    if (this.dev) { // ligne réservée au mode développeur
      const a = Math.floor(t * 3) % 2;
      center(scr, 'DEV · NIVEAU ' + (this.choice + 1) + ' · ' + C.LEVELS[this.choice].name, 110, P.o, { outline: P.K });
      FC.text(scr, '<', 52 - a, 110, P.o, { outline: P.K }); FC.text(scr, '>', 266 + a, 110, P.o, { outline: P.K });
    }
    this.menu!.draw(scr, t);
    if (!this.dev) {
      if (this.touch) center(scr, 'TOUCHE UNE LIGNE POUR CHOISIR', 156, P.v);
      else center(scr, 'HAUT/BAS PUIS ENTRÉE · ESPACE : TIRER · X : ARME · C : CASSE-DENTS', 156, P.v);
    }
    if (this.notice) center(scr, this.notice.text, 100, P.y, { outline: P.K });
    center(scr, 'MEILLEUR SCORE (' + MODE_NAMES[this.mode] + ') ' + this.best, 171, P.y);
  }
}
