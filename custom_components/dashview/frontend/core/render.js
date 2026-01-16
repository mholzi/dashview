/**
 * Render Utility Functions
 * Helper functions for preparing data and formatting values for rendering
 * Extracted from dashview-panel.js for modularity
 *
 * @module core/render
 */

/**
 * Format a timestamp as relative time ago
 * @param {string|Date} lastChanged - ISO timestamp or Date object
 * @returns {string} Formatted time ago string (e.g., "5m ago")
 */
export function formatTimeAgo(lastChanged) {
  if (!lastChanged) return '';
  const lastChangedDate = new Date(lastChanged);
  const now = new Date();
  const diffSec = Math.floor((now - lastChangedDate) / 1000);
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

/**
 * Format garage last changed time in German
 * @param {string|Date} lastChanged - ISO timestamp or Date object
 * @returns {string} Formatted time string in German
 */
export function formatGarageLastChanged(lastChanged) {
  if (!lastChanged) return '';
  const last = new Date(lastChanged);
  if (isNaN(last.getTime())) return '';
  const diff = Date.now() - last.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (days >= 2) return `vor ${days} Tagen`;
  if (days >= 1) return `Gestern`;
  if (hrs >= 1) return `vor ${hrs}h`;
  if (mins >= 1) return `vor ${mins}min`;
  return 'Gerade eben';
}

/**
 * Format the current date in German locale
 * @returns {string} Formatted date string
 */
export function formatDate() {
  const now = new Date();
  return now.toLocaleDateString("de-DE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Format remaining time from various formats
 * @param {string} value - Time value (ISO timestamp, minutes, etc.)
 * @returns {string|null} Formatted time string or null if invalid
 */
export function formatRemainingTime(value) {
  if (!value || value === 'unknown' || value === 'unavailable') return null;

  // Try parsing as ISO timestamp
  const date = new Date(value);
  if (!isNaN(date.getTime())) {
    const now = new Date();
    const diffMs = date - now;
    if (diffMs > 0) {
      const minutes = Math.round(diffMs / 60000);
      if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}h ${mins}min`;
      }
      return `${minutes} min`;
    }
  }

  // Try parsing as number (minutes)
  const num = parseFloat(value);
  if (!isNaN(num) && num > 0) {
    if (num >= 60) {
      const hours = Math.floor(num / 60);
      const mins = Math.round(num % 60);
      return `${hours}h ${mins}min`;
    }
    return `${Math.round(num)} min`;
  }

  return null;
}

/**
 * Get low battery devices from hass states
 * @param {Object} hass - Home Assistant instance
 * @param {number} threshold - Battery percentage threshold (default 20)
 * @returns {Array} Array of low battery device objects
 */
export function getLowBatteryDevices(hass, threshold = 20) {
  if (!hass) return [];

  const lowBatteryDevices = [];

  Object.entries(hass.states).forEach(([entityId, state]) => {
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

  return lowBatteryDevices.sort((a, b) => a.value - b.value);
}

/**
 * Get entity counts for statistics
 * @param {Object} hass - Home Assistant instance
 * @param {Array} entityRegistry - Entity registry array
 * @param {Object} enabledLights - Enabled lights map
 * @param {string} lightLabelId - Light label ID
 * @returns {Object} Entity count statistics
 */
export function getEntityCounts(hass, entityRegistry, enabledLights, lightLabelId) {
  if (!hass) {
    return {
      total: 0,
      lights: 0,
      switches: 0,
      sensors: 0,
      unavailable: 0,
      lightsOn: 0,
      enabledLights: 0,
      totalLabeledLights: 0
    };
  }

  const states = Object.values(hass.states);

  // Filter enabled lights by current label (iterate over registry for default-enabled)
  const enabledLightIds = entityRegistry
    .filter((entityReg) => {
      const entityId = entityReg.entity_id;
      if (enabledLights[entityId] === false) return false;
      // Only count lights that have the currently selected light label
      if (!lightLabelId || !entityReg.labels || !entityReg.labels.includes(lightLabelId)) return false;
      return true;
    })
    .map((e) => e.entity_id);

  // Count entities with the "Light" label
  const totalLabeledLights = lightLabelId
    ? entityRegistry.filter(e => e.labels && e.labels.includes(lightLabelId)).length
    : 0;

  return {
    total: states.length,
    lights: states.filter((e) => e.entity_id.startsWith("light.")).length,
    switches: states.filter((e) => e.entity_id.startsWith("switch.")).length,
    sensors: states.filter((e) => e.entity_id.startsWith("sensor.")).length,
    unavailable: states.filter((e) => e.state === "unavailable").length,
    lightsOn: enabledLightIds.filter(id => hass.states[id]?.state === "on").length,
    enabledLights: enabledLightIds.length,
    totalLabeledLights,
  };
}

/**
 * Get room climate notification if thresholds exceeded
 * @param {Object} params - Parameters object
 * @param {Object} params.hass - Home Assistant instance
 * @param {string} params.areaId - Area ID
 * @param {Function} params.getEnabledTemperatureSensorsForRoom - Function to get temp sensors
 * @param {Function} params.getEnabledHumiditySensorsForRoom - Function to get humidity sensors
 * @param {number} params.tempThreshold - Temperature threshold
 * @param {number} params.humidityThreshold - Humidity threshold
 * @param {Function} params.t - Translation function
 * @returns {Object|null} Notification object or null
 */
export function getRoomClimateNotification({
  hass,
  areaId,
  getEnabledTemperatureSensorsForRoom,
  getEnabledHumiditySensorsForRoom,
  tempThreshold,
  humidityThreshold,
  t
}) {
  if (!hass) return null;

  // Get enabled sensors and filter for valid numeric values
  const tempSensors = getEnabledTemperatureSensorsForRoom(areaId)
    .filter(s => s.state !== 'unavailable' && s.state !== 'unknown')
    .map(s => ({ ...s, value: parseFloat(s.state) }))
    .filter(s => !isNaN(s.value));

  const humiditySensors = getEnabledHumiditySensorsForRoom(areaId)
    .filter(s => s.state !== 'unavailable' && s.state !== 'unknown')
    .map(s => ({ ...s, value: parseFloat(s.state) }))
    .filter(s => !isNaN(s.value));

  // Check thresholds
  const highTemps = tempSensors.filter(s => s.value > tempThreshold);
  const highHumidity = humiditySensors.filter(s => s.value > humidityThreshold);

  if (highTemps.length === 0 && highHumidity.length === 0) return null;

  // Build notification
  const messages = [];
  if (highTemps.length > 0) {
    const avg = (highTemps.reduce((sum, s) => sum + s.value, 0) / highTemps.length).toFixed(1);
    messages.push(`Temperatur: ${avg}°C`);
  }
  if (highHumidity.length > 0) {
    const avg = (highHumidity.reduce((sum, s) => sum + s.value, 0) / highHumidity.length).toFixed(1);
    messages.push(`Luftfeuchtigkeit: ${avg}%`);
  }

  return {
    title: t('ui.notifications.ventilate_room', 'Bitte Raum lüften'),
    subtitle: messages.join(' · ')
  };
}

/**
 * Get appliance status for display
 * @param {Object} appliance - Appliance object
 * @param {Object} hass - Home Assistant instance
 * @param {Function} formatRemainingTimeFn - Function to format remaining time
 * @param {Function} t - Translation function
 * @returns {Object} Status info with text, icon, isActive, etc.
 */
export function getApplianceStatus(appliance, hass, formatRemainingTimeFn, t) {
  // Use user-configured entities if available, otherwise fall back to auto-detected
  const stateEntityId = appliance.stateEntity || appliance.entities?.operationState?.entity_id;
  const timerEntityId = appliance.timerEntity || appliance.entities?.finishTime?.entity_id;

  // Get state from configured entity
  const stateObj = stateEntityId ? hass?.states[stateEntityId] : null;
  const timerObj = timerEntityId ? hass?.states[timerEntityId] : null;

  // If we have a state entity, use it
  if (stateObj) {
    const state = stateObj.state.toLowerCase();

    // Unavailable/unknown states
    if (state === 'unavailable' || state === 'unknown') {
      return { text: t('common.status.unavailable'), icon: appliance.icon, isActive: false, isUnavailable: true };
    }

    // Error states
    if (state === 'error' || state === 'fault' || state === 'failure') {
      return { text: t('ui.errors.error'), icon: appliance.icon, isActive: false, isError: true };
    }

    // Running states - calculate remaining time if timer entity is available
    if (['run', 'running', 'active', 'washing', 'drying', 'cleaning', 'on'].includes(state)) {
      let remainingTime = null;

      // Try to get remaining time from timer entity
      if (timerObj && timerObj.state && timerObj.state !== 'unknown' && timerObj.state !== 'unavailable') {
        remainingTime = formatRemainingTimeFn(timerObj.state);
      }

      // If we have remaining time, show it as the main status (like sensor_big)
      if (remainingTime) {
        return { text: remainingTime, icon: appliance.icon, isActive: true };
      }

      return { text: t('common.status.running'), icon: appliance.icon, isActive: true };
    }

    // Finished states
    if (['finished', 'complete', 'done'].includes(state)) {
      return { text: t('common.status.ready'), icon: appliance.icon, isActive: false, isFinished: true };
    }

    // Ready/idle/off states
    if (['idle', 'off', 'standby', 'ready'].includes(state)) {
      return { text: t('common.status.ready'), icon: appliance.icon, isActive: false };
    }

    // Default: show the state as-is
    return { text: stateObj.state, icon: appliance.icon, isActive: false };
  }

  // No state entity configured - try to get status from first available entity
  if (appliance.allEntities && appliance.allEntities.length > 0) {
    const firstEntity = appliance.allEntities[0];
    // Get live state from hass
    const firstStateObj = hass?.states[firstEntity.entity_id];
    const state = firstStateObj?.state?.toLowerCase() || 'unavailable';

    // Check for unavailable states
    if (state === 'unavailable' || state === 'unknown') {
      return { text: t('common.status.unavailable'), icon: appliance.icon, isActive: false, isUnavailable: true };
    }

    // Check for error states
    if (state === 'error' || state === 'fault' || state === 'failure') {
      return { text: t('ui.errors.error'), icon: appliance.icon, isActive: false, isError: true };
    }

    // Check for common active/on states
    if (state === 'on' || state === 'playing' || state === 'active') {
      return { text: t('common.status.active'), icon: appliance.icon, isActive: true };
    }
    if (state === 'off' || state === 'idle' || state === 'standby') {
      return { text: t('common.status.ready'), icon: appliance.icon, isActive: false };
    }

    // Show entity count as subtitle
    return { text: `${appliance.entityCount} Entities`, icon: appliance.icon, isActive: false };
  }

  return { text: 'Unbekannt', icon: appliance.icon, isActive: false, isUnavailable: true };
}

/**
 * Create a room indicator object
 * @param {Object} roomData - Room data object
 * @param {Function} getAreaIcon - Function to get area icon
 * @returns {Object} Room indicator object
 */
export function createRoomIndicator(roomData, getAreaIcon) {
  let type = 'room';
  if (roomData.hasSmoke) type = 'room-smoke';
  else if (roomData.hasMotion && !roomData.hasLight) type = 'room-motion';
  return {
    type,
    areaId: roomData.area.area_id,
    icon: getAreaIcon(roomData.area),
    label: roomData.area.name,
    hasLight: roomData.hasLight,
    hasMotion: roomData.hasMotion,
    hasSmoke: roomData.hasSmoke,
  };
}

/**
 * Get active room indicators grouped by floor
 * @param {Object} params - Parameters object
 * @param {Object} params.hass - Home Assistant instance
 * @param {Array} params.areas - Areas array
 * @param {Object} params.enabledRooms - Enabled rooms map
 * @param {Function} params.getRoomsWithActiveEntities - Function to get rooms with active entities
 * @param {Object} params.enabledLights - Enabled lights map
 * @param {Object} params.enabledMotionSensors - Enabled motion sensors map
 * @param {Object} params.enabledSmokeSensors - Enabled smoke sensors map
 * @param {string} params.lightLabelId - Light label ID
 * @param {string} params.motionLabelId - Motion label ID
 * @param {string} params.smokeLabelId - Smoke label ID
 * @param {Function} params.getOrderedFloors - Function to get ordered floors
 * @param {Function} params.sortRoomsByOrder - Function to sort rooms by order
 * @param {Function} params.getAreaIcon - Function to get area icon
 * @returns {Array} Array of room indicator objects
 */
export function getActiveRoomIndicators({
  hass,
  areas,
  enabledRooms,
  getRoomsWithActiveEntities,
  enabledLights,
  enabledMotionSensors,
  enabledSmokeSensors,
  lightLabelId,
  motionLabelId,
  smokeLabelId,
  getOrderedFloors,
  sortRoomsByOrder,
  getAreaIcon
}) {
  if (!hass) return [];

  // Find rooms with active states (filtered by current labels)
  const roomsWithLightsOn = getRoomsWithActiveEntities(enabledLights, lightLabelId);
  const roomsWithMotion = getRoomsWithActiveEntities(enabledMotionSensors, motionLabelId);
  const roomsWithSmoke = getRoomsWithActiveEntities(enabledSmokeSensors, smokeLabelId);
  const allActiveRooms = new Set([...roomsWithLightsOn, ...roomsWithMotion, ...roomsWithSmoke]);

  // Build area index for O(1) lookups (Story 7.8)
  const areaById = new Map();
  areas.forEach(a => areaById.set(a.area_id, a));

  // Group by floor
  const roomsByFloor = new Map();
  const roomsWithoutFloor = [];
  allActiveRooms.forEach(areaId => {
    const area = areaById.get(areaId);
    if (!area) return;
    const roomData = {
      area,
      hasLight: roomsWithLightsOn.has(areaId),
      hasMotion: roomsWithMotion.has(areaId),
      hasSmoke: roomsWithSmoke.has(areaId)
    };
    if (area.floor_id) {
      if (!roomsByFloor.has(area.floor_id)) roomsByFloor.set(area.floor_id, []);
      roomsByFloor.get(area.floor_id).push(roomData);
    } else {
      roomsWithoutFloor.push(roomData);
    }
  });

  // Build indicators in floor order
  const indicators = [];
  getOrderedFloors()
    .filter(f => roomsByFloor.has(f.floor_id))
    .forEach(floor => {
      indicators.push({
        type: 'floor',
        icon: floor.icon || 'mdi:home-floor-0',
        label: floor.name
      });
      sortRoomsByOrder(roomsByFloor.get(floor.floor_id), floor.floor_id)
        .forEach(rd => indicators.push(createRoomIndicator(rd, getAreaIcon)));
    });

  // Add unassigned rooms
  sortRoomsByOrder(roomsWithoutFloor, null)
    .forEach(rd => indicators.push(createRoomIndicator(rd, getAreaIcon)));

  return indicators;
}
