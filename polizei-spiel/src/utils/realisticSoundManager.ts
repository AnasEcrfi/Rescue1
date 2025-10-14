/**
 * Realistischer Sound Manager für authentische deutsche Polizei-Sounds
 * Verwendet echte PropCop Sound-Bibliothek mit TETRA-Funkgeräten
 *
 * Features:
 * - Gedämpfter Hintergrund-Funkverkehr
 * - Blaulicht-Aktivierungs-Sound
 * - Sirenen mit adaptiver Lautstärke
 * - Vollständige Einstellungen-Kontrolle
 */

export interface SoundConfig {
  path: string;
  volume?: number;
  loop?: boolean;
}

export interface SoundSettings {
  masterVolume: number; // 0-1
  radioVolume: number; // 0-1
  sirenVolume: number; // 0-1
  uiSoundsEnabled: boolean;
  radioSoundsEnabled: boolean;
  sirenSoundsEnabled: boolean;
  alarmSoundsEnabled: boolean;
}

class RealisticSoundManager {
  private isEnabled: boolean = true;
  private audioCache: Map<string, HTMLAudioElement> = new Map();
  private backgroundRadio: HTMLAudioElement | null = null;
  private activeSirens: Map<number, HTMLAudioElement> = new Map(); // vehicleId -> audio

  // Lautstärke-Einstellungen
  private masterVolume: number = 0.7;
  private backgroundRadioVolume: number = 0.05; // SEHR LEISE: 5%
  private sirenVolume: number = 0.08; // Noch dezenter: 8% (vorher 12%)

  // Feature-Toggles
  private uiSoundsEnabled: boolean = true;
  private radioSoundsEnabled: boolean = true;
  private sirenSoundsEnabled: boolean = true;
  private alarmSoundsEnabled: boolean = true;

  // Sound-Pfade basierend auf der organisierten Struktur
  private sounds = {
    // Funk-Sounds
    funk: {
      radioChatter: '/sounds/game/funk/polizeifunk_01.wav',
      // Verschiedene PTT-Sounds für Abwechslung
      pttPress: [
        '/sounds/game/funk/funk_ptt_press.wav',        // Motorola
        '/sounds/game/funk/funk_ptt_press_sepura.wav', // Sepura
        '/sounds/game/funk/funk_ptt_press_piker.wav',  // Piker
      ],
      pttRelease: '/sounds/game/funk/funk_ptt_release.wav',
      doubleTone: '/sounds/game/funk/funk_signal_doubletone.wav',
      quattroneTone: '/sounds/game/funk/funk_signal_quattrone.wav',
    },
    // Leitstellen-Sounds
    leitstelle: {
      // Verschiedene Button-Beeps für Abwechslung
      buttonBeep: [
        '/sounds/game/leitstelle/button_beep.wav',       // Standard
        '/sounds/game/leitstelle/button_beep_hella.wav', // Hella RTK7
      ],
    },
    // Fahrzeug-Sounds
    fahrzeug: {
      // Verschiedene Sirenen für Abwechslung
      sirenen: [
        '/sounds/game/fahrzeug/sirene_loop.wav',
        '/sounds/game/fahrzeug/sirene_nrw.wav',
        '/sounds/game/fahrzeug/sirene_close.wav',
        '/sounds/game/fahrzeug/sirene_flagger.wav',
      ],
      hornDistanz: '/sounds/game/fahrzeug/horn_distanz.wav',
      blaulichtActivate: '/sounds/propcop-free-sounds/Streifenwagen/standby_BT_button-sound.wav',
    },
    // UI-Sounds
    ui: {
      buttonClick: '/sounds/game/ui/button_click.wav',
    },
  };

  /**
   * Initialisiert Audio-System (sollte nach User-Interaktion aufgerufen werden)
   */
  public async initialize(): Promise<void> {
    console.log('[REALISTIC AUDIO] Initialisiere Sound-System...');
    this.isEnabled = true;

    // Pre-load kritische Sounds
    await this.preloadSound(this.sounds.funk.quattroneTone);
    await this.preloadSound(this.sounds.funk.pttPress);
    await this.preloadSound(this.sounds.ui.buttonClick);
    await this.preloadSound(this.sounds.fahrzeug.blaulichtActivate);

    console.log('[REALISTIC AUDIO] ✓ Sound-System initialisiert');
  }

