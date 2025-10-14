# Verbleibende Features - Implementierungsanleitung

## 1. Schichtwechsel-Button im Fahrzeug-Panel

**Suche nach**: `crewFatigue`-Anzeige im Fahrzeug-Panel  
**Füge hinzu NACH der Fatigue-Anzeige**:

```tsx
{vehicle.crewFatigue > 60 && vehicle.status === 'S1' && (
  <button
    className="shift-change-btn"
    onClick={() => {
      setVehicles(prev => prev.map(v =>
        v.id === vehicle.id ? performShiftChange(v, gameTime) : v
      ));
      setGameTime(t => t + 5);
      addLog(`👥 Schichtwechsel: Fahrzeug ${vehicle.id} - Müdigkeit zurückgesetzt`, 'system');
    }}
    title="Schichtwechsel durchführen (5 Min Pause)"
  >
    👥 Schichtwechsel
  </button>
)}
```

## 2. MANV Progress-Bar

**Suche nach**: `incident.isMANV` im Incident-Panel  
**F\u00fcge hinzu in der Incident-Karte**:

```tsx
{incident.isMANV && (
  <div className="manv-progress-container">
    <div className="manv-progress-label">
      🚨 MANV-Sichtung: {incident.manvTriageProgress || 0}%
    </div>
    <div className="manv-progress-bar">
      <div
        className="manv-progress-fill"
        style={{ width: `${incident.manvTriageProgress || 0}%` }}
      />
    </div>
    <div className="manv-info">
      Beteiligte: {incident.involvedCount || 0} • Vor Ort: {incident.arrivedVehicles}/{incident.requiredVehicles}
    </div>
  </div>
)}
```

## 3. CSS für alle neuen Features

**Füge am Ende von App.css hinzu**:

```css
/* Auto-Assign Button */
.auto-assign-btn {
  background: linear-gradient(135deg, #FF9500 0%, #FF6B00 100%);
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  margin-left: 8px;
  transition: all 0.2s;
  box-shadow: 0 2px 8px rgba(255, 149, 0, 0.3);
}

.auto-assign-btn:hover:not(:disabled) {
  background: linear-gradient(135deg, #FF6B00 0%, #FF4500 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(255, 107, 0, 0.4);
}

.auto-assign-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Schichtwechsel Button */
.shift-change-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
  width: 100%;
  transition: all 0.2s;
}

.shift-change-btn:hover {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(10, 132, 255, 0.3);
}

/* MANV Progress */
.manv-progress-container {
  margin-top: 12px;
  padding: 12px;
  background: rgba(255, 69, 58, 0.1);
  border: 2px solid #FF453A;
  border-radius: 8px;
  animation: manv-pulse 2s ease-in-out infinite;
}

@keyframes manv-pulse {
  0%, 100% {
    border-color: #FF453A;
    box-shadow: 0 0 0 0 rgba(255, 69, 58, 0.4);
  }
  50% {
    border-color: #FF6961;
    box-shadow: 0 0 0 4px rgba(255, 69, 58, 0.2);
  }
}

.manv-progress-label {
  font-size: 13px;
  font-weight: 600;
  color: #FF453A;
  margin-bottom: 6px;
}

.manv-progress-bar {
  height: 24px;
  background: rgba(0,0,0,0.2);
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 8px;
}

.manv-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #FF453A 0%, #FF9500 100%);
  transition: width 0.5s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: 700;
}

.manv-info {
  font-size: 12px;
  color: var(--color-text-secondary);
  text-align: center;
}

/* S7 Status Badge */
.status-badge.S7 {
  background: linear-gradient(135deg, #FFC107 0%, #FF9800 100%);
  color: #000;
  font-weight: 700;
}
```

## 4. S7 Tankstellen-Routing (Vehicle Loop)

**Im Vehicle Update Loop (S8→S1 Transition)**:  
**Suche nach**: `status: shouldGoS6 ? 'S6' : 'S1'`

**Ersetze mit**:

```typescript
// Prüfe ob tanken nötig
const needsRefueling = shouldRefuel(updatedVehicle);
let finalStatus: VehicleStatus = 'S1';
let finalRoute = null;
let finalRouteDuration = 0;

if (shouldGoS6) {
  finalStatus = 'S6';
} else if (needsRefueling) {
  // Fahre zur nächsten Tankstelle
  const nearestStation = findNearestGasStation(vehicle.position, gasStations);
  if (nearestStation) {
    finalStatus = 'S7';
    // Route zur Tankstelle berechnen (async in Background)
    (async () => {
      try {
        const osrmRoute = await getRoute(
          { lat: vehicle.position[0], lng: vehicle.position[1] },
          { lat: nearestStation.position[0], lng: nearestStation.position[1] }
        );
        if (osrmRoute) {
          const route = convertToLeafletFormat(osrmRoute.coordinates);
          const duration = osrmRoute.duration * 0.7;
          setVehicles(prev => prev.map(v =>
            v.id === vehicle.id && v.status === 'S7' ? {
              ...v,
              route,
              routeDuration: duration,
              routeStartTime: Date.now(),
              routeProgress: 0,
            } : v
          ));
        }
      } catch (e) {
        console.error('S7 Route Error:', e);
      }
    })();
    addLog(`⛽ Fahrzeug ${vehicle.id} fährt zur Tankstelle`, 'system');
  }
}

return {
  ...updatedVehicle,
  status: finalStatus,
  route: finalRoute,
  routeDuration: finalRouteDuration,
  // ... rest
};
```

## 5. S7 Tankvorgang abschließen

**Im Vehicle Update Loop**:  
**Füge NACH dem S8-Block hinzu**:

```typescript
// S7: Tanken an Tankstelle
if (vehicle.status === 'S7' && vehicle.route) {
  const accumulatedTime = vehicle.accumulatedTime || 0;
  const newAccumulatedTime = accumulatedTime + scaledDeltaTime;
  const newProgress = Math.min(newAccumulatedTime / vehicle.routeDuration, 1);

  if (newProgress >= 1) {
    // Angekommen an Tankstelle - starte Tankvorgang
    const tankDuration = calculateRefuelDuration(vehicle.fuelLevel, vehicleTypeConfigs[vehicle.vehicleType].tankCapacity);
    
    return {
      ...vehicle,
      status: 'S6' as VehicleStatus,
      route: null,
      routeProgress: 0,
      outOfServiceReason: 'Tanken',
      outOfServiceUntil: gameTime + (tankDuration / 60),
      fuelLevel: 100,
      accumulatedTime: 0,
    };
  }

  const { position: newPosition, bearing: newBearing } = getPointAlongRoute(vehicle.route, newProgress);
  return {
    ...vehicle,
    position: newPosition,
    routeProgress: newProgress,
    bearing: newBearing,
    accumulatedTime: newAccumulatedTime,
  };
}
```

---

**Diese Änderungen manuell in App.tsx einfügen oder via Search & Replace!**
