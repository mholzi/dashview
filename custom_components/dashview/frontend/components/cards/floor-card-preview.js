/**
 * Floor Card Preview Component
 * Renders a scaled-down preview of the floor card with current slot assignments
 *
 * @element floor-card-preview
 *
 * @property {Object} hass - Home Assistant object for entity states
 * @property {string} floorId - Floor ID to preview
 * @property {Object} slotConfig - Slot configuration object { 0: {...}, 1: {...}, ... }
 * @property {number} scale - Scale factor (default: 0.5 = 50%)
 * @property {Object} entityDisplayService - Service for entity display info
 * @property {Object} floor - Floor object with name and icon
 *
 * @example
 * html`
 *   <floor-card-preview
 *     .hass=${this.hass}
 *     .floorId=${floorId}
 *     .slotConfig=${this._floorCardConfig[floorId]}
 *     .entityDisplayService=${this._entityDisplayService}
 *     .floor=${floor}
 *     scale="0.5"
 *   ></floor-card-preview>
 * `
 */

import { t } from '../../utils/i18n.js';

export class FloorCardPreview extends HTMLElement {
  static get observedAttributes() {
    return ['floor-id', 'scale'];
  }

  constructor() {
    super();
    this._hass = null;
    this._floorId = '';
    this._slotConfig = {};
    this._scale = 0.5;
    this._entityDisplayService = null;
    this._floor = null;
    this.attachShadow({ mode: 'open' });
  }

