// Funkspruch-Templates (LST-SIM Style für Polizei)

import type { VehicleStatus } from '../types';

// Funkspruch-Codes (wie bei echter Polizei)
export const radioStatusMessages = {
  S1: 'Status 1, Einsatzbereit',
  S3: 'Status 3 zum Einsatz',
  S4: 'Status 4, Einsatzort erreicht',
  S5: 'Status 5, Sprechwunsch',
  S6: 'Status 6, Außer Dienst',
  S8: 'Status 8, Rückkehr zur Wache',
};

// Dynamische Funkspruch-Generierung
export const generateRadioMessage = (
  vehicleCallsign: string,
  _statusFrom: VehicleStatus,
  statusTo: VehicleStatus,
  incidentType?: string,
  location?: string
): string => {
  let message = `${vehicleCallsign}, `;

  switch (statusTo) {
    case 'S1':
      message += radioStatusMessages.S1;
      break;

    case 'S3':
      message += `${radioStatusMessages.S3}`;
      if (incidentType) message += ` ${incidentType}`;
      if (location) message += ` in ${location}`;
      break;

    case 'S4':
      message += radioStatusMessages.S4;
      if (location) message += `, ${location}`;
      break;

    case 'S5':
      message += radioStatusMessages.S5;
      break;

    case 'S6':
      message += radioStatusMessages.S6;
      break;

    case 'S8':
      message += radioStatusMessages.S8;
      break;

    default:
      message += `Status ${statusTo}`;
  }

  return message;
};

// Sprechwunsch-Nachrichten (S5)
export type SpeakRequestReason =
  | 'backup'
  | 'escalation'
  | 'suspect_arrested'
  | 'vehicle_defect'
  | 'additional_info'
  | 'unclear_situation'
  | 'request_specialist';

export const speakRequestMessages: { [key in SpeakRequestReason]: string } = {
  backup: 'Verstärkung erforderlich',
  escalation: 'Lage eskaliert',
  suspect_arrested: 'Person festgenommen, weitere Anweisungen erbeten',
  vehicle_defect: 'Fahrzeugdefekt, benötige Ersatzfahrzeug',
  additional_info: 'Zusätzliche Informationen zum Einsatz',
  unclear_situation: 'Lage unklar, benötige Rücksprache',
  request_specialist: 'Spezialeinheit angefordert',
};

// Leitstellen-Befehle (wie LST-SIM)
export interface RadioCommand {
  code: string;
  name: string;
  description: string;
  requiresConfirmation: boolean;
}

export const radioCommands: RadioCommand[] = [
  {
    code: 'E',
    name: 'Einsatz beenden',
    description: 'Beendet den aktuellen Einsatz',
    requiresConfirmation: true,
  },
  {
    code: 'H',
    name: 'Zurück zur Wache',
    description: 'Sendet Fahrzeug zur Wache',
    requiresConfirmation: false,
  },
  {
    code: 'C',
    name: 'Status-Korrektur',
    description: 'Fordert Status-Bestätigung an',
    requiresConfirmation: false,
  },
  {
    code: 'U',
    name: 'Fahrzeug orten',
    description: 'Zeigt Fahrzeug auf Karte',
    requiresConfirmation: false,
  },
  {
    code: 'J',
    name: 'Sprechwunsch beantworten',
    description: 'Bestätigt Sprechwunsch',
    requiresConfirmation: false,
  },
];

// Leitstellen-Antworten
export const dispatcherResponses = {
  understood: 'Verstanden',
  coming: 'Kommt',
  negative: 'Negativ',
  wait: 'Warten',
  proceed: 'Weiter',
};

// Zufällige Bestätigungen (für Realismus)
export const acknowledgements = [
  'Verstanden',
  'Roger',
  'Bestätigt',
  'Alles klar',
  'Empfangen',
];

export const getRandomAcknowledgement = (): string => {
  return acknowledgements[Math.floor(Math.random() * acknowledgements.length)];
};
