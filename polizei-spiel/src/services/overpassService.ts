// Service to fetch real POI data from OpenStreetMap via Overpass API

// ============================================================================
// EXPORTED INTERFACES
// ============================================================================

export interface OverpassGasStation {
  id: number;
  name: string;
  brand: string;
  lat: number;
  lon: number;
}

export interface OverpassPoliceStation {
  id: number;
  name: string;
  lat: number;
  lon: number;
}

// ============================================================================
// INTERNAL INTERFACES (Overpass API Response Types)
// ============================================================================

/**
 * Overpass API Element Type
 * Kann ein Node oder Way sein
 */
interface OverpassElement {
  id?: number;
  lat?: number;      // Für nodes
  lon?: number;      // Für nodes
  center?: {         // Für ways
    lat: number;
    lon: number;
  };
  tags?: {
    name?: string;
    brand?: string;
    operator?: string;
    [key: string]: string | undefined;  // Weitere Tags
  };
}

/**
 * Overpass API Response
 */
interface OverpassResponse {
  version?: number;
  generator?: string;
  elements: OverpassElement[];
}

/**
 * Fetch real gas stations from OpenStreetMap for Frankfurt area
 * Using Overpass API to get amenity=fuel with brand information
 */
export async function fetchGasStationsFromOSM(): Promise<OverpassGasStation[]> {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';

  // Overpass QL query für Frankfurt bounding box
  // Reduziertes Timeout (15s statt 25s) um schneller auf Probleme zu reagieren
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="fuel"](50.08,8.60,50.15,8.75);
      way["amenity"="fuel"](50.08,8.60,50.15,8.75);
    );
    out center;
  `;

  try {
    const response = await fetchWithRetry(overpassUrl, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }, 3); // 3 Versuche mit exponential backoff

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data: OverpassResponse = await response.json();

    console.log(`📍 OSM API returned ${data.elements?.length || 0} fuel stations`);

    // Parse OSM data to our format
    const gasStations: OverpassGasStation[] = [];
    const brandSet = new Set<string>();

    data.elements.forEach((element: OverpassElement, index: number) => {
      // Get coordinates (for nodes, use lat/lon directly; for ways, use center)
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      if (!lat || !lon) {
        console.warn('⚠️ Skipping station without coordinates:', element);
        return;
      }

      // Get brand and name from tags
      const brand = element.tags?.brand || element.tags?.operator || 'Unknown';
      const name = element.tags?.name || `${brand} Tankstelle`;

      brandSet.add(brand);

      // Include ALL stations (removed brand filter)
      gasStations.push({
        id: element.id || index + 1000,
        name,
        brand,
        lat,
        lon,
      });

      // Debug: Log first 5 stations
      if (index < 5) {
        console.log(`  ${index + 1}. ${brand} | ${name} | [${lat.toFixed(6)}, ${lon.toFixed(6)}]`);
      }
    });

    console.log(`✓ Successfully loaded ${gasStations.length} gas stations from OpenStreetMap`);
    console.log('📊 Gefundene Tankstellen-Brands:', Array.from(brandSet).sort().join(', '));
    return gasStations;

  } catch (error) {
    console.error('Failed to fetch gas stations from OSM:', error);
    // Return empty array on error - fallback to static data
    return [];
  }
}

/**
 * Hilfsfunktion: Retry mit exponential backoff
 */
async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 3): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      console.log(`🔄 Overpass API Versuch ${attempt + 1}/${maxRetries}`);
      const response = await fetch(url, options);

      // Bei 504 Gateway Timeout: Retry
      if (response.status === 504 && attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.warn(`⏳ 504 Timeout - Warte ${backoffMs}ms und versuche erneut...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
        continue;
      }

      return response;
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries - 1) {
        const backoffMs = Math.pow(2, attempt) * 1000;
        console.warn(`⏳ Netzwerkfehler - Warte ${backoffMs}ms und versuche erneut...`);
        await new Promise(resolve => setTimeout(resolve, backoffMs));
      }
    }
  }

  throw lastError || new Error('Alle Retry-Versuche fehlgeschlagen');
}

/**
 * Fetch real police stations from OpenStreetMap for Frankfurt area
 * Using Overpass API to get amenity=police
 */
export async function fetchPoliceStationsFromOSM(): Promise<OverpassPoliceStation[]> {
  const overpassUrl = 'https://overpass-api.de/api/interpreter';

  // Overpass QL query für Frankfurt bounding box
  // Reduziertes Timeout (15s statt 25s) um schneller auf Probleme zu reagieren
  const query = `
    [out:json][timeout:15];
    (
      node["amenity"="police"](50.08,8.60,50.15,8.75);
      way["amenity"="police"](50.08,8.60,50.15,8.75);
    );
    out body center;
  `;

  try {
    const response = await fetchWithRetry(overpassUrl, {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    }, 3); // 3 Versuche mit exponential backoff

    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`);
    }

    const data: OverpassResponse = await response.json();

    console.log(`🚔 OSM API returned ${data.elements?.length || 0} police stations`);

    // Parse OSM data to our format
    const policeStations: OverpassPoliceStation[] = [];

    data.elements.forEach((element: OverpassElement, index: number) => {
      // Get coordinates (for nodes, use lat/lon directly; for ways, use center)
      const lat = element.lat || element.center?.lat;
      const lon = element.lon || element.center?.lon;

      if (!lat || !lon) {
        console.warn('⚠️ Skipping police station without coordinates:', element);
        return;
      }

      // Get name from tags
      const name = element.tags?.name || `Polizeirevier ${index + 1}`;

      policeStations.push({
        id: element.id || index + 2000,
        name,
        lat,
        lon,
      });

      // Debug: Log first 5 stations
      if (index < 5) {
        console.log(`  ${index + 1}. ${name} | [${lat.toFixed(6)}, ${lon.toFixed(6)}]`);
      }
    });

    console.log(`✓ Successfully loaded ${policeStations.length} police stations from OpenStreetMap`);
    return policeStations;

  } catch (error) {
    console.error('Failed to fetch police stations from OSM:', error);
    // Return empty array on error - fallback to static data
    return [];
  }
}
