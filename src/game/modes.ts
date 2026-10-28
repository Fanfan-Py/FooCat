// Mode infini et défi du jour.
// Infini : on enchaîne des « zones » (les niveaux sans boss, en boucle), chacune un peu plus dure.
// Défi du jour : le même niveau, la même graine de hasard et la même règle spéciale pour tout le monde,
// tirés d'après la date du jour.
import * as C from './config';

export type GameMode = C.Mode | 'infini' | 'defi';
export interface ModeCfg { lives: number; energy: number; spawn: number; speed: number; enemyFire: number; obstacle?: number; hp?: number; bossHp?: number; bonus?: number }

// les niveaux sans boss, dans l'ordre du jeu
export const ZONE_LEVELS = C.LEVELS.map((l, i) => (l.boss ? -1 : i)).filter((i) => i >= 0);

// ---------- mode infini ----------
export const ENDLESS = { points: 10000, boost: 0.08 }; // points par zone ; difficulté en plus à chaque zone

export interface Setup { levelIndex: number; level: C.Level; mode: ModeCfg; label: string; seed?: number }

// difficulté renforcée : plus d'ennemis, plus rapides, qui tirent plus souvent
export function boosted(base: ModeCfg, boost: number): ModeCfg {
  return { ...base, spawn: base.spawn * boost, obstacle: (base.obstacle ?? 1) * (1 + (boost - 1) * 0.5), speed: base.speed * (1 + (boost - 1) * 0.5), enemyFire: base.enemyFire * boost };
}

export function endlessZone(zone: number): Setup { // zone : 1, 2, 3...
  const levelIndex = ZONE_LEVELS[(zone - 1) % ZONE_LEVELS.length];
  return {
    levelIndex, label: 'ZONE ' + zone,
    level: { ...C.LEVELS[levelIndex], points: ENDLESS.points },
    mode: boosted(C.MODES.normal, 1 + (zone - 1) * ENDLESS.boost),
  };
}

// ---------- défi du jour ----------
export const DAILY_POINTS = 18000;
export const DAILY_RULES = [
  { id: 'turbo', name: 'TURBO', desc: 'TOUT VA PLUS VITE' },
  { id: 'fragile', name: 'FRAGILE', desc: '2 COEURS SEULEMENT, MAIS 5 VIES' },
  { id: 'gourmand', name: 'PLUIE DE BONUS', desc: 'DEUX FOIS PLUS DE BONUS' },
  { id: 'horde', name: 'LA HORDE', desc: "BEAUCOUP PLUS D'ENNEMIS" },
] as const;

export function today(d = new Date()) {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}
// petit hachage de la date : le même nombre pour tout le monde le même jour
function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

export function dailySetup(date = today()): Setup & { rule: (typeof DAILY_RULES)[number]; date: string } {
  const h = hash('foocat-' + date);
  const levelIndex = ZONE_LEVELS[h % ZONE_LEVELS.length];
  const rule = DAILY_RULES[Math.floor(h / 7) % DAILY_RULES.length];
  let mode: ModeCfg = { ...C.MODES.normal };
  if (rule.id === 'turbo') mode = { ...mode, speed: 1.3, enemyFire: 1.2 };
  if (rule.id === 'fragile') mode = { ...mode, energy: 2, lives: 5 };
  if (rule.id === 'gourmand') mode = { ...mode, bonus: 2 };
  if (rule.id === 'horde') mode = { ...mode, spawn: 1.6 };
  return {
    levelIndex, rule, date, mode, seed: h % 100000, label: 'DÉFI',
    level: { ...C.LEVELS[levelIndex], points: rule.id === 'horde' ? DAILY_POINTS * 1.4 : DAILY_POINTS }, // la horde rapporte plus vite
  };
}
