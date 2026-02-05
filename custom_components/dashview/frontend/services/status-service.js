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

// ==================== Internal Helpers ====================

/**
 * Prepare filtered entity IDs with enabled check and label filtering
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {string} configKey - Key in infoTextConfig to check enabled state
 * @param {Object} enabledEntities - Map of enabled entity IDs
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {string[]|null} Filtered entity IDs or null if disabled/empty
 */
function _prepareEntityIds(hass, infoTextConfig, configKey, enabledEntities, labelId, entityHasLabel) {
  if (!hass || !infoTextConfig[configKey]?.enabled) return null;
  let ids = getEnabledEntityIds(enabledEntities);
  if (labelId && entityHasLabel) {
    ids = ids.filter(id => entityHasLabel(id, labelId));
  }
  return ids.length > 0 ? ids : null;
}

/**
 * Find the entity that has been in its current state the longest
 * @param {string[]} entityIds - Array of entity IDs
 * @param {Object} hass - Home Assistant instance
 * @returns {{ entity: string, minutes: number, lastChanged: Date|null }}
 */
function _findLongestDuration(entityIds, hass) {
  const now = new Date();
  let entity = entityIds[0];
  let minutes = 0;
  let lastChanged = null;

  entityIds.forEach(entityId => {
    const state = hass.states[entityId];
    if (state?.last_changed) {
      const changed = new Date(state.last_changed);
      const mins = Math.floor((now - changed) / 60000);
      if (mins > minutes) {
        minutes = mins;
        entity = entityId;
        lastChanged = changed;
      }
    }
  });

  return { entity, minutes, lastChanged };
}

/**
 * Format a duration in minutes to a human-readable i18n string
 * @param {number} totalMinutes - Duration in minutes
 * @returns {string} Formatted duration text
 */
function _formatDurationText(totalMinutes) {
  const { days, hours, minutes } = calculateTimeDifference(totalMinutes * 60000);
  if (days > 0) return t('common.time.duration_days', { days });
  if (hours > 0) return t('common.time.duration_hours', { hours });
  return t('common.time.duration_minutes', { minutes: minutes || totalMinutes });
}

/**
 * Find sensors in an alert state, returning name and lastChanged for each
 * @param {string[]} entityIds - Array of entity IDs
 * @param {Object} hass - Home Assistant instance
 * @param {string} alertState - State value that indicates alert (e.g., 'on')
 * @returns {Array<{entityId: string, name: string, lastChanged: Date|null}>}
 */
function _findAlertSensors(entityIds, hass, alertState) {
  return entityIds
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
}

/**
 * Get the earliest lastChanged sensor from a list (for aggregate alerts)
 * @param {Array<{lastChanged: Date|null}>} sensors - Array of sensor objects
 * @returns {Object} The sensor with the earliest lastChanged
 */
function _getEarliestSensor(sensors) {
  return sensors.reduce((earliest, current) =>
    current.lastChanged && (!earliest.lastChanged || current.lastChanged < earliest.lastChanged) ? current : earliest
  );
}

// ==================== Status Provider Functions ====================

