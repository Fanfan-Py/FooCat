// Réglages du jeu : tout ce qu'on peut ajuster facilement est ici.

export const W = 320; // largeur de l'écran de jeu (en pixels du jeu)
export const H = 180; // hauteur
export const HUD_H = 14; // bandeau du haut (score, vies...)

// Le choix du niveau à l'accueil n'existe qu'en mode développeur (voir app.ts).

// Modes de difficulté (choisis sur la ligne MODE de l'accueil).
// spawn : ennemis plus nombreux ; obstacle : obstacles plus nombreux ; speed : vitesse des ennemis et de leurs tirs ;
// enemyFire : tirs plus fréquents ; hp : résistance des ennemis ; bossHp : vie des boss ; bonus : fréquence des bonus.
// « facile » est le jeu tel qu'il était jusqu'au 28 octobre 2026.
export const MODES = {
  facile: { lives: 3, energy: 4, spawn: 1, obstacle: 1, speed: 1, enemyFire: 1, hp: 1, bossHp: 1, bonus: 1 },
  normal: { lives: 3, energy: 4, spawn: 1.15, obstacle: 1.2, speed: 1.05, enemyFire: 1.15, hp: 1.3, bossHp: 1.2, bonus: 1 },
  difficile: { lives: 2, energy: 4, spawn: 1.25, obstacle: 1.3, speed: 1.1, enemyFire: 1.25, hp: 1.45, bossHp: 1.3, bonus: 0.9 },
};
export type Mode = keyof typeof MODES;

export const LIVES_MAX = 5;
export const DAMAGE = { shot: 1, enemy: 1, obstacle: 2, web: 1, juice: 2 }; // cœurs perdus (jus de fraise : 2)
export const SLEEP_TIME = 1.5; // une bulle soporifique endort le chat (secondes)
export const INVINCIBLE_AFTER_HIT = 1.2; // secondes
export const INVINCIBLE_AFTER_RESPAWN = 2.5;
export const WEB_SLOW = { time: 1.5, factor: 0.5 }; // une toile ralentit le chat
export const BIG_WEB_SLOW = 1.6; // une toile géante colle plus longtemps

// Le chat
export const HERO_SPEED = 115; // pixels par seconde
export const HERO_START = { x: 24, y: 70 };

// Armes : chacune a un vrai rôle
export const WEAPONS = {
  // Vermicelles : mitraillette rapide et faible, qui part en éventail (contre les nuées de mouches)
  verm: { rate: 14, dmg: 1, speed: 250, spread: 8, start: 400, max: 700, pickup: 200 },
  // Dragibus : gros, lents et puissants ; partent en diagonale et rebondissent sur les bords et les obstacles
  drag: { rate: 2.8, dmg: 4, speed: 165, angle: 16, bounces: 3, start: 40, max: 90, pickup: 25 },
  // Arc-en-ciel (la corne) : infini, courte portée, grandit et traverse les ennemis et les obstacles
  rain: { rate: 2.6, dmg: 2, speed: 150, range: 115 },
  // Piñata : gros bonbon lent qui éclate en petits bonbons quand il touche (ou au bout de sa course) ;
  // les éclats partent en étoile et touchent d'autres monstres
  pinata: { rate: 1.4, dmg: 5, speed: 120, life: 2.2, shards: 8, shardDmg: 2, shardSpeed: 140, shardLife: 0.5, start: 10, max: 30, pickup: 8 },
  // Casse-dents : touche spéciale ; traverse les ennemis et fait exploser un obstacle
  jaw: { rate: 1.5, dmg: 12, speed: 140, blast: 38, blastDmg: 6, start: 2, max: 5, pickup: 1 },
};
export const WEAPON_NAMES = { verm: 'VERMICELLES', drag: 'DRAGIBUS', pinata: 'PIÑATA', rain: 'ARC-EN-CIEL', jaw: 'CASSE-DENTS' };

