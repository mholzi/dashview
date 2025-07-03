// custom_components/dashview/www/lib/utils/ContextMenuManager.js

/**
 * ContextMenuManager - Long-press context menu system for quick actions
 * 
 * Provides context menus for edit, favorite, hide, and other quick actions
 * as outlined in Enhancement #3.
 */
export class ContextMenuManager {
  constructor(panel, config = {}) {
    this._panel = panel;
    this._hass = panel._hass;
    this._shadowRoot = panel.shadowRoot;
    
    // Configuration options
    this.menuTimeout = config.menuTimeout || 5000; // auto-hide after 5s
    this.enableHapticFeedback = config.enableHapticFeedback !== false;
    
    // Menu state
    this._activeMenu = null;
    this._menuTargetElement = null;
    this._hideTimer = null;
    
    // Create menu container
    this._createMenuContainer();
    
    console.log('[ContextMenuManager] Initialized');
  }

  /**
   * Create the menu container element
   */
  _createMenuContainer() {
    const existing = this._shadowRoot.getElementById('context-menu-container');
    if (existing) {
      existing.remove();
    }

    const container = document.createElement('div');
    container.id = 'context-menu-container';
    container.className = 'context-menu-container';
    container.style.display = 'none';
    
    // Add click outside handler to close menu
    container.addEventListener('click', (event) => {
      if (event.target === container) {
        this.hideMenu();
      }
    });
    
    this._shadowRoot.appendChild(container);
  }

  /**
   * Show context menu for an entity or room
   * @param {HTMLElement} targetElement - Element that triggered the menu
   * @param {Object} options - Menu configuration
   * @param {string} options.entityId - Entity ID if applicable
   * @param {string} options.type - Type of menu (entity, room, etc.)
   * @param {Array} options.customActions - Custom menu actions
   */
  showMenu(targetElement, options = {}) {
    if (!targetElement) {
      console.warn('[ContextMenuManager] No target element provided');
      return;
    }

    // Hide any existing menu
    this.hideMenu();

    // Get menu container
    const container = this._shadowRoot.getElementById('context-menu-container');
    if (!container) {
      console.error('[ContextMenuManager] Menu container not found');
      return;
    }

    // Store references
    this._menuTargetElement = targetElement;
    
    // Create menu content based on type
    const menuContent = this._createMenuContent(options);
    container.innerHTML = menuContent;
    
    // Position and show menu
    this._positionMenu(container, targetElement);
    container.style.display = 'block';
    this._activeMenu = container;
    
    // Add event listeners to menu items
    this._addMenuEventListeners(container, options);
    
    // Haptic feedback
    this._triggerHapticFeedback('medium');
    
    // Auto-hide timer
    this._startHideTimer();
    
    console.log('[ContextMenuManager] Menu shown for:', options);
  }

  /**
   * Hide the active context menu
   */
  hideMenu() {
    if (this._activeMenu) {
      this._activeMenu.style.display = 'none';
      this._activeMenu.innerHTML = '';
      this._activeMenu = null;
    }
    
    this._menuTargetElement = null;
    this._clearHideTimer();
  }

  /**
   * Create menu content based on options
   */
  _createMenuContent(options) {
    const { entityId, type = 'entity', customActions = [] } = options;
    
    let actions = [];
    
    // Default actions based on type
    switch (type) {
      case 'entity':
        actions = this._getEntityActions(entityId, options);
        break;
      case 'room':
        actions = this._getRoomActions(options);
        break;
      case 'scene':
        actions = this._getSceneActions(options);
        break;
      default:
        actions = this._getDefaultActions(options);
    }
    
    // Add custom actions
    actions = [...actions, ...customActions];
    
    // Create menu HTML
    const menuItems = actions.map(action => `
      <div class="context-menu-item" data-action="${action.id}" ${action.disabled ? 'data-disabled="true"' : ''}>
        <i class="mdi ${action.icon}"></i>
        <span class="context-menu-label">${action.label}</span>
        ${action.shortcut ? `<span class="context-menu-shortcut">${action.shortcut}</span>` : ''}
      </div>
    `).join('');
    
    return `
      <div class="context-menu">
        <div class="context-menu-header">
          <span class="context-menu-title">${this._getMenuTitle(options)}</span>
          <button class="context-menu-close" data-action="close">
            <i class="mdi mdi-close"></i>
          </button>
        </div>
        <div class="context-menu-items">
          ${menuItems}
        </div>
      </div>
    `;
  }

