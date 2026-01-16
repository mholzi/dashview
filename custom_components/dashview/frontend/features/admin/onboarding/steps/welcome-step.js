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

  /* ==================== CTA ==================== */
  .dv-welcome-cta {
    margin-top: 32px;
    text-align: center;
  }

  .dv-welcome-cta-text {
    font-size: 14px;
    color: var(--dv-text-tertiary, var(--secondary-text-color));
    opacity: 0.8;
  }
`;

/**
 * Feature highlights configuration
 */
const FEATURES = [
  {
    icon: 'mdi:view-dashboard',
    titleKey: 'onboarding.welcome.feature1Title',
    titleDefault: 'Beautiful Dashboard',
    descKey: 'onboarding.welcome.feature1Desc',
    descDefault: 'A clean, intuitive dashboard designed for touch screens and wall tablets.'
  },
  {
    icon: 'mdi:home-floor-3',
    titleKey: 'onboarding.welcome.feature2Title',
    titleDefault: 'Floor Organization',
    descKey: 'onboarding.welcome.feature2Desc',
    descDefault: 'Organize your rooms by floor for easy navigation throughout your home.'
  },
  {
    icon: 'mdi:gesture-tap',
    titleKey: 'onboarding.welcome.feature3Title',
    titleDefault: 'Quick Controls',
    descKey: 'onboarding.welcome.feature3Desc',
    descDefault: 'Control lights, covers, and devices with simple taps and swipes.'
  },
  {
    icon: 'mdi:weather-partly-cloudy',
    titleKey: 'onboarding.welcome.feature4Title',
    titleDefault: 'Weather Integration',
    descKey: 'onboarding.welcome.feature4Desc',
    descDefault: 'See current weather and forecasts right on your dashboard.'
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
        ${t('onboarding.welcome.title', 'Welcome to Dashview!')}
      </h1>

      <p class="dv-welcome-subtitle">
        ${t('onboarding.welcome.subtitle', 'Your new smart home dashboard for Home Assistant. Let\'s set it up together.')}
      </p>

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

      <div class="dv-welcome-cta">
        <p class="dv-welcome-cta-text">
          ${t('onboarding.welcome.ctaText', 'Click "Next" to start configuring your dashboard')}
        </p>
      </div>
    </div>
  `;
}

export default renderWelcomeStep;
