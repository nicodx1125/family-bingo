// utils/audio.ts

export class BingoAudio {
  private ctx: AudioContext | null = null;
  private rollSource: AudioBufferSourceNode | null = null;
  private isRolling: boolean = false;
  private heartbeatSource: OscillatorNode | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      // AudioContext is lazy initialized on first interaction
    }
  }

  private initCtx() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Generate a simple noise buffer for drum roll
  private createNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const bufferSize = ctx.sampleRate * 2.0; // 2 seconds
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      // Simple white noise
      output[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  public playRoll() {
    const ctx = this.initCtx();
    if (this.isRolling) return;

    this.isRolling = true;

    // Drum roll effect using noise and filter
    const noise = ctx.createBufferSource();
    noise.buffer = this.createNoiseBuffer(ctx);
    noise.loop = true;

    // Filter to make it sound more like a snare drum roll
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 800;

    // Gain to control envelope (optional, but kept simple here for loop)
    const gain = ctx.createGain();
    gain.gain.value = 0.5;

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    noise.start();
    this.rollSource = noise;
  }

  public stopRoll() {
    if (this.rollSource) {
      this.rollSource.stop();
      this.rollSource.disconnect();
      this.rollSource = null;
    }
    this.isRolling = false;
  }

  public playDecision(isClimax: boolean = false) {
    const ctx = this.initCtx();

    // Fanfare / Success sound
    // Simple Arpeggio: C - E - G - C(high)
    const frequencies = isClimax
      ? [523.25, 659.25, 783.99, 1046.50, 1318.51] // High C Major 7
      : [261.63, 329.63, 392.00, 523.25]; // C Major

    // Play slightly staggered for arpeggio effect
    const now = ctx.currentTime;

    frequencies.forEach((freq, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = isClimax ? 'sawtooth' : 'triangle';
      osc.frequency.value = freq;

      // Envelope
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.5, now + 0.05 + (index * 0.05));
      gain.gain.exponentialRampToValueAtTime(0.01, now + 1.5 + (index * 0.1));

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + (index * 0.08));
      osc.stop(now + 2.0);
    });
  }

  public playHeartbeat() {
    const ctx = this.initCtx();
    if (this.heartbeatSource) return;

    // Heartbeat: Low frequency pulse
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, ctx.currentTime);

    // Pulse LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 1.5; // Heartbeat rate (90 BPM)
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.5;

    lfo.connect(lfoGain);
    lfoGain.connect(gain.gain);

    // Base gain
    gain.gain.value = 0.3;

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    lfo.start();

    // Store osc as source (simplified, technically should track lfo too but good enough for simple stop)
    this.heartbeatSource = osc;
    // Hacky cleanup for prototype:
    (osc as any).lfo = lfo;
  }

  public stopHeartbeat() {
    if (this.heartbeatSource) {
      try {
        this.heartbeatSource.stop();
        if ((this.heartbeatSource as any).lfo) {
          (this.heartbeatSource as any).lfo.stop();
        }
      } catch (e) {
        // Ignore if already stopped
      }
      this.heartbeatSource = null;
    }
  }
}

// Singleton helper
let audioInstance: BingoAudio | null = null;
export const getBingoAudio = () => {
  if (!audioInstance) {
    audioInstance = new BingoAudio();
  }
  return audioInstance;
};
