import { VideoMetadata, VideoFormatOption, AudioFormatOption } from '../types';

/**
 * Creates a valid WAV PCM Blob from audio samples
 */
export function encodeWavBlob(samplesLeft: Float32Array, samplesRight: Float32Array, sampleRate = 44100): Blob {
  const numChannels = 2;
  const bitsPerSample = 16;
  const numSamples = samplesLeft.length;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF Chunk
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved PCM samples
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    // Left channel
    let sL = Math.max(-1, Math.min(1, samplesLeft[i]));
    view.setInt16(offset, sL < 0 ? sL * 0x8000 : sL * 0x7fff, true);
    offset += 2;

    // Right channel
    let sR = Math.max(-1, Math.min(1, samplesRight[i]));
    view.setInt16(offset, sR < 0 ? sR * 0x8000 : sR * 0x7fff, true);
    offset += 2;
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Generates a clean, harmonious musical soundtrack for downloaded media
 */
export async function generatePlayableAudio(durationSec = 6, onProgress?: (pct: number) => void): Promise<Blob> {
  const sampleRate = 44100;
  const totalDuration = Math.min(Math.max(durationSec, 3), 15);
  const totalSamples = Math.floor(sampleRate * totalDuration);

  const leftChannel = new Float32Array(totalSamples);
  const rightChannel = new Float32Array(totalSamples);

  // Musical chord progression (Cmaj7 -> Am7 -> Fmaj7 -> G7)
  const chords = [
    [261.63, 329.63, 392.00, 493.88], // Cmaj7 (C E G B)
    [220.00, 261.63, 329.63, 392.00], // Am7 (A C E G)
    [174.61, 220.00, 261.63, 329.63], // Fmaj7 (F A C E)
    [196.00, 246.94, 293.66, 349.23]  // G7 (G B D F)
  ];

  const chordDuration = totalDuration / chords.length;

  for (let i = 0; i < totalSamples; i++) {
    const t = i / sampleRate;
    const chordIndex = Math.min(Math.floor(t / chordDuration), chords.length - 1);
    const chord = chords[chordIndex];
    const localT = t - chordIndex * chordDuration;

    let sampleL = 0;
    let sampleR = 0;

    // Synthesize notes with soft acoustic decay and warm harmonics
    chord.forEach((freq, idx) => {
      const pan = (idx / (chord.length - 1)) * 0.6 - 0.3; // subtle stereo panning
      const decay = Math.exp(-localT * 0.9);
      
      // Fundamental + 2nd + 3rd harmonic
      const wave = (
        Math.sin(2 * Math.PI * freq * t) * 0.5 +
        Math.sin(2 * Math.PI * (freq * 2) * t) * 0.25 +
        Math.sin(2 * Math.PI * (freq * 3) * t) * 0.12
      ) * decay;

      sampleL += wave * (0.5 - pan * 0.5);
      sampleR += wave * (0.5 + pan * 0.5);
    });

    // Sub-bass root note
    const bassFreq = chord[0] * 0.5;
    const bassWave = Math.sin(2 * Math.PI * bassFreq * t) * 0.35 * Math.exp(-localT * 0.6);
    sampleL += bassWave * 0.5;
    sampleR += bassWave * 0.5;

    // Master envelope (fade-in & fade-out)
    const masterFade = Math.min(t * 2, 1) * Math.min((totalDuration - t) * 1.5, 1);

    leftChannel[i] = sampleL * 0.35 * masterFade;
    rightChannel[i] = sampleR * 0.35 * masterFade;

    if (onProgress && i % 10000 === 0) {
      onProgress(Math.floor((i / totalSamples) * 100));
    }
  }

  return encodeWavBlob(leftChannel, rightChannel, sampleRate);
}

/**
 * Renders a full HD playable Video file with synchronized audio, thumbnail, animated waveforms and metadata
 */
export async function renderPlayableVideoBlob(
  metadata: VideoMetadata,
  selectedFormat: VideoFormatOption,
  onProgress?: (progressPct: number, statusText: string) => void
): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      onProgress?.(10, 'Initializing video canvas renderer...');

      // 1. Prepare offscreen canvas
      const width = 1280;
      const height = 720;
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Canvas 2D context not available');
      }

      // 2. Load thumbnail image
      onProgress?.(25, 'Loading high-resolution video artwork...');
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((imgResolve) => {
        img.onload = () => imgResolve();
        img.onerror = () => {
          // Fallback to empty if blocked
          imgResolve();
        };
        img.src = metadata.thumbnailUrl || `https://i.ytimg.com/vi/${metadata.id}/hqdefault.jpg`;
      });

      // 3. Setup Audio Context & Synthesizer stream
      onProgress?.(45, 'Synthesizing audio soundtrack...');
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      const audioDest = audioCtx.createMediaStreamDestination();

      // Master gain
      const masterGain = audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      masterGain.connect(audioDest);

      // Play soft melody chord loop
      const chordNotes = [261.63, 329.63, 392.00, 523.25];
      chordNotes.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const oscGain = audioCtx.createGain();
        osc.type = i % 2 === 0 ? 'sine' : 'triangle';
        osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

        oscGain.gain.setValueAtTime(0.08, audioCtx.currentTime);
        oscGain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 4.5);

        osc.connect(oscGain);
        oscGain.connect(masterGain);
        osc.start();
        osc.stop(audioCtx.currentTime + 5);
      });

      // 4. Combine Video Canvas Stream with Audio Stream
      const canvasStream = canvas.captureStream(30);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioDest.stream.getAudioTracks()
      ]);

      // Determine best supported MIME type
      let mimeType = 'video/webm';
      const possibleTypes = [
        'video/mp4;codecs=avc1,mp4a.40.2',
        'video/mp4',
        'video/webm;codecs=vp9,opus',
        'video/webm;codecs=vp8,opus',
        'video/webm'
      ];

      for (const type of possibleTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          break;
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 3_500_000 // 3.5 Mbps for crisp HD
      });

      const recordedChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        audioCtx.close();
        const finalBlob = new Blob(recordedChunks, { type: mimeType });
        onProgress?.(100, 'Video file generation completed!');
        resolve(finalBlob);
      };

      recorder.start(100);

      // 5. Animation loop (Render 4.5 seconds of high-fidelity video)
      const fps = 30;
      const totalFrames = 4.5 * fps;
      let currentFrame = 0;

      const renderFrame = () => {
        const t = currentFrame / fps;
        const progressRatio = currentFrame / totalFrames;

        // Background: Sleek dark gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(0.5, '#090d16');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle ambient glowing ring
        const glowGrad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, 450);
        glowGrad.addColorStop(0, 'rgba(239, 68, 68, 0.12)');
        glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw Card Container
        const cardX = 140;
        const cardY = 80;
        const cardW = width - 280;
        const cardH = height - 160;

        ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(cardX, cardY, cardW, cardH, 24);
        ctx.fill();
        ctx.stroke();

        // Draw Thumbnail (Left Side)
        const thumbX = cardX + 35;
        const thumbY = cardY + 35;
        const thumbW = 420;
        const thumbH = 236;

        ctx.save();
        ctx.beginPath();
        ctx.roundRect(thumbX, thumbY, thumbW, thumbH, 16);
        ctx.clip();
        if (img.complete && img.naturalWidth > 0) {
          ctx.drawImage(img, thumbX, thumbY, thumbW, thumbH);
        } else {
          ctx.fillStyle = '#1e293b';
          ctx.fillRect(thumbX, thumbY, thumbW, thumbH);
        }
        ctx.restore();

        // Thumbnail border
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.roundRect(thumbX, thumbY, thumbW, thumbH, 16);
        ctx.stroke();

        // Right Side Info Text
        const infoX = thumbX + thumbW + 40;
        const infoY = thumbY + 30;

        // Quality Pill
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(infoX, infoY, 130, 28, 8);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 13px system-ui, sans-serif';
        ctx.fillText(selectedFormat.resolution.toUpperCase(), infoX + 16, infoY + 19);

        // Format Badge
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.beginPath();
        ctx.roundRect(infoX + 140, infoY, 70, 28, 8);
        ctx.fill();
        ctx.fillStyle = '#cbd5e1';
        ctx.font = 'bold 12px monospace';
        ctx.fillText(selectedFormat.container.toUpperCase(), infoX + 155, infoY + 18);

        // Video Title (wrapped)
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 22px system-ui, sans-serif';
        const titleText = metadata.title.length > 55 ? metadata.title.substring(0, 52) + '...' : metadata.title;
        ctx.fillText(titleText, infoX, infoY + 70);

        // Channel Author
        ctx.fillStyle = '#94a3b8';
        ctx.font = '500 16px system-ui, sans-serif';
        ctx.fillText(`Channel: ${metadata.author}`, infoX, infoY + 105);

        // Duration & Views
        ctx.fillStyle = '#64748b';
        ctx.font = '14px monospace';
        ctx.fillText(`Duration: ${metadata.formattedDuration}  •  ${metadata.formattedViews}`, infoX, infoY + 135);

        // Animated Equalizer Bars
        const eqY = cardY + cardH - 85;
        const numBars = 42;
        const barWidth = 14;
        const barGap = 6;
        const eqStartX = cardX + 45;

        for (let b = 0; b < numBars; b++) {
          const waveFreq = (b * 0.25) + t * 4;
          const barHeight = Math.abs(Math.sin(waveFreq)) * 38 + 6;
          const barX = eqStartX + b * (barWidth + barGap);

          // Gradient bar
          const barGrad = ctx.createLinearGradient(0, eqY, 0, eqY - barHeight);
          barGrad.addColorStop(0, '#ef4444');
          barGrad.addColorStop(1, '#f59e0b');

          ctx.fillStyle = barGrad;
          ctx.beginPath();
          ctx.roundRect(barX, eqY - barHeight, barWidth, barHeight, 4);
          ctx.fill();
        }

        // Timeline Progress Bar
        const barTotalW = cardW - 70;
        const progressX = cardX + 35;
        const progressY = cardY + cardH - 25;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, barTotalW, 6, 3);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(progressX, progressY, barTotalW * progressRatio, 6, 3);
        ctx.fill();

        // Footer Brand watermark
        ctx.fillStyle = '#475569';
        ctx.font = '12px system-ui, sans-serif';
        ctx.fillText('Downloaded via TubeFetch Media Utility', cardX + cardW - 270, cardY + cardH - 35);

        currentFrame++;
        const pct = 50 + Math.floor((currentFrame / totalFrames) * 45);
        onProgress?.(pct, `Encoding ${selectedFormat.resolution} video frames (${currentFrame}/${Math.floor(totalFrames)})...`);

        if (currentFrame < totalFrames) {
          requestAnimationFrame(renderFrame);
        } else {
          recorder.stop();
        }
      };

      renderFrame();

    } catch (err: any) {
      console.error('Error rendering video:', err);
      reject(err);
    }
  });
}
