// MANV/Großlagen-Szenarien für Polizei (LST-SIM Style)

export interface MANVScenario {
  type: string;
  description: string;
  priority: 'high';
  minInvolved: number; // Mindestanzahl Beteiligte
  maxInvolved: number; // Maximale Anzahl Beteiligte
  requiredVehicles: number; // Initial benötigte Fahrzeuge
  additionalVehiclesPerPerson: number; // Zusätzliche Fahrzeuge pro Person
  processingTimePerPerson: number; // Sekunden pro Person
  firstSightingDuration: number; // Sekunden für erste Sichtung (Basis)
  secondSightingDuration: number; // Sekunden für zweite Sichtung (Basis)
  canEscalate: boolean;
  escalationChance: number; // 0-1 Wahrscheinlichkeit
}

// Großlagen-Szenarien (4+ Beteiligte = Großlage)
export const manvScenarios: MANVScenario[] = [
  {
    type: 'Großschadenslage',
    description: 'Großschadenslage mit mehreren Beteiligten',
    priority: 'high',
    minInvolved: 4,
    maxInvolved: 10,
    requiredVehicles: 3,
    additionalVehiclesPerPerson: 0.3, // 1 FZ pro 3 Personen
    processingTimePerPerson: 120, // 2 Min pro Person
    firstSightingDuration: 20, // Basis: 20 Sek
    secondSightingDuration: 20, // Basis: 20 Sek
    canEscalate: true,
    escalationChance: 0.2,
  },
  {
    type: 'Massenschlägerei',
    description: 'Massive Schlägerei mit vielen Beteiligten',
    priority: 'high',
    minInvolved: 6,
    maxInvolved: 20,
    requiredVehicles: 4,
    additionalVehiclesPerPerson: 0.25,
    processingTimePerPerson: 90, // 1.5 Min pro Person
    firstSightingDuration: 20,
    secondSightingDuration: 20,
    canEscalate: true,
    escalationChance: 0.3,
  },
  {
    type: 'Großdemonstration',
    description: 'Große Demonstration mit Ausschreitungen',
    priority: 'high',
    minInvolved: 20,
    maxInvolved: 50,
    requiredVehicles: 6,
    additionalVehiclesPerPerson: 0.1, // 1 FZ pro 10 Personen
    processingTimePerPerson: 60, // 1 Min pro Person
    firstSightingDuration: 30,
    secondSightingDuration: 30,
    canEscalate: true,
    escalationChance: 0.4,
  },
  {
    type: 'Terroranschlag',
    description: 'Terroranschlag mit vielen Beteiligten',
    priority: 'high',
    minInvolved: 10,
    maxInvolved: 30,
    requiredVehicles: 8,
    additionalVehiclesPerPerson: 0.2,
    processingTimePerPerson: 180, // 3 Min pro Person
    firstSightingDuration: 30,
    secondSightingDuration: 40,
    canEscalate: false, // Kann nicht weiter eskalieren
    escalationChance: 0,
  },
  {
    type: 'Massenpanik',
    description: 'Massenpanik mit vielen verletzten Personen',
    priority: 'high',
    minInvolved: 15,
    maxInvolved: 40,
    requiredVehicles: 5,
    additionalVehiclesPerPerson: 0.15,
    processingTimePerPerson: 100,
    firstSightingDuration: 25,
    secondSightingDuration: 25,
    canEscalate: true,
    escalationChance: 0.15,
  },
];

// Sichtungs-Phasen
export type SightingPhase = 'none' | 'first' | 'second' | 'complete';

export interface MANVState {
  isMANV: boolean;
  scenario: MANVScenario | null;
  involvedCount: number;
  sightingPhase: SightingPhase;
  sightingVehicleId: number | null; // Welches Fahrzeug macht Sichtung
  sightingStartTime: number | null; // Wann Sichtung gestartet
  sightingDuration: number; // Wie lange dauert aktuelle Sichtung
  requiredVehiclesCalculated: number; // Berechnete benötigte Fahrzeuge
  transportAllowed: boolean; // Dürfen Personen abtransportiert werden?
}

// Berechne Sichtungsdauer
export const calculateSightingDuration = (
  scenario: MANVScenario,
  phase: 'first' | 'second',
  involvedCount: number
): number => {
  if (phase === 'first') {
    return scenario.firstSightingDuration + (25 * involvedCount);
  } else {
    return scenario.secondSightingDuration + (75 * involvedCount);
  }
};

// Berechne benötigte Fahrzeuge basierend auf Beteiligten
export const calculateRequiredVehicles = (
  scenario: MANVScenario,
  involvedCount: number
): number => {
  const additional = Math.ceil(involvedCount * scenario.additionalVehiclesPerPerson);
  return scenario.requiredVehicles + additional;
};

// Hole zufälliges MANV-Szenario
export const getRandomMANVScenario = (): MANVScenario => {
  return manvScenarios[Math.floor(Math.random() * manvScenarios.length)];
};

// Generiere zufällige Anzahl Beteiligter
export const generateInvolvedCount = (scenario: MANVScenario): number => {
  return Math.floor(
    scenario.minInvolved + Math.random() * (scenario.maxInvolved - scenario.minInvolved + 1)
  );
};

// Prüfe ob Einsatz MANV-würdig ist (4+ Fahrzeuge benötigt)
export const shouldTriggerMANV = (difficulty: string): boolean => {
  // Schwierigkeit beeinflusst MANV-Wahrscheinlichkeit
  const baseChance = 0.05; // 5% Basis-Chance

  let multiplier = 1.0;
  if (difficulty === 'Schwer') multiplier = 2.0;
  if (difficulty === 'Leicht') multiplier = 0.5;

  return Math.random() < (baseChance * multiplier);
};
