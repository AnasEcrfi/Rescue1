/**
 * 🚔 PATROL-SYSTEM KONSTANTEN
 *
 * Alle Gameplay-relevanten Konstanten für das Streifenfahrt-System.
 * Werte basieren auf realistischen Polizei-Streifenfahrten.
 */

// ============================================================================
// ZEITBASIERTE KONSTANTEN
// ============================================================================

/**
 * Minimale Streifendauer in Minuten
 */
export const PATROL_DURATION_MIN = 20;

/**
 * Maximale Streifendauer in Minuten
 */
export const PATROL_DURATION_MAX = 45;

/**
 * Pausendauer an Waypoints in Minuten
 * (Realismus: Fahrzeug hält kurz, beobachtet Umgebung)
 */
export const PATROL_PAUSE_DURATION = 3;

/**
 * Intervall für Discovery-Checks in Sekunden
 * Alle X Sekunden wird geprüft ob Entdeckung passiert
 */
export const DISCOVERY_CHECK_INTERVAL = 60; // 1 Minute

// ============================================================================
// GESCHWINDIGKEIT
// ============================================================================

/**
 * Basis-Geschwindigkeit für Streifenfahrten in km/h
 * (Deutlich langsamer als Einsatzfahrten!)
 */
export const PATROL_SPEED_BASE = 50;

/**
 * Geschwindigkeit bei Nachtstreife in km/h
 * (Nachts langsamer, mehr Beobachtung)
 */
export const PATROL_SPEED_NIGHT = 40;

/**
 * Geschwindigkeit bei Hotspot-Streife in km/h
 * (Noch langsamer, intensive Beobachtung)
 */
export const PATROL_SPEED_HOTSPOT = 35;

/**
 * Wetter-Multiplikator für Streifengeschwindigkeit
 * (Bei Regen/Schnee langsamer)
 */
export const PATROL_SPEED_WEATHER_FACTOR = 0.8;

// ============================================================================
// ENTDECKUNGEN (DISCOVERIES)
// ============================================================================

/**
 * Basis-Chance für Entdeckung pro Minute (2%)
 * Im Durchschnitt alle 50 Minuten eine Entdeckung
 */
export const DISCOVERY_CHANCE_PER_MINUTE = 0.02;

/**
 * Erhöhte Discovery-Chance in Hotspot-Gebieten
 */
export const DISCOVERY_CHANCE_HOTSPOT_MULTIPLIER = 2.0; // 2x Chance

/**
 * Erhöhte Discovery-Chance nachts (22-6 Uhr)
 */
export const DISCOVERY_CHANCE_NIGHT_MULTIPLIER = 1.5; // 1.5x Chance

/**
 * Gewichtung für Discovery-Typen
 * Höhere Werte = wahrscheinlicher
 */
export const DISCOVERY_TYPE_WEIGHTS = {
  'Verdächtige Person': 0.30,     // 30% Chance
  'Ladendiebstahl': 0.15,          // 15%
  'Falschparker': 0.20,            // 20%
  'Ruhestörung': 0.15,             // 15%
  'Vandalismus': 0.10,             // 10%
  'Einbruch': 0.05,                // 5% (selten aber wichtig)
  'Verkehrsunfall': 0.05,          // 5%
} as const;

// ============================================================================
// RESSOURCEN-MANAGEMENT
// ============================================================================

/**
 * Treibstoffverbrauch bei Streifenfahrt
 * (70% des normalen Verbrauchs, da langsamer)
 */
export const PATROL_FUEL_CONSUMPTION_MULTIPLIER = 0.7;

/**
 * Müdigkeitsanstieg bei Streifenfahrt
 * (50% der normalen Müdigkeit, da weniger stressig)
 */
export const PATROL_FATIGUE_MULTIPLIER = 0.5;

/**
 * Mindest-Treibstoff für Streifenfahrt in %
 * (Sicherheit: Genug Reserve für Einsätze)
 */
export const PATROL_MIN_FUEL_REQUIRED = 40;

/**
 * Maximale Müdigkeit für Streifenfahrt in %
 * (Crew zu müde = keine Streife mehr)
 */
export const PATROL_MAX_FATIGUE_ALLOWED = 70;

// ============================================================================
// PRÄSENZ-BONUS
// ============================================================================

/**
 * Kriminalitätsreduktion pro aktive Streife in %
 * 1 Streife = -5% Incident Spawn Chance
 */
export const PRESENCE_BONUS_PER_PATROL = 0.05; // 5%

/**
 * Maximaler Präsenz-Bonus in %
 * Cap bei 25% Reduktion (5 Streifen gleichzeitig)
 */
