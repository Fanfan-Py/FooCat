// Démarrage : écran, boucle de jeu, commandes tactiles.
import './style.css';
import { FC } from './art';
import { W, H } from './game/config';
import { App } from './game/app';
import { Input } from './game/input';
import { SoundFx } from './game/audio';

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>('screen');
const ctx = canvas.getContext('2d')!;
const img = ctx.createImageData(W, H);
const scr = new FC.Pix(W, H);

const sfx = new SoundFx();
const input = new Input();
const app = new App(sfx);
input.onMute = () => toggleMute();
// sur l'ordinateur de développement (npm run dev), le choix du niveau est toujours proposé
if (import.meta.env.DEV) app.setDev(true);
// #dev à la fin de l'adresse : active le mode développeur (et s'en souvient) ; #nodev le coupe
if (location.hash === '#dev') app.setDev(true, true);
if (location.hash === '#nodev') app.setDev(false, true);

// ---------- mise à l'échelle : le jeu 320x180 remplit l'écran sans être déformé ----------
const touchUI = $('touch'), stick = $('stick'), knob = $('knob'), rotate = $('rotate');
const btn = {
  fire: $('b-fire'), swap: $('b-swap'), special: $('b-special'), pause: $('b-pause'), sound: $('b-sound'),
};
let hint = { x: 70, y: 0 };

function place(el: HTMLElement, x: number, y: number, size: number) {
  el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.width = el.style.height = size + 'px';
}

// marges de sécurité du téléphone (encoche, barre du bas)
function insets() {
  const cs = getComputedStyle($('safe'));
  const n = (v: string) => parseFloat(v) || 0;
  return { l: n(cs.paddingLeft), r: n(cs.paddingRight), t: n(cs.paddingTop), b: n(cs.paddingBottom) };
}

// Taille de l'écran. Sur certains iPhone, elle n'est pas encore à jour au lancement ou juste
// après une rotation, et le téléphone ne prévient pas toujours : on la surveille à chaque image.
const stageEl = $('stage');
function screenSize() {
  return { w: window.innerWidth || stageEl.clientWidth, h: window.innerHeight || stageEl.clientHeight };
}
let laidOut = { w: 0, h: 0 };

function layout() {
  const { w: vw, h: vh } = screenSize(), ins = insets();
  laidOut = { w: vw, h: vh };
  const aw = vw - ins.l - ins.r, ah = vh - ins.t - ins.b; // zone utilisable
  let s = Math.min(aw / W, ah / H);
  // sur un écran tactile sans place autour du jeu (iPhone SE…), on réduit un peu le jeu
  // pour garder deux bandes libres sur les côtés : les boutons ne cachent jamais rien
  if (app.touch && (aw - W * s) / 2 < 64 && ah - H * s < 128) s = Math.min((aw - 128) / W, ah / H);
  const cw = Math.round(W * s), ch = Math.round(H * s);
  const left = Math.round(ins.l + (aw - cw) / 2), top = Math.round(ins.t + (ah - ch) / 2);
  Object.assign(canvas.style, { width: cw + 'px', height: ch + 'px', left: left + 'px', top: top + 'px' });

  // Les boutons vont dans les bandes libres autour du jeu, pour ne rien cacher.
  const side = left - ins.l, band = ins.t + ah - top - ch;
  const right = vw - ins.r, bottom = vh - ins.b;
  touchUI.classList.toggle('overlay', side < 64 && band < 64);
  if (side >= 64) {
    const cx = right - side / 2, fire = Math.min(80, side - 8), small = Math.min(54, side - 10);
    place(btn.fire, cx, bottom - 16 - fire / 2, fire);
    place(btn.swap, cx, bottom - 16 - fire - 14 - small / 2, small);
    place(btn.special, cx, bottom - 16 - fire - 28 - small * 1.5, small);
    place(btn.pause, cx, ins.t + 30, 42); place(btn.sound, cx, ins.t + 80, 42);
    hint = { x: ins.l + side / 2, y: bottom - 72 };
  } else if (band >= 64) {
    const cy = bottom - band / 2, fire = Math.min(80, band - 8), small = Math.min(54, band - 10);
    place(btn.fire, right - 20 - fire / 2, cy, fire);
    place(btn.swap, right - 20 - fire - 14 - small / 2, cy, small);
    place(btn.special, right - 20 - fire - 28 - small * 1.5, cy, small);
    place(btn.pause, right - 30, ins.t + (top - ins.t) / 2, 42); place(btn.sound, right - 80, ins.t + (top - ins.t) / 2, 42);
    hint = { x: ins.l + 76, y: Math.min(cy, bottom - 60) };
  } else {
    place(btn.fire, right - 56, bottom - 56, 76);
    place(btn.swap, right - 136, bottom - 36, 50);
    place(btn.special, right - 36, bottom - 136, 50);
    place(btn.pause, right - 26, top + ch * 0.1 + 26, 38); place(btn.sound, right - 70, top + ch * 0.1 + 26, 38);
    hint = { x: ins.l + 70, y: bottom - 70 };
  }
  if (!stickId) { stick.style.left = hint.x + 'px'; stick.style.top = hint.y + 'px'; }
  rotate.hidden = !(app.touch && vh > vw);
}
window.addEventListener('resize', layout);
window.addEventListener('pageshow', layout);
window.visualViewport?.addEventListener('resize', layout);
// après une rotation, l'iPhone met parfois un moment à donner la nouvelle taille
window.addEventListener('orientationchange', () => { for (const ms of [50, 250, 600, 1200]) setTimeout(layout, ms); });

