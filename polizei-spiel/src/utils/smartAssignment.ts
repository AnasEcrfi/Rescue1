import type { Vehicle, Incident } from '../types';
import { vehicleTypeConfigs } from '../constants/vehicleTypes';
import { calculateDistance } from '../services/routingService';
import {
  SMART_ASSIGNMENT_BASE_SCORE,
  SMART_ASSIGNMENT_MIN_SCORE,
  SMART_ASSIGNMENT_WRONG_TYPE_PENALTY,
  SMART_ASSIGNMENT_DISTANCE_FAR_PENALTY,
  SMART_ASSIGNMENT_DISTANCE_MEDIUM_PENALTY,
  SMART_ASSIGNMENT_DISTANCE_NEAR_PENALTY,
  SMART_ASSIGNMENT_FUEL_CRITICAL_PENALTY,
  SMART_ASSIGNMENT_FUEL_LOW_PENALTY,
  SMART_ASSIGNMENT_FUEL_INSUFFICIENT_PENALTY,
  SMART_ASSIGNMENT_FATIGUE_CRITICAL_PENALTY,
  SMART_ASSIGNMENT_FATIGUE_HIGH_PENALTY,
  SMART_ASSIGNMENT_FATIGUE_MEDIUM_PENALTY,
  SMART_ASSIGNMENT_HIGH_PRIORITY_BONUS,
  SMART_ASSIGNMENT_MAINTENANCE_CRITICAL_PENALTY,
  SMART_ASSIGNMENT_MAINTENANCE_WARNING_PENALTY,
  DISTANCE_NEAR,
  DISTANCE_MEDIUM,
  DISTANCE_FAR,
  FUEL_CRITICAL_THRESHOLD,
  FUEL_LOW_THRESHOLD,
  FATIGUE_CRITICAL_THRESHOLD,
} from '../constants/gameplayConstants';

/**
 * Smart Assignment System - Intelligente Fahrzeugzuweisung
 * Berücksichtigt: Treibstoff, Müdigkeit, Eignung, Entfernung, Priorität
 */

export interface VehicleSuitability {
  vehicleId: number;
  score: number; // 0-100, höher = besser geeignet
  distance: number;
  fuelLevel: number;
  fatigueLevel: number;
  isSuitable: boolean;
  reasons: string[]; // Warum geeignet/nicht geeignet
}

/**
 * Bewertet ein Fahrzeug für einen Einsatz
 */
