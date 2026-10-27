// Les écrans du jeu : accueil, partie, pause, réglages, bilan de fin de niveau, game over, fin,
// tableau des scores, succès et soucoupes.
import { FC, Pix } from '../art';
import * as C from './config';
import { World, Controls, Sfx, Carry } from './world';
import { drawWorld, setHeroSkin } from './draw';
import { loadScores, qualifies, addScore, cleanName, checkName } from './scores';
import {
  Settings, loadSettings, saveSettings, Stats, loadStats, saveStats, ACHIEVEMENTS, loadUnlocked, saveUnlocked,
  loadStars, saveStars, SKINS, skinUnlockedBy, loadSkin, saveSkin, heroSprite,
} from './rewards';

const P = FC.P;
export interface AppInput extends Controls {
  confirm: boolean; pause: boolean;
  left: boolean; right: boolean; up: boolean; down: boolean; // flèches appuyées (menus)
  tapX: number; tapY: number; // endroit touché dans l'écran de jeu (-1 si rien)
}

type After = 'over' | 'end' | 'title';
type State = 'title' | 'play' | 'pause' | 'over' | 'done' | 'end' | 'name' | 'scores' | 'settings' | 'succes' | 'skins' | 'story';
function loadText(key: string): string { try { return localStorage.getItem(key) || ''; } catch { return ''; } }
function load(key: string): number { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } }
function save(key: string, n: number) { try { localStorage.setItem(key, String(n)); } catch { /* stockage indisponible */ } }

function center(scr: Pix, s: string, y: number, c: number[], o: any = {}, cx = C.W / 2) {
  FC.text(scr, s, Math.round(cx - FC.textWidth(s, o.sc || 1) / 2), y, c, o);
}
function right(scr: Pix, s: string, x: number, y: number, c: number[], o: any = {}) { FC.text(scr, s, x - FC.textWidth(s), y, c, o); }

const MODES: C.Mode[] = ['normal', 'difficile'];
const MODE_NAMES: Record<C.Mode, string> = { normal: 'NORMAL', difficile: 'DIFFICILE' };
const THEMES = ['space', 'nebula', 'planet', 'iron', 'iron', 'space', 'nebula'];

// histoire illustrée entre le niveau 5 et le niveau 6
const STORY = [
  { scene: 'story1', text: "L'ARAIGNÉE DE FER EST VAINCUE ! LE CHAT LICORNE S'ÉCHAPPE DE LA FORTERESSE." },
  { scene: 'story2', text: "DANS L'ESPACE FLOTTE UNE BOUTEILLE... À L'INTÉRIEUR, UN MESSAGE : AU SECOURS !" },
  { scene: 'story3', text: 'UNE PLANÈTE AQUATIQUE EST MENACÉE PAR LE TERRIBLE POISSON SQUELETTE DE LA MORT.' },
  { scene: 'story4', text: "LE CHAT LICORNE N'HÉSITE PAS : CAP SUR L'OCÉAN DES ÉTOILES ! PLOUF !" },
];
const STORY_BEFORE = 5; // l'histoire se montre avant le niveau 6 (numéro 5 en partant de 0)
// coupe un texte en lignes qui tiennent dans la largeur donnée
function wrap(text: string, width: number): string[] {
  const lines: string[] = []; let cur = '';
  for (const word of text.split(' ')) {
    const next = cur ? cur + ' ' + word : word;
    if (FC.textWidth(next) > width && cur) { lines.push(cur); cur = word; } else cur = next;
  }
  if (cur) lines.push(cur);
  return lines;
}

// petit menu vertical : flèches haut/bas + Entrée, ou toucher une ligne
class Menu {
  idx = 0;
  constructor(public items: string[], public y0: number, public gap = 12, public cx = C.W / 2) { }
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
      const y = this.y0 + i * this.gap, on = i === this.idx, w = FC.textWidth(s) + 16, x = Math.round(this.cx - w / 2);
      if (on) { scr.rect(x, y - 3, w, 11, FC.alpha(P.P, 200)); scr.rect(x, y + 8, w, 1, P.U); }
      else scr.rect(x, y - 3, w, 11, FC.alpha(P.K, 160));
      center(scr, s, y, on ? P.W : P.v, {}, this.cx);
      if (on && Math.floor(t * 3) % 2) FC.text(scr, '>', x + 3, y, P.y);
    });
  }
}

// lignes de l'écran Réglages
const SETTING_ROWS: { key: keyof Settings | 'back'; label: string }[] = [
  { key: 'music', label: 'MUSIQUE' },
  { key: 'sfx', label: 'EFFETS SONORES' },
  { key: 'autoFire', label: 'TIR AUTOMATIQUE' },
  { key: 'leftHanded', label: 'COMMANDES GAUCHER' },
  { key: 'vibrate', label: 'VIBRATIONS (ANDROID)' },
  { key: 'back', label: 'RETOUR' },
];

