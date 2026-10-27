// Les « choses » du jeu : ennemis, tirs, obstacles, bonus, et les calculs de collision.
import { FC, Pix, Color } from '../art';
import * as C from './config';

export type EnemyKind = C.EnemyKind;
export type WeaponKind = 'verm' | 'drag' | 'pinata' | 'rain';
export type BonusKind = 'verm' | 'drag' | 'pinata' | 'jaw' | 'heart' | 'life' | 'bomb' | 'ghost';

export interface Box { x: number; y: number; w: number; h: number }
// zone de collision d'un obstacle (ellipse ou rectangle), relative au coin du dessin
export type Shape = { t: 'e'; cx: number; cy: number; rx: number; ry: number } | { t: 'r'; x: number; y: number; w: number; h: number };

export interface Enemy {
  kind: EnemyKind; x: number; y: number; baseY: number; phase: number; speed: number; amp: number;
  hp: number; holdX: number; holdT: number; shootT: number; flash: number; dead: boolean; group: number;
  vx: number; vy: number; stage: number; size: number;
}
export interface Shot {
  kind: WeaponKind | 'jaw' | 'shard'; x: number; y: number; vx: number; vy: number; dmg: number;
  life: number; age: number; frame: number; bounces: number; hit: Enemy[]; dead: boolean; hitBoss?: boolean;
  src?: number; // numéro du tir (les éclats de Piñata gardent celui de leur Piñata)
  touched?: boolean; // ce tir a déjà touché (pour la précision)
}
export interface EShot { kind: 'web' | 'sugar' | 'bullet' | 'note' | 'juice' | 'maraca' | 'bone'; x: number; y: number; vx: number; vy: number; g: number; dead: boolean; age?: number; bounces?: number }
// elec : zone électrique (clôture) qui s'allume (on secondes) et s'éteint (off secondes)
export interface Elec { x: number; y: number; w: number; h: number; offset: number; on: number; off: number }
// jet de paillettes : part du rocher en biais (vers le haut ou vers le bas), s'allume et s'éteint
export interface Jet { offset: number; down: boolean }
// algue qui pousse (h : taille actuelle) ; herse qui monte et descend
export interface Grow { h: number; max: number; kind: number; top: boolean }
export interface Obstacle { kind: C.ObstacleKind; pix: Pix; x: number; y: number; shapes: Shape[]; speed: number; dead: boolean; belt: boolean; elec?: Elec; top?: boolean; jet?: Jet; grow?: Grow; herse?: { offset: number } }
export interface Bonus { kind: BonusKind; x: number; y: number; baseY: number; speed: number; t: number; dead: boolean }
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: Color; g: number }
export interface Popup { text: string; x: number; y: number; t: number }
export interface Message { text: string; t: number }

export function newEnemy(kind: EnemyKind, x: number, y: number, o: Partial<Enemy> = {}): Enemy {
  return {
    kind, x, y, baseY: y, phase: 0, speed: 50, amp: 0, hp: C.ENEMIES[kind].hp, holdX: 0, holdT: 0, shootT: 0,
    flash: 0, dead: false, group: 0, vx: 0, vy: 0, stage: 0, size: 5, ...o,
  };
}

// ---------- collisions ----------
export function overlap(a: Box, b: Box) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
export function boxEllipse(b: Box, cx: number, cy: number, rx: number, ry: number) {
  const px = Math.max(b.x, Math.min(cx, b.x + b.w)), py = Math.max(b.y, Math.min(cy, b.y + b.h));
  const dx = (px - cx) / rx, dy = (py - cy) / ry;
  return dx * dx + dy * dy <= 1;
}
// la forme de l'obstacle touchée par la boîte (en coordonnées écran), ou null
export function hitObstacle(o: Obstacle, b: Box): Shape | null {
  for (const s of o.shapes) {
    if (s.t === 'e' ? boxEllipse(b, o.x + s.cx, o.y + s.cy, s.rx, s.ry) : overlap(b, { x: o.x + s.x, y: o.y + s.y, w: s.w, h: s.h })) return s;
  }
  return null;
}
export function shapeCenter(o: Obstacle, s: Shape = o.shapes[0]): [number, number] {
  return s.t === 'e' ? [o.x + s.cx, o.y + s.cy] : [o.x + s.x + s.w / 2, o.y + s.y + s.h / 2];
}
// hauteur occupée par un obstacle (haut, bas)
export function vrange(o: Obstacle): [number, number] {
  let a = 1e9, b = -1e9;
  for (const s of o.shapes) {
    const top = s.t === 'e' ? s.cy - s.ry : s.y, bot = s.t === 'e' ? s.cy + s.ry : s.y + s.h;
    a = Math.min(a, o.y + top); b = Math.max(b, o.y + bot);
  }
  return [a, b];
}

