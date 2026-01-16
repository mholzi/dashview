/**
 * Layout Step Component
 * Fifth step in the setup wizard - configure floor card layout
 */

import { t } from '../../shared.js';
import { getSettingsStore } from '../../../../stores/index.js';

/**
 * Layout step styles
 */
export const layoutStepStyles = `
  /* ==================== LAYOUT STEP ==================== */
  .dv-layout-step {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 0;
  }

  .dv-layout-header {
    text-align: center;
  }

  .dv-layout-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-layout-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== FLOOR LIST ==================== */
  .dv-layout-floors {
    display: flex;
    flex-direction: column;
    gap: 8px;
    max-height: 350px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .dv-layout-floor {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    transition: all 0.2s ease;
  }

  .dv-layout-floor:hover {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-layout-floor.dragging {
    opacity: 0.5;
    border-style: dashed;
  }

  .dv-layout-floor-drag {
    cursor: grab;
    padding: 4px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
  }

  .dv-layout-floor-drag:active {
    cursor: grabbing;
  }

  .dv-layout-floor-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .dv-layout-floor-icon ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-layout-floor-info {
    flex: 1;
  }

  .dv-layout-floor-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-layout-floor-rooms {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin-top: 2px;
  }

  .dv-layout-floor-order {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dv-layout-order-btn {
    width: 28px;
    height: 20px;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 4px;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
  }

  .dv-layout-order-btn:hover:not(:disabled) {
    background: var(--dv-bg-tertiary, var(--divider-color));
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-layout-order-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .dv-layout-order-btn ha-icon {
    --mdc-icon-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  /* ==================== PREVIEW ==================== */
  .dv-layout-preview {
    background: var(--dv-bg-tertiary, var(--secondary-background-color));
    border-radius: 12px;
    padding: 16px;
    border: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-layout-preview-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0 0 12px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .dv-layout-preview-cards {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .dv-layout-preview-card {
    width: 80px;
    height: 60px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }

  .dv-layout-preview-card ha-icon {
    --mdc-icon-size: 18px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-layout-preview-card span {
    font-size: 10px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    max-width: 70px;
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-layout-empty {
    text-align: center;
    padding: 32px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-layout-empty ha-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-bottom: 12px;
  }

  /* ==================== HINT ==================== */
  .dv-layout-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    border-radius: 8px;
    font-size: 13px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-layout-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-accent-primary, var(--primary-color));
    flex-shrink: 0;
    margin-top: 1px;
  }
`;

/**
 * Get floor icon based on name
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
 * Get rooms for a floor
 * @param {Object} panel - Panel instance
 * @param {string} floorId - Floor ID
 * @returns {Array} Rooms for the floor
 */
function getRoomsForFloor(panel, floorId) {
  const areas = panel._areas || [];
  return areas.filter(area => area.floor_id === floorId);
}

/**
 * Render the layout step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderLayoutStep(panel, html) {
  // Show loading state if data not available
  if (!panel._floors || panel._floors.length === 0) {
    return html`
      <style>${layoutStepStyles}</style>
      <div class="dv-layout-step">
        <div class="dv-layout-empty">
          <ha-icon icon="mdi:floor-plan"></ha-icon>
          <p>${t('onboarding.layout.noFloors', 'No floors configured. Go back to add floors.')}</p>
        </div>
      </div>
    `;
  }

  // Initialize layout state if not exists
  if (!panel._wizardLayoutState) {
    panel._wizardLayoutState = {
      floorOrder: [...panel._floors].map(f => f.floor_id)
    };
  }

  const state = panel._wizardLayoutState;

  // Get ordered floors
  const orderedFloors = state.floorOrder
    .map(id => panel._floors.find(f => f.floor_id === id))
    .filter(Boolean);

  // Move floor up
  const moveUp = (index) => {
    if (index <= 0) return;
    const newOrder = [...state.floorOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    state.floorOrder = newOrder;
    panel.requestUpdate();
  };

  // Move floor down
  const moveDown = (index) => {
    if (index >= state.floorOrder.length - 1) return;
    const newOrder = [...state.floorOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    state.floorOrder = newOrder;
    panel.requestUpdate();
  };

  return html`
    <style>${layoutStepStyles}</style>
    <div class="dv-layout-step">
      <div class="dv-layout-header">
        <h2 class="dv-layout-title">
          ${t('onboarding.layout.title', 'Arrange Floor Cards')}
        </h2>
        <p class="dv-layout-desc">
          ${t('onboarding.layout.desc', 'Set the display order of your floor cards on the dashboard.')}
        </p>
      </div>

      <!-- Floor List -->
      <div class="dv-layout-floors">
        ${orderedFloors.map((floor, index) => {
          const rooms = getRoomsForFloor(panel, floor.floor_id);
          return html`
            <div class="dv-layout-floor">
              <div class="dv-layout-floor-drag">
                <ha-icon icon="mdi:drag"></ha-icon>
              </div>
              <div class="dv-layout-floor-icon">
                <ha-icon icon="${getFloorIcon(floor)}"></ha-icon>
              </div>
              <div class="dv-layout-floor-info">
                <div class="dv-layout-floor-name">${floor.name}</div>
                <div class="dv-layout-floor-rooms">
                  ${rooms.length} ${rooms.length === 1
                    ? t('onboarding.layout.room', 'room')
                    : t('onboarding.layout.rooms', 'rooms')}
                </div>
              </div>
              <div class="dv-layout-floor-order">
                <button
                  class="dv-layout-order-btn"
                  @click=${() => moveUp(index)}
                  ?disabled=${index === 0}
                  aria-label="Move up"
                >
                  <ha-icon icon="mdi:chevron-up"></ha-icon>
                </button>
                <button
                  class="dv-layout-order-btn"
                  @click=${() => moveDown(index)}
                  ?disabled=${index === orderedFloors.length - 1}
                  aria-label="Move down"
                >
                  <ha-icon icon="mdi:chevron-down"></ha-icon>
                </button>
              </div>
            </div>
          `;
        })}
      </div>

      <!-- Preview -->
      <div class="dv-layout-preview">
        <p class="dv-layout-preview-title">${t('onboarding.layout.preview', 'Preview')}</p>
        <div class="dv-layout-preview-cards">
          ${orderedFloors.map(floor => html`
            <div class="dv-layout-preview-card">
              <ha-icon icon="${getFloorIcon(floor)}"></ha-icon>
              <span>${floor.name}</span>
            </div>
          `)}
        </div>
      </div>

      <!-- Hint -->
      <div class="dv-layout-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <span>${t('onboarding.layout.hint', 'You can change the order later in the Admin panel under Layout.')}</span>
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
  return panel._wizardLayoutState?.floorOrder || [];
}

/**
 * Save floor order to settings
 * @param {Array} floorOrder - Array of floor IDs in order
 * @param {Object} settingsStore - Settings store instance
 */
export function saveFloorOrder(floorOrder, settingsStore) {
  try {
    const settings = settingsStore.settings || {};
    settingsStore.updateSettings({
      ...settings,
      floorOrder: floorOrder
    });
  } catch (e) {
    console.warn('[Dashview] Failed to save floor order:', e);
  }
}

export default renderLayoutStep;
