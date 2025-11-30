/**
 * Entity Card Component
 * Renders entity cards for the floor card grid
 *
 * This component handles:
 * - Small and big card layouts
 * - Entity state display
 * - Click actions (toggle, more-info)
 */

import { getEntityDisplayService } from '../../services/entity-display-service.js';
import { toggleLight, openMoreInfo } from '../../utils/index.js';

/**
 * Handle entity card click
 * @param {Object} hass - Home Assistant instance
 * @param {string} entityId - Entity ID
 * @param {HTMLElement} element - Element to dispatch event from
 */
function handleCardClick(hass, entityId, element) {
  const entityType = entityId.split('.')[0];

  if (entityType === 'light') {
    // Toggle lights directly using helper
    toggleLight(hass, entityId);
  } else if (entityType === 'cover') {
    // Toggle covers
    const state = hass.states[entityId];
    if (state?.state === 'open') {
      hass.callService('cover', 'close_cover', { entity_id: entityId });
    } else {
      hass.callService('cover', 'open_cover', { entity_id: entityId });
    }
  } else {
    // Open more-info dialog for other entities
    openMoreInfo(element, entityId);
  }
}

/**
 * Render an empty/hidden card slot
 * @param {Function} html - lit-html template function
 * @param {boolean} isBig - Whether this is a big card slot
 * @param {string} gridArea - CSS grid area name
 * @returns {TemplateResult} Empty card HTML
 */
export function renderEmptyCard(html, isBig, gridArea) {
  return html`
    <div
      class="room-card ${isBig ? 'big' : 'small'} inactive"
      style="grid-area: ${gridArea}; visibility: hidden;"
    ></div>
  `;
}

/**
 * Render the card content (icon + text)
 * @param {Function} html - lit-html template function
 * @param {Object} displayInfo - Display info from EntityDisplayService
 * @param {boolean} isBig - Whether this is a big card
 * @returns {TemplateResult} Card content HTML
 */
function renderCardContent(html, displayInfo, isBig) {
  const { icon, labelText, friendlyName } = displayInfo;

  // Both big and small cards have the same structure now
  return html`
    <div class="room-card-icon">
      <ha-icon icon="${icon}"></ha-icon>
    </div>
    <div class="room-card-content">
      <div class="room-card-label">${labelText}</div>
      <div class="room-card-name">${friendlyName}</div>
    </div>
  `;
}

/**
 * Render an entity card
 * @param {Function} html - lit-html template function
 * @param {Object} options - Card options
 * @param {Object} options.hass - Home Assistant instance
 * @param {string} options.entityId - Entity ID to display
 * @param {boolean} options.isBig - Whether this is a big card
 * @param {string} options.gridArea - CSS grid area name
 * @param {Object} options.entityRegistry - Entity registry for label lookups
 * @param {Object} options.labelIds - Label ID mappings
 * @param {HTMLElement} options.element - Element for event dispatching
 * @returns {TemplateResult} Entity card HTML
 */
export function renderEntityCard(html, {
  hass,
  entityId,
  isBig,
  gridArea,
  entityRegistry,
  labelIds,
  element,
}) {
  // Return empty card if no entity configured
  if (!entityId || !hass?.states[entityId]) {
    return renderEmptyCard(html, isBig, gridArea);
  }

  // Get display info from service
  const displayService = getEntityDisplayService();
  displayService.setEntityRegistry(entityRegistry);
  displayService.setLabelIds(labelIds);

  const state = hass.states[entityId];
  const displayInfo = displayService.getDisplayInfo(entityId, state);

  if (!displayInfo) {
    return renderEmptyCard(html, isBig, gridArea);
  }

  const { cardClass } = displayInfo;

  return html`
    <div
      class="room-card ${isBig ? 'big' : 'small'} ${cardClass}"
      style="grid-area: ${gridArea};"
      @click=${() => handleCardClick(hass, entityId, element)}
    >
      ${renderCardContent(html, displayInfo, isBig)}
    </div>
  `;
}

/**
 * Entity Card Factory
 * Creates a render function for entity cards with pre-bound context
 */
export class EntityCardFactory {
  constructor(hass, entityRegistry, labelIds, element) {
    this.hass = hass;
    this.entityRegistry = entityRegistry;
    this.labelIds = labelIds;
    this.element = element;

    // Initialize display service
    this.displayService = getEntityDisplayService();
    this.displayService.setEntityRegistry(entityRegistry);
    this.displayService.setLabelIds(labelIds);
  }

  /**
   * Update the factory context
   * @param {Object} updates - Properties to update
   */
  update({ hass, entityRegistry, labelIds }) {
    if (hass) this.hass = hass;
    if (entityRegistry) {
      this.entityRegistry = entityRegistry;
      this.displayService.setEntityRegistry(entityRegistry);
    }
    if (labelIds) {
      this.labelIds = labelIds;
      this.displayService.setLabelIds(labelIds);
    }
  }

  /**
   * Get display info for an entity
   * @param {string} entityId - Entity ID
   * @returns {Object|null} Display info
   */
  getDisplayInfo(entityId) {
    if (!entityId || !this.hass?.states[entityId]) return null;
    return this.displayService.getDisplayInfo(entityId, this.hass.states[entityId]);
  }

  /**
   * Render a card
   * @param {Function} html - lit-html template function
   * @param {string} entityId - Entity ID
   * @param {boolean} isBig - Whether this is a big card
   * @param {string} gridArea - CSS grid area name
   * @returns {TemplateResult} Card HTML
   */
  renderCard(html, entityId, isBig, gridArea) {
    return renderEntityCard(html, {
      hass: this.hass,
      entityId,
      isBig,
      gridArea,
      entityRegistry: this.entityRegistry,
      labelIds: this.labelIds,
      element: this.element,
    });
  }

  /**
   * Render an empty card
   * @param {Function} html - lit-html template function
   * @param {boolean} isBig - Whether this is a big card
   * @param {string} gridArea - CSS grid area name
   * @returns {TemplateResult} Empty card HTML
   */
  renderEmpty(html, isBig, gridArea) {
    return renderEmptyCard(html, isBig, gridArea);
  }
}

/**
 * Create an entity card factory
 * @param {Object} hass - Home Assistant instance
 * @param {Array} entityRegistry - Entity registry
 * @param {Object} labelIds - Label ID mappings
 * @param {HTMLElement} element - Element for event dispatching
 * @returns {EntityCardFactory}
 */
export function createEntityCardFactory(hass, entityRegistry, labelIds, element) {
  return new EntityCardFactory(hass, entityRegistry, labelIds, element);
}

export default EntityCardFactory;
