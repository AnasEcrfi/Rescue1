/**
 * Kontextmenü für Fahrzeuge
 *
 * Rechtsklick auf Fahrzeuge zeigt ein Kontext-Menü mit verschiedenen Aktionen:
 * - Tanken (wenn Tankstand < 30%)
 * - Wartung (wenn Wartung < 50%)
 * - Pause (wenn Müdigkeit > 60%)
 * - Streife starten/stoppen
 * - Zurückrufen (wenn im Einsatz)
 * - Info anzeigen
 */

import React from 'react';
import type { Vehicle } from '../types/index';
import '../styles/VehicleContextMenu.css';

interface VehicleContextMenuProps {
  vehicle: Vehicle;
  position: { x: number; y: number };
  onClose: () => void;
  onRefuel: (vehicleId: number) => void;
  onMaintenance: (vehicleId: number) => void;
  onCrewBreak: (vehicleId: number) => void;
  onStartPatrol: (vehicleId: number) => void;
  onStopPatrol: (vehicleId: number) => void;
  onRecall: (vehicleId: number) => void;
  onShowInfo: (vehicleId: number) => void;
}

interface MenuAction {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  reason?: string; // Grund warum disabled
  action: () => void;
  className?: string;
}

const VehicleContextMenu: React.FC<VehicleContextMenuProps> = ({
  vehicle,
  position,
  onClose,
  onRefuel,
  onMaintenance,
  onCrewBreak,
  onStartPatrol,
  onStopPatrol,
  onRecall,
  onShowInfo,
}) => {
  // Bestimme verfügbare Aktionen basierend auf Fahrzeugstatus
  const actions: MenuAction[] = [
    // Info (immer verfügbar)
    {
      id: 'info',
      label: 'Fahrzeuginfo',
      icon: 'ℹ️',
      enabled: true,
      action: () => {
        onShowInfo(vehicle.id);
        onClose();
      },
      className: 'info-action',
    },

    // Separator
    { id: 'sep1', label: '---', icon: '', enabled: false, action: () => {} },

    // Tanken
    {
      id: 'refuel',
      label: `Tanken (${vehicle.fuelLevel.toFixed(0)}%)`,
      icon: '⛽',
      enabled: vehicle.fuelLevel < 80 && (vehicle.status === 'S1' || vehicle.status === 'S2'),
      reason: vehicle.fuelLevel >= 80
        ? 'Tank voll genug'
        : 'Fahrzeug muss verfügbar sein (S1/S2)',
      action: () => {
        onRefuel(vehicle.id);
        onClose();
      },
      className: vehicle.fuelLevel < 30 ? 'urgent-action' : undefined,
    },

    // Wartung
    {
      id: 'maintenance',
      label: `Wartung (${vehicle.maintenanceStatus})`,
      icon: '🔧',
      enabled:
        vehicle.maintenanceStatus !== 'ok' && (vehicle.status === 'S1' || vehicle.status === 'S2'),
      reason:
        vehicle.maintenanceStatus === 'ok'
          ? 'Wartung OK'
          : 'Fahrzeug muss verfügbar sein (S1/S2)',
      action: () => {
        onMaintenance(vehicle.id);
        onClose();
      },
      className: vehicle.maintenanceStatus === 'critical' ? 'urgent-action' : undefined,
    },

    // Crew-Pause
    {
      id: 'crew-break',
      label: `Crew-Pause (Müdigkeit ${vehicle.crewFatigue.toFixed(0)}%)`,
      icon: '☕',
      enabled: vehicle.crewFatigue > 30 && (vehicle.status === 'S1' || vehicle.status === 'S2'),
      reason:
        vehicle.crewFatigue <= 30
          ? 'Crew nicht müde'
          : 'Fahrzeug muss verfügbar sein (S1/S2)',
      action: () => {
        onCrewBreak(vehicle.id);
        onClose();
      },
      className: vehicle.crewFatigue > 60 ? 'urgent-action' : undefined,
    },

    // Separator
    { id: 'sep2', label: '---', icon: '', enabled: false, action: () => {} },

    // Streife starten
    {
      id: 'start-patrol',
      label: 'Streife starten',
      icon: '🚔',
      enabled:
        !vehicle.isPatrolling &&
        (vehicle.status === 'S1' || vehicle.status === 'S2') &&
        vehicle.fuelLevel > 30 &&
        vehicle.crewFatigue < 70,
      reason: vehicle.isPatrolling
        ? 'Bereits auf Streife'
        : vehicle.fuelLevel <= 30
        ? 'Zu wenig Treibstoff'
        : vehicle.crewFatigue >= 70
        ? 'Crew zu müde'
        : 'Fahrzeug muss verfügbar sein',
      action: () => {
        onStartPatrol(vehicle.id);
        onClose();
      },
    },

    // Streife stoppen
    {
      id: 'stop-patrol',
      label: 'Streife beenden',
      icon: '🛑',
      enabled: vehicle.isPatrolling === true,
      reason: 'Fahrzeug ist nicht auf Streife',
      action: () => {
        onStopPatrol(vehicle.id);
        onClose();
      },
    },

    // Separator
    { id: 'sep3', label: '---', icon: '', enabled: false, action: () => {} },

    // Zurückrufen (nur bei Einsätzen)
    {
      id: 'recall',
      label: 'Zurückrufen',
      icon: '↩️',
      enabled: vehicle.status === 'S3' || vehicle.status === 'S4' || vehicle.status === 'S5',
      reason: 'Fahrzeug ist nicht im Einsatz',
      action: () => {
        onRecall(vehicle.id);
        onClose();
      },
      className: 'danger-action',
    },
  ];

  // Filter Separatoren wenn benachbarte Aktionen disabled sind
  const visibleActions = actions.filter((action, index) => {
    if (action.label !== '---') return true;

    // Prüfe ob Separator relevant ist (zwischen enabled Actions)
    const prevEnabled = actions
      .slice(0, index)
      .reverse()
      .find((a) => a.label !== '---')?.enabled;
    const nextEnabled = actions.slice(index + 1).find((a) => a.label !== '---')?.enabled;

    return prevEnabled && nextEnabled;
  });

  // Schließe Menü bei Klick außerhalb
  React.useEffect(() => {
    const handleClick = () => onClose();
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      onClose();
    };

    // Verzögere Event-Listener um Initial-Click zu ignorieren
    setTimeout(() => {
      document.addEventListener('click', handleClick);
      document.addEventListener('contextmenu', handleContextMenu);
    }, 100);

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, [onClose]);

  return (
    <div
      className="vehicle-context-menu"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="context-menu-header">
        <span className="vehicle-callsign">{vehicle.callsign}</span>
        <span className="vehicle-status">{vehicle.status}</span>
      </div>

      <div className="context-menu-actions">
        {visibleActions.map((action, index) => {
          if (action.label === '---') {
            return <div key={`sep-${index}`} className="context-menu-separator" />;
          }

          return (
            <button
              key={action.id}
              className={`context-menu-action ${action.className || ''} ${!action.enabled ? 'disabled' : ''}`}
              onClick={action.enabled ? action.action : undefined}
              disabled={!action.enabled}
              title={!action.enabled ? action.reason : undefined}
            >
              <span className="action-icon">{action.icon}</span>
              <span className="action-label">{action.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default VehicleContextMenu;