  // Property setters for reactive updates
  set hass(value) {
    this._hass = value;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  set floorId(value) {
    this._floorId = value;
    this._render();
  }

  get floorId() {
    return this._floorId;
  }

  set slotConfig(value) {
    this._slotConfig = value || {};
    this._render();
  }

  get slotConfig() {
    return this._slotConfig;
  }

  set scale(value) {
    this._scale = parseFloat(value) || 0.5;
    this._render();
  }

  get scale() {
    return this._scale;
  }

  set entityDisplayService(value) {
    this._entityDisplayService = value;
    this._render();
  }

  get entityDisplayService() {
    return this._entityDisplayService;
  }

  set floor(value) {
    this._floor = value;
    this._render();
  }

  get floor() {
    return this._floor;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;
    if (name === 'floor-id') {
      this._floorId = newValue;
    } else if (name === 'scale') {
      this._scale = parseFloat(newValue) || 0.5;
    }
    this._render();
  }

  connectedCallback() {
    this._render();
  }

  _render() {
    if (!this.shadowRoot) return;

    const scale = this._scale;
    const floor = this._floor;
    const slots = this._getSlots();

    this.shadowRoot.innerHTML = `
      <style>${this._getStyles()}</style>
      <div class="preview-label">
        <ha-icon icon="mdi:eye"></ha-icon>
        <span>${t('admin.layout.floorCardPreview')}</span>
      </div>
      <div class="preview-container" style="--scale: ${scale}">
        <div class="preview-header">
          <ha-icon icon="${floor?.icon || 'mdi:home-floor-1'}"></ha-icon>
          <span>${floor?.name || t('admin.layout.floor')}</span>
        </div>
        <div class="floor-card-grid">
          ${this._renderSlot(slots[0], 0)}
          ${this._renderSlot(slots[1], 1)}
          ${this._renderSlot(slots[3], 3)}
          ${this._renderSlot(slots[2], 2)}
          <div class="lower-row">
            ${this._renderSlot(slots[4], 4)}
            ${this._renderSlot(slots[5], 5)}
          </div>
        </div>
      </div>
    `;
  }

  _getSlots() {
    const config = this._slotConfig || {};
    return [0, 1, 2, 3, 4, 5].map(i => config[i] || null);
  }

  _renderSlot(slotConfig, slotIndex) {
    if (!slotConfig?.entity_id) {
      return `<div class="slot slot-${slotIndex} empty"></div>`;
    }

    const entity = this._hass?.states?.[slotConfig.entity_id];
    const displayInfo = this._getDisplayInfo(entity, slotConfig);
    const stateClass = this._getStateClass(entity);

    return `
      <div class="slot slot-${slotIndex} ${stateClass}">
        <ha-icon icon="${displayInfo.icon}"></ha-icon>
        <span class="slot-name">${displayInfo.name}</span>
        <span class="slot-state">${displayInfo.state}</span>
      </div>
    `;
  }

  _getDisplayInfo(entity, slotConfig) {
    if (this._entityDisplayService && entity) {
      try {
        return this._entityDisplayService.getDisplayInfo(entity);
      } catch {
        // Fall through to fallback
      }
    }

    // Fallback display info
    if (!entity) {
      return {
        name: slotConfig?.entity_id?.split('.').pop() || 'Unknown',
        icon: slotConfig?.icon || 'mdi:help-circle',
        state: t('common.status.unavailable')
      };
    }

    return {
      name: entity.attributes?.friendly_name || entity.entity_id.split('.').pop(),
      icon: entity.attributes?.icon || this._getDefaultIcon(entity.entity_id),
      state: entity.state
    };
  }

  _getDefaultIcon(entityId) {
    const domain = entityId?.split('.')[0];
    const iconMap = {
      light: 'mdi:lightbulb',
      switch: 'mdi:toggle-switch',
      sensor: 'mdi:eye',
      binary_sensor: 'mdi:checkbox-blank-circle',
      climate: 'mdi:thermostat',
      cover: 'mdi:window-shutter',
      media_player: 'mdi:speaker',
      camera: 'mdi:video',
      lock: 'mdi:lock',
      vacuum: 'mdi:robot-vacuum'
    };
    return iconMap[domain] || 'mdi:help-circle';
  }

  _getStateClass(entity) {
    if (!entity) return 'state-unavailable';
    const state = entity.state?.toLowerCase();
    if (state === 'on' || state === 'playing' || state === 'open') {
      return 'state-on';
    }
    if (state === 'off' || state === 'idle' || state === 'closed') {
      return 'state-off';
    }
    return '';
  }

  _getStyles() {
    return `
      :host {
        display: block;
        --preview-width: 280px;
        --preview-height: 320px;
      }

      .preview-container {
        position: relative;
        width: calc(var(--preview-width) * var(--scale, 0.5));
        height: calc(var(--preview-height) * var(--scale, 0.5));
        background: var(--card-background-color, #fff);
        border-radius: calc(12px * var(--scale, 0.5));
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        transform-origin: top left;
      }

      .preview-header {
        padding: calc(8px * var(--scale, 0.5)) calc(12px * var(--scale, 0.5));
        background: var(--primary-color, #03a9f4);
        color: var(--text-primary-color, #fff);
        font-size: calc(14px * var(--scale, 0.5));
        font-weight: 500;
        display: flex;
        align-items: center;
        gap: calc(6px * var(--scale, 0.5));
      }

      .preview-header ha-icon {
        --mdc-icon-size: calc(18px * var(--scale, 0.5));
      }

      .floor-card-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-template-rows: 1fr 1fr 0.6fr;
        gap: calc(4px * var(--scale, 0.5));
        padding: calc(8px * var(--scale, 0.5));
        height: calc(var(--preview-height) * var(--scale, 0.5) - 40px * var(--scale, 0.5));
      }

      .slot {
        background: var(--secondary-background-color, #f5f5f5);
        border-radius: calc(8px * var(--scale, 0.5));
        padding: calc(6px * var(--scale, 0.5));
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: calc(2px * var(--scale, 0.5));
        min-height: 0;
        overflow: hidden;
      }

      .slot.empty {
        border: calc(1px * var(--scale, 0.5)) dashed var(--divider-color, #ccc);
        background: transparent;
      }

      .slot.empty::after {
        content: '—';
        color: var(--disabled-text-color, #999);
        font-size: calc(12px * var(--scale, 0.5));
      }

      /* Slot positions */
      .slot-0 { grid-area: 1 / 1 / 2 / 2; } /* top-left */
      .slot-1 { grid-area: 1 / 2 / 2 / 3; } /* top-right */
      .slot-2 { grid-area: 2 / 2 / 4 / 3; } /* bottom-right (spans 2 rows) */
      .slot-3 { grid-area: 2 / 1 / 3 / 2; } /* middle-left */

      /* Lower row sub-grid */
      .lower-row {
        grid-area: 3 / 1 / 4 / 2;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: calc(4px * var(--scale, 0.5));
      }

      .slot ha-icon {
        --mdc-icon-size: calc(24px * var(--scale, 0.5));
        color: var(--primary-color, #03a9f4);
      }

      .slot.state-on ha-icon {
        color: var(--state-light-active-color, var(--amber-color, #ffc107));
      }

      .slot.state-off ha-icon {
        color: var(--secondary-text-color, #888);
      }

      .slot.state-unavailable ha-icon {
        color: var(--disabled-text-color, #999);
        opacity: 0.5;
      }

      .slot-name {
        font-size: calc(10px * var(--scale, 0.5));
        font-weight: 500;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        max-width: 100%;
        color: var(--primary-text-color, #333);
      }

      .slot-state {
        font-size: calc(9px * var(--scale, 0.5));
        color: var(--secondary-text-color, #888);
        text-align: center;
      }

      .preview-label {
        font-size: 12px;
        color: var(--secondary-text-color, #888);
        margin-bottom: 8px;
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .preview-label ha-icon {
        --mdc-icon-size: 16px;
      }
    `;
  }
}

customElements.define('floor-card-preview', FloorCardPreview);
