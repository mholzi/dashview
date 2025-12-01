/**
 * Room Cards Grid Component
 * Renders the grid of entity cards on the home tab
 *
 * This module breaks down the large renderRoomCardsGrid function
 * into smaller, focused components.
 */

import { renderEntityCard, renderEmptyCard } from '../../components/cards/entity-card.js';
import { t } from '../../utils/i18n.js';

/**
 * Grid layout configuration
 */
const GRID_LAYOUT = {
  style: `
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 76px 76px 76px 76px;
    grid-template-areas:
      "small1 big1"
      "big2 big1"
      "big2 small2"
      "small3 small4";
    gap: 0;
    margin-top: 12px;
  `,
  slots: [
    { index: 0, isBig: false, gridArea: 'small1' },
    { index: 1, isBig: true, gridArea: 'big1' },
    { index: 2, isBig: true, gridArea: 'big2' },
    { index: 3, isBig: false, gridArea: 'small2' },
    { index: 4, isBig: false, gridArea: 'small3' },
    { index: 5, isBig: false, gridArea: 'small4' },
  ],
};

/**
 * Render the "no cards configured" message
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult}
 */
export function renderNoCardsMessage(html) {
  return html`
    <div style="text-align: center; padding: 24px; color: var(--secondary-text-color);">
      ${t('ui.errors.no_cards_configured')}
    </div>
  `;
}

/**
 * Get context for rendering cards
 * @param {Object} component - DashviewPanel instance
 * @returns {Object} Render context
 */
function getRenderContext(component) {
  return {
    hass: component.hass,
    entityRegistry: component._entityRegistry,
    labelIds: {
      motion: component._motionLabelId,
      window: component._windowLabelId,
      garage: component._garageLabelId,
      vibration: component._vibrationLabelId,
      smoke: component._smokeLabelId,
      temperature: component._temperatureLabelId,
      humidity: component._humidityLabelId,
      light: component._lightLabelId,
      cover: component._coverLabelId,
      climate: component._climateLabelId,
    },
    element: component,
  };
}

/**
 * Render a single card slot
 * @param {Function} html - lit-html template function
 * @param {Object} options - Render options
 * @param {Object} options.floorConfig - Floor card configuration
 * @param {number} options.slotIndex - Slot index
 * @param {boolean} options.isBig - Whether this is a big card
 * @param {string} options.gridArea - CSS grid area name
 * @param {Object} options.context - Render context
 * @returns {TemplateResult}
 */
function renderCardSlot(html, { floorConfig, slotIndex, isBig, gridArea, context }) {
  const slotConfig = floorConfig[slotIndex];

  if (!slotConfig || !slotConfig.entity_id) {
    return renderEmptyCard(html, isBig, gridArea);
  }

  return renderEntityCard(html, {
    ...context,
    entityId: slotConfig.entity_id,
    isBig,
    gridArea,
  });
}

/**
 * Render the floor overview card in the big1 slot
 * @param {Function} html - lit-html template function
 * @param {Object} component - DashviewPanel instance
 * @param {Function} renderFloorOverviewCard - Floor overview render function
 * @returns {TemplateResult}
 */
function renderBig1Slot(html, component, renderFloorOverviewCard) {
  return html`
    <div style="grid-area: big1; margin: 4px;">
      ${renderFloorOverviewCard(component, html, component._activeFloorTab)}
    </div>
  `;
}

/**
 * Render the garbage card in the big2 slot
 * @param {Function} html - lit-html template function
 * @param {Object} component - DashviewPanel instance
 * @param {Function} renderGarbageCard - Garbage card render function
 * @returns {TemplateResult}
 */
function renderBig2Slot(html, component, renderGarbageCard) {
  return html`
    <div style="grid-area: big2; margin: 4px;">
      ${renderGarbageCard(component, html)}
    </div>
  `;
}

/**
 * Render the room cards grid
 * @param {Object} component - DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Object} options - Additional render functions
 * @param {Function} options.renderFloorOverviewCard - Floor overview render function
 * @param {Function} options.renderGarbageCard - Garbage card render function
 * @returns {TemplateResult}
 */
export function renderRoomCardsGrid(component, html, { renderFloorOverviewCard, renderGarbageCard }) {
  // Get floor configuration
  const floorConfig = component._floorCardConfig[component._activeFloorTab] || {};
  const hasConfig = Object.keys(floorConfig).length > 0;
  const floorOverviewEnabled = component._floorOverviewEnabled[component._activeFloorTab];
  const garbageEnabled = component._garbageDisplayFloor === component._activeFloorTab &&
    component._garbageSensors.length > 0;

  // Show message if nothing is configured
  if (!hasConfig && !floorOverviewEnabled && !garbageEnabled) {
    return renderNoCardsMessage(html);
  }

  // Get render context
  const context = getRenderContext(component);

  return html`
    <div style="${GRID_LAYOUT.style}">
      <!-- Slot 0: small1 -->
      ${renderCardSlot(html, {
        floorConfig,
        slotIndex: 0,
        isBig: false,
        gridArea: 'small1',
        context,
      })}

      <!-- Slot 1: big1 - Floor Overview or Entity Card -->
      ${floorOverviewEnabled
        ? renderBig1Slot(html, component, renderFloorOverviewCard)
        : renderCardSlot(html, {
            floorConfig,
            slotIndex: 1,
            isBig: true,
            gridArea: 'big1',
            context,
          })
      }

      <!-- Slot 2: big2 - Garbage Card or Entity Card -->
      ${garbageEnabled
        ? renderBig2Slot(html, component, renderGarbageCard)
        : renderCardSlot(html, {
            floorConfig,
            slotIndex: 2,
            isBig: true,
            gridArea: 'big2',
            context,
          })
      }

      <!-- Slot 3: small2 -->
      ${renderCardSlot(html, {
        floorConfig,
        slotIndex: 3,
        isBig: false,
        gridArea: 'small2',
        context,
      })}

      <!-- Slot 4: small3 -->
      ${renderCardSlot(html, {
        floorConfig,
        slotIndex: 4,
        isBig: false,
        gridArea: 'small3',
        context,
      })}

      <!-- Slot 5: small4 -->
      ${renderCardSlot(html, {
        floorConfig,
        slotIndex: 5,
        isBig: false,
        gridArea: 'small4',
        context,
      })}
    </div>
  `;
}

export default renderRoomCardsGrid;
