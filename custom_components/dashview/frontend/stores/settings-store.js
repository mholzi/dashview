/**
 * Settings Store
 * Manages persisted settings that are saved to Home Assistant via WebSocket
 *
 * This store handles all user-configurable settings that need to persist
 * across browser sessions and page reloads.
 */

import { THRESHOLDS, debugLog } from '../constants/index.js';
import { validateSettings, validateSettingsUpdate } from '../utils/schema-validator.js';

/**
 * @typedef {Object} EnabledEntityMap
 * @property {Object<string, boolean>} [entityId] - Map of entity IDs to enabled state
 */

/**
 * @typedef {Object} InfoTextItemConfig
 * @property {boolean} enabled - Whether this info text item is enabled
 * @property {string} [entity] - Entity ID for the item
 * @property {string} [finishTimeEntity] - Entity ID for finish time (for appliances)
 * @property {number} [threshold] - Threshold value (for battery low)
 */

/**
 * @typedef {Object} InfoTextConfig
 * @property {InfoTextItemConfig} motion
 * @property {InfoTextItemConfig} garage
 * @property {InfoTextItemConfig} washer
 * @property {InfoTextItemConfig} windows
 * @property {InfoTextItemConfig} lights
 * @property {InfoTextItemConfig} covers
 * @property {InfoTextItemConfig} water
 * @property {InfoTextItemConfig} dishwasher
 * @property {InfoTextItemConfig} dryer
 * @property {InfoTextItemConfig} vacuum
 * @property {InfoTextItemConfig} batteryLow
 */

/**
 * @typedef {Object} WeatherConfig
 * @property {string} entity - Main weather entity
 * @property {string} currentTempEntity - Current temperature sensor
 * @property {string} currentStateEntity - Current weather state sensor
 * @property {string} todayTempEntity - Today's temperature entity
 * @property {string} todayStateEntity - Today's state entity
 * @property {string} tomorrowTempEntity - Tomorrow's temperature entity
 * @property {string} tomorrowStateEntity - Tomorrow's state entity
 * @property {string} day2TempEntity - Day after tomorrow temp entity
 * @property {string} day2StateEntity - Day after tomorrow state entity
 * @property {string} precipitationEntity - Precipitation entity
 * @property {string} hourlyForecastEntity - Hourly forecast entity
 * @property {string} dwdWarningEntity - DWD warning entity
 */

/**
 * @typedef {Object} SceneButton
 * @property {string} name - Button display name
 * @property {string} icon - MDI icon
 * @property {string} actionType - 'service' | 'scene' | 'script'
 * @property {string} entity - Entity ID or service to call
 */

/**
 * @typedef {Object} DashviewSettings
 * @property {EnabledEntityMap} enabledRooms
 * @property {EnabledEntityMap} enabledLights
 * @property {EnabledEntityMap} enabledMotionSensors
 * @property {EnabledEntityMap} enabledSmokeSensors
 * @property {EnabledEntityMap} enabledCovers
 * @property {EnabledEntityMap} enabledMediaPlayers
 * @property {EnabledEntityMap} enabledGarages
 * @property {EnabledEntityMap} enabledWindows
 * @property {EnabledEntityMap} enabledVibrationSensors
 * @property {EnabledEntityMap} enabledTemperatureSensors
 * @property {EnabledEntityMap} enabledHumiditySensors
 * @property {EnabledEntityMap} enabledClimates
 * @property {EnabledEntityMap} enabledRoofWindows
 * @property {EnabledEntityMap} enabledTVs
 * @property {EnabledEntityMap} enabledLocks
 * @property {EnabledEntityMap} enabledWaterLeakSensors
 * @property {number} notificationTempThreshold
 * @property {number} notificationHumidityThreshold
 * @property {string} weatherEntity
 * @property {string} weatherCurrentTempEntity
 * @property {string} weatherCurrentStateEntity
 * @property {string} weatherTodayTempEntity
 * @property {string} weatherTodayStateEntity
 * @property {string} weatherTomorrowTempEntity
 * @property {string} weatherTomorrowStateEntity
 * @property {string} weatherDay2TempEntity
 * @property {string} weatherDay2StateEntity
 * @property {string} weatherPrecipitationEntity
 * @property {string} hourlyForecastEntity
 * @property {string} dwdWarningEntity
 * @property {string[]} floorOrder
 * @property {Object<string, string[]>} roomOrder
 * @property {Object} floorCardConfig
 * @property {Object<string, boolean>} floorOverviewEnabled
 * @property {string[]} garbageSensors
 * @property {string|null} garbageDisplayFloor
 * @property {InfoTextConfig} infoTextConfig
 * @property {SceneButton[]} sceneButtons
 * @property {Object<string, SceneButton[]>} roomSceneButtons
 * @property {Object[]} mediaPresets
 * @property {Object<string, string>} userPhotos - Map of person entity ID to custom photo URL
 */

