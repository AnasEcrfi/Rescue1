/**
 * 🚔 PATROL MANAGER
 *
 * Zentrale Verwaltung für das Streifenfahrt-System.
 * Handles:
 * - Start/Stop von Streifen
 * - Bewegungs-Updates
 * - Zufallsentdeckungen (Discoveries)
 * - Unterbrechung bei Einsätzen
 * - Präsenz-Bonus Berechnung
 */

import type { Vehicle, WeatherType } from '../types';
import type { PatrolRoute, PatrolDiscovery, PatrolType } from '../types/patrol';
import { generatePatrolRoute } from './patrolRouteGenerator';
import { calculateDistance } from '../services/routingService';
import {
  PATROL_MIN_FUEL_REQUIRED,
  PATROL_MAX_FATIGUE_ALLOWED,
  PATROL_FUEL_CONSUMPTION_MULTIPLIER,
  PATROL_FATIGUE_MULTIPLIER,
  DISCOVERY_CHANCE_PER_MINUTE,
  DISCOVERY_CHANCE_HOTSPOT_MULTIPLIER,
  DISCOVERY_CHANCE_NIGHT_MULTIPLIER,
  DISCOVERY_TYPE_WEIGHTS,
  DISCOVERY_CHECK_INTERVAL,
  PRESENCE_BONUS_PER_PATROL,
  PRESENCE_BONUS_MAX,
} from '../constants/patrolConstants';
import { vehicleTypeConfigs } from '../constants/vehicleTypes';

// ============================================================================
// PATROL START/STOP
// ============================================================================

/**
 * Startet Streifenfahrt für ein Fahrzeug
 * @param vehicle - Fahrzeug das auf Streife geht
 * @param gameTime - Aktuelle Spielzeit
 * @param hour - Aktuelle Stunde
 * @param weather - Aktuelles Wetter
 * @param type - Optional: Patrol-Typ (standard, hotspot, etc.)
 * @param areaId - Optional: Spezifische Area-ID für die Route
 * @returns PatrolRoute oder null bei Fehler + Fehlergrund
 */
export async function startPatrol(
  vehicle: Vehicle,
  gameTime: number,
  hour: number,
  weather: WeatherType,
  type?: PatrolType,
  areaId?: string
): Promise<{ success: boolean; route: PatrolRoute | null; error?: string }> {
  // 1. VERFÜGBARKEIT prüfen
  if (vehicle.status !== 'S1' && vehicle.status !== 'S2') {
    return {
      success: false,
      route: null,
      error: 'Fahrzeug nicht verfügbar (muss S1 oder S2 sein)',
    };
  }

  // 2. TREIBSTOFF prüfen
  if (vehicle.fuelLevel < PATROL_MIN_FUEL_REQUIRED) {
    return {
      success: false,
      route: null,
      error: `Zu wenig Treibstoff (${vehicle.fuelLevel.toFixed(0)}%, min. ${PATROL_MIN_FUEL_REQUIRED}%)`,
    };
  }

  // 3. MÜDIGKEIT prüfen
  if (vehicle.crewFatigue > PATROL_MAX_FATIGUE_ALLOWED) {
    return {
      success: false,
      route: null,
      error: `Besatzung zu müde (${vehicle.crewFatigue.toFixed(0)}%, max. ${PATROL_MAX_FATIGUE_ALLOWED}%)`,
    };
  }

  // 4. WARTUNG prüfen
  if (vehicle.maintenanceStatus === 'critical') {
    return {
      success: false,
      route: null,
      error: 'Fahrzeug benötigt dringende Wartung',
    };
  }

  // 5. Route generieren (async, da OSRM-Routen berechnet werden)
  const route = await generatePatrolRoute(vehicle.position, gameTime, hour, weather, type, areaId);

  return {
    success: true,
    route,
  };
}

/**
 * Stoppt Streifenfahrt
 */
export function stopPatrol(): void {
  // Route wird im Parent (App.tsx) auf null gesetzt
  // Hier nur Cleanup falls nötig
}

// ============================================================================
// PATROL MOVEMENT UPDATE
// ============================================================================

/**
 * Aktualisiert Fahrzeugposition während Streifenfahrt
 * @returns Aktualisierte Position und Status
 */
