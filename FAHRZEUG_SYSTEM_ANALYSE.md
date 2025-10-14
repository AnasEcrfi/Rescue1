# 🚔 FAHRZEUG-SYSTEM ANALYSE - Polizei-Leitstellensimulator

## 📊 ÜBERSICHT: Fahrzeug-Lifecycle

### Status-Codes (FMS - Funkmeldesystem)
- **S1**: Frei auf Funk (grün) - Außerhalb Wache, einsatzbereit auf Streife
- **S2**: Frei auf Wache (grün) - In Wache, einsatzbereit
- **S3**: Einsatz übernommen (orange) - Unterwegs zum Einsatzort
- **S4**: Am Einsatzort (rot) - Vor Ort, Einsatz wird bearbeitet
- **S5**: Sprechwunsch (blau) - Fahrzeug möchte mit Leitstelle sprechen
- **S6**: Nicht einsatzbereit (grau) - Tanken/Pause/Reparatur/Schichtende
- **S7**: Fahrt zur Tankstelle / Patient an Bord (gelb)
- **S8**: Rückfahrt zur Wache (gelb) - KANN umgeleitet werden!

---

## 🔄 KOMPLETTER FAHRZEUG-LIFECYCLE

### Phase 1: ALARMIERUNG (S2 → S3)
**Datei**: `App.tsx:1304-1495` - Funktion `assignVehicle()`

#### Ablauf:
1. **Validierung** (Zeilen 1310-1331):
   - Fahrzeug und Einsatz müssen existieren
   - Status muss S2 (Wache) oder S8 (Rückfahrt mit canBeRedirected) sein
   - Hubschrauber-Wettercheck (Zeilen 1334-1349)

2. **S8-Umleitung** (Zeilen 1353-1373):
   - Wenn Fahrzeug in S8 ist, von altem Einsatz entfernen
   - `arrivedVehicles` dekrementieren (Bug-Fix!)
   - Log: "S8→S3 Umgeleitet"

3. **Ausrückzeit-Berechnung** (Zeilen 1382-1401):
   ```typescript
   const dispatchDelay = calculateDispatchDelay(vehicle.vehicleType);
   // Streifenwagen: 8s, SEK: 25s, Zivilfahrzeug: 5s, Hubschrauber: 30s
   ```
   - Fahrzeug wird auf `isPreparingToDepart: true` gesetzt
   - Status bleibt zunächst S2
   - Position wird explizit auf Startposition gesetzt

4. **Asynchrone Route-Berechnung** (Zeilen 1404-1478):
   - `setTimeout()` mit `dispatchDelay` in Sekunden
   - Innerhalb setTimeout:
     - Route berechnen via `calculateRoute()` (OSRM oder Luftlinie)
     - Realistische Dauer berechnen mit `calculateRealisticRouteDuration()`
     - Bei Fehler: **KRITISCHER FALLBACK** → Direktroute erstellen

5. **Statuswechsel S2 → S3** (Zeilen 1450-1478):
   ```typescript
   setVehicles(prev => prev.map(v =>
     v.id === vehicleId ? {
       ...v,
       status: 'S3',
       isPreparingToDepart: false,
       route,
       routeDuration,
       routeStartTime: Date.now(), // WICHTIG!
       accumulatedTime: 0, // WICHTIG!
     } : v
   ));
   ```
   - Funkspruch: S2 → S3
   - Log: "Ausgerückt zu Einsatz"

---

### Phase 2: ANFAHRT (S3)
**Datei**: `App.tsx:1498-1838` - useEffect "Vehicle movement animation"

#### Ablauf:
1. **Animation Loop** (Zeilen 1504-1828):
   - Läuft mit `requestAnimationFrame()`
   - Performance-Optimierung: Prüft ob Fahrzeuge bewegen (Zeile 1512)
   - Wenn keine Bewegung: nur alle 500ms prüfen

