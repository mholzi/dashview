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

  const entityId = infoTextConfig.washer.entity || "sensor.waschmaschine_operation_state";
  const finishTimeEntityId = infoTextConfig.washer.finishTimeEntity || "sensor.waschmaschine_programme_finish_time";

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
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getGarageStatus(hass, infoTextConfig, enabledGarages, labelId = null, entityHasLabel = null) {
  if (!hass || !infoTextConfig.garage?.enabled) return null;

  let enabledGarageIds = getEnabledEntityIds(enabledGarages);
  // Filter by label if provided
  if (labelId && entityHasLabel) {
    enabledGarageIds = enabledGarageIds.filter(id => entityHasLabel(id, labelId));
  }
  if (enabledGarageIds.length === 0) return null;

  const openGarages = filterEntitiesByState(enabledGarageIds, hass, 'open');
  if (openGarages.length === 0) return null;

  return {
    state: "open",
    prefixText: t('status.general.currently_are'),
    badgeText: `${openGarages.length}`,
    badgeIcon: "mdi:garage-open",
    suffixText: t('status.general.open_suffix'),
  };
}

/**
 * Get windows status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledWindows - Map of enabled window IDs
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getWindowsStatus(hass, infoTextConfig, enabledWindows, labelId = null, entityHasLabel = null) {
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
 * Get covers status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledCovers - Map of enabled cover IDs
 * @param {string|null} labelId - Optional label ID to filter by
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @returns {Object|null} Status object or null
 */
export function getCoversStatus(hass, infoTextConfig, enabledCovers, labelId = null, entityHasLabel = null) {
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

  // Room mapping based on vacuum's map segments
  const roomDict = {
    'Erdgeschoss': {
      1: 'Arbeitszimmer',
      2: 'Gästeklo',
      3: 'Küche',
      4: 'Wohnzimmer',
      5: 'Esszimmer',
      6: 'Flur'
    },
    'Keller': {
      1: 'Partykeller',
      2: 'Kellerflur',
      3: 'Raum 3',
      5: 'Waschkeller'
    },
    'Dachgeschoss': {
      1: 'Elternschlafzimmer',
      2: 'Klo',
      3: 'Ankleide',
      4: 'Badezimmer'
    }
  };

  // Get current room name
  let roomName = t('status.appliances.vacuum.cleaning_in_progress');
  if (selectedMap && currentSegment && roomDict[selectedMap] && roomDict[selectedMap][currentSegment]) {
    roomName = roomDict[selectedMap][currentSegment];
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
    };
  }
  return null;
}

/**
 * Get battery low status for info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @returns {Object|null} Status object or null
 */
export function getBatteryLowStatus(hass, infoTextConfig) {
  if (!hass || !infoTextConfig.batteryLow?.enabled) return null;

  const threshold = infoTextConfig.batteryLow.threshold || 20;

  // Find all battery sensors below threshold
  const lowBatteryDevices = [];

  Object.entries(hass.states).forEach(([entityId, state]) => {
    // Check if it's a battery sensor
    const isBatterySensor =
      entityId.includes('battery') ||
      state.attributes?.device_class === 'battery';

    if (!isBatterySensor) return;

    const value = parseFloat(state.state);
    if (isNaN(value)) return;

    if (value < threshold && value >= 0) {
      lowBatteryDevices.push({
        entityId,
        name: state.attributes?.friendly_name || entityId,
        value: Math.round(value),
      });
    }
  });

  if (lowBatteryDevices.length === 0) return null;

  const count = lowBatteryDevices.length;
  // Get the lowest battery device name for the badge
  const lowestDevice = lowBatteryDevices.sort((a, b) => a.value - b.value)[0];

  return {
    state: "low",
    prefixText: "",
    badgeText: count === 1 ? `${lowestDevice.name} (${lowestDevice.value}%)` : t('status.battery.devices_low', { count }),
    badgeIcon: "mdi:battery-low",
    suffixText: count === 1 ? t('status.battery.has_low') : t('status.battery.have_low'),
    isWarning: true,
    clickAction: "battery",
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
 * Get all status items for the info text row
 * @param {Object} hass - Home Assistant instance
 * @param {Object} infoTextConfig - Info text configuration
 * @param {Object} enabledEntities - Object containing all enabled entity maps
 * @param {Object} labelIds - Object containing label IDs for each entity type
 * @param {Function|null} entityHasLabel - Optional function to check if entity has label
 * @param {Array} appliancesWithHomeStatus - Optional array of appliances with showInHomeStatus enabled
 * @param {Function} getApplianceStatus - Optional function to get appliance status
 * @returns {Array} Array of active status objects
 */
export function getAllStatusItems(hass, infoTextConfig, enabledEntities, labelIds = {}, entityHasLabel = null, appliancesWithHomeStatus = [], getApplianceStatus = null) {
  const {
    enabledMotionSensors = {},
    enabledGarages = {},
    enabledWindows = {},
    enabledLights = {},
    enabledCovers = {},
    enabledTVs = {},
  } = enabledEntities;

  const {
    motionLabelId = null,
    garageLabelId = null,
    windowLabelId = null,
    lightLabelId = null,
    coverLabelId = null,
    tvLabelId = null,
  } = labelIds;

  // Get appliance status items from new system
  const applianceStatusItems = getAppliancesStatus(hass, infoTextConfig, appliancesWithHomeStatus, getApplianceStatus);

  return [
    getMotionStatus(hass, infoTextConfig, enabledMotionSensors, motionLabelId, entityHasLabel),
    getGarageStatus(hass, infoTextConfig, enabledGarages, garageLabelId, entityHasLabel),
    getWindowsStatus(hass, infoTextConfig, enabledWindows, windowLabelId, entityHasLabel),
    getLightsOnStatus(hass, infoTextConfig, enabledLights, lightLabelId, entityHasLabel),
    getCoversStatus(hass, infoTextConfig, enabledCovers, coverLabelId, entityHasLabel),
    getTVsStatus(hass, infoTextConfig, enabledTVs, tvLabelId, entityHasLabel),
    ...applianceStatusItems,
    getBatteryLowStatus(hass, infoTextConfig),
  ].filter(s => s !== null);
}

export default {
  getWasherStatus,
  getMotionStatus,
  getGarageStatus,
  getWindowsStatus,
  getLightsOnStatus,
  getCoversStatus,
  getTVsStatus,
  getDishwasherStatus,
  getDryerStatus,
  getVacuumStatus,
  getBatteryLowStatus,
  getAppliancesStatus,
  getAllStatusItems,
};
