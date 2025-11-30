/**
 * Registry Store
 * Manages Home Assistant registry data (areas, floors, entities, devices, labels)
 *
 * This store handles all data fetched from Home Assistant registries
 * that represent the current state of the HA instance.
 */

/**
 * Default registry state
 */
export const DEFAULT_REGISTRY = {
  // Area and floor data
  areas: [],
  floors: [],

  // Entity and device registries
  entityRegistry: [],
  deviceRegistry: [],

  // Labels
  labels: [],

  // Resolved label IDs (for quick lookup)
  labelIds: {
    light: null,
    mediaPlayer: null,
    motion: null,
    smoke: null,
    cover: null,
    garage: null,
    window: null,
    vibration: null,
    temperature: null,
    humidity: null,
    climate: null,
    roofWindow: null,
  },

  // Scenes
  scenes: [],

  // Weather entities available
  availableWeatherEntities: [],

  // Weather forecasts
  weatherForecasts: [],
  weatherHourlyForecasts: [],

  // Thermostat history
  thermostatHistory: {},

  // Loading states
  areasLoading: false,
  entitiesLoading: false,
};

/**
 * Label name patterns to labelIds key mapping
 * Keys are lowercase patterns that match against label name or label_id
 */
const LABEL_PATTERNS = {
  light: ['light', 'lights', 'licht'],
  mediaPlayer: ['media player', 'media_player', 'mediaplayer'],
  motion: ['motion', 'bewegung'],
  smoke: ['smoke', 'rauchmelder', 'smoke detector'],
  cover: ['cover', 'rollo', 'blind'],
  garage: ['garage', 'garagentor'],
  window: ['window', 'fenster'],
  vibration: ['vibration', 'erschütterung'],
  temperature: ['temperature', 'temperatur'],
  humidity: ['humidity', 'luftfeuchtigkeit', 'luftfeuchtigkeitssensor'],
  climate: ['climate', 'thermostat'],
  roofWindow: ['roof window', 'dachfenster'],
  tv: ['tv', 'fernseher', 'television'],
};

/**
 * Registry Store class
 * Manages Home Assistant registry data
 */
export class RegistryStore {
  constructor() {
    this._data = { ...DEFAULT_REGISTRY };
    this._listeners = new Set();
    this._hass = null;

    // Forecast subscriptions
    this._dailyForecastUnsubscribe = null;
    this._hourlyForecastUnsubscribe = null;
  }

  /**
   * Set the Home Assistant instance
   * @param {Object} hass - Home Assistant instance
   */
  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Get all registry data
   * @returns {Object}
   */
  get all() {
    return this._data;
  }

  /**
   * Get a specific data value
   * @param {string} key - Data key
   * @returns {*} Data value
   */
  get(key) {
    return this._data[key];
  }

  /**
   * Get areas
   * @returns {Array}
   */
  get areas() {
    return this._data.areas;
  }

  /**
   * Get floors
   * @returns {Array}
   */
  get floors() {
    return this._data.floors;
  }

  /**
   * Get entity registry
   * @returns {Array}
   */
  get entityRegistry() {
    return this._data.entityRegistry;
  }

  /**
   * Get device registry
   * @returns {Array}
   */
  get deviceRegistry() {
    return this._data.deviceRegistry;
  }

  /**
   * Get labels
   * @returns {Array}
   */
  get labels() {
    return this._data.labels;
  }

  /**
   * Get label IDs
   * @returns {Object}
   */
  get labelIds() {
    return this._data.labelIds;
  }

  /**
   * Get scenes
   * @returns {Array}
   */
  get scenes() {
    return this._data.scenes;
  }

  /**
   * Load areas and floors from Home Assistant
   * @returns {Promise<void>}
   */
  async loadAreas() {
    if (!this._hass || this._data.areasLoading) return;

    this._data.areasLoading = true;

    try {
      const [areasResult, floorsResult] = await Promise.all([
        this._hass.callWS({ type: 'config/area_registry/list' }),
        this._hass.callWS({ type: 'config/floor_registry/list' }),
      ]);

      this._data.areas = areasResult || [];
      this._data.floors = floorsResult || [];
      this._data.areasLoading = false;

      this._notifyListeners('areas', this._data.areas);
      this._notifyListeners('floors', this._data.floors);

      console.log(`Dashview: Loaded ${this._data.areas.length} areas and ${this._data.floors.length} floors`);
    } catch (e) {
      console.error('Dashview: Failed to load areas:', e);
      this._data.areasLoading = false;
    }
  }

  /**
   * Load entity and device registries from Home Assistant
   * @returns {Promise<void>}
   */
  async loadEntities() {
    if (!this._hass || this._data.entitiesLoading) return;

    this._data.entitiesLoading = true;

    try {
      const [entityResult, deviceResult, labelResult] = await Promise.all([
        this._hass.callWS({ type: 'config/entity_registry/list' }),
        this._hass.callWS({ type: 'config/device_registry/list' }),
        this._hass.callWS({ type: 'config/label_registry/list' }),
      ]);

      this._data.entityRegistry = entityResult || [];
      this._data.deviceRegistry = deviceResult || [];
      this._data.labels = labelResult || [];
      this._data.entitiesLoading = false;

      // Resolve label IDs
      this._resolveLabelIds();

      // Extract scenes
      this._extractScenes();

      // Extract available weather entities
      this._extractWeatherEntities();

      this._notifyListeners('entityRegistry', this._data.entityRegistry);
      this._notifyListeners('deviceRegistry', this._data.deviceRegistry);
      this._notifyListeners('labels', this._data.labels);

      console.log(`Dashview: Loaded ${this._data.entityRegistry.length} entities, ${this._data.deviceRegistry.length} devices, ${this._data.labels.length} labels`);
    } catch (e) {
      console.error('Dashview: Failed to load entities:', e);
      this._data.entitiesLoading = false;
    }
  }

