/**
 * 🎮 GAMEPLAY-KONSTANTEN
 *
 * Zentrale Sammlung aller Gameplay-relevanten Zahlen und Schwellenwerte.
 * Alle "magischen Zahlen" aus dem Code werden hier dokumentiert und benannt.
 *
 * Vorteile:
 * - Bessere Lesbarkeit (statt "15" → "FUEL_CRITICAL_THRESHOLD")
 * - Einfacheres Balancing (alle Werte an einem Ort)
 * - Dokumentation (jeder Wert hat eine Erklärung)
 */

// ============================================================================
// TREIBSTOFF (Fuel)
// ============================================================================

/**
 * Treibstoff-Warnschwelle in Prozent
 * Fahrzeug zeigt Warnung, sollte bald tanken
 */
export const FUEL_WARNING_THRESHOLD = 25; // %

/**
 * Kritische Treibstoff-Schwelle in Prozent
 * Fahrzeug MUSS tanken, sonst S6
 */
export const FUEL_CRITICAL_THRESHOLD = 15; // %

/**
 * Niedriger Treibstoff für Smart Assignment
 * Fahrzeug sollte nicht mehr eingeteilt werden
 */
export const FUEL_LOW_THRESHOLD = 30; // %

/**
 * Tankgeschwindigkeit in Litern pro Sekunde
 * Realismus: Zapfsäulen schaffen ~30-40 L/min = 0.5-0.7 L/s
 */
export const FUEL_REFUEL_SPEED = 0.5; // Liter/Sekunde (war: 2, unrealistisch)

/**
 * Mindest-Tankdauer in Sekunden
 * Auch bei wenig Treibstoff: Mindestens diese Zeit
 */
export const FUEL_REFUEL_MIN_DURATION = 60; // Sekunden (1 Minute)

// ============================================================================
// CREW-MÜDIGKEIT (Fatigue)
// ============================================================================

/**
 * Müdigkeits-Warnschwelle in Prozent
 * Crew ist müde, Leistung lässt nach
 */
export const FATIGUE_WARNING_THRESHOLD = 60; // %

/**
 * Kritische Müdigkeits-Schwelle in Prozent
 * Crew ist erschöpft, MUSS Pause machen
 */
export const FATIGUE_CRITICAL_THRESHOLD = 85; // %

/**
 * Müdigkeits-Anstieg pro Stunde in Prozent
 * Basis-Rate, wird durch Faktoren modifiziert
 */
export const FATIGUE_RATE_PER_HOUR = 5; // % (war: 10, zu aggressiv)

/**
 * Müdigkeits-Reduktion durch Pause in Prozent
 * Wie viel Prozent werden durch eine Pause regeneriert
 */
export const FATIGUE_RECOVERY_ON_BREAK = 30; // %

/**
 * Zusätzliche Müdigkeit bei High-Priority Einsätzen
 * Stress-Faktor
 */
export const FATIGUE_STRESS_HIGH_PRIORITY = 5; // %

/**
 * Zusätzliche Müdigkeit bei langer Anfahrt (>30 Min)
 */
export const FATIGUE_STRESS_LONG_DRIVE = 3; // %

/**
 * Zusätzliche Müdigkeit bei Nacht-Einsätzen (22-6 Uhr)
 */
export const FATIGUE_STRESS_NIGHT_SHIFT = 2; // %

// ============================================================================
// WARTUNG (Maintenance)
// ============================================================================

/**
 * Kilometer bis Wartungs-Warnung
 * Bei dieser Distanz: Status "warning"
 */
export const MAINTENANCE_WARNING_KM = 500;

/**
 * Kilometer bis kritische Wartung
 * Bei dieser Distanz: Status "critical"
 */
export const MAINTENANCE_CRITICAL_KM = 1000;

/**
 * Zufalls-Defekt-Chance bei "critical" pro Minute
 * 2% = Im Schnitt alle 50 Minuten ein Defekt
 */
export const MAINTENANCE_BREAKDOWN_CHANCE = 0.02; // 2%

/**
 * Zufalls-Defekt-Chance allgemein (sehr selten)
 */
export const MAINTENANCE_RANDOM_BREAKDOWN_CHANCE = 0.001; // 0.1%

// ============================================================================
// EINSÄTZE (Incidents)
// ============================================================================

/**
 * Basis-Eskalations-Chance bei eskalierbaren Einsätzen
 * 10% = 1 von 10 Einsätzen eskaliert
 */
export const INCIDENT_ESCALATION_BASE_CHANCE = 0.1; // 10%

