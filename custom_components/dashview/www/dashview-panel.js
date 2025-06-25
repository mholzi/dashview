// custom_components/dashview/www/dashview-panel.js

import { StateManager } from './lib/state-manager.js';
import { ConfigManager } from './lib/config-manager.js';
import { HeaderManager } from './lib/ui/header-manager.js';
import { PopupManager } from './lib/ui/popup-manager.js';
import { InfoCardManager } from './lib/ui/info-card-manager.js';
import { WeatherComponents } from './lib/ui/weather-components.js';
import { SecurityComponents } from './lib/ui/security-components.js';
import { CoversCard } from './lib/ui/covers-card.js';
import { LightsCard } from './lib/ui/lights-card.js';
import { ThermostatCard } from './lib/ui/thermostat-card.js';
import { MediaPlayerCard } from './lib/ui/media-player-card.js';

class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // --- Data Managers ---
    this._stateManager = new StateManager(this);
    this._configManager = new ConfigManager();
    
    // --- UI Managers (Initialized in loadContent) ---
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
    this._weatherEntityId = 'weather.forecast_home';

    // This set is used by the update router to delegate tasks.
    this._infoCardEntities = new Set([
        'binary_sensor.motion_presence_home','sensor.geschirrspuler_operation_state',
        'sensor.geschirrspuler_remaining_program_time','sensor.waschmaschine_operation_state',
        'sensor.waschmaschine_remaining_program_time','vacuum.mova_e30_ultra',
        'input_boolean.trockner_an','sensor.foxess_solar','sensor.foxess_bat_soc',
        'lock.door_aqara_smart_lock_u200_lock','binary_sensor.haustur_contact_sensor'
    ]);
  }

  set hass(hass) {
    this._hass = hass;
    // Propagate the hass object to all managers that need it.
    [
      this._configManager, this._stateManager, this._headerManager, 
      this._popupManager, this._infoCardManager, this._weatherManager, 
      this._securityManager, this._coversManager, this._lightsManager, 
      this._thermostatManager, this._mediaPlayerManager
    ].forEach(manager => {
        if (manager) manager.setHass(hass);
    });
  }

  connectedCallback() {
    this.loadContent();
  }

  async loadContent() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    try {
      this._injectCSSVariables(shadow);
      const [styleText, htmlText] = await Promise.all([
        fetch('/local/dashview/style.css').then(res => res.text()),
        fetch('/local/dashview/index.html').then(res => res.text())
      ]);
      shadow.innerHTML = `<style>${styleText}</style>${htmlText}`;
      
      await this.loadTemplates(shadow);
      
      const configs = await this._configManager.loadAll();
      this._houseConfig = configs.houseConfig;
      this._integrationsConfig = configs.integrationsConfig;
      this._weatherEntityId = configs.weatherEntityId;
      
      // Initialize all UI managers
      this._headerManager = new HeaderManager(this);
      this._popupManager = new PopupManager(this);
      this._infoCardManager = new InfoCardManager(this);
      this._weatherManager = new WeatherComponents(this);
      this._securityManager = new SecurityComponents(this);
      this._coversManager = new CoversCard(this);
      this._lightsManager = new LightsCard(this);
      this._thermostatManager = new ThermostatCard(this);
      this._mediaPlayerManager = new MediaPlayerCard(this);
      
      this._stateManager.setConfig(this._houseConfig, this._integrationsConfig);
      
      // Perform initial UI setup
      this._headerManager.updateAll();
      this._popupManager.handleHashChange();
      this._infoCardManager.update();
      // Any remaining direct initialization calls can stay for now
      this.initializeCard(shadow);

      this._contentReady = true;
    } catch (error) {
      shadow.innerHTML = `<div style="color: red; padding: 16px;">Error loading DashView panel: ${error.message}</div>`;
      console.error('[DashView] Critical Error:', error);
    }
  }

  // This is now the central router for all entity updates.
  _updateComponentForEntity(entityId) {
    if (!this._contentReady) return;
    this._incrementUsageCount(entityId);
    
    // Delegate to Header and InfoCard managers on their relevant entity changes
    if (this._infoCardEntities.has(entityId) || this._isEntityOfType(entityId, 'window')) {
        this._infoCardManager.update();
    }
    this._headerManager.updateAll();
    
    const activePopup = this.shadowRoot.querySelector('.popup.active');
    if(activePopup) {
        const popupId = activePopup.id;
        if(popupId === 'weather-popup') this._weatherManager.update();
        if(popupId === 'security-popup') this._securityManager.update();

        const roomKey = popupId.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if(!roomConfig) return;

        if(roomConfig.covers?.includes(entityId)) this._coversManager.update(activePopup, entityId);
        if(roomConfig.lights?.includes(entityId)) this._lightsManager.update(activePopup, entityId);
        if(entityId.startsWith('media_player.')) this._mediaPlayerManager.update(entityId);
        
        const tempSensor = roomConfig.header_entities?.find(e => e.entity_type === 'temperatur')?.entity;
        const humSensor = roomConfig.header_entities?.find(e => e.entity_type === 'humidity')?.entity;
        if(entityId === tempSensor || entityId === humSensor) this._thermostatManager.update(activePopup, roomKey);
    }
  }

  initializeCard(context) {
    // This listener now only handles clicks that aren't managed by another class.
    context.addEventListener('click', (e) => {
        const target = e.target.closest('[data-hash]');
        if (target) {
            e.preventDefault();
            window.location.hash = target.getAttribute('data-hash');
        }
    });
  }

  // --- PUBLIC HELPERS FOR MANAGERS ---
  // Methods that are needed by multiple manager classes can stay here.
  _getCurrentWeatherEntityId() { return this._weatherEntityId; }
  _isEntityOfType(entityId, type) { return Object.values(this._houseConfig?.rooms || {}).some(r => r.header_entities?.some(e => e.entity === entityId && e.entity_type === type)); }
  _getAllEntitiesByType(type) {const s=new Set;for(const o of Object.values(this._houseConfig?.rooms||{}))o.header_entities?.forEach(e=>{e.entity_type===type&&s.add(e.entity)});return Array.from(s)}
  _processIconName(iconName){if(!iconName)return"mdi-help-circle";let e=iconName.replace("mdi:","").replace("mdi-","");return e.startsWith("mdi-")||(e="mdi-"+e),e}
  isNumber(value) { return !isNaN(parseFloat(value)) && isFinite(value); }
  _incrementUsageCount(entityId) { /* ... logic ... */ }
  async loadTemplates(container) { /* ... logic ... */ }
  _injectCSSVariables(shadow) { /* ... logic ... */ }
}

customElements.define('dashview-panel', DashviewPanel);
