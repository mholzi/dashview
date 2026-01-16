/**
 * Rooms Step Component
 * Third step in the setup wizard - assign areas to floors
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';

/**
 * Rooms step styles
 */
export const roomsStepStyles = `
  /* ==================== ROOMS STEP ==================== */
  .dv-rooms-step {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-rooms-header {
    text-align: center;
  }

  .dv-rooms-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-rooms-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== FLOOR GROUPS ==================== */
  .dv-rooms-floor-groups {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .dv-rooms-floor-group {
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    overflow: hidden;
  }

  .dv-rooms-floor-header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-bottom: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-rooms-floor-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-rooms-floor-icon ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-rooms-floor-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    flex: 1;
  }

  .dv-rooms-floor-count {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    background: var(--dv-bg-secondary, var(--card-background-color));
    padding: 4px 10px;
    border-radius: 12px;
  }

  /* ==================== AREA LIST ==================== */
  .dv-rooms-area-list {
    display: flex;
    flex-direction: column;
  }

  .dv-rooms-area-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid var(--dv-border, var(--divider-color));
    transition: background 0.2s ease;
  }

  .dv-rooms-area-item:last-child {
    border-bottom: none;
  }

  .dv-rooms-area-item:hover {
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
  }

  .dv-rooms-area-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-rooms-area-icon ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-rooms-area-name {
    flex: 1;
    font-size: 14px;
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-rooms-area-floor-select {
    min-width: 140px;
    padding: 8px 12px;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 8px;
    font-size: 13px;
    background: var(--dv-bg-primary, var(--primary-background-color));
    color: var(--dv-text-primary, var(--primary-text-color));
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .dv-rooms-area-floor-select:focus {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-rooms-area-floor-select:hover {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  /* ==================== UNASSIGNED SECTION ==================== */
  .dv-rooms-unassigned {
    background: var(--dv-warning-subtle, rgba(var(--rgb-warning-color), 0.1));
    border: 1px solid var(--dv-warning, var(--warning-color));
  }

  .dv-rooms-unassigned .dv-rooms-floor-header {
    background: var(--dv-warning-subtle, rgba(var(--rgb-warning-color), 0.1));
    border-color: var(--dv-warning, var(--warning-color));
  }

  .dv-rooms-unassigned .dv-rooms-floor-icon {
    background: var(--dv-warning-subtle, rgba(var(--rgb-warning-color), 0.2));
  }

  .dv-rooms-unassigned .dv-rooms-floor-icon ha-icon {
    color: var(--dv-warning, var(--warning-color));
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-rooms-empty {
    text-align: center;
    padding: 32px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 2px dashed var(--dv-border, var(--divider-color));
    border-radius: 12px;
  }

  .dv-rooms-empty-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-bottom: 12px;
  }

  .dv-rooms-empty-text {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }
`;

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
  if (name.includes('laundry') || name.includes('wasch')) return 'mdi:washing-machine';
  if (name.includes('basement') || name.includes('keller')) return 'mdi:stairs-down';
  if (name.includes('attic') || name.includes('dach')) return 'mdi:home-roof';
  if (name.includes('toilet') || name.includes('wc')) return 'mdi:toilet';
  if (name.includes('storage') || name.includes('abstellraum')) return 'mdi:package-variant';
  if (name.includes('child') || name.includes('kinder')) return 'mdi:teddy-bear';
  if (name.includes('guest') || name.includes('gäste')) return 'mdi:account-multiple';

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
  if (name.includes('attic') || name.includes('dach') || name.includes('3')) return 'mdi:home-floor-3';

  return 'mdi:home-floor-0';
}

