/**
 * Weather Step Component
 * Sixth step in the setup wizard - select weather entity (optional)
 */

import { t } from '../../shared.js';

/**
 * Weather step styles
 */
export const weatherStepStyles = `
  /* ==================== WEATHER STEP ==================== */
  .dv-weather-step {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 0;
  }

  .dv-weather-header {
    text-align: center;
  }

  .dv-weather-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-weather-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== OPTIONAL BADGE ==================== */
  .dv-weather-optional {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    border-radius: 12px;
    font-size: 11px;
    font-weight: 500;
    color: var(--dv-accent-primary, var(--primary-color));
    margin-top: 8px;
  }

  /* ==================== ENTITY LIST ==================== */
  .dv-weather-entities {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 300px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .dv-weather-entity {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 2px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dv-weather-entity:hover {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-weather-entity.selected {
    border-color: var(--dv-accent-primary, var(--primary-color));
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.05));
  }

  .dv-weather-entity-radio {
    width: 20px;
    height: 20px;
    border: 2px solid var(--dv-border, var(--divider-color));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .dv-weather-entity.selected .dv-weather-entity-radio {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-weather-entity-radio::after {
    content: '';
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: var(--dv-accent-primary, var(--primary-color));
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .dv-weather-entity.selected .dv-weather-entity-radio::after {
    opacity: 1;
  }

  .dv-weather-entity-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-weather-entity-icon ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-weather-entity.selected .dv-weather-entity-icon {
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
  }

  .dv-weather-entity.selected .dv-weather-entity-icon ha-icon {
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-weather-entity-info {
    flex: 1;
    min-width: 0;
  }

  .dv-weather-entity-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dv-weather-entity-id {
    font-size: 12px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dv-weather-entity-condition {
    padding: 4px 10px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    text-transform: capitalize;
  }

  /* ==================== NONE OPTION ==================== */
  .dv-weather-none {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border: 2px dashed var(--dv-border, var(--divider-color));
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dv-weather-none:hover {
    border-color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-weather-none.selected {
    border-style: solid;
    border-color: var(--dv-accent-primary, var(--primary-color));
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.05));
  }

  .dv-weather-none-text {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  /* ==================== PREVIEW ==================== */
  .dv-weather-preview {
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-weather-preview-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .dv-weather-preview-content {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border-radius: 8px;
  }

  .dv-weather-preview-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-weather-preview-info {
    flex: 1;
  }

  .dv-weather-preview-temp {
    font-size: 24px;
    font-weight: 700;
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-weather-preview-condition {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    text-transform: capitalize;
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-weather-empty {
    text-align: center;
    padding: 32px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-radius: 12px;
  }

  .dv-weather-empty ha-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-bottom: 12px;
  }
`;

/**
 * Get weather condition icon
 * @param {string} condition - Weather condition
 * @returns {string} MDI icon
 */
function getWeatherIcon(condition) {
  const icons = {
    'clear-night': 'mdi:weather-night',
    'cloudy': 'mdi:weather-cloudy',
    'fog': 'mdi:weather-fog',
    'hail': 'mdi:weather-hail',
    'lightning': 'mdi:weather-lightning',
    'lightning-rainy': 'mdi:weather-lightning-rainy',
    'partlycloudy': 'mdi:weather-partly-cloudy',
    'pouring': 'mdi:weather-pouring',
    'rainy': 'mdi:weather-rainy',
    'snowy': 'mdi:weather-snowy',
    'snowy-rainy': 'mdi:weather-snowy-rainy',
    'sunny': 'mdi:weather-sunny',
    'windy': 'mdi:weather-windy',
    'windy-variant': 'mdi:weather-windy-variant',
    'exceptional': 'mdi:alert-circle-outline'
  };
  return icons[condition] || 'mdi:weather-partly-cloudy';
}

/**
 * Get available weather entities
 * @param {Object} hass - Home Assistant instance
 * @returns {Array} Weather entities
 */
export function getWeatherEntities(hass) {
  if (!hass?.states) return [];

  return Object.entries(hass.states)
    .filter(([entityId]) => entityId.startsWith('weather.'))
    .map(([entityId, state]) => ({
      entityId,
      friendlyName: state.attributes.friendly_name || entityId,
      condition: state.state,
      temperature: state.attributes.temperature,
      unit: state.attributes.temperature_unit || '°C'
    }))
    .sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
}