export class App {
  state: State = 'title';
  world: World | null = null;
  // mode développeur : choix du niveau à l'accueil (automatique sur l'ordinateur de développement,
  // ou en touchant 5 fois le logo sur le site)
  dev = load('foocat.dev') === 1;
  choice = 0; // niveau choisi à l'accueil (mode développeur)
  mode: C.Mode = 'normal';
  touch = false;
  settings: Settings = loadSettings();
  settingsVersion = 0; // augmente à chaque changement (main.ts replace les boutons si besoin)
  private t = 0;
  private stateT = 0;
  private menu: Menu | null = null;
  private devRun = false; // partie lancée depuis le choix du niveau : on ne sauvegarde pas
  private logoTaps: number[] = [];
  private notice: { text: string; t: number } | null = null;
  private levelStart: Carry | null = null; // pour rejouer le niveau après un game over
  private titleActions: string[] = [];
  // tableau des scores
  private pendingScore: { score: number; level: number; won: boolean; then: After } | null = null;
  private scoresThen: After = 'title'; // où aller en quittant le tableau
  private scoresMode: C.Mode = 'normal';
  private highlight: { mode: C.Mode; rank: number } | null = null;
  lastName = loadText('foocat.name');
  // réglages, succès, soucoupes
  private settingsFrom: 'title' | 'pause' = 'title';
  private sel = 0; // ligne choisie dans les écrans Réglages / Succès / Soucoupes
  private stats: Stats = loadStats();
  private statsDirty = false;
  private lastStatsSave = 0;
  private unlocked = loadUnlocked();
  private skin = loadSkin();
  private toasts: { title: string; sub: string; t: number }[] = [];
  private bilan: { stars: number; kills: number; acc: number; bonuses: number; hits: number; time: number } | null = null;
  private titleStars = FC.stars(3, C.W, C.H, 120);
  private bigHero: Record<string, Pix> = {};
  private story = { idx: 0, carry: undefined as Carry | undefined, scenes: [] as any[], pix: null as Pix | null };

  constructor(private sfx: Sfx) {
    if (!SKINS.some((s) => s.id === this.skin) || !this.skinOpen(this.skin)) this.skin = 'classic';
    setHeroSkin(this.skin);
    this.applySettings();
    this.sfx.music?.('title');
    this.titleMenu();
  }

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
  get best() { const top = loadScores(this.mode)[0]; return Math.max(load(this.bestKey), top ? top.score : 0); }

