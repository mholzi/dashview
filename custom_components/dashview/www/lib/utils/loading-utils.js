// custom_components/dashview/www/lib/utils/loading-utils.js

/**
 * Shared loading state utilities for consistent UX across DashView components
 */
export class LoadingUtils {
  /**
   * Create a loading indicator element
   * @param {string} message - Loading message
   * @param {string} size - Size: 'small', 'medium', 'large'
   * @returns {HTMLElement} Loading element
   */
  static createLoadingElement(message = 'Loading...', size = 'medium') {
    const loadingEl = document.createElement('div');
    loadingEl.className = `loading-indicator loading-${size}`;
    
    const sizeClasses = {
      small: 'font-size: 0.8em; padding: 8px;',
      medium: 'font-size: 0.9em; padding: 16px;',
      large: 'font-size: 1em; padding: 24px;'
    };
    
    loadingEl.style.cssText = `
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      color: var(--secondary-text-color);
      ${sizeClasses[size]}
      text-align: center;
    `;
    
    loadingEl.innerHTML = `
      <i class="mdi mdi-loading mdi-spin" style="font-size: 1.2em;"></i>
      <span>${message}</span>
    `;
    
    return loadingEl;
  }

  /**
   * Create a skeleton loading element for content placeholders
   * @param {string} type - Type: 'line', 'circle', 'card'
   * @param {Object} options - Additional options
   * @returns {HTMLElement} Skeleton element
   */
  static createSkeletonElement(type = 'line', options = {}) {
    const skeletonEl = document.createElement('div');
    
    switch (type) {
      case 'line':
        skeletonEl.className = `skeleton-line ${options.width || 'wide'}`;
        break;
      case 'circle':
        skeletonEl.className = 'skeleton-circle';
        break;
      case 'card':
        skeletonEl.className = 'skeleton-card';
        skeletonEl.innerHTML = `
          <div class="skeleton-line wide"></div>
          <div class="skeleton-line medium"></div>
          <div class="skeleton-line narrow"></div>
        `;
        break;
    }
    
    return skeletonEl;
  }

  /**
   * Show loading state in container
   * @param {HTMLElement} container - Container element
   * @param {string} message - Loading message
   * @param {string} size - Size of loading indicator
   */
  static showLoading(container, message = 'Loading...', size = 'medium') {
    if (!container) return;
    
    // Remove existing loading indicators
    LoadingUtils.hideLoading(container);
    
    const loadingEl = LoadingUtils.createLoadingElement(message, size);
    loadingEl.setAttribute('data-loading-indicator', 'true');
    container.appendChild(loadingEl);
  }

  /**
   * Hide loading state from container
   * @param {HTMLElement} container - Container element
   */
  static hideLoading(container) {
    if (!container) return;
    
    const loadingIndicators = container.querySelectorAll('[data-loading-indicator]');
    loadingIndicators.forEach(el => el.remove());
  }

  /**
   * Show skeleton loading in container
   * @param {HTMLElement} container - Container element
   * @param {Array} skeletonConfig - Array of skeleton configurations
   */
  static showSkeleton(container, skeletonConfig = [{ type: 'card' }]) {
    if (!container) return;
    
    // Remove existing content and loading indicators
    LoadingUtils.hideLoading(container);
    
    const skeletonContainer = document.createElement('div');
    skeletonContainer.className = 'skeleton-container';
    skeletonContainer.setAttribute('data-loading-indicator', 'true');
    
    skeletonConfig.forEach(config => {
      const skeletonEl = LoadingUtils.createSkeletonElement(config.type, config.options);
      skeletonContainer.appendChild(skeletonEl);
    });
    
    container.appendChild(skeletonContainer);
  }

  /**
   * Create a loading overlay for entire components
   * @param {HTMLElement} container - Container element
   * @param {string} message - Loading message
   */
  static showOverlay(container, message = 'Loading...') {
    if (!container) return;
    
    // Remove existing overlay
    LoadingUtils.hideOverlay(container);
    
    const overlay = document.createElement('div');
    overlay.className = 'loading-overlay';
    overlay.setAttribute('data-loading-overlay', 'true');
    overlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(var(--rgb-card-background-color, 255, 255, 255), 0.8);
      backdrop-filter: blur(2px);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
      border-radius: inherit;
    `;
    
    overlay.appendChild(LoadingUtils.createLoadingElement(message, 'medium'));
    
    // Ensure container has relative positioning
    const containerPosition = getComputedStyle(container).position;
    if (containerPosition === 'static') {
      container.style.position = 'relative';
    }
    
    container.appendChild(overlay);
  }

  /**
   * Hide loading overlay from container
   * @param {HTMLElement} container - Container element
   */
  static hideOverlay(container) {
    if (!container) return;
    
    const overlays = container.querySelectorAll('[data-loading-overlay]');
    overlays.forEach(el => el.remove());
  }

  /**
   * Wrap an async operation with loading state
   * @param {HTMLElement} container - Container element
   * @param {Function} asyncOperation - Async function to execute
   * @param {Object} options - Loading options
   * @returns {Promise} Result of async operation
   */
  static async withLoading(container, asyncOperation, options = {}) {
    const {
      type = 'indicator', // 'indicator', 'skeleton', 'overlay'
      message = 'Loading...',
      size = 'medium',
      skeletonConfig = [{ type: 'card' }]
    } = options;
    
    try {
      // Show loading state
      switch (type) {
        case 'skeleton':
          LoadingUtils.showSkeleton(container, skeletonConfig);
          break;
        case 'overlay':
          LoadingUtils.showOverlay(container, message);
          break;
        default:
          LoadingUtils.showLoading(container, message, size);
      }
      
      // Execute async operation
      const result = await asyncOperation();
      
      // Hide loading state
      switch (type) {
        case 'overlay':
          LoadingUtils.hideOverlay(container);
          break;
        default:
          LoadingUtils.hideLoading(container);
      }
      
      return result;
    } catch (error) {
      // Hide loading state on error
      switch (type) {
        case 'overlay':
          LoadingUtils.hideOverlay(container);
          break;
        default:
          LoadingUtils.hideLoading(container);
      }
      throw error;
    }
  }
}