// custom_components/dashview/www/dashview-panel.js

import { StateManager } from './lib/state-manager.js';
import { ConfigManager } from './lib/config-manager.js';
import { AdminManager } from './lib/ui/AdminManager.js';
import { FloorManager } from './lib/ui/FloorManager.js';
import { HeaderManager } from './lib/ui/header-manager.js';
import { PopupManager } from './lib/ui/popup-manager.js';
import { InfoCardManager } from './lib/ui/info-card-manager.js';
import { WeatherComponents } from './lib/ui/weather-components.js';
import { SecurityComponents } from './lib/ui/security-components.js';
import { CoversCard } from './lib/ui/covers-card.js';
import { LightsCard } from './lib/ui/light-card.js';
import { ThermostatCard } from './lib/ui/thermostat-card.js';
import { MediaPlayerCard } from './lib/ui/media-player-card.js';
import { SceneManager } from './lib/ui/SceneManager.js';

class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    this._hass = null;
    this._contentReady = false;
    this._houseConfig = {};
    this._integrationsConfig = {};
    this._weatherEntityId = 'weather.forecast_home';

    this._entityLabels = {
        MOTION: 'motion', WINDOW: 'fenster', SMOKE: 'rauchmelder', VIBRATION: 'vibration',
        TEMPERATUR: 'temperatur', HUMIDITY: 'humidity', PRINTER: 'printer', DOOR: 'door',
        HOOVER: 'hoover', DISHWASHER: 'dishwasher', DRYER: 'dryer', CARTRIDGE: 'cartridge',
        LIGHT: 'light', SLIDING_DOOR: 'sliding_door', FREEZER: 'freezer'
    };

    // Define component initializers in the constructor
    this._componentInitializers = {
      '.media-container': (el) => {
          const popup = el.closest('.popup');
          if (popup && popup.id === 'music-popup') {
              this._generateMusicPopupContent(popup);
          }
      },
      '.covers-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.covers?.length > 0) {
          this._coversManager.initialize(popup, roomConfig.covers);
        }
      },
      '.lights-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.lights?.length > 0) {
          this._lightsManager.initialize(popup, roomKey, roomConfig.lights);
        }
      },
       '.media-player-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.media_players?.length > 0) {
          this._mediaPlayerManager.initialize(popup, roomKey, roomConfig.media_players);
        }
      }
    };
  }
  
  connectedCallback() {
    this.loadContent();
  }

