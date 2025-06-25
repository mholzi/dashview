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

class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // --- Panel State Properties ---
    this._hass = null;
    this._contentReady = false;
    this._houseConfig = {};
    this._integrationsConfig = {};
    this._weatherEntityId = 'weather.forecast_home'; // Default

    // --- Data & UI Managers (Initialized in loadContent) ---
    this._stateManager = this._configManager = this._adminManager = this._floorManager = null;
    this._headerManager = this._popupManager = this._infoCardManager = this._weatherManager = null;
    this._securityManager = this._coversManager = this._lightsManager = null;
    this._thermostatManager = this._mediaPlayerManager = null;

    // --- Restored Entity Labels & Component Initializers ---
    this._entityLabels = {
      MOTION: 'motion', WINDOW: 'fenster', SMOKE: 'rauchmelder', VIBRATION: 'vibration',
      TEMPERATUR: 'temperatur', HUMIDITY: 'humidity', PRINTER: 'printer', DOOR: 'door',
      HOOVER: 'hoover', DISHWASHER: 'dishwasher', DRYER: 'dryer', CARTRIDGE: 'cartridge',
      LIGHT: 'light', SLIDING_DOOR: 'sliding_door', FREEZER: 'freezer'
    };

    // Component Initializer Registry - Passed to PopupManager
    this._componentInitializers = {
      '.weather-forecast-card': (el) => this._weatherManager?.update(),
      '.pollen-card': (el) => this._weatherManager?.updatePollenCard(el.closest('.popup')),
      '.covers-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.covers?.length > 0) {
          this._coversManager?.initialize(popup, roomConfig.covers);
        }
      },
      '.lights-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.lights?.length > 0) {
          this._lightsManager?.initialize(popup, roomConfig.lights);
        }
      },
      '.thermostat-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        this._thermostatManager?.update(popup, roomKey);
      },
      '.media-player-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.media_players?.length > 0) {
            this._mediaPlayerManager?.initialize(popup, roomKey, roomConfig.media_players);
        }
      },
      '#security-header-chips': (el) => this._securityManager?.initializeChips(el.closest('.popup')),
    };
  }
  
  connectedCallback() {
    this.loadContent();
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._contentReady) return;

    // Propagate the hass object to all managers.
    Object.values(this).forEach(prop => {
      if (prop && typeof prop.setHass === 'function') {
        prop.setHass(hass);
      }
    });

    // Let the StateManager drive all subsequent updates.
    this._stateManager.handleHassUpdate();
  }

  async loadContent() {
    try {
      this._injectCSSVariables();
      const [styleText, htmlText] = await Promise.all([
        fetch('/local/dashview/style.css').then(res => res.text()),
        fetch('/local/dashview/index.html').then(res => res.text())
      ]);
      this.shadowRoot.innerHTML = `<style>${styleText}</style>${htmlText}`;
      
      await this._loadTemplates();
      
      this._configManager = new ConfigManager();
      this._configManager.setHass(this._hass);
      const configs = await this._configManager.loadAll();
      this._houseConfig = configs.houseConfig;
      this._integrationsConfig = configs.integrationsConfig;
      this._weatherEntityId = configs.weatherEntityId;
      
      // Initialize all managers
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
      
      // Setup event listeners and initial UI state
      this._popupManager.initializeEventListeners();
      this._adminManager.initializeAdminEventListeners();
      this._floorManager.initializeFloorTabs();
      
      this._stateManager.setConfig(this._houseConfig, this._integrationsConfig);
      
      this._contentReady = true;
      if (this._hass) {
        this.hass = this._hass;
      }
      
    } catch (error) {
      this.shadowRoot.innerHTML = `<div class="placeholder error">Error loading DashView: ${error.message}</div>`;
      console.error('[DashView] Critical Error during loadContent:', error);
    }
  }

  updateComponentForEntity(entityId, entityState) {
    if (!this._contentReady) return;

    this._headerManager.updateAll();
    this._infoCardManager.update();
    this._floorManager.renderFloorLayout(this._getActiveFloor());

    const activePopup = this.shadowRoot.querySelector('.popup.active');
    if (activePopup) {
        const popupId = activePopup.id;
        if (popupId === 'weather-popup') this._weatherManager.update();
        if (popupId === 'security-popup') this._securityManager.update();

        const roomKey = popupId.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig) {
            if (roomConfig.covers?.includes(entityId)) this._coversManager.update(activePopup, entityId);
            if (roomConfig.lights?.includes(entityId)) this._lightsManager.update(activePopup, entityId);
            if (entityId.startsWith('media_player.')) this._mediaPlayerManager.update(entityId);
            
            const tempSensor = roomConfig.header_entities?.find(e => e.entity_type === 'temperatur')?.entity;
            const humSensor = roomConfig.header_entities?.find(e => e.entity_type === 'humidity')?.entity;
            if (entityId === tempSensor || entityId === humSensor) this._thermostatManager.update(activePopup, roomKey);
        }
    }
  }

  // --- PUBLIC HELPER METHODS ---
  _getActiveFloor() {
      const activeButton = this.shadowRoot.querySelector('.floor-tab-button.active');
      return activeButton ? activeButton.dataset.targetFloor : null;
  }
  _getCurrentWeatherEntityId() { return this._weatherEntityId; }
  _isEntityOfType(id, type) { return Object.values(this._houseConfig?.rooms || {}).some(r => r.header_entities?.some(e => e.entity === id && e.entity_type === type)); }
  _getAllEntitiesByType(type) {const s=new Set;for(const o of Object.values(this._houseConfig?.rooms||{}))o.header_entities?.forEach(e=>{e.entity_type===type&&s.add(e.entity)});return Array.from(s)}
  _processIconName(name){if(!name)return"mdi-help-circle";let p=name.replace("mdi:","").replace("mdi-","");return p.startsWith("mdi-")||(p="mdi-"+p),p}
  _incrementUsageCount(id) { /* Future logic for usage stats */ }
  
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

  _injectCSSVariables() {
    // This is no longer necessary as we load style.css directly,
    // which contains the :root variables that penetrate the Shadow DOM.
  }
}

customElements.define('dashview-panel', DashviewPanel);
