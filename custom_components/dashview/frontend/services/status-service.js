/**
 * Status Service
 * Provides methods for getting status information for the info text row
 * (appliances, motion, garage, windows, lights, covers, batteries, etc.)
 */

import {
  calculateTimeDifference,
  getEnabledEntityIds,
  filterEntitiesByState,
  formatRemainingTime,
} from '../utils/helpers.js';
import { t } from '../utils/i18n.js';

// ==================== Factory Functions ====================

/**
 * Create a status provider for "open too long" scenarios
 * Handles garage, doors, windows, roof windows, covers, locks
 * @param {Object} config - Configuration object
 * @param {string} config.configKey - Key in infoTextConfig (e.g., 'doors')
 * @param {string} config.stateToCheck - Entity state that indicates "open" (e.g., 'on', 'open', 'unlocked')
 * @param {string} config.i18nPrefix - Translation prefix (e.g., 'status.door')
 * @param {string} config.emoji - Emoji for display
 * @param {string} config.icon - MDI icon (optional)
 * @param {string} config.clickAction - Click action
 * @param {number} config.priority - Alert priority
 * @param {string} config.alertPrefix - Alert ID prefix
 * @param {Function} [config.entityFilter] - Optional additional entity filter
 * @param {Function} [config.displayTextFormatter] - Custom format function for display text
 * @returns {Function} Status provider function
 */
function createOpenTooLongProvider(config) {
  const {
    configKey,
    stateToCheck,
    i18nPrefix,
    emoji,
    icon,
    clickAction,
    priority,
    alertPrefix,
    entityFilter,
    displayTextFormatter
  } = config;

  return function(hass, infoTextConfig, enabledEntities, openTooLongMinutes = 30, labelId = null, entityHasLabel = null) {
    if (!hass || !infoTextConfig[configKey]?.enabled) return null;

    let enabledEntityIds = getEnabledEntityIds(enabledEntities);
    
    // Filter by label if provided
    if (labelId && entityHasLabel) {
      enabledEntityIds = enabledEntityIds.filter(id => entityHasLabel(id, labelId));
    }
    
    if (enabledEntityIds.length === 0) return null;

    // Apply additional entity filter if provided
    if (entityFilter) {
      enabledEntityIds = enabledEntityIds.filter(entityId => {
        const state = hass.states[entityId];
        return state && entityFilter(state);
      });
    }

    const openEntities = filterEntitiesByState(enabledEntityIds, hass, stateToCheck);
    if (openEntities.length === 0) return null;

    const count = openEntities.length;
    const now = new Date();

    // Find the longest open duration among all open entities
    let longestOpenMinutes = 0;
    let longestOpenEntity = openEntities[0];
    let longestLastChanged = null;

    openEntities.forEach(entityId => {
      const state = hass.states[entityId];
      if (state && state.last_changed) {
        const lastChanged = new Date(state.last_changed);
        const diffMs = now - lastChanged;
        const openMinutes = Math.floor(diffMs / 60000);
        if (openMinutes > longestOpenMinutes) {
          longestOpenMinutes = openMinutes;
          longestOpenEntity = entityId;
          longestLastChanged = lastChanged;
        }
      }
    });

    // Check if any entity has been open too long
    const isOpenTooLong = longestOpenMinutes >= openTooLongMinutes;

    if (isOpenTooLong) {
      // Format duration text
      const { days, hours, minutes } = calculateTimeDifference(longestOpenMinutes * 60000);
      let durationText = '';
      if (days > 0) {
        durationText = t('common.time.duration_days', { days });
      } else if (hours > 0) {
        durationText = t('common.time.duration_hours', { hours });
      } else {
        durationText = t('common.time.duration_minutes', { minutes: minutes || longestOpenMinutes });
      }

      // Use custom formatter if provided, otherwise use default
      let displayText;
      if (displayTextFormatter) {
        const entityState = hass.states[longestOpenEntity];
        displayText = displayTextFormatter(count, entityState, durationText);
      } else {
        displayText = count === 1 
          ? t(`${i18nPrefix}.open_too_long_single`, { 
              name: hass.states[longestOpenEntity]?.attributes?.friendly_name || longestOpenEntity,
              duration: durationText 
            })
          : t(`${i18nPrefix}.open_too_long_multiple`, { count, duration: durationText });
      }

      return {
        state: "warning",
        prefixText: "",
        badgeText: displayText,
        emoji: emoji,
        badgeIcon: icon,
        suffixText: "",
        clickAction: clickAction,
        isWarning: true,
        priority: priority,
        alertId: count === 1 ? `${alertPrefix}:${longestOpenEntity}` : `${alertPrefix}:multiple`,
        entityLastChanged: longestLastChanged ? longestLastChanged.toISOString() : null,
      };
    }

    // Normal open status (no warning)
    const baseStatus = {
      state: "open",
      prefixText: t('status.general.currently_are'),
      badgeText: `${count}`,
      emoji: emoji,
      badgeIcon: icon,
      suffixText: t('status.general.open_suffix'),
      clickAction: clickAction,
    };

    // Allow custom formatting for normal display
    if (displayTextFormatter) {
      const customText = displayTextFormatter(count, null, null);
      if (customText) {
        baseStatus.badgeText = customText;
      }
    }

    return baseStatus;
  };
}