export function evaluateVehicleSuitability(
  vehicle: Vehicle,
  incident: Incident
): VehicleSuitability {
  const config = vehicleTypeConfigs[vehicle.vehicleType];
  const reasons: string[] = [];
  let score = SMART_ASSIGNMENT_BASE_SCORE;

  // 1. VERFÜGBARKEIT prüfen
  const isAvailable = vehicle.status === 'S1' || (vehicle.status === 'S8' && vehicle.canBeRedirected);
  if (!isAvailable) {
    return {
      vehicleId: vehicle.id,
      score: 0,
      distance: 0,
      fuelLevel: vehicle.fuelLevel,
      fatigueLevel: vehicle.crewFatigue,
      isSuitable: false,
      reasons: ['Fahrzeug nicht verfügbar'],
    };
  }

  // 2. FAHRZEUGTYP-EIGNUNG prüfen
  const typeIsAppropriate = config.suitableFor.includes(incident.type);
  if (!typeIsAppropriate) {
    score -= SMART_ASSIGNMENT_WRONG_TYPE_PENALTY;
    reasons.push(`Nicht optimal für ${incident.type}`);
  } else {
    reasons.push(`Geeignet für ${incident.type}`);
  }

  // 3. ENTFERNUNG berechnen
  const distance = calculateDistance(
    { lat: vehicle.position[0], lng: vehicle.position[1] },
    { lat: incident.position[0], lng: incident.position[1] }
  );
  const distanceKm = distance / 1000;

  // Entfernungs-Score: Je näher, desto besser
  // Verwendet Konstanten aus gameplayConstants
  if (distanceKm > DISTANCE_FAR) {
    score -= SMART_ASSIGNMENT_DISTANCE_FAR_PENALTY;
    reasons.push(`Sehr weit entfernt (${distanceKm.toFixed(1)} km)`);
  } else if (distanceKm > DISTANCE_MEDIUM) {
    score -= SMART_ASSIGNMENT_DISTANCE_MEDIUM_PENALTY;
    reasons.push(`Weit entfernt (${distanceKm.toFixed(1)} km)`);
  } else if (distanceKm > DISTANCE_NEAR) {
    score -= SMART_ASSIGNMENT_DISTANCE_NEAR_PENALTY;
  } else {
    reasons.push(`Sehr nah (${distanceKm.toFixed(1)} km)`);
  }

  // 4. TREIBSTOFF prüfen
  // Schätze benötigten Treibstoff: Hin + Einsatz + Zurück
  const estimatedDistanceTotal = distanceKm * 2 + 5; // +5km Puffer
  const estimatedFuelNeeded = (estimatedDistanceTotal * config.fuelConsumption) / 100;
  const currentFuelLiters = (vehicle.fuelLevel / 100) * config.tankCapacity;
  const fuelSufficient = currentFuelLiters >= estimatedFuelNeeded * 1.2; // 20% Sicherheits-Puffer

  if (vehicle.fuelLevel < FUEL_CRITICAL_THRESHOLD) {
    score -= SMART_ASSIGNMENT_FUEL_CRITICAL_PENALTY;
    reasons.push(`⚠️ KRITISCH: Nur ${vehicle.fuelLevel.toFixed(0)}% Treibstoff`);
  } else if (vehicle.fuelLevel < FUEL_LOW_THRESHOLD) {
    score -= SMART_ASSIGNMENT_FUEL_LOW_PENALTY;
    reasons.push(`Niedriger Treibstoff (${vehicle.fuelLevel.toFixed(0)}%)`);
  } else if (!fuelSufficient) {
    score -= SMART_ASSIGNMENT_FUEL_INSUFFICIENT_PENALTY;
    reasons.push(`Treibstoff könnte knapp werden`);
  }

  // 5. MÜDIGKEIT prüfen
  if (vehicle.crewFatigue > FATIGUE_CRITICAL_THRESHOLD) {
    score -= SMART_ASSIGNMENT_FATIGUE_CRITICAL_PENALTY;
    reasons.push(`⚠️ KRITISCH: Besatzung übermüdet (${vehicle.crewFatigue.toFixed(0)}%)`);
  } else if (vehicle.crewFatigue > 80) {
    score -= SMART_ASSIGNMENT_FATIGUE_HIGH_PENALTY;
    reasons.push(`Besatzung sehr müde (${vehicle.crewFatigue.toFixed(0)}%)`);
  } else if (vehicle.crewFatigue > 60) {
    score -= SMART_ASSIGNMENT_FATIGUE_MEDIUM_PENALTY;
    reasons.push(`Besatzung müde (${vehicle.crewFatigue.toFixed(0)}%)`);
  }

  // 6. PRIORITÄTS-BONUS: Bei high-priority Einsätzen weniger streng
  if (incident.priority === 'high') {
    score += SMART_ASSIGNMENT_HIGH_PRIORITY_BONUS;
    reasons.push('🚨 Hohe Priorität - schnelle Reaktion wichtig');
  }

  // 7. WARTUNGSSTATUS prüfen
  if (vehicle.maintenanceStatus === 'critical') {
    score -= SMART_ASSIGNMENT_MAINTENANCE_CRITICAL_PENALTY;
    reasons.push('⚠️ Wartung kritisch');
  } else if (vehicle.maintenanceStatus === 'warning') {
    score -= SMART_ASSIGNMENT_MAINTENANCE_WARNING_PENALTY;
    reasons.push('Wartung fällig');
  }

  // Score normalisieren (min 0, max 100)
  score = Math.max(0, Math.min(SMART_ASSIGNMENT_BASE_SCORE, score));

  // Fahrzeug ist geeignet wenn Score > MIN_SCORE
  const isSuitable = score > SMART_ASSIGNMENT_MIN_SCORE;

  return {
    vehicleId: vehicle.id,
    score,
    distance,
    fuelLevel: vehicle.fuelLevel,
    fatigueLevel: vehicle.crewFatigue,
    isSuitable,
    reasons,
  };
}

/**
 * Findet die besten Fahrzeuge für einen Einsatz
 */
export function findBestVehicles(
  vehicles: Vehicle[],
  incident: Incident,
  count: number = 1
): VehicleSuitability[] {
  // Bewerte alle Fahrzeuge
  const evaluations = vehicles.map(v => evaluateVehicleSuitability(v, incident));

  // Filtere geeignete Fahrzeuge und sortiere nach Score
  const suitable = evaluations
    .filter(e => e.isSuitable)
    .sort((a, b) => b.score - a.score);

  // Gib die besten N Fahrzeuge zurück
  return suitable.slice(0, count);
}

/**
 * Automatische Zuweisung: Findet und weist beste Fahrzeuge zu
 */
export function getAutoAssignmentRecommendations(
  vehicles: Vehicle[],
  incident: Incident
): {
  recommended: VehicleSuitability[];
  warnings: string[];
} {
  const warnings: string[] = [];
  const requiredCount = incident.requiredVehicles || 1;

  // Finde beste Fahrzeuge
  const recommended = findBestVehicles(vehicles, incident, requiredCount);

  // Warnungen generieren
  if (recommended.length === 0) {
    warnings.push('⚠️ Keine geeigneten Fahrzeuge verfügbar!');
  } else if (recommended.length < requiredCount) {
    warnings.push(`⚠️ Nur ${recommended.length} von ${requiredCount} benötigten Fahrzeugen verfügbar`);
  }

  // Überprüfe ob empfohlene Fahrzeuge Probleme haben
  recommended.forEach(rec => {
    if (rec.score < 60) {
      warnings.push(`Fahrzeug ${rec.vehicleId}: Score nur ${rec.score.toFixed(0)}/100`);
    }
    if (rec.fuelLevel < 25) {
      warnings.push(`Fahrzeug ${rec.vehicleId}: Niedriger Treibstoff (${rec.fuelLevel.toFixed(0)}%)`);
    }
    if (rec.fatigueLevel > 75) {
      warnings.push(`Fahrzeug ${rec.vehicleId}: Besatzung müde (${rec.fatigueLevel.toFixed(0)}%)`);
    }
  });

  return { recommended, warnings };
}