// Ennemis : points gagnés, résistance (nombre de dégâts), chance de laisser un bonus
export const ENEMIES = {
  fly: { points: 100, hp: 1, drop: 0.07 }, // mouche
  flyGold: { points: 250, hp: 4, drop: 0.3 }, // mouche dorée
  spider: { points: 300, hp: 5, drop: 0.4 }, // araignée spatiale (tire des toiles)
  wasp: { points: 200, hp: 2, drop: 0.12 }, // guêpe : vise le chat puis fonce en piqué
  mint: { points: 50, hp: 3, drop: 0.05 }, // bonbon à la menthe qui dérive
  ant: { points: 150, hp: 3, drop: 0.15 }, // fourmi au sol : lance des sucres en cloche
  hanger: { points: 250, hp: 4, drop: 0.2 }, // araignée qui monte et descend au bout de son fil
  drone: { points: 350, hp: 5, drop: 0.3 }, // drone-araignée : tire des rafales
  turret: { points: 400, hp: 6, drop: 0.25 }, // tourelle au sol : tire vers le chat
  spiderling: { points: 150, hp: 2, drop: 0.08 }, // mini-araignée de métal : fonce vers le chat
  scorpion: { points: 350, hp: 6, drop: 0.25 }, // scorpion de fer au sol : tire 3 balles en éventail
  batShrimp: { points: 200, hp: 2, drop: 0.12 }, // crevette chauve-souris : vole en grandes vagues
  guitarFish: { points: 300, hp: 4, drop: 0.25 }, // poisson guitare : lance des notes de feu qui ondulent
  comet: { points: 150, hp: 6, drop: 0.05 }, // comète : traverse l'écran en diagonale, très vite
  crab: { points: 250, hp: 4, drop: 0.2 }, // crabe : marche au fond, saute, lance des maracas qui rebondissent
  jellyBlue: { points: 200, hp: 3, drop: 0.15 }, // méduse bleue : monte et descend, lance du jus de fraise
  jellyPink: { points: 250, hp: 3, drop: 0.2 }, // méduse rose : plus rapide, jus de fraise en éventail
  sleepBubble: { points: 30, hp: 1, drop: 0 }, // bulle soporifique : endort le chat (on peut la crever)
  hangShrimp: { points: 250, hp: 2, drop: 0.15 }, // crevette accrochée au plafond : se laisse tomber
  fish: { points: 100, hp: 1, drop: 0.07 }, // petit poisson (en bancs, sous l'eau)
  miniSkel: { points: 120, hp: 2, drop: 0.06 }, // mini-poisson squelette (escorte du boss du niveau 10)
  sorbet: { points: 250, hp: 4, drop: 0.2 }, // sorbet volant : s'arrête et lance des boules de sorbet qui ralentissent
  scout: { points: 200, hp: 2, drop: 0.12 }, // éclaireur du Scorpion : vole en formation puis plonge vers le chat
  emberBat: { points: 150, hp: 2, drop: 0.1 }, // chauve-souris de braise : en nuée ; vaincue, elle lâche 3 étincelles
  dragonet: { points: 400, hp: 6, drop: 0.3 }, // dragonnet : s'arrête, prévient, puis souffle un jet de feu
  firefly: { points: 100, hp: 1, drop: 0.07 }, // luciole de feu (remplace les mouches dans le monde Vulcano)
  salamander: { points: 300, hp: 4, drop: 0.2 }, // salamandre : marche au sol, saute, crache des gouttes de feu
  magmaSnake: { points: 350, hp: 3, drop: 0.15 }, // serpent de magma : jaillit du sol (des bulles préviennent) et retombe en arc
  miniScorp: { points: 200, hp: 2, drop: 0.1 }, // mini-scorpion volant : se place n'importe où, vise, puis fonce
  phoenix: { points: 400, hp: 3, drop: 0.25 }, // phénix-poussin : renaît de ses cendres, sauf si on tire sur les cendres
  golem: { points: 600, hp: 14, drop: 0.4 }, // golem de lave : lent et très solide
  miniScorpSkel: { points: 150, hp: 2, drop: 0.08 }, // mini-scorpion squelette (escorte du Scorpion de feu, 3e forme)
};
export type EnemyKind = keyof typeof ENEMIES;
export const POINTS = { planet: 300, bonus: 50, wave: 500, belt: 1000, perSecond: 10 };

