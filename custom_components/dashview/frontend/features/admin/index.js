/**
 * Dashview Panel Admin Render Methods
 * Extracted admin/configuration render methods for the dashview panel
 *
 * These functions are designed to be called with the panel instance (this) bound
 * and the html template literal function passed as parameter.
 */

import {
  getFloorIcon,
  formatLastChanged,
  getFriendlyName,
  sortByName,
  getEnabledEntitiesSortedByLastChanged,
  isStateOn,
  isStateOpen
} from '../../utils/index.js';
import { renderEntitySection, renderCustomLabelSection } from '../../components/cards/entity-item.js';
import { ENTITY_CONFIGS } from '../../constants/index.js';
import { renderEntityPicker } from '../../components/controls/entity-picker.js';

/**
 * Category definitions for label mapping
 * Each category has an icon, title, description and the property name used in the panel
 */
const LABEL_CATEGORIES = [
  { key: 'light', icon: 'mdi:lightbulb-group', title: 'Lights', description: 'Light entities to control', prop: '_lightLabelId' },
  { key: 'cover', icon: 'mdi:window-shutter', title: 'Covers / Blinds', description: 'Cover and blind entities', prop: '_coverLabelId' },
  { key: 'roofWindow', icon: 'mdi:window-open', title: 'Roof Windows', description: 'Roof window entities', prop: '_roofWindowLabelId' },
  { key: 'window', icon: 'mdi:window-closed-variant', title: 'Windows', description: 'Window sensor entities', prop: '_windowLabelId' },
  { key: 'garage', icon: 'mdi:garage', title: 'Garage Doors', description: 'Garage door entities', prop: '_garageLabelId' },
  { key: 'motion', icon: 'mdi:motion-sensor', title: 'Motion Sensors', description: 'Motion detection sensors', prop: '_motionLabelId' },
  { key: 'smoke', icon: 'mdi:smoke-detector', title: 'Smoke Detectors', description: 'Smoke and fire detectors', prop: '_smokeLabelId' },
  { key: 'vibration', icon: 'mdi:vibrate', title: 'Vibration Sensors', description: 'Vibration detection sensors', prop: '_vibrationLabelId' },
  { key: 'temperature', icon: 'mdi:thermometer', title: 'Temperature Sensors', description: 'Temperature measurement sensors', prop: '_temperatureLabelId' },
  { key: 'humidity', icon: 'mdi:water-percent', title: 'Humidity Sensors', description: 'Humidity measurement sensors', prop: '_humidityLabelId' },
  { key: 'climate', icon: 'mdi:thermostat', title: 'Thermostats / Climate', description: 'Climate control entities', prop: '_climateLabelId' },
  { key: 'mediaPlayer', icon: 'mdi:speaker', title: 'Media Players', description: 'Media player entities', prop: '_mediaPlayerLabelId' },
  { key: 'tv', icon: 'mdi:television', title: 'TVs / Fernseher', description: 'TV and display entities', prop: '_tvLabelId' },
  { key: 'lock', icon: 'mdi:lock', title: 'Locks / Schlösser', description: 'Lock entities for doors and gates', prop: '_lockLabelId' },
];

/**
 * Render label mapping configuration section
 * Allows users to map their HA labels to DashView categories
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Label mapping config HTML
 */
