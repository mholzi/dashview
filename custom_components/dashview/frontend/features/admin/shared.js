/**
 * Dashview Admin Shared Utilities
 * Common utilities, constants, and helper functions used across admin tabs
 */

import {
  getFloorIcon,
  formatLastChanged,
  getFriendlyName,
  sortByName,
  getEnabledEntitiesSortedByLastChanged,
  isStateOn,
  isStateOpen
} from '../../utils/index.js';
import { t as importedT, getCurrentLang } from '../../utils/i18n.js';
export { getCurrentLang };
import '../../components/controls/confirmation-dialog.js';

// ============================================================================
// Section State Persistence
// ============================================================================

const SECTION_STORAGE_KEY = 'dashview_admin_expanded_sections';
let sectionSaveTimeout = null;
let cachedSectionStates = null;

/**
 * Get all saved admin section states from localStorage
 * @returns {Object} Section states object { sectionId: boolean }
 */
export function getAdminSectionStates() {
  if (cachedSectionStates !== null) return cachedSectionStates;
  try {
    const stored = localStorage.getItem(SECTION_STORAGE_KEY);
    cachedSectionStates = stored ? JSON.parse(stored) : {};
    return cachedSectionStates;
  } catch (e) {
    console.warn('Failed to load admin section states:', e);
    cachedSectionStates = {};
    return cachedSectionStates;
  }
}

/**
 * Save a section's expanded state to localStorage (debounced)
 * @param {string} sectionId - The section identifier
 * @param {boolean} isExpanded - Whether the section is expanded
 */
export function saveAdminSectionState(sectionId, isExpanded) {
  const states = getAdminSectionStates();
  states[sectionId] = isExpanded;
  // Note: states === cachedSectionStates, so cache is already updated

  // Debounced save to avoid excessive localStorage writes
  clearTimeout(sectionSaveTimeout);
  sectionSaveTimeout = setTimeout(() => {
    try {
      localStorage.setItem(SECTION_STORAGE_KEY, JSON.stringify(states));
    } catch (e) {
      console.warn('Failed to save admin section states:', e);
    }
  }, 500);
}

/**
 * Check if a section is expanded, with fallback to default state
 * @param {string} sectionId - The section identifier
 * @param {boolean} defaultState - Default state if no saved state exists (default: false)
 * @returns {boolean} Whether the section is expanded
 */
export function isSectionExpanded(sectionId, defaultState = false) {
  const states = getAdminSectionStates();
  return sectionId in states ? states[sectionId] : defaultState;
}

/**
 * Clear the cached section states (useful for testing)
 */
export function clearSectionStatesCache() {
  cachedSectionStates = null;
}

/**
 * Create section toggle and isExpanded helpers for an admin tab
 * @param {Object} panel - The DashviewPanel instance
 * @returns {Object} { toggleSection, isExpanded } helper functions
 */
export function createSectionHelpers(panel) {
  const toggleSection = (sectionId) => {
    const newState = !panel._expandedCardSections[sectionId];
    panel._expandedCardSections = {
      ...panel._expandedCardSections,
      [sectionId]: newState
    };
    saveAdminSectionState(sectionId, newState);
    panel.requestUpdate();
  };

  const isExpanded = (sectionId, defaultState = false) => {
    // First check panel state (for reactivity)
    if (sectionId in panel._expandedCardSections) {
      return panel._expandedCardSections[sectionId];
    }
    // Fall back to persisted state with default
    return isSectionExpanded(sectionId, defaultState);
  };

  return { toggleSection, isExpanded };
}

/**
 * Initialize panel section states from localStorage
 * Call this once when the admin panel first loads
 * @param {Object} panel - The DashviewPanel instance
 */
export function initializeSectionStates(panel) {
  const savedStates = getAdminSectionStates();
  panel._expandedCardSections = { ...panel._expandedCardSections, ...savedStates };
}

// ============================================================================
// Tab Scroll Indicators
// ============================================================================

