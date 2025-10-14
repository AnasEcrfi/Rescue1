import type { PoliceStation, Location } from '../types';

// Police stations in Frankfurt am Main
export const policeStations: PoliceStation[] = [
  { id: 1, name: 'Polizeirevier Innenstadt', position: [50.1109, 8.6821] },
  { id: 2, name: 'Polizeirevier Bahnhofsviertel', position: [50.1070, 8.6647] },
  { id: 3, name: 'Polizeirevier Sachsenhausen', position: [50.1025, 8.6738] },
  { id: 4, name: 'Polizeirevier Bornheim', position: [50.1261, 8.7166] },
  { id: 5, name: 'Polizeirevier Westend', position: [50.1188, 8.6501] },
];

// Real Frankfurt locations for incidents
export const frankfurtLocations: Location[] = [
  { name: 'Römerberg', position: [50.1104, 8.6827] },
  { name: 'Hauptbahnhof', position: [50.1070, 8.6638] },
  { name: 'Alte Oper', position: [50.1158, 8.6726] },
  { name: 'Zeil (Shopping Street)', position: [50.1148, 8.6848] },
  { name: 'Sachsenhausen Ufer', position: [50.1025, 8.6780] },
  { name: 'Palmengarten', position: [50.1223, 8.6613] },
  { name: 'Goethe Universität', position: [50.1280, 8.6644] },
  { name: 'Hauptwache', position: [50.1136, 8.6791] },
  { name: 'Konstablerwache', position: [50.1156, 8.6924] },
  { name: 'Frankfurt Zoo', position: [50.1159, 8.7023] },
];