2. **S3 Bewegungs-Logik** (Zeilen 1551-1643):
   ```typescript
   const newAccumulatedTime = vehicle.accumulatedTime + scaledDeltaTime;
   const newProgress = Math.min(newAccumulatedTime / vehicle.routeDuration, 1);
   ```
   - Nutzt `accumulatedTime` statt `Date.now()` für präzise Berechnung
   - Berücksichtigt `gameSpeed` Multiplikator
   - Berechnet Position entlang Route mit `getPointAlongRoute()`

3. **Ankunft am Einsatzort** (wenn `newProgress >= 1`):
   - **Parking-Position berechnen** (Zeilen 1562-1577):
     ```typescript
     const parkingIndex = incidentVehicles.length;
     const angleStep = Math.PI / 4; // 45° zwischen Fahrzeugen
     const angle = -Math.PI / 2 + (parkingIndex * angleStep);
     ```
     - Fahrzeuge parken im Halbkreis um Einsatzort
     - 11 Meter Abstand, 45° zwischen Fahrzeugen

   - **⚡ ERSTMELDUNG SOFORT** (Zeilen 1579-1616):
     - Nur beim ersten Fahrzeug (`isFirstArrival`)
     - Zufällige Erstmeldung aus `incidentReports[incident.type].initialReport`
     - Funkspruch: S3 → S4 mit Erstmeldung
     - Prüfung ob Verstärkung benötigt wird
     - Wenn Verstärkung: `backupRequested: true`, `requiredVehicles` erhöhen

   - **Statuswechsel S3 → S4** (Zeilen 1621-1629):
     ```typescript
     status: 'S4',
     position: parkedPosition,
     processingStartTime: Date.now(),
     processingDuration: incident?.processingDuration || 180,
     situationReportSent: false,
     ```

---

### Phase 3: AM EINSATZORT (S4)
**Datei**: `App.tsx:1841-2040` - useEffect "Handle S4 processing"

#### Ablauf:
1. **Processing Interval** (Zeilen 1848-2040):
   - Läuft alle paar Sekunden (setInterval)
   - Nur wenn Fahrzeuge in S4 existieren (Performance!)

2. **Lagemeldung nach 10-20s** (Zeilen 1855-1875):
   - Nur wenn `!situationReportSent`
   - Zufällige Meldung: "Lage vor Ort bestätigt..."
   - Funkspruch: S4 → S4
   - `situationReportSent: true`

3. **⚡ SPRECHWUNSCH-SYSTEM (S4 → S5)** (Zeilen 1877-1944):
   - **NUR EINE Einheit pro Einsatz** (`!currentIncident.speakRequestGiven`)
   - Zeitfenster: 30%-60% der Processing-Zeit
   - Zufallschance: 1.2% pro Check
   - Typen bestimmt nach Situation:
     - Wenn Fahrzeuge fehlen → `backup_needed` (60%) oder `escalation` (40%)
     - Bei High Priority → Mix aus escalation/suspect_arrested/additional_info
     - Normal → situation_report/unclear_situation/additional_info

   ```typescript
   status: 'S5',
   speakRequest: message,
   speakRequestType: requestType,
   previousStatus: 'S4',
   ```
   - Incident wird markiert: `speakRequestGiven: true`
   - Funkspruch: S4 → S5
   - Sound: `playAlertSound()`

4. **Processing abgeschlossen** (Zeilen 1946-2040):
   - Prüfung: `processingElapsed >= vehicle.processingDuration`
   - Prüfung: Alle benötigten Fahrzeuge angekommen?
   - Route zurück zur Wache berechnen (async mit `getRoute()`)
   - Statuswechsel S4 → S8

---

### Phase 4: RÜCKFAHRT (S8)
**Datei**: `App.tsx:1695-1820` - Teil des Animation-useEffect

