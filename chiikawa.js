#!/usr/bin/env node
'use strict';
/*
 * chiikawa — launcher & dev CLI for the OhMyChiikawa desktop pet.
 *
 * Zero runtime dependencies: it drives the Electron binary that's installed as a
 * devDependency. On `start` it checks the project's dependencies are present and
 * runs `npm install` automatically if anything is missing.
 *
 *   ./chiikawa.js [start] [--pet <id>] [--size small|medium|large]
 *   ./chiikawa.js pets        list the bundled pets
 *   ./chiikawa.js version     print the version
 *   ./chiikawa.js help        show usage
 *
 * After `npm link` (or when installed) it's also available as `chiikawa`.
 */
const { spawn, spawnSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const pkg = require(path.join(ROOT, 'package.json'));
const SIZES = ['small', 'medium', 'large'];

// Bundled pets are the files in src/pets/ minus the shared registry.
function listPets() {
  return fs.readdirSync(path.join(ROOT, 'src', 'pets'))
    .filter((f) => f.endsWith('.js') && f !== 'registry.js' && f !== 'usagi-roll.js')
    .map((f) => f.replace(/\.js$/, ''))
    .sort();
}

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else out.push(p);
  }
  return out;
}

// Encrypt every image under src/images/ into the committed src/assets.pak.
// Run this after changing artwork; the raw PNGs stay out of the repo.
function pack() {
  const vault = require(path.join(ROOT, 'src', 'asset-vault'));
  const SRC = path.join(ROOT, 'src');
  const imgDir = path.join(SRC, 'images');
  if (!fs.existsSync(imgDir)) { console.error('No src/images/ to pack.'); process.exit(1); }
  const files = walk(imgDir).filter((f) => /\.(png|gif|jpe?g)$/i.test(f)).sort();
  const bundle = {};
  for (const f of files) {
    const rel = path.relative(SRC, f).split(path.sep).join('/'); // e.g. images/usagi/body.png
    bundle[rel] = fs.readFileSync(f).toString('base64');
  }
  const enc = vault.encrypt(Buffer.from(JSON.stringify(bundle)));
  fs.writeFileSync(path.join(SRC, 'assets.pak'), enc);
  console.log(`packed ${files.length} asset(s) -> src/assets.pak (${(enc.length / 1024).toFixed(0)} KB)`);
}

function help() {
  console.log(`OhMyChiikawa v${pkg.version} — desktop pet for macOS

Usage:
  chiikawa [start] [options]            launch the pet (default command)
  chiikawa pets                         list the bundled pets
  chiikawa pack                         (re)build the encrypted src/assets.pak
  chiikawa version                      print the version
  chiikawa help                         show this help

Options (for start):
  -p, --pet  <id>                      which pet to show        (default: usagi)
  -s, --size <small|medium|large>      on-screen size           (default: medium)

Examples:
  chiikawa
  chiikawa start --size large
  chiikawa -p usagi -s small`);
}

// Minimal arg parser: supports "--key=val", "--key val", "-k val".
function parse(argv) {
  const out = { pet: null, size: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '-p' || a === '--pet') out.pet = argv[++i];
    else if (a === '-s' || a === '--size') out.size = argv[++i];
    else if (a.startsWith('--pet=')) out.pet = a.slice('--pet='.length);
    else if (a.startsWith('--size=')) out.size = a.slice('--size='.length);
    else { console.error('Unknown option: ' + a + '\n'); help(); process.exit(1); }
  }
  return out;
}

// Dependencies the project needs (from package.json), and which ones aren't
// installed under node_modules yet.
function missingDeps() {
  const names = Object.keys(Object.assign({}, pkg.dependencies, pkg.devDependencies));
  return names.filter((n) => !fs.existsSync(path.join(ROOT, 'node_modules', n)));
}

// Make sure dependencies are present; if not, log them and run `npm install`.
function ensureDeps() {
  let missing = missingDeps();
  if (missing.length === 0) return true;
  console.error('[chiikawa] Missing dependencies: ' + missing.join(', '));
  console.error('[chiikawa] Installing them now (npm install)...\n');
  const r = spawnSync('npm install', { cwd: ROOT, stdio: 'inherit', shell: true });
  if (r.status !== 0) {
    console.error('\n[chiikawa] Automatic install failed. Please run `npm install` manually and retry.');
    return false;
  }
  missing = missingDeps();
  if (missing.length) {
    console.error('[chiikawa] Still missing after install: ' + missing.join(', ') + '. Please check manually.');
    return false;
  }
  console.log('[chiikawa] Dependencies ready.\n');
  return true;
}

function start(opts) {
  if (opts.size && !SIZES.includes(opts.size)) {
    console.error(`Invalid size "${opts.size}". Use one of: ${SIZES.join(', ')}`);
    process.exit(1);
  }
  const pets = listPets();
  if (opts.pet && !pets.includes(opts.pet)) {
    console.error(`Unknown pet "${opts.pet}". Available: ${pets.join(', ')}`);
    process.exit(1);
  }
  if (!ensureDeps()) process.exit(1);
  let electron;
  try { electron = require('electron'); }
  catch (e) { console.error('Electron is not installed — run `npm install` first.'); process.exit(1); }

  const args = ['.'];
  if (opts.pet) args.push('--pet=' + opts.pet);
  if (opts.size) args.push('--scale=' + opts.size);

  spawn(electron, args, { cwd: ROOT, stdio: 'inherit' })
    .on('close', (code) => process.exit(code || 0));
}

(function main() {
  const argv = process.argv.slice(2);
  const cmd = argv[0];

  if (!cmd || cmd === 'start') return start(parse(cmd === 'start' ? argv.slice(1) : argv));
  if (cmd === 'pets') return console.log(listPets().join('\n'));
  if (cmd === 'pack') return pack();
  if (cmd === 'version' || cmd === '-v' || cmd === '--version') return console.log(pkg.version);
  if (cmd === 'help' || cmd === '-h' || cmd === '--help') return help();
  if (cmd.startsWith('-')) return start(parse(argv)); // e.g. `chiikawa --size small`

  console.error('Unknown command: ' + cmd + '\n');
  help();
  process.exit(1);
})();
