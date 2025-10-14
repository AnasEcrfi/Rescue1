import React from 'react';
import type { Incident, Vehicle } from '../types';
import { formatGameTime } from '../utils/timeHelpers';
import './IncidentTimeline.css';

// ⭐ UX #4: Einsatz-Timeline zeigt chronologische Ereignisse

export interface TimelineEvent {
  id: number;
  timestamp: number; // gameTime
  type: 'call' | 'dispatch' | 'enroute' | 'arrival' | 'report' | 'backup' | 'completion' | 'return';
  message: string;
  vehicleId?: number;
  icon?: string;
}

interface IncidentTimelineProps {
  incident: Incident;
  events: TimelineEvent[];
  vehicles: Vehicle[];
  onClose: () => void;
}

const IncidentTimeline: React.FC<IncidentTimelineProps> = ({
  incident,
  events,
  vehicles,
  onClose,
}) => {
  const getEventIcon = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'call': return '📞';
      case 'dispatch': return '🚨';
      case 'enroute': return '🚗';
      case 'arrival': return '📍';
      case 'report': return '📡';
      case 'backup': return '⚠️';
      case 'completion': return '✅';
      case 'return': return '🏁';
      default: return '•';
    }
  };

  const getEventColor = (type: TimelineEvent['type']): string => {
    switch (type) {
      case 'call': return '#0A84FF';
      case 'dispatch': return '#FF9F0A';
      case 'enroute': return '#FFD60A';
      case 'arrival': return '#FF453A';
      case 'report': return '#30D158';
      case 'backup': return '#FF9F0A';
      case 'completion': return '#30D158';
      case 'return': return '#8E8E93';
      default: return '#8E8E93';
    }
  };

  const getVehicleCallsign = (vehicleId?: number): string => {
    if (!vehicleId) return '';
    const vehicle = vehicles.find(v => v.id === vehicleId);
    return vehicle?.callsign || `Fahrzeug ${vehicleId}`;
  };

  // Sortiere Events chronologisch
  const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);

  return (
    <div className="timeline-overlay" onClick={onClose}>
      <div className="timeline-modal" onClick={(e) => e.stopPropagation()}>
        <div className="timeline-header">
          <div className="timeline-title">
            <span className="timeline-icon">📋</span>
            <h3>Einsatz-Timeline</h3>
          </div>
          <button className="timeline-close" onClick={onClose}>✕</button>
        </div>

        <div className="timeline-incident-info">
          <div className="timeline-incident-type">{incident.type}</div>
          <div className="timeline-incident-location">{incident.locationName}</div>
          <div className="timeline-incident-meta">
            <span className="timeline-priority" data-priority={incident.priority}>
              {incident.priority === 'high' ? 'Hohe' : incident.priority === 'medium' ? 'Mittlere' : 'Niedrige'} Priorität
            </span>
            <span className="timeline-vehicles">
              {incident.assignedVehicleIds.length} Fahrzeug{incident.assignedVehicleIds.length !== 1 ? 'e' : ''}
            </span>
          </div>
        </div>

        <div className="timeline-events">
          {sortedEvents.length === 0 ? (
            <div className="timeline-empty">
              <span className="timeline-empty-icon">📭</span>
              <p>Noch keine Ereignisse für diesen Einsatz</p>
            </div>
          ) : (
            sortedEvents.map((event) => (
              <div
                key={event.id}
                className="timeline-event"
                data-type={event.type}
              >
                <div
                  className="timeline-event-dot"
                  style={{ backgroundColor: getEventColor(event.type) }}
                >
                  <span className="timeline-event-icon">{event.icon || getEventIcon(event.type)}</span>
                </div>
                <div className="timeline-event-content">
                  <div className="timeline-event-time">
                    {formatGameTime(event.timestamp)}
                  </div>
                  <div className="timeline-event-message">
                    {event.vehicleId && (
                      <span className="timeline-event-vehicle">
                        {getVehicleCallsign(event.vehicleId)}:
                      </span>
                    )}
                    {' '}
                    {event.message}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="timeline-footer">
          <div className="timeline-stats">
            <div className="timeline-stat">
              <span className="timeline-stat-label">Ereignisse:</span>
              <span className="timeline-stat-value">{sortedEvents.length}</span>
            </div>
            <div className="timeline-stat">
              <span className="timeline-stat-label">Dauer:</span>
              <span className="timeline-stat-value">
                {sortedEvents.length > 0
                  ? `${Math.round((sortedEvents[sortedEvents.length - 1].timestamp - sortedEvents[0].timestamp) / 60)} Min.`
                  : '—'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentTimeline;
