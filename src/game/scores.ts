// Tableau des meilleurs scores : enregistré sur l'appareil (pas de compte), un classement par mode
// (et un par jour pour le défi du jour).

export interface ScoreEntry { name: string; score: number; level: number; won?: boolean; date: string }
export const TOP = 10;
export const NAME_MAX = 12;

function key(mode: string) { return 'foocat.scores.' + mode; }

export function loadScores(mode: string): ScoreEntry[] {
  try {
    const v = JSON.parse(localStorage.getItem(key(mode)) || '[]');
    return Array.isArray(v) ? v.filter((e) => e && typeof e.score === 'number' && typeof e.name === 'string').slice(0, TOP) : [];
  } catch { return []; }
}

// ce score entre-t-il dans le top 10 ?
export function qualifies(mode: string, score: number) {
  if (score <= 0) return false;
  const list = loadScores(mode);
  return list.length < TOP || score > list[list.length - 1].score;
}

// ajoute le score ; renvoie sa place (1 = premier) ou 0 s'il n'entre pas
export function addScore(mode: string, e: ScoreEntry): number {
  const list = loadScores(mode).concat(e).sort((a, b) => b.score - a.score).slice(0, TOP);
  try { localStorage.setItem(key(mode), JSON.stringify(list)); } catch { /* stockage indisponible */ }
  return list.indexOf(e) + 1;
}

// ---------- pseudonyme ----------

// lettres permises : celles que la police du jeu sait dessiner
const ALLOWED = /[^A-Z0-9ÉÈÊËÀÂÇÔÛÙÜÎÏÑ .'!?-]/g;
export function cleanName(raw: string) {
  return raw.toUpperCase().replace(ALLOWED, '').replace(/\s+/g, ' ').trim().slice(0, NAME_MAX);
}

// Mots refusés. On compare après avoir tout mis en minuscules, sans accents, sans espaces ni
// symboles, avec les chiffres « déguisés » remplacés (0→o, 1→i, 3→e, 4→a, 5→s…) et les lettres
// répétées réduites à une seule (« coooonnard » → « conard »).
const BANNED = [
  // français
  'connard', 'connasse', 'conasse', 'salope', 'salopard', 'salaud', 'encule', 'enculer', 'batard', 'putain',
  'merde', 'couille', 'niquer', 'niktamer', 'ntamere', 'tamere', 'pede', 'pedale',
  'tapette', 'gouine', 'negre', 'negro', 'bougnoul', 'youpin', 'bamboula', 'chinetoque', 'bicot', 'enfoire',
  'trouduc', 'branleur', 'branlette', 'poufiasse', 'pouffiasse', 'petasse', 'garce', 'cochonne', 'chienne', 'zizi',
  'nazi', 'hitler', 'pedophile', 'pedo', 'violeur', 'abruti', 'cretin', 'debile', 'imbecile', 'gogol', 'mongol',
  'triso', 'attarde', 'sexe', 'porno', 'nichon', 'teub', 'tepu', 'fiotte', 'tarlouze', 'baltringue',
  // anglais
  'fuck', 'shit', 'bitch', 'cunt', 'dick', 'pussy', 'asshole', 'bastard', 'whore', 'slut', 'nigger', 'nigga',
  'fag', 'faggot', 'retard', 'porn', 'penis', 'vagin', 'boob',
];
// mots courts refusés seulement s'ils sont seuls (pour ne pas bloquer « Constance » ou « violette »)
const BANNED_ALONE = ['con', 'cons', 'pd', 'fdp', 'ntm', 'tg', 'nik', 'niq', 'zob', 'viol', 'cock', 'anal', 'sex', 'cul', 'wtf', 'stfu',
  'pute', 'putes', 'putte', 'bite', 'bites', 'chier', 'nique', 'rape'];

function normalize(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/0/g, 'o').replace(/[1!|]/g, 'i').replace(/3/g, 'e').replace(/[4@]/g, 'a').replace(/[5$]/g, 's').replace(/7/g, 't')
    .replace(/(.)\1+/g, '$1');
}
const squash = (s: string) => s.replace(/[^a-z]/g, '');
const BANNED_N = BANNED.map((w) => squash(normalize(w)));
const ALONE_N = BANNED_ALONE.map((w) => squash(normalize(w)));

// renvoie un message si le pseudonyme est refusé, sinon null
// (raw : ce que le joueur a tapé, avant le retrait des caractères que le jeu ne sait pas dessiner)
export function checkName(name: string, raw = name): string | null {
  if (!name) return 'ÉCRIS UN PSEUDONYME';
  if (raw !== name && checkName(raw.trim() || name) && checkName(raw.trim() || name) !== 'ÉCRIS UN PSEUDONYME') return "CE PSEUDONYME N'EST PAS ACCEPTÉ";
  const n = normalize(name), all = squash(n);
  const words = n.split(/[^a-z]+/).filter(Boolean).map(squash);
  if (BANNED_N.some((w) => all.includes(w)) || words.some((w) => ALONE_N.includes(w)) || ALONE_N.includes(all)) {
    return "CE PSEUDONYME N'EST PAS ACCEPTÉ";
  }
  return null;
}
