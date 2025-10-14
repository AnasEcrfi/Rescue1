// Echte Points of Interest (POIs) in Frankfurt am Main
// Kategorisiert nach Typ für realistische Einsatz-Kontexte

export type POICategory =
  | 'school'
  | 'bank'
  | 'hospital'
  | 'shopping'
  | 'restaurant'
  | 'hotel'
  | 'office'
  | 'residential'
  | 'park'
  | 'station'
  | 'museum'
  | 'nightlife'
  | 'university'
  | 'landmark'; // NEU: Berühmte Wahrzeichen

export interface POI {
  name: string;
  position: [number, number];
  category: POICategory;
  description: string; // Kurzbeschreibung für Kontext
}

// Echte Frankfurt POIs nach Kategorie
export const frankfurtPOIs: POI[] = [
  // SCHULEN
  {
    name: 'Goethe-Gymnasium',
    position: [50.1189, 8.6753],
    category: 'school',
    description: 'Gymnasium mit ca. 800 Schülern',
  },
  {
    name: 'Carl-Schurz-Schule',
    position: [50.1265, 8.6891],
    category: 'school',
    description: 'Große Gesamtschule im Nordend',
  },
  {
    name: 'Liebigschule Frankfurt',
    position: [50.1156, 8.6598],
    category: 'school',
    description: 'Traditionsreiches Gymnasium',
  },
  {
    name: 'Freiligrathschule',
    position: [50.1094, 8.6589],
    category: 'school',
    description: 'Grundschule im Bahnhofsviertel',
  },

  // BANKEN
  {
    name: 'Commerzbank Tower',
    position: [50.1125, 8.6724],
    category: 'bank',
    description: 'Hauptsitz Commerzbank, Hochhaus',
  },
  {
    name: 'Deutsche Bank Hauptfiliale',
    position: [50.1131, 8.6798],
    category: 'bank',
    description: 'Hauptfiliale in der Innenstadt',
  },
  {
    name: 'Sparkasse 1822 Hauptwache',
    position: [50.1138, 8.6788],
    category: 'bank',
    description: 'Sparkasse direkt an der Hauptwache',
  },
  {
    name: 'DZ Bank Hochhaus',
    position: [50.1156, 8.6745],
    category: 'bank',
    description: 'Bankgebäude Westend',
  },

  // KRANKENHÄUSER
  {
    name: 'Universitätsklinikum Frankfurt',
    position: [50.0981, 8.6706],
    category: 'hospital',
    description: 'Großes Universitätsklinikum',
  },
  {
    name: 'St. Katharinen-Krankenhaus',
    position: [50.1042, 8.6624],
    category: 'hospital',
    description: 'Krankenhaus in Sachsenhausen',
  },

  // SHOPPING
  {
    name: 'Zeil Galerie Kaufhof',
    position: [50.1147, 8.6835],
    category: 'shopping',
    description: 'Großes Kaufhaus auf der Zeil',
  },
  {
    name: 'MyZeil Shopping-Center',
    position: [50.1151, 8.6862],
    category: 'shopping',
    description: 'Modernes Einkaufszentrum',
  },
  {
    name: 'Galeria Hauptwache',
    position: [50.1135, 8.6795],
    category: 'shopping',
    description: 'Kaufhaus an der Hauptwache',
  },
  {
    name: 'Kleinmarkthalle Frankfurt',
    position: [50.1129, 8.6813],
    category: 'shopping',
    description: 'Traditioneller Markt',
  },

  // RESTAURANTS & BARS
  {
    name: 'Apfelwein Wagner',
    position: [50.1018, 8.6756],
    category: 'restaurant',
    description: 'Traditionelles Apfelwein-Lokal',
  },
  {
    name: 'Restaurant Margarete',
    position: [50.1145, 8.6842],
    category: 'restaurant',
    description: 'Gehobenes Restaurant auf der Zeil',
  },
  {
    name: 'Römer Pils Brunnen',
    position: [50.1106, 8.6824],
    category: 'restaurant',
    description: 'Gaststätte am Römerberg',
  },

  // HOTELS
  {
    name: 'Jumeirah Frankfurt',
    position: [50.1163, 8.6721],
    category: 'hotel',
    description: '5-Sterne Luxushotel',
  },
  {
    name: 'Steigenberger Frankfurter Hof',
    position: [50.1145, 8.6714],
    category: 'hotel',
    description: 'Traditionelles Grand Hotel',
  },
  {
    name: 'Motel One Hauptbahnhof',
    position: [50.1078, 8.6652],
    category: 'hotel',
    description: 'Budget-Hotel am Bahnhof',
  },

  // BÜROS
  {
    name: 'Messeturm Frankfurt',
    position: [50.1117, 8.6458],
    category: 'office',
    description: 'Hochhaus mit Büros',
  },
  {
    name: 'Westend Tower',
    position: [50.1178, 8.6621],
    category: 'office',
    description: 'Büro-Hochhaus im Westend',
  },
  {
    name: 'Main Tower',
    position: [50.1128, 8.6713],
    category: 'office',
    description: 'Büro-Hochhaus mit Aussichtsplattform',
  },

  // WOHNGEBIETE
  {
    name: 'Wohnblock Gallus',
    position: [50.1078, 8.6389],
    category: 'residential',
    description: 'Wohnviertel Gallus',
  },
  {
    name: 'Nordend Wohnstraße',
    position: [50.1245, 8.6989],
    category: 'residential',
    description: 'Ruhiges Wohngebiet Nordend',
  },
  {
    name: 'Sachsenhausen Altstadt',
    position: [50.1036, 8.6823],
    category: 'residential',
    description: 'Altstadt-Wohngebiet',
  },

  // PARKS
  {
    name: 'Palmengarten',
    position: [50.1223, 8.6613],
    category: 'park',
    description: 'Botanischer Garten',
  },
  {
    name: 'Grüneburgpark',
    position: [50.1289, 8.6589],
    category: 'park',
    description: 'Großer Stadtpark',
  },
  {
    name: 'Bethmannpark',
    position: [50.1178, 8.7012],
    category: 'park',
    description: 'Park im Nordend',
  },

  // BAHNHÖFE/VERKEHR
  {
    name: 'Frankfurt Hauptbahnhof',
    position: [50.1070, 8.6638],
    category: 'station',
    description: 'Hauptbahnhof',
  },
  {
    name: 'Konstablerwache',
    position: [50.1156, 8.6924],
    category: 'station',
    description: 'U-Bahn Station Konstablerwache',
  },
  {
    name: 'Hauptwache',
    position: [50.1136, 8.6791],
    category: 'station',
    description: 'Zentrale U-Bahn Station',
  },

  // MUSEEN/KULTUR
  {
    name: 'Städel Museum',
    position: [50.1035, 8.6734],
    category: 'museum',
    description: 'Kunstmuseum',
  },
  {
    name: 'Senckenberg Naturmuseum',
    position: [50.1173, 8.6512],
    category: 'museum',
    description: 'Naturkundemuseum',
  },
  {
    name: 'Alte Oper Frankfurt',
    position: [50.1158, 8.6726],
    category: 'museum',
    description: 'Konzerthaus',
  },

  // NACHTLEBEN
  {
    name: 'Cocoon Club',
    position: [50.1089, 8.6445],
    category: 'nightlife',
    description: 'Bekannter Techno-Club',
  },
  {
    name: 'King Kamehameha Club',
    position: [50.0989, 8.6712],
    category: 'nightlife',
    description: 'Club am Mainufer',
  },
  {
    name: 'Bar Shuka',
    position: [50.1142, 8.6834],
    category: 'nightlife',
    description: 'Cocktailbar Innenstadt',
  },

  // UNIVERSITÄTEN
  {
    name: 'Goethe-Universität Campus Westend',
    position: [50.1278, 8.6644],
    category: 'university',
    description: 'Hauptcampus der Universität',
  },
  {
    name: 'Frankfurt School of Finance',
    position: [50.1298, 8.6578],
    category: 'university',
    description: 'Business School',
  },

  // NEU: FRANKFURT-LANDMARKS (Berühmte Wahrzeichen)
  {
    name: 'Römerberg',
    position: [50.1106, 8.6824],
    category: 'landmark',
    description: 'Historischer Marktplatz, Wahrzeichen Frankfurts',
  },
  {
    name: 'Paulskirche',
    position: [50.1108, 8.6812],
    category: 'landmark',
    description: 'Historische Kirche, Symbol der Demokratie',
  },
  {
    name: 'Eiserner Steg',
    position: [50.1078, 8.6823],
    category: 'landmark',
    description: 'Berühmte Fußgängerbrücke über den Main',
  },
  {
    name: 'Zeil',
    position: [50.1151, 8.6862],
    category: 'landmark',
    description: 'Deutschlands meistbesuchte Einkaufsstraße',
  },
  {
    name: 'Bahnhofsviertel',
    position: [50.1067, 8.6589],
    category: 'landmark',
    description: 'Multikulturelles Viertel am Hauptbahnhof',
  },
  {
    name: 'Frankfurter Messe',
    position: [50.1117, 8.6458],
    category: 'landmark',
    description: 'Eines der größten Messegelände der Welt',
  },
  {
    name: 'Maintower Aussichtsplattform',
    position: [50.1128, 8.6713],
    category: 'landmark',
    description: 'Aussichtsplattform mit Blick über Frankfurt',
  },
  {
    name: 'Bockenheimer Warte',
    position: [50.1256, 8.6556],
    category: 'landmark',
    description: 'Historisches Stadttor',
  },
  {
    name: 'Kleinmarkthalle',
    position: [50.1129, 8.6813],
    category: 'landmark',
    description: 'Traditioneller Markt seit 1954',
  },
  {
    name: 'Alte Oper',
    position: [50.1158, 8.6726],
    category: 'landmark',
    description: 'Konzerthaus und Wahrzeichen',
  },
  {
    name: 'Eschenheimer Turm',
    position: [50.1172, 8.6789],
    category: 'landmark',
    description: 'Mittelalterlicher Wehrturm',
  },
  {
    name: 'Sachsenhausen Altstadt',
    position: [50.1036, 8.6823],
    category: 'landmark',
    description: 'Traditionelles Apfelwein-Viertel',
  },
  {
    name: 'Goethehaus',
    position: [50.1112, 8.6802],
    category: 'landmark',
    description: 'Geburtshaus von Johann Wolfgang von Goethe',
  },
  {
    name: 'Europäische Zentralbank',
    position: [50.0889, 8.6978],
    category: 'landmark',
    description: 'Hauptsitz der EZB',
  },
  {
    name: 'Museumsufer',
    position: [50.1035, 8.6734],
    category: 'landmark',
    description: 'Museumsmeile am Mainufer',
  },
];

