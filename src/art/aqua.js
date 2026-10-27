/* FooCat – monde aquatique (niveaux 6 à 10) : monstres, pièges et décors */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, S = FC.S, alpha = FC.alpha, col = FC.col, RB = FC.RAINBOW;
  var SEA = col('0e3a6e'), FOAM = col('cfffff'), CORAL = col('ff7a8a'), BONE = col('f3ead2'), BONE2 = col('c9bc98');

  // retourne une image à l'envers (de haut en bas)
  FC.flipV = function (src) {
    var p = new Pix(src.w, src.h);
    for (var y = 0; y < src.h; y++) for (var x = 0; x < src.w; x++) {
      var i = ((src.h - 1 - y) * src.w + x) * 4, j = (y * src.w + x) * 4;
      p.d[j] = src.d[i]; p.d[j + 1] = src.d[i + 1]; p.d[j + 2] = src.d[i + 2]; p.d[j + 3] = src.d[i + 3];
    }
    return p;
  };

  // ---------- poisson guitare : son corps est une guitare, sa queue le manche ----------
  S.guitarFish = function (f) {
    var p = new Pix(32, 18), w = f % 2;
    // nageoires
    p.tri(10, 4, 16, 4, 12, 0.5, P.o); p.tri(10, 14, 16, 14, 12, 17.5, P.o);
    // corps en forme de guitare (deux bosses)
    p.ell(10, 9, 7.5, 6, function (x, y, dx, dy) { return dy > 0.45 ? col('b8263a') : P.r; });
    p.ell(18, 9, 5, 4.6, function (x, y, dx, dy) { return dy > 0.45 ? col('b8263a') : P.r; });
    p.ell(15, 10, 3, 2.4, P.W); // plaque
    p.ell(13, 8, 1.8, 1.8, P.K); // la rosace
    // manche qui sert de queue, avec ses frettes, et la tête du manche
    for (var x = 22; x < 29; x++) { p.put(x, 8, P.D); p.put(x, 9, P.d); p.put(x, 10, P.D); if (x % 2) p.put(x, 9, P.y); }
    p.rect(28, 5 + w, 3, 8, P.D); p.put(29, 6 + w, P.m); p.put(29, 9 + w, P.m); p.put(29, 12 + w, P.m);
    for (var sx = 15; sx < 28; sx++) if (sx % 3) p.put(sx, 9, P.W); // les cordes
    // tête : gros œil et bouche
    p.ell(5, 7, 2.6, 2.6, P.W); p.rect(4, 7, 2, 2, P.K); p.put(4, 7, P.W);
    p.put(2, 11, P.K); p.put(3, 11, P.K);
    return p.outline(P.K);
  };
  // note de musique en feu (un do dièse !)
  S.note = function (f) {
    var p = new Pix(13, 15);
    p.rect(7, 2, 2, 10, P.y); // la hampe
    p.ell(5, 11.5, 3.6, 2.6, P.y); p.put(3, 10, P.W); // la tête de la note
    p.rect(9, 2, 2, 2, P.y); p.rect(10, 4, 2, 2, P.y); p.put(11, 6, P.y); // le crochet
    p.outline(P.r);
    var flame = [[6, 0], [9, 0], [12, 3], [1, 9], [12, 7], [4, 14], [8, 14], [0, 12]];
    for (var k = 0; k < flame.length; k++) if ((k + f) % 3) p.put(flame[k][0], flame[k][1], (k + f) % 2 ? P.o : P.y);
    return p;
  };

  // ---------- crabe : marche au fond, lance des maracas ----------
  S.crab = function (f) {
    var p = new Pix(26, 18), b = new Pix(26, 18), sh = f % 2;
    for (var i = 0; i < 3; i++) { // pattes
      p.line(8 - i * 2, 12, 5 - i * 2 + sh, 17, col('b8263a')); p.line(18 + i * 2, 12, 21 + i * 2 - sh, 17, col('b8263a'));
    }
    b.ell(13, 12, 8, 4.6, function (x, y, dx, dy) { return dy < -0.3 ? P.o : P.r; });
    b.line(10, 8, 9, 4, P.r); b.line(16, 8, 17, 4, P.r); // yeux sur pédoncules
    b.ell(9, 3.5, 1.8, 1.8, P.W); b.ell(17, 3.5, 1.8, 1.8, P.W); b.put(9, 4, P.K); b.put(17, 4, P.K);
    b.put(11, 13, P.K); b.put(15, 13, P.K); b.line(12, 14, 14, 14, P.K); // sourire
    // pinces levées qui secouent des maracas
    b.line(5, 11, 3, 7, P.r); b.line(21, 11, 23, 7, P.r);
    b.ell(3, 6 - sh, 2.4, 2, P.o); b.ell(23, 6 + sh - 1, 2.4, 2, P.o);
    b.outline(P.K);
    p.blit(b, 0, 0);
    p.blit(FC.spr('maraca', f), 0, -2 - sh); p.blit(FC.spr('maraca', f + 3), 18, -3 + sh);
    return p;
  };
  S.maraca = function (f) {
    var p = new Pix(8, 11);
    p.rect(3, 6, 2, 5, P.D);
    p.ell(4, 3.8, 3, 3.3, function (x, y) { return RB[(x + y + f) % 6]; });
    p.put(3, 2, P.W);
    return p.outline(P.K);
  };

  // ---------- crevette chauve-souris ----------
  S.batShrimp = function (f) {
    var p = new Pix(32, 30), b = new Pix(32, 30), up = f % 2 === 0, oy = 4;
    // grandes ailes de chauve-souris (membrane violette, doigts plus foncés)
    if (up) {
      p.tri(5, 15, 27, 15, 20, 0, P.U); p.tri(5, 15, 18, 15, 9, 1, P.U); p.tri(9, 15, 25, 15, 19, 4, P.u); p.tri(8, 15, 16, 15, 10, 5, P.u);
      p.line(20, 0, 15, 15, P.K); p.line(9, 1, 12, 15, P.K); p.put(20, 0, P.W); p.put(9, 1, P.W);
    } else {
      p.tri(5, 15, 27, 15, 20, 29, P.U); p.tri(5, 15, 18, 15, 9, 28, P.U); p.tri(9, 15, 25, 15, 19, 26, P.u); p.tri(8, 15, 16, 15, 10, 25, P.u);
      p.line(20, 29, 15, 15, P.K); p.line(9, 28, 12, 15, P.K);
    }
    // corps de crevette, recourbé
    var seg = [[5, 11, 3.2], [8.5, 11.5, 3.2], [12, 12, 3], [15, 13, 2.7], [17.5, 14.5, 2.3], [19.5, 16, 2]];
    for (var i = 0; i < seg.length; i++) b.ell(seg[i][0], seg[i][1] + oy, seg[i][2], seg[i][2] * 0.9, i % 2 ? P.q : P.p);
    b.tri(19, 16 + oy, 25, 14 + oy, 25, 20 + oy, P.P); // queue en éventail
    b.rect(3, 10 + oy, 2, 2, P.K); b.put(3, 10 + oy, P.W); // œil
    b.line(2, 9 + oy, 0, 4 + oy, P.P); b.line(3, 8 + oy, 2, 3 + oy, P.P); // antennes
    b.outline(P.K);
    p.blit(b, 0, 0);
    return p;
  };
  // suspendue au plafond, ailes repliées
  S.batShrimpHang = function () { return FC.flipV(FC.spr('batShrimp', 1)); };

  // ---------- méduses ----------
  function jelly(f, light, main) {
    var p = new Pix(20, 26), t = f % 4;
    for (var k = 0; k < 4; k++) { // tentacules qui ondulent
      var x0 = 4 + k * 4;
      for (var y = 11; y < 25; y++) p.put(x0 + Math.round(Math.sin((y + t * 2 + k) * 0.6) * 1.5), y, alpha(main, 210));
    }
    p.ell(10, 9, 9, 7.5, function (x, y, dx, dy) {
      if (dy > 0.35) return null;
      if (dx < -0.35 && dy < -0.4) return alpha(P.W, 230);
      return alpha(dy < -0.2 ? light : main, 215);
    });
    p.rect(6, 7, 2, 2, P.K); p.rect(12, 7, 2, 2, P.K); p.put(6, 7, P.W); p.put(12, 7, P.W);
    p.put(5, 10, P.P); p.put(14, 10, P.P); p.put(9, 10, P.K); p.put(10, 10, P.K);
    return p;
  }
  S.jellyBlue = function (f) { return jelly(f, col('a8e8ff'), P.B); };
  S.jellyPink = function (f) { return jelly(f, P.q, P.P); };
  // jet de jus de fraise
  S.juice = function (f) {
    var p = new Pix(9, 6);
    p.ell(5.5, 3, 3.3, 2.5, P.r); p.ell(2, 3, 1.6, 1.2, alpha(P.r, 160));
    p.put(5, 2, P.y); p.put(7, 3, P.y); p.put(4, 4, P.y); p.put(6, 1, P.W);
    if (f % 2) p.put(0, 3, alpha(P.r, 120));
    return p;
  };

  // ---------- bulle soporifique (le chat s'endort 1,5 s) ----------
  S.sleepBubble = function (f) {
    var p = new Pix(18, 18), u = col('c7b2ff');
    p.ell(9, 9, 8, 8, function (x, y, dx, dy) {
      var r = dx * dx + dy * dy;
      if (r > 0.75) return alpha(u, 230);
      if (dx < -0.3 && dy < -0.35 && r > 0.3) return alpha(P.W, 220);
      return alpha(u, 70);
    });
    FC.text(p, 'Z', 6, 6, P.W); FC.text(p, 'Z', 11, 2 + (f % 2), alpha(P.W, 200));
    return p;
  };

  // ---------- algues (au sol ; retournées pour le plafond) ----------
  FC.algae = function (h, kind, f) {
    return FC.mk('alg' + h + kind + '_' + f, function () {
      var c = [[P.g, P.G], [P.a, col('1f8f7a')], [P.u, P.U]][kind % 3], p = new Pix(16, h);
      for (var y = 0; y < h; y++) {
        var k = 1 - y / h, x = 8 + Math.round(Math.sin(y * 0.22 + f * 0.7) * 3 * k);
        p.rect(x - 1, y, 3, 1, c[1]); p.put(x, y, c[0]);
        if (y % 7 === 3) p.ell(x + (y % 14 < 7 ? 3 : -3), y, 2.6, 1.4, c[0]);
      }
      return p.outline(P.K);
    });
  };
  FC.coral = function (seed) {
    return FC.mk('coral' + seed, function () {
      var p = new Pix(24, 22), R = FC.rng(seed), c = [CORAL, P.o, P.u][seed % 3];
      (function branch(x, y, a, len, d) {
        var x2 = x + Math.cos(a) * len, y2 = y + Math.sin(a) * len;
        for (var t = 0; t < 2; t++) p.line(x + t, y, x2 + t, y2, c);
        if (d < 3) { branch(x2, y2, a - 0.5 - R() * 0.3, len * 0.7, d + 1); branch(x2, y2, a + 0.5 + R() * 0.3, len * 0.7, d + 1); }
        else p.ell(x2, y2, 1.6, 1.6, P.q);
      })(12, 22, -Math.PI / 2, 8, 0);
      return p.outline(P.K);
    });
  };

  // ---------- espace : comète, glace, gouttes, planète océan ----------
  S.comet = function (f) {
    var p = new Pix(40, 12);
    for (var x = 0; x < 32; x++) {
      var a = Math.round(x / 32 * 200), h = 1 + Math.round(x / 32 * 3);
      p.rect(x, 6 - Math.floor(h / 2), 1, h, alpha(x % 3 ? col('9fe6ff') : P.W, a));
      if ((x * 7 + f) % 9 === 0) p.put(x, 6 + ((x + f) % 5) - 2, alpha(RB[x % 6], 220));
    }
    p.ell(34, 6, 4.6, 4.6, function (x, y, dx, dy) { return dx < -0.2 && dy < -0.2 ? P.W : col('bff3ff'); });
    return p;
  };
  FC.iceBlock = function (r) {
    return FC.mk('ice' + r, function () {
      var p = new Pix(r * 2 + 3, r * 2 + 3), c = r + 1;
      p.tri(c, 1, c + r, c, c - r, c, col('bff3ff')); p.tri(c - r, c, c + r, c, c, c + r, col('7fd3f2'));
      p.tri(c, 1, c + r, c, c, c + r, col('9fe6ff'));
      p.line(c, 1, c, c + r, alpha(P.W, 200)); p.put(c - 2, c - 3, P.W);
      return p.outline(col('2b5f8a'));
    });
  };
  FC.waterDrop = function (r) {
    return FC.mk('drop' + r, function () {
      var p = new Pix(r * 2 + 4, r * 3 + 4), cx = r + 2, cy = r * 2 + 1;
      p.tri(cx - r * 0.9, cy - r * 0.4, cx + r * 0.9, cy - r * 0.4, cx, 1, alpha(P.b, 210));
      p.ell(cx, cy, r, r, function (x, y, dx, dy) { return dx < -0.3 && dy < -0.2 ? alpha(P.W, 230) : alpha(dy > 0.4 ? P.B : P.b, 210); });
      return p.outline(col('1d4f8a'));
    });
  };
  FC.oceanPlanet = function (r) {
    return FC.mk('ocean' + r, function () {
      var w = r * 2 + 14, p = new Pix(w, w), c = w / 2, R = FC.rng(77), isl = [];
      p.ell(c, c, r + 6, r + 6, alpha(col('7fe0ff'), 50)); p.ell(c, c, r + 3, r + 3, alpha(col('7fe0ff'), 90));
      for (var i = 0; i < 6; i++) isl.push([c + (R() - 0.5) * r * 1.3, c + (R() - 0.5) * r * 1.3, 4 + R() * r * 0.18]);
      p.ell(c, c, r, r, function (x, y, dx, dy) {
        for (var k = 0; k < isl.length; k++) {
          var ex = (x - isl[k][0]) / isl[k][2], ey = (y - isl[k][1]) / (isl[k][2] * 0.7);
          if (ex * ex + ey * ey < 1) return FC.shade(P.g, dx, dy, x, y);
          if (ex * ex + ey * ey < 1.5) return FOAM;
        }
        return FC.shade(Math.sin(y * 0.5 + x * 0.08) > 0.7 ? col('3aa0e8') : col('1f6fc4'), dx, dy, x, y);
      });
      return p;
    });
  };

  // ---------- château marin ----------
  FC.portcullis = function (h) {
    return FC.mk('herse' + h, function () {
      var p = new Pix(30, h);
      for (var x = 2; x < 30; x += 7) { p.rect(x, 0, 3, h - 4, P.M); p.rect(x, 0, 1, h - 4, P.m); p.tri(x - 1, h - 5, x + 4, h - 5, x + 1.5, h, P.m); }
      for (var y = 6; y < h - 6; y += 10) { p.rect(0, y, 30, 3, P.n); p.rect(0, y, 30, 1, P.M); }
      return p.outline(P.K);
    });
  };

  // ---------- le boss : poisson squelette de la mort ----------
  function skeleton(f, armored) {
    var p = new Pix(132, 92), jaw = f % 2, wig = f % 2 ? 1 : -1;
    // arête et côtes
    for (var x = 52; x < 112; x++) { p.put(x, 44, BONE); p.put(x, 45, BONE2); }
    for (var k = 0; k < 7; k++) {
      var rx = 56 + k * 8, len = 22 - k * 2.2;
      for (var t = 0; t < 2; t++) { p.line(rx + t, 44, rx + 4 + t, 44 - len, BONE); p.line(rx + t, 45, rx + 4 + t, 45 + len, BONE); }
    }
    // nageoire de queue en os
    for (var q = 0; q < 5; q++) p.line(110, 45, 128, 26 + q * 10 + wig * 2, q % 2 ? BONE2 : BONE);
    // crâne
    p.ell(32, 42, 24, 20, function (x, y, dx, dy) { return dy > 0.5 ? BONE2 : BONE; });
    p.ell(26, 36, 7, 7, P.K); // orbite
    p.ell(26, 36, 3.5 + jaw * 0.5, 3.5 + jaw * 0.5, col('6dff9a')); p.put(25, 35, P.W); // l'œil qui brille
    p.ell(42, 32, 3, 2, BONE2); p.ell(40, 52, 4, 2, BONE2); // fêlures
    // mâchoire et dents
    var my = 54 + jaw * 4;
    p.tri(6, 46, 30, 50, 8, my, BONE2);
    for (var d = 0; d < 6; d++) { p.tri(9 + d * 4, 47, 12 + d * 4, 47, 10.5 + d * 4, 51, P.W); p.tri(8 + d * 4, my - 1, 11 + d * 4, my - 1, 9.5 + d * 4, my - 5 + jaw, P.W); }
    if (armored) {
      // casque à pointes et plaques d'armure par-dessus les côtes
      p.ell(34, 30, 22, 13, function (x, y, dx, dy) {
        if (dy > 0.2) return null;
        if ((x + y) % 11 === 0) return P.m;
        return dy < -0.5 ? P.m : P.M;
      });
      p.tri(24, 19, 30, 19, 27, 6, P.m); p.tri(36, 18, 42, 19, 39, 5, P.m); p.tri(46, 22, 51, 24, 52, 11, P.m);
      p.ell(26, 36, 7.5, 7.5, null);
      for (var a = 0; a < 4; a++) {
        var ax = 56 + a * 14;
        p.ell(ax + 6, 44, 7, 18 - a * 2, function (x, y, dx, dy) { return dx < -0.5 ? P.m : (y === 44 ? P.n : P.M); });
        p.put(ax + 4, 34, P.m); p.put(ax + 4, 54, P.m);
      }
      p.ell(26, 36, 3.5, 3.5, col('ff3355')); p.put(25, 35, P.W); // œil rouge sous le casque
    }
    return p.outline(P.K);
  }
  S.skelBossArmor = function (f) { return skeleton(f, true); };
  S.skelBoss = function (f) { return skeleton(f, false); };
  // mini-poisson squelette (escorte de la phase 2)
  S.miniSkel = function (f) {
    var p = new Pix(18, 11), wig = f % 2;
    p.line(7, 5, 14, 5, BONE); for (var k = 0; k < 3; k++) p.line(8 + k * 2, 2, 8 + k * 2, 8, BONE2);
    p.tri(14, 5, 17, 1 + wig, 17, 9 - wig, BONE);
    p.ell(4, 5, 3.6, 3.4, BONE); p.put(3, 4, col('6dff9a')); p.put(1, 7, P.K); p.put(2, 7, P.W);
    return p.outline(P.K);
  };
  // arête lancée par le boss
  S.bone = function (f) {
    var p = new Pix(11, 7);
    if (f % 2) p.line(1, 5, 9, 1, BONE); else p.line(1, 3, 9, 3, BONE);
    var e = f % 2 ? [[1, 5], [9, 1]] : [[1, 3], [9, 3]];
    p.ell(e[0][0], e[0][1], 1.6, 1.6, BONE); p.ell(e[1][0], e[1][1], 1.6, 1.6, BONE);
    return p.outline(P.K);
  };
  // petit poisson jaune (les bancs de poissons remplacent les mouches sous l'eau)
  S.smallFish = function (f) {
    var p = new Pix(16, 11), w = f % 2;
    p.tri(10, 5.5, 15, 1 + w, 15, 10 - w, P.o);
    p.ell(7, 5.5, 5.5, 4, function (x, y, dx, dy) { return dy > 0.4 ? P.Y : P.y; });
    p.line(6, 2, 6, 9, P.o);
    p.rect(3, 4, 2, 2, P.K); p.put(3, 4, P.W);
    return p.outline(P.K);
  };
  FC.SEA = SEA;
})(typeof window !== 'undefined' ? window : globalThis);
