// Echte Adressen für Frankfurt POIs und generierte Privatadressen

// POI-Adressen (echte Adressen der POIs)
export const poiAddresses: { [poiName: string]: string } = {
  // SCHULEN
  'Goethe-Gymnasium': 'Diesterwegstraße 22, 60594 Frankfurt am Main',
  'Carl-Schurz-Schule': 'Holbeinstraße 21, 60596 Frankfurt am Main',
  'Liebigschule Frankfurt': 'Kollwitzstraße 3, 60488 Frankfurt am Main',
  'Freiligrathschule': 'Freiligrathstraße 25, 60311 Frankfurt am Main',

  // BANKEN
  'Commerzbank Tower': 'Kaiserplatz, 60311 Frankfurt am Main',
  'Deutsche Bank Hauptfiliale': 'Taunusanlage 12, 60325 Frankfurt am Main',
  'Sparkasse 1822 Hauptwache': 'Hauptwache, 60313 Frankfurt am Main',
  'DZ Bank Hochhaus': 'Platz der Republik, 60265 Frankfurt am Main',

  // KRANKENHÄUSER
  'Universitätsklinikum Frankfurt': 'Theodor-Stern-Kai 7, 60590 Frankfurt am Main',
  'St. Katharinen-Krankenhaus': 'Seckbacher Landstraße 65, 60389 Frankfurt am Main',

  // SHOPPING
  'Zeil Galerie Kaufhof': 'Zeil 116-126, 60313 Frankfurt am Main',
  'MyZeil Shopping-Center': 'Zeil 106, 60313 Frankfurt am Main',
  'Galeria Hauptwache': 'Hauptwache (B-Ebene), 60313 Frankfurt am Main',
  'Kleinmarkthalle Frankfurt': 'Hasengasse 5-7, 60311 Frankfurt am Main',

  // RESTAURANTS & BARS
  'Apfelwein Wagner': 'Schweizer Straße 71, 60594 Frankfurt am Main',
  'Restaurant Margarete': 'Braubachstraße 18-22, 60311 Frankfurt am Main',
  'Römer Pils Brunnen': 'Römerberg 27, 60311 Frankfurt am Main',

  // HOTELS
  'Jumeirah Frankfurt': 'Thurn-und-Taxis-Platz 2, 60313 Frankfurt am Main',
  'Steigenberger Frankfurter Hof': 'Am Kaiserplatz, 60311 Frankfurt am Main',
  'Motel One Hauptbahnhof': 'Poststraße 8, 60329 Frankfurt am Main',

  // BÜROS
  'Messeturm Frankfurt': 'Friedrich-Ebert-Anlage 49, 60308 Frankfurt am Main',
  'Westend Tower': 'Mainzer Landstraße 58, 60325 Frankfurt am Main',
  'Main Tower': 'Neue Mainzer Straße 52-58, 60311 Frankfurt am Main',

  // PARKS
  'Palmengarten': 'Siesmayerstraße 61, 60323 Frankfurt am Main',
  'Grüneburgpark': 'Grüneburgweg, 60323 Frankfurt am Main',
  'Bethmannpark': 'Friedberger Anlage 1, 60316 Frankfurt am Main',

  // BAHNHÖFE
  'Frankfurt Hauptbahnhof': 'Am Hauptbahnhof, 60329 Frankfurt am Main',
  'Konstablerwache': 'Konstabler Wache, 60313 Frankfurt am Main',
  'Hauptwache': 'An der Hauptwache, 60313 Frankfurt am Main',

  // MUSEEN
  'Städel Museum': 'Schaumainkai 63, 60596 Frankfurt am Main',
  'Senckenberg Naturmuseum': 'Senckenberganlage 25, 60325 Frankfurt am Main',
  'Alte Oper Frankfurt': 'Opernplatz 1, 60313 Frankfurt am Main',

  // NACHTLEBEN
  'Cocoon Club': 'Carl-Benz-Straße 21, 60386 Frankfurt am Main',
  'King Kamehameha Club': 'Hanauer Landstraße 192, 60314 Frankfurt am Main',
  'Bar Shuka': 'Braubachstraße 18-22, 60311 Frankfurt am Main',

  // UNIVERSITÄTEN
  'Goethe-Universität Campus Westend': 'Theodor-W.-Adorno-Platz 1, 60323 Frankfurt am Main',
  'Frankfurt School of Finance': 'Adickesallee 32-34, 60322 Frankfurt am Main',

  // WOHNGEBIETE - Beispiel-Adressen
  'Wohnblock Gallus': 'Frankenallee 45, 60326 Frankfurt am Main',
  'Nordend Wohnstraße': 'Oeder Weg 24, 60318 Frankfurt am Main',
  'Sachsenhausen Altstadt': 'Große Rittergasse 12, 60594 Frankfurt am Main',
};

