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
  getEntityCounts,
  getRoomClimateNotification,
  getApplianceStatus,
  createRoomIndicator,
  getActiveRoomIndicators,
} from './render.js';
