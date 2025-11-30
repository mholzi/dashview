/**
 * Components Index
 * Main entry point for all reusable UI components
 *
 * Usage:
 *   import { renderToggleSwitch, renderChip } from './components/index.js';
 *
 * Or import from specific category:
 *   import { renderSlider } from './components/controls/index.js';
 */

// Controls
export {
  renderToggleSwitch,
  renderSlider,
  renderSearchInput,
  createSwipeHandlers,
  renderSwipeable,
  createLightSliderHandlers,
  renderLightSliderItem,
  renderEntityPicker,
  getEntitySuggestions,
  createEntityPickerState
} from './controls/index.js';

// Layout
export {
  renderSectionHeader,
  renderEmptyState,
  renderChip,
  renderPagination,
  renderFloorOverviewPagination,
  renderGarbagePagination,
  renderPopupHeader,
  renderPopupOverlay,
  createRoomIndicator,
  getRoomsWithActiveEntities,
  buildActivityIndicators,
  renderActivityRow
} from './layout/index.js';

// Cards
export {
  renderEntityItem,
  renderEntitySection,
  renderFloorOverviewSkeleton,
  renderGarbageCardSkeleton,
  renderRoomCardSkeleton,
  renderSkeletonCard
} from './cards/index.js';

// Charts
export {
  renderTemperatureChart,
  processHistoryData
} from './charts/index.js';