/**
 * Get washer status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getWasherStatus(hass, infoTextConfig) {
  if (!hass || !infoTextConfig.washer?.enabled) return null;

  const entityId = infoTextConfig.washer.entity;
  const finishTimeEntityId = infoTextConfig.washer.finishTimeEntity;

  if (!entityId) return null;

  const operationState = hass.states[entityId];
  const finishTime = finishTimeEntityId ? hass.states[finishTimeEntityId] : null;

  if (!operationState) return null;

  const state = operationState.state;

  if (state === "run") {
    // Calculate remaining time from finish time
    const timeText = finishTime ? formatRemainingTime(finishTime.state, t('common.status.ready')) : "";

    return {
      state: "running",
      prefixText: t('status.appliances.washer.running'),
      badgeText: timeText || "...",
      emoji: "👕",
      suffixText: ".",
    };
  } else if (state === "finished") {
    return {
      state: "finished",
      prefixText: t('status.appliances.washer.finished'),
      badgeText: t('status.appliances.washer.ready'),
      emoji: "👕",
      suffixText: ".",
    };
  }

  return null;
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
  const ids = _prepareEntityIds(hass, infoTextConfig, 'water', enabledWaterLeakSensors, labelId, entityHasLabel);
  if (!ids) return null;

  const wetSensors = _findAlertSensors(ids, hass, 'on');

  if (wetSensors.length > 0) {
    const count = wetSensors.length;

    if (count === 1) {
      const sensor = wetSensors[0];
      return {
        state: 'alert',
        prefixText: t('status.water.leakDetected'),
        badgeText: sensor.name,
        emoji: '💧',
        suffixText: '!',
        isWarning: true,
        clickAction: 'water',
        priority: 100,
        alertId: `water:${sensor.entityId}`,
        entityLastChanged: sensor.lastChanged ? sensor.lastChanged.toISOString() : null,
      };
    } else {
      const earliest = _getEarliestSensor(wetSensors);
      return {
        state: 'alert',
        prefixText: t('status.water.leakDetected'),
        badgeText: `${count}`,
        emoji: '💧',
        suffixText: t('status.water.leaksDetected') + '!',
        isWarning: true,
        clickAction: 'water',
        priority: 100,
        alertId: 'water:multiple',
        entityLastChanged: earliest.lastChanged ? earliest.lastChanged.toISOString() : null,
      };
    }
  } else {
    return {
      state: 'ok',
      prefixText: t('status.water.noLeaks'),
      badgeText: '',
      emoji: '💧',
      suffixText: '',
      clickAction: 'water',
    };
  }
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
  const ids = _prepareEntityIds(hass, infoTextConfig, 'smoke', enabledSmokeSensors, labelId, entityHasLabel);
  if (!ids) return null;

  const activeSensors = _findAlertSensors(ids, hass, 'on');
  if (activeSensors.length === 0) return null;

  const count = activeSensors.length;

  if (count === 1) {
    const sensor = activeSensors[0];
    return {
      state: 'alert',
      prefixText: t('status.smoke.detected'),
      badgeText: sensor.name,
      badgeIcon: 'mdi:smoke-detector-variant-alert',
      suffixText: '!',
      isWarning: true,
      isCritical: true,
      clickAction: 'smoke',
      priority: 100,
      alertId: `smoke:${sensor.entityId}`,
      entityLastChanged: sensor.lastChanged ? sensor.lastChanged.toISOString() : null,
    };
  } else {
    const earliest = _getEarliestSensor(activeSensors);
    return {
      state: 'alert',
      prefixText: t('status.smoke.detected'),
      badgeText: `${count}`,
      badgeIcon: 'mdi:smoke-detector-variant-alert',
      suffixText: t('status.smoke.detectedMultiple') + '!',
      isWarning: true,
      isCritical: true,
      clickAction: 'smoke',
      priority: 100,
      alertId: 'smoke:multiple',
      entityLastChanged: earliest.lastChanged ? earliest.lastChanged.toISOString() : null,
    };
  }
}

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
  const enabledMotionSensorIds = _prepareEntityIds(hass, infoTextConfig, 'motion', enabledMotionSensors, labelId, entityHasLabel);
  if (!enabledMotionSensorIds) return null;

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

    if (offMotionSensors.length > 0) {
      // Find the most recently changed "off" sensor (latest last_changed = when motion stopped)
      const mostRecentOff = offMotionSensors.reduce((newest, current) => {
        return current.lastChanged > newest.lastChanged ? current : newest;
      });

      const now = new Date();
      const diffMs = now - mostRecentOff.lastChanged;
      const { days, hours, minutes } = calculateTimeDifference(diffMs);

      if (days > 0) {
        timeText = t('common.time.ago_days', { days });
      } else if (hours > 0) {
        timeText = t('common.time.ago_hours', { hours });
      } else if (minutes > 0) {
        timeText = t('common.time.ago_minutes', { minutes });
      } else {
        timeText = t('common.time.now');
      }
    }

    return {
      state: "no_motion",
      prefixText: t('status.motion.prefix_last'),
      badgeText: timeText || "...",
      emoji: "🏡",
      suffixText: t('status.motion.suffix_inactive'),
      clickAction: "motion",
    };
  }
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
  const ids = _prepareEntityIds(hass, infoTextConfig, 'garage', enabledGarages, labelId, entityHasLabel);
  if (!ids) return null;

  const openGarages = filterEntitiesByState(ids, hass, 'open');
  if (openGarages.length === 0) return null;

  const count = openGarages.length;
  const { entity: longestEntity, minutes: longestMinutes, lastChanged } = _findLongestDuration(openGarages, hass);

  if (longestMinutes >= garageOpenTooLongMinutes) {
    return {
      state: "warning",
      prefixText: "",
      badgeText: t('status.garage.open_too_long', { duration: _formatDurationText(longestMinutes) }),
      badgeIcon: "mdi:garage-alert",
      suffixText: "",
      clickAction: "garage",
      isWarning: true,
      priority: 91,
      alertId: count === 1 ? `garage:${longestEntity}` : 'garage:multiple',
      entityLastChanged: lastChanged ? lastChanged.toISOString() : null,
    };
  }

  return {
    state: "open",
    prefixText: t('status.general.currently_are'),
    badgeText: `${count}`,
    badgeIcon: "mdi:garage-open",
    suffixText: t('status.general.open_suffix'),
    clickAction: "garage",
  };
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
  const ids = _prepareEntityIds(hass, infoTextConfig, 'doors', enabledDoors, labelId, entityHasLabel);
  if (!ids) return null;

  // Filter for binary_sensors with device_class: door that are 'on' (open)
  const openDoors = ids
    .map(entityId => {
      const state = hass.states[entityId];
      if (!state || state.state !== 'on') return null;
      if (state.attributes?.device_class !== 'door') return null;
      return {
        entityId,
        name: state.attributes?.friendly_name || entityId,
        lastChanged: state.last_changed ? new Date(state.last_changed) : null,
      };
    })
    .filter(d => d !== null);

  if (openDoors.length === 0) return null;

  // Find the door that's been open longest
  const now = new Date();
  let longestOpenDoor = openDoors[0];
  let longestOpenMinutes = 0;
  openDoors.forEach(door => {
    if (door.lastChanged) {
      const mins = Math.floor((now - door.lastChanged) / 60000);
      if (mins > longestOpenMinutes) {
        longestOpenMinutes = mins;
        longestOpenDoor = door;
      }
    }
  });

  if (longestOpenMinutes >= doorOpenTooLongMinutes) {
    const durationText = _formatDurationText(longestOpenMinutes);
    const displayText = openDoors.length === 1
      ? t('status.door.open_too_long_single', { name: longestOpenDoor.name, duration: durationText })
      : t('status.door.open_too_long_multiple', { count: openDoors.length, duration: durationText });

    return {
      state: "warning",
      prefixText: "",
      badgeText: displayText,
      emoji: "🚪",
      suffixText: "",
      clickAction: "security",
      isWarning: true,
      priority: 92,
      alertId: openDoors.length === 1 ? `door:${longestOpenDoor.entityId}` : 'door:multiple',
      entityLastChanged: longestOpenDoor.lastChanged ? longestOpenDoor.lastChanged.toISOString() : null,
    };
  }

  return {
    state: "open",
    prefixText: t('status.general.currently_are'),
    badgeText: `${openDoors.length}`,
    emoji: "🚪",
    suffixText: t('status.door.open_suffix'),
    clickAction: "security",
  };
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
  const ids = _prepareEntityIds(hass, infoTextConfig, 'windows', enabledWindows, labelId, entityHasLabel);
  if (!ids) return null;

  const openWindows = filterEntitiesByState(ids, hass, 'on');
  if (openWindows.length === 0) return null;

  const count = openWindows.length;
  const { entity: longestEntity, minutes: longestMinutes, lastChanged } = _findLongestDuration(openWindows, hass);

  if (longestMinutes >= windowOpenTooLongMinutes) {
    return {
      state: "warning",
      prefixText: "",
      badgeText: `${count}`,
      emoji: "🪟",
      suffixText: ` ${t('status.general.open_suffix')} (${_formatDurationText(longestMinutes)})`,
      clickAction: "security",
      isWarning: true,
      priority: 90,
      alertId: count === 1 ? `window:${longestEntity}` : 'window:multiple',
      entityLastChanged: lastChanged ? lastChanged.toISOString() : null,
    };
  }

  return {
    state: "open",
    prefixText: t('status.general.currently_are'),
    badgeText: `${count}`,
    emoji: "🪟",
    suffixText: t('status.general.open_suffix'),
    clickAction: "security",
  };
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
  let ids = _prepareEntityIds(hass, infoTextConfig, 'lights', enabledLights, labelId, entityHasLabel);
  if (!ids) return null;

  // Exclude non-light domains (automation, script, scene with light label)
  const excludedDomains = ['automation', 'script', 'scene'];
  ids = ids.filter(id => !excludedDomains.includes(id.split('.')[0]));
  if (ids.length === 0) return null;

  const lightsOn = filterEntitiesByState(ids, hass, 'on');
  if (lightsOn.length === 0) return null;

  return {
    state: "on",
    prefixText: t('status.lights.are_on'),
    badgeText: `${lightsOn.length}`,
    emoji: "💡",
    suffixText: t('status.lights.suffix'),
    clickAction: "lights",
  };
}

/**
 * Get roof window status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledRoofWindows - Map of enabled roof window IDs
 * @param {number} roofWindowOpenTooLongMinutes - Minutes threshold for open-too-long warning
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getRoofWindowStatus(hass, infoTextConfig, enabledRoofWindows, roofWindowOpenTooLongMinutes = 120, labelId = null, entityHasLabel = null) {
  const ids = _prepareEntityIds(hass, infoTextConfig, 'roofWindows', enabledRoofWindows, labelId, entityHasLabel);
  if (!ids) return null;

  const openRoofWindows = filterEntitiesByState(ids, hass, 'on');
  if (openRoofWindows.length === 0) return null;

  const count = openRoofWindows.length;
  const { entity: longestEntity, minutes: longestMinutes, lastChanged } = _findLongestDuration(openRoofWindows, hass);

  if (longestMinutes >= roofWindowOpenTooLongMinutes) {
    return {
      state: "warning",
      prefixText: "",
      badgeText: `${count}`,
      badgeIcon: "mdi:window-open-variant",
      suffixText: ` ${t('status.roofWindow.open_too_long')} (${_formatDurationText(longestMinutes)})`,
      clickAction: "security",
      isWarning: true,
      priority: 89,
      alertId: count === 1 ? `roofWindow:${longestEntity}` : 'roofWindow:multiple',
      entityLastChanged: lastChanged ? lastChanged.toISOString() : null,
    };
  }

  return {
    state: "open",
    prefixText: t('status.general.currently_are'),
    badgeText: `${count}`,
    badgeIcon: "mdi:window-open-variant",
    suffixText: t('status.roofWindow.open_suffix'),
    clickAction: "security",
  };
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
  let ids = _prepareEntityIds(hass, infoTextConfig, 'covers', enabledCovers, labelId, entityHasLabel);
  if (!ids) return null;

  // Only include actual cover domain entities (not automations, etc.)
  ids = ids.filter(id => id.startsWith('cover.'));
  if (ids.length === 0) return null;

  // Covers use !== 'closed' (catches open, opening, closing, stopped)
  const openCovers = ids.filter(entityId => {
    const state = hass.states[entityId];
    return state && state.state !== 'closed';
  });
  if (openCovers.length === 0) return null;

  const count = openCovers.length;
  const coverLabel = count === 1 ? t('status.covers.label_singular') : t('status.covers.label_plural');
  const { entity: longestEntity, minutes: longestMinutes, lastChanged } = _findLongestDuration(openCovers, hass);

  if (longestMinutes >= coverOpenTooLongMinutes) {
    return {
      state: "warning",
      prefixText: "",
      badgeText: `${count} ${coverLabel}`,
      badgeIcon: "mdi:window-shutter-alert",
      suffixText: ` ${t('status.general.open_suffix')} (${_formatDurationText(longestMinutes)})`,
      clickAction: "covers",
      isWarning: true,
      priority: 88,
      alertId: count === 1 ? `cover:${longestEntity}` : 'cover:multiple',
      entityLastChanged: lastChanged ? lastChanged.toISOString() : null,
    };
  }

  return {
    state: "open",
    prefixText: t('status.general.currently_are'),
    badgeText: `${count} ${coverLabel}`,
    badgeIcon: "mdi:window-shutter-open",
    suffixText: t('status.general.open_suffix'),
    clickAction: "covers",
  };
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
  const ids = _prepareEntityIds(hass, infoTextConfig, 'locks', enabledLocks, labelId, entityHasLabel);
  if (!ids) return null;

  // Find all locks that are currently unlocked (uses name for display)
  const unlockedLocks = _findAlertSensors(ids, hass, 'unlocked');
  if (unlockedLocks.length === 0) return null;

  // Find the lock that's been unlocked longest
  const now = new Date();
  let longestLock = unlockedLocks[0];
  let longestMinutes = 0;
  unlockedLocks.forEach(lock => {
    if (lock.lastChanged) {
      const mins = Math.floor((now - lock.lastChanged) / 60000);
      if (mins > longestMinutes) {
        longestMinutes = mins;
        longestLock = lock;
      }
    }
  });

  if (longestMinutes >= lockUnlockedTooLongMinutes) {
    const durationText = _formatDurationText(longestMinutes);
    const displayText = unlockedLocks.length === 1
      ? t('status.lock.unlocked_too_long_single', { name: longestLock.name, duration: durationText })
      : t('status.lock.unlocked_too_long_multiple', { count: unlockedLocks.length, duration: durationText });

    return {
      state: "warning",
      prefixText: "",
      badgeText: displayText,
      badgeIcon: "mdi:lock-alert",
      suffixText: "",
      clickAction: "security",
      isWarning: true,
      priority: 93,
      alertId: unlockedLocks.length === 1 ? `lock:${longestLock.entityId}` : 'lock:multiple',
      entityLastChanged: longestLock.lastChanged ? longestLock.lastChanged.toISOString() : null,
    };
  }

  return {
    state: "unlocked",
    prefixText: t('status.general.currently_are'),
    badgeText: `${unlockedLocks.length}`,
    badgeIcon: "mdi:lock-open",
    suffixText: t('status.general.open_suffix'),
    clickAction: "security",
  };
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
  const ids = _prepareEntityIds(hass, infoTextConfig, 'tvs', enabledTVs, labelId, entityHasLabel);
  if (!ids) return null;

  const tvsOn = filterEntitiesByState(ids, hass, 'on');
  if (tvsOn.length === 0) return null;

  return {
    state: "on",
    prefixText: t('status.tvs.are_on'),
    badgeText: `${tvsOn.length}`,
    badgeIcon: "mdi:television",
    suffixText: t('status.tvs.suffix'),
    clickAction: "tvs",
  };
}

/**
 * Get dishwasher status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getDishwasherStatus(hass, infoTextConfig) {
  if (!hass || !infoTextConfig.dishwasher?.enabled) return null;

  const entityId = infoTextConfig.dishwasher.entity;
  const finishTimeEntityId = infoTextConfig.dishwasher.finishTimeEntity;

  if (!entityId) return null;

  const operationState = hass.states[entityId];
  const finishTime = finishTimeEntityId ? hass.states[finishTimeEntityId] : null;

  if (!operationState) return null;

  const state = operationState.state?.toLowerCase();

  if (state === "run" || state === "running") {
    const timeText = finishTime ? formatRemainingTime(finishTime.state) : "";
    return {
      state: "running",
      prefixText: t('status.appliances.dishwasher.running'),
      badgeText: timeText || "...",
      badgeIcon: "mdi:dishwasher",
      suffixText: ".",
    };
  } else if (state === "finished" || state === "ready") {
    return {
      state: "finished",
      prefixText: t('status.appliances.dishwasher.finished'),
      badgeText: t('status.appliances.dishwasher.ready'),
      badgeIcon: "mdi:dishwasher",
      suffixText: ".",
    };
  }
  return null;
}

/**
 * Get dryer status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getDryerStatus(hass, infoTextConfig) {
  if (!hass || !infoTextConfig.dryer?.enabled) return null;

  const entityId = infoTextConfig.dryer.entity;
  if (!entityId) return null;

  const operationState = hass.states[entityId];
  if (!operationState) return null;

  const state = operationState.state?.toLowerCase();

  if (state === "run" || state === "running" || state === "on") {
    return {
      state: "running",
      prefixText: t('status.appliances.dryer.prefix'),
      badgeText: t('status.appliances.dryer.label'),
      badgeIcon: "mdi:tumble-dryer",
      suffixText: t('status.appliances.dryer.running') + ".",
    };
  } else if (state === "finished" || state === "ready") {
    return {
      state: "finished",
      prefixText: t('status.appliances.dryer.prefix'),
      badgeText: t('status.appliances.dryer.label'),
      badgeIcon: "mdi:tumble-dryer",
      suffixText: t('status.appliances.dryer.finished') + ".",
    };
  }
  return null;
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

  const vacuumState = hass.states[entityId];
  if (!vacuumState) return null;

  const state = vacuumState.state?.toLowerCase();

  // Get current room being cleaned from vacuum attributes
  const currentSegment = vacuumState.attributes?.current_segment;
  const selectedMap = vacuumState.attributes?.selected_map;
  const attrs = vacuumState.attributes || {};

  // Resolve current room name via cascade:
  // 1. Auto-detect from vacuum entity attributes (Valetudo, Dreame, Xiaomi MIOT, etc.)
  // 2. User-configured room mapping from admin settings (Roborock, etc.)
  // 3. Fall back to generic i18n text
  let roomName = null;

  // Auto-detect: try common attribute patterns from various integrations
  if (attrs.room_name) {
    // Xiaomi MIOT and some integrations expose room_name directly
    roomName = attrs.room_name;
  } else if (currentSegment && attrs.rooms && typeof attrs.rooms === 'object') {
    // Valetudo exposes rooms as { segmentId: { name: '...' } } or { segmentId: 'name' }
    const room = attrs.rooms[currentSegment];
    roomName = typeof room === 'object' ? room.name : room;
  } else if (currentSegment && attrs.room_mapping && attrs.room_mapping[currentSegment]) {
    // Dreame and similar expose room_mapping as { segmentId: 'name' }
    roomName = attrs.room_mapping[currentSegment];
  }

  // Fallback: user-configured room mapping from admin settings
  if (!roomName && selectedMap && currentSegment && infoTextConfig.vacuum.roomMapping) {
    const userMapping = infoTextConfig.vacuum.roomMapping;
    if (userMapping[selectedMap] && userMapping[selectedMap][currentSegment]) {
      roomName = userMapping[selectedMap][currentSegment];
    }
  }

  // Final fallback: generic text
  if (!roomName) {
    roomName = t('status.appliances.vacuum.cleaning_in_progress');
  }

  if (state === "cleaning") {
    return {
      state: "cleaning",
      prefixText: t('status.appliances.vacuum.prefix'),
      badgeText: roomName,
      badgeIcon: "mdi:robot-vacuum",
      suffixText: t('status.appliances.vacuum.cleaning') + ".",
    };
  } else if (state === "returning") {
    return {
      state: "returning",
      prefixText: t('status.appliances.vacuum.prefix_vacuum'),
      badgeText: t('status.appliances.vacuum.returning'),
      badgeIcon: "mdi:robot-vacuum",
      suffixText: ".",
    };
  } else if (state === "error") {
    return {
      state: "error",
      prefixText: t('status.appliances.vacuum.prefix_vacuum'),
      badgeText: t('status.appliances.vacuum.has_problem'),
      badgeIcon: "mdi:robot-vacuum-alert",
      suffixText: "!",
      isWarning: true,
      alertId: `vacuum:${entityId}`,
      entityLastChanged: vacuumState.last_changed || null,
    };
  }
  return null;
}

/**
 * Get battery low status for info text row
 * Supports two tiers: critical (< criticalThreshold) and low (< threshold)
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getBatteryLowStatus(hass, infoTextConfig) {
  if (!hass || !infoTextConfig.batteryLow?.enabled) return null;

  const threshold = infoTextConfig.batteryLow.threshold || 20;
  const criticalThreshold = infoTextConfig.batteryLow.criticalThreshold || 10;

  // Find all battery sensors below thresholds
  const lowBatteryDevices = [];
  const criticalBatteryDevices = [];

  Object.entries(hass.states).forEach(([entityId, state]) => {
    // Check if it's a battery sensor
    const isBatterySensor =
      entityId.includes('battery') ||
      state.attributes?.device_class === 'battery';

    if (!isBatterySensor) return;

    const value = parseFloat(state.state);
    if (isNaN(value)) return;

    if (value < criticalThreshold && value >= 0) {
      criticalBatteryDevices.push({
        entityId,
        name: state.attributes?.friendly_name || entityId,
        value: Math.round(value),
        lastChanged: state.last_changed || null,
      });
    } else if (value < threshold && value >= 0) {
      lowBatteryDevices.push({
        entityId,
        name: state.attributes?.friendly_name || entityId,
        value: Math.round(value),
        lastChanged: state.last_changed || null,
      });
    }
  });

  // Critical takes priority
  if (criticalBatteryDevices.length > 0) {
    const count = criticalBatteryDevices.length;
    const lowestDevice = criticalBatteryDevices.sort((a, b) => a.value - b.value)[0];

    return {
      state: "critical",
      prefixText: "",
      badgeText: count === 1
        ? `${lowestDevice.name} (${lowestDevice.value}%)`
        : t('status.battery.devices_critical', { count }),
      badgeIcon: "mdi:battery-alert",
      suffixText: count === 1 ? t('status.battery.is_critical') : t('status.battery.are_critical'),
      isWarning: true,
      isCritical: true,
      clickAction: "battery",
      alertId: count === 1 ? `battery:${lowestDevice.entityId}` : 'battery:critical',
      entityLastChanged: lowestDevice.lastChanged,
    };
  }

  // Low battery (existing logic)
  if (lowBatteryDevices.length === 0) return null;

  const count = lowBatteryDevices.length;
  const lowestDevice = lowBatteryDevices.sort((a, b) => a.value - b.value)[0];

  return {
    state: "low",
    prefixText: "",
    badgeText: count === 1 ? `${lowestDevice.name} (${lowestDevice.value}%)` : t('status.battery.devices_low', { count }),
    badgeIcon: "mdi:battery-low",
    suffixText: count === 1 ? t('status.battery.has_low') : t('status.battery.have_low'),
    isWarning: true,
    clickAction: "battery",
    alertId: count === 1 ? `battery:${lowestDevice.entityId}` : 'battery:multiple',
    entityLastChanged: lowestDevice.lastChanged,
  };
}

/**
 * Get appliance status items for devices enabled with showInHomeStatus
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration (unused, kept for API consistency)
 * @param {Array} appliancesWithHomeStatus - Array of appliance objects with showInHomeStatus enabled
 * @param {Function} getApplianceStatus - Function to get appliance status from panel
 * @returns {Array} Array of status objects for active appliances
 */
