/**
 * Error Boundary Utilities
 * Provides safe handler wrappers for async operations to prevent UI crashes
 */

/**
 * Wraps a function with error handling to prevent UI crashes
 * @param {Function} fn - The function to wrap (sync or async)
 * @param {Object} options - Configuration options
 * @param {string} options.source - Identifier for error logging (e.g., 'room-popup:toggleLights')
 * @param {string} [options.entityId] - Optional entity ID for context
 * @param {Function} [options.onError] - Optional callback for UI feedback on error
 * @returns {Function} Wrapped function that catches and logs errors
 */
export function safeHandler(fn, options = {}) {
  const { source = 'unknown', entityId = null, onError = null } = options;

  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      console.warn(`[Dashview] Handler error in ${source}:`, error.message);

      // Dispatch error event for centralized logging
      document.dispatchEvent(new CustomEvent('dashview-error', {
        bubbles: true,
        composed: true,
        detail: {
          source,
          entityId,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack
          },
          timestamp: Date.now()
        }
      }));

      // Optional callback for UI feedback
      if (onError) {
        try {
          onError(error);
        } catch (callbackError) {
          console.warn('[Dashview] Error in onError callback:', callbackError.message);
        }
      }

      // Return undefined to indicate failure without throwing
      return undefined;
    }
  };
}

/**
 * Wraps a synchronous function with error handling
 * Use this for event handlers that don't need async support
 * @param {Function} fn - The function to wrap
 * @param {Object} options - Configuration options (same as safeHandler)
 * @returns {Function} Wrapped function
 */
export function safeHandlerSync(fn, options = {}) {
  const { source = 'unknown', entityId = null, onError = null } = options;

  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      console.warn(`[Dashview] Handler error in ${source}:`, error.message);

      document.dispatchEvent(new CustomEvent('dashview-error', {
        bubbles: true,
        composed: true,
        detail: {
          source,
          entityId,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack
          },
          timestamp: Date.now()
        }
      }));

      if (onError) {
        try {
          onError(error);
        } catch (callbackError) {
          console.warn('[Dashview] Error in onError callback:', callbackError.message);
        }
      }

      return undefined;
    }
  };
}

/**
 * Creates a safe service caller that wraps hass.callService with error handling
 * @param {Object} hass - Home Assistant instance
 * @param {string} source - Source identifier for error logging
 * @returns {Function} Safe callService wrapper
 */
export function createSafeServiceCaller(hass, source) {
  return async (domain, service, data, onError = null) => {
    if (!hass) {
      console.warn(`[Dashview] Cannot call service ${domain}.${service}: hass not available`);
      return undefined;
    }

    try {
      return await hass.callService(domain, service, data);
    } catch (error) {
      const entityId = data?.entity_id || null;
      console.warn(`[Dashview] Service call failed in ${source}:`, error.message);

      document.dispatchEvent(new CustomEvent('dashview-error', {
        bubbles: true,
        composed: true,
        detail: {
          source: `${source}:${domain}.${service}`,
          entityId,
          error: {
            message: error.message,
            name: error.name,
            stack: error.stack
          },
          timestamp: Date.now()
        }
      }));

      if (onError) {
        try {
          onError(error);
        } catch (callbackError) {
          console.warn('[Dashview] Error in onError callback:', callbackError.message);
        }
      }

      return undefined;
    }
  };
}

export default { safeHandler, safeHandlerSync, createSafeServiceCaller };
