/**
 * Entity Suggestions Service
 * Surfaces unused entities and suggests additions based on patterns
 */

import { t } from './i18n.js';

/**
 * Get entities in an area that are not yet enabled for a specific category
 * @param {Object} hass - Home Assistant instance
 * @param {Object} panel - Panel instance with settings
 * @param {string} areaId - Area ID to check
 * @param {string} category - Category key (e.g., 'lights', 'covers', 'sensors')
 * @returns {Array} Array of suggested entity objects
 */
export function getUnusedEntitiesForCategory(hass, panel, areaId, category) {
  if (!hass || !panel || !areaId) return [];

  const categoryConfig = CATEGORY_CONFIGS[category];
  if (!categoryConfig) return [];

  // Get all entities in this area
  const areaEntities = getEntitiesInArea(hass, areaId);

  // Filter by domain/device_class for this category
  const matchingEntities = areaEntities.filter(entityId => {
    const state = hass.states[entityId];
    if (!state) return false;

    return categoryConfig.matchEntity(entityId, state);
  });

  // Get currently enabled entities for this category
  const enabledKey = categoryConfig.enabledKey;
  const enabledEntities = panel[enabledKey] || {};

  // Return entities that are not yet enabled
  return matchingEntities
    .filter(entityId => enabledEntities[entityId] !== true)
    .map(entityId => {
      const state = hass.states[entityId];
      return {
        entity_id: entityId,
        name: state?.attributes?.friendly_name || entityId,
        domain: entityId.split('.')[0],
        device_class: state?.attributes?.device_class,
        state: state?.state,
        icon: state?.attributes?.icon || categoryConfig.defaultIcon
      };
    });
}

/**
 * Get all entities assigned to an area
 * @param {Object} hass - Home Assistant instance
 * @param {string} areaId - Area ID
 * @returns {Array} Array of entity IDs
 */
function getEntitiesInArea(hass, areaId) {
  if (!hass || !hass.entities || !areaId) return [];

  return Object.keys(hass.states).filter(entityId => {
    const entityReg = hass.entities?.[entityId];
    // Check if entity is directly assigned to area
    if (entityReg?.area_id === areaId) return true;
    // Check if entity's device is assigned to area
    if (entityReg?.device_id) {
      const device = hass.devices?.[entityReg.device_id];
      if (device?.area_id === areaId) return true;
    }
    return false;
  });
}

/**
 * Category configuration for entity matching
 */
const CATEGORY_CONFIGS = {
  lights: {
    enabledKey: '_enabledLights',
    defaultIcon: 'mdi:lightbulb',
    matchEntity: (entityId, state) => {
      return entityId.startsWith('light.');
    }
  },
  covers: {
    enabledKey: '_enabledCovers',
    defaultIcon: 'mdi:window-shutter',
    matchEntity: (entityId, state) => {
      return entityId.startsWith('cover.');
    }
  },
  temperatureSensors: {
    enabledKey: '_enabledTemperatureSensors',
    defaultIcon: 'mdi:thermometer',
    matchEntity: (entityId, state) => {
      if (!entityId.startsWith('sensor.')) return false;
      const deviceClass = state?.attributes?.device_class;
      const unit = state?.attributes?.unit_of_measurement;
      return deviceClass === 'temperature' || unit === '°C' || unit === '°F';
    }
  },
  humiditySensors: {
    enabledKey: '_enabledHumiditySensors',
    defaultIcon: 'mdi:water-percent',
    matchEntity: (entityId, state) => {
      if (!entityId.startsWith('sensor.')) return false;
      const deviceClass = state?.attributes?.device_class;
      // Only match humidity device_class, not just any % unit (batteries also use %)
      return deviceClass === 'humidity';
    }
  },
  motionSensors: {
    enabledKey: '_enabledMotionSensors',
    defaultIcon: 'mdi:motion-sensor',
    matchEntity: (entityId, state) => {
      if (!entityId.startsWith('binary_sensor.')) return false;
      const deviceClass = state?.attributes?.device_class;
      return deviceClass === 'motion' || deviceClass === 'occupancy';
    }
  },
  windows: {
    enabledKey: '_enabledWindows',
    defaultIcon: 'mdi:window-closed',
    matchEntity: (entityId, state) => {
      if (!entityId.startsWith('binary_sensor.')) return false;
      const deviceClass = state?.attributes?.device_class;
      return deviceClass === 'window';
    }
  },
  climates: {
    enabledKey: '_enabledClimates',
    defaultIcon: 'mdi:thermostat',
    matchEntity: (entityId, state) => {
      return entityId.startsWith('climate.');
    }
  },
  mediaPlayers: {
    enabledKey: '_enabledMediaPlayers',
    defaultIcon: 'mdi:speaker',
    matchEntity: (entityId, state) => {
      return entityId.startsWith('media_player.');
    }
  },
  tvs: {
    enabledKey: '_enabledTVs',
    defaultIcon: 'mdi:television',
    matchEntity: (entityId, state) => {
      if (!entityId.startsWith('media_player.')) return false;
      const deviceClass = state?.attributes?.device_class;
      return deviceClass === 'tv';
    }
  },
  locks: {
    enabledKey: '_enabledLocks',
    defaultIcon: 'mdi:lock',
    matchEntity: (entityId, state) => {
      return entityId.startsWith('lock.');
    }
  }
};

