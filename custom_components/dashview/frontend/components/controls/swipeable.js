/**
 * Swipeable Component
 * Provides swipe gesture handling for touch and mouse interactions
 */

import { triggerHaptic } from '../../utils/haptic.js';
import { THRESHOLDS } from '../../constants/index.js';

/**
 * @typedef {Object} SwipeHandlers
 * @property {Function} handleTouchStart - Touch start event handler
 * @property {Function} handleTouchMove - Touch move event handler
 * @property {Function} handleTouchEnd - Touch end event handler
 * @property {Function} handleMouseDown - Mouse down event handler
 * @property {Function} cleanup - Cleanup function to remove document listeners
 */

/**
 * Swipe handler factory - creates swipe handlers that persist state via element dataset
 * This solves the issue of local variables resetting on each render
 *
 * Mouse events are attached to document to handle drags that extend beyond element bounds
 *
 * @param {Function} onSwipeLeft - Callback for left swipe
 * @param {Function} onSwipeRight - Callback for right swipe
 * @param {number} [threshold] - Minimum swipe distance to trigger (default from THRESHOLDS.SWIPE_DISTANCE)
 * @returns {SwipeHandlers} Object containing all swipe event handlers
 */
export function createSwipeHandlers(onSwipeLeft, onSwipeRight, threshold = THRESHOLDS.SWIPE_DISTANCE) {
  // Track the active element for document-level mouse events
  let activeElement = null;

  // Document-level mouse move handler
  const documentMouseMove = (e) => {
    if (activeElement && activeElement.dataset.swipeDragging === 'true') {
      activeElement.dataset.swipeEndX = e.clientX;
    }
  };

  // Document-level mouse up handler
  const documentMouseUp = (e) => {
    if (activeElement && activeElement.dataset.swipeDragging === 'true') {
      activeElement.dataset.swipeDragging = 'false';
      const startX = parseFloat(activeElement.dataset.swipeStartX) || 0;
      const endX = parseFloat(activeElement.dataset.swipeEndX) || 0;
      const diff = startX - endX;

      if (Math.abs(diff) > threshold) {
        triggerHaptic('light');
        if (diff > 0) {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }
      }

      // Cleanup document listeners
      document.removeEventListener('mousemove', documentMouseMove);
      document.removeEventListener('mouseup', documentMouseUp);
      activeElement = null;
    }
  };

  return {
    handleTouchStart: (e) => {
      const el = e.currentTarget;
      el.dataset.swipeStartX = e.touches[0].clientX;
      el.dataset.swipeEndX = e.touches[0].clientX;
    },

    handleTouchMove: (e) => {
      const el = e.currentTarget;
      el.dataset.swipeEndX = e.touches[0].clientX;
    },

    handleTouchEnd: (e) => {
      const el = e.currentTarget;
      const startX = parseFloat(el.dataset.swipeStartX) || 0;
      const endX = parseFloat(el.dataset.swipeEndX) || 0;
      const diff = startX - endX;

      if (Math.abs(diff) > threshold) {
        triggerHaptic('light');
        if (diff > 0) {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }
      }
    },

    handleMouseDown: (e) => {
      const el = e.currentTarget;
      activeElement = el;
      el.dataset.swipeDragging = 'true';
      el.dataset.swipeStartX = e.clientX;
      el.dataset.swipeEndX = e.clientX;
      e.preventDefault();

      // Attach document-level listeners for mouse tracking beyond element bounds
      document.addEventListener('mousemove', documentMouseMove);
      document.addEventListener('mouseup', documentMouseUp);
    },

    /**
     * Cleanup function - call when component is disconnected
     */
    cleanup: () => {
      document.removeEventListener('mousemove', documentMouseMove);
      document.removeEventListener('mouseup', documentMouseUp);
      activeElement = null;
    }
  };
}

/**
 * @typedef {Object} SwipeableOptions
 * @property {Function} onSwipeLeft - Callback for left swipe
 * @property {Function} onSwipeRight - Callback for right swipe
 * @property {number} [threshold] - Minimum swipe distance (default from THRESHOLDS.SWIPE_DISTANCE)
 * @property {string} [className] - Additional CSS class
 * @property {TemplateResult} content - Content to render inside
 */

/**
 * Render a swipeable container with all event handlers attached
 * @param {Function} html - lit-html template function
 * @param {SwipeableOptions} options - Swipeable options
 * @returns {TemplateResult} Swipeable container HTML
 */
export function renderSwipeable(html, {
  onSwipeLeft,
  onSwipeRight,
  threshold = THRESHOLDS.SWIPE_DISTANCE,
  className = '',
  content
}) {
  const handlers = createSwipeHandlers(onSwipeLeft, onSwipeRight, threshold);

  return html`
    <div
      class="swipeable ${className}"
      @touchstart=${handlers.handleTouchStart}
      @touchmove=${handlers.handleTouchMove}
      @touchend=${handlers.handleTouchEnd}
      @mousedown=${handlers.handleMouseDown}
    >
      ${content}
    </div>
  `;
}
