/* FooCat – sprites ajoutés pour le jeu */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, S = FC.S, alpha = FC.alpha;
  // petite tête de chat licorne pour compter les vies
  S.lifeIcon = function () {
    var p = new Pix(9, 9);
    p.rows(['....y....', '.w..y..w.', '.ww.y.ww.', '.wwwwwww.', 'wwKwwwKww', 'wwwwPwwww', '.wwwwwww.'], 0, 1);
    return p.outline(P.K);
  };
  // bulle « 1UP » : une vie en plus
  S.b1up = function () {
    var p = new Pix(16, 16);
    p.ell(8, 8, 7.2, 7.2, function (x, y, dx, dy) {
      var r = dx * dx + dy * dy;
      if (r > 0.72) return P.y;
      if (dx < -0.3 && dy < -0.3 && r > 0.35) return P.h;
      return alpha(P.y, 70);
    });
    FC.text(p, '1UP', 3, 6, P.W, { outline: P.K });
    return p;
  };
  // toile collée sur le chat quand il est ralenti
  S.stuck = function () {
    var p = new Pix(24, 18), c = alpha(P.s, 170);
    for (var a = 0; a < 6; a++) { var an = a * Math.PI / 3; p.line(12, 9, 12 + Math.cos(an) * 11, 9 + Math.sin(an) * 8, c); }
    p.ell(12, 9, 6, 4.5, alpha(P.s, 130), function (x, y, dx, dy) { return dx * dx + dy * dy > 0.6; });
    return p;
  };

  // mouche dorée : plus solide (4 coups)
  S.flyGold = function (f) {
    var src = FC.spr('fly', f), p = new Pix(src.w, src.h);
    p.blit(src, 0, 0);
    var d = p.d, gold = P.Y, light = P.y;
    for (var i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 255) continue;
      var lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
      if (d[i] > 200 && d[i + 1] < 80) continue; // garde les yeux rouges
      if (d[i] === P.x[0] && d[i + 1] === P.x[1] && d[i + 2] === P.x[2]) { d[i] = P.j[0]; d[i + 1] = P.j[1]; d[i + 2] = P.j[2]; continue; }
      if (lum < 40) continue; // garde le contour
      var c = lum > 140 ? light : gold;
      d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
    }
    p.put(9, 6, P.W); p.put(12, 7, P.W);
    return p;
  };
  // arc-en-ciel qui grandit en avançant (taille 0, 1, 2)
  S.rainArc = function (f) {
    var k = [1, 1.45, 1.9][f % 3], w = Math.round(9 * k), h = Math.round(13 * k), p = new Pix(w + 1, h + 1);
    var cx = 1, cy = h / 2, rx = 7.5 * k, ry = 6.2 * k, band = (rx - 2.2 * k) / 6;
    for (var y = 0; y <= h; y++) for (var x = 0; x <= w; x++) {
      var dx = (x + 0.5 - cx), dy = (y + 0.5 - cy);
      if (dx <= 0) continue;
      var r = Math.sqrt((dx / rx) * (dx / rx) + (dy / ry) * (dy / ry)) * rx;
      if (r > rx || r < rx - band * 6) continue;
      p.put(x, y, FC.RAINBOW[Math.min(5, Math.floor((rx - r) / band))]);
    }
    return p;
  };
  // gros dragibus avec reflet
  S.bigDrag = function (f) {
    var p = new Pix(9, 8), c = [P.r, P.y, P.g, P.b, P.u, P.o][f % 6];
    p.ell(4.5, 4, 4, 3.2, function (x, y, dx, dy) { return dy > 0.45 ? FC.mix(c, P.K, 0.3) : c; });
    p.put(3, 2, P.W); p.put(2, 3, P.W); p.outline(P.K); return p;
  };

  // mini-araignée de métal (forteresse) : rapide, elle fonce vers le chat
  S.spiderling = function (f) {
    var p = new Pix(16, 12), b = new Pix(16, 12), off = f % 2;
    var legs = [[6, 6, 3, 2 + off, 0, 7 - off], [7, 7, 5, 4 - off, 2, 11], [10, 6, 12, 2 - off, 15, 6 + off], [9, 7, 11, 5 + off, 14, 11]];
    for (var i = 0; i < legs.length; i++) { var L = legs[i]; p.line(L[0], L[1], L[2], L[3], P.m); p.line(L[2], L[3], L[4], L[5], P.m); }
    b.ell(10, 6, 4.5, 3.5, function (x, y, dx, dy) { return dy < -0.4 ? P.m : P.M; });
    b.ell(5, 7, 2.6, 2.4, P.n);
    b.put(4, 6, P.R); b.put(5, 6, P.R); b.put(10, 4, P.W);
    b.outline(P.K);
    p.blit(b, 0, 0);
    return p;
  };
  // pilier de métal (sol ou plafond de la forteresse)
  S.pillar = function (h) {
    var p = new Pix(18, h);
    for (var y = 0; y < h; y++) for (var x = 2; x < 16; x++) {
      var c = x < 5 ? P.m : x > 12 ? P.n : P.M;
      if (y % 16 === 0) c = P.n;
      if ((y % 16 === 4 || y % 16 === 12) && (x === 4 || x === 13)) c = P.m;
      p.put(x, y, c);
    }
    for (var k = 0; k < 6; k++) for (var x2 = 2; x2 < 16; x2++) { // bandes de danger aux deux bouts
      var stripe = ((x2 + k) >> 1) % 2 ? P.Y : P.x;
      p.put(x2, k, stripe); p.put(x2, h - 1 - k, stripe);
    }
    return p.outline(P.K);
  };

  // scorpion de fer (niveau 4) : marche au sol, sa queue tire trois balles en éventail
  S.scorpion = function (f) {
    var p = new Pix(28, 18), b = new Pix(28, 18), off = f % 2;
    // pattes
    for (var i = 0; i < 4; i++) { var lx = 8 + i * 4; p.line(lx, 13, lx - 2 + (i + off) % 2 * 2, 17, P.n); }
    // corps en segments
    b.ell(12, 12, 7, 3.6, function (x, y, dx, dy) { return dy < -0.3 ? P.m : (x % 4 === 0 ? P.n : P.M); });
    b.ell(5, 12, 3.2, 3, P.M);
    // pinces vers l'avant (à gauche)
    b.ell(1.5, 9.5, 2.2, 1.8, P.m); b.ell(1.5, 14.5, 2.2, 1.8, P.m);
    b.put(3, 10, P.n); b.put(3, 14, P.n);
    // queue qui remonte au-dessus du dos, dard rouge
    var tail = [[18, 11], [21, 9], [23, 6], [22, 3], [19, 2], [16, 3]];
    for (var k = 0; k < tail.length; k++) b.ell(tail[k][0], tail[k][1] - off * (k > 2 ? 1 : 0), 2, 2, k % 2 ? P.M : P.m);
    b.put(14, 4 - off, P.R); b.put(13, 4 - off, P.R); b.put(14, 5 - off, P.q);
    // yeux
    b.put(4, 10, P.R); b.put(6, 10, P.R);
    b.outline(P.K);
    p.blit(b, 0, 0);
    return p;
  };
})(typeof window !== 'undefined' ? window : globalThis);