/**
 * Minimale Zeit bis Eskalation in Sekunden
 */
export const INCIDENT_ESCALATION_MIN_TIME = 60; // 60 Sekunden

/**
 * Maximale Zeit bis Eskalation in Sekunden
 */
export const INCIDENT_ESCALATION_MAX_TIME = 90; // 90 Sekunden

/**
 * MANV-Wahrscheinlichkeit (Schwer)
 */
export const INCIDENT_MANV_CHANCE_HARD = 0.03; // 3%

/**
 * MANV-Wahrscheinlichkeit (Mittel)
 */
export const INCIDENT_MANV_CHANCE_MEDIUM = 0.015; // 1.5%

/**
 * MANV-Wahrscheinlichkeit (Leicht)
 */
export const INCIDENT_MANV_CHANCE_EASY = 0.005; // 0.5%

// ============================================================================
// SPRECHWUNSCH (Speak Request / S5)
// ============================================================================

/**
 * Sprechwunsch-Chance pro Sekunde während S4
 * 2.5% = Im Schnitt nach 40 Sekunden ein Sprechwunsch
 */
export const SPEAK_REQUEST_CHANCE_PER_SECOND = 0.025; // 2.5% (war: 1.2%, zu selten)

/**
 * Minimaler Processing-Fortschritt für Sprechwunsch
 * Erst nach 20% des Einsatzes möglich
 */
export const SPEAK_REQUEST_MIN_PROGRESS = 0.2; // 20%

/**
 * Maximaler Processing-Fortschritt für Sprechwunsch
 * Ab 70% kein Sprechwunsch mehr
 */
export const SPEAK_REQUEST_MAX_PROGRESS = 0.7; // 70%

// ============================================================================
// ZEITMANAGEMENT (Timing)
// ============================================================================

/**
 * Ausrückzeit Streifenwagen in Sekunden
 * Zeit von S2 → S3 (Alarmierung → Ausrücken)
 */
export const DISPATCH_DELAY_STREIFENWAGEN = 30; // Sekunden

/**
 * Ausrückzeit SEK in Sekunden
 * SEK braucht länger (Ausrüstung anlegen)
 */
export const DISPATCH_DELAY_SEK = 120; // 2 Minuten

/**
 * Ausrückzeit Zivilfahrzeug in Sekunden
 */
export const DISPATCH_DELAY_ZIVILFAHRZEUG = 25; // Sekunden

/**
 * Ausrückzeit Hubschrauber in Sekunden
 * Rotoren anlaufen, Pre-Flight Check
 */
export const DISPATCH_DELAY_HUBSCHRAUBER = 180; // 3 Minuten

/**
 * Pausen-Dauer in Minuten (S6 - Crew-Pause)
 */
export const BREAK_DURATION = 15; // Minuten

/**
 * Tank-Dauer in Minuten (S6 - Tanken)
 * Basis-Zeit, wird durch Treibstoffmenge angepasst
 */
export const REFUEL_DURATION = 5; // Minuten

/**
 * Reparatur-Dauer Minimum in Minuten
 */
export const REPAIR_DURATION_MIN = 30; // Minuten

/**
 * Reparatur-Dauer Maximum in Minuten
 */
export const REPAIR_DURATION_MAX = 60; // Minuten

/**
 * Schicht-Dauer in Minuten
 * Standard-Polizei-Schicht: 8 Stunden
 */
export const SHIFT_DURATION = 8 * 60; // 480 Minuten

/**
 * Schichtwechsel-Dauer in Minuten
 * Zeit für Übergabe an neue Besatzung
 */
export const SHIFT_CHANGE_DURATION = 10; // Minuten

/**
 * Lagemeldung nach X Sekunden am Einsatzort
 * Fahrzeug meldet erste Einschätzung der Lage
 */
export const SITUATION_REPORT_MIN_TIME = 10; // Sekunden

/**
 * Lagemeldung spätestens nach X Sekunden
 */
export const SITUATION_REPORT_MAX_TIME = 20; // Sekunden

// ============================================================================
// FAHRZEUG-POSITIONIERUNG (Vehicle Positioning)
// ============================================================================

/**
 * Basis-Abstand zwischen geparkten Fahrzeugen in Grad
 * ~11 Meter bei Frankfurt-Koordinaten
 */
export const PARKING_OFFSET_BASE = 0.0001;

/**
 * Anzahl Fahrzeuge pro Parkplatz-Reihe
 * 360° / 45° = 8 Fahrzeuge im Kreis
 */
export const VEHICLES_PER_PARKING_ROW = 8;

/**
 * Winkel zwischen Fahrzeugen beim Parken in Grad
 */
