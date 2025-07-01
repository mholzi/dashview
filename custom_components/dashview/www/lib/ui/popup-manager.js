// custom_components/dashview/www/lib/ui/popup-manager.js

export class PopupManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._config = panel._houseConfig;
    this._shadowRoot = panel.shadowRoot;
    this._componentInitializers = panel._componentInitializers;
    this._templateCache = new Map(); // Template caching
    this._contentInjectors = new Map(); // Content injectors registry
    this._setupEventListeners();
  }

  setHass(hass) {
    this._hass = hass;
  }

  _setupEventListeners() {
    window.addEventListener('hashchange', () => this.handleHashChange(), true);

    this._shadowRoot.addEventListener('click', (e) => {
      if (e.target.classList.contains('popup')) {
          this.closePopup();
          return;
      }
      const hashTarget = e.target.closest('[data-hash]');
      if (hashTarget) {
          e.preventDefault();
          const newHash = hashTarget.getAttribute('data-hash');
          if (window.location.hash !== newHash) {
              window.location.hash = newHash;
          }
          return;
      }
      const kioskButton = e.target.closest('.kiosk-button');
      if (kioskButton) {
          this._panel.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true }));
      }
    });
  }

  async handleHashChange() {
    const hash = window.location.hash || '#home';
    this._shadowRoot.querySelectorAll('.popup').forEach(p => {
        p.classList.remove('active', 'visible', 'ready');
    });
    this._shadowRoot.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
    document.body.classList.remove('popup-open');

    if (hash !== '#home') {
      let popupType = hash.substring(1);
      let entityId = null;
      
      // Check if it's an entity detail popup
      if (popupType.startsWith('entity-details-')) {
        entityId = popupType.substring('entity-details-'.length);
        popupType = 'entity-details';
      }
      
      const popupId = entityId ? `entity-${entityId}-detail-popup` : `${popupType}-popup`;
      let targetPopup = this._shadowRoot.querySelector('#' + popupId);

      if (!targetPopup) {
        targetPopup = await this.createPopup(popupType, entityId);
      }
      
      if (targetPopup) {
        targetPopup.classList.add('active'); 
        targetPopup.classList.add('visible');
        document.body.classList.add('popup-open');

        this.reinitializePopupContent(targetPopup);
        
        setTimeout(() => {
            targetPopup.classList.add('ready');
            this._emitLifecycleEvent('popup:shown', { popupType, entityId });
        }, 50);
      }
    }

    const activeButton = this._shadowRoot.querySelector(`.nav-button[data-hash="${hash}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  async createPopup(popupType, entityId = null) {
    // Handle entity detail popups
    if (popupType === 'entity-details' && entityId) {
      return await this.createEntityDetailPopup(entityId);
    }
    
    const popupId = `${popupType}-popup`;
    let content = '';
    const isRoom = this._config?.rooms?.[popupType];

    if (!isRoom) {
        try {
            const response = await fetch(`/local/dashview/${popupType}.html`);
            if (response.ok) {
              content = await response.text();
            }
        } catch (err) {
            console.error(`[PopupManager] Could not fetch HTML for ${popupType}:`, err);
        }
    }
    
    return await this.createPopupFromTemplate(popupId, popupType, content);
  }

  async createPopupFromTemplate(popupId, popupType, content) {
    const template = this._shadowRoot.querySelector('#popup-template');
    if (!template) {
      console.error('[PopupManager] Popup template not found');
      return null;
    }

    const popup = document.createElement('div');
    popup.id = popupId;
    popup.className = 'popup';

    const templateContent = template.content.cloneNode(true);
    const bodyElement = templateContent.querySelector('.popup-body');
    
    templateContent.querySelector('.popup-icon').className = `popup-icon mdi ${this._panel.getPopupIconForType(popupType)}`;
    templateContent.querySelector('.popup-title').textContent = this._panel.getPopupTitleForType(popupType);
    
    const roomConfig = this._config?.rooms?.[popupType];
    if (roomConfig) {
        // Generate and prepend the header icons HTML
        const headerIconsHTML = this._panel._generateRoomHeaderEntitiesForPopup(roomConfig);
        bodyElement.innerHTML = headerIconsHTML + content; // Prepend icons
        await this._injectRoomCards(bodyElement, roomConfig, popupType);
    } else {
        bodyElement.innerHTML = content;
    }
    
    popup.appendChild(templateContent);
    this._shadowRoot.appendChild(popup);
    return popup;
  }

  closePopup() {
    // Emit closing event
    const activePopup = this._shadowRoot.querySelector('.popup.active');
    if (activePopup) {
      const entityMatch = activePopup.id.match(/^entity-(.+)-detail-popup$/);
      const entityId = entityMatch ? entityMatch[1] : null;
      this._emitLifecycleEvent('popup:closing', { popupId: activePopup.id, entityId });
      
      // Cleanup accessibility features
      this._cleanupPopupAccessibility(activePopup);
    }
    
    window.location.hash = '#home';
    
    // Restore focus to previously focused element
    if (this._previouslyFocusedElement) {
      try {
        this._previouslyFocusedElement.focus();
      } catch (error) {
        // Element might not be focusable anymore, ignore
        console.debug('[PopupManager] Could not restore focus:', error);
      }
      this._previouslyFocusedElement = null;
    }
    
    // Emit closed event after hash change
    setTimeout(() => {
      this._emitLifecycleEvent('popup:closed', {});
    }, 100);
  }
  
  /**
   * Cleanup accessibility features when popup closes
   * @param {HTMLElement} popup - The popup element
   */
  _cleanupPopupAccessibility(popup) {
    // Remove keyboard event listeners
    if (popup._keyDownHandler) {
      popup.removeEventListener('keydown', popup._keyDownHandler);
      popup._keyDownHandler = null;
    }
    
    // Clear focus trapping function
    if (popup._getFocusableElements) {
      popup._getFocusableElements = null;
    }
  }

  reinitializePopupContent(popup) {
    const closeBtn = popup.querySelector('.popup-close');
    if (closeBtn && !closeBtn.listenerAttached) {
        closeBtn.addEventListener('click', () => this.closePopup());
        closeBtn.listenerAttached = true;
    }
  
    popup.querySelectorAll('.tabs-container').forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            if (!button.listenerAttached) {
                button.addEventListener('click', () => {
                    const targetId = button.getAttribute('data-target');
                    container.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    button.classList.add('active');
                    container.querySelectorAll('.tab-content').forEach(content => content.classList.toggle('active', content.id === targetId));
  
                    if (this._panel._adminManager) {
                        this._panel._adminManager.loadTabContent(targetId);
                    }
                });
                button.listenerAttached = true;
            }
        });
        if (tabButtons.length > 0 && !container.querySelector('.tab-button.active')) {
            tabButtons[0].click();
        }
    });
  
    this._initializeDynamicContent(popup);

    if (popup.id === 'security-popup') {
        this._panel._securityManager.update();
    }
    if (popup.id === 'weather-popup') {
        this._panel._weatherManager.update();
    }
    if (popup.id === 'calendar-popup') {
        this._panel._calendarManager.update(popup);
    }
    
    // Handle room popup entity refresh
    const roomKey = popup.id.replace('-popup', '');
    if (this._config?.rooms?.[roomKey]) {
        this._refreshRoomEntities(roomKey, popup);
    }
  }

  _initializeDynamicContent(container) {
    if (!container || !this._componentInitializers) return; 
    for (const [selector, initializer] of Object.entries(this._componentInitializers)) {
      container.querySelectorAll(selector).forEach(element => {
        try {
          if(!element.dataset.initialized) {
            initializer(element);
            element.dataset.initialized = 'true';
          }
        } catch (error) {
          console.error(`[PopupManager] Error initializing component for selector "${selector}":`, error);
        }
      });
    }
  }

  async _injectRoomCards(popupBody, roomConfig, roomKey) {
    console.log(`[PopupManager] Injecting room cards for ${roomKey}`);
    const cardTemplates = {
        scenes: {
            condition: this._hasRoomScenes(roomConfig, roomKey),
            path: '/local/dashview/templates/room-scenes-card.html'
        },
        thermostat: {
            condition: roomConfig.header_entities?.some(e => e.entity_type === 'temperatur' || e.entity_type === 'humidity'),
            path: '/local/dashview/templates/room-thermostat-card.html'
        },
        covers: {
            condition: roomConfig.covers?.length > 0,
            path: '/local/dashview/templates/room-covers-card.html'
        },
        lights: {
            condition: roomConfig.lights?.length > 0,
            path: '/local/dashview/templates/room-lights-card.html'
        },
        media: {
            condition: roomConfig.media_players?.length > 0,
            path: '/local/dashview/templates/room-media-player-card.html'
        },
        otherEntities: {
            condition: roomConfig.header_entities?.some(e => ['hoover', 'mower', 'other_door'].includes(e.entity_type)),
            path: '/local/dashview/templates/room-other-entities-card.html'
        }
    };

    const fetchPromises = [];

    for (const [cardType, cardInfo] of Object.entries(cardTemplates)) {
        console.log(`[PopupManager] Card ${cardType} condition:`, cardInfo.condition);
        if (cardInfo.condition) {
            console.log(`[PopupManager] Loading card template for ${cardType}:`, cardInfo.path);
            fetchPromises.push(
                fetch(cardInfo.path)
                    .then(response => {
                        if (!response.ok) throw new Error(`Failed to fetch ${cardInfo.path}`);
                        return response.text();
                    })
                    .catch(err => {
                        console.error(`[PopupManager] Error loading card template:`, err);
                        return '';
                    })
            );
        }
    }

    const htmlContents = await Promise.all(fetchPromises);
    
    htmlContents.forEach(html => {
        if (html) {
            const container = document.createElement('div');
            container.innerHTML = html;
            popupBody.appendChild(container);
        }
    });
  }

  _refreshRoomEntities(roomKey, popup) {
    const roomConfig = this._config.rooms[roomKey];
    if (!roomConfig || !this._hass) return;

    console.log(`[PopupManager] Refreshing entities for room: ${roomKey}`);

    // Collect all entities in this room that need updates
    const entitiesToUpdate = [];

    // Add light entities
    if (roomConfig.lights?.length > 0) {
        entitiesToUpdate.push(...roomConfig.lights);
    }

    // Add cover entities  
    if (roomConfig.covers?.length > 0) {
        entitiesToUpdate.push(...roomConfig.covers);
    }

    // Add media player entities
    if (roomConfig.media_players?.length > 0) {
        roomConfig.media_players.forEach(mp => {
            entitiesToUpdate.push(mp.entity);
        });
    }

    // Add header entities (temperature, humidity, etc.)
    if (roomConfig.header_entities?.length > 0) {
        roomConfig.header_entities.forEach(he => {
            entitiesToUpdate.push(he.entity);
        });
    }

    // Force update all components for these entities
    entitiesToUpdate.forEach(entityId => {
        if (this._hass.states[entityId]) {
            // Use the main panel's update mechanism to refresh components
            this._panel.updateComponentForEntity(entityId);
        }
    });

    // Additional specific component updates
    this._updateRoomSpecificComponents(popup, roomConfig);
  }

  _updateRoomSpecificComponents(popup, roomConfig) {
    // Force update light cards
    const lightCards = popup.querySelectorAll('.room-lights-card');
    lightCards.forEach(card => {
        if (this._panel._lightsCard) {
            this._panel._lightsCard.update();
        }
    });

    // Force update cover cards
    const coverCards = popup.querySelectorAll('.room-covers-card');
    coverCards.forEach(card => {
        if (this._panel._coversCard) {
            this._panel._coversCard.update();
        }
    });

    // Force update media player cards  
    const mediaCards = popup.querySelectorAll('.room-media-player-card');
    mediaCards.forEach(card => {
        if (this._panel._mediaPlayerCard) {
            this._panel._mediaPlayerCard.update();
        }
    });

    // Force update thermostat cards
    const thermostatCards = popup.querySelectorAll('.thermostat-card');
    thermostatCards.forEach(card => {
        if (this._panel._thermostatCard) {
            this._panel._thermostatCard.update(popup, roomKey);
        }
    });
  }

  /**
   * Check if room has scenes (auto-generated or manual)
   * @param {Object} roomConfig - Room configuration 
   * @param {string} roomKey - Room key
   * @returns {boolean} Whether the room has scenes
   */
  _hasRoomScenes(roomConfig, roomKey) {
    const scenes = this._config?.scenes || [];
    console.log(`[PopupManager] Checking scenes for room ${roomKey}:`, scenes.length, 'total scenes');
    
    const hasScenes = scenes.some(scene => {
        // Check if it's an auto-generated scene for this room
        if (scene.auto_generated && scene.room_key === roomKey) {
            console.log(`[PopupManager] Found auto-generated scene for ${roomKey}:`, scene.name);
            return true;
        }
        // Check if it's a global auto-generated scene (should appear in all room popups)
        if (scene.auto_generated && scene.type === 'auto_global_covers') {
            console.log(`[PopupManager] Found global cover scene for ${roomKey}:`, scene.name);
            return true;
        }
        // Check if it's a manual scene that includes entities from this room
        if (scene.entities && !scene.auto_generated) {
            const roomEntities = [
                ...(roomConfig.lights || []),
                ...(roomConfig.covers || []),
                ...(roomConfig.media_players?.map(mp => mp.entity) || [])
            ];
            const hasMatchingEntities = scene.entities.some(entity => roomEntities.includes(entity));
            if (hasMatchingEntities) {
                console.log(`[PopupManager] Found manual scene for ${roomKey}:`, scene.name);
            }
            return hasMatchingEntities;
        }
        return false;
    });
    
    console.log(`[PopupManager] Room ${roomKey} has scenes:`, hasScenes);
    return hasScenes;
  }

  /**
   * Create entity detail popup
   * @param {string} entityId - The entity ID to show details for
   * @returns {Promise<HTMLElement|null>} The popup element or null
   */
  async createEntityDetailPopup(entityId) {
    console.log('[PopupManager] Creating entity detail popup for:', entityId);
    
    // Store currently focused element for restoration
    this._previouslyFocusedElement = document.activeElement;
    
    // Emit popup:created event
    this._emitLifecycleEvent('popup:created', { entityId });
    
    try {
      // Load the container template
      const containerHTML = await this._loadTemplate('/local/dashview/templates/entity-detail-popup-container.html');
      if (!containerHTML) {
        console.error('[PopupManager] Failed to load entity detail popup container template');
        return null;
      }
      
      // Create popup element
      const popup = document.createElement('div');
      popup.id = `entity-${entityId}-detail-popup`;
      popup.className = 'popup entity-detail-popup';
      popup.innerHTML = containerHTML;
      
      // Setup accessibility and interactions
      this._setupPopupAccessibility(popup, entityId);
      
      // Add popup to shadow DOM
      this._shadowRoot.appendChild(popup);
      
      // Populate entity info
      await this._populateEntityDetails(popup, entityId);
      
      return popup;
      
    } catch (error) {
      console.error('[PopupManager] Error creating entity detail popup:', error);
      this._emitLifecycleEvent('popup:content-error', { entityId, error });
      return null;
    }
  }
  
  /**
   * Setup accessibility features for entity detail popup
   * @param {HTMLElement} popup - The popup element
   * @param {string} entityId - The entity ID
   */
  _setupPopupAccessibility(popup, entityId) {
    const container = popup.querySelector('.entity-detail-popup-container');
    const closeBtn = popup.querySelector('#entity-popup-close');
    const overlay = popup.querySelector('.entity-detail-popup-overlay');
    
    // Setup close button
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePopup());
    }
    
    // Setup overlay click to close
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closePopup();
        }
      });
    }
    
    // Setup keyboard navigation
    this._setupKeyboardNavigation(popup);
    
    // Setup focus trapping
    this._setupFocusTrapping(popup);
    
    // Set initial focus
    setTimeout(() => {
      this._setInitialFocus(popup);
    }, 100);
  }
  
  /**
   * Setup keyboard navigation for popup
   * @param {HTMLElement} popup - The popup element
   */
  _setupKeyboardNavigation(popup) {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          e.preventDefault();
          this.closePopup();
          break;
        case 'Tab':
          this._handleTabNavigation(e, popup);
          break;
      }
    };
    
    popup.addEventListener('keydown', handleKeyDown);
    
    // Store reference for cleanup
    popup._keyDownHandler = handleKeyDown;
  }
  
  /**
   * Setup focus trapping within popup
   * @param {HTMLElement} popup - The popup element
   */
  _setupFocusTrapping(popup) {
    const getFocusableElements = () => {
      const focusableSelectors = [
        'button:not([disabled])',
        'input:not([disabled])',
        'select:not([disabled])',
        'textarea:not([disabled])',
        'a[href]',
        '[tabindex]:not([tabindex="-1"])'
      ];
      
      return popup.querySelectorAll(focusableSelectors.join(','));
    };
    
    popup._getFocusableElements = getFocusableElements;
  }
  
  /**
   * Handle tab navigation within popup
   * @param {KeyboardEvent} e - The keyboard event
   * @param {HTMLElement} popup - The popup element
   */
  _handleTabNavigation(e, popup) {
    const focusableElements = popup._getFocusableElements();
    if (focusableElements.length === 0) return;
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    if (e.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  }
  
  /**
   * Set initial focus in popup
   * @param {HTMLElement} popup - The popup element
   */
  _setInitialFocus(popup) {
    // Try to focus the first interactive element, fallback to container
    const focusableElements = popup._getFocusableElements();
    
    if (focusableElements.length > 0) {
      // Skip close button for better UX, focus first content element
      const contentElements = Array.from(focusableElements).filter(el => 
        !el.classList.contains('entity-detail-popup-close')
      );
      
      if (contentElements.length > 0) {
        contentElements[0].focus();
      } else {
        focusableElements[0].focus();
      }
    } else {
      // Focus the container itself
      const container = popup.querySelector('.entity-detail-popup-container');
      if (container) {
        container.focus();
      }
    }
  }
  
  /**
   * Populate entity details in the popup
   * @param {HTMLElement} popup - The popup element
   * @param {string} entityId - The entity ID
   */
  async _populateEntityDetails(popup, entityId) {
    const entityState = this._hass.states[entityId];
    if (!entityState) {
      console.error('[PopupManager] Entity not found:', entityId);
      return;
    }
    
    // Update header info
    const titleEl = popup.querySelector('#entity-popup-title');
    const subtitleEl = popup.querySelector('#entity-popup-subtitle');
    const iconEl = popup.querySelector('#entity-popup-icon');
    
    if (titleEl) titleEl.textContent = entityState.attributes.friendly_name || entityId;
    if (subtitleEl) subtitleEl.textContent = entityId;
    
    // Set icon based on entity type
    if (iconEl) {
      const icon = this._getEntityIcon(entityState);
      iconEl.className = `entity-detail-popup-icon mdi ${icon}`;
    }
    
    // Emit content loading event
    this._emitLifecycleEvent('popup:content-loading', { entityId });
    
    // Update ARIA busy state
    const contentEl = popup.querySelector('#entity-popup-content');
    if (contentEl) {
      contentEl.setAttribute('aria-busy', 'false');
    }
    
    // Use EntityDetailManager for content orchestration
    if (this._panel._entityDetailManager) {
      try {
        await this._panel._entityDetailManager.populatePopupContent(popup, entityId);
        this._emitLifecycleEvent('popup:content-loaded', { entityId });
      } catch (error) {
        console.error('[PopupManager] EntityDetailManager failed:', error);
        // Fallback to generic content
        await this._populateGenericContent(popup, entityId, entityState);
      }
    } else {
      // Fallback to original logic if EntityDetailManager not available
      await this._populateGenericContent(popup, entityId, entityState);
    }
  }
  
  /**
   * Fallback method for generic content population
   * @param {HTMLElement} popup - The popup element
   * @param {string} entityId - The entity ID
   * @param {Object} entityState - The entity state
   */
  async _populateGenericContent(popup, entityId, entityState) {
    const contentEl = popup.querySelector('#entity-popup-content');
    if (contentEl) {
      // Hide loading indicator
      const loadingEl = contentEl.querySelector('.entity-detail-popup-loading');
      if (loadingEl) loadingEl.style.display = 'none';
      
      // Inject content based on entity type
      const injected = await this._injectEntityContent(contentEl, entityId, entityState);
      
      if (injected) {
        this._emitLifecycleEvent('popup:content-loaded', { entityId });
      } else {
        // Show generic entity info if no specific template
        contentEl.innerHTML = this._generateGenericEntityContent(entityState);
        this._emitLifecycleEvent('popup:content-loaded', { entityId });
      }
    }
  }
  
  /**
   * Get icon for entity based on its type and state
   * @param {Object} entityState - The entity state object
   * @returns {string} The MDI icon class
   */
  _getEntityIcon(entityState) {
    const domain = entityState.entity_id.split('.')[0];
    const state = entityState.state;
    
    // Check for custom icon in attributes
    if (entityState.attributes.icon) {
      return this._panel._processIconName(entityState.attributes.icon);
    }
    
    // Default icons by domain
    const domainIcons = {
      light: state === 'on' ? 'mdi-lightbulb' : 'mdi-lightbulb-outline',
      switch: state === 'on' ? 'mdi-toggle-switch' : 'mdi-toggle-switch-off',
      sensor: 'mdi-eye',
      binary_sensor: 'mdi-checkbox-marked-circle',
      climate: 'mdi-thermostat',
      cover: 'mdi-window-shutter',
      media_player: 'mdi-cast',
      camera: 'mdi-camera',
      vacuum: 'mdi-robot-vacuum',
      fan: 'mdi-fan',
      lock: state === 'locked' ? 'mdi-lock' : 'mdi-lock-open',
      alarm_control_panel: 'mdi-shield',
      automation: 'mdi-robot',
      scene: 'mdi-palette',
      script: 'mdi-script-text',
      person: 'mdi-account',
      device_tracker: 'mdi-map-marker'
    };
    
    return domainIcons[domain] || 'mdi-help-circle';
  }
  
  /**
   * Inject entity-specific content
   * @param {HTMLElement} container - The content container
   * @param {string} entityId - The entity ID
   * @param {Object} entityState - The entity state
   * @returns {Promise<boolean>} Whether content was injected
   */
  async _injectEntityContent(container, entityId, entityState) {
    const domain = entityId.split('.')[0];
    
    // Check for registered content injectors
    const injector = this._contentInjectors.get(domain);
    if (injector && injector.canHandle(entityId)) {
      try {
        await injector.populateContent(container, entityId);
        return true;
      } catch (error) {
        console.error('[PopupManager] Content injector error:', error);
      }
    }
    
    // Try to load domain-specific template
    const templatePath = `/local/dashview/templates/entity-${domain}-detail.html`;
    const template = await this._loadTemplate(templatePath);
    
    if (template) {
      container.innerHTML = template;
      // Process template placeholders
      this._processTemplatePlaceholders(container, entityState);
      return true;
    }
    
    return false;
  }
  
  /**
   * Generate generic entity content
   * @param {Object} entityState - The entity state
   * @returns {string} HTML content
   */
  _generateGenericEntityContent(entityState) {
    const attributes = entityState.attributes;
    const stateStr = entityState.state;
    
    let html = '<div class="entity-detail-generic">';
    html += '<div class="entity-detail-state">';
    html += `<span class="entity-detail-state-label">State:</span>`;
    html += `<span class="entity-detail-state-value">${stateStr}</span>`;
    html += '</div>';
    
    // Show key attributes
    const importantAttrs = ['device_class', 'unit_of_measurement', 'last_changed', 'last_updated'];
    
    html += '<div class="entity-detail-attributes">';
    html += '<h4>Attributes</h4>';
    
    for (const [key, value] of Object.entries(attributes)) {
      if (key !== 'friendly_name' && key !== 'icon') {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        html += `<div class="entity-detail-attribute">`;
        html += `<span class="entity-detail-attribute-key">${displayKey}:</span>`;
        html += `<span class="entity-detail-attribute-value">${this._formatAttributeValue(value)}</span>`;
        html += `</div>`;
      }
    }
    
    html += '</div></div>';
    return html;
  }
  
  /**
   * Format attribute value for display
   * @param {any} value - The attribute value
   * @returns {string} Formatted value
   */
  _formatAttributeValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }
  
  /**
   * Process template placeholders
   * @param {HTMLElement} container - The container with template
   * @param {Object} entityState - The entity state
   */
  _processTemplatePlaceholders(container, entityState) {
    // Replace {{entity_id}}, {{state}}, {{friendly_name}}, etc.
    const html = container.innerHTML;
    const processed = html
      .replace(/\{\{entity_id\}\}/g, entityState.entity_id)
      .replace(/\{\{state\}\}/g, entityState.state)
      .replace(/\{\{friendly_name\}\}/g, entityState.attributes.friendly_name || entityState.entity_id);
    
    // Process attributes
    for (const [key, value] of Object.entries(entityState.attributes)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      processed.replace(placeholder, this._formatAttributeValue(value));
    }
    
    container.innerHTML = processed;
  }
  
  /**
   * Load template with caching
   * @param {string} templatePath - Path to template
   * @returns {Promise<string|null>} Template content or null
   */
  async _loadTemplate(templatePath) {
    // Check cache first
    if (this._templateCache.has(templatePath)) {
      return this._templateCache.get(templatePath);
    }
    
    try {
      const response = await fetch(templatePath);
      if (response.ok) {
        const content = await response.text();
        // Cache the template
        this._templateCache.set(templatePath, content);
        return content;
      }
    } catch (error) {
      console.error('[PopupManager] Failed to load template:', templatePath, error);
    }
    
    return null;
  }
  
  /**
   * Register a content injector
   * @param {string} domain - Entity domain
   * @param {Object} injector - Content injector object
   */
  registerContentInjector(domain, injector) {
    this._contentInjectors.set(domain, injector);
  }
  
  /**
   * Emit lifecycle event
   * @param {string} eventName - Event name
   * @param {Object} detail - Event detail
   */
  _emitLifecycleEvent(eventName, detail) {
    const event = new CustomEvent(eventName, {
      detail,
      bubbles: true,
      composed: true
    });
    this._shadowRoot.dispatchEvent(event);
  }
  
  /**
   * Show entity detail popup
   * @param {string} entityId - Entity ID to show details for
   */
  showEntityDetailPopup(entityId) {
    // Close any existing popup
    this.closePopup();
    
    // Create a temporary hash for entity detail popup
    window.location.hash = `#entity-details-${entityId}`;
  }
}