/**
 * Create a status provider for simple entity counters
 * Handles lights, TVs, etc.
 * @param {Object} config - Configuration object
 * @param {string} config.configKey - Key in infoTextConfig
 * @param {string} config.stateToCheck - Entity state to count (e.g., 'on')
 * @param {string} config.i18nPrefix - Translation prefix
 * @param {string} config.emoji - Emoji for display
 * @param {string} config.icon - MDI icon (optional)
 * @param {string} config.clickAction - Click action
 * @param {Function} [config.entityFilter] - Optional additional entity filter
 * @returns {Function} Status provider function
 */
function createSimpleCounterProvider(config) {
  const {
    configKey,
    stateToCheck,
    i18nPrefix,
    emoji,
    icon,
    clickAction,
    entityFilter
  } = config;

  return function(hass, infoTextConfig, enabledEntities, labelId = null, entityHasLabel = null) {
    if (!hass || !infoTextConfig[configKey]?.enabled) return null;

    let enabledEntityIds = getEnabledEntityIds(enabledEntities);
    
    // Filter by label if provided
    if (labelId && entityHasLabel) {
      enabledEntityIds = enabledEntityIds.filter(id => entityHasLabel(id, labelId));
    }

    // Apply additional entity filter if provided
    if (entityFilter) {
      enabledEntityIds = enabledEntityIds.filter(entityId => {
        const state = hass.states[entityId];
        return state && entityFilter(state);
      });
    }

    const activeEntities = filterEntitiesByState(enabledEntityIds, hass, stateToCheck);
    if (activeEntities.length === 0) return null;

    return {
      state: "active",
      prefixText: t('status.general.currently_are'),
      badgeText: `${activeEntities.length}`,
      emoji: emoji,
      badgeIcon: icon,
      suffixText: t(`${i18nPrefix}.active_suffix`),
      clickAction: clickAction,
    };
  };
}

/**
 * Create a status provider for alert scenarios (always show status)
 * Handles water leak, smoke detection, etc.
 * @param {Object} config - Configuration object
 * @param {string} config.configKey - Key in infoTextConfig
 * @param {string} config.alertState - Entity state that triggers alert (e.g., 'on')
 * @param {string} config.i18nPrefix - Translation prefix
 * @param {string} config.emoji - Emoji for display
 * @param {string} config.icon - MDI icon (optional)
 * @param {string} config.clickAction - Click action
 * @param {number} config.priority - Alert priority
 * @param {string} config.alertPrefix - Alert ID prefix
 * @param {boolean} config.showOkState - Whether to show "all clear" state when no alerts
 * @param {boolean} config.isCritical - Whether alerts are critical (life safety)
 * @returns {Function} Status provider function
 */