#### Ablauf:
1. **S8 Bewegungs-Logik** (Zeilen 1695-1821):
   - Analog zu S3: `accumulatedTime` + `scaledDeltaTime`
   - Position entlang Route berechnen

2. **Ankunft an Wache** (wenn `newProgress >= 1`):
   - **Realistische Berechnungen** (Zeilen 1706-1742):
     ```typescript
     const distanceKm = routeDistance / 1000;
     const fuelConsumed = calculateFuelConsumption(vehicle, distanceKm);
     const fatigueGained = calculateCrewFatigue(vehicle, timeDrivenHours);
     const newMaintenance = updateMaintenanceStatus(vehicle, distanceKm);
     ```

3. **S6-Check** (Zeilen 1734-1746):
   - Prüfung ob Fahrzeug außer Dienst muss:
     - Tankfüllung < 20% → Tanken
     - Müdigkeit > 80% → Pause
     - Wartung 'critical' → Reparatur
   - Wenn ja: S8 → S6

4. **S7-Check (Tanken)** (Zeilen 1746-1780):
   - Wenn `shouldRefuel()` und kein S6-Grund
   - Route zur nächsten Tankstelle berechnen
   - S8 → S7

5. **Normale Rückkehr** (Zeilen 1785-1820):
   - Statuswechsel S8 → S2
   - Funkspruch: S8 → S2 "An Wache"
   - Position auf Wachenposition setzen
   - `isAvailable: true`

---

### Phase 5: SPRECHWUNSCH (S5)
**Datei**: `App.tsx:3173-3210` - SpeakRequestModal Rendering

#### Ablauf:
1. **Fahrzeug pausiert** (Zeile 1645-1650):
   - Bewegung stoppt komplett
   - Wartet auf Bestätigung

2. **Modal anzeigen**:
   - Klick auf Sprechwunsch-Button öffnet Modal
   - Modal zeigt Details basierend auf `speakRequestType`
   - 6 verschiedene Typen mit spezifischen Nachrichten

3. **Bestätigung** (Zeilen 3183-3208):
   - Rückkehr zu `previousStatus` (meist S4)
   - `speakRequest: null`
   - `speakRequestType: undefined`
   - Funkspruch: S5 → zurück
   - Log: "Sprechwunsch bearbeitet"

---

### Phase 6: AUSSER DIENST (S6)
**Datei**: `App.tsx:1532-1549` - Teil des Animation-useEffect

#### Ablauf:
1. **S6 Timer** (Zeilen 1532-1549):
   - Prüfung: `gameTime >= vehicle.outOfServiceUntil`
   - Wenn Zeit abgelaufen:
     - `resetVehicleAfterService()` aufrufen
     - Je nach Grund: Tankfüllung/Müdigkeit/Wartung zurücksetzen
     - S6 → S2
     - Funkspruch und Log

2. **S6-Gründe**:
   - **Tanken**: Tankfüllung auf 100%, Dauer abhängig von Tankgröße
   - **Pause**: Müdigkeit auf 0%, Dauer 30-60 min
   - **Reparatur**: Wartung auf 'ok', Dauer 1-3 Stunden
   - **Schichtende**: Komplett reset, neue Besatzung

---

### Phase 7: TANKSTELLEN-FAHRT (S7)
**Datei**: `App.tsx:1658-1693` - Teil des Animation-useEffect

#### Ablauf:
1. **S7 Bewegungs-Logik** (Zeilen 1658-1693):
   - Analog zu S3: Bewegung entlang Route zur Tankstelle
   - Bei Ankunft:
     - `calculateRefuelDuration()` basierend auf Tankfüllung
     - S7 → S6 mit Grund "Tanken"

---

## 🔧 HELPER-FUNKTIONEN

### Route-Berechnung
**Datei**: `utils/routeCalculator.ts`
- `calculateRoute()`: OSRM API für Straßenrouten, Luftlinie für Hubschrauber
- `calculateRealisticRouteDuration()`: Berücksichtigt Fahrzeugtyp, Wetter, Müdigkeit, Sonderrechte

