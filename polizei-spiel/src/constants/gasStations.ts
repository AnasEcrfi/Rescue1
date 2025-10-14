import type { GasStation } from '../types';

// Tankstellen in Frankfurt (echte OpenStreetMap Positionen)
export const gasStations: GasStation[] = [
  {
    id: 1,
    name: 'Aral Tankstelle Friedberger Landstraße 300',
    position: [50.13338, 8.69602], // Echte OSM Koordinaten
    brand: 'Aral',
  },
  {
    id: 2,
    name: 'Shell Station Eschersheimer Landstraße 523',
    position: [50.151684, 8.66213], // Echte OSM Koordinaten
    brand: 'Shell',
  },
  {
    id: 3,
    name: 'Esso Station Mörfelder Landstraße 230',
    position: [50.08895, 8.669092], // Echte OSM Koordinaten
    brand: 'Esso',
  },
  {
    id: 4,
    name: 'Aral Tankstelle Hanauer Landstraße 8',
    position: [50.1150, 8.70500], // Nähe Ostbahnhof
    brand: 'Aral',
  },
  {
    id: 5,
    name: 'Shell Station Rüsselsheimer Straße 22',
    position: [50.10297, 8.620094], // Echte OSM Koordinaten
    brand: 'Shell',
  },
  {
    id: 6,
    name: 'Total Station Lyoner Straße',
    position: [50.09419, 8.64955], // Niederrad Geschäftsviertel
    brand: 'Total',
  },
];