function createAlertProvider(config) {
  const {
    configKey,
    alertState,
    i18nPrefix,
    emoji,
    icon,
    clickAction,
    priority,
    alertPrefix,
    showOkState = true,
    isCritical = false
  } = config;

  return function(hass, infoTextConfig, enabledEntities, labelId = null, entityHasLabel = null) {
    if (!hass || !infoTextConfig[configKey]?.enabled) return null;

    let enabledEntityIds = getEnabledEntityIds(enabledEntities);
    
    // Filter by label if provided
    if (labelId && entityHasLabel) {
      enabledEntityIds = enabledEntityIds.filter(id => entityHasLabel(id, labelId));
    }
    
    if (enabledEntityIds.length === 0) return null;

    // Find all sensors that are currently in alert state
    const alertSensors = enabledEntityIds
      .map(entityId => {
        const state = hass.states[entityId];
        if (state && state.state === alertState) {
          return {
            entityId,
            name: state.attributes?.friendly_name || entityId,
            lastChanged: state.last_changed ? new Date(state.last_changed) : null,
          };
        }
        return null;
      })
      .filter(s => s !== null);

    const alertDetected = alertSensors.length > 0;

    if (alertDetected) {
      // Alert state
      const count = alertSensors.length;

      if (count === 1) {
        // Single alert - show location
        const sensor = alertSensors[0];
        return {
          state: 'alert',
          prefixText: t(`${i18nPrefix}.detected`),
          badgeText: sensor.name,
          emoji: emoji,
          badgeIcon: icon,
          suffixText: '!',
          isWarning: true,
          isCritical: isCritical,
          clickAction: clickAction,
          priority: priority,
          alertId: `${alertPrefix}:${sensor.entityId}`,
          entityLastChanged: sensor.lastChanged ? sensor.lastChanged.toISOString() : null,
        };
      } else {
        // Multiple alerts - show count (use earliest lastChanged for aggregate)
        const earliestSensor = alertSensors.reduce((earliest, current) =>
          current.lastChanged && (!earliest.lastChanged || current.lastChanged < earliest.lastChanged) ? current : earliest
        );
        return {
          state: 'alert',
          prefixText: t(`${i18nPrefix}.detected`),
          badgeText: `${count}`,
          emoji: emoji,
          badgeIcon: icon,
          suffixText: t(`${i18nPrefix}.detectedMultiple`) + '!',
          isWarning: true,
          isCritical: isCritical,
          clickAction: clickAction,
          priority: priority,
          alertId: `${alertPrefix}:multiple`,
          entityLastChanged: earliestSensor.lastChanged ? earliestSensor.lastChanged.toISOString() : null,
        };
      }
    } else if (showOkState) {
      // OK state - no alerts
      return {
        state: 'ok',
        prefixText: t(`${i18nPrefix}.allClear`),
        badgeText: '',
        emoji: emoji,
        badgeIcon: icon,
        suffixText: '',
        clickAction: clickAction,
      };
    }

    return null; // No status to show when showOkState is false and no alerts
  };
}

/**
 * Create a status provider for single appliance with operation state
 * Handles washer, dishwasher, dryer
 * @param {Object} config - Configuration object
 * @param {string} config.configKey - Key in infoTextConfig
 * @param {string} config.i18nPrefix - Translation prefix
 * @param {string} config.emoji - Emoji for display
 * @param {Object} config.stateMapping - Map of appliance states to display info
 * @returns {Function} Status provider function
 */
function createApplianceProvider(config) {
  const { configKey, i18nPrefix, emoji, stateMapping } = config;

  return function(hass, infoTextConfig) {
    if (!hass || !infoTextConfig[configKey]?.enabled) return null;

    const entityId = infoTextConfig[configKey].entity;
    const finishTimeEntityId = infoTextConfig[configKey].finishTimeEntity;

    if (!entityId) return null;

    const operationState = hass.states[entityId];
    const finishTime = finishTimeEntityId ? hass.states[finishTimeEntityId] : null;

    if (!operationState) return null;

    const state = operationState.state;
    const stateConfig = stateMapping[state];
    
    if (!stateConfig) return null;

    const result = {
      state: state,
      prefixText: t(`${i18nPrefix}.${stateConfig.prefixKey}`),
      badgeText: stateConfig.useFinishTime && finishTime 
        ? formatRemainingTime(finishTime.state, t(`${i18nPrefix}.ready`)) || "..."
        : t(`${i18nPrefix}.${stateConfig.badgeKey}`),
      emoji: emoji,
      suffixText: ".",
    };

    return result;
  };
}

// ==================== Provider Factory Instances ====================

// Define door entity filter (only include actual door sensors)
const doorEntityFilter = (state) => state.attributes?.device_class === 'door';

// Define light entity filter (exclude non-light domains)
const lightEntityFilter = (state) => {
  const excludedDomains = ['automation', 'script', 'scene'];
  const domain = state.entity_id?.split('.')[0];
  return !excludedDomains.includes(domain);
};

// Define cover display text formatter
const coverDisplayTextFormatter = (count, entityState, durationText) => {
  if (durationText) {
    // Warning state
    return `${count} ${count === 1 ? t('status.covers.label_singular') : t('status.covers.label_plural')}`;
  } else {
    // Normal state  
    return `${count} ${count === 1 ? t('status.covers.label_singular') : t('status.covers.label_plural')}`;
  }
};

