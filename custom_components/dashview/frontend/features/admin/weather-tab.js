/**
 * Dashview Admin - Weather Tab
 * Weather entity selection and DWD warning configuration
 */

import { renderEntityPicker } from '../../components/controls/index.js';
import { t, createSectionHelpers } from './shared.js';
import { renderEmptyState } from '../../components/layout/empty-state.js';

/**
 * Render the Weather tab
 * Features: Weather entity selection, DWD warning configuration
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Weather tab HTML
 */
export function renderWeatherTab(panel, html) {
  // Section toggle helpers with localStorage persistence
  const { toggleSection, isExpanded } = createSectionHelpers(panel);

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>
      Weather Configuration
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure weather display and climate notification thresholds.
    </p>

    <!-- Weather Entity Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('weatherEntity')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:weather-cloudy"></ha-icon>
          Weather Entity
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('weatherEntity') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('weatherEntity') ? 'expanded' : ''}">
        ${panel._availableWeatherEntities.length === 0 && panel._weatherEntitiesLoaded
          ? renderEmptyState(html, {
              icon: 'mdi:weather-cloudy-alert',
              title: t('admin.weather.noWeatherEntities') || 'No Weather Entities Found',
              description: 'Install a weather integration in Home Assistant to display forecasts',
              hint: 'Supported integrations: OpenWeatherMap, Met.no, AccuWeather, etc.'
            })
          : html`
            <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
              Select the weather entity for the header and weather popup. All forecast data will be fetched from this entity.
            </p>

            <div style="margin-bottom: 8px;">
              <div class="card-config-label">
                <span class="card-config-label-title">${t('admin.weather.weatherEntity')}</span>
                <span class="card-config-label-subtitle">Select your weather integration</span>
              </div>
            </div>
            <div>
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
                style="width: 100%; padding: 10px 12px; border-radius: var(--dv-radius-sm); border: 1px solid var(--dv-gray300); background: var(--dv-gray000); color: var(--dv-gray800); font-size: 14px;"
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
          `}
      </div>
    </div>

    <!-- DWD Warning Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('dwdWarning')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:alert"></ha-icon>
          DWD Weather Warnings
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('dwdWarning') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('dwdWarning') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          German weather warnings from Deutscher Wetterdienst (DWD).
        </p>

        <div style="margin-bottom: 8px;">
          <div class="card-config-label">
            <span class="card-config-label-title">DWD Warning Entity</span>
            <span class="card-config-label-subtitle">sensor.xxx_current_warning_level</span>
          </div>
        </div>
        <div>
          ${renderEntityPicker(html, {
              hass: panel.hass,
              value: '',
              searchQuery: panel._dwdWarningSearchQuery || '',
              focused: panel._dwdWarningSearchFocused || false,
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

    <!-- Weather Radar Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('weatherRadar')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:radar"></ha-icon>
          Weather Radar (Windy)
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('weatherRadar') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('weatherRadar') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Configure the weather radar map displayed in the weather popup. Uses Windy.com embed.
        </p>

        <!-- Location -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
          <div>
            <div class="card-config-label" style="margin-bottom: 8px;">
              <span class="card-config-label-title">Latitude</span>
              <span class="card-config-label-subtitle">e.g., 50.0 for Frankfurt</span>
            </div>
            <input
              type="number"
              step="0.001"
              .value=${panel._weatherRadarLat}
              @change=${(e) => {
                panel._weatherRadarLat = parseFloat(e.target.value) || 50.0;
                panel._saveSettings();
                panel.requestUpdate();
              }}
              style="width: 100%; padding: 10px 12px; border-radius: var(--dv-radius-sm); border: 1px solid var(--dv-gray300); background: var(--dv-gray000); color: var(--dv-gray800); font-size: 14px;"
            />
          </div>
          <div>
            <div class="card-config-label" style="margin-bottom: 8px;">
              <span class="card-config-label-title">Longitude</span>
              <span class="card-config-label-subtitle">e.g., 8.7 for Frankfurt</span>
            </div>
            <input
              type="number"
              step="0.001"
              .value=${panel._weatherRadarLon}
              @change=${(e) => {
                panel._weatherRadarLon = parseFloat(e.target.value) || 8.7;
                panel._saveSettings();
                panel.requestUpdate();
              }}
              style="width: 100%; padding: 10px 12px; border-radius: var(--dv-radius-sm); border: 1px solid var(--dv-gray300); background: var(--dv-gray000); color: var(--dv-gray800); font-size: 14px;"
            />
          </div>
        </div>

        <!-- Zoom Level -->
        <div style="margin-bottom: 16px;">
          <div class="card-config-label" style="margin-bottom: 8px;">
            <span class="card-config-label-title">Zoom Level</span>
            <span class="card-config-label-subtitle">3 (continent) to 11 (city)</span>
          </div>
          <div style="display: flex; align-items: center; gap: 12px;">
            <input
              type="range"
              min="3"
              max="11"
              .value=${panel._weatherRadarZoom}
              @input=${(e) => {
                panel._weatherRadarZoom = parseInt(e.target.value);
                panel.requestUpdate();
              }}
              @change=${(e) => {
                panel._weatherRadarZoom = parseInt(e.target.value);
                panel._saveSettings();
                panel.requestUpdate();
              }}
              style="flex: 1;"
            />
            <span style="min-width: 30px; text-align: center; font-weight: 500; color: var(--dv-gray800);">${panel._weatherRadarZoom}</span>
          </div>
        </div>

        <!-- Units -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
          <div>
            <div class="card-config-label" style="margin-bottom: 8px;">
              <span class="card-config-label-title">Temperature Unit</span>
            </div>
            <select
              .value=${panel._weatherRadarTempUnit}
              @change=${(e) => {
                panel._weatherRadarTempUnit = e.target.value;
                panel._saveSettings();
                panel.requestUpdate();
              }}
              style="width: 100%; padding: 10px 12px; border-radius: var(--dv-radius-sm); border: 1px solid var(--dv-gray300); background: var(--dv-gray000); color: var(--dv-gray800); font-size: 14px;"
            >
              <option value="°C" ?selected=${panel._weatherRadarTempUnit === "°C"}>Celsius (°C)</option>
              <option value="°F" ?selected=${panel._weatherRadarTempUnit === "°F"}>Fahrenheit (°F)</option>
            </select>
          </div>
          <div>
            <div class="card-config-label" style="margin-bottom: 8px;">
              <span class="card-config-label-title">Wind Unit</span>
            </div>
            <select
              .value=${panel._weatherRadarWindUnit}
              @change=${(e) => {
                panel._weatherRadarWindUnit = e.target.value;
                panel._saveSettings();
                panel.requestUpdate();
              }}
              style="width: 100%; padding: 10px 12px; border-radius: var(--dv-radius-sm); border: 1px solid var(--dv-gray300); background: var(--dv-gray000); color: var(--dv-gray800); font-size: 14px;"
            >
              <option value="km/h" ?selected=${panel._weatherRadarWindUnit === "km/h"}>km/h</option>
              <option value="m/s" ?selected=${panel._weatherRadarWindUnit === "m/s"}>m/s</option>
              <option value="mph" ?selected=${panel._weatherRadarWindUnit === "mph"}>mph</option>
              <option value="kt" ?selected=${panel._weatherRadarWindUnit === "kt"}>Knots</option>
              <option value="bft" ?selected=${panel._weatherRadarWindUnit === "bft"}>Beaufort</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  `;
}
