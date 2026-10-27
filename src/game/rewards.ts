// Succès, soucoupes à gagner, statistiques cumulées et réglages (tout est gardé sur l'appareil).
import { FC, Pix, Color } from '../art';

function read<T>(key: string, def: T): T {
  try { const v = JSON.parse(localStorage.getItem(key) || 'null'); return v === null ? def : { ...def, ...v } as T; } catch { return def; }
}
function write(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* stockage indisponible */ } }

// ---------- réglages ----------
export interface Settings { music: number; sfx: number; autoFire: boolean; leftHanded: boolean; vibrate: boolean }
const DEFAULT_SETTINGS: Settings = { music: 7, sfx: 8, autoFire: false, leftHanded: false, vibrate: true };
export const loadSettings = () => read<Settings>('foocat.settings', DEFAULT_SETTINGS);
export const saveSettings = (s: Settings) => write('foocat.settings', s);

// ---------- statistiques cumulées (toutes parties confondues) ----------
export interface Stats { flies: number; waves: number; bonuses: number; rainbowKills: number; jawBreaks: number }
const DEFAULT_STATS: Stats = { flies: 0, waves: 0, bonuses: 0, rainbowKills: 0, jawBreaks: 0 };
export const loadStats = () => read<Stats>('foocat.stats', DEFAULT_STATS);
export const saveStats = (s: Stats) => write('foocat.stats', s);

// ---------- succès ----------
export interface Achievement { id: string; name: string; desc: string; skin?: string; goal?: { stat: keyof Stats; n: number } }
export const ACHIEVEMENTS: Achievement[] = [
  { id: 'first', name: 'PREMIER VOYAGE', desc: 'TERMINER LE NIVEAU 1', skin: 'choco' },
  { id: 'flies', name: 'CHASSE-MOUCHES', desc: 'VAINCRE 300 MOUCHES (AU TOTAL)', skin: 'mint', goal: { stat: 'flies', n: 300 } },
  { id: 'belt', name: 'SLALOM SUCRÉ', desc: 'TRAVERSER LA CEINTURE DE DONUTS SANS ÊTRE TOUCHÉ', skin: 'lemon' },
  { id: 'nolife', name: 'SANS UNE ÉGRATIGNURE', desc: 'FINIR UN NIVEAU SANS PERDRE DE VIE', skin: 'licorice' },
  { id: 'boss', name: 'ARAIGNÉE AU TAPIS', desc: "VAINCRE L'ARAIGNÉE DE FER", skin: 'blueberry' },
  { id: 'skel', name: 'ARÊTES EN MIETTES', desc: 'VAINCRE LE POISSON SQUELETTE DE LA MORT' },
  { id: 'score100k', name: '100 000 POINTS', desc: 'ATTEINDRE 100 000 POINTS DANS UNE PARTIE', skin: 'gold' },
  { id: 'hard', name: 'CHAMPION DE LA GALAXIE', desc: 'VAINCRE LE BOSS EN MODE DIFFICILE', skin: 'rainbow' },
  { id: 'stars3', name: 'TROIS ÉTOILES', desc: 'OBTENIR 3 ÉTOILES SUR UN NIVEAU' },
  { id: 'pinata', name: 'FIESTA !', desc: 'VAINCRE 5 ENNEMIS AVEC UNE SEULE PIÑATA' },
  { id: 'jaw', name: 'CASSE-PLANÈTES', desc: 'DÉTRUIRE 10 OBSTACLES AU CASSE-DENTS (AU TOTAL)', goal: { stat: 'jawBreaks', n: 10 } },
  { id: 'waves', name: 'VAGUES PARFAITES', desc: "ABATTRE 20 GROUPES D'ENNEMIS EN ENTIER (AU TOTAL)", goal: { stat: 'waves', n: 20 } },
  { id: 'bonus', name: 'GOURMAND', desc: 'RAMASSER 100 BONUS (AU TOTAL)', goal: { stat: 'bonuses', n: 100 } },
  { id: 'rainbow', name: 'TOUT EN COULEURS', desc: "VAINCRE 100 ENNEMIS À L'ARC-EN-CIEL (AU TOTAL)", goal: { stat: 'rainbowKills', n: 100 } },
];
export function loadUnlocked(): Set<string> {
  try { const v = JSON.parse(localStorage.getItem('foocat.ach') || '[]'); return new Set(Array.isArray(v) ? v : []); } catch { return new Set(); }
}
export const saveUnlocked = (s: Set<string>) => write('foocat.ach', [...s]);

