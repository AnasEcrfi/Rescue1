// Sound effects using Web Audio API

class SoundManager {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        console.log('[AUDIO DEBUG] AudioContext initialisiert, initialer State:', this.audioContext?.state);
      } catch (error) {
        console.error('[AUDIO DEBUG ERROR] Konnte AudioContext nicht erstellen:', error);
        this.isEnabled = false;
      }
    }

    // Resume AudioContext falls suspended (Browser Auto-Play Policy)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      console.log('[AUDIO DEBUG] AudioContext ist suspended, versuche zu resumen...');
      this.audioContext.resume().then(() => {
        console.log('[AUDIO DEBUG] AudioContext erfolgreich resumed, neuer State:', this.audioContext?.state);
      }).catch((err) => {
        console.error('[AUDIO DEBUG ERROR] Resume fehlgeschlagen:', err);
      });
    } else if (this.audioContext) {
      console.log('[AUDIO DEBUG] AudioContext State:', this.audioContext.state);
    }

    return this.audioContext!;
  }

  /**
   * Gibt aktuellen AudioContext Status zurück (für Debugging)
   */
  public getStatus(): { isEnabled: boolean; contextState: string | null; contextTime: number | null } {
    return {
      isEnabled: this.isEnabled,
      contextState: this.audioContext?.state || null,
      contextTime: this.audioContext?.currentTime || null,
    };
  }

  /**
   * ULTRA-EINFACHER TEST-SOUND (ohne jegliche Rampen oder Effekte)
   * Falls dieser nicht funktioniert, ist es ein Browser/System-Problem
   */
  playTestBeep() {
    console.log('[AUDIO DEBUG] playTestBeep() - ULTRA-EINFACHER TEST');

    if (!this.isEnabled) {
      console.error('[AUDIO DEBUG] playTestBeep - Audio ist deaktiviert!');
      return;
    }

    const ctx = this.getAudioContext();
    console.log('[AUDIO DEBUG] playTestBeep - AudioContext State:', ctx?.state);

    if (!ctx) {
      console.error('[AUDIO DEBUG] playTestBeep - Kein AudioContext!');
      return;
    }

    try {
      console.log('[AUDIO DEBUG] playTestBeep - Erstelle Oscillator...');
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      console.log('[AUDIO DEBUG] playTestBeep - Verbinde Nodes...');
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      console.log('[AUDIO DEBUG] playTestBeep - Setze Parameter...');
      oscillator.type = 'sine';
      oscillator.frequency.value = 440; // A4 Note
      gainNode.gain.value = 0.3; // Konstanter Gain, KEINE Rampen!

      console.log('[AUDIO DEBUG] playTestBeep - Starte Oscillator...');
      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.5); // 500ms konstanter Ton

      console.log('[AUDIO DEBUG] ✓ playTestBeep - ERFOLGREICH! 440Hz Sine Wave, Gain: 0.3, Duration: 0.5s');
      console.log('[AUDIO DEBUG] Falls du DIESEN Sound nicht hörst, ist es ein Browser/System-Audio Problem!');
    } catch (error) {
      console.error('[AUDIO DEBUG ERROR] playTestBeep - Exception:', error);
    }
  }

  /**
   * Aktiviert Audio (muss vom User-Interaktion getriggert werden)
   */
  public enable(): void {
    console.log('[AUDIO DEBUG] enable() aufgerufen, isEnabled:', this.isEnabled);
    if (!this.isEnabled) {
      console.log('[AUDIO DEBUG] Audio ist deaktiviert, breche ab');
      return;
    }
    const ctx = this.getAudioContext();
    console.log('[AUDIO DEBUG] AudioContext Status:', ctx?.state);
    if (ctx && ctx.state === 'suspended') {
      console.log('[AUDIO DEBUG] Versuche AudioContext zu resumen...');
      ctx.resume().then(() => {
        console.log('[AUDIO DEBUG] AudioContext erfolgreich resumed');
      }).catch((err) => {
        console.error('[AUDIO DEBUG] Fehler beim Resume:', err);
      });
    }
  }

  // Play a short beep for vehicle dispatch
  playSirenBeep() {
    console.log('[AUDIO DEBUG] playSirenBeep() aufgerufen');
    if (!this.isEnabled) {
      console.log('[AUDIO DEBUG] playSirenBeep - Audio deaktiviert');
      return;
    }
    const ctx = this.getAudioContext();
    console.log('[AUDIO DEBUG] playSirenBeep - AudioContext:', ctx?.state);
    if (!ctx) {
      console.error('[AUDIO DEBUG] playSirenBeep - Kein AudioContext verfügbar!');
      return;
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    try {
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(800, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600, ctx.currentTime + 0.1);

      // FIX: linearRampToValueAtTime statt exponentialRamp (exponential kann nicht zu 0 gehen)
      gainNode.gain.setValueAtTime(0.5, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.2);

      console.log('[AUDIO DEBUG] playSirenBeep - Sound erfolgreich abgespielt! Freq: 800->600Hz, Gain: 0.5->0, Duration: 0.2s');
    } catch (error) {
      console.error('[AUDIO DEBUG] playSirenBeep - Fehler beim Abspielen:', error);
    }
  }

  // Play alert sound for critical incidents
  playAlertSound() {
    console.log('[AUDIO DEBUG] playAlertSound() aufgerufen');
    if (!this.isEnabled) {
      console.log('[AUDIO DEBUG] playAlertSound - Audio deaktiviert');
      return;
    }
    const ctx = this.getAudioContext();
    console.log('[AUDIO DEBUG] playAlertSound - AudioContext:', ctx?.state);
    if (!ctx) {
      console.error('[AUDIO DEBUG] playAlertSound - Kein AudioContext verfügbar!');
      return;
    }
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    try {
      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime);
      oscillator.frequency.setValueAtTime(800, ctx.currentTime + 0.1);
      oscillator.frequency.setValueAtTime(1000, ctx.currentTime + 0.2);

      // FIX: linearRampToValueAtTime statt exponentialRamp
      gainNode.gain.setValueAtTime(0.4, ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.3);

      console.log('[AUDIO DEBUG] playAlertSound - Sound erfolgreich abgespielt! Type: square, Freq: 1000->800->1000Hz, Gain: 0.4->0, Duration: 0.3s');
    } catch (error) {
      console.error('[AUDIO DEBUG] playAlertSound - Fehler beim Abspielen:', error);
    }
  }

  // Play success chime when incident resolved
  playSuccessChime() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);
      oscillator.type = 'sine';

      const startTime = ctx.currentTime + (index * 0.1);
      gainNode.gain.setValueAtTime(0.15, startTime);
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.3);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.3);
    });
  }

  // Play failure sound
  playFailureSound() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(300, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(100, ctx.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  }

  // ⭐ UX #1: Neue erweiterte Audio-Feedback Sounds

  // Play radio static/click sound (for radio messages)
  playRadioClick() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.3, ctx.currentTime); // Erhöht von 0.15 auf 0.3
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.05);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.05);
  }

  // Play arrival sound (vehicle arrived at scene)
  playArrivalSound() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Two-tone: low then high
    [400, 600].forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + (index * 0.08);
      gainNode.gain.setValueAtTime(0.35, startTime); // Erhöht von 0.18 auf 0.35
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.15);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.15);
    });
  }

  // Play urgent speak request sound (higher priority)
  playUrgentSpeakRequest() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Rapid beeping
    for (let i = 0; i < 3; i++) {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(1200, ctx.currentTime);

      const startTime = ctx.currentTime + (i * 0.15);
      gainNode.gain.setValueAtTime(0.4, startTime); // Erhöht von 0.22 auf 0.4
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.1);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.1);
    }
  }

  // Play backup required warning sound
  playBackupWarning() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'triangle';

    // Warbling effect
    oscillator.frequency.setValueAtTime(700, ctx.currentTime);
    oscillator.frequency.setValueAtTime(900, ctx.currentTime + 0.15);
    oscillator.frequency.setValueAtTime(700, ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.45, ctx.currentTime); // Erhöht von 0.25 auf 0.45
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.4);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.4);
  }

  // Play incident completion sound (mission accomplished)
  playCompletionSound() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    // Ascending notes: C5 → E5 → G5 → C6
    const notes = [523.25, 659.25, 783.99, 1046.50];

    notes.forEach((freq, index) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(freq, ctx.currentTime);

      const startTime = ctx.currentTime + (index * 0.08);
      gainNode.gain.setValueAtTime(0.25, startTime); // Erhöht von 0.12 auf 0.25
      gainNode.gain.linearRampToValueAtTime(0, startTime + 0.25);

      oscillator.start(startTime);
      oscillator.stop(startTime + 0.25);
    });
  }

  // Play notification sound (generic notification)
  playNotification() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, ctx.currentTime);

    gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.2);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  }
}

export const soundManager = new SoundManager();