// ---------- commandes tactiles ----------
let stickId: number | null = null, stickX = 0, stickY = 0, fireId: number | null = null;
const R = 40; // course du joystick en pixels

function enableTouch() {
  if (app.touch) return;
  app.touch = true; touchUI.hidden = false; layout();
}
// ?touch dans l'adresse : affiche les commandes tactiles même sur ordinateur (pour tester)
if ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || new URLSearchParams(location.search).has('touch')) enableTouch();

$('stage').addEventListener('pointerdown', (e) => {
  sfx.unlock();
  if (e.pointerType === 'touch') enableTouch();
  if ((e.target as HTMLElement).closest('.tbtn')) return;
  if (app.state !== 'play') { tapAt(e.clientX, e.clientY); return; }
  if (e.pointerType !== 'touch') return;
  const vw = window.innerWidth;
  if (e.clientX < vw * 0.45 && stickId === null) {
    // le joystick apparaît sous le pouce
    stickId = e.pointerId;
    stickX = Math.max(58, Math.min(e.clientX, vw * 0.45));
    stickY = Math.max(58, Math.min(e.clientY, window.innerHeight - 58));
    stick.style.left = stickX + 'px'; stick.style.top = stickY + 'px';
    stick.classList.add('active');
  } else if (fireId === null) {
    // toucher n'importe où à droite fait aussi tirer
    fireId = e.pointerId; input.touch.fire = true; btn.fire.classList.add('down');
  }
});
window.addEventListener('pointermove', (e) => {
  if (e.pointerId !== stickId) return;
  let dx = e.clientX - stickX, dy = e.clientY - stickY;
  const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  const nx = dx / R, ny = dy / R;
  input.touch.dx = Math.abs(nx) < 0.15 ? 0 : nx; input.touch.dy = Math.abs(ny) < 0.15 ? 0 : ny;
});
function release(e: PointerEvent) {
  if (e.pointerId === stickId) {
    stickId = null; input.touch.dx = input.touch.dy = 0;
    knob.style.transform = ''; stick.classList.remove('active');
    stick.style.left = hint.x + 'px'; stick.style.top = hint.y + 'px';
  }
  if (e.pointerId === fireId) { fireId = null; input.touch.fire = false; btn.fire.classList.remove('down'); }
}
window.addEventListener('pointerup', release);
window.addEventListener('pointercancel', release);

