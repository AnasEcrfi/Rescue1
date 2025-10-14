// Zentralisierte Fahrzeug-Hilfsfunktionen

import type { Vehicle, VehicleStatus, Incident } from '../types';

/**
 * Prüft ob Fahrzeug sich bewegt (unterwegs)
 * @param vehicle - Fahrzeug-Objekt
 * @returns true wenn Fahrzeug in S3 (Anfahrt) oder S8 (Rückfahrt)
 */
export const isVehicleMoving = (vehicle: Vehicle): boolean => {
  return vehicle.status === 'S3' || vehicle.status === 'S8';
};

/**
 * Prüft ob Fahrzeug verfügbar für Zuweisung ist
 * @param vehicle - Fahrzeug-Objekt
 * @returns true wenn in S2 oder S8 mit canBeRedirected
 */
export const isVehicleAvailable = (vehicle: Vehicle): boolean => {
  return vehicle.status === 'S2' || (vehicle.status === 'S8' && vehicle.canBeRedirected);
};

/**
 * Prüft ob Fahrzeug am Einsatzort ist
 * @param vehicle - Fahrzeug-Objekt
 * @returns true wenn in S4
 */
export const isVehicleAtScene = (vehicle: Vehicle): boolean => {
  return vehicle.status === 'S4';
};

/**
 * Prüft ob Fahrzeug an der Wache ist
 * @param vehicle - Fahrzeug-Objekt
 * @returns true wenn in S2
 */
export const isVehicleAtStation = (vehicle: Vehicle): boolean => {
  return vehicle.status === 'S2';
};

/**
 * Prüft ob Fahrzeug einen Sprechwunsch hat
 * @param vehicle - Fahrzeug-Objekt
 * @returns true wenn in S5
 */
export const hasVehicleSpeakRequest = (vehicle: Vehicle): boolean => {
  return vehicle.status === 'S5';
};

/**
 * Prüft ob Fahrzeug außer Dienst ist
 * @param vehicle - Fahrzeug-Objekt
 * @returns true wenn in S6
 */
export const isVehicleOutOfService = (vehicle: Vehicle): boolean => {
  return vehicle.status === 'S6';
};

/**
 * Findet Fahrzeug anhand ID
 * @param vehicles - Array aller Fahrzeuge
 * @param id - Fahrzeug-ID
 * @returns Fahrzeug oder undefined
 */
export const getVehicleById = (vehicles: Vehicle[], id: number): Vehicle | undefined => {
  return vehicles.find(v => v.id === id);
};

/**
 * Filtert Fahrzeuge nach Status
 * @param vehicles - Array aller Fahrzeuge
 * @param status - Gewünschter Status
 * @returns Array gefilterter Fahrzeuge
 */
export const getVehiclesByStatus = (vehicles: Vehicle[], status: VehicleStatus): Vehicle[] => {
  return vehicles.filter(v => v.status === status);
};

/**
 * Findet alle verfügbaren Fahrzeuge
 * @param vehicles - Array aller Fahrzeuge
 * @returns Array verfügbarer Fahrzeuge
 */
export const getAvailableVehicles = (vehicles: Vehicle[]): Vehicle[] => {
  return vehicles.filter(isVehicleAvailable);
};

/**
 * Findet alle bewegenden Fahrzeuge
 * @param vehicles - Array aller Fahrzeuge
 * @returns Array bewegender Fahrzeuge
 */
export const getMovingVehicles = (vehicles: Vehicle[]): Vehicle[] => {
  return vehicles.filter(isVehicleMoving);
};

/**
 * Findet Fahrzeuge die einem Einsatz zugewiesen sind
 * @param vehicles - Array aller Fahrzeuge
 * @param incidentId - Einsatz-ID
 * @returns Array zugewiesener Fahrzeuge
 */
export const getVehiclesByIncident = (vehicles: Vehicle[], incidentId: number): Vehicle[] => {
  return vehicles.filter(v => v.assignedIncidentId === incidentId);
};

/**
 * Prüft ob Fahrzeug einem bestimmten Einsatz zugewiesen ist
 * @param vehicle - Fahrzeug-Objekt
 * @param incidentId - Einsatz-ID
 * @returns true wenn zugewiesen
 */
export const isVehicleAssignedToIncident = (vehicle: Vehicle, incidentId: number): boolean => {
  return vehicle.assignedIncidentId === incidentId;
};

/**
 * Berechnet Fahrzeug-Auslastung (0-100%)
 * @param vehicle - Fahrzeug-Objekt
 * @returns Prozent-Auslastung
 */
export const getVehicleUtilization = (vehicle: Vehicle): number => {
  if (vehicle.status === 'S2') return 0; // Idle
  if (vehicle.status === 'S6') return 0; // Out of service
  return 100; // Active
};

/**
 * Prüft ob Fahrzeug betankt werden muss
 * @param vehicle - Fahrzeug-Objekt
 * @param threshold - Minimaler Tankfüllstand (default: 20%)
 * @returns true wenn Tankfüllstand unter Schwellwert
 */
export const needsRefueling = (vehicle: Vehicle, threshold: number = 20): boolean => {
  return vehicle.fuelLevel < threshold;
};

/**
 * Prüft ob Besatzung müde ist
 * @param vehicle - Fahrzeug-Objekt
 * @param threshold - Maximale Müdigkeit (default: 80%)
 * @returns true wenn Müdigkeit über Schwellwert
 */
export const crewIsFatigued = (vehicle: Vehicle, threshold: number = 80): boolean => {
  return vehicle.crewFatigue > threshold;
};

/**
 * Prüft ob Fahrzeug Wartung benötigt
 * @param vehicle - Fahrzeug-Objekt
 * @returns true wenn maintenanceStatus nicht 'ok'
 */
export const needsMaintenance = (vehicle: Vehicle): boolean => {
  return vehicle.maintenanceStatus !== 'ok';
};

/**
 * Gibt Status-Badge Informationen zurück
 * @param status - Fahrzeug-Status
 * @returns Objekt mit Farbe und Text
 */
export const getStatusBadge = (status: VehicleStatus): { color: string; text: string } => {
  const badges: Record<VehicleStatus, { color: string; text: string }> = {
    'S1': { color: '#8E8E93', text: 'Nicht einsatzbereit' },
    'S2': { color: '#30D158', text: 'Frei auf Wache' },
    'S3': { color: '#FF9F0A', text: 'Anfahrt' },
    'S4': { color: '#FF453A', text: 'Am Einsatzort' },
    'S5': { color: '#0A84FF', text: 'Sprechwunsch' },
    'S6': { color: '#8E8E93', text: 'Nicht einsatzbereit' },
    'S7': { color: '#FFD60A', text: 'Patient an Bord' },
    'S8': { color: '#FFD60A', text: 'Rückfahrt' },
  };

  return badges[status] || { color: '#8E8E93', text: 'Unbekannt' };
};

/**
 * Prüft ob Fahrzeug für Einsatz geeignet ist
 * @param vehicle - Fahrzeug-Objekt
 * @param incident - Einsatz-Objekt
 * @returns true wenn Fahrzeug geeignet und verfügbar
 */
export const canAssignToIncident = (vehicle: Vehicle, incident: Incident): boolean => {
  // Muss verfügbar sein
  if (!isVehicleAvailable(vehicle)) return false;

  // Darf nicht bereits zugewiesen sein
  if (incident.assignedVehicleIds.includes(vehicle.id)) return false;

  // Weitere Checks könnten hier hinzugefügt werden
  // z.B. Spezialausrüstung für bestimmte Einsätze

  return true;
};
