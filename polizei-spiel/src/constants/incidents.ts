import type { IncidentType } from '../types';

// Processing durations for each incident type (in seconds)
export const incidentProcessingTimes: { [key: string]: number } = {
  // Bestehende
  'Diebstahl': 180,           // 3 Min
  'Einbruch': 300,            // 5 Min
  'Verkehrsunfall': 240,      // 4 Min
  'Ruhestörung': 120,         // 2 Min
  'Schlägerei': 210,          // 3.5 Min
  'Verdächtige Person': 150,  // 2.5 Min
  'Banküberfall': 420,        // 7 Min
  'Demonstration': 360,       // 6 Min
  'Geiselnahme': 480,         // 8 Min
  'Häusliche Gewalt': 270,    // 4.5 Min
  'Raub': 240,                // 4 Min
  'Vandalismus': 150,         // 2.5 Min

  // NEU: Mehr Vielfalt
  'Verfolgungsjagd': 360,     // 6 Min
  'Bombendrohung': 540,       // 9 Min
  'Vermisste Person': 420,    // 7 Min
  'Häuslicher Streit': 210,   // 3.5 Min
  'Illegales Straßenrennen': 180, // 3 Min
  'Betrunkener Fahrer': 150,  // 2.5 Min
  'Ladendiebstahl': 120,      // 2 Min
  'Brandstiftung': 300,       // 5 Min
  'Drogenhandel': 360,        // 6 Min
  'Belästigung': 180,         // 3 Min
  'Falschparker': 90,         // 1.5 Min
  'Lärmbelästigung': 120,     // 2 Min
};

export const incidentTypes: IncidentType[] = [
  // Bestehende Einsatztypen
  { type: 'Diebstahl', description: 'Diebstahl gemeldet', priority: 'medium', requiredVehicles: 1 },
  { type: 'Einbruch', description: 'Einbruch in Wohnung', priority: 'high', requiredVehicles: 2 },
  { type: 'Verkehrsunfall', description: 'Verkehrsunfall mit Verletzten', priority: 'high', requiredVehicles: 2 },
  { type: 'Ruhestörung', description: 'Ruhestörung', priority: 'low', requiredVehicles: 1 },
  { type: 'Schlägerei', description: 'Schlägerei gemeldet', priority: 'high', requiredVehicles: 2 },
  { type: 'Verdächtige Person', description: 'Verdächtige Person gesichtet', priority: 'medium', requiredVehicles: 1 },
  { type: 'Banküberfall', description: 'Banküberfall im Gange', priority: 'high', requiredVehicles: 3 },
  { type: 'Demonstration', description: 'Unangemeldete Demonstration', priority: 'medium', requiredVehicles: 3 },
  { type: 'Geiselnahme', description: 'Geiselnahme gemeldet', priority: 'high', requiredVehicles: 3 },
  { type: 'Häusliche Gewalt', description: 'Häusliche Gewalt', priority: 'high', requiredVehicles: 2 },
  { type: 'Raub', description: 'Raub auf offener Straße', priority: 'high', requiredVehicles: 2 },
  { type: 'Vandalismus', description: 'Sachbeschädigung', priority: 'low', requiredVehicles: 1 },

  // NEU: Mehr Einsatztypen für Vielfalt
  { type: 'Verfolgungsjagd', description: 'Verfolgungsjagd im Gange', priority: 'high', requiredVehicles: 3 },
  { type: 'Bombendrohung', description: 'Bombendrohung', priority: 'high', requiredVehicles: 4 },
  { type: 'Vermisste Person', description: 'Vermisste Person gemeldet', priority: 'high', requiredVehicles: 2 },
  { type: 'Häuslicher Streit', description: 'Häuslicher Streit', priority: 'medium', requiredVehicles: 1 },
  { type: 'Illegales Straßenrennen', description: 'Illegales Straßenrennen', priority: 'high', requiredVehicles: 2 },
  { type: 'Betrunkener Fahrer', description: 'Betrunkener Fahrer gemeldet', priority: 'medium', requiredVehicles: 1 },
  { type: 'Ladendiebstahl', description: 'Ladendiebstahl im Gange', priority: 'low', requiredVehicles: 1 },
  { type: 'Brandstiftung', description: 'Brandstiftung gemeldet', priority: 'high', requiredVehicles: 2 },
  { type: 'Drogenhandel', description: 'Verdacht auf Drogenhandel', priority: 'medium', requiredVehicles: 2 },
  { type: 'Belästigung', description: 'Belästigung gemeldet', priority: 'medium', requiredVehicles: 1 },
  { type: 'Falschparker', description: 'Falschparker blockiert Straße', priority: 'low', requiredVehicles: 1 },
  { type: 'Lärmbelästigung', description: 'Lärmbelästigung', priority: 'low', requiredVehicles: 1 },
];

// Eskalations-Regeln: Von welchem Einsatztyp zu welchem kann eskaliert werden
export const escalationRules: { [key: string]: { newType: string; newPriority: 'low' | 'medium' | 'high' } } = {
  // Bestehende
  'Diebstahl': { newType: 'Raub', newPriority: 'high' },
  'Verdächtige Person': { newType: 'Schlägerei', newPriority: 'high' },
  'Ruhestörung': { newType: 'Schlägerei', newPriority: 'high' },
  'Schlägerei': { newType: 'Banküberfall', newPriority: 'high' },

  // NEU: Mehr Eskalations-Möglichkeiten
  'Ladendiebstahl': { newType: 'Diebstahl', newPriority: 'medium' },
  'Häuslicher Streit': { newType: 'Häusliche Gewalt', newPriority: 'high' },
  'Betrunkener Fahrer': { newType: 'Verfolgungsjagd', newPriority: 'high' },
  'Illegales Straßenrennen': { newType: 'Verkehrsunfall', newPriority: 'high' },
  'Lärmbelästigung': { newType: 'Ruhestörung', newPriority: 'low' },
  'Falschparker': { newType: 'Verkehrsunfall', newPriority: 'high' },
  'Belästigung': { newType: 'Häusliche Gewalt', newPriority: 'high' },
  'Drogenhandel': { newType: 'Schlägerei', newPriority: 'high' },
  'Brandstiftung': { newType: 'Bombendrohung', newPriority: 'high' },
};