const FLY_BOX = { x: 1, y: 3, w: 15, h: 9 }, SPIDER_BOX = { x: 3, y: 3, w: 20, h: 14 };
const BOXES: Record<EnemyKind, Box> = {
  fly: FLY_BOX, flyGold: FLY_BOX, spider: SPIDER_BOX, hanger: SPIDER_BOX,
  wasp: { x: 2, y: 3, w: 18, h: 9 }, ant: { x: 2, y: 3, w: 18, h: 12 }, mint: { x: 0, y: 0, w: 0, h: 0 },
  drone: { x: 5, y: 5, w: 17, h: 11 }, turret: { x: 3, y: 4, w: 16, h: 10 }, spiderling: { x: 1, y: 2, w: 13, h: 8 },
  scorpion: { x: 1, y: 5, w: 22, h: 12 },
  batShrimp: { x: 2, y: 11, w: 24, h: 12 }, guitarFish: { x: 2, y: 3, w: 26, h: 12 }, comet: { x: 29, y: 1, w: 10, h: 10 },
  crab: { x: 2, y: 7, w: 22, h: 11 }, jellyBlue: { x: 2, y: 2, w: 16, h: 14 }, jellyPink: { x: 2, y: 2, w: 16, h: 14 },
  sleepBubble: { x: 2, y: 2, w: 14, h: 14 }, hangShrimp: { x: 2, y: 5, w: 24, h: 12 }, fish: { x: 1, y: 2, w: 14, h: 7 }, miniSkel: { x: 1, y: 1, w: 16, h: 9 },
};
export function enemyBox(e: Enemy): Box {
  if (e.kind === 'mint') return { x: e.x + 1, y: e.y + 1, w: e.size * 2 + 1, h: e.size * 2 + 1 };
  if (e.kind === 'hangShrimp' && e.stage > 0) { const b = BOXES.batShrimp; return { x: e.x + b.x, y: e.y + b.y, w: b.w, h: b.h }; }
  const b = BOXES[e.kind];
  return { x: e.x + b.x, y: e.y + b.y, w: b.w, h: b.h };
}
export function enemyCenter(e: Enemy): [number, number] { const b = enemyBox(e); return [b.x + b.w / 2, b.y + b.h / 2]; }

export function enemySprite(e: Enemy, t: number): Pix {
  switch (e.kind) {
    case 'fly': case 'flyGold': return FC.spr(e.kind, Math.floor(t * 12 + e.phase) % 2);
    case 'fish': return FC.spr('smallFish', Math.floor(t * 6 + e.phase) % 2);
    case 'miniSkel': return FC.spr('miniSkel', Math.floor(t * 8 + e.phase) % 2);
    case 'spider': case 'hanger': return FC.spr('spider', Math.floor(t * 4 + e.phase) % 2);
    case 'wasp': return FC.spr('wasp', Math.floor(t * 14 + e.phase) % 2);
    case 'ant': return FC.spr('ant', Math.floor(t * 8 + e.phase) % 2);
    case 'mint': return FC.mint(e.size, Math.floor(t * 6 + e.phase) % 6);
    case 'drone': return FC.spr('robot', Math.floor(t * 10 + e.phase) % 2);
    case 'turret': return FC.turret(e.flash > 0 || e.shootT < 0.25 ? 1 : 0);
    case 'spiderling': return FC.spr('spiderling', Math.floor(t * 8 + e.phase) % 2);
    case 'scorpion': return FC.spr('scorpion', Math.floor(t * 6 + e.phase) % 2);
    case 'batShrimp': return FC.spr('batShrimp', Math.floor(t * 8 + e.phase) % 2);
    case 'guitarFish': return FC.spr('guitarFish', Math.floor(t * 6 + e.phase) % 2);
    case 'comet': return FC.spr('comet', Math.floor(t * 10));
    case 'crab': return FC.spr('crab', Math.floor(t * 6 + e.phase) % 2);
    case 'jellyBlue': case 'jellyPink': return FC.spr(e.kind, Math.floor(t * 4 + e.phase) % 4);
    case 'sleepBubble': return FC.spr('sleepBubble', Math.floor(t * 2 + e.phase) % 2);
    case 'hangShrimp': return e.stage > 0 ? FC.spr('batShrimp', Math.floor(t * 8 + e.phase) % 2) : FC.spr('batShrimpHang', 0);
  }
}

// ---------- obstacles ----------
export interface ObstacleDef { kind: C.ObstacleKind; pix: Pix; shapes: Shape[]; elec?: Omit<Elec, 'offset' | 'on' | 'off'> }

