/**
 * German Text Constants
 *
 * ⚠️ DEPRECATED ⚠️
 * This file is deprecated and will be removed in a future version.
 * All hardcoded German strings have been replaced with the i18n translation system.
 *
 * Please use: import { t } from '../utils/i18n.js';
 *
 * Translation files:
 * - /locales/de.json (German translations)
 * - /locales/en.json (English translations)
 *
 * DO NOT import or use this file in new code.
 * Existing imports should be replaced with t() calls.
 */

// ==================== Status Messages ====================

export const STATUS_TEXT = {
  // Common status words
  CURRENTLY_ARE: 'Aktuell sind',
  OPEN: 'offen',
  CLOSED: 'geschlossen',
  ON: 'an',
  OFF: 'aus',
  ACTIVE: 'aktiv',
  INACTIVE: 'inaktiv',
  READY: 'fertig',
  RUNNING: 'läuft',

  // Motion status
  MOTION_IN_HOUSE_SINCE: 'Im Haus ist seit',
  MOTION: 'Bewegung',
  LAST_MOTION_WAS: 'Die letzte Bewegung im Haus war vor',
  NO_MOTION: 'Keine Bewegung',

  // Time expressions
  JUST_NOW: 'Gerade eben',
  NOW: 'Jetzt',
  YESTERDAY: 'Gestern',
  DAYS: 'Tagen',
  HOURS: 'Stunden',
  MINUTES: 'Minuten',

  // Appliances
  WASHER_RUNNING: 'Die Waschmaschine läuft noch',
  WASHER_FINISHED: 'Die Waschmaschine ist',
  DISHWASHER_RUNNING: 'Die Spülmaschine läuft noch',
  DISHWASHER_FINISHED: 'Die Spülmaschine ist',
  DRYER: 'Trockner',
  DRYER_RUNNING: 'läuft gerade',
  DRYER_FINISHED: 'ist fertig',

  // Vacuum
  VACUUM_CLEANING: 'wird gesaugt',
  VACUUM_RETURNING: 'kehrt zurück',
  VACUUM_PROBLEM: 'hat ein Problem',
  VACUUM_CLEANING_IN_PROGRESS: 'Reinigung läuft',

  // Battery
  LOW_BATTERY: 'hat niedrigen Akku',
  DEVICES_LOW_BATTERY: 'Geräte haben niedrigen Akku',

  // Lights
  LIGHTS_ON: 'Lichter an',
  LIGHTS_OFF: 'Lichter aus',
  LIGHTS_ARE_ON: 'Es sind gerade',

  // Covers/Blinds
  ROLLOS: 'Rollos',
  ROLLO: 'Rollo',
  ROLLOS_OPEN: 'Rollos auf',
  ROLLOS_CLOSE: 'Rollos zu',

  // TVs
  TV_ON: 'Fernseher an',
  TV_OFF: 'Fernseher aus',
  TVS_ARE_ON: 'Es sind gerade',
  TVS_ON_SUFFIX: 'Fernseher an',
};

// ==================== UI Labels ====================

export const UI_LABELS = {
  // Room popup sections
  LIGHT: 'Licht',
  MUSIC: 'Musik',
  GARAGE: 'Garage',
  TV: 'Fernseher',
  TVS: 'Fernseher',
  WEATHER: 'Wetter',
  SETTINGS: 'Einstellungen',
  ADMIN: 'Admin',
  HOME: 'Home',

  // Media player
  UNKNOWN_TITLE: 'Unbekannter Titel',
  UNKNOWN_ARTIST: 'Unbekannter Künstler',
  READY: 'Bereit',
  OFF: 'Ausgeschaltet',

  // Weather
  CURRENT_WEATHER: 'Aktuelles Wetter',
  HOURLY_FORECAST: 'Stündliche Vorhersage',
  LOADING_FORECAST: 'Stündliche Vorhersage wird geladen...',
  TODAY: 'Heute',
  TOMORROW: 'Morgen',
  DAY_AFTER: 'Übermorgen',
  RAIN: 'Regen',
  NO_DATA_AVAILABLE: 'Keine Daten verfügbar',
  RAIN_RADAR: 'Regenradar',
  PRECIPITATION: 'Niederschlag',

  // Binary sensor states
  MOTION_DETECTED: 'Bewegung',
  NO_MOTION_DETECTED: 'Keine Bewegung',
  WINDOW_OPEN: 'Offen',
  WINDOW_CLOSED: 'Geschlossen',
  VIBRATION: 'Vibration',
  QUIET: 'Ruhig',
  SMOKE: 'Rauch!',
  NO_SMOKE: 'Kein Rauch',

  // General
  OF: 'von',
  LIGHTS: 'Lichter',
  CANCEL: 'Abbrechen',
  SAVE: 'Speichern',
  DELETE: 'Löschen',
  EDIT: 'Bearbeiten',
  ADD: 'Hinzufügen',
  SEARCH: 'Suchen',
  FILTER: 'Filter',
  ALL: 'Alle',
  NONE: 'Keine',
  ENABLED: 'Aktiviert',
  DISABLED: 'Deaktiviert',
};

// ==================== Error Messages ====================

export const ERROR_TEXT = {
  NO_DATA: 'Keine Daten verfügbar',
  LOADING: 'Wird geladen...',
  ERROR: 'Fehler',
  INVALID_DATE: 'Ungültiges Datum',
  NOT_CONFIGURED: 'Nicht konfiguriert',
  NO_MEDIA_PLAYERS: 'Keine Media Player konfiguriert',
  ACTIVATE_IN_ADMIN: 'Aktiviere Media Player im Admin-Bereich',
};

// ==================== Time Formatting ====================

export const TIME_FORMAT = {
  AGO_DAYS: (days) => `vor ${days} Tagen`,
  AGO_HOURS: (hours) => `vor ${hours}h`,
  AGO_MINUTES: (minutes) => `vor ${minutes}min`,
  IN_DAYS: (days) => `in ${days} Tagen`,
  DURATION_HOURS: (hours) => `${hours}h`,
  DURATION_MINUTES: (minutes) => `${minutes}min`,
};

// ==================== DWD Weather Warnings ====================

export const DWD_WARNINGS = {
  0: 'Information',
  1: 'Warnung vor',
  2: 'Warnung vor markantem',
  3: 'Unwetterwarnung vor',
  4: 'Extremes Unwetter',
};

// ==================== Count Formatting ====================

/**
 * Format count with singular/plural forms
 * @param {number} count - The count
 * @param {string} singular - Singular form
 * @param {string} plural - Plural form
 * @returns {string} Formatted string
 */
export function formatCount(count, singular, plural) {
  return count === 1 ? `${count} ${singular}` : `${count} ${plural}`;
}

/**
 * Format "X of Y" pattern
 * @param {number} current - Current count
 * @param {number} total - Total count
 * @param {string} suffix - Suffix text
 * @returns {string} Formatted string like "3 von 5 Lichter an"
 */
export function formatOfTotal(current, total, suffix = '') {
  return `${current} ${UI_LABELS.OF} ${total}${suffix ? ' ' + suffix : ''}`;
}

export default {
  STATUS_TEXT,
  UI_LABELS,
  ERROR_TEXT,
  TIME_FORMAT,
  DWD_WARNINGS,
  formatCount,
  formatOfTotal,
};
