/**
 * Welcome Step Component
 * First step in the setup wizard - introduces Dashview capabilities
 */

import { t } from '../../shared.js';

/**
 * Welcome step styles
 */
export const welcomeStepStyles = `
  /* ==================== WELCOME STEP ==================== */
  .dv-welcome-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 32px 16px;
    flex: 1;
  }

  .dv-welcome-logo {
    width: 80px;
    height: 80px;
    margin-bottom: 24px;
    border-radius: 20px;
    background: var(--dv-accent-primary, var(--primary-color));
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .dv-welcome-logo ha-icon {
    --mdc-icon-size: 48px;
    color: var(--dv-text-on-accent, #fff);
  }

  .dv-welcome-title {
    font-size: 28px;
    font-weight: 700;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-welcome-subtitle {
    font-size: 16px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0 0 32px 0;
    max-width: 400px;
  }

  /* ==================== FEATURE HIGHLIGHTS ==================== */
  .dv-welcome-features {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
    max-width: 400px;
  }

  .dv-welcome-feature {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: var(--dv-bg-secondary, var(--card-background-color));
    border-radius: 12px;
    text-align: left;
    border: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-welcome-feature-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: var(--dv-accent-subtle, rgba(var(--rgb-primary-color), 0.1));
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .dv-welcome-feature-icon ha-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-welcome-feature-content {
    flex: 1;
  }

  .dv-welcome-feature-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 4px 0;
  }

  .dv-welcome-feature-desc {
    font-size: 13px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
    line-height: 1.4;
  }

  /* ==================== IMPORTANT NOTICE ==================== */
  .dv-welcome-notice {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 100%;
    max-width: 400px;
    padding: 16px;
    background: var(--dv-yellow);
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .dv-welcome-notice-header {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .dv-welcome-notice-icon {
    --mdc-icon-size: 24px;
    color: var(--dv-warning-text);
    flex-shrink: 0;
  }

  .dv-welcome-notice-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--dv-warning-text);
    margin: 0;
  }

  .dv-welcome-notice-text {
    font-size: 13px;
    color: var(--dv-warning-text);
    margin: 0;
    line-height: 1.5;
  }

  .dv-welcome-notice-list {
    margin: 8px 0 0 0;
    padding-left: 20px;
    color: var(--dv-warning-text);
    font-size: 13px;
    line-height: 1.6;
  }

  .dv-welcome-notice-list li {
    margin-bottom: 4px;
  }

  .dv-welcome-notice-link {
    color: var(--dv-warning-text);
    font-weight: 600;
    text-decoration: underline;
  }
`;

/**
 * Feature highlights configuration
 * Order: Dashboard → Floor → Room Organization → Quick Controls
 */
const FEATURES = [
  {
    icon: 'mdi:view-dashboard',
    titleKey: 'wizard.welcome.feature1Title',
    titleDefault: 'Beautiful Dashboard',
    descKey: 'wizard.welcome.feature1Desc',
    descDefault: 'A clean, intuitive dashboard designed for touch screens and wall tablets.'
  },
  {
    icon: 'mdi:home-floor-3',
    titleKey: 'wizard.welcome.feature2Title',
    titleDefault: 'Floor Organization',
    descKey: 'wizard.welcome.feature2Desc',
    descDefault: 'Organize your rooms by floor for easy navigation throughout your home.'
  },
  {
    icon: 'mdi:home-automation',
    titleKey: 'wizard.welcome.feature3Title',
    titleDefault: 'Room Organization',
    descKey: 'wizard.welcome.feature3Desc',
    descDefault: 'Automatically discover and map your entities to rooms based on Home Assistant areas.'
  },
  {
    icon: 'mdi:gesture-tap',
    titleKey: 'wizard.welcome.feature4Title',
    titleDefault: 'Quick Controls',
    descKey: 'wizard.welcome.feature4Desc',
    descDefault: 'Control lights, covers, and devices with simple taps and swipes.'
  }
];

/**
 * Render the welcome step
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderWelcomeStep(panel, html) {
  return html`
    <style>${welcomeStepStyles}</style>
    <div class="dv-welcome-step">
      <div class="dv-welcome-logo">
        <ha-icon icon="mdi:view-dashboard-variant"></ha-icon>
      </div>

      <h1 class="dv-welcome-title">
        ${t('wizard.welcome.title', 'Welcome to Dashview!')}
      </h1>

      <p class="dv-welcome-subtitle">
        ${t('wizard.welcome.subtitle', 'Your new smart home dashboard for Home Assistant. Let\'s set it up together.')}
      </p>

      <!-- Important Notice -->
      <div class="dv-welcome-notice">
        <div class="dv-welcome-notice-header">
          <ha-icon class="dv-welcome-notice-icon" icon="mdi:alert-circle"></ha-icon>
          <h3 class="dv-welcome-notice-title">
            ${t('wizard.welcome.noticeTitle', 'Before You Start')}
          </h3>
        </div>
        <p class="dv-welcome-notice-text">
          ${t('wizard.welcome.noticeText', 'Dashview uses your Home Assistant setup to organize your dashboard. Please ensure you have configured:')}
        </p>
        <ul class="dv-welcome-notice-list">
          <li><strong>${t('wizard.welcome.noticeAreas', 'Areas')}</strong> - ${t('wizard.welcome.noticeAreasDesc', 'Create rooms/areas and assign your devices to them')}</li>
          <li><strong>${t('wizard.welcome.noticeFloors', 'Floors')}</strong> - ${t('wizard.welcome.noticeFloorsDesc', 'Group your areas by floor for better organization')}</li>
          <li><strong>${t('wizard.welcome.noticeLabels', 'Labels')}</strong> - ${t('wizard.welcome.noticeLabelsDesc', 'Tag entities (e.g., "Lights", "Climate") for automatic categorization')}</li>
        </ul>
        <p class="dv-welcome-notice-text">
          ${t('wizard.welcome.noticeLocation', 'Set these up in Home Assistant under')} <strong>Settings → Areas & Zones</strong>
        </p>
      </div>

      <div class="dv-welcome-features">
        ${FEATURES.map(feature => html`
          <div class="dv-welcome-feature">
            <div class="dv-welcome-feature-icon">
              <ha-icon icon="${feature.icon}"></ha-icon>
            </div>
            <div class="dv-welcome-feature-content">
              <h3 class="dv-welcome-feature-title">
                ${t(feature.titleKey, feature.titleDefault)}
              </h3>
              <p class="dv-welcome-feature-desc">
                ${t(feature.descKey, feature.descDefault)}
              </p>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}

export default renderWelcomeStep;