export function getAppliancesStatus(hass, infoTextConfig, appliancesWithHomeStatus, getApplianceStatus) {
  if (!hass) return [];
  if (!appliancesWithHomeStatus || appliancesWithHomeStatus.length === 0) return [];
  if (!getApplianceStatus) return [];

  const statusItems = [];

  appliancesWithHomeStatus.forEach(appliance => {
    const status = getApplianceStatus(appliance);
    if (!status) return;

    // Only show if appliance is active, running, or finished
    if (status.isActive || status.isFinished) {
      let prefixText = '';
      let badgeText = '';
      let suffixText = '';

      if (status.isActive) {
        // If we have remaining time from the timer entity, show it
        if (status.text && status.text !== t('status.appliances.generic.running') && status.text !== t('status.appliances.generic.active')) {
          // status.text contains the formatted remaining time
          prefixText = `${appliance.name} ${t('status.appliances.generic.running')}`;
          badgeText = status.text;
          suffixText = '.';
        } else {
          prefixText = '';
          badgeText = appliance.name;
          suffixText = t('status.appliances.generic.running_now') + '.';
        }
      } else if (status.isFinished) {
        prefixText = '';
        badgeText = appliance.name;
        suffixText = t('status.appliances.generic.finished') + '.';
      }

      // Get the entity ID for click action (state entity or timer entity)
      const entityId = appliance.stateEntity || appliance.timerEntity;

      statusItems.push({
        state: status.isFinished ? 'finished' : 'running',
        prefixText,
        badgeText,
        badgeIcon: appliance.icon,
        suffixText,
        // Add entity ID as click action to open more-info dialog
        clickAction: entityId ? `entity:${entityId}` : null,
      });
    }
  });

  return statusItems;
}

