// custom_components/dashview/www/lib/utils/FloorGestureManager.js

/**
 * FloorGestureManager - Advanced gesture support for floor navigation and room switching
 * 
 * Implements multi-directional swipes and pinch-to-zoom gestures for enhanced
 * mobile navigation experience as outlined in Enhancement #3.
 */
export class FloorGestureManager {
  constructor(floorManager, config = {}) {
    this._floorManager = floorManager;
    this._shadowRoot = floorManager._shadowRoot;
    
    // Configuration options
    this.swipeThreshold = config.swipeThreshold || 50; // minimum distance for swipe
    this.swipeVelocityThreshold = config.swipeVelocityThreshold || 0.3; // minimum velocity
    this.pinchThreshold = config.pinchThreshold || 1.2; // minimum scale change for pinch
    this.enableHapticFeedback = config.enableHapticFeedback !== false; // default true
    
    // Gesture state tracking
    this._gestureState = {
      isTracking: false,
      startTouch: null,
      lastTouch: null,
      startTime: 0,
      gestureType: null, // 'swipe', 'pinch', 'pan'
      initialDistance: 0,
      currentScale: 1
    };
    
    // Floor navigation state
    this._floorOrder = [];
    this._currentFloorIndex = 0;
    
    // Initialize gesture handlers
    this._initializeGestureHandlers();
    
    console.log('[FloorGestureManager] Initialized with config:', {
      swipeThreshold: this.swipeThreshold,
      swipeVelocityThreshold: this.swipeVelocityThreshold,
      pinchThreshold: this.pinchThreshold,
      enableHapticFeedback: this.enableHapticFeedback
    });
  }

  /**
   * Initialize gesture event handlers on the floor container
   */
  _initializeGestureHandlers() {
    const floorContainer = this._shadowRoot.getElementById('floor-tabs-container');
    if (!floorContainer) {
      console.warn('[FloorGestureManager] Floor container not found');
      return;
    }

    // Touch events for mobile
    floorContainer.addEventListener('touchstart', this._handleTouchStart.bind(this), { passive: false });
    floorContainer.addEventListener('touchmove', this._handleTouchMove.bind(this), { passive: false });
    floorContainer.addEventListener('touchend', this._handleTouchEnd.bind(this), { passive: false });
    floorContainer.addEventListener('touchcancel', this._handleTouchCancel.bind(this), { passive: false });

    // Mouse events for desktop (optional fallback)
    floorContainer.addEventListener('mousedown', this._handleMouseDown.bind(this), { passive: false });
    floorContainer.addEventListener('mousemove', this._handleMouseMove.bind(this), { passive: false });
    floorContainer.addEventListener('mouseup', this._handleMouseUp.bind(this), { passive: false });
    floorContainer.addEventListener('mouseleave', this._handleMouseLeave.bind(this), { passive: false });

    // Initialize floor order for navigation
    this._updateFloorOrder();
  }

  /**
   * Update the floor order based on current configuration
   */
  _updateFloorOrder() {
    const floorButtons = this._shadowRoot.querySelectorAll('.floor-tab-button');
    this._floorOrder = Array.from(floorButtons).map(btn => btn.dataset.targetFloor);
    
    // Find current active floor
    const activeButton = this._shadowRoot.querySelector('.floor-tab-button.active');
    if (activeButton) {
      this._currentFloorIndex = this._floorOrder.indexOf(activeButton.dataset.targetFloor);
    }
  }

  /**
   * Check if touch event originates from a sensor card that has its own swipe functionality
   */
  _isSensorCardTouch(touch) {
    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!element) return false;
    
