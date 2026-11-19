// Pure Web Audio API 8-Bit Retro Sound Synthesizer (no external audio files needed)

let audioCtx = null;

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) audioCtx = new Ctx();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

function isMuted() {
  return localStorage.getItem('akatora-sfx') === 'off';
}

function tone(freqStart, freqEnd, duration, type = 'square', volume = 0.08, delay = 0) {
  if (isMuted()) return;
  const ctx = getCtx();
  if (!ctx) return;

  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freqStart, start);
  if (freqEnd && freqEnd !== freqStart) {
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd), start + duration);
  }

  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(start);
  osc.stop(start + duration + 0.01);
}

export const retroSfx = {
  jump() {
    tone(190, 580, 0.14, 'square', 0.07);
  },
  land() {
    tone(110, 55, 0.06, 'triangle', 0.06);
  },
  collect() {
    tone(987.77, 987.77, 0.07, 'square', 0.07, 0);      // B5
    tone(1318.51, 1318.51, 0.18, 'square', 0.07, 0.07); // E6
  },
  openArt() {
    tone(523.25, 523.25, 0.06, 'square', 0.06, 0);      // C5
    tone(659.25, 659.25, 0.06, 'square', 0.06, 0.055);  // E5
    tone(783.99, 783.99, 0.12, 'square', 0.06, 0.11);   // G5
  },
  switchArt() {
    tone(440, 660, 0.07, 'square', 0.05);
  },
  closeArt() {
    tone(440, 220, 0.09, 'square', 0.05);
  },
  click() {
    tone(560, 420, 0.045, 'square', 0.045);
  }
};
