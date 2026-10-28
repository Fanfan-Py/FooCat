// Test automatique : un « robot » joue chaque niveau plusieurs fois
// pour vérifier que rien ne plante et mesurer la durée et la difficulté.
import { FC } from '../src/art';
import { World, Controls } from '../src/game/world';
import { vrange, jetCircles, jetState } from '../src/game/things';
import { App, AppInput } from '../src/game/app';
import { W, H, LEVELS, Mode } from '../src/game/config';
import { endlessZone, dailySetup } from '../src/game/modes';
import { savePng } from './png';

const sfx = { play() { } };
const STEP = 1 / 60;
const shotsDir = process.env.SHOTS || '';
const mode = (process.env.MODE || 'normal') as Mode;
const runs = Number(process.env.RUNS || 8);

// Robot : cherche la hauteur libre la plus proche devant lui, tire tout le temps
// band : robot « planqué », qui n'esquive que dans une bande de 40 pixels en haut ou en bas de l'écran
let band: 'haut' | 'bas' | null = null;
function robot(w: World, t: number, look = 95): Controls {
  const h = w.hero, cy = h.y + 17;
  const blocked: [number, number][] = [];
  for (const o of w.obstacles) {
    if (o.x + o.pix.w > h.x && o.x - h.x < look) { const [a, b] = vrange(o); blocked.push([a - 12, b + 12]); }
  }
  // jets de paillettes allumés ou sur le point de l'être
  for (const o of w.obstacles) if (o.jet && jetState(o, w.t) !== 'off') {
    for (const [cx, cy, r] of jetCircles(o)) if (Math.abs(cx - (h.x + 20)) < 40) blocked.push([cy - r - 12, cy + r + 12]);
  }
  // prévoit où seront les tirs ennemis et les guêpes dans la seconde qui vient
  for (const s of w.eshots) {
    let x = s.x, y = s.y, vy = s.vy;
    for (let k = 0; k < 20; k++) {
      x += s.vx * 0.05; vy += s.g * 0.05; y += vy * 0.05;
      if (x > h.x - 4 && x < h.x + 40) blocked.push([y - 12, y + 22]);
    }
  }
  for (const e of w.enemies) if (e.kind === 'dragonet' && e.stage >= 2 && e.x > h.x - 10) blocked.push([e.y - 6, e.y + 28]); // jet de feu
  for (const e of w.enemies) {
    if ((e.kind === 'wasp' && e.stage === 2) || (e.kind === 'scout' && e.stage === 1)) {
      for (let k = 0; k < 16; k++) { const x = e.x + e.vx * k * 0.05, y = e.y + e.vy * k * 0.05; if (x > h.x - 10 && x < h.x + 44) blocked.push([y - 10, y + 26]); }
    } else if (e.x > h.x && e.x - h.x < 70) blocked.push([e.y - 10, e.y + 26]);
  }
  let target = 90 + Math.sin(t * 0.7) * 40, best = 1e9;
  const b = w.boss;
  if (b && b.alive && !b.entering) {
    target = b.core()[1] - 3; // vise le cœur du boss
    if (b.kind === 'spider' && b.laser !== 'idle') blocked.push([b.laserY - 16, b.laserY + 16]);
    if (b.kind === 'skel' && b.charging) blocked.push([b.y + 14, b.y + 74]); // s'écarte de la charge
  }
  const lo = band === 'bas' ? w.floor - 54 : 26, hi = band === 'haut' ? w.top + 40 : w.floor - 14;
  if (band) target = (lo + hi) / 2;
  for (let y = lo; y <= hi; y += 2) {
    if (blocked.some(([a, b]) => y > a && y < b)) continue;
    const cost = Math.abs(y - cy) + Math.abs(y - target) * 0.2;
    if (cost < best) { best = cost; target = y; }
  }
  // coincé entre deux obstacles (slalom) : ne regarde que le plus proche
  if (best === 1e9 && look > 50) return robot(w, t, 50);
  const dy = Math.max(-1, Math.min(1, (target - cy) / 10));
  const frame = Math.round(t * 60);
  const jaw = !!(b && b.alive && !b.entering) && frame % 120 === 0;
  const fight = !!(b && b.alive && !b.entering);
  const wantX = fight ? (b!.kind === 'skel' ? 40 : h.weapon === 'rain' ? 120 : 90) : 40; // pendant l'araignée, il s'approche ; il garde ses distances avec le poisson
  return {
    dx: Math.max(-1, Math.min(1, (wantX - h.x) / 20)), dy, fire: true, special: jaw || frame % 400 === 0,
    swap: !fight && frame % 600 === 300, select: fight ? (h.ammo.verm > 0 ? 0 : -1) : -1,
  };
}

