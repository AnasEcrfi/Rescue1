// Realistische Timing-Funktionen für Fahrzeuge (LST-SIM Style)

import type { Vehicle } from '../types';
import { vehicleTypeConfigs } from '../constants/vehicleTypes';
import {
  FUEL_WARNING_THRESHOLD,
  FUEL_CRITICAL_THRESHOLD,
  FATIGUE_WARNING_THRESHOLD,
  FATIGUE_CRITICAL_THRESHOLD,
  REFUEL_DURATION,
  BREAK_DURATION,
  REPAIR_DURATION_MIN,
  REPAIR_DURATION_MAX,
  SHIFT_DURATION,
  FATIGUE_RATE_PER_HOUR,
  MAINTENANCE_WARNING_KM,
  MAINTENANCE_CRITICAL_KM,
  MAINTENANCE_RANDOM_BREAKDOWN_CHANCE,
} from '../constants/gameplayConstants';

// Berechne Treibstoffverbrauch basierend auf gefahrener Strecke oder Flugzeit
export const calculateFuelConsumption = (
  vehicle: Vehicle,
  distanceKm: number,
  durationHours?: number,
  difficultyMultiplier: number = 1.0 // 🎮 Phase 4: Schwierigkeitsgrad-Multiplikator
): number => {
  const config = vehicleTypeConfigs[vehicle.vehicleType];

  let consumption: number;

  // 🚁 BUG FIX: Hubschrauber verbrauchen basierend auf ZEIT, nicht Distanz
  // Hubschrauber fliegen Luftlinie (kürzere Distanz) aber verbrauchen viel Treibstoff pro Stunde
  if (vehicle.vehicleType === 'Polizeihubschrauber' && durationHours !== undefined) {
    // Hubschrauber: ~200 Liter/Stunde (realistische Verbrauchsrate)
    const HELICOPTER_CONSUMPTION_PER_HOUR = 200; // Liter/Stunde
    consumption = HELICOPTER_CONSUMPTION_PER_HOUR * durationHours;
  } else {
    // Bodenfahrzeuge: Verbrauch basierend auf Distanz
    consumption = config.fuelConsumption * distanceKm;
  }

  // 🎮 Phase 4: Schwierigkeitsgrad-Multiplikator anwenden
  consumption = consumption * difficultyMultiplier;

  // Konvertiere Liter zu Prozent
  const percentageConsumed = (consumption / config.tankCapacity) * 100;

  return percentageConsumed;
};

// Berechne Crew-Fatigue basierend auf Einsatzzeit
export const calculateCrewFatigue = (
  vehicle: Vehicle,
  hoursWorked: number,
  difficultyMultiplier: number = 1.0 // 🎮 Phase 4: Schwierigkeitsgrad-Multiplikator
): number => {
  const config = vehicleTypeConfigs[vehicle.vehicleType];

  // Basis-Fatigue: Aus gameplayConstants (angepasst von 10% auf 5%)
  let fatigue = hoursWorked * FATIGUE_RATE_PER_HOUR;

  // Größere Crews ermüden langsamer (mehr Leute zum Wechseln)
  const crewFactor = config.crewSize / 2; // 2 = Basis
  fatigue = fatigue / crewFactor;

  // 🎮 Phase 4: Schwierigkeitsgrad-Multiplikator anwenden
  fatigue = fatigue * difficultyMultiplier;

  return Math.min(100, fatigue);
};

// Prüfe ob Fahrzeug tanken muss
export const needsRefueling = (vehicle: Vehicle): boolean => {
  return vehicle.fuelLevel <= FUEL_CRITICAL_THRESHOLD;
};

// Prüfe ob Crew Pause braucht
export const needsBreak = (vehicle: Vehicle): boolean => {
  return vehicle.crewFatigue >= FATIGUE_CRITICAL_THRESHOLD;
};

// Prüfe ob Fahrzeug Wartung braucht
export const needsMaintenance = (vehicle: Vehicle): boolean => {
  return vehicle.maintenanceStatus === 'critical';
};

