import React, { useState } from 'react';
import { realisticSoundManager } from '../utils/realisticSoundManager';

interface GameSettingsProps {
  onClose: () => void;
}

const GameSettings: React.FC<GameSettingsProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'game' | 'sound'>('sound');

  // Sound-Einstellungen
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
      <div className="modal-content settings-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2>Einstellungen</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {/* Tabs */}
        <div className="settings-tabs">
          <button
            className={`settings-tab ${activeTab === 'sound' ? 'active' : ''}`}
            onClick={() => setActiveTab('sound')}
          >
            🔊 Sound
          </button>
          <button
            className={`settings-tab ${activeTab === 'game' ? 'active' : ''}`}
            onClick={() => setActiveTab('game')}
          >
            🎮 Spiel
          </button>
        </div>

        {/* Content */}
        <div className="settings-content-wrapper">
          {/* SOUND TAB */}
          {activeTab === 'sound' && (
            <div className="settings-content">
              {/* Gesamt-Lautstärke */}
              <div className="setting-item">
                <div className="setting-header">
                  <span className="setting-label">🔊 Gesamt-Lautstärke</span>
                  <span className="setting-value">{masterVolume}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={masterVolume}
                  onChange={(e) => handleMasterVolumeChange(Number(e.target.value))}
                  className="setting-slider"
                />
              </div>

              {/* === KATEGORIE: AMBIENTE === */}
              <div className="setting-item">
                <div className="setting-header">
                  <span className="setting-label">🌫️ Hintergrund-Funkverkehr</span>
                  <button
                    className={`setting-toggle ${radioEnabled ? 'active' : ''}`}
                    onClick={toggleRadio}
                  >
                    {radioEnabled ? 'AN' : 'AUS'}
                  </button>
                </div>
                {radioEnabled && (
                  <>
                    <div className="setting-header">
                      <span className="setting-sublabel">Lautstärke</span>
                      <span className="setting-value">{radioVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={radioVolume}
                      onChange={(e) => handleRadioVolumeChange(Number(e.target.value))}
                      className="setting-slider"
                    />
                  </>
                )}
              </div>

              {/* === KATEGORIE: SIRENEN === */}
              <div className="setting-item">
                <div className="setting-header">
                  <span className="setting-label">🚨 Sirenen & Martinshorn</span>
                  <button
                    className={`setting-toggle ${sirenEnabled ? 'active' : ''}`}
                    onClick={toggleSirens}
                  >
                    {sirenEnabled ? 'AN' : 'AUS'}
                  </button>
                </div>
                {sirenEnabled && (
                  <>
                    <div className="setting-header">
                      <span className="setting-sublabel">Lautstärke</span>
                      <span className="setting-value">{sirenVolume}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="50"
                      value={sirenVolume}
                      onChange={(e) => handleSirenVolumeChange(Number(e.target.value))}
                      className="setting-slider"
                    />
                  </>
                )}
              </div>

              {/* === KATEGORIE: ALARM-SOUNDS === */}
              <div className="setting-item">
                <div className="setting-header">
                  <span className="setting-label">🔔 Alarm-Sounds</span>
                  <button
                    className={`setting-toggle ${alarmSoundsEnabled ? 'active' : ''}`}
                    onClick={toggleAlarmSounds}
                  >
                    {alarmSoundsEnabled ? 'AN' : 'AUS'}
                  </button>
                </div>
                <p className="setting-hint">Quattrone & Doppelton</p>
              </div>

              {/* === KATEGORIE: UI-SOUNDS === */}
              <div className="setting-item">
                <div className="setting-header">
                  <span className="setting-label">🖱️ UI-Sounds</span>
                  <button
                    className={`setting-toggle ${uiSoundsEnabled ? 'active' : ''}`}
                    onClick={toggleUiSounds}
                  >
                    {uiSoundsEnabled ? 'AN' : 'AUS'}
                  </button>
                </div>
                <p className="setting-hint">Button-Klicks und Pieps</p>
              </div>

              {/* Sound Tests */}
              <div className="setting-item-full">
                <div className="setting-test-buttons">
                  <button className="setting-test-btn" onClick={playTestSound}>
                    Test Quattrone
                  </button>
                  <button className="setting-test-btn secondary" onClick={playTestSequence}>
                    Alle Sounds testen
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* GAME TAB */}
          {activeTab === 'game' && (
            <div className="settings-content">
              <div className="setting-item-full">
                <p className="setting-info-text">
                  • Schwierigkeitsgrad wird beim Start gewählt<br/>
                  • Geschwindigkeit kann unten rechts angepasst werden<br/>
                  • Hotkeys: <strong>Leertaste</strong> = Pause, <strong>Y</strong> = 1×, <strong>X</strong> = 4×
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameSettings;
