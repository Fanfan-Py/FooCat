// Moteur pixel art (le même que celui des maquettes)
import './core.js';
import './sprites.js';
import './cats.js';
import './decor.js';
import './scenes.js';
import './extra.js';
import './aqua.js';
import './story.js';
import './vulcano.js';

export type Pix = { w: number; h: number; d: Uint8ClampedArray; [k: string]: any };
export type Color = number[];
export const FC: any = (globalThis as any).FooCat;
