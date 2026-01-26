/**
 * Entity Preview Tooltip Component
 * Shows entity details on hover: current state, last changed, domain type
 */

import { t } from '../../utils/i18n.js';

/**
 * Format a timestamp as relative time (e.g., "5 minutes ago")
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted relative time
 */
function formatRelativeTime(timestamp) {
  if (!timestamp) return '';

  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return t('common.time.just_now', 'Just now');
  if (diffMinutes < 60) return t('common.time.ago_minutes', '{{minutes}}min ago').replace('{{minutes}}', diffMinutes);
  if (diffHours < 24) return t('common.time.ago_hours', '{{hours}}h ago').replace('{{hours}}', diffHours);
  return t('common.time.ago_days', '{{days}} days ago').replace('{{days}}', diffDays);
}

/**
 * Get display icon for entity domain
 * @param {string} domain - Entity domain (e.g., 'light', 'sensor')
 * @returns {string} MDI icon name
 */
function getDomainIcon(domain) {
  const icons = {
    light: 'mdi:lightbulb',
    switch: 'mdi:toggle-switch',
    sensor: 'mdi:eye',
    binary_sensor: 'mdi:checkbox-blank-circle',
    climate: 'mdi:thermostat',
    cover: 'mdi:window-shutter',
    media_player: 'mdi:speaker',
    lock: 'mdi:lock',
    camera: 'mdi:camera',
    vacuum: 'mdi:robot-vacuum',
    fan: 'mdi:fan',
    humidifier: 'mdi:air-humidifier',
  };
  return icons[domain] || 'mdi:help-circle';
}

/**
 * Get formatted state value with unit
 * @param {Object} state - HA state object
 * @returns {string} Formatted state
 */
function formatStateValue(state) {
  if (!state) return t('common.status.unavailable', 'Unavailable');

  const val = state.state;
  const attrs = state.attributes || {};

  // Handle special states
  if (val === 'unavailable') return t('common.status.unavailable', 'Unavailable');
  if (val === 'unknown') return t('common.status.unknown', 'Unknown');

  // For lights, show brightness
  if (state.entity_id?.startsWith('light.') && attrs.brightness !== undefined) {
    const brightnessPercent = Math.round((attrs.brightness / 255) * 100);
    const onText = t('common.status.on', 'On');
    const offText = t('common.status.off', 'Off');
    return val === 'on' ? `${onText} (${brightnessPercent}%)` : offText;
  }

  // For sensors with units
  if (attrs.unit_of_measurement) {
    return `${val} ${attrs.unit_of_measurement}`;
  }

  // For climate - use actual unit from entity
  if (state.entity_id?.startsWith('climate.') && attrs.current_temperature !== undefined) {
    const unit = attrs.temperature_unit || '°C';
    return `${attrs.current_temperature}${unit} (${val})`;
  }

  // For covers
  if (state.entity_id?.startsWith('cover.') && attrs.current_position !== undefined) {
    return `${attrs.current_position}% (${val})`;
  }

  return val;
}

/**
 * Render entity preview tooltip content
 * @param {Function} html - lit-html template function
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId - Entity ID to show preview for
 * @returns {TemplateResult} Tooltip content HTML
 */
export function renderEntityPreviewTooltip(html, hass, entityId) {
  if (!hass || !entityId) return '';

  const state = hass.states[entityId];
  if (!state) return html`<div class="entity-preview-tooltip">${t('admin.common.entityNotFound', 'Entity not found')}</div>`;

  const domain = entityId.split('.')[0];
  const friendlyName = state.attributes?.friendly_name || entityId;
  const stateValue = formatStateValue(state);
  const lastChanged = formatRelativeTime(state.last_changed);
  const deviceClass = state.attributes?.device_class;

  return html`
    <div class="entity-preview-tooltip">
      <div class="tooltip-header">
        <ha-icon icon="${getDomainIcon(domain)}"></ha-icon>
        <span class="tooltip-name">${friendlyName}</span>
      </div>
      <div class="tooltip-body">
        <div class="tooltip-row">
          <span class="tooltip-label">${t('admin.tooltip.state', 'State')}:</span>
          <span class="tooltip-value state-value">${stateValue}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">${t('admin.tooltip.changed', 'Changed')}:</span>
          <span class="tooltip-value">${lastChanged}</span>
        </div>
        <div class="tooltip-row">
          <span class="tooltip-label">${t('admin.tooltip.type', 'Type')}:</span>
          <span class="tooltip-value">${deviceClass || domain}</span>
        </div>
      </div>
    </div>
  `;
}

// Note: Tooltip CSS styles are defined in styles/admin/order.js
// to keep all admin styles consolidated in one place.
