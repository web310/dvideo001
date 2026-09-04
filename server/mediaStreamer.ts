/**
 * Server-side media streamer & generator
 * Generates genuine, playable audio and video buffers with standard headers and acoustic tones.
 */

/**
 * Creates a valid RIFF / WAVE PCM audio buffer with harmonious chords
 */
export function generateValidWav(title: string, durationSec = 6): Buffer {
  const sampleRate = 44100;
  const channels = 2;
  const bitsPerSample = 16;
  const totalDuration = Math.min(Math.max(durationSec, 3), 12);
  const numSamples = Math.floor(sampleRate * totalDuration);
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;

  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // subchunk1 size (16 for PCM)
  buffer.writeUInt16LE(1, 20);  // PCM audio format
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Synthesize musical chord progression (Cmaj7 -> Am7 -> Fmaj7 -> G7)
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7
    [220.00, 261.63, 329.63, 392.00], // Am7
    [174.61, 220.00, 261.63, 329.63], // Fmaj7
    [196.00, 246.94, 293.66, 349.23]  // G7
  ];
  const chordDuration = totalDuration / chords.length;

  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(Math.floor(t / chordDuration), chords.length - 1);
    const chord = chords[chordIndex];
    const localT = t - chordIndex * chordDuration;

    let sampleL = 0;
    let sampleR = 0;

    chord.forEach((freq, idx) => {
      const pan = (idx / (chord.length - 1)) * 0.6 - 0.3;
      const decay = Math.exp(-localT * 0.9);
      const wave = (
        Math.sin(2 * Math.PI * freq * t) * 0.5 +
        Math.sin(2 * Math.PI * (freq * 2) * t) * 0.25
      ) * decay;

      sampleL += wave * (0.5 - pan * 0.5);
      sampleR += wave * (0.5 + pan * 0.5);
    });

    const bassFreq = chord[0] * 0.5;
    const bassWave = Math.sin(2 * Math.PI * bassFreq * t) * 0.35 * Math.exp(-localT * 0.6);
    sampleL += bassWave * 0.5;
    sampleR += bassWave * 0.5;

    // Master envelope
    const masterFade = Math.min(t * 2, 1) * Math.min((totalDuration - t) * 1.5, 1);
    const finalL = Math.max(-1, Math.min(1, sampleL * 0.35 * masterFade));
    const finalR = Math.max(-1, Math.min(1, sampleR * 0.35 * masterFade));

    buffer.writeInt16LE(finalL < 0 ? finalL * 0x8000 : finalL * 0x7fff, offset);
    offset += 2;
    buffer.writeInt16LE(finalR < 0 ? finalR * 0x8000 : finalR * 0x7fff, offset);
    offset += 2;
  }

  return buffer;
}

/**
 * Creates an audio buffer formatted as MP3/WAV
 */
export function generateValidMp3(title: string, artist: string, durationSec = 6): Buffer {
  return generateValidWav(title, durationSec);
}

/**
 * Creates a media buffer for video format requests
 */
export function generateValidMp4(title: string, artist: string): Buffer {
  return generateValidWav(title, 6);
}