  /**
   * Lädt einen Sound vor (für bessere Performance)
   */
  private async preloadSound(path: string): Promise<void> {
    if (this.audioCache.has(path)) return;

    try {
      const audio = new Audio(path);
      audio.preload = 'auto';

      await new Promise<void>((resolve, reject) => {
        audio.addEventListener('canplaythrough', () => resolve(), { once: true });
        audio.addEventListener('error', () => reject(new Error(`Fehler beim Laden: ${path}`)), { once: true });
        audio.load();
      });

      this.audioCache.set(path, audio);
      console.log(`[REALISTIC AUDIO] ✓ Vorgeladen: ${path}`);
    } catch (error) {
      console.error(`[REALISTIC AUDIO] Fehler beim Vorladen von ${path}:`, error);
    }
  }

  /**
   * Spielt einen Sound ab
   */
  private async playSound(path: string, volume: number = 1.0, loop: boolean = false): Promise<HTMLAudioElement | null> {
    if (!this.isEnabled) {
      console.log('[REALISTIC AUDIO] Audio deaktiviert');
      return null;
    }

    try {
      let audio: HTMLAudioElement;

      // Verwende gecachten Sound oder erstelle neuen
      if (this.audioCache.has(path)) {
        audio = this.audioCache.get(path)!.cloneNode() as HTMLAudioElement;
      } else {
        audio = new Audio(path);
      }

      audio.volume = Math.min(1.0, volume * this.masterVolume);
      audio.loop = loop;

      const playPromise = audio.play();

      if (playPromise !== undefined) {
        await playPromise;
        console.log(`[REALISTIC AUDIO] ✓ Spiele ab: ${path.split('/').pop()}`);
      }

      return audio;
    } catch (error) {
      console.error(`[REALISTIC AUDIO] Fehler beim Abspielen von ${path}:`, error);
      return null;
    }
  }

  /**
   * Stoppt einen laufenden Sound
   */
  private stopSound(audio: HTMLAudioElement | null): void {
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  }

  /**
   * Stoppt ALLE laufenden Sounds (für Menü-Rückkehr)
   */
  public stopAllSounds(): void {
    console.log('[REALISTIC AUDIO] Stoppe alle Sounds...');

    // Stoppe Hintergrund-Funk
    this.stopBackgroundRadioChatter();

    // Stoppe alle Sirenen
    this.activeSirens.forEach((audio, vehicleId) => {
      this.stopSound(audio);
    });
    this.activeSirens.clear();

    console.log('[REALISTIC AUDIO] ✓ Alle Sounds gestoppt');
  }

  // ===== FUNK-SOUNDS =====