/**
 * Render the rooms step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderRoomsStep(panel, html) {
  // Get floors and areas from Home Assistant
  const floors = panel._floors || [];
  const areas = panel._areas || [];

  // Get settings store for room order
  const settings = getSettingsStore();

  // Group areas by floor
  const areasByFloor = new Map();
  const unassignedAreas = [];

  floors.forEach(floor => {
    areasByFloor.set(floor.floor_id, []);
  });

  areas.forEach(area => {
    if (area.floor_id && areasByFloor.has(area.floor_id)) {
      areasByFloor.get(area.floor_id).push(area);
    } else {
      unassignedAreas.push(area);
    }
  });

  // Handle floor assignment change
  const handleFloorChange = async (area, newFloorId) => {
    if (!panel.hass) return;

    try {
      // Call Home Assistant to update area's floor assignment
      await panel.hass.callWS({
        type: 'config/area_registry/update',
        area_id: area.area_id,
        floor_id: newFloorId || null
      });

      // Refresh areas
      const updatedAreas = await panel.hass.callWS({
        type: 'config/area_registry/list'
      });
      panel._areas = updatedAreas;
      panel.requestUpdate();
    } catch (e) {
      console.error('Failed to update area floor:', e);
    }
  };

  // Render a single area item
  const renderAreaItem = (area) => html`
    <div class="dv-rooms-area-item">
      <div class="dv-rooms-area-icon">
        <ha-icon icon="${area.icon || getAreaIcon(area)}"></ha-icon>
      </div>
      <span class="dv-rooms-area-name">${area.name || area.area_id}</span>
      <select
        class="dv-rooms-area-floor-select"
        .value=${area.floor_id || ''}
        @change=${(e) => handleFloorChange(area, e.target.value)}
      >
        <option value="">${t('onboarding.rooms.unassigned', 'Unassigned')}</option>
        ${floors.map(floor => html`
          <option value="${floor.floor_id}" ?selected=${area.floor_id === floor.floor_id}>
            ${floor.name || floor.floor_id}
          </option>
        `)}
      </select>
    </div>
  `;

  return html`
    <style>${roomsStepStyles}</style>
    <div class="dv-rooms-step">
      <div class="dv-rooms-header">
        <h2 class="dv-rooms-title">
          ${t('onboarding.rooms.title', 'Assign Rooms to Floors')}
        </h2>
        <p class="dv-rooms-desc">
          ${t('onboarding.rooms.desc', 'Assign each room (area) to a floor. Use the dropdown to change assignments.')}
        </p>
      </div>

      ${areas.length === 0 ? html`
        <div class="dv-rooms-empty">
          <ha-icon class="dv-rooms-empty-icon" icon="mdi:home-group"></ha-icon>
          <p class="dv-rooms-empty-text">
            ${t('onboarding.rooms.empty', 'No areas found in Home Assistant. Create areas in Settings → Areas & Zones.')}
          </p>
        </div>
      ` : html`
        <div class="dv-rooms-floor-groups">
          ${unassignedAreas.length > 0 ? html`
            <div class="dv-rooms-floor-group dv-rooms-unassigned">
              <div class="dv-rooms-floor-header">
                <div class="dv-rooms-floor-icon">
                  <ha-icon icon="mdi:alert-circle"></ha-icon>
                </div>
                <span class="dv-rooms-floor-name">
                  ${t('onboarding.rooms.unassignedFloor', 'Unassigned Rooms')}
                </span>
                <span class="dv-rooms-floor-count">
                  ${unassignedAreas.length} ${t('onboarding.rooms.rooms', 'rooms')}
                </span>
              </div>
              <div class="dv-rooms-area-list">
                ${unassignedAreas.map(area => renderAreaItem(area))}
              </div>
            </div>
          ` : ''}

          ${floors.map(floor => {
            const floorAreas = areasByFloor.get(floor.floor_id) || [];
            if (floorAreas.length === 0 && unassignedAreas.length > 0) {
              // Don't show empty floors when there are unassigned areas to highlight
              return '';
            }
            return html`
              <div class="dv-rooms-floor-group">
                <div class="dv-rooms-floor-header">
                  <div class="dv-rooms-floor-icon">
                    <ha-icon icon="${floor.icon || getFloorIcon(floor)}"></ha-icon>
                  </div>
                  <span class="dv-rooms-floor-name">${floor.name || floor.floor_id}</span>
                  <span class="dv-rooms-floor-count">
                    ${floorAreas.length} ${t('onboarding.rooms.rooms', 'rooms')}
                  </span>
                </div>
                <div class="dv-rooms-area-list">
                  ${floorAreas.length > 0
                    ? floorAreas.map(area => renderAreaItem(area))
                    : html`
                      <div class="dv-rooms-area-item" style="justify-content: center; color: var(--secondary-text-color);">
                        ${t('onboarding.rooms.noRooms', 'No rooms assigned to this floor')}
                      </div>
                    `
                  }
                </div>
              </div>
            `;
          })}
        </div>
      `}

      <p style="font-size: 12px; color: var(--secondary-text-color); text-align: center; margin-top: auto;">
        ${t('onboarding.rooms.hint', 'Tip: You can also manage areas in Home Assistant under Settings → Areas & Zones')}
      </p>
    </div>
  `;
}

export default renderRoomsStep;
