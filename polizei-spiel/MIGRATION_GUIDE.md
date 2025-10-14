# 🚀 Migration Guide: useState → Zustand Store

## Übersicht

Dieses Dokument beschreibt die schrittweise Migration von App.tsx useState Hooks zu Zustand Store.

**Ziel:** App.tsx von ~15.000 Zeilen auf ~5.000 Zeilen reduzieren und Performance um 50-70% verbessern.

---

## ✅ Was bereits fertig ist

1. ✅ Zustand installiert (`zustand@5.0.8`)
2. ✅ Game Store erstellt (`src/stores/gameStore.ts`)
3. ✅ Alle Types definiert (`src/types/game.ts`)
4. ✅ Beispiele erstellt (`src/examples/StoreUsageExample.tsx`)
5. ✅ Kompiliert ohne Fehler

---

## 📋 Migrations-Schritte

### Phase 1: Vorbereitung (SICHER - Nichts kaputt!)

#### Schritt 1.1: Store importieren

**Datei:** `src/App.tsx` (Zeile 1)

**Vorher:**
```typescript
import React, { useState, useEffect, useRef } from 'react';
```

**Nachher:**
```typescript
import React, { useState, useEffect, useRef } from 'react';
import { useGameStore, useVehicles, useIncidents, useGameState } from './stores/gameStore';
```

**Status:** Alter Code funktioniert weiter! ✅

---

### Phase 2: Vehicles State migrieren

#### Schritt 2.1: Vehicle State aus Store holen

**Vorher (Zeile ~80):**
```typescript
const [vehicles, setVehicles] = useState<Vehicle[]>([]);
```

**Nachher:**
```typescript
// ALT (kommentieren, nicht löschen!):
// const [vehicles, setVehicles] = useState<Vehicle[]>([]);

// NEU:
const vehicles = useGameStore(state => state.vehicles);
const setVehicles = useGameStore(state => state.setVehicles);
const updateVehicle = useGameStore(state => state.updateVehicle);
const updateVehicleStatus = useGameStore(state => state.updateVehicleStatus);
```

#### Schritt 2.2: Vehicle-Updates ersetzen

**Suche nach:** `setVehicles(vehicles.map(`

**Beispiel-Fund:**
```typescript
// ALT:
setVehicles(vehicles.map(v =>
  v.id === vehicleId ? { ...v, status: 'S3' } : v
));

// NEU:
updateVehicleStatus(vehicleId, 'S3');
```

**Vorteile:**
- 1 Zeile statt 3 Zeilen
- Type-Safe
- Automatisch optimiert

#### Schritt 2.3: Testen

```bash
npm run dev
```

**Checklist:**
- [ ] Fahrzeuge spawnen korrekt
- [ ] Fahrzeuge bewegen sich
- [ ] Status-Updates funktionieren
- [ ] Keine Console-Errors

---

### Phase 3: Incidents State migrieren

#### Schritt 3.1: Incidents aus Store

**Vorher:**
```typescript
const [incidents, setIncidents] = useState<Incident[]>([]);
const [incidentCounter, setIncidentCounter] = useState(1);
```

**Nachher:**
```typescript
// const [incidents, setIncidents] = useState<Incident[]>([]); // ALT
// const [incidentCounter, setIncidentCounter] = useState(1); // ALT

const incidents = useGameStore(state => state.incidents);
const addIncident = useGameStore(state => state.addIncident);
const updateIncident = useGameStore(state => state.updateIncident);
const removeIncident = useGameStore(state => state.removeIncident);
const incrementIncidentCounter = useGameStore(state => state.incrementIncidentCounter);
```

#### Schritt 3.2: Incident erstellen vereinfachen

**Vorher:**
```typescript
const newIncident: Incident = { /* ... */ };
setIncidents([...incidents, newIncident]);
setIncidentCounter(incidentCounter + 1);
```

**Nachher:**
```typescript
const newIncident: Incident = { /* ... */ };
addIncident(newIncident);
// Counter wird automatisch erhöht!
```

---

### Phase 4: Calls State migrieren

**Vorher:**
```typescript
const [calls, setCalls] = useState<Call[]>([]);
const [callIdCounter, setCallIdCounter] = useState(1);
const [selectedCall, setSelectedCall] = useState<Call | null>(null);
const [isCallModalOpen, setIsCallModalOpen] = useState(false);
```

**Nachher:**
```typescript
const calls = useGameStore(state => state.calls);
const addCall = useGameStore(state => state.addCall);
const removeCall = useGameStore(state => state.removeCall);
const openCallModal = useGameStore(state => state.openCallModal);
const closeCallModal = useGameStore(state => state.closeCallModal);
const selectedCall = useGameStore(state => state.selectedCall);
const isCallModalOpen = useGameStore(state => state.isCallModalOpen);
```

**Vorteil:** Call-Modal State ist integriert!

---

### Phase 5: Game State migrieren

**Vorher:**
```typescript
const [gameStarted, setGameStarted] = useState(false);
const [gameTime, setGameTime] = useState(8 * 60);
const [gameSpeed, setGameSpeed] = useState<1 | 2 | 3 | 4>(1);
const [isPaused, setIsPaused] = useState(false);
const [score, setScore] = useState(0);
```

**Nachher:**
```typescript
const {
  gameStarted,
  gameTime,
  gameSpeed,
  isPaused,
  score,
  startGame,
  setGameTime,
  setGameSpeed,
  pauseGame,
  resumeGame,
  addScore
} = useGameStore();
```

