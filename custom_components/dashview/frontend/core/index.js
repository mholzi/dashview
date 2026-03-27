/**
 * Core Utilities Index
 * Barrel export for all core panel utilities
 *
 * @module core
 */

// State Management
export {
  saveSettings,
  setCategoryLabel,
  updateRoomDataServiceLabelIds,
  updateRoomDataServiceEnabledMaps,
  buildEnabledMapFromRegistry,
} from './state.js';

// Event Handlers
export {
  getInvertedSliderPosition,
  getSliderPosition,
  handleLightSliderTouchStart,
  handleLightSliderTouchMove,
  handleLightSliderTouchEnd,
  handleLightSliderMouseDown,
  cleanupDragListeners,
  handleLightSliderClick,
  handlePopupOverlayClick,
  handleEntitySearch,
  clearEntitySearch,
  filterEntities,
  toggleEntityEnabled,
  toggleBoolProp,
  toggleAreaExpanded,
  toggleEntityTypeSection,
  handleFloorReorder,
  handleRoomReorder,
  handleMediaPresetReorder,
} from './events.js';

// Render Utilities
export {
  formatTimeAgo,
  formatGarageLastChanged,
  formatDate,
  formatRemainingTime,
  getLowBatteryDevices,
  getRoomClimateNotification,
  getApplianceStatus,
  createRoomIndicator,
  getActiveRoomIndicators,
} from './render.js';

// Request Registry
export {
  RequestRegistry,
  getRequestRegistry,
  createRequestRegistry,
} from './request-registry.js';

// Timeout utilities (re-export from utils)
export {
  withTimeout,
  withAbortableTimeout,
  createCancellableTimeout,
  TIMEOUT_DEFAULTS,
} from '../utils/timeout.js';

// Module Registry
export {
  registerModule,
  getModule,
  hasModule,
} from './module-registry.js';

// Panel Interface Validation
export {
  validatePanelInterface,
  REQUIRED_PANEL_METHODS,
  REQUIRED_PANEL_PROPERTIES,
} from './panel-interface.js';
