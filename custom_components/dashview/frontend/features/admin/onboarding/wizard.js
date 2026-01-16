/**
 * Setup Wizard Container
 * Main component that orchestrates the guided setup wizard flow
 *
 * This component:
 * - Renders the progress bar
 * - Handles step navigation (next/back/skip)
 * - Displays the current step content
 * - Manages wizard completion
 */

import { getOnboardingStore, getSettingsStore, WIZARD_STEPS } from '../../../stores/index.js';
import { t } from '../shared.js';
import { renderWelcomeStep } from './steps/welcome-step.js';
import { renderFloorsStep } from './steps/floors-step.js';
import { renderRoomsStep } from './steps/rooms-step.js';
import { renderEntitiesStep, saveEntitySelections, getEntitySelections } from './steps/entities-step.js';

/**
 * Wizard styles
 */
export const wizardStyles = `
  /* ==================== WIZARD CONTAINER ==================== */
  .dv-wizard-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    background: var(--dv-bg-primary, var(--primary-background-color));
    padding: 16px;
    box-sizing: border-box;
  }

  .dv-wizard-header {
    padding: 16px 0;
    text-align: center;
  }

  .dv-wizard-title {
    font-size: 24px;
    font-weight: 600;
    color: var(--dv-text-primary, var(--primary-text-color));
    margin: 0 0 8px 0;
  }

  .dv-wizard-subtitle {
    font-size: 14px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    margin: 0;
  }

  /* ==================== PROGRESS BAR ==================== */
  .dv-wizard-progress {
    padding: 24px 16px;
    max-width: 600px;
    width: 100%;
    margin: 0 auto;
  }

  .dv-wizard-progress-bar {
    height: 8px;
    background: var(--dv-bg-secondary, var(--divider-color));
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
  }

  .dv-wizard-progress-fill {
    height: 100%;
    background: var(--dv-accent-primary, var(--primary-color));
    border-radius: 4px;
    transition: width 0.3s ease;
  }

  .dv-wizard-progress-text {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: var(--dv-text-secondary, var(--secondary-text-color));
  }

  .dv-wizard-step-dots {
    display: flex;
    justify-content: center;
    gap: 8px;
    margin-top: 16px;
  }

  .dv-wizard-step-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--dv-bg-secondary, var(--divider-color));
    transition: all 0.2s ease;
  }

  .dv-wizard-step-dot.completed {
    background: var(--dv-accent-primary, var(--primary-color));
  }

  .dv-wizard-step-dot.current {
    background: var(--dv-accent-primary, var(--primary-color));
    transform: scale(1.25);
  }

  /* ==================== STEP CONTENT ==================== */
  .dv-wizard-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    padding: 16px;
  }

  .dv-wizard-step {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  /* ==================== NAVIGATION ==================== */
  .dv-wizard-navigation {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    max-width: 800px;
    width: 100%;
    margin: 0 auto;
    gap: 16px;
  }

  .dv-wizard-nav-left,
  .dv-wizard-nav-right {
    display: flex;
    gap: 8px;
  }

  .dv-wizard-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    outline: none;
  }

  .dv-wizard-btn:focus-visible {
    box-shadow: 0 0 0 2px var(--dv-accent-primary, var(--primary-color));
  }

  .dv-wizard-btn-primary {
    background: var(--dv-accent-primary, var(--primary-color));
    color: var(--dv-text-on-accent, #fff);
  }

  .dv-wizard-btn-primary:hover {
    filter: brightness(1.1);
  }

  .dv-wizard-btn-secondary {
    background: var(--dv-bg-secondary, var(--secondary-background-color));
    color: var(--dv-text-primary, var(--primary-text-color));
    border: 1px solid var(--dv-border, var(--divider-color));
  }

  .dv-wizard-btn-secondary:hover {
    background: var(--dv-bg-tertiary, var(--divider-color));
  }

  .dv-wizard-btn-text {
    background: transparent;
    color: var(--dv-text-secondary, var(--secondary-text-color));
    padding: 12px 16px;
  }

  .dv-wizard-btn-text:hover {
    color: var(--dv-text-primary, var(--primary-text-color));
    background: var(--dv-bg-secondary, var(--secondary-background-color));
  }

  .dv-wizard-btn[disabled] {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

/**
 * Get step title for display
 * @param {string} step - Step name
 * @returns {string}
 */
function getStepTitle(step) {
  const titles = {
    welcome: t('onboarding.steps.welcome', 'Welcome'),
    floors: t('onboarding.steps.floors', 'Floors'),
    rooms: t('onboarding.steps.rooms', 'Rooms'),
    entities: t('onboarding.steps.entities', 'Entities'),
    layout: t('onboarding.steps.layout', 'Layout'),
    weather: t('onboarding.steps.weather', 'Weather'),
    review: t('onboarding.steps.review', 'Review')
  };
  return titles[step] || step;
}

/**
 * Render the progress bar component
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {OnboardingStore} store - Onboarding store instance
 * @returns {TemplateResult}
 */
function renderProgressBar(panel, html, store) {
  const progress = store.progress;
  const currentStep = store.currentStep;
  const steps = store.steps;

  return html`
    <div class="dv-wizard-progress">
      <div class="dv-wizard-progress-bar">
        <div
          class="dv-wizard-progress-fill"
          style="width: ${progress}%"
        ></div>
      </div>
      <div class="dv-wizard-progress-text">
        <span>${t('onboarding.step', 'Step')} ${currentStep + 1} ${t('common.options.of', 'of')} ${steps.length}</span>
        <span>${progress}% ${t('onboarding.complete', 'complete')}</span>
      </div>
      <div class="dv-wizard-step-dots">
        ${steps.map((step, index) => html`
          <div
            class="dv-wizard-step-dot ${index < currentStep ? 'completed' : ''} ${index === currentStep ? 'current' : ''}"
            title="${getStepTitle(step)}"
          ></div>
        `)}
      </div>
    </div>
  `;
}

/**
 * Render wizard navigation buttons
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {OnboardingStore} store - Onboarding store instance
 * @param {Object} handlers - Event handlers
 * @returns {TemplateResult}
 */
function renderNavigation(panel, html, store, handlers) {
  const isFirst = store.isFirstStep;
  const isLast = store.isLastStep;
  const canSkip = store.canSkip(store.currentStepName);

  return html`
    <div class="dv-wizard-navigation">
      <div class="dv-wizard-nav-left">
        ${!isFirst ? html`
          <button
            class="dv-wizard-btn dv-wizard-btn-secondary"
            @click=${handlers.onBack}
          >
            <ha-icon icon="mdi:arrow-left"></ha-icon>
            ${t('onboarding.back', 'Back')}
          </button>
        ` : html`<div></div>`}
      </div>

      <div class="dv-wizard-nav-right">
        ${canSkip && !isLast ? html`
          <button
            class="dv-wizard-btn dv-wizard-btn-text"
            @click=${handlers.onSkip}
          >
            ${t('onboarding.skip', 'Skip')}
          </button>
        ` : ''}

        ${isLast ? html`
          <button
            class="dv-wizard-btn dv-wizard-btn-primary"
            @click=${handlers.onComplete}
          >
            ${t('onboarding.finish', 'Finish Setup')}
            <ha-icon icon="mdi:check"></ha-icon>
          </button>
        ` : html`
          <button
            class="dv-wizard-btn dv-wizard-btn-primary"
            @click=${handlers.onNext}
          >
            ${t('onboarding.next', 'Next')}
            <ha-icon icon="mdi:arrow-right"></ha-icon>
          </button>
        `}
      </div>
    </div>
  `;
}

/**
 * Render placeholder step content (will be replaced by actual step components)
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {string} stepName - Current step name
 * @returns {TemplateResult}
 */
function renderStepContent(panel, html, stepName) {
  // This will be replaced by actual step components in Tasks 3-5
  return html`
    <div class="dv-wizard-step">
      <div style="text-align: center; padding: 48px;">
        <ha-icon icon="mdi:cog-outline" style="--mdc-icon-size: 64px; color: var(--secondary-text-color);"></ha-icon>
        <h2 style="margin: 16px 0 8px;">${getStepTitle(stepName)}</h2>
        <p style="color: var(--secondary-text-color);">
          ${t('onboarding.stepPlaceholder', 'Step content will be implemented here.')}
        </p>
      </div>
    </div>
  `;
}

/**
 * Render the setup wizard
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Object} options - Render options
 * @param {Function} options.renderWelcome - Render function for welcome step
 * @param {Function} options.renderFloors - Render function for floors step
 * @param {Function} options.renderRooms - Render function for rooms step
 * @param {Function} options.onComplete - Callback when wizard completes
 * @returns {TemplateResult}
 */
export function renderWizard(panel, html, options = {}) {
  const store = getOnboardingStore();
  const currentStepName = store.currentStepName;

  // Event handlers
  const handlers = {
    onBack: () => {
      store.prevStep();
      panel.requestUpdate();
    },
    onNext: () => {
      // Save entity selections when leaving entities step
      if (currentStepName === 'entities') {
        const selections = getEntitySelections(panel);
        const settingsStore = getSettingsStore();
        saveEntitySelections(selections, settingsStore, panel);
      }
      store.nextStep();
      panel.requestUpdate();
    },
    onSkip: () => {
      store.skipStep();
      panel.requestUpdate();
    },
    onComplete: () => {
      // Save entity selections if completing from entities step
      if (currentStepName === 'entities') {
        const selections = getEntitySelections(panel);
        const settingsStore = getSettingsStore();
        saveEntitySelections(selections, settingsStore, panel);
      }
      store.completeWizard();
      if (options.onComplete) {
        options.onComplete();
      }
      panel.requestUpdate();
    }
  };

  // Get step render function
  const getStepRenderer = () => {
    switch (currentStepName) {
      case 'welcome':
        return options.renderWelcome || renderWelcomeStep;
      case 'floors':
        return options.renderFloors || renderFloorsStep;
      case 'rooms':
        return options.renderRooms || renderRoomsStep;
      case 'entities':
        return options.renderEntities || renderEntitiesStep;
      case 'layout':
        return options.renderLayout || ((p, h) => renderStepContent(p, h, 'layout'));
      case 'weather':
        return options.renderWeather || ((p, h) => renderStepContent(p, h, 'weather'));
      case 'review':
        return options.renderReview || ((p, h) => renderStepContent(p, h, 'review'));
      default:
        return (p, h) => renderStepContent(p, h, currentStepName);
    }
  };

  const stepRenderer = getStepRenderer();

  return html`
    <style>${wizardStyles}</style>
    <div class="dv-wizard-container">
      <div class="dv-wizard-header">
        <h1 class="dv-wizard-title">${t('onboarding.title', 'Setup Wizard')}</h1>
        <p class="dv-wizard-subtitle">${t('onboarding.subtitle', 'Let\'s get Dashview configured for your home')}</p>
      </div>

      ${renderProgressBar(panel, html, store)}

      <div class="dv-wizard-content">
        ${stepRenderer(panel, html)}
      </div>

      ${renderNavigation(panel, html, store, handlers)}
    </div>
  `;
}

/**
 * Check if wizard should be shown
 * @returns {boolean}
 */
export function shouldShowWizard() {
  return getOnboardingStore().shouldShowWizard();
}

/**
 * Reset wizard to allow re-running
 */
export function resetWizard() {
  getOnboardingStore().reset();
}

export default renderWizard;
