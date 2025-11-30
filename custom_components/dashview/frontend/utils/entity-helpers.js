/**
 * Dashview Entity Helpers
 * Utility functions for working with Home Assistant entities
 */

import { calculateTimeDifference, sortByName, getFriendlyName as getFriendlyNameUtil } from './helpers.js';

/**
 * Get entities for an area filtered by label
 * @param {Object} options - Options object
 * @param {Object} options.hass - Home Assistant object
 * @param {Array} options.entityRegistry - Entity registry array
 * @param {string} options.areaId - Area ID to filter by
 * @param {string} options.labelId - Label ID to filter by
 * @param {Object} options.enabledMap - Map of entity_id -> enabled boolean
 * @param {Function} options.getAreaIdForEntity - Function to get area ID for an entity
 * @param {Function} [options.mapEntity] - Optional custom mapper function
 * @returns {Array} Array of entity objects
 */
export function getEntitiesForAreaByLabel({
  hass,
  entityRegistry,
  areaId,
  labelId,
  enabledMap,
  getAreaIdForEntity,
  mapEntity
}) {
  if (!hass || !labelId) return [];

  const matches = entityRegistry.filter((entityReg) => {
    const hasLabel = entityReg.labels && entityReg.labels.includes(labelId);
    if (!hasLabel) return false;
    const entityAreaId = getAreaIdForEntity(entityReg.entity_id);
    return entityAreaId === areaId;
  });

  const defaultMapper = (entityReg) => {
    const state = hass.states[entityReg.entity_id];
    return {
      entity_id: entityReg.entity_id,
      name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
      state: state?.state || 'unknown',
      enabled: enabledMap[entityReg.entity_id] !== false,
    };
  };

  const mapper = mapEntity || defaultMapper;

  return sortByName(matches.map((entityReg) => mapper(entityReg, hass, enabledMap)));
}

/**
 * Get entities for an area filtered by domain
 * @param {Object} options - Options object
 * @param {Object} options.hass - Home Assistant object
 * @param {Array} options.entityRegistry - Entity registry array
 * @param {string} options.areaId - Area ID to filter by
 * @param {string} options.domain - Entity domain (e.g., 'light', 'cover')
 * @param {Object} options.enabledMap - Map of entity_id -> enabled boolean
 * @param {Function} options.getAreaIdForEntity - Function to get area ID for an entity
 * @param {Function} [options.filter] - Optional additional filter function
 * @param {Function} [options.mapEntity] - Optional custom mapper function
 * @returns {Array} Array of entity objects
 */
export function getEntitiesForAreaByDomain({
  hass,
  entityRegistry,
  areaId,
  domain,
  enabledMap,
  getAreaIdForEntity,
  filter,
  mapEntity
}) {
  if (!hass) return [];

  const matches = entityRegistry.filter((entityReg) => {
    if (!entityReg.entity_id.startsWith(`${domain}.`)) return false;
    const entityAreaId = getAreaIdForEntity(entityReg.entity_id);
    if (entityAreaId !== areaId) return false;
    if (filter && !filter(entityReg, hass)) return false;
    return true;
  });

  const defaultMapper = (entityReg) => {
    const state = hass.states[entityReg.entity_id];
    return {
      entity_id: entityReg.entity_id,
      name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
      state: state?.state || 'unknown',
      enabled: enabledMap[entityReg.entity_id] !== false,
    };
  };

  const mapper = mapEntity || defaultMapper;

  return sortByName(matches.map((entityReg) => mapper(entityReg, hass, enabledMap)));
}

/**
 * Entity mapper for covers (includes position)
 */
export function mapCoverEntity(entityReg, hass, enabledMap) {
  const state = hass.states[entityReg.entity_id];
  return {
    entity_id: entityReg.entity_id,
    name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
    state: state?.state || 'unknown',
    position: state?.attributes?.current_position,
    enabled: enabledMap[entityReg.entity_id] !== false,
  };
}

/**
 * Entity mapper for climate entities
 */
export function mapClimateEntity(entityReg, hass, enabledMap) {
  const state = hass.states[entityReg.entity_id];
  return {
    entity_id: entityReg.entity_id,
    name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
    state: state?.state || 'unknown',
    currentTemp: state?.attributes?.current_temperature,
    targetTemp: state?.attributes?.temperature,
    hvacAction: state?.attributes?.hvac_action,
    enabled: enabledMap[entityReg.entity_id] !== false,
  };
}

/**
 * Entity mapper for temperature sensors
 */
export function mapTemperatureSensorEntity(entityReg, hass, enabledMap) {
  const state = hass.states[entityReg.entity_id];
  return {
    entity_id: entityReg.entity_id,
    name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
    state: state?.state || 'unknown',
    unit: state?.attributes?.unit_of_measurement || '°C',
    enabled: enabledMap[entityReg.entity_id] !== false,
  };
}

/**
 * Entity mapper for humidity sensors
 */
export function mapHumiditySensorEntity(entityReg, hass, enabledMap) {
  const state = hass.states[entityReg.entity_id];
  return {
    entity_id: entityReg.entity_id,
    name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
    state: state?.state || 'unknown',
    unit: state?.attributes?.unit_of_measurement || '%',
    enabled: enabledMap[entityReg.entity_id] !== false,
  };
}