// ---------- étoiles par niveau (meilleur résultat) ----------
export function loadStars(): Record<string, number> { return read<Record<string, number>>('foocat.stars', {}); }
export const saveStars = (s: Record<string, number>) => write('foocat.stars', s);

// ---------- soucoupes ----------
// frosting : [glaçage, reflet, ombre] ; dough : [pâte claire, pâte, pâte foncée] (facultatif)
export interface Skin { id: string; name: string; frosting?: string[]; dough?: string[]; rainbow?: boolean }
export const SKINS: Skin[] = [
  { id: 'classic', name: 'FRAISE' },
  { id: 'choco', name: 'CHOCOLAT', frosting: ['7b4a2a', 'a8703f', '4a2614'] },
  { id: 'mint', name: 'MENTHE', frosting: ['6be38f', 'b8f5cc', '2e9e5b'] },
  { id: 'lemon', name: 'CITRON', frosting: ['ffe066', 'fff3b0', 'd9a520'] },
  { id: 'licorice', name: 'RÉGLISSE', frosting: ['2a2233', '5a4e6b', '120d18'] },
  { id: 'blueberry', name: 'MYRTILLE', frosting: ['6a5cff', 'a99cff', '3a2f9e'] },
  { id: 'gold', name: 'OR', frosting: ['f7b52a', 'ffe680', 'c47d12'], dough: ['ffd27a', 'd99a2b', '9a6510'] },
  { id: 'rainbow', name: 'ARC-EN-CIEL', rainbow: true },
];
export function skinUnlockedBy(id: string) { return ACHIEVEMENTS.find((a) => a.skin === id); }
export function loadSkin() { try { return localStorage.getItem('foocat.skin') || 'classic'; } catch { return 'classic'; } }
export function saveSkin(id: string) { try { localStorage.setItem('foocat.skin', id); } catch { /* stockage indisponible */ } }

const same = (d: Uint8ClampedArray, i: number, c: Color) => d[i] === c[0] && d[i + 1] === c[1] && d[i + 2] === c[2] && d[i + 3] === 255;
// la soucoupe du chat, aux couleurs de la soucoupe choisie
export function heroSprite(skinId: string, f: number): Pix {
  const skin = SKINS.find((s) => s.id === skinId);
  if (!skin || skin.id === 'classic') return FC.spr('hero', f);
  return FC.mk('hero_' + skin.id + '_' + f, () => {
    const base: Pix = FC.spr('hero', f), p = new FC.Pix(base.w, base.h), d = p.d, P = FC.P;
    d.set(base.d);
    const fr = skin.frosting?.map((h) => FC.col(h)), dg = skin.dough?.map((h) => FC.col(h));
    const from = [P.P, P.q, P.i], doughFrom = [P.d, P.D, P.e];
    for (let i = 0; i < d.length; i += 4) {
      const x = (i / 4) % p.w;
      for (let k = 0; k < 3; k++) {
        let to: Color | null = null;
        if (same(base.d, i, from[k])) to = skin.rainbow ? (k === 1 ? P.W : FC.RAINBOW[Math.floor(x / 4) % 6]) : fr ? fr[k] : null;
        else if (dg && same(base.d, i, doughFrom[k])) to = dg[k];
        if (to) { d[i] = to[0]; d[i + 1] = to[1]; d[i + 2] = to[2]; break; }
      }
    }
    return p;
  });
}
