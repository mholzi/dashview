/**
 * Dashview Admin - Setup Tab
 * Setup wizard and configuration tools
 */

import { t } from './shared.js';

/**
 * Render the Setup tab
 * Features: Setup wizard launcher, reset tools
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Setup tab HTML
 */
export function renderSetupTab(panel, html) {
  return html`
    <!-- ==================== A. SETUP WIZARD ==================== -->
    <h2 class="section-title">
      <ha-icon icon="mdi:wizard-hat"></ha-icon>
      ${t('admin.setup.wizard', 'Setup Wizard')}
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      ${t('admin.setup.wizardIntro', 'Run the guided setup wizard to configure your dashboard step by step.')}
    </p>

    <!-- Setup Wizard Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px;">
      <div class="card-config-section-header" style="cursor: default;">
        <div class="card-config-section-title">
          <ha-icon icon="mdi:rocket-launch"></ha-icon>
          ${t('admin.setup.runWizard', 'Run Setup Wizard')}
        </div>
      </div>
      <div class="card-config-section-content expanded">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          ${t('admin.setup.wizardDesc', 'The setup wizard guides you through configuring floors, rooms, entities, and dashboard layout. Your existing settings will be preserved.')}
        </p>

        <button
          class="scene-button-add"
          style="width: 100%;"
          @click=${() => {
            panel._showWizard = true;
            panel._adminPopupOpen = false;
            panel.requestUpdate();
          }}
        >
          <ha-icon icon="mdi:wizard-hat"></ha-icon>
          ${t('admin.setup.startWizard', 'Start Setup Wizard')}
        </button>
      </div>
    </div>
  `;
}