// Create provider instances using factories
const garageProvider = createOpenTooLongProvider({
  configKey: 'garage',
  stateToCheck: 'open',
  i18nPrefix: 'status.garage',
  emoji: '',
  icon: 'mdi:garage-open',
  clickAction: 'garage',
  priority: 91,
  alertPrefix: 'garage'
});

const doorProvider = createOpenTooLongProvider({
  configKey: 'doors', 
  stateToCheck: 'on',
  i18nPrefix: 'status.door',
  emoji: '🚪',
  icon: '',
  clickAction: 'security',
  priority: 92,
  alertPrefix: 'door',
  entityFilter: doorEntityFilter
});

const windowProvider = createOpenTooLongProvider({
  configKey: 'windows',
  stateToCheck: 'on', 
  i18nPrefix: 'status.window',
  emoji: '🪟',
  icon: '',
  clickAction: 'security',
  priority: 90,
  alertPrefix: 'window'
});

const roofWindowProvider = createOpenTooLongProvider({
  configKey: 'roofWindows',
  stateToCheck: 'on',
  i18nPrefix: 'status.roofWindow',
  emoji: '🪟',
  icon: '',
  clickAction: 'security',
  priority: 89,
  alertPrefix: 'roofWindow'
});

const coverProvider = createOpenTooLongProvider({
  configKey: 'covers',
  stateToCheck: 'open',
  i18nPrefix: 'status.covers',
  emoji: '',
  icon: 'mdi:window-shutter-open',
  clickAction: 'covers',
  priority: 88,
  alertPrefix: 'cover',
  displayTextFormatter: coverDisplayTextFormatter
});

const lockProvider = createOpenTooLongProvider({
  configKey: 'locks',
  stateToCheck: 'unlocked',
  i18nPrefix: 'status.lock',
  emoji: '',
  icon: 'mdi:lock-open',
  clickAction: 'security', 
  priority: 93,
  alertPrefix: 'lock'
});

const lightsProvider = createSimpleCounterProvider({
  configKey: 'lights',
  stateToCheck: 'on',
  i18nPrefix: 'status.lights',
  emoji: '💡',
  icon: '',
  clickAction: 'lights',
  entityFilter: lightEntityFilter
});

const tvProvider = createSimpleCounterProvider({
  configKey: 'tvs',
  stateToCheck: 'on',
  i18nPrefix: 'status.tvs',
  emoji: '📺',
  icon: '',
  clickAction: 'tvs'
});

const waterLeakProvider = createAlertProvider({
  configKey: 'water',
  alertState: 'on',
  i18nPrefix: 'status.water',
  emoji: '💧',
  icon: '',
  clickAction: 'water',
  priority: 100,
  alertPrefix: 'water',
  showOkState: true,
  isCritical: false
});

const smokeProvider = createAlertProvider({
  configKey: 'smoke',
  alertState: 'on',
  i18nPrefix: 'status.smoke',
  emoji: '',
  icon: 'mdi:smoke-detector-variant-alert',
  clickAction: 'smoke',
  priority: 100,
  alertPrefix: 'smoke',
  showOkState: false, // Only show when smoke detected
  isCritical: true
});

const washerProvider = createApplianceProvider({
  configKey: 'washer',
  i18nPrefix: 'status.appliances.washer',
  emoji: '👕',
  stateMapping: {
    run: { 
      prefixKey: 'running',
      badgeKey: 'ready',
      useFinishTime: true
    },
    finished: {
      prefixKey: 'finished', 
      badgeKey: 'ready',
      useFinishTime: false
    }
  }
});

const dishwasherProvider = createApplianceProvider({
  configKey: 'dishwasher',
  i18nPrefix: 'status.appliances.dishwasher', 
  emoji: '🍽️',
  stateMapping: {
    run: {
      prefixKey: 'running',
      badgeKey: 'ready', 
      useFinishTime: true
    },
    finished: {
      prefixKey: 'finished',
      badgeKey: 'ready',
      useFinishTime: false
    }
  }
});

const dryerProvider = createApplianceProvider({
  configKey: 'dryer',
  i18nPrefix: 'status.appliances.dryer',
  emoji: '👔', 
  stateMapping: {
    run: {
      prefixKey: 'running',
      badgeKey: 'ready',
      useFinishTime: true  
    },
    finished: {
      prefixKey: 'finished',
      badgeKey: 'ready',
      useFinishTime: false
    }
  }
});

// ==================== Legacy Provider Functions (maintain exact API) ====================

