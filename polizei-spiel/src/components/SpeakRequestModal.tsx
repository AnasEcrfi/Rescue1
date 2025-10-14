import React from 'react';
import type { Vehicle, Incident } from '../types';
import { vehicleTypeConfigs } from '../constants/vehicleTypes';
import './SpeakRequestModal.css';

export type SpeakRequestType = 'situation_report' | 'escalation' | 'backup_needed' | 'suspect_arrested' | 'additional_info' | 'unclear_situation';

interface SpeakRequestModalProps {
  vehicle: Vehicle | null;
  incident: Incident | null;
  requestType: SpeakRequestType;
  onClose: () => void;
  onConfirm: () => void;
}

const SpeakRequestModal: React.FC<SpeakRequestModalProps> = ({
  vehicle,
  incident,
  requestType,
  onClose,
  onConfirm,
}) => {
  if (!vehicle || !incident) return null;

  const config = vehicleTypeConfigs[vehicle.vehicleType];

  // Berechne fehlende Fahrzeuge
  const missingVehicles = Math.max(0, incident.requiredVehicles - incident.arrivedVehicles);

  // Generiere realistische Meldungen basierend auf Typ
  const getMessage = (): { title: string; content: string; action: string } => {
    switch (requestType) {
      case 'situation_report':
        return {
          title: 'Erstlageerkundung',
          content: `Lage vor Ort bestätigt. ${incident.type} wie gemeldet. ${incident.arrivedVehicles} von ${incident.requiredVehicles} Einheiten vor Ort. Maßnahmen werden eingeleitet.`,
          action: 'Verstanden, fortfahren'
        };

      case 'escalation':
        return {
          title: 'Lage eskaliert',
          content: `Lage am Einsatzort hat sich verschärft. ${incident.type} erfordert zusätzliche Kräfte. Benötigen ${missingVehicles > 0 ? missingVehicles : 2} weitere Einheit(en) zur Verstärkung.`,
          action: 'Verstärkung wird alarmiert'
        };

      case 'backup_needed':
        return {
          title: 'Verstärkung angefordert',
          content: `${incident.type} - Situation übersteigt Kapazität der vor Ort befindlichen Kräfte. Benötigen ${missingVehicles > 0 ? missingVehicles : 1} zusätzliche Einheit(en).`,
          action: 'Verstärkung disponieren'
        };

      case 'suspect_arrested':
        return {
          title: 'Person festgenommen',
          content: `${incident.type} - Eine Person wurde vorläufig festgenommen. Fahndungsabgleich läuft. Transportkapazität prüfen.`,
          action: 'Verstanden'
        };

      case 'additional_info':
        return {
          title: 'Zusätzliche Informationen',
          content: `${incident.type} - Vor Ort haben sich weitere Details ergeben. Situation komplexer als zunächst angenommen. ${incident.arrivedVehicles}/${incident.requiredVehicles} Einheiten im Einsatz.`,
          action: 'Information zur Kenntnis genommen'
        };

      case 'unclear_situation':
        return {
          title: 'Unklare Lage',
          content: `${incident.type} - Lage vor Ort unklar. Erkunde weitere Details. Halte bereit für mögliche Nachforderung von Kräften.`,
          action: 'Verstanden, weitere Meldung abwarten'
        };

      default:
        return {
          title: 'Sprechwunsch',
          content: 'Einheit möchte sprechen.',
          action: 'Bestätigen'
        };
    }
  };

  const message = getMessage();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="speak-request-modal" onClick={(e) => e.stopPropagation()}>
        <div className="speak-modal-header">
          <div className="speak-modal-badge">🔵 SPRECHWUNSCH</div>
          <button className="modal-close-btn" onClick={onClose}>×</button>
        </div>

        <div className="speak-modal-vehicle">
          <span className="speak-vehicle-icon">{config.icon}</span>
          <span className="speak-vehicle-callsign">{vehicle.callsign || `FZ${vehicle.id}`}</span>
          <span className="speak-vehicle-status">Status: S4 (Am Einsatzort)</span>
        </div>

        <div className="speak-modal-location">
          📍 {incident.locationName}
        </div>

        <div className="speak-modal-message">
          <h3>{message.title}</h3>
          <p>{message.content}</p>
        </div>

        {(requestType === 'escalation' || requestType === 'backup_needed') && (
          <div className="speak-modal-status">
            <div className="status-row">
              <span>Vor Ort:</span>
              <span className="status-value">{incident.arrivedVehicles}/{incident.requiredVehicles} Einheiten</span>
            </div>
            {missingVehicles > 0 && (
              <div className="status-row highlight">
                <span>Benötigt:</span>
                <span className="status-value">+{missingVehicles} Einheit(en)</span>
              </div>
            )}
          </div>
        )}

        <div className="speak-modal-actions">
          <button className="speak-confirm-btn" onClick={onConfirm}>
            {message.action}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpeakRequestModal;
