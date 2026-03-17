#!/usr/bin/env node
/**
 * Generates celebration.wav using Snotzee-style Web Audio synthesis.
 * Run: node scripts/generate-celebration-sound.js
 */
const fs = require('fs');
const path = require('path');
const { OfflineAudioContext } = require('node-web-audio-api');
const toWav = require('audiobuffer-to-wav');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'sounds');
const OUT_FILE = path.join(ASSETS_DIR, 'celebration.wav');

// Snotzee playBonusHorn: G4 G4 A4 C5 — "dun dun da dunnnn"
function renderFanfare(ctx) {
  const now = 0;

  function playNote(freq, startTime, duration) {
    [1, 1.012].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq * detune, startTime);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 1400;
      filter.Q.value = 1.5;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.28, startTime + 0.018);
      gain.gain.setValueAtTime(0.28, startTime + duration - 0.07);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.01);
    });
  }

  playNote(392, now, 0.18); // G4
  playNote(392, now + 0.26, 0.18); // G4
  playNote(440, now + 0.5, 0.1); // A4
  playNote(523, now + 0.62, 0.85); // C5
}

async function main() {
  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true });
  }

  // ~1.5s @ 44.1kHz stereo
  const ctx = new OfflineAudioContext(2, 44100 * 2, 44100);
  renderFanfare(ctx);

  const buffer = await ctx.startRendering();
  const wav = toWav(buffer);
  fs.writeFileSync(OUT_FILE, Buffer.from(wav));
  console.log('Created assets/sounds/celebration.wav');
}

main().catch((err) => {
  console.error('Failed:', err);
  process.exit(1);
});
