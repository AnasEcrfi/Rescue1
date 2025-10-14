// 🎮 Zentraler Game Store mit Zustand
// Ersetzt 26+ useState Hooks aus App.tsx für bessere Performance und Wartbarkeit

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type {
  Vehicle,
  Incident,
  Call,
  PoliceStation,
  Achievement,
  VehicleStatus
} from '../types/index';
import type { ToastData } from '../components/Toast';
import type { Statistics, Difficulty } from '../types/game';
import type { WeatherState } from '../types/weather';
import type { RadioMessage } from '../components/RadioLog';
import type { LogEntry } from '../types/logs';
import type { ProtocolEntry } from '../types/protocol';

// ============================================================================
// STORE INTERFACE
// ============================================================================

interface GameStore {
  // ===== GAME STATE =====
  gameStarted: boolean;
  gameTime: number; // in Minuten
  gameTimeSeconds: number; // Sekunden (0-59) für präzise Anzeige
  selectedTime: number; // Stunde (0-23)
  gameSpeed: 1 | 2 | 3 | 4;
  isPaused: boolean;
  difficulty: Difficulty;
  score: number;

  // ===== ENTITIES =====
  vehicles: Vehicle[];
  incidents: Incident[];
  calls: Call[];
  stations: PoliceStation[];

  // ===== COUNTERS =====
  incidentCounter: number;
  callIdCounter: number;
  toastCounter: number;

  // ===== UI STATE =====
  selectedStation: number | null;
  selectedCall: Call | null;
  selectedIncidentForBackup: Incident | null;
  selectedSpeakRequestVehicle: Vehicle | null;
  isCallModalOpen: boolean;
  isBackupModalOpen: boolean;
  isSpeakRequestModalOpen: boolean;
  isTimeDropdownOpen: boolean;
  showStatsModal: boolean;
  blaulichtOn: boolean;

  // ===== MAP STATE =====
  mapCenter: [number, number];
  mapZoom: number;

  // ===== STATISTICS =====
  statistics: Statistics;

  // ===== TOASTS =====
  toasts: ToastData[];

  // ===== ACHIEVEMENTS =====
  achievements: Achievement[];

  // ===== WEATHER =====
  weather: WeatherState;

  // ===== RADIO MESSAGES =====
  radioMessages: RadioMessage[];
  radioMessageIdCounter: number;

  // ===== LOGS =====
  logs: LogEntry[];
  logCounter: number;

  // ===== PROTOCOL =====
  protocolEntries: ProtocolEntry[];
  showProtocolPanel: boolean;

  // ============================================================================
  // ACTIONS - GAME CONTROL
  // ============================================================================

  startGame: (stationId: number) => void;
  pauseGame: () => void;
  resumeGame: () => void;
  setGameSpeed: (speed: 1 | 2 | 3 | 4) => void;
  setGameTime: (time: number | ((prev: number) => number)) => void;
  incrementGameTimeSeconds: () => void; // Inkrementiert Sekunden, bei 60 -> Minute++
  setSelectedTime: (hour: number) => void;
  setDifficulty: (difficulty: Difficulty) => void;
  addScore: (points: number) => void;

  // ============================================================================
  // ACTIONS - VEHICLES
  // ============================================================================

  setVehicles: (vehicles: Vehicle[]) => void;
  updateVehicle: (id: number, updates: Partial<Vehicle>) => void;
  updateVehicleStatus: (id: number, status: VehicleStatus) => void;
  updateVehiclePosition: (id: number, position: [number, number], bearing?: number) => void;
  assignVehicleToIncident: (vehicleId: number, incidentId: number) => void;
  unassignVehicle: (vehicleId: number) => void;

  // ============================================================================
  // ACTIONS - INCIDENTS
  // ============================================================================

  setIncidents: (incidents: Incident[]) => void;
  addIncident: (incident: Incident) => void;
  updateIncident: (id: number, updates: Partial<Incident>) => void;
  removeIncident: (id: number) => void;
  incrementIncidentCounter: () => number;

  // ============================================================================
  // ACTIONS - CALLS
  // ============================================================================

  setCalls: (calls: Call[]) => void;
  addCall: (call: Call) => void;
  updateCall: (id: number, updates: Partial<Call>) => void;
  removeCall: (id: number) => void;
  incrementCallCounter: () => number;