  /**
   * Load all registry data
   * @returns {Promise<void>}
   */
  async loadAll() {
    await Promise.all([
      this.loadAreas(),
      this.loadEntities(),
    ]);
  }

  /**
   * Resolve label IDs from label names using pattern matching
   */
  _resolveLabelIds() {
    const labelIds = { ...this._data.labelIds };

    this._data.labels.forEach(label => {
      const labelNameLower = label.name.toLowerCase();
      const labelIdLower = label.label_id.toLowerCase();

      // Check each pattern group
      for (const [key, patterns] of Object.entries(LABEL_PATTERNS)) {
        if (labelIds[key]) continue; // Already found

        for (const pattern of patterns) {
          // Match if label name/ID equals, starts with, or contains the pattern
          if (labelNameLower === pattern ||
              labelIdLower === pattern ||
              labelNameLower.startsWith(pattern) ||
              labelIdLower.startsWith(pattern) ||
              labelNameLower.includes(pattern) ||
              labelIdLower.includes(pattern)) {
            labelIds[key] = label.label_id;
            console.log(`Dashview: Matched label "${label.name}" (${label.label_id}) to type "${key}"`);
            break;
          }
        }
      }
    });

    this._data.labelIds = labelIds;
    console.log('Dashview: Resolved label IDs:', labelIds);
    this._notifyListeners('labelIds', labelIds);
  }

  /**
   * Extract scenes from entity registry
   */
  _extractScenes() {
    this._data.scenes = this._data.entityRegistry
      .filter(e => e.entity_id.startsWith('scene.'))
      .map(e => ({
        entity_id: e.entity_id,
        name: e.name || e.original_name || e.entity_id.replace('scene.', ''),
        area_id: e.area_id,
      }));

    this._notifyListeners('scenes', this._data.scenes);
  }

  /**
   * Extract available weather entities
   */
  _extractWeatherEntities() {
    if (!this._hass) return;

    this._data.availableWeatherEntities = Object.keys(this._hass.states)
      .filter(id => id.startsWith('weather.'))
      .map(id => ({
        entity_id: id,
        name: this._hass.states[id]?.attributes?.friendly_name || id,
      }));

    this._notifyListeners('availableWeatherEntities', this._data.availableWeatherEntities);
  }

  /**
   * Update weather forecasts
   * @param {Array} daily - Daily forecasts
   * @param {Array} hourly - Hourly forecasts
   */
  setWeatherForecasts(daily, hourly) {
    if (daily !== undefined) {
      this._data.weatherForecasts = daily;
      this._notifyListeners('weatherForecasts', daily);
    }
    if (hourly !== undefined) {
      this._data.weatherHourlyForecasts = hourly;
      this._notifyListeners('weatherHourlyForecasts', hourly);
    }
  }

  /**
   * Update thermostat history
   * @param {string} entityId - Thermostat entity ID
   * @param {Array} history - History data
   */
  setThermostatHistory(entityId, history) {
    this._data.thermostatHistory = {
      ...this._data.thermostatHistory,
      [entityId]: history,
    };
    this._notifyListeners('thermostatHistory', this._data.thermostatHistory);
  }

  /**
   * Get areas for a specific floor
   * @param {string} floorId - Floor ID
   * @returns {Array} Areas on the floor
   */
  getAreasForFloor(floorId) {
    return this._data.areas.filter(area => area.floor_id === floorId);
  }

  /**
   * Get entities for an area by label
   * @param {string} areaId - Area ID
   * @param {string} labelId - Label ID
   * @returns {Array} Entities with the label in the area
   */
  getEntitiesForAreaByLabel(areaId, labelId) {
    if (!labelId) return [];

    return this._data.entityRegistry.filter(entity => {
      // Check if entity is in the area (directly or via device)
      let entityAreaId = entity.area_id;
      if (!entityAreaId && entity.device_id) {
        const device = this._data.deviceRegistry.find(d => d.id === entity.device_id);
        entityAreaId = device?.area_id;
      }

      // Check if entity has the label and is in the area
      return entityAreaId === areaId &&
        entity.labels &&
        entity.labels.includes(labelId);
    });
  }

  /**
   * Subscribe to data changes
   * @param {Function} listener - Callback function (key, value) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notify all listeners of a change
   * @param {string} key - Changed data key
   * @param {*} value - New value
   */
  _notifyListeners(key, value) {
    this._listeners.forEach(listener => {
      try {
        listener(key, value);
      } catch (e) {
        console.error('Dashview: Registry listener error:', e);
      }
    });
  }

  /**
   * Cleanup - unsubscribe from forecasts
   */
  destroy() {
    if (this._dailyForecastUnsubscribe) {
      this._dailyForecastUnsubscribe();
      this._dailyForecastUnsubscribe = null;
    }
    if (this._hourlyForecastUnsubscribe) {
      this._hourlyForecastUnsubscribe();
      this._hourlyForecastUnsubscribe = null;
    }
    this._listeners.clear();
  }
}

// Singleton instance
let registryStoreInstance = null;

/**
 * Get the singleton registry store instance
 * @returns {RegistryStore}
 */
export function getRegistryStore() {
  if (!registryStoreInstance) {
    registryStoreInstance = new RegistryStore();
  }
  return registryStoreInstance;
}

export default RegistryStore;
