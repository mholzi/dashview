/**
 * Room Config Step Component
 * Fifth step in the setup wizard - configure rooms and entities for the dashboard
 *
 * This step mirrors the Admin → Entities tab functionality, allowing users to:
 * - Enable/disable rooms
 * - Expand rooms to see entity categories
 * - Enable/disable individual entities within each category
 * - Search for rooms and entities
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';
import { renderAreaCard } from '../../index.js';
import { getFloorIcon } from '../../../../utils/index.js';

/**
 * Room config step styles - matches admin entities tab
 */
export const entitiesStepStyles = `
  /* ==================== ROOM CONFIG STEP ==================== */
  .dv-room-config-step {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-room-config-header {
    text-align: center;
  }

  .dv-room-config-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin: 0 0 8px 0;
  }

  .dv-room-config-desc {
    font-size: 14px;
    color: var(--dv-gray600);
    margin: 0;
  }

  /* ==================== SEARCH ==================== */
  .dv-room-config-search {
    margin-bottom: 8px;
  }

  .dv-room-config-search .garbage-search-input-wrapper {
    display: flex;
    align-items: center;
    background: var(--dv-gray100);
    border-radius: 10px;
    padding: 0 12px;
    border: 1px solid var(--dv-gray300);
    transition: border-color 0.2s ease;
  }

  .dv-room-config-search .garbage-search-input-wrapper:focus-within {
    border-color: var(--dv-blue);
  }

  .dv-room-config-search .garbage-search-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-gray500);
    margin-right: 8px;
  }

  .dv-room-config-search .garbage-search-input {
    flex: 1;
    border: none;
    background: transparent;
    padding: 12px 0;
    font-size: 14px;
    color: var(--dv-gray800);
    outline: none;
  }

  .dv-room-config-search .garbage-search-input::placeholder {
    color: var(--dv-gray500);
  }

  .dv-room-config-search .garbage-search-clear {
    --mdc-icon-size: 18px;
    color: var(--dv-gray500);
    cursor: pointer;
    padding: 4px;
  }

  .dv-room-config-search .garbage-search-clear:hover {
    color: var(--dv-gray700);
  }

  /* ==================== FLOOR GROUPS ==================== */
  .dv-room-config-floors {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .dv-room-config-floor-header {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-gray600);
    margin-bottom: 8px;
    padding-left: 4px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .dv-room-config-floor-header ha-icon {
    --mdc-icon-size: 18px;
  }

  .dv-room-config-floor-header .floor-count {
    font-weight: 400;
    opacity: 0.7;
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-room-config-empty {
    text-align: center;
    padding: 32px;
    background: var(--dv-gray000);
    border: 2px dashed var(--dv-gray300);
    border-radius: 12px;
  }

  .dv-room-config-empty-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-gray500);
    margin-bottom: 12px;
  }

  .dv-room-config-empty-text {
    font-size: 14px;
    color: var(--dv-gray600);
    margin: 0;
  }

  /* ==================== HINT ==================== */
  .dv-room-config-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-gray000);
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-gray600);
  }

  .dv-room-config-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-blue);
    flex-shrink: 0;
  }
`;

/**
 * Suggested domains for counting
 */
export const SUGGESTED_DOMAINS = ['light', 'climate', 'cover', 'switch', 'fan'];