/**
 * Default settings values
 * @type {DashviewSettings}
 */
export const DEFAULT_SETTINGS = {
  // Enabled entity maps - which entities are shown in the dashboard
  enabledRooms: {},
  enabledLights: {},
  enabledMotionSensors: {},
  enabledSmokeSensors: {},
  enabledCovers: {},
  enabledMediaPlayers: {},
  enabledGarages: {},
  enabledWindows: {},
  enabledVibrationSensors: {},
  enabledTemperatureSensors: {},
  enabledHumiditySensors: {},
  enabledClimates: {},
  enabledRoofWindows: {},
  enabledTVs: {},
  enabledLocks: {},
  enabledWaterLeakSensors: {},

  // Notification thresholds
  notificationTempThreshold: THRESHOLDS.DEFAULT_TEMP_NOTIFICATION,
  notificationHumidityThreshold: THRESHOLDS.DEFAULT_HUMIDITY_NOTIFICATION,

  // Weather entity configuration
  weatherEntity: 'weather.forecast_home',
  weatherCurrentTempEntity: '',
  weatherCurrentStateEntity: '',
  weatherTodayTempEntity: '',
  weatherTodayStateEntity: '',
  weatherTomorrowTempEntity: '',
  weatherTomorrowStateEntity: '',
  weatherDay2TempEntity: '',
  weatherDay2StateEntity: '',
  weatherPrecipitationEntity: '',
  hourlyForecastEntity: '',
  dwdWarningEntity: '',

  // Floor and room ordering
  floorOrder: [],
  roomOrder: {},

  // Floor card configuration (which entities show on which floor cards)
  floorCardConfig: {},
  floorOverviewEnabled: {},

  // Garbage/waste collection sensors
  garbageSensors: [],
  garbageDisplayFloor: null,

  // Info text configuration (header status items)
  infoTextConfig: {
    motion: { enabled: true },
    garage: { enabled: true },
    washer: { enabled: true, entity: '', finishTimeEntity: '' },
    windows: { enabled: false },
    lights: { enabled: false },
    covers: { enabled: false },
    water: { enabled: false },
    dishwasher: { enabled: false, entity: '', finishTimeEntity: '' },
    dryer: { enabled: false, entity: '', finishTimeEntity: '' },
    vacuum: { enabled: false, entity: '' },
    batteryLow: { enabled: false, threshold: THRESHOLDS.BATTERY_LOW },
  },

  // Scene buttons (global and per-room)
  sceneButtons: [],
  roomSceneButtons: {},

  // Media presets
  mediaPresets: [],

  // Version tracking for changelog popup
  lastSeenVersion: null,  // Stores the last version the user has seen changelog for

  // Custom labels configuration
  customLabels: {},  // { labelId: { enabled: true } }
  enabledCustomEntities: {},  // { entityId: { enabled: true, childEntities: [] } }

  // Enabled appliances (device-based with entity configuration)
  enabledAppliances: {},  // { deviceId: { enabled: true, stateEntity: 'sensor.xxx', timerEntity: 'sensor.yyy' } }

  // Category label mappings (user-configured labels for each entity type)
  categoryLabels: {
    light: null,
    cover: null,
    roofWindow: null,
    window: null,
    garage: null,
    motion: null,
    smoke: null,
    vibration: null,
    temperature: null,
    humidity: null,
    climate: null,
    mediaPlayer: null,
    tv: null,
    lock: null,
    waterLeak: null,
  },

  // User photos (custom avatar photos per person entity)
  userPhotos: {},  // { 'person.john': 'https://example.com/photo.jpg' }

  // Mode data (dashboard configuration profiles)
  modeData: null,  // { modes: {...}, activeMode: 'default', isManualOverride: false }

  // Schedule data (automatic time-based mode switching)
  scheduleData: null,  // { schedules: [...] }
};

