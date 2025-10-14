/**
 * 🛡️ TYPE SAFETY HELPERS
 *
 * Defensive Programmierung - Hilfs-Funktionen für sichere Array-Operationen
 * Verhindert undefined-Zugriffe und Runtime-Errors
 */

import type { Vehicle, Incident, PoliceStation, Call } from '../types';

// ============================================================================
// SAFE ARRAY FIND OPERATIONS
// ============================================================================

/**
 * Sicheres Finden eines Fahrzeugs mit Null-Check
 * @param vehicles - Array aller Fahrzeuge
 * @param id - Fahrzeug-ID
 * @returns Fahrzeug oder null (niemals undefined!)
 */
export function findVehicleSafe(vehicles: Vehicle[], id: number): Vehicle | null {
  return vehicles.find(v => v.id === id) ?? null;
}

/**
 * Findet Fahrzeug und wirft Error wenn nicht gefunden
 * Nutzen wenn Fahrzeug MUSS existieren
 * @param vehicles - Array aller Fahrzeuge
 * @param id - Fahrzeug-ID
 * @param context - Kontext für Error-Message
 * @returns Fahrzeug (garantiert nicht null!)
 * @throws Error wenn Fahrzeug nicht existiert
 */
export function findVehicleOrThrow(
  vehicles: Vehicle[],
  id: number,
  context: string = 'Unknown operation'
): Vehicle {
  const vehicle = vehicles.find(v => v.id === id);
  if (!vehicle) {
    throw new Error(`Vehicle ${id} not found (Context: ${context})`);
  }
  return vehicle;
}

/**
 * Sicheres Finden eines Einsatzes mit Null-Check
 * @param incidents - Array aller Einsätze
 * @param id - Einsatz-ID
 * @returns Einsatz oder null
 */
export function findIncidentSafe(incidents: Incident[], id: number): Incident | null {
  return incidents.find(i => i.id === id) ?? null;
}

/**
 * Findet Einsatz und wirft Error wenn nicht gefunden
 * @param incidents - Array aller Einsätze
 * @param id - Einsatz-ID
 * @param context - Kontext für Error-Message
 * @returns Einsatz (garantiert nicht null!)
 * @throws Error wenn Einsatz nicht existiert
 */
export function findIncidentOrThrow(
  incidents: Incident[],
  id: number,
  context: string = 'Unknown operation'
): Incident {
  const incident = incidents.find(i => i.id === id);
  if (!incident) {
    throw new Error(`Incident ${id} not found (Context: ${context})`);
  }
  return incident;
}

/**
 * Sicheres Finden einer Wache mit Null-Check
 * @param stations - Array aller Wachen
 * @param id - Wachen-ID
 * @returns Wache oder null
 */
export function findStationSafe(stations: PoliceStation[], id: number): PoliceStation | null {
  return stations.find(s => s.id === id) ?? null;
}

/**
 * Findet Wache und wirft Error wenn nicht gefunden
 * @param stations - Array aller Wachen
 * @param id - Wachen-ID
 * @param context - Kontext für Error-Message
 * @returns Wache (garantiert nicht null!)
 * @throws Error wenn Wache nicht existiert
 */
export function findStationOrThrow(
  stations: PoliceStation[],
  id: number,
  context: string = 'Unknown operation'
): PoliceStation {
  const station = stations.find(s => s.id === id);
  if (!station) {
    throw new Error(`Station ${id} not found (Context: ${context})`);
  }
  return station;
}

/**
 * Sicheres Finden eines Anrufs mit Null-Check
 * @param calls - Array aller Anrufe
 * @param id - Anruf-ID
 * @returns Anruf oder null
 */
export function findCallSafe(calls: Call[], id: number): Call | null {
  return calls.find(c => c.id === id) ?? null;
}

// ============================================================================
// SAFE PROPERTY ACCESS
// ============================================================================

/**
 * Sicherer Zugriff auf Vehicle-Property mit Fallback
 * @param vehicle - Fahrzeug (kann undefined sein)
 * @param property - Property-Name
 * @param fallback - Fallback-Wert
 * @returns Property-Wert oder Fallback
 */
export function getVehicleProperty<K extends keyof Vehicle>(
  vehicle: Vehicle | undefined | null,
  property: K,
  fallback: Vehicle[K]
): Vehicle[K] {
  return vehicle?.[property] ?? fallback;
}

/**
 * Sicherer Zugriff auf Incident-Property mit Fallback
 * @param incident - Einsatz (kann undefined sein)
 * @param property - Property-Name
 * @param fallback - Fallback-Wert
 * @returns Property-Wert oder Fallback
 */
export function getIncidentProperty<K extends keyof Incident>(
  incident: Incident | undefined | null,
  property: K,
  fallback: Incident[K]
): Incident[K] {
  return incident?.[property] ?? fallback;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Type Guard: Prüft ob Wert ein Vehicle ist
 * @param value - Zu prüfender Wert
 * @returns true wenn Vehicle
 */
export function isVehicle(value: unknown): value is Vehicle {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'status' in value &&
    'vehicleType' in value
  );
}

/**
 * Type Guard: Prüft ob Wert ein Incident ist
 * @param value - Zu prüfender Wert
 * @returns true wenn Incident
 */
export function isIncident(value: unknown): value is Incident {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'type' in value &&
    'priority' in value
  );
}

/**
 * Type Guard: Prüft ob Array nicht leer ist und Typ-sicher ist
 * @param array - Zu prüfendes Array
 * @returns true wenn Array nicht leer
 */
