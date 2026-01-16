/**
 * Dashview Admin - Modes Tab
 * Dashboard mode configuration (Day, Night, Away, etc.)
 */

import { t } from './shared.js';
import { getModeStore } from '../../stores/index.js';

/**
 * Modes tab styles
 */
export const modesTabStyles = `
  .dv-modes-tab {
    padding: var(--dv-spacing-md, 16px);
  }

  .dv-modes-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--dv-spacing-lg, 24px);
  }

  .dv-modes-header h3 {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .dv-modes-create-btn {
    display: flex;
    align-items: center;
    gap: var(--dv-spacing-xs, 4px);
    padding: var(--dv-spacing-sm, 8px) var(--dv-spacing-md, 16px);
    background: var(--primary-color);
    color: var(--text-primary-color, #fff);
    border: none;
    border-radius: var(--dv-radius-md, 8px);
    cursor: pointer;
    font-size: 0.875rem;
    font-weight: 500;
    transition: opacity 0.2s;
  }

  .dv-modes-create-btn:hover {
    opacity: 0.9;
  }

  .dv-modes-list {
    display: flex;
    flex-direction: column;
    gap: var(--dv-spacing-sm, 8px);
  }

  .dv-mode-item {
    display: flex;
    align-items: center;
    padding: var(--dv-spacing-md, 16px);
    background: var(--card-background-color, #fff);
    border-radius: var(--dv-radius-md, 8px);
    border: 1px solid var(--divider-color, #e0e0e0);
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .dv-mode-item:hover {
    border-color: var(--primary-color);
  }

  .dv-mode-item.active {
    border-color: var(--primary-color);
    box-shadow: 0 0 0 1px var(--primary-color);
  }

  .dv-mode-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: var(--dv-spacing-xs, 4px);
  }

  .dv-mode-name {
    font-size: 1rem;
    font-weight: 500;
    color: var(--primary-text-color);
    display: flex;
    align-items: center;
    gap: var(--dv-spacing-sm, 8px);
  }

  .dv-mode-badge {
    font-size: 0.7rem;
    padding: 2px 6px;
    border-radius: 4px;
    text-transform: uppercase;
    font-weight: 600;
  }

  .dv-mode-badge.default {
    background: var(--secondary-background-color);
    color: var(--secondary-text-color);
  }

  .dv-mode-badge.active {
    background: var(--success-color, #4caf50);
    color: #fff;
  }

  .dv-mode-settings-summary {
    font-size: 0.8rem;
    color: var(--secondary-text-color);
  }

  .dv-mode-actions {
    display: flex;
    gap: var(--dv-spacing-xs, 4px);
  }

  .dv-mode-action-btn {
    padding: var(--dv-spacing-sm, 8px);
    background: transparent;
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--dv-radius-sm, 4px);
    cursor: pointer;
    color: var(--primary-text-color);
    transition: background-color 0.2s, border-color 0.2s;
  }

  .dv-mode-action-btn:hover:not(:disabled) {
    background: var(--secondary-background-color);
    border-color: var(--primary-color);
  }

  .dv-mode-action-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .dv-mode-action-btn.activate {
    color: var(--primary-color);
  }

  .dv-mode-action-btn.delete {
    color: var(--error-color, #f44336);
  }

  .dv-mode-action-btn.delete:hover:not(:disabled) {
    border-color: var(--error-color, #f44336);
  }

  /* Mode Editor Dialog */
  .dv-mode-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .dv-mode-editor {
    background: var(--card-background-color, #fff);
    border-radius: var(--dv-radius-lg, 12px);
    padding: var(--dv-spacing-lg, 24px);
    width: 90%;
    max-width: 480px;
    max-height: 80vh;
    overflow-y: auto;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
  }

  .dv-mode-editor h3 {
    margin: 0 0 var(--dv-spacing-lg, 24px) 0;
    font-size: 1.25rem;
    font-weight: 500;
  }

  .dv-mode-editor-form {
    display: flex;
    flex-direction: column;
    gap: var(--dv-spacing-md, 16px);
  }

  .dv-mode-editor-field {
    display: flex;
    flex-direction: column;
    gap: var(--dv-spacing-xs, 4px);
  }

  .dv-mode-editor-field label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--primary-text-color);
  }

  .dv-mode-editor-field input[type="text"] {
    padding: var(--dv-spacing-sm, 8px) var(--dv-spacing-md, 16px);
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--dv-radius-sm, 4px);
    font-size: 1rem;
    background: var(--card-background-color);
    color: var(--primary-text-color);
  }

  .dv-mode-editor-field input:focus {
    outline: none;
    border-color: var(--primary-color);
  }

  .dv-mode-editor-fieldset {
    border: 1px solid var(--divider-color, #e0e0e0);
    border-radius: var(--dv-radius-md, 8px);
    padding: var(--dv-spacing-md, 16px);
    margin: 0;
  }

  .dv-mode-editor-fieldset legend {
    font-size: 0.875rem;
    font-weight: 500;
    padding: 0 var(--dv-spacing-sm, 8px);
    color: var(--primary-text-color);
  }

  .dv-mode-editor-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--dv-spacing-sm, 8px) 0;
  }

  .dv-mode-editor-toggle-label {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .dv-mode-editor-toggle-label span:first-child {
    font-size: 0.875rem;
    color: var(--primary-text-color);
  }

  .dv-mode-editor-toggle-label span:last-child {
    font-size: 0.75rem;
    color: var(--secondary-text-color);
  }

  .dv-mode-editor-actions {
    display: flex;
    justify-content: flex-end;
    gap: var(--dv-spacing-sm, 8px);
    margin-top: var(--dv-spacing-lg, 24px);
    padding-top: var(--dv-spacing-md, 16px);
    border-top: 1px solid var(--divider-color, #e0e0e0);
  }

  .dv-mode-editor-btn {
    padding: var(--dv-spacing-sm, 8px) var(--dv-spacing-lg, 24px);
    border-radius: var(--dv-radius-md, 8px);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: opacity 0.2s;
  }

  .dv-mode-editor-btn.cancel {
    background: transparent;
    border: 1px solid var(--divider-color, #e0e0e0);
    color: var(--primary-text-color);
  }

  .dv-mode-editor-btn.save {
    background: var(--primary-color);
    border: none;
    color: var(--text-primary-color, #fff);
  }

  .dv-mode-editor-btn:hover {
    opacity: 0.9;
  }

  /* Empty state */
  .dv-modes-empty {
    text-align: center;
    padding: var(--dv-spacing-xl, 32px);
    color: var(--secondary-text-color);
  }

  .dv-modes-empty ha-icon {
    font-size: 3rem;
    margin-bottom: var(--dv-spacing-md, 16px);
    opacity: 0.5;
  }

  /* Delete confirmation */
  .dv-mode-delete-confirm {
    background: var(--card-background-color, #fff);
    border-radius: var(--dv-radius-lg, 12px);
    padding: var(--dv-spacing-lg, 24px);
    width: 90%;
    max-width: 360px;
    text-align: center;
  }

  .dv-mode-delete-confirm h4 {
    margin: 0 0 var(--dv-spacing-sm, 8px) 0;
    color: var(--primary-text-color);
  }

  .dv-mode-delete-confirm p {
    margin: 0 0 var(--dv-spacing-lg, 24px) 0;
    color: var(--secondary-text-color);
    font-size: 0.875rem;
  }

  .dv-mode-delete-confirm-actions {
    display: flex;
    justify-content: center;
    gap: var(--dv-spacing-sm, 8px);
  }

  .dv-mode-delete-btn {
    padding: var(--dv-spacing-sm, 8px) var(--dv-spacing-lg, 24px);
    border-radius: var(--dv-radius-md, 8px);
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .dv-mode-delete-btn.cancel {
    background: transparent;
    border: 1px solid var(--divider-color, #e0e0e0);
    color: var(--primary-text-color);
  }

  .dv-mode-delete-btn.confirm {
    background: var(--error-color, #f44336);
    border: none;
    color: #fff;
  }
`;