### Fahrzeug-Helpers
**Datei**: `utils/vehicleHelpers.ts`
- `isVehicleMoving()`: Status S3 oder S8
- `isVehicleAvailable()`: Status S2 oder S8 mit canBeRedirected
- `isVehicleAtScene()`: Status S4
- 14 weitere Helper-Funktionen

### Ausrückzeiten
**Datei**: `constants/dispatchTimes.ts`
- Streifenwagen: 8s (±10%)
- SEK: 25s (±10%)
- Zivilfahrzeug: 5s (±10%)
- Polizeihubschrauber: 30s (±10%)

### Incident Reports
**Datei**: `constants/incidentReports.ts`
- 24 verschiedene Einsatztypen
- Jeder mit: initialReport[], progressReports[], completionReport[]
- Optional: backupRequest mit additionalVehicles

---

## 🐛 IDENTIFIZIERTE BUGS

### 🔴 KRITISCH

#### 1. **Race Condition bei doppelter Alarmierung**
**Datei**: `App.tsx:1304`
**Problem**: Wenn User sehr schnell zweimal auf "Alarmieren" klickt, kann dasselbe Fahrzeug zweimal zugewiesen werden, weil der Status-Check (Zeile 1329) VOR der Status-Änderung erfolgt, aber die Status-Änderung erst im setTimeout (Zeile 1404) passiert.

**Lösung**: Fahrzeug SOFORT als "nicht verfügbar" markieren:
```typescript
// Zeile 1386: Status sofort ändern, nicht erst im setTimeout
setVehicles(prev =>
  prev.map(v =>
    v.id === vehicleId ? {
      ...v,
      status: 'S2' as VehicleStatus, // Bleibt S2
      isAvailable: false, // NEU: Sofort als nicht verfügbar markieren
      assignedIncidentId: incidentId,
      dispatchTime: Date.now(),
      isPreparingToDepart: true,
      // ...
    } : v
  )
);
```

#### 2. **Route kann trotz Fallback null bleiben**
**Datei**: `App.tsx:1438-1448`
**Problem**: Wenn `calculateDistance()` selbst einen Fehler wirft (z.B. ungültige Koordinaten), bleibt `route` null und Fahrzeug hängt.

**Lösung**: Zusätzlicher try-catch um Fallback:
```typescript
} catch (error) {
  console.error('Routing Fehler:', error);

  try {
    const straightRoute = [safeStartPosition!, safeIncident!.position];
    route = straightRoute;
    // ... rest of fallback
  } catch (fallbackError) {
    console.error('KRITISCH: Auch Fallback-Route fehlgeschlagen:', fallbackError);
    // LETZTE RETTUNG: Minimale 2-Punkt-Route
    route = [[50.1109, 8.6821], [50.1109, 8.6821]]; // Frankfurt Zentrum
    routeDuration = 60; // 1 Minute
  }
}
```

#### 3. **Memory Leak durch nicht gecleante setTimeout**
**Datei**: `App.tsx:1404`
**Problem**: Wenn Komponente unmountet oder Einsatz abgebrochen wird während setTimeout läuft, wird Route-Berechnung trotzdem ausgeführt und versucht State zu ändern.

**Lösung**: TimeoutID speichern und cleanup:
```typescript
// Neues State-Field für Vehicle:
activeDispatchTimeout?: NodeJS.Timeout;

// In assignVehicle:
const timeoutId = setTimeout(async () => {
  // ... Route-Berechnung
}, dispatchDelay * 1000);

setVehicles(prev =>
  prev.map(v =>
    v.id === vehicleId ? {
      ...v,
      activeDispatchTimeout: timeoutId, // Speichern
      // ...
    } : v
  )
);

// Cleanup-Funktion hinzufügen:
const cancelDispatch = (vehicleId: number) => {
  setVehicles(prev =>
    prev.map(v => {
      if (v.id === vehicleId && v.activeDispatchTimeout) {
        clearTimeout(v.activeDispatchTimeout);
        return { ...v, activeDispatchTimeout: undefined, isPreparingToDepart: false };
      }
      return v;
    })
  );
};
```

