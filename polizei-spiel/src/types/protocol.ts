// Protokoll-System Types (LST-SIM inspiriert)

import type { VehicleStatus } from './index';

export type ProtocolEntryType =
  | 'call'        // Eingehender Anruf
  | 'assignment'  // Fahrzeugzuweisung
  | 'status'      // Status-Änderung
  | 'radio'       // Funkspruch
  | 'completion'  // Einsatz abgeschlossen
  | 'failed'      // Einsatz fehlgeschlagen
  | 'system'      // System-Meldung
  | 'backup'      // Verstärkung angefordert
  | 'escalation'  // Eskalation
  | 'manv';       // Großlage

export interface ProtocolEntry {
  id: number;
  timestamp: string;           // Spielzeit HH:MM:SS
  realTimestamp: number;       // Date.now() für Sortierung
  type: ProtocolEntryType;
  vehicleId?: number;
  vehicleCallsign?: string;    // z.B. "FuStW 1-23"
  incidentId?: number;
  message: string;
  statusFrom?: VehicleStatus;
  statusTo?: VehicleStatus;
  priority?: 'low' | 'medium' | 'high';
  location?: string;           // Einsatzort
  duration?: number;           // Dauer in Sekunden (für abgeschlossene Einsätze)
}

export interface ProtocolFilter {
  vehicleId?: number;
  incidentId?: number;
  type?: ProtocolEntryType[];
  priority?: ('low' | 'medium' | 'high')[];
  timeFrom?: string;           // HH:MM
  timeTo?: string;             // HH:MM
  searchText?: string;
}