/**
 * Get washer status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getWasherStatus(hass, infoTextConfig) {
  return washerProvider(hass, infoTextConfig);
}

/**
 * Get water leak status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledWaterLeakSensors - Map of enabled water leak sensor IDs
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors, labelId = null, entityHasLabel = null) {
  return waterLeakProvider(hass, infoTextConfig, enabledWaterLeakSensors, labelId, entityHasLabel);
}

/**
 * Get smoke detector status for info text row
 * Only shows when smoke is actively detected (life safety critical)
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledSmokeSensors - Map of enabled smoke sensor IDs
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getSmokeStatus(hass, infoTextConfig, enabledSmokeSensors, labelId = null, entityHasLabel = null) {
  return smokeProvider(hass, infoTextConfig, enabledSmokeSensors, labelId, entityHasLabel);
}

/**
 * Get garage status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledGarages - Map of enabled garage IDs
 * @param {number} garageOpenTooLongMinutes - Minutes threshold for open-too-long warning
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getGarageStatus(hass, infoTextConfig, enabledGarages, garageOpenTooLongMinutes = 30, labelId = null, entityHasLabel = null) {
  return garageProvider(hass, infoTextConfig, enabledGarages, garageOpenTooLongMinutes, labelId, entityHasLabel);
}

/**
 * Get door status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledDoors - Map of enabled door entity IDs
 * @param {number} doorOpenTooLongMinutes - Minutes threshold for open-too-long warning
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getDoorStatus(hass, infoTextConfig, enabledDoors, doorOpenTooLongMinutes = 30, labelId = null, entityHasLabel = null) {
  return doorProvider(hass, infoTextConfig, enabledDoors, doorOpenTooLongMinutes, labelId, entityHasLabel);
}

/**
 * Get windows status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledWindows - Map of enabled window IDs
 * @param {number} windowOpenTooLongMinutes - Minutes threshold for open-too-long warning
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getWindowsStatus(hass, infoTextConfig, enabledWindows, windowOpenTooLongMinutes = 120, labelId = null, entityHasLabel = null) {
  return windowProvider(hass, infoTextConfig, enabledWindows, windowOpenTooLongMinutes, labelId, entityHasLabel);
}

/**
 * Get roof windows status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledRoofWindows - Map of enabled roof window IDs
 * @param {number} roofWindowOpenTooLongMinutes - Minutes threshold for open-too-long warning
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getRoofWindowStatus(hass, infoTextConfig, enabledRoofWindows, roofWindowOpenTooLongMinutes = 120, labelId = null, entityHasLabel = null) {
  return roofWindowProvider(hass, infoTextConfig, enabledRoofWindows, roofWindowOpenTooLongMinutes, labelId, entityHasLabel);
}

/**
 * Get lights on status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledLights - Map of enabled light IDs
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getLightsOnStatus(hass, infoTextConfig, enabledLights, labelId = null, entityHasLabel = null) {
  return lightsProvider(hass, infoTextConfig, enabledLights, labelId, entityHasLabel);
}

/**
 * Get covers status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledCovers - Map of enabled cover IDs
 * @param {number} coverOpenTooLongMinutes - Minutes threshold for open-too-long warning
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getCoversStatus(hass, infoTextConfig, enabledCovers, coverOpenTooLongMinutes = 240, labelId = null, entityHasLabel = null) {
  return coverProvider(hass, infoTextConfig, enabledCovers, coverOpenTooLongMinutes, labelId, entityHasLabel);
}

/**
 * Get lock status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledLocks - Map of enabled lock IDs
 * @param {number} lockUnlockedTooLongMinutes - Minutes threshold for unlocked-too-long warning
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getLockStatus(hass, infoTextConfig, enabledLocks, lockUnlockedTooLongMinutes = 30, labelId = null, entityHasLabel = null) {
  return lockProvider(hass, infoTextConfig, enabledLocks, lockUnlockedTooLongMinutes, labelId, entityHasLabel);
}

/**
 * Get TVs status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledTVs - Map of enabled TV IDs
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getTVsStatus(hass, infoTextConfig, enabledTVs, labelId = null, entityHasLabel = null) {
  return tvProvider(hass, infoTextConfig, enabledTVs, labelId, entityHasLabel);
}

/**
 * Get dishwasher status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getDishwasherStatus(hass, infoTextConfig) {
  return dishwasherProvider(hass, infoTextConfig);
}

/**
 * Get dryer status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getDryerStatus(hass, infoTextConfig) {
  return dryerProvider(hass, infoTextConfig);
}

// ==================== Standalone Provider Functions ====================

/**
 * Get motion status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledMotionSensors - Map of enabled motion sensor IDs
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getMotionStatus(hass, infoTextConfig, enabledMotionSensors, labelId = null, entityHasLabel = null) {
  if (!hass || !infoTextConfig.motion?.enabled) return null;

  let enabledMotionSensorIds = getEnabledEntityIds(enabledMotionSensors);
  if (labelId && entityHasLabel) {
    enabledMotionSensorIds = enabledMotionSensorIds.filter(id => entityHasLabel(id, labelId));
  }

  if (enabledMotionSensorIds.length === 0) return null;

  // Find all motion sensors that are currently "on" and get their last_changed times
  const activeMotionSensors = enabledMotionSensorIds
    .map(entityId => {
      const state = hass.states[entityId];
      if (state && state.state === "on" && state.last_changed) {
        return {
          entityId,
          lastChanged: new Date(state.last_changed),
        };
      }
      return null;
    })
    .filter(s => s !== null);

  const anyMotionDetected = activeMotionSensors.length > 0;

  let timeText = "";
  if (anyMotionDetected) {
    // Find the sensor that has been "on" the longest (earliest last_changed)
    const longestOnSensor = activeMotionSensors.reduce((oldest, current) => {
      return current.lastChanged < oldest.lastChanged ? current : oldest;
    });

    const now = new Date();
    const diffMs = now - longestOnSensor.lastChanged;
    const { days, hours, minutes } = calculateTimeDifference(diffMs);

    if (days > 0) {
      timeText = t('common.time.since_days', { days });
    } else if (hours > 0) {
      timeText = t('common.time.since_hours', { hours });
    } else if (minutes > 0) {
      timeText = t('common.time.since_minutes', { minutes });
    } else {
      timeText = t('common.time.now');
    }

    return {
      state: "motion",
      prefixText: t('status.motion.prefix'),
      badgeText: timeText,
      emoji: "🏡",
      suffixText: t('status.motion.suffix_active'),
      clickAction: "motion",
    };
  } else {
    // No motion - find when the last motion sensor turned off (most recent last_changed among "off" sensors)
    const offMotionSensors = enabledMotionSensorIds
      .map(entityId => {
        const state = hass.states[entityId];
        if (state && state.state === "off" && state.last_changed) {
          return {
            entityId,
            lastChanged: new Date(state.last_changed),
          };
        }
        return null;
      })
      .filter(s => s !== null);

    if (offMotionSensors.length === 0) return null;

    // Find the most recent "off" time (latest last_changed among "off" sensors)
    const mostRecentOffSensor = offMotionSensors.reduce((latest, current) => {
      return current.lastChanged > latest.lastChanged ? current : latest;
    });

    const now = new Date();
    const diffMs = now - mostRecentOffSensor.lastChanged;
    const { days, hours, minutes } = calculateTimeDifference(diffMs);

    if (days > 0) {
      timeText = t('common.time.since_days', { days });
    } else if (hours > 0) {
      timeText = t('common.time.since_hours', { hours });
    } else if (minutes > 0) {
      timeText = t('common.time.since_minutes', { minutes });
    } else {
      timeText = t('common.time.now');
    }

    return {
      state: "no_motion",
      prefixText: t('status.motion.prefix'),
      badgeText: timeText,
      emoji: "🏡",
      suffixText: t('status.motion.suffix_inactive'),
      clickAction: "motion",
    };
  }
}

/**
 * Get vacuum status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getVacuumStatus(hass, infoTextConfig) {
  if (!hass || !infoTextConfig.vacuum?.enabled) return null;

  const entityId = infoTextConfig.vacuum.entity;
  if (!entityId) return null;

  const state = hass.states[entityId];
  if (!state) return null;

  const currentState = state.state;

  // Define status for different vacuum states
  const stateMapping = {
    cleaning: {
      prefixText: t('status.vacuum.prefix'),
      badgeText: t('status.vacuum.cleaning'),
      emoji: '🤖',
      suffixText: '.',
      isActive: true
    },
    returning: {
      prefixText: t('status.vacuum.prefix'),
      badgeText: t('status.vacuum.returning'),
      emoji: '🤖',
      suffixText: '.',
      isActive: true
    },
    error: {
      prefixText: t('status.vacuum.prefix'),
      badgeText: t('status.vacuum.error'),
      emoji: '🤖',
      suffixText: '!',
      isWarning: true
    }
  };

  const stateInfo = stateMapping[currentState];
  if (!stateInfo) return null;

  return {
    state: currentState,
    prefixText: stateInfo.prefixText,
    badgeText: stateInfo.badgeText,
    emoji: stateInfo.emoji,
    suffixText: stateInfo.suffixText,
    isWarning: stateInfo.isWarning || false,
    clickAction: 'vacuum',
  };
}

/**
 * Get battery low status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getBatteryLowStatus(hass, infoTextConfig) {
  if (!hass || !infoTextConfig.battery?.enabled) return null;

  const batteryThreshold = infoTextConfig.battery?.threshold || 20;
  const lowBatteryEntities = [];

  // Find all battery entities with low battery
  Object.values(hass.states).forEach(state => {
    if (state.attributes?.device_class === 'battery' && 
        state.attributes?.unit_of_measurement === '%') {
      const batteryLevel = parseFloat(state.state);
      if (!isNaN(batteryLevel) && batteryLevel <= batteryThreshold && batteryLevel >= 0) {
        lowBatteryEntities.push({
          entity_id: state.entity_id,
          name: state.attributes?.friendly_name || state.entity_id,
          level: batteryLevel
        });
      }
    }
  });

  if (lowBatteryEntities.length === 0) return null;

  const count = lowBatteryEntities.length;
  const lowestBattery = lowBatteryEntities.reduce((lowest, current) => 
    current.level < lowest.level ? current : lowest
  );

  if (count === 1) {
    return {
      state: 'low_battery',
      prefixText: '',
      badgeText: t('status.battery.low_single', { 
        name: lowestBattery.name, 
        level: lowestBattery.level 
      }),
      emoji: '🔋',
      suffixText: '',
      isWarning: true,
      clickAction: 'battery',
    };
  } else {
    return {
      state: 'low_battery',
      prefixText: '',
      badgeText: t('status.battery.low_multiple', { 
        count, 
        lowestLevel: lowestBattery.level 
      }),
      emoji: '🔋', 
      suffixText: '',
      isWarning: true,
      clickAction: 'battery',
    };
  }
}

/**
 * Get appliances status from new appliance system
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Array} appliancesWithHomeStatus - Array of appliances with showInHomeStatus enabled
 * @param {Function} getApplianceStatus - Function to get appliance status
 * @returns {Array} Array of status objects
 */