---

### 🟡 MEDIUM

#### 4. **Parking Position Overlap bei >8 Fahrzeugen**
**Datei**: `App.tsx:1566-1577`
**Problem**: Bei mehr als 8 Fahrzeugen (360° / 45° = 8) überlappen sich die Positionen wieder.

**Lösung**: Zweite Reihe mit größerem Radius:
```typescript
const parkingIndex = incidentVehicles.length;
const row = Math.floor(parkingIndex / 8); // Reihe (0, 1, 2, ...)
const posInRow = parkingIndex % 8; // Position in Reihe (0-7)
const offsetDistance = 0.0001 * (row + 1); // Größerer Abstand für weitere Reihen
const angleStep = Math.PI / 4; // 45°
const angle = -Math.PI / 2 + (posInRow * angleStep);
```

#### 5. **Sprechwunsch-Chance zu niedrig**
**Datei**: `App.tsx:1887`
**Problem**: Mit 1.2% pro Check und Intervall von ~1 Sekunde dauert es im Schnitt 83 Sekunden bis ein Sprechwunsch kommt. Bei kurzen Einsätzen (2-3 Minuten) erscheint oft gar kein Sprechwunsch.

**Lösung**: Chance erhöhen oder Zeitfenster erweitern:
```typescript
// Option 1: Höhere Chance
Math.random() < 0.025 // 2.5% = durchschnittlich nach 40 Sekunden

// Option 2: Früheres Zeitfenster
processingProgress > 0.2 && processingProgress < 0.7 // 20%-70% statt 30%-60%
```

#### 6. **Keine Validierung ob Einsatz noch existiert**
**Datei**: `App.tsx:1560` (S3 Ankunft)
**Problem**: Wenn Einsatz während Anfahrt gelöscht/abgeschlossen wird, crasht Code mit `getIncidentById()` → undefined.

**Lösung**: Early return wenn Incident nicht existiert:
```typescript
const incident = vehicle.assignedIncidentId ? getIncidentById(incidents, vehicle.assignedIncidentId) : undefined;
if (!incident) {
  // Einsatz wurde gelöscht - zurück zur Wache
  addLog(`⚠️ Fahrzeug ${vehicle.id}: Einsatz nicht mehr vorhanden, kehre zurück`, 'system');
  return {
    ...vehicle,
    assignedIncidentId: null,
    status: 'S8', // Direkt zurück zur Wache
    // ... Route zur Wache berechnen
  };
}
```

---

### 🟢 MINOR

#### 7. **Doppelte Route-Berechnung bei Auto-Dispatch**
**Datei**: `App.tsx:1026-1107` (Auto-Dispatch) UND `App.tsx:1404-1478` (Manual Dispatch)
**Problem**: Code-Duplikation - Route-Berechnung existiert zweimal fast identisch.

**Lösung**: Route-Berechnung in eigene Funktion auslagern:
```typescript
const calculateAndSetRoute = async (vehicleId: number, startPos: [number, number], endPos: [number, number]) => {
  // ... komplette Route-Logik
  return { route, routeDuration };
};
```

#### 8. **Performance: Animation läuft auch wenn Spiel pausiert**
**Datei**: `App.tsx:1499`
**Problem**: useEffect hat `isPaused` in Dependencies, aber das stoppt nur die Animation INNERHALB, nicht den requestAnimationFrame loop selbst.

**Lösung**: Ist bereits implementiert (Zeile 1499), aber könnte optimiert werden:
```typescript
if (!gameStarted || isPaused) {
  // Komplett stoppen statt weiter loopen
  return;
}
```

