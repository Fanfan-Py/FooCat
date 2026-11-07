// Les écrans du jeu : accueil, partie, pause, réglages, bilan de fin de niveau, game over, fin,
// tableau des scores, succès et soucoupes.
import { FC, Pix } from '../art';
import * as C from './config';
import { World, Controls, Sfx, Carry } from './world';
import { drawWorld, setHeroSkin } from './draw';
import { loadScores, qualifies, addScore, cleanName, checkName } from './scores';
import { GameMode, endlessZone, dailySetup, today } from './modes';
import {
  Settings, loadSettings, saveSettings, Stats, loadStats, saveStats, ACHIEVEMENTS, loadUnlocked, saveUnlocked,
  loadStars, saveStars, SKINS, skinUnlockedBy, loadSkin, saveSkin, heroSprite,
  CATS, catUnlockedBy, loadCat, saveCat, totalStars, SPECIALS,
} from './rewards';
import { SECRETS, SecretId, loadSecrets, saveSecrets, secretForCode, isDevCode } from './secrets';
import { Invasion } from './invasion';
import { Casse, TABLEAUX } from './casse';

const P = FC.P;
export interface AppInput extends Controls {
  confirm: boolean; pause: boolean;
  left: boolean; right: boolean; up: boolean; down: boolean; // flèches appuyées (menus)
  tapX: number; tapY: number; // endroit touché dans l'écran de jeu (-1 si rien)
}

type After = 'over' | 'end' | 'title';
type State = 'title' | 'play' | 'pause' | 'over' | 'done' | 'end' | 'name' | 'scores' | 'settings' | 'succes' | 'skins' | 'story'
  | 'mini' | 'code' | 'bossSel'; // mini : un niveau secret ; code : l'écran du code secret ; bossSel : le choix du mode boss
function loadText(key: string): string { try { return localStorage.getItem(key) || ''; } catch { return ''; } }
function load(key: string): number { try { return Number(localStorage.getItem(key)) || 0; } catch { return 0; } }
function save(key: string, n: number) { try { localStorage.setItem(key, String(n)); } catch { /* stockage indisponible */ } }
function saveText(key: string, v: string) { try { localStorage.setItem(key, v); } catch { /* stockage indisponible */ } }
// temps au format 1:42
function clock(sec: number) { return Math.floor(sec / 60) + ':' + String(Math.floor(sec % 60)).padStart(2, '0'); }

function center(scr: Pix, s: string, y: number, c: number[], o: any = {}, cx = C.W / 2) {
  FC.text(scr, s, Math.round(cx - FC.textWidth(s, o.sc || 1) / 2), y, c, o);
}
function right(scr: Pix, s: string, x: number, y: number, c: number[], o: any = {}) { FC.text(scr, s, x - FC.textWidth(s), y, c, o); }

const BASE_MODES: GameMode[] = ['facile', 'normal', 'difficile', 'infini', 'defi'];
const MODE_NAMES: Record<GameMode, string> = {
  facile: 'FACILE', normal: 'NORMAL', difficile: 'DIFFICILE', infini: 'INFINI', defi: 'DÉFI DU JOUR',
  invasion: 'INVASION', casse: 'CASSE-BONBONS', boss: 'BOSS',
};
// mode boss : les 3 boss (et le succès qui dit qu'on l'a déjà vaincu)
const BOSSES = [{ name: 'ARAIGNÉE DE FER', ach: 'boss' }, { name: 'POISSON SQUELETTE', ach: 'skel' }, { name: 'SCORPION DE FEU', ach: 'scorp' }];

// Le 28 octobre 2026, l'ancien mode « normal » est devenu « facile » et l'ancien « difficile » est devenu « normal » :
// on déplace une seule fois la partie en cours, les scores, les meilleurs scores et les étoiles.
function migrateModes() {
  try {
    const ls = localStorage;
    if (ls.getItem('foocat.modes.v2')) return;
    const move = (from: string, to: string) => { const v = ls.getItem(from); if (v !== null) { ls.setItem(to, v); ls.removeItem(from); } };
    move('foocat.save.normal', 'foocat.save.facile'); move('foocat.save.difficile', 'foocat.save.normal');
    move('foocat.scores.normal', 'foocat.scores.facile'); move('foocat.scores.difficile', 'foocat.scores.normal');
    move('foocat.best', 'foocat.best.facile'); move('foocat.best.difficile', 'foocat.best.normal');
    const stars = JSON.parse(ls.getItem('foocat.stars') || '{}'), out: Record<string, number> = {};
    for (const [k, n] of Object.entries(stars)) out[k.replace(/^normal-/, 'facile-').replace(/^difficile-/, 'normal-')] = n as number;
    ls.setItem('foocat.stars', JSON.stringify(out));
    ls.setItem('foocat.modes.v2', '1');
  } catch { /* stockage indisponible */ }
}
// le défi du jour a un tableau des scores par jour
function scoreKey(m: GameMode) { return m === 'defi' ? 'defi.' + today() : m; }
const THEMES = ['space', 'nebula', 'planet', 'iron', 'iron', 'space', 'ocean', 'ocean', 'castle', 'castle', 'approach', 'approach', 'vulcano', 'cave', 'cave', 'ship'];

// histoires en BD, montrées avant certains niveaux (numéro du niveau en partant de 0)
type Panel = { scene: string; text: string };
const STORY_AQUA: Panel[] = [
  { scene: 'story1', text: "L'ARAIGNÉE DE FER EST VAINCUE ! LE CHAT LICORNE S'ÉCHAPPE DE LA FORTERESSE." },
  { scene: 'storyParty', text: "VICTOIRE ! SUR LA PLANÈTE PÂTISSERIE, C'EST LA FÊTE : UN FEU D'ARTIFICE DE BONBONS POUR LE CHAT LICORNE !" },
  { scene: 'story2', text: "DANS L'ESPACE FLOTTE UNE BOUTEILLE... À L'INTÉRIEUR, UN MESSAGE : AU SECOURS !" },
  { scene: 'story3', text: 'UNE PLANÈTE AQUATIQUE EST MENACÉE PAR LE TERRIBLE POISSON SQUELETTE DE LA MORT.' },
  { scene: 'story4', text: "LE CHAT LICORNE N'HÉSITE PAS : CAP SUR L'OCÉAN DES ÉTOILES ! PLOUF !" },
];
const STORY_VULCANO: Panel[] = [
  { scene: 'story5', text: 'LA PLANÈTE AQUATIQUE EST SAUVÉE ! MÉDUSES ET POISSONS FONT LA FÊTE AVEC LE CHAT LICORNE.' },
  { scene: 'story6', text: "UN PETIT PHÉNIX ARRIVE À BOUT DE SOUFFLE, UNE LETTRE DANS LE BEC : AU SECOURS !" },
  { scene: 'story7', text: 'SUR LA PLANÈTE VULCANO, LE SCORPION VOLANT DE FEU FAIT TREMBLER LE VOLCAN.' },
  { scene: 'story8', text: "LE CHAT LICORNE N'HÉSITE PAS UNE SECONDE : CAP SUR VULCANO !" },
];
const STORY_SHIP: Panel[] = [
  { scene: 'story9', text: "L'ARAIGNÉE DE FER, LE POISSON SQUELETTE ET LE SCORPION VOLANT DE FEU S'ALLIENT !" },
  { scene: 'story10', text: 'ENSEMBLE, ILS CONSTRUISENT UN ÉNORME VAISSEAU DE GUERRE.' },
  { scene: 'story11', text: "LE CHAT LICORNE SE GLISSE À L'INTÉRIEUR... LE COMBAT FINAL COMMENCE !" },
];
// la fin du jeu, après les 3 boss du niveau 16
const STORY_END: Panel[] = [
  { scene: 'storyEnd1', text: 'LES TROIS BOSS SONT VAINCUS ! LE VAISSEAU EXPLOSE EN MILLE BONBONS.' },
  { scene: 'storyEnd2', text: "C'EST LA FÊTE DANS TOUTE LA GALAXIE : UNE PLUIE DE BONBONS POUR LE CHAT LICORNE ET SES AMIS !" },
  { scene: 'storyEnd3', text: "LE CHAT LICORNE A SAUVÉ LA GALAXIE. MERCI D'AVOIR JOUÉ !" },
];
const STORIES: Record<number, Panel[]> = { 5: STORY_AQUA, 10: STORY_VULCANO, 15: STORY_SHIP }; // avant les niveaux 6, 11 et 16
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
const SETTING_ROWS: { key: keyof Settings | 'back' | 'code'; label: string }[] = [
  { key: 'music', label: 'MUSIQUE' },
  { key: 'sfx', label: 'EFFETS SONORES' },
  { key: 'autoFire', label: 'TIR AUTOMATIQUE' },
  { key: 'leftHanded', label: 'COMMANDES GAUCHER' },
  { key: 'vibrate', label: 'VIBRATIONS (ANDROID)' },
  { key: 'code', label: 'CODE SECRET' },
  { key: 'back', label: 'RETOUR' },
];

