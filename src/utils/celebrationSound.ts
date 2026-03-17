import { Platform } from 'react-native';
import { Audio } from 'expo-av';

// Snotzee-style brass fanfare — synthesized on web, pre-rendered WAV on native
const CELEBRATION_WAV = require('../../assets/sounds/celebration.wav');

let audioModeConfigured = false;

async function ensureAudioMode() {
  if (audioModeConfigured) return;
  try {
    await Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    audioModeConfigured = true;
  } catch {
    // Ignore if audio mode fails (e.g. web)
  }
}

// Web: synthesize in real time like Snotzee (Web Audio API)
function playWebFanfare() {
  if (typeof window === 'undefined') return;
  const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return;
  const ctx = new Ctx();

  function playNote(freq: number, startTime: number, duration: number) {
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

  const now = ctx.currentTime;
  playNote(392, now, 0.18); // G4
  playNote(392, now + 0.26, 0.18); // G4
  playNote(440, now + 0.5, 0.1); // A4
  playNote(523, now + 0.62, 0.85); // C5
}

// Native: play bundled WAV (generated from same synthesis)
async function playNativeFanfare() {
  try {
    await ensureAudioMode();
    const { sound } = await Audio.Sound.createAsync(
      CELEBRATION_WAV,
      { shouldPlay: true }
    );
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        sound.unloadAsync().catch(() => {});
      }
    });
  } catch {
    // Silently ignore if sound fails to load or play
  }
}

export async function playCelebrationSound(): Promise<void> {
  if (Platform.OS === 'web') {
    playWebFanfare();
    return;
  }
  await playNativeFanfare();
}
