/**
 * DashView Styles - Main Barrel Export
 * Aggregates all CSS styles from modular files
 *
 * Structure:
 * - colors.js: Color system (light/dark mode CSS variables)
 * - layout/: Header, skeleton, tab-bar, sections
 * - components/: Activity icons, cards, security, entity-picker
 * - popups/: Shared popup, room, media, weather, devices, changelog
 * - admin/: Tabs, config, entities, floor-cards, scenes, order, presets, main
 */

// Color System
import { colorStyles } from './colors.js';

// Layout
import { headerStyles } from './layout/header.js';
import { skeletonStyles } from './layout/skeleton.js';
import { tabBarStyles } from './layout/tab-bar.js';
import { sectionsStyles } from './layout/sections.js';

// Components
import { activityIconStyles } from './components/activity-icons.js';
import { cardStyles } from './components/cards.js';
import { securityStyles } from './components/security.js';
import { entityPickerStyles } from './components/entity-picker.js';

// Popups
import { sharedPopupStyles } from './popups/shared.js';
import { roomPopupStyles } from './popups/room.js';
import { mediaPopupStyles } from './popups/media.js';
import { weatherPopupStyles } from './popups/weather.js';
import { devicesPopupStyles } from './popups/devices.js';
import { changelogPopupStyles } from './popups/changelog.js';
import { userPopupStyles } from './popups/user.js';
import { waterPopupStyles } from './popups/water.js';

// Admin
import { tabsStyles } from './admin/tabs.js';
import { configStyles } from './admin/config.js';
import { entitiesStyles } from './admin/entities.js';
import { floorCardsStyles } from './admin/floor-cards.js';
import { scenesStyles } from './admin/scenes.js';
import { orderStyles } from './admin/order.js';
import { presetsStyles } from './admin/presets.js';
import { mainStyles } from './admin/main.js';

// Onboarding
import { coachMarkStyles } from './onboarding/index.js';

/**
 * Combined CSS styles string (backward compatible export name)
 * Concatenates all modular styles in proper order
 */
export const dashviewStyles = `
${colorStyles}
${headerStyles}
${skeletonStyles}
${tabBarStyles}
${sectionsStyles}
${activityIconStyles}
${cardStyles}
${securityStyles}
${entityPickerStyles}
${sharedPopupStyles}
${roomPopupStyles}
${mediaPopupStyles}
${weatherPopupStyles}
${devicesPopupStyles}
${changelogPopupStyles}
${userPopupStyles}
${waterPopupStyles}
${tabsStyles}
${configStyles}
${entitiesStyles}
${floorCardsStyles}
${scenesStyles}
${orderStyles}
${presetsStyles}
${mainStyles}
${coachMarkStyles}
`;

// Alias for new code
export const styles = dashviewStyles;

// Re-export individual styles for selective imports
export {
  // Colors
  colorStyles,
  // Layout
  headerStyles,
  skeletonStyles,
  tabBarStyles,
  sectionsStyles,
  // Components
  activityIconStyles,
  cardStyles,
  securityStyles,
  entityPickerStyles,
  // Popups
  sharedPopupStyles,
  roomPopupStyles,
  mediaPopupStyles,
  weatherPopupStyles,
  devicesPopupStyles,
  changelogPopupStyles,
  userPopupStyles,
  waterPopupStyles,
  // Admin
  tabsStyles,
  configStyles,
  entitiesStyles,
  floorCardsStyles,
  scenesStyles,
  orderStyles,
  presetsStyles,
  mainStyles,
  // Onboarding
  coachMarkStyles,
};
