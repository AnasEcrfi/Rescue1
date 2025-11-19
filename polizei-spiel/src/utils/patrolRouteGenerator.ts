/**
 * 🚔 PATROL ROUTE GENERATOR
 *
 * Generiert intelligente Streifenrouten basierend auf:
 * - Patrol Area (Gebiet)
 * - Tageszeit
 * - Wetter
 * - Kriminalitätslage
 */

import type { PatrolRoute, PatrolArea, PatrolType } from '../types/patrol';
import type { WeatherType } from '../types';
import { frankfurtPatrolAreas, getRandomPatrolArea, getActivePatrolAreas } from '../constants/patrolAreas';
import {
  PATROL_DURATION_MIN,
  PATROL_DURATION_MAX,
  PATROL_SPEED_BASE,
  PATROL_SPEED_NIGHT,
  PATROL_SPEED_HOTSPOT,
  PATROL_SPEED_WEATHER_FACTOR,
  PATROL_MIN_WAYPOINTS,
  PATROL_MAX_WAYPOINTS,
  PATROL_PAUSE_POINT_CHANCE,
  PATROL_DEFAULT_REPEAT_COUNT,
} from '../constants/patrolConstants';
import { calculateRoute } from './routeCalculator';

// ============================================================================
// ROUTE GENERATION
// ============================================================================

/**
 * Generiert eine komplette Streifenroute
 * @param vehiclePosition - Aktuelle Position des Fahrzeugs (wird als Startpunkt verwendet!)
 * @param gameTime - Aktuelle Spielzeit
 * @param hour - Aktuelle Stunde
 * @param weather - Aktuelles Wetter
 * @param type - Optional: Patrol-Typ (standard, hotspot, etc.)
 * @param areaId - Optional: Spezifische Area-ID (überschreibt automatische Auswahl)
 */