  // ============================================================================
  // ACTIONS - STATIONS
  // ============================================================================

  setStations: (stations: PoliceStation[]) => void;

  // ============================================================================
  // ACTIONS - UI
  // ============================================================================

  setSelectedStation: (stationId: number | null) => void;
  openCallModal: (call: Call) => void;
  closeCallModal: () => void;
  openBackupModal: (incident: Incident) => void;
  closeBackupModal: () => void;
  openSpeakRequestModal: (vehicle: Vehicle) => void;
  closeSpeakRequestModal: () => void;
  toggleTimeDropdown: () => void;
  openStatsModal: () => void;
  closeStatsModal: () => void;
  toggleBlaulicht: () => void;

  // ============================================================================
  // ACTIONS - MAP
  // ============================================================================

  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;

  // ============================================================================
  // ACTIONS - STATISTICS
  // ============================================================================

  updateStatistics: (updates: Partial<Statistics>) => void;
  incrementStat: (key: keyof Statistics, amount?: number) => void;

  // ============================================================================
  // ACTIONS - TOASTS
  // ============================================================================

  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: number) => void;

  // ============================================================================
  // ACTIONS - ACHIEVEMENTS
  // ============================================================================

  unlockAchievement: (achievementId: string) => void;

  // ============================================================================
  // ACTIONS - WEATHER
  // ============================================================================

  setWeather: (weather: WeatherState) => void;
  updateWeather: (updates: Partial<WeatherState>) => void;

  // ============================================================================
  // ACTIONS - RADIO MESSAGES
  // ============================================================================

  addRadioMessage: (message: Omit<RadioMessage, 'id'>) => void;
  clearRadioMessages: () => void;

  // ============================================================================
  // ACTIONS - LOGS
  // ============================================================================

  addLog: (message: string, type: LogEntry['type'], timestamp?: string) => void;
  clearLogs: () => void;

  // ============================================================================
  // ACTIONS - PROTOCOL
  // ============================================================================

  addProtocolEntry: (entry: Omit<ProtocolEntry, 'id' | 'realTimestamp'>) => void;
  clearProtocolEntries: () => void;
  setShowProtocolPanel: (show: boolean) => void;

  // ============================================================================
  // ACTIONS - RESET
  // ============================================================================

  resetGame: () => void;
}

// ============================================================================
// INITIAL STATE
// ============================================================================

const initialStatistics: Statistics = {
  totalResolved: 0,
  totalFailed: 0,
  totalResponseTimes: [],
  incidentsByType: {},
  currentStreak: 0,
  bestStreak: 0,
  totalDistance: 0,
};

const initialState = {
  // Game State
  gameStarted: false,
  gameTime: 8 * 60, // 08:00
  gameTimeSeconds: 0, // Sekunden-Counter (0-59)
  selectedTime: 8,
  gameSpeed: 1 as 1 | 2 | 3 | 4,
  isPaused: false,
  difficulty: 'Mittel' as Difficulty,
  score: 0,

  // Entities
  vehicles: [] as Vehicle[],
  incidents: [] as Incident[],
  calls: [] as Call[],
  stations: [] as PoliceStation[],

  // Counters
  incidentCounter: 1,
  callIdCounter: 1,
  toastCounter: 1,

  // UI State
  selectedStation: null as number | null,
  selectedCall: null as Call | null,
  selectedIncidentForBackup: null as Incident | null,
  selectedSpeakRequestVehicle: null as Vehicle | null,
  isCallModalOpen: false,
  isBackupModalOpen: false,
  isSpeakRequestModalOpen: false,
  isTimeDropdownOpen: false,
  showStatsModal: false,
  blaulichtOn: false,

  // Map State
  mapCenter: [50.1109, 8.6821] as [number, number],
  mapZoom: 13,

  // Statistics
  statistics: initialStatistics,

  // Toasts
  toasts: [] as ToastData[],

  // Achievements
  achievements: [] as Achievement[],

  // Weather
  weather: {
    current: 'sunny',
    duration: 120,
    nextChange: 8 * 60 + 120,
    forecast: 'rainy',
  } as WeatherState,

  // Radio Messages
  radioMessages: [] as RadioMessage[],
  radioMessageIdCounter: 1,

  // Logs
  logs: [] as LogEntry[],
  logCounter: 1,

  // Protocol
  protocolEntries: [] as ProtocolEntry[],
  showProtocolPanel: false,
};

