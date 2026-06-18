/*
 * Usagi (roll) — a seamless image-sequence pet whose resting pose is frame 1 of
 * the hand-rolling sequence (paws up in front). Idle holds that frame and the
 * roll plays from/to it, so the main (breathing) animation and the roll share
 * the same artwork -> the transition is seamless with no pop.
 *
 * The 11 frames (images/usagi_roll/usagi_roll_01..11.png) are re-canvased to
 * 600x910 — the SAME size and rabbit framing as the standing body.png — so the
 * rolling rabbit is the same on-screen size as the main/standing pose and the
 * idle<->roll (and standing pet's) switch stays seamless. They already encode one
 * complete gesture with internal repetition: forward-facing on frame 1/idle,
 * paws roll a couple of times, then a happy finale (frame 11) before settling
 * back. The gesture loops TWICE so the hands keep rolling for ~2s per trigger.
 * Launch with:  npm start -- --pet=usagi-roll
 */
(function () {
  'use strict';
  var PET = {
    id: 'usagi-roll',
    name: 'Usagi (roll)',
    nameZh: '兔子 Usagi（转手版）',
    kind: 'image-sequence',
    aspect: 600 / 910,               // re-canvased to match body.png
    natural: { w: 600, h: 910 },
    frames: { base: 'images/usagi_roll/usagi_roll_', count: 11, pad: 2, ext: '.png', start: 1 },
    idle: 0,                         // frame 1 (usagi_roll_01) is the resting pose
    eyes: [                          // measured from normalized usagi_roll_01 pupils
      { x: 0.284, y: 0.481, w: 0.100, h: 0.076 },
      { x: 0.511, y: 0.495, w: 0.100, h: 0.076 }
    ],
    lid: 'rgb(252,244,231)',         // matches the face fill in the new art
    actions: { roll: { fps: 11, loops: 2 } }   // 11 frames / 11 fps x 2 loops = 2.0s
  };
  var api = (typeof window !== 'undefined') ? window : globalThis;
  api.PetRegistry = api.PetRegistry || {
    _pets: {}, register: function (p) { this._pets[p.id] = p; return p; },
    get: function (id) { return this._pets[id]; }, ids: function () { return Object.keys(this._pets); }
  };
  api.PetRegistry.register(PET);
  if (typeof module !== 'undefined' && module.exports) { module.exports = PET; }
})();
