/**
 * Dashview Admin - Layout Tab
 * Floor/room ordering, floor card configuration, and area cards
 */

import { getFloorIcon } from '../../utils/index.js';
import { renderEntitySection, renderCustomLabelSection } from '../../components/cards/index.js';
import { ENTITY_CONFIGS } from '../../constants/index.js';
import { renderEntityPicker } from '../../components/controls/index.js';
import { t, showConfirmation, createSectionHelpers } from './shared.js';
import { renderEmptyState } from '../../components/layout/empty-state.js';
import '../../components/controls/sortable-list.js';

/**
 * Render room configuration section
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Room config HTML
 */
export function renderRoomConfig(panel, html) {
  // Get ordered floors and rooms
  const orderedFloors = panel._getOrderedFloors();

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:floor-plan"></ha-icon>
      ${t('admin.entities.roomConfig')}
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      ${t('admin.entities.roomConfigDesc')}
    </p>

    ${panel._areas.length > 0
      ? html`
          ${orderedFloors.map(floor => {
            const roomsForFloor = panel._getOrderedRoomsForFloor(floor.floor_id);
            if (roomsForFloor.length === 0) return '';
            return html`
              <div style="margin-bottom: 8px;">
                <div style="font-size: 14px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; padding-left: 4px;">
                  ${floor.name}
                </div>
                ${roomsForFloor.map((area) => renderAreaCard(panel, html, area))}
              </div>
            `;
          })}
          ${(() => {
            const unassignedRooms = panel._getOrderedRoomsForFloor(null);
            if (unassignedRooms.length === 0) return '';
            return html`
              <div style="margin-bottom: 8px;">
                <div style="font-size: 14px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; padding-left: 4px;">
                  Unassigned Rooms
                </div>
                ${unassignedRooms.map((area) => renderAreaCard(panel, html, area))}
              </div>
            `;
          })()}
        `
      : renderEmptyState(html, {
          icon: 'mdi:home-alert',
          title: t('admin.entities.noAreas'),
          description: t('admin.entities.noAreasHint')
        })}
  `;
}

/**
 * Render a simple toggle for info text items (no entity config needed)
 */
export function renderInfoTextToggle(panel, html, key, label, icon, description) {
  const config = panel._infoTextConfig[key] || { enabled: false };

  const toggle = () => {
    panel._infoTextConfig = {
      ...panel._infoTextConfig,
      [key]: { ...config, enabled: !config.enabled }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  return html`
    <div class="info-text-config-item">
      <div class="info-text-config-row">
        <div class="info-text-config-icon">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="info-text-config-label">
          <span class="info-text-config-title">${label}</span>
          <span class="info-text-config-subtitle">${description}</span>
        </div>
        <div
          class="toggle-switch ${config.enabled ? 'on' : ''}"
          @click=${toggle}
        ></div>
      </div>
    </div>
  `;
}

/**
 * Render info text config with entity selection (for appliances)
 */
function renderInfoTextEntityConfig(panel, html, key, label, icon, description, hasFinishTime) {
  const config = panel._infoTextConfig[key] || { enabled: false, entity: '', finishTimeEntity: '' };

  // Initialize search state if not exists
  if (!panel._infoTextSearchState) {
    panel._infoTextSearchState = {};
  }
  if (!panel._infoTextSearchState[key]) {
    panel._infoTextSearchState[key] = { query: '', focused: false, finishQuery: '', finishFocused: false };
  }
  const searchState = panel._infoTextSearchState[key];

  const toggle = () => {
    panel._infoTextConfig = {
      ...panel._infoTextConfig,
      [key]: { ...config, enabled: !config.enabled }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  const selectEntity = (entityId) => {
    panel._infoTextConfig = {
      ...panel._infoTextConfig,
      [key]: { ...config, entity: entityId }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  const selectFinishTimeEntity = (entityId) => {
    panel._infoTextConfig = {
      ...panel._infoTextConfig,
      [key]: { ...config, finishTimeEntity: entityId }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  const removeEntity = () => {
    panel._infoTextConfig = {
      ...panel._infoTextConfig,
      [key]: { ...config, entity: '' }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  const removeFinishTimeEntity = () => {
    panel._infoTextConfig = {
      ...panel._infoTextConfig,
      [key]: { ...config, finishTimeEntity: '' }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  return html`
    <div class="info-text-config-item ${config.enabled ? 'expanded' : ''}">
      <div class="info-text-config-row">
        <div class="info-text-config-icon">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="info-text-config-label">
          <span class="info-text-config-title">${label}</span>
          <span class="info-text-config-subtitle">${description}</span>
        </div>
        <div
          class="toggle-switch ${config.enabled ? 'on' : ''}"
          @click=${toggle}
        ></div>
      </div>
      ${config.enabled ? html`
        <div class="info-text-config-entities">
          <div class="info-text-entity-row">
            <label>Status Entity</label>
            ${renderEntityPicker(html, {
              hass: panel.hass,
              value: '',
              searchQuery: searchState.query,
              focused: searchState.focused,
              placeholder: 'Search sensors...',
              domainFilter: 'sensor',
              maxSuggestions: 15,
              onSelect: (entityId) => {
                if (entityId) {
                  selectEntity(entityId);
                }
                searchState.query = '';
                panel.requestUpdate();
              },
              onSearch: (query) => {
                searchState.query = query;
                panel.requestUpdate();
              },
              onFocus: () => {
                searchState.focused = true;
                panel.requestUpdate();
              },
              onBlur: () => {
                searchState.focused = false;
                panel.requestUpdate();
              }
            })}
          </div>

          <!-- Selected Status Entity -->
          ${config.entity ? html`
            <div class="garbage-selected-sensors" style="margin-top: 8px;">
              <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--dv-gray800);">Selected Sensor</label>
              <div class="garbage-sensor-list">
                ${(() => {
                  const state = panel.hass?.states[config.entity];
                  const entityIcon = state?.attributes?.icon || icon;
                  const friendlyName = state?.attributes?.friendly_name || config.entity;

                  return html`
                    <div class="garbage-sensor-item selected">
                      <ha-icon icon="${entityIcon}"></ha-icon>
                      <div class="garbage-sensor-info">
                        <div class="garbage-sensor-name">${friendlyName}</div>
                        <div class="garbage-sensor-entity">${config.entity}</div>
                      </div>
                      <ha-icon
                        icon="mdi:close"
                        class="garbage-sensor-remove"
                        @click=${removeEntity}
                      ></ha-icon>
                    </div>
                  `;
                })()}
              </div>
            </div>
          ` : ''}

          ${hasFinishTime ? html`
            <div class="info-text-entity-row" style="margin-top: 16px;">
              <label>Finish Time Entity (optional)</label>
              ${renderEntityPicker(html, {
                hass: panel.hass,
                value: '',
                searchQuery: searchState.finishQuery,
                focused: searchState.finishFocused,
                placeholder: 'Search sensors...',
                domainFilter: 'sensor',
                maxSuggestions: 15,
                onSelect: (entityId) => {
                  if (entityId) {
                    selectFinishTimeEntity(entityId);
                  }
                  searchState.finishQuery = '';
                  panel.requestUpdate();
                },
                onSearch: (query) => {
                  searchState.finishQuery = query;
                  panel.requestUpdate();
                },
                onFocus: () => {
                  searchState.finishFocused = true;
                  panel.requestUpdate();
                },
                onBlur: () => {
                  searchState.finishFocused = false;
                  panel.requestUpdate();
                }
              })}
            </div>

            <!-- Selected Finish Time Entity -->
            ${config.finishTimeEntity ? html`
              <div class="garbage-selected-sensors" style="margin-top: 8px;">
                <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--dv-gray800);">Selected Finish Time Sensor</label>
                <div class="garbage-sensor-list">
                  ${(() => {
                    const state = panel.hass?.states[config.finishTimeEntity];
                    const entityIcon = state?.attributes?.icon || 'mdi:clock-outline';
                    const friendlyName = state?.attributes?.friendly_name || config.finishTimeEntity;

                    return html`
                      <div class="garbage-sensor-item selected">
                        <ha-icon icon="${entityIcon}"></ha-icon>
                        <div class="garbage-sensor-info">
                          <div class="garbage-sensor-name">${friendlyName}</div>
                          <div class="garbage-sensor-entity">${config.finishTimeEntity}</div>
                        </div>
                        <ha-icon
                          icon="mdi:close"
                          class="garbage-sensor-remove"
                          @click=${removeFinishTimeEntity}
                        ></ha-icon>
                      </div>
                    `;
                  })()}
                </div>
              </div>
            ` : ''}
          ` : ''}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render battery low config with threshold
 */
export function renderInfoTextBatteryConfig(panel, html) {
  const config = panel._infoTextConfig.batteryLow || { enabled: false, threshold: 20 };

  const toggle = () => {
    panel._infoTextConfig = {
      ...panel._infoTextConfig,
      batteryLow: { ...config, enabled: !config.enabled }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  const updateThreshold = (e) => {
    panel._infoTextConfig = {
      ...panel._infoTextConfig,
      batteryLow: { ...config, threshold: parseInt(e.target.value) || 20 }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  return html`
    <div class="info-text-config-item ${config.enabled ? 'expanded' : ''}">
      <div class="info-text-config-row">
        <div class="info-text-config-icon">
          <ha-icon icon="mdi:battery-low"></ha-icon>
        </div>
        <div class="info-text-config-label">
          <span class="info-text-config-title">Niedriger Akkustand</span>
          <span class="info-text-config-subtitle">Warnung bei niedrigem Akkustand von Geräten</span>
        </div>
        <div
          class="toggle-switch ${config.enabled ? 'on' : ''}"
          @click=${toggle}
        ></div>
      </div>
      ${config.enabled ? html`
        <div class="info-text-config-entities">
          <div class="info-text-entity-row">
            <label>Schwellenwert</label>
            <div class="info-text-threshold-input">
              <input
                type="number"
                min="5"
                max="50"
                .value=${config.threshold || 20}
                @change=${updateThreshold}
              />
              <span>%</span>
            </div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render card configuration section (climate thresholds, weather, garbage)
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Card config HTML
 */
export function renderCardConfig(panel, html) {
  const orderedFloors = panel._getOrderedFloors();

  // Section toggle helpers with localStorage persistence
  const { toggleSection, isExpanded } = createSectionHelpers(panel);

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:card-multiple"></ha-icon>
      Card Configuration
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure which cards appear on the Home dashboard and customize their settings.
    </p>

    <!-- Room Climate Notification Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('climate')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          Room Climate Notification
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('climate') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('climate') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Show a ventilation warning in room popups when temperature or humidity exceeds these thresholds.
        </p>

        <div class="card-config-row">
          <div class="card-config-label">
            <span class="card-config-label-title">Temperature Threshold</span>
            <span class="card-config-label-subtitle">Show notification when temperature is above this value</span>
          </div>
          <div class="card-config-input">
            <input
              type="number"
              min="0"
              max="50"
              step="1"
              .value=${panel._notificationTempThreshold}
              @change=${panel._handleTempThresholdChange}
            />
            <span class="card-config-unit">°C</span>
          </div>
        </div>

        <div class="card-config-row">
          <div class="card-config-label">
            <span class="card-config-label-title">Humidity Threshold</span>
            <span class="card-config-label-subtitle">Show notification when humidity is above this value</span>
          </div>
          <div class="card-config-input">
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              .value=${panel._notificationHumidityThreshold}
              @change=${panel._handleHumidityThresholdChange}
            />
            <span class="card-config-unit">%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Weather Card Configuration Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('weather')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>
          Weather Card
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('weather') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('weather') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Select the weather entity for the header and weather popup. All forecast data will be fetched from this entity.
        </p>

        <div class="card-config-row">
          <div class="card-config-label">
            <span class="card-config-label-title">${t('admin.weather.weatherEntity')}</span>
            <span class="card-config-label-subtitle">Select your weather integration</span>
          </div>
          <div class="card-config-input" style="flex: 1;">
            <select
              .value=${panel._weatherEntity}
              @change=${(e) => {
                panel._weatherEntity = e.target.value;
                panel._weatherForecasts = [];
                panel._weatherHourlyForecasts = [];
                panel._fetchWeatherForecasts();
                panel._saveSettings();
                panel.requestUpdate();
              }}
              style="width: 100%; padding: 8px; border-radius: 8px; border: 1px solid var(--dv-gray300); background: var(--dv-gray000); color: var(--dv-gray800);"
            >
              ${panel._availableWeatherEntities.length === 0
                ? html`<option value="">Loading weather entities...</option>`
                : panel._availableWeatherEntities.map(entity => html`
                    <option value="${entity.entity_id}" ?selected=${panel._weatherEntity === entity.entity_id}>
                      ${entity.name} (${entity.entity_id})
                    </option>
                  `)
              }
            </select>
          </div>
        </div>

        <!-- DWD Warning Entity -->
        <div class="card-config-row" style="margin-top: 16px;">
          <div class="card-config-label">
            <span class="card-config-label-title">DWD Warning Entity</span>
            <span class="card-config-label-subtitle">German weather warnings (sensor.xxx_current_warning_level)</span>
          </div>
          <div class="card-config-input" style="flex: 1;">
            ${renderEntityPicker(html, {
              hass: panel.hass,
              value: '',
              searchQuery: panel._dwdWarningSearchQuery,
              focused: panel._dwdWarningSearchFocused,
              placeholder: 'Search sensors (e.g. dwd, warning)...',
              domainFilter: 'sensor',
              maxSuggestions: 15,
              onSelect: (entityId) => {
                if (entityId) {
                  panel._dwdWarningEntity = entityId;
                  panel._saveSettings();
                }
                panel._dwdWarningSearchQuery = '';
                panel.requestUpdate();
              },
              onSearch: (query) => {
                panel._dwdWarningSearchQuery = query;
                panel.requestUpdate();
              },
              onFocus: () => {
                panel._dwdWarningSearchFocused = true;
                panel.requestUpdate();
              },
              onBlur: () => {
                panel._dwdWarningSearchFocused = false;
                panel.requestUpdate();
              }
            })}
          </div>
        </div>

        <!-- Selected DWD Warning Sensor -->
        ${panel._dwdWarningEntity ? html`
          <div class="garbage-selected-sensors" style="margin-top: 12px;">
            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--dv-gray800);">Selected Sensor</label>
            <div class="garbage-sensor-list">
              ${(() => {
                const state = panel.hass?.states[panel._dwdWarningEntity];
                const icon = state?.attributes?.icon || 'mdi:alert';
                const friendlyName = state?.attributes?.friendly_name || panel._dwdWarningEntity;

                return html`
                  <div class="garbage-sensor-item selected">
                    <ha-icon icon="${icon}"></ha-icon>
                    <div class="garbage-sensor-info">
                      <div class="garbage-sensor-name">${friendlyName}</div>
                      <div class="garbage-sensor-entity">${panel._dwdWarningEntity}</div>
                    </div>
                    <ha-icon
                      icon="mdi:close"
                      class="garbage-sensor-remove"
                      @click=${() => {
                        panel._dwdWarningEntity = '';
                        panel._saveSettings();
                        panel.requestUpdate();
                      }}
                    ></ha-icon>
                  </div>
                `;
              })()}
            </div>
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Garbage Card Configuration Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('garbage')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:trash-can"></ha-icon>
          Garbage Card
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('garbage') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('garbage') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 12px; font-size: 14px;">
          Search and add sensor entities to display upcoming garbage pickup dates. The card shows in the Big 2 position.
        </p>

        <!-- Search Input -->
        <div class="garbage-search-container">
          <div class="garbage-search-input-wrapper">
            <ha-icon icon="mdi:magnify" class="garbage-search-icon"></ha-icon>
            <input
              type="text"
              class="garbage-search-input"
              placeholder="Search sensor entities..."
              .value=${panel._garbageSearchQuery || ''}
              @input=${(e) => panel._handleGarbageSearch(e.target.value)}
              @focus=${() => panel._garbageSearchFocused = true}
              @blur=${() => setTimeout(() => { panel._garbageSearchFocused = false; panel.requestUpdate(); }, 200)}
            />
            ${panel._garbageSearchQuery ? html`
              <ha-icon
                icon="mdi:close"
                class="garbage-search-clear"
                @click=${() => panel._handleGarbageSearch('')}
              ></ha-icon>
            ` : ''}
          </div>

          <!-- Search Suggestions Dropdown -->
          ${panel._garbageSearchQuery && panel._garbageSearchFocused ? html`
            <div class="garbage-search-suggestions">
              ${panel._getGarbageSearchSuggestions().length === 0 ? html`
                <div class="garbage-search-no-results">No matching sensors found</div>
              ` : panel._getGarbageSearchSuggestions().map(sensor => {
                const state = panel.hass?.states[sensor.entity_id];
                const icon = state?.attributes?.icon || 'mdi:trash-can';
                const friendlyName = state?.attributes?.friendly_name || sensor.entity_id;
                const alreadyAdded = panel._garbageSensors.includes(sensor.entity_id);

                return html`
                  <div
                    class="garbage-search-suggestion ${alreadyAdded ? 'disabled' : ''}"
                    @click=${() => !alreadyAdded && panel._addGarbageSensor(sensor.entity_id)}
                  >
                    <ha-icon icon="${icon}"></ha-icon>
                    <div class="garbage-suggestion-info">
                      <div class="garbage-suggestion-name">${friendlyName}</div>
                      <div class="garbage-suggestion-entity">${sensor.entity_id}</div>
                    </div>
                    ${alreadyAdded ? html`
                      <span class="garbage-suggestion-added">Added</span>
                    ` : html`
                      <ha-icon icon="mdi:plus" class="garbage-suggestion-add"></ha-icon>
                    `}
                  </div>
                `;
              })}
            </div>
          ` : ''}
        </div>

        <!-- Selected Sensors List -->
        ${panel._garbageSensors.length > 0 ? html`
          <div class="garbage-selected-sensors">
            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--dv-gray800);">Selected Sensors</label>
            <div class="garbage-sensor-list">
              ${panel._garbageSensors.map(entityId => {
                const state = panel.hass?.states[entityId];
                const icon = state?.attributes?.icon || 'mdi:trash-can';
                const friendlyName = state?.attributes?.friendly_name || entityId;

                return html`
                  <div class="garbage-sensor-item selected">
                    <ha-icon icon="${icon}"></ha-icon>
                    <div class="garbage-sensor-info">
                      <div class="garbage-sensor-name">${friendlyName}</div>
                      <div class="garbage-sensor-entity">${entityId}</div>
                    </div>
                    <ha-icon
                      icon="mdi:close"
                      class="garbage-sensor-remove"
                      @click=${() => panel._removeGarbageSensor(entityId)}
                    ></ha-icon>
                  </div>
                `;
              })}
            </div>
          </div>
        ` : renderEmptyState(html, {
          icon: 'mdi:trash-can-outline',
          title: 'No sensors added yet',
          hint: 'Use the search above to find and add garbage pickup sensors'
        })}

        <!-- Floor Selection -->
        <div class="garbage-floor-selector">
          <label>Display on Floor</label>
          <p style="color: var(--dv-gray600); margin-bottom: 12px; font-size: 12px;">
            Select which floor should show the garbage card in the Big 2 (bottom-left) position.
          </p>
          <div class="garbage-floor-buttons">
            <button
              class="garbage-floor-btn ${!panel._garbageDisplayFloor ? 'active' : ''}"
              @click=${() => panel._setGarbageDisplayFloor(null)}
            >
              None
            </button>
            ${orderedFloors.map(floor => html`
              <button
                class="garbage-floor-btn ${panel._garbageDisplayFloor === floor.floor_id ? 'active' : ''}"
                @click=${() => panel._setGarbageDisplayFloor(floor.floor_id)}
              >
                ${floor.name}
              </button>
            `)}
          </div>
        </div>

        ${panel._garbageSensors.length > 0 ? html`
          <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--dv-gray300);">
            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--dv-gray800);">Preview</label>
            ${panel._renderGarbageCard()}
          </div>
        ` : ''}
      </div>
    </div>

    <!-- Info Text Configuration Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('infoText')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:text-box-outline"></ha-icon>
          Info Text Area
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('infoText') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('infoText') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Configure which status messages appear in the info text area below the header.
        </p>

        <!-- Motion Status -->
        ${renderInfoTextToggle(panel, html, 'motion', t('admin.infoTextToggles.motion'), 'mdi:motion-sensor',
          t('admin.infoTextToggles.motionDesc'))}

        <!-- Garage Status -->
        ${renderInfoTextToggle(panel, html, 'garage', t('admin.infoTextToggles.garage'), 'mdi:garage',
          t('admin.infoTextToggles.garageDesc'))}

        <!-- Windows Status -->
        ${renderInfoTextToggle(panel, html, 'windows', t('admin.infoTextToggles.windows'), 'mdi:window-open',
          t('admin.infoTextToggles.windowsDesc'))}

        <!-- Lights Status -->
        ${renderInfoTextToggle(panel, html, 'lights', t('admin.infoTextToggles.lights'), 'mdi:lightbulb',
          t('admin.infoTextToggles.lightsDesc'))}

        <!-- Covers Status -->
        ${renderInfoTextToggle(panel, html, 'covers', t('admin.infoTextToggles.covers'), 'mdi:window-shutter',
          t('admin.infoTextToggles.coversDesc'))}

        <!-- TVs Status -->
        ${renderInfoTextToggle(panel, html, 'tvs', t('admin.infoTextToggles.tvs'), 'mdi:television',
          t('admin.infoTextToggles.tvsDesc'))}

        <!-- Washer Status -->
        ${renderInfoTextEntityConfig(panel, html, 'washer', t('admin.infoTextToggles.washer'), 'mdi:washing-machine',
          t('admin.infoTextToggles.washerDesc'), true)}

        <!-- Dishwasher Status -->
        ${renderInfoTextEntityConfig(panel, html, 'dishwasher', t('admin.infoTextToggles.dishwasher'), 'mdi:dishwasher',
          t('admin.infoTextToggles.dishwasherDesc'), true)}

        <!-- Dryer Status -->
        ${renderInfoTextEntityConfig(panel, html, 'dryer', t('admin.infoTextToggles.dryer'), 'mdi:tumble-dryer',
          t('admin.infoTextToggles.dryerDesc'), true)}

        <!-- Vacuum Status -->
        ${renderInfoTextEntityConfig(panel, html, 'vacuum', t('admin.infoTextToggles.vacuum'), 'mdi:robot-vacuum',
          t('admin.infoTextToggles.vacuumDesc'), false)}

        <!-- Battery Low Status -->
        ${renderInfoTextBatteryConfig(panel, html)}
      </div>
    </div>

    <!-- Scene Buttons Configuration Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('sceneButtons')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:play-box-multiple"></ha-icon>
          ${t('admin.scenes.sceneButtons')}
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('sceneButtons') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('sceneButtons') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Configure quick action buttons that appear below the header. Each button can control lights, covers, scripts or scenes.
        </p>

        <!-- Existing Scene Buttons -->
        <div class="scene-buttons-list">
          ${panel._sceneButtons.map((button, index) => renderSceneButtonItem(panel, html, button, index))}
        </div>

        <!-- Add New Scene Button -->
        <button class="scene-button-add" @click=${() => panel._addSceneButton()}>
          <ha-icon icon="mdi:plus"></ha-icon>
          Add Scene Button
        </button>
      </div>
    </div>

    <!-- Custom Labels Configuration Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('customLabels')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:tag-multiple"></ha-icon>
          Custom Labels
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('customLabels') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('customLabels') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Enable custom labels to show their entities in room configuration. Custom labels are user-defined labels beyond the standard types (lights, covers, etc.). Entities with enabled labels can have related child entities linked to them.
        </p>

        ${panel._getCustomLabels().length === 0 ? html`
          <div class="custom-labels-empty">
            <ha-icon icon="mdi:tag-off-outline"></ha-icon>
            <p>No custom labels found in Home Assistant.</p>
            <p style="font-size: 12px; margin-top: 8px;">Create labels in Settings → Labels to organize your entities.</p>
          </div>
        ` : html`
          <div class="custom-labels-list">
            ${panel._getCustomLabels().map(label => html`
              <div class="custom-label-item ${label.enabled ? 'enabled' : ''}">
                <div class="custom-label-info">
                  <ha-icon icon="${label.icon}" style="${label.color ? `color: ${label.color}` : ''}"></ha-icon>
                  <div class="custom-label-text">
                    <span class="custom-label-name">${label.name}</span>
                    ${label.description ? html`
                      <span class="custom-label-description">${label.description}</span>
                    ` : ''}
                  </div>
                </div>
                <div
                  class="toggle-switch ${label.enabled ? 'on' : ''}"
                  @click=${() => panel._toggleCustomLabel(label.label_id)}
                ></div>
              </div>
            `)}
          </div>
        `}
      </div>
    </div>
  `;
}

/**
 * Render a scene button configuration item
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Object} button - Button configuration
 * @param {number} index - Button index
 * @returns {TemplateResult} Scene button item HTML
 */
export function renderSceneButtonItem(panel, html, button, index) {
  // Initialize search state if not exists
  if (!panel._sceneButtonSearchState) {
    panel._sceneButtonSearchState = {};
  }
  if (!panel._sceneButtonSearchState[index]) {
    panel._sceneButtonSearchState[index] = {
      entityQuery: '',
      entityFocused: false,
      iconQuery: '',
      iconFocused: false,
      iconValid: true,
      iconPreview: null
    };
  }
  const searchState = panel._sceneButtonSearchState[index];

  const updateButton = (field, value) => {
    const buttons = [...panel._sceneButtons];
    buttons[index] = { ...buttons[index], [field]: value };
    panel._sceneButtons = buttons;
    panel._saveSettings();
    panel.requestUpdate();
  };

  const removeButton = () => {
    // Show confirmation dialog before deleting
    const buttonName = button.label || 'New Button';
    showConfirmation(panel, {
      title: t('admin.confirmation.deleteScene'),
      message: t('admin.confirmation.deleteSceneMessage', { name: buttonName }),
      onConfirm: () => {
        panel._sceneButtons = panel._sceneButtons.filter((_, i) => i !== index);
        // Clean up search state
        delete panel._sceneButtonSearchState[index];
        panel._saveSettings();
        panel.requestUpdate();
      }
    });
  };

  // Determine domain filter based on action type
  const getDomainFilter = () => {
    switch (button.actionType) {
      case 'scene': return 'scene';
      case 'script': return 'script';
      default: return ['light', 'switch', 'cover', 'script', 'scene', 'automation', 'input_boolean'];
    }
  };

  // Common MDI icons for quick selection
  const commonIcons = [
    'mdi:lightbulb', 'mdi:lightbulb-group', 'mdi:lamp', 'mdi:ceiling-light',
    'mdi:floor-lamp', 'mdi:led-strip', 'mdi:light-switch',
    'mdi:power', 'mdi:power-off', 'mdi:toggle-switch',
    'mdi:window-shutter', 'mdi:blinds', 'mdi:curtains',
    'mdi:home', 'mdi:home-outline', 'mdi:door', 'mdi:garage',
    'mdi:bed', 'mdi:sofa', 'mdi:television', 'mdi:speaker',
    'mdi:fan', 'mdi:air-conditioner', 'mdi:thermometer',
    'mdi:weather-night', 'mdi:weather-sunny', 'mdi:moon-waning-crescent',
    'mdi:movie', 'mdi:party-popper', 'mdi:silverware-fork-knife',
    'mdi:coffee', 'mdi:sleep', 'mdi:run', 'mdi:exit-run'
  ];

  // Filter icons based on search query
  const getFilteredIcons = () => {
    if (!searchState.iconQuery) return commonIcons;
    const query = searchState.iconQuery.toLowerCase();
    return commonIcons.filter(icon => icon.toLowerCase().includes(query));
  };

  return html`
    <div class="scene-button-item">
      <!-- Header with icon preview, label, and delete -->
      <div class="scene-button-item-header">
        <div class="scene-button-item-icon">
          <ha-icon icon="${button.icon || 'mdi:help'}"></ha-icon>
        </div>
        <div class="scene-button-item-info">
          <div class="scene-button-item-name">${button.label || 'New Button'}</div>
          <div class="scene-button-item-type">
            ${button.actionType === 'scene' ? 'Scene' : button.actionType === 'script' ? 'Script' : 'Service'}
            ${button.roomId ? ` → ${panel._areas.find(a => a.area_id === button.roomId)?.name || 'Room'}` : ' → Main Page'}
          </div>
        </div>
        <ha-icon
          icon="mdi:delete"
          class="scene-button-delete"
          @click=${(e) => { e.stopPropagation(); removeButton(); }}
        ></ha-icon>
      </div>

      <!-- Configuration fields -->
      <div class="scene-button-item-config">
        <!-- Button Label -->
        <div class="scene-button-config-row">
          <label>Button Label</label>
          <input
            type="text"
            placeholder="e.g. All Off"
            .value=${button.label || ''}
            @change=${(e) => updateButton('label', e.target.value)}
          />
        </div>

        <!-- Icon Selection -->
        <div class="scene-button-config-row">
          <label>Icon</label>
          <div class="entity-picker">
            <div class="entity-picker-input-wrapper">
              <ha-icon icon="${button.icon || 'mdi:help'}" class="entity-picker-icon" style="--mdc-icon-size: 18px;"></ha-icon>
              <input
                type="text"
                class="entity-picker-input"
                placeholder="Enter icon name (e.g., mdi:coffee) or search..."
                .value=${searchState.iconFocused ? searchState.iconQuery : (button.icon || '')}
                @input=${(e) => {
                  let value = e.target.value.trim();
                  searchState.iconQuery = value;

                  // Auto-prepend "mdi:" if user enters just icon name (has letters/numbers/hyphens but no colon)
                  if (value && !value.includes(':') && value.match(/^[a-z0-9-]+$/i)) {
                    value = 'mdi:' + value;
                  }

                  // Validate icon format
                  const lowerValue = value.toLowerCase();
                  if (value && lowerValue.match(/^mdi:[a-z0-9-]+$/)) {
                    searchState.iconValid = true;
                    searchState.iconPreview = lowerValue;
                  } else if (!value) {
                    searchState.iconValid = true;
                    searchState.iconPreview = null;
                  } else {
                    searchState.iconValid = false;
                    searchState.iconPreview = null;
                  }

                  panel.requestUpdate();
                }}
                @focus=${() => {
                  searchState.iconFocused = true;
                  searchState.iconQuery = button.icon || '';
                  searchState.iconValid = true;
                  searchState.iconPreview = null;
                  panel.requestUpdate();
                }}
                @blur=${() => setTimeout(() => {
                  let value = searchState.iconQuery.trim();

                  // Auto-prepend "mdi:" if user enters just icon name
                  if (value && !value.includes(':') && value.match(/^[a-z0-9-]+$/i)) {
                    value = 'mdi:' + value;
                  }

                  const lowerValue = value.toLowerCase();
                  // Update button if valid icon format
                  if (value && lowerValue.match(/^mdi:[a-z0-9-]+$/)) {
                    updateButton('icon', lowerValue);
                  }

                  searchState.iconFocused = false;
                  searchState.iconValid = true;
                  searchState.iconPreview = null;
                  panel.requestUpdate();
                }, 200)}
              />
              ${searchState.iconPreview ? html`
                <ha-icon
                  icon="${searchState.iconPreview}"
                  style="--mdc-icon-size: 18px; margin-right: 8px; color: var(--dv-blue);"
                  title="Preview"
                ></ha-icon>
              ` : ''}
              ${button.icon ? html`
                <ha-icon
                  icon="mdi:close"
                  class="entity-picker-clear"
                  @click=${() => {
                    updateButton('icon', '');
                    searchState.iconQuery = '';
                    searchState.iconValid = true;
                    searchState.iconPreview = null;
                  }}
                ></ha-icon>
              ` : ''}
            </div>

            <!-- Validation error message -->
            ${searchState.iconQuery && !searchState.iconValid ? html`
              <div style="color: var(--dv-red); font-size: 12px; margin-top: 4px; padding-left: 4px;">
                Invalid icon format. Use "mdi:icon-name" (e.g., mdi:coffee)
              </div>
            ` : ''}

            <!-- Quick select icons (show when focused) -->
            ${searchState.iconFocused ? html`
              <div class="entity-picker-suggestions">
                ${getFilteredIcons().length === 0 ? html`
                  <div class="entity-picker-no-results">No matching icons found in quick select list</div>
                ` : getFilteredIcons().map(icon => html`
                  <div
                    class="entity-picker-suggestion ${button.icon === icon ? 'selected' : ''}"
                    @mousedown=${(e) => {
                      e.preventDefault();
                      updateButton('icon', icon);
                      searchState.iconQuery = '';
                      searchState.iconFocused = false;
                      searchState.iconValid = true;
                      searchState.iconPreview = null;
                    }}
                  >
                    <ha-icon icon="${icon}"></ha-icon>
                    <div class="entity-picker-suggestion-info">
                      <div class="entity-picker-suggestion-name">${icon.replace('mdi:', '')}</div>
                    </div>
                    ${button.icon === icon ? html`
                      <ha-icon icon="mdi:check" class="entity-picker-suggestion-check"></ha-icon>
                    ` : ''}
                  </div>
                `)}
              </div>
            ` : ''}
          </div>
          <div style="font-size: 11px; color: var(--dv-gray500); margin-top: 4px;">
            Find icons at <a href="https://pictogrammers.com/library/mdi/" target="_blank" style="color: var(--dv-blue); text-decoration: none;">pictogrammers.com/library/mdi</a>
          </div>
        </div>

        <!-- Action Type -->
        <div class="scene-button-config-row">
          <label>Action Type</label>
          <select
            .value=${button.actionType || 'service'}
            @change=${(e) => {
              updateButton('actionType', e.target.value);
              // Clear entity when action type changes
              updateButton('entity', '');
            }}
          >
            <option value="service">Service Call</option>
            <option value="scene">Activate Scene</option>
            <option value="script">Run Script</option>
          </select>
        </div>

        <!-- Entity/Service Selection -->
        <div class="scene-button-config-row">
          <label>Entity/Service</label>
          ${renderEntityPicker(html, {
            hass: panel.hass,
            value: '',
            searchQuery: searchState.entityQuery,
            focused: searchState.entityFocused,
            placeholder: button.actionType === 'scene'
              ? 'Search scenes...'
              : button.actionType === 'script'
                ? 'Search scripts...'
                : 'Search entities...',
            domainFilter: getDomainFilter(),
            maxSuggestions: 15,
            onSelect: (entityId) => {
              if (entityId) {
                updateButton('entity', entityId);
              }
              searchState.entityQuery = '';
              panel.requestUpdate();
            },
            onSearch: (query) => {
              searchState.entityQuery = query;
              panel.requestUpdate();
            },
            onFocus: () => {
              searchState.entityFocused = true;
              panel.requestUpdate();
            },
            onBlur: () => {
              searchState.entityFocused = false;
              panel.requestUpdate();
            }
          })}
        </div>

        <!-- Selected Entity Display -->
        ${button.entity ? html`
          <div class="garbage-selected-sensors" style="margin-top: 8px;">
            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--dv-gray800);">Selected Entity</label>
            <div class="garbage-sensor-list">
              ${(() => {
                const state = panel.hass?.states[button.entity];
                const entityIcon = state?.attributes?.icon || 'mdi:play-circle';
                const friendlyName = state?.attributes?.friendly_name || button.entity;

                return html`
                  <div class="garbage-sensor-item selected">
                    <ha-icon icon="${entityIcon}"></ha-icon>
                    <div class="garbage-sensor-info">
                      <div class="garbage-sensor-name">${friendlyName}</div>
                      <div class="garbage-sensor-entity">${button.entity}</div>
                    </div>
                    <ha-icon
                      icon="mdi:close"
                      class="garbage-sensor-remove"
                      @click=${() => updateButton('entity', '')}
                    ></ha-icon>
                  </div>
                `;
              })()}
            </div>
          </div>
        ` : ''}

        <!-- Room Assignment -->
        <div class="scene-button-config-row" style="margin-top: 16px;">
          <label>Display Location</label>
          <select
            .value=${button.roomId || ''}
            @change=${(e) => updateButton('roomId', e.target.value)}
          >
            <option value="">Main Page (Home)</option>
            ${panel._areas
              .filter(area => panel._enabledRooms[area.area_id] !== false)
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(area => html`
                <option value="${area.area_id}" ?selected=${button.roomId === area.area_id}>
                  ${area.name}
                </option>
              `)
            }
          </select>
          <p style="font-size: 11px; color: var(--dv-gray600); margin-top: 4px;">
            Select a room to show this button in the room popup, or leave empty for main page.
          </p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render order configuration section (floor and room ordering)
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Order config HTML
 */
export function renderOrderConfig(panel, html) {
  // Get sorted floors
  const sortedFloors = panel._getOrderedFloors();

  // Section toggle helpers with localStorage persistence
  const { toggleSection, isExpanded } = createSectionHelpers(panel);

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:sort"></ha-icon>
      ${t('admin.layout.floorOrder')}
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      ${t('admin.layout.floorOrderDesc')}
    </p>

    <!-- Floors Section -->
    <div class="order-config-section">
      <div class="order-config-section-header" @click=${() => toggleSection('floorOrder')}>
        <div class="order-config-section-title">
          <ha-icon icon="mdi:layers"></ha-icon>
          Floor Order
          <span style="margin-left: 8px; font-size: 12px; opacity: 0.7;">(${sortedFloors.length} floors)</span>
        </div>
        <ha-icon
          class="order-config-section-chevron ${isExpanded('floorOrder') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="order-config-section-content ${isExpanded('floorOrder') ? 'expanded' : ''}">
        ${sortedFloors.length === 0 ? renderEmptyState(html, {
          icon: 'mdi:floor-plan',
          title: 'No floors configured in Home Assistant',
          hint: 'Go to Settings → Areas & Zones → Floors to create floors'
        }) : html`
          <sortable-list
            item-key="floor_id"
            handle-selector=".sortable-handle"
            @reorder=${(e) => panel._handleFloorReorder(e.detail)}
          >
            <div class="order-list">
              ${sortedFloors.map((floor, index) => html`
                <div class="order-item sortable-item" data-id="${floor.floor_id}">
                  <div class="sortable-handle" title="${t('admin.layout.dragToReorder')}">
                    <ha-icon icon="mdi:drag-horizontal"></ha-icon>
                  </div>
                  <div class="order-item-index">${index + 1}</div>
                  <div class="order-item-icon">
                    <ha-icon icon="${getFloorIcon(floor)}"></ha-icon>
                  </div>
                  <div class="order-item-info">
                    <div class="order-item-name">${floor.name}</div>
                    <div class="order-item-subtitle">
                      ${panel._getAreasForFloor(floor.floor_id).length} rooms
                    </div>
                  </div>
                  <div class="order-item-buttons">
                    <button
                      class="order-btn"
                      ?disabled=${index === 0}
                      @click=${() => panel._moveFloor(floor.floor_id, -1)}
                      title="${t('admin.layout.moveUp')}"
                    >
                      <ha-icon icon="mdi:chevron-up"></ha-icon>
                    </button>
                    <button
                      class="order-btn"
                      ?disabled=${index === sortedFloors.length - 1}
                      @click=${() => panel._moveFloor(floor.floor_id, 1)}
                      title="${t('admin.layout.moveDown')}"
                    >
                      <ha-icon icon="mdi:chevron-down"></ha-icon>
                    </button>
                  </div>
                </div>
              `)}
            </div>
          </sortable-list>
        `}
      </div>
    </div>

    <!-- Rooms per Floor Section -->
    <div class="order-config-section">
      <div class="order-config-section-header" @click=${() => toggleSection('roomOrder')}>
        <div class="order-config-section-title">
          <ha-icon icon="mdi:door"></ha-icon>
          Room Order (per Floor)
        </div>
        <ha-icon
          class="order-config-section-chevron ${isExpanded('roomOrder') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="order-config-section-content ${isExpanded('roomOrder') ? 'expanded' : ''}">
        ${sortedFloors.length === 0 ? renderEmptyState(html, {
          icon: 'mdi:home-alert',
          title: 'Configure floors first to order rooms'
        }) : sortedFloors.map(floor => {
          const rooms = panel._getOrderedRoomsForFloor(floor.floor_id);
          return html`
            <div class="order-floor-section">
              <div class="order-floor-header">
                <ha-icon icon="${getFloorIcon(floor)}"></ha-icon>
                <span class="order-floor-name">${floor.name}</span>
                <span style="opacity: 0.8; font-size: 13px;">${rooms.length} rooms</span>
              </div>

              ${rooms.length === 0 ? html`
                <p style="color: var(--dv-gray600); padding: 12px 0 0 36px; font-size: 14px;">
                  No rooms assigned to this floor.
                </p>
              ` : html`
                <div class="order-rooms-list">
                  <sortable-list
                    item-key="area_id"
                    handle-selector=".sortable-handle"
                    @reorder=${(e) => panel._handleRoomReorder(floor.floor_id, e.detail)}
                  >
                    <div class="order-list">
                      ${rooms.map((area, index) => html`
                        <div class="order-item sortable-item" data-id="${area.area_id}">
                          <div class="sortable-handle" title="${t('admin.layout.dragToReorder')}">
                            <ha-icon icon="mdi:drag-horizontal"></ha-icon>
                          </div>
                          <div class="order-item-index">${index + 1}</div>
                          <div class="order-item-icon">
                            <ha-icon icon="${panel._getAreaIcon(area)}"></ha-icon>
                          </div>
                          <div class="order-item-info">
                            <div class="order-item-name">${area.name}</div>
                            <div class="order-item-subtitle">
                              ${panel._enabledRooms[area.area_id] !== false ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                          <div class="order-item-buttons">
                            <button
                              class="order-btn"
                              ?disabled=${index === 0}
                              @click=${() => panel._moveRoom(floor.floor_id, area.area_id, -1)}
                              title="${t('admin.layout.moveUp')}"
                            >
                              <ha-icon icon="mdi:chevron-up"></ha-icon>
                            </button>
                            <button
                              class="order-btn"
                              ?disabled=${index === rooms.length - 1}
                              @click=${() => panel._moveRoom(floor.floor_id, area.area_id, 1)}
                              title="${t('admin.layout.moveDown')}"
                            >
                              <ha-icon icon="mdi:chevron-down"></ha-icon>
                            </button>
                          </div>
                        </div>
                      `)}
                    </div>
                  </sortable-list>
                </div>
              `}
            </div>
          `;
        })}

        <!-- Rooms without floor -->
        ${(() => {
          const unassignedRooms = panel._getOrderedRoomsForFloor(null);
          if (unassignedRooms.length === 0) return '';
          return html`
            <div class="order-floor-section">
              <div class="order-floor-header" style="background: var(--dv-gray600);">
                <ha-icon icon="mdi:help-circle"></ha-icon>
                <span class="order-floor-name">${t('admin.entities.unassignedRooms')}</span>
                <span style="opacity: 0.8; font-size: 13px;">${unassignedRooms.length} rooms</span>
              </div>
              <div class="order-rooms-list">
                <div class="order-list">
                  ${unassignedRooms.map((area, index) => html`
                    <div class="order-item">
                      <div class="order-item-index">${index + 1}</div>
                      <div class="order-item-icon">
                        <ha-icon icon="${panel._getAreaIcon(area)}"></ha-icon>
                      </div>
                      <div class="order-item-info">
                        <div class="order-item-name">${area.name}</div>
                        <div class="order-item-subtitle">
                          ${panel._enabledRooms[area.area_id] !== false ? 'Enabled' : 'Disabled'}
                        </div>
                      </div>
                      <div class="order-item-buttons">
                        <button
                          class="order-btn"
                          ?disabled=${index === 0}
                          @click=${() => panel._moveRoom(null, area.area_id, -1)}
                          title="Move up"
                        >
                          <ha-icon icon="mdi:chevron-up"></ha-icon>
                        </button>
                        <button
                          class="order-btn"
                          ?disabled=${index === unassignedRooms.length - 1}
                          @click=${() => panel._moveRoom(null, area.area_id, 1)}
                          title="Move down"
                        >
                          <ha-icon icon="mdi:chevron-down"></ha-icon>
                        </button>
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            </div>
          `;
        })()}
      </div>
    </div>
  `;
}

/**
 * Render appliances/devices section for a room
 * Shows devices that don't have entities with configured labels
 * Users can manually select which devices to show in room popup
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Object} area - The area object
 * @returns {TemplateResult} Appliances section HTML
 */
function renderAppliancesSection(panel, html, area) {
  // Get selectable devices for this area (excludes devices with labeled entities)
  const devices = panel._getAreaAppliances ? panel._getAreaAppliances(area.area_id) : [];

  if (devices.length === 0) return '';

  const enabledCount = devices.filter(d => d.enabled).length;

  // Build subtitle with manufacturer/model info
  const getDeviceSubtitle = (device) => {
    const parts = [];
    if (device.manufacturer) parts.push(device.manufacturer);
    if (device.model) parts.push(device.model);
    if (parts.length === 0) parts.push(`${device.entityCount} entities`);
    return parts.join(' · ');
  };

  return html`
    <div class="entity-section">
      <div class="entity-section-header">
        <div class="entity-section-title">
          <ha-icon icon="mdi:devices"></ha-icon>
          <span>Devices</span>
          <span class="entity-section-count">${enabledCount}/${devices.length}</span>
        </div>
      </div>
      <div class="entity-section-content">
        ${devices.map(device => html`
          <div class="device-config-item ${device.enabled ? 'enabled' : ''}">
            <div class="device-config-header">
              <div
                class="toggle-switch ${device.enabled ? 'on' : ''}"
                @click=${(e) => { e.stopPropagation(); panel._toggleAppliance(device.device_id); }}
              ></div>
              <div class="device-config-icon">
                <ha-icon icon="${device.icon}"></ha-icon>
              </div>
              <div class="device-config-info">
                <div class="device-config-name">${device.name}</div>
                <div class="device-config-subtitle">${getDeviceSubtitle(device)}</div>
              </div>
            </div>
            ${device.enabled ? html`
              <div class="device-config-entities">
                <div class="device-config-row">
                  <label>
                    <ha-icon icon="mdi:state-machine" style="--mdc-icon-size: 16px;"></ha-icon>
                    State Entity
                  </label>
                  <select
                    .value=${device.stateEntity || ''}
                    @change=${(e) => panel._setApplianceStateEntity(device.device_id, e.target.value || null)}
                  >
                    <option value="">-- None --</option>
                    ${device.allEntities.map(entity => html`
                      <option value="${entity.entity_id}" ?selected=${device.stateEntity === entity.entity_id}>
                        ${entity.name} (${entity.state || 'unknown'})
                      </option>
                    `)}
                  </select>
                </div>
                <div class="device-config-row">
                  <label>
                    <ha-icon icon="mdi:timer-outline" style="--mdc-icon-size: 16px;"></ha-icon>
                    Timer Entity
                  </label>
                  <select
                    .value=${device.timerEntity || ''}
                    @change=${(e) => panel._setApplianceTimerEntity(device.device_id, e.target.value || null)}
                  >
                    <option value="">-- None --</option>
                    ${device.allEntities.map(entity => html`
                      <option value="${entity.entity_id}" ?selected=${device.timerEntity === entity.entity_id}>
                        ${entity.name} (${entity.state || 'unknown'})
                      </option>
                    `)}
                  </select>
                </div>
              </div>
            ` : ''}
          </div>
        `)}
      </div>
    </div>
  `;
}

/**
 * Render an individual area/room card for the room config
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Object} area - The area object
 * @returns {TemplateResult} Area card HTML
 */
export function renderAreaCard(panel, html, area) {
  // Initialize _expandedEntityTypes if not exists
  if (!panel._expandedEntityTypes) {
    panel._expandedEntityTypes = {};
  }

  // Initialize this area's expanded types if not exists (default to empty Set = all collapsed)
  if (!panel._expandedEntityTypes[area.area_id]) {
    panel._expandedEntityTypes[area.area_id] = new Set();
  }

  // Collect all entity types for this area
  const entityGroups = {
    lights: {
      entities: panel._getAreaLights(area.area_id),
      config: ENTITY_CONFIGS.lights,
      onToggle: (id) => panel._toggleLightEnabled(id)
    },
    motionSensors: {
      entities: panel._getAreaMotionSensors(area.area_id),
      config: ENTITY_CONFIGS.motionSensors,
      onToggle: (id) => panel._toggleMotionSensorEnabled(id)
    },
    smokeSensors: {
      entities: panel._getAreaSmokeSensors(area.area_id),
      config: ENTITY_CONFIGS.smokeSensors,
      onToggle: (id) => panel._toggleSmokeSensorEnabled(id)
    },
    covers: {
      entities: panel._getAreaCovers(area.area_id),
      config: ENTITY_CONFIGS.covers,
      onToggle: (id) => panel._toggleCoverEnabled(id),
      getExtraToggle: (entity) => ({
        label: t('admin.invertPosition'),
        checked: panel._isCoverInverted(entity.entity_id),
        onChange: () => panel._toggleCoverInvertPosition(entity.entity_id)
      })
    },
    roofWindows: {
      entities: panel._getAreaRoofWindows(area.area_id),
      config: ENTITY_CONFIGS.roofWindows,
      onToggle: (id) => panel._toggleRoofWindowEnabled(id)
    },
    garages: {
      entities: panel._getAreaGarages(area.area_id),
      config: ENTITY_CONFIGS.garages,
      onToggle: (id) => panel._toggleGarageEnabled(id)
    },
    windows: {
      entities: panel._getAreaWindows(area.area_id),
      config: ENTITY_CONFIGS.windows,
      onToggle: (id) => panel._toggleWindowEnabled(id)
    },
    vibrationSensors: {
      entities: panel._getAreaVibrationSensors(area.area_id),
      config: ENTITY_CONFIGS.vibrationSensors,
      onToggle: (id) => panel._toggleVibrationSensorEnabled(id)
    },
    temperatureSensors: {
      entities: panel._getAreaTemperatureSensors(area.area_id),
      config: ENTITY_CONFIGS.temperatureSensors,
      onToggle: (id) => panel._toggleTemperatureSensorEnabled(id)
    },
    humiditySensors: {
      entities: panel._getAreaHumiditySensors(area.area_id),
      config: ENTITY_CONFIGS.humiditySensors,
      onToggle: (id) => panel._toggleHumiditySensorEnabled(id)
    },
    climates: {
      entities: panel._getAreaClimates(area.area_id),
      config: ENTITY_CONFIGS.climates,
      onToggle: (id) => panel._toggleClimateEnabled(id)
    },
    mediaPlayers: {
      entities: panel._getAreaMediaPlayers(area.area_id),
      config: ENTITY_CONFIGS.mediaPlayers,
      onToggle: (id) => panel._toggleMediaPlayerEnabled(id)
    },
    tvs: {
      entities: panel._getAreaTVs(area.area_id),
      config: ENTITY_CONFIGS.tvs,
      onToggle: (id) => panel._toggleTVEnabled(id)
    }
  };

  const isExpanded = panel._expandedAreas[area.area_id];
  const isEnabled = panel._enabledRooms[area.area_id] !== false;

  // Get search term for this room
  const searchTerm = panel._entitySearchTermsByRoom?.[area.area_id] || '';

  // Calculate counts for subtitle
  const lightsCount = entityGroups.lights.entities.length;
  const coversCount = entityGroups.covers.entities.length;
  const windowsCount = entityGroups.windows.entities.length;

  // Count non-empty entity groups for expand/collapse all
  const nonEmptyGroups = Object.entries(entityGroups).filter(([_, group]) => group.entities.length > 0);
  const allExpanded = nonEmptyGroups.length > 0 && nonEmptyGroups.every(([key]) =>
    panel._expandedEntityTypes[area.area_id].has(key)
  );

  return html`
    <div class="area-card">
      <div class="area-header" @click=${() => panel._toggleAreaExpanded(area.area_id)}>
        <div class="area-icon ${!isEnabled ? 'disabled' : ''}">
          <ha-icon icon="${panel._getAreaIcon(area)}"></ha-icon>
        </div>
        <div class="area-title">
          <div class="area-name">${area.name}</div>
          <div class="area-subtitle">
            ${lightsCount} lights · ${coversCount} covers · ${windowsCount} windows
          </div>
        </div>
        <div class="area-toggle" @click=${(e) => { e.stopPropagation(); panel._toggleRoomEnabled(area.area_id); }}>
          <div class="toggle-switch ${isEnabled ? 'on' : ''}"></div>
        </div>
        <ha-icon class="expand-icon ${isExpanded ? 'expanded' : ''}" icon="mdi:chevron-down"></ha-icon>
      </div>

      ${isExpanded ? html`
        <!-- Entity Search Input -->
        <div class="entity-search-wrapper">
          <div class="garbage-search-input-wrapper">
            <ha-icon icon="mdi:magnify" class="garbage-search-icon"></ha-icon>
            <input
              type="text"
              class="garbage-search-input"
              placeholder="Search entities..."
              .value=${searchTerm}
              @input=${(e) => {
                e.stopPropagation();
                panel._handleEntitySearch(area.area_id, e.target.value);
              }}
              @click=${(e) => e.stopPropagation()}
            />
            ${searchTerm ? html`
              <ha-icon
                icon="mdi:close"
                class="garbage-search-clear"
                @click=${(e) => {
                  e.stopPropagation();
                  panel._clearEntitySearch(area.area_id);
                }}
              ></ha-icon>
            ` : ''}
          </div>
        </div>

        ${nonEmptyGroups.length > 1 ? html`
          <div class="entity-expand-controls">
            <button
              class="entity-expand-button"
              @click=${(e) => {
                e.stopPropagation();
                if (allExpanded) {
                  // Collapse all
                  panel._expandedEntityTypes[area.area_id] = new Set();
                } else {
                  // Expand all
                  panel._expandedEntityTypes[area.area_id] = new Set(nonEmptyGroups.map(([key]) => key));
                }
                panel.requestUpdate();
              }}
            >
              <ha-icon icon="${allExpanded ? 'mdi:unfold-less-horizontal' : 'mdi:unfold-more-horizontal'}"></ha-icon>
              ${allExpanded ? 'Collapse All' : 'Expand All'}
            </button>
          </div>
        ` : ''}

        ${(() => {
          // Apply search filter to all entity groups
          const filteredGroups = Object.entries(entityGroups).map(([key, group]) => {
            if (group.entities.length === 0) return [key, { ...group, filteredEntities: [] }];

            const filteredEntities = panel._filterEntities(group.entities, searchTerm);
            return [key, { ...group, filteredEntities }];
          });

          // Check if any groups have matches
          const hasMatches = filteredGroups.some(([_, group]) => group.filteredEntities.length > 0);

          // If searching and no matches, show message
          if (searchTerm && !hasMatches) {
            return html`
              <div style="padding: 24px; text-align: center; color: var(--dv-gray600);">
                <ha-icon icon="mdi:magnify" style="font-size: 48px; opacity: 0.3; margin-bottom: 8px;"></ha-icon>
                <div>No entities match "${searchTerm}"</div>
              </div>
            `;
          }

          // Render filtered entity sections
          return filteredGroups.map(([key, group]) => {
            if (group.filteredEntities.length === 0) return '';

            const enabledCount = group.filteredEntities.filter(e => e.enabled).length;
            const activeCount = group.filteredEntities.filter(e => group.config.isActive(e)).length;
            const isTypeExpanded = panel._expandedEntityTypes[area.area_id].has(key);

            // Auto-expand sections with matches when searching
            const shouldExpand = searchTerm ? true : isTypeExpanded;

            // Map entity type keys to settings keys for bulk operations
            const settingsKeyMap = {
              lights: '_enabledLights',
              motionSensors: '_enabledMotionSensors',
              smokeSensors: '_enabledSmokeSensors',
              covers: '_enabledCovers',
              roofWindows: '_enabledRoofWindows',
              garages: '_enabledGarages',
              windows: '_enabledWindows',
              vibrationSensors: '_enabledVibrationSensors',
              temperatureSensors: '_enabledTemperatureSensors',
              humiditySensors: '_enabledHumiditySensors',
              climates: '_enabledClimates',
              mediaPlayers: '_enabledMediaPlayers',
              tvs: '_enabledTVs'
            };

            const settingsKey = settingsKeyMap[key];

            return renderEntitySection(html, {
              icon: group.config.icon,
              title: group.config.title,
              enabledCount,
              totalCount: group.filteredEntities.length,
              activeLabel: group.config.activeLabel,
              activeCount: group.config.activeLabel ? activeCount : undefined,
              entities: group.filteredEntities,
              getIcon: group.config.getIcon,
              getState: group.config.getState,
              isActive: group.config.isActive,
              onToggle: group.onToggle,
              isExpanded: shouldExpand,
              onToggleExpand: () => panel._toggleEntityTypeSection(area.area_id, key),
              typeKey: key,
              onSelectAll: settingsKey ? () => panel._bulkToggleEntities(area.area_id, settingsKey, group.filteredEntities, true) : undefined,
              onSelectNone: settingsKey ? () => panel._bulkToggleEntities(area.area_id, settingsKey, group.filteredEntities, false) : undefined,
              getExtraToggle: group.getExtraToggle
            });
          });
        })()}

        ${/* Render appliances section (filtered) */ ''}
        ${(() => {
          if (searchTerm) {
            // When searching, hide appliances section to focus on entities only
            // (appliances are device-based, not entity-based)
            return '';
          }
          return renderAppliancesSection(panel, html, area);
        })()}

        ${/* Render custom label sections (filtered) */ ''}
        ${panel._getEnabledCustomLabels().map(label => {
          const entities = panel._getAreaCustomLabelEntities(area.area_id, label.label_id);
          if (entities.length === 0) return '';

          // Filter custom label entities if searching
          const filteredCustomEntities = searchTerm ? panel._filterEntities(entities, searchTerm) : entities;
          if (filteredCustomEntities.length === 0) return '';

          return renderCustomLabelSection(html, {
            label,
            entities: filteredCustomEntities,
            panel,
            expandedEntities: panel._expandedCustomLabels,
            onToggleEntityExpanded: (entityId) => panel._toggleCustomLabelExpanded(entityId)
          });
        })}
      ` : ''}
    </div>
  `;
}

/**
 * Render the Layout tab (combines Order + Floor Cards)
 * Features: Floor/room ordering, floor card slot configuration with visual diagram
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Layout tab HTML
 */
export function renderLayoutTab(panel, html) {
  const orderedFloors = panel._getOrderedFloors();

  // Initialize floor card search state if not exists
  if (!panel._floorCardSearchState) {
    panel._floorCardSearchState = {};
  }

  // Section toggle helpers with localStorage persistence
  const { toggleSection, isExpanded } = createSectionHelpers(panel);

  const slotLabels = {
    0: { name: 'Top Left', desc: 'Small slot' },
    1: { name: 'Top Right', desc: 'Large slot (Floor Overview or Entity)' },
    2: { name: 'Bottom Right', desc: 'Large slot (Garbage Card or Entity)' },
    3: { name: 'Middle Left', desc: 'Small slot' },
    4: { name: 'Lower Left 1', desc: 'Small slot' },
    5: { name: 'Lower Left 2', desc: 'Small slot' }
  };

  // Helper to get entity display info from hass state (lightweight)
  const getEntityDisplayInfo = (entityId) => {
    if (!entityId || !panel.hass?.states[entityId]) return null;
    const state = panel.hass.states[entityId];
    const domain = entityId.split('.')[0];
    let icon = state.attributes?.icon || 'mdi:help-circle';
    if (!state.attributes?.icon) {
      if (domain === 'light') icon = 'mdi:lightbulb';
      else if (domain === 'sensor') icon = 'mdi:thermometer';
      else if (domain === 'binary_sensor') icon = 'mdi:motion-sensor';
      else if (domain === 'cover') icon = 'mdi:window-shutter';
      else if (domain === 'climate') icon = 'mdi:thermostat';
    }
    return {
      entity_id: entityId,
      name: state.attributes?.friendly_name || entityId,
      icon
    };
  };

  // Helper to render a visual card slot (simplified - no entity list lookup)
  const renderVisualSlot = (floorId, slotIndex, isBig, gridArea, isDisabled, disabledIcon, disabledText) => {
    const config = panel._floorCardConfig[floorId] || {};
    const slotConfig = config[slotIndex] || null;
    const entityId = slotConfig?.entity_id;
    const isConfigured = !!entityId;
    // For appliances, get display info from stored appliance object
    const isAppliance = slotConfig?.type === 'appliance' && slotConfig?.appliance;
    const entityInfo = isConfigured
      ? (isAppliance
        ? { name: slotConfig.appliance.name, icon: slotConfig.appliance.icon || 'mdi:devices' }
        : getEntityDisplayInfo(entityId))
      : null;
    const isSelected = panel._selectedFloorCardSlot === `${floorId}-${slotIndex}`;

    if (isDisabled) {
      return html`
        <div
          class="floor-card-slot ${isBig ? 'big' : 'small'} configured disabled"
          style="grid-area: ${gridArea};"
        >
          <ha-icon icon="${disabledIcon}" style="--mdc-icon-size: 20px; color: var(--dv-gray500);"></ha-icon>
          <div class="floor-card-slot-label">${disabledText}</div>
        </div>
      `;
    }

    return html`
      <div
        class="floor-card-slot ${isBig ? 'big' : 'small'} ${isConfigured ? 'configured' : ''} ${isSelected ? 'selected' : ''}"
        style="grid-area: ${gridArea};"
        @click=${() => {
          panel._selectedFloorCardSlot = isSelected ? null : `${floorId}-${slotIndex}`;
          if (!panel._floorCardSearchState[floorId]) {
            panel._floorCardSearchState[floorId] = {};
          }
          panel._floorCardSearchState[floorId].query = '';
          panel._floorCardSearchState[floorId].focused = false;
          panel.requestUpdate();
        }}
      >
        ${entityInfo ? html`
          <ha-icon icon="${entityInfo.icon}" style="--mdc-icon-size: 20px; color: var(--dv-gray700);"></ha-icon>
          <div class="floor-card-slot-label">${entityInfo.name}</div>
        ` : html`
          <ha-icon icon="mdi:plus" style="--mdc-icon-size: 20px; color: var(--dv-gray500);"></ha-icon>
          <div class="floor-card-slot-label">${slotLabels[slotIndex].name}</div>
        `}
      </div>
    `;
  };

  // Helper to get enabled entities for a floor (only from enabled rooms)
  const getFloorEntities = (floorId) => {
    const areasForFloor = panel._areas.filter(area =>
      area.floor_id === floorId && panel._enabledRooms[area.area_id] !== false
    );
    const entities = [];

    areasForFloor.forEach(area => {
      // Add lights (only enabled ones)
      const lights = panel._getAreaLights(area.area_id);
      lights.filter(light => light.enabled).forEach(light => {
        entities.push({ entity_id: light.entity_id, name: light.name, type: 'light', area: area.name, icon: 'mdi:lightbulb' });
      });

      // Add motion sensors (only enabled ones)
      const motionSensors = panel._getAreaMotionSensors(area.area_id);
      motionSensors.filter(sensor => sensor.enabled).forEach(sensor => {
        entities.push({ entity_id: sensor.entity_id, name: sensor.name, type: 'motion', area: area.name, icon: 'mdi:motion-sensor' });
      });

      // Add windows (only enabled ones)
      const windows = panel._getAreaWindows(area.area_id);
      windows.filter(window => window.enabled).forEach(window => {
        entities.push({ entity_id: window.entity_id, name: window.name, type: 'window', area: area.name, icon: 'mdi:window-closed' });
      });

      // Add covers (only enabled ones)
      const covers = panel._getAreaCovers(area.area_id);
      covers.filter(cover => cover.enabled).forEach(cover => {
        entities.push({ entity_id: cover.entity_id, name: cover.name, type: 'cover', area: area.name, icon: 'mdi:window-shutter' });
      });

      // Add temperature sensors (only enabled ones)
      const tempSensors = panel._getAreaTemperatureSensors(area.area_id);
      tempSensors.filter(sensor => sensor.enabled).forEach(sensor => {
        entities.push({ entity_id: sensor.entity_id, name: sensor.name, type: 'temperature', area: area.name, icon: 'mdi:thermometer' });
      });

      // Add humidity sensors (only enabled ones)
      const humiditySensors = panel._getAreaHumiditySensors(area.area_id);
      humiditySensors.filter(sensor => sensor.enabled).forEach(sensor => {
        entities.push({ entity_id: sensor.entity_id, name: sensor.name, type: 'humidity', area: area.name, icon: 'mdi:water-percent' });
      });

      // Add climates (only enabled ones)
      const climates = panel._getAreaClimates(area.area_id);
      climates.filter(climate => climate.enabled).forEach(climate => {
        entities.push({ entity_id: climate.entity_id, name: climate.name, type: 'climate', area: area.name, icon: 'mdi:thermostat' });
      });

      // Add appliances/devices (only enabled ones) - store full appliance data for device card rendering
      const appliances = panel._getEnabledAppliancesForArea ? panel._getEnabledAppliancesForArea(area.area_id) : [];
      appliances.forEach(appliance => {
        entities.push({
          entity_id: `appliance:${appliance.deviceId}`,  // Use special prefix to identify as appliance
          name: appliance.name,  // Only show device name
          type: 'appliance',
          area: area.name,
          icon: appliance.icon || 'mdi:devices',
          appliance: appliance  // Store full appliance object for rendering
        });
      });
    });

    return entities;
  };

  // Helper to render the entity picker section below the grid (simplified)
  const renderSlotEntityPicker = (floorId) => {
    const selectedSlotKey = panel._selectedFloorCardSlot;
    if (!selectedSlotKey || !selectedSlotKey.startsWith(floorId)) return '';

    const slotIndex = parseInt(selectedSlotKey.split('-')[1]);
    const config = panel._floorCardConfig[floorId] || {};
    const slotConfig = config[slotIndex] || null;
    const entityId = slotConfig?.entity_id;
    const isConfigured = !!entityId;
    // For appliances, get display info from stored appliance object; otherwise use hass state
    const isAppliance = slotConfig?.type === 'appliance' && slotConfig?.appliance;
    const entityInfo = isConfigured
      ? (isAppliance
        ? { name: slotConfig.appliance.name, icon: slotConfig.appliance.icon || 'mdi:devices' }
        : getEntityDisplayInfo(entityId))
      : null;
    const entities = getFloorEntities(floorId);

    if (!panel._floorCardSearchState[floorId]) {
      panel._floorCardSearchState[floorId] = { query: '', focused: false };
    }
    const searchState = panel._floorCardSearchState[floorId];

    return html`
      <div class="floor-card-entity-config">
        <div class="floor-card-entity-config-header">
          <span class="floor-card-entity-config-title">
            <ha-icon icon="mdi:pencil" style="--mdc-icon-size: 16px;"></ha-icon>
            Configure ${slotLabels[slotIndex].name}
          </span>
          <ha-icon
            icon="mdi:close"
            class="floor-card-entity-config-close"
            @click=${() => {
              panel._selectedFloorCardSlot = null;
              panel.requestUpdate();
            }}
          ></ha-icon>
        </div>

        <!-- Entity Search - Only shows enabled entities from enabled rooms -->
        <div class="scene-button-config-row">
          <label>Select Entity (${entities.length} available)</label>
          <div class="entity-picker">
            <div class="entity-picker-input-wrapper">
              <ha-icon icon="mdi:magnify" class="entity-picker-icon"></ha-icon>
              <input
                type="text"
                class="entity-picker-input"
                placeholder="Search enabled entities..."
                .value=${searchState.query}
                @input=${(e) => {
                  searchState.query = e.target.value;
                  panel.requestUpdate();
                }}
                @focus=${() => {
                  searchState.focused = true;
                  panel.requestUpdate();
                }}
                @blur=${() => setTimeout(() => {
                  searchState.focused = false;
                  panel.requestUpdate();
                }, 200)}
              />
              ${searchState.query ? html`
                <ha-icon
                  icon="mdi:close"
                  class="entity-picker-clear"
                  @click=${() => {
                    searchState.query = '';
                    panel.requestUpdate();
                  }}
                ></ha-icon>
              ` : ''}
            </div>

            ${searchState.focused ? html`
              <div class="entity-picker-suggestions">
                ${(() => {
                  const queryLower = (searchState.query || '').toLowerCase();
                  const filtered = entities.filter(e =>
                    e.name.toLowerCase().includes(queryLower) ||
                    e.entity_id.toLowerCase().includes(queryLower) ||
                    e.area.toLowerCase().includes(queryLower)
                  ).slice(0, 20);

                  if (filtered.length === 0) {
                    return html`<div class="entity-picker-no-results">No matching enabled entities found</div>`;
                  }

                  return filtered.map(entity => html`
                    <div
                      class="entity-picker-suggestion"
                      @mousedown=${(e) => {
                        e.preventDefault();
                        // For appliances, pass the full entity object; for others just the entity_id
                        if (entity.type === 'appliance') {
                          panel._handleFloorCardEntityChange(floorId, slotIndex, entity.entity_id, entity);
                        } else {
                          panel._handleFloorCardEntityChange(floorId, slotIndex, entity.entity_id);
                        }
                        searchState.query = '';
                        panel.requestUpdate();
                      }}
                    >
                      <ha-icon icon="${entity.icon}"></ha-icon>
                      <div class="entity-picker-suggestion-info">
                        <div class="entity-picker-suggestion-name">${entity.area}: ${entity.name}</div>
                        ${entity.type !== 'appliance' ? html`
                          <div class="entity-picker-suggestion-entity">${entity.entity_id}</div>
                        ` : ''}
                      </div>
                    </div>
                  `);
                })()}
              </div>
            ` : ''}
          </div>
        </div>

        ${isConfigured && entityInfo ? html`
          <div class="garbage-selected-sensors" style="margin-top: 8px;">
            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--dv-gray800);">${isAppliance ? 'Selected Device' : 'Selected Entity'}</label>
            <div class="garbage-sensor-list">
              <div class="garbage-sensor-item selected">
                <ha-icon icon="${entityInfo.icon}"></ha-icon>
                <div class="garbage-sensor-info">
                  <div class="garbage-sensor-name">${entityInfo.name}</div>
                  ${!isAppliance ? html`
                    <div class="garbage-sensor-entity">${entityId}</div>
                  ` : ''}
                </div>
                <ha-icon
                  icon="mdi:close"
                  class="garbage-sensor-remove"
                  @click=${() => {
                    panel._handleFloorCardEntityChange(floorId, slotIndex, '');
                    panel.requestUpdate();
                  }}
                ></ha-icon>
              </div>
            </div>
          </div>
        ` : ''}
      </div>
    `;
  };

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:view-grid-plus"></ha-icon>
      Layout Configuration
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure the display order of floors and rooms, and assign entities to floor card slots.
    </p>

    <!-- Floor Order Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('floorOrder')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:layers"></ha-icon>
          Floor Order
          <span style="margin-left: 8px; font-size: 12px; opacity: 0.7;">(${orderedFloors.length} floors)</span>
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('floorOrder') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('floorOrder') ? 'expanded' : ''}">
        ${orderedFloors.length === 0 ? renderEmptyState(html, {
          icon: 'mdi:floor-plan',
          title: 'No floors configured in Home Assistant',
          hint: 'Go to Settings → Areas & Zones → Floors to create floors'
        }) : html`
          <div class="order-list">
            ${orderedFloors.map((floor, index) => html`
              <div class="order-item">
                <div class="order-item-index">${index + 1}</div>
                <div class="order-item-icon">
                  <ha-icon icon="${getFloorIcon(floor)}"></ha-icon>
                </div>
                <div class="order-item-info">
                  <div class="order-item-name">${floor.name}</div>
                  <div class="order-item-subtitle">
                    ${panel._getAreasForFloor(floor.floor_id).length} rooms
                  </div>
                </div>
                <div class="order-item-buttons">
                  <button
                    class="order-btn"
                    ?disabled=${index === 0}
                    @click=${() => panel._moveFloor(floor.floor_id, -1)}
                    title="Move up"
                  >
                    <ha-icon icon="mdi:chevron-up"></ha-icon>
                  </button>
                  <button
                    class="order-btn"
                    ?disabled=${index === orderedFloors.length - 1}
                    @click=${() => panel._moveFloor(floor.floor_id, 1)}
                    title="Move down"
                  >
                    <ha-icon icon="mdi:chevron-down"></ha-icon>
                  </button>
                </div>
              </div>
            `)}
          </div>
        `}
      </div>
    </div>

    <!-- Room Order Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('roomOrder')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:door"></ha-icon>
          Room Order
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('roomOrder') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('roomOrder') ? 'expanded' : ''}">
        ${orderedFloors.length === 0 ? renderEmptyState(html, {
          icon: 'mdi:home-alert',
          title: 'Configure floors first to order rooms'
        }) : orderedFloors.map(floor => {
          const rooms = panel._getOrderedRoomsForFloor(floor.floor_id);
          return html`
            <div class="order-floor-section">
              <div class="order-floor-header">
                <ha-icon icon="${getFloorIcon(floor)}"></ha-icon>
                <span class="order-floor-name">${floor.name}</span>
                <span style="opacity: 0.8; font-size: 13px;">${rooms.length} rooms</span>
              </div>

              ${rooms.length === 0 ? html`
                <p style="color: var(--dv-gray600); padding: 12px 0 0 36px; font-size: 14px;">
                  No rooms assigned to this floor.
                </p>
              ` : html`
                <div class="order-rooms-list">
                  <sortable-list
                    item-key="area_id"
                    handle-selector=".sortable-handle"
                    @reorder=${(e) => panel._handleRoomReorder(floor.floor_id, e.detail)}
                  >
                    <div class="order-list">
                      ${rooms.map((area, index) => html`
                        <div class="order-item sortable-item" data-id="${area.area_id}">
                          <div class="sortable-handle" title="${t('admin.layout.dragToReorder')}">
                            <ha-icon icon="mdi:drag-horizontal"></ha-icon>
                          </div>
                          <div class="order-item-index">${index + 1}</div>
                          <div class="order-item-icon">
                            <ha-icon icon="${panel._getAreaIcon(area)}"></ha-icon>
                          </div>
                          <div class="order-item-info">
                            <div class="order-item-name">${area.name}</div>
                            <div class="order-item-subtitle">
                              ${panel._enabledRooms[area.area_id] !== false ? 'Enabled' : 'Disabled'}
                            </div>
                          </div>
                          <div class="order-item-buttons">
                            <button
                              class="order-btn"
                              ?disabled=${index === 0}
                              @click=${() => panel._moveRoom(floor.floor_id, area.area_id, -1)}
                              title="${t('admin.layout.moveUp')}"
                            >
                              <ha-icon icon="mdi:chevron-up"></ha-icon>
                            </button>
                            <button
                              class="order-btn"
                              ?disabled=${index === rooms.length - 1}
                              @click=${() => panel._moveRoom(floor.floor_id, area.area_id, 1)}
                              title="${t('admin.layout.moveDown')}"
                            >
                              <ha-icon icon="mdi:chevron-down"></ha-icon>
                            </button>
                          </div>
                        </div>
                      `)}
                    </div>
                  </sortable-list>
                </div>
              `}
            </div>
          `;
        })}
      </div>
    </div>

    <!-- Floor Cards Configuration Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('floorCards')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:view-grid"></ha-icon>
          Floor Card Slots
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('floorCards') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('floorCards') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Configure which entities appear on each floor's card grid. Click a slot to select an entity.
        </p>

        ${orderedFloors.map(floor => html`
          <div class="floor-cards-config-section">
            <div class="floor-cards-config-title">
              <ha-icon icon="${floor.icon || 'mdi:home-floor-0'}"></ha-icon>
              ${floor.name}
            </div>

            <!-- Floor Overview Toggle -->
            <div class="floor-overview-toggle">
              <div class="floor-overview-toggle-label">
                <ha-icon icon="mdi:view-carousel"></ha-icon>
                <div class="floor-overview-toggle-text">
                  <span class="floor-overview-toggle-title">Floor Overview (Top Right)</span>
                  <span class="floor-overview-toggle-subtitle">Swipeable card showing all rooms on this floor</span>
                </div>
              </div>
              <div
                class="toggle-switch ${panel._floorOverviewEnabled[floor.floor_id] ? 'on' : ''}"
                @click=${() => panel._toggleFloorOverview(floor.floor_id)}
              ></div>
            </div>

            <!-- Visual Grid -->
            <div class="floor-cards-config-grid">
              ${renderVisualSlot(floor.floor_id, 0, false, 'small1', false)}
              ${renderVisualSlot(
                floor.floor_id, 1, true, 'big1',
                panel._floorOverviewEnabled[floor.floor_id],
                'mdi:view-carousel', 'Floor Overview'
              )}
              ${renderVisualSlot(
                floor.floor_id, 2, true, 'big2',
                panel._garbageDisplayFloor === floor.floor_id && panel._garbageSensors.length > 0,
                'mdi:trash-can', 'Garbage Card'
              )}
              ${renderVisualSlot(floor.floor_id, 3, false, 'small2', false)}
              ${renderVisualSlot(floor.floor_id, 4, false, 'small3', false)}
              ${renderVisualSlot(floor.floor_id, 5, false, 'small4', false)}
            </div>

            <!-- Entity Picker (shown when a slot is selected) -->
            ${renderSlotEntityPicker(floor.floor_id)}
          </div>
        `)}
      </div>
    </div>
  `;
}
