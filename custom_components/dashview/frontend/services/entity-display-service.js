/**
 * Entity Display Service
 * Provides display information for entities (icons, labels, states, card classes)
 *
 * This service extracts the complex entity display logic from render methods
 * into a centralized, testable service.
 */

import { t } from '../utils/i18n.js';

// ==================== Icon Maps ====================

/**
 * Sensor device class to icon mapping
 */
const SENSOR_ICONS = {
  temperature: 'mdi:thermometer',
  humidity: 'mdi:water-percent',
  battery: 'mdi:battery',
  power: 'mdi:flash',
  energy: 'mdi:lightning-bolt',
  voltage: 'mdi:sine-wave',
  current: 'mdi:current-ac',
  pressure: 'mdi:gauge',
  illuminance: 'mdi:brightness-6',
  carbon_dioxide: 'mdi:molecule-co2',
  carbon_monoxide: 'mdi:molecule-co',
  pm25: 'mdi:blur',
  pm10: 'mdi:blur',
  signal_strength: 'mdi:wifi',
  timestamp: 'mdi:clock-outline',
  monetary: 'mdi:currency-eur',
  default: 'mdi:eye',
};

/**
 * Binary sensor icons by label type
 */
const BINARY_SENSOR_ICONS = {
  motion: { on: 'mdi:motion-sensor', off: 'mdi:motion-sensor-off' },
  window: { on: 'mdi:window-open', off: 'mdi:window-closed' },
  garage: { on: 'mdi:garage-open', off: 'mdi:garage' },
  vibration: { on: 'mdi:vibrate', off: 'mdi:vibrate-off' },
  smoke: { on: 'mdi:smoke-detector-alert', off: 'mdi:smoke-detector' },
  default: { on: 'mdi:checkbox-marked-circle', off: 'mdi:checkbox-blank-circle-outline' },
};

/**
 * Lock icons by state
 */
const LOCK_ICONS = {
  locked: 'mdi:lock',
  unlocked: 'mdi:lock-open',
  locking: 'mdi:lock-clock',
  unlocking: 'mdi:lock-clock',
  default: 'mdi:lock',
};

/**
 * State labels for binary sensors
 * Now uses i18n translation system
 */
const BINARY_SENSOR_LABELS = {
  motion: { on: () => t('sensor.motion.detected'), off: () => t('sensor.motion.no_motion') },
  window: { on: () => t('sensor.window.on'), off: () => t('sensor.window.off') },
  garage: { on: () => t('sensor.garage.on'), off: () => t('sensor.garage.off') },
  vibration: { on: () => t('sensor.vibration.on'), off: () => t('sensor.vibration.off') },
  smoke: { on: () => t('sensor.smoke.on'), off: () => t('sensor.smoke.off') },
  default: { on: () => t('common.status.on'), off: () => t('common.status.off') },
};

/**
 * State labels for locks
 * Now uses i18n translation system
 */
const LOCK_LABELS = {
  locked: () => t('lock.locked'),
  unlocked: () => t('lock.unlocked'),
  locking: () => t('lock.locking'),
  unlocking: () => t('lock.unlocking'),
  default: () => t('common.status.unknown'),
};

// ==================== Display Info Getters ====================

/**
 * Factory function to get display info for any binary sensor type
 * Replaces individual getMotionDisplayInfo, getWindowDisplayInfo, etc.
 * @param {string} sensorType - Type of sensor ('motion', 'window', 'garage', 'vibration', 'smoke')
 * @param {Object} state - Entity state object
 * @returns {Object} Display info with icon, labelText, and cardClass
 */
function getBinarySensorDisplayInfoByType(sensorType, state) {
  const isOn = state.state === 'on';
  const icons = BINARY_SENSOR_ICONS[sensorType] || BINARY_SENSOR_ICONS.default;
  const labels = BINARY_SENSOR_LABELS[sensorType] || BINARY_SENSOR_LABELS.default;
  return {
    icon: isOn ? icons.on : icons.off,
    labelText: isOn ? labels.on() : labels.off(),
    cardClass: isOn ? 'active-gradient' : 'inactive',
  };
}

// Convenience wrappers for backwards compatibility
function getMotionDisplayInfo(state) {
  return getBinarySensorDisplayInfoByType('motion', state);
}

function getWindowDisplayInfo(state) {
  return getBinarySensorDisplayInfoByType('window', state);
}

