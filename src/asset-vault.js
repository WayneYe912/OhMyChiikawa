'use strict';
/*
 * asset-vault — symmetric pack/unpack for MyBuddy's image assets.
 *
 * The raw PNGs are kept out of the repository; only the encrypted `assets.pak`
 * (produced by `mybuddy pack`) is committed. The preload decrypts it at startup
 * into in-memory data: URLs, so the app stays fully offline while the artwork
 * isn't browsable straight from the repo.
 *
 * NOTE: the key ships with the app, so this is *obfuscation* against casual
 * copying — not real cryptographic protection. Anyone running the app can
 * recover the images; this just keeps them from being trivially downloaded
 * from the source tree.
 *
 * Used by both the CLI (`mybuddy pack`) and src/preload.js — keep it dependency
 * free (Node built-ins only) so the preload can require it directly.
 */
const crypto = require('crypto');

// 32-byte key derived from a fixed passphrase (identical on pack and unpack).
const KEY = crypto.createHash('sha256').update('mybuddy::usagi::asset-vault::v1').digest();
const ALGO = 'aes-256-cbc';

// Encrypt a buffer -> [16-byte IV][ciphertext].
function encrypt(buf) {
  const iv = crypto.randomBytes(16);
  const c = crypto.createCipheriv(ALGO, KEY, iv);
  return Buffer.concat([iv, c.update(buf), c.final()]);
}

// Inverse of encrypt().
function decrypt(buf) {
  const iv = buf.subarray(0, 16);
  const d = crypto.createDecipheriv(ALGO, KEY, iv);
  return Buffer.concat([d.update(buf.subarray(16)), d.final()]);
}

module.exports = { encrypt, decrypt };
