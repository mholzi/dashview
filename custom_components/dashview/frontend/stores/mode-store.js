/**
 * Mode Store
 * Manages multiple dashboard configuration profiles (modes)
 *
 * Modes allow users to switch between different dashboard configurations:
 * - Night mode (dimmed UI, reduced rooms)
 * - Day mode (full brightness, all rooms)
 * - Away mode (minimal display, security focus)
 * - Custom modes (user-defined)
 *
 * The store handles:
 * - CRUD operations for modes
 * - Mode activation and settings application
 * - Persistence via SettingsStore
 * - Observer pattern for reactive updates
 */

import { getSettingsStore } from './settings-store.js';

/**
 * @typedef {Object} ModeSettings
 * @property {Object<string, boolean>} [enabledRoomsOverride] - Override which rooms are shown
 * @property {Object<string, boolean>} [enabledEntitiesOverride] - Override which entities are shown
 * @property {boolean} [dimmedUI] - Reduce overall UI brightness
 * @property {boolean} [reducedAnimations] - Minimize animations
 * @property {boolean} [disableHaptics] - Turn off haptic feedback
 * @property {boolean} [muteNotifications] - Silence non-critical alerts
 * @property {string[]} [floorOrderOverride] - Different floor order
 * @property {string} [defaultFloor] - Which floor to show first
 */

/**
 * @typedef {Object} Mode
 * @property {string} id - Unique mode identifier
 * @property {string} name - Display name
 * @property {boolean} deletable - Whether mode can be deleted
 * @property {ModeSettings} settings - Mode-specific settings overrides
 */

/**
 * Default mode that always exists and cannot be deleted
 * @type {Mode}
 */
export const DEFAULT_MODE = {
  id: 'default',
  name: 'Default',
  deletable: false,
  settings: {}
};

/**
 * Mode settings schema with defaults
 * @type {Object}
 */
export const MODE_SETTINGS_SCHEMA = {
  enabledRoomsOverride: { type: 'object', default: null },
  enabledEntitiesOverride: { type: 'object', default: null },
  dimmedUI: { type: 'boolean', default: false },
  reducedAnimations: { type: 'boolean', default: false },
  disableHaptics: { type: 'boolean', default: false },
  muteNotifications: { type: 'boolean', default: false },
  floorOrderOverride: { type: 'array', default: null },
  defaultFloor: { type: 'string', default: null }
};

/**
 * Mode Store class
 * Manages dashboard modes and their configurations
 */
export class ModeStore {
  constructor() {
    /** @type {Object<string, Mode>} */
    this._modes = {
      default: structuredClone(DEFAULT_MODE)
    };
    /** @type {string} */
    this._activeMode = 'default';
    /** @type {boolean} */
    this._isManualOverride = false;
    /** @type {Set<Function>} */
    this._listeners = new Set();
    /** @type {boolean} */
    this._loaded = false;
  }

  /**
   * Get all modes
   * @returns {Object<string, Mode>}
   */
  get modes() {
    return this._modes;
  }

  /**
   * Get active mode ID
   * @returns {string}
   */
  get activeMode() {
    return this._activeMode;
  }

  /**
   * Get whether manual override is active
   * @returns {boolean}
   */
  get isManualOverride() {
    return this._isManualOverride;
  }

  /**
   * Get modes as array
   * @returns {Mode[]}
   */
  get modesList() {
    return Object.values(this._modes);
  }

  /**
   * Get the currently active mode object
   * @returns {Mode}
   */
  getActiveMode() {
    return this._modes[this._activeMode] || this._modes.default;
  }

  /**
   * Get a mode by ID
   * @param {string} modeId - Mode ID
   * @returns {Mode|null}
   */
  getMode(modeId) {
    return this._modes[modeId] || null;
  }

