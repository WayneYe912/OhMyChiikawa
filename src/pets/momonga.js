/*
 * Momonga (莫莫伽) — front-standing pose. It uses a transparent body layer plus
 * two clipped ear overlays, so it can blink and wiggle each ear like the other
 * front-facing pets.
 *
 * Artwork is processed from src/images/momonga.jpeg (yellow background removed,
 * ears cropped into transparent overlay layers) and ships encrypted in
 * src/assets.pak (rebuild with `chiikawa pack`).
 */
(function () {
  'use strict';
  var PET = {
    id: 'momonga',
    name: 'Momonga',
    nameZh: '莫莫伽',
    nameJa: 'モモンガ',
    kind: 'image-layered',
    aspect: 1,
    natural: { w: 1080, h: 1080 },
    renderScale: 0.82,
    articulated: true,
    animateEars: false,
    body: 'images/momonga/body.png',
    ears: [
      { src: 'images/momonga/ear-left.png', side: 'l',
        box: { x: 0.09259, y: 0.04167, w: 0.28704, h: 0.28704 }, origin: { x: 0.68, y: 0.90 } },
      { src: 'images/momonga/ear-right.png', side: 'r',
        box: { x: 0.47222, y: 0.02315, w: 0.29630, h: 0.30556 }, origin: { x: 0.24, y: 0.88 } }
    ],
    eyes: [
      { x: 0.27407, y: 0.42130, w: 0.11667, h: 0.11111 },
      { x: 0.53519, y: 0.42130, w: 0.11667, h: 0.11111 }
    ],
    lid: 'rgb(255,255,255)',
    speech: {
      zh: ['哼哼～', '诶嘿嘿', '可爱吧？', '我也要！'],
      en: ['Hehe~', 'Ehehe', 'Cute, right?', 'Me too!'],
      ja: ['ふふん～', 'えへへ', 'かわいいでしょ？', 'ぼくも！']
    }
  };
  var api = (typeof window !== 'undefined') ? window : globalThis;
  api.PetRegistry = api.PetRegistry || {
    _pets: {}, register: function (p) { this._pets[p.id] = p; return p; },
    get: function (id) { return this._pets[id]; }, ids: function () { return Object.keys(this._pets); }
  };
  api.PetRegistry.register(PET);
  if (typeof module !== 'undefined' && module.exports) { module.exports = PET; }
})();
