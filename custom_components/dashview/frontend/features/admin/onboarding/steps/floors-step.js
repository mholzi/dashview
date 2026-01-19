/**
 * Floor Order Step Component
 * Second step in the setup wizard - reorder floors from Home Assistant
 *
 * This step allows users to arrange the display order of floors that already
 * exist in Home Assistant. Floor creation/deletion is handled in HA settings.
 *
 * Uses the same layout as Admin → Layout → Floor Order section.
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';
import { orderStyles } from '../../../../styles/admin/order.js';

/**
 * Floor order step styles - extends admin order styles with wizard-specific additions
 */
export const floorsStepStyles = `
  ${orderStyles}

  /* ==================== WIZARD FLOORS STEP ==================== */
  .dv-floors-step {
    display: flex;
    flex-direction: column;
    gap: 20px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-floors-header {
    text-align: center;
  }

  .dv-floors-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-gray800);
    margin: 0 0 8px 0;
  }

  .dv-floors-desc {
    font-size: 14px;
    color: var(--dv-gray600);
    margin: 0;
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-floors-empty {
    text-align: center;
    padding: 32px;
    background: var(--dv-gray000);
    border: 2px dashed var(--dv-gray300);
    border-radius: 12px;
  }

  .dv-floors-empty-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-gray500);
    margin-bottom: 12px;
  }

  .dv-floors-empty-text {
    font-size: 14px;
    color: var(--dv-gray600);
    margin: 0 0 8px 0;
  }

  /* ==================== HINT ==================== */
  .dv-floors-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-gray000);
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-gray600);
  }

  .dv-floors-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-blue);
    flex-shrink: 0;
  }
`;

/**
 * Get floor icon based on floor level or name
 * @param {Object} floor - Floor object
 * @param {number} index - Floor index
 * @returns {string} MDI icon name
 */
export function getFloorIcon(floor, index) {
  const name = (floor.name || floor.floor_id || '').toLowerCase();

  if (name.includes('basement') || name.includes('keller') || name.includes('unter')) {
    return 'mdi:home-floor-negative-1';
  }
  if (name.includes('ground') || name.includes('erdgeschoss') || name.includes('eg')) {
    return 'mdi:home-floor-0';
  }
  if (name.includes('first') || name.includes('obergeschoss') || name.includes('og') || name.includes('1')) {
    return 'mdi:home-floor-1';
  }
  if (name.includes('second') || name.includes('2')) {
    return 'mdi:home-floor-2';
  }
  if (name.includes('attic') || name.includes('dach') || name.includes('3')) {
    return 'mdi:home-floor-3';
  }

  // Default based on index
  const icons = ['mdi:home-floor-0', 'mdi:home-floor-1', 'mdi:home-floor-2', 'mdi:home-floor-3'];
  return icons[index % icons.length];
}