  /**
   * Spielt Hintergrund-Funkverkehr ab (10 Min Loop)
   * LEISER UND GEDÄMPFT - man versteht nicht jedes Wort
   */
  public startBackgroundRadioChatter(volume?: number): void {
    if (!this.radioSoundsEnabled) {
      console.log('[REALISTIC AUDIO] Radio-Sounds deaktiviert');
      return;
    }

    if (this.backgroundRadio) {
      console.log('[REALISTIC AUDIO] Hintergrund-Funk läuft bereits');
      return;
    }

    // EXTREM leise: 1% (vorher 2%)
    const finalVolume = volume !== undefined ? volume : this.backgroundRadioVolume * 0.2;

    console.log('[REALISTIC AUDIO] Starte Hintergrund-Funkverkehr (extrem gedämpft, kaum hörbar)...');
    this.backgroundRadio = new Audio(this.sounds.funk.radioChatter);
    this.backgroundRadio.volume = finalVolume * this.masterVolume;
    this.backgroundRadio.loop = true;

    // MAXIMALE DÄMPFUNG: Playback-Rate 85% (vorher 88%) = klingt sehr entfernt und stark muffled
    this.backgroundRadio.playbackRate = 0.85;

    // 🎲 ZUFÄLLIGE STARTPOSITION: Starte irgendwo zwischen 0-540 Sekunden (9 Minuten)
    // Das Audio ist ca. 600 Sekunden lang, wir lassen die letzten 60s aus für sanften Loop
    this.backgroundRadio.addEventListener('loadedmetadata', () => {
      if (this.backgroundRadio) {
        const duration = this.backgroundRadio.duration;
        // Zufällige Position zwischen 0 und 90% der Gesamtlänge
        const randomStart = Math.random() * (duration * 0.9);
        this.backgroundRadio.currentTime = randomStart;
        console.log(`[REALISTIC AUDIO] ✓ Funkverkehr startet bei ${Math.floor(randomStart)}s (zufällig)`);
      }
    });

    this.backgroundRadio.play()
      .then(() => console.log('[REALISTIC AUDIO] ✓ Hintergrund-Funkverkehr läuft (sehr subtil, muffled, zufällige Position)'))
      .catch(err => console.error('[REALISTIC AUDIO] Fehler beim Starten des Funkverkehrs:', err));
  }

  /**
   * Stoppt Hintergrund-Funkverkehr
   */
  public stopBackgroundRadioChatter(): void {
    if (this.backgroundRadio) {
      this.stopSound(this.backgroundRadio);
      this.backgroundRadio = null;
      console.log('[REALISTIC AUDIO] Hintergrund-Funkverkehr gestoppt');
    }
  }

  /**
   * Setzt Lautstärke des Hintergrund-Funkverkehrs
   */
  public setBackgroundRadioVolume(volume: number): void {
    this.backgroundRadioVolume = volume;
    if (this.backgroundRadio) {
      this.backgroundRadio.volume = Math.min(1.0, volume * this.masterVolume);
    }
  }

  /**
   * PTT-Taste gedrückt (Push-to-Talk)
   * Wählt zufällig zwischen verschiedenen PTT-Sounds für Abwechslung
   */
  public playPTTPress(volume: number = 0.55): void {
    if (!this.radioSoundsEnabled) return;
    // 🎲 ZUFÄLLIGE PTT-AUSWAHL für Abwechslung
    const randomPTTIndex = Math.floor(Math.random() * this.sounds.funk.pttPress.length);
    const selectedPTT = this.sounds.funk.pttPress[randomPTTIndex];
    this.playSound(selectedPTT, volume);
  }

  /**
   * PTT-Taste losgelassen
   */
  public playPTTRelease(volume: number = 0.55): void {
    if (!this.radioSoundsEnabled) return;
    this.playSound(this.sounds.funk.pttRelease, volume);
  }

  /**
   * Doppelton-Signal für wichtige Durchsagen
   */
  public playDoubleToneAlert(volume: number = 0.45): void {
    if (!this.alarmSoundsEnabled) return;
    console.log('[REALISTIC AUDIO] 🔔 DOPPELTON - Wichtige Durchsage!');
    this.playSound(this.sounds.funk.doubleTone, volume);
  }

  /**
   * 4-Ton Alarmsignal für Notfälle/kritische Einsätze
   */
  public playQuattroneAlert(volume: number = 0.55): void {
    if (!this.alarmSoundsEnabled) return;
    console.log('[REALISTIC AUDIO] 🚨 QUATTRONE ALARM - Kritischer Einsatz!');
    this.playSound(this.sounds.funk.quattroneTone, volume);
  }

  /**
   * Funk-Kommunikation simulieren (PTT + Pause + Release)
   */
  public async playRadioCommunication(durationMs: number = 2000): Promise<void> {
    this.playPTTPress();
    await new Promise(resolve => setTimeout(resolve, durationMs));
    this.playPTTRelease();
  }

  // ===== LEITSTELLEN-SOUNDS =====

