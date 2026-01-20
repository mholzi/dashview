/**
 * Haptic Feedback Utility Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock navigator.vibrate
const mockVibrate = vi.fn();

describe('Haptic Utilities', () => {
  let originalVibrate;
  let originalUserAgent;

  beforeEach(() => {
    // Save originals
    originalVibrate = navigator.vibrate;
    originalUserAgent = navigator.userAgent;

    // Setup mock
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    });

    mockVibrate.mockClear();
  });

  afterEach(() => {
    // Restore originals
    Object.defineProperty(navigator, 'vibrate', {
      value: originalVibrate,
      writable: true,
      configurable: true,
    });
  });

  describe('triggerHaptic', () => {
    it('should trigger light vibration by default', async () => {
      const { triggerHaptic } = await import('./haptic.js');
      triggerHaptic();
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should trigger light vibration for "light" type', async () => {
      const { triggerHaptic } = await import('./haptic.js');
      triggerHaptic('light');
      expect(mockVibrate).toHaveBeenCalledWith(10);
    });

    it('should trigger medium vibration for "medium" type', async () => {
      const { triggerHaptic } = await import('./haptic.js');
      triggerHaptic('medium');
      expect(mockVibrate).toHaveBeenCalledWith(20);
    });

    it('should trigger heavy vibration for "heavy" type', async () => {
      const { triggerHaptic } = await import('./haptic.js');
      triggerHaptic('heavy');
      expect(mockVibrate).toHaveBeenCalledWith(30);
    });

    it('should trigger selection pattern for "selection" type', async () => {
      const { triggerHaptic } = await import('./haptic.js');
      triggerHaptic('selection');
      expect(mockVibrate).toHaveBeenCalledWith([5, 5, 5]);
    });

    it('should not throw when vibrate is not supported', async () => {
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      const { triggerHaptic } = await import('./haptic.js');
      expect(() => triggerHaptic()).not.toThrow();
    });
  });

  describe('hapticSuccess', () => {
    it('should trigger success pattern', async () => {
      const { hapticSuccess } = await import('./haptic.js');
      hapticSuccess();
      expect(mockVibrate).toHaveBeenCalledWith([10, 50, 10]);
    });
  });

  describe('hapticWarning', () => {
    it('should trigger warning pattern', async () => {
      const { hapticWarning } = await import('./haptic.js');
      hapticWarning();
      expect(mockVibrate).toHaveBeenCalledWith([30, 30, 30]);
    });
  });

  describe('hapticLongPress', () => {
    it('should trigger long press pattern', async () => {
      const { hapticLongPress } = await import('./haptic.js');
      hapticLongPress();
      expect(mockVibrate).toHaveBeenCalledWith(25);
    });
  });

  describe('isHapticSupported', () => {
    it('should return true when vibrate is available', async () => {
      const { isHapticSupported } = await import('./haptic.js');
      expect(isHapticSupported()).toBe(true);
    });

    it('should return false when vibrate is not available', async () => {
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      });

      // Re-import to get fresh module state
      vi.resetModules();
      const { isHapticSupported } = await import('./haptic.js');
      expect(isHapticSupported()).toBe(false);
    });
  });

  describe('graceful degradation', () => {
    it('should handle vibrate throwing an error gracefully', async () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration not allowed');
      });

      const { triggerHaptic } = await import('./haptic.js');
      expect(() => triggerHaptic()).not.toThrow();
    });

    it('should handle all haptic functions when vibrate throws', async () => {
      mockVibrate.mockImplementation(() => {
        throw new Error('Vibration not allowed');
      });

      const { hapticSuccess, hapticWarning, hapticLongPress } = await import('./haptic.js');

      expect(() => hapticSuccess()).not.toThrow();
      expect(() => hapticWarning()).not.toThrow();
      expect(() => hapticLongPress()).not.toThrow();
    });
  });
});
