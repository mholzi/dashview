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
 * Detect all DWD Pollenflug sensors from Home Assistant states
 * @param {Object} hass - Home Assistant instance
 * @returns {Array} Array of pollen sensor objects
 */
export function detectPollenSensors(hass) {
  if (!hass || !hass.states) {
    return [];
  }

  return Object.keys(hass.states)
    .filter(id => DWD_POLLEN_PATTERN.test(id))
    .map(id => {
      const match = id.match(DWD_POLLEN_PATTERN);
      const state = hass.states[id];
      return {
        entityId: id,
        type: match[1],
        region: match[2],
        value: parseFloat(state.state) || 0,
        tomorrow: parseFloat(state.attributes?.state_tomorrow) || 0,
        dayAfter: parseFloat(state.attributes?.state_in_2_days) || 0,
        todayDesc: state.attributes?.state_today_desc || '',
      };
    });
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
