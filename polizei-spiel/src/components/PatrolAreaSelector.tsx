import React, { useState } from 'react';
import { frankfurtPatrolAreas } from '../constants/patrolAreas';
import type { PatrolArea } from '../types/patrol';

interface PatrolAreaSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectArea: (areaId: string) => void;
  vehicleCallsign: string;
  currentHour: number;
}

const PatrolAreaSelector: React.FC<PatrolAreaSelectorProps> = ({
  isOpen,
  onClose,
  onSelectArea,
  vehicleCallsign,
  currentHour,
}) => {
  const [selectedAreaId, setSelectedAreaId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Sortiere Areas nach Priorität (high → medium → low)
  const sortedAreas = [...frankfurtPatrolAreas].sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  const handleConfirm = () => {
    if (selectedAreaId) {
      onSelectArea(selectedAreaId);
      onClose();
    }
  };

  const getPriorityColor = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return '#FF453A';
      case 'medium': return '#FF9F0A';
      case 'low': return '#30D158';
      default: return '#8E8E93';
    }
  };

  const getPriorityLabel = (priority: 'low' | 'medium' | 'high') => {
    switch (priority) {
      case 'high': return 'Hoch';
      case 'medium': return 'Mittel';
      case 'low': return 'Niedrig';
      default: return 'Unbekannt';
    }
  };

  const isAreaActive = (area: PatrolArea) => {
    if (!area.activeHours) return true; // 24/7
    const [startHour, endHour] = area.activeHours;

    // Handle overnight shifts (z.B. 22-6)
    if (startHour > endHour) {
      return currentHour >= startHour || currentHour < endHour;
    }

    return currentHour >= startHour && currentHour < endHour;
  };

  return (
    <>
      <div className="modal-overlay-clean" onClick={onClose} />
      <div className="patrol-selector-panel-clean" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="patrol-selector-header-clean">
          <div className="patrol-selector-title-section">
            <h3>Streifengebiet wählen</h3>
            <p className="patrol-selector-subtitle">
              {vehicleCallsign} • {String(currentHour).padStart(2, '0')}:00 Uhr
            </p>
          </div>
          <button className="close-btn-clean" onClick={onClose} aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="patrol-selector-content-clean">
          <div className="patrol-areas-grid-clean">
            {sortedAreas.map((area) => {
              const isActive = isAreaActive(area);
              const isSelected = selectedAreaId === area.id;

              return (
                <div
                  key={area.id}
                  className={`patrol-area-card-clean ${isSelected ? 'selected' : ''} ${!isActive ? 'inactive' : ''}`}
                  onClick={() => isActive && setSelectedAreaId(area.id)}
                >
                  <div className="patrol-area-header-clean">
                    <h4 className="patrol-area-name-clean">{area.name}</h4>
                    <div
                      className="patrol-area-priority-badge"
                      style={{ background: getPriorityColor(area.priority) }}
                    >
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                        {area.priority === 'high' && (
                          <path d="M6 2L7.5 5.5L11 6L8 9L9 12L6 10L3 12L4 9L1 6L4.5 5.5L6 2Z" fill="white" />
                        )}
                        {area.priority === 'medium' && (
                          <path d="M6 2V10M2 6H10" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                        )}
                        {area.priority === 'low' && (
                          <path d="M3 6L5 8L9 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        )}
                      </svg>
                    </div>
                  </div>

                  <p className="patrol-area-description-clean">{area.description}</p>

                  <div className="patrol-area-details-clean">
                    <div className="patrol-area-detail-row-clean">
                      <span className="label-clean">Radius</span>
                      <span className="value-clean">{area.radius.toFixed(1)} km</span>
                    </div>
                    <div className="patrol-area-detail-row-clean">
                      <span className="label-clean">Priorität</span>
                      <span className="value-clean" style={{ color: getPriorityColor(area.priority) }}>
                        {getPriorityLabel(area.priority)}
                      </span>
                    </div>
                    <div className="patrol-area-detail-row-clean">
                      <span className="label-clean">Aktiv</span>
                      <span className="value-clean">
                        {area.activeHours
                          ? `${String(area.activeHours[0]).padStart(2, '0')}:00 - ${String(area.activeHours[1]).padStart(2, '0')}:00`
                          : '24/7'
                        }
                      </span>
                    </div>
                  </div>

                  {!isActive && (
                    <div className="patrol-area-inactive-overlay-clean">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.5"/>
                        <path d="M7 4V7.5M7 10V10.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      <span>Außerhalb aktiver Stunden</span>
                    </div>
                  )}

                  {isSelected && (
                    <div className="patrol-area-selected-indicator-clean">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <circle cx="7" cy="7" r="6.5" fill="white" stroke="#30D158" strokeWidth="1"/>
                        <path d="M4 7L6 9L10 5" stroke="#30D158" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="patrol-selector-footer-clean">
          <button className="patrol-selector-btn-clean patrol-selector-btn-secondary" onClick={onClose}>
            Abbrechen
          </button>
          <button
            className="patrol-selector-btn-clean patrol-selector-btn-primary"
            onClick={handleConfirm}
            disabled={!selectedAreaId}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginRight: '6px' }}>
              <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Streife starten
          </button>
        </div>
      </div>
    </>
  );
};

export default PatrolAreaSelector;
