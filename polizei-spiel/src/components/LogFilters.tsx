import React, { useState } from 'react';
import type { LogEntry, LogEntryType } from '../types/logs';

export type LogFilter = 'all' | LogEntryType;

interface LogFiltersProps {
  logs: LogEntry[];
  onFilterChange?: (filteredLogs: LogEntry[]) => void;
}

export const LogFilters: React.FC<LogFiltersProps> = ({ logs, onFilterChange }) => {
  const [activeFilter, setActiveFilter] = useState<LogFilter>('all');

  const filterLogs = (filter: LogFilter): LogEntry[] => {
    if (filter === 'all') return logs;
    return logs.filter(log => log.type === filter);
  };

  const handleFilterClick = (filter: LogFilter) => {
    setActiveFilter(filter);
    const filtered = filterLogs(filter);
    onFilterChange?.(filtered);
  };

  const exportLogsAsCSV = () => {
    const filtered = filterLogs(activeFilter);

    // CSV Header
    let csv = 'Zeit,Typ,Nachricht\n';

    // CSV Rows
    filtered.forEach(log => {
      const time = log.timestamp;
      const type = log.type;
      const message = log.message.replace(/"/g, '""'); // Escape quotes
      csv += `"${time}","${type}","${message}"\n`;
    });

    // Download trigger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `polizei-log-${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFilterStats = (): { [key in LogFilter]: number } => {
    return {
      all: logs.length,
      assignment: logs.filter(l => l.type === 'assignment').length,
      arrival: logs.filter(l => l.type === 'arrival').length,
      completion: logs.filter(l => l.type === 'completion').length,
      escalation: logs.filter(l => l.type === 'escalation').length,
      call: logs.filter(l => l.type === 'call').length,
      failed: logs.filter(l => l.type === 'failed').length,
      new: logs.filter(l => l.type === 'new').length,
      system: logs.filter(l => l.type === 'system').length,
    };
  };

  const stats = getFilterStats();

  return (
    <div className="log-filters">
      <div className="filter-buttons">
        <button
          className={`filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
          onClick={() => handleFilterClick('all')}
        >
          Alle ({stats.all})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'call' ? 'active' : ''}`}
          onClick={() => handleFilterClick('call')}
        >
          📞 Anrufe ({stats.call})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'assignment' ? 'active' : ''}`}
          onClick={() => handleFilterClick('assignment')}
        >
          🚨 Einsätze ({stats.assignment})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'completion' ? 'active' : ''}`}
          onClick={() => handleFilterClick('completion')}
        >
          ✅ Abschlüsse ({stats.completion})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'escalation' ? 'active' : ''}`}
          onClick={() => handleFilterClick('escalation')}
        >
          ⚠️ Eskalationen ({stats.escalation})
        </button>
        <button
          className={`filter-btn ${activeFilter === 'system' ? 'active' : ''}`}
          onClick={() => handleFilterClick('system')}
        >
          ⚙️ System ({stats.system})
        </button>
      </div>
      <button className="export-btn" onClick={exportLogsAsCSV} title="Logs als CSV exportieren">
        📥 Export
      </button>
    </div>
  );
};