  /**
   * Create a new mode
   * @param {string} name - Mode name
   * @param {string} [baseMode='default'] - Mode to copy settings from
   * @returns {string} New mode ID
   */
  createMode(name, baseMode = 'default') {
    // Use timestamp + random for unique ID (handles rapid successive calls)
    const id = `mode_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    const baseSettings = this._modes[baseMode]?.settings || {};

    this._modes[id] = {
      id,
      name,
      deletable: true,
      settings: structuredClone(baseSettings)
    };

    this._notifyListeners();
    this._persist();
    return id;
  }

  /**
   * Update an existing mode
   * @param {string} modeId - Mode ID
   * @param {Object} updates - Updates to apply
   * @param {string} [updates.name] - New name
   * @param {ModeSettings} [updates.settings] - New settings
   * @returns {boolean} Success
   */
  updateMode(modeId, updates) {
    const mode = this._modes[modeId];
    if (!mode) {
      console.warn('[Dashview] Mode not found:', modeId);
      return false;
    }

    if (updates.name !== undefined) {
      mode.name = updates.name;
    }

    if (updates.settings !== undefined) {
      mode.settings = {
        ...mode.settings,
        ...updates.settings
      };
    }

    this._notifyListeners();
    this._persist();
    return true;
  }

  /**
   * Duplicate an existing mode
   * @param {string} modeId - Mode ID to duplicate
   * @returns {string|null} New mode ID or null if failed
   */
  duplicateMode(modeId) {
    const source = this._modes[modeId];
    if (!source) {
      console.warn('[Dashview] Cannot duplicate - mode not found:', modeId);
      return null;
    }

    return this.createMode(`${source.name} (Copy)`, modeId);
  }

  /**
   * Delete a mode
   * @param {string} modeId - Mode ID to delete
   * @returns {boolean} Success
   */
  deleteMode(modeId) {
    const mode = this._modes[modeId];
    if (!mode) {
      console.warn('[Dashview] Cannot delete - mode not found:', modeId);
      return false;
    }

    if (!mode.deletable) {
      console.warn('[Dashview] Cannot delete protected mode:', modeId);
      return false;
    }

    delete this._modes[modeId];

    // If deleting the active mode, switch to default
    if (this._activeMode === modeId) {
      this._activeMode = 'default';
      this._applyModeSettings(this._modes.default.settings);
    }

    this._notifyListeners();
    this._persist();
    return true;
  }

  /**
   * Activate a mode
   * @param {string} modeId - Mode ID to activate
   * @param {boolean} [isManual=true] - Whether this is a manual activation
   * @returns {boolean} Success
   */
  activateMode(modeId, isManual = true) {
    if (!this._modes[modeId]) {
      console.warn('[Dashview] Cannot activate - mode not found:', modeId);
      return false;
    }

    this._activeMode = modeId;
    this._isManualOverride = isManual;
    this._applyModeSettings(this._modes[modeId].settings);
    this._notifyListeners();
    this._persist();
    return true;
  }

  /**
   * Clear manual override and follow schedule
   */
  clearManualOverride() {
    this._isManualOverride = false;
    this._notifyListeners();
    this._persist();
  }

  /**
   * Apply mode settings as overrides
   * Mode settings are applied reactively - the dashboard reads the active mode
   * via getEffectiveSettings() during render. This method triggers the reactive
   * update by notifying listeners (called from activateMode).
   * @param {ModeSettings} modeSettings - Settings to apply
   * @private
   */
  _applyModeSettings(modeSettings) {
    // Reactive: listeners are notified in the calling method (activateMode/deleteMode)
    // Dashboard components subscribe and re-render when mode changes
  }

  /**
   * Get effective settings (base settings merged with mode overrides)
   * @returns {Object} Merged settings
   */
  getEffectiveSettings() {
    const settingsStore = getSettingsStore();
    const baseSettings = settingsStore.all;
    const modeSettings = this.getActiveMode().settings;

    // Merge mode overrides with base settings
    const effective = { ...baseSettings };

    // Apply room overrides if present
    if (modeSettings.enabledRoomsOverride) {
      effective.enabledRooms = {
        ...baseSettings.enabledRooms,
        ...modeSettings.enabledRoomsOverride
      };
    }

    // Apply entity overrides if present
    if (modeSettings.enabledEntitiesOverride) {
      // Apply to all enabled entity maps
      const entityMaps = [
        'enabledLights', 'enabledCovers', 'enabledClimates',
        'enabledMediaPlayers', 'enabledTVs', 'enabledLocks'
      ];
      entityMaps.forEach(mapKey => {
        if (modeSettings.enabledEntitiesOverride[mapKey]) {
          effective[mapKey] = {
            ...baseSettings[mapKey],
            ...modeSettings.enabledEntitiesOverride[mapKey]
          };
        }
      });
    }

    // Apply floor order override if present
    if (modeSettings.floorOrderOverride) {
      effective.floorOrder = modeSettings.floorOrderOverride;
    }

    // Copy UI behavior settings directly
    effective.dimmedUI = modeSettings.dimmedUI || false;
    effective.reducedAnimations = modeSettings.reducedAnimations || false;
    effective.disableHaptics = modeSettings.disableHaptics || false;
    effective.muteNotifications = modeSettings.muteNotifications || false;
    effective.defaultFloor = modeSettings.defaultFloor || null;

    return effective;
  }

  /**
   * Subscribe to mode changes
   * @param {Function} listener - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notify all listeners of changes
   * @private
   */
  _notifyListeners() {
    const activeMode = this.getActiveMode();
    this._listeners.forEach(listener => {
      try {
        listener(activeMode);
      } catch (e) {
        console.error('[Dashview] Mode listener error:', e);
      }
    });
  }

  /**
   * Persist mode data to SettingsStore
   * @private
   */
  _persist() {
    try {
      const settingsStore = getSettingsStore();
      settingsStore.update({
        modeData: {
          modes: this._modes,
          activeMode: this._activeMode,
          isManualOverride: this._isManualOverride
        }
      });
    } catch (e) {
      console.warn('[Dashview] Failed to persist mode data:', e);
    }
  }

  /**
   * Load mode data from SettingsStore
   */
  load() {
    if (this._loaded) return;

    try {
      const settingsStore = getSettingsStore();
      const modeData = settingsStore.get('modeData');

      if (modeData) {
        // Restore modes, ensuring default mode always exists
        this._modes = {
          default: structuredClone(DEFAULT_MODE),
          ...(modeData.modes || {})
        };
        // Ensure default mode properties are preserved
        this._modes.default = {
          ...this._modes.default,
          deletable: false
        };
        this._activeMode = modeData.activeMode || 'default';
        this._isManualOverride = modeData.isManualOverride || false;

        // Validate active mode exists
        if (!this._modes[this._activeMode]) {
          this._activeMode = 'default';
        }
      }

      this._loaded = true;
    } catch (e) {
      console.warn('[Dashview] Failed to load mode data:', e);
    }
  }

  /**
   * Reset store to initial state (for testing)
   */
  reset() {
    this._modes = {
      default: structuredClone(DEFAULT_MODE)
    };
    this._activeMode = 'default';
    this._isManualOverride = false;
    this._loaded = false;
    this._listeners.clear();
  }
}

// Singleton instance
let modeStoreInstance = null;

/**
 * Get the singleton mode store instance
 * @returns {ModeStore}
 */
export function getModeStore() {
  if (!modeStoreInstance) {
    modeStoreInstance = new ModeStore();
  }
  return modeStoreInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetModeStore() {
  if (modeStoreInstance) {
    modeStoreInstance.reset();
  }
  modeStoreInstance = null;
}

export default ModeStore;