/**
 * Update admin tab scroll indicators based on scroll position
 * Shows left/right gradients when more tabs are available in that direction
 * @param {Object} panel - The DashviewPanel instance
 */
export function updateAdminTabScrollIndicators(panel) {
  if (!panel.renderRoot) return;

  const container = panel.renderRoot.querySelector('.admin-sub-tabs');
  const leftIndicator = panel.renderRoot.querySelector('.admin-sub-tabs-indicator-left');
  const rightIndicator = panel.renderRoot.querySelector('.admin-sub-tabs-indicator-right');

  if (!container || !leftIndicator || !rightIndicator) return;

  const { scrollLeft, scrollWidth, clientWidth } = container;

  // Show left indicator if scrolled right (more tabs on left)
  const hasMoreLeft = scrollLeft > 0;
  leftIndicator.classList.toggle('visible', hasMoreLeft);

  // Show right indicator if more content on right (-1 for rounding tolerance)
  const hasMoreRight = scrollLeft + clientWidth < scrollWidth - 1;
  rightIndicator.classList.toggle('visible', hasMoreRight);
}

// ============================================================================
// Tab Drag Scroll (Mouse Drag Scrolling)
// ============================================================================

/**
 * Initialize drag scroll state on the panel
 * Call this once during admin tab setup
 * @param {Object} panel - The DashviewPanel instance
 */
export function initAdminTabDragScroll(panel) {
  // Initialize drag scroll state if not already present
  if (panel._adminTabDragState) return;

  panel._adminTabDragState = {
    isDragging: false,
    startX: 0,
    scrollLeft: 0,
  };

  // Bind handlers to panel for proper cleanup
  panel._handleAdminTabDragMove = (e) => {
    if (!panel._adminTabDragState) return;
    const container = panel.renderRoot?.querySelector('.admin-sub-tabs');
    if (!container) return;

    const dx = e.pageX - panel._adminTabDragState.startX;
    // Use 5px threshold to distinguish click from drag
    if (Math.abs(dx) > 5) {
      panel._adminTabDragState.isDragging = true;
      container.classList.add('dragging');
    }
    if (panel._adminTabDragState.isDragging) {
      e.preventDefault();
      container.scrollLeft = panel._adminTabDragState.scrollLeft - dx;
      updateAdminTabScrollIndicators(panel);
    }
  };

  panel._handleAdminTabDragEnd = () => {
    const container = panel.renderRoot?.querySelector('.admin-sub-tabs');
    if (container) {
      container.classList.remove('dragging');
    }
    document.removeEventListener('mousemove', panel._handleAdminTabDragMove);
    document.removeEventListener('mouseup', panel._handleAdminTabDragEnd);
    // Reset isDragging after a short delay to allow click events to check it
    setTimeout(() => {
      if (panel._adminTabDragState) {
        panel._adminTabDragState.isDragging = false;
      }
    }, 0);
  };
}

/**
 * Handle mousedown on admin tab container to start drag scroll
 * @param {Object} panel - The DashviewPanel instance
 * @param {MouseEvent} e - The mousedown event
 */
export function handleAdminTabDragStart(panel, e) {
  // Initialize if needed
  initAdminTabDragScroll(panel);

  const container = panel.renderRoot?.querySelector('.admin-sub-tabs');
  if (!container) return;

  panel._adminTabDragState.isDragging = false;
  panel._adminTabDragState.startX = e.pageX;
  panel._adminTabDragState.scrollLeft = container.scrollLeft;

  document.addEventListener('mousemove', panel._handleAdminTabDragMove);
  document.addEventListener('mouseup', panel._handleAdminTabDragEnd);
}

/**
 * Handle wheel event on admin tab container for horizontal scroll
 * Supports both horizontal wheel and Shift + vertical scroll
 * @param {Object} panel - The DashviewPanel instance
 * @param {WheelEvent} e - The wheel event
 */
