// Protocol Logger Utility - Automatische Protokollierung wie LST-SIM

import type { ProtocolEntry, ProtocolEntryType, ProtocolFilter } from '../types/protocol';
import type { VehicleStatus } from '../types';

export class ProtocolLogger {
  private static instance: ProtocolLogger;
  private entries: ProtocolEntry[] = [];
  private counter: number = 1;

  private constructor() {}

  static getInstance(): ProtocolLogger {
    if (!ProtocolLogger.instance) {
      ProtocolLogger.instance = new ProtocolLogger();
    }
    return ProtocolLogger.instance;
  }

  /**
   * Fügt einen neuen Protokoll-Eintrag hinzu
   */
  addEntry(
    type: ProtocolEntryType,
    message: string,
    gameTime: number,
    options?: {
      vehicleId?: number;
      vehicleCallsign?: string;
      incidentId?: number;
      statusFrom?: VehicleStatus;
      statusTo?: VehicleStatus;
      priority?: 'low' | 'medium' | 'high';
      location?: string;
      duration?: number;
    }
  ): ProtocolEntry {
    const hours = Math.floor(gameTime / 60);
    const minutes = Math.floor(gameTime % 60);
    const seconds = Math.floor((gameTime % 1) * 60);
    const timestamp = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const entry: ProtocolEntry = {
      id: this.counter++,
      timestamp,
      realTimestamp: Date.now(),
      type,
      message,
      ...options,
    };

    this.entries.push(entry);

    // Begrenze auf letzte 1000 Einträge (Performance)
    if (this.entries.length > 1000) {
      this.entries = this.entries.slice(-1000);
    }

    return entry;
  }

  /**
   * Gibt alle Protokoll-Einträge zurück
   */
  getEntries(): ProtocolEntry[] {
    return [...this.entries];
  }

  /**
   * Filtert Protokoll-Einträge
   */
  filterEntries(filter: ProtocolFilter): ProtocolEntry[] {
    let filtered = [...this.entries];

    if (filter.vehicleId !== undefined) {
      filtered = filtered.filter(e => e.vehicleId === filter.vehicleId);
    }

    if (filter.incidentId !== undefined) {
      filtered = filtered.filter(e => e.incidentId === filter.incidentId);
    }

    if (filter.type && filter.type.length > 0) {
      filtered = filtered.filter(e => filter.type!.includes(e.type));
    }

    if (filter.priority && filter.priority.length > 0) {
      filtered = filtered.filter(e => e.priority && filter.priority!.includes(e.priority));
    }

    if (filter.searchText) {
      const search = filter.searchText.toLowerCase();
      filtered = filtered.filter(e =>
        e.message.toLowerCase().includes(search) ||
        e.vehicleCallsign?.toLowerCase().includes(search) ||
        e.location?.toLowerCase().includes(search)
      );
    }

    if (filter.timeFrom) {
      filtered = filtered.filter(e => e.timestamp >= filter.timeFrom!);
    }

    if (filter.timeTo) {
      filtered = filtered.filter(e => e.timestamp <= filter.timeTo!);
    }

    return filtered;
  }

  /**
   * Exportiert Protokoll als CSV
   */
  exportToCSV(): string {
    const headers = ['Zeit', 'Typ', 'Fahrzeug', 'Einsatz', 'Nachricht', 'Ort'];
    const rows = this.entries.map(e => [
      e.timestamp,
      e.type,
      e.vehicleCallsign || '-',
      e.incidentId ? `#${e.incidentId}` : '-',
      e.message,
      e.location || '-',
    ]);

    const csv = [
      headers.join(';'),
      ...rows.map(row => row.join(';')),
    ].join('\n');

    return csv;
  }

  /**
   * Lädt Protokoll zurück (z.B. aus LocalStorage)
   */
  clear(): void {
    this.entries = [];
    this.counter = 1;
  }

  /**
   * Gibt die letzten N Einträge zurück
   */
  getRecentEntries(count: number): ProtocolEntry[] {
    return this.entries.slice(-count);
  }
}

// Singleton-Instanz exportieren
export const protocolLogger = ProtocolLogger.getInstance();
