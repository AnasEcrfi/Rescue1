// Log Entry Types - Zentralisierte Definition

export type LogEntryType =
  | 'assignment'
  | 'arrival'
  | 'completion'
  | 'failed'
  | 'new'
  | 'system'
  | 'escalation'
  | 'call'
  | 'radio';

export interface LogEntry {
  id: number;
  timestamp: string;
  message: string;
  type: LogEntryType;
}

