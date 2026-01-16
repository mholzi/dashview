/**
 * Dashview Panel Admin Module - Barrel Export
 * Re-exports all admin functionality from modular files
 *
 * This module provides backward-compatible exports for all admin render methods
 * while keeping the implementation split across focused, maintainable files.
 */

// Component side-effect imports (must be included for web components to register)
import '../../components/controls/confirmation-dialog.js';
import '../../components/controls/sortable-list.js';
import '../../components/cards/floor-card-preview.js';

// Shared utilities
export { t, showConfirmation, LABEL_CATEGORIES, renderSecurityPopupContent } from './shared.js';

// Entity tab exports
export { renderLabelMappingConfig, renderEntitiesTab } from './entities-tab.js';

// Layout tab exports
export {
  renderRoomConfig,
  renderCardConfig,
  renderSceneButtonItem,
  renderOrderConfig,
  renderAreaCard,
  renderLayoutTab,
  renderInfoTextToggle,
  renderInfoTextBatteryConfig
} from './layout-tab.js';

// Weather tab exports
export { renderWeatherTab } from './weather-tab.js';

// Status tab exports
export { renderStatusTab } from './status-tab.js';

// Scenes tab exports
export { renderScenesTab } from './scenes-tab.js';

// Users tab exports
export { renderUsersTab } from './users-tab.js';

// Modes tab exports
export { renderModesTab, modesTabStyles } from './modes-tab.js';

// Onboarding/Setup Wizard exports
export {
  renderWizard,
  shouldShowWizard,
  resetWizard,
  wizardStyles,
  renderWelcomeStep,
  renderFloorsStep,
  renderRoomsStep
} from './onboarding/index.js';

// Local imports for renderAdminTab
import {
  t,
  initializeSectionStates,
  updateAdminTabScrollIndicators,
  handleAdminTabDragStart,
  handleAdminTabWheel,
  isAdminTabDragging
} from './shared.js';
import { renderEntitiesTab } from './entities-tab.js';
import { renderLayoutTab } from './layout-tab.js';
import { renderWeatherTab } from './weather-tab.js';
import { renderStatusTab } from './status-tab.js';
import { renderScenesTab } from './scenes-tab.js';
import { renderUsersTab } from './users-tab.js';
import { renderModesTab } from './modes-tab.js';

/**
 * Render the main Admin tab with sub-tab navigation
 * This is the main entry point for the admin panel UI
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Admin panel HTML
 */
export function renderAdminTab(panel, html) {
  // Initialize section states from localStorage on first render
  if (!panel._sectionStatesInitialized) {
    initializeSectionStates(panel);
    panel._sectionStatesInitialized = true;
  }

  // Migrate old tab names to new ones
  if (panel._adminSubTab === 'rooms') panel._adminSubTab = 'entities';
  if (panel._adminSubTab === 'labels') panel._adminSubTab = 'entities';
  if (panel._adminSubTab === 'order' || panel._adminSubTab === 'floorcards') panel._adminSubTab = 'layout';
  if (panel._adminSubTab === 'cards') panel._adminSubTab = 'status';

  // Update scroll indicators after render
  requestAnimationFrame(() => updateAdminTabScrollIndicators(panel));

  // Helper to handle tab click with drag check
  const handleTabClick = (tab) => {
    if (isAdminTabDragging(panel)) return;
    panel._adminSubTab = tab;
  };

  return html`
    <div class="container">
      <!-- Admin Header with Sub-Tabs -->
      <div class="admin-sub-tabs-container">
        <div class="admin-sub-tabs-indicator admin-sub-tabs-indicator-left"></div>
        <div class="admin-sub-tabs"
          @scroll=${() => updateAdminTabScrollIndicators(panel)}
          @mousedown=${(e) => handleAdminTabDragStart(panel, e)}
          @wheel=${(e) => handleAdminTabWheel(panel, e)}
        >
          <button
            class="admin-sub-tab ${panel._adminSubTab === 'entities' ? 'active' : ''}"
            @click=${() => handleTabClick('entities')}
          >
            <ha-icon icon="mdi:home-group"></ha-icon>
            ${t('admin.tabs.entities')}
          </button>
          <button
            class="admin-sub-tab ${panel._adminSubTab === 'layout' ? 'active' : ''}"
            @click=${() => handleTabClick('layout')}
          >
            <ha-icon icon="mdi:view-grid-plus"></ha-icon>
            ${t('admin.tabs.layout')}
          </button>
          <button
            class="admin-sub-tab ${panel._adminSubTab === 'weather' ? 'active' : ''}"
            @click=${() => handleTabClick('weather')}
          >
            <ha-icon icon="mdi:weather-partly-cloudy"></ha-icon>
            ${t('admin.tabs.weather')}
          </button>
          <button
            class="admin-sub-tab ${panel._adminSubTab === 'status' ? 'active' : ''}"
            @click=${() => handleTabClick('status')}
          >
            <ha-icon icon="mdi:information-outline"></ha-icon>
            ${t('admin.tabs.status')}
          </button>
          <button
            class="admin-sub-tab ${panel._adminSubTab === 'scenes' ? 'active' : ''}"
            @click=${() => handleTabClick('scenes')}
          >
            <ha-icon icon="mdi:play-box-multiple"></ha-icon>
            ${t('admin.tabs.scenes')}
          </button>
          <button
            class="admin-sub-tab ${panel._adminSubTab === 'users' ? 'active' : ''}"
            @click=${() => handleTabClick('users')}
          >
            <ha-icon icon="mdi:account-group"></ha-icon>
            ${t('admin.tabs.users')}
          </button>
          <button
            class="admin-sub-tab ${panel._adminSubTab === 'modes' ? 'active' : ''}"
            @click=${() => handleTabClick('modes')}
          >
            <ha-icon icon="mdi:toggle-switch-outline"></ha-icon>
            ${t('admin.tabs.modes', 'Modes')}
          </button>
        </div>
        <div class="admin-sub-tabs-indicator admin-sub-tabs-indicator-right"></div>
      </div>

      ${panel._adminSubTab === 'entities'
        ? renderEntitiesTab(panel, html)
        : panel._adminSubTab === 'layout'
          ? renderLayoutTab(panel, html)
          : panel._adminSubTab === 'weather'
            ? renderWeatherTab(panel, html)
            : panel._adminSubTab === 'status'
              ? renderStatusTab(panel, html)
              : panel._adminSubTab === 'users'
                ? renderUsersTab(panel, html)
                : panel._adminSubTab === 'modes'
                  ? renderModesTab(panel, html)
                  : renderScenesTab(panel, html)}
    </div>
  `;
}
