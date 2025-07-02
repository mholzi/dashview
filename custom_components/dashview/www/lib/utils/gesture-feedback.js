// custom_components/dashview/www/lib/utils/gesture-feedback.js

/**
 * GestureFeedbackManager - Lightweight utility for standardizing long-tap visual feedback
 * 
 * Provides consistent visual feedback for existing click handlers without requiring
 * full GestureDetector integration. This is designed for minimal integration with
 * existing components that already have working click functionality.
 */
export class GestureFeedbackManager {
  constructor(config = {}) {
    // Configuration options
    this.longTapDuration = config.longTapDuration || 500; // ms
    this.longTapTolerance = config.longTapTolerance || 10; // pixels
    this.enableVisualFeedback = config.enableVisualFeedback !== false; // default true
    
    // Track attached elements
    this._attachedElements = new Set();
    this._feedbackStates = new WeakMap();
    
    console.log('[GestureFeedbackManager] Initialized with config:', {
      longTapDuration: this.longTapDuration,
      longTapTolerance: this.longTapTolerance,
      enableVisualFeedback: this.enableVisualFeedback
    });
  }

  /**
   * Add gesture feedback to an existing clickable element
   * This preserves existing click handlers while adding visual feedback
   * @param {HTMLElement} element - Target element
   * @param {Object} options - Feedback options
   * @param {string} options.feedbackClass - Custom CSS class for feedback (optional)
   * @param {Function} options.onLongTapStart - Callback when long-tap starts (optional)
   */
  addFeedbackToElement(element, options = {}) {
    if (!element || this._attachedElements.has(element)) {
      return;
    }

    const feedbackClass = options.feedbackClass || 'gesture-detecting';
    const longPressClass = options.longPressClass || 'gesture-longpress';
    
    // Create feedback state for this element
    const feedbackState = {
      isTracking: false,
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      longTapTimer: null,
      isLongTap: false,
      feedbackClass,
      longPressClass,
      onLongTapStart: options.onLongTapStart
    };

    this._feedbackStates.set(element, feedbackState);

    // Create bound event handlers
    const handlers = {
      touchStart: this._handleTouchStart.bind(this, element),
      touchMove: this._handleTouchMove.bind(this, element),
      touchEnd: this._handleTouchEnd.bind(this, element),
      touchCancel: this._handleTouchCancel.bind(this, element),
      mouseDown: this._handleMouseDown.bind(this, element),
      mouseMove: this._handleMouseMove.bind(this, element),
      mouseUp: this._handleMouseUp.bind(this, element),
      mouseLeave: this._handleMouseLeave.bind(this, element)
    };

    // Store handlers on element for cleanup
    element._gestureFeedbackHandlers = handlers;

    // Attach event listeners (passive where possible)
    element.addEventListener('touchstart', handlers.touchStart, { passive: true });
    element.addEventListener('touchmove', handlers.touchMove, { passive: true });
    element.addEventListener('touchend', handlers.touchEnd, { passive: true });
    element.addEventListener('touchcancel', handlers.touchCancel, { passive: true });
    element.addEventListener('mousedown', handlers.mouseDown, { passive: true });
    element.addEventListener('mousemove', handlers.mouseMove, { passive: true });
    element.addEventListener('mouseup', handlers.mouseUp, { passive: true });
    element.addEventListener('mouseleave', handlers.mouseLeave, { passive: true });

    this._attachedElements.add(element);
    
    console.log('[GestureFeedbackManager] Added feedback to element:', element);
  }

  /**
   * Remove gesture feedback from an element
   * @param {HTMLElement} element - Target element
   */
  removeFeedbackFromElement(element) {
    if (!element || !this._attachedElements.has(element)) {
      return;
    }

    const feedbackState = this._feedbackStates.get(element);
    const handlers = element._gestureFeedbackHandlers;

    // Clean up any active timers
    if (feedbackState?.longTapTimer) {
      clearTimeout(feedbackState.longTapTimer);
    }

    // Remove visual feedback
    this._removeVisualFeedback(element);

    // Remove event listeners
    if (handlers) {
      element.removeEventListener('touchstart', handlers.touchStart);
      element.removeEventListener('touchmove', handlers.touchMove);
      element.removeEventListener('touchend', handlers.touchEnd);
      element.removeEventListener('touchcancel', handlers.touchCancel);
      element.removeEventListener('mousedown', handlers.mouseDown);
      element.removeEventListener('mousemove', handlers.mouseMove);
      element.removeEventListener('mouseup', handlers.mouseUp);
      element.removeEventListener('mouseleave', handlers.mouseLeave);
      delete element._gestureFeedbackHandlers;
    }

    // Clean up state
    this._attachedElements.delete(element);
    this._feedbackStates.delete(element);
    
    console.log('[GestureFeedbackManager] Removed feedback from element:', element);
  }