export function planetDefs(): ObstacleDef[] {
  return FC.mk('planetDefs', () => {
    const out: ObstacleDef[] = [];
    const bases = ['u', 'b', 'g', 'P', 'o', 'y'], frosts = ['q', 'W', 'p', 'y'];
    const add = (pix: Pix, rx: number, ry: number) => out.push({ kind: 'planet', pix, shapes: [{ t: 'e', cx: pix.w / 2, cy: pix.h / 2, rx, ry }] });
    let seed = 50;
    for (const r of [14, 18, 22, 26]) {
      add(FC.donutPlanet(r, ['P', 'p', 'y', 'b'][seed % 4], seed), r * 0.92, r * 0.6);
      add(FC.cakePlanet(r, bases[seed % 6], frosts[seed % 4], seed), r * 0.9, r * 0.9);
      add(FC.macaronPlanet(r - 2, bases[(seed + 2) % 6], 'W'), (r - 2) * 0.92, (r - 2) * 0.66);
      seed += 7;
    }
    for (const r of [9, 12]) add(FC.ringPlanet(r, bases[r % 6], 'P', 'W'), r * 0.9, r * 0.9);
    return out;
  });
}

// petites planètes rondes pour la ceinture de donuts
export function beltDefs(): ObstacleDef[] {
  return FC.mk('beltDefs', () => {
    const out: ObstacleDef[] = [], bases = ['u', 'b', 'g', 'P', 'o', 'y'], frosts = ['q', 'W', 'p', 'y'];
    for (let i = 0; i < 8; i++) {
      const pix = FC.cakePlanet(13, bases[i % 6], frosts[(i * 3) % 4], 200 + i);
      out.push({ kind: 'planet', pix, shapes: [{ t: 'e', cx: pix.w / 2, cy: pix.h / 2, rx: 11.4, ry: 11.4 }] });
    }
    return out;
  });
}

// sucette géante plantée dans le sol : un bonbon rond + un bâton
export function lollipopDef(rnd: () => number): ObstacleDef {
  const h = [30, 42, 54, 66][Math.floor(rnd() * 4)], pix = FC.lollipop(h, Math.floor(rnd() * 3));
  return { kind: 'lollipop', pix, shapes: [{ t: 'e', cx: 13, cy: 12, rx: 10.5, ry: 10.5 }, { t: 'r', x: 11, y: 22, w: 4, h: pix.h - 22 }] };
}
// arbre barbe à papa : un nuage + un tronc
export function cottonDef(rnd: () => number): ObstacleDef {
  const h = [16, 24, 32, 40][Math.floor(rnd() * 4)], pix = FC.cotton(h, Math.floor(rnd() * 4));
  return { kind: 'cotton', pix, shapes: [{ t: 'e', cx: 17, cy: 15, rx: 14, ry: 11 }, { t: 'r', x: 14, y: 24, w: 4, h: pix.h - 24 }] };
}
// toile d'araignée géante suspendue
export function webDef(rnd: () => number): ObstacleDef {
  const r = [16, 20, 24][Math.floor(rnd() * 3)], pix = FC.bigWeb(r);
  return { kind: 'web', pix, shapes: [{ t: 'e', cx: r, cy: r, rx: r * 0.72, ry: r * 0.72 }] };
}

export function pickWeighted<K extends string>(rec: Partial<Record<K, number>>, rnd: () => number): K | null {
  const entries = Object.entries(rec) as [K, number][];
  const total = entries.reduce((s, e) => s + e[1], 0);
  if (!total) return null;
  let r = rnd() * total;
  for (const [k, w] of entries) if ((r -= w) < 0) return k;
  return entries[entries.length - 1][0];
}

// clôture électrique : deux pylônes reliés par des fils qui s'allument et s'éteignent
export function fenceDef(rnd: () => number): ObstacleDef {
  const h = [44, 56, 68][Math.floor(rnd() * 3)];
  const pix = FC.mk('fence' + h, () => {
    const p = new FC.Pix(76, h), py = FC.pylon(h);
    p.blit(py, 0, 0); p.blit(py, 60, 0);
    return p;
  });
  return {
    kind: 'fence', pix, shapes: [{ t: 'r', x: 3, y: 0, w: 10, h }, { t: 'r', x: 63, y: 0, w: 10, h }],
    elec: { x: 12, y: 4, w: 52, h: h - 4 },
  };
}
// pilier de métal : part du sol ou du plafond
export function pillarDef(rnd: () => number): ObstacleDef {
  const h = [36, 48, 60][Math.floor(rnd() * 3)], pix = FC.spr('pillar', h);
  return { kind: 'pillar', pix, shapes: [{ t: 'r', x: 2, y: 0, w: 14, h }] };
}
// la clôture est-elle allumée à cet instant ?
export function elecOn(o: Obstacle, t: number) { return !!o.elec && elecPhase(o, t) < o.elec.on; }
// où en est le cycle (0 = le courant vient de s'allumer)
export function elecPhase(o: Obstacle, t: number) { const e = o.elec!; return (t + e.offset) % (e.on + e.off); }
// le courant va revenir bientôt (avertissement)
export function elecSoon(o: Obstacle, t: number) { const e = o.elec!; return elecPhase(o, t) > e.on + e.off - 0.6; }