export const PRESENCE_BONUS_MAX = 0.25; // 25%

/**
 * Präsenz-Bonus verfällt nach X Minuten ohne Streife
 * (Kriminelle merken fehlende Präsenz)
 */
export const PRESENCE_BONUS_DECAY_TIME = 30; // Minuten

// ============================================================================
// WAYPOINTS & ROUTEN
// ============================================================================

/**
 * Minimale Anzahl Waypoints pro Route
 */
export const PATROL_MIN_WAYPOINTS = 4;

/**
 * Maximale Anzahl Waypoints pro Route
 */
export const PATROL_MAX_WAYPOINTS = 8;

/**
 * Chance dass ein Waypoint ein Pause-Punkt ist
 */
export const PATROL_PAUSE_POINT_CHANCE = 0.25; // 25%

/**
 * Minimale Distanz zwischen Waypoints in km
 * (Zu nah = sinnlos, zu weit = unrealistisch)
 */
export const PATROL_MIN_WAYPOINT_DISTANCE = 0.5; // 500m

/**
 * Maximale Distanz zwischen Waypoints in km
 */
export const PATROL_MAX_WAYPOINT_DISTANCE = 2.5; // 2.5km

/**
 * Standard-Wiederholungen einer Route
 * 0 = unendlich (bis manuell gestoppt)
 */
export const PATROL_DEFAULT_REPEAT_COUNT = 0;

// ============================================================================
// SMART ASSIGNMENT BONUS
// ============================================================================

/**
 * Score-Bonus für Fahrzeuge auf Streife bei Zuweisung
 * (Bereits unterwegs = schneller vor Ort)
 */
export const PATROL_ASSIGNMENT_BONUS = 15; // +15 Punkte

/**
 * Maximale Entfernung für Patrol-Bonus in km
 * Nur wenn Streife in Nähe des Einsatzes = Bonus
 */
export const PATROL_ASSIGNMENT_MAX_DISTANCE = 3; // 3km

// ============================================================================
// UI & VISUAL
// ============================================================================

/**
 * Farbe für Streifenrouten auf Karte (Hex)
 */
export const PATROL_ROUTE_COLOR = '#30D158'; // Grün (S1-Farbe)

/**
 * Opazität der Streifenroute
 */
export const PATROL_ROUTE_OPACITY = 0.6;

/**
 * Linienstärke für Streifenroute (Pixel)
 */
export const PATROL_ROUTE_WEIGHT = 3;

/**
 * Dash-Pattern für gestrichelte Linie
 * [Strich-Länge, Lücken-Länge]
 */
export const PATROL_ROUTE_DASH_ARRAY = '10, 10';

// ============================================================================
// EXPORT ALL
// ============================================================================

export const PATROL_CONSTANTS = {
  // Zeit
  PATROL_DURATION_MIN,
  PATROL_DURATION_MAX,
  PATROL_PAUSE_DURATION,
  DISCOVERY_CHECK_INTERVAL,

  // Geschwindigkeit
  PATROL_SPEED_BASE,
  PATROL_SPEED_NIGHT,
  PATROL_SPEED_HOTSPOT,
  PATROL_SPEED_WEATHER_FACTOR,

  // Discoveries
  DISCOVERY_CHANCE_PER_MINUTE,
  DISCOVERY_CHANCE_HOTSPOT_MULTIPLIER,
  DISCOVERY_CHANCE_NIGHT_MULTIPLIER,
  DISCOVERY_TYPE_WEIGHTS,

  // Ressourcen
  PATROL_FUEL_CONSUMPTION_MULTIPLIER,
  PATROL_FATIGUE_MULTIPLIER,
  PATROL_MIN_FUEL_REQUIRED,
  PATROL_MAX_FATIGUE_ALLOWED,

  // Präsenz
  PRESENCE_BONUS_PER_PATROL,
  PRESENCE_BONUS_MAX,
  PRESENCE_BONUS_DECAY_TIME,

  // Waypoints
  PATROL_MIN_WAYPOINTS,
  PATROL_MAX_WAYPOINTS,
  PATROL_PAUSE_POINT_CHANCE,
  PATROL_MIN_WAYPOINT_DISTANCE,
  PATROL_MAX_WAYPOINT_DISTANCE,
  PATROL_DEFAULT_REPEAT_COUNT,

  // Smart Assignment
  PATROL_ASSIGNMENT_BONUS,
  PATROL_ASSIGNMENT_MAX_DISTANCE,

  // UI
  PATROL_ROUTE_COLOR,
  PATROL_ROUTE_OPACITY,
  PATROL_ROUTE_WEIGHT,
  PATROL_ROUTE_DASH_ARRAY,
} as const;