export async function generatePatrolRoute(
  vehiclePosition: [number, number],
  gameTime: number,
  hour: number,
  weather: WeatherType,
  type?: PatrolType,
  areaId?: string
): Promise<PatrolRoute> {
  console.log(`[PATROL GENERATOR] Generiere Route von Position [${vehiclePosition[0].toFixed(4)}, ${vehiclePosition[1].toFixed(4)}]`);

  // 1. Wähle Patrol Area (entweder spezifische oder smart selection)
  const area = areaId
    ? frankfurtPatrolAreas.find(a => a.id === areaId) || selectPatrolArea(hour, type)
    : selectPatrolArea(hour, type);

  console.log(`[PATROL GENERATOR] Gebiet: ${area.name} (${area.id})`);

  // 2. Bestimme Patrol Type (falls nicht vorgegeben)
  const patrolType = type || determinePatrolType(area, hour);

  // 3. Generiere Waypoints (inkl. vehiclePosition als Start!)
  const waypoints = generateWaypoints(area, vehiclePosition, patrolType);

  console.log(`[PATROL GENERATOR] ${waypoints.length} Waypoints generiert, Start: [${waypoints[0][0].toFixed(4)}, ${waypoints[0][1].toFixed(4)}]`);

  // 4. Berechne komplette Straßenroute zwischen allen Waypoints
  // WICHTIG: Diese Route startet an vehiclePosition (waypoints[0])!
  const fullRoute = await generateFullStreetRoute(waypoints);

  console.log(`[PATROL GENERATOR] FullRoute erstellt: ${fullRoute.length} Punkte, Start: [${fullRoute[0][0].toFixed(4)}, ${fullRoute[0][1].toFixed(4)}]`);

  // 5. Bestimme Geschwindigkeit
  const speed = calculatePatrolSpeed(patrolType, hour, weather);

  // 6. Berechne Dauer
  const duration = calculatePatrolDuration(patrolType, waypoints.length);

  // 7. Bestimme Pause-Punkte
  const pausePoints = determinePausePoints(waypoints.length);

  // 8. Erstelle Route
  const route: PatrolRoute = {
    id: `patrol_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type: patrolType,
    waypoints,
    fullRoute,
    currentWaypointIndex: 0, // ✅ Start bei 0, weil fullRoute[0] = vehiclePosition
    speed,
    duration,
    startTime: gameTime,
    pausePoints,
    repeatCount: PATROL_DEFAULT_REPEAT_COUNT,
    currentRepeat: 0,
    areaId: area.id, // 🎯 Gebiet-ID speichern
    areaName: area.name,
  };

  return route;
}

// ============================================================================
// STREET ROUTE GENERATION
// ============================================================================

/**
 * Berechnet komplette Straßenroute zwischen allen Waypoints
 * 🎲 RANDOM PATROL: Offene Route (nicht geschlossen), neue Route wird danach generiert
 */
async function generateFullStreetRoute(waypoints: [number, number][]): Promise<[number, number][]> {
  console.log(`[PATROL] Berechne Straßenroute für ${waypoints.length} Waypoints (offene Route)...`);

  const fullRoute: [number, number][] = [];

  // Für jeden Waypoint-Übergang eine Route berechnen
  // KEINE geschlossene Schleife - Route endet am letzten Waypoint
  for (let i = 0; i < waypoints.length - 1; i++) {
    const from = { lat: waypoints[i][0], lng: waypoints[i][1] };
    const to = { lat: waypoints[i + 1][0], lng: waypoints[i + 1][1] };

    // 🐌 RATE LIMITING: Kurze Pause zwischen Requests (200ms)
    // Verhindert, dass OSRM API uns blockt
    if (i > 0) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    try {
      const routeData = await calculateRoute(from, to, false);

      // 🔍 DEBUG: Prüfe Format der Route
      if (routeData.path.length > 0) {
        const firstPoint = routeData.path[0];
        // Frankfurt: lat ~50, lng ~8-9
        // Wenn firstPoint[0] < 20, dann ist es vermutlich [lng, lat] statt [lat, lng]
        if (firstPoint[0] < 20 && firstPoint[1] > 40) {
          console.warn(`[PATROL] ⚠️ Route hat falsches Format [lng, lat], korrigiere zu [lat, lng]`);
          // Vertausche alle Koordinaten
          routeData.path = routeData.path.map(([a, b]) => [b, a] as [number, number]);
        }
      }

      // Füge die Route hinzu (ohne den letzten Punkt, um Duplikate zu vermeiden)
      if (i === 0) {
        // Beim ersten Segment alle Punkte hinzufügen
        fullRoute.push(...routeData.path);
      } else {
        // Bei folgenden Segmenten ersten Punkt überspringen (ist bereits vorhanden)
        fullRoute.push(...routeData.path.slice(1));
      }

      console.log(`[PATROL] Segment ${i+1}/${waypoints.length-1}: ${routeData.path.length} Punkte`);
    } catch (error) {
      console.warn(`[PATROL] Fehler bei Segment ${i+1}, nutze Luftlinie:`, error);
      // Fallback: Luftlinie zwischen den Punkten
      if (i === 0) {
        fullRoute.push(waypoints[i]);
      }
      fullRoute.push(waypoints[i + 1]);
    }
  }

  console.log(`[PATROL] ✓ Straßenroute erstellt: ${fullRoute.length} Punkte gesamt`);
  return fullRoute;
}

// ============================================================================
// AREA SELECTION
// ============================================================================

/**
 * Wählt intelligente Patrol Area basierend auf Kontext
 */
function selectPatrolArea(hour: number, type?: PatrolType): PatrolArea {
  // Spezialfall: Hotspot-Streife → nur high-priority Gebiete
  if (type === 'hotspot') {
    const hotspots = frankfurtPatrolAreas.filter(area => area.priority === 'high');
    return hotspots[Math.floor(Math.random() * hotspots.length)];
  }

  // Spezialfall: Nachtstreife → nachts aktive Gebiete
  if (type === 'nightwatch') {
    const nightAreas = getActivePatrolAreas(hour).filter(area =>
      area.activeHours && area.activeHours[0] > area.activeHours[1] // Overnight
    );
    if (nightAreas.length > 0) {
      return nightAreas[Math.floor(Math.random() * nightAreas.length)];
    }
  }

  // Standard: Gewichtete Zufallsauswahl
  return getRandomPatrolArea(hour);
}

/**
 * Bestimmt Patrol Type basierend auf Area und Zeit
 */
function determinePatrolType(area: PatrolArea, hour: number): PatrolType {
  // Nacht (22-6 Uhr) → Nachtstreife
  if (hour >= 22 || hour < 6) {
    return 'nightwatch';
  }

  // High-Priority Area → Hotspot-Streife (50% Chance)
  if (area.priority === 'high' && Math.random() < 0.5) {
    return 'hotspot';
  }

  // Zufalls-Streife (20% Chance)
  if (Math.random() < 0.2) {
    return 'random';
  }

  // Standard-Streife
  return 'standard';
}

// ============================================================================
// WAYPOINT GENERATION
// ============================================================================

/**
 * Generiert Waypoints für die Route
 */
function generateWaypoints(
  area: PatrolArea,
  vehiclePosition: [number, number],
  type: PatrolType
): [number, number][] {
  const waypoints: [number, number][] = [];

  // Start: Aktuelle Fahrzeugposition
  waypoints.push(vehiclePosition);

  // Anzahl Waypoints basierend auf Type
  let waypointCount: number;
  switch (type) {
    case 'hotspot':
      waypointCount = Math.floor(Math.random() * 3) + 4; // 4-6 Waypoints (kürzere Route)
      break;
    case 'nightwatch':
      waypointCount = Math.floor(Math.random() * 2) + 6; // 6-7 Waypoints (längere Route)
      break;
    case 'random':
      waypointCount = Math.floor(Math.random() * 4) + 5; // 5-8 Waypoints
      break;
    default:
      waypointCount = Math.floor(Math.random() * 3) + 5; // 5-7 Waypoints
  }

  // Begrenze auf MIN/MAX
  waypointCount = Math.max(PATROL_MIN_WAYPOINTS, Math.min(PATROL_MAX_WAYPOINTS, waypointCount));

  // Random: Nutze vordefinierte Points aus Area
  if (type === 'random') {
    // Mische die Points
    const shuffledPoints = [...area.points].sort(() => Math.random() - 0.5);
    // Nimm die ersten N Points
    const selectedPoints = shuffledPoints.slice(0, waypointCount - 1);
    waypoints.push(...selectedPoints);
  } else {
    // Standard/Hotspot/Nightwatch: Nutze Points in Reihenfolge
    // Aber mit leichter Variation für Abwechslung
    const pointsToUse = Math.min(waypointCount - 1, area.points.length);

    if (type === 'hotspot') {
      // Hotspot: Fokussiere auf zentrale Points
      const centerPoints = area.points.slice(0, pointsToUse);
      waypoints.push(...centerPoints);
    } else {
      // Standard/Nightwatch: Alle Points verwenden
      // Mit kleiner Zufalls-Variation
      for (let i = 0; i < pointsToUse; i++) {
        const point = area.points[i];
        // Füge kleine Variation hinzu (±50m)
        const variation = 0.0005; // ~50m
        const variedPoint: [number, number] = [
          point[0] + (Math.random() - 0.5) * variation,
          point[1] + (Math.random() - 0.5) * variation,
        ];
        waypoints.push(variedPoint);
      }
    }
  }

  // Ende: Zurück zur Wache (optional, für Rundroute)
  // Für jetzt: Letzter Waypoint ist Ende der Route
  // (Fahrzeug könnte dort pausieren oder neue Route starten)

  return waypoints;
}

// ============================================================================
// SPEED CALCULATION
// ============================================================================

/**
 * Berechnet Streifengeschwindigkeit
 */
function calculatePatrolSpeed(
  type: PatrolType,
  hour: number,
  weather: WeatherType
): number {
  let speed: number;

  // Basis-Geschwindigkeit nach Type
  switch (type) {
    case 'hotspot':
      speed = PATROL_SPEED_HOTSPOT; // Langsam (intensive Beobachtung)
      break;
    case 'nightwatch':
      speed = PATROL_SPEED_NIGHT; // Langsam (Nacht)
      break;
    default:
      speed = PATROL_SPEED_BASE; // Standard
  }

  // Nacht-Anpassung (falls nicht schon Nightwatch)
  if (type !== 'nightwatch' && (hour >= 22 || hour < 6)) {
    speed *= 0.9; // 10% langsamer nachts
  }

  // Wetter-Anpassung
  if (weather === 'rainy' || weather === 'snowy' || weather === 'foggy') {
    speed *= PATROL_SPEED_WEATHER_FACTOR;
  }

  return Math.round(speed);
}

// ============================================================================
// DURATION CALCULATION
// ============================================================================

/**
 * Berechnet Streifendauer basierend auf Type und Waypoints
 */
function calculatePatrolDuration(type: PatrolType, waypointCount: number): number {
  let baseDuration: number;

  switch (type) {
    case 'hotspot':
      baseDuration = PATROL_DURATION_MIN; // Kürzere Hotspot-Streifen
      break;
    case 'nightwatch':
      baseDuration = PATROL_DURATION_MAX; // Längere Nachtstreifen
      break;
    default:
      // Random zwischen MIN und MAX
      baseDuration = PATROL_DURATION_MIN + Math.random() * (PATROL_DURATION_MAX - PATROL_DURATION_MIN);
  }

  // Anpassung basierend auf Waypoint-Anzahl
  // Mehr Waypoints = tendenziell länger
  const waypointFactor = 0.8 + (waypointCount / PATROL_MAX_WAYPOINTS) * 0.4; // 0.8 - 1.2
  const duration = baseDuration * waypointFactor;

  return Math.round(duration);
}

// ============================================================================
// PAUSE POINTS
// ============================================================================

/**
 * Bestimmt an welchen Waypoints pausiert wird
 */
function determinePausePoints(waypointCount: number): number[] {
  const pausePoints: number[] = [];

  // Skip ersten und letzten Waypoint (Start/Ende)
  for (let i = 1; i < waypointCount - 1; i++) {
    if (Math.random() < PATROL_PAUSE_POINT_CHANCE) {
      pausePoints.push(i);
    }
  }

  // Mindestens ein Pause-Punkt bei längeren Routen
  if (pausePoints.length === 0 && waypointCount > 5) {
    const middleIndex = Math.floor(waypointCount / 2);
    pausePoints.push(middleIndex);
  }

  return pausePoints;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Berechnet die Gesamt-Distanz einer Route (Schätzung)
 */
export function estimateRouteDistance(waypoints: [number, number][]): number {
  let totalDistance = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const [lat1, lng1] = waypoints[i];
    const [lat2, lng2] = waypoints[i + 1];

    // Haversine formula (vereinfacht)
    const R = 6371; // Erdradius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng / 2) * Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    totalDistance += distance;
  }

  return totalDistance;
}

/**
 * Prüft ob Route noch aktiv ist
 */
export function isPatrolRouteActive(route: PatrolRoute, currentTime: number): boolean {
  const elapsedMinutes = (currentTime - route.startTime) / 60000;
  const totalDuration = route.duration * (route.repeatCount || 1);

  // Bei repeatCount = 0 (unendlich) immer aktiv
  if (route.repeatCount === 0) return true;

  return elapsedMinutes < totalDuration;
}

/**
 * Berechnet Fortschritt der Route in %
 */
export function getPatrolRouteProgress(route: PatrolRoute, currentTime: number): number {
  if (route.repeatCount === 0) {
    // Unendliche Route: Fortschritt basiert nur auf aktueller Wiederholung
    const progressInCurrentRepeat =
      (route.currentWaypointIndex / route.waypoints.length) * 100;
    return progressInCurrentRepeat;
  }

  const elapsedMinutes = (currentTime - route.startTime) / 60000;
  const totalDuration = route.duration * route.repeatCount;
  const progress = (elapsedMinutes / totalDuration) * 100;

  return Math.min(100, Math.max(0, progress));
}
