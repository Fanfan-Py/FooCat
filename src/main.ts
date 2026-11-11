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

// ---------- mise à l'échelle : le jeu 320x180 remplit l'écran sans être déformé ----------
const touchUI = $('touch'), stick = $('stick'), knob = $('knob'), rotate = $('rotate');
const btn = {
  fire: $('b-fire'), swap: $('b-swap'), special: $('b-special'), pause: $('b-pause'), sound: $('b-sound'),
  left: $('b-left'), right: $('b-right'),
};
let hint = { x: 70, y: 0 };

// commandes gaucher : tout est inversé de gauche à droite
let mirror = false, layoutVersion = -1;
const mx = (x: number) => (mirror ? window.innerWidth - x : x);
function place(el: HTMLElement, x: number, y: number, size: number) {
  x = mx(x);
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
  mirror = app.settings.leftHanded; layoutVersion = app.settingsVersion;
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
  // les flèches des niveaux secrets : en bas, une de chaque côté (jamais inversées)
  const arrow = side >= 64 ? Math.min(84, side - 8) : band >= 64 ? Math.min(80, band - 8) : 72;
  const ay = side >= 64 ? bottom - 16 - arrow / 2 : band >= 64 ? bottom - band / 2 : bottom - 12 - arrow / 2;
  const ax = side >= 64 ? side / 2 : 16 + arrow / 2;
  for (const [el, x] of [[btn.left, ins.l + ax], [btn.right, right - ax]] as [HTMLElement, number][]) {
    el.style.left = x + 'px'; el.style.top = ay + 'px'; el.style.width = el.style.height = arrow + 'px';
  }
  hint.x = mx(hint.x);
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
  app.firstTouchHelp(); // la première fois : l'aide sur les commandes
}
// ?touch dans l'adresse : affiche les commandes tactiles même sur ordinateur (pour tester)
if ((window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || new URLSearchParams(location.search).has('touch')) enableTouch();

// niveaux secrets sur téléphone : le doigt guide la soucoupe comme sur un pavé tactile (elle suit le mouvement du doigt,
// où qu'on le pose, même sur les bandes des côtés) ; une petite tape lance
const FINGER_GAIN = 1.2; // la soucoupe bouge un peu plus que le doigt
let fingerId: number | null = null, fingerT = 0, fingerX0 = 0, fingerY0 = 0, fingerLast = 0;
function dragTo(cx: number) { const r = canvas.getBoundingClientRect(); input.touch.dragX += (cx - fingerLast) / r.width * W * FINGER_GAIN; fingerLast = cx; }

$('stage').addEventListener('pointerdown', (e) => {
  sfx.unlock();
  if (e.pointerType === 'touch') enableTouch();
  if ((e.target as HTMLElement).closest('.tbtn')) return;
  if (!app.playing) { tapAt(e.clientX, e.clientY); return; }
  if (app.fingerMode && app.settings.arrows) { input.touch.tapFire = true; return; } // avec les flèches : toucher le jeu = une tape
  if (app.fingerMode && e.pointerType === 'touch') {
    if (fingerId === null) { fingerId = e.pointerId; fingerT = performance.now(); fingerX0 = fingerLast = e.clientX; fingerY0 = e.clientY; }
    else input.touch.tapFire = true; // un deuxième doigt : une tape
    return;
  }
  if (e.pointerType !== 'touch') return;
  const vw = window.innerWidth, onStickSide = mirror ? e.clientX > vw * 0.55 : e.clientX < vw * 0.45;
  if (onStickSide && stickId === null) {
    // le joystick apparaît sous le pouce (à gauche, ou à droite pour les gauchers)
    stickId = e.pointerId;
    stickX = mirror ? Math.min(vw - 58, Math.max(e.clientX, vw * 0.55)) : Math.max(58, Math.min(e.clientX, vw * 0.45));
    stickY = Math.max(58, Math.min(e.clientY, window.innerHeight - 58));
    stick.style.left = stickX + 'px'; stick.style.top = stickY + 'px';
    stick.classList.add('active');
  } else if (fireId === null) {
    // toucher n'importe où à droite fait aussi tirer
    fireId = e.pointerId; input.touch.fire = true; btn.fire.classList.add('down');
  }
});
window.addEventListener('pointermove', (e) => {
  if (e.pointerId === fingerId) { dragTo(e.clientX); return; }
  if (e.pointerId !== stickId) return;
  let dx = e.clientX - stickX, dy = e.clientY - stickY;
  const d = Math.hypot(dx, dy); if (d > R) { dx = dx / d * R; dy = dy / d * R; }
  knob.style.transform = `translate(${dx}px, ${dy}px)`;
  const nx = dx / R, ny = dy / R;
  input.touch.dx = Math.abs(nx) < 0.15 ? 0 : nx; input.touch.dy = Math.abs(ny) < 0.15 ? 0 : ny;
});
function release(e: PointerEvent) {
  if (e.pointerId === fingerId) { // une petite tape (doigt levé vite, presque sans bouger) : lancer, renvoyer
    if (performance.now() - fingerT < 280 && Math.hypot(e.clientX - fingerX0, e.clientY - fingerY0) < 14) input.touch.tapFire = true;
    fingerId = null;
  }
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
  if (!app.playing) { input.touch.tapX = W / 2; input.touch.tapY = 90; return; }
  fireId = e.pointerId; input.touch.fire = true; btn.fire.classList.add('down');
});
// les flèches : on garde le doigt appuyé pour avancer
const arrowIds = new Map<number, { d: number; el: HTMLElement }>(); // doigt -> flèche appuyée
for (const [el, d] of [[btn.left, -1], [btn.right, 1]] as [HTMLElement, number][]) {
  el.addEventListener('pointerdown', (e) => { sfx.unlock(); arrowIds.set(e.pointerId, { d, el }); input.touch.arrow = d; el.classList.add('down'); });
}
function arrowUp(e: PointerEvent) {
  const a = arrowIds.get(e.pointerId);
  if (!a) return;
  arrowIds.delete(e.pointerId);
  if (![...arrowIds.values()].some((x) => x.el === a.el)) a.el.classList.remove('down');
  input.touch.arrow = arrowIds.size ? [...arrowIds.values()].pop()!.d : 0; // (si l'autre flèche est encore appuyée)
}
window.addEventListener('pointerup', arrowUp); window.addEventListener('pointercancel', arrowUp);
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

