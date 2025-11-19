/**
 * FMS Status Validation
 *
 * Verhindert ungültige Status-Übergänge und erzwingt die korrekte FMS-Reihenfolge.
 * Basiert auf dem deutschen FMS-System (Funkmeldesystem):
 *
 * S1: Frei auf Funkwache
 * S2: Frei auf Wache (an Wache)
 * S3: Einsatz übernommen (unterwegs)
 * S4: Einsatzort erreicht (am Einsatzort)
 * S5: Sprechwunsch (temporärer Status)
 * S6: Nicht einsatzbereit (Wartung/Pause/Tanken erforderlich)
 * S7: Patient aufgenommen / auf Sonderfahrt (Tanken)
 * S8: Rückkehr zur Wache
 */

import type { VehicleStatus } from '../types/index';

/**
 * Definiert erlaubte Status-Übergänge im FMS-System
 * Format: current -> allowed next states
 */
const ALLOWED_TRANSITIONS: Record<VehicleStatus, VehicleStatus[]> = {
  S1: ['S2', 'S3', 'S6'], // Frei Funk → An Wache | Einsatz übernommen | Nicht einsatzbereit
  S2: ['S1', 'S3', 'S6', 'S7'], // An Wache → Frei Funk | Einsatz | Nicht einsatzbereit | Tanken
  S3: ['S4', 'S8', 'S6'], // Unterwegs → Am Einsatzort | Abbruch (Rückkehr) | Nicht einsatzbereit
  S4: ['S5', 'S8'], // Am Einsatzort → Sprechwunsch | Rückkehr zur Wache
  S5: ['S4', 'S8'], // Sprechwunsch → Zurück zum Einsatz | Abbruch (Rückkehr)
  S6: ['S2', 'S7'], // Nicht einsatzbereit → An Wache (nach Wartung) | Tanken
  S7: ['S2', 'S8'], // Tanken → An Wache | Rückkehr zur Wache
  S8: ['S2', 'S6', 'S7'], // Rückkehr → An Wache | Nicht einsatzbereit | Tanken
};

/**
 * Status-Priorität für Konfliktlösung
 * Höhere Nummer = höhere Priorität
 */
const STATUS_PRIORITY: Record<VehicleStatus, number> = {
  S6: 8, // Nicht einsatzbereit (höchste Priorität - Fahrzeug muss repariert werden)
  S7: 7, // Tanken (sehr wichtig)
  S5: 6, // Sprechwunsch (wichtig für Spieler-Interaktion)
  S4: 5, // Am Einsatzort
  S3: 4, // Unterwegs zum Einsatz
  S8: 3, // Rückkehr
  S2: 2, // An Wache
  S1: 1, // Frei Funk (niedrigste Priorität)
};

/**
 * Prüft ob ein Status-Übergang erlaubt ist
 * @param currentStatus Aktueller Status
 * @param newStatus Gewünschter neuer Status
 * @returns true wenn Übergang erlaubt ist
 */
export function isTransitionAllowed(
  currentStatus: VehicleStatus,
  newStatus: VehicleStatus
): boolean {
  // Gleicher Status ist immer erlaubt (No-Op)
  if (currentStatus === newStatus) return true;

  const allowedStates = ALLOWED_TRANSITIONS[currentStatus];
  return allowedStates.includes(newStatus);
}

/**
 * Gibt eine lesbare Fehlermeldung für ungültige Übergänge zurück
 * @param currentStatus Aktueller Status
 * @param newStatus Gewünschter neuer Status
 * @returns Fehlermeldung
 */
export function getTransitionError(
  currentStatus: VehicleStatus,
  newStatus: VehicleStatus
): string {
  const allowedStates = ALLOWED_TRANSITIONS[currentStatus];
  return `Ungültiger FMS-Übergang: ${currentStatus} → ${newStatus}. Erlaubt sind: ${allowedStates.join(', ')}`;
}

/**
 * Validiert einen Status-Übergang und gibt ein Ergebnis zurück
 * @param currentStatus Aktueller Status
 * @param newStatus Gewünschter neuer Status
 * @param vehicleId Fahrzeug-ID für Logging
 * @returns Validierungsergebnis
 */
export function validateTransition(
  currentStatus: VehicleStatus,
  newStatus: VehicleStatus,
  vehicleId?: number
): { valid: boolean; error?: string; warning?: string } {
  // Gleicher Status → valid aber mit Warning
  if (currentStatus === newStatus) {
    return {
      valid: true,
      warning: `Fahrzeug ${vehicleId || '?'}: Status-Übergang ${currentStatus} → ${newStatus} (No-Op)`,
    };
  }

  // Prüfe ob Übergang erlaubt ist
  const allowed = isTransitionAllowed(currentStatus, newStatus);
  if (!allowed) {
    return {
      valid: false,
      error: vehicleId
        ? `Fahrzeug ${vehicleId}: ${getTransitionError(currentStatus, newStatus)}`
        : getTransitionError(currentStatus, newStatus),
    };
  }

  return { valid: true };
}

/**
 * Löst einen Status-Konflikt auf (z.B. Fahrzeug soll S3 werden aber muss tanken)
 * @param desiredStatus Gewünschter Status
 * @param conflictStatus Status mit höherer Priorität
 * @returns Status der verwendet werden soll
 */
export function resolveStatusConflict(
  desiredStatus: VehicleStatus,
  conflictStatus: VehicleStatus
): VehicleStatus {
  const desiredPriority = STATUS_PRIORITY[desiredStatus];
  const conflictPriority = STATUS_PRIORITY[conflictStatus];

  // Höhere Priorität gewinnt
  return conflictPriority > desiredPriority ? conflictStatus : desiredStatus;
}

/**
 * Gibt alle erlaubten Folge-Status für einen Status zurück
 * @param status Aktueller Status
 * @returns Array erlaubter Folge-Status
 */
export function getAllowedNextStates(status: VehicleStatus): VehicleStatus[] {
  return ALLOWED_TRANSITIONS[status];
}

/**
 * Prüft ob ein Fahrzeug im Einsatz ist (S3, S4, S5, S8)
 * @param status Status des Fahrzeugs
 * @returns true wenn Fahrzeug im Einsatz ist
 */
export function isOnMission(status: VehicleStatus): boolean {
  return ['S3', 'S4', 'S5', 'S8'].includes(status);
}

/**
 * Prüft ob ein Fahrzeug einsatzbereit ist (S1, S2)
 * @param status Status des Fahrzeugs
 * @returns true wenn Fahrzeug einsatzbereit ist
 */
export function isAvailable(status: VehicleStatus): boolean {
  return ['S1', 'S2'].includes(status);
}

/**
 * Prüft ob ein Fahrzeug nicht einsatzbereit ist (S6, S7)
 * @param status Status des Fahrzeugs
 * @returns true wenn Fahrzeug nicht einsatzbereit ist
 */
export function isOutOfService(status: VehicleStatus): boolean {
  return ['S6', 'S7'].includes(status);
}

/**
 * Gibt einen lesbaren Namen für einen Status zurück
 * @param status FMS-Status
 * @returns Deutscher Name des Status
 */
export function getStatusName(status: VehicleStatus): string {
  const names: Record<VehicleStatus, string> = {
    S1: 'Frei auf Funkwache',
    S2: 'Frei auf Wache',
    S3: 'Einsatz übernommen',
    S4: 'Am Einsatzort',
    S5: 'Sprechwunsch',
    S6: 'Nicht einsatzbereit',
    S7: 'Auf Sonderfahrt',
    S8: 'Rückkehr zur Wache',
  };
  return names[status] || status;
}