// Straßennamen für verschiedene Stadtteile (für generierte Privatadressen)
const streetNamesByDistrict: { [district: string]: string[] } = {
  Innenstadt: [
    'Kaiserstraße',
    'Zeil',
    'Berliner Straße',
    'Münchener Straße',
    'Schillerstraße',
    'Goethestraße',
    'Taunusstraße',
    'Neue Mainzer Straße',
    'Große Friedberger Straße',
  ],
  Bahnhofsviertel: [
    'Münchener Straße',
    'Karlsruher Straße',
    'Mannheimer Straße',
    'Stuttgarter Straße',
    'Elbestraße',
    'Weserstraße',
    'Moselstraße',
  ],
  Sachsenhausen: [
    'Schweizer Straße',
    'Große Rittergasse',
    'Kleine Rittergasse',
    'Textorstraße',
    'Brückenstraße',
    'Dreieichstraße',
    'Diesterwegstraße',
  ],
  Bornheim: [
    'Berger Straße',
    'Uhlandstraße',
    'Saalburgstraße',
    'Wittelsbacherallee',
    'Arnsburger Straße',
  ],
  Westend: [
    'Bockenheimer Landstraße',
    'Feuerbachstraße',
    'Kettenhofweg',
    'Reuterweg',
    'Grüneburgweg',
  ],
  Nordend: [
    'Friedberger Landstraße',
    'Oeder Weg',
    'Eschersheimer Landstraße',
    'Nibelungenallee',
    'Glauburgstraße',
  ],
  Gallus: [
    'Frankenallee',
    'Mainzer Landstraße',
    'Idsteiner Straße',
    'Rebstöcker Straße',
  ],
};

// Generiere zufällige Privatadresse
export const generatePrivateAddress = (): string => {
  const districts = Object.keys(streetNamesByDistrict);
  const district = districts[Math.floor(Math.random() * districts.length)];
  const streets = streetNamesByDistrict[district];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const houseNumber = Math.floor(Math.random() * 150) + 1;

  // Manchmal mit Buchstabe (a, b, c)
  const hasLetter = Math.random() < 0.2;
  const letter = hasLetter ? String.fromCharCode(97 + Math.floor(Math.random() * 3)) : '';

  // PLZ basiert auf Stadtteil (echte Frankfurt PLZs)
  const plzMapping: { [key: string]: number[] } = {
    Innenstadt: [60311, 60313],
    Bahnhofsviertel: [60329, 60327],
    Sachsenhausen: [60594, 60596],
    Bornheim: [60385, 60386],
    Westend: [60323, 60325],
    Nordend: [60316, 60318],
    Gallus: [60326, 60329],
  };

  const plzOptions = plzMapping[district] || [60311];
  const plz = plzOptions[Math.floor(Math.random() * plzOptions.length)];

  return `${street} ${houseNumber}${letter}, ${plz} Frankfurt am Main`;
};

// Hole Adresse für POI oder generiere Privatadresse
export const getAddressForLocation = (locationName: string, isPrivate: boolean = false): string => {
  if (isPrivate) {
    return generatePrivateAddress();
  }

  // Suche in POI-Adressen
  if (poiAddresses[locationName]) {
    return poiAddresses[locationName];
  }

  // Fallback: Generiere Adresse
  return generatePrivateAddress();
};
