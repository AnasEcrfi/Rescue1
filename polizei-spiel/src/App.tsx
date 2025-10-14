import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import { getRoute, convertToLeafletFormat, getPointAlongRoute, getStraightLineRoute, calculateDistance } from './services/routingService';
import StatisticsModal, { type Statistics } from './components/StatisticsModal';
import { type ToastData } from './components/Toast';
import type { LogEntry, LogEntryType } from './types/logs';
// import { soundManager } from './utils/soundEffects'; // Nicht mehr verwendet
import { htmlAudioManager } from './utils/htmlAudioManager';
import { realisticSoundManager } from './utils/realisticSoundManager';
import type { VehicleStatus, VehicleType, Vehicle, Call, Incident, Achievement } from './types';
import { vehicleTypeConfigs } from './constants/vehicleTypes';
import { frankfurtLocations } from './constants/locations';
import { incidentTypes, incidentProcessingTimes, escalationRules } from './constants/incidents';
import { getWeightedIncidentType, calculateMinETA, createIncidentIcon, calculateRealisticRouteDuration } from './utils/gameLogic';
import { getRandomCallText, generateCallbackNumber } from './constants/callTexts';
import { getRandomPOI, getPOICategoryForIncident } from './constants/frankfurtPOIs';
import { getRealisticCallText } from './constants/realisticCallTexts';
import { getAddressForLocation } from './constants/addresses';
import { speakRequestMessages, type SpeakRequestReason } from './constants/radioMessages';
import { incidentReports, getRandomReport, hasBackupRequest, getBackupRequest } from './constants/incidentReports';
import CallModal from './components/CallModal';
import BackupModal from './components/BackupModal';
import SpeakRequestModal from './components/SpeakRequestModal';
import PatrolAreaSelector from './components/PatrolAreaSelector';
import GameSettings from './components/GameSettings';
import ProtocolPanel from './components/ProtocolPanel';
import { CompactErrorBoundary } from './components/ErrorBoundary';
import { protocolLogger } from './utils/protocolLogger';
import type { ProtocolEntry } from './types/protocol';
import WeatherDisplay from './components/WeatherDisplay';
import type { WeatherState } from './types/weather';
import { weatherConditions, getWeatherDuration, getNextWeather, getWeatherOverlayClass } from './constants/weather';
import { calculateFuelConsumption, calculateCrewFatigue, determineOutOfServiceReason, calculateOutOfServiceDuration, updateMaintenanceStatus, resetVehicleAfterService } from './utils/vehicleTimings';
import { shouldTriggerMANV, getRandomMANVScenario, generateInvolvedCount } from './constants/manvScenarios';
import RadioLog, { type RadioMessage } from './components/RadioLog';
import { generateRadioMessage } from './constants/radioMessages';
import { gasStations as fallbackGasStations } from './constants/gasStations';
import { dialogTemplates } from './constants/dialogTemplates';
import { fetchGasStationsFromOSM, fetchPoliceStationsFromOSM } from './services/overpassService';
import { policeStations as fallbackPoliceStations } from './constants/locations';
import { getAutoAssignmentRecommendations } from './utils/smartAssignment';
import { findNearestGasStation, shouldRefuel, calculateRefuelDuration, performShiftChange } from './utils/refuelingSystem';
import { canHelicopterFly } from './constants/weather';
import { useHotkeys } from './hooks/useHotkeys';
import VehicleDetails from './components/VehicleDetails';
import { generateFrankfurtCallsign } from './utils/callsigns';
import { calculateDispatchDelay } from './constants/dispatchTimes';
import { REFUEL_COST, REPAIR_COST_MIN, REPAIR_COST_MAX, CREW_BREAK_COST, SHIFT_CHANGE_COST } from './constants/gameplayConstants';
import { getDisplayPosition } from './utils/vehiclePositioning';
// NEUE HELPER-IMPORTS (Zentralisierung)
import { formatGameTime, getHoursAndMinutes } from './utils/timeHelpers';
import { calculateRoute, usesAirRoute } from './utils/routeCalculator';
import { isVehicleMoving, isVehicleAvailable } from './utils/vehicleHelpers';
import { getIncidentById, getIncidentPriorityText, needsMoreVehicles } from './utils/incidentHelpers';
// 🎮 ZUSTAND STORE IMPORT (Zentrale State Management Migration)
import { useGameStore } from './stores/gameStore';
import type { Difficulty } from './types/game';
// 🚔 PATROL SYSTEM IMPORTS
import type { PatrolRoute, PatrolDiscovery } from './types/patrol';
import { startPatrol, stopPatrol, updatePatrolMovement, checkForDiscovery, calculatePresenceBonus, applyPresenceBonusToSpawnChance, calculatePatrolFuelConsumption, calculatePatrolFatigue, canVehiclePatrol } from './utils/patrolManager';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Types, constants, and helpers are imported from centralized modules
// See: src/types, src/constants, src/utils for definitions

// Local interfaces that are specific to this component
interface VehicleMarkerProps {
  position: [number, number];
  bearing: number;
  status: VehicleStatus;
  vehicle: Vehicle;
  hasSpecialRights: boolean; // Ob der Einsatz mit Sonderrechten ist
  onHover?: () => void;
  onHoverEnd?: () => void;
  onClick?: () => void;
}

// type Difficulty = 'Leicht' | 'Mittel' | 'Schwer'; // ← Moved to src/types/game.ts (jetzt aus Store importiert)

// Modern police station marker - Hessischer Polizeistern
// WICHTIG: Als Konstante definieren, damit es nicht bei jedem Render neu erstellt wird
const STATION_ICON = L.divIcon({
  className: 'station-marker',
  html: `
    <div class="station-marker-container">
      <div style="width: 48px; height: 48px; background: rgba(48, 209, 88, 0.15); border-radius: 50%; display: flex; align-items: center; justify-content: center;">
        <img src="/polizeistern-hessen.svg" alt="Polizeiwache" width="36" height="36" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));" />
      </div>
    </div>
  `,
  iconSize: [48, 48],
  iconAnchor: [24, 24],
});

// Gas Station Icon with Brand - Cache für bessere Performance
const gasStationIconCache = new Map<string, L.DivIcon>();

const createGasStationIcon = (brand: string) => {
  // Prüfe ob Icon bereits im Cache ist
  if (gasStationIconCache.has(brand)) {
    return gasStationIconCache.get(brand)!;
  }

  const brandClass = brand.toLowerCase().replace(/[^a-z0-9]/g, '');

  // Known brands with custom CSS styles
  const knownBrands = [
    'aral', 'shell', 'esso', 'total', 'totalenergies', 'jet', 'omv',
    'agip', 'eni', 'avia', 'hem', 'tamoil', 'star', 'orlen', 'bft',
    'baywa', 'westfalen', 'classic', 'ed', 'raiffeisen', 'hoyer',
    'oil', 'markant', 'sprint', 'elan', 'tankpool24', 'tankpool',
    'famila', 'unknown', 'freie', 'keine', 'sonstige'
  ];

  // Check if brand has a custom style, otherwise generate initials
  const hasCustomStyle = knownBrands.includes(brandClass);

  let icon: L.DivIcon;

  if (hasCustomStyle) {
    icon = L.divIcon({
      className: 'gas-station-marker',
      html: `
        <div class="gas-station-marker-container">
          <div class="gas-station-icon gas-station-${brandClass}"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  } else {
    // Generate initials from brand name
    const words = brand.split(/[\s-_]+/).filter(w => w.length > 0);
    let initials = '';

    if (words.length === 1) {
      // Single word: take first 2-3 characters
      initials = words[0].substring(0, Math.min(3, words[0].length)).toUpperCase();
    } else {
      // Multiple words: take first letter of each word (max 3)
      initials = words.slice(0, 3).map(w => w[0]).join('').toUpperCase();
    }

    icon = L.divIcon({
      className: 'gas-station-marker',
      html: `
        <div class="gas-station-marker-container">
          <div class="gas-station-icon gas-station-generic" data-initials="${initials}"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  // Cache das Icon für zukünftige Verwendung
  gasStationIconCache.set(brand, icon);
  return icon;
};

// Map center updater component
const MapCenterUpdater: React.FC<{ center: [number, number]; zoom?: number }> = ({ center, zoom = 16 }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 0.5 });
  }, [center, zoom, map]);
  return null;
};

// VehicleMarker component with independent Blaulicht animation
const VehicleMarker: React.FC<VehicleMarkerProps> = ({ position, status, vehicle, hasSpecialRights, onHover, onHoverEnd, onClick }) => {
  const [blaulichtOn, setBlaulichtOn] = useState(false);
  const markerRef = useRef<L.Marker>(null);

  // ECE-R65 / DIN 14620 compliant Blaulicht pattern - only for this vehicle
  useEffect(() => {
    // Only animate if vehicle is on mission (S3 or S4) AND has special rights
    if (!hasSpecialRights || (status !== 'S3' && status !== 'S4')) {
      setBlaulichtOn(false);
      return;
    }

    let step = 0;
    const pattern = [
      { duration: 80, state: true },   // First flash
      { duration: 80, state: false },  // Short pause between flashes
      { duration: 80, state: true },   // Second flash (Doppelblitz)
      { duration: 260, state: false }, // Pause until next group (~500ms total)
    ];

    const runPattern = () => {
      setBlaulichtOn(pattern[step].state);
      setTimeout(() => {
        step = (step + 1) % pattern.length;
        runPattern();
      }, pattern[step].duration);
    };

    runPattern();
  }, [status]);

  // Determine which CSS class to use based on status and blaulicht state
  const isBlaulichtActive = (status === 'S3' || status === 'S4') && blaulichtOn;
  const vehicleClass = isBlaulichtActive ? 'vehicle-icon-blaulicht-on' : 'vehicle-icon-blaulicht-off';

  // Status colors for label
  const statusColors: Record<VehicleStatus, string> = {
    'S1': '#30D158',  // Grün - Bereit
    'S2': '#FFD60A',  // Gelb - Alarmiert
    'S3': '#FF9F0A',  // Orange - Anfahrt
    'S4': '#FF453A',  // Rot - Am Einsatzort
    'S5': '#0A84FF',  // Blau - Sprechwunsch
    'S6': '#8E8E93',  // Grau - Nicht einsatzbereit
    'S7': '#FFD60A',  // Gelb - Tanken
    'S8': '#0A84FF',  // Blau - Rückfahrt
  };

  const statusColor = statusColors[status];

  const icon = L.divIcon({
    className: 'vehicle-marker',
    html: `
      <div class="vehicle-marker-container">
        <div class="${vehicleClass}"></div>
        <div class="vehicle-label">
          <span class="vehicle-label-status" style="background: ${statusColor};">${status}</span>
          <span class="vehicle-label-callsign">${vehicle.callsign}</span>
        </div>
      </div>
    `,
    iconSize: [64, 80],
    iconAnchor: [32, 40],
  });

  const statusLabels: Record<VehicleStatus, string> = {
    'S1': 'Bereit',
    'S2': 'Alarmiert',
    'S3': 'Anfahrt',
    'S4': 'Am Einsatzort',
    'S5': 'Sprechwunsch',
    'S6': 'Außer Dienst',
    'S7': 'Tanken',
    'S8': 'Rückfahrt'
  };

  // Bind Leaflet events for hover and click
  useEffect(() => {
    const marker = markerRef.current;
    if (!marker) return;

    const handleMouseOver = () => {
      if (onHover) onHover();
    };

    const handleMouseOut = () => {
      if (onHoverEnd) onHoverEnd();
    };

    const handleClick = (e?: Event) => {
      if (onClick) {
        onClick();
      }
    };

    // Leaflet-Events für den Marker
    marker.on('mouseover', handleMouseOver);
    marker.on('mouseout', handleMouseOut);
    marker.on('click', handleClick);

    // Zusätzlich: DOM-Events direkt auf das Icon-Element binden (zuverlässiger!)
    const iconElement = marker.getElement();
    if (iconElement) {
      iconElement.addEventListener('mouseenter', handleMouseOver);
      iconElement.addEventListener('mouseleave', handleMouseOut);
      iconElement.addEventListener('click', handleClick);
    }

    return () => {
      marker.off('mouseover', handleMouseOver);
      marker.off('mouseout', handleMouseOut);
      marker.off('click', handleClick);

      const iconElement = marker.getElement();
      if (iconElement) {
        iconElement.removeEventListener('mouseenter', handleMouseOver);
        iconElement.removeEventListener('mouseleave', handleMouseOut);
        iconElement.removeEventListener('click', handleClick);
      }
    };
  }, [vehicle.id]); // ✅ NUR vehicle.id als Dependency!

  return (
    <Marker ref={markerRef} position={position} icon={icon}>
      <Popup>
        <strong>Fahrzeug S-{vehicle.id.toString().padStart(2, '0')}</strong><br />
        Status: {statusLabels[status]}
      </Popup>
    </Marker>
  );
};

// Achievement definitions
const achievementDefinitions = [
  {
    id: 'first_response',
    title: 'Erster Einsatz',
    description: 'Schließe deinen ersten Einsatz erfolgreich ab',
    icon: '🎖️',
    condition: (stats: Statistics) => stats.totalResolved >= 1,
  },
  {
    id: 'century',
    title: 'Jahrhundert',
    description: 'Schließe 100 Einsätze erfolgreich ab',
    icon: '🏆',
    condition: (stats: Statistics) => stats.totalResolved >= 100,
  },
  {
    id: 'streak_10',
    title: 'Im Flow',
    description: 'Erreiche eine Serie von 10 erfolgreichen Einsätzen',
    icon: '🔥',
    condition: (stats: Statistics) => stats.currentStreak >= 10,
  },
  {
    id: 'speed_demon',
    title: 'Blitzschnell',
    description: 'Durchschnittliche Reaktionszeit unter 60 Sekunden',
    icon: '⚡',
    condition: (stats: Statistics) => {
      if (stats.totalResponseTimes.length === 0) return false;
      const avg = stats.totalResponseTimes.reduce((a, b) => a + b, 0) / stats.totalResponseTimes.length;
      return avg < 60;
    },
  },
  {
    id: 'perfect_shift',
    title: 'Perfekte Schicht',
    description: 'Keine fehlgeschlagenen Einsätze in einer Schicht mit 20+ Einsätzen',
    icon: '💎',
    condition: (stats: Statistics) => stats.totalResolved >= 20 && stats.totalFailed === 0,
  },
];

// LocalStorage keys
const STORAGE_KEYS = {
  ACHIEVEMENTS: 'polizei_achievements',
  STATS: 'polizei_stats',
  HIGH_SCORE: 'polizei_high_score',
};