/**
 * @typedef {Object} LoadResult
 * @property {boolean} success - Whether load was successful
 * @property {string} [error] - Error message if failed
 */

/**
 * Settings Store class
 * Manages loading, saving, and updating persisted settings
 */
export class SettingsStore {
  constructor() {
    /** @type {DashviewSettings} */
    this._settings = { ...DEFAULT_SETTINGS };
    /** @type {boolean} */
    this._loaded = false;
    /** @type {boolean} */
    this._loadError = false;
    /** @type {string|null} */
    this._lastError = null;
    /** @type {number|null} */
    this._saveDebounceTimer = null;
    /** @type {Set<Function>} */
    this._listeners = new Set();
    /** @type {Object|null} */
    this._hass = null;

    // Draft Mode state
    /** @type {Object|null} */
    this._draftState = null;  // { active, formId, originalValues, draftValues, hasChanges }

    // Save guard state (prevents double-submit)
    /** @type {boolean} */
    this._isSaving = false;
    /** @type {boolean} */
    this._hasPendingChanges = false;
  }

  /**
   * Set the Home Assistant instance
   * @param {Object} hass - Home Assistant instance
   */
  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Check if settings have been loaded
   * @returns {boolean}
   */
  get loaded() {
    return this._loaded;
  }

  /**
   * Check if there was a load error
   * @returns {boolean}
   */
  get hasError() {
    return this._loadError;
  }

  /**
   * Get the last error message
   * @returns {string|null}
   */
  get lastError() {
    return this._lastError;
  }

  /**
   * Get all settings
   * @returns {DashviewSettings}
   */
  get all() {
    return this._settings;
  }

  /**
   * Get a specific setting value
   * @param {string} key - Setting key
   * @returns {*} Setting value
   */
  get(key) {
    return this._settings[key];
  }

  /**
   * Set a specific setting value
   * @param {string} key - Setting key
   * @param {*} value - Setting value
   * @param {boolean} [save=true] - Whether to save immediately
   */
  set(key, value, save = true) {
    this._settings[key] = value;
    this._notifyListeners(key, value);
    if (save) {
      this.save();
    }
  }

  /**
   * Update multiple settings at once
   * Validates updates against schema before applying
   * @param {Object} updates - Object with key-value pairs to update
   * @param {boolean} [save=true] - Whether to save immediately
   */
  update(updates, save = true) {
    // Validate updates against schema
    const { updates: validatedUpdates, warnings } = validateSettingsUpdate(updates);

    if (warnings.length > 0) {
      debugLog('settings', `Validation warnings: ${warnings.join(', ')}`);
    }

    Object.entries(validatedUpdates).forEach(([key, value]) => {
      this._settings[key] = value;
      this._notifyListeners(key, value);
    });
    if (save) {
      this.save();
    }
  }

  /**
   * Toggle an entity in an enabled map
   * @param {string} mapKey - The enabled map key (e.g., 'enabledLights')
   * @param {string} entityId - Entity ID to toggle
   */
  toggleEnabled(mapKey, entityId) {
    const map = this._settings[mapKey] || {};
    this._settings[mapKey] = {
      ...map,
      [entityId]: !map[entityId],
    };
    this._notifyListeners(mapKey, this._settings[mapKey]);
    this.save();
  }

  /**
   * Set an entity's enabled state in a map
   * @param {string} mapKey - The enabled map key
   * @param {string} entityId - Entity ID
   * @param {boolean} enabled - Whether entity is enabled
   */
  setEnabled(mapKey, entityId, enabled) {
    const map = this._settings[mapKey] || {};
    this._settings[mapKey] = {
      ...map,
      [entityId]: enabled,
    };
    this._notifyListeners(mapKey, this._settings[mapKey]);
    this.save();
  }

