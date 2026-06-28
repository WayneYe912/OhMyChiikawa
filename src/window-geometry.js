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

  function mergeAreas(areas) {
    const list = (areas || []).filter(function (area) {
      return area && Number.isFinite(area.x) && Number.isFinite(area.y) &&
        Number.isFinite(area.width) && Number.isFinite(area.height);
    });
    if (!list.length) return { x: 0, y: 0, width: 1, height: 1 };

    let minX = round(list[0].x);
    let minY = round(list[0].y);
    let maxX = minX + Math.max(0, round(list[0].width));
    let maxY = minY + Math.max(0, round(list[0].height));

    for (let i = 1; i < list.length; i++) {
      const x = round(list[i].x);
      const y = round(list[i].y);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + Math.max(0, round(list[i].width)));
      maxY = Math.max(maxY, y + Math.max(0, round(list[i].height)));
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    };
  }

  function resolveWalkPlan(bounds, area, preferredDir, distance, minDistance) {
    const current = clampWindowBounds(bounds, area);
    const minX = round(area.x);
    const maxX = minX + Math.max(0, round(area.width) - current.width);
    const dir = preferredDir < 0 ? -1 : 1;
    const room = dir > 0 ? maxX - current.x : current.x - minX;
    const travel = Math.min(Math.max(0, round(distance)), Math.max(0, room));
    const minTravel = Math.max(1, round(minDistance || 1));

    if (travel < minTravel) return null;
    return {
      bounds: current,
      targetX: current.x + dir * travel,
      dir: dir
    };
  }

  function resolveDragBounds(bounds, area, cursor, offset) {
    const next = clampWindowBounds({
      x: round(cursor.x) - round(offset.x),
      y: round(cursor.y) - round(offset.y),
      width: bounds.width,
      height: bounds.height
    }, area);

    return {
      bounds: next,
      offset: {
        x: clamp(round(offset.x), 0, next.width),
        y: clamp(round(offset.y), 0, next.height)
      }
    };
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
    mergeAreas: mergeAreas,
    resolveWalkPlan: resolveWalkPlan,
    resolveDragBounds: resolveDragBounds,
    getSpeechAnchor: getSpeechAnchor
  };
});