// ============================================================================
// CREATE STORE
// ============================================================================

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // ========================================================================
      // GAME CONTROL ACTIONS
      // ========================================================================

      startGame: (stationId: number) => set({
        gameStarted: true,
        selectedStation: stationId,
        isPaused: false,
        // Statistiken beim Spielstart zurücksetzen
        statistics: initialStatistics,
        score: 0,
      }, false, 'startGame'),

      pauseGame: () => set({ isPaused: true }, false, 'pauseGame'),

      resumeGame: () => set({ isPaused: false }, false, 'resumeGame'),

      setGameSpeed: (speed) => {
        console.log(`🎮 Spielgeschwindigkeit geändert: ${get().gameSpeed} → ${speed}`);
        set({ gameSpeed: speed }, false, 'setGameSpeed');
      },

      setGameTime: (time) => {
        if (typeof time === 'function') {
          // Unterstütze Updater-Funktionen: setGameTime(prev => prev + 1)
          set((state) => ({ gameTime: time(state.gameTime) }), false, 'setGameTime');
        } else {
          // Direkter Wert: setGameTime(480)
          set({ gameTime: time }, false, 'setGameTime');
        }
      },

      incrementGameTimeSeconds: () => set((state) => {
        const newSeconds = state.gameTimeSeconds + 1;
        if (newSeconds >= 60) {
          // Minute ist vorbei, erhöhe gameTime und setze Sekunden zurück
          return {
            gameTime: state.gameTime + 1,
            gameTimeSeconds: 0
          };
        }
        return { gameTimeSeconds: newSeconds };
      }, false, 'incrementGameTimeSeconds'),

      setSelectedTime: (hour) => set({
        selectedTime: hour,
        gameTime: hour * 60,
        gameTimeSeconds: 0, // Reset Sekunden
      }, false, 'setSelectedTime'),

      setDifficulty: (difficulty) => set({ difficulty }, false, 'setDifficulty'),

      addScore: (points) => set(
        (state) => ({ score: state.score + points }),
        false,
        'addScore'
      ),

      // ========================================================================
      // VEHICLE ACTIONS
      // ========================================================================

      setVehicles: (vehicles) => set({ vehicles }, false, 'setVehicles'),

      updateVehicle: (id, updates) => set(
        (state) => ({
          vehicles: state.vehicles.map(v =>
            v.id === id ? { ...v, ...updates } : v
          )
        }),
        false,
        'updateVehicle'
      ),

      updateVehicleStatus: (id, status) => set(
        (state) => ({
          vehicles: state.vehicles.map(v =>
            v.id === id ? { ...v, status } : v
          )
        }),
        false,
        'updateVehicleStatus'
      ),

      updateVehiclePosition: (id, position, bearing) => set(
        (state) => ({
          vehicles: state.vehicles.map(v =>
            v.id === id
              ? { ...v, position, ...(bearing !== undefined && { bearing }) }
              : v
          )
        }),
        false,
        'updateVehiclePosition'
      ),

      assignVehicleToIncident: (vehicleId, incidentId) => set(
        (state) => ({
          vehicles: state.vehicles.map(v =>
            v.id === vehicleId
              ? { ...v, assignedIncidentId: incidentId, isAvailable: false }
              : v
          ),
          incidents: state.incidents.map(i =>
            i.id === incidentId
              ? { ...i, assignedVehicleIds: [...i.assignedVehicleIds, vehicleId] }
              : i
          )
        }),
        false,
        'assignVehicleToIncident'
      ),

      unassignVehicle: (vehicleId) => set(
        (state) => {
          const vehicle = state.vehicles.find(v => v.id === vehicleId);
          const incidentId = vehicle?.assignedIncidentId;

          return {
            vehicles: state.vehicles.map(v =>
              v.id === vehicleId
                ? { ...v, assignedIncidentId: null, isAvailable: true }
                : v
            ),
            incidents: incidentId
              ? state.incidents.map(i =>
                  i.id === incidentId
                    ? { ...i, assignedVehicleIds: i.assignedVehicleIds.filter(id => id !== vehicleId) }
                    : i
                )
              : state.incidents
          };
        },
        false,
        'unassignVehicle'
      ),

      // ========================================================================
      // INCIDENT ACTIONS
      // ========================================================================

      setIncidents: (incidents) => set({ incidents }, false, 'setIncidents'),

      addIncident: (incident) => set(
        (state) => ({
          incidents: [...state.incidents, incident]
        }),
        false,
        'addIncident'
      ),

      updateIncident: (id, updates) => set(
        (state) => ({
          incidents: state.incidents.map(i =>
            i.id === id ? { ...i, ...updates } : i
          )
        }),
        false,
        'updateIncident'
      ),

      removeIncident: (id) => set(
        (state) => ({
          incidents: state.incidents.filter(i => i.id !== id)
        }),
        false,
        'removeIncident'
      ),

      incrementIncidentCounter: () => {
        const current = get().incidentCounter;
        set({ incidentCounter: current + 1 }, false, 'incrementIncidentCounter');
        return current;
      },

      // ========================================================================
      // CALL ACTIONS
      // ========================================================================

      setCalls: (calls) => set({ calls }, false, 'setCalls'),

      addCall: (call) => set(
        (state) => ({
          calls: [...state.calls, call]
        }),
        false,
        'addCall'
      ),

      updateCall: (id, updates) => set(
        (state) => ({
          calls: state.calls.map(c =>
            c.id === id ? { ...c, ...updates } : c
          )
        }),
        false,
        'updateCall'
      ),

      removeCall: (id) => set(
        (state) => ({
          calls: state.calls.filter(c => c.id !== id)
        }),
        false,
        'removeCall'
      ),

      incrementCallCounter: () => {
        const current = get().callIdCounter;
        set({ callIdCounter: current + 1 }, false, 'incrementCallCounter');
        return current;
      },

      // ========================================================================
      // STATION ACTIONS
      // ========================================================================

      setStations: (stations) => set({ stations }, false, 'setStations'),

      // ========================================================================
      // UI ACTIONS
      // ========================================================================

      setSelectedStation: (stationId) => set({ selectedStation: stationId }, false, 'setSelectedStation'),

      openCallModal: (call) => set({
        selectedCall: call,
        isCallModalOpen: true
      }, false, 'openCallModal'),

      closeCallModal: () => set({
        selectedCall: null,
        isCallModalOpen: false
      }, false, 'closeCallModal'),

      openBackupModal: (incident) => set({
        selectedIncidentForBackup: incident,
        isBackupModalOpen: true
      }, false, 'openBackupModal'),

      closeBackupModal: () => set({
        selectedIncidentForBackup: null,
        isBackupModalOpen: false
      }, false, 'closeBackupModal'),

      openSpeakRequestModal: (vehicle) => set({
        selectedSpeakRequestVehicle: vehicle,
        isSpeakRequestModalOpen: true
      }, false, 'openSpeakRequestModal'),

      closeSpeakRequestModal: () => set({
        selectedSpeakRequestVehicle: null,
        isSpeakRequestModalOpen: false
      }, false, 'closeSpeakRequestModal'),

      toggleTimeDropdown: () => set(
        (state) => ({ isTimeDropdownOpen: !state.isTimeDropdownOpen }),
        false,
        'toggleTimeDropdown'
      ),

      openStatsModal: () => set({ showStatsModal: true }, false, 'openStatsModal'),

      closeStatsModal: () => set({ showStatsModal: false }, false, 'closeStatsModal'),

      toggleBlaulicht: () => set(
        (state) => ({ blaulichtOn: !state.blaulichtOn }),
        false,
        'toggleBlaulicht'
      ),

      // ========================================================================
      // MAP ACTIONS
      // ========================================================================

      setMapCenter: (center) => set({ mapCenter: center }, false, 'setMapCenter'),

      setMapZoom: (zoom) => set({ mapZoom: zoom }, false, 'setMapZoom'),

      // ========================================================================
      // STATISTICS ACTIONS
      // ========================================================================

      updateStatistics: (updates) => set(
        (state) => ({
          statistics: { ...state.statistics, ...updates }
        }),
        false,
        'updateStatistics'
      ),

      incrementStat: (key, amount = 1) => set(
        (state) => ({
          statistics: {
            ...state.statistics,
            [key]: (state.statistics[key] as number) + amount
          }
        }),
        false,
        'incrementStat'
      ),

      // ========================================================================
      // TOAST ACTIONS
      // ========================================================================

      addToast: (toast) => {
        const id = get().toastCounter;
        set(
          (state) => ({
            toasts: [...state.toasts, { ...toast, id }],
            toastCounter: state.toastCounter + 1
          }),
          false,
          'addToast'
        );
      },

      removeToast: (id) => set(
        (state) => ({
          toasts: state.toasts.filter(t => t.id !== id)
        }),
        false,
        'removeToast'
      ),

      // ========================================================================
      // ACHIEVEMENT ACTIONS
      // ========================================================================

      unlockAchievement: (achievementId) => set(
        (state) => ({
          achievements: state.achievements.map(a =>
            a.id === achievementId ? { ...a, unlocked: true } : a
          )
        }),
        false,
        'unlockAchievement'
      ),

      // ========================================================================
      // WEATHER ACTIONS
      // ========================================================================

      setWeather: (weather) => set({ weather }, false, 'setWeather'),

      updateWeather: (updates) => set(
        (state) => ({
          weather: { ...state.weather, ...updates }
        }),
        false,
        'updateWeather'
      ),

      // ========================================================================
      // RADIO MESSAGE ACTIONS
      // ========================================================================

      addRadioMessage: (message) => {
        const id = get().radioMessageIdCounter;
        set(
          (state) => ({
            radioMessages: [...state.radioMessages, { ...message, id }],
            radioMessageIdCounter: state.radioMessageIdCounter + 1
          }),
          false,
          'addRadioMessage'
        );
      },

      clearRadioMessages: () => set(
        { radioMessages: [] },
        false,
        'clearRadioMessages'
      ),

      // ========================================================================
      // LOG ACTIONS
      // ========================================================================

      addLog: (message, type, timestamp = '00:00:00') => {
        const id = get().logCounter;
        set(
          (state) => ({
            logs: [...state.logs, { id, message, type, timestamp }],
            logCounter: state.logCounter + 1
          }),
          false,
          'addLog'
        );
      },

      clearLogs: () => set(
        { logs: [] },
        false,
        'clearLogs'
      ),

      // ========================================================================
      // PROTOCOL ACTIONS
      // ========================================================================

      addProtocolEntry: (entry) => {
        const id = get().protocolEntries.length + 1;
        const realTimestamp = Date.now();
        // timestamp wird vom Aufrufer bereitgestellt (Spielzeit im Format HH:MM:SS)
        set(
          (state) => ({
            protocolEntries: [...state.protocolEntries, { ...entry, id, realTimestamp }]
          }),
          false,
          'addProtocolEntry'
        );
      },

      clearProtocolEntries: () => set(
        { protocolEntries: [] },
        false,
        'clearProtocolEntries'
      ),

      setShowProtocolPanel: (show) => set(
        { showProtocolPanel: show },
        false,
        'setShowProtocolPanel'
      ),

      // ========================================================================
      // RESET
      // ========================================================================

      resetGame: () => set(initialState, false, 'resetGame'),
    }),
    { name: 'GameStore' }
  )
);

