/**
 * Entity Item Component
 * A card/row for displaying entity information with toggle
 */

import { renderToggleSwitch } from '../controls/toggle-switch.js';

/**
 * Render a generic entity card/item for admin configuration
 * @param {Function} html - lit-html template function
 * @param {Object} options - Entity card options
 * @param {string} options.icon - MDI icon name
 * @param {string} options.name - Entity friendly name
 * @param {string} [options.subtitle] - Subtitle text (shown below entity name, e.g. entity_id)
 * @param {string} options.state - Entity state text
 * @param {boolean} options.isActive - Whether entity is in active state (on, open, etc)
 * @param {boolean} options.enabled - Whether entity is enabled in config
 * @param {Function} options.onToggle - Callback when enable toggle is clicked
 * @param {Function} [options.onClick] - Optional callback when card is clicked
 * @returns {TemplateResult} Entity card HTML
 */
export function renderEntityItem(html, { icon, name, subtitle, state, isActive, enabled, onToggle, onClick }) {
  return html`
    <div class="entity-item" @click=${onClick}>
      <div class="entity-item-info ${isActive ? 'active' : ''}">
        <ha-icon icon="${icon}"></ha-icon>
        <div class="entity-item-text">
          <span class="entity-item-name">${name}</span>
          ${subtitle ? html`<span class="entity-item-subtitle">${subtitle}</span>` : ''}
        </div>
        <span class="entity-item-state ${isActive ? 'active' : ''}">${state}</span>
      </div>
      ${renderToggleSwitch(html, { checked: enabled, onChange: onToggle })}
    </div>
  `;
}

/**
 * Render an entity section (group of entities with header)
 * @param {Function} html - lit-html template function
 * @param {Object} options - Section options
 * @param {string} options.icon - MDI icon for section header
 * @param {string} options.title - Section title
 * @param {number} options.enabledCount - Number of enabled entities
 * @param {number} options.totalCount - Total number of entities
 * @param {string} [options.activeLabel] - Label for active count (e.g., "on", "detecting")
 * @param {number} [options.activeCount] - Number of active entities
 * @param {Array} options.entities - Array of entity objects
 * @param {Function} options.getIcon - Function to get icon for entity (entity) => iconString
 * @param {Function} options.getState - Function to get state text for entity (entity) => stateString
 * @param {Function} options.isActive - Function to check if entity is active (entity) => boolean
 * @param {Function} options.onToggle - Function to toggle entity enabled (entityId) => void
 * @param {boolean} [options.isExpanded] - Whether the section is expanded (default: false)
 * @param {Function} [options.onToggleExpand] - Callback to toggle section expansion
 * @param {string} [options.typeKey] - Entity type key for tracking expansion state
 * @param {Function} [options.onSelectAll] - Optional callback to enable all entities
 * @param {Function} [options.onSelectNone] - Optional callback to disable all entities
 * @returns {TemplateResult} Entity section HTML
 */
export function renderEntitySection(html, {
  icon,
  title,
  enabledCount,
  totalCount,
  activeLabel,
  activeCount,
  entities,
  getIcon,
  getState,
  isActive,
  onToggle,
  isExpanded = false,
  onToggleExpand,
  typeKey,
  onSelectAll,
  onSelectNone
}) {
  if (entities.length === 0) return '';

  const subtitle = activeLabel !== undefined && activeCount !== undefined
    ? `${enabledCount} enabled, ${activeCount} ${activeLabel}`
    : `${enabledCount} enabled`;

  // If collapsible functionality is provided, render with expand/collapse
  const isCollapsible = onToggleExpand && typeKey;

  // Check if bulk actions should be shown
  const showBulkActions = onSelectAll && onSelectNone;

  return html`
    <div class="lights-section">
      <div
        class="lights-title ${isCollapsible ? 'collapsible' : ''}"
        role="${isCollapsible ? 'button' : ''}"
        tabindex="${isCollapsible ? '0' : ''}"
        aria-expanded="${isCollapsible ? isExpanded : ''}"
        style="${showBulkActions ? 'display: flex; justify-content: space-between; align-items: center;' : ''}"
        @click=${isCollapsible ? (e) => { e.stopPropagation(); onToggleExpand(); } : null}
        @keydown=${isCollapsible ? (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand(); } } : null}
      >
        <div style="display: flex; align-items: center; gap: 8px;">
          ${isCollapsible ? html`
            <ha-icon
              class="entity-section-chevron ${isExpanded ? 'expanded' : ''}"
              icon="mdi:chevron-down"
            ></ha-icon>
          ` : ''}
          <ha-icon icon="${icon}"></ha-icon>
          <span>${title} (${subtitle})</span>
        </div>
        ${showBulkActions ? html`
          <div class="bulk-actions" style="display: flex; gap: 6px;">
            <button
              class="bulk-action-btn"
              @click=${(e) => { e.stopPropagation(); onSelectAll(); }}
              title="Select All"
            >All</button>
            <button
              class="bulk-action-btn"
              @click=${(e) => { e.stopPropagation(); onSelectNone(); }}
              title="Select None"
            >None</button>
          </div>
        ` : ''}
      </div>
      <div class="entity-section-entities ${isCollapsible ? (isExpanded ? 'expanded' : 'collapsed') : ''}">
        ${entities.map(entity => renderEntityItem(html, {
          icon: getIcon(entity),
          name: entity.name,
          subtitle: entity.entity_id,
          state: getState(entity),
          isActive: isActive(entity),
          enabled: entity.enabled,
          onToggle: () => onToggle(entity.entity_id)
        }))}
      </div>
    </div>
  `;
}

