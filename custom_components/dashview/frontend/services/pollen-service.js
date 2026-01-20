/**
 * Pollen Service
 * DWD Pollenflug integration for pollen level detection and display
 *
 * Supports the DWD Pollenflug HACS integration:
 * https://github.com/mampfes/hacs_dwd_pollenflug
 */

/**
 * Regex pattern to match DWD Pollenflug sensor entity IDs
 * Format: sensor.pollenflug_[type]_[region]
 * Example: sensor.pollenflug_birke_124
 */
export const DWD_POLLEN_PATTERN = /^sensor\.pollenflug_(\w+)_(\d+)$/;

/**
 * Pollen types with icons and translations
 * All 8 pollen types supported by DWD Pollenflug
 */
export const POLLEN_TYPES = {
  erle: { icon: 'mdi:tree', en: 'Alder', de: 'Erle' },
  ambrosia: { icon: 'mdi:flower', en: 'Ragweed', de: 'Ambrosia' },
  esche: { icon: 'mdi:tree', en: 'Ash', de: 'Esche' },
  birke: { icon: 'mdi:tree', en: 'Birch', de: 'Birke' },
  hasel: { icon: 'mdi:tree', en: 'Hazel', de: 'Hasel' },
  graeser: { icon: 'mdi:grass', en: 'Grass', de: 'Gräser' },
  beifuss: { icon: 'mdi:flower', en: 'Mugwort', de: 'Beifuß' },
  roggen: { icon: 'mdi:barley', en: 'Rye', de: 'Roggen' },
};

/**
 * Check if an entity is a DWD Pollenflug sensor by its attributes
 * DWD Pollenflug sensors have these unique attributes:
 * - state_tomorrow (number)
 * - state_in_2_days (number)
 * - state_today_desc (string, optional)
 *
 * @param {Object} state - Entity state object
 * @returns {boolean} True if this is a DWD Pollenflug sensor
 */
function isDwdPollenSensor(state) {
  if (!state || !state.attributes) return false;

  const attrs = state.attributes;

  // Must have forecast attributes (unique to DWD Pollenflug)
  const hasTomorrow = 'state_tomorrow' in attrs;
  const hasDayAfter = 'state_in_2_days' in attrs;

  // State should be a number in valid pollen range (0-3, with 0.5 increments)
  const stateValue = parseFloat(state.state);
  const hasValidState = !isNaN(stateValue) && stateValue >= 0 && stateValue <= 3.5;

  return hasTomorrow && hasDayAfter && hasValidState;
}

/**
 * Extract pollen type from entity
 * Tries multiple sources: entity_id pattern, friendly_name, or attributes
 *
 * @param {string} entityId - Entity ID
 * @param {Object} state - Entity state object
 * @returns {string|null} Pollen type key or null if not found
 */
function extractPollenType(entityId, state) {
  // 1. Try entity ID pattern first (most reliable if not renamed)
  const idMatch = entityId.match(DWD_POLLEN_PATTERN);
  if (idMatch) {
    return idMatch[1];
  }

  // 2. Try to find type in friendly_name
  const friendlyName = (state.attributes?.friendly_name || '').toLowerCase();
  const pollenTypeKeys = Object.keys(POLLEN_TYPES);

  for (const type of pollenTypeKeys) {
    // Check German and English names
    const typeInfo = POLLEN_TYPES[type];
    if (
      friendlyName.includes(type) ||
      friendlyName.includes(typeInfo.en.toLowerCase()) ||
      friendlyName.includes(typeInfo.de.toLowerCase())
    ) {
      return type;
    }
  }

  // 3. Try entity_id for partial matches (e.g., sensor.birch_pollen)
  const idLower = entityId.toLowerCase();
  for (const type of pollenTypeKeys) {
    const typeInfo = POLLEN_TYPES[type];
    if (
      idLower.includes(type) ||
      idLower.includes(typeInfo.en.toLowerCase()) ||
      idLower.includes(typeInfo.de.toLowerCase())
    ) {
      return type;
    }
  }

  // 4. Could not determine type
  return null;
}

/**
 * Extract region from entity (if available)
 *
 * @param {string} entityId - Entity ID
 * @param {Object} state - Entity state object
 * @returns {string} Region ID or 'unknown'
 */
function extractRegion(entityId, state) {
  // Try entity ID pattern
  const idMatch = entityId.match(DWD_POLLEN_PATTERN);
  if (idMatch) {
    return idMatch[2];
  }

  // Try to find region number in entity_id
  const regionMatch = entityId.match(/_(\d+)$/);
  if (regionMatch) {
    return regionMatch[1];
  }

  return 'unknown';
}

/**
 * Detect all DWD Pollenflug sensors from Home Assistant states
 * Uses attribute-based detection (works even if entity is renamed)
 *
 * @param {Object} hass - Home Assistant instance
 * @returns {Array} Array of pollen sensor objects
 */
export function detectPollenSensors(hass) {
  if (!hass || !hass.states) {
    return [];
  }

  const sensors = [];

  for (const [entityId, state] of Object.entries(hass.states)) {
    // Skip non-sensor entities
    if (!entityId.startsWith('sensor.')) continue;

    // Check if this is a DWD Pollenflug sensor by attributes
    if (!isDwdPollenSensor(state)) continue;

    // Extract pollen type
    const type = extractPollenType(entityId, state);
    if (!type) continue; // Skip if we can't determine the type

    sensors.push({
      entityId,
      type,
      region: extractRegion(entityId, state),
      value: parseFloat(state.state) || 0,
      tomorrow: parseFloat(state.attributes?.state_tomorrow) || 0,
      dayAfter: parseFloat(state.attributes?.state_in_2_days) || 0,
      todayDesc: state.attributes?.state_today_desc || '',
      friendlyName: state.attributes?.friendly_name || entityId,
    });
  }

  return sensors;
}

/**
 * Get pollen level info from numeric value
 * DWD uses 0-3 scale with 0.5 increments
 *
 * @param {number} value - Pollen load index (0-3)
 * @returns {Object} { level: string, color: string, dots: number }
 */
export function getPollenLevel(value) {
  if (value >= 3) {
    return { level: 'high', color: 'var(--dv-pollen-high)', dots: 6 };
  }
  if (value >= 2.5) {
    return { level: 'moderate-high', color: 'var(--dv-pollen-moderate-high)', dots: 5 };
  }
  if (value >= 2) {
    return { level: 'moderate', color: 'var(--dv-pollen-moderate)', dots: 4 };
  }
  if (value >= 1.5) {
    return { level: 'low-moderate', color: 'var(--dv-pollen-low-moderate)', dots: 3 };
  }
  if (value >= 1) {
    return { level: 'low', color: 'var(--dv-pollen-low)', dots: 2 };
  }
  if (value >= 0.5) {
    return { level: 'none-low', color: 'var(--dv-pollen-none)', dots: 1 };
  }
  return { level: 'none', color: 'var(--dv-pollen-none)', dots: 0 };
}

/**
 * Get trend direction comparing today to tomorrow
 *
 * @param {number} today - Today's pollen value
 * @param {number} tomorrow - Tomorrow's pollen value
 * @returns {'up'|'down'|'same'} Trend direction
 */
export function getPollenTrend(today, tomorrow) {
  const diff = tomorrow - today;
  if (diff > 0.5) return 'up';
  if (diff < -0.5) return 'down';
  return 'same';
}

export default {
  DWD_POLLEN_PATTERN,
  POLLEN_TYPES,
  detectPollenSensors,
  getPollenLevel,
  getPollenTrend,
};