/**
 * Entity mapper for media players
 */
export function mapMediaPlayerEntity(entityReg, hass, enabledMap) {
  const state = hass.states[entityReg.entity_id];
  return {
    entity_id: entityReg.entity_id,
    name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
    state: state?.state || 'unknown',
    mediaTitle: state?.attributes?.media_title,
    mediaArtist: state?.attributes?.media_artist,
    volume: state?.attributes?.volume_level,
    enabled: enabledMap[entityReg.entity_id] !== false,
  };
}

/**
 * Entity mapper for lights (includes brightness)
 */
export function mapLightEntity(entityReg, hass, enabledMap) {
  const state = hass.states[entityReg.entity_id];
  const brightness = state?.attributes?.brightness;
  const isDimmable = brightness !== undefined || (state?.attributes?.supported_features & 1);

  return {
    entity_id: entityReg.entity_id,
    name: state?.attributes?.friendly_name || entityReg.original_name || entityReg.entity_id,
    state: state?.state || 'unknown',
    brightness: brightness,
    brightnessPercent: brightness ? Math.round((brightness / 255) * 100) : 0,
    isDimmable: isDimmable,
    icon: state?.attributes?.icon || 'mdi:lightbulb',
    enabled: enabledMap[entityReg.entity_id] !== false,
  };
}

/**
 * Get friendly name from entity state
 * @param {Object} state - Entity state object
 * @returns {string} Friendly name
 */
export function getFriendlyName(state) {
  return state?.attributes?.friendly_name || state?.entity_id || 'Unknown';
}

/**
 * Format last changed time
 * Uses centralized time calculation utility
 * @param {string} lastChanged - ISO timestamp string
 * @returns {string} Human readable time string
 */
export function formatLastChanged(lastChanged) {
  const last = new Date(lastChanged);
  if (isNaN(last.getTime())) return 'Invalid date';

  const now = new Date();
  const diff = now - last;
  const { days, hours, minutes } = calculateTimeDifference(diff);

  if (days >= 2) return `${days} days ago`;
  if (days >= 1) return 'Yesterday';
  if (hours >= 1) return `${hours}h ago`;
  return `${minutes}m ago`;
}

/**
 * Check if an entity is in a specific state
 * @param {Object} hass - Home Assistant object
 * @param {string} entityId - Entity ID
 * @param {string|string[]} states - State(s) to check for
 * @returns {boolean} True if entity is in the specified state(s)
 */
export function isEntityInState(hass, entityId, states) {
  const state = hass?.states?.[entityId]?.state;
  if (Array.isArray(states)) {
    return states.includes(state);
  }
  return state === states;
}

/**
 * Get battery level for an entity
 * @param {Object} hass - Home Assistant object
 * @param {string} entityId - Entity ID
 * @returns {number|null} Battery percentage or null
 */
export function getBatteryLevel(hass, entityId) {
  const state = hass?.states?.[entityId];
  if (!state) return null;

  // Check if it's a battery sensor
  if (state.attributes?.device_class === 'battery') {
    const value = parseFloat(state.state);
    return isNaN(value) ? null : value;
  }

  // Check battery attribute
  if (state.attributes?.battery !== undefined) {
    return state.attributes.battery;
  }

  if (state.attributes?.battery_level !== undefined) {
    return state.attributes.battery_level;
  }

  return null;
}

/**
 * Get battery icon based on level
 * @param {number} level - Battery level percentage
 * @returns {string} MDI icon name
 */
export function getBatteryIcon(level) {
  if (level <= 10) return 'mdi:battery-10';
  if (level <= 20) return 'mdi:battery-20';
  if (level <= 30) return 'mdi:battery-30';
  if (level <= 40) return 'mdi:battery-40';
  if (level <= 50) return 'mdi:battery-50';
  if (level <= 60) return 'mdi:battery-60';
  if (level <= 70) return 'mdi:battery-70';
  if (level <= 80) return 'mdi:battery-80';
  if (level <= 90) return 'mdi:battery-90';
  return 'mdi:battery';
}

/**
 * Get color for battery level
 * @param {number} level - Battery level percentage
 * @returns {string} CSS color value
 */
export function getBatteryColor(level) {
  if (level <= 10) return 'var(--error-color, #f44336)';
  if (level <= 20) return 'var(--warning-color, #ff9800)';
  return 'var(--success-color, #4caf50)';
}

/**
 * Count entities in a specific state
 * @param {Array} entities - Array of entity objects with 'state' property
 * @param {string|string[]} states - State(s) to count
 * @returns {number} Count of entities in the specified state(s)
 */
export function countEntitiesInState(entities, states) {
  const stateArray = Array.isArray(states) ? states : [states];
  return entities.filter(e => stateArray.includes(e.state)).length;
}

/**
 * Count enabled entities
 * @param {Array} entities - Array of entity objects with 'enabled' property
 * @returns {number} Count of enabled entities
 */
export function countEnabledEntities(entities) {
  return entities.filter(e => e.enabled).length;
}