  /**
   * Load settings from Home Assistant
   * @returns {Promise<LoadResult>}
   */
  async load() {
    if (!this._hass) {
      return { success: false, error: 'No Home Assistant instance' };
    }

    if (this._loaded) {
      return { success: true };
    }

    try {
      const result = await this._hass.callWS({ type: 'dashview/get_settings' });

      // Validate loaded settings against schema
      const { settings: validatedSettings, warnings } = validateSettings(result);

      if (warnings.length > 0) {
        debugLog('settings', `Loaded settings had ${warnings.length} validation warnings`);
      }

      // Merge validated settings with defaults (deep merge nested objects)
      this._settings = {
        ...DEFAULT_SETTINGS,
        ...validatedSettings,
        // Deep merge infoTextConfig
        infoTextConfig: {
          ...DEFAULT_SETTINGS.infoTextConfig,
          ...(validatedSettings.infoTextConfig || {}),
        },
        // Deep merge categoryLabels (preserving null values from saved settings)
        categoryLabels: {
          ...DEFAULT_SETTINGS.categoryLabels,
          ...(validatedSettings.categoryLabels || {}),
        },
      };

      this._loaded = true;
      this._loadError = false;
      this._lastError = null;
      this._notifyListeners('_loaded', true);
      debugLog('settings', 'Settings loaded from HA');
      return { success: true };
    } catch (e) {
      this._loadError = true;
      this._lastError = e.message || 'Failed to load settings';
      console.error('Dashview: Failed to load settings from HA:', e);
      return { success: false, error: this._lastError };
    }
  }

  /**
   * Check if a save operation is in progress
   * @returns {boolean}
   */
  get isSaving() {
    return this._isSaving;
  }

  /**
   * Save settings to Home Assistant (debounced with double-submit prevention)
   * @returns {void}
   */
  save() {
    if (this._saveDebounceTimer) {
      clearTimeout(this._saveDebounceTimer);
    }

    this._saveDebounceTimer = setTimeout(async () => {
      // If already saving, mark that we have pending changes
      if (this._isSaving) {
        this._hasPendingChanges = true;
        debugLog('settings', 'Save queued - already saving');
        return;
      }

      await this._doSave();
    }, THRESHOLDS.DEBOUNCE_MS);
  }

  /**
   * Internal save implementation with guard
   * @private
   * @returns {Promise<void>}
   */
  async _doSave() {
    if (!this._hass) return;

    this._isSaving = true;
    this._notifyListeners('_saveStart', true);

    try {
      await this._hass.callWS({
        type: 'dashview/save_settings',
        settings: this._settings,
      });
      this._lastError = null;
      debugLog('settings', 'Settings saved to HA');
    } catch (e) {
      this._lastError = e.message || 'Failed to save settings';
      console.error('Dashview: Failed to save settings to HA:', e);
    } finally {
      this._isSaving = false;
      this._notifyListeners('_saveEnd', true);

      // Process any pending changes that were queued during save
      if (this._hasPendingChanges) {
        this._hasPendingChanges = false;
        debugLog('settings', 'Processing pending changes');
        await this._doSave();
      }
    }
  }

  /**
   * Force immediate save (no debounce, with double-submit prevention)
   * @returns {Promise<LoadResult>}
   */
  async saveNow() {
    if (this._saveDebounceTimer) {
      clearTimeout(this._saveDebounceTimer);
      this._saveDebounceTimer = null;
    }

    if (!this._hass) {
      return { success: false, error: 'No Home Assistant instance' };
    }

    // If already saving, queue and wait for completion
    if (this._isSaving) {
      this._hasPendingChanges = true;
      debugLog('settings', 'Immediate save queued - already saving');
      // Wait for current save to complete by polling (with timeout)
      let waitAttempts = 0;
      const maxWaitAttempts = 100; // 5 seconds max (100 * 50ms)
      while (this._isSaving && waitAttempts < maxWaitAttempts) {
        await new Promise(resolve => setTimeout(resolve, 50));
        waitAttempts++;
      }
      if (this._isSaving) {
        console.warn('Dashview: Save wait timeout exceeded');
        return { success: false, error: 'Save timeout - previous save still in progress' };
      }
      // Return status based on whether the save succeeded
      return { success: this._lastError === null, error: this._lastError };
    }

    this._isSaving = true;
    this._notifyListeners('_saveStart', true);

    try {
      await this._hass.callWS({
        type: 'dashview/save_settings',
        settings: this._settings,
      });
      this._lastError = null;
      debugLog('settings', 'Settings saved to HA (immediate)');
      return { success: true };
    } catch (e) {
      this._lastError = e.message || 'Failed to save settings';
      console.error('Dashview: Failed to save settings to HA:', e);
      return { success: false, error: this._lastError };
    } finally {
      this._isSaving = false;
      this._notifyListeners('_saveEnd', true);

      // Process any pending changes that were queued during save
      if (this._hasPendingChanges) {
        this._hasPendingChanges = false;
        debugLog('settings', 'Processing pending changes (immediate)');
        await this._doSave();
      }
    }
  }

