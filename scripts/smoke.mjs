// Lance tests/smoke.ts (compilé à la volée avec esbuild)
import { build } from 'esbuild';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

const out = join(mkdtempSync(join(tmpdir(), 'foocat-')), 'smoke.mjs');
await build({ entryPoints: ['tests/smoke.ts'], bundle: true, platform: 'node', format: 'esm', outfile: out, logLevel: 'error' });
await import(pathToFileURL(out).href);
