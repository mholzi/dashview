/**
 * Room Config Step Component
 * Fifth step in the setup wizard - enable/disable rooms for the dashboard
 *
 * This step allows users to toggle which rooms appear on the dashboard.
 * Entity-level configuration is handled in the Admin panel.
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';

/**
 * Room config step styles
 */
export const entitiesStepStyles = `
  /* ==================== ROOM CONFIG STEP ==================== */
  .dv-room-config-step {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-room-config-header {
    text-align: center;
  }

  .dv-room-config-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-room-config-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== SUMMARY ==================== */
  .dv-room-config-summary {
    display: flex;
    justify-content: center;
    gap: 24px;
    padding: 16px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border-radius: 12px;
    border: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-room-config-stat {
    text-align: center;
  }

  .dv-room-config-stat-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-room-config-stat-label {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  /* ==================== FLOOR GROUPS ==================== */
  .dv-room-config-floors {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-height: 350px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .dv-room-config-floor-group {
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    overflow: hidden;
  }

  .dv-room-config-floor-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-bottom: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-room-config-floor-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-room-config-floor-icon ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-room-config-floor-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    flex: 1;
  }

  .dv-room-config-floor-toggle-all {
    display: flex;
    gap: 8px;
  }

  .dv-room-config-toggle-btn {
    padding: 4px 10px;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 6px;
    background: transparent;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    font-size: 11px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dv-room-config-toggle-btn:hover {
    background: var(--dv-bg-tertiary, var(--divider-color));
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  /* ==================== ROOM LIST ==================== */
  .dv-room-config-room-list {
    display: flex;
    flex-direction: column;
  }

  .dv-room-config-room-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--dv-border, var(--divider-color));
    cursor: pointer;
    transition: background 0.2s ease;
  }

  .dv-room-config-room-item:last-child {
    border-bottom: none;
  }

  .dv-room-config-room-item:hover {
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
  }

  .dv-room-config-room-item.enabled {
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.05));
  }

  .dv-room-config-checkbox {
    width: 22px;
    height: 22px;
    border: 2px solid var(--dv-border, var(--divider-color));
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s ease;
  }

  .dv-room-config-room-item.enabled .dv-room-config-checkbox {
    background: var(--dv-accent-primary, var(--primary-color));
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-room-config-checkbox ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-text-on-accent, #fff);
    opacity: 0;
    transition: opacity 0.2s ease;
  }

  .dv-room-config-room-item.enabled .dv-room-config-checkbox ha-icon {
    opacity: 1;
  }

  .dv-room-config-room-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-room-config-room-icon ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-room-config-room-item.enabled .dv-room-config-room-icon {
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
  }

  .dv-room-config-room-item.enabled .dv-room-config-room-icon ha-icon {
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-room-config-room-info {
    flex: 1;
    min-width: 0;
  }

  .dv-room-config-room-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-text-primary, var(--primary-text-color));
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dv-room-config-room-entities {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-room-config-empty {
    text-align: center;
    padding: 32px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 2px dashed var(--dv-border, var(--divider-color));
    border-radius: 12px;
  }

  .dv-room-config-empty-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-bottom: 12px;
  }

  .dv-room-config-empty-text {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== HINT ==================== */
  .dv-room-config-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-room-config-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-accent-primary, var(--primary-color));
    flex-shrink: 0;
  }
`;

/**
 * Suggested domains for counting
 */
export const SUGGESTED_DOMAINS = ['light', 'climate', 'cover', 'switch', 'fan'];

/**
 * Get area icon based on area name
 * @param {Object} area - Area object
 * @returns {string} MDI icon name
 */
function getAreaIcon(area) {
  const name = (area.name || area.area_id || '').toLowerCase();

  if (name.includes('kitchen') || name.includes('küche')) return 'mdi:countertop';
  if (name.includes('living') || name.includes('wohnzimmer')) return 'mdi:sofa';
  if (name.includes('bedroom') || name.includes('schlafzimmer')) return 'mdi:bed';
  if (name.includes('bathroom') || name.includes('bad')) return 'mdi:shower';
  if (name.includes('office') || name.includes('büro') || name.includes('arbeit')) return 'mdi:desk';
  if (name.includes('garage')) return 'mdi:garage';
  if (name.includes('garden') || name.includes('garten')) return 'mdi:flower';
  if (name.includes('hall') || name.includes('flur')) return 'mdi:door';
  if (name.includes('dining') || name.includes('ess')) return 'mdi:silverware-fork-knife';

  return 'mdi:door';
}