export function renderLabelMappingConfig(panel, html) {
  // Get all available labels from HA
  const availableLabels = panel._labels || [];

  // Helper to get the current label name for a category
  const getLabelName = (labelId) => {
    if (!labelId) return null;
    const label = availableLabels.find(l => l.label_id === labelId);
    return label ? label.name : labelId;
  };

  // Helper to render a category mapping row
  const renderCategoryRow = (category) => {
    const currentLabelId = panel[category.prop];
    const currentLabel = currentLabelId ? availableLabels.find(l => l.label_id === currentLabelId) : null;

    return html`
      <div class="label-mapping-row">
        <div class="label-mapping-category">
          <div class="label-mapping-icon">
            <ha-icon icon="${category.icon}"></ha-icon>
          </div>
          <div class="label-mapping-info">
            <span class="label-mapping-title">${category.title}</span>
            <span class="label-mapping-description">${category.description}</span>
          </div>
        </div>
        <div class="label-mapping-selector">
          <select
            .value=${currentLabelId || ''}
            style="border: 2px solid ${currentLabelId ? 'var(--dv-green)' : 'var(--dv-red)'}; border-radius: var(--dv-radius-sm);"
            @change=${(e) => {
              // Prevent changes during initial render/load
              if (!panel._settingsLoaded) return;
              const newLabelId = e.target.value || null;
              // Only update if the value actually changed
              if (newLabelId === currentLabelId || (newLabelId === null && currentLabelId === null)) return;
              panel._setCategoryLabel(category.key, newLabelId);
            }}
          >
            <option value="">-- Select Label --</option>
            ${availableLabels.map(label => html`
              <option value="${label.label_id}" ?selected=${currentLabelId === label.label_id}>
                ${label.name}
              </option>
            `)}
          </select>
        </div>
      </div>
    `;
  };

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:tag-multiple"></ha-icon>
      Label Configuration
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Map your Home Assistant labels to DashView categories. Entities with these labels will appear in the corresponding sections throughout the dashboard.
    </p>

    ${availableLabels.length === 0 ? html`
      <div class="label-mapping-empty-state">
        <ha-icon icon="mdi:tag-off-outline"></ha-icon>
        <h3>No Labels Found</h3>
        <p>Create labels in Home Assistant first:</p>
        <p style="font-size: 13px; opacity: 0.8;">Settings → Labels → Create Label</p>
        <p style="font-size: 13px; margin-top: 12px;">Then assign labels to your entities and come back here to configure the mapping.</p>
      </div>
    ` : html`
      <div class="label-mapping-list">
        ${LABEL_CATEGORIES.map(category => renderCategoryRow(category))}
      </div>

      <div class="label-mapping-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <p>After configuring labels, go to the <strong>Rooms</strong> tab to enable specific entities for each room.</p>
      </div>
    `}
  `;
}

/**
 * Render the admin tab container with sub-tabs
 * New 5-tab structure: Entities | Layout | Weather | Status | Scenes
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Admin tab HTML
 */
export function renderAdminTab(panel, html) {
  // Migrate old tab names to new ones
  if (panel._adminSubTab === 'rooms') panel._adminSubTab = 'entities';
  if (panel._adminSubTab === 'labels') panel._adminSubTab = 'entities';
  if (panel._adminSubTab === 'order' || panel._adminSubTab === 'floorcards') panel._adminSubTab = 'layout';
  if (panel._adminSubTab === 'cards') panel._adminSubTab = 'status';

  return html`
    <div class="container">
      <!-- Admin Sub-Tabs (5 tabs) -->
      <div class="admin-sub-tabs">
        <button
          class="admin-sub-tab ${panel._adminSubTab === 'entities' ? 'active' : ''}"
          @click=${() => panel._adminSubTab = 'entities'}
        >
          <ha-icon icon="mdi:home-group"></ha-icon>
          Entities
        </button>
        <button
          class="admin-sub-tab ${panel._adminSubTab === 'layout' ? 'active' : ''}"
          @click=${() => panel._adminSubTab = 'layout'}
        >
          <ha-icon icon="mdi:view-grid-plus"></ha-icon>
          Layout
        </button>
        <button
          class="admin-sub-tab ${panel._adminSubTab === 'weather' ? 'active' : ''}"
          @click=${() => panel._adminSubTab = 'weather'}
        >
          <ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>
          Weather
        </button>
        <button
          class="admin-sub-tab ${panel._adminSubTab === 'status' ? 'active' : ''}"
          @click=${() => panel._adminSubTab = 'status'}
        >
          <ha-icon icon="mdi:information-outline"></ha-icon>
          Status
        </button>
        <button
          class="admin-sub-tab ${panel._adminSubTab === 'scenes' ? 'active' : ''}"
          @click=${() => panel._adminSubTab = 'scenes'}
        >
          <ha-icon icon="mdi:play-box-multiple"></ha-icon>
          Scenes
        </button>
        <button
          class="admin-sub-tab ${panel._adminSubTab === 'users' ? 'active' : ''}"
          @click=${() => panel._adminSubTab = 'users'}
        >
          <ha-icon icon="mdi:account-group"></ha-icon>
          Users
        </button>
      </div>

      ${panel._adminSubTab === 'entities'
        ? renderEntitiesTab(panel, html)
        : panel._adminSubTab === 'layout'
          ? renderLayoutTab(panel, html)
          : panel._adminSubTab === 'weather'
            ? renderWeatherTab(panel, html)
            : panel._adminSubTab === 'status'
              ? renderStatusTab(panel, html)
              : panel._adminSubTab === 'users'
                ? renderUsersTab(panel, html)
                : renderScenesTab(panel, html)}
    </div>
  `;
}

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
      Room Configuration
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Enable rooms, lights, motion sensors, and smoke detectors to show them on the Home dashboard. Click on a room to expand and configure individual devices.
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
      : html`
          <div class="no-areas">
            <ha-icon icon="mdi:home-alert" style="--mdc-icon-size: 64px; margin-bottom: 16px;"></ha-icon>
            <p>No areas configured in Home Assistant.</p>
            <p>Go to Settings → Areas & Zones to create areas.</p>
          </div>
        `}
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

  const toggleSection = (sectionId) => {
    panel._expandedCardSections = {
      ...panel._expandedCardSections,
      [sectionId]: !panel._expandedCardSections[sectionId]
    };
    panel.requestUpdate();
  };

  const isExpanded = (sectionId) => panel._expandedCardSections[sectionId] || false;

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
            <span class="card-config-label-title">Weather Entity</span>
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
        ` : html`
          <div class="garbage-empty-state">
            <ha-icon icon="mdi:trash-can-outline"></ha-icon>
            <div>No sensors added yet</div>
            <div class="garbage-empty-hint">Use the search above to find and add garbage pickup sensors</div>
          </div>
        `}

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
        ${renderInfoTextToggle(panel, html, 'motion', 'Bewegung', 'mdi:motion-sensor',
          'Zeigt die letzte erkannte Bewegung an')}

        <!-- Garage Status -->
        ${renderInfoTextToggle(panel, html, 'garage', 'Garagentore', 'mdi:garage',
          'Zeigt offene Garagentore an')}

        <!-- Windows Status -->
        ${renderInfoTextToggle(panel, html, 'windows', 'Fenster', 'mdi:window-open',
          'Zeigt offene Fenster an (aus aktivierten Fenstern)')}

        <!-- Lights Status -->
        ${renderInfoTextToggle(panel, html, 'lights', 'Lichter', 'mdi:lightbulb',
          'Zeigt Anzahl der eingeschalteten Lichter an')}

        <!-- Covers Status -->
        ${renderInfoTextToggle(panel, html, 'covers', 'Rollos', 'mdi:window-shutter',
          'Zeigt offene Rollos an')}

        <!-- TVs Status -->
        ${renderInfoTextToggle(panel, html, 'tvs', 'Fernseher', 'mdi:television',
          'Zeigt eingeschaltete Fernseher an')}

        <!-- Washer Status -->
        ${renderInfoTextEntityConfig(panel, html, 'washer', 'Waschmaschine', 'mdi:washing-machine',
          'Zeigt Status der Waschmaschine an', true)}

        <!-- Dishwasher Status -->
        ${renderInfoTextEntityConfig(panel, html, 'dishwasher', 'Geschirrspüler', 'mdi:dishwasher',
          'Zeigt Status des Geschirrspülers an', true)}

        <!-- Dryer Status -->
        ${renderInfoTextEntityConfig(panel, html, 'dryer', 'Trockner', 'mdi:tumble-dryer',
          'Zeigt Status des Trockners an', true)}

        <!-- Vacuum Status -->
        ${renderInfoTextEntityConfig(panel, html, 'vacuum', 'Staubsauger', 'mdi:robot-vacuum',
          'Zeigt Status des Staubsauger-Roboters an', false)}

        <!-- Battery Low Status -->
        ${renderInfoTextBatteryConfig(panel, html)}
      </div>
    </div>

    <!-- Scene Buttons Configuration Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('sceneButtons')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:play-box-multiple"></ha-icon>
          Scene Buttons
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
 * Render a simple toggle for info text items (no entity config needed)
 */
