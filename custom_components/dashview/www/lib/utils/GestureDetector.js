// custom_components/dashview/www/lib/utils/GestureDetector.js

/**
 * GestureDetector - Long-tap gesture detection for DashView sensor cards
 * 
 * Provides reliable long-tap detection with visual feedback and cross-device compatibility.
 * Maintains backward compatibility with existing click handlers while adding long-tap functionality.
 */
export class GestureDetector {
  constructor(config = {}) {
    // Configuration options
    this.longTapDuration = config.longTapDuration || 500; // ms
    this.longTapTolerance = config.longTapTolerance || 10; // pixels
    this.enableVisualFeedback = config.enableVisualFeedback !== false; // default true
    this.preventDefaultOnLongTap = config.preventDefaultOnLongTap !== false; // default true
    
    // Internal state tracking
    this._attachedElements = new Map();
    this._gestureStates = new WeakMap();
    
    console.log('[GestureDetector] Initialized with config:', {
      longTapDuration: this.longTapDuration,
      longTapTolerance: this.longTapTolerance,
      enableVisualFeedback: this.enableVisualFeedback
    });
  }

  /**
   * Attach gesture detection to an element
   * @param {HTMLElement} element - Target element
   * @param {Object} callbacks - Event callbacks
   * @param {Function} callbacks.onTap - Short tap callback
   * @param {Function} callbacks.onLongTap - Long tap callback
   * @param {Function} callbacks.onLongTapStart - Long tap start callback (optional)
   * @param {Function} callbacks.onLongTapCancel - Long tap cancel callback (optional)
   */
  attachToElement(element, callbacks) {
    if (!element || this._attachedElements.has(element)) {
      console.warn('[GestureDetector] Element already attached or invalid:', element);
      return;
    }

    // Validate required callbacks
    if (!callbacks.onTap || !callbacks.onLongTap) {
      console.error('[GestureDetector] Missing required callbacks (onTap, onLongTap)');
      return;
    }

    // Create gesture state for this element
    const gestureState = {
      isTracking: false,
      startTime: 0,
      startPosition: { x: 0, y: 0 },
      longTapTimer: null,
      isLongTap: false,
      callbacks: callbacks
    };

    this._gestureStates.set(element, gestureState);

    // Create bound event handlers
    const handlers = {
      touchStart: this._handleTouchStart.bind(this, element),
      touchMove: this._handleTouchMove.bind(this, element),
      touchEnd: this._handleTouchEnd.bind(this, element),
      touchCancel: this._handleTouchCancel.bind(this, element),
      mouseDown: this._handleMouseDown.bind(this, element),
      mouseMove: this._handleMouseMove.bind(this, element),
      mouseUp: this._handleMouseUp.bind(this, element),
      mouseLeave: this._handleMouseLeave.bind(this, element),
      contextMenu: this._handleContextMenu.bind(this, element)
    };

    // Attach event listeners
    // Touch events (primary for mobile)
    element.addEventListener('touchstart', handlers.touchStart, { passive: false });
    element.addEventListener('touchmove', handlers.touchMove, { passive: false });
    element.addEventListener('touchend', handlers.touchEnd, { passive: false });
    element.addEventListener('touchcancel', handlers.touchCancel, { passive: false });
    
    // Mouse events (fallback for desktop)
    element.addEventListener('mousedown', handlers.mouseDown, { passive: false });
    element.addEventListener('mousemove', handlers.mouseMove, { passive: false });
    element.addEventListener('mouseup', handlers.mouseUp, { passive: false });
    element.addEventListener('mouseleave', handlers.mouseLeave, { passive: false });
    
    // Prevent context menu during long-tap
    element.addEventListener('contextmenu', handlers.contextMenu, { passive: false });

    // Store handlers for cleanup
    this._attachedElements.set(element, handlers);
    
    console.log('[GestureDetector] Attached to element:', element);
  }

  /**
   * Detach gesture detection from an element
   * @param {HTMLElement} element - Target element
   */
  detachFromElement(element) {
    if (!element || !this._attachedElements.has(element)) {
      return;
    }

    const handlers = this._attachedElements.get(element);
    const gestureState = this._gestureStates.get(element);

    // Clean up any active timers
    if (gestureState?.longTapTimer) {
      clearTimeout(gestureState.longTapTimer);
    }

    // Remove visual feedback
    this._removeVisualFeedback(element);

    // Remove event listeners
    element.removeEventListener('touchstart', handlers.touchStart);
    element.removeEventListener('touchmove', handlers.touchMove);
    element.removeEventListener('touchend', handlers.touchEnd);
    element.removeEventListener('touchcancel', handlers.touchCancel);
    element.removeEventListener('mousedown', handlers.mouseDown);
    element.removeEventListener('mousemove', handlers.mouseMove);
    element.removeEventListener('mouseup', handlers.mouseUp);
    element.removeEventListener('mouseleave', handlers.mouseLeave);
    element.removeEventListener('contextmenu', handlers.contextMenu);

    // Clean up state
    this._attachedElements.delete(element);
    this._gestureStates.delete(element);
    
    console.log('[GestureDetector] Detached from element:', element);
  }

