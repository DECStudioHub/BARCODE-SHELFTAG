/**
 * High-fidelity Retail Welcome Sound Synthesizer using Web Audio API.
 * Synthesizes a warm, friendly, professional 3-tone boutique retail entrance chime
 * (G5 -> B5 -> D6 -> G6 harmonic chime) with smooth exponential decay.
 *
 * Features:
 * - Zero external assets or network dependencies
 * - Safe handling of browser autoplay policies without console errors
 * - Warm harmonic chime timbre (sine fundamental + soft bell overtone)
 * - Safe non-intrusive comfortable volume (approx 0.14 peak gain)
 * - Target duration ~2.0 seconds
 */

export async function playRetailWelcomeSound(volume: number = 0.14): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return false;

    const ctx = new AudioContextClass();

    // Check if the context is suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch {
        // Autoplay permission not granted yet - fail gracefully
        return false;
      }
    }

    if (ctx.state !== 'running') {
      return false;
    }

    const now = ctx.currentTime;

    // Master Gain
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(Math.max(0.01, Math.min(volume, 0.3)), now);
    masterGain.connect(ctx.destination);

    // Modern boutique retail welcome chime chords (G major chord: G5, B5, D6 with G6 sparkle)
    // t: start time offset, freq: fundamental frequency, dur: individual note decay time
    const chimeNotes = [
      { t: 0.00, freq: 783.99, decay: 1.4, gainScale: 0.8 },  // G5
      { t: 0.16, freq: 987.77, decay: 1.5, gainScale: 0.9 },  // B5
      { t: 0.32, freq: 1174.66, decay: 1.7, gainScale: 1.0 }, // D6
      { t: 0.48, freq: 1567.98, decay: 1.8, gainScale: 0.7 }, // G6 (gentle sparkle)
    ];

    chimeNotes.forEach(note => {
      const noteStart = now + note.t;

      // 1. Fundamental chime oscillator (sine wave for pure clarity)
      const osc1 = ctx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(note.freq, noteStart);

      // 2. Gentle overtone oscillator (2x octave harmonic for warm bell timbre)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(note.freq * 2, noteStart);

      // Note gain envelope
      const noteGain = ctx.createGain();
      const peakGain = 0.32 * note.gainScale;

      // Quick attack (15ms) to prevent speaker popping
      noteGain.gain.setValueAtTime(0.0001, noteStart);
      noteGain.gain.exponentialRampToValueAtTime(peakGain, noteStart + 0.018);
      // Smooth exponential decay (store greeting bell resonance)
      noteGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.decay);

      // Overtone gain (soft, 18% of fundamental)
      const overtoneGain = ctx.createGain();
      overtoneGain.gain.setValueAtTime(peakGain * 0.18, noteStart);
      overtoneGain.gain.exponentialRampToValueAtTime(0.0001, noteStart + note.decay * 0.7);

      // Connections
      osc1.connect(noteGain);
      osc2.connect(overtoneGain);
      overtoneGain.connect(noteGain);
      noteGain.connect(masterGain);

      // Schedule start & stop
      osc1.start(noteStart);
      osc2.start(noteStart);
      osc1.stop(noteStart + note.decay + 0.05);
      osc2.stop(noteStart + note.decay + 0.05);
    });

    // Close audio context after playback completes (~2.4s) to free system audio resources
    setTimeout(() => {
      try {
        if (ctx.state !== 'closed') {
          ctx.close().catch(() => {});
        }
      } catch {}
    }, 2500);

    return true;
  } catch (err) {
    // Autoplay blocked or Web Audio unavailable - do not throw or alarm the user
    return false;
  }
}
