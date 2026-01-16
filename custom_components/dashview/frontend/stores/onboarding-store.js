/**
 * Onboarding Store
 * Manages the guided setup wizard state and progress
 *
 * This store handles:
 * - Step tracking and navigation
 * - Progress calculation
 * - LocalStorage persistence for resuming wizard
 * - First-run detection
 */

import { debugLog } from '../constants/index.js';

/**
 * Wizard steps in order
 * @type {string[]}
 */
export const WIZARD_STEPS = [
  'welcome',
  'floors',
  'rooms',
  'entities',
  'layout',
  'weather',
  'review'
];

/**
 * Steps that can be skipped (optional)
 * @type {string[]}
 */
export const SKIPPABLE_STEPS = ['weather'];

/**
 * LocalStorage keys
 */
const STORAGE_KEYS = {
  PROGRESS: 'dashview_onboarding_progress',
  SETTINGS: 'dashview_settings',
  COMPLETED: 'dashview_onboarding_completed'
};

/**
 * Default onboarding state
 */
export const DEFAULT_ONBOARDING_STATE = {
  currentStep: 0,
  completed: {},
  wizardCompleted: false
};

/**
 * Onboarding Store class
 * Manages wizard state with localStorage persistence
 */
export class OnboardingStore {
  constructor() {
    /** @type {string[]} */
    this.steps = [...WIZARD_STEPS];

    /** @type {number} */
    this.currentStep = 0;

    /** @type {Object<string, boolean>} */
    this.completed = {};

    /** @type {boolean} */
    this.wizardCompleted = false;

    /** @type {Set<Function>} */
    this._listeners = new Set();

    /** @type {Object|null} */
    this._hass = null;

    // Load saved progress
    this._loadProgress();
  }

  /**
   * Set the Home Assistant instance
   * @param {Object} hass - Home Assistant instance
   */
  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Get progress percentage (0-100)
   * @returns {number}
   */
  get progress() {
    const completedCount = Object.keys(this.completed).filter(
      step => this.completed[step]
    ).length;
    return Math.round((completedCount / this.steps.length) * 100);
  }

  /**
   * Get current step name
   * @returns {string}
   */
  get currentStepName() {
    return this.steps[this.currentStep] || this.steps[0];
  }

  /**
   * Get total number of steps
   * @returns {number}
   */
  get totalSteps() {
    return this.steps.length;
  }

  /**
   * Check if wizard is on first step
   * @returns {boolean}
   */
  get isFirstStep() {
    return this.currentStep === 0;
  }

  /**
   * Check if wizard is on last step
   * @returns {boolean}
   */
  get isLastStep() {
    return this.currentStep === this.steps.length - 1;
  }

  /**
   * Check if a step can be skipped
   * @param {string} step - Step name
   * @returns {boolean}
   */
  canSkip(step) {
    return SKIPPABLE_STEPS.includes(step);
  }

  /**
   * Check if this is the first run (no existing settings)
   * @returns {boolean}
   */
  isFirstRun() {
    try {
      // Check for completed wizard flag
      const wizardDone = localStorage.getItem(STORAGE_KEYS.COMPLETED);
      if (wizardDone === 'true') {
        return false;
      }

      // Check for existing dashview settings
      // If settings exist with configured entities, not first run
      const localSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          // If there are any configured rooms or entities, not first run
          if (parsed.enabledRooms && Object.keys(parsed.enabledRooms).length > 0) {
            return false;
          }
        } catch (e) {
          // Invalid JSON, treat as first run
        }
      }

