// Type definitions for the Police Dispatcher Game

// Vehicle Status Types (FMS - Funkmeldesystem wie echtes System)
export type VehicleStatus = 'S1' | 'S2' | 'S3' | 'S4' | 'S5' | 'S6' | 'S7' | 'S8';
// S1: Frei auf Funk (grün) - Außerhalb Wache, einsatzbereit auf Streife
// S2: Frei auf Wache (grün) - In Wache, einsatzbereit
// S3: Einsatz übernommen (orange) - Unterwegs zum Einsatzort
// S4: Am Einsatzort (rot) - Vor Ort, Einsatz wird bearbeitet
// S5: Sprechwunsch (blau) - Fahrzeug möchte mit Leitstelle sprechen
// S6: Nicht einsatzbereit (grau) - Tanken/Pause/Reparatur/Schichtende
// S8: Rückfahrt zur Wache (gelb) - KANN umgeleitet werden!
// S7 existiert nicht für Polizei (nur Rettungsdienst: Patient aufgenommen)

// Vehicle Types
export type VehicleType = 'Streifenwagen' | 'SEK' | 'Zivilfahrzeug' | 'Polizeihubschrauber';

export interface VehicleTypeConfig {
  type: VehicleType;
  color: string;
  maxSpeed: number; // km/h
  acceleration: number; // m/s²
  suitableFor: string[]; // Welche Einsatztypen
  displayName: string;
  icon: string;
  fuelConsumption: number; // Liter/km (für realistische Berechnung)
  tankCapacity: number; // Liter
  crewSize: number; // Anzahl Personen (für Fatigue-Berechnung)
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
  vehicleType: VehicleType;
  speakRequest: string | null; // S5: Was möchte das Fahrzeug mitteilen?
  speakRequestType?: 'situation_report' | 'escalation' | 'backup_needed' | 'suspect_arrested' | 'additional_info' | 'unclear_situation'; // S5: Typ des Sprechwunsches
  outOfServiceReason: ServiceReason | null; // S6: Warum außer Dienst?
  outOfServiceUntil: number | null; // S6: Wann wieder verfügbar?
  canBeRedirected: boolean; // Kann während S8 umgeleitet werden?
  situationReportSent: boolean; // Lagemeldung bei S4 gesendet?
  dispatchTime: number | null; // Zeitpunkt der Alarmierung (für Ausrückzeit)
  isPreparingToDepart: boolean; // Bereitet Ausrückung vor (zwischen S2 und S3)
  previousStatus: VehicleStatus | null; // Vorheriger Status vor S5 (Sprechwunsch)
  // Realistische Timings
  fuelLevel: number; // Tankfüllung 0-100%
  crewFatigue: number; // Crew-Müdigkeit 0-100% (0 = frisch, 100 = erschöpft)
  maintenanceStatus: 'ok' | 'warning' | 'critical'; // Wartungszustand
  lastRefuelTime: number; // Letztes Tanken (gameTime)
  lastBreakTime: number; // Letzte Pause (gameTime)
  shiftStartTime: number; // Schichtbeginn (gameTime)
  accumulatedTime: number; // Akkumulierte Zeit für Routenberechnung
  activeDispatchTimeout?: ReturnType<typeof setTimeout>; // 🔒 BUG FIX #3: Timeout-ID für Cleanup
  callsign?: string; // Funkrufname (z.B. "Frank 1/47-01")
  // 🚔 PATROL SYSTEM (Streifenfahrt)
  isOnPatrol: boolean; // Aktuell auf Streife
  patrolRoute: import('./patrol').PatrolRoute | null; // Aktuelle Streifenroute
  patrolAreaId: string | null; // 🎯 Zugewiesenes Patrol-Gebiet (bleibt konstant während Streife)
  patrolStartTime: number | null; // Start der Streife (gameTime)
  patrolTotalDistance: number; // Bisherige Distanz dieser Streife (km)
  patrolLastDiscoveryCheck: number; // Letzte Discovery-Prüfung (gameTime)
}