/**
 * Get alarm status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {string} alarmEntity - Alarm control panel entity ID
 * @returns {Object|null} Status object or null
 */
export function getAlarmStatus(hass, infoTextConfig, alarmEntity) {
  if (!hass || !infoTextConfig.alarm?.enabled) return null;

  // Auto-detect alarm entity if not explicitly configured
  let resolvedEntity = alarmEntity;
  if (!resolvedEntity) {
    resolvedEntity = Object.keys(hass.states).find(id => id.startsWith('alarm_control_panel.'));
  }
  if (!resolvedEntity) return null;

  const state = hass.states[resolvedEntity];
  if (!state) return null;

  const alarmState = state.state;

  // Map states to display information
  const stateMapping = {
    disarmed: {
      prefixText: t('status.alarm.prefix', 'Alarm is'),
      badgeText: t('status.alarm.disarmed', 'disarmed'),
      emoji: '🛡️',
      isWarning: false
    },
    armed_home: {
      prefixText: t('status.alarm.prefix', 'Alarm is'),
      badgeText: t('status.alarm.armed_home', 'armed (Home)'),
      emoji: '🛡️',
      isWarning: false
    },
    armed_away: {
      prefixText: t('status.alarm.prefix', 'Alarm is'),
      badgeText: t('status.alarm.armed_away', 'armed (Away)'),
      emoji: '🛡️',
      isWarning: false
    },
    armed_night: {
      prefixText: t('status.alarm.prefix', 'Alarm is'),
      badgeText: t('status.alarm.armed_night', 'armed (Night)'),
      emoji: '🛡️',
      isWarning: false
    },
    triggered: {
      prefixText: '⚠️',
      badgeText: t('status.alarm.triggered'),
      emoji: '🚨',
      suffixText: '!',
      isWarning: true,
      isCritical: true,
      priority: 100
    },
    arming: {
      prefixText: t('status.alarm.prefix', 'Alarm is'),
      badgeText: t('status.alarm.arming', 'arming…'),
      emoji: '🛡️',
      isWarning: true,
      priority: 80
    },
    pending: {
      prefixText: t('status.alarm.prefix', 'Alarm is'),
      badgeText: t('status.alarm.pending', 'pending…'),
      emoji: '🛡️',
      isWarning: true,
      priority: 90
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