// Vagues d'ennemis possibles
export type WaveKind = 'solo' | 'line' | 'v' | 'column' | 'swarm' | 'spider' | 'wasps' | 'mints' | 'ants' | 'hanger' | 'drone' | 'turret' | 'spiderling' | 'scorpion' | 'droneSquad' | 'batShrimp' | 'guitar' | 'comets' | 'crab' | 'jellyBlue' | 'jellyPink' | 'bubbles' | 'hanging' | 'sorbets' | 'scouts' | 'emberBats' | 'dragonet' | 'salamanders' | 'magma' | 'fireballs' | 'miniScorps' | 'phoenix' | 'golem';
// Obstacles possibles
export type ObstacleKind = 'planet' | 'lollipop' | 'cotton' | 'web' | 'fence' | 'pillar' | 'cable' | 'ice' | 'drop' | 'jet' | 'algae' | 'herse' | 'coral' | 'fireRock' | 'fireTree' | 'liana' | 'lavaFall';

export interface Phase {
  from: number; // part des points du niveau (0 = début, 1 = fin)
  banner?: string; // message affiché au début de l'étape
  event?: 'belt' | 'boss'; // événement spécial
  obstacle: number; // secondes entre deux obstacles
  obstacles: Partial<Record<ObstacleKind, number>>; // lesquels, avec leur poids
  wave: number; // secondes entre deux vagues d'ennemis
  waves: Partial<Record<WaveKind, number>>; // lesquelles, avec leur poids
  gold: number; // part de mouches dorées
  slalom?: boolean; // obstacles en alternance en haut et en bas : il faut zigzaguer
}

export interface Level {
  num: number; name: string;
  points: number; // points à gagner dans ce niveau pour passer au suivant
  decor: 'space' | 'nebula' | 'planet' | 'iron' | 'fortress' | 'space2' | 'ocean' | 'sea' | 'castle' | 'throne' | 'space3' | 'approach' | 'vulcano' | 'cave' | 'volcanoThrone';
  ground: number | null; // hauteur du sol (null = pas de sol)
  ceiling: number | null; // hauteur du plafond (null = pas de plafond)
  outro?: string; // couleur du fondu de fin de niveau
  boss?: 'spider' | 'skel' | 'scorp'; // le niveau se termine en battant ce boss
  water?: boolean; // sous l'eau : les groupes de mouches deviennent des bancs de poissons
  fire?: boolean; // monde Vulcano : les groupes de mouches deviennent des lucioles de feu
  scroll: number; // vitesse de défilement des obstacles (px/s)
  next?: string; // texte de l'écran de fin
  phases: Phase[];
}

