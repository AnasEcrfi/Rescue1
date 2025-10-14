# Zusammenfassung: Fahrzeug-Positions-Bug

## Problem
Fahrzeuge erscheinen an zufälligen Positionen auf der Weltkarte wenn sie als Verstärkung zugewiesen werden.

## Ursache  
Das Problem liegt am **Closure-Bug** in `assignVehicle`:

1. `const vehicle = vehicles.find(v => v.id === vehicleId)` - holt Fahrzeug aus Closure
2. `const startPosition = vehicle.status === 'S1' ? station.position : vehicle.position`
3. Aber `vehicle` aus der Closure kann veraltet sein!
4. Wenn Fahrzeug 1 disponiert wird, ändert sich sein Status zu S2
5. Wenn dann schnell Fahrzeug 2 disponiert wird, hat die Closure noch den alten State
6. `vehicle.position` könnte eine zufällige Position sein statt der Wache

## Lösung
Die Position muss aus der aktuellen Vehicle-Position ODER direkt aus policeStations kommen, NICHT aus der Closure.

## Nächster Schritt
Bitte schauen Sie in die Browser-Console wenn Sie den Bug reproduzieren und teilen Sie mir die Console-Logs mit!