export function handleAdminTabWheel(panel, e) {
  const container = panel.renderRoot?.querySelector('.admin-sub-tabs');
  if (!container) return;

  // Check if this is a horizontal scroll (horizontal wheel or Shift + vertical)
  const deltaX = e.deltaX || (e.shiftKey ? e.deltaY : 0);

  if (deltaX !== 0) {
    e.preventDefault();
    container.scrollLeft += deltaX;
    updateAdminTabScrollIndicators(panel);
  }
}

/**
 * Check if a tab click should be blocked due to active drag
 * Call this at the start of tab click handlers
 * @param {Object} panel - The DashviewPanel instance
 * @returns {boolean} True if click should be blocked
 */
export function isAdminTabDragging(panel) {
  return panel._adminTabDragState?.isDragging === true;
}

/**
 * Cleanup drag scroll listeners (call in disconnectedCallback)
 * @param {Object} panel - The DashviewPanel instance
 */
export function cleanupAdminTabDragScroll(panel) {
  if (panel._handleAdminTabDragMove) {
    document.removeEventListener('mousemove', panel._handleAdminTabDragMove);
  }
  if (panel._handleAdminTabDragEnd) {
    document.removeEventListener('mouseup', panel._handleAdminTabDragEnd);
  }
  panel._adminTabDragState = null;
}

// Defensive wrapper for t() to handle edge cases with card-mod and other invasive components
// Falls back to returning the key if the translation function fails
export const t = (key, fallbackOrParams) => {
  try {
    return importedT(key, fallbackOrParams);
  } catch (e) {
    // If t fails for any reason, return the key as fallback
    return typeof fallbackOrParams === 'string' ? fallbackOrParams : key;
  }
};

/**
 * Show a confirmation dialog for destructive actions
 * @param {Object} panel - The DashviewPanel instance
 * @param {Object} options - Dialog configuration
 * @param {string} options.title - The dialog title
 * @param {string} options.message - The confirmation message
 * @param {Function} options.onConfirm - Callback to execute on confirmation
 * @param {boolean} options.destructive - Whether this is a destructive action (default: true)
 */
export function showConfirmation(panel, { title, message, onConfirm, destructive = true }) {
  const dialog = document.createElement('confirmation-dialog');
  dialog.title = title;
  dialog.message = message;
  dialog.confirmText = t('common.actions.confirm');
  dialog.cancelText = t('common.actions.cancel');
  dialog.destructive = destructive;

  dialog.addEventListener('confirm', () => {
    onConfirm();
    dialog.remove();
  });

  dialog.addEventListener('cancel', () => {
    dialog.remove();
  });

  dialog.open = true;
  panel.renderRoot.appendChild(dialog);
}

/**
 * Category definitions for label mapping
 * Each category has an icon, title, description and the property name used in the panel
 */
