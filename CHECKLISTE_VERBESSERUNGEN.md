# 🚨 POLIZEI-SIMULATOR - VERBESSERUNGS-CHECKLISTE

**Erstellt am:** 2025-10-14
**Projekt:** Rescue1 - Polizei-Leitstellensimulator
**Status:** Bereit zur Abarbeitung

---

## 📋 LEGENDE

- [ ] Nicht begonnen
- [⏳] In Arbeit
- [✅] Fertig
- [❌] Abgebrochen/Nicht relevant

**Prioritäten:**
- 🔴 **KRITISCH** - Spieler-Erfahrung direkt betroffen
- 🟠 **WICHTIG** - Gameplay-Balance
- 🟡 **MITTEL** - Realismus & Polish
- 🟢 **NICE-TO-HAVE** - Langzeit-Verbesserungen

---

# 🔴 KRITISCHE FEHLER (Priorität 1)

## 1. Spielgeschwindigkeit-Bug
**Problem:** Fahrzeuge fahren zu langsam bei erhöhter Spielgeschwindigkeit (2x, 3x, 4x)

### Checkliste:
- [ ] **1.1** `calculateRealisticRouteDuration()` mit gameSpeed-Parameter erweitern
  - Datei: `src/utils/gameLogic.ts:273-309`
  - Änderung: Parameter hinzufügen, Dauer durch gameSpeed teilen

- [ ] **1.2** Alle Aufrufe von `calculateRealisticRouteDuration()` aktualisieren
  - Datei: `src/App.tsx` (mehrere Stellen)
  - Suche nach: `calculateRealisticRouteDuration`
  - gameSpeed-Wert übergeben

- [ ] **1.3** Route-Cache mit gameSpeed invalidieren
  - Datei: `src/utils/routeCache.ts`
  - Cache-Key sollte gameSpeed enthalten

- [ ] **1.4** Testen: Fahrzeuge bei 1x, 2x, 3x, 4x Speed vergleichen

---

## 2. Einsatz-Abschluss-Deadlock bei S5 (Sprechwunsch)
**Problem:** Wenn ein Fahrzeug S5 (Sprechwunsch) hat, bleiben alle anderen Fahrzeuge am Einsatzort stehen

### Checkliste:
- [ ] **2.1** Einsatz-Abschluss-Logik pro Fahrzeug statt für alle
  - Datei: `src/App.tsx:2417-2475`
  - Änderung: Jedes Fahrzeug kann individuell zu S8 wechseln

- [ ] **2.2** Neue Incident-Property: `vehicleProcessingStatus: Map<vehicleId, 'processing' | 'done'>`
  - Datei: `src/types/index.ts:103-139`
  - Incident-Interface erweitern

- [ ] **2.3** Fahrzeug markiert sich als "done" nach Processing
  - Fahrzeug darf zu S8 wenn processing fertig, unabhängig von anderen

- [ ] **2.4** Incident wird erst entfernt wenn ALLE Fahrzeuge weg sind
  - Einsatz bleibt auf Karte bis letztes Fahrzeug S8 ist

- [ ] **2.5** Testen: Sprechwunsch während Einsatz auslösen, andere Fahrzeuge sollen trotzdem zurückfahren

---

## 3. Hubschrauber-Treibstoffverbrauch unrealistisch
**Problem:** Hubschrauber-Verbrauch ist kilometerbasiert (80L/100km), sollte aber zeitbasiert sein

### Checkliste:
- [ ] **3.1** Neue Verbrauchslogik für Hubschrauber (zeitbasiert)
  - Datei: `src/constants/vehicleTypes.ts:41-52`
  - Neues Property: `fuelConsumptionType: 'distance' | 'time'`
  - Neues Property: `fuelConsumptionPerHour: 150` (für Hubschrauber)

- [ ] **3.2** `calculateFuelConsumption()` anpassen
  - Datei: `src/utils/vehicleTimings.ts:18-30`
  - Unterscheide zwischen distance/time-based consumption

- [ ] **3.3** Hubschrauber-Verbrauch während Hover-Zeit berechnen
  - Am Einsatzort (S4): Verbrauch läuft weiter (Rotoren laufen)
  - Hover-Verbrauch: ~80% des Flug-Verbrauchs

- [ ] **3.4** Realistische Werte setzen:
  - Flug: 150 L/h
  - Hover: 120 L/h
  - Tank: 400 L → ~2.5h Flugzeit

- [ ] **3.5** Testen: Hubschrauber-Einsatz über 1h, Verbrauch prüfen

---

## 4. Wetter-Effekte nicht vollständig implementiert
**Problem:** `getProcessingTimeMultiplier()` wird nirgendwo verwendet, Einsätze dauern bei allen Wetterlagen gleich lang

### Checkliste:
- [ ] **4.1** Processing-Duration mit Wetter-Multiplikator anpassen
  - Datei: `src/App.tsx` - Bei Einsatz-Erstellung
  - `processingDuration = baseTime * getProcessingTimeMultiplier(weather)`

- [ ] **4.2** Dynamische Wetter-Änderung berücksichtigen
  - Wenn Wetter während S4 ändert → Processing-Zeit anpassen
  - useEffect für Wetter-Änderungen während aktiver Einsätze

- [ ] **4.3** UI-Feedback für Wetter-Verzögerungen
  - Toast: "⚠️ Nebel verlängert Einsatz-Dauer um 30%"
  - VehicleDetails: Zeige geschätzte Rest-Zeit mit Wetter-Faktor

- [ ] **4.4** Testen: Einsatz bei verschiedenen Wetterlagen starten, Dauer vergleichen

---

# 🟠 WICHTIGE GAMEPLAY-BALANCE (Priorität 2)

## 5. Schwierigkeitsgrade zu ähnlich
**Problem:** Leicht/Mittel/Schwer unterscheiden sich nur in Zeit-Limit

### Checkliste:
- [ ] **5.1** Erweiterte Difficulty-Settings definieren
  - Datei: `src/types/game.ts`
  - Neue Interface-Properties:
    ```typescript
    interface DifficultySettings {
      baseTimeLimit: number;
      incidentFrequency: number;        // 0.7 - 1.5
      escalationChance: number;         // 0.05 - 0.25
      startVehicles: number;            // 4 - 6
      crewFatigueRate: number;          // 0.5 - 1.5
      fuelConsumptionRate: number;      // 0.8 - 1.2
      backupRequestChance: number;      // 0.1 - 0.3
    }
    ```