  /**
   * Handle touch start events
   */
  _handleTouchStart(element, event) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    this._startFeedback(element, touch.clientX, touch.clientY);
  }

  /**
   * Handle touch move events
   */
  _handleTouchMove(element, event) {
    if (event.touches.length !== 1) return;
    const touch = event.touches[0];
    this._updateFeedback(element, touch.clientX, touch.clientY);
  }

  /**
   * Handle touch end events
   */
  _handleTouchEnd(element, event) {
    this._endFeedback(element);
  }

  /**
   * Handle touch cancel events
   */
  _handleTouchCancel(element, event) {
    this._cancelFeedback(element);
  }

  /**
   * Handle mouse down events
   */
  _handleMouseDown(element, event) {
    if (event.button !== 0) return; // Only left mouse button
    this._startFeedback(element, event.clientX, event.clientY);
  }

  /**
   * Handle mouse move events
   */
  _handleMouseMove(element, event) {
    this._updateFeedback(element, event.clientX, event.clientY);
  }

  /**
   * Handle mouse up events
   */
  _handleMouseUp(element, event) {
    this._endFeedback(element);
  }

  /**
   * Handle mouse leave events
   */
  _handleMouseLeave(element, event) {
    this._cancelFeedback(element);
  }

  /**
   * Start feedback tracking
   */
  _startFeedback(element, x, y) {
    const feedbackState = this._feedbackStates.get(element);
    if (!feedbackState) return;

    // Reset state
    feedbackState.isTracking = true;
    feedbackState.startTime = Date.now();
    feedbackState.startPosition = { x, y };
    feedbackState.isLongTap = false;

    // Clear any existing timer
    if (feedbackState.longTapTimer) {
      clearTimeout(feedbackState.longTapTimer);
    }

    // Start visual feedback
    if (this.enableVisualFeedback) {
      this._addVisualFeedback(element, feedbackState.feedbackClass);
    }

    // Set long-tap timer
    feedbackState.longTapTimer = setTimeout(() => {
      if (feedbackState.isTracking) {
        feedbackState.isLongTap = true;
        
        // Update visual feedback
        if (this.enableVisualFeedback) {
          this._removeVisualFeedback(element);
          this._addVisualFeedback(element, feedbackState.longPressClass);
        }

        // Trigger long-tap start callback
        if (feedbackState.onLongTapStart) {
          feedbackState.onLongTapStart(element);
        }

        console.log('[GestureFeedbackManager] Long-tap visual feedback triggered:', element);
      }
    }, this.longTapDuration);
  }

  /**
   * Update feedback tracking (handle movement)
   */
  _updateFeedback(element, x, y) {
    const feedbackState = this._feedbackStates.get(element);
    if (!feedbackState?.isTracking) return;

    // Calculate movement distance
    const deltaX = x - feedbackState.startPosition.x;
    const deltaY = y - feedbackState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Cancel if moved too far
    if (distance > this.longTapTolerance) {
      this._cancelFeedback(element);
    }
  }

  /**
   * End feedback tracking
   */
  _endFeedback(element) {
    const feedbackState = this._feedbackStates.get(element);
    if (!feedbackState?.isTracking) return;

    // Clean up
    this._cleanupFeedback(element);
  }

  /**
   * Cancel current feedback
   */
  _cancelFeedback(element) {
    const feedbackState = this._feedbackStates.get(element);
    if (!feedbackState?.isTracking) return;

    // Clean up
    this._cleanupFeedback(element);
  }

  /**
   * Clean up feedback state
   */
  _cleanupFeedback(element) {
    const feedbackState = this._feedbackStates.get(element);
    if (!feedbackState) return;

    // Clear timer
    if (feedbackState.longTapTimer) {
      clearTimeout(feedbackState.longTapTimer);
      feedbackState.longTapTimer = null;
    }

    // Remove visual feedback
    this._removeVisualFeedback(element);

    // Reset state
    feedbackState.isTracking = false;
    feedbackState.isLongTap = false;
  }

  /**
   * Add visual feedback to element
   */
  _addVisualFeedback(element, className) {
    if (!this.enableVisualFeedback || !className) return;
    element.classList.add(className);
  }

  /**
   * Remove visual feedback from element
   */
  _removeVisualFeedback(element) {
    const feedbackState = this._feedbackStates.get(element);
    if (!feedbackState) return;
    
    element.classList.remove(feedbackState.feedbackClass, feedbackState.longPressClass);
  }

  /**
   * Clean up all attached elements (for disposal)
   */
  dispose() {
    console.log('[GestureFeedbackManager] Disposing, cleaning up all attached elements');
    
    // Remove feedback from all elements
    for (const element of this._attachedElements) {
      this.removeFeedbackFromElement(element);
    }
    
    // Clear all state
    this._attachedElements.clear();
  }

  /**
   * Static utility method to quickly add feedback to multiple elements
   * @param {NodeList|Array} elements - Elements to add feedback to
   * @param {Object} options - Feedback options
   * @returns {GestureFeedbackManager} Manager instance for cleanup
   */
  static addToElements(elements, options = {}) {
    const manager = new GestureFeedbackManager(options);
    
    for (const element of elements) {
      manager.addFeedbackToElement(element, options);
    }
    
    return manager;
  }
}