/**
 * Get settings summary for a mode
 * @param {Object} mode - Mode object
 * @returns {string} Settings summary
 */
function getSettingsSummary(mode) {
  const settings = mode.settings || {};
  const features = [];

  if (settings.dimmedUI) features.push(t('admin.modes.dimmedUI', 'Dimmed'));
  if (settings.reducedAnimations) features.push(t('admin.modes.reducedAnimations', 'Reduced animations'));
  if (settings.disableHaptics) features.push(t('admin.modes.disableHaptics', 'No haptics'));
  if (settings.muteNotifications) features.push(t('admin.modes.muteNotifications', 'Muted'));
  if (settings.floorOrderOverride) features.push(t('admin.modes.customOrder', 'Custom order'));
  if (settings.defaultFloor) features.push(t('admin.modes.defaultFloor', 'Default floor'));

  if (features.length === 0) {
    return t('admin.modes.noOverrides', 'No overrides');
  }

  return features.join(' · ');
}

/**
 * Render the mode editor dialog
 * @param {Object} panel - DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Object|null} mode - Mode to edit (null for new)
 * @returns {TemplateResult}
 */
function renderModeEditor(panel, html, mode) {
  const isNew = !mode;
  const settings = mode?.settings || {};

  // Initialize editor state if not present
  if (!panel._modeEditorState) {
    panel._modeEditorState = {
      name: mode?.name || '',
      settings: { ...settings }
    };
  }

  const editorState = panel._modeEditorState;

  const handleNameChange = (e) => {
    panel._modeEditorState.name = e.target.value;
    panel.requestUpdate();
  };

  const handleToggle = (key) => {
    panel._modeEditorState.settings[key] = !panel._modeEditorState.settings[key];
    panel.requestUpdate();
  };

  const handleSave = () => {
    const modeStore = getModeStore();
    const name = panel._modeEditorState.name.trim();

    if (!name) {
      return; // Don't save empty name
    }

    if (isNew) {
      modeStore.createMode(name);
      const newModeId = Object.keys(modeStore.modes).find(
        id => modeStore.modes[id].name === name && id !== 'default'
      );
      if (newModeId) {
        modeStore.updateMode(newModeId, { settings: panel._modeEditorState.settings });
      }
    } else {
      modeStore.updateMode(mode.id, {
        name,
        settings: panel._modeEditorState.settings
      });
    }

    panel._modeEditorState = null;
    panel._editingModeId = null;
    panel.requestUpdate();
  };

  const handleCancel = () => {
    panel._modeEditorState = null;
    panel._editingModeId = null;
    panel.requestUpdate();
  };

  return html`
    <div class="dv-mode-editor-overlay" @click=${(e) => e.target === e.currentTarget && handleCancel()}>
      <div class="dv-mode-editor">
        <h3>${isNew ? t('admin.modes.createTitle', 'Create Mode') : t('admin.modes.editTitle', 'Edit Mode')}</h3>

        <div class="dv-mode-editor-form">
          <div class="dv-mode-editor-field">
            <label for="mode-name">${t('admin.modes.name', 'Mode Name')}</label>
            <input
              type="text"
              id="mode-name"
              .value=${editorState.name}
              @input=${handleNameChange}
              placeholder=${t('admin.modes.namePlaceholder', 'e.g., Night Mode')}
            />
          </div>

          <fieldset class="dv-mode-editor-fieldset">
            <legend>${t('admin.modes.behavior', 'Behavior Settings')}</legend>

            <div class="dv-mode-editor-toggle">
              <div class="dv-mode-editor-toggle-label">
                <span>${t('admin.modes.dimmedUI', 'Dimmed UI')}</span>
                <span>${t('admin.modes.dimmedUIDesc', 'Reduce overall brightness')}</span>
              </div>
              <ha-switch
                .checked=${editorState.settings.dimmedUI || false}
                @change=${() => handleToggle('dimmedUI')}
              ></ha-switch>
            </div>

            <div class="dv-mode-editor-toggle">
              <div class="dv-mode-editor-toggle-label">
                <span>${t('admin.modes.reducedAnimations', 'Reduced Animations')}</span>
                <span>${t('admin.modes.reducedAnimationsDesc', 'Minimize motion effects')}</span>
              </div>
              <ha-switch
                .checked=${editorState.settings.reducedAnimations || false}
                @change=${() => handleToggle('reducedAnimations')}
              ></ha-switch>
            </div>

            <div class="dv-mode-editor-toggle">
              <div class="dv-mode-editor-toggle-label">
                <span>${t('admin.modes.disableHaptics', 'Disable Haptics')}</span>
                <span>${t('admin.modes.disableHapticsDesc', 'Turn off vibration feedback')}</span>
              </div>
              <ha-switch
                .checked=${editorState.settings.disableHaptics || false}
                @change=${() => handleToggle('disableHaptics')}
              ></ha-switch>
            </div>

            <div class="dv-mode-editor-toggle">
              <div class="dv-mode-editor-toggle-label">
                <span>${t('admin.modes.muteNotifications', 'Mute Notifications')}</span>
                <span>${t('admin.modes.muteNotificationsDesc', 'Silence non-critical alerts')}</span>
              </div>
              <ha-switch
                .checked=${editorState.settings.muteNotifications || false}
                @change=${() => handleToggle('muteNotifications')}
              ></ha-switch>
            </div>
          </fieldset>
        </div>

        <div class="dv-mode-editor-actions">
          <button class="dv-mode-editor-btn cancel" @click=${handleCancel}>
            ${t('common.cancel', 'Cancel')}
          </button>
          <button class="dv-mode-editor-btn save" @click=${handleSave} ?disabled=${!editorState.name.trim()}>
            ${t('common.save', 'Save')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render delete confirmation dialog
 * @param {Object} panel - DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Object} mode - Mode to delete
 * @returns {TemplateResult}
 */
function renderDeleteConfirmation(panel, html, mode) {
  const handleConfirm = () => {
    const modeStore = getModeStore();
    modeStore.deleteMode(mode.id);
    panel._deletingModeId = null;
    panel.requestUpdate();
  };

  const handleCancel = () => {
    panel._deletingModeId = null;
    panel.requestUpdate();
  };

  return html`
    <div class="dv-mode-editor-overlay" @click=${(e) => e.target === e.currentTarget && handleCancel()}>
      <div class="dv-mode-delete-confirm">
        <h4>${t('admin.modes.deleteTitle', 'Delete Mode')}</h4>
        <p>${t('admin.modes.deleteConfirm', 'Are you sure you want to delete')} "${mode.name}"?</p>
        <div class="dv-mode-delete-confirm-actions">
          <button class="dv-mode-delete-btn cancel" @click=${handleCancel}>
            ${t('common.cancel', 'Cancel')}
          </button>
          <button class="dv-mode-delete-btn confirm" @click=${handleConfirm}>
            ${t('common.delete', 'Delete')}
          </button>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the Modes tab
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Modes tab HTML
 */
export function renderModesTab(panel, html) {
  const modeStore = getModeStore();

  // Ensure mode store is loaded
  modeStore.load();

  const modes = modeStore.modesList;
  const activeMode = modeStore.activeMode;

  // Subscribe to mode changes for reactivity
  if (!panel._modeStoreUnsubscribe) {
    panel._modeStoreUnsubscribe = modeStore.subscribe(() => {
      panel.requestUpdate();
    });
  }

  const handleCreateMode = () => {
    panel._editingModeId = 'new';
    panel._modeEditorState = {
      name: '',
      settings: {}
    };
    panel.requestUpdate();
  };

  const handleEditMode = (modeId) => {
    const mode = modeStore.getMode(modeId);
    panel._editingModeId = modeId;
    panel._modeEditorState = {
      name: mode.name,
      settings: { ...mode.settings }
    };
    panel.requestUpdate();
  };

  const handleDuplicateMode = (modeId) => {
    modeStore.duplicateMode(modeId);
    panel.requestUpdate();
  };

  const handleDeleteMode = (modeId) => {
    panel._deletingModeId = modeId;
    panel.requestUpdate();
  };

  const handleActivateMode = (modeId) => {
    modeStore.activateMode(modeId);
    panel.requestUpdate();
  };

  // Render the editor dialog if editing
  const editingMode = panel._editingModeId === 'new'
    ? null
    : panel._editingModeId
      ? modeStore.getMode(panel._editingModeId)
      : null;

  // Render delete confirmation if deleting
  const deletingMode = panel._deletingModeId
    ? modeStore.getMode(panel._deletingModeId)
    : null;

  return html`
    <style>${modesTabStyles}</style>
    <div class="dv-modes-tab">
      <div class="dv-modes-header">
        <h3>${t('admin.modes.title', 'Dashboard Modes')}</h3>
        <button class="dv-modes-create-btn" @click=${handleCreateMode}>
          <ha-icon icon="mdi:plus"></ha-icon>
          ${t('admin.modes.create', 'Create Mode')}
        </button>
      </div>

      <div class="dv-modes-list">
        ${modes.map(mode => html`
          <div class="dv-mode-item ${mode.id === activeMode ? 'active' : ''}">
            <div class="dv-mode-info">
              <div class="dv-mode-name">
                ${mode.name}
                ${mode.id === 'default' ? html`
                  <span class="dv-mode-badge default">${t('admin.modes.default', 'Default')}</span>
                ` : ''}
                ${mode.id === activeMode ? html`
                  <span class="dv-mode-badge active">${t('admin.modes.active', 'Active')}</span>
                ` : ''}
              </div>
              <div class="dv-mode-settings-summary">${getSettingsSummary(mode)}</div>
            </div>
            <div class="dv-mode-actions">
              ${mode.id !== activeMode ? html`
                <button
                  class="dv-mode-action-btn activate"
                  @click=${() => handleActivateMode(mode.id)}
                  title=${t('admin.modes.activate', 'Activate')}
                >
                  <ha-icon icon="mdi:check-circle-outline"></ha-icon>
                </button>
              ` : ''}
              <button
                class="dv-mode-action-btn"
                @click=${() => handleEditMode(mode.id)}
                title=${t('common.edit', 'Edit')}
              >
                <ha-icon icon="mdi:pencil"></ha-icon>
              </button>
              <button
                class="dv-mode-action-btn"
                @click=${() => handleDuplicateMode(mode.id)}
                title=${t('common.duplicate', 'Duplicate')}
              >
                <ha-icon icon="mdi:content-copy"></ha-icon>
              </button>
              <button
                class="dv-mode-action-btn delete"
                @click=${() => handleDeleteMode(mode.id)}
                ?disabled=${!mode.deletable}
                title=${t('common.delete', 'Delete')}
              >
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          </div>
        `)}
      </div>

      ${panel._editingModeId ? renderModeEditor(panel, html, editingMode) : ''}
      ${deletingMode ? renderDeleteConfirmation(panel, html, deletingMode) : ''}
    </div>
  `;
}