- [ ] **5.2** getDifficultySettings() erweitern
  - Datei: `src/App.tsx`
  - Alle neuen Settings implementieren

- [ ] **5.3** Einsatz-Generierung mit incidentFrequency
  - Timeout zwischen Einsätzen anpassen
  - Leicht: 60-120s, Schwer: 20-40s

- [ ] **5.4** Eskalation mit escalationChance
  - Datei: `src/App.tsx` - `acceptCall()`
  - `canEscalate = escalationRules[call.type] !== undefined && Math.random() < settings.escalationChance`

- [ ] **5.5** Start-Fahrzeuge anpassen
  - Leicht: 6 Fahrzeuge
  - Mittel: 5 Fahrzeuge
  - Schwer: 4 Fahrzeuge

- [ ] **5.6** Fatigue & Fuel mit Multiplikatoren
  - `calculateFuelConsumption()` * fuelConsumptionRate
  - `calculateCrewFatigue()` * crewFatigueRate

- [ ] **5.7** UI-Anzeige der Schwierigkeits-Unterschiede
  - GameSettings: Zeige alle Unterschiede in Tabelle

- [ ] **5.8** Testen: Jeweils 30 Min auf Leicht/Mittel/Schwer spielen, Unterschied spürbar?

---

## 6. Crew-Fatigue zu aggressiv
**Problem:** Nach 8h → 80% Müdigkeit ist unrealistisch

### Checkliste:
- [ ] **6.1** Fatigue-Rate reduzieren
  - Datei: `src/utils/vehicleTimings.ts:32-47`
  - Änderung: `fatigue = hoursWorked * 5` (statt 10)
  - Nach 8h → 40% statt 80%

- [ ] **6.2** Pausen-Regeneration implementieren
  - Bei S6 (Pause): Fatigue reduziert sich um 30-50%
  - BREAK_DURATION sollte Fatigue direkt beeinflussen

- [ ] **6.3** Stress-Faktoren hinzufügen
  - High-Priority Einsätze: +5% Fatigue (Adrenalin)
  - Lange Anfahrt (>30 Min): +3% Fatigue
  - Nacht-Einsätze (22-6 Uhr): +2% Fatigue

- [ ] **6.4** Fatigue-Warnung anpassen
  - Warning: 60% statt 70%
  - Critical: 85% statt 90%

- [ ] **6.5** Visuelle Fatigue-Anzeige verbessern
  - VehicleDetails: Fatigue-Balken mit Farben
  - Tooltip: "Crew ist müde, Pausen empfohlen"

- [ ] **6.6** Testen: 8h Schicht durchspielen, Fatigue-Entwicklung prüfen

---

## 7. Eskalations-Regeln logisch überarbeiten
**Problem:** Einige Eskalationen sind unlogisch (Ladendiebstahl → Diebstahl, Falschparker → Verkehrsunfall)

### Checkliste:
- [ ] **7.1** Eskalations-Regeln Review
  - Datei: `src/constants/incidents.ts:64-82`
  - Liste mit allen Eskalationen erstellen
  - Realismus-Check für jede Regel

- [ ] **7.2** Unlogische Eskalationen entfernen/korrigieren:
  ```typescript
  // ❌ ENTFERNEN:
  'Ladendiebstahl': { newType: 'Diebstahl', newPriority: 'medium' }
  'Falschparker': { newType: 'Verkehrsunfall', newPriority: 'high' }

  // ✅ KORRIGIEREN:
  'Ladendiebstahl': { newType: 'Raub', newPriority: 'high' } // Täter wird gewalttätig
  'Falschparker': { newType: 'Schlägerei', newPriority: 'high' } // Streit um Parkplatz eskaliert
  ```

- [ ] **7.3** Neue realistische Eskalationen hinzufügen:
  ```typescript
  'Verkehrsunfall': { newType: 'Verfolgungsjagd', newPriority: 'high' } // Fahrerflucht
  'Häuslicher Streit': { newType: 'Geiselnahme', newPriority: 'high' } // Extremfall
  'Belästigung': { newType: 'Raub', newPriority: 'high' } // Aus Belästigung wird Überfall
  ```

- [ ] **7.4** Eskalations-Text/Beschreibung erweitern
  - Incident sollte neuen Description-Text bekommen
  - "Einsatz eskaliert: [Grund]"

- [ ] **7.5** Testen: Verschiedene Einsätze eskalieren lassen, Logik prüfen

---

## 8. Smart Assignment - Wetter & Sonderrechte berücksichtigen
**Problem:** Smart Assignment ignoriert Wetter und Sonderrechte

### Checkliste:
- [ ] **8.1** Wetter-Check für Hubschrauber
  - Datei: `src/utils/smartAssignment.ts:23-138`
  - Bei Gewitter/Nebel/Schnee: Hubschrauber Score = 0
  - Toast: "⚠️ Hubschrauber kann bei [Wetter] nicht fliegen"

- [ ] **8.2** Sonderrechte-Parameter hinzufügen
  ```typescript
  evaluateVehicleSuitability(
    vehicle: Vehicle,
    incident: Incident,
    weather: WeatherType,        // NEU
    withSpecialRights: boolean   // NEU
  )
  ```

- [ ] **8.3** Score-Anpassung für Sonderrechte
  - Mit Sonderrechten: +15 Score (schnellere Anfahrt)
  - Ohne Sonderrechte: Normale Berechnung

- [ ] **8.4** ETA-Berechnung mit Wetter & Sonderrechten
  - Nutze `calculateRealisticRouteDuration()` für Score
  - Zeige geschätzte Ankunftszeit im UI

- [ ] **8.5** Wartungsstatus stärker gewichten
  - Critical: Score -60 (statt -40)
  - Warning: Score -25 (statt -15)
  - Tooltip: "Fahrzeug braucht Wartung - nicht optimal"

- [ ] **8.6** Testen: Auto-Assignment bei verschiedenen Wetterlagen, Hubschrauber soll bei Gewitter nicht vorgeschlagen werden

---

# 🟡 REALISMUS & POLISH (Priorität 3)

