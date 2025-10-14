import type { VehicleType, VehicleTypeConfig } from '../types';

// Fahrzeugtyp-Konfigurationen (lstsim.de inspiriert)
export const vehicleTypeConfigs: { [key in VehicleType]: VehicleTypeConfig } = {
  'Streifenwagen': {
    type: 'Streifenwagen',
    color: '#0A84FF',
    maxSpeed: 160,
    acceleration: 3.5,
    suitableFor: ['Diebstahl', 'Ruhestörung', 'Verdächtige Person', 'Verkehrsunfall', 'Raub', 'Vandalismus', 'Häusliche Gewalt'],
    displayName: 'FuStW',
    icon: 'FZ',
    fuelConsumption: 0.12, // 12 Liter/100km = 0.12 L/km
    tankCapacity: 60, // Liter (typisch für Streifenwagen)
    crewSize: 2, // 2 Beamte
  },
  'SEK': {
    type: 'SEK',
    color: '#FF453A',
    maxSpeed: 180,
    acceleration: 4.0,
    suitableFor: ['Banküberfall', 'Geiselnahme', 'Schlägerei', 'Einbruch'],
    displayName: 'SEK',
    icon: 'SK',
    fuelConsumption: 0.15, // Höherer Verbrauch durch schwere Ausrüstung
    tankCapacity: 70,
    crewSize: 4, // 4 Beamte (Trupp)
  },
  'Zivilfahrzeug': {
    type: 'Zivilfahrzeug',
    color: '#8E8E93',
    maxSpeed: 140,
    acceleration: 3.0,
    suitableFor: ['Verdächtige Person', 'Diebstahl', 'Vandalismus'],
    displayName: 'Zivil',
    icon: 'ZV',
    fuelConsumption: 0.08, // Niedriger Verbrauch (normales Auto)
    tankCapacity: 50,
    crewSize: 2,
  },
  'Polizeihubschrauber': {
    type: 'Polizeihubschrauber',
    color: '#30D158',
    maxSpeed: 250,
    acceleration: 5.0,
    suitableFor: ['Verfolgungsjagd', 'Großeinsatz', 'Demonstration', 'Banküberfall', 'Geiselnahme'],
    displayName: 'Heli',
    icon: 'HB',
    fuelConsumption: 0.80, // Sehr hoher Verbrauch (Helikopter)
    tankCapacity: 400, // Großer Tank
    crewSize: 3, // Pilot + 2 Beobachter
  },
};
