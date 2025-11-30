/**
 * Room Data Service
 * Provides entity getter methods for rooms/areas based on labels
 *
 * This service handles:
 * - Getting entities for an area by label type
 * - Aggregating room data (motion, lights, temperature, humidity)
 * - Activity status for rooms and floors
 */

import { sortByName, parseNumericState } from '../utils/helpers.js';

/**
 * Entity type configurations
 * Maps entity type keys to their enabled map key and extra attribute extractors
 */
const ENTITY_TYPE_CONFIG = {
  light: {
    labelKey: 'light',
    enabledMapKey: 'enabledLights',
    extraAttributes: () => ({}),
  },
  motion: {
    labelKey: 'motion',
    enabledMapKey: 'enabledMotionSensors',
    extraAttributes: () => ({}),
  },
  smoke: {
    labelKey: 'smoke',
    enabledMapKey: 'enabledSmokeSensors',
    extraAttributes: () => ({}),
  },
  cover: {
    labelKey: 'cover',
    enabledMapKey: 'enabledCovers',
    extraAttributes: (state) => ({
      position: state?.attributes?.current_position,
    }),
  },
  garage: {
    labelKey: 'garage',
    enabledMapKey: 'enabledGarages',
    extraAttributes: () => ({}),
  },
  window: {
    labelKey: 'window',
    enabledMapKey: 'enabledWindows',
    extraAttributes: (state) => ({
      position: state?.attributes?.current_position,
    }),
  },
  vibration: {
    labelKey: 'vibration',
    enabledMapKey: 'enabledVibrationSensors',
    extraAttributes: () => ({}),
  },
  temperature: {
    labelKey: 'temperature',
    enabledMapKey: 'enabledTemperatureSensors',
    extraAttributes: (state) => ({
      unit: state?.attributes?.unit_of_measurement || '°C',
    }),
  },
  humidity: {
    labelKey: 'humidity',
    enabledMapKey: 'enabledHumiditySensors',
    extraAttributes: (state) => ({
      unit: state?.attributes?.unit_of_measurement || '%',
    }),
  },
  climate: {
    labelKey: 'climate',
    enabledMapKey: 'enabledClimates',
    extraAttributes: (state) => ({
      hvacAction: state?.attributes?.hvac_action,
      currentTemp: state?.attributes?.current_temperature,
      targetTemp: state?.attributes?.temperature,
    }),
  },
  roofWindow: {
    labelKey: 'roofWindow',
    enabledMapKey: 'enabledRoofWindows',
    extraAttributes: (state) => ({
      position: state?.attributes?.current_position,
    }),
  },
  mediaPlayer: {
    labelKey: 'mediaPlayer',
    enabledMapKey: 'enabledMediaPlayers',
    extraAttributes: (state) => ({
      mediaTitle: state?.attributes?.media_title,
      mediaArtist: state?.attributes?.media_artist,
      entityPicture: state?.attributes?.entity_picture,
      volumeLevel: state?.attributes?.volume_level,
      source: state?.attributes?.source,
    }),
  },
  tv: {
    labelKey: 'tv',
    enabledMapKey: 'enabledTVs',
    extraAttributes: (state) => ({
      source: state?.attributes?.source,
      volumeLevel: state?.attributes?.volume_level,
      mediaTitle: state?.attributes?.media_title,
    }),
  },
};

/**
 * RoomDataService class
 * Manages entity lookups and room data aggregation
 */
export class RoomDataService {
  constructor() {
    this._hass = null;
    this._entityRegistry = [];
    this._deviceRegistry = [];
    this._labelIds = {};
    this._enabledMaps = {};
  }

  /**
   * Set the Home Assistant instance
   * @param {Object} hass - Home Assistant instance
   */
  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Set the entity registry
   * @param {Array} entityRegistry - Entity registry array
   */
  setEntityRegistry(entityRegistry) {
    this._entityRegistry = entityRegistry || [];
  }

  /**
   * Set the device registry
   * @param {Array} deviceRegistry - Device registry array
   */
  setDeviceRegistry(deviceRegistry) {
    this._deviceRegistry = deviceRegistry || [];
  }

  /**
   * Set the label IDs map
   * @param {Object} labelIds - Map of label keys to label IDs
   */
  setLabelIds(labelIds) {
    this._labelIds = labelIds || {};
    console.log('[Dashview] RoomDataService.setLabelIds called:', this._labelIds);
  }

  /**
   * Set enabled entity maps
   * @param {Object} enabledMaps - Object containing all enabled maps
   */
  setEnabledMaps(enabledMaps) {
    this._enabledMaps = enabledMaps || {};
  }