## 9. Leitstellen-Bestätigungen im Funkverkehr
**Problem:** Fahrzeuge melden Status, aber Leitstelle antwortet nie

### Checkliste:
- [ ] **9.1** Bestätigungs-Nachrichten definieren
  - Datei: `src/constants/radioMessages.ts`
  - Neue Kategorie: `leitstelleConfirmations`
  ```typescript
  const confirmations = {
    'S2_to_S3': ['Verstanden, gute Fahrt', 'Kommen, viel Erfolg', 'Roger'],
    'S3_to_S4': ['Verstanden, am Einsatzort', 'Kommen', 'Roger, am Ziel'],
    'S4_to_S8': ['Verstanden, gute Rückfahrt', 'Kommen, bis später', 'Roger'],
  };
  ```

- [ ] **9.2** addRadioMessage() erweitern
  - Nach jedem Fahrzeug-Funkspruch: Leitstellen-Bestätigung
  - Verzögerung: 1-2 Sekunden (realistisch)

- [ ] **9.3** PTT-Sound für Leitstelle
  - Andere Stimme/Tonlage als Fahrzeuge
  - Kürzere Nachrichten (nur Bestätigung)

- [ ] **9.4** UI: Leitstellen-Nachrichten anders stylen
  - RadioLog: Leitstelle in anderer Farbe (z.B. grün)
  - Icon: 📡 statt 🚔

- [ ] **9.5** Testen: Mehrere Status-Wechsel, Leitstelle soll immer antworten

---

## 10. Route-Caching implementieren
**Problem:** Routes werden jedes Mal neu berechnet, obwohl `routeCache.ts` existiert

### Checkliste:
- [ ] **10.1** routeCache.ts analysieren und aktivieren
  - Datei: `src/utils/routeCache.ts`
  - Prüfen ob funktionsfähig

- [ ] **10.2** Cache in getRoute() integrieren
  - Datei: `src/services/routingService.ts`
  - Vor API-Call: Cache prüfen
  - Nach API-Call: Cache speichern

- [ ] **10.3** Cache-Key generieren
  ```typescript
  const cacheKey = `${start.lat},${start.lng}->${end.lat},${end.lng}`;
  ```

- [ ] **10.4** Häufige Routen pre-cachen
  - Beim Spielstart: Wache → häufige POIs
  - Wache ↔ Tankstellen
  - Wache ↔ benachbarte Wachen

- [ ] **10.5** Cache-Größe limitieren
  - Max. 200 gecachte Routes (LRU - Least Recently Used)
  - Bei > 200: Älteste löschen

- [ ] **10.6** Cache-Statistiken loggen
  - Console: "Route Cache Hit Rate: 75%"
  - Hilft Performance-Optimierung zu messen

- [ ] **10.7** Testen: Gleiche Route mehrmals fahren, zweite sollte instant sein

---

## 11. Magische Zahlen in Konstanten auslagern
**Problem:** Überall im Code sind Zahlen ohne Erklärung

### Checkliste:
- [ ] **11.1** Neue Datei: `src/constants/gameplayConstants.ts`
  ```typescript
  export const GAMEPLAY_CONSTANTS = {
    // Fuel
    FUEL_WARNING_THRESHOLD: 25,      // %
    FUEL_CRITICAL_THRESHOLD: 15,     // %
    FUEL_REFUEL_SPEED: 2,            // Liter/Sekunde

    // Fatigue
    FATIGUE_WARNING_THRESHOLD: 60,   // %
    FATIGUE_CRITICAL_THRESHOLD: 85,  // %
    FATIGUE_RATE_PER_HOUR: 5,        // %
    FATIGUE_RECOVERY_ON_BREAK: 30,   // %

    // Einsätze
    ESCALATION_CHECK_CHANCE: 0.1,    // 10%
    SPEAK_REQUEST_CHANCE: 0.025,     // 2.5% pro Sekunde
    SPEAK_REQUEST_MIN_PROGRESS: 0.2, // 20% durch Processing
    SPEAK_REQUEST_MAX_PROGRESS: 0.7, // 70% durch Processing

    // Timing
    DISPATCH_DELAY_STREIFENWAGEN: 30,  // Sekunden
    DISPATCH_DELAY_SEK: 120,           // Sekunden
    BREAK_DURATION: 15,                // Minuten
    REFUEL_DURATION: 5,                // Minuten
    SHIFT_DURATION: 8 * 60,            // Minuten

    // Distances
    PARKING_OFFSET_BASE: 0.0001,       // ~11 Meter
    VEHICLES_PER_PARKING_ROW: 8,
  };
  ```

- [ ] **11.2** Alle magischen Zahlen ersetzen
  - Suche nach nackten Zahlen im Code
  - Ersetze durch GAMEPLAY_CONSTANTS.XXX

- [ ] **11.3** Schwierigkeitsgrad-spezifische Konstanten
  - EASY_CONSTANTS, NORMAL_CONSTANTS, HARD_CONSTANTS
  - getDifficultySettings() liefert entsprechende Konstanten

- [ ] **11.4** Dokumentation in Konstanten
  - JSDoc-Kommentare für jede Konstante
  - Erklärung warum dieser Wert gewählt wurde

- [ ] **11.5** Testen: Spiel sollte identisch funktionieren

---

## 12. Schichtwechsel-Mechanik implementieren
**Problem:** `shiftStartTime` wird gesetzt, aber nie verwendet

### Checkliste:
- [ ] **12.1** Schichtwechsel-Check in Game Loop
  - Datei: `src/App.tsx` - useEffect für Fahrzeug-Updates
  - Alle 5 Minuten: Prüfe ob Schicht vorbei (8h)

- [ ] **12.2** Schichtwechsel-Prozess definieren
  ```typescript
  1. Fahrzeug beendet laufenden Einsatz (wenn vorhanden)
  2. S8 → Zur Wache
  3. An Wache: S6 für 10 Minuten ("Schichtwechsel")
  4. Nach 10 Min: S2 mit neuer Crew (Fatigue = 0, neue shiftStartTime)
  ```

- [ ] **12.3** UI-Feedback für Schichtwechsel
  - Toast: "🕐 Schichtwechsel für Fahrzeug S-03"
  - RadioLog: "S-03 zur Schichtübergabe"

