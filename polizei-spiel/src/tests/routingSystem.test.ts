// ✅ Tests für das Routing-System
// Diese Tests stellen sicher, dass die kritischen Routing-Funktionen korrekt arbeiten

import { describe, it, expect } from 'vitest';
import {
  convertToLeafletFormat,
  getStraightLineRoute,
  calculateDistance,
  calculateBearing
} from '../services/routingService';
import { calculateStraightRoute, usesAirRoute } from '../utils/routeCalculator';

describe('Routing System - Koordinaten-Konvertierung', () => {
  it('convertToLeafletFormat sollte [lng, lat] zu [lat, lng] konvertieren', () => {
    const osrmFormat: [number, number][] = [
      [8.6821, 50.1109], // [lng, lat] - OSRM Format
      [8.6647, 50.1070],
    ];

    const result = convertToLeafletFormat(osrmFormat);

    // Erwartung: [lat, lng] - Leaflet Format
    expect(result).toEqual([
      [50.1109, 8.6821],
      [50.1070, 8.6647],
    ]);
  });

  it('convertToLeafletFormat sollte leeres Array korrekt behandeln', () => {
    const result = convertToLeafletFormat([]);
    expect(result).toEqual([]);
  });

  it('convertToLeafletFormat sollte einzelnen Punkt korrekt konvertieren', () => {
    const osrmFormat: [number, number][] = [[8.6821, 50.1109]];
    const result = convertToLeafletFormat(osrmFormat);
    expect(result).toEqual([[50.1109, 8.6821]]);
  });
});

describe('Routing System - Distanz-Berechnung', () => {
  it('calculateDistance sollte korrekte Distanz zwischen zwei Punkten berechnen', () => {
    const start = { lat: 50.1109, lng: 8.6821 }; // Frankfurt Hauptbahnhof
    const end = { lat: 50.1070, lng: 8.6647 };   // ~1.5km entfernt

    const distance = calculateDistance(start, end);

    // Erwartung: Ungefähr 1500 Meter (±200m Toleranz)
    expect(distance).toBeGreaterThan(1300);
    expect(distance).toBeLessThan(1700);
  });

  it('calculateDistance sollte 0 für identische Punkte zurückgeben', () => {
    const point = { lat: 50.1109, lng: 8.6821 };
    const distance = calculateDistance(point, point);

    // Erwartung: 0 Meter (oder sehr nah an 0)
    expect(distance).toBeLessThan(0.1);
  });

  it('calculateDistance sollte symmetrisch sein', () => {
    const start = { lat: 50.1109, lng: 8.6821 };
    const end = { lat: 50.1070, lng: 8.6647 };

    const distanceAB = calculateDistance(start, end);
    const distanceBA = calculateDistance(end, start);

    // Erwartung: Distanz ist in beide Richtungen gleich
    expect(Math.abs(distanceAB - distanceBA)).toBeLessThan(0.01);
  });
});

describe('Routing System - Bearing-Berechnung', () => {
  it('calculateBearing sollte 0° für Nord-Richtung zurückgeben', () => {
    const start: [number, number] = [50.0, 8.0];
    const end: [number, number] = [51.0, 8.0]; // Genau nach Norden

    const bearing = calculateBearing(start, end);

    // Erwartung: ~0° (Norden), Toleranz ±5°
    expect(bearing).toBeGreaterThan(-5);
    expect(bearing).toBeLessThan(5);
  });

  it('calculateBearing sollte 90° für Ost-Richtung zurückgeben', () => {
    const start: [number, number] = [50.0, 8.0];
    const end: [number, number] = [50.0, 9.0]; // Genau nach Osten

    const bearing = calculateBearing(start, end);

    // Erwartung: ~90° (Osten), Toleranz ±5°
    expect(bearing).toBeGreaterThan(85);
    expect(bearing).toBeLessThan(95);
  });

  it('calculateBearing sollte 180° für Süd-Richtung zurückgeben', () => {
    const start: [number, number] = [50.0, 8.0];
    const end: [number, number] = [49.0, 8.0]; // Genau nach Süden

    const bearing = calculateBearing(start, end);

    // Erwartung: ~180° (Süden), Toleranz ±5°
    expect(bearing).toBeGreaterThan(175);
    expect(bearing).toBeLessThan(185);
  });

  it('calculateBearing sollte 270° für West-Richtung zurückgeben', () => {
    const start: [number, number] = [50.0, 8.0];
    const end: [number, number] = [50.0, 7.0]; // Genau nach Westen

    const bearing = calculateBearing(start, end);

    // Erwartung: ~270° (Westen), Toleranz ±5°
    expect(bearing).toBeGreaterThan(265);
    expect(bearing).toBeLessThan(275);
  });
});

