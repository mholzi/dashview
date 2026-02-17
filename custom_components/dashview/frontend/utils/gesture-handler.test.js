/**
 * Gesture Handler Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGestureHandler, GESTURE_STATE, GESTURE_DEFAULTS } from './gesture-handler.js';

// Helper to create a mock element with getBoundingClientRect
function mockElement(rect = { left: 0, top: 0, width: 200, height: 50 }) {
  return { getBoundingClientRect: () => rect };
}

// Helper to create a mouse event
function mouseEvent(clientX = 0, clientY = 0, currentTarget = null) {
  const e = {
    clientX,
    clientY,
    currentTarget,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
  return e;
}

// Helper to create a touch event
function touchEvent(clientX = 0, clientY = 0, currentTarget = null, { changed = false } = {}) {
  const touch = { clientX, clientY };
  const e = {
    currentTarget,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
  if (changed) {
    e.changedTouches = [touch];
  } else {
    e.touches = [touch];
  }
  return e;
}

describe('Gesture Handler', () => {
  let callbacks;
  let element;

  beforeEach(() => {
    vi.useFakeTimers();
    callbacks = {
      onTap: vi.fn(),
      onSlideStart: vi.fn(),
      onSlideMove: vi.fn(),
      onSlideEnd: vi.fn(),
      onLongPress: vi.fn(),
    };
    element = mockElement();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any lingering document listeners
    document.removeEventListener('mousemove', vi.fn());
    document.removeEventListener('mouseup', vi.fn());
  });

  describe('initialization', () => {
    it('should return all expected event handlers', () => {
      const handler = createGestureHandler(callbacks);
      expect(handler.onTouchStart).toBeInstanceOf(Function);
      expect(handler.onTouchMove).toBeInstanceOf(Function);
      expect(handler.onTouchEnd).toBeInstanceOf(Function);
      expect(handler.onTouchCancel).toBeInstanceOf(Function);
      expect(handler.onMouseDown).toBeInstanceOf(Function);
      expect(handler.onMouseMove).toBeInstanceOf(Function);
      expect(handler.onMouseUp).toBeInstanceOf(Function);
      expect(handler.onMouseLeave).toBeInstanceOf(Function);
      expect(handler.getState).toBeInstanceOf(Function);
      expect(handler.isSliding).toBeInstanceOf(Function);
      expect(handler.reset).toBeInstanceOf(Function);
    });

    it('should start in IDLE state', () => {
      const handler = createGestureHandler(callbacks);
      expect(handler.getState()).toBe(GESTURE_STATE.IDLE);
    });

    it('should work with no callbacks', () => {
      const handler = createGestureHandler();
      expect(handler.getState()).toBe(GESTURE_STATE.IDLE);
    });
  });

  describe('tap detection', () => {
    it('should detect a quick tap (mouse)', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      handler.onMouseUp(mouseEvent(100, 100));
      expect(callbacks.onTap).toHaveBeenCalledOnce();
    });

    it('should detect a quick tap (touch)', () => {
      const handler = createGestureHandler(callbacks);
      handler.onTouchStart(touchEvent(100, 100, element));
      handler.onTouchEnd(touchEvent(100, 100, null, { changed: true }));
      expect(callbacks.onTap).toHaveBeenCalledOnce();
    });

    it('should not fire tap if duration exceeds tapDuration', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      vi.advanceTimersByTime(250);
      handler.onMouseUp(mouseEvent(100, 100));
      expect(callbacks.onTap).not.toHaveBeenCalled();
    });

    it('should not fire tap if movement exceeds threshold', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      handler.onMouseUp(mouseEvent(120, 100));
      expect(callbacks.onTap).not.toHaveBeenCalled();
    });

    it('should reset to IDLE after tap', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      handler.onMouseUp(mouseEvent(100, 100));
      expect(handler.getState()).toBe(GESTURE_STATE.IDLE);
    });
  });

  describe('slide detection', () => {
    it('should detect horizontal slide and fire callbacks', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      // Move past threshold horizontally
      handler.onMouseMove(mouseEvent(115, 100));
      expect(callbacks.onSlideStart).toHaveBeenCalledOnce();
      expect(handler.getState()).toBe(GESTURE_STATE.SLIDING);
      expect(handler.isSliding()).toBe(true);
    });

    it('should fire onSlideMove with deltaX and percentage', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(0, 100, element));
      handler.onMouseMove(mouseEvent(15, 100)); // past threshold
      handler.onMouseMove(mouseEvent(100, 100)); // 50% of 200px element
      expect(callbacks.onSlideMove).toHaveBeenCalledWith(100, 50, expect.any(Object));
    });

    it('should fire onSlideEnd with final percentage on mouseUp', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(0, 100, element));
      handler.onMouseMove(mouseEvent(15, 100));
      handler.onMouseUp(mouseEvent(150, 100));
      expect(callbacks.onSlideEnd).toHaveBeenCalledWith(75);
    });

    it('should not slide on vertical movement (allow scrolling)', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      handler.onMouseMove(mouseEvent(100, 115)); // vertical
      expect(callbacks.onSlideStart).not.toHaveBeenCalled();
      expect(handler.getState()).toBe(GESTURE_STATE.IDLE);
    });

    it('should clamp percentage to 0-100', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(0, 100, element));
      handler.onMouseMove(mouseEvent(15, 100));
      handler.onMouseUp(mouseEvent(-50, 100)); // past left edge
      expect(callbacks.onSlideEnd).toHaveBeenCalledWith(0);
    });

    it('should support custom getPercentage function', () => {
      const getPercentage = vi.fn().mockReturnValue(42);
      const handler = createGestureHandler(callbacks, { getPercentage });
      handler.onMouseDown(mouseEvent(0, 100, element));
      handler.onMouseMove(mouseEvent(15, 100));
      handler.onMouseUp(mouseEvent(100, 100));
      expect(getPercentage).toHaveBeenCalled();
      expect(callbacks.onSlideEnd).toHaveBeenCalledWith(42);
    });

    it('should preventDefault during slide to block scrolling', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(0, 100, element));
      const moveEvt = mouseEvent(15, 100);
      handler.onMouseMove(moveEvt);
      // The second move after entering SLIDING should preventDefault
      const moveEvt2 = mouseEvent(20, 100);
      handler.onMouseMove(moveEvt2);
      expect(moveEvt2.preventDefault).toHaveBeenCalled();
    });
  });

  describe('long press detection', () => {
    it('should detect long press after duration', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      vi.advanceTimersByTime(500);
      expect(callbacks.onLongPress).toHaveBeenCalledOnce();
      expect(handler.getState()).toBe(GESTURE_STATE.LONG_PRESSING);
    });

    it('should not fire long press if movement occurs', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      handler.onMouseMove(mouseEvent(115, 100)); // slide
      vi.advanceTimersByTime(500);
      expect(callbacks.onLongPress).not.toHaveBeenCalled();
    });

    it('should not fire long press if released early', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      vi.advanceTimersByTime(200);
      handler.onMouseUp(mouseEvent(100, 100));
      vi.advanceTimersByTime(500);
      expect(callbacks.onLongPress).not.toHaveBeenCalled();
    });

    it('should prevent default on end after long press', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      vi.advanceTimersByTime(500);
      const endEvt = mouseEvent(100, 100);
      handler.onMouseUp(endEvt);
      expect(endEvt.preventDefault).toHaveBeenCalled();
      expect(endEvt.stopPropagation).toHaveBeenCalled();
    });

    it('should support custom longPressDuration', () => {
      const handler = createGestureHandler(callbacks, { longPressDuration: 1000 });
      handler.onMouseDown(mouseEvent(100, 100, element));
      vi.advanceTimersByTime(500);
      expect(callbacks.onLongPress).not.toHaveBeenCalled();
      vi.advanceTimersByTime(500);
      expect(callbacks.onLongPress).toHaveBeenCalledOnce();
    });
  });

  describe('mouse leave during slide (issue #171)', () => {
    it('should NOT cancel an active slide on mouse leave', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(0, 100, element));
      handler.onMouseMove(mouseEvent(15, 100)); // start sliding
      expect(handler.isSliding()).toBe(true);

      handler.onMouseLeave();
      // Should still be sliding — document listeners take over
      expect(handler.isSliding()).toBe(true);
      expect(callbacks.onSlideEnd).not.toHaveBeenCalled();
    });

    it('should finalize slide via document mouseup after mouse leaves element', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');
      const removeSpy = vi.spyOn(document, 'removeEventListener');

      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(0, 100, element));
      handler.onMouseMove(mouseEvent(15, 100)); // start sliding

      // Document listeners should be attached
      expect(addSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(addSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

      // Simulate mouse leaving element
      handler.onMouseLeave();

      // Simulate mouseup on document (user releases outside element)
      const mouseUpHandler = addSpy.mock.calls.find(c => c[0] === 'mouseup')[1];
      mouseUpHandler(mouseEvent(180, 100));

      expect(callbacks.onSlideEnd).toHaveBeenCalledWith(90);
      expect(handler.getState()).toBe(GESTURE_STATE.IDLE);

      // Document listeners should be cleaned up
      expect(removeSpy).toHaveBeenCalledWith('mousemove', expect.any(Function));
      expect(removeSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));

      addSpy.mockRestore();
      removeSpy.mockRestore();
    });

    it('should continue tracking mousemove via document after leaving element', () => {
      const addSpy = vi.spyOn(document, 'addEventListener');

      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(0, 100, element));
      handler.onMouseMove(mouseEvent(15, 100)); // start sliding

      handler.onMouseLeave();

      // Simulate document-level mousemove
      const mouseMoveHandler = addSpy.mock.calls.find(c => c[0] === 'mousemove')[1];
      mouseMoveHandler(mouseEvent(100, 100));

      expect(callbacks.onSlideMove).toHaveBeenLastCalledWith(100, 50, expect.any(Object));

      addSpy.mockRestore();
    });

    it('should cancel gesture on mouse leave when NOT sliding', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      // Still in TOUCHING state (no significant movement)
      expect(handler.getState()).toBe(GESTURE_STATE.TOUCHING);

      handler.onMouseLeave();
      expect(handler.getState()).toBe(GESTURE_STATE.IDLE);
    });
  });

  describe('touch cancel', () => {
    it('should reset on touch cancel', () => {
      const handler = createGestureHandler(callbacks);
      handler.onTouchStart(touchEvent(100, 100, element));
      handler.onTouchCancel();
      expect(handler.getState()).toBe(GESTURE_STATE.IDLE);
    });
  });

  describe('state management', () => {
    it('should ignore start when not IDLE', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      expect(handler.getState()).toBe(GESTURE_STATE.TOUCHING);
      // Second start should be ignored
      handler.onMouseDown(mouseEvent(200, 200, element));
      expect(handler.getState()).toBe(GESTURE_STATE.TOUCHING);
    });

    it('should ignore move in IDLE state', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseMove(mouseEvent(100, 100));
      expect(callbacks.onSlideStart).not.toHaveBeenCalled();
      expect(callbacks.onSlideMove).not.toHaveBeenCalled();
    });

    it('should ignore move in LONG_PRESSING state', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      vi.advanceTimersByTime(500);
      expect(handler.getState()).toBe(GESTURE_STATE.LONG_PRESSING);
      handler.onMouseMove(mouseEvent(200, 100));
      expect(callbacks.onSlideStart).not.toHaveBeenCalled();
    });

    it('should reset properly via reset()', () => {
      const handler = createGestureHandler(callbacks);
      handler.onMouseDown(mouseEvent(100, 100, element));
      handler.reset();
      expect(handler.getState()).toBe(GESTURE_STATE.IDLE);
    });
  });

  describe('exports', () => {
    it('should export GESTURE_STATE enum', () => {
      expect(GESTURE_STATE.IDLE).toBe('IDLE');
      expect(GESTURE_STATE.TOUCHING).toBe('TOUCHING');
      expect(GESTURE_STATE.SLIDING).toBe('SLIDING');
      expect(GESTURE_STATE.LONG_PRESSING).toBe('LONG_PRESSING');
      expect(GESTURE_STATE.TAP_DETECTED).toBe('TAP_DETECTED');
    });

    it('should export GESTURE_DEFAULTS', () => {
      expect(GESTURE_DEFAULTS.tapDuration).toBe(200);
      expect(GESTURE_DEFAULTS.longPressDuration).toBe(500);
      expect(GESTURE_DEFAULTS.movementThreshold).toBe(10);
    });
  });
});
