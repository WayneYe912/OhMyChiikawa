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

test('resolveWalkTargetX clamps a stroll target to the available horizontal range', () => {
  const area = { x: 0, y: 0, width: 800, height: 600 };
  const bounds = { x: 620, y: 100, width: 220, height: 300 };

  assert.equal(geometry.resolveWalkTargetX(bounds, area, bounds.x + 260), 580);
});

test('resolveDragBounds rebases the drag offset after clamping at the right edge', () => {
  const area = { x: 0, y: 0, width: 800, height: 600 };
  const bounds = { x: 400, y: 100, width: 240, height: 320 };
  const offset = { x: 50, y: 40 };

  const edge = geometry.resolveDragBounds(bounds, area, { x: 799, y: 140 }, offset);
  assert.deepEqual(edge, {
    bounds: { x: 560, y: 100, width: 240, height: 320 },
    offset: { x: 239, y: 40 }
  });

  const back = geometry.resolveDragBounds(edge.bounds, area, { x: 789, y: 140 }, edge.offset);
  assert.deepEqual(back, {
    bounds: { x: 550, y: 100, width: 240, height: 320 },
    offset: { x: 239, y: 40 }
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