function getGarageDisplayInfo(state) {
  return getBinarySensorDisplayInfoByType('garage', state);
}

function getVibrationDisplayInfo(state) {
  return getBinarySensorDisplayInfoByType('vibration', state);
}

function getSmokeDisplayInfo(state) {
  return getBinarySensorDisplayInfoByType('smoke', state);
}

/**
 * Get display info for a temperature sensor
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getTemperatureDisplayInfo(state) {
  const unit = state.attributes.unit_of_measurement || '°C';
  return {
    icon: 'mdi:thermometer',
    labelText: `${state.state}${unit}`,
    cardClass: 'inactive',
  };
}

/**
 * Get display info for a humidity sensor
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getHumidityDisplayInfo(state) {
  const unit = state.attributes.unit_of_measurement || '%';
  return {
    icon: 'mdi:water-percent',
    labelText: `${state.state}${unit}`,
    cardClass: 'inactive',
  };
}

/**
 * Get display info for a light entity
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getLightDisplayInfo(state) {
  const isOn = state.state === 'on';
  const icon = state.attributes.icon || 'mdi:lightbulb';

  if (isOn) {
    const brightness = state.attributes.brightness;
    let labelText = t('common.status.on');
    if (brightness) {
      const brightnessPercent = Math.round((brightness / 255) * 100);
      labelText = `${t('common.status.on')} (${brightnessPercent}%)`;
    }
    return { icon, labelText, cardClass: 'active-light' };
  }

  return { icon, labelText: t('common.status.off'), cardClass: 'inactive' };
}

/**
 * Get display info for a cover entity
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getCoverDisplayInfo(state) {
  const icon = state.attributes.icon || 'mdi:window-shutter';
  const position = state.attributes.current_position;
  const isOpen = state.state === 'open';

  let labelText;
  if (position !== undefined) {
    labelText = `${position}%`;
  } else {
    labelText = isOpen ? t('common.status.open') : state.state === 'closed' ? t('common.status.closed') : state.state;
  }

  return {
    icon,
    labelText,
    cardClass: isOpen ? 'active-gradient' : 'inactive',
  };
}

/**
 * Get display info for a climate entity
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getClimateDisplayInfo(state) {
  const icon = state.attributes.icon || 'mdi:thermostat';
  const currentTemp = state.attributes.current_temperature;
  const targetTemp = state.attributes.temperature;
  const isHeating = state.attributes.hvac_action === 'heating';

  let labelText = state.state;
  if (currentTemp !== undefined) {
    labelText = `${currentTemp}°C`;
    if (targetTemp !== undefined) {
      labelText += ` → ${targetTemp}°C`;
    }
  }

  return {
    icon,
    labelText,
    cardClass: isHeating ? 'active-light' : 'inactive',
  };
}

/**
 * Get display info for a lock entity
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getLockDisplayInfo(state) {
  const lockState = state.state;
  const icon = state.attributes.icon || LOCK_ICONS[lockState] || LOCK_ICONS.default;
  const labelGetter = LOCK_LABELS[lockState] || LOCK_LABELS.default;
  const labelText = labelGetter();
  const isUnlocked = lockState === 'unlocked';

  return {
    icon,
    labelText,
    cardClass: isUnlocked ? 'active-gradient' : 'inactive',
  };
}

/**
 * Get display info for a generic binary sensor
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getBinarySensorDisplayInfo(state) {
  const isOn = state.state === 'on';
  const icon = state.attributes.icon ||
    (isOn ? BINARY_SENSOR_ICONS.default.on : BINARY_SENSOR_ICONS.default.off);

  return {
    icon,
    labelText: isOn ? t('common.status.on') : t('common.status.off'),
    cardClass: isOn ? 'active-gradient' : 'inactive',
  };
}

/**
 * Get display info for a generic sensor
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getSensorDisplayInfo(state) {
  const deviceClass = state.attributes.device_class;
  const unit = state.attributes.unit_of_measurement || '';
  const icon = state.attributes.icon || SENSOR_ICONS[deviceClass] || SENSOR_ICONS.default;

  return {
    icon,
    labelText: `${state.state}${unit}`,
    cardClass: 'inactive',
  };
}

/**
 * Get display info for a generic entity (fallback)
 * @param {Object} state - Entity state object
 * @returns {Object} Display info
 */
function getDefaultDisplayInfo(state) {
  return {
    icon: state.attributes.icon || 'mdi:help-circle',
    labelText: state.state,
    cardClass: 'inactive',
  };
}

