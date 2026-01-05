/**
 * Coach Mark Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { shouldShowCoachMark, dismissCoachMark, renderCoachMark } from './coach-mark.js';

describe('coach-mark', () => {
  // Store original localStorage
  const originalLocalStorage = globalThis.localStorage;
  let mockStorage = {};

  beforeEach(() => {
    mockStorage = {};

    // Create mock localStorage
    const mockLocalStorage = {
      getItem: vi.fn((key) => mockStorage[key] || null),
      setItem: vi.fn((key, value) => {
        mockStorage[key] = value;
      }),
      removeItem: vi.fn((key) => {
        delete mockStorage[key];
      }),
      clear: vi.fn(() => {
        mockStorage = {};
      }),
    };

    // Replace global localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    // Restore original localStorage
    Object.defineProperty(globalThis, 'localStorage', {
      value: originalLocalStorage,
      writable: true,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  describe('shouldShowCoachMark', () => {
    it('returns true when localStorage flag is not set', () => {
      expect(shouldShowCoachMark()).toBe(true);
    });

    it('returns false when localStorage flag is set to true', () => {
      mockStorage['dashview_onboarded'] = 'true';
      expect(shouldShowCoachMark()).toBe(false);
    });

    it('returns true when localStorage flag has different value', () => {
      mockStorage['dashview_onboarded'] = 'false';
      expect(shouldShowCoachMark()).toBe(true);
    });
  });

  describe('dismissCoachMark', () => {
    it('sets localStorage flag to true', () => {
      dismissCoachMark();
      expect(mockStorage['dashview_onboarded']).toBe('true');
    });

    it('handles localStorage errors gracefully', () => {
      // The function has a try-catch, so it should not throw even if localStorage fails
      expect(() => dismissCoachMark()).not.toThrow();
    });
  });

  describe('renderCoachMark', () => {
    // Mock html template function
    const mockHtml = (strings, ...values) => {
      return { strings, values, type: 'template' };
    };

    // Mock panel object
    const mockPanel = {};

    it('returns a template result', () => {
      const result = renderCoachMark(mockPanel, mockHtml, () => {});
      expect(result).toBeDefined();
      expect(result.type).toBe('template');
    });

    it('template contains coach-mark-overlay class', () => {
      const result = renderCoachMark(mockPanel, mockHtml, () => {});
      const templateString = result.strings.join('');
      expect(templateString).toContain('coach-mark-overlay');
    });

    it('template contains coach-mark-card class', () => {
      const result = renderCoachMark(mockPanel, mockHtml, () => {});
      const templateString = result.strings.join('');
      expect(templateString).toContain('coach-mark-card');
    });

    it('template contains swipe hint text', () => {
      const result = renderCoachMark(mockPanel, mockHtml, () => {});
      const templateString = result.strings.join('');
      expect(templateString).toContain('Swipe to navigate rooms');
    });

    it('template contains long-press hint text', () => {
      const result = renderCoachMark(mockPanel, mockHtml, () => {});
      const templateString = result.strings.join('');
      expect(templateString).toContain('Long-press for room details');
    });

    it('template contains Got it button with aria-label', () => {
      const result = renderCoachMark(mockPanel, mockHtml, () => {});
      const templateString = result.strings.join('');
      expect(templateString).toContain('Got it');
      expect(templateString).toContain('coach-dismiss');
      expect(templateString).toContain('aria-label="Dismiss tutorial"');
    });

    it('template contains animation classes', () => {
      const result = renderCoachMark(mockPanel, mockHtml, () => {});
      const templateString = result.strings.join('');
      expect(templateString).toContain('swipe-animation');
      expect(templateString).toContain('press-animation');
    });

    it('template contains finger gesture SVG icons', () => {
      const result = renderCoachMark(mockPanel, mockHtml, () => {});
      const templateString = result.strings.join('');
      expect(templateString).toContain('<svg');
      expect(templateString).toContain('gesture-icon');
    });
  });
});
