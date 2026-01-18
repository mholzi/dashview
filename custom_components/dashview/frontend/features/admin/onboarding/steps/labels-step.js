/**
 * Labels Step Component
 * Fourth step in the setup wizard - map Home Assistant labels to Dashview categories
 */

import { t, LABEL_CATEGORIES } from '../../shared.js';

/**
 * Labels step styles
 */
export const labelsStepStyles = `
  /* ==================== LABELS STEP ==================== */
  .dv-labels-step {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 16px 0;
    flex: 1;
  }

  .dv-labels-header {
    text-align: center;
  }

  .dv-labels-title {
    font-size: 20px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-labels-desc {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== LABEL MAPPING LIST ==================== */
  .dv-labels-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 200px;
    overflow-y: auto;
    padding-right: 4px;
  }

  .dv-labels-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 1px solid var(--dv-border, var(--divider-color));
    border-radius: 12px;
  }

  .dv-labels-category {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .dv-labels-icon {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dv-labels-icon ha-icon {
    --mdc-icon-size: 20px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-labels-info {
    flex: 1;
    min-width: 0;
  }

  .dv-labels-category-title {
    font-size: 14px;
    font-weight: 500;
    color: var(--dv-text-primary, var(--primary-text-color));
  }

  .dv-labels-category-desc {
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-labels-selector {
    min-width: 160px;
  }

  .dv-labels-selector select {
    width: 100%;
    padding: 10px 12px;
    font-size: 13px;
    border-radius: 8px;
    background: var(--dv-bg-primary, var(--primary-background-color));
    color: var(--dv-text-primary, var(--primary-text-color));
    cursor: pointer;
    outline: none;
    transition: border-color 0.2s ease;
  }

  .dv-labels-selector select:focus {
    border-color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-labels-selector select.mapped {
    border: 2px solid var(--dv-green, #4caf50);
  }

  .dv-labels-selector select.unmapped {
    border: 2px solid var(--dv-red, #f44336);
  }

  /* ==================== HINT ==================== */
  .dv-labels-hint {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    border-radius: 8px;
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-labels-hint ha-icon {
    --mdc-icon-size: 16px;
    color: var(--dv-accent-primary, var(--primary-color));
    flex-shrink: 0;
  }

  /* ==================== EMPTY STATE ==================== */
  .dv-labels-empty {
    text-align: center;
    padding: 32px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border: 2px dashed var(--dv-border, var(--divider-color));
    border-radius: 12px;
  }

  .dv-labels-empty-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    margin-bottom: 12px;
  }

  .dv-labels-empty-text {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }
`;

/**
 * Render the labels step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderLabelsStep(panel, html) {
  // Initialize panel state for label mapping
  panel._settingsLoaded = true;

  // Get all available labels from HA
  const availableLabels = panel._labels || [];

  // Helper to render a category mapping row
  const renderCategoryRow = (category) => {
    const currentLabelId = panel[category.prop];
    const isMapped = Boolean(currentLabelId);

    return html`
      <div class="dv-labels-row">
        <div class="dv-labels-category">
          <div class="dv-labels-icon">
            <ha-icon icon="${category.icon}"></ha-icon>
          </div>
          <div class="dv-labels-info">
            <span class="dv-labels-category-title">${t(category.titleKey)}</span>
            <span class="dv-labels-category-desc">${t(category.descKey)}</span>
          </div>
        </div>
        <div class="dv-labels-selector">
          <select
            class="${isMapped ? 'mapped' : 'unmapped'}"
            .value=${currentLabelId || ''}
            @change=${(e) => {
              if (!panel._settingsLoaded) return;
              const newLabelId = e.target.value || null;
              if (newLabelId === currentLabelId) return;
              panel._setCategoryLabel(category.key, newLabelId);
            }}
          >
            <option value="">${t('admin.entities.selectLabel')}</option>
            ${availableLabels.map(label => html`
              <option value="${label.label_id}" ?selected=${currentLabelId === label.label_id}>
                ${label.name}
              </option>
            `)}
          </select>
        </div>
      </div>
    `;
  };

  return html`
    <style>${labelsStepStyles}</style>
    <div class="dv-labels-step">
      <div class="dv-labels-header">
        <h2 class="dv-labels-title">
          ${t('wizard.labels.title', 'Set Up Your Labels')}
        </h2>
        <p class="dv-labels-desc">
          ${t('wizard.labels.description', 'Map your Home Assistant labels to Dashview categories. Only entities with labels that are assigned to rooms will appear on your dashboard.')}
        </p>
      </div>

      ${availableLabels.length === 0 ? html`
        <div class="dv-labels-empty">
          <ha-icon class="dv-labels-empty-icon" icon="mdi:tag-off-outline"></ha-icon>
          <p class="dv-labels-empty-text">
            ${t('wizard.labels.empty', 'No labels configured in Home Assistant')}
          </p>
        </div>
      ` : html`
        <div class="dv-labels-list">
          ${LABEL_CATEGORIES.map(category => renderCategoryRow(category))}
        </div>
      `}

      <div style="flex: 1;"></div>

      <!-- Hint -->
      <div class="dv-labels-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <span>${t('wizard.labels.hint', 'Tip: Create labels in Home Assistant under Settings → Labels, then assign them to your entities')}</span>
      </div>
    </div>
  `;
}

/**
 * Get labels config from panel state
 * @param {Object} panel - Panel instance
 * @returns {Object} Label mappings object
 */
export function getLabelsConfig(panel) {
  const config = {};
  LABEL_CATEGORIES.forEach(category => {
    const propName = category.prop.replace('_', '').replace('LabelId', 'LabelId');
    config[category.key + 'LabelId'] = panel[category.prop] || null;
  });
  return config;
}

/**
 * Save labels config to settings store
 * @param {Object} config - Label mappings config
 * @param {Object} settingsStore - Settings store instance
 */
export function saveLabelsConfig(config, settingsStore) {
  try {
    const settings = settingsStore.settings || {};
    settingsStore.updateSettings({
      ...settings,
      labelMappings: config
    });
  } catch (e) {
    console.warn('[Dashview] Failed to save labels config:', e);
  }
}

export default renderLabelsStep;
