// ⚡ Performance #8: Route-Caching mit LRU (Least Recently Used)

// 🔧 CACHE VERSION: Bei Änderungen am Koordinaten-Format erhöhen!
const CACHE_VERSION = 3; // v3: Cache nur in routeCalculator.ts (konvertierte Koordinaten)

interface CachedRoute {
  route: [number, number][];
  duration: number;
  distance: number;
  timestamp: number;
}

class RouteCache {
  private cache: Map<string, CachedRoute> = new Map();
  private readonly maxSize: number = 100; // Max 100 cached routes
  private readonly cacheDuration: number = 300000; // 5 Minuten

  constructor() {
    // Prüfe Cache-Version und lösche bei Version-Mismatch
    const storedVersion = localStorage.getItem('routeCacheVersion');
    if (storedVersion !== String(CACHE_VERSION)) {
      console.log(`🔄 Route-Cache Version ${storedVersion} → ${CACHE_VERSION}: Cache wird gelöscht`);
      this.clear();
      localStorage.setItem('routeCacheVersion', String(CACHE_VERSION));
    }
  }

  /**
   * Generiert Cache-Key aus Start- und Endposition
   */
  private getCacheKey(start: [number, number], end: [number, number]): string {
    // Runde auf 4 Dezimalstellen (~11 Meter Genauigkeit)
    const startRounded = [start[0].toFixed(4), start[1].toFixed(4)];
    const endRounded = [end[0].toFixed(4), end[1].toFixed(4)];
    return `${startRounded[0]},${startRounded[1]}-${endRounded[0]},${endRounded[1]}`;
  }

  /**
   * Holt Route aus Cache falls vorhanden und noch gültig
   */
  get(start: [number, number], end: [number, number]): CachedRoute | null {
    const key = this.getCacheKey(start, end);
    const cached = this.cache.get(key);

    if (!cached) {
      return null;
    }

    // Prüfe ob Cache noch gültig
    const age = Date.now() - cached.timestamp;
    if (age > this.cacheDuration) {
      this.cache.delete(key);
      return null;
    }

    // LRU: Bewege zu Ende (most recently used)
    this.cache.delete(key);
    this.cache.set(key, cached);

    return cached;
  }

  /**
   * Speichert Route im Cache
   */
  set(
    start: [number, number],
    end: [number, number],
    route: [number, number][],
    duration: number,
    distance: number
  ): void {
    const key = this.getCacheKey(start, end);

    // LRU: Wenn Cache voll, entferne ältesten Eintrag
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      route,
      duration,
      distance,
      timestamp: Date.now(),
    });
  }

  /**
   * Löscht gesamten Cache (z.B. bei Wetteränderung)
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Gibt Cache-Statistiken zurück
   */
  getStats(): { size: number; maxSize: number; hitRate: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: 0, // TODO: Implementiere Hit-Rate Tracking
    };
  }

  /**
   * Entfernt abgelaufene Einträge
   */
  cleanup(): void {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((value, key) => {
      const age = now - value.timestamp;
      if (age > this.cacheDuration) {
        toDelete.push(key);
      }
    });

    toDelete.forEach(key => this.cache.delete(key));
  }
}

export const routeCache = new RouteCache();

// Cleanup alle 60 Sekunden
if (typeof window !== 'undefined') {
  setInterval(() => {
    routeCache.cleanup();
  }, 60000);
}