- [ ] **12.4** Konfigurierbare Schichtlänge
  - GameSettings: "Schichtdauer: 8h / 10h / 12h"
  - Affects Gameplay-Balance

- [ ] **12.5** Statistik: Anzahl Schichtwechsel
  - Statistics: "Schichtwechsel: 3"
  - Zeigt wie lange gespielt wurde

- [ ] **12.6** Testen: Spiel 8h+ laufen lassen, Schichtwechsel beobachten

---

## 13. Fahrzeug-Defekte mit Konsequenzen
**Problem:** `maintenanceStatus` wird berechnet, hat aber kaum Effekt

### Checkliste:
- [ ] **13.1** Panne-Mechanik implementieren
  - Bei "critical" während Fahrt (S3/S8): 2% Chance pro Minute
  - Fahrzeug wird zu S6 "Defekt"
  - Route-Calculation stoppt

- [ ] **13.2** Abschlepp-System
  - Fahrzeug bleibt stehen wo Panne passierte
  - Neue Option: "Abschleppwagen rufen"
  - 15-30 Minuten bis Abschlepper da
  - Fahrzeug wird zur Wache geschleppt

- [ ] **13.3** Reparatur-Dauer realistischer
  - Aktuell: 30-60 Min (GAMEPLAY_CONSTANTS)
  - Je nach Defekt-Schwere:
    - Minor: 20-30 Min (Reifenwechsel)
    - Major: 60-120 Min (Motor-Problem)
    - Critical: 4+ Stunden (Fahrzeug bleibt S6 bis Spielende)

- [ ] **13.4** Ersatzfahrzeug-System
  - Wenn Fahrzeug >2h defekt: "Ersatzfahrzeug anfordern"
  - Nachbarwache schickt Ersatz (10 Min Anfahrt)
  - Ersatz-FZ hat andere ID, gleicher Typ

- [ ] **13.5** Wartungs-Prävention
  - Manuell Fahrzeug zu S6 "Wartung" schicken
  - Vorbeugende Wartung: 20 Min, verhindert Defekte
  - Strategisches Element: Wann Wartung machen?

- [ ] **13.6** UI für Defekte
  - Toast: "🔧 PANNE: S-03 ist liegen geblieben!"
  - Karten-Icon: Kaputtes Fahrzeug (Warndreieck)
  - VehicleDetails: "Defekt: [Beschreibung]"

- [ ] **13.7** Testen: Fahrzeug auf "critical" setzen, Panne provozieren

---

## 14. Dynamische Einsatz-Entwicklungen
**Problem:** Einsätze sind statisch, entwickeln sich nicht

### Checkliste:
- [ ] **14.1** Einsatz-Stufen-System definieren
  ```typescript
  interface IncidentStage {
    stage: number;                    // 1, 2, 3...
    triggerTime: number;              // Nach X Sekunden
    triggerCondition?: string;        // Optional: Bedingung
    newDescription: string;
    additionalVehiclesNeeded?: number;
    priority?: 'low' | 'medium' | 'high';
    requiredActions?: string[];       // z.B. "Feuerwehr nachfordern"
  }
  ```

- [ ] **14.2** Beispiel-Szenarien erstellen
  - Datei: `src/constants/incidentStages.ts`
  ```typescript
  'Verkehrsunfall': [
    { stage: 1, triggerTime: 0, description: 'PKW-Unfall' },
    { stage: 2, triggerTime: 120, description: 'Öl läuft aus, Feuerwehr nötig', additionalVehiclesNeeded: 1 },
    { stage: 3, triggerTime: 300, description: 'Stau bildet sich, Verkehrsregelung nötig', additionalVehiclesNeeded: 1 },
  ],
  'Demonstration': [
    { stage: 1, triggerTime: 0, description: 'Friedliche Demo mit 50 Personen' },
    { stage: 2, triggerTime: 600, description: 'Demo wächst auf 200 Personen', additionalVehiclesNeeded: 2 },
    { stage: 3, triggerTime: 1200, description: 'Ausschreitungen beginnen', priority: 'high', additionalVehiclesNeeded: 3 },
  ]
  ```

- [ ] **14.3** Stage-Transition-Logic
  - useEffect: Prüfe alle aktiven Incidents
  - Wenn triggerTime erreicht: Nächste Stage aktivieren
  - Update Incident-Properties (description, priority, requiredVehicles)

- [ ] **14.4** UI-Feedback für Stage-Wechsel
  - Toast: "⚠️ Einsatz entwickelt sich: [Neue Beschreibung]"
  - Incident-Marker: Farbe ändert sich (wenn Priority steigt)
  - RadioLog: Fahrzeug meldet Änderung

- [ ] **14.5** Spieler-Aktionen beeinflussen Stages
  - Wenn schnell reagiert → Stage 3 wird verhindert
  - Wenn zu langsam → Frühere Eskalation
  - Dynamisches Gameplay!

- [ ] **14.6** Testen: Verkehrsunfall 10 Minuten laufen lassen, Stages beobachten

---

## 15. Tutorial-System für neue Spieler
**Problem:** Neue Spieler verstehen FMS-System nicht

### Checkliste:
- [ ] **15.1** Tutorial-Mode Flag
  - Neue State: `isTutorialMode: boolean`
  - GameSettings: Checkbox "Tutorial aktivieren"
  - Bei erstem Spielstart: Automatisch aktiviert

- [ ] **15.2** Tutorial-Schritte definieren
  ```typescript
  const tutorialSteps = [
    { id: 1, title: 'Willkommen', text: 'Du bist Disponent...', highlight: null },
    { id: 2, title: 'Notruf', text: 'Ein Anruf geht ein...', highlight: '.call-item' },
    { id: 3, title: 'Fahrzeug wählen', text: 'Wähle ein Fahrzeug...', highlight: '.vehicle-marker' },
    { id: 4, title: 'Status-System', text: 'S1 = Bereit, S3 = Anfahrt...', highlight: '.vehicle-label-status' },
    // ... 10-15 Schritte
  ];
  ```

- [ ] **15.3** Tutorial-Overlay-Komponente
  - Neue Datei: `src/components/TutorialOverlay.tsx`
  - Modal mit "Weiter" / "Überspringen" Buttons
  - Highlight-Effekt für relevante UI-Elemente

