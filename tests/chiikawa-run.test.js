'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const chiikawa = require(path.join(ROOT, 'src', 'pets', 'chiikawa'));
const vault = require(path.join(ROOT, 'src', 'asset-vault'));

assert.deepStrictEqual(chiikawa.walk, {
  base: 'images/chiikawa_run/chiikawa_run_',
  count: 12,
  pad: 2,
  ext: '.png',
  start: 2,
  fps: 11,
  offsetY: [-2, -1, 0, 0, -1, -2, -1, 0, 0, 0, 0, -1]
});
assert.strictEqual(chiikawa.walk.offsetY.length, chiikawa.walk.count, 'each run frame should have a y offset');
assert.deepStrictEqual(
  {
    '02': chiikawa.walk.offsetY[0],
    '03': chiikawa.walk.offsetY[1],
    '04': chiikawa.walk.offsetY[2],
    '05': chiikawa.walk.offsetY[3],
    '06': chiikawa.walk.offsetY[4],
    '07': chiikawa.walk.offsetY[5],
    '08': chiikawa.walk.offsetY[6],
    '09': chiikawa.walk.offsetY[7],
    '10': chiikawa.walk.offsetY[8],
    '11': chiikawa.walk.offsetY[9],
    '12': chiikawa.walk.offsetY[10],
    '13': chiikawa.walk.offsetY[11]
  },
  {
    '02': -2, '03': -1, '04': 0, '05': 0,
    '06': -1, '07': -2, '08': -1, '09': 0,
    '10': 0, '11': 0, '12': 0, '13': -1
  }
);

const pak = JSON.parse(vault.decrypt(fs.readFileSync(path.join(ROOT, 'src', 'assets.pak'))).toString('utf8'));
assert(!pak['images/chiikawa_run/chiikawa_run_01.png'], 'assets.pak should not keep chiikawa run frame 01 after it was removed');
const expected = [];
for (let i = 0; i < chiikawa.walk.count; i++) {
  expected.push(`${chiikawa.walk.base}${String(i + chiikawa.walk.start).padStart(chiikawa.walk.pad, '0')}${chiikawa.walk.ext}`);
}

let size = null;
for (const asset of expected) {
  assert(pak[asset], `${asset} should be packed into assets.pak`);
  const png = Buffer.from(pak[asset], 'base64');
  assert.strictEqual(png.toString('ascii', 1, 4), 'PNG', `${asset} should be a PNG`);
  const current = {
    w: png.readUInt32BE(16),
    h: png.readUInt32BE(20),
    colorType: png[25]
  };
  assert.strictEqual(current.colorType, 6, `${asset} should be RGBA so the background is transparent`);
  assert.deepStrictEqual({ w: current.w, h: current.h }, chiikawa.natural, `${asset} should match chiikawa's standing canvas`);
  if (!size) size = { w: current.w, h: current.h };
  assert.deepStrictEqual({ w: current.w, h: current.h }, size, `${asset} should share the run-cycle canvas`);
}

console.log('chiikawa run animation ok');