  /**
   * Button-Piep für Leitstellen-Aktionen
   * Wählt zufällig zwischen verschiedenen Beep-Sounds für Abwechslung
   */
  public playLeitstelleButtonBeep(volume: number = 0.4): void {
    if (!this.uiSoundsEnabled) return;
    // 🎲 ZUFÄLLIGE BEEP-AUSWAHL für Abwechslung
    const randomBeepIndex = Math.floor(Math.random() * this.sounds.leitstelle.buttonBeep.length);
    const selectedBeep = this.sounds.leitstelle.buttonBeep[randomBeepIndex];
    this.playSound(selectedBeep, volume);
  }

  /**
   * Neue Einsatzmeldung mit authentischem Alarm
   */
  public playNewIncidentAlert(): void {
    console.log('[REALISTIC AUDIO] 🚨 NEUE EINSATZMELDUNG!');
    this.playQuattroneAlert(0.40); // Deutlich leiser: 0.40 (vorher 0.55)
  }

  /**
   * Einsatz angenommen - bestätigendes Signal
   */
  public playIncidentAccepted(): void {
    console.log('[REALISTIC AUDIO] ✓ Einsatz angenommen');
    this.playLeitstelleButtonBeep(0.4); // Reduziert von 0.6 auf 0.4

    // PTT-Bestätigung nach 300ms
    setTimeout(() => {
      this.playPTTPress(0.35); // Reduziert von 0.5 auf 0.35
      setTimeout(() => this.playPTTRelease(0.35), 800);
    }, 300);
  }

  /**
   * Fahrzeug-Status-Update (FMS)
   */
  public playVehicleStatusUpdate(): void {
    console.log('[REALISTIC AUDIO] 📡 Fahrzeug-Status-Update');
    this.playDoubleToneAlert(0.5);
  }

  /**
   * Context-basierte Sprechwunsch-Sounds
   */
  public playSpeakRequestSound(requestType: 'situation_report' | 'escalation' | 'backup_needed' | 'suspect_arrested' | 'additional_info' | 'unclear_situation'): void {
    console.log(`[REALISTIC AUDIO] 📻 Sprechwunsch: ${requestType}`);

    switch (requestType) {
      case 'backup_needed':
      case 'escalation':
        // DRINGEND: Quattrone-Alarm
        this.playQuattroneAlert(0.50); // Leiser als neue Einsätze
        break;

      case 'unclear_situation':
        // ACHTUNG: Doppelton etwas lauter
        this.playDoubleToneAlert(0.48);
        break;

      case 'situation_report':
      case 'additional_info':
        // NORMAL: Doppelton leiser
        this.playDoubleToneAlert(0.40);
        break;

      case 'suspect_arrested':
        // ERFOLG: Einzelner Button-Beep (positiv)
        this.playLeitstelleButtonBeep(0.45);
        break;

      default:
        this.playDoubleToneAlert(0.40);
    }
  }

  // ===== FAHRZEUG-SOUNDS =====

  /**
   * 🚨 BLAULICHT AKTIVIEREN - DER PIEP-SOUND!
   * Authentischer Standby BT Button-Sound
   */
  public playBlaulichtActivate(volume: number = 0.5): void {
    if (!this.sirenSoundsEnabled) return;
    console.log('[REALISTIC AUDIO] 🚨 BLAULICHT AKTIVIERT - *PIEP*');
    this.playSound(this.sounds.fahrzeug.blaulichtActivate, volume);
  }