#### 9. **Keine Prüfung ob Wache noch existiert**
**Datei**: `App.tsx:1375-1376`
**Problem**: Wenn Wache gelöscht wird (in zukünftigen Features), crasht Code.

**Lösung**: Early return:
```typescript
const station = policeStations.find(s => s.id === vehicle!.stationId);
if (!station) {
  console.error(`Station ${vehicle!.stationId} nicht gefunden`);
  return;
}
```

---

## 🚀 OPTIMIERUNGSVORSCHLÄGE

### UX / GAMEPLAY

#### 1. **⭐ AUDIO-FEEDBACK verbessern**
**Aktuell**: Nur ein "Beep" bei Alarmierung
**Vorschlag**:
- Unterschiedliche Sounds für verschiedene Ereignisse:
  - Alarmierung: Siren-Beep ✅ (existiert bereits)
  - Ankunft am Einsatzort: Funkrauschen + "Vor Ort"
  - Sprechwunsch: Dringliches Piepen (höhere Frequenz)
  - Verstärkung erforderlich: Warnsound
  - Einsatz abgeschlossen: Erfolgs-Chime
- Räumliches Audio: Lautstärke abhängig von Entfernung zur Kamera

#### 2. **⭐ VISUELLE ROUTE-VORSCHAU vor Alarmierung**
**Aktuell**: Route wird erst nach Alarmierung berechnet und angezeigt
**Vorschlag**:
- Beim Hovern über "Alarmieren"-Button: Vorschau-Route in hellgrau anzeigen
- Geschätzte Anfahrtszeit anzeigen: "~2:30 Min."
- Hilft Spieler bei Entscheidung welches Fahrzeug am besten geeignet ist

**Implementierung**:
```typescript
const [previewRoute, setPreviewRoute] = useState<{vehicleId: number, route: [number, number][]} | null>(null);

const handleVehicleHover = async (vehicleId: number, incidentId: number) => {
  const vehicle = vehicles.find(v => v.id === vehicleId);
  const incident = incidents.find(i => i.id === incidentId);
  if (!vehicle || !incident) return;

  const route = await calculateRoute(...);
  setPreviewRoute({ vehicleId, route: route.path });
};
```

#### 3. **⭐ FAHRZEUG-STATUS Infobox am Einsatzort**
**Aktuell**: Nur Icon und Callsign auf Karte
**Vorschlag**:
- Beim Klick auf Fahrzeug: Detaillierte Infobox:
  - Aktueller Status + Fortschritt (z.B. "S4 - 45% abgeschlossen")
  - Verbleibende Zeit: "~1:23 Min. bis Abschluss"
  - Besatzung: Müdigkeit-Anzeige
  - Tankfüllung + Reichweite
  - Nächste Aktion: "Kehrt zurück zur Wache" / "Benötigt Tanken"

#### 4. **⭐ EINSATZ-TIMELINE**
**Vorschlag**: Zeige Timeline für jeden Einsatz:
```
[08:23:15] Notruf eingegangen
[08:23:45] S-01 alarmiert
[08:25:12] S-01 S2→S3 Ausgerückt
[08:27:45] S-01 S3→S4 Am Einsatzort
[08:27:46] Erstmeldung: "Diebstahl bestätigt..."
[08:29:30] S5 Sprechwunsch: Verstärkung benötigt
[08:30:15] S-05 alarmiert (Verstärkung)
[08:32:10] S-01 S4→S8 Einsatz abgeschlossen
```

#### 5. **⭐ HOTKEYS für schnelle Aktionen**
**Vorschlag**:
- `1-9`: Fahrzeug 1-9 auswählen
- `A`: Ausgewähltes Fahrzeug alarmieren
- `S`: Sprechwunsch bestätigen
- `Space`: Spiel pausieren/fortsetzen
- `+/-`: Spielgeschwindigkeit ändern
- `M`: Karte zentrieren auf aktiven Einsatz

