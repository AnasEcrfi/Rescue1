// Zentralisierte Incident-Hilfsfunktionen

import type { Incident, Vehicle } from '../types';

/**
 * Findet Incident anhand ID
 * @param incidents - Array aller Incidents
 * @param id - Incident-ID
 * @returns Incident oder undefined
 */
export const getIncidentById = (incidents: Incident[], id: number): Incident | undefined => {
  return incidents.find(i => i.id === id);
};

/**
 * Prüft ob Incident abgeschlossen ist
 * @param incident - Incident-Objekt
 * @param vehicles - Array aller Fahrzeuge
 * @returns true wenn alle Fahrzeuge in S8 sind
 */
export const isIncidentComplete = (incident: Incident, vehicles: Vehicle[]): boolean => {
  if (incident.arrivedVehicles < incident.requiredVehicles) {
    return false;
  }

  const incidentVehicles = vehicles.filter(v => v.assignedIncidentId === incident.id);
  if (incidentVehicles.length === 0) {
    return false;
  }

  return incidentVehicles.every(v => v.status === 'S8');
};

/**
 * Berechnet Incident-Fortschritt in Prozent
 * @param incident - Incident-Objekt
 * @returns Prozent (0-100)
 */
export const getIncidentProgress = (incident: Incident): number => {
  return Math.floor((incident.arrivedVehicles / incident.requiredVehicles) * 100);
};

/**
 * Gibt Prioritäts-Farbe zurück
 * @param priority - Priorität (low/medium/high)
 * @returns Hex-Farbe
 */
export const getIncidentPriorityColor = (priority: 'low' | 'medium' | 'high'): string => {
  const colors = {
    low: '#FFD60A',
    medium: '#FF9F0A',
    high: '#FF453A',
  };
  return colors[priority];
};

/**
 * Gibt Prioritäts-Text zurück
 * @param priority - Priorität (low/medium/high)
 * @returns Deutsche Bezeichnung
 */
export const getIncidentPriorityText = (priority: 'low' | 'medium' | 'high'): string => {
  const texts = {
    low: 'NIEDRIG',
    medium: 'NORMAL',
    high: 'DRINGEND',
  };
  return texts[priority];
};

/**
 * Prüft ob Incident eskalieren kann
 * @param incident - Incident-Objekt
 * @returns true wenn canEscalate und noch nicht eskaliert
 */
export const canIncidentEscalate = (incident: Incident): boolean => {
  return incident.canEscalate && !incident.hasEscalated;
};

/**
 * Prüft ob Incident-Zeit abgelaufen ist
 * @param incident - Incident-Objekt
 * @returns true wenn timeRemaining <= 0
 */
export const isIncidentExpired = (incident: Incident): boolean => {
  return incident.timeRemaining <= 0;
};

/**
 * Filtert Incidents nach Priorität
 * @param incidents - Array aller Incidents
 * @param priority - Gewünschte Priorität
 * @returns Array gefilterter Incidents
 */
export const getIncidentsByPriority = (
  incidents: Incident[],
  priority: 'low' | 'medium' | 'high'
): Incident[] => {
  return incidents.filter(i => i.priority === priority);
};

/**
 * Findet dringendste Incidents
 * @param incidents - Array aller Incidents
 * @returns Array nach Priorität und Zeit sortiert
 */
export const getMostUrgentIncidents = (incidents: Incident[]): Incident[] => {
  return [...incidents].sort((a, b) => {
    // Erst nach Priorität
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
    if (priorityDiff !== 0) return priorityDiff;

    // Dann nach verbleibender Zeit
    return a.timeRemaining - b.timeRemaining;
  });
};

/**
 * Berechnet durchschnittliche Response-Zeit
 * @param incident - Incident-Objekt
 * @returns Zeit in Sekunden seit Spawn
 */
export const getIncidentResponseTime = (incident: Incident): number => {
  return (Date.now() - incident.spawnTime) / 1000;
};

/**
 * Prüft ob Incident genug Fahrzeuge hat
 * @param incident - Incident-Objekt
 * @returns true wenn genug Fahrzeuge zugewiesen
 */
export const hasEnoughVehicles = (incident: Incident): boolean => {
  return incident.assignedVehicleIds.length >= incident.requiredVehicles;
};

/**
 * Prüft ob Incident mehr Fahrzeuge braucht
 * @param incident - Incident-Objekt
 * @returns true wenn zu wenig Fahrzeuge
 */
export const needsMoreVehicles = (incident: Incident): boolean => {
  return incident.assignedVehicleIds.length < incident.requiredVehicles;
};

/**
 * Berechnet fehlende Fahrzeuge
 * @param incident - Incident-Objekt
 * @returns Anzahl fehlender Fahrzeuge
 */
export const getMissingVehicleCount = (incident: Incident): number => {
  return Math.max(0, incident.requiredVehicles - incident.assignedVehicleIds.length);
};

/**
 * Prüft ob Incident ein MANV ist
 * @param incident - Incident-Objekt
 * @returns true wenn MANV-Flag gesetzt
 */
export const isMANVIncident = (incident: Incident): boolean => {
  return incident.isMANV === true;
};

/**
 * Filtert aktive Incidents (nicht abgeschlossen)
 * @param incidents - Array aller Incidents
 * @param vehicles - Array aller Fahrzeuge
 * @returns Array aktiver Incidents
 */
export const getActiveIncidents = (incidents: Incident[], vehicles: Vehicle[]): Incident[] => {
  return incidents.filter(incident => !isIncidentComplete(incident, vehicles));
};

/**
 * Zählt Incidents nach Typ
 * @param incidents - Array aller Incidents
 * @returns Objekt mit Type → Count Mapping
 */
export const countIncidentsByType = (incidents: Incident[]): Record<string, number> => {
  return incidents.reduce((acc, incident) => {
    acc[incident.type] = (acc[incident.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
};

/**
 * Gibt Incident-Status-Text zurück
 * @param incident - Incident-Objekt
 * @param vehicles - Array aller Fahrzeuge
 * @returns Status-Beschreibung
 */
export const getIncidentStatusText = (incident: Incident, vehicles: Vehicle[]): string => {
  if (isIncidentComplete(incident, vehicles)) {
    return 'Abgeschlossen';
  }
  if (incident.arrivedVehicles >= incident.requiredVehicles) {
    return 'In Bearbeitung';
  }
  if (incident.assignedVehicleIds.length > 0) {
    return 'Fahrzeuge unterwegs';
  }
  return 'Wartet auf Zuweisung';
};
