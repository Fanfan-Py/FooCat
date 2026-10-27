// Regroupe le jeu construit (dist/) en un seul fichier HTML : dist-single/foocat.html
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

let html = readFileSync('dist/index.html', 'utf8');
// la version « un seul fichier » n'a ni fiche d'application ni icônes à côté
html = html.replace(/<link rel="(manifest|icon|apple-touch-icon)"[^>]*>\n?/g, '');
html = html.replace(/<link rel="stylesheet"[^>]*href="\.\/([^"]+)"[^>]*>/g, (_, f) => `<style>${readFileSync(join('dist', f), 'utf8')}</style>`);
html = html.replace(/<script type="module"[^>]*src="\.\/([^"]+)"[^>]*><\/script>/g, (_, f) =>
  `<script type="module">${readFileSync(join('dist', f), 'utf8').replace(/<\/script/gi, '<\\/script')}</script>`);
mkdirSync('dist-single', { recursive: true });
writeFileSync('dist-single/foocat.html', html);
console.log('dist-single/foocat.html', Math.round(html.length / 1024), 'Ko');

// Version pour un Artifact claude.ai : sans <html>/<head>/<body> (ajoutés à la publication)
const head = html.slice(html.indexOf('<head>') + 6, html.indexOf('</head>'));
const styles = (head.match(/<style>[\s\S]*?<\/style>/g) || []).join('\n');
const scripts = (head.match(/<script type="module">[\s\S]*?<\/script>/g) || []).join('\n');
const body = html.slice(html.indexOf('<body>') + 6, html.indexOf('</body>'));
writeFileSync('dist-single/foocat-artifact.html', `<title>FooCat</title>\n${styles}\n${body}\n${scripts}\n`);
console.log('dist-single/foocat-artifact.html');
