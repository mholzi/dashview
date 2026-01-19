/**
 * Floor Cards Step Component
 * Sixth step in the setup wizard - configure floor card slots on the dashboard
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';

/**
 * Floor cards step styles
 */
export const floorCardsStepStyles = `
  /* ==================== FLOOR CARDS STEP ==================== */
  .dv-floor-cards-step {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-floor-cards-header {
    text-align: center;
  }

  .dv-floor-cards-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-floor-cards-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== FLOOR SECTIONS ==================== */
  .dv-floor-cards-sections {
    display: flex;
    flex-direction: column;
    gap: 24px;
    flex: 1;
    min-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .dv-floor-cards-section {
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    padding: 16px;
  }

  .dv-floor-cards-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin-bottom: 16px;
  }

  .dv-floor-cards-section-title ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  /* ==================== FLOOR OVERVIEW TOGGLE ==================== */
  .dv-floor-overview-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-radius: 8px;
    margin-bottom: 16px;
  }

  .dv-floor-overview-toggle-label {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dv-floor-overview-toggle-label ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-floor-overview-toggle-text {
    display: flex;
    flex-direction: column;
  }

  .dv-floor-overview-toggle-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-floor-overview-toggle-subtitle {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  /* ==================== VISUAL GRID ==================== */
  .dv-floor-cards-grid {
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 76px 76px 76px 76px;
    grid-template-areas:
      "small1 big1"
      "big2 big1"
      "big2 small2"
      "small3 small4";
    gap: 0;
    margin-bottom: 8px;
  }

  .dv-floor-card-slot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 8px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border: 2px dashed var(--dv-border, var(--divider-color));
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dv-floor-card-slot:hover {
    border-color: var(--dv-accent-primary, var(--primary-color));
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.05));
  }

  .dv-floor-card-slot.configured {
    background: var(--dv-bg-secondary, var(--card-background-color));
    border-style: solid;
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-floor-card-slot.selected {
    border-color: var(--dv-accent-primary, var(--primary-color));
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    box-shadow: 0 0 0 2px var(--dv-accent-primary, var(--primary-color));
  }

  .dv-floor-card-slot.disabled {
    opacity: 0.6;
    cursor: not-allowed;
    border-style: solid;
  }

  .dv-floor-card-slot.big {
    min-height: 60px;
  }

  .dv-floor-card-slot.small {
    min-height: 60px;
  }

  .dv-floor-card-slot-label {
    font-size: 11px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }

  .dv-floor-card-slot ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
  }

  .dv-floor-card-slot.configured ha-icon {
    color: var(--dv-accent-primary, var(--primary-color));
  }

  /* ==================== ENTITY PICKER ==================== */
  .dv-floor-card-entity-picker {
    margin-top: 12px;
    padding: 12px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-radius: 8px;
  }

  .dv-floor-card-entity-picker-title {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin-bottom: 8px;
  }

  .dv-floor-card-entity-picker select {
    width: 100%;
    padding: 10px 12px;
    font-size: 13px;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 8px;
    background: var(--dv-bg-primary, var(--primary-background-color));
    color: var(--dv-text-primary, var(--primary-text-color));
    cursor: pointer;
    outline: none;
  }

  .dv-floor-card-entity-picker select:focus {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-floor-card-clear-btn {
    margin-top: 8px;
    padding: 8px 16px;
    font-size: 12px;
    background: transparent;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 6px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dv-floor-card-clear-btn:hover {
    background: var(--dv-error-subtle, rgba(var(--rgb-error-color), 0.1));
    border-color: var(--dv-error, var(--error-color));
    color: var(--dv-error, var(--error-color));
  }

  /* ==================== HINT ==================== */
  .dv-floor-cards-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-floor-cards-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-accent-primary, var(--primary-color));
    flex-shrink: 0;
  }

  /* ==================== TOGGLE SWITCH ==================== */
  .dv-toggle-switch {
    width: 44px;
    height: 24px;
    background: var(--dv-bg-tertiary, var(--divider-color));
    border-radius: 12px;
    position: relative;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .dv-toggle-switch::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background: white;
    border-radius: 50%;
    transition: transform 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  }

  .dv-toggle-switch.on {
    background: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-toggle-switch.on::after {
    transform: translateX(20px);
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-floor-cards-empty {
    text-align: center;
    padding: 32px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 2px dashed var(--dv-border, var(--divider-color));
    border-radius: 12px;
  }

  .dv-floor-cards-empty-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-bottom: 12px;
  }

  .dv-floor-cards-empty-text {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }
`;