// ---------- saisie du pseudonyme (nouveau record) ou d'un code secret (même formulaire) ----------
const nameForm = $<HTMLFormElement>('name-form'), nameInput = $<HTMLInputElement>('nf-input');
const nameErr = $('nf-error'), nameScore = $('nf-score'), nameTitle = $('nf-title'), nameLabel = $('nf-label'), nameSkip = $('nf-skip');
let formKind: 'name' | 'code' | null = null;
const lower = (s: string) => s.charAt(0) + s.slice(1).toLowerCase();
function syncNameForm() {
  const req = app.nameRequest, want = req ? 'name' : app.codeRequest ? 'code' : null;
  if (want === formKind) return;
  formKind = want;
  if (!want) { nameForm.hidden = true; nameInput.blur(); return; }
  nameForm.hidden = false; nameErr.textContent = ''; nameErr.classList.remove('ok');
  if (want === 'name') {
    nameTitle.textContent = 'Nouveau record !'; nameLabel.textContent = 'Ton pseudonyme (12 lettres au maximum)';
    nameScore.hidden = false; nameScore.textContent = 'Score : ' + req!.score.toLocaleString('fr-FR');
    nameInput.maxLength = 12; nameInput.placeholder = 'Pseudonyme'; nameInput.setAttribute('autocomplete', 'nickname');
    nameInput.value = app.lastName; nameSkip.textContent = 'Passer';
  } else {
    nameTitle.textContent = 'Code secret'; nameLabel.textContent = 'Entre un code pour débloquer une récompense';
    nameScore.hidden = true;
    nameInput.maxLength = 24; nameInput.placeholder = 'Code'; nameInput.setAttribute('autocomplete', 'off');
    nameInput.value = ''; nameSkip.textContent = 'Retour';
  }
  setTimeout(() => { nameInput.focus(); nameInput.select(); }, 60);
}
nameForm.addEventListener('submit', (e) => {
  e.preventDefault();
  if (formKind === 'code') {
    const r = app.submitCode(nameInput.value);
    nameErr.textContent = lower(r.text); nameErr.classList.toggle('ok', r.ok);
    if (r.ok) nameInput.value = '';
    return;
  }
  const err = app.submitName(nameInput.value);
  nameErr.textContent = err ? lower(err) + '.' : '';
});
nameSkip.addEventListener('click', () => { if (formKind === 'code') app.closeCode(); else app.skipName(); });
nameInput.addEventListener('keydown', (e) => { if (e.key === 'Escape' && formKind === 'code') { e.preventDefault(); app.closeCode(); } });

// ---------- boucle : logique à 60 images/s, affichage à chaque rafraîchissement ----------
const STEP = 1 / 60;
let last = performance.now(), acc = 0;
function frame(now: number) {
  acc += Math.min(0.25, (now - last) / 1000); last = now;
  let n = 0;
  while (acc >= STEP && n < 5) { app.update(STEP, input.poll()); acc -= STEP; n++; }
  if (n === 5) acc = 0;
  syncNameForm();
  // au doigt : le joystick et les boutons de tir disparaissent (il reste la pause et le son)
  const finger = app.fingerMode, arrows = finger && app.settings.arrows;
  if (touchUI.classList.contains('finger') !== finger) { touchUI.classList.toggle('finger', finger); if (!finger) fingerId = null; }
  if (touchUI.classList.contains('arrows') !== arrows) { touchUI.classList.toggle('arrows', arrows); if (!arrows) { arrowIds.clear(); input.touch.arrow = 0; btn.left.classList.remove('down'); btn.right.classList.remove('down'); } }
  const sz = screenSize();
  if (sz.w !== laidOut.w || sz.h !== laidOut.h || layoutVersion !== app.settingsVersion) layout(); // taille ou réglages changés
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