function App() {
  // 🎮 ZUSTAND STORE - Zentrale State Management (ersetzt 26+ useState Hooks!)
  const {
    // Game State
    gameStarted,
    selectedStation,
    score,
    selectedTime,
    gameTime,
    gameTimeSeconds,
    difficulty,
    gameSpeed,
    isPaused,
    // Entities
    vehicles,
    incidents,
    calls,
    stations,
    // UI State
    selectedCall,
    isCallModalOpen,
    selectedIncidentForBackup,
    isBackupModalOpen,
    selectedSpeakRequestVehicle,
    isSpeakRequestModalOpen,
    mapCenter,
    mapZoom,
    isTimeDropdownOpen,
    showStatsModal,
    blaulichtOn,
    // Statistics
    statistics,
    // Toasts & Achievements
    toasts,
    achievements,
    // Weather
    weather,
    // Radio Messages
    radioMessages,
    // Logs
    logs,
    logCounter,
    // Protocol
    protocolEntries,
    showProtocolPanel,
    // Actions (mit Store- Präfix um Konflikte zu vermeiden)
    setVehicles: storeSetVehicles,
    updateVehicle,
    updateVehicleStatus,
    updateVehiclePosition,
    assignVehicleToIncident,
    unassignVehicle,
    setIncidents: storeSetIncidents,
    addIncident,
    updateIncident,
    removeIncident,
    incrementIncidentCounter,
    setCalls: storeSetCalls,
    addCall,
    updateCall,
    removeCall,
    incrementCallCounter,
    setStations,
    setSelectedStation,
    openCallModal: storeOpenCallModal,
    closeCallModal: storeCloseCallModal,
    openBackupModal: storeOpenBackupModal,
    closeBackupModal: storeCloseBackupModal,
    openSpeakRequestModal: storeOpenSpeakRequestModal,
    closeSpeakRequestModal: storeCloseSpeakRequestModal,
    toggleTimeDropdown,
    openStatsModal: storeOpenStatsModal,
    closeStatsModal: storeCloseStatsModal,
    startGame: storeStartGame,
    pauseGame,
    resumeGame,
    setGameSpeed: setGameSpeedAction,
    setGameTime,
    incrementGameTimeSeconds,
    setSelectedTime: setSelectedTimeAction,
    setDifficulty,
    addScore,
    setMapCenter,
    setMapZoom,
    updateStatistics,
    incrementStat,
    addToast,
    removeToast,
    unlockAchievement,
    toggleBlaulicht,
    // Weather Actions
    setWeather,
    updateWeather,
    // Radio Message Actions
    addRadioMessage: storeAddRadioMessage,
    clearRadioMessages,
    // Log Actions
    addLog: storeAddLog,
    clearLogs,
    // Protocol Actions
    addProtocolEntry,
    clearProtocolEntries,
    setShowProtocolPanel,
  } = useGameStore();

  // 🔄 ALIASES für Kompatibilität mit bestehendem Code
  const setIsTimeDropdownOpen = (open: boolean) => open ? toggleTimeDropdown() : null;
  const setIsPaused = (paused: boolean) => paused ? pauseGame() : resumeGame();
  const setGameSpeed = setGameSpeedAction;
  const setSelectedTime = setSelectedTimeAction;
  const setShowStatsModal = (show: boolean) => show ? storeOpenStatsModal() : storeCloseStatsModal();
  const setIsCallModalOpen = (open: boolean) => !open && storeCloseCallModal();
  const setSelectedCall = (call: Call | null) => call && storeOpenCallModal(call);
  const setIsBackupModalOpen = (open: boolean) => !open && storeCloseBackupModal();
  const setSelectedIncidentForBackup = (incident: Incident | null) => incident && storeOpenBackupModal(incident);
  const setIsSpeakRequestModalOpen = (open: boolean) => !open && storeCloseSpeakRequestModal();
  const setSelectedSpeakRequestVehicle = (vehicle: Vehicle | null) => vehicle && storeOpenSpeakRequestModal(vehicle);
  const setGameStarted = (started: boolean) => {
    if (started) {
      setSelectedStation(selectedStation);
      useGameStore.setState({ gameStarted: true });
    } else {
      useGameStore.setState({ gameStarted: false });
    }
  };

  // 🔄 Wrapper für useState-kompatible Setter (unterstützen Callbacks)
  const setVehicles = (value: Vehicle[] | ((prev: Vehicle[]) => Vehicle[])) => {
    if (typeof value === 'function') {
      const newVehicles = value(useGameStore.getState().vehicles);
      storeSetVehicles(newVehicles);
    } else {
      storeSetVehicles(value);
    }
  };

  const setIncidents = (value: Incident[] | ((prev: Incident[]) => Incident[])) => {
    if (typeof value === 'function') {
      const newIncidents = value(useGameStore.getState().incidents);
      storeSetIncidents(newIncidents);
    } else {
      storeSetIncidents(value);
    }
  };

  const setCalls = (value: Call[] | ((prev: Call[]) => Call[])) => {
    if (typeof value === 'function') {
      const newCalls = value(useGameStore.getState().calls);
      storeSetCalls(newCalls);
    } else {
      storeSetCalls(value);
    }
  };

  const setAchievements = (achievements: Achievement[] | ((prev: Achievement[]) => Achievement[])) => {
    // Achievements werden direkt im Store gesetzt, hier nur für Kompatibilität
    if (typeof achievements === 'function') {
      useGameStore.setState((state) => ({ achievements: achievements(state.achievements) }));
    } else {
      useGameStore.setState({ achievements });
    }
  };
  const setStatistics = (stats: typeof statistics | ((prev: typeof statistics) => typeof statistics)) => {
    if (typeof stats === 'function') {
      useGameStore.setState((state) => ({ statistics: stats(state.statistics) }));
    } else {
      useGameStore.setState({ statistics: stats });
    }
  };
  const setToasts = (toasts: ToastData[] | ((prev: ToastData[]) => ToastData[])) => {
    if (typeof toasts === 'function') {
      useGameStore.setState((state) => ({ toasts: toasts(state.toasts) }));
    } else {
      useGameStore.setState({ toasts });
    }
  };

  // 📝 LOCAL STATE (nicht im Store - komponenten-spezifisch)
  const [toastCounter, setToastCounter] = useState(1);
  const [showAchievementToast, setShowAchievementToast] = useState<Achievement | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [hoveredVehicleId, setHoveredVehicleId] = useState<number | null>(null);
  const [vehicleFilter, setVehicleFilter] = useState<VehicleStatus | 'all'>('all');
  const [incidentFilter, setIncidentFilter] = useState<'all' | 'active' | 'completed' | 'failed'>('all');
  const [patrolModalVehicleId, setPatrolModalVehicleId] = useState<number | null>(null);

  // 🎯 Auto-Scroll zum ausgewählten Fahrzeug in der Liste + Details
  useEffect(() => {
    if (selectedVehicleId !== null) {
      // Warte kurz, damit das DOM aktualisiert wird
      setTimeout(() => {
        // Scrolle zuerst zum Fahrzeug in der Liste
        const listElement = document.getElementById(`vehicle-list-item-${selectedVehicleId}`);
        if (listElement) {
          listElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Dann scrolle auch zur VehicleDetails-Komponente (falls sie außerhalb ist)
        setTimeout(() => {
          const detailsElement = document.querySelector('.vehicle-details-panel');
          if (detailsElement) {
            detailsElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 300); // Kurze Verzögerung für smoothes Scrolling
      }, 50);
    }
  }, [selectedVehicleId]);
  const [showGameSettings, setShowGameSettings] = useState(false);

  // Map Legende - Toggle für Icons
  const [showPoliceStations, setShowPoliceStations] = useState(true);
  const [showGasStations, setShowGasStations] = useState(true);

  // Gas Stations from OpenStreetMap (lokaler State - wird nicht mit Store synchronisiert)
  const [gasStations, setGasStations] = useState<Array<{id: number; name: string; brand: string; position: [number, number]}>>([]);

  // Police Stations - WICHTIG: Lokaler State verwenden, damit sie beim Spielstart nicht verloren gehen
  // Der Store sollte diese nicht verwalten, da sie während des gesamten App-Lebenszyklus konstant bleiben
  const [policeStations, setPoliceStations] = useState<Array<{id: number; name: string; position: [number, number]}>>([]);

  // RadioLog System - verwende Store
  const setRadioMessages = (messages: RadioMessage[] | ((prev: RadioMessage[]) => RadioMessage[])) => {
    if (typeof messages === 'function') {
      const newMessages = messages(useGameStore.getState().radioMessages);
      useGameStore.setState({ radioMessages: newMessages });
    } else {
      useGameStore.setState({ radioMessages: messages });
    }
  };

  // Logs - verwende Store (alias für Kompatibilität)
  const _logs = logs;
  const setLogs = (newLogs: LogEntry[] | ((prev: LogEntry[]) => LogEntry[])) => {
    if (typeof newLogs === 'function') {
      const updated = newLogs(useGameStore.getState().logs);
      useGameStore.setState({ logs: updated });
    } else {
      useGameStore.setState({ logs: newLogs });
    }
  };

  // Protocol - verwende Store
  const setProtocolEntries = (entries: ProtocolEntry[] | ((prev: ProtocolEntry[]) => ProtocolEntry[])) => {
    if (typeof entries === 'function') {
      const updated = entries(useGameStore.getState().protocolEntries);
      useGameStore.setState({ protocolEntries: updated });
    } else {
      useGameStore.setState({ protocolEntries: entries });
    }
  };

  // Load gas stations from OpenStreetMap on mount
  useEffect(() => {
    const loadGasStations = async () => {
      const osmStations = await fetchGasStationsFromOSM();
      if (osmStations.length > 0) {
        // Convert OSM format to our format
        const converted = osmStations.map(station => ({
          id: station.id,
          name: station.name,
          brand: station.brand,
          position: [station.lat, station.lon] as [number, number],
        }));
        setGasStations(converted);
        console.log(`✓ Loaded ${converted.length} gas stations from OpenStreetMap`);
      } else {
        // Fallback to static data
        setGasStations(fallbackGasStations);
        console.log('⚠ Using fallback gas station data');
      }
    };
    loadGasStations();
  }, []);

  // Load police stations from OpenStreetMap on mount
  useEffect(() => {
    const loadPoliceStations = async () => {
      // Nur einmal beim Mount laden
      if (policeStations.length > 0) {
        console.log(`✓ Police stations already loaded (${policeStations.length} stations)`);
        return;
      }

      const osmStations = await fetchPoliceStationsFromOSM();
      if (osmStations.length > 0) {
        // Convert OSM format to our format
        const converted = osmStations.map(station => ({
          id: station.id,
          name: station.name,
          position: [station.lat, station.lon] as [number, number],
        }));
        setPoliceStations(converted);
        console.log(`✓ Loaded ${converted.length} police stations from OpenStreetMap`);
      } else {
        // Fallback to static data
        setPoliceStations(fallbackPoliceStations);
        console.log('⚠ Using fallback police station data');
      }
    };
    loadPoliceStations();
  }, []); // Nur einmal beim Mount laden


  // Load saved data on mount (mit Error Handling für LocalStorage)
  useEffect(() => {
    try {
      const savedAchievements = localStorage.getItem(STORAGE_KEYS.ACHIEVEMENTS);
      if (savedAchievements) {
        setAchievements(JSON.parse(savedAchievements));
      } else {
        setAchievements(achievementDefinitions.map(a => ({ ...a, unlocked: false })));
      }

      // Statistiken werden NICHT aus LocalStorage geladen - sie sind nur für die aktuelle Sitzung
      // Entferne alte gespeicherte Statistiken falls vorhanden
      localStorage.removeItem(STORAGE_KEYS.STATS);
    } catch (error) {
      console.error('Fehler beim Laden der gespeicherten Daten:', error);
      // Fallback: Neue Achievements initialisieren
      setAchievements(achievementDefinitions.map(a => ({ ...a, unlocked: false })));
    }
  }, []);

  // Save data whenever it changes (mit Error Handling für LocalStorage)
  // Statistiken werden NICHT gespeichert - nur Achievements und HighScore
  useEffect(() => {
    if (gameStarted) {
      try {
        localStorage.setItem(STORAGE_KEYS.ACHIEVEMENTS, JSON.stringify(achievements));
        if (score > 0) {
          const highScore = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
          if (!highScore || score > parseInt(highScore)) {
            localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
          }
        }
      } catch (error) {
        console.error('Fehler beim Speichern der Daten:', error);
      }
    }
  }, [achievements, score, gameStarted]);

  // Check for new achievements
  useEffect(() => {
    achievements.forEach((achievement, index) => {
      if (!achievement.unlocked) {
        const def = achievementDefinitions.find(a => a.id === achievement.id);
        if (def && def.condition(statistics)) {
          const newAchievements = [...achievements];
          newAchievements[index] = { ...achievement, unlocked: true };
          setAchievements(newAchievements);
          setShowAchievementToast(newAchievements[index]);
          htmlAudioManager.playSuccessChime();
          setTimeout(() => setShowAchievementToast(null), 5000 / gameSpeed); // 🎮
        }
      }
    });
  }, [statistics, achievements]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isTimeDropdownOpen && !target.closest('.custom-dropdown')) {
        setIsTimeDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isTimeDropdownOpen]);

  // Keyboard Shortcuts (LST-SIM Style)
  useEffect(() => {
    if (!gameStarted) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignoriere Tastatureingaben in Input-Feldern
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      switch (event.key.toLowerCase()) {
        case 'l':
          setShowProtocolPanel(prev => !prev);
          break;
        case 'p':
        case 'pause':
          setIsPaused(prev => !prev);
          break;
        case 'y':
          setGameSpeed(1);
          setIsPaused(false);
          break;
        case 'x':
          setGameSpeed(4);
          setIsPaused(false);
          break;
        case 'escape':
          if (showProtocolPanel) setShowProtocolPanel(false);
          if (showStatsModal) setShowStatsModal(false);
          if (isCallModalOpen) setIsCallModalOpen(false);
          if (showGameSettings) setShowGameSettings(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, showProtocolPanel, showStatsModal, isCallModalOpen, showGameSettings]);

  // Helper function to add log entry (nun mit protocolLogger)
  const addLog = (
    message: string,
    type: LogEntryType,
    options?: {
      vehicleId?: number;
      incidentId?: number;
      priority?: 'low' | 'medium' | 'high';
      location?: string;
      statusFrom?: VehicleStatus;
      statusTo?: VehicleStatus;
    }
  ) => {
    // Timestamp mit zentralisiertem Helper
    const timestamp = formatGameTime(gameTime);

    // Verwende Store addLog für das Log-System mit Timestamp
    storeAddLog(message, type, timestamp);

    // Trim to last 50 logs
    if (logs.length > 50) {
      setLogs(logs.slice(-50));
    }

    // Neues Protocol-System
    const mapTypeToProtocol = (logType: LogEntryType): 'call' | 'assignment' | 'status' | 'radio' | 'completion' | 'failed' | 'system' | 'escalation' => {
      const mapping: { [key in LogEntryType]: 'call' | 'assignment' | 'status' | 'radio' | 'completion' | 'failed' | 'system' | 'escalation' } = {
        new: 'call',
        assignment: 'assignment',
        arrival: 'status',
        completion: 'completion',
        failed: 'failed',
        system: 'system',
        escalation: 'escalation',
        call: 'call',
      };
      return mapping[logType] || 'system';
    };

    const vehicleCallsign = options?.vehicleId
      ? `${vehicleTypeConfigs[vehicles.find(v => v.id === options.vehicleId)?.vehicleType || 'Streifenwagen'].displayName} ${options.vehicleId.toString().padStart(2, '0')}`
      : undefined;

    protocolLogger.addEntry(
      mapTypeToProtocol(type),
      message,
      gameTime,
      {
        ...options,
        vehicleCallsign,
      }
    );

    setProtocolEntries(protocolLogger.getEntries());
  };

  // ⚡ Helper function to add radio message (LST-SIM Style)
  const addRadioMessage = (
    vehicleId: number,
    statusFrom: VehicleStatus,
    statusTo: VehicleStatus,
    options?: {
      incidentType?: string;
      location?: string;
      requiresResponse?: boolean;
      customMessage?: string;
    }
  ) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Timestamp mit zentralisiertem Helper
    const timestamp = formatGameTime(gameTime);
    const vehicleCallsign = vehicle.callsign;

    const message = options?.customMessage || generateRadioMessage(
      vehicleCallsign,
      statusFrom,
      statusTo,
      options?.incidentType,
      options?.location
    );

    // Deduplizierung: Prüfe ob exakt dieselbe Nachricht bereits existiert
    const isDuplicate = radioMessages.some(m =>
      m.vehicleId === vehicleId &&
      m.message === message &&
      m.timestamp === timestamp &&
      m.type === 'incoming'
    );

    if (isDuplicate) {
      return; // Ignoriere Duplikat
    }

    // 📡 Authentischer PTT-Sound bei jeder Funkmeldung
    realisticSoundManager.playPTTPress();
    // PTT Release nach 800ms (🎮 mit gameSpeed beschleunigt)
    setTimeout(() => realisticSoundManager.playPTTRelease(), 800 / gameSpeed);

    // Verwende Store-Funktion um Radio Message hinzuzufügen
    storeAddRadioMessage({
      timestamp,
      vehicleCallsign,
      message,
      type: 'incoming',
      requiresResponse: options?.requiresResponse || false,
      vehicleId,
    });

    // Trim to last 50 messages
    if (radioMessages.length > 50) {
      setRadioMessages(radioMessages.slice(-50));
    }
  };

  // ⚡ HOTKEY-SYSTEM Integration
  useHotkeys({
    onEndMission: () => {
      if (selectedVehicleId) {
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (vehicle && vehicle.status === 'S4') {
          // Einsatz sofort beenden
          setVehicles(prev => prev.map(v =>
            v.id === selectedVehicleId ? { ...v, processingStartTime: Date.now() - vehicle.processingDuration * 1000 } : v
          ));
          addLog(`🎮 HOTKEY: Fahrzeug ${selectedVehicleId} - Einsatz beendet`, 'system');
        }
      }
    },
    onReturnToStation: () => {
      if (selectedVehicleId) {
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (vehicle && (vehicle.status === 'S4' || vehicle.status === 'S5')) {
          returnToStation(selectedVehicleId);
          addLog(`🎮 HOTKEY: Fahrzeug ${selectedVehicleId} zurück zur Wache`, 'system');
        }
      }
    },
    onTogglePause: () => {
      setIsPaused(prev => !prev);
    },
    onIncreaseSpeed: () => {
      setGameSpeed(prev => Math.min(4, prev + 1) as 1 | 2 | 3 | 4);
    },
    onDecreaseSpeed: () => {
      setGameSpeed(prev => Math.max(1, prev - 1) as 1 | 2 | 3 | 4);
    },
    onSelectVehicle: (vehicleId) => {
      if (vehicles.find(v => v.id === vehicleId)) {
        setSelectedVehicleId(vehicleId);
        const vehicle = vehicles.find(v => v.id === vehicleId);
        if (vehicle) {
          setMapCenter(vehicle.position);
          setMapZoom(16);
        }
      }
    },
    onClearSelection: () => {
      setSelectedVehicleId(null);
    },
    onShiftChange: () => {
      if (selectedVehicleId) {
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (vehicle && vehicle.status === 'S2' && vehicle.crewFatigue > 60) {
          setVehicles(prev => prev.map(v =>
            v.id === selectedVehicleId ? performShiftChange(v, gameTime) : v
          ));
          setGameTime(t => t + 5); // Schichtwechsel dauert 5 Minuten
          addLog(`👥 Schichtwechsel: Fahrzeug ${selectedVehicleId} - Neue Besatzung, Müdigkeit zurückgesetzt`, 'system');
          addRadioMessage(
            selectedVehicleId,
            vehicle.status,
            'S1',
            {
              customMessage: `Schichtwechsel durchgeführt`,
            }
          );
        } else if (vehicle && vehicle.crewFatigue <= 60) {
          addLog(`ℹ️ Fahrzeug ${selectedVehicleId}: Besatzung ist noch fit (${vehicle.crewFatigue.toFixed(0)}% Müdigkeit)`, 'system');
        } else if (vehicle && vehicle.status !== 'S2') {
          addLog(`⚠️ Fahrzeug ${selectedVehicleId}: Schichtwechsel nur an der Wache möglich (Status ${vehicle.status})`, 'system');
        }
      }
    },
    // 🚔 PATROL HOTKEY
    onTogglePatrol: () => {
      if (selectedVehicleId) {
        const vehicle = vehicles.find(v => v.id === selectedVehicleId);
        if (!vehicle) return;

        if (vehicle.isOnPatrol) {
          // Stop patrol
          handleStopPatrol(selectedVehicleId);
          addLog(`🎮 HOTKEY: Streife beendet für Fahrzeug ${selectedVehicleId}`, 'system');
        } else if (vehicle.status === 'S1' || vehicle.status === 'S2') {
          // Start patrol
          handleStartPatrol(selectedVehicleId);
          addLog(`🎮 HOTKEY: Streife gestartet für Fahrzeug ${selectedVehicleId}`, 'system');
        } else {
          addLog(`⚠️ Fahrzeug ${selectedVehicleId}: Nur im Status S1/S2 kann Streife gestartet werden`, 'system');
        }
      }
    },
  }, gameStarted);

  // Get difficulty settings (lstsim.de style - realistic balance)
  // 🎮 Phase 4: Verwendet jetzt gameplayConstants für besseres Balancing
  const getDifficultySettings = () => {
    switch (difficulty) {
      case 'Leicht':
        return {
          vehicleCount: 6,
          vehicleTypes: ['Streifenwagen', 'Streifenwagen', 'Streifenwagen', 'Streifenwagen', 'SEK', 'Zivilfahrzeug'] as VehicleType[],
          incidentsPerHour: 2.0,  // 2.0 Einsätze pro Stunde (Basis, wird durch Tageszeit modifiziert)
          maxIncidents: 4,
          baseTimeLimit: 90,
          // Multiplikatoren aus gameplayConstants
          incidentFrequencyMultiplier: 0.7,  // 30% weniger Einsätze
          escalationChance: 0.05,            // 5% Eskalations-Chance
          crewFatigueRate: 0.7,              // 30% langsamer müde
          fuelConsumptionRate: 0.9,          // 10% weniger Verbrauch
          backupRequestChance: 0.1,          // 10% Verstärkung
        };
      case 'Schwer':
        return {
          vehicleCount: 4,
          vehicleTypes: ['Streifenwagen', 'Streifenwagen', 'SEK', 'Polizeihubschrauber'] as VehicleType[],
          incidentsPerHour: 4.5,  // 4.5 Einsätze pro Stunde (Basis, wird durch Tageszeit modifiziert)
          maxIncidents: 7,
          baseTimeLimit: 45,
          // Multiplikatoren aus gameplayConstants
          incidentFrequencyMultiplier: 1.3,  // 30% mehr Einsätze
          escalationChance: 0.2,             // 20% Eskalations-Chance
          crewFatigueRate: 1.3,              // 30% schneller müde
          fuelConsumptionRate: 1.2,          // 20% mehr Verbrauch
          backupRequestChance: 0.25,         // 25% Verstärkung
        };
      default: // Mittel
        return {
          vehicleCount: 5,
          vehicleTypes: ['Streifenwagen', 'Streifenwagen', 'Streifenwagen', 'SEK', 'Zivilfahrzeug'] as VehicleType[],
          incidentsPerHour: 3.0,  // 3.0 Einsätze pro Stunde (Basis, wird durch Tageszeit modifiziert)
          maxIncidents: 5,
          baseTimeLimit: 60,
          // Multiplikatoren aus gameplayConstants
          incidentFrequencyMultiplier: 1.0,  // Normale Frequenz
          escalationChance: 0.1,             // 10% Eskalations-Chance
          crewFatigueRate: 1.0,              // Normale Müdigkeit
          fuelConsumptionRate: 1.0,          // Normaler Verbrauch
          backupRequestChance: 0.15,         // 15% Verstärkung
        };
    }
  };

  // Initialize vehicles for selected station
  const startGame = (stationId: number) => {
    const station = policeStations.find(s => s.id === stationId);
    if (!station) return;

    setSelectedStation(stationId);
    setMapCenter(station.position);
    setGameTime(selectedTime * 60);

    const settings = getDifficultySettings();
    const newVehicles: Vehicle[] = [];

    for (let i = 0; i < settings.vehicleCount; i++) {
      const vehicleType = settings.vehicleTypes[i] || 'Streifenwagen';
      const vehicleId = i + 1;
      const callsign = generateFrankfurtCallsign(vehicleId, stationId, vehicleType);

      newVehicles.push({
        id: vehicleId,
        stationId,
        position: station.position,
        assignedIncidentId: null,
        routeIndex: 0,
        route: null,
        routeProgress: 0,
        bearing: 0,
        routeDuration: 0,
        routeStartTime: 0,
        totalDistanceTraveled: 0,
        isAvailable: true,
        status: 'S2', // S2: Frei auf Wache (echtes FMS-System)
        processingStartTime: null,
        processingDuration: 0,
        // NEU: Fahrzeugtyp-spezifische Eigenschaften
        vehicleType: vehicleType,
        callsign: callsign,
        speakRequest: null,
        speakRequestType: undefined,
        outOfServiceReason: null,
        outOfServiceUntil: null,
        canBeRedirected: true, // lstsim.de: S8-Fahrzeuge können umgeleitet werden
        situationReportSent: false,
        dispatchTime: null,
        isPreparingToDepart: false,
        previousStatus: null,
        // Realistische Timings
        fuelLevel: 100,
        crewFatigue: 0,
        maintenanceStatus: 'ok' as const,
        lastRefuelTime: 0,
        lastBreakTime: 0,
        shiftStartTime: gameTime,
        accumulatedTime: 0,
        // 🚔 PATROL SYSTEM
        isOnPatrol: false,
        patrolRoute: null,
        patrolStartTime: null,
        patrolTotalDistance: 0,
        patrolLastDiscoveryCheck: 0,
      });
    }

    setVehicles(newVehicles);
    setGameStarted(true);

    // 🔊 Audio-Systeme aktivieren bei Game-Start (User-Interaktion)
    htmlAudioManager.enable();
    console.log('[GAME] HTML5 Audio-System aktiviert');

    // 🎵 Initialisiere realistischen Sound Manager mit echten Polizei-Sounds
    realisticSoundManager.initialize().then(() => {
      console.log('[GAME] ✓ Realistischer Sound Manager initialisiert');
      // Starte Hintergrund-Funkverkehr (SEHR LEISE UND GEDÄMPFT - man versteht nicht jedes Wort)
      realisticSoundManager.startBackgroundRadioChatter(); // Default: 5% Lautstärke, gedämpft
    }).catch(err => {
      console.error('[GAME] Fehler beim Initialisieren des Sound Managers:', err);
    });

    addLog(`Schicht begonnen in ${station.name}`, 'new');
    // 🎮 SPIELGESCHWINDIGKEIT: Initiale Einsatzgenerierung beschleunigt
    setTimeout(() => generateIncident(), 2000 / gameSpeed);
  };

  // NEW: Generate random call (instead of incident directly) - LST SIM Style mit Gesprächstext
  // ERWEITERT: Nutzt POI-System für realistische Orte und Kontexte
  // MAXIMALE VARIATION: Jeden Spieldurchlauf anders gestalten
  const generateCall = () => {
    const hour = Math.floor(gameTime / 60);

    // 🚔 PRÄSENZ-BONUS: Mehr Streifen = weniger Kriminalität
    // Zähle aktive Streifen
    const activePatrolCount = vehicles.filter(v => v.isOnPatrol && v.patrolRoute).length;
    const presenceBonus = calculatePresenceBonus(activePatrolCount);

    // Prüfe ob Call durch Präsenz verhindert wird
    if (presenceBonus > 0 && Math.random() < presenceBonus) {
      // Call wurde durch Streifenpräsenz verhindert!
      // Log nur bei signifikantem Bonus (>= 10%)
      if (presenceBonus >= 0.1 && Math.random() < 0.1) { // 10% Chance auf Log
        addLog(`🚔 Streifenpräsenz wirkt: Vorfall verhindert durch ${activePatrolCount} Streife(n)`, 'system');
      }
      return; // Kein Call generieren
    }

    // 🎲 ERHÖHTE ZUFÄLLIGKEIT: Manchmal ignoriere Tageszeit-Gewichtung
    const ignoreTimeWeighting = Math.random() < 0.3; // 30% komplett zufällig

    // ⚡ MANV-CHECK: Soll eine Großlage generiert werden?
    const triggerMANV = shouldTriggerMANV(difficulty);

    let incidentType;
    let isMANV = false;
    let manvScenario = null;
    let involvedCount = 0;

    if (triggerMANV) {
      // 🚨 GROSSLAGE generieren!
      manvScenario = getRandomMANVScenario();
      involvedCount = generateInvolvedCount(manvScenario);
      incidentType = {
        type: manvScenario.type,
        description: manvScenario.description,
        priority: manvScenario.priority,
        requiredVehicles: manvScenario.requiredVehicles
      };
      isMANV = true;

    } else if (ignoreTimeWeighting) {
      // Komplett zufälliger Einsatztyp (ohne Tageszeit-Gewichtung)
      incidentType = incidentTypes[Math.floor(Math.random() * incidentTypes.length)];

    } else {
      // Tageszeit-gewichteter Einsatz (inkl. Wetter-Modifikatoren)
      // 🌦️ BUG FIX: Wetter als Parameter übergeben
      incidentType = getWeightedIncidentType(hour, weather.current);

    }

    // 🎲 ERHÖHTE VARIATION: POI-Nutzung variieren (50-90% statt fix 70%)
    const preferredCategory = getPOICategoryForIncident(incidentType.type);
    const poiChance = 0.5 + Math.random() * 0.4; // 50-90% POI-Chance
    const usePOI = preferredCategory && Math.random() < poiChance;

    let location;
    let callerText;
    let callerType: 'witness' | 'victim' | 'resident' | 'business' | 'anonymous' | 'employee';
    let callerName: string | undefined;

    if (usePOI && preferredCategory) {
      // 🎲 Manchmal nutze auch andere POI-Kategorien für Überraschungen
      const useRandomCategory = Math.random() < 0.15; // 15% komplett zufällige Kategorie
      const poi = useRandomCategory ? getRandomPOI() : getRandomPOI(preferredCategory);
      location = { name: poi.name, position: poi.position };



      // Hole POI-spezifischen, extrem realistischen Anrufertext
      const realisticCall = getRealisticCallText(incidentType.type, poi.category, poi.name);

      if (realisticCall) {
        callerText = realisticCall.text;
        callerType = realisticCall.callerType;
        callerName = realisticCall.callerName;
      } else {
        // Fallback zu Standard-Texten
        const fallback = getRandomCallText(incidentType.type);
        callerText = fallback.text;
        callerType = fallback.callerType;
        callerName = fallback.callerName;
      }
    } else {
      // Nutze normale Frankfurt-Locations
      location = frankfurtLocations[Math.floor(Math.random() * frankfurtLocations.length)];
      const callTextData = getRandomCallText(incidentType.type);
      callerText = callTextData.text;
      callerType = callTextData.callerType;
      callerName = callTextData.callerName;
    }

    const hasCallbackNumber = Math.random() < 0.7; // 70% haben Rückrufnummer

    // Bestimme ob es eine Privatadresse ist (residential POI oder kein POI)
    const isPrivateAddress = !usePOI || (preferredCategory === 'residential');
    const address = getAddressForLocation(location.name, isPrivateAddress);

    const newCallId = incrementCallCounter();

    // 🎮 DIALOG-SYSTEM: Prüfe ob Dialog-Template existiert (100% Chance zum Testen)
    const hasDialogTemplate = !isMANV && dialogTemplates[incidentType.type];
    const useDialogMode = hasDialogTemplate && Math.random() < 1.0; // 100% zum Testen - später auf 0.5 ändern

    let newCall: Call;

    if (useDialogMode && hasDialogTemplate) {
      // 🎭 DIALOG-MODUS: Erstelle interaktiven Call
      const template = dialogTemplates[incidentType.type];
      const initialMessage = {
        id: `msg-${Date.now()}-caller-initial`,
        sender: 'caller' as const,
        text: template.initialMessage.text,
        timestamp: Date.now(),
        emotion: template.initialMessage.emotion as any,
      };

      newCall = {
        id: newCallId,
        type: incidentType.type,
        position: [50.1109, 8.6821] as [number, number], // Dummy-Position (Frankfurt Zentrum)
        priority: 'medium' as 'low' | 'medium' | 'high', // Wird später enthüllt
        description: incidentType.description,
        locationName: '???', // Versteckt bis enthüllt
        timestamp: Date.now(),
        answered: false,
        callerText: template.initialMessage.text,
        callerType: template.callerProfile.type as any,
        callerName: template.callerProfile.name,
        callbackNumber: hasCallbackNumber ? generateCallbackNumber() : undefined,
        address: '???', // Versteckt bis enthüllt
        status: 'waiting' as const,
        isMANV: false,
        // 🎭 DIALOG STATE
        dialogState: {
          isActive: true,
          messagesHistory: [initialMessage],
          currentOptions: template.initialOptions,
          revealedInfo: {
            hasLocation: false,
            hasIncidentType: false,
            hasPriority: false,
            hasDescription: false,
          },
          isComplete: false,
        },
        // 🔒 VERSTECKTE DATEN (werden schrittweise enthüllt)
        hiddenData: {
          actualPosition: location.position as [number, number],
          actualLocation: location.name,
          actualAddress: address,
          actualType: incidentType.type,
          actualPriority: incidentType.priority as 'low' | 'medium' | 'high',
          actualDescription: incidentType.description,
        },
      };
    } else {
      // 📞 NORMALER MODUS: Standard-Call wie bisher
      newCall = {
        id: newCallId,
        type: incidentType.type,
        position: location.position as [number, number],
        priority: incidentType.priority as 'low' | 'medium' | 'high',
        description: incidentType.description,
        locationName: location.name,
        timestamp: Date.now(),
        answered: false,
        callerText: isMANV
          ? `GROSSLAGE! ${manvScenario!.type} mit ca. ${involvedCount} Beteiligten! Sofort mehrere Einheiten entsenden!`
          : callerText,
        callerType: isMANV ? 'witness' : callerType,
        callerName,
        callbackNumber: hasCallbackNumber ? generateCallbackNumber() : undefined,
        address,
        status: 'waiting' as const,
        isMANV,
        involvedCount: isMANV ? involvedCount : undefined,
      };
    }

    addCall(newCall);

    setToasts((prev) => [
      ...prev,
      {
        id: toastCounter,
        type: `Anruf: ${incidentType.type}`,
        location: location.name,
        priority: incidentType.priority as 'low' | 'medium' | 'high',
        incidentId: newCallId,
      },
    ]);
    setToastCounter((prev) => prev + 1);

    if (incidentType.priority === 'high') {
      // ⚠️ Authentischer Quattrone-Alarm für kritische Einsätze (sehr leise)
      realisticSoundManager.playNewIncidentAlert();
    } else {
      // Doppelton für normale Einsätze (sehr leise: 0.12)
      realisticSoundManager.playDoubleToneAlert(0.12);
    }

    addLog(`Notruf eingehend: ${incidentType.type} in ${location.name}`, 'new');
  };

  // NEU: Öffne Call-Modal zum Anrufer-Gespräch
  const openCallModal = (callId: number) => {
    const call = calls.find(c => c.id === callId);
    if (!call) return;

    setSelectedCall(call);
    setIsCallModalOpen(true);
    // Authentischer Button-Klick
    realisticSoundManager.playButtonClick();
  };

  // NEU: Lehne Anruf ab (Auflegen)
  const rejectCall = (callId: number) => {
    setCalls(prev => prev.map(c =>
      c.id === callId ? { ...c, status: 'rejected' as const, answered: true } : c
    ));
    addLog(`Anruf abgelehnt: ${calls.find(c => c.id === callId)?.type || 'Unbekannt'}`, 'failed');

    // Entferne abgelehnte Anrufe nach 3 Sekunden (🎮 beschleunigt)
    setTimeout(() => {
      setCalls(prev => prev.filter(c => c.id !== callId));
    }, 3000 / gameSpeed);
  };

  // Dialog-Handler: Frage stellen und Antwort verarbeiten
  const handleDialogResponse = (callId: number, optionId: string) => {
    const call = calls.find(c => c.id === callId);
    if (!call || !call.dialogState || !call.type) return;

    const template = dialogTemplates[call.type];
    if (!template) return;

    const option = template.dialogTree[optionId];
    if (!option) return;

    const now = Date.now();

    // Füge Dispatcher-Frage hinzu
    const dispatcherMessage = {
      id: `msg-${now}-dispatcher`,
      sender: 'dispatcher' as const,
      text: option.text,
      timestamp: now,
    };

    // Füge Anrufer-Antwort hinzu (mit Platzhaltern ersetzt)
    let responseText = option.response;
    if (call.hiddenData?.actualAddress) {
      responseText = responseText.replace('{ADDRESS}', call.hiddenData.actualAddress);
    }
    if (call.hiddenData?.actualLocation) {
      responseText = responseText.replace('{LOCATION}', call.hiddenData.actualLocation);
      responseText = responseText.replace('{POI_NAME}', call.hiddenData.actualLocation);
    }

    // Berechne realistische Verzögerung basierend auf Textlänge
    const typingSpeed = call.priority === 'high' ? 25 : call.priority === 'medium' ? 35 : 50;
    const estimatedTypingTime = responseText.length * typingSpeed;

    const callerMessage = {
      id: `msg-${now}-caller`,
      sender: 'caller' as const,
      text: responseText,
      timestamp: now + 800, // Realistischere Verzögerung (Anrufer überlegt/atmet)
      emotion: option.responseEmotion,
    };

    // Bestimme nächste verfügbare Optionen
    const nextOptions = option.followUpOptions || [];

    // Update revealed info - aber OHNE location/priority (die werden verzögert)
    const immediateRevealedInfo = { ...call.dialogState.revealedInfo };
    if (option.revealsInfo) {
      if (option.revealsInfo.incidentType) {
        immediateRevealedInfo.hasIncidentType = true;
      }
      // location und priority werden NICHT sofort revealed!
    }

    // Prüfe ob Dialog komplett ist (wird später korrekt aktualisiert)
    const isComplete = option.completesDialog || false;

    // SCHRITT 1: Füge NUR die Dispatcher-Frage hinzu (sofort)
    setCalls(prev => prev.map(c => {
      if (c.id !== callId) return c;

      const updatedCall: Call = { ...c };

      // Füge NUR Dispatcher-Nachricht hinzu
      updatedCall.dialogState = {
        ...c.dialogState!,
        messagesHistory: [...c.dialogState!.messagesHistory, dispatcherMessage],
        currentOptions: [], // Keine Buttons während Anrufer antwortet
        revealedInfo: immediateRevealedInfo,
        isComplete,
      };

      return updatedCall;
    }));

    // SCHRITT 2: Füge Caller-Antwort nach Verzögerung hinzu
    setTimeout(() => {
      setCalls(prev => prev.map(c => {
        if (c.id !== callId) return c;

        const updatedCall: Call = { ...c };

        if (updatedCall.dialogState) {
          updatedCall.dialogState = {
            ...updatedCall.dialogState,
            messagesHistory: [...updatedCall.dialogState.messagesHistory, callerMessage],
            currentOptions: nextOptions, // Buttons erscheinen nach Antwort
          };
        }

        return updatedCall;
      }));
    }, 800); // Anrufer denkt nach

    // Verzögert die Daten-Enthüllung bis NACH der Typing-Animation
    if (option.revealsInfo?.location || option.revealsInfo?.priority || option.revealsInfo?.additionalDetails || option.revealsInfo?.involvedCount !== undefined) {
      setTimeout(() => {
        setCalls(prev => prev.map(c => {
          if (c.id !== callId) return c;

          const updatedCall: Call = { ...c };

          // JETZT enthülle die tatsächlichen Daten
          if (option.revealsInfo?.location && c.hiddenData) {
            updatedCall.position = c.hiddenData.actualPosition!;
            updatedCall.locationName = c.hiddenData.actualLocation!;
            updatedCall.address = c.hiddenData.actualAddress!;
          }
          if (option.revealsInfo?.priority && option.revealsInfo.priority) {
            updatedCall.priority = option.revealsInfo.priority;
          }
          if (option.revealsInfo?.additionalDetails) {
            updatedCall.description += ` ${option.revealsInfo.additionalDetails}`;
          }
          if (option.revealsInfo?.involvedCount !== undefined) {
            updatedCall.involvedCount = option.revealsInfo.involvedCount;
          }

          // JETZT auch revealedInfo aktualisieren
          if (updatedCall.dialogState) {
            const finalRevealedInfo = { ...updatedCall.dialogState.revealedInfo };
            if (option.revealsInfo?.location) {
              finalRevealedInfo.hasLocation = true;
            }
            if (option.revealsInfo?.priority) {
              finalRevealedInfo.hasPriority = true;
            }

            // Prüfe ob Dialog jetzt komplett ist
            const nowComplete = option.completesDialog || (
              finalRevealedInfo.hasLocation &&
              finalRevealedInfo.hasIncidentType &&
              finalRevealedInfo.hasPriority
            );

            updatedCall.dialogState = {
              ...updatedCall.dialogState,
              revealedInfo: finalRevealedInfo,
              isComplete: nowComplete,
            };
          }

          return updatedCall;
        }));
      }, estimatedTypingTime + 800); // Warte bis Typing fertig ist + Initial-Delay
    }
  };

  // NEW: Accept call and create incident (nur noch aus Modal heraus aufrufbar)
  // Mit optionaler direkter Fahrzeugzuweisung aus dem Modal + Sonderrechte-Option
  const acceptCall = (callId: number, preAssignedVehicles?: number[], withSpecialRights: boolean = true) => {
    const call = calls.find(c => c.id === callId);
    if (!call) return;

    const settings = getDifficultySettings();
    const incidentType = incidentTypes.find(it => it.type === call.type);
    if (!incidentType) return;

    // Eskalationslogik: 10% Chance, kann eskalieren
    const canEscalate = escalationRules[call.type] !== undefined && Math.random() < 0.1;
    const escalationDelay = canEscalate ? 60 + Math.random() * 30 : 0; // 60-90 Sekunden

    const newIncidentId = incrementIncidentCounter(); // Speichere ID für spätere Verwendung
    const newIncident = {
      id: newIncidentId,
      type: call.type,
      position: call.position,
      assignedVehicleIds: preAssignedVehicles || [], // Verwende vorausgewählte Fahrzeuge
      priority: call.priority,
      description: `${call.description} - ${call.locationName}`,
      timeRemaining: settings.baseTimeLimit,
      locationName: call.locationName,
      spawnTime: (gameTime * 60) + gameTimeSeconds, // 🎮 GAME-ZEIT in Sekunden (präzise!)
      requiredVehicles: incidentType.requiredVehicles,
      arrivedVehicles: 0,
      processingDuration: incidentProcessingTimes[call.type] || 180,
      canEscalate: canEscalate,
      escalationTime: canEscalate ? escalationDelay : null, // 🎮 Eskalation nach X Sekunden
      hasEscalated: false,
      isMANV: call.isMANV || false,
      involvedCount: call.involvedCount || 0,
      withSpecialRights: withSpecialRights, // Mit/Ohne Sonderrechte vom Modal
      speakRequestGiven: false, // Noch kein Sprechwunsch für diesen Einsatz
      // LST-SIM Style Meldungen
      backupRequested: false,
      backupFulfilled: false,
      backupVehiclesNeeded: 0,
      initialReportGiven: false,
    };

    setIncidents(prev => [...prev, newIncident]);

    // Wenn Fahrzeuge bereits zugewiesen wurden, setze sie SOFORT auf S3 (INLINE)
    if (preAssignedVehicles && preAssignedVehicles.length > 0) {


      // INLINE State-Update mit prevVehicles Callback - keine Closure-Probleme!
      setVehicles(prevVehicles => {
        let isFirstVehicle = true; // Track ob es das erste Fahrzeug ist

        return prevVehicles.map(v => {
          if (!preAssignedVehicles.includes(v.id)) return v;
          if (v.status !== 'S2' && !(v.status === 'S8' && v.canBeRedirected)) return v;

          // Bestimme Startposition: Immer von Wache für S2, sonst aktuelle Position (S8 ist bereits unterwegs)
          // WICHTIG: Für S2 IMMER station.position nutzen, nicht v.position (könnte veraltet sein!)
          const vehicleStation = policeStations.find(s => s.id === v.stationId);
          const startPosition = v.status === 'S2' && vehicleStation ? vehicleStation.position : v.position;

          // Capture values in closure BEFORE any async operations
          const vehicleId = v.id;
          const isLeadVehicle = isFirstVehicle;
          isFirstVehicle = false; // Nächstes ist nicht mehr das erste

          // Setze auf S2 (Alarmierung) - noch nicht sichtbar
          const updatedVehicle = {
            ...v,
            position: startPosition,  // WICHTIG: Setze Position explizit auf Startposition!
            assignedIncidentId: newIncidentId,
            status: 'S2' as VehicleStatus,
            routeStartTime: Date.now(),
            routeProgress: 0,
            route: null,  // Wird async berechnet
            accumulatedTime: 0,
          };

          // 🚨 Lead-Fahrzeug: Meldet Einsatzübernahme
          if (isLeadVehicle) {
            // Berechne realistische Ausrückzeit basierend auf Fahrzeugtyp
            // 🎮 SPIELGESCHWINDIGKEIT: Ausrückzeit beschleunigt
            const dispatchDelay = calculateDispatchDelay(v.vehicleType) / gameSpeed;

            // Nach Ausrückzeit: Route berechnen und S3 melden
            setTimeout(async () => {
              try {
                const route = await getRoute(
                  { lat: startPosition[0], lng: startPosition[1] },
                  { lat: newIncident.position[0], lng: newIncident.position[1] }
                );

                // Wechsle zu S3 wenn Route fertig
                if (route) {
                  setVehicles(prev => prev.map(vehicle =>
                    vehicle.id === vehicleId ? {
                      ...vehicle,
                      status: 'S3' as VehicleStatus,
                      route: convertToLeafletFormat(route.coordinates),
                      routeDuration: route.duration * 0.7
                    } : vehicle
                  ));
                } else {
                  // Fallback: Straight Line Route
                  const straightRoute = getStraightLineRoute(
                    { lat: startPosition[0], lng: startPosition[1] },
                    { lat: newIncident.position[0], lng: newIncident.position[1] }
                  );
                  const straightDistance = calculateDistance(
                    { lat: startPosition[0], lng: startPosition[1] },
                    { lat: newIncident.position[0], lng: newIncident.position[1] }
                  );
                  setVehicles(prev => prev.map(vehicle =>
                    vehicle.id === vehicleId ? {
                      ...vehicle,
                      status: 'S3' as VehicleStatus,
                      route: straightRoute,
                      routeDuration: Math.max(60, straightDistance / 20)
                    } : vehicle
                  ));
                }

                // ⚡ FUNKSPRUCH: S2 → S3 (Anfahrt beginnt)
                setTimeout(() => {
                  addRadioMessage(vehicleId, 'S2' as VehicleStatus, 'S3' as VehicleStatus, {
                    incidentType: newIncident.type,
                    location: newIncident.locationName,
                  });
                }, 200);

              } catch {
                // Fehlerfall: Straight Line Route
                const straightRoute = getStraightLineRoute(
                  { lat: startPosition[0], lng: startPosition[1] },
                  { lat: newIncident.position[0], lng: newIncident.position[1] }
                );
                const straightDistance = calculateDistance(
                  { lat: startPosition[0], lng: startPosition[1] },
                  { lat: newIncident.position[0], lng: newIncident.position[1] }
                );
                setVehicles(prev => prev.map(vehicle =>
                  vehicle.id === vehicleId ? {
                    ...vehicle,
                    status: 'S3' as VehicleStatus,
                    route: straightRoute,
                    routeDuration: Math.max(60, straightDistance / 20)
                  } : vehicle
                ));

                // ⚡ FUNKSPRUCH: S2 → S3 (Anfahrt beginnt)
                setTimeout(() => {
                  addRadioMessage(vehicleId, 'S2' as VehicleStatus, 'S3' as VehicleStatus, {
                    incidentType: newIncident.type,
                    location: newIncident.locationName,
                  });
                }, 200);
              }
            }, dispatchDelay * 1000); // Nutze realistische Ausrückzeit

          } else {
            // 🚔 Normale Fahrzeuge: Direkte Alarmierung
            // Berechne realistische Ausrückzeit basierend auf Fahrzeugtyp
            // 🎮 SPIELGESCHWINDIGKEIT: Ausrückzeit beschleunigt
            const dispatchDelay = calculateDispatchDelay(v.vehicleType) / gameSpeed;

            setTimeout(async () => {
              try {
                const route = await getRoute(
                  { lat: startPosition[0], lng: startPosition[1] },
                  { lat: newIncident.position[0], lng: newIncident.position[1] }
                );

                // Wechsle zu S3 wenn Route fertig
                if (route) {
                  setVehicles(prev => prev.map(vehicle =>
                    vehicle.id === vehicleId ? {
                      ...vehicle,
                      status: 'S3' as VehicleStatus,
                      route: convertToLeafletFormat(route.coordinates),
                      routeDuration: route.duration * 0.7
                    } : vehicle
                  ));
                } else {
                  // Fallback: Straight Line Route
                  const straightRoute = getStraightLineRoute(
                    { lat: startPosition[0], lng: startPosition[1] },
                    { lat: newIncident.position[0], lng: newIncident.position[1] }
                  );
                  const straightDistance = calculateDistance(
                    { lat: startPosition[0], lng: startPosition[1] },
                    { lat: newIncident.position[0], lng: newIncident.position[1] }
                  );
                  setVehicles(prev => prev.map(vehicle =>
                    vehicle.id === vehicleId ? {
                      ...vehicle,
                      status: 'S3' as VehicleStatus,
                      route: straightRoute,
                      routeDuration: Math.max(60, straightDistance / 20)
                    } : vehicle
                  ));
                }

                // ⚡ FUNKSPRUCH: S2 → S3 (Anfahrt) - wie bei LST SIM
                setTimeout(() => {
                  addRadioMessage(vehicleId, 'S2' as VehicleStatus, 'S3' as VehicleStatus, {
                    incidentType: newIncident.type,
                    location: newIncident.locationName,
                  });
                }, 200);

              } catch {
                // Fehlerfall: Straight Line Route
                const straightRoute = getStraightLineRoute(
                  { lat: startPosition[0], lng: startPosition[1] },
                  { lat: newIncident.position[0], lng: newIncident.position[1] }
                );
                const straightDistance = calculateDistance(
                  { lat: startPosition[0], lng: startPosition[1] },
                  { lat: newIncident.position[0], lng: newIncident.position[1] }
                );
                setVehicles(prev => prev.map(vehicle =>
                  vehicle.id === vehicleId ? {
                    ...vehicle,
                    status: 'S3' as VehicleStatus,
                    route: straightRoute,
                    routeDuration: Math.max(60, straightDistance / 20)
                  } : vehicle
                ));

                // ⚡ FUNKSPRUCH: S2 → S3 (Anfahrt) - wie bei LST SIM
                setTimeout(() => {
                  addRadioMessage(vehicleId, 'S2' as VehicleStatus, 'S3' as VehicleStatus, {
                    incidentType: newIncident.type,
                    location: newIncident.locationName,
                  });
                }, 200);
              }
            }, dispatchDelay * 1000); // Nutze realistische Ausrückzeit
          }

          addLog(`S-${vehicleId.toString().padStart(2, '0')} S1→S2 Einsatz #${newIncidentId}`, 'assignment');
          // Bestätigungs-Piep für Fahrzeugzuweisung
          realisticSoundManager.playLeitstelleButtonBeep();

          return updatedVehicle;
        });
      });
    }

    // Markiere Call als "answered" und entferne nach kurzer Verzögerung
    setCalls(prev => prev.map(c =>
      c.id === callId ? { ...c, status: 'answered' as const, answered: true } : c
    ));

    // Entferne angenommene Anrufe nach 2 Sekunden (🎮 beschleunigt)
    setTimeout(() => {
      setCalls(prev => prev.filter(c => c.id !== callId));
    }, 2000 / gameSpeed);

    // 🎵 NATÜRLICHE SOUND-SEQUENZ bei Einsatzannahme
    // 1. Button-Beep (sofort)
    realisticSoundManager.playLeitstelleButtonBeep(0.4);

    // 2. PTT Press (nach 200ms - Funkgerät aktivieren)
    setTimeout(() => {
      realisticSoundManager.playPTTPress(0.35);
    }, 200 / gameSpeed);

    // 3. Blaulicht & Sirenen bei Sonderrechten
    if (withSpecialRights && preAssignedVehicles && preAssignedVehicles.length > 0) {
      // 3a. Blaulicht-PIEP (nach 500ms - Blaulicht aktivieren)
      setTimeout(() => realisticSoundManager.playBlaulichtActivate(0.4), 500 / gameSpeed);

      // 3b. Sirenen starten (nach 700ms - Sirenen anlaufen)
      preAssignedVehicles.forEach(vehicleId => {
        setTimeout(() => realisticSoundManager.startSirene(vehicleId), 700 / gameSpeed);
      });

      // 4. PTT Release (nach 1200ms - Funkgerät loslassen)
      setTimeout(() => {
        realisticSoundManager.playPTTRelease(0.35);
      }, 1200 / gameSpeed);
    } else {
      // Ohne Sonderrechte: PTT früher loslassen
      setTimeout(() => {
        realisticSoundManager.playPTTRelease(0.35);
      }, 800 / gameSpeed);
    }

    const vehicleInfo = preAssignedVehicles && preAssignedVehicles.length > 0
      ? ` + ${preAssignedVehicles.length} Fahrzeuge zugewiesen`
      : '';
    addLog(`Anruf entgegengenommen: ${call.type} in ${call.locationName} → Einsatz #${newIncidentId}${vehicleInfo}`, 'assignment');
  };

  // BUGFIX: generateIncident jetzt direkt als generateCall (lstsim.de Style)
  const generateIncident = () => {
    generateCall(); // Nutze Call-System wie lstsim.de
  };

  // Request backup - öffnet Modal zur Fahrzeugauswahl
  const requestBackup = (incidentId: number) => {
    const incident = getIncidentById(incidents, incidentId);
    if (!incident) return;

    setSelectedIncidentForBackup(incident);
    setIsBackupModalOpen(true);
    realisticSoundManager.playButtonClick();
  };

  // Confirm backup - weist ausgewählte Fahrzeuge zu
  const confirmBackup = (vehicleIds: number[], withSpecialRights: boolean = true) => {
    if (!selectedIncidentForBackup || vehicleIds.length === 0) return;

    const incidentId = selectedIncidentForBackup.id;

    addLog(`Verstärkung: ${vehicleIds.length} Fahrzeug(e) zu ${selectedIncidentForBackup.type}${withSpecialRights ? ' (MIT Sonderrechten)' : ' (OHNE Sonderrechte)'}`, 'assignment');

    // 🎵 NATÜRLICHE SOUND-SEQUENZ bei Verstärkung (wie bei acceptCall)
    // 1. Button-Beep (sofort)
    realisticSoundManager.playLeitstelleButtonBeep(0.4);

    // 2. PTT Press (nach 200ms)
    setTimeout(() => {
      realisticSoundManager.playPTTPress(0.35);
    }, 200 / gameSpeed);

    // 3. Blaulicht & Sirenen bei Sonderrechten
    if (withSpecialRights && vehicleIds.length > 0) {
      // 3a. Blaulicht-PIEP (nach 500ms)
      setTimeout(() => realisticSoundManager.playBlaulichtActivate(0.4), 500 / gameSpeed);

      // 3b. Sirenen starten (nach 700ms)
      vehicleIds.forEach(vehicleId => {
        setTimeout(() => realisticSoundManager.startSirene(vehicleId), 700 / gameSpeed);
      });

      // 4. PTT Release (nach 1200ms)
      setTimeout(() => {
        realisticSoundManager.playPTTRelease(0.35);
      }, 1200 / gameSpeed);
    } else {
      // Ohne Sonderrechte: PTT früher loslassen
      setTimeout(() => {
        realisticSoundManager.playPTTRelease(0.35);
      }, 800 / gameSpeed);
    }

    // Erhöhe required vehicles und gib Bonus-Zeit für Verstärkung
    setIncidents(prev =>
      prev.map(i =>
        i.id === incidentId
          ? {
              ...i,
              requiredVehicles: i.requiredVehicles + vehicleIds.length,
              timeRemaining: i.timeRemaining + (vehicleIds.length * 12), // Angepasst an kürzere Dispatch-Zeiten
              withSpecialRights: withSpecialRights, // Setze Sonderrechte
            }
          : i
      )
    );

    // Weise alle ausgewählten Fahrzeuge zu
    vehicleIds.forEach(vehicleId => {
      assignVehicle(vehicleId, incidentId);
    });

    // Schließe Modal und reset state
    setIsBackupModalOpen(false);
    setSelectedIncidentForBackup(null);
  };

  // 🚔 PATROL SYSTEM: Start patrol for vehicle
  const handleStartPatrol = async (vehicleId: number, areaId?: string) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Prüfe ob Fahrzeug auf Streife gehen kann
    const canPatrolCheck = canVehiclePatrol(vehicle);
    if (!canPatrolCheck.canPatrol) {
      addLog(`⚠️ ${vehicle.callsign || `FZ-${vehicle.id}`} kann nicht auf Streife: ${canPatrolCheck.reason}`, 'system');
      return;
    }

    // ⚡ Sofortiges Feedback: Markiere Fahrzeug als "Route wird berechnet"
    addLog(`🚔 ${vehicle.callsign || `FZ-${vehicle.id}`} berechnet Streifenroute...`, 'system');
    realisticSoundManager.playLeitstelleButtonBeep(0.4);

    // Streife starten (async, blockiert nicht UI)
    const hour = Math.floor(gameTime / 60);
    const result = await startPatrol(vehicle, Date.now(), hour, weather.current, undefined, areaId);

    if (!result.success || !result.route) {
      addLog(`⚠️ Streife konnte nicht gestartet werden: ${result.error}`, 'system');
      return;
    }

    // Update vehicle mit berechneter Route
    setVehicles(prev => prev.map(v =>
      v.id === vehicleId ? {
        ...v,
        isOnPatrol: true,
        patrolRoute: result.route,
        patrolStartTime: Date.now(),
        patrolTotalDistance: 0,
        patrolLastDiscoveryCheck: Date.now(),
        position: result.route.fullRoute[0], // ✅ FIX: Starte bei erstem Punkt der Route
        status: 'S1' as VehicleStatus, // S1 = Frei auf Funk (auf Streife)
      } : v
    ));

    addLog(`✅ ${vehicle.callsign || `FZ-${vehicle.id}`} beginnt Streife in ${result.route.areaName} (${result.route.fullRoute.length} Routenpunkte)`, 'assignment');
  };

  // 🚔 PATROL SYSTEM: Stop patrol for vehicle
  const handleStopPatrol = (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle || !vehicle.isOnPatrol) return;

    // Streife stoppen
    stopPatrol(vehicle);

    setVehicles(prev => prev.map(v =>
      v.id === vehicleId ? {
        ...v,
        isOnPatrol: false,
        patrolRoute: null,
        patrolStartTime: null,
        status: 'S2' as VehicleStatus, // Zurück zur Wache
      } : v
    ));

    addLog(`🚔 ${vehicle.callsign || `FZ-${vehicle.id}`} beendet Streife`, 'system');
    realisticSoundManager.playLeitstelleButtonBeep(0.4);
  };

  // Return vehicle to station (für Hotkey H)
  const returnToStation = async (vehicleId: number) => {
    const vehicle = vehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    const station = policeStations.find(s => s.id === vehicle.stationId);
    if (!station) return;

    // Berechne Route zur Wache
    try {
      // ZENTRALISIERT: Route-Berechnung zur Wache mit neuem Helper
      const isHelicopter = usesAirRoute(vehicle.vehicleType);
      const routeData = await calculateRoute(
        { lat: vehicle.position[0], lng: vehicle.position[1] },
        { lat: station.position[0], lng: station.position[1] },
        isHelicopter
      );

      const route = routeData.path;
      const routeDistance = routeData.distance;

      // ⚡ REALISTISCHE GESCHWINDIGKEITSBERECHNUNG (Rückfahrt ohne Sonderrechte)
      const routeDuration = calculateRealisticRouteDuration(
        vehicle.vehicleType,
        routeDistance,
        weather.current,
        vehicle.crewFatigue,
        false, // Rückfahrt ohne Blaulicht
        gameSpeed // 🎮 BUG FIX: gameSpeed berücksichtigen
      );

      setVehicles(prev => prev.map(v =>
        v.id === vehicleId ? {
          ...v,
          status: 'S8' as VehicleStatus,
          route,
          routeDuration,
          routeStartTime: Date.now(),
          routeProgress: 0,
          accumulatedTime: 0,
          processingStartTime: null,
          speakRequest: null,
        } : v
      ));

      addRadioMessage(vehicleId, 'S4', 'S8', {
        location: station.name,
      });
    } catch (error) {
      console.error('Fehler bei returnToStation:', error);
    }
  };

  // Neue Hilfsfunktion: Weise Fahrzeug direkt zu einem Incident-Objekt zu (verhindert Closure-Probleme)

  // KRITISCHER FIX: Assign vehicle to incident (mit Error Handling für OSRM + lstsim.de S8-Umleitung)
  // Nutzt functional state updates um Stale Closures zu vermeiden
  const assignVehicle = async (vehicleId: number, incidentId: number) => {
    // WICHTIG: Holen State über functional updates, nicht über Closures!
    let vehicle: Vehicle | undefined;
    let incident: Incident | undefined;

    // Aktuellen State abrufen durch functional update
    setVehicles(prev => {
      vehicle = prev.find(v => v.id === vehicleId);
      return prev; // Keine Änderung, nur State lesen
    });

    setIncidents(prev => {
      incident = prev.find(i => i.id === incidentId);
      return prev; // Keine Änderung, nur State lesen
    });

    // Validierung mit aktuellem State
    if (!vehicle || !incident) {
      console.warn(`AssignVehicle: Vehicle ${vehicleId} oder Incident ${incidentId} nicht gefunden`);
      return;
    }

    // FMS-konform: S2 (Frei auf Wache) oder S8 (Rückfahrt, kann umgeleitet werden)
    const canAssign = isVehicleAvailable(vehicle);

    if (!canAssign || incident.assignedVehicleIds.includes(vehicleId)) {
      return;
    }

    // ⚡ WETTER-CHECK: Helicopter kann bei schlechtem Wetter nicht fliegen
    if (vehicle.vehicleType === 'Polizeihubschrauber' && !canHelicopterFly(weather.current)) {
      const weatherName = weatherConditions[weather.current].name;
      addLog(`⚠️ Hubschrauber ${vehicleId} kann bei ${weatherName} nicht fliegen!`, 'system');
      setToasts((prev) => [
        ...prev,
        {
          id: toastCounter,
          type: 'Helicopter grounded',
          location: `Bei ${weatherName} kann der Polizeihubschrauber nicht fliegen`,
          priority: 'high',
          incidentId: incidentId,
        },
      ]);
      setToastCounter((c) => c + 1);
      return; // Verhindere Zuweisung
    }



    // KRITISCHER FIX: Wenn Fahrzeug in S8 ist, von altem Einsatz entfernen
    // UND arrivedVehicles dekrementieren (war vorher Bug: Counter desynchronisierte)
    if (vehicle!.status === 'S8' && vehicle!.assignedIncidentId) {
      setIncidents(prev =>
        prev.map(i => {
          if (i.id === vehicle!.assignedIncidentId) {
            // Prüfe ob Fahrzeug bereits am Einsatzort war (Status war S4)
            const wasAtScene = vehicle!.status === 'S8'; // S8 bedeutet: war in S4, jetzt auf Rückweg

            return {
              ...i,
              assignedVehicleIds: i.assignedVehicleIds.filter(vid => vid !== vehicleId),
              // Dekrementiere arrivedVehicles nur wenn Fahrzeug wirklich vor Ort war
              arrivedVehicles: wasAtScene && i.arrivedVehicles > 0 ? i.arrivedVehicles - 1 : i.arrivedVehicles,
            };
          }
          return i;
        })
      );
      addLog(`S-${vehicleId.toString().padStart(2, '0')} S8→S3 Umgeleitet zu neuem Einsatz`, 'assignment');
    }

    const station = policeStations.find(s => s.id === vehicle!.stationId);
    if (!station) return;

    // Bestimme Startposition: Immer von Wache für S2, sonst aktuelle Position (S8 ist bereits unterwegs)
    // WICHTIG: Für S2 IMMER station.position nutzen, nicht vehicle.position!
    const startPosition = vehicle!.status === 'S2' ? station.position : vehicle!.position;

    // ⏱️ REALISTISCHE AUSRÜCKZEIT: Berechne Verzögerung basierend auf Fahrzeugtyp
    // 🎮 SPIELGESCHWINDIGKEIT: Ausrückzeit beschleunigt
    const dispatchDelay = calculateDispatchDelay(vehicle!.vehicleType) / gameSpeed;

    // 🔒 BUG FIX #3: Cleanup existing timeout if vehicle is being reassigned
    setVehicles(prev =>
      prev.map(v => {
        if (v.id === vehicleId && v.activeDispatchTimeout) {
          clearTimeout(v.activeDispatchTimeout);
        }
        return v;
      })
    );

    // Warte realistische Ausrückzeit (15-90s je nach Fahrzeugtyp), dann Route berechnen und zu S3 wechseln
    const timeoutId = setTimeout(async () => {
      // Lokale Kopien für TypeScript (verhindert undefined-Fehler)
      const safeVehicle = vehicle;
      const safeIncident = incident;
      const safeStartPosition = startPosition;

      let route: [number, number][] | null = null;
      let routeDuration = 240;
      let routeDistance = 0;

      try {
        // ZENTRALISIERT: Route-Berechnung mit neuem Helper
        const isHelicopter = usesAirRoute(safeVehicle!.vehicleType);
        const routeData = await calculateRoute(
          { lat: safeStartPosition![0], lng: safeStartPosition![1] },
          { lat: safeIncident!.position[0], lng: safeIncident!.position[1] },
          isHelicopter
        );

        route = routeData.path;
        routeDistance = routeData.distance;

        // ⚡ REALISTISCHE GESCHWINDIGKEITSBERECHNUNG
        // Berücksichtigt: Fahrzeugtyp, maxSpeed, Wetter, Müdigkeit, Sonderrechte
        routeDuration = calculateRealisticRouteDuration(
          safeVehicle!.vehicleType,
          routeDistance,
          weather.current,
          safeVehicle!.crewFatigue,
          safeIncident!.priority === 'high', // Nur bei High-Priority mit Blaulicht
          gameSpeed // 🎮 BUG FIX: gameSpeed berücksichtigen
        );
      } catch (error) {
        console.error('Routing Fehler:', error);

        // 🔒 BUG FIX #2: Doppelter try-catch für absolut sicheren Fallback
        try {
          // KRITISCHER FALLBACK: Wenn Route-Berechnung komplett fehlschlägt, nutze Direktlinie
          const straightRoute = [safeStartPosition!, safeIncident!.position];
          route = straightRoute;
          routeDistance = calculateDistance(
            { lat: safeStartPosition![0], lng: safeStartPosition![1] },
            { lat: safeIncident!.position[0], lng: safeIncident!.position[1] }
          );
          routeDuration = (routeDistance / 1000) * 60; // Schätzung: 1km pro Minute

          addLog(`⚠️ Routing-Fallback: Direktroute für Fahrzeug ${vehicleId}`, 'system');
        } catch (fallbackError) {
          console.error('🔴 KRITISCH: Auch Fallback-Route fehlgeschlagen:', fallbackError);
          // LETZTE RETTUNG: Minimale 2-Punkt-Route (Frankfurt Zentrum)
          route = [
            safeStartPosition || [50.1109, 8.6821],
            safeIncident?.position || [50.1109, 8.6821]
          ];
          routeDuration = 120; // 2 Minuten Default
          routeDistance = 2000; // 2km Default
          addLog(`🔴 KRITISCH: Notfall-Route für Fahrzeug ${vehicleId}`, 'failed');
        }
      }

      // Route fertig - wechsle zu S3 (Anfahrt)
      // WICHTIG: Immer zu S3 wechseln, auch wenn nur Fallback-Route!
      if (route && route.length >= 2) {
        console.log(`[DISPATCH] Fahrzeug ${vehicleId} wechselt zu S3 mit Route (${route.length} Punkte)`);

        setVehicles(prev => prev.map(v =>
          v.id === vehicleId ? {
            ...v,
            status: 'S3' as VehicleStatus,
            isPreparingToDepart: false, // Nicht mehr in Vorbereitung
            route,  // Route ist bereits konvertiert!
            routeDuration,
            routeStartTime: Date.now(), // WICHTIG: Setze Start-Zeit neu!
            accumulatedTime: 0, // WICHTIG: Reset accumulated time!
            activeDispatchTimeout: undefined, // 🔒 BUG FIX #3: Clear timeout nach erfolgreicher Route
          } : v
        ));

        // ⚡ FUNKSPRUCH: S2 → S3 (Ausgerückt)
        addRadioMessage(vehicleId, 'S2', 'S3', {
          incidentType: safeIncident!.type,
          location: safeIncident!.locationName,
        });

        addLog(`S-${vehicleId.toString().padStart(2, '0')} S2→S3 Ausgerückt zu Einsatz #${incidentId} ${safeIncident!.type} (${dispatchDelay}s)`, 'assignment');
      } else {
        console.error(`[DISPATCH ERROR] Fahrzeug ${vehicleId} hat keine gültige Route! Route:`, route);
        addLog(`⚠️ FEHLER: Fahrzeug ${vehicleId} konnte nicht ausrücken (keine Route)`, 'failed');
      }
    }, dispatchDelay * 1000); // Realistische Ausrückzeit in Millisekunden

    // 🔒 BUG FIX #1 & #3: Markiere Fahrzeug SOFORT als nicht verfügbar + Speichere Timeout-ID
    setVehicles(prev =>
      prev.map(v =>
        v.id === vehicleId ? {
          ...v,
          position: startPosition,  // WICHTIG: Setze Position explizit auf Startposition!
          assignedIncidentId: incidentId,
          status: 'S2' as VehicleStatus,
          isAvailable: false, // 🔒 SOFORT als nicht verfügbar markieren!
          dispatchTime: Date.now(), // Zeitpunkt der Alarmierung
          isPreparingToDepart: true, // Bereitet Ausrückung vor
          routeStartTime: Date.now(),
          routeProgress: 0,
          route: null,  // Wird async berechnet
          accumulatedTime: 0,  // Reset für neue Fahrt
          activeDispatchTimeout: timeoutId, // 🔒 BUG FIX #3: Speichere Timeout-ID
        } : v
      )
    );

    setIncidents(prev =>
      prev.map(i =>
        i.id === incidentId ? { ...i, assignedVehicleIds: [...i.assignedVehicleIds, vehicleId] } : i
      )
    );

    htmlAudioManager.playSirenBeep();

    // ⚡ FUNKSPRUCH: S8 → S3 (nur bei Umleitung von S8)
    if (vehicle.status === 'S8') {
      addRadioMessage(vehicleId, 'S8', 'S3', {
        incidentType: incident.type,
        location: incident.locationName,
      });
    }
  };

  // Vehicle movement animation and status management (Performance-Optimierung: nur wenn Fahrzeuge bewegt werden)
  useEffect(() => {
    if (!gameStarted || isPaused) return;

    let animationFrameId: number;
    let lastFrameTime = Date.now();

    const animate = () => {
      const currentFrameTime = Date.now();
      const deltaTime = (currentFrameTime - lastFrameTime) / 1000; // in seconds
      const scaledDeltaTime = deltaTime * gameSpeed; // Apply game speed multiplier
      lastFrameTime = currentFrameTime;

      // PERFORMANCE-OPTIMIERUNG: Nur animieren wenn Fahrzeuge tatsächlich unterwegs sind
      // Verhindert unnötige Berechnungen wenn alle Fahrzeuge stehen
      const hasMovingVehicles = vehicles.some(v => isVehicleMoving(v));
      const hasProcessingVehicles = vehicles.some(v => v.status === 'S6' && v.outOfServiceUntil);

      if (!hasMovingVehicles && !hasProcessingVehicles) {
        // Keine Fahrzeuge in Bewegung oder S6-Wartung
        // Prüfe nur alle 500ms statt jedes Frame für bessere Performance
        setTimeout(() => {
          animationFrameId = requestAnimationFrame(animate);
        }, 500);
        return;
      }

      setVehicles(prev =>
        prev.map(vehicle => {
          // S2: Frei auf Wache - no action needed
          if (vehicle.status === 'S2') {
            return vehicle;
          }

          // ⚡ S6: Außer Dienst (Tanken/Pause/Reparatur)
          if (vehicle.status === 'S6' && vehicle.outOfServiceUntil) {
            // Prüfe ob S6-Zeit vorbei ist
            if (gameTime >= vehicle.outOfServiceUntil) {
              // S6 → S2: Zurück im Dienst (an Wache)
              const updates = resetVehicleAfterService(vehicle, vehicle.outOfServiceReason || 'unknown');

              // 🎮 Phase 5: Realismus - Kosten für S6-Services
              let serviceCost = 0;
              const reason = vehicle.outOfServiceReason;
              if (reason === 'Tanken') {
                serviceCost = REFUEL_COST;
              } else if (reason === 'Reparatur') {
                serviceCost = REPAIR_COST_MIN + Math.floor(Math.random() * (REPAIR_COST_MAX - REPAIR_COST_MIN));
              } else if (reason === 'Crew-Pause') {
                serviceCost = CREW_BREAK_COST;
              } else if (reason === 'Schichtende') {
                serviceCost = SHIFT_CHANGE_COST;
              }

              if (serviceCost > 0) {
                setScore(s => Math.max(0, s - serviceCost));
                addLog(`💰 ${reason} Kosten: -${serviceCost} Punkte`, 'system');
              }

              addLog(`S-${vehicle.id.toString().padStart(2, '0')} S6→S2 ${vehicle.outOfServiceReason} abgeschlossen`, 'completion');

              return {
                ...vehicle,
                ...updates,
                status: 'S2',
                isAvailable: true,
              };
            }
            // Noch in S6
            return vehicle;
          }

          // S3: Anfahrt zum Einsatz
          if (vehicle.status === 'S3' && vehicle.route) {
            // 🔒 NEUE PRÜFUNG: Stoppe Fahrzeug bei abgebrochenen/fehlgeschlagenen Einsätzen
            const currentIncident = vehicle.assignedIncidentId ? getIncidentById(incidents, vehicle.assignedIncidentId) : undefined;
            if (currentIncident && (currentIncident.status === 'failed' || currentIncident.status === 'completed')) {
              console.warn(`⚠️ Fahrzeug ${vehicle.id}: Einsatz ${vehicle.assignedIncidentId} wurde ${currentIncident.status === 'failed' ? 'fehlgeschlagen' : 'abgeschlossen'}, kehre zur Wache zurück`);
              addLog(`⚠️ Fahrzeug ${vehicle.id}: Einsatz wurde ${currentIncident.status === 'failed' ? 'fehlgeschlagen' : 'abgeschlossen'}, kehre zur Wache zurück`, 'system');

              // Berechne Route zurück zur Wache
              const station = policeStations.find(s => s.id === vehicle.stationId);
              if (station) {
                // Wechsle direkt zu S8 (Rückfahrt)
                getRoute(
                  { lat: vehicle.position[0], lng: vehicle.position[1] },
                  { lat: station.position[0], lng: station.position[1] }
                ).then(osrmRoute => {
                  let returnRoute: [number, number][] | null = null;
                  let returnDuration = 240;

                  if (osrmRoute) {
                    returnRoute = convertToLeafletFormat(osrmRoute.coordinates);
                    returnDuration = osrmRoute.duration * 0.7;
                  } else {
                    returnRoute = getStraightLineRoute(
                      { lat: vehicle.position[0], lng: vehicle.position[1] },
                      { lat: station.position[0], lng: station.position[1] }
                    );
                  }

                  setVehicles(prevVehicles =>
                    prevVehicles.map(v =>
                      v.id === vehicle.id ? {
                        ...v,
                        status: 'S8' as VehicleStatus,
                        route: returnRoute,
                        routeDuration: returnDuration,
                        routeStartTime: Date.now(),
                        routeProgress: 0,
                        accumulatedTime: 0,
                        assignedIncidentId: null,
                        canBeRedirected: true,
                      } : v
                    )
                  );
                });
              }
              return vehicle; // Behalte aktuellen Status für diesen Frame
            }

            // Use accumulated elapsed time instead of Date.now()
            const accumulatedTime = vehicle.accumulatedTime || 0;
            const newAccumulatedTime = accumulatedTime + scaledDeltaTime;
            const newProgress = Math.min(newAccumulatedTime / vehicle.routeDuration, 1);

            // 🔒 FIX: Verhindere mehrfache Ausführung - nur wenn noch nicht S4
            if (newProgress >= 1 && vehicle.status === 'S3') {
              // Arrived at incident - change to S4
              const incident = vehicle.assignedIncidentId ? getIncidentById(incidents, vehicle.assignedIncidentId) : undefined;

              // 🔒 BUG FIX #6: Prüfe ob Einsatz noch existiert (kann während Anfahrt gelöscht worden sein)
              if (!incident) {
                console.warn(`⚠️ Fahrzeug ${vehicle.id}: Einsatz ${vehicle.assignedIncidentId} existiert nicht mehr`);
                addLog(`⚠️ Fahrzeug ${vehicle.id}: Einsatz wurde abgebrochen, kehre zur Wache zurück`, 'system');

                // Berechne Route zurück zur Wache
                const station = policeStations.find(s => s.id === vehicle.stationId);
                if (station) {
                  // Wechsle direkt zu S8 (Rückfahrt)
                  getRoute(
                    { lat: vehicle.position[0], lng: vehicle.position[1] },
                    { lat: station.position[0], lng: station.position[1] }
                  ).then(osrmRoute => {
                    let returnRoute: [number, number][] | null = null;
                    let returnDuration = 240;

                    if (osrmRoute) {
                      returnRoute = convertToLeafletFormat(osrmRoute.coordinates);
                      returnDuration = osrmRoute.duration * 0.7;
                    } else {
                      returnRoute = getStraightLineRoute(
                        { lat: vehicle.position[0], lng: vehicle.position[1] },
                        { lat: station.position[0], lng: station.position[1] }
                      );
                    }

                    setVehicles(prevVehicles =>
                      prevVehicles.map(v =>
                        v.id === vehicle.id ? {
                          ...v,
                          status: 'S8' as VehicleStatus,
                          route: returnRoute,
                          routeDuration: returnDuration,
                          routeStartTime: Date.now(),
                          routeProgress: 0,
                          accumulatedTime: 0,
                          assignedIncidentId: null,
                          canBeRedirected: true,
                        } : v
                      )
                    );
                  });
                }
                return vehicle; // Behalte aktuellen Status für diesen Frame
              }

              // 🔒 BUG FIX #4: Berechne Parking-Position mit mehreren Reihen für >8 Fahrzeuge
              // 🔒 FIX: Zähle AUCH Fahrzeuge, die gerade ankommen (S3 mit progress >= 1)
              const incidentVehicles = prev.filter(v =>
                v.assignedIncidentId === vehicle.assignedIncidentId &&
                (v.status === 'S4' || (v.status === 'S3' && v.routeProgress >= 1))
              );
              const parkingIndex = incidentVehicles.length; // Wieviele Fahrzeuge sind schon da?

              // Mehrere Reihen: 8 Fahrzeuge pro Reihe (360° / 45° = 8)
              const vehiclesPerRow = 8;
              const row = Math.floor(parkingIndex / vehiclesPerRow); // Reihe (0, 1, 2, ...)
              const posInRow = parkingIndex % vehiclesPerRow; // Position in Reihe (0-7)

              // Erstelle einen kleinen Offset um den Einsatzort herum (in einem Halbkreis)
              const incidentPos = vehicle.route[vehicle.route.length - 1];
              const baseOffset = 0.0001; // ~11 Meter Basisabstand
              const offsetDistance = baseOffset * (row + 1); // Größerer Abstand für weitere Reihen
              const angleStep = Math.PI / 4; // 45 Grad zwischen Fahrzeugen
              const angle = -Math.PI / 2 + (posInRow * angleStep); // Startwinkel -90° (oben)

              const parkedPosition: [number, number] = [
                incidentPos[0] + (Math.sin(angle) * offsetDistance),
                incidentPos[1] + (Math.cos(angle) * offsetDistance)
              ];

              setIncidents(prevIncidents =>
                prevIncidents.map(inc => {
                  if (inc.id === vehicle.assignedIncidentId) {
                    // ⚡ ERSTMELDUNG SOFORT bei erster Ankunft (LST-SIM Style)
                    const isFirstArrival = inc.arrivedVehicles === 0 && !inc.initialReportGiven;

                    if (isFirstArrival && incident) {
                      const report = incidentReports[incident.type];
                      if (report) {
                        // ERSTMELDUNG - Sofort nach Ankunft
                        const initialMsg = getRandomReport(report.initialReport);
                        addRadioMessage(vehicle.id, 'S3', 'S4', {
                          customMessage: initialMsg,
                          requiresResponse: false,
                        });
                        addLog(`${vehicle.callsign}: ${initialMsg}`, 'radio');

                        // Prüfe ob Verstärkung benötigt wird
                        const backupReq = report.backupRequest;
                        if (backupReq) {
                          // 🚨 Authentischer Alarm bei Verstärkungsanforderung
                          realisticSoundManager.playQuattroneAlert(0.7);

                          return {
                            ...inc,
                            arrivedVehicles: inc.arrivedVehicles + 1,
                            initialReportGiven: true,
                            backupRequested: true,
                            backupFulfilled: false,
                            backupVehiclesNeeded: backupReq.additionalVehicles,
                            requiredVehicles: inc.requiredVehicles + backupReq.additionalVehicles, // Erhöhe Bedarf
                          };
                        }
                      }
                    }

                    return { ...inc, arrivedVehicles: inc.arrivedVehicles + 1, initialReportGiven: isFirstArrival };
                  }
                  return inc;
                })
              );

              // OPTIMIERUNG 2: Protocol-Log detaillierter (lstsim.de Style)
              addLog(`S-${vehicle.id.toString().padStart(2, '0')} S3→S4 Einsatzort erreicht`, 'arrival');

              // 📍 Fahrzeug-Status-Update bei Ankunft
              realisticSoundManager.playVehicleStatusUpdate();

              // 🚨 Stoppe Sirene bei Ankunft (sanftes Fade-Out)
              realisticSoundManager.stopSirene(vehicle.id);

              return {
                ...vehicle,
                position: parkedPosition, // Geparkte Position mit Offset
                status: 'S4', // Am Einsatzort
                processingStartTime: Date.now(),
                processingDuration: incident?.processingDuration || 180,
                routeProgress: 1,
                situationReportSent: false, // Reset für Lagemeldung
              };
            }

            // 🔒 FIX: Nur Position aktualisieren wenn noch unterwegs (nicht am Ziel)
            // Verhindert Zittern wenn routeProgress = 1 aber Status noch nicht gewechselt
            if (newProgress < 1) {
              const { position: newPosition, bearing: newBearing } = getPointAlongRoute(vehicle.route, newProgress);

              return {
                ...vehicle,
                position: newPosition,
                routeProgress: newProgress,
                bearing: newBearing,
                accumulatedTime: newAccumulatedTime,
              };
            }

            // Am Ziel angekommen aber noch nicht verarbeitet - behalte letzte Position
            return vehicle;
          }

          // S5: Sprechwunsch - Fahrzeug pausiert und wartet auf Bestätigung
          if (vehicle.status === 'S5') {
            // Fahrzeug bleibt stehen bis Sprechwunsch bestätigt wird
            // Nach Bestätigung kehrt es zum previousStatus zurück (S3, S4 oder S8)
            return vehicle;
          }

          // S4: Am Einsatzort - wait for processing to complete
          if (vehicle.status === 'S4' && vehicle.processingStartTime) {
            // Processing is handled in separate useEffect
            return vehicle;
          }

          // S7: Fahrt zur Tankstelle / Tanken
          if (vehicle.status === 'S7' && vehicle.route) {
            const accumulatedTime = vehicle.accumulatedTime || 0;
            const newAccumulatedTime = accumulatedTime + scaledDeltaTime;
            const newProgress = Math.min(newAccumulatedTime / vehicle.routeDuration, 1);

            // 🔒 FIX: Verhindere mehrfache Ausführung - nur wenn noch nicht S6
            if (newProgress >= 1 && vehicle.status === 'S7') {
              // Angekommen an Tankstelle → Tanken
              const tankCapacity = vehicleTypeConfigs[vehicle.vehicleType].tankCapacity;
              const refuelDuration = calculateRefuelDuration(vehicle.fuelLevel, tankCapacity);

              addLog(`⛽ Fahrzeug ${vehicle.id} tankt (Dauer: ${refuelDuration}s)`, 'system');

              // Setze Fahrzeug zu S6 mit Grund "Tanken"
              return {
                ...vehicle,
                status: 'S6',
                outOfServiceReason: 'Tanken',
                outOfServiceUntil: gameTime + refuelDuration,
                route: null,
                routeProgress: 0,
                accumulatedTime: 0,
              };
            }

            // 🔒 FIX: Nur Position aktualisieren wenn noch unterwegs (nicht an Tankstelle)
            if (newProgress < 1) {
              const { position: newPosition, bearing: newBearing } = getPointAlongRoute(vehicle.route, newProgress);

              return {
                ...vehicle,
                position: newPosition,
                routeProgress: newProgress,
                bearing: newBearing,
                accumulatedTime: newAccumulatedTime,
              };
            }

            // An Tankstelle angekommen aber noch nicht verarbeitet - behalte letzte Position
            return vehicle;
          }

          // S8: Rückfahrt zur Wache
          if (vehicle.status === 'S8' && vehicle.route) {
            // Use accumulated elapsed time instead of Date.now()
            const accumulatedTime = vehicle.accumulatedTime || 0;
            const newAccumulatedTime = accumulatedTime + scaledDeltaTime;
            const newProgress = Math.min(newAccumulatedTime / vehicle.routeDuration, 1);

            // 🔒 FIX: Verhindere mehrfache Ausführung - nur wenn noch nicht S2/S6/S7
            if (newProgress >= 1 && vehicle.status === 'S8') {
              // Arrived at station - change to S1
              const station = policeStations.find(s => s.id === vehicle.stationId);

              const routeDistance = vehicle.route?.length
                ? vehicle.route.reduce((total, point, index) => {
                    if (index === 0) return 0;
                    const prev = vehicle.route![index - 1];
                    return total + calculateDistance(
                      { lat: prev[0], lng: prev[1] },
                      { lat: point[0], lng: point[1] }
                    );
                  }, 0)
                : 0;

              // OPTIMIERUNG 2: Protocol-Log detaillierter (lstsim.de Style)
              addLog(`S-${vehicle.id.toString().padStart(2, '0')} S8→S2 An Wache`, 'completion');

              // ⚡ FUNKSPRUCH: S8 → S2 (Ankunft an Wache, wieder einsatzbereit)
              addRadioMessage(vehicle.id, 'S8', 'S2', {
                location: station?.name,
              });

              // ⚡ REALISTISCHE TIMINGS: Verbrauch berechnen
              const distanceKm = routeDistance / 1000; // Meter → Kilometer
              const timeDrivenHours = vehicle.routeDuration / 3600; // Sekunden → Stunden
              // 🚁 BUG FIX: Übergebe durationHours für Hubschrauber
              // 🎮 Phase 4: Schwierigkeitsgrad-Multiplikatoren anwenden
              const fuelConsumed = calculateFuelConsumption(
                vehicle,
                distanceKm,
                timeDrivenHours,
                settings.fuelConsumptionRate
              );
              const fatigueGained = calculateCrewFatigue(
                vehicle,
                timeDrivenHours,
                settings.crewFatigueRate
              );
              const newFuelLevel = Math.max(0, vehicle.fuelLevel - fuelConsumed);
              const newFatigue = Math.min(100, vehicle.crewFatigue + fatigueGained);
              const newMaintenance = updateMaintenanceStatus(vehicle, distanceKm);

              // Prüfe ob Fahrzeug zu S6 muss (Tanken/Pause/Reparatur)
              const updatedVehicle = {
                ...vehicle,
                fuelLevel: newFuelLevel,
                crewFatigue: newFatigue,
                maintenanceStatus: newMaintenance,
                totalDistanceTraveled: vehicle.totalDistanceTraveled + routeDistance,
              };

              const s6Reason = determineOutOfServiceReason(updatedVehicle);
              const shouldGoS6 = s6Reason !== null;

              // NEU: Prüfe ob Fahrzeug tanken muss (S7)
              if (shouldRefuel(updatedVehicle) && !shouldGoS6) {
                const nearestGasStation = findNearestGasStation(station ? station.position : vehicle.position, gasStations);

                if (nearestGasStation) {
                  // Fahrzeug muss tanken → Route zur Tankstelle (S7)
                  addLog(`⛽ Fahrzeug ${vehicle.id} muss tanken (${updatedVehicle.fuelLevel.toFixed(0)}%) → ${nearestGasStation.name}`, 'system');

                  // Berechne Route zur Tankstelle
                  const startPos = station ? station.position : vehicle.position;
                  const straightRoute = getStraightLineRoute(
                    { lat: startPos[0], lng: startPos[1] },
                    { lat: nearestGasStation.position[0], lng: nearestGasStation.position[1] }
                  );
                  const routeToGasStation = convertToLeafletFormat(straightRoute);
                  const distanceToGasStation = calculateDistance(
                    { lat: (station ? station.position : vehicle.position)[0], lng: (station ? station.position : vehicle.position)[1] },
                    { lat: nearestGasStation.position[0], lng: nearestGasStation.position[1] }
                  );
                  // ⚡ REALISTISCHE GESCHWINDIGKEITSBERECHNUNG (Fahrt zur Tankstelle ohne Eile)
                  const durationToGasStation = calculateRealisticRouteDuration(
                    vehicle.vehicleType,
                    distanceToGasStation,
                    weather.current,
                    updatedVehicle.crewFatigue,
                    false, // Keine Sonderrechte beim Tanken
                    gameSpeed // 🎮 BUG FIX: gameSpeed berücksichtigen
                  );

                  return {
                    ...updatedVehicle,
                    position: station ? station.position : vehicle.position,
                    assignedIncidentId: null,
                    routeIndex: 0,
                    route: routeToGasStation,
                    routeProgress: 0,
                    bearing: 0,
                    routeDuration: durationToGasStation,
                    routeStartTime: Date.now(),
                    status: 'S7',
                    processingStartTime: null,
                    processingDuration: 0,
                    accumulatedTime: 0,
                  };
                }
              }

              return {
                ...updatedVehicle,
                position: station ? station.position : vehicle.position,
                assignedIncidentId: null,
                routeIndex: 0,
                route: null,
                routeProgress: 0,
                bearing: 0,
                routeDuration: 0,
                routeStartTime: 0,
                status: shouldGoS6 ? 'S6' : 'S2',
                processingStartTime: null,
                processingDuration: 0,
                outOfServiceReason: shouldGoS6 ? s6Reason : null,
                outOfServiceUntil: shouldGoS6 ? calculateOutOfServiceDuration(s6Reason!, gameTime) : null,
              };
            }

            // 🔒 FIX: Nur Position aktualisieren wenn noch unterwegs (nicht an Wache)
            if (newProgress < 1) {
              const { position: newPosition, bearing: newBearing } = getPointAlongRoute(vehicle.route, newProgress);

              return {
                ...vehicle,
                position: newPosition,
                routeProgress: newProgress,
                bearing: newBearing,
                accumulatedTime: newAccumulatedTime,
              };
            }

            // An Wache angekommen aber noch nicht verarbeitet - behalte letzte Position
            return vehicle;
          }

          return vehicle;
        })
      );

      animationFrameId = requestAnimationFrame(animate);
    };

    // Starte Animation
    animationFrameId = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [gameStarted, isPaused, gameSpeed, incidents, vehicles]);

  // Handle S4 processing and transition to S8 (Optimierung: nur wenn Fahrzeuge am Einsatzort sind)
  useEffect(() => {
    if (!gameStarted) return;

    // Performance-Check: Nur laufen wenn Fahrzeuge Status S4 haben
    const hasProcessingVehicles = vehicles.some(v => v.status === 'S4');
    if (!hasProcessingVehicles) return;

    // 🎮 SPIELGESCHWINDIGKEIT: Intervall angepasst an gameSpeed
    const interval = setInterval(() => {
      setVehicles(prev =>
        prev.map(vehicle => {
          if (vehicle.status === 'S4' && vehicle.processingStartTime) {
            const currentTime = Date.now();
            // 🎮 SPIELGESCHWINDIGKEIT: Bearbeitungszeit wird mit gameSpeed multipliziert
            const processingElapsed = ((currentTime - vehicle.processingStartTime) / 1000) * gameSpeed;

            // ⚡ RÜCKMELDUNGS-SYSTEM: Lagemeldung nach 10-20 Sekunden (LST-SIM Style)
            if (!vehicle.situationReportSent && processingElapsed >= 10 && processingElapsed <= 20) {
              const incident = vehicle.assignedIncidentId ? getIncidentById(incidents, vehicle.assignedIncidentId) : undefined;
              if (incident) {
                // Generiere realistische Lagemeldung
                const situationReports = [
                  `Lage vor Ort bestätigt. ${incident.type}. Maßnahmen werden eingeleitet.`,
                  `Einsatzort erreicht. Situation wie gemeldet. Beginne mit Maßnahmen.`,
                  `Am Einsatzort. ${incident.type} bestätigt. Benötige ca. ${Math.ceil(vehicle.processingDuration / 60)} Minuten.`,
                  `Vor Ort. Lage entspricht Meldung. Weitere Updates folgen.`,
                ];
                const report = situationReports[Math.floor(Math.random() * situationReports.length)];

                addRadioMessage(vehicle.id, 'S4', 'S4', {
                  customMessage: report,
                  requiresResponse: false,
                });

                return { ...vehicle, situationReportSent: true };
              }
            }

            // ⚡ SPRECHWUNSCH-SYSTEM (S5): Nur EINE Einheit pro Einsatz darf Sprechwunsch abgeben
            // 🔒 BUG FIX #5: Erhöhte Chance und erweitertes Zeitfenster
            const currentIncident = vehicle.assignedIncidentId ? getIncidentById(incidents, vehicle.assignedIncidentId) : undefined;
            const processingProgress = processingElapsed / vehicle.processingDuration;
            if (
              currentIncident &&
              !currentIncident.speakRequestGiven && // Noch kein Sprechwunsch für diesen Einsatz
              processingProgress > 0.2 && // Früheres Zeitfenster: 20% statt 30%
              processingProgress < 0.7 && // Längeres Zeitfenster: 70% statt 60%
              !vehicle.speakRequest &&
              Math.random() < 0.025 // 🔒 Höhere Chance: 2.5% statt 1.2% (Ø nach 40s statt 83s)
            ) {
              // Bestimme Typ des Sprechwunsches basierend auf Situation
              let requestType: 'situation_report' | 'escalation' | 'backup_needed' | 'suspect_arrested' | 'additional_info' | 'unclear_situation';

              // Wenn Fahrzeuge fehlen -> Verstärkung
              if (currentIncident.arrivedVehicles < currentIncident.requiredVehicles) {
                requestType = Math.random() < 0.6 ? 'backup_needed' : 'escalation';
              }
              // Bei High Priority -> häufiger Eskalation oder Verstärkung
              else if (currentIncident.priority === 'high') {
                const rand = Math.random();
                if (rand < 0.3) requestType = 'escalation';
                else if (rand < 0.5) requestType = 'suspect_arrested';
                else if (rand < 0.7) requestType = 'situation_report';
                else requestType = 'additional_info';
              }
              // Normale Situationsberichte
              else {
                const rand = Math.random();
                if (rand < 0.4) requestType = 'situation_report';
                else if (rand < 0.6) requestType = 'unclear_situation';
                else if (rand < 0.8) requestType = 'additional_info';
                else requestType = 'suspect_arrested';
              }

              const reason = requestType === 'escalation' || requestType === 'backup_needed' ? 'backup' :
                            requestType === 'suspect_arrested' ? 'suspect_arrested' :
                            requestType === 'unclear_situation' ? 'unclear_situation' : 'additional_info';
              const message = speakRequestMessages[reason];

              // Markiere Incident als "Sprechwunsch gegeben"
              setIncidents(prev => prev.map(inc =>
                inc.id === currentIncident.id
                  ? { ...inc, speakRequestGiven: true }
                  : inc
              ));

              setVehicles(prevVehicles =>
                prevVehicles.map(v =>
                  v.id === vehicle.id
                    ? {
                        ...v,
                        status: 'S5' as VehicleStatus,
                        speakRequest: message,
                        speakRequestType: requestType,
                        previousStatus: 'S4', // Merke vorherigen Status
                      }
                    : v
                )
              );

              addLog(`S-${vehicle.id.toString().padStart(2, '0')} S4→S5 Sprechwunsch`, 'assignment');

              // 🔔 Context-basierte Sounds je nach Sprechwunsch-Typ
              realisticSoundManager.playSpeakRequestSound(requestType);

              return vehicle; // Behalte alten Status für diesen Frame
            }

            if (processingElapsed >= vehicle.processingDuration) {
              // Check if all required vehicles have arrived and processed
              const incident = vehicle.assignedIncidentId ? getIncidentById(incidents, vehicle.assignedIncidentId) : undefined;
              if (incident && incident.arrivedVehicles >= incident.requiredVehicles) {
                // All vehicles ready - start return trip
                const station = policeStations.find(s => s.id === vehicle.stationId);
                if (!station) return vehicle;

                // Get route back to station
                getRoute(
                  { lat: vehicle.position[0], lng: vehicle.position[1] },
                  { lat: station.position[0], lng: station.position[1] }
                ).then(osrmRoute => {
                  let returnRoute: [number, number][] | null = null;
                  let returnDuration = 240;

                  if (osrmRoute) {
                    returnRoute = convertToLeafletFormat(osrmRoute.coordinates);
                    returnDuration = osrmRoute.duration * 0.7;
                  } else {
                    returnRoute = getStraightLineRoute(
                      { lat: vehicle.position[0], lng: vehicle.position[1] },
                      { lat: station.position[0], lng: station.position[1] }
                    );
                    const returnDistance = calculateDistance(
                      { lat: vehicle.position[0], lng: vehicle.position[1] },
                      { lat: station.position[0], lng: station.position[1] }
                    );
                    returnDuration = Math.max(60, returnDistance / 20);
                  }

                  setVehicles(prevVehicles =>
                    prevVehicles.map(v =>
                      v.id === vehicle.id
                        ? {
                            ...v,
                            status: 'S8', // Rückfahrt zur Wache
                            route: returnRoute,
                            routeProgress: 0,
                            routeStartTime: Date.now(),
                            routeDuration: returnDuration,
                            accumulatedTime: 0,  // Reset für Rückfahrt
                          }
                        : v
                    )
                  );

                  // OPTIMIERUNG 2: Protocol-Log detaillierter (lstsim.de Style)
                  addLog(`S-${vehicle.id.toString().padStart(2, '0')} S4→S8 Rückkehr zur Wache`, 'completion');

                  // ✅ Audio-Feedback bei Einsatz-Abschluss
                  realisticSoundManager.playLeitstelleButtonBeep(0.5);

                  // ⚡ FUNKSPRUCH: S4 → S8 (Einsatz beendet, Rückkehr)
                  addRadioMessage(vehicle.id, 'S4', 'S8', {
                    location: station?.name,
                  });
                });
              }

              return vehicle;
            }
          }

          return vehicle;
        })
      );
    }, 1000 / gameSpeed); // 🎮 SPIELGESCHWINDIGKEIT: Intervall beschleunigt

    return () => clearInterval(interval);
  }, [gameStarted, gameSpeed, incidents, vehicles]);

  // Eskalations-System (Optimierung: nur wenn eskalationsfähige Einsätze vorhanden sind)
  useEffect(() => {
    if (!gameStarted) return;

    // Performance-Check: Nur laufen wenn eskalationsfähige Einsätze vorhanden sind
    const hasEscalatableIncidents = incidents.some(i => i.canEscalate && !i.hasEscalated);
    if (!hasEscalatableIncidents) return;

    // 🎮 SPIELGESCHWINDIGKEIT: Intervall beschleunigt
    const interval = setInterval(() => {
      setIncidents(prev =>
        prev.map(incident => {
          // 🎮 Prüfe ob Einsatz eskalieren soll (GAME-ZEIT basiert, in Sekunden)
          const currentGameSeconds = (gameTime * 60) + gameTimeSeconds;
          const elapsedGameSeconds = currentGameSeconds - incident.spawnTime;
          if (
            incident.canEscalate &&
            !incident.hasEscalated &&
            incident.escalationTime &&
            elapsedGameSeconds >= incident.escalationTime &&
            incident.assignedVehicleIds.length > 0 && // Nur wenn Fahrzeuge unterwegs
            (vehicles.some(v => v.assignedIncidentId === incident.id && (v.status === 'S3' || v.status === 'S4')))
          ) {
            const escalation = escalationRules[incident.type];
            if (escalation) {
              const newType = escalation.newType;
              const newPriority = escalation.newPriority;
              const escalatedIncidentType = incidentTypes.find(it => it.type === newType);

              if (escalatedIncidentType) {
                // Eskalations-Benachrichtigung
                realisticSoundManager.playQuattroneAlert(0.75);
                addLog(`⚠️ ESKALATION: ${incident.type} → ${newType} in ${incident.locationName}`, 'new');

                setToasts((prevToasts) => [
                  ...prevToasts,
                  {
                    id: toastCounter,
                    type: `⚠️ ESKALATION: ${newType}`,
                    location: incident.locationName,
                    priority: newPriority,
                    incidentId: incident.id,
                  },
                ]);
                setToastCounter((prev) => prev + 1);

                // Aktualisiere Einsatz
                return {
                  ...incident,
                  type: newType,
                  priority: newPriority,
                  description: `${escalatedIncidentType.description} - ${incident.locationName}`,
                  requiredVehicles: incident.requiredVehicles + 1,
                  timeRemaining: incident.timeRemaining + 30,
                  processingDuration: incidentProcessingTimes[newType] || incident.processingDuration,
                  hasEscalated: true,
                  canEscalate: false,
                };
              }
            }
          }

          return incident;
        })
      );
    }, 1000 / gameSpeed); // 🎮 SPIELGESCHWINDIGKEIT: Intervall beschleunigt

    return () => clearInterval(interval);
  }, [gameStarted, gameSpeed, vehicles, incidents]);

  // Incident completion check (Optimierung: nur wenn aktive Einsätze vorhanden sind)
  useEffect(() => {
    if (!gameStarted || isPaused) return;

    // Performance-Check: Nur laufen wenn Einsätze vorhanden sind
    if (incidents.length === 0) return;

    // 🎮 SPIELGESCHWINDIGKEIT: Intervall beschleunigt
    const interval = setInterval(() => {
      setIncidents(prev => {
        const updated = prev.map(incident => {
          // Check if all required vehicles have arrived
          if (incident.arrivedVehicles >= incident.requiredVehicles) {
            // KRITISCHER BUGFIX (lstsim.de Style): Einsatz ist ERST abgeschlossen wenn ALLE Fahrzeuge in S8 sind!
            const incidentVehicles = vehicles.filter(v => v.assignedIncidentId === incident.id);

            // 🔒 DEADLOCK-FIX: S5-Fahrzeuge (Sprechwunsch) als "returning" betrachten
            // Wenn ein Fahrzeug S5 ist, aber previousStatus = 'S4' hat, würde es nach Bestätigung
            // automatisch zu S8 wechseln. Das darf den Einsatzabschluss nicht blockieren.
            const allReturning = incidentVehicles.every(v =>
              v.status === 'S8' ||
              (v.status === 'S5' && v.previousStatus === 'S4') // S5 von S4 aus = wird zu S8
            );

            if (allReturning && incidentVehicles.length > 0) {
              // All vehicles are returning - mark as completed (Option A)
              // 🎮 SPIELGESCHWINDIGKEIT: Response time mit gameSpeed multipliziert
              const responseTime = ((Date.now() - incident.spawnTime) / 1000) * gameSpeed;
              const points = incident.priority === 'high' ? 30 : incident.priority === 'medium' ? 20 : 10;
              const bonus = incident.requiredVehicles > 1 ? incident.requiredVehicles * 10 : 0;

              // ✨ OPTION A: Setze Status auf 'completed' statt Einsatz zu löschen
              if (incident.status !== 'completed') {
                setScore(s => s + points + bonus);

                setStatistics(prev => ({
                  ...prev,
                  totalResolved: prev.totalResolved + 1,
                  totalResponseTimes: [...prev.totalResponseTimes, responseTime],
                  incidentsByType: {
                    ...prev.incidentsByType,
                    [incident.type]: (prev.incidentsByType[incident.type] || 0) + 1,
                  },
                  currentStreak: prev.currentStreak + 1,
                  bestStreak: Math.max(prev.bestStreak, prev.currentStreak + 1),
                  totalDistance: prev.totalDistance + vehicles.reduce((sum, v) => sum + v.totalDistanceTraveled, 0),
                }));

                // Erfolgs-Sound bleibt synthetisch (da keine authentische Alternative)
                htmlAudioManager.playSuccessChime();
                addLog(`Einsatz ${incident.type} in ${incident.locationName} erfolgreich abgeschlossen (+${points + bonus} Punkte)`, 'completion');

                return {
                  ...incident,
                  status: 'completed',
                  completedAt: Date.now(), // 🕐 ECHTE ZEIT für Auto-Cleanup (nicht Spielzeit!)
                  pointsAwarded: points + bonus
                };
              }
            }
          }

          // Decrement timer if not all vehicles assigned
          // 🎮 SPIELGESCHWINDIGKEIT: Timer mit gameSpeed multipliziert
          if (needsMoreVehicles(incident)) {
            return { ...incident, timeRemaining: incident.timeRemaining - gameSpeed };
          }

          return incident;
        }).map(i => {
          // ✨ OPTION A: Markiere fehlgeschlagene Einsätze als 'failed'
          if (i && i.timeRemaining <= 0 && i.status !== 'failed') {
            setStatistics(prev => ({
              ...prev,
              totalFailed: prev.totalFailed + 1,
              currentStreak: 0,
            }));
            htmlAudioManager.playFailureSound();
            addLog(`Einsatz ${i.type} in ${i.locationName} fehlgeschlagen (Zeit abgelaufen)`, 'failed');

            return {
              ...i,
              status: 'failed',
              completedAt: Date.now() // 🕐 ECHTE ZEIT für Auto-Cleanup (nicht Spielzeit!)
            };
          }
          return i;
        }).filter(i => i !== null) as Incident[];

        return updated;
      });
    }, 1000 / gameSpeed); // 🎮 SPIELGESCHWINDIGKEIT: Intervall beschleunigt

    return () => clearInterval(interval);
  }, [gameStarted, isPaused, gameSpeed, vehicles, incidents]);

  // ✨ OPTION A: Auto-Cleanup für abgeschlossene/fehlgeschlagene Einsätze nach einer gewissen Zeit
  useEffect(() => {
    if (!gameStarted || isPaused) return;

    // Performance-Check: Nur laufen wenn abgeschlossene Einsätze vorhanden sind
    const hasCompletedIncidents = incidents.some(i => i.status === 'completed' || i.status === 'failed');
    if (!hasCompletedIncidents) return;

    // Prüfe regelmäßig, ob Einsätze entfernt werden sollen
    const interval = setInterval(() => {
      const now = Date.now();
      const AUTO_REMOVE_DELAY_COMPLETED = 60000; // 60 Sekunden ECHTE ZEIT für abgeschlossene Einsätze
      const AUTO_REMOVE_DELAY_FAILED = 30000; // 30 Sekunden ECHTE ZEIT für fehlgeschlagene Einsätze

      setIncidents(prev => {
        return prev.filter(incident => {
          // Behalte aktive Einsätze
          if (incident.status !== 'completed' && incident.status !== 'failed') {
            return true;
          }

          // Fehlgeschlagene Einsätze: Entferne nach 30 Sekunden echter Zeit (unabhängig von Fahrzeugstatus)
          if (incident.status === 'failed' && incident.completedAt) {
            const timeElapsed = now - incident.completedAt; // Millisekunden seit Abschluss
            if (timeElapsed >= AUTO_REMOVE_DELAY_FAILED) {
              addLog(`Fehlgeschlagener Einsatz "${incident.type}" wurde aus der Liste entfernt`, 'system');
              return false; // Entfernen
            }
          }

          // Abgeschlossene Einsätze: Entferne nach 60 Sekunden echter Zeit, aber nur wenn Fahrzeuge zurück sind
          if (incident.status === 'completed' && incident.completedAt) {
            const timeElapsed = now - incident.completedAt; // Millisekunden seit Abschluss
            if (timeElapsed >= AUTO_REMOVE_DELAY_COMPLETED) {
              const incidentVehicles = vehicles.filter(v => v.assignedIncidentId === incident.id);
              const allAtStation = incidentVehicles.every(v => v.status === 'S2');

              if (allAtStation || incidentVehicles.length === 0) {
                addLog(`Einsatz "${incident.type}" wurde aus der Liste entfernt`, 'system');
                return false; // Entfernen
              }
            }
          }

          return true; // Behalten
        });
      });
    }, 5000); // Prüfe alle 5 Sekunden (echte Zeit, nicht Spielzeit)

    return () => clearInterval(interval);
  }, [gameStarted, isPaused, vehicles, incidents]);

  // Generate new incidents periodically (lstsim.de style: based on incidents per hour)
  // BUGFIX: Memory Leak behoben - setTimeout Cleanup hinzugefügt
  useEffect(() => {
    if (!gameStarted) return;

    const settings = getDifficultySettings();
    let isCancelled = false; // Flag um Timeout-Kette zu stoppen
    const timeouts: ReturnType<typeof setTimeout>[] = []; // Array für alle aktiven Timeouts

    // lstsim.de: Berechne Intervall basierend auf Einsätzen pro Stunde
    // Formel: (3600 Sekunden / Einsätze pro Stunde) × Zufallsfaktor (0.7-1.3)
    const baseInterval = (3600 / settings.incidentsPerHour) * 1000; // In Millisekunden

    const scheduleNextIncident = () => {
      if (isCancelled) return; // Stoppe wenn cancelled

      // ⏰ REALISTISCHE TAGESZEIT-MULTIPLIKATOREN (LST-SIM Style)
      const hour = Math.floor(gameTime / 60);
      let timeMultiplier = 1.0;

      if (hour >= 0 && hour < 6) {
        // Nacht (0-6 Uhr): Deutlich weniger Einsätze
        timeMultiplier = 1.8; // 1.8x Intervall = ~0.56x Einsätze
      } else if (hour >= 6 && hour < 8) {
        // Früher Morgen (6-8 Uhr): Leicht erhöht
        timeMultiplier = 1.2; // ~0.83x Einsätze
      } else if (hour >= 8 && hour < 10) {
        // Morgendliche Rush Hour (8-10 Uhr): Deutlich mehr Verkehrsunfälle
        timeMultiplier = 0.5; // 2x mehr Einsätze
      } else if (hour >= 10 && hour < 12) {
        // Vormittag (10-12 Uhr): Normal
        timeMultiplier = 0.9;
      } else if (hour >= 12 && hour < 14) {
        // Mittagszeit (12-14 Uhr): Erhöht
        timeMultiplier = 0.8; // ~1.25x Einsätze
      } else if (hour >= 14 && hour < 17) {
        // Nachmittag (14-17 Uhr): Normal
        timeMultiplier = 1.0;
      } else if (hour >= 17 && hour < 20) {
        // Abendliche Rush Hour (17-20 Uhr): Peak!
        timeMultiplier = 0.45; // ~2.2x mehr Einsätze
      } else if (hour >= 20 && hour < 22) {
        // Abend (20-22 Uhr): Erhöht (Nightlife beginnt)
        timeMultiplier = 0.7; // ~1.4x Einsätze
      } else {
        // Späte Nacht (22-24 Uhr): Weniger, aber mehr Nightlife-Einsätze
        timeMultiplier = 1.3; // ~0.77x Einsätze
      }

      // ⚡ WETTER-EFFEKT: Mehr Einsätze bei schlechtem Wetter
      const weatherMultiplier = 1 / weatherConditions[weather.current].incidentMultiplier;
      // z.B. Regen (1.2x Einsätze) = 1/1.2 = 0.83 (kürzeres Intervall)

      // 🎲 KONTROLLIERTE VARIATION: Zufälliger Faktor (0.7-1.4 für Spielbarkeit!)
      const randomFactor = 0.7 + Math.random() * 0.7;

      // Berechne nächstes Intervall (MIT TAGESZEIT, WETTER, SPIELGESCHWINDIGKEIT und Variation!)
      // 🎮 SPIELGESCHWINDIGKEIT: Einsätze kommen gameSpeed-mal schneller
      const nextInterval = (baseInterval * timeMultiplier * weatherMultiplier * randomFactor) / gameSpeed;

      const timeout = setTimeout(() => {
        if (!isCancelled && incidents.length < settings.maxIncidents) {
          generateIncident();
        }
        scheduleNextIncident(); // Schedule next incident
      }, nextInterval);

      timeouts.push(timeout);
    };

    // 🎲 Start initial incident mit kontrollierter Variation
    // Erster Einsatz kommt schneller (30-80% des Base-Intervalls)
    // 🎮 SPIELGESCHWINDIGKEIT: Initial delay beschleunigt
    const initialDelay = (baseInterval * (0.3 + Math.random() * 0.5)) / gameSpeed; // 30-80% of base interval
    const initialTimeout = setTimeout(() => {
      if (!isCancelled) {
        generateIncident();
        scheduleNextIncident();
      }
    }, initialDelay);

    timeouts.push(initialTimeout);

    // Cleanup: Stoppe alle Timeouts wenn Component unmounted oder gameStarted/gameSpeed sich ändert
    return () => {
      isCancelled = true;
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [gameStarted, gameSpeed]);

  // Game time progression (mit Geschwindigkeit und Pause)
  useEffect(() => {
    console.log(`⏰ Zeit-Effect: gameStarted=${gameStarted}, isPaused=${isPaused}, gameSpeed=${gameSpeed}`);

    if (!gameStarted || isPaused) {
      console.log(`⏰ Zeit-Effect gestoppt (gameStarted=${gameStarted}, isPaused=${isPaused})`);
      return;
    }

    // 🎮 SEKUNDEN-basierter Timer: 1 Spielsekunde = (1000ms / gameSpeed)
    // Bei 1x: 1000ms, 2x: 500ms, 3x: 333ms, 4x: 250ms
    const secondInterval = 1000 / gameSpeed;
    console.log(`⏰ Starte Sekunden-Timer: ${secondInterval}ms (gameSpeed=${gameSpeed})`);

    const interval = setInterval(() => {
      incrementGameTimeSeconds(); // Erhöht Sekunden, bei 60 -> automatisch +1 Minute
    }, secondInterval);

    return () => {
      console.log(`⏰ Stoppe Zeit-Intervall`);
      clearInterval(interval);
    };
  }, [gameStarted, gameSpeed, isPaused]);

  // 🚔 PATROL SYSTEM: Update patrol movement and check for discoveries
  useEffect(() => {
    if (!gameStarted || isPaused) return;

    // Performance-Check: Nur laufen wenn Fahrzeuge auf Streife sind
    const hasPatrollingVehicles = vehicles.some(v => v.isOnPatrol && v.patrolRoute);
    if (!hasPatrollingVehicles) return;

    const hour = Math.floor(gameTime / 60);
    const now = Date.now();

    // Update interval: 100ms für flüssige Bewegung
    const interval = setInterval(() => {
      setVehicles(prev =>
        prev.map(vehicle => {
          // Nur Fahrzeuge auf Streife updaten
          if (!vehicle.isOnPatrol || !vehicle.patrolRoute) return vehicle;

          const route = vehicle.patrolRoute;
          const deltaTime = 0.1 * gameSpeed; // 100ms in Sekunden, angepasst an gameSpeed

          // Update movement
          const movement = updatePatrolMovement(vehicle, route, deltaTime, gameSpeed);

          // Route completed?
          if (movement.routeCompleted) {
            // 🎲 RANDOM PATROL: Generiere neue Route statt Streife zu beenden!
            console.log(`[PATROL] ${vehicle.callsign} beendet Route, generiere neue...`);

            // Generiere asynchron neue Route (non-blocking)
            (async () => {
              try {
                const newRouteResult = await startPatrol(
                  vehicle,
                  gameTime,
                  hour,
                  weather.current,
                  'random' // ✅ Immer Random-Patrol für Abwechslung!
                );

                if (newRouteResult.success && newRouteResult.route) {
                  // Update Vehicle mit neuer Route
                  setVehicles(prev => prev.map(v => {
                    if (v.id === vehicle.id) {
                      return {
                        ...v,
                        patrolRoute: newRouteResult.route,
                        patrolTotalDistance: v.patrolTotalDistance || 0, // Distanz beibehalten
                      };
                    }
                    return v;
                  }));

                  addLog(`🎲 ${vehicle.callsign || `FZ-${vehicle.id}`} fährt neue Streifenroute in ${newRouteResult.route.areaName}`, 'system');
                } else {
                  // Fehler bei Route-Generierung → Streife beenden
                  console.warn(`[PATROL] Neue Route konnte nicht generiert werden: ${newRouteResult.error}`);
                  setVehicles(prev => prev.map(v => {
                    if (v.id === vehicle.id) {
                      return {
                        ...v,
                        isOnPatrol: false,
                        patrolRoute: null,
                        patrolStartTime: null,
                      };
                    }
                    return v;
                  }));
                  addLog(`${vehicle.callsign || `FZ-${vehicle.id}`} beendet Streife (keine neue Route verfügbar)`, 'system');
                }
              } catch (error) {
                console.error('[PATROL] Fehler bei neuer Route:', error);
              }
            })();

            // Fahrzeug bleibt auf Streife, aber pausiert kurz während neue Route geladen wird
            return vehicle;
          }

          // Check for discovery (nur alle 60 Sekunden)
          let discovery: PatrolDiscovery | null = null;
          if (now - vehicle.patrolLastDiscoveryCheck > 60000) {
            discovery = checkForDiscovery(vehicle, route, hour, now, vehicle.patrolLastDiscoveryCheck);
          }

          // Discovery gefunden? -> Erstelle Call
          if (discovery) {
            // Generiere neuen Call aus Discovery
            const newCall: Call = {
              id: Date.now(),
              type: discovery.type,
              position: discovery.position,
              priority: discovery.priority,
              description: discovery.description,
              locationName: route.areaName,
              timestamp: Date.now(),
              answered: false,
              callerType: discovery.discoveryMethod === 'witness' ? 'Zeuge' : 'Beobachtung',
              callerText: discovery.description,
              status: 'waiting',
            };

            setCalls(prevCalls => [...prevCalls, newCall]);

            // 📊 Update discovery statistics
            setStatistics(prev => ({
              ...prev,
              totalDiscoveries: (prev.totalDiscoveries ?? 0) + 1,
            }));

            // Toast für Entdeckung
            setToasts((prevToasts) => [
              ...prevToasts,
              {
                id: toastCounter,
                type: `🔍 ENTDECKUNG: ${discovery.type}`,
                location: route.areaName,
                priority: discovery.priority,
                incidentId: 0, // Kein Incident-ID da noch Call
              },
            ]);
            setToastCounter((prev) => prev + 1);

            // Sound
            realisticSoundManager.playQuattroneAlert(0.5);
            addLog(`🔍 ${vehicle.callsign || `FZ-${vehicle.id}`} entdeckt: ${discovery.type} in ${route.areaName}`, 'new');
          }

          // Update vehicle mit neuer Position und Ressourcen
          const fuelConsumed = calculatePatrolFuelConsumption(vehicle, movement.distanceTraveled);
          const fatigueIncrease = calculatePatrolFatigue(vehicle, deltaTime);

          // Update patrolRoute mit neuem waypoint index
          const updatedRoute = {
            ...route,
            currentWaypointIndex: movement.newWaypointIndex,
          };

          return {
            ...vehicle,
            position: movement.newPosition,
            patrolRoute: updatedRoute,
            fuelLevel: Math.max(0, vehicle.fuelLevel - fuelConsumed),
            crewFatigue: Math.min(100, vehicle.crewFatigue + fatigueIncrease),
            patrolTotalDistance: vehicle.patrolTotalDistance + movement.distanceTraveled,
            patrolLastDiscoveryCheck: discovery ? now : vehicle.patrolLastDiscoveryCheck,
            totalDistanceTraveled: vehicle.totalDistanceTraveled + movement.distanceTraveled,
          };
        })
      );
    }, 100); // 100ms für flüssige Bewegung

    return () => clearInterval(interval);
  }, [gameStarted, isPaused, gameSpeed, vehicles, gameTime]);

  // 🚔 AUTO-SCROLL: Scrolle zu ausgewähltem Fahrzeug in der Liste
  useEffect(() => {
    if (selectedVehicleId) {
      const element = document.getElementById(`vehicle-list-item-${selectedVehicleId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }
  }, [selectedVehicleId]);

  // KRITISCHER FIX: RadioMessages Cleanup (verhindert Memory Leak)
  // Behalte nur die letzten 100 Nachrichten ODER Nachrichten der letzten 30 Minuten
  useEffect(() => {
    if (!gameStarted) return;

    // 🎮 SPIELGESCHWINDIGKEIT: Intervall beschleunigt
    const interval = setInterval(() => {
      setRadioMessages(prev => {
        // Behalte maximal 100 Nachrichten
        const MAX_MESSAGES = 100;

        // Entferne Nachrichten die älter als 30 Minuten sind
        const MAX_AGE_MINUTES = 30;
        const cutoffTime = gameTime - MAX_AGE_MINUTES;

        let filtered = prev.filter(msg => {
          // Parse Timestamp (Format: "HH:MM")
          const [msgHours, msgMinutes] = msg.timestamp.split(':').map(Number);
          const msgTimeInMinutes = msgHours * 60 + msgMinutes;

          // Behalte Nachrichten die nicht zu alt sind
          return msgTimeInMinutes >= cutoffTime;
        });

        // Wenn immer noch zu viele, behalte nur die neuesten 100
        if (filtered.length > MAX_MESSAGES) {
          filtered = filtered.slice(-MAX_MESSAGES);
        }

        return filtered;
      });
    }, 60000 / gameSpeed); // 🎮 SPIELGESCHWINDIGKEIT: Prüfintervall beschleunigt (jede Spielminute)

    return () => clearInterval(interval);
  }, [gameStarted, gameSpeed, gameTime]);

  // KRITISCHER FIX: Call Auto-Timeout (verhindert überfüllte Call-Liste)
  // Lehne automatisch Calls ab die 5 Minuten lang nicht beantwortet wurden
  useEffect(() => {
    if (!gameStarted || isPaused) return;

    // 🎮 SPIELGESCHWINDIGKEIT: Intervall beschleunigt
    const interval = setInterval(() => {
      const now = Date.now();
      // 🎮 SPIELGESCHWINDIGKEIT: Timeout mit gameSpeed multipliziert
      const CALL_TIMEOUT_MS = (5 * 60 * 1000) / gameSpeed; // 5 Minuten in Millisekunden

      setCalls(prev => {
        const timedOutCalls = prev.filter(call =>
          !call.answered &&
          call.status === 'waiting' &&
          (now - call.timestamp) > CALL_TIMEOUT_MS
        );

        // Log für jeden abgelaufenen Call
        timedOutCalls.forEach(call => {
          addLog(`⚠️ Anruf verfallen: ${call.type} in ${call.locationName} (5 Min keine Reaktion)`, 'failed');
          // Failure-Sound bleibt synthetisch
          htmlAudioManager.playFailureSound();
        });

        // Entferne abgelaufene Calls
        return prev.filter(call =>
          call.answered ||
          call.status !== 'waiting' ||
          (now - call.timestamp) <= CALL_TIMEOUT_MS
        );
      });
    }, 30000 / gameSpeed); // 🎮 SPIELGESCHWINDIGKEIT: Prüfintervall beschleunigt

    return () => clearInterval(interval);
  }, [gameStarted, isPaused, gameSpeed]);

  // ⚡ LST-SIM STYLE: Prüfe ob Verstärkung disponiert wurde
  // Verwende useRef um bereits erfüllte Verstärkungen zu tracken und infinite loop zu vermeiden
  const fulfilledBackupIncidents = useRef<Set<number>>(new Set());

  useEffect(() => {
    if (!gameStarted) return;

    // Prüfe nur Incidents die noch nicht als fulfilled markiert wurden
    const incidentsNeedingCheck = incidents.filter(
      inc => inc.backupRequested && !inc.backupFulfilled && inc.backupVehiclesNeeded && !fulfilledBackupIncidents.current.has(inc.id)
    );

    if (incidentsNeedingCheck.length === 0) return;

    const updatedIncidents = incidentsNeedingCheck.filter(inc => {
      // Zähle wie viele Fahrzeuge zusätzlich zugewiesen wurden
      const additionalAssigned = inc.assignedVehicleIds.length - (inc.requiredVehicles - inc.backupVehiclesNeeded);
      return additionalAssigned >= inc.backupVehiclesNeeded;
    });

    // Nur updaten wenn wirklich etwas geändert werden muss
    if (updatedIncidents.length > 0) {
      setIncidents(prev =>
        prev.map(inc => {
          const shouldFulfill = updatedIncidents.find(u => u.id === inc.id);
          if (shouldFulfill) {
            fulfilledBackupIncidents.current.add(inc.id);
            addLog(`✓ Verstärkung disponiert: ${inc.backupVehiclesNeeded} zusätzliche Einheit(en) für ${inc.type}`, 'assignment');
            return { ...inc, backupFulfilled: true };
          }
          return inc;
        })
      );
    }
  }, [incidents, gameStarted]);

  // Berechnete Werte MÜSSEN VOR allen useEffects stehen die sie verwenden
  // WICHTIG: Fallback für gameTime, falls undefined (sollte nicht passieren, aber sicher ist sicher)
  const safeGameTime = (gameTime !== undefined && !isNaN(gameTime))
    ? gameTime
    : (selectedTime !== undefined && !isNaN(selectedTime))
      ? (selectedTime * 60)
      : 480; // Fallback auf 8:00 Uhr (8 * 60 = 480 Minuten)
  const { hours } = getHoursAndMinutes(safeGameTime);
  // 🎮 Uhrzeit mit Sekunden: HH:MM:SS
  const hours24 = Math.floor(safeGameTime / 60);
  const minutes = Math.floor(safeGameTime % 60);
  const formattedTime = `${hours24.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${gameTimeSeconds.toString().padStart(2, '0')}`;

  // Weather change logic - MUSS VOR if (!gameStarted) sein
  useEffect(() => {
    if (!gameStarted || isPaused || safeGameTime === undefined) return;

    const checkWeatherChange = () => {
      if (safeGameTime >= weather.nextChange) {
        const newWeather = weather.forecast;
        const duration = getWeatherDuration(newWeather);
        const forecast = getNextWeather(newWeather, hours);

        setWeather({
          current: newWeather,
          duration,
          nextChange: safeGameTime + duration,
          forecast,
        });

        addLog(`Wetter ändert sich: ${weatherConditions[newWeather].name}`, 'new' as const);
      }
    };

    checkWeatherChange();
  }, [safeGameTime, gameStarted, isPaused, weather, hours, setWeather, addLog]);

  // Auto-Assign: Automatische Fahrzeugempfehlung basierend auf Smart Assignment
  const autoAssignVehicles = (callId: number): number[] => {
    const call = calls.find(c => c.id === callId);
    if (!call) return [];

    const incidentType = incidentTypes.find(it => it.type === call.type);
    if (!incidentType) return [];

    // Erstelle temporären Incident für Bewertung
    const tempIncident: Incident = {
      id: 0, type: call.type, position: call.position, assignedVehicleIds: [],
      priority: call.priority, description: call.description, timeRemaining: 60,
      locationName: call.locationName, spawnTime: (gameTime * 60) + gameTimeSeconds, // 🎮 GAME-ZEIT in Sekunden
      requiredVehicles: incidentType.requiredVehicles, arrivedVehicles: 0,
      processingDuration: 180, canEscalate: false, escalationTime: null,
      hasEscalated: false, isMANV: false, involvedCount: 0, withSpecialRights: true,
      speakRequestGiven: false,
      backupRequested: false,
      backupFulfilled: false,
      backupVehiclesNeeded: 0,
      initialReportGiven: false,
    };

    const { recommended } = getAutoAssignmentRecommendations(
      vehicles.filter(v => isVehicleAvailable(v)),
      tempIncident
    );
    return recommended.map(r => r.vehicleId);
  };

  // Get status badge color and text (lstsim.de Style - ERWEITERT)
  const getStatusBadge = (status: VehicleStatus) => {
    const badges: Record<string, { color: string; text: string; short: string }> = {
      'S1': { color: '#30D158', text: 'S1 Frei auf Funk', short: 'S1' }, // Legacy
      'S2': { color: '#30D158', text: 'S2 Frei auf Wache', short: 'S2' },
      'S3': { color: '#FF9F0A', text: 'S3 Anfahrt', short: 'S3' },
      'S4': { color: '#FF453A', text: 'S4 Einsatzort', short: 'S4' },
      'S5': { color: '#0A84FF', text: 'S5 Sprechwunsch', short: 'S5' },
      'S6': { color: '#8E8E93', text: 'S6 Nicht einsatzbereit', short: 'S6' },
      'S7': { color: '#FFC107', text: 'S7 Tanken', short: 'S7' },
      'S8': { color: '#FFD60A', text: 'S8 Rückfahrt', short: 'S8' },
    };
    return badges[status as string] || { color: '#8E8E93', text: 'Unbekannt', short: '??' };
  };

  if (!gameStarted) {
    return (
      <div className="start-screen-apple">
        {/* Hero Section - Optimized for Z-Pattern */}
        <div className="hero-section">
          <div className="hero-content">
            <div className="hero-logo-wrapper">
              <div className="hero-logo-glow"></div>
              <img src="/polizeistern-hessen.svg" alt="Polizei Hessen" className="hero-logo" />
            </div>
            <h1 className="hero-title">Polizei Hessen</h1>
            <p className="hero-subtitle">Einsatzleitsystem Frankfurt am Main</p>
            <p className="hero-description">
              Koordiniere Einsätze, verwalte Einheiten und sorge für Sicherheit in der Stadt
            </p>
          </div>
        </div>

        {/* Content Container - F-Pattern Layout */}
        <div className="apple-content-wrapper">
          <div className="apple-content-container">

            {/* Primary CTA - Quick Start Section */}
            <div className="quick-start-section glass">
              <div className="quick-start-content">
                <div className="quick-start-left">
                  <h2 className="quick-start-title">Schnellstart</h2>
                  <p className="quick-start-description">
                    Starte sofort mit empfohlenen Einstellungen
                  </p>
                  <div className="quick-start-info">
                    <span className="info-item">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z" fill="currentColor" opacity="0.3"/>
                        <path d="M8 4v4l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                      </svg>
                      {selectedTime.toString().padStart(2, '0')}:00 Uhr
                    </span>
                    <span className="info-item">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 2L10 6h4l-3 3 1 4-4-2-4 2 1-4-3-3h4l2-4z" fill="currentColor"/>
                      </svg>
                      {difficulty}
                    </span>
                  </div>
                </div>
                <button
                  className="quick-start-button"
                  onClick={() => policeStations[0] && startGame(policeStations[0].id)}
                >
                  <span className="button-text">Spiel starten</span>
                  <svg className="button-arrow" width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M7 4l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Settings Section - Progressive Disclosure */}
            <div className="settings-section">
              <button
                className="settings-toggle"
                onClick={(e) => {
                  const settingsContent = e.currentTarget.nextElementSibling;
                  settingsContent?.classList.toggle('expanded');
                  e.currentTarget.classList.toggle('active');
                }}
              >
                <span className="settings-toggle-text">Einstellungen anpassen</span>
                <svg className="settings-chevron" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>

              <div className="settings-expandable">
                <div className="settings-cards">
              {/* Difficulty Card */}
              <div className="setting-card glass">
                <h3 className="setting-card-title">Schwierigkeitsgrad</h3>
                <div className="difficulty-selector">
                  <button
                    className={`difficulty-option ${difficulty === 'Leicht' ? 'selected' : ''}`}
                    onClick={() => setDifficulty('Leicht')}
                  >
                    <span className="option-label">Leicht</span>
                    <span className="option-description">Ideal für Einsteiger</span>
                  </button>
                  <button
                    className={`difficulty-option ${difficulty === 'Mittel' ? 'selected' : ''}`}
                    onClick={() => setDifficulty('Mittel')}
                  >
                    <span className="option-label">Mittel</span>
                    <span className="option-description">Ausgewogene Herausforderung</span>
                  </button>
                  <button
                    className={`difficulty-option ${difficulty === 'Schwer' ? 'selected' : ''}`}
                    onClick={() => setDifficulty('Schwer')}
                  >
                    <span className="option-label">Schwer</span>
                    <span className="option-description">Für Profis</span>
                  </button>
                </div>
              </div>

              {/* Time Card */}
              <div className="setting-card glass">
                <h3 className="setting-card-title">Schichtbeginn</h3>
                <div className="time-selector">
                  <button
                    className="time-selector-button"
                    onClick={() => setIsTimeDropdownOpen(!isTimeDropdownOpen)}
                  >
                    <span className="time-display">{selectedTime.toString().padStart(2, '0')}:00</span>
                    <span className="time-label">Uhr</span>
                    <svg className={`chevron ${isTimeDropdownOpen ? 'open' : ''}`} width="14" height="8" viewBox="0 0 14 8" fill="none">
                      <path d="M1 1L7 7L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  {isTimeDropdownOpen && (
                    <div className="time-dropdown-menu glass">
                      <div className="time-options">
                        {Array.from({ length: 24 }, (_, i) => (
                          <button
                            key={i}
                            className={`time-option ${selectedTime === i ? 'selected' : ''}`}
                            onClick={() => {
                              setSelectedTime(i);
                              setIsTimeDropdownOpen(false);
                            }}
                          >
                            {i.toString().padStart(2, '0')}:00
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
              </div>
            </div>

            {/* Stations Section - Secondary Action */}
            <div className="stations-container">
              <div className="stations-header">
                <h2 className="stations-title">Oder wähle ein spezifisches Revier</h2>
                <span className="stations-badge">{policeStations.length} verfügbar</span>
              </div>

              <div className="stations-grid-apple">
                {policeStations.map((station, index) => (
                  <button
                    key={station.id}
                    className="station-tile glass"
                    onClick={() => startGame(station.id)}
                    aria-label={`Revier ${station.name} auswählen`}
                    style={{ animationDelay: `${index * 0.03}s` }}
                  >
                    <div className="station-tile-icon">
                      <img src="/polizeistern-hessen.svg" alt="" width="28" height="28" />
                    </div>
                    <span className="station-tile-name">{station.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Achievements - Bottom */}
            {achievements.filter(a => a.unlocked).length > 0 && (
              <div className="achievements-container glass">
                <div className="achievements-header-apple">
                  <h3 className="achievements-title-apple">Deine Erfolge</h3>
                  <span className="achievements-badge-apple">
                    {achievements.filter(a => a.unlocked).length} von {achievements.length} freigeschaltet
                  </span>
                </div>
                <div className="achievements-list">
                  {achievements.map(achievement => (
                    <div
                      key={achievement.id}
                      className={`achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`}
                      title={achievement.description}
                      role="img"
                      aria-label={achievement.unlocked ? `Erfolg freigeschaltet: ${achievement.description}` : 'Erfolg gesperrt'}
                    >
                      <span className="achievement-emoji">{achievement.icon}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  const selectedStationData = policeStations.find(s => s.id === selectedStation);

  // Bestimme automatisch Dark Mode basierend auf Tageszeit
  const isDarkMode = hours >= 20 || hours < 6;

  // Immer OpenStreetMap verwenden
  const mapTileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const mapAttribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  // Count vehicles by status for filter display
  const vehicleStatusCounts = {
    S1: vehicles.filter(v => v.status === 'S1').length,
    S2: vehicles.filter(v => v.status === 'S2').length,
    S3: vehicles.filter(v => v.status === 'S3').length,
    S4: vehicles.filter(v => v.status === 'S4').length,
    S5: vehicles.filter(v => v.status === 'S5').length,
    S6: vehicles.filter(v => v.status === 'S6').length,
    S7: vehicles.filter(v => v.status === 'S7').length,
    S8: vehicles.filter(v => v.status === 'S8').length,
  };

  return (
    <div className="app">
      {/* NEW LAYOUT: Map on left, right panel split into vehicles (top) and calls (bottom) */}
      <div className="main-layout">
        {/* LEFT: Full Map */}
        <div className="map-container">
          {/* Wetter-Overlay */}
          {weather.current !== 'sunny' && (
            <div className={`weather-overlay ${getWeatherOverlayClass(weather.current)}`} />
          )}
          <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            className={isDarkMode ? 'map-dark-google' : ''}
          >
            <MapCenterUpdater center={mapCenter} zoom={mapZoom} />
            <TileLayer
              attribution={mapAttribution}
              url={mapTileUrl}
              maxZoom={20}
            />

            {/* Police Stations - Toggle via Legende */}
            {showPoliceStations && policeStations.length > 0 && policeStations.map(station => (
              <Marker
                key={`station-${station.id}`}
                position={station.position}
                icon={STATION_ICON}
              >
                <Popup>{station.name}</Popup>
              </Marker>
            ))}

            {/* Gas Stations - Toggle via Legende */}
            {showGasStations && gasStations.map(station => (
              <Marker
                key={`gas-${station.id}`}
                position={station.position}
                icon={createGasStationIcon(station.brand)}
              >
                <Popup>
                  <strong>⛽ {station.name}</strong><br/>
                  {station.brand}
                </Popup>
              </Marker>
            ))}

            {incidents.map(incident => {
              // 🎮 Berechne wie lange der Einsatz schon aktiv ist (GAME-ZEIT basiert, präzise in Sekunden)
              const currentGameSeconds = (gameTime * 60) + gameTimeSeconds;
              const elapsedTotalSeconds = Math.floor(currentGameSeconds - incident.spawnTime);
              const elapsedMinutes = Math.floor(elapsedTotalSeconds / 60);
              const elapsedSeconds = elapsedTotalSeconds % 60;
              const displayTime = elapsedMinutes > 0
                ? `${elapsedMinutes} Min ${elapsedSeconds}s`
                : `${elapsedTotalSeconds}s`;

              return (
                <Marker
                  key={incident.id}
                  position={incident.position}
                  icon={createIncidentIcon(incident.priority, incident.hasEscalated, incident.type, incident.status || 'active')}
                >
                  <Popup>
                    <strong>{incident.type}</strong>
                    {incident.status === 'completed' && <span style={{ color: '#30D158', marginLeft: '8px' }}>✓ ABGESCHLOSSEN</span>}
                    {incident.status === 'failed' && <span style={{ color: '#FF453A', marginLeft: '8px' }}>✕ FEHLGESCHLAGEN</span>}
                    {incident.hasEscalated && incident.status !== 'completed' && incident.status !== 'failed' && <span style={{ color: '#FF453A', marginLeft: '8px' }}>⚠️ ESKALIERT</span>}
                    <br />
                    {incident.description}
                    <br />
                    Aktiv seit: {displayTime}
                    <br />
                    Bearbeitung: {Math.floor(incident.processingDuration / 60)} Min
                    {incident.pointsAwarded && <><br />Punkte: +{incident.pointsAwarded}</>}
                  </Popup>
                </Marker>
              );
            })}

            {vehicles
              .filter(vehicle => {
                // Verstecke Fahrzeuge an der Wache (S2 - Frei auf Wache)
                if (vehicle.status === 'S2') return false;
                // Verstecke S3-Fahrzeuge die noch nicht losgefahren sind
                // (S3 ohne Route ODER S3 mit Route aber noch kein Fortschritt)
                if (vehicle.status === 'S3' && (!vehicle.route || vehicle.routeProgress === 0)) return false;
                // Zeige alle anderen
                return true;
              })
              .map(vehicle => {
              // Calculate display position with offset for overlapping vehicles
              const displayPosition = getDisplayPosition(vehicle, vehicles, policeStations);

              return (
                <React.Fragment key={vehicle.id}>
                  <VehicleMarker
                    position={displayPosition}
                    hasSpecialRights={vehicle.assignedIncidentId ? (getIncidentById(incidents, vehicle.assignedIncidentId)?.withSpecialRights ?? true) : true}
                    bearing={vehicle.bearing}
                    status={vehicle.status}
                    vehicle={vehicle}
                    onHover={() => setHoveredVehicleId(vehicle.id)}
                    onHoverEnd={() => setHoveredVehicleId(null)}
                    onClick={() => {
                      setMapCenter(vehicle.position);
                      setMapZoom(17);
                      setSelectedVehicleId(vehicle.id);
                      realisticSoundManager.playButtonClick();
                    }}
                  />

                  {/* Route nur anzeigen bei Hover über Fahrzeug-Grafik oder Fahrzeugliste */}
                  {vehicle.route && vehicle.route.length > 0 && hoveredVehicleId === vehicle.id && (
                    <Polyline
                      positions={vehicle.route}
                      color={(() => {
                        const statusColors: Record<VehicleStatus, string> = {
                          'S1': '#30D158',  // Grün - Bereit
                          'S2': '#FFD60A',  // Gelb - Alarmiert
                          'S3': '#FF9F0A',  // Orange - Anfahrt
                          'S4': '#FF453A',  // Rot - Am Einsatzort
                          'S5': '#0A84FF',  // Blau - Sprechwunsch
                          'S6': '#8E8E93',  // Grau - Nicht einsatzbereit
                          'S7': '#BF5AF2',  // Lila - Pause
                          'S8': '#0A84FF',  // Blau - Rückfahrt
                        };
                        return statusColors[vehicle.status] || '#0A84FF';
                      })()}
                      weight={4}
                      opacity={0.7}
                    />
                  )}

                  {/* 🚔 PATROL ROUTE: Zeige Streifenroute (gestrichelt, auf echten Straßen) */}
                  {vehicle.isOnPatrol && vehicle.patrolRoute && hoveredVehicleId === vehicle.id && (
                    <Polyline
                      positions={vehicle.patrolRoute.fullRoute}
                      color="#30D158"
                      weight={3}
                      opacity={0.6}
                      dashArray="10, 10"
                    />
                  )}
                </React.Fragment>
              );
            })}
          </MapContainer>
        </div>

        {/* RIGHT: Three-Column Layout wie lstsim.de */}
        <div className="right-panel-lstsim">
          {/* LEFT COLUMN: Fahrzeuge */}
          <div className="vehicle-list-panel">
            <div className="panel-header">
              <h3>Fahrzeuge</h3>
              <div className="vehicle-filters">
                <button
                  className={`filter-btn ${vehicleFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('all')}
                  title="Alle Fahrzeuge"
                >
                  ● ({vehicles.length})
                </button>
                <button
                  className={`filter-btn ${vehicleFilter === 'S1' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('S1')}
                  title="S1 - Bereit"
                  style={{ color: '#30D158' }}
                >
                  ● ({vehicleStatusCounts.S1 || 0})
                </button>
                <button
                  className={`filter-btn ${vehicleFilter === 'S2' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('S2')}
                  title="S2 - Frei auf Wache"
                  style={{ color: '#FFD60A' }}
                >
                  ● ({vehicleStatusCounts.S2 || 0})
                </button>
                <button
                  className={`filter-btn ${vehicleFilter === 'S3' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('S3')}
                  title="S3 - Anfahrt"
                  style={{ color: '#FF9F0A' }}
                >
                  ● ({vehicleStatusCounts.S3 || 0})
                </button>
                <button
                  className={`filter-btn ${vehicleFilter === 'S4' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('S4')}
                  title="S4 - Einsatzort"
                  style={{ color: '#FF453A' }}
                >
                  ● ({vehicleStatusCounts.S4 || 0})
                </button>
                <button
                  className={`filter-btn ${vehicleFilter === 'S5' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('S5')}
                  title="S5 - Sprechwunsch"
                  style={{ color: '#0A84FF' }}
                >
                  ● ({vehicleStatusCounts.S5 || 0})
                </button>
                <button
                  className={`filter-btn ${vehicleFilter === 'S6' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('S6')}
                  title="S6 - Nicht einsatzbereit"
                  style={{ color: '#8E8E93' }}
                >
                  ● ({vehicleStatusCounts.S6 || 0})
                </button>
                <button
                  className={`filter-btn ${vehicleFilter === 'S7' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('S7')}
                  title="S7 - Zur Tankstelle"
                  style={{ color: '#FFD60A' }}
                >
                  ● ({vehicleStatusCounts.S7 || 0})
                </button>
                <button
                  className={`filter-btn ${vehicleFilter === 'S8' ? 'active' : ''}`}
                  onClick={() => setVehicleFilter('S8')}
                  title="S8 - Rückfahrt"
                  style={{ color: '#0A84FF' }}
                >
                  ● ({vehicleStatusCounts.S8 || 0})
                </button>
              </div>
            </div>
            <div className="panel-content">
              {(() => {
                const filteredVehicles = [...vehicles]
                  .filter(v => vehicleFilter === 'all' || v.status === vehicleFilter)
                  .sort((a, b) => {
                    const statusOrder: { [key in VehicleStatus]: number } = { S1: 1, S2: 2, S3: 3, S4: 4, S5: 5, S6: 6, S7: 7, S8: 8 };
                    return statusOrder[a.status] - statusOrder[b.status];
                  });

                if (filteredVehicles.length === 0) {
                  return (
                    <div className="empty-state-modern">
                      <div className="empty-state-icon">🚓</div>
                      <div className="empty-state-title">Keine Fahrzeuge</div>
                      <div className="empty-state-subtitle">
                        {vehicleFilter === 'all' ? 'Keine Fahrzeuge verfügbar' : `Keine Fahrzeuge mit Status ${vehicleFilter}`}
                      </div>
                    </div>
                  );
                }

                return filteredVehicles.map(vehicle => {
                  const statusInfo = getStatusBadge(vehicle.status);
                  const incident = vehicle.assignedIncidentId ? getIncidentById(incidents, vehicle.assignedIncidentId) : undefined;
                  const vehicleConfig = vehicleTypeConfigs[vehicle.vehicleType];
                  const canStartPatrol = vehicle.status === 'S2' && !vehicle.isOnPatrol && vehicle.fuelLevel > 20;

                  return (
                    <div
                      key={vehicle.id}
                      id={`vehicle-list-item-${vehicle.id}`}
                      className={`vehicle-list-item ${selectedVehicleId === vehicle.id ? 'selected' : ''}`}
                      onClick={() => {
                        setMapCenter(vehicle.position);
                        setMapZoom(17);
                        setSelectedVehicleId(vehicle.id);
                        realisticSoundManager.playButtonClick();
                      }}
                      onMouseEnter={() => setHoveredVehicleId(vehicle.id)}
                      onMouseLeave={() => setHoveredVehicleId(null)}
                    >
                      <div className="vehicle-list-header">
                        <div className="vehicle-list-left">
                          <span className="vehicle-icon">{vehicleConfig.icon}</span>
                          <span className="vehicle-name">{vehicle.callsign}</span>
                          <span className="vehicle-status-badge" style={{ background: statusInfo.color }}>
                            {statusInfo.short}
                          </span>
                        </div>
                        <div className="vehicle-list-right">
                          {canStartPatrol && (
                            <button
                              className="patrol-quick-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPatrolModalVehicleId(vehicle.id);
                              }}
                              title="Streifengebiet wählen"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M8 1v14M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                <circle cx="8" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
                              </svg>
                            </button>
                          )}
                          {vehicle.isOnPatrol && (
                            <button
                              className="patrol-quick-btn active"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStopPatrol(vehicle.id);
                              }}
                              title="Streife beenden"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <rect x="4" y="4" width="8" height="8" rx="1" fill="currentColor"/>
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="vehicle-list-status-line">
                        <span className="vehicle-status-text">{statusInfo.text}</span>
                      </div>

                      <div className="vehicle-list-info">
                        <div className="vehicle-info-item" title={`Tankfüllung: ${Math.round(vehicle.fuelLevel)}%`}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <rect x="3" y="4" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
                            <rect x="3" y={14 - (vehicle.fuelLevel / 100 * 10)} width="8" height={vehicle.fuelLevel / 100 * 10} fill={vehicle.fuelLevel > 30 ? '#30D158' : vehicle.fuelLevel > 15 ? '#FFD60A' : '#FF453A'} />
                            <path d="M11 7h2v4h-2" stroke="currentColor" strokeWidth="1.5"/>
                          </svg>
                          <span style={{ color: vehicle.fuelLevel > 30 ? '#30D158' : vehicle.fuelLevel > 15 ? '#FFD60A' : '#FF453A' }}>
                            {Math.round(vehicle.fuelLevel)}%
                          </span>
                        </div>

                        <div className="vehicle-info-item" title={`Crew-Müdigkeit: ${Math.round(vehicle.crewFatigue)}%`}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.5"/>
                            <path d="M5 7h2M9 7h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                            <path d="M5 10.5q1.5-1 3-1t3 1" stroke={vehicle.crewFatigue > 70 ? '#FF453A' : vehicle.crewFatigue > 40 ? '#FFD60A' : '#30D158'} strokeWidth="1.5" strokeLinecap="round"/>
                          </svg>
                          <span style={{ color: vehicle.crewFatigue > 70 ? '#FF453A' : vehicle.crewFatigue > 40 ? '#FFD60A' : '#30D158' }}>
                            {Math.round(vehicle.crewFatigue)}%
                          </span>
                        </div>

                        <div className="vehicle-info-item" title={`Wartung: ${vehicle.maintenanceStatus === 'ok' ? 'OK' : vehicle.maintenanceStatus === 'warning' ? 'Wartung bald' : 'Wartung dringend'}`}>
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                            <path d="M8 3v2m0 6v2m5-5h-2m-6 0H3m8.5-3.5l-1.4 1.4m-4.2 4.2l-1.4 1.4m7-1.4l-1.4-1.4m-4.2-4.2L4.5 4.5" stroke={vehicle.maintenanceStatus === 'ok' ? '#30D158' : vehicle.maintenanceStatus === 'warning' ? '#FFD60A' : '#FF453A'} strokeWidth="1.5" strokeLinecap="round"/>
                            <circle cx="8" cy="8" r="2" fill={vehicle.maintenanceStatus === 'ok' ? '#30D158' : vehicle.maintenanceStatus === 'warning' ? '#FFD60A' : '#FF453A'}/>
                          </svg>
                          <span style={{ color: vehicle.maintenanceStatus === 'ok' ? '#30D158' : vehicle.maintenanceStatus === 'warning' ? '#FFD60A' : '#FF453A' }}>
                            {vehicle.maintenanceStatus === 'ok' ? 'OK' : vehicle.maintenanceStatus === 'warning' ? 'Bald' : 'Dringend'}
                          </span>
                        </div>

                        {vehicle.isOnPatrol && vehicle.patrolTotalDistance > 0 && (
                          <div className="vehicle-info-item" title={`Strecke auf Streife: ${vehicle.patrolTotalDistance.toFixed(1)} km`}>
                            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                              <path d="M2 8h12M8 2l4 6-4 6-4-6z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                            <span>{vehicle.patrolTotalDistance.toFixed(1)} km</span>
                          </div>
                        )}
                      </div>

                      {incident && (
                        <div className="vehicle-list-incident">
                          {incident.type} • {incident.locationName}
                        </div>
                      )}
                      {vehicle.isOnPatrol && vehicle.patrolRoute && (
                        <div className="vehicle-list-patrol">
                          Streife • {vehicle.patrolRoute.areaName}
                        </div>
                      )}
                      {vehicle.status === 'S8' && vehicle.canBeRedirected && (
                        <div className="vehicle-redirect-hint">
                          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" style={{ marginRight: '4px' }}>
                            <path d="M12 4a4 4 0 0 0-8 0v4L2 6m10 6a4 4 0 0 1-8 0V8l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          Kann umgeleitet werden
                        </div>
                      )}
                    </div>
                  );
                });
              })()}

              {/* Selected Vehicle Details */}
              {selectedVehicleId && vehicles.find(v => v.id === selectedVehicleId) && (
                <VehicleDetails
                  vehicle={vehicles.find(v => v.id === selectedVehicleId)!}
                  onShiftChange={(oldVehicle, newVehicle) => {
                    setVehicles(prev => prev.map(v =>
                      v.id === oldVehicle.id ? newVehicle : v
                    ));
                    setGameTime(t => t + 5); // Schichtwechsel dauert 5 Minuten
                  }}
                  onAddLog={(message) => addLog(message, 'system')}
                  gameTime={gameTime}
                  onClose={() => setSelectedVehicleId(null)}
                  onStartPatrol={handleStartPatrol}
                  onStopPatrol={handleStopPatrol}
                />
              )}
            </div>
          </div>

          {/* MIDDLE COLUMN: Einsätze (lstsim.de Style) */}
          <div className="incidents-panel-lstsim">
            <div className="panel-header">
              <h3>Einsätze</h3>
              <div className="vehicle-filters">
                <button
                  className={`filter-btn ${incidentFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setIncidentFilter('all')}
                  title="Alle Einsätze"
                >
                  Alle ({incidents.length})
                </button>
                <button
                  className={`filter-btn ${incidentFilter === 'active' ? 'active' : ''}`}
                  onClick={() => setIncidentFilter('active')}
                  title="Nur aktive Einsätze"
                  style={{ color: '#0A84FF' }}
                >
                  ● ({incidents.filter(i => !i.status || i.status === 'active').length})
                </button>
                <button
                  className={`filter-btn ${incidentFilter === 'completed' ? 'active' : ''}`}
                  onClick={() => setIncidentFilter('completed')}
                  title="Nur abgeschlossene Einsätze"
                  style={{ color: '#30D158' }}
                >
                  ✓ ({incidents.filter(i => i.status === 'completed').length})
                </button>
                <button
                  className={`filter-btn ${incidentFilter === 'failed' ? 'active' : ''}`}
                  onClick={() => setIncidentFilter('failed')}
                  title="Nur fehlgeschlagene Einsätze"
                  style={{ color: '#FF453A' }}
                >
                  ✕ ({incidents.filter(i => i.status === 'failed').length})
                </button>
              </div>
            </div>
            <div className="panel-content">
              {(() => {
                // Filtere Einsätze basierend auf dem aktiven Filter
                const filteredIncidents = incidents.filter(incident => {
                  if (incidentFilter === 'all') return true;
                  if (incidentFilter === 'active') return !incident.status || incident.status === 'active';
                  return incident.status === incidentFilter;
                });

                if (filteredIncidents.length === 0) {
                  return (
                    <div className="empty-state-modern">
                      <div className="empty-state-icon">📋</div>
                      <div className="empty-state-title">
                        {incidentFilter === 'all' && 'Keine Einsätze'}
                        {incidentFilter === 'active' && 'Keine aktiven Einsätze'}
                        {incidentFilter === 'completed' && 'Keine abgeschlossenen Einsätze'}
                        {incidentFilter === 'failed' && 'Keine fehlgeschlagenen Einsätze'}
                      </div>
                      <div className="empty-state-subtitle">
                        {incidentFilter === 'all' && 'Warte auf eingehende Notrufe'}
                        {incidentFilter === 'active' && 'Alle Einsätze abgeschlossen'}
                        {incidentFilter === 'completed' && 'Noch keine Einsätze erfolgreich abgeschlossen'}
                        {incidentFilter === 'failed' && 'Noch keine Einsätze fehlgeschlagen'}
                      </div>
                    </div>
                  );
                }

                return filteredIncidents.map(incident => {
                const minETA = calculateMinETA(incident, vehicles);
                const assignedVehicles = vehicles.filter(v => incident.assignedVehicleIds.includes(v.id));

                // 🎮 Berechne wie lange der Einsatz schon aktiv ist (GAME-ZEIT basiert, präzise in Sekunden)
                const currentGameSeconds = (gameTime * 60) + gameTimeSeconds;
                const elapsedTimeSeconds = Math.floor(currentGameSeconds - incident.spawnTime);
                const elapsedMinutes = Math.floor(elapsedTimeSeconds / 60);
                const elapsedSecondsDisplay = elapsedTimeSeconds % 60;
                const elapsedTimeDisplay = elapsedMinutes > 0
                  ? `${elapsedMinutes}:${elapsedSecondsDisplay.toString().padStart(2, '0')}`
                  : `${elapsedTimeSeconds}s`;

                return (
                  <div key={incident.id} className={`incident-card-lstsim priority-${incident.priority} ${incident.status === 'completed' ? 'status-completed' : ''} ${incident.status === 'failed' ? 'status-failed' : ''}`}>
                    <div className="incident-card-header">
                      <div className="incident-card-title">
                        {incident.status === 'completed' && <span className="status-badge completed-badge">✓</span>}
                        {incident.status === 'failed' && <span className="status-badge failed-badge">✕</span>}
                        {incident.hasEscalated && !incident.status && <span className="escalation-badge">!</span>}
                        <strong>{incident.type}</strong>
                        <span className={`priority-badge-lstsim priority-${incident.priority}`}>
                          {getIncidentPriorityText(incident.priority)}
                        </span>
                      </div>
                      <span className="time-remaining-large" title={`Aktiv seit ${elapsedTimeDisplay}`}>
                        {incident.status === 'completed' ? `+${incident.pointsAwarded || 0}` : elapsedTimeDisplay}
                      </span>
                    </div>

                    <div className="incident-location-lstsim">
                      {incident.locationName}
                      {incident.status === 'completed' && <span style={{ marginLeft: '8px', color: '#30D158', fontWeight: 'bold' }}>ERLEDIGT</span>}
                      {incident.status === 'failed' && <span style={{ marginLeft: '8px', color: '#FF453A', fontWeight: 'bold' }}>FEHLGESCHLAGEN</span>}
                    </div>

                    {/* MANV Progress-Bar */}
                    {incident.isMANV && (
                      <div className="manv-progress-container">
                        <div className="manv-progress-label">
                          🚨 MANV-Sichtung: {incident.manvTriageProgress || 0}%
                        </div>
                        <div className="manv-progress-bar">
                          <div
                            className="manv-progress-fill"
                            style={{ width: `${incident.manvTriageProgress || 0}%` }}
                          >
                            {incident.manvTriageProgress && incident.manvTriageProgress > 20 ? `${Math.round(incident.manvTriageProgress)}%` : ''}
                          </div>
                        </div>
                        <div className="manv-info">
                          Beteiligte: {incident.involvedCount || 0} • Vor Ort: {incident.arrivedVehicles}/{incident.requiredVehicles}
                        </div>
                      </div>
                    )}

                    <div className="incident-status-row">
                      <span>Fahrzeuge: {incident.arrivedVehicles}/{incident.requiredVehicles}</span>
                      {minETA > 0 && <span>ETA: {Math.ceil(minETA)} Min</span>}
                      <button
                        className="map-center-btn"
                        onClick={() => { setMapCenter(incident.position); setMapZoom(16); }}
                        title="Auf Karte zentrieren und heranzoomen"
                      >
                        ⊕
                      </button>
                    </div>

                    {/* Zugewiesene Fahrzeuge */}
                    {assignedVehicles.length > 0 && (
                      <div className="assigned-vehicles-list">
                        {assignedVehicles.map(v => {
                          const config = vehicleTypeConfigs[v.vehicleType];
                          const statusInfo = getStatusBadge(v.status);
                          return (
                            <div key={v.id} className="assigned-vehicle-chip">
                              {config.icon} {v.callsign || `FZ${v.id}`} <span style={{color: statusInfo.color}}>●</span>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ⚡ LST-SIM STYLE: Verstärkungsanforderung */}
                    {incident.backupRequested && !incident.backupFulfilled && (
                      <div className="backup-request-warning">
                        <span className="backup-icon">⚠️</span>
                        <span className="backup-text">
                          Verstärkung angefordert: <strong>+{incident.backupVehiclesNeeded} Einheit(en)</strong> benötigt
                        </span>
                      </div>
                    )}

                    {incident.backupRequested && incident.backupFulfilled && (
                      <div className="backup-fulfilled">
                        <span className="backup-icon">✓</span>
                        <span className="backup-text">Verstärkung disponiert</span>
                      </div>
                    )}

                    {/* Weitere Fahrzeuge Button - öffnet Modal */}
                    <button
                      className="backup-button"
                      onClick={() => requestBackup(incident.id)}
                      title="Weitere Fahrzeuge zuweisen"
                    >
                      + Weitere Fahrzeuge
                    </button>
                  </div>
                );
              });
              })()}
            </div>
          </div>

          {/* RIGHT COLUMN: Funkverkehr (Funksprüche & Sprechwünsche kombiniert) */}
          <div className="calls-and-speaks-panel">
            {/* Kombiniertes Funkverkehr-Fenster */}
            <div className="radio-section-combined">
              <div className="panel-header-small">
                <h4>📻 Funkverkehr</h4>
                <span className="radio-count-badge">
                  {radioMessages.length} Meldungen
                  {vehicles.filter(v => v.status === 'S5').length > 0 && (
                    <span className="speak-request-indicator"> • {vehicles.filter(v => v.status === 'S5').length} Sprechwunsch</span>
                  )}
                </span>
              </div>
              <div className="panel-content-small radio-combined-content">
                {/* Sprechwünsche oben (wichtig) - MINIMALISTISCH */}
                {vehicles.filter(v => v.status === 'S5').map(vehicle => {
                  const config = vehicleTypeConfigs[vehicle.vehicleType];
                  return (
                    <div
                      key={vehicle.id}
                      className="speak-request-compact"
                      onClick={() => {
                        setSelectedSpeakRequestVehicle(vehicle);
                        setIsSpeakRequestModalOpen(true);
                        realisticSoundManager.playButtonClick();
                      }}
                      title="Klicken für Details"
                    >
                      <span className="speak-indicator">🔵</span>
                      <span className="speak-callsign">{config.icon} {vehicle.callsign}</span>
                      <span className="speak-label">Sprechwunsch</span>
                    </div>
                  );
                })}

                {/* Funksprüche darunter */}
                <RadioLog
                  messages={radioMessages}
                  onRespond={(messageId) => {
                    const message = radioMessages.find(m => m.id === messageId);
                    if (message && message.vehicleId) {
                      const hours = Math.floor(gameTime / 60);
                      const minutes = Math.floor(gameTime % 60);
                      const seconds = gameTimeSeconds;
                      const timestamp = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

                      const responseId = radioMessageIdRef.current++;
                      const responseMessage: RadioMessage = {
                        id: responseId,
                        timestamp,
                        message: 'Verstanden',
                        type: 'outgoing',
                        requiresResponse: false,
                      };
                      setRadioMessages(prev => [...prev, responseMessage]);
                    }
                  }}
                />
              </div>
            </div>

            {/* Anrufe Section */}
            <div className="calls-section">
              <div className="panel-header-small">
                <h4>Anrufe</h4>
                <button className="new-call-btn-small" onClick={() => generateCall()}>+</button>
              </div>
              <div className="panel-content-small">
                {calls.length === 0 && (
                  <div className="empty-state-modern">
                    <div className="empty-state-icon">📞</div>
                    <div className="empty-state-title">Keine Anrufe</div>
                    <div className="empty-state-subtitle">Derzeit ruhig in der Leitstelle</div>
                  </div>
                )}
                {calls.map(call => {
                  const timeAgo = Math.floor((Date.now() - call.timestamp) / 1000);

                  // Wartezeit-basierte Klasse
                  let waitTimeClass = 'wait-time-normal';
                  if (timeAgo > 120) {
                    waitTimeClass = 'wait-time-critical'; // 2+ Minuten - ROT + Pulsieren
                  } else if (timeAgo > 60) {
                    waitTimeClass = 'wait-time-urgent'; // 1-2 Minuten - ORANGE
                  } else if (timeAgo > 30) {
                    waitTimeClass = 'wait-time-warning'; // 30-60s - GELB
                  }

                  // Neu eingetroffene Anrufe blinken (erste 5 Sekunden)
                  const isNew = timeAgo < 5;

                  return (
                    <div
                      key={call.id}
                      className={`call-item-lstsim ${waitTimeClass} ${isNew ? 'call-new' : ''}`}
                    >
                      <div className="call-header-lstsim">
                        <span className="call-time-lstsim">{timeAgo}s</span>
                        <span className={`call-priority-badge priority-${call.priority}`}>
                          {call.priority === 'high' ? 'DRINGEND' : call.priority === 'medium' ? 'NORMAL' : 'NIEDRIG'}
                        </span>
                      </div>
                      <div className="call-type-lstsim">{call.type}</div>
                      <div className="call-location-lstsim">{call.locationName}</div>
                      <button
                        className="accept-call-btn-lstsim"
                        onClick={() => openCallModal(call.id)}
                      >
                        Anruf annehmen
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM BAR: Minimalistisches Design */}
      <div className="bottom-bar">
        <div className="bottom-bar-left">
          <span className="time-text" title="Aktuelle Spielzeit">{formattedTime}</span>
          <WeatherDisplay weather={weather} gameTime={safeGameTime} />
          <span className="score-text" title="Punktestand">{score}</span>

          {/* Map-Legende */}
          <div className="map-legend-inline">
            <button
              className={`legend-toggle ${showPoliceStations ? 'active' : ''}`}
              onClick={() => setShowPoliceStations(!showPoliceStations)}
              title="Polizeiwachen ein-/ausblenden"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </button>
            <button
              className={`legend-toggle ${showGasStations ? 'active' : ''}`}
              onClick={() => setShowGasStations(!showGasStations)}
              title="Tankstellen ein-/ausblenden"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 3h10v18H3z"/>
                <path d="M13 8h3l3 3v6a2 2 0 0 1-2 2h-1"/>
                <circle cx="8" cy="18" r="2"/>
                <rect x="5" y="6" width="6" height="4"/>
              </svg>
            </button>
          </div>
        </div>
        <div className="bottom-bar-center">
          <span className="station-name">{selectedStationData?.name}</span>
        </div>
        <div className="bottom-bar-right">
          <div className="speed-controls">
            <button
              className={`speed-btn ${gameSpeed === 1 && !isPaused ? 'active' : ''}`}
              onClick={() => { setGameSpeed(1); setIsPaused(false); }}
              title="Normale Geschwindigkeit"
            >
              1×
            </button>
            <button
              className={`speed-btn ${gameSpeed === 2 && !isPaused ? 'active' : ''}`}
              onClick={() => { setGameSpeed(2); setIsPaused(false); }}
              title="Doppelte Geschwindigkeit"
            >
              2×
            </button>
            <button
              className={`speed-btn ${gameSpeed === 3 && !isPaused ? 'active' : ''}`}
              onClick={() => { setGameSpeed(3); setIsPaused(false); }}
              title="Dreifache Geschwindigkeit"
            >
              3×
            </button>
            <button
              className={`speed-btn ${gameSpeed === 4 && !isPaused ? 'active' : ''}`}
              onClick={() => { setGameSpeed(4); setIsPaused(false); }}
              title="Vierfache Geschwindigkeit"
            >
              4×
            </button>
          </div>
          <button
            className={`pause-btn ${isPaused ? 'active' : ''}`}
            onClick={() => setIsPaused(!isPaused)}
            title={isPaused ? 'Spiel fortsetzen' : 'Spiel pausieren'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
          <button className="footer-btn" onClick={() => setShowGameSettings(true)} title="Spiel- und Sound-Einstellungen">
            ⚙️ Einstellungen
          </button>
          <button className="footer-btn" onClick={() => setShowStatsModal(true)}>
            Statistik
          </button>
          <button className="footer-btn" onClick={() => setShowProtocolPanel(true)} title="Einsatzprotokoll öffnen (Tastenkürzel: L)">
            Protokoll
          </button>
        </div>
      </div>

      {/* Toast-Benachrichtigungen deaktiviert - Anrufe blinken stattdessen im Anruf-Bereich */}

      {showAchievementToast && (
        <div style={{
          position: 'fixed',
          top: '70px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#30d158',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          zIndex: 2000,
          fontSize: '15px',
          fontWeight: '600',
          animation: 'slideIn 0.3s ease-out',
        }}>
          {showAchievementToast.icon} {showAchievementToast.title} freigeschaltet!
        </div>
      )}

      <CompactErrorBoundary componentName="Statistik-Modal">
        <StatisticsModal
          isOpen={showStatsModal}
          onClose={() => setShowStatsModal(false)}
          stats={statistics}
        />
      </CompactErrorBoundary>

      <CompactErrorBoundary componentName="Anruf-Modal">
        <CallModal
          call={selectedCall ? calls.find(c => c.id === selectedCall.id) || selectedCall : null}
          isOpen={isCallModalOpen}
          onClose={() => {
            setIsCallModalOpen(false);
            setSelectedCall(null);
          }}
          onAccept={acceptCall}
          onReject={rejectCall}
          availableVehicles={vehicles.filter(v => isVehicleAvailable(v))}
          onAutoAssign={autoAssignVehicles}
          onDialogResponse={handleDialogResponse}
        />
      </CompactErrorBoundary>

      <CompactErrorBoundary componentName="Verstärkung-Modal">
        <BackupModal
          incident={selectedIncidentForBackup}
          isOpen={isBackupModalOpen}
          onClose={() => {
            setIsBackupModalOpen(false);
            setSelectedIncidentForBackup(null);
          }}
          onConfirm={confirmBackup}
          availableVehicles={vehicles.filter(v =>
            isVehicleAvailable(v) &&
            !selectedIncidentForBackup?.assignedVehicleIds.includes(v.id)
          )}
        />
      </CompactErrorBoundary>

      <CompactErrorBoundary componentName="Streifengebiet-Modal">
        {patrolModalVehicleId && (
          <PatrolAreaSelector
            isOpen={patrolModalVehicleId !== null}
            onClose={() => setPatrolModalVehicleId(null)}
            onSelectArea={(areaId) => {
              handleStartPatrol(patrolModalVehicleId, areaId);
              setPatrolModalVehicleId(null);
            }}
            vehicleCallsign={vehicles.find(v => v.id === patrolModalVehicleId)?.callsign || `FZ-${patrolModalVehicleId}`}
            currentHour={Math.floor(gameTime / 60)}
          />
        )}
      </CompactErrorBoundary>

      {isSpeakRequestModalOpen && selectedSpeakRequestVehicle && (
        <CompactErrorBoundary componentName="Sprechwunsch-Modal">
          <SpeakRequestModal
            vehicle={selectedSpeakRequestVehicle}
            incident={selectedSpeakRequestVehicle.assignedIncidentId ? getIncidentById(incidents, selectedSpeakRequestVehicle.assignedIncidentId) : null}
            requestType={selectedSpeakRequestVehicle.speakRequestType || 'situation_report'}
            onClose={() => {
              setIsSpeakRequestModalOpen(false);
              setSelectedSpeakRequestVehicle(null);
            }}
            onConfirm={() => {
              if (!selectedSpeakRequestVehicle) return;

              // 🔒 DEADLOCK-FIX: Wenn S5 während S4 kam, automatisch zur Rückfahrt (S8)
              // Sonst würde Fahrzeug zurück zu S4 gehen und Einsatz nie abschließen
              let returnStatus = selectedSpeakRequestVehicle.previousStatus || 'S4';

              // Wenn previousStatus = S4 war (am Einsatzort), prüfe ob Einsatz abgearbeitet ist
              if (returnStatus === 'S4' && selectedSpeakRequestVehicle.processingStartTime) {
                const processingElapsed = (Date.now() - selectedSpeakRequestVehicle.processingStartTime) / 1000;
                const processingComplete = processingElapsed >= selectedSpeakRequestVehicle.processingDuration;

                // Wenn Einsatz fertig → direkt zu S8 (Rückfahrt)
                if (processingComplete) {
                  returnStatus = 'S8';
                  // Löse Rückfahrt aus (wird in returnToStation-Funktion gehandhabt)
                  setTimeout(() => {
                    returnToStation(selectedSpeakRequestVehicle.id);
                  }, 100);
                }
              }

              setVehicles(prev => prev.map(v =>
                v.id === selectedSpeakRequestVehicle.id
                  ? {
                      ...v,
                      status: returnStatus,
                      speakRequest: null,
                      speakRequestType: undefined,
                      previousStatus: null,
                    }
                  : v
              ));

              addLog(`S-${selectedSpeakRequestVehicle.id.toString().padStart(2, '0')} S5→${returnStatus} Sprechwunsch bestätigt`, 'assignment');

              // Funkspruch bestätigen
              addRadioMessage(selectedSpeakRequestVehicle.id, 'S5', returnStatus, {
                customMessage: 'Verstanden, fortfahren',
              });

              setIsSpeakRequestModalOpen(false);
              setSelectedSpeakRequestVehicle(null);
            }}
          />
        </CompactErrorBoundary>
      )}

      <CompactErrorBoundary componentName="Protokoll-Panel">
        <ProtocolPanel
          isOpen={showProtocolPanel}
          onClose={() => setShowProtocolPanel(false)}
          entries={protocolEntries}
        />
      </CompactErrorBoundary>

      {/* Game Settings Modal */}
      {showGameSettings && (
        <CompactErrorBoundary componentName="Spiel-Einstellungen">
          <GameSettings onClose={() => setShowGameSettings(false)} />
        </CompactErrorBoundary>
      )}

      {/* Pause Overlay - Modern & Minimalistisch */}
      {isPaused && gameStarted && (
        <div className="pause-overlay" onClick={() => setIsPaused(false)}>
          <div className="pause-content">
            <div className="pause-icon">⏸</div>
            <div className="pause-title">PAUSE</div>
            <div className="pause-subtitle">Spiel pausiert</div>
            <div className="pause-hint">Klicke irgendwo oder drücke ▶, um fortzufahren</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
