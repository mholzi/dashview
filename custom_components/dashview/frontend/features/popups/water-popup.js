/**
 * Water Popup Module
 * Renders the water leak sensor popup with sensor list and status
 */

import { renderPopupHeader } from '../../components/layout/index.js';
import { openMoreInfo } from '../../utils/helpers.js';
import { t } from '../../utils/i18n.js';
import { getEnabledEntityIds } from '../../utils/helpers.js';

/**
 * Render the complete water popup
 * @param {Object} component - DashviewPanel instance
 * @param {Function} html - Lit html template function
 * @returns {TemplateResult} Water popup template
 */
export function renderWaterPopup(component, html) {
  if (!component._waterPopupOpen) return '';

  return html`
    <div class="popup-overlay" @click=${(e) => handleOverlayClick(e, component)}>
      <div class="popup-container" @click=${(e) => e.stopPropagation()}>
        ${renderPopupHeader(html, {
          icon: 'mdi:water-alert',
          title: t('water.title'),
          onClose: () => { component._waterPopupOpen = false; },
          iconStyle: 'background: var(--dv-gradient-water, var(--info-color, #2196F3));'
        })}

        <div class="popup-content">
          ${renderWaterSensorList(component, html)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Handle overlay click to close popup
 */
function handleOverlayClick(e, component) {
  if (e.target === e.currentTarget) {
    component._waterPopupOpen = false;
  }
}

/**
 * Render the water sensor list
 */
function renderWaterSensorList(component, html) {
  const sensors = getEnabledWaterLeakSensors(component);

  if (sensors.length === 0) {
    return html`
      <div class="water-popup-empty">
        <ha-icon icon="mdi:water-off"></ha-icon>
        <div class="water-popup-empty-text">${t('water.noSensors')}</div>
      </div>
    `;
  }

  // Sort sensors: wet ones first, then by name
  const sortedSensors = [...sensors].sort((a, b) => {
    if (a.isWet !== b.isWet) return b.isWet - a.isWet;
    return a.name.localeCompare(b.name);
  });

  return html`
    <div class="water-sensor-list">
      ${sortedSensors.map(sensor => renderWaterSensorItem(component, html, sensor))}
    </div>
  `;
}

/**
 * Render a single water sensor item
 */
function renderWaterSensorItem(component, html, sensor) {
  const icon = sensor.isWet ? 'mdi:water-alert' : 'mdi:water-check';

  return html`
    <div
      class="water-sensor-item ${sensor.isWet ? 'wet' : 'dry'}"
      @click=${() => openMoreInfo(component.hass, sensor.entityId)}
    >
      <div class="water-sensor-icon ${sensor.isWet ? 'alert' : ''}">
        <ha-icon icon="${icon}"></ha-icon>
      </div>
      <div class="water-sensor-info">
        <div class="water-sensor-name">${sensor.name}</div>
        <div class="water-sensor-area">${sensor.area || t('water.unknownArea')}</div>
      </div>
      <div class="water-sensor-state ${sensor.isWet ? 'alert' : ''}">
        ${sensor.isWet ? t('water.wet') : t('water.dry')}
      </div>
    </div>
  `;
}

/**
 * Get all enabled water leak sensors with their state
 * @param {Object} component - DashviewPanel instance
 * @returns {Array} Array of sensor objects
 */
function getEnabledWaterLeakSensors(component) {
  if (!component.hass) return [];

  const enabledWaterLeakSensors = component._enabledWaterLeakSensors || {};
  const sensors = [];

  // Get all enabled water leak sensor IDs
  const enabledIds = getEnabledEntityIds(enabledWaterLeakSensors);

  // If no sensors explicitly enabled, auto-discover moisture sensors
  if (enabledIds.length === 0) {
    Object.entries(component.hass.states).forEach(([entityId, state]) => {
      if (
        entityId.startsWith('binary_sensor.') &&
        state.attributes?.device_class === 'moisture'
      ) {
        // If explicitly disabled, skip
        if (enabledWaterLeakSensors[entityId] === false) return;

        sensors.push(createSensorObject(component, entityId, state));
      }
    });
  } else {
    // Use explicitly enabled sensors
    enabledIds.forEach(entityId => {
      const state = component.hass.states[entityId];
      if (state) {
        sensors.push(createSensorObject(component, entityId, state));
      }
    });
  }

  return sensors;
}

/**
 * Create a sensor object from entity state
 */
function createSensorObject(component, entityId, state) {
  const areaId = component._getAreaIdForEntity?.(entityId);
  const area = areaId ? component._areas?.find(a => a.area_id === areaId) : null;

  return {
    entityId,
    name: state.attributes?.friendly_name || entityId,
    isWet: state.state === 'on',
    area: area?.name || null,
    lastChanged: state.last_changed,
  };
}

export default { renderWaterPopup };
