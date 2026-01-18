/**
 * Onboarding Module - Barrel Export
 * Re-exports all onboarding wizard functionality
 */

// Main wizard
export {
  renderWizard,
  shouldShowWizard,
  resetWizard,
  wizardStyles
} from './wizard.js';

// Steps - re-export from steps/index.js
export {
  // Welcome Step
  renderWelcomeStep,
  welcomeStepStyles,
  // Floor Order Step
  renderFloorsStep,
  floorsStepStyles,
  getFloorOrder,
  saveFloorOrder,
  getFloorIcon,
  // Room Order Step
  renderRoomsStep,
  roomsStepStyles,
  getRoomOrderConfig,
  saveRoomOrderConfig,
  // Labels Step
  renderLabelsStep,
  labelsStepStyles,
  getLabelsConfig,
  saveLabelsConfig,
  // Room Configuration Step (formerly Entities Step)
  renderEntitiesStep,
  entitiesStepStyles,
  saveEntitySelections,
  getEntitySelections,
  // Floor Cards Step
  renderFloorCardsStep,
  floorCardsStepStyles,
  getFloorCardsConfig,
  saveFloorCardsConfig,
  // Review Step
  renderReviewStep,
  reviewStepStyles,
  generateReviewSummary
} from './steps/index.js';

// Re-export SUGGESTED_DOMAINS from entities-step directly
export { SUGGESTED_DOMAINS } from './steps/entities-step.js';