set hass(hass) {
    if (!this._contentReady) {
        this._hass = hass;
        return;
    }

    // Always update the hass object in the managers
    this._hass = hass;
    if (this._stateManager) this._stateManager.setHass(hass);
    if (this._infoCardManager) this._infoCardManager.setHass(hass);
    if (this._weatherManager) this._weatherManager.setHass(hass);
    if (this._sceneManager) this._sceneManager.setHass(hass);
    if (this._floorManager) this._floorManager.setHass(hass);

    // And always run the update handler.
    // The state manager will handle checking for actual entity changes.
    if (this._stateManager) {
        this._stateManager.handleHassUpdate();
    }
  }
  async loadContent() {
    try {
        const [styleText, htmlText] = await Promise.all([
            fetch('/local/dashview/style.css').then(res => res.text()),
            fetch('/local/dashview/index.html').then(res => res.text())
        ]);
        this.shadowRoot.innerHTML = `<style>${styleText}</style>${htmlText}`;
        
        await this._loadTemplates(this.shadowRoot);

        this._configManager = new ConfigManager();
        this._configManager.setHass(this._hass);
        const configs = await this._configManager.loadAll();
        this._houseConfig = configs.houseConfig;
        this._integrationsConfig = configs.integrationsConfig;
        this._weatherEntityId = configs.weatherEntityId;

        this.initializeManagers();
        
        this._sceneManager.renderSceneButtons();
        this._floorManager.initializeFloorTabs();

        this.initializeCard();
        
        this._contentReady = true;
        if (this._hass) {
            this.hass = this._hass; 
        }

    } catch (error) {
        this.shadowRoot.innerHTML = `<div class="placeholder error">Error loading DashView: ${error.message}</div>`;
        console.error('[DashView] Critical Error during loadContent:', error);
    }
  }

  initializeManagers() {
    this._stateManager = new StateManager(this);
    this._adminManager = new AdminManager(this);
    this._headerManager = new HeaderManager(this);
    this._popupManager = new PopupManager(this);
    this._infoCardManager = new InfoCardManager(this);
    this._weatherManager = new WeatherComponents(this);
    this._securityManager = new SecurityComponents(this);
    this._coversManager = new CoversCard(this);
    this._lightsManager = new LightsCard(this);
    this._thermostatManager = new ThermostatCard(this);
    this._mediaPlayerManager = new MediaPlayerCard(this);
    this._floorManager = new FloorManager(this);
    this._sceneManager = new SceneManager(this);

    this._stateManager.setConfig(this._houseConfig, this._integrationsConfig);
  }

  _getRoomKeyForEntity(entityId) {
    if (!this._houseConfig || !this._houseConfig.rooms) {
      return null;
    }
    for (const [roomKey, roomConfig] of Object.entries(this._houseConfig.rooms)) {
      if (
        (roomConfig.lights && roomConfig.lights.includes(entityId)) ||
        (roomConfig.covers && roomConfig.covers.includes(entityId)) ||
        (roomConfig.media_players && roomConfig.media_players.some(p => p.entity === entityId)) ||
        (roomConfig.header_entities && roomConfig.header_entities.some(e => e.entity === entityId))
      ) {
        return roomKey;
      }
    }
    return null;
  }

  updateComponentForEntity(entityId, entityState) {
    if (!this._contentReady) return;

    this._headerManager.updateAll();
    this._infoCardManager.update();
    this._sceneManager.renderSceneButtons();
    this._floorManager.initializeFloorTabs(); // Re-render floors to update sensor cards

    const activePopup = this.shadowRoot.querySelector('.popup.active');
    if (!activePopup) return;

    const popupId = activePopup.id;
    const entityDomain = entityId.split('.')[0];
    const roomKeyForEntity = this._getRoomKeyForEntity(entityId);

    if (roomKeyForEntity && popupId === `${roomKeyForEntity}-popup`) {
      switch (entityDomain) {
        case 'light':
          this._lightsManager.update(activePopup, entityId);
          break;
        case 'cover':
          this._coversManager.update(activePopup, entityId);
          break;
        case 'media_player':
          this._mediaPlayerManager.update(entityId);
          break;
        case 'sensor':
        case 'binary_sensor':
          this._thermostatManager.update(activePopup, roomKeyForEntity);
          break;
      }
    } else if (popupId === 'weather-popup' && (entityDomain === 'weather' || entityId.includes('pollen'))) {
      this._weatherManager.update();
    } else if (popupId === 'security-popup' && (entityDomain === 'binary_sensor' || entityDomain === 'alarm_control_panel')) {
      this._securityManager.update();
    }
  }

  initializeCard() {
    this._adminManager.initializeAdminEventListeners();
  }
  
  _generateMusicPopupContent(popup) {
    const tabContainer = popup.querySelector('#music-room-tabs');
    const contentContainer = popup.querySelector('#music-tab-content');
    if (!tabContainer || !contentContainer) return;

    const roomsWithPlayers = Object.entries(this._houseConfig.rooms || {})
        .filter(([, roomConfig]) => roomConfig.media_players?.length > 0);

    if (roomsWithPlayers.length === 0) {
        contentContainer.innerHTML = '<div class="placeholder">No media players configured in any room.</div>';
        return;
    }

    tabContainer.innerHTML = roomsWithPlayers.map(([key, config], index) => 
        `<button class="music-tab-button ${index === 0 ? 'active' : ''}" data-room-id="${key}">${config.friendly_name}</button>`
    ).join('');

    contentContainer.innerHTML = roomsWithPlayers.map(([key, config], index) => 
        `<div class="music-room-content ${index === 0 ? 'active' : ''}" data-room-id="${key}">
             <div class="media-player-card">
                <div class="media-player-container"></div>
             </div>
        </div>`
    ).join('');
    
    // Now initialize the content for each room
    contentContainer.querySelectorAll('.music-room-content').forEach(roomContent => {
        const roomId = roomContent.dataset.roomId;
        const roomConfig = this._houseConfig.rooms[roomId];
        if(roomConfig && this._mediaPlayerManager) {
            this._mediaPlayerManager.initialize(roomContent, roomId, roomConfig.media_players);
        }
    });

    this._setupMusicTabSwitching(popup);
  }

  _setupMusicTabSwitching(popup) {
    const tabButtons = popup.querySelectorAll('.music-tab-button');
    const contentAreas = popup.querySelectorAll('.music-room-content');
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            const roomId = button.dataset.roomId;
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            contentAreas.forEach(area => {
                area.classList.toggle('active', area.dataset.roomId === roomId);
            });
        });
    });
  }

  _getCurrentWeatherEntityId() {
    return this._weatherEntityId || 'weather.forecast_home';
  }

  getPopupIconForType(popupType) {
    if (this._houseConfig?.rooms?.[popupType]) {
        return this._processIconName(this._houseConfig.rooms[popupType].icon);
    }
    const iconMap = {
        'security': 'mdi-security', 'weather': 'mdi-weather-partly-cloudy',
        'music': 'mdi-music', 'admin': 'mdi-cog', 'calendar': 'mdi-calendar',
        'settings': 'mdi-cog', 'bahn': 'mdi-train'
    };
    return iconMap[popupType] || 'mdi-help-circle';
  }

  getPopupTitleForType(popupType) {
    if (this._houseConfig?.rooms?.[popupType]) {
        return this._houseConfig.rooms[popupType].friendly_name;
    }
    const titleMap = {
        'security': 'Sicherheit', 'weather': 'Wetter', 'music': 'Medien',
        'admin': 'Admin View', 'calendar': 'Kalender', 'settings': 'Einstellungen', 'bahn': 'Bahn'
    };
    return titleMap[popupType] || popupType.charAt(0).toUpperCase() + popupType.slice(1);
  }
  
  isNumber(value) { return !isNaN(parseFloat(value)) && isFinite(value); }
  _processIconName(name) { if (!name) return "mdi-help-circle"; let p = name.replace("mdi:", "").replace("mdi-", ""); return p.startsWith("mdi-") || (p = "mdi-" + p), p; }
  _getAllEntitiesByType(type) { const s = new Set; for (const o of Object.values(this._houseConfig?.rooms || {})) o.header_entities?.forEach(e => { e.entity_type === type && s.add(e.entity) }); return Array.from(s); }

  async _loadTemplates(container) {
    const placeholders = container.querySelectorAll('[data-template]');
    const promises = Array.from(placeholders).map(async el => {
      const name = el.dataset.template;
      try {
        const res = await fetch(`/local/dashview/templates/${name}.html`);
        if (res.ok) el.innerHTML = await res.text();
      } catch (err) { console.error(`[DashView] Template error: ${name}`, err); }
    });
    await Promise.all(promises);
  }
}

customElements.define('dashview-panel', DashviewPanel);
