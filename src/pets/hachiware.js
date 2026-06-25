/*
 * Hachiware (小八) — the cheerful blue-eared cat, front-standing pose. Like
 * chiikawa it ships as a body layer plus two ear layers and CSS eyelids, so it
 * can blink and wiggle each ear on its own. It has no hand-rolling action.
 *
 * The blue "ears" are one connected fringe rather than two separate appendages,
 * so the body layer keeps the WHOLE character (blue included) and the ear layers
 * are copies that sit exactly on top. That way an ear wiggle reveals the body's
 * own blue underneath (a faint same-colour ghost at most) instead of punching a
 * transparent hole through the head — far cleaner for a joined-up hairpiece.
 *
 * Artwork is sliced from src/images/hachiware.png (baked light-grey background
 * removed via the enclosing outline, ears cut into their own transparent layers)
 * and ships encrypted in src/assets.pak (rebuild with `chiikawa pack`).
 */
(function () {
  'use strict';
  var PET = {
    id: 'hachiware',
    name: 'Hachiware',
    nameZh: '小八',
    kind: 'image-layered',
    aspect: 720 / 942,
    natural: { w: 720, h: 942 },
    // Round cat-blob like chiikawa: scale its display height down so it doesn't
    // tower over the tall usagi at the same Size setting.
    renderScale: 0.8,
    articulated: true,
    body: 'images/hachiware/body.png',
    ears: [
      { src: 'images/hachiware/ear-left.png',  side: 'l',
        box: { x: 0.10833, y: 0.01699, w: 0.31944, h: 0.23248 }, origin: { x: 0.43043, y: 1.0 } },
      { src: 'images/hachiware/ear-right.png', side: 'r',
        box: { x: 0.42778, y: 0.00212, w: 0.43333, h: 0.24841 }, origin: { x: 0.52244, y: 1.0 } }
    ],
    eyes: [
      { x: 0.21250, y: 0.34926, w: 0.13333, h: 0.10722 },
      { x: 0.50000, y: 0.34820, w: 0.13750, h: 0.10722 }
    ],
    lid: 'rgb(241,241,241)',
    // Random chatter shown on click / idle (overrides the renderer default).
    // Per-language: the renderer picks zh/en based on the current UI language.
    speech: {
      zh: ['完全搞不懂～', '嘿嘿嘿嘿～', '什么什么！', '没问题的！'],
      en: ['I don\'t know~', 'Hehehehe~', 'What?', 'No problem!']
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