export class App {
  state: State = 'title';
  world: World | null = null;
  // mode développeur : choix du niveau (ou du tableau, de la vague) à l'accueil ; automatique sur l'ordinateur
  // de développement, ou avec un code
  dev = load('foocat.dev') === 1;
  choice = 0; // niveau choisi à l'accueil (mode développeur)
  private miniChoice = { invasion: 0, casse: 0 }; // vague ou tableau de départ choisi (mode développeur)
  mode: GameMode = 'normal';
  private zone = 1; // zone atteinte en mode infini
  private daily = dailySetup();
  touch = false;
  settings: Settings = loadSettings();
  settingsVersion = 0; // augmente à chaque changement (main.ts replace les boutons si besoin)
  private t = 0;
  private stateT = 0;
  private menu: Menu | null = null;
  private devRun = false; // partie lancée depuis le choix du niveau : on ne sauvegarde pas
  private notice: { text: string; t: number } | null = null;
  private levelStart: Carry | null = null; // pour rejouer le niveau après un game over
  private titleActions: string[] = [];
  // tableau des scores
  private pendingScore: { score: number; level: number; won: boolean; then: After } | null = null;
  private scoresThen: After = 'title'; // où aller en quittant le tableau
  private scoresMode: GameMode = 'normal';
  private highlight: { mode: GameMode; rank: number } | null = null;
  lastName = loadText('foocat.name');
  // réglages, succès, soucoupes
  private settingsFrom: 'title' | 'pause' = 'title';
  private sel = 0; // ligne choisie dans les écrans Réglages / Succès / Soucoupes
  private stats: Stats = loadStats();
  private statsDirty = false;
  private lastStatsSave = 0;
  private unlocked = loadUnlocked();
  private skin = loadSkin();
  private cat = loadCat();
  private appTab = 0; // écran Apparence : 0 soucoupe, 1 chat
  private succPage = 0; // écran des succès : page 1 ou 2
  private toasts: { title: string; sub: string; t: number }[] = [];
  private bilan: { stars: number; kills: number; acc: number; bonuses: number; hits: number; time: number } | null = null;
  private titleStars = FC.stars(3, C.W, C.H, 120);
  private bigHero: Record<string, Pix> = {};
  private story = { idx: 0, panels: [] as Panel[], scenes: [] as any[], pix: null as Pix | null, done: () => { } };
  private rushFrom = 0; // niveau 16 : reprendre au boss en cours après un game over
  // récompenses secrètes
  private secrets = loadSecrets();
  private special = loadText('foocat.special'); // personnage secret choisi ('toad', 'ghost') ou ''
  private buddyOn = load('foocat.buddy') === 1; // le petit compagnon
  private mini: Invasion | Casse | null = null; // niveau secret en cours
  private codeMsg: { text: string; ok: boolean; t: number } | null = null;
  private bossSel = 0; // mode boss : 0, 1, 2 (un boss) ou 3 (les 3 à la suite)
  private bossRec: Record<string, number> = (() => { try { return JSON.parse(localStorage.getItem('foocat.bossrec') || '{}') || {}; } catch { return {}; } })();
  private bossResult: { time: number; record: boolean } | null = null;

  constructor(private sfx: Sfx) {
    migrateModes();
    if (!CATS.some((c) => c.id === this.cat) || !this.catOpen(this.cat)) this.cat = 'classic';
    if (this.skin === 'disco' && this.secrets.has('disco')) { /* la soucoupe disco reste */ }
    else if (!SKINS.some((s) => s.id === this.skin) || !this.skinOpen(this.skin)) this.skin = 'classic';
    if (this.special && !this.secrets.has(this.special as SecretId)) this.special = '';
    if (!this.secrets.has('buddy')) this.buddyOn = false;
    setHeroSkin(this.skin, this.heroCat);
    this.stats.stars = totalStars(loadStars()); // (pour les étoiles gagnées avant ce succès)
    this.applySettings();
    this.sfx.music?.('title');
    this.titleMenu();
  }

  get playing() { return this.state === 'play' || this.state === 'mini'; }
  // le personnage affiché : un personnage secret, sinon le chat choisi
  get heroCat() { return this.special || this.cat; }
  private heroFrame = (f: number) => heroSprite(this.skin, f, this.heroCat);
  // les modes proposés à l'accueil (les niveaux secrets et le mode boss quand ils sont débloqués)
  get modes(): GameMode[] {
    const m = BASE_MODES.slice();
    if (this.secrets.has('invasion')) m.push('invasion');
    if (this.secrets.has('casse')) m.push('casse');
    if (BOSSES.some((b) => this.unlocked.has(b.ach))) m.push('boss');
    return m;
  }
  private get scoreModes(): GameMode[] { return this.modes.filter((m) => m !== 'boss'); }

  setDev(on: boolean, remember = false) { this.dev = on; if (remember) save('foocat.dev', on ? 1 : 0); this.titleMenu(); }

  // sauvegarde « Continuer » : le début du dernier niveau atteint, pour chaque mode
  get saveKey() { return 'foocat.save.' + this.mode; }
  get saved(): { level: number; carry: Carry } | null {
    if (this.specialMode) return null;
    try { const v = JSON.parse(localStorage.getItem(this.saveKey) || 'null'); return v && typeof v.level === 'number' ? v : null; } catch { return null; }
  }
  private writeSave(v: { level: number; carry: Carry } | null) {
    try { if (v) localStorage.setItem(this.saveKey, JSON.stringify(v)); else localStorage.removeItem(this.saveKey); } catch { /* stockage indisponible */ }
  }
  get bestKey() { return 'foocat.best.' + scoreKey(this.mode); }
  get best() { const top = loadScores(scoreKey(this.mode))[0]; return Math.max(load(this.bestKey), top ? top.score : 0); }

  private go(s: State, menu: string[] | null = null, y0 = 0) {
    this.state = s; this.stateT = 0;
    this.menu = menu ? new Menu(menu, y0) : null;
    if (s === 'title') { this.sfx.music?.('title'); this.titleMenu(); }
    if (s === 'over') this.sfx.music?.(null);
    if (s === 'end') this.sfx.music?.('victory');
  }
  private startLevel(i: number, carry?: Carry, rushFrom = 0) {
    // on repart toujours avec au moins les vies de départ du mode
    if (carry) carry = { ...carry, lives: Math.max(carry.lives, C.MODES[this.baseMode].lives) };
    this.rushFrom = rushFrom; this.mini = null;
    this.world = new World(this.sfx, { level: i, carry, mode: this.baseMode, rushFrom, buddy: this.buddyOn });
    this.levelStart = this.world.carry();
    if (!this.devRun) this.writeSave(i > 0 ? { level: i, carry: this.levelStart } : null);
    this.go('play'); this.sfx.play('start');
    this.sfx.music?.(THEMES[i] ?? 'space');
  }
  // mode infini et défi du jour
  get specialMode() { return this.mode !== 'facile' && this.mode !== 'normal' && this.mode !== 'difficile'; }
  get baseMode(): C.Mode { return this.mode === 'facile' || this.mode === 'difficile' ? this.mode : 'normal'; }
  private startEndless(zone: number, carry?: Carry) {
    const setup = endlessZone(zone);
    this.zone = zone; this.devRun = false; this.levelStart = null;
    if (zone > this.stats.bestZone) { this.stats.bestZone = zone; this.statsDirty = true; this.checkGoals(); }
    this.mini = null;
    this.world = new World(this.sfx, { setup, carry, buddy: this.buddyOn });
    this.go('play'); this.sfx.play(zone > 1 ? 'level' : 'start');
    this.sfx.music?.(THEMES[setup.levelIndex] ?? 'space');
  }
  private startDaily() {
    this.daily = dailySetup(); // (la date a pu changer depuis l'ouverture du jeu)
    this.devRun = false; this.levelStart = null;
    this.mini = null;
    this.world = new World(this.sfx, { setup: this.daily, seed: this.daily.seed, buddy: this.buddyOn });
    this.go('play'); this.sfx.play('start');
    this.sfx.music?.(THEMES[this.daily.levelIndex] ?? 'space');
  }
  // niveaux secrets
  private startMini(kind: 'invasion' | 'casse') {
    const start = this.dev ? this.miniChoice[kind] + 1 : 1;
    this.devRun = start > 1; this.levelStart = null; this.world = null; // (une partie d'essai ne compte pas)
    this.mini = kind === 'invasion' ? new Invasion(this.sfx, undefined, start) : new Casse(this.sfx, undefined, start);
    this.go('mini'); this.sfx.music?.(kind === 'invasion' ? 'space' : 'nebula');
  }
  // mode boss : un boss (0, 1, 2) ou les 3 à la suite (3)
  private startBoss(sel: number) {
    this.devRun = false; this.levelStart = null; this.mini = null; this.bossResult = null;
    this.world = new World(this.sfx, { mode: 'normal', bossRun: sel === 3 ? { from: 0, to: 2 } : { from: sel, to: sel }, buddy: this.buddyOn });
    this.go('play'); this.sfx.play('start'); this.sfx.music?.('ship');
  }
  private bossOpen(i: number) { return i === 3 ? BOSSES.every((b) => this.unlocked.has(b.ach)) : this.unlocked.has(BOSSES[i].ach); }
  private bossWon(w: World) {
    const time = w.bossTime, key = String(this.bossSel), old = this.bossRec[key];
    const record = !old || time < old;
    if (record) { this.bossRec[key] = time; try { localStorage.setItem('foocat.bossrec', JSON.stringify(this.bossRec)); } catch { /* stockage indisponible */ } }
    this.bossResult = { time, record };
    if (this.statsDirty) { saveStats(this.stats); this.statsDirty = false; }
    this.go('end');
  }
  // le score et le niveau de la partie en cours (niveau secret ou partie normale)
  private get cur(): { score: number; level: number } | null {
    const m = this.mini, w = this.world;
    if (m) return { score: m.score, level: m instanceof Invasion ? m.wave : m.tableau };
    return w ? { score: w.score, level: this.mode === 'infini' ? this.zone : w.level.num } : null;
  }

