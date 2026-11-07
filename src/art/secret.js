/* FooCat – récompenses secrètes (débloquées avec un code) : personnages spéciaux, soucoupe disco,
   petit compagnon, monstres de l'invasion des bonbons, briques du casse-bonbons */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, S = FC.S, alpha = FC.alpha, col = FC.col;
  var spr = function (n, f) { return FC.spr(n, f || 0); };

  // le dôme de verre, posé sur le vaisseau (comme celui du chat licorne)
  function dome(p, inside) {
    var d = new Pix(40, 31);
    inside(d);
    d.ell(19.5, 19.5, 11, 17, function (x, y, dx, dy) {
      var r = dx * dx + dy * dy;
      if (dx > -0.78 && dx < -0.58 && dy > -0.78 && dy < -0.3) return P.h;
      if (dx > 0.3 && dx < 0.5 && dy > -0.92 && dy < -0.8) return P.h;
      return r > 0.84 ? P.C : alpha(P.c, 40);
    });
    for (var y = 0; y <= 21; y++) for (var x = 0; x < 40; x++) {
      var i = (y * 40 + x) * 4; if (!d.d[i + 3]) continue;
      p.put(x, y, [d.d[i], d.d[i + 1], d.d[i + 2], d.d[i + 3]]);
    }
  }

  // ---------- le roi crapaud dans sa cacahuète spatiale ----------
  var PEA = { l: col('f2d39a'), m: col('e0b070'), d: col('b8834a'), t: col('c99a5c') };
  S.toadHero = function (f) {
    var p = new Pix(40, 31);
    p.ell(19.5, 22.5, 5, 3.2, PEA.m); // la taille fine entre les deux bosses
    [[9.5, 23], [29.5, 23]].forEach(function (c) {
      p.ell(c[0], c[1], 9.8, 7.6, function (x, y, dx, dy) {
        if ((x + y) % 4 === 0 || (x - y + 40) % 4 === 0) return dy > 0.5 ? PEA.d : PEA.t; // le quadrillage de la coque
        return dy < -0.45 ? PEA.l : dy > 0.5 ? PEA.d : PEA.m;
      });
    });
    dome(p, function (d) {
      var g = col('5cc95c'), g2 = col('3a9a4a'), g3 = col('2e6b34');
      d.ell(15.5, 11.5, 2.8, 2.6, g); d.ell(23.5, 11.5, 2.8, 2.6, g); // les bosses des yeux
      d.ell(19.5, 16, 7.5, 4.8, function (x, y, dx, dy) { return dy > 0.5 ? g2 : g; }); // la tête
      if (f % 4 === 3) { d.rect(14, 11, 3, 1, P.K); d.rect(22, 11, 3, 1, P.K); } // il cligne des yeux
      else { d.rect(14, 10, 3, 3, P.W); d.rect(22, 10, 3, 3, P.W); d.rect(15, 11, 2, 2, P.K); d.rect(23, 11, 2, 2, P.K); }
      d.line(15, 17, 24, 17, g3); d.put(14, 16, g3); d.put(25, 16, g3); // le grand sourire
      d.put(16, 15, P.p); d.put(23, 15, P.p); // les joues
      // la couronne d'or
      d.rect(15, 6, 10, 3, P.Y); d.rect(15, 6, 10, 1, P.y);
      d.tri(15, 6, 17.5, 6, 15.5, 2.5, P.Y); d.tri(18.5, 6, 21, 6, 19.75, 1.5, P.Y); d.tri(22.5, 6, 25, 6, 24.5, 2.5, P.Y);
      d.put(19, 7, P.R); d.put(20, 7, P.R); d.put(16, 7, P.b); d.put(23, 7, P.g);
    });
    p.outline(P.K);
    for (var k = 0; k < 5; k++) p.put(6 + k * 7, 27, (k + f) % 2 ? P.y : P.a); // hublots
    return p;
  };

  // ---------- le fantôme dans sa citrouille spatiale ----------
  S.ghostHero = function (f) {
    var p = new Pix(40, 31), o1 = col('ff9a3c'), o2 = col('e8761f'), o3 = col('b8551a'), glow = f % 2 ? col('ffd23f') : col('fff3b0');
    p.ell(19.5, 23.5, 18.5, 6.8, function (x, y, dx, dy) {
      if (dy > 0.55) return o3;
      if (dy < -0.6) return col('ffb866');
      return Math.floor((dx + 1) * 5) % 2 ? o1 : o2; // les côtes de la citrouille
    });
    // le visage sculpté à l'avant, qui brille
    p.tri(28, 23, 31, 23, 29.5, 20.5, glow); p.tri(33, 23, 36, 23, 34.5, 20.5, glow);
    for (var m = 0; m < 4; m++) p.rect(28 + m * 2, 25 + (m % 2), 2, 1, glow);
    // la tige et sa feuille, à l'arrière
    p.rect(2, 18, 2, 3, P.G); p.ell(4.5, 17, 2.5, 1.2, P.g);
    dome(p, function (d) {
      var bob = f % 2, w = col('f6effa');
      d.ell(19.5, 12 + bob, 6.5, 6, w); d.rect(13, 12 + bob, 13, 8, w); // le corps
      for (var k = 0; k < 4; k++) d.ell(14.5 + k * 3.3, 20 + bob, 1.6, 1.4, w); // le bas en vagues
      d.ell(12.5, 15 + bob, 1.6, 2, w); d.ell(26.5, 14 + bob, 1.6, 2, w); // les petits bras
      d.rect(16, 10 + bob, 2, 3, P.K); d.rect(21, 10 + bob, 2, 3, P.K); // les yeux
      d.ell(19.5, 15.5 + bob, 1.4, 1.2, P.K); // la bouche « ouh ! »
      d.put(15, 14 + bob, P.p); d.put(24, 14 + bob, P.p);
    });
    p.outline(P.K);
    return p;
  };

  // ---------- la soucoupe disco (boule à facettes), pour chaque couleur de chat ----------
  var DISCO = [col('e8ecf5'), col('b8c0d4'), col('8a93ad'), col('ffffff')];
  FC.discoHero = function (f, catId) {
    return FC.mk('disco_' + catId + '_' + f, function () {
      var src = FC.catHero(f, catId), p = new Pix(src.w, src.h), d = p.d; d.set(src.d);
      var from = [P.P, P.q, P.i, P.d, P.D, P.e], same = function (i, c) { return src.d[i] === c[0] && src.d[i + 1] === c[1] && src.d[i + 2] === c[2]; };
      for (var i = 0; i < d.length; i += 4) {
        if (src.d[i + 3] < 255) continue;
        var y = Math.floor(i / 4 / p.w);
        if (y < 18 || !from.some(function (c) { return same(i, c); })) continue; // seulement la soucoupe (pas le chat)
        var x = (i / 4) % p.w, tile = Math.floor(x / 3) + Math.floor(y / 2) * 7;
        var c = DISCO[(tile + (y > 24 ? 2 : 0)) % 3];
        if ((tile * 7 + f * 3) % 13 === 0) c = DISCO[3]; // une facette qui brille
        if ((tile * 5 + f) % 17 === 0) c = (tile % 2) ? P.p : P.b; // reflets de couleur
        if (x % 3 === 2 || y % 2 === 1) c = FC.mix(c, P.K, 0.25); // les joints entre les facettes
        d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2];
      }
      if (f % 2) { p.put(3, 20, P.W); p.put(2, 21, alpha(P.W, 160)); p.put(4, 21, alpha(P.W, 160)); } // étincelle
      return p;
    });
  };

  // ---------- le petit compagnon : une papillote volante ----------
  S.companion = function (f) {
    var p = new Pix(18, 14);
    p.rect(8, 1, 2, 3, P.M); p.rect(f % 2 ? 4 : 6, 0, f % 2 ? 10 : 6, 1, P.m); // l'hélice
    p.tri(1, 5, 1, 12, 5, 8.5, P.y); p.tri(17, 5, 17, 12, 13, 8.5, P.y); // les papillotes
    p.ell(9, 8.5, 4.6, 4.2, function (x, y, dx, dy) { return dx < -0.3 && dy < -0.3 ? P.W : (Math.floor((x + y) / 2) % 2 ? P.u : P.b); });
    p.rect(7, 7, 1, 2, P.K); p.rect(10, 7, 1, 2, P.K); p.put(8, 10, P.K); p.put(9, 10, P.K);
    return p.outline(P.K);
  };

  // ---------- les monstres de l'invasion des bonbons (ils descendent) ----------
  S.invBerlingot = function (f) { // berlingot en colère
    var p = new Pix(15, 13);
    p.tri(0.5, 1, 14.5, 1, 7.5, 12.5, function (x, y) { return Math.floor((x + y + f) / 2) % 2 ? P.P : P.q; });
    p.rect(4, 4, 2, 2, P.W); p.rect(9, 4, 2, 2, P.W); p.put(5, 5, P.K); p.put(9, 5, P.K);
    p.line(4, 3, 6, 4, P.K); p.line(11, 3, 9, 4, P.K); p.line(6, 8, 8, 8, P.K);
    return p.outline(P.K);
  };
  S.invGuimauve = function (f) { // guimauve qui grogne, avec des petites pattes
    var p = new Pix(14, 14), off = f % 2;
    p.rect(1, 1, 12, 10, col('ffe0ef')); p.rect(1, 1, 12, 2, P.W); p.rect(1, 9, 12, 2, col('f5b8d2'));
    p.rect(3, 4, 2, 2, P.K); p.rect(9, 4, 2, 2, P.K); p.put(3, 4, P.W); p.put(9, 4, P.W);
    p.rect(5, 7, 4, 1, P.K); p.put(5, 6, P.W); p.put(8, 6, P.W); // dents
    p.rect(2 + off, 11, 2, 2, col('f5b8d2')); p.rect(10 - off, 11, 2, 2, col('f5b8d2'));
    return p.outline(P.K);
  };
  S.invReglisse = function (f) { // roue de réglisse qui tourne
    var p = new Pix(15, 15), a0 = f * 0.8;
    p.ell(7.5, 7.5, 7, 7, function (x, y, dx, dy) {
      var a = Math.atan2(dy, dx) + Math.sqrt(dx * dx + dy * dy) * 6 + a0;
      return Math.sin(a) > 0 ? P.x : col('3a3a6a');
    });
    p.ell(7.5, 7.5, 2.4, 2.4, P.P);
    p.rect(4, 5, 2, 2, P.W); p.rect(9, 5, 2, 2, P.W); p.put(5, 6, P.K); p.put(9, 6, P.K);
    return p.outline(P.K);
  };
  S.invDrop = function (f) { var p = new Pix(5, 7); p.ell(2.5, 4, 2, 2.5, f % 2 ? P.g : P.b); p.put(2, 3, P.W); return p.outline(P.K); };

  // les lettres « FANFAN PY » (pour le bouclier en morceaux de sucre)
  FC.shieldText = function () { return FC.mk('shieldText', function () { var t = new Pix(48, 6); FC.text(t, 'FANFAN PY', 0, 0, P.W); return t; }); };

  // étoiles qui descendent (on avance vers le haut)
  FC.starsDown = function (n, seed, w, h) {
    var R = FC.rng(seed), L = [];
    for (var i = 0; i < n; i++) L.push([R() * w, R() * h, 8 + R() * 40, R() < 0.2]);
    return L;
  };
  FC.drawStarsDown = function (scr, L, t) {
    L.forEach(function (s) { var y = (s[1] + t * s[2]) % scr.h; scr.put(s[0], y, s[3] ? P.W : alpha(P.v, 160)); if (s[3]) scr.put(s[0], y - 1, alpha(P.W, 120)); });
  };

  // ---------- les briques du casse-bonbons ----------
  var BRICK = {
    choc: [col('7b4a2a'), col('a8703f'), col('4a2614')], fraise: [P.P, P.q, P.i], menthe: [P.g, col('b8f5cc'), P.G],
    citron: [P.y, col('fff3b0'), P.Y], sucre: [P.W, P.W, P.v], caramel: [P.Y, P.y, P.j],
    reglisse: [col('46365e'), col('9a88ba'), col('1e1530')],
  };
  // la brique de réglisse : 3 coups (des fissures apparaissent)
  function reglisse(scr, x, y, w, h, hp) {
    var c = BRICK.reglisse;
    scr.rect(x, y, w, h, c[0]); scr.rect(x, y, w, 1, c[1]); scr.rect(x, y + h - 1, w, 1, c[2]);
    scr.rect(x, y, 1, h, c[1]); scr.rect(x + w - 1, y, 1, h, c[2]);
    for (var k = 2; k < w - 1; k += 3) scr.put(x + k, y + Math.floor(h / 2), P.p); // une ligne de sucre rose
    if (hp < 3) scr.line(x + 2, y + 1, x + 4, y + h - 2, P.v);
    if (hp < 2) scr.line(x + w - 3, y + 1, x + w - 5, y + h - 2, P.v);
  }
  // petite brique (11 x 5) pour écrire des mots
  FC.miniBrick = function (scr, x, y, kind, t, hp) {
    var w = 11, h = 5;
    if (kind === 'reglisse') return reglisse(scr, x, y, w, h, hp);
    var c = BRICK[kind];
    scr.rect(x, y, w, h, c[0]); scr.rect(x, y, w, 1, c[1]); scr.rect(x, y + h - 1, w, 1, c[2]); scr.rect(x + w - 1, y, 1, h, c[2]);
    if (kind === 'caramel' && Math.floor(t * 3 + x) % 7 === 0) scr.rect(x + 2, y + 1, 3, 1, P.W);
    if (kind === 'sucre' && hp === 1) scr.line(x + 4, y + 1, x + 6, y + 3, P.v);
  };
  // une trappe en haut de l'écran (k : ouverture, de 0 fermée à 1 ouverte)
  FC.hatch = function (scr, x, k) {
    for (var xx = -13; xx < 13; xx++) scr.rect(x + xx, 14, 1, 6, Math.floor((xx + 20) / 3) % 2 ? P.Y : P.x); // cadre rayé
    scr.rect(x - 13, 19, 26, 1, P.K);
    var w = Math.round(10 * (1 - k));
    scr.rect(x - 10, 15, 20, 4, P.K);
    scr.rect(x - 10, 15, w, 4, P.M); scr.rect(x + 10 - w, 15, w, 4, P.M); // les deux portes qui glissent
    if (w) { scr.rect(x - 10, 15, w, 1, P.m); scr.rect(x + 10 - w, 15, w, 1, P.m); }
    if (k > 0.3) for (var g = 0; g < 8; g++) scr.rect(x - 8, 20 + g, 16, 1, alpha(P.y, 50 - g * 6));
    scr.put(x - 14, 16, k > 0 ? P.R : P.g); scr.put(x + 13, 16, k > 0 ? P.R : P.g); // lampes : rouges quand ça s'ouvre
  };
  FC.brickColor = function (kind) { return BRICK[kind][0]; };
  FC.brick = function (scr, x, y, kind, t, cracked, hp) {
    var c = BRICK[kind], w = 22, h = 9;
    if (kind === 'reglisse') return reglisse(scr, x, y, w, h, hp == null ? 3 : hp);
    scr.rect(x, y, w, h, c[0]); scr.rect(x, y, w, 1, c[1]); scr.rect(x, y + h - 1, w, 1, c[2]); scr.rect(x + w - 1, y, 1, h, c[2]);
    if (kind === 'choc') { scr.rect(x + 11, y + 1, 1, h - 2, c[2]); scr.rect(x + 3, y + 3, 5, 3, c[1]); scr.rect(x + 14, y + 3, 5, 3, c[1]); } // carrés de chocolat
    if (kind === 'caramel' && Math.floor(t * 3 + x) % 5 === 0) scr.rect(x + 3, y + 2, 4, 1, P.W); // il brille (incassable)
    if (kind === 'sucre' && cracked) { scr.line(x + 6, y + 1, x + 10, y + 5, P.v); scr.line(x + 10, y + 5, x + 8, y + 8, P.v); }
    if (kind === 'fraise' || kind === 'menthe' || kind === 'citron') for (var k = 0; k < 3; k++) scr.put(x + 4 + k * 7, y + 4, c[1]); // sucre en grains
  };

  // ---------- une image deux fois plus petite (les boss du mode boss) ----------
  FC.half = function (src) {
    var o = new Pix(Math.ceil(src.w / 2), Math.ceil(src.h / 2));
    for (var y = 0; y < o.h; y++) for (var x = 0; x < o.w; x++) {
      var best = null;
      for (var k = 0; k < 4 && !best; k++) { var sx = x * 2 + (k % 2), sy = y * 2 + (k >> 1); if (sx < src.w && sy < src.h && src.on(sx, sy)) best = src.get(sx, sy); }
      if (best) o.put(x, y, best);
    }
    return o;
  };
  FC.bossIcons = function () { return FC.mk('bossIcons', function () { return [FC.half(spr('boss', 0)), FC.half(spr('skelBoss', 0)), FC.half(FC.fireScorp('fire', 0))]; }); };
})(typeof window !== 'undefined' ? window : globalThis);