  /**
   * Get actions for entity context menu
   */
  _getEntityActions(entityId, options) {
    const entity = this._hass?.states?.[entityId];
    if (!entity) return [];
    
    const actions = [
      {
        id: 'hide',
        label: 'Hide from Dashboard',
        icon: 'mdi-eye-off-outline'
      },
      {
        id: 'details',
        label: 'Show Details',
        icon: 'mdi-information-outline'
      },
      {
        id: 'room-allocation',
        label: 'Room Allocation',
        icon: 'mdi-home-edit-outline'
      }
    ];
    
    // Add toggle option if entity supports it
    const domain = entityId.split('.')[0];
    const toggleableDomains = ['light', 'switch', 'fan', 'cover', 'lock', 'media_player', 'climate'];
    if (toggleableDomains.includes(domain)) {
      actions.push({
        id: 'toggle',
        label: 'Toggle',
        icon: 'mdi-toggle-switch'
      });
    }
    
    return actions;
  }

  /**
   * Get actions for room context menu
   */
  _getRoomActions(options) {
    return [
      {
        id: 'edit-room',
        label: 'Edit Room',
        icon: 'mdi-home-edit'
      },
      {
        id: 'room-settings',
        label: 'Room Settings',
        icon: 'mdi-cog'
      },
      {
        id: 'add-entity',
        label: 'Add Entity',
        icon: 'mdi-plus'
      },
      {
        id: 'create-scene',
        label: 'Create Scene',
        icon: 'mdi-palette'
      },
      {
        id: 'separator',
        type: 'separator'
      },
      {
        id: 'room-overview',
        label: 'Room Overview',
        icon: 'mdi-view-dashboard'
      }
    ];
  }

  /**
   * Get actions for scene context menu
   */
  _getSceneActions(options) {
    return [
      {
        id: 'activate',
        label: 'Activate Scene',
        icon: 'mdi-play'
      },
      {
        id: 'edit-scene',
        label: 'Edit Scene',
        icon: 'mdi-pencil'
      },
      {
        id: 'duplicate',
        label: 'Duplicate Scene',
        icon: 'mdi-content-copy'
      },
      {
        id: 'favorite',
        label: 'Add to Favorites',
        icon: 'mdi-star-outline'
      },
      {
        id: 'separator',
        type: 'separator'
      },
      {
        id: 'delete',
        label: 'Delete Scene',
        icon: 'mdi-delete-outline'
      }
    ];
  }

  /**
   * Get default actions
   */
  _getDefaultActions(options) {
    return [
      {
        id: 'edit',
        label: 'Edit',
        icon: 'mdi-pencil'
      },
      {
        id: 'favorite',
        label: 'Add to Favorites',
        icon: 'mdi-star-outline'
      },
      {
        id: 'hide',
        label: 'Hide',
        icon: 'mdi-eye-off-outline'
      }
    ];
  }

  /**
   * Get menu title based on options
   */
  _getMenuTitle(options) {
    const { entityId, type, customTitle } = options;
    
    if (customTitle) return customTitle;
    
    if (entityId) {
      const entity = this._hass?.states?.[entityId];
      return entity?.attributes?.friendly_name || entityId;
    }
    
    switch (type) {
      case 'room': return 'Room Actions';
      case 'scene': return 'Scene Actions';
      default: return 'Quick Actions';
    }
  }

  /**
   * Position menu relative to target element
   */
  _positionMenu(container, targetElement) {
    const menu = container.querySelector('.context-menu');
    if (!menu) return;

    const targetRect = targetElement.getBoundingClientRect();
    const containerRect = this._shadowRoot.host.getBoundingClientRect();
    
    // Calculate position relative to shadow root
    const x = targetRect.left - containerRect.left + targetRect.width / 2;
    const y = targetRect.top - containerRect.top + targetRect.height;
    
    // Position menu
    menu.style.position = 'absolute';
    menu.style.left = `${x}px`;
    menu.style.top = `${y}px`;
    menu.style.transform = 'translateX(-50%)';
    
    // Adjust if menu would go off-screen
    const menuRect = menu.getBoundingClientRect();
    const hostRect = this._shadowRoot.host.getBoundingClientRect();
    
    if (menuRect.right > hostRect.right) {
      menu.style.left = `${hostRect.right - containerRect.left - menuRect.width - 10}px`;
      menu.style.transform = 'none';
    }
    
    if (menuRect.left < hostRect.left) {
      menu.style.left = `${10}px`;
      menu.style.transform = 'none';
    }
    
    if (menuRect.bottom > hostRect.bottom) {
      menu.style.top = `${targetRect.top - containerRect.top - menuRect.height - 10}px`;
    }
  }

