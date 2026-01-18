/**
 * Onboarding Store Tests
 * Tests for wizard state management and localStorage persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  OnboardingStore,
  getOnboardingStore,
  resetOnboardingStore,
  WIZARD_STEPS,
  SKIPPABLE_STEPS,
  DEFAULT_ONBOARDING_STATE
} from './onboarding-store.js';

// Mock localStorage with actual storage behavior
let mockStore = {};

const localStorageMock = {
  getItem: vi.fn((key) => mockStore[key] || null),
  setItem: vi.fn((key, value) => { mockStore[key] = String(value); }),
  removeItem: vi.fn((key) => { delete mockStore[key]; }),
  clear: vi.fn(() => { mockStore = {}; })
};

// Replace global localStorage
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

describe('OnboardingStore', () => {
  let store;

  beforeEach(() => {
    // Clear localStorage mock before each test
    mockStore = {};
    vi.clearAllMocks();

    // Reset singleton
    resetOnboardingStore();

    // Create fresh store
    store = new OnboardingStore();
  });

  afterEach(() => {
    if (store) {
      store.destroy();
    }
  });

  describe('initialization', () => {
    it('should initialize with default values', () => {
      expect(store.currentStep).toBe(0);
      expect(store.completed).toEqual({});
      expect(store.wizardCompleted).toBe(false);
      expect(store.steps).toEqual(WIZARD_STEPS);
    });

    it('should have correct wizard steps', () => {
      expect(store.steps).toContain('welcome');
      expect(store.steps).toContain('floorOrder');
      expect(store.steps).toContain('roomOrder');
      expect(store.steps).toContain('labels');
      expect(store.steps).toContain('roomConfig');
      expect(store.steps).toContain('floorCards');
      expect(store.steps).toContain('review');
      expect(store.steps.length).toBe(7);
    });

    it('should load saved progress from localStorage', () => {
      // Setup saved state directly in mockStore
      const savedState = {
        currentStep: 3,
        completed: { welcome: true, floorOrder: true, roomOrder: true },
        wizardCompleted: false
      };
      mockStore['dashview_onboarding_progress'] = JSON.stringify(savedState);

      // Create new store - should load saved state
      const newStore = new OnboardingStore();

      expect(newStore.currentStep).toBe(3);
      expect(newStore.completed).toEqual(savedState.completed);
      expect(newStore.wizardCompleted).toBe(false);

      newStore.destroy();
    });
  });

  describe('progress calculation', () => {
    it('should calculate 0% progress when no steps completed', () => {
      expect(store.progress).toBe(0);
    });

    it('should calculate correct progress percentage', () => {
      store.markComplete('welcome');
      expect(store.progress).toBe(14); // 1/7 ≈ 14%

      store.markComplete('floorOrder');
      expect(store.progress).toBe(29); // 2/7 ≈ 29%

      store.markComplete('roomOrder');
      expect(store.progress).toBe(43); // 3/7 ≈ 43%
    });

    it('should calculate 100% when all steps completed', () => {
      WIZARD_STEPS.forEach(step => store.markComplete(step));
      expect(store.progress).toBe(100);
    });
  });

  describe('step navigation', () => {
    it('should return correct current step name', () => {
      expect(store.currentStepName).toBe('welcome');

      store.goToStep(2);
      expect(store.currentStepName).toBe('roomOrder');
    });

    it('should move to next step', () => {
      expect(store.currentStep).toBe(0);

      const moved = store.nextStep();

      expect(moved).toBe(true);
      expect(store.currentStep).toBe(1);
      expect(store.currentStepName).toBe('floorOrder');
    });

    it('should mark current step complete when moving forward', () => {
      store.nextStep();
      expect(store.isStepComplete('welcome')).toBe(true);
    });

    it('should not move past last step', () => {
      // Go to last step
      store.goToStep(store.steps.length - 1);

      const moved = store.nextStep();

      expect(moved).toBe(false);
      expect(store.currentStep).toBe(store.steps.length - 1);
    });

    it('should move to previous step', () => {
      store.goToStep(2);
      expect(store.currentStep).toBe(2);

      const moved = store.prevStep();

      expect(moved).toBe(true);
      expect(store.currentStep).toBe(1);
    });

    it('should not move before first step', () => {
      expect(store.currentStep).toBe(0);

      const moved = store.prevStep();

      expect(moved).toBe(false);
      expect(store.currentStep).toBe(0);
    });

    it('should go to specific step by index', () => {
      store.goToStep(4);
      expect(store.currentStep).toBe(4);
      expect(store.currentStepName).toBe('roomConfig');
    });

    it('should go to specific step by name', () => {
      store.goToStepByName('labels');
      expect(store.currentStep).toBe(3);
    });

    it('should identify first and last steps', () => {
      expect(store.isFirstStep).toBe(true);
      expect(store.isLastStep).toBe(false);

      store.goToStep(store.steps.length - 1);

      expect(store.isFirstStep).toBe(false);
      expect(store.isLastStep).toBe(true);
    });
  });

  describe('step completion', () => {
    it('should mark step as complete', () => {
      expect(store.isStepComplete('welcome')).toBe(false);

      store.markComplete('welcome');

      expect(store.isStepComplete('welcome')).toBe(true);
      expect(store.completed.welcome).toBe(true);
    });

    it('should mark step as incomplete', () => {
      store.markComplete('welcome');
      expect(store.isStepComplete('welcome')).toBe(true);

      store.markIncomplete('welcome');

      expect(store.isStepComplete('welcome')).toBe(false);
    });

    it('should warn on unknown step', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      store.markComplete('unknown-step');

      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown wizard step'));
      warnSpy.mockRestore();
    });
  });

  describe('skip functionality', () => {
    it('should identify skippable steps', () => {
      // Currently no steps are skippable
      expect(store.canSkip('welcome')).toBe(false);
      expect(store.canSkip('floorOrder')).toBe(false);
      expect(store.canSkip('roomOrder')).toBe(false);
      expect(store.canSkip('labels')).toBe(false);
      expect(store.canSkip('roomConfig')).toBe(false);
      expect(store.canSkip('floorCards')).toBe(false);
      expect(store.canSkip('review')).toBe(false);
    });

    it('should not skip non-skippable step', () => {
      store.goToStepByName('floorOrder');
      const originalStep = store.currentStep;

      const skipped = store.skipStep();

      expect(skipped).toBe(false);
      expect(store.currentStep).toBe(originalStep);
    });
  });

  describe('first run detection', () => {
    it('should return true for first run when no settings exist', () => {
      expect(store.isFirstRun()).toBe(true);
    });

    it('should return false when wizard was completed', () => {
      // Set data directly in mockStore
      mockStore['dashview_onboarding_completed'] = 'true';

      // Create new store to pick up the flag
      const newStore = new OnboardingStore();

      expect(newStore.isFirstRun()).toBe(false);
      newStore.destroy();
    });

    it('should return false when settings exist with enabled rooms', () => {
      // Set data directly in mockStore (not via mock function)
      mockStore['dashview_settings'] = JSON.stringify({
        enabledRooms: { 'room1': true }
      });

      const newStore = new OnboardingStore();

      expect(newStore.isFirstRun()).toBe(false);
      newStore.destroy();
    });

    it('should determine if wizard should show', () => {
      expect(store.shouldShowWizard()).toBe(true);

      store.completeWizard();

      expect(store.shouldShowWizard()).toBe(false);
    });
  });

  describe('wizard completion', () => {
    it('should complete wizard and mark all steps done', () => {
      store.completeWizard();

      expect(store.wizardCompleted).toBe(true);
      expect(store.progress).toBe(100);
      WIZARD_STEPS.forEach(step => {
        expect(store.isStepComplete(step)).toBe(true);
      });
    });

    it('should persist completion flag to localStorage', () => {
      store.completeWizard();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dashview_onboarding_completed',
        'true'
      );
    });
  });

  describe('reset', () => {
    it('should reset all state', () => {
      // Setup some state
      store.goToStep(3);
      store.markComplete('welcome');
      store.markComplete('floorOrder');

      store.reset();

      expect(store.currentStep).toBe(0);
      expect(store.completed).toEqual({});
      expect(store.wizardCompleted).toBe(false);
    });

    it('should clear localStorage', () => {
      store.reset();

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('dashview_onboarding_progress');
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('dashview_onboarding_completed');
    });
  });

  describe('localStorage persistence', () => {
    it('should persist progress on step changes', () => {
      store.nextStep();

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'dashview_onboarding_progress',
        expect.any(String)
      );

      // Read from mockStore which is updated by the setItem mock
      const savedData = JSON.parse(mockStore['dashview_onboarding_progress']);

      expect(savedData.currentStep).toBe(1);
      expect(savedData.completed.welcome).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      const originalSetItem = localStorageMock.setItem;
      localStorageMock.setItem = vi.fn(() => { throw new Error('Storage full'); });

      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Should not throw
      store.nextStep();

      expect(warnSpy).toHaveBeenCalled();
      expect(warnSpy.mock.calls.some(call =>
        call[0] && call[0].includes('Failed to persist')
      )).toBe(true);

      localStorageMock.setItem = originalSetItem;
      warnSpy.mockRestore();
    });

    it('should restore progress after browser refresh simulation', () => {
      // Simulate first session
      store.goToStep(3);
      store.markComplete('welcome');
      store.markComplete('floorOrder');
      store.markComplete('roomOrder');

      // Simulate browser refresh - create new store
      const newStore = new OnboardingStore();

      expect(newStore.currentStep).toBe(3);
      expect(newStore.isStepComplete('welcome')).toBe(true);
      expect(newStore.isStepComplete('floorOrder')).toBe(true);
      expect(newStore.isStepComplete('roomOrder')).toBe(true);

      newStore.destroy();
    });
  });

  describe('subscriptions', () => {
    it('should notify listeners on step changes', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.nextStep();

      expect(listener).toHaveBeenCalledWith('stepCompleted', 'welcome');
      expect(listener).toHaveBeenCalledWith('stepChanged', 1);
    });

    it('should notify on wizard completion', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.completeWizard();

      expect(listener).toHaveBeenCalledWith('wizardCompleted', true);
    });

    it('should notify on reset', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.reset();

      expect(listener).toHaveBeenCalledWith('reset', true);
    });

    it('should allow unsubscribing', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store.nextStep();

      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => { throw new Error('Listener error'); });
      const goodListener = vi.fn();

      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.subscribe(errorListener);
      store.subscribe(goodListener);

      store.nextStep();

      // Good listener should still be called
      expect(goodListener).toHaveBeenCalled();
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe('singleton pattern', () => {
    it('should return same instance from getOnboardingStore', () => {
      resetOnboardingStore();

      const store1 = getOnboardingStore();
      const store2 = getOnboardingStore();

      expect(store1).toBe(store2);

      resetOnboardingStore();
    });

    it('should reset singleton with resetOnboardingStore', () => {
      const store1 = getOnboardingStore();
      store1.goToStep(3);

      resetOnboardingStore();

      // Clear localStorage to simulate fresh start (since reset doesn't clear persistence)
      mockStore = {};

      const store2 = getOnboardingStore();

      expect(store2).not.toBe(store1);
      expect(store2.currentStep).toBe(0); // Fresh instance with no localStorage data
    });
  });
});