export function isNonEmptyArray<T>(array: T[]): array is [T, ...T[]] {
  return array.length > 0;
}

// ============================================================================
// SAFE ARRAY OPERATIONS
// ============================================================================

/**
 * Filtert und validiert Array-Elemente
 * Entfernt undefined/null Werte
 * @param array - Array mit potentiell undefined Werten
 * @returns Array ohne undefined
 */
export function filterDefined<T>(array: (T | undefined | null)[]): T[] {
  return array.filter((item): item is T => item !== undefined && item !== null);
}

/**
 * Sicherer Zugriff auf Array-Element mit Index
 * @param array - Array
 * @param index - Index
 * @param fallback - Fallback-Wert wenn Index ungültig
 * @returns Element oder Fallback
 */
export function getArrayElement<T>(array: T[], index: number, fallback: T): T {
  return array[index] ?? fallback;
}

/**
 * Sicheres Array-Mapping mit Fehlerbehandlung
 * Überspringt Elemente die beim Mapping fehlschlagen
 * @param array - Array
 * @param mapper - Mapper-Funktion
 * @returns Array gemappter Elemente (ohne Fehler)
 */
export function safeMap<T, U>(
  array: T[],
  mapper: (item: T, index: number) => U
): U[] {
  const result: U[] = [];

  for (let i = 0; i < array.length; i++) {
    try {
      result.push(mapper(array[i], i));
    } catch (error) {
      console.warn(`SafeMap: Skipping element ${i} due to error:`, error);
      // Element wird übersprungen
    }
  }

  return result;
}

// ============================================================================
// NUMBER SAFETY
// ============================================================================

/**
 * Sicherer Number-Parse mit Fallback
 * @param value - Zu parsender Wert
 * @param fallback - Fallback wenn Parse fehlschlägt
 * @returns Geparste Zahl oder Fallback
 */
export function parseNumberSafe(value: unknown, fallback: number): number {
  if (typeof value === 'number' && !isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    if (!isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
}

/**
 * Clampt Zahl zwischen Min und Max
 * @param value - Wert
 * @param min - Minimum
 * @param max - Maximum
 * @returns Geclampte Zahl
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Prüft ob Zahl in Range ist
 * @param value - Wert
 * @param min - Minimum (inklusiv)
 * @param max - Maximum (inklusiv)
 * @returns true wenn in Range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

// ============================================================================
// STRING SAFETY
// ============================================================================

/**
 * Sicherer String mit Fallback
 * @param value - Zu prüfender Wert
 * @param fallback - Fallback-String
 * @returns String oder Fallback
 */
export function safeString(value: unknown, fallback: string = ''): string {
  if (typeof value === 'string') {
    return value;
  }
  if (value === null || value === undefined) {
    return fallback;
  }
  return String(value);
}

/**
 * Prüft ob String nicht leer ist
 * @param value - Zu prüfender String
 * @returns true wenn nicht leer
 */
export function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

// ============================================================================
// ASYNC SAFETY
// ============================================================================

/**
 * Sicherer Async-Call mit Error-Handling
 * @param asyncFn - Async-Funktion
 * @param fallback - Fallback bei Error
 * @returns Promise mit Result oder Fallback
 */
export async function safeAsync<T>(
  asyncFn: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await asyncFn();
  } catch (error) {
    console.error('SafeAsync: Error caught:', error);
    return fallback;
  }
}

/**
 * Async mit Timeout
 * @param asyncFn - Async-Funktion
 * @param timeoutMs - Timeout in Millisekunden
 * @param fallback - Fallback bei Timeout
 * @returns Promise mit Result oder Fallback
 */
export async function asyncWithTimeout<T>(
  asyncFn: () => Promise<T>,
  timeoutMs: number,
  fallback: T
): Promise<T> {
  return Promise.race([
    asyncFn(),
    new Promise<T>((resolve) =>
      setTimeout(() => {
        console.warn(`AsyncWithTimeout: Timeout after ${timeoutMs}ms`);
        resolve(fallback);
      }, timeoutMs)
    ),
  ]);
}

// ============================================================================
// BEISPIEL-VERWENDUNG (in Kommentaren)
// ============================================================================

/*
// ❌ VORHER (unsicher):
const vehicle = vehicles.find(v => v.id === 123);
const station = policeStations.find(s => s.id === vehicle.stationId); // CRASH wenn vehicle undefined!
const fuelLevel = vehicle.fuelLevel; // CRASH!

// ✅ NACHHER (sicher):
const vehicle = findVehicleSafe(vehicles, 123);
if (vehicle) {
  const station = findStationSafe(policeStations, vehicle.stationId);
  const fuelLevel = getVehicleProperty(vehicle, 'fuelLevel', 0);
}

// ✅ NACHHER (mit Garantie):
try {
  const vehicle = findVehicleOrThrow(vehicles, 123, 'Dispatch operation');
  // vehicle ist garantiert nicht null hier
  const station = findStationOrThrow(policeStations, vehicle.stationId, 'Station lookup');
  // station ist garantiert nicht null hier
} catch (error) {
  console.error('Vehicle or station not found:', error);
  // Graceful error handling
}

// ✅ Safe Mapping:
const fuelLevels = safeMap(vehicles, v => v.fuelLevel);
// Überspringt automatisch Fahrzeuge die Fehler werfen

// ✅ Safe Array Filter:
const validVehicles = filterDefined([vehicle1, undefined, vehicle2, null]);
// [vehicle1, vehicle2]
*/
