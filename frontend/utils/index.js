/**
 * Utils Index
 * Re-exports all utility functions for easy importing
 *
 * Usage:
 *   import { formatDate, getAreaIcon, triggerHaptic } from './utils/index.js';
 */

// Haptic feedback
export { triggerHaptic } from './haptic.js';

// Formatters
export {
  formatGarageLastChanged,
  formatDate,
  formatLastChanged,
  parseGarbageState
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
