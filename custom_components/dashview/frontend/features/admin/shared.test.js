/**
 * Tests for admin shared utilities - section state persistence
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getAdminSectionStates,
  saveAdminSectionState,
  isSectionExpanded,
  clearSectionStatesCache,
  createSectionHelpers,
  initializeSectionStates
} from './shared.js';

describe('Admin Section State Persistence', () => {
  let mockLocalStorage;
  let originalLocalStorage;

  beforeEach(() => {
    // Clear cache before each test
    clearSectionStatesCache();

    // Create mock localStorage
    mockLocalStorage = {
      store: {},
      getItem: vi.fn((key) => mockLocalStorage.store[key] || null),
      setItem: vi.fn((key, value) => { mockLocalStorage.store[key] = value; }),
      removeItem: vi.fn((key) => { delete mockLocalStorage.store[key]; }),
      clear: vi.fn(() => { mockLocalStorage.store = {}; })
    };

    // Replace global localStorage
    originalLocalStorage = global.localStorage;
    Object.defineProperty(global, 'localStorage', {
      value: mockLocalStorage,
      configurable: true,
      writable: true
    });
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(global, 'localStorage', {
      value: originalLocalStorage,
      configurable: true,
      writable: true
    });
    vi.useRealTimers();
  });

  describe('getAdminSectionStates', () => {
    it('returns empty object when no saved state exists', () => {
      const states = getAdminSectionStates();
      expect(states).toEqual({});
    });

    it('returns parsed JSON from localStorage', () => {
      mockLocalStorage.store['dashview_admin_expanded_sections'] = JSON.stringify({
        labelConfig: true,
        entityConfig: false
      });

      const states = getAdminSectionStates();
      expect(states).toEqual({
        labelConfig: true,
        entityConfig: false
      });
    });

    it('caches the result for subsequent calls', () => {
      mockLocalStorage.store['dashview_admin_expanded_sections'] = JSON.stringify({ test: true });

      getAdminSectionStates();
      getAdminSectionStates();

      // localStorage.getItem should only be called once due to caching
      expect(mockLocalStorage.getItem).toHaveBeenCalledTimes(1);
    });

    it('handles corrupted JSON gracefully', () => {
      mockLocalStorage.store['dashview_admin_expanded_sections'] = 'invalid json{';

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const states = getAdminSectionStates();

      expect(states).toEqual({});
      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });

  describe('saveAdminSectionState', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('saves section state to localStorage after debounce', () => {
      saveAdminSectionState('testSection', true);

      // Should not save immediately
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Advance timer past debounce
      vi.advanceTimersByTime(500);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'dashview_admin_expanded_sections',
        JSON.stringify({ testSection: true })
      );
    });

    it('accumulates multiple changes before saving', () => {
      saveAdminSectionState('section1', true);
      vi.advanceTimersByTime(200);
      saveAdminSectionState('section2', false);
      vi.advanceTimersByTime(200);
      saveAdminSectionState('section3', true);

      // Should not have saved yet
      expect(mockLocalStorage.setItem).not.toHaveBeenCalled();

      // Advance past final debounce
      vi.advanceTimersByTime(500);

      expect(mockLocalStorage.setItem).toHaveBeenCalledTimes(1);
      const savedValue = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
      expect(savedValue).toEqual({
        section1: true,
        section2: false,
        section3: true
      });
    });

    it('handles localStorage write failure gracefully', () => {
      mockLocalStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
      saveAdminSectionState('test', true);
      vi.advanceTimersByTime(500);

      expect(consoleWarn).toHaveBeenCalled();
      consoleWarn.mockRestore();
    });
  });

  describe('isSectionExpanded', () => {
    it('returns default state when no saved state exists', () => {
      expect(isSectionExpanded('unknown', false)).toBe(false);
      expect(isSectionExpanded('unknown', true)).toBe(true);
    });

    it('returns saved state when it exists', () => {
      mockLocalStorage.store['dashview_admin_expanded_sections'] = JSON.stringify({
        expandedSection: true,
        collapsedSection: false
      });

      expect(isSectionExpanded('expandedSection', false)).toBe(true);
      expect(isSectionExpanded('collapsedSection', true)).toBe(false);
    });

    it('defaults to false when no default is provided', () => {
      expect(isSectionExpanded('unknown')).toBe(false);
    });
  });

  describe('createSectionHelpers', () => {
    let mockPanel;

    beforeEach(() => {
      vi.useFakeTimers();
      mockPanel = {
        _expandedCardSections: {},
        requestUpdate: vi.fn()
      };
    });

    it('toggleSection toggles section state', () => {
      const { toggleSection } = createSectionHelpers(mockPanel);

      toggleSection('testSection');

      expect(mockPanel._expandedCardSections.testSection).toBe(true);
      expect(mockPanel.requestUpdate).toHaveBeenCalled();
    });

    it('toggleSection persists state to localStorage', () => {
      const { toggleSection } = createSectionHelpers(mockPanel);

      toggleSection('testSection');
      vi.advanceTimersByTime(500);

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'dashview_admin_expanded_sections',
        expect.stringContaining('testSection')
      );
    });

    it('isExpanded returns panel state when available', () => {
      mockPanel._expandedCardSections = { knownSection: true };
      const { isExpanded } = createSectionHelpers(mockPanel);

      expect(isExpanded('knownSection')).toBe(true);
    });

    it('isExpanded falls back to localStorage when panel state is not set', () => {
      mockLocalStorage.store['dashview_admin_expanded_sections'] = JSON.stringify({
        savedSection: true
      });
      clearSectionStatesCache(); // Clear cache to pick up new localStorage value

      const { isExpanded } = createSectionHelpers(mockPanel);

      expect(isExpanded('savedSection', false)).toBe(true);
    });

    it('isExpanded uses default when section not in panel or localStorage', () => {
      const { isExpanded } = createSectionHelpers(mockPanel);

      expect(isExpanded('unknownSection', true)).toBe(true);
      expect(isExpanded('unknownSection', false)).toBe(false);
    });
  });

  describe('initializeSectionStates', () => {
    it('loads saved states into panel._expandedCardSections', () => {
      mockLocalStorage.store['dashview_admin_expanded_sections'] = JSON.stringify({
        section1: true,
        section2: false
      });
      clearSectionStatesCache();

      const panel = { _expandedCardSections: {} };
      initializeSectionStates(panel);

      expect(panel._expandedCardSections).toEqual({
        section1: true,
        section2: false
      });
    });

    it('preserves existing panel state while adding saved states', () => {
      mockLocalStorage.store['dashview_admin_expanded_sections'] = JSON.stringify({
        savedSection: true
      });
      clearSectionStatesCache();

      const panel = { _expandedCardSections: { existingSection: false } };
      initializeSectionStates(panel);

      expect(panel._expandedCardSections).toEqual({
        existingSection: false,
        savedSection: true
      });
    });

    it('handles empty localStorage gracefully', () => {
      const panel = { _expandedCardSections: { existing: true } };
      initializeSectionStates(panel);

      expect(panel._expandedCardSections).toEqual({ existing: true });
    });
  });
});