  // rejouer après un game over (ou depuis la pause)
  private restart() {
    if (this.mode === 'invasion' || this.mode === 'casse') this.startMini(this.mode);
    else if (this.mode === 'boss') this.startBoss(this.bossSel);
    else if (this.mode === 'infini') this.startEndless(1);
    else if (this.mode === 'defi') this.startDaily();
    else if (this.world) this.startLevel(this.world.levelIndex, this.levelStart ?? undefined, this.rushFrom);
  }
  private record() { const c = this.cur; if (c && this.mode !== 'boss' && c.score > this.best) save(this.bestKey, c.score); }

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
        if (w.state === 'cleared' && w.stateT > 3) {
          if (this.mode === 'infini') { this.record(); this.startEndless(this.zone + 1, w.carry()); } // zone suivante, sans pause
          else if (this.mode === 'defi') {
            const day = Number(this.daily.date.replace(/-/g, ''));
            if (this.stats.dailyLast !== day) { this.stats.dailyLast = day; this.stats.dailyWins++; this.statsDirty = true; this.checkGoals(); }
            this.record(); this.sfx.music?.(null); this.afterGame('end', true);
          }
          else if (this.mode === 'boss') this.bossWon(w);
          else this.levelDone(w);
        }
        break;
      case 'mini': {
        const m = this.mini;
        if (!m) return;
        if (c.pause) { this.openPause(); return; }
        m.update(dt, this.settings.autoFire && m instanceof Invasion ? { ...c, fire: true } : c);
        if (m.state === 'over') { this.record(); this.sfx.music?.(null); this.afterGame('over'); }
        break;
      }
      case 'code': if (this.codeMsg) this.codeMsg.t += dt; break; // la saisie se fait dans le formulaire (main.ts)
      case 'bossSel': this.updateBossSel(c); break;
      case 'pause': {
        if (c.pause) { this.resume(); break; }
        const i = this.menu!.handle(c);
        if (i === 0) this.resume();
        else if (i === 1 && (w || this.mini)) this.restart();
        else if (i === 2) this.openSettings('pause');
        else if (i === 3) { this.sfx.pauseMusic?.(false); this.afterGame('title'); }
        break;
      }
      case 'over':
      case 'done': {
        const idle = { dx: 0, dy: 0, fire: false, special: false, swap: false, select: -1 };
        if (this.mini) this.mini.update(dt, idle); else if (w) w.update(dt, idle);
        if (this.stateT < 1 || (!w && !this.mini)) break;
        const i = this.menu!.handle(c);
        if (i === 1) {
          if (this.state === 'done') this.afterGame('title'); // (le score peut entrer au tableau des meilleurs scores)
          else this.go(this.mode === 'boss' ? 'bossSel' : 'title');
        }
        else if (i === 0) {
          if (this.state === 'over') this.restart();
          else if (!w) break;
          else if (STORIES[w.levelIndex + 1] && w.levelIndex + 1 < C.LEVELS.length) this.openStoryBefore(w.levelIndex + 1, w.carry());
          else if (w.levelIndex + 1 < C.LEVELS.length) this.startLevel(w.levelIndex + 1, w.carry());
          else this.openStory(STORY_END, () => this.afterGame('end', true));
        }
        break;
      }
      case 'end':
        if ((c.confirm || c.tapX >= 0) && this.stateT > 1) { if (this.mode === 'boss') this.go('bossSel'); else this.go('title'); }
        break;
      case 'name': break; // la saisie se fait dans le formulaire par-dessus le jeu (main.ts)
      case 'scores': {
        let m = (c.right ? 1 : 0) - (c.left ? 1 : 0);
        if (c.tapX >= 0 && c.tapY < 44) m = c.tapX < 160 ? -1 : 1; // toucher les flèches du haut
        if (m) { const L = this.scoreModes; this.scoresMode = L[(Math.max(0, L.indexOf(this.scoresMode)) + m + L.length) % L.length]; this.sfx.play('swap'); break; }
        if (this.stateT > 0.5 && (c.confirm || c.pause || c.tapX >= 0)) { const then = this.scoresThen; this.scoresThen = 'title'; this.finish(then); }
        break;
      }
      case 'settings': this.updateSettings(c); break;
      case 'succes': this.updateSucces(c); break;
      case 'skins': this.updateSkins(c); break;
      case 'story':
        if (c.pause) { this.story.done(); break; } // Échap : passer l'histoire
        if (this.stateT > 0.6 && (c.confirm || c.tapX >= 0)) {
          if (++this.story.idx >= this.story.panels.length) this.story.done();
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
      else if (ev.type === 'boss') {
        this.unlock(ev.kind === 'skel' ? 'skel' : ev.kind === 'scorp' ? 'scorp' : 'boss'); if (this.mode === 'difficile') this.unlock('hard');
        if (w.stats.livesLost === 0) { // vaincu sans perdre de vie
          if (ev.kind === 'skel') this.stats.cleanSkel = 1; else if (ev.kind === 'scorp') this.stats.cleanScorp = 1; else this.stats.cleanSpider = 1;
          this.stats.cleanBosses = this.stats.cleanSpider + this.stats.cleanSkel + this.stats.cleanScorp;
        }
      }
    }
    w.events = [];
    this.statsDirty = true;
    this.checkGoals();
    if (w.score >= 100000) this.unlock('score100k');
  }
  private checkGoals() { for (const a of ACHIEVEMENTS) if (a.goal && this.stats[a.goal.stat] >= a.goal.n) this.unlock(a.id); }
  private unlock(id: string) {
    if (this.unlocked.has(id)) return;
    const a = ACHIEVEMENTS.find((x) => x.id === id);
    if (!a) return;
    this.unlocked.add(id); saveUnlocked(this.unlocked);
    const skin = a.skin && SKINS.find((s) => s.id === a.skin), cat = a.cat && CATS.find((c) => c.id === a.cat);
    this.toasts.push({ title: 'SUCCÈS : ' + a.name, sub: skin ? 'NOUVELLE SOUCOUPE : ' + skin.name : cat ? 'NOUVEAU CHAT : ' + cat.name : a.desc, t: 0 });
    this.sfx.play('level');
  }
  private skinOpen(id: string) { const a = skinUnlockedBy(id); return !a || this.unlocked.has(a.id); }
  private catOpen(id: string) { const a = catUnlockedBy(id); return !a || this.unlocked.has(a.id); }

  // ---------- fin de niveau : bilan et étoiles ----------
  private levelDone(w: World) {
    this.record();
    const s = w.stats, hits = w.hits, stars = hits <= 1 ? 3 : hits <= 4 ? 2 : 1;
    this.bilan = { stars, kills: s.kills, acc: s.shots ? Math.round(s.hitShots / s.shots * 100) : 0, bonuses: s.bonuses, hits, time: w.t };
    const all = loadStars(), key = this.mode + '-' + w.level.num;
    if (stars > (all[key] || 0)) { all[key] = stars; saveStars(all); }
    this.stats.stars = totalStars(all);
    if (w.hits === 0) this.unlock('sansfaute');
    if (w.levelIndex === 0) this.unlock('first');
    if (s.livesLost === 0) this.unlock('nolife');
    if (stars === 3) this.unlock('stars3');
    this.checkGoals();
    saveStats(this.stats); this.statsDirty = false;
    const last = w.levelIndex + 1 >= C.LEVELS.length;
    // le niveau est fait : « Continuer » reprendra au niveau suivant, même si on revient tout de suite à l'accueil
    if (!this.devRun) {
      if (!last) this.writeSave({ level: w.levelIndex + 1, carry: w.carry() });
      else { this.writeSave(null); if (this.mode === 'difficile') this.unlock('nuitnoire'); }
    }
    this.go('done', [last ? 'CONTINUER' : 'NIVEAU SUIVANT', "RETOUR À L'ACCUEIL"], 148);
    this.sfx.music?.(null);
  }

  // ---------- tableau des scores ----------
  // fin d'une partie : si le score entre dans le top 10, on demande le pseudonyme
  private afterGame(then: After, won = false) {
    const cur = this.cur;
    if (this.statsDirty) { saveStats(this.stats); this.statsDirty = false; }
    if (cur && !this.devRun && this.mode !== 'boss' && qualifies(scoreKey(this.mode), cur.score)) {
      this.pendingScore = { score: cur.score, level: cur.level, won: won && this.mode !== 'defi', then };
      this.state = 'name'; this.stateT = 0; this.menu = null;
      this.sfx.play('level');
      return;
    }
    this.finish(then);
  }
  private finish(then: After) {
    if (then === 'over') {
      if (this.mini || this.mode === 'boss') {
        this.go('over', [this.mode === 'boss' ? 'REJOUER LE COMBAT' : 'REJOUER', this.mode === 'boss' ? 'CHOISIR UN AUTRE BOSS' : "RETOUR À L'ACCUEIL"], 124);
        this.stateT = 1; return;
      }
      const w = this.world!;
      if (w.level.boss === 'rush' && w.boss) this.rushFrom = w.rushIdx; // on reprendra au boss en cours
      const again = this.mode === 'infini' ? 'REJOUER' : this.mode === 'defi' ? 'REJOUER LE DÉFI' : this.rushFrom > 0 ? 'REJOUER : BOSS ' + (this.rushFrom + 1) + '/3' : 'REJOUER LE NIVEAU ' + w.level.num;
      this.go('over', [again, "RETOUR À L'ACCUEIL"], 124);
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
    const rank = addScore(scoreKey(this.mode), { name, score: p.score, level: p.level, won: p.won, date: new Date().toISOString().slice(0, 10) });
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
    this.daily = dailySetup(); // le défi change à minuit
    const sv = this.saved, items: string[] = [], acts: string[] = [];
    const add = (label: string, act: string) => { items.push(label); acts.push(act); };
    if (sv) add('CONTINUER : NIVEAU ' + (sv.level + 1), 'continue');
    add(this.mode === 'infini' ? 'JOUER EN MODE INFINI' : this.mode === 'defi' ? 'JOUER LE DÉFI DU JOUR'
      : this.mode === 'invasion' ? "JOUER : L'INVASION" : this.mode === 'casse' ? 'JOUER : CASSE-BONBONS' : this.mode === 'boss' ? 'CHOISIR UN BOSS'
      : this.dev ? 'JOUER LE NIVEAU ' + (this.choice + 1) : 'NOUVELLE PARTIE', 'new');
    add('MODE : ' + MODE_NAMES[this.mode], 'mode');
    add('MEILLEURS SCORES', 'scores');
    add('SUCCÈS ' + this.unlocked.size + '/' + ACHIEVEMENTS.length, 'succes');
    add('APPARENCE', 'skins');
    add('RÉGLAGES', 'settings');
    this.titleActions = acts;
    const idx = this.menu && this.state === 'title' ? Math.min(this.menu.idx, items.length - 1) : 0;
    this.menu = new Menu(items, 56, 13, 210);
    this.menu.idx = idx;
  }

  private updateTitle(c: AppInput) {
    if (this.notice && (this.notice.t += 1 / 60) > 2.5) this.notice = null;
    const n = C.LEVELS.length, menu = this.menu!, act = this.titleActions[menu.idx];
    const devRow = this.dev && this.mode !== 'boss' && this.mode !== 'infini' && this.mode !== 'defi' && c.tapX >= 0 && c.tapY >= 145 && c.tapY < 159;
    // gauche/droite : change le mode sur la ligne MODE, le niveau ailleurs (mode développeur)
    let lr = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (devRow) lr = c.tapX < 210 ? -1 : 1;
    if (lr) {
      if (act === 'mode' && !devRow) this.toggleMode();
      else if (this.dev && (this.mode === 'casse' || this.mode === 'invasion')) { // tableau ou vague de départ
        const m = this.mode, max = m === 'casse' ? TABLEAUX.length : 30;
        this.miniChoice[m] = (this.miniChoice[m] + lr + max) % max; this.sfx.play('swap');
      }
      else if (this.dev) { this.choice = (this.choice + lr + n) % n; this.sfx.play('swap'); this.titleMenu(); }
      return;
    }
    const i = menu.handle(c);
    if (i < 0) return;
    const a = this.titleActions[i], sv = this.saved;
    if (a === 'mode') this.toggleMode();
    else if (a === 'scores') { this.highlight = null; this.openScores('title'); }
    else if (a === 'succes') { this.sel = 0; this.succPage = 0; this.go('succes'); }
    else if (a === 'skins') this.openApparence();
    else if (a === 'settings') this.openSettings('title');
    else if (a === 'continue' && sv) { this.devRun = false; this.startLevel(sv.level, sv.carry); }
    else if (this.mode === 'invasion' || this.mode === 'casse') this.startMini(this.mode);
    else if (this.mode === 'boss') { this.bossSel = Math.max(0, [0, 1, 2].find((i) => this.bossOpen(i)) ?? 0); this.go('bossSel'); }
    else if (this.mode === 'infini') this.startEndless(1);
    else if (this.mode === 'defi') this.startDaily();
    else if (this.dev && STORIES[this.choice]) { this.devRun = true; this.openStoryBefore(this.choice); }
    else { this.devRun = this.dev && this.choice > 0; this.startLevel(this.dev ? this.choice : 0); }
  }

  private toggleMode() {
    const L = this.modes;
    this.mode = L[(Math.max(0, L.indexOf(this.mode)) + 1) % L.length];
    this.sfx.play('swap'); this.titleMenu();
  }

  // ---------- histoire illustrée ----------
  private openStoryBefore(level: number, carry?: Carry) { this.openStory(STORIES[level], () => this.startLevel(level, carry)); }
  private openStory(panels: Panel[], done: () => void) {
    this.story = { ...this.story, idx: 0, panels, done, scenes: panels.map((p) => FC.scenes[p.scene]()) };
    this.go('story'); this.sfx.music?.('title');
  }
  private drawStory(scr: Pix) {
    scr.d.fill(0); scr.rect(0, 0, C.W, C.H, P.K);
    const sc = this.story.scenes[this.story.idx], panel = this.story.pix ?? (this.story.pix = new FC.Pix(150, 84));
    sc.draw(panel, this.stateT + this.story.idx * 3);
    scr.rect(8, 2, 304, 172, P.W); // bord blanc de la case de BD
    scr.blit(panel.scale(2), 10, 4);
    const lines = wrap(this.story.panels[this.story.idx].text, 284);
    const by = 172 - lines.length * 8 - 6;
    scr.rect(14, by, 292, lines.length * 8 + 6, P.y); scr.rect(14, by, 292, 1, P.K); scr.rect(14, by + lines.length * 8 + 5, 292, 1, P.K);
    lines.forEach((l, i) => center(scr, l, by + 4 + i * 8, P.K));
    FC.text(scr, (this.story.idx + 1) + '/' + this.story.panels.length, 16, 8, P.W, { outline: P.K });
    if (this.stateT > 0.6 && this.t % 1.2 < 0.8) FC.text(scr, this.touch ? 'TOUCHE >' : 'ENTRÉE >', 266, 8, P.W, { outline: P.K });
  }

  // ---------- pause ----------
  private openPause() {
    this.go('pause', ['REPRENDRE', this.mini ? 'RECOMMENCER' : 'RECOMMENCER LE NIVEAU', 'RÉGLAGES', "QUITTER : RETOUR À L'ACCUEIL"], 46);
    this.sfx.play('pause'); this.sfx.pauseMusic?.(true);
  }
  private resume() { this.state = this.mini ? 'mini' : 'play'; this.menu = null; this.sfx.play('pause'); this.sfx.pauseMusic?.(false); }
  // met le jeu en pause (onglet caché, appel...)
  pause() { if (this.playing) this.openPause(); }

  // ---------- réglages ----------
  private applySettings() {
    this.sfx.setVolumes?.(this.settings.music / 10, this.settings.sfx / 10);
    this.sfx.setVibrate?.(this.settings.vibrate);
  }
  private openSettings(from: 'title' | 'pause') { this.settingsFrom = from; this.sel = 0; this.state = 'settings'; this.stateT = 0; }
  private closeSettings() {
    if (this.settingsFrom === 'pause') { this.state = 'pause'; this.stateT = 0; this.openPauseMenuOnly(); } else this.go('title');
  }
  private openPauseMenuOnly() { this.menu = new Menu(['REPRENDRE', this.mini ? 'RECOMMENCER' : 'RECOMMENCER LE NIVEAU', 'RÉGLAGES', "QUITTER : RETOUR À L'ACCUEIL"], 46); this.menu.idx = 2; }
  private changeSetting(row: number, d: number) {
    const key = SETTING_ROWS[row].key, s = this.settings;
    if (key === 'back') return this.closeSettings();
    if (key === 'code') { this.openCode(); return; }
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

  // ---------- écran des succès (page 1 : les succès ; page 2 : les succès des chats) ----------
  private succList() { return ACHIEVEMENTS.filter((a) => !!a.cat === (this.succPage === 1)); }
  private updateSucces(c: AppInput) {
    const list = this.succList(), n = list.length;
    let page = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    if (c.tapX >= 0 && c.tapY < 32) page = 1; // toucher le haut : changer de page
    if (page) { this.succPage = 1 - this.succPage; this.sel = 0; this.sfx.play('swap'); return; }
    if (c.up) this.sel = (this.sel + n - 1) % n;
    if (c.down) this.sel = (this.sel + 1) % n;
    if (c.tapX >= 0) {
      const row = this.succPage ? Math.floor((c.tapY - 36 + 3) / 17) : Math.floor((c.tapY - 34 + 1) / 7);
      if (row >= 0 && row < n && c.tapY < 142) this.sel = row; else this.go('title');
      return;
    }
    if (this.stateT > 0.3 && (c.confirm || c.pause)) this.go('title');
  }

  // ---------- écran Apparence : onglets soucoupe, chat et spécial (récompenses secrètes) ----------
  private specialOpen(i: number) { return this.secrets.has(SPECIALS[i].id); }
  private specialOn(i: number) {
    const id = SPECIALS[i].id;
    return id === 'buddy' ? this.buddyOn : id === 'disco' ? this.skin === 'disco' && !this.special : this.special === id;
  }
  private equip(i: number) {
    if (this.appTab === 2) { // onglet spécial : on choisit, ou on retire
      const id = SPECIALS[i].id;
      if (!this.specialOpen(i)) { this.sfx.play('hurt'); return; }
      if (id === 'buddy') { this.buddyOn = !this.buddyOn; save('foocat.buddy', this.buddyOn ? 1 : 0); }
      else if (id === 'disco') { const on = this.specialOn(i); this.skin = on ? 'classic' : 'disco'; saveSkin(this.skin); this.special = ''; }
      else this.special = this.special === id ? '' : id;
      saveText('foocat.special', this.special);
    } else if (this.appTab === 1) {
      const k = CATS[i];
      if (!this.catOpen(k.id)) { this.sfx.play('hurt'); return; }
      this.cat = k.id; saveCat(k.id); this.special = ''; saveText('foocat.special', '');
    } else {
      const s = SKINS[i];
      if (!this.skinOpen(s.id)) { this.sfx.play('hurt'); return; }
      this.skin = s.id; saveSkin(s.id); this.special = ''; saveText('foocat.special', '');
    }
    setHeroSkin(this.skin, this.heroCat); this.sfx.play('pickup');
  }
  private openApparence() {
    this.appTab = 1; this.sel = Math.max(0, CATS.findIndex((k) => k.id === this.cat)); this.go('skins');
  }
  private appRow() { // la rangée des choix de l'onglet : nombre, écart, début
    return this.appTab === 2 ? { n: SPECIALS.length, step: 76, x0: 10 } : this.appTab === 1 ? { n: CATS.length, step: 44, x0: 8 } : { n: SKINS.length, step: 39, x0: 4 };
  }
  private updateSkins(c: AppInput) {
    const { n, step, x0 } = this.appRow();
    const tab = (t: number) => {
      this.appTab = t;
      this.sel = t === 2 ? 0 : Math.max(0, t ? CATS.findIndex((k) => k.id === this.cat) : SKINS.findIndex((s) => s.id === this.skin));
      this.sfx.play('swap');
    };
    if (c.left) this.sel = (this.sel + n - 1) % n;
    if (c.right) this.sel = (this.sel + 1) % n;
    if (c.up) tab((this.appTab + 2) % 3);
    else if (c.down) tab((this.appTab + 1) % 3);
    if (c.tapX >= 0) {
      if (c.tapY >= 22 && c.tapY < 38) { const t = c.tapX < 115 ? 0 : c.tapX < 205 ? 1 : 2; if (t !== this.appTab) tab(t); return; }
      const i = Math.floor((c.tapX - x0 + 3) / step);
      if (c.tapY >= 122 && c.tapY < 160 && i >= 0 && i < n) {
        if (i === this.sel) this.equip(i); else { this.sel = i; this.sfx.play('swap'); }
      } else if (c.tapY >= 160 || c.tapY < 22) this.go('title');
      return;
    }
    if (c.confirm && this.stateT > 0.3) this.equip(this.sel);
    if (c.pause) this.go('title');
  }

  // ---------- écran du code secret (la saisie se fait dans le formulaire de main.ts) ----------
  private openCode() { this.codeMsg = null; this.state = 'code'; this.stateT = 0; this.menu = null; this.sfx.play('pickup'); }
  get codeRequest() { return this.state === 'code'; }
  // renvoie le message à afficher sous la case
  submitCode(raw: string): { ok: boolean; text: string } {
    if (isDevCode(raw)) { // le code du mode développeur : il l'active, ou le coupe s'il était actif
      this.setDev(!this.dev, true);
      const text = this.dev ? 'MODE DÉVELOPPEUR ACTIVÉ' : 'MODE DÉVELOPPEUR DÉSACTIVÉ';
      this.codeMsg = { ok: true, text, t: 0 }; this.sfx.play('pickup');
      return { ok: true, text };
    }
    const id = secretForCode(raw), sec = id && SECRETS.find((x) => x.id === id);
    let r: { ok: boolean; text: string };
    if (!sec) { r = { ok: false, text: 'CE CODE NE MARCHE PAS.' }; this.sfx.play('hurt'); }
    else if (this.secrets.has(sec.id)) r = { ok: true, text: 'DÉJÀ DÉBLOQUÉ : ' + sec.name };
    else {
      this.secrets.add(sec.id); saveSecrets(this.secrets);
      r = { ok: true, text: 'CODE ACCEPTÉ ! ' + sec.kind + ' : ' + sec.name };
      this.toasts.push({ title: 'CODE ACCEPTÉ !', sub: sec.kind + ' : ' + sec.name, t: 0 });
      this.sfx.play('level'); this.titleMenu();
    }
    this.codeMsg = { ...r, t: 0 };
    return r;
  }
  closeCode() { if (this.state === 'code') { this.state = 'settings'; this.stateT = 0; this.sfx.play('swap'); } }

  // ---------- mode boss : choisir un boss, ou les 3 à la suite ----------
  private updateBossSel(c: AppInput) {
    if (c.pause) { this.go('title'); return; }
    if (c.left && this.bossSel < 3) this.bossSel = (this.bossSel + 2) % 3;
    if (c.right && this.bossSel < 3) this.bossSel = (this.bossSel + 1) % 3;
    if (c.down) this.bossSel = 3;
    if (c.up && this.bossSel === 3) this.bossSel = 1;
    if (c.left || c.right || c.up || c.down) this.sfx.play('swap');
    let go = c.confirm && this.stateT > 0.3;
    if (c.tapX >= 0) {
      const pick = c.tapY >= 38 && c.tapY < 138 ? Math.max(0, Math.min(2, Math.floor((c.tapX - 10) / 102))) : c.tapY >= 142 && c.tapY < 158 ? 3 : -1;
      if (pick < 0) { if (c.tapY >= 160) this.go('title'); return; }
      if (pick === this.bossSel) go = true; else { this.bossSel = pick; this.sfx.play('swap'); return; }
    }
    if (!go) return;
    if (this.bossOpen(this.bossSel)) this.startBoss(this.bossSel); else this.sfx.play('hurt');
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
    if (this.state === 'code') return this.drawCode(scr);
    if (this.state === 'bossSel') return this.drawBossSel(scr);
    if (this.state !== 'title' && this.mini) return this.drawMini(scr, this.mini);
    if (this.state === 'title' || !this.world) return this.drawTitle(scr);
    const w = this.world;
    if (this.state === 'end') return this.drawEnd(scr);
    drawWorld(scr, w);
    if (this.mode === 'boss' && w.bossT0 >= 0) FC.text(scr, clock(w.bossTime), C.W - 30, 17, P.y, { outline: P.K }); // le chrono
    if (this.state === 'play' && w.t < 2.6 && Math.floor(w.t * 4) % 4 !== 3) {
      center(scr, this.mode === 'infini' ? w.label : this.mode === 'defi' ? 'DÉFI DU JOUR' : this.mode === 'boss' ? 'MODE BOSS' : 'NIVEAU ' + w.level.num, 64, P.W, { sc: 2, outline: P.K });
      center(scr, this.mode === 'boss' ? 'CONTRE LA MONTRE !' : w.level.name, 84, P.q, { outline: P.K });
      if (this.mode === 'defi') center(scr, this.daily.rule.name + ' : ' + this.daily.rule.desc, 96, P.y, { outline: P.K });
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
        ['icoDrag', 'BONBILLES', 'LOURDES, ELLES REBONDISSENT'],
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
      if (this.mode === 'boss') center(scr, 'LE BOSS A GAGNÉ CETTE FOIS... RÉESSAIE !', 88, P.W);
      else { center(scr, 'SCORE ' + w.score, 82, P.W); center(scr, 'MEILLEUR ' + this.best, 94, P.y); }
      if (this.stateT > 1) this.menu!.draw(scr, this.t);
    }
    if (this.state === 'done') this.drawBilan(scr, w);
  }

  // ---------- niveaux secrets ----------
  private drawMini(scr: Pix, m: Invasion | Casse) {
    m.draw(scr, this.heroFrame);
    const inv = m instanceof Invasion;
    if (this.state === 'mini' && m.t < 2.6 && Math.floor(m.t * 4) % 4 !== 3) {
      center(scr, 'NIVEAU SECRET', 58, P.W, { sc: 2, outline: P.K });
      center(scr, inv ? "L'INVASION DES BONBONS" : 'LE CASSE-BONBONS', 78, P.y, { outline: P.K });
      center(scr, inv ? 'GAUCHE/DROITE POUR BOUGER, TIRE VERS LE HAUT !' : 'RENVOIE LA BONBILLE AVEC TA SOUCOUPE !', 90, P.q, { outline: P.K });
    }
    if (this.state === 'name') {
      scr.rect(0, 0, C.W, C.H, FC.alpha(P.K, 190));
      center(scr, 'NOUVEAU RECORD !', 150, P.y, { sc: 2, outline: P.P });
    }
    if (this.state === 'pause') {
      scr.rect(0, 14, C.W, C.H - 14, FC.alpha(P.K, 170));
      center(scr, 'PAUSE', 22, P.W, { sc: 3, outline: P.U });
      this.menu!.draw(scr, this.t);
      center(scr, inv ? 'UN MONSTRE QUI PASSE LA LIGNE ROUGE : UN COEUR EN MOINS' : 'BONBILLE PERDUE : UN COEUR EN MOINS', 110, P.W);
      center(scr, inv ? 'UN COEUR EN PLUS TOUS LES 50 MONSTRES' : 'L LARGE · M 3 BONBILLES · T TRAVERSE · V TIRS · C COLLE · Z DODO !', 122, P.q);
      if (!this.touch) center(scr, 'ÉCHAP : REPRENDRE · M : SON', 162, P.v);
    }
    if (this.state === 'over') {
      scr.rect(0, 14, C.W, C.H - 14, FC.alpha(P.K, Math.min(170, this.stateT * 300)));
      center(scr, 'GAME OVER', 46, P.P, { sc: 3, outline: P.K });
      if (this.highlight && this.highlight.mode === this.mode) center(scr, 'TU ES ' + (this.highlight.rank === 1 ? '1ER' : this.highlight.rank + 'E') + ' AU TABLEAU DES SCORES !', 110, P.y, { outline: P.K });
      center(scr, inv ? 'MONSTRES ABATTUS : ' + m.score + ' · VAGUE ' + (m as Invasion).wave : 'SCORE ' + m.score + ' · TABLEAU ' + (m as Casse).tableau, 82, P.W);
      center(scr, 'MEILLEUR ' + this.best, 94, P.y);
      if (this.stateT > 1) this.menu!.draw(scr, this.t);
    }
  }

  // ---------- écran du code secret (derrière le formulaire) ----------
  private drawCode(scr: Pix) {
    this.drawTitleBackground(scr);
    center(scr, 'CODE SECRET', 6, P.y, { sc: 2, outline: P.P });
    const msg = this.codeMsg;
    if (msg) center(scr, msg.text, 86, msg.ok ? P.g : P.P, { outline: P.K });
    center(scr, 'RÉCOMPENSES SECRÈTES : ' + this.secrets.size + '/' + SECRETS.length, 100, P.y, { outline: P.K });
    const f = Math.floor(this.t * 5) % 4;
    SECRETS.forEach((sec, i) => {
      const x = 12 + i * 50, y = 112, got = this.secrets.has(sec.id);
      scr.rect(x, y - 3, 46, 46, FC.alpha(P.K, 160));
      if (got) {
        const pic: Pix = sec.id === 'toad' ? FC.spr('toadHero', f) : sec.id === 'ghost' ? FC.spr('ghostHero', f) : sec.id === 'disco' ? FC.discoHero(f, 'classic')
          : sec.id === 'buddy' ? FC.spr('companion', Math.floor(this.t * 12)).scale(2) : sec.id === 'invasion' ? FC.spr('invBerlingot', f) : FC.mk('casseIcon', () => {
            const p = new FC.Pix(24, 22); FC.brick(p, 0, 0, 'fraise', 0, false); FC.brick(p, 0, 10, 'menthe', 0, false); return p;
          });
        scr.blit(pic, x + Math.round((46 - pic.w) / 2), y + Math.round((32 - pic.h) / 2));
      } else { scr.ell(x + 23, y + 16, 13, 12, FC.col('3a2457')); FC.text(scr, '?', x + 22, y + 13, P.v); }
      const label = got ? ['CRAPAUD', 'FANTÔME', 'DISCO', 'COMPAGNON', 'INVASION', 'CASSE'][i] : '???';
      center(scr, label, y + 35, got ? P.W : P.M, {}, x + 23);
    });
    FC.text(scr, 'RETOUR', 8, 170, P.v, { outline: P.K });
  }

  // ---------- mode boss : le choix du combat ----------
  private drawBossSel(scr: Pix) {
    this.drawTitleBackground(scr);
    const t = this.t, icons: Pix[] = FC.bossIcons();
    center(scr, 'MODE BOSS', 6, P.y, { sc: 2, outline: P.P });
    center(scr, 'CONTRE LA MONTRE : BATS TON RECORD !', 26, P.q, { outline: P.K });
    BOSSES.forEach((b, i) => {
      const x = 10 + i * 102, y = 38, sel = i === this.bossSel, open = this.bossOpen(i), rec = this.bossRec[String(i)];
      scr.rect(x, y, 96, 100, sel ? FC.alpha(P.P, 150) : FC.alpha(P.K, 160));
      if (sel && Math.floor(t * 3) % 2) scr.rect(x, y + 99, 96, 1, P.y);
      const ic = icons[i];
      scr.blit(ic, x + Math.round((96 - ic.w) / 2), y + 6 + Math.round((60 - ic.h) / 2), false, open ? 1 : 0.25);
      center(scr, b.name, y + 72, open ? P.W : P.M, {}, x + 48);
      center(scr, !open ? "À VAINCRE D'ABORD" : rec ? 'RECORD ' + clock(rec) : 'PAS ENCORE DE RECORD', y + 84, open ? P.y : P.M, {}, x + 48);
    });
    const all = this.bossOpen(3), rec3 = this.bossRec['3'], on3 = this.bossSel === 3;
    const label = 'LES 3 À LA SUITE' + (!all ? " (À DÉBLOQUER)" : rec3 ? ' · RECORD ' + clock(rec3) : '');
    const lw = FC.textWidth(label) + 16;
    scr.rect(Math.round(160 - lw / 2), 144, lw, 11, on3 ? FC.alpha(P.P, 200) : FC.alpha(P.K, 160));
    center(scr, label, 147, all ? P.W : P.M);
    if (t % 1.2 < 0.8) center(scr, this.touch ? 'TOUCHE UN BOSS DEUX FOIS POUR COMBATTRE' : 'ENTRÉE POUR COMBATTRE · ÉCHAP : RETOUR', 160, P.v, { outline: P.K });
    this.drawBack(scr);
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
    const play = this.playing, slide = Math.min(1, toast.t * 6, (3.2 - toast.t) * 6);
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
      if (r.key === 'code') {
        FC.text(scr, r.label, 40, y, on ? P.W : P.v, { outline: P.K });
        center(scr, this.secrets.size + '/' + SECRETS.length + ' >', y, P.y, {}, 239);
        return;
      }
      FC.text(scr, r.label, 40, y, on ? P.W : P.v, { outline: P.K });
      FC.text(scr, '<', 196, y, P.y); FC.text(scr, '>', 278, y, P.y);
      if (r.key === 'music' || r.key === 'sfx') {
        for (let k = 0; k < 10; k++) scr.rect(204 + k * 7, y, 5, 5, k < s[r.key] ? (k < 7 ? P.g : k < 9 ? P.y : P.P) : P.k);
      } else center(scr, s[r.key] ? 'OUI' : 'NON', y, s[r.key] ? P.g : P.M, {}, 239);
    });
    center(scr, this.touch ? 'TOUCHE À GAUCHE OU À DROITE POUR CHANGER' : 'HAUT/BAS : CHOISIR · GAUCHE/DROITE : CHANGER · ÉCHAP : RETOUR', 146, P.v);
    if (s.leftHanded) center(scr, 'GAUCHER : JOYSTICK À DROITE, BOUTONS À GAUCHE', 156, P.q);
    if (s.autoFire) center(scr, 'TIR AUTOMATIQUE : ATTENTION, IL USE LES MUNITIONS !', 166, P.q);
  }

  private drawSucces(scr: Pix) {
    this.drawTitleBackground(scr);
    const list = this.succList(), p2 = this.succPage === 1, a2 = Math.floor(this.t * 3) % 2;
    center(scr, 'SUCCÈS ' + this.unlocked.size + '/' + ACHIEVEMENTS.length, 4, P.y, { sc: 2, outline: P.P });
    const head = p2 ? 'PAGE 2/2 · LES CHATS' : 'PAGE 1/2 · SOUCOUPES ET EXPLOITS';
    center(scr, head, 22, P.q, { outline: P.K });
    const hw = FC.textWidth(head);
    FC.text(scr, '<', 160 - hw / 2 - 10 - a2, 22, P.y, { outline: P.K }); FC.text(scr, '>', 160 + hw / 2 + 6 + a2, 22, P.y, { outline: P.K });
    list.forEach((a, i) => {
      const got = this.unlocked.has(a.id), on = i === this.sel;
      const y = p2 ? 36 + i * 17 : 34 + i * 7, h = p2 ? 16 : 7, ty = p2 ? y + 3 : y;
      if (on) scr.rect(30, y - (p2 ? 3 : 1), 262, h, FC.alpha(P.P, 170)); else if (p2) scr.rect(30, y - 3, 262, h, FC.alpha(P.K, 120));
      scr.rect(34, ty, 5, 5, got ? P.g : P.k);
      if (got) { scr.put(35, ty + 2, P.W); scr.put(36, ty + 3, P.W); scr.put(37, ty + 1, P.W); }
      FC.text(scr, a.name, 44, ty, got || on ? P.W : P.M);
      const prog = a.goal && !got ? Math.min(this.stats[a.goal.stat], a.goal.n) + '/' + a.goal.n : '';
      if (p2) { // la tête du chat à gagner, en grisé tant qu'il n'est pas gagné
        if (prog) right(scr, prog, 254, ty, P.q);
        scr.blit(FC.catHead(a.cat), 268, y - 4, false, got || on ? 1 : 0.45);
      } else if (prog) right(scr, prog, 288, y, P.q);
      else if (a.skin) { // mini-soucoupe à la couleur gagnée
        const sk = SKINS.find((k) => k.id === a.skin)!, col = sk.rainbow ? P.P : FC.col(sk.frosting![0]);
        scr.ell(284, y + 3, 5, 2.4, FC.alpha(col, got ? 255 : 80)); scr.ell(284, y + 1, 2.5, 2, FC.alpha(P.c, got ? 255 : 80));
      }
    });
    const a = list[Math.min(this.sel, list.length - 1)], skin = a.skin && SKINS.find((s) => s.id === a.skin), cat = a.cat && CATS.find((k) => k.id === a.cat);
    scr.rect(20, 144, 280, 23, FC.alpha(P.K, 200));
    center(scr, a.desc, 147, P.W);
    center(scr, skin ? 'RÉCOMPENSE : SOUCOUPE ' + skin.name : cat ? 'RÉCOMPENSE : CHAT ' + cat.name : (this.unlocked.has(a.id) ? 'RÉUSSI !' : ''), 157, P.y);
    this.drawBack(scr);
  }

  private drawSkins(scr: Pix) {
    this.drawTitleBackground(scr);
    const t = this.t, f = Math.floor(t * 5) % 4, tabN = this.appTab, catTab = tabN === 1, spTab = tabN === 2;
    center(scr, 'APPARENCE', 4, P.y, { sc: 2, outline: P.P });
    [['SOUCOUPE', 70], ['CHAT', 160], ['SPÉCIAL', 250]].forEach(([label, cx], i) => {
      const w = FC.textWidth(label as string) + 20, x = Math.round((cx as number) - w / 2), on = i === tabN;
      scr.rect(x, 24, w, 12, on ? FC.alpha(P.P, 220) : FC.alpha(P.K, 170));
      if (on) scr.rect(x, 35, w, 1, P.U);
      center(scr, label as string, 27, on ? P.W : P.v, {}, cx as number);
    });
    const by = Math.round(Math.sin(t * 2.4) * 2);
    let big: Pix, open: boolean, name: string, chosen: boolean;
    const lines: [string, number[]][] = [];
    if (spTab) { // onglet spécial : les récompenses secrètes
      const it = SPECIALS[this.sel], cat = this.cat;
      open = this.specialOpen(this.sel); chosen = this.specialOn(this.sel); name = it.name;
      const key = 'sp' + it.id + this.skin + cat + f;
      big = this.bigHero[key] ?? (this.bigHero[key] = (it.id === 'toad' || it.id === 'ghost' ? heroSprite(this.skin, f, it.id)
        : it.id === 'disco' ? heroSprite('disco', f, cat) : heroSprite(this.skin, f, this.heroCat)).scale(2));
      if (open) wrap(it.desc, 180).slice(0, 2).forEach((l) => lines.push([l, P.q]));
      else { lines.push(['À DÉBLOQUER AVEC UN CODE SECRET', P.v]); lines.push(['(RÉGLAGES · CODE SECRET)', P.M]); }
    } else {
      // grand aperçu : le chat choisi dans la soucoupe choisie (ou celle qu'on regarde)
      const selSkin = catTab ? (this.skin === 'disco' ? 'classic' : this.skin) : SKINS[this.sel].id, selCat = catTab ? CATS[this.sel].id : this.cat;
      open = catTab ? this.catOpen(selCat) : this.skinOpen(selSkin);
      chosen = !this.special && (catTab ? selCat === this.cat : selSkin === this.skin);
      const key = 'app' + selSkin + selCat + f;
      big = this.bigHero[key] ?? (this.bigHero[key] = heroSprite(selSkin, f, selCat).scale(2));
      name = catTab ? 'CHAT ' + CATS[this.sel].name : 'SOUCOUPE ' + SKINS[this.sel].name;
      const ach = catTab ? catUnlockedBy(selCat) : skinUnlockedBy(selSkin);
      if (!ach) lines.push([catTab ? 'LE CHAT DE DÉPART' : 'LA SOUCOUPE DE DÉPART', P.v]);
      else {
        lines.push([open ? 'GAGNÉ AVEC LE SUCCÈS' : 'À GAGNER AVEC LE SUCCÈS', P.v]);
        lines.push([ach.name, P.W]);
        wrap(ach.desc, 180).slice(0, 2).forEach((l) => lines.push([l, P.q]));
        if (!open && ach.goal) lines.push(['PROGRESSION : ' + Math.min(this.stats[ach.goal.stat], ach.goal.n) + '/' + ach.goal.n, P.y]);
      }
    }
    FC.trail(scr, 26, 92 + by, t, true);
    scr.blit(open ? big : FC.catLocked().scale(2), 22, 44 + by, false, open ? 1 : 0.8);
    if (open && (spTab ? this.buddyOn || this.sel === 3 : this.buddyOn)) scr.blit(FC.spr('companion', Math.floor(t * 12)), 6, 40 + Math.round(Math.sin(t * 3) * 2));
    FC.text(scr, name, 128, 48, P.y, { sc: FC.textWidth(name, 2) <= 186 ? 2 : 1, outline: P.K });
    lines.slice(0, 5).forEach(([l, c], k) => FC.text(scr, l, 128, 66 + k * 9, c, k === 1 && !spTab ? { outline: P.K } : {}));
    const isBuddy = spTab && this.sel === 3;
    if (open) FC.text(scr, chosen ? (isBuddy ? 'ACTIVÉ !' : 'CHOISI !') + (spTab ? (this.touch ? ' (TOUCHE POUR RETIRER)' : ' (ENTRÉE POUR RETIRER)') : '')
      : (this.touch ? 'TOUCHE-LE ENCORE POUR LE CHOISIR' : 'ENTRÉE POUR LE CHOISIR'), 128, 112, chosen ? P.g : P.W);
    // la rangée des choix
    const { n, step, x0 } = this.appRow();
    for (let i = 0; i < n; i++) {
      const x = x0 + i * step, y = 126, on = i === this.sel;
      const ok = spTab ? this.specialOpen(i) : catTab ? this.catOpen(CATS[i].id) : this.skinOpen(SKINS[i].id);
      const mine = spTab ? this.specialOn(i) : !this.special && (catTab ? CATS[i].id === this.cat : SKINS[i].id === this.skin);
      scr.rect(x - 2, y - 3, step - 2, 36, on ? FC.alpha(P.P, 170) : FC.alpha(P.K, 150));
      if (on && Math.floor(t * 3) % 2) scr.rect(x - 2, y + 32, step - 2, 1, P.y);
      if (mine) scr.rect(x - 2, y - 3, step - 2, 1, P.g);
      let pic: Pix;
      if (spTab) {
        const id = SPECIALS[i].id, ff = on ? f : 0;
        pic = !ok ? FC.catLocked() : id === 'buddy' ? FC.spr('companion', on ? Math.floor(t * 12) : 0).scale(2) : heroSprite(id === 'disco' ? 'disco' : this.skin, ff, id === 'disco' ? this.cat : id);
      } else pic = ok ? heroSprite(catTab ? (this.skin === 'disco' ? 'classic' : this.skin) : SKINS[i].id, on ? f : 0, catTab ? CATS[i].id : this.cat) : FC.catLocked();
      scr.blit(pic, x + Math.round((step - 2 - pic.w) / 2) - 2, y + Math.round((31 - pic.h) / 2), false, 1);
      if (!ok) { // cadenas
        const lx = x + step - 14;
        scr.rect(lx, y + 22, 7, 6, P.Y); scr.rect(lx + 1, y + 18, 5, 1, P.m); scr.rect(lx + 1, y + 18, 1, 4, P.m); scr.rect(lx + 5, y + 18, 1, 4, P.m); scr.put(lx + 3, y + 24, P.K);
      }
    }
    if (t % 1.2 < 0.8) center(scr, this.touch ? 'TOUCHE UN ONGLET OU UN CHOIX' : 'GAUCHE/DROITE : CHOISIR · HAUT/BAS : ONGLET', 162, P.W, { outline: P.K });
    this.drawBack(scr);
  }

  private drawEnd(scr: Pix) {
    this.drawTitleBackground(scr);
    const w = this.world!;
    if (this.mode === 'boss' && this.bossResult) { // mode boss : combat gagné
      const r = this.bossResult, rec = this.bossRec[String(this.bossSel)];
      center(scr, 'VICTOIRE !', 36, P.y, { sc: 3, outline: P.K });
      center(scr, this.bossSel === 3 ? 'LES 3 BOSS À LA SUITE' : BOSSES[this.bossSel].name, 70, P.W, { outline: P.K });
      center(scr, 'TEMPS ' + clock(r.time), 88, P.y, { sc: 2, outline: P.K });
      if (r.record && Math.floor(this.t * 3) % 3) center(scr, 'NOUVEAU RECORD !', 110, P.P, { outline: P.K });
      else if (!r.record) center(scr, 'RECORD ' + clock(rec), 110, P.q, { outline: P.K });
      if (this.stateT > 1 && this.t % 1.2 < 0.8) center(scr, (this.touch ? 'TOUCHE' : 'ENTRÉE') + ' POUR CONTINUER', 152, P.W, { outline: P.K });
      return;
    }
    if (this.mode === 'defi') { // défi du jour réussi
      center(scr, 'DÉFI RÉUSSI !', 36, P.y, { sc: 3, outline: P.K });
      center(scr, 'DÉFI DU ' + this.daily.date.split('-').reverse().join('/') + ' · ' + w.level.name + ' · ' + this.daily.rule.name, 72, P.W, { outline: P.K });
      center(scr, 'SCORE ' + w.score, 92, P.y, { sc: 2, outline: P.K });
      center(scr, 'MEILLEUR SCORE DU JOUR ' + this.best, 114, P.q, { outline: P.K });
      center(scr, 'REVIENS DEMAIN POUR UN NOUVEAU DÉFI !', 136, P.v, { outline: P.K });
      if (this.stateT > 1 && this.t % 1.2 < 0.8) center(scr, (this.touch ? 'TOUCHE' : 'ENTRÉE') + " POUR REVENIR À L'ACCUEIL", 152, P.W, { outline: P.K });
      return;
    }
    center(scr, 'BRAVO !', 40, P.y, { sc: 3, outline: P.K });
    center(scr, 'TU AS TERMINÉ LES ' + C.LEVELS.length + ' NIVEAUX EN MODE ' + MODE_NAMES[this.mode], 72, P.W, { outline: P.K });
    center(scr, w.level.next ?? '', 84, P.q, { outline: P.K });
    center(scr, 'SCORE ' + w.score, 104, P.y, { sc: 2, outline: P.K });
    center(scr, this.mode === 'facile' ? 'ESSAIE LE MODE NORMAL !' : this.mode === 'normal' ? 'ESSAIE LE MODE DIFFICILE !' : 'CHAMPION DE LA GALAXIE !', 136, P.v, { outline: P.K });
    if (this.stateT > 1 && this.t % 1.2 < 0.8) center(scr, (this.touch ? 'TOUCHE' : 'ENTRÉE') + " POUR REVENIR À L'ACCUEIL", 152, P.W, { outline: P.K });
  }

  private drawScores(scr: Pix) {
    this.drawTitleBackground(scr);
    const t = this.t, a = Math.floor(t * 3) % 2, list = loadScores(scoreKey(this.scoresMode));
    center(scr, 'MEILLEURS SCORES', 8, P.y, { sc: 2, outline: P.P });
    center(scr, 'MODE ' + MODE_NAMES[this.scoresMode], 30, this.scoresMode === 'facile' ? P.g : this.scoresMode === 'normal' ? P.b : P.P, { outline: P.K });
    FC.text(scr, '<', 100 - a, 30, P.y, { outline: P.K }); FC.text(scr, '>', 216 + a, 30, P.y, { outline: P.K });
    if (!list.length) center(scr, 'PAS ENCORE DE SCORE : À TOI DE JOUER !', 90, P.W, { outline: P.K });
    const medal = [P.y, P.m, P.o];
    list.forEach((e, i) => {
      const y = 46 + i * 11, hl = this.highlight && this.highlight.mode === this.scoresMode && this.highlight.rank === i + 1;
      if (hl && Math.floor(t * 4) % 4) scr.rect(56, y - 2, 208, 9, FC.alpha(P.P, 170));
      const c = hl ? P.W : medal[i] ?? P.v;
      right(scr, (i + 1) + '.', 76, y, c, { outline: P.K });
      FC.text(scr, e.name, 82, y, P.W, { outline: P.K });
      const lv = this.scoresMode === 'infini' ? 'ZONE ' + e.level : this.scoresMode === 'invasion' ? 'VAGUE ' + e.level : this.scoresMode === 'casse' ? 'TAB. ' + e.level : e.won ? 'FIN' : 'NIV.' + e.level;
      FC.text(scr, lv, 172, y, P.q, { outline: P.K });
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
    const f = Math.floor(t * 5) % 4, key = this.skin + this.heroCat + f;
    if (!this.bigHero[key]) this.bigHero[key] = heroSprite(this.skin, f, this.heroCat).scale(2);
    const big = this.bigHero[key], by = Math.round(Math.sin(t * 2.4) * 2), hx = 16, hy = 62 + by;
    FC.trail(scr, hx + 8, hy + 48, t, true);
    scr.blit(big, hx, hy);
    if (this.buddyOn) scr.blit(FC.spr('companion', Math.floor(t * 12)), hx - 6, hy - 10 + Math.round(Math.sin(t * 3) * 2));
    if (!this.menu) this.titleMenu();
    this.menu!.draw(scr, t);
    if (this.dev && this.mode !== 'boss' && this.mode !== 'infini' && this.mode !== 'defi') { // ligne réservée au mode développeur
      const a = Math.floor(t * 3) % 2, mc = this.miniChoice;
      center(scr, this.mode === 'casse' ? 'DEV · TABLEAU ' + (mc.casse + 1) + ' · ' + TABLEAUX[mc.casse].name
        : this.mode === 'invasion' ? 'DEV · VAGUE ' + (mc.invasion + 1)
        : 'DEV · NIV.' + (this.choice + 1) + ' · ' + C.LEVELS[this.choice].name, 150, P.o, { outline: P.K }, 210);
      FC.text(scr, '<', 128 - a, 150, P.o, { outline: P.K }); FC.text(scr, '>', 290 + a, 150, P.o, { outline: P.K });
    }
    if (this.notice) center(scr, this.notice.text, 160, P.y, { outline: P.K });
    else if (this.mode === 'defi') center(scr, "AUJOURD'HUI : " + this.daily.level.name + ' · ' + this.daily.rule.name, 160, P.q, { outline: P.K });
    else if (this.mode === 'infini') center(scr, 'DES ZONES SANS FIN, DE PLUS EN PLUS DURES', 160, P.q, { outline: P.K });
    else if (this.mode === 'invasion') center(scr, 'NIVEAU SECRET : LES BONBONS DESCENDENT DU CIEL !', 160, P.q, { outline: P.K });
    else if (this.mode === 'casse') center(scr, 'NIVEAU SECRET : CASSE LE MUR DE BONBONS !', 160, P.q, { outline: P.K });
    else if (this.mode === 'boss') center(scr, 'REJOUE LES BOSS VAINCUS, CONTRE LA MONTRE', 160, P.q, { outline: P.K });
    if (this.mode === 'boss') { const r = this.bossRec['3']; if (r) center(scr, 'RECORD DES 3 BOSS À LA SUITE ' + clock(r), 170, P.y); }
    else center(scr, (this.mode === 'invasion' ? 'MEILLEUR (MONSTRES ABATTUS) ' : 'MEILLEUR SCORE (' + MODE_NAMES[this.mode] + ') ') + this.best, 170, P.y);
  }
}
