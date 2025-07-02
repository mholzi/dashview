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
import { AutoSceneGenerator } from './lib/ui/AutoSceneGenerator.js';
import { CalendarManager } from './lib/ui/CalendarManager.js';
import { EntityDetailManager } from './lib/ui/EntityDetailManager.js';
import { HistoricalDataManager } from './lib/ui/HistoricalDataManager.js';
import { UpcomingEventsManager } from './lib/ui/UpcomingEventsManager.js';
import { RefreshManager } from './lib/utils/RefreshManager.js';
import { calculateTimeDifferenceEnglish } from './lib/utils/time-utils.js';

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
        LIGHT: 'light', SLIDING_DOOR: 'sliding_door', FREEZER: 'freezer', TV: 'tv', MUSIC: 'music', MOWER: 'mower', COVER: 'cover'
    };

    this._componentInitializers = {
      '.media-container': (el) => {
          const popup = el.closest('.popup');
          if (popup && popup.id === 'music-popup') {
              this._generateMusicPopupContent(popup);
          }
      },
      '.room-scenes-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig) {
          const container = el.querySelector('.room-scenes-container');
          if (container && this._sceneManager) {
            this._sceneManager.renderRoomSceneButtons(container, roomKey, roomConfig);
          }
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
      },
      '.other-entities-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.header_entities?.some(e => ['hoover', 'mower', 'other_door'].includes(e.entity_type))) {
          this._initializeOtherEntitiesCard(popup, roomKey, roomConfig);
        }
      },
      '.calendar-content': (el) => {
        const popup = el.closest('.popup');
        if (popup && popup.id === 'calendar-popup') {
          this._calendarManager.update(popup);
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

    this._hass = hass;
    if (this._stateManager) this._stateManager.setHass(hass);
    if (this._headerManager) this._headerManager.setHass(hass);
    if (this._infoCardManager) this._infoCardManager.setHass(hass);
    if (this._weatherManager) this._weatherManager.setHass(hass);
    if (this._sceneManager) this._sceneManager.setHass(hass);
    if (this._floorManager) this._floorManager.setHass(hass);
    if (this._popupManager) this._popupManager.setHass(hass);
    if (this._mediaPlayerManager) this._mediaPlayerManager.setHass(hass);
    if (this._securityManager) this._securityManager.setHass(hass);
    if (this._coversManager) this._coversManager.setHass(hass);
    if (this._lightsManager) this._lightsManager.setHass(hass);
    if (this._thermostatManager) this._thermostatManager.setHass(hass);
    if (this._autoSceneGenerator) this._autoSceneGenerator.setHass(hass);
    if (this._calendarManager) this._calendarManager.setHass(hass);
    if (this._entityDetailManager) this._entityDetailManager.setHass(hass);
    if (this._historicalDataManager) this._historicalDataManager.setHass(hass);
    if (this._upcomingEventsManager) this._upcomingEventsManager.setHass(hass);
    if (this._refreshManager) this._refreshManager.setHass(hass);

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
        this._sectionsConfig = configs.sectionsConfig;

        // Apply section visibility settings
        this._applySectionVisibility();

        this.initializeManagers();
        
        // Generate and merge auto-scenes after managers are initialized
        await this._generateAndMergeAutoScenes();
        
        this._sceneManager.renderSceneButtons();
        this._floorManager.initializeFloorTabs();
        this._floorManager.renderCustomCardsMain();

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
    this._autoSceneGenerator = new AutoSceneGenerator(this);
    this._calendarManager = new CalendarManager(this);
    this._entityDetailManager = new EntityDetailManager(this);
    this._historicalDataManager = new HistoricalDataManager(this);
    this._upcomingEventsManager = new UpcomingEventsManager(this);
    this._refreshManager = new RefreshManager(this);

    this._stateManager.setConfig(this._houseConfig, this._integrationsConfig);
    this._setupRefreshCallbacks();
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

  /**
   * Setup refresh callbacks for different components
   */
  _setupRefreshCallbacks() {
    if (!this._refreshManager) return;

    // Main dashboard refresh
    this._refreshManager.registerRefreshCallback('main', async () => {
      console.log('[DashView] Refreshing main dashboard...');
      this._headerManager.updateAll();
      this._infoCardManager.update();
      this._sceneManager.renderSceneButtons();
      this._floorManager.update();
    });

    // Weather popup refresh
    this._refreshManager.registerRefreshCallback('weather', async () => {
      console.log('[DashView] Refreshing weather data...');
      if (this._weatherManager) {
        await this._weatherManager.update();
      }
    });

    // Security popup refresh
    this._refreshManager.registerRefreshCallback('security', async () => {
      console.log('[DashView] Refreshing security data...');
      if (this._securityManager) {
        await this._securityManager.update();
      }
    });

    // Calendar popup refresh
    this._refreshManager.registerRefreshCallback('calendar', async () => {
      console.log('[DashView] Refreshing calendar data...');
      const activePopup = this.shadowRoot.querySelector('#calendar-popup.active');
      if (this._calendarManager && activePopup) {
        await this._calendarManager.update(activePopup);
      }
    });

    // Room popup refresh
    if (this._houseConfig?.rooms) {
      Object.keys(this._houseConfig.rooms).forEach(roomKey => {
        this._refreshManager.registerRefreshCallback(`room-${roomKey}`, async () => {
          console.log(`[DashView] Refreshing room data for: ${roomKey}`);
          const popup = this.shadowRoot.querySelector(`#${roomKey}-popup.active`);
          if (popup && this._popupManager) {
            this._popupManager._refreshRoomEntities(roomKey, popup);
          }
        });
      });
    }

    console.log('[DashView] Refresh callbacks registered');
  }

  updateComponentForEntity(entityId, entityState) {
    if (!this._contentReady) return;

    this._headerManager.updateAll();
    this._infoCardManager.update();
    this._sceneManager.renderSceneButtons();
    this._floorManager.update();

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
          // Also check if this is an "other entity" (hoover, mower, door)
          if (this._isOtherEntity(entityId, roomKeyForEntity)) {
            this._updateOtherEntitiesCard(activePopup, roomKeyForEntity);
          }
          break;
        case 'vacuum':
        case 'lawn_mower':
          // Handle other entity types
          if (this._isOtherEntity(entityId, roomKeyForEntity)) {
            this._updateOtherEntitiesCard(activePopup, roomKeyForEntity);
          }
          break;
      }
    } else if (popupId === 'weather-popup' && (entityDomain === 'weather' || entityId.includes('pollen'))) {
      this._weatherManager.update();
    } else if (popupId === 'security-popup' && (entityDomain === 'binary_sensor' || entityDomain === 'alarm_control_panel')) {
      this._securityManager.update();
    } else if (popupId === 'calendar-popup' && entityDomain === 'calendar') {
      this._calendarManager.update(activePopup);
    }
  }

  initializeCard() {
    this._adminManager.initializeAdminEventListeners();
    
    // Initialize upcoming events manager after content is loaded
    if (this._upcomingEventsManager) {
      this._upcomingEventsManager.initialize();
    }
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

  _initializeOtherEntitiesCard(popup, roomKey, roomConfig) {
    const otherEntitiesCard = popup.querySelector('.other-entities-card');
    if (!otherEntitiesCard) return;

    // Filter other entities (hoover, mower, other_door)
    const otherEntities = roomConfig.header_entities?.filter(e => 
      ['hoover', 'mower', 'other_door'].includes(e.entity_type)
    ) || [];

    if (otherEntities.length === 0) {
      otherEntitiesCard.style.display = 'none';
      return;
    }

    // Update the count in the header
    const countElement = otherEntitiesCard.querySelector('.other-entities-count');
    if (countElement) {
      countElement.textContent = otherEntities.length;
    }

    // Generate the grid content
    const gridContainer = otherEntitiesCard.querySelector('.other-entities-grid');
    if (!gridContainer) return;

    gridContainer.innerHTML = '';
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(2, 1fr)';
    gridContainer.style.gap = '12px';

    // Create sensor-big cards for each entity
    otherEntities.forEach(entityInfo => {
      const entityId = entityInfo.entity;
      const entityType = entityInfo.entity_type;
      
      // Create sensor-big card element
      const card = document.createElement('div');
      card.className = 'sensor-big-card';
      card.dataset.entityId = entityId;
      card.dataset.type = entityType;

      // Get display data for this entity
      const { name, label, icon, cardClass } = this._floorManager._getCardDisplayData(entityId, entityType);
      
      card.innerHTML = `
        <div class="sensor-big-grid">
          <div class="sensor-big-icon-cell">
            <i class="mdi ${this._processIconName(icon)}"></i>
          </div>
          <div class="sensor-big-name">${name}</div>
          <div class="sensor-big-label">${label}</div>
        </div>
      `;

      // Apply the card class for styling
      if (cardClass) {
        card.className = `sensor-big-card ${cardClass}`;
      }

      gridContainer.appendChild(card);
    });

    console.log(`[DashView] Initialized other entities card for room ${roomKey} with ${otherEntities.length} entities`);
  }

  _isOtherEntity(entityId, roomKey) {
    const roomConfig = this._houseConfig?.rooms?.[roomKey];
    if (!roomConfig?.header_entities) return false;
    
    return roomConfig.header_entities.some(e => 
      e.entity === entityId && ['hoover', 'mower', 'other_door'].includes(e.entity_type)
    );
  }

  _updateOtherEntitiesCard(popup, roomKey) {
    const otherEntitiesCard = popup.querySelector('.other-entities-card');
    if (!otherEntitiesCard) return;

    const roomConfig = this._houseConfig?.rooms?.[roomKey];
    if (!roomConfig) return;

    // Filter other entities
    const otherEntities = roomConfig.header_entities?.filter(e => 
      ['hoover', 'mower', 'other_door'].includes(e.entity_type)
    ) || [];

    // Update all sensor-big cards in the other entities grid
    otherEntities.forEach(entityInfo => {
      const entityId = entityInfo.entity;
      const entityType = entityInfo.entity_type;
      const card = otherEntitiesCard.querySelector(`.sensor-big-card[data-entity-id="${entityId}"]`);
      
      if (card) {
        // Get updated display data
        const { name, label, icon, cardClass } = this._floorManager._getCardDisplayData(entityId, entityType);
        
        // Update card content
        card.className = cardClass ? `sensor-big-card ${cardClass}` : 'sensor-big-card';
        card.querySelector('.sensor-big-name').textContent = name;
        card.querySelector('.sensor-big-label').textContent = label;
        card.querySelector('.sensor-big-icon-cell i').className = `mdi ${this._processIconName(icon)}`;
      }
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

  // START: NEW FUNCTIONS FOR ROOM POPUP HEADER ICONS
  _generateRoomHeaderEntitiesForPopup(roomConfig) {
      if (!roomConfig.header_entities || !Array.isArray(roomConfig.header_entities)) {
          return '';
      }

      const activeEntities = roomConfig.header_entities.filter(entityConfig => {
          const entity = this._hass.states[entityConfig.entity];
          return this._shouldDisplayHeaderEntity(entity, entityConfig.entity_type);
      });

      // Add additional icons for covers and room scenes
      const additionalIcons = [];
      
      // Add cover scene icon if global cover scene is enabled and room has covers
      if (this._autoSceneGenerator && this._autoSceneGenerator._getGlobalCoverSceneEnabled() && 
          roomConfig.covers && roomConfig.covers.length > 0) {
          additionalIcons.push(`
              <div class="header-info-chip" 
                   data-type="cover-scene"
                   style="background: var(--gray100);">
                <div class="chip-icon-container">
                  <i class="mdi mdi-window-shutter" style="color: var(--gray000);"></i>
                </div>
                <div class="chip-name" style="color: var(--gray800);">Rollläden</div>
              </div>
          `);
      }
      
      // Add room scenes icon if room has configured scenes
      const roomScenes = this._sceneManager ? this._sceneManager._getRoomScenes(roomConfig.name, roomConfig) : [];
      if (roomScenes && roomScenes.length > 0) {
          additionalIcons.push(`
              <div class="header-info-chip" 
                   data-type="room-scenes"
                   style="background: var(--gray100);">
                <div class="chip-icon-container">
                  <i class="mdi mdi-lightbulb-group" style="color: var(--gray000);"></i>
                </div>
                <div class="chip-name" style="color: var(--gray800);">Szenen</div>
              </div>
          `);
      }

      if (activeEntities.length === 0 && additionalIcons.length === 0) {
          return '';
      }

      const entityCards = activeEntities.map(entityConfig => {
          const entity = this._hass.states[entityConfig.entity];
          const name = this._getHeaderEntityName(entity, entityConfig.entity_type);
          const icon = this._getHeaderEntityIcon(entity, entityConfig.entity_type);
          const backgroundColor = this._getHeaderEntityBackground(entity, entityConfig.entity_type);
          const textColor = this._getHeaderEntityTextColor(entity, entityConfig.entity_type);

          return `
              <div class="header-info-chip" 
                   data-entity="${entityConfig.entity}" 
                   data-type="${entityConfig.entity_type}"
                   style="background: ${backgroundColor};">
                <div class="chip-icon-container">
                  <i class="mdi ${icon}" style="color: var(--gray000);"></i>
                </div>
                <div class="chip-name" style="color: ${textColor};">${name}</div>
              </div>
          `;
      }).join('');

      const allCards = entityCards + additionalIcons.join('');

      return `
        <div class="room-header-entities">
          <div class="header-entities-container">
            ${allCards}
          </div>
        </div>
      `;
  }

  _shouldDisplayHeaderEntity(entity, entityType) {
      if (!entity) return false;
      const state = entity.state;
      
      switch (entityType) {
          case this._entityLabels.MOTION:
              return true; // Always show motion sensors
          case this._entityLabels.MUSIC:
          case this._entityLabels.TV:
              return state === 'playing';
          case this._entityLabels.DISHWASHER:
          case this._entityLabels.WASHING:
              return ['Run', 'run', 'running'].includes(state);
          case this._entityLabels.FREEZER:
              const doorAlarm = this._hass.states['sensor.gefrierschrank_door_alarm_freezer']?.state;
              const tempAlarm = this._hass.states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
              return (doorAlarm === 'present' || tempAlarm === 'present');
          case this._entityLabels.MOWER:
              const error = entity.attributes?.error;
              // Helper function to check if error value indicates an actual error
              const isValidError = (errorValue) => {
                if (!errorValue) return false;
                if (typeof errorValue !== 'string') return false;
                const errorStr = errorValue.toLowerCase();
                return errorStr !== 'none' && errorStr !== 'no error' && errorStr !== 'ok' && errorStr !== '' && errorStr !== 'off_disabled';
              };
              // Show mower if it has a valid error OR if it's in an active state
              return isValidError(error) || ['cleaning', 'error', 'mowing'].includes(state);
          default:
              return state === 'on';
      }
  }

  _getHeaderEntityName(entity, entityType) {
      if (!entity) return '–';

      switch (entityType) {
          case this._entityLabels.DISHWASHER:
              const remaining = this._hass.states['sensor.geschirrspuler_remaining_program_time'];
              if (!remaining || !remaining.state || ['unknown', 'unavailable'].includes(remaining.state)) {
                  return 'Unknown';
              }
              const end = new Date(remaining.state).getTime();
              const now = new Date().getTime();
              const diffMin = Math.round((end - now) / 60000);
              return diffMin > 0 ? `in ${diffMin}m` : 'Ready';

          case this._entityLabels.MOTION:
              return calculateTimeDifferenceEnglish(entity.last_changed);

          default:
              return entity.attributes?.friendly_name || '–';
      }
  }

  _getHeaderEntityIcon(entity, entityType) {
      const state = entity?.state;
      switch (entityType) {
          case this._entityLabels.MOTION: return state === 'off' ? 'mdi-motion-sensor-off' : 'mdi-motion-sensor';
          case this._entityLabels.WINDOW: return 'mdi-window-open-variant';
          case this._entityLabels.SMOKE: return 'mdi-smoke-detector-variant-alert';
          case this._entityLabels.MUSIC: return 'mdi-music-note';
          case this._entityLabels.TV: return 'mdi-television-play';
          case this._entityLabels.DISHWASHER: return 'mdi-dishwasher';
          case this._entityLabels.MOWER: return 'mdi-robot-mower';
          default: return 'mdi-help-circle-outline';
      }
  }

  _getHeaderEntityBackground(entity, entityType) {
      if (entityType === this._entityLabels.SMOKE) return 'var(--red)';
      if (entityType === this._entityLabels.MOTION) {
          return entity.state === 'off' ? 'var(--gray000)' : 'var(--active-big)';
      }
      return 'var(--active-big)';
  }

  _getHeaderEntityTextColor(entity, entityType) {
      if (entityType === this._entityLabels.MOTION && entity.state === 'off') {
          return 'var(--gray800)';
      }
      return 'var(--gray000)';
  }
  // END: NEW FUNCTIONS
  _getEntityTypeFromConfig(entityId) {
    if (!entityId || !this._houseConfig || !this._houseConfig.rooms) {
      return 'unknown';
    }
    for (const room of Object.values(this._houseConfig.rooms)) {
        const headerEntity = room.header_entities?.find(e => e.entity === entityId);
        if (headerEntity) return headerEntity.entity_type;
        if (room.lights?.includes(entityId)) return 'light';
        if (room.covers?.includes(entityId)) return 'cover';
        if (room.media_players?.some(mp => mp.entity === entityId)) return 'media_player';
    }
    // Fallback for entities not in header_entities
    return entityId.split('.')[0];
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

  async _generateAndMergeAutoScenes() {
    try {
      if (!this._autoSceneGenerator) {
        console.warn('[DashView] AutoSceneGenerator not initialized');
        return;
      }

      // Generate auto-scenes
      const autoScenes = this._autoSceneGenerator.generateAutoScenes(true);
      console.log(`[DashView] Generated ${autoScenes.length} auto-scenes`);

      // Merge with existing scenes in configuration
      const updatedScenes = this._autoSceneGenerator.mergeWithExistingScenes(autoScenes);
      this._houseConfig.scenes = updatedScenes;

      console.log(`[DashView] Updated configuration with ${updatedScenes.length} total scenes (${autoScenes.length} auto-generated)`);
    } catch (error) {
      console.error('[DashView] Error generating and merging auto-scenes:', error);
    }
  }

  _applySectionVisibility() {
    console.log('[DashView] Applying section visibility and ordering settings', this._sectionsConfig);
    
    // Default sections configuration if not provided
    const defaultSections = {
      "info-card": { "visible": true, "order": 1 },
      "train-departures-section": { "visible": true, "order": 2 },
      "notifications-container": { "visible": true, "order": 3 },
      "dwd-warning-card-container": { "visible": true, "order": 4 },
      "scenes-container": { "visible": true, "order": 5 },
      "media-header-buttons-container": { "visible": true, "order": 6 },
      "floor-tabs-container": { "visible": true, "order": 7 }
    };

    const sectionsConfig = Object.keys(this._sectionsConfig).length > 0 ? this._sectionsConfig : defaultSections;

    // Get dashboard container
    const dashboardContainer = this.shadowRoot.querySelector('.dashboard-container');
    if (!dashboardContainer) {
      console.warn('[DashView] Dashboard container not found');
      return;
    }

    // Collect sections with their order and elements
    const sectionsWithElements = [];
    Object.entries(sectionsConfig).forEach(([sectionId, config]) => {
      const sectionElement = this.shadowRoot.querySelector(`#${sectionId}, .${sectionId}`);
      if (sectionElement) {
        sectionsWithElements.push({
          id: sectionId,
          element: sectionElement,
          config: config,
          order: config.order || 999 // Default high order for sections without explicit order
        });
      } else {
        console.warn(`[DashView] Section element not found: ${sectionId}`);
      }
    });

    // Sort sections by order
    sectionsWithElements.sort((a, b) => a.order - b.order);

    // Apply visibility and reorder sections
    sectionsWithElements.forEach((section, index) => {
      const { element, config } = section;
      
      // Apply visibility
      if (config.visible === false) {
        element.style.display = 'none';
        console.log(`[DashView] Hidden section: ${section.id}`);
      } else {
        element.style.display = '';
        console.log(`[DashView] Showing section: ${section.id} (order: ${section.order})`);
      }

      // Apply ordering by setting CSS order property
      element.style.order = section.order;
    });

    // Set dashboard container to flex to respect order property
    dashboardContainer.style.display = 'flex';
    dashboardContainer.style.flexDirection = 'column';
  }
}

customElements.define('dashview-panel', DashviewPanel);
