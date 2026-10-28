/* FooCat – le monde Vulcano (niveaux 11 à 16) : décors, ennemis, Scorpion volant de feu, histoires en BD
   (repris des maquettes validées le 28 octobre 2026) */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, S = FC.S, alpha = FC.alpha, col = FC.col, RB = FC.RAINBOW, mix = FC.mix;
  var spr = function (n, f) { return FC.spr(n, f || 0); };
  // lave : blanc brûlant, jaune, orange, rouge, rouge sombre, presque noir
  var LV = { w: col('fff3b0'), y: col('ffd23f'), o: col('ff9a3c'), r: col('ff4d2e'), d: col('b3201a'), k: col('5a0f12') };
  // roche volcanique
  var RK = { l: col('6b4a48'), m: col('3e2c30'), d: col('261a20'), k: col('150c12') };
  var BONE = col('efe6c8'), BONE2 = col('b8a46a'), GREEN = col('3dff7a');

  function center(scr, s, y, c, o, cx) { FC.text(scr, s, Math.round((cx == null ? scr.w / 2 : cx) - FC.textWidth(s, (o && o.sc) || 1) / 2), y, c, o || {}); }
  function wx(x0, sp, t, span, off) { span = span || 400; off = off || 40; return ((x0 - sp * t) % span + span) % span - off; }
  function lavaCol(v) { return v > 0.85 ? LV.w : v > 0.65 ? LV.y : v > 0.45 ? LV.o : v > 0.25 ? LV.r : LV.d; }

  // ---------- ennemis (ils regardent vers la gauche) ----------
  // sorbet volant : une soucoupe en cornet de glace
  S.sorbet = function (f) {
    var p = new Pix(24, 24);
    p.tri(5, 10, 19, 10, 12, 22, col('e0a050'));
    for (var k = 0; k < 4; k++) { p.line(6 + k * 3, 11, 10 + k * 1.5, 19, col('b07830')); p.line(18 - k * 3, 11, 14 - k * 1.5, 19, col('b07830')); }
    p.ell(12, 8, 8, 5.5, function (x, y, dx, dy) { return dx < -0.3 && dy < -0.3 ? P.W : dy > 0.5 ? P.p : P.q; });
    for (var d = 0; d < 4; d++) p.rect(6 + d * 4, 12, 2, 1 + ((d + f) % 2), P.q); // la glace qui coule
    p.put(12, 2, P.r); p.put(12, 1, P.g); // cerise
    p.rect(8, 7, 2, 2, P.K); p.rect(14, 7, 2, 2, P.K); p.put(8, 7, P.W); p.put(14, 7, P.W);
    p.outline(P.K);
    p.ell(12, 22.5, 2 + (f % 2), 1.5, alpha(col('bff3ff'), 170)); // petit nuage glacé sous la pointe
    return p;
  };
  S.sorbetBall = function (f) {
    var p = new Pix(8, 8), c = f % 2 ? col('9dffc8') : P.q;
    p.ell(4, 4, 3.2, 3.2, c); p.put(3, 2, P.W); p.put(5, 6, mix(c, P.K, 0.25));
    return p.outline(P.K);
  };
  // éclaireur du Scorpion : petit vaisseau fuselé, pinces de métal à l'avant, queue de scorpion recourbée sur le dos
  S.scout = function (f) {
    var p = new Pix(30, 18), b = new Pix(30, 18), M = P.m, Md = P.M;
    // ailerons de métal (dessus et dessous)
    b.tri(13, 8, 19, 8, 21, 3, Md); b.tri(13, 12, 19, 12, 21, 16, Md); b.line(15, 7, 20, 4, M); b.line(15, 13, 20, 15, M);
    // corps fuselé, pointe à gauche, plaques
    b.ell(13, 10, 10, 3.6, function (x, y, dx, dy) {
      if (x % 5 === 0 && dx > -0.6) return RK.k;
      return dy < -0.45 ? LV.r : dy > 0.45 ? RK.d : LV.d;
    });
    b.line(5, 9, 20, 9, alpha(LV.o, 200)); // reflet
    // œil-cockpit qui brille
    b.ell(7, 9.5, 2.3, 1.7, LV.y); b.put(6, 9, P.W);
    // pinces de métal à l'avant
    b.line(4, 8, 1, 6, M); b.line(1, 6, 3, 4, M); b.line(4, 12, 1, 14, M); b.line(1, 14, 3, 16, M);
    // queue en segments qui passe au-dessus du dos, dard vers l'avant
    var seg = [[22, 8], [24, 6], [25, 3.5], [23.5, 1.5], [20.5, 1.2], [17.8, 1.6]];
    for (var k = 0; k < seg.length; k++) b.ell(seg[k][0], seg[k][1] + (k > 2 ? (f % 2) * 0.5 : 0), 1.7, 1.5, k % 2 ? LV.r : LV.d);
    b.tri(16.5, 0.4, 16.5, 3, 13.2, 2, LV.y); b.put(14, 2, P.W);
    b.outline(P.K);
    // flamme du réacteur, derrière
    var fl = 2 + (f % 2) * 2;
    p.rect(23, 9, fl + 2, 3, alpha(LV.o, 230)); p.rect(23, 10, fl, 1, LV.y); p.put(24 + fl + 1, 10, alpha(LV.r, 160));
    p.blit(b, 0, 0);
    return p;
  };
  // chauve-souris de braise
  S.emberBat = function (f) {
    var p = new Pix(24, 17), up = f % 2 === 0, wing = RK.d, edge = LV.r;
    if (up) { p.tri(10, 7, 0, 0, 6, 13, wing); p.tri(14, 7, 24, 0, 18, 13, wing); p.line(0, 0, 9, 7, edge); p.line(23, 0, 15, 7, edge); }
    else { p.tri(10, 11, 0, 16, 4, 5, wing); p.tri(14, 11, 24, 16, 20, 5, wing); p.line(0, 16, 9, 11, edge); p.line(23, 16, 15, 11, edge); }
    p.ell(12, 9, 4.5, 4.5, LV.d); p.ell(12, 10.5, 2.4, 2.2, LV.o); p.put(12, 10, LV.y);
    p.tri(9, 6, 10, 2, 11, 6, LV.d); p.tri(13, 6, 14, 2, 15, 6, LV.d);
    p.put(10, 8, LV.y); p.put(14, 8, LV.y);
    return p.outline(P.K);
  };
  // dragonnet
  S.dragonet = function (f) {
    var p = new Pix(34, 22), up = f % 2 === 0;
    // aile sur le dos
    if (up) p.tri(14, 9, 25, 0, 23, 11, LV.o); else p.tri(14, 9, 27, 13, 22, 9, LV.o);
    p.line(14, 9, up ? 25 : 27, up ? 0 : 13, LV.d);
    // queue
    p.line(22, 13, 28, 12, LV.d); p.line(28, 12, 31, 8, LV.d); p.tri(30, 5, 33, 8, 29, 9, LV.y);
    p.ell(17, 13, 7.5, 4.5, function (x, y, dx, dy) { return dy > 0.3 ? LV.y : col('d9381e'); });
    p.ell(7, 10, 5, 4, col('d9381e'));
    p.rect(1, 10, 4, 3, col('d9381e')); p.put(1, 12, LV.k); // museau
    p.tri(7, 6, 9, 2, 10, 7, LV.y); // corne
    p.put(6, 9, LV.y); p.put(7, 9, P.K);
    p.line(14, 17, 13, 20, LV.d); p.line(20, 17, 21, 20, LV.d); // pattes
    return p.outline(P.K);
  };
  // souffle de feu horizontal (vers la gauche), longueur len
  FC.fireJet = function (scr, x, y, len, t, warn) {
    if (warn) { for (var w = 0; w < 4; w++) scr.ell(x - 2 - w * 3, y + Math.sin(t * 20 + w) * 1.5, 1.5, 1.5, alpha(RK.l, 180)); return; }
    for (var k = 0; k < len; k++) {
      var q = k / len, r = 1.5 + q * 6 + Math.sin(t * 30 + k * 0.7) * 1.2;
      scr.ell(x - k, y + Math.sin(t * 25 + k * 0.4) * q * 2, r, r * 0.8, alpha(lavaCol(1 - q * 0.9), Math.round(240 * (1 - q * 0.6))));
    }
  };
  // salamandre
  S.salamander = function (f) {
    var p = new Pix(30, 13), off = f % 2;
    for (var l = 0; l < 4; l++) { var lx = 7 + l * 5; p.line(lx, 8, lx - 2 + ((l + off) % 2) * 4, 12, LV.d); }
    p.line(22, 7, 26, 8, col('ff6a2a')); p.line(26, 8, 29, 6, col('ff6a2a'));
    p.ell(14, 7, 9, 3.5, function (x, y, dx, dy) { return ((x * 3 + y * 5) % 7 === 0) ? P.K : dy < -0.3 ? LV.o : col('ff6a2a'); });
    p.ell(4, 6.5, 4, 3, col('ff6a2a'));
    p.put(3, 5, LV.y); p.put(3, 6, P.K);
    for (var s = 0; s < 4; s++) p.put(9 + s * 3, 3 - ((s + off) % 2), LV.y); // crête de flammes
    return p.outline(P.K);
  };
  // goutte de feu (crachée en cloche)
  S.fireDrop = function (f) { var p = new Pix(6, 7); p.tri(3, 0, 0.5, 5, 5.5, 5, LV.o); p.ell(3, 4.5, 2.2, 2.2, f % 2 ? LV.y : LV.o); p.put(2, 4, LV.w); return p; };
  // tête du serpent de magma
  S.magmaHead = function (f) {
    var p = new Pix(14, 12);
    p.ell(7, 6, 6, 5, function (x, y) { return (x * 7 + y * 3) % 6 === 0 ? LV.k : lavaCol(0.55 + ((x + y + f) % 3) * 0.1); });
    p.rect(1, 6, 4, 2 + (f % 2), LV.k); // gueule ouverte
    p.put(4, 3, P.W); p.put(5, 3, P.K);
    return p.outline(P.K);
  };
  // le serpent de magma jaillit de la lave en arc (ph : 0 à 1), de (x0, y0) vers la gauche
  FC.magmaSnake = function (scr, x0, y0, ph, t, span, hgt) {
    span = span || 70; hgt = hgt || 70; var n = 9;
    for (var k = n; k >= 0; k--) {
      var q = Math.max(0, Math.min(1, ph - k * 0.035));
      var x = x0 - q * span, y = y0 - Math.sin(q * Math.PI) * hgt;
      if (q <= 0 || q >= 1) continue;
      if (k === 0) { scr.blit(spr('magmaHead', Math.floor(t * 6)), x - 7, y - 6); continue; }
      var r = 6 - k * 0.4;
      scr.ell(x, y, r + 1, r + 1, P.K); scr.ell(x, y, r, r, k % 2 ? col('ff6a2a') : LV.r); scr.put(x, y - 1, LV.y); scr.put(x + 1, y - 1, LV.y);
    }
    // éclaboussures à la sortie et à l'entrée
    if (ph < 0.25 || ph > 0.75) for (var s = 0; s < 6; s++) scr.put(x0 - (ph > 0.75 ? span : 0) + (s - 3) * 3, y0 - 2 - ((s * 7 + Math.floor(t * 20)) % 6), s % 2 ? LV.y : LV.o);
  };
  // luciole de feu
  S.firefly = function (f) {
    var p = new Pix(11, 10);
    p.ell(5.5, 5, 5, 4.5, alpha(LV.y, 70 + (f % 2) * 50));
    p.ell(3.5, 5, 1.6, 1.4, LV.d); p.ell(6.5, 5.5, 2.4, 2, f % 2 ? LV.w : LV.y); p.put(6, 5, LV.w);
    p.put(3, 3, alpha(P.W, 200)); p.put(5, 3, alpha(P.W, 200));
    return p;
  };
  // mini-scorpion volant
  function miniScorp(f, c1, c2, eye) {
    var p = new Pix(24, 18);
    p.ell(11, 5, 5, 2 + (f % 2), alpha(P.W, 110)); p.ell(15, 4, 4, 1.5 + (f % 2), alpha(P.W, 90)); // ailes
    p.ell(11, 11, 5.5, 3.2, c1); p.ell(5, 11, 3.2, 2.8, c2);
    p.ell(1.5, 8, 1.8, 1.4, c1); p.ell(1.5, 14, 1.8, 1.4, c1); p.line(3, 9, 4, 10, c2); p.line(3, 13, 4, 12, c2); // pinces
    p.ell(17, 9, 2, 2, c1); p.ell(20, 6, 1.8, 1.8, c1); p.ell(19, 3, 1.6, 1.6, c1); // queue qui remonte
    p.tri(17, 1, 18, 4, 14, 3, P.y); // dard
    p.put(4, 10, eye); p.put(6, 10, eye);
    return p.outline(P.K);
  }
  S.miniScorp = function (f) { return miniScorp(f, col('d9381e'), LV.d, LV.y); };
  S.miniScorpSkel = function (f) { return miniScorp(f, BONE, BONE2, GREEN); };
  // phénix-poussin et ses cendres
  S.phoenix = function (f) {
    var p = new Pix(20, 19), up = f % 2;
    for (var c = 0; c < 3; c++) p.tri(6 + c * 3, 7, 8 + c * 3, 7, 7 + c * 3, 1 + ((c + f) % 2) * 2, c === 1 ? LV.y : LV.r); // crête de flammes
    p.tri(14, 12, 20, 9 - up, 19, 15, LV.r); p.tri(15, 12, 19, 11, 18, 14, LV.y); // queue de flammes
    p.ell(10, 12, 6.5, 5.5, function (x, y, dx, dy) { return dy > 0.4 ? LV.y : LV.o; });
    p.tri(11, 11, 16, 8 + up * 4, 15, 13, LV.r); // aile
    p.tri(1, 10, 4, 9, 4, 12, LV.y); // bec
    p.put(6, 9, P.K); p.put(6, 8, P.W);
    return p.outline(P.K);
  };
  S.ashes = function (f) {
    var p = new Pix(16, 8);
    p.ell(8, 6, 7, 2.6, col('5a5060')); p.ell(8, 5, 4.5, 2, col('8a8090'));
    for (var k = 0; k < 4; k++) p.put(4 + k * 3, 5 + (k % 2), (k + f) % 2 ? LV.o : LV.r);
    p.put(8, 1 + (f % 2), alpha(LV.y, 180));
    return p;
  };
  // golem de lave : seules ses fissures brillantes sont fragiles
  S.golem = function (f) {
    var p = new Pix(32, 34), glow = f % 2 ? LV.y : LV.o, step = f % 2;
    p.rect(9, 27, 5, 6 - step, RK.m); p.rect(18, 27, 5, 5 + step, RK.m); // jambes
    p.ell(16, 19, 11, 10, function (x, y, dx, dy) { return dy < -0.5 ? RK.l : dx > 0.5 ? RK.d : RK.m; });
    p.ell(4, 20, 4, 5, RK.m); p.ell(28, 19, 4, 5, RK.d); // bras
    p.ell(15, 8, 7, 6, function (x, y, dx, dy) { return dy < -0.3 ? RK.l : RK.m; });
    // fissures de lave
    p.line(10, 14, 14, 19, glow); p.line(14, 19, 12, 24, glow); p.line(19, 13, 21, 18, glow); p.line(21, 18, 24, 21, glow); p.line(3, 18, 5, 22, glow);
    p.rect(10, 7, 3, 2, LV.y); p.rect(16, 7, 3, 2, LV.y); // yeux
    return p.outline(P.K);
  };
  // boule de feu
  S.fireball = function (f) {
    var p = new Pix(16, 16), R = FC.rng(11 + (f % 4));
    p.ell(8, 8, 7, 7, alpha(LV.o, 90));
    for (var k = 0; k < 8; k++) p.put(2 + R() * 12, 2 + R() * 12, alpha(LV.y, 200));
    p.ell(8, 8, 5, 5, LV.o); p.ell(7.5, 7.5, 3.3, 3.3, LV.y); p.ell(7, 7, 1.6, 1.6, LV.w);
    return p;
  };

  // ---------- obstacles ----------
  // arbre en feu (h : hauteur ; f : image des flammes)
  FC.fireTree = function (h, seed, f) {
    return FC.mk('fireTree' + h + '_' + seed + '_' + (f % 4), function () {
      var w = Math.round(h * 0.7), p = new Pix(w, h), cx = w / 2, R = FC.rng(seed), tw = Math.max(3, Math.round(h / 10));
      // tronc calciné avec des braises
      p.rect(cx - tw / 2, h * 0.45, tw, h * 0.55, RK.d);
      for (var y = Math.round(h * 0.5); y < h; y += 3) if (R() < 0.5) p.put(cx - tw / 2 + R() * tw, y, LV.o);
      // branches
      for (var b = 0; b < 3; b++) { var by = h * (0.5 + b * 0.1), side = b % 2 ? 1 : -1; p.line(cx, by, cx + side * w * 0.32, by - h * 0.12, RK.d); }
      // flammes : des langues de feu qui montent, du blanc au rouge
      var R2 = FC.rng(seed * 7 + f);
      for (var k = 0; k < 9; k++) {
        var fx = cx + (R() - 0.5) * w * 0.8, base = h * (0.48 + R() * 0.12), fh = h * (0.25 + R() * 0.25) * (0.8 + R2() * 0.4), fw = 2 + R() * w * 0.12;
        p.tri(fx - fw, base, fx + fw, base, fx + (R2() - 0.5) * 3, base - fh, LV.r);
        p.tri(fx - fw * 0.6, base, fx + fw * 0.6, base, fx, base - fh * 0.7, LV.o);
        p.tri(fx - fw * 0.3, base, fx + fw * 0.3, base, fx, base - fh * 0.4, LV.y);
      }
      return p.outline(P.K);
    });
  };
  // liane de braise qui pend (len : longueur)
  FC.liana = function (len, f, seed) {
    var p = new Pix(14, Math.max(4, Math.round(len)) + 4), vine = col('5a2a1a'), vine2 = col('8a4d22');
    for (var y = 0; y < len; y++) {
      var x = 6 + Math.round(Math.sin(y * 0.18 + f * 0.6 + seed) * 2 * (y / Math.max(1, len)));
      p.put(x, y, vine); p.put(x + 1, y, vine2);
      if ((y + seed * 3) % 9 === 4) { p.tri(x - 3, y + 1, x, y - 1, x, y + 2, (y + f) % 2 ? LV.r : LV.o); p.tri(x + 5, y + 4, x + 2, y + 2, x + 2, y + 5, LV.r); }
    }
    var tx = 6 + Math.round(Math.sin(len * 0.18 + f * 0.6 + seed) * 2);
    p.ell(tx + 0.5, len + 1, 2.2, 2.2, f % 2 ? LV.y : LV.o); // bourgeon qui brille au bout
    return p;
  };
  // coulée de lave verticale entre top et bottom ; state : 'warn', 'on', 'end' ; k : avancement de l'état (0 à 1)
  FC.lavaFall = function (scr, x, top, bottom, state, k, t) {
    var w = 7; // coulée fine
    if (state === 'warn') { // une fissure qui brille et des gouttes
      scr.rect(x - w / 2 - 2, top, w + 4, 3, alpha(LV.o, 120 + Math.round(Math.sin(t * 20) * 60)));
      scr.rect(x - 2, top, 4, 2, LV.y);
      for (var d = 0; d < 2; d++) { var dy = ((t * 90 + d * 47) % (bottom - top)); scr.ell(x - 1 + d * 2, top + dy, 1.2, 1.8, LV.o); }
      return;
    }
    var y0 = state === 'end' ? top + (bottom - top) * k : top, y1 = state === 'on' ? Math.min(bottom, top + (bottom - top) * Math.min(1, k * 4)) : bottom;
    scr.rect(x - w / 2 - 3, y0, w + 6, y1 - y0, alpha(LV.r, 60)); // halo
    for (var y = Math.floor(y0); y < y1; y++) {
      for (var xx = -w / 2; xx < w / 2; xx++) {
        var v = 0.55 + 0.35 * Math.cos(xx / (w / 2) * 1.5) + 0.15 * Math.sin((y - t * 120) * 0.25 + xx * 0.7);
        scr.put(x + xx, y, lavaCol(v));
      }
    }
    if (y1 >= bottom - 1) for (var s = 0; s < 8; s++) { var a = s / 8 * Math.PI, r = 4 + ((t * 30 + s * 3) % 5); scr.put(x + Math.cos(a) * r * 1.3, bottom - Math.sin(a) * r * 0.6, s % 2 ? LV.y : LV.o); } // éclaboussures
  };
  // rocher de feu flottant
  FC.fireRock = function (r, f) {
    return FC.mk('fireRock' + r + '_' + (f % 2), function () {
      var p = new Pix(r * 2 + 6, r * 2 + 8), cx = r + 3, cy = r + 5;
      p.ell(cx, cy, r, r * 0.85, function (x, y, dx, dy) { return dy < -0.4 ? RK.l : dx > 0.4 ? RK.d : RK.m; });
      p.line(cx - r * 0.5, cy - 1, cx + 1, cy + r * 0.4, LV.o); p.line(cx + 1, cy + r * 0.4, cx + r * 0.6, cy, LV.o);
      p.outline(P.K);
      for (var k = 0; k < 3; k++) p.tri(cx - r * 0.5 + k * r * 0.5 - 2, cy - r * 0.6, cx - r * 0.5 + k * r * 0.5 + 2, cy - r * 0.6, cx - r * 0.5 + k * r * 0.5, cy - r * 0.6 - 4 - ((k + f) % 2) * 2, k === 1 ? LV.y : LV.o);
      return p;
    });
  };
  // la planète Vulcano
  FC.vulcanoPlanet = function (r) {
    return FC.mk('vulcano' + r, function () {
      var w = r * 2 + 12, p = new Pix(w, w), c = w / 2, R = FC.rng(23), cracks = [];
      p.ell(c, c, r + 5, r + 5, alpha(LV.o, 40)); p.ell(c, c, r + 2, r + 2, alpha(LV.r, 70));
      for (var i = 0; i < 7; i++) cracks.push([c + (R() - 0.5) * r * 1.4, c + (R() - 0.5) * r * 1.4, 0.5 + R() * 2]);
      p.ell(c, c, r, r, function (x, y, dx, dy) {
        for (var k = 0; k < cracks.length; k++) if (Math.abs(Math.sin((x - cracks[k][0]) * 0.3 * cracks[k][2]) * 4 - (y - cracks[k][1])) < 0.9 && Math.abs(x - cracks[k][0]) < r * 0.4) return dx < 0.3 ? LV.y : LV.o;
        var base = Math.sin(x * 0.4 + y * 0.2) > 0.6 ? col('5a1a14') : col('3a1418');
        return FC.shade(base, dx, dy, x, y);
      });
      p.tri(c - r * 0.25, c - r * 0.75, c + r * 0.25, c - r * 0.75, c, c - r * 1.1, col('3a1418')); // le volcan qui dépasse
      p.ell(c, c - r * 1.05, 2, 1.2, LV.y);
      return p;
    });
  };
  // volcan au loin (décor du niveau 13)
  FC.volcanoBg = function () {
    return FC.mk('volcanoBg', function () {
      var p = new Pix(150, 80);
      p.tri(0, 80, 150, 80, 75, 6, col('4a1a1e')); p.tri(10, 80, 140, 80, 75, 14, col('3a1418'));
      p.rect(64, 6, 22, 4, col('4a1a1e'));
      p.ell(75, 7, 10, 2.5, LV.o); p.ell(75, 7, 6, 1.5, LV.y); // cratère
      for (var s = 0; s < 4; s++) { var sx = 68 + s * 5; for (var y = 10; y < 70; y++) { var x = sx + Math.round(Math.sin(y * 0.15 + s) * 2) + (s < 2 ? -(y - 10) * 0.35 : (y - 10) * 0.35); p.put(x, y, y % 5 ? LV.r : LV.o); } }
      return p;
    });
  };

  // ---------- le boss : Scorpion volant de feu (3 formes) ----------
  var FORMS = {
    iron: { base: P.M, light: P.m, dark: P.n, eye: P.R, sting: P.m, wing: alpha(col('d0d8f0'), 110) },
    fire: { base: col('d9381e'), light: LV.o, dark: col('8a1a10'), eye: LV.w, sting: LV.y, wing: alpha(LV.o, 110), flames: true },
    skel: { base: BONE, light: col('fff8e6'), dark: BONE2, eye: GREEN, sting: BONE, wing: alpha(col('c8c0a8'), 60), bones: true },
  };
  FC.fireScorp = function (form, f) {
    return FC.mk('fireScorp_' + form + '_' + (f % 4), function () {
      var c = FORMS[form], p = new Pix(100, 68), flap = f % 2;
      // ailes d'insecte (derrière)
      var wings = [[50, 14 - flap * 3, 18, 6, -0.5], [62, 18 - flap * 2, 15, 5, -0.3]];
      wings.forEach(function (wg) {
        p.ell(wg[0], wg[1], wg[2], wg[3], c.wing);
        p.line(wg[0] - wg[2] + 2, wg[1] + 1, wg[0] + wg[2] - 2, wg[1] - 1, alpha(c.dark, 180));
        if (c.bones) { p.line(wg[0] - wg[2], wg[1], wg[0] + wg[2], wg[1], BONE); p.line(wg[0], wg[1] - wg[3], wg[0], wg[1] + wg[3], BONE); }
      });
      // pattes
      for (var l = 0; l < 3; l++) { var lx = 34 + l * 11; p.line(lx, 44, lx - 4 + ((l + f) % 2) * 3, 56, c.dark); p.line(lx - 4 + ((l + f) % 2) * 3, 56, lx - 7, 60, c.dark); }
      // queue qui passe par-dessus le dos, dard vers l'avant
      var tail = [[80, 34, 6], [86, 25, 5.5], [85, 15, 5], [78, 8, 4.5], [68, 5, 4], [58, 7, 3.5]];
      tail.forEach(function (s, i) {
        if (c.bones) { p.ell(s[0], s[1], s[2], s[2], c.dark); p.ell(s[0], s[1], s[2] - 1.6, s[2] - 1.6, null); p.ell(s[0], s[1], s[2] - 2, s[2] - 2, alpha(P.K, 0)); }
        else p.ell(s[0], s[1], s[2], s[2], function (x, y, dx, dy) { return dy < -0.3 ? c.light : (i % 2 ? c.base : c.dark); });
      });
      p.tri(53, 6, 54, 12, 46, 14, c.sting); p.tri(52, 9, 53, 12, 49, 12, c.light);
      // corps en segments
      var segs = [[70, 38, 8, 6], [59, 38, 8.5, 7], [47, 38, 9, 7.5], [35, 38, 9, 8]];
      segs.forEach(function (s) {
        p.ell(s[0], s[1], s[2], s[3], function (x, y, dx, dy) {
          if (c.bones) return Math.abs(dx) > 0.7 || Math.abs(dy) > 0.75 ? c.dark : (x % 4 === 0 ? BONE : null);
          if (form === 'iron' && x % 6 === 0 && y % 5 === 2) return P.W; // rivets
          return dy < -0.4 ? c.light : dy > 0.5 ? c.dark : c.base;
        });
      });
      if (c.bones) p.line(26, 38, 78, 38, BONE); // colonne
      // tête
      p.ell(22, 38, 10, 8.5, function (x, y, dx, dy) { return dy < -0.4 ? c.light : dy > 0.5 ? c.dark : c.base; });
      if (form === 'iron') { p.rect(14, 30, 16, 2, P.n); p.tri(18, 30, 22, 30, 20, 24, P.m); } // casque
      // pinces
      [[30, -1], [46, 1]].forEach(function (cl) {
        var cy = cl[0];
        p.line(16, cy + 4 * cl[1] + 3, 11, cy + 2, c.dark); p.line(16, cy + 4 * cl[1] + 4, 11, cy + 3, c.dark);
        p.ell(10, cy + 2, 4.5, 3.5, function (x, y, dx, dy) { return dy < 0 ? c.light : c.base; });
        p.tri(9, cy - 1, 1, cy - 3, 4, cy + 2, c.base); p.tri(9, cy + 5, 1, cy + 7, 4, cy + 3, c.dark); // les deux mâchoires de la pince
        p.put(2, cy - 3, c.light); p.put(2, cy + 7, c.light);
      });
      // yeux
      if (c.bones) { p.rect(14, 33, 4, 4, P.K); p.rect(20, 32, 4, 4, P.K); p.put(15, 34, c.eye); p.put(21, 33, c.eye); }
      else { p.rect(15, 34, 2, 2, c.eye); p.rect(21, 33, 2, 2, c.eye); }
      p.outline(P.K);
      // carapace de feu : des flammes qui dansent sur le dos
      if (c.flames) {
        var R = FC.rng(5 + f);
        segs.concat([[22, 38, 10, 8]]).forEach(function (s) {
          for (var k = 0; k < 2; k++) { var fx = s[0] - 4 + R() * 8, fy = s[1] - s[3] + 1; p.tri(fx - 2, fy, fx + 2, fy, fx, fy - 4 - R() * 4, k ? LV.y : LV.o); }
        });
      }
      return p;
    });
  };
  S.fsIron = function (f) { return FC.fireScorp('iron', f); };
  S.fsFire = function (f) { return FC.fireScorp('fire', f); };
  S.fsSkel = function (f) { return FC.fireScorp('skel', f); };

  // ---------- vignettes composées (planche des personnages) ----------
  S.dragonetCard = function (f) {
    var p = new Pix(70, 26), t = f / 6;
    p.blit(spr('dragonet', f), 36, 2);
    if (f % 6 > 1) FC.fireJet(p, 37, 13, 34, t); else FC.fireJet(p, 37, 13, 0, t, true);
    return p;
  };
  S.magmaCard = function (f) {
    var p = new Pix(80, 46), t = f / 8;
    p.rect(0, 40, 80, 6, LV.d); for (var x = 0; x < 80; x++) p.put(x, 40 + Math.round(Math.sin(x * 0.4 + f) * 0.8), LV.o);
    FC.magmaSnake(p, 70, 42, ((f % 8) + 0.5) / 8 * 0.9 + 0.05, t, 56, 30);
    return p;
  };
  S.phoenixCard = function (f) { var p = new Pix(44, 22); p.blit(spr('phoenix', f), 0, 2); p.blit(spr('ashes', f), 26, 13); return p; };
  S.treesCard = function (f) {
    var p = new Pix(64, 46);
    p.blit(FC.fireTree(22, 3, f), 0, 24); p.blit(FC.fireTree(32, 5, f), 16, 14); p.blit(FC.fireTree(44, 7, f), 34, 2);
    return p;
  };
  S.lianaCard = function (f) {
    var p = new Pix(60, 46), t = f / 6;
    p.rect(0, 0, 60, 2, RK.d);
    p.blit(FC.liana(18 + Math.round(Math.sin(t * 2) * 14 + 14), f, 1), 4, 0);
    p.blit(FC.liana(36, f, 4), 22, 0);
    var fall = (f % 6) / 6; p.blit(FC.liana(20, f, 2), 40, 2 + fall * 22); // celle-ci s'est détachée
    return p;
  };
  S.lavaCard = function (f) {
    var p = new Pix(66, 46), t = f / 8;
    p.rect(0, 0, 66, 3, RK.d); p.rect(0, 43, 66, 3, RK.d);
    FC.lavaFall(p, 10, 3, 43, 'warn', 0, t); FC.lavaFall(p, 33, 3, 43, 'on', 1, t); FC.lavaFall(p, 56, 3, 43, 'end', 0.5, t);
    return p;
  };

  // ---------- outils d'écran ----------
  // ---------- histoires (cases de 150 x 84) ----------
  FC.scenes.story5 = function () { // la fête sur la planète aquatique
    var bg = FC.bg('st5', 150, 84, [[0, '0d3360'], [1, '1d7fb8']]);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d);
        for (var c = 0; c < 24; c++) { var cp = (t * 0.4 + c / 24) % 1; scr.rect((c * 29) % 150 + Math.sin(t * 3 + c) * 3, cp * 90 - 4, 2, 2, RB[c % 6]); } // confettis
        FC.hero(scr, 55, 22 + Math.round(Math.abs(Math.sin(t * 4)) * -6), t);
        scr.blit(spr('jellyPink', Math.floor(t * 4) % 4), 12, 30 + Math.round(Math.sin(t * 4) * 4));
        scr.blit(spr('jellyBlue', Math.floor(t * 4 + 2) % 4), 110, 26 + Math.round(Math.cos(t * 4) * 4));
        scr.blit(spr('guitarFish', Math.floor(t * 6) % 2), 104, 58);
        scr.blit(spr('note', Math.floor(t * 8) % 3), 96 - ((t * 20) % 30), 50 - ((t * 10) % 20));
        FC.text(scr, 'HOURRA !', 50, 3, P.y, { outline: P.K });
      }
    };
  };
  FC.scenes.story6 = function () { // un petit phénix arrive avec un message
    var bg = FC.bg('st6', 150, 84, [[0, '050a1f'], [1, '1d3a6e']]), L = FC.stars(66, 150, 84, 50);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d); FC.drawStars(scr, L, t, [2, 5, 10]);
        FC.hero(scr, 14, 34, t);
        if (t % 1 < 0.7) FC.text(scr, '!', 31, 24, P.y, { sc: 2, outline: P.K });
        var px = 150 - ((t * 30) % 60) - 40, py = 26 + Math.sin(t * 5) * 3;
        for (var k = 0; k < 8; k++) scr.put(px + 20 + k * 3, py + 10 + Math.sin(t * 9 + k) * 2, alpha(k % 2 ? LV.y : LV.o, 220 - k * 25)); // traînée de feu
        scr.blit(spr('phoenix', Math.floor(t * 8)).scale(2), px, py);
        scr.rect(px - 6, py + 26, 14, 9, col('fff3c4')); scr.rect(px - 6, py + 26, 14, 1, LV.o); // la lettre
        if (t % 1.4 < 1) FC.text(scr, 'AU SECOURS !', 74, 6, P.W, { outline: P.P });
      }
    };
  };
  FC.scenes.story7 = function () { // le Scorpion volant de feu sur le volcan
    var bg = FC.bg('st7', 150, 84, [[0, '1a0608'], [1, '9a2a18']]);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d);
        scr.blit(FC.volcanoBg(), 0, 14);
        for (var s = 0; s < 5; s++) { var sp = (t * 0.4 + s / 5) % 1; scr.ell(75 + Math.sin(sp * 5 + s) * 8, 18 - sp * 30, 3 + sp * 8, 2 + sp * 5, alpha(col('5a4048'), 150 * (1 - sp))); }
        for (var f = 0; f < 3; f++) { var fp = (t * 0.6 + f / 3) % 1; scr.blit(spr('fireball', Math.floor(t * 8)), 70 + (f - 1) * fp * 60, 16 - Math.sin(fp * Math.PI) * 14 + fp * 30); }
        scr.blit(FC.fireScorp('fire', Math.floor(t * 8)), 26, 2 + Math.round(Math.sin(t * 2) * 3));
      }
    };
  };
  FC.scenes.story8 = function () { // cap sur Vulcano
    var bg = FC.bg('st8', 150, 84, [[0, '050a1f'], [1, '2e1020']]), L = FC.stars(88, 150, 84, 60);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d); FC.drawStars(scr, L, t * 3, [6, 14, 30]);
        scr.blit(FC.vulcanoPlanet(26), 94, 14);
        for (var k = 0; k < 8; k++) { var lx = (k * 23 - t * 160) % 150; lx = lx < 0 ? lx + 150 : lx; scr.rect(lx, 10 + k * 9, 8, 1, alpha(P.W, 120)); } // lignes de vitesse
        FC.hero(scr, 18 + Math.sin(t * 2) * 4, 30, t);
        FC.text(scr, 'CAP SUR VULCANO !', 30, 3, P.y, { outline: P.K });
      }
    };
  };
  function shadow(name, key, src) {
    return FC.mk(key, function () { var q = new Pix(src.w, src.h); q.blit(src, 0, 0); return q.tint(col('120810'), 0.8); });
  }
  FC.scenes.story9 = function () { // les 3 boss s'allient
    var bg = FC.bg('st9', 150, 84, [[0, '0c0610'], [1, '3a0e10']]);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d);
        var sp = shadow('boss', 'shBoss', spr('boss', 0)), sk = shadow('skel', 'shSkel', spr('skelBoss', 0)), sc = shadow('scorp', 'shScorp', FC.fireScorp('fire', 0));
        scr.blit(sk, 24, -8);
        scr.blit(sp, -46, 10);
        scr.blit(sc, 70, 18);
        var blink = Math.floor(t * 2) % 5 !== 0;
        if (blink) { scr.rect(50, 28, 3, 3, GREEN); scr.rect(85, 52, 2, 2, LV.w); scr.rect(91, 51, 2, 2, LV.w); scr.rect(8, 60, 2, 2, P.R); scr.rect(14, 60, 2, 2, P.R); } // les yeux qui brillent
        FC.text(scr, 'ALLIÉS !', 96, 6, P.R, { sc: 2, outline: P.K });
      }
    };
  };
  FC.scenes.story10 = function () { // le vaisseau de guerre
    var bg = FC.bg('st10', 150, 84, [[0, '050a1f'], [1, '1a1030']]), L = FC.stars(100, 150, 84, 60);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d); FC.drawStars(scr, L, t, [2, 5, 10]);
        var y = 30 + Math.round(Math.sin(t) * 2);
        scr.tri(8, y + 10, 30, y - 4, 30, y + 24, P.M); // proue
        scr.rect(30, y - 4, 96, 28, P.M); scr.rect(30, y - 4, 96, 4, P.m); scr.rect(30, y + 20, 96, 4, P.n);
        scr.rect(56, y - 14, 40, 12, P.n); scr.rect(60, y - 12, 32, 3, P.m); // passerelle
        for (var k = 0; k < 3; k++) { scr.ell(48 + k * 26, y + 10, 6, 6, P.n); scr.ell(48 + k * 26, y + 10, 4, 4, [P.R, GREEN, LV.o][k]); } // les 3 emblèmes
        for (var w = 0; w < 9; w++) scr.put(36 + w * 10, y + 1, (Math.floor(t * 4) + w) % 3 ? P.y : P.n); // hublots
        for (var e = 0; e < 2; e++) { scr.rect(126, y + 2 + e * 12, 6, 6, P.n); scr.ell(134 + Math.sin(t * 30) * 1, y + 5 + e * 12, 4 + (Math.floor(t * 10) % 2), 3, LV.o); }
        scr.rect(30, y - 4, 96, 28, alpha(P.K, 0));
        FC.text(scr, 'LE VAISSEAU DES BOSS', 18, 3, P.W, { outline: P.K });
      }
    };
  };
  FC.scenes.story11 = function () { // le chat se glisse dans le vaisseau
    var bg = FC.bg('st11', 150, 84, [[0, '1e2638'], [1, '2a3248']]);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d);
        for (var x = 0; x < 150; x += 20) scr.rect(x, 0, 1, 84, col('141a2a'));
        for (var r = 0; r < 150; r += 10) scr.put(r + 4, 6, P.m);
        // le sas ouvert, éclairé
        scr.rect(96, 24, 40, 40, P.K); scr.rect(98, 26, 36, 36, col('2a3a20')); scr.rect(98, 26, 36, 36, alpha(col('ffe680'), 60));
        for (var s = 0; s < 36; s += 6) scr.rect(98 + s, 62, 3, 2, P.Y);
        var ph = (t * 0.35) % 1, hx = 10 + ph * 100, sc = 1 - Math.max(0, ph - 0.7) * 2;
        if (ph < 0.85) FC.hero(scr, hx, 34, t, sc);
        if (t % 1.4 < 1) FC.text(scr, 'CHUT...', 10, 8, P.W, { outline: P.K });
      }
    };
  };
  // ---------- la fin : les 3 boss vaincus, la grande fête ----------
  function warship(scr, x, y, t) { // le vaisseau des boss (comme dans la case « le vaisseau de guerre »)
    scr.tri(x - 22, y + 10, x, y - 4, x, y + 24, P.M);
    scr.rect(x, y - 4, 96, 28, P.M); scr.rect(x, y - 4, 96, 4, P.m); scr.rect(x, y + 20, 96, 4, P.n);
    scr.rect(x + 26, y - 14, 40, 12, P.n);
    for (var k = 0; k < 3; k++) { scr.ell(x + 18 + k * 26, y + 10, 6, 6, P.n); scr.ell(x + 18 + k * 26, y + 10, 4, 4, [P.R, GREEN, LV.o][k]); }
  }
  FC.scenes.storyEnd1 = function () { // le vaisseau explose en mille bonbons
    var bg = FC.bg('stE1', 150, 84, [[0, '050a1f'], [1, '2a1030']]), L = FC.stars(131, 150, 84, 60);
    var candies = []; for (var c = 0; c < 26; c++) candies.push([Math.random() * Math.PI * 2, 30 + Math.random() * 60, c]);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d); FC.drawStars(scr, L, t, [2, 5, 10]);
        var ph = (t * 0.4) % 1;
        if (ph < 0.25) warship(scr, 52, 34, t);
        else {
          var q = (ph - 0.25) / 0.75;
          scr.ell(100, 44, 12 + q * 44, 9 + q * 32, alpha(LV.o, Math.round(210 * (1 - q))));
          scr.ell(100, 44, 8 + q * 30, 6 + q * 22, alpha(LV.y, Math.round(230 * (1 - q))));
          scr.ell(100, 44, 4 + q * 14, 3 + q * 10, alpha(P.W, Math.round(240 * (1 - q))));
          candies.forEach(function (cd) { var d = q * cd[1]; scr.blit(spr('candyBit', cd[2]), 100 + Math.cos(cd[0]) * d, 44 + Math.sin(cd[0]) * d * 0.7 + q * q * 20); });
          if (q > 0.2) FC.text(scr, 'BOUM !', 86, 6, P.y, { sc: 2, outline: P.K });
        }
        FC.hero(scr, 8 + Math.sin(t * 2) * 3, 40, t);
      }
    };
  };
  FC.scenes.storyEnd2 = function () { // la grande fête, pluie de bonbons
    var bg = FC.bg('stE2', 150, 84, [[0, '1d1450'], [0.6, 'a77bff'], [1, 'ffc9e2']]), L = FC.stars(141, 150, 84, 30);
    var spots = [[22, 18], [70, 10], [128, 20], [46, 30], [104, 30]];
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d); FC.drawStars(scr, L, t, [0, 1, 2]);
        for (var k = 0; k < spots.length; k++) { // feux d'artifice
          var ph = (t * 0.55 + k / spots.length) % 1, cx = spots[k][0], cy = spots[k][1], r = 4 + ph * 14;
          if (ph < 0.12) continue;
          if (ph < 0.2) scr.ell(cx, cy, 4, 4, alpha(P.W, 200));
          for (var a = 0; a < 12; a++) { var an = a / 12 * Math.PI * 2; scr.rect(cx + Math.cos(an) * r, cy + Math.sin(an) * r * 0.85 + ph * ph * 8, 2, 2, alpha(RB[(a + k) % 6], Math.round(255 * Math.min(1, (1 - ph) * 1.6)))); }
        }
        // la pluie de bonbons
        for (var b = 0; b < 22; b++) {
          var fy = ((t * (20 + b % 5 * 4) + b * 29) % 96) - 8, fx = (b * 37 + 5) % 148 + Math.sin(t * 2 + b) * 2;
          if (b % 7 === 0) scr.blit(spr('bigCandy', Math.floor(t * 6 + b) % 4), fx - 6, fy);
          else if (b % 3 === 0) scr.blit(spr('bigDrag', b), fx, fy); else scr.blit(spr('candyBit', b), fx, fy);
        }
        // les amis font la fête avec le chat
        scr.blit(spr('jellyPink', Math.floor(t * 4) % 4), 6, 44 + Math.round(Math.sin(t * 4) * 3));
        scr.blit(spr('smallFish', Math.floor(t * 6) % 2), 26, 64 + Math.round(Math.cos(t * 5) * 2));
        scr.blit(spr('phoenix', Math.floor(t * 8)), 116, 40 + Math.round(Math.sin(t * 5 + 1) * 4));
        scr.blit(spr('jellyBlue', Math.floor(t * 4 + 2) % 4), 128, 58 + Math.round(Math.cos(t * 4) * 3));
        FC.hero(scr, 55, 30 - Math.abs(Math.sin(t * 4)) * 8, t);
        if (t % 1.2 < 0.85) FC.text(scr, 'HOURRA !', 54, 3, P.y, { outline: P.K });
      }
    };
  };
  FC.scenes.storyEnd3 = function () { // fin
    var bg = FC.bg('stE3', 150, 84, [[0, '0b0a26'], [1, '3a1d6e']]), L = FC.stars(151, 150, 84, 70);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d); FC.drawStars(scr, L, t, [1, 3, 6]);
        for (var i = 0; i < 6; i++) scr.ell(75, 70, 62 - i * 5, 44 - i * 5, RB[i], function (x, y, dx, dy) { return dy < 0 && dx * dx + dy * dy > 0.82; }); // arc-en-ciel
        FC.hero(scr, 55, 36 + Math.round(Math.sin(t * 2) * 2), t);
        FC.text(scr, 'FIN', 63, 10, P.y, { sc: 2, outline: P.K });
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