      return true;
    } catch (e) {
      console.warn('Dashview: Failed to check first run status', e);
      return true;
    }
  }

  /**
   * Check if wizard should show (first run and not completed)
   * @returns {boolean}
   */
  shouldShowWizard() {
    return this.isFirstRun() && !this.wizardCompleted;
  }

  /**
   * Mark a step as complete
   * @param {string} step - Step name to mark complete
   */
  markComplete(step) {
    if (!this.steps.includes(step)) {
      console.warn(`Dashview: Unknown wizard step: ${step}`);
      return;
    }

    this.completed[step] = true;
    this._persistProgress();
    this._notifyListeners('stepCompleted', step);
    debugLog('onboarding', `Step completed: ${step}`);
  }

  /**
   * Mark a step as incomplete
   * @param {string} step - Step name to mark incomplete
   */
  markIncomplete(step) {
    delete this.completed[step];
    this._persistProgress();
    this._notifyListeners('stepIncomplete', step);
  }

  /**
   * Check if a step is complete
   * @param {string} step - Step name
   * @returns {boolean}
   */
  isStepComplete(step) {
    return this.completed[step] === true;
  }

  /**
   * Go to next step
   * @returns {boolean} True if moved to next step, false if already at end
   */
  nextStep() {
    if (this.currentStep < this.steps.length - 1) {
      // Mark current step as complete when moving forward
      this.markComplete(this.currentStepName);
      this.currentStep++;
      this._persistProgress();
      this._notifyListeners('stepChanged', this.currentStep);
      return true;
    }
    return false;
  }

  /**
   * Go to previous step
   * @returns {boolean} True if moved to previous step, false if already at start
   */
  prevStep() {
    if (this.currentStep > 0) {
      this.currentStep--;
      this._persistProgress();
      this._notifyListeners('stepChanged', this.currentStep);
      return true;
    }
    return false;
  }

  /**
   * Skip current step (only if skippable)
   * @returns {boolean} True if skipped, false if not skippable
   */
  skipStep() {
    const currentStepName = this.currentStepName;
    if (this.canSkip(currentStepName)) {
      // Mark as complete but with a skip flag
      this.completed[currentStepName] = true;
      return this.nextStep();
    }
    return false;
  }

  /**
   * Go to a specific step by index
   * @param {number} index - Step index
   */
  goToStep(index) {
    if (index >= 0 && index < this.steps.length) {
      this.currentStep = index;
      this._persistProgress();
      this._notifyListeners('stepChanged', this.currentStep);
    }
  }

  /**
   * Go to a specific step by name
   * @param {string} stepName - Step name
   */
  goToStepByName(stepName) {
    const index = this.steps.indexOf(stepName);
    if (index !== -1) {
      this.goToStep(index);
    }
  }

  /**
   * Complete the wizard
   */
  completeWizard() {
    // Mark all steps as complete
    this.steps.forEach(step => {
      this.completed[step] = true;
    });
    this.wizardCompleted = true;

    // Set completed flag in localStorage
    try {
      localStorage.setItem(STORAGE_KEYS.COMPLETED, 'true');
    } catch (e) {
      console.warn('Dashview: Failed to save wizard completion', e);
    }

    this._persistProgress();
    this._notifyListeners('wizardCompleted', true);
    debugLog('onboarding', 'Wizard completed');
  }

  /**
   * Reset wizard for re-run
   */
  reset() {
    this.currentStep = 0;
    this.completed = {};
    this.wizardCompleted = false;

    try {
      localStorage.removeItem(STORAGE_KEYS.PROGRESS);
      localStorage.removeItem(STORAGE_KEYS.COMPLETED);
    } catch (e) {
      console.warn('Dashview: Failed to clear wizard progress', e);
    }

    this._notifyListeners('reset', true);
    debugLog('onboarding', 'Wizard reset');
  }

  /**
   * Load progress from localStorage
   * @private
   */
  _loadProgress() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      if (saved) {
        const data = JSON.parse(saved);
        this.currentStep = typeof data.currentStep === 'number' ? data.currentStep : 0;
        this.completed = data.completed && typeof data.completed === 'object' ? data.completed : {};
        this.wizardCompleted = data.wizardCompleted === true;
        debugLog('onboarding', 'Progress loaded from localStorage');
      }

      // Also check completed flag
      const completedFlag = localStorage.getItem(STORAGE_KEYS.COMPLETED);
      if (completedFlag === 'true') {
        this.wizardCompleted = true;
      }
    } catch (e) {
      console.warn('Dashview: Failed to load onboarding progress', e);
      this.currentStep = 0;
      this.completed = {};
      this.wizardCompleted = false;
    }
  }

  /**
   * Persist progress to localStorage
   * @private
   */
  _persistProgress() {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify({
        currentStep: this.currentStep,
        completed: this.completed,
        wizardCompleted: this.wizardCompleted
      }));
    } catch (e) {
      console.warn('Dashview: Failed to persist onboarding progress', e);
    }
  }

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function (event, data) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notify all listeners of a change
   * @param {string} event - Event name
   * @param {*} data - Event data
   * @private
   */
  _notifyListeners(event, data) {
    this._listeners.forEach(listener => {
      try {
        listener(event, data);
      } catch (e) {
        console.error('Dashview: Onboarding listener error:', e);
      }
    });
  }

  /**
   * Cleanup
   */
  destroy() {
    this._listeners.clear();
  }
}

// Singleton instance
let onboardingStoreInstance = null;

/**
 * Get the singleton onboarding store instance
 * @returns {OnboardingStore}
 */
export function getOnboardingStore() {
  if (!onboardingStoreInstance) {
    onboardingStoreInstance = new OnboardingStore();
  }
  return onboardingStoreInstance;
}

/**
 * Reset the singleton instance (for testing)
 */
export function resetOnboardingStore() {
  if (onboardingStoreInstance) {
    onboardingStoreInstance.destroy();
  }
  onboardingStoreInstance = null;
}

export default OnboardingStore;
