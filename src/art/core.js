/* FooCat – moteur pixel art des maquettes (coeur) */
(function (root) {
  'use strict';
  var FC = root.FooCat = root.FooCat || {};

  // ---------- Couleurs ----------
  function col(h, a) {
    h = h.replace('#', '');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), a == null ? 255 : a];
  }
  var P = {
    K: col('1b1030'), k: col('3a2457'), W: col('ffffff'), w: col('f6effa'), v: col('cdbde0'),
    p: col('ff9cc8'), P: col('ff4f9a'), q: col('ffc9e2'), i: col('d63384'),
    y: col('ffe680'), Y: col('f7b52a'), j: col('c47d12'),
    o: col('ff9a3c'), r: col('ff4d5e'), g: col('6be38f'), G: col('2e9e5b'),
    b: col('6fd0ff'), B: col('3a7bff'), u: col('a77bff'), U: col('6a3fd1'),
    d: col('f2b46e'), D: col('c9803f'), e: col('8a4d22'),
    m: col('b8c0d4'), M: col('6b7590'), n: col('353c52'), N: col('20253a'),
    R: col('ff2a4d'), s: col('e8ecf5'), a: col('7fffd4'), l: col('7b4a2a'), L: col('4a2614'),
    x: col('241a33'), X: col('463a5e'), c: col('aeefff', 80), C: col('9fe6ff', 210), h: col('ffffff', 210)
  };
  FC.col = col; FC.P = P;
  FC.RAINBOW = [P.r, P.o, P.y, P.g, P.b, P.u];
  FC.SPRINKLES = [P.r, P.y, P.g, P.b, P.W, P.u, P.o];

  function mix(c1, c2, t) {
    return [Math.round(c1[0] + (c2[0] - c1[0]) * t), Math.round(c1[1] + (c2[1] - c1[1]) * t), Math.round(c1[2] + (c2[2] - c1[2]) * t), c1[3]];
  }
  function alpha(c, a) { return [c[0], c[1], c[2], a]; }
  FC.mix = mix; FC.alpha = alpha;

  // ---------- Hasard reproductible ----------
  FC.rng = function (a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };

  // ---------- Image en pixels ----------
  function Pix(w, h) { this.w = w; this.h = h; this.d = new Uint8ClampedArray(w * h * 4); }
  Pix.prototype.put = function (x, y, c) {
    x = Math.floor(x); y = Math.floor(y);
    if (!c || x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    var d = this.d, i = (y * this.w + x) * 4, a = c[3];
    if (a >= 255) { d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; d[i + 3] = 255; return; }
    if (a <= 0) return;
    var fa = a / 255, ba = d[i + 3] / 255, oa = fa + ba * (1 - fa);
    d[i] = (c[0] * fa + d[i] * ba * (1 - fa)) / oa;
    d[i + 1] = (c[1] * fa + d[i + 1] * ba * (1 - fa)) / oa;
    d[i + 2] = (c[2] * fa + d[i + 2] * ba * (1 - fa)) / oa;
    d[i + 3] = oa * 255;
  };
  Pix.prototype.on = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return false;
    return this.d[(y * this.w + x) * 4 + 3] > 0;
  };
  Pix.prototype.get = function (x, y) {
    var i = (y * this.w + x) * 4, d = this.d;
    return [d[i], d[i + 1], d[i + 2], d[i + 3]];
  };
  Pix.prototype.rect = function (x, y, w, h, c) {
    for (var j = 0; j < h; j++) for (var i = 0; i < w; i++) this.put(x + i, y + j, c);
  };
  Pix.prototype.fill = function (c) { this.rect(0, 0, this.w, this.h, c); };
  // remplit une ellipse ; c peut être une fonction (x, y, dx, dy) -> couleur
  Pix.prototype.ell = function (cx, cy, rx, ry, c, test) {
    for (var y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++) {
      for (var x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        var dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy > 1) continue;
        if (test && !test(x, y, dx, dy)) continue;
        this.put(x, y, typeof c === 'function' ? c(x, y, dx, dy) : c);
      }
    }
  };
  Pix.prototype.tri = function (ax, ay, bx, by, cx, cy, c) {
    var minx = Math.floor(Math.min(ax, bx, cx)), maxx = Math.ceil(Math.max(ax, bx, cx));
    var miny = Math.floor(Math.min(ay, by, cy)), maxy = Math.ceil(Math.max(ay, by, cy));
    function s(px, py, x1, y1, x2, y2) { return (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2); }
    for (var y = miny; y <= maxy; y++) for (var x = minx; x <= maxx; x++) {
      var px = x + 0.5, py = y + 0.5;
      var d1 = s(px, py, ax, ay, bx, by), d2 = s(px, py, bx, by, cx, cy), d3 = s(px, py, cx, cy, ax, ay);
      var neg = d1 < 0 || d2 < 0 || d3 < 0, pos = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(neg && pos)) this.put(x, y, typeof c === 'function' ? c(x, y) : c);
    }
  };
  Pix.prototype.line = function (x0, y0, x1, y1, c) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    var dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1, dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1, err = dx + dy;
    for (var n = 0; n < 2000; n++) {
      this.put(x0, y0, c);
      if (x0 === x1 && y0 === y1) break;
      var e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  // dessin à partir de lignes de caractères (palette P, '.' = transparent)
  Pix.prototype.rows = function (rows, x0, y0, map) {
    for (var y = 0; y < rows.length; y++) for (var x = 0; x < rows[y].length; x++) {
      var ch = rows[y][x];
      if (ch === '.' || ch === ' ') continue;
      this.put(x0 + x, y0 + y, (map && map[ch]) || P[ch]);
    }
  };
  // contour automatique autour des pixels opaques
  Pix.prototype.outline = function (c, diag) {
    var w = this.w, h = this.h, add = [];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) {
      if (this.on(x, y)) continue;
      if (this.on(x - 1, y) || this.on(x + 1, y) || this.on(x, y - 1) || this.on(x, y + 1) ||
        (diag && (this.on(x - 1, y - 1) || this.on(x + 1, y - 1) || this.on(x - 1, y + 1) || this.on(x + 1, y + 1)))) add.push(x, y);
    }
    for (var k = 0; k < add.length; k += 2) this.put(add[k], add[k + 1], c);
    return this;
  };
  // colle une autre image (transparence gérée), option miroir horizontal
  Pix.prototype.blit = function (src, x0, y0, flip, op) {
    x0 = Math.round(x0); y0 = Math.round(y0);
    var sw = src.w, sh = src.h, sd = src.d, d = this.d, W = this.w, H = this.h;
    var opa = op == null ? 1 : op;
    for (var y = 0; y < sh; y++) {
      var ty = y0 + y; if (ty < 0 || ty >= H) continue;
      for (var x = 0; x < sw; x++) {
        var tx = x0 + x; if (tx < 0 || tx >= W) continue;
        var si = (y * sw + (flip ? sw - 1 - x : x)) * 4, a = sd[si + 3];
        if (!a) continue;
        var ti = (ty * W + tx) * 4;
        if (a === 255 && opa === 1) { d[ti] = sd[si]; d[ti + 1] = sd[si + 1]; d[ti + 2] = sd[si + 2]; d[ti + 3] = 255; }
        else this.put(tx, ty, [sd[si], sd[si + 1], sd[si + 2], a * opa]);
      }
    }
  };
  // agrandit d'un facteur entier
  Pix.prototype.scale = function (k) {
    var o = new Pix(this.w * k, this.h * k);
    for (var y = 0; y < o.h; y++) for (var x = 0; x < o.w; x++) {
      var si = (Math.floor(y / k) * this.w + Math.floor(x / k)) * 4, ti = (y * o.w + x) * 4;
      o.d[ti] = this.d[si]; o.d[ti + 1] = this.d[si + 1]; o.d[ti + 2] = this.d[si + 2]; o.d[ti + 3] = this.d[si + 3];
    }
    return o;
  };
  // teinte vers une couleur (pour les plans lointains)
  Pix.prototype.tint = function (c, t) {
    var d = this.d;
    for (var i = 0; i < d.length; i += 4) {
      if (!d[i + 3]) continue;
      d[i] += (c[0] - d[i]) * t; d[i + 1] += (c[1] - d[i + 1]) * t; d[i + 2] += (c[2] - d[i + 2]) * t;
    }
    return this;
  };
  // dégradé vertical en bandes tramées (style 16 bits)
  Pix.prototype.vgrad = function (stops) {
    for (var y = 0; y < this.h; y++) {
      var t = y / (this.h - 1), k = 0;
      while (k < stops.length - 2 && t > stops[k + 1][0]) k++;
      var a = stops[k], b = stops[k + 1], u = (t - a[0]) / (b[0] - a[0]);
      var band = Math.floor(u * 6) / 6, frac = u * 6 - Math.floor(u * 6);
      for (var x = 0; x < this.w; x++) {
        var dith = frac > 0.5 && ((x + y) & 1) ? 1 / 6 : 0;
        this.put(x, y, mix(a[1], b[1], Math.min(1, band + dith)));
      }
    }
    return this;
  };
  FC.Pix = Pix;

  // ---------- Police 3x5 ----------
  var G = {
    A: ['.#.', '#.#', '###', '#.#', '#.#'], B: ['##.', '#.#', '##.', '#.#', '##.'], C: ['.##', '#..', '#..', '#..', '.##'],
    D: ['##.', '#.#', '#.#', '#.#', '##.'], E: ['###', '#..', '##.', '#..', '###'], F: ['###', '#..', '##.', '#..', '#..'],
    G: ['.##', '#..', '#.#', '#.#', '.##'], H: ['#.#', '#.#', '###', '#.#', '#.#'], I: ['###', '.#.', '.#.', '.#.', '###'],
    J: ['..#', '..#', '..#', '#.#', '.#.'], K: ['#.#', '#.#', '##.', '#.#', '#.#'], L: ['#..', '#..', '#..', '#..', '###'],
    M: ['#...#', '##.##', '#.#.#', '#...#', '#...#'], N: ['#..#', '##.#', '#.##', '#..#', '#..#'], O: ['.#.', '#.#', '#.#', '#.#', '.#.'],
    P: ['##.', '#.#', '##.', '#..', '#..'], Q: ['.#.', '#.#', '#.#', '##.', '.##'], R: ['##.', '#.#', '##.', '#.#', '#.#'],
    S: ['.##', '#..', '.#.', '..#', '##.'], T: ['###', '.#.', '.#.', '.#.', '.#.'], U: ['#.#', '#.#', '#.#', '#.#', '###'],
    V: ['#.#', '#.#', '#.#', '#.#', '.#.'], W: ['#...#', '#...#', '#.#.#', '##.##', '#...#'], X: ['#.#', '#.#', '.#.', '#.#', '#.#'],
    Y: ['#.#', '#.#', '.#.', '.#.', '.#.'], Z: ['###', '..#', '.#.', '#..', '###'],
    0: ['###', '#.#', '#.#', '#.#', '###'], 1: ['.#.', '##.', '.#.', '.#.', '###'], 2: ['##.', '..#', '.#.', '#..', '###'],
    3: ['##.', '..#', '.#.', '..#', '##.'], 4: ['#.#', '#.#', '###', '..#', '..#'], 5: ['###', '#..', '##.', '..#', '##.'],
    6: ['.##', '#..', '###', '#.#', '###'], 7: ['###', '..#', '.#.', '.#.', '.#.'], 8: ['###', '#.#', '###', '#.#', '###'],
    9: ['###', '#.#', '###', '..#', '##.'],
    ':': ['.', '#', '.', '#', '.'], '.': ['.', '.', '.', '.', '#'], '!': ['#', '#', '#', '.', '#'], '-': ['..', '..', '##', '..', '..'],
    '+': ['...', '.#.', '###', '.#.', '...'], 'x': ['...', '#.#', '.#.', '#.#', '...'], '/': ['..#', '..#', '.#.', '#..', '#..'],
    "'": ['#', '#', '.', '.', '.'], '?': ['##.', '..#', '.#.', '...', '.#.'], '~': ['.....', '.#.#.', '#.#.#', '.#.#.', '.....'],
    '>': ['#..', '.#.', '..#', '.#.', '#..'], '<': ['..#', '.#.', '#..', '.#.', '..#'], ',': ['..', '..', '..', '.#', '#.'], '(': ['.#', '#.', '#.', '#.', '.#'], ')': ['#.', '.#', '.#', '.#', '#.'], ' ': ['..', '..', '..', '..', '..'], '·': ['.', '.', '#', '.', '.']
  };
  var ACC = { 'É': ['E', 1], 'È': ['E', 0], 'Ê': ['E', 1], 'Ë': ['E', 1], 'À': ['A', 0], 'Â': ['A', 1], 'Ç': ['C', -1], 'Ô': ['O', 1], 'Û': ['U', 1], 'Ù': ['U', 0], 'Ü': ['U', 1], 'Î': ['I', 1], 'Ï': ['I', 1] };
  function glyph(ch) { return G[ch] || G[' ']; }
  FC.textWidth = function (s, sc) {
    sc = sc || 1; s = String(s).toUpperCase(); var w = 0;
    for (var i = 0; i < s.length; i++) { var ch = ACC[s[i]] ? ACC[s[i]][0] : s[i]; w += (glyph(ch)[0].length + 1) * sc; }
    return w - sc;
  };
  // texte : opts {sc, shadow, outline}
  FC.text = function (pix, s, x, y, c, o) {
    o = o || {}; var sc = o.sc || 1; s = String(s).toUpperCase();
    if (o.outline) {
      for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) if (ox || oy) FC.text(pix, s, x + ox * sc, y + oy * sc, o.outline, { sc: sc });
    }
    if (o.shadow) FC.text(pix, s, x + sc, y + sc, o.shadow, { sc: sc });
    var cx = x;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i], acc = ACC[ch]; if (acc) ch = acc[0];
      var g = glyph(ch), gw = g[0].length;
      for (var gy = 0; gy < 5; gy++) for (var gx = 0; gx < gw; gx++) if (g[gy][gx] === '#') pix.rect(cx + gx * sc, y + gy * sc, sc, sc, typeof c === 'function' ? c(gx, gy, i) : c);
      if (acc) { if (acc[1] < 0) pix.rect(cx + sc, y + 5 * sc, sc, sc, c); else pix.rect(cx + (acc[1] + 1) * sc, y - 2 * sc, sc, sc, c); }
      cx += (gw + 1) * sc;
    }
    return cx;
  };

  // ---------- Registre des sprites et des scènes ----------
  FC.S = FC.S || {};        // usines de sprites : nom -> function(frame) -> Pix
  FC.scenes = FC.scenes || {}; // nom -> function() -> {w, h, draw(screen, t)}
  var cache = {};
  FC.spr = function (name, frame) {
    var key = name + '|' + (frame || 0);
    if (!cache[key]) cache[key] = FC.S[name](frame || 0);
    return cache[key];
  };

  // ---------- Lecture dans un <canvas> ----------
  function reduced() {
    try { return root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  function loop(canvas, w, h, draw) {
    canvas.width = w; canvas.height = h;
    var ctx = canvas.getContext('2d'), scr = new Pix(w, h), img = ctx.createImageData(w, h);
    var alive = true, t0 = 0, last = -1, still = reduced(), raf = 0;
    function frame(now) {
      if (!alive) return;
      if (!canvas.isConnected) { alive = false; return; }
      if (!t0) t0 = now;
      if (now - last >= 30 || still) {
        last = now;
        draw(scr, still ? 3.2 : (now - t0) / 1000);
        img.data.set(scr.d); ctx.putImageData(img, 0, 0);
      }
      if (!still) raf = root.requestAnimationFrame(frame);
    }
    raf = root.requestAnimationFrame(frame);
    return function () { alive = false; root.cancelAnimationFrame(raf); };
  }
  FC.run = function (canvas, sceneName) {
    var sc = FC.scenes[sceneName]();
    return loop(canvas, sc.w, sc.h, sc.draw);
  };
  // affiche un sprite centré, agrandi d'un facteur entier, animé sur ses images
  FC.card = function (canvas, name, frames, bg) {
    var W = +canvas.getAttribute('width') || 96, H = +canvas.getAttribute('height') || 72;
    return loop(canvas, W, H, function (scr, t) {
      var f = frames ? Math.floor(t * 6) % frames : 0, s = FC.spr(name, f);
      var k = Math.max(1, Math.min(4, Math.floor(Math.min((W - 6) / s.w, (H - 6) / s.h))));
      if (bg) scr.d.set(bg(W, H).d); else scr.d.fill(0);
      var big = k > 1 ? s.scale(k) : s;
      scr.blit(big, Math.floor((W - big.w) / 2), Math.floor((H - big.h) / 2) + (frames ? Math.round(Math.sin(t * 3)) : 0));
    });
  };
  // attend que tous les fichiers du moteur soient chargés, puis lance
  FC.when = function (fn) {
    var n = 0;
    (function tryIt() {
      if (root.FooCat && root.FooCat.ready) fn(root.FooCat);
      else if (n++ < 200) setTimeout(tryIt, 50);
    })();
  };
})(typeof window !== 'undefined' ? window : globalThis);