export function getAppliancesStatus(hass, infoTextConfig, appliancesWithHomeStatus = [], getApplianceStatus = null) {
  if (!hass || !infoTextConfig.appliances?.enabled || !getApplianceStatus) {
    return [];
  }

  // Get status for all appliances that should show in home status
  return appliancesWithHomeStatus
    .map(appliance => getApplianceStatus(appliance.id))
    .filter(status => status !== null);
}

/**
 * Get alarm status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration  
 * @param {string} alarmEntity - Alarm control panel entity ID
 * @returns {Object|null} Status object or null
 */
export function getAlarmStatus(hass, infoTextConfig, alarmEntity = null) {
  if (!hass || !infoTextConfig.alarm?.enabled) return null;

  const resolvedEntity = alarmEntity || infoTextConfig.alarm?.entity;
  if (!resolvedEntity) return null;

  const state = hass.states[resolvedEntity];
  if (!state) return null;

  const alarmState = state.state;

  // Define state mapping for different alarm states
  const stateMapping = {
    disarmed: {
      prefixText: 'Alarm ist',
      badgeText: 'unscharf',
      emoji: '🛡️',
      isWarning: false
    },
    armed_home: {
      prefixText: 'Alarm ist',
      badgeText: 'scharf (Anwesend)',
      emoji: '🛡️',
      isWarning: false
    },
    armed_away: {
      prefixText: 'Alarm ist',
      badgeText: 'scharf (Abwesend)',
      emoji: '🛡️',
      isWarning: false
    },
    armed_night: {
      prefixText: 'Alarm ist',
      badgeText: 'scharf (Nacht)',
      emoji: '🛡️',
      isWarning: false
    },
    triggered: {
      prefixText: '⚠️',
      badgeText: 'ALARM AUSGELÖST',
      emoji: '🚨',
      suffixText: '!',
      isWarning: true,
      isCritical: true,
      priority: 100
    }
  };

  const stateInfo = stateMapping[alarmState];
  if (!stateInfo) return null;

  return {
    state: alarmState,
    prefixText: stateInfo.prefixText,
    badgeText: stateInfo.badgeText,
    emoji: stateInfo.emoji,
    suffixText: stateInfo.suffixText || '.',
    isWarning: stateInfo.isWarning || false,
    isCritical: stateInfo.isCritical || false,
    priority: stateInfo.priority || 50,
    clickAction: 'security',
    alertId: alarmState === 'triggered' ? `alarm:${resolvedEntity}` : null,
    entityLastChanged: state.last_changed || null,
  };
}