// Bestimme Grund für S6 (Außer Dienst)
export const determineOutOfServiceReason = (vehicle: Vehicle): string | null => {
  if (needsRefueling(vehicle)) return 'Tanken';
  if (needsBreak(vehicle)) return 'Crew-Pause';
  if (needsMaintenance(vehicle)) return 'Reparatur';
  return null;
};

// Berechne S6-Dauer basierend auf Grund
export const calculateOutOfServiceDuration = (
  reason: string,
  gameTime: number
): number => {
  switch (reason) {
    case 'Tanken':
      return gameTime + REFUEL_DURATION;
    case 'Crew-Pause':
      return gameTime + BREAK_DURATION;
    case 'Reparatur':
      const repairTime = REPAIR_DURATION_MIN + Math.random() * (REPAIR_DURATION_MAX - REPAIR_DURATION_MIN);
      return gameTime + repairTime;
    case 'Schichtende':
      return gameTime + SHIFT_DURATION;
    default:
      return gameTime + 10; // Fallback: 10 Minuten
  }
};

// Prüfe ob Schichtwechsel ansteht
export const needsShiftChange = (vehicle: Vehicle, gameTime: number): boolean => {
  const hoursWorked = (gameTime - vehicle.shiftStartTime) / 60;
  const shiftDurationHours = SHIFT_DURATION / 60;
  return hoursWorked >= shiftDurationHours;
};

// Simuliere Wartungszustand-Verschlechterung
export const updateMaintenanceStatus = (
  vehicle: Vehicle,
  distanceKm: number
): 'ok' | 'warning' | 'critical' => {
  const totalKm = vehicle.totalDistanceTraveled + distanceKm;

  // Zufällige Defekte (sehr selten)
  if (Math.random() < MAINTENANCE_RANDOM_BREAKDOWN_CHANCE) {
    return 'critical';
  }

  // Wartungszustand verschlechtert sich mit Kilometerstand
  if (totalKm > MAINTENANCE_WARNING_KM && Math.random() < 0.01) {
    return 'warning';
  }

  if (totalKm > MAINTENANCE_CRITICAL_KM && Math.random() < 0.02) {
    return 'critical';
  }

  return vehicle.maintenanceStatus;
};

// Setze Fahrzeug zurück nach S6
export const resetVehicleAfterService = (
  _vehicle: Vehicle,
  reason: string
): Partial<Vehicle> => {
  const updates: Partial<Vehicle> = {
    outOfServiceReason: null,
    outOfServiceUntil: null,
  };

  switch (reason) {
    case 'Tanken':
      updates.fuelLevel = 100;
      break;
    case 'Crew-Pause':
      updates.crewFatigue = 0;
      break;
    case 'Reparatur':
      updates.maintenanceStatus = 'ok';
      break;
    case 'Schichtende':
      updates.crewFatigue = 0;
      updates.shiftStartTime = 0; // Wird beim nächsten S1 gesetzt
      break;
  }

  return updates;
};

// Get fuel status color
export const getFuelStatusColor = (fuelLevel: number): string => {
  if (fuelLevel <= FUEL_CRITICAL_THRESHOLD) return '#FF453A'; // Rot
  if (fuelLevel <= FUEL_WARNING_THRESHOLD) return '#FF9F0A'; // Orange
  return '#30D158'; // Grün
};

// Get fatigue status color
export const getFatigueStatusColor = (fatigue: number): string => {
  if (fatigue >= FATIGUE_CRITICAL_THRESHOLD) return '#FF453A'; // Rot
  if (fatigue >= FATIGUE_WARNING_THRESHOLD) return '#FF9F0A'; // Orange
  return '#30D158'; // Grün
};

// Get maintenance icon
export const getMaintenanceIcon = (status: 'ok' | 'warning' | 'critical'): string => {
  switch (status) {
    case 'ok': return '✅';
    case 'warning': return '⚠️';
    case 'critical': return '🔧';
  }
};
