/**
 * Settings Store
 * Manages persisted settings that are saved to Home Assistant via WebSocket
 *
 * This store handles all user-configurable settings that need to persist
 * across browser sessions and page reloads.
 */

import { THRESHOLDS, debugLog } from '../constants/index.js';

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
  },

  // User photos (custom avatar photos per person entity)
  userPhotos: {},  // { 'person.john': 'https://example.com/photo.jpg' }
};

/**
 * @typedef {Object} LoadResult
 * @property {boolean} success - Whether load was successful
 * @property {string} [error] - Error message if failed
 */

/**
 * @typedef {Object} ChangeRecord
 * @property {string} type - Type of change ('set', 'toggle', 'update')
 * @property {string} key - Setting key that was changed
 * @property {*} oldValue - Previous value (deep cloned)
 * @property {*} newValue - New value (deep cloned)
 * @property {string} [description] - Optional description of the change
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

    // Undo/Redo state
    /** @type {ChangeRecord[]} */
    this._undoStack = [];
    /** @type {ChangeRecord[]} */
    this._redoStack = [];
    /** @type {boolean} */
    this._isUndoing = false;
    /** @type {boolean} */
    this._isRedoing = false;
    /** @type {number|null} */
    this._debounceGroupTimer = null;
    /** @type {ChangeRecord[]} */
    this._pendingChanges = [];
    /** @type {number} */
    this._maxHistorySize = 20;

    // Draft Mode state
    /** @type {Object|null} */
    this._draftState = null;  // { active, formId, originalValues, draftValues, hasChanges }
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
    const oldValue = this._settings[key];
    this._recordChange('set', key, oldValue, value);
    this._settings[key] = value;
    this._notifyListeners(key, value);
    if (save) {
      this.save();
    }
  }

  /**
   * Update multiple settings at once
   * @param {Object} updates - Object with key-value pairs to update
   * @param {boolean} [save=true] - Whether to save immediately
   */
  update(updates, save = true) {
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = this._settings[key];
      this._recordChange('update', key, oldValue, value);
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
    const oldValue = { ...map };
    const newValue = {
      ...map,
      [entityId]: !map[entityId],
    };
    this._recordChange('toggle', mapKey, oldValue, newValue, `Toggle ${entityId}`);
    this._settings[mapKey] = newValue;
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
    const oldValue = { ...map };
    const newValue = {
      ...map,
      [entityId]: enabled,
    };
    this._recordChange('toggle', mapKey, oldValue, newValue, `Set ${entityId} to ${enabled}`);
    this._settings[mapKey] = newValue;
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

      // Merge loaded settings with defaults
      this._settings = {
        ...DEFAULT_SETTINGS,
        ...result,
        // Deep merge infoTextConfig
        infoTextConfig: {
          ...DEFAULT_SETTINGS.infoTextConfig,
          ...(result.infoTextConfig || {}),
        },
        // Deep merge categoryLabels (preserving null values from saved settings)
        categoryLabels: {
          ...DEFAULT_SETTINGS.categoryLabels,
          ...(result.categoryLabels || {}),
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
   * Save settings to Home Assistant (debounced)
   * @returns {void}
   */
  save() {
    if (this._saveDebounceTimer) {
      clearTimeout(this._saveDebounceTimer);
    }

    this._saveDebounceTimer = setTimeout(async () => {
      if (!this._hass) return;

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
      }
    }, THRESHOLDS.DEBOUNCE_MS);
  }

  /**
   * Force immediate save (no debounce)
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
   * Check if undo is available
   * @returns {boolean}
   */
  canUndo() {
    return this._undoStack.length > 0;
  }

  /**
   * Check if redo is available
   * @returns {boolean}
   */
  canRedo() {
    return this._redoStack.length > 0;
  }

  /**
   * Get description of the next undo action
   * @returns {string|null}
   */
  getUndoDescription() {
    if (this._undoStack.length === 0) return null;
    const change = this._undoStack[this._undoStack.length - 1];
    return change.description || `Undo ${change.type} on ${change.key}`;
  }

  /**
   * Get description of the next redo action
   * @returns {string|null}
   */
  getRedoDescription() {
    if (this._redoStack.length === 0) return null;
    const change = this._redoStack[this._redoStack.length - 1];
    return change.description || `Redo ${change.type} on ${change.key}`;
  }

  /**
   * Undo the last change
   * @returns {boolean} - True if undo was successful
   */
  undo() {
    if (this._undoStack.length === 0) return false;

    this._isUndoing = true;
    const change = this._undoStack.pop();

    debugLog('settings', `Undo: reverted ${change.key}`);

    // Restore old value
    this._settings[change.key] = structuredClone(change.oldValue);
    this._notifyListeners(change.key, this._settings[change.key]);

    // Move to redo stack
    this._redoStack.push(change);

    // Trigger save
    this.save();

    this._isUndoing = false;
    return true;
  }

  /**
   * Redo the last undone change
   * @returns {boolean} - True if redo was successful
   */
  redo() {
    if (this._redoStack.length === 0) return false;

    this._isRedoing = true;
    const change = this._redoStack.pop();

    debugLog('settings', `Redo: applied ${change.key}`);

    // Restore new value
    this._settings[change.key] = structuredClone(change.newValue);
    this._notifyListeners(change.key, this._settings[change.key]);

    // Move back to undo stack
    this._undoStack.push(change);

    // Trigger save
    this.save();

    this._isRedoing = false;
    return true;
  }

  /**
   * Clear undo/redo history
   */
  clearHistory() {
    this._undoStack = [];
    this._redoStack = [];
    this._pendingChanges = [];
    if (this._debounceGroupTimer) {
      clearTimeout(this._debounceGroupTimer);
      this._debounceGroupTimer = null;
    }
  }

  /**
   * Record a change for undo/redo (private)
   * @param {string} type - Type of change
   * @param {string} key - Setting key
   * @param {*} oldValue - Previous value
   * @param {*} newValue - New value
   * @param {string} [description] - Optional description
   * @private
   */
  _recordChange(type, key, oldValue, newValue, description) {
    // Don't record changes during undo/redo
    if (this._isUndoing || this._isRedoing) return;

    // Create change record with deep clones
    const change = {
      type,
      key,
      oldValue: structuredClone(oldValue),
      newValue: structuredClone(newValue),
      description,
    };

    // Add to pending changes
    this._pendingChanges.push(change);

    // Clear redo stack on new change
    this._redoStack = [];

    // Debounce grouping - commit after 100ms of inactivity
    if (this._debounceGroupTimer) {
      clearTimeout(this._debounceGroupTimer);
    }

    this._debounceGroupTimer = setTimeout(() => {
      this._commitPendingChanges();
    }, 100);
  }

  /**
   * Commit pending changes to undo stack (private)
   * @private
   */
  _commitPendingChanges() {
    if (this._pendingChanges.length === 0) return;

    // For single change, add it directly
    if (this._pendingChanges.length === 1) {
      this._undoStack.push(this._pendingChanges[0]);
    } else {
      // For multiple changes, group them by key
      // Keep first oldValue and last newValue for each key
      const changeMap = new Map();
      for (const change of this._pendingChanges) {
        if (changeMap.has(change.key)) {
          // Update newValue but keep original oldValue
          const existing = changeMap.get(change.key);
          existing.newValue = change.newValue;
        } else {
          changeMap.set(change.key, change);
        }
      }

      // Add grouped changes to undo stack
      for (const change of changeMap.values()) {
        this._undoStack.push(change);
      }
    }

    // Enforce max history size (FIFO)
    while (this._undoStack.length > this._maxHistorySize) {
      this._undoStack.shift();
    }

    // Clear pending changes
    this._pendingChanges = [];
    this._debounceGroupTimer = null;
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
      const oldValue = this._draftState.originalValues[key];
      this._recordChange('set', key, oldValue, value, `Draft: ${this._draftState.formId}`);
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
    if (this._debounceGroupTimer) {
      clearTimeout(this._debounceGroupTimer);
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
