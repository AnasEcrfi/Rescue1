import React from 'react';

export interface Statistics {
  totalResolved: number;
  totalFailed: number;
  totalResponseTimes: number[];
  incidentsByType: Record<string, number>;
  currentStreak: number;
  bestStreak: number;
  totalDistance: number;
  // 🚔 PATROL STATISTICS
  totalPatrols?: number; // Abgeschlossene Streifen
  totalPatrolTime?: number; // Gesamt-Zeit auf Streife (Minuten)
  totalDiscoveries?: number; // Entdeckungen während Streifen
  totalPatrolDistance?: number; // Distanz auf Streife (km)
}

interface StatisticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: Statistics;
}

const StatisticsModal: React.FC<StatisticsModalProps> = ({ isOpen, onClose, stats }) => {
  if (!isOpen) return null;

  const totalIncidents = stats.totalResolved + stats.totalFailed;
  const successRate = totalIncidents > 0 ? ((stats.totalResolved / totalIncidents) * 100).toFixed(1) : '0.0';

  const avgResponseTime = stats.totalResponseTimes.length > 0
    ? (stats.totalResponseTimes.reduce((a, b) => a + b, 0) / stats.totalResponseTimes.length).toFixed(1)
    : '0.0';

  const longestResponse = stats.totalResponseTimes.length > 0
    ? Math.max(...stats.totalResponseTimes).toFixed(1)
    : '0.0';

  const shortestResponse = stats.totalResponseTimes.length > 0
    ? Math.min(...stats.totalResponseTimes).toFixed(1)
    : '0.0';

  const distanceKm = (stats.totalDistance / 1000).toFixed(2);

  return (
    <>
      <div
        className="modal-overlay-clean"
        onClick={onClose}
      />
      <div className="stats-panel-clean" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="stats-header-clean">
          <div className="stats-title-section">
            <h3>Statistik</h3>
            <p className="stats-subtitle">{totalIncidents} {totalIncidents === 1 ? 'Einsatz' : 'Einsätze'}</p>
          </div>
          <button className="close-btn-clean" onClick={onClose} aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-content-clean">
          <div className="stats-grid-clean">
            <div className="stat-card-clean">
              <div className="stat-label-clean">Gelöst</div>
              <div className="stat-value-clean">{stats.totalResolved}</div>
            </div>

            <div className="stat-card-clean">
              <div className="stat-label-clean">Fehlgeschlagen</div>
              <div className="stat-value-clean">{stats.totalFailed}</div>
            </div>

            <div className="stat-card-clean">
              <div className="stat-label-clean">Erfolgsrate</div>
              <div className="stat-value-clean">{successRate}%</div>
            </div>

            <div className="stat-card-clean">
              <div className="stat-label-clean">Ø Reaktion</div>
              <div className="stat-value-clean">{avgResponseTime}s</div>
            </div>

            <div className="stat-card-clean">
              <div className="stat-label-clean">Serie</div>
              <div className="stat-value-clean">{stats.currentStreak} / {stats.bestStreak}</div>
            </div>

            <div className="stat-card-clean">
              <div className="stat-label-clean">Strecke</div>
              <div className="stat-value-clean">{distanceKm} km</div>
            </div>

            {/* 🚔 PATROL STATISTICS */}
            {(stats.totalPatrols ?? 0) > 0 && (
              <>
                <div className="stat-card-clean">
                  <div className="stat-label-clean">🚔 Streifen</div>
                  <div className="stat-value-clean">{stats.totalPatrols}</div>
                </div>

                <div className="stat-card-clean">
                  <div className="stat-label-clean">🔍 Entdeckungen</div>
                  <div className="stat-value-clean">{stats.totalDiscoveries ?? 0}</div>
                </div>

                <div className="stat-card-clean">
                  <div className="stat-label-clean">Streife km</div>
                  <div className="stat-value-clean">{((stats.totalPatrolDistance ?? 0)).toFixed(1)} km</div>
                </div>
              </>
            )}
          </div>

          {Object.keys(stats.incidentsByType).length > 0 && (
            <div className="stats-section-clean">
              <h4 className="section-title-clean">Einsätze nach Typ</h4>
              <div className="breakdown-list-clean">
                {Object.entries(stats.incidentsByType)
                  .sort(([, a], [, b]) => b - a)
                  .map(([type, count]) => (
                    <div key={type} className="breakdown-row-clean">
                      <span className="breakdown-label">{type}</span>
                      <span className="breakdown-value">{count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default StatisticsModal;
