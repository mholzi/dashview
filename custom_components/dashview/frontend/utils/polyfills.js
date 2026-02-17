/**
 * Polyfills Module
 * Provides polyfills for browser APIs not available in older browsers.
 *
 * structuredClone polyfill for Safari <15.4, Chrome <98, Firefox <94
 *
 * Usage:
 *   import { initPolyfills, structuredClonePolyfill } from './polyfills.js';
 *
 * This is the single source of truth for the structuredClone polyfill.
 * Imported synchronously at the top of dashview-panel.js via initPolyfills().
 */

/**
 * Deep clone implementation with circular reference detection.
 * Matches native structuredClone behavior for supported types.
 *
 * Supported types: primitives, null, undefined, Date, RegExp, Map, Set, Array, plain objects
 * NOT supported: functions, DOM nodes, symbols (not needed for settings)
 *
 * @param {*} obj - Value to clone
 * @param {WeakSet} [seen] - Internal tracking for circular references
 * @returns {*} Deep cloned value
 * @throws {DOMException} If circular reference detected
 */
export function structuredClonePolyfill(obj, seen = new WeakSet()) {
  // Handle primitives and null
  if (obj === null || typeof obj !== 'object') return obj;

  // Circular reference detection
  if (seen.has(obj)) {
    throw new DOMException('Circular reference detected', 'DataCloneError');
  }
  seen.add(obj);

  // Handle built-in types
  if (obj instanceof Date) return new Date(obj);
  if (obj instanceof RegExp) return new RegExp(obj);
  if (obj instanceof Map) {
    const clone = new Map();
    obj.forEach((v, k) => clone.set(structuredClonePolyfill(k, seen), structuredClonePolyfill(v, seen)));
    return clone;
  }
  if (obj instanceof Set) {
    const clone = new Set();
    obj.forEach(v => clone.add(structuredClonePolyfill(v, seen)));
    return clone;
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => structuredClonePolyfill(item, seen));
  }

  // Handle plain objects
  const clone = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = structuredClonePolyfill(obj[key], seen);
    }
  }
  return clone;
}

/**
 * Initialize polyfills if native implementations are not available.
 * Call this at application startup before any other code.
 *
 * @returns {boolean} True if polyfill was applied, false if native available
 */
export function initPolyfills() {
  if (typeof structuredClone === 'undefined') {
    globalThis.structuredClone = structuredClonePolyfill;
    return true;
  }
  return false;
}