// câble électrique suspendu : il pend entre deux attaches et grésille ; on passe dessus ou dessous
export function cableDef(rnd: () => number): ObstacleDef {
  const L = [80, 96, 112][Math.floor(rnd() * 3)], sag = 10 + Math.floor(rnd() * 8);
  const curve = (x: number) => 3 + sag * (1 - Math.pow((x - L / 2) / (L / 2), 2));
  const pix = FC.mk('cable' + L + '_' + sag, () => {
    const p = new FC.Pix(L + 4, sag + 10);
    for (let x = 0; x <= L; x++) { const y = Math.round(curve(x)); p.put(x + 2, y, FC.P.n); p.put(x + 2, y + 1, FC.P.x); }
    p.rect(0, 1, 5, 5, FC.P.m); p.rect(L, 1, 5, 5, FC.P.m); // isolateurs
    p.put(1, 2, FC.P.W); p.put(L + 1, 2, FC.P.W);
    return p;
  });
  const shapes: Shape[] = [];
  for (let x = 0; x < L; x += 12) shapes.push({ t: 'r', x: x + 2, y: curve(x + 6) - 2, w: 12, h: 5 });
  return { kind: 'cable', pix, shapes };
}
// point de la courbe d'un câble (pour dessiner les étincelles)
export function cablePoint(o: Obstacle, f: number): [number, number] {
  const L = o.pix.w - 4, sag = o.pix.h - 10, x = f * L;
  return [o.x + 2 + x, o.y + 3 + sag * (1 - Math.pow((x - L / 2) / (L / 2), 2))];
}

// bloc de glace (en losange)
export function iceDef(rnd: () => number): ObstacleDef {
  const r = [8, 10, 12][Math.floor(rnd() * 3)], pix = FC.iceBlock(r);
  return { kind: 'ice', pix, shapes: [{ t: 'e', cx: r + 1, cy: r + 1, rx: r * 0.72, ry: r * 0.72 }] };
}
// goutte d'eau géante
export function dropDef(rnd: () => number): ObstacleDef {
  const r = [7, 9][Math.floor(rnd() * 2)], pix = FC.waterDrop(r);
  return { kind: 'drop', pix, shapes: [{ t: 'e', cx: r + 2, cy: r * 2 + 1, rx: r * 0.9, ry: r * 0.9 }, { t: 'e', cx: r + 2, cy: r, rx: r * 0.4, ry: r * 0.7 }] };
}
// rocher d'où jaillit un jet de paillettes
export function jetRockDef(): ObstacleDef {
  const pix = FC.cakePlanet(14, 'M', 'm', 5);
  return { kind: 'jet', pix, shapes: [{ t: 'e', cx: pix.w / 2, cy: pix.h / 2, rx: 12.6, ry: 12.6 }] };
}
// le jet : allumé, en avertissement (il scintille), ou éteint
export function jetState(o: Obstacle, t: number): 'on' | 'warn' | 'off' {
  const ph = (t + o.jet!.offset) % (C.JET.on + C.JET.off);
  return ph < C.JET.on ? 'on' : ph > C.JET.on + C.JET.off - C.JET.warn ? 'warn' : 'off';
}
// la bouche du jet et sa direction (en biais vers la gauche)
export function jetOrigin(o: Obstacle): { x: number; y: number; dx: number; dy: number } {
  const down = o.jet!.down;
  return { x: o.x + o.pix.w / 2 - 4, y: down ? o.y + o.pix.h - 4 : o.y + 4, dx: -0.68, dy: down ? 0.74 : -0.74 };
}
// cercles qui couvrent le jet (pour savoir si on le touche)
export function jetCircles(o: Obstacle): [number, number, number][] {
  const g = jetOrigin(o), out: [number, number, number][] = [];
  for (let d = 12; d <= C.JET.length; d += 11) out.push([g.x + g.dx * d, g.y + g.dy * d, 4 + d * 0.05]);
  return out;
}

// dessin d'une algue de hauteur h (arrondie à 4 pixels), à l'endroit ou à l'envers (plafond)
export function algaePix(h: number, kind: number, top: boolean, f: number): Pix {
  const hq = Math.max(8, Math.round(h / 4) * 4);
  return top ? FC.mk('algF' + hq + '_' + kind + '_' + f, () => FC.flipV(FC.algae(hq, kind, f))) : FC.algae(hq, kind, f);
}
// herse du château (elle descend du plafond)
export function herseDef(): ObstacleDef {
  const pix = FC.portcullis(64);
  return { kind: 'herse', pix, shapes: [{ t: 'r', x: 1, y: 0, w: 28, h: 64 }] };
}
