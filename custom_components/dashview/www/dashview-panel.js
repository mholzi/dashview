// custom_components/dashview/www/dashview-panel.js

// --- Module Imports ---
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

    // --- Data & State Managers ---
    this._configManager = new ConfigManager();
    // StateManager is initialized in loadContent after config is loaded.
    this._stateManager = null; 
    
    // --- UI Managers (Initialized in loadContent) ---
    this._adminManager = null;
    this._headerManager = null;
    this._popupManager = null;
    this._infoCardManager = null;
    this._weatherManager = null;
    this._securityManager = null;
    this._coversManager = null;
    this._lightsManager = null;
    this._thermostatManager = null;
    this._mediaPlayerManager = null;

    // --- Panel State Properties ---
    this._hass = null;
    this._contentReady = false;
    this._houseConfig = {};
    this._integrationsConfig = {};
    this._weatherEntityId = 'weather.forecast_home'; // Default value

    // --- Restored Entity Labels (Required by AdminManager) ---
    this._entityLabels = {
      MOTION: 'motion',
      WINDOW: 'fenster', 
      SMOKE: 'rauchmelder',
      VIBRATION: 'vibration',
      TEMPERATUR: 'temperatur',
      HUMIDITY: 'humidity',
      PRINTER: 'printer',
      DOOR: 'door',
      HOOVER: 'hoover',
      DISHWASHER: 'dishwasher',
      DRYER: 'dryer',
      CARTRIDGE: 'cartridge',
      LIGHT: 'light',
      SLIDING_DOOR: 'sliding_door',
      FREEZER: 'freezer'
    };

  /**
   * Main entry point when the panel is connected to the DOM.
   */
  connectedCallback() {
    this.loadContent();
  }

  /**
   * Receives the Home Assistant object and propagates it to all managers.
   */
  set hass(hass) {
    this._hass = hass;
    if (this._contentReady) {
      // Propagate the hass object to all managers that need it for updates.
      [
        this._stateManager, this._headerManager, this._popupManager, 
        this._infoCardManager, this._weatherManager, this._securityManager, 
        this._coversManager, this._lightsManager, this._thermostatManager, 
        this._mediaPlayerManager, this._adminManager
      ].forEach(manager => {
          if (manager && typeof manager.setHass === 'function') {
            manager.setHass(hass);
          }
      });
      // The StateManager drives all subsequent updates.
      this._stateManager.handleHassUpdate();
    }
  }

  /**
   * Loads all initial assets, configurations, and initializes all manager classes.
   */
  async loadContent() {
    try {
      this._injectCSSVariables(this.shadowRoot);

      const [styleText, htmlText] = await Promise.all([
        fetch('/local/dashview/style.css').then(res => res.text()),
        fetch('/local/dashview/index.html').then(res => res.text())
      ]);
      this.shadowRoot.innerHTML = `<style>${styleText}</style>${htmlText}`;
      
      await this._loadTemplates(this.shadowRoot);
      
      // Load all configurations first
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
      
      // Initialize event listeners
      this._popupManager.initializeEventListeners();
      this._adminManager.initializeAdminEventListeners();
      
      this._contentReady = true;

      // Trigger the first `hass` set to initialize all components with data
      if (this._hass) {
        this.hass = this._hass;
      }
      
    } catch (error) {
      this.shadowRoot.innerHTML = `<div class="placeholder error">Error loading DashView panel: ${error.message}</div>`;
      console.error('[DashView] Critical Error during loadContent:', error);
    }
  }

  /**
   * Central router for all entity updates, called by the StateManager.
   * Delegates update tasks to the appropriate UI manager.
   * @param {string} entityId The ID of the entity that changed.
   */
  updateComponentForEntity(entityId) {
    if (!this._contentReady) return;

    // Delegate updates to the relevant manager
    this._headerManager.updateAll(); // Header can be affected by many entities
    this._infoCardManager.update();   // Info card also depends on multiple entities
    
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

  // ====================================================================
  // PUBLIC HELPER METHODS (used by various managers)
  // ====================================================================

  _getCurrentWeatherEntityId() {
    return this._weatherEntityId;
  }

  _isEntityOfType(entityId, entityType) {
    return Object.values(this._houseConfig?.rooms || {}).some(r => 
        r.header_entities?.some(e => e.entity === entityId && e.entity_type === entityType)
    );
  }

  _getAllEntitiesByType(entityType) {
    const entities = new Set();
    for (const room of Object.values(this._houseConfig?.rooms || {})) {
      if (entityType === 'light' || entityType === 'cover') {
        room[entityType + 's']?.forEach(e => entities.add(e));
      } else {
        room.header_entities?.forEach(e => {
          if (e.entity_type === entityType) entities.add(e.entity);
        });
      }
    }
    return Array.from(entities);
  }

  _processIconName(iconName) {
    if (!iconName) return "mdi-help-circle";
    let processedIcon = iconName.replace("mdi:", "").replace("mdi-", "");
    if (!processedIcon.startsWith("mdi-")) {
      processedIcon = "mdi-" + processedIcon;
    }
    return processedIcon;
  }

  async _loadTemplates(container) {
    const placeholders = container.querySelectorAll('[data-template]');
    const templatePromises = Array.from(placeholders).map(async (el) => {
      const templateName = el.dataset.template;
      try {
        const response = await fetch(`/local/dashview/templates/${templateName}.html`);
        if (response.ok) {
          el.innerHTML = await response.text();
        }
      } catch (err) {
        console.error(`[DashView] Error loading template: ${templateName}`, err);
      }
    });
    await Promise.all(templatePromises);
  }

  _injectCSSVariables(shadow) {
    const cssVariables = document.createElement('style');
    // For brevity, the full CSS content is omitted, but it would be here.
    // It's better to load this from style.css as we are already doing.
    cssVariables.textContent = `:host {}`; // Minimal content
    shadow.appendChild(cssVariables);
  }
}

customElements.define('dashview-panel', DashviewPanel);
