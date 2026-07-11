'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const momonga = require(path.join(ROOT, 'src', 'pets', 'momonga'));
const vault = require(path.join(ROOT, 'src', 'asset-vault'));

assert.deepStrictEqual(momonga.actions.roll, {
  base: 'images/momonga_rolling/momonga_rolling_',
  count: 11,
  pad: 2,
  ext: '.png',
  start: 1,
  fps: 11,
  loops: 2,
  scale: 1.2,
  speech: { zh: '不要！不要！', en: 'No! No!', ja: 'やだ！やだ！' }
});

const pak = JSON.parse(vault.decrypt(fs.readFileSync(path.join(ROOT, 'src', 'assets.pak'))).toString('utf8'));
const expectedSize = { w: 1460, h: 1189 };

function topLeftAlpha(png) {
  let position = 8;
  const idat = [];
  while (position < png.length) {
    const length = png.readUInt32BE(position); position += 4;
    const type = png.toString('ascii', position, position + 4); position += 4;
    const data = png.subarray(position, position + length); position += length + 4;
    if (type === 'IDAT') idat.push(data);
    if (type === 'IEND') break;
  }
  return zlib.inflateSync(Buffer.concat(idat))[4];
}

for (let index = 0; index < momonga.actions.roll.count; index++) {
  const frame = String(index + momonga.actions.roll.start).padStart(momonga.actions.roll.pad, '0');
  const asset = `${momonga.actions.roll.base}${frame}${momonga.actions.roll.ext}`;
  assert(pak[asset], `${asset} should be packed into assets.pak`);

  const png = Buffer.from(pak[asset], 'base64');
  assert.strictEqual(png.toString('ascii', 1, 4), 'PNG', `${asset} should be a PNG`);
  assert.deepStrictEqual({ w: png.readUInt32BE(16), h: png.readUInt32BE(20) }, expectedSize,
    `${asset} should share the rolling canvas`);
  assert.strictEqual(png[25], 6, `${asset} should be RGBA so its background is transparent`);
  assert.strictEqual(topLeftAlpha(png), 0, `${asset} should have a transparent background corner`);
}

console.log('momonga rolling animation ok');
