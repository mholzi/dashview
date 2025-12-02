/**
 * Sortable List Component
 *
 * A reusable sortable list wrapper using SortableJS for drag-and-drop reordering.
 * Implemented as vanilla Web Component (HTMLElement) for lightweight, framework-agnostic usage.
 *
 * @element sortable-list
 * @fires reorder - Dispatched when list order changes
 *
 * @attr {string} item-key - Property name to use as item identifier (default: 'id')
 * @attr {string} handle-selector - CSS selector for drag handle (default: '.sortable-handle')
 * @attr {boolean} disabled - Disable drag-and-drop (default: false)
 *
 * @example
 * html`
 *   <sortable-list
 *     item-key="floor_id"
 *     handle-selector=".sortable-handle"
 *     @reorder=${(e) => this._handleReorder(e.detail)}
 *   >
 *     ${floors.map(floor => html`
 *       <div data-id="${floor.floor_id}" class="sortable-item">
 *         <div class="sortable-handle">
 *           <ha-icon icon="mdi:drag-horizontal"></ha-icon>
 *         </div>
 *         ${floor.name}
 *       </div>
 *     `)}
 *   </sortable-list>
 * `
 *
 * @description
 * ReorderEvent detail structure:
 * {
 *   order: string[];      // New order of item IDs (from data-id attributes)
 *   oldIndex: number;     // Original position (0-based)
 *   newIndex: number;     // New position (0-based)
 *   itemId: string;       // Moved item's data-id
 * }
 */

// Use CDN for browser ES module compatibility (Home Assistant doesn't use a bundler)
import Sortable from 'https://esm.sh/sortablejs@1.15.6/modular/sortable.core.esm.js';

export class SortableList extends HTMLElement {
  static get observedAttributes() {
    return ['item-key', 'handle-selector', 'disabled'];
  }

  constructor() {
    super();
    this._sortable = null;
    this._itemKey = 'id';
    this._handleSelector = '.sortable-handle';
    this._disabled = false;
    this._initialized = false;
  }

  connectedCallback() {
    // Wait for children to render before initializing
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      this._initSortable();
      this._initialized = true;
    });
  }

  disconnectedCallback() {
    this._destroySortable();
    this._initialized = false;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue === newValue) return;

    switch (name) {
      case 'item-key':
        this._itemKey = newValue || 'id';
        break;
      case 'handle-selector':
        this._handleSelector = newValue || '.sortable-handle';
        // Reinitialize if already initialized to apply new handle
        if (this._initialized) {
          this._reinitialize();
        }
        break;
      case 'disabled':
        this._disabled = newValue !== null;
        if (this._sortable) {
          this._sortable.option('disabled', this._disabled);
        }
        break;
    }
  }

  /**
   * Initialize SortableJS instance
   * @private
   */
  _initSortable() {
    if (this._sortable) {
      this._destroySortable();
    }

    this._sortable = Sortable.create(this, {
      animation: 150,
      handle: this._handleSelector,
      disabled: this._disabled,
      ghostClass: 'sortable-ghost',
      chosenClass: 'sortable-chosen',
      dragClass: 'sortable-drag',
      // Fallback for browsers without native drag support
      forceFallback: false,
      // Enable touch support
      touchStartThreshold: 3,
      onEnd: (evt) => {
        this._handleSortEnd(evt);
      }
    });
  }

  /**
   * Destroy SortableJS instance to prevent memory leaks
   * @private
   */
  _destroySortable() {
    if (this._sortable) {
      this._sortable.destroy();
      this._sortable = null;
    }
  }

  /**
   * Reinitialize SortableJS (e.g., after attribute change)
   * @private
   */
  _reinitialize() {
    if (this.isConnected) {
      this._initSortable();
    }
  }

  /**
   * Handle sort end event from SortableJS
   * @param {Object} evt - SortableJS event object
   * @private
   */
  _handleSortEnd(evt) {
    const { oldIndex, newIndex, item } = evt;

    // Don't emit event if position didn't change
    if (oldIndex === newIndex) return;

    // Collect new order from DOM based on data-id attributes
    const items = Array.from(this.querySelectorAll('[data-id]'));
    const order = items.map(el => el.dataset.id);
    const itemId = item.dataset.id;

    // Dispatch custom reorder event
    this.dispatchEvent(new CustomEvent('reorder', {
      bubbles: true,
      composed: true,
      detail: {
        order,
        oldIndex,
        newIndex,
        itemId
      }
    }));
  }

  /**
   * Public API: Refresh SortableJS after external DOM changes
   * Call this method if items are added/removed programmatically
   */
  refresh() {
    this._reinitialize();
  }

  /**
   * Public API: Get current SortableJS instance (for advanced usage)
   * @returns {Sortable|null}
   */
  getSortable() {
    return this._sortable;
  }
}

// Register custom element
customElements.define('sortable-list', SortableList);