/**
 * Slot labels for the 6-slot grid
 */
const SLOT_LABELS = {
  0: { name: 'Top Left', desc: 'Small slot' },
  1: { name: 'Top Right', desc: 'Large slot (Floor Overview or Entity)' },
  2: { name: 'Bottom Right', desc: 'Large slot (Garbage Card or Entity)' },
  3: { name: 'Middle Left', desc: 'Small slot' },
  4: { name: 'Lower Left 1', desc: 'Small slot' },
  5: { name: 'Lower Left 2', desc: 'Small slot' }
};

/**
 * Get floor icon based on floor name
 * @param {Object} floor - Floor object
 * @returns {string} MDI icon
 */
function getFloorIcon(floor) {
  const name = (floor.name || '').toLowerCase();
  if (name.includes('ground') || name.includes('erdgeschoss') || name === 'eg') return 'mdi:home-floor-g';
  if (name.includes('first') || name.includes('1') || name === 'og' || name.includes('obergeschoss')) return 'mdi:home-floor-1';
  if (name.includes('second') || name.includes('2')) return 'mdi:home-floor-2';
  if (name.includes('third') || name.includes('3')) return 'mdi:home-floor-3';
  if (name.includes('basement') || name.includes('keller') || name === 'ug') return 'mdi:home-floor-b';
  if (name.includes('attic') || name.includes('dach')) return 'mdi:home-roof';
  return 'mdi:home-floor-0';
}

