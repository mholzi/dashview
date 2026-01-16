/**
 * Gesture Handler Utility
 * Unified gesture detection for tap, slide, and long-press interactions.
 *
 * State Machine:
 *   IDLE → TOUCHING → (TAP | SLIDING | LONG_PRESS)
 *
 * Thresholds:
 *   - TAP: <200ms duration AND <10px movement
 *   - SLIDE: >10px horizontal movement
 *   - LONG_PRESS: >500ms duration AND <10px movement
 *
 * Usage:
 *   import { createGestureHandler } from './gesture-handler.js';
 *
 *   const gesture = createGestureHandler({
 *     onTap: () => toggleLight(),
 *     onSlideStart: () => startDrag(),
 *     onSlideMove: (deltaX, percentage) => updateBrightness(percentage),
 *     onSlideEnd: (percentage) => applyBrightness(percentage),
 *     onLongPress: () => openMoreInfo(),
 *   });
 */

/** Gesture states */
export const GESTURE_STATE = {
  IDLE: 'IDLE',
  TOUCHING: 'TOUCHING',
  SLIDING: 'SLIDING',
  LONG_PRESSING: 'LONG_PRESSING',
  TAP_DETECTED: 'TAP_DETECTED',
};

/** Default configuration */
export const GESTURE_DEFAULTS = {
  tapDuration: 200,      // Max duration for tap (ms)
  longPressDuration: 500, // Duration for long press (ms)
  movementThreshold: 10,  // Pixels before slide detection
};

/**
 * Create a gesture handler with unified tap/slide/long-press detection.
 *
 * @param {Object} callbacks - Gesture callbacks
 * @param {Function} [callbacks.onTap] - Called on quick tap
 * @param {Function} [callbacks.onSlideStart] - Called when slide begins
 * @param {Function} [callbacks.onSlideMove] - Called during slide (deltaX, percentage, event)
 * @param {Function} [callbacks.onSlideEnd] - Called when slide ends (percentage)
 * @param {Function} [callbacks.onLongPress] - Called on long press
 * @param {Object} [options] - Configuration options
 * @param {number} [options.tapDuration=200] - Max tap duration in ms
 * @param {number} [options.longPressDuration=500] - Long press duration in ms
 * @param {number} [options.movementThreshold=10] - Movement threshold in px
 * @param {Function} [options.getPercentage] - Function to calculate percentage from position
 * @returns {Object} Event handlers object
 */
export function createGestureHandler(callbacks = {}, options = {}) {
  const {
    onTap = null,
    onSlideStart = null,
    onSlideMove = null,
    onSlideEnd = null,
    onLongPress = null,
  } = callbacks;

  const {
    tapDuration = GESTURE_DEFAULTS.tapDuration,
    longPressDuration = GESTURE_DEFAULTS.longPressDuration,
    movementThreshold = GESTURE_DEFAULTS.movementThreshold,
    getPercentage = null,
  } = options;

  // Internal state
  let state = GESTURE_STATE.IDLE;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let longPressTimer = null;
  let currentElement = null;
  let elementRect = null;

  /**
   * Clear the long press timer
   */
  function clearLongPressTimer() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  /**
   * Calculate percentage from X position
   * @param {number} clientX - Client X position
   * @returns {number} Percentage (0-100)
   */
  function calcPercentage(clientX) {
    if (getPercentage) {
      return getPercentage(clientX, elementRect);
    }
    if (!elementRect) return 0;
    const percentage = ((clientX - elementRect.left) / elementRect.width) * 100;
    return Math.max(0, Math.min(100, Math.round(percentage)));
  }

  /**
   * Reset to idle state
   */
  function reset() {
    state = GESTURE_STATE.IDLE;
    clearLongPressTimer();
    currentElement = null;
    elementRect = null;
  }

  /**
   * Start tracking a gesture
   * @param {Event} e - Touch or mouse event
   */
  function start(e) {
    if (state !== GESTURE_STATE.IDLE) return;

    const touch = e.touches?.[0] || e;
    startX = touch.clientX;
    startY = touch.clientY;
    startTime = Date.now();
    state = GESTURE_STATE.TOUCHING;

    // Store element reference for percentage calculation
    currentElement = e.currentTarget;
    elementRect = currentElement?.getBoundingClientRect();

    // Start long press timer
    clearLongPressTimer();
    longPressTimer = setTimeout(() => {
      if (state === GESTURE_STATE.TOUCHING) {
        state = GESTURE_STATE.LONG_PRESSING;
        if (onLongPress) {
          onLongPress();
        }
      }
    }, longPressDuration);
  }

  /**
   * Handle movement during gesture
   * @param {Event} e - Touch or mouse event
   */
  function move(e) {
    if (state === GESTURE_STATE.IDLE || state === GESTURE_STATE.LONG_PRESSING) {
      return;
    }

    const touch = e.touches?.[0] || e;
    const deltaX = touch.clientX - startX;
    const deltaY = touch.clientY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Check if we've moved enough to start sliding
    if (state === GESTURE_STATE.TOUCHING) {
      if (absDeltaX > movementThreshold || absDeltaY > movementThreshold) {
        // Cancel long press
        clearLongPressTimer();

        // Only enter sliding if horizontal movement is dominant
        if (absDeltaX > absDeltaY) {
          state = GESTURE_STATE.SLIDING;
          if (onSlideStart) {
            onSlideStart();
          }
        } else {
          // Vertical movement - cancel gesture (allow scrolling)
          reset();
          return;
        }
      }
    }

    // Handle sliding
    if (state === GESTURE_STATE.SLIDING) {
      e.preventDefault(); // Prevent scrolling during slide

      const percentage = calcPercentage(touch.clientX);
      if (onSlideMove) {
        onSlideMove(deltaX, percentage, e);
      }
    }
  }

  /**
   * End the gesture
   * @param {Event} e - Touch or mouse event
   */
  function end(e) {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const touch = e.changedTouches?.[0] || e;
    const deltaX = Math.abs(touch.clientX - startX);
    const deltaY = Math.abs(touch.clientY - startY);

    // Determine final gesture type
    if (state === GESTURE_STATE.TOUCHING) {
      clearLongPressTimer();

      // Short duration + no movement = tap
      if (duration < tapDuration && deltaX < movementThreshold && deltaY < movementThreshold) {
        if (onTap) {
          onTap();
        }
      }
    } else if (state === GESTURE_STATE.SLIDING) {
      const percentage = calcPercentage(touch.clientX);
      if (onSlideEnd) {
        onSlideEnd(percentage);
      }
    } else if (state === GESTURE_STATE.LONG_PRESSING) {
      // Long press already fired, prevent further events
      e.preventDefault();
      e.stopPropagation();
    }

    reset();
  }

  /**
   * Cancel the gesture
   */
  function cancel() {
    reset();
  }

  return {
    // Touch events
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onTouchCancel: cancel,

    // Mouse events
    onMouseDown: start,
    onMouseMove: move,
    onMouseUp: end,
    onMouseLeave: cancel,

    // State accessors
    getState: () => state,
    isSliding: () => state === GESTURE_STATE.SLIDING,
    reset,
  };
}

export default { createGestureHandler, GESTURE_STATE, GESTURE_DEFAULTS };
