/**
 * Dashview Admin - Scenes Tab
 * Scene button configuration for main page and room popups
 */

import { t, createSectionHelpers } from './shared.js';
import { renderSceneButtonItem } from './layout-tab.js';
import { renderEmptyState } from '../../components/layout/empty-state.js';

/**
 * Render the Scenes tab (extracted from Cards)
 * Features: Scene buttons
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Scenes tab HTML
 */
export function renderScenesTab(panel, html) {
  // Section toggle helpers with localStorage persistence
  const { toggleSection, isExpanded } = createSectionHelpers(panel);

  // Separate global vs room-specific buttons
  const globalButtons = panel._sceneButtons.filter(b => !b.roomId);
  const roomButtons = panel._sceneButtons.filter(b => b.roomId);

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:play-box-multiple"></ha-icon>
      Scenes & Actions
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      Configure quick action buttons and custom entity labels.
    </p>

    <!-- Scene Buttons Section -->
    <div class="card-config-section">
      <div class="card-config-section-header" @click=${() => toggleSection('sceneButtons')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:gesture-tap-button"></ha-icon>
          Scene Buttons
          <span style="margin-left: 8px; font-size: 12px; opacity: 0.7;">(${panel._sceneButtons.length} buttons)</span>
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('sceneButtons') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('sceneButtons') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Configure quick action buttons. Global buttons appear on the main page, room buttons appear in room popups.
        </p>

        <!-- Global Buttons -->
        ${globalButtons.length > 0 ? html`
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <ha-icon icon="mdi:home" style="--mdc-icon-size: 16px;"></ha-icon>
              Main Page Buttons (${globalButtons.length})
            </div>
            <div class="scene-buttons-list">
              ${globalButtons.map((button) => {
                const index = panel._sceneButtons.indexOf(button);
                return renderSceneButtonItem(panel, html, button, index);
              })}
            </div>
          </div>
        ` : ''}

        <!-- Room Buttons -->
        ${roomButtons.length > 0 ? html`
          <div style="margin-bottom: 16px;">
            <div style="font-size: 13px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; display: flex; align-items: center; gap: 6px;">
              <ha-icon icon="mdi:door" style="--mdc-icon-size: 16px;"></ha-icon>
              Room Buttons (${roomButtons.length})
            </div>
            <div class="scene-buttons-list">
              ${roomButtons.map((button) => {
                const index = panel._sceneButtons.indexOf(button);
                return renderSceneButtonItem(panel, html, button, index);
              })}
            </div>
          </div>
        ` : ''}

        ${panel._sceneButtons.length === 0 ? renderEmptyState(html, {
          icon: 'mdi:gesture-tap-button',
          title: t('admin.scenes.noButtons'),
          hint: t('admin.scenes.noButtonsHint')
        }) : ''}

        <!-- Add New Scene Button -->
        <button class="scene-button-add" @click=${() => panel._addSceneButton()}>
          <ha-icon icon="mdi:plus"></ha-icon>
          Add Scene Button
        </button>
      </div>
    </div>
  `;
}