export const LEVELS: Level[] = [
  {
    num: 1, name: 'ESPACE PROFOND', points: 32000, decor: 'space', ground: null, ceiling: null, scroll: 30,
    phases: [
      { from: 0, obstacle: 6.5, obstacles: { planet: 1 }, wave: 3.0, waves: { solo: 2, line: 1 }, gold: 0 },
      { from: 0.15, obstacle: 4.8, obstacles: { planet: 1 }, wave: 2.6, waves: { line: 1, v: 1, column: 1, solo: 1, spider: 1 }, gold: 0.1 },
      { from: 0.42, event: 'belt', banner: 'CEINTURE DE DONUTS !', obstacle: 99, obstacles: {}, wave: 5, waves: { solo: 1 }, gold: 0 },
      { from: 0.45, obstacle: 3.6, obstacles: { planet: 1 }, wave: 2.1, waves: { line: 1, v: 1, column: 1, swarm: 1, spider: 2 }, gold: 0.25 },
      { from: 0.8, banner: 'LA GRANDE NUÉE !', obstacle: 5.5, obstacles: { planet: 1 }, wave: 1.4, waves: { swarm: 2, v: 1, line: 1, spider: 1 }, gold: 0.35 },
    ],
  },
  {
    num: 2, name: 'NÉBULEUSE SUCRÉE', points: 42000, decor: 'nebula', ground: null, ceiling: null, scroll: 34, outro: 'q',
    phases: [
      { from: 0, obstacle: 4.4, obstacles: { planet: 1 }, wave: 2.6, waves: { line: 2, v: 1, solo: 1, mints: 1 }, gold: 0.15 },
      { from: 0.15, banner: 'ATTENTION AUX GUÊPES !', obstacle: 3.8, obstacles: { planet: 1 }, wave: 2.2, waves: { wasps: 2, line: 1, v: 1, swarm: 1, spider: 1, mints: 1 }, gold: 0.25 },
      { from: 0.45, banner: 'PLUIE DE BONBONS !', obstacle: 7, obstacles: { planet: 1 }, wave: 0.9, waves: { mints: 4, wasps: 1 }, gold: 0 },
      { from: 0.6, obstacle: 3.2, obstacles: { planet: 1 }, wave: 1.8, waves: { swarm: 1, v: 1, column: 1, wasps: 2, spider: 2 }, gold: 0.35 },
      { from: 0.88, banner: 'ATTERRISSAGE EN VUE !', obstacle: 99, obstacles: {}, wave: 1.6, waves: { wasps: 2, line: 1, swarm: 1 }, gold: 0.3 },
    ],
  },
  {
    num: 3, name: 'PLANÈTE PÂTISSERIE', points: 30000, decor: 'planet', ground: 150, ceiling: null, scroll: 40,
    phases: [
      { from: 0, obstacle: 3.8, obstacles: { lollipop: 2, cotton: 2, web: 1 }, wave: 2.6, waves: { ants: 1, solo: 1, line: 1, hanger: 1 }, gold: 0.1 },
      { from: 0.15, obstacle: 3.2, obstacles: { lollipop: 2, cotton: 2, web: 2 }, wave: 2.2, waves: { ants: 2, hanger: 2, v: 1, line: 1, wasps: 1 }, gold: 0.2 },
      { from: 0.45, banner: 'LA FORÊT DE TOILES !', obstacle: 2.4, obstacles: { web: 4, lollipop: 1 }, wave: 2.4, waves: { hanger: 3, solo: 1 }, gold: 0 },
      { from: 0.62, obstacle: 3.0, obstacles: { lollipop: 2, cotton: 2, web: 2 }, wave: 1.9, waves: { ants: 2, hanger: 2, wasps: 1, swarm: 1, spider: 1 }, gold: 0.3 },
      { from: 0.88, banner: 'DERNIER EFFORT !', obstacle: 3.2, obstacles: { lollipop: 1, cotton: 1, web: 1 }, wave: 1.4, waves: { ants: 2, wasps: 2, swarm: 1, hanger: 1 }, gold: 0.35 },
    ],
  },
  {
    num: 4, name: 'TERRES DE FER', points: 30000, decor: 'iron', ground: 148, ceiling: null, scroll: 44, outro: 'K',
    phases: [
      { from: 0, obstacle: 6.0, obstacles: { fence: 1 }, wave: 2.5, waves: { drone: 1, solo: 1, line: 2, scorpion: 1 }, gold: 0.2 },
      { from: 0.15, obstacle: 4.8, obstacles: { fence: 3, cable: 1 }, wave: 2.2, waves: { drone: 1, droneSquad: 1, turret: 1, scorpion: 1, v: 1, line: 2, wasps: 1 }, gold: 0.25 },
      { from: 0.45, banner: 'ZONE ÉLECTRIQUE !', obstacle: 3.0, obstacles: { fence: 2, cable: 1 }, wave: 3.0, waves: { solo: 2, scorpion: 1, droneSquad: 1 }, gold: 0 },
      { from: 0.6, obstacle: 4.4, obstacles: { fence: 3, cable: 1 }, wave: 2.0, waves: { drone: 1, droneSquad: 1, turret: 1, scorpion: 1, swarm: 1, v: 1, line: 1, spider: 1 }, gold: 0.3 },
      { from: 0.88, banner: 'LA FORTERESSE !', obstacle: 99, obstacles: {}, wave: 2.0, waves: { droneSquad: 1, drone: 1, turret: 1, scorpion: 1, line: 2 }, gold: 0.3 },
    ],
  },
  {
    num: 5, name: 'LA FORTERESSE', points: 16000, decor: 'fortress', ground: 160, ceiling: 24, scroll: 40, boss: 'spider',
    next: "L'ARAIGNÉE DE FER EST VAINCUE !",
    phases: [
      { from: 0, obstacle: 3.6, obstacles: { pillar: 2, web: 1 }, wave: 2.6, waves: { drone: 1, spiderling: 2, hanger: 1 }, gold: 0 },
      { from: 0.3, banner: 'AU COEUR DE LA FORTERESSE', obstacle: 3.0, obstacles: { pillar: 2, web: 2 }, wave: 2.0, waves: { drone: 2, spiderling: 2, hanger: 1, swarm: 1 }, gold: 0.3 },
      { from: 0.7, obstacle: 4.0, obstacles: { pillar: 1 }, wave: 1.6, waves: { spiderling: 3, drone: 1 }, gold: 0 },
      { from: 1, event: 'boss', banner: "L'ARAIGNÉE DE FER !", obstacle: 99, obstacles: {}, wave: 99, waves: {}, gold: 0 },
    ],
  },
  {
    num: 6, name: "RETOUR DANS L'ESPACE", points: 32000, decor: 'space2', ground: null, ceiling: null, scroll: 32,
    phases: [
      { from: 0, obstacle: 4.4, obstacles: { planet: 3, jet: 1 }, wave: 2.3, waves: { line: 1, v: 1, batShrimp: 2, mints: 1 }, gold: 0.2 },
      { from: 0.2, banner: 'ATTENTION AUX PAILLETTES !', obstacle: 4.0, obstacles: { planet: 2, jet: 2 }, wave: 2.2, waves: { batShrimp: 2, wasps: 1, swarm: 1, line: 1, spider: 1 }, gold: 0.25 },
      { from: 0.5, banner: 'PLUIE DE COMÈTES !', obstacle: 6, obstacles: { planet: 1 }, wave: 1.3, waves: { comets: 3, batShrimp: 1 }, gold: 0 },
      { from: 0.65, obstacle: 3.7, obstacles: { planet: 2, jet: 1 }, wave: 2.0, waves: { batShrimp: 2, v: 1, swarm: 1, wasps: 1, spider: 1 }, gold: 0.3 },
      { from: 0.9, banner: 'DERNIER EFFORT !', obstacle: 4.4, obstacles: { jet: 1, planet: 2 }, wave: 1.6, waves: { batShrimp: 2, swarm: 1, wasps: 1 }, gold: 0.35 },
    ],
  },
  {
    num: 7, name: 'VERS LA PLANÈTE AQUATIQUE', points: 28000, decor: 'ocean', ground: null, ceiling: null, scroll: 34, outro: 'B',
    phases: [
      { from: 0, obstacle: 4.0, obstacles: { ice: 2, drop: 1 }, wave: 2.2, waves: { guitar: 1, batShrimp: 1, line: 1, solo: 1 }, gold: 0.2 },
      { from: 0.2, banner: 'LES POISSONS GUITARE !', obstacle: 3.5, obstacles: { ice: 2, drop: 1, jet: 1 }, wave: 2.0, waves: { guitar: 2, batShrimp: 1, v: 1, wasps: 1 }, gold: 0.25 },
      { from: 0.5, banner: 'CHAMP DE GLACE !', obstacle: 3.0, obstacles: { ice: 3, drop: 2 }, wave: 3.2, waves: { batShrimp: 1, solo: 1 }, gold: 0 },
      { from: 0.65, obstacle: 3.2, obstacles: { ice: 1, drop: 1, jet: 1 }, wave: 1.75, waves: { guitar: 2, batShrimp: 2, swarm: 1, spider: 1 }, gold: 0.3 },
      { from: 0.9, banner: 'PLONGEON IMMINENT !', obstacle: 99, obstacles: {}, wave: 1.6, waves: { guitar: 2, batShrimp: 1, line: 1 }, gold: 0.3 },
    ],
  },
  {
    num: 8, name: 'LA PLANÈTE SOUS-MARINE', points: 24000, decor: 'sea', ground: 154, ceiling: 26, scroll: 36, outro: 'U', water: true,
    phases: [
      { from: 0, obstacle: 3.1, obstacles: { algae: 2, coral: 1 }, wave: 2.2, waves: { crab: 2, jellyBlue: 1, solo: 1, line: 1 }, gold: 0.1 },
      { from: 0.2, banner: 'ATTENTION AUX BULLES !', obstacle: 2.8, obstacles: { algae: 2, coral: 1 }, wave: 2.1, waves: { bubbles: 1, jellyBlue: 1, crab: 1, guitar: 1, line: 1 }, gold: 0.2 },
      { from: 0.45, banner: "LA FORÊT D'ALGUES !", obstacle: 1.7, obstacles: { algae: 1 }, slalom: true, wave: 2.9, waves: { solo: 1, bubbles: 1 }, gold: 0 },
      { from: 0.62, obstacle: 2.6, obstacles: { algae: 2, coral: 1 }, wave: 1.85, waves: { jellyPink: 1, jellyBlue: 1, crab: 1, guitar: 1, bubbles: 1, batShrimp: 1, line: 1 }, gold: 0.3 },
      { from: 0.88, banner: 'LE CHÂTEAU EN VUE !', obstacle: 2.2, obstacles: { algae: 1 }, slalom: true, wave: 1.6, waves: { crab: 2, jellyPink: 1, guitar: 1, batShrimp: 1 }, gold: 0.3 },
    ],
  },
  {
    num: 9, name: 'LE CHÂTEAU MARIN', points: 28000, decor: 'castle', ground: 156, ceiling: 26, scroll: 40, water: true,
    phases: [
      { from: 0, obstacle: 2.6, obstacles: { herse: 1, algae: 1 }, slalom: true, wave: 3.0, waves: { hanging: 1, crab: 1, jellyBlue: 1, line: 1 }, gold: 0.1 },
      { from: 0.2, banner: 'ATTENTION AUX HERSES !', obstacle: 2.0, obstacles: { herse: 1, algae: 1 }, slalom: true, wave: 2.9, waves: { hanging: 2, crab: 1, jellyPink: 1, bubbles: 1, line: 1 }, gold: 0.2 },
      { from: 0.45, banner: 'LES GARDES DU CHÂTEAU !', obstacle: 4.5, obstacles: { algae: 1 }, wave: 2.0, waves: { crab: 2, guitar: 1, jellyBlue: 1, line: 1 }, gold: 0 },
      { from: 0.62, obstacle: 2.0, obstacles: { herse: 1, algae: 1 }, slalom: true, wave: 2.7, waves: { hanging: 1, jellyBlue: 1, jellyPink: 1, bubbles: 1, guitar: 1, line: 1 }, gold: 0.3 },
      { from: 0.88, banner: 'LA SALLE DU TRÔNE !', obstacle: 2.2, obstacles: { herse: 1, algae: 1 }, slalom: true, wave: 2.4, waves: { crab: 1, hanging: 2, jellyPink: 1, line: 1 }, gold: 0.3 },
    ],
  },
  {
    num: 10, name: 'LA SALLE DU TRÔNE', points: 14000, decor: 'throne', ground: 160, ceiling: 24, scroll: 40, water: true, boss: 'skel',
    next: 'LA PLANÈTE AQUATIQUE EST SAUVÉE !',
    phases: [
      { from: 0, obstacle: 2.6, obstacles: { herse: 1, algae: 1 }, slalom: true, wave: 2.8, waves: { jellyBlue: 1, crab: 1, hanging: 1, line: 1 }, gold: 0.1 },
      { from: 0.4, banner: 'LES DERNIERS GARDES !', obstacle: 3.4, obstacles: { algae: 1 }, wave: 2.2, waves: { jellyPink: 1, guitar: 1, bubbles: 1, batShrimp: 1, line: 1 }, gold: 0.2 },
      { from: 0.75, obstacle: 4.0, obstacles: { algae: 1 }, wave: 2.6, waves: { crab: 1, jellyBlue: 1, line: 1 }, gold: 0.3 },
      { from: 1, event: 'boss', banner: 'LE POISSON SQUELETTE DE LA MORT !', obstacle: 99, obstacles: {}, wave: 99, waves: {}, gold: 0 },
    ],
  },
  // ---------- le monde Vulcano ----------
  {
    num: 11, name: "RETOUR DANS L'ESPACE", points: 33000, decor: 'space3', ground: null, ceiling: null, scroll: 34,
    phases: [
      { from: 0, obstacle: 4.33, obstacles: { planet: 2 }, wave: 1.97, waves: { line: 1, comets: 1, sorbets: 1, scouts: 1 }, gold: 0.2 },
      { from: 0.2, banner: 'PLUIE DE MÉTÉORITES !', obstacle: 6, obstacles: { planet: 1 }, wave: 1.07, waves: { comets: 3, scouts: 1 }, gold: 0 },
      { from: 0.4, banner: 'LES SORBETS VOLANTS !', obstacle: 4.13, obstacles: { planet: 2 }, wave: 1.64, waves: { sorbets: 2, line: 1, scouts: 1, v: 1 }, gold: 0.25 },
      { from: 0.65, obstacle: 3.94, obstacles: { planet: 2 }, wave: 1.48, waves: { comets: 2, sorbets: 1, scouts: 2, swarm: 1 }, gold: 0.3 },
      { from: 0.88, banner: 'DERNIER EFFORT !', obstacle: 4.33, obstacles: { planet: 1 }, wave: 1.23, waves: { scouts: 2, comets: 2, sorbets: 1 }, gold: 0.35 },
    ],
  },
  {
    num: 12, name: 'APPROCHE DE VULCANO', points: 44000, decor: 'approach', ground: null, ceiling: null, scroll: 36, outro: 'o',
    phases: [
      { from: 0, obstacle: 3.6, obstacles: { fireRock: 2, planet: 1 }, wave: 1.95, waves: { emberBats: 2, scouts: 1, line: 1, sorbets: 1 }, gold: 0.2 },
      { from: 0.25, banner: 'CHAUVES-SOURIS DE BRAISE !', obstacle: 3.1, obstacles: { fireRock: 2 }, wave: 1.6, waves: { emberBats: 3, dragonet: 2, line: 1 }, gold: 0.2 },
      { from: 0.5, banner: 'ATTENTION AUX DRAGONNETS !', obstacle: 3.2, obstacles: { fireRock: 2 }, wave: 1.8, waves: { dragonet: 2, emberBats: 1, scouts: 1, sorbets: 1 }, gold: 0.25 },
      { from: 0.75, banner: 'VULCANO EN VUE !', obstacle: 2.7, obstacles: { fireRock: 3 }, wave: 1.45, waves: { emberBats: 2, dragonet: 1, comets: 1, scouts: 1 }, gold: 0.3 },
    ],
  },
  {
    num: 13, name: 'SUR LA PLANÈTE VULCANO', points: 40000, decor: 'vulcano', ground: 150, ceiling: null, scroll: 40, fire: true,
    phases: [
      { from: 0, obstacle: 3.2, obstacles: { fireTree: 2, liana: 1 }, wave: 2.0, waves: { line: 1, salamanders: 1, emberBats: 1, solo: 1 }, gold: 0.2 },
      { from: 0.2, banner: 'LES ARBRES EN FEU !', obstacle: 2.6, obstacles: { fireTree: 3, liana: 1 }, wave: 2.0, waves: { salamanders: 1, line: 1, fireballs: 1, emberBats: 1 }, gold: 0.25 },
      { from: 0.45, banner: 'ATTENTION AUX LIANES !', obstacle: 2.2, obstacles: { liana: 3, fireTree: 1 }, wave: 2.2, waves: { magma: 2, emberBats: 1, swarm: 1 }, gold: 0.2 },
      { from: 0.7, banner: 'LE VOLCAN SE RÉVEILLE !', obstacle: 2.8, obstacles: { fireTree: 2, liana: 2 }, wave: 1.6, waves: { fireballs: 2, magma: 2, salamanders: 1, dragonet: 1 }, gold: 0.3 },
      { from: 0.9, banner: 'DERNIER EFFORT !', obstacle: 3.0, obstacles: { fireTree: 2, liana: 1 }, wave: 1.5, waves: { salamanders: 1, magma: 1, emberBats: 1, line: 1 }, gold: 0.35 },
    ],
  },
  {
    num: 14, name: "DANS L'ANTRE DU VOLCAN", points: 34000, decor: 'cave', ground: 154, ceiling: 26, scroll: 38, fire: true, outro: 'r',
    phases: [
      { from: 0, obstacle: 3.4, obstacles: { lavaFall: 2, fireRock: 1 }, wave: 2.2, waves: { miniScorps: 1, line: 1, fireballs: 1 }, gold: 0.2 },
      { from: 0.2, banner: 'LES COULÉES DE LAVE !', obstacle: 2.8, obstacles: { lavaFall: 3 }, wave: 2.4, waves: { miniScorps: 1, phoenix: 1, line: 1 }, gold: 0.2 },
      { from: 0.45, banner: 'LES MINI-SCORPIONS !', obstacle: 3.2, obstacles: { lavaFall: 2, fireRock: 1 }, wave: 1.8, waves: { miniScorps: 2, phoenix: 1, fireballs: 1, line: 1 }, gold: 0.25 },
      { from: 0.7, banner: 'LES GOLEMS DE LAVE !', obstacle: 3.0, obstacles: { lavaFall: 2 }, wave: 2.0, waves: { golem: 1, miniScorps: 2, phoenix: 1, magma: 1 }, gold: 0.3 },
      { from: 0.9, banner: 'DERNIER EFFORT !', obstacle: 2.8, obstacles: { lavaFall: 2, fireRock: 1 }, wave: 1.6, waves: { miniScorps: 2, fireballs: 1, golem: 1, phoenix: 1 }, gold: 0.35 },
    ],
  },
  {
    num: 15, name: 'LA SALLE DU TRÔNE DU VOLCAN', points: 12000, decor: 'volcanoThrone', ground: 158, ceiling: 24, scroll: 40, fire: true, boss: 'scorp',
    next: 'LA SUITE ARRIVE BIENTÔT : LE VAISSEAU DES BOSS !',
    phases: [
      { from: 0, obstacle: 3.4, obstacles: { lavaFall: 1, fireRock: 1 }, wave: 2.2, waves: { miniScorps: 1, emberBats: 1, line: 1 }, gold: 0.2 },
      { from: 0.4, banner: 'LES GARDES DU SCORPION !', obstacle: 3.8, obstacles: { lavaFall: 1 }, wave: 1.8, waves: { scouts: 1, salamanders: 1, phoenix: 1, line: 1 }, gold: 0.25 },
      { from: 0.75, obstacle: 4.0, obstacles: { fireRock: 1 }, wave: 1.6, waves: { emberBats: 2, miniScorps: 1, fireballs: 1 }, gold: 0.3 },
      { from: 1, event: 'boss', banner: 'LE SCORPION VOLANT DE FEU !', obstacle: 99, obstacles: {}, wave: 99, waves: {}, gold: 0 },
    ],
  },
];

