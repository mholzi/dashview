/**
 * Room Order Step Component
 * Third step in the setup wizard - reorder rooms within each floor
 *
 * This step allows users to arrange the display order of rooms (areas)
 * within each floor. Room creation/assignment is handled in HA settings.
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
    gap: 16px;
    flex: 1;
    min-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
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
    padding: 12px 16px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-bottom: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-rooms-floor-icon {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-rooms-floor-icon ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-rooms-floor-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    flex: 1;
  }

  .dv-rooms-floor-count {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    background: var(--dv-bg-primary, var(--primary-background-color));
    padding: 4px 10px;
    border-radius: 12px;
  }

  /* ==================== ROOM LIST ==================== */
  .dv-rooms-area-list {
    display: flex;
    flex-direction: column;
  }

  .dv-rooms-area-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    border-bottom: 1px solid var(--dv-border, var(--divider-color));
    transition: background 0.2s ease;
  }

  .dv-rooms-area-item:last-child {
    border-bottom: none;
  }

  .dv-rooms-area-item:hover {
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
  }

  .dv-rooms-area-item.dragging {
    opacity: 0.5;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
  }

  .dv-rooms-drag-handle {
    cursor: grab;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    padding: 4px;
  }

  .dv-rooms-drag-handle:active {
    cursor: grabbing;
  }

  .dv-rooms-area-icon {
    width: 28px;
    height: 28px;
    border-radius: 6px;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-rooms-area-icon ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-rooms-area-name {
    flex: 1;
    font-size: 13px;
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-rooms-order-btns {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dv-rooms-order-btn {
    width: 24px;
    height: 16px;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 3px;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .dv-rooms-order-btn:hover:not(:disabled) {
    background: var(--dv-bg-tertiary, var(--divider-color));
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-rooms-order-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .dv-rooms-order-btn ha-icon {
    --mdc-icon-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  /* ==================== EMPTY STATES ==================== */
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

  .dv-rooms-floor-empty {
    padding: 16px;
    text-align: center;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    font-size: 13px;
  }

  /* ==================== HINT ==================== */
  .dv-rooms-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-rooms-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-accent-primary, var(--primary-color));
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
    setTimeout(() => panel.requestUpdate(), 0);
  };

  // Handle drag end
  const handleDragEnd = () => {
    state.draggedAreaId = null;
    state.draggedFromFloor = null;
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
              <div class="dv-rooms-floor-group">
                <div class="dv-rooms-floor-header">
                  <div class="dv-rooms-floor-icon">
                    <ha-icon icon="${floor.icon || getFloorIcon(floor)}"></ha-icon>
                  </div>
                  <span class="dv-rooms-floor-name">${floor.name || floor.floor_id}</span>
                  <span class="dv-rooms-floor-count">
                    ${floorAreas.length} ${t('wizard.roomOrder.rooms', 'rooms')}
                  </span>
                </div>
                <div class="dv-rooms-area-list">
                  ${floorAreas.length > 0
                    ? floorAreas.map((area, index) => html`
                      <div
                        class="dv-rooms-area-item ${state.draggedAreaId === area.area_id ? 'dragging' : ''}"
                        draggable="true"
                        @dragstart=${(e) => handleDragStart(e, area.area_id, floor.floor_id)}
                        @dragend=${handleDragEnd}
                        @dragover=${handleDragOver}
                        @drop=${(e) => handleDrop(e, area.area_id, floor.floor_id)}
                      >
                        <div class="dv-rooms-drag-handle">
                          <ha-icon icon="mdi:drag-vertical"></ha-icon>
                        </div>
                        <div class="dv-rooms-area-icon">
                          <ha-icon icon="${area.icon || getAreaIcon(area)}"></ha-icon>
                        </div>
                        <span class="dv-rooms-area-name">${area.name || area.area_id}</span>
                        <div class="dv-rooms-order-btns">
                          <button
                            class="dv-rooms-order-btn"
                            @click=${() => moveUp(floor.floor_id, area.area_id, index)}
                            ?disabled=${index === 0}
                            aria-label="Move up"
                          >
                            <ha-icon icon="mdi:chevron-up"></ha-icon>
                          </button>
                          <button
                            class="dv-rooms-order-btn"
                            @click=${() => moveDown(floor.floor_id, area.area_id, index, floorAreas.length)}
                            ?disabled=${index === floorAreas.length - 1}
                            aria-label="Move down"
                          >
                            <ha-icon icon="mdi:chevron-down"></ha-icon>
                          </button>
                        </div>
                      </div>
                    `)
                    : html`
                      <div class="dv-rooms-floor-empty">
                        ${t('wizard.roomOrder.noRooms', 'No rooms assigned to this floor')}
                      </div>
                    `
                  }
                </div>
              </div>
            `;
          })}

          ${unassignedAreas.length > 0 ? html`
            <div class="dv-rooms-floor-group" style="border-color: var(--dv-warning, var(--warning-color)); opacity: 0.7;">
              <div class="dv-rooms-floor-header" style="background: var(--dv-warning-subtle, rgba(var(--rgb-warning-color), 0.1));">
                <div class="dv-rooms-floor-icon" style="background: var(--dv-warning-subtle, rgba(var(--rgb-warning-color), 0.2));">
                  <ha-icon icon="mdi:alert-circle" style="color: var(--dv-warning, var(--warning-color));"></ha-icon>
                </div>
                <span class="dv-rooms-floor-name">${t('wizard.roomOrder.unassigned', 'Unassigned Rooms')}</span>
                <span class="dv-rooms-floor-count">
                  ${unassignedAreas.length} ${t('wizard.roomOrder.rooms', 'rooms')}
                </span>
              </div>
              <div class="dv-rooms-area-list">
                ${unassignedAreas.map(area => html`
                  <div class="dv-rooms-area-item" style="opacity: 0.7;">
                    <div class="dv-rooms-area-icon">
                      <ha-icon icon="${area.icon || getAreaIcon(area)}"></ha-icon>
                    </div>
                    <span class="dv-rooms-area-name">${area.name || area.area_id}</span>
                    <span style="font-size: 11px; color: var(--dv-warning, var(--warning-color));">
                      ${t('wizard.roomOrder.assignInHA', 'Assign in HA settings')}
                    </span>
                  </div>
                `)}
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