- [ ] **15.4** Geführter erster Einsatz
  - Tutorial generiert speziellen Test-Einsatz
  - Einfach (Ruhestörung, niedrige Priorität)
  - Schritt-für-Schritt durch Disposition

- [ ] **15.5** Tooltips für FMS-Status
  - Hover über S1-S8: Tooltip mit Erklärung
  - "S3 = Einsatz übernommen, Fahrzeug ist unterwegs"

- [ ] **15.6** Glossar-Panel
  - Neue Komponente: GlossaryPanel
  - Liste aller Polizei-Begriffe mit Erklärung
  - Suchfunktion

- [ ] **15.7** Tutorial jederzeit wiederholbar
  - GameSettings: "Tutorial erneut starten"
  - Hilfreich nach Pausen

- [ ] **15.8** Testen: Neuer User ohne Vorwissen, schafft Tutorial in 5 Minuten?

---

# 🟢 NICE-TO-HAVE (Priorität 4)

## 16. Achievement-System mit Belohnungen
**Problem:** Keine langfristigen Ziele, fehlendes Erfolgserlebnis

### Checkliste:
- [ ] **16.1** Achievement-Kategorien definieren
  ```typescript
  - Einsätze: "100 Einsätze erfolgreich", "Perfekte Woche"
  - Geschwindigkeit: "Unter 2 Min Response-Time 10x"
  - Effizienz: "Kein Treibstoff-Notfall", "Keine Crew-Übermüdung"
  - Spezial: "Hubschrauber-Meister", "Nachtschicht-Profi"
  - Rettung: "Lebensretter" (50 High-Priority gelöst)
  ```

- [ ] **16.2** Achievement-Datenstruktur erweitern
  - Datei: `src/types/index.ts:141-148`
  ```typescript
  interface Achievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
    progress?: number;          // 0-100%
    maxProgress?: number;
    reward?: AchievementReward;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }
  ```

- [ ] **16.3** Belohnungs-System
  ```typescript
  interface AchievementReward {
    type: 'vehicle' | 'score_multiplier' | 'cosmetic';
    value: string | number;
  }
  // Beispiele:
  - Unlock Zivilfahrzeug (nach 50 Einsätzen)
  - +10% Score-Multiplikator
  - Neuer Fahrzeug-Skin
  ```

- [ ] **16.4** Achievement-Tracking
  - useEffect: Prüfe nach jedem Einsatz
  - Statistiken mit Achievements verknüpfen

- [ ] **16.5** Achievement-Benachrichtigungen
  - Animierte Toast-Nachricht
  - Sound-Effekt (Fanfare)
  - Overlay mit Achievement-Icon

- [ ] **16.6** Achievement-Übersicht-Panel
  - Neue Komponente: AchievementsPanel
  - Grid mit allen Achievements
  - Locked/Unlocked State
  - Progress-Bars für laufende Achievements

- [ ] **16.7** Testen: Ein Achievement freischalten, Belohnung erhalten

---

## 17. Daily Challenges & Missions
**Problem:** Kein Wiederspiel-Wert nach einigen Stunden

### Checkliste:
- [ ] **17.1** Challenge-System definieren
  ```typescript
  interface DailyChallenge {
    id: string;
    date: string;                    // ISO-Date
    title: string;
    description: string;
    objective: ChallengeObjective;
    reward: number;                  // Punkte
    completed: boolean;
  }

  type ChallengeObjective =
    | { type: 'resolve_incidents', count: number }
    | { type: 'avg_response_time', maxTime: number }
    | { type: 'zero_failures', duration: number }
    | { type: 'specific_incident', incidentType: string, count: number };
  ```

- [ ] **17.2** Challenge-Generierung
  - Jeden Tag (00:00 Uhr) neue Challenges
  - 3 Challenges pro Tag: Leicht / Mittel / Schwer
  - Algorithmisch generiert (nicht hardcoded)

- [ ] **17.3** Challenge-Tracking
  - Statistics-Erweiterung für Challenge-Progress
  - Echtzeit-Update während Spiel

- [ ] **17.4** Challenge-UI
  - Panel oben rechts: "Tägliche Herausforderungen"
  - Checkbox für abgeschlossene
  - Progress-Bar für laufende

- [ ] **17.5** Belohnungen
  - Punkte für Highscore
  - Spezielle Achievement-Freischaltungen
  - "Challenge-Master" Achievement bei 100 abgeschlossenen

- [ ] **17.6** Testen: Challenge abschließen, Belohnung erhalten

---

## 18. Highscore & Rangliste
**Problem:** Kein Wettkampf-Element

### Checkliste:
- [ ] **18.1** Score-Berechnung erweitern
  ```typescript
  - Einsatz erfolgreich: +100 * Priority-Multiplikator
  - Response-Time Bonus: +50 (wenn < 3 Min)
  - Perfect Streak: +20 pro Streak
  - Effizienz-Bonus: +30 (wenn keine Ressourcen-Verschwendung)
  - Fehler-Abzug: -50 (Einsatz gescheitert)
  - Zeit-Abzug: -10 pro Minute Überschreitung
  ```

- [ ] **18.2** Highscore-Persistierung
  - LocalStorage: Top 10 Scores
  - Pro Schwierigkeitsgrad separate Liste

- [ ] **18.3** End-of-Shift Zusammenfassung
  - Modal nach Spielende / Schichtende
  - Statistiken: Einsätze, Score, Streak, etc.
  - Vergleich mit Highscore
  - "Neuer Rekord!" Animation wenn Top 10

- [ ] **18.4** Highscore-Tabelle
  - Neue Komponente: HighscoreTable
  - Sortierbar nach: Score, Einsätze, Streak
  - Zeige Datum, Schwierigkeitsgrad

- [ ] **18.5** Online-Rangliste (Optional, später)
  - Backend für globale Scores
  - Anonyme Submissions
  - Wöchentliche / Monatliche Ranglisten

- [ ] **18.6** Testen: Hohen Score erreichen, in Top 10 sehen

---

## 19. Fahrzeug-Unlock-System
**Problem:** Alle Fahrzeuge von Anfang an verfügbar

### Checkliste:
- [ ] **19.1** Unlock-Bedingungen definieren
  ```typescript
  'Streifenwagen': { unlocked: true, requirement: null },
  'Zivilfahrzeug': { unlocked: false, requirement: '50 Einsätze erfolgreich' },
  'SEK': { unlocked: false, requirement: '10 High-Priority Einsätze' },
  'Polizeihubschrauber': { unlocked: false, requirement: 'Score 10.000+' },
  ```

