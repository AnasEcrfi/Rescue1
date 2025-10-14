import React from 'react';
import type { WeatherState } from '../types/weather';
import { weatherConditions } from '../constants/weather';

interface WeatherDisplayProps {
  weather: WeatherState;
  gameTime: number;
}

const WeatherDisplay: React.FC<WeatherDisplayProps> = ({ weather, gameTime }) => {
  const currentCondition = weatherConditions[weather.current];
  const forecastCondition = weatherConditions[weather.forecast];

  // Berechne verbleibende Zeit bis zum Wetterwechsel
  const remainingMinutes = Math.max(0, Math.round(weather.nextChange - gameTime));

  return (
    <div className="weather-display" title={`${currentCondition.name} • Nächstes: ${forecastCondition.name} in ${remainingMinutes}min`}>
      <span className="weather-icon">{currentCondition.icon}</span>
      <span className="weather-separator">→</span>
      <span className="weather-icon">{forecastCondition.icon}</span>
      <span className="weather-time">{remainingMinutes}min</span>
    </div>
  );
};

export default WeatherDisplay;
