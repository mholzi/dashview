/**
 * Floors Step Component
 * Second step in the setup wizard - create, reorder, and delete floors
 *
 * Implements Story 9.1 Task 4:
 * - 4.2 Allow creating floors with name input
 * - 4.3 Drag-drop reordering for floor display order
 * - 4.4 Delete floor button with confirmation
 * - 4.5 Minimum 1 floor required validation
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';

/**
 * Floors step styles
 */
export const floorsStepStyles = `
  /* ==================== FLOORS STEP ==================== */
  .dv-floors-step {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-floors-header {
    text-align: center;
  }

  .dv-floors-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-floors-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== FLOOR LIST ==================== */
  .dv-floors-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 100px;
  }

  .dv-floor-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .dv-floor-item:hover {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-floor-item.dragging {
    opacity: 0.5;
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-style: dashed;
  }

  .dv-floor-item.drag-over {
    border-color: var(--dv-accent-primary, var(--primary-color));
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.05));
  }

  .dv-floor-drag-handle {
    cursor: grab;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    padding: 4px;
    touch-action: none;
  }

  .dv-floor-drag-handle:active {
    cursor: grabbing;
  }

  .dv-floor-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-floor-icon ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-floor-info {
    flex: 1;
    min-width: 0;
  }

  .dv-floor-name {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .dv-floor-areas {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 2px 0 0 0;
  }

  .dv-floor-actions {
    display: flex;
    gap: 4px;
  }

  .dv-floor-action-btn {
    width: 32px;
    height: 32px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .dv-floor-action-btn:hover {
    background: var(--dv-bg-tertiary, var(--divider-color));
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-floor-action-btn.delete:hover {
    background: var(--dv-error-subtle, rgba(var(--rgb-error-color), 0.1));
    color: var(--dv-error, var(--error-color));
  }

  .dv-floor-action-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .dv-floor-action-btn:disabled:hover {
    background: transparent;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  /* ==================== ADD FLOOR ==================== */
  .dv-add-floor-section {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .dv-add-floor-input {
    flex: 1;
    padding: 12px 16px;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 8px;
    font-size: 14px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    color: var(--dv-text-primary, var(--primary-text-color));
    outline: none;
    transition: border-color 0.2s ease;
  }

  .dv-add-floor-input:focus {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-add-floor-input::placeholder {
    color: var(--dv-text-tertiary, var(--secondary-text-color));
  }

  .dv-add-floor-btn {
    padding: 12px 20px;
    border-radius: 8px;
    border: none;
    background: var(--dv-accent-primary, var(--primary-color));
    color: var(--dv-text-on-accent, #fff);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: filter 0.2s ease;
    white-space: nowrap;
  }

  .dv-add-floor-btn:hover {
    filter: brightness(1.1);
  }

  .dv-add-floor-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-floors-empty {
    text-align: center;
    padding: 32px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 2px dashed var(--dv-border, var(--divider-color));
    border-radius: 12px;
  }

  .dv-floors-empty-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-bottom: 12px;
  }

  .dv-floors-empty-text {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== VALIDATION ==================== */
  .dv-floors-validation {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: var(--dv-error-subtle, rgba(var(--rgb-error-color), 0.1));
    border-radius: 8px;
    color: var(--dv-error, var(--error-color));
    font-size: 13px;
  }

  .dv-floors-validation ha-icon {
    --mdc-icon-size: 20px;
  }

  /* ==================== DELETE CONFIRMATION ==================== */
  .dv-floors-confirm-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dv-floors-confirm-dialog {
    background: var(--dv-bg-primary, var(--primary-background-color));
    border-radius: 16px;
    padding: 24px;
    max-width: 400px;
    width: 90%;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  }

  .dv-floors-confirm-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 12px 0;
  }

  .dv-floors-confirm-message {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0 0 24px 0;
    line-height: 1.5;
  }

  .dv-floors-confirm-warning {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-warning-subtle, rgba(var(--rgb-warning-color), 0.1));
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 13px;
    color: var(--dv-warning, var(--warning-color));
  }

  .dv-floors-confirm-warning ha-icon {
    --mdc-icon-size: 18px;
    flex-shrink: 0;
  }

  .dv-floors-confirm-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .dv-floors-confirm-btn {
    padding: 10px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .dv-floors-confirm-btn.cancel {
    background: var(--dv-bg-secondary, var(--secondary-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-floors-confirm-btn.cancel:hover {
    background: var(--dv-bg-tertiary, var(--divider-color));
  }

  .dv-floors-confirm-btn.delete {
    background: var(--dv-error, var(--error-color));
    border: none;
    color: #fff;
  }

  .dv-floors-confirm-btn.delete:hover {
    filter: brightness(1.1);
  }

  /* ==================== HINT ==================== */
  .dv-floors-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-floors-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-accent-primary, var(--primary-color));
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
 * Create a new floor in Home Assistant
 * @param {Object} hass - Home Assistant instance
 * @param {string} name - Floor name
 * @returns {Promise<Object>} Created floor
 */
export async function createFloor(hass, name) {
  if (!hass) throw new Error('Home Assistant not available');
  if (!name || !name.trim()) throw new Error('Floor name is required');

  const result = await hass.callWS({
    type: 'config/floor_registry/create',
    name: name.trim()
  });

  return result;
}

/**
 * Delete a floor from Home Assistant
 * @param {Object} hass - Home Assistant instance
 * @param {string} floorId - Floor ID to delete
 * @returns {Promise<void>}
 */
export async function deleteFloor(hass, floorId) {
  if (!hass) throw new Error('Home Assistant not available');
  if (!floorId) throw new Error('Floor ID is required');

  await hass.callWS({
    type: 'config/floor_registry/delete',
    floor_id: floorId
  });
}

/**
 * Refresh floors list from Home Assistant
 * @param {Object} panel - Panel instance
 * @returns {Promise<Array>} Updated floors list
 */
export async function refreshFloors(panel) {
  if (!panel.hass) return [];

  const floors = await panel.hass.callWS({
    type: 'config/floor_registry/list'
  });

  panel._floors = floors;
  return floors;
}

/**
 * Render the floors step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderFloorsStep(panel, html) {
  // Initialize wizard floor state if not exists
  if (!panel._wizardFloorState) {
    panel._wizardFloorState = {
      newFloorName: '',
      deleteConfirm: null, // floor_id to confirm deletion
      draggedFloorId: null,
      isCreating: false,
      isDeleting: false,
      error: null
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

  // Handle create floor
  const handleCreateFloor = async () => {
    if (!state.newFloorName.trim() || state.isCreating) return;

    state.isCreating = true;
    state.error = null;
    panel.requestUpdate();

    try {
      await createFloor(panel.hass, state.newFloorName);
      await refreshFloors(panel);
      state.newFloorName = '';
    } catch (e) {
      console.error('Failed to create floor:', e);
      state.error = t('onboarding.floors.errorCreate', 'Failed to create floor. Please try again.');
    } finally {
      state.isCreating = false;
      panel.requestUpdate();
    }
  };

  // Handle delete floor confirmation
  const handleDeleteClick = (floorId) => {
    state.deleteConfirm = floorId;
    panel.requestUpdate();
  };

  // Handle delete floor cancel
  const handleDeleteCancel = () => {
    state.deleteConfirm = null;
    panel.requestUpdate();
  };

  // Handle delete floor confirm
  const handleDeleteConfirm = async () => {
    if (!state.deleteConfirm || state.isDeleting) return;

    // Don't allow deleting the last floor
    if (orderedFloors.length <= 1) {
      state.error = t('onboarding.floors.errorDeleteLast', 'Cannot delete the last floor.');
      state.deleteConfirm = null;
      panel.requestUpdate();
      return;
    }

    state.isDeleting = true;
    state.error = null;
    panel.requestUpdate();

    try {
      await deleteFloor(panel.hass, state.deleteConfirm);

      // Remove from floor order
      const newOrder = floorOrder.filter(id => id !== state.deleteConfirm);
      settings.set('floorOrder', newOrder);

      await refreshFloors(panel);
      state.deleteConfirm = null;
    } catch (e) {
      console.error('Failed to delete floor:', e);
      state.error = t('onboarding.floors.errorDelete', 'Failed to delete floor. Please try again.');
      state.deleteConfirm = null;
    } finally {
      state.isDeleting = false;
      panel.requestUpdate();
    }
  };

  // Handle drag start
  const handleDragStart = (e, floorId) => {
    state.draggedFloorId = floorId;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', floorId);
    // Add dragging class after a small delay
    setTimeout(() => panel.requestUpdate(), 0);
  };

  // Handle drag end
  const handleDragEnd = () => {
    state.draggedFloorId = null;
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

  // Handle input keydown (enter to create)
  const handleInputKeydown = (e) => {
    if (e.key === 'Enter') {
      handleCreateFloor();
    }
  };

  const hasMinimumFloors = orderedFloors.length >= 1;
  const floorToDelete = orderedFloors.find(f => f.floor_id === state.deleteConfirm);

  return html`
    <style>${floorsStepStyles}</style>
    <div class="dv-floors-step">
      <div class="dv-floors-header">
        <h2 class="dv-floors-title">
          ${t('onboarding.floors.title', 'Set Up Your Floors')}
        </h2>
        <p class="dv-floors-desc">
          ${t('onboarding.floors.desc', 'Create floors for your home and drag to reorder them.')}
        </p>
      </div>

      <!-- Add Floor Section -->
      <div class="dv-add-floor-section">
        <input
          type="text"
          class="dv-add-floor-input"
          placeholder="${t('onboarding.floors.placeholder', 'Enter floor name (e.g., Ground Floor, First Floor)')}"
          .value=${state.newFloorName}
          @input=${(e) => { state.newFloorName = e.target.value; panel.requestUpdate(); }}
          @keydown=${handleInputKeydown}
          ?disabled=${state.isCreating}
        />
        <button
          class="dv-add-floor-btn"
          @click=${handleCreateFloor}
          ?disabled=${!state.newFloorName.trim() || state.isCreating}
        >
          <ha-icon icon="mdi:plus"></ha-icon>
          ${state.isCreating
            ? t('onboarding.floors.creating', 'Creating...')
            : t('onboarding.floors.addFloor', 'Add Floor')}
        </button>
      </div>

      <!-- Error Message -->
      ${state.error ? html`
        <div class="dv-floors-validation">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <span>${state.error}</span>
        </div>
      ` : ''}

      <!-- Floor List -->
      ${orderedFloors.length === 0 ? html`
        <div class="dv-floors-empty">
          <ha-icon class="dv-floors-empty-icon" icon="mdi:home-floor-0"></ha-icon>
          <p class="dv-floors-empty-text">
            ${t('onboarding.floors.empty', 'No floors yet. Add your first floor above to get started.')}
          </p>
        </div>
      ` : html`
        <div class="dv-floors-list">
          ${orderedFloors.map((floor, index) => html`
            <div
              class="dv-floor-item ${state.draggedFloorId === floor.floor_id ? 'dragging' : ''}"
              draggable="true"
              @dragstart=${(e) => handleDragStart(e, floor.floor_id)}
              @dragend=${handleDragEnd}
              @dragover=${handleDragOver}
              @drop=${(e) => handleDrop(e, floor.floor_id)}
            >
              <div class="dv-floor-drag-handle">
                <ha-icon icon="mdi:drag-vertical"></ha-icon>
              </div>

              <div class="dv-floor-icon">
                <ha-icon icon="${getFloorIcon(floor, index)}"></ha-icon>
              </div>

              <div class="dv-floor-info">
                <p class="dv-floor-name">${floor.name || floor.floor_id}</p>
                <p class="dv-floor-areas">
                  ${getAreaCount(floor.floor_id)} ${t('onboarding.floors.rooms', 'rooms')}
                </p>
              </div>

              <div class="dv-floor-actions">
                <button
                  class="dv-floor-action-btn delete"
                  @click=${() => handleDeleteClick(floor.floor_id)}
                  ?disabled=${orderedFloors.length <= 1}
                  title="${orderedFloors.length <= 1
                    ? t('onboarding.floors.cannotDeleteLast', 'Cannot delete the last floor')
                    : t('onboarding.floors.deleteFloor', 'Delete floor')}"
                >
                  <ha-icon icon="mdi:delete"></ha-icon>
                </button>
              </div>
            </div>
          `)}
        </div>
      `}

      <!-- Minimum Floor Validation -->
      ${!hasMinimumFloors ? html`
        <div class="dv-floors-validation">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <span>${t('onboarding.floors.minRequired', 'At least one floor is required to continue.')}</span>
        </div>
      ` : ''}

      <div style="flex: 1;"></div>

      <!-- Hint -->
      <div class="dv-floors-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <span>${t('onboarding.floors.hint', 'Tip: Drag floors to set the display order on your dashboard. Common floor names: Ground Floor, First Floor, Basement, Attic.')}</span>
      </div>
    </div>

    <!-- Delete Confirmation Dialog -->
    ${state.deleteConfirm ? html`
      <div class="dv-floors-confirm-overlay" @click=${handleDeleteCancel}>
        <div class="dv-floors-confirm-dialog" @click=${(e) => e.stopPropagation()}>
          <h3 class="dv-floors-confirm-title">
            ${t('onboarding.floors.confirmDeleteTitle', 'Delete Floor?')}
          </h3>
          <p class="dv-floors-confirm-message">
            ${t('onboarding.floors.confirmDeleteMessage', 'Are you sure you want to delete')}
            <strong>"${floorToDelete?.name || state.deleteConfirm}"</strong>?
          </p>
          ${getAreaCount(state.deleteConfirm) > 0 ? html`
            <div class="dv-floors-confirm-warning">
              <ha-icon icon="mdi:alert"></ha-icon>
              <span>
                ${t('onboarding.floors.confirmDeleteWarning', 'This floor has {count} rooms assigned. They will become unassigned.').replace('{count}', getAreaCount(state.deleteConfirm))}
              </span>
            </div>
          ` : ''}
          <div class="dv-floors-confirm-actions">
            <button
              class="dv-floors-confirm-btn cancel"
              @click=${handleDeleteCancel}
              ?disabled=${state.isDeleting}
            >
              ${t('common.cancel', 'Cancel')}
            </button>
            <button
              class="dv-floors-confirm-btn delete"
              @click=${handleDeleteConfirm}
              ?disabled=${state.isDeleting}
            >
              ${state.isDeleting
                ? t('onboarding.floors.deleting', 'Deleting...')
                : t('common.delete', 'Delete')}
            </button>
          </div>
        </div>
      </div>
    ` : ''}
  `;
}

export default renderFloorsStep;