  /**
   * Subscribe to setting changes
   * @param {Function} listener - Callback function (key, value) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notify all listeners of a change
   * @param {string} key - Changed setting key
   * @param {*} value - New value
   * @private
   */
  _notifyListeners(key, value) {
    this._listeners.forEach(listener => {
      try {
        listener(key, value);
      } catch (e) {
        console.error('Dashview: Settings listener error:', e);
      }
    });
  }

  /**
   * Reset settings to defaults
   * @param {boolean} [save=true] - Whether to save after reset
   */
  reset(save = true) {
    this._settings = { ...DEFAULT_SETTINGS };
    this._notifyListeners('_reset', true);
    if (save) {
      this.save();
    }
  }

  /**
   * Start draft mode for complex forms
   * @param {string} formId - Identifier for the form (e.g., 'scene-button-0', 'floor-card-eg')
   * @param {string[]} keys - Array of setting keys to snapshot
   */
  startDraft(formId, keys) {
    // Snapshot current values for given keys using structuredClone()
    const originalValues = {};
    keys.forEach(key => {
      originalValues[key] = structuredClone(this._settings[key]);
    });
    this._draftState = {
      active: true,
      formId,
      originalValues,
      draftValues: structuredClone(originalValues),
      hasChanges: false
    };
    debugLog('settings', `Draft started for form: ${formId}`);
  }

  /**
   * Get a draft value
   * @param {string} key - Setting key
   * @returns {*} Draft value or null if no draft active
   */
  getDraftValue(key) {
    return this._draftState?.draftValues?.[key] ?? null;
  }

  /**
   * Set a draft value
   * @param {string} key - Setting key
   * @param {*} value - Value to set in draft
   */
  setDraftValue(key, value) {
    if (!this._draftState?.active) return;
    this._draftState.draftValues[key] = value;
    // Compare to original to set hasChanges
    this._draftState.hasChanges = JSON.stringify(this._draftState.draftValues) !==
      JSON.stringify(this._draftState.originalValues);
    this._notifyListeners('_draft', this._draftState);
  }

  /**
   * Commit draft changes to actual settings
   */
  commitDraft() {
    if (!this._draftState?.active) return;
    const changeCount = Object.keys(this._draftState.draftValues).length;

    // Apply draft values to settings
    Object.entries(this._draftState.draftValues).forEach(([key, value]) => {
      this._settings[key] = value;
      this._notifyListeners(key, value);
    });

    this.save();
    debugLog('settings', `Draft committed with ${changeCount} changes`);
    this._draftState = null;
  }

  /**
   * Discard draft changes
   */
  discardDraft() {
    if (!this._draftState) return;
    const formId = this._draftState.formId;
    this._draftState = null;
    this._notifyListeners('_draftDiscarded', true);
    debugLog('settings', `Draft discarded for form: ${formId}`);
  }

  /**
   * Check if draft has changes
   * @returns {boolean} True if draft has changes
   */
  hasDraftChanges() {
    return this._draftState?.hasChanges || false;
  }

  /**
   * Check if draft mode is active
   * @returns {boolean} True if draft is active
   */
  isDraftActive() {
    return this._draftState?.active || false;
  }

  /**
   * Cleanup - clear timers
   */
  destroy() {
    if (this._saveDebounceTimer) {
      clearTimeout(this._saveDebounceTimer);
    }
    this._listeners.clear();
  }
}

// Singleton instance
let settingsStoreInstance = null;

/**
 * Get the singleton settings store instance
 * @returns {SettingsStore}
 */
export function getSettingsStore() {
  if (!settingsStoreInstance) {
    settingsStoreInstance = new SettingsStore();
  }
  return settingsStoreInstance;
}

export default SettingsStore;
