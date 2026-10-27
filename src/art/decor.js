/* FooCat – décors : planètes-pâtisseries, arbres, toiles, forteresse */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, col = FC.col, mix = FC.mix, alpha = FC.alpha, RB = FC.RAINBOW;
  var memo = {};
  FC.mk = function (key, fn) { return memo[key] || (memo[key] = fn()); };

  // ombrage d'une sphère (lumière en haut à gauche), en bandes tramées
  function shade(base, dx, dy, x, y) {
    var l = -dx * 0.55 - dy * 0.75, dark = mix(base, P.K, 0.45), light = mix(base, P.W, 0.35);
    if (l > 0.55) return light;
    if (l > 0.42 && (x + y) % 2) return light;
    if (l < -0.55) return dark;
    if (l < -0.4 && (x + y) % 2) return dark;
    return base;
  }
  FC.shade = shade;
  function sprinkles(p, seed, n, test, colors) {
    var R = FC.rng(seed);
    for (var k = 0; k < n; k++) {
      var x = Math.floor(R() * p.w), y = Math.floor(R() * p.h), c = (colors || FC.SPRINKLES)[k % (colors || FC.SPRINKLES).length];
      if (!test(x, y) || !test(x + 1, y)) continue;
      p.put(x, y, c); if (k % 3 === 0) p.put(x + 1, y, c); else if (k % 3 === 1) p.put(x, y + 1, c);
    }
  }

  // planète donut (vue inclinée, trou au centre)
  FC.donutPlanet = function (r, frost, seed) {
    return FC.mk('don' + r + frost + seed, function () {
      var w = r * 2 + 4, h = Math.round(r * 1.3) + 4, p = new Pix(w, h), cx = w / 2, cy = h / 2, ry = r * 0.62;
      var fc = P[frost] || col(frost);
      var hole = function (x, y) { var a = (x + 0.5 - cx) / (r * 0.36), b = (y + 0.5 - cy + r * 0.06) / (r * 0.17); return a * a + b * b <= 1; };
      p.ell(cx, cy, r, ry, function (x, y, dx, dy) {
        if (hole(x, y)) return null;
        var drip = ((x * 7) % 5 === 0 ? 0.22 : 0) + ((x * 3) % 7 === 0 ? 0.12 : 0);
        if (dy < 0.15 + drip) return shade(fc, dx * 0.6, dy, x, y);
        return shade(P.D, dx * 0.8, dy, x, y);
      });
      // bord intérieur du trou
      p.ell(cx, cy - r * 0.06, r * 0.36 + 1, r * 0.17 + 1, mix(fc, P.K, 0.5), function (x, y) { return !hole(x, y); });
      sprinkles(p, seed, Math.round(r * 2.2), function (x, y) {
        if (!p.on(x, y) || hole(x, y)) return false;
        var c = p.get(x, y); return Math.abs(c[0] - fc[0]) + Math.abs(c[1] - fc[1]) < 120 && y < cy + r * 0.05;
      });
      return p.outline(P.K);
    });
  };

  // planète « cake pop » : boule + glaçage qui coule
  FC.cakePlanet = function (r, base, frost, seed) {
    return FC.mk('cak' + r + base + frost + seed, function () {
      var w = r * 2 + 4, p = new Pix(w, w), c = w / 2, bc = P[base] || col(base), fc = P[frost] || col(frost);
      var R = FC.rng(seed), drips = [];
      for (var i = 0; i < w; i++) drips.push(i % 4 === 0 ? R() * 0.5 : 0);
      for (var j = 1; j < w - 1; j++) if (!drips[j]) drips[j] = (drips[j - 1] + drips[j + 1]) * 0.35;
      p.ell(c, c, r, r, function (x, y, dx, dy) {
        var edge = -0.15 + drips[x] + Math.sin(x * 0.5) * 0.06;
        return dy < edge ? shade(fc, dx, dy, x, y) : shade(bc, dx, dy, x, y);
      });
      sprinkles(p, seed + 1, Math.round(r * 1.6), function (x, y) {
        var dx = (x + 0.5 - c) / r, dy = (y + 0.5 - c) / r; return dx * dx + dy * dy < 0.8 && dy < -0.25 + drips[x];
      });
      return p.outline(P.K);
    });
  };

  // planète macaron
  FC.macaronPlanet = function (r, shell, cream) {
    return FC.mk('mac' + r + shell + cream, function () {
      var w = r * 2 + 4, h = Math.round(r * 1.5) + 4, p = new Pix(w, h), cx = w / 2, cy = h / 2;
      var sc = P[shell] || col(shell), cc = P[cream] || col(cream);
      p.ell(cx, cy, r, r * 0.72, function (x, y, dx, dy) {
        if (Math.abs(dy) < 0.16) return Math.abs(dy) > 0.1 && x % 2 ? mix(sc, P.K, 0.2) : shade(cc, dx, 0, x, y);
        if (Math.abs(dy) < 0.24 && (x % 3 === 0)) return mix(sc, P.K, 0.25);
        return shade(sc, dx, dy, x, y);
      });
      return p.outline(P.K);
    });
  };

  // planète à anneau de bonbon (rayures sucre d'orge)
  FC.ringPlanet = function (r, base, s1, s2) {
    return FC.mk('rng' + r + base + s1 + s2, function () {
      var w = Math.round(r * 3.4), h = Math.round(r * 2.2) + 4, p = new Pix(w, h), cx = w / 2, cy = h / 2;
      var bc = P[base] || col(base), c1 = P[s1] || col(s1), c2 = P[s2] || col(s2);
      var ring = function (back) {
        p.ell(cx, cy, r * 1.6, r * 0.42, function (x) { return Math.floor(x / 3) % 2 ? c1 : c2; }, function (x, y, dx, dy) {
          return dx * dx + dy * dy > 0.55 && (back ? dy < 0 : dy >= 0);
        });
      };
      ring(true);
      p.ell(cx, cy, r, r, function (x, y, dx, dy) { return shade(bc, dx, dy, x, y); });
      ring(false);
      return p.outline(P.K);
    });
  };

  // très grosse planète (fin du niveau 2)
  FC.giantPlanet = function (r) {
    return FC.mk('giant' + r, function () {
      var w = r * 2 + 12, p = new Pix(w, w), c = w / 2, R = FC.rng(42);
      p.ell(c, c, r + 5, r + 5, alpha(P.q, 60));
      p.ell(c, c, r + 2, r + 2, alpha(P.q, 110));
      var blobs = [];
      for (var i = 0; i < 14; i++) blobs.push([c + (R() - 0.5) * r * 1.6, c + (R() - 0.5) * r * 1.6, 6 + R() * r * 0.3]);
      p.ell(c, c, r, r, function (x, y, dx, dy) {
        var choco = false;
        for (var k = 0; k < blobs.length; k++) { var b = blobs[k], ex = (x - b[0]) / b[2], ey = (y - b[1]) / (b[2] * 0.6); if (ex * ex + ey * ey < 1) { choco = true; break; } }
        var base = choco ? P.l : (dy < -0.5 ? P.q : P.p);
        return shade(base, dx, dy, x, y);
      });
      sprinkles(p, 9, r * 6, function (x, y) { var dx = (x - c) / r, dy = (y - c) / r; return dx * dx + dy * dy < 0.9; });
      return p;
    });
  };

  // astéroïde bonbon menthe
  FC.mint = function (r, f) {
    return FC.mk('mint' + r + '_' + f, function () {
      var w = r * 2 + 3, p = new Pix(w, w), c = w / 2;
      p.ell(c, c, r, r, function (x, y, dx, dy) {
        var a = Math.atan2(dy, dx) + Math.sqrt(dx * dx + dy * dy) * 3 + f * 0.6;
        return Math.floor((a / Math.PI + 4) * 3) % 2 ? P.r : P.W;
      });
      p.put(Math.floor(c - r * 0.4), Math.floor(c - r * 0.4), P.W);
      return p.outline(P.K);
    });
  };

  FC.star = function (c) {
    return FC.mk('star' + c, function () {
      var p = new Pix(5, 5); p.rows(['..#..', '.###.', '#####', '.###.', '..#..'], 0, 0, { '#': P[c] || col(c) });
      p.put(2, 2, P.W); return p;
    });
  };

  // ---------- Niveau 3 : arbres et toiles ----------
  FC.lollipop = function (h, seed) {
    return FC.mk('lol' + h + seed, function () {
      var r = 11, w = r * 2 + 4, p = new Pix(w, h + r * 2 + 2), cx = w / 2;
      for (var y = r * 2; y < p.h; y++) { p.put(cx - 1, y, P.W); p.put(cx, y, (y % 4 < 2) ? P.v : P.W); }
      var c1 = [P.P, P.b, P.g][seed % 3];
      p.ell(cx, r + 1, r, r, function (x, y, dx, dy) {
        var a = Math.atan2(dy, dx) + Math.sqrt(dx * dx + dy * dy) * 5;
        return shade(Math.floor((a / Math.PI + 4) * 2) % 2 ? c1 : P.W, dx, dy, x, y);
      });
      return p.outline(P.K);
    });
  };
  FC.cotton = function (h, seed) {
    return FC.mk('cot' + h + seed, function () {
      var w = 34, p = new Pix(w, h + 30), cx = 17, R = FC.rng(seed);
      for (var y = 22; y < p.h; y++) { p.put(cx - 1, y, P.d); p.put(cx, y, P.D); }
      var c1 = seed % 2 ? P.p : P.b, c2 = seed % 2 ? P.q : P.s;
      for (var k = 0; k < 9; k++) {
        var bx = 7 + R() * 20, by = 8 + R() * 14, br = 5 + R() * 4;
        p.ell(bx, by, br, br * 0.85, function (x, y, dx, dy) { return dy < -0.3 && dx < 0.2 ? c2 : c1; });
      }
      return p.outline(P.K);
    });
  };
  // toile d'araignée géante (rayons + spirale)
  FC.bigWeb = function (r, broken) {
    return FC.mk('web' + r + (broken ? 'b' : ''), function () {
      var w = r * 2 + 2, p = new Pix(w, w), c = r, wc = alpha(P.s, 200), spokes = 10;
      for (var i = 0; i < spokes; i++) {
        var a = i / spokes * Math.PI * 2 + 0.2;
        if (broken && i % 3 === 0) continue;
        p.line(c, c, c + Math.cos(a) * r, c + Math.sin(a) * r, wc);
      }
      for (var ring = 4; ring < r; ring += 5) {
        for (var j = 0; j < spokes; j++) {
          if (broken && (j + ring) % 4 === 0) continue;
          var a1 = j / spokes * Math.PI * 2 + 0.2, a2 = (j + 1) / spokes * Math.PI * 2 + 0.2, rr = ring * 0.92;
          p.line(c + Math.cos(a1) * ring, c + Math.sin(a1) * ring, c + Math.cos(a2) * rr, c + Math.sin(a2) * rr, alpha(P.s, 150));
        }
      }
      return p;
    });
  };

  // ---------- Niveau 4-5 : métal ----------
  FC.pylon = function (h) {
    return FC.mk('pyl' + h, function () {
      var p = new Pix(16, h);
      for (var y = 0; y < h; y++) {
        var half = 2 + Math.floor(y / h * 5);
        p.put(8 - half, y, P.M); p.put(8 + half, y, P.M);
        if (y % 8 === 0) p.line(8 - half, y, 8 + half, y, P.n);
        if (y % 8 === 4) { p.put(8, y, P.n); }
      }
      for (var k = 4; k < h; k += 8) { p.line(8 - 2, k - 4, 8 + 2, k + 4, P.n); }
      p.rect(5, 0, 6, 3, P.m); p.put(8, 1, P.R);
      return p.outline(P.K);
    });
  };
  FC.turret = function (f) {
    return FC.mk('tur' + f, function () {
      var p = new Pix(22, 14);
      p.ell(11, 13, 9, 7, function (x, y, dx, dy) { return dy < -0.5 ? P.m : P.M; }, function (x, y, dx, dy) { return dy < 0; });
      p.line(10, 6, 2, 1 + f, P.n); p.line(10, 7, 2, 2 + f, P.n);
      p.put(11, 9, P.R);
      return p.outline(P.K);
    });
  };
  // silhouette de la forteresse-araignée au loin
  FC.fortress = function () {
    return FC.mk('fort', function () {
      var p = new Pix(120, 70), d = col('2a1530'), win = col('ff3355');
      p.ell(60, 44, 30, 22, d, function (x, y, dx, dy) { return dy < 0.5; });
      p.rect(36, 18, 6, 30, d); p.rect(78, 18, 6, 30, d); p.rect(56, 8, 8, 20, d);
      p.tri(35, 18, 43, 18, 39, 10, d); p.tri(77, 18, 85, 18, 81, 10, d); p.tri(55, 8, 65, 8, 60, 0, d);
      var legs = [[34, 50, 14, 30, 4, 70], [38, 54, 24, 44, 16, 70], [86, 50, 106, 30, 116, 70], [82, 54, 96, 44, 104, 70]];
      for (var i = 0; i < legs.length; i++) {
        var L = legs[i];
        for (var t = 0; t < 3; t++) { p.line(L[0], L[1] + t, L[2], L[3] + t, d); p.line(L[2] + t, L[3], L[4] + t, L[5], d); }
      }
      var ws = [[39, 24], [39, 32], [81, 24], [81, 32], [59, 14], [52, 38], [60, 36], [68, 38]];
      for (var k = 0; k < ws.length; k++) p.rect(ws[k][0], ws[k][1], 2, 3, win);
      return p;
    });
  };

  // ---------- Logo ----------
  FC.logo = function () {
    return FC.mk('logo', function () {
      var sc = 4, txt = 'FOOCAT', w = FC.textWidth(txt, sc) + 12, p = new Pix(w, 5 * sc + 12);
      FC.text(p, txt, 6, 9, P.U, { sc: sc });
      FC.text(p, txt, 6, 6, function (gx, gy) { return gy === 0 ? P.q : gy < 3 ? P.p : P.P; }, { sc: sc });
      for (var x = 6; x < w - 6; x += 3) if (p.on(x, 7)) p.put(x, 7, P.W);
      p.outline(P.K, true);
      return p;
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
