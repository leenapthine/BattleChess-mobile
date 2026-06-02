// Chiptune SFX generator — synthesizes lofi 8-bit-style .wav files for the
// game's visual effects. Pure square/pulse/triangle waves + LFSR noise,
// rendered at 8 kHz and bit-crushed to ~4-bit for true TIA/SN76489-grade
// crunch. Re-run to tweak: `node scripts/gen-sfx.js`.
//
// Output: assets/sfx/*.wav  (8 kHz, 8-bit unsigned PCM, mono)

const fs = require('fs');
const path = require('path');

const SR = 8000;           // sample rate (lofi)
const CRUSH = 16;          // amplitude quantization levels (~4-bit)
const OUT = path.join(__dirname, '..', 'assets', 'sfx');

fs.mkdirSync(OUT, { recursive: true });

// --- synth primitives -------------------------------------------------------

function osc(type, freq, t) {
  const phase = (t * freq) % 1;
  switch (type) {
    case 'square': return phase < 0.5 ? 1 : -1;
    case 'pulse25': return phase < 0.25 ? 1 : -1;
    case 'pulse12': return phase < 0.125 ? 1 : -1;
    case 'triangle': return 4 * Math.abs(phase - 0.5) - 1;
    case 'saw': return 2 * phase - 1;
    case 'sine': return Math.sin(2 * Math.PI * phase);
    default: return 0;
  }
}

let lfsr = 0xACE1;
function noise() {
  lfsr ^= (lfsr << 7) & 0xffff;
  lfsr ^= lfsr >>> 9;
  lfsr ^= (lfsr << 8) & 0xffff;
  return ((lfsr & 0xff) / 128) - 1;
}

function bitcrush(s, levels) {
  return Math.round(s * (levels / 2)) / (levels / 2);
}

// attack/release envelope, 1 at peak → 0 at end
function ar(t, dur, a = 0.008) {
  if (t < a) return t / a;
  return Math.max(0, 1 - (t - a) / (dur - a));
}
// percussive decay envelope
function decay(t, dur, power = 2) {
  return Math.pow(Math.max(0, 1 - t / dur), power);
}

function render(dur, fn) {
  const n = Math.floor(dur * SR);
  const out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = fn(i / SR, i, n);
  return out;
}

function writeWav(name, samples) {
  const n = samples.length;
  const buf = Buffer.alloc(44 + n);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + n, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);      // PCM
  buf.writeUInt16LE(1, 22);      // mono
  buf.writeUInt32LE(SR, 24);
  buf.writeUInt32LE(SR, 28);     // byte rate = SR * 1ch * 1byte
  buf.writeUInt16LE(1, 32);      // block align
  buf.writeUInt16LE(8, 34);      // bits per sample
  buf.write('data', 36);
  buf.writeUInt32LE(n, 40);
  for (let i = 0; i < n; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeUInt8(Math.round((s * 0.5 + 0.5) * 255), 44 + i);
  }
  fs.writeFileSync(path.join(OUT, name + '.wav'), buf);
  console.log('  ' + name + '.wav  ' + (n / SR).toFixed(2) + 's');
}

const crush = (s) => bitcrush(s, CRUSH);

// --- the sounds -------------------------------------------------------------