export function updatePatrolMovement(
  vehicle: Vehicle,
  route: PatrolRoute,
  deltaTime: number, // Zeit seit letztem Update (Sekunden)
  gameSpeed: number
): {
  newPosition: [number, number];
  newWaypointIndex: number;
  routeCompleted: boolean;
  isPaused: boolean;
  distanceTraveled: number;
} {
  // ✅ WICHTIG: Nutze fullRoute (echte Straßenroute) statt waypoints (nur Zielpunkte)
  const fullRoute = route.fullRoute;
  const currentRouteIndex = route.currentWaypointIndex;
  const nextRoutePoint = fullRoute[currentRouteIndex + 1];

  // Ende der Route erreicht?
  if (!nextRoutePoint) {
    // 🎲 RANDOM PATROL: Nach jeder Route wird eine NEUE Route generiert!
    // Das Fahrzeug fährt nicht die gleiche Route, sondern bekommt neue Ziele

    // ✅ WICHTIG: Nutze die LETZTE Position der Route, nicht vehicle.position!
    const lastPosition = fullRoute[currentRouteIndex] || vehicle.position;
    console.log(`[PATROL] Route beendet an Position [${lastPosition[0].toFixed(4)}, ${lastPosition[1].toFixed(4)}] - Neue Route wird generiert (Random Patrol)`);

    // Signal an Parent: Route beendet, neue Route muss generiert werden
    // routeCompleted = true triggert die Neu-Generierung in App.tsx
    return {
      newPosition: lastPosition, // ✅ LETZTE Position der Route (Format: [lat, lng])
      newWaypointIndex: currentRouteIndex,
      routeCompleted: true, // ✅ Triggert Neu-Generierung der Route
      isPaused: false,
      distanceTraveled: 0,
    };
  }

  // Berechne Distanz zum nächsten Routenpunkt
  const distanceToNext = calculateDistance(
    { lat: vehicle.position[0], lng: vehicle.position[1] },
    { lat: nextRoutePoint[0], lng: nextRoutePoint[1] }
  );

  // Geschwindigkeit in m/s (berücksichtigt gameSpeed)
  const speedMps = (route.speed / 3.6) * gameSpeed;

  // Bewegungsdistanz in diesem Update
  const movementDistance = speedMps * deltaTime;

  let newPosition: [number, number];
  let newRouteIndex = currentRouteIndex;
  let distanceTraveled = 0;

  // Routenpunkt erreicht?
  if (movementDistance >= distanceToNext) {
    // Springe zum nächsten Routenpunkt
    newPosition = nextRoutePoint;
    newRouteIndex = currentRouteIndex + 1;
    distanceTraveled = distanceToNext / 1000; // km
  } else {
    // Bewege dich in Richtung nächsten Routenpunkt (Linear Interpolation)
    const progress = movementDistance / distanceToNext;
    newPosition = [
      vehicle.position[0] + (nextRoutePoint[0] - vehicle.position[0]) * progress,
      vehicle.position[1] + (nextRoutePoint[1] - vehicle.position[1]) * progress,
    ];
    distanceTraveled = movementDistance / 1000; // km
  }

  // Pause-Punkt prüfen: Sind wir an einem der Waypoints angekommen?
  // (Finde nächsten Waypoint in fullRoute)
  const isPausePoint = route.pausePoints.some(pauseIndex => {
    const waypointPos = route.waypoints[pauseIndex];
    const dist = calculateDistance(
      { lat: newPosition[0], lng: newPosition[1] },
      { lat: waypointPos[0], lng: waypointPos[1] }
    );
    return dist < 50; // Innerhalb 50m des Waypoints = Pause
  });

  return {
    newPosition,
    newWaypointIndex: newRouteIndex,
    routeCompleted: false,
    isPaused: isPausePoint,
    distanceTraveled,
  };
}

// ============================================================================
// DISCOVERY SYSTEM
// ============================================================================

/**
 * Prüft ob Fahrzeug auf Streife eine Entdeckung macht
 */
