import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle } from 'react-leaflet';
import L from 'leaflet';
import type { Call, Vehicle } from '../types';
import { vehicleTypeConfigs } from '../constants/vehicleTypes';
import { calculateDistance } from '../services/routingService';
import { realisticSoundManager } from '../utils/realisticSoundManager';

interface CallModalProps {
  call: Call | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept: (callId: number, assignedVehicles?: number[], withSpecialRights?: boolean) => void;
  onReject: (callId: number) => void;
  availableVehicles: Vehicle[];
  onAssignVehicle?: (vehicleId: number, callId: number) => void;
  onAutoAssign?: (callId: number) => number[]; // Automatische Fahrzeugempfehlung
}

const CallModal: React.FC<CallModalProps> = ({
  call,
  isOpen,
  onClose,
  onAccept,
  onReject,
  availableVehicles,
  onAutoAssign,
}) => {
  const [typedText, setTypedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState<number[]>([]);
  const [withSpecialRights, setWithSpecialRights] = useState(false); // Standard: OHNE Sonderrechte
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update timer every second
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Typing effect for caller text
  useEffect(() => {
    if (!isOpen || !call) {
      setTypedText('');
      setIsTypingComplete(false);
      setSelectedVehicles([]);
      setWithSpecialRights(false); // Reset bei neuem Call - Standard: OHNE Sonderrechte
      return;
    }

    const fullText = call.callerText;
    let currentIndex = 0;
    setTypedText('');
    setIsTypingComplete(false);

    // Typing speed based on emotion/panic level
    const getTypingSpeed = () => {
      // Panik = schneller (20-30ms), Ruhig = langsamer (40-60ms)
      if (call.priority === 'high') return 20 + Math.random() * 10;
      if (call.priority === 'medium') return 30 + Math.random() * 15;
      return 40 + Math.random() * 20;
    };

    const typeNextChar = () => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
        setTimeout(typeNextChar, getTypingSpeed());
      } else {
        setIsTypingComplete(true);
      }
    };

    // Start typing after small delay
    const startDelay = setTimeout(typeNextChar, 300);
    return () => clearTimeout(startDelay);
  }, [call, isOpen]);

  // Reset selected vehicles when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedVehicles([]);
    }
  }, [isOpen]);

  if (!isOpen || !call) return null;

  const timeAgo = Math.floor((currentTime - call.timestamp) / 1000);

  const getCallerTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      witness: 'Zeuge',
      victim: 'Betroffene(r)',
      resident: 'Anwohner',
      business: 'Geschäft',
      anonymous: 'Anonym',
      employee: 'Mitarbeiter',
    };
    return labels[type] || 'Unbekannt';
  };

  const getPriorityLabel = (priority: 'low' | 'medium' | 'high') => {
    const labels = {
      high: 'DRINGEND',
      medium: 'NORMAL',
      low: 'NIEDRIG',
    };
    return labels[priority];
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose} />
      <div className="call-modal-container">
        <div className="call-modal">
          <div className="call-modal-header">
          <div className="call-modal-title">
            <span className={`status-indicator-incoming status-indicator-${call.priority}`}></span>
            <h3>Notruf</h3>
            <span className={`priority-badge-modal priority-${call.priority}`}>
              {getPriorityLabel(call.priority)}
            </span>
          </div>
          <button className="call-modal-close" onClick={onClose}>×</button>
        </div>

        <div className="call-modal-info">
          <div className="call-info-row">
            <span className="call-info-label">Anrufertyp:</span>
            <span className="call-info-value">{getCallerTypeLabel(call.callerType)}</span>
          </div>
          {call.callerName && (
            <div className="call-info-row">
              <span className="call-info-label">Name:</span>
              <span className="call-info-value">{call.callerName}</span>
            </div>
          )}
          {call.callbackNumber && (
            <div className="call-info-row">
              <span className="call-info-label">Rückrufnummer:</span>
              <span className="call-info-value">{call.callbackNumber}</span>
            </div>
          )}
          <div className="call-info-row">
            <span className="call-info-label">Wartezeit:</span>
            <span className="call-info-value">{timeAgo}s</span>
          </div>
        </div>

        <div className="call-modal-body">
          <div className="call-text-container">
            <div className="call-text-label">
              <span className="status-dot">{isTypingComplete ? '○' : '●'}</span>
              {isTypingComplete ? 'Protokoll' : 'Live'}
            </div>
            <div className="call-text-content">
              {typedText}
              {!isTypingComplete && <span className="typing-cursor">|</span>}
            </div>
          </div>

          {/* Mini-Map mit Einsatzort */}
          <div className="call-mini-map-container">
            <MapContainer
              center={call.position}
              zoom={15}
              style={{ height: '100%', width: '100%', borderRadius: '8px' }}
              zoomControl={false}
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker
                position={call.position}
                icon={L.divIcon({
                  className: 'incident-marker-mini',
                  html: `<div class="incident-dot-mini"></div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10],
                })}
              />
              <Circle
                center={call.position}
                radius={200}
                pathOptions={{
                  color: 'var(--color-danger)',
                  fillColor: 'var(--color-danger)',
                  fillOpacity: 0.1,
                  weight: 2,
                }}
              />
            </MapContainer>
          </div>

          <div className="call-details">
            <div className="call-detail-item">
              <span className="call-detail-label">Einsatztyp:</span>
              <span className="call-detail-value">{call.type}</span>
            </div>
            <div className="call-detail-item">
              <span className="call-detail-label">Ort:</span>
              <span className="call-detail-value">{call.locationName}</span>
            </div>
            <div className="call-detail-item">
              <span className="call-detail-label">Adresse:</span>
              <span className="call-detail-value call-address">{call.address}</span>
            </div>
          </div>

          {/* Fahrzeugauswahl - wie bei LST SIM */}
          {isTypingComplete && (
            <div className="vehicle-selection-section">
              {/* Sonderrechte-Option */}
              <div className={`special-rights-toggle ${withSpecialRights ? 'with-special-rights' : ''}`}>
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

              <div className="vehicle-selection-header">
                <h4>Verfügbare Fahrzeuge</h4>
                <div className="vehicle-selection-actions">
                  <button
                    className="auto-assign-btn"
                    onClick={() => {
                      if (onAutoAssign) {
                        const recommended = onAutoAssign(call.id);
                        setSelectedVehicles(recommended);
                      }
                    }}
                    title="Beste Fahrzeuge automatisch auswählen"
                  >
                    Auto
                  </button>
                  <span className="vehicle-count-badge">
                    {selectedVehicles.length} ausgewählt
                  </span>
                </div>
              </div>
              <div className="vehicle-selection-grid">
                {availableVehicles.length === 0 ? (
                  <div className="no-vehicles-available">
                    ⚠️ Keine Fahrzeuge verfügbar
                  </div>
                ) : (
                  availableVehicles.slice(0, 12).map((vehicle) => {
                    const config = vehicleTypeConfigs[vehicle.vehicleType];
                    const isSelected = selectedVehicles.includes(vehicle.id);
                    const statusColors: { [key: string]: string } = {
                      S1: '#30D158',
                      S8: '#0A84FF',
                    };

                    // Berechne Entfernung zum Einsatzort
                    const distance = calculateDistance(
                      { lat: vehicle.position[0], lng: vehicle.position[1] },
                      { lat: call.position[0], lng: call.position[1] }
                    );
                    const distanceKm = (distance / 1000).toFixed(1); // Meter zu Kilometer
                    const estimatedTime = Math.ceil((distance / 1000) / 60 * 60); // Grobe ETA in Minuten (60 km/h Durchschnitt)

                    return (
                      <button
                        key={vehicle.id}
                        className={`vehicle-selection-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedVehicles(selectedVehicles.filter(id => id !== vehicle.id));
                          } else {
                            setSelectedVehicles([...selectedVehicles, vehicle.id]);
                          }
                        }}
                      >
                        <div className="vehicle-selection-icon">{config.icon}</div>
                        <div className="vehicle-selection-info">
                          <div className="vehicle-selection-name">
                            {vehicle.callsign}
                          </div>
                          <div
                            className="vehicle-selection-status"
                            style={{ color: statusColors[vehicle.status] }}
                          >
                            {vehicle.status === 'S1' ? '● Bereit' : '↻ Rückfahrt'}
                          </div>
                          <div className="vehicle-distance-badge">
                            {distanceKm} km · {estimatedTime} min
                          </div>
                        </div>
                        {isSelected && <div className="vehicle-selected-check">✓</div>}
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="call-modal-footer">
          <button
            className="call-modal-button call-modal-reject"
            onClick={() => {
              onReject(call.id);
              onClose();
            }}
          >
            Ablehnen
          </button>
          <button
            className="call-modal-button call-modal-accept"
            onClick={() => {
              onAccept(call.id, selectedVehicles.length > 0 ? selectedVehicles : undefined, withSpecialRights);
              onClose();
            }}
            disabled={!isTypingComplete || selectedVehicles.length === 0}
            title={selectedVehicles.length === 0 ? 'Bitte mindestens ein Fahrzeug auswählen' : 'Einsatz erstellen'}
          >
            Einsatz erstellen {selectedVehicles.length > 0 && `(${selectedVehicles.length})`}
          </button>
        </div>
      </div>

      {/* Rechte Spalte: Protokoll/Kommunikation */}
      <div className="call-protocol-panel">
        <div className="call-protocol-header">
          <h3>Anrufverlauf</h3>
          <span className="protocol-badge">Live</span>
        </div>

        <div className="call-protocol-content">
          {/* Anrufer-Nachricht */}
          <div className="protocol-message protocol-message-caller">
            <div className="protocol-message-header">
              <span className="protocol-sender">
                {call.callerName || getCallerTypeLabel(call.callerType)}
              </span>
              <span className="protocol-time">
                vor {timeAgo}s
              </span>
            </div>
            <div className="protocol-message-text">
              {typedText}
              {!isTypingComplete && <span className="typing-cursor">|</span>}
            </div>
          </div>

          {/* Platzhalter für zukünftige Kommunikation */}
          {isTypingComplete && (
            <div className="protocol-message protocol-message-system">
              <div className="protocol-message-text">
                Warten auf Einsatzannahme...
              </div>
            </div>
          )}
        </div>

        <div className="call-protocol-footer">
          <input
            type="text"
            className="protocol-input"
            placeholder="Nachricht eingeben (coming soon)..."
            disabled
          />
          <button className="protocol-send-btn" disabled>
            Senden
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default CallModal;
