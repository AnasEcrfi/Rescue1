// Dialog-Templates für interaktives 911/112 Operator Gameplay
// Anrufer geben initial vage Informationen, Details werden durch Rückfragen ermittelt

import type { DialogTemplate } from '../types/dialogSystem';

export const dialogTemplates: { [key: string]: DialogTemplate } = {
  'Einbruch': {
    incidentType: 'Einbruch',
    initialMessage: {
      text: 'Polizei? Hallo? Ich... ich glaube bei mir wurde eingebrochen! Die Tür steht offen!',
      emotion: 'scared',
    },
    callerProfile: {
      type: 'victim',
      name: 'Fischer, Anna',
    },
    dialogTree: {
      'ask_location': {
        id: 'ask_location',
        text: 'Wo befinden Sie sich genau? Geben Sie mir bitte Ihre Adresse.',
        category: 'location',
        revealsInfo: {
          location: true,
        },
        response: 'Ich bin in der {ADDRESS}. Bitte kommen Sie schnell!',
        responseEmotion: 'scared',
        followUpOptions: ['ask_what_happened', 'ask_danger'],
      },
      'ask_what_happened': {
        id: 'ask_what_happened',
        text: 'Was genau ist passiert? Wann haben Sie den Einbruch bemerkt?',
        category: 'description',
        revealsInfo: {
          incidentType: true,
        },
        response: 'Ich bin gerade nach Hause gekommen. Die Wohnungstür war aufgebrochen. Überall liegt alles durcheinander!',
        responseEmotion: 'shocked',
        followUpOptions: ['ask_danger', 'ask_stolen'],
        completesDialog: false,
      },
      'ask_danger': {
        id: 'ask_danger',
        text: 'Sind die Täter noch vor Ort? Sind Sie in Gefahr?',
        category: 'danger',
        revealsInfo: {
          priority: 'high',
        },
        response: 'Ich... ich glaube ich höre Geräusche aus dem Schlafzimmer! Oh Gott, die könnten noch da sein!',
        responseEmotion: 'panic',
        followUpOptions: ['advise_leave', 'ask_injuries'],
        completesDialog: false,
      },
      'ask_stolen': {
        id: 'ask_stolen',
        text: 'Können Sie erkennen, was gestohlen wurde?',
        category: 'description',
        revealsInfo: {
          additionalDetails: 'Laptop und Schmuck gestohlen',
        },
        response: 'Mein Laptop ist weg... und die Schmuckschatulle ist leer. Die Schränke sind alle durchwühlt.',
        responseEmotion: 'shocked',
        followUpOptions: ['confirm_dispatch'],
        completesDialog: true,
      },
      'advise_leave': {
        id: 'advise_leave',
        text: 'Verlassen Sie sofort die Wohnung und warten Sie draußen! Wir schicken eine Streife mit Sonderrechten!',
        category: 'general',
        revealsInfo: {
          priority: 'high',
        },
        response: 'Ja, okay! Ich gehe jetzt raus! Bitte beeilen Sie sich!',
        responseEmotion: 'panic',
        followUpOptions: [],
        completesDialog: true,
      },
      'ask_injuries': {
        id: 'ask_injuries',
        text: 'Sind Sie verletzt? Brauchen Sie einen Rettungswagen?',
        category: 'persons',
        response: 'Nein, mir geht es soweit gut. Ich habe nur Angst!',
        responseEmotion: 'scared',
        followUpOptions: ['advise_leave'],
        completesDialog: false,
      },
      'confirm_dispatch': {
        id: 'confirm_dispatch',
        text: 'Verstanden. Ich schicke Ihnen jetzt eine Streife. Bleiben Sie bitte am Telefon.',
        category: 'general',
        response: 'Danke! Bitte kommen Sie schnell!',
        responseEmotion: 'scared',
        followUpOptions: [],
        completesDialog: true,
      },
    },
    initialOptions: ['ask_location', 'ask_what_happened', 'ask_danger'],
    hiddenData: {
      position: [0, 0], // Wird beim Call-Generation gesetzt
      locationName: '', // Wird beim Call-Generation gesetzt
      address: '', // Wird beim Call-Generation gesetzt
      priority: 'medium',
      description: 'Wohnungseinbruch - Täter möglicherweise noch vor Ort',
    },
  },

  'Raubüberfall': {
    incidentType: 'Raubüberfall',
    initialMessage: {
      text: 'Polizei! Schnell! Es gibt einen Überfall! Bitte kommen Sie!',
      emotion: 'panic',
    },
    callerProfile: {
      type: 'witness',
      name: 'Hoffmann, Klaus',
    },
    dialogTree: {
      'ask_location': {
        id: 'ask_location',
        text: 'Wo findet der Überfall statt? Geben Sie mir die genaue Adresse!',
        category: 'location',
        revealsInfo: {
          location: true,
        },
        response: 'Im {LOCATION}! In der {ADDRESS}! Bitte schnell!',
        responseEmotion: 'panic',
        followUpOptions: ['ask_what_type', 'ask_weapons'],
      },
      'ask_what_type': {
        id: 'ask_what_type',
        text: 'Was genau wird überfallen? Ein Geschäft? Eine Person?',
        category: 'incident_type',
        revealsInfo: {
          incidentType: true,
        },
        response: 'Eine Tankstelle! Ein Mann mit Maske bedroht die Kassiererin!',
        responseEmotion: 'shocked',
        followUpOptions: ['ask_weapons', 'ask_persons_count'],
      },
      'ask_weapons': {
        id: 'ask_weapons',
        text: 'Sind die Täter bewaffnet? Sehen Sie Waffen?',
        category: 'danger',
        revealsInfo: {
          priority: 'high',
          additionalDetails: 'Täter bewaffnet',
        },
        response: 'Ja! Er hat eine Pistole! Er zeigt sie der Kassiererin! Sie ist total verängstigt!',
        responseEmotion: 'panic',
        followUpOptions: ['ask_persons_count', 'ask_description'],
      },
      'ask_persons_count': {
        id: 'ask_persons_count',
        text: 'Wie viele Täter sind es? Sind noch andere Personen in Gefahr?',
        category: 'persons',
        revealsInfo: {
          involvedCount: 2,
        },
        response: 'Ich sehe nur einen Täter. Aber es sind noch zwei Kunden drinnen!',
        responseEmotion: 'scared',
        followUpOptions: ['ask_description', 'assure_help'],
      },
      'ask_description': {
        id: 'ask_description',
        text: 'Können Sie den Täter beschreiben? Kleidung? Fluchtrichtung?',
        category: 'description',
        revealsInfo: {
          additionalDetails: 'Schwarze Kleidung, Sturmhaube',
        },
        response: 'Schwarze Jacke, schwarze Hose, Sturmhaube. Ich glaube er hat ein Auto draußen stehen!',
        responseEmotion: 'shocked',
        followUpOptions: ['assure_help'],
        completesDialog: false,
      },
      'assure_help': {
        id: 'assure_help',
        text: 'Verstanden. Mehrere Streifen sind bereits unterwegs mit Sonderrechten. Gehen Sie in Deckung!',
        category: 'general',
        response: 'Okay, ich bin in Sicherheit. Bitte beeilen Sie sich!',
        responseEmotion: 'panic',
        followUpOptions: [],
        completesDialog: true,
      },
    },
    initialOptions: ['ask_location', 'ask_what_type'],
    hiddenData: {
      position: [0, 0],
      locationName: '',
      address: '',
      priority: 'high',
      description: 'Bewaffneter Raubüberfall auf Tankstelle',
    },
  },

  'Verkehrsunfall': {
    incidentType: 'Verkehrsunfall',
    initialMessage: {
      text: 'Hallo? Polizei? Es hat gerade gekracht! Ein Unfall!',
      emotion: 'shocked',
    },
    callerProfile: {
      type: 'witness',
    },
    dialogTree: {
      'ask_location': {
        id: 'ask_location',
        text: 'Wo ist der Unfall? An welcher Kreuzung oder Straße?',
        category: 'location',
        revealsInfo: {
          location: true,
        },
        response: 'An der {ADDRESS}! Zwei Autos sind zusammengestoßen!',
        responseEmotion: 'shocked',
        followUpOptions: ['ask_injuries', 'ask_blocking'],
      },
      'ask_injuries': {
        id: 'ask_injuries',
        text: 'Gibt es Verletzte? Brauchen wir einen Rettungswagen?',
        category: 'persons',
        revealsInfo: {
          priority: 'medium',
          involvedCount: 2,
        },
        response: 'Ich sehe Leute aus den Autos steigen. Sie wirken benommen, aber niemand blutet stark.',
        responseEmotion: 'calm',
        followUpOptions: ['ask_blocking', 'confirm_dispatch_accident'],
      },
      'ask_blocking': {
        id: 'ask_blocking',
        text: 'Wird die Straße blockiert? Gibt es Verkehrsbehinderungen?',
        category: 'description',
        revealsInfo: {
          additionalDetails: 'Straße blockiert',
        },
        response: 'Ja, die ganze Kreuzung ist zu! Es bildet sich schon ein Stau!',
        responseEmotion: 'calm',
        followUpOptions: ['confirm_dispatch_accident'],
        completesDialog: false,
      },
      'confirm_dispatch_accident': {
        id: 'confirm_dispatch_accident',
        text: 'Verstanden. Eine Streife ist unterwegs. Bitte sichern Sie die Unfallstelle ab, falls möglich.',
        category: 'general',
        response: 'Alles klar, ich bleibe hier.',
        responseEmotion: 'calm',
        followUpOptions: [],
        completesDialog: true,
      },
    },
    initialOptions: ['ask_location', 'ask_injuries'],
    hiddenData: {
      position: [0, 0],
      locationName: '',
      address: '',
      priority: 'medium',
      description: 'Verkehrsunfall mit Fahrzeugschaden',
    },
  },
};

// Hilfsfunktion: Dialog-Template für Einsatztyp abrufen
export function getDialogTemplate(incidentType: string): DialogTemplate | null {
  return dialogTemplates[incidentType] || null;
}

// Hilfsfunktion: Gibt es für diesen Einsatztyp ein Dialog-Template?
export function hasDialogTemplate(incidentType: string): boolean {
  return incidentType in dialogTemplates;
}
