/**
 * Review Step Component
 * Final step in the setup wizard - review all configuration and complete
 */

import { t, LABEL_CATEGORIES } from '../../shared.js';
import { getSettingsStore, getOnboardingStore } from '../../../../stores/index.js';

/**
 * Review step styles
 */
export const reviewStepStyles = `
  /* ==================== REVIEW STEP ==================== */
  .dv-review-step {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding: 16px 0;
  }

  .dv-review-header {
    text-align: center;
  }

  .dv-review-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-review-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== SUMMARY SECTIONS ==================== */
  .dv-review-sections {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-height: 150px;
    overflow-y: auto;
  }

  .dv-review-section {
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dv-review-section-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dv-review-section-icon ha-icon {
    --mdc-icon-size: 22px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-review-section-icon.success {
    background: rgba(76, 175, 80, 0.1);
  }

  .dv-review-section-icon.success ha-icon {
    color: #4caf50;
  }

  .dv-review-section-icon.warning {
    background: rgba(255, 152, 0, 0.1);
  }

  .dv-review-section-icon.warning ha-icon {
    color: #ff9800;
  }

  .dv-review-section-info {
    flex: 1;
    min-width: 0;
  }

  .dv-review-section-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 2px 0;
  }

  .dv-review-section-value {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-review-section-details {
    font-size: 11px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-top: 2px;
  }

  .dv-review-section-edit {
    padding: 6px 12px;
    background: transparent;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 6px;
    font-size: 11px;
    font-weight: 500;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    cursor: pointer;
    transition: all 0.2s ease;
    flex-shrink: 0;
  }

  .dv-review-section-edit:hover {
    background: var(--dv-bg-tertiary, var(--divider-color));
    border-color: var(--dv-accent-primary, var(--primary-color));
    color: var(--dv-accent-primary, var(--primary-color));
  }

  /* ==================== SUCCESS MESSAGE ==================== */
  .dv-review-success {
    text-align: center;
    padding: 20px;
    background: rgba(76, 175, 80, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  .dv-review-success ha-icon {
    --mdc-icon-size: 40px;
    color: #4caf50;
    margin-bottom: 8px;
  }

  .dv-review-success-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 4px 0;
  }

  .dv-review-success-desc {
    font-size: 13px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }
`;

/**
 * Generate review summary from wizard state
 * @param {Object} panel - Panel instance
 * @returns {Object} Summary data
 */
export function generateReviewSummary(panel) {
  const floors = panel._floors || [];
  const areas = panel._areas || [];
  const settings = getSettingsStore();

  // Floor order
  const floorOrder = settings.get('floorOrder') || floors.map(f => f.floor_id);
  const orderedFloorNames = floorOrder
    .map(id => floors.find(f => f.floor_id === id)?.name)
    .filter(Boolean);

  // Room config state - use panel._enabledRooms (same as admin)
  // Rooms are enabled by default (true) unless explicitly set to false
  const enabledRooms = panel._enabledRooms || {};
  const enabledRoomsCount = areas.filter(area => enabledRooms[area.area_id] !== false).length;

  // Labels config - count mapped labels
  const mappedLabelsCount = LABEL_CATEGORIES.filter(cat => panel[cat.prop]).length;

  // Floor cards state
  const floorCardsState = panel._wizardFloorCardsState || {};
  const floorOverviewCount = Object.values(floorCardsState.floorOverviewEnabled || {}).filter(v => v).length;
  const configuredSlotsCount = Object.values(floorCardsState.floorCardConfig || {}).reduce((acc, floorConfig) => {
    return acc + Object.keys(floorConfig || {}).length;
  }, 0);

  return {
    floorOrder: {
      count: floors.length,
      names: orderedFloorNames,
      isCustom: Boolean(settings.get('floorOrder')?.length > 0)
    },
    roomOrder: {
      total: areas.length,
      hasCustomOrder: floors.some(f => (settings.get('roomOrder') || {})[f.floor_id]?.length > 0)
    },
    labels: {
      mappedCount: mappedLabelsCount,
      totalCategories: LABEL_CATEGORIES.length
    },
    roomConfig: {
      enabledCount: enabledRoomsCount,
      total: areas.length
    },
    floorCards: {
      overviewsEnabled: floorOverviewCount,
      slotsConfigured: configuredSlotsCount,
      floorsCount: floors.length
    }
  };
}