- [ ] **19.2** Unlock-Tracking
  - Statistics: Zähle relevante Aktionen
  - Check nach jedem Einsatz ob Unlock-Bedingung erfüllt

- [ ] **19.3** Unlock-Benachrichtigung
  - Große animierte Ankündigung
  - "Neues Fahrzeug freigeschaltet: SEK!"
  - Zeige Fahrzeug-Stats & Bild

- [ ] **19.4** Locked-State in UI
  - GameSettings: Gesperrte Fahrzeuge ausgegraut
  - Tooltip: "Unlock-Bedingung: [...]"
  - Progress-Bar für Unlock

- [ ] **19.5** Fahrzeug-Galerie
  - Neue Seite: Alle Fahrzeuge anzeigen
  - Locked/Unlocked, Stats, Beschreibung
  - "Museum" für freischaltbare Inhalte

- [ ] **19.6** Testen: Zivilfahrzeug freischalten nach 50 Einsätzen

---

## 20. Fahrzeug-Spezialisierung & Skill-Tree
**Problem:** Alle Streifenwagen sind identisch

### Checkliste:
- [ ] **20.1** Spezialisierungs-Typen definieren
  ```typescript
  type VehicleSpecialization =
    | 'traffic'          // Verkehr (Unfälle +20% schneller)
    | 'investigation'    // Ermittlung (Diebstahl/Einbruch +20% schneller)
    | 'crowd_control'    // Menschenmenge (Demos +30% effektiver)
    | 'pursuit'          // Verfolgung (Verfolgungsjagd +40% Erfolg)
    | 'k9_unit';         // Hundeführer (Suche +50% Radius)
  ```

- [ ] **20.2** Vehicle-Interface erweitern
  ```typescript
  interface Vehicle {
    // ... existing
    specialization?: VehicleSpecialization;
    specializationLevel?: number;  // 1-5
    experiencePoints?: number;
  }
  ```

- [ ] **20.3** XP-System für Fahrzeuge
  - Jeder Einsatz: +10 XP (passend zu Spezialisierung: +20 XP)
  - Level-Up alle 100 XP
  - Level 5 = Master (Max)

- [ ] **20.4** Spezialisierungs-Boni
  - Level 1: +10% Geschwindigkeit für Einsatztyp
  - Level 2: +20% Processing-Speed
  - Level 3: +15% weniger Fatigue
  - Level 4: +30% weniger Fuel-Verbrauch
  - Level 5: Alle Boni kombiniert + Spezial-Fähigkeit

- [ ] **20.5** UI für Spezialisierung
  - VehicleDetails: Zeige Spezialisierung & Level
  - XP-Bar bis nächstes Level
  - Skill-Tree Visualisierung

- [ ] **20.6** Spezialisierung wählen
  - Nach 100 Einsätzen: "Fahrzeug spezialisieren?"
  - Spieler wählt aus Liste
  - Permanente Entscheidung (oder Respec gegen Punkte)

- [ ] **20.7** Testen: Fahrzeug zu Level 5 bringen, Boni spüren

---

## 21. Mehr Einsatzarten & POI-Integration
**Problem:** Nach einigen Stunden repetitiv

### Checkliste:
- [ ] **21.1** Neue Einsatztypen hinzufügen
  ```typescript
  - Tierschutz (entlaufenes Tier, Tierquälerei)
  - Verkehrskontrolle (ohne Unfall, präventiv)
  - Ordnungsamt-Unterstützung (Müll, Lärmbelästigung)
  - Suizidversuch / Gefährdete Person
  - Großveranstaltung (Fußballspiel-Sicherung)
  - Terrorwarnung / Bombendrohung erweitert
  - Cyberdelikt (Phishing-Call-Center)
  - Umweltdelikt (illegale Müllentsorgung)
  ```

- [ ] **21.2** POI-spezifische Einsätze
  - Stadion → Fußball-Randale
  - Flughafen → Security-Alarm
  - Hauptbahnhof → Taschendiebstahl
  - Banken → Überfall
  - Schulen → Bedrohungslage
  - Parks → Exhibitionismus / Drogenhandel

- [ ] **21.3** Zeit- und Wetter-abhängige Einsätze
  - Nebel + Autobahn = Massen-Karambolage
  - Nacht + Park = Überfall
  - Rush-Hour + Innenstadt = Auffahrunfall-Serie
  - Sommer + Hitze = Aggression (mehr Schlägereien)

- [ ] **21.4** Serientäter-Mechanik
  - Gleicher Täter mehrere Einsätze hintereinander
  - "Verdächtige Person in [Stadtteil] mehrfach gemeldet"
  - Wenn schnell reagiert → Täter gefasst (Bonus)

- [ ] **21.5** Testen: Jeder neue Einsatztyp mindestens 1x spielen

---

## 22. Wetter-Effekte visuell verbessern
**Problem:** Wetter ändert sich, aber Karte sieht gleich aus

### Checkliste:
- [ ] **22.1** Regen-Animation
  - Canvas-Overlay für Regentropfen
  - Fallgeschwindigkeit abhängig von Sturm-Stärke
  - Leichte Transparenz

- [ ] **22.2** Nebel-Effekt auf Karte
  - Weißer Overlay mit 40-60% Opacity
  - Karte "faded" aussehend
  - Zoom-Level automatisch reduziert (schlechtere Sicht)

- [ ] **22.3** Schnee-Animation
  - Schneeflocken fallen langsam
  - Schnee sammelt sich auf Karte (weiße Overlay-Patches)
  - POIs teilweise verdeckt

- [ ] **22.4** Gewitter-Blitze
  - Alle 5-15 Sekunden: Blitz-Flash
  - Kurzes weißes Aufleuchten
  - Donner-Sound (verzögert)

- [ ] **22.5** Straßen-Zustände
  - Regen: Straßen glänzen (dunklere Farbe)
  - Schnee: Straßen weiß
  - Eis: Straßen glitzernd

- [ ] **22.6** Wetter-Übergänge animieren
  - 15-30 Minuten Übergang
  - Regen langsam stärker werdend
  - Nebel langsam aufziehend