/**
 * Render the weather step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderWeatherStep(panel, html) {
  if (!panel.hass) {
    return html`
      <style>${weatherStepStyles}</style>
      <div class="dv-weather-step">
        <div class="dv-weather-empty">
          <ha-icon icon="mdi:loading" class="spin"></ha-icon>
          <p>${t('ui.errors.loading', 'Loading...')}</p>
        </div>
      </div>
    `;
  }

  // Initialize weather state if not exists
  if (!panel._wizardWeatherState) {
    panel._wizardWeatherState = {
      selectedEntity: panel._weatherEntity || null
    };
  }

  const state = panel._wizardWeatherState;
  const weatherEntities = getWeatherEntities(panel.hass);

  // Select entity handler
  const selectEntity = (entityId) => {
    state.selectedEntity = entityId;
    panel.requestUpdate();
  };

  // Get selected entity details
  const selectedEntity = weatherEntities.find(e => e.entityId === state.selectedEntity);

  return html`
    <style>${weatherStepStyles}</style>
    <div class="dv-weather-step">
      <div class="dv-weather-header">
        <h2 class="dv-weather-title">
          ${t('onboarding.weather.title', 'Weather Display')}
        </h2>
        <p class="dv-weather-desc">
          ${t('onboarding.weather.desc', 'Choose a weather entity to display forecasts on your dashboard.')}
        </p>
        <span class="dv-weather-optional">
          <ha-icon icon="mdi:information-outline" style="--mdc-icon-size: 12px;"></ha-icon>
          ${t('onboarding.weather.optional', 'Optional - you can skip this step')}
        </span>
      </div>

      <!-- Entity List -->
      <div class="dv-weather-entities">
        <!-- None option -->
        <div
          class="dv-weather-none ${state.selectedEntity === null ? 'selected' : ''}"
          @click=${() => selectEntity(null)}
        >
          <div class="dv-weather-entity-radio"></div>
          <span class="dv-weather-none-text">
            ${t('onboarding.weather.noWeather', 'Don\'t show weather on dashboard')}
          </span>
        </div>

        ${weatherEntities.length === 0 ? html`
          <div class="dv-weather-empty">
            <ha-icon icon="mdi:weather-cloudy-alert"></ha-icon>
            <p>${t('onboarding.weather.noEntities', 'No weather entities found. Install a weather integration in Home Assistant.')}</p>
          </div>
        ` : weatherEntities.map(entity => html`
          <div
            class="dv-weather-entity ${state.selectedEntity === entity.entityId ? 'selected' : ''}"
            @click=${() => selectEntity(entity.entityId)}
          >
            <div class="dv-weather-entity-radio"></div>
            <div class="dv-weather-entity-icon">
              <ha-icon icon="${getWeatherIcon(entity.condition)}"></ha-icon>
            </div>
            <div class="dv-weather-entity-info">
              <div class="dv-weather-entity-name">${entity.friendlyName}</div>
              <div class="dv-weather-entity-id">${entity.entityId}</div>
            </div>
            <div class="dv-weather-entity-condition">${entity.condition}</div>
          </div>
        `)}
      </div>

      <!-- Preview -->
      ${selectedEntity ? html`
        <div class="dv-weather-preview">
          <p class="dv-weather-preview-title">${t('onboarding.weather.preview', 'Preview')}</p>
          <div class="dv-weather-preview-content">
            <ha-icon class="dv-weather-preview-icon" icon="${getWeatherIcon(selectedEntity.condition)}"></ha-icon>
            <div class="dv-weather-preview-info">
              <div class="dv-weather-preview-temp">
                ${selectedEntity.temperature !== undefined
                  ? `${Math.round(selectedEntity.temperature)}${selectedEntity.unit}`
                  : '--'}
              </div>
              <div class="dv-weather-preview-condition">${selectedEntity.condition}</div>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Get selected weather entity from wizard state
 * @param {Object} panel - Panel instance
 * @returns {string|null} Selected entity ID
 */
export function getWeatherSelection(panel) {
  return panel._wizardWeatherState?.selectedEntity || null;
}

/**
 * Save weather entity to settings
 * @param {string|null} entityId - Weather entity ID
 * @param {Object} settingsStore - Settings store instance
 */
export function saveWeatherEntity(entityId, settingsStore) {
  try {
    const settings = settingsStore.settings || {};
    settingsStore.updateSettings({
      ...settings,
      weatherEntity: entityId
    });
  } catch (e) {
    console.warn('[Dashview] Failed to save weather entity:', e);
  }
}

export default renderWeatherStep;
