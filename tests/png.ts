// Écrit une image Pix en PNG (pour regarder une capture pendant les tests)
import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';
import type { Pix } from '../src/art';

const T: number[] = [];
for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = T[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type: string, data: Buffer) {
  const l = Buffer.alloc(4); l.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td));
  return Buffer.concat([l, td, c]);
}
export function savePng(pix: Pix, k: number, file: string) {
  const w = pix.w * k, h = pix.h * k, raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const si = (Math.floor(y / k) * pix.w + Math.floor(x / k)) * 4, ti = y * (w * 4 + 1) + 1 + x * 4;
    raw[ti] = pix.d[si]; raw[ti + 1] = pix.d[si + 1]; raw[ti + 2] = pix.d[si + 2]; raw[ti + 3] = 255;
  }
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 6;
  writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ih), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
