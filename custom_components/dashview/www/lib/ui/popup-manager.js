// custom_components/dashview/lib/ui/popup-manager.js

export class PopupManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._config = panel._houseConfig;
    this._shadowRoot = panel.shadowRoot;
    
    this._componentInitializers = panel._componentInitializers;

    this._setupEventListeners();
  }

  _setupEventListeners() {
    window.addEventListener('hashchange', () => this.handleHashChange(), true);

    this._shadowRoot.addEventListener('click', (e) => {
      
      if (e.target.classList.contains('popup')) {
          this.closePopup();
          return;
      }

      // This is the corrected, more robust event handler
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
    this._shadowRoot.querySelectorAll('.popup').forEach(p => p.classList.remove('active'));
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
        document.body.classList.add('popup-open');
        this.reinitializePopupContent(targetPopup);
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
    const isRoom = this._config && this._config.rooms && this._config.rooms[popupType];

    if (!isRoom) {
        try {
            const response = await fetch(`/local/dashview/${popupType}.html`);
            if (response.ok) content = await response.text();
        } catch (err) {
            console.error(`[PopupManager] Could not fetch HTML for ${popupType}:`, err);
        }
    }
    
    return this.createPopupFromTemplate(popupId, popupType, content);
  }

  createPopupFromTemplate(popupId, popupType, content) {
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
    bodyElement.innerHTML = content;
    
    const roomConfig = this._config?.rooms?.[popupType];
    if (roomConfig) {
        this._injectRoomCards(bodyElement, roomConfig);
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
    if (closeBtn) {
        closeBtn.onclick = () => this.closePopup();
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
  }

  _initializeDynamicContent(container) {
    if (!container || !this._componentInitializers) return; 
    for (const [selector, initializer] of Object.entries(this._componentInitializers)) {
      container.querySelectorAll(selector).forEach(element => {
        try {
          initializer(element);
        } catch (error) {
          console.error(`[PopupManager] Error initializing component for selector "${selector}":`, error);
        }
      });
    }
  }

  _injectRoomCards(popupBody, roomConfig) {
    const cardTemplates = {
        thermostat: {
            condition: roomConfig.header_entities?.some(e => e.entity_type === 'temperatur' || e.entity_type === 'humidity'),
            path: '/local/dashview/templates/room-thermostat-card.html'
        },
        covers: {
            condition: roomConfig.covers && roomConfig.covers.length > 0,
            path: '/local/dashview/templates/room-covers-card.html'
        },
        lights: {
            condition: roomConfig.lights && roomConfig.lights.length > 0,
            path: '/local/dashview/templates/room-lights-card.html'
        },
        media: {
            condition: roomConfig.media_players && roomConfig.media_players.length > 0,
            path: '/local/dashview/templates/room-media-player-card.html'
        }
    };

    for (const [cardType, cardInfo] of Object.entries(cardTemplates)) {
        if (cardInfo.condition) {
            fetch(cardInfo.path)
                .then(response => response.text())
                .then(html => {
                    const container = document.createElement('div');
                    container.innerHTML = html;
                    popupBody.appendChild(container);
                    this._initializeDynamicContent(container);
                })
                .catch(err => console.error(`[PopupManager] Error loading ${cardType} card template:`, err));
        }
    }
  }
}
