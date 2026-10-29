// Vérifie qu'on ne publie rien de privé dans ce dépôt public.
//   node scripts/check-privacy.mjs           : fichiers prêts à être commités (lancé avant chaque commit)
//   node scripts/check-privacy.mjs --all     : tous les fichiers du dépôt (npm run privacy)
// On cherche : clés et jetons d'accès, mots de passe, chemins personnels (/Users/…, /home/…),
// fichiers sensibles (.env, clés), et les mots privés listés dans .git/private-patterns
// (un mot ou une expression par ligne ; ce fichier reste sur l'ordinateur, il n'est jamais publié).
// Avant un commit, on vérifie aussi que l'auteur est l'identité anonyme du dépôt.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';

const git = (...args) => execFileSync('git', args, { encoding: 'buffer', maxBuffer: 64 * 1024 * 1024 });
const all = process.argv.includes('--all');
const SELF = 'scripts/check-privacy.mjs';
const ALLOWED_EMAIL = 'foocat@noreply.invalid';

const RULES = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----/, 'clé privée'],
  [/\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{30,}/, 'jeton GitHub'],
  [/\bgithub_pat_[A-Za-z0-9_]{30,}/, 'jeton GitHub'],
  [/\bsk-(ant-)?[A-Za-z0-9_-]{20,}/, "clé d'API"],
  [/\bAKIA[0-9A-Z]{16}\b/, "clé d'accès AWS"],
  [/\bxox[abpr]-[A-Za-z0-9-]{10,}/, 'jeton Slack'],
  [/\bAIza[0-9A-Za-z_-]{35}\b/, "clé d'API Google"],
  [/(password|passwd|mot de passe|api[_-]?key|secret[_-]?key)\s*[:=]\s*['"][^'"\s]{6,}['"]/i, 'mot de passe ou clé écrit en clair'],
  [/(\/Users\/|\/home\/)[A-Za-z0-9._-]+\//, "chemin personnel de l'ordinateur"],
  [/[A-Z]:\\Users\\[A-Za-z0-9._-]+\\/, "chemin personnel de l'ordinateur"],
];
const BAD_FILES = [/(^|\/)\.env(\.|$)/, /\.(pem|key|p12|pfx)$/, /(^|\/)id_(rsa|ed25519|ecdsa)/];

// les mots privés (nom, e-mail…), en minuscules et sans accents
const norm = (s) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const privFile = '.git/private-patterns';
const PRIVATE = existsSync(privFile)
  ? readFileSync(privFile, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map(norm)
  : [];

const files = all
  ? git('ls-files', '-z').toString().split('\0').filter(Boolean)
  : git('diff', '--cached', '--name-only', '--diff-filter=ACMR', '-z').toString().split('\0').filter(Boolean);

const problems = [];
for (const f of files) {
  if (BAD_FILES.some((r) => r.test(f))) problems.push(`${f} : fichier sensible (à ne pas publier)`);
  if (f === SELF || f === 'package-lock.json') continue;
  let buf;
  try { buf = all ? readFileSync(f) : git('show', ':' + f); } catch { continue; }
  const text = buf.toString('latin1'), low = norm(buf.toString('utf8'));
  for (const [re, what] of RULES) { const m = text.match(re); if (m) problems.push(`${f} : ${what} (« ${m[0].slice(0, 40)} »)`); }
  for (const p of PRIVATE) if (low.includes(p)) problems.push(`${f} : contient un mot privé de .git/private-patterns`);
}

if (!all) { // l'auteur du commit doit être l'identité anonyme du dépôt
  const ident = execFileSync('git', ['var', 'GIT_AUTHOR_IDENT'], { encoding: 'utf8' });
  if (!ident.includes('<' + ALLOWED_EMAIL + '>')) problems.push(`auteur du commit : il doit être « FooCat <${ALLOWED_EMAIL}> » (git config user.email ${ALLOWED_EMAIL})`);
}

if (problems.length) {
  console.error('\n⛔ Vérification de confidentialité : ' + problems.length + ' problème(s)\n');
  for (const p of problems) console.error('  - ' + p);
  console.error("\nRien n'a été commité. Corrige ces fichiers, ou retire-les du commit.\n");
  process.exit(1);
}
console.log(`✅ Vérification de confidentialité : rien à signaler (${files.length} fichier${files.length > 1 ? 's' : ''}).`);
