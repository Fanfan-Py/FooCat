/* FooCat – scènes : outils communs, écran titre, niveaux 1 et 2 */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, col = FC.col, mix = FC.mix, alpha = FC.alpha, RB = FC.RAINBOW, spr = FC.spr;

  // position qui boucle : l'objet repart à droite quand il sort à gauche
  function wx(x0, sp, t, span, off) { span = span || 400; off = off || 40; return ((x0 - sp * t) % span + span) % span - off; }
  FC.wx = wx;

  FC.bg = function (key, w, h, stops) {
    return FC.mk('bg' + key + w, function () {
      return new Pix(w, h).vgrad(stops.map(function (s) { return [s[0], col(s[1])]; }));
    });
  };

  // ciel étoilé sur 3 plans
  FC.stars = function (seed, w, h, n) {
    var R = FC.rng(seed), L = [];
    for (var i = 0; i < n; i++) {
      var layer = i % 3;
      L.push({ x: R() * w, y: R() * h, l: layer, c: layer === 0 ? col('6d6aa8') : layer === 1 ? col('c9c4ff') : (R() < 0.3 ? P.y : P.W), tw: R() * 6 });
    }
    return L;
  };
  FC.drawStars = function (scr, L, t, speeds) {
    var w = scr.w;
    for (var i = 0; i < L.length; i++) {
      var s = L[i], x = Math.floor(((s.x - t * speeds[s.l]) % w + w) % w), y = Math.floor(s.y);
      scr.put(x, y, s.c);
      if (s.l === 2 && Math.sin(t * 4 + s.tw) > 0.6) { var c = alpha(s.c, 140); scr.put(x - 1, y, c); scr.put(x + 1, y, c); scr.put(x, y - 1, c); scr.put(x, y + 1, c); }
    }
  };

  // traînée de paillettes derrière la soucoupe
  FC.trail = function (scr, x, y, t, rainbow) {
    if (rainbow) {
      for (var i = 0; i < 6; i++) for (var k = 0; k < x; k++) {
        var yy = y + i * 2 + Math.round(Math.sin((k + t * 40) / 6) * 1.5);
        scr.put(k, yy, alpha(RB[i], 120 + Math.min(130, k * 3))); scr.put(k, yy + 1, alpha(RB[i], 120 + Math.min(130, k * 3)));
      }
      return;
    }
    for (var j = 0; j < 14; j++) {
      var ph = ((t * 1.6 + j / 14) % 1), px = x - ph * 46, py = y + Math.sin(j * 7.3) * 4 + ph * 3;
      scr.put(px, py, alpha(FC.SPRINKLES[j % 7], 255 * (1 - ph)));
    }
  };
  FC.hero = function (scr, x, y, t, op) {
    var f = Math.floor(t * 5) % 4, by = Math.round(Math.sin(t * 2.4) * 1.5);
    FC.trail(scr, x + 4, y + 25 + by, t);
    scr.blit(spr('hero', f), x, y + by, false, op);
    return by;
  };

  // tirs du héros
  FC.shots = function (scr, kind, x0, y0, t, x1) {
    var span = x1 - x0;
    if (kind === 'verm') {
      for (var i = 0; i < 9; i++) {
        var x = x0 + ((t * 220 + i * 26) % span), y = y0 + ((i * 5) % 3) - 1;
        var c = FC.SPRINKLES[i % 7]; scr.rect(x, y, 4, 1, c); scr.put(x + 4, y, alpha(c, 120));
      }
    } else if (kind === 'drag') {
      for (var j = 0; j < 4; j++) scr.blit(spr('dragibus', j), x0 + ((t * 150 + j * 52) % span), y0 - 2);
    } else if (kind === 'jaw') {
      scr.blit(spr('jaw', Math.floor(t * 8) % 8), x0 + ((t * 90) % span), y0 - 5);
    } else if (kind === 'rain') {
      for (var k = 0; k < 3; k++) scr.blit(spr('rainbow'), x0 + ((t * 130 + k * 30) % Math.min(span, 90)), y0 - 6);
    }
  };

  // étincelles d'impact
  FC.burst = function (scr, x, y, t, colors) {
    var ph = t % 1;
    for (var i = 0; i < 10; i++) {
      var a = i * 0.63, d = 3 + ph * 12;
      scr.put(x + Math.cos(a) * d, y + Math.sin(a) * d, alpha((colors || FC.SPRINKLES)[i % 7], 255 * (1 - ph)));
    }
  };
  FC.popup = function (scr, txt, x, y, t) {
    var ph = t % 1.2;
    if (ph < 1) FC.text(scr, txt, x, Math.round(y - ph * 10), P.y, { outline: P.K });
  };

  // barre du haut : score, vies, progression, munitions
  FC.hud = function (scr, o) {
    var w = scr.w;
    scr.rect(0, 0, w, 13, alpha(P.K, 190)); scr.rect(0, 13, w, 1, P.U);
    var x = FC.text(scr, 'SCORE', 4, 4, P.v);
    FC.text(scr, ('000000' + o.score).slice(-6), x + 4, 4, P.W);
    for (var i = 0; i < 4; i++) {
      var h = spr('heart'); scr.blit(h, 62 + i * 8, 3, false, i < o.lives ? 1 : 0.25);
    }
    var nx = FC.text(scr, 'NIV.' + o.level, 100, 4, P.q);
    var bw = Math.max(40, Math.min(70, w - 290)), bx = nx + 4;
    scr.rect(bx, 4, bw + 2, 5, P.k);
    for (var b = 0; b < Math.round(bw * o.prog); b++) scr.rect(bx + 1 + b, 5, 1, 3, RB[Math.floor(b / bw * 6)]);
    var icons = ['icoVerm', 'icoDrag', 'icoJaw', 'icoRain'], wx0 = w - 122;
    for (var k = 0; k < 4; k++) {
      var sx = wx0 + k * 30;
      if (k === o.weapon) { scr.rect(sx, 1, 29, 1, P.y); scr.rect(sx, 11, 29, 1, P.y); scr.rect(sx, 1, 1, 11, P.y); scr.rect(sx + 28, 1, 1, 11, P.y); }
      scr.blit(spr(icons[k]), sx + 2, 3, false, o.ammo[k] === 0 ? 0.35 : 1);
      FC.text(scr, String(o.ammo[k]), sx + 12, 4, o.ammo[k] === 0 ? P.M : P.W);
    }
  };

  // ---------- Écran titre ----------
  FC.scenes.title = function () {
    var W = 320, H = 180, bg = FC.bg('title', W, H, [[0, '0b0a26'], [0.6, '1d1450'], [1, '3a1d6e']]);
    var L = FC.stars(3, W, H, 120), tintc = col('1d1450');
    var far = [FC.donutPlanet(14, 'p', 1), FC.cakePlanet(10, 'b', 'q', 2), FC.ringPlanet(8, 'u', 'P', 'W')];
    var farT = far.map(function (p) { var q = new Pix(p.w, p.h); q.blit(p, 0, 0); return q.tint(tintc, 0.35); });
    var logo = FC.logo(), big = {};
    return {
      w: W, h: H, draw: function (scr, t) {
        scr.d.set(bg.d);
        FC.drawStars(scr, L, t, [3, 8, 18]);
        scr.blit(farT[0], wx(260, 6, t, 420, 60), 30);
        scr.blit(farT[1], wx(40, 6, t, 420, 60), 132);
        scr.blit(farT[2], wx(330, 6, t, 420, 60), 120);
        scr.blit(logo, Math.round((W - logo.w) / 2), 16);
        var sub = "LE CHAT LICORNE DE L'ESPACE";
        FC.text(scr, sub, Math.round((W - FC.textWidth(sub)) / 2), 52, P.q, { shadow: P.U });
        var f = Math.floor(t * 5) % 4;
        if (!big[f]) big[f] = spr('hero', f).scale(2);
        var by = Math.round(Math.sin(t * 2.4) * 2), hx = Math.round((W - big[f].w) / 2), hy = 68 + by;
        FC.trail(scr, hx + 8, hy + 48, t, true);
        scr.blit(big[f], hx, hy);
        if (t % 1.2 < 0.8) { var s = 'APPUIE POUR JOUER'; FC.text(scr, s, Math.round((W - FC.textWidth(s)) / 2), 146, P.W, { outline: P.K }); }
        var hs = 'MEILLEUR SCORE  125 000';
        FC.text(scr, hs, Math.round((W - FC.textWidth(hs)) / 2), 164, P.v);
      }
    };
  };

  // ---------- Niveau 1 : espace profond ----------
  function niveau1(W) {
    return function () {
      var H = 180, bg = FC.bg('n1', W, H, [[0, '070722'], [0.55, '12123f'], [1, '24154f']]);
      var L = FC.stars(11, W, H, 140), tintc = col('12123f');
      function far(p) { var q = new Pix(p.w, p.h); q.blit(p, 0, 0); return q.tint(tintc, 0.55); }
      var f1 = far(FC.donutPlanet(9, 'p', 4)), f2 = far(FC.cakePlanet(6, 'g', 'W', 5)), f3 = far(FC.macaronPlanet(8, 'b', 'W'));
      var o1 = FC.cakePlanet(28, 'u', 'q', 7), o2 = FC.donutPlanet(22, 'P', 8);
      return {
        w: W, h: H, draw: function (scr, t) {
          scr.d.set(bg.d);
          FC.drawStars(scr, L, t, [3, 9, 20]);
          scr.blit(f1, wx(210, 5, t, W + 120, 40), 34);
          scr.blit(f2, wx(90, 5, t, W + 120, 40), 140);
          scr.blit(f3, wx(320, 5, t, W + 120, 40), 96);
          // obstacles du premier plan
          scr.blit(o1, wx(W - 70, 22, t, W + 200, 70), 92);
          scr.blit(o2, wx(W + 60, 22, t, W + 200, 70), 18);
          // héros + tirs
          var hx = 34, hy = 70, by = FC.hero(scr, hx, hy, t);
          FC.shots(scr, 'verm', hx + 40, hy + 14 + by, t, W - 60);
          // ennemis
          var fx = W - 70 - ((t * 18) % 40), fy = 52 + Math.sin(t * 3) * 10;
          scr.blit(spr('fly', Math.floor(t * 12) % 2), fx, fy);
          scr.blit(spr('fly', Math.floor(t * 12 + 1) % 2), W - 40, 120 + Math.sin(t * 2.4 + 1) * 12);
          var sx = W - 46, sy = 74 + Math.sin(t * 1.5) * 6;
          scr.blit(spr('spider', Math.floor(t * 4) % 2), sx, sy);
          var wph = (t * 0.6) % 1;
          scr.blit(spr('web', Math.floor(t * 6) % 4), sx - 12 - wph * (sx - hx - 40), sy + 4 + wph * (hy + 6 - sy));
          FC.burst(scr, fx + 4, fy + 6, t * 1.4);
          FC.popup(scr, '+100', fx + 2, fy - 6, t);
          // bonus
          scr.blit(spr('bDrag'), wx(W - 120, 14, t, W + 60, 20), 136 + Math.round(Math.sin(t * 3) * 2));
          FC.hud(scr, { score: 4250, lives: 3, level: 1, prog: 0.35, weapon: 0, ammo: [240, 18, 3, '~'] });
        }
      };
    };
  }
  FC.scenes.niveau1 = niveau1(320);
  FC.scenes.mobile = niveau1(390);

  // ---------- Niveau 2 : nébuleuse sucrée ----------
  FC.scenes.niveau2 = function () {
    var W = 320, H = 180, bg = FC.bg('n2', W, H, [[0, '1a0b3d'], [0.5, '3b1460'], [1, '5c1f6e']]);
    var L = FC.stars(21, W, H, 150);
    var neb = FC.mk('neb', function () {
      var p = new Pix(640, H), R = FC.rng(5);
      for (var i = 0; i < 16; i++) {
        var c = [col('ff6fb5'), col('4fd6d0'), col('b07bff')][i % 3], x = R() * 640, y = R() * H, r = 20 + R() * 40;
        p.ell(x, y, r * 1.6, r, function (px, py, dx, dy) {
          var d = dx * dx + dy * dy; if (d > 0.75 && (px + py) % 2) return null;
          return alpha(c, d < 0.3 ? 70 : 40);
        });
      }
      return p;
    });
    var giant = FC.giantPlanet(100);
    var obs = [FC.macaronPlanet(16, 'g', 'W'), FC.ringPlanet(12, 'b', 'P', 'W'), FC.donutPlanet(18, 'y', 12), FC.cakePlanet(14, 'P', 'W', 13)];
    return {
      w: W, h: H, draw: function (scr, t) {
        scr.d.set(bg.d);
        var nx = -Math.floor((t * 4) % 640);
        scr.blit(neb, nx, 0); scr.blit(neb, nx + 640, 0);
        FC.drawStars(scr, L, t, [4, 10, 22]);
        // la grosse planète approche par la droite
        scr.blit(giant, W - 92 - Math.round(Math.sin(t * 0.3) * 2), -22);
        scr.blit(obs[0], wx(170, 26, t, 420, 60), 120);
        scr.blit(obs[1], wx(250, 26, t, 420, 60), 30);
        scr.blit(obs[2], wx(380, 26, t, 420, 60), 84);
        scr.blit(obs[3], wx(60, 26, t, 420, 60), 22);
        for (var m = 0; m < 4; m++) scr.blit(FC.mint(3 + (m % 2) * 2, Math.floor(t * 6 + m) % 6), wx(80 + m * 97, 34, t, 420, 20), 40 + (m * 53) % 110);
        var hx = 30, hy = 76, by = FC.hero(scr, hx, hy, t);
        FC.shots(scr, 'drag', hx + 40, hy + 14 + by, t, W - 110);
        // guêpes en piqué + mouche + araignée
        var ph = (t * 0.5) % 1;
        scr.blit(spr('wasp', Math.floor(t * 14) % 2), 220 - ph * 150, 30 + ph * 50);
        scr.blit(spr('wasp', Math.floor(t * 14 + 1) % 2), 250 - ((ph + 0.5) % 1) * 150, 140 - ((ph + 0.5) % 1) * 40);
        scr.blit(spr('fly', Math.floor(t * 12) % 2), 190, 104 + Math.sin(t * 3) * 8);
        scr.blit(spr('spider', Math.floor(t * 4) % 2), 160, 56 + Math.sin(t * 2) * 6);
        FC.burst(scr, 196, 110, t * 1.3);
        if (t % 1 < 0.7) FC.text(scr, 'ATTERRISSAGE >', W - 66, 150, P.W, { outline: P.K });
        FC.hud(scr, { score: 18730, lives: 2, level: 2, prog: 0.92, weapon: 1, ammo: [96, 22, 3, '~'] });
      }
    };
  };
})(typeof window !== 'undefined' ? window : globalThis);