// ============================================================================
// SELECTORS (für optimierte Performance)
// ============================================================================

// Nur Vehicles State
export const useVehicles = () => useGameStore((state) => state.vehicles);
export const useVehicle = (id: number) => useGameStore((state) =>
  state.vehicles.find(v => v.id === id)
);

// Nur Incidents State
export const useIncidents = () => useGameStore((state) => state.incidents);
export const useIncident = (id: number) => useGameStore((state) =>
  state.incidents.find(i => i.id === id)
);

// Nur Calls State
export const useCalls = () => useGameStore((state) => state.calls);

// Nur Game State
export const useGameState = () => useGameStore((state) => ({
  gameStarted: state.gameStarted,
  gameTime: state.gameTime,
  gameSpeed: state.gameSpeed,
  isPaused: state.isPaused,
  score: state.score,
}));

// Nur Statistics
export const useStatistics = () => useGameStore((state) => state.statistics);

// Nur UI State
export const useUIState = () => useGameStore((state) => ({
  selectedStation: state.selectedStation,
  isCallModalOpen: state.isCallModalOpen,
  isBackupModalOpen: state.isBackupModalOpen,
  isSpeakRequestModalOpen: state.isSpeakRequestModalOpen,
  showStatsModal: state.showStatsModal,
}));
