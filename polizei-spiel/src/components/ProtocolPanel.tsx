import React, { useState, useMemo } from 'react';
import type { ProtocolEntry, ProtocolEntryType, ProtocolFilter } from '../types/protocol';
import { protocolLogger } from '../utils/protocolLogger';

interface ProtocolPanelProps {
  isOpen: boolean;
  onClose: () => void;
  entries: ProtocolEntry[];
}

const ProtocolPanel: React.FC<ProtocolPanelProps> = ({ isOpen, onClose, entries }) => {
  const [filter, setFilter] = useState<ProtocolFilter>({});
  const [searchText, setSearchText] = useState('');
  const [showTypeFilter, setShowTypeFilter] = useState(false);
  const [showPriorityFilter, setShowPriorityFilter] = useState(false);

  // Filtere Einträge
  const filteredEntries = useMemo(() => {
    return protocolLogger.filterEntries({ ...filter, searchText });
  }, [filter, searchText, entries]);

  // Close dropdowns when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.custom-dropdown-wrapper')) {
        setShowTypeFilter(false);
        setShowPriorityFilter(false);
      }
    };

    if (showTypeFilter || showPriorityFilter) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showTypeFilter, showPriorityFilter]);

  // Icon für jeden Entry-Type
  const getTypeIcon = (type: ProtocolEntryType): string => {
    const icons: { [key in ProtocolEntryType]: string } = {
      call: '📞',
      assignment: '🚔',
      status: '📡',
      radio: '📻',
      completion: '✅',
      failed: '❌',
      system: '⚙️',
      backup: '🆘',
      escalation: '⚠️',
      manv: '🚨',
    };
    return icons[type];
  };

  // Label für jeden Entry-Type
  const getTypeLabel = (type: ProtocolEntryType): string => {
    const labels: { [key in ProtocolEntryType]: string } = {
      call: 'Anruf',
      assignment: 'Zuweisung',
      status: 'Status',
      radio: 'Funk',
      completion: 'Abgeschlossen',
      failed: 'Fehlgeschlagen',
      system: 'System',
      backup: 'Verstärkung',
      escalation: 'Eskalation',
      manv: 'Großlage',
    };
    return labels[type];
  };

  // Farbe für jeden Entry-Type
  const getTypeColor = (type: ProtocolEntryType): string => {
    const colors: { [key in ProtocolEntryType]: string } = {
      call: '#0A84FF',
      assignment: '#30D158',
      status: '#8E8E93',
      radio: '#64D2FF',
      completion: '#30D158',
      failed: '#FF453A',
      system: '#8E8E93',
      backup: '#FF9F0A',
      escalation: '#FF453A',
      manv: '#FF453A',
    };
    return colors[type];
  };

  // Export als CSV
  const handleExport = () => {
    const csv = protocolLogger.exportToCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `protokoll_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isOpen) return null;

  const typeFilterOptions: ProtocolEntryType[] = ['call', 'assignment', 'status', 'radio', 'completion', 'failed', 'backup', 'escalation', 'manv'];
  const currentTypeFilter = filter.type?.[0] || null;
  const currentPriorityFilter = filter.priority?.[0] || null;

  return (
    <>
      <div
        className="modal-overlay-clean"
        onClick={onClose}
      />
      <div className="protocol-panel-clean">
        {/* Header */}
        <div className="protocol-header-clean">
          <div className="protocol-title-section">
            <h3>Einsatzprotokoll</h3>
            <p className="protocol-subtitle">{filteredEntries.length} {filteredEntries.length === 1 ? 'Eintrag' : 'Einträge'}</p>
          </div>
          <button className="close-btn-clean" onClick={onClose} aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M12 4L4 12M4 4l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Toolbar */}
        <div className="protocol-toolbar-clean">
          <div className="search-wrapper-clean">
            <svg className="search-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              type="text"
              className="search-input-clean"
              placeholder="Suchen..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </div>

          <div className="filter-buttons-clean">
            {/* Type Filter Dropdown */}
            <div className="dropdown-wrapper-clean">
              <button
                className={`filter-btn-clean ${currentTypeFilter ? 'active' : ''}`}
                onClick={() => setShowTypeFilter(!showTypeFilter)}
              >
                {currentTypeFilter ? getTypeLabel(currentTypeFilter) : 'Typ'}
                <svg className="chevron-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showTypeFilter && (
                <div className="custom-dropdown-menu">
                  <button
                    className="custom-dropdown-item"
                    onClick={() => {
                      setFilter({ ...filter, type: undefined });
                      setShowTypeFilter(false);
                    }}
                  >
                    Alle Typen
                  </button>
                  {typeFilterOptions.map((type) => (
                    <button
                      key={type}
                      className={`custom-dropdown-item ${currentTypeFilter === type ? 'selected' : ''}`}
                      onClick={() => {
                        setFilter({ ...filter, type: [type] });
                        setShowTypeFilter(false);
                      }}
                    >
                      {getTypeLabel(type)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Priority Filter Dropdown */}
            <div className="dropdown-wrapper-clean">
              <button
                className={`filter-btn-clean ${currentPriorityFilter ? 'active' : ''}`}
                onClick={() => setShowPriorityFilter(!showPriorityFilter)}
              >
                {currentPriorityFilter
                  ? currentPriorityFilter === 'high' ? 'Dringend'
                  : currentPriorityFilter === 'medium' ? 'Normal'
                  : 'Niedrig'
                  : 'Priorität'}
                <svg className="chevron-icon" width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M3 5l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              {showPriorityFilter && (
                <div className="custom-dropdown-menu">
                  <button
                    className="custom-dropdown-item"
                    onClick={() => {
                      setFilter({ ...filter, priority: undefined });
                      setShowPriorityFilter(false);
                    }}
                  >
                    Alle Prioritäten
                  </button>
                  <button
                    className={`custom-dropdown-item ${currentPriorityFilter === 'high' ? 'selected' : ''}`}
                    onClick={() => {
                      setFilter({ ...filter, priority: ['high'] });
                      setShowPriorityFilter(false);
                    }}
                  >
                    Dringend
                  </button>
                  <button
                    className={`custom-dropdown-item ${currentPriorityFilter === 'medium' ? 'selected' : ''}`}
                    onClick={() => {
                      setFilter({ ...filter, priority: ['medium'] });
                      setShowPriorityFilter(false);
                    }}
                  >
                    Normal
                  </button>
                  <button
                    className={`custom-dropdown-item ${currentPriorityFilter === 'low' ? 'selected' : ''}`}
                    onClick={() => {
                      setFilter({ ...filter, priority: ['low'] });
                      setShowPriorityFilter(false);
                    }}
                  >
                    Niedrig
                  </button>
                </div>
              )}
            </div>

            {(currentTypeFilter || currentPriorityFilter || searchText) && (
              <button
                className="protocol-clear-btn"
                onClick={() => {
                  setFilter({});
                  setSearchText('');
                }}
                title="Filter zurücksetzen"
              >
                ×
              </button>
            )}
          </div>

          <button className="protocol-export-btn-modern" onClick={handleExport} title="Als CSV exportieren">
            💾
          </button>
        </div>

        {/* Entry List */}
        <div className="protocol-entries-modern">
          {filteredEntries.length === 0 ? (
            <div className="protocol-empty-modern">
              Keine Einträge gefunden
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div key={entry.id} className="protocol-entry-card">
                <div className="protocol-entry-header">
                  <span
                    className="protocol-type-icon"
                    style={{ color: getTypeColor(entry.type) }}
                  >
                    {getTypeIcon(entry.type)}
                  </span>
                  <span className="protocol-entry-time">{entry.timestamp}</span>
                  {entry.vehicleCallsign && (
                    <span className="protocol-entry-vehicle">{entry.vehicleCallsign}</span>
                  )}
                  {entry.incidentId && (
                    <span className="protocol-entry-incident">#{entry.incidentId}</span>
                  )}
                </div>
                <div className="protocol-entry-message">
                  {entry.message}
                  {entry.statusFrom && entry.statusTo && (
                    <span className="protocol-status-badge">
                      {entry.statusFrom} → {entry.statusTo}
                    </span>
                  )}
                </div>
                {entry.location && (
                  <div className="protocol-entry-location">📍 {entry.location}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
};

export default ProtocolPanel;