**Implementierung**: Bereits `useHotkeys` Hook importiert (Zeile 41), nur erweitern!

#### 6. **⭐ MINI-MAP mit Übersicht**
**Aktuell**: Nur eine Hauptkarte
**Vorschlag**:
- Kleine Übersichtskarte in Ecke (15% Größe)
- Zeigt alle Fahrzeuge und Einsätze in Frankfurt
- Klick auf Mini-Map: Hauptkarte zoomt zu Position

#### 7. **⭐ STATISTIK-Dashboard**
**Vorschlag**: Erweitere bestehendes Score-System:
- Durchschnittliche Anfahrtszeit pro Fahrzeug
- Erfolgsrate (Einsätze erfolgreich / fehlgeschlagen)
- Fahrzeug-Auslastung (Grafik: Wie oft war jedes Fahrzeug im Einsatz?)
- Tankkosten, Personalkosten (für Realismus)
- Bestzeiten für verschiedene Einsatztypen

---

### PERFORMANCE

#### 8. **⚡ Route-Caching**
**Problem**: Routen zwischen denselben Punkten werden mehrfach berechnet
**Lösung**: Cache mit LRU (Least Recently Used):
```typescript
const routeCache = new Map<string, {route: [number, number][], duration: number, timestamp: number}>();
const CACHE_DURATION = 300000; // 5 Minuten

const getCachedRoute = (start: [number, number], end: [number, number]) => {
  const key = `${start[0]},${start[1]}-${end[0]},${end[1]}`;
  const cached = routeCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached;
  }
  return null;
};
```

#### 9. **⚡ Debounced State Updates**
**Problem**: `setVehicles()` wird in Animation-Loop JEDEN Frame aufgerufen
**Lösung**: Nur updaten wenn Position sich signifikant ändert:
```typescript
const positionChanged = (oldPos: [number, number], newPos: [number, number]) => {
  const threshold = 0.00001; // ~1 Meter
  return Math.abs(oldPos[0] - newPos[0]) > threshold ||
         Math.abs(oldPos[1] - newPos[1]) > threshold;
};

// In Animation:
if (!positionChanged(vehicle.position, newPosition)) {
  return vehicle; // Kein Update nötig
}
```

#### 10. **⚡ Lazy Loading für Incident Reports**
**Problem**: Alle 24 Incident Reports werden beim Start geladen
**Lösung**: Dynamisch laden wenn benötigt:
```typescript
const loadIncidentReport = async (incidentType: string) => {
  return import(`./constants/incidentReports/${incidentType}.ts`);
};
```

#### 11. **⚡ Web Worker für Route-Berechnung**
**Problem**: Route-Berechnung blockiert Main Thread
**Lösung**: Route-Berechnung in Web Worker verschieben:
```typescript
// routeWorker.ts
self.onmessage = async (e) => {
  const { start, end, isHelicopter } = e.data;
  const route = await calculateRoute(start, end, isHelicopter);
  self.postMessage(route);
};

// In App.tsx:
const routeWorker = new Worker('./routeWorker.ts');
routeWorker.postMessage({ start, end, isHelicopter });
routeWorker.onmessage = (e) => {
  const route = e.data;
  // ... setVehicles mit neuer Route
};
```

---

### CODE-QUALITÄT

#### 12. **🔧 Type Safety verbessern**
**Problem**: Viele `!` Non-null Assertions (z.B. `safeVehicle!`)
**Lösung**: Proper Type Guards:
```typescript
const assertVehicleExists = (vehicle: Vehicle | undefined): vehicle is Vehicle => {
  if (!vehicle) throw new Error('Vehicle not found');
  return true;
};

// Verwendung:
assertVehicleExists(vehicle);
// Ab hier ist vehicle garantiert nicht undefined
```