export const LABEL_CATEGORIES = [
  { key: 'light', icon: 'mdi:lightbulb-group', titleKey: 'admin.entityTypes.lights', descKey: 'admin.entityTypes.lightDesc', prop: '_lightLabelId' },
  { key: 'cover', icon: 'mdi:window-shutter', titleKey: 'admin.entityTypes.covers', descKey: 'admin.entityTypes.coverDesc', prop: '_coverLabelId' },
  { key: 'roofWindow', icon: 'mdi:window-open', titleKey: 'admin.entityTypes.roofWindows', descKey: 'admin.entityTypes.roofWindowDesc', prop: '_roofWindowLabelId' },
  { key: 'window', icon: 'mdi:window-closed-variant', titleKey: 'admin.entityTypes.windows', descKey: 'admin.entityTypes.windowDesc', prop: '_windowLabelId' },
  { key: 'garage', icon: 'mdi:garage', titleKey: 'admin.entityTypes.garages', descKey: 'admin.entityTypes.garageDesc', prop: '_garageLabelId' },
  { key: 'motion', icon: 'mdi:motion-sensor', titleKey: 'admin.entityTypes.motionSensors', descKey: 'admin.entityTypes.motionDesc', prop: '_motionLabelId' },
  { key: 'smoke', icon: 'mdi:smoke-detector', titleKey: 'admin.entityTypes.smokeSensors', descKey: 'admin.entityTypes.smokeDesc', prop: '_smokeLabelId' },
  { key: 'waterLeak', icon: 'mdi:water-alert', titleKey: 'admin.entityTypes.waterLeakSensors', descKey: 'admin.entityTypes.waterLeakDesc', prop: '_waterLeakLabelId' },
  { key: 'vibration', icon: 'mdi:vibrate', titleKey: 'admin.entityTypes.vibrationSensors', descKey: 'admin.entityTypes.vibrationDesc', prop: '_vibrationLabelId' },
  { key: 'temperature', icon: 'mdi:thermometer', titleKey: 'admin.entityTypes.temperatureSensors', descKey: 'admin.entityTypes.temperatureDesc', prop: '_temperatureLabelId' },
  { key: 'humidity', icon: 'mdi:water-percent', titleKey: 'admin.entityTypes.humiditySensors', descKey: 'admin.entityTypes.humidityDesc', prop: '_humidityLabelId' },
  { key: 'climate', icon: 'mdi:thermostat', titleKey: 'admin.entityTypes.climates', descKey: 'admin.entityTypes.climateDesc', prop: '_climateLabelId' },
  { key: 'mediaPlayer', icon: 'mdi:speaker', titleKey: 'admin.entityTypes.mediaPlayers', descKey: 'admin.entityTypes.mediaPlayerDesc', prop: '_mediaPlayerLabelId' },
  { key: 'tv', icon: 'mdi:television', titleKey: 'admin.entityTypes.tvs', descKey: 'admin.entityTypes.tvDesc', prop: '_tvLabelId' },
  { key: 'lock', icon: 'mdi:lock', titleKey: 'admin.entityTypes.locks', descKey: 'admin.entityTypes.lockDesc', prop: '_lockLabelId' },
];

/**
 * Render security popup content (windows, garages, motion sensors)
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Security popup content HTML
 */