// Coulées de lave (niveau 14) : éteinte (off s), gouttes d'avertissement (warn s), coulée (on s), fin (end s), en boucle
export const LAVA = { off: 2.4, warn: 1.0, on: 1.3, end: 0.35, width: 7 };
// Serpent de magma : bulles d'avertissement (warn s), puis saut en arc (leap s)
export const MAGMA = { warn: 0.9, leap: 1.4 };

// Dragonnet : fumée d'avertissement (warn s), jet de feu (fire s) long de « length » pixels, toutes les « every » s
export const DRAGONET = { warn: 0.7, fire: 1.1, every: 2.2, length: 86 };

// Algues : elles poussent pendant qu'on avance (pixels par seconde), jusqu'à leur taille maximale
export const ALGAE = { grow: 22, min: 40, max: 84 };

// Jets de paillettes : allumés « on » secondes, éteints « off » secondes (ils scintillent juste avant)
export const JET = { on: 1.8, off: 2.4, length: 100, warn: 0.7 };

// Le boss du niveau 5
export const BOSS = { hp: 420, points: 10000, contact: 2, laser: 2 };
// Le boss du niveau 10 : le poisson squelette (sa jauge se remplit une fois quand l'armure casse)
export const SKEL = { hp: 200, points: 15000, contact: 2 };
// Le boss du niveau 15 : le Scorpion volant de feu (3 formes ; hp pour chacune) ; breath : longueur du jet de feu
export const SCORP = { hp: 100, points: 20000, contact: 2, fire: 1, breath: 80 };

// La ceinture de donuts : des colonnes de planètes avec un passage qui ondule
export const BELT = { columns: 10, every: 1.5, gap: 64, speed: 36, flies: 0.7 }; // flies : chance d'une mouche dans le passage, à chaque colonne

export const BONUS_EVERY = 11; // secondes entre deux bonus qui arrivent tout seuls
// Probabilité de chaque bonus
export const BONUS_WEIGHTS: Record<string, number> = {
  verm: 28, drag: 24, pinata: 18, jaw: 12, heart: 14, life: 5, bomb: 8, ghost: 7,
};
export const GHOST_TIME = 5;
