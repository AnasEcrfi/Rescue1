import React, { useState } from 'react';
import type { Vehicle } from '../types';
import { vehicleTypeConfigs } from '../constants/vehicleTypes';
import { performShiftChange } from '../utils/refuelingSystem';
import PatrolAreaSelector from './PatrolAreaSelector';

interface VehicleDetailsProps {
  vehicle: Vehicle;
  onShiftChange: (vehicle: Vehicle, newVehicle: Vehicle) => void;
  onAddLog: (message: string) => void;
  gameTime: number;
  onClose?: () => void;
  // 🚔 PATROL SYSTEM
  onStartPatrol?: (vehicleId: number, areaId?: string) => void;
  onStopPatrol?: (vehicleId: number) => void;
}

const VehicleDetails: React.FC<VehicleDetailsProps> = ({
  vehicle,
  onShiftChange,
  onAddLog,
  gameTime,
  onClose,
  onStartPatrol,
  onStopPatrol,
}) => {
  const config = vehicleTypeConfigs[vehicle.vehicleType];
  const [isPatrolSelectorOpen, setIsPatrolSelectorOpen] = useState(false);
  const [isStartingPatrol, setIsStartingPatrol] = useState(false);

  // Status-Badge Helper
  const getStatusBadge = (status: string) => {
    const badges: { [key: string]: { color: string; text: string } } = {
      S1: { color: '#30D158', text: 'Frei auf Funk' },
      S2: { color: '#30D158', text: 'Frei auf Wache' },
      S3: { color: '#FF9F0A', text: 'Anfahrt' },
      S4: { color: '#FF453A', text: 'Am Einsatzort' },
      S5: { color: '#0A84FF', text: 'Sprechwunsch' },
      S6: { color: '#8E8E93', text: 'Nicht einsatzbereit' },
      S8: { color: '#FFD60A', text: 'Rückfahrt' },
    };
    return badges[status] || { color: '#8E8E93', text: 'Unbekannt' };
  };

  const statusBadge = getStatusBadge(vehicle.status);

  // Farben für Fuel/Fatigue Levels
  const getFuelLevelColor = (level: number) => {
    if (level < 15) return '#FF453A'; // Kritisch
    if (level < 30) return '#FF9F0A'; // Warnung
    return '#30D158'; // OK
  };

  const getFatigueLevelColor = (level: number) => {
    if (level > 90) return '#FF453A'; // Kritisch
    if (level > 70) return '#FF9F0A'; // Warnung
    return '#30D158'; // OK
  };

  const handleShiftChange = () => {
    if (vehicle.status !== 'S1' && vehicle.status !== 'S2') {
      onAddLog(`⚠️ Fahrzeug ${vehicle.id}: Schichtwechsel nur an der Wache möglich (Status ${vehicle.status})`);
      return;
    }
    if (vehicle.crewFatigue <= 60) {
      onAddLog(`ℹ️ Fahrzeug ${vehicle.id}: Besatzung ist noch fit (${vehicle.crewFatigue.toFixed(0)}% Müdigkeit)`);
      return;
    }

    const newVehicle = performShiftChange(vehicle, gameTime);
    onShiftChange(vehicle, newVehicle);
    onAddLog(`👥 Schichtwechsel: Fahrzeug ${vehicle.id} - Müdigkeit zurückgesetzt`);
  };

  // 🚔 PATROL: Öffne Area Selector
  const handleOpenPatrolSelector = () => {
    setIsPatrolSelectorOpen(true);
  };

  // 🚔 PATROL: Start patrol mit ausgewählter Area
  const handlePatrolAreaSelected = async (areaId: string) => {
    if (!onStartPatrol) return;

    setIsStartingPatrol(true);
    try {
      await onStartPatrol(vehicle.id, areaId);
    } finally {
      // Warte kurz bevor Loading-State entfernt wird (für visuelles Feedback)
      setTimeout(() => {
        setIsStartingPatrol(false);
      }, 300);
    }
  };

  return (
    <div className="vehicle-details-panel">
      <div className="vehicle-details-header">
        <div className="vehicle-details-title">
          <span className="vehicle-detail-icon">{config.icon}</span>
          <span className="vehicle-detail-name">{vehicle.callsign}</span>
        </div>
        <div className="vehicle-details-header-right">
          <div
            className="vehicle-detail-status-badge"
            style={{ background: statusBadge.color }}
          >
            {statusBadge.text}
          </div>
          {onClose && (
            <button className="vehicle-details-close-btn" onClick={onClose} title="Schließen">
              ×
            </button>
          )}
        </div>
      </div>

      <div className="vehicle-details-content">
        {/* Fuel Level */}
        <div className="vehicle-detail-row">
          <div className="vehicle-detail-label">Treibstoff</div>
          <div className="vehicle-detail-bar-container">
            <div
              className="vehicle-detail-bar"
              style={{
                width: `${vehicle.fuelLevel}%`,
                background: getFuelLevelColor(vehicle.fuelLevel),
              }}
            />
          </div>
          <span className="vehicle-detail-percentage">{vehicle.fuelLevel.toFixed(0)}%</span>
        </div>

        {/* Crew Fatigue */}
        <div className="vehicle-detail-row">
          <div className="vehicle-detail-label">Müdigkeit</div>
          <div className="vehicle-detail-bar-container">
            <div
              className="vehicle-detail-bar"
              style={{
                width: `${vehicle.crewFatigue}%`,
                background: getFatigueLevelColor(vehicle.crewFatigue),
              }}
            />
          </div>
          <span className="vehicle-detail-percentage">{vehicle.crewFatigue.toFixed(0)}%</span>
        </div>

        {/* Maintenance Status */}
        <div className="vehicle-detail-row">
          <div className="vehicle-detail-label">Wartung</div>
          <div className="vehicle-detail-value">
            {vehicle.maintenanceStatus === 'ok' && <span style={{ color: '#30D158' }}>OK</span>}
            {vehicle.maintenanceStatus === 'warning' && <span style={{ color: '#FF9F0A' }}>Fällig</span>}
            {vehicle.maintenanceStatus === 'critical' && <span style={{ color: '#FF453A' }}>Kritisch</span>}
          </div>
        </div>

        {/* Total Distance */}
        <div className="vehicle-detail-row">
          <div className="vehicle-detail-label">Gefahren</div>
          <div className="vehicle-detail-value">{(vehicle.totalDistanceTraveled / 1000).toFixed(1)} km</div>
        </div>

        {/* Out of Service Info */}
        {vehicle.status === 'S6' && vehicle.outOfServiceReason && (
          <div className="vehicle-detail-row out-of-service-info">
            <div className="vehicle-detail-label">Außer Dienst</div>
            <div className="vehicle-detail-value">
              {vehicle.outOfServiceReason}
              {vehicle.outOfServiceUntil && (
                <span> ({Math.ceil(vehicle.outOfServiceUntil - gameTime)} Min)</span>
              )}
            </div>
          </div>
        )}

        {/* 🚔 PATROL BUTTONS */}
        {/* Start Patrol Button - nur wenn Fahrzeug S1 oder S2 und NICHT auf Streife */}
        {!vehicle.isOnPatrol && (vehicle.status === 'S1' || vehicle.status === 'S2') && onStartPatrol && (
          <button
            className={`patrol-btn patrol-start-btn ${isStartingPatrol ? 'loading' : ''}`}
            onClick={handleOpenPatrolSelector}
            title="Streifengebiet auswählen und Streifenfahrt starten"
            disabled={vehicle.fuelLevel < 40 || vehicle.crewFatigue > 70 || isStartingPatrol}
          >
            {isStartingPatrol ? (
              <>
                <span className="spinner"></span>
                Route wird berechnet...
              </>
            ) : (
              <>
                🚔 Streife starten
              </>
            )}
          </button>
        )}

        {/* Stop Patrol Button - nur wenn Fahrzeug auf Streife */}
        {vehicle.isOnPatrol && onStopPatrol && (
          <button
            className="patrol-btn patrol-stop-btn"
            onClick={() => onStopPatrol(vehicle.id)}
            title="Streifenfahrt beenden"
          >
            ⏸️ Streife beenden
          </button>
        )}

        {/* Patrol Info - wenn auf Streife */}
        {vehicle.isOnPatrol && vehicle.patrolRoute && (
          <div className="patrol-info">
            <div className="patrol-info-row">
              <span className="patrol-info-label">Gebiet:</span>
              <span className="patrol-info-value">{vehicle.patrolRoute.areaName}</span>
            </div>
            <div className="patrol-info-row">
              <span className="patrol-info-label">Waypoint:</span>
              <span className="patrol-info-value">
                {vehicle.patrolRoute.currentWaypointIndex + 1}/{vehicle.patrolRoute.waypoints.length}
              </span>
            </div>
            <div className="patrol-info-row">
              <span className="patrol-info-label">Distanz:</span>
              <span className="patrol-info-value">{vehicle.patrolTotalDistance.toFixed(1)} km</span>
            </div>
          </div>
        )}

        {/* Shift Change Button */}
        {vehicle.crewFatigue > 60 && (vehicle.status === 'S1' || vehicle.status === 'S2') && (
          <button
            className="shift-change-btn"
            onClick={handleShiftChange}
            title="Schichtwechsel durchführen (5 Min Pause)"
          >
            Schichtwechsel
          </button>
        )}
      </div>

      {/* 🚔 PATROL AREA SELECTOR MODAL */}
      <PatrolAreaSelector
        isOpen={isPatrolSelectorOpen}
        onClose={() => setIsPatrolSelectorOpen(false)}
        onSelectArea={handlePatrolAreaSelected}
        vehicleCallsign={vehicle.callsign || `FZ-${vehicle.id}`}
        currentHour={Math.floor(gameTime / 60)}
      />
    </div>
  );
};

export default VehicleDetails;

