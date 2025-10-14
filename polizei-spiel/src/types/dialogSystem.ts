// Interactive Dialog System für 911/112 Operator Style Gameplay
// Ermöglicht schrittweise Informationsgewinnung durch Rückfragen

export interface DialogMessage {
  id: string;
  sender: 'caller' | 'dispatcher' | 'system';
  text: string;
  timestamp: number;
  emotion?: 'panic' | 'calm' | 'angry' | 'scared' | 'shocked';
}

export interface DialogOption {
  id: string;
  text: string; // Frage/Antwort-Text
  category: 'location' | 'incident_type' | 'persons' | 'danger' | 'description' | 'general';
  revealsInfo?: {
    location?: boolean; // Enthüllt Standort
    incidentType?: boolean; // Enthüllt Einsatztyp
    priority?: 'low' | 'medium' | 'high'; // Ändert Priorität
    involvedCount?: number; // Anzahl Betroffener
    additionalDetails?: string; // Zusätzliche Details
  };
  response: string; // Antwort des Anrufers
  responseEmotion?: 'panic' | 'calm' | 'angry' | 'scared' | 'shocked';
  followUpOptions?: string[]; // IDs der Folgefragen
  completesDialog?: boolean; // Beendet Dialog (alle Infos vorhanden)
}

export interface DialogState {
  currentStep: number;
  messagesHistory: DialogMessage[];
  availableOptions: DialogOption[];
  revealedInfo: {
    hasLocation: boolean;
    hasIncidentType: boolean;
    hasPriority: boolean;
    hasPersonCount: boolean;
    hasDescription: boolean;
  };
  isComplete: boolean; // Alle notwendigen Infos gesammelt
  canCreateIncident: boolean; // Mindestanforderungen erfüllt
}

export interface DialogTemplate {
  incidentType: string;
  initialMessage: {
    text: string;
    emotion: 'panic' | 'calm' | 'angry' | 'scared' | 'shocked';
  };
  callerProfile: {
    type: 'witness' | 'victim' | 'resident' | 'business' | 'anonymous' | 'employee';
    name?: string;
    phoneNumber?: string;
  };
  dialogTree: {
    [key: string]: DialogOption; // Key ist die Option-ID
  };
  initialOptions: string[]; // IDs der ersten verfügbaren Fragen
  // Versteckte Informationen (werden durch Dialog enthüllt)
  hiddenData: {
    position: [number, number];
    locationName: string;
    address: string;
    priority: 'low' | 'medium' | 'high';
    description: string;
    involvedCount?: number;
  };
}