function renderInfoTextToggle(panel, html, key, label, icon, description) {
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
function renderInfoTextBatteryConfig(panel, html) {
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
 * Render the Appliances Status section for the Status tab
 * Shows each enabled appliance as a separate toggle
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Function} toggleSection - Function to toggle section expansion
 * @param {Function} isExpanded - Function to check if section is expanded
 * @returns {TemplateResult} Appliances status section HTML
 */
function renderAppliancesStatusSection(panel, html, toggleSection, isExpanded) {
  // Get all enabled appliances from all areas
  const getAllEnabledAppliances = () => {
    const appliances = [];
    if (!panel._areas || !panel._enabledAppliances) return appliances;

    panel._areas.forEach(area => {
      const areaAppliances = panel._getAreaAppliances ? panel._getAreaAppliances(area.area_id) : [];
      areaAppliances.forEach(appliance => {
        if (appliance.enabled) {
          appliances.push({
            ...appliance,
            areaName: area.name,
            areaId: area.area_id
          });
        }
      });
    });
    return appliances;
  };

  const enabledAppliances = getAllEnabledAppliances();

  if (enabledAppliances.length === 0) return '';

  // Toggle individual appliance's showInHomeStatus
  const toggleApplianceHomeStatus = (deviceId) => {
    const current = panel._enabledAppliances[deviceId] || { enabled: true };
    panel._enabledAppliances = {
      ...panel._enabledAppliances,
      [deviceId]: { ...current, showInHomeStatus: !current.showInHomeStatus }
    };
    panel._saveSettings();
    panel.requestUpdate();
  };

  return html`
    ${enabledAppliances.map(appliance => {
      const config = panel._enabledAppliances[appliance.device_id] || {};
      const isEnabled = config.showInHomeStatus || false;
      return html`
        <div class="info-text-config-item">
          <div class="info-text-config-row">
            <div class="info-text-config-icon">
              <ha-icon icon="${appliance.icon}"></ha-icon>
            </div>
            <div class="info-text-config-label">
              <span class="info-text-config-title">${appliance.name}</span>
              <span class="info-text-config-subtitle">${appliance.areaName}</span>
            </div>
            <div
              class="toggle-switch ${isEnabled ? 'on' : ''}"
              @click=${() => toggleApplianceHomeStatus(appliance.device_id)}
            ></div>
          </div>
        </div>
      `;
    })}
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
      iconFocused: false
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
    panel._sceneButtons = panel._sceneButtons.filter((_, i) => i !== index);
    // Clean up search state
    delete panel._sceneButtonSearchState[index];
    panel._saveSettings();
    panel.requestUpdate();
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
                placeholder="Search icons (e.g. lightbulb, home)..."
                .value=${searchState.iconFocused ? searchState.iconQuery : (button.icon || '')}
                @input=${(e) => {
                  searchState.iconQuery = e.target.value;
                  panel.requestUpdate();
                }}
                @focus=${() => {
                  searchState.iconFocused = true;
                  searchState.iconQuery = button.icon || '';
                  panel.requestUpdate();
                }}
                @blur=${() => setTimeout(() => {
                  searchState.iconFocused = false;
                  panel.requestUpdate();
                }, 200)}
              />
              ${button.icon ? html`
                <ha-icon
                  icon="mdi:close"
                  class="entity-picker-clear"
                  @click=${() => {
                    updateButton('icon', '');
                    searchState.iconQuery = '';
                  }}
                ></ha-icon>
              ` : ''}
            </div>
            ${searchState.iconFocused ? html`
              <div class="entity-picker-suggestions">
                ${getFilteredIcons().length === 0 ? html`
                  <div class="entity-picker-no-results">No matching icons found</div>
                ` : getFilteredIcons().map(icon => html`
                  <div
                    class="entity-picker-suggestion ${button.icon === icon ? 'selected' : ''}"
                    @mousedown=${(e) => {
                      e.preventDefault();
                      updateButton('icon', icon);
                      searchState.iconQuery = '';
                      searchState.iconFocused = false;
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

  const toggleSection = (sectionId) => {
    panel._expandedCardSections = {
      ...panel._expandedCardSections,
      [sectionId]: !panel._expandedCardSections[sectionId]
    };
    panel.requestUpdate();
  };

  const isExpanded = (sectionId) => panel._expandedCardSections[sectionId] || false;

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:sort"></ha-icon>
      Floor & Room Order
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Set the display order of floors and rooms. Use the arrow buttons to reorder items.
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
        ${sortedFloors.length === 0 ? html`
          <div class="order-empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <p>No floors configured in Home Assistant.</p>
            <p style="font-size: 12px; margin-top: 8px;">Go to Settings → Areas & Zones → Floors to create floors.</p>
          </div>
        ` : html`
          <div class="order-list">
            ${sortedFloors.map((floor, index) => html`
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
                    ?disabled=${index === sortedFloors.length - 1}
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
        ${sortedFloors.length === 0 ? html`
          <div class="order-empty-state">
            <ha-icon icon="mdi:home-alert"></ha-icon>
            <p>Configure floors first to order rooms.</p>
          </div>
        ` : sortedFloors.map(floor => {
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
                  <div class="order-list">
                    ${rooms.map((area, index) => html`
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
                            @click=${() => panel._moveRoom(floor.floor_id, area.area_id, -1)}
                            title="Move up"
                          >
                            <ha-icon icon="mdi:chevron-up"></ha-icon>
                          </button>
                          <button
                            class="order-btn"
                            ?disabled=${index === rooms.length - 1}
                            @click=${() => panel._moveRoom(floor.floor_id, area.area_id, 1)}
                            title="Move down"
                          >
                            <ha-icon icon="mdi:chevron-down"></ha-icon>
                          </button>
                        </div>
                      </div>
                    `)}
                  </div>
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
                <span class="order-floor-name">Unassigned Rooms</span>
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
 * Render security popup content
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Security popup HTML
 */
export function renderSecurityPopupContent(panel, html) {
  if (!panel.hass) return html``;

  // Helper to filter enabled entities by current label
  // Iterates over entity registry (not enabledMap) to support default-enabled behavior
  const filterByCurrentLabel = (enabledMap, labelId) => {
    if (!labelId) return {};
    const filtered = {};
    panel._entityRegistry.forEach((entityReg) => {
      const entityId = entityReg.entity_id;
      // Skip explicitly disabled entities (enabled by default)
      if (enabledMap[entityId] === false) return;
      // Check if entity has the required label
      if (entityReg.labels && entityReg.labels.includes(labelId)) {
        filtered[entityId] = true;
      }
    });
    return filtered;
  };

  // Get enabled windows - sorted by last changed, filtered by current label
  const enabledWindows = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(panel._enabledWindows, panel._windowLabelId),
    panel.hass,
    (state) => ({ isOpen: isStateOn(state) })
  );

  // Get enabled motion sensors - sorted by last changed, filtered by current label
  const enabledMotion = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(panel._enabledMotionSensors, panel._motionLabelId),
    panel.hass,
    (state) => ({ isActive: isStateOn(state) })
  );

  // Get enabled garages - sorted by last changed, filtered by current label
  const enabledGarages = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(panel._enabledGarages, panel._garageLabelId),
    panel.hass,
    (state) => ({ isOpen: isStateOpen(state) })
  );

  // Count active entities
  const openWindowsCount = enabledWindows.filter(w => w.isOpen).length;
  const activeMotionCount = enabledMotion.filter(m => m.isActive).length;
  const openGaragesCount = enabledGarages.filter(g => g.isOpen).length;

  // Render entity card
  const renderEntityCard = (entity, type) => {
    const isActive = type === 'window' ? entity.isOpen : (type === 'garage' ? entity.isOpen : entity.isActive);
    let icon;
    if (type === 'window') {
      icon = entity.isOpen ? 'mdi:window-open' : 'mdi:window-closed';
    } else if (type === 'garage') {
      icon = entity.isOpen ? 'mdi:garage-open' : 'mdi:garage';
    } else {
      icon = entity.isActive ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
    }

    return html`
      <div
        class="security-entity-card ${isActive ? 'active' : 'inactive'}"
        @click=${() => panel._showMoreInfo(entity.entityId)}
      >
        <div class="security-entity-icon">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="security-entity-name">${getFriendlyName(entity.state)}</div>
        <div class="security-entity-last-changed">${formatLastChanged(entity.state.last_changed)}</div>
      </div>
    `;
  };

  return html`
    <!-- Security Tabs -->
    <div class="security-tabs">
      <button
        class="security-tab ${panel._activeSecurityTab === 'windows' ? 'active' : ''}"
        @click=${() => panel._activeSecurityTab = 'windows'}
      >
        <ha-icon icon="mdi:window-open"></ha-icon>
        <span>${openWindowsCount} von ${enabledWindows.length}</span>
      </button>
      <button
        class="security-tab ${panel._activeSecurityTab === 'garage' ? 'active' : ''}"
        @click=${() => panel._activeSecurityTab = 'garage'}
      >
        <ha-icon icon="mdi:garage"></ha-icon>
        <span>${openGaragesCount} von ${enabledGarages.length}</span>
      </button>
      <button
        class="security-tab ${panel._activeSecurityTab === 'motion' ? 'active' : ''}"
        @click=${() => panel._activeSecurityTab = 'motion'}
      >
        <ha-icon icon="mdi:motion-sensor"></ha-icon>
        <span>${activeMotionCount} von ${enabledMotion.length}</span>
      </button>
    </div>

    <!-- Windows Content -->
    ${panel._activeSecurityTab === 'windows' ? html`
      ${enabledWindows.length === 0 ? html`
        <div class="security-empty-state">
          Keine Fenster in der Admin-Konfiguration aktiviert.
        </div>
      ` : html`
        <!-- Open Windows -->
        ${enabledWindows.filter(w => w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">Offene Fenster</h3>
          <div class="security-entity-list">
            ${enabledWindows.filter(w => w.isOpen).map(w => renderEntityCard(w, 'window'))}
          </div>
        ` : ''}

        <!-- Closed Windows -->
        ${enabledWindows.filter(w => !w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">Geschlossene Fenster</h3>
          <div class="security-entity-list">
            ${enabledWindows.filter(w => !w.isOpen).map(w => renderEntityCard(w, 'window'))}
          </div>
        ` : ''}
      `}
    ` : ''}

    <!-- Garage Content -->
    ${panel._activeSecurityTab === 'garage' ? html`
      ${enabledGarages.length === 0 ? html`
        <div class="security-empty-state">
          Keine Garagentore in der Admin-Konfiguration aktiviert.
        </div>
      ` : html`
        <!-- Open Garages -->
        ${enabledGarages.filter(g => g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">Offene Garagentore</h3>
          <div class="security-entity-list">
            ${enabledGarages.filter(g => g.isOpen).map(g => renderEntityCard(g, 'garage'))}
          </div>
        ` : ''}

        <!-- Closed Garages -->
        ${enabledGarages.filter(g => !g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">Geschlossene Garagentore</h3>
          <div class="security-entity-list">
            ${enabledGarages.filter(g => !g.isOpen).map(g => renderEntityCard(g, 'garage'))}
          </div>
        ` : ''}
      `}
    ` : ''}

    <!-- Motion Content -->
    ${panel._activeSecurityTab === 'motion' ? html`
      ${enabledMotion.length === 0 ? html`
        <div class="security-empty-state">
          Keine Bewegungsmelder in der Admin-Konfiguration aktiviert.
        </div>
      ` : html`
        <!-- Active Motion -->
        ${enabledMotion.filter(m => m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">Bewegung erkannt</h3>
          <div class="security-entity-list">
            ${enabledMotion.filter(m => m.isActive).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}

        <!-- Inactive Motion -->
        ${enabledMotion.filter(m => !m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">Keine Bewegung</h3>
          <div class="security-entity-list">
            ${enabledMotion.filter(m => !m.isActive).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}
      `}
    ` : ''}
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
      onToggle: (id) => panel._toggleCoverEnabled(id)
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

  // Calculate counts for subtitle
  const lightsCount = entityGroups.lights.entities.length;
  const coversCount = entityGroups.covers.entities.length;
  const windowsCount = entityGroups.windows.entities.length;

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
        ${Object.entries(entityGroups).map(([key, group]) => {
          if (group.entities.length === 0) return '';

          const enabledCount = group.entities.filter(e => e.enabled).length;
          const activeCount = group.entities.filter(e => group.config.isActive(e)).length;

          return renderEntitySection(html, {
            icon: group.config.icon,
            title: group.config.title,
            enabledCount,
            totalCount: group.entities.length,
            activeLabel: group.config.activeLabel,
            activeCount: group.config.activeLabel ? activeCount : undefined,
            entities: group.entities,
            getIcon: group.config.getIcon,
            getState: group.config.getState,
            isActive: group.config.isActive,
            onToggle: group.onToggle
          });
        })}

        ${/* Render appliances section */ ''}
        ${renderAppliancesSection(panel, html, area)}

        ${/* Render custom label sections */ ''}
        ${panel._getEnabledCustomLabels().map(label => {
          const entities = panel._getAreaCustomLabelEntities(area.area_id, label.label_id);
          if (entities.length === 0) return '';

          return renderCustomLabelSection(html, {
            label,
            entities,
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

  // Get friendly name for an entity
  const getEntityName = (entityId) => {
    if (!entityId) return '';
    const state = panel.hass?.states[entityId];
    return state?.attributes?.friendly_name || entityId;
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

// ============================================================================
// NEW TAB FUNCTIONS (6-Tab Refactor)
// ============================================================================

/**
 * Render the Entities tab (formerly Rooms tab with enhancements)
 * Features: Global search, filter chips, room cards with entity toggles
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Entities tab HTML
 */
export function renderEntitiesTab(panel, html) {
  // Initialize search state if not exists
  if (!panel._entitySearchQuery) panel._entitySearchQuery = '';

  // Get ordered floors and rooms
  const orderedFloors = panel._getOrderedFloors();

  // Calculate total enabled counts
  let totalRooms = 0;
  let enabledRooms = 0;
  panel._areas.forEach(area => {
    totalRooms++;
    if (panel._enabledRooms[area.area_id] !== false) enabledRooms++;
  });

  // Filter rooms based on search query
  const searchQuery = panel._entitySearchQuery ? panel._entitySearchQuery.toLowerCase() : '';
  const filterRooms = (rooms) => {
    if (!searchQuery) return rooms;
    return rooms.filter(room => room.name.toLowerCase().includes(searchQuery));
  };

  // Toggle section expansion
  const toggleSection = (sectionId) => {
    panel._expandedCardSections = {
      ...panel._expandedCardSections,
      [sectionId]: !panel._expandedCardSections[sectionId]
    };
    panel.requestUpdate();
  };

  const isExpanded = (sectionId) => panel._expandedCardSections[sectionId] || false;

  // Get all available labels from HA for label configuration
  const availableLabels = panel._labels || [];

  // Helper to render a category mapping row
  const renderCategoryRow = (category) => {
    const currentLabelId = panel[category.prop];
    const currentLabel = currentLabelId ? availableLabels.find(l => l.label_id === currentLabelId) : null;

    return html`
      <div class="label-mapping-row">
        <div class="label-mapping-category">
          <div class="label-mapping-icon">
            <ha-icon icon="${category.icon}"></ha-icon>
          </div>
          <div class="label-mapping-info">
            <span class="label-mapping-title">${category.title}</span>
            <span class="label-mapping-description">${category.description}</span>
          </div>
        </div>
        <div class="label-mapping-selector">
          <select
            .value=${currentLabelId || ''}
            style="border: 2px solid ${currentLabelId ? 'var(--dv-green)' : 'var(--dv-red)'}; border-radius: var(--dv-radius-sm);"
            @change=${(e) => {
              // Prevent changes during initial render/load
              if (!panel._settingsLoaded) return;
              const newLabelId = e.target.value || null;
              // Only update if the value actually changed
              if (newLabelId === currentLabelId || (newLabelId === null && currentLabelId === null)) return;
              panel._setCategoryLabel(category.key, newLabelId);
            }}
          >
            <option value="">-- Select Label --</option>
            ${availableLabels.map(label => html`
              <option value="${label.label_id}" ?selected=${currentLabelId === label.label_id}>
                ${label.name}
              </option>
            `)}
          </select>
        </div>
      </div>
    `;
  };

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:home-group"></ha-icon>
      Entities
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 20px;">
      Configure label mappings and enable entities for each room.
    </p>

    <!-- Label Configuration Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('labelConfig')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:tag-multiple"></ha-icon>
          Label Configuration
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('labelConfig') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('labelConfig') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Map your Home Assistant labels to DashView categories. Entities with these labels will appear in the corresponding sections throughout the dashboard.
        </p>

        ${availableLabels.length === 0 ? html`
          <div class="label-mapping-empty-state">
            <ha-icon icon="mdi:tag-off-outline"></ha-icon>
            <h3>No Labels Found</h3>
            <p>Create labels in Home Assistant first:</p>
            <p style="font-size: 13px; opacity: 0.8;">Settings → Labels → Create Label</p>
            <p style="font-size: 13px; margin-top: 12px;">Then assign labels to your entities and come back here to configure the mapping.</p>
          </div>
        ` : html`
          <div class="label-mapping-list">
            ${LABEL_CATEGORIES.map(category => renderCategoryRow(category))}
          </div>
        `}
      </div>
    </div>

    <!-- Entity Configuration Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('entityConfig')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:home-group"></ha-icon>
          Room Configuration
          <span style="font-size: 14px; font-weight: 400; margin-left: 8px; color: var(--dv-gray600);">
            ${enabledRooms}/${totalRooms} rooms enabled
          </span>
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('entityConfig') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('entityConfig') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Enable rooms and configure which entities appear on the dashboard. Click a room to expand and toggle individual devices.
        </p>

        <!-- Global Search -->
        <div class="entity-global-search" style="margin-bottom: 20px;">
          <div class="garbage-search-input-wrapper">
            <ha-icon icon="mdi:magnify" class="garbage-search-icon"></ha-icon>
            <input
              type="text"
              class="garbage-search-input"
              placeholder="Search rooms..."
              .value=${panel._entitySearchQuery || ''}
              @input=${(e) => {
                panel._entitySearchQuery = e.target.value;
                panel.requestUpdate();
              }}
            />
            ${panel._entitySearchQuery ? html`
              <ha-icon
                icon="mdi:close"
                class="garbage-search-clear"
                @click=${() => {
                  panel._entitySearchQuery = '';
                  panel.requestUpdate();
                }}
              ></ha-icon>
            ` : ''}
          </div>
        </div>

        <!-- Room List -->
        ${panel._areas.length > 0
          ? html`
              ${orderedFloors.map(floor => {
                const roomsForFloor = filterRooms(panel._getOrderedRoomsForFloor(floor.floor_id));
                if (roomsForFloor.length === 0) return '';
                return html`
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; padding-left: 4px; display: flex; align-items: center; gap: 8px;">
                      <ha-icon icon="${getFloorIcon(floor)}" style="--mdc-icon-size: 18px;"></ha-icon>
                      ${floor.name}
                      <span style="font-weight: 400; opacity: 0.7;">(${roomsForFloor.length} rooms)</span>
                    </div>
                    ${roomsForFloor.map((area) => renderAreaCard(panel, html, area))}
                  </div>
                `;
              })}
              ${(() => {
                const unassignedRooms = filterRooms(panel._getOrderedRoomsForFloor(null));
                if (unassignedRooms.length === 0) return '';
                return html`
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; padding-left: 4px; display: flex; align-items: center; gap: 8px;">
                      <ha-icon icon="mdi:help-circle-outline" style="--mdc-icon-size: 18px;"></ha-icon>
                      Unassigned Rooms
                      <span style="font-weight: 400; opacity: 0.7;">(${unassignedRooms.length} rooms)</span>
                    </div>
                    ${unassignedRooms.map((area) => renderAreaCard(panel, html, area))}
                  </div>
                `;
              })()}
            `
          : html`
              <div class="no-areas">
                <ha-icon icon="mdi:home-alert" style="--mdc-icon-size: 64px; margin-bottom: 16px;"></ha-icon>
                <p>No areas configured in Home Assistant.</p>
                <p>Go to Settings → Areas & Zones to create areas.</p>
              </div>
            `}
      </div>
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

  const toggleSection = (sectionId) => {
    panel._expandedCardSections = {
      ...panel._expandedCardSections,
      [sectionId]: !panel._expandedCardSections[sectionId]
    };
    panel.requestUpdate();
  };

  const isExpanded = (sectionId) => panel._expandedCardSections[sectionId] || false;

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
        ${orderedFloors.length === 0 ? html`
          <div class="order-empty-state">
            <ha-icon icon="mdi:floor-plan"></ha-icon>
            <p>No floors configured in Home Assistant.</p>
            <p style="font-size: 12px; margin-top: 8px;">Go to Settings → Areas & Zones → Floors to create floors.</p>
          </div>
        ` : html`
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
        ${orderedFloors.length === 0 ? html`
          <div class="order-empty-state">
            <ha-icon icon="mdi:home-alert"></ha-icon>
            <p>Configure floors first to order rooms.</p>
          </div>
        ` : orderedFloors.map(floor => {
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
                  <div class="order-list">
                    ${rooms.map((area, index) => html`
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
                            @click=${() => panel._moveRoom(floor.floor_id, area.area_id, -1)}
                            title="Move up"
                          >
                            <ha-icon icon="mdi:chevron-up"></ha-icon>
                          </button>
                          <button
                            class="order-btn"
                            ?disabled=${index === rooms.length - 1}
                            @click=${() => panel._moveRoom(floor.floor_id, area.area_id, 1)}
                            title="Move down"
                          >
                            <ha-icon icon="mdi:chevron-down"></ha-icon>
                          </button>
                        </div>
                      </div>
                    `)}
                  </div>
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

/**
 * Render the Weather tab (extracted from Cards)
 * Features: Weather entity, DWD warnings, climate notifications
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Weather tab HTML
 */
export function renderWeatherTab(panel, html) {
  const toggleSection = (sectionId) => {
    panel._expandedCardSections = {
      ...panel._expandedCardSections,
      [sectionId]: !panel._expandedCardSections[sectionId]
    };
    panel.requestUpdate();
  };

  const isExpanded = (sectionId) => panel._expandedCardSections[sectionId] || false;

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
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Select the weather entity for the header and weather popup. All forecast data will be fetched from this entity.
        </p>

        <div style="margin-bottom: 8px;">
          <div class="card-config-label">
            <span class="card-config-label-title">Weather Entity</span>
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
  `;
}

/**
 * Render the Status tab (extracted from Cards)
 * Features: Info text toggles, appliance configs, garbage card
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Status tab HTML
 */
export function renderStatusTab(panel, html) {
  const orderedFloors = panel._getOrderedFloors();

  const toggleSection = (sectionId) => {
    panel._expandedCardSections = {
      ...panel._expandedCardSections,
      [sectionId]: !panel._expandedCardSections[sectionId]
    };
    panel.requestUpdate();
  };

  const isExpanded = (sectionId) => panel._expandedCardSections[sectionId] || false;

  return html`
    <!-- ==================== A. HOUSE INFO ==================== -->
    <h2 class="section-title">
      <ha-icon icon="mdi:home-outline"></ha-icon>
      House Info
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure status information that appears in the info text area below the header.
    </p>

    <!-- Quick Status Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('quickStatus')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:text-box-outline"></ha-icon>
          Quick Status Items
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('quickStatus') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('quickStatus') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Toggle status messages that appear in the info text area below the header.
        </p>

        <!-- Motion Status -->
        ${renderInfoTextToggle(panel, html, 'motion', 'Bewegung', 'mdi:motion-sensor',
          'Zeigt die letzte erkannte Bewegung an')}

        <!-- Garage Status -->
        ${renderInfoTextToggle(panel, html, 'garage', 'Garagentore', 'mdi:garage',
          'Zeigt offene Garagentore an')}

        <!-- Windows Status -->
        ${renderInfoTextToggle(panel, html, 'windows', 'Fenster', 'mdi:window-open',
          'Zeigt offene Fenster an (aus aktivierten Fenstern)')}

        <!-- Lights Status -->
        ${renderInfoTextToggle(panel, html, 'lights', 'Lichter', 'mdi:lightbulb',
          'Zeigt Anzahl der eingeschalteten Lichter an')}

        <!-- Covers Status -->
        ${renderInfoTextToggle(panel, html, 'covers', 'Rollos', 'mdi:window-shutter',
          'Zeigt offene Rollos an')}

        <!-- TVs Status -->
        ${renderInfoTextToggle(panel, html, 'tvs', 'Fernseher', 'mdi:television',
          'Zeigt eingeschaltete Fernseher an')}

        <!-- Appliances Status -->
        ${renderAppliancesStatusSection(panel, html, toggleSection, isExpanded)}

        <!-- Battery Status -->
        ${renderInfoTextBatteryConfig(panel, html)}
      </div>
    </div>

    <!-- ==================== B. GARBAGE ==================== -->
    <h2 class="section-title" style="margin-top: 40px;">
      <ha-icon icon="mdi:trash-can"></ha-icon>
      Garbage
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure garbage pickup schedule display.
    </p>

    <!-- Garbage Card Section -->
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
          Search and add sensor entities to display upcoming garbage pickup dates.
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
        ` : html`
          <div class="garbage-empty-state">
            <ha-icon icon="mdi:trash-can-outline"></ha-icon>
            <div>No sensors added yet</div>
            <div class="garbage-empty-hint">Use the search above to find and add garbage pickup sensors</div>
          </div>
        `}

        <!-- Floor Selection -->
        <div class="garbage-floor-selector">
          <label>Display on Floor</label>
          <p style="color: var(--dv-gray600); margin-bottom: 12px; font-size: 12px;">
            Select which floor should show the garbage card in the Bottom Right position.
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

    <!-- ==================== B2. TRAIN DEPARTURES ==================== -->
    <h2 class="section-title" style="margin-top: 40px;">
      <ha-icon icon="mdi:train"></ha-icon>
      Train Departures
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure train departure times to display based on location or conditions.
    </p>

    <!-- Train Departures Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('trainDepartures')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:clock-outline"></ha-icon>
          Train Schedules
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('trainDepartures') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('trainDepartures') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 12px; font-size: 14px;">
          Add train departure sensors. Each can have a condition to show only when relevant (e.g., when you're at home or near a station).
        </p>

        <!-- Search Input -->
        <div class="garbage-search-container">
          <div class="garbage-search-input-wrapper">
            <ha-icon icon="mdi:magnify" class="garbage-search-icon"></ha-icon>
            <input
              type="text"
              class="garbage-search-input"
              placeholder="Search departure sensors..."
              .value=${panel._trainSearchQuery || ''}
              @input=${(e) => panel._handleTrainSearch(e.target.value)}
              @focus=${() => panel._trainSearchFocused = true}
              @blur=${() => setTimeout(() => { panel._trainSearchFocused = false; panel.requestUpdate(); }, 200)}
            />
            ${panel._trainSearchQuery ? html`
              <ha-icon
                icon="mdi:close"
                class="garbage-search-clear"
                @click=${() => panel._handleTrainSearch('')}
              ></ha-icon>
            ` : ''}
          </div>

          <!-- Search Suggestions Dropdown -->
          ${panel._trainSearchQuery && panel._trainSearchFocused ? html`
            <div class="garbage-search-suggestions">
              ${panel._getTrainSearchSuggestions().length === 0 ? html`
                <div class="garbage-search-no-results">No matching sensors found</div>
              ` : panel._getTrainSearchSuggestions().map(sensor => {
                const state = panel.hass?.states[sensor.entity_id];
                const icon = state?.attributes?.icon || 'mdi:train';
                const friendlyName = state?.attributes?.friendly_name || sensor.entity_id;
                const alreadyAdded = panel._trainDepartures.some(t => t.entity === sensor.entity_id);

                return html`
                  <div
                    class="garbage-search-suggestion ${alreadyAdded ? 'disabled' : ''}"
                    @click=${() => !alreadyAdded && panel._addTrainDeparture(sensor.entity_id)}
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

        <!-- Selected Train Departures List -->
        ${panel._trainDepartures.length > 0 ? html`
          <div class="garbage-selected-sensors" style="margin-top: 16px;">
            <label style="display: block; font-weight: 500; margin-bottom: 8px; color: var(--dv-gray800);">Configured Departures</label>
            <div class="train-departure-list">
              ${panel._trainDepartures.map(train => {
                const state = panel.hass?.states[train.entity];
                const icon = state?.attributes?.icon || 'mdi:train';
                const friendlyName = state?.attributes?.friendly_name || train.entity;
                const trainId = train.id || train.entity; // Support legacy entries without id

                return html`
                  <div class="train-departure-item">
                    <div class="train-departure-header">
                      <ha-icon icon="${icon}"></ha-icon>
                      <div class="train-departure-info">
                        <div class="train-departure-name">${friendlyName}</div>
                        <div class="train-departure-entity">${train.entity}</div>
                      </div>
                      <ha-icon
                        icon="mdi:close"
                        class="garbage-sensor-remove"
                        @click=${() => panel._removeTrainDeparture(trainId)}
                      ></ha-icon>
                    </div>

                    <div class="train-departure-config">
                      <!-- Label -->
                      <div class="train-config-row">
                        <label>Display Label</label>
                        <input
                          type="text"
                          placeholder="e.g., Nach Frankfurt"
                          .value=${train.label || ''}
                          @change=${(e) => panel._updateTrainDeparture(trainId, 'label', e.target.value)}
                        />
                      </div>

                      <!-- Delay Minutes -->
                      <div class="train-config-row">
                        <label>Min. Minutes Until Departure</label>
                        <input
                          type="number"
                          min="0"
                          max="60"
                          .value=${train.delayMinutes || 0}
                          @change=${(e) => panel._updateTrainDeparture(trainId, 'delayMinutes', parseInt(e.target.value) || 0)}
                        />
                      </div>

                      <!-- Condition Entity (Person/Zone dropdown) -->
                      <div class="train-config-row">
                        <label>Show When (Person/Zone)</label>
                        <select
                          .value=${train.conditionEntity || ''}
                          @change=${(e) => panel._updateTrainDeparture(trainId, 'conditionEntity', e.target.value)}
                        >
                          <option value="">-- Always show --</option>
                          <optgroup label="Persons">
                            ${Object.keys(panel.hass?.states || {})
                              .filter(id => id.startsWith('person.'))
                              .map(id => {
                                const state = panel.hass.states[id];
                                const name = state?.attributes?.friendly_name || id;
                                return html`<option value="${id}" ?selected=${train.conditionEntity === id}>${name}</option>`;
                              })}
                          </optgroup>
                          <optgroup label="Zones">
                            ${Object.keys(panel.hass?.states || {})
                              .filter(id => id.startsWith('zone.'))
                              .map(id => {
                                const state = panel.hass.states[id];
                                const name = state?.attributes?.friendly_name || id;
                                return html`<option value="${id}" ?selected=${train.conditionEntity === id}>${name}</option>`;
                              })}
                          </optgroup>
                        </select>
                      </div>

                      <!-- Condition State -->
                      <div class="train-config-row">
                        <label>Show When State Is</label>
                        <input
                          type="text"
                          placeholder="e.g., home (leave empty for 'not 0')"
                          .value=${train.conditionState || ''}
                          @change=${(e) => panel._updateTrainDeparture(trainId, 'conditionState', e.target.value)}
                        />
                      </div>

                      <!-- Time Range -->
                      <div class="train-config-row-inline">
                        <div class="train-config-row">
                          <label>Show From</label>
                          <input
                            type="time"
                            .value=${train.timeStart || ''}
                            @change=${(e) => panel._updateTrainDeparture(trainId, 'timeStart', e.target.value)}
                          />
                        </div>
                        <div class="train-config-row">
                          <label>Show Until</label>
                          <input
                            type="time"
                            .value=${train.timeEnd || ''}
                            @change=${(e) => panel._updateTrainDeparture(trainId, 'timeEnd', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                `;
              })}
            </div>
          </div>
        ` : html`
          <div class="garbage-empty-state">
            <ha-icon icon="mdi:train"></ha-icon>
            <div>No train departures configured</div>
            <div class="garbage-empty-hint">Use the search above to find and add departure sensors</div>
          </div>
        `}
      </div>
    </div>

    <!-- ==================== B3. MEDIA PLAYLISTS ==================== -->
    <h2 class="section-title" style="margin-top: 40px;">
      <ha-icon icon="mdi:music"></ha-icon>
      Media Playlists
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure playlists to show in the media player popup. Add Spotify, Apple Music, or other media URIs.
    </p>

    <!-- Media Playlists Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('mediaPlaylists')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:playlist-music"></ha-icon>
          Playlists
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('mediaPlaylists') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('mediaPlaylists') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 12px; font-size: 14px;">
          Add playlists that appear as quick-select buttons in the media player popup. Use Spotify URIs (e.g., spotify:playlist:xxxxx) or other media content IDs.
        </p>

        <!-- Existing Playlists -->
        ${panel._mediaPresets.length > 0 ? html`
          <div class="media-preset-list">
            ${panel._mediaPresets.map((preset, index) => html`
              <div class="media-preset-item">
                <div class="media-preset-header">
                  <div class="media-preset-index">${index + 1}</div>
                  <div class="media-preset-info">
                    <div class="media-preset-name">${preset.name || 'Unnamed Playlist'}</div>
                    <div class="media-preset-uri">${preset.media_content_id || 'No URI set'}</div>
                  </div>
                  <div class="media-preset-actions">
                    <button
                      class="order-btn"
                      ?disabled=${index === 0}
                      @click=${() => panel._moveMediaPreset(index, -1)}
                      title="Move up"
                    >
                      <ha-icon icon="mdi:chevron-up"></ha-icon>
                    </button>
                    <button
                      class="order-btn"
                      ?disabled=${index === panel._mediaPresets.length - 1}
                      @click=${() => panel._moveMediaPreset(index, 1)}
                      title="Move down"
                    >
                      <ha-icon icon="mdi:chevron-down"></ha-icon>
                    </button>
                    <ha-icon
                      icon="mdi:delete"
                      class="garbage-sensor-remove"
                      @click=${() => panel._removeMediaPreset(index)}
                    ></ha-icon>
                  </div>
                </div>
                <div class="media-preset-config">
                  <div class="media-preset-row">
                    <label>Display Name</label>
                    <input
                      type="text"
                      placeholder="e.g., Dinner Jazz"
                      .value=${preset.name || ''}
                      @change=${(e) => panel._updateMediaPreset(index, 'name', e.target.value)}
                    />
                  </div>
                  <div class="media-preset-row">
                    <label>Media Content ID / URI</label>
                    <input
                      type="text"
                      placeholder="e.g., spotify:playlist:37i9dQZF1DX4sWSpwq3LiO"
                      .value=${preset.media_content_id || ''}
                      @change=${(e) => panel._updateMediaPreset(index, 'media_content_id', e.target.value)}
                    />
                  </div>
                  <div class="media-preset-row">
                    <label>Cover Image URL (optional override)</label>
                    <input
                      type="text"
                      placeholder="Leave empty for auto-fetch, or paste custom URL"
                      .value=${preset.image_url || ''}
                      @change=${(e) => panel._updateMediaPreset(index, 'image_url', e.target.value)}
                    />
                    <span style="font-size: 11px; color: var(--dv-gray500); margin-top: 4px;">
                      ${preset.media_content_id?.startsWith('spotify:')
                        ? 'Spotify artwork is fetched automatically. Only set this to override.'
                        : 'For non-Spotify sources, paste an image URL here.'}
                    </span>
                  </div>
                  ${preset.image_url ? html`
                    <div class="media-preset-preview">
                      <img src="${preset.image_url}" alt="${preset.name}" />
                    </div>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>
        ` : html`
          <div class="garbage-empty-state">
            <ha-icon icon="mdi:playlist-music-outline"></ha-icon>
            <div>No playlists configured</div>
            <div class="garbage-empty-hint">Add playlists to show quick-select buttons in the media player</div>
          </div>
        `}

        <!-- Add New Playlist Button -->
        <button class="scene-button-add" @click=${() => panel._addMediaPreset()}>
          <ha-icon icon="mdi:plus"></ha-icon>
          Add Playlist
        </button>
      </div>
    </div>

    <!-- ==================== C. HOUSE NOTIFICATIONS ==================== -->
    <h2 class="section-title" style="margin-top: 40px;">
      <ha-icon icon="mdi:bell-outline"></ha-icon>
      House Notifications
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure climate notifications and alerts for rooms.
    </p>

    <!-- Climate Notification Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px;">
      <div class="card-config-section-header" style="cursor: default;">
        <div class="card-config-section-title">
          <ha-icon icon="mdi:thermometer-alert"></ha-icon>
          Room Climate Notifications
        </div>
      </div>
      <div class="card-config-section-content expanded">
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
  `;
}

/**
 * Render the Scenes tab (extracted from Cards)
 * Features: Scene buttons
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Scenes tab HTML
 */
export function renderScenesTab(panel, html) {
  const toggleSection = (sectionId) => {
    panel._expandedCardSections = {
      ...panel._expandedCardSections,
      [sectionId]: !panel._expandedCardSections[sectionId]
    };
    panel.requestUpdate();
  };

  const isExpanded = (sectionId) => panel._expandedCardSections[sectionId] || false;

  // Separate global vs room-specific buttons
  const globalButtons = panel._sceneButtons.filter(b => !b.roomId);
  const roomButtons = panel._sceneButtons.filter(b => b.roomId);

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:play-box-multiple"></ha-icon>
      Scenes & Actions
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure quick action buttons and custom entity labels.
    </p>

    <!-- Scene Buttons Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('sceneButtons')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:gesture-tap-button"></ha-icon>
          Scene Buttons
          <span style="margin-left: 8px; font-size: 12px; opacity: 0.7;">(${panel._sceneButtons.length} buttons)</span>
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('sceneButtons') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('sceneButtons') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Configure quick action buttons. Global buttons appear on the main page, room buttons appear in room popups.
        </p>

        <!-- Global Buttons -->
        ${globalButtons.length > 0 ? html`
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <ha-icon icon="mdi:home" style="--mdc-icon-size: 16px;"></ha-icon>
              Main Page Buttons (${globalButtons.length})
            </div>
            <div class="scene-buttons-list">
              ${globalButtons.map((button) => {
                const index = panel._sceneButtons.indexOf(button);
                return renderSceneButtonItem(panel, html, button, index);
              })}
            </div>
          </div>
        ` : ''}

        <!-- Room Buttons -->
        ${roomButtons.length > 0 ? html`
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <ha-icon icon="mdi:door" style="--mdc-icon-size: 16px;"></ha-icon>
              Room Buttons (${roomButtons.length})
            </div>
            <div class="scene-buttons-list">
              ${roomButtons.map((button) => {
                const index = panel._sceneButtons.indexOf(button);
                return renderSceneButtonItem(panel, html, button, index);
              })}
            </div>
          </div>
        ` : ''}

        ${panel._sceneButtons.length === 0 ? html`
          <div class="garbage-empty-state">
            <ha-icon icon="mdi:gesture-tap-button"></ha-icon>
            <div>No scene buttons configured</div>
            <div class="garbage-empty-hint">Add buttons to quickly trigger scenes, scripts, or services</div>
          </div>
        ` : ''}

        <!-- Add New Scene Button -->
        <button class="scene-button-add" @click=${() => panel._addSceneButton()}>
          <ha-icon icon="mdi:plus"></ha-icon>
          Add Scene Button
        </button>
      </div>
    </div>
  `;
}

/**
 * Render the Users tab
 * Features: User photo configuration per person entity
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Users tab HTML
 */
export function renderUsersTab(panel, html) {
  // Get all person entities from Home Assistant
  const personEntities = Object.values(panel.hass?.states || {})
    .filter(entity => entity.entity_id.startsWith('person.'))
    .sort((a, b) => {
      const nameA = a.attributes.friendly_name || a.entity_id;
      const nameB = b.attributes.friendly_name || b.entity_id;
      return nameA.localeCompare(nameB);
    });

  // Helper to get the display photo for a person
  const getDisplayPhoto = (personEntity) => {
    const customPhoto = panel._userPhotos?.[personEntity.entity_id];
    if (customPhoto) return customPhoto;
    return personEntity.attributes.entity_picture || null;
  };

  // Helper to update user photo
  const updateUserPhoto = (personId, photoUrl) => {
    panel._userPhotos = {
      ...panel._userPhotos,
      [personId]: photoUrl || ''
    };
    // Remove empty entries
    if (!photoUrl) {
      delete panel._userPhotos[personId];
      panel._userPhotos = { ...panel._userPhotos };
    }
    panel._saveSettings();
    panel.requestUpdate();
  };

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:account-group"></ha-icon>
      User Photos
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure custom profile photos for each person. These photos will be shown on the main dashboard based on which Home Assistant user is viewing.
    </p>

    ${personEntities.length > 0 ? html`
      <div class="card-config-section">
        <div class="card-config-section-content expanded">
          ${personEntities.map(person => {
            const personId = person.entity_id;
            const personName = person.attributes.friendly_name || personId;
            const customPhoto = panel._userPhotos?.[personId] || '';
            const displayPhoto = getDisplayPhoto(person);
            const hasCustomPhoto = !!panel._userPhotos?.[personId];

            return html`
              <div class="user-photo-item" style="display: flex; gap: 16px; padding: 16px; border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 12px; align-items: flex-start;">
                <!-- Photo Preview -->
                <div class="user-photo-preview" style="flex-shrink: 0; width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: var(--dv-gray200); display: flex; align-items: center; justify-content: center;">
                  ${displayPhoto
                    ? html`<img src="${displayPhoto}" alt="${personName}" style="width: 100%; height: 100%; object-fit: cover;" />`
                    : html`<ha-icon icon="mdi:account" style="--mdc-icon-size: 40px; color: var(--dv-gray500);"></ha-icon>`
                  }
                </div>

                <!-- Person Info & Photo URL -->
                <div style="flex: 1; min-width: 0;">
                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-weight: 600; font-size: 16px;">${personName}</span>
                    <span style="font-size: 12px; color: var(--dv-gray500);">${personId}</span>
                    ${hasCustomPhoto ? html`
                      <span style="font-size: 11px; background: var(--dv-blue100); color: var(--dv-blue600); padding: 2px 8px; border-radius: 12px;">Custom</span>
                    ` : ''}
                  </div>

                  <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 8px;">
                    <span style="font-size: 13px; color: var(--dv-gray500);">
                      Status: <strong style="color: ${person.state === 'home' ? 'var(--dv-green600)' : 'var(--dv-gray600)'};">
                        ${person.state === 'home' ? 'Home' : person.state === 'not_home' ? 'Away' : person.state}
                      </strong>
                    </span>
                  </div>

                  <div style="margin-top: 12px;">
                    <label style="display: block; font-size: 13px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 4px;">
                      Custom Photo URL
                    </label>
                    <div style="display: flex; gap: 8px;">
                      <input
                        type="text"
                        placeholder="https://example.com/photo.jpg"
                        .value=${customPhoto}
                        @change=${(e) => updateUserPhoto(personId, e.target.value)}
                        style="flex: 1; padding: 8px 12px; border: 1px solid var(--dv-gray300); border-radius: 8px; font-size: 14px;"
                      />
                      ${customPhoto ? html`
                        <button
                          @click=${() => updateUserPhoto(personId, '')}
                          style="padding: 8px 12px; border: 1px solid var(--dv-gray300); border-radius: 8px; background: transparent; cursor: pointer; display: flex; align-items: center; gap: 4px; color: var(--dv-red600);"
                          title="Remove custom photo"
                        >
                          <ha-icon icon="mdi:delete" style="--mdc-icon-size: 18px;"></ha-icon>
                        </button>
                      ` : ''}
                    </div>
                    <span style="display: block; font-size: 11px; color: var(--dv-gray500); margin-top: 4px;">
                      ${person.attributes.entity_picture
                        ? 'Leave empty to use the photo from Home Assistant.'
                        : 'No photo set in Home Assistant. Add a URL to set a custom photo.'}
                    </span>
                  </div>
                </div>
              </div>
            `;
          })}
        </div>
      </div>
    ` : html`
      <div class="garbage-empty-state">
        <ha-icon icon="mdi:account-off"></ha-icon>
        <div>No person entities found</div>
        <div class="garbage-empty-hint">Add person entities in Home Assistant to configure their photos here.</div>
      </div>
    `}
  `;
}
