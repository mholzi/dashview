/**
 * Onboarding Steps - Barrel Export
 * Re-exports all wizard step components
 */

// Welcome Step (Story 9.1)
export {
  renderWelcomeStep,
  welcomeStepStyles
} from './welcome-step.js';

// Floors Step (Story 9.1)
export {
  renderFloorsStep,
  floorsStepStyles
} from './floors-step.js';

// Rooms Step (Story 9.1)
export {
  renderRoomsStep,
  roomsStepStyles
} from './rooms-step.js';

// Entity Configuration Step (Story 9.2)
export {
  renderEntitiesStep,
  entitiesStepStyles,
  SUGGESTED_DOMAINS,
  saveEntitySelections,
  getEntitySelections
} from './entities-step.js';

// Layout Step (Story 9.3)
export {
  renderLayoutStep,
  layoutStepStyles,
  getFloorOrder,
  saveFloorOrder
} from './layout-step.js';

// Weather Step (Story 9.3)
export {
  renderWeatherStep,
  weatherStepStyles,
  getWeatherEntities,
  getWeatherSelection,
  saveWeatherEntity
} from './weather-step.js';

// Review Step (Story 9.3)
export {
  renderReviewStep,
  reviewStepStyles,
  generateReviewSummary
} from './review-step.js';