export const PARKING_ANGLE_STEP = 45; // Grad (360° / 8 = 45°)

// ============================================================================
// SMART ASSIGNMENT (Fahrzeug-Zuweisung)
// ============================================================================

/**
 * Basis-Score für Fahrzeug (100 = perfekt)
 */
export const SMART_ASSIGNMENT_BASE_SCORE = 100;

/**
 * Minimaler Score für Zuweisung
 * Fahrzeuge mit Score < 30 werden nicht zugewiesen
 */
export const SMART_ASSIGNMENT_MIN_SCORE = 30;

/**
 * Score-Abzug für unpassenden Fahrzeugtyp
 */
export const SMART_ASSIGNMENT_WRONG_TYPE_PENALTY = 40;

/**
 * Score-Abzug für sehr weite Entfernung (>10km)
 */
export const SMART_ASSIGNMENT_DISTANCE_FAR_PENALTY = 30;

/**
 * Score-Abzug für weite Entfernung (5-10km)
 */
export const SMART_ASSIGNMENT_DISTANCE_MEDIUM_PENALTY = 20;

/**
 * Score-Abzug für mittlere Entfernung (2-5km)
 */
export const SMART_ASSIGNMENT_DISTANCE_NEAR_PENALTY = 10;

/**
 * Score-Abzug für kritischen Treibstoff (<15%)
 */
export const SMART_ASSIGNMENT_FUEL_CRITICAL_PENALTY = 50;

/**
 * Score-Abzug für niedrigen Treibstoff (<30%)
 */
export const SMART_ASSIGNMENT_FUEL_LOW_PENALTY = 25;

/**
 * Score-Abzug für nicht ausreichenden Treibstoff
 */
export const SMART_ASSIGNMENT_FUEL_INSUFFICIENT_PENALTY = 15;

/**
 * Score-Abzug für kritische Müdigkeit (>90%)
 */
export const SMART_ASSIGNMENT_FATIGUE_CRITICAL_PENALTY = 50;

/**
 * Score-Abzug für hohe Müdigkeit (>80%)
 */
export const SMART_ASSIGNMENT_FATIGUE_HIGH_PENALTY = 30;

/**
 * Score-Abzug für mittlere Müdigkeit (>60%)
 */
export const SMART_ASSIGNMENT_FATIGUE_MEDIUM_PENALTY = 15;

/**
 * Score-Bonus für High-Priority Einsatz
 */
export const SMART_ASSIGNMENT_HIGH_PRIORITY_BONUS = 10;

/**
 * Score-Abzug für kritischen Wartungszustand
 */
export const SMART_ASSIGNMENT_MAINTENANCE_CRITICAL_PENALTY = 40;

/**
 * Score-Abzug für Wartungs-Warnung
 */
export const SMART_ASSIGNMENT_MAINTENANCE_WARNING_PENALTY = 15;

// ============================================================================
// DISTANZ-SCHWELLENWERTE (Distance Thresholds)
// ============================================================================

/**
 * Nahe Distanz in Kilometern
 * Fahrzeuge in dieser Reichweite = ideale Zuweisung
 */
export const DISTANCE_NEAR = 2; // km

/**
 * Mittlere Distanz in Kilometern
 */
export const DISTANCE_MEDIUM = 5; // km

/**
 * Weite Distanz in Kilometern
 */
export const DISTANCE_FAR = 10; // km

/**
 * Sehr weite Distanz in Kilometern
 * Fahrzeuge sollten nicht so weit fahren müssen
 */
export const DISTANCE_VERY_FAR = 20; // km

// ============================================================================
// GESCHWINDIGKEITS-FAKTOREN (Speed Multipliers)
// ============================================================================

/**
 * Stadt-Faktor für Durchschnittsgeschwindigkeit
 * Polizeifahrzeuge fahren nicht konstant maxSpeed (Ampeln, Kurven, etc.)
 */
export const CITY_SPEED_FACTOR = 0.7; // 70% der maxSpeed

/**
 * Hubschrauber-Geschwindigkeits-Faktor
 * Hubschrauber können ~90% ihrer maxSpeed erreichen (Luftlinie)
 */
export const HELICOPTER_SPEED_FACTOR = 0.9; // 90% der maxSpeed

/**
 * Geschwindigkeits-Bonus mit Sonderrechten (Blaulicht)
 */
export const SPECIAL_RIGHTS_SPEED_BONUS = 1.3; // 30% schneller

/**
 * Geschwindigkeits-Reduktion bei hoher Müdigkeit (>80%)
 */