/**
 * Render the floor cards step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderFloorCardsStep(panel, html) {
  // Initialize wizard state if not exists
  if (!panel._wizardFloorCardsState) {
    panel._wizardFloorCardsState = {
      selectedSlot: null, // format: "floorId-slotIndex"
      floorOverviewEnabled: { ...panel._floorOverviewEnabled } || {},
      floorCardConfig: { ...panel._floorCardConfig } || {}
    };
  }

  const state = panel._wizardFloorCardsState;
  const floors = panel._getOrderedFloors ? panel._getOrderedFloors() : (panel._floors || []);

  if (floors.length === 0) {
    return html`
      <style>${floorCardsStepStyles}</style>
      <div class="dv-floor-cards-step">
        <div class="dv-floor-cards-empty">
          <ha-icon class="dv-floor-cards-empty-icon" icon="mdi:floor-plan"></ha-icon>
          <p class="dv-floor-cards-empty-text">
            ${t('wizard.floorCards.noFloors', 'No floors configured. Go back to add floors.')}
          </p>
        </div>
      </div>
    `;
  }

  // Get entities for selection
  const getAvailableEntities = () => {
    if (!panel.hass) return [];
    const entities = [];
    Object.entries(panel.hass.states).forEach(([entityId, state]) => {
      const domain = entityId.split('.')[0];
      // Only include commonly used entity types for floor cards
      const allowedDomains = ['light', 'sensor', 'binary_sensor', 'climate', 'cover', 'switch', 'media_player'];
      if (allowedDomains.includes(domain)) {
        entities.push({
          entity_id: entityId,
          name: state.attributes?.friendly_name || entityId,
          icon: state.attributes?.icon || getDefaultIcon(domain)
        });
      }
    });
    return entities.sort((a, b) => a.name.localeCompare(b.name));
  };

  const getDefaultIcon = (domain) => {
    const icons = {
      light: 'mdi:lightbulb',
      sensor: 'mdi:thermometer',
      binary_sensor: 'mdi:motion-sensor',
      climate: 'mdi:thermostat',
      cover: 'mdi:window-shutter',
      switch: 'mdi:toggle-switch',
      media_player: 'mdi:speaker'
    };
    return icons[domain] || 'mdi:help-circle';
  };

  const entities = getAvailableEntities();

  // Toggle floor overview
  const toggleFloorOverview = (floorId) => {
    state.floorOverviewEnabled[floorId] = !state.floorOverviewEnabled[floorId];
    panel._floorOverviewEnabled = { ...state.floorOverviewEnabled };
    panel.requestUpdate();
  };

  // Select a slot
  const selectSlot = (floorId, slotIndex) => {
    const key = `${floorId}-${slotIndex}`;
    state.selectedSlot = state.selectedSlot === key ? null : key;
    panel.requestUpdate();
  };

  // Set entity for selected slot
  const setSlotEntity = (entityId) => {
    if (!state.selectedSlot) return;
    const [floorId, slotIndex] = state.selectedSlot.split('-');
    if (!state.floorCardConfig[floorId]) {
      state.floorCardConfig[floorId] = {};
    }
    if (entityId) {
      const entity = entities.find(e => e.entity_id === entityId);
      state.floorCardConfig[floorId][slotIndex] = {
        entity_id: entityId,
        type: 'entity'
      };
    } else {
      delete state.floorCardConfig[floorId][slotIndex];
    }
    panel._floorCardConfig = { ...state.floorCardConfig };
    panel.requestUpdate();
  };

  // Render a visual slot
  const renderVisualSlot = (floorId, slotIndex, isBig, gridArea, isDisabled, disabledIcon, disabledText) => {
    const config = state.floorCardConfig[floorId] || {};
    const slotConfig = config[slotIndex] || null;
    const entityId = slotConfig?.entity_id;
    const isConfigured = !!entityId;
    const entity = isConfigured ? entities.find(e => e.entity_id === entityId) : null;
    const isSelected = state.selectedSlot === `${floorId}-${slotIndex}`;

    if (isDisabled) {
      return html`
        <div
          class="dv-floor-card-slot ${isBig ? 'big' : 'small'} configured disabled"
          style="grid-area: ${gridArea};"
        >
          <ha-icon icon="${disabledIcon}"></ha-icon>
          <div class="dv-floor-card-slot-label">${disabledText}</div>
        </div>
      `;
    }

    return html`
      <div
        class="dv-floor-card-slot ${isBig ? 'big' : 'small'} ${isConfigured ? 'configured' : ''} ${isSelected ? 'selected' : ''}"
        style="grid-area: ${gridArea};"
        @click=${() => selectSlot(floorId, slotIndex)}
      >
        ${entity ? html`
          <ha-icon icon="${entity.icon}"></ha-icon>
          <div class="dv-floor-card-slot-label">${entity.name}</div>
        ` : html`
          <ha-icon icon="mdi:plus"></ha-icon>
          <div class="dv-floor-card-slot-label">${SLOT_LABELS[slotIndex]?.name || `Slot ${slotIndex + 1}`}</div>
        `}
      </div>
    `;
  };

  // Render entity picker for selected slot
  const renderEntityPicker = (floorId) => {
    const isFloorSelected = state.selectedSlot && state.selectedSlot.startsWith(floorId);
    if (!isFloorSelected) return '';

    const [, slotIndex] = state.selectedSlot.split('-');
    const config = state.floorCardConfig[floorId] || {};
    const currentEntity = config[slotIndex]?.entity_id || '';

    return html`
      <div class="dv-floor-card-entity-picker">
        <div class="dv-floor-card-entity-picker-title">
          ${t('admin.layout.selectEntity', 'Select entity for')} ${SLOT_LABELS[slotIndex]?.name || `Slot ${parseInt(slotIndex) + 1}`}
        </div>
        <select
          .value=${currentEntity}
          @change=${(e) => setSlotEntity(e.target.value)}
        >
          <option value="">${t('admin.layout.selectEntity', 'Select entity...')}</option>
          ${entities.map(entity => html`
            <option value="${entity.entity_id}" ?selected=${currentEntity === entity.entity_id}>
              ${entity.name}
            </option>
          `)}
        </select>
        ${currentEntity ? html`
          <button class="dv-floor-card-clear-btn" @click=${() => setSlotEntity('')}>
            ${t('admin.layout.clearSlot', 'Clear slot')}
          </button>
        ` : ''}
      </div>
    `;
  };

  return html`
    <style>${floorCardsStepStyles}</style>
    <div class="dv-floor-cards-step">
      <div class="dv-floor-cards-header">
        <h2 class="dv-floor-cards-title">
          ${t('wizard.floorCards.title', 'Set Up Your Dashboard')}
        </h2>
        <p class="dv-floor-cards-desc">
          ${t('wizard.floorCards.description', 'Arrange which entities appear on your main dashboard. Each floor has a card grid where you can assign entities to specific slots.')}
        </p>
      </div>

      <div class="dv-floor-cards-sections">
        ${floors.map(floor => html`
          <div class="dv-floor-cards-section">
            <div class="dv-floor-cards-section-title">
              <ha-icon icon="${floor.icon || getFloorIcon(floor)}"></ha-icon>
              ${floor.name}
            </div>

            <!-- Floor Overview Toggle -->
            <div class="dv-floor-overview-toggle">
              <div class="dv-floor-overview-toggle-label">
                <ha-icon icon="mdi:view-carousel"></ha-icon>
                <div class="dv-floor-overview-toggle-text">
                  <span class="dv-floor-overview-toggle-title">${t('admin.layout.floorOverviewTopRight', 'Floor Overview (Top Right)')}</span>
                  <span class="dv-floor-overview-toggle-subtitle">${t('admin.layout.floorOverviewDescFull', 'Swipeable card showing all rooms on this floor')}</span>
                </div>
              </div>
              <div
                class="dv-toggle-switch ${state.floorOverviewEnabled[floor.floor_id] ? 'on' : ''}"
                @click=${() => toggleFloorOverview(floor.floor_id)}
              ></div>
            </div>

            <!-- Visual Grid (6 slots matching admin layout) -->
            <div class="dv-floor-cards-grid">
              ${renderVisualSlot(floor.floor_id, 0, false, 'small1', false)}
              ${renderVisualSlot(
                floor.floor_id, 1, true, 'big1',
                state.floorOverviewEnabled[floor.floor_id],
                'mdi:view-carousel', 'Floor Overview'
              )}
              ${renderVisualSlot(floor.floor_id, 2, true, 'big2', false)}
              ${renderVisualSlot(floor.floor_id, 3, false, 'small2', false)}
              ${renderVisualSlot(floor.floor_id, 4, false, 'small3', false)}
              ${renderVisualSlot(floor.floor_id, 5, false, 'small4', false)}
            </div>

            <!-- Entity Picker -->
            ${renderEntityPicker(floor.floor_id)}
          </div>
        `)}
      </div>

      <!-- Hint -->
      <div class="dv-floor-cards-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <span>${t('wizard.floorCards.hint', 'Tip: You can also configure this in the Admin area under Layout')}</span>
      </div>
    </div>
  `;
}

/**
 * Get floor cards config from wizard state
 * @param {Object} panel - Panel instance
 * @returns {Object} Floor cards configuration
 */
export function getFloorCardsConfig(panel) {
  return {
    floorCardConfig: panel._wizardFloorCardsState?.floorCardConfig || panel._floorCardConfig || {},
    floorOverviewEnabled: panel._wizardFloorCardsState?.floorOverviewEnabled || panel._floorOverviewEnabled || {}
  };
}

/**
 * Save floor cards config to settings store
 * @param {Object} config - Floor cards configuration
 * @param {Object} settingsStore - Settings store instance
 */
export function saveFloorCardsConfig(config, settingsStore) {
  try {
    const settings = settingsStore.settings || {};
    settingsStore.updateSettings({
      ...settings,
      floorCardConfig: config.floorCardConfig,
      floorOverviewEnabled: config.floorOverviewEnabled
    });
  } catch (e) {
    console.warn('[Dashview] Failed to save floor cards config:', e);
  }
}

export default renderFloorCardsStep;
