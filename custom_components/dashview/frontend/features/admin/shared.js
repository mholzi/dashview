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
import { t as importedT } from '../../utils/i18n.js';
import '../../components/controls/confirmation-dialog.js';

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
  { key: 'vibration', icon: 'mdi:vibrate', titleKey: 'admin.entityTypes.vibrationSensors', descKey: 'admin.entityTypes.vibrationDesc', prop: '_vibrationLabelId' },
  { key: 'temperature', icon: 'mdi:thermometer', titleKey: 'admin.entityTypes.temperatureSensors', descKey: 'admin.entityTypes.temperatureDesc', prop: '_temperatureLabelId' },
  { key: 'humidity', icon: 'mdi:water-percent', titleKey: 'admin.entityTypes.humiditySensors', descKey: 'admin.entityTypes.humidityDesc', prop: '_humidityLabelId' },
  { key: 'climate', icon: 'mdi:thermostat', titleKey: 'admin.entityTypes.climates', descKey: 'admin.entityTypes.climateDesc', prop: '_climateLabelId' },
  { key: 'mediaPlayer', icon: 'mdi:speaker', titleKey: 'admin.entityTypes.mediaPlayers', descKey: 'admin.entityTypes.mediaPlayerDesc', prop: '_mediaPlayerLabelId' },
  { key: 'tv', icon: 'mdi:television', titleKey: 'admin.entityTypes.tvs', descKey: 'admin.entityTypes.tvDesc', prop: '_tvLabelId' },
  { key: 'lock', icon: 'mdi:lock', titleKey: 'admin.entityTypes.locks', descKey: 'admin.entityTypes.lockDesc', prop: '_lockLabelId' },
];

/**
 * Render undo/redo controls for the admin panel
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Undo/redo controls HTML
 */
export function renderUndoRedoControls(panel, html) {
  const canUndo = panel._settingsStore?.canUndo() || false;
  const canRedo = panel._settingsStore?.canRedo() || false;
  const undoDesc = panel._settingsStore?.getUndoDescription() || '';
  const redoDesc = panel._settingsStore?.getRedoDescription() || '';

  // Get undo/redo counts
  const undoCount = panel._undoCount || 0;
  const redoCount = panel._redoCount || 0;

  return html`
    <div class="undo-redo-controls">
      <button class="icon-button" ?disabled=${!canUndo}
        title=${undoDesc ? t('admin.undoAction', { action: undoDesc }) : t('admin.noUndo')}
        @click=${() => {
          if (panel._settingsStore?.undo) {
            panel._settingsStore.undo();
          }
        }}>
        <ha-icon icon="mdi:arrow-u-left-top"></ha-icon>
        ${canUndo && undoCount > 0 ? html`<span class="count">(${undoCount})</span>` : ''}
      </button>
      <button class="icon-button" ?disabled=${!canRedo}
        title=${redoDesc ? t('admin.redoAction', { action: redoDesc }) : t('admin.noRedo')}
        @click=${() => {
          if (panel._settingsStore?.redo) {
            panel._settingsStore.redo();
          }
        }}>
        <ha-icon icon="mdi:arrow-u-right-top"></ha-icon>
        ${canRedo && redoCount > 0 ? html`<span class="count">(${redoCount})</span>` : ''}
      </button>
    </div>
  `;
}

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
          Keine Fenster in der Admin-Konfiguration aktiviert.
        </div>
      ` : html`
        <!-- Open Windows -->
        ${enabledWindows.filter(w => w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">Offene Fenster</h3>
          <div class="security-entity-list">
            ${enabledWindows.filter(w => w.isOpen).map(w => renderEntityCard(w, 'window'))}
          </div>
        ` : ''}

        <!-- Closed Windows -->
        ${enabledWindows.filter(w => !w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">Geschlossene Fenster</h3>
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
          Keine Garagentore in der Admin-Konfiguration aktiviert.
        </div>
      ` : html`
        <!-- Open Garages -->
        ${enabledGarages.filter(g => g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">Offene Garagentore</h3>
          <div class="security-entity-list">
            ${enabledGarages.filter(g => g.isOpen).map(g => renderEntityCard(g, 'garage'))}
          </div>
        ` : ''}

        <!-- Closed Garages -->
        ${enabledGarages.filter(g => !g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">Geschlossene Garagentore</h3>
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
          Keine Bewegungsmelder in der Admin-Konfiguration aktiviert.
        </div>
      ` : html`
        <!-- Active Motion -->
        ${enabledMotion.filter(m => m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">Bewegung erkannt</h3>
          <div class="security-entity-list">
            ${enabledMotion.filter(m => m.isActive).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}

        <!-- Inactive Motion -->
        ${enabledMotion.filter(m => !m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">Keine Bewegung</h3>
          <div class="security-entity-list">
            ${enabledMotion.filter(m => !m.isActive).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}
      `}
    ` : ''}
  `;
}
