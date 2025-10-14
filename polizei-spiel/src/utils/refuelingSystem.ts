import type { Vehicle, GasStation } from '../types';
import { calculateDistance } from '../services/routingService';

/**
 * Tankstellen-System - Automatisches Tanken bei niedrigem Treibstoff
 */

/**
 * Prüft ob Fahrzeug tanken muss
 */
export function shouldRefuel(vehicle: Vehicle): boolean {
  // Tanken wenn Treibstoff unter 15%
  return vehicle.fuelLevel < 15;
}

/**
 * Findet nächste Tankstelle
 */
export function findNearestGasStation(
  vehiclePosition: [number, number],
  gasStations: GasStation[]
): GasStation | null {
  if (gasStations.length === 0) return null;

  let nearest: GasStation | null = null;
  let minDistance = Infinity;

  for (const station of gasStations) {
    const distance = calculateDistance(
      { lat: vehiclePosition[0], lng: vehiclePosition[1] },
      { lat: station.position[0], lng: station.position[1] }
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearest = station;
    }
  }

  return nearest;
}

/**
 * Berechnet Tankdauer in Sekunden
 */
export function calculateRefuelDuration(currentFuelLevel: number, tankCapacity: number): number {
  const fuelToAdd = tankCapacity * (100 - currentFuelLevel) / 100;
  // ~1 Liter pro 2 Sekunden (realistisch)
  return Math.ceil(fuelToAdd * 2);
}

/**
 * Prüft ob Müdigkeit zu hoch ist
 */
export function shouldTakeBreak(vehicle: Vehicle): boolean {
  // Zwangspause wenn Müdigkeit über 90%
  return vehicle.crewFatigue > 90;
}

/**
 * Berechnet Pausendauer basierend auf Müdigkeit
 */
export function calculateBreakDuration(fatigueLevel: number): number {
  // 10-30 Minuten Pause je nach Müdigkeit
  if (fatigueLevel > 95) return 30 * 60; // 30 Min
  if (fatigueLevel > 90) return 20 * 60; // 20 Min
  return 15 * 60; // 15 Min
}

/**
 * Schichtwechsel - Setzt Müdigkeit zurück
 */
export function performShiftChange(vehicle: Vehicle, currentGameTime: number): Vehicle {
  return {
    ...vehicle,
    crewFatigue: 0,
    lastBreakTime: currentGameTime,
    shiftStartTime: currentGameTime,
  };
}
