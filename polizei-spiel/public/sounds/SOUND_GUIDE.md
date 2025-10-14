# Sound-Bibliothek für Polizei-Einsatzleitstellen-Spiel

## Organisierte Sound-Struktur

### 📁 `/sounds/game/` - Spielrelevante Sounds (Optimiert für Einsatzleitstelle)

#### 1. **Funk-Sounds** (`/sounds/game/funk/`)
Authentische deutsche Polizei-Funkgeräte (TETRA Sepura & Motorola)

| Datei | Verwendung | Beschreibung |
|-------|-----------|--------------|
| `polizeifunk_01.wav` | Funk-Kommunikation | 10 Min. authentische deutsche Polizei-Funksprüche |
| `funk_ptt_press.wav` | PTT-Taste drücken | Sepura TETRA - Push-to-Talk Aktivierung |
| `funk_ptt_release.wav` | PTT-Taste loslassen | Motorola - Funk-Ende Signal |
| `funk_signal_doubletone.wav` | Signalton | Motorola Doppelton (z.B. wichtige Durchsage) |
| `funk_signal_quattrone.wav` | Alarmton | Sepura Quattrone (4-Ton, für Notfälle) |

**Verwendung im Spiel:**
- Bei eingehenden Funkmeldungen
- Wenn Spieler mit Einheiten kommuniziert
- Hintergrund-Atmosphäre in der Leitstelle
- Status-Updates von Einsatzfahrzeugen

---

#### 2. **Leitstellen-Sounds** (`/sounds/game/leitstelle/`)
Sounds für die Einsatzleitstelle/Zentrale

| Datei | Verwendung | Beschreibung |
|-------|-----------|--------------|
| `button_beep.wav` | Tastendruck | Hella RTK7 Button-Piep (authentisch!) |

**Verwendung im Spiel:**
- Eingehende Notrufe/Meldungen
- System-Benachrichtigungen
- Einsatz-Alarmierung
- Statusänderungen von Fahrzeugen (FMS)

---

#### 3. **Fahrzeug-Sounds** (`/sounds/game/fahrzeug/`)
Sounds für Einsatzfahrzeuge

| Datei | Verwendung | Beschreibung |
|-------|-----------|--------------|
| `sirene_loop.wav` | Sirene (Loop) | NRW Martinshorn - zum Endlos-Abspielen |
| `horn_distanz.wav` | Horn aus Distanz | Horneintastung aus der Entfernung |

**Verwendung im Spiel:**
- Wenn Fahrzeuge zum Einsatz fahren
- Status "Mit Sonderrechten unterwegs"
- Audio-Feedback für Spieler

---

#### 4. **UI-Sounds** (`/sounds/game/ui/`)
Benutzeroberflächen-Sounds

| Datei | Verwendung | Beschreibung |
|-------|-----------|--------------|
| `button_click.wav` | Button-Klick | Standby BT Button-Sound |

**Verwendung im Spiel:**
- Menü-Navigation
- Button-Klicks
- Einsatz annehmen/ablehnen
- Map-Interaktionen

---

## 📁 `/sounds/propcop-free-sounds/` - Original-Bibliothek

Die komplette PropCop Sound-Bibliothek bleibt als Backup erhalten:

### Verfügbare Kategorien:
- **Funk/** - 11 Dateien (TETRA Funkgeräte: Sepura & Motorola)
- **Sirene/** - 9 Dateien (verschiedene Martinshorn-Varianten + Loops)
- **Streifenwagen/** - 4 Dateien (Funk-Piker, Standby-Sounds)
- **Uniformen-Einsatzmittel/** - 8 Dateien (Handschellen, Holster, Bodycam, etc.)
- **Waffen/** - 17 Dateien (P99, P30 Sounds - für Spiel wahrscheinlich nicht relevant)
- **sonstiges/** - 1 Datei (Zugriff-Sound)

---

## Empfohlene Sounds für Dein Einsatzleitstellen-Spiel

### 🎯 **Priorität 1 - Sofort implementieren:**

1. **Neue Einsatzmeldung:**
   - `funk_signal_doubletone.wav` oder `funk_signal_quattrone.wav`
   - Als Alarm wenn neuer Einsatz reinkommt

2. **Funkverkehr:**
   - `polizeifunk_01.wav` (10 Min Loop im Hintergrund)
   - `funk_ptt_press.wav` + `funk_ptt_release.wav` bei Kommunikation

3. **UI-Feedback:**
   - `button_click.wav` für alle Button-Klicks
   - `button_beep.wav` für wichtige Aktionen (Einsatz annehmen)

### 🎯 **Priorität 2 - Später hinzufügen:**

4. **Fahrzeug-Status:**
   - `sirene_loop.wav` wenn Fahrzeug zum Einsatz fährt
   - `horn_distanz.wav` für Atmosphäre

### 🎯 **Zusätzliche Sounds aus Original-Bibliothek:**

Falls du später mehr Features brauchst:
- `Funk/sepura_buttons.wav` - für Funkgerät-Menü
- `Sirene/sirene_01.wav`, `sirene_02.wav`, `sirene_03.wav` - verschiedene Sirenen-Varianten
- `Sirene/_loop_sirene_inside.wav` - Sirene von innen (Fahrzeugansicht)
- `Streifenwagen/standby_BT_loop.wav` - Standby-Geräusch im Fahrzeug

---

## Code-Integration Beispiel

```typescript
// Sound Manager für dein Spiel
export const GameSounds = {
  // Funk
  newMessage: '/sounds/game/funk/funk_signal_quattrone.wav',
  pttPress: '/sounds/game/funk/funk_ptt_press.wav',
  pttRelease: '/sounds/game/funk/funk_ptt_release.wav',
  radioChatter: '/sounds/game/funk/polizeifunk_01.wav',

  // Leitstelle
  alert: '/sounds/game/leitstelle/button_beep.wav',

  // UI
  buttonClick: '/sounds/game/ui/button_click.wav',

  // Fahrzeug
  sirene: '/sounds/game/fahrzeug/sirene_loop.wav',
  horn: '/sounds/game/fahrzeug/horn_distanz.wav',
};

// Verwendung:
const audio = new Audio(GameSounds.newMessage);
audio.play();
```

---

## Lizenz

**PropCop Effects & Filmproduktion**
- Kostenlos für kommerzielle und nicht-kommerzielle Nutzung
- Attribution erforderlich: "PropCop Effects & Filmproduktion"
- Siehe `propcop-free-sounds/lizenz.txt` für Details

---

## Technische Spezifikationen

- **Format:** WAV (unkomprimiert)
- **Sample Rate:** 48 kHz (Standard für Film/Game)
- **Qualität:** Professionelle Aufnahmen von echter deutscher Polizeiausrüstung
- **TETRA-Standard:** Authentische Sepura & Motorola Digitalfunk-Geräte

---

## Hessen-Spezifische Details

Die Sounds stammen von **echten deutschen Polizei-Funkgeräten** und sind kompatibel mit:
- TETRA-Digitalfunk (seit 2010 in Hessen)
- Sepura-Funkgeräte (Standard in vielen deutschen Bundesländern)
- Motorola-Funkgeräte (ebenfalls BOS-Standard)

Die **Funksprüche** in `polizeifunk_01.wav` sind fiktiv, aber mit authentischer deutscher Terminologie und Funkdisziplin.

---

**Erstellt:** 2025-10-14
**Für:** Rescue1 - Polizei-Einsatzleitstellen-Simulator