// ==================== Main Service ====================

/**
 * EntityDisplayService class
 * Provides display information for entities based on their type and state
 */
export class EntityDisplayService {
  constructor() {
    this._entityRegistry = [];
    this._labelIds = {};
  }

  /**
   * Set the entity registry for label lookups
   * @param {Array} entityRegistry - Entity registry array
   */
  setEntityRegistry(entityRegistry) {
    this._entityRegistry = entityRegistry || [];
  }

  /**
   * Set the label IDs for label-based display logic
   * @param {Object} labelIds - Object mapping label types to label IDs
   */
  setLabelIds(labelIds) {
    this._labelIds = labelIds || {};
  }

  /**
   * Get labels for an entity
   * @param {string} entityId - Entity ID
   * @returns {Array} Array of label IDs
   */
  getEntityLabels(entityId) {
    const entry = this._entityRegistry.find(e => e.entity_id === entityId);
    return entry?.labels || [];
  }

  /**
   * Check if entity has a specific label
   * @param {string} entityId - Entity ID
   * @param {string} labelType - Label type (e.g., 'motion', 'light')
   * @returns {boolean}
   */
  hasLabel(entityId, labelType) {
    const labelId = this._labelIds[labelType];
    if (!labelId) return false;
    const labels = this.getEntityLabels(entityId);
    return labels.includes(labelId);
  }

  /**
   * Get complete display info for an entity
   * @param {string} entityId - Entity ID
   * @param {Object} state - Entity state object from hass.states
   * @returns {Object|null} Display info or null if not available
   */
  getDisplayInfo(entityId, state) {
    if (!entityId || !state) return null;

    const entityType = entityId.split('.')[0];
    const friendlyName = state.attributes.friendly_name || entityId;

    // Determine display info based on labels first, then entity type
    let displayInfo;

    // Check labels in priority order
    if (this.hasLabel(entityId, 'motion')) {
      displayInfo = getMotionDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'window')) {
      displayInfo = getWindowDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'garage')) {
      displayInfo = getGarageDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'vibration')) {
      displayInfo = getVibrationDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'smoke')) {
      displayInfo = getSmokeDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'temperature')) {
      displayInfo = getTemperatureDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'humidity')) {
      displayInfo = getHumidityDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'light') || entityType === 'light') {
      displayInfo = getLightDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'cover') || entityType === 'cover') {
      displayInfo = getCoverDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'climate') || entityType === 'climate') {
      displayInfo = getClimateDisplayInfo(state);
    } else if (this.hasLabel(entityId, 'lock') || entityType === 'lock') {
      displayInfo = getLockDisplayInfo(state);
    } else {
      // Fall back to entity type
      switch (entityType) {
        case 'binary_sensor':
          displayInfo = getBinarySensorDisplayInfo(state);
          break;
        case 'sensor':
          displayInfo = getSensorDisplayInfo(state);
          break;
        case 'lock':
          displayInfo = getLockDisplayInfo(state);
          break;
        default:
          displayInfo = getDefaultDisplayInfo(state);
      }
    }

    return {
      ...displayInfo,
      friendlyName,
      state,
      entityId,
    };
  }
}

// Singleton instance
let entityDisplayServiceInstance = null;

/**
 * Get the singleton entity display service instance
 * @returns {EntityDisplayService}
 */
export function getEntityDisplayService() {
  if (!entityDisplayServiceInstance) {
    entityDisplayServiceInstance = new EntityDisplayService();
  }
  return entityDisplayServiceInstance;
}

// Export individual display info getters for direct use
export {
  getBinarySensorDisplayInfoByType,
  getMotionDisplayInfo,
  getWindowDisplayInfo,
  getGarageDisplayInfo,
  getVibrationDisplayInfo,
  getSmokeDisplayInfo,
  getTemperatureDisplayInfo,
  getHumidityDisplayInfo,
  getLightDisplayInfo,
  getCoverDisplayInfo,
  getClimateDisplayInfo,
  getLockDisplayInfo,
  getBinarySensorDisplayInfo,
  getSensorDisplayInfo,
  getDefaultDisplayInfo,
  SENSOR_ICONS,
  BINARY_SENSOR_ICONS,
  BINARY_SENSOR_LABELS,
  LOCK_ICONS,
  LOCK_LABELS,
};

export default EntityDisplayService;
