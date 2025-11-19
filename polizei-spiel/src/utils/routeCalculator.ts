// ⚠️⚠️⚠️ KRITISCHE DATEI - NICHT ÄNDERN! ⚠️⚠️⚠️
// Diese Datei ist die ORIGINAL-VERSION aus dem ersten Commit (0f18d96)
// Jegliche Änderungen hier brechen das Routing-System!
//
// WICHTIG:
// - calculateStraightRoute() wendet convertToLeafletFormat() auf das Ergebnis an
// - getStraightLineRoute() gibt bereits [lat, lng] zurück
// - calculateRoute() nutzt OSRM für Straßen, Luftlinie für Helis
//
// Bei Problemen: `git show 0f18d96:polizei-spiel/src/utils/routeCalculator.ts`
// ⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️⚠️

// Zentralisierte Route-Berechnungs-Logik

import { getRoute, convertToLeafletFormat, getStraightLineRoute, calculateDistance } from '../services/routingService';
import { routeCache } from './routeCache'; // ⚡ Performance #8: Route-Caching
import type { VehicleType } from '../types';

export interface Position {
  lat: number;
  lng: number;
}

export interface RouteData {
  path: [number, number][];
  distance: number; // in meters
}

/**
 * Berechnet Route zwischen zwei Punkten
 * Nutzt OSRM für Straßenfahrzeuge, Luftlinie für Helikopter
 * Fallback auf Luftlinie wenn OSRM fehlschlägt
 *
 * @param from - Startposition
 * @param to - Zielposition
 * @param isHelicopter - Ob Fahrzeug ein Helikopter ist
 * @returns RouteData mit Pfad und Distanz
 */
export const calculateRoute = async (
  from: Position,
  to: Position,
  isHelicopter: boolean = false
): Promise<RouteData> => {
  const startPos: [number, number] = [from.lat, from.lng];
  const endPos: [number, number] = [to.lat, to.lng];

  // Helikopter fliegen immer Luftlinie (KEINE OSRM Route!)
  if (isHelicopter) {
    console.log('[HELICOPTER] Nutze Luftlinie für Hubschrauber');
    const result = calculateStraightRoute(from, to);
    return result;
  }

  // ⚡ Performance #8: Prüfe Cache zuerst (NUR für Straßenfahrzeuge)
  const cached = routeCache.get(startPos, endPos);
  if (cached) {
    console.log('[ROUTE CACHE HIT] Nutze gecachte Route');
    return {
      path: cached.route,
      distance: cached.distance,
    };
  }

  // Versuche OSRM für Straßenroute
  console.log('[OSRM] Berechne neue Route via OSRM...');
  try {
    const osrmRoute = await getRoute(from, to);

    if (osrmRoute && osrmRoute.coordinates && osrmRoute.distance) {
      const path = convertToLeafletFormat(osrmRoute.coordinates);

      console.log(`[OSRM SUCCESS] Route berechnet: ${path.length} Punkte, ${(osrmRoute.distance / 1000).toFixed(2)}km`);

      // ⚡ Performance #8: Speichere im Cache
      routeCache.set(startPos, endPos, path, osrmRoute.duration || 0, osrmRoute.distance);

      return {
        path,
        distance: osrmRoute.distance,
      };
    } else {
      console.warn('[OSRM] Keine Daten von OSRM erhalten - Route oder Coordinates fehlen');
    }
  } catch (error) {
    console.error('[OSRM ERROR] Route fehlgeschlagen:', error);
  }

  // Fallback: Luftlinie
  console.log('[FALLBACK] Nutze Luftlinie als Fallback');
  const result = calculateStraightRoute(from, to);
  routeCache.set(startPos, endPos, result.path, 0, result.distance);
  return result;
};

/**
 * Berechnet Luftlinien-Route zwischen zwei Punkten
 * @param from - Startposition
 * @param to - Zielposition
 * @param points - Anzahl der Zwischenpunkte (default: 30)
 * @returns RouteData mit Pfad und Distanz
 */
export const calculateStraightRoute = (
  from: Position,
  to: Position,
  points: number = 30
): RouteData => {
  const straightRoute = getStraightLineRoute(from, to, points);
  const distance = calculateDistance(from, to);

  return {
    path: convertToLeafletFormat(straightRoute),
    distance,
  };
};

/**
 * Konvertiert Position-Array in Leaflet-Format
 * @param lat - Breitengrad
 * @param lng - Längengrad
 * @returns Position als [lat, lng] Tuple
 */
export const toLeafletPosition = (lat: number, lng: number): [number, number] => {
  return [lat, lng];
};

/**
 * Konvertiert Leaflet Position zu Position-Objekt
 * @param position - Position als [lat, lng] Tuple
 * @returns Position-Objekt mit lat/lng
 */
export const fromLeafletPosition = (position: [number, number]): Position => {
  return {
    lat: position[0],
    lng: position[1],
  };
};

/**
 * Prüft ob Fahrzeugtyp Luftlinien-Route nutzt
 * @param vehicleType - Typ des Fahrzeugs
 * @returns true wenn Luftlinie, false wenn Straße
 */
export const usesAirRoute = (vehicleType: VehicleType): boolean => {
  return vehicleType === 'Polizeihubschrauber';
};