// Helper: Hole POIs nach Kategorie
export const getPOIsByCategory = (category: POICategory): POI[] => {
  return frankfurtPOIs.filter(poi => poi.category === category);
};

// Helper: Hole zufälligen POI nach Kategorie
export const getRandomPOI = (category?: POICategory): POI => {
  const pois = category ? getPOIsByCategory(category) : frankfurtPOIs;
  return pois[Math.floor(Math.random() * pois.length)];
};

// Helper: Finde passende POI-Kategorie für Einsatztyp
export const getPOICategoryForIncident = (incidentType: string): POICategory | null => {
  const mapping: { [key: string]: POICategory } = {
    'Banküberfall': 'bank',
    'Geiselnahme': 'bank', // Oft in Banken/Büros
    'Einbruch': 'residential',
    'Häusliche Gewalt': 'residential',
    'Ruhestörung': 'residential',
    'Diebstahl': 'shopping',
    'Raub': 'station', // Oft an Bahnhöfen/öffentlichen Plätzen
    'Schlägerei': 'nightlife',
    'Vandalismus': 'park',
    'Demonstration': 'office', // Oft vor Bürogebäuden
    'Verkehrsunfall': 'station', // Oft in der Nähe von Verkehrsknotenpunkten
    'Verdächtige Person': 'school',
  };

  return mapping[incidentType] || null;
};