  /**
   * Startet Sirene für ein Fahrzeug (einmaliges Abspielen mit Fade-out)
   * Dezent und nicht störend - spielt nur einmal ab und fadet aus
   * Wählt zufällig zwischen verschiedenen Sirenen für Abwechslung
   */
  public async startSirene(vehicleId: number, baseVolume?: number, adaptive: boolean = true): Promise<void> {
    if (!this.sirenSoundsEnabled) return;

    // Wenn Sirene bereits läuft, nicht neu starten
    if (this.activeSirens.has(vehicleId)) {
      return;
    }

    // Noch dezenter: 30% vom sirenVolume (vorher 40%)
    const volume = baseVolume !== undefined ? baseVolume : this.sirenVolume * 0.3;

    // 🎲 ZUFÄLLIGE SIRENEN-AUSWAHL für Abwechslung
    const randomSirenIndex = Math.floor(Math.random() * this.sounds.fahrzeug.sirenen.length);
    const selectedSiren = this.sounds.fahrzeug.sirenen[randomSirenIndex];

    console.log(`[REALISTIC AUDIO] 🚨 Sirene kurz für Fahrzeug ${vehicleId} (Typ ${randomSirenIndex + 1}, einmalig, dezent)`);
    // KEIN LOOP - spielt nur einmal ab
    const audio = await this.playSound(selectedSiren, volume, false);

    if (audio) {
      this.activeSirens.set(vehicleId, audio);

      // Fade-out nach 1 Sekunde starten (kürzer aber mit sanftem Fade-out)
      setTimeout(() => {
        if (audio && !audio.paused) {
          this.fadeVolume(audio, audio.volume, 0, 1200).then(() => {
            this.stopSound(audio);
            this.activeSirens.delete(vehicleId);
            console.log(`[REALISTIC AUDIO] Sirene für Fahrzeug ${vehicleId} ausgefadet`);
          });
        }
      }, 1000);

      // Audio beendet Event - aufräumen
      audio.addEventListener('ended', () => {
        this.activeSirens.delete(vehicleId);
      });
    }
  }

  /**
   * Stoppt Sirene für ein Fahrzeug
   */
  public stopSirene(vehicleId: number): void {
    const audio = this.activeSirens.get(vehicleId);
    if (audio) {
      // Fade-out für sanftes Stoppen
      this.fadeVolume(audio, audio.volume, 0, 800).then(() => {
        this.stopSound(audio);
        this.activeSirens.delete(vehicleId);
        console.log(`[REALISTIC AUDIO] Sirene für Fahrzeug ${vehicleId} gestoppt`);
      });
    }
  }

  /**
   * Fade-Effekt für Lautstärke
   */
  private fadeVolume(audio: HTMLAudioElement, fromVolume: number, toVolume: number, duration: number): Promise<void> {
    return new Promise((resolve) => {
      const steps = 20;
      const stepDuration = duration / steps;
      const volumeStep = (toVolume - fromVolume) / steps;
      let currentStep = 0;

      const interval = setInterval(() => {
        currentStep++;
        audio.volume = Math.max(0, Math.min(1, fromVolume + (volumeStep * currentStep)));

        if (currentStep >= steps) {
          clearInterval(interval);
          resolve();
        }
      }, stepDuration);
    });
  }

  /**
   * Horn aus der Distanz
   */
  public playHornDistanz(volume: number = 0.3): void {
    if (!this.sirenSoundsEnabled) return;
    this.playSound(this.sounds.fahrzeug.hornDistanz, volume);
  }

  // ===== UI-SOUNDS =====

  /**
   * Standard-Button-Klick für UI
   */
  public playButtonClick(volume: number = 0.4): void {
    if (!this.uiSoundsEnabled) return;
    this.playSound(this.sounds.ui.buttonClick, volume);
  }

  /**
   * Klick für wichtige Aktionen (lauter)
   */
  public playImportantButtonClick(volume: number = 0.6): void {
    this.playLeitstelleButtonBeep(volume);
  }

  // ===== EINSTELLUNGEN =====

  /**
   * Aktiviert Audio-System
   */
  public enable(): void {
    this.isEnabled = true;
    console.log('[REALISTIC AUDIO] ✓ Audio-System aktiviert');
  }

  /**
   * Deaktiviert Audio-System komplett
   */
  public disable(): void {
    this.isEnabled = false;
    this.stopAllSounds();
    console.log('[REALISTIC AUDIO] Audio-System deaktiviert');
  }