// Call (Notruf) - kommt rein bevor ein Einsatz erstellt wird
export interface Call {
  id: number;
  type: string;
  position: [number, number];
  priority: 'low' | 'medium' | 'high';
  description: string;
  locationName: string;
  timestamp: number;
  answered: boolean;
  // LST SIM Style Eigenschaften
  callerText?: string;
  callerType?: string;
  callerName?: string;
  callbackNumber?: string;
  address?: string;
  status?: 'waiting' | 'rejected' | 'accepted';
  // MANV-Informationen
  isMANV?: boolean;
  involvedCount?: number;

  // 🆕 Interactive Dialog System (911/112 Operator Style)
  dialogState?: {
    isActive: boolean; // Dialog-Modus aktiv
    messagesHistory: Array<{
      id: string;
      sender: 'caller' | 'dispatcher' | 'system';
      text: string;
      timestamp: number;
      emotion?: 'panic' | 'calm' | 'angry' | 'scared' | 'shocked';
    }>;
    currentOptions: string[]; // Verfügbare Frage-IDs
    revealedInfo: {
      hasLocation: boolean;
      hasIncidentType: boolean;
      hasPriority: boolean;
      hasDescription: boolean;
    };
    isComplete: boolean; // Alle Infos gesammelt
  };
  // Versteckte Informationen (werden durch Dialog enthüllt)
  hiddenData?: {
    actualPosition?: [number, number];
    actualLocation?: string;
    actualAddress?: string;
    actualType?: string;
    actualPriority?: 'low' | 'medium' | 'high';
    actualDescription?: string;
  };
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
  // MANV/Großlagen
  isMANV: boolean; // MANV Flag // Ist das eine Großlage?
  involvedCount: number; // Anzahl Beteiligte (auch außerhalb MANV)
  manvTriageProgress?: number; // MANV Sichtungsfortschritt in %
  sightingPhase?: 'none' | 'first' | 'second' | 'complete'; // Sichtungsphase
  sightingVehicleId?: number | null; // Fahrzeug für Sichtung
  sightingStartTime?: number | null; // Start der Sichtung
  sightingDuration?: number; // Dauer der Sichtung
  transportAllowed?: boolean; // Transport erlaubt?
  hasEscalated: boolean; // Ist bereits eskaliert?
  withSpecialRights?: boolean; // Mit Sonderrechten (Blaulicht)
  speakRequestGiven?: boolean; // Hat bereits eine Einheit Sprechwunsch für diesen Einsatz abgegeben?
  // Verstärkungsanforderung (wie LST-SIM)
  backupRequested?: boolean; // Wurde Verstärkung angefordert?
  backupFulfilled?: boolean; // Wurde die Verstärkung disponiert?
  backupVehiclesNeeded?: number; // Wie viele zusätzliche Fahrzeuge werden benötigt?
  initialReportGiven?: boolean; // Wurde Erstmeldung bereits abgegeben?
  // ✨ OPTION A: Abgeschlossene Einsätze
  status?: 'active' | 'completed' | 'failed'; // Status des Einsatzes
  completedAt?: number; // Zeitpunkt des Abschlusses (Date.now())
  pointsAwarded?: number; // Vergebene Punkte
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  unlocked: boolean;
  icon: string;
}

export interface Location {
  name: string;
  position: [number, number];
}

export interface IncidentType {
  type: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
  requiredVehicles: number;
}

export type TimeOfDay = 'night' | 'dusk' | 'day' | 'rushHour';

export type WeatherType = 'sunny' | 'rainy' | 'stormy' | 'foggy' | 'snowy';

// Service Reason Types (S6 - Out of Service)
export type ServiceReason = 'Tanken' | 'Reparatur' | 'Crew-Pause' | 'Schichtende' | 'unknown';