/**
 * Get floor icon based on floor name
 * @param {Object} floor - Floor object
 * @returns {string} MDI icon name
 */
function getFloorIcon(floor) {
  const name = (floor.name || floor.floor_id || '').toLowerCase();

  if (name.includes('basement') || name.includes('keller')) return 'mdi:home-floor-negative-1';
  if (name.includes('ground') || name.includes('erdgeschoss') || name.includes('eg')) return 'mdi:home-floor-0';
  if (name.includes('first') || name.includes('obergeschoss') || name.includes('og') || name.includes('1')) return 'mdi:home-floor-1';
  if (name.includes('second') || name.includes('2')) return 'mdi:home-floor-2';

  return 'mdi:home-floor-0';
}

/**
 * Render the room config step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderEntitiesStep(panel, html) {
  // Initialize wizard room config state if not exists
  if (!panel._wizardRoomConfigState) {
    panel._wizardRoomConfigState = {
      enabledRooms: {}
    };

    // Default: enable all rooms that have entities with suggested labels
    const areas = panel._areas || [];
    areas.forEach(area => {
      // Enable all rooms by default
      panel._wizardRoomConfigState.enabledRooms[area.area_id] = true;
    });
  }

  const state = panel._wizardRoomConfigState;
  const settings = getSettingsStore();

  // Get floors and areas
  const floors = panel._floors || [];
  const areas = panel._areas || [];

  // Count entities per room (using entity registry)
  const getEntityCount = (areaId) => {
    const entityRegistry = panel._entityRegistry || [];
    return entityRegistry.filter(e => e.area_id === areaId && !e.hidden_by).length;
  };

  // Group areas by floor
  const getAreasForFloor = (floorId) => {
    return areas.filter(a => a.floor_id === floorId);
  };

  // Toggle room
  const toggleRoom = (areaId) => {
    state.enabledRooms[areaId] = !state.enabledRooms[areaId];
    panel.requestUpdate();
  };

  // Enable all rooms on floor
  const enableAllOnFloor = (floorId) => {
    const floorAreas = getAreasForFloor(floorId);
    floorAreas.forEach(area => {
      state.enabledRooms[area.area_id] = true;
    });
    panel.requestUpdate();
  };

  // Disable all rooms on floor
  const disableAllOnFloor = (floorId) => {
    const floorAreas = getAreasForFloor(floorId);
    floorAreas.forEach(area => {
      state.enabledRooms[area.area_id] = false;
    });
    panel.requestUpdate();
  };

  // Count enabled rooms
  const enabledCount = Object.values(state.enabledRooms).filter(v => v).length;
  const totalRooms = areas.length;

  return html`
    <style>${entitiesStepStyles}</style>
    <div class="dv-room-config-step">
      <div class="dv-room-config-header">
        <h2 class="dv-room-config-title">
          ${t('wizard.roomConfig.title', 'Enable Your Rooms')}
        </h2>
        <p class="dv-room-config-desc">
          ${t('wizard.roomConfig.description', 'Choose which rooms appear on your dashboard. You can enable or disable rooms and configure entities in the Admin panel later.')}
        </p>
      </div>

      <!-- Summary -->
      <div class="dv-room-config-summary">
        <div class="dv-room-config-stat">
          <div class="dv-room-config-stat-value">${enabledCount}</div>
          <div class="dv-room-config-stat-label">${t('wizard.roomConfig.enabled', 'Enabled')}</div>
        </div>
        <div class="dv-room-config-stat">
          <div class="dv-room-config-stat-value">${totalRooms}</div>
          <div class="dv-room-config-stat-label">${t('wizard.roomConfig.total', 'Total')}</div>
        </div>
        <div class="dv-room-config-stat">
          <div class="dv-room-config-stat-value">${floors.length}</div>
          <div class="dv-room-config-stat-label">${t('wizard.roomConfig.floors', 'Floors')}</div>
        </div>
      </div>

      ${areas.length === 0 ? html`
        <div class="dv-room-config-empty">
          <ha-icon class="dv-room-config-empty-icon" icon="mdi:home-group"></ha-icon>
          <p class="dv-room-config-empty-text">
            ${t('wizard.roomConfig.empty', 'No areas found in Home Assistant. Create areas in Settings → Areas & Zones.')}
          </p>
        </div>
      ` : html`
        <div class="dv-room-config-floors">
          ${floors.map(floor => {
            const floorAreas = getAreasForFloor(floor.floor_id);
            if (floorAreas.length === 0) return '';

            return html`
              <div class="dv-room-config-floor-group">
                <div class="dv-room-config-floor-header">
                  <div class="dv-room-config-floor-icon">
                    <ha-icon icon="${floor.icon || getFloorIcon(floor)}"></ha-icon>
                  </div>
                  <span class="dv-room-config-floor-name">${floor.name || floor.floor_id}</span>
                  <div class="dv-room-config-floor-toggle-all">
                    <button
                      class="dv-room-config-toggle-btn"
                      @click=${(e) => { e.stopPropagation(); enableAllOnFloor(floor.floor_id); }}
                    >
                      ${t('admin.entities.selectAll', 'All')}
                    </button>
                    <button
                      class="dv-room-config-toggle-btn"
                      @click=${(e) => { e.stopPropagation(); disableAllOnFloor(floor.floor_id); }}
                    >
                      ${t('admin.entities.selectNone', 'None')}
                    </button>
                  </div>
                </div>
                <div class="dv-room-config-room-list">
                  ${floorAreas.map(area => {
                    const isEnabled = state.enabledRooms[area.area_id] === true;
                    const entityCount = getEntityCount(area.area_id);

                    return html`
                      <div
                        class="dv-room-config-room-item ${isEnabled ? 'enabled' : ''}"
                        @click=${() => toggleRoom(area.area_id)}
                      >
                        <div class="dv-room-config-checkbox">
                          <ha-icon icon="mdi:check"></ha-icon>
                        </div>
                        <div class="dv-room-config-room-icon">
                          <ha-icon icon="${area.icon || getAreaIcon(area)}"></ha-icon>
                        </div>
                        <div class="dv-room-config-room-info">
                          <div class="dv-room-config-room-name">${area.name || area.area_id}</div>
                          <div class="dv-room-config-room-entities">
                            ${entityCount} ${t('wizard.roomConfig.entities', 'entities')}
                          </div>
                        </div>
                      </div>
                    `;
                  })}
                </div>
              </div>
            `;
          })}
        </div>
      `}

      <div style="flex: 1;"></div>

      <!-- Hint -->
      <div class="dv-room-config-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <span>${t('wizard.roomConfig.hint', 'Tip: Configure individual entities for each room in the Admin panel after setup')}</span>
      </div>
    </div>
  `;
}

/**
 * Get room config from wizard state
 * @param {Object} panel - Panel instance
 * @returns {Object} Room configuration
 */
export function getEntitySelections(panel) {
  return panel._wizardRoomConfigState?.enabledRooms || {};
}

/**
 * Save room config to settings store
 * @param {Object} enabledRooms - Map of areaId to enabled boolean
 * @param {Object} settingsStore - Settings store instance
 * @param {Object} panel - Panel instance
 */
export function saveEntitySelections(enabledRooms, settingsStore, panel) {
  try {
    const settings = settingsStore.settings || {};
    const roomConfig = { ...(settings.roomConfig || {}) };

    // Update enabled status for each room
    Object.entries(enabledRooms).forEach(([areaId, isEnabled]) => {
      if (!roomConfig[areaId]) {
        roomConfig[areaId] = { enabled: isEnabled, entities: {} };
      } else {
        roomConfig[areaId].enabled = isEnabled;
      }
    });

    settingsStore.updateSettings({ ...settings, roomConfig });
  } catch (e) {
    console.warn('[Dashview] Failed to save room config:', e);
  }
}

export default renderEntitiesStep;
