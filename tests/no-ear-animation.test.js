'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const hachiware = require(path.join(ROOT, 'src', 'pets', 'hachiware'));
const momonga = require(path.join(ROOT, 'src', 'pets', 'momonga'));

for (const pet of [hachiware, momonga]) {
  assert.strictEqual(pet.kind, 'image-layered', `${pet.id} should stay layered so blink lids still render`);
  assert(Array.isArray(pet.eyes) && pet.eyes.length > 0, `${pet.id} should keep blink eye geometry`);
  assert(Array.isArray(pet.ears) && pet.ears.length === 2, `${pet.id} should keep static ear layers`);
  assert.strictEqual(pet.animateEars, false, `${pet.id} should disable ear animation`);
}

const renderer = fs.readFileSync(path.join(ROOT, 'src', 'renderer.js'), 'utf8');
assert(renderer.includes('pet.animateEars !== false'), 'renderer should only animate ears when enabled');

console.log('no ear animation ok');
