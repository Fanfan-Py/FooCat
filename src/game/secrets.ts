// Récompenses secrètes, débloquées uniquement avec un code.
// Le dépôt est public : les codes ne sont jamais écrits ici, on ne garde que leur « empreinte » (SHA-256),
// qu'on ne peut pas retourner pour retrouver le code. Un code débloque une seule récompense ;
// plusieurs codes peuvent débloquer la même. Les codes ne s'usent pas.

export type SecretId = 'toad' | 'ghost' | 'disco' | 'buddy' | 'invasion' | 'casse';
export interface Secret { id: SecretId; name: string; kind: string }
export const SECRETS: Secret[] = [
  { id: 'toad', name: 'LE ROI CRAPAUD', kind: 'NOUVEAU PERSONNAGE' },
  { id: 'ghost', name: 'LE FANTÔME', kind: 'NOUVEAU PERSONNAGE' },
  { id: 'disco', name: 'LA SOUCOUPE DISCO', kind: 'NOUVELLE SOUCOUPE' },
  { id: 'buddy', name: 'LE PETIT COMPAGNON', kind: 'NOUVEAU COMPAGNON' },
  { id: 'invasion', name: "L'INVASION DES BONBONS", kind: 'NOUVEAU NIVEAU SECRET' },
  { id: 'casse', name: 'LE CASSE-BONBONS', kind: 'NOUVEAU NIVEAU SECRET' },
];

// empreinte du code (en majuscules, sans espaces ni tirets) -> récompense
const CODES: Record<string, SecretId> = {
  '4a7391de6847946c25c0857694534c81936ea3672ad74e59392073bfb6a03814': 'toad',
  '90940592e9b41ad084304d97123445a88b61cc2d9ce31f587834d6b86c8884a1': 'ghost',
  '059205a935d2612e0083f35f3e27b231003f5c062535f672f66e9098d86f05bc': 'disco',
  'd4dcadcf802a5642473e2b995d1ff8437a5d2f31b955cef544188c58c2b6cb1a': 'buddy',
  '59377b8ef793935e4ef46ebc2e59bf2de58d4d39e96ca78d7ce762cc56cba7be': 'invasion',
  '8b30c7fe5aaa3a66a8a618b42bb96cbd07866c5ed1a71f5af4d843197b2a652e': 'casse',
};

// empreinte du code qui active ou coupe le mode développeur
const DEV_CODE = 'a464b61d79d34325f2e23f28d8c3e2b78a09f334c670d72bfc719077dedc0f44';
export function isDevCode(raw: string) { return !!normCode(raw) && codeHash(raw) === DEV_CODE; }

// « ab cd-éf » -> « ABCDEF »
export function normCode(raw: string): string {
  return raw.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
export function codeHash(raw: string): string { return sha256('foocat-secret:' + normCode(raw)); }
export function secretForCode(raw: string): SecretId | null { return normCode(raw) ? CODES[codeHash(raw)] ?? null : null; }

export function loadSecrets(): Set<SecretId> {
  try {
    const v = JSON.parse(localStorage.getItem('foocat.secrets') || '[]');
    return new Set((Array.isArray(v) ? v : []).filter((id: string) => SECRETS.some((s) => s.id === id)));
  } catch { return new Set(); }
}
export function saveSecrets(s: Set<SecretId>) { try { localStorage.setItem('foocat.secrets', JSON.stringify([...s])); } catch { /* stockage indisponible */ } }

// SHA-256 (petite version, sans dépendance, qui marche aussi hors https)
const K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5, 0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3,
  0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174, 0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967, 0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13,
  0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85, 0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3, 0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208,
  0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
]);
export function sha256(text: string): string {
  const bytes = new TextEncoder().encode(text), len = bytes.length;
  const n = Math.ceil((len + 9) / 64) * 64, m = new Uint8Array(n);
  m.set(bytes); m[len] = 0x80;
  const bits = len * 8;
  m[n - 4] = bits >>> 24; m[n - 3] = bits >>> 16; m[n - 2] = bits >>> 8; m[n - 1] = bits;
  const H = new Uint32Array([0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19]);
  const w = new Uint32Array(64), rotr = (x: number, k: number) => (x >>> k) | (x << (32 - k));
  for (let o = 0; o < n; o += 64) {
    for (let i = 0; i < 16; i++) w[i] = (m[o + i * 4] << 24) | (m[o + i * 4 + 1] << 16) | (m[o + i * 4 + 2] << 8) | m[o + i * 4 + 3];
    for (let i = 16; i < 64; i++) {
      const a = w[i - 15], b = w[i - 2];
      w[i] = w[i - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + w[i - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10));
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let i = 0; i < 64; i++) {
      const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) >>> 0;
      const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) >>> 0;
      h = g; g = f; f = e; e = (d + t1) >>> 0; d = c; c = b; b = a; a = (t1 + t2) >>> 0;
    }
    H[0] += a; H[1] += b; H[2] += c; H[3] += d; H[4] += e; H[5] += f; H[6] += g; H[7] += h;
  }
  return Array.from(H, (x) => x.toString(16).padStart(8, '0')).join('');
}
