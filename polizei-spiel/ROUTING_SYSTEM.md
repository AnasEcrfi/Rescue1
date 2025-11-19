# 🚨 ROUTING-SYSTEM - WICHTIGE DOKUMENTATION

## ⚠️ KRITISCHE DATEIEN - NICHT ÄNDERN!

Diese Dateien sind die **ORIGINAL-VERSIONEN** aus dem ersten Commit (`0f18d96`) und dürfen **NIEMALS** geändert werden, da sonst das gesamte Routing-System zusammenbricht!

### Kritische Dateien:
1. **`src/services/routingService.ts`**
2. **`src/utils/routeCalculator.ts`**
3. **`src/utils/routeCache.ts`**

---

## 🔧 Wie das System funktioniert

### 1. Koordinaten-Formate

Es gibt **zwei verschiedene Koordinaten-Formate**:

- **OSRM-API Format**: `[lng, lat]` (Longitude zuerst!)
- **Leaflet/Spiel Format**: `[lat, lng]` (Latitude zuerst!)

### 2. Routing-Ablauf

```
Start
  ↓
calculateRoute() [routeCalculator.ts]
  ↓
Ist Helikopter?
  ├─ JA → calculateStraightRoute() → Luftlinie
  └─ NEIN → getRoute() [routingService.ts]
       ↓
   Cache prüfen?
       ├─ TREFFER → Return gecachte Route
       └─ MISS → OSRM API Call
            ↓
        Erfolg?
            ├─ JA → convertToLeafletFormat() → Cache speichern → Return
            └─ NEIN → Fallback: calculateStraightRoute()
```

### 3. Wichtige Funktionen

#### `getRoute()` in `routingService.ts`
- Holt Route von OSRM API
- **Cache-Prüfung erfolgt INTERN** (nicht extern!)
- Returns `OSRMRoute` im Format `[lng, lat]`
- Bei Fehler: Returns `null` (Fallback wird extern gehandhabt)

#### `getStraightLineRoute()` in `routingService.ts`
- Erstellt Fallback-Route mit realistischen Kurven
- **Returns bereits [lat, lng] Format** (nicht [lng, lat]!)
- Simuliert Manhattan-Straßen oder Diagonal-Routen

#### `calculateStraightRoute()` in `routeCalculator.ts`
- Nutzt `getStraightLineRoute()`
- **Wendet `convertToLeafletFormat()` auf das Ergebnis an**
- Warum? Weil Original-Code es so macht (nicht ändern!)

#### `calculateRoute()` in `routeCalculator.ts`
- Main Entry Point für alle Routing-Anfragen
- Entscheidet: OSRM vs. Luftlinie
- Cached extern (zusätzlich zu internem Cache in `getRoute()`)

---

## 🚫 Häufige Fehler (NICHT MACHEN!)

### ❌ Fehler 1: Double-Conversion entfernen
```typescript
// FALSCH:
export const calculateStraightRoute = (from, to) => {
  const straightRoute = getStraightLineRoute(from, to);
  return { path: straightRoute }; // ❌ FEHLT convertToLeafletFormat()
};
```

**Warum falsch?** Original-Code wendet die Conversion an, auch wenn es redundant scheint!

### ❌ Fehler 2: Cache extern entfernen
```typescript
// FALSCH:
const osrmRoute = await getRoute(from, to);
// Keine externe Cache-Prüfung hier! ❌
```

**Warum falsch?** Es gibt **zwei Cache-Ebenen**: intern in `getRoute()` UND extern in `calculateRoute()`!

### ❌ Fehler 3: Koordinaten-Format "fixen"
```typescript
// FALSCH:
const coordinates = `${start.lat},${start.lng};${end.lat},${end.lng}`; // ❌
// RICHTIG:
const coordinates = `${start.lng},${start.lat};${end.lng},${end.lat}`; // ✅
```

**Warum falsch?** OSRM erwartet `[lng, lat]`, nicht `[lat, lng]`!

---

## 🔍 Debugging

### Route funktioniert nicht?

1. **Check Console Logs:**
   ```
   📡 CACHE MISS: Lade Route von OSRM API
   [OSRM SUCCESS] Route berechnet: 142 Punkte, 2.45km
   ```

2. **OSRM API erreichbar?**
   ```bash
   curl "https://router.project-osrm.org/route/v1/driving/8.6821,50.1109;8.6647,50.1070?overview=full&geometries=geojson"
   ```

3. **Fallback aktiv?**
   ```
   [FALLBACK] Nutze Luftlinie als Fallback
   🛣️ Erstelle Fallback-Route mit Kurven/Abbiegungen
   ```

### Luftlinien statt Straßen?

Das bedeutet **OSRM API nicht erreichbar**:
- Netzwerk-Problem
- CORS-Problem
- Server down

**Lösung:** Keine Code-Änderung nötig! API wird automatisch wieder genutzt, sobald erreichbar.

---

## 🛠️ Bei Problemen: Original wiederherstellen

Falls die Dateien versehentlich geändert wurden:

```bash
# routingService.ts wiederherstellen
git show 0f18d96:polizei-spiel/src/services/routingService.ts > polizei-spiel/src/services/routingService.ts

# routeCalculator.ts wiederherstellen
git show 0f18d96:polizei-spiel/src/utils/routeCalculator.ts > polizei-spiel/src/utils/routeCalculator.ts
```

---

## ✅ Best Practices

1. **NIEMALS diese Dateien direkt ändern**
2. **Bei Routing-Problemen: Erst Logs checken, dann API testen**
3. **Keine "Optimierungen" - Original-Code funktioniert!**
4. **Bei Unsicherheit: Diese Doku lesen oder Git-Commit 0f18d96 ansehen**

---

## 📚 Weitere Infos

- **OSRM API Docs:** http://project-osrm.org/docs/v5.24.0/api/
- **Leaflet Koordinaten:** https://leafletjs.com/reference.html#latlng
- **Original Commit:** `git show 0f18d96`

---

**Erstellt am:** 2025-10-14
**Letzte Änderung:** 2025-10-14
**Grund:** Routing-System gegen versehentliche Änderungen schützen
