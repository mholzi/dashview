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

// Steps
export {
  renderWelcomeStep,
  welcomeStepStyles,
  renderFloorsStep,
  floorsStepStyles,
  renderRoomsStep,
  roomsStepStyles,
  renderEntitiesStep,
  entitiesStepStyles,
  SUGGESTED_DOMAINS,
  saveEntitySelections,
  getEntitySelections
} from './steps/index.js';
