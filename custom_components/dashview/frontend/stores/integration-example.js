/**
 * Store Integration Example
 * Shows how to integrate the stores into dashview-panel.js
 *
 * This file provides code snippets and patterns for migrating
 * from inline state to the store architecture.
 */

/**
 * STEP 1: Import stores at the top of dashview-panel.js
 * Add these imports after the existing module imports:
 */
const IMPORT_EXAMPLE = `
// Import stores
let stores = null;
try {
  stores = await import('./stores/index.js');
  console.log('Dashview: Loaded stores module');
} catch (e) {
  console.log('Dashview: Stores module not loaded, using inline state');
}
`;

/**
 * STEP 2: Initialize stores in constructor or connectedCallback
 * Replace the inline state initialization with store initialization:
 */
const CONSTRUCTOR_EXAMPLE = `
constructor() {
  super();

  // Initialize stores if available
  if (stores) {
    this._settings = stores.getSettingsStore();
    this._ui = stores.getUIStateStore();
    this._registry = stores.getRegistryStore();
  }

  // Keep minimal inline state for LitElement reactivity
  this._storesReady = false;
}

async connectedCallback() {
  super.connectedCallback();

  // Initialize stores with hass
  if (this._settings && this.hass) {
    this._settings.setHass(this.hass);
    this._registry.setHass(this.hass);

    // Load settings and registry data
    await Promise.all([
      this._settings.load(),
      this._registry.loadAll(),
    ]);

    this._storesReady = true;

    // Subscribe to store changes to trigger re-renders
    this._settings.subscribe(() => this.requestUpdate());
    this._ui.subscribe(() => this.requestUpdate());
    this._registry.subscribe(() => this.requestUpdate());
  }

  // ... rest of connectedCallback
}
`;

/**
 * STEP 3: Create property getters that read from stores
 * These provide backwards compatibility with existing code:
 */
const PROPERTY_GETTERS_EXAMPLE = `
// Settings getters (persisted state)
get _enabledRooms() {
  return this._settings?.get('enabledRooms') || {};
}
set _enabledRooms(value) {
  this._settings?.set('enabledRooms', value);
}

get _enabledLights() {
  return this._settings?.get('enabledLights') || {};
}
set _enabledLights(value) {
  this._settings?.set('enabledLights', value);
}

get _weatherEntity() {
  return this._settings?.get('weatherEntity') || 'weather.forecast_home';
}
set _weatherEntity(value) {
  this._settings?.set('weatherEntity', value);
}

// UI state getters (transient state)
get _activeTab() {
  return this._ui?.get('activeTab') || 'home';
}
set _activeTab(value) {
  this._ui?.set('activeTab', value);
}

get _popupRoom() {
  return this._ui?.get('popupRoom');
}
set _popupRoom(value) {
  this._ui?.set('popupRoom', value);
}

get _weatherPopupOpen() {
  return this._ui?.get('weatherPopupOpen') || false;
}
set _weatherPopupOpen(value) {
  this._ui?.set('weatherPopupOpen', value);
}

// Registry getters (HA data)
get _areas() {
  return this._registry?.areas || [];
}

get _floors() {
  return this._registry?.floors || [];
}

get _entityRegistry() {
  return this._registry?.entityRegistry || [];
}

get _lightLabelId() {
  return this._registry?.labelIds?.light || null;
}
`;

/**
 * STEP 4: Update _loadSettings and _saveSettings to use stores
 */
const LOAD_SAVE_EXAMPLE = `
async _loadSettings() {
  if (this._settings) {
    await this._settings.load();
    this._settingsLoaded = this._settings.loaded;
    this.requestUpdate();
  }
}

_saveSettings() {
  if (this._settings) {
    this._settings.save();
  }
}
`;

/**
 * STEP 5: Update _loadAreas to use registry store
 */
const LOAD_AREAS_EXAMPLE = `
async _loadAreas() {
  if (this._registry) {
    await this._registry.loadAreas();
    this.requestUpdate();
  }
}

async _loadEntities() {
  if (this._registry) {
    await this._registry.loadEntities();
    this.requestUpdate();
  }
}
`;

/**
 * STEP 6: Simplified toggle methods using stores
 */
const TOGGLE_EXAMPLE = `
_toggleLight(entityId) {
  if (this._settings) {
    this._settings.toggleEnabled('enabledLights', entityId);
  }
}

_toggleRoom(areaId) {
  if (this._settings) {
    this._settings.toggleEnabled('enabledRooms', areaId);
  }
}
`;

/**
 * STEP 7: UI state methods using stores
 */
const UI_METHODS_EXAMPLE = `
_openRoomPopup(areaId) {
  if (this._ui) {
    this._ui.openRoomPopup(areaId);
  }
}

_closeRoomPopup() {
  if (this._ui) {
    this._ui.closeRoomPopup();
  }
}

_setActiveTab(tab) {
  if (this._ui) {
    this._ui.setActiveTab(tab);
  }
}
`;

/**
 * Full migration checklist:
 *
 * 1. [ ] Import stores module
 * 2. [ ] Initialize stores in constructor
 * 3. [ ] Set hass on stores when available
 * 4. [ ] Subscribe to store changes
 * 5. [ ] Add property getters/setters for backwards compatibility
 * 6. [ ] Update _loadSettings to use settings store
 * 7. [ ] Update _saveSettings to use settings store
 * 8. [ ] Update _loadAreas to use registry store
 * 9. [ ] Update toggle methods to use stores
 * 10. [ ] Update UI methods to use UI store
 * 11. [ ] Test all functionality
 * 12. [ ] Remove old inline state once stable
 */

export {
  IMPORT_EXAMPLE,
  CONSTRUCTOR_EXAMPLE,
  PROPERTY_GETTERS_EXAMPLE,
  LOAD_SAVE_EXAMPLE,
  LOAD_AREAS_EXAMPLE,
  TOGGLE_EXAMPLE,
  UI_METHODS_EXAMPLE,
};
