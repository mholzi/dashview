/**
 * Dashview Admin - Status Tab
 * House info, garbage card, train departures, media playlists, and notifications
 */

import { t, createSectionHelpers } from './shared.js';
import { renderInfoTextToggle, renderInfoTextBatteryConfig } from './layout-tab.js';
import { renderEmptyState } from '../../components/layout/empty-state.js';

/**
 * Helper: Render appliances status section for house info
 * Shows which enabled appliances should appear in home status
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Function} toggleSection - Section toggle handler
 * @param {Function} isExpanded - Section expanded state checker
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
 * Render the Status tab (extracted from Cards)
 * Features: Info text toggles, appliance configs, garbage card
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Status tab HTML
 */
export function renderStatusTab(panel, html) {
  const orderedFloors = panel._getOrderedFloors();

  // Section toggle helpers with localStorage persistence
  const { toggleSection, isExpanded } = createSectionHelpers(panel);

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

        <!-- Water Leak Status -->
        ${renderInfoTextToggle(panel, html, 'water', t('admin.infoTextToggles.water'), 'mdi:water-alert',
          t('admin.infoTextToggles.waterDesc'))}

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
        ` : renderEmptyState(html, {
          icon: 'mdi:trash-can-outline',
          title: 'No sensors added yet',
          hint: 'Use the search above to find and add garbage pickup sensors'
        })}

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
        ` : renderEmptyState(html, {
          icon: 'mdi:train',
          title: 'No train departures configured',
          hint: 'Use the search above to find and add departure sensors'
        })}
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
            <div class="section-header-hint">
              <ha-icon icon="mdi:gesture-swipe-horizontal"></ha-icon>
              <span>${t('admin.layout.dragToReorder')}</span>
            </div>
            <sortable-list
              item-key="id"
              handle-selector=".sortable-handle"
              @reorder=${(e) => panel._handleMediaPresetReorder(e.detail)}
            >
            ${panel._mediaPresets.map((preset, index) => html`
              <div class="media-preset-item sortable-item" data-id="${index}">
                <div class="media-preset-header">
                  <div class="sortable-handle" title="${t('admin.layout.dragToReorder')}">
                    <ha-icon icon="mdi:drag-horizontal"></ha-icon>
                  </div>
                  <div class="media-preset-index">${index + 1}</div>
                  <div class="media-preset-info">
                    <div class="media-preset-name">${preset.name || t('admin.status.unnamedPlaylist')}</div>
                    <div class="media-preset-uri">${preset.media_content_id || t('admin.status.noUriSet')}</div>
                  </div>
                  <div class="media-preset-actions">
                    <button
                      class="order-btn"
                      ?disabled=${index === 0}
                      @click=${() => panel._moveMediaPreset(index, -1)}
                      title="${t('admin.layout.moveUp')}"
                    >
                      <ha-icon icon="mdi:chevron-up"></ha-icon>
                    </button>
                    <button
                      class="order-btn"
                      ?disabled=${index === panel._mediaPresets.length - 1}
                      @click=${() => panel._moveMediaPreset(index, 1)}
                      title="${t('admin.layout.moveDown')}"
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
            </sortable-list>
          </div>
        ` : renderEmptyState(html, {
          icon: 'mdi:playlist-music-outline',
          title: t('admin.status.noPlaylistsConfigured'),
          hint: t('admin.status.playlistsHint')
        })}

        <!-- Add New Playlist Button -->
        <button class="scene-button-add" @click=${() => panel._addMediaPreset()}>
          <ha-icon icon="mdi:plus"></ha-icon>
          ${t('admin.status.addPlaylist')}
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
