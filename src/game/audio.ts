// Petits bruitages synthétisés (pas de fichiers son pour l'instant).
import type { Sfx } from './world';
import { Music } from './music';

type Tone = [type: OscillatorType, from: number, to: number, dur: number, vol: number, delay?: number];
const SOUNDS: Record<string, { tones?: Tone[]; noise?: [dur: number, vol: number, freq: number] }> = {
  shoot_verm: { tones: [['square', 1400, 900, 0.03, 0.025]] },
  shoot_drag: { tones: [['sine', 420, 140, 0.14, 0.16]] },
  shoot_pinata: { tones: [['sine', 320, 160, 0.14, 0.13], ['triangle', 640, 420, 0.08, 0.05]] },
  pop: { tones: [['square', 500, 1300, 0.08, 0.06]], noise: [0.14, 0.12, 3500] },
  hop: { tones: [['square', 220, 660, 0.12, 0.05]] },
  pew: { tones: [['square', 1200, 500, 0.06, 0.04]] },
  charge: { tones: [['sawtooth', 200, 900, 0.9, 0.05]] },
  laser: { tones: [['sawtooth', 120, 90, 0.85, 0.1]], noise: [0.85, 0.08, 1500] },
  dive: { tones: [['sawtooth', 900, 300, 0.25, 0.05]] },
  throw: { tones: [['triangle', 300, 600, 0.12, 0.05]] },
  tear: { noise: [0.2, 0.12, 4000] },
  bounce: { tones: [['sine', 900, 1300, 0.05, 0.06]] },
  wave: { tones: [['square', 784, 784, 0.06, 0.05], ['square', 1046, 1046, 0.1, 0.05, 0.06]] },
  alarm: { tones: [['square', 440, 440, 0.12, 0.06], ['square', 330, 330, 0.12, 0.06, 0.15], ['square', 440, 440, 0.12, 0.06, 0.3], ['square', 330, 330, 0.12, 0.06, 0.45]] },
  shoot_rain: { tones: [['triangle', 700, 1400, 0.12, 0.07], ['triangle', 1050, 2100, 0.1, 0.05, 0.05]] },
  jaw: { tones: [['square', 180, 60, 0.18, 0.12]] },
  hit: { noise: [0.04, 0.08, 3000] },
  kill: { tones: [['square', 700, 120, 0.12, 0.06]], noise: [0.12, 0.08, 1800] },
  break: { tones: [['sawtooth', 220, 40, 0.3, 0.08]], noise: [0.35, 0.18, 900] },
  web: { tones: [['sine', 300, 500, 0.08, 0.05]] },
  hurt: { tones: [['sawtooth', 440, 110, 0.22, 0.12]] },
  lose: { tones: [['square', 660, 80, 0.6, 0.12]], noise: [0.5, 0.15, 700] },
  respawn: { tones: [['triangle', 400, 800, 0.12, 0.08], ['triangle', 600, 1200, 0.12, 0.08, 0.1]] },
  pickup: { tones: [['square', 660, 660, 0.06, 0.06], ['square', 990, 990, 0.08, 0.06, 0.06]] },
  bomb: { tones: [['sine', 200, 1200, 0.4, 0.12]], noise: [0.5, 0.2, 2500] },
  swap: { tones: [['triangle', 500, 700, 0.05, 0.06]] },
  pause: { tones: [['triangle', 500, 500, 0.05, 0.05]] },
  start: { tones: [['square', 523, 523, 0.08, 0.05], ['square', 659, 659, 0.08, 0.05, 0.08], ['square', 784, 784, 0.14, 0.05, 0.16]] },
  level: { tones: [['square', 523, 523, 0.1, 0.06], ['square', 659, 659, 0.1, 0.06, 0.1], ['square', 784, 784, 0.1, 0.06, 0.2], ['square', 1046, 1046, 0.3, 0.06, 0.3]] },
};

// 0,1 seconde de silence : la jouer réveille le son sur les anciens iPhone
const SILENT_WAV = 'data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==';

export class SoundFx implements Sfx {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private mus: Music | null = null;
  private wanted: string | null = null; // thème demandé avant que le son soit autorisé
  private mute = false;
  private silent: HTMLAudioElement | null = null;
  private last: Record<string, number> = {};

  get muted() { return this.mute; }
  set muted(m: boolean) { this.mute = m; if (this.master) this.master.gain.value = m ? 0 : 1; }

  // musique : un thème par décor (null = silence)
  music(theme: string | null) { this.wanted = theme; this.mus?.play(theme); this.mus?.pause(false); }
  pauseMusic(paused: boolean) { this.mus?.pause(paused); }

  // les navigateurs n'autorisent le son qu'après un geste du joueur :
  // on appelle unlock() à chaque toucher, clic ou touche du clavier
  unlock() {
    // iPhone : jouer le son comme une vidéo, même quand le bouton « silencieux » est activé
    const session = (navigator as any).audioSession;
    try { if (session && session.type !== 'playback') session.type = 'playback'; } catch { /* non disponible */ }
    if (!session && !this.silent) {
      try { this.silent = new Audio(SILENT_WAV); this.silent.play().catch(() => { this.silent = null; }); } catch { /* non disponible */ }
    }
    if (!this.ctx) {
      const AC = window.AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.mute ? 0 : 1;
      this.master.connect(this.ctx.destination);
      this.mus = new Music(this.ctx, this.master);
      this.mus.play(this.wanted);
    }
    const ctx = this.ctx;
    if (ctx.state !== 'running') { // « suspended », ou « interrupted » après un appel sur iPhone
      ctx.resume().catch(() => { /* on réessaiera au prochain geste */ });
      // un son vide joué pendant le geste finit de débloquer certains téléphones
      const b = ctx.createBufferSource(); b.buffer = ctx.createBuffer(1, 1, 22050); b.connect(ctx.destination); b.start(0);
    }
  }

  play(name: string) {
    const ctx = this.ctx, s = SOUNDS[name];
    if (!ctx || this.mute || !s || ctx.state !== 'running') return;
    const out = this.master!;
    const now = ctx.currentTime;
    if (now - (this.last[name] || 0) < 0.035) return; // évite la saturation
    this.last[name] = now;
    for (const [type, from, to, dur, vol, delay = 0] of s.tones || []) {
      const o = ctx.createOscillator(), g = ctx.createGain(), t0 = now + delay;
      o.type = type; o.frequency.setValueAtTime(from, t0); o.frequency.exponentialRampToValueAtTime(Math.max(20, to), t0 + dur);
      g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
      o.connect(g).connect(out); o.start(t0); o.stop(t0 + dur + 0.02);
    }
    if (s.noise) {
      const [dur, vol, freq] = s.noise;
      const buf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = buf; f.type = 'lowpass'; f.frequency.value = freq;
      g.gain.setValueAtTime(vol, now); g.gain.exponentialRampToValueAtTime(0.0001, now + dur);
      src.connect(f).connect(g).connect(out); src.start(now);
    }
  }
}