export const FATIGUE_SPEED_PENALTY = 0.7; // 30% langsamer

/**
 * Minimale Routendauer in Sekunden
 * Auch für sehr kurze Strecken
 */
export const ROUTE_MIN_DURATION = 30; // Sekunden

// ============================================================================
// POI & VARIATION (Points of Interest)
// ============================================================================

/**
 * Minimale POI-Nutzungs-Chance
 */
export const POI_USE_CHANCE_MIN = 0.5; // 50%

/**
 * Maximale POI-Nutzungs-Chance
 */
export const POI_USE_CHANCE_MAX = 0.9; // 90%

/**
 * Chance für zufällige POI-Kategorie (Überraschung)
 */
export const POI_RANDOM_CATEGORY_CHANCE = 0.15; // 15%

/**
 * Chance für Tageszeit-Gewichtung zu ignorieren
 * Sorgt für mehr Variation
 */
export const INCIDENT_IGNORE_TIME_WEIGHTING_CHANCE = 0.3; // 30%

/**
 * Chance für Rückrufnummer beim Notruf
 */
export const CALL_CALLBACK_NUMBER_CHANCE = 0.7; // 70%

// ============================================================================
// UI & ANIMATION
// ============================================================================

/**
 * Blaulicht-Blink-Pattern (ECE-R65 konform)
 * Doppelblitz mit Pause
 */
export const BLAULICHT_PATTERN = [
  { duration: 80, state: true },   // Erster Blitz
  { duration: 80, state: false },  // Kurze Pause
  { duration: 80, state: true },   // Zweiter Blitz (Doppelblitz)
  { duration: 260, state: false }, // Pause bis nächste Gruppe
] as const;

/**
 * Toast-Anzeige-Dauer in Millisekunden
 */
export const TOAST_DURATION = 5000; // 5 Sekunden

/**
 * Modal-Fade-In Dauer in Millisekunden
 */
export const MODAL_FADE_DURATION = 300; // 0.3 Sekunden

/**
 * Map-Zoom-Animation Dauer in Sekunden
 */
export const MAP_ZOOM_DURATION = 0.5; // 0.5 Sekunden

// ============================================================================
// KOSTEN (Costs) - 🎮 Phase 5: Realismus
// ============================================================================

/**
 * Kosten für Tanken
 * ⚖️ BALANCED: Reduziert von 10 auf 5 (Einnahmen: ~60/h, Ausgaben waren ~80/h)
 */
export const REFUEL_COST = 5; // Punkte (Score-Abzug) - War 10

/**
 * Minimale Reparatur-Kosten
 * ⚖️ BALANCED: Reduziert von 20 auf 10
 */
export const REPAIR_COST_MIN = 10; // Punkte - War 20

/**
 * Maximale Reparatur-Kosten
 * ⚖️ BALANCED: Reduziert von 50 auf 30
 */
export const REPAIR_COST_MAX = 30; // Punkte - War 50

/**
 * Kosten für Crew-Pause
 * ⚖️ BALANCED: Reduziert von 5 auf 3
 */
export const CREW_BREAK_COST = 3; // Punkte - War 5

/**
 * Kosten für Schichtwechsel
 * ⚖️ BALANCED: Reduziert von 5 auf 3
 */
export const SHIFT_CHANGE_COST = 3; // Punkte - War 5

// ============================================================================
// SCHWIERIGKEITSGRAD-MULTIPLIKATOREN
// ============================================================================

/**
 * Schwierigkeitsgrad: Leicht
 */
export const DIFFICULTY_EASY = {
  incidentFrequency: 0.7,        // 30% weniger Einsätze
  escalationChance: 0.05,        // 5% Eskalations-Chance
  startVehicles: 6,              // 6 Fahrzeuge am Start
  crewFatigueRate: 0.7,          // 30% langsamer müde
  fuelConsumptionRate: 0.9,      // 10% weniger Verbrauch
  backupRequestChance: 0.1,      // 10% Verstärkung
  baseTimeLimit: 600,            // 10 Minuten pro Einsatz
} as const;

/**
 * Schwierigkeitsgrad: Mittel
 */
export const DIFFICULTY_MEDIUM = {
  incidentFrequency: 1.0,        // Normale Einsatz-Frequenz
  escalationChance: 0.1,         // 10% Eskalations-Chance
  startVehicles: 5,              // 5 Fahrzeuge am Start
  crewFatigueRate: 1.0,          // Normale Müdigkeit
  fuelConsumptionRate: 1.0,      // Normaler Verbrauch
  backupRequestChance: 0.15,     // 15% Verstärkung
  baseTimeLimit: 480,            // 8 Minuten pro Einsatz
} as const;

