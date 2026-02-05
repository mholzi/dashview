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
  if (!hass || !infoTextConfig.water?.enabled) return null;

  // Get enabled water leak sensor IDs
  let enabledWaterLeakSensorIds = getEnabledEntityIds(enabledWaterLeakSensors);

  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledWaterLeakSensorIds = enabledWaterLeakSensorIds.filter(id => entityHasLabel(id, labelId));
  }

  if (enabledWaterLeakSensorIds.length === 0) return null;

  // Find all sensors that are currently detecting water (state 'on')
  const wetSensors = enabledWaterLeakSensorIds
    .map(entityId => {
      const state = hass.states[entityId];
      if (state && state.state === 'on') {
        return {
          entityId,
          name: state.attributes?.friendly_name || entityId,
          lastChanged: state.last_changed ? new Date(state.last_changed) : null,
        };
      }
      return null;
    })
    .filter(s => s !== null);

  const leakDetected = wetSensors.length > 0;

  if (leakDetected) {
    // Alert state - water leak detected
    const count = wetSensors.length;

    if (count === 1) {
      // Single leak - show location
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
      // Multiple leaks - show count (use earliest lastChanged for aggregate)
      const earliestSensor = wetSensors.reduce((earliest, current) =>
        current.lastChanged && (!earliest.lastChanged || current.lastChanged < earliest.lastChanged) ? current : earliest
      );
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
        entityLastChanged: earliestSensor.lastChanged ? earliestSensor.lastChanged.toISOString() : null,
      };
    }
  } else {
    // OK state - no leaks
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
  if (!hass || !infoTextConfig.smoke?.enabled) return null;

  // Get enabled smoke sensor IDs
  let enabledSmokeSensorIds = getEnabledEntityIds(enabledSmokeSensors);

  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledSmokeSensorIds = enabledSmokeSensorIds.filter(id => entityHasLabel(id, labelId));
  }

  if (enabledSmokeSensorIds.length === 0) return null;

  // Find all sensors that are currently detecting smoke (state 'on')
  const activeSensors = enabledSmokeSensorIds
    .map(entityId => {
      const state = hass.states[entityId];
      if (state && state.state === 'on') {
        return {
          entityId,
          name: state.attributes?.friendly_name || entityId,
          lastChanged: state.last_changed ? new Date(state.last_changed) : null,
        };
      }
      return null;
    })
    .filter(s => s !== null);

  // Only show when smoke is actively detected — no "all clear" status
  if (activeSensors.length === 0) return null;

  const count = activeSensors.length;

  if (count === 1) {
    // Single detector — show name
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
    // Multiple detectors — show count
    const earliestSensor = activeSensors.reduce((earliest, current) =>
      current.lastChanged && (!earliest.lastChanged || current.lastChanged < earliest.lastChanged) ? current : earliest
    );
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
      entityLastChanged: earliestSensor.lastChanged ? earliestSensor.lastChanged.toISOString() : null,
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
  if (!hass || !infoTextConfig.motion?.enabled) return null;

  // Check if any enabled motion sensor is detecting motion
  let enabledMotionSensorIds = getEnabledEntityIds(enabledMotionSensors);
  // Filter by label if provided
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
  if (!hass || !infoTextConfig.garage?.enabled) return null;

  let enabledGarageIds = getEnabledEntityIds(enabledGarages);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledGarageIds = enabledGarageIds.filter(id => entityHasLabel(id, labelId));
  }
  if (enabledGarageIds.length === 0) return null;

  const openGarages = filterEntitiesByState(enabledGarageIds, hass, 'open');
  if (openGarages.length === 0) return null;

  const count = openGarages.length;
  const now = new Date();

  // Find the longest open duration among all open garages
  let longestOpenMinutes = 0;
  openGarages.forEach(entityId => {
    const state = hass.states[entityId];
    if (state && state.last_changed) {
      const lastChanged = new Date(state.last_changed);
      const diffMs = now - lastChanged;
      const openMinutes = Math.floor(diffMs / 60000);
      if (openMinutes > longestOpenMinutes) {
        longestOpenMinutes = openMinutes;
      }
    }
  });

  // Check if any garage has been open too long
  const isOpenTooLong = longestOpenMinutes >= garageOpenTooLongMinutes;

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

    // Find the garage that's been open longest for alertId
    let longestOpenGarage = openGarages[0];
    let longestLastChanged = null;
    openGarages.forEach(entityId => {
      const state = hass.states[entityId];
      if (state && state.last_changed) {
        const lastChanged = new Date(state.last_changed);
        if (!longestLastChanged || lastChanged < longestLastChanged) {
          longestLastChanged = lastChanged;
          longestOpenGarage = entityId;
        }
      }
    });

    return {
      state: "warning",
      prefixText: "",
      badgeText: t('status.garage.open_too_long', { duration: durationText }),
      badgeIcon: "mdi:garage-alert",
      suffixText: "",
      clickAction: "garage",
      isWarning: true,
      priority: 91,
      alertId: count === 1 ? `garage:${longestOpenGarage}` : 'garage:multiple',
      entityLastChanged: longestLastChanged ? longestLastChanged.toISOString() : null,
    };
  }

  // Normal open status (no warning)
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
  if (!hass || !infoTextConfig.doors?.enabled) return null;

  let enabledDoorIds = getEnabledEntityIds(enabledDoors);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledDoorIds = enabledDoorIds.filter(id => entityHasLabel(id, labelId));
  }
  if (enabledDoorIds.length === 0) return null;

  // Filter for binary_sensors with device_class: door that are 'on' (open)
  const openDoors = enabledDoorIds
    .map(entityId => {
      const state = hass.states[entityId];
      if (!state || state.state !== 'on') return null;
      // Only include actual door sensors (device_class: door)
      if (state.attributes?.device_class !== 'door') return null;
      return {
        entityId,
        name: state.attributes?.friendly_name || entityId,
        lastChanged: state.last_changed ? new Date(state.last_changed) : null,
      };
    })
    .filter(d => d !== null);

  if (openDoors.length === 0) return null;

  const now = new Date();

  // Find the longest open duration and the door that's been open longest
  let longestOpenDoor = openDoors[0];
  let longestOpenMinutes = 0;

  openDoors.forEach(door => {
    if (door.lastChanged) {
      const diffMs = now - door.lastChanged;
      const openMinutes = Math.floor(diffMs / 60000);
      if (openMinutes > longestOpenMinutes) {
        longestOpenMinutes = openMinutes;
        longestOpenDoor = door;
      }
    }
  });

  // Check if any door has been open too long
  const isOpenTooLong = longestOpenMinutes >= doorOpenTooLongMinutes;

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

    // Show door name if single door, count if multiple
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

  // Normal open status (no warning) - just show count of open doors
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
  if (!hass || !infoTextConfig.windows?.enabled) return null;

  let enabledWindowIds = getEnabledEntityIds(enabledWindows);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledWindowIds = enabledWindowIds.filter(id => entityHasLabel(id, labelId));
  }
  if (enabledWindowIds.length === 0) return null;

  const openWindows = filterEntitiesByState(enabledWindowIds, hass, 'on');
  if (openWindows.length === 0) return null;

  const count = openWindows.length;
  const now = new Date();

  // Find the longest open duration among all open windows
  let longestOpenMinutes = 0;
  openWindows.forEach(entityId => {
    const state = hass.states[entityId];
    if (state && state.last_changed) {
      const lastChanged = new Date(state.last_changed);
      const diffMs = now - lastChanged;
      const openMinutes = Math.floor(diffMs / 60000);
      if (openMinutes > longestOpenMinutes) {
        longestOpenMinutes = openMinutes;
      }
    }
  });

  // Check if any window has been open too long
  const isOpenTooLong = longestOpenMinutes >= windowOpenTooLongMinutes;

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

    // Find the window that's been open longest for alertId
    let longestOpenWindow = openWindows[0];
    let longestLastChanged = null;
    openWindows.forEach(entityId => {
      const state = hass.states[entityId];
      if (state && state.last_changed) {
        const lastChanged = new Date(state.last_changed);
        if (!longestLastChanged || lastChanged < longestLastChanged) {
          longestLastChanged = lastChanged;
          longestOpenWindow = entityId;
        }
      }
    });

    return {
      state: "warning",
      prefixText: "",
      badgeText: `${count}`,
      emoji: "🪟",
      suffixText: ` ${t('status.general.open_suffix')} (${durationText})`,
      clickAction: "security",
      isWarning: true,
      priority: 90,
      alertId: count === 1 ? `window:${longestOpenWindow}` : 'window:multiple',
      entityLastChanged: longestLastChanged ? longestLastChanged.toISOString() : null,
    };
  }

  // Normal open status (no warning)
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
  if (!hass || !infoTextConfig.lights?.enabled) return null;

  let enabledLightIds = getEnabledEntityIds(enabledLights);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledLightIds = enabledLightIds.filter(id => entityHasLabel(id, labelId));
  }

  // Exclude non-light domains (automation, script, scene with light label)
  const excludedDomains = ['automation', 'script', 'scene'];
  enabledLightIds = enabledLightIds.filter(id => {
    const domain = id.split('.')[0];
    return !excludedDomains.includes(domain);
  });

  if (enabledLightIds.length === 0) return null;

  const lightsOn = filterEntitiesByState(enabledLightIds, hass, 'on');
  if (lightsOn.length === 0) return null;

  const count = lightsOn.length;
  return {
    state: "on",
    prefixText: t('status.lights.are_on'),
    badgeText: `${count}`,
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
  if (!hass || !infoTextConfig.roofWindows?.enabled) return null;

  let enabledRoofWindowIds = getEnabledEntityIds(enabledRoofWindows);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledRoofWindowIds = enabledRoofWindowIds.filter(id => entityHasLabel(id, labelId));
  }
  if (enabledRoofWindowIds.length === 0) return null;

  const openRoofWindows = filterEntitiesByState(enabledRoofWindowIds, hass, 'on');
  if (openRoofWindows.length === 0) return null;

  const count = openRoofWindows.length;
  const now = new Date();

  // Find the longest open duration among all open roof windows
  let longestOpenMinutes = 0;
  openRoofWindows.forEach(entityId => {
    const state = hass.states[entityId];
    if (state && state.last_changed) {
      const lastChanged = new Date(state.last_changed);
      const diffMs = now - lastChanged;
      const openMinutes = Math.floor(diffMs / 60000);
      if (openMinutes > longestOpenMinutes) {
        longestOpenMinutes = openMinutes;
      }
    }
  });

  // Check if any roof window has been open too long
  const isOpenTooLong = longestOpenMinutes >= roofWindowOpenTooLongMinutes;

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

    // Find the roof window that's been open longest for alertId
    let longestOpenRoofWindow = openRoofWindows[0];
    let longestLastChanged = null;
    openRoofWindows.forEach(entityId => {
      const state = hass.states[entityId];
      if (state && state.last_changed) {
        const lastChanged = new Date(state.last_changed);
        if (!longestLastChanged || lastChanged < longestLastChanged) {
          longestLastChanged = lastChanged;
          longestOpenRoofWindow = entityId;
        }
      }
    });

    return {
      state: "warning",
      prefixText: "",
      badgeText: `${count}`,
      badgeIcon: "mdi:window-open-variant",
      suffixText: ` ${t('status.roofWindow.open_too_long')} (${durationText})`,
      clickAction: "security",
      isWarning: true,
      priority: 89,
      alertId: count === 1 ? `roofWindow:${longestOpenRoofWindow}` : 'roofWindow:multiple',
      entityLastChanged: longestLastChanged ? longestLastChanged.toISOString() : null,
    };
  }

  // Normal open status (no warning)
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
  if (!hass || !infoTextConfig.covers?.enabled) return null;

  let enabledCoverIds = getEnabledEntityIds(enabledCovers);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledCoverIds = enabledCoverIds.filter(id => entityHasLabel(id, labelId));
  }

  // Only include actual cover domain entities (not automations, etc.)
  enabledCoverIds = enabledCoverIds.filter(id => id.startsWith('cover.'));

  if (enabledCoverIds.length === 0) return null;

  const openCovers = enabledCoverIds
    .filter(entityId => {
      const state = hass.states[entityId];
      return state && state.state !== 'closed';
    });

  if (openCovers.length === 0) return null;

  const count = openCovers.length;
  const now = new Date();

  // Find the longest open duration among all open covers
  let longestOpenMinutes = 0;
  openCovers.forEach(entityId => {
    const state = hass.states[entityId];
    if (state && state.last_changed) {
      const lastChanged = new Date(state.last_changed);
      const diffMs = now - lastChanged;
      const openMinutes = Math.floor(diffMs / 60000);
      if (openMinutes > longestOpenMinutes) {
        longestOpenMinutes = openMinutes;
      }
    }
  });

  // Check if any cover has been open too long
  const isOpenTooLong = longestOpenMinutes >= coverOpenTooLongMinutes;

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

    // Find the cover that's been open longest for alertId
    let longestOpenCover = openCovers[0];
    let longestLastChanged = null;
    openCovers.forEach(entityId => {
      const state = hass.states[entityId];
      if (state && state.last_changed) {
        const lastChanged = new Date(state.last_changed);
        if (!longestLastChanged || lastChanged < longestLastChanged) {
          longestLastChanged = lastChanged;
          longestOpenCover = entityId;
        }
      }
    });

    return {
      state: "warning",
      prefixText: "",
      badgeText: `${count} ${count === 1 ? t('status.covers.label_singular') : t('status.covers.label_plural')}`,
      badgeIcon: "mdi:window-shutter-alert",
      suffixText: ` ${t('status.general.open_suffix')} (${durationText})`,
      clickAction: "covers",
      isWarning: true,
      priority: 88,
      alertId: count === 1 ? `cover:${longestOpenCover}` : 'cover:multiple',
      entityLastChanged: longestLastChanged ? longestLastChanged.toISOString() : null,
    };
  }

  // Normal open status (no warning)
  return {
    state: "open",
    prefixText: t('status.general.currently_are'),
    badgeText: `${count} ${count === 1 ? t('status.covers.label_singular') : t('status.covers.label_plural')}`,
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
  if (!hass || !infoTextConfig.locks?.enabled) return null;

  let enabledLockIds = getEnabledEntityIds(enabledLocks);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledLockIds = enabledLockIds.filter(id => entityHasLabel(id, labelId));
  }
  if (enabledLockIds.length === 0) return null;

  // Find all locks that are currently unlocked
  const unlockedLocks = enabledLockIds
    .map(entityId => {
      const state = hass.states[entityId];
      if (!state || state.state !== 'unlocked') return null;
      return {
        entityId,
        name: state.attributes?.friendly_name || entityId,
        lastChanged: state.last_changed ? new Date(state.last_changed) : null,
      };
    })
    .filter(l => l !== null);

  if (unlockedLocks.length === 0) return null;

  const now = new Date();

  // Find the longest unlocked duration and the lock that's been unlocked longest
  let longestUnlockedLock = unlockedLocks[0];
  let longestUnlockedMinutes = 0;

  unlockedLocks.forEach(lock => {
    if (lock.lastChanged) {
      const diffMs = now - lock.lastChanged;
      const unlockedMinutes = Math.floor(diffMs / 60000);
      if (unlockedMinutes > longestUnlockedMinutes) {
        longestUnlockedMinutes = unlockedMinutes;
        longestUnlockedLock = lock;
      }
    }
  });

  // Check if any lock has been unlocked too long
  const isUnlockedTooLong = longestUnlockedMinutes >= lockUnlockedTooLongMinutes;

  if (isUnlockedTooLong) {
    // Format duration text
    const { days, hours, minutes } = calculateTimeDifference(longestUnlockedMinutes * 60000);
    let durationText = '';
    if (days > 0) {
      durationText = t('common.time.duration_days', { days });
    } else if (hours > 0) {
      durationText = t('common.time.duration_hours', { hours });
    } else {
      durationText = t('common.time.duration_minutes', { minutes: minutes || longestUnlockedMinutes });
    }

    // Show lock name if single lock, count if multiple
    const displayText = unlockedLocks.length === 1
      ? t('status.lock.unlocked_too_long_single', { name: longestUnlockedLock.name, duration: durationText })
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
      alertId: unlockedLocks.length === 1 ? `lock:${longestUnlockedLock.entityId}` : 'lock:multiple',
      entityLastChanged: longestUnlockedLock.lastChanged ? longestUnlockedLock.lastChanged.toISOString() : null,
    };
  }

  // Normal unlocked status (no warning) - just show count
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
  if (!hass || !infoTextConfig.tvs?.enabled) return null;

  let enabledTVIds = getEnabledEntityIds(enabledTVs);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledTVIds = enabledTVIds.filter(id => entityHasLabel(id, labelId));
  }
  if (enabledTVIds.length === 0) return null;

  const tvsOn = filterEntitiesByState(enabledTVIds, hass, 'on');
  if (tvsOn.length === 0) return null;

  const count = tvsOn.length;
  return {
    state: "on",
    prefixText: t('status.tvs.are_on'),
    badgeText: `${count}`,
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
  const finishTimeEntityId = infoTextConfig.dryer.finishTimeEntity;

  if (!entityId) return null;

  const operationState = hass.states[entityId];
  const finishTime = finishTimeEntityId ? hass.states[finishTimeEntityId] : null;

  if (!operationState) return null;

  const state = operationState.state?.toLowerCase();

  if (state === "run" || state === "running" || state === "on") {
    // Note: timeText calculated but not currently used in output
    // const timeText = finishTime ? formatRemainingTime(finishTime.state) : "";
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