export function renderSecurityPopupContent(panel, html) {
  if (!panel.hass) return html``;

  // Helper to filter enabled entities by current label
  // Iterates over entity registry (not enabledMap) to support default-enabled behavior
  const filterByCurrentLabel = (enabledMap, labelId) => {
    if (!labelId) return {};
    const filtered = {};
    panel._entityRegistry.forEach((entityReg) => {
      const entityId = entityReg.entity_id;
      // Skip explicitly disabled entities (enabled by default)
      if (enabledMap[entityId] === false) return;
      // Check if entity has the required label
      if (entityReg.labels && entityReg.labels.includes(labelId)) {
        filtered[entityId] = true;
      }
    });
    return filtered;
  };

  // Get enabled windows - sorted by last changed, filtered by current label
  const enabledWindows = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(panel._enabledWindows, panel._windowLabelId),
    panel.hass,
    (state) => ({ isOpen: isStateOn(state) })
  );

  // Get enabled motion sensors - sorted by last changed, filtered by current label
  const enabledMotion = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(panel._enabledMotionSensors, panel._motionLabelId),
    panel.hass,
    (state) => ({ isActive: isStateOn(state) })
  );

  // Get enabled garages - sorted by last changed, filtered by current label
  const enabledGarages = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(panel._enabledGarages, panel._garageLabelId),
    panel.hass,
    (state) => ({ isOpen: isStateOpen(state) })
  );

  // Count active entities
  const openWindowsCount = enabledWindows.filter(w => w.isOpen).length;
  const activeMotionCount = enabledMotion.filter(m => m.isActive).length;
  const openGaragesCount = enabledGarages.filter(g => g.isOpen).length;

  // Render entity card
  const renderEntityCard = (entity, type) => {
    const isActive = type === 'window' ? entity.isOpen : (type === 'garage' ? entity.isOpen : entity.isActive);
    let icon;
    if (type === 'window') {
      icon = entity.isOpen ? 'mdi:window-open' : 'mdi:window-closed';
    } else if (type === 'garage') {
      icon = entity.isOpen ? 'mdi:garage-open' : 'mdi:garage';
    } else {
      icon = entity.isActive ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
    }

    return html`
      <div
        class="security-entity-card ${isActive ? 'active' : 'inactive'}"
        @click=${() => panel._showMoreInfo(entity.entityId)}
      >
        <div class="security-entity-icon">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="security-entity-name">${getFriendlyName(entity.state)}</div>
        <div class="security-entity-last-changed">${formatLastChanged(entity.state.last_changed)}</div>
      </div>
    `;
  };

  return html`
    <!-- Security Tabs -->
    <div class="security-tabs">
      <button
        class="security-tab ${panel._activeSecurityTab === 'windows' ? 'active' : ''}"
        @click=${() => panel._activeSecurityTab = 'windows'}
      >
        <ha-icon icon="mdi:window-open"></ha-icon>
        <span>${openWindowsCount} von ${enabledWindows.length}</span>
      </button>
      <button
        class="security-tab ${panel._activeSecurityTab === 'garage' ? 'active' : ''}"
        @click=${() => panel._activeSecurityTab = 'garage'}
      >
        <ha-icon icon="mdi:garage"></ha-icon>
        <span>${openGaragesCount} von ${enabledGarages.length}</span>
      </button>
      <button
        class="security-tab ${panel._activeSecurityTab === 'motion' ? 'active' : ''}"
        @click=${() => panel._activeSecurityTab = 'motion'}
      >
        <ha-icon icon="mdi:motion-sensor"></ha-icon>
        <span>${activeMotionCount} von ${enabledMotion.length}</span>
      </button>
    </div>

    <!-- Windows Content -->
    ${panel._activeSecurityTab === 'windows' ? html`
      ${enabledWindows.length === 0 ? html`
        <div class="security-empty-state">
          ${t('admin.security.noWindowsEnabled')}
        </div>
      ` : html`
        <!-- Open Windows -->
        ${enabledWindows.filter(w => w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('admin.security.openWindows')}</h3>
          <div class="security-entity-list">
            ${enabledWindows.filter(w => w.isOpen).map(w => renderEntityCard(w, 'window'))}
          </div>
        ` : ''}

        <!-- Closed Windows -->
        ${enabledWindows.filter(w => !w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('admin.security.closedWindows')}</h3>
          <div class="security-entity-list">
            ${enabledWindows.filter(w => !w.isOpen).map(w => renderEntityCard(w, 'window'))}
          </div>
        ` : ''}
      `}
    ` : ''}

    <!-- Garage Content -->
    ${panel._activeSecurityTab === 'garage' ? html`
      ${enabledGarages.length === 0 ? html`
        <div class="security-empty-state">
          ${t('admin.security.noGaragesEnabled')}
        </div>
      ` : html`
        <!-- Open Garages -->
        ${enabledGarages.filter(g => g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('admin.security.openGarages')}</h3>
          <div class="security-entity-list">
            ${enabledGarages.filter(g => g.isOpen).map(g => renderEntityCard(g, 'garage'))}
          </div>
        ` : ''}

        <!-- Closed Garages -->
        ${enabledGarages.filter(g => !g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('admin.security.closedGarages')}</h3>
          <div class="security-entity-list">
            ${enabledGarages.filter(g => !g.isOpen).map(g => renderEntityCard(g, 'garage'))}
          </div>
        ` : ''}
      `}
    ` : ''}

    <!-- Motion Content -->
    ${panel._activeSecurityTab === 'motion' ? html`
      ${enabledMotion.length === 0 ? html`
        <div class="security-empty-state">
          ${t('admin.security.noMotionEnabled')}
        </div>
      ` : html`
        <!-- Active Motion -->
        ${enabledMotion.filter(m => m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">${t('admin.security.motionDetected')}</h3>
          <div class="security-entity-list">
            ${enabledMotion.filter(m => m.isActive).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}

        <!-- Inactive Motion -->
        ${enabledMotion.filter(m => !m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">${t('admin.security.noMotion')}</h3>
          <div class="security-entity-list">
            ${enabledMotion.filter(m => !m.isActive).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}
      `}
    ` : ''}
  `;
}
