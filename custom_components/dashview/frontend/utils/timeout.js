/**
 * Timeout Utilities
 * Provides timeout protection for async operations to prevent UI hangs
 */

/**
 * Wraps a promise with a timeout
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @param {string} name - Operation name for error message (default: 'Operation')
 * @returns {Promise} Resolves with original result or rejects with timeout error
 */
export function withTimeout(promise, timeoutMs = 30000, name = 'Operation') {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${name} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise])
    .finally(() => clearTimeout(timeoutId));
}

/**
 * Creates an abortable timeout wrapper using AbortController
 * @param {function} asyncFn - Async function that accepts AbortSignal as first parameter
 * @param {number} timeoutMs - Timeout in milliseconds (default: 30000)
 * @param {string} name - Operation name for error message (default: 'Operation')
 * @returns {Promise} Result or timeout/abort error
 */
export function withAbortableTimeout(asyncFn, timeoutMs = 30000, name = 'Operation') {
  const controller = new AbortController();
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      controller.abort();
      reject(new Error(`${name} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  const operationPromise = asyncFn(controller.signal);

  return Promise.race([operationPromise, timeoutPromise])
    .finally(() => clearTimeout(timeoutId));
}

/**
 * Creates a timeout wrapper that can be cancelled externally
 * @param {Promise} promise - The promise to wrap
 * @param {number} timeoutMs - Timeout in milliseconds
 * @param {string} name - Operation name for error message
 * @returns {{promise: Promise, cancel: Function}} Object with promise and cancel function
 */
export function createCancellableTimeout(promise, timeoutMs = 30000, name = 'Operation') {
  let timeoutId;
  let cancelled = false;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      if (!cancelled) {
        reject(new Error(`${name} timed out after ${timeoutMs}ms`));
      }
    }, timeoutMs);
  });

  const wrappedPromise = Promise.race([promise, timeoutPromise])
    .finally(() => clearTimeout(timeoutId));

  return {
    promise: wrappedPromise,
    cancel: () => {
      cancelled = true;
      clearTimeout(timeoutId);
    }
  };
}

/**
 * Timeout constants for common operations
 */
export const TIMEOUT_DEFAULTS = {
  FILE_READ: 10000,      // 10 seconds for file reading
  PHOTO_UPLOAD: 30000,   // 30 seconds for photo upload
  WS_CALL: 15000,        // 15 seconds for WebSocket calls
  HISTORY_FETCH: 20000,  // 20 seconds for historical data
  SERVICE_CALL: 10000,   // 10 seconds for HA service calls
};

export default { withTimeout, withAbortableTimeout, createCancellableTimeout, TIMEOUT_DEFAULTS };
