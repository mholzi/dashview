/**
 * Stores Index
 * Central export point for all state management stores
 *
 * The state is organized into three stores:
 *
 * 1. SettingsStore - Persisted settings saved to Home Assistant
 *    - Enabled entities, thresholds, entity configurations
 *    - Saved via WebSocket to .storage/dashview.settings
 *
 * 2. UIStateStore - Transient UI state
 *    - Active tabs, open popups, search queries
 *    - Not persisted, resets on page reload
 *
 * 3. RegistryStore - Home Assistant registry data
 *    - Areas, floors, entities, devices, labels
 *    - Fetched from HA, cached locally
 *
 * Usage:
 *   import { getSettingsStore, getUIStateStore, getRegistryStore } from './stores/index.js';
 *
 *   const settings = getSettingsStore();
 *   settings.setHass(this.hass);
 *   await settings.load();
 *
 *   const ui = getUIStateStore();
 *   ui.setActiveTab('weather');
 *
 *   const registry = getRegistryStore();
 *   await registry.loadAll();
 */

// Settings Store - persisted configuration
export {
  SettingsStore,
  getSettingsStore,
  DEFAULT_SETTINGS,
} from './settings-store.js';

// UI State Store - transient UI state
export {
  UIStateStore,
  getUIStateStore,
  DEFAULT_UI_STATE,
} from './ui-state-store.js';

// Registry Store - HA registry data
export {
  RegistryStore,
  getRegistryStore,
  DEFAULT_REGISTRY,
} from './registry-store.js';

// Onboarding Store - wizard state management
export {
  OnboardingStore,
  getOnboardingStore,
  resetOnboardingStore,
  WIZARD_STEPS,
  SKIPPABLE_STEPS,
  DEFAULT_ONBOARDING_STATE,
} from './onboarding-store.js';

// Mode Store - dashboard mode profiles
export {
  ModeStore,
  getModeStore,
  resetModeStore,
  DEFAULT_MODE,
  MODE_SETTINGS_SCHEMA,
} from './mode-store.js';

/**
 * Initialize all stores with Home Assistant instance
 * @param {Object} hass - Home Assistant instance
 * @returns {Object} Object containing all store instances
 */
export async function initializeStores(hass) {
  const { getSettingsStore } = await import('./settings-store.js');
  const { getUIStateStore } = await import('./ui-state-store.js');
  const { getRegistryStore } = await import('./registry-store.js');

  const settings = getSettingsStore();
  const ui = getUIStateStore();
  const registry = getRegistryStore();

  // Set hass on stores that need it
  settings.setHass(hass);
  registry.setHass(hass);

  // Load data
  await Promise.all([
    settings.load(),
    registry.loadAll(),
  ]);

  return { settings, ui, registry };
}

/**
 * Create a store connector mixin for LitElement components
 * This mixin provides reactive updates when store state changes
 *
 * Usage:
 *   class MyComponent extends StoreConnector(LitElement) {
 *     // Component will re-render when subscribed store values change
 *   }
 *
 * @param {Class} BaseClass - The base class to extend
 * @returns {Class} Extended class with store connection
 */
export function StoreConnector(BaseClass) {
  return class extends BaseClass {
    constructor() {
      super();
      this._storeUnsubscribers = [];
    }

    connectedCallback() {
      super.connectedCallback();
      this._subscribeToStores();
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      this._unsubscribeFromStores();
    }

    /**
     * Subscribe to store changes
     * Override this method to subscribe to specific stores
     */
    _subscribeToStores() {
      // Default: no subscriptions
      // Override in subclass:
      // const settings = getSettingsStore();
      // this._storeUnsubscribers.push(
      //   settings.subscribe(() => this.requestUpdate())
      // );
    }

    /**
     * Unsubscribe from all stores
     */
    _unsubscribeFromStores() {
      this._storeUnsubscribers.forEach(unsub => unsub());
      this._storeUnsubscribers = [];
    }
  };
}

/**
 * Helper to create a reactive property that reads from a store
 * @param {Function} storeGetter - Function that returns the store instance
 * @param {string} key - Key to read from store
 * @returns {Object} Property descriptor
 */
export function storeProperty(storeGetter, key) {
  return {
    get() {
      return storeGetter().get(key);
    },
    set(value) {
      storeGetter().set(key, value);
    },
  };
}