  /**
   * Add event listeners to menu items
   */
  _addMenuEventListeners(container, options) {
    const menuItems = container.querySelectorAll('.context-menu-item, .context-menu-close');
    
    menuItems.forEach(item => {
      item.addEventListener('click', (event) => {
        event.stopPropagation();
        
        const action = item.dataset.action;
        const disabled = item.dataset.disabled === 'true';
        
        if (disabled) return;
        
        if (action === 'close') {
          this.hideMenu();
          return;
        }
        
        // Handle action
        this._handleMenuAction(action, options);
        
        // Hide menu after action
        this.hideMenu();
      });
    });
  }

  /**
   * Handle menu action
   */
  _handleMenuAction(action, options) {
    const { entityId, type } = options;
    
    console.log(`[ContextMenuManager] Handling action: ${action}`, options);
    
    switch (action) {
      case 'hide':
        this._hideFromDashboard(entityId, options);
        break;
        
      case 'details':
        this._showEntityDetails(entityId);
        break;
        
      case 'room-allocation':
        this._openRoomAllocation(entityId);
        break;
        
      case 'toggle':
        this._toggleEntity(entityId);
        break;
        
      default:
        console.log(`[ContextMenuManager] Unhandled action: ${action}`);
    }
    
    // Haptic feedback for action
    this._triggerHapticFeedback('light');
  }

  /**
   * Toggle entity state
   */
  _toggleEntity(entityId) {
    if (!entityId || !this._hass) return;
    
    const domain = entityId.split('.')[0];
    let service = 'toggle';
    
    // Use appropriate service for domain
    if (['switch', 'light', 'fan'].includes(domain)) {
      service = 'toggle';
    } else if (domain === 'media_player') {
      service = 'media_play_pause';
    }
    
    this._hass.callService(domain, service, { entity_id: entityId });
  }

  /**
   * Show entity history
   */
  _showEntityHistory(entityId) {
    // Open entity details popup with history tab
    console.log(`[ContextMenuManager] Opening history for: ${entityId}`);
    // TODO: Integrate with existing popup system
  }

  /**
   * Add to favorites
   */
  _addToFavorites(entityId, options) {
    console.log(`[ContextMenuManager] Adding to favorites: ${entityId}`);
    // TODO: Implement favorites system
  }

  /**
   * Edit configuration
   */
  _editConfiguration(entityId, options) {
    console.log(`[ContextMenuManager] Editing configuration for: ${entityId}`);
    // TODO: Open admin panel or configuration dialog
  }

  /**
   * Hide from dashboard
   */
  _hideFromDashboard(entityId, options) {
    console.log(`[ContextMenuManager] Hiding from dashboard: ${entityId}`);
    // TODO: Update configuration to hide entity
  }

  /**
   * Show entity details - opens entity detail popup
   */
  _showEntityDetails(entityId) {
    if (!entityId) return;
    
    console.log(`[ContextMenuManager] Opening entity details for: ${entityId}`);
    
    // Use the popup manager to open entity detail popup
    if (this._panel._popupManager) {
      const hash = `#entity-detail-${entityId}`;
      window.location.hash = hash;
    }
  }

  /**
   * Open room allocation - opens admin room management section
   */
  _openRoomAllocation(entityId) {
    console.log(`[ContextMenuManager] Opening room allocation for: ${entityId}`);
    
    // Open admin panel with room management tab
    window.open('/local/dashview/admin.html#room-management-tab', '_blank');
  }

  /**
   * Remove from room
   */
  _removeFromRoom(entityId, options) {
    console.log(`[ContextMenuManager] Removing from room: ${entityId}`);
    // TODO: Update room configuration to remove entity
  }

  /**
   * Start auto-hide timer
   */
  _startHideTimer() {
    this._clearHideTimer();
    this._hideTimer = setTimeout(() => {
      this.hideMenu();
    }, this.menuTimeout);
  }

  /**
   * Clear auto-hide timer
   */
  _clearHideTimer() {
    if (this._hideTimer) {
      clearTimeout(this._hideTimer);
      this._hideTimer = null;
    }
  }

  /**
   * Trigger haptic feedback
   */
  _triggerHapticFeedback(intensity = 'light') {
    if (!this.enableHapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      strong: [50]
    };
    
    navigator.vibrate(patterns[intensity] || patterns.light);
  }

  /**
   * Clean up resources
   */
  dispose() {
    console.log('[ContextMenuManager] Disposing resources');
    
    this.hideMenu();
    this._clearHideTimer();
    
    const container = this._shadowRoot.getElementById('context-menu-container');
    if (container) {
      container.remove();
    }
    
    this._panel = null;
    this._hass = null;
    this._shadowRoot = null;
  }
}