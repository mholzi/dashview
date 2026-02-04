/**
 * DashView Frontend - Barrel Export
 *
 * This file provides a single import point for all DashView frontend modules.
 *
 * Usage:
 *   import { renderPagination, createSwipeHandlers } from './index.js';
 *   import { ENTITY_CONFIGS, WEATHER_CONDITIONS } from './index.js';
 */

// ============================================================================
// COMPONENTS
// ============================================================================

// Controls
export { createSwipeHandlers, renderSwipeable } from './components/controls/swipeable.js';
export { renderToggleSwitch } from './components/controls/toggle-switch.js';
export { renderSlider } from './components/controls/slider.js';
export { renderSearchInput } from './components/controls/search-input.js';

// Layout
export { renderPagination, renderFloorOverviewPagination, renderGarbagePagination } from './components/layout/pagination.js';
export { renderChip } from './components/layout/chip.js';
export { renderEmptyState } from './components/layout/empty-state.js';
export { renderSectionHeader } from './components/layout/section-header.js';

// Cards
export { renderEntityCard } from './components/cards/entity-card.js';
export { renderEntitySection } from './components/cards/entity-item.js';
export {
  renderFloorOverviewSkeleton,
  renderGarbageCardSkeleton,
  renderRoomCardSkeleton,
  renderSkeletonCard
} from './components/cards/skeleton.js';

// ============================================================================
// FEATURES
// ============================================================================

// Home
export {
  renderHomeTab,
  renderRaeumeSection,
  renderFloorOverviewCard,
  renderRoomCardsGrid,
  renderGarbageCard,
  renderDwdWarnings
} from './features/home/index.js';

// Admin
export {
  renderAdminTab,
  renderRoomConfig,
  renderCardConfig,
  renderOrderConfig,
  renderSecurityPopupContent,
  renderAreaCard
} from './features/admin/index.js';

// Weather
export {
  renderWeatherHeader,
  renderWeatherPopup,
  renderDwdWarnings as renderWeatherWarnings,
  getWeatherIcon,
  translateWeatherCondition
} from './features/weather/index.js';

// Security
export {
  renderSecurityPopupContent as renderSecurityPopup,
  renderBatteryPopupContent
} from './features/security/popups.js';

// ============================================================================
// UTILITIES
// ============================================================================

export { triggerHaptic } from './utils/haptic.js';
export {
  getFloorIcon,
  getAreaIcon,
  getWeatherIcon as getWeatherIconUtil,
  translateWeatherCondition as translateWeather
} from './utils/icons.js';
export { formatLastChanged, formatTimeAgo, formatDate } from './utils/formatters.js';
export { getFriendlyName } from './utils/helpers.js';

// ============================================================================
// CONSTANTS
// ============================================================================

export {
  DOMAINS,
  STATES,
  ICONS,
  ENTITY_CONFIGS,
  WEATHER_CONDITIONS,
  WEATHER_ICONS
} from './constants/index.js';

// ============================================================================
// STYLES
// ============================================================================

export { COLORS, SPACING, RADIUS, SHADOWS, GRADIENTS } from './styles/tokens.js';
export { baseStyles, hostStyles, typographyStyles } from './styles/base.js';

// ============================================================================
// STORES (for advanced usage)
// ============================================================================

export { getSettingsStore, SettingsStore } from './stores/settings-store.js';
export { getUIStateStore, UIStateStore } from './stores/ui-state-store.js';
export { getRegistryStore, RegistryStore } from './stores/registry-store.js';

// ============================================================================
// SERVICES
// ============================================================================

export { getEntityDisplayService, EntityDisplayService } from './services/entity-display-service.js';
export { getRoomDataService, RoomDataService } from './services/room-data-service.js';
