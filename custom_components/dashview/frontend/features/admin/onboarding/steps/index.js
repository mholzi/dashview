/**
 * Onboarding Steps - Barrel Export
 * Re-exports all wizard step components
 */

// Welcome Step
export {
  renderWelcomeStep,
  welcomeStepStyles
} from './welcome-step.js';

// Floor Order Step
export {
  renderFloorsStep,
  floorsStepStyles,
  getFloorOrder,
  saveFloorOrder,
  getFloorIcon
} from './floors-step.js';

// Room Order Step
export {
  renderRoomsStep,
  roomsStepStyles,
  getRoomOrderConfig,
  saveRoomOrderConfig
} from './rooms-step.js';

// Labels Step
export {
  renderLabelsStep,
  labelsStepStyles,
  getLabelsConfig,
  saveLabelsConfig
} from './labels-step.js';

// Room Configuration Step (formerly Entities Step)
export {
  renderEntitiesStep,
  entitiesStepStyles,
  saveEntitySelections,
  getEntitySelections
} from './entities-step.js';

// Floor Cards Step
export {
  renderFloorCardsStep,
  floorCardsStepStyles,
  getFloorCardsConfig,
  saveFloorCardsConfig
} from './floor-cards-step.js';

// Review Step
export {
  renderReviewStep,
  reviewStepStyles,
  generateReviewSummary
} from './review-step.js';
