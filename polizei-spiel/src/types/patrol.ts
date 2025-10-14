/**
 * 🚔 STREIFENFAHRT-SYSTEM (Patrol System)
 *
 * Type definitions für das realistische Streifenfahrt-System.
 * Polizeifahrzeuge können proaktive Präsenzstreifen fahren,
 * um Kriminalität zu reduzieren und schneller auf Einsätze reagieren zu können.
 */

// ============================================================================
// PATROL TYPES
// ============================================================================

/**
 * Typen von Streifenfahrten
 */
export type PatrolType =
  | 'standard'      // Normale Präsenzstreife (ausgewogen)
  | 'hotspot'       // Kriminalitätsschwerpunkt (gezielt)
  | 'random'        // Zufallsstreife (unvorhersehbar)
  | 'district'      // Revierbezogene Streife (gesamtes Gebiet)
  | 'nightwatch';   // Nachtstreife (spezielle Route)

/**
 * Streifenroute mit Waypoints
 */
export interface PatrolRoute {
  id: string;
  type: PatrolType;
  waypoints: [number, number][]; // Lat/Lng Koordinaten (Zielpunkte)
  fullRoute: [number, number][]; // Komplette Straßenroute (für Anzeige)
  currentWaypointIndex: number; // Aktueller Waypoint
  speed: number; // Durchschnittsgeschwindigkeit in km/h
  duration: number; // Gesamtdauer in Minuten
  startTime: number; // Start-Zeit (gameTime)
  pausePoints: number[]; // Indices von Waypoints wo pausiert wird
  repeatCount: number; // Wie oft Route wiederholen (0 = unendlich)
  currentRepeat: number; // Aktuelle Wiederholung
  areaId: string; // 🎯 ID des Gebiets (für Gebiets-Treue bei Random Patrol)
  areaName: string; // Name des Gebiets (z.B. "Innenstadt")
}

/**
 * Streifengebiet/Revier
 */
export interface PatrolArea {
  id: string;
  name: string; // z.B. "Innenstadt", "Bahnhofsviertel"
  center: [number, number]; // Mittelpunkt
  radius: number; // Radius in km
  priority: 'low' | 'medium' | 'high'; // Kriminalitätslage
  activeHours: [number, number] | null; // Aktive Stunden [start, end] oder null = immer
  incidentTypes: string[]; // Typische Delikte in diesem Gebiet
  points: [number, number][]; // Interessante Punkte für Waypoints
  description: string; // Beschreibung des Gebiets
}

/**
 * Zufallsentdeckung während Streifenfahrt
 */
export interface PatrolDiscovery {
  id: string;
  vehicleId: number;
  type: string; // Einsatztyp (z.B. "Verdächtige Person")
  position: [number, number];
  priority: 'low' | 'medium' | 'high';
  description: string;
  timestamp: number; // gameTime
  discoveryMethod: 'observation' | 'radio' | 'witness'; // Wie entdeckt
}

/**
 * Statistiken für Streifenfahrten
 */
export interface PatrolStatistics {
  totalPatrolsCompleted: number; // Abgeschlossene Streifen
  totalPatrolTime: number; // Gesamte Zeit auf Streife (Minuten)
  totalDiscoveries: number; // Gesamt-Entdeckungen
  discoveriesByType: { [type: string]: number }; // Entdeckungen nach Typ
  totalDistancePatrolled: number; // Gesamt-Distanz (km)
  currentActivePatrols: number; // Aktuell aktive Streifen
}

// ============================================================================
// HELPER TYPES
// ============================================================================

/**
 * Patrol State für Vehicle
 * (Wird in Vehicle Type integriert)
 */
export interface VehiclePatrolState {
  isOnPatrol: boolean; // Aktuell auf Streife
  patrolRoute: PatrolRoute | null; // Aktuelle Route
  routeProgress: number; // Fortschritt zur nächsten Waypoint (0-1)
  nextWaypointETA: number; // ETA zur nächsten Waypoint (Sekunden)
  totalPatrolDistance: number; // Bisherige Distanz dieser Streife (km)
  lastDiscoveryCheck: number; // Letzte Discovery-Prüfung (gameTime)
}

/**
 * Patrol Settings (für Gameplay-Balance)
 */
export interface PatrolSettings {
  discoveryChance: number; // Basis-Chance für Discoveries (0-1)
  presenceBonus: number; // Kriminalitätsreduktion durch Präsenz (0-1)
  fuelConsumptionMultiplier: number; // Treibstoffverbrauch-Multiplikator (Standard: 0.7)
  fatigueMultiplier: number; // Müdigkeits-Multiplikator (Standard: 0.5)
  minFuelToPatrol: number; // Mindest-Treibstoff für Streife (%)
  maxFatigueToPatrol: number; // Maximale Müdigkeit für Streife (%)
  autoResumeAfterIncident: boolean; // Auto-Resume nach Einsatz
}