btn.fire.addEventListener('pointerdown', (e) => {
  sfx.unlock(); enableTouch();
  if (app.state !== 'play') { input.touch.tapX = W / 2; input.touch.tapY = 90; return; }
  fireId = e.pointerId; input.touch.fire = true; btn.fire.classList.add('down');
});
btn.swap.addEventListener('pointerdown', () => { input.touch.swap = true; });
btn.special.addEventListener('pointerdown', () => { input.touch.special = true; });
btn.pause.addEventListener('pointerdown', () => { input.touch.pause = true; });
btn.sound.addEventListener('pointerdown', () => toggleMute());
// les clics « souris » sur les boutons ne doivent pas déclencher d'autre action
for (const b of Object.values(btn)) b.addEventListener('click', (e) => e.preventDefault());

// un toucher (ou clic) dans les menus, converti en pixels du jeu
function tapAt(cx: number, cy: number) {
  const r = canvas.getBoundingClientRect();
  input.touch.tapX = Math.max(0, Math.min(W - 1, (cx - r.left) / r.width * W));
  input.touch.tapY = Math.max(0, Math.min(H - 1, (cy - r.top) / r.height * H));
}

function toggleMute() {
  sfx.muted = !sfx.muted;
  btn.sound.classList.toggle('muted', sfx.muted);
  btn.sound.setAttribute('aria-label', sfx.muted ? 'Remettre le son' : 'Couper le son');
}
// débloque le son à chaque geste : selon les téléphones, c'est le doigt posé ou le doigt levé qui compte
for (const ev of ['keydown', 'pointerdown', 'pointerup', 'touchend', 'click']) window.addEventListener(ev, () => sfx.unlock(), { capture: true, passive: true });
document.addEventListener('visibilitychange', () => { if (document.hidden) app.pause(); });
window.addEventListener('blur', () => app.pause());

// ---------- saisie du pseudonyme (nouveau record) ----------
const nameForm = $<HTMLFormElement>('name-form'), nameInput = $<HTMLInputElement>('nf-input');
const nameErr = $('nf-error'), nameScore = $('nf-score');
let nameOpen = false;
function syncNameForm() {
  const req = app.nameRequest;
  if (req && !nameOpen) {
    nameOpen = true; nameForm.hidden = false;
    nameScore.textContent = 'Score : ' + req.score.toLocaleString('fr-FR');
    nameErr.textContent = ''; nameInput.value = app.lastName;
    setTimeout(() => { nameInput.focus(); nameInput.select(); }, 60);
  } else if (!req && nameOpen) {
    nameOpen = false; nameForm.hidden = true; nameInput.blur();
  }
}
nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const err = app.submitName(nameInput.value);
  nameErr.textContent = err ? err.charAt(0) + err.slice(1).toLowerCase() + '.' : '';
});
$('nf-skip').addEventListener('click', () => app.skipName());

// ---------- boucle : logique à 60 images/s, affichage à chaque rafraîchissement ----------
const STEP = 1 / 60;
let last = performance.now(), acc = 0;
function frame(now: number) {
  acc += Math.min(0.25, (now - last) / 1000); last = now;
  let n = 0;
  while (acc >= STEP && n < 5) { app.update(STEP, input.poll()); acc -= STEP; n++; }
  if (n === 5) acc = 0;
  syncNameForm();
  const sz = screenSize();
  if (sz.w !== laidOut.w || sz.h !== laidOut.h) layout(); // la taille a changé sans prévenir
  app.draw(scr);
  img.data.set(scr.d);
  ctx.putImageData(img, 0, 0);
  requestAnimationFrame(frame);
}
layout();
for (const ms of [100, 500, 1500]) setTimeout(layout, ms); // au cas où la taille arrive en retard
requestAnimationFrame(frame);

// Version en ligne : le jeu s'installe sur le téléphone et marche sans connexion
if (import.meta.env.PROD && 'serviceWorker' in navigator && document.querySelector('link[rel="manifest"]') && location.protocol === 'https:') {
  window.addEventListener('load', () => { navigator.serviceWorker.register('./sw.js').catch(() => { /* pas grave */ }); });
}
