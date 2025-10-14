import React, { useState } from 'react';
import { realisticSoundManager } from '../utils/realisticSoundManager';

interface SoundSettingsProps {
  onClose: () => void;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ onClose }) => {
  // Lade aktuelle Einstellungen
  const currentSettings = realisticSoundManager.getSettings();

  const [masterVolume, setMasterVolume] = useState(Math.round(currentSettings.masterVolume * 100));
  const [radioVolume, setRadioVolume] = useState(Math.round(currentSettings.radioVolume * 100));
  const [sirenVolume, setSirenVolume] = useState(Math.round(currentSettings.sirenVolume * 100));
  const [radioEnabled, setRadioEnabled] = useState(currentSettings.radioSoundsEnabled);
  const [sirenEnabled, setSirenEnabled] = useState(currentSettings.sirenSoundsEnabled);
  const [uiSoundsEnabled, setUiSoundsEnabled] = useState(currentSettings.uiSoundsEnabled);
  const [alarmSoundsEnabled, setAlarmSoundsEnabled] = useState(currentSettings.alarmSoundsEnabled);

  const handleMasterVolumeChange = (value: number) => {
    setMasterVolume(value);
    realisticSoundManager.setMasterVolume(value / 100);
  };

  const handleRadioVolumeChange = (value: number) => {
    setRadioVolume(value);
    realisticSoundManager.setBackgroundRadioVolume(value / 100);
  };

  const handleSirenVolumeChange = (value: number) => {
    setSirenVolume(value);
    realisticSoundManager.setSettings({ sirenVolume: value / 100 });
  };

  const toggleRadio = () => {
    const newState = !radioEnabled;
    setRadioEnabled(newState);
    realisticSoundManager.setSettings({ radioSoundsEnabled: newState });

    if (!newState) {
      realisticSoundManager.stopBackgroundRadioChatter();
    } else {
      realisticSoundManager.startBackgroundRadioChatter();
    }
  };

  const toggleSirens = () => {
    const newState = !sirenEnabled;
    setSirenEnabled(newState);
    realisticSoundManager.setSettings({ sirenSoundsEnabled: newState });
  };

  const toggleUiSounds = () => {
    const newState = !uiSoundsEnabled;
    setUiSoundsEnabled(newState);
    realisticSoundManager.setSettings({ uiSoundsEnabled: newState });
  };

  const toggleAlarmSounds = () => {
    const newState = !alarmSoundsEnabled;
    setAlarmSoundsEnabled(newState);
    realisticSoundManager.setSettings({ alarmSoundsEnabled: newState });
  };

  const playTestSound = () => {
    realisticSoundManager.playQuattroneAlert(0.8);
  };

  const playTestSequence = async () => {
    await realisticSoundManager.playTestSequence();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal sound-settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🔊 Sound-Einstellungen</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-content">
          <div className="sound-settings-content">
            <div className="sound-setting-group">
              <div className="sound-setting-header">
                <label>Gesamt-Lautstärke</label>
                <span className="sound-value">{masterVolume}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={masterVolume}
                onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                className="sound-slider"
              />
              <p className="sound-description">Steuert die Lautstärke aller Spiel-Sounds</p>
            </div>

            <div className="sound-divider"></div>

            <div className="sound-setting-group">
              <div className="sound-setting-header">
                <label>📡 Hintergrund-Funkverkehr</label>
                <button className={`sound-toggle ${radioEnabled ? 'active' : ''}`} onClick={toggleRadio}>
                  {radioEnabled ? '🔊 AN' : '🔇 AUS'}
                </button>
              </div>
              {radioEnabled && (
                <>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={radioVolume}
                    onChange={(e) => handleRadioVolumeChange(Number(e.target.value))}
                    className="sound-slider"
                  />
                  <span className="sound-value">{radioVolume}%</span>
                </>
              )}
              <p className="sound-description">10 Min. authentische Polizei-Funkkommunikation (gedämpft)</p>
            </div>

            <div className="sound-divider"></div>

            <div className="sound-setting-group">
              <div className="sound-setting-header">
                <label>🚨 Sirenen & Martinshorn</label>
                <button className={`sound-toggle ${sirenEnabled ? 'active' : ''}`} onClick={toggleSirens}>
                  {sirenEnabled ? '🔊 AN' : '🔇 AUS'}
                </button>
              </div>
              {sirenEnabled && (
                <>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    value={sirenVolume}
                    onChange={(e) => handleSirenVolumeChange(Number(e.target.value))}
                    className="sound-slider"
                  />
                  <span className="sound-value">{sirenVolume}%</span>
                </>
              )}
              <p className="sound-description">Dezente Sirenen bei Sonderrechten (adaptive Lautstärke)</p>
            </div>

            <div className="sound-divider"></div>

            <div className="sound-setting-group">
              <div className="sound-setting-header">
                <label>🔔 Alarm-Sounds</label>
                <button className={`sound-toggle ${alarmSoundsEnabled ? 'active' : ''}`} onClick={toggleAlarmSounds}>
                  {alarmSoundsEnabled ? '🔊 AN' : '🔇 AUS'}
                </button>
              </div>
              <p className="sound-description">Quattrone & Doppelton bei Einsätzen</p>
            </div>

            <div className="sound-setting-group">
              <div className="sound-setting-header">
                <label>🖱️ UI-Sounds</label>
                <button className={`sound-toggle ${uiSoundsEnabled ? 'active' : ''}`} onClick={toggleUiSounds}>
                  {uiSoundsEnabled ? '🔊 AN' : '🔇 AUS'}
                </button>
              </div>
              <p className="sound-description">Button-Klicks und Leitstellen-Pieps</p>
            </div>

            <div className="sound-divider"></div>

            <div className="sound-info-section">
              <h3>🎵 Authentische Sounds</h3>
              <ul className="sound-info-list">
                <li>✅ Echte TETRA-Funkgeräte (Sepura & Motorola)</li>
                <li>✅ Quattrone-Alarm für kritische Einsätze</li>
                <li>✅ Doppelton für Status-Updates</li>
                <li>✅ PTT Push-to-Talk Sounds</li>
                <li>✅ Hella RTK7 Leitstellen-Sounds</li>
                <li>✅ NRW Martinshorn (dezent)</li>
                <li>✅ Blaulicht-Aktivierungs-Sound</li>
              </ul>
            </div>

            <div className="sound-test-section">
              <h3>🧪 Sound-Tests</h3>
              <div className="sound-test-buttons">
                <button className="test-button primary" onClick={playTestSound}>
                  🚨 Quattrone-Alarm testen
                </button>
                <button className="test-button secondary" onClick={playTestSequence}>
                  🎵 Alle Sounds testen
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-primary" onClick={onClose}>Fertig</button>
        </div>
      </div>
    </div>
  );
};

export default SoundSettings;
