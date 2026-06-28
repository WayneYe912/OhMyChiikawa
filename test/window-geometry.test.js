const assert = require('node:assert/strict');
const test = require('node:test');

const geometry = require('../src/window-geometry');

test('clampWindowBounds keeps a normal window inside the work area', () => {
  const area = { x: 0, y: 0, width: 800, height: 600 };
  const bounds = { x: -120, y: 590, width: 240, height: 320 };

  assert.deepEqual(geometry.clampWindowBounds(bounds, area), {
    x: 0,
    y: 280,
    width: 240,
    height: 320
  });
});

test('clampWindowBounds supports displays with non-zero origins', () => {
  const area = { x: -1920, y: 32, width: 1920, height: 1048 };
  const bounds = { x: -2100, y: -50, width: 260, height: 360 };

  assert.deepEqual(geometry.clampWindowBounds(bounds, area), {
    x: -1920,
    y: 32,
    width: 260,
    height: 360
  });
});

test('resolveWalkPlan skips a rightward walk when already at the right edge', () => {
  const area = { x: 0, y: 0, width: 800, height: 600 };
  const bounds = { x: 560, y: 100, width: 240, height: 320 };

  assert.equal(geometry.resolveWalkPlan(bounds, area, 1, 180, 3), null);
});

test('resolveWalkPlan keeps a walk direction instead of flipping it at an edge', () => {
  const area = { x: 0, y: 0, width: 800, height: 600 };
  const bounds = { x: 540, y: 100, width: 240, height: 320 };

  assert.deepEqual(geometry.resolveWalkPlan(bounds, area, 1, 180, 3), {
    bounds: { x: 540, y: 100, width: 240, height: 320 },
    targetX: 560,
    dir: 1
  });
});

test('resolveDragBounds keeps the original drag offset while clamped at the right edge', () => {
  const area = { x: 0, y: 0, width: 800, height: 600 };
  const bounds = { x: 400, y: 100, width: 240, height: 320 };
  const offset = { x: 50, y: 40 };

  const edge = geometry.resolveDragBounds(bounds, area, { x: 799, y: 140 }, offset);
  assert.deepEqual(edge, {
    bounds: { x: 560, y: 100, width: 240, height: 320 },
    offset: { x: 50, y: 40 }
  });

  const back = geometry.resolveDragBounds(edge.bounds, area, { x: 789, y: 140 }, edge.offset);
  assert.deepEqual(back, {
    bounds: { x: 560, y: 100, width: 240, height: 320 },
    offset: { x: 50, y: 40 }
  });
});

test('resolveDragBounds can cross from one display into an adjacent display', () => {
  const area = geometry.areaForPoint([
    { x: 0, y: 0, width: 800, height: 600 },
    { x: 800, y: 0, width: 1024, height: 600 }
  ], { x: 850, y: 140 });
  const bounds = { x: 560, y: 100, width: 240, height: 320 };
  const offset = { x: 50, y: 40 };

  assert.deepEqual(geometry.resolveDragBounds(bounds, area, { x: 850, y: 140 }, offset), {
    bounds: { x: 800, y: 100, width: 240, height: 320 },
    offset: { x: 50, y: 40 }
  });
});

test('resolveDragBounds clamps to the cursor display instead of a taller adjacent display', () => {
  const displays = [
    { x: 0, y: 0, width: 800, height: 600 },
    { x: 800, y: 0, width: 1024, height: 900 }
  ];
  const area = geometry.areaForPoint(displays, { x: 400, y: 599 });
  const bounds = { x: 300, y: 260, width: 240, height: 320 };
  const offset = { x: 50, y: 40 };

  assert.deepEqual(geometry.resolveDragBounds(bounds, area, { x: 400, y: 599 }, offset), {
    bounds: { x: 350, y: 280, width: 240, height: 320 },
    offset: { x: 50, y: 40 }
  });
});

test('dragAreaForPoint uses display bounds so a bottom taskbar does not push the pet upward', () => {
  const displays = [{
    bounds: { x: 0, y: 0, width: 800, height: 600 },
    workArea: { x: 0, y: 0, width: 800, height: 560 }
  }];
  const area = geometry.dragAreaForPoint(displays, { x: 400, y: 599 });
  const bounds = { x: 300, y: 240, width: 240, height: 320 };
  const offset = { x: 50, y: 40 };

  assert.deepEqual(geometry.resolveDragBounds(bounds, area, { x: 400, y: 599 }, offset), {
    bounds: { x: 350, y: 280, width: 240, height: 320 },
    offset: { x: 50, y: 40 }
  });
});

test('getSpeechAnchor follows the pet box and animated body offset', () => {
  const box = { left: 48, top: 60, w: 200, h: 200 };

  assert.deepEqual(geometry.getSpeechAnchor(box, { x: 12.4, y: 25.2 }), {
    left: 160,
    top: 29
  });
});

test('getSpeechAnchor keeps the bubble from moving above the transparent window', () => {
  const box = { left: 48, top: 60, w: 200, h: 200 };

  assert.deepEqual(geometry.getSpeechAnchor(box, { x: 0, y: -42 }), {
    left: 148,
    top: 3
  });
});
