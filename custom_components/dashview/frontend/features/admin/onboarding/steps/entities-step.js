/**
 * Entities Step Component
 * Fourth step in the setup wizard - select which entities to show per room
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';
import { getOnboardingStore } from '../../../../stores/index.js';

/**
 * Suggested domains (commonly enabled entity types)
 */
export const SUGGESTED_DOMAINS = ['light', 'climate', 'cover', 'switch', 'fan'];

/**
 * Domain to icon mapping
 */
const DOMAIN_ICONS = {
  light: 'mdi:lightbulb',
  switch: 'mdi:toggle-switch',
  cover: 'mdi:window-shutter',
  climate: 'mdi:thermostat',
  lock: 'mdi:lock',
  fan: 'mdi:fan',
  vacuum: 'mdi:robot-vacuum',
  media_player: 'mdi:cast',
  sensor: 'mdi:eye',
  binary_sensor: 'mdi:checkbox-blank-circle-outline',
  automation: 'mdi:robot',
  script: 'mdi:script-text',
  scene: 'mdi:palette',
  input_boolean: 'mdi:toggle-switch',
  person: 'mdi:account',
  camera: 'mdi:video',
  weather: 'mdi:weather-partly-cloudy',
  default: 'mdi:help-circle',
};

/**
 * Entities step styles
 */
export const entitiesStepStyles = `
  /* ==================== ENTITIES STEP ==================== */
  .dv-entities-step {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-entities-header {
    text-align: center;
  }

  .dv-entities-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-entities-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== SEARCH & ACTIONS ==================== */
  .dv-entities-toolbar {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
    align-items: center;
  }

  .dv-entities-search {
    flex: 1;
    min-width: 200px;
    position: relative;
  }

  .dv-entities-search-input {
    width: 100%;
    padding: 10px 36px 10px 12px;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 8px;
    font-size: 14px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    color: var(--dv-text-primary, var(--primary-text-color));
    outline: none;
    transition: border-color 0.2s ease;
  }

  .dv-entities-search-input:focus {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-entities-search-input::placeholder {
    color: var(--dv-text-tertiary, var(--secondary-text-color));
  }

  .dv-entities-search-clear {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    width: 24px;
    height: 24px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.2s ease;
  }

  .dv-entities-search-clear.visible {
    opacity: 1;
    pointer-events: auto;
  }

  .dv-entities-suggest-btn {
    padding: 10px 16px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    border: 1px solid var(--dv-accent-primary, var(--primary-color));
    border-radius: 8px;
    color: var(--dv-accent-primary, var(--primary-color));
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s ease;
    white-space: nowrap;
  }

  .dv-entities-suggest-btn:hover {
    background: var(--dv-accent-primary, var(--primary-color));
    color: var(--dv-text-on-accent, #fff);
  }

  /* ==================== ROOM GROUPS ==================== */
  .dv-entities-rooms {
    display: flex;
    flex-direction: column;
    gap: 12px;
    max-height: 400px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .dv-entities-room {
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    overflow: hidden;
  }

  .dv-entities-room-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    cursor: pointer;
    user-select: none;
  }

  .dv-entities-room-header:hover {
    background: var(--dv-bg-secondary, var(--divider-color));
  }

  .dv-entities-room-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-entities-room-icon ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-entities-room-name {
    flex: 1;
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-entities-room-count {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    padding: 4px 10px;
    background: var(--dv-bg-primary, var(--primary-background-color));
    border-radius: 12px;
  }

  .dv-entities-room-count.all-selected {
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-entities-room-chevron {
    --mdc-icon-size: 20px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    transition: transform 0.2s ease;
  }

  .dv-entities-room-chevron.expanded {
    transform: rotate(180deg);
  }

  /* ==================== ENTITY LIST ==================== */
  .dv-entities-list {
    display: none;
    flex-direction: column;
    padding: 8px;
    gap: 4px;
  }

  .dv-entities-list.expanded {
    display: flex;
  }

  .dv-entities-bulk-actions {
    display: flex;
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid var(--dv-border, var(--divider-color));
    margin-bottom: 4px;
  }

  .dv-entities-bulk-btn {
    padding: 6px 12px;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 6px;
    background: transparent;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dv-entities-bulk-btn:hover {
    background: var(--dv-bg-tertiary, var(--divider-color));
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-entity-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .dv-entity-item:hover {
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
  }

  .dv-entity-item.selected {
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
  }

  .dv-entity-checkbox {
    width: 20px;
    height: 20px;
    border: 2px solid var(--dv-border, var(--divider-color));
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .dv-entity-item.selected .dv-entity-checkbox {
    background: var(--dv-accent-primary, var(--primary-color));
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-entity-checkbox ha-icon {
    --mdc-icon-size: 14px;
    color: var(--dv-text-on-accent, #fff);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .dv-entity-item.selected .dv-entity-checkbox ha-icon {
    opacity: 1;
  }

  .dv-entity-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dv-entity-icon ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-entity-item.suggested .dv-entity-icon {
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
  }

  .dv-entity-item.suggested .dv-entity-icon ha-icon {
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-entity-info {
    flex: 1;
    min-width: 0;
  }

  .dv-entity-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--dv-text-primary, var(--primary-text-color));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dv-entity-id {
    font-size: 11px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dv-entity-badge {
    font-size: 9px;
    padding: 2px 6px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    color: var(--dv-accent-primary, var(--primary-color));
    border-radius: 8px;
    flex-shrink: 0;
  }

  /* ==================== EMPTY / NO RESULTS ==================== */
  .dv-entities-empty {
    text-align: center;
    padding: 32px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-entities-empty ha-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-bottom: 12px;
  }

  /* ==================== SUMMARY ==================== */
  .dv-entities-summary {
    display: flex;
    justify-content: center;
    gap: 24px;
    padding: 16px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border-radius: 12px;
    border: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-entities-stat {
    text-align: center;
  }

  .dv-entities-stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-entities-stat-label {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }
`;

