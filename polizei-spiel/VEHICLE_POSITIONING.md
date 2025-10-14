# Fahrzeug-Positionierungs-System

## Übersicht

Das Fahrzeug-Positionierungs-System verhindert, dass mehrere Fahrzeuge an derselben Position übereinander angezeigt werden. Stattdessen werden sie in einem kreisförmigen Muster um die ursprüngliche Position herum angeordnet.

## Implementierung

### Datei: `src/utils/vehiclePositioning.ts`

Diese Utility-Datei enthält alle Funktionen für die Positionierung:

#### Hauptfunktionen:

1. **`getDisplayPosition(vehicle, allVehicles, policeStations)`**
   - Hauptfunktion, die für jedes Fahrzeug aufgerufen wird
   - Entscheidet, ob ein Offset angewendet werden soll
   - Wird in `App.tsx` beim Rendering der Fahrzeuge verwendet

2. **`calculateVehicleOffset(vehicle, allVehicles, radius)`**
   - Berechnet die Offset-Position in einem kreisförmigen Muster
   - Sortiert Fahrzeuge nach ID für konsistente Positionierung
   - Verteilt Fahrzeuge gleichmäßig um 360°

3. **`arePositionsEqual(pos1, pos2, threshold)`**
   - Prüft, ob zwei Positionen gleich sind (innerhalb von ~10 Metern)
   - Threshold ist konfigurierbar

## Wann wird Offset angewendet?

Das System wendet nur für **stationäre** Fahrzeuge ein Offset an:

- ✅ **S2** - Frei auf Wache (an Polizeirevier)
- ✅ **S4** - Am Einsatzort
- ✅ **S5** - Sprechwunsch (stationär)
- ✅ **S6** - Nicht einsatzbereit (Tanken/Pause)
- ✅ **S7** - Tanken
- ❌ **S3** - Anfahrt (beweglich, kein Offset)
- ❌ **S8** - Rückfahrt (beweglich, kein Offset)

## Beispiel-Szenario

### Situation: 3 Fahrzeuge an einem Polizeirevier (Status S2)

```
Ohne Offset:              Mit Offset:
     🚓                      🚓
     🚓        →           🚓   🚓
     🚓                      🚓
  (übereinander)        (kreisförmig)
```

### Berechnung:

Für 3 Fahrzeuge:
- Fahrzeug 1: Winkel = 0° (0/3 * 360°)
- Fahrzeug 2: Winkel = 120° (1/3 * 360°)
- Fahrzeug 3: Winkel = 240° (2/3 * 360°)

Jedes Fahrzeug wird mit einem Radius von ~20 Metern versetzt:
```javascript
offsetLat = originalLat + radius * cos(angle)
offsetLng = originalLng + radius * sin(angle)
```

## Integration in App.tsx

```typescript
// Import
import { getDisplayPosition } from './utils/vehiclePositioning';

// Verwendung beim Rendering
vehicles.map(vehicle => {
  const displayPosition = getDisplayPosition(vehicle, vehicles, policeStations);

  return (
    <VehicleMarker
      position={displayPosition}  // ← Offset-Position statt vehicle.position
      vehicle={vehicle}
      // ...
    />
  );
});
```

## Konfigurierbare Parameter

### In `vehiclePositioning.ts`:

```typescript
// Threshold für "gleiche Position"
arePositionsEqual(pos1, pos2, threshold: 0.0001) // ~10 Meter

// Offset-Radius für kreisförmige Anordnung
calculateVehicleOffset(vehicle, allVehicles, radius: 0.0002) // ~20 Meter

// Größerer Offset an Polizeirevieren
getDisplayPosition() // verwendet radius: 0.0003 für S2
```

## Vorteile

1. **Keine Überlappungen**: Alle Fahrzeuge sind klar sichtbar
2. **Konsistente Darstellung**: Gleiche ID-Reihenfolge = gleiche Position
3. **Performance-optimiert**: Nur Berechnung für stationäre Fahrzeuge
4. **Realitätsnah**: Kreisförmige Anordnung wie auf echten Parkplätzen
5. **Keine Dubletten**: Zentralisierte Logik in einer Datei

## Debugging

Um die Offset-Berechnung zu debuggen, kann man Logs hinzufügen:

```typescript
console.log('Fahrzeuge an gleicher Position:', vehiclesAtSamePosition.length);
console.log('Offset-Winkel:', angle * 180 / Math.PI, '°');
console.log('Neue Position:', offsetLat, offsetLng);
```

## Zukünftige Erweiterungen

Mögliche Verbesserungen:

1. **Dynamischer Radius**: Abhängig von der Anzahl der Fahrzeuge
2. **Verschiedene Muster**: Reihe, Grid, etc. je nach Anzahl
3. **Animation**: Sanfte Übergangs-Animation beim Offset
4. **UI-Indikator**: Zeige Anzahl der Fahrzeuge an gleicher Position
5. **Zoom-abhängig**: Größerer Offset bei höherem Zoom-Level