/**
 * Render the floor order step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderFloorsStep(panel, html) {
  // Initialize wizard floor state if not exists
  if (!panel._wizardFloorState) {
    panel._wizardFloorState = {
      draggedFloorId: null
    };
  }

  const state = panel._wizardFloorState;

  // Get floors from Home Assistant registry
  const haFloors = panel._floors || [];

  // Get floor order from settings (or use HA order)
  const settings = getSettingsStore();
  const floorOrder = settings.get('floorOrder') || [];

  // Create ordered floor list - include HA floors not in order
  const orderedFloors = [];
  const seenIds = new Set();

  // First add floors in saved order
  floorOrder.forEach(floorId => {
    const floor = haFloors.find(f => f.floor_id === floorId);
    if (floor && !seenIds.has(floorId)) {
      orderedFloors.push(floor);
      seenIds.add(floorId);
    }
  });

  // Then add any floors not in order
  haFloors.forEach(floor => {
    if (!seenIds.has(floor.floor_id)) {
      orderedFloors.push(floor);
      seenIds.add(floor.floor_id);
    }
  });

  // Get areas count per floor
  const areas = panel._areas || [];
  const getAreaCount = (floorId) => {
    return areas.filter(a => a.floor_id === floorId).length;
  };

  // Handle move floor up
  const moveUp = (index) => {
    if (index <= 0) return;
    const currentOrder = orderedFloors.map(f => f.floor_id);
    [currentOrder[index - 1], currentOrder[index]] = [currentOrder[index], currentOrder[index - 1]];
    settings.set('floorOrder', currentOrder);
    panel.requestUpdate();
  };

  // Handle move floor down
  const moveDown = (index) => {
    if (index >= orderedFloors.length - 1) return;
    const currentOrder = orderedFloors.map(f => f.floor_id);
    [currentOrder[index], currentOrder[index + 1]] = [currentOrder[index + 1], currentOrder[index]];
    settings.set('floorOrder', currentOrder);
    panel.requestUpdate();
  };

  // Handle drag start
  const handleDragStart = (e, floorId) => {
    state.draggedFloorId = floorId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', floorId);
    e.currentTarget.classList.add('sortable-chosen');
    setTimeout(() => panel.requestUpdate(), 0);
  };

  // Handle drag end
  const handleDragEnd = (e) => {
    state.draggedFloorId = null;
    e.currentTarget.classList.remove('sortable-chosen');
    panel.requestUpdate();
  };

  // Handle drag over
  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = (e, targetFloorId) => {
    e.preventDefault();

    const draggedId = state.draggedFloorId;
    if (!draggedId || draggedId === targetFloorId) {
      state.draggedFloorId = null;
      panel.requestUpdate();
      return;
    }

    // Get current order
    const currentOrder = orderedFloors.map(f => f.floor_id);
    const draggedIndex = currentOrder.indexOf(draggedId);
    const targetIndex = currentOrder.indexOf(targetFloorId);

    if (draggedIndex === -1 || targetIndex === -1) {
      state.draggedFloorId = null;
      panel.requestUpdate();
      return;
    }

    // Remove dragged item and insert at target position
    currentOrder.splice(draggedIndex, 1);
    currentOrder.splice(targetIndex, 0, draggedId);

    // Save new order
    settings.set('floorOrder', currentOrder);
    state.draggedFloorId = null;
    panel.requestUpdate();
  };

  return html`
    <style>${floorsStepStyles}</style>
    <div class="dv-floors-step">
      <div class="dv-floors-header">
        <h2 class="dv-floors-title">
          ${t('wizard.floorOrder.title', 'Arrange Your Floors')}
        </h2>
        <p class="dv-floors-desc">
          ${t('wizard.floorOrder.description', 'Drag to reorder floors. This determines the display order on your dashboard.')}
        </p>
      </div>

      <!-- Floor List -->
      ${orderedFloors.length === 0 ? html`
        <div class="dv-floors-empty">
          <ha-icon class="dv-floors-empty-icon" icon="mdi:home-floor-0"></ha-icon>
          <p class="dv-floors-empty-text">
            ${t('wizard.floorOrder.empty', 'No floors found in Home Assistant.')}
          </p>
          <p class="dv-floors-empty-text">
            ${t('wizard.floorOrder.emptyHint', 'Create floors in Home Assistant under Settings → Areas & Zones → Floors.')}
          </p>
        </div>
      ` : html`
        <div class="order-list">
          ${orderedFloors.map((floor, index) => html`
            <div
              class="order-item sortable-item ${state.draggedFloorId === floor.floor_id ? 'sortable-ghost' : ''}"
              draggable="true"
              @dragstart=${(e) => handleDragStart(e, floor.floor_id)}
              @dragend=${handleDragEnd}
              @dragover=${handleDragOver}
              @drop=${(e) => handleDrop(e, floor.floor_id)}
            >
              <div class="sortable-handle" title="${t('admin.layout.dragToReorder', 'Drag to reorder')}">
                <ha-icon icon="mdi:drag-horizontal"></ha-icon>
              </div>
              <div class="order-item-index">${index + 1}</div>
              <div class="order-item-icon">
                <ha-icon icon="${floor.icon || getFloorIcon(floor, index)}"></ha-icon>
              </div>
              <div class="order-item-info">
                <div class="order-item-name">${floor.name || floor.floor_id}</div>
                <div class="order-item-subtitle">
                  ${getAreaCount(floor.floor_id)} ${t('wizard.floorOrder.rooms', 'rooms')}
                </div>
              </div>
              <div class="order-item-buttons">
                <button
                  class="order-btn"
                  ?disabled=${index === 0}
                  @click=${() => moveUp(index)}
                  title="${t('admin.layout.moveUp', 'Move up')}"
                >
                  <ha-icon icon="mdi:chevron-up"></ha-icon>
                </button>
                <button
                  class="order-btn"
                  ?disabled=${index === orderedFloors.length - 1}
                  @click=${() => moveDown(index)}
                  title="${t('admin.layout.moveDown', 'Move down')}"
                >
                  <ha-icon icon="mdi:chevron-down"></ha-icon>
                </button>
              </div>
            </div>
          `)}
        </div>
      `}

      <div style="flex: 1;"></div>

      <!-- Hint -->
      <div class="dv-floors-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <span>${t('wizard.floorOrder.hint', 'Tip: The first floor in the list will be the default view on your dashboard.')}</span>
      </div>
    </div>
  `;
}

/**
 * Get floor order from wizard state
 * @param {Object} panel - Panel instance
 * @returns {Array} Floor order array
 */
export function getFloorOrder(panel) {
  const settings = getSettingsStore();
  return settings.get('floorOrder') || [];
}

/**
 * Save floor order to settings
 * @param {Array} floorOrder - Array of floor IDs in order
 * @param {Object} settingsStore - Settings store instance
 */
export function saveFloorOrder(floorOrder, settingsStore) {
  try {
    settingsStore.set('floorOrder', floorOrder);
  } catch (e) {
    console.warn('[Dashview] Failed to save floor order:', e);
  }
}

export default renderFloorsStep;
