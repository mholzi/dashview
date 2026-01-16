/**
 * Long Press Handlers Utility
 * Shared implementation for detecting long-press gestures with touch and mouse support.
 *
 * Usage:
 *   import { createLongPressHandlers } from './long-press-handlers.js';
 *
 *   const handlers = createLongPressHandlers(
 *     () => console.log('Tap'),
 *     () => console.log('Long press'),
 *     { duration: 500, threshold: 10 }
 *   );
 *
 *   html`<div
 *     @touchstart=${handlers.onTouchStart}
 *     @touchmove=${handlers.onTouchMove}
 *     @touchend=${handlers.onTouchEnd}
 *     @touchcancel=${handlers.onTouchCancel}
 *     @mousedown=${handlers.onMouseDown}
 *     @mousemove=${handlers.onMouseMove}
 *     @mouseup=${handlers.onMouseUp}
 *     @mouseleave=${handlers.onMouseLeave}
 *   />`
 */

/** Default long press duration in milliseconds */
export const DEFAULT_LONG_PRESS_DURATION = 500;

/** Default movement threshold in pixels before canceling long press */
export const DEFAULT_MOVEMENT_THRESHOLD = 10;

/**
 * Create long press handlers for an element.
 * Supports both touch and mouse events with configurable timing.
 *
 * @param {Function} onTap - Called on short tap (press and release before duration)
 * @param {Function} onLongPress - Called on long press (held for duration without moving)
 * @param {Object} [options] - Configuration options
 * @param {number} [options.duration=500] - Long press duration in ms
 * @param {number} [options.threshold=10] - Movement threshold in px before canceling
 * @returns {Object} Event handlers object
 */
export function createLongPressHandlers(onTap, onLongPress, options = {}) {
  const duration = options.duration ?? DEFAULT_LONG_PRESS_DURATION;
  const threshold = options.threshold ?? DEFAULT_MOVEMENT_THRESHOLD;

  let pressTimer = null;
  let isLongPress = false;
  let startX = 0;
  let startY = 0;

  /**
   * Clear the press timer if active
   */
  function clearTimer() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  /**
   * Start tracking a press event
   * @param {Event} e - The event object
   */
  function start(e) {
    isLongPress = false;
    const touch = e.touches?.[0] || e;
    startX = touch.clientX;
    startY = touch.clientY;

    clearTimer();
    pressTimer = setTimeout(() => {
      isLongPress = true;
      if (onLongPress) {
        onLongPress();
      }
    }, duration);
  }

  /**
   * Check movement and cancel if beyond threshold
   * @param {Event} e - The event object
   */
  function move(e) {
    if (!pressTimer) return;

    const touch = e.touches?.[0] || e;
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);

    // Cancel if moved more than threshold
    if (dx > threshold || dy > threshold) {
      clearTimer();
    }
  }

  /**
   * End the press, triggering tap if it wasn't a long press
   * @param {Event} e - The event object
   */
  function end(e) {
    if (pressTimer) {
      clearTimer();
      if (!isLongPress && onTap) {
        onTap();
      }
    }

    // Prevent click event after long press
    if (isLongPress) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  /**
   * Cancel the press tracking
   */
  function cancel() {
    clearTimer();
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
  };
}
