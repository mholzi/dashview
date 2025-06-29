// custom_components/dashview/www/lib/ui/popup-manager.js

export class PopupManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._config = panel._houseConfig;
    this._shadowRoot = panel.shadowRoot;
    this._componentInitializers = panel._componentInitializers;
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
      const popupType = hash.substring(1);
      const popupId = popupType + '-popup';
      let targetPopup = this._shadowRoot.querySelector('#' + popupId);

      if (!targetPopup) {
        targetPopup = await this.createPopup(popupType);
      }
      
      if (targetPopup) {
        targetPopup.classList.add('active'); 
        targetPopup.classList.add('visible');
        document.body.classList.add('popup-open');

        this.reinitializePopupContent(targetPopup);
        
        setTimeout(() => {
            targetPopup.classList.add('ready');
        }, 50);
      }
    }

    const activeButton = this._shadowRoot.querySelector(`.nav-button[data-hash="${hash}"]`);
    if (activeButton) {
      activeButton.classList.add('active');
    }
  }

  async createPopup(popupType) {
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
    window.location.hash = '#home';
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
    const thermostatCards = popup.querySelectorAll('.room-thermostat-card');
    thermostatCards.forEach(card => {
        if (this._panel._thermostatCard) {
            this._panel._thermostatCard.update();
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
        // Check if it's a manual scene that includes entities from this room
        if (scene.entities) {
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
}