  /**
   * Setzt Master-Lautstärke (0.0 - 1.0)
   */
  public setMasterVolume(volume: number): void {
    this.masterVolume = Math.max(0, Math.min(1, volume));
    console.log(`[REALISTIC AUDIO] Master-Lautstärke: ${(this.masterVolume * 100).toFixed(0)}%`);

    // Update aktive Sounds
    if (this.backgroundRadio) {
      this.backgroundRadio.volume = this.backgroundRadioVolume * this.masterVolume;
    }
    this.activeSirens.forEach(audio => {
      audio.volume = this.sirenVolume * this.masterVolume;
    });
  }

  /**
   * Holt aktuelle Einstellungen
   */
  public getSettings(): SoundSettings {
    return {
      masterVolume: this.masterVolume,
      radioVolume: this.backgroundRadioVolume,
      sirenVolume: this.sirenVolume,
      uiSoundsEnabled: this.uiSoundsEnabled,
      radioSoundsEnabled: this.radioSoundsEnabled,
      sirenSoundsEnabled: this.sirenSoundsEnabled,
      alarmSoundsEnabled: this.alarmSoundsEnabled,
    };
  }

  /**
   * Setzt Einstellungen
   */
  public setSettings(settings: Partial<SoundSettings>): void {
    if (settings.masterVolume !== undefined) this.setMasterVolume(settings.masterVolume);
    if (settings.radioVolume !== undefined) this.setBackgroundRadioVolume(settings.radioVolume);
    if (settings.sirenVolume !== undefined) this.sirenVolume = settings.sirenVolume;
    if (settings.uiSoundsEnabled !== undefined) this.uiSoundsEnabled = settings.uiSoundsEnabled;
    if (settings.radioSoundsEnabled !== undefined) {
      this.radioSoundsEnabled = settings.radioSoundsEnabled;
      if (!settings.radioSoundsEnabled) this.stopBackgroundRadioChatter();
    }
    if (settings.sirenSoundsEnabled !== undefined) {
      this.sirenSoundsEnabled = settings.sirenSoundsEnabled;
      if (!settings.sirenSoundsEnabled) {
        this.activeSirens.forEach((audio, id) => this.stopSirene(id));
      }
    }
    if (settings.alarmSoundsEnabled !== undefined) this.alarmSoundsEnabled = settings.alarmSoundsEnabled;

    console.log('[REALISTIC AUDIO] Einstellungen aktualisiert:', this.getSettings());
  }

  /**
   * Status-Abfrage
   */
  public getStatus(): {
    isEnabled: boolean;
    backgroundRadioActive: boolean;
    activeSirens: number;
    masterVolume: number;
  } {
    return {
      isEnabled: this.isEnabled,
      backgroundRadioActive: this.backgroundRadio !== null,
      activeSirens: this.activeSirens.size,
      masterVolume: this.masterVolume,
    };
  }

  /**
   * Test-Funktion: Spielt alle Sounds nacheinander ab
   */
  public async playTestSequence(): Promise<void> {
    console.log('[REALISTIC AUDIO] 🎵 Starte Test-Sequenz...');

    await this.playSound(this.sounds.ui.buttonClick);
    await new Promise(resolve => setTimeout(resolve, 500));

    await this.playSound(this.sounds.leitstelle.buttonBeep);
    await new Promise(resolve => setTimeout(resolve, 500));

    await this.playSound(this.sounds.fahrzeug.blaulichtActivate);
    await new Promise(resolve => setTimeout(resolve, 800));

    await this.playSound(this.sounds.funk.pttPress);
    await new Promise(resolve => setTimeout(resolve, 300));
    await this.playSound(this.sounds.funk.pttRelease);
    await new Promise(resolve => setTimeout(resolve, 500));

    await this.playSound(this.sounds.funk.doubleTone);
    await new Promise(resolve => setTimeout(resolve, 1000));

    await this.playSound(this.sounds.funk.quattroneTone);

    console.log('[REALISTIC AUDIO] ✓ Test-Sequenz abgeschlossen');
  }
}

// Singleton-Instanz exportieren
export const realisticSoundManager = new RealisticSoundManager();

// Default export für einfachen Import
export default realisticSoundManager;
