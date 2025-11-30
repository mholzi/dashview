/**
 * General Helper Utilities
 * Common utility functions used throughout the application
 */

/**
 * Sort array by custom order
 * @param {Array} items - Items to sort
 * @param {Array} customOrder - Array of IDs in desired order
 * @param {Function} getId - Function to get ID from item
 * @param {Function} compareFallback - Fallback comparison function
 * @returns {Array} Sorted items
 */
export function sortByCustomOrder(items, customOrder, getId, compareFallback) {
  if (!customOrder || customOrder.length === 0) {
    return [...items].sort(compareFallback);
  }

  return [...items].sort((a, b) => {
    const indexA = customOrder.indexOf(getId(a));
    const indexB = customOrder.indexOf(getId(b));

    // Items not in custom order go to the end (sorted by fallback)
    if (indexA === -1 && indexB === -1) {
      return compareFallback(a, b);
    }
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });
}

/**
 * Clamp a value between min and max
 * @param {number} value - Value to clamp
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Calculate percentage from click position
 * @param {Event} e - Click event
 * @param {Element} element - Target element
 * @returns {number} Percentage (0-100)
 */
export function calculateSliderPercentage(e, element) {
  const rect = element.getBoundingClientRect();
  const x = e.clientX - rect.left;
  return clamp((x / rect.width) * 100, 0, 100);
}

/**
 * Debounce function
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
}

/**
 * Check if value is a plain object
 * @param {*} item - Value to check
 * @returns {boolean} True if plain object
 */
function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * @typedef {Object} EntityToggleConfig
 * @property {string} mapKey - The settings key for the enabled map (e.g., 'enabledLights')
 * @property {string} entityId - The entity ID to toggle
 * @property {Object} currentMap - Current enabled state map
 * @property {Function} updateCallback - Callback to update state: (newMap) => void
 * @property {Function} saveCallback - Callback to save settings
 */

/**
 * Create a generic entity toggle handler
 * Reduces duplication of _toggleXxxEnabled methods
 *
 * @param {EntityToggleConfig} config - Toggle configuration
 * @returns {Object} New enabled map state
 *
 * @example
 * // In component method:
 * _toggleLightEnabled(entityId) {
 *   const newMap = toggleEntityEnabled({
 *     mapKey: 'enabledLights',
 *     entityId,
 *     currentMap: this._enabledLights,
 *     updateCallback: (map) => { this._enabledLights = map; },
 *     saveCallback: () => this._saveSettings()
 *   });
 * }
 */
export function toggleEntityEnabled({ mapKey, entityId, currentMap, updateCallback, saveCallback }) {
  const newMap = {
    ...currentMap,
    [entityId]: !currentMap[entityId],
  };
  updateCallback(newMap);
  saveCallback();
  return newMap;
}

/**
 * Create a batch toggle handler for multiple entities
 *
 * @param {Object} options - Options
 * @param {string[]} options.entityIds - Entity IDs to toggle
 * @param {Object} options.currentMap - Current enabled state map
 * @param {boolean} options.enabled - Target enabled state
 * @param {Function} options.updateCallback - Callback to update state
 * @param {Function} options.saveCallback - Callback to save settings
 * @returns {Object} New enabled map state
 */
export function setEntitiesEnabled({ entityIds, currentMap, enabled, updateCallback, saveCallback }) {
  const newMap = { ...currentMap };
  entityIds.forEach(entityId => {
    newMap[entityId] = enabled;
  });
  updateCallback(newMap);
  saveCallback();
  return newMap;
}

/**
 * Get entities for a specific area from an enabled map
 *
 * @param {Object} options - Options
 * @param {Object} options.enabledMap - Map of entityId -> enabled boolean
 * @param {Object} options.hass - Home Assistant instance
 * @param {string} options.areaId - Area ID to filter by
 * @param {Function} options.getAreaIdForEntity - Function to get area ID for entity
 * @param {Function} [options.entityMapper] - Optional function to map entity state to result
 * @returns {Array} Array of enabled entities for the area
 */
