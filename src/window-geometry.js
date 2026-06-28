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

  function normalizeArea(area) {
    return {
      x: round(area.x),
      y: round(area.y),
      width: Math.max(1, round(area.width)),
      height: Math.max(1, round(area.height))
    };
  }

  function areaForPoint(areas, point) {
    const list = (areas || []).filter(function (area) {
      return area && Number.isFinite(area.x) && Number.isFinite(area.y) &&
        Number.isFinite(area.width) && Number.isFinite(area.height);
    });
    if (!list.length) return { x: 0, y: 0, width: 1, height: 1 };

    const p = { x: round(point && point.x), y: round(point && point.y) };
    let nearest = normalizeArea(list[0]);
    let nearestDistance = Infinity;

    for (let i = 0; i < list.length; i++) {
      const area = normalizeArea(list[i]);
      const maxX = area.x + area.width;
      const maxY = area.y + area.height;
      if (p.x >= area.x && p.x < maxX && p.y >= area.y && p.y < maxY) return area;

      const dx = p.x < area.x ? area.x - p.x : p.x > maxX ? p.x - maxX : 0;
      const dy = p.y < area.y ? area.y - p.y : p.y > maxY ? p.y - maxY : 0;
      const distance = dx * dx + dy * dy;
      if (distance < nearestDistance) {
        nearest = area;
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  function dragAreaForPoint(displays, point) {
    return areaForPoint((displays || []).map(function (display) {
      return display && (display.bounds || display.workArea || display);
    }), point);
  }

  function sameArea(a, b) {
    return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
  }

  function insideRange(v, min, max) {
    return v >= min && v < max;
  }

  function mergeAreas(a, b) {
    const minX = Math.min(a.x, b.x);
    const minY = Math.min(a.y, b.y);
    const maxX = Math.max(a.x + a.width, b.x + b.width);
    const maxY = Math.max(a.y + a.height, b.y + b.height);
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  function canMergeDragAreas(a, b, point) {
    const p = { x: round(point && point.x), y: round(point && point.y) };
    const aRight = a.x + a.width;
    const bRight = b.x + b.width;
    const aBottom = a.y + a.height;
    const bBottom = b.y + b.height;
    const overlapXMin = Math.max(a.x, b.x);
    const overlapXMax = Math.min(aRight, bRight);
    const overlapYMin = Math.max(a.y, b.y);
    const overlapYMax = Math.min(aBottom, bBottom);

    if ((aRight === b.x || bRight === a.x) && insideRange(p.y, overlapYMin, overlapYMax)) return true;
    if ((aBottom === b.y || bBottom === a.y) && insideRange(p.x, overlapXMin, overlapXMax)) return true;
    return false;
  }

  function dragAreaForBounds(displays, bounds, point) {
    const areas = (displays || []).map(function (display) {
      return display && (display.bounds || display.workArea || display);
    });
    const current = areaForPoint(areas, {
      x: round(bounds.x) + round(bounds.width) / 2,
      y: round(bounds.y) + round(bounds.height) / 2
    });
    const cursor = areaForPoint(areas, point);
    if (sameArea(current, cursor)) return cursor;
    if (canMergeDragAreas(current, cursor, point)) return mergeAreas(current, cursor);
    return cursor;
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
    const width = Math.max(1, round(bounds.width));
    const height = Math.max(1, round(bounds.height));
    const cursorPoint = {
      x: round(cursor.x),
      y: round(cursor.y)
    };
    const currentOffset = {
      x: clamp(round(offset.x), 0, width - 1),
      y: clamp(round(offset.y), 0, height - 1)
    };
    const desired = {
      x: cursorPoint.x - currentOffset.x,
      y: cursorPoint.y - currentOffset.y,
      width: width,
      height: height
    };
    const next = clampWindowBounds({
      x: desired.x,
      y: desired.y,
      width: desired.width,
      height: desired.height
    }, area);

    return {
      bounds: next,
      offset: {
        x: next.x === desired.x ? currentOffset.x : clamp(cursorPoint.x - next.x, 0, next.width - 1),
        y: next.y === desired.y ? currentOffset.y : clamp(cursorPoint.y - next.y, 0, next.height - 1)
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
    areaForPoint: areaForPoint,
    dragAreaForPoint: dragAreaForPoint,
    dragAreaForBounds: dragAreaForBounds,
    resolveWalkPlan: resolveWalkPlan,
    resolveDragBounds: resolveDragBounds,
    getSpeechAnchor: getSpeechAnchor
  };
});
