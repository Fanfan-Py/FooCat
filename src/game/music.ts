// Musique « 8 bits » jouée par le navigateur (pas de fichiers audio).
// Chaque thème : une mélodie, une deuxième voix, une basse et une batterie.
// Notation : une note par double-croche ; « - » prolonge la note, « . » est un silence.
// Batterie : k = grosse caisse, s = caisse claire, h = charleston.

interface Theme { bpm: number; lead: string[]; lead2?: string[]; bass: string[]; drums: string }

const THEMES: Record<string, Theme> = {
  title: {
    bpm: 100,
    lead: ['E5 - G5 - C6 - - - B5 - G5 - E5 - - -', 'A5 - C6 - E6 - D6 - C6 - B5 - G5 - - -', 'F5 - A5 - C6 - - - B5 - A5 - G5 - - -', 'E5 - D5 - C5 - D5 - E5 - - - . . . .'],
    bass: ['C3 - - - G2 - - - C3 - - - G2 - - -', 'A2 - - - E2 - - - A2 - - - E2 - - -', 'F2 - - - C3 - - - F2 - - - C3 - - -', 'G2 - - - D3 - - - G2 - - - B2 - - -'],
    drums: 'k . . . h . . . s . . . h . . .',
  },
  space: {
    bpm: 124,
    lead: ['A4 C5 E5 A5 E5 C5 A4 C5 E5 A5 E5 C5 A4 C5 E5 C5', 'G4 B4 D5 G5 D5 B4 G4 B4 D5 G5 D5 B4 G4 B4 D5 B4', 'F4 A4 C5 F5 C5 A4 F4 A4 C5 F5 C5 A4 F4 A4 C5 A4', 'E4 G#4 B4 E5 B4 G#4 E4 G#4 B4 E5 B4 G#4 E5 D5 C5 B4'],
    lead2: ['A5 - - - - - - - C6 - - - B5 - - -', 'G5 - - - - - - - B5 - - - A5 - - -', 'F5 - - - - - - - A5 - - - G5 - - -', 'E5 - - - - - - - G#5 - - - B5 - - -'],
    bass: ['A2 - . A2 . . A2 . A2 - . A2 . . E2 .', 'G2 - . G2 . . G2 . G2 - . G2 . . D2 .', 'F2 - . F2 . . F2 . F2 - . F2 . . C3 .', 'E2 - . E2 . . E2 . E2 - . E2 . . G#2 .'],
    drums: 'k . h . s . h . k . h k s . h .',
  },
  nebula: {
    bpm: 132,
    lead: ['C5 . E5 G5 . E5 C6 . G5 . E5 . C5 . D5 E5', 'F5 . A5 C6 . A5 F5 . E5 . G5 . C6 - - .', 'D5 . F5 A5 . F5 D6 . A5 . F5 . D5 . E5 F5', 'G5 . B5 D6 . B5 G5 . F5 . D5 . B4 - - .'],
    bass: ['C3 . C4 . C3 . C4 . C3 . C4 . C3 . C4 .', 'F2 . F3 . F2 . F3 . A2 . A3 . A2 . A3 .', 'D3 . D4 . D3 . D4 . D3 . D4 . D3 . D4 .', 'G2 . G3 . G2 . G3 . G2 . G3 . B2 . D3 .'],
    drums: 'k . h k s . h . k . h k s . h h',
  },
  planet: {
    bpm: 118,
    lead: ['F5 - A5 - C6 - A5 - G5 - F5 - E5 - C5 -', 'D5 - F5 - A5 - G5 - F5 - - - . . . .', 'Bb4 - D5 - F5 - D5 - C5 - E5 - G5 - E5 -', 'F5 - E5 - D5 - E5 - F5 - - - . . C5 -'],
    lead2: ['A4 - - - - - - - C5 - - - - - - -', 'F4 - - - - - - - A4 - - - - - - -', 'D4 - - - - - - - E4 - - - - - - -', 'A4 - - - G4 - - - A4 - - - - - - -'],
    bass: ['F2 . . F3 . . F2 . C3 . . C3 . . C3 .', 'D3 . . D3 . . D3 . C3 . . C3 . . E3 .', 'Bb2 . . Bb2 . . Bb2 . C3 . . C3 . . C3 .', 'F2 . . F3 . . C3 . F2 . . . . . . .'],
    drums: 'k . h . s . h . k k h . s . h .',
  },
  iron: {
    bpm: 140,
    lead: ['D5 . D5 F5 . D5 A4 . C5 . C5 E5 . C5 G4 .', 'Bb4 . Bb4 D5 . Bb4 F4 . A4 . C#5 E5 . C#5 A4 .', 'D5 . F5 A5 . F5 D5 . C5 . E5 G5 . E5 C5 .', 'Bb4 . D5 F5 . D5 Bb4 . A4 - - - C#5 - E5 -'],
    bass: ['D2 D2 . D2 D3 . D2 . C2 C2 . C2 C3 . C2 .', 'Bb1 Bb1 . Bb1 Bb2 . Bb1 . A1 A1 . A1 A2 . A1 .'],
    drums: 'k . h k s . h . k . h k s . s s',
  },
  // victoire : écran de fin du jeu et défi réussi
  victory: {
    bpm: 112,
    lead: ['C5 - E5 - G5 - C6 - - - G5 - C6 - - -', 'A5 - F5 - A5 - C6 - - - A5 - F5 - - -', 'G5 - E5 - G5 - B5 - D6 - B5 - G5 - - -', 'C6 - G5 - E5 - G5 - C6 - - - . . . .'],
    lead2: ['E4 - - - - - - - G4 - - - - - - -', 'F4 - - - - - - - A4 - - - - - - -', 'D4 - - - - - - - G4 - - - - - - -', 'E4 - - - - - - - C4 - - - - - - -'],
    bass: ['C3 . G2 . C3 . G2 . C3 . G2 . C3 . E3 .', 'F2 . C3 . F2 . C3 . F2 . C3 . F2 . A2 .', 'G2 . D3 . G2 . D3 . G2 . D3 . G2 . B2 .', 'C3 . G2 . E2 . G2 . C3 . . . . . . .'],
    drums: 'k . h . s . h . k . h k s . h .',
  },
  // cap sur Vulcano (niveaux 11 et 12) : tendu et rapide, en mi mineur
  approach: {
    bpm: 128,
    lead: ['E5 . G5 . B5 . E6 - D6 . B5 . G5 . A5 .', 'C6 . B5 . G5 . E5 - G5 . A5 . B5 - - .', 'D6 . C6 . A5 . F#5 - A5 . D6 . F#6 - E6 .', 'D#6 - - - B5 - - - F#5 - A5 - B5 - - -'],
    lead2: ['E4 - - - - - - - G4 - - - - - - -', 'C4 - - - - - - - E4 - - - - - - -', 'D4 - - - - - - - F#4 - - - - - - -', 'B3 - - - - - - - D#4 - - - - - - -'],
    bass: ['E2 E2 . E3 E2 . E2 E3 E2 E2 . E3 E2 . B1 D2', 'C2 C2 . C3 C2 . C2 C3 C2 C2 . C3 C2 . G1 B1', 'D2 D2 . D3 D2 . D2 D3 D2 D2 . D3 D2 . A1 C#2', 'B1 B1 . B2 B1 . B1 B2 B1 B1 . B2 B1 . F#1 A1'],
    drums: 'k . h k s . h . k k h . s . h h',
  },
  // sur la planète Vulcano (niveau 13) : tambours et gamme orientale chaude
  vulcano: {
    bpm: 118,
    lead: ['A4 - Bb4 - C#5 - - - E5 - D5 - C#5 - Bb4 -', 'A4 - - - . . E5 - F5 - E5 - D5 - C#5 -', 'D5 - E5 - F5 - - - G5 - F5 - E5 - D5 -', 'C#5 - Bb4 - A4 - - - . . . . E4 - - -'],
    lead2: ['A3 - - - - - - - E4 - - - - - - -', 'A3 - - - - - - - E4 - - - - - - -', 'D4 - - - - - - - F4 - - - - - - -', 'C#4 - - - - - - - E4 - - - - - - -'],
    bass: ['A1 . A1 A2 . A1 . A2 A1 . A1 A2 . Bb1 . A1', 'A1 . A1 A2 . A1 . A2 A1 . A1 A2 . Bb1 . A1', 'D2 . D2 D3 . D2 . D3 D2 . D2 D3 . E2 . D2', 'A1 . A1 A2 . Bb1 . A2 C#2 . A1 . E2 . A1 .'],
    drums: 'k . k s . k h . k . k s . k h h',
  },
  // l'antre du volcan (niveaux 14 et 15) : sombre, des arpèges comme des gouttes
  cave: {
    bpm: 100,
    lead: ['D5 - - - F5 - - - E5 - - - C#5 - - -', 'D5 - - - A4 - - - Bb4 - - - A4 - - -', 'F5 - - - E5 - - - D5 - - - C5 - - -', 'Bb4 - - - A4 - - - C#5 - - - . . . .'],
    lead2: ['A3 . D4 . F4 . D4 . A3 . D4 . F4 . D4 .', 'G3 . Bb3 . D4 . Bb3 . G3 . Bb3 . D4 . Bb3 .', 'F3 . A3 . D4 . A3 . F3 . A3 . C4 . A3 .', 'A3 . C#4 . E4 . C#4 . A3 . C#4 . E4 . G4 .'],
    bass: ['D2 - - - - - - - D2 - - - C2 - - -', 'Bb1 - - - - - - - G1 - - - A1 - - -', 'D2 - - - - - - - F1 - - - - - - -', 'A1 - - - - - - - A1 - - - C#2 - - -'],
    drums: 'k . . . h . . . s . . . h . . h',
  },
  // le Scorpion volant de feu : très rapide et menaçant
  scorpboss: {
    bpm: 172,
    lead: ['D5 . Eb5 . F#5 . D5 . A5 . G5 . F#5 . Eb5 .', 'D5 . A4 . Bb4 . A4 . D5 . Eb5 . F#5 - - -', 'G5 . F#5 . Eb5 . D5 . C5 . Bb4 . A4 . Bb4 .', 'A4 . D5 . F#5 . A5 . D6 - - - C6 - Bb5 -'],
    lead2: ['D4 - - - - - - - Eb4 - - - - - - -', 'D4 - - - - - - - F#4 - - - - - - -', 'G4 - - - - - - - D4 - - - - - - -', 'A4 - - - - - - - F#4 - - - - - - -'],
    bass: ['D2 D2 D3 D2 Eb2 Eb2 Eb3 Eb2 D2 D2 D3 D2 C2 C2 C3 C2', 'D2 D2 D3 D2 Eb2 Eb2 Eb3 Eb2 F#2 F#2 F#3 F#2 Eb2 Eb2 Eb3 Eb2', 'G1 G1 G2 G1 F#1 F#1 F#2 F#1 Eb2 Eb2 Eb3 Eb2 D2 D2 D3 D2', 'A1 A1 A2 A1 A1 A1 A2 A1 D2 D2 D3 D2 A1 A1 A2 A1'],
    drums: 'k h s h k k s h k h s k k h s s',
  },
  // le vaisseau des boss (niveau 16) : marche mécanique, en do mineur
  ship: {
    bpm: 132,
    lead: ['C5 . C5 . Eb5 . G5 . F5 . Eb5 . D5 . Eb5 .', 'C5 . C5 . Eb5 . G5 . Ab5 - G5 - F5 - - -', 'Ab5 . G5 . F5 . Eb5 . D5 . Eb5 . F5 . G5 .', 'G5 - - - B4 - - - D5 - F5 - G5 - - -'],
    lead2: ['C4 . G4 . C4 . G4 . C4 . G4 . C4 . G4 .', 'Ab3 . Eb4 . Ab3 . Eb4 . F3 . C4 . F3 . C4 .', 'F3 . C4 . F3 . C4 . G3 . D4 . G3 . D4 .', 'G3 . B3 . D4 . B3 . G3 . B3 . D4 . F4 .'],
    bass: ['C2 . C2 . C3 . C2 . C2 . C2 . G1 . Bb1 .', 'Ab1 . Ab1 . Ab2 . Ab1 . F1 . F1 . F2 . F1 .', 'F1 . F1 . F2 . F1 . G1 . G1 . G2 . G1 .', 'G1 . G1 . G2 . G1 . G1 . B1 . D2 . G2 .'],
    drums: 'k . h . s . h . k . k . s . h s',
  },
  // océan (niveaux 7 et 8) : calme, en ré majeur, avec des arpèges qui font des bulles
  ocean: {
    bpm: 100,
    lead: ['F#5 - - A5 - - D6 - - A5 - - F#5 - E5 -', 'D5 - - F#5 - - B5 - - A5 - - F#5 - - -', 'G5 - - B5 - - D6 - - E6 - - D6 - B5 -', 'A5 - - - C#6 - - - E6 - - - . . . .'],
    lead2: ['D4 A4 D5 A4 D4 A4 D5 A4 D4 A4 D5 A4 D4 A4 D5 A4', 'B3 F#4 B4 F#4 B3 F#4 B4 F#4 B3 F#4 B4 F#4 B3 F#4 B4 F#4', 'G3 D4 G4 D4 G3 D4 G4 D4 G3 D4 G4 D4 G3 D4 G4 D4', 'A3 E4 A4 E4 A3 E4 A4 E4 A3 E4 A4 E4 A3 E4 A4 C#5'],
    bass: ['D2 - - - - - A2 - D3 - - - A2 - - -', 'B1 - - - - - F#2 - B2 - - - F#2 - - -', 'G1 - - - - - D2 - G2 - - - D2 - - -', 'A1 - - - - - E2 - A2 - - - C#3 - - -'],
    drums: 'k . . h . . s . . h . . k . h .',
  },
  // château marin (niveaux 9 et 10) : mystérieux, en ré mineur
  castle: {
    bpm: 112,
    lead: ['D5 - A4 - D5 - F5 - E5 - D5 - C#5 - D5 -', 'F5 - D5 - Bb4 - D5 - F5 - G5 - F5 - D5 -', 'G5 - Bb5 - A5 - G5 - F5 - E5 - D5 - Bb4 -', 'A4 - C#5 - E5 - G5 - F5 - E5 - C#5 - - -'],
    lead2: ['F4 - - - - - - - A4 - - - - - - -', 'D4 - - - - - - - F4 - - - - - - -', 'Bb3 - - - - - - - D4 - - - - - - -', 'C#4 - - - - - - - E4 - - - - - - -'],
    bass: ['D2 . D3 . A2 . D3 . D2 . D3 . A2 . D3 .', 'Bb1 . Bb2 . F2 . Bb2 . Bb1 . Bb2 . F2 . Bb2 .', 'G1 . G2 . D2 . G2 . G1 . G2 . D2 . G2 .', 'A1 . A2 . E2 . A2 . A1 . A2 . C#2 . E2 .'],
    drums: 'k . h . s . h . k . h . s . h h',
  },
  // le poisson squelette de la mort : rapide et menaçant
  skelboss: {
    bpm: 164,
    lead: ['E5 . F5 . E5 . B4 . C5 . B4 . F5 - E5 -', 'G5 . F5 . E5 . D5 . C5 . D5 . E5 - - -', 'E6 . D6 . C6 . B5 . Bb5 . A5 . G5 . F5 .', 'E5 . G5 . Bb5 . C#6 . E6 - - - D#6 - - -'],
    lead2: ['B4 - - - - - - - C5 - - - - - - -', 'B4 - - - - - - - G4 - - - - - - -', 'C5 - - - - - - - F4 - - - - - - -', 'Bb4 - - - - - - - B4 - - - - - - -'],
    bass: ['E2 E2 E3 E2 F2 F2 F3 F2 E2 E2 E3 E2 F2 F2 F3 F2', 'C2 C2 C3 C2 D2 D2 D3 D2 E2 E2 E3 E2 E2 E2 E3 E2', 'A1 A1 A2 A1 Bb1 Bb1 Bb2 Bb1 A1 A1 A2 A1 F1 F1 F2 F1', 'E2 E2 E3 E2 G2 G2 G3 G2 Bb1 Bb1 Bb2 Bb1 B1 B1 B2 B1'],
    drums: 'k . s k k . s . k k s . k . s s',
  },
  boss: {
    bpm: 156,
    lead: ['E5 . G5 . B5 . A5 G5 F#5 . E5 . D5 . F#5 .', 'E5 . G5 . B5 . C6 B5 A5 . G5 . F#5 . D#5 .', 'E6 . D6 . B5 . G5 . A5 . F#5 . D5 . B4 .', 'C5 . E5 . G5 . B5 . A5 - - - D#5 - - -'],
    bass: ['E2 E3 E2 E3 E2 E3 E2 E3 C2 C3 C2 C3 C2 C3 C2 C3', 'A1 A2 A1 A2 A1 A2 A1 A2 B1 B2 B1 B2 B1 B2 B1 B2'],
    drums: 'k h s h k k s h k h s h k k s s',
  },
};