export function getEnabledEntitiesForArea({
  enabledMap,
  hass,
  areaId,
  getAreaIdForEntity,
  entityMapper = (entityId, state) => ({ entity_id: entityId, ...state })
}) {
  if (!hass) return [];

  const entities = [];
  Object.entries(enabledMap).forEach(([entityId, enabled]) => {
    // Skip only explicitly disabled entities (enabled by default)
    if (enabled === false) return;

    const entityAreaId = getAreaIdForEntity(entityId);
    if (entityAreaId !== areaId) return;

    const state = hass.states[entityId];
    if (!state) return;

    entities.push(entityMapper(entityId, {
      name: state.attributes?.friendly_name || entityId,
      state: state.state,
      attributes: state.attributes,
      last_changed: state.last_changed,
    }));
  });

  return entities.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Calculate time difference components from milliseconds
 * Central utility to avoid duplicating time calculation logic
 * @param {number} milliseconds - Time difference in milliseconds
 * @returns {Object} Object with days, hours, minutes, seconds, and remainingMinutes
 */
export function calculateTimeDifference(milliseconds) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const days = Math.floor(totalHours / 24);

  return {
    days,
    hours: totalHours,
    minutes: totalMinutes,
    seconds: totalSeconds,
    remainingHours: totalHours % 24,
    remainingMinutes: totalMinutes % 60,
    remainingSeconds: totalSeconds % 60,
  };
}

/**
 * Get enabled entity IDs from an enabled map
 * Extracts IDs where value is truthy
 * @param {Object} enabledMap - Map of entityId -> boolean
 * @returns {string[]} Array of enabled entity IDs
 */
export function getEnabledEntityIds(enabledMap) {
  if (!enabledMap) return [];
  return Object.entries(enabledMap)
    .filter(([_, enabled]) => enabled)
    .map(([id]) => id);
}

/**
 * Format time ago in German
 * @param {string|Date} timestamp - Timestamp to format
 * @returns {string} Formatted time ago string
 */
export function formatTimeAgoGerman(timestamp) {
  if (!timestamp) return '';

  const date = timestamp instanceof Date ? timestamp : new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const now = new Date();
  const diffMs = now - date;
  const { days, hours, minutes } = calculateTimeDifference(diffMs);

  if (days >= 2) return `vor ${days} Tagen`;
  if (days >= 1) return 'Gestern';
  if (hours >= 1) return `vor ${hours}h`;
  if (minutes >= 1) return `vor ${minutes}min`;
  return 'Gerade eben';
}

/**
 * Format duration in German
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration string
 */
export function formatDurationGerman(milliseconds) {
  const { hours, remainingMinutes } = calculateTimeDifference(milliseconds);

  let result = '';
  if (hours > 0) result += `${hours}h`;
  if (remainingMinutes > 0 || hours === 0) {
    if (hours > 0) result += ' ';
    result += `${remainingMinutes}min`;
  }
  return result;
}

// ==================== Array Sorting Utilities ====================

/**
 * Sort items by name property (case-insensitive)
 * Consolidates 15+ duplicate sort patterns across codebase
 * @param {Array} items - Array of items with 'name' property
 * @returns {Array} Sorted array (new array, original unchanged)
 */
export function sortByName(items) {
  if (!items || !Array.isArray(items)) return [];
  return [...items].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
}

/**
 * Sort items by a custom key property
 * @param {Array} items - Array of items
 * @param {string|Function} key - Property name or getter function
 * @returns {Array} Sorted array
 */
export function sortByKey(items, key) {
  if (!items || !Array.isArray(items)) return [];
  const getter = typeof key === 'function' ? key : (item) => item[key] || '';
  return [...items].sort((a, b) => getter(a).localeCompare(getter(b)));
}

// ==================== Entity State Utilities ====================

