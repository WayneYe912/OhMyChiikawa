'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const ROOT = path.join(__dirname, '..');
const vault = require(path.join(ROOT, 'src', 'asset-vault'));
const earHit = require(path.join(ROOT, 'src', 'ear-hit'));
const pets = [
  require(path.join(ROOT, 'src', 'pets', 'hachiware')),
  require(path.join(ROOT, 'src', 'pets', 'momonga'))
];
const pak = JSON.parse(vault.decrypt(fs.readFileSync(path.join(ROOT, 'src', 'assets.pak'))).toString('utf8'));

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodeRgbaPng(buf) {
  assert.strictEqual(buf.toString('ascii', 1, 4), 'PNG', 'asset should be a PNG');
  let pos = 8, width, height, bitDepth, colorType, interlace;
  const idat = [];
  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos); pos += 4;
    const type = buf.toString('ascii', pos, pos + 4); pos += 4;
    const data = buf.subarray(pos, pos + length); pos += length + 4; // data + CRC
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
  }
  assert.strictEqual(bitDepth, 8, 'ear PNG should use 8-bit channels');
  assert.strictEqual(colorType, 6, 'ear PNG should be RGBA');
  assert.strictEqual(interlace, 0, 'ear PNG should be non-interlaced');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const bpp = 4, stride = width * bpp;
  const pixels = Buffer.alloc(stride * height);
  let src = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[src++];
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? pixels[y * stride + x - bpp] : 0;
      const b = y ? pixels[(y - 1) * stride + x] : 0;
      const c = y && x >= bpp ? pixels[(y - 1) * stride + x - bpp] : 0;
      let predictor = 0;
      if (filter === 1) predictor = a;
      else if (filter === 2) predictor = b;
      else if (filter === 3) predictor = Math.floor((a + b) / 2);
      else if (filter === 4) predictor = paeth(a, b, c);
      else assert.strictEqual(filter, 0, `unsupported PNG filter ${filter}`);
      pixels[y * stride + x] = (raw[src++] + predictor) & 255;
    }
  }
  return { width, height, pixels };
}

function asset(name) {
  assert(pak[name], `${name} should be packed`);
  return decodeRgbaPng(Buffer.from(pak[name], 'base64'));
}

function rgbaAt(img, x, y) {
  const i = (y * img.width + x) * 4;
  return [img.pixels[i], img.pixels[i + 1], img.pixels[i + 2], img.pixels[i + 3]];
}

function componentRatio(img, threshold) {
  const n = img.width * img.height;
  const mask = new Uint8Array(n), seen = new Uint8Array(n);
  let total = 0, largest = 0;
  for (let i = 0; i < n; i++) {
    if (img.pixels[i * 4 + 3] >= threshold) { mask[i] = 1; total++; }
  }
  for (let start = 0; start < n; start++) {
    if (!mask[start] || seen[start]) continue;
    let size = 0;
    const stack = [start]; seen[start] = 1;
    while (stack.length) {
      const i = stack.pop(), x = i % img.width, y = Math.floor(i / img.width);
      size++;
      if (x && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; stack.push(i - 1); }
      if (x + 1 < img.width && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; stack.push(i + 1); }
      if (y && mask[i - img.width] && !seen[i - img.width]) { seen[i - img.width] = 1; stack.push(i - img.width); }
      if (y + 1 < img.height && mask[i + img.width] && !seen[i + img.width]) { seen[i + img.width] = 1; stack.push(i + img.width); }
    }
    largest = Math.max(largest, size);
  }
  return total ? largest / total : 0;
}

