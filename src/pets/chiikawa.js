/*
 * Chiikawa (吉伊) — the round little critter, front-standing pose. Like Usagi it
 * ships as a body layer plus two separate ear layers and CSS eyelids, so it can
 * blink and wiggle each ear on its own. It has no hand-rolling action.
 *
 * Artwork is sliced from src/images/chiikawa.jpeg (background removed, ears cut
 * into their own transparent layers) and ships encrypted in src/assets.pak
 * (rebuild with `chiikawa pack`).
 */
(function () {
  'use strict';
  var PET = {
    id: 'chiikawa',
    name: 'Chiikawa',
    nameZh: '吉伊',
    nameJa: 'ちいかわ',
    kind: 'image-layered',
    aspect: 650 / 786,
    natural: { w: 650, h: 786 },
    // Visual-size match: chiikawa is a round blob, usagi a tall rabbit, so at equal
    // heights chiikawa reads ~1.65x bigger. Scale its display height down so both
    // pets occupy a similar on-screen size at the same Size setting.
    renderScale: 0.78,
    articulated: true,
    body: 'images/chiikawa/body.png',
    ears: [
      { src: 'images/chiikawa/ear-left.png',  side: 'l',
        box: { x: 0.19077, y: 0.00763, w: 0.14154, h: 0.08397 }, origin: { x: 0.49457, y: 1.0 } },
      { src: 'images/chiikawa/ear-right.png', side: 'r',
        box: { x: 0.67231, y: 0.00254, w: 0.14000, h: 0.08906 }, origin: { x: 0.49451, y: 1.0 } }
    ],
    eyes: [
      { x: 0.25538, y: 0.31552, w: 0.10923, h: 0.09415 },
      { x: 0.55692, y: 0.31043, w: 0.11385, h: 0.09669 }
    ],
    lid: 'rgb(255,255,255)',
    // Random chatter shown on click / idle (overrides the renderer default).
    // Per-language: the renderer picks zh/en/ja based on the current UI language.
    speech: {
      zh: ['Hmm！', '诶？', '呀𠳐𠳐～', '嘿～', '呜'],
      en: ['Hmm!', 'Eh?', 'Yahaha~', 'Hey~', 'Woo'],
      ja: ['んー！', 'えっ？', 'やはは～', 'やぁ～', 'うぅ']
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
