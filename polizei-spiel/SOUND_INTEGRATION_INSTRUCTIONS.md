# Sound-Integration - Wichtige Änderungen für App.tsx

## 1. Blaulicht-Sound bei Sonderrechten

Füge in `assignVehiclesToIncident` nach der Zuweisung hinzu:

```typescript
// Wenn Fahrzeug mit Sonderrechten zugewiesen wird
if (withSpecialRights) {
  realisticSoundManager.playBlaulichtActivate();

  // Optional: Sirene starten (dezent)
  vehicleIds.forEach(vid => {
    realisticSoundManager.startSirene(vid);
  });
}
```

## 2. Stoppe Sounds beim Menü-Rückkehr

Suche nach der Stelle wo `setGameStarted(false)` aufgerufen wird oder wo ein "Zurück zum Menü" Button ist.

Füge hinzu:

```typescript
const returnToMenu = () => {
  // Stoppe alle laufenden Sounds
  realisticSoundManager.stopAllSounds();

  // Setze Spiel zurück
  setGameStarted(false);
  // ... weitere Reset-Logik
};
```

## 3. Sirenen bei Status-Wechsel

Wenn ein Fahrzeug zu "enRoute" wechselt und `withSpecialRights: true` hat:

```typescript
if (vehicle.status === 'enRoute' && vehicle.withSpecialRights) {
  realisticSoundManager.startSirene(vehicle.id);
}

// Wenn Fahrzeug ankommt, stoppe Sirene
if (vehicle.status === 'arrived') {
  realisticSoundManager.stopSirene(vehicle.id);
}
```

## 4. Sound-Einstellungen Button

Füge in der unteren Leiste neben "Protokoll" und "Statistik":

```typescript
<button
  className="btn-secondary"
  onClick={() => setShowSoundSettings(true)}
>
  🔊 Sounds
</button>
```

Und füge den State hinzu:

```typescript
const [showSoundSettings, setShowSoundSettings] = useState(false);
```

Dann rendere die Komponente:

```tsx
{showSoundSettings && (
  <SoundSettings onClose={() => setShowSoundSettings(false)} />
)}
```

## 5. Blaulicht-Toggle im Fahrzeug-Details

Wenn es einen Blaulicht-Toggle gibt, füge Sound hinzu:

```typescript
const toggleBlaulicht = (vehicleId: number) => {
  // ... bestehende Logik

  // Spiele Sound
  realisticSoundManager.playBlaulichtActivate();

  // Starte/Stoppe Sirene
  const vehicle = vehicles.find(v => v.id === vehicleId);
  if (vehicle?.withSpecialRights) {
    realisticSoundManager.startSirene(vehicleId);
  } else {
    realisticSoundManager.stopSirene(vehicleId);
  }
};
```

## Testen

Starte den Dev-Server und teste:
1. Hintergrund-Funk sollte SEHR LEISE und gedämpft sein
2. Bei Einsatz-Annahme mit Sonderrechten: PIEP + Sirene (dezent)
3. Bei Zurück zum Menü: Alle Sounds stoppen
4. Sirenen werden nach 3 Sek. automatisch leiser (adaptive Lautstärke)