/**
 * Get all status items for the info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledEntities - Object containing all enabled entity maps
 * @param {Object} labelIds - Object containing label IDs for each entity type
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @param {Array} appliancesWithHomeStatus - Optional array of appliances with showInHomeStatus enabled
 * @param {Function} getApplianceStatus - Optional function to get appliance status
 * @param {Object} openTooLongThresholds - Thresholds for open-too-long alerts
 * @param {string} alarmEntity - Optional alarm control panel entity ID
 * @returns {Array} Array of active status objects
 */
export function getAllStatusItems(hass, infoTextConfig, enabledEntities, labelIds = {}, entityHasLabel = null, appliancesWithHomeStatus = [], getApplianceStatus = null, openTooLongThresholds = {}, alarmEntity = null) {
  const {
    enabledMotionSensors = {},
    enabledGarages = {},
    enabledWindows = {},
    enabledDoors = {},
    enabledRoofWindows = {},
    enabledLights = {},
    enabledCovers = {},
    enabledTVs = {},
    enabledLocks = {},
    enabledWaterLeakSensors = {},
    enabledSmokeSensors = {},
  } = enabledEntities;

  const {
    motionLabelId = null,
    garageLabelId = null,
    doorLabelId = null,
    windowLabelId = null,
    roofWindowLabelId = null,
    lightLabelId = null,
    coverLabelId = null,
    tvLabelId = null,
    lockLabelId = null,
    waterLeakLabelId = null,
    smokeLabelId = null,
  } = labelIds;

  const {
    doorOpenTooLongMinutes = 30,
    windowOpenTooLongMinutes = 120,
    garageOpenTooLongMinutes = 30,
    roofWindowOpenTooLongMinutes = 120,
    coverOpenTooLongMinutes = 240,
    lockUnlockedTooLongMinutes = 30,
  } = openTooLongThresholds;

  // Get appliance status items from new system
  const applianceStatusItems = getAppliancesStatus(hass, infoTextConfig, appliancesWithHomeStatus, getApplianceStatus);

  return [
    // Water leak and smoke are highest priority (life safety)
    getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors, waterLeakLabelId, entityHasLabel),
    getSmokeStatus(hass, infoTextConfig, enabledSmokeSensors, smokeLabelId, entityHasLabel),
    // Alarm status (high priority, especially when triggered)
    getAlarmStatus(hass, infoTextConfig, alarmEntity),
    // Door/lock/garage/window open-too-long alerts (security concerns)
    getDoorStatus(hass, infoTextConfig, enabledDoors, doorOpenTooLongMinutes, doorLabelId, entityHasLabel),
    getLockStatus(hass, infoTextConfig, enabledLocks, lockUnlockedTooLongMinutes, lockLabelId, entityHasLabel),
    getGarageStatus(hass, infoTextConfig, enabledGarages, garageOpenTooLongMinutes, garageLabelId, entityHasLabel),
    getWindowsStatus(hass, infoTextConfig, enabledWindows, windowOpenTooLongMinutes, windowLabelId, entityHasLabel),
    getRoofWindowStatus(hass, infoTextConfig, enabledRoofWindows, roofWindowOpenTooLongMinutes, roofWindowLabelId, entityHasLabel),
    getMotionStatus(hass, infoTextConfig, enabledMotionSensors, motionLabelId, entityHasLabel),
    getLightsOnStatus(hass, infoTextConfig, enabledLights, lightLabelId, entityHasLabel),
    getCoversStatus(hass, infoTextConfig, enabledCovers, coverOpenTooLongMinutes, coverLabelId, entityHasLabel),
    getTVsStatus(hass, infoTextConfig, enabledTVs, tvLabelId, entityHasLabel),
    ...applianceStatusItems,
    getBatteryLowStatus(hass, infoTextConfig),
  ].filter(s => s !== null);
}

export default {
  getWasherStatus,
  getWaterLeakStatus,
  getSmokeStatus,
  getMotionStatus,
  getGarageStatus,
  getDoorStatus,
  getWindowsStatus,
  getRoofWindowStatus,
  getLightsOnStatus,
  getCoversStatus,
  getLockStatus,
  getTVsStatus,
  getDishwasherStatus,
  getDryerStatus,
  getVacuumStatus,
  getBatteryLowStatus,
  getAppliancesStatus,
  getAlarmStatus,
  getAllStatusItems,
};