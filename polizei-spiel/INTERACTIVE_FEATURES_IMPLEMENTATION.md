# Interactive Click Handlers Implementation Guide

This document outlines all the interactive features that need to be added to make the police dispatch game fully functional like LST-SIM.

## Summary of Changes

### 1. State Variables Added (Line ~499-500)
```typescript
const [vehicleFilter, setVehicleFilter] = useState<VehicleStatus | 'all'>('all');
const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
```

### 2. Handler Functions to Add (After line ~1285)

Add these functions after the `getStatusBadge` function:

```typescript
// FEATURE 1: Click on vehicle in list to focus map on vehicle
const handleVehicleClick = (vehicle: Vehicle) => {
  setMapCenter(vehicle.position);
  setSelectedVehicleId(vehicle.id);
  soundManager.playSirenBeep();
  addLog(`Fahrzeug S-${vehicle.id.toString().padStart(2, '0')} fokussiert`, 'new');
};

// FEATURE 4: Change vehicle status manually
const changeVehicleStatus = (vehicleId: number, newStatus: VehicleStatus) => {
  setVehicles(prev =>
    prev.map(v =>
      v.id === vehicleId ? { ...v, status: newStatus } : v
    )
  );
  soundManager.playSirenBeep();
  addLog(`Fahrzeug S-${vehicleId.toString().padStart(2, '0')} Status geändert zu ${newStatus}`, 'new');
};

// FEATURE 5: Filter vehicles by status
const getFilteredVehicles = () => {
  if (vehicleFilter === 'all') {
    return vehicles;
  }
  return vehicles.filter(v => v.status === vehicleFilter);
};
```

### 3. Enhanced VehicleMarker Popup (Line ~406-413)

Replace the current basic popup with:

```typescript
return (
  <Marker position={position} icon={icon}>
    <Popup>
      <div style={{ minWidth: '200px' }}>
        <strong>Fahrzeug S-{vehicle.id.toString().padStart(2, '0')}</strong>
        <br />
        <span style={{ fontSize: '12px', color: '#8E8E93' }}>
          {vehicleTypeConfigs[vehicle.vehicleType].displayName} {vehicleTypeConfigs[vehicle.vehicleType].icon}
        </span>
        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #E5E5EA' }} />

        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
          <strong>Status:</strong> {statusLabels[status]}
        </div>

        <div style={{ fontSize: '13px', marginBottom: '4px' }}>
          <strong>Position:</strong> {position[0].toFixed(4)}, {position[1].toFixed(4)}
        </div>

        {vehicle.assignedIncidentId && (
          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            <strong>Einsatz:</strong> #{vehicle.assignedIncidentId}
          </div>
        )}

        {status === 'S3' && vehicle.routeDuration > 0 && (
          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            <strong>ETA:</strong> {Math.ceil((vehicle.routeDuration - ((Date.now() - vehicle.routeStartTime) / 1000)) / 60)} Min
          </div>
        )}

        {status === 'S4' && vehicle.processingDuration > 0 && vehicle.processingStartTime && (
          <div style={{ fontSize: '13px', marginBottom: '4px' }}>
            <strong>Bearbeitung:</strong> {Math.ceil((vehicle.processingDuration - ((Date.now() - vehicle.processingStartTime) / 1000)) / 60)} Min verbleibend
          </div>
        )}

        <div style={{ fontSize: '13px', marginBottom: '8px' }}>
          <strong>Gefahrene Strecke:</strong> {(vehicle.totalDistanceTraveled / 1000).toFixed(1)} km
        </div>

        <hr style={{ margin: '8px 0', border: 'none', borderTop: '1px solid #E5E5EA' }} />

        {/* Status change buttons - only for S1 vehicles */}
        {status === 'S1' && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => changeVehicleStatus(vehicle.id, 'S6')}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                background: '#8E8E93',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                marginRight: '4px'
              }}
            >
              Außer Dienst
            </button>
          </div>
        )}

        {/* Cancel button for S3/S4 vehicles */}
        {(status === 'S3' || status === 'S4') && (
          <div style={{ marginTop: '8px' }}>
            <button
              onClick={() => {
                setVehicles(prev =>
                  prev.map(v =>
                    v.id === vehicle.id
                      ? { ...v, status: 'S1', assignedIncidentId: null, route: null }
                      : v
                  )
                );
                soundManager.playSirenBeep();
                addLog(`Fahrzeug S-${vehicle.id.toString().padStart(2, '0')} Einsatz abgebrochen`, 'new');
              }}
              style={{
                padding: '4px 8px',
                fontSize: '11px',
                background: '#FF453A',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Abbrechen
            </button>
          </div>
        )}
      </div>
    </Popup>
  </Marker>
);
```

### 4. Vehicle List Item Click Handler (Line ~1488-1495)

Replace the vehicle list item div with:

```typescript
return (
  <div
    key={vehicle.id}
    className={`vehicle-list-item ${selectedVehicleId === vehicle.id ? 'selected' : ''}`}
    onClick={() => handleVehicleClick(vehicle)}
    style={{ cursor: 'pointer' }}
  >
    <div className="vehicle-list-left">
      <span className="vehicle-name">
        {vehicleTypeConfigs[vehicle.vehicleType].icon} 1/{vehicle.id.toString().padStart(2, '0')}-1 (E)
      </span>
      <span className="vehicle-status-icon" style={{ background: statusInfo.color }}></span>
    </div>
    {incident && (
      <div className="vehicle-list-incident">
        {incident.type} • {incident.locationName}
      </div>
    )}
    {status === 'S3' && vehicle.routeDuration > 0 && (
      <div className="vehicle-eta">
        ETA: {Math.ceil((vehicle.routeDuration - ((Date.now() - vehicle.routeStartTime) / 1000)) / 60)} Min
      </div>
    )}
  </div>
);
```

### 5. Filter Buttons Functionality (Line ~1468-1471)

Replace the filter buttons section with:

```typescript
<div className="vehicle-filters">
  <button
    className={`filter-btn ${vehicleFilter === 'all' ? 'active' : ''}`}
    onClick={() => {
      setVehicleFilter('all');
      soundManager.playSirenBeep();
    }}
  >
    Alle
  </button>
  <button
    className={`filter-btn ${vehicleFilter === 'S1' ? 'active' : ''}`}
    onClick={() => {
      setVehicleFilter('S1');
      soundManager.playSirenBeep();
    }}
    style={{ background: vehicleFilter === 'S1' ? '#30D158' : 'transparent' }}
  >
    S1: {vehicleStatusCounts.S1}
  </button>
  <button
    className={`filter-btn ${vehicleFilter === 'S3' ? 'active' : ''}`}
    onClick={() => {
      setVehicleFilter('S3');
      soundManager.playSirenBeep();
    }}
    style={{ background: vehicleFilter === 'S3' ? '#FF9F0A' : 'transparent' }}
  >
    S3: {vehicleStatusCounts.S3}
  </button>
  <button
    className={`filter-btn ${vehicleFilter === 'S4' ? 'active' : ''}`}
    onClick={() => {
      setVehicleFilter('S4');
      soundManager.playSirenBeep();
    }}
    style={{ background: vehicleFilter === 'S4' ? '#FF453A' : 'transparent' }}
  >
    S4: {vehicleStatusCounts.S4}
  </button>
</div>
```

### 6. Apply Vehicle Filter (Line ~1474-1496)

Replace the vehicle list mapping section with:

```typescript
<div className="panel-content">
  {getFilteredVehicles()
    .sort((a, b) => {
      const statusOrder: { [key in VehicleStatus]: number} = { S1: 1, S3: 2, S4: 3, S5: 4, S6: 5, S8: 6 };
      return statusOrder[a.status] - statusOrder[b.status];
    })
    .map(vehicle => {
      // ... rest of the vehicle item code from #4 above
    })}
</div>
```

### 7. CSS Additions Needed

Add to App.css:

```css
/* Vehicle list item selected state */
.vehicle-list-item.selected {
  background: rgba(10, 132, 255, 0.1);
  border-left: 3px solid #0A84FF;
}

.vehicle-list-item {
  transition: all 0.2s ease;
}

.vehicle-list-item:hover {
  background: rgba(142, 142, 147, 0.1);
  transform: translateX(2px);
}

/* Vehicle ETA display */
.vehicle-eta {
  font-size: 11px;
  color: #FF9F0A;
  margin-top: 4px;
  font-weight: 600;
}

/* Filter button active state */
.filter-btn.active {
  box-shadow: 0 0 0 2px #0A84FF;
  font-weight: 600;
}

.filter-btn {
  transition: all 0.2s ease;
}

.filter-btn:hover {
  transform: scale(1.05);
}
```

## Testing Checklist

- [ ] Click on vehicle in list → map centers on vehicle
- [ ] Click on vehicle marker → popup shows detailed info
- [ ] Filter buttons change vehicle list display
- [ ] Filter button shows active state
- [ ] Vehicle list shows ETA for S3 vehicles
- [ ] Vehicle popup shows status change buttons (S1 → S6)
- [ ] Vehicle popup shows cancel button (S3/S4)
- [ ] Click incident in overlay → map centers on incident
- [ ] Selected vehicle is highlighted in list
- [ ] Sound effects play on interactions

## Line Numbers Reference

- **Line 499-500**: State variables
- **Line 1285**: Add handler functions after getStatusBadge
- **Line 406-413**: Enhanced VehicleMarker popup
- **Line 1468-1471**: Filter buttons
- **Line 1474-1496**: Vehicle list with filter applied
- **Line 1488-1495**: Vehicle list item with onClick

## Notes

- All changes maintain Apple minimalist styling
- Sound feedback using soundManager for user actions
- TypeScript types are properly maintained
- LST-SIM interaction patterns are followed
- No existing functionality is broken