const sounds = {
  // YoungWiz FIRE cast — noise crackle + a downward square "fwoom"
  zap: () => render(0.34, (t) => {
    const env = ar(t, 0.34, 0.004);
    const crackle = noise() * (0.55 + 0.45 * Math.sin(t * 90)) * 0.6;
    const tone = osc('square', 620 - 440 * (t / 0.34), t) * 0.3;
    return crush((crackle + tone) * env) * 0.85;
  }),

  // NecroPawn / QueenOfDestruction detonation — noise burst + low boom sweep
  detonate: () => render(0.55, (t) => {
    const env = decay(t, 0.55, 1.5);
    const nz = noise() * 0.8;
    const boom = osc('square', 130 - 80 * (t / 0.55), t) * 0.45;
    return crush((nz + boom) * env) * 0.95;
  }),

  // BoulderThrower lob — low descending square + grit
  boulder: () => render(0.4, (t) => {
    const env = ar(t, 0.4, 0.02);
    const f = 270 - 150 * (t / 0.4);
    return crush((osc('square', f, t) * 0.5 + noise() * 0.15) * env) * 0.85;
  }),

  // DeadLauncher hurl — rising whoosh
  launch: () => render(0.32, (t) => {
    const env = ar(t, 0.32, 0.01);
    const f = 180 + 320 * (t / 0.32);
    return crush((osc('square', f, t) * 0.4 + noise() * 0.25) * env) * 0.8;
  }),

  // Beholder eye beam — buzzy sustained pulse with vibrato
  beam: () => render(0.4, (t) => {
    const env = ar(t, 0.4, 0.02);
    const vib = 1 + 0.03 * Math.sin(2 * Math.PI * 18 * t);
    return crush(osc('pulse25', 440 * vib, t) * 0.5 * env) * 0.8;
  }),

  // WizardKing / WizardTower lightning — descending laser zap
  laser: () => render(0.3, (t) => {
    const env = decay(t, 0.3, 1.2);
    const f = 1200 - 950 * (t / 0.3);
    return crush(osc('square', f, t) * 0.5 * env) * 0.8;
  }),

  // GhostKnight stun — electric bzzt (fast two-tone + noise flicker)
  stun: () => render(0.34, (t) => {
    const env = ar(t, 0.34, 0.004);
    const f = (Math.floor(t * 40) % 2) ? 1500 : 1900;
    return crush((osc('square', f, t) * 0.4 + noise() * 0.2 * Math.sin(t * 200)) * env) * 0.75;
  }),

  // Familiar petrify — low clunk
  stone: () => render(0.18, (t) => {
    const env = decay(t, 0.18, 2);
    const f = 150 - 50 * (t / 0.18);
    return crush((osc('square', f, t) * 0.6 + noise() * 0.2 * (t < 0.03 ? 1 : 0)) * env) * 0.85;
  }),

  // HellPawn transform / HellKing convert — warbly pitch bend
  morph: () => render(0.4, (t) => {
    const env = ar(t, 0.4, 0.01);
    const f = 320 + 240 * Math.sin(2 * Math.PI * 4 * t);
    return crush(osc('pulse25', f, t) * 0.45 * env) * 0.8;
  }),

  // Howler absorb — descending swallow
  absorb: () => render(0.4, (t) => {
    const env = ar(t, 0.4, 0.01);
    const f = 720 - 540 * (t / 0.4);
    return crush(osc('triangle', f, t) * 0.55 * env) * 0.8;
  }),

  // Necromancer / GhoulKing raise + QueenOfBones revive — rising arpeggio
  powerup: () => {
    const notes = [392, 523, 659, 784]; // G C E G
    return render(0.46, (t) => {
      const env = ar(t, 0.46, 0.004);
      const f = notes[Math.min(notes.length - 1, Math.floor(t / 0.11))];
      return crush(osc('square', f, t) * 0.45 * env) * 0.8;
    });
  },

  // QueenOfDomination — two-tone command boop
  dominate: () => render(0.3, (t) => {
    const env = ar(t, 0.3, 0.004);
    const f = t < 0.15 ? 330 : 494;
    return crush(osc('pulse25', f, t) * 0.45 * env) * 0.8;
  }),

  // QueenOfIllusions swap / Portal eject — teleport warble
  teleport: () => render(0.34, (t) => {
    const env = ar(t, 0.34, 0.004);
    const f = 500 + 400 * Math.sin(2 * Math.PI * 12 * t);
    return crush(osc('square', f, t) * 0.4 * env) * 0.8;
  }),

  // generic capture hit
  capture: () => render(0.12, (t) => {
    const env = decay(t, 0.12, 2);
    return crush((osc('square', 300, t) * 0.4 + noise() * 0.4) * env) * 0.85;
  }),

  // normal move click
  move: () => render(0.06, (t) => {
    const env = decay(t, 0.06, 3);
    return crush(osc('square', 440, t) * 0.3 * env) * 0.6;
  }),
};

console.log('Generating chiptune SFX (' + SR + ' Hz, ~4-bit) →', OUT);
for (const [name, gen] of Object.entries(sounds)) writeWav(name, gen());
console.log('Done — ' + Object.keys(sounds).length + ' files.');
