/**
 * Panel Interface Validation
 * Documents and validates the expected interface that feature modules depend on.
 * Call validatePanelInterface() during development to catch missing methods early.
 */

/**
 * Methods that feature modules expect on the panel instance.
 * If any are removed from DashviewPanel, features will break silently
 * unless this validation catches it.
 */
export const REQUIRED_PANEL_METHODS = [
  // Entity/label checks
  '_entityHasLabel',
  '_entityHasCurrentLabel',
  '_getAreaIdForEntity',
  // UI actions
  'requestUpdate',
  '_saveSettings',
  '_openRoomPopup',
  '_closeRoomPopup',
  // Entity display
  '_getAreaIcon',
  '_getWeatherIcon',
  '_translateWeatherCondition',
  // Threshold handlers
  '_handleThresholdChange',
  // Entity toggling
  '_toggleEntityEnabled',
];

/**
 * Properties that feature modules read from the panel instance.
 */
export const REQUIRED_PANEL_PROPERTIES = [
  'hass',
  '_areas',
  '_floors',
  '_labels',
  '_entityRegistry',
  '_enabledLights',
  '_enabledCovers',
  '_enabledRooms',
  '_infoTextConfig',
  '_lightLabelId',
  '_coverLabelId',
  '_windowLabelId',
  '_doorLabelId',
  '_garageLabelId',
  '_motionLabelId',
  '_smokeLabelId',
];

/**
 * Validate that a panel instance has all required interface methods and properties.
 * Call this in development/debug mode to catch interface drift early.
 * @param {Object} panel - DashviewPanel instance
 * @returns {string[]} Array of missing method/property names (empty if all present)
 */
export function validatePanelInterface(panel) {
  const missing = [];
  for (const method of REQUIRED_PANEL_METHODS) {
    if (typeof panel[method] !== 'function') {
      missing.push(`method: ${method}`);
    }
  }
  for (const prop of REQUIRED_PANEL_PROPERTIES) {
    if (!(prop in panel)) {
      missing.push(`property: ${prop}`);
    }
  }
  if (missing.length > 0) {
    console.warn('[Dashview] Panel interface validation failed. Missing:', missing);
  }
  return missing;
}
