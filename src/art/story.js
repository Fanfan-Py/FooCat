/* FooCat – histoire illustrée entre le niveau 5 et le niveau 6 (4 cases de 150 x 84) */
(function (root) {
  'use strict';
  var FC = root.FooCat, P = FC.P, Pix = FC.Pix, col = FC.col, alpha = FC.alpha, spr = FC.spr;
  FC.scenes = FC.scenes || {};
  // ---------- histoire illustrée (4 cases de 150 x 84) ----------
  function bottle(p, x, y) {
    p.ell(x + 8, y + 4, 8, 4, alpha(col('7fe39a'), 200)); p.rect(x + 15, y + 2, 5, 4, alpha(col('7fe39a'), 220)); p.rect(x + 20, y + 2, 2, 4, P.D);
    p.rect(x + 3, y + 3, 9, 3, col('fff3c4')); p.put(x + 4, y + 2, P.W);
  }
  FC.scenes.story1 = function () {
    var bg = FC.bg('st1', 150, 84, [[0, '0b0d1c'], [1, '2a1530']]);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d);
        var boss = spr('boss', 0), dark = FC.mk('bossKO', function () { var q = new Pix(boss.w, boss.h); q.blit(boss, 0, 0); return q.tint(col('1a1020'), 0.55); });
        scr.blit(dark, 40, 26);
        for (var k = 0; k < 6; k++) { var ph = (t * 0.5 + k / 6) % 1; scr.ell(60 + k * 12, 60 - ph * 50, 4 + ph * 6, 3 + ph * 4, alpha(col('8a8aa0'), 120 * (1 - ph))); }
        FC.hero(scr, 10 + ((t * 20) % 40), 12, t);
        FC.text(scr, 'KO', 104, 40, P.y, { sc: 2, outline: P.K });
      }
    };
  };
  FC.scenes.story2 = function () {
    var bg = FC.bg('st2', 150, 84, [[0, '050a1f'], [1, '1d3a6e']]), L = FC.stars(9, 150, 84, 60);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d); FC.drawStars(scr, L, t, [2, 5, 10]);
        FC.hero(scr, 20, 28, t);
        bottle(scr, 92, 40 + Math.round(Math.sin(t * 2) * 3));
        if (t % 1.4 < 1) FC.text(scr, 'AU SECOURS !', 78, 60, P.W, { outline: P.P });
      }
    };
  };
  FC.scenes.story3 = function () {
    var bg = FC.bg('st3', 150, 84, [[0, '050a1f'], [1, '0d3360']]), L = FC.stars(19, 150, 84, 40), ocean = FC.oceanPlanet(34);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d); FC.drawStars(scr, L, t, [1, 3, 6]);
        scr.blit(ocean, 32, 0);
        var sk = spr('skelBoss', Math.floor(t * 2) % 2), sh = FC.mk('skelShadow', function () { var q = new Pix(sk.w, sk.h); q.blit(sk, 0, 0); return q.tint(col('071a33'), 0.75); });
        scr.blit(sh.scale ? sh : sh, 44, 30, false, 0.55);
        scr.ell(58, 50, 3, 3, (Math.floor(t * 3) % 2) ? col('6dff9a') : col('2f7f50'));
      }
    };
  };
  FC.scenes.story4 = function () {
    var bg = FC.bg('st4', 150, 84, [[0, '0d3360'], [0.5, '1d7fb8'], [1, '0e4f8a']]);
    return {
      w: 150, h: 84, draw: function (scr, t) {
        scr.d.set(bg.d);
        for (var x = 0; x < 150; x++) { var h = 40 + Math.round(Math.sin(x * 0.12 + t * 3) * 2); scr.put(x, h, P.W); scr.rect(x, h + 1, 1, 84 - h, alpha(col('0a2a55'), 120)); }
        var hx = 50 + Math.sin(t) * 4, hy = 28 + ((t * 10) % 14);
        FC.hero(scr, hx, hy, t);
        for (var k = 0; k < 10; k++) { var a = k / 10 * Math.PI, d = 10 + ((t * 30 + k * 5) % 20); scr.put(hx + 20 + Math.cos(a) * d, 40 - Math.sin(a) * d * 0.6, P.W); }
        for (var b = 0; b < 6; b++) { var bp = (t * 0.6 + b / 6) % 1; scr.ell(hx + 10 + b * 4, 80 - bp * 36, 1.5, 1.5, alpha(P.W, 200 * (1 - bp))); }
      }
    };
  };

})(typeof window !== 'undefined' ? window : globalThis);
