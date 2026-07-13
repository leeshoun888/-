import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44_100;
const BEAT = 0.48;
const DURATION = BEAT * 32;
const sampleCount = Math.round(SAMPLE_RATE * DURATION);
const samples = new Float64Array(sampleCount);

const NOTE = {
  C3: 130.81, E3: 164.81, F3: 174.61, G3: 196, A3: 220,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392, A4: 440, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77,
  C6: 1046.5,
};

function addSample(index, value) {
  if (index >= 0 && index < samples.length) samples[index] += value;
}

function addBell(frequency, start, duration = 0.42, gain = 0.075) {
  const startIndex = Math.floor(start * SAMPLE_RATE);
  const endIndex = Math.min(samples.length, Math.ceil((start + duration) * SAMPLE_RATE));
  for (let index = startIndex; index < endIndex; index += 1) {
    const time = (index - startIndex) / SAMPLE_RATE;
    const phase = Math.PI * 2 * frequency * time;
    const attack = Math.min(1, time / 0.008);
    const release = Math.pow(Math.max(0, 1 - time / duration), 2.2);
    const envelope = attack * Math.exp(-4.2 * time / duration) * release;
    const tone = Math.sin(phase) + Math.sin(phase * 2.01) * 0.24 + Math.sin(phase * 3.98) * 0.08;
    addSample(index, tone * envelope * gain);
  }
}

function addPad(frequencies, start, duration = BEAT * 3.82, gain = 0.028) {
  const startIndex = Math.floor(start * SAMPLE_RATE);
  const endIndex = Math.min(samples.length, Math.ceil((start + duration) * SAMPLE_RATE));
  for (let index = startIndex; index < endIndex; index += 1) {
    const time = (index - startIndex) / SAMPLE_RATE;
    const attack = Math.min(1, time / 0.09);
    const release = Math.min(1, Math.max(0, duration - time) / 0.24);
    const envelope = attack * release;
    let tone = 0;
    frequencies.forEach((frequency, noteIndex) => {
      const phase = Math.PI * 2 * frequency * time;
      tone += Math.sin(phase + noteIndex * 0.31) + Math.sin(phase * 2) * 0.08;
    });
    addSample(index, (tone / frequencies.length) * envelope * gain);
  }
}

const chords = [
  [NOTE.C3, NOTE.E3, NOTE.G3],
  [NOTE.A3 / 2, NOTE.C3, NOTE.E3],
  [NOTE.F3, NOTE.A3, NOTE.C4],
  [NOTE.G3, NOTE.B4 / 2, NOTE.D4],
];
const arpeggios = [
  [NOTE.C5, NOTE.E5, NOTE.G5, NOTE.E5],
  [NOTE.A4, NOTE.C5, NOTE.E5, NOTE.C5],
  [NOTE.F4, NOTE.A4, NOTE.C5, NOTE.A4],
  [NOTE.G4, NOTE.B4, NOTE.D5, NOTE.B4],
];
const melody = [
  NOTE.E5, null, NOTE.G5, NOTE.A5, NOTE.G5, null, NOTE.E5, NOTE.D5,
  NOTE.C5, null, NOTE.E5, NOTE.F5, NOTE.G5, NOTE.E5, NOTE.D5, null,
  NOTE.G5, null, NOTE.C6, NOTE.B5, NOTE.A5, null, NOTE.G5, NOTE.E5,
  NOTE.F5, null, NOTE.A5, NOTE.G5, NOTE.E5, NOTE.D5, NOTE.C5, null,
];

for (let section = 0; section < 8; section += 1) {
  const chordIndex = section % chords.length;
  const sectionStart = section * BEAT * 4;
  addPad(chords[chordIndex], sectionStart);
  arpeggios[chordIndex].forEach((frequency, step) => {
    addBell(frequency, sectionStart + step * BEAT, 0.4, 0.055);
  });
}

melody.forEach((frequency, index) => {
  if (frequency) addBell(frequency, index * BEAT, 0.58, 0.044);
});

// A soft sparkle on each phrase gives the track a tiny storybook glint.
[0, 8, 16, 24].forEach((beatIndex, phraseIndex) => {
  addBell(phraseIndex % 2 === 0 ? NOTE.C6 : NOTE.G5, beatIndex * BEAT + 0.04, 0.74, 0.021);
});

// Keep the loop boundary click-free without creating an audible pause.
const seamFade = Math.round(SAMPLE_RATE * 0.035);
for (let index = 0; index < seamFade; index += 1) {
  samples[index] *= index / seamFade;
  samples[samples.length - 1 - index] *= index / seamFade;
}

let peak = 0;
for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
const scale = peak > 0 ? 0.82 / peak : 1;
const dataSize = samples.length * 2;
const output = Buffer.alloc(44 + dataSize);
output.write("RIFF", 0);
output.writeUInt32LE(36 + dataSize, 4);
output.write("WAVE", 8);
output.write("fmt ", 12);
output.writeUInt32LE(16, 16);
output.writeUInt16LE(1, 20);
output.writeUInt16LE(1, 22);
output.writeUInt32LE(SAMPLE_RATE, 24);
output.writeUInt32LE(SAMPLE_RATE * 2, 28);
output.writeUInt16LE(2, 32);
output.writeUInt16LE(16, 34);
output.write("data", 36);
output.writeUInt32LE(dataSize, 40);
for (let index = 0; index < samples.length; index += 1) {
  const value = Math.max(-1, Math.min(1, samples[index] * scale));
  output.writeInt16LE(Math.round(value * 32_767), 44 + index * 2);
}

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(scriptDirectory, "../public/assets/audio/fairytale-loop.wav");
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, output);
console.log(`Generated ${outputPath} (${(output.length / 1024 / 1024).toFixed(2)} MiB, ${DURATION.toFixed(2)}s)`);
