/**
 * 🚔 PATROL AREAS - FRANKFURT AM MAIN
 *
 * Realistische Streifengebiete basierend auf:
 * - Frankfurter Stadtteile
 * - Kriminalitätsschwerpunkte
 * - Polizei-Reviere
 * - Tageszeit-abhängige Hotspots
 */

import type { PatrolArea } from '../types/patrol';

// ============================================================================
// FRANKFURT PATROL AREAS
// ============================================================================

/**
 * Hauptstreifengebiete in Frankfurt am Main
 */
export const frankfurtPatrolAreas: PatrolArea[] = [
  // -------------------------------------------------------------------------
  // INNENSTADT (High Priority - Tag & Nacht)
  // -------------------------------------------------------------------------
  {
    id: 'innenstadt',
    name: 'Innenstadt',
    center: [50.1109, 8.6821], // Hauptwache
    radius: 1.5,
    priority: 'high',
    activeHours: null, // Immer aktiv
    incidentTypes: [
      'Diebstahl',
      'Ladendiebstahl',
      'Raub',
      'Schlägerei',
      'Vandalismus',
      'Verdächtige Person',
    ],
    points: [
      [50.1109, 8.6821], // Hauptwache
      [50.1106, 8.6795], // Zeil (Einkaufsstraße)
      [50.1136, 8.6797], // Eschenheimer Tor
      [50.1070, 8.6820], // Römer/Römerberg
      [50.1097, 8.6764], // Alte Oper
      [50.1079, 8.6841], // Dom/Kaiserdom
    ],
    description: 'Hauptgeschäftsviertel mit hoher Personenfrequenz. Schwerpunkt: Diebstahl, Raub.',
  },

  // -------------------------------------------------------------------------
  // BAHNHOFSVIERTEL (High Priority - 24/7 Hotspot!)
  // -------------------------------------------------------------------------
  {
    id: 'bahnhofsviertel',
    name: 'Bahnhofsviertel',
    center: [50.1070, 8.6630],
    radius: 1.0,
    priority: 'high',
    activeHours: null, // Immer aktiv (bekannter Hotspot)
    incidentTypes: [
      'Drogenhandel',
      'Raub',
      'Körperverletzung',
      'Belästigung',
      'Verdächtige Person',
      'Diebstahl',
    ],
    points: [
      [50.1070, 8.6630], // Hauptbahnhof
      [50.1058, 8.6640], // Kaiserstraße
      [50.1041, 8.6625], // Münchener Straße
      [50.1085, 8.6615], // Taunusstraße
      [50.1052, 8.6680], // Elbestraße
    ],
    description: 'Kriminalitätsschwerpunkt. Drogenszene, Rotlichtmilieu. Erhöhte Präsenz notwendig.',
  },

  // -------------------------------------------------------------------------
  // SACHSENHAUSEN (Medium Priority - Ausgehviertel)
  // -------------------------------------------------------------------------
  {
    id: 'sachsenhausen',
    name: 'Sachsenhausen',
    center: [50.1033, 8.6800],
    radius: 1.2,
    priority: 'medium',
    activeHours: [18, 4], // Abends/Nachts aktiver
    incidentTypes: [
      'Ruhestörung',
      'Schlägerei',
      'Trunkenheit',
      'Vandalismus',
      'Häusliche Gewalt',
    ],
    points: [
      [50.1033, 8.6800], // Schweizer Platz
      [50.0990, 8.6820], // Alt-Sachsenhausen (Kneipen)
      [50.1010, 8.6750], // Textorstraße
      [50.1050, 8.6785], // Museumsufer
    ],
    description: 'Ausgehviertel mit Kneipen und Restaurants. Nachts Ruhestörung und Schlägereien.',
  },

  // -------------------------------------------------------------------------
  // OSTEND (Medium Priority - Wohngebiet & Gewerbe)
  // -------------------------------------------------------------------------
  {
    id: 'ostend',
    name: 'Ostend',
    center: [50.1150, 8.7100],
    radius: 1.8,
    priority: 'medium',
    activeHours: null,
    incidentTypes: [
      'Einbruch',
      'Diebstahl',
      'Vandalismus',
      'Verkehrsunfall',
    ],
    points: [
      [50.1150, 8.7100], // Ostbahnhof
      [50.1189, 8.7050], // Riederwald
      [50.1110, 8.7150], // Ostpark
      [50.1085, 8.7000], // Hanauer Landstraße
    ],
    description: 'Mix aus Wohngebiet und Gewerbe. Einbrüche und Verkehrsdelikte.',
  },

  // -------------------------------------------------------------------------
  // NORDEND (Low Priority - Ruhiges Wohngebiet)
  // -------------------------------------------------------------------------
  {
    id: 'nordend',
    name: 'Nordend',
    center: [50.1250, 8.6900],
    radius: 1.5,
    priority: 'low',
    activeHours: [22, 6], // Nachts mehr Präsenz
    incidentTypes: [
      'Einbruch',
      'Ruhestörung',
      'Vandalismus',
      'Falschparker',
    ],
    points: [
      [50.1250, 8.6900], // Friedberger Platz
      [50.1300, 8.6850], // Oeder Weg
      [50.1220, 8.7000], // Bethmannpark
      [50.1280, 8.6950], // Bornheim Mitte
    ],
    description: 'Beliebtes Wohngebiet. Nachts Einbrüche, tagsüber ruhig.',
  },

  // -------------------------------------------------------------------------
  // WESTEND (Medium Priority - Geschäftsviertel)
  // -------------------------------------------------------------------------
  {
    id: 'westend',
    name: 'Westend',
    center: [50.1150, 8.6550],
    radius: 1.3,
    priority: 'medium',
    activeHours: [6, 20], // Hauptsächlich tagsüber
    incidentTypes: [
      'Diebstahl',
      'Verkehrsunfall',
      'Falschparker',
      'Demonstration',
    ],
    points: [
      [50.1150, 8.6550], // Bockenheimer Warte
      [50.1170, 8.6600], // Universität
      [50.1140, 8.6500], // Palmengarten
      [50.1200, 8.6700], // Messe Frankfurt
    ],
    description: 'Geschäftsviertel mit Universität und Messe. Tagsüber hoher Verkehr.',
  },

  // -------------------------------------------------------------------------
  // GALLUS (Medium Priority - Industriegebiet)
  // -------------------------------------------------------------------------
  {
    id: 'gallus',
    name: 'Gallus',
    center: [50.1050, 8.6400],
    radius: 1.6,
    priority: 'medium',
    activeHours: [20, 6], // Nachts mehr Einbrüche
    incidentTypes: [
      'Einbruch',
      'Vandalismus',
      'Diebstahl',
      'Verdächtige Person',
    ],
    points: [
      [50.1050, 8.6400], // Galluswarte
      [50.1020, 8.6300], // Gütergeländeweg
      [50.1080, 8.6450], // Mainzer Landstraße
      [50.1000, 8.6350], // Rebstöcker Straße
    ],
    description: 'Industriegebiet mit Gewerbe. Nachts erhöhte Einbruchgefahr.',
  },

  // -------------------------------------------------------------------------
  // BORNHEIM (Low Priority - Wohngebiet)
  // -------------------------------------------------------------------------
  {
    id: 'bornheim',
    name: 'Bornheim',
    center: [50.1350, 8.7150],
    radius: 1.4,
    priority: 'low',
    activeHours: [22, 6],
    incidentTypes: [
      'Ruhestörung',
      'Einbruch',
      'Häusliche Gewalt',
      'Vandalismus',
    ],
    points: [
      [50.1350, 8.7150], // Bornheim Mitte
      [50.1400, 8.7200], // Berger Straße
      [50.1320, 8.7250], // Günthersburgpark
      [50.1380, 8.7100], // Uhrtürmchen
    ],
    description: 'Ruhiges Wohngebiet mit lokaler Kneipenszene. Nachts Ruhestörungen.',
  },

  // -------------------------------------------------------------------------
  // FLUGHAFEN (High Priority - Spezialgebiet)
  // -------------------------------------------------------------------------
  {
    id: 'flughafen',
    name: 'Flughafen',
    center: [50.0379, 8.5622],
    radius: 2.0,
    priority: 'high',
    activeHours: null, // 24/7 Betrieb
    incidentTypes: [
      'Verdächtige Person',
      'Diebstahl',
      'Sicherheitsvorfall',
      'Verkehrsunfall',
    ],
    points: [
      [50.0379, 8.5622], // Terminal 1
      [50.0483, 8.5706], // Terminal 2
      [50.0420, 8.5800], // Cargo City
      [50.0350, 8.5500], // Gateway Gardens
    ],
    description: 'Internationaler Flughafen. Hohe Sicherheitsanforderungen, 24/7 Präsenz.',
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Findet Patrol Area nach ID
 */
export function getPatrolAreaById(id: string): PatrolArea | undefined {
  return frankfurtPatrolAreas.find(area => area.id === id);
}

/**
 * Findet alle aktiven Patrol Areas für eine bestimmte Uhrzeit
 */
export function getActivePatrolAreas(hour: number): PatrolArea[] {
  return frankfurtPatrolAreas.filter(area => {
    // Wenn activeHours null = immer aktiv
    if (!area.activeHours) return true;

    const [start, end] = area.activeHours;

    // Handle overnight ranges (z.B. 22-6)
    if (start > end) {
      return hour >= start || hour < end;
    }

    // Normal range (z.B. 8-18)
    return hour >= start && hour < end;
  });
}

/**
 * Findet Patrol Areas nach Priorität
 */
export function getPatrolAreasByPriority(priority: 'low' | 'medium' | 'high'): PatrolArea[] {
  return frankfurtPatrolAreas.filter(area => area.priority === priority);
}

/**
 * Findet Patrol Areas die bestimmte Incident Types abdecken
 */
export function getPatrolAreasForIncidentType(incidentType: string): PatrolArea[] {
  return frankfurtPatrolAreas.filter(area =>
    area.incidentTypes.includes(incidentType)
  );
}

/**
 * Wählt eine zufällige Patrol Area aus (gewichtet nach Priorität)
 */
export function getRandomPatrolArea(hour: number): PatrolArea {
  const activeAreas = getActivePatrolAreas(hour);

  // Gewichtung: high = 3x, medium = 2x, low = 1x
  const weights = activeAreas.map(area => {
    switch (area.priority) {
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
    }
  });

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < activeAreas.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return activeAreas[i];
    }
  }

  // Fallback (sollte nie erreicht werden)
  return activeAreas[0];
}
