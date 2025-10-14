import L from 'leaflet';
import type { TimeOfDay, Vehicle, Incident, IncidentType, VehicleType, WeatherType } from '../types';
import { incidentTypes } from '../constants/incidents';
import { vehicleTypeConfigs } from '../constants/vehicleTypes';
import { weatherConditions } from '../constants/weather';

// Helper: Bestimme Tageszeit-Typ basierend auf Stunde
export const getTimeOfDay = (hour: number): TimeOfDay => {
  if (hour >= 22 || hour < 6) return 'night';
  if ((hour >= 6 && hour < 8) || (hour >= 18 && hour < 20)) return 'dusk';
  if ((hour >= 7 && hour < 9) || (hour >= 17 && hour < 19)) return 'rushHour';
  return 'day';
};

// Helper: Berechne Overlay-Opacity basierend auf Tageszeit
export const getMapOverlayOpacity = (hour: number): number => {
  if (hour >= 18 && hour < 20) return 0.2; // Dämmerung abends
  if (hour >= 6 && hour < 8) return 0.2;   // Dämmerung morgens
  if (hour >= 20 || hour < 6) return 0.5;  // Nacht
  return 0; // Tag
};

// Helper: Gewichtete Zufallsauswahl basierend auf Tageszeit
export const getWeightedIncidentType = (hour: number, weather?: WeatherType): IncidentType => {
  const timeOfDay = getTimeOfDay(hour);

  // Basis-Gewichtungen (alle Einsatztypen mit Standardgewichtung 1)
  const weights = incidentTypes.map(incident => {
    let weight = 1;

    // Nachts (22:00-05:59)
    if (timeOfDay === 'night') {
      if (['Einbruch', 'Vandalismus'].includes(incident.type)) weight *= 3;
      if (['Häusliche Gewalt', 'Raub'].includes(incident.type)) weight *= 2;
      if (['Verkehrsunfall', 'Demonstration'].includes(incident.type)) weight *= 0.5;
    }

    // Tagsüber (08:00-17:59)
    if (timeOfDay === 'day') {
      if (['Verkehrsunfall', 'Diebstahl'].includes(incident.type)) weight *= 2;
      if (incident.type === 'Demonstration') weight *= 3;
      if (['Einbruch', 'Vandalismus'].includes(incident.type)) weight *= 0.5;
    }

    // Rush Hour (07:00-09:00, 17:00-19:00)
    if (timeOfDay === 'rushHour') {
      if (incident.type === 'Verkehrsunfall') weight *= 3;
      if (incident.type === 'Ruhestörung') weight *= 2;
    }

    // 🌦️ BUG FIX: Wetter-Modifikatoren anwenden
    if (weather) {
      const weatherCondition = weatherConditions[weather];
      const modifier = weatherCondition.incidentTypeModifiers[incident.type];
      if (modifier !== undefined) {
        weight *= modifier;
      }
    }

    return weight;
  });

  // Gewichtete Zufallsauswahl
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  let random = Math.random() * totalWeight;

  for (let i = 0; i < incidentTypes.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return incidentTypes[i];
    }
  }

  // Fallback (sollte nie erreicht werden)
  return incidentTypes[0];
};

// Berechne minimale ETA von allen zugewiesenen Fahrzeugen
export const calculateMinETA = (incident: Incident, vehicles: Vehicle[]): number => {
  const assignedVehicles = vehicles.filter(v =>
    incident.assignedVehicleIds.includes(v.id)
  );

  if (assignedVehicles.length === 0) return 0;

  const etas = assignedVehicles.map(v => {
    if (v.status === 'S3') {
      // Noch unterwegs
      const remaining = v.routeDuration - ((Date.now() - v.routeStartTime) / 1000);
      return Math.max(0, remaining / 60); // in Minuten
    }
    return 0;
  });

  return Math.min(...etas.filter(eta => eta > 0)) || 0;
};