function outlineCoverage(img) {
  const w = img.width, h = img.height;
  const solid = new Uint8Array(w * h), integral = new Int32Array((w + 1) * (h + 1));
  for (let y = 0; y < h; y++) {
    let row = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const alpha = img.pixels[i + 3];
      solid[y * w + x] = alpha >= 64 ? 1 : 0;
      const dark = alpha >= 128 && Math.max(img.pixels[i], img.pixels[i + 1], img.pixels[i + 2]) <= 110;
      row += dark ? 1 : 0;
      integral[(y + 1) * (w + 1) + x + 1] = integral[y * (w + 1) + x + 1] + row;
    }
  }
  function darkNear(x, y) {
    const x0 = Math.max(0, x - 8), y0 = Math.max(0, y - 8);
    const x1 = Math.min(w, x + 9), y1 = Math.min(h, y + 9);
    return integral[y1 * (w + 1) + x1] - integral[y0 * (w + 1) + x1] -
      integral[y1 * (w + 1) + x0] + integral[y0 * (w + 1) + x0] > 0;
  }
  let boundary = 0, covered = 0;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    if (!solid[i]) continue;
    if (x && x + 1 < w && y && y + 1 < h && solid[i - 1] && solid[i + 1] && solid[i - w] && solid[i + w]) continue;
    boundary++;
    if (darkNear(x, y)) covered++;
  }
  return boundary ? covered / boundary : 0;
}

function placedAlpha(ear, box, pet, x, y) {
  const bx = Math.round(box.x * pet.natural.w), by = Math.round(box.y * pet.natural.h);
  const lx = x - bx, ly = y - by;
  if (lx < 0 || ly < 0 || lx >= ear.width || ly >= ear.height) return 0;
  return rgbaAt(ear, lx, ly)[3];
}

const decoded = {};
for (const pet of pets) {
  assert.strictEqual(pet.kind, 'image-layered', `${pet.id} should use layered artwork`);
  assert.strictEqual(pet.animateEars, true, `${pet.id} should animate its ears`);
  assert.deepStrictEqual(pet.ears.map((ear) => ear.side).sort(), ['l', 'r']);
  const body = asset(pet.body); decoded[pet.id] = { body, ears: {} };
  assert.deepStrictEqual({ width: body.width, height: body.height }, { width: pet.natural.w, height: pet.natural.h });

  for (const meta of pet.ears) {
    const ear = asset(meta.src); decoded[pet.id].ears[meta.side] = ear;
    assert.strictEqual(ear.width, Math.round(meta.box.w * pet.natural.w), `${pet.id} ${meta.side} width should match box`);
    assert.strictEqual(ear.height, Math.round(meta.box.h * pet.natural.h), `${pet.id} ${meta.side} height should match box`);
    assert(meta.box.x >= 0 && meta.box.y >= 0 && meta.box.x + meta.box.w <= 1 && meta.box.y + meta.box.h <= 0.32,
      `${pet.id} ${meta.side} box should stay tightly around the top ear`);
    assert(meta.origin.x >= 0 && meta.origin.x <= 1 && meta.origin.y >= 0 && meta.origin.y <= 1,
      `${pet.id} ${meta.side} origin should sit inside its crop`);

    let solid = 0, transparent = 0, dark = 0, faceLike = 0, tailBlue = 0, overlap = 0;
    const bx = Math.round(meta.box.x * pet.natural.w), by = Math.round(meta.box.y * pet.natural.h);
    for (let y = 0; y < ear.height; y++) for (let x = 0; x < ear.width; x++) {
      const [r, g, b, a] = rgbaAt(ear, x, y);
      if (a === 0) transparent++;
      if (a < 128) continue;
      solid++;
      if (Math.max(r, g, b) <= 110) dark++;
      if (Math.min(r, g, b) >= 210 && Math.max(r, g, b) - Math.min(r, g, b) <= 35) faceLike++;
      if (b - r >= 25 && b - g >= 8 && b >= 150) tailBlue++;
      if (rgbaAt(body, bx + x, by + y)[3] >= 128) overlap++;
    }
    assert(solid > 0 && transparent > 0, `${pet.id} ${meta.side} should be a transparent cutout`);
    assert(dark / solid >= 0.15, `${pet.id} ${meta.side} should include its black outline`);
    assert(outlineCoverage(ear) >= 0.70, `${pet.id} ${meta.side} outer boundary should retain the black contour`);
    assert(componentRatio(ear, 128) >= 0.995, `${pet.id} ${meta.side} should not contain detached face/tail fragments`);
    assert(overlap / solid <= 0.15, `${pet.id} ${meta.side} should not leave a static ear ghost in the body`);
    if (pet.id === 'hachiware') assert(faceLike <= 10, `${pet.id} ${meta.side} should not contain white face pixels`);
    if (pet.id === 'momonga') assert(tailBlue <= Math.max(10, solid * 0.001), `${pet.id} ${meta.side} should not contain blue tail pixels`);
  }
}

