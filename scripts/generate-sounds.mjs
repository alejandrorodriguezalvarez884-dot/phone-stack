// Generates the WAV files in assets/sounds. Run with: node scripts/generate-sounds.mjs
// Mono 16-bit PCM, phase-continuous so frequency jumps never click.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SAMPLE_RATE = 22050;
const AMPLITUDE = 0.95;
const FADE_S = 0.01;

const outDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'sounds');

// Each sound is { duration, gen(t) => { freq, gain, drive? } }.
// drive > 0 soft-clips the sine: more harmonics, so it cuts through restaurant noise on tiny speakers.
const sounds = {
  // Two-tone alarm (960 / 1280 Hz, switching every 1/8 s). Lasts as long as the app lets it ring
  // (ALARM_MAX_MS in src/components/RoomScreen.tsx), so it never needs looping.
  alarm: {
    duration: 10,
    gen: (t) => ({ freq: Math.floor(t * 8) % 2 === 0 ? 960 : 1280, gain: 1, drive: 3 }),
  },

  // Two short rising blips: "the round is live, nobody touch anything".
  armed: {
    duration: 0.5,
    gen: (t) => {
      const blip = (start, len) => {
        const pos = t - start;
        if (pos < 0 || pos > len) return 0;
        const ramp = 0.01;
        return Math.min(1, pos / ramp, (len - pos) / ramp);
      };
      const first = blip(0, 0.12);
      const second = blip(0.2, 0.18);
      return { freq: second > 0 ? 1320 : 880, gain: 0.6 * Math.max(first, second) };
    },
  },
};

function render({ duration, gen }) {
  const n = Math.round(SAMPLE_RATE * duration);
  const pcm = Buffer.alloc(n * 2);
  let phase = 0;
  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const { freq, gain, drive = 0 } = gen(t);
    const fade = Math.min(1, t / FADE_S, (duration - t) / FADE_S);
    const wave = drive > 0 ? Math.tanh(drive * Math.sin(phase)) / Math.tanh(drive) : Math.sin(phase);
    const sample = wave * AMPLITUDE * gain * fade;
    pcm.writeInt16LE(Math.round(sample * 32767), i * 2);
    phase = (phase + (2 * Math.PI * freq) / SAMPLE_RATE) % (2 * Math.PI);
  }
  return pcm;
}

function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

mkdirSync(outDir, { recursive: true });
for (const [name, sound] of Object.entries(sounds)) {
  const file = join(outDir, `${name}.wav`);
  writeFileSync(file, wav(render(sound)));
  console.log(`wrote ${file}`);
}
