import { useEffect } from 'react';

/**
 * ⭐ UX #5: Erweitertes Hotkey-System für schnelle Aktionen
 *
 * Tastenbelegung:
 * - E: Einsatz beenden (ausgewähltes Fahrzeug)
 * - H: Zurück zur Wache (ausgewähltes Fahrzeug)
 * - Leertaste: Pause/Play
 * - +: Spielgeschwindigkeit erhöhen
 * - -: Spielgeschwindigkeit verringern
 * - 1-9: Fahrzeug direkt auswählen
 * - S: Schichtwechsel (ausgewähltes Fahrzeug)
 * - Escape: Auswahl aufheben
 * - A: Ausgewähltes Fahrzeug alarmieren (zu aktivem Einsatz)
 * - M: Karte zentrieren auf aktiven Einsatz
 * - F: Fokus auf ausgewähltes Fahrzeug
 * - C: Anruf annehmen (ältester wartender)
 * - R: Schnell-Responder (nächstes verfügbares Fahrzeug alarmieren)
 * - D: Details-Panel togglen
 * - ?/H: Hilfe-Overlay anzeigen
 */

export interface HotkeyHandlers {
  onEndMission?: () => void;
  onReturnToStation?: () => void;
  onTogglePause?: () => void;
  onIncreaseSpeed?: () => void;
  onDecreaseSpeed?: () => void;
  onSelectVehicle?: (vehicleId: number) => void;
  onClearSelection?: () => void;
  onShiftChange?: () => void;
  // ⭐ UX #5: Neue erweiterte Hotkeys
  onDispatchSelected?: () => void; // A - Alarmieren
  onCenterOnIncident?: () => void; // M - Karte zentrieren
  onFocusVehicle?: () => void; // F - Fokus auf Fahrzeug
  onAnswerCall?: () => void; // C - Anruf annehmen
  onQuickDispatch?: () => void; // R - Quick Responder
  onToggleDetails?: () => void; // D - Details togglen
  onShowHelp?: () => void; // ? - Hilfe
}

export function useHotkeys(handlers: HotkeyHandlers, enabled: boolean = true) {
  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignoriere Hotkeys wenn in Input-Feld
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const key = event.key.toLowerCase();

      // E - Einsatz beenden
      if (key === 'e' && handlers.onEndMission) {
        event.preventDefault();
        handlers.onEndMission();
      }

      // H - Zurück zur Wache
      if (key === 'h' && handlers.onReturnToStation) {
        event.preventDefault();
        handlers.onReturnToStation();
      }

      // Leertaste - Pause/Play
      if (key === ' ' && handlers.onTogglePause) {
        event.preventDefault();
        handlers.onTogglePause();
      }

      // + - Geschwindigkeit erhöhen
      if ((key === '+' || key === '=') && handlers.onIncreaseSpeed) {
        event.preventDefault();
        handlers.onIncreaseSpeed();
      }

      // - - Geschwindigkeit verringern
      if (key === '-' && handlers.onDecreaseSpeed) {
        event.preventDefault();
        handlers.onDecreaseSpeed();
      }

      // 1-9 - Fahrzeug auswählen
      if (/^[1-9]$/.test(key) && handlers.onSelectVehicle) {
        event.preventDefault();
        const vehicleId = parseInt(key, 10);
        handlers.onSelectVehicle(vehicleId);
      }

      // S - Schichtwechsel
      if (key === 's' && handlers.onShiftChange) {
        event.preventDefault();
        handlers.onShiftChange();
      }

      // Escape - Auswahl aufheben
      if (key === 'escape' && handlers.onClearSelection) {
        event.preventDefault();
        handlers.onClearSelection();
      }

      // ⭐ UX #5: Neue erweiterte Hotkeys

      // A - Alarmieren (Dispatch selected vehicle)
      if (key === 'a' && handlers.onDispatchSelected) {
        event.preventDefault();
        handlers.onDispatchSelected();
      }

      // M - Karte zentrieren auf Einsatz
      if (key === 'm' && handlers.onCenterOnIncident) {
        event.preventDefault();
        handlers.onCenterOnIncident();
      }

      // F - Fokus auf Fahrzeug
      if (key === 'f' && handlers.onFocusVehicle) {
        event.preventDefault();
        handlers.onFocusVehicle();
      }

      // C - Anruf annehmen
      if (key === 'c' && handlers.onAnswerCall) {
        event.preventDefault();
        handlers.onAnswerCall();
      }

      // R - Quick Responder (nächstes verfügbares Fahrzeug)
      if (key === 'r' && handlers.onQuickDispatch) {
        event.preventDefault();
        handlers.onQuickDispatch();
      }

      // D - Details Panel togglen
      if (key === 'd' && handlers.onToggleDetails) {
        event.preventDefault();
        handlers.onToggleDetails();
      }

      // ? - Hilfe anzeigen
      if (key === '?' && handlers.onShowHelp) {
        event.preventDefault();
        handlers.onShowHelp();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handlers, enabled]);
}
