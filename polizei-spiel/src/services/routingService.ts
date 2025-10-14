// OSRM Routing Service für echte Straßen-Navigation

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface OSRMRoute {
  coordinates: [number, number][]; // [lng, lat] format from OSRM
  distance: number; // in meters
  duration: number; // in seconds
}

/**
 * Holt echte Straßenroute von OSRM API (mit Caching)
 * @param start Startpunkt {lat, lng}
 * @param end Zielpunkt {lat, lng}
 * @returns Route mit Koordinaten, Distanz und Dauer
 */
export async function getRoute(start: RoutePoint, end: RoutePoint): Promise<OSRMRoute | null> {
  console.log('📡 Lade Route von OSRM API');

  try {
    // OSRM erwartet Koordinaten im Format: lng,lat;lng,lat
    const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`;
    const url = `${OSRM_BASE_URL}/${coordinates}?overview=full&geometries=geojson`;

    const response = await fetch(url, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // 5 Sekunden Timeout
    });

    if (!response.ok) {
      console.warn(`⚠️ OSRM API nicht verfügbar (${response.status} ${response.statusText}), nutze Fallback-Route`);
      return null;
    }

    const data = await response.json();

    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
      console.warn('⚠️ OSRM konnte keine Route finden, nutze Fallback-Route');
      return null;
    }

    const route = data.routes[0];

    const result: OSRMRoute = {
      coordinates: route.geometry.coordinates, // [lng, lat] format from OSRM
      distance: route.distance,
      duration: route.duration,
    };

    console.log('✓ OSRM Route empfangen');

    return result;
  } catch (error) {
    if (error instanceof Error && error.name === 'TimeoutError') {
      console.warn('⚠️ OSRM API Timeout, nutze Fallback-Route');
    } else {
      console.warn('⚠️ OSRM API nicht erreichbar, nutze Fallback-Route:', error);
    }
    return null;
  }
}

/**
 * Konvertiert OSRM Koordinaten ([lng, lat]) zu Leaflet Format ([lat, lng])
 */
export function convertToLeafletFormat(coordinates: [number, number][]): [number, number][] {
  return coordinates.map(([lng, lat]) => [lat, lng]);
}

/**
 * Easing-Funktion für smooth acceleration/deceleration (easeInOutCubic)
 */
export function easeInOutCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

/**
 * Berechnet Zwischenpunkt entlang einer Route mit smooth easing
 * @param route Array von Koordinaten [lat, lng]
 * @param progress Fortschritt von 0 bis 1
 * @param useEasing Optional: Anwenden von Easing für smooth acceleration
 * @returns Aktueller Punkt auf der Route plus Richtung
 */
export function getPointAlongRoute(
  route: [number, number][],
  progress: number,
  useEasing: boolean = true
): { position: [number, number], bearing: number } {
  if (route.length === 0) return { position: [0, 0], bearing: 0 };
  if (progress <= 0) return { position: route[0], bearing: 0 };
  if (progress >= 1) return { position: route[route.length - 1], bearing: 0 };

  // Apply easing for smooth acceleration/deceleration
  const easedProgress = useEasing ? easeInOutCubic(progress) : progress;

  const totalSegments = route.length - 1;
  const targetSegment = easedProgress * totalSegments;
  const segmentIndex = Math.floor(targetSegment);
  const segmentProgress = targetSegment - segmentIndex;

  if (segmentIndex >= route.length - 1) {
    return { position: route[route.length - 1], bearing: 0 };
  }

  const start = route[segmentIndex];
  const end = route[segmentIndex + 1];

  // Smooth interpolation zwischen zwei Punkten
  const lat = start[0] + (end[0] - start[0]) * segmentProgress;
  const lng = start[1] + (end[1] - start[1]) * segmentProgress;

  // Berechne Fahrtrichtung (bearing) für Fahrzeugrotation
  const bearing = calculateBearing(start, end);

  return { position: [lat, lng], bearing };
}

/**
 * Berechnet die Richtung (bearing) zwischen zwei Punkten
 * @returns Winkel in Grad (0-360)
 */
export function calculateBearing(start: [number, number], end: [number, number]): number {
  const lat1 = start[0] * Math.PI / 180;
  const lat2 = end[0] * Math.PI / 180;
  const dLng = (end[1] - start[1]) * Math.PI / 180;

  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) -
            Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);

  const bearing = Math.atan2(y, x) * 180 / Math.PI;

  return (bearing + 360) % 360;
}

/**
 * Fallback: Realistische Route mit Straßen-Simulation wenn OSRM nicht verfügbar
 * Erstellt eine Route die echte Straßenverläufe mit Abbiegungen simuliert
 */
export function getStraightLineRoute(start: RoutePoint, end: RoutePoint, steps: number = 50): [number, number][] {
  console.log('🛣️ Erstelle Fallback-Route mit Kurven/Abbiegungen');
  const route: [number, number][] = [];

  // Berechne Distanz um Anzahl der Schritte anzupassen
  const distance = calculateDistance(start, end);
  const adaptiveSteps = Math.max(40, Math.min(120, Math.floor(distance / 40))); // Ein Punkt alle 40m
  console.log(`📏 Distanz: ${Math.round(distance)}m, Punkte: ${adaptiveSteps}`);

  // Nutze eine Mischung aus direkter Route und Manhattan-Distance (rechtwinklige Straßen)
  const useManhattan = Math.random() > 0.5; // 50% Chance für Manhattan-Stil
  console.log(`🏙️ Route-Typ: ${useManhattan && distance > 500 ? 'Manhattan-Style (Abbiegungen)' : 'Diagonal mit Kurven'}`);

  if (useManhattan && distance > 500) {
    // Manhattan-Route: Erst horizontal, dann vertikal (wie Stadtstraßen)
    const turnPoint = 0.4 + Math.random() * 0.2; // Abbiegepunkt zwischen 40-60% der Route

    for (let i = 0; i <= adaptiveSteps; i++) {
      const ratio = i / adaptiveSteps;
      let lat, lng;

      if (ratio < turnPoint) {
        // Erste Phase: Hauptsächlich horizontal
        const localRatio = ratio / turnPoint;
        lat = start.lat + (end.lat - start.lat) * localRatio * 0.3; // Wenig vertikale Bewegung
        lng = start.lng + (end.lng - start.lng) * localRatio; // Volle horizontale Bewegung
      } else {
        // Zweite Phase: Hauptsächlich vertikal
        const localRatio = (ratio - turnPoint) / (1 - turnPoint);
        lat = start.lat + (end.lat - start.lat) * (0.3 + localRatio * 0.7); // Rest der vertikalen Bewegung
        lng = end.lng; // Bleibe auf der Ziellinie
      }

      // Füge leichte Unregelmäßigkeiten hinzu (kleine Kurven)
      const noise = (Math.random() - 0.5) * 0.00008;
      lat += noise;
      lng += noise;

      route.push([lat, lng]); // TEMPORARY FIX: Zurück zu [lat, lng]
    }
  } else {
    // Diagonale Route mit realistischen Kurven
    for (let i = 0; i <= adaptiveSteps; i++) {
      const ratio = i / adaptiveSteps;

      // Basis-Interpolation
      const baseLat = start.lat + (end.lat - start.lat) * ratio;
      const baseLng = start.lng + (end.lng - start.lng) * ratio;

      // Füge natürliche Kurven hinzu (Straßen sind nie perfekt gerade)
      const curveIntensity = 0.0002; // Stärkere Kurven für sichtbarere Straßen
      const curveFrequency = 2 + Math.random() * 2; // 2-4 Kurven zufällig

      // Kombiniere mehrere Sinus-Wellen für natürlichere Kurven
      const offset1 = Math.sin(ratio * Math.PI * curveFrequency) * curveIntensity;
      const offset2 = Math.sin(ratio * Math.PI * curveFrequency * 1.7) * curveIntensity * 0.5;
      const totalOffset = offset1 + offset2;

      // Anwende Offset senkrecht zur Fahrtrichtung
      const angle = Math.atan2(end.lng - start.lng, end.lat - start.lat);
      const perpAngle = angle + Math.PI / 2;

      const lat = baseLat + Math.cos(perpAngle) * totalOffset;
      const lng = baseLng + Math.sin(perpAngle) * totalOffset;

      route.push([lat, lng]); // TEMPORARY FIX: Zurück zu [lat, lng]
    }
  }

  return route;
}

/**
 * Berechnet Luftlinien-Distanz zwischen zwei Punkten (Haversine-Formel)
 * @returns Distanz in Metern
 */
export function calculateDistance(start: RoutePoint, end: RoutePoint): number {
  const R = 6371000; // Erdradius in Metern
  const lat1 = start.lat * Math.PI / 180;
  const lat2 = end.lat * Math.PI / 180;
  const deltaLat = (end.lat - start.lat) * Math.PI / 180;
  const deltaLng = (end.lng - start.lng) * Math.PI / 180;

  const a = Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}
