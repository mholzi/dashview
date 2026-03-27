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

// ============================================================================
// structuredClone Polyfill (Safari <15.4, Chrome <98, Firefox <94)
// MUST run synchronously before any other code.
// Cannot use static import here — this file is loaded as a classic script,
// not an ES module. Canonical implementation lives in utils/polyfills.js.
// Keep both in sync (verified by polyfills.test.js).
// ============================================================================
if (typeof structuredClone === 'undefined') {
  globalThis.structuredClone = function(obj, seen = new WeakSet()) {
    if (obj === null || typeof obj !== 'object') return obj;
    if (seen.has(obj)) {
      throw new DOMException('Circular reference detected', 'DataCloneError');
    }
    seen.add(obj);
    if (obj instanceof Date) return new Date(obj);
    if (obj instanceof RegExp) return new RegExp(obj);
    if (obj instanceof Map) {
      const clone = new Map();
      obj.forEach((v, k) => clone.set(structuredClone(k, seen), structuredClone(v, seen)));
      return clone;
    }
    if (obj instanceof Set) {
      const clone = new Set();
      obj.forEach(v => clone.add(structuredClone(v, seen)));
      return clone;
    }
    if (Array.isArray(obj)) {
      return obj.map(item => structuredClone(item, seen));
    }
    const clone = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        clone[key] = structuredClone(obj[key], seen);
      }
    }
    return clone;
  };
}

