// Frankfurt Polizei Funkrufnamen-System (Hessen)
// Basiert auf dem offiziellen Hessischen Polizei-Funkrufnamen-System
// Format: "[Stadt] [Revier]/[Fahrzeugtyp][Nummer]"
//
// Fahrzeugtypen (Hessen-Standard):
// /20-29 = Streifenwagen (FuStW)
// /70-79 = Zivilfahrzeuge
// /50-59 = Spezialeinheiten (SEK, etc.)
// /60-69 = Motorräder
// /80-89 = Hubschrauber

import type { VehicleType } from '../types';

/**
 * Generiert einen realistischen Frankfurter Polizei-Funkrufnamen nach Hessen-Standard
 * @param vehicleId - Die interne Fahrzeug-ID (1-based)
 * @param stationId - Die Wachen-ID (kann sehr groß sein bei OSM-Daten)
 * @param vehicleType - Der Fahrzeugtyp
 */
export function generateFrankfurtCallsign(
  vehicleId: number,
  stationId: number,
  vehicleType: VehicleType
): string {
  // Normalisiere stationId auf 1-5 (für Frankfurt haben wir 5 Reviere)
  // Falls stationId sehr groß ist (OSM-ID), nehme Modulo
  const revierNumber = stationId > 100 ? ((stationId % 5) + 1) : stationId;

  // Fahrzeugtyp-spezifische Rufzeichen nach Hessen-Standard
  switch (vehicleType) {
    case 'SEK':
      // SEK: Frank [Revier]/5[Nummer]
      return `Frank ${revierNumber}/5${vehicleId}`;

    case 'Zivilfahrzeug':
      // Zivilfahrzeuge: Frank [Revier]/7[Nummer]
      return `Frank ${revierNumber}/7${vehicleId}`;

    case 'Polizeihubschrauber':
      // Hubschrauber: Christoph Frankfurt [Nummer]
      return `Christoph ${vehicleId}`;

    case 'Streifenwagen':
    default:
      // Streifenwagen (FuStW): Frank [Revier]/2[Nummer]
      // Beispiele: Frank 1/21, Frank 1/22, Frank 2/21, etc.
      return `Frank ${revierNumber}/2${vehicleId}`;
  }
}

/**
 * Gibt eine verkürzte Version des Rufzeichens zurück (für kompakte Anzeigen)
 * @param callsign - Der vollständige Funkrufname
 */
export function getShortCallsign(callsign: string): string {
  // "Frank 1/31" -> "1/31"
  // "SEK Frank 1" -> "SEK 1"
  // "Christoph Frank 1" -> "Chr 1"

  if (callsign.startsWith('SEK')) {
    return callsign.replace('SEK Frank ', 'SEK ');
  }

  if (callsign.startsWith('Christoph')) {
    return callsign.replace('Christoph Frank ', 'Chr ');
  }

  if (callsign.includes('Zivil')) {
    return callsign.replace('Frank Zivil ', 'Z');
  }

  // Standard: Remove "Frank " prefix
  return callsign.replace('Frank ', '');
}

/**
 * Beispiel-Rufzeichen für verschiedene Fahrzeugtypen und Wachen
 */
export const exampleCallsigns = {
  streifenwagen: [
    'Frank 1/21', 'Frank 1/22', 'Frank 1/23',
    'Frank 2/21', 'Frank 2/22', 'Frank 2/23',
    'Frank 3/21', 'Frank 3/22', 'Frank 3/23',
    'Frank 4/21', 'Frank 4/22', 'Frank 4/23',
    'Frank 5/21', 'Frank 5/22', 'Frank 5/23',
  ],
  sek: ['Frank 1/51', 'Frank 2/51', 'Frank 3/51'],
  zivil: ['Frank 1/71', 'Frank 2/71', 'Frank 3/71'],
  heli: ['Christoph 1', 'Christoph 2'],
};