/**
 * Get all suggestions for an area across all categories
 * @param {Object} hass - Home Assistant instance
 * @param {Object} panel - Panel instance
 * @param {string} areaId - Area ID
 * @returns {Object} Map of category to suggested entities
 */
export function getAllSuggestionsForArea(hass, panel, areaId) {
  const suggestions = {};

  for (const category of Object.keys(CATEGORY_CONFIGS)) {
    const unused = getUnusedEntitiesForCategory(hass, panel, areaId, category);
    if (unused.length > 0) {
      suggestions[category] = unused;
    }
  }

  return suggestions;
}

/**
 * Get count of unused entities for an area
 * @param {Object} hass - Home Assistant instance
 * @param {Object} panel - Panel instance
 * @param {string} areaId - Area ID
 * @returns {number} Total count of unused entities
 */
export function getUnusedEntityCount(hass, panel, areaId) {
  let count = 0;

  for (const category of Object.keys(CATEGORY_CONFIGS)) {
    const unused = getUnusedEntitiesForCategory(hass, panel, areaId, category);
    count += unused.length;
  }

  return count;
}

/**
 * Get entities that might be missing from configuration based on common patterns
 * @param {Object} hass - Home Assistant instance
 * @param {Object} panel - Panel instance
 * @returns {Array} Array of suggestion objects with reason
 */
export function getMissingSuggestions(hass, panel) {
  if (!hass || !panel) return [];

  const suggestions = [];
  const areas = panel._areas || [];

  for (const area of areas) {
    const areaId = area.area_id;
    const isEnabled = panel._enabledRooms?.[areaId] !== false;

    if (!isEnabled) continue;

    // Check for rooms with unused lights
    const unusedLights = getUnusedEntitiesForCategory(hass, panel, areaId, 'lights');

    if (unusedLights.length > 0) {
      suggestions.push({
        type: 'missing_lights',
        areaId,
        areaName: area.name,
        entities: unusedLights,
        message: t('admin.suggestions.unusedLights', '{{name}} has {{count}} lights that are not enabled')
          .replace('{{name}}', area.name)
          .replace('{{count}}', unusedLights.length)
      });
    }

    // Check for rooms with unused temperature sensors
    const unusedTempSensors = getUnusedEntitiesForCategory(hass, panel, areaId, 'temperatureSensors');

    if (unusedTempSensors.length > 0) {
      suggestions.push({
        type: 'missing_temperature',
        areaId,
        areaName: area.name,
        entities: unusedTempSensors,
        message: t('admin.suggestions.unusedTemperature', '{{name}} has temperature sensors that could be enabled')
          .replace('{{name}}', area.name)
      });
    }
  }

  return suggestions;
}

/**
 * Render suggestions banner for an area
 * @param {Function} html - lit-html template function
 * @param {Object} hass - Home Assistant instance
 * @param {Object} panel - Panel instance
 * @param {string} areaId - Area ID
 * @param {Function} onEnableEntity - Callback to enable an entity
 * @returns {TemplateResult|string} Suggestions banner HTML or empty string
 */
export function renderSuggestionsBanner(html, hass, panel, areaId, onEnableEntity) {
  const suggestions = getAllSuggestionsForArea(hass, panel, areaId);
  const totalCount = Object.values(suggestions).flat().length;

  if (totalCount === 0) return '';

  // Get first few suggestions to show
  const previewEntities = Object.values(suggestions).flat().slice(0, 3);

  const unusedText = totalCount === 1
    ? t('admin.suggestions.unusedEntitySingular', '1 unused entity found')
    : t('admin.suggestions.unusedEntityPlural', '{{count}} unused entities found').replace('{{count}}', totalCount);

  const moreText = t('admin.suggestions.more', '+{{count}} more').replace('{{count}}', totalCount - 3);

  return html`
    <div class="entity-suggestions-banner">
      <div class="suggestions-header">
        <ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>
        <span>${unusedText}</span>
      </div>
      <div class="suggestions-preview">
        ${previewEntities.map(entity => html`
          <div class="suggestion-chip" @click=${() => onEnableEntity(entity.entity_id)}>
            <ha-icon icon="${entity.icon}"></ha-icon>
            <span>${entity.name}</span>
            <ha-icon icon="mdi:plus-circle" class="suggestion-add"></ha-icon>
          </div>
        `)}
        ${totalCount > 3 ? html`
          <span class="suggestions-more">${moreText}</span>
        ` : ''}
      </div>
    </div>
  `;
}