/**
 * Render a custom entity item with expandable child entities configuration
 * @param {Function} html - lit-html template function
 * @param {Object} options - Custom entity item options
 * @param {Object} options.entity - The parent entity object
 * @param {boolean} options.isExpanded - Whether child config is expanded
 * @param {Array} options.potentialChildren - Array of potential child entities
 * @param {Function} options.onToggle - Toggle entity enabled callback
 * @param {Function} options.onExpandToggle - Toggle expansion callback
 * @param {Function} options.onAddChild - Add child entity callback
 * @param {Function} options.onRemoveChild - Remove child entity callback
 * @param {Object} options.hass - Home Assistant instance for state lookup
 * @returns {TemplateResult} Custom entity item HTML
 */
export function renderCustomEntityItem(html, {
  entity,
  isExpanded,
  potentialChildren,
  onToggle,
  onExpandToggle,
  onAddChild,
  onRemoveChild,
  hass
}) {
  const hasChildren = entity.childEntities && entity.childEntities.length > 0;
  const hasAvailableChildren = potentialChildren && potentialChildren.length > 0;
  const canExpand = hasChildren || hasAvailableChildren;

  // Get child entity states
  const childStates = (entity.childEntities || []).map(childId => {
    const state = hass?.states[childId];
    return {
      entity_id: childId,
      name: state?.attributes?.friendly_name || childId,
      state: state?.state || 'unknown',
      icon: state?.attributes?.icon || 'mdi:help-circle',
      unit: state?.attributes?.unit_of_measurement || '',
    };
  });

  return html`
    <div class="custom-entity-item ${entity.enabled ? 'enabled' : ''}">
      <div class="custom-entity-main" @click=${canExpand ? onExpandToggle : null}>
        <div class="custom-entity-info">
          <ha-icon icon="${entity.icon}"></ha-icon>
          <div class="custom-entity-text">
            <span class="custom-entity-name">${entity.name}</span>
            <span class="custom-entity-state">${entity.state}${entity.unit ? ` ${entity.unit}` : ''}</span>
          </div>
        </div>
        <div class="custom-entity-actions">
          ${canExpand ? html`
            <ha-icon
              class="custom-entity-expand ${isExpanded ? 'expanded' : ''}"
              icon="mdi:chevron-down"
            ></ha-icon>
          ` : ''}
          <div class="toggle-switch ${entity.enabled ? 'on' : ''}"
               @click=${(e) => { e.stopPropagation(); onToggle(); }}></div>
        </div>
      </div>

      ${hasChildren ? html`
        <div class="custom-entity-children">
          ${childStates.map(child => html`
            <div class="custom-entity-child">
              <ha-icon icon="${child.icon}"></ha-icon>
              <span class="child-name">${child.name}</span>
              <span class="child-state">${child.state}${child.unit ? ` ${child.unit}` : ''}</span>
              <ha-icon
                class="child-remove"
                icon="mdi:close"
                @click=${() => onRemoveChild(child.entity_id)}
              ></ha-icon>
            </div>
          `)}
        </div>
      ` : ''}

      ${isExpanded && hasAvailableChildren ? html`
        <div class="custom-entity-child-picker">
          <div class="child-picker-label">Add related entity:</div>
          ${potentialChildren
            .filter(c => !(entity.childEntities || []).includes(c.entity_id))
            .map(child => html`
              <div class="child-picker-option" @click=${() => onAddChild(child.entity_id)}>
                <ha-icon icon="${child.icon}"></ha-icon>
                <span class="child-picker-name">${child.name}</span>
                <span class="child-picker-state">${child.state}${child.unit ? ` ${child.unit}` : ''}</span>
                <ha-icon icon="mdi:plus" class="child-picker-add"></ha-icon>
              </div>
            `)}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render a custom label section with entities and child entity support
 * @param {Function} html - lit-html template function
 * @param {Object} options - Section options
 * @param {Object} options.label - The label object
 * @param {Array} options.entities - Array of entity objects for this label
 * @param {Object} options.panel - The panel instance
 * @param {Object} options.expandedEntities - Map of expanded entity IDs
 * @param {Function} options.onToggleEntityExpanded - Toggle entity expansion callback
 * @returns {TemplateResult} Custom label section HTML
 */
export function renderCustomLabelSection(html, {
  label,
  entities,
  panel,
  expandedEntities,
  onToggleEntityExpanded
}) {
  if (entities.length === 0) return '';

  const enabledCount = entities.filter(e => e.enabled).length;

  return html`
    <div class="lights-section custom-label-section">
      <div class="lights-title">
        <ha-icon icon="${label.icon}"></ha-icon>
        ${label.name} (${enabledCount} enabled)
      </div>
      ${entities.map(entity => {
        const isExpanded = expandedEntities?.[entity.entity_id] || false;
        const potentialChildren = panel._getPotentialChildEntities(entity.entity_id);

        return renderCustomEntityItem(html, {
          entity,
          isExpanded,
          potentialChildren,
          onToggle: () => panel._toggleCustomEntityEnabled(entity.entity_id),
          onExpandToggle: () => onToggleEntityExpanded(entity.entity_id),
          onAddChild: (childId) => panel._addChildEntity(entity.entity_id, childId),
          onRemoveChild: (childId) => panel._removeChildEntity(entity.entity_id, childId),
          hass: panel.hass
        });
      })}
    </div>
  `;
}