/**
 * Schwierigkeitsgrad: Schwer
 */
export const DIFFICULTY_HARD = {
  incidentFrequency: 1.3,        // 30% mehr Einsätze
  escalationChance: 0.2,         // 20% Eskalations-Chance
  startVehicles: 4,              // Nur 4 Fahrzeuge
  crewFatigueRate: 1.3,          // 30% schneller müde
  fuelConsumptionRate: 1.2,      // 20% mehr Verbrauch
  backupRequestChance: 0.25,     // 25% Verstärkung
  baseTimeLimit: 360,            // 6 Minuten pro Einsatz
} as const;

// ============================================================================
// EXPORT ALL AS OBJECT (Optional für strukturierten Zugriff)
// ============================================================================

export const GAMEPLAY_CONSTANTS = {
  // Fuel
  FUEL_WARNING_THRESHOLD,
  FUEL_CRITICAL_THRESHOLD,
  FUEL_LOW_THRESHOLD,
  FUEL_REFUEL_SPEED,
  FUEL_REFUEL_MIN_DURATION,

  // Fatigue
  FATIGUE_WARNING_THRESHOLD,
  FATIGUE_CRITICAL_THRESHOLD,
  FATIGUE_RATE_PER_HOUR,
  FATIGUE_RECOVERY_ON_BREAK,
  FATIGUE_STRESS_HIGH_PRIORITY,
  FATIGUE_STRESS_LONG_DRIVE,
  FATIGUE_STRESS_NIGHT_SHIFT,

  // Maintenance
  MAINTENANCE_WARNING_KM,
  MAINTENANCE_CRITICAL_KM,
  MAINTENANCE_BREAKDOWN_CHANCE,
  MAINTENANCE_RANDOM_BREAKDOWN_CHANCE,

  // Incidents
  INCIDENT_ESCALATION_BASE_CHANCE,
  INCIDENT_ESCALATION_MIN_TIME,
  INCIDENT_ESCALATION_MAX_TIME,
  INCIDENT_MANV_CHANCE_HARD,
  INCIDENT_MANV_CHANCE_MEDIUM,
  INCIDENT_MANV_CHANCE_EASY,

  // Speak Request
  SPEAK_REQUEST_CHANCE_PER_SECOND,
  SPEAK_REQUEST_MIN_PROGRESS,
  SPEAK_REQUEST_MAX_PROGRESS,

  // Timing
  DISPATCH_DELAY_STREIFENWAGEN,
  DISPATCH_DELAY_SEK,
  DISPATCH_DELAY_ZIVILFAHRZEUG,
  DISPATCH_DELAY_HUBSCHRAUBER,
  BREAK_DURATION,
  REFUEL_DURATION,
  REPAIR_DURATION_MIN,
  REPAIR_DURATION_MAX,
  SHIFT_DURATION,
  SHIFT_CHANGE_DURATION,
  SITUATION_REPORT_MIN_TIME,
  SITUATION_REPORT_MAX_TIME,

  // Parking
  PARKING_OFFSET_BASE,
  VEHICLES_PER_PARKING_ROW,
  PARKING_ANGLE_STEP,

  // Smart Assignment
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

  // Distances
  DISTANCE_NEAR,
  DISTANCE_MEDIUM,
  DISTANCE_FAR,
  DISTANCE_VERY_FAR,

  // Speed
  CITY_SPEED_FACTOR,
  HELICOPTER_SPEED_FACTOR,
  SPECIAL_RIGHTS_SPEED_BONUS,
  FATIGUE_SPEED_PENALTY,
  ROUTE_MIN_DURATION,

  // POI & Variation
  POI_USE_CHANCE_MIN,
  POI_USE_CHANCE_MAX,
  POI_RANDOM_CATEGORY_CHANCE,
  INCIDENT_IGNORE_TIME_WEIGHTING_CHANCE,
  CALL_CALLBACK_NUMBER_CHANCE,

  // UI
  BLAULICHT_PATTERN,
  TOAST_DURATION,
  MODAL_FADE_DURATION,
  MAP_ZOOM_DURATION,

  // Difficulty
  DIFFICULTY_EASY,
  DIFFICULTY_MEDIUM,
  DIFFICULTY_HARD,

  // 🎮 Phase 5: Realismus - Kosten
  REFUEL_COST,
  REPAIR_COST_MIN,
  REPAIR_COST_MAX,
  CREW_BREAK_COST,
  SHIFT_CHANGE_COST,
} as const;