// Wait for HA frontend to be ready, then load
(async () => {
  // Version for cache busting - update this when making changes
  // NOTE: Use `npm run bump-version <version>` to update all version constants at once
  const DASHVIEW_VERSION = "1.5.3";

  // Non-device domains to exclude from entity lists globally
  // These should never appear as room entities even if they carry a matching label
  const EXCLUDED_DOMAINS = ['automation', 'script', 'scene'];

  // Debug mode - set to true for development logging
  const DEBUG = false;
  const debugLog = (...args) => DEBUG && console.log('[Dashview]', ...args);

  // Wait for required HA elements to be available
  await customElements.whenDefined("ha-panel-lovelace");

  // Get LitElement base class from HA
  const haPanel = customElements.get("ha-panel-lovelace");
  const LitElement = Object.getPrototypeOf(haPanel);

  // Import lit html and css from local vendor bundle (no CDN dependency)
  const { html, css } = await import("./vendor/lit.esm.js");

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
  let dashviewWaterPopup = null;
  let dashviewChangelogPopup = null;
  let dashviewUserPopup = null;
  let changelogUtils = null;
  try {
    const popupsModule = await import(`./features/popups/index.js?v=${DASHVIEW_VERSION}`);
    dashviewRoomPopup = popupsModule.renderRoomPopup;
    dashviewWeatherPopup = popupsModule.renderWeatherPopup;
    dashviewMediaPopup = popupsModule.renderMediaPopup;
    dashviewWaterPopup = popupsModule.renderWaterPopup;
    dashviewChangelogPopup = popupsModule.renderChangelogPopup;
    dashviewUserPopup = popupsModule.renderUserPopup;
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
  let anomalyDetector = null;
  let suggestionEngine = null;
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
    anomalyDetector = {
      detectTemperatureAnomaly: servicesModule.detectTemperatureAnomaly,
      detectHumidityAnomaly: servicesModule.detectHumidityAnomaly,
    };
    suggestionEngine = {
      evaluateSuggestions: servicesModule.evaluateSuggestions,
      dismissSuggestion: servicesModule.dismissSuggestion,
      recordSuggestionAction: servicesModule.recordSuggestionAction,
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
        // HA-provided
        hass: { type: Object },
        narrow: { type: Boolean },
        route: { type: Object },
        panel: { type: Object },
        // Timer
        _currentTime: { type: String },
        // Tab state
        _activeTab: { type: String },
        _adminSubTab: { type: String },
        _activeFloorTab: { type: String },
        _activeSecurityTab: { type: String },
        _activeCustomLabelTab: { type: String },
        _activeMediaTab: { type: String },
        // Popup states
        _popupRoom: { type: Object },
        _mediaPopupOpen: { type: Boolean },
        _waterPopupOpen: { type: Boolean },
        _weatherPopupOpen: { type: Boolean },
        _securityPopupOpen: { type: Boolean },
        _lightsPopupOpen: { type: Boolean },
        _coversPopupOpen: { type: Boolean },
        _tvsPopupOpen: { type: Boolean },
        _batteryPopupOpen: { type: Boolean },
        _userPopupOpen: { type: Boolean },
        _adminPopupOpen: { type: Boolean },
        _changelogPopupOpen: { type: Boolean },
        // Popup expanded states
        _popupCoverExpanded: { type: Boolean },
        _popupGarageExpanded: { type: Boolean },
        _popupLightExpanded: { type: Boolean },
        _popupLockExpanded: { type: Boolean },
        _popupTVExpanded: { type: Boolean },
        _popupMediaExpanded: { type: Boolean },
        _popupThermostatExpanded: { type: Boolean },
        _popupDevicesExpanded: { type: Boolean },
        // Expanded sections
        _expandedAreas: { type: Object },
        _expandedCardSections: { type: Object },
        _expandedCustomLabels: { type: Object },
        // Search state
        _garbageSearchQuery: { type: String },
        _garbageSearchFocused: { type: Boolean },
        _dwdWarningSearchQuery: { type: String },
        _dwdWarningSearchFocused: { type: Boolean },
        _weatherEntitySearchQuery: { type: String },
        _weatherEntitySearchFocused: { type: Boolean },
        _personEntitySearchQuery: { type: String },
        _personEntitySearchFocused: { type: Boolean },
        _sceneButtonSearchQuery: { type: String },
        _sceneButtonSearchFocused: { type: Boolean },
        _trainSearchQuery: { type: String },
        _trainSearchFocused: { type: Boolean },
        _infoTextSearchQuery: { type: Object },
        _infoTextSearchFocused: { type: Object },
        _roomSceneIconSearchQuery: { type: String },
        _roomSceneIconSearchFocused: { type: Boolean },
        _roomSceneEntitySearchQuery: { type: String },
        _roomSceneEntitySearchFocused: { type: Boolean },
        _mediaPresetSearchQuery: { type: String },
        _mediaPresetSearchFocused: { type: Boolean },
        // Entity dropdown / floor card
        _openEntityDropdown: { type: String },
        _selectedFloorCardSlot: { type: String },
        _floorCardSearchState: { type: Object },
        // Motion state
        _motionDetected: { type: Boolean },
        _lastMotionChangeTime: { type: Object },
        // Thermostat / climate
        _thermostatHistory: { type: Object },
        _roomRateOfChangeAlert: { type: Object },
        _thermostatSwipeIndex: { type: Object },
        // Weather forecasts (runtime data, not settings)
        _weatherForecasts: { type: Array },
        _weatherHourlyForecasts: { type: Array },
        _availableWeatherEntities: { type: Array },
        // Presence
        _presenceHistory: { type: Array },
        _presenceHistoryExpanded: { type: Boolean },
        // Wizard / label readiness
        _showWizard: { type: Boolean },
        _labelIdsReady: { type: Boolean },
        // Forecast / garbage card index
        _selectedForecastTab: { type: Number },
        _garbageCardIndex: { type: Number },
        // Editing state
        _editingSceneButton: { type: Object },
        _editingRoomSceneButton: { type: String },
        // Changelog
        _changelogPageIndex: { type: Number },
        // Smart suggestions
        _activeSuggestions: { type: Array },
        // Floor overview
        _floorOverviewIndex: { type: Object },
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
      // Memoization cache for enabled maps (recomputed only when inputs change)
      this._cachedEnabledMaps = null;
      this._cachedEnabledMapsKey = null;
      this._enabledMapsVersion = 0;
      this._activeTab = "home";
      this._mediaPopupOpen = false;
      this._waterPopupOpen = false;
      this._activeMediaTab = null;
      this._lastMotionChangeTime = null;
      this._motionDetected = false;
      this._previousMotionState = null;
      this._expandedAreas = {};
      this._popupRoom = null;
      this._popupCoverExpanded = false;
      this._popupGarageExpanded = false;
      this._popupLightExpanded = true;
      this._popupLockExpanded = true;
      this._popupMediaExpanded = true;
      this._popupThermostatExpanded = true;
      this._popupRoofWindowExpanded = true;
      this._popupDevicesExpanded = true;
      this._popupTVExpanded = true;
      this._adminSubTab = "labels";  // Start with Labels tab for initial setup
      this._settingsError = null;  // Error message if settings fail to load
      this._saveDebounceTimer = null;
      this._labelIdsReady = false;
      this._expandedCustomLabels = {};  // Track which custom label sections are expanded in admin
      this._activeCustomLabelTab = null;  // Active tab in Other Entities section
      this._activeFloorTab = null;
      this._activeSecurityTab = 'windows';
      this._securityPopupOpen = false;
      this._lightsPopupOpen = false;
      this._coversPopupOpen = false;
      this._tvsPopupOpen = false;
      this._batteryPopupOpen = false;
      this._userPopupOpen = false;
      this._presenceHistory = [];
      this._presenceHistoryExpanded = false;
      this._adminPopupOpen = false;
      this._showWizard = false;
      this._weatherPopupOpen = false;
      this._selectedForecastTab = 0;
      this._weatherForecasts = [];
      this._weatherHourlyForecasts = [];
      this._availableWeatherEntities = [];
      this._openEntityDropdown = null;
      this._selectedFloorCardSlot = null;
      this._floorCardSearchState = {};
      this._floorOverviewIndex = {};
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
      this._roomRateOfChangeAlert = null;
      // Search state for info text entity pickers
      this._infoTextSearchQuery = {};
      this._infoTextSearchFocused = {};
      // Scene buttons configuration
      this._sceneButtonSearchQuery = '';
      this._sceneButtonSearchFocused = false;
      this._editingSceneButton = null;
      this._iconSearchQuery = '';
      this._iconSearchFocused = false;
      // Room-specific scene buttons
      this._editingRoomSceneButton = null;
      this._roomSceneIconSearchQuery = '';
      this._roomSceneIconSearchFocused = false;
      this._roomSceneEntitySearchQuery = '';
      this._roomSceneEntitySearchFocused = false;
      // Media presets (playlists)
      this._mediaPresetSearchQuery = '';
      this._mediaPresetSearchFocused = false;
      // Train departures configuration
      this._trainSearchQuery = '';
      this._trainSearchFocused = false;
      // Entity search within rooms (not persisted)
      this._entitySearchTermsByRoom = {};
      this._entitySearchDebounceTimers = {};
      // Thermostat swipe index per room
      this._thermostatSwipeIndex = {};
      // Smart suggestions
      this._activeSuggestions = [];
      // Changelog popup state
      this._changelogPopupOpen = false;
      this._changelogPageIndex = 0;
      // Request registry for aborting in-flight requests on unmount
      if (coreUtils?.createRequestRegistry) {
        this._requestRegistry = coreUtils.createRequestRegistry();
      } else {
        this._requestRegistry = null;
        debugLog('Request registry unavailable - fetch abort on unmount disabled');
      }
    }

    // ============================================
    // Store-delegating getters (replaces duplicated properties)
    // ============================================

    // Registry data (from registryStore)
    get _areas() { return registryStore?.areas || []; }
    get _floors() { return registryStore?.floors || []; }
    get _labels() { return registryStore?.labels || []; }
    get _entityRegistry() { return registryStore?.entityRegistry || []; }
    get _deviceRegistry() { return registryStore?.deviceRegistry || []; }
    get _scenes() { return registryStore?.scenes || []; }

    // Settings data (from settingsStore)
    get _enabledRooms() { return settingsStore?.get('enabledRooms') || {}; }
    get _enabledLights() { return settingsStore?.get('enabledLights') || {}; }
    get _enabledMotionSensors() { return settingsStore?.get('enabledMotionSensors') || {}; }
    get _enabledSmokeSensors() { return settingsStore?.get('enabledSmokeSensors') || {}; }
    get _enabledCovers() { return settingsStore?.get('enabledCovers') || {}; }
    get _enabledFans() { return settingsStore?.get('enabledFans') || {}; }
    get _coverInvertPosition() { return settingsStore?.get('coverInvertPosition') || {}; }
    get _enabledGarages() { return settingsStore?.get('enabledGarages') || {}; }
    get _enabledWindows() { return settingsStore?.get('enabledWindows') || {}; }
    get _enabledDoors() { return settingsStore?.get('enabledDoors') || {}; }
    get _enabledVibrationSensors() { return settingsStore?.get('enabledVibrationSensors') || {}; }
    get _enabledTemperatureSensors() { return settingsStore?.get('enabledTemperatureSensors') || {}; }
    get _enabledHumiditySensors() { return settingsStore?.get('enabledHumiditySensors') || {}; }
    get _enabledClimates() { return settingsStore?.get('enabledClimates') || {}; }
    get _enabledMediaPlayers() { return settingsStore?.get('enabledMediaPlayers') || {}; }
    get _enabledTVs() { return settingsStore?.get('enabledTVs') || {}; }
    get _enabledLocks() { return settingsStore?.get('enabledLocks') || {}; }
    get _enabledRoofWindows() { return settingsStore?.get('enabledRoofWindows') || {}; }
    get _enabledWaterLeakSensors() { return settingsStore?.get('enabledWaterLeakSensors') || {}; }
    get _enabledAppliances() { return settingsStore?.get('enabledAppliances') || {}; }
    get _enabledCustomEntities() { return settingsStore?.get('enabledCustomEntities') || {}; }

    // Threshold settings
    get _notificationTempThreshold() { return settingsStore?.get('notificationTempThreshold') ?? 23; }
    get _notificationHumidityThreshold() { return settingsStore?.get('notificationHumidityThreshold') ?? 60; }
    get _tempRapidChangeThreshold() { return settingsStore?.get('tempRapidChangeThreshold') ?? 5; }
    get _tempRapidChangeWindowMinutes() { return settingsStore?.get('tempRapidChangeWindowMinutes') ?? 60; }
    get _humidityRapidChangeThreshold() { return settingsStore?.get('humidityRapidChangeThreshold') ?? 20; }
    get _humidityRapidChangeWindowMinutes() { return settingsStore?.get('humidityRapidChangeWindowMinutes') ?? 30; }
    get _doorOpenTooLongMinutes() { return settingsStore?.get('doorOpenTooLongMinutes') ?? 30; }
    get _windowOpenTooLongMinutes() { return settingsStore?.get('windowOpenTooLongMinutes') ?? 120; }
    get _garageOpenTooLongMinutes() { return settingsStore?.get('garageOpenTooLongMinutes') ?? 30; }
    get _roofWindowOpenTooLongMinutes() { return settingsStore?.get('roofWindowOpenTooLongMinutes') ?? 120; }
    get _coverOpenTooLongMinutes() { return settingsStore?.get('coverOpenTooLongMinutes') ?? 240; }
    get _lockUnlockedTooLongMinutes() { return settingsStore?.get('lockUnlockedTooLongMinutes') ?? 30; }

    // Weather entity settings
    get _weatherEntity() { return settingsStore?.get('weatherEntity') || ''; }
    get _weatherCurrentTempEntity() { return settingsStore?.get('weatherCurrentTempEntity') || ''; }
    get _weatherCurrentStateEntity() { return settingsStore?.get('weatherCurrentStateEntity') || ''; }
    get _weatherTodayTempEntity() { return settingsStore?.get('weatherTodayTempEntity') || ''; }
    get _weatherTodayStateEntity() { return settingsStore?.get('weatherTodayStateEntity') || ''; }
    get _weatherTomorrowTempEntity() { return settingsStore?.get('weatherTomorrowTempEntity') || ''; }
    get _weatherTomorrowStateEntity() { return settingsStore?.get('weatherTomorrowStateEntity') || ''; }
    get _weatherDay2TempEntity() { return settingsStore?.get('weatherDay2TempEntity') || ''; }
    get _weatherDay2StateEntity() { return settingsStore?.get('weatherDay2StateEntity') || ''; }
    get _weatherPrecipitationEntity() { return settingsStore?.get('weatherPrecipitationEntity') || ''; }
    get _hourlyForecastEntity() { return settingsStore?.get('hourlyForecastEntity') || ''; }
    get _dwdWarningEntity() { return settingsStore?.get('dwdWarningEntity') || ''; }
    get _alarmEntity() { return settingsStore?.get('alarmEntity') || ''; }
    get _weatherRadarLat() { return settingsStore?.get('weatherRadarLat') ?? 50.0; }
    get _weatherRadarLon() { return settingsStore?.get('weatherRadarLon') ?? 8.7; }
    get _weatherRadarZoom() { return settingsStore?.get('weatherRadarZoom') ?? 9; }
    get _weatherRadarTempUnit() { return settingsStore?.get('weatherRadarTempUnit') || '°C'; }
    get _weatherRadarWindUnit() { return settingsStore?.get('weatherRadarWindUnit') || 'km/h'; }

    // Other settings
    get _floorOrder() { return settingsStore?.get('floorOrder') || []; }
    get _roomOrder() { return settingsStore?.get('roomOrder') || {}; }
    get _floorCardConfig() { return settingsStore?.get('floorCardConfig') || {}; }
    get _floorOverviewEnabled() { return settingsStore?.get('floorOverviewEnabled') || {}; }
    get _garbageSensors() { return settingsStore?.get('garbageSensors') || []; }
    get _garbageDisplayFloor() { return settingsStore?.get('garbageDisplayFloor') || null; }
    get _infoTextConfig() {
      const defaults = {
        motion: { enabled: true },
        garage: { enabled: true },
        doors: { enabled: false },
        roofWindows: { enabled: false },
        locks: { enabled: false },
        washer: { enabled: true, entity: '', finishTimeEntity: '' },
        windows: { enabled: false },
        lights: { enabled: false },
        covers: { enabled: false },
        water: { enabled: false },
        smoke: { enabled: false },
        dishwasher: { enabled: false, entity: '', finishTimeEntity: '' },
        dryer: { enabled: false, entity: '', finishTimeEntity: '' },
        vacuum: { enabled: false, entity: '', roomMapping: {} },
        batteryLow: { enabled: false, threshold: 20 },
      };
      return { ...defaults, ...settingsStore?.get('infoTextConfig') };
    }
    get _sceneButtons() { return settingsStore?.get('sceneButtons') || []; }
    get _roomSceneButtons() { return settingsStore?.get('roomSceneButtons') || {}; }
    get _customLabels() { return settingsStore?.get('customLabels') || {}; }
    get _trainDepartures() { return settingsStore?.get('trainDepartures') || []; }
    get _mediaPresets() { return settingsStore?.get('mediaPresets') || []; }
    get _userPhotos() { return settingsStore?.get('userPhotos') || {}; }
    get _manualLanguage() { return settingsStore?.get('manualLanguage') || null; }
    get _lastSeenVersion() { return settingsStore?.get('lastSeenVersion') || null; }

    // Category label IDs (derived from settings)
    get _lightLabelId() { return settingsStore?.get('categoryLabels')?.light ?? null; }
    get _coverLabelId() { return settingsStore?.get('categoryLabels')?.cover ?? null; }
    get _fanLabelId() { return settingsStore?.get('categoryLabels')?.fan ?? null; }
    get _roofWindowLabelId() { return settingsStore?.get('categoryLabels')?.roofWindow ?? null; }
    get _windowLabelId() { return settingsStore?.get('categoryLabels')?.window ?? null; }
    get _doorLabelId() { return settingsStore?.get('categoryLabels')?.door ?? null; }
    get _garageLabelId() { return settingsStore?.get('categoryLabels')?.garage ?? null; }
    get _motionLabelId() { return settingsStore?.get('categoryLabels')?.motion ?? null; }
    get _smokeLabelId() { return settingsStore?.get('categoryLabels')?.smoke ?? null; }
    get _vibrationLabelId() { return settingsStore?.get('categoryLabels')?.vibration ?? null; }
    get _temperatureLabelId() { return settingsStore?.get('categoryLabels')?.temperature ?? null; }
    get _humidityLabelId() { return settingsStore?.get('categoryLabels')?.humidity ?? null; }
    get _climateLabelId() { return settingsStore?.get('categoryLabels')?.climate ?? null; }
    get _mediaPlayerLabelId() { return settingsStore?.get('categoryLabels')?.mediaPlayer ?? null; }
    get _tvLabelId() { return settingsStore?.get('categoryLabels')?.tv ?? null; }
    get _lockLabelId() { return settingsStore?.get('categoryLabels')?.lock ?? null; }
    get _waterLeakLabelId() { return settingsStore?.get('categoryLabels')?.waterLeak ?? null; }

    get _settingsLoaded() { return settingsStore?.loaded || false; }

    // Setters for properties that are written to
    set _enabledRooms(v) { settingsStore?.set('enabledRooms', v, false); }
    set _enabledLights(v) { settingsStore?.set('enabledLights', v, false); }
    set _enabledMotionSensors(v) { settingsStore?.set('enabledMotionSensors', v, false); }
    set _enabledSmokeSensors(v) { settingsStore?.set('enabledSmokeSensors', v, false); }
    set _enabledCovers(v) { settingsStore?.set('enabledCovers', v, false); }
    set _enabledFans(v) { settingsStore?.set('enabledFans', v, false); }
    set _coverInvertPosition(v) { settingsStore?.set('coverInvertPosition', v, false); }
    set _enabledGarages(v) { settingsStore?.set('enabledGarages', v, false); }
    set _enabledWindows(v) { settingsStore?.set('enabledWindows', v, false); }
    set _enabledDoors(v) { settingsStore?.set('enabledDoors', v, false); }
    set _enabledVibrationSensors(v) { settingsStore?.set('enabledVibrationSensors', v, false); }
    set _enabledTemperatureSensors(v) { settingsStore?.set('enabledTemperatureSensors', v, false); }
    set _enabledHumiditySensors(v) { settingsStore?.set('enabledHumiditySensors', v, false); }
    set _enabledClimates(v) { settingsStore?.set('enabledClimates', v, false); }
    set _enabledMediaPlayers(v) { settingsStore?.set('enabledMediaPlayers', v, false); }
    set _enabledTVs(v) { settingsStore?.set('enabledTVs', v, false); }
    set _enabledLocks(v) { settingsStore?.set('enabledLocks', v, false); }
    set _enabledRoofWindows(v) { settingsStore?.set('enabledRoofWindows', v, false); }
    set _enabledWaterLeakSensors(v) { settingsStore?.set('enabledWaterLeakSensors', v, false); }
    set _enabledAppliances(v) { settingsStore?.set('enabledAppliances', v, false); }
    set _enabledCustomEntities(v) { settingsStore?.set('enabledCustomEntities', v, false); }
    set _notificationTempThreshold(v) { settingsStore?.set('notificationTempThreshold', v, false); }
    set _notificationHumidityThreshold(v) { settingsStore?.set('notificationHumidityThreshold', v, false); }
    set _tempRapidChangeThreshold(v) { settingsStore?.set('tempRapidChangeThreshold', v, false); }
    set _tempRapidChangeWindowMinutes(v) { settingsStore?.set('tempRapidChangeWindowMinutes', v, false); }
    set _humidityRapidChangeThreshold(v) { settingsStore?.set('humidityRapidChangeThreshold', v, false); }
    set _humidityRapidChangeWindowMinutes(v) { settingsStore?.set('humidityRapidChangeWindowMinutes', v, false); }
    set _doorOpenTooLongMinutes(v) { settingsStore?.set('doorOpenTooLongMinutes', v, false); }
    set _windowOpenTooLongMinutes(v) { settingsStore?.set('windowOpenTooLongMinutes', v, false); }
    set _garageOpenTooLongMinutes(v) { settingsStore?.set('garageOpenTooLongMinutes', v, false); }
    set _roofWindowOpenTooLongMinutes(v) { settingsStore?.set('roofWindowOpenTooLongMinutes', v, false); }
    set _coverOpenTooLongMinutes(v) { settingsStore?.set('coverOpenTooLongMinutes', v, false); }
    set _lockUnlockedTooLongMinutes(v) { settingsStore?.set('lockUnlockedTooLongMinutes', v, false); }

    /**
     * Dispatch a dashview-error event for centralized error handling
     * @param {string} source - Error source identifier
     * @param {string|null} entityId - Optional entity ID for context
     * @param {Error} error - The error that occurred
     */
    _dispatchErrorEvent(source, entityId, error) {
      document.dispatchEvent(new CustomEvent('dashview-error', {
        bubbles: true,
        composed: true,
        detail: {
          source,
          entityId,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack
          },
          timestamp: Date.now()
        }
      }));
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

      // Subscribe to store changes with rAF batching to coalesce multiple
      // store updates in the same tick into a single render cycle
      this._pendingStoreUpdate = false;
      const batchedUpdate = () => {
        if (!this._pendingStoreUpdate) {
          this._pendingStoreUpdate = true;
          requestAnimationFrame(() => {
            this._pendingStoreUpdate = false;
            this.requestUpdate();
          });
        }
      };
      if (settingsStore) {
        this._unsubscribeSettings = settingsStore.subscribe(batchedUpdate);
      }
      if (uiStateStore) {
        this._unsubscribeUIState = uiStateStore.subscribe(batchedUpdate);
      }
      if (registryStore) {
        this._unsubscribeRegistry = registryStore.subscribe(batchedUpdate);
      }

      // Centralized error event listener for debugging and monitoring
      this._errorEventHandler = (e) => {
        const { source, entityId, error, timestamp } = e.detail;
        console.warn(`[Dashview Error] Source: ${source}`, {
          entityId,
          message: error?.message,
          timestamp: new Date(timestamp).toISOString()
        });
        // Track recent errors for debugging (keep last 10)
        if (!this._recentErrors) this._recentErrors = [];
        this._recentErrors.unshift({ source, entityId, error, timestamp });
        if (this._recentErrors.length > 10) this._recentErrors.pop();
      };
      document.addEventListener('dashview-error', this._errorEventHandler);
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
      // Remove error event listener
      if (this._errorEventHandler) {
        document.removeEventListener('dashview-error', this._errorEventHandler);
        this._errorEventHandler = null;
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
      // Abort any in-flight fetch requests to prevent stale state updates
      if (this._requestRegistry) {
        this._requestRegistry.abortAll();
      }
      // Cleanup light slider drag listeners (fix memory leak #73)
      if (coreUtils?.cleanupDragListeners) {
        coreUtils.cleanupDragListeners(this);
      }
    }

    _saveSettings() {
      if (coreUtils) {
        coreUtils.saveSettings(this, settingsStore, debugLog);
      }
    }

    /**
     * Generic threshold change handler — validates and persists a numeric input
     * @param {string} propertyName - The reactive property to update (e.g., '_notificationTempThreshold')
     * @param {number} min - Minimum allowed value
     * @param {number} max - Maximum allowed value
     * @param {Event} e - Input change event
     */
    _handleThresholdChange(propertyName, min, max, e) {
      const value = parseInt(e.target.value, 10);
      if (!isNaN(value) && value >= min && value <= max) {
        this[propertyName] = value;
        this._saveSettings();
        this.requestUpdate();
      }
    }

    // Threshold change handlers — delegate to generic _handleThresholdChange
    _handleTempThresholdChange(e) { this._handleThresholdChange('_notificationTempThreshold', 0, 50, e); }
    _handleHumidityThresholdChange(e) { this._handleThresholdChange('_notificationHumidityThreshold', 0, 100, e); }
    _handleTempRapidChangeThresholdChange(e) { this._handleThresholdChange('_tempRapidChangeThreshold', 1, 20, e); }
    _handleTempRapidChangeWindowChange(e) { this._handleThresholdChange('_tempRapidChangeWindowMinutes', 15, 180, e); }
    _handleHumidityRapidChangeThresholdChange(e) { this._handleThresholdChange('_humidityRapidChangeThreshold', 5, 50, e); }
    _handleHumidityRapidChangeWindowChange(e) { this._handleThresholdChange('_humidityRapidChangeWindowMinutes', 10, 120, e); }
    _handleDoorOpenTooLongChange(e) { this._handleThresholdChange('_doorOpenTooLongMinutes', 5, 1440, e); }
    _handleWindowOpenTooLongChange(e) { this._handleThresholdChange('_windowOpenTooLongMinutes', 5, 1440, e); }
    _handleGarageOpenTooLongChange(e) { this._handleThresholdChange('_garageOpenTooLongMinutes', 5, 1440, e); }
    _handleRoofWindowOpenTooLongChange(e) { this._handleThresholdChange('_roofWindowOpenTooLongMinutes', 5, 1440, e); }
    _handleCoverOpenTooLongChange(e) { this._handleThresholdChange('_coverOpenTooLongMinutes', 5, 1440, e); }
    _handleLockUnlockedTooLongChange(e) { this._handleThresholdChange('_lockUnlockedTooLongMinutes', 5, 1440, e); }

    // ============================================
    // Smart Suggestions
    // ============================================

    /**
     * Evaluate and update active suggestions based on current state
     */
    _updateSuggestions() {
      if (!suggestionEngine || !this.hass) {
        this._activeSuggestions = [];
        return;
      }
      const context = {
        enabledMaps: {
          enabledLights: this._enabledLights,
          enabledClimates: this._enabledClimates,
          enabledWindows: this._enabledWindows,
        },
        labelIds: {
          light: this._lightLabelId,
          climate: this._climateLabelId,
          window: this._windowLabelId,
        },
        entityHasLabel: (entityId, labelId) => this._entityHasCurrentLabel(entityId, labelId),
        getAreaIdForEntity: (entityId) => this._getAreaIdForEntity(entityId),
      };
      this._activeSuggestions = suggestionEngine.evaluateSuggestions(this.hass, context);
    }

    /**
     * Handle user clicking a suggestion action button
     * @param {Object} suggestion - Suggestion object from the engine
     */
    _handleSuggestionAction(suggestion) {
      if (!suggestion?.actionData) return;
      const { actionType, actionData } = suggestion;

      if (actionType === 'service' && actionData.domain && actionData.service) {
        // Call HA service for each entity
        (actionData.entityIds || []).forEach(entityId => {
          this.hass.callService(actionData.domain, actionData.service, {
            entity_id: entityId,
          });
        });
      } else if (actionType === 'popup' && actionData.popup === 'lights') {
        this._lightsPopupOpen = true;
      }

      // Record the action and refresh suggestions
      if (suggestionEngine) {
        suggestionEngine.recordSuggestionAction(suggestion.id);
      }
      this._updateSuggestions();
    }

    /**
     * Handle user dismissing a suggestion
     * @param {Object} suggestion - Suggestion object from the engine
     */
    _handleSuggestionDismiss(suggestion) {
      if (!suggestion?.id || !suggestionEngine) return;
      // Default cooldown of 60 minutes
      suggestionEngine.dismissSuggestion(suggestion.id, 60 * 60 * 1000);
      this._updateSuggestions();
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
      // Use registry store's indexed lookup for O(1) access (Story 7.8)
      if (registryStore) {
        return registryStore.getAreaIdForEntity(entityId);
      }

      // Fallback to local arrays if registry store not available
      const entityReg = this._entityRegistry.find(e => e.entity_id === entityId);
      if (!entityReg) return null;

      if (entityReg.area_id) return entityReg.area_id;

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

      // Use registry store's indexed lookup for O(1) access (Story 7.8)
      if (registryStore) {
        const entityReg = registryStore.getEntityById(entityId);
        if (!entityReg) return false;
        return entityReg.labels && entityReg.labels.includes(labelId);
      }

      // Fallback to local arrays
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
        // Use request registry for abort handling on unmount
        const signal = this._requestRegistry?.register('load-media-presets');
        const fetchOptions = signal ? { signal } : {};
        const response = await fetch('/local/dashview/config/media_presets.json', fetchOptions);
        // Mark request complete to clean up registry
        this._requestRegistry?.complete('load-media-presets');
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
        // Gracefully handle abort errors (component unmounted)
        if (e.name === 'AbortError') {
          debugLog('Media presets fetch aborted (component unmounted)');
          return;
        }
        // Clean up registry on error
        this._requestRegistry?.complete('load-media-presets');
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
      // For security summary, store type: 'security'
      let slotData = null;
      if (entityId) {
        if (entityData && entityData.type === 'security') {
          slotData = {
            entity_id: entityId,
            type: 'security',
          };
        } else if (entityData && entityData.type === 'appliance' && entityData.appliance) {
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
        // ============================================================
        // LANGUAGE DETECTION - SINGLE SOURCE OF TRUTH
        // ============================================================
        // This is the ONLY place where language is determined for Dashview.
        // All components must use getCurrentLang() from utils/i18n.js.
        //
        // Priority:
        // 1. _manualLanguage (Admin → Settings → Language override)
        // 2. hass.language (when Admin setting is "Auto")
        // 3. 'en' (fallback for unsupported languages)
        //
        // DO NOT access hass.language directly elsewhere - see project-context.md
        // ============================================================
        if (this.hass?.language && initI18n && getCurrentLang && isI18nInitialized) {
          const rawLang = this.hass.language;
          const baseLang = rawLang.split('-')[0]; // 'de-DE' -> 'de'
          const supportedLangs = ['en', 'de'];
          // Admin setting (_manualLanguage) takes priority over HA language
          const haLang = supportedLangs.includes(baseLang) ? baseLang : 'en';
          const targetLang = this._manualLanguage || haLang;
          const currentLang = getCurrentLang();
          const alreadyInitialized = isI18nInitialized();

          // Initialize if not yet initialized OR if language changed
          if (!alreadyInitialized || targetLang !== currentLang) {
            console.log(`[Dashview] Initializing i18n: target=${targetLang}, current=${currentLang}, initialized=${alreadyInitialized}, manual=${this._manualLanguage || 'auto'}`);
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
            // Update RoomDataService with registry data (reads from store-delegating getters)
            if (roomDataService) {
              roomDataService.setEntityRegistry(this._entityRegistry);
              roomDataService.setDeviceRegistry(this._deviceRegistry);
              this._updateRoomDataServiceLabelIds();
            }
            // Mark label IDs as ready - this triggers reactive update
            this._labelIdsReady = true;
            debugLog("Registry data synced from store, labelIdsReady=true");
            this.requestUpdate();
          });
        }

        // Load settings via store (replaces _loadSettings)
        if (settingsStore && !settingsStore.loaded) {
          settingsStore.load().then(() => {
            this._settingsError = null;
            // Auto-detect alarm entity and set security tab default
            if (!this._alarmEntity && this.hass) {
              const autoAlarm = Object.keys(this.hass.states).find(id => id.startsWith('alarm_control_panel.'));
              if (autoAlarm && this._activeSecurityTab === 'windows') {
                this._activeSecurityTab = 'alarm';
              }
            } else if (this._alarmEntity && this._activeSecurityTab === 'windows') {
              this._activeSecurityTab = 'alarm';
            }
            // Check if setup wizard should be shown (first run)
            if (dashviewAdmin?.shouldShowWizard && dashviewAdmin.shouldShowWizard()) {
              this._showWizard = true;
              debugLog("First run detected, showing setup wizard");
            }
            // Check for new version and show changelog popup if needed
            this._checkForNewVersion();
            // Update RoomDataService with enabled maps (reads from store-delegating getters)
            if (roomDataService) {
              roomDataService.setEnabledMaps({
                enabledLights: this._enabledLights,
                enabledMotionSensors: this._enabledMotionSensors,
                enabledSmokeSensors: this._enabledSmokeSensors,
                enabledWaterLeakSensors: this._enabledWaterLeakSensors,
                enabledCovers: this._enabledCovers,
                coverInvertPosition: this._coverInvertPosition,
                enabledGarages: this._enabledGarages,
                enabledWindows: this._enabledWindows,
                enabledDoors: this._enabledDoors,
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
            // Invalidate enabled maps cache so it's rebuilt on next render
            this._enabledMapsVersion++;
            debugLog("Settings loaded from store");
            this.requestUpdate();
          }).catch(e => {
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
        // Evaluate smart suggestions based on current state
        this._updateSuggestions();
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
      const locale = this.hass?.language || navigator.language || 'en';
      const newTime = now.toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
      // Only trigger re-render when the displayed time actually changes
      if (newTime !== this._currentTime) {
        this._currentTime = newTime;
      }
    }

    _toggleMenu() {
      this.dispatchEvent(
        new Event("hass-toggle-menu", { bubbles: true, composed: true })
      );
    }

    _toggleLight(entityId) {
      if (!this.hass) return;
      try {
        this.hass.callService("light", "toggle", { entity_id: entityId });
      } catch (error) {
        console.warn(`[Dashview] Light toggle error:`, error.message);
        this._dispatchErrorEvent('light:toggle', entityId, error);
      }
    }

    _toggleTV(entityId) {
      if (!this.hass) return;
      try {
        this.hass.callService("media_player", "toggle", { entity_id: entityId });
      } catch (error) {
        console.warn(`[Dashview] TV toggle error:`, error.message);
        this._dispatchErrorEvent('tv:toggle', entityId, error);
      }
    }

    _turnOffAllTVs() {
      if (!this.hass) return;
      const enabledTVIds = this._getEnabledEntityIdsFromRegistry(this._tvLabelId, this._enabledTVs);
      enabledTVIds.forEach(entityId => {
        const state = this.hass.states[entityId];
        if (state?.state === 'on') {
          this.hass.callService("media_player", "turn_off", { entity_id: entityId });
        }
      });
    }

    _setTVVolume(entityId, volume) {
      if (!this.hass) return;
      try {
        this.hass.callService("media_player", "volume_set", {
          entity_id: entityId,
          volume_level: volume
        });
      } catch (error) {
        console.warn(`[Dashview] TV volume error:`, error.message);
        this._dispatchErrorEvent('tv:volume', entityId, error);
      }
    }

    _toggleLock(entityId) {
      if (!this.hass) return;
      const state = this.hass.states[entityId];
      const isLocked = state?.state === 'locked';
      try {
        this.hass.callService("lock", isLocked ? "unlock" : "lock", { entity_id: entityId });
      } catch (error) {
        console.warn(`[Dashview] Lock toggle error:`, error.message);
        this._dispatchErrorEvent('lock:toggle', entityId, error);
      }
    }

    // Generic toggle helper for enabled entity settings
    // Note: Entities are enabled by default (when not in map or undefined)
    // Only explicit false means disabled
    _toggleEntityEnabled(settingsKey, entityId) {
      const isCurrentlyEnabled = this[settingsKey][entityId] !== false;
      this[settingsKey] = { ...this[settingsKey], [entityId]: !isCurrentlyEnabled };
      this._enabledMapsVersion++;
      this._saveSettings();
      // Update roomDataService with the new enabled maps
      if (roomDataService) {
        roomDataService.setEnabledMaps({
          enabledLights: this._enabledLights,
          enabledMotionSensors: this._enabledMotionSensors,
          enabledSmokeSensors: this._enabledSmokeSensors,
          enabledWaterLeakSensors: this._enabledWaterLeakSensors,
          enabledCovers: this._enabledCovers,
          coverInvertPosition: this._coverInvertPosition,
          enabledGarages: this._enabledGarages,
          enabledWindows: this._enabledWindows,
          enabledDoors: this._enabledDoors,
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
    _toggleWaterLeakSensorEnabled(entityId) { this._toggleEntityEnabled('_enabledWaterLeakSensors', entityId); }
    _toggleCoverEnabled(entityId) { this._toggleEntityEnabled('_enabledCovers', entityId); }
    _toggleFanEnabled(entityId) { this._toggleEntityEnabled('_enabledFans', entityId); }
    _toggleCoverInvertPosition(entityId) {
      this._coverInvertPosition = { ...this._coverInvertPosition, [entityId]: !this._coverInvertPosition[entityId] };
      this._saveSettings();
    }
    _isCoverInverted(entityId) { return !!this._coverInvertPosition[entityId]; }
    _toggleGarageEnabled(entityId) { this._toggleEntityEnabled('_enabledGarages', entityId); }
    _toggleWindowEnabled(entityId) { this._toggleEntityEnabled('_enabledWindows', entityId); }
    _toggleDoorEnabled(entityId) { this._toggleEntityEnabled('_enabledDoors', entityId); }
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
          enabledWaterLeakSensors: this._enabledWaterLeakSensors,
          enabledCovers: this._enabledCovers,
          coverInvertPosition: this._coverInvertPosition,
          enabledGarages: this._enabledGarages,
          enabledWindows: this._enabledWindows,
          enabledDoors: this._enabledDoors,
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
        this._roomRateOfChangeAlert = null; // Reset alert when opening new popup
        this.requestUpdate();
        // Fetch temperature history for climate entities in this room
        this._loadThermostatHistory(areaId);
        // Fetch rate-of-change alerts for this room
        this._loadRoomRateOfChangeAlerts(areaId);
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

    /**
     * Load rate-of-change alerts for a room (async)
     * @param {string} areaId - Area ID
     */
    async _loadRoomRateOfChangeAlerts(areaId) {
      const alert = await this._getRoomRateOfChangeAlerts(areaId);
      // Only update if popup is still showing the same room (prevent race condition)
      if (alert && this._popupRoom?.area_id === areaId) {
        this._roomRateOfChangeAlert = alert;
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

      // Get windows for this room (only show when open)
      // Use roomDataService for consistency with room config (fixes #69)
      const areaWindows = roomDataService ? roomDataService.getAreaWindows(areaId) : [];
      areaWindows.forEach((window) => {
        // Skip if explicitly disabled in settings
        if (this._enabledWindows && this._enabledWindows[window.entity_id] === false) return;

        const state = this.hass.states[window.entity_id];
        if (!state) return;

        // Only show window when open
        if (state.state !== 'on') return;

        const friendlyName = state.attributes?.friendly_name || window.entity_id;
        const timeAgo = this._formatTimeAgo(state.last_changed);

        chips.push({
          type: 'window',
          entityId: window.entity_id,
          name: friendlyName,
          stateText: friendlyName,
          timeAgo,
          icon: 'mdi:window-open',
          isActive: true,
          state: state.state,
        });
      });

      // Get doors for this room (only show when open)
      this._entityRegistry.forEach((entityReg) => {
        const entityId = entityReg.entity_id;
        if (this._enabledDoors[entityId] === false) return;
        const entityAreaId = this._getAreaIdForEntity(entityId);
        if (entityAreaId !== areaId) return;
        if (!this._doorLabelId || !entityReg.labels || !entityReg.labels.includes(this._doorLabelId)) return;

        const state = this.hass.states[entityId];
        if (!state) return;

        // Only show door when open
        if (state.state !== 'on') return;

        const friendlyName = state.attributes?.friendly_name || entityId;
        const timeAgo = this._formatTimeAgo(state.last_changed);

        chips.push({
          type: 'door',
          entityId,
          name: friendlyName,
          stateText: friendlyName,
          timeAgo,
          icon: 'mdi:door-open',
          isActive: true,
          state: state.state,
        });
      });

      // Get water leak sensors for this room (show wet/dry state per AC5)
      this._entityRegistry.forEach((entityReg) => {
        const entityId = entityReg.entity_id;
        if (this._enabledWaterLeakSensors[entityId] === false) return;
        const entityAreaId = this._getAreaIdForEntity(entityId);
        if (entityAreaId !== areaId) return;
        // Filter by current water leak label (if configured)
        if (this._waterLeakLabelId && (!entityReg.labels || !entityReg.labels.includes(this._waterLeakLabelId))) return;
        // Must be a moisture sensor
        const state = this.hass.states[entityId];
        if (!state || state.attributes?.device_class !== 'moisture') return;

        const isWet = state.state === 'on';
        const friendlyName = state.attributes?.friendly_name || entityId;
        const timeAgo = this._formatTimeAgo(state.last_changed);

        chips.push({
          type: isWet ? 'water-alert' : 'water',
          entityId,
          name: friendlyName,
          stateText: isWet ? t('water.wet') : t('water.dry'),
          timeAgo,
          icon: isWet ? 'mdi:water-alert' : 'mdi:water-check',
          isActive: isWet,
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
    _togglePopupLockExpanded() { this._toggleBoolProp('_popupLockExpanded'); }
    _togglePopupThermostatExpanded() { this._toggleBoolProp('_popupThermostatExpanded'); }

    /**
     * Generic helper to get enabled entities for a room with custom attribute mapping.
     * Iterates over registry entities (not enabledMap) to support default-enabled behavior.
     * @param {string} areaId - The area/room ID to get entities for
     * @param {Object} enabledMap - Map of entity IDs to enabled state (false = disabled)
     * @param {Function} attrMapper - Function to map entity state to additional attributes
     * @param {string|null} labelId - Label ID to filter entities by
     * @param {string[]|null} excludeDomains - Domains to exclude (e.g., ['automation', 'script', 'scene'])
     * @returns {Array} Array of entity objects with mapped attributes
     */
    _getEnabledEntitiesForRoom(areaId, enabledMap, attrMapper, labelId = null, excludeDomains = null) {
      if (!this.hass || !labelId) return [];
      const entities = [];
      // Iterate over registry entities that have the label and are in the area
      this._entityRegistry.forEach(entityReg => {
        const entityId = entityReg.entity_id;
        // Check if entity has the required label
        if (!entityReg.labels || !entityReg.labels.includes(labelId)) return;
        // Filter non-device domains globally + any caller-specified exclusions
        const domain = entityId.split('.')[0];
        if (EXCLUDED_DOMAINS.includes(domain)) return;
        if (excludeDomains && excludeDomains.length > 0 && excludeDomains.includes(domain)) return;
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

    _getEnabledFansForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledFans, (s) => ({
        state: s.state,
        percentage: s.attributes?.percentage ?? null,
        preset_mode: s.attributes?.preset_mode ?? null,
        speed_count: s.attributes?.speed_count ?? null,
      }), this._fanLabelId);
    }

    _getEnabledGaragesForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledGarages, s => ({ state: s.state, last_changed: s.last_changed }), this._garageLabelId);
    }

    _getEnabledDoorsForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledDoors, s => ({ state: s.state, last_changed: s.last_changed, isOpen: s.state === 'on' }), this._doorLabelId);
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
    _handleRoofWindowSliderTouchStart(e, entityId, areaId) {
      e.preventDefault();
      this._roofWindowTouchEntityId = entityId;
      this._roofWindowTouchAreaId = areaId;
      this._roofWindowTouchSlider = e.currentTarget;
      this._roofWindowDragValue = null;
      this._roofWindowTouchSlider.classList.add('dragging');
    }
    _handleRoofWindowSliderTouchMove(e) {
      if (!this._roofWindowTouchSlider) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this._roofWindowTouchSlider.getBoundingClientRect();
      const displayPosition = Math.round(Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100)));
      this._roofWindowDragValue = 100 - displayPosition;
      this._roofWindowTouchSlider.style.setProperty('--drag-position', `${displayPosition}%`);
      const parent = this._roofWindowTouchSlider.closest('.popup-cover-header, .popup-cover-item');
      const posLabel = parent?.querySelector('.popup-cover-position');
      if (posLabel) posLabel.textContent = `${displayPosition}%`;
    }
    _handleRoofWindowSliderTouchEnd(e) {
      if (this._roofWindowTouchSlider) {
        this._roofWindowTouchSlider.classList.remove('dragging');
      }
      if (this._roofWindowDragValue !== null) {
        if (this._roofWindowTouchEntityId) {
          this._setRoofWindowPosition(this._roofWindowTouchEntityId, this._roofWindowDragValue);
        } else if (this._roofWindowTouchAreaId) {
          this._setAllRoofWindowsPosition(this._roofWindowTouchAreaId, this._roofWindowDragValue);
        }
      }
      this._roofWindowTouchEntityId = null;
      this._roofWindowTouchAreaId = null;
      this._roofWindowTouchSlider = null;
      this._roofWindowDragValue = null;
    }
    _handleAllRoofWindowsSliderClick(e, areaId) { this._setAllRoofWindowsPosition(areaId, this._getInvertedSliderPosition(e)); }

    // Cover service helpers
    _coverService(entityId, service, data = {}) {
      if (!this.hass) return;
      try {
        this.hass.callService('cover', service, { entity_id: entityId, ...data });
      } catch (error) {
        console.warn(`[Dashview] Cover service error (${service}):`, error.message);
        this._dispatchErrorEvent('cover-service', entityId, error);
      }
    }
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
    _toggleCover(entityId) {
      const state = this.hass?.states[entityId];
      if (state?.state === 'closed') {
        this._coverService(entityId, 'open_cover');
      } else {
        this._coverService(entityId, 'close_cover');
      }
    }
    _openAllCovers() {
      const enabledCoverIds = this._getEnabledEntityIdsFromRegistry(this._coverLabelId, this._enabledCovers);
      enabledCoverIds.forEach(entityId => this._coverService(entityId, 'open_cover'));
    }
    _closeAllCovers() {
      const enabledCoverIds = this._getEnabledEntityIdsFromRegistry(this._coverLabelId, this._enabledCovers);
      enabledCoverIds.forEach(entityId => this._coverService(entityId, 'close_cover'));
    }

    // Fan service methods
    _toggleFan(entityId) {
      this.hass.callService('fan', 'toggle', { entity_id: entityId });
    }
    _setFanPercentage(entityId, percentage) {
      this.hass.callService('fan', 'set_percentage', { entity_id: entityId, percentage });
    }

    _formatGarageLastChanged(lastChanged) {
      return coreUtils ? coreUtils.formatGarageLastChanged(lastChanged) : '';
    }

    _toggleAllRoomLights(areaId, turnOn) {
      const lights = this._getEnabledLightsForRoom(areaId);
      lights.forEach(l => {
        try {
          if (turnOn) {
            dashviewUtils.turnOnLight(this.hass, l.entity_id);
          } else {
            dashviewUtils.turnOffLight(this.hass, l.entity_id);
          }
        } catch (error) {
          console.warn(`[Dashview] Light toggle error:`, error.message);
          this._dispatchErrorEvent('room-popup:toggleLights', l.entity_id, error);
        }
      });
    }
    _toggleAllRoomCovers(areaId, close) { this._setAllCoversPosition(areaId, close ? 100 : 0); }
    async _lockAllRoom(areaId) {
      for (const l of this._getEnabledLocksForRoom(areaId)) {
        try {
          await this.hass.callService('lock', 'lock', { entity_id: l.entity_id });
        } catch (error) {
          console.warn(`[Dashview] Lock error:`, error.message);
          this._dispatchErrorEvent('room-popup:lockAll', l.entity_id, error);
        }
      }
    }
    async _turnOffAllRoomTVs(areaId) {
      for (const tv of this._getEnabledTVsForRoom(areaId)) {
        try {
          if (tv.state === 'on') {
            await this.hass.callService('media_player', 'turn_off', { entity_id: tv.entity_id });
          }
        } catch (error) {
          console.warn(`[Dashview] TV off error:`, error.message);
          this._dispatchErrorEvent('room-popup:tvsOff', tv.entity_id, error);
        }
      }
    }
    async _closeAllRoomGarages(areaId) {
      for (const g of this._getEnabledGaragesForRoom(areaId)) {
        try {
          if (g.state === 'open') {
            await this.hass.callService('cover', 'close_cover', { entity_id: g.entity_id });
          }
        } catch (error) {
          console.warn(`[Dashview] Garage close error:`, error.message);
          this._dispatchErrorEvent('room-popup:closeGarages', g.entity_id, error);
        }
      }
    }
    async _stopAllRoomMedia(areaId) {
      for (const mp of this._getEnabledMediaPlayersForRoom(areaId)) {
        try {
          if (mp.state === 'playing') {
            await this.hass.callService('media_player', 'media_stop', { entity_id: mp.entity_id });
          }
        } catch (error) {
          console.warn(`[Dashview] Media stop error:`, error.message);
          this._dispatchErrorEvent('room-popup:stopMedia', mp.entity_id, error);
        }
      }
    }
    _handleCoverSliderClick(e, entityId) { this._setCoverPosition(entityId, this._getInvertedSliderPosition(e)); }
    _handleAllCoversSliderClick(e, areaId) { this._setAllCoversPosition(areaId, this._getInvertedSliderPosition(e));
    }

    // Touch handlers for cover sliders (mobile support)
    // Only update visuals during drag, send position on release to prevent fighting with HA state updates
    _handleCoverSliderTouchStart(e, entityId, areaId) {
      e.preventDefault();
      this._coverTouchEntityId = entityId;
      this._coverTouchAreaId = areaId;
      this._coverTouchSlider = e.currentTarget;
      this._coverDragValue = null; // Track drag value
      this._coverTouchSlider.classList.add('dragging');
    }
    _handleCoverSliderTouchMove(e) {
      if (!this._coverTouchSlider) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this._coverTouchSlider.getBoundingClientRect();
      const displayPosition = Math.round(Math.max(0, Math.min(100, ((touch.clientX - rect.left) / rect.width) * 100)));

      // Store inverted position for the actual command (same as click handler logic)
      this._coverDragValue = 100 - displayPosition;

      // Set CSS custom property - CSS will use this with !important to override template styles
      this._coverTouchSlider.style.setProperty('--drag-position', `${displayPosition}%`);

      // Update position label
      const parent = this._coverTouchSlider.closest('.popup-cover-header, .popup-cover-item');
      const posLabel = parent?.querySelector('.popup-cover-position');
      if (posLabel) posLabel.textContent = `${displayPosition}%`;
    }
    _handleCoverSliderTouchEnd(e) {
      if (this._coverTouchSlider) {
        this._coverTouchSlider.classList.remove('dragging');
      }

      // Now send the final position
      if (this._coverDragValue !== null) {
        if (this._coverTouchEntityId) {
          this._setCoverPosition(this._coverTouchEntityId, this._coverDragValue);
        } else if (this._coverTouchAreaId) {
          this._setAllCoversPosition(this._coverTouchAreaId, this._coverDragValue);
        }
      }

      this._coverTouchEntityId = null;
      this._coverTouchAreaId = null;
      this._coverTouchSlider = null;
      this._coverDragValue = null;
    }

    _togglePopupLightExpanded() { this._toggleBoolProp('_popupLightExpanded'); }
    _togglePopupDevicesExpanded() { this._toggleBoolProp('_popupDevicesExpanded'); }
    _togglePopupTVExpanded() { this._toggleBoolProp('_popupTVExpanded'); }

    _getEnabledClimatesForRoom(areaId) {
      return this._getEnabledEntitiesForRoom(areaId, this._enabledClimates, s => ({
        state: s.state, hvacAction: s.attributes?.hvac_action,
        currentTemp: s.attributes?.current_temperature, targetTemp: s.attributes?.temperature,
      }), this._climateLabelId);
    }

    _setThermostatHvacMode(entityId, hvacMode) {
      if (!this.hass) return;
      try {
        this.hass.callService('climate', 'set_hvac_mode', {
          entity_id: entityId,
          hvac_mode: hvacMode,
        });
      } catch (error) {
        console.warn(`[Dashview] Thermostat mode error:`, error.message);
        this._dispatchErrorEvent('room-popup:thermostatMode', entityId, error);
      }
    }

    _adjustThermostatTemp(entityId, delta) {
      if (!this.hass) return;
      const state = this.hass.states[entityId];
      if (!state) return;

      const currentTarget = state.attributes?.temperature;
      if (currentTarget === undefined) return;

      const newTemp = currentTarget + delta;
      try {
        this.hass.callService('climate', 'set_temperature', {
          entity_id: entityId,
          temperature: newTemp,
        });
      } catch (error) {
        console.warn(`[Dashview] Thermostat temp error:`, error.message);
        this._dispatchErrorEvent('room-popup:thermostatTemp', entityId, error);
      }
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

        // Use timeout protection (20s for historical data)
        const timeoutMs = coreUtils?.TIMEOUT_DEFAULTS?.HISTORY_FETCH || 20000;
        const withTimeoutFn = coreUtils?.withTimeout || ((p) => p);

        const response = await withTimeoutFn(
          this.hass.callWS({
            type: 'history/history_during_period',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            entity_ids: [entityId],
            minimal_response: true,
            no_attributes: true,
          }),
          timeoutMs,
          'Temperature history fetch'
        );

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
        console.warn('[Dashview] Error fetching temperature history:', e.message);
        return [];
      }
    }

    // Humidity history cache to avoid repeated API calls
    _humidityHistoryCache = {};
    _humidityHistoryCacheTime = {};

    async _fetchHumidityHistory(entityId, hours = 24) {
      if (!this.hass || !entityId) return [];

      // Check cache (valid for 5 minutes)
      const cacheKey = `${entityId}_${hours}`;
      const now = Date.now();
      if (this._humidityHistoryCache[cacheKey] &&
          this._humidityHistoryCacheTime[cacheKey] &&
          (now - this._humidityHistoryCacheTime[cacheKey]) < 300000) {
        return this._humidityHistoryCache[cacheKey];
      }

      try {
        const endTime = new Date();
        const startTime = new Date(endTime.getTime() - hours * 60 * 60 * 1000);

        // Use timeout protection (20s for historical data)
        const timeoutMs = coreUtils?.TIMEOUT_DEFAULTS?.HISTORY_FETCH || 20000;
        const withTimeoutFn = coreUtils?.withTimeout || ((p) => p);

        const response = await withTimeoutFn(
          this.hass.callWS({
            type: 'history/history_during_period',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            entity_ids: [entityId],
            minimal_response: true,
            no_attributes: true,
          }),
          timeoutMs,
          'Humidity history fetch'
        );

        if (!response || !response[entityId]) return [];

        // Process history data into simple array of {time, value}
        const history = response[entityId]
          .filter(item => item.s !== 'unavailable' && item.s !== 'unknown' && !isNaN(parseFloat(item.s)))
          .map(item => ({
            time: new Date(item.lu * 1000).getTime(),
            value: parseFloat(item.s)
          }));

        // Cache the result
        this._humidityHistoryCache[cacheKey] = history;
        this._humidityHistoryCacheTime[cacheKey] = now;

        return history;
      } catch (e) {
        console.warn('[Dashview] Error fetching humidity history:', e.message);
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
        entityPicture: s.attributes?.entity_picture,
        mediaTitle: s.attributes?.media_title,
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
        messages.push(`${t('sensor.temperature')}: ${avg}°C`);
      }
      if (highHumidity.length > 0) {
        const avg = (highHumidity.reduce((sum, s) => sum + s.value, 0) / highHumidity.length).toFixed(1);
        messages.push(`${t('sensor.humidity')}: ${avg}%`);
      }

      return { title: t('ui.notifications.ventilate_room'), subtitle: messages.join(' · ') };
    }

    /**
     * Get rate-of-change alerts for a room (rapid temperature/humidity changes)
     * @param {string} areaId - Room/area ID
     * @returns {Promise<{title: string, subtitle: string}|null>} Alert notification or null
     */
    async _getRoomRateOfChangeAlerts(areaId) {
      if (!this.hass || !anomalyDetector) return null;

      // Get enabled sensors for this room
      const tempSensors = this._getEnabledTemperatureSensorsForRoom(areaId)
        .filter(s => s.state !== 'unavailable' && s.state !== 'unknown');
      const humiditySensors = this._getEnabledHumiditySensorsForRoom(areaId)
        .filter(s => s.state !== 'unavailable' && s.state !== 'unknown');

      if (tempSensors.length === 0 && humiditySensors.length === 0) return null;

      const alerts = [];

      // Check temperature rate-of-change for first sensor
      if (tempSensors.length > 0) {
        const tempSensor = tempSensors[0];
        try {
          // Fetch enough history to cover the window (add extra buffer)
          const windowMinutes = this._tempRapidChangeWindowMinutes || 60;
          const history = await this._fetchTemperatureHistory(tempSensor.entity_id, Math.ceil(windowMinutes / 60) + 1);

          if (history.length >= 2) {
            const anomaly = anomalyDetector.detectTemperatureAnomaly(
              history,
              this._tempRapidChangeThreshold || 5,
              windowMinutes
            );

            if (anomaly) {
              const direction = anomaly.direction === 'falling'
                ? t('climate.rapidChange.tempDropped', `Temperature dropped {{degrees}}° in {{time}}`)
                : t('climate.rapidChange.tempRose', `Temperature rose {{degrees}}° in {{time}}`);
              alerts.push(direction
                .replace('{{degrees}}', anomaly.change.toFixed(1))
                .replace('{{time}}', anomaly.formattedDuration));
            }
          }
        } catch (e) {
          console.warn('[Dashview] Error checking temperature rate-of-change:', e.message);
        }
      }

      // Check humidity rate-of-change for first sensor
      if (humiditySensors.length > 0) {
        const humiditySensor = humiditySensors[0];
        try {
          // Fetch enough history to cover the window (add extra buffer)
          const windowMinutes = this._humidityRapidChangeWindowMinutes || 30;
          const history = await this._fetchHumidityHistory(humiditySensor.entity_id, Math.ceil(windowMinutes / 60) + 1);

          if (history.length >= 2) {
            const anomaly = anomalyDetector.detectHumidityAnomaly(
              history,
              this._humidityRapidChangeThreshold || 20,
              windowMinutes
            );

            if (anomaly) {
              const direction = anomaly.direction === 'falling'
                ? t('climate.rapidChange.humidityDropped', `Humidity dropped {{percent}}% in {{time}}`)
                : t('climate.rapidChange.humidityRose', `Humidity rose {{percent}}% in {{time}}`);
              alerts.push(direction
                .replace('{{percent}}', anomaly.change.toFixed(0))
                .replace('{{time}}', anomaly.formattedDuration));
            }
          }
        } catch (e) {
          console.warn('[Dashview] Error checking humidity rate-of-change:', e.message);
        }
      }

      if (alerts.length === 0) return null;

      return {
        title: t('climate.rapidChange.title', 'Rapid Climate Change'),
        subtitle: alerts.join(' · ')
      };
    }

    async _setLightBrightness(entityId, brightnessPercent, onError = null) {
      if (!this.hass) return false;
      try {
        await this.hass.callService('light', 'turn_on', {
          entity_id: entityId,
          brightness_pct: brightnessPercent,
        });
        return true;
      } catch (error) {
        console.warn(`[Dashview] Light brightness error:`, error.message);
        this._dispatchErrorEvent('light-slider:brightness', entityId, error);
        if (onError) onError(error);
        return false;
      }
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
    // Delegates to core/events.js which uses AbortController for guaranteed cleanup (#73)
    _handleLightSliderMouseDown(e, entityId) {
      if (coreUtils?.handleLightSliderMouseDown) {
        coreUtils.handleLightSliderMouseDown(this, e, entityId, this._setLightBrightness.bind(this));
      }
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

    /**
     * Returns the alarm-specific CSS badge class for a given state.
     * Alarm classes take precedence over generic warning/critical styling.
     * @param {string} state - The alarm state (disarmed, armed_home, etc.)
     * @returns {string} CSS class name or empty string
     */
    _getAlarmBadgeClass(state) {
      const alarmClasses = {
        disarmed: 'alarm-disarmed',
        armed_home: 'alarm-armed-home',
        armed_away: 'alarm-armed-away',
        armed_night: 'alarm-armed-night',
        arming: 'alarm-arming',
        pending: 'alarm-pending',
      };
      return alarmClasses[state] || '';
    }

    _handleInfoTextClick(action) {
      if (action === 'security') this._openPopup('_securityPopupOpen');
      else if (action === 'lights') this._openPopup('_lightsPopupOpen');
      else if (action === 'covers') this._openPopup('_coversPopupOpen');
      else if (action === 'tvs') this._openPopup('_tvsPopupOpen');
      else if (action === 'battery') this._openPopup('_batteryPopupOpen');
      else if (action === 'water') this._openPopup('_waterPopupOpen');
      else if (action === 'motion') {
        this._activeSecurityTab = 'motion';
        this._openPopup('_securityPopupOpen');
      } else if (action === 'garage') {
        this._activeSecurityTab = 'garage';
        this._openPopup('_securityPopupOpen');
      } else if (action?.startsWith('entity:')) {
        // Open more-info dialog for specific entity
        const entityId = action.substring(7);
        this._showMoreInfo(entityId);
      }
    }

    /**
     * Dismiss a warning alert from the status bar
     * @param {Object} status - Status object with alertId and entityLastChanged
     */
    _dismissAlert(status) {
      if (!uiStateStore || !status.alertId) return;
      uiStateStore.dismissAlert(status.alertId, status.entityLastChanged);
      this.requestUpdate();
    }

    /**
     * Show all alerts by clearing dismissed state
     */
    _showAllAlerts() {
      if (!uiStateStore) return;
      uiStateStore.clearDismissedAlerts();
      this.requestUpdate();
    }

    _closeLightsPopup() { this._closePopup('_lightsPopupOpen'); }
    _handleLightsPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeLightsPopup()); }

    _closeCoversPopup() { this._closePopup('_coversPopupOpen'); }
    _handleCoversPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeCoversPopup()); }

    _closeTVsPopup() { this._closePopup('_tvsPopupOpen'); }
    _handleTVsPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeTVsPopup()); }

    _closeBatteryPopup() { this._closePopup('_batteryPopupOpen'); }
    _handleBatteryPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeBatteryPopup()); }

    _closeWaterPopup() { this._closePopup('_waterPopupOpen'); }
    _handleWaterPopupOverlayClick(e) { this._handlePopupOverlay(e, () => this._closeWaterPopup()); }

    // User popup methods
    _openUserPopup() {
      this._closeAllPopups();
      this._userPopupOpen = true;
      this._presenceHistoryExpanded = false;
      this._fetchPresenceHistory();
      this.requestUpdate();
    }

    _closeUserPopup() {
      this._userPopupOpen = false;
      this._presenceHistory = [];
      this.requestUpdate();
    }

    _handleUserPopupOverlayClick(e) {
      this._handlePopupOverlay(e, () => this._closeUserPopup());
    }

    _togglePresenceHistoryExpanded() {
      this._presenceHistoryExpanded = !this._presenceHistoryExpanded;
      this.requestUpdate();
    }

    /**
     * Get extended user data for the popup
     */
    _getUserPopupData() {
      if (!this.hass) return null;

      const currentUserId = this.hass.user?.id;
      let person = null;

      if (currentUserId) {
        person = Object.values(this.hass.states).find(
          (e) => e.entity_id.startsWith("person.") && e.attributes.user_id === currentUserId
        );
      }

      if (!person) {
        person = Object.values(this.hass.states).find((e) =>
          e.entity_id.startsWith("person.")
        );
      }

      if (person) {
        const customPhoto = this._userPhotos?.[person.entity_id];
        return {
          entityId: person.entity_id,
          name: person.attributes.friendly_name || person.entity_id,
          state: person.state,
          picture: customPhoto || person.attributes.entity_picture,
          lastChanged: person.last_changed,
        };
      }
      return null;
    }

    /**
     * Fetch presence history from Home Assistant
     */
    async _fetchPresenceHistory() {
      if (!this.hass) return;

      const person = this._getUserPopupData();
      if (!person) return;

      try {
        // Get history for the last 7 days
        const endTime = new Date();
        const startTime = new Date();
        startTime.setDate(startTime.getDate() - 7);

        // Use timeout protection (20s for historical data)
        const timeoutMs = coreUtils?.TIMEOUT_DEFAULTS?.HISTORY_FETCH || 20000;
        const withTimeoutFn = coreUtils?.withTimeout || ((p) => p);

        const history = await withTimeoutFn(
          this.hass.callWS({
            type: 'history/history_during_period',
            start_time: startTime.toISOString(),
            end_time: endTime.toISOString(),
            entity_ids: [person.entityId],
            minimal_response: true,
            significant_changes_only: true,
          }),
          timeoutMs,
          'Presence history fetch'
        );

        if (history && history[person.entityId]) {
          // Process history to get state changes
          const states = history[person.entityId];
          const changes = [];
          let lastState = null;

          for (const state of states) {
            // Capture all zone states (home, not_home, work, school, etc.)
            // Skip unavailable/unknown states
            if (state.s !== lastState && state.s && state.s !== 'unavailable' && state.s !== 'unknown') {
              changes.push({
                state: state.s,
                last_changed: state.lu ? new Date(state.lu * 1000).toISOString() : state.lc,
              });
              lastState = state.s;
            }
          }

          // Reverse to show most recent first and limit to 10 items
          this._presenceHistory = changes.reverse().slice(0, 10);
          this.requestUpdate();
        }
      } catch (error) {
        console.warn('Dashview: Failed to fetch presence history', error);
        this._presenceHistory = [];
      }
    }

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

    _getAreaWaterLeakSensors(areaId) {
      return roomDataService ? roomDataService.getAreaWaterLeakSensors(areaId) : [];
    }

    _getAreaCovers(areaId) {
      return roomDataService ? roomDataService.getAreaCovers(areaId) : [];
    }

    _getAreaFans(areaId) {
      return roomDataService ? roomDataService.getAreaFans(areaId) : [];
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
     * Build an enabled map from the registry for entities not explicitly disabled and allocated to a room
     * Uses sparse map pattern: missing/undefined = enabled, false = disabled
     * @param {string} labelId - Label ID to filter by
     * @param {Object} existingMap - Existing enabled map (sparse: only configured entries exist)
     * @returns {Object} Map of entityId -> boolean
     */
    _buildEnabledMapFromRegistry(labelId, existingMap) {
      if (!labelId) {
        return existingMap || {};
      }
      const map = {};
      this._entityRegistry.forEach(e => {
        if (e.labels && e.labels.includes(labelId)) {
          // Skip non-device domains (automations, scripts, scenes)
          const domain = e.entity_id.split('.')[0];
          if (EXCLUDED_DOMAINS.includes(domain)) return;
          // Skip explicitly disabled entities (false), include all others (undefined/true)
          if ((existingMap || {})[e.entity_id] === false) return;
          // Skip entities not allocated to a room
          const areaId = this._getAreaIdForEntity(e.entity_id);
          if (!areaId) return;
          map[e.entity_id] = true;
        }
      });
      return map;
    }

    /**
     * Get all enabled entity IDs from the registry for a given label
     * Uses opt-out model: entities are enabled unless explicitly disabled (set to false)
     * @param {string} labelId - Label ID to filter by
     * @param {Object} enabledMap - Map of entityId -> enabled state
     * @returns {Array<string>} Array of enabled entity IDs
     */
    _getEnabledEntityIdsFromRegistry(labelId, enabledMap) {
      if (!labelId) return [];
      const filtered = [];
      this._entityRegistry.forEach(e => {
        if (e.labels && e.labels.includes(labelId)) {
          // Skip non-device domains (automations, scripts, scenes)
          const domain = e.entity_id.split('.')[0];
          if (EXCLUDED_DOMAINS.includes(domain)) return;
          // Skip only explicitly disabled entities (enabled by default)
          if (enabledMap[e.entity_id] === false) return;
          filtered.push(e.entity_id);
        }
      });
      return filtered;
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
        this._doorLabelId,
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
      if (this._doorLabelId) labelIds.add(this._doorLabelId);
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

    // Touch handlers for media volume slider (mobile support)
    _handleMediaVolumeSliderTouchStart(e, entityId) {
      e.preventDefault();
      this._mediaVolumeTouchEntityId = entityId;
      this._mediaVolumeTouchSlider = e.currentTarget;
      this._handleMediaVolumeSliderTouchMove(e, entityId);
    }
    _handleMediaVolumeSliderTouchMove(e, entityId) {
      if (!this._mediaVolumeTouchSlider) return;
      e.preventDefault();
      const touch = e.touches[0];
      const rect = this._mediaVolumeTouchSlider.getBoundingClientRect();
      const volume = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
      this._mediaCallService(this._mediaVolumeTouchEntityId || entityId, 'volume_set', { volume_level: volume });
    }
    _handleMediaVolumeSliderTouchEnd(e) {
      this._mediaVolumeTouchEntityId = null;
      this._mediaVolumeTouchSlider = null;
    }

    _getEntityCounts() {
      if (!this.hass) return { total: 0, lights: 0, switches: 0, sensors: 0, unavailable: 0, lightsOn: 0, enabledLights: 0, totalLabeledLights: 0 };

      const states = Object.values(this.hass.states);
      // Filter enabled lights by current label (iterate over registry for default-enabled)
      const enabledLightIds = this._entityRegistry
        .filter((entityReg) => {
          const entityId = entityReg.entity_id;
          if (this._enabledLights[entityId] === false) return false;
          // Only count lights that have the currently selected light label
          if (!this._lightLabelId || !entityReg.labels || !entityReg.labels.includes(this._lightLabelId)) return false;
          // Exclude non-device domains
          const domain = entityId.split('.')[0];
          if (EXCLUDED_DOMAINS.includes(domain)) return false;
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
      return coreUtils ? coreUtils.formatDate(this.hass?.language) : '';
    }

    _setTab(tab) {
      if (dashviewUtils?.triggerHaptic) dashviewUtils.triggerHaptic('light');
      this._closeAllPopups();
      this._activeTab = tab;
    }

    _closeAllPopups() {
      this._securityPopupOpen = false;
      this._lightsPopupOpen = false;
      this._coversPopupOpen = false;
      this._tvsPopupOpen = false;
      this._batteryPopupOpen = false;
      this._waterPopupOpen = false;
      this._userPopupOpen = false;
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

    /**
     * Get memoized enabled maps — only recomputed when entity registry or label/enabled inputs change
     */
    _getCachedEnabledMaps() {
      const key = [
        this._enabledMapsVersion,
        this._entityRegistry?.length,
        this._motionLabelId, this._garageLabelId, this._windowLabelId,
        this._roofWindowLabelId, this._doorLabelId, this._lightLabelId,
        this._coverLabelId, this._tvLabelId, this._lockLabelId,
        this._waterLeakLabelId, this._smokeLabelId,
      ].join('|');
      if (key === this._cachedEnabledMapsKey && this._cachedEnabledMaps) {
        return this._cachedEnabledMaps;
      }
      this._cachedEnabledMapsKey = key;
      this._cachedEnabledMaps = {
        enabledMotionSensors: this._buildEnabledMapFromRegistry(this._motionLabelId, this._enabledMotionSensors),
        enabledGarages: this._buildEnabledMapFromRegistry(this._garageLabelId, this._enabledGarages),
        enabledWindows: this._buildEnabledMapFromRegistry(this._windowLabelId, this._enabledWindows),
        enabledRoofWindows: this._buildEnabledMapFromRegistry(this._roofWindowLabelId, this._enabledRoofWindows),
        enabledDoors: this._buildEnabledMapFromRegistry(this._doorLabelId, this._enabledDoors),
        enabledLights: this._buildEnabledMapFromRegistry(this._lightLabelId, this._enabledLights),
        enabledCovers: this._buildEnabledMapFromRegistry(this._coverLabelId, this._enabledCovers),
        enabledTVs: this._buildEnabledMapFromRegistry(this._tvLabelId, this._enabledTVs),
        enabledLocks: this._buildEnabledMapFromRegistry(this._lockLabelId, this._enabledLocks),
        enabledWaterLeakSensors: this._buildEnabledMapFromRegistry(this._waterLeakLabelId, this._enabledWaterLeakSensors),
        enabledSmokeSensors: this._buildEnabledMapFromRegistry(this._smokeLabelId, this._enabledSmokeSensors),
      };
      return this._cachedEnabledMaps;
    }

    render() {
      const weather = this._getWeather();
      const currentWeather = this._getCurrentWeatherData();
      const person = this._getPerson();
      const roomIndicators = this._getActiveRoomIndicators();

      // Get appliances with showInHomeStatus enabled
      const appliancesWithHomeStatus = this._getAppliancesWithHomeStatus();

      // Get all status items via status service (filtered by current labels)
      // Use memoized enabled maps to avoid 11x full registry iterations per render
      const enabledMaps = this._getCachedEnabledMaps();
      const allStatusItems = statusService
        ? statusService.getAllStatusItems({
            hass: this.hass,
            infoTextConfig: this._infoTextConfig,
            enabledEntities: enabledMaps,
            labelIds: {
              motionLabelId: this._motionLabelId,
              garageLabelId: this._garageLabelId,
              windowLabelId: this._windowLabelId,
              roofWindowLabelId: this._roofWindowLabelId,
              doorLabelId: this._doorLabelId,
              lightLabelId: this._lightLabelId,
              coverLabelId: this._coverLabelId,
              tvLabelId: this._tvLabelId,
              lockLabelId: this._lockLabelId,
              waterLeakLabelId: this._waterLeakLabelId,
              smokeLabelId: this._smokeLabelId,
            },
            entityHasLabel: (entityId, labelId) => this._entityHasCurrentLabel(entityId, labelId),
            appliancesWithHomeStatus,
            getApplianceStatus: (appliance) => this._getApplianceStatus(appliance),
            openTooLongThresholds: {
              doorOpenTooLongMinutes: this._doorOpenTooLongMinutes,
              windowOpenTooLongMinutes: this._windowOpenTooLongMinutes,
              garageOpenTooLongMinutes: this._garageOpenTooLongMinutes,
              roofWindowOpenTooLongMinutes: this._roofWindowOpenTooLongMinutes,
              coverOpenTooLongMinutes: this._coverOpenTooLongMinutes,
              lockUnlockedTooLongMinutes: this._lockUnlockedTooLongMinutes,
            },
            alarmEntity: this._alarmEntity,
          })
        : [];

      // Filter out dismissed alerts (warnings only, per AC #5)
      const visibleStatusItems = allStatusItems.filter(status => {
        // Non-warning items are always visible
        if (!status.isWarning) return true;
        // Warning items: check if dismissed
        if (!status.alertId || !uiStateStore) return true;
        return !uiStateStore.isAlertDismissed(status.alertId, status.entityLastChanged);
      });

      // Track dismissed count for "Show all" UI
      const dismissedCount = uiStateStore ? uiStateStore.getDismissedCount() : 0;
      const hasTriggeredAlarm = visibleStatusItems.some(s => s.state === 'triggered');

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
              @click=${() => { this._settingsError = null; if (settingsStore) { settingsStore._loaded = false; settingsStore.load(); } this.requestUpdate(); }}
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
            >${t('common.actions.retry')}</button>
          </div>
        ` : ''}

        <!-- SETUP WIZARD (shown on first run) -->
        ${this._showWizard && dashviewAdmin?.renderWizard ? dashviewAdmin.renderWizard(this, html, {
          onComplete: () => {
            this._showWizard = false;
            this.requestUpdate();
          }
        }) : html`

        <!-- TOP HEADER -->
        <div class="top-header">
          <div class="header-left">
            <button class="menu-button" @click=${this._toggleMenu} aria-label="${t('common.actions.menu') || 'Menu'}">
              <ha-icon icon="mdi:menu"></ha-icon>
            </button>
          </div>

          <div class="header-right">
            ${headerWeather
              ? html`
                  <div class="weather-widget" @click=${this._openWeatherPopup} role="button" tabindex="0" aria-label="${t('weather.current')}" @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openWeatherPopup(); } }}>
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
                  <div class="person-avatar ${person.state === "home" ? "home" : ""}" @click=${this._openUserPopup} role="button" tabindex="0" aria-label="${person?.name || 'User'}" @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openUserPopup(); } }}>
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
                      role="${indicator.areaId ? 'button' : ''}"
                      tabindex="${indicator.areaId ? '0' : ''}"
                      aria-label="${indicator.label}${indicator.hasMotion ? ' (Motion)' : ''}${indicator.hasSmoke ? ' (Smoke!)' : ''}"
                      @keydown=${indicator.areaId ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._openRoomPopup(indicator.areaId); } } : null}
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
        ${visibleStatusItems.length > 0 || dismissedCount > 0
          ? html`
              <div class="info-text-row">
                ${visibleStatusItems.map((status, index) => html`
                  ${index > 0 ? html`<span class="text-segment">&nbsp;&nbsp;</span>` : ''}
                  <span class="text-segment">${status.prefixText} </span>
                  <span
                    class="info-badge ${status.state === 'motion' || status.state === 'finished' || status.state === 'on' ? 'success' : ''} ${this._getAlarmBadgeClass(status.state) || (status.isCritical ? 'critical' : status.isWarning ? 'warning' : '')} ${status.clickAction ? 'clickable' : ''}"
                    @click=${status.clickAction ? () => this._handleInfoTextClick(status.clickAction) : null}
                    role="${status.clickAction ? 'button' : ''}"
                    tabindex="${status.clickAction ? '0' : ''}"
                    @keydown=${status.clickAction ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._handleInfoTextClick(status.clickAction); } } : null}
                  >
                    ${status.badgeIcon ? html`<ha-icon icon="${status.badgeIcon}" style="--mdc-icon-size: 14px; vertical-align: middle;"></ha-icon> ` : ''}${status.badgeText}${status.emoji || ''}
                    ${(status.isWarning || status.isCritical) && status.alertId ? html`
                      <span
                        class="info-badge-dismiss"
                        @click=${(e) => { e.stopPropagation(); this._dismissAlert(status); }}
                        title="${t('status.dismiss')}"
                        role="button"
                        tabindex="0"
                        aria-label="Dismiss"
                        @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.stopPropagation(); this._dismissAlert(status); } }}
                      >
                        <ha-icon icon="mdi:close" style="--mdc-icon-size: 12px;"></ha-icon>
                      </span>
                    ` : ''}
                  </span>
                  <span class="text-segment">${status.suffixText}</span>
                `)}
                ${dismissedCount > 0 ? html`
                  <span class="text-segment">&nbsp;&nbsp;</span>
                  <span
                    class="info-badge dismissed-indicator clickable"
                    @click=${() => this._showAllAlerts()}
                    title="${t('status.showAllAlerts')}"
                    role="button"
                    tabindex="0"
                    @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._showAllAlerts(); } }}
                  >
                    <ha-icon icon="mdi:eye-off" style="--mdc-icon-size: 14px; vertical-align: middle;"></ha-icon>
                    ${t('status.dismissedCount', { count: dismissedCount })}
                  </span>
                ` : ''}
                ${hasTriggeredAlarm ? html`
                  <div
                    class="alarm-alert-banner"
                    role="alert"
                    aria-live="assertive"
                    tabindex="0"
                    @click=${() => this._handleInfoTextClick('security')}
                    @keydown=${(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this._handleInfoTextClick('security'); } }}
                  >
                    <ha-icon icon="mdi:shield-alert"></ha-icon>
                    ${t('status.alarm.triggered_banner', 'ALARM TRIGGERED — Tap to view')}
                  </div>
                ` : ''}
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
              <div class="popup-overlay" @click=${this._handleSecurityPopupOverlayClick} @keydown=${(e) => { if (e.key === 'Escape') { this._securityPopupOpen = false; this.requestUpdate(); } }}>
                <div class="popup-container" role="dialog" aria-modal="true" aria-label="${t('security.title', 'Security')}">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--primary-color);">
                      <ha-icon icon="mdi:shield-home"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>${t('security.title', 'Security')}</h2>
                    </div>
                    <button class="popup-close" @click=${() => this._securityPopupOpen = false} aria-label="${t('common.actions.close', 'Close')}">
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
              <div class="popup-overlay" @click=${this._handleLightsPopupOverlayClick} @keydown=${(e) => { if (e.key === 'Escape') { this._closeLightsPopup(); } }}>
                <div class="popup-container" role="dialog" aria-modal="true" aria-label="${t('ui.popups.lights.title')}">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--dv-gradient-active, linear-gradient(135deg, #ffd54f 0%, #ffb300 100%));">
                      <ha-icon icon="mdi:lightbulb-group"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>${t('ui.popups.lights.title')}</h2>
                    </div>
                    <button class="popup-close" @click=${this._closeLightsPopup} aria-label="${t('common.actions.close', 'Close')}">
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

        <!-- COVERS POPUP -->
        ${this._coversPopupOpen
          ? html`
              <div class="popup-overlay" @click=${this._handleCoversPopupOverlayClick} @keydown=${(e) => { if (e.key === 'Escape') { this._closeCoversPopup(); } }}>
                <div class="popup-container" role="dialog" aria-modal="true" aria-label="${t('ui.popups.covers.title', 'Covers')}">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--dv-gradient-cover, linear-gradient(135deg, #90caf9 0%, #42a5f5 100%));">
                      <ha-icon icon="mdi:window-shutter"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>${t('ui.popups.covers.title', 'Covers')}</h2>
                    </div>
                    <button class="popup-close" @click=${this._closeCoversPopup} aria-label="${t('common.actions.close', 'Close')}">
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                  <div class="popup-content">
                    ${this._renderCoversPopupContent()}
                  </div>
                </div>
              </div>
            `
          : ""}

        <!-- TVS POPUP -->
        ${this._tvsPopupOpen
          ? html`
              <div class="popup-overlay" @click=${this._handleTVsPopupOverlayClick} @keydown=${(e) => { if (e.key === 'Escape') { this._closeTVsPopup(); } }}>
                <div class="popup-container" role="dialog" aria-modal="true" aria-label="${t('ui.popups.tvs.title', 'TVs')}">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--dv-gradient-media, linear-gradient(135deg, #ce93d8 0%, #ab47bc 100%));">
                      <ha-icon icon="mdi:television"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>${t('ui.popups.tvs.title', 'TVs')}</h2>
                    </div>
                    <button class="popup-close" @click=${this._closeTVsPopup} aria-label="${t('common.actions.close', 'Close')}">
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                  <div class="popup-content">
                    ${this._renderTVsPopupContent()}
                  </div>
                </div>
              </div>
            `
          : ""}

        <!-- BATTERY POPUP -->
        ${this._batteryPopupOpen
          ? (() => {
              const batteryStatus = statusService?.getBatteryLowStatus(this.hass, this._infoTextConfig);
              const isCritical = batteryStatus?.isCritical || false;
              return html`
              <div class="popup-overlay" @click=${this._handleBatteryPopupOverlayClick} @keydown=${(e) => { if (e.key === 'Escape') { this._closeBatteryPopup(); } }}>
                <div class="popup-container" role="dialog" aria-modal="true" aria-label="${t('ui.sections.batteries', 'Batteries')}">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(${isCritical ? '--error-color, #dc2626' : '--warning-color, #ff9800'});">
                      <ha-icon icon="${isCritical ? 'mdi:battery-alert' : 'mdi:battery-low'}"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>${t('ui.sections.batteries', 'Batteries')}</h2>
                    </div>
                    <button class="popup-close" @click=${this._closeBatteryPopup} aria-label="${t('common.actions.close', 'Close')}">
                      <ha-icon icon="mdi:close"></ha-icon>
                    </button>
                  </div>
                  <div class="popup-content">
                    ${this._renderBatteryPopupContent()}
                  </div>
                </div>
              </div>
            `})()
          : ""}

        <!-- USER POPUP -->
        ${this._userPopupOpen && dashviewUserPopup
          ? dashviewUserPopup(this, html)
          : this._userPopupOpen
            ? html`<div class="popup-overlay"><div class="popup-container"><p>User popup module not loaded</p></div></div>`
            : ''}

        <!-- MEDIA POPUP -->
        ${this._mediaPopupOpen && dashviewMediaPopup
          ? dashviewMediaPopup(this, html)
          : this._mediaPopupOpen
            ? html`<div class="popup-overlay"><div class="popup-container"><p>Media popup module not loaded</p></div></div>`
            : ''}

        <!-- WATER POPUP -->
        ${this._waterPopupOpen && dashviewWaterPopup
          ? dashviewWaterPopup(this, html)
          : this._waterPopupOpen
            ? html`<div class="popup-overlay"><div class="popup-container"><p>Water popup module not loaded</p></div></div>`
            : ''}

        <!-- ADMIN POPUP -->
        ${this._adminPopupOpen
          ? html`
              <div class="popup-overlay" @click=${this._handleAdminPopupOverlayClick} @keydown=${(e) => { if (e.key === 'Escape') { this._adminPopupOpen = false; this.requestUpdate(); } }}>
                <div class="popup-container" @click=${(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="${t('admin.title', 'Admin')}">
                  <div class="popup-header">
                    <div class="popup-icon" style="background: var(--primary-color);">
                      <ha-icon icon="mdi:cog"></ha-icon>
                    </div>
                    <div class="popup-title">
                      <h2>${t('admin.title', 'Admin')}</h2>
                    </div>
                    <button class="popup-close" @click=${() => this._adminPopupOpen = false} aria-label="${t('common.actions.close', 'Close')}">
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

        <!-- VERSION FOOTER -->
        <div class="dashview-version">v${changelogUtils?.CURRENT_VERSION || DASHVIEW_VERSION}</div>

        <!-- BOTTOM TAB BAR -->
        <div class="bottom-tab-bar">
          <div class="bottom-tab-bar-inner">
            <button
              class="tab ${this._activeTab === "home" && !this._securityPopupOpen && !this._mediaPopupOpen && !this._adminPopupOpen ? "active" : ""}"
              @click=${() => this._setTab("home")}
            >
              <ha-icon icon="mdi:home"></ha-icon>
              <span>${t('ui.tabs.home', 'Home')}</span>
            </button>
            <button
              class="tab ${this._securityPopupOpen ? "active" : ""}"
              @click=${() => { this._closeAllPopups(); this._securityPopupOpen = true; this.requestUpdate(); }}
            >
              <ha-icon icon="mdi:shield-home"></ha-icon>
              <span>${t('security.title', 'Security')}</span>
            </button>
            <button
              class="tab ${this._mediaPopupOpen ? "active" : ""}"
              @click=${() => { this._closeAllPopups(); this._mediaPopupOpen = true; this.requestUpdate(); }}
            >
              <ha-icon icon="mdi:music"></ha-icon>
              <span>${t('media.title', 'Music')}</span>
            </button>
            <button
              class="tab ${this._adminPopupOpen ? "active" : ""}"
              @click=${() => { this._closeAllPopups(); this._adminPopupOpen = true; this.requestUpdate(); }}
            >
              <ha-icon icon="mdi:cog"></ha-icon>
              <span>${t('admin.title', 'Admin')}</span>
            </button>
          </div>
        </div>
        `}
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

    _renderCoversPopupContent() {
      // Use external module if available, fallback to inline
      if (dashviewPopups?.renderCoversPopupContent) {
        return dashviewPopups.renderCoversPopupContent(this, html);
      }
      // Fallback: return empty if module not loaded
      return html`<div class="covers-empty-state">Covers module not loaded</div>`;
    }

    _renderTVsPopupContent() {
      // Use external module if available, fallback to inline
      if (dashviewPopups?.renderTVsPopupContent) {
        return dashviewPopups.renderTVsPopupContent(this, html);
      }
      // Fallback: return empty if module not loaded
      return html`<div class="tvs-empty-state">TVs module not loaded</div>`;
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
      if (dashviewUtils?.triggerHaptic) dashviewUtils.triggerHaptic('light');

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
