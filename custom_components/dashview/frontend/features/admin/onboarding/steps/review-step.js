/**
 * Review Step Component
 * Final step in the setup wizard - review all configuration and complete
 */

import { t } from '../../shared.js';
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
  }

  .dv-review-section {
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
    padding: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .dv-review-section-icon {
    width: 44px;
    height: 44px;
    border-radius: 10px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dv-review-section-icon ha-icon {
    --mdc-icon-size: 24px;
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
    margin: 0 0 4px 0;
  }

  .dv-review-section-value {
    font-size: 13px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-review-section-details {
    font-size: 12px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-top: 4px;
  }

  .dv-review-section-edit {
    padding: 8px 14px;
    background: transparent;
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 8px;
    font-size: 12px;
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
    padding: 24px;
    background: rgba(76, 175, 80, 0.1);
    border-radius: 12px;
    border: 1px solid rgba(76, 175, 80, 0.3);
  }

  .dv-review-success ha-icon {
    --mdc-icon-size: 48px;
    color: #4caf50;
    margin-bottom: 12px;
  }

  .dv-review-success-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-review-success-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== COMPLETE BUTTON ==================== */
  .dv-review-complete-btn {
    width: 100%;
    padding: 16px 24px;
    background: var(--dv-accent-primary, var(--primary-color));
    border: none;
    border-radius: 12px;
    font-size: 16px;
    font-weight: 600;
    color: var(--dv-text-on-accent, #fff);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: all 0.2s ease;
    margin-top: 8px;
  }

  .dv-review-complete-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .dv-review-complete-btn ha-icon {
    --mdc-icon-size: 20px;
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
  const entityState = panel._wizardEntityState || { selected: {} };
  const layoutState = panel._wizardLayoutState || {};
  const weatherState = panel._wizardWeatherState || {};

  // Count entities per room
  const selectedEntities = Object.entries(entityState.selected || {})
    .filter(([, isSelected]) => isSelected);

  // Count rooms per floor
  const roomsByFloor = {};
  floors.forEach(floor => {
    roomsByFloor[floor.floor_id] = areas.filter(a => a.floor_id === floor.floor_id).length;
  });

  // Get weather entity name
  let weatherEntityName = null;
  if (weatherState.selectedEntity && panel.hass?.states[weatherState.selectedEntity]) {
    const state = panel.hass.states[weatherState.selectedEntity];
    weatherEntityName = state.attributes.friendly_name || weatherState.selectedEntity;
  }

  return {
    floors: {
      count: floors.length,
      names: floors.map(f => f.name)
    },
    rooms: {
      total: areas.length,
      byFloor: roomsByFloor
    },
    entities: {
      selected: selectedEntities.length
    },
    weather: {
      entityId: weatherState.selectedEntity,
      entityName: weatherEntityName
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
          ${t('onboarding.review.title', 'Review Your Setup')}
        </h2>
        <p class="dv-review-desc">
          ${t('onboarding.review.desc', 'Here\'s a summary of your configuration. You can edit any section before finishing.')}
        </p>
      </div>

      <!-- Summary Sections -->
      <div class="dv-review-sections">
        <!-- Floors Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon ${summary.floors.count > 0 ? 'success' : 'warning'}">
            <ha-icon icon="${summary.floors.count > 0 ? 'mdi:check' : 'mdi:alert'}"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('onboarding.review.floors', 'Floors')}</h3>
            <p class="dv-review-section-value">
              ${summary.floors.count} ${summary.floors.count === 1
                ? t('onboarding.review.floor', 'floor')
                : t('onboarding.review.floorsPlural', 'floors')} ${t('onboarding.review.configured', 'configured')}
            </p>
            ${summary.floors.names.length > 0 ? html`
              <p class="dv-review-section-details">${summary.floors.names.join(', ')}</p>
            ` : ''}
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(1)}>
            ${t('onboarding.review.edit', 'Edit')}
          </button>
        </div>

        <!-- Rooms Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon ${summary.rooms.total > 0 ? 'success' : 'warning'}">
            <ha-icon icon="${summary.rooms.total > 0 ? 'mdi:check' : 'mdi:alert'}"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('onboarding.review.rooms', 'Rooms')}</h3>
            <p class="dv-review-section-value">
              ${summary.rooms.total} ${summary.rooms.total === 1
                ? t('onboarding.review.room', 'room')
                : t('onboarding.review.roomsPlural', 'rooms')} ${t('onboarding.review.assigned', 'assigned')}
            </p>
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(2)}>
            ${t('onboarding.review.edit', 'Edit')}
          </button>
        </div>

        <!-- Entities Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon ${summary.entities.selected > 0 ? 'success' : 'warning'}">
            <ha-icon icon="${summary.entities.selected > 0 ? 'mdi:check' : 'mdi:alert'}"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('onboarding.review.entities', 'Entities')}</h3>
            <p class="dv-review-section-value">
              ${summary.entities.selected} ${summary.entities.selected === 1
                ? t('onboarding.review.entity', 'entity')
                : t('onboarding.review.entitiesPlural', 'entities')} ${t('onboarding.review.selected', 'selected')}
            </p>
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(3)}>
            ${t('onboarding.review.edit', 'Edit')}
          </button>
        </div>

        <!-- Weather Section -->
        <div class="dv-review-section">
          <div class="dv-review-section-icon success">
            <ha-icon icon="mdi:check"></ha-icon>
          </div>
          <div class="dv-review-section-info">
            <h3 class="dv-review-section-title">${t('onboarding.review.weather', 'Weather')}</h3>
            <p class="dv-review-section-value">
              ${summary.weather.entityName
                ? summary.weather.entityName
                : t('onboarding.review.noWeather', 'Not configured (optional)')}
            </p>
          </div>
          <button class="dv-review-section-edit" @click=${() => goToStep(5)}>
            ${t('onboarding.review.edit', 'Edit')}
          </button>
        </div>
      </div>

      <!-- Success Message -->
      <div class="dv-review-success">
        <ha-icon icon="mdi:check-circle"></ha-icon>
        <h3 class="dv-review-success-title">
          ${t('onboarding.review.ready', 'You\'re All Set!')}
        </h3>
        <p class="dv-review-success-desc">
          ${t('onboarding.review.readyDesc', 'Your dashboard is configured and ready to use.')}
        </p>
      </div>
    </div>
  `;
}

export default renderReviewStep;
