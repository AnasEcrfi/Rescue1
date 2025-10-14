/**
 * Vehicle Positioning Utilities
 * Handles visual offset for vehicles at the same location to prevent overlapping
 */

import type { Vehicle } from '../types';

/**
 * Calculates if two positions are at the same location (within threshold)
 */
export const arePositionsEqual = (
  pos1: [number, number],
  pos2: [number, number],
  threshold: number = 0.0001 // ~10 meters
): boolean => {
  return (
    Math.abs(pos1[0] - pos2[0]) < threshold &&
    Math.abs(pos1[1] - pos2[1]) < threshold
  );
};

/**
 * Calculates visual offset for vehicles at the same position
 * Creates a circular pattern around the original position
 */
export const calculateVehicleOffset = (
  vehicle: Vehicle,
  allVehicles: Vehicle[],
  radius: number = 0.0002 // ~20 meters visual offset
): [number, number] => {
  // Find all vehicles at the same position
  const vehiclesAtSamePosition = allVehicles.filter(v =>
    v.id !== vehicle.id &&
    arePositionsEqual(v.position, vehicle.position)
  );

  // If no other vehicles at same position, no offset needed
  if (vehiclesAtSamePosition.length === 0) {
    return vehicle.position;
  }

  // Sort vehicles by ID to ensure consistent positioning
  const sortedVehicles = [vehicle, ...vehiclesAtSamePosition].sort((a, b) => a.id - b.id);
  const index = sortedVehicles.findIndex(v => v.id === vehicle.id);
  const totalVehicles = sortedVehicles.length;

  // Calculate angle for circular arrangement
  const angle = (2 * Math.PI * index) / totalVehicles;

  // Calculate offset position
  const offsetLat = vehicle.position[0] + radius * Math.cos(angle);
  const offsetLng = vehicle.position[1] + radius * Math.sin(angle);

  return [offsetLat, offsetLng];
};

/**
 * Get offset position for vehicle considering status
 * Vehicles at stations (S2) get circular offset
 * Vehicles at incident location (S4) get circular offset
 * Vehicles in transit (S3, S8) use their actual position
 */
export const getDisplayPosition = (
  vehicle: Vehicle,
  allVehicles: Vehicle[],
  policeStations: Array<{ id: number; position: [number, number] }>
): [number, number] => {
  // Only apply offset for stationary vehicles
  const stationaryStatuses: Array<Vehicle['status']> = ['S2', 'S4', 'S5', 'S6', 'S7'];

  if (!stationaryStatuses.includes(vehicle.status)) {
    return vehicle.position; // Moving vehicles use actual position
  }

  // For S2 (at station), check if at station position
  if (vehicle.status === 'S2') {
    const station = policeStations.find(s => s.id === vehicle.stationId);
    if (station && arePositionsEqual(vehicle.position, station.position)) {
      // Apply offset for vehicles at station
      return calculateVehicleOffset(vehicle, allVehicles, 0.0003); // Slightly larger offset at station
    }
  }

  // For S4, S5, S6, S7 (at incident or stationary), apply offset
  return calculateVehicleOffset(vehicle, allVehicles);
};

/**
 * Groups vehicles by their position (for UI display)
 */
export const groupVehiclesByPosition = (
  vehicles: Vehicle[]
): Map<string, Vehicle[]> => {
  const groups = new Map<string, Vehicle[]>();

  vehicles.forEach(vehicle => {
    const key = `${vehicle.position[0].toFixed(4)},${vehicle.position[1].toFixed(4)}`;
    if (!groups.has(key)) {
      groups.set(key, []);
    }
    groups.get(key)!.push(vehicle);
  });

  return groups;
};

/**
 * Get count of vehicles at the same position
 */
export const getVehiclesAtPosition = (
  position: [number, number],
  allVehicles: Vehicle[]
): Vehicle[] => {
  return allVehicles.filter(v => arePositionsEqual(v.position, position));
};
