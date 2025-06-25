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

    this._hass = null;
    this._contentReady = false;
    this._houseConfig = {};
    this._integrationsConfig = {};
    this._weatherEntityId = 'weather.forecast_home';

    // Entity labels remain as they are fundamental to the component's logic
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
        this._hass = hass;
        return;
    }
    
    // Only update if the hass object is new
    if (this._hass !== hass) {
        this._hass = hass;
        // Propagate the hass object to all managers that need it
        if (this._stateManager) this._stateManager.setHass(hass);
        if (this._infoCardManager) this._infoCardManager.setHass(hass);
        if (this._weatherManager) this._weatherManager.setHass(hass);
        // ... and so on for any other manager that needs live state updates
        
        // Let the StateManager drive all subsequent updates.
        this._stateManager.handleHassUpdate();
    }
  }

  async loadContent() {
    try {
        // --- 1. Load Core Assets (CSS & HTML) ---
        const [styleText, htmlText] = await Promise.all([
            fetch('/local/dashview/style.css').then(res => res.text()),
            fetch('/local/dashview/index.html').then(res => res.text())
        ]);
        this.shadowRoot.innerHTML = `<style>${styleText}</style>${htmlText}`;
        
        // --- 2. Load HTML Templates ---
        // This ensures all placeholder divs are ready before JS tries to access them.
        await this._loadTemplates(this.shadowRoot);

        // --- 3. Initialize Configuration ---
        // The ConfigManager needs hass to make API calls.
        this._configManager = new ConfigManager();
        this._configManager.setHass(this._hass);
        const configs = await this._configManager.loadAll();
        this._houseConfig = configs.houseConfig;
        this._integrationsConfig = configs.integrationsConfig;
        this._weatherEntityId = configs.weatherEntityId;

        // --- 4. Instantiate All UI & Data Managers ---
        // Now that config is loaded and the DOM is ready, we can safely create these.
        this.initializeManagers();
        
        // --- 5. Initialize Core UI Interactivity ---
        // This restores the essential event listeners for popups and navigation.
        this.initializeCard();
        this._floorManager.initializeFloorTabs();
        
        // --- 6. Set Content Ready Flag & Finalize ---
        this._contentReady = true;
        // If hass was already set while we were loading, trigger the first update.
        if (this._hass) {
            this.hass = this._hass; 
        }

    } catch (error) {
        this.shadowRoot.innerHTML = `<div class="placeholder error">Error loading DashView: ${error.message}</div>`;
        console.error('[DashView] Critical Error during loadContent:', error);
    }
  }

  /**
   * Instantiates all manager classes and passes them the main panel reference.
   */
  initializeManagers() {
    // Pass `this` (the panel instance) to all managers so they can access
    // shared resources like _hass, _shadowRoot, and config.
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

    // Pass the initial configuration to the state manager
    this._stateManager.setConfig(this._houseConfig, this._integrationsConfig);
  }

  /**
   * Main callback for the StateManager. This is the central point for all UI updates.
   */
  updateComponentForEntity(entityId, entityState) {
    if (!this._contentReady) return;

    // Delegate updates to the appropriate managers
    this._headerManager.updateAll();
    this._infoCardManager.update();
    
    const activePopup = this._shadowRoot.querySelector('.popup.active');
    if (activePopup) { // This check is the fix
        this._popupManager.updatePopupContent(activePopup, entityId);
    }
  }

  /**
   * Restored from the original working code. Sets up global event listeners for navigation.
   */
  initializeCard() {
    this._popupManager.initializeEventListeners();
    this._adminManager.initializeAdminEventListeners();
  }

  // --- Helper Methods ---
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
