// Realistische Einsatzmeldungen wie bei LST-SIM
// Erstmeldung = Sofort nach Ankunft (S4)
// Folgemeldungen = Während der Bearbeitung

export interface IncidentReport {
  // Erstmeldung - kommt SOFORT nach Ankunft (S4)
  initialReport: string[];

  // Folgemeldungen - kommen während Bearbeitung
  progressReports?: string[];

  // Verstärkungsanforderung - wenn mehr Kräfte benötigt werden
  backupRequest?: {
    message: string;
    additionalVehicles: number;
    urgent: boolean; // Dringend = Sofort, Normal = Status 5
  };

  // Erfolgsmeldung - am Ende
  completionReport: string[];
}

export const incidentReports: { [key: string]: IncidentReport } = {
  'Diebstahl': {
    initialReport: [
      'Einsatzort erreicht. Geschädigter gibt Angaben zum Tathergang. Täter bereits flüchtig.',
      'Vor Ort. Diebstahl wie gemeldet. Nehmen Anzeige auf. Täter unbekannt verzogen.',
      'Am Einsatzort. Spreche mit Zeugen. Tatzeit vermutlich vor 2 Stunden. Täter entkommen.',
    ],
    progressReports: [
      'Spurensicherung angelaufen. Benötige noch ca. 5 Minuten.',
      'Befragung läuft. Personaliendaten werden aufgenommen.',
    ],
    completionReport: [
      'Anzeige aufgenommen. Geschädigter wurde belehrt. Einsatz abgeschlossen.',
      'Vor Ort abgeschlossen. Anzeige erstattet. Rückkehr zur Wache.',
    ],
  },

  'Einbruch': {
    initialReport: [
      'Einbruch bestätigt. Wohnung komplett durchwühlt. Täter nicht mehr vor Ort.',
      'Einsatzort erreicht. Einbruchspuren an der Wohnungstür. Täter flüchtig.',
      'Vor Ort. Fenster aufgehebelt. Wohnung stark verwüstet. Keine Täter mehr anwesend.',
    ],
    backupRequest: {
      message: 'Einsatzort ist großflächig. Benötige zusätzliche Streife zur Spurensicherung und Zeugenbefragung.',
      additionalVehicles: 1,
      urgent: false,
    },
    progressReports: [
      'Spurensicherung läuft. Fingerabdrücke werden gesichert.',
      'Nachbarn werden befragt. Niemand hat etwas gesehen.',
    ],
    completionReport: [
      'Spurensicherung abgeschlossen. Anzeige aufgenommen. Objekt wurde gesichert.',
      'Einsatz beendet. Wohnung verschlossen. Geschädigter informiert.',
    ],
  },

  'Verkehrsunfall': {
    initialReport: [
      'Vor Ort. Verkehrsunfall mit 2 beteiligten Fahrzeugen. Keine schweren Verletzungen. Fahrbahn teilweise blockiert.',
      'Einsatzort erreicht. PKW-Unfall. 1 Person leicht verletzt. Rettungsdienst informiert. Verkehr wird umgeleitet.',
      'Am Unfallort. Auffahrunfall. Beide Fahrer ansprechbar. Fahrbahn muss gesperrt werden.',
    ],
    backupRequest: {
      message: 'Unfallaufnahme komplex. Benötige Verkehrsunfalldienst zur Unterstützung.',
      additionalVehicles: 1,
      urgent: false,
    },
    progressReports: [
      'Verkehr wird umgeleitet. Unfallaufnahme läuft.',
      'Zeugen werden befragt. Fahrzeuge werden abgeschleppt.',
    ],
    completionReport: [
      'Unfallaufnahme beendet. Fahrbahn wieder frei. Beide Fahrer verwarnt.',
      'Einsatz abgeschlossen. Abschleppunternehmen vor Ort. Fahrbahn geräumt.',
    ],
  },

  'Ruhestörung': {
    initialReport: [
      'Vor Ort. Lautstärke ist deutlich zu hoch. Spreche mit Verursacher.',
      'Einsatzort erreicht. Laute Musik bestätigt. Nehme Kontakt zu Wohnungsinhaber auf.',
      'Am Einsatzort. Ruhestörung wie gemeldet. Party im Gange. Klingel an Wohnungstür.',
    ],
    completionReport: [
      'Verursacher belehrt. Lautstärke reduziert. Einsatz beendet.',
      'Platzverweis ausgesprochen. Ruhe ist wieder hergestellt.',
    ],
  },

  'Schlägerei': {
    initialReport: [
      'Vor Ort. Schlägerei mit 4-5 Beteiligten. Situation noch unübersichtlich. Personen werden getrennt.',
      'Einsatzort erreicht. Körperliche Auseinandersetzung. 3 Personen beteiligt. Lage noch angespannt.',
      'Am Einsatzort. Mehrere Personen im Handgemenge. Situation eskaliert. Beginne mit Personentrennung.',
    ],
    backupRequest: {
      message: 'Lage eskaliert. Mehr als 6 Personen beteiligt. Benötige dringend Verstärkung!',
      additionalVehicles: 2,
      urgent: true,
    },
    progressReports: [
      'Personen getrennt. Verletzungen werden versorgt.',
      'Personalien werden aufgenommen. Alkoholtest läuft.',
    ],
    completionReport: [
      '2 Personen in Gewahrsam genommen. Platzverweise erteilt. Lage beruhigt.',
      'Einsatz beendet. Anzeigen aufgenommen. Alle Beteiligten belehrt.',
    ],
  },

  'Verdächtige Person': {
    initialReport: [
      'Vor Ort. Person angetroffen und kontrolliert. Personalienfeststellung läuft.',
      'Einsatzort erreicht. Verdächtige Person gesichtet. Nehme Kontakt auf.',
      'Am Einsatzort. Person passt auf Beschreibung. Führe Kontrolle durch.',
    ],
    completionReport: [
      'Person kontrolliert. Keine Fahndungstreffer. Person belehrt und entlassen.',
      'Personalien aufgenommen. Person unauffällig. Einsatz beendet.',
    ],
  },

  'Banküberfall': {
    initialReport: [
      'Vor Ort. Banküberfall bestätigt. Täter noch im Gebäude. Gebäude wird umstellt.',
      'Einsatzort erreicht. Geiselnahme im Bankgebäude. SEK wurde angefordert. Sichern Umgebung ab.',
      'Am Einsatzort. Bewaffneter Überfall. Täter bewaffnet. Evakuierung läuft.',
    ],
    backupRequest: {
      message: 'Großlage! Täter bewaffnet und gefährlich. Benötige SEK und weitere Streifen zur Absperrung!',
      additionalVehicles: 3,
      urgent: true,
    },
    progressReports: [
      'Absperrung steht. Evakuierung im Gang. SEK bereitet Zugriff vor.',
      'Verhandlungen laufen. Täter noch immer im Gebäude.',
    ],
    completionReport: [
      'Täter festgenommen. Keine Verletzten. Bank wird freigegeben.',
      'Zugriff erfolgreich. 2 Täter in Gewahrsam. Zeugen werden vernommen.',
    ],
  },

  'Demonstration': {
    initialReport: [
      'Vor Ort. Unangemeldete Demonstration mit ca. 50 Personen. Situation friedlich aber unübersichtlich.',
      'Einsatzort erreicht. Demonstrationszug blockiert Verkehr. Versammlungsleiter wird gesucht.',
      'Am Einsatzort. Größere Menschenmenge. Spreche mit Organisatoren.',
    ],
    backupRequest: {
      message: 'Demonstrationszug wächst. Über 100 Personen. Benötige Verstärkung zur Verkehrslenkung.',
      additionalVehicles: 2,
      urgent: false,
    },
    progressReports: [
      'Verkehr wird umgeleitet. Demonstration verläuft friedlich.',
      'Auflagen werden erteilt. Menge bewegt sich langsam vorwärts.',
    ],
    completionReport: [
      'Demonstration aufgelöst. Verkehr läuft wieder normal. Einsatz beendet.',
      'Veranstaltung beendet. Ordnungswidrigkeitenanzeige erstattet. Lage ruhig.',
    ],
  },

  'Geiselnahme': {
    initialReport: [
      'Vor Ort. Geiselnahme bestätigt. 1 Täter, 2 Geiseln. Täter fordert Fluchtfahrzeug. SEK benötigt!',
      'Einsatzort erreicht. Bedrohungslage. Person verschanzt mit Geisel. Verhandlungsgruppe angefordert.',
      'Am Einsatzort. Hochgefährliche Lage. Täter bewaffnet. Beginne mit Absperrung.',
    ],
    backupRequest: {
      message: 'Großlage Geiselnahme! Benötige umgehend SEK, Verhandlungsgruppe und weitere Streifen!',
      additionalVehicles: 4,
      urgent: true,
    },
    progressReports: [
      'Absperrung komplett. Verhandlungen angelaufen. Täter stellt Forderungen.',
      'SEK in Position. Verhandlungsgruppe arbeitet. Situation angespannt.',
    ],
    completionReport: [
      'Zugriff erfolgreich. Geiseln befreit. Täter überwältigt. Keine Verletzten.',
      'Einsatz beendet. Täter festgenommen. Geiseln unverletzt. Psychologische Betreuung läuft.',
    ],
  },

  'Häusliche Gewalt': {
    initialReport: [
      'Vor Ort. Häuslicher Streit eskaliert. Frau zeigt Verletzungen. Beschuldigter aggressiv.',
      'Einsatzort erreicht. Häusliche Gewalt bestätigt. Opfer verängstigt. Täter in Wohnung.',
      'Am Einsatzort. Körperverletzung. Opfer weist Blutergüsse auf. Täter stark alkoholisiert.',
    ],
    progressReports: [
      'Opfer wird medizinisch versorgt. Täter wird festgenommen.',
      'Gewaltschutzanordnung wird eingeleitet. Opfer wird über Rechte aufgeklärt.',
    ],
    completionReport: [
      'Täter in Gewahrsam genommen. Kontaktverbot ausgesprochen. Opfer in Sicherheit.',
      'Einsatz beendet. Anzeige wegen Körperverletzung aufgenommen. Opfer wird betreut.',
    ],
  },

  'Raub': {
    initialReport: [
      'Vor Ort. Raub bestätigt. Opfer gibt Täterbeschreibung. Täter flüchtig mit Beute.',
      'Einsatzort erreicht. Straßenraub. Opfer leicht verletzt. Fahndung nach Täter eingeleitet.',
      'Am Einsatzort. Handtaschenraub. Opfer geschockt. Täter zu Fuß geflüchtet.',
    ],
    backupRequest: {
      message: 'Täter noch in Nähe gesichtet. Benötige Unterstützung zur Fahndung im Umkreis.',
      additionalVehicles: 2,
      urgent: true,
    },
    completionReport: [
      'Anzeige aufgenommen. Fahndung läuft. Opfer wurde erstversorgt.',
      'Einsatz vor Ort abgeschlossen. Täterfahndung läuft weiter. Rückkehr zur Wache.',
    ],
  },

  'Vandalismus': {
    initialReport: [
      'Vor Ort. Sachbeschädigung bestätigt. Graffiti an Hauswand. Täter nicht mehr anwesend.',
      'Einsatzort erreicht. Vandalismus. Mehrere Scheiben eingeschlagen. Zeugen werden befragt.',
      'Am Einsatzort. Sachbeschädigung an PKW. Lack zerkratzt. Anzeige wird aufgenommen.',
    ],
    completionReport: [
      'Anzeige wegen Sachbeschädigung aufgenommen. Spurensicherung abgeschlossen.',
      'Einsatz beendet. Geschädigter informiert. Objektschutz empfohlen.',
    ],
  },

  'Verfolgungsjagd': {
    initialReport: [
      'Verfolgung aufgenommen! Fahrzeug missachtet Anhaltesignal. Geschwindigkeit über 120 km/h. Verfolge stadtauswärts.',
      'Vor Ort. Verkehrskontrolle. Fahrzeug flüchtet. Nehme Verfolgung auf. Kennzeichen notiert.',
      'Verfolgung im Gang. Fahrzeug fährt gefährlich. Benötige Unterstützung zum Abfangen!',
    ],
    backupRequest: {
      message: 'Verfolgung läuft weiter! Richtung Autobahn. Benötige weitere Streifen zum Sperren der Auffahrt!',
      additionalVehicles: 2,
      urgent: true,
    },
    completionReport: [
      'Fahrzeug gestellt. Fahrer festgenommen. Führerschein sichergestellt.',
      'Verfolgung beendet. Fahrzeug nach 5km gestoppt. 2 Insassen in Gewahrsam.',
    ],
  },

  'Bombendrohung': {
    initialReport: [
      'Vor Ort. Bombendrohung per Telefon eingegangen. Gebäude wird evakuiert. Sprengstoffhund angefordert!',
      'Einsatzort erreicht. Verdächtiger Gegenstand gemeldet. Absperrung 200m wird eingerichtet. Entschärfungsdienst benötigt!',
      'Am Einsatzort. Bombendrohung ernst zu nehmen. Evakuierung läuft. Benötige massive Verstärkung!',
    ],
    backupRequest: {
      message: 'Großevakuierung notwendig! Über 500 Personen betroffen. Benötige mind. 4 weitere Streifen und Feuerwehr!',
      additionalVehicles: 4,
      urgent: true,
    },
    progressReports: [
      'Evakuierung läuft. Sprengstoffexperten vor Ort. Gegenstand wird untersucht.',
      'Weiträumige Absperrung steht. Entschärfung wird vorbereitet.',
    ],
    completionReport: [
      'Fehlalarm. Verdächtiger Gegenstand war harmlos. Gebäude wird freigegeben.',
      'Einsatz beendet. Evakuierung aufgehoben. Täter der Drohung ermittelt.',
    ],
  },

  'Vermisste Person': {
    initialReport: [
      'Vor Ort. Angehörige machen sich große Sorgen. Person seit 12 Stunden vermisst. Letzte Sichtung notiert.',
      'Einsatzort erreicht. Vermisste Person: Frau, 75 Jahre, dement. Beginne mit Befragung und Suchmaßnahmen.',
      'Am Einsatzort. Kind vermisst. Eltern in Panik. Personenbeschreibung aufgenommen. Suche angelaufen.',
    ],
    backupRequest: {
      message: 'Suchgebiet großflächig. Benötige zusätzliche Kräfte und Polizeihubschrauber für Luftsuche.',
      additionalVehicles: 3,
      urgent: true,
    },
    progressReports: [
      'Suchmaßnahmen laufen. Hubschrauber im Einsatz. Nachbarn werden befragt.',
      'Suchhunde vor Ort. Letzte bekannte Aufenthaltsorte werden abgesucht.',
    ],
    completionReport: [
      'Person wohlbehalten aufgefunden. Angehörige informiert. Glückliches Ende.',
      'Vermisste Person lokalisiert. Gesundheitlich stabil. Einsatz erfolgreich beendet.',
    ],
  },

  'Häuslicher Streit': {
    initialReport: [
      'Vor Ort. Lautstarke Auseinandersetzung. Beide Parteien erregt. Situation wird beruhigt.',
      'Einsatzort erreicht. Streit zwischen Eheleuten. Keine körperliche Gewalt. Schlichtungsversuch läuft.',
      'Am Einsatzort. Nachbarschaftsstreit. Beide Seiten werden angehört.',
    ],
    completionReport: [
      'Streit geschlichtet. Beide Parteien beruhigt. Platzverweis nicht nötig.',
      'Situation geklärt. Parteien getrennt. Einsatz beendet.',
    ],
  },

  'Illegales Straßenrennen': {
    initialReport: [
      'Vor Ort. Illegales Straßenrennen beobachtet. 4-5 Fahrzeuge beteiligt. Kennzeichen werden notiert.',
      'Einsatzort erreicht. Fahrzeuge rasen auf Parkplatz. Kontrolle wird durchgeführt.',
      'Am Einsatzort. Tuning-Treffen mit illegalen Rennen. Mehrere Fahrzeuge müssen kontrolliert werden.',
    ],
    backupRequest: {
      message: 'Größere Gruppe von Rennfahrern. Über 10 Fahrzeuge. Benötige Verstärkung zur Kontrolle aller Beteiligten.',
      additionalVehicles: 2,
      urgent: false,
    },
    completionReport: [
      '3 Fahrzeuge sichergestellt. Führerscheine beschlagnahmt. Anzeigen erstattet.',
      'Einsatz beendet. Fahrzeuge technisch geprüft. 2 Fahrzeuge aus dem Verkehr gezogen.',
    ],
  },

  'Betrunkener Fahrer': {
    initialReport: [
      'Vor Ort. Fahrzeugführer kontrolliert. Starker Alkoholgeruch. Atemalkoholtest läuft.',
      'Einsatzort erreicht. Betrunkener Fahrer wie gemeldet. Fahrzeug wurde gestoppt. Test zeigt 1,8 Promille.',
      'Am Einsatzort. PKW-Fahrer deutlich alkoholisiert. Blutprobe wird angeordnet.',
    ],
    completionReport: [
      'Führerschein sichergestellt. Blutprobe entnommen. Fahrzeug abgestellt. Anzeige wegen Trunkenheit.',
      'Einsatz beendet. Fahrer zur Blutentnahme gebracht. Fahrzeug sichergestellt.',
    ],
  },

  'Ladendiebstahl': {
    initialReport: [
      'Vor Ort. Ladendetektiv hat Person auf frischer Tat ertappt. Tatverdächtiger festgehalten.',
      'Einsatzort erreicht. Diebstahl von Waren im Wert von 150€. Person wird überprüft.',
      'Am Einsatzort. Ladendiebstahl bestätigt. Ware sichergestellt. Personalien werden festgestellt.',
    ],
    completionReport: [
      'Anzeige wegen Diebstahls aufgenommen. Ware zurückgegeben. Person belehrt und entlassen.',
      'Einsatz beendet. Hausverbot ausgesprochen. Geschädigter zufrieden.',
    ],
  },

  'Brandstiftung': {
    initialReport: [
      'Vor Ort. Brandstiftung bestätigt. Feuerwehr löscht Brand. Brandursache deutet auf Vorsatz. Tatortarbeit läuft.',
      'Einsatzort erreicht. Müllcontainer in Brand. Zeugen berichten von flüchtiger Person. Fahndung eingeleitet.',
      'Am Einsatzort. PKW-Brand. Brandbeschleuniger vermutet. Spurensicherung wird durchgeführt.',
    ],
    backupRequest: {
      message: 'Tatverdächtiger in der Nähe gesichtet. Benötige Verstärkung zur Fahndung und Tatortabsicherung.',
      additionalVehicles: 2,
      urgent: true,
    },
    completionReport: [
      'Spurensicherung abgeschlossen. Brandursache dokumentiert. Ermittlungen laufen weiter.',
      'Einsatz vor Ort beendet. Tatverdächtiger festgenommen. Brandort gesichert.',
    ],
  },

  'Drogenhandel': {
    initialReport: [
      'Vor Ort. Verdacht auf Drogenhandel bestätigt. Mehrere Personen beim Dealen beobachtet. Kontrolle läuft.',
      'Einsatzort erreicht. Dealerszene angetroffen. 3 Personen werden kontrolliert. Drogen sichergestellt.',
      'Am Einsatzort. Offener Drogenhandel. Personen wirken aggressiv. Platzverweis wird erteilt.',
    ],
    backupRequest: {
      message: 'Größere Personengruppe. Lage angespannt. Benötige Verstärkung für Durchsuchungen.',
      additionalVehicles: 2,
      urgent: false,
    },
    completionReport: [
      'Drogen sichergestellt. 2 Personen in Gewahrsam. Anzeigen wegen BtM-Besitz erstattet.',
      'Einsatz beendet. Platzverweise ausgesprochen. Örtlichkeit wird beobachtet.',
    ],
  },

  'Belästigung': {
    initialReport: [
      'Vor Ort. Belästigung bestätigt. Opfer zeigt sich verängstigt. Beschuldigter wird gestellt.',
      'Einsatzort erreicht. Verbale Belästigung. Geschädigte macht Angaben. Täter wird gesucht.',
      'Am Einsatzort. Sexuelle Belästigung gemeldet. Opfer wird befragt. Personalien werden aufgenommen.',
    ],
    completionReport: [
      'Platzverweis erteilt. Anzeige wegen Belästigung aufgenommen. Opfer beruhigt.',
      'Einsatz beendet. Täter belehrt. Kontaktverbot ausgesprochen.',
    ],
  },

  'Falschparker': {
    initialReport: [
      'Vor Ort. Fahrzeug blockiert Feuerwehrzufahrt. Halter wird gesucht.',
      'Einsatzort erreicht. PKW parkt auf Behindertenparkplatz. Kein Parkausweis. Abschleppen wird eingeleitet.',
      'Am Einsatzort. Falschparker blockiert Straße komplett. Fahrzeug wird abgeschleppt.',
    ],
    completionReport: [
      'Fahrzeug abgeschleppt. Verwarngeld erteilt. Straße wieder frei.',
      'Einsatz beendet. Halter konnte nicht erreicht werden. Abschleppfirma informiert.',
    ],
  },

  'Lärmbelästigung': {
    initialReport: [
      'Vor Ort. Lärmbelästigung durch laute Musik. Verursacher wird kontaktiert.',
      'Einsatzort erreicht. Bauarbeiten außerhalb der Ruhezeiten. Bauleiter wird belehrt.',
      'Am Einsatzort. Dauerhafte Lärmbelästigung durch Nachbarn. Beide Parteien werden angehört.',
    ],
    completionReport: [
      'Verursacher verwarnt. Lautstärke reduziert. Ruhe wiederhergestellt.',
      'Einsatz beendet. Ordnungswidrigkeit angezeigt. Lärm wurde eingestellt.',
    ],
  },
};

// Helper: Zufällige Meldung aus Array auswählen
export function getRandomReport(reports: string[]): string {
  return reports[Math.floor(Math.random() * reports.length)];
}

// Helper: Prüfe ob Einsatz Verstärkungsanforderung hat
export function hasBackupRequest(incidentType: string): boolean {
  return !!incidentReports[incidentType]?.backupRequest;
}

// Helper: Hole Verstärkungsanforderung
export function getBackupRequest(incidentType: string) {
  return incidentReports[incidentType]?.backupRequest;
}
