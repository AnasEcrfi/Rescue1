// Wetter-Definitionen und -Logik (LST-SIM Style)

import type { WeatherCondition, WeatherType } from '../types/weather';

// Wetter-Bedingungen mit Gameplay-Effekten
export const weatherConditions: { [key in WeatherType]: WeatherCondition } = {
  sunny: {
    type: 'sunny',
    name: 'Sonnig',
    icon: '☀️',
    description: 'Klares Wetter, optimale Bedingungen',
    vehicleSpeedMultiplier: 1.0,
    incidentMultiplier: 1.0,
    visibilityReduction: 0,
    incidentTypeModifiers: {},
  },
  rainy: {
    type: 'rainy',
    name: 'Regen',
    icon: '🌧️',
    description: 'Regen - Fahrzeuge langsamer, mehr Verkehrsunfälle',
    vehicleSpeedMultiplier: 0.7, // 30% langsamer
    incidentMultiplier: 1.2, // 20% mehr Einsätze
    visibilityReduction: 0.3,
    incidentTypeModifiers: {
      'Verkehrsunfall': 2.0, // 100% mehr Verkehrsunfälle
      'Einbruch': 1.3, // 30% mehr Einbrüche (schlechtes Wetter = mehr Einbrecher)
    },
  },
  stormy: {
    type: 'stormy',
    name: 'Gewitter',
    icon: '⛈️',
    description: 'Gewitter - Stark reduzierte Geschwindigkeit, viele Einsätze',
    vehicleSpeedMultiplier: 0.5, // 50% langsamer
    incidentMultiplier: 1.5, // 50% mehr Einsätze
    visibilityReduction: 0.5,
    incidentTypeModifiers: {
      'Verkehrsunfall': 3.0, // 200% mehr Verkehrsunfälle
      'Vandalismus': 0.5, // 50% weniger Vandalismus (Leute bleiben drinnen)
      'Demonstration': 0.1, // Kaum Demos bei Gewitter
    },
  },
  foggy: {
    type: 'foggy',
    name: 'Nebel',
    icon: '🌫️',
    description: 'Nebel - Reduzierte Sicht und Geschwindigkeit',
    vehicleSpeedMultiplier: 0.8, // 20% langsamer
    incidentMultiplier: 1.1, // 10% mehr Einsätze
    visibilityReduction: 0.7, // Starke Sichtreduktion
    incidentTypeModifiers: {
      'Verkehrsunfall': 1.8, // 80% mehr Verkehrsunfälle
      'Verdächtige Person': 1.5, // Mehr verdächtige Personen im Nebel
    },
  },
  snowy: {
    type: 'snowy',
    name: 'Schnee/Eis',
    icon: '❄️',
    description: 'Schnee und Eis - Sehr gefährlich, viele Unfälle',
    vehicleSpeedMultiplier: 0.5, // 50% langsamer
    incidentMultiplier: 1.8, // 80% mehr Einsätze
    visibilityReduction: 0.4,
    incidentTypeModifiers: {
      'Verkehrsunfall': 4.0, // 300% mehr Verkehrsunfälle!
      'Schlägerei': 0.7, // Weniger Schlägereien (kalt draußen)
      'Demonstration': 0.2, // Kaum Demos bei Schnee
      'Häusliche Gewalt': 1.3, // Mehr häusliche Gewalt (Leute drinnen eingesperrt)
    },
  },
};

// Wetter-Wahrscheinlichkeiten basierend auf Tageszeit und Jahreszeit
// (Vereinfacht: wir nutzen nur die Stunde für Wahrscheinlichkeiten)
export const getWeatherProbabilities = (hour: number): { [key in WeatherType]: number } => {
  // Basis-Wahrscheinlichkeiten
  const base = {
    sunny: 0.5,
    rainy: 0.25,
    stormy: 0.05,
    foggy: 0.1,
    snowy: 0.1,
  };

  // Nachts mehr Nebel
  if (hour >= 22 || hour < 6) {
    base.foggy = 0.3;
    base.sunny = 0.2;
  }

  // Morgens (6-10 Uhr) mehr Nebel
  if (hour >= 6 && hour < 10) {
    base.foggy = 0.25;
    base.sunny = 0.4;
  }

  // Mittags meist sonnig
  if (hour >= 11 && hour < 16) {
    base.sunny = 0.7;
    base.foggy = 0.05;
  }

  // Abends (16-20 Uhr) mehr Regen
  if (hour >= 16 && hour < 20) {
    base.rainy = 0.35;
    base.stormy = 0.1;
  }

  return base;
};

