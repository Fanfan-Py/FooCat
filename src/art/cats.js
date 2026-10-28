/* FooCat – les couleurs du chat licorne (à gagner avec les succès « des chats ») */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, S = FC.S, alpha = FC.alpha, col = FC.col, RB = FC.RAINBOW;
  function hx(a, op) { return a.map(function (h) { return typeof h === 'string' ? col(h, op) : h; }); }

  // ---------- les couleurs du chat ----------
  // fur/shade : fourrure et ombre ; ear : intérieur des oreilles ; cheek : joues ; nose : nez ; mouth : bouche
  // mane : crinière (6 bandes) ; tuft : mèche du front ; horn : corne [clair, foncé] ; eye/eyeHi/eyeLo : yeux
  var CATS = {
    classic: { name: 'LICORNE', fur: P.w, shade: P.v, ear: P.p, cheek: P.p, nose: P.P, mouth: P.k, mane: RB, tuft: [P.r, P.o, P.y, P.g], horn: [P.y, P.Y], eye: P.K, eyeHi: P.W, eyeLo: P.U },
    roux: { name: 'ROUX', fur: col('ff9a3c'), shade: col('d9601a'), ear: col('ffc0cb'), cheek: col('ff8a8a'), nose: P.P, mouth: col('8a4d22'),
      mane: hx(['d9381e', 'ff6a2a', 'ff9a3c', 'ffc94d', 'ff9a3c', 'd9541a']), tuft: hx(['d9381e', 'ff6a2a', 'ffc94d', 'ff9a3c']), horn: [P.y, P.Y], eye: P.K, eyeHi: P.W, eyeLo: P.G },
    noir: { name: 'NOIR', fur: col('241c2e'), shade: col('120d18'), ear: col('b06bff'), cheek: col('6a3fd1'), nose: col('b06bff'), mouth: col('6a3fd1'),
      mane: hx(['4a1f8a', '6a3fd1', '8a5cff', 'b08bff', '8a5cff', '6a3fd1']), tuft: hx(['8a5cff', 'b08bff', '6a3fd1', '4a1f8a']), horn: hx(['eef1f8', '9aa3b8']), eye: col('ffd23f'), eyeHi: P.W, eyeLo: col('ff9a3c') },
    dore: { name: 'DORÉ', fur: col('ffc933'), shade: col('d9901a'), ear: col('ffb3c7'), cheek: col('ff9cc8'), nose: P.P, mouth: col('a8641c'),
      mane: hx(['ffffff', 'fff6d6', 'ffe9a8', 'fff6d6', 'ffffff', 'ffe9a8']), tuft: hx(['ffffff', 'fff6d6', 'ffffff', 'ffe9a8']), horn: hx(['ffffff', 'e6dcff']), eye: P.K, eyeHi: P.W, eyeLo: P.j },
    galaxie: { name: 'GALAXIE', fur: col('2433a0'), shade: col('141c66'), stars: true, ear: col('ff6ec7'), cheek: col('6a3fd1'), nose: col('ff6ec7'), mouth: col('7fe0ff'),
      mane: hx(['ff6ec7', 'b06bff', '6a7bff', '3ac4e8', '7fffd4', 'b06bff']), tuft: hx(['ff6ec7', '7fffd4', 'b06bff', '3ac4e8']), horn: hx(['bff3ff', '7fd3f2']), eye: col('7fe0ff'), eyeHi: P.W, eyeLo: P.B },
    fantome: { name: 'FANTÔME', fur: col('c8ecff', 185), shade: col('8fd0ff', 170), ear: col('ff9cc8', 190), cheek: null, nose: col('ffc9e2', 160), mouth: col('9fc8ff', 160),
      mane: hx(['ffb3c7', 'ffd9a0', 'fff09a', 'b8ffc4', 'b0e4ff', 'd6b8ff'], 200), tuft: hx(['ffb3c7', 'fff09a', 'b8ffc4', 'b0e4ff'], 200), horn: hx(['ffffff', 'c8ecff'], 210), eye: col('3a7bff'), eyeHi: P.W, eyeLo: P.B },
    squelette: { name: 'SQUELETTE', fur: col('fff8e6'), shade: col('b8a46a'), ear: col('3a2f4a'), cheek: null, nose: P.K, mouth: P.K, skull: true,
      mane: hx(['2a2433', '4a4458', '6b6680', '4a4458', '2a2433', '6b6680']), tuft: hx(['4a4458', '6b6680', '2a2433', '4a4458']), horn: hx(['fff8e6', 'b8a46a']), eye: P.K, eyeHi: col('3dff7a'), eyeLo: col('3dff7a') },
  };
  FC.CATS = CATS;

  // le chat licorne dans sa soucoupe (soucoupe fraise ; les autres soucoupes sont recolorées dans rewards.ts)
  FC.catHero = function (f, catId) {
    return FC.mk('cat_' + catId + '_' + f, function () {
      var c = CATS[catId] || CATS.classic, frost = [P.P, P.q, P.i];
      var p = new Pix(40, 31), cx = 19.5;
      var drip = function (x) { var m = x % 7; return m === 2 ? 0.3 : m === 3 ? 0.55 : m === 4 ? 0.25 : (x % 11 === 5 ? 0.4 : 0); };
      p.ell(cx, 23.5, 18.5, 6, function (x, y, dx, dy) {
        var edge = -0.05 + drip(x);
        if (dy < edge) { if (dy < -0.62) return frost[1]; if (dy > edge - 0.22) return frost[2]; return frost[0]; }
        return dy > 0.55 ? P.e : dy > 0.2 ? P.D : P.d;
      });
      var R = FC.rng(7);
      for (var n = 0; n < 26; n++) {
        var sx = 2 + Math.floor(R() * 36), sy = 18 + Math.floor(R() * 4), sc = FC.SPRINKLES[n % FC.SPRINKLES.length];
        var ddx = (sx + 0.5 - cx) / 18.5, ddy = (sy + 0.5 - 23.5) / 6;
        if (ddx * ddx + ddy * ddy < 0.8 && ddy < -0.1) { p.put(sx, sy, sc); if (n % 2) p.put(sx + 1, sy, sc); else p.put(sx + 1, sy - 1, sc); }
      }
      var dome = new Pix(40, 31);
      for (var i = 0; i < 6; i++) for (var x = 9; x <= 16; x++) {
        var yy = 9 + i + Math.round(Math.sin((x + f * 1.7) * 0.8) * 0.8 * (16 - x) / 7);
        dome.put(x, yy, c.mane[i]);
      }
      dome.tri(13.5, 13, 14.5, 6.5, 18, 10.5, c.fur); dome.tri(25.5, 13, 24.5, 6.5, 21, 10.5, c.fur);
      dome.tri(14.6, 11.6, 15, 8.4, 17, 10.6, c.ear); dome.tri(24.4, 11.6, 24, 8.4, 22, 10.6, c.ear);
      dome.ell(cx, 14.5, 6.6, 4.6, function (x, y, dx, dy) {
        if (c.stars && ((x * 7 + y * 13) % 11 === 0)) return (x + y) % 2 ? P.W : P.y; // fourrure étoilée
        return dy > 0.6 ? c.shade : c.fur;
      });
      dome.put(14, 10, c.tuft[0]); dome.put(15, 10, c.tuft[1]); dome.put(14, 11, c.tuft[1]); dome.put(16, 10, c.tuft[2]); dome.put(15, 11, c.tuft[2]); dome.put(14, 12, c.tuft[3]);
      if (c.skull) { // orbites noires, petite fêlure
        dome.rect(14, 12, 4, 4, P.K); dome.rect(21, 12, 4, 4, P.K);
        if (f % 4 !== 3) { dome.put(15, 13, c.eyeHi); dome.put(22, 13, c.eyeHi); dome.put(16, 14, c.eyeHi); dome.put(23, 14, c.eyeHi); }
        dome.put(21, 10, c.shade); dome.put(22, 11, c.shade);
        dome.put(18, 17, P.W); dome.put(19, 17, P.K); dome.put(20, 17, P.W);
      } else {
        if (f % 4 === 3) { dome.rect(15, 15, 2, 1, c.eye); dome.rect(22, 15, 2, 1, c.eye); }
        else { dome.rect(15, 13, 2, 3, c.eye); dome.rect(22, 13, 2, 3, c.eye); dome.put(15, 13, c.eyeHi); dome.put(22, 13, c.eyeHi); dome.put(16, 15, c.eyeLo); dome.put(23, 15, c.eyeLo); }
        dome.put(18, 17, c.mouth); dome.put(20, 17, c.mouth);
        if (c.cheek) { dome.put(14, 16, c.cheek); dome.put(24, 16, c.cheek); }
      }
      dome.put(19, 16, c.nose);
      dome.tri(17.4, 11.5, 21.6, 11.5, 19.5, 1.5, function (x, y) { return (x + y) % 3 === 0 ? c.horn[0] : c.horn[1]; });
      dome.ell(cx, 19.5, 11, 17, function (x, y, dx, dy) {
        var r = dx * dx + dy * dy;
        if (dx > -0.78 && dx < -0.58 && dy > -0.78 && dy < -0.3) return P.h;
        if (dx > 0.3 && dx < 0.5 && dy > -0.92 && dy < -0.8) return P.h;
        return r > 0.84 ? P.C : alpha(P.c, 40); // vitre plus légère : les couleurs du chat ressortent
      });
      for (var yy2 = 0; yy2 <= 21; yy2++) for (var xx = 0; xx < 40; xx++) {
        var i4 = (yy2 * 40 + xx) * 4; if (!dome.d[i4 + 3]) continue;
        p.put(xx, yy2, [dome.d[i4], dome.d[i4 + 1], dome.d[i4 + 2], dome.d[i4 + 3]]);
      }
      for (var x2 = 10; x2 <= 29; x2++) p.put(x2, 22, frost[2]);
      p.outline(P.K);
      var lights = [6, 12, 19, 26, 32];
      for (var k = 0; k < lights.length; k++) p.put(lights[k], 26, (k + f) % 2 ? P.y : P.a);
      return p;
    });
  };
  // silhouette d'un chat pas encore gagné
  FC.catLocked = function () {
    return FC.mk('catLocked', function () {
      var src = FC.catHero(0, 'classic'), p = new Pix(src.w, src.h), d = p.d, s = src.d;
      for (var i = 0; i < s.length; i += 4) if (s[i + 3] > 20) { d[i] = 0x3a; d[i + 1] = 0x24; d[i + 2] = 0x57; d[i + 3] = 255; }
      FC.text(p, '?', 18, 9, P.v);
      return p;
    });
  };
  // tête du chat (pour les petites icônes)
  FC.catHead = function (catId) {
    return FC.mk('catHead_' + catId, function () {
      var src = catId ? FC.catHero(0, catId) : FC.catLocked(), p = new Pix(18, 18);
      p.blit(src, -11, -2);
      return p;
    });
  };

  // le chat de départ passe par la même fonction (vitre du dôme plus légère qu'avant)
  S.hero = function (f) { return FC.catHero(f, 'classic'); };
  // petite tête de chat des vies, à la couleur du chat
  FC.lifeIconCat = function (catId) {
    return FC.mk('lifeIcon_' + catId, function () {
      var c = CATS[catId] || CATS.classic, p = new Pix(9, 9), eye = c.skull ? c.eyeHi : c.eye;
      p.rows(['....y....', '.w..y..w.', '.ww.y.ww.', '.wwwwwww.', 'wwewwweww', 'wwwwnwwww', '.wwwwwww.'], 0, 1,
        { w: alpha(c.fur, 255), y: c.horn[0], e: eye, n: c.nose });
      return p.outline(P.K);
    });
  };
})(typeof window !== 'undefined' ? window : globalThis);