  /**
   * Get area ID for an entity (checks entity and device registry)
   * @param {string} entityId - Entity ID
   * @returns {string|null} Area ID or null
   */
  getAreaIdForEntity(entityId) {
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

  /**
   * Generic method to get entities for an area by label type
   * @param {string} areaId - Area ID
   * @param {string} entityType - Entity type key (light, motion, cover, etc.)
   * @returns {Array} Array of entity objects
   */
  getAreaEntities(areaId, entityType) {
    if (!this._hass) {
      console.log(`[Dashview] getAreaEntities: No hass for ${entityType}`);
      return [];
    }

    const config = ENTITY_TYPE_CONFIG[entityType];
    if (!config) {
      console.warn(`RoomDataService: Unknown entity type "${entityType}"`);
      return [];
    }

    const labelId = this._labelIds[config.labelKey];
    if (!labelId) {
      console.log(`[Dashview] getAreaEntities: No labelId for ${entityType}, labelKey=${config.labelKey}, available labelIds:`, Object.keys(this._labelIds));
      return [];
    }

    const enabledMap = this._enabledMaps[config.enabledMapKey] || {};

    // Filter entities by label and area
    const matches = this._entityRegistry.filter((entityReg) => {
      // Check if entity has the label
      const hasLabel = entityReg.labels && entityReg.labels.includes(labelId);
      if (!hasLabel) return false;

      // Check if entity is in this area
      const entityAreaId = this.getAreaIdForEntity(entityReg.entity_id);
      return entityAreaId === areaId;
    });

    // Map to entity objects with state info
    const entities = matches.map((entityReg) => {
      const state = this._hass.states[entityReg.entity_id];
      const baseEntity = {
        entity_id: entityReg.entity_id,
        name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
        state: state?.state || 'unknown',
        enabled: enabledMap[entityReg.entity_id] !== false,
      };

      // Add type-specific attributes
      const extras = config.extraAttributes(state);
      return { ...baseEntity, ...extras };
    });

    return sortByName(entities);
  }

  // ============================================
  // Type-specific convenience methods
  // ============================================

  getAreaLights(areaId) {
    return this.getAreaEntities(areaId, 'light');
  }

  getAreaMotionSensors(areaId) {
    return this.getAreaEntities(areaId, 'motion');
  }

  getAreaSmokeSensors(areaId) {
    return this.getAreaEntities(areaId, 'smoke');
  }

  getAreaCovers(areaId) {
    return this.getAreaEntities(areaId, 'cover');
  }

  getAreaGarages(areaId) {
    return this.getAreaEntities(areaId, 'garage');
  }

  getAreaWindows(areaId) {
    return this.getAreaEntities(areaId, 'window');
  }

  getAreaVibrationSensors(areaId) {
    return this.getAreaEntities(areaId, 'vibration');
  }

  getAreaTemperatureSensors(areaId) {
    return this.getAreaEntities(areaId, 'temperature');
  }

  getAreaHumiditySensors(areaId) {
    return this.getAreaEntities(areaId, 'humidity');
  }

  getAreaClimates(areaId) {
    return this.getAreaEntities(areaId, 'climate');
  }

  getAreaRoofWindows(areaId) {
    return this.getAreaEntities(areaId, 'roofWindow');
  }

  getAreaMediaPlayers(areaId) {
    return this.getAreaEntities(areaId, 'mediaPlayer');
  }

  getAreaTVs(areaId) {
    return this.getAreaEntities(areaId, 'tv');
  }

  // ============================================
  // Aggregated room data methods
  // ============================================

  /**
   * Check if any motion sensor is detecting motion in an area
   * @param {string} areaId - Area ID
   * @returns {boolean}
   */
  hasMotion(areaId) {
    const sensors = this.getAreaMotionSensors(areaId).filter(s => s.enabled);
    return sensors.some(s => s.state === 'on');
  }

  /**
   * Check if any light is on in an area
   * @param {string} areaId - Area ID
   * @returns {boolean}
   */
  hasLightsOn(areaId) {
    const lights = this.getAreaLights(areaId).filter(l => l.enabled);
    return lights.some(l => l.state === 'on');
  }

  /**
   * Get temperature reading for an area
   * @param {string} areaId - Area ID
   * @returns {string|null} Temperature value or null
   */
  getTemperature(areaId) {
    const sensors = this.getAreaTemperatureSensors(areaId).filter(t => t.enabled);
    if (sensors.length === 0) return null;

    const tempVal = parseNumericState({ state: sensors[0].state });
    if (tempVal === null) return null;
    return tempVal.toFixed(0);
  }

  /**
   * Get humidity reading for an area
   * @param {string} areaId - Area ID
   * @returns {string|null} Humidity value or null
   */
  getHumidity(areaId) {
    const sensors = this.getAreaHumiditySensors(areaId).filter(h => h.enabled);
    if (sensors.length === 0) return null;

    const humVal = parseNumericState({ state: sensors[0].state });
    if (humVal === null) return null;
    return humVal.toFixed(0);
  }

  /**
   * Get aggregated data for a room
   * @param {string} areaId - Area ID
   * @returns {Object} Room data
   */
  getRoomData(areaId) {
    const hasMotion = this.hasMotion(areaId);
    const hasLightsOn = this.hasLightsOn(areaId);
    const temperature = this.getTemperature(areaId);
    const humidity = this.getHumidity(areaId);
    const isActive = hasMotion || hasLightsOn;

    return {
      hasMotion,
      hasLightsOn,
      temperature,
      humidity,
      isActive,
    };
  }

  /**
   * Get data for multiple rooms
   * @param {Array} rooms - Array of room/area objects
   * @returns {Map} Map of areaId to room data
   */
  getRoomDataBatch(rooms) {
    const dataMap = new Map();
    rooms.forEach(room => {
      dataMap.set(room.area_id, this.getRoomData(room.area_id));
    });
    return dataMap;
  }
}

// Singleton instance
let roomDataServiceInstance = null;

/**
 * Get the singleton room data service instance
 * @returns {RoomDataService}
 */
export function getRoomDataService() {
  if (!roomDataServiceInstance) {
    roomDataServiceInstance = new RoomDataService();
  }
  return roomDataServiceInstance;
}

export default RoomDataService;
