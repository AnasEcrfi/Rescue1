/**
 * HTML5 Audio Manager - Zuverlässigere Alternative zu Web Audio API
 * Funktioniert besser mit Safari und macOS
 */

class HTMLAudioManager {
  private isEnabled: boolean = true;

  /**
   * Erstellt einen einfachen Beep-Sound als Data URL
   */
  private createBeepDataURL(frequency: number, duration: number, volume: number = 0.3): string {
    // Erstelle einen simplen Beep als WAV Data URL
    const sampleRate = 44100;
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // WAV Header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // fmt chunk size
    view.setUint16(20, 1, true); // audio format (PCM)
    view.setUint16(22, 1, true); // num channels
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // byte rate
    view.setUint16(32, 2, true); // block align
    view.setUint16(34, 16, true); // bits per sample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Generate sine wave
    const amplitude = volume * 32767;
    for (let i = 0; i < numSamples; i++) {
      const sample = Math.sin(2 * Math.PI * frequency * i / sampleRate) * amplitude;
      view.setInt16(44 + i * 2, sample, true);
    }

    // Convert to base64
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return 'data:audio/wav;base64,' + btoa(binary);
  }

  /**
   * Spielt einen Sound ab
   */
  private playSound(frequency: number, duration: number, volume: number = 0.3): void {
    if (!this.isEnabled) {
      console.log('[HTML AUDIO] Audio ist deaktiviert');
      return;
    }

    try {
      console.log(`[HTML AUDIO] Spiele Sound ab: ${frequency}Hz, ${duration}s, Volume: ${volume}`);

      const audio = new Audio();
      audio.src = this.createBeepDataURL(frequency, duration, volume);
      audio.volume = volume;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log(`[HTML AUDIO] ✓ Sound erfolgreich abgespielt!`);
          })
          .catch(error => {
            console.error('[HTML AUDIO ERROR] Fehler beim Abspielen:', error);
          });
      }
    } catch (error) {
      console.error('[HTML AUDIO ERROR] Exception:', error);
    }
  }

  /**
   * Aktiviert Audio-System
   */
  public enable(): void {
    this.isEnabled = true;
    console.log('[HTML AUDIO] Audio-System aktiviert');
  }

  /**
   * Deaktiviert Audio-System
   */
  public disable(): void {
    this.isEnabled = false;
    console.log('[HTML AUDIO] Audio-System deaktiviert');
  }

  // Sound-Funktionen
  playSirenBeep() {
    this.playSound(800, 0.15, 0.5);
  }

  playAlertSound() {
    this.playSound(1000, 0.3, 0.4);
  }

  playSuccessChime() {
    // Spiele 3 Töne nacheinander
    this.playSound(523.25, 0.1, 0.15); // C5
    setTimeout(() => this.playSound(659.25, 0.1, 0.15), 100); // E5
    setTimeout(() => this.playSound(783.99, 0.1, 0.15), 200); // G5
  }

  playFailureSound() {
    this.playSound(300, 0.4, 0.2);
  }

  playRadioClick() {
    this.playSound(150, 0.05, 0.3);
  }

  playArrivalSound() {
    this.playSound(400, 0.1, 0.35);
    setTimeout(() => this.playSound(600, 0.1, 0.35), 80);
  }

  playUrgentSpeakRequest() {
    this.playSound(1200, 0.1, 0.4);
    setTimeout(() => this.playSound(1200, 0.1, 0.4), 150);
    setTimeout(() => this.playSound(1200, 0.1, 0.4), 300);
  }

  playBackupWarning() {
    this.playSound(700, 0.4, 0.45);
  }

  playCompletionSound() {
    // Spiele 4 Töne aufsteigend
    this.playSound(523.25, 0.08, 0.25); // C5
    setTimeout(() => this.playSound(659.25, 0.08, 0.25), 80); // E5
    setTimeout(() => this.playSound(783.99, 0.08, 0.25), 160); // G5
    setTimeout(() => this.playSound(1046.50, 0.08, 0.25), 240); // C6
  }

  playNotification() {
    this.playSound(880, 0.2, 0.15);
  }

  playTestBeep() {
    console.log('[HTML AUDIO] TEST BEEP - HTML5 Audio Element');
    this.playSound(440, 0.5, 0.5);
  }

  getStatus() {
    return {
      isEnabled: this.isEnabled,
      type: 'HTML5 Audio'
    };
  }
}

export const htmlAudioManager = new HTMLAudioManager();
