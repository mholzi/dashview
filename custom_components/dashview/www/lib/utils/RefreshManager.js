// custom_components/dashview/www/lib/utils/RefreshManager.js

export class RefreshManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._shadowRoot = panel.shadowRoot;
    this._isRefreshing = false;
    this._refreshCallbacks = new Map();
    this._lastRefreshTime = 0;
    this._minRefreshInterval = 1000; // Minimum 1 second between manual refreshes
    
    // Track refresh statistics
    this._refreshStats = {
      totalRefreshes: 0,
      lastRefreshDuration: 0,
      averageRefreshDuration: 0
    };
    
    this._setupPullToRefresh();
  }

  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Register a refresh callback for a specific component/popup
   * @param {string} componentId - Unique identifier for the component
   * @param {Function} callback - Function to call when refresh is triggered
   */
  registerRefreshCallback(componentId, callback) {
    this._refreshCallbacks.set(componentId, callback);
    console.log(`[RefreshManager] Registered refresh callback for: ${componentId}`);
  }

  /**
   * Unregister a refresh callback
   * @param {string} componentId - Component identifier to unregister
   */
  unregisterRefreshCallback(componentId) {
    this._refreshCallbacks.delete(componentId);
    console.log(`[RefreshManager] Unregistered refresh callback for: ${componentId}`);
  }

  /**
   * Perform a manual refresh of all or specific components
   * @param {string|string[]} componentIds - Optional specific components to refresh
   * @returns {Promise<boolean>} Success status
   */
  async refreshData(componentIds = null) {
    const now = Date.now();
    
    // Prevent too frequent refreshes
    if (now - this._lastRefreshTime < this._minRefreshInterval) {
      console.log('[RefreshManager] Refresh request throttled');
      return false;
    }

    if (this._isRefreshing) {
      console.log('[RefreshManager] Refresh already in progress');
      return false;
    }

    this._isRefreshing = true;
    this._lastRefreshTime = now;
    const startTime = now;

    try {
      console.log('[RefreshManager] Starting manual data refresh...');
      
      // Show loading indicators
      this._showRefreshIndicators();
      
      // Determine which components to refresh
      const componentsToRefresh = componentIds ? 
        (Array.isArray(componentIds) ? componentIds : [componentIds]) :
        Array.from(this._refreshCallbacks.keys());

      // Execute refresh callbacks
      const refreshPromises = componentsToRefresh.map(async (componentId) => {
        const callback = this._refreshCallbacks.get(componentId);
        if (callback) {
          try {
            await callback();
            console.log(`[RefreshManager] Refreshed component: ${componentId}`);
          } catch (error) {
            console.error(`[RefreshManager] Error refreshing ${componentId}:`, error);
          }
        }
      });

      // Wait for all refreshes to complete
      await Promise.all(refreshPromises);

      // Update refresh statistics
      const duration = Date.now() - startTime;
      this._updateRefreshStats(duration);

      console.log(`[RefreshManager] Manual refresh completed in ${duration}ms`);
      return true;

    } catch (error) {
      console.error('[RefreshManager] Manual refresh failed:', error);
      return false;
    } finally {
      this._isRefreshing = false;
      this._hideRefreshIndicators();
    }
  }

  /**
   * Refresh specific popup content
   * @param {string} popupId - ID of the popup to refresh
   * @returns {Promise<boolean>} Success status
   */
  async refreshPopup(popupId) {
    const popup = this._shadowRoot.querySelector(`#${popupId}`);
    if (!popup) {
      console.warn(`[RefreshManager] Popup not found: ${popupId}`);
      return false;
    }

    console.log(`[RefreshManager] Refreshing popup: ${popupId}`);

    // Get the popup type for specific refresh logic
    const popupType = popupId.replace('-popup', '');
    
    try {
      // Use existing popup manager refresh logic
      if (this._panel._popupManager) {
        this._panel._popupManager.reinitializePopupContent(popup);
      }

      // Trigger specific manager updates
      if (popupId === 'weather-popup' && this._panel._weatherManager) {
        await this._panel._weatherManager.update();
      } else if (popupId === 'security-popup' && this._panel._securityManager) {
        await this._panel._securityManager.update();
      } else if (popupId === 'calendar-popup' && this._panel._calendarManager) {
        await this._panel._calendarManager.update(popup);
      } else if (this._panel._houseConfig?.rooms?.[popupType]) {
        // Room popup refresh
        this._panel._popupManager._refreshRoomEntities(popupType, popup);
      }

      return true;
    } catch (error) {
      console.error(`[RefreshManager] Error refreshing popup ${popupId}:`, error);
      return false;
    }
  }

  /**
   * Get refresh statistics
   * @returns {Object} Refresh statistics
   */
  getRefreshStats() {
    return { ...this._refreshStats };
  }

  /**
   * Setup pull-to-refresh gesture support
   */
  _setupPullToRefresh() {
    let startY = 0;
    let currentY = 0;
    let isPulling = false;
    let pullThreshold = 80; // Pixels to pull before triggering refresh

    const handleTouchStart = (e) => {
      // Only trigger on main content area, not in popups
      if (e.target.closest('.popup')) return;
      
      startY = e.touches[0].pageY;
      isPulling = false;
    };

    const handleTouchMove = (e) => {
      if (e.target.closest('.popup')) return;
      
      currentY = e.touches[0].pageY;
      const pullDistance = currentY - startY;

      // Only consider downward pulls from the top of the page
      if (pullDistance > 0 && window.scrollY === 0) {
        isPulling = true;
        
        // Provide visual feedback
        if (pullDistance > pullThreshold) {
          this._showPullToRefreshIndicator(true);
        } else {
          this._showPullToRefreshIndicator(false);
        }
        
        // Prevent default scrolling when pulling
        if (pullDistance > 10) {
          e.preventDefault();
        }
      }
    };

    const handleTouchEnd = (e) => {
      if (e.target.closest('.popup')) return;
      
      if (isPulling) {
        const pullDistance = currentY - startY;
        
        if (pullDistance > pullThreshold) {
          // Trigger refresh
          this.refreshData();
        }
        
        this._hidePullToRefreshIndicator();
        isPulling = false;
      }
    };

    // Add touch event listeners to the main container
    if (this._shadowRoot) {
      this._shadowRoot.addEventListener('touchstart', handleTouchStart, { passive: true });
      this._shadowRoot.addEventListener('touchmove', handleTouchMove, { passive: false });
      this._shadowRoot.addEventListener('touchend', handleTouchEnd, { passive: true });
    }
  }

  /**
   * Show loading indicators during refresh
   */
  _showRefreshIndicators() {
    // Add refresh class to refresh buttons to show loading state
    this._shadowRoot.querySelectorAll('.refresh-button').forEach(btn => {
      btn.classList.add('refreshing');
      btn.disabled = true;
    });
  }

  /**
   * Hide loading indicators after refresh
   */
  _hideRefreshIndicators() {
    this._shadowRoot.querySelectorAll('.refresh-button').forEach(btn => {
      btn.classList.remove('refreshing');
      btn.disabled = false;
    });
  }

  /**
   * Show pull-to-refresh visual indicator
   * @param {boolean} ready - Whether the pull is ready to trigger refresh
   */
  _showPullToRefreshIndicator(ready) {
    let indicator = this._shadowRoot.querySelector('.pull-to-refresh-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.className = 'pull-to-refresh-indicator';
      indicator.innerHTML = `
        <div class="pull-icon">
          <i class="mdi mdi-refresh"></i>
        </div>
        <div class="pull-text">Pull to refresh</div>
      `;
      this._shadowRoot.appendChild(indicator);
    }
    
    indicator.classList.toggle('ready', ready);
    indicator.style.display = 'flex';
  }

  /**
   * Hide pull-to-refresh indicator
   */
  _hidePullToRefreshIndicator() {
    const indicator = this._shadowRoot.querySelector('.pull-to-refresh-indicator');
    if (indicator) {
      indicator.style.display = 'none';
      indicator.classList.remove('ready');
    }
  }

  /**
   * Update refresh statistics
   * @param {number} duration - Duration of the last refresh in milliseconds
   */
  _updateRefreshStats(duration) {
    this._refreshStats.totalRefreshes++;
    this._refreshStats.lastRefreshDuration = duration;
    
    // Calculate rolling average
    const totalDuration = this._refreshStats.averageRefreshDuration * (this._refreshStats.totalRefreshes - 1) + duration;
    this._refreshStats.averageRefreshDuration = Math.round(totalDuration / this._refreshStats.totalRefreshes);
  }

  /**
   * Create a refresh button element
   * @param {string} title - Button title/tooltip
   * @param {Function} clickHandler - Click event handler
   * @returns {HTMLElement} Button element
   */
  createRefreshButton(title = 'Refresh data', clickHandler = null) {
    const button = document.createElement('button');
    button.className = 'refresh-button';
    button.title = title;
    button.innerHTML = '<i class="mdi mdi-refresh"></i>';
    
    if (clickHandler) {
      button.addEventListener('click', clickHandler);
    } else {
      button.addEventListener('click', () => this.refreshData());
    }
    
    return button;
  }

  /**
   * Cleanup resources when component is destroyed
   */
  destroy() {
    this._refreshCallbacks.clear();
    console.log('[RefreshManager] Cleanup completed');
  }
}