#### 13. **🔧 State Management mit Zustand/Redux**
**Problem**: 38 verschiedene `useState()` in App.tsx (Zeilen 62-300)
**Lösung**: Zentrales State Management:
```typescript
// store.ts
const useGameStore = create((set) => ({
  vehicles: [],
  incidents: [],
  gameTime: 0,
  // ...
  assignVehicle: (vehicleId, incidentId) => set((state) => ({
    // ...
  })),
}));
```

#### 14. **🔧 Custom Hooks extrahieren**
**Vorschlag**: Große useEffects in eigene Hooks:
```typescript
// hooks/useVehicleAnimation.ts
export const useVehicleAnimation = (vehicles, gameSpeed, isPaused) => {
  useEffect(() => {
    // ... komplette Animation-Logik
  }, [vehicles, gameSpeed, isPaused]);
};

// hooks/useVehicleProcessing.ts
export const useVehicleProcessing = (vehicles, incidents) => {
  useEffect(() => {
    // ... S4 Processing-Logik
  }, [vehicles, incidents]);
};
```

#### 15. **🔧 Error Boundaries**
**Problem**: Wenn Fehler in Animation-Loop auftritt, crasht gesamte App
**Lösung**: Error Boundary um kritische Komponenten:
```typescript
class VehicleErrorBoundary extends React.Component {
  componentDidCatch(error, info) {
    console.error('Fahrzeug-Fehler:', error);
    // Zeige Fehlermeldung, aber App läuft weiter
  }
  render() {
    return this.props.children;
  }
}
```

---

## 📈 PRIORITÄTEN

### Sofort umsetzen (Kritische Bugs):
1. ✅ Race Condition bei doppelter Alarmierung (Bug #1)
2. ✅ Route Fallback verbessern (Bug #2)
3. ✅ Memory Leak durch setTimeout (Bug #3)

### Kurzfristig (UX-Verbesserungen):
4. ⭐ Audio-Feedback verbessern (UX #1)
5. ⭐ Fahrzeug-Status Infobox (UX #3)
6. ⭐ Hotkeys implementieren (UX #5)
7. 🟡 Sprechwunsch-Chance erhöhen (Bug #5)

### Mittelfristig (Performance):
8. ⚡ Route-Caching (Performance #8)
9. ⚡ Debounced State Updates (Performance #9)
10. 🟡 Parking Position für >8 Fahrzeuge (Bug #4)

### Langfristig (Architektur):
11. 🔧 State Management mit Zustand (Code #13)
12. 🔧 Custom Hooks extrahieren (Code #14)
13. ⭐ Einsatz-Timeline (UX #4)
14. ⭐ Mini-Map (UX #6)

---

## 🎯 ZUSAMMENFASSUNG

Das Fahrzeug-System ist **grundsätzlich gut strukturiert** mit:
- ✅ Realistischem FMS-System (S1-S8)
- ✅ Asynchroner Route-Berechnung mit Fallback
- ✅ Performance-Optimierungen (Animation nur wenn nötig)
- ✅ LST-SIM Style Funksprüchen und Meldungen
- ✅ Realistischen Timings und Ausrückzeiten

**Hauptprobleme**:
- 🔴 3 kritische Bugs (Race Conditions, Memory Leaks)
- 🟡 6 medium Bugs (Edge Cases, Validierung)
- 🟢 3 minor Issues (Code-Duplikation, Performance)

**Größte UX-Gewinne**:
1. Audio-Feedback (Spieler HÖREN was passiert)
2. Visuelle Route-Vorschau (Spieler sehen Konsequenzen VOR Entscheidung)
3. Detaillierte Fahrzeug-Infos (Spieler verstehen Status besser)
4. Hotkeys (Schnellere Bedienung für Power-User)

**Technische Schulden**:
- 38 useState() sollten in State Management
- Animation-Loop sollte in eigenen Hook
- Route-Berechnung sollte in Web Worker
- Type Safety könnte besser sein (weniger `!` Assertions)
