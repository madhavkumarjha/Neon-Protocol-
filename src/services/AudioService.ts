export class AudioService {
  private static audioCtx: AudioContext | null = null;
  private static isMuted: boolean = false;
  private static bgmTimer: number | null = null;
  private static bgmStep: number = 0;
  private static noiseBuffer: AudioBuffer | null = null;

  private static getContext(): AudioContext | null {
    if (!this.audioCtx && typeof window !== 'undefined') {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  private static getNoiseBuffer(ctx: AudioContext): AudioBuffer {
    if (!this.noiseBuffer) {
      const bufferSize = ctx.sampleRate * 1;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      this.noiseBuffer = buffer;
    }
    return this.noiseBuffer;
  }

  /* -------------------------------------------------------------
   * WEAPON & COMBAT SFX
   * ------------------------------------------------------------- */

  public static playLaser(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  }

  public static playSlash(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(1200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.1);

    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  public static playDash(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.15);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  }

  public static playBossLaser(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(440, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  }

  public static playExplosion(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(30, ctx.currentTime + 0.25);

    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  }

  public static playHit(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.08);

    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  /* -------------------------------------------------------------
   * SPECIAL SIGNATURE TONES & JINGLES (Iconic Arcade Motifs)
   * ------------------------------------------------------------- */

  /**
   * Iconic Signature Theme Jingle (The "Neon Protocol" power motif)
   * D5 -> F5 -> A5 -> D6 -> A5
   */
  public static playSignatureJingle(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 698.46, 880.00, 1174.66, 880.00];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = idx === notes.length - 1 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);

      const noteDuration = idx === notes.length - 1 ? 0.35 : 0.12;
      gain.gain.setValueAtTime(0.18, now + idx * 0.09);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + noteDuration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + noteDuration);
    });
  }

  /**
   * Game Start Fanfare (Ascending cyber-boot power-up)
   */
  public static playGameStartJingle(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [293.66, 349.23, 440.00, 587.33, 698.46, 880.00, 1174.66];

    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.06);

      const dur = idx === notes.length - 1 ? 0.45 : 0.1;
      gain.gain.setValueAtTime(0.16, now + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.06);
      osc.stop(now + idx * 0.06 + dur);
    });
  }

  /**
   * Wave Clear Triumphant Fanfare
   */
  public static playWaveClear(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const fanfareNotes = [698.46, 783.99, 880.00, 1046.50, 1174.66];

    fanfareNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      const dur = idx === fanfareNotes.length - 1 ? 0.5 : 0.14;
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + dur);
    });
  }

  /**
   * Upgrade Card Hover tick (responsive cyber-chirp)
   */
  public static playUpgradeHover(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(2200, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.03);

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  }

  /**
   * Upgrade Selected Power-Up Chime (massive satisfying endorphin hit)
   */
  public static playUpgradeSelect(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Fast ascending sweep
    const sweep = ctx.createOscillator();
    const sweepGain = ctx.createGain();
    sweep.type = 'sawtooth';
    sweep.frequency.setValueAtTime(440, now);
    sweep.frequency.exponentialRampToValueAtTime(1760, now + 0.18);
    sweepGain.gain.setValueAtTime(0.18, now);
    sweepGain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    sweep.connect(sweepGain);
    sweepGain.connect(ctx.destination);
    sweep.start(now);
    sweep.stop(now + 0.18);

    // Radiant triad chord (D major triumphant chord: D5, F#5, A5, D6)
    const chord = [587.33, 739.99, 880.00, 1174.66];
    chord.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + 0.14);

      gain.gain.setValueAtTime(0.15, now + 0.14);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + 0.14);
      osc.stop(now + 0.65);
    });
  }

  public static playLevelUp(): void {
    this.playUpgradeSelect();
  }

  /**
   * Game Over Stinger (descending cyber-glitch breakdown)
   */
  public static playGameOverJingle(): void {
    if (this.isMuted) return;
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const deathNotes = [440.00, 392.00, 349.23, 293.66, 146.83];

    deathNotes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      const dur = idx === deathNotes.length - 1 ? 0.6 : 0.15;
      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + dur);
    });
  }

  /* -------------------------------------------------------------
   * HIGH-ENERGY SYNTHWAVE / CYBERPUNK BGM ENGINE
   * Multi-track: Catchy Arcade Lead + Driving Bass + Punchy Drums
   * ------------------------------------------------------------- */

  private static readonly LEAD_NOTES: number[] = [
    // 32-step melody in D Minor (0 = rest, 128 BPM 16th notes)
    // Bar 1: Catchy Arcade Hook
    587.33, 0, 587.33, 698.46, 0, 880.00, 0, 783.99,
    698.46, 0, 587.33, 0, 523.25, 0, 587.33, 0,
    // Bar 2: Driving Ascent & Resolution
    698.46, 0, 880.00, 0, 1046.50, 0, 1174.66, 0,
    880.00, 0, 698.46, 0, 783.99, 698.46, 587.33, 0
  ];

  private static readonly BASS_NOTES: number[] = [
    // 32-step rolling 16th bassline (D2 / F2 / G2 / A2)
    73.42, 73.42, 146.83, 73.42, 87.31, 87.31, 98.00, 73.42,
    73.42, 73.42, 146.83, 73.42, 87.31, 98.00, 110.00, 73.42,
    73.42, 73.42, 146.83, 73.42, 87.31, 87.31, 98.00, 73.42,
    73.42, 73.42, 146.83, 73.42, 110.00, 98.00, 87.31, 65.41
  ];

  public static startBgm(): void {
    if (this.bgmTimer !== null) return;
    const ctx = this.getContext();
    if (!ctx) return;

    this.bgmStep = 0;
    // 120 BPM = 125ms per 16th note
    const stepDuration = 125;

    this.bgmTimer = window.setInterval(() => {
      if (this.isMuted || !this.audioCtx) return;
      const t = this.audioCtx.currentTime;
      const step = this.bgmStep % 32;

      // Track 1: Lead Melody (Singing Cyber Arcade Synth)
      const leadFreq = this.LEAD_NOTES[step];
      if (leadFreq > 0) {
        const leadOsc = this.audioCtx.createOscillator();
        const leadGain = this.audioCtx.createGain();
        const leadFilter = this.audioCtx.createBiquadFilter();

        leadOsc.type = 'sawtooth';
        leadOsc.frequency.setValueAtTime(leadFreq, t);

        leadFilter.type = 'lowpass';
        leadFilter.frequency.setValueAtTime(2400, t);
        leadFilter.frequency.exponentialRampToValueAtTime(700, t + 0.16);

        leadGain.gain.setValueAtTime(0.08, t);
        leadGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

        leadOsc.connect(leadFilter);
        leadFilter.connect(leadGain);
        leadGain.connect(this.audioCtx.destination);

        leadOsc.start(t);
        leadOsc.stop(t + 0.18);
      }

      // Track 2: Rolling Darksynth Bassline
      const bassFreq = this.BASS_NOTES[step];
      const bassOsc = this.audioCtx.createOscillator();
      const bassGain = this.audioCtx.createGain();
      const bassFilter = this.audioCtx.createBiquadFilter();

      bassOsc.type = 'sawtooth';
      bassOsc.frequency.setValueAtTime(bassFreq, t);

      bassFilter.type = 'lowpass';
      bassFilter.frequency.setValueAtTime(420, t);
      bassFilter.Q.setValueAtTime(4, t);

      bassGain.gain.setValueAtTime(0.06, t);
      bassGain.gain.exponentialRampToValueAtTime(0.002, t + 0.11);

      bassOsc.connect(bassFilter);
      bassFilter.connect(bassGain);
      bassGain.connect(this.audioCtx.destination);

      bassOsc.start(t);
      bassOsc.stop(t + 0.12);

      // Track 3: Drum Section (Kick, Snare, Hi-hat)
      // Kick drum on quarter beats (steps 0, 4, 8, 12, 16, 20, 24, 28)
      if (step % 4 === 0) {
        const kickOsc = this.audioCtx.createOscillator();
        const kickGain = this.audioCtx.createGain();

        kickOsc.type = 'sine';
        kickOsc.frequency.setValueAtTime(140, t);
        kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.08);

        kickGain.gain.setValueAtTime(0.25, t);
        kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

        kickOsc.connect(kickGain);
        kickGain.connect(this.audioCtx.destination);

        kickOsc.start(t);
        kickOsc.stop(t + 0.09);
      }

      // Snare drum on backbeats (steps 4, 12, 20, 28)
      if (step % 8 === 4) {
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = this.getNoiseBuffer(this.audioCtx);

        const snareFilter = this.audioCtx.createBiquadFilter();
        snareFilter.type = 'bandpass';
        snareFilter.frequency.setValueAtTime(1200, t);
        snareFilter.Q.setValueAtTime(1.5, t);

        const snareGain = this.audioCtx.createGain();
        snareGain.gain.setValueAtTime(0.12, t);
        snareGain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

        noise.connect(snareFilter);
        snareFilter.connect(snareGain);
        snareGain.connect(this.audioCtx.destination);

        noise.start(t);
        noise.stop(t + 0.1);
      }

      // Hi-hat tick on offbeats (every 2 steps)
      if (step % 2 === 1) {
        const noise = this.audioCtx.createBufferSource();
        noise.buffer = this.getNoiseBuffer(this.audioCtx);

        const hatFilter = this.audioCtx.createBiquadFilter();
        hatFilter.type = 'highpass';
        hatFilter.frequency.setValueAtTime(7500, t);

        const hatGain = this.audioCtx.createGain();
        hatGain.gain.setValueAtTime(0.035, t);
        hatGain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

        noise.connect(hatFilter);
        hatFilter.connect(hatGain);
        hatGain.connect(this.audioCtx.destination);

        noise.start(t);
        noise.stop(t + 0.04);
      }

      this.bgmStep++;
    }, stepDuration);
  }

  public static stopBgm(): void {
    if (this.bgmTimer !== null) {
      clearInterval(this.bgmTimer);
      this.bgmTimer = null;
    }
  }

  public static toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.isMuted) {
      this.stopBgm();
    } else {
      this.startBgm();
    }
    return this.isMuted;
  }
}
