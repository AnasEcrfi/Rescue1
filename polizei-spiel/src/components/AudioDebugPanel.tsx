import React, { useState } from 'react';
import { soundManager } from '../utils/soundEffects';
import { htmlAudioManager } from '../utils/htmlAudioManager';
import '../styles/AudioDebugPanel.css';

const AudioDebugPanel: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [lastPlayed, setLastPlayed] = useState<string>('');
  const [audioStatus, setAudioStatus] = useState<{ isEnabled: boolean; contextState: string | null; contextTime: number | null }>({
    isEnabled: false,
    contextState: null,
    contextTime: null,
  });

  const updateStatus = () => {
    const status = htmlAudioManager.getStatus();
    setAudioStatus({
      isEnabled: status.isEnabled,
      contextState: status.type,
      contextTime: null
    });
    console.log('[AUDIO DEBUG PANEL] Status aktualisiert:', status);
  };

  const playSound = (name: string, soundFn: () => void) => {
    console.log(`[AUDIO DEBUG PANEL] Spiele Sound ab: ${name}`);
    setLastPlayed(name);
    try {
      soundFn();
      console.log(`[AUDIO DEBUG PANEL] ${name} - Sound-Funktion aufgerufen`);
      // Status nach Sound-Aufruf aktualisieren
      setTimeout(updateStatus, 100);
    } catch (error) {
      console.error(`[AUDIO DEBUG PANEL] Fehler beim Abspielen von ${name}:`, error);
    }
  };

  const sounds = [
    { name: '🎵 TEST BEEP (440Hz)', fn: () => htmlAudioManager.playTestBeep(), isTest: true },
    { name: 'Siren Beep', fn: () => htmlAudioManager.playSirenBeep() },
    { name: 'Alert Sound', fn: () => htmlAudioManager.playAlertSound() },
    { name: 'Radio Click', fn: () => htmlAudioManager.playRadioClick() },
    { name: 'Arrival Sound', fn: () => htmlAudioManager.playArrivalSound() },
    { name: 'Urgent Speak Request', fn: () => htmlAudioManager.playUrgentSpeakRequest() },
    { name: 'Backup Warning', fn: () => htmlAudioManager.playBackupWarning() },
    { name: 'Completion Sound', fn: () => htmlAudioManager.playCompletionSound() },
    { name: 'Notification', fn: () => htmlAudioManager.playNotification() },
    { name: 'Success Chime', fn: () => htmlAudioManager.playSuccessChime() },
    { name: 'Failure Sound', fn: () => htmlAudioManager.playFailureSound() },
  ];

  if (!isOpen) {
    return (
      <button
        className="audio-debug-toggle"
        onClick={() => setIsOpen(true)}
        title="Audio Debug Panel öffnen"
      >
        🔊 Audio Debug
      </button>
    );
  }

  return (
    <div className="audio-debug-panel">
      <div className="audio-debug-header">
        <h3>🔊 Audio Debug Panel</h3>
        <button
          className="audio-debug-close"
          onClick={() => setIsOpen(false)}
          title="Schließen"
        >
          ✕
        </button>
      </div>

      <div className="audio-debug-info">
        <p><strong>Letzter Sound:</strong> {lastPlayed || 'Keiner'}</p>
        <div className="audio-status-info">
          <p><strong>Audio Enabled:</strong> <span className={audioStatus.isEnabled ? 'status-ok' : 'status-error'}>{audioStatus.isEnabled ? '✓ Ja' : '✗ Nein'}</span></p>
          <p><strong>Context State:</strong> <span className={audioStatus.contextState === 'running' ? 'status-ok' : 'status-warn'}>{audioStatus.contextState || 'Nicht initialisiert'}</span></p>
          <p><strong>Context Time:</strong> {audioStatus.contextTime?.toFixed(2) || 'N/A'}s</p>
        </div>
        <button
          className="audio-debug-enable-btn"
          onClick={() => {
            console.log('[AUDIO DEBUG PANEL] Enable-Button geklickt');
            htmlAudioManager.enable();
            setTimeout(updateStatus, 100);
          }}
        >
          🔊 Audio aktivieren
        </button>
        <button
          className="audio-debug-status-btn"
          onClick={updateStatus}
        >
          🔄 Status aktualisieren
        </button>
      </div>

      <div className="audio-debug-sounds">
        {sounds.map((sound, index) => (
          <button
            key={index}
            className={`audio-debug-sound-btn ${(sound as any).isTest ? 'test-btn' : ''}`}
            onClick={() => playSound(sound.name, sound.fn)}
          >
            ▶ {sound.name}
          </button>
        ))}
      </div>

      <div className="audio-debug-instructions">
        <p><small>
          💡 Tipp: Öffne die Browser-Console (F12) um detaillierte Debug-Logs zu sehen.
          Klicke zuerst auf "Audio aktivieren", dann teste die einzelnen Sounds.
        </small></p>
      </div>
    </div>
  );
};

export default AudioDebugPanel;