    // Check if the touch is on a sensor card or its children
    const sensorCard = element.closest('.sensor-small-card, .sensor-big-card');
    return sensorCard !== null;
  }

  /**
   * Handle touch start events
   */
  _handleTouchStart(event) {
    // Skip floor gesture processing if touch originates from sensor cards
    if (event.touches.length === 1 && this._isSensorCardTouch(event.touches[0])) {
      return;
    }
    
    if (event.touches.length === 1) {
      // Single touch - potential swipe
      this._startSingleTouch(event.touches[0]);
    } else if (event.touches.length === 2) {
      // Multi-touch - potential pinch
      this._startPinchGesture(event.touches);
    }
  }

  /**
   * Handle touch move events
   */
  _handleTouchMove(event) {
    if (this._gestureState.gestureType === 'swipe' && event.touches.length === 1) {
      this._updateSwipeGesture(event.touches[0]);
    } else if (this._gestureState.gestureType === 'pinch' && event.touches.length === 2) {
      this._updatePinchGesture(event.touches);
    }
  }

  /**
   * Handle touch end events
   */
  _handleTouchEnd(event) {
    if (this._gestureState.gestureType === 'swipe') {
      this._completeSweepGesture();
    } else if (this._gestureState.gestureType === 'pinch') {
      this._completePinchGesture();
    }
    this._resetGestureState();
  }

  /**
   * Handle touch cancel events
   */
  _handleTouchCancel(event) {
    this._resetGestureState();
  }

  /**
   * Start single touch tracking for swipe gestures
   */
  _startSingleTouch(touch) {
    this._gestureState = {
      isTracking: true,
      startTouch: { x: touch.clientX, y: touch.clientY },
      lastTouch: { x: touch.clientX, y: touch.clientY },
      startTime: Date.now(),
      gestureType: 'swipe',
      initialDistance: 0,
      currentScale: 1
    };
  }

  /**
   * Start pinch gesture tracking
   */
  _startPinchGesture(touches) {
    const touch1 = touches[0];
    const touch2 = touches[1];
    const distance = this._calculateDistance(touch1, touch2);
    
    this._gestureState = {
      isTracking: true,
      startTouch: { x: touch1.clientX, y: touch1.clientY },
      lastTouch: { x: touch1.clientX, y: touch1.clientY },
      startTime: Date.now(),
      gestureType: 'pinch',
      initialDistance: distance,
      currentScale: 1
    };
  }

  /**
   * Update swipe gesture tracking
   */
  _updateSwipeGesture(touch) {
    if (!this._gestureState.isTracking) return;
    
    this._gestureState.lastTouch = { x: touch.clientX, y: touch.clientY };
  }

  /**
   * Update pinch gesture tracking
   */
  _updatePinchGesture(touches) {
    if (!this._gestureState.isTracking || touches.length !== 2) return;
    
    const touch1 = touches[0];
    const touch2 = touches[1];
    const currentDistance = this._calculateDistance(touch1, touch2);
    
    this._gestureState.currentScale = currentDistance / this._gestureState.initialDistance;
  }

  /**
   * Complete and process swipe gesture
   */
  _completeSweepGesture() {
    if (!this._gestureState.isTracking) return;
    
    const deltaX = this._gestureState.lastTouch.x - this._gestureState.startTouch.x;
    const deltaY = this._gestureState.lastTouch.y - this._gestureState.startTouch.y;
    const deltaTime = Date.now() - this._gestureState.startTime;
    
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY) / deltaTime;
    
    // Determine gesture direction and execute if thresholds are met
    if (velocity >= this.swipeVelocityThreshold) {
      if (absX > absY && absX >= this.swipeThreshold) {
        // Horizontal swipe - floor navigation
        if (deltaX > 0) {
          this._navigateToNextFloor(-1); // swipe right = previous floor
        } else {
          this._navigateToNextFloor(1); // swipe left = next floor
        }
      } else if (absY > absX && absY >= this.swipeThreshold) {
        // Vertical swipe - room switching within floor
        if (deltaY > 0) {
          this._navigateToNextRoom(-1); // swipe down = previous room
        } else {
          this._navigateToNextRoom(1); // swipe up = next room
        }
      }
    }
  }

  /**
   * Complete and process pinch gesture
   */
  _completePinchGesture() {
    if (!this._gestureState.isTracking) return;
    
    // Pinch out (zoom out) shows floor overview
    if (this._gestureState.currentScale >= this.pinchThreshold) {
      this._showFloorOverview();
    }
  }

  /**
   * Navigate to next/previous floor
   */
  _navigateToNextFloor(direction) {
    this._updateFloorOrder();
    
    const newIndex = this._currentFloorIndex + direction;
    if (newIndex >= 0 && newIndex < this._floorOrder.length) {
      const targetFloorId = this._floorOrder[newIndex];
      this._switchToFloor(targetFloorId);
      this._currentFloorIndex = newIndex;
      
      // Haptic feedback
      this._triggerHapticFeedback('light');
      
      console.log(`[FloorGestureManager] Navigated to floor: ${targetFloorId}`);
    }
  }

  /**
   * Navigate to next/previous room within current floor
   */
  _navigateToNextRoom(direction) {
    // Get all room cards in current floor
    const activeTab = this._shadowRoot.querySelector('.floor-tab-button.active');
    if (!activeTab) return;
    
    const floorId = activeTab.dataset.targetFloor;
    const roomGrid = this._shadowRoot.getElementById(`room-grid-${floorId}`);
    if (!roomGrid) return;
    
    const roomCards = roomGrid.querySelectorAll('.room-card, .sensor-small-card, .sensor-big-card');
    if (roomCards.length === 0) return;
    
    // Find currently highlighted room or select first
    let currentIndex = 0;
    const highlightedRoom = roomGrid.querySelector('.room-card.highlighted, .sensor-small-card.highlighted, .sensor-big-card.highlighted');
    if (highlightedRoom) {
      currentIndex = Array.from(roomCards).indexOf(highlightedRoom);
    }
    
    // Calculate new index
    const newIndex = (currentIndex + direction + roomCards.length) % roomCards.length;
    
    // Remove existing highlights and add to new room
    roomCards.forEach(card => card.classList.remove('highlighted'));
    roomCards[newIndex].classList.add('highlighted');
    
    // Scroll into view if needed
    roomCards[newIndex].scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Haptic feedback
    this._triggerHapticFeedback('light');
    
    console.log(`[FloorGestureManager] Navigated to room: ${newIndex}`);
  }

  /**
   * Show floor overview (pinch-to-zoom result)
   */
  _showFloorOverview() {
    // Create or show floor overview modal
    let overview = this._shadowRoot.getElementById('floor-overview-modal');
    if (!overview) {
      overview = this._createFloorOverviewModal();
      this._shadowRoot.appendChild(overview);
    }
    
    overview.style.display = 'flex';
    this._populateFloorOverview(overview);
    
    // Haptic feedback
    this._triggerHapticFeedback('medium');
    
    console.log('[FloorGestureManager] Showing floor overview');
  }

  /**
   * Create floor overview modal
   */
  _createFloorOverviewModal() {
    const modal = document.createElement('div');
    modal.id = 'floor-overview-modal';
    modal.className = 'floor-overview-modal';
    modal.innerHTML = `
      <div class="floor-overview-backdrop" onclick="this.parentElement.style.display='none'"></div>
      <div class="floor-overview-content">
        <div class="floor-overview-header">
          <h3>Floor Overview</h3>
          <button class="floor-overview-close" onclick="this.closest('.floor-overview-modal').style.display='none'">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="floor-overview-grid" id="floor-overview-grid"></div>
      </div>
    `;
    return modal;
  }

  /**
   * Populate floor overview with current floor data
   */
  _populateFloorOverview(overview) {
    const grid = overview.querySelector('#floor-overview-grid');
    grid.innerHTML = '';
    
    this._floorOrder.forEach((floorId, index) => {
      const floorButton = this._shadowRoot.querySelector(`[data-target-floor="${floorId}"]`);
      if (!floorButton) return;
      
      const floorCard = document.createElement('div');
      floorCard.className = `floor-overview-card ${index === this._currentFloorIndex ? 'active' : ''}`;
      floorCard.innerHTML = `
        <div class="floor-overview-icon">
          ${floorButton.innerHTML}
        </div>
        <div class="floor-overview-name">${floorId}</div>
        <div class="floor-overview-stats">
          ${this._getFloorStats(floorId)}
        </div>
      `;
      
      floorCard.addEventListener('click', () => {
        this._switchToFloor(floorId);
        overview.style.display = 'none';
      });
      
      grid.appendChild(floorCard);
    });
  }

  /**
   * Get stats for a floor (active sensors, etc.)
   */
  _getFloorStats(floorId) {
    const roomGrid = this._shadowRoot.getElementById(`room-grid-${floorId}`);
    if (!roomGrid) return '0 rooms';
    
    const rooms = roomGrid.querySelectorAll('.room-card').length;
    const activeSensors = roomGrid.querySelectorAll('.sensor-small-card.active, .sensor-big-card.active').length;
    
    return `${rooms} rooms, ${activeSensors} active`;
  }

  /**
   * Switch to specific floor
   */
  _switchToFloor(floorId) {
    const targetButton = this._shadowRoot.querySelector(`[data-target-floor="${floorId}"]`);
    if (targetButton) {
      targetButton.click(); // Use existing click handler
    }
  }

  /**
   * Calculate distance between two touch points
   */
  _calculateDistance(touch1, touch2) {
    const deltaX = touch2.clientX - touch1.clientX;
    const deltaY = touch2.clientY - touch1.clientY;
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  }

  /**
   * Trigger haptic feedback if supported and enabled
   */
  _triggerHapticFeedback(intensity = 'light') {
    if (!this.enableHapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      strong: [50]
    };
    
    navigator.vibrate(patterns[intensity] || patterns.light);
  }

  /**
   * Reset gesture state
   */
  _resetGestureState() {
    this._gestureState = {
      isTracking: false,
      startTouch: null,
      lastTouch: null,
      startTime: 0,
      gestureType: null,
      initialDistance: 0,
      currentScale: 1
    };
  }

  /**
   * Check if mouse event originates from a sensor card that has its own swipe functionality
   */
  _isSensorCardMouse(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY);
    if (!element) return false;
    
    // Check if the click is on a sensor card or its children
    const sensorCard = element.closest('.sensor-small-card, .sensor-big-card');
    return sensorCard !== null;
  }

  /**
   * Mouse event handlers (desktop fallback)
   */
  _handleMouseDown(event) {
    // Skip floor gesture processing if mouse event originates from sensor cards
    if (this._isSensorCardMouse(event.clientX, event.clientY)) {
      return;
    }
    
    this._startSingleTouch({
      clientX: event.clientX,
      clientY: event.clientY
    });
  }

  _handleMouseMove(event) {
    if (this._gestureState.gestureType === 'swipe') {
      this._updateSwipeGesture({
        clientX: event.clientX,
        clientY: event.clientY
      });
    }
  }

  _handleMouseUp(event) {
    if (this._gestureState.gestureType === 'swipe') {
      this._completeSweepGesture();
    }
    this._resetGestureState();
  }

  _handleMouseLeave(event) {
    this._resetGestureState();
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[FloorGestureManager] Disposing resources');
    
    const floorContainer = this._shadowRoot.getElementById('floor-tabs-container');
    if (floorContainer) {
      // Remove all event listeners
      floorContainer.removeEventListener('touchstart', this._handleTouchStart);
      floorContainer.removeEventListener('touchmove', this._handleTouchMove);
      floorContainer.removeEventListener('touchend', this._handleTouchEnd);
      floorContainer.removeEventListener('touchcancel', this._handleTouchCancel);
      floorContainer.removeEventListener('mousedown', this._handleMouseDown);
      floorContainer.removeEventListener('mousemove', this._handleMouseMove);
      floorContainer.removeEventListener('mouseup', this._handleMouseUp);
      floorContainer.removeEventListener('mouseleave', this._handleMouseLeave);
    }
    
    // Remove floor overview modal if it exists
    const overview = this._shadowRoot.getElementById('floor-overview-modal');
    if (overview) {
      overview.remove();
    }
    
    this._floorManager = null;
    this._shadowRoot = null;
  }
}