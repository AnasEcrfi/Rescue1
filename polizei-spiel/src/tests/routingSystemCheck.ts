// ✅ Routing-System Validierungs-Skript
// Dieses Skript prüft, ob alle kritischen Routing-Funktionen korrekt arbeiten

import {
  convertToLeafletFormat,
  getStraightLineRoute,
  calculateDistance,
  calculateBearing
} from '../services/routingService';
import { calculateStraightRoute, usesAirRoute } from '../utils/routeCalculator';

console.log('🔍 Starte Routing-System Validierung...\n');

let errors = 0;
let tests = 0;

function assert(condition: boolean, message: string) {
  tests++;
  if (!condition) {
    console.error(`❌ FEHLER: ${message}`);
    errors++;
  } else {
    console.log(`✅ ${message}`);
  }
}

// Test 1: Koordinaten-Konvertierung
console.log('📍 Test 1: Koordinaten-Konvertierung');
const osrmFormat: [number, number][] = [[8.6821, 50.1109]];
const leafletFormat = convertToLeafletFormat(osrmFormat);
assert(
  leafletFormat[0][0] === 50.1109 && leafletFormat[0][1] === 8.6821,
  'convertToLeafletFormat konvertiert [lng, lat] → [lat, lng]'
);

// Test 2: Distanz-Berechnung
console.log('\n📏 Test 2: Distanz-Berechnung');
const start = { lat: 50.1109, lng: 8.6821 };
const end = { lat: 50.1070, lng: 8.6647 };
const distance = calculateDistance(start, end);
assert(
  distance > 1300 && distance < 1700,
  `Distanz berechnet: ${Math.round(distance)}m (erwartet: ~1500m)`
);

// Test 3: Distanz für identische Punkte
const zeroDist = calculateDistance(start, start);
assert(
  zeroDist < 0.1,
  `Distanz für identische Punkte: ${zeroDist.toFixed(2)}m (erwartet: 0m)`
);

// Test 4: Bearing-Berechnung (Nord)
console.log('\n🧭 Test 3: Bearing-Berechnung');
const northStart: [number, number] = [50.0, 8.0];
const northEnd: [number, number] = [51.0, 8.0];
const northBearing = calculateBearing(northStart, northEnd);
assert(
  northBearing > -5 && northBearing < 5,
  `Nord-Bearing: ${northBearing.toFixed(1)}° (erwartet: ~0°)`
);

// Test 5: Bearing-Berechnung (Ost)
const eastStart: [number, number] = [50.0, 8.0];
const eastEnd: [number, number] = [50.0, 9.0];
const eastBearing = calculateBearing(eastStart, eastEnd);
assert(
  eastBearing > 85 && eastBearing < 95,
  `Ost-Bearing: ${eastBearing.toFixed(1)}° (erwartet: ~90°)`
);

// Test 6: Straight Line Route Format
console.log('\n🛣️ Test 4: Straight Line Route');
const straightRoute = getStraightLineRoute(start, end, 10);
assert(
  straightRoute.length === 11,
  `Straight Route hat 11 Punkte (10 Schritte + Start)`
);
assert(
  Math.abs(straightRoute[0][0] - start.lat) < 0.001,
  `Start-Punkt korrekt: [${straightRoute[0][0].toFixed(4)}, ${straightRoute[0][1].toFixed(4)}]`
);
assert(
  Math.abs(straightRoute[10][0] - end.lat) < 0.001,
  `End-Punkt korrekt: [${straightRoute[10][0].toFixed(4)}, ${straightRoute[10][1].toFixed(4)}]`
);

// Test 7: Calculate Straight Route
console.log('\n📦 Test 5: Calculate Straight Route');
const routeData = calculateStraightRoute(start, end, 20);
assert(
  routeData.path.length === 21,
  `Route Data hat 21 Punkte (20 Schritte + Start)`
);
assert(
  routeData.distance > 1300 && routeData.distance < 1700,
  `Route Data Distanz: ${Math.round(routeData.distance)}m`
);

// Test 8: Fahrzeug-Typen
console.log('\n🚁 Test 6: Fahrzeug-Typen');
assert(
  usesAirRoute('Polizeihubschrauber') === true,
  'Polizeihubschrauber nutzt Luftroute'
);
assert(
  usesAirRoute('Streifenwagen') === false,
  'Streifenwagen nutzt KEINE Luftroute'
);
assert(
  usesAirRoute('Zivilfahrzeug') === false,
  'Zivilfahrzeug nutzt KEINE Luftroute'
);

// Test 9: Edge Cases
console.log('\n⚠️ Test 7: Edge Cases');
const shortRoute = getStraightLineRoute(
  { lat: 50.1109, lng: 8.6821 },
  { lat: 50.1110, lng: 8.6822 },
  10
);
assert(
  shortRoute.length === 11,
  'Kurze Distanz wird korrekt behandelt'
);

const longDist = calculateDistance(
  { lat: 50.1109, lng: 8.6821 }, // Frankfurt
  { lat: 52.5200, lng: 13.4050 }  // Berlin
);
assert(
  longDist > 420000 && longDist < 430000,
  `Lange Distanz (Frankfurt→Berlin): ${Math.round(longDist / 1000)}km (erwartet: ~424km)`
);

const emptyConversion = convertToLeafletFormat([]);
assert(
  emptyConversion.length === 0,
  'Leeres Array wird korrekt behandelt'
);

// Zusammenfassung
console.log('\n' + '='.repeat(50));
console.log(`📊 ZUSAMMENFASSUNG: ${tests - errors}/${tests} Tests bestanden`);

if (errors === 0) {
  console.log('✅ Alle Tests erfolgreich! Routing-System ist intakt.');
  console.log('\n🎉 Das Routing-System funktioniert korrekt!');
} else {
  console.error(`\n❌ ${errors} Fehler gefunden! Routing-System ist KAPUTT!`);
  console.error('⚠️ Stelle die Original-Dateien wieder her:');
  console.error('   git show 0f18d96:polizei-spiel/src/services/routingService.ts > polizei-spiel/src/services/routingService.ts');
  console.error('   git show 0f18d96:polizei-spiel/src/utils/routeCalculator.ts > polizei-spiel/src/utils/routeCalculator.ts');
  process.exit(1);
}
