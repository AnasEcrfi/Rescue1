import React, { useRef, useEffect } from 'react';
import type { LogEntry } from '../types/logs';

interface ProtocolLogProps {
  logs: LogEntry[];
}

const ProtocolLog: React.FC<ProtocolLogProps> = ({ logs }) => {
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="protocol-log">
      <div className="protocol-header">
        <h3>Protokoll</h3>
      </div>
      <div className="protocol-content">
        {logs.length === 0 ? (
          <div className="protocol-empty">Keine Ereignisse</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className={`protocol-entry protocol-${log.type}`}>
              <span className="protocol-time">{log.timestamp}</span>
              <span className="protocol-message">{log.message}</span>
            </div>
          ))
        )}
        <div ref={logEndRef} />
      </div>
    </div>
  );
};

export default ProtocolLog;