/**
 * Get domain icon
 * @param {string} domain - Entity domain
 * @returns {string} MDI icon name
 */
function getDomainIcon(domain) {
  return DOMAIN_ICONS[domain] || DOMAIN_ICONS.default;
}

/**
 * Check if entity is from a suggested domain
 * @param {string} entityId - Entity ID
 * @returns {boolean}
 */
function isSuggestedEntity(entityId) {
  const domain = entityId.split('.')[0];
  return SUGGESTED_DOMAINS.includes(domain);
}

/**
 * Group entities by room/area
 * @param {Object} hass - Home Assistant instance
 * @param {Object} panel - Panel instance with _areas and _entityRegistry
 * @returns {Array} Grouped entities
 */
function groupEntitiesByRoom(hass, panel) {
  const grouped = {};
  const areas = panel._areas || [];
  const entityRegistry = panel._entityRegistry || [];

  // Create area lookup map
  const areaMap = {};
  areas.forEach(area => {
    areaMap[area.area_id] = area;
  });

  // Get entity registry map for area assignments
  const entityRegMap = {};
  entityRegistry.forEach(reg => {
    entityRegMap[reg.entity_id] = reg;
  });

  // Group entities
  Object.entries(hass.states).forEach(([entityId, state]) => {
    const entityReg = entityRegMap[entityId];
    const areaId = entityReg?.area_id || 'unassigned';
    const area = areaMap[areaId];
    const areaName = area?.name || t('onboarding.rooms.unassigned', 'Unassigned');

    // Skip hidden entities
    if (entityReg?.hidden_by) return;

    // Skip entities that shouldn't be user-configurable
    const domain = entityId.split('.')[0];
    const skipDomains = ['zone', 'persistent_notification', 'conversation', 'tts', 'update', 'button'];
    if (skipDomains.includes(domain)) return;

    if (!grouped[areaId]) {
      grouped[areaId] = {
        id: areaId,
        name: areaName,
        icon: area?.icon,
        entities: []
      };
    }

    grouped[areaId].entities.push({
      entityId,
      domain,
      friendlyName: state.attributes.friendly_name || entityId,
      state: state.state,
      suggested: isSuggestedEntity(entityId)
    });
  });

  // Sort entities within each room
  Object.values(grouped).forEach(room => {
    room.entities.sort((a, b) => {
      // Suggested first
      if (a.suggested && !b.suggested) return -1;
      if (!a.suggested && b.suggested) return 1;
      // Then alphabetically
      return a.friendlyName.localeCompare(b.friendlyName);
    });
  });

  // Sort rooms - unassigned last
  return Object.values(grouped).sort((a, b) => {
    if (a.id === 'unassigned') return 1;
    if (b.id === 'unassigned') return -1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Save entity selections to settings store
 * @param {Object} selectedEntities - Map of entityId to boolean
 * @param {Object} settingsStore - Settings store instance
 * @param {Object} panel - Panel instance for room data
 */
export function saveEntitySelections(selectedEntities, settingsStore, panel) {
  try {
    const settings = settingsStore.settings || {};
    const roomConfig = { ...(settings.roomConfig || {}) };
    const areas = panel._areas || [];
    const entityRegistry = panel._entityRegistry || [];

    // Build entity to area mapping
    const entityRegMap = {};
    entityRegistry.forEach(reg => {
      entityRegMap[reg.entity_id] = reg;
    });

    // Group selected entities by area/room
    Object.entries(selectedEntities).forEach(([entityId, isSelected]) => {
      if (!isSelected) return;

      const entityReg = entityRegMap[entityId];
      const areaId = entityReg?.area_id;
      if (!areaId) return;

      // Initialize room config if needed
      if (!roomConfig[areaId]) {
        roomConfig[areaId] = { enabled: true, entities: {} };
      }
      if (!roomConfig[areaId].entities) {
        roomConfig[areaId].entities = {};
      }

      // Enable entity in room config
      const domain = entityId.split('.')[0];
      const entityType = getEntityTypeForDomain(domain);
      if (entityType) {
        if (!roomConfig[areaId].entities[entityType]) {
          roomConfig[areaId].entities[entityType] = [];
        }
        if (!roomConfig[areaId].entities[entityType].includes(entityId)) {
          roomConfig[areaId].entities[entityType].push(entityId);
        }
      }
    });

    // Save to settings store
    settingsStore.updateSettings({ ...settings, roomConfig });
  } catch (e) {
    console.warn('[Dashview] Failed to save entity selections:', e);
  }
}

/**
 * Map domain to entity type for room config
 * @param {string} domain - Entity domain
 * @returns {string|null} Entity type or null
 */
function getEntityTypeForDomain(domain) {
  const domainToType = {
    light: 'lights',
    switch: 'switches',
    cover: 'covers',
    climate: 'climates',
    fan: 'fans',
    lock: 'locks',
    media_player: 'mediaPlayers',
    sensor: 'sensors',
    binary_sensor: 'binarySensors',
    vacuum: 'vacuums',
    camera: 'cameras'
  };
  return domainToType[domain] || null;
}

/**
 * Get entity selections from wizard state
 * @returns {Object} Selected entities map
 */
export function getEntitySelections(panel) {
  return panel._wizardEntityState?.selected || {};
}

/**
 * Render the entities step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderEntitiesStep(panel, html) {
  // Show loading state if hass not available
  if (!panel.hass) {
    return html`
      <style>${entitiesStepStyles}</style>
      <div class="dv-entities-step">
        <div class="dv-entities-empty">
          <ha-icon icon="mdi:loading" class="spin"></ha-icon>
          <p>${t('ui.errors.loading', 'Loading...')}</p>
        </div>
      </div>
    `;
  }

  // Initialize state
  if (!panel._wizardEntityState) {
    panel._wizardEntityState = {
      search: '',
      expanded: {},
      selected: {}
    };

    // Pre-select suggested entities
    const rooms = groupEntitiesByRoom(panel.hass, panel);
    rooms.forEach(room => {
      room.entities.forEach(entity => {
        if (entity.suggested) {
          panel._wizardEntityState.selected[entity.entityId] = true;
        }
      });
    });
  }

  const state = panel._wizardEntityState;
  const settingsStore = getSettingsStore();
  const onboardingStore = getOnboardingStore();

  // Get grouped entities
  let rooms = groupEntitiesByRoom(panel.hass, panel);

  // Filter by search
  const searchTerm = state.search.toLowerCase().trim();
  if (searchTerm) {
    rooms = rooms.map(room => ({
      ...room,
      entities: room.entities.filter(entity =>
        entity.friendlyName.toLowerCase().includes(searchTerm) ||
        entity.entityId.toLowerCase().includes(searchTerm) ||
        entity.domain.toLowerCase().includes(searchTerm)
      )
    })).filter(room => room.entities.length > 0);
  }

  // Count totals
  const totalEntities = rooms.reduce((sum, r) => sum + r.entities.length, 0);
  const selectedCount = Object.keys(state.selected).filter(k => state.selected[k]).length;

  // Handle toggle entity
  const toggleEntity = (entityId) => {
    state.selected[entityId] = !state.selected[entityId];
    panel.requestUpdate();
  };

  // Handle select all in room
  const selectAllInRoom = (room) => {
    room.entities.forEach(entity => {
      state.selected[entity.entityId] = true;
    });
    panel.requestUpdate();
  };

  // Handle deselect all in room
  const deselectAllInRoom = (room) => {
    room.entities.forEach(entity => {
      state.selected[entity.entityId] = false;
    });
    panel.requestUpdate();
  };

  // Handle toggle room expansion
  const toggleRoom = (roomId) => {
    state.expanded[roomId] = !state.expanded[roomId];
    panel.requestUpdate();
  };

  // Handle enable suggested
  const enableSuggested = () => {
    rooms.forEach(room => {
      room.entities.forEach(entity => {
        if (entity.suggested) {
          state.selected[entity.entityId] = true;
        }
      });
    });
    panel.requestUpdate();
  };

  // Get area icon
  const getAreaIcon = (room) => {
    if (room.icon) return room.icon;
    const name = room.name.toLowerCase();
    if (name.includes('kitchen') || name.includes('küche')) return 'mdi:countertop';
    if (name.includes('living') || name.includes('wohn')) return 'mdi:sofa';
    if (name.includes('bed') || name.includes('schlaf')) return 'mdi:bed';
    if (name.includes('bath') || name.includes('bad')) return 'mdi:shower';
    if (name.includes('office') || name.includes('büro')) return 'mdi:desk';
    return 'mdi:door';
  };

  return html`
    <style>${entitiesStepStyles}</style>
    <div class="dv-entities-step">
      <div class="dv-entities-header">
        <h2 class="dv-entities-title">
          ${t('onboarding.entities.title', 'Select Your Entities')}
        </h2>
        <p class="dv-entities-desc">
          ${t('onboarding.entities.desc', 'Choose which devices to show on your dashboard. Suggested devices are pre-selected.')}
        </p>
      </div>

      <!-- Toolbar -->
      <div class="dv-entities-toolbar">
        <div class="dv-entities-search">
          <input
            type="text"
            class="dv-entities-search-input"
            placeholder="${t('onboarding.entities.searchPlaceholder', 'Search entities...')}"
            .value=${state.search}
            @input=${(e) => { state.search = e.target.value; panel.requestUpdate(); }}
          />
          <button
            class="dv-entities-search-clear ${state.search ? 'visible' : ''}"
            @click=${() => { state.search = ''; panel.requestUpdate(); }}
          >
            <ha-icon icon="mdi:close"></ha-icon>
          </button>
        </div>
        <button class="dv-entities-suggest-btn" @click=${enableSuggested}>
          <ha-icon icon="mdi:auto-fix"></ha-icon>
          ${t('onboarding.entities.enableSuggested', 'Enable Suggested')}
        </button>
      </div>

      <!-- Summary -->
      <div class="dv-entities-summary">
        <div class="dv-entities-stat">
          <div class="dv-entities-stat-value">${selectedCount}</div>
          <div class="dv-entities-stat-label">${t('onboarding.entities.selected', 'Selected')}</div>
        </div>
        <div class="dv-entities-stat">
          <div class="dv-entities-stat-value">${totalEntities}</div>
          <div class="dv-entities-stat-label">${t('onboarding.entities.total', 'Total')}</div>
        </div>
        <div class="dv-entities-stat">
          <div class="dv-entities-stat-value">${rooms.length}</div>
          <div class="dv-entities-stat-label">${t('onboarding.entities.rooms', 'Rooms')}</div>
        </div>
      </div>

      <!-- Room List -->
      <div class="dv-entities-rooms">
        ${rooms.length === 0 ? html`
          <div class="dv-entities-empty">
            <ha-icon icon="mdi:magnify"></ha-icon>
            <p>${t('onboarding.entities.noResults', 'No entities found matching your search.')}</p>
          </div>
        ` : rooms.map(room => {
          const isExpanded = state.expanded[room.id];
          const roomSelected = room.entities.filter(e => state.selected[e.entityId]).length;
          const allSelected = roomSelected === room.entities.length;

          return html`
            <div class="dv-entities-room">
              <div class="dv-entities-room-header" @click=${() => toggleRoom(room.id)}>
                <div class="dv-entities-room-icon">
                  <ha-icon icon="${getAreaIcon(room)}"></ha-icon>
                </div>
                <span class="dv-entities-room-name">${room.name}</span>
                <span class="dv-entities-room-count ${allSelected ? 'all-selected' : ''}">
                  ${roomSelected}/${room.entities.length}
                </span>
                <ha-icon
                  class="dv-entities-room-chevron ${isExpanded ? 'expanded' : ''}"
                  icon="mdi:chevron-down"
                ></ha-icon>
              </div>

              <div class="dv-entities-list ${isExpanded ? 'expanded' : ''}">
                <div class="dv-entities-bulk-actions">
                  <button class="dv-entities-bulk-btn" @click=${() => selectAllInRoom(room)}>
                    ${t('admin.entities.selectAll', 'All')}
                  </button>
                  <button class="dv-entities-bulk-btn" @click=${() => deselectAllInRoom(room)}>
                    ${t('admin.entities.selectNone', 'None')}
                  </button>
                </div>

                ${room.entities.map(entity => {
                  const isSelected = state.selected[entity.entityId];
                  return html`
                    <div
                      class="dv-entity-item ${isSelected ? 'selected' : ''} ${entity.suggested ? 'suggested' : ''}"
                      @click=${() => toggleEntity(entity.entityId)}
                    >
                      <div class="dv-entity-checkbox">
                        <ha-icon icon="mdi:check"></ha-icon>
                      </div>
                      <div class="dv-entity-icon">
                        <ha-icon icon="${getDomainIcon(entity.domain)}"></ha-icon>
                      </div>
                      <div class="dv-entity-info">
                        <div class="dv-entity-name">${entity.friendlyName}</div>
                        <div class="dv-entity-id">${entity.entityId}</div>
                      </div>
                      ${entity.suggested ? html`
                        <span class="dv-entity-badge">${t('onboarding.entities.suggested', 'Suggested')}</span>
                      ` : ''}
                    </div>
                  `;
                })}
              </div>
            </div>
          `;
        })}
      </div>
    </div>
  `;
}

export default renderEntitiesStep;