// Wähle zufälliges Wetter basierend auf Wahrscheinlichkeiten
export const selectRandomWeather = (hour: number): WeatherType => {
  const probabilities = getWeatherProbabilities(hour);
  const random = Math.random();
  let cumulative = 0;

  for (const [weather, probability] of Object.entries(probabilities)) {
    cumulative += probability;
    if (random <= cumulative) {
      return weather as WeatherType;
    }
  }

  return 'sunny'; // Fallback
};

// Berechne Wetter-Wechsel-Dauer (in Minuten)
export const getWeatherDuration = (weather: WeatherType): number => {
  switch (weather) {
    case 'sunny':
      return 120 + Math.random() * 120; // 2-4 Stunden
    case 'rainy':
      return 60 + Math.random() * 60; // 1-2 Stunden
    case 'stormy':
      return 30 + Math.random() * 30; // 30-60 Minuten (kurz aber heftig)
    case 'foggy':
      return 90 + Math.random() * 90; // 1.5-3 Stunden
    case 'snowy':
      return 120 + Math.random() * 180; // 2-5 Stunden
    default:
      return 120;
  }
};

// Prüfe ob Wetter-Wechsel sinnvoll ist (keine zu schnellen Wechsel zwischen Extremen)
export const isValidWeatherTransition = (from: WeatherType, to: WeatherType): boolean => {
  // Direkte Wechsel von Schnee zu Gewitter oder umgekehrt sind unrealistisch
  if ((from === 'snowy' && to === 'stormy') || (from === 'stormy' && to === 'snowy')) {
    return false;
  }

  // Alle anderen Wechsel sind ok
  return true;
};

// Hole nächstes Wetter mit Validierung
export const getNextWeather = (current: WeatherType, hour: number): WeatherType => {
  let next = selectRandomWeather(hour);
  let attempts = 0;

  // Versuche max 5x ein gültiges Wetter zu finden
  while (!isValidWeatherTransition(current, next) && attempts < 5) {
    next = selectRandomWeather(hour);
    attempts++;
  }

  return next;
};

// Wetter-Overlay Opacity für Karte
export const getWeatherOverlayOpacity = (weather: WeatherType): number => {
  switch (weather) {
    case 'sunny':
      return 0;
    case 'rainy':
      return 0.15;
    case 'stormy':
      return 0.3;
    case 'foggy':
      return 0.4;
    case 'snowy':
      return 0.25;
    default:
      return 0;
  }
};

// CSS-Klasse für Wetter-Overlay
export const getWeatherOverlayClass = (weather: WeatherType): string => {
  switch (weather) {
    case 'rainy':
      return 'weather-rain';
    case 'stormy':
      return 'weather-storm';
    case 'foggy':
      return 'weather-fog';
    case 'snowy':
      return 'weather-snow';
    default:
      return '';
  }
};

/**
 * ERWEITERTE WETTER-EFFEKTE
 */

/**
 * Prüft ob Polizeihubschrauber bei aktuellem Wetter fliegen kann
 */
export const canHelicopterFly = (weather: WeatherType): boolean => {
  // Helicopter grounded bei Gewitter, starkem Nebel oder Schnee
  return weather !== 'stormy' && weather !== 'foggy' && weather !== 'snowy';
};

/**
 * Berechnet Processing-Time-Verlängerung durch Wetter
 * (z.B. bei Nebel schwieriger den Tatort zu untersuchen)
 */
export const getProcessingTimeMultiplier = (weather: WeatherType): number => {
  switch (weather) {
    case 'sunny':
      return 1.0;
    case 'rainy':
      return 1.1; // 10% länger
    case 'stormy':
      return 1.2; // 20% länger
    case 'foggy':
      return 1.3; // 30% länger (schlechte Sicht)
    case 'snowy':
      return 1.25; // 25% länger
    default:
      return 1.0;
  }
};

/**
 * Gibt Wetter-Warnung zurück (für Log-System)
 */
export const getWeatherWarning = (weather: WeatherType): string | null => {
  switch (weather) {
    case 'stormy':
      return '⚠️ GEWITTER: Polizeihubschrauber kann nicht fliegen!';
    case 'foggy':
      return '⚠️ NEBEL: Stark reduzierte Sicht, längere Bearbeitungszeiten';
    case 'snowy':
      return '⚠️ SCHNEE/EIS: Sehr gefährliche Straßenverhältnisse!';
    default:
      return null;
  }
};
