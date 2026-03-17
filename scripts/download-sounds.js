#!/usr/bin/env node
/**
 * Creates celebration.mp3 for bundling.
 * Run: node scripts/download-sounds.js
 *
 * Generates a minimal valid MP3 (short silence) as a placeholder.
 * Replace assets/sounds/celebration.mp3 with your own short celebration sound if desired.
 */
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'sounds');
const OUT_FILE = path.join(ASSETS_DIR, 'celebration.mp3');

// Minimal valid MPEG1 Layer3 frame (~26ms per frame, ~1s total)
// Header: sync, MPEG1/L3, 32kbps, 44.1kHz, mono, no padding
function createMinimalMp3() {
  const header = Buffer.from([0xff, 0xfa, 0x00, 0xc4]);
  const frameLen = Math.floor(144 * (32000 / 44100)) - 4;
  const frame = Buffer.concat([header, Buffer.alloc(frameLen, 0)]);
  return Buffer.concat(Array(40).fill(null).map(() => Buffer.from(frame)));
}

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true });
}

try {
  fs.writeFileSync(OUT_FILE, createMinimalMp3());
  console.log('Created assets/sounds/celebration.mp3 (placeholder).');
  console.log('Replace with your own short celebration sound if desired.');
} catch (err) {
  console.error('Failed:', err.message);
  process.exit(1);
}
