// Commandes : clavier, manette et écran tactile réunis en un seul état.
import type { AppInput } from './app';

const MOVE: Record<string, [number, number]> = {
  ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
  KeyA: [-1, 0], KeyD: [1, 0], KeyW: [0, -1], KeyS: [0, 1], // = Q D Z S sur un clavier AZERTY
};
const FIRE = ['Space', 'KeyJ'];
const SWAP = ['KeyX', 'KeyK'];
const SPECIAL = ['KeyC', 'KeyL'];
const PAUSE = ['Escape', 'KeyP'];
const CONFIRM = ['Enter', 'NumpadEnter', 'Space'];
const SELECT = ['Digit1', 'Digit2', 'Digit3'];

export class Input {
  private keys = new Set<string>();
  private pressed = new Set<string>();
  private prevPad: boolean[] = [];
  private prevAxis = 0;
  private prevAxisY = 0;
  // état tactile (rempli par les commandes à l'écran)
  touch = { dx: 0, dy: 0, fire: false, swap: false, special: false, pause: false, tapX: -1, tapY: -1 };
  onMute: () => void = () => { };

  constructor() {
    window.addEventListener('keydown', (e) => {
      if (MOVE[e.code] || FIRE.includes(e.code)) e.preventDefault();
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (e.code === 'KeyM' && !e.repeat) this.onMute();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    window.addEventListener('blur', () => this.keys.clear());
  }

  private any(codes: string[], set: Set<string>) { return codes.some((c) => set.has(c)); }

  poll(): AppInput {
    let dx = 0, dy = 0;
    for (const code of this.keys) { const m = MOVE[code]; if (m) { dx += m[0]; dy += m[1]; } }
    dx = Math.max(-1, Math.min(1, dx)); dy = Math.max(-1, Math.min(1, dy));
    let fire = this.any(FIRE, this.keys), swap = this.any(SWAP, this.pressed), special = this.any(SPECIAL, this.pressed);
    let pause = this.any(PAUSE, this.pressed), confirm = this.any(CONFIRM, this.pressed);
    let select = SELECT.findIndex((c) => this.pressed.has(c));
    let left = this.any(['ArrowLeft', 'KeyA'], this.pressed), right = this.any(['ArrowRight', 'KeyD'], this.pressed);
    let up = this.any(['ArrowUp', 'KeyW'], this.pressed), down = this.any(['ArrowDown', 'KeyS'], this.pressed);

    // manette (disposition standard)
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    for (const pad of pads) {
      if (!pad) continue;
      const b = (i: number) => !!pad.buttons[i] && pad.buttons[i].pressed;
      const edge = (i: number) => b(i) && !this.prevPad[i];
      const ax = pad.axes[0] || 0, ay = pad.axes[1] || 0;
      if (Math.abs(ax) > 0.25) dx = ax;
      if (Math.abs(ay) > 0.25) dy = ay;
      if (b(14)) dx = -1; if (b(15)) dx = 1; if (b(12)) dy = -1; if (b(13)) dy = 1;
      fire = fire || b(0) || b(7);
      special = special || edge(1) || edge(6);
      swap = swap || edge(3) || edge(5) || edge(2);
      pause = pause || edge(9);
      left = left || edge(14) || (ax < -0.6 && this.prevAxis >= -0.6);
      right = right || edge(15) || (ax > 0.6 && this.prevAxis <= 0.6);
      up = up || edge(12) || (ay < -0.6 && this.prevAxisY >= -0.6);
      down = down || edge(13) || (ay > 0.6 && this.prevAxisY <= 0.6);
      this.prevAxis = ax; this.prevAxisY = ay;
      confirm = confirm || edge(0) || edge(9);
      this.prevPad = pad.buttons.map((x) => x.pressed);
      break;
    }

    // écran tactile
    const t = this.touch;
    if (t.dx || t.dy) { dx = t.dx; dy = t.dy; }
    fire = fire || t.fire;
    swap = swap || t.swap; special = special || t.special; pause = pause || t.pause;
    const tapX = t.tapX, tapY = t.tapY;
    t.swap = t.special = t.pause = false; t.tapX = t.tapY = -1;

    this.pressed.clear();
    return { dx, dy, fire, swap, special, pause, confirm, select, left, right, up, down, tapX, tapY };
  }
}