- [ ] **22.7** Testen: Alle Wetter-Typen durchspielen, visuelle Effekte prüfen

---

## 23. Mehr Fahrzeug-Interaktionen
**Problem:** Fahrzeuge sind zu passiv

### Checkliste:
- [ ] **23.1** Manuelle Fahrzeug-Kontrolle erweitern
  - Rechtsklick auf Fahrzeug: Kontext-Menü
    - "Zur Wache zurückrufen" (auch während S3)
    - "Umleiten zu anderem Einsatz"
    - "Pause machen lassen"
    - "Wartung beauftragen"

- [ ] **23.2** Fahrzeug-zu-Fahrzeug Kommunikation
  - Fahrzeuge können sich gegenseitig unterstützen
  - "S-03 bittet S-07 um Backup"
  - Automatische Koordination bei MANV

- [ ] **23.3** Prioritäts-Override
  - Spieler kann Fahrzeug "high priority" markieren
  - Dieses Fahrzeug darf schneller fahren (+20%)
  - Höherer Fuel & Fatigue Verbrauch

- [ ] **23.4** Konvoi-Funktion
  - Multiple Fahrzeuge gleichzeitig zuweisen
  - Fahren in Formation (schnellstes vorne)
  - Visuell: Verbindungslinie zwischen Fahrzeugen

- [ ] **23.5** Fahrzeug-Tausch
  - Zwei Fahrzeuge Einsätze tauschen lassen
  - Sinnvoll wenn ein Fahrzeug näher an anderem Einsatz

- [ ] **23.6** Testen: Alle neuen Interaktionen ausprobieren

---

# 🛠️ CODE-QUALITÄT & REFACTORING (Priorität 5)

## 24. App.tsx aufteilen in Custom Hooks
**Problem:** App.tsx hat 3957 Zeilen

### Checkliste:
- [ ] **24.1** Neue Datei: `src/hooks/useGameLoop.ts`
  - Extrahiere: Vehicle-Animation, Time-Update
  - Alles aus den großen useEffect-Blöcken

- [ ] **24.2** Neue Datei: `src/hooks/useIncidentManagement.ts`
  - Extrahiere: generateCall, acceptCall, rejectCall
  - Eskalations-Logik
  - MANV-System

- [ ] **24.3** Neue Datei: `src/hooks/useVehicleManagement.ts`
  - Extrahiere: assignVehicleToIncident, dispatchVehicle
  - S4-Processing, S8-Return
  - Sprechwunsch-System

- [ ] **24.4** Neue Datei: `src/hooks/useWeatherSystem.ts`
  - Extrahiere: Wetter-Wechsel-Logik
  - Wetter-Effekte auf Einsätze

- [ ] **24.5** Neue Datei: `src/hooks/useResourceManagement.ts`
  - Extrahiere: Fuel, Fatigue, Maintenance
  - S6/S7 Logik

- [ ] **24.6** App.tsx aufräumen
  - Nutze alle neuen Hooks
  - App.tsx sollte nur noch Rendering & Hook-Aufrufe
  - Ziel: < 500 Zeilen

- [ ] **24.7** Testen: App sollte identisch funktionieren

---

## 25. TypeScript strict mode & Type Safety
**Problem:** Teilweise `any` und lose Types

### Checkliste:
- [ ] **25.1** tsconfig.json strict mode aktivieren
  ```json
  {
    "compilerOptions": {
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "strictFunctionTypes": true,
      "strictBindCallApply": true
    }
  }
  ```

- [ ] **25.2** Alle `any` Types ersetzen
  - Suche nach: `any`
  - Ersetze mit spezifischen Types

- [ ] **25.3** Optionale Properties richtig typen
  - `property?: Type` statt `property: Type | undefined`
  - Nutze `Required<>` und `Partial<>` Utility Types

- [ ] **25.4** Null-Checks hinzufügen
  - Überall wo `.find()` verwendet: Check auf `undefined`
  - Nutze Optional Chaining `?.` wo möglich

- [ ] **25.5** Type Guards erstellen
  ```typescript
  function isHighPriorityIncident(inc: Incident): inc is Incident & { priority: 'high' } {
    return inc.priority === 'high';
  }
  ```

- [ ] **25.6** Build ohne Type-Errors
  - `npm run build` sollte 0 Fehler haben

- [ ] **25.7** Testen: App sollte kompilieren und laufen

---

## 26. Error Boundaries & Error Handling
**Problem:** App kann crashen ohne Recovery

### Checkliste:
- [ ] **26.1** Root Error Boundary
  - Neue Datei: `src/components/ErrorBoundary.tsx`
  - Fängt alle React-Errors
  - Zeigt Fehlerseite mit "Spiel neu laden"

- [ ] **26.2** Error-Logging
  - Console.error für alle Errors
  - Optional: Sentry / LogRocket Integration

- [ ] **26.3** Graceful Degradation
  - Wenn Routing-API feilt → Fallback zu Straight Line
  - Wenn Sound-System feilt → Stummschalten, weiterspielen
  - Wenn POI-Daten fehlen → Fallback zu Default-Locations

- [ ] **26.4** Try-Catch in kritischen Funktionen
  - Alle async Funktionen
  - Alle externen API-Calls
  - Alle JSON.parse()

- [ ] **26.5** User-freundliche Fehlermeldungen
  - Nicht: "TypeError: Cannot read property 'position' of undefined"
  - Sondern: "Fahrzeug konnte nicht gefunden werden"

- [ ] **26.6** Testen: Provoziere Fehler, App sollte nicht crashen

---

## 27. Unit Tests für kritische Funktionen
**Problem:** Keine Tests, Änderungen können Bugs einführen

### Checkliste:
- [ ] **27.1** Test-Setup
  - `npm install --save-dev vitest @testing-library/react`
  - `vitest.config.ts` erstellen

- [ ] **27.2** Tests für gameLogic.ts
  ```typescript
  - getWeightedIncidentType() mit verschiedenen Tageszeiten
  - calculateRealisticRouteDuration() mit verschiedenen Parametern
  - createIncidentIcon() Cache-Funktionalität
  ```

- [ ] **27.3** Tests für smartAssignment.ts
  ```typescript
  - evaluateVehicleSuitability() Scoring-Logik
  - findBestVehicles() Sortierung
  - Wetter-Berücksichtigung
  ```

