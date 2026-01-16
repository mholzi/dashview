/**
 * Long Press Handlers Utility Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createLongPressHandlers,
  DEFAULT_LONG_PRESS_DURATION,
  DEFAULT_MOVEMENT_THRESHOLD
} from './long-press-handlers.js';

describe('long-press-handlers', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('createLongPressHandlers', () => {
    it('calls onLongPress after duration (touch)', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      expect(onLongPress).not.toHaveBeenCalled();

      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      expect(onLongPress).toHaveBeenCalledOnce();
      expect(onTap).not.toHaveBeenCalled();
    });

    it('calls onLongPress after duration (mouse)', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onMouseDown({ clientX: 0, clientY: 0 });
      expect(onLongPress).not.toHaveBeenCalled();

      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      expect(onLongPress).toHaveBeenCalledOnce();
      expect(onTap).not.toHaveBeenCalled();
    });

    it('calls onTap on short press (touch)', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      vi.advanceTimersByTime(100); // Short press
      handlers.onTouchEnd({ preventDefault: vi.fn(), stopPropagation: vi.fn() });

      expect(onTap).toHaveBeenCalledOnce();
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('calls onTap on short press (mouse)', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onMouseDown({ clientX: 0, clientY: 0 });
      vi.advanceTimersByTime(100);
      handlers.onMouseUp({ preventDefault: vi.fn(), stopPropagation: vi.fn() });

      expect(onTap).toHaveBeenCalledOnce();
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('cancels on movement beyond threshold (touch)', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      handlers.onTouchMove({ touches: [{ clientX: DEFAULT_MOVEMENT_THRESHOLD + 5, clientY: 0 }] });

      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('cancels on movement beyond threshold (mouse)', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onMouseDown({ clientX: 0, clientY: 0 });
      handlers.onMouseMove({ clientX: DEFAULT_MOVEMENT_THRESHOLD + 5, clientY: 0 });

      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('does not cancel on movement within threshold', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      handlers.onTouchMove({ touches: [{ clientX: 5, clientY: 5 }] }); // Within threshold

      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      expect(onLongPress).toHaveBeenCalledOnce();
    });

    it('cancels on touchCancel', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      handlers.onTouchCancel();

      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('cancels on mouseLeave', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onMouseDown({ clientX: 0, clientY: 0 });
      handlers.onMouseLeave();

      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      expect(onLongPress).not.toHaveBeenCalled();
    });

    it('prevents default and stops propagation after long press', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);

      const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
      handlers.onTouchEnd(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(mockEvent.stopPropagation).toHaveBeenCalled();
    });

    it('does not prevent default on short tap', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      vi.advanceTimersByTime(100);

      const mockEvent = { preventDefault: vi.fn(), stopPropagation: vi.fn() };
      handlers.onTouchEnd(mockEvent);

      expect(mockEvent.preventDefault).not.toHaveBeenCalled();
      expect(mockEvent.stopPropagation).not.toHaveBeenCalled();
    });

    it('respects custom duration option', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const customDuration = 1000;
      const handlers = createLongPressHandlers(onTap, onLongPress, { duration: customDuration });

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });

      vi.advanceTimersByTime(500);
      expect(onLongPress).not.toHaveBeenCalled();

      vi.advanceTimersByTime(500);
      expect(onLongPress).toHaveBeenCalledOnce();
    });

    it('respects custom threshold option', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const customThreshold = 20;
      const handlers = createLongPressHandlers(onTap, onLongPress, { threshold: customThreshold });

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      handlers.onTouchMove({ touches: [{ clientX: 15, clientY: 0 }] }); // Within custom threshold

      vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      expect(onLongPress).toHaveBeenCalledOnce();
    });

    it('handles null onTap gracefully', () => {
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(null, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      vi.advanceTimersByTime(100);

      // Should not throw
      expect(() => {
        handlers.onTouchEnd({ preventDefault: vi.fn(), stopPropagation: vi.fn() });
      }).not.toThrow();
    });

    it('handles null onLongPress gracefully', () => {
      const onTap = vi.fn();
      const handlers = createLongPressHandlers(onTap, null);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });

      // Should not throw
      expect(() => {
        vi.advanceTimersByTime(DEFAULT_LONG_PRESS_DURATION);
      }).not.toThrow();
    });

    it('returns all expected event handlers', () => {
      const handlers = createLongPressHandlers(vi.fn(), vi.fn());

      expect(handlers.onTouchStart).toBeInstanceOf(Function);
      expect(handlers.onTouchMove).toBeInstanceOf(Function);
      expect(handlers.onTouchEnd).toBeInstanceOf(Function);
      expect(handlers.onTouchCancel).toBeInstanceOf(Function);
      expect(handlers.onMouseDown).toBeInstanceOf(Function);
      expect(handlers.onMouseMove).toBeInstanceOf(Function);
      expect(handlers.onMouseUp).toBeInstanceOf(Function);
      expect(handlers.onMouseLeave).toBeInstanceOf(Function);
    });

    it('does not call tap after movement cancels the press', () => {
      const onTap = vi.fn();
      const onLongPress = vi.fn();
      const handlers = createLongPressHandlers(onTap, onLongPress);

      handlers.onTouchStart({ touches: [{ clientX: 0, clientY: 0 }] });
      handlers.onTouchMove({ touches: [{ clientX: 50, clientY: 0 }] }); // Beyond threshold
      handlers.onTouchEnd({ preventDefault: vi.fn(), stopPropagation: vi.fn() });

      expect(onTap).not.toHaveBeenCalled();
      expect(onLongPress).not.toHaveBeenCalled();
    });
  });

  describe('exported constants', () => {
    it('exports DEFAULT_LONG_PRESS_DURATION', () => {
      expect(DEFAULT_LONG_PRESS_DURATION).toBe(500);
    });

    it('exports DEFAULT_MOVEMENT_THRESHOLD', () => {
      expect(DEFAULT_MOVEMENT_THRESHOLD).toBe(10);
    });
  });
});
