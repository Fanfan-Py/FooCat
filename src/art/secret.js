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
      var src = FC.costumeCat(f, catId), p = new Pix(src.w, src.h), d = p.d; d.set(src.d);
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

  // ---------- récompenses des succès : soucoupes repeintes (glaçage ET beignet), costumes, pingouin ----------
  var RB = FC.RAINBOW;
  var same = function (d, i, c) { return d[i] === c[0] && d[i + 1] === c[1] && d[i + 2] === c[2]; };
  var dk = function (c, k) { return k ? FC.mix(c, P.K, k * 0.22) : c; };
  // pour chaque soucoupe : frost(x, y, k) pour le glaçage, dough(x, y, k) pour le beignet (k : 0 clair, 1 moyen, 2 foncé)
  FC.SAUCER_PATTERNS = {
    berlingot: { frost: function (x, y, k) { return k === 2 ? P.i : (x + y) % 6 < 3 ? P.W : col('ff7fb0'); },
      dough: function (x, y, k) { return dk(Math.floor(x / 3) % 3 === 0 ? col('fff0f6') : col('ff9cc8'), k); } },
    sucredorge: { frost: function (x, y, k) { return [col('b8f5cc'), P.g, P.G][k]; },
      dough: function (x, y, k) { return dk(Math.floor((x - y * 1.5 + 40) / 3) % 2 ? P.r : P.W, k); } },
    etoilee: { frost: function (x, y, k) { return [col('d6b8ff'), P.u, P.U][k]; },
      dough: function (x, y, k) { return (x * 7 + y * 13) % 17 === 0 ? P.y : [col('2b3db8'), col('1a2380'), col('0d1250')][k]; } },
    gourmande: { frost: function (x, y, k) { return [col('a8703f'), col('7b4a2a'), col('4a2614')][k]; },
      dough: function (x, y, k) { return (x * 5 + y * 3) % 9 === 0 ? RB[(x + y) % 6] : dk(col('f2c27a'), k); } },
    vagues: { frost: function (x, y, k) { return (y + Math.round(Math.sin(x * 0.7) * 1.2)) % 3 === 0 ? P.W : [col('c8f0ff'), P.b, P.B][k]; },
      dough: function (x, y, k) { return [col('f2d39a'), col('e0b070'), col('b8834a')][k]; } },
    cassedents: { frost: function (x, y, k) { return k === 0 ? P.W : dk(RB[Math.floor((x + y * 2) / 3) % 6], k - 1); },
      dough: function (x, y, k) { return dk(RB[Math.floor(x / 3) % 6], k * 0.8 + 0.2); } },
    pinata: { frost: function (x, y, k) { return dk(RB[Math.floor(x / 2) % 6], k ? 1 : 0); },
      dough: function (x, y, k) { return dk(Math.floor((x + y) / 2) % 2 ? P.P : col('ffd23f'), k); } },
  };
  FC.patternSaucer = function (base, id) {
    var pat = FC.SAUCER_PATTERNS[id], p = new Pix(base.w, base.h); p.d.set(base.d);
    var F = [P.P, P.q, P.i], D = [P.d, P.D, P.e];
    for (var i = 0; i < p.d.length; i += 4) {
      if (base.d[i + 3] < 255) continue;
      var x = (i / 4) % p.w, y = Math.floor(i / 4 / p.w), c = null;
      if (y < 17) continue; // le chat et le dôme ne changent pas
      for (var k = 0; k < 3 && !c; k++) {
        if (same(base.d, i, F[k])) c = pat.frost(x, y, [1, 0, 2][k]);
        else if (same(base.d, i, D[k])) c = pat.dough(x, y, k);
      }
      if (c) { p.d[i] = c[0]; p.d[i + 1] = c[1]; p.d[i + 2] = c[2]; }
    }
    return p;
  };
  // les costumes du chat : une couleur, et parfois un accessoire dessiné par-dessus
  function setCat(id, o) { FC.CATS[id] = Object.assign({}, FC.CATS.classic, o); }
  setCat('pirate', { name: 'PIRATE', fur: col('fbf3e8'), shade: col('d9c7a8') });
  setCat('dragon', { name: 'DRAGON', fur: col('6be38f'), shade: P.G, ear: col('ffd23f'), cheek: col('ff9a3c'), nose: P.G, mouth: col('1f6b3a'),
    mane: [P.r, P.o, P.y, P.o, P.r, P.y], tuft: [P.r, P.o, P.y, P.o], eyeLo: P.o });
  setCat('abeille', { name: 'ABEILLE', fur: col('ffd23f'), shade: col('d9a520'), ear: col('2a2233'), cheek: col('ff9a3c'), nose: P.K, mouth: P.K,
    mane: [P.K, P.y, P.K, P.y, P.K, P.y], tuft: [P.K, P.y, P.K, P.y] });
  setCat('arcenciel', { name: 'ARC-EN-CIEL', fur: col('fefefd'), shade: col('fdfcfb') });
  setCat('zebre', { name: 'ZÈBRE', fur: col('fffffe'), shade: col('d8d4e0'), mane: [P.K, P.W, P.K, P.W, P.K, P.W], tuft: [P.K, P.W, P.K, P.W] });
  setCat('guimauve', { name: 'GUIMAUVE', fur: col('ffd6e8'), shade: col('f5aecb'), ear: col('ff9cc8'), cheek: col('ff7fb0'), nose: P.P, mouth: col('c25a8a'),
    mane: [col('fff0f6'), col('ffd6e8'), col('ffc0dc'), col('ff9cc8'), col('ffc0dc'), col('fff0f6')], tuft: [col('fff0f6'), col('ffc0dc'), col('ff9cc8'), col('ffd6e8')],
    horn: [P.W, col('ffd6e8')], eye: col('7a3a6a'), eyeHi: P.W, eyeLo: P.P });
  var COSTUMES = { pirate: 1, dragon: 1, abeille: 1, arcenciel: 1, zebre: 1 };
  // le chat de cette couleur, avec son costume
  FC.costumeCat = function (f, id) {
    if (!COSTUMES[id]) return FC.catHero(f, id);
    return FC.mk('costume_' + id + '_' + f, function () {
      var base = FC.catHero(f, id), p = new Pix(base.w, base.h); p.d.set(base.d);
      // la couleur du pelage telle qu'on la voit à travers le verre du dôme
      var glass = function (c0) { var q = new Pix(1, 1); q.put(0, 0, c0); q.put(0, 0, alpha(P.c, 40)); return q.get(0, 0); };
      var fur = glass(FC.CATS[id].fur), sh = glass(FC.CATS[id].shade);
      var near = function (i, c0) { return Math.abs(base.d[i] - c0[0]) + Math.abs(base.d[i + 1] - c0[1]) + Math.abs(base.d[i + 2] - c0[2]) < 12; };
      for (var i = 0; i < p.d.length; i += 4) {
        var x = (i / 4) % p.w, y = Math.floor(i / 4 / p.w), c = null;
        if (y > 21 || !(near(i, fur) || near(i, sh))) continue;
        if (id === 'arcenciel') c = FC.mix(RB[Math.floor((y - 6) / 2) % 6], P.W, 0.35);
        if (id === 'zebre' && Math.floor(x + Math.sin(y * 0.9) * 1.2) % 4 === 0) c = col('2a2233');
        if (id === 'abeille' && (y === 10 || y === 11 || y === 17 || y === 18)) c = P.K;
        if (c) { p.d[i] = c[0]; p.d[i + 1] = c[1]; p.d[i + 2] = c[2]; }
      }
      if (id === 'pirate') { // bandana rouge à pois et bandeau sur l'œil
        p.rect(14, 9, 12, 2, P.r); p.put(16, 9, P.W); p.put(20, 10, P.W); p.put(23, 9, P.W);
        p.rect(25, 10, 2, 1, P.r); p.put(27, 11, P.r); p.put(26, 12, P.r);
        p.line(14, 12, 25, 11, P.K); p.rect(14, 12, 4, 4, P.K);
      }
      if (id === 'abeille') { p.line(16, 9, 14, 5, P.K); p.line(23, 9, 25, 5, P.K); p.put(14, 4, P.K); p.put(25, 4, P.K); p.put(13, 4, P.y); p.put(26, 4, P.y); }
      if (id === 'dragon') {
        p.tri(11, 12, 13, 12, 12, 9, P.G); p.tri(12, 15, 14, 15, 12.5, 12, P.G); // petites piques
        if (f % 2) { p.put(27, 15, alpha(P.v, 200)); p.put(28, 14, alpha(P.v, 160)); p.put(29, 13, alpha(P.v, 120)); } // petite fumée
      }
      return p;
    });
  };
  // le pingouin dans sa soucoupe macaron
  S.penguinHero = function (f) {
    var p = new Pix(40, 31), m1 = col('a8f0c8'), m2 = col('6bd69a'), m3 = col('3a9a6a');
    p.ell(19.5, 27.5, 17.5, 3.5, function (x, y, dx, dy) { return dy > 0.3 ? m3 : m2; }); // coque du dessous
    for (var x = 3; x < 37; x++) p.rect(x, 24, 1, 2, x % 3 ? col('fff6e0') : col('f2e2c0')); // la crème
    p.ell(19.5, 22.5, 18.5, 4.2, function (x, y, dx, dy) { return dy < -0.4 ? col('d8fbe6') : dy > 0.5 ? m2 : m1; }); // coque du dessus
    for (var k = 3; k < 37; k += 2) p.put(k, 26, m3); // la collerette
    dome(p, function (d) {
      var bob = f % 2;
      d.ell(19.5, 13 + bob, 7, 6, col('1e1a2e')); // la tête noire
      d.ell(19.5, 15 + bob, 5, 4.4, P.W); // le visage blanc
      if (f % 4 === 3) { d.rect(16, 13 + bob, 2, 1, P.K); d.rect(22, 13 + bob, 2, 1, P.K); }
      else { d.rect(16, 12 + bob, 2, 2, P.K); d.rect(22, 12 + bob, 2, 2, P.K); d.put(16, 12 + bob, P.W); d.put(22, 12 + bob, P.W); }
      d.tri(18, 15 + bob, 21, 15 + bob, 19.5, 17.5 + bob, P.o); // le bec
      d.put(15, 15 + bob, P.p); d.put(24, 15 + bob, P.p);
      d.rect(13, 19 + bob, 14, 2, P.r); d.rect(24, 20 + bob, 2, 2, P.r); // l'écharpe
    });
    p.outline(P.K);
    return p;
  };

  // ---------- la guimauve géante (boss de l'invasion, toutes les 10 vagues) ----------
  // hurt : 0, 1 ou 2 (elle se fait croquer à mesure qu'elle perd de la vie)
  FC.giantMallow = function (f, hurt) {
    return FC.mk('mallow' + f + '_' + hurt, function () {
      var p = new Pix(72, 70), sq = f % 2;
      var pink = col('ffe4f0'), mid = col('ffc7de'), deep = col('f59cc2'), top = 22 + sq, bot = 54;
      p.ell(24, 61, 6, 3.5, deep); p.ell(48, 61, 6, 3.5, deep); // les pieds
      p.ell(8, 40, 4, 6, mid); p.ell(64, 38 - sq, 4, 6, mid); // les bras
      p.rect(66, 10, 2, 30, P.W); // le sceptre-sucette
      p.ell(67, 9, 6, 6, function (x, y, dx, dy) { return Math.floor((Math.atan2(dy, dx) + Math.sqrt(dx * dx + dy * dy) * 4) * 1.6) % 2 ? P.r : P.W; });
      for (var x = 9; x <= 63; x++) { var dx = (x - 36) / 27; p.rect(x, top, 1, bot - top, dx < -0.45 ? mid : dx > 0.55 ? deep : pink); } // le corps
      p.ell(36, bot, 27.5, 8, function (x, y, dx, dy) { return dy > 0 ? deep : (dx < -0.45 ? mid : dx > 0.55 ? deep : pink); });
      p.ell(36, top, 27.5, 8, function (x, y, dx, dy) { var a = Math.atan2(dy * 3, dx) + Math.sqrt(dx * dx + dy * dy) * 7; return Math.sin(a) > 0.55 ? mid : P.W; });
      if (hurt > 0) { // croquée
        for (var yy = 0; yy < p.h; yy++) for (var xx = 0; xx < p.w; xx++) {
          var a1 = (xx - 12) / 6, b1 = (yy - top - 3) / 5, a2 = (xx - 16) / 4, b2 = (yy - top - 1) / 3, a3 = (xx - 60) / 5, b3 = (yy - top - 14) / 6;
          if (a1 * a1 + b1 * b1 < 1 || a2 * a2 + b2 * b2 < 1 || (hurt > 1 && a3 * a3 + b3 * b3 < 1)) { var j = (yy * p.w + xx) * 4; p.d[j + 3] = 0; }
        }
      }
      p.rect(23, top - 12, 26, 7, P.Y); p.rect(23, top - 12, 26, 1, P.y); p.rect(23, top - 6, 26, 1, P.j); // la couronne
      p.tri(23, top - 12, 29, top - 12, 24, top - 19, P.Y); p.tri(33, top - 12, 39, top - 12, 36, top - 21, P.Y); p.tri(43, top - 12, 49, top - 12, 48, top - 19, P.Y);
      p.ell(36, top - 9, 2, 2, P.r); p.rect(28, top - 9, 2, 1, P.b); p.rect(43, top - 9, 2, 1, P.g);
      var ey = top + 12; // le visage en colère
      p.ell(26, ey, 5, 5, P.W); p.ell(46, ey, 5, 5, P.W);
      p.rect(25, ey, 3, 3, P.K); p.rect(45, ey, 3, 3, P.K); p.put(25, ey, P.W); p.put(45, ey, P.W);
      p.line(19, ey - 7, 30, ey - 4, P.K); p.line(19, ey - 6, 30, ey - 3, P.K);
      p.line(53, ey - 7, 42, ey - 4, P.K); p.line(53, ey - 6, 42, ey - 3, P.K);
      p.ell(36, ey + 12, 10, 5, P.K, function (x, y, dx, dy) { return dy > -0.2; });
      for (var t2 = 0; t2 < 5; t2++) p.rect(28 + t2 * 4, ey + 11, 3, 2, P.W);
      p.ell(17, ey + 6, 3, 2, alpha(P.P, 140)); p.ell(55, ey + 6, 3, 2, alpha(P.P, 140));
      return p.outline(P.K);
    });
  };
  // la capsule cœur (rare) du casse-bonbons
  FC.heartCapsule = function (scr, x, y, t) {
    scr.rect(x, y, 14, 7, P.P); scr.rect(x, y, 14, 1, P.W); scr.rect(x, y + 6, 14, 1, P.i);
    scr.rows(['.W.W.', 'WWWWW', '.WWW.', '..W..'], x + 5, y + 1);
    if (Math.floor(t * 6) % 2) { scr.put(x - 2, y - 1, P.W); scr.put(x + 15, y + 7, P.W); }
  };
})(typeof window !== 'undefined' ? window : globalThis);