- [ ] **27.4** Tests für vehicleTimings.ts
  ```typescript
  - calculateFuelConsumption() verschiedene Fahrzeugtypen
  - calculateCrewFatigue() verschiedene Zeiten
  - Schwellenwert-Checks (needsRefueling, needsBreak)
  ```

- [ ] **27.5** Tests für Store
  ```typescript
  - State-Updates korrekt
  - Actions führen zu erwarteten Zuständen
  - Selectors liefern richtige Daten
  ```

- [ ] **27.6** Test Coverage-Ziel
  - Minimum 60% Coverage für utils/
  - Minimum 40% Coverage gesamt

- [ ] **27.7** CI/CD Integration
  - GitHub Actions: Tests bei jedem Push
  - PRs nur mergen wenn Tests grün

---

## 28. Performance-Profiling & Optimierung
**Problem:** Mögliche Performance-Probleme bei vielen Einsätzen

### Checkliste:
- [ ] **28.1** React DevTools Profiler
  - Recording während Spiel
  - Identifiziere langsame Components
  - Suche nach unnötigen Re-Renders

- [ ] **28.2** useMemo für teure Berechnungen
  ```typescript
  const sortedVehicles = useMemo(() =>
    vehicles.sort((a, b) => a.id - b.id),
    [vehicles]
  );
  ```

- [ ] **28.3** useCallback für Event-Handler
  ```typescript
  const handleVehicleClick = useCallback((id: number) => {
    // ...
  }, [dependencies]);
  ```

- [ ] **28.4** Virtualisierung für lange Listen
  - react-window für Fahrzeug-Liste
  - Nur sichtbare Items rendern

- [ ] **28.5** Marker-Clustering für Karte
  - Bei > 50 Markern: Cluster verwenden
  - leaflet.markercluster Plugin

- [ ] **28.6** requestAnimationFrame statt setInterval
  - Animation-Loop bereits mit rAF ✓
  - Prüfe andere Intervalle

- [ ] **28.7** Performance-Budgets
  - Time to Interactive < 3s
  - Smooth 60 FPS während Fahrzeug-Animation
  - < 100ms Input-Latenz

- [ ] **28.8** Testen: 20+ Fahrzeuge, 50+ Einsätze gleichzeitig, sollte smooth laufen

---

## 29. LocalStorage-Persistierung
**Problem:** Spielstand geht bei Reload verloren

### Checkliste:
- [ ] **29.1** Save-System Design
  ```typescript
  interface SaveGame {
    version: string;
    timestamp: number;
    gameState: {
      gameTime: number;
      score: number;
      difficulty: Difficulty;
      // ...
    };
    vehicles: Vehicle[];
    incidents: Incident[];
    statistics: Statistics;
    achievements: Achievement[];
  }
  ```

- [ ] **29.2** Auto-Save implementieren
  - Alle 60 Sekunden: Speichere in localStorage
  - Key: `rescue1_autosave`

- [ ] **29.3** Load-System
  - Beim App-Start: Prüfe ob Autosave existiert
  - Modal: "Gespeichertes Spiel gefunden. Fortsetzen?"
  - Load-Button im Hauptmenü

- [ ] **29.4** Manual Save/Load
  - GameSettings: "Spiel speichern" Button
  - Mehrere Save-Slots (Slot 1, 2, 3)
  - Zeige Preview (Spielzeit, Score, Datum)

- [ ] **29.5** Save-Versioning
  - Falls Save-Format ändert: Migration
  - Alte Saves sollten kompatibel bleiben

- [ ] **29.6** Export/Import
  - "Spielstand exportieren" → JSON-Datei
  - "Spielstand importieren" → Von Datei laden
  - Teilen von Spielständen möglich

- [ ] **29.7** Testen: Speichern, Browser reloaden, Laden sollte funktionieren

---

## 30. Accessibility (A11y) Verbesserungen
**Problem:** Spiel ist schwer mit Tastatur/Screen-Reader nutzbar

### Checkliste:
- [ ] **30.1** Keyboard-Navigation
  - Alle Buttons mit Tab erreichbar
  - Enter/Space für Klicks
  - ESC für Modals schließen

- [ ] **30.2** ARIA-Labels
  - Alle interaktiven Elemente
  - `aria-label="Fahrzeug S-03 zuweisen"`
  - `role="button"` für Click-Handler

- [ ] **30.3** Focus-Indicator
  - Sichtbare Outline bei :focus
  - Nicht mit outline: none entfernen!

- [ ] **30.4** Farbkontrast prüfen
  - WCAG AA Standard (4.5:1)
  - Tools: axe DevTools

- [ ] **30.5** Screen-Reader Support
  - Live-Regions für Updates
  - `aria-live="polite"` für Toasts
  - `aria-live="assertive"` für kritische Alerts

- [ ] **30.6** Reduced Motion
  - `prefers-reduced-motion` respektieren
  - Animationen deaktivierbar

- [ ] **30.7** Testen: Mit Screen-Reader (NVDA/JAWS) testen

---

# 📊 TRACKING & METRICS

## Fortschritt verfolgen
Nutze diese Checkliste zum Tracking:

```
Total Items: 30 Haupt-Tasks mit ~200+ Sub-Tasks
Priorität 🔴: 4 Tasks (Kritisch)
Priorität 🟠: 4 Tasks (Wichtig)
Priorität 🟡: 6 Tasks (Mittel)
Priorität 🟢: 9 Tasks (Nice-to-Have)
Priorität 🛠️: 7 Tasks (Code-Qualität)
```

### Empfohlene Reihenfolge:
1. **Woche 1**: Kritische Fehler (Tasks 1-4)
2. **Woche 2**: Wichtige Gameplay-Balance (Tasks 5-8)
3. **Woche 3**: Realismus & Polish (Tasks 9-15)
4. **Woche 4+**: Nice-to-Have nach Priorität

---

## 🎯 NÄCHSTE SCHRITTE

Womit möchtest du anfangen?

**Empfehlung:** Starte mit **Task 1 (Spielgeschwindigkeit-Bug)**, da dieser die Spieler-Erfahrung am meisten beeinträchtigt.

Sage einfach "Start Task 1" und ich beginne mit der Implementierung!
