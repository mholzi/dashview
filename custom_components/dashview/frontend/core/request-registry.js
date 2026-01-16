/**
 * Request Registry
 * Manages AbortControllers for fetch requests to enable proper cleanup on unmount
 *
 * This registry allows components to register fetch requests and abort them
 * when the component unmounts, preventing stale state updates.
 *
 * @module core/request-registry
 */

import { debugLog } from '../constants/index.js';

/**
 * Registry for managing AbortControllers for fetch requests
 */
export class RequestRegistry {
  constructor() {
    /** @type {Map<string, AbortController>} */
    this.controllers = new Map();
  }

  /**
   * Register a new request and get its AbortSignal
   * If a request with the same ID already exists, it will be aborted first
   *
   * @param {string} id - Unique identifier for the request
   * @returns {AbortSignal} Signal to pass to fetch or other abortable operations
   */
  register(id) {
    // Abort existing if re-registering same ID
    this.abort(id);
    const controller = new AbortController();
    this.controllers.set(id, controller);
    debugLog('request-registry', `Registered request: ${id}`);
    return controller.signal;
  }

  /**
   * Abort a specific request by ID
   *
   * @param {string} id - Request ID to abort
   * @returns {boolean} True if the request was found and aborted
   */
  abort(id) {
    const controller = this.controllers.get(id);
    if (controller) {
      controller.abort();
      this.controllers.delete(id);
      debugLog('request-registry', `Aborted request: ${id}`);
      return true;
    }
    return false;
  }

  /**
   * Abort all registered requests
   * Typically called in component disconnectedCallback
   */
  abortAll() {
    const count = this.controllers.size;
    if (count > 0) {
      this.controllers.forEach((controller, id) => {
        controller.abort();
        debugLog('request-registry', `Aborted request: ${id}`);
      });
      this.controllers.clear();
      debugLog('request-registry', `Aborted ${count} request(s)`);
    }
  }

  /**
   * Check if a request is registered
   *
   * @param {string} id - Request ID to check
   * @returns {boolean} True if the request is registered
   */
  has(id) {
    return this.controllers.has(id);
  }

  /**
   * Get the number of registered requests
   *
   * @returns {number} Number of registered requests
   */
  get size() {
    return this.controllers.size;
  }

  /**
   * Mark a request as complete (remove without aborting)
   *
   * @param {string} id - Request ID to mark complete
   * @returns {boolean} True if the request was found and removed
   */
  complete(id) {
    const existed = this.controllers.has(id);
    if (existed) {
      this.controllers.delete(id);
      debugLog('request-registry', `Completed request: ${id}`);
    }
    return existed;
  }
}

// Singleton instance for global request registry
let requestRegistryInstance = null;

/**
 * Get the singleton request registry instance
 *
 * @returns {RequestRegistry}
 */
export function getRequestRegistry() {
  if (!requestRegistryInstance) {
    requestRegistryInstance = new RequestRegistry();
  }
  return requestRegistryInstance;
}

/**
 * Create a new isolated request registry instance
 * Useful for per-component registries
 *
 * @returns {RequestRegistry}
 */
export function createRequestRegistry() {
  return new RequestRegistry();
}

export default RequestRegistry;
