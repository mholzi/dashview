// custom_components/dashview/www/dashview-panel.js

import { StateManager } from './lib/state-manager.js';
import { ConfigManager } from './lib/config-manager.js';
import { AdminManager } from './lib/ui/AdminManager.js';
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

    this._hass = null;
    this._contentReady = false;
    this._houseConfig = {};
    this._integrationsConfig = {};
    this._weatherEntityId = 'weather.forecast_home';

    // Initialize all managers to null. They will be created in loadContent.
    this._stateManager = this._configManager = this._adminManager = this._headerManager = null;
    this._popupManager = this._infoCardManager = this._weatherManager = this._securityManager = null;
    this._coversManager = this._lightsManager = this._thermostatManager = this._mediaPlayerManager = null;

    this._entityLabels = {
      MOTION: 'motion', WINDOW: 'fenster', SMOKE: 'rauchmelder', VIBRATION: 'vibration',
      TEMPERATUR: 'temperatur', HUMIDITY: 'humidity', PRINTER: 'printer', DOOR: 'door',
      HOOVER: 'hoover', DISHWASHER: 'dishwasher', DRYER: 'dryer', CARTRIDGE: 'cartridge',
      LIGHT: 'light', SLIDING_DOOR: 'sliding_door', FREEZER: 'freezer'
    };
  }

  connectedCallback() {
    this.loadContent();
  }

  set hass(hass) {
    if (!this._contentReady) {
      // If content isn't ready, just store the hass object.
      // loadContent will handle the first update.
      this._hass = hass;
      return;
    }
    
    // Once ready, propagate the hass object to all managers.
    [
      this._stateManager, this._configManager, this._adminManager, this._headerManager, 
      this._popupManager, this._infoCardManager, this._weatherManager, 
      this._securityManager, this._coversManager, this._lightsManager, 
      this._thermostatManager, this._mediaPlayerManager
    ].forEach(manager => {
        if (manager && typeof manager.setHass === 'function') {
          manager.setHass(hass);
        }
    });

    // Let the StateManager determine what needs to be updated.
    this._stateManager.handleHassUpdate();
  }

  async loadContent() {
    try {
      this._injectCSSVariables(this.shadowRoot);
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
      
      // Initialize all managers now that config is available
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
      
      this._popupManager.initializeEventListeners();
      this._adminManager.initializeAdminEventListeners();
      
      // Tell StateManager to find and watch all entities from our config
      this._stateManager.setConfig(this._houseConfig, this._integrationsConfig);
      
      this._contentReady = true;
      if (this._hass) {
        this.hass = this._hass; // Trigger the first full update.
      }
      
    } catch (error) {
      this.shadowRoot.innerHTML = `<div class="placeholder error">Error loading DashView panel: ${error.message}</div>`;
      console.error('[DashView] Critical Error during loadContent:', error);
    }
  }

  /**
   * Central router for all entity updates, called by the StateManager's callbacks.
   */
  updateComponentForEntity(entityId) {
    if (!this._contentReady) return;

    // Always update the header and info card, as they depend on many states.
    this._headerManager.updateAll();
    this._infoCardManager.update();
    
    // Update popups only if they are active.
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

  // --- Helper Methods ---
  _getCurrentWeatherEntityId() { return this._weatherEntityId; }
  _isEntityOfType(entityId, type) { return Object.values(this._houseConfig?.rooms || {}).some(r => r.header_entities?.some(e => e.entity === entityId && e.entity_type === type)); }
  _getAllEntitiesByType(type) { const s=new Set;for(const o of Object.values(this._houseConfig?.rooms||{}))o.header_entities?.forEach(e=>{e.entity_type===type&&s.add(e.entity)});return Array.from(s)}
  _processIconName(iconName){if(!iconName)return"mdi-help-circle";let e=iconName.replace("mdi:","").replace("mdi-","");return e.startsWith("mdi-")||(e="mdi-"+e),e}
  
  async _loadTemplates(container) {
    const placeholders = container.querySelectorAll('[data-template]');
    const templatePromises = Array.from(placeholders).map(async (el) => {
      const templateName = el.dataset.template;
      try {
        const response = await fetch(`/local/dashview/templates/${templateName}.html`);
        if (response.ok) el.innerHTML = await response.text();
      } catch (err) { console.error(`[DashView] Error loading template: ${templateName}`, err); }
    });
    await Promise.all(templatePromises);
  }

  _injectCSSVariables(shadow) {
    const cssVariables = document.createElement('style');
    cssVariables.textContent = `:host {}`; // Minimal content, main styles are in style.css
    shadow.appendChild(cssVariables);
  }
}

customElements.define('dashview-panel', DashviewPanel);
