/**
 * Schema Validator for Dashview Settings
 *
 * Validates settings against a defined schema to prevent corrupted data
 * from breaking the application. Invalid values are replaced with defaults.
 */

import { THRESHOLDS } from '../constants/index.js';

/**
 * Settings schema definition
 * Each field has: type, default, optional min/max for numbers, optional validator function
 */
export const SETTINGS_SCHEMA = {
  // Enabled entity maps
  enabledRooms: { type: 'object', default: {} },
  enabledLights: { type: 'object', default: {} },
  enabledMotionSensors: { type: 'object', default: {} },
  enabledSmokeSensors: { type: 'object', default: {} },
  enabledCovers: { type: 'object', default: {} },
  enabledMediaPlayers: { type: 'object', default: {} },
  enabledGarages: { type: 'object', default: {} },
  enabledWindows: { type: 'object', default: {} },
  enabledVibrationSensors: { type: 'object', default: {} },
  enabledTemperatureSensors: { type: 'object', default: {} },
  enabledHumiditySensors: { type: 'object', default: {} },
  enabledClimates: { type: 'object', default: {} },
  enabledRoofWindows: { type: 'object', default: {} },
  enabledTVs: { type: 'object', default: {} },
  enabledLocks: { type: 'object', default: {} },
  enabledWaterLeakSensors: { type: 'object', default: {} },
  enabledAppliances: { type: 'object', default: {} },
  enabledCustomEntities: { type: 'object', default: {} },

  // Notification thresholds
  notificationTempThreshold: {
    type: 'number',
    min: -50,
    max: 80,
    default: THRESHOLDS?.DEFAULT_TEMP_NOTIFICATION ?? 25
  },
  notificationHumidityThreshold: {
    type: 'number',
    min: 0,
    max: 100,
    default: THRESHOLDS?.DEFAULT_HUMIDITY_NOTIFICATION ?? 70
  },

  // Weather entity configuration
  weatherEntity: { type: 'string', default: 'weather.forecast_home' },
  weatherCurrentTempEntity: { type: 'string', default: '' },
  weatherCurrentStateEntity: { type: 'string', default: '' },
  weatherTodayTempEntity: { type: 'string', default: '' },
  weatherTodayStateEntity: { type: 'string', default: '' },
  weatherTomorrowTempEntity: { type: 'string', default: '' },
  weatherTomorrowStateEntity: { type: 'string', default: '' },
  weatherDay2TempEntity: { type: 'string', default: '' },
  weatherDay2StateEntity: { type: 'string', default: '' },
  weatherPrecipitationEntity: { type: 'string', default: '' },
  hourlyForecastEntity: { type: 'string', default: '' },
  dwdWarningEntity: { type: 'string', default: '' },

  // Floor and room ordering
  floorOrder: { type: 'array', default: [] },
  roomOrder: { type: 'object', default: {} },

  // Floor card configuration
  floorCardConfig: { type: 'object', default: {} },
  floorOverviewEnabled: { type: 'object', default: {} },

  // Garbage/waste collection sensors
  garbageSensors: { type: 'array', default: [] },
  garbageDisplayFloor: { type: 'stringOrNull', default: null },

  // Info text configuration
  infoTextConfig: { type: 'object', default: {} },

  // Scene buttons
  sceneButtons: { type: 'array', default: [] },
  roomSceneButtons: { type: 'object', default: {} },

  // Media presets
  mediaPresets: { type: 'array', default: [] },

  // Version tracking
  lastSeenVersion: { type: 'stringOrNull', default: null },

  // Custom labels configuration
  customLabels: { type: 'object', default: {} },

  // Category label mappings
  categoryLabels: { type: 'object', default: {} },

  // User photos
  userPhotos: { type: 'object', default: {} },

  // Feature toggles
  hapticsEnabled: { type: 'boolean', default: true },
};

/**
 * Check if a value matches the expected type
 * @param {*} value - Value to check
 * @param {Object} config - Schema config with type property
 * @returns {boolean} True if type matches
 */
export function isValidType(value, config) {
  if (value === undefined) return false;

  switch (config.type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value) && isFinite(value);
    case 'boolean':
      return typeof value === 'boolean';
    case 'array':
      return Array.isArray(value);
    case 'object':
      return value !== null && typeof value === 'object' && !Array.isArray(value);
    case 'stringOrNull':
      return value === null || typeof value === 'string';
    default:
      return true;
  }
}

/**
 * Check if a numeric value is within the allowed range
 * @param {*} value - Value to check
 * @param {Object} config - Schema config with optional min/max
 * @returns {boolean} True if in range (or no range specified)
 */
export function isInRange(value, config) {
  if (config.type !== 'number') return true;
  if (typeof value !== 'number') return false;

  if (config.min !== undefined && value < config.min) return false;
  if (config.max !== undefined && value > config.max) return false;

  return true;
}

/**
 * Validate a single setting value against its schema
 * @param {*} value - Value to validate
 * @param {Object} config - Schema config for this field
 * @returns {{ valid: boolean, value: * }} Validation result with corrected value
 */
export function validateSetting(value, config) {
  // Check if value is valid type and in range
  if (isValidType(value, config) && isInRange(value, config)) {
    return { valid: true, value };
  }

  // Return default if invalid
  return { valid: false, value: config.default };
}

/**
 * Validate entire settings object against schema
 * Invalid values are replaced with defaults and logged as warnings
 *
 * @param {Object} settings - Settings object to validate
 * @param {Object} [schema=SETTINGS_SCHEMA] - Schema to validate against
 * @returns {{ settings: Object, warnings: string[] }} Validated settings and any warnings
 */
export function validateSettings(settings, schema = SETTINGS_SCHEMA) {
  const validated = {};
  const warnings = [];

  // Validate known schema fields
  for (const [key, config] of Object.entries(schema)) {
    const value = settings?.[key];

    if (value === undefined) {
      // Missing field - use default
      validated[key] = config.default;
    } else {
      const result = validateSetting(value, config);
      validated[key] = result.value;

      if (!result.valid) {
        const warning = `Invalid setting "${key}": expected ${config.type}, got ${typeof value}. Using default.`;
        warnings.push(warning);
        console.warn(`Dashview: ${warning}`);
      }
    }
  }

  // Preserve any extra fields not in schema (for forward compatibility)
  for (const [key, value] of Object.entries(settings || {})) {
    if (!(key in schema)) {
      validated[key] = value;
    }
  }

  return { settings: validated, warnings };
}

/**
 * Validate a partial settings update
 * Only validates the fields being updated
 *
 * @param {Object} updates - Partial settings to validate
 * @param {Object} [schema=SETTINGS_SCHEMA] - Schema to validate against
 * @returns {{ updates: Object, warnings: string[] }} Validated updates and any warnings
 */
export function validateSettingsUpdate(updates, schema = SETTINGS_SCHEMA) {
  const validated = {};
  const warnings = [];

  for (const [key, value] of Object.entries(updates || {})) {
    const config = schema[key];

    if (!config) {
      // Unknown field - pass through
      validated[key] = value;
    } else {
      const result = validateSetting(value, config);
      validated[key] = result.value;

      if (!result.valid) {
        const warning = `Invalid update for "${key}": expected ${config.type}, got ${typeof value}. Using default.`;
        warnings.push(warning);
        console.warn(`Dashview: ${warning}`);
      }
    }
  }

  return { updates: validated, warnings };
}

export default {
  SETTINGS_SCHEMA,
  isValidType,
  isInRange,
  validateSetting,
  validateSettings,
  validateSettingsUpdate,
};