type Step = number | null | '-'; // note (fréquence), silence, ou prolongation
const NOTE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
function freq(tok: string): number | null {
  const m = /^([A-G])([#b]?)(\d)$/.exec(tok);
  if (!m) return null;
  const midi = NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) + 1) * 12;
  return 440 * Math.pow(2, (midi - 69) / 12);
}
function parse(bars: string[]): Step[] {
  return bars.join(' ').trim().split(/\s+/).map((t) => (t === '-' ? '-' : t === '.' ? null : freq(t)));
}

interface Track { steps: Step[]; wave: OscillatorType; vol: number }

export class Music {
  private out: GainNode;
  private noise: AudioBuffer;
  private tracks: Track[] = [];
  private drums = '';
  private stepDur = 0.12;
  private step = 0;
  private next = 0;
  private name: string | null = null;
  private vol = 0.7; // volume choisi dans les réglages (0 à 1)
  private paused = false;

  constructor(private ctx: AudioContext, dest: AudioNode) {
    this.out = ctx.createGain(); this.out.gain.value = 0.55 * this.vol; this.out.connect(dest);
    this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = this.noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    setInterval(() => this.tick(), 25);
  }

  play(name: string | null) {
    if (name === this.name) return;
    this.name = name;
    const th = name ? THEMES[name] : null;
    this.tracks = []; this.drums = '';
    if (!th) return;
    this.stepDur = 60 / th.bpm / 4;
    this.tracks.push({ steps: parse(th.lead), wave: 'square', vol: 0.04 });
    if (th.lead2) this.tracks.push({ steps: parse(th.lead2), wave: 'triangle', vol: 0.05 });
    this.tracks.push({ steps: parse(th.bass), wave: 'triangle', vol: 0.13 });
    this.drums = th.drums.replace(/\s+/g, '');
    this.step = 0; this.next = this.ctx.currentTime + 0.06;
  }