  /**
   * Handle touch start events
   */
  _handleTouchStart(element, event) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState) return;

    // Only handle single touch
    if (event.touches.length !== 1) {
      this._cancelGesture(element);
      return;
    }

    const touch = event.touches[0];
    this._startGesture(element, touch.clientX, touch.clientY, event);
  }

  /**
   * Handle touch move events
   */
  _handleTouchMove(element, event) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState?.isTracking) return;

    if (event.touches.length !== 1) {
      this._cancelGesture(element);
      return;
    }

    const touch = event.touches[0];
    this._updateGesture(element, touch.clientX, touch.clientY, event);
  }

  /**
   * Handle touch end events
   */
  _handleTouchEnd(element, event) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState?.isTracking) return;

    if (event.changedTouches.length !== 1) {
      this._cancelGesture(element);
      return;
    }

    const touch = event.changedTouches[0];
    this._endGesture(element, touch.clientX, touch.clientY, event);
  }

  /**
   * Handle touch cancel events
   */
  _handleTouchCancel(element, event) {
    this._cancelGesture(element);
  }

  /**
   * Handle mouse down events (desktop fallback)
   */
  _handleMouseDown(element, event) {
    // Only handle left mouse button
    if (event.button !== 0) return;
    
    this._startGesture(element, event.clientX, event.clientY, event);
  }

  /**
   * Handle mouse move events
   */
  _handleMouseMove(element, event) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState?.isTracking) return;

    this._updateGesture(element, event.clientX, event.clientY, event);
  }

  /**
   * Handle mouse up events
   */
  _handleMouseUp(element, event) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState?.isTracking) return;

    this._endGesture(element, event.clientX, event.clientY, event);
  }

  /**
   * Handle mouse leave events
   */
  _handleMouseLeave(element, event) {
    this._cancelGesture(element);
  }

  /**
   * Handle context menu events
   */
  _handleContextMenu(element, event) {
    const gestureState = this._gestureStates.get(element);
    if (gestureState?.isLongTap && this.preventDefaultOnLongTap) {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  /**
   * Start gesture tracking
   */
  _startGesture(element, x, y, event) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState) return;

    // Reset state
    gestureState.isTracking = true;
    gestureState.startTime = Date.now();
    gestureState.startPosition = { x, y };
    gestureState.isLongTap = false;

    // Clear any existing timer
    if (gestureState.longTapTimer) {
      clearTimeout(gestureState.longTapTimer);
    }

    // Start visual feedback
    if (this.enableVisualFeedback) {
      this._addVisualFeedback(element, 'gesture-detecting');
    }

    // Set long-tap timer
    gestureState.longTapTimer = setTimeout(() => {
      if (gestureState.isTracking) {
        gestureState.isLongTap = true;
        
        // Update visual feedback
        if (this.enableVisualFeedback) {
          this._removeVisualFeedback(element);
          this._addVisualFeedback(element, 'gesture-longpress');
        }

        // Trigger long-tap start callback
        if (gestureState.callbacks.onLongTapStart) {
          gestureState.callbacks.onLongTapStart(element, event);
        }

        console.log('[GestureDetector] Long-tap detected on element:', element);
      }
    }, this.longTapDuration);
  }

  /**
   * Update gesture tracking (handle movement)
   */
  _updateGesture(element, x, y, event) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState?.isTracking) return;

    // Calculate movement distance
    const deltaX = x - gestureState.startPosition.x;
    const deltaY = y - gestureState.startPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Cancel if moved too far
    if (distance > this.longTapTolerance) {
      this._cancelGesture(element);
    }
  }

  /**
   * End gesture tracking
   */
  _endGesture(element, x, y, event) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState?.isTracking) return;

    const duration = Date.now() - gestureState.startTime;
    const isLongTap = gestureState.isLongTap;

    // Clean up
    this._cleanupGesture(element);

    // Trigger appropriate callback
    if (isLongTap) {
      if (this.preventDefaultOnLongTap) {
        event.preventDefault();
        event.stopPropagation();
      }
      gestureState.callbacks.onLongTap(element, event);
      console.log('[GestureDetector] Long-tap completed on element:', element);
    } else {
      // Short tap
      gestureState.callbacks.onTap(element, event);
      console.log('[GestureDetector] Short tap on element:', element);
    }
  }

  /**
   * Cancel current gesture
   */
  _cancelGesture(element) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState?.isTracking) return;

    const wasLongTap = gestureState.isLongTap;

    // Clean up
    this._cleanupGesture(element);

    // Trigger cancel callback if it was a long-tap in progress
    if (wasLongTap && gestureState.callbacks.onLongTapCancel) {
      gestureState.callbacks.onLongTapCancel(element);
    }

    console.log('[GestureDetector] Gesture cancelled on element:', element);
  }

  /**
   * Clean up gesture state
   */
  _cleanupGesture(element) {
    const gestureState = this._gestureStates.get(element);
    if (!gestureState) return;

    // Clear timer
    if (gestureState.longTapTimer) {
      clearTimeout(gestureState.longTapTimer);
      gestureState.longTapTimer = null;
    }

    // Remove visual feedback
    this._removeVisualFeedback(element);

    // Reset state
    gestureState.isTracking = false;
    gestureState.isLongTap = false;
  }

  /**
   * Add visual feedback to element
   */
  _addVisualFeedback(element, className) {
    if (!this.enableVisualFeedback) return;
    element.classList.add(className);
  }

  /**
   * Remove visual feedback from element
   */
  _removeVisualFeedback(element) {
    element.classList.remove('gesture-detecting', 'gesture-longpress');
  }

  /**
   * Clean up all attached elements (for disposal)
   */
  dispose() {
    console.log('[GestureDetector] Disposing, cleaning up all attached elements');
    
    // Detach from all elements
    for (const element of this._attachedElements.keys()) {
      this.detachFromElement(element);
    }
    
    // Clear all state
    this._attachedElements.clear();
  }
}