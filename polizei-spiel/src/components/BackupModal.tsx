import React, { useState } from 'react';
import type { Vehicle, Incident } from '../types';
import { vehicleTypeConfigs } from '../constants/vehicleTypes';
import { calculateDistance } from '../services/routingService';
import { realisticSoundManager } from '../utils/realisticSoundManager';

interface BackupModalProps {
  incident: Incident | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (vehicleIds: number[], withSpecialRights: boolean) => void;
  availableVehicles: Vehicle[];
}

const BackupModal: React.FC<BackupModalProps> = ({
  incident,
  isOpen,
  onClose,
  onConfirm,
  availableVehicles,
}) => {
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);
  const [withSpecialRights, setWithSpecialRights] = useState(true); // Standard: MIT Sonderrechten

  if (!isOpen || !incident) return null;

  const handleConfirm = () => {
    if (selectedVehicles.length > 0) {
      onConfirm(selectedVehicles, withSpecialRights);
      setSelectedVehicles([]);
      setWithSpecialRights(true); // Reset
      onClose();
    }
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="backup-modal">
        <div className="backup-modal-header">
          <div className="backup-modal-title">
            <span className="status-indicator-backup"></span>
            <h3>Weitere Fahrzeuge zuweisen</h3>
          </div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="backup-modal-info">
          <div className="backup-incident-info">
            <span className="backup-incident-type">{incident.type}</span>
            <span className="backup-incident-location">{incident.locationName}</span>
          </div>
          <div className="backup-current-status">
            Aktuell: {incident.assignedVehicleIds.length}/{incident.requiredVehicles} Fahrzeuge
          </div>
        </div>

        <div className="backup-modal-body">
          {/* Sonderrechte-Option wie im CallModal */}
          <div className="special-rights-toggle">
            <label className="toggle-label">
              <input
                type="checkbox"
                checked={withSpecialRights}
                onChange={(e) => {
                  const newValue = e.target.checked;
                  setWithSpecialRights(newValue);
                  // 🚨 PIEP-Sound wenn Sonderrechte aktiviert werden
                  if (newValue) {
                    realisticSoundManager.playBlaulichtActivate(0.4);
                  }
                }}
                className="toggle-checkbox"
              />
              <span className="toggle-switch"></span>
              <span className="toggle-text">
                {withSpecialRights ? 'Mit Sonderrechten' : 'Ohne Sonderrechte'}
              </span>
            </label>
          </div>

          <div className="backup-selection-header">
            <h4>Verfügbare Fahrzeuge</h4>
            <span className="backup-selected-count">
              {selectedVehicles.length}
            </span>
          </div>

          <div className="backup-vehicle-list">
            {availableVehicles.length === 0 ? (
              <div className="no-backup-available">
                ⚠️ Keine Fahrzeuge verfügbar für Verstärkung
              </div>
            ) : (
              availableVehicles.map((vehicle) => {
                const config = vehicleTypeConfigs[vehicle.vehicleType];
                const isSelected = selectedVehicles.includes(vehicle.id);

                // Berechne Entfernung zum Einsatzort
                const distance = calculateDistance(
                  { lat: vehicle.position[0], lng: vehicle.position[1] },
                  { lat: incident.position[0], lng: incident.position[1] }
                );
                const distanceKm = (distance / 1000).toFixed(1);
                const estimatedTime = Math.ceil((distance / 1000) / 60 * 60);

                return (
                  <button
                    key={vehicle.id}
                    className={`backup-vehicle-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedVehicles(selectedVehicles.filter(id => id !== vehicle.id));
                      } else {
                        setSelectedVehicles([...selectedVehicles, vehicle.id]);
                      }
                    }}
                  >
                    <div className="backup-vehicle-icon">{config.icon}</div>
                    <div className="backup-vehicle-info">
                      <div className="backup-vehicle-name">
                        {vehicle.callsign}
                      </div>
                      <div className="backup-vehicle-status">
                        {vehicle.status === 'S2' ? '● Bereit auf Wache' : vehicle.status === 'S8' ? '↻ Rückfahrt' : '● Verfügbar'}
                      </div>
                      <div className="backup-vehicle-distance">
                        {distanceKm} km · {estimatedTime} min
                      </div>
                    </div>
                    {isSelected && <div className="backup-selected-check">✓</div>}
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="backup-modal-footer">
          <button className="backup-modal-btn backup-cancel" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className={`backup-modal-btn backup-confirm ${withSpecialRights ? 'with-special-rights' : ''}`}
            onClick={handleConfirm}
            disabled={selectedVehicles.length === 0}
          >
            Fahrzeuge zuweisen {selectedVehicles.length > 0 && `(${selectedVehicles.length})`}
          </button>
        </div>
      </div>
    </>
  );
};

export default BackupModal;
