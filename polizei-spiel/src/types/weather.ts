// Wetter-System Types (LST-SIM inspiriert)

export type WeatherType = 'sunny' | 'rainy' | 'stormy' | 'foggy' | 'snowy';

export interface WeatherCondition {
  type: WeatherType;
  name: string;
  icon: string;
  description: string;
  // Gameplay-Effekte
  vehicleSpeedMultiplier: number; // 1.0 = normal, 0.5 = 50% langsamer
  incidentMultiplier: number; // 1.0 = normal, 1.5 = 50% mehr Einsätze
  visibilityReduction: number; // 0-1 (0 = keine Reduktion, 1 = maximale Reduktion)
  // Spezifische Einsatztyp-Modifikatoren
  incidentTypeModifiers: { [key: string]: number }; // z.B. "Verkehrsunfall": 2.0 bei Regen
}

export interface WeatherState {
  current: WeatherType;
  duration: number; // Wie lange noch (in Minuten)
  nextChange: number; // gameTime wann Wetter wechselt
  forecast: WeatherType; // Nächstes Wetter
}
