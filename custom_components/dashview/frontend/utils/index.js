/**
 * Utils Index
 * Re-exports all utility functions for easy importing
 *
 * Usage:
 *   import { formatDate, getAreaIcon, triggerHaptic } from './utils/index.js';
 *
 * Polyfills:
 *   structuredClone polyfill is INLINED in dashview-panel.js for load-order safety.
 *   The polyfills.js module provides the same implementation for testing.
 */

// Polyfills (for testing - actual polyfill is inlined in dashview-panel.js)
export { structuredClonePolyfill, initPolyfills } from './polyfills.js';

// Haptic feedback
export {
  triggerHaptic,
  hapticSuccess,
  hapticWarning,
  hapticLongPress,
  isHapticSupported
} from './haptic.js';

// Formatters (canonical source of truth for all date/time formatting)
export {
  formatGarageLastChanged,
  formatDate,
  formatLastChanged,
  formatAbsoluteTime,
  parseGarbageState,
  formatTimeAgo,
  formatDuration,
} from './formatters.js';

// Icons
export {
  getAreaIcon,
  getFloorIcon,
  getFloorLabel,
  getWeatherIcon,
  translateWeatherCondition
} from './icons.js';

// Entity utilities
export {
  getEntityCounts,
  getFriendlyName
} from './entities.js';

// General helpers
export {
  sortByCustomOrder,
  clamp,
  calculateSliderPercentage,
  debounce,
  deepMerge,
  toggleEntityEnabled,
  setEntitiesEnabled,
  getEnabledEntitiesForArea,
  calculateTimeDifference,
  getEnabledEntityIds,
  formatTimeAgoGerman,
  formatDurationGerman,
  // Consolidated sorting utilities
  sortByName,
  sortByKey,
  sortByLastChanged,
  sortByNumericProperty,
  // Entity state utilities
  isEntityStateValid,
  filterEntitiesByState,
  getFriendlyName as getFriendlyNameFromState,
  parseNumericState,
  // Entity mapping utilities
  mapEnabledEntities,
  getEnabledEntitiesSortedByLastChanged,
  // State check utilities
  isStateOn,
  isStateOff,
  isStateOpen,
  isStateOneOf,
  // Timer utilities
  formatRemainingTime,
  // Event utilities
  openMoreInfo,
  // Light service utilities
  toggleLight,
  turnOnLight,
  turnOffLight,
} from './helpers.js';

// Error boundary utilities
export {
  safeHandler,
  safeHandlerSync,
  createSafeServiceCaller
} from './error-boundary.js';

// Timeout utilities
export {
  withTimeout,
  withAbortableTimeout,
  createCancellableTimeout,
  TIMEOUT_DEFAULTS
} from './timeout.js';

// Error message utilities
export {
  mapPhotoError,
  PHOTO_ERRORS
} from './error-messages.js';

// Schema validation utilities
export {
  SETTINGS_SCHEMA,
  isValidType,
  isInRange,
  validateSetting,
  validateSettings,
  validateSettingsUpdate
} from './schema-validator.js';

// Gesture handler utilities
export {
  createGestureHandler,
  GESTURE_STATE,
  GESTURE_DEFAULTS
} from './gesture-handler.js';

// Settings diff utilities
export {
  calculateDelta,
  applyDelta
} from './settings-diff.js';

// Entity suggestions utilities
export {
  getUnusedEntitiesForCategory,
  getAllSuggestionsForArea,
  getUnusedEntityCount,
  getMissingSuggestions,
  renderSuggestionsBanner
} from './entity-suggestions.js';