// Approved negative samples: all are inside an ear crop but belong to the
// stationary fringe, face, or tail. They must remain opaque in the body and
// transparent in the corresponding ear layer.
const forbidden = [
  ['hachiware', 'l', 280, 180, 'blue fringe'],
  ['hachiware', 'r', 430, 175, 'blue fringe'],
  ['momonga', 'l', 350, 330, 'face'],
  ['momonga', 'r', 700, 335, 'face'],
  ['momonga', 'r', 800, 100, 'tail']
];
for (const [id, side, x, y, label] of forbidden) {
  const pet = pets.find((candidate) => candidate.id === id);
  const meta = pet.ears.find((candidate) => candidate.side === side);
  assert(rgbaAt(decoded[id].body, x, y)[3] >= 128, `${id} ${label} should stay in the body`);
  assert.strictEqual(placedAlpha(decoded[id].ears[side], meta.box, pet, x, y), 0,
    `${id} ${label} must be transparent in the ${side} ear`);
}

// The exact inner-facing outline segments that were previously omitted from
// Momonga's cuts: right side of the left ear, left side of the right ear.
for (const [side, x, y] of [['l', 385, 200], ['r', 625, 200]]) {
  const pet = pets.find((candidate) => candidate.id === 'momonga');
  const meta = pet.ears.find((candidate) => candidate.side === side);
  const ear = decoded.momonga.ears[side];
  const bx = Math.round(meta.box.x * pet.natural.w), by = Math.round(meta.box.y * pet.natural.h);
  const [r, g, b, a] = rgbaAt(ear, x - bx, y - by);
  assert(a >= 128 && Math.max(r, g, b) <= 110, `momonga ${side} should retain its inner-facing black outline`);
}

// Transform-aware hit mapping: an opaque pixel keeps hitting the same ear after
// a rotation or root-preserving bend, while a transparent crop pixel never hits.
const alpha = [
  [0, 0, 0, 0],
  [0, 255, 0, 0],
  [0, 0, 0, 0],
  [0, 0, 0, 0]
];
const ref = {
  side: 'l', box: { x: 0.2, y: 0.1, w: 0.4, h: 0.4 }, origin: { x: 0.5, y: 0.5 },
  angle: 0, hitOK: true, hitW: 4, hitH: 4,
  hitCtx: { getImageData: (x, y) => ({ data: [0, 0, 0, alpha[y][x]] }) }
};
const rest = { u: 0.2 + 1.5 / 4 * 0.4, v: 0.1 + 1.5 / 4 * 0.4 };
assert.strictEqual(earHit.regionAt([ref], rest.u, rest.v, 20), 'ear-l');
assert.strictEqual(earHit.regionAt([ref], 0.2 + 0.5 / 4 * 0.4, rest.v, 20), null);
ref.angle = 30;
const ox = ref.box.x + ref.origin.x * ref.box.w, oy = ref.box.y + ref.origin.y * ref.box.h;
const rad = ref.angle * Math.PI / 180, dx = rest.u - ox, dy = rest.v - oy;
const moved = { u: ox + Math.cos(rad) * dx - Math.sin(rad) * dy, v: oy + Math.sin(rad) * dx + Math.cos(rad) * dy };
assert.strictEqual(earHit.regionAt([ref], moved.u, moved.v, 20), 'ear-l');
ref.angle = 0; ref.skew = 20;
const skewed = { u: rest.u + Math.tan(ref.skew * Math.PI / 180) * (rest.v - oy), v: rest.v };
assert.strictEqual(earHit.regionAt([ref], skewed.u, skewed.v, 20), 'ear-l');

const renderer = fs.readFileSync(path.join(ROOT, 'src', 'renderer.js'), 'utf8');
const index = fs.readFileSync(path.join(ROOT, 'src', 'index.html'), 'utf8');
assert(renderer.includes('earHit.regionAt(earParts, u, v, 20)'), 'renderer should use alpha-aware ear hit testing');
assert(renderer.includes('ears[i].skew = rotE'), 'renderer should inverse-map the current ear bend');
assert(index.indexOf('ear-hit.js') < index.indexOf('renderer.js'), 'ear hit helper should load before renderer');

console.log('ear animation ok');
