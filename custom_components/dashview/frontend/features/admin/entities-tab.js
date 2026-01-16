/**
 * Dashview Admin - Entities Tab
 * Entity configuration: label mapping and room-based entity toggles
 */

import { getFloorIcon } from '../../utils/index.js';
import { t, LABEL_CATEGORIES, createSectionHelpers } from './shared.js';
// renderAreaCard imported from barrel - circular import safe via re-export
import { renderAreaCard } from './index.js';
import { renderEmptyState } from '../../components/layout/empty-state.js';

/**
 * Render label mapping configuration section
 * Allows users to map their HA labels to DashView categories
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Label mapping config HTML
 */
export function renderLabelMappingConfig(panel, html) {
  // Get all available labels from HA
  const availableLabels = panel._labels || [];

  // Helper to get the current label name for a category
  const getLabelName = (labelId) => {
    if (!labelId) return null;
    const label = availableLabels.find(l => l.label_id === labelId);
    return label ? label.name : labelId;
  };

  // Helper to render a category mapping row
  const renderCategoryRow = (category) => {
    const currentLabelId = panel[category.prop];
    const currentLabel = currentLabelId ? availableLabels.find(l => l.label_id === currentLabelId) : null;

    return html`
      <div class="label-mapping-row">
        <div class="label-mapping-category">
          <div class="label-mapping-icon">
            <ha-icon icon="${category.icon}"></ha-icon>
          </div>
          <div class="label-mapping-info">
            <span class="label-mapping-title">${t(category.titleKey)}</span>
            <span class="label-mapping-description">${t(category.descKey)}</span>
          </div>
        </div>
        <div class="label-mapping-selector">
          <select
            .value=${currentLabelId || ''}
            style="border: 2px solid ${currentLabelId ? 'var(--dv-green)' : 'var(--dv-red)'}; border-radius: var(--dv-radius-sm);"
            @change=${(e) => {
              // Prevent changes during initial render/load
              if (!panel._settingsLoaded) return;
              const newLabelId = e.target.value || null;
              // Only update if the value actually changed
              if (newLabelId === currentLabelId || (newLabelId === null && currentLabelId === null)) return;
              panel._setCategoryLabel(category.key, newLabelId);
            }}
          >
            <option value="">${t('admin.entities.selectLabel')}</option>
            ${availableLabels.map(label => html`
              <option value="${label.label_id}" ?selected=${currentLabelId === label.label_id}>
                ${label.name}
              </option>
            `)}
          </select>
        </div>
      </div>
    `;
  };

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:tag-multiple"></ha-icon>
      ${t('admin.entities.labelConfig')}
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 24px;">
      ${t('admin.entities.labelConfigDesc')}
    </p>

    ${availableLabels.length === 0 ? renderEmptyState(html, {
      icon: 'mdi:tag-off-outline',
      title: t('admin.entities.noLabels'),
      description: 'Create labels in Home Assistant first: Settings → Labels → Create Label',
      hint: 'Then assign labels to your entities and come back here to configure the mapping'
    }) : html`
      <div class="label-mapping-list">
        ${LABEL_CATEGORIES.map(category => renderCategoryRow(category))}
      </div>

      <div class="label-mapping-hint">
        <ha-icon icon="mdi:information-outline"></ha-icon>
        <p>After configuring labels, go to the <strong>Rooms</strong> tab to enable specific entities for each room.</p>
      </div>
    `}
  `;
}

/**
 * Render the Entities tab (label mapping + room entity configuration)
 * @param {Object} panel - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Entities tab HTML
 */
export function renderEntitiesTab(panel, html) {
  // Initialize search state if not exists
  if (!panel._entitySearchQuery) panel._entitySearchQuery = '';

  // Get ordered floors and rooms
  const orderedFloors = panel._getOrderedFloors();

  // Calculate total enabled counts
  let totalRooms = 0;
  let enabledRooms = 0;
  panel._areas.forEach(area => {
    totalRooms++;
    if (panel._enabledRooms[area.area_id] !== false) enabledRooms++;
  });

  // Filter rooms based on search query
  const searchQuery = panel._entitySearchQuery ? panel._entitySearchQuery.toLowerCase() : '';
  const filterRooms = (rooms) => {
    if (!searchQuery) return rooms;
    return rooms.filter(room => room.name.toLowerCase().includes(searchQuery));
  };

  // Section toggle helpers with localStorage persistence
  const { toggleSection, isExpanded } = createSectionHelpers(panel);

  // Get all available labels from HA for label configuration
  const availableLabels = panel._labels || [];

  // Helper to render a category mapping row
  const renderCategoryRow = (category) => {
    const currentLabelId = panel[category.prop];
    const currentLabel = currentLabelId ? availableLabels.find(l => l.label_id === currentLabelId) : null;

    return html`
      <div class="label-mapping-row">
        <div class="label-mapping-category">
          <div class="label-mapping-icon">
            <ha-icon icon="${category.icon}"></ha-icon>
          </div>
          <div class="label-mapping-info">
            <span class="label-mapping-title">${t(category.titleKey)}</span>
            <span class="label-mapping-description">${t(category.descKey)}</span>
          </div>
        </div>
        <div class="label-mapping-selector">
          <select
            .value=${currentLabelId || ''}
            style="border: 2px solid ${currentLabelId ? 'var(--dv-green)' : 'var(--dv-red)'}; border-radius: var(--dv-radius-sm);"
            @change=${(e) => {
              // Prevent changes during initial render/load
              if (!panel._settingsLoaded) return;
              const newLabelId = e.target.value || null;
              // Only update if the value actually changed
              if (newLabelId === currentLabelId || (newLabelId === null && currentLabelId === null)) return;
              panel._setCategoryLabel(category.key, newLabelId);
            }}
          >
            <option value="">${t('admin.entities.selectLabel')}</option>
            ${availableLabels.map(label => html`
              <option value="${label.label_id}" ?selected=${currentLabelId === label.label_id}>
                ${label.name}
              </option>
            `)}
          </select>
        </div>
      </div>
    `;
  };

  return html`
    <h2 class="section-title">
      <ha-icon icon="mdi:home-group"></ha-icon>
      Entities
    </h2>
    <p style="color: var(--dv-gray600); margin-bottom: 20px;">
      Configure label mappings and enable entities for each room.
    </p>

    <!-- Label Configuration Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('labelConfig')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:tag-multiple"></ha-icon>
          Label Configuration
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('labelConfig') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('labelConfig') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          ${t('admin.entities.labelConfigDesc')}
        </p>

        ${availableLabels.length === 0 ? renderEmptyState(html, {
          icon: 'mdi:tag-off-outline',
          title: t('admin.entities.noLabels'),
          description: 'Create labels in Home Assistant first: Settings → Labels → Create Label',
          hint: 'Then assign labels to your entities and come back here to configure the mapping'
        }) : html`
          <div class="label-mapping-list">
            ${LABEL_CATEGORIES.map(category => renderCategoryRow(category))}
          </div>
        `}
      </div>
    </div>

    <!-- Entity Configuration Section -->
    <div class="card-config-section" style="border: 1px solid var(--dv-gray300); border-radius: 12px; margin-bottom: 16px;">
      <div class="card-config-section-header" @click=${() => toggleSection('entityConfig')}>
        <div class="card-config-section-title">
          <ha-icon icon="mdi:home-group"></ha-icon>
          Room Configuration
          <span style="font-size: 14px; font-weight: 400; margin-left: 8px; color: var(--dv-gray600);">
            ${enabledRooms}/${totalRooms} rooms enabled
          </span>
        </div>
        <ha-icon
          class="card-config-section-chevron ${isExpanded('entityConfig') ? 'expanded' : ''}"
          icon="mdi:chevron-down"
        ></ha-icon>
      </div>
      <div class="card-config-section-content ${isExpanded('entityConfig') ? 'expanded' : ''}">
        <p style="color: var(--dv-gray600); margin-bottom: 16px; font-size: 14px;">
          Enable rooms and configure which entities appear on the dashboard. Click a room to expand and toggle individual devices.
        </p>

        <!-- Global Search -->
        <div class="entity-global-search" style="margin-bottom: 20px;">
          <div class="garbage-search-input-wrapper">
            <ha-icon icon="mdi:magnify" class="garbage-search-icon"></ha-icon>
            <input
              type="text"
              class="garbage-search-input"
              placeholder="${t('admin.entities.searchRooms')}"
              .value=${panel._entitySearchQuery || ''}
              @input=${(e) => {
                panel._entitySearchQuery = e.target.value;
                panel.requestUpdate();
              }}
            />
            ${panel._entitySearchQuery ? html`
              <ha-icon
                icon="mdi:close"
                class="garbage-search-clear"
                @click=${() => {
                  panel._entitySearchQuery = '';
                  panel.requestUpdate();
                }}
              ></ha-icon>
            ` : ''}
          </div>
        </div>

        <!-- Room List -->
        ${panel._areas.length > 0
          ? html`
              ${orderedFloors.map(floor => {
                const roomsForFloor = filterRooms(panel._getOrderedRoomsForFloor(floor.floor_id));
                if (roomsForFloor.length === 0) return '';
                return html`
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; padding-left: 4px; display: flex; align-items: center; gap: 8px;">
                      <ha-icon icon="${getFloorIcon(floor)}" style="--mdc-icon-size: 18px;"></ha-icon>
                      ${floor.name}
                      <span style="font-weight: 400; opacity: 0.7;">(${roomsForFloor.length} rooms)</span>
                    </div>
                    ${roomsForFloor.map((area) => renderAreaCard(panel, html, area))}
                  </div>
                `;
              })}
              ${(() => {
                const unassignedRooms = filterRooms(panel._getOrderedRoomsForFloor(null));
                if (unassignedRooms.length === 0) return '';
                return html`
                  <div style="margin-bottom: 8px;">
                    <div style="font-size: 14px; font-weight: 500; color: var(--dv-gray600); margin-bottom: 8px; padding-left: 4px; display: flex; align-items: center; gap: 8px;">
                      <ha-icon icon="mdi:help-circle-outline" style="--mdc-icon-size: 18px;"></ha-icon>
                      ${t('admin.entities.unassignedRooms')}
                      <span style="font-weight: 400; opacity: 0.7;">(${unassignedRooms.length} rooms)</span>
                    </div>
                    ${unassignedRooms.map((area) => renderAreaCard(panel, html, area))}
                  </div>
                `;
              })()}
            `
          : renderEmptyState(html, {
              icon: 'mdi:home-alert',
              title: t('admin.entities.noAreas'),
              description: t('admin.entities.noAreasHint')
            })}
      </div>
    </div>
  `;
}