/**
 * Check if entity state is valid (not unknown/unavailable)
 * Consolidates 10+ duplicate validation patterns
 * @param {Object} state - Entity state object from hass.states
 * @returns {boolean} True if state is valid and usable
 */
export function isEntityStateValid(state) {
  return state &&
         state.state !== 'unknown' &&
         state.state !== 'unavailable';
}

/**
 * Filter entity IDs by their current state
 * Consolidates 20+ duplicate filter patterns in status-service.js
 * @param {string[]} entityIds - Array of entity IDs
 * @param {Object} hass - Home Assistant instance
 * @param {string|string[]} targetStates - State(s) to match
 * @returns {string[]} Filtered entity IDs
 */
export function filterEntitiesByState(entityIds, hass, targetStates) {
  if (!entityIds || !hass) return [];
  const states = Array.isArray(targetStates) ? targetStates : [targetStates];
  return entityIds.filter(entityId => {
    const state = hass.states[entityId];
    return state && states.includes(state.state);
  });
}

/**
 * Get friendly name from entity state with fallback
 * Consolidates 8+ duplicate friendly name extractions
 * @param {Object} state - Entity state object
 * @param {string} [fallback] - Fallback value if no friendly name
 * @returns {string} Friendly name or fallback
 */
export function getFriendlyName(state, fallback = 'Unknown') {
  return state?.attributes?.friendly_name || fallback;
}

/**
 * Parse numeric state value safely
 * Consolidates 5+ duplicate parseFloat patterns
 * @param {Object} state - Entity state object
 * @param {number} [defaultValue=null] - Default if parsing fails
 * @returns {number|null} Parsed number or default
 */
export function parseNumericState(state, defaultValue = null) {
  if (!state || !isEntityStateValid(state)) return defaultValue;
  const value = parseFloat(state.state);
  return isNaN(value) ? defaultValue : value;
}

// ==================== Appliance Timer Utilities ====================

/**
 * Format remaining time from a finish time entity state
 * Consolidates duplicate washer/dishwasher/dryer time calculations
 * @param {string} finishTimeState - ISO date string of finish time
 * @param {string} [readyText='Fertig'] - Text to show when done
 * @returns {string} Formatted remaining time or ready text
 */
export function formatRemainingTime(finishTimeState, readyText = 'Fertig') {
  if (!finishTimeState || finishTimeState === 'unknown' || finishTimeState === 'unavailable') {
    return '';
  }

  try {
    const endTime = new Date(finishTimeState);
    const now = new Date();

    if (endTime <= now) {
      return readyText;
    }

    const diffMs = endTime - now;
    return formatDurationGerman(diffMs);
  } catch (e) {
    return '';
  }
}

// ==================== Event Utilities ====================

/**
 * Open Home Assistant more-info dialog for an entity
 * Consolidates 3+ duplicate CustomEvent dispatches
 * @param {HTMLElement} component - Component to dispatch from
 * @param {string} entityId - Entity ID to show info for
 */
export function openMoreInfo(component, entityId) {
  const event = new CustomEvent('hass-more-info', {
    bubbles: true,
    composed: true,
    detail: { entityId }
  });
  component.dispatchEvent(event);
}

// ==================== Service Call Utilities ====================

/**
 * Toggle a light entity
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId - Light entity ID
 */
export function toggleLight(hass, entityId) {
  if (!hass || !entityId) return;
  hass.callService('light', 'toggle', { entity_id: entityId });
}

/**
 * Turn on a light entity with optional brightness
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId - Light entity ID
 * @param {number} [brightness] - Optional brightness (0-255)
 */
export function turnOnLight(hass, entityId, brightness) {
  if (!hass || !entityId) return;
  const data = { entity_id: entityId };
  if (brightness !== undefined) {
    data.brightness = brightness;
  }
  hass.callService('light', 'turn_on', data);
}

/**
 * Turn off a light entity
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId - Light entity ID
 */
export function turnOffLight(hass, entityId) {
  if (!hass || !entityId) return;
  hass.callService('light', 'turn_off', { entity_id: entityId });
}

