/**
 * Module Registry
 * Centralizes access to late-loaded modules, replacing closure-scoped variables.
 * Modules register themselves after dynamic import; consumers retrieve via getModule().
 */

const _modules = new Map();

/**
 * Register a module by name
 * @param {string} name - Module identifier
 * @param {*} mod - Module reference
 */
export function registerModule(name, mod) {
  _modules.set(name, mod);
}

/**
 * Get a registered module by name
 * @param {string} name - Module identifier
 * @returns {*} Module reference or null if not registered
 */
export function getModule(name) {
  return _modules.get(name) || null;
}

/**
 * Check if a module is registered
 * @param {string} name - Module identifier
 * @returns {boolean}
 */
export function hasModule(name) {
  return _modules.has(name);
}