/**
 * Render the review step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderReviewStep(panel, html) {
  const summary = generateReviewSummary(panel);
  const store = getOnboardingStore();

  // Navigate to step handler
  const goToStep = (stepIndex) => {
    store.goToStep(stepIndex);
    panel.requestUpdate();
  };

  return html`
    <style>${reviewStepStyles}</style>
    <div class="dv-review-step">
      <div class="dv-review-header">
        <h2 class="dv-review-title">
          ${t('wizard.review.title', 'Review Your Setup')}
        </h2>
        <p class="dv-review-desc">
          ${t('wizard.review.description', 'Here\'s a summary of your configuration. Click Edit to make changes.')}
        </p>
      </div>

      <!-- Summary Sections -->
      <div class="dv-review-sections">
        <!-- Floor Order Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon ${summary.floorOrder.count > 0 ? 'success' : 'warning'}">
            <ha-icon icon="mdi:home-floor-3"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('wizard.review.floorOrder', 'Floor Order')}</h3>
            <p class="dv-review-section-value">
              ${summary.floorOrder.count} ${summary.floorOrder.count === 1 ? 'floor' : 'floors'}
              ${summary.floorOrder.isCustom ? ' (custom order)' : ''}
            </p>
            ${summary.floorOrder.names.length > 0 ? html`
              <p class="dv-review-section-details">${summary.floorOrder.names.join(' → ')}</p>
            ` : ''}
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(1)}>
            ${t('wizard.review.edit', 'Edit')}
          </button>
        </div>

        <!-- Room Order Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon ${summary.roomOrder.total > 0 ? 'success' : 'warning'}">
            <ha-icon icon="mdi:door"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('wizard.review.roomOrder', 'Room Order')}</h3>
            <p class="dv-review-section-value">
              ${summary.roomOrder.total} ${summary.roomOrder.total === 1 ? 'room' : 'rooms'}
              ${summary.roomOrder.hasCustomOrder ? ' (custom order)' : ''}
            </p>
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(2)}>
            ${t('wizard.review.edit', 'Edit')}
          </button>
        </div>

        <!-- Labels Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon ${summary.labels.mappedCount > 0 ? 'success' : 'warning'}">
            <ha-icon icon="mdi:tag-multiple"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('wizard.review.labels', 'Labels')}</h3>
            <p class="dv-review-section-value">
              ${summary.labels.mappedCount} of ${summary.labels.totalCategories} categories mapped
            </p>
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(3)}>
            ${t('wizard.review.edit', 'Edit')}
          </button>
        </div>

        <!-- Room Config Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon ${summary.roomConfig.enabledCount > 0 ? 'success' : 'warning'}">
            <ha-icon icon="mdi:home-group"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('wizard.review.roomConfig', 'Enabled Rooms')}</h3>
            <p class="dv-review-section-value">
              ${summary.roomConfig.enabledCount} of ${summary.roomConfig.total} rooms enabled
            </p>
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(4)}>
            ${t('wizard.review.edit', 'Edit')}
          </button>
        </div>

        <!-- Floor Cards Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon success">
            <ha-icon icon="mdi:view-grid"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('wizard.review.floorCards', 'Floor Cards')}</h3>
            <p class="dv-review-section-value">
              ${summary.floorCards.overviewsEnabled} overviews, ${summary.floorCards.slotsConfigured} slots configured
            </p>
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(5)}>
            ${t('wizard.review.edit', 'Edit')}
          </button>
        </div>
      </div>

      <!-- Success Message -->
      <div class="dv-review-success">
        <ha-icon icon="mdi:check-circle"></ha-icon>
        <h3 class="dv-review-success-title">
          ${t('wizard.review.ready', 'You\'re All Set!')}
        </h3>
        <p class="dv-review-success-desc">
          ${t('wizard.review.readyDesc', 'Click Finish to complete setup and start using your dashboard.')}
        </p>
      </div>
    </div>
  `;
}

export default renderReviewStep;
