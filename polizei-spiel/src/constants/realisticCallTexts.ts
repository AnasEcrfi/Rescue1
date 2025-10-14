// Realistische, POI-basierte Anrufertexte für Frankfurt-spezifische Einsätze
import type { POICategory } from './frankfurtPOIs';

export interface RealisticCallTemplate {
  incidentType: string;
  poiCategory: POICategory;
  callerType: 'witness' | 'victim' | 'resident' | 'business' | 'anonymous' | 'employee';
  texts: Array<{
    text: string;
    callerName?: string;
    emotion: 'panic' | 'calm' | 'angry' | 'scared' | 'shocked';
  }>;
}

// POI-spezifische, extrem realistische Anrufertexte
export const realisticCallTemplates: RealisticCallTemplate[] = [
  // BANKÜBERFALL (Bank POIs)
  {
    incidentType: 'Banküberfall',
    poiCategory: 'bank',
    callerType: 'employee',
    texts: [
      {
        text: 'POLIZEI! Hier ist die {POI_NAME}! Wir werden gerade überfallen! Mehrere maskierte Personen mit Waffen! Die Kunden liegen alle auf dem Boden! Bitte kommen Sie SOFORT!',
        callerName: 'Schaltermitarbeiter',
        emotion: 'panic',
      },
      {
        text: 'Hier {POI_NAME}, ich bin Filialleiter. Es läuft gerade ein Überfall! Drei bewaffnete Täter zwingen uns die Tresore zu öffnen. Eine Kundin ist in Panik. Wir brauchen dringend Hilfe!',
        callerName: 'Filialleiter Meyer',
        emotion: 'scared',
      },
      {
        text: 'Hilfe! {POI_NAME}! Ein Mann mit Waffe bedroht uns! Er schreit er will das ganze Bargeld! Die Alarmanlage ist aus! Meine Kollegin ist am Weinen! Schnell!',
        callerName: 'Kassiererin Schmidt',
        emotion: 'panic',
      },
    ],
  },

  // GEISELNAHME (Bank/Office POIs)
  {
    incidentType: 'Geiselnahme',
    poiCategory: 'bank',
    callerType: 'witness',
    texts: [
      {
        text: 'Polizei? Ich stehe vor der {POI_NAME}. Ein bewaffneter Mann hält dort drinnen Menschen fest! Er lässt niemanden raus! Ich sehe mehrere Personen am Boden! Das ist eine Geiselnahme!',
        callerName: 'Passant Hoffmann',
        emotion: 'shocked',
      },
      {
        text: 'NOTFALL! {POI_NAME}! Ich bin im Nachbargebäude. Ich kann durch das Fenster sehen - jemand hat eine Waffe und hält Geiseln! Die Leute schreien! Bitte SEK schicken!',
        callerName: 'Büronachbar Weber',
        emotion: 'panic',
      },
    ],
  },

  // AMOKLAUF/BEDROHUNG (School POIs)
  {
    incidentType: 'Geiselnahme',
    poiCategory: 'school',
    callerType: 'employee',
    texts: [
      {
        text: 'POLIZEI! {POI_NAME} hier! Ich bin Lehrerin! Es gibt eine massive Bedrohungslage! Schüsse im Gebäude! Wir haben Lockdown ausgelöst! Die Kinder sind in Panik! BITTE KOMMEN SIE SOFORT MIT ALLEM WAS SIE HABEN!',
        callerName: 'Lehrerin Schneider',
        emotion: 'panic',
      },
      {
        text: 'Hier ist der Rektor der {POI_NAME}. Wir haben eine ernste Situation. Ein ehemaliger Schüler ist bewaffnet auf dem Schulgelände. Wir haben alle Klassen gesperrt. Ca. 400 Schüler sind im Gebäude. Wir brauchen sofort Unterstützung!',
        callerName: 'Rektor Dr. Müller',
        emotion: 'scared',
      },
      {
        text: 'Hilfe! {POI_NAME}! Ich bin Hausmeister! Ich habe jemanden mit einer Waffe im Treppenhaus gesehen! Die Kinder rennen panisch rum! Ich habe die Türen verriegelt! Bitte kommen Sie schnell!',
        callerName: 'Hausmeister Klein',
        emotion: 'panic',
      },
    ],
  },

  // EINBRUCH (Residential POIs)
  {
    incidentType: 'Einbruch',
    poiCategory: 'residential',
    callerType: 'victim',
    texts: [
      {
        text: 'Polizei? Ich bin gerade nach Hause gekommen, {POI_NAME}. Die Wohnungstür war aufgebrochen. Überall liegt alles durcheinander. Ich glaube die Einbrecher sind noch da - ich höre Geräusche aus dem Schlafzimmer!',
        callerName: 'Fischer, Anna',
        emotion: 'scared',
      },
      {
        text: 'Hilfe! {POI_NAME}, 3. Stock! Bei uns wurde eingebrochen! Das Fenster ist kaputt. Alle Schränke durchwühlt. Mein Laptop und Schmuck sind weg. Können Sie bitte kommen?',
        callerName: 'Wagner, Thomas',
        emotion: 'shocked',
      },
      {
        text: 'Guten Tag, hier {POI_NAME}. Ich war nur kurz einkaufen, jetzt ist die Terrassentür aufgehebelt. Die Täter müssen gerade erst weg sein - der Kaffee im Wohnzimmer ist noch warm!',
        callerName: 'Becker, Monika',
        emotion: 'shocked',
      },
    ],
  },

  // HÄUSLICHE GEWALT (Residential POIs)
  {
    incidentType: 'Häusliche Gewalt',
    poiCategory: 'residential',
    callerType: 'resident',
    texts: [
      {
        text: 'Polizei... ich... ich bin Nachbarin in der {POI_NAME}, 4. Stock. Nebenan ist wieder so ein Streit. Ich höre Schreie und Schläge. Das geht schon Stunden so. Eine Frau schreit um Hilfe. Bitte kommen Sie schnell, ich habe Angst...',
        callerName: 'Nachbarin Lehmann',
        emotion: 'scared',
      },
      {
        text: 'Hallo, {POI_NAME}, Erdgeschoss. Über mir gibt es gerade einen heftigen Gewaltausbruch. Poltern, Schreie, Weinen. Ich kenne die Familie - die Frau hat öfter blaue Flecken. Das ist nicht das erste Mal. Diesmal klingt es richtig schlimm!',
        callerName: 'Huber, Walter',
        emotion: 'angry',
      },
    ],
  },

  // RUHESTÖRUNG (Residential POIs)
  {
    incidentType: 'Ruhestörung',
    poiCategory: 'residential',
    callerType: 'resident',
    texts: [
      {
        text: 'Guten Abend, hier {POI_NAME}, 2. Obergeschoss. Die Party über mir läuft jetzt schon seit 6 Stunden. Ich kann nicht schlafen, meine Kinder weinen. Die Musik dröhnt durch die ganze Wohnung. Ich habe schon dreimal geklingelt, die machen nicht auf.',
        callerName: 'Schulz, Petra',
        emotion: 'angry',
      },
      {
        text: '{POI_NAME} hier. Es ist 2 Uhr nachts! Im Nachbarhaus ist eine Riesen-Party mit mindestens 50 Leuten. Die sind im Hof und schreien rum. Flaschen klirren. Das ganze Viertel ist wach. Können Sie bitte mal vorbeikommen?',
        callerName: 'Zimmermann, Klaus',
        emotion: 'angry',
      },
    ],
  },

  // DIEBSTAHL (Shopping POIs)
  {
    incidentType: 'Diebstahl',
    poiCategory: 'shopping',
    callerType: 'victim',
    texts: [
      {
        text: 'Polizei! Ich wurde gerade bestohlen! Hier bei {POI_NAME}! Ein Mann hat mir die Handtasche aus dem Arm gerissen und ist Richtung U-Bahn gerannt! Darin war mein ganzes Geld und die Kreditkarten!',
        callerName: 'Schmidt, Lisa',
        emotion: 'shocked',
      },
      {
        text: 'Hier {POI_NAME}. Ich bin Ladendetektiv. Ich habe gerade einen Ladendiebstahl beobachtet. Junger Mann, ca. 20, schwarze Jacke. Hat Elektronik im Wert von mehreren Hundert Euro eingesteckt. Er ist noch im Gebäude, 2. Stock!',
        callerName: 'Detektiv Neumann',
        emotion: 'calm',
      },
    ],
  },

  // RAUB (Station POIs)
  {
    incidentType: 'Raub',
    poiCategory: 'station',
    callerType: 'victim',
    texts: [
      {
        text: 'HILFE! {POI_NAME}! Ich wurde gerade überfallen! Zwei Männer! Einer hatte ein Messer! Die haben mein Handy und Portemonnaie weggenommen! Sie sind in die U-Bahn gesprungen, Linie U4 Richtung Bockenheim!',
        callerName: 'Krüger, Marcus',
        emotion: 'panic',
      },
      {
        text: 'Polizei? {POI_NAME}, Ausgang Süd. Ein älterer Herr wurde gerade ausgeraubt! Drei Jugendliche haben ihn zu Boden gestoßen und die Tasche weggerissen! Er blutet am Kopf! Die Täter sind zu Fuß Richtung Kaiserstraße!',
        callerName: 'Zeugin Werner',
        emotion: 'shocked',
      },
    ],
  },

  // SCHLÄGEREI (Nightlife POIs)
  {
    incidentType: 'Schlägerei',
    poiCategory: 'nightlife',
    callerType: 'employee',
    texts: [
      {
        text: 'Polizei! {POI_NAME} hier, ich bin Türsteher! Vor dem Club ist gerade eine Massenschlägerei ausgebrochen! Mindestens 15 Personen! Die schlagen mit Flaschen aufeinander ein! Einer liegt am Boden! Schnell!',
        callerName: 'Türsteher Schwarz',
        emotion: 'shocked',
      },
      {
        text: 'Hier {POI_NAME}! Ich bin die Barmanagerin! Drinnen ist eine heftige Schlägerei! Stühle fliegen! Gläser zerbrechen! Mehrere Verletzte! Die Security kriegt das nicht unter Kontrolle! Bitte kommen Sie sofort!',
        callerName: 'Managerin Braun',
        emotion: 'panic',
      },
    ],
  },

  // VERDÄCHTIGE PERSON (School/University POIs)
  {
    incidentType: 'Verdächtige Person',
    poiCategory: 'school',
    callerType: 'employee',
    texts: [
      {
        text: 'Guten Tag, {POI_NAME} hier. Ich bin Sicherheitsdienst. Auf dem Schulhof läuft seit 20 Minuten eine Person rum die hier nicht hingehört. Dunkel gekleidet, großer Rucksack. Die Person fotografiert das Gebäude und probiert an Türen. Sehr verdächtig.',
        callerName: 'Sicherheitsdienst Richter',
        emotion: 'calm',
      },
      {
        text: '{POI_NAME}, Sekretariat. Ein Mann steht schon seit einer Stunde vor dem Schuleingang und beobachtet die Kinder. Er hat versucht mit mehreren zu sprechen. Die Eltern sind besorgt. Er geht nicht weg wenn man ihn anspricht.',
        callerName: 'Sekretärin Vogel',
        emotion: 'scared',
      },
    ],
  },

  // VERKEHRSUNFALL (Station POIs)
  {
    incidentType: 'Verkehrsunfall',
    poiCategory: 'station',
    callerType: 'witness',
    texts: [
      {
        text: 'Schnell! {POI_NAME}! Schwerer Unfall! Ein Auto ist frontal in einen Bus gekracht! Der Fahrer ist bewusstlos! Mehrere Fahrgäste sind verletzt! Es stinkt nach Benzin! Die Straße ist komplett blockiert!',
        callerName: 'Zeuge Hoffmann',
        emotion: 'panic',
      },
      {
        text: 'Polizei? Hier {POI_NAME}, Kreuzung Haupteingang. Zwei Autos sind zusammengestoßen. Einer der Fahrer blutet stark am Kopf. Der andere schreit und will abhauen! Ich habe den Schlüssel genommen. Bitte kommen Sie schnell!',
        callerName: 'Koch, Peter',
        emotion: 'shocked',
      },
    ],
  },

  // VANDALISMUS (Park POIs)
  {
    incidentType: 'Vandalismus',
    poiCategory: 'park',
    callerType: 'witness',
    texts: [
      {
        text: 'Guten Morgen, {POI_NAME}. Ich bin gerade joggen und der komplette Spielplatz hier ist zerstört! Graffiti überall, Bänke umgeworfen, Mülleimer angezündet. Das muss heute Nacht passiert sein.',
        callerName: 'Läufer Bauer',
        emotion: 'shocked',
      },
      {
        text: 'Hier Park-Verwaltung, {POI_NAME}. Wir haben massive Sachbeschädigung! Alle Hinweisschilder sind abgerissen. Jemand hat die Springbrunnen-Pumpe zerstört. Überall Glasscherben. Das muss eine größere Gruppe gewesen sein.',
        callerName: 'Parkwärter Lange',
        emotion: 'angry',
      },
    ],
  },

  // DEMONSTRATION (Office POIs)
  {
    incidentType: 'Demonstration',
    poiCategory: 'office',
    callerType: 'business',
    texts: [
      {
        text: 'Polizei? Hier {POI_NAME}, Empfang. Vor unserem Gebäude hat sich eine Demonstration gebildet. Bestimmt 100 Leute. Die blockieren alle Eingänge. Unsere Mitarbeiter kommen nicht rein. Die Stimmung wird aggressiver!',
        callerName: 'Empfangschef Klein',
        emotion: 'scared',
      },
      {
        text: '{POI_NAME} hier, Sicherheitsdienst. Auf dem Platz vor unserem Tower ist eine unangemeldete Demo. Laut, chaotisch. Die haben Banner und Megaphone. Der Verkehr ist komplett zum Erliegen gekommen. Das eskaliert gleich!',
        callerName: 'Security-Chef Wolf',
        emotion: 'calm',
      },
    ],
  },

  // NEU: VERFOLGUNGSJAGD (Station/Street POIs)
  {
    incidentType: 'Verfolgungsjagd',
    poiCategory: 'station',
    callerType: 'witness',
    texts: [
      {
        text: 'POLIZEI! {POI_NAME}! Hier rast ein schwarzer BMW mit mindestens 100 durch! Rote Ampeln werden ignoriert! Der fährt wie ein Wahnsinniger! Menschen springen zur Seite! Das ist eine Verfolgungsjagd!',
        callerName: 'Taxifahrer Keller',
        emotion: 'panic',
      },
      {
        text: 'Hier {POI_NAME}! Ein Fahrzeug wird verfolgt! Hohe Geschwindigkeit! Der Fahrer nimmt Gehwege! Ich habe schon zwei Beinahe-Unfälle gesehen! Die rasen Richtung Innenstadt!',
        callerName: 'Zeuge Berger',
        emotion: 'shocked',
      },
      {
        text: 'Polizei, {POI_NAME}. Ein Auto ist gerade über die rote Ampel gerast. Hinter ihm drei Streifenwagen mit Blaulicht. Der flüchtet über die Kreuzung Richtung Hauptbahnhof. Wahnsinnsgeschwindigkeit!',
        callerName: 'Busfahrer Thomas',
        emotion: 'shocked',
      },
    ],
  },

  // NEU: BOMBENDROHUNG (Bank/Office/Station POIs)
  {
    incidentType: 'Bombendrohung',
    poiCategory: 'bank',
    callerType: 'employee',
    texts: [
      {
        text: 'NOTFALL! {POI_NAME}! Wir haben gerade einen anonymen Anruf bekommen! Bombendrohung! Der Anrufer hat gesagt die Bombe explodiert in 30 Minuten! Wir evakuieren gerade! 200 Leute im Gebäude! HILFE!',
        callerName: 'Sicherheitschef Hartmann',
        emotion: 'panic',
      },
      {
        text: 'Polizei, hier {POI_NAME}, Geschäftsführung. Wir haben eine Bombendrohung erhalten. Per E-Mail. Sehr detailliert. Der Absender kennt unsere Sicherheitssysteme. Wir nehmen das ernst. Bitte Entschärfer schicken!',
        callerName: 'Geschäftsführer Dr. Stein',
        emotion: 'scared',
      },
    ],
  },
  {
    incidentType: 'Bombendrohung',
    poiCategory: 'station',
    callerType: 'employee',
    texts: [
      {
        text: 'POLIZEI! {POI_NAME} hier, Bahnhofssicherheit! Verdächtiges Gepäckstück auf Gleis 7! Großer schwarzer Koffer, steht seit 45 Minuten! Niemand will ihn abholen! Die Durchsage läuft aber keiner reagiert! Könnte eine Bombe sein!',
        callerName: 'Bahnhofssicherheit Meier',
        emotion: 'scared',
      },
    ],
  },

  // NEU: VERMISSTE PERSON (Park/Shopping/Residential POIs)
  {
    incidentType: 'Vermisste Person',
    poiCategory: 'park',
    callerType: 'resident',
    texts: [
      {
        text: 'Polizei! {POI_NAME}! Meine Tochter ist weg! Sie ist erst 6 Jahre alt! Wir waren auf dem Spielplatz, ich habe kurz telefoniert, und jetzt ist sie verschwunden! Ich suche schon 20 Minuten! BITTE HELFEN SIE!',
        callerName: 'Mutter Schneider',
        emotion: 'panic',
      },
      {
        text: '{POI_NAME}, bitte helfen Sie. Mein Vater ist dement. Er ist heute Morgen aus dem Haus und nicht wiedergekommen. Er könnte überall sein. Er kennt sich nicht mehr aus. Ich habe solche Angst um ihn...',
        callerName: 'Tochter Weber',
        emotion: 'scared',
      },
    ],
  },
  {
    incidentType: 'Vermisste Person',
    poiCategory: 'shopping',
    callerType: 'resident',
    texts: [
      {
        text: 'Hilfe! {POI_NAME}! Mein Sohn ist weg! 4 Jahre alt! Ich hab ihn nur kurz aus den Augen gelassen! Das war vor 15 Minuten! Blaue Jacke, blonde Haare! Ich finde ihn nicht!',
        callerName: 'Vater Klein',
        emotion: 'panic',
      },
    ],
  },

  // NEU: HÄUSLICHER STREIT (Residential POIs)
  {
    incidentType: 'Häuslicher Streit',
    poiCategory: 'residential',
    callerType: 'resident',
    texts: [
      {
        text: 'Guten Abend, {POI_NAME}, 3. Stock. Nebenan streiten sich zwei Leute. Sehr laut. Geschrei. Beleidigungen. Das geht jetzt schon zwei Stunden. Meine Kinder kriegen Angst. Können Sie mal vorbeikommen?',
        callerName: 'Nachbar Braun',
        emotion: 'angry',
      },
      {
        text: '{POI_NAME}. Ich wohne eine Etage höher. Unter mir ist gerade ein heftiger Ehestreit. Schreien, Türen knallen, Geschirr klirrt. Ich will nicht übertreiben, aber es klingt als würde es gleich eskalieren.',
        callerName: 'Nachbarin Jung',
        emotion: 'scared',
      },
    ],
  },

  // NEU: ILLEGALES STRASSENRENNEN (Station/Office POIs)
  {
    incidentType: 'Illegales Straßenrennen',
    poiCategory: 'station',
    callerType: 'witness',
    texts: [
      {
        text: 'Polizei! {POI_NAME}! Hier findet gerade ein illegales Straßenrennen statt! Mindestens 10 aufgemotzte Autos! Die rasen hier mit 150 durch! Burnouts! Quietschende Reifen! Die ganze Straße ist voller Zuschauer! Total gefährlich!',
        callerName: 'Anwohner Krause',
        emotion: 'angry',
      },
      {
        text: '{POI_NAME}, hier ist ein Straßenrennen im Gang! Sportwagen, tiefergelegte BMWs, Audis! Die machen Beschleunigungsrennen! Bestimmt 50 Leute stehen rum und feuern die an! Das ist komplett illegal!',
        callerName: 'Zeuge Becker',
        emotion: 'shocked',
      },
    ],
  },

  // NEU: BETRUNKENER FAHRER (Station POIs)
  {
    incidentType: 'Betrunkener Fahrer',
    poiCategory: 'station',
    callerType: 'witness',
    texts: [
      {
        text: 'Polizei? {POI_NAME}! Vor mir fährt ein total betrunkener Fahrer! Der schlingert über beide Spuren! Fast in den Gegenverkehr! Silberner VW Golf! Kennzeichen F-AB 1234! Der ist eine Gefahr!',
        callerName: 'Autofahrer Schmidt',
        emotion: 'shocked',
      },
      {
        text: '{POI_NAME}, Tankstelle. Hier wollte gerade jemand wegfahren der eindeutig betrunken ist! Lallt beim Sprechen! Kann kaum stehen! Ich hab ihm die Schlüssel nicht gegeben aber er wird aggressiv!',
        callerName: 'Tankwart Müller',
        emotion: 'scared',
      },
    ],
  },

  // NEU: LADENDIEBSTAHL (Shopping POIs)
  {
    incidentType: 'Ladendiebstahl',
    poiCategory: 'shopping',
    callerType: 'employee',
    texts: [
      {
        text: '{POI_NAME}, Ladendetektiv hier. Ich habe gerade eine Diebin auf frischer Tat erwischt. Parfüm im Wert von 300 Euro in der Tasche. Sie ist jetzt im Büro, kooperiert aber nicht. Brauche Unterstützung.',
        callerName: 'Detektiv Hoffmann',
        emotion: 'calm',
      },
      {
        text: 'Polizei! {POI_NAME}! Ich hab gerade gesehen wie zwei Jugendliche Sachen geklaut haben! Die sind jetzt weggerannt! Richtung Hauptwache! Schwarze Kapuzenjacken! Die haben mindestens 5 Handys eingesteckt!',
        callerName: 'Verkäuferin Fischer',
        emotion: 'shocked',
      },
    ],
  },

  // NEU: BRANDSTIFTUNG (Park/Residential POIs)
  {
    incidentType: 'Brandstiftung',
    poiCategory: 'park',
    callerType: 'witness',
    texts: [
      {
        text: 'FEUER! {POI_NAME}! Die Mülleimer brennen! Flammen schon 2 Meter hoch! Das greift auf die Büsche über! Ich hab drei Jugendliche wegrennen sehen! Die haben das angezündet!',
        callerName: 'Jogger Weber',
        emotion: 'shocked',
      },
    ],
  },
  {
    incidentType: 'Brandstiftung',
    poiCategory: 'residential',
    callerType: 'resident',
    texts: [
      {
        text: 'HILFE! {POI_NAME}! Der Keller brennt! Ich habe Rauch gerochen und Flammen gesehen! Das wurde gelegt! Niemand ist im Keller! Aber das Feuer breitet sich aus! Feuerwehr und Polizei schnell!',
        callerName: 'Mieter Lang',
        emotion: 'panic',
      },
    ],
  },

  // NEU: DROGENHANDEL (Park/Station/Nightlife POIs)
  {
    incidentType: 'Drogenhandel',
    poiCategory: 'park',
    callerType: 'witness',
    texts: [
      {
        text: '{POI_NAME}. Ich bin hier öfters joggen. An der Parkbank gegenüber vom Spielplatz wird seit Wochen gedealt. Immer die gleichen Typen. Kurze Übergaben. Geld gegen kleine Tütchen. Das läuft hier systematisch!',
        callerName: 'Läufer Berger',
        emotion: 'angry',
      },
      {
        text: 'Polizei, {POI_NAME}, Eingang Süd. Hier treffen sich jeden Abend Dealer. Heute sind es bestimmt 8 Leute. Die machen nicht mal einen Hehl draus. Offener Drogenhandel vor allen Leuten!',
        callerName: 'Anwohnerin Klein',
        emotion: 'angry',
      },
    ],
  },

  // NEU: BELÄSTIGUNG (Shopping/Station POIs)
  {
    incidentType: 'Belästigung',
    poiCategory: 'shopping',
    callerType: 'victim',
    texts: [
      {
        text: 'Polizei? {POI_NAME}. Ein Mann verfolgt mich schon seit 20 Minuten. Er hat mich mehrfach angesprochen. Ich hab nein gesagt aber er lässt nicht locker. Jetzt steht er vor dem Geschäft und starrt rein. Ich hab Angst rauszugehen...',
        callerName: 'Fischer, Julia',
        emotion: 'scared',
      },
      {
        text: '{POI_NAME}, hier wird gerade eine junge Frau belästigt! Drei Männer stehen um sie rum. Sie will gehen aber die lassen sie nicht. Sie weint. Ich greife jetzt ein aber brauche Backup!',
        callerName: 'Zeuge Stark',
        emotion: 'angry',
      },
    ],
  },

  // NEU: FALSCHPARKER (Station/Shopping POIs)
  {
    incidentType: 'Falschparker',
    poiCategory: 'station',
    callerType: 'business',
    texts: [
      {
        text: '{POI_NAME}, Taxistand. Hier blockiert ein Mercedes die komplette Taxispur. Steht mitten auf der Haltezone. Fahrer ist weg. Wir können nicht arbeiten. Schon 20 Minuten. Bitte abschleppen lassen!',
        callerName: 'Taxifahrer Müller',
        emotion: 'angry',
      },
      {
        text: 'Guten Tag, {POI_NAME}. Ein Fahrzeug blockiert die Feuerwehrzufahrt. Großer Transporter, steht quer. Wenn jetzt was passiert kommt niemand durch. Bitte Abschleppwagen schicken.',
        callerName: 'Hausmeister Wagner',
        emotion: 'calm',
      },
    ],
  },

  // NEU: LÄRMBELÄSTIGUNG (Residential/Park POIs)
  {
    incidentType: 'Lärmbelästigung',
    poiCategory: 'residential',
    callerType: 'resident',
    texts: [
      {
        text: '{POI_NAME}, 2. Stock. Der Nachbar bohrt seit 3 Stunden! Es ist Sonntag! Ich hab geklingelt, er macht nicht auf. Das ist pure Absicht! Meine Wohnung vibriert! Ich will nur meine Ruhe!',
        callerName: 'Müller, Stefan',
        emotion: 'angry',
      },
      {
        text: 'Polizei? {POI_NAME}. Über mir findet schon wieder eine laute Party statt. Es ist 1 Uhr nachts, Werktag! Musik auf Maximum! Ich muss morgen arbeiten! Die machen das jede Woche!',
        callerName: 'Schmidt, Anna',
        emotion: 'angry',
      },
    ],
  },

  // NEU: LANDMARK-SPEZIFISCHE EINSÄTZE (Frankfurt-Wahrzeichen)
  // Vandalismus an Wahrzeichen
  {
    incidentType: 'Vandalismus',
    poiCategory: 'landmark',
    callerType: 'witness',
    texts: [
      {
        text: 'Polizei! {POI_NAME}! Hier wird gerade unser Wahrzeichen beschädigt! Graffiti-Sprüher! Die besprühen die historische Fassade! Mindestens 5 Leute mit Spraydosen! Das ist Kulturvandalismus!',
        callerName: 'Tourist Becker',
        emotion: 'shocked',
      },
      {
        text: '{POI_NAME}, Sicherheitsdienst. Wir haben Vandalismus am Denkmal. Jemand hat versucht die Statue zu beschädigen. Werkzeugspuren sichtbar. Die Täter sind noch in der Nähe!',
        callerName: 'Security Hoffmann',
        emotion: 'angry',
      },
    ],
  },

  // Diebstahl an Landmarks
  {
    incidentType: 'Diebstahl',
    poiCategory: 'landmark',
    callerType: 'victim',
    texts: [
      {
        text: 'HILFE! {POI_NAME}! Taschendiebe! Die haben mir die Kamera geklaut während ich Fotos gemacht hab! Drei Männer! Die sind jetzt in der Menschenmenge untergetaucht! Touristen werden hier systematisch beklaut!',
        callerName: 'Touristin Chen',
        emotion: 'panic',
      },
      {
        text: 'Polizei? {POI_NAME}. Ich wurde gerade bestohlen! Geldbörse aus der Tasche! Ich hab es erst jetzt gemerkt! Das war vor 5 Minuten! Hier sind so viele Touristen, die nutzen das aus!',
        callerName: 'Wagner, Markus',
        emotion: 'shocked',
      },
    ],
  },

  // Demonstration an Landmarks
  {
    incidentType: 'Demonstration',
    poiCategory: 'landmark',
    callerType: 'witness',
    texts: [
      {
        text: 'Polizei! {POI_NAME}! Hier versammeln sich hunderte Demonstranten! Spontan! Keine Absperrungen! Die blockieren den ganzen Platz! Touristen kommen nicht durch! Es werden Transparente aufgehängt!',
        callerName: 'Ladenbesitzer Jung',
        emotion: 'scared',
      },
      {
        text: '{POI_NAME}, Stadtführer hier. Eine große Menschenmenge hat sich gebildet. Sieht nach politischer Demo aus. Mindestens 200 Leute. Die Stimmung ist aufgeheizt. Meine Touristengruppe sitzt fest!',
        callerName: 'Stadtführer Berger',
        emotion: 'calm',
      },
    ],
  },

  // Vermisste Person an Landmarks
  {
    incidentType: 'Vermisste Person',
    poiCategory: 'landmark',
    callerType: 'resident',
    texts: [
      {
        text: 'Polizei! {POI_NAME}! Mein Sohn ist verschwunden! 5 Jahre alt! Hier sind so viele Menschen! Ich hab ihn nur kurz aus den Augen gelassen! Rote Jacke! BITTE HELFEN SIE!',
        callerName: 'Mutter Schulz',
        emotion: 'panic',
      },
      {
        text: '{POI_NAME}. Meine Oma ist weg! Sie hat Demenz! Wir waren hier Kaffee trinken und jetzt ist sie verschwunden! Sie könnte überall sein! 78 Jahre, graue Jacke! Bitte suchen Sie sie!',
        callerName: 'Enkelin Fischer',
        emotion: 'scared',
      },
    ],
  },

  // Schlägerei an Landmarks (Touristen-Hotspots)
  {
    incidentType: 'Schlägerei',
    poiCategory: 'landmark',
    callerType: 'witness',
    texts: [
      {
        text: 'POLIZEI! {POI_NAME}! Hier prügeln sich zwei Gruppen! Mindestens 10 Leute! Mitten zwischen den Touristen! Flaschen fliegen! Ein Kind wurde fast getroffen! Das ist ein Chaos!',
        callerName: 'Kellner Schmidt',
        emotion: 'shocked',
      },
      {
        text: '{POI_NAME}, Straßenmusikant hier. Vor mir ist gerade eine heftige Prügelei ausgebrochen! Rivalen-Gangs oder so! Die schlagen mit Gürteln aufeinander ein! Blut auf dem Boden! Schnell!',
        callerName: 'Musiker Weber',
        emotion: 'panic',
      },
    ],
  },

  // Bombendrohung an Landmarks
  {
    incidentType: 'Bombendrohung',
    poiCategory: 'landmark',
    callerType: 'employee',
    texts: [
      {
        text: 'NOTFALL! {POI_NAME}! Verdächtiger Rucksack! Steht seit 30 Minuten unbeaufsichtigt! Direkt am Eingang! Niemand holt ihn ab! Bei so einem Wahrzeichen nehmen wir keine Risiken! Entschärfer bitte!',
        callerName: 'Sicherheitsdienst Krause',
        emotion: 'scared',
      },
    ],
  },

  // Belästigung an Landmarks
  {
    incidentType: 'Belästigung',
    poiCategory: 'landmark',
    callerType: 'victim',
    texts: [
      {
        text: 'Polizei? {POI_NAME}. Ein Mann belästigt hier aggressive Touristinnen! Ich habe gesehen wie er mehrere Frauen angegangen ist! Jetzt verfolgt er eine junge Frau! Ich bleibe dran aber brauche Unterstützung!',
        callerName: 'Zeuge Hoffmann',
        emotion: 'angry',
      },
    ],
  },
];

// Helper: Hole passende Templates für Einsatztyp und POI-Kategorie
export const getRealisticCallText = (
  incidentType: string,
  poiCategory: POICategory,
  poiName: string
): {
  text: string;
  callerType: 'witness' | 'victim' | 'resident' | 'business' | 'anonymous' | 'employee';
  callerName?: string;
  emotion: 'panic' | 'calm' | 'angry' | 'scared' | 'shocked';
} | null => {
  const templates = realisticCallTemplates.filter(
    t => t.incidentType === incidentType && t.poiCategory === poiCategory
  );

  if (templates.length === 0) return null;

  const template = templates[Math.floor(Math.random() * templates.length)];
  const textData = template.texts[Math.floor(Math.random() * template.texts.length)];

  // Ersetze {POI_NAME} mit echtem POI-Namen
  const finalText = textData.text.replace(/{POI_NAME}/g, poiName);

  return {
    text: finalText,
    callerType: template.callerType,
    callerName: textData.callerName,
    emotion: textData.emotion,
  };
};
