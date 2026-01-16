/**
 * Floors Step Component
 * Second step in the setup wizard - create and order floors
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
  }

  .dv-floor-drag-handle {
    cursor: grab;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    padding: 4px;
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
`;

/**
 * Get floor icon based on floor level or name
 * @param {Object} floor - Floor object
 * @param {number} index - Floor index
 * @returns {string} MDI icon name
 */
function getFloorIcon(floor, index) {
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
 * Render the floors step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderFloorsStep(panel, html) {
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

  // Handle reorder
  const handleMoveUp = (index) => {
    if (index <= 0) return;
    const newOrder = orderedFloors.map(f => f.floor_id);
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    settings.set('floorOrder', newOrder);
    panel.requestUpdate();
  };

  const handleMoveDown = (index) => {
    if (index >= orderedFloors.length - 1) return;
    const newOrder = orderedFloors.map(f => f.floor_id);
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    settings.set('floorOrder', newOrder);
    panel.requestUpdate();
  };

  const hasMinimumFloors = orderedFloors.length >= 1;

  return html`
    <style>${floorsStepStyles}</style>
    <div class="dv-floors-step">
      <div class="dv-floors-header">
        <h2 class="dv-floors-title">
          ${t('onboarding.floors.title', 'Organize Your Floors')}
        </h2>
        <p class="dv-floors-desc">
          ${t('onboarding.floors.desc', 'Arrange the order of your floors. Drag to reorder or use the arrow buttons.')}
        </p>
      </div>

      ${orderedFloors.length === 0 ? html`
        <div class="dv-floors-empty">
          <ha-icon class="dv-floors-empty-icon" icon="mdi:home-floor-0"></ha-icon>
          <p class="dv-floors-empty-text">
            ${t('onboarding.floors.empty', 'No floors found in Home Assistant. Create floors in Settings → Areas & Zones → Floors.')}
          </p>
        </div>
      ` : html`
        <div class="dv-floors-list">
          ${orderedFloors.map((floor, index) => html`
            <div class="dv-floor-item">
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
                  class="dv-floor-action-btn"
                  @click=${() => handleMoveUp(index)}
                  ?disabled=${index === 0}
                  title="${t('admin.layout.moveUp', 'Move up')}"
                >
                  <ha-icon icon="mdi:arrow-up"></ha-icon>
                </button>
                <button
                  class="dv-floor-action-btn"
                  @click=${() => handleMoveDown(index)}
                  ?disabled=${index === orderedFloors.length - 1}
                  title="${t('admin.layout.moveDown', 'Move down')}"
                >
                  <ha-icon icon="mdi:arrow-down"></ha-icon>
                </button>
              </div>
            </div>
          `)}
        </div>
      `}

      ${!hasMinimumFloors ? html`
        <div class="dv-floors-validation">
          <ha-icon icon="mdi:alert-circle"></ha-icon>
          <span>${t('onboarding.floors.minRequired', 'At least one floor is required to continue.')}</span>
        </div>
      ` : ''}

      <div style="flex: 1;"></div>

      <p style="font-size: 12px; color: var(--secondary-text-color); text-align: center;">
        ${t('onboarding.floors.hint', 'Tip: Create floors in Home Assistant under Settings → Areas & Zones → Floors')}
      </p>
    </div>
  `;
}

export default renderFloorsStep;
