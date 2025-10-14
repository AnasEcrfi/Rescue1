// Zentralisierte Zeit-Hilfsfunktionen für die Simulation

/**
 * Formatiert die Spielzeit (in Minuten) zu einem HH:MM String
 * @param gameTime - Zeit in Minuten seit Schichtbeginn
 * @returns Formatierte Zeit als "HH:MM"
 */
export const formatGameTime = (gameTime: number): string => {
  const hours = Math.floor(gameTime / 60);
  const minutes = Math.floor(gameTime % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

/**
 * Berechnet Stunden und Minuten aus Spielzeit
 * @param gameTime - Zeit in Minuten seit Schichtbeginn
 * @returns Objekt mit hours und minutes
 */
export const getHoursAndMinutes = (gameTime: number): { hours: number; minutes: number } => {
  return {
    hours: Math.floor(gameTime / 60),
    minutes: Math.floor(gameTime % 60),
  };
};

/**
 * Konvertiert Millisekunden in Minuten
 * @param ms - Zeit in Millisekunden
 * @returns Zeit in Minuten
 */
export const msToMinutes = (ms: number): number => {
  return Math.floor(ms / 60000);
};

/**
 * Konvertiert Sekunden in formatierte Zeit (MM:SS)
 * @param seconds - Zeit in Sekunden
 * @returns Formatierte Zeit als "MM:SS"
 */
export const formatSeconds = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Berechnet Zeit seit einem Timestamp
 * @param timestamp - Start-Timestamp in Millisekunden
 * @returns Zeit in Sekunden seit Timestamp
 */
export const getElapsedSeconds = (timestamp: number): number => {
  return Math.floor((Date.now() - timestamp) / 1000);
};

/**
 * Berechnet verbleibende Zeit in Prozent
 * @param elapsed - Vergangene Zeit in Sekunden
 * @param total - Gesamtzeit in Sekunden
 * @returns Prozent (0-100)
 */
export const getTimeRemainingPercent = (elapsed: number, total: number): number => {
  return Math.max(0, Math.min(100, ((total - elapsed) / total) * 100));
};
