/**
 * Room Order Step Component
 * Third step in the setup wizard - reorder rooms within each floor
 *
 * This step allows users to arrange the display order of rooms (areas)
 * within each floor. Room creation/assignment is handled in HA settings.
 *
 * Uses the same layout as Admin → Layout → Room Order section.
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';
import { orderStyles } from '../../../../styles/admin/order.js';

/**
 * Rooms step styles - extends admin order styles with wizard-specific additions
 */
export const roomsStepStyles = `
  ${orderStyles}

  /* ==================== WIZARD ROOMS STEP ==================== */
  .dv-rooms-step {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-rooms-header {
    text-align: center;
  }

  .dv-rooms-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin: 0 0 8px 0;
  }

  .dv-rooms-desc {
    font-size: 14px;
    color: var(--dv-gray600);
    margin: 0;
  }

  /* ==================== FLOOR GROUPS CONTAINER ==================== */
  .dv-rooms-floor-groups {
    display: flex;
    flex-direction: column;
    gap: 0;
    flex: 1;
    min-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
  }

  /* ==================== EMPTY STATES ==================== */
  .dv-rooms-empty {
    text-align: center;
    padding: 32px;
    background: var(--dv-gray000);
    border: 2px dashed var(--dv-gray300);
    border-radius: 12px;
  }

  .dv-rooms-empty-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-gray500);
    margin-bottom: 12px;
  }

  .dv-rooms-empty-text {
    font-size: 14px;
    color: var(--dv-gray600);
    margin: 0;
  }

  /* ==================== HINT ==================== */
  .dv-rooms-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-gray000);
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-gray600);
  }

  .dv-rooms-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-blue);
    flex-shrink: 0;
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
  // Initialize wizard room state if not exists
  if (!panel._wizardRoomState) {
    panel._wizardRoomState = {
      draggedAreaId: null,
      draggedFromFloor: null
    };
  }

  const state = panel._wizardRoomState;

  // Get floors and areas from Home Assistant
  const floors = panel._floors || [];
  const areas = panel._areas || [];

  // Get settings store for room order
  const settings = getSettingsStore();

  // Group areas by floor and apply saved order
  const getOrderedAreasForFloor = (floorId) => {
    const floorAreas = areas.filter(a => a.floor_id === floorId);
    const roomOrder = settings.get('roomOrder') || {};
    const savedOrder = roomOrder[floorId] || [];

    // Sort by saved order, then alphabetically for unsaved
    const orderedAreas = [];
    const seenIds = new Set();

    savedOrder.forEach(areaId => {
      const area = floorAreas.find(a => a.area_id === areaId);
      if (area && !seenIds.has(areaId)) {
        orderedAreas.push(area);
        seenIds.add(areaId);
      }
    });

    floorAreas.forEach(area => {
      if (!seenIds.has(area.area_id)) {
        orderedAreas.push(area);
        seenIds.add(area.area_id);
      }
    });

    return orderedAreas;
  };

  // Move room up within floor
  const moveUp = (floorId, areaId, currentIndex) => {
    if (currentIndex <= 0) return;
    const floorAreas = getOrderedAreasForFloor(floorId);
    const currentOrder = floorAreas.map(a => a.area_id);
    [currentOrder[currentIndex - 1], currentOrder[currentIndex]] = [currentOrder[currentIndex], currentOrder[currentIndex - 1]];
    // Save to nested roomOrder object
    const roomOrder = { ...(settings.get('roomOrder') || {}) };
    roomOrder[floorId] = currentOrder;
    settings.set('roomOrder', roomOrder);
    panel.requestUpdate();
  };

  // Move room down within floor
  const moveDown = (floorId, areaId, currentIndex, totalAreas) => {
    if (currentIndex >= totalAreas - 1) return;
    const floorAreas = getOrderedAreasForFloor(floorId);
    const currentOrder = floorAreas.map(a => a.area_id);
    [currentOrder[currentIndex], currentOrder[currentIndex + 1]] = [currentOrder[currentIndex + 1], currentOrder[currentIndex]];
    // Save to nested roomOrder object
    const roomOrder = { ...(settings.get('roomOrder') || {}) };
    roomOrder[floorId] = currentOrder;
    settings.set('roomOrder', roomOrder);
    panel.requestUpdate();
  };

  // Handle drag start
  const handleDragStart = (e, areaId, floorId) => {
    state.draggedAreaId = areaId;
    state.draggedFromFloor = floorId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', areaId);
    e.currentTarget.classList.add('sortable-chosen');
    setTimeout(() => panel.requestUpdate(), 0);
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    state.draggedAreaId = null;
    state.draggedFromFloor = null;
    e.currentTarget.classList.remove('sortable-chosen');
    panel.requestUpdate();
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, targetAreaId, floorId) => {
    e.preventDefault();

    const draggedId = state.draggedAreaId;
    const fromFloor = state.draggedFromFloor;

    // Only allow reordering within same floor
    if (!draggedId || draggedId === targetAreaId || fromFloor !== floorId) {
      state.draggedAreaId = null;
      state.draggedFromFloor = null;
      panel.requestUpdate();
      return;
    }

    const floorAreas = getOrderedAreasForFloor(floorId);
    const currentOrder = floorAreas.map(a => a.area_id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetAreaId);

    if (draggedIndex === -1 || targetIndex === -1) {
      state.draggedAreaId = null;
      state.draggedFromFloor = null;
      panel.requestUpdate();
      return;
    }

    // Remove dragged item and insert at target position
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedId);

    // Save new order to nested roomOrder object
    const roomOrder = { ...(settings.get('roomOrder') || {}) };
    roomOrder[floorId] = currentOrder;
    settings.set('roomOrder', roomOrder);
    state.draggedAreaId = null;
    state.draggedFromFloor = null;
    panel.requestUpdate();
  };

  // Get unassigned areas
  const unassignedAreas = areas.filter(a => !a.floor_id);

  return html`
    <style>${roomsStepStyles}</style>
    <div class="dv-rooms-step">
      <div class="dv-rooms-header">
        <h2 class="dv-rooms-title">
          ${t('wizard.roomOrder.title', 'Arrange Your Rooms')}
        </h2>
        <p class="dv-rooms-desc">
          ${t('wizard.roomOrder.description', 'Drag to reorder rooms within each floor. This determines the display order in room views.')}
        </p>
      </div>

      ${areas.length === 0 ? html`
        <div class="dv-rooms-empty">
          <ha-icon class="dv-rooms-empty-icon" icon="mdi:home-group"></ha-icon>
          <p class="dv-rooms-empty-text">
            ${t('wizard.roomOrder.empty', 'No areas found in Home Assistant. Create areas in Settings → Areas & Zones.')}
          </p>
        </div>
      ` : html`
        <div class="dv-rooms-floor-groups">
          ${floors.map(floor => {
            const floorAreas = getOrderedAreasForFloor(floor.floor_id);
            return html`
              <div class="order-floor-section">
                <div class="order-floor-header">
                  <ha-icon icon="${floor.icon || getFloorIcon(floor)}"></ha-icon>
                  <span class="order-floor-name">${floor.name || floor.floor_id}</span>
                  <span style="opacity: 0.8; font-size: 13px;">
                    ${floorAreas.length} ${t('wizard.roomOrder.rooms', 'rooms')}
                  </span>
                </div>

                ${floorAreas.length === 0 ? html`
                  <p style="color: var(--dv-gray600); padding: 12px 0 0 36px; font-size: 14px;">
                    ${t('wizard.roomOrder.noRooms', 'No rooms assigned to this floor')}
                  </p>
                ` : html`
                  <div class="order-rooms-list">
                    <div class="order-list">
                      ${floorAreas.map((area, index) => html`
                        <div
                          class="order-item sortable-item ${state.draggedAreaId === area.area_id ? 'sortable-ghost' : ''}"
                          draggable="true"
                          @dragstart=${(e) => handleDragStart(e, area.area_id, floor.floor_id)}
                          @dragend=${handleDragEnd}
                          @dragover=${handleDragOver}
                          @drop=${(e) => handleDrop(e, area.area_id, floor.floor_id)}
                        >
                          <div class="sortable-handle" title="${t('admin.layout.dragToReorder', 'Drag to reorder')}">
                            <ha-icon icon="mdi:drag-horizontal"></ha-icon>
                          </div>
                          <div class="order-item-index">${index + 1}</div>
                          <div class="order-item-icon">
                            <ha-icon icon="${area.icon || getAreaIcon(area)}"></ha-icon>
                          </div>
                          <div class="order-item-info">
                            <div class="order-item-name">${area.name || area.area_id}</div>
                          </div>
                          <div class="order-item-buttons">
                            <button
                              class="order-btn"
                              ?disabled=${index === 0}
                              @click=${() => moveUp(floor.floor_id, area.area_id, index)}
                              title="${t('admin.layout.moveUp', 'Move up')}"
                            >
                              <ha-icon icon="mdi:chevron-up"></ha-icon>
                            </button>
                            <button
                              class="order-btn"
                              ?disabled=${index === floorAreas.length - 1}
                              @click=${() => moveDown(floor.floor_id, area.area_id, index, floorAreas.length)}
                              title="${t('admin.layout.moveDown', 'Move down')}"
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

          <!-- Unassigned rooms -->
          ${unassignedAreas.length > 0 ? html`
            <div class="order-floor-section">
              <div class="order-floor-header" style="background: var(--dv-gray600);">
                <ha-icon icon="mdi:help-circle"></ha-icon>
                <span class="order-floor-name">${t('wizard.roomOrder.unassigned', 'Unassigned Rooms')}</span>
                <span style="opacity: 0.8; font-size: 13px;">
                  ${unassignedAreas.length} ${t('wizard.roomOrder.rooms', 'rooms')}
                </span>
              </div>
              <div class="order-rooms-list">
                <div class="order-list">
                  ${unassignedAreas.map((area, index) => html`
                    <div class="order-item" style="opacity: 0.7;">
                      <div class="order-item-index">${index + 1}</div>
                      <div class="order-item-icon">
                        <ha-icon icon="${area.icon || getAreaIcon(area)}"></ha-icon>
                      </div>
                      <div class="order-item-info">
                        <div class="order-item-name">${area.name || area.area_id}</div>
                        <div class="order-item-subtitle" style="color: var(--dv-orange);">
                          ${t('wizard.roomOrder.assignInHA', 'Assign in HA settings')}
                        </div>
                      </div>
                    </div>
                  `)}
                </div>
              </div>
            </div>
          ` : ''}
        </div>
      `}

      <div style="flex: 1;"></div>

      <!-- Hint -->
      <div class="dv-rooms-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <span>${t('wizard.roomOrder.hint', 'Tip: Assign rooms to floors in Home Assistant under Settings → Areas & Zones')}</span>
      </div>
    </div>
  `;
}

/**
 * Get room order config from wizard state
 * @param {Object} panel - Panel instance
 * @returns {Object} Room order configuration by floor
 */
export function getRoomOrderConfig(panel) {
  const settings = getSettingsStore();
  // Return the nested roomOrder object directly
  return settings.get('roomOrder') || {};
}

/**
 * Save room order config to settings store
 * @param {Object} config - Room order configuration (nested object: { floorId: [...areaIds] })
 * @param {Object} settingsStore - Settings store instance
 */
export function saveRoomOrderConfig(config, settingsStore) {
  try {
    // Merge with existing roomOrder to preserve other floors
    const existingRoomOrder = settingsStore.get('roomOrder') || {};
    const mergedRoomOrder = { ...existingRoomOrder, ...config };
    settingsStore.set('roomOrder', mergedRoomOrder);
  } catch (e) {
    console.warn('[Dashview] Failed to save room order config:', e);
  }
}

export default renderRoomsStep;