// Icon Cache für bessere Performance
const incidentIconCache = new Map<string, L.DivIcon>();

// Icon-Mapping für MEDIUM und LOW Priority Einsätze (Hybrid-Ansatz)
const incidentTypeIcons: { [key: string]: string } = {
  // MEDIUM Priority - kontextuelle Icons
  'Diebstahl': '👜',
  'Verdächtige Person': '👤',
  'Demonstration': '📢',
  'Häuslicher Streit': '🏠',
  'Betrunkener Fahrer': '🍺',
  'Drogenhandel': '💊',
  'Belästigung': '⚠️',

  // LOW Priority - kontextuelle Icons
  'Ruhestörung': '🔊',
  'Vandalismus': '🎨',
  'Ladendiebstahl': '🛍️',
  'Falschparker': '🚗',
  'Lärmbelästigung': '🔊',
};

// Modern incident marker (mit Eskalations-Effekt, typspezifischen Icons und Status)
export const createIncidentIcon = (
  priority: 'low' | 'medium' | 'high',
  hasEscalated: boolean = false,
  incidentType?: string,
  status?: 'active' | 'completed' | 'failed'
) => {
  // Cache-Key basierend auf priority, hasEscalated, incidentType UND status
  const cacheKey = `${priority}-${hasEscalated}-${incidentType || 'default'}-${status || 'active'}`;

  if (incidentIconCache.has(cacheKey)) {
    return incidentIconCache.get(cacheKey)!;
  }

  // ✨ OPTION A: Grüne Farbe für abgeschlossene Einsätze
  let color: string;
  let opacity: string;
  let iconEmoji: string;

  if (status === 'completed') {
    color = '#30D158'; // Grün
    opacity = '0.6'; // Halbtransparent
    iconEmoji = '✓'; // Checkmark
  } else if (status === 'failed') {
    color = '#8E8E93'; // Grau
    opacity = '0.5'; // Halbtransparent
    iconEmoji = '✕'; // X-Mark
  } else {
    // Aktive Einsätze
    const colors = {
      high: '#FF453A',
      medium: '#FF9F0A',
      low: '#64D2FF',
    };
    color = colors[priority];
    opacity = '1.0';

    // HYBRID-ANSATZ:
    // - HIGH Priority: Immer Sirene 🚨 (dringend = einheitlich)
    // - MEDIUM/LOW: Typspezifische Icons (mehr Kontext)
    iconEmoji = '🚨'; // Default für HIGH

    if (priority !== 'high' && incidentType && incidentTypeIcons[incidentType]) {
      iconEmoji = incidentTypeIcons[incidentType];
    }
  }

  const size = priority === 'high' ? 40 : priority === 'medium' ? 35 : 30;
  const pulseClass = hasEscalated ? 'escalated-pulse' : '';

  const icon = L.divIcon({
    className: `custom-incident-icon ${pulseClass}`,
    html: `
      <div style="
        background: ${color};
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        border: 3px solid white;
        font-size: 20px;
        opacity: ${opacity};
        ${hasEscalated && status === 'active' ? 'animation: escalate-pulse 1s ease-in-out infinite;' : ''}
      ">
        ${iconEmoji}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });

  // Cache das Icon für zukünftige Verwendung
  incidentIconCache.set(cacheKey, icon);
  return icon;
};

// Vehicle icon with status-based styling
export const createVehicleIcon = (
  _vehicleType: string,
  status: string,
  bearing: number,
  displayName: string,
  color: string
) => {
  const statusColors = {
    S1: '#30D158',  // Grün - Bereit
    S3: '#FF9F0A',  // Orange - Anfahrt
    S4: '#FF453A',  // Rot - Am Einsatzort
    S5: '#0A84FF',  // Blau - Sprechwunsch
    S6: '#8E8E93',  // Grau - Außer Dienst
    S8: '#64D2FF',  // Hellblau - Rückfahrt
  };

  const bgColor = statusColors[status as keyof typeof statusColors] || color;

  return L.divIcon({
    className: 'custom-vehicle-icon',
    html: `
      <div style="
        background: ${bgColor};
        padding: 4px 8px;
        border-radius: 4px;
        color: white;
        font-weight: bold;
        font-size: 11px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.3);
        border: 2px solid white;
        transform: rotate(${bearing}deg);
        white-space: nowrap;
      ">
        ${displayName}
      </div>
    `,
    iconSize: [40, 20],
    iconAnchor: [20, 10],
  });
};

// Call icon for incoming emergency calls
export const createCallIcon = (priority: 'low' | 'medium' | 'high') => {
  const colors = {
    high: '#FF453A',
    medium: '#FF9F0A',
    low: '#64D2FF',
  };

  return L.divIcon({
    className: 'custom-call-icon',
    html: `
      <div style="
        background: ${colors[priority]};
        width: 35px;
        height: 35px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 12px rgba(0,0,0,0.4);
        border: 3px solid white;
        font-size: 18px;
        animation: call-pulse 1.5s ease-in-out infinite;
      ">
        📞
      </div>
    `,
    iconSize: [35, 35],
    iconAnchor: [17.5, 17.5],
  });
};

/**
 * Berechnet realistische Routendauer basierend auf Fahrzeugtyp, Wetter, Müdigkeit und Sonderrechten
 * @param vehicleType Typ des Fahrzeugs
 * @param routeDistance Streckenlänge in Metern
 * @param weather Aktuelles Wetter
 * @param crewFatigue Müdigkeit der Besatzung (0-100)
 * @param hasSpecialRights Ob Fahrzeug mit Sonderrechten (Blaulicht) fährt
 * @param gameSpeed Spielgeschwindigkeit (1x, 2x, 3x, 4x) - optional, default 1
 * @returns Routendauer in Sekunden (bereits an gameSpeed angepasst)
 */
export const calculateRealisticRouteDuration = (
  vehicleType: VehicleType,
  routeDistance: number,
  weather: WeatherType,
  crewFatigue: number,
  hasSpecialRights: boolean,
  gameSpeed: number = 1
): number => {
  const vehicleConfig = vehicleTypeConfigs[vehicleType];

  // Basis-Geschwindigkeit des Fahrzeugs (km/h → m/s)
  const baseSpeed = vehicleConfig.maxSpeed / 3.6;

  // Faktoren:
  // 1. Wetter (0.5x - 1.0x)
  const weatherFactor = weatherConditions[weather].vehicleSpeedMultiplier;

  // 2. Müdigkeit (30% langsamer bei >80%)
  const fatigueFactor = crewFatigue > 80 ? 0.7 : 1.0;

  // 3. Sonderrechte (Blaulicht): 30% schneller
  const specialRightsFactor = hasSpecialRights ? 1.3 : 1.0;

  // 4. Realistische Durchschnittsgeschwindigkeit:
  //    Polizeifahrzeuge fahren nicht konstant maxSpeed, sondern ~70% davon
  //    (Kurven, Ampeln, Verkehr, etc.)
  //    AUSNAHME: Hubschrauber fliegen Luftlinie und erreichen ~90% ihrer maxSpeed
  const cityFactor = vehicleType === 'Polizeihubschrauber' ? 0.9 : 0.7;

  // Effektive Geschwindigkeit
  const effectiveSpeed = baseSpeed * weatherFactor * fatigueFactor * specialRightsFactor * cityFactor;

  // Routendauer (Weg/Geschwindigkeit)
  let duration = routeDistance / effectiveSpeed;

  // 🎮 BUG FIX: Spielgeschwindigkeit anwenden
  // Bei gameSpeed = 2x sollte die Route in halber Zeit durchfahren werden
  duration = duration / gameSpeed;

  // Minimum 30 Sekunden (auch für sehr kurze Strecken, bereits mit gameSpeed skaliert)
  return Math.max(30 / gameSpeed, duration);
};