describe('Routing System - Straight Line Route', () => {
  it('getStraightLineRoute sollte [lat, lng] Format zurückgeben', () => {
    const start = { lat: 50.1109, lng: 8.6821 };
    const end = { lat: 50.1070, lng: 8.6647 };

    const route = getStraightLineRoute(start, end, 10);

    // Erwartung: Array mit 11 Punkten (10 Schritte + Start)
    expect(route.length).toBe(11);

    // Prüfe Format: Jeder Punkt sollte [lat, lng] sein
    route.forEach(point => {
      expect(point).toHaveLength(2);
      expect(point[0]).toBeGreaterThan(49); // Latitude ~50
      expect(point[0]).toBeLessThan(51);
      expect(point[1]).toBeGreaterThan(7);  // Longitude ~8
      expect(point[1]).toBeLessThan(10);
    });

    // Start und Ende sollten korrekt sein
    expect(route[0][0]).toBeCloseTo(start.lat, 3);
    expect(route[0][1]).toBeCloseTo(start.lng, 3);
    expect(route[10][0]).toBeCloseTo(end.lat, 3);
    expect(route[10][1]).toBeCloseTo(end.lng, 3);
  });

  it('calculateStraightRoute sollte path und distance zurückgeben', () => {
    const start = { lat: 50.1109, lng: 8.6821 };
    const end = { lat: 50.1070, lng: 8.6647 };

    const result = calculateStraightRoute(start, end, 20);

    // Erwartung: Objekt mit path und distance
    expect(result).toHaveProperty('path');
    expect(result).toHaveProperty('distance');
    expect(Array.isArray(result.path)).toBe(true);
    expect(result.path.length).toBe(21); // 20 Schritte + Start
    expect(result.distance).toBeGreaterThan(1000);
    expect(result.distance).toBeLessThan(2000);
  });
});

describe('Routing System - Fahrzeug-Typen', () => {
  it('usesAirRoute sollte true für Polizeihubschrauber zurückgeben', () => {
    expect(usesAirRoute('Polizeihubschrauber')).toBe(true);
  });

  it('usesAirRoute sollte false für Streifenwagen zurückgeben', () => {
    expect(usesAirRoute('Streifenwagen')).toBe(false);
  });

  it('usesAirRoute sollte false für Zivilfahrzeug zurückgeben', () => {
    expect(usesAirRoute('Zivilfahrzeug')).toBe(false);
  });

  it('usesAirRoute sollte false für Mannschaftswagen zurückgeben', () => {
    expect(usesAirRoute('Mannschaftswagen')).toBe(false);
  });

  it('usesAirRoute sollte false für Wasserwerfer zurückgeben', () => {
    expect(usesAirRoute('Wasserwerfer')).toBe(false);
  });
});

describe('Routing System - Edge Cases', () => {
  it('getStraightLineRoute sollte mit sehr kurzer Distanz umgehen können', () => {
    const start = { lat: 50.1109, lng: 8.6821 };
    const end = { lat: 50.1110, lng: 8.6822 }; // Nur ~100m entfernt

    const route = getStraightLineRoute(start, end, 10);

    expect(route.length).toBe(11);
    expect(route[0][0]).toBeCloseTo(start.lat, 4);
    expect(route[10][0]).toBeCloseTo(end.lat, 4);
  });

  it('calculateDistance sollte mit sehr langen Distanzen umgehen können', () => {
    const frankfurt = { lat: 50.1109, lng: 8.6821 };
    const berlin = { lat: 52.5200, lng: 13.4050 };

    const distance = calculateDistance(frankfurt, berlin);

    // Erwartung: ~424 km Luftlinie
    expect(distance).toBeGreaterThan(420000); // 420 km
    expect(distance).toBeLessThan(430000); // 430 km
  });

  it('convertToLeafletFormat sollte mit vielen Punkten umgehen können', () => {
    const largeArray: [number, number][] = Array.from({ length: 1000 }, (_, i) => [
      8.6821 + i * 0.001,
      50.1109 + i * 0.001,
    ]);

    const result = convertToLeafletFormat(largeArray);

    expect(result.length).toBe(1000);
    expect(result[0]).toEqual([50.1109, 8.6821]);
    expect(result[999]).toEqual([50.1109 + 999 * 0.001, 8.6821 + 999 * 0.001]);
  });
});