---

### Phase 6: UI State migrieren

Alle Modal-States sind bereits im Store:

```typescript
const {
  isBackupModalOpen,
  isSpeakRequestModalOpen,
  showStatsModal,
  openBackupModal,
  closeBackupModal,
  openSpeakRequestModal,
  closeSpeakRequestModal,
  openStatsModal,
  closeStatsModal
} = useGameStore();
```

---

### Phase 7: Cleanup

Wenn alles funktioniert:

1. **Alte useState Zeilen löschen** (die auskommentierten)
2. **Imports aufräumen**
3. **Code formatieren**

```bash
# Test
npm run dev

# Build Test
npm run build

# TypeScript Check
npx tsc --noEmit
```

---

## 🎯 Performance-Optimierung

### Best Practices

#### ❌ SCHLECHT: Ganzer Store
```typescript
function MyComponent() {
  const store = useGameStore(); // Re-rendert bei JEDEM Update!
  return <div>{store.vehicles.length}</div>;
}
```

#### ✅ GUT: Selektiver Zugriff
```typescript
function MyComponent() {
  const vehicles = useVehicles(); // Nur bei Vehicle-Updates!
  return <div>{vehicles.length}</div>;
}
```

#### ✅ BESSER: Spezifischer Selektor
```typescript
function MyComponent() {
  const vehicleCount = useGameStore(state => state.vehicles.length);
  // Nur bei Length-Änderung!
  return <div>{vehicleCount}</div>;
}
```

#### ✅ OPTIMAL: Actions ohne State
```typescript
function ControlButtons() {
  // Holt NUR Actions, keine Daten → Re-rendert NIE!
  const pauseGame = useGameStore(state => state.pauseGame);
  const resumeGame = useGameStore(state => state.resumeGame);

  return (
    <>
      <button onClick={pauseGame}>Pause</button>
      <button onClick={resumeGame}>Weiter</button>
    </>
  );
}
```

---

## 🐛 Debugging

### DevTools aktivieren

Der Store hat DevTools bereits integriert!

1. **Redux DevTools Extension** installieren (Chrome/Firefox)
2. **Game öffnen**
3. **DevTools → Redux Tab**
4. **Alle Actions sehen!**

Jede Action wird geloggt:
- `updateVehicleStatus`
- `addIncident`
- `assignVehicleToIncident`
- etc.

**Time-Travel Debugging:** Du kannst zurückspulen! 🎮

---

## 📊 Erwartete Verbesserungen

### Vorher (App.tsx mit useState)
```
- 26+ useState Hooks
- ~15.000 Zeilen Code
- Komplette App re-rendert bei Updates
- Schwer zu debuggen
- Komplizierte Logik (nested setState)
```

### Nachher (App.tsx mit Zustand)
```
+ 1 zentraler Store
+ ~5.000 Zeilen Code (-67%)
+ Selektive Re-Renders (50-70% schneller!)
+ DevTools für Debugging
+ Einfache Logik (updateVehicle statt map)
```

---

## 🚨 Häufige Fehler vermeiden

### Fehler 1: Store in Loop verwenden
```typescript
// ❌ FALSCH:
vehicles.forEach(v => {
  updateVehicleStatus(v.id, 'S3'); // Triggert 10x Re-Render!
});

// ✅ RICHTIG:
const updatedVehicles = vehicles.map(v => ({ ...v, status: 'S3' }));
setVehicles(updatedVehicles); // 1x Re-Render
```

### Fehler 2: Alte und neue State mischen
```typescript
// ❌ FALSCH:
const [vehicles, setVehicles] = useState([]); // ALT
const storeVehicles = useVehicles(); // NEU
// Beide existieren → Chaos!

// ✅ RICHTIG: Alte löschen/auskommentieren!
```

### Fehler 3: State direkt mutieren
```typescript
// ❌ FALSCH:
const vehicle = vehicles.find(v => v.id === 1);
vehicle.status = 'S3'; // MUTATION!

// ✅ RICHTIG:
updateVehicleStatus(1, 'S3');
```

---

## 📖 Weiterführende Dokumentation

- **Store API:** Siehe `src/stores/gameStore.ts` (gut kommentiert)
- **Beispiele:** Siehe `src/examples/StoreUsageExample.tsx`
- **Zustand Docs:** https://zustand-demo.pmnd.rs/

---

## 🎉 Erfolgsmetriken

Nach erfolgreicher Migration:

- ✅ TypeScript kompiliert ohne Fehler
- ✅ Game startet und läuft normal
- ✅ Alle Features funktionieren
- ✅ Performance ist besser (weniger Lag)
- ✅ DevTools zeigen Actions
- ✅ Code ist kürzer und übersichtlicher

---

## 🆘 Hilfe

Bei Problemen:

1. **Beispiele anschauen:** `src/examples/StoreUsageExample.tsx`
2. **Store-Typen prüfen:** Alles ist type-safe!
3. **DevTools nutzen:** Siehe welche Actions gefeuert werden
4. **Backup wiederherstellen:** Falls etwas schief geht

**Pro-Tipp:** Migriere in kleinen Schritten und teste nach jedem Schritt!

---

## 🏁 Nächste Schritte

Nach erfolgreicher Migration:

1. **Web Workers** für Routing (Phase 2)
2. **Object Pooling** für Performance (Phase 3)
3. **OffscreenCanvas** für Map-Rendering (Phase 4)
4. **Multiplayer** (später)

Aber erstmal: **Store Migration abschließen!** 🚀
