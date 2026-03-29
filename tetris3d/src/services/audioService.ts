/**
 * Audio Service - Handles all game sound effects using Web Audio API
 * Sounds are synthesized, no external files needed
 */

export class AudioService {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;
  private masterGain: GainNode | null = null;

  constructor() {
    // Audio context will be initialized on first user interaction
  }

  /**
   * Initialize audio context (must be called after user interaction)
   */
  private ensureAudioContext(): void {
    if (!this.audioContext) {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContext();

      // Create master gain node for volume control
      this.masterGain = this.audioContext.createGain();
      this.masterGain.gain.value = 0.3; // 30% volume
      this.masterGain.connect(this.audioContext.destination);
    }

    // Resume if suspended (some browsers require this)
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Play a tone with specified frequency and duration
   */
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.enabled || !this.audioContext || !this.masterGain) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

    // Envelope: Attack, Decay
    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.masterGain);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  /**
   * Play a sequence of notes (melody)
   */
  private playMelody(notes: Array<{ frequency: number; duration: number }>, gap: number = 0.1): void {
    if (!this.enabled || !this.audioContext) return;

    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playTone(note.frequency, note.duration, 'sine');
      }, index * (note.duration * 1000 + gap * 1000));
    });
  }

  /**
   * Play move sound effect - short high-pitched beep
   */
  playMove(): void {
    this.ensureAudioContext();
    this.playTone(800, 0.05, 'square');
  }

  /**
   * Play rotate sound effect - mid-pitched tone
   */
  playRotate(): void {
    this.ensureAudioContext();
    this.playTone(600, 0.08, 'triangle');
  }

  /**
   * Play drop sound effect - low-pitched thud
   */
  playDrop(): void {
    this.ensureAudioContext();
    this.playTone(200, 0.1, 'sawtooth');
  }

  /**
   * Play clear sound effect - ascending melody based on lines cleared
   */
  playClear(lines: number): void {
    this.ensureAudioContext();

    // Different melodies for different line counts
    const melodies: Record<number, Array<{ frequency: number; duration: number }>> = {
      1: [
        { frequency: 523.25, duration: 0.15 }, // C5
        { frequency: 659.25, duration: 0.15 }, // E5
        { frequency: 783.99, duration: 0.2 },  // G5
      ],
      2: [
        { frequency: 523.25, duration: 0.1 }, // C5
        { frequency: 659.25, duration: 0.1 }, // E5
        { frequency: 783.99, duration: 0.1 }, // G5
        { frequency: 1046.50, duration: 0.25 }, // C6
      ],
      3: [
        { frequency: 523.25, duration: 0.08 }, // C5
        { frequency: 659.25, duration: 0.08 }, // E5
        { frequency: 783.99, duration: 0.08 }, // G5
        { frequency: 1046.50, duration: 0.08 }, // C6
        { frequency: 1318.51, duration: 0.3 }, // E6
      ],
      4: [ // Tetris!
        { frequency: 659.25, duration: 0.2 }, // E5
        { frequency: 659.25, duration: 0.2 }, // E5
        { frequency: 659.25, duration: 0.2 }, // E5
        { frequency: 523.25, duration: 0.2 }, // C5
        { frequency: 659.25, duration: 0.2 }, // E5
        { frequency: 783.99, duration: 0.4 }, // G5
        { frequency: 1046.50, duration: 0.6 }, // C6
      ],
    };

    // Default melody for >4 lines (same as 4)
    const melody = melodies[Math.min(lines, 4)] || melodies[4];
    this.playMelody(melody, 0.05);
  }

  /**
   * Play game over sound effect - descending melody
   */
  playGameOver(): void {
    this.ensureAudioContext();

    const melody = [
      { frequency: 392.00, duration: 0.2 }, // G4
      { frequency: 349.23, duration: 0.2 }, // F4
      { frequency: 329.63, duration: 0.2 }, // E4
      { frequency: 293.66, duration: 0.2 }, // D4
      { frequency: 261.63, duration: 0.4 }, // C4
    ];

    this.playMelody(melody, 0.1);
  }

  /**
   * Play pause sound effect
   */
  playPause(): void {
    this.ensureAudioContext();
    this.playTone(440, 0.15, 'sine');
  }

  /**
   * Enable or disable sound effects
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  /**
   * Check if sound is enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Set master volume (0.0 to 1.0)
   */
  setVolume(volume: number): void {
    if (this.masterGain) {
      this.masterGain.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  /**
   * Cleanup audio resources
   */
  dispose(): void {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
      this.masterGain = null;
    }
  }
}

// Singleton instance
let audioServiceInstance: AudioService | null = null;

export function getAudioService(): AudioService {
  if (!audioServiceInstance) {
    audioServiceInstance = new AudioService();
  }
  return audioServiceInstance;
}
