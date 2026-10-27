/* FooCat – personnages, projectiles, bonus */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, S = FC.S, alpha = FC.alpha, RB = FC.RAINBOW;

  // ---------- Héros : chat licorne dans sa soucoupe donut ----------
  S.hero = function (f) {
    var p = new Pix(40, 31), cx = 19.5;
    // donut (dessiné en premier, le dôme sort du trou)
    var drip = function (x) { var m = x % 7; return m === 2 ? 0.3 : m === 3 ? 0.55 : m === 4 ? 0.25 : (x % 11 === 5 ? 0.4 : 0); };
    p.ell(cx, 23.5, 18.5, 6, function (x, y, dx, dy) {
      var edge = -0.05 + drip(x);
      if (dy < edge) {
        if (dy < -0.62) return P.q;
        if (dy > edge - 0.22) return P.i;
        return P.P;
      }
      return dy > 0.55 ? P.e : dy > 0.2 ? P.D : P.d;
    });
    // vermicelles sur le glaçage
    var R = FC.rng(7);
    for (var n = 0; n < 26; n++) {
      var sx = 2 + Math.floor(R() * 36), sy = 18 + Math.floor(R() * 4);
      var c = FC.SPRINKLES[n % FC.SPRINKLES.length];
      var ddx = (sx + 0.5 - cx) / 18.5, ddy = (sy + 0.5 - 23.5) / 6;
      if (ddx * ddx + ddy * ddy < 0.8 && ddy < -0.1) { p.put(sx, sy, c); if (n % 2) p.put(sx + 1, sy, c); else p.put(sx + 1, sy - 1, c); }
    }
    // intérieur du dôme (coupé au bord du donut)
    var dome = new Pix(40, 31);
    // crinière arc-en-ciel qui flotte vers l'arrière
    for (var i = 0; i < 6; i++) {
      for (var x = 9; x <= 16; x++) {
        var yy = 9 + i + Math.round(Math.sin((x + f * 1.7) * 0.8) * 0.8 * (16 - x) / 7);
        dome.put(x, yy, RB[i]);
      }
    }
    // oreilles
    dome.tri(13.5, 13, 14.5, 6.5, 18, 10.5, P.w); dome.tri(25.5, 13, 24.5, 6.5, 21, 10.5, P.w);
    dome.tri(14.6, 11.6, 15, 8.4, 17, 10.6, P.p); dome.tri(24.4, 11.6, 24, 8.4, 22, 10.6, P.p);
    // tête
    dome.ell(cx, 14.5, 6.6, 4.6, function (x, y, dx, dy) { return dy > 0.6 ? P.v : P.w; });
    // mèche arc-en-ciel sur le front
    dome.put(14, 10, P.r); dome.put(15, 10, P.o); dome.put(14, 11, P.o); dome.put(16, 10, P.y); dome.put(15, 11, P.y); dome.put(14, 12, P.g);
    // yeux (clignement sur une image)
    if (f % 4 === 3) { dome.rect(15, 15, 2, 1, P.K); dome.rect(22, 15, 2, 1, P.K); }
    else { dome.rect(15, 13, 2, 3, P.K); dome.rect(22, 13, 2, 3, P.K); dome.put(15, 13, P.W); dome.put(22, 13, P.W); dome.put(16, 15, P.U); dome.put(23, 15, P.U); }
    dome.put(19, 16, P.P); dome.put(18, 17, P.k); dome.put(20, 17, P.k);
    dome.put(14, 16, P.p); dome.put(24, 16, P.p);
    // corne dorée torsadée
    dome.tri(17.4, 11.5, 21.6, 11.5, 19.5, 1.5, function (x, y) { return (x + y) % 3 === 0 ? P.y : P.Y; });
    // verre
    dome.ell(cx, 19.5, 11, 17, function (x, y, dx, dy) {
      var r = dx * dx + dy * dy;
      if (dx > -0.78 && dx < -0.58 && dy > -0.78 && dy < -0.3) return P.h;
      if (dx > 0.3 && dx < 0.5 && dy > -0.92 && dy < -0.8) return P.h;
      return r > 0.84 ? P.C : P.c;
    });
    for (var yy2 = 0; yy2 <= 21; yy2++) for (var xx = 0; xx < 40; xx++) {
      var i4 = (yy2 * 40 + xx) * 4; if (!dome.d[i4 + 3]) continue;
      p.put(xx, yy2, [dome.d[i4], dome.d[i4 + 1], dome.d[i4 + 2], dome.d[i4 + 3]]);
    }
    for (var x2 = 10; x2 <= 29; x2++) p.put(x2, 22, P.i);
    p.outline(P.K);
    // hublots lumineux
    var lights = [6, 12, 19, 26, 32];
    for (var k = 0; k < lights.length; k++) p.put(lights[k], 26, (k + f) % 2 ? P.y : P.a);
    return p;
  };

  // ---------- Ennemis (regardent vers la gauche) ----------
  S.fly = function (f) {
    var p = new Pix(18, 14);
    var up = f % 2 === 0;
    p.ell(10, 8, 5, 3.2, function (x, y, dx, dy) { return dy < -0.4 ? P.g : (x % 2 ? P.G : P.x); });
    p.ell(4, 7.5, 3, 3, P.x);
    p.rect(2, 6, 2, 2, P.R); p.put(2, 6, P.W); p.put(4, 6, P.R);
    p.put(1, 10, P.x); p.put(0, 11, P.x); // trompe
    for (var l = 0; l < 3; l++) { p.put(6 + l * 3, 11, P.x); p.put(5 + l * 3, 12, P.x); }
    p.outline(P.K);
    if (up) { p.ell(9, 3, 4, 2.2, alpha(P.b, 150)); p.ell(13, 3.5, 3, 1.8, alpha(P.s, 150)); }
    else { p.ell(9, 6, 4.5, 1.5, alpha(P.b, 150)); p.ell(13, 6, 3.5, 1.3, alpha(P.s, 150)); }
    return p;
  };

  S.spider = function (f) {
    var p = new Pix(26, 20), b = new Pix(26, 20);
    var off = f % 2 ? 1 : 0;
    // pattes fines et arquées (derrière le corps)
    var legs = [[10, 8, 5, 2 - off, 1, 11 + off], [11, 9, 7, 4 + off, 3, 15 - off], [16, 6, 21, 1 + off, 25, 10 - off],
      [15, 9, 19, 4 - off, 22, 15 + off], [12, 12, 9, 16, 8, 19 - off], [16, 12, 18, 16, 19, 19 + off]];
    for (var i = 0; i < legs.length; i++) {
      var L = legs[i]; p.line(L[0], L[1], L[2], L[3], P.U); p.line(L[2], L[3], L[4], L[5], P.U); p.put(L[2], L[3], P.u);
    }
    // abdomen rayé
    b.ell(17, 9, 6.5, 5, function (x, y, dx, dy) { return dy < -0.55 ? P.u : (Math.abs(dx - 0.1) < 0.18 ? P.P : P.U); });
    // tête + casque spatial
    b.ell(8, 10, 3.6, 3.2, P.x);
    b.put(5, 9, P.R); b.put(6, 9, P.R); b.put(5, 11, P.R); b.put(7, 10, P.R);
    b.put(5, 13, P.W); b.put(7, 13, P.W);
    b.outline(P.K);
    b.ell(7.5, 9.5, 5, 4.6, function (x, y, dx, dy) {
      if (dx < -0.4 && dy < -0.3 && dx > -0.75) return P.h;
      return dx * dx + dy * dy > 0.78 ? P.C : P.c;
    });
    p.blit(b, 0, 0);
    return p;
  };

  S.wasp = function (f) {
    var p = new Pix(22, 14);
    p.ell(12.5, 8, 6.5, 3.6, function (x) { return Math.floor((x - 7) / 2) % 2 ? P.x : P.Y; });
    p.put(19, 8, P.x); p.put(20, 8, P.x); p.put(21, 9, P.x); // dard
    p.ell(4.5, 7.5, 3.4, 3.2, P.x);
    p.rect(2, 6, 2, 2, P.g); p.put(2, 6, P.W);
    p.put(1, 2, P.x); p.put(2, 3, P.x); p.put(3, 4, P.x); // antenne
    p.put(3, 11, P.x); p.put(9, 12, P.x); p.put(12, 12, P.x);
    p.outline(P.K);
    if (f % 2 === 0) p.ell(11, 3, 4.5, 2.2, alpha(P.s, 160)); else p.ell(11, 5, 5, 1.4, alpha(P.s, 160));
    return p;
  };

  S.ant = function (f) {
    var p = new Pix(22, 16);
    var off = f % 2;
    for (var i = 0; i < 3; i++) {
      p.line(9 + i * 2, 10, 6 + i * 3 + off, 15, P.L);
    }
    p.ell(16, 9.5, 4.5, 3.5, function (x, y, dx, dy) { return dy < -0.5 ? P.o : P.r; });
    p.ell(10, 9, 2.6, 2.2, P.r);
    p.ell(5, 7, 3.4, 3, function (x, y, dx, dy) { return dy < -0.5 ? P.o : P.r; });
    p.rect(3, 6, 2, 2, P.K); p.put(3, 6, P.W);
    p.put(2, 3, P.L); p.put(3, 2, P.L); p.put(1, 1, P.L); // antennes
    // casque militaire
    p.ell(5.5, 4.6, 3.4, 1.8, P.G, function (x, y, dx, dy) { return dy < 0.4; });
    // morceau de sucre brandi
    p.rect(9, 1 + off, 4, 4, P.W); p.rect(9, 4 + off, 4, 1, P.v); p.put(8, 5, P.r);
    p.outline(P.K);
    return p;
  };

  S.robot = function (f) {
    var p = new Pix(26, 20);
    // hélice
    var w = f % 2 ? 9 : 5;
    p.rect(13 - w, 1, w * 2, 1, P.m); p.rect(12, 2, 2, 3, P.M);
    // pattes métalliques
    var legs = [[8, 12, 3, 18], [10, 13, 8, 19], [16, 13, 18, 19], [18, 12, 23, 18]];
    for (var i = 0; i < legs.length; i++) {
      var L = legs[i]; p.line(L[0], L[1], (L[0] + L[2]) / 2, L[1] + 2, P.n); p.line((L[0] + L[2]) / 2, L[1] + 2, L[2], L[3], P.n);
    }
    p.ell(13, 10, 8, 5, function (x, y, dx, dy) { return dy < -0.5 ? P.m : (dy > 0.5 ? P.n : P.M); });
    p.put(9, 8, P.m); p.put(17, 8, P.m); p.put(13, 13, P.n);
    p.ell(8, 10, 2.2, 2.2, f % 2 ? P.R : P.r); p.put(7, 9, P.W);
    p.outline(P.K);
    return p;
  };

  // ---------- Boss : l'Araignée de Fer ----------
  S.boss = function (f) {
    var p = new Pix(128, 104);
    var off = f % 2 ? 2 : 0;
    // pattes articulées (épaisses)
    function leg(x0, y0, kx, ky, x1, y1) {
      for (var t = -1; t <= 1; t++) { p.line(x0, y0 + t, kx, ky + t, P.n); p.line(kx + t, ky, x1 + t, y1, P.n); }
      p.line(x0, y0 - 2, kx, ky - 2, P.m);
      p.ell(kx, ky, 3, 3, P.M); p.put(kx - 1, ky - 1, P.m);
      p.line(x1, y1, x1 - 2, y1 + 4, P.m);
    }
    leg(60, 50, 34, 14 - off, 8, 40 + off); leg(62, 56, 30, 34 + off, 6, 74 - off);
    leg(66, 62, 40, 70 - off, 22, 98 + off); leg(72, 64, 60, 84 + off, 48, 102 - off);
    leg(80, 50, 104, 16 + off, 124, 40 - off); leg(84, 58, 112, 40 - off, 126, 72 + off);
    leg(84, 64, 104, 74 + off, 112, 100 - off); leg(78, 66, 84, 86 - off, 82, 102 + off);
    // abdomen blindé
    p.ell(84, 40, 30, 24, function (x, y, dx, dy) {
      if ((x + y * 3) % 17 === 0 && dy < 0.6) return P.m; // rivets
      if (Math.abs(dy + 0.15) < 0.06 || Math.abs(dx - 0.2) < 0.03) return P.n; // plaques
      return dy < -0.55 ? P.m : dy > 0.55 ? P.n : P.M;
    });
    // tête
    p.ell(50, 58, 20, 15, function (x, y, dx, dy) { return dy < -0.5 ? P.m : dy > 0.5 ? P.N : P.M; });
    // yeux rouges
    var eyes = [[38, 52, 3], [46, 49, 3.5], [55, 50, 3], [36, 59, 2], [44, 58, 2], [52, 58, 2]];
    for (var i = 0; i < eyes.length; i++) {
      var E = eyes[i]; p.ell(E[0], E[1], E[2], E[2], P.R); p.put(E[0] - 1, E[1] - 1, P.q);
    }
    // crochets
    p.tri(36, 68, 41, 68, 37, 80, P.m); p.tri(48, 70, 53, 70, 50, 82, P.m);
    // cœur rose : point faible
    var pulse = f % 2 ? 1 : 0;
    p.ell(80, 52, 8 + pulse, 8 + pulse, P.n);
    p.ell(80, 52, 6 + pulse, 6 + pulse, function (x, y, dx, dy) { return dx * dx + dy * dy < 0.25 ? P.q : P.P; });
    p.outline(P.K);
    return p;
  };

  // ---------- Projectiles ----------
  S.dragibus = function (f) {
    var p = new Pix(7, 6), c = [P.r, P.y, P.g, P.b, P.u, P.o][f % 6];
    p.ell(3.5, 3, 3, 2.4, c); p.put(2, 1, P.W); p.outline(P.K); return p;
  };
  S.jaw = function (f) {
    var p = new Pix(11, 11);
    p.ell(5.5, 5.5, 4.6, 4.6, function (x, y, dx, dy) {
      var a = Math.atan2(dy, dx) + f * 0.8, band = Math.floor((a / (Math.PI * 2) + 1) * 6) % 6;
      return dx * dx + dy * dy < 0.2 ? P.W : RB[band];
    });
    p.put(3, 3, P.W); p.outline(P.K); return p;
  };
  S.rainbow = function () {
    var p = new Pix(9, 13);
    for (var i = 0; i < 6; i++) p.ell(1, 6.5, 7.5 - i, 6.2 - i * 0.8, RB[i], function (x, y, dx) { return dx > 0; });
    p.ell(1, 6.5, 2, 1.6, [0, 0, 0, 0]);
    var q = new Pix(9, 13);
    for (var y = 0; y < 13; y++) for (var x = 0; x < 9; x++) {
      var i4 = (y * 9 + x) * 4; if (!p.d[i4 + 3]) continue;
      var dx = (x + 0.5 - 1) / 2, dy = (y + 0.5 - 6.5) / 1.6;
      if (dx * dx + dy * dy <= 1) continue;
      q.put(x, y, [p.d[i4], p.d[i4 + 1], p.d[i4 + 2], 255]);
    }
    return q;
  };
  S.web = function (f) {
    var p = new Pix(11, 11), c = alpha(P.s, 230);
    for (var a = 0; a < 8; a++) { var an = a * Math.PI / 4 + f * 0.3; p.line(5, 5, 5 + Math.cos(an) * 5, 5 + Math.sin(an) * 5, c); }
    p.ell(5.5, 5.5, 3, 3, alpha(P.s, 200), function (x, y, dx, dy) { return dx * dx + dy * dy > 0.55; });
    return p;
  };
  S.sugar = function () { var p = new Pix(5, 5); p.rect(0, 0, 4, 4, P.W); p.rect(0, 3, 4, 1, P.v); p.rect(3, 0, 1, 4, P.v); p.outline(P.K); return p; };
  S.crumb = function (f) { var p = new Pix(3, 3); p.rect(0, 0, 2, 2, [P.y, P.p, P.d][f % 3]); return p; };

  // ---------- Icônes du HUD ----------
  S.heart = function () {
    var p = new Pix(7, 6);
    p.rows(['.P.P.', 'PqPPP', 'PPPPP', '.PPP.', '..P..'], 1, 0); p.outline(P.K); return p;
  };
  S.icoVerm = function () { var p = new Pix(8, 7); p.line(1, 5, 3, 3, P.r); p.line(4, 5, 6, 3, P.y); p.line(2, 2, 4, 0, P.b); return p; };
  S.icoDrag = function () { var p = new Pix(8, 7); p.ell(2.5, 4, 2.2, 1.7, P.g); p.ell(5.5, 3, 2.2, 1.7, P.P); p.put(5, 2, P.W); return p; };
  S.icoJaw = function () { var p = new Pix(8, 7); p.ell(4, 3.5, 3, 3, function (x, y) { return RB[(x + y) % 6]; }); p.put(3, 2, P.W); return p; };
  S.icoRain = function () { var p = new Pix(9, 7); for (var i = 0; i < 4; i++) p.ell(4.5, 6, 4.5 - i, 5 - i, RB[i], function (x, y, dx, dy) { return dy < 0 && dx * dx + dy * dy > 0.45; }); return p; };

  // ---------- Bonus (bulles) ----------
  function bubble(rim, icon) {
    var p = new Pix(16, 16);
    p.ell(8, 8, 7.2, 7.2, function (x, y, dx, dy) {
      var r = dx * dx + dy * dy;
      if (r > 0.72) return rim;
      if (dx < -0.3 && dy < -0.3 && r > 0.35) return P.h;
      return alpha(rim, 70);
    });
    icon(p);
    return p;
  }
  S.bVerm = function () { return bubble(P.b, function (p) { p.line(4, 10, 6, 8, P.r); p.line(7, 11, 9, 9, P.y); p.line(9, 7, 11, 5, P.g); p.line(5, 6, 7, 4, P.W); }); };
  S.bDrag = function () { return bubble(P.g, function (p) { p.ell(6, 9, 2.4, 1.9, P.r); p.ell(10, 7, 2.4, 1.9, P.u); p.put(5, 8, P.W); p.put(9, 6, P.W); }); };
  S.bJaw = function () { return bubble(P.o, function (p) { p.ell(8, 8, 3.6, 3.6, function (x, y) { return RB[(x + y) % 6]; }); p.put(7, 6, P.W); }); };
  S.bLife = function () { return bubble(P.P, function (p) { p.rows(['.P.P.', 'PqPPP', 'PPPPP', '.PPP.', '..P..'], 6, 6); }); };
  S.bBomb = function () {
    return bubble(P.y, function (p) {
      p.ell(8, 10, 4, 1.8, P.W); p.ell(8, 8, 3, 1.6, P.W); p.ell(8, 6.2, 1.8, 1.3, P.W); p.put(8, 4, P.W);
      p.put(6, 10, P.v); p.put(9, 8, P.v); p.put(8, 5, P.r);
    });
  };
  S.bGhost = function () {
    return bubble(P.u, function (p) {
      p.rows(['.www.', 'wwwww', 'wKwKw', 'wwwww', 'wwwww', 'w.w.w'], 5, 4);
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
