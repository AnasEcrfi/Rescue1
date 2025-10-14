# Debug-Anleitung für Fahrzeug-Positions-Bug

## Problem
Fahrzeuge erscheinen an falscher Position wenn sie als Verstärkung zugewiesen werden.

## Wie man debuggt

1. **Browser-Console öffnen** (F12)
2. **Spiel starten**
3. **Ersten Einsatz annehmen**
4. **Erstes Fahrzeug zuweisen** - sollte funktionieren
5. **Zweites Fahrzeug zuweisen** - Bug tritt auf
6. **Console-Logs prüfen** - schauen Sie nach Meldungen wie:
   - `🚨 [POSITION DEBUG] Fahrzeug X, Status: S1`
   - `vehicle.position: [lat, lng]`
   - `station.position: [lat, lng]`
   - `→ startPosition: [lat, lng]`

## Was zu suchen

- Ist `vehicle.position` falsch?
- Ist `station.position` falsch?
- Ist `vehicle.status` nicht S1?

## Nächste Schritte

Teilen Sie mir die Console-Logs mit, damit ich den Bug fixen kann!