  private go(s: State, menu: string[] | null = null, y0 = 0) {
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
    if (this.toasts.length && (this.toasts[0].t += dt) > 3.2) this.toasts.shift();
    if (this.statsDirty && this.t - this.lastStatsSave > 1) { saveStats(this.stats); this.statsDirty = false; this.lastStatsSave = this.t; }
    const w = this.world;
    switch (this.state) {
      case 'title': this.updateTitle(c); break;
      case 'play':
        if (!w) return;
        if (c.pause) { this.openPause(); return; }
        w.update(dt, this.settings.autoFire ? { ...c, fire: true } : c);
        this.readEvents(w);
        if (w.state === 'over') { this.record(); this.sfx.music?.(null); this.afterGame('over'); }
        if (w.state === 'cleared' && w.stateT > 3) this.levelDone(w);
        break;
      case 'pause': {
        if (c.pause) { this.resume(); break; }
        const i = this.menu!.handle(c);
        if (i === 0) this.resume();
        else if (i === 1 && w) this.startLevel(w.levelIndex, this.levelStart ?? undefined);
        else if (i === 2) this.openSettings('pause');
        else if (i === 3) { this.sfx.pauseMusic?.(false); this.afterGame('title'); }
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
          else if (w.levelIndex + 1 === STORY_BEFORE) this.openStory(w.carry());
          else if (w.levelIndex + 1 < C.LEVELS.length) this.startLevel(w.levelIndex + 1, w.carry());
          else { if (!this.devRun) this.writeSave(null); this.afterGame('end', true); }
        }
        break;
      }
      case 'end':
        if ((c.confirm || c.tapX >= 0) && this.stateT > 1) this.go('title');
        break;
      case 'name': break; // la saisie se fait dans le formulaire par-dessus le jeu (main.ts)
      case 'scores': {
        let m = (c.right ? 1 : 0) - (c.left ? 1 : 0);
        if (c.tapX >= 0 && c.tapY < 44) m = c.tapX < 160 ? -1 : 1; // toucher les flèches du haut
        if (m) { this.scoresMode = MODES[(MODES.indexOf(this.scoresMode) + m + MODES.length) % MODES.length]; this.sfx.play('swap'); break; }
        if (this.stateT > 0.5 && (c.confirm || c.pause || c.tapX >= 0)) { const then = this.scoresThen; this.scoresThen = 'title'; this.finish(then); }
        break;
      }
      case 'settings': this.updateSettings(c); break;
      case 'succes': this.updateSucces(c); break;
      case 'skins': this.updateSkins(c); break;
      case 'story':
        if (c.pause) { this.startLevel(STORY_BEFORE, this.story.carry); break; } // Échap : passer l'histoire
        if (this.stateT > 0.6 && (c.confirm || c.tapX >= 0)) {
          if (++this.story.idx >= STORY.length) this.startLevel(STORY_BEFORE, this.story.carry);
          else { this.stateT = 0; this.sfx.play('swap'); }
        }
        break;
    }
  }

  // ---------- succès ----------
  private readEvents(w: World) {
    if (!w.events.length) { if (w.score >= 100000) this.unlock('score100k'); return; }
    for (const ev of w.events) {
      if (ev.type === 'kill') {
        if (ev.kind === 'fly' || ev.kind === 'flyGold') this.stats.flies++;
        if (ev.by === 'rain') this.stats.rainbowKills++;
      } else if (ev.type === 'wave') this.stats.waves++;
      else if (ev.type === 'bonus') this.stats.bonuses++;
      else if (ev.type === 'break') this.stats.jawBreaks++;
      else if (ev.type === 'belt') this.unlock('belt');
      else if (ev.type === 'pinata5') this.unlock('pinata');
      else if (ev.type === 'boss') { this.unlock('boss'); if (this.mode === 'difficile') this.unlock('hard'); }
    }
    w.events = [];
    this.statsDirty = true;
    for (const a of ACHIEVEMENTS) if (a.goal && this.stats[a.goal.stat] >= a.goal.n) this.unlock(a.id);
    if (w.score >= 100000) this.unlock('score100k');
  }
  private unlock(id: string) {
    if (this.unlocked.has(id)) return;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    this.unlocked.add(id); saveUnlocked(this.unlocked);
    const skin = a.skin && SKINS.find((s) => s.id === a.skin);
    this.toasts.push({ title: 'SUCCÈS : ' + a.name, sub: skin ? 'NOUVELLE SOUCOUPE : ' + skin.name : a.desc, t: 0 });
    this.sfx.play('level');
  }
  private skinOpen(id: string) { const a = skinUnlockedBy(id); return !a || this.unlocked.has(a.id); }

  // ---------- fin de niveau : bilan et étoiles ----------
  private levelDone(w: World) {
    this.record();
    const s = w.stats, hits = w.hits, stars = hits <= 1 ? 3 : hits <= 4 ? 2 : 1;
    this.bilan = { stars, kills: s.kills, acc: s.shots ? Math.round(s.hitShots / s.shots * 100) : 0, bonuses: s.bonuses, hits, time: w.t };
    const all = loadStars(), key = this.mode + '-' + w.level.num;
    if (stars > (all[key] || 0)) { all[key] = stars; saveStars(all); }
    if (w.levelIndex === 0) this.unlock('first');
    if (s.livesLost === 0) this.unlock('nolife');
    if (stars === 3) this.unlock('stars3');
    saveStats(this.stats); this.statsDirty = false;
    const last = w.levelIndex + 1 >= C.LEVELS.length;
    this.go('done', [last ? 'CONTINUER' : 'NIVEAU SUIVANT', "RETOUR À L'ACCUEIL"], 148);
    this.sfx.music?.(null);
  }

  // ---------- tableau des scores ----------
  // fin d'une partie : si le score entre dans le top 10, on demande le pseudonyme
  private afterGame(then: After, won = false) {
    const w = this.world;
    if (this.statsDirty) { saveStats(this.stats); this.statsDirty = false; }
    if (w && !this.devRun && qualifies(this.mode, w.score)) {
      this.pendingScore = { score: w.score, level: w.level.num, won, then };
      this.state = 'name'; this.stateT = 0; this.menu = null;
      this.sfx.play('level');
      return;
    }
    this.finish(then);
  }
  private finish(then: After) {
    if (then === 'over') {
      const w = this.world!;
      this.go('over', ['REJOUER LE NIVEAU ' + w.level.num, "RETOUR À L'ACCUEIL"], 124);
      this.stateT = 1; // le menu est tout de suite utilisable
    } else this.go(then);
  }
  get nameRequest() { return this.state === 'name' ? this.pendingScore : null; }
  // le joueur valide son pseudonyme : renvoie un message d'erreur, ou null si c'est enregistré
  submitName(raw: string): string | null {
    const p = this.pendingScore;
    if (!p) return null;
    const name = cleanName(raw), err = checkName(name, raw);
    if (err) return err;
    this.lastName = name;
    try { localStorage.setItem('foocat.name', name); } catch { /* stockage indisponible */ }
    const rank = addScore(this.mode, { name, score: p.score, level: p.level, won: p.won, date: new Date().toISOString().slice(0, 10) });
    this.highlight = { mode: this.mode, rank };
    this.pendingScore = null;
    this.openScores(p.then);
    return null;
  }
  skipName() { const p = this.pendingScore; this.pendingScore = null; if (p) this.finish(p.then); }
  private openScores(then: After) {
    this.scoresThen = then; this.scoresMode = this.mode;
    this.go('scores'); this.sfx.play('pickup');
  }

  // ---------- accueil ----------
  private titleMenu() {
    const sv = this.saved, items: string[] = [], acts: string[] = [];
    const add = (label: string, act: string) => { items.push(label); acts.push(act); };
    if (sv) add('CONTINUER : NIVEAU ' + (sv.level + 1), 'continue');
    add(this.dev ? 'JOUER LE NIVEAU ' + (this.choice + 1) : 'NOUVELLE PARTIE', 'new');
    add('MODE : ' + MODE_NAMES[this.mode], 'mode');
    add('MEILLEURS SCORES', 'scores');
    add('SUCCÈS ' + this.unlocked.size + '/' + ACHIEVEMENTS.length, 'succes');
    add('SOUCOUPES', 'skins');
    add('RÉGLAGES', 'settings');
    this.titleActions = acts;
    const idx = this.menu && this.state === 'title' ? Math.min(this.menu.idx, items.length - 1) : 0;
    this.menu = new Menu(items, 56, 13, 210);
    this.menu.idx = idx;
  }

  private updateTitle(c: AppInput) {
    if (this.notice && (this.notice.t += 1 / 60) > 2.5) this.notice = null;
    // geste secret : toucher 5 fois le logo en 3 secondes active ou coupe le mode développeur
    if (c.tapX >= 0 && c.tapY < 36 && c.tapX > 100 && c.tapX < 220) {
      this.logoTaps = this.logoTaps.filter((t) => this.t - t < 3).concat(this.t);
      if (this.logoTaps.length >= 5) {
        this.dev = !this.dev; this.logoTaps = []; save('foocat.dev', this.dev ? 1 : 0);
        this.notice = { text: this.dev ? 'MODE DÉVELOPPEUR ACTIVÉ' : 'MODE DÉVELOPPEUR DÉSACTIVÉ', t: 0 };
        this.sfx.play('pickup'); this.titleMenu();
      }
      return;
    }
    const n = C.LEVELS.length, menu = this.menu!, act = this.titleActions[menu.idx];
    const devRow = this.dev && c.tapX >= 0 && c.tapY >= 145 && c.tapY < 159;
    // gauche/droite : change le mode sur la ligne MODE, le niveau ailleurs (mode développeur)
    let lr = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (devRow) lr = c.tapX < 210 ? -1 : 1;
    if (lr) {
      if (act === 'mode' && !devRow) this.toggleMode();
      else if (this.dev) { this.choice = (this.choice + lr + n) % n; this.sfx.play('swap'); this.titleMenu(); }
      return;
    }
    const i = menu.handle(c);
    if (i < 0) return;
    const a = this.titleActions[i], sv = this.saved;
    if (a === 'mode') this.toggleMode();
    else if (a === 'scores') { this.highlight = null; this.openScores('title'); }
    else if (a === 'succes') { this.sel = 0; this.go('succes'); }
    else if (a === 'skins') { this.sel = Math.max(0, SKINS.findIndex((s) => s.id === this.skin)); this.go('skins'); }
    else if (a === 'settings') this.openSettings('title');
    else if (a === 'continue' && sv) { this.devRun = false; this.startLevel(sv.level, sv.carry); }
    else if (this.dev && this.choice === STORY_BEFORE) { this.devRun = true; this.openStory(); }
    else { this.devRun = this.dev && this.choice > 0; this.startLevel(this.dev ? this.choice : 0); }
  }

  private toggleMode() {
    this.mode = MODES[(MODES.indexOf(this.mode) + 1) % MODES.length];
    this.sfx.play('swap'); this.titleMenu();
  }

  // ---------- histoire illustrée ----------
  private openStory(carry?: Carry) {
    this.story.idx = 0; this.story.carry = carry;
    if (!this.story.scenes.length) this.story.scenes = STORY.map((p) => FC.scenes[p.scene]());
    this.go('story'); this.sfx.music?.('title');
  }
  private drawStory(scr: Pix) {
    scr.d.fill(0); scr.rect(0, 0, C.W, C.H, P.K);
    const sc = this.story.scenes[this.story.idx], panel = this.story.pix ?? (this.story.pix = new FC.Pix(150, 84));
    sc.draw(panel, this.stateT + this.story.idx * 3);
    scr.rect(8, 2, 304, 172, P.W); // bord blanc de la case de BD
    scr.blit(panel.scale(2), 10, 4);
    const lines = wrap(STORY[this.story.idx].text, 284);
    const by = 172 - lines.length * 8 - 6;
    scr.rect(14, by, 292, lines.length * 8 + 6, P.y); scr.rect(14, by, 292, 1, P.K); scr.rect(14, by + lines.length * 8 + 5, 292, 1, P.K);
    lines.forEach((l, i) => center(scr, l, by + 4 + i * 8, P.K));
    FC.text(scr, (this.story.idx + 1) + '/' + STORY.length, 16, 8, P.W, { outline: P.K });
    if (this.stateT > 0.6 && this.t % 1.2 < 0.8) FC.text(scr, this.touch ? 'TOUCHE >' : 'ENTRÉE >', 266, 8, P.W, { outline: P.K });
  }

  // ---------- pause ----------
  private openPause() {
    this.go('pause', ['REPRENDRE', 'RECOMMENCER LE NIVEAU', 'RÉGLAGES', "QUITTER : RETOUR À L'ACCUEIL"], 46);
    this.sfx.play('pause'); this.sfx.pauseMusic?.(true);
  }
  private resume() { this.state = 'play'; this.menu = null; this.sfx.play('pause'); this.sfx.pauseMusic?.(false); }
  // met le jeu en pause (onglet caché, appel...)
  pause() { if (this.state === 'play') this.openPause(); }

  // ---------- réglages ----------
  private applySettings() {
    this.sfx.setVolumes?.(this.settings.music / 10, this.settings.sfx / 10);
    this.sfx.setVibrate?.(this.settings.vibrate);
  }
  private openSettings(from: 'title' | 'pause') { this.settingsFrom = from; this.sel = 0; this.state = 'settings'; this.stateT = 0; }
  private closeSettings() {
    if (this.settingsFrom === 'pause') { this.state = 'pause'; this.stateT = 0; this.openPauseMenuOnly(); } else this.go('title');
  }
  private openPauseMenuOnly() { this.menu = new Menu(['REPRENDRE', 'RECOMMENCER LE NIVEAU', 'RÉGLAGES', "QUITTER : RETOUR À L'ACCUEIL"], 46); this.menu.idx = 2; }
  private changeSetting(row: number, d: number) {
    const key = SETTING_ROWS[row].key, s = this.settings;
    if (key === 'back') return this.closeSettings();
    if (key === 'music' || key === 'sfx') s[key] = Math.max(0, Math.min(10, s[key] + d));
    else s[key] = !s[key];
    saveSettings(s); this.applySettings(); this.settingsVersion++;
    this.sfx.play('swap');
  }
  private updateSettings(c: AppInput) {
    const n = SETTING_ROWS.length;
    if (c.pause) return this.closeSettings();
    if (c.up) this.sel = (this.sel + n - 1) % n;
    if (c.down) this.sel = (this.sel + 1) % n;
    if (c.left || c.right) this.changeSetting(this.sel, c.right ? 1 : -1);
    else if (c.confirm) this.changeSetting(this.sel, 1);
    if (c.tapX >= 0) {
      const row = Math.floor((c.tapY - 40 + 5) / 15);
      if (row < 0 || row >= n) return;
      this.sel = row;
      this.changeSetting(row, c.tapX < 210 ? -1 : 1); // à gauche : moins, à droite : plus
    }
  }

  // ---------- écran des succès ----------
  private updateSucces(c: AppInput) {
    const n = ACHIEVEMENTS.length;
    if (c.up) this.sel = (this.sel + n - 1) % n;
    if (c.down) this.sel = (this.sel + 1) % n;
    if (c.tapX >= 0) {
      const row = Math.floor((c.tapY - 24 + 2) / 9);
      if (row >= 0 && row < n && c.tapY < 140) this.sel = row; else this.go('title');
      return;
    }
    if (this.stateT > 0.3 && (c.confirm || c.pause)) this.go('title');
  }

  // ---------- écran des soucoupes ----------
  private equip(i: number) {
    const s = SKINS[i];
    if (!this.skinOpen(s.id)) { this.sfx.play('hurt'); return; }
    this.skin = s.id; saveSkin(s.id); setHeroSkin(s.id); this.sfx.play('pickup');
  }
  private updateSkins(c: AppInput) {
    const n = SKINS.length;
    if (c.left) this.sel = (this.sel + n - 1) % n;
    if (c.right) this.sel = (this.sel + 1) % n;
    if (c.up || c.down) this.sel = (this.sel + 4) % n;
    if (c.tapX >= 0) {
      const col = Math.floor((c.tapX - 16) / 72), row = Math.floor((c.tapY - 26) / 56);
      if (col >= 0 && col < 4 && row >= 0 && row < 2 && c.tapY < 138) {
        const i = row * 4 + col;
        if (i === this.sel) this.equip(i); else { this.sel = i; this.sfx.play('swap'); }
      } else this.go('title');
      return;
    }
    if (c.confirm && this.stateT > 0.3) this.equip(this.sel);
    if (c.pause) this.go('title');
  }

  // ---------- dessin ----------
  draw(scr: Pix) {
    this.drawScreen(scr);
    this.drawToast(scr);
  }

  private drawScreen(scr: Pix) {
    if (this.state === 'scores') return this.drawScores(scr);
    if (this.state === 'settings') return this.drawSettings(scr);
    if (this.state === 'succes') return this.drawSucces(scr);
    if (this.state === 'skins') return this.drawSkins(scr);
    if (this.state === 'story') return this.drawStory(scr);
    if (this.state === 'title' || !this.world) return this.drawTitle(scr);
    const w = this.world;
    if (this.state === 'end') return this.drawEnd(scr);
    drawWorld(scr, w);
    if (this.state === 'play' && w.t < 2.6 && Math.floor(w.t * 4) % 4 !== 3) {
      center(scr, 'NIVEAU ' + w.level.num, 64, P.W, { sc: 2, outline: P.K });
      center(scr, w.level.name, 84, P.q, { outline: P.K });
    }
    if (this.state === 'name') { // derrière le formulaire du pseudonyme
      scr.rect(0, 0, C.W, C.H, FC.alpha(P.K, 190));
      center(scr, 'NOUVEAU RECORD !', 150, P.y, { sc: 2, outline: P.P });
    }
    if (this.state === 'pause') {
      scr.rect(0, 14, C.W, C.H - 14, FC.alpha(P.K, 170));
      center(scr, 'PAUSE', 22, P.W, { sc: 3, outline: P.U });
      this.menu!.draw(scr, this.t);
      center(scr, 'LES ARMES', 98, P.W);
      const rows: [string, string, string][] = [
        ['icoVerm', 'VERMICELLES', 'RAPIDES, EN ÉVENTAIL'],
        ['icoDrag', 'DRAGIBUS', 'LOURDS, ILS REBONDISSENT'],
        ['icoPinata', 'PIÑATA', 'ÉCLATE EN PETITS BONBONS'],
        ['icoRain', 'ARC-EN-CIEL', 'INFINI, TRAVERSE TOUT'],
        ['icoJaw', 'CASSE-DENTS', 'FAIT EXPLOSER UN OBSTACLE'],
      ];
      rows.forEach(([ico, name, desc], i) => {
        const y = 109 + i * 10;
        scr.blit(FC.spr(ico), 64, y - 1);
        FC.text(scr, name, 76, y, P.y);
        FC.text(scr, desc, 128, y, P.W);
      });
      if (!this.touch) center(scr, 'ÉCHAP : REPRENDRE · M : SON · 1 À 4 : ARMES', 162, P.v);
    }
    if (this.state === 'over') {
      scr.rect(0, 14, C.W, C.H - 14, FC.alpha(P.K, Math.min(170, this.stateT * 300)));
      center(scr, 'GAME OVER', 46, P.P, { sc: 3, outline: P.K });
      if (this.highlight && this.highlight.mode === this.mode) center(scr, 'TU ES ' + (this.highlight.rank === 1 ? '1ER' : this.highlight.rank + 'E') + ' AU TABLEAU DES SCORES !', 110, P.y, { outline: P.K });
      center(scr, 'SCORE ' + w.score, 82, P.W);
      center(scr, 'MEILLEUR ' + this.best, 94, P.y);
      if (this.stateT > 1) this.menu!.draw(scr, this.t);
    }
    if (this.state === 'done') this.drawBilan(scr, w);
  }

  private drawBilan(scr: Pix, w: World) {
    const next = C.LEVELS[w.levelIndex + 1], b = this.bilan, T = this.stateT;
    scr.rect(0, 14, C.W, C.H - 14, FC.alpha(P.K, Math.min(180, T * 300)));
    center(scr, w.level.boss ? 'VICTOIRE !' : 'NIVEAU ' + w.level.num + ' TERMINÉ !', 18, P.y, { sc: 2, outline: P.K });
    if (b) {
      // les étoiles apparaissent une à une
      for (let i = 0; i < 3; i++) {
        if (T < 0.3 + i * 0.35) continue;
        const st = FC.star(i < b.stars ? 'y' : 'M').scale(3);
        scr.blit(st, 128 + i * 22, 32);
      }
      const min = Math.floor(b.time / 60), sec = String(Math.floor(b.time % 60)).padStart(2, '0');
      const rows: [string, string][] = [
        ['ENNEMIS VAINCUS', String(b.kills)], ['PRÉCISION DES TIRS', b.acc + ' %'], ['BONUS RAMASSÉS', String(b.bonuses)],
        ['COUPS REÇUS', String(b.hits)], ['TEMPS', min + ':' + sec],
      ];
      rows.forEach(([label, val], i) => {
        if (T < 1.2 + i * 0.12) return;
        FC.text(scr, label, 86, 56 + i * 9, P.v);
        right(scr, val, 234, 56 + i * 9, P.W);
      });
    }
    center(scr, 'SCORE ' + w.score + ' · MEILLEUR ' + this.best, 106, P.y);
    center(scr, b && b.stars < 3 ? (b.stars < 2 ? '2 ÉTOILES : 4 COUPS REÇUS AU PLUS' : '3 ÉTOILES : 1 COUP REÇU AU PLUS') : 'PARFAIT !', 117, P.v);
    center(scr, next ? 'PROCHAIN : NIVEAU ' + next.num + ' · ' + next.name : (w.level.next ?? 'BRAVO !'), 130, P.q);
    if (T > 1) this.menu!.draw(scr, this.t);
  }

  private drawToast(scr: Pix) {
    const toast = this.toasts[0];
    if (!toast || this.state === 'name') return;
    // une seule ligne : en bas pendant la partie, tout en haut ailleurs (pour ne pas cacher les menus)
    const full = toast.title + ' · ' + toast.sub, text = FC.textWidth(full) <= C.W - 12 ? full : toast.title;
    const play = this.state === 'play', slide = Math.min(1, toast.t * 6, (3.2 - toast.t) * 6);
    const y = play ? Math.round(C.H - 12 + (1 - slide) * 14) : Math.round(-(1 - slide) * 14);
    scr.rect(0, y, C.W, 12, FC.alpha(P.K, 230)); scr.rect(0, play ? y : y + 11, C.W, 1, P.y);
    center(scr, text, y + 4, P.y);
  }

  private drawBack(scr: Pix) { FC.text(scr, '< RETOUR', 8, 170, P.v, { outline: P.K }); }

  private drawSettings(scr: Pix) {
    this.drawTitleBackground(scr);
    center(scr, 'RÉGLAGES', 10, P.y, { sc: 2, outline: P.P });
    const s = this.settings;
    SETTING_ROWS.forEach((r, i) => {
      const y = 40 + i * 15, on = i === this.sel;
      if (on) scr.rect(28, y - 4, 264, 13, FC.alpha(P.P, 170));
      if (r.key === 'back') { center(scr, 'RETOUR', y, on ? P.W : P.v); return; }
      FC.text(scr, r.label, 40, y, on ? P.W : P.v, { outline: P.K });
      FC.text(scr, '<', 196, y, P.y); FC.text(scr, '>', 278, y, P.y);
      if (r.key === 'music' || r.key === 'sfx') {
        for (let k = 0; k < 10; k++) scr.rect(204 + k * 7, y, 5, 5, k < s[r.key] ? (k < 7 ? P.g : k < 9 ? P.y : P.P) : P.k);
      } else center(scr, s[r.key] ? 'OUI' : 'NON', y, s[r.key] ? P.g : P.M, {}, 239);
    });
    center(scr, this.touch ? 'TOUCHE À GAUCHE OU À DROITE POUR CHANGER' : 'HAUT/BAS : CHOISIR · GAUCHE/DROITE : CHANGER · ÉCHAP : RETOUR', 140, P.v);
    if (s.leftHanded) center(scr, 'GAUCHER : JOYSTICK À DROITE, BOUTONS À GAUCHE', 152, P.q);
    if (s.autoFire) center(scr, 'TIR AUTOMATIQUE : ATTENTION, IL USE LES MUNITIONS !', 162, P.q);
  }

  private drawSucces(scr: Pix) {
    this.drawTitleBackground(scr);
    center(scr, 'SUCCÈS ' + this.unlocked.size + '/' + ACHIEVEMENTS.length, 6, P.y, { sc: 2, outline: P.P });
    ACHIEVEMENTS.forEach((a, i) => {
      const y = 24 + i * 9, got = this.unlocked.has(a.id), on = i === this.sel;
      if (on) scr.rect(30, y - 2, 262, 9, FC.alpha(P.P, 170));
      scr.rect(34, y, 5, 5, got ? P.g : P.k);
      if (got) { scr.put(35, y + 2, P.W); scr.put(36, y + 3, P.W); scr.put(37, y + 1, P.W); }
      FC.text(scr, a.name, 44, y, got ? P.W : P.M);
      if (a.goal && !got) right(scr, Math.min(this.stats[a.goal.stat], a.goal.n) + '/' + a.goal.n, 288, y, P.q);
      else if (a.skin) { // mini-soucoupe à la couleur gagnée
        const sk = SKINS.find((k) => k.id === a.skin)!, col = sk.rainbow ? P.P : FC.col(sk.frosting![0]);
        scr.ell(284, y + 3, 5, 2.4, FC.alpha(col, got ? 255 : 80)); scr.ell(284, y + 1, 2.5, 2, FC.alpha(P.c, got ? 255 : 80));
      }
    });
    const a = ACHIEVEMENTS[this.sel], skin = a.skin && SKINS.find((s) => s.id === a.skin);
    scr.rect(20, 142, 280, 24, FC.alpha(P.K, 200));
    center(scr, a.desc, 146, P.W);
    center(scr, skin ? 'RÉCOMPENSE : SOUCOUPE ' + skin.name : (this.unlocked.has(a.id) ? 'RÉUSSI !' : ''), 156, P.y);
    this.drawBack(scr);
  }

  private drawSkins(scr: Pix) {
    this.drawTitleBackground(scr);
    center(scr, 'SOUCOUPES', 6, P.y, { sc: 2, outline: P.P });
    SKINS.forEach((s, i) => {
      const x = 16 + (i % 4) * 72, y = 26 + Math.floor(i / 4) * 56, open = this.skinOpen(s.id);
      if (s.id === this.skin) scr.rect(x + 2, y, 68, 52, FC.alpha(P.P, 90));
      if (i === this.sel) { scr.rect(x + 2, y, 68, 1, P.y); scr.rect(x + 2, y + 51, 68, 1, P.y); scr.rect(x + 2, y, 1, 52, P.y); scr.rect(x + 69, y, 1, 52, P.y); }
      scr.blit(heroSprite(s.id, Math.floor(this.t * 5) % 4), x + 16, y + 6, false, open ? 1 : 0.25);
      center(scr, open ? s.name : '???', y + 42, open ? P.W : P.M, {}, x + 36);
    });
    const s = SKINS[this.sel], open = this.skinOpen(s.id), a = skinUnlockedBy(s.id);
    center(scr, s.name, 142, P.y, { outline: P.K });
    const line = !open ? 'À GAGNER AVEC LE SUCCÈS : ' + (a ? a.name : '')
      : s.id === this.skin ? "C'EST TA SOUCOUPE !" : (this.touch ? 'TOUCHE-LA ENCORE POUR LA CHOISIR' : 'ENTRÉE POUR LA CHOISIR');
    center(scr, line, 154, open ? P.q : P.v, { outline: P.K });
    this.drawBack(scr);
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

  private drawScores(scr: Pix) {
    this.drawTitleBackground(scr);
    const t = this.t, a = Math.floor(t * 3) % 2, list = loadScores(this.scoresMode);
    center(scr, 'MEILLEURS SCORES', 8, P.y, { sc: 2, outline: P.P });
    center(scr, 'MODE ' + MODE_NAMES[this.scoresMode], 30, this.scoresMode === 'normal' ? P.b : P.P, { outline: P.K });
    FC.text(scr, '<', 100 - a, 30, P.y, { outline: P.K }); FC.text(scr, '>', 216 + a, 30, P.y, { outline: P.K });
    if (!list.length) center(scr, 'PAS ENCORE DE SCORE : À TOI DE JOUER !', 90, P.W, { outline: P.K });
    const medal = [P.y, P.m, P.o];
    list.forEach((e, i) => {
      const y = 46 + i * 11, hl = this.highlight && this.highlight.mode === this.scoresMode && this.highlight.rank === i + 1;
      if (hl && Math.floor(t * 4) % 4) scr.rect(56, y - 2, 208, 9, FC.alpha(P.P, 170));
      const c = hl ? P.W : medal[i] ?? P.v;
      right(scr, (i + 1) + '.', 76, y, c, { outline: P.K });
      FC.text(scr, e.name, 82, y, P.W, { outline: P.K });
      FC.text(scr, e.won ? 'FIN' : 'NIV.' + e.level, 172, y, P.q, { outline: P.K });
      right(scr, String(e.score), 262, y, c, { outline: P.K });
    });
    if (this.stateT > 0.5 && t % 1.2 < 0.8) center(scr, this.touch ? 'TOUCHE POUR CONTINUER' : 'ENTRÉE POUR CONTINUER', 166, P.W, { outline: P.K });
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
    scr.blit(logo, Math.round((C.W - logo.w) / 2), 4);
    center(scr, "LE CHAT LICORNE DE L'ESPACE", 37, P.q, { shadow: P.U });
    // le chat licorne à gauche, le menu à droite
    const f = Math.floor(t * 5) % 4, key = this.skin + f;
    if (!this.bigHero[key]) this.bigHero[key] = heroSprite(this.skin, f).scale(2);
    const big = this.bigHero[key], by = Math.round(Math.sin(t * 2.4) * 2), hx = 16, hy = 62 + by;
    FC.trail(scr, hx + 8, hy + 48, t, true);
    scr.blit(big, hx, hy);
    if (!this.menu) this.titleMenu();
    this.menu!.draw(scr, t);
    if (this.dev) { // ligne réservée au mode développeur
      const a = Math.floor(t * 3) % 2;
      center(scr, 'DEV · NIV.' + (this.choice + 1) + ' · ' + C.LEVELS[this.choice].name, 150, P.o, { outline: P.K }, 210);
      FC.text(scr, '<', 128 - a, 150, P.o, { outline: P.K }); FC.text(scr, '>', 290 + a, 150, P.o, { outline: P.K });
    }
    if (this.notice) center(scr, this.notice.text, 160, P.y, { outline: P.K });
    center(scr, 'MEILLEUR SCORE (' + MODE_NAMES[this.mode] + ') ' + this.best, 170, P.y);
  }
}