  pause(paused: boolean) { this.paused = paused; this.out.gain.setTargetAtTime(paused ? 0 : 0.55 * this.vol, this.ctx.currentTime, 0.05); }
  setVolume(v: number) { this.vol = v; this.pause(this.paused); }

  private tick() {
    if (this.ctx.state !== 'running' || !this.tracks.length) return;
    if (this.next < this.ctx.currentTime) this.next = this.ctx.currentTime + 0.02; // rattrape après une pause de l'onglet
    while (this.next < this.ctx.currentTime + 0.12) {
      for (const tr of this.tracks) this.playStep(tr, this.step, this.next);
      const dr = this.drums[this.step % this.drums.length];
      if (dr && dr !== '.') this.drum(dr, this.next);
      this.next += this.stepDur; this.step++;
    }
  }

  private playStep(tr: Track, step: number, t: number) {
    const n = tr.steps.length, f = tr.steps[step % n];
    if (typeof f !== 'number') return;
    let len = 1;
    while (len < n && tr.steps[(step + len) % n] === '-') len++;
    const dur = len * this.stepDur * 0.95, o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = tr.wave; o.frequency.value = f;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(tr.vol, t + 0.006);
    g.gain.exponentialRampToValueAtTime(tr.vol * 0.45, t + Math.min(dur, 0.25));
    g.gain.linearRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(this.out); o.start(t); o.stop(t + dur + 0.02);
  }

  private drum(kind: string, t: number) {
    const ctx = this.ctx, g = ctx.createGain();
    g.connect(this.out);
    if (kind === 'k') {
      const o = ctx.createOscillator();
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
      g.gain.setValueAtTime(0.32, t); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
      o.connect(g); o.start(t); o.stop(t + 0.16);
      return;
    }
    const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), dur = kind === 's' ? 0.12 : 0.035;
    src.buffer = this.noise;
    f.type = kind === 's' ? 'bandpass' : 'highpass'; f.frequency.value = kind === 's' ? 1800 : 7000;
    g.gain.setValueAtTime(kind === 's' ? 0.13 : 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f).connect(g); src.start(t, Math.random() * 0.5); src.stop(t + dur + 0.01);
  }
}
