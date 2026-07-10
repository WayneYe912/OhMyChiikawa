/*
 * Pixel-accurate hit testing for moving ear layers.
 *
 * Ear artwork lives in rectangular PNG crops, but most pixels in those crops
 * are transparent. Convert the pointer back through the current CSS part
 * transform, then accept only an opaque pixel from the ear's own alpha canvas.
 */
(function (root) {
  'use strict';

  function localPoint(ear, u, v) {
    var b = ear.box, o = ear.origin || { x: 0.5, y: 0.5 };
    if (!b || !b.w || !b.h) return null;
    var ox = b.x + o.x * b.w, oy = b.y + o.y * b.h;
    var dx = u - ox, dy = v - oy;
    if (ear.skew) dx -= Math.tan(ear.skew * Math.PI / 180) * dy;
    var rad = -(ear.angle || 0) * Math.PI / 180;
    var cos = Math.cos(rad), sin = Math.sin(rad);
    var ru = ox + cos * dx - sin * dy;
    var rv = oy + sin * dx + cos * dy;
    var lu = (ru - b.x) / b.w, lv = (rv - b.y) / b.h;
    if (lu < 0 || lu >= 1 || lv < 0 || lv >= 1) return null;
    return { u: lu, v: lv };
  }

  function regionAt(earParts, u, v, threshold) {
    var minAlpha = threshold == null ? 20 : threshold;
    for (var i = earParts.length - 1; i >= 0; i--) { // topmost DOM layer first
      var ear = earParts[i];
      if (!ear.hitOK || !ear.hitCtx || !ear.hitW || !ear.hitH) continue;
      var p = localPoint(ear, u, v);
      if (!p) continue;
      var px = Math.min(ear.hitW - 1, Math.floor(p.u * ear.hitW));
      var py = Math.min(ear.hitH - 1, Math.floor(p.v * ear.hitH));
      try {
        if (ear.hitCtx.getImageData(px, py, 1, 1).data[3] > minAlpha)
          return ear.side === 'l' ? 'ear-l' : 'ear-r';
      } catch (e) { ear.hitOK = false; }
    }
    return null;
  }

  var api = { localPoint: localPoint, regionAt: regionAt };
  root.PetEarHit = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