export function checkForDiscovery(
  vehicle: Vehicle,
  route: PatrolRoute,
  hour: number,
  gameTime: number,
  lastCheckTime: number
): PatrolDiscovery | null {
  // Discovery-Check nur alle X Sekunden
  const timeSinceLastCheck = gameTime - lastCheckTime;
  if (timeSinceLastCheck < DISCOVERY_CHECK_INTERVAL * 1000) {
    return null;
  }

  // Basis-Chance
  let discoveryChance = DISCOVERY_CHANCE_PER_MINUTE;

  // Hotspot-Multiplikator
  if (route.type === 'hotspot') {
    discoveryChance *= DISCOVERY_CHANCE_HOTSPOT_MULTIPLIER;
  }

  // Nacht-Multiplikator (22-6 Uhr)
  if (hour >= 22 || hour < 6) {
    discoveryChance *= DISCOVERY_CHANCE_NIGHT_MULTIPLIER;
  }

  // Würfeln
  if (Math.random() > discoveryChance) {
    return null; // Keine Entdeckung
  }

  // ENTDECKUNG! Wähle Discovery Type (gewichtet)
  const discoveryType = selectDiscoveryType();

  // Bestimme Priorität basierend auf Type
  const priority = determineDiscoveryPriority(discoveryType);

  // Position: Leicht variiert von aktueller Fahrzeugposition (±100m)
  const variation = 0.001; // ~100m
  const position: [number, number] = [
    vehicle.position[0] + (Math.random() - 0.5) * variation,
    vehicle.position[1] + (Math.random() - 0.5) * variation,
  ];

  // Beschreibung generieren
  const description = generateDiscoveryDescription(discoveryType, route.areaName);

  const discovery: PatrolDiscovery = {
    id: `discovery_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    vehicleId: vehicle.id,
    type: discoveryType,
    position,
    priority,
    description,
    timestamp: gameTime,
    discoveryMethod: selectDiscoveryMethod(),
  };

  return discovery;
}

/**
 * Wählt Discovery Type basierend auf Gewichtung
 */
function selectDiscoveryType(): string {
  const types = Object.entries(DISCOVERY_TYPE_WEIGHTS);
  const totalWeight = types.reduce((sum, [, weight]) => sum + weight, 0);
  let random = Math.random() * totalWeight;

  for (const [type, weight] of types) {
    random -= weight;
    if (random <= 0) {
      return type;
    }
  }

  // Fallback
  return 'Verdächtige Person';
}

/**
 * Bestimmt Priorität basierend auf Discovery Type
 */
function determineDiscoveryPriority(type: string): 'low' | 'medium' | 'high' {
  const highPriority = ['Einbruch', 'Raub', 'Verkehrsunfall'];
  const mediumPriority = ['Verdächtige Person', 'Vandalismus', 'Ladendiebstahl'];

  if (highPriority.includes(type)) return 'high';
  if (mediumPriority.includes(type)) return 'medium';
  return 'low';
}

/**
 * Generiert realistische Beschreibung für Discovery
 */
function generateDiscoveryDescription(type: string, areaName: string): string {
  const templates: { [key: string]: string[] } = {
    'Verdächtige Person': [
      `Person verhält sich auffällig im Bereich ${areaName}`,
      `Verdächtiges Verhalten an Fahrzeug beobachtet`,
      `Person versucht sich zu verstecken`,
    ],
    'Ladendiebstahl': [
      `Ladendetektiv meldet Diebstahl in ${areaName}`,
      `Verdächtiger Person gesehen beim Verlassen eines Geschäfts`,
      `Zeuge meldet Diebstahl`,
    ],
    'Falschparker': [
      `Fahrzeug blockiert Feuerwehrzufahrt in ${areaName}`,
      `PKW parkt auf Behindertenparkplatz ohne Ausweis`,
      `Fahrzeug steht im absoluten Halteverbot`,
    ],
    'Ruhestörung': [
      `Laute Musik aus Wohnung in ${areaName}`,
      `Anwohner beschweren sich über Lärm`,
      `Party eskaliert`,
    ],
    'Vandalismus': [
      `Graffiti wird gerade gesprüht in ${areaName}`,
      `Personen beschädigen Stadtmobiliar`,
      `Sachbeschädigung beobachtet`,
    ],
    'Einbruch': [
      `Verdächtige Geräusche aus Gebäude in ${areaName}`,
      `Aufgebrochenes Fenster entdeckt`,
      `Alarmanlage ausgelöst`,
    ],
    'Verkehrsunfall': [
      `Leichter Verkehrsunfall beobachtet in ${areaName}`,
      `Zwei Fahrzeuge kollidiert, keine Verletzten`,
      `Verkehrsunfall mit Blechschaden`,
    ],
  };

  const typeTemplates = templates[type] || [`Vorfall "${type}" entdeckt in ${areaName}`];
  return typeTemplates[Math.floor(Math.random() * typeTemplates.length)];
}

/**
 * Wählt Entdeckungsmethode
 */
function selectDiscoveryMethod(): 'observation' | 'radio' | 'witness' {
  const random = Math.random();
  if (random < 0.6) return 'observation'; // 60% direkte Beobachtung
  if (random < 0.85) return 'witness'; // 25% Zeugenmeldung
  return 'radio'; // 15% Funkhinweis
}

// ============================================================================
// PRESENCE BONUS CALCULATION
// ============================================================================

/**
 * Berechnet Kriminalitätsreduktion durch Streifenpräsenz
 */
export function calculatePresenceBonus(activePatrolCount: number): number {
  const bonus = activePatrolCount * PRESENCE_BONUS_PER_PATROL;
  return Math.min(PRESENCE_BONUS_MAX, bonus);
}

/**
 * Wendet Präsenz-Bonus auf Incident Spawn Chance an
 */
export function applyPresenceBonusToSpawnChance(
  baseChance: number,
  activePatrolCount: number
): number {
  const bonus = calculatePresenceBonus(activePatrolCount);
  const reducedChance = baseChance * (1 - bonus);
  return Math.max(0, reducedChance);
}

// ============================================================================
// RESOURCE CONSUMPTION
// ============================================================================

/**
 * Berechnet Treibstoffverbrauch während Streifenfahrt
 */
export function calculatePatrolFuelConsumption(
  vehicle: Vehicle,
  distanceTraveled: number // in km
): number {
  const config = vehicleTypeConfigs[vehicle.vehicleType];
  const baseFuelUsed = distanceTraveled * config.fuelConsumption; // Liter
  const fuelUsed = baseFuelUsed * PATROL_FUEL_CONSUMPTION_MULTIPLIER;

  // Convert to percentage
  const fuelPercentUsed = (fuelUsed / config.tankCapacity) * 100;
  return fuelPercentUsed;
}

/**
 * Berechnet Müdigkeitsanstieg während Streifenfahrt
 */
export function calculatePatrolFatigue(
  _vehicle: Vehicle,
  deltaTime: number // Sekunden
): number {
  // Basis-Müdigkeit: 5% pro Stunde = 0.0014% pro Sekunde
  const baseFatiguePerSecond = 5 / 3600;
  const fatigueIncrease = baseFatiguePerSecond * deltaTime * PATROL_FATIGUE_MULTIPLIER;

  return fatigueIncrease;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Prüft ob Fahrzeug geeignet für Streifenfahrt ist
 */
export function canVehiclePatrol(vehicle: Vehicle): { canPatrol: boolean; reason?: string } {
  if (vehicle.status !== 'S1' && vehicle.status !== 'S2') {
    return { canPatrol: false, reason: 'Fahrzeug nicht verfügbar' };
  }

  if (vehicle.fuelLevel < PATROL_MIN_FUEL_REQUIRED) {
    return { canPatrol: false, reason: 'Zu wenig Treibstoff' };
  }

  if (vehicle.crewFatigue > PATROL_MAX_FATIGUE_ALLOWED) {
    return { canPatrol: false, reason: 'Besatzung zu müde' };
  }

  if (vehicle.maintenanceStatus === 'critical') {
    return { canPatrol: false, reason: 'Wartung kritisch' };
  }

  return { canPatrol: true };
}

/**
 * Formatiert Patrol Type für UI
 */
export function formatPatrolType(type: PatrolType): string {
  const translations: { [key in PatrolType]: string } = {
    standard: 'Standard-Streife',
    hotspot: 'Hotspot-Streife',
    random: 'Zufalls-Streife',
    district: 'Revier-Streife',
    nightwatch: 'Nachtstreife',
  };

  return translations[type];
}
