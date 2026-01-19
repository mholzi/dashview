/**
 * Settings Diff Utility
 * Calculates delta between old and new settings for efficient WebSocket updates
 */

/**
 * Calculate the delta between old and new settings
 * Returns an object with changed paths using dot notation for nested values
 *
 * @param {Object|null|undefined} oldSettings - Previous settings state
 * @param {Object} newSettings - New settings state
 * @returns {Object|null} Delta object with changed paths, or null if full save needed
 */
export function calculateDelta(oldSettings, newSettings) {
  // If no previous settings, full save is needed
  if (oldSettings == null) {
    return null;
  }

  const changes = {};

  /**
   * Recursively compare objects and collect changes
   * @param {Object} oldObj - Old object
   * @param {Object} newObj - New object
   * @param {string} path - Current path prefix
   */
  function diff(oldObj, newObj, path = '') {
    // Get all keys from both objects
    const allKeys = new Set([
      ...Object.keys(oldObj || {}),
      ...Object.keys(newObj || {}),
    ]);

    for (const key of allKeys) {
      const fullPath = path ? `${path}.${key}` : key;
      const oldVal = oldObj?.[key];
      const newVal = newObj?.[key];

      // Skip if values are identical (by reference or primitive equality)
      if (oldVal === newVal) {
        continue;
      }

      // Check if key was removed (exists in old but not in new)
      if (!(key in (newObj || {}))) {
        changes[fullPath] = null; // null = delete marker
        continue;
      }

      // Handle arrays - compare by JSON string, replace entirely if different
      if (Array.isArray(newVal)) {
        if (!Array.isArray(oldVal) || JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
          changes[fullPath] = newVal;
        }
        continue;
      }

      // Handle nested objects - recurse
      if (
        typeof oldVal === 'object' &&
        oldVal !== null &&
        typeof newVal === 'object' &&
        newVal !== null &&
        !Array.isArray(oldVal)
      ) {
        diff(oldVal, newVal, fullPath);
        continue;
      }

      // Handle new nested object (old was not an object)
      if (typeof newVal === 'object' && newVal !== null && !Array.isArray(newVal)) {
        // Check if old value was an object too
        if (typeof oldVal !== 'object' || oldVal === null) {
          // Old wasn't an object, so we need to recurse into the new one
          diff({}, newVal, fullPath);
          continue;
        }
      }

      // Primitive value change or type change
      changes[fullPath] = newVal === undefined ? null : newVal;
    }
  }

  diff(oldSettings, newSettings);
  return changes;
}

/**
 * Apply delta changes to a base settings object
 * Handles dot notation paths for nested updates
 *
 * @param {Object|null|undefined} base - Base settings object
 * @param {Object} delta - Delta object with changed paths
 * @returns {Object} New settings object with delta applied
 */
export function applyDelta(base, delta) {
  // Start with a deep copy of base (or empty object if base is null/undefined)
  const result = base != null ? JSON.parse(JSON.stringify(base)) : {};

  for (const [path, value] of Object.entries(delta)) {
    // Split path into parts for nested access
    const parts = path.split('.');

    if (parts.length === 1) {
      // Top-level key
      if (value === null) {
        delete result[path];
      } else {
        result[path] = value;
      }
    } else {
      // Nested path - navigate to parent and set/delete value
      let current = result;

      // Navigate to parent, creating nested objects as needed
      for (let i = 0; i < parts.length - 1; i++) {
        const part = parts[i];
        if (!(part in current) || typeof current[part] !== 'object' || current[part] === null) {
          current[part] = {};
        }
        current = current[part];
      }

      // Set or delete the final key
      const finalKey = parts[parts.length - 1];
      if (value === null) {
        delete current[finalKey];
      } else {
        current[finalKey] = value;
      }
    }
  }

  return result;
}
