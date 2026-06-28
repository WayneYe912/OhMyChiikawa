(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.PetGeometry = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function round(n) {
    const v = Math.round(Number(n) || 0);
    return Object.is(v, -0) ? 0 : v;
  }

  function clamp(v, min, max) {
    if (max < min) max = min;
    return Math.min(Math.max(v, min), max);
  }

  function clampWindowBounds(bounds, area) {
    const width = Math.max(1, round(bounds.width));
    const height = Math.max(1, round(bounds.height));
    const minX = round(area.x);
    const minY = round(area.y);
    const maxX = minX + Math.max(0, round(area.width) - width);
    const maxY = minY + Math.max(0, round(area.height) - height);

    return {
      x: clamp(round(bounds.x), minX, maxX),
      y: clamp(round(bounds.y), minY, maxY),
      width: width,
      height: height
    };
  }

  function resolveWalkTargetX(bounds, area, desiredX) {
    return clampWindowBounds({
      x: desiredX,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height
    }, area).x;
  }

  function getSpeechAnchor(box, motion) {
    const dx = motion && Number.isFinite(motion.x) ? motion.x : 0;
    const dy = motion && Number.isFinite(motion.y) ? motion.y : 0;
    return {
      left: round(box.left + box.w / 2 + dx),
      top: Math.max(3, round(box.top + dy - box.h * 0.28))
    };
  }

  return {
    clampWindowBounds: clampWindowBounds,
    resolveWalkTargetX: resolveWalkTargetX,
    getSpeechAnchor: getSpeechAnchor
  };
});
