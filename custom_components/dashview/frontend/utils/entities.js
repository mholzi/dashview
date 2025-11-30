/**
 * Entity Utilities
 * Functions for working with Home Assistant entities
 */

/**
 * Get entity counts from hass states
 * @param {Object} hass - Home Assistant state object
 * @param {Object} enabledLights - Map of enabled light entity IDs
 * @param {Array} entityRegistry - Entity registry array
 * @param {string} lightLabelId - Label ID for lights
 * @returns {Object} Entity count statistics
 */
export function getEntityCounts(hass, enabledLights, entityRegistry, lightLabelId) {
  if (!hass) return { total: 0, lights: 0, switches: 0, sensors: 0, unavailable: 0, lightsOn: 0, enabledLights: 0, totalLabeledLights: 0 };

  const states = Object.values(hass.states);
  const enabledLightIds = Object.entries(enabledLights)
    .filter(([_, enabled]) => enabled)
    .map(([id]) => id);

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
 * Get friendly name from entity state
 * @param {Object} state - Entity state object
 * @returns {string} Friendly name or entity ID
 */
export function getFriendlyName(state) {
  return state?.attributes?.friendly_name || state?.entity_id || 'Unknown';
}
