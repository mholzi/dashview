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
  createEntityPickerState,
  SortableList
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
  renderCustomEntityItem,
  renderCustomLabelSection,
  renderFloorOverviewSkeleton,
  renderGarbageCardSkeleton,
  renderRoomCardSkeleton,
  renderSkeletonCard,
  renderEntityCard,
  renderEmptyCard,
  EntityCardFactory,
  createEntityCardFactory,
  FloorCardPreview
} from './cards/index.js';

// Charts
export {
  renderTemperatureChart,
  processHistoryData
} from './charts/index.js';

// Onboarding
export {
  renderCoachMark,
  shouldShowCoachMark,
  dismissCoachMark
} from './onboarding/index.js';
