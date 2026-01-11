/**
 * Dashview Panel - Custom Home Assistant Dashboard
 * A LitElement-based panel for Home Assistant
 *
 * @module dashview-panel
 *
 * Modular architecture:
 * - styles/           : CSS styles and design tokens
 * - components/       : Reusable UI components (controls, cards, layout)
 * - features/         : Feature modules (home, admin, weather, security)
 * - utils/            : Utility/helper functions
 * - constants/        : Shared constants and configuration
 * - stores/           : State management (settings, UI state, registry)
 */

// Wait for HA frontend to be ready, then load
(async () => {
  // Version for cache busting - update this when making changes
  const DASHVIEW_VERSION = "1.9.18";

  // Debug mode - set to true for development logging
  const DEBUG = false;
  const debugLog = (...args) => DEBUG && console.log('[Dashview]', ...args);

  // Wait for required HA elements to be available
  await customElements.whenDefined("ha-panel-lovelace");

  // Get LitElement base class from HA
  const haPanel = customElements.get("ha-panel-lovelace");
  const LitElement = Object.getPrototypeOf(haPanel);

  // Import lit html and css from the global scope
  const { html, css } = await import("https://unpkg.com/lit@2.8.0/index.js?module");

  // Module references
  let externalStylesLoaded = false;
  let dashviewStyles = null;
  let dashviewUtils = null;
  let dashviewAdmin = null;
  let dashviewPopups = null;
  let dashviewHome = null;
  let dashviewConstants = null;

  // Store references (singleton instances)
  let settingsStore = null;
  let uiStateStore = null;
  let registryStore = null;

  // Load modules - modular structure only (legacy removed)
  try {
    const stylesModule = await import(`./styles/index.js?v=${DASHVIEW_VERSION}`);
    dashviewStyles = stylesModule.dashviewStyles;
    externalStylesLoaded = true;
    debugLog(`Loaded styles v${DASHVIEW_VERSION}`);
  } catch (e) {
    console.warn("Dashview: Failed to load styles module", e);
  }

  try {
    dashviewUtils = await import(`./utils/index.js?v=${DASHVIEW_VERSION}`);
    debugLog("Loaded utils module");
  } catch (e) {
    console.warn("Dashview: Failed to load utils module", e);
  }

  try {
    dashviewConstants = await import(`./constants/index.js?v=${DASHVIEW_VERSION}`);
    debugLog("Loaded constants module");
  } catch (e) {
    console.warn("Dashview: Failed to load constants module", e);
  }

  try {
    dashviewAdmin = await import(`./features/admin/index.js?v=${DASHVIEW_VERSION}`);
    debugLog("Loaded admin module");
  } catch (e) {
    console.warn("Dashview: Failed to load admin module", e);
  }

  try {
    dashviewPopups = await import(`./features/security/popups.js?v=${DASHVIEW_VERSION}`);
    debugLog("Loaded popups module");
  } catch (e) {
    console.warn("Dashview: Failed to load popups module", e);
  }

  try {
    dashviewHome = await import(`./features/home/index.js?v=${DASHVIEW_VERSION}`);
    debugLog("Loaded home module");
  } catch (e) {
    console.warn("Dashview: Failed to load home module", e);
  }

  // Load popup modules
  let dashviewRoomPopup = null;
  let dashviewWeatherPopup = null;
  let dashviewMediaPopup = null;
  let dashviewChangelogPopup = null;
  let changelogUtils = null;
  try {
    const popupsModule = await import(`./features/popups/index.js?v=${DASHVIEW_VERSION}`);
    dashviewRoomPopup = popupsModule.renderRoomPopup;
    dashviewWeatherPopup = popupsModule.renderWeatherPopup;
    dashviewMediaPopup = popupsModule.renderMediaPopup;
    dashviewChangelogPopup = popupsModule.renderChangelogPopup;
    debugLog("Loaded popups module");
  } catch (e) {
    console.warn("Dashview: Failed to load popups module", e);
  }

  // Load changelog utilities
  try {
    changelogUtils = await import(`./constants/changelog.js?v=${DASHVIEW_VERSION}`);
    debugLog("Loaded changelog module");
  } catch (e) {
    console.warn("Dashview: Failed to load changelog module", e);
  }

  // Load store modules
  try {
    const storesModule = await import(`./stores/index.js?v=${DASHVIEW_VERSION}`);
    settingsStore = storesModule.getSettingsStore();
    uiStateStore = storesModule.getUIStateStore();
    registryStore = storesModule.getRegistryStore();
    debugLog("Loaded stores module");
  } catch (e) {
    console.warn("Dashview: Failed to load stores module", e);
  }

  // Load services module
  let roomDataService = null;
  let statusService = null;
  let weatherService = null;
  try {
    const servicesModule = await import(`./services/index.js?v=${DASHVIEW_VERSION}`);
    roomDataService = servicesModule.getRoomDataService();
    statusService = {
      getWasherStatus: servicesModule.getWasherStatus,
      getMotionStatus: servicesModule.getMotionStatus,
      getGarageStatus: servicesModule.getGarageStatus,
      getWindowsStatus: servicesModule.getWindowsStatus,
      getLightsOnStatus: servicesModule.getLightsOnStatus,
      getCoversStatus: servicesModule.getCoversStatus,
      getTVsStatus: servicesModule.getTVsStatus,
      getDishwasherStatus: servicesModule.getDishwasherStatus,
      getDryerStatus: servicesModule.getDryerStatus,
      getVacuumStatus: servicesModule.getVacuumStatus,
      getBatteryLowStatus: servicesModule.getBatteryLowStatus,
      getAllStatusItems: servicesModule.getAllStatusItems,
    };
    weatherService = {
      getWeather: servicesModule.getWeather,
      translateWeatherCondition: servicesModule.translateWeatherCondition,
      getWeatherIcon: servicesModule.getWeatherIcon,
      getCurrentWeatherData: servicesModule.getCurrentWeatherData,
      getHourlyForecast: servicesModule.getHourlyForecast,
      getForecastData: servicesModule.getForecastData,
      getPrecipitation: servicesModule.getPrecipitation,
      getDwdWarnings: servicesModule.getDwdWarnings,
      getPerson: servicesModule.getPerson,
    };
    debugLog("Loaded services module");
  } catch (e) {
    console.warn("Dashview: Failed to load services module", e);
  }

  // Load core utilities module
  let coreUtils = null;
  try {
    coreUtils = await import(`./core/index.js?v=${DASHVIEW_VERSION}`);
    debugLog("Loaded core utilities module");
  } catch (e) {
    console.warn("Dashview: Failed to load core utilities module", e);
  }

  // Load i18n module
  let initI18n = null;
  let getCurrentLang = null;
  let isI18nInitialized = null;
  let t = null;
  try {
    const i18nModule = await import(`./utils/i18n.js?v=${DASHVIEW_VERSION}`);
    initI18n = i18nModule.initI18n;
    getCurrentLang = i18nModule.getCurrentLang;
    isI18nInitialized = i18nModule.isI18nInitialized;
    // Defensive wrapper for t() to handle edge cases
    const importedT = i18nModule.t;
    t = (key, fallbackOrParams) => {
      try {
        return importedT(key, fallbackOrParams);
      } catch (e) {
        return typeof fallbackOrParams === 'string' ? fallbackOrParams : key;
      }
    };
    debugLog("Loaded i18n module");
  } catch (e) {
    console.warn("Dashview: Failed to load i18n module", e);
    // Fallback t function if i18n fails to load
    t = (key, fallback) => typeof fallback === 'string' ? fallback : key;
  }

  class DashviewPanel extends LitElement {
    static get properties() {
      return {
        hass: { type: Object },
        narrow: { type: Boolean },
        route: { type: Object },
        panel: { type: Object },
        _currentTime: { type: String },
        _activeTab: { type: String },
        _areas: { type: Array },
        _enabledRooms: { type: Object },
        _enabledLights: { type: Object },
        _enabledMotionSensors: { type: Object },
        _enabledSmokeSensors: { type: Object },
        _enabledCovers: { type: Object },
        _coverInvertPosition: { type: Object },
        _enabledGarages: { type: Object },
        _enabledWindows: { type: Object },
        _enabledVibrationSensors: { type: Object },
        _enabledTemperatureSensors: { type: Object },
        _enabledHumiditySensors: { type: Object },
        _enabledClimates: { type: Object },
        _enabledMediaPlayers: { type: Object },
        _enabledTVs: { type: Object },
        _enabledLocks: { type: Object },
        _mediaPopupOpen: { type: Boolean },
        _activeMediaTab: { type: String },
        _lastMotionChangeTime: { type: Object },
        _motionDetected: { type: Boolean },
        _expandedAreas: { type: Object },
        _popupRoom: { type: Object },
        _popupCoverExpanded: { type: Boolean },
        _popupGarageExpanded: { type: Boolean },
        _popupLightExpanded: { type: Boolean },
        _popupMediaExpanded: { type: Boolean },
        _popupThermostatExpanded: { type: Boolean },
        _popupDevicesExpanded: { type: Boolean },
        _adminSubTab: { type: String },
        _labels: { type: Array },
        _entityRegistry: { type: Array },
        _deviceRegistry: { type: Array },
        _labelIdsReady: { type: Boolean },
        _scenes: { type: Array },
        _floors: { type: Array },
        _activeFloorTab: { type: String },
        _activeSecurityTab: { type: String },
        _securityPopupOpen: { type: Boolean },
        _lightsPopupOpen: { type: Boolean },
        _batteryPopupOpen: { type: Boolean },
        _adminPopupOpen: { type: Boolean },
        _notificationTempThreshold: { type: Number },
        _notificationHumidityThreshold: { type: Number },
        _weatherPopupOpen: { type: Boolean },
        _selectedForecastTab: { type: Number },
        _weatherEntity: { type: String },
        _weatherCurrentTempEntity: { type: String },
        _weatherCurrentStateEntity: { type: String },
        _weatherTodayTempEntity: { type: String },
        _weatherTodayStateEntity: { type: String },
        _weatherTomorrowTempEntity: { type: String },
        _weatherTomorrowStateEntity: { type: String },
        _weatherDay2TempEntity: { type: String },
        _weatherDay2StateEntity: { type: String },
        _weatherPrecipitationEntity: { type: String },
        _hourlyForecastEntity: { type: String },
        _weatherForecasts: { type: Array },
        _weatherHourlyForecasts: { type: Array },
        _availableWeatherEntities: { type: Array },
        _floorOrder: { type: Array },
        _roomOrder: { type: Object },
        _floorCardConfig: { type: Object },
        _openEntityDropdown: { type: String },
        _selectedFloorCardSlot: { type: String },
        _floorCardSearchState: { type: Object },
        _floorOverviewEnabled: { type: Object },
        _floorOverviewIndex: { type: Object },
        _garbageSensors: { type: Array },
        _garbageDisplayFloor: { type: String },
        _garbageCardIndex: { type: Number },
        _garbageSearchQuery: { type: String },
        _garbageSearchFocused: { type: Boolean },
        _dwdWarningSearchQuery: { type: String },
        _dwdWarningSearchFocused: { type: Boolean },
        _weatherEntitySearchQuery: { type: String },
        _weatherEntitySearchFocused: { type: Boolean },
        _personEntitySearchQuery: { type: String },
        _personEntitySearchFocused: { type: Boolean },
        _expandedCardSections: { type: Object },
        _thermostatHistory: { type: Object },
        // Info text configuration
        _infoTextConfig: { type: Object },
        _infoTextSearchQuery: { type: Object },
        _infoTextSearchFocused: { type: Object },
        // Scene buttons configuration
        _sceneButtons: { type: Array },
        _sceneButtonSearchQuery: { type: String },
        _sceneButtonSearchFocused: { type: Boolean },
        _editingSceneButton: { type: Object },
        // Room-specific scene buttons
        _roomSceneButtons: { type: Object },
        _editingRoomSceneButton: { type: String },
        _roomSceneIconSearchQuery: { type: String },
        _roomSceneIconSearchFocused: { type: Boolean },
        _roomSceneEntitySearchQuery: { type: String },
        _roomSceneEntitySearchFocused: { type: Boolean },
        // Media presets (playlists)
        _mediaPresets: { type: Array },
        _mediaPresetSearchQuery: { type: String },
        _mediaPresetSearchFocused: { type: Boolean },
        // User photos (custom photos per person entity)
        _userPhotos: { type: Object },
        // Thermostat swipe index per room
        _thermostatSwipeIndex: { type: Object },
        // Custom labels configuration
        _customLabels: { type: Object },
        _enabledCustomEntities: { type: Object },
        _expandedCustomLabels: { type: Object },
        _activeCustomLabelTab: { type: String },
        // Train departures configuration
        _trainDepartures: { type: Array },
        _trainSearchQuery: { type: String },
        _trainSearchFocused: { type: Boolean },
        // Changelog popup
        _changelogPopupOpen: { type: Boolean },
        _changelogPageIndex: { type: Number },
        _lastSeenVersion: { type: String },
      };
    }


    static get styles() {
      // Use external styles module as the single source of truth
      if (dashviewStyles) {
        return css([dashviewStyles]);
      }
      // Fallback: minimal styles if external module failed to load
      console.warn("Dashview: External styles not loaded, using minimal fallback");
      return css`
        :host {
          display: block;
          background: var(--primary-background-color);
          min-height: 100vh;
          box-sizing: border-box;
          max-width: 500px;
          margin: 0 auto;
        }
        @media (max-width: 500px) {
          :host {
            max-width: 100%;
          }
        }
      `;
    }

    constructor() {
      super();
      this._currentTime = "";
      this._timeInterval = null;
      this._activeTab = "home";
      this._areas = [];
      this._enabledRooms = {};
      this._enabledLights = {};
      this._enabledMotionSensors = {};
      this._enabledSmokeSensors = {};
      this._enabledCovers = {};
      this._coverInvertPosition = {};
      this._enabledMediaPlayers = {};
      this._enabledTVs = {};
      this._enabledLocks = {};
      this._mediaPopupOpen = false;
      this._activeMediaTab = null;
      this._enabledGarages = {};
      this._enabledWindows = {};
      this._enabledVibrationSensors = {};
      this._enabledTemperatureSensors = {};
      this._enabledHumiditySensors = {};
      this._enabledClimates = {};
      this._enabledRoofWindows = {};
      this._lastMotionChangeTime = null;
      this._motionDetected = false;
      this._previousMotionState = null;
      this._expandedAreas = {};
      this._popupRoom = null;
      this._popupCoverExpanded = false;
      this._popupGarageExpanded = false;
      this._popupLightExpanded = true;
      this._popupMediaExpanded = true;
      this._popupThermostatExpanded = true;
      this._popupRoofWindowExpanded = true;
      this._popupDevicesExpanded = true;
      this._adminSubTab = "labels";  // Start with Labels tab for initial setup
      this._settingsLoaded = false;
      this._settingsError = null;  // Error message if settings fail to load
      this._saveDebounceTimer = null;
      this._labels = [];
      this._entityRegistry = [];
      this._deviceRegistry = [];
      this._labelIdsReady = false;
      this._lightLabelId = null;
      this._mediaPlayerLabelId = null;
      this._motionLabelId = null;
      this._smokeLabelId = null;
      this._coverLabelId = null;
      this._garageLabelId = null;
      this._windowLabelId = null;
      this._vibrationLabelId = null;
      this._temperatureLabelId = null;
      this._humidityLabelId = null;
      this._climateLabelId = null;
      this._roofWindowLabelId = null;
      this._tvLabelId = null;
      this._lockLabelId = null;
      // Custom labels configuration - labels beyond the predefined ones
      this._customLabels = {};  // { labelId: { enabled: true, icon: 'mdi:...', name: 'Label Name' } }
      this._enabledCustomEntities = {};  // { entityId: { enabled: true, childEntities: ['entity_id1', 'entity_id2'] } }
      this._expandedCustomLabels = {};  // Track which custom label sections are expanded in admin
      // Enabled appliances (device-based)
      this._enabledAppliances = {};  // { deviceId: true/false }
      this._activeCustomLabelTab = null;  // Active tab in Other Entities section
      this._scenes = [];
      this._floors = [];
      this._activeFloorTab = null;
      this._activeSecurityTab = 'windows';
      this._securityPopupOpen = false;
      this._lightsPopupOpen = false;
      this._batteryPopupOpen = false;
      this._adminPopupOpen = false;
      this._notificationTempThreshold = 23;
      this._notificationHumidityThreshold = 60;
      this._weatherPopupOpen = false;
      this._selectedForecastTab = 0;
      this._weatherEntity = "weather.forecast_home";
      this._weatherCurrentTempEntity = "";
      this._weatherCurrentStateEntity = "";
      this._weatherTodayTempEntity = "";
      this._weatherTodayStateEntity = "";
      this._weatherTomorrowTempEntity = "";
      this._weatherTomorrowStateEntity = "";
      this._weatherDay2TempEntity = "";
      this._weatherDay2StateEntity = "";
      this._weatherPrecipitationEntity = "";
      this._hourlyForecastEntity = "";
      this._dwdWarningEntity = "";
      this._weatherForecasts = [];
      this._weatherHourlyForecasts = [];
      this._availableWeatherEntities = [];
      this._floorOrder = [];
      this._roomOrder = {};
      this._floorCardConfig = {};
      this._openEntityDropdown = null;
      this._selectedFloorCardSlot = null;
      this._floorCardSearchState = {};
      this._floorOverviewEnabled = {};
      this._floorOverviewIndex = {};
      this._garbageSensors = [];
      this._garbageDisplayFloor = null;
      this._garbageCardIndex = 0;
      this._garbageSearchQuery = '';
      this._garbageSearchFocused = false;
      this._dwdWarningSearchQuery = '';
      this._dwdWarningSearchFocused = false;
      this._weatherEntitySearchQuery = '';
      this._weatherEntitySearchFocused = false;
      this._personEntitySearchQuery = '';
      this._personEntitySearchFocused = false;
      this._expandedCardSections = {};
      this._thermostatHistory = {};
      // Info text configuration - which status items to show and their entity configs
      this._infoTextConfig = {
        motion: { enabled: true },
        garage: { enabled: true },
        washer: { enabled: true, entity: 'sensor.waschmaschine_operation_state', finishTimeEntity: 'sensor.waschmaschine_programme_finish_time' },
        windows: { enabled: false },
        lights: { enabled: false },
        covers: { enabled: false },
        dishwasher: { enabled: false, entity: '', finishTimeEntity: '' },
        dryer: { enabled: false, entity: '', finishTimeEntity: '' },
        vacuum: { enabled: false, entity: '' },
        batteryLow: { enabled: false, threshold: 20 },
      };
      // Search state for info text entity pickers
      this._infoTextSearchQuery = {};
      this._infoTextSearchFocused = {};
      // Scene buttons configuration
      this._sceneButtons = [];
      this._sceneButtonSearchQuery = '';
      this._sceneButtonSearchFocused = false;
      this._editingSceneButton = null;
      this._iconSearchQuery = '';
      this._iconSearchFocused = false;
      // Room-specific scene buttons
      this._roomSceneButtons = {};
      this._editingRoomSceneButton = null;
      this._roomSceneIconSearchQuery = '';
      this._roomSceneIconSearchFocused = false;
      this._roomSceneEntitySearchQuery = '';
      this._roomSceneEntitySearchFocused = false;
      // Media presets (playlists)
      this._mediaPresets = [];
      this._mediaPresetSearchQuery = '';
      this._mediaPresetSearchFocused = false;
      // User photos (custom photos per person entity)
      this._userPhotos = {};
      // Train departures configuration
      this._trainDepartures = [];
      this._trainSearchQuery = '';
      this._trainSearchFocused = false;
      // Entity search within rooms (not persisted)
      this._entitySearchTermsByRoom = {};
      this._entitySearchDebounceTimers = {};
      // Thermostat swipe index per room
      this._thermostatSwipeIndex = {};
      // Changelog popup state
      this._changelogPopupOpen = false;
      this._changelogPageIndex = 0;
      this._lastSeenVersion = null;
    }

    connectedCallback() {
      super.connectedCallback();
      this._updateTime();
      this._timeInterval = setInterval(() => this._updateTime(), 1000);
      // Close entity dropdown when clicking outside
      this._closeDropdownHandler = (e) => {
        if (this._openEntityDropdown && !e.target.closest('.floor-card-entity-selector')) {
          this._openEntityDropdown = null;
          this.requestUpdate();
        }
      };
      document.addEventListener('click', this._closeDropdownHandler);

      // Subscribe to store changes for reactive updates
      if (settingsStore) {
        this._unsubscribeSettings = settingsStore.subscribe(() => {
          this.requestUpdate();
        });
      }
      if (uiStateStore) {
        this._unsubscribeUIState = uiStateStore.subscribe(() => this.requestUpdate());
      }
      if (registryStore) {
        this._unsubscribeRegistry = registryStore.subscribe(() => this.requestUpdate());
      }
    }

    disconnectedCallback() {
      super.disconnectedCallback();
      if (this._timeInterval) {
        clearInterval(this._timeInterval);
      }
      if (this._saveDebounceTimer) {
        clearTimeout(this._saveDebounceTimer);
      }
      if (this._closeDropdownHandler) {
        document.removeEventListener('click', this._closeDropdownHandler);
      }
      // Unsubscribe from weather forecasts
      if (this._dailyForecastUnsubscribe) {
        this._dailyForecastUnsubscribe();
        this._dailyForecastUnsubscribe = null;
      }
      if (this._hourlyForecastUnsubscribe) {
        this._hourlyForecastUnsubscribe();
        this._hourlyForecastUnsubscribe = null;
      }
      // Unsubscribe from stores
      if (this._unsubscribeSettings) {
        this._unsubscribeSettings();
        this._unsubscribeSettings = null;
      }
      if (this._unsubscribeUIState) {
        this._unsubscribeUIState();
        this._unsubscribeUIState = null;
      }
      if (this._unsubscribeRegistry) {
        this._unsubscribeRegistry();
        this._unsubscribeRegistry = null;
      }
      // Cleanup admin tab drag scroll listeners
      if (dashviewAdmin?.cleanupAdminTabDragScroll) {
        dashviewAdmin.cleanupAdminTabDragScroll(this);
      }
    }

    _saveSettings() {
      if (coreUtils) {
        coreUtils.saveSettings(this, settingsStore, debugLog);
      }
    }

    /**
     * Handle temperature threshold change from admin input
     * @param {Event} e - Input change event
     */
    _handleTempThresholdChange(e) {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 0 && value <= 50) {
        this._notificationTempThreshold = value;
        this._saveSettings();
        this.requestUpdate();
      }
    }

    /**
     * Handle humidity threshold change from admin input
     * @param {Event} e - Input change event
     */
    _handleHumidityThresholdChange(e) {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= 0 && value <= 100) {
        this._notificationHumidityThreshold = value;
        this._saveSettings();
        this.requestUpdate();
      }
    }

    /**
     * Set a category's label mapping
     * @param {string} category - Category key (light, cover, etc.)
     * @param {string|null} labelId - Label ID to map, or null to clear
     */
    _setCategoryLabel(category, labelId) {
      if (coreUtils) {
        coreUtils.setCategoryLabel(this, category, labelId, () => this._saveSettings(), () => this._updateRoomDataServiceLabelIds());
      }
    }

    /**
     * Update roomDataService with current label ID mappings
     */
    _updateRoomDataServiceLabelIds() {
      if (coreUtils) {
        coreUtils.updateRoomDataServiceLabelIds(this, roomDataService);
      }
    }

    _getAreaIdForEntity(entityId) {
      // First check if entity has area_id directly
      const entityReg = this._entityRegistry.find(e => e.entity_id === entityId);
      if (!entityReg) return null;

      // If entity has area_id, use it
      if (entityReg.area_id) return entityReg.area_id;

      // Otherwise, look up the device and get area from there
      if (entityReg.device_id) {
        const device = this._deviceRegistry.find(d => d.id === entityReg.device_id);
        if (device && device.area_id) {
          return device.area_id;
        }
      }

      return null;
    }

    // Check if an entity has the currently configured label for its category
    _entityHasCurrentLabel(entityId, labelId) {
      if (!labelId) return false;
      const entityReg = this._entityRegistry.find(e => e.entity_id === entityId);
      if (!entityReg) return false;
      return entityReg.labels && entityReg.labels.includes(labelId);
    }

    _loadScenes() {
      if (!this.hass) return;

      // Get all scene entities from hass.states
      const scenes = dashviewUtils.sortByName(
        Object.values(this.hass.states)
          .filter(entity => entity.entity_id.startsWith("scene."))
          .map(entity => ({
            entity_id: entity.entity_id,
            name: entity.attributes.friendly_name || entity.entity_id.replace("scene.", ""),
            icon: entity.attributes.icon || "mdi:palette",
          }))
      );

      this._scenes = scenes;
    }

    _activateScene(entityId) {
      if (!this.hass) return;
      this.hass.callService("scene", "turn_on", {
        entity_id: entityId,
        transition: 2,
      });
    }

    async _loadMediaPresetsFromLegacyFile() {
      try {
        const response = await fetch('/local/dashview/config/media_presets.json');
        if (response.ok) {
          const data = await response.json();
          this._mediaPresets = data.media_presets || [];
          // Migrate legacy presets to settings store
          if (this._mediaPresets.length > 0) {
            this._saveSettings();
            debugLog("Media presets migrated from legacy file:", this._mediaPresets.length);
          }
          this.requestUpdate();
        }
      } catch (e) {
        console.warn('Dashview: Could not load media presets from legacy file', e);
        this._mediaPresets = [];
      }
    }

    _addMediaPreset() {
      this._mediaPresets = [...this._mediaPresets, { name: '', media_content_id: '' }];
      this._saveSettings();
      this.requestUpdate();
    }

    _updateMediaPreset(index, field, value) {
      const presets = [...this._mediaPresets];
      presets[index] = { ...presets[index], [field]: value };
      this._mediaPresets = presets;
      this._saveSettings();
      this.requestUpdate();
    }

    _removeMediaPreset(index) {
      this._mediaPresets = this._mediaPresets.filter((_, i) => i !== index);
      this._saveSettings();
      this.requestUpdate();
    }

    _moveMediaPreset(index, direction) {
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= this._mediaPresets.length) return;
      const presets = [...this._mediaPresets];
      const temp = presets[index];
      presets[index] = presets[newIndex];
      presets[newIndex] = temp;
      this._mediaPresets = presets;
      this._saveSettings();
      this.requestUpdate();
    }

    _playMediaPreset(entityId, mediaContentId) {
      if (!this.hass || !entityId || !mediaContentId) return;
      this.hass.callService('media_player', 'play_media', {
        entity_id: entityId,
        media_content_id: mediaContentId,
        media_content_type: 'music',
      });
    }

    _getGarbageData() {
      if (!this.hass || !this._garbageSensors || this._garbageSensors.length === 0) {
        return [];
      }

      const garbageData = [];

      this._garbageSensors.forEach(sensor => {
        // Handle both string (entity_id) and object formats
        const entityId = typeof sensor === 'string' ? sensor : sensor.entity_id;
        const sensorConfig = typeof sensor === 'string' ? {} : sensor;

        const state = this.hass.states[entityId];
        if (!state || !state.state || state.state === 'unavailable' || state.state === 'unknown') return;

        const stateValue = state.state;

        // Parse days from the state - handle various formats
        let days = null;

        // Check for German text formats
        if (stateValue === 'Heute' || stateValue.toLowerCase() === 'today') {
          days = 0;
        } else if (stateValue === 'Morgen' || stateValue.toLowerCase() === 'tomorrow') {
          days = 1;
        } else {
          // Try to extract number from strings like "6 Tage", "13 Tage", "6 days"
          const daysMatch = stateValue.match(/^(\d+)\s*(Tage?|days?|d)?$/i);
          if (daysMatch) {
            days = parseInt(daysMatch[1], 10);
          } else {
            // Try to parse as a date (ISO format or other)
            const parsedDate = new Date(stateValue);
            if (!isNaN(parsedDate.getTime())) {
              const now = new Date();
              const diffTime = parsedDate.getTime() - now.getTime();
              days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            }
          }
        }

        // Skip if we couldn't determine days
        if (days === null) return;

        // Use the state value directly as label since it's already formatted
        const label = stateValue;

        garbageData.push({
          entity_id: entityId,
          name: sensorConfig.name || state.attributes.friendly_name || entityId.replace('sensor.', '').replace(/_/g, ' '),
          icon: sensorConfig.icon || state.attributes.icon || 'mdi:trash-can',
          days: days,
          label: label,
        });
      });

      // Sort by days (earliest first)
      garbageData.sort((a, b) => a.days - b.days);

      return garbageData;
    }

    // Garbage search methods
    _handleGarbageSearch(query) {
      this._garbageSearchQuery = query;
      this.requestUpdate();
    }

    _getGarbageSearchSuggestions() {
      if (!this.hass || !this._garbageSearchQuery) return [];

      const query = this._garbageSearchQuery.toLowerCase();
      return Object.keys(this.hass.states)
        .filter(entityId => {
          if (!entityId.startsWith('sensor.')) return false;
          const state = this.hass.states[entityId];
          const friendlyName = (state?.attributes?.friendly_name || '').toLowerCase();
          return entityId.toLowerCase().includes(query) || friendlyName.includes(query);
        })
        .slice(0, 10) // Limit suggestions
        .map(entityId => ({ entity_id: entityId }));
    }

    _addGarbageSensor(entityId) {
      if (!this._garbageSensors.includes(entityId)) {
        this._garbageSensors = [...this._garbageSensors, entityId];
        this._garbageSearchQuery = '';
        this._saveSettings();
        this.requestUpdate();
      }
    }

    _removeGarbageSensor(entityId) {
      this._garbageSensors = this._garbageSensors.filter(id => id !== entityId);
      this._saveSettings();
      this.requestUpdate();
    }

    // Train departure methods
    _handleTrainSearch(query) {
      this._trainSearchQuery = query;
      this.requestUpdate();
    }

    _getTrainSearchSuggestions() {
      if (!this.hass || !this._trainSearchQuery) return [];

      const query = this._trainSearchQuery.toLowerCase();
      return Object.keys(this.hass.states)
        .filter(entityId => {
          if (!entityId.startsWith('sensor.')) return false;
          const state = this.hass.states[entityId];
          const friendlyName = (state?.attributes?.friendly_name || '').toLowerCase();
          // Check for departure-related attributes
          const hasDepartures = state?.attributes?.next_departures !== undefined;
          return (entityId.toLowerCase().includes(query) || friendlyName.includes(query)) &&
                 (hasDepartures || entityId.includes('departure') || entityId.includes('train') ||
                  entityId.includes('bahn') || entityId.includes('zug'));
        })
        .slice(0, 10)
        .map(entityId => ({ entity_id: entityId }));
    }

    _addTrainDeparture(entityId) {
      const state = this.hass?.states[entityId];
      const friendlyName = state?.attributes?.friendly_name || entityId;
      // Generate unique ID for each entry (allows same entity multiple times)
      const id = `${entityId}_${Date.now()}`;
      this._trainDepartures = [...this._trainDepartures, {
        id: id,
        entity: entityId,
        label: friendlyName,
        conditionEntity: '',
        conditionState: '',
        delayMinutes: 0,
        timeStart: '',
        timeEnd: ''
      }];
      this._trainSearchQuery = '';
      this._saveSettings();
      this.requestUpdate();
    }

    _removeTrainDeparture(trainId) {
      this._trainDepartures = this._trainDepartures.filter(t => (t.id || t.entity) !== trainId);
      this._saveSettings();
      this.requestUpdate();
    }

    _updateTrainDeparture(trainId, field, value) {
      this._trainDepartures = this._trainDepartures.map(t => {
        if ((t.id || t.entity) === trainId) {
          return { ...t, [field]: value };
        }
        return t;
      });
      this._saveSettings();
      this.requestUpdate();
    }

    _getNextTrainDeparture(trainConfig) {
      if (!this.hass || !trainConfig.entity) return null;

      const state = this.hass.states[trainConfig.entity];
      if (!state) return null;

      const departures = state.attributes?.next_departures;
      if (!departures || !Array.isArray(departures) || departures.length === 0) return null;

      const now = new Date();
      const delayMinutes = trainConfig.delayMinutes || 0;

      // Find the next valid departure
      const nextTrain = departures.find(train => {
        if (train.isCancelled) return false;
        const [h, m] = train.scheduledDeparture.split(':').map(Number);
        const departureTime = new Date();
        departureTime.setHours(h, m + (train.delayDeparture || 0), 0, 0);
        // Check if departure is far enough in the future
        return (departureTime - now) / 60000 >= delayMinutes;
      });

      if (!nextTrain) return null;

      // Calculate actual departure time
      const [h, m] = nextTrain.scheduledDeparture.split(':').map(Number);
      const totalMinutes = h * 60 + m + (nextTrain.delayDeparture || 0);
      const newH = Math.floor(totalMinutes / 60) % 24;
      const newM = totalMinutes % 60;

      return {
        time: `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`,
        delay: nextTrain.delayDeparture || 0,
        isDelayed: (nextTrain.delayDeparture || 0) > 0,
        destination: nextTrain.direction || trainConfig.label || '',
        line: nextTrain.line || '',
        platform: nextTrain.platform || ''
      };
    }

    _getVisibleTrainDepartures() {
      if (!this.hass || !this._trainDepartures || this._trainDepartures.length === 0) return [];

      const now = new Date();
      const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes since midnight

      return this._trainDepartures.filter(train => {
        // Check time range first
        if (train.timeStart || train.timeEnd) {
          const parseTime = (timeStr) => {
            if (!timeStr) return null;
            const [h, m] = timeStr.split(':').map(Number);
            return h * 60 + m;
          };

          const startMinutes = parseTime(train.timeStart);
          const endMinutes = parseTime(train.timeEnd);

          // If only start time is set
          if (startMinutes !== null && endMinutes === null) {
            if (currentTime < startMinutes) return false;
          }
          // If only end time is set
          else if (startMinutes === null && endMinutes !== null) {
            if (currentTime > endMinutes) return false;
          }
          // If both are set
          else if (startMinutes !== null && endMinutes !== null) {
            // Handle overnight ranges (e.g., 22:00 - 06:00)
            if (startMinutes <= endMinutes) {
              // Normal range (e.g., 06:00 - 22:00)
              if (currentTime < startMinutes || currentTime > endMinutes) return false;
            } else {
              // Overnight range (e.g., 22:00 - 06:00)
              if (currentTime < startMinutes && currentTime > endMinutes) return false;
            }
          }
        }

        // Check entity condition
        if (!train.conditionEntity) return true;

        const conditionState = this.hass.states[train.conditionEntity];
        if (!conditionState) return false;

        // Check if condition matches
        if (train.conditionState) {
          return conditionState.state === train.conditionState;
        }
        // For numeric conditions (like zone.xxx above 0)
        const numericValue = parseFloat(conditionState.state);
        if (!isNaN(numericValue)) {
          return numericValue > 0;
        }
        return conditionState.state !== '0' && conditionState.state !== 'off' && conditionState.state !== 'unavailable';
      });
    }

    // Entity search within room methods
    _handleEntitySearch(roomId, query) {
      // Initialize state if not exists
      if (!this._entitySearchTermsByRoom) {
        this._entitySearchTermsByRoom = {};
      }
      if (!this._entitySearchDebounceTimers) {
        this._entitySearchDebounceTimers = {};
      }

      // Clear existing debounce timer for this room
      if (this._entitySearchDebounceTimers[roomId]) {
        clearTimeout(this._entitySearchDebounceTimers[roomId]);
      }

      // Set the search term immediately for input responsiveness
      this._entitySearchTermsByRoom[roomId] = query;
      this.requestUpdate();

      // Debounce the filtering (150ms)
      this._entitySearchDebounceTimers[roomId] = setTimeout(() => {
        this.requestUpdate();
      }, 150);
    }

    _clearEntitySearch(roomId) {
      if (!this._entitySearchTermsByRoom) {
        this._entitySearchTermsByRoom = {};
      }
      this._entitySearchTermsByRoom[roomId] = '';
      this.requestUpdate();
    }

    _filterEntities(entities, searchTerm) {
      if (!searchTerm || !searchTerm.trim()) return entities;

      const term = searchTerm.toLowerCase().trim();
      return entities.filter(entity => {
        const name = (entity.name || entity.friendly_name || '').toLowerCase();
        return name.includes(term);
      });
    }

    _addSceneButton() {
      this._sceneButtons = [...this._sceneButtons, { label: '', icon: 'mdi:lightbulb', actionType: 'service', entity: '' }];
      this._saveSettings();
      this.requestUpdate();
    }

    _handleFloorCardEntityChange(floorId, slotIndex, entityId, entityData = null) {
      const currentFloorConfig = this._floorCardConfig[floorId] || {};

      // For appliances, store additional data needed for device card rendering
      let slotData = null;
      if (entityId) {
        if (entityData && entityData.type === 'appliance' && entityData.appliance) {
          slotData = {
            entity_id: entityId,
            type: 'appliance',
            appliance: entityData.appliance
          };
        } else {
          slotData = { entity_id: entityId };
        }
      }

      this._floorCardConfig = {
        ...this._floorCardConfig,
        [floorId]: {
          ...currentFloorConfig,
          [slotIndex]: slotData
        }
      };
      this._saveSettings();
      this.requestUpdate();
    }

    _toggleFloorOverview(floorId) {
      this._floorOverviewEnabled = {
        ...this._floorOverviewEnabled,
        [floorId]: !this._floorOverviewEnabled[floorId]
      };
      this._saveSettings();
      this.requestUpdate();
    }

    _setGarbageDisplayFloor(floorId) {
      this._garbageDisplayFloor = floorId;
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Move a floor up or down in the display order
     * @param {string} floorId - The floor ID to move
     * @param {number} direction - -1 for up, 1 for down
     */
    _moveFloor(floorId, direction) {
      // Get current floor order or create from existing floors
      let floorOrder = [...(this._floorOrder || [])];

      // If floorOrder is empty, initialize it from available floors
      if (floorOrder.length === 0 && this._floors) {
        floorOrder = this._floors.map(f => f.floor_id);
      }

      const currentIndex = floorOrder.indexOf(floorId);
      if (currentIndex === -1) {
        // Floor not in order yet, add it
        floorOrder.push(floorId);
        return;
      }

      const newIndex = currentIndex + direction;

      // Check bounds
      if (newIndex < 0 || newIndex >= floorOrder.length) {
        return;
      }

      // Swap positions
      [floorOrder[currentIndex], floorOrder[newIndex]] = [floorOrder[newIndex], floorOrder[currentIndex]];

      this._floorOrder = floorOrder;
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Move a room up or down in the display order within a floor
     * @param {string|null} floorId - The floor ID (null for unassigned rooms)
     * @param {string} areaId - The area/room ID to move
     * @param {number} direction - -1 for up, 1 for down
     */
    _moveRoom(floorId, areaId, direction) {
      const orderKey = floorId || '_unassigned';

      // Get current room order for this floor or create from existing areas
      let roomOrder = { ...(this._roomOrder || {}) };
      let floorRoomOrder = [...(roomOrder[orderKey] || [])];

      // If floorRoomOrder is empty, initialize it from available areas for this floor
      if (floorRoomOrder.length === 0 && this._areas) {
        const areasForFloor = this._areas.filter(a => {
          if (floorId === null) {
            return !a.floor_id;
          }
          return a.floor_id === floorId;
        });
        floorRoomOrder = areasForFloor.map(a => a.area_id);
      }

      const currentIndex = floorRoomOrder.indexOf(areaId);
      if (currentIndex === -1) {
        // Room not in order yet, add it
        floorRoomOrder.push(areaId);
        roomOrder[orderKey] = floorRoomOrder;
        this._roomOrder = roomOrder;
        this._saveSettings();
        this.requestUpdate();
        return;
      }

      const newIndex = currentIndex + direction;

      // Check bounds
      if (newIndex < 0 || newIndex >= floorRoomOrder.length) {
        return;
      }

      // Swap positions
      [floorRoomOrder[currentIndex], floorRoomOrder[newIndex]] = [floorRoomOrder[newIndex], floorRoomOrder[currentIndex]];

      roomOrder[orderKey] = floorRoomOrder;
      this._roomOrder = roomOrder;
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Handle floor reorder from drag-and-drop
     * @param {Object} detail - Reorder event detail from sortable-list
     * @param {string[]} detail.order - New floor order (floor_ids)
     * @param {number} detail.oldIndex - Original position
     * @param {number} detail.newIndex - New position
     * @param {string} detail.itemId - Moved floor's floor_id
     */
    _handleFloorReorder(detail) {
      const { order, oldIndex, newIndex } = detail;
      const oldFloorOrder = [...(this._floorOrder || [])];

      // If floorOrder is empty, initialize from available floors
      if (oldFloorOrder.length === 0 && this._floors) {
        this._floorOrder = this._floors.map(f => f.floor_id);
      }

      // Apply new order
      this._floorOrder = order;

      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Handle room reorder from drag-and-drop within a floor
     * @param {string|null} floorId - The floor ID (null for unassigned rooms)
     * @param {Object} detail - Reorder event detail from sortable-list
     * @param {string[]} detail.order - New room order (area_ids)
     * @param {number} detail.oldIndex - Original position
     * @param {number} detail.newIndex - New position
     * @param {string} detail.itemId - Moved room's area_id
     */
    _handleRoomReorder(floorId, detail) {
      const { order, oldIndex } = detail;
      const orderKey = floorId || '_unassigned';

      // Get current room order
      const roomOrder = { ...(this._roomOrder || {}) };
      const oldRoomOrder = [...(roomOrder[orderKey] || [])];

      // If room order is empty, initialize from available areas
      if (oldRoomOrder.length === 0 && this._areas) {
        const areasForFloor = this._areas.filter(a => {
          if (floorId === null) {
            return !a.floor_id;
          }
          return a.floor_id === floorId;
        });
        roomOrder[orderKey] = areasForFloor.map(a => a.area_id);
      }

      // Apply new order
      roomOrder[orderKey] = order;
      this._roomOrder = roomOrder;

      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Handle media preset reorder from drag-and-drop
     * @param {Object} detail - Reorder event detail from sortable-list
     * @param {string[]} detail.order - New preset order (by index)
     * @param {number} detail.oldIndex - Original position
     * @param {number} detail.newIndex - New position
     * @param {string} detail.itemId - Moved preset's index (as string)
     */
    _handleMediaPresetReorder(detail) {
      const { order, oldIndex, newIndex } = detail;
      const oldPresets = [...(this._mediaPresets || [])];

      // Reorder presets based on new order (order contains indices as strings)
      const newPresets = order.map(indexStr => {
        const index = parseInt(indexStr, 10);
        return oldPresets[index];
      }).filter(Boolean);

      // Apply new order
      this._mediaPresets = newPresets;

      this._saveSettings();
      this.requestUpdate();
    }

    updated(changedProperties) {
      if (changedProperties.has("hass") && this.hass) {
        // Language detection and i18n initialization
        if (this.hass?.language && initI18n && getCurrentLang && isI18nInitialized) {
          const rawLang = this.hass.language;
          const baseLang = rawLang.split('-')[0]; // 'de-DE' -> 'de'
          const supportedLangs = ['en', 'de'];
          const targetLang = supportedLangs.includes(baseLang) ? baseLang : 'en';
          const currentLang = getCurrentLang();
          const alreadyInitialized = isI18nInitialized();

          // Initialize if not yet initialized OR if language changed
          if (!alreadyInitialized || targetLang !== currentLang) {
            console.log(`[Dashview] Initializing i18n: target=${targetLang}, current=${currentLang}, initialized=${alreadyInitialized}`);
            initI18n(targetLang).then(() => {
              console.log('[Dashview] i18n loaded, requesting update');
              this.requestUpdate();
            }).catch(err => {
              console.warn('[Dashview] i18n initialization failed:', err);
            });
          }
        }

        // Initialize stores with hass instance
        if (settingsStore && !settingsStore._hass) {
          settingsStore.setHass(this.hass);
        }
        if (registryStore && !registryStore._hass) {
          registryStore.setHass(this.hass);
        }
        // Update RoomDataService with hass on every hass change
        if (roomDataService) {
          roomDataService.setHass(this.hass);
        }

        // Load registry data via store (replaces _loadAreas, _loadLabels, etc.)
        if (registryStore && !registryStore._data.areasLoading && registryStore.areas.length === 0) {
          registryStore.loadAll().then(() => {
            // Sync store data to local properties for backwards compatibility during transition
            this._areas = registryStore.areas;
            this._floors = registryStore.floors;
            this._entityRegistry = registryStore.entityRegistry;
            this._deviceRegistry = registryStore.deviceRegistry;
            this._labels = registryStore.labels;
            // Copy auto-detected label IDs ONLY as fallback defaults (don't overwrite user settings)
            // User-configured labels from categoryLabels take precedence
            const labelIds = registryStore.labelIds;
            // Only set from auto-detection if user hasn't configured this category yet
            if (this._lightLabelId === null) this._lightLabelId = labelIds.light;
            if (this._motionLabelId === null) this._motionLabelId = labelIds.motion;
            if (this._smokeLabelId === null) this._smokeLabelId = labelIds.smoke;
            if (this._coverLabelId === null) this._coverLabelId = labelIds.cover;
            if (this._garageLabelId === null) this._garageLabelId = labelIds.garage;
            if (this._windowLabelId === null) this._windowLabelId = labelIds.window;
            if (this._vibrationLabelId === null) this._vibrationLabelId = labelIds.vibration;
            if (this._temperatureLabelId === null) this._temperatureLabelId = labelIds.temperature;
            if (this._humidityLabelId === null) this._humidityLabelId = labelIds.humidity;
            if (this._climateLabelId === null) this._climateLabelId = labelIds.climate;
            if (this._roofWindowLabelId === null) this._roofWindowLabelId = labelIds.roofWindow;
            if (this._mediaPlayerLabelId === null) this._mediaPlayerLabelId = labelIds.mediaPlayer;
            if (this._tvLabelId === null) this._tvLabelId = labelIds.tv;
            this._scenes = registryStore.scenes;
            // Update RoomDataService with registry data
            if (roomDataService) {
              roomDataService.setEntityRegistry(this._entityRegistry);
              roomDataService.setDeviceRegistry(this._deviceRegistry);
              // Use current label IDs (user-configured take precedence over auto-detected)
              this._updateRoomDataServiceLabelIds();
            }
            // Mark label IDs as ready - this triggers reactive update
            this._labelIdsReady = true;
            debugLog("Registry data synced from store, labelIdsReady=true");
            this.requestUpdate();
          });
        }

        // Load settings via store (replaces _loadSettings)
        if (settingsStore && !settingsStore.loaded && !settingsStore._loading) {
          settingsStore._loading = true;
          settingsStore.load().then(() => {
            settingsStore._loading = false;
            // Sync store data to local properties for backwards compatibility
            const settings = settingsStore.all;
            this._enabledRooms = settings.enabledRooms || {};
            this._enabledLights = settings.enabledLights || {};
            this._enabledMotionSensors = settings.enabledMotionSensors || {};
            this._enabledSmokeSensors = settings.enabledSmokeSensors || {};
            this._enabledCovers = settings.enabledCovers || {};
            this._coverInvertPosition = settings.coverInvertPosition || {};
            this._enabledMediaPlayers = settings.enabledMediaPlayers || {};
            this._enabledTVs = settings.enabledTVs || {};
            this._enabledLocks = settings.enabledLocks || {};
            this._enabledGarages = settings.enabledGarages || {};
            this._enabledWindows = settings.enabledWindows || {};
            this._enabledVibrationSensors = settings.enabledVibrationSensors || {};
            this._enabledTemperatureSensors = settings.enabledTemperatureSensors || {};
            this._enabledHumiditySensors = settings.enabledHumiditySensors || {};
            this._enabledClimates = settings.enabledClimates || {};
            this._enabledRoofWindows = settings.enabledRoofWindows || {};
            this._notificationTempThreshold = settings.notificationTempThreshold ?? 23;
            this._notificationHumidityThreshold = settings.notificationHumidityThreshold ?? 60;
            this._weatherEntity = settings.weatherEntity;
            this._weatherCurrentTempEntity = settings.weatherCurrentTempEntity;
            this._weatherCurrentStateEntity = settings.weatherCurrentStateEntity;
            this._weatherTodayTempEntity = settings.weatherTodayTempEntity;
            this._weatherTodayStateEntity = settings.weatherTodayStateEntity;
            this._weatherTomorrowTempEntity = settings.weatherTomorrowTempEntity;
            this._weatherTomorrowStateEntity = settings.weatherTomorrowStateEntity;
            this._weatherDay2TempEntity = settings.weatherDay2TempEntity;
            this._weatherDay2StateEntity = settings.weatherDay2StateEntity;
            this._weatherPrecipitationEntity = settings.weatherPrecipitationEntity;
            this._hourlyForecastEntity = settings.hourlyForecastEntity;
            this._dwdWarningEntity = settings.dwdWarningEntity;
            this._floorOrder = settings.floorOrder || [];
            this._roomOrder = settings.roomOrder || {};
            this._floorCardConfig = settings.floorCardConfig || {};
            this._floorOverviewEnabled = settings.floorOverviewEnabled || {};
            this._garbageSensors = settings.garbageSensors || [];
            this._garbageDisplayFloor = settings.garbageDisplayFloor || null;
            this._infoTextConfig = { ...this._infoTextConfig, ...settings.infoTextConfig };
            this._sceneButtons = settings.sceneButtons || [];
            this._roomSceneButtons = settings.roomSceneButtons || {};
            this._customLabels = settings.customLabels || {};
            this._enabledCustomEntities = settings.enabledCustomEntities || {};
            this._enabledAppliances = settings.enabledAppliances || {};
            this._trainDepartures = settings.trainDepartures || [];
            this._mediaPresets = settings.mediaPresets || [];
            this._userPhotos = settings.userPhotos || {};
            this._lastSeenVersion = settings.lastSeenVersion || null;
            // Load category label mappings (user-configured labels for each category)
            // Use 'in' check to properly handle null values (null is a valid setting meaning "no label")
            if (settings.categoryLabels) {
              this._lightLabelId = 'light' in settings.categoryLabels ? settings.categoryLabels.light : this._lightLabelId;
              this._coverLabelId = 'cover' in settings.categoryLabels ? settings.categoryLabels.cover : this._coverLabelId;
              this._roofWindowLabelId = 'roofWindow' in settings.categoryLabels ? settings.categoryLabels.roofWindow : this._roofWindowLabelId;
              this._windowLabelId = 'window' in settings.categoryLabels ? settings.categoryLabels.window : this._windowLabelId;
              this._garageLabelId = 'garage' in settings.categoryLabels ? settings.categoryLabels.garage : this._garageLabelId;
              this._motionLabelId = 'motion' in settings.categoryLabels ? settings.categoryLabels.motion : this._motionLabelId;
              this._smokeLabelId = 'smoke' in settings.categoryLabels ? settings.categoryLabels.smoke : this._smokeLabelId;
              this._vibrationLabelId = 'vibration' in settings.categoryLabels ? settings.categoryLabels.vibration : this._vibrationLabelId;
              this._temperatureLabelId = 'temperature' in settings.categoryLabels ? settings.categoryLabels.temperature : this._temperatureLabelId;
              this._humidityLabelId = 'humidity' in settings.categoryLabels ? settings.categoryLabels.humidity : this._humidityLabelId;
              this._climateLabelId = 'climate' in settings.categoryLabels ? settings.categoryLabels.climate : this._climateLabelId;
              this._mediaPlayerLabelId = 'mediaPlayer' in settings.categoryLabels ? settings.categoryLabels.mediaPlayer : this._mediaPlayerLabelId;
              this._tvLabelId = 'tv' in settings.categoryLabels ? settings.categoryLabels.tv : this._tvLabelId;
              this._lockLabelId = 'lock' in settings.categoryLabels ? settings.categoryLabels.lock : this._lockLabelId;
            }
            this._settingsLoaded = true;
            this._settingsError = null;
            // Check for new version and show changelog popup if needed
            this._checkForNewVersion();
            // Update RoomDataService with enabled maps
            if (roomDataService) {
              roomDataService.setEnabledMaps({
                enabledLights: this._enabledLights,
                enabledMotionSensors: this._enabledMotionSensors,
                enabledSmokeSensors: this._enabledSmokeSensors,
                enabledCovers: this._enabledCovers,
                coverInvertPosition: this._coverInvertPosition,
                enabledGarages: this._enabledGarages,
                enabledWindows: this._enabledWindows,
                enabledVibrationSensors: this._enabledVibrationSensors,
                enabledTemperatureSensors: this._enabledTemperatureSensors,
                enabledHumiditySensors: this._enabledHumiditySensors,
                enabledClimates: this._enabledClimates,
                enabledRoofWindows: this._enabledRoofWindows,
                enabledMediaPlayers: this._enabledMediaPlayers,
                enabledTVs: this._enabledTVs,
                enabledLocks: this._enabledLocks,
              });
            }
            // Update roomDataService with user-configured label IDs
            this._updateRoomDataServiceLabelIds();
            debugLog("Settings synced from store");
            this.requestUpdate();
          }).catch(e => {
            settingsStore._loading = false;
            console.error("Failed to load settings from store:", e);
          });
        }

        // Load media presets from legacy JSON file if not configured in settings
        if (this._mediaPresets.length === 0) {
          this._loadMediaPresetsFromLegacyFile();
        }
        // Update available weather entities list
        this._updateAvailableWeatherEntities();
        // Fetch weather forecasts if popup is open or periodically
        if (this._weatherForecasts.length === 0) {
          this._fetchWeatherForecasts();
        }
      }
    }

    _updateAvailableWeatherEntities() {
      if (!this.hass) return;
      const weatherEntities = dashviewUtils.sortByName(
        Object.keys(this.hass.states)
          .filter(entityId => entityId.startsWith('weather.'))
          .map(entityId => ({
            entity_id: entityId,
            name: this.hass.states[entityId].attributes.friendly_name || entityId
          }))
      );

      // Only update if changed
      if (JSON.stringify(weatherEntities) !== JSON.stringify(this._availableWeatherEntities)) {
        this._availableWeatherEntities = weatherEntities;
      }
    }

    async _fetchWeatherForecasts() {
      if (!this.hass) return;

      const weatherEntity = this._weatherEntity || 'weather.forecast_home';
      let entityToUse = weatherEntity;

      if (!this.hass.states[weatherEntity]) {
        // Try to find any weather entity
        entityToUse = Object.keys(this.hass.states).find(e => e.startsWith('weather.'));
        if (!entityToUse) return;
      }

      // Subscribe to daily forecast
      try {
        if (this._dailyForecastUnsubscribe) {
          this._dailyForecastUnsubscribe();
        }
        this._dailyForecastUnsubscribe = await this.hass.connection.subscribeMessage(
          (event) => {
            if (event.forecast) {
              this._weatherForecasts = event.forecast;
              this.requestUpdate();
            }
          },
          {
            type: 'weather/subscribe_forecast',
            entity_id: entityToUse,
            forecast_type: 'daily',
          }
        );
      } catch (e) {
        debugLog('Daily forecast subscription failed, trying attributes:', e);
        // Fallback: try to get forecast from entity attributes (older integrations)
        const entity = this.hass.states[entityToUse];
        if (entity && entity.attributes && entity.attributes.forecast) {
          this._weatherForecasts = entity.attributes.forecast;
          this.requestUpdate();
        }
      }

      // Subscribe to hourly forecast
      try {
        if (this._hourlyForecastUnsubscribe) {
          this._hourlyForecastUnsubscribe();
        }
        this._hourlyForecastUnsubscribe = await this.hass.connection.subscribeMessage(
          (event) => {
            if (event.forecast) {
              this._weatherHourlyForecasts = event.forecast;
              this.requestUpdate();
            }
          },
          {
            type: 'weather/subscribe_forecast',
            entity_id: entityToUse,
            forecast_type: 'hourly',
          }
        );
      } catch (e) {
        debugLog('Hourly forecast subscription failed:', e);
      }
    }

    _updateTime() {
      const now = new Date();
      this._currentTime = now.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }

    _toggleMenu() {
      this.dispatchEvent(
        new Event("hass-toggle-menu", { bubbles: true, composed: true })
      );
    }

    _toggleLight(entityId) {
      if (!this.hass) return;
      this.hass.callService("light", "toggle", { entity_id: entityId });
    }

    _toggleTV(entityId) {
      if (!this.hass) return;
      this.hass.callService("media_player", "toggle", { entity_id: entityId });
    }

    _toggleLock(entityId) {
      if (!this.hass) return;
      const state = this.hass.states[entityId];
      const isLocked = state?.state === 'locked';
      this.hass.callService("lock", isLocked ? "unlock" : "lock", { entity_id: entityId });
    }

    // Generic toggle helper for enabled entity settings
    // Note: Entities are enabled by default (when not in map or undefined)
    // Only explicit false means disabled
    _toggleEntityEnabled(settingsKey, entityId) {
      const isCurrentlyEnabled = this[settingsKey][entityId] !== false;
      this[settingsKey] = { ...this[settingsKey], [entityId]: !isCurrentlyEnabled };
      this._saveSettings();
      // Update roomDataService with the new enabled maps
      if (roomDataService) {
        roomDataService.setEnabledMaps({
          enabledLights: this._enabledLights,
          enabledMotionSensors: this._enabledMotionSensors,
          enabledSmokeSensors: this._enabledSmokeSensors,
          enabledCovers: this._enabledCovers,
          coverInvertPosition: this._coverInvertPosition,
          enabledGarages: this._enabledGarages,
          enabledWindows: this._enabledWindows,
          enabledVibrationSensors: this._enabledVibrationSensors,
          enabledTemperatureSensors: this._enabledTemperatureSensors,
          enabledHumiditySensors: this._enabledHumiditySensors,
          enabledClimates: this._enabledClimates,
          enabledRoofWindows: this._enabledRoofWindows,
          enabledMediaPlayers: this._enabledMediaPlayers,
          enabledTVs: this._enabledTVs,
          enabledLocks: this._enabledLocks,
        });
      }
      this.requestUpdate();
    }

    _toggleRoomEnabled(areaId) { this._toggleEntityEnabled('_enabledRooms', areaId); }
    _toggleLightEnabled(entityId) { this._toggleEntityEnabled('_enabledLights', entityId); }
    _toggleMotionSensorEnabled(entityId) { this._toggleEntityEnabled('_enabledMotionSensors', entityId); }
    _toggleSmokeSensorEnabled(entityId) { this._toggleEntityEnabled('_enabledSmokeSensors', entityId); }
    _toggleCoverEnabled(entityId) { this._toggleEntityEnabled('_enabledCovers', entityId); }
    _toggleCoverInvertPosition(entityId) {
      this._coverInvertPosition = { ...this._coverInvertPosition, [entityId]: !this._coverInvertPosition[entityId] };
      this._saveSettings();
    }
    _isCoverInverted(entityId) { return !!this._coverInvertPosition[entityId]; }
    _toggleGarageEnabled(entityId) { this._toggleEntityEnabled('_enabledGarages', entityId); }
    _toggleWindowEnabled(entityId) { this._toggleEntityEnabled('_enabledWindows', entityId); }
    _toggleVibrationSensorEnabled(entityId) { this._toggleEntityEnabled('_enabledVibrationSensors', entityId); }
    _toggleTemperatureSensorEnabled(entityId) { this._toggleEntityEnabled('_enabledTemperatureSensors', entityId); }
    _toggleHumiditySensorEnabled(entityId) { this._toggleEntityEnabled('_enabledHumiditySensors', entityId); }
    _toggleClimateEnabled(entityId) { this._toggleEntityEnabled('_enabledClimates', entityId); }
    _toggleRoofWindowEnabled(entityId) { this._toggleEntityEnabled('_enabledRoofWindows', entityId); }
    _toggleMediaPlayerEnabled(entityId) { this._toggleEntityEnabled('_enabledMediaPlayers', entityId); }
    _toggleTVEnabled(entityId) { this._toggleEntityEnabled('_enabledTVs', entityId); }
    _toggleLockEnabled(entityId) { this._toggleEntityEnabled('_enabledLocks', entityId); }

    /**
     * Bulk toggle entities of a specific type in an area
     * @param {string} areaId - The area ID
     * @param {string} settingsKey - The settings map key (e.g., '_enabledLights')
     * @param {Array} entities - Array of entity objects for that type
     * @param {boolean} enabled - Whether to enable or disable all entities
     */
    _bulkToggleEntities(areaId, settingsKey, entities, enabled) {
      if (!entities || entities.length === 0) return;

      // Count entities that will actually change
      const entitiesToChange = entities.filter(entity => {
        const currentEnabled = this[settingsKey][entity.entity_id] !== false;
        return currentEnabled !== enabled;
      });

      // Show confirmation for disabling multiple entities
      if (!enabled && entitiesToChange.length > 0) {
        this._showBulkDisableConfirmation(areaId, settingsKey, entities, entitiesToChange.length);
        return;
      }

      // Proceed with enabling without confirmation
      this._performBulkToggle(settingsKey, entities, enabled);
    }

    /**
     * Show confirmation dialog for bulk disabling entities
     */
    _showBulkDisableConfirmation(areaId, settingsKey, entities, count) {
      // Get area name for context
      const area = this._areas?.find(a => a.area_id === areaId);
      const areaName = area?.name || 'this room';

      // Dynamically import i18n
      import('./utils/i18n.js').then(({ t }) => {
        // Dynamically import the confirmation dialog
        import('./components/controls/confirmation-dialog.js').then(() => {
          const dialog = document.createElement('confirmation-dialog');
          dialog.title = t('admin.confirmation.disableAll');
          dialog.message = t('admin.confirmation.disableAllMessage', { count });
          dialog.confirmText = t('common.actions.confirm');
          dialog.cancelText = t('common.actions.cancel');
          dialog.destructive = true;

          dialog.addEventListener('confirm', () => {
            this._performBulkToggle(settingsKey, entities, false);
            dialog.remove();
          });

          dialog.addEventListener('cancel', () => {
            dialog.remove();
          });

          dialog.open = true;
          this.renderRoot.appendChild(dialog);
        });
      });
    }

    /**
     * Perform the actual bulk toggle without confirmation
     */
    _performBulkToggle(settingsKey, entities, enabled) {
      // Only toggle entities that need state change to avoid duplicate calls
      const newMap = { ...this[settingsKey] };
      entities.forEach(entity => {
        const currentEnabled = newMap[entity.entity_id] !== false;
        if (currentEnabled !== enabled) {
          newMap[entity.entity_id] = enabled;
        }
      });

      this[settingsKey] = newMap;
      this._saveSettings();

      // Update roomDataService with the new enabled maps
      if (roomDataService) {
        roomDataService.setEnabledMaps({
          enabledLights: this._enabledLights,
          enabledMotionSensors: this._enabledMotionSensors,
          enabledSmokeSensors: this._enabledSmokeSensors,
          enabledCovers: this._enabledCovers,
          coverInvertPosition: this._coverInvertPosition,
          enabledGarages: this._enabledGarages,
          enabledWindows: this._enabledWindows,
          enabledVibrationSensors: this._enabledVibrationSensors,
          enabledTemperatureSensors: this._enabledTemperatureSensors,
          enabledHumiditySensors: this._enabledHumiditySensors,
          enabledClimates: this._enabledClimates,
          enabledRoofWindows: this._enabledRoofWindows,
          enabledMediaPlayers: this._enabledMediaPlayers,
          enabledTVs: this._enabledTVs,
          enabledLocks: this._enabledLocks,
        });
      }

      this.requestUpdate();
    }

    // Generic toggle helper for boolean properties
    _toggleBoolProp(key) { coreUtils ? coreUtils.toggleBoolProp(this, key) : (this[key] = !this[key], this.requestUpdate()); }

    _togglePopupRoofWindowExpanded() { this._toggleBoolProp('_popupRoofWindowExpanded'); }

    _toggleAreaExpanded(areaId) {
      coreUtils ? coreUtils.toggleAreaExpanded(this, areaId) : (this._expandedAreas = { ...this._expandedAreas, [areaId]: !this._expandedAreas[areaId] }, this.requestUpdate());
    }

    _toggleEntityTypeSection(areaId, typeKey) {
      coreUtils ? coreUtils.toggleEntityTypeSection(this, areaId, typeKey) : this.requestUpdate();
    }

    _openRoomPopup(areaId) {
      const area = this._areas.find(a => a.area_id === areaId);
      if (area) {
        this._popupRoom = area;
        this.requestUpdate();
        // Fetch temperature history for climate entities in this room
        this._loadThermostatHistory(areaId);
      }
    }

    async _loadThermostatHistory(areaId) {
      const climates = this._getEnabledClimatesForRoom(areaId);
      if (climates.length === 0) return;

      // Get temperature sensors for this room to use for chart history
      const tempSensors = this._getEnabledTemperatureSensorsForRoom(areaId);
      if (tempSensors.length === 0) return;

      // Use the first temperature sensor for all climate entities in this room
      const tempSensorId = tempSensors[0].entity_id;
      const history = await this._fetchTemperatureHistory(tempSensorId, 24);

      if (history.length > 0) {
        // Store history for each climate entity (they share the same room sensor)
        for (const climate of climates) {
          this._thermostatHistory = {
            ...this._thermostatHistory,
            [climate.entity_id]: history
          };
        }
        this.requestUpdate();
      }
    }

    _formatTimeAgo(lastChanged) {
      return coreUtils ? coreUtils.formatTimeAgo(lastChanged) : '';
    }

    _getRoomPopupChips(areaId) {
      if (!this.hass) return [];
      const chips = [];

      // Get motion sensors for this room (iterate over registry for default-enabled)
      this._entityRegistry.forEach((entityReg) => {
        const entityId = entityReg.entity_id;
        if (this._enabledMotionSensors[entityId] === false) return;
        const entityAreaId = this._getAreaIdForEntity(entityId);
        if (entityAreaId !== areaId) return;
        // Filter by current motion label
        if (!this._motionLabelId || !entityReg.labels || !entityReg.labels.includes(this._motionLabelId)) return;

        const state = this.hass.states[entityId];
        if (!state) return;

        const isActive = state.state === 'on';
        const friendlyName = state.attributes?.friendly_name || entityId;
        const timeAgo = this._formatTimeAgo(state.last_changed);

        chips.push({
          type: 'motion',
          entityId,
          name: friendlyName,
          stateText: friendlyName,
          timeAgo,
          icon: isActive ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off',
          isActive,
          state: state.state,
        });
      });

      // Get vibration sensors for this room (only show when active, iterate over registry)
      this._entityRegistry.forEach((entityReg) => {
        const entityId = entityReg.entity_id;
        if (this._enabledVibrationSensors[entityId] === false) return;
        const entityAreaId = this._getAreaIdForEntity(entityId);
        if (entityAreaId !== areaId) return;
        // Filter by current vibration label
        if (!this._vibrationLabelId || !entityReg.labels || !entityReg.labels.includes(this._vibrationLabelId)) return;

        const state = this.hass.states[entityId];
        if (!state) return;

        // Only show vibration when detected
        if (state.state !== 'on') return;

        const friendlyName = state.attributes?.friendly_name || entityId;
        const timeAgo = this._formatTimeAgo(state.last_changed);

        chips.push({
          type: 'vibration',
          entityId,
          name: friendlyName,
          stateText: friendlyName,
          timeAgo,
          icon: 'mdi:vibrate',
          isActive: true,
          state: state.state,
        });
      });

      // Get smoke sensors for this room (only show when active, iterate over registry)
      this._entityRegistry.forEach((entityReg) => {
        const entityId = entityReg.entity_id;
        if (this._enabledSmokeSensors[entityId] === false) return;
        const entityAreaId = this._getAreaIdForEntity(entityId);
        if (entityAreaId !== areaId) return;
        // Filter by current smoke label
        if (!this._smokeLabelId || !entityReg.labels || !entityReg.labels.includes(this._smokeLabelId)) return;

        const state = this.hass.states[entityId];
        if (!state) return;

        // Only show smoke when detected
        if (state.state !== 'on') return;

        const friendlyName = state.attributes?.friendly_name || entityId;
        const timeAgo = this._formatTimeAgo(state.last_changed);

        chips.push({
          type: 'smoke',
          entityId,
          name: friendlyName,
          stateText: friendlyName,
          timeAgo,
          icon: 'mdi:smoke-detector-variant-alert',
          isActive: true,
          state: state.state,
        });
      });

      // Get windows for this room (only show when open, iterate over registry)
      this._entityRegistry.forEach((entityReg) => {
        const entityId = entityReg.entity_id;
        if (this._enabledWindows[entityId] === false) return;
        const entityAreaId = this._getAreaIdForEntity(entityId);
        if (entityAreaId !== areaId) return;
        // Filter by current window label
        if (!this._windowLabelId || !entityReg.labels || !entityReg.labels.includes(this._windowLabelId)) return;

        const state = this.hass.states[entityId];
        if (!state) return;

        // Only show window when open
        if (state.state !== 'on') return;

        const friendlyName = state.attributes?.friendly_name || entityId;
        const timeAgo = this._formatTimeAgo(state.last_changed);

        chips.push({
          type: 'window',
          entityId,
          name: friendlyName,
          stateText: friendlyName,
          timeAgo,
          icon: 'mdi:window-open',
          isActive: true,
          state: state.state,
        });
      });

      return chips;
    }

    _closeRoomPopup() {
      this._popupRoom = null;
      this._popupCoverExpanded = false;
      this._popupGarageExpanded = false;
      this.requestUpdate();
    }

    _togglePopupCoverExpanded() { this._toggleBoolProp('_popupCoverExpanded'); }
    _togglePopupGarageExpanded() { this._toggleBoolProp('_popupGarageExpanded'); }
    _togglePopupThermostatExpanded() { this._toggleBoolProp('_popupThermostatExpanded'); }

    // Generic helper to get enabled entities for a room with custom attribute mapping
    // Iterates over registry entities (not enabledMap) to support default-enabled behavior
    _getEnabledEntitiesForRoom(areaId, enabledMap, attrMapper, labelId = null) {
      if (!this.hass || !labelId) return [];
      const entities = [];
      // Iterate over registry entities that have the label and are in the area
      this._entityRegistry.forEach(entityReg => {
        const entityId = entityReg.entity_id;
        // Check if entity has the required label
        if (!entityReg.labels || !entityReg.labels.includes(labelId)) return;
        // Check if entity is in this area
        if (this._getAreaIdForEntity(entityId) !== areaId) return;
        // Check if entity is NOT explicitly disabled (default is enabled)
        if (enabledMap[entityId] === false) return;
        // Get state
        const state = this.hass.states[entityId];
        if (!state) return;
        entities.push({ entity_id: entityId, name: state.attributes?.friendly_name || entityReg.original_name || entityId, ...attrMapper(state, entityId) });
      });
      return dashviewUtils.sortByName(entities);
    }

    _getEnabledCoversForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledCovers, (s, entityId) => ({
        position: s.attributes?.current_position ?? 0,
        state: s.state,
        invertPosition: !!this._coverInvertPosition[entityId]
      }), this._coverLabelId);
    }

    _getEnabledGaragesForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledGarages, s => ({ state: s.state, last_changed: s.last_changed }), this._garageLabelId);
    }

    _getEnabledRoofWindowsForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledRoofWindows, s => ({ position: s.attributes?.current_position ?? 0, state: s.state }), this._roofWindowLabelId);
    }

    _setRoofWindowPosition(entityId, position) {
      if (!this.hass) return;
      this.hass.callService('cover', 'set_cover_position', {
        entity_id: entityId,
        position: position,
      });
    }

    _setAllRoofWindowsPosition(areaId, position) {
      const roofWindows = this._getEnabledRoofWindowsForRoom(areaId);
      roofWindows.forEach(rw => {
        this._setRoofWindowPosition(rw.entity_id, position);
      });
    }

    // Slider position helper (inverted: left=100%, right=0%)
    _getInvertedSliderPosition(e) {
      return coreUtils ? coreUtils.getInvertedSliderPosition(e) : 0;
    }

    _handleRoofWindowSliderClick(e, entityId) { this._setRoofWindowPosition(entityId, this._getInvertedSliderPosition(e)); }
    _handleAllRoofWindowsSliderClick(e, areaId) { this._setAllRoofWindowsPosition(areaId, this._getInvertedSliderPosition(e)); }

    // Cover service helpers
    _coverService(entityId, service, data = {}) { if (this.hass) this.hass.callService('cover', service, { entity_id: entityId, ...data }); }
    _openGarage(entityId) { this._coverService(entityId, 'open_cover'); }
    _closeGarage(entityId) { this._coverService(entityId, 'close_cover'); }
    _setCoverPosition(entityId, position) { this._coverService(entityId, 'set_cover_position', { position }); }
    _setCoverPositionWithInversion(entityId, position) {
      const actualPosition = this._isCoverInverted(entityId) ? (100 - position) : position;
      this._setCoverPosition(entityId, actualPosition);
    }
    _setAllCoversPosition(areaId, position) {
      this._getEnabledCoversForRoom(areaId).forEach(c => this._setCoverPositionWithInversion(c.entity_id, position));
    }

    _formatGarageLastChanged(lastChanged) {
      return coreUtils ? coreUtils.formatGarageLastChanged(lastChanged) : '';
    }

    _toggleAllRoomLights(areaId, turnOn) {
      const lights = this._getEnabledLightsForRoom(areaId);
      lights.forEach(l => {
        if (turnOn) {
          dashviewUtils.turnOnLight(this.hass, l.entity_id);
        } else {
          dashviewUtils.turnOffLight(this.hass, l.entity_id);
        }
      });
    }
    _toggleAllRoomCovers(areaId, close) { this._setAllCoversPosition(areaId, close ? 100 : 0); }
    _handleCoverSliderClick(e, entityId) { this._setCoverPosition(entityId, this._getInvertedSliderPosition(e)); }
    _handleAllCoversSliderClick(e, areaId) { this._setAllCoversPosition(areaId, this._getInvertedSliderPosition(e));
    }

    _togglePopupLightExpanded() { this._toggleBoolProp('_popupLightExpanded'); }
    _togglePopupDevicesExpanded() { this._toggleBoolProp('_popupDevicesExpanded'); }

    _getEnabledClimatesForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledClimates, s => ({
        state: s.state, hvacAction: s.attributes?.hvac_action,
        currentTemp: s.attributes?.current_temperature, targetTemp: s.attributes?.temperature,
      }), this._climateLabelId);
    }

    _setThermostatHvacMode(entityId, hvacMode) {
      if (!this.hass) return;
      this.hass.callService('climate', 'set_hvac_mode', {
        entity_id: entityId,
        hvac_mode: hvacMode,
      });
    }

    _adjustThermostatTemp(entityId, delta) {
      if (!this.hass) return;
      const state = this.hass.states[entityId];
      if (!state) return;

      const currentTarget = state.attributes?.temperature;
      if (currentTarget === undefined) return;

      const newTemp = currentTarget + delta;
      this.hass.callService('climate', 'set_temperature', {
        entity_id: entityId,
        temperature: newTemp,
      });
    }

    // Temperature history cache to avoid repeated API calls
    _temperatureHistoryCache = {};
    _temperatureHistoryCacheTime = {};

    async _fetchTemperatureHistory(entityId, hours = 24) {
      if (!this.hass || !entityId) return [];

      // Check cache (valid for 5 minutes)
      const cacheKey = `${entityId}_${hours}`;
      const now = Date.now();
      if (this._temperatureHistoryCache[cacheKey] &&
          this._temperatureHistoryCacheTime[cacheKey] &&
          (now - this._temperatureHistoryCacheTime[cacheKey]) < 300000) {
        return this._temperatureHistoryCache[cacheKey];
      }

      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

        const response = await this.hass.callWS({
          type: 'history/history_during_period',
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          entity_ids: [entityId],
          minimal_response: true,
          no_attributes: true,
        });

        if (!response || !response[entityId]) return [];

        // Process history data into simple array of {time, value}
        const history = response[entityId]
          .filter(item => item.s !== 'unavailable' && item.s !== 'unknown' && !isNaN(parseFloat(item.s)))
          .map(item => ({
            time: new Date(item.lu * 1000).getTime(),
            value: parseFloat(item.s)
          }));

        // Cache the result
        this._temperatureHistoryCache[cacheKey] = history;
        this._temperatureHistoryCacheTime[cacheKey] = now;

        return history;
      } catch (e) {
        console.error('Dashview: Error fetching temperature history:', e);
        return [];
      }
    }

    _getEnabledTemperatureSensorsForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledTemperatureSensors, s => ({
        state: s.state, unit: s.attributes?.unit_of_measurement || '°C',
      }), this._temperatureLabelId);
    }

    _getEnabledHumiditySensorsForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledHumiditySensors, s => ({
        state: s.state, unit: s.attributes?.unit_of_measurement || '%',
      }), this._humidityLabelId);
    }

    _getEnabledLightsForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledLights, s => {
        const brightness = s.attributes?.brightness;
        const rgbColor = s.attributes?.rgb_color;
        return {
          state: s.state, brightness, brightnessPercent: brightness ? Math.round((brightness / 255) * 100) : 0,
          isDimmable: brightness !== undefined || (s.attributes?.supported_features & 1),
          icon: s.attributes?.icon || 'mdi:lightbulb',
          rgbColor: rgbColor || null,
        };
      }, this._lightLabelId);
    }

    _getEnabledTVsForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledTVs, s => ({
        state: s.state,
        source: s.attributes?.source,
        volume: s.attributes?.volume_level,
        icon: s.attributes?.icon || 'mdi:television',
      }), this._tvLabelId);
    }

    _getEnabledLocksForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledLocks, s => ({
        state: s.state,
        isLocked: s.state === 'locked',
        last_changed: s.last_changed,
        icon: s.attributes?.icon || (s.state === 'locked' ? 'mdi:lock' : 'mdi:lock-open'),
      }), this._lockLabelId);
    }

    _getRoomClimateNotification(areaId) {
      if (!this.hass) return null;

      // Get enabled sensors and filter for valid numeric values
      const tempSensors = this._getEnabledTemperatureSensorsForRoom(areaId)
        .filter(s => s.state !== 'unavailable' && s.state !== 'unknown')
        .map(s => ({ ...s, value: parseFloat(s.state) }))
        .filter(s => !isNaN(s.value));

      const humiditySensors = this._getEnabledHumiditySensorsForRoom(areaId)
        .filter(s => s.state !== 'unavailable' && s.state !== 'unknown')
        .map(s => ({ ...s, value: parseFloat(s.state) }))
        .filter(s => !isNaN(s.value));

      // Check thresholds
      const highTemps = tempSensors.filter(s => s.value > this._notificationTempThreshold);
      const highHumidity = humiditySensors.filter(s => s.value > this._notificationHumidityThreshold);

      if (highTemps.length === 0 && highHumidity.length === 0) return null;

      // Build notification
      const messages = [];
      if (highTemps.length > 0) {
        const avg = (highTemps.reduce((sum, s) => sum + s.value, 0) / highTemps.length).toFixed(1);
        messages.push(`Temperatur: ${avg}°C`);
      }
      if (highHumidity.length > 0) {
        const avg = (highHumidity.reduce((sum, s) => sum + s.value, 0) / highHumidity.length).toFixed(1);
        messages.push(`Luftfeuchtigkeit: ${avg}%`);
      }

      return { title: t('ui.notifications.ventilate_room', 'Bitte Raum lüften'), subtitle: messages.join(' · ') };
    }

    _setLightBrightness(entityId, brightnessPercent) {
      if (!this.hass) return;
      this.hass.callService('light', 'turn_on', {
        entity_id: entityId,
        brightness_pct: brightnessPercent,
      });
    }

    _handleLightSliderClick(e, entityId) {
      // Only handle click if not dragging
      if (this._lightSliderDragging) return;

      const slider = e.currentTarget;
      const rect = slider.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = Math.round((clickX / rect.width) * 100);
      this._setLightBrightness(entityId, Math.max(1, Math.min(100, percentage)));
    }

    // Touch event handlers for light slider
    _handleLightSliderTouchStart(e, entityId) {
      this._lightSliderDragging = true;
      this._lightSliderEntityId = entityId;
      this._lightSliderStartX = e.touches[0].clientX;

      const item = e.currentTarget.closest('.popup-light-item');
      if (item) {
        item.classList.add('dragging');
        this._lightSliderItem = item;
      }
    }

    _handleLightSliderTouchMove(e, entityId) {
      if (!this._lightSliderDragging || this._lightSliderEntityId !== entityId) return;

      const slider = e.currentTarget;
      const rect = slider.getBoundingClientRect();
      const touchX = e.touches[0].clientX - rect.left;
      const percentage = Math.round((touchX / rect.width) * 100);
      const clampedPercentage = Math.max(1, Math.min(100, percentage));

      // Update visual immediately
      const sliderBg = this._lightSliderItem?.querySelector('.popup-light-slider-bg');
      if (sliderBg) {
        sliderBg.style.width = `${clampedPercentage}%`;
      }

      // Update brightness display
      const brightnessEl = this._lightSliderItem?.querySelector('.popup-light-brightness');
      if (brightnessEl) {
        brightnessEl.textContent = `${clampedPercentage}%`;
      }

      // Store value for touchend
      this._lightSliderValue = clampedPercentage;

      // Prevent scrolling while dragging
      e.preventDefault();
    }

    _handleLightSliderTouchEnd(e) {
      if (!this._lightSliderDragging) return;

      // Apply the final value
      if (this._lightSliderValue !== undefined && this._lightSliderEntityId) {
        this._setLightBrightness(this._lightSliderEntityId, this._lightSliderValue);
      }

      // Remove dragging class
      if (this._lightSliderItem) {
        this._lightSliderItem.classList.remove('dragging');
      }

      // Reset state
      this._lightSliderDragging = false;
      this._lightSliderEntityId = null;
      this._lightSliderStartX = null;
      this._lightSliderValue = undefined;
      this._lightSliderItem = null;
    }

    // Mouse event handlers for light slider (desktop support)
    _handleLightSliderMouseDown(e, entityId) {
      this._lightSliderDragging = true;
      this._lightSliderEntityId = entityId;

      const item = e.currentTarget.closest('.popup-light-item');
      if (item) {
        item.classList.add('dragging');
        this._lightSliderItem = item;
      }

      // Add global mouse event listeners
      const handleMouseMove = (moveEvent) => {
        if (!this._lightSliderDragging) return;

        const slider = item.querySelector('.popup-light-slider-area');
        if (!slider) return;

        const rect = slider.getBoundingClientRect();
        const mouseX = moveEvent.clientX - rect.left;
        const percentage = Math.round((mouseX / rect.width) * 100);
        const clampedPercentage = Math.max(1, Math.min(100, percentage));

        // Update visual immediately
        const sliderBg = item.querySelector('.popup-light-slider-bg');
        if (sliderBg) {
          sliderBg.style.width = `${clampedPercentage}%`;
        }

        // Update brightness display
        const brightnessEl = item.querySelector('.popup-light-brightness');
        if (brightnessEl) {
          brightnessEl.textContent = `${clampedPercentage}%`;
        }

        this._lightSliderValue = clampedPercentage;
      };

      const handleMouseUp = () => {
        // Apply the final value
        if (this._lightSliderValue !== undefined && this._lightSliderEntityId) {
          this._setLightBrightness(this._lightSliderEntityId, this._lightSliderValue);
        }

        // Remove dragging class
        if (this._lightSliderItem) {
          this._lightSliderItem.classList.remove('dragging');
        }

        // Reset state
        this._lightSliderDragging = false;
        this._lightSliderEntityId = null;
        this._lightSliderValue = undefined;
        this._lightSliderItem = null;

        // Remove listeners
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      e.preventDefault();
    }

    _handlePopupOverlayClick(e) {
      // Close popup when clicking on the overlay (not the container)
      if (e.target.classList.contains('popup-overlay')) {
        this._closeRoomPopup();
      }
    }

    _getWeather() {
      return weatherService ? weatherService.getWeather(this.hass, this._weatherEntity) : null;
    }

    _translateWeatherCondition(state) {
      return weatherService ? weatherService.translateWeatherCondition(state) : state;
    }

    // Generic popup helpers
    _openPopup(popupKey, callback) { this[popupKey] = true; callback?.(); this.requestUpdate(); }
    _closePopup(popupKey) { this[popupKey] = false; this.requestUpdate(); }
    _handlePopupOverlay(e, closeMethod) { if (e.target.classList.contains('popup-overlay')) closeMethod(); }

    _openWeatherPopup() { this._openPopup('_weatherPopupOpen', () => this._fetchWeatherForecasts()); }
    _closeWeatherPopup() { this._closePopup('_weatherPopupOpen'); }
    _handleWeatherPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeWeatherPopup()); }

    _handleInfoTextClick(action) {
      if (action === 'security') this._openPopup('_securityPopupOpen');
      else if (action === 'lights') this._openPopup('_lightsPopupOpen');
      else if (action === 'battery') this._openPopup('_batteryPopupOpen');
      else if (action === 'motion') {
        this._activeSecurityTab = 'motion';
        this._openPopup('_securityPopupOpen');
      }
    }

    _closeLightsPopup() { this._closePopup('_lightsPopupOpen'); }
    _handleLightsPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeLightsPopup()); }

    _closeBatteryPopup() { this._closePopup('_batteryPopupOpen'); }
    _handleBatteryPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeBatteryPopup()); }

    // Changelog popup methods
    _checkForNewVersion() {
      if (!changelogUtils) return;

      // Compare installed version (CURRENT_VERSION) with last seen version
      if (changelogUtils.hasNewChanges(this._lastSeenVersion)) {
        this._changelogPageIndex = 0;
        this._changelogPopupOpen = true;
        this.requestUpdate();
      }
    }

    _closeChangelogPopup() {
      this._changelogPopupOpen = false;
      // Save current version as last seen
      if (changelogUtils && settingsStore) {
        this._lastSeenVersion = changelogUtils.CURRENT_VERSION;
        settingsStore.set('lastSeenVersion', changelogUtils.CURRENT_VERSION);
      }
      this.requestUpdate();
    }

    _nextChangelogPage() {
      const newChanges = changelogUtils ? changelogUtils.getNewChanges(this._lastSeenVersion) : [];
      if (this._changelogPageIndex < newChanges.length - 1) {
        this._changelogPageIndex++;
        this.requestUpdate();
      }
    }

    _handleChangelogOverlayClick(e) {
      if (e.target.classList.contains('popup-overlay')) {
        this._closeChangelogPopup();
      }
    }

    _getLowBatteryDevices() {
      if (!this.hass) return [];

      const threshold = this._infoTextConfig.batteryLow?.threshold || 20;
      const lowBatteryDevices = [];

      Object.entries(this.hass.states).forEach(([entityId, state]) => {
        const isBatterySensor =
          entityId.includes('battery') ||
          state.attributes?.device_class === 'battery';

        if (!isBatterySensor) return;

        const value = parseFloat(state.state);
        if (isNaN(value)) return;

        if (value < threshold && value >= 0) {
          lowBatteryDevices.push({
            entityId,
            name: state.attributes?.friendly_name || entityId,
            value: Math.round(value),
          });
        }
      });

      return lowBatteryDevices.sort((a, b) => a.value - b.value);
    }

    _getHourlyForecast() {
      return weatherService ? weatherService.getHourlyForecast(this.hass, this._weatherHourlyForecasts, this._weatherEntity) : [];
    }

    _getCurrentWeatherData() {
      return weatherService ? weatherService.getCurrentWeatherData(this.hass, this._weatherCurrentTempEntity, this._weatherCurrentStateEntity, this._weatherEntity) : null;
    }

    _getForecastData(type) {
      return weatherService ? weatherService.getForecastData(this.hass, type, this._weatherForecasts, this._weatherEntity) : null;
    }

    _getPrecipitation() {
      return weatherService ? weatherService.getPrecipitation(this.hass, this._weatherPrecipitationEntity) : 0;
    }

    _getDwdWarnings() {
      return weatherService ? weatherService.getDwdWarnings(this.hass, this._dwdWarningEntity) : [];
    }

    _getWeatherIcon(state) {
      return weatherService ? weatherService.getWeatherIcon(state) : "mdi:weather-partly-cloudy";
    }

    _getPerson() {
      if (!this.hass) return null;

      // Try to find the person entity associated with the current HA user
      const currentUserId = this.hass.user?.id;
      let person = null;

      if (currentUserId) {
        // Look for person entity linked to current user via user_id attribute
        person = Object.values(this.hass.states).find(
          (e) => e.entity_id.startsWith("person.") && e.attributes.user_id === currentUserId
        );
      }

      // Fallback to first person entity if no user-linked person found
      if (!person) {
        person = Object.values(this.hass.states).find((e) =>
          e.entity_id.startsWith("person.")
        );
      }

      if (person) {
        // Check for custom photo in userPhotos settings
        const customPhoto = this._userPhotos?.[person.entity_id];
        return {
          name: person.attributes.friendly_name || person.entity_id,
          state: person.state,
          picture: customPhoto || person.attributes.entity_picture,
        };
      }
      return null;
    }

    _getFloorForArea(area) {
      // Use the floor_id from the area registry
      return area?.floor_id || null;
    }

    // Helper to find rooms with active entities of a given type
    // Iterates over entity registry to support default-enabled behavior
    _getRoomsWithActiveEntities(enabledMap, labelId = null) {
      const rooms = new Set();
      // Iterate over registry instead of enabledMap for default-enabled behavior
      this._entityRegistry.forEach((entityReg) => {
        const entityId = entityReg.entity_id;
        // Skip explicitly disabled entities
        if (enabledMap[entityId] === false) return;
        // Filter by label if provided
        if (labelId && (!entityReg.labels || !entityReg.labels.includes(labelId))) return;
        const state = this.hass?.states[entityId];
        if (!state || state.state !== "on") return;
        const areaId = this._getAreaIdForEntity(entityId);
        if (areaId && this._enabledRooms[areaId] !== false) rooms.add(areaId);
      });
      return rooms;
    }

    // Helper to create room indicator object
    _createRoomIndicator(roomData) {
      let type = 'room';
      if (roomData.hasSmoke) type = 'room-smoke';
      else if (roomData.hasMotion && !roomData.hasLight) type = 'room-motion';
      return {
        type, areaId: roomData.area.area_id, icon: this._getAreaIcon(roomData.area),
        label: roomData.area.name, hasLight: roomData.hasLight, hasMotion: roomData.hasMotion, hasSmoke: roomData.hasSmoke,
      };
    }

    _getActiveRoomIndicators() {
      if (!this.hass) return [];

      // Find rooms with active states (filtered by current labels)
      const roomsWithLightsOn = this._getRoomsWithActiveEntities(this._enabledLights, this._lightLabelId);
      const roomsWithMotion = this._getRoomsWithActiveEntities(this._enabledMotionSensors, this._motionLabelId);
      const roomsWithSmoke = this._getRoomsWithActiveEntities(this._enabledSmokeSensors, this._smokeLabelId);
      const allActiveRooms = new Set([...roomsWithLightsOn, ...roomsWithMotion, ...roomsWithSmoke]);

      // Group by floor
      const roomsByFloor = new Map();
      const roomsWithoutFloor = [];
      allActiveRooms.forEach(areaId => {
        const area = this._areas.find(a => a.area_id === areaId);
        if (!area) return;
        const roomData = { area, hasLight: roomsWithLightsOn.has(areaId), hasMotion: roomsWithMotion.has(areaId), hasSmoke: roomsWithSmoke.has(areaId) };
        if (area.floor_id) {
          if (!roomsByFloor.has(area.floor_id)) roomsByFloor.set(area.floor_id, []);
          roomsByFloor.get(area.floor_id).push(roomData);
        } else {
          roomsWithoutFloor.push(roomData);
        }
      });

      // Build indicators in floor order
      const indicators = [];
      this._getOrderedFloors().filter(f => roomsByFloor.has(f.floor_id)).forEach(floor => {
        indicators.push({ type: 'floor', icon: floor.icon || 'mdi:home-floor-0', label: floor.name });
        this._sortRoomsByOrder(roomsByFloor.get(floor.floor_id), floor.floor_id).forEach(rd => indicators.push(this._createRoomIndicator(rd)));
      });

      // Add unassigned rooms
      this._sortRoomsByOrder(roomsWithoutFloor, null).forEach(rd => indicators.push(this._createRoomIndicator(rd)));
      return indicators;
    }

    _getEnabledActiveLights() {
      if (!this.hass) return [];

      // Iterate over registry for default-enabled behavior
      return this._entityRegistry
        .filter((entityReg) => {
          const entityId = entityReg.entity_id;
          // Skip explicitly disabled
          if (this._enabledLights[entityId] === false) return false;
          // Filter by current light label
          if (this._lightLabelId && (!entityReg.labels || !entityReg.labels.includes(this._lightLabelId))) return false;
          const state = this.hass.states[entityId];
          return state && state.state === "on";
        })
        .map((entityReg) => {
          const entityId = entityReg.entity_id;
          const state = this.hass.states[entityId];
          const areaId = this._getAreaIdForEntity(entityId);
          const area = this._areas.find(a => a.area_id === areaId);

          return {
            entity_id: entityId,
            name: state?.attributes?.friendly_name || entityId,
            state: state?.state || "unknown",
            area: area?.name || "Unknown",
          };
        });
    }

    // ============================================
    // Entity Getter Methods - Delegated to RoomDataService
    // ============================================

    _getAreaLights(areaId) {
      return roomDataService ? roomDataService.getAreaLights(areaId) : [];
    }

    _getAreaMotionSensors(areaId) {
      return roomDataService ? roomDataService.getAreaMotionSensors(areaId) : [];
    }

    _getAreaSmokeSensors(areaId) {
      return roomDataService ? roomDataService.getAreaSmokeSensors(areaId) : [];
    }

    _getAreaCovers(areaId) {
      return roomDataService ? roomDataService.getAreaCovers(areaId) : [];
    }

    _getAreaGarages(areaId) {
      return roomDataService ? roomDataService.getAreaGarages(areaId) : [];
    }

    _getAreaWindows(areaId) {
      return roomDataService ? roomDataService.getAreaWindows(areaId) : [];
    }

    _getAreaVibrationSensors(areaId) {
      return roomDataService ? roomDataService.getAreaVibrationSensors(areaId) : [];
    }

    _getAreaTemperatureSensors(areaId) {
      return roomDataService ? roomDataService.getAreaTemperatureSensors(areaId) : [];
    }

    _getAreaHumiditySensors(areaId) {
      return roomDataService ? roomDataService.getAreaHumiditySensors(areaId) : [];
    }

    _getAreaClimates(areaId) {
      return roomDataService ? roomDataService.getAreaClimates(areaId) : [];
    }

    _getAreaRoofWindows(areaId) {
      return roomDataService ? roomDataService.getAreaRoofWindows(areaId) : [];
    }

    _getAreaMediaPlayers(areaId) {
      return roomDataService ? roomDataService.getAreaMediaPlayers(areaId) : [];
    }

    _getAreaTVs(areaId) {
      return roomDataService ? roomDataService.getAreaTVs(areaId) : [];
    }

    // ============================================
    // Helper Methods for Status Service
    // ============================================

    /**
     * Build an enabled map from the registry for default-enabled behavior
     * Returns a map where all entities with the label are set to true unless explicitly disabled
     * @param {string} labelId - Label ID to filter by
     * @param {Object} existingMap - Existing enabled map (may have explicit false values)
     * @returns {Object} Map of entityId -> boolean
     */
    _buildEnabledMapFromRegistry(labelId, existingMap) {
      if (!labelId) {
        return existingMap || {};
      }
      const map = {};
      this._entityRegistry.forEach(e => {
        if (e.labels && e.labels.includes(labelId)) {
          // Use existing value if set, otherwise default to true
          map[e.entity_id] = existingMap[e.entity_id] !== false;
        }
      });
      return map;
    }

    // ============================================
    // Custom Label Methods
    // ============================================

    /**
     * Get all labels that are NOT predefined (not lights, motion, cover, etc.)
     * These are user-defined labels like "appliances", "printer", etc.
     */
    _getCustomLabels() {
      if (!this._labels || this._labels.length === 0) return [];

      // List of predefined label IDs to exclude
      const predefinedLabelIds = [
        this._lightLabelId,
        this._motionLabelId,
        this._smokeLabelId,
        this._coverLabelId,
        this._garageLabelId,
        this._windowLabelId,
        this._vibrationLabelId,
        this._temperatureLabelId,
        this._humidityLabelId,
        this._climateLabelId,
        this._mediaPlayerLabelId,
        this._roofWindowLabelId,
      ].filter(Boolean);

      return dashviewUtils.sortByName(
        this._labels
          .filter(label => !predefinedLabelIds.includes(label.label_id))
          .map(label => ({
            label_id: label.label_id,
            name: label.name,
            icon: label.icon || 'mdi:tag',
            color: label.color,
            description: label.description,
            enabled: this._customLabels[label.label_id]?.enabled || false,
          }))
      );
    }

    /**
     * Get entities for a specific custom label in a given area
     */
    _getAreaCustomLabelEntities(areaId, labelId) {
      if (!this.hass || !labelId) return [];

      // Get all entities with this label that are in this area
      const matches = this._entityRegistry.filter((entityReg) => {
        const hasLabel = entityReg.labels && entityReg.labels.includes(labelId);
        if (!hasLabel) return false;

        const entityAreaId = this._getAreaIdForEntity(entityReg.entity_id);
        return entityAreaId === areaId;
      });

      const entities = matches.map((entityReg) => {
        const state = this.hass.states[entityReg.entity_id];
        const customConfig = this._enabledCustomEntities[entityReg.entity_id] || {};
        return {
          entity_id: entityReg.entity_id,
          name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
          state: state?.state || "unknown",
          icon: state?.attributes?.icon || entityReg.icon || 'mdi:help-circle',
          unit: state?.attributes?.unit_of_measurement || '',
          enabled: customConfig.enabled || false,
          childEntities: customConfig.childEntities || [],
        };
      });
      return dashviewUtils.sortByName(entities);
    }

    /**
     * Get all entities that could be child entities for a given parent
     * (entities from the same device or entities that share labels with the parent)
     */
    _getPotentialChildEntities(parentEntityId) {
      if (!this.hass || !parentEntityId) return [];

      const parentReg = this._entityRegistry.find(e => e.entity_id === parentEntityId);
      if (!parentReg) return [];

      const potentialChildren = [];

      // Get entities from the same device
      if (parentReg.device_id) {
        const deviceEntities = this._entityRegistry.filter(e =>
          e.device_id === parentReg.device_id &&
          e.entity_id !== parentEntityId
        );
        deviceEntities.forEach(entityReg => {
          const state = this.hass.states[entityReg.entity_id];
          if (state) {
            potentialChildren.push({
              entity_id: entityReg.entity_id,
              name: state.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
              state: state.state || "unknown",
              icon: state.attributes?.icon || entityReg.icon || 'mdi:help-circle',
              unit: state.attributes?.unit_of_measurement || '',
              source: 'device',
            });
          }
        });
      }

      return dashviewUtils.sortByName(potentialChildren);
    }

    /**
     * Toggle a custom label's enabled state (show/hide in room config)
     */
    _toggleCustomLabel(labelId) {
      const current = this._customLabels[labelId] || {};
      this._customLabels = {
        ...this._customLabels,
        [labelId]: {
          ...current,
          enabled: !current.enabled,
        },
      };
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Toggle a custom entity's enabled state
     */
    _toggleCustomEntityEnabled(entityId) {
      const current = this._enabledCustomEntities[entityId] || {};
      this._enabledCustomEntities = {
        ...this._enabledCustomEntities,
        [entityId]: {
          ...current,
          enabled: !current.enabled,
        },
      };
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Add a child entity to a parent entity
     */
    _addChildEntity(parentEntityId, childEntityId) {
      const current = this._enabledCustomEntities[parentEntityId] || { enabled: false, childEntities: [] };
      const childEntities = current.childEntities || [];
      if (!childEntities.includes(childEntityId)) {
        this._enabledCustomEntities = {
          ...this._enabledCustomEntities,
          [parentEntityId]: {
            ...current,
            childEntities: [...childEntities, childEntityId],
          },
        };
        this._saveSettings();
        this.requestUpdate();
      }
    }

    /**
     * Remove a child entity from a parent entity
     */
    _removeChildEntity(parentEntityId, childEntityId) {
      const current = this._enabledCustomEntities[parentEntityId] || { enabled: false, childEntities: [] };
      const childEntities = (current.childEntities || []).filter(id => id !== childEntityId);
      this._enabledCustomEntities = {
        ...this._enabledCustomEntities,
        [parentEntityId]: {
          ...current,
          childEntities,
        },
      };
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Toggle expansion of a custom label section in admin
     */
    _toggleCustomLabelExpanded(labelId) {
      this._expandedCustomLabels = {
        ...this._expandedCustomLabels,
        [labelId]: !this._expandedCustomLabels[labelId],
      };
      this.requestUpdate();
    }

    /**
     * Get the enabled custom labels (labels that should show as sections in room config)
     */
    _getEnabledCustomLabels() {
      return this._getCustomLabels().filter(label => label.enabled);
    }

    // ============================================
    // End Custom Label Methods
    // ============================================

    // ============================================
    // Appliance Methods (Device-based)
    // ============================================

    /**
     * Get all configured label IDs for filtering
     * @returns {Set} Set of label IDs that are configured for categories
     * @private
     */
    _getConfiguredLabelIds() {
      const labelIds = new Set();
      if (this._lightLabelId) labelIds.add(this._lightLabelId);
      if (this._coverLabelId) labelIds.add(this._coverLabelId);
      if (this._roofWindowLabelId) labelIds.add(this._roofWindowLabelId);
      if (this._windowLabelId) labelIds.add(this._windowLabelId);
      if (this._garageLabelId) labelIds.add(this._garageLabelId);
      if (this._motionLabelId) labelIds.add(this._motionLabelId);
      if (this._smokeLabelId) labelIds.add(this._smokeLabelId);
      if (this._vibrationLabelId) labelIds.add(this._vibrationLabelId);
      if (this._temperatureLabelId) labelIds.add(this._temperatureLabelId);
      if (this._humidityLabelId) labelIds.add(this._humidityLabelId);
      if (this._climateLabelId) labelIds.add(this._climateLabelId);
      if (this._mediaPlayerLabelId) labelIds.add(this._mediaPlayerLabelId);
      return labelIds;
    }

    /**
     * Check if a device has any entity with a configured label
     * @param {string} deviceId - Device ID
     * @param {Set} configuredLabelIds - Set of configured label IDs
     * @returns {boolean} True if device has entities with configured labels
     * @private
     */
    _deviceHasConfiguredLabels(deviceId, configuredLabelIds) {
      if (configuredLabelIds.size === 0) return false;

      const deviceEntities = this._entityRegistry.filter(e => e.device_id === deviceId);
      for (const entityReg of deviceEntities) {
        if (entityReg.labels && entityReg.labels.length > 0) {
          for (const label of entityReg.labels) {
            if (configuredLabelIds.has(label)) {
              return true;
            }
          }
        }
      }
      return false;
    }

    /**
     * Get device icon based on device class or default
     * @param {Object} device - Device registry entry
     * @param {Array} deviceEntities - Entities belonging to the device
     * @returns {string} MDI icon string
     * @private
     */
    _getDeviceIcon(device, deviceEntities) {
      // Check device entries for known integrations
      if (device.identifiers) {
        const identifiersStr = JSON.stringify(device.identifiers).toLowerCase();
        if (identifiersStr.includes('home_connect')) return 'mdi:washing-machine';
        if (identifiersStr.includes('hue')) return 'mdi:lightbulb';
        if (identifiersStr.includes('sonos')) return 'mdi:speaker';
      }

      // Check manufacturer
      const manufacturer = (device.manufacturer || '').toLowerCase();
      if (manufacturer.includes('bosch') || manufacturer.includes('siemens') || manufacturer.includes('miele')) {
        return 'mdi:washing-machine';
      }

      // Check entity domains for hints
      const domains = new Set(deviceEntities.map(e => e.entity_id.split('.')[0]));
      if (domains.has('sensor') && !domains.has('light') && !domains.has('switch')) {
        return 'mdi:devices';
      }

      return 'mdi:devices';
    }

    /**
     * Get all selectable devices for an area (devices without configured labels)
     * @param {string} areaId - Area ID
     * @returns {Array} Array of device objects that can be selected as appliances
     */
    _getAreaAppliances(areaId) {
      if (!this._deviceRegistry || !this.hass) return [];

      const configuredLabelIds = this._getConfiguredLabelIds();
      const devices = [];

      this._deviceRegistry.forEach(device => {
        // Check if device is in this area
        if (device.area_id !== areaId) return;

        // Skip devices that have entities with configured labels
        if (this._deviceHasConfiguredLabels(device.id, configuredLabelIds)) return;

        // Get all entities for this device
        const deviceEntities = this._entityRegistry.filter(e => e.device_id === device.id);

        // Skip devices with no entities
        if (deviceEntities.length === 0) return;

        // Find relevant entities (operation state, finish time, power, etc.)
        const entities = {};
        deviceEntities.forEach(entityReg => {
          const state = this.hass.states[entityReg.entity_id];
          if (!state) return;

          const entityIdLower = entityReg.entity_id.toLowerCase();
          const nameLower = (state.attributes?.friendly_name || '').toLowerCase();

          // Detect entity purpose
          if (entityIdLower.includes('operation_state') || entityIdLower.includes('status') || nameLower.includes('status')) {
            entities.operationState = { entity_id: entityReg.entity_id, state: state.state, name: state.attributes?.friendly_name };
          } else if (entityIdLower.includes('finish_time') || entityIdLower.includes('remaining') || nameLower.includes('remaining')) {
            entities.finishTime = { entity_id: entityReg.entity_id, state: state.state, name: state.attributes?.friendly_name };
          } else if (entityIdLower.includes('power') || entityIdLower.includes('energy')) {
            entities.power = { entity_id: entityReg.entity_id, state: state.state, unit: state.attributes?.unit_of_measurement, name: state.attributes?.friendly_name };
          } else if (entityIdLower.includes('program') || entityIdLower.includes('programme')) {
            entities.program = { entity_id: entityReg.entity_id, state: state.state, name: state.attributes?.friendly_name };
          }
        });

        // Get icon for device
        const icon = this._getDeviceIcon(device, deviceEntities);

        // Get appliance config (new format: { enabled, stateEntity, timerEntity })
        const applianceConfig = this._enabledAppliances[device.id] || {};
        // Support old format (boolean) for backwards compatibility
        const isEnabled = typeof applianceConfig === 'boolean' ? applianceConfig : !!applianceConfig.enabled;
        const stateEntity = typeof applianceConfig === 'object' ? applianceConfig.stateEntity : null;
        const timerEntity = typeof applianceConfig === 'object' ? applianceConfig.timerEntity : null;

        devices.push({
          device_id: device.id,
          name: device.name_by_user || device.name,
          manufacturer: device.manufacturer,
          model: device.model,
          icon,
          entities,
          enabled: isEnabled,
          stateEntity,
          timerEntity,
          entityCount: deviceEntities.length,
          allEntities: deviceEntities.map(e => ({
            entity_id: e.entity_id,
            name: this.hass.states[e.entity_id]?.attributes?.friendly_name || e.entity_id,
            state: this.hass.states[e.entity_id]?.state,
          })),
        });
      });

      return dashviewUtils.sortByName(devices);
    }

    /**
     * Get enabled appliances for an area
     * @param {string} areaId - Area ID
     * @returns {Array} Array of enabled appliance objects
     */
    _getEnabledAppliancesForArea(areaId) {
      return this._getAreaAppliances(areaId).filter(a => a.enabled);
    }

    /**
     * Get all appliances with showInHomeStatus enabled (across all areas)
     * @returns {Array} Array of appliance objects with showInHomeStatus enabled
     */
    _getAppliancesWithHomeStatus() {
      if (!this._areas || !this._enabledAppliances) return [];

      const appliances = [];
      this._areas.forEach(area => {
        const areaAppliances = this._getAreaAppliances(area.area_id);
        areaAppliances.forEach(appliance => {
          if (appliance.enabled) {
            const config = this._enabledAppliances[appliance.device_id];
            if (config && config.showInHomeStatus) {
              appliances.push({
                ...appliance,
                areaName: area.name,
                areaId: area.area_id
              });
            }
          }
        });
      });
      return appliances;
    }

    /**
     * Toggle an appliance's enabled state
     * @param {string} deviceId - Device ID
     */
    _toggleAppliance(deviceId) {
      const current = this._enabledAppliances[deviceId];
      // Support old format (boolean) and new format (object)
      const isCurrentlyEnabled = typeof current === 'boolean' ? current : (current?.enabled || false);

      if (isCurrentlyEnabled) {
        // Disable: remove the entry entirely
        const { [deviceId]: removed, ...rest } = this._enabledAppliances;
        this._enabledAppliances = rest;
      } else {
        // Enable: create new config object
        this._enabledAppliances = {
          ...this._enabledAppliances,
          [deviceId]: { enabled: true, stateEntity: null, timerEntity: null },
        };
      }
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Set the state entity for an appliance
     * @param {string} deviceId - Device ID
     * @param {string|null} entityId - Entity ID or null to clear
     */
    _setApplianceStateEntity(deviceId, entityId) {
      const current = this._enabledAppliances[deviceId] || { enabled: true };
      this._enabledAppliances = {
        ...this._enabledAppliances,
        [deviceId]: { ...current, stateEntity: entityId || null },
      };
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Set the timer entity for an appliance
     * @param {string} deviceId - Device ID
     * @param {string|null} entityId - Entity ID or null to clear
     */
    _setApplianceTimerEntity(deviceId, entityId) {
      const current = this._enabledAppliances[deviceId] || { enabled: true };
      this._enabledAppliances = {
        ...this._enabledAppliances,
        [deviceId]: { ...current, timerEntity: entityId || null },
      };
      this._saveSettings();
      this.requestUpdate();
    }

    /**
     * Get appliance/device status text for display
     * @param {Object} appliance - Appliance/device object
     * @returns {Object} Status info with text, icon, isActive, remainingTime, isUnavailable
     */
    _getApplianceStatus(appliance) {
      // Use user-configured entities if available, otherwise fall back to auto-detected
      const stateEntityId = appliance.stateEntity || appliance.entities?.operationState?.entity_id;
      const timerEntityId = appliance.timerEntity || appliance.entities?.finishTime?.entity_id;

      // Get state from configured entity
      const stateObj = stateEntityId ? this.hass?.states[stateEntityId] : null;
      const timerObj = timerEntityId ? this.hass?.states[timerEntityId] : null;

      // If we have a state entity, use it
      if (stateObj) {
        const state = stateObj.state.toLowerCase();

        // Unavailable/unknown states
        if (state === 'unavailable' || state === 'unknown') {
          return { text: t('common.status.unavailable'), icon: appliance.icon, isActive: false, isUnavailable: true };
        }

        // Error states
        if (state === 'error' || state === 'fault' || state === 'failure') {
          return { text: t('ui.errors.error'), icon: appliance.icon, isActive: false, isError: true };
        }

        // Running states - calculate remaining time if timer entity is available
        if (['run', 'running', 'active', 'washing', 'drying', 'cleaning', 'on'].includes(state)) {
          let remainingTime = null;

          // Try to get remaining time from timer entity
          if (timerObj && timerObj.state && timerObj.state !== 'unknown' && timerObj.state !== 'unavailable') {
            remainingTime = this._formatRemainingTime(timerObj.state);
          }

          // If we have remaining time, show it as the main status (like sensor_big)
          if (remainingTime) {
            return { text: remainingTime, icon: appliance.icon, isActive: true };
          }

          return { text: t('common.status.running'), icon: appliance.icon, isActive: true };
        }

        // Finished states
        if (['finished', 'complete', 'done'].includes(state)) {
          return { text: t('common.status.ready'), icon: appliance.icon, isActive: false, isFinished: true };
        }

        // Ready/idle/off states
        if (['idle', 'off', 'standby', 'ready'].includes(state)) {
          return { text: t('common.status.ready'), icon: appliance.icon, isActive: false };
        }

        // Default: show the state as-is
        return { text: stateObj.state, icon: appliance.icon, isActive: false };
      }

      // No state entity configured - try to get status from first available entity
      if (appliance.allEntities && appliance.allEntities.length > 0) {
        const firstEntity = appliance.allEntities[0];
        // Get live state from hass
        const stateObj = this.hass?.states[firstEntity.entity_id];
        const state = stateObj?.state?.toLowerCase() || 'unavailable';

        // Check for unavailable states
        if (state === 'unavailable' || state === 'unknown') {
          return { text: t('common.status.unavailable'), icon: appliance.icon, isActive: false, isUnavailable: true };
        }

        // Check for error states
        if (state === 'error' || state === 'fault' || state === 'failure') {
          return { text: t('ui.errors.error'), icon: appliance.icon, isActive: false, isError: true };
        }

        // Check for common active/on states
        if (state === 'on' || state === 'playing' || state === 'active') {
          return { text: t('common.status.active'), icon: appliance.icon, isActive: true };
        }
        if (state === 'off' || state === 'idle' || state === 'standby') {
          return { text: t('common.status.ready'), icon: appliance.icon, isActive: false };
        }

        // Show entity count as subtitle
        return { text: `${appliance.entityCount} Entities`, icon: appliance.icon, isActive: false };
      }

      return { text: 'Unbekannt', icon: appliance.icon, isActive: false, isUnavailable: true };
    }

    /**
     * Format remaining time from various formats
     * @param {string} value - Time value (ISO timestamp, minutes, etc.)
     * @returns {string|null} Formatted time string
     */
    _formatRemainingTime(value) {
      return coreUtils ? coreUtils.formatRemainingTime(value) : null;
    }

    // ============================================
    // End Appliance Methods
    // ============================================

    _getAllMediaPlayers() {
      if (!this.hass || !this._mediaPlayerLabelId) return [];

      // Get all entities with the "media_player" label
      const matches = this._entityRegistry.filter((entityReg) => {
        return entityReg.labels && entityReg.labels.includes(this._mediaPlayerLabelId);
      });

      const players = matches.map((entityReg) => {
        const state = this.hass.states[entityReg.entity_id];
        const mediaTitle = state?.attributes?.media_title;
        const mediaArtist = state?.attributes?.media_artist;
        const entityPicture = state?.attributes?.entity_picture;
        const volumeLevel = state?.attributes?.volume_level;
        const source = state?.attributes?.source;
        const areaId = this._getAreaIdForEntity(entityReg.entity_id);
        const area = this._areas.find(a => a.area_id === areaId);
        return {
          entity_id: entityReg.entity_id,
          name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
          state: state?.state || "unknown",
          mediaTitle: mediaTitle,
          mediaArtist: mediaArtist,
          entityPicture: entityPicture,
          volumeLevel: volumeLevel,
          source: source,
          enabled: this._enabledMediaPlayers[entityReg.entity_id] !== false,
          areaId: areaId,
          areaName: area?.name || "Unknown",
        };
      });
      return dashviewUtils.sortByName(players);
    }

    _toggleMediaPlayerEnabled(entityId) { this._toggleEntityEnabled('_enabledMediaPlayers', entityId); }

    _getEnabledMediaPlayersForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledMediaPlayers, s => ({
        state: s.state, media_title: s.attributes?.media_title || '', media_artist: s.attributes?.media_artist || '',
        media_album_name: s.attributes?.media_album_name || '', entity_picture: s.attributes?.entity_picture || null,
        volume_level: s.attributes?.volume_level, is_volume_muted: s.attributes?.is_volume_muted || false,
        source: s.attributes?.source || '', shuffle: s.attributes?.shuffle || false,
        repeat: s.attributes?.repeat || 'off', supported_features: s.attributes?.supported_features || 0,
      }), this._mediaPlayerLabelId);
    }

    _togglePopupMediaExpanded() { this._toggleBoolProp('_popupMediaExpanded'); }

    // Media player control helpers
    _mediaCallService(entityId, service, data = {}) { this.hass.callService('media_player', service, { entity_id: entityId, ...data }); }
    _mediaPlayPause(entityId) { this._mediaCallService(entityId, 'media_play_pause'); }
    _mediaNext(entityId) { this._mediaCallService(entityId, 'media_next_track'); }
    _mediaPrevious(entityId) { this._mediaCallService(entityId, 'media_previous_track'); }
    _mediaToggleShuffle(entityId) {
      const shuffle = !(this.hass.states[entityId]?.attributes?.shuffle || false);
      this._mediaCallService(entityId, 'shuffle_set', { shuffle });
    }
    _mediaToggleRepeat(entityId) {
      const repeatModes = ['off', 'all', 'one'];
      const current = this.hass.states[entityId]?.attributes?.repeat || 'off';
      this._mediaCallService(entityId, 'repeat_set', { repeat: repeatModes[(repeatModes.indexOf(current) + 1) % 3] });
    }
    _handleMediaVolumeSliderClick(e, entityId) {
      const rect = e.currentTarget.getBoundingClientRect();
      this._mediaCallService(entityId, 'volume_set', { volume_level: Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) });
    }

    _getEntityCounts() {
      if (!this.hass) return { total: 0, lights: 0, switches: 0, sensors: 0, unavailable: 0, lightsOn: 0, enabledLights: 0, totalLabeledLights: 0 };

      const states = Object.values(this.hass.states);
      // Filter enabled lights by current label (iterate over registry for default-enabled)
      const excludedDomains = ['automation', 'script', 'scene'];
      const enabledLightIds = this._entityRegistry
        .filter((entityReg) => {
          const entityId = entityReg.entity_id;
          if (this._enabledLights[entityId] === false) return false;
          // Only count lights that have the currently selected light label
          if (!this._lightLabelId || !entityReg.labels || !entityReg.labels.includes(this._lightLabelId)) return false;
          // Exclude non-light domains (automation, script, scene with light label)
          const domain = entityId.split('.')[0];
          if (excludedDomains.includes(domain)) return false;
          return true;
        })
        .map((e) => e.entity_id);

      // Count entities with the "Light" label
      const totalLabeledLights = this._lightLabelId
        ? this._entityRegistry.filter(e => e.labels && e.labels.includes(this._lightLabelId)).length
        : 0;

      return {
        total: states.length,
        lights: states.filter((e) => e.entity_id.startsWith("light.")).length,
        switches: states.filter((e) => e.entity_id.startsWith("switch.")).length,
        sensors: states.filter((e) => e.entity_id.startsWith("sensor.")).length,
        unavailable: states.filter((e) => e.state === "unavailable").length,
        lightsOn: enabledLightIds.filter(id => this.hass.states[id]?.state === "on").length,
        enabledLights: enabledLightIds.length,
        totalLabeledLights,
      };
    }

    _formatDate() {
      return coreUtils ? coreUtils.formatDate() : '';
    }

    _setTab(tab) {
      this._closeAllPopups();
      this._activeTab = tab;
    }

    _closeAllPopups() {
      this._securityPopupOpen = false;
      this._lightsPopupOpen = false;
      this._batteryPopupOpen = false;
      this._mediaPopupOpen = false;
      this._weatherPopupOpen = false;
      this._adminPopupOpen = false;
      this._popupRoom = null;
      this._popupCoverExpanded = false;
      this._popupGarageExpanded = false;
    }

    _getAreaIcon(area) {
      // Use the icon from the area registry, fallback to generic home icon
      return area.icon || "mdi:home-outline";
    }

    /**
     * Get floors sorted by custom order, then by level
     * @returns {Array} Sorted array of floor objects
     */
    _getOrderedFloors() {
      if (!this._floors || this._floors.length === 0) return [];

      // If we have a custom floor order, use it
      if (this._floorOrder && this._floorOrder.length > 0) {
        const orderedFloors = [];
        const remainingFloors = [...this._floors];

        // First add floors in the custom order
        this._floorOrder.forEach(floorId => {
          const index = remainingFloors.findIndex(f => f.floor_id === floorId);
          if (index !== -1) {
            orderedFloors.push(remainingFloors.splice(index, 1)[0]);
          }
        });

        // Then add any remaining floors (sorted by level)
        remainingFloors.sort((a, b) => (a.level || 0) - (b.level || 0));
        orderedFloors.push(...remainingFloors);

        return orderedFloors;
      }

      // Default: sort by level
      return [...this._floors].sort((a, b) => (a.level || 0) - (b.level || 0));
    }

    /**
     * Get areas/rooms for a specific floor
     * @param {string} floorId - The floor ID
     * @returns {Array} Array of area objects for this floor
     */
    _getAreasForFloor(floorId) {
      if (!this._areas || this._areas.length === 0) return [];

      return this._areas.filter(area => area.floor_id === floorId);
    }

    /**
     * Get rooms for a floor, sorted by custom order
     * @param {string} floorId - The floor ID
     * @returns {Array} Sorted array of area objects
     */
    _getOrderedRoomsForFloor(floorId) {
      const rooms = this._getAreasForFloor(floorId);
      return this._sortRoomsByOrder(rooms, floorId);
    }

    /**
     * Sort rooms by custom order for a floor
     * @param {Array} rooms - Array of room/area objects
     * @param {string|null} floorId - The floor ID (null for unassigned)
     * @returns {Array} Sorted array of rooms
     */
    _sortRoomsByOrder(rooms, floorId) {
      if (!rooms || rooms.length === 0) return [];

      const orderKey = floorId || 'unassigned';
      const customOrder = this._roomOrder[orderKey] || [];

      if (customOrder.length === 0) {
        // No custom order, sort alphabetically
        return dashviewUtils.sortByName([...rooms]);
      }

      const orderedRooms = [];
      const remainingRooms = [...rooms];

      // First add rooms in the custom order
      customOrder.forEach(areaId => {
        const index = remainingRooms.findIndex(r => r.area_id === areaId);
        if (index !== -1) {
          orderedRooms.push(remainingRooms.splice(index, 1)[0]);
        }
      });

      // Then add any remaining rooms (sorted alphabetically)
      orderedRooms.push(...dashviewUtils.sortByName(remainingRooms));

      return orderedRooms;
    }

    render() {
      const weather = this._getWeather();
      const currentWeather = this._getCurrentWeatherData();
      const person = this._getPerson();
      const roomIndicators = this._getActiveRoomIndicators();

      // Get appliances with showInHomeStatus enabled
      const appliancesWithHomeStatus = this._getAppliancesWithHomeStatus();

      // Get all status items via status service (filtered by current labels)
      // Build enabled maps from registry to support default-enabled behavior
      const allStatusItems = statusService
        ? statusService.getAllStatusItems(
            this.hass,
            this._infoTextConfig,
            {
              enabledMotionSensors: this._buildEnabledMapFromRegistry(this._motionLabelId, this._enabledMotionSensors),
              enabledGarages: this._buildEnabledMapFromRegistry(this._garageLabelId, this._enabledGarages),
              enabledWindows: this._buildEnabledMapFromRegistry(this._windowLabelId, this._enabledWindows),
              enabledLights: this._buildEnabledMapFromRegistry(this._lightLabelId, this._enabledLights),
              enabledCovers: this._buildEnabledMapFromRegistry(this._coverLabelId, this._enabledCovers),
              enabledTVs: this._buildEnabledMapFromRegistry(this._tvLabelId, this._enabledTVs),
              enabledLocks: this._buildEnabledMapFromRegistry(this._lockLabelId, this._enabledLocks),
            },
            {
              motionLabelId: this._motionLabelId,
              garageLabelId: this._garageLabelId,
              windowLabelId: this._windowLabelId,
              lightLabelId: this._lightLabelId,
              coverLabelId: this._coverLabelId,
              tvLabelId: this._tvLabelId,
              lockLabelId: this._lockLabelId,
            },
            (entityId, labelId) => this._entityHasCurrentLabel(entityId, labelId),
            appliancesWithHomeStatus,
            (appliance) => this._getApplianceStatus(appliance)
          )
        : [];

      // Use current weather sensors if configured, otherwise fallback to main weather entity
      const headerWeather = currentWeather || (weather ? { temperature: weather.temperature, condition: weather.state } : null);
      const headerUnit = weather?.unit || '°C';

      return html`
        <!-- ERROR BANNER (if settings failed to load) -->
        ${this._settingsError ? html`
          <div class="error-banner" style="
            background: var(--error-color, #b71c1c);
            color: white;
            padding: 8px 16px;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 13px;
          ">
            <ha-icon icon="mdi:alert-circle" style="--mdc-icon-size: 18px;"></ha-icon>
            <span>${this._settingsError}</span>
            <button
              @click=${() => { this._settingsLoaded = false; this._settingsError = null; this._loadSettings(); }}
              style="
                margin-left: auto;
                background: rgba(255,255,255,0.2);
                border: none;
                color: white;
                padding: 4px 12px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
              "
            >Erneut versuchen</button>
          </div>
        ` : ''}

        <!-- TOP HEADER -->
        <div class="top-header">
          <div class="header-left">
            <button class="menu-button" @click=${this._toggleMenu}>
              <ha-icon icon="mdi:menu"></ha-icon>
            </button>
          </div>

          <div class="header-right">
            ${headerWeather
              ? html`
                  <div class="weather-widget" @click=${this._openWeatherPopup}>
                    <ha-icon
                      class="weather-icon"
                      icon="${this._getWeatherIcon(headerWeather.condition)}"
                    ></ha-icon>
                    <div class="weather-info">
                      <span class="weather-condition">${this._translateWeatherCondition(headerWeather.condition)}</span>
                      <span class="weather-temp">${headerWeather.temperature !== null ? headerWeather.temperature.toFixed(1) : '--'}${headerUnit}</span>
                    </div>
                  </div>
                `
              : ""}
            ${person
              ? html`
                  <div class="person-avatar ${person.state === "home" ? "home" : ""}">
                    ${person.picture
                      ? html`<img src="${person.picture}" alt="${person.name}" />`
                      : html`<ha-icon icon="mdi:account"></ha-icon>`}
                  </div>
                `
              : ""}
          </div>
        </div>

        <!-- FLOOR & ROOM ACTIVITY ROW -->
        ${roomIndicators.length > 0
          ? html`
              <div class="activity-row">
                ${roomIndicators.map(
                  (indicator) => html`
                    <div
                      class="activity-chip ${indicator.type === 'floor' ? 'floor-chip' : indicator.type === 'room-smoke' ? 'room-smoke-chip' : indicator.type === 'room-motion' ? 'room-motion-chip' : 'room-chip'}"
                      title="${indicator.label}${indicator.hasMotion ? ' (Motion)' : ''}${indicator.hasSmoke ? ' (Smoke!)' : ''}"
                      @click=${indicator.areaId ? () => this._openRoomPopup(indicator.areaId) : null}
                      style="${indicator.areaId ? 'cursor: pointer;' : ''}"
                    >
                      <ha-icon icon="${indicator.icon}"></ha-icon>
                    </div>
                  `
                )}
              </div>
            `
          : ""}

        <!-- SCENE ROW -->
        ${(() => {
          // Filter to only show buttons without a roomId (main page buttons)
          const mainPageButtons = this._sceneButtons.filter(btn => !btn.roomId && btn.entity);
          if (mainPageButtons.length === 0) return '';
          return html`
            <div class="scene-row">
              ${mainPageButtons.map((button) => {
                const isActive = this._isSceneButtonActive(button);
                return html`
                  <button
                    class="scene-button ${isActive ? 'active' : ''}"
                    @click=${() => this._handleSceneButtonClick(button)}
                    title="${button.label || ''}"
                  >
                    <ha-icon icon="${button.icon || 'mdi:play'}"></ha-icon>
                    <span class="scene-name">${button.label || 'Scene'}</span>
                  </button>
                `;
              })}
            </div>
          `;
        })()}

        <!-- INFO TEXT ROW (Dynamic status messages) -->
        ${allStatusItems.length > 0
          ? html`
              <div class="info-text-row">
                ${allStatusItems.map((status, index) => html`
                  ${index > 0 ? html`<span class="text-segment">&nbsp;&nbsp;</span>` : ''}
                  <span class="text-segment">${status.prefixText} </span>
                  <span
                    class="info-badge ${status.state === 'motion' || status.state === 'finished' || status.state === 'on' ? 'success' : ''} ${status.isWarning ? 'warning' : ''} ${status.clickAction ? 'clickable' : ''}"
                    @click=${status.clickAction ? () => this._handleInfoTextClick(status.clickAction) : null}
                  >
                    ${status.badgeIcon ? html`<ha-icon icon="${status.badgeIcon}" style="--mdc-icon-size: 14px; vertical-align: middle;"></ha-icon> ` : ''}${status.badgeText}${status.emoji || ''}
                  </span>
                  <span class="text-segment">${status.suffixText}</span>
                `)}
              </div>
            `
          : ""}

        <!-- TAB CONTENT -->
        <div class="tab-content">
          ${this._renderHomeTab()}
        </div>

        <!-- ROOM POPUP -->
        ${this._popupRoom && dashviewRoomPopup
          ? dashviewRoomPopup(this, html)
          : this._popupRoom
            ? html`<div class="popup-overlay"><div class="popup-container"><p>Room popup module not loaded</p></div></div>`
            : ''}

        <!-- WEATHER POPUP -->
        ${this._weatherPopupOpen && dashviewWeatherPopup
          ? dashviewWeatherPopup(this, html)
          : this._weatherPopupOpen
            ? html`<div class="popup-overlay"><div class="popup-container"><p>Weather popup module not loaded</p></div></div>`
            : ''}

        <!-- SECURITY POPUP -->
        ${this._securityPopupOpen
          ? html`
              <div class="popup-overlay" @click=${this._handleSecurityPopupOverlayClick}>
                <div class="popup-container">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--primary-color);">
                      <ha-icon icon="mdi:shield-home"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>Sicherheit</h2>
                    </div>
                    <button class="popup-close" @click=${() => this._securityPopupOpen = false}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                  <div class="popup-content">
                    ${this._renderSecurityPopupContent()}
                  </div>
                </div>
              </div>
            `
          : ""}

        <!-- LIGHTS POPUP -->
        ${this._lightsPopupOpen
          ? html`
              <div class="popup-overlay" @click=${this._handleLightsPopupOverlayClick}>
                <div class="popup-container">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--dv-gradient-active, linear-gradient(135deg, #ffd54f 0%, #ffb300 100%));">
                      <ha-icon icon="mdi:lightbulb-group"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>${t('ui.popups.lights.title')}</h2>
                    </div>
                    <button class="popup-close" @click=${this._closeLightsPopup}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                  <div class="popup-content">
                    ${this._renderLightsPopupContent()}
                  </div>
                </div>
              </div>
            `
          : ""}

        <!-- BATTERY POPUP -->
        ${this._batteryPopupOpen
          ? html`
              <div class="popup-overlay" @click=${this._handleBatteryPopupOverlayClick}>
                <div class="popup-container">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--warning-color, #ff9800);">
                      <ha-icon icon="mdi:battery-low"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>Batterien</h2>
                    </div>
                    <button class="popup-close" @click=${this._closeBatteryPopup}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                  <div class="popup-content">
                    ${this._renderBatteryPopupContent()}
                  </div>
                </div>
              </div>
            `
          : ""}

        <!-- MEDIA POPUP -->
        ${this._mediaPopupOpen && dashviewMediaPopup
          ? dashviewMediaPopup(this, html)
          : this._mediaPopupOpen
            ? html`<div class="popup-overlay"><div class="popup-container"><p>Media popup module not loaded</p></div></div>`
            : ''}

        <!-- ADMIN POPUP -->
        ${this._adminPopupOpen
          ? html`
              <div class="popup-overlay" @click=${this._handleAdminPopupOverlayClick}>
                <div class="popup-container" @click=${(e) => e.stopPropagation()}>
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--primary-color);">
                      <ha-icon icon="mdi:cog"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>Admin</h2>
                    </div>
                    <button class="popup-close" @click=${() => this._adminPopupOpen = false}>
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                  <div class="popup-content">
                    ${this._renderAdminContent()}
                  </div>
                </div>
              </div>
            `
          : ""}

        <!-- CHANGELOG POPUP -->
        ${this._changelogPopupOpen && dashviewChangelogPopup
          ? dashviewChangelogPopup(this, html)
          : ''}

        <!-- BOTTOM TAB BAR -->
        <div class="bottom-tab-bar">
          <div class="bottom-tab-bar-inner">
            <button
              class="tab ${this._activeTab === "home" && !this._securityPopupOpen && !this._mediaPopupOpen && !this._adminPopupOpen ? "active" : ""}"
              @click=${() => this._setTab("home")}
            >
              <ha-icon icon="mdi:home"></ha-icon>
              <span>Home</span>
            </button>
            <button
              class="tab ${this._securityPopupOpen ? "active" : ""}"
              @click=${() => { this._closeAllPopups(); this._securityPopupOpen = true; this.requestUpdate(); }}
            >
              <ha-icon icon="mdi:shield-home"></ha-icon>
              <span>Sicherheit</span>
            </button>
            <button
              class="tab ${this._mediaPopupOpen ? "active" : ""}"
              @click=${() => { this._closeAllPopups(); this._mediaPopupOpen = true; this.requestUpdate(); }}
            >
              <ha-icon icon="mdi:music"></ha-icon>
              <span>Musik</span>
            </button>
            <button
              class="tab ${this._adminPopupOpen ? "active" : ""}"
              @click=${() => { this._closeAllPopups(); this._adminPopupOpen = true; this.requestUpdate(); }}
            >
              <ha-icon icon="mdi:cog"></ha-icon>
              <span>Admin</span>
            </button>
          </div>
        </div>
      `;
    }

    _renderHomeTab() {
      // Use external module if available
      if (dashviewHome?.renderHomeTab) {
        return dashviewHome.renderHomeTab(this, html);
      }
      // Fallback
      return html`<div style="padding: 24px; text-align: center;">Home module not loaded</div>`;
    }

    _renderRaeumeSection() {
      // Use external module if available
      if (dashviewHome?.renderRaeumeSection) {
        return dashviewHome.renderRaeumeSection(this, html);
      }
      return html``;
    }

    _renderFloorOverviewCard(floorId) {
      // Use external module if available
      if (dashviewHome?.renderFloorOverviewCard) {
        return dashviewHome.renderFloorOverviewCard(this, html, floorId);
      }
      return html``;
    }

    _renderRoomCardsGrid() {
      // Use external module if available
      if (dashviewHome?.renderRoomCardsGrid) {
        return dashviewHome.renderRoomCardsGrid(this, html);
      }
      return html``;
    }

    _renderSecurityPopupContent() {
      // Use external module if available, fallback to inline
      if (dashviewPopups?.renderSecurityPopupContent) {
        return dashviewPopups.renderSecurityPopupContent(this, html);
      }
      // Fallback: return empty if module not loaded
      return html`<div class="security-empty-state">Security module not loaded</div>`;
    }

    _renderLightsPopupContent() {
      // Use external module if available, fallback to inline
      if (dashviewPopups?.renderLightsPopupContent) {
        return dashviewPopups.renderLightsPopupContent(this, html);
      }
      // Fallback: return empty if module not loaded
      return html`<div class="lights-empty-state">Lights module not loaded</div>`;
    }

    _handleSecurityPopupOverlayClick(e) { this._handlePopupOverlay(e, () => { this._securityPopupOpen = false; }); }
    _handleMediaPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeMediaPopup()); }
    _closeMediaPopup() { this._closePopup('_mediaPopupOpen'); }
    _handleAdminPopupOverlayClick(e) { this._handlePopupOverlay(e, () => { this._adminPopupOpen = false; }); }

    _renderBatteryPopupContent() {
      return dashviewPopups?.renderBatteryPopupContent ? dashviewPopups.renderBatteryPopupContent(this, html) : html`<div class="battery-empty-state">Battery module not loaded</div>`;
    }

    _showMoreInfo(entityId) {
      dashviewUtils.openMoreInfo(this, entityId);
    }


    // =========================================================================
    // RENDER DELEGATION METHODS
    // These methods delegate to external feature modules for rendering.
    // The modules are loaded dynamically at startup.
    // =========================================================================

    _renderAdminContent() {
      if (dashviewAdmin?.renderAdminTab) {
        return dashviewAdmin.renderAdminTab(this, html);
      }
      return html`<div class="module-error">Admin module not loaded. Please refresh the page.</div>`;
    }

    _renderRoomConfig() {
      if (dashviewAdmin?.renderRoomConfig) {
        return dashviewAdmin.renderRoomConfig(this, html);
      }
      return html``;
    }

    _renderCardConfig() {
      if (dashviewAdmin?.renderCardConfig) {
        return dashviewAdmin.renderCardConfig(this, html);
      }
      return html``;
    }

    _renderOrderConfig() {
      if (dashviewAdmin?.renderOrderConfig) {
        return dashviewAdmin.renderOrderConfig(this, html);
      }
      return html``;
    }

    _renderAreaCard(area) {
      if (dashviewAdmin?.renderAreaCard) {
        return dashviewAdmin.renderAreaCard(this, html, area);
      }
      return html``;
    }

    _renderGarbageCard() {
      if (dashviewHome?.renderGarbageCard) {
        return dashviewHome.renderGarbageCard(this, html);
      }
      return html``;
    }

    _isSceneButtonActive(button) {
      // Check if a scene button should be shown as active based on entity state
      if (!button.entity || !this.hass) return false;

      const state = this.hass.states[button.entity];
      if (!state) return false;

      // For scenes, they don't have a persistent "on" state, so return false
      if (button.actionType === 'scene') return false;

      // For scripts and services with entities, check if entity is on
      return state.state === 'on';
    }

    _handleSceneButtonClick(button) {
      if (!this.hass || !button) return;

      const actionType = button.actionType || 'service';
      const entity = button.entity;

      if (!entity) {
        console.warn('Scene button has no entity configured');
        return;
      }

      if (actionType === 'scene') {
        // Activate scene
        this.hass.callService('scene', 'turn_on', {
          entity_id: entity
        });
      } else if (actionType === 'script') {
        // Run script
        this.hass.callService('script', 'turn_on', {
          entity_id: entity
        });
      } else {
        // Default service call - toggle the entity
        const domain = entity.split('.')[0];
        this.hass.callService(domain, 'toggle', {
          entity_id: entity
        });
      }
    }
  }

  customElements.define("dashview-panel", DashviewPanel);
})();