// ==================== Additional Sorting Utilities ====================

/**
 * Sort items by last_changed date (most recent first)
 * Consolidates 6+ duplicate date sort patterns
 * @param {Array} items - Array of items with state.last_changed property
 * @param {boolean} [ascending=false] - Sort ascending (oldest first) if true
 * @returns {Array} Sorted array
 */
export function sortByLastChanged(items, ascending = false) {
  if (!items || !Array.isArray(items)) return [];
  const multiplier = ascending ? 1 : -1;
  return [...items].sort((a, b) => {
    const dateA = new Date(a.state?.last_changed || a.last_changed || 0);
    const dateB = new Date(b.state?.last_changed || b.last_changed || 0);
    return (dateB - dateA) * multiplier;
  });
}

/**
 * Sort items by a numeric property
 * Consolidates garbage days, battery level sorting patterns
 * @param {Array} items - Array of items
 * @param {string|Function} property - Property name or getter function
 * @param {boolean} [ascending=true] - Sort ascending if true
 * @returns {Array} Sorted array
 */
export function sortByNumericProperty(items, property, ascending = true) {
  if (!items || !Array.isArray(items)) return [];
  const getter = typeof property === 'function' ? property : (item) => item[property] ?? 0;
  const multiplier = ascending ? 1 : -1;
  return [...items].sort((a, b) => (getter(a) - getter(b)) * multiplier);
}

// ==================== Entity Mapping Utilities ====================

/**
 * Map enabled entities with state information
 * Consolidates 6+ duplicate Object.entries filter+map patterns
 * @param {Object} enabledMap - Map of entityId -> enabled boolean
 * @param {Object} hass - Home Assistant instance
 * @param {Function} [stateMapper] - Optional function to extract additional properties from state
 * @returns {Array} Array of entity objects with entityId, state, and mapped properties
 */
export function mapEnabledEntities(enabledMap, hass, stateMapper = () => ({})) {
  if (!enabledMap || !hass) return [];
  return Object.entries(enabledMap)
    .filter(([entityId, enabled]) => enabled && hass.states[entityId])
    .map(([entityId]) => {
      const state = hass.states[entityId];
      return {
        entityId,
        state,
        ...stateMapper(state)
      };
    });
}

/**
 * Get mapped enabled entities sorted by last changed
 * Common pattern for security popups and admin panels
 * @param {Object} enabledMap - Map of entityId -> enabled boolean
 * @param {Object} hass - Home Assistant instance
 * @param {Function} [stateMapper] - Optional function to extract additional properties
 * @returns {Array} Sorted array of entity objects
 */
export function getEnabledEntitiesSortedByLastChanged(enabledMap, hass, stateMapper = () => ({})) {
  const entities = mapEnabledEntities(enabledMap, hass, stateMapper);
  return sortByLastChanged(entities);
}

// ==================== State Check Utilities ====================

/**
 * Check if entity state is 'on'
 * @param {Object} state - Entity state object or state string
 * @returns {boolean}
 */
export function isStateOn(state) {
  const stateValue = typeof state === 'string' ? state : state?.state;
  return stateValue === 'on';
}

/**
 * Check if entity state is 'off'
 * @param {Object} state - Entity state object or state string
 * @returns {boolean}
 */
export function isStateOff(state) {
  const stateValue = typeof state === 'string' ? state : state?.state;
  return stateValue === 'off';
}

/**
 * Check if entity state is 'open'
 * @param {Object} state - Entity state object or state string
 * @returns {boolean}
 */
export function isStateOpen(state) {
  const stateValue = typeof state === 'string' ? state : state?.state;
  return stateValue === 'open';
}

/**
 * Check if entity state matches any of the given states
 * @param {Object} state - Entity state object or state string
 * @param {string[]} states - Array of states to check
 * @returns {boolean}
 */
export function isStateOneOf(state, states) {
  const stateValue = typeof state === 'string' ? state : state?.state;
  return states.includes(stateValue);
}
