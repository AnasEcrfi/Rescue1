// Call Text Templates für realistische Notrufe (LST SIM Style)

export interface CallTemplate {
  incidentType: string;
  callerType: 'witness' | 'victim' | 'resident' | 'business' | 'anonymous';
  texts: string[];
  callerNames?: string[];
}

// Realistische Anrufertexte für verschiedene Einsatztypen
export const callTemplates: CallTemplate[] = [
  // Diebstahl
  {
    incidentType: 'Diebstahl',
    callerType: 'victim',
    texts: [
      'Hallo, ich wurde gerade bestohlen! Jemand hat mir meine Handtasche entrissen und ist weggerannt! Können Sie bitte schnell kommen?',
      'Guten Tag, ich möchte einen Diebstahl melden. Mein Fahrrad wurde vor etwa 10 Minuten vor dem Supermarkt gestohlen. Ich habe den Täter noch gesehen.',
      'Polizei? Mir wurde gerade das Portemonnaie aus der Jackentasche geklaut! Das ist jetzt gerade eben passiert, der Täter müsste noch in der Nähe sein!',
    ],
    callerNames: ['Schmidt, Anna', 'Müller, Thomas', 'Weber, Lisa'],
  },
  // Einbruch
  {
    incidentType: 'Einbruch',
    callerType: 'victim',
    texts: [
      'Bei uns wurde eingebrochen! Die Terrassentür ist aufgebrochen und überall liegt alles durcheinander. Wir sind gerade erst nach Hause gekommen.',
      'Hallo, ich bin gerade in meine Wohnung gekommen und die Tür war aufgebrochen. Es sieht aus als hätte jemand alles durchwühlt. Können Sie bitte kommen?',
      'Polizei? Ich glaube bei uns im Haus wurde eingebrochen! Das Fenster im Erdgeschoss steht offen und ich höre Geräusche von oben!',
    ],
    callerNames: ['Fischer, Michael', 'Becker, Sarah', 'Wagner, Klaus'],
  },
  // Verkehrsunfall
  {
    incidentType: 'Verkehrsunfall',
    callerType: 'witness',
    texts: [
      'Es hat gerade gekracht! Zwei Autos sind zusammengestoßen an der Kreuzung. Einer der Fahrer blutet am Kopf. Bitte schicken Sie schnell jemanden!',
      'Hier ist ein Unfall passiert! Ein Auto ist von der Straße abgekommen und gegen einen Baum gefahren. Der Fahrer bewegt sich nicht mehr!',
      'Guten Tag, ich möchte einen Verkehrsunfall melden. Zwei Fahrzeuge sind seitlich zusammengestoßen. Es gibt Verletzte und die Straße ist blockiert.',
    ],
    callerNames: ['Hoffmann, Peter', 'Koch, Julia', 'Bauer, Martin'],
  },
  // Ruhestörung
  {
    incidentType: 'Ruhestörung',
    callerType: 'resident',
    texts: [
      'Hallo, ich möchte eine Ruhestörung melden. Die Nachbarn über mir feiern schon seit Stunden extrem laut und es ist jetzt schon nach Mitternacht.',
      'Bei uns im Haus ist laute Musik und Geschrei. Das geht schon die ganze Nacht so. Können Sie bitte mal vorbeikommen?',
      'Guten Abend, ich kann nicht schlafen wegen der lauten Party im Nachbarhaus. Die Musik dröhnt durch die ganze Straße.',
    ],
    callerNames: ['Schulz, Petra', 'Schröder, Hans', 'Zimmermann, Helga'],
  },
  // Schlägerei
  {
    incidentType: 'Schlägerei',
    callerType: 'witness',
    texts: [
      'Schnell! Hier prügeln sich gerade mehrere Leute! Das ist richtig brutal, die schlagen mit Flaschen aufeinander ein!',
      'Polizei? Hier ist eine Massenschlägerei! Mindestens 6-7 Personen! Die hauen sich gegenseitig die Köpfe ein!',
      'Es gibt gerade eine heftige Auseinandersetzung hier! Zwei Gruppen gehen aufeinander los, bitte kommen Sie schnell!',
    ],
    callerNames: ['Meyer, Stefan', 'Lange, Nicole', 'Krause, Markus'],
  },
  // Verdächtige Person
  {
    incidentType: 'Verdächtige Person',
    callerType: 'resident',
    texts: [
      'Hallo, hier läuft seit einer Stunde eine verdächtige Person rum. Der guckt in alle Autos rein und probiert an den Türen. Das sieht nicht gut aus.',
      'Ich möchte eine verdächtige Person melden. Jemand steht schon lange vor unserem Haus und beobachtet die Gegend. Der hat auch mehrmals geklingelt.',
      'Polizei? Hier ist eine Person die versucht in mehrere Kellerabteile einzubrechen. Der hat schon an mehreren Schlössern rumhantiert.',
    ],
    callerNames: ['Richter, Monika', 'Neumann, Frank', 'Vogel, Andrea'],
  },
  // Banküberfall
  {
    incidentType: 'Banküberfall',
    callerType: 'witness',
    texts: [
      'HILFE! Hier wird gerade die Bank überfallen! Der Mann hat eine Waffe und bedroht die Angestellten! Bitte kommen Sie sofort!',
      'Schnell! Banküberfall! Maskierte Personen mit Waffen sind in der Bank! Sie zwingen die Kassierer Geld rauszugeben!',
      'Polizei! Alarm! In der Bank läuft ein Überfall! Mehrere bewaffnete Täter! Die Leute liegen alle auf dem Boden!',
    ],
    callerNames: ['Klein, Thomas', 'Wolf, Sandra', 'Schneider, Jürgen'],
  },
  // Demonstration
  {
    incidentType: 'Demonstration',
    callerType: 'business',
    texts: [
      'Guten Tag, hier sammelt sich eine größere Menschenmenge. Das sieht nach einer unangemeldeten Demo aus. Die blockieren mittlerweile die ganze Straße.',
      'Polizei? Hier sind bestimmt 50-60 Leute die demonstrieren und die Straße blockieren. Der Verkehr kommt gar nicht mehr durch.',
      'Ich möchte melden dass hier eine größere Demonstration stattfindet. Die Situation wird langsam unübersichtlich und aggressiv.',
    ],
    callerNames: ['Schmidt & Co.', 'City-Apotheke', 'Restaurant Frankfurter Stubb'],
  },
  // Geiselnahme
  {
    incidentType: 'Geiselnahme',
    callerType: 'witness',
    texts: [
      'POLIZEI! NOTFALL! Jemand hält hier Menschen mit einer Waffe fest! Er schreit rum und lässt niemanden raus! Das ist eine Geiselnahme!',
      'Schnell! Ein Mann hält mehrere Personen fest und droht mit einer Waffe! Er sagt er bringt die Geiseln um wenn die Polizei kommt!',
      'Hilfe! Geiselnahme! Bewaffneter Mann im Gebäude! Er hat mehrere Leute festgehalten! Bitte SEK schicken!',
    ],
    callerNames: ['Schwarz, Daniel', 'Braun, Katharina', 'König, Alexander'],
  },
  // Häusliche Gewalt
  {
    incidentType: 'Häusliche Gewalt',
    callerType: 'resident',
    texts: [
      'Ich höre nebenan schon wieder Schreie und Geschepper. Das klingt nach Gewalt. Eine Frau schreit um Hilfe. Bitte kommen Sie schnell!',
      'Polizei? In der Nachbarwohnung gibt es schon wieder einen heftigen Streit. Ich höre Schläge und jemand weint. Das geht schon die ganze Woche so.',
      'Hilfe! Aus der Wohnung über mir höre ich Gewalt. Eine Person schreit und es gibt laute Schläge. Bitte kommen Sie sofort!',
    ],
    callerNames: ['Lehmann, Ingrid', 'Huber, Walter', 'Schmitt, Christine'],
  },
  // Raub
  {
    incidentType: 'Raub',
    callerType: 'victim',
    texts: [
      'Ich wurde gerade überfallen! Zwei Männer haben mich bedroht und mein Handy und Geld geraubt! Die sind in Richtung Park gerannt!',
      'Hilfe! Raub! Jemand hat mir eine Waffe vorgehalten und alles weggenommen! Das ist gerade eben passiert!',
      'Polizei! Ich wurde gerade beraubt! Der Täter hat mich geschubst und meine Tasche entrissen! Er ist zu Fuß geflohen!',
    ],
    callerNames: ['Werner, Sabine', 'Krüger, Marcus', 'Hoffmann, Jennifer'],
  },
  // Vandalismus
  {
    incidentType: 'Vandalismus',
    callerType: 'business',
    texts: [
      'Guten Tag, unser Schaufenster wurde eingeschlagen. Überall liegt Glas und es wurde auch etwas gesprüht an die Wand.',
      'Polizei? Hier wurden alle Autos in der Straße zerkratzt. Das muss diese Nacht passiert sein. Können Sie mal vorbeikommen?',
      'Ich möchte Vandalismus melden. Am Spielplatz wurde alles beschädigt und beschmiert. Das sieht wirklich schlimm aus.',
    ],
    callerNames: ['Elektro-Markt Frank', 'Autowerkstatt Müller', 'Stadtpark-Verwaltung'],
  },
];

// Hilfsfunktion: Hole zufälligen Call-Text für einen Einsatztyp
export const getRandomCallText = (incidentType: string): {
  text: string;
  callerType: 'witness' | 'victim' | 'resident' | 'business' | 'anonymous';
  callerName?: string;
} => {
  const template = callTemplates.find(t => t.incidentType === incidentType);

  if (!template) {
    // Fallback für unbekannte Einsatztypen
    return {
      text: `Hallo, ich möchte einen Vorfall melden. Es handelt sich um: ${incidentType}. Bitte kommen Sie schnell.`,
      callerType: 'anonymous',
    };
  }

  const randomText = template.texts[Math.floor(Math.random() * template.texts.length)];
  const randomName = template.callerNames
    ? template.callerNames[Math.floor(Math.random() * template.callerNames.length)]
    : undefined;

  return {
    text: randomText,
    callerType: template.callerType,
    callerName: randomName,
  };
};

// Generiere zufällige Telefonnummer (Format: 069-XXXXXXXX)
export const generateCallbackNumber = (): string => {
  const number = Math.floor(Math.random() * 90000000) + 10000000;
  return `069-${number}`;
};