// mode infini (ENDLESS=1) : jusqu'où va le robot ? défi du jour (DAILY=1) : 7 jours de suite
if (process.env.ENDLESS) {
  for (let seed = 1; seed <= runs; seed++) {
    let zone = 1, w = new World(sfx, { setup: endlessZone(1), seed }), t = 0, total = 0;
    while (total < 3600) {
      w.update(STEP, robot(w, t)); t += STEP; total += STEP;
      if (w.state === 'over') break;
      if (w.state === 'cleared' && w.stateT > 3) { zone++; w = new World(sfx, { setup: endlessZone(zone), seed: seed * 31 + zone, carry: w.carry() }); t = 0; }
    }
    console.log(`infini partie ${seed} : zone ${zone} (${endlessZone(zone).level.name}), score ${w.score}, ${Math.round(total / 60)} min`);
  }
}
if (process.env.DAILY) {
  const d0 = new Date(2026, 9, 27);
  for (let k = 0; k < 7; k++) {
    const d = new Date(d0.getTime() + k * 86400000), date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const s = dailySetup(date);
    let ok = 0, time = 0;
    for (let r = 0; r < runs; r++) {
      const w = new World(sfx, { setup: s, seed: (s.seed ?? 0) + r }); let t = 0; // le robot joue un peu différemment à chaque essai
      while (t < 900 && w.state !== 'over' && !(w.state === 'cleared' && w.stateT > 3)) { w.update(STEP, robot(w, t + r)); t += STEP; }
      if (w.state === 'cleared') ok++; time += t;
    }
    console.log(`défi du ${date} : ${s.level.name} · ${s.rule.name} — réussi ${ok}/${runs}, ${Math.round(time / runs)} s`);
  }
}

// test anti-planque (CAMP=1) : le robot normal contre deux robots planqués en haut et en bas
if (process.env.CAMP) {
  const from = Number(process.env.FROM || 0), to = Number(process.env.TO || LEVELS.length);
  for (let lv = from; lv < to; lv++) {
    const res: string[] = [];
    let ref = 0;
    for (const b of [null, 'haut', 'bas'] as const) {
      band = b;
      let ok = 0, hits = 0, time = 0;
      for (let seed = 1; seed <= runs; seed++) {
        const w = new World(sfx, { level: lv, seed: seed * 977 + lv, mode });
        let t = 0;
        while (t < 900 && w.state !== 'over' && !(w.state === 'cleared' && w.stateT > 3)) { w.update(STEP, robot(w, t)); t += STEP; }
        if (w.state === 'cleared') ok++;
        hits += w.hits; time += t;
      }
      const rate = hits / (time / 60);
      if (!b) ref = rate;
      const flag = b && (rate < ref * 1.3 || ok > 0) ? ' ⚠' : '';
      res.push(`${b ?? 'normal'} ${ok}/${runs} · ${rate.toFixed(1)} coups/min${flag}`);
    }
    band = null;
    console.log(`niveau ${lv + 1} (${mode}) : ${res.join('   ')}`);
  }
}

for (let lv = Number(process.env.FROM || 0); lv < (process.env.ENDLESS || process.env.DAILY || process.env.CAMP ? 0 : Number(process.env.TO || LEVELS.length)); lv++) {
  let cleared = 0, time = 0; const causes: Record<string, number> = {};
  for (let seed = 1; seed <= runs; seed++) {
    const w = new World(sfx, { level: lv, seed: seed * 977 + lv, mode });
    let t = 0;
    while (t < 900 && w.state !== 'over' && !(w.state === 'cleared' && w.stateT > 3)) { w.update(STEP, robot(w, t)); t += STEP; }
    if (w.state === 'cleared') cleared++;
    for (const [k, n] of Object.entries(w.hitLog)) causes[k] = (causes[k] || 0) + n;
    time += t;
    if (process.env.VERBOSE) console.log(`  niveau ${lv + 1} partie ${seed}: ${w.state} en ${t.toFixed(0)} s, score ${w.score}` + (w.boss ? `, boss ${w.boss.kind === 'skel' && w.boss.armored ? 'avec armure' : 'phase finale'} ${Math.round(w.boss.hp)}/${w.boss.maxHp} après ${Math.round(w.boss.t)} s` : ''));
  }
  console.log(`niveau ${lv + 1} (${mode}) : terminé ${cleared}/${runs} fois, durée moyenne ${Math.round(time / runs)} s`);
  if (process.env.CAUSES) console.log('   coups reçus :', Object.entries(causes).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', '));
}

// Captures d'écran de chaque niveau, via l'application complète
if (shotsDir) {
  const idle: AppInput = { dx: 0, dy: 0, fire: false, special: false, swap: false, select: -1, confirm: false, pause: false, left: false, right: false, up: false, down: false, tapX: -1, tapY: -1 };
  const scr = new FC.Pix(W, H);
  for (let lv = Number(process.env.FROM || 0); lv < LEVELS.length; lv++) {
    const app = new App(sfx);
    app.setDev(true);
    for (let i = 0; i < 30; i++) app.update(STEP, idle);
    for (let i = 0; i < lv; i++) app.update(STEP, { ...idle, right: true });
    app.draw(scr); if (lv === 2) savePng(scr, 3, shotsDir + '/titre.png');
    app.update(STEP, { ...idle, confirm: true });
    let t = 0;
    for (const at of lv === 4 ? [60, 230, 290] : [40, 120]) {
      while (t < at) { app.update(STEP, { ...idle, ...robot(app.world!, t) }); t += STEP; }
      app.draw(scr); savePng(scr, 3, `${shotsDir}/niveau${lv + 1}-${at}s.png`);
    }
  }
  console.log('captures dans', shotsDir);
}
