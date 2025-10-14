// Vehicle Status Types (lstsim.de style - ERWEITERT)
export type VehicleStatus = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8';
// S1: Bereit an Wache (grün)
// S3: Anfahrt zum Einsatz (orange)
// S4: Am Einsatzort, Bearbeitung (rot)
// S5: Sprechwunsch (blau) - Fahrzeug möchte mit Leitstelle sprechen
// S6: Außer Dienst (grau) - Fahrzeug defekt/Schichtende
// S7: Tanken (gelb) - Fahrzeug an Tankstelle
// S8: Rückfahrt zur Wache (blau) - KANN umgeleitet werden!

// Fahrzeugtypen (lstsim.de inspiriert, Polizei-Adaption)
export type VehicleType = 'Streifenwagen' | 'SEK' | 'Zivilfahrzeug' | 'Polizeihubschrauber';

// Tageszeit-Typen
export type TimeOfDay = 'night' | 'dusk' | 'day' | 'rushHour';

export interface VehicleTypeConfig {
  type: VehicleType;
  color: string;
  maxSpeed: number; // km/h
  acceleration: number; // m/s²
  suitableFor: string[]; // Welche Einsatztypen
  displayName: string;
  icon: string;
  fuelConsumption: number; // Liter pro 100km
  tankCapacity: number; // Liter
  crewSize: number; // Anzahl Besatzung
}

export interface PoliceStation {
  id: number;
  name: string;
  position: [number, number];
}

export interface GasStation {
  id: number;
  name: string;
  position: [number, number];
  brand: string; // Shell, Aral, etc.
}

export interface Vehicle {
  id: number;
  stationId: number;
  position: [number, number];
  assignedIncidentId: number | null;
  routeIndex: number;
  route: [number, number][] | null;
  routeProgress: number;
  bearing: number;
  routeDuration: number;
  routeStartTime: number;
  totalDistanceTraveled: number;
  isAvailable: boolean;
  status: VehicleStatus;
  processingStartTime: number | null;
  processingDuration: number;
  // NEU: Fahrzeugtyp und erweiterte Eigenschaften
  vehicleType: VehicleType;
  callsign: string; // Realistischer Funkrufname (z.B. "Frank 1/31")
  speakRequest: string | null; // S5: Was möchte das Fahrzeug mitteilen?
  outOfServiceReason: string | null; // S6: Warum außer Dienst?
  outOfServiceUntil: number | null; // S6: Wann wieder verfügbar?
  canBeRedirected: boolean; // Kann während S8 umgeleitet werden?
  situationReportSent: boolean; // Lagemeldung bei S4 gesendet?
  // Realistische Fahrzeug-Timings
  fuelLevel: number; // 0-100%
  crewFatigue: number; // 0-100%
  maintenanceStatus: 'ok' | 'warning' | 'critical';
  lastRefuelTime: number;
  lastBreakTime: number;
  shiftStartTime: number;
  accumulatedTime: number; // Gesamte Zeit im aktuellen Status
}

// Call (Notruf) - kommt rein bevor ein Einsatz erstellt wird
// ERWEITERT für LST SIM Style mit Gesprächstexten
export interface Call {
  id: number;
  type: string;
  position: [number, number];
  priority: 'low' | 'medium' | 'high';
  description: string;
  locationName: string;
  timestamp: number;
  answered: boolean;
  // NEU: LST SIM Style Erweiterungen
  callerText: string; // Der tatsächliche Gesprächstext des Anrufers
  callerType: 'witness' | 'victim' | 'resident' | 'business' | 'anonymous' | 'employee';
  callerName?: string; // Optional: Name des Anrufers
  callbackNumber?: string; // Optional: Rückrufnummer
  address: string; // Echte Adresse des Einsatzorts
  status: 'waiting' | 'answered' | 'rejected'; // Status des Anrufs
  // MANV (Massenanfall von Verletzten/Großlagen)
  isMANV?: boolean; // Ist dies eine Großlage?
  involvedCount?: number; // Anzahl Betroffene bei MANV
}

export interface Incident {
  id: number;
  type: string;
  position: [number, number];
  assignedVehicleIds: number[]; // Array for multiple vehicles
  priority: 'low' | 'medium' | 'high';
  description: string;
  timeRemaining: number;
  locationName: string;
  spawnTime: number;
  requiredVehicles: number; // How many vehicles needed
  arrivedVehicles: number; // How many vehicles have arrived
  processingDuration: number; // How long to process at scene
  canEscalate: boolean; // Kann dieser Einsatz eskalieren?
  escalationTime: number | null; // Wann soll eskaliert werden (timestamp)
  hasEscalated: boolean; // Ist bereits eskaliert?
  isMANV: boolean; // Massenanfall von Verletzten / Großlage
  involvedCount: number; // Anzahl Beteiligte
  manvTriageProgress?: number; // 0-100% - Sichtungsphase bei MANV
  manvAudioPlayed?: boolean; // Audio-Warnung abgespielt?
  withSpecialRights?: boolean; // Mit Sonderrechten (Blaulicht & Martinshorn)
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

// Location (für frankfurtLocations)
export interface Location {
  name: string;
  position: [number, number];
}

// IncidentType (für incidentTypes array)
export interface IncidentType {
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  requiredVehicles: number;
}