/**
 * Render the room config step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderEntitiesStep(panel, html) {
  // Initialize search state if not exists
  if (!panel._wizardEntitySearchQuery) {
    panel._wizardEntitySearchQuery = '';
  }

  // Get ordered floors and areas
  const orderedFloors = panel._getOrderedFloors ? panel._getOrderedFloors() : (panel._floors || []);
  const areas = panel._areas || [];

  // Filter rooms based on search query
  const searchQuery = panel._wizardEntitySearchQuery ? panel._wizardEntitySearchQuery.toLowerCase() : '';
  const filterRooms = (rooms) => {
    if (!searchQuery) return rooms;
    return rooms.filter(room => room.name.toLowerCase().includes(searchQuery));
  };

  // Get rooms for a floor
  const getRoomsForFloor = (floorId) => {
    if (panel._getOrderedRoomsForFloor) {
      return panel._getOrderedRoomsForFloor(floorId);
    }
    return areas.filter(a => a.floor_id === floorId);
  };

  // Calculate totals
  let totalRooms = 0;
  let enabledRooms = 0;
  areas.forEach(area => {
    totalRooms++;
    if (panel._enabledRooms[area.area_id] !== false) enabledRooms++;
  });

  return html`
    <style>${entitiesStepStyles}</style>
    <div class="dv-room-config-step">
      <div class="dv-room-config-header">
        <h2 class="dv-room-config-title">
          ${t('wizard.roomConfig.title', 'Configure Your Rooms')}
        </h2>
        <p class="dv-room-config-desc">
          ${t('wizard.roomConfig.description', 'Enable or disable rooms to show on your dashboard.')}
        </p>
      </div>

      ${areas.length === 0 ? html`
        <div class="dv-room-config-empty">
          <ha-icon class="dv-room-config-empty-icon" icon="mdi:home-group"></ha-icon>
          <p class="dv-room-config-empty-text">
            ${t('wizard.roomConfig.empty', 'No areas found in Home Assistant. Create areas in Settings → Areas & Zones.')}
          </p>
        </div>
      ` : html`
        <!-- Search -->
        <div class="dv-room-config-search">
          <div class="garbage-search-input-wrapper">
            <ha-icon icon="mdi:magnify" class="garbage-search-icon"></ha-icon>
            <input
              type="text"
              class="garbage-search-input"
              placeholder="${t('admin.entities.searchRooms', 'Search rooms...')}"
              .value=${panel._wizardEntitySearchQuery || ''}
              @input=${(e) => {
                panel._wizardEntitySearchQuery = e.target.value;
                panel.requestUpdate();
              }}
            />
            ${panel._wizardEntitySearchQuery ? html`
              <ha-icon
                icon="mdi:close"
                class="garbage-search-clear"
                @click=${() => {
                  panel._wizardEntitySearchQuery = '';
                  panel.requestUpdate();
                }}
              ></ha-icon>
            ` : ''}
          </div>
        </div>

        <!-- Room List by Floor -->
        <div class="dv-room-config-floors">
          ${orderedFloors.map(floor => {
            const roomsForFloor = filterRooms(getRoomsForFloor(floor.floor_id));
            if (roomsForFloor.length === 0) return '';
            return html`
              <div style="margin-bottom: 8px;">
                <div class="dv-room-config-floor-header">
                  <ha-icon icon="${floor.icon || getFloorIcon(floor)}"></ha-icon>
                  ${floor.name}
                  <span class="floor-count">(${roomsForFloor.length} rooms)</span>
                </div>
                ${roomsForFloor.map((area) => renderAreaCard(panel, html, area))}
              </div>
            `;
          })}

          <!-- Unassigned rooms -->
          ${(() => {
            const unassignedRooms = filterRooms(getRoomsForFloor(null));
            if (unassignedRooms.length === 0) return '';
            return html`
              <div style="margin-bottom: 8px;">
                <div class="dv-room-config-floor-header">
                  <ha-icon icon="mdi:help-circle-outline"></ha-icon>
                  ${t('admin.entities.unassignedRooms', 'Unassigned Rooms')}
                  <span class="floor-count">(${unassignedRooms.length} rooms)</span>
                </div>
                ${unassignedRooms.map((area) => renderAreaCard(panel, html, area))}
              </div>
            `;
          })()}
        </div>
      `}

      <div style="flex: 1;"></div>

      <!-- Hint -->
      <div class="dv-room-config-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <span>${t('wizard.roomConfig.hint', 'Tip: Click a room to expand and configure individual entities. Changes are saved automatically.')}</span>
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
  return panel._enabledRooms || {};
}

/**
 * Save room config to settings store
 * @param {Object} enabledRooms - Map of areaId to enabled boolean
 * @param {Object} settingsStore - Settings store instance
 * @param {Object} panel - Panel instance
 */
export function saveEntitySelections(enabledRooms, settingsStore, panel) {
  try {
    // Save directly to enabledRooms (flat format: { areaId: boolean })
    settingsStore.set('enabledRooms', { ...enabledRooms });
  } catch (e) {
    console.warn('[Dashview] Failed to save room config:', e);
  }
}

export default renderEntitiesStep;
