// Ausrückzeiten für verschiedene Fahrzeugtypen
// Basierend auf echtem System, aber spielbar (ca. 1/3 der Realzeit)

import type { VehicleType } from '../types';

// Ausrückzeiten in Sekunden (Zeit von Alarmierung bis Ausrücken)
// S2 (Frei auf Wache) → S3 (Einsatz übernommen, unterwegs)
// Optimiert für Spielbarkeit (realistisch aber nicht zu lang)
export const DISPATCH_DELAYS: Record<VehicleType, number> = {
  'Streifenwagen': 8,    // Standard-Streife (8-10s)
  'SEK': 25,             // SEK (schwere Ausrüstung)
  'Zivilfahrzeug': 5,    // Zivil (schnell einsatzbereit)
  'Polizeihubschrauber': 30, // Helikopter (Pre-Flight Check)
};

// Minimale und maximale Variation der Ausrückzeit (±10%)
export const DISPATCH_TIME_VARIANCE = 0.1;

// Berechne tatsächliche Ausrückzeit mit leichter Variation
export const calculateDispatchDelay = (vehicleType: VehicleType): number => {
  const baseDelay = DISPATCH_DELAYS[vehicleType] || 20; // Fallback 20 Sekunden
  const variance = baseDelay * DISPATCH_TIME_VARIANCE;
  const randomOffset = (Math.random() * 2 - 1) * variance; // -10% bis +10%
  return Math.round(baseDelay + randomOffset);
};

// Sprechwunsch-Chancen je nach Status
export const SPEAK_REQUEST_CHANCES = {
  S3: 0.08,  // 8% während Anfahrt (z.B. "Straße blockiert", "Benötigen Verstärkung")
  S4: 0.15,  // 15% am Einsatzort (z.B. Lagemeldungen, Nachforderungen)
  S8: 0.05,  // 5% während Rückfahrt (z.B. "Tankstand niedrig", "Fahrzeug beschädigt")
};

// Sprechwunsch-Gründe nach Status
export type SpeakRequestContext = {
  status: 'S3' | 'S4' | 'S8';
  reasons: string[];
};

export const SPEAK_REQUEST_REASONS: SpeakRequestContext[] = [
  {
    status: 'S3',
    reasons: [
      'Straße blockiert, suchen alternative Route',
      'Benötigen Verstärkung',
      'Unfallstelle auf dem Weg entdeckt',
      'Verkehr stark, verzögerte Ankunft',
      'Verdächtige Personen am Einsatzort gesehen',
    ]
  },
  {
    status: 'S4',
    reasons: [
      'Lage komplexer als erwartet',
      'Benötigen Spezialkräfte',
      'Person festgenommen',
      'Weitere Straftaten entdeckt',
      'Zeugen gefunden',
      'Benötigen Rettungswagen',
      'Tatort gesichert',
    ]
  },
  {
    status: 'S8',
    reasons: [
      'Tankstand kritisch',
      'Fahrzeug hat technische Probleme',
      'Besatzung benötigt Pause',
      'Fahrzeug beschädigt',
      'Können weiteren Einsatz übernehmen',
    ]
  }
];

// Hilfsfunktion: Zufälligen Sprechwunsch-Grund für Status generieren
export const getRandomSpeakRequestReason = (status: 'S3' | 'S4' | 'S8'): string => {
  const context = SPEAK_REQUEST_REASONS.find(r => r.status === status);
  if (!context) return 'Sprechwunsch';

  const reasons = context.reasons;
  return reasons[Math.floor(Math.random() * reasons.length)];
};
