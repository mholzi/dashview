class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._contentReady = false;
    this._weatherEntityId = 'weather.forecast_home'; // Add a property to store the entity ID
    this._weatherForecasts = { daily: null, hourly: null };
    this._floorsConfig = {};
    this._roomsConfig = {};
    this._houseConfig = {};
    this._integrationsConfig = {};
    
    // Label constants for case-insensitive entity queries - ensures consistent lowercase usage
    this._entityLabels = {
      MOTION: 'motion',
      WINDOW: 'fenster', 
      SMOKE: 'rauchmelder',
      VIBRATION: 'vibration',
      TEMPERATUR: 'temperatur',
      HUMIDITY: 'humidity'
    };
    
    // Admin UI state management - Principle 12
    this._adminLocalState = {
      floorsConfig: null,
      roomsConfig: null,
      houseConfig: null,
      weatherEntity: null,
      isLoaded: false
    };
    // State management system - Principle 3
    this._entitySubscriptions = new Map();
    this._lastEntityStates = new Map();
    this._watchedEntities = null;
    this._coverEntities = new Set();
    
    // Component Initializer Registry - Systemic popup initialization fix
    this._componentInitializers = {
      '.weather-forecast-card': (el) => this.updateWeatherComponents(el.closest('.popup')),
      '.pollen-card': (el) => this.updatePollenCard(el.closest('.popup')),
      '.covers-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.covers?.length > 0) {
          this._initializeCoversCard(popup, roomKey, roomConfig.covers);
        }
      },
      '.thermostat-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        this.updateThermostatCard(popup, roomKey);
      },
      '.lights-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.lights?.length > 0) {
          this._initializeLightsCard(popup, roomKey, roomConfig.lights);
        }
      },
      '.media-player-card': (el) => {
        const popup = el.closest('.popup');
        const roomKey = popup.id.replace('-popup', '');
        const roomConfig = this._houseConfig?.rooms?.[roomKey];
        if (roomConfig?.media_players?.length > 0) {
          this._initializeMediaPlayerCard(popup, roomKey, roomConfig.media_players);
        }
      },
      // Add this new line for the security popup
      '#open-windows-list': (el) => this.updateSecurityLists(el.closest('.popup')),
      '#security-header-chips .header-info-chip': (el) => this._initializeSecurityChip(el),
      '.media-container': (el) => {
        const popup = el.closest('.popup');
        if (popup && popup.id === 'music-popup') {
          // For the music popup, generate the full content with room tabs
          this._generateMusicPopupContent(popup);
        } else {
          // For other popups, just initialize the media player controls
          this._initializeMediaPlayerControls(popup);
        }
      }
    };
  }

  // When the HASS object is passed to the panel, store it and update content
  set hass(hass) {
    this._hass = hass;
    if (this._contentReady) {
      this._handleHassUpdate();
    }
  }

  // Granular state management - Principle 3
  async _handleHassUpdate() {
    if (!this._hass) return;

    // Ensure initial entity states are loaded (Issue #34 fix)
    await this._ensureInitialEntityStates();

    // Check for entity changes and update only affected components
    this._checkEntityChanges();
  }

  // Ensure initial entity states are properly loaded - Issue #34 fix
  async _ensureInitialEntityStates() {
    if (!this._hass) return;
    
    // Build comprehensive entity list if not already done
    if (!this._watchedEntities) {
      this._watchedEntities = new Set();
      
      // Add existing entities
      const weatherEntityId = this._getCurrentWeatherEntityId();
      this._watchedEntities.add(weatherEntityId);
      this._watchedEntities.add('person.markus');
      this._watchedEntities.add('sensor.frankfurt_m_taunusanlage_departures_via_dreieich_buchschlag');
      this._watchedEntities.add('sensor.dreieich_buchschlag_departures_via_frankfurt_hbf');
      if (this._integrationsConfig?.dwd_sensor) {
           this._watchedEntities.add(this._integrationsConfig.dwd_sensor);
      }      
      // Add info-card entities
      this._watchedEntities.add('binary_sensor.motion_presence_home');
      this._watchedEntities.add('sensor.geschirrspuler_operation_state');
      this._watchedEntities.add('sensor.geschirrspuler_remaining_program_time');
      this._watchedEntities.add('sensor.waschmaschine_operation_state');
      this._watchedEntities.add('sensor.waschmaschine_remaining_program_time');
      this._watchedEntities.add('vacuum.mova_e30_ultra');
      this._watchedEntities.add('input_boolean.trockner_an');
      this._watchedEntities.add('sensor.foxess_solar');
      this._watchedEntities.add('sensor.foxess_bat_soc');
      
      // Add pollen card entities
      this._watchedEntities.add('sensor.pollenflug_birke_92');
      this._watchedEntities.add('sensor.pollenflug_erle_92');
      this._watchedEntities.add('sensor.pollenflug_hasel_92');
      this._watchedEntities.add('sensor.pollenflug_esche_92');
      this._watchedEntities.add('sensor.pollenflug_roggen_92');
      this._watchedEntities.add('sensor.pollenflug_graeser_92');
      this._watchedEntities.add('sensor.pollenflug_beifuss_92');
      this._watchedEntities.add('sensor.pollenflug_ambrosia_92');
      
      // Add room header entities from house configuration (includes window/motion sensors)
      await this._addRoomHeaderEntities();
      
      // Add cover entities from house configuration
      await this._addCoverEntities();
      await this._addLightEntities();      
      // Add media player entities from house configuration
      await this._addMediaPlayerEntities();
    }

    // Force initial load of entity states if they're not already tracked
    let initializedCount = 0;
    for (const entityId of this._watchedEntities) {
      if (!this._lastEntityStates.has(entityId)) {
        const currentState = this._hass.states[entityId];
        this._lastEntityStates.set(entityId, currentState ? { ...currentState } : null);
        
        // Try to update the component, but don't fail if DOM isn't ready
        try {
          this._updateComponentForEntity(entityId);
          initializedCount++;
        } catch (error) {
          console.warn(`[DashView] Could not update component for ${entityId} during initialization:`, error);
        }
      }
    }
    
    if (initializedCount > 0) {
      console.log(`[DashView] Initialized ${initializedCount} entities on first load`);
      
      // Update header buttons if any entities were initialized
      try {
        this._updateHeaderButtonsIfNeeded();
      } catch (error) {
        console.warn('[DashView] Could not update header buttons during initialization:', error);
      }
    }
  }
// Add these two new functions to the DashviewPanel class
// Add this new function inside the DashviewPanel class
// In custom_components/dashview/www/dashview-panel.js
// Replace the previous version of this function with this one.

  _updateMediaHeaderButtons() {
    const shadow = this.shadowRoot;
    if (!shadow || !this._hass || !this._houseConfig) return;

    const container = shadow.getElementById('media-header-buttons-container');
    if (!container) return;

    // --- Step 1: Get all media players and filter for those that are 'playing' ---
    const allMediaPlayers = [];
    for (const [roomKey, roomConfig] of Object.entries(this._houseConfig.rooms || {})) {
        if (roomConfig.media_players) {
            for (const player of roomConfig.media_players) {
                allMediaPlayers.push({
                    entity_id: player.entity,
                    room_key: roomKey
                });
            }
        }
    }

    const playingPlayers = allMediaPlayers.filter(player => {
        const state = this._hass.states[player.entity_id];
        return state && state.state === 'playing';
    });

    // --- Step 2: Clear the container and build the new buttons ---
    container.innerHTML = ''; // Clear previous buttons

    if (playingPlayers.length === 0) {
        return; // Exit if nothing is playing
    }

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'media-header-scroll';

    // --- Step 3: Create a button for each playing media player ---
    playingPlayers.forEach(player => {
        const button = document.createElement('button');
        button.className = 'media-header-button';
        
        // This sets the navigation path. Clicking it will open the correct room popup.
        const navPath = `#${player.room_key}`;
        button.setAttribute('data-hash', navPath);
        button.title = player.entity_id;

        const iconElement = document.createElement('i');
        const iconClass = player.entity_id.includes('tv') ? 'mdi-television' : 'mdi-music';
        iconElement.className = `mdi ${iconClass}`;
        
        button.appendChild(iconElement);
        scrollContainer.appendChild(button);
    });

    container.appendChild(scrollContainer);
  }
  async loadThresholdsConfig() {
    const shadow = this.shadowRoot;
    const statusEl = shadow.getElementById('thresholds-config-status');
    const tempInput = shadow.getElementById('global-temp-threshold');
    const humidityInput = shadow.getElementById('global-humidity-threshold');
    if (!statusEl || !tempInput || !humidityInput) return;

    this._setStatusMessage(statusEl, 'Loading thresholds...', 'loading');
    try {
        // Use the house_config object already loaded when the panel initialized.
        if (!this._houseConfig) {
            this._houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
        }
        const houseConfig = this._houseConfig || {};
        tempInput.value = houseConfig.temperature_threshold || '';
        humidityInput.value = houseConfig.humidity_threshold || '';
        this._setStatusMessage(statusEl, '✓ Thresholds loaded', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error loading thresholds: ${e.message}`, 'error');
    }
  }

  async saveThresholdsConfig() {
    const shadow = this.shadowRoot;
    const statusEl = shadow.getElementById('thresholds-config-status');
    const tempInput = shadow.getElementById('global-temp-threshold');
    const humidityInput = shadow.getElementById('global-humidity-threshold');
    if (!statusEl || !tempInput || !humidityInput) return;

    const tempThreshold = parseFloat(tempInput.value);
    const humidityThreshold = parseFloat(humidityInput.value);

    if (isNaN(tempThreshold) || isNaN(humidityThreshold)) {
        this._setStatusMessage(statusEl, '✗ Please enter valid numbers.', 'error');
        return;
    }

    this._setStatusMessage(statusEl, 'Saving thresholds...', 'loading');
    try {
        // Fetch the latest full config to avoid overwriting other settings
        const configToSave = await this._hass.callApi('GET', 'dashview/config?type=house') || {};

        configToSave.temperature_threshold = tempThreshold;
        configToSave.humidity_threshold = humidityThreshold;

        // Save the entire house config object back to the backend
        await this._hass.callApi('POST', 'dashview/config', {
            type: 'house',
            config: configToSave
        });

        // Update the panel's active config object
        this._houseConfig = configToSave;
        
        this._setStatusMessage(statusEl, '✓ Thresholds saved!', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error saving thresholds: ${e.message}`, 'error');
    }
  }
  // Add room header entities from house configuration
  async _addRoomHeaderEntities() {
    // Load house configuration if not already loaded
    if (!this._houseConfig || Object.keys(this._houseConfig).length === 0) {
      try {
        await this.loadConfiguration();
      } catch (error) {
        console.warn('[DashView] Could not load house configuration for room header entities:', error);
        return;
      }
    }
    
    if (!this._houseConfig || !this._houseConfig.rooms) return;
    
    Object.values(this._houseConfig.rooms).forEach(roomConfig => {
      if (roomConfig.header_entities && Array.isArray(roomConfig.header_entities)) {
        roomConfig.header_entities.forEach(entityConfig => {
          if (entityConfig.entity) {
            this._watchedEntities.add(entityConfig.entity);
            console.log(`[DashView] Added room header entity: ${entityConfig.entity}`);
          }
        });
      }
    });
  }

  // Add cover entities from house configuration
  async _addCoverEntities() {
    // Load house configuration if not already loaded
    if (!this._houseConfig || Object.keys(this._houseConfig).length === 0) {
      try {
        await this.loadConfiguration();
      } catch (error) {
        console.warn('[DashView] Could not load house configuration for cover entities:', error);
        return;
      }
    }
    
    if (!this._houseConfig || !this._houseConfig.rooms) return;
    
    Object.values(this._houseConfig.rooms).forEach(roomConfig => {
      if (roomConfig.covers && Array.isArray(roomConfig.covers)) {
        roomConfig.covers.forEach(entityId => {
          if (entityId.startsWith('cover.')) {
            this._watchedEntities.add(entityId);
            this._coverEntities.add(entityId); // Keep a separate set for easy reference
            console.log(`[DashView] Added cover entity: ${entityId}`);
          }
        });
      }
    });
  }
// Add this new function inside the DashviewPanel class
// In custom_components/dashview/www/dashview-panel.js
// Replace the existing function with this one.

_updateTemperatureNotifications() {
  const shadow = this.shadowRoot;
  if (!shadow || !this._hass || !this._houseConfig) return;

  const container = shadow.getElementById('notifications-container');
  const tempThreshold = this._houseConfig.temperature_threshold;

  if (!container || !tempThreshold) {
      if (container) container.innerHTML = ''; // Clear old notifications if threshold is removed
      return;
  }

  const tempEntities = this._getAllEntitiesByType('temperatur');
  
  const highTempRooms = tempEntities.map(entityId => {
      const state = this._hass.states[entityId];
      if (state && !isNaN(state.state) && parseFloat(state.state) > tempThreshold) {
          // Find the room this entity belongs to
          const room = Object.values(this._houseConfig.rooms || {}).find(r => 
              r.header_entities?.some(he => he.entity === entityId && he.entity_type === 'temperatur')
          );
          return {
              roomName: room?.friendly_name || 'Unknown Room',
              temperature: parseFloat(state.state).toFixed(1)
          };
      }
      return null;
  }).filter(Boolean);

  if (highTempRooms.length > 0) {
      // Create a single string with all high-temp rooms
      const detailsString = highTempRooms.map(room => 
          `${room.roomName} (${room.temperature}°C)`
      ).join(', ');

      // Generate a single notification card
      const notificationHTML = `
          <div class="notification-card">
              <i class="mdi mdi-thermometer-alert notification-icon"></i>
              <div class="notification-info">
                  <div class="notification-title">High Temperature Alert</div>
                  <div class="notification-details">
                      <span>${detailsString}</span>
                  </div>
              </div>
          </div>
      `;
      container.innerHTML = notificationHTML;
  } else {
      // No high-temperature rooms, so clear the container
      container.innerHTML = '';
  }
}
async _addLightEntities() {
    if (!this._houseConfig || Object.keys(this._houseConfig).length === 0) {
      await this.loadConfiguration();
    }
    
    if (!this._houseConfig || !this._houseConfig.rooms) return;
    
    Object.values(this._houseConfig.rooms).forEach(roomConfig => {
      if (roomConfig.lights && Array.isArray(roomConfig.lights)) {
        roomConfig.lights.forEach(entityId => {
          if (entityId.startsWith('light.')) {
            this._watchedEntities.add(entityId);
            console.log(`[DashView] Added light entity: ${entityId}`);
          }
        });
      }
    });
  }
  // Add media player entities from house configuration
  async _addMediaPlayerEntities() {
    // Load house configuration if not already loaded
    if (!this._houseConfig || Object.keys(this._houseConfig).length === 0) {
      try {
        await this.loadConfiguration();
      } catch (error) {
        console.warn('[DashView] Could not load house configuration for media player entities:', error);
        return;
      }
    }
    
    if (!this._houseConfig || !this._houseConfig.rooms) return;
    
    Object.values(this._houseConfig.rooms).forEach(roomConfig => {
      if (roomConfig.media_players && Array.isArray(roomConfig.media_players)) {
        roomConfig.media_players.forEach(mediaPlayerConfig => {
          const entityId = mediaPlayerConfig.entity;
          if (entityId && entityId.startsWith('media_player.')) {
            this._watchedEntities.add(entityId);
            console.log(`[DashView] Added media player entity: ${entityId}`);
          }
        });
      }
    });
  }

  // Check for entity state changes - Principle 3
  _checkEntityChanges() {
    if (!this._watchedEntities) return;

    let hasChanges = false;
    for (const entityId of this._watchedEntities) {
      const currentState = this._hass.states[entityId];
      const lastState = this._lastEntityStates.get(entityId);
      
      if (!lastState || 
          !currentState || 
          currentState.state !== lastState.state ||
          JSON.stringify(currentState.attributes) !== JSON.stringify(lastState.attributes)) {
        
        this._lastEntityStates.set(entityId, currentState ? { ...currentState } : null);
        this._updateComponentForEntity(entityId);
        hasChanges = true;
      }
    }

    // Update header buttons if there are changes (they depend on multiple entities)
    if (hasChanges) {
      this._updateHeaderButtonsIfNeeded();
    }
  }

  // Update specific component for entity - Principle 3
  _updateComponentForEntity(entityId) {
    const shadow = this.shadowRoot;
    if (!shadow) {
      console.warn(`[DashView] Shadow DOM not ready for ${entityId} update`);
      return;
    }

    try {
      const weatherEntityId = this._getCurrentWeatherEntityId();
      
      switch (entityId) {
        case weatherEntityId:
          this._updateWeatherButton(shadow);
          this.updateWeatherComponents(shadow);
          break;
        case 'person.markus':
          this._updatePersonButton(shadow);
          break;
        case 'sensor.frankfurt_m_taunusanlage_departures_via_dreieich_buchschlag':
        case 'sensor.dreieich_buchschlag_departures_via_frankfurt_hbf':
          this.updateTrainDepartureCards(shadow);
          break;
        // Info-card entities
        case 'binary_sensor.motion_presence_home':
          this.updateMotionSection(shadow);
          break;
        case 'sensor.geschirrspuler_operation_state':
        case 'sensor.geschirrspuler_remaining_program_time':
          this.updateDishwasherSection(shadow);
          break;
        case 'sensor.waschmaschine_operation_state':
        case 'sensor.waschmaschine_remaining_program_time':
          this.updateWashingSection(shadow);
          break;
        case 'vacuum.mova_e30_ultra':
          this.updateVacuumSection(shadow);
          break;
        case 'input_boolean.trockner_an':
          this.updateDryerSection(shadow);
          break;
        case 'sensor.foxess_solar':
        case 'sensor.foxess_bat_soc':
          this.updateSolarSection(shadow);
          break;
        // Pollen card entities
        case 'sensor.pollenflug_birke_92':
        case 'sensor.pollenflug_erle_92':
        case 'sensor.pollenflug_hasel_92':
        case 'sensor.pollenflug_esche_92':
        case 'sensor.pollenflug_roggen_92':
        case 'sensor.pollenflug_graeser_92':
        case 'sensor.pollenflug_beifuss_92':
        case 'sensor.pollenflug_ambrosia_92':
          this.updatePollenCard(shadow);
          break;
      default:
        // Use an if/else-if chain for clarity and to prevent multiple updates for one entity
        if (this._integrationsConfig?.dwd_sensor && entityId === this._integrationsConfig.dwd_sensor) {
          this.updateDwdWarningCard();
        } else if (this._isEntityOfType(entityId, 'window')) {
          this.updateWindowsSection(shadow);
        } else if (this._isEntityOfType(entityId, 'temperatur') || this._isEntityOfType(entityId, 'humidity')) {
          const activePopup = shadow.querySelector('.popup.active');
          if (activePopup) {
            const roomKey = activePopup.id.replace('-popup', '');
            this.updateThermostatCard(activePopup, roomKey);
          }
          if (this._isEntityOfType(entityId, 'temperatur')) {
            this._updateTemperatureNotifications();
          }
        } else if (entityId.startsWith('cover.')) {
          const activePopup = shadow.querySelector('.popup.active');
          if (activePopup) {
            this.updateCoverCard(activePopup, entityId);
          }
        } else if (entityId.startsWith('light.')) {
          const activePopup = shadow.querySelector('.popup.active');
          if (activePopup) {
            this.updateLightsCard(activePopup, entityId);
          }
        } else if (entityId.startsWith('media_player.')) {
          this.updateMediaPlayerInPopups(shadow, entityId);
          this._updateMediaHeaderButtons(); 
        } else if (this._isRoomHeaderEntity(entityId)) {
          this.updateRoomHeaderIcons(shadow);
          this.updateRoomHeaderEntitiesInPopups(shadow, entityId);
        } else {
          // This log is commented out to reduce console noise for unhandled entities
          // console.log(`[DashView] No specific handler for entity: ${entityId}`);
        }
        break; // Add break at the end of the default case
      }
    } catch (error) {
      console.error(`[DashView] Error updating component for ${entityId}:`, error);
      // Don't rethrow the error to prevent breaking the entire update cycle
    }
  }

  // Update weather button component - Principle 3  
  _updateWeatherButton(shadow) {
    const weatherEntityId = this._getCurrentWeatherEntityId();
    const weatherState = this._hass.states[weatherEntityId];
    if (!weatherState) {
      console.warn(`[DashView] Weather entity ${weatherEntityId} not found in HASS states`);
      return;
    }

    try {
      const temp = (weatherState.forecast && weatherState.forecast.length > 0) ? weatherState.forecast[0].temperature : null;
      const nameElement = shadow.querySelector('.weather-button .name');
      const labelElement = shadow.querySelector('.weather-button .label');
      const iconElement = shadow.querySelector('.weather-button .icon-container');

      if (nameElement) {
        nameElement.textContent = temp ? `${temp.toFixed(1)}°C` : '-- °C';
      } else {
        console.debug('[DashView] Weather button name element not found in DOM');
      }
      
      if (labelElement) {
        labelElement.innerHTML = weatherState.attributes.temperature ? `${weatherState.attributes.temperature.toFixed(1)}<sup>°C</sup>` : '-- °C';
      } else {
        console.debug('[DashView] Weather button label element not found in DOM');
      }
      
      if (iconElement) {
        iconElement.innerHTML = `<img src="/local/weather_icons/${weatherState.state}.svg" width="40" height="40" alt="${weatherState.state}">`;
      } else {
        console.debug('[DashView] Weather button icon element not found in DOM');
      }
      
      // Log successful update for debugging
      console.debug(`[DashView] Weather button updated for ${weatherEntityId}: ${weatherState.state}`);
      
    } catch (error) {
      console.error('[DashView] Error updating weather button:', error);
    }
  }
// Add this new function inside the DashviewPanel class

  _initializeFloorTabs() {
    const shadow = this.shadowRoot;
    if (!shadow || !this._houseConfig || !this._houseConfig.floors) return;

    const container = shadow.getElementById('floor-tabs-container');
    if (!container) return;

    const floors = Object.entries(this._houseConfig.floors).sort(([, a], [, b]) => (a.level || 0) - (b.level || 0));

    if (floors.length === 0) {
        container.innerHTML = '<div class="placeholder">No floors configured.</div>';
        return;
    }

    // Create the main header with title and buttons
    const header = document.createElement('div');
    header.className = 'floor-tabs-header';

    const title = document.createElement('div');
    title.className = 'floor-tabs-title';
    title.textContent = 'Räume';
    header.appendChild(title);

    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'floor-tab-buttons-container';

    floors.forEach(([floorKey, floorConfig], index) => {
        const button = document.createElement('button');
        button.className = 'floor-tab-button';
        // Set the first floor as active by default
        if (index === 0) {
            button.classList.add('active');
        }
        button.dataset.targetFloor = floorKey;

        const icon = document.createElement('i');
        icon.className = `mdi ${this._processIconName(floorConfig.icon)}`;
        button.appendChild(icon);
        buttonsContainer.appendChild(button);
    });

    header.appendChild(buttonsContainer);
    container.appendChild(header);

    // Create content containers for each floor
    const contentArea = document.createElement('div');
    contentArea.className = 'floor-content-area';
    floors.forEach(([floorKey, floorConfig], index) => {
        const floorContent = document.createElement('div');
        floorContent.className = 'floor-content';
        floorContent.id = `floor-content-${floorKey}`;
        // Show the first floor's content by default
        if (index !== 0) {
            floorContent.style.display = 'none';
        }
        // This is where you would include the room cards for the floor.
        // For now, we'll use a placeholder.
        floorContent.innerHTML = `<div class="placeholder">Room cards for ${floorConfig.friendly_name} will go here.</div>`;
        contentArea.appendChild(floorContent);
    });
    container.appendChild(contentArea);

    // Add event listeners for tab switching
    buttonsContainer.addEventListener('click', (e) => {
        const clickedButton = e.target.closest('.floor-tab-button');
        if (!clickedButton) return;

        const targetFloor = clickedButton.dataset.targetFloor;

        // Update button active states
        container.querySelectorAll('.floor-tab-button').forEach(btn => {
            btn.classList.toggle('active', btn === clickedButton);
        });

        // Show the corresponding floor content
        container.querySelectorAll('.floor-content').forEach(content => {
            content.style.display = content.id === `floor-content-${targetFloor}` ? 'block' : 'none';
        });
    });
  }
  // Update person button component - Principle 3
  _updatePersonButton(shadow) {
    const personState = this._hass.states['person.markus'];
    if (!personState) {
      console.warn('[DashView] Person entity person.markus not found in HASS states');
      return;
    }

    try {
      const img_src = personState.attributes.entity_picture || (personState.state === 'home' ? '/local/weather_icons/IMG_0421.jpeg' : '/local/weather_icons/IMG_0422.jpeg');
      const imageElement = shadow.querySelector('.person-button .image-container');
      
      if (imageElement) {
        imageElement.innerHTML = `<img src="${img_src}" width="45" height="45">`;
        console.debug(`[DashView] Person button updated: ${personState.state}`);
      } else {
        console.debug('[DashView] Person button image element not found in DOM');
      }
    } catch (error) {
      console.error('[DashView] Error updating person button:', error);
    }
  }

  // Update header buttons only when needed - Principle 3
  _updateHeaderButtonsIfNeeded() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    // Use a throttled approach to avoid excessive updates
    if (this._headerButtonsUpdateTimer) {
      clearTimeout(this._headerButtonsUpdateTimer);
    }
    
    this._headerButtonsUpdateTimer = setTimeout(() => {
      this.updateHeaderButtons(shadow);
    }, 100); // 100ms throttle
  }

  connectedCallback() {
    this.loadContent();
    this._initializeFloorTabs(); // Add this line
  }

  // Inject CSS variables into Shadow DOM for proper theming support
  _injectCSSVariables(shadow) {
    const cssVariables = document.createElement('style');
    cssVariables.textContent = `
      :host, :root {
        /* Base Font */
        --primary-font-family: 'Space Grotesk', sans-serif;
        /* Ensure MDI font is available throughout the host */
        font-family: var(--primary-font-family), 'Material Design Icons', sans-serif;

        /* Default to light mode variables */
        --background: #f5f7fa;
        --popupBG: rgba(250, 251, 252, 0.3);
        --highlight: rgba(40, 40, 42, 0.05);
        --highlight-active: rgba(250, 251, 252, 0.1);
        
        --gray000: #edeff2;
        --gray100: #e9eaec;
        --gray200: #d6d7d9;
        --gray400: #909193;
        --gray500: #707173;
        --gray800: #0f0f10;
        
        --green: #c5e4ac;
        --purple: #e3d4f6;
        --yellow: #faedae;
        --red: #f0a994;
        --blue: #c8ddfa;
        --blue-dark: #abcbf8;
        --orange: #ffd1b1;

        /* Gradients */
        --active-light: linear-gradient(145deg, rgba(255,245,200,1) 0%, rgba(255,225,130,1) 60%, rgba(255,200,90,1) 150%);
        --active-big: linear-gradient(145deg, rgba(255,220,178,1) 0%, rgba(255,176,233,1) 60%, rgba(104,156,255,1) 150%);
        --active-small: linear-gradient(145deg, rgba(255,212,193,1) 0%, rgba(248,177,235,1) 100%);
        
        /* Main Interface Colors */
        --primary-color: var(--blue-dark);
        --accent-color: var(--blue-dark);
        --primary-background-color: var(--background);
        --secondary-background-color: var(--background);
        --divider-color: var(--gray100);

        /* Text */
        --primary-text-color: var(--gray800);
        --secondary-text-color: var(--gray500);
        --text-primary-color: var(--gray800);
        --disabled-text-color: var(--gray400);

        /* Cards */
        --card-background-color: var(--gray000);
        --ha-card-background: var(--gray000);
        --ha-card-border-radius: 30px;
        --ha-card-border-width: 0px;
        --ha-card-box-shadow: none;
      }

      /* Dark Mode Overrides */
      @media (prefers-color-scheme: dark) {
        :host, :root {
          --background: #28282A;
          --popupBG: rgba(40, 40, 42, 0.3);
          --highlight: rgba(250, 251, 252, 0.05);
          --highlight-active: rgba(40, 40, 42, 0.1);
          
          --gray000: #3a3b3d;
          --gray100: #353637;
          --gray200: #404142;
          --gray400: #737476;
          --gray500: #939496;
          --gray800: #ffffff;

          --green: #d2e7d6;
          --purple: #d5c1ed;
          --yellow: #fbf1be;
          --red: #e7625f;
          --blue: #abcbf8;
          --blue-dark: #c8ddfa;
          --orange: #ffba8a;
        }
      }
      /* Explicitly add MDI font-family for elements inside Shadow DOM that might need it */
      .mdi {
        font-family: 'Material Design Icons', sans-serif !important;
      }
    `;
    shadow.appendChild(cssVariables);
  }

  async loadContent() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    try {
      // Fetch the initial weather entity ID when the panel loads
      await this._fetchWeatherEntityId();

      // Inject CSS variables for Shadow DOM compatibility
      this._injectCSSVariables(shadow);

      const [styleText, htmlText] = await Promise.all([
        fetch('/local/dashview/style.css').then(res => res.ok ? res.text() : Promise.reject('Failed to load stylesheet')),
        fetch('/local/dashview/index.html').then(res => res.ok ? res.text() : Promise.reject('Failed to load HTML content'))
      ]);

      const style = document.createElement('style');
      style.textContent = styleText;
      shadow.appendChild(style);

      const content = document.createElement('div');
      content.innerHTML = htmlText;
      shadow.appendChild(content);
      
      await this.loadTemplates(shadow);
      
      try {
        this.initializeCard(shadow);
      } catch (error) {
        console.warn('[DashView] Non-critical error in initializeCard:', error);
        // Continue with content loading even if card initialization fails
      }
      
      // Initialize train departure cards with placeholders
      try {
        this.updateTrainDepartureCards(shadow);
      } catch (error) {
        console.warn('[DashView] Non-critical error in updateTrainDepartureCards:', error);
        // Continue with content loading even if train cards fail
      }

      // Always set content ready to ensure entity loading works
      this._contentReady = true;
      if (this._hass) {
        this._handleHassUpdate();
      }

    } catch (error) {
      shadow.innerHTML = `<div style="color: red; padding: 16px;">Error loading DashView panel: ${error.message}</div>`;
      console.error('[DashView] Error loading DashView panel:', error);
    }
  }

  // Optimized template loading - Principle 4
  async loadTemplates(container) {
    const placeholders = container.querySelectorAll('[data-template]');
    if (placeholders.length === 0) return;

    console.log(`[DashView] Loading ${placeholders.length} templates...`);
    
    // Batch template loading to reduce network requests
    const templatePromises = Array.from(placeholders).map(async (el) => {
      const templateName = el.dataset.template;
      try {
        const response = await fetch(`/local/dashview/templates/${templateName}.html`);
        if (response.ok) {
          const content = await response.text();
          return { element: el, content, success: true };
        } else {
          return { element: el, content: `Failed to load template: ${templateName}`, success: false };
        }
      } catch (err) {
        console.error('[DashView] Error loading template:', templateName, err);
        return { element: el, content: `Error loading template: ${templateName}`, success: false };
      }
    });

    // Wait for all templates and apply them
    const results = await Promise.all(templatePromises);
    results.forEach(({ element, content, success }) => {
      element.innerHTML = content;
      if (!success) {
        console.warn(`[DashView] Template loading failed for: ${element.dataset.template}`);
      }
    });

    console.log(`[DashView] Template loading completed`);
  }

  // Legacy method maintained for compatibility - Principle 3
  updateElements() {
    // This method is kept for backward compatibility but now delegates to granular updates
    console.warn('[DashView] updateElements() is deprecated, using granular updates instead');
    this._handleHassUpdate();
  }

  // Method to check if it's a weekday
  isWeekday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Sunday = 0
  }

  // Method to evaluate conditions for a train card
  evaluateConditions(conditions) {
    if (!conditions || !this._hass) {
      return false;
    }

    const conditionList = conditions.split(',');
    
    for (const condition of conditionList) {
      const trimmedCondition = condition.trim();
      
      if (trimmedCondition === 'weekday') {
        if (!this.isWeekday()) return false;
        continue;
      }

      if (trimmedCondition.includes('=') && !trimmedCondition.includes('!=')) {
        const [entityId, expectedValue] = trimmedCondition.split('=');
        const entity = this._hass.states[entityId.trim()];
        if (!entity || entity.state !== expectedValue.trim()) return false;
      } else if (trimmedCondition.includes('>')) {
        const [entityId, minValue] = trimmedCondition.split('>');
        const entity = this._hass.states[entityId.trim()];
        if (!entity || parseFloat(entity.state) <= parseFloat(minValue.trim())) return false;
      } else if (trimmedCondition.includes('!=')) {
        const [entityId, excludedValue] = trimmedCondition.split('!=');
        const entity = this._hass.states[entityId.trim()];
        if (!entity || entity.state === excludedValue.trim()) return false;
      }
    }

    return true;
  }

  // Method to get next train departure
// In custom_components/dashview/www/dashview-panel.js
// Replace the entire getNextTrainDeparture function with this one.

  getNextTrainDeparture(departureEntity, delayMin = 0) {
    if (!departureEntity || !departureEntity.attributes.next_departures) {
      return { time: '--:--', isDelayed: false };
    }

    const departures = departureEntity.attributes.next_departures;
    const now = new Date();

    for (const train of departures) {
      // This line is changed for a more robust check
      if (train.isCancelled == true || train.isCancelled == 1) {
          continue;
      }

      const [hours, minutes] = train.scheduledDeparture.split(':').map(Number);
      const departureTime = new Date();
      departureTime.setHours(hours, minutes + (train.delayDeparture || 0), 0, 0);

      // Check if departure is far enough in the future
      const timeDiff = (departureTime - now) / (1000 * 60); // difference in minutes
      if (timeDiff >= delayMin) {
        const totalMinutes = hours * 60 + minutes + (train.delayDeparture || 0);
        const displayHours = Math.floor(totalMinutes / 60) % 24;
        const displayMinutes = totalMinutes % 60;
        
        return {
          time: `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}`,
          isDelayed: (train.delayDeparture || 0) > 0
        };
      }
    }

    return { time: '--:--', isDelayed: false };
  }

  // Method to update train departure cards
// In custom_components/dashview/www/dashview-panel.js

  updateTrainDepartureCards(shadow) {
    const trainCards = shadow.querySelectorAll('.train-departure-card');
    
    trainCards.forEach(card => {
      const conditions = card.dataset.conditions;
      const departureSensor = card.dataset.departureSensor;
      const delayMin = parseInt(card.dataset.delayMin) || 0;

      // This block is removed as it was causing the bug.
      /*
      if (!this._hass) {
        card.classList.remove('hidden');
        const timeElement = card.querySelector('.train-time');
        if (timeElement) {
          timeElement.textContent = '--:--';
        }
        return;
      }
      */

      // The function will now only proceed if this._hass is available.
      if (!this._hass) {
          return;
      }

      // Check if conditions are met
      const shouldShow = this.evaluateConditions(conditions);
      
      if (shouldShow) {
        card.classList.remove('hidden');
        
        // Update departure time
        const departureEntity = this._hass.states[departureSensor];
        const departure = this.getNextTrainDeparture(departureEntity, delayMin);
        
        const timeElement = card.querySelector('.train-time');
        if (timeElement) {
          timeElement.textContent = departure.time;
          
          if (departure.isDelayed) {
            timeElement.classList.add('delayed');
          } else {
            timeElement.classList.remove('delayed');
          }
        }
      } else {
        card.classList.add('hidden');
      }
    });
  }
  // Method to update info card sections
  updateInfoCard(shadow) {
    const infoCard = shadow.querySelector('.info-card');
    if (!infoCard || !this._hass) return;

    // Update Motion Section
    this.updateMotionSection(shadow);
    
    // Update Windows Section
    this.updateWindowsSection(shadow);
    
    // Update Dishwasher Section
    this.updateDishwasherSection(shadow);
    
    // Update Washing Machine Section
    this.updateWashingSection(shadow);
    
    // Update Vacuum Section
    this.updateVacuumSection(shadow);
    
    // Update Dryer Section
    this.updateDryerSection(shadow);
    
    // Update Solar Section
    this.updateSolarSection(shadow);
  }

  // Helper method to calculate time difference text
  _calculateTimeDifference(lastChanged) {
    const now = new Date();
    const diffSeconds = Math.floor((now - lastChanged) / 1000);
    
    if (diffSeconds < 60) {
      return 'Jetzt';
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      return `${minutes} Minuten`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return `${hours} Stunden`;
    } else {
      const days = Math.floor(diffSeconds / 86400);
      return `${days} Tagen`;
    }
  }

  updateMotionSection(shadow) {
    const section = shadow.querySelector('.motion-section');
    if (!section) return;
    
    const motionEntity = this._hass.states['binary_sensor.motion_presence_home'];
    if (!motionEntity) {
      section.classList.add('hidden');
      return;
    }
    
    const prefixElement = section.querySelector('[data-type="motion-prefix"]');
    const badgeElement = section.querySelector('[data-type="motion-time"]');
    const suffixElement = section.querySelector('[data-type="motion-suffix"]');
    const badge = section.querySelector('.info-badge');
    
    // Calculate time difference for both states
    const lastChanged = new Date(motionEntity.last_changed);
    const timeText = this._calculateTimeDifference(lastChanged);
    
    if (motionEntity.state === 'on') {
      prefixElement.textContent = 'Im Haus ist seit';
      suffixElement.textContent = 'Bewegung.';
      section.classList.remove('hidden');
      badge.classList.add('green');
      badge.classList.remove('red');
      badgeElement.textContent = `${timeText}🏡`;
    } else {
      prefixElement.textContent = 'Die letzte Bewegung im Haus war vor';
      suffixElement.textContent = '.';
      section.classList.remove('hidden');
      badge.classList.remove('green');
      badge.classList.add('red');
      badgeElement.textContent = `${timeText}🏡`;
    }
  }

  updateWindowsSection(shadow) {
    const section = shadow.querySelector('.windows-section');
    if (!section) return;
    
    // Count open windows using configuration
    const allWindows = this._getAllEntitiesByType('window');
    const openWindows = allWindows.filter(entityId => 
      this._hass.states[entityId]?.state === 'on'
    ).length;
    
    if (openWindows > 0) {
      section.classList.remove('hidden');
      const countElement = section.querySelector('[data-type="window-count"]');
      countElement.textContent = `${openWindows} 🪟`;
    } else {
      section.classList.add('hidden');
    }
  }

  updateDishwasherSection(shadow) {
    const section = shadow.querySelector('.dishwasher-section');
    if (!section) return;
    
    const dishwasherEntity = this._hass.states['sensor.geschirrspuler_operation_state'];
    if (!dishwasherEntity || dishwasherEntity.state !== 'run') {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    const timeElement = section.querySelector('[data-type="time-remaining"]');
    
    // Calculate remaining time
    const endTimeEntity = this._hass.states['sensor.geschirrspuler_remaining_program_time'];
    if (endTimeEntity && endTimeEntity.state) {
      const endTime = new Date(endTimeEntity.state);
      const now = new Date();
      if (endTime > now) {
        const diffMinutes = Math.floor((endTime - now) / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const remainingMinutes = diffMinutes % 60;
        
        let timeText = '';
        if (hours > 0) timeText += `${hours}h`;
        if (remainingMinutes > 0 || hours === 0) timeText += `${remainingMinutes}min`;
        
        timeElement.textContent = timeText || 'Ready';
      } else {
        timeElement.textContent = 'Ready';
      }
    } else {
      timeElement.textContent = 'Unknown';
    }
  }

  updateWashingSection(shadow) {
    const section = shadow.querySelector('.washing-section');
    if (!section) return;
    
    const washingEntity = this._hass.states['sensor.waschmaschine_operation_state'];
    if (!washingEntity) {
      section.classList.add('hidden');
      return;
    }
    
    const prefixElement = section.querySelector('[data-type="washing-prefix"]');
    const timeElement = section.querySelector('[data-type="washing-time"]');
    
    if (washingEntity.state === 'run') {
      prefixElement.textContent = 'Die Waschmaschine läuft noch';
      section.classList.remove('hidden');
      
      // Calculate remaining time
      const endTimeEntity = this._hass.states['sensor.waschmaschine_remaining_program_time'];
      if (endTimeEntity && endTimeEntity.state) {
        const endTime = new Date(endTimeEntity.state);
        const now = new Date();
        if (endTime > now) {
          const diffMinutes = Math.floor((endTime - now) / (1000 * 60));
          const hours = Math.floor(diffMinutes / 60);
          const remainingMinutes = diffMinutes % 60;
          
          let timeText = '';
          if (hours > 0) timeText += `${hours}h`;
          if (remainingMinutes > 0 || hours === 0) timeText += `${remainingMinutes}min`;
          
          timeElement.textContent = `${timeText}👕` || 'Ready👕';
        } else {
          timeElement.textContent = 'Ready👕';
        }
      } else {
        timeElement.textContent = 'Unknown👕';
      }
    } else if (washingEntity.state === 'finished') {
      prefixElement.textContent = 'Die Waschmaschine ist fertig';
      timeElement.textContent = '👕';
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }

  updateVacuumSection(shadow) {
    const section = shadow.querySelector('.vacuum-section');
    if (!section) return;
    
    const vacuumEntity = this._hass.states['vacuum.mova_e30_ultra'];
    if (!vacuumEntity || vacuumEntity.state !== 'cleaning') {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    const roomElement = section.querySelector('[data-type="room-name"]');
    
    // Room mapping
    const roomDict = {
      'Erdgeschoss': {
        1: 'Arbeitszimmer',
        2: 'Gästeklo',
        3: 'Küche',
        4: 'Wohnzimmer',
        5: 'Esszimmer',
        6: 'Flur'
      },
      'Keller': {
        1: 'Partykeller',
        2: 'Kellerflur',
        3: 'Raum 3',
        5: 'Waschkeller'
      },
      'Dachgeschoss': {
        1: 'Elternschlafzimmer',
        2: 'Klo',
        3: 'Ankleide',
        4: 'Badezimmer'
      },
      'Map 4': {
        1: 'Raum 1',
        2: 'Raum 2',
        3: 'Raum 3',
        4: 'Raum 4',
        5: 'Raum 5'
      }
    };
    
    const currentSegment = vacuumEntity.attributes.current_segment;
    const selectedMap = vacuumEntity.attributes.selected_map;
    
    let roomName = 'Reinigung läuft';
    if (selectedMap && roomDict[selectedMap] && currentSegment && roomDict[selectedMap][currentSegment]) {
      roomName = roomDict[selectedMap][currentSegment];
    }
    
    roomElement.textContent = roomName;
  }

  updateDryerSection(shadow) {
    const section = shadow.querySelector('.dryer-section');
    if (!section) return;
    
    const dryerEntity = this._hass.states['input_boolean.trockner_an'];
    if (!dryerEntity || dryerEntity.state !== 'on') {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
  }

  updateSolarSection(shadow) {
    const section = shadow.querySelector('.solar-section');
    if (!section) return;
    
    const solarEntity = this._hass.states['sensor.foxess_solar'];
    const batteryEntity = this._hass.states['sensor.foxess_bat_soc'];
    
    if (!solarEntity || !this.isNumber(solarEntity.state)) {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    
    const productionElement = section.querySelector('[data-type="solar-production"]');
    const batteryPrefixElement = section.querySelector('[data-type="battery-prefix"]');
    const batteryLevelElement = section.querySelector('[data-type="battery-level"]');
    const batterySuffixElement = section.querySelector('[data-type="battery-suffix"]');
    
    // Update solar production
    const solarValue = parseFloat(solarEntity.state);
    productionElement.textContent = `${solarValue.toFixed(1)} kWh ☀️`;
    
    // Update battery info
    if (batteryEntity && this.isNumber(batteryEntity.state)) {
      const batteryLevel = parseFloat(batteryEntity.state);
      
      if (batteryLevel < 50) {
        batteryPrefixElement.textContent = 'und die Batterie ist zu';
        batteryPrefixElement.style.marginLeft = '0px';
        batteryLevelElement.textContent = `${Math.round(batteryLevel)}% 🔋`;
        batteryLevelElement.style.display = 'inline';
        batterySuffixElement.textContent = 'geladen.';
        batterySuffixElement.style.display = 'inline';
      } else {
        batteryPrefixElement.textContent = '.';
        batteryPrefixElement.style.marginLeft = '-5px';
        batteryLevelElement.style.display = 'none';
        batterySuffixElement.style.display = 'none';
      }
    } else {
      batteryPrefixElement.textContent = '.';
      batteryPrefixElement.style.marginLeft = '-5px';
      batteryLevelElement.style.display = 'none';
      batterySuffixElement.style.display = 'none';
    }
  }

  // Helper method to check if a value is a number
  isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  // New Helper Method 1: Gets all entities of a specific type from the house config
  _getAllEntitiesByType(entityType) {
    if (!this._houseConfig || !this._houseConfig.rooms) return [];
    
    const entities = [];
    for (const room of Object.values(this._houseConfig.rooms)) {
      if (room.header_entities && Array.isArray(room.header_entities)) {
        for (const entityConfig of room.header_entities) {
          if (entityConfig.entity_type === entityType) {
            entities.push(entityConfig.entity);
          }
        }
      }
    }
    return [...new Set(entities)]; // Return unique entity IDs
  }

  // Helper Method: Check if an entity is of a specific type based on configuration
  _isEntityOfType(entityId, entityType) {
    if (!this._houseConfig || !this._houseConfig.rooms) return false;
    
    for (const room of Object.values(this._houseConfig.rooms)) {
      if (room.header_entities && Array.isArray(room.header_entities)) {
        for (const entityConfig of room.header_entities) {
          if (entityConfig.entity === entityId && entityConfig.entity_type === entityType) {
            return true;
          }
        }
      }
    }
    return false;
  }

  // New Helper Method 2: Renders a list of entities into a target container
  _renderEntityList(container, entityIds, noneMessage = "None") {
    if (!container) return;

    container.innerHTML = ''; // Clear previous content
    if (entityIds.length === 0) {
      container.innerHTML = `<div class="entity-list-none">${noneMessage}</div>`;
      return;
    }

    entityIds.forEach(entityId => {
      const entityState = this._hass.states[entityId];
      const friendlyName = entityState ? entityState.attributes.friendly_name || entityId : entityId;
      
      const item = document.createElement('div');
      item.className = 'entity-list-item';
      item.textContent = friendlyName;
      container.appendChild(item);
    });
  }

  // New Main Method: Updates all lists in the security popup
  updateSecurityLists(popup) {
    if (!this._hass || !popup) return;
    
    // --- Handle Windows ---
    const allWindows = this._getAllEntitiesByType('window');
    const openWindows = allWindows.filter(id => this._hass.states[id]?.state === 'on');
    const closedWindows = allWindows.filter(id => this._hass.states[id]?.state === 'off');

    const openWindowsList = popup.querySelector('#open-windows-list');
    const closedWindowsList = popup.querySelector('#closed-windows-list');
    
    this._renderEntityList(openWindowsList, openWindows, "Alle Fenster sind geschlossen.");
    this._renderEntityList(closedWindowsList, closedWindows, "Keine Fenster sind geschlossen.");

    // --- Handle Motion Sensors ---
    const allMotionSensors = this._getAllEntitiesByType('motion');
    const activeMotion = allMotionSensors.filter(id => this._hass.states[id]?.state === 'on');
    const inactiveMotion = allMotionSensors.filter(id => this._hass.states[id]?.state === 'off');

    const activeMotionList = popup.querySelector('#active-motion-list');
    const inactiveMotionList = popup.querySelector('#inactive-motion-list');

    this._renderEntityList(activeMotionList, activeMotion, "Keine Bewegung erkannt.");
    this._renderEntityList(inactiveMotionList, inactiveMotion, "Keine inaktiven Sensoren.");

    // --- Handle Smoke Detectors ---
    const allSmokeDetectors = this._getAllEntitiesByType('smoke');
    const activeSmokeDetectors = allSmokeDetectors.filter(id => this._hass.states[id]?.state === 'on');
    const inactiveSmokeDetectors = allSmokeDetectors.filter(id => this._hass.states[id]?.state === 'off');

    const activeSmokeDetectorList = popup.querySelector('#active-smoke-detector-list');
    const inactiveSmokeDetectorList = popup.querySelector('#inactive-smoke-detector-list');

    this._renderEntityList(activeSmokeDetectorList, activeSmokeDetectors, "Keine aktiven Rauchmelder.");
    this._renderEntityList(inactiveSmokeDetectorList, inactiveSmokeDetectors, "Keine inaktiven Rauchmelder.");

    // --- Handle Vibration Sensors ---
    const allVibrationSensors = this._getAllEntitiesByType('vibration');
    const activeVibrationSensors = allVibrationSensors.filter(id => this._hass.states[id]?.state === 'on');
    const inactiveVibrationSensors = allVibrationSensors.filter(id => this._hass.states[id]?.state === 'off');

    const activeVibrationList = popup.querySelector('#active-vibration-list');
    const inactiveVibrationList = popup.querySelector('#inactive-vibration-list');

    this._renderEntityList(activeVibrationList, activeVibrationSensors, "Keine aktiven Vibrationssensoren.");
    this._renderEntityList(inactiveVibrationList, inactiveVibrationSensors, "Keine inaktiven Vibrationssensoren.");
    
    // --- Update Security Header Buttons ---
    this._updateSecurityHeaderButtons(popup);
  }

  // Update Security Header Buttons
// START: Replace with this new function
_updateSecurityHeaderButtons(popup) {
    if (!this._hass || !popup) return;

    // --- Motion Sensor Chip ---
    const motionChip = popup.querySelector('.header-info-chip[data-type="motion"]');
    if (motionChip) {
        const allMotionSensors = this._getAllEntitiesByType('motion');
        const activeMotionSensors = allMotionSensors.filter(id => this._hass.states[id]?.state === 'on');

        if (activeMotionSensors.length > 0) {
            motionChip.style.display = 'flex';
            motionChip.style.background = 'var(--active-big)';
            motionChip.querySelector('.chip-name').style.color = 'var(--gray000)';
            motionChip.querySelector('.chip-icon-container i').className = 'mdi mdi-motion-sensor';

            let mostRecentTime = 0;
            activeMotionSensors.forEach(entityId => {
                const entity = this._hass.states[entityId];
                if (entity) {
                    const lastChanged = new Date(entity.last_changed).getTime();
                    if (lastChanged > mostRecentTime) {
                        mostRecentTime = lastChanged;
                    }
                }
            });

            const timeDiff = Math.floor((Date.now() - mostRecentTime) / 1000);
            let timeAgo;
            if (timeDiff < 3600) {
                timeAgo = `${Math.floor(timeDiff / 60)}m ago`;
            } else if (timeDiff < 86400) {
                timeAgo = `${Math.floor(timeDiff / 3600)}h ago`;
            } else {
                timeAgo = `${Math.floor(timeDiff / 86400)}d ago`;
            }
            motionChip.querySelector('.chip-name').textContent = timeAgo;
        } else {
            motionChip.style.display = 'none';
        }
    }

    // --- Windows Chip ---
    const windowsChip = popup.querySelector('.header-info-chip[data-type="windows"]');
    if (windowsChip) {
        const allWindows = this._getAllEntitiesByType('window');
        const openWindows = allWindows.filter(id => this._hass.states[id]?.state === 'on');

        if (openWindows.length > 0) {
            windowsChip.style.display = 'flex';
            windowsChip.style.background = 'var(--active-big)';
            windowsChip.querySelector('.chip-name').style.color = 'var(--gray000)';
            windowsChip.querySelector('.chip-name').textContent = `${openWindows.length} offen`;
        } else {
            windowsChip.style.display = 'none';
        }
    }

    // --- Smoke Detector Chip ---
    const smokeChip = popup.querySelector('.header-info-chip[data-type="smoke"]');
    if (smokeChip) {
        const allSmokeDetectors = this._getAllEntitiesByType('smoke');
        const activeSmokeDetectors = allSmokeDetectors.filter(id => this._hass.states[id]?.state === 'on');

        if (activeSmokeDetectors.length > 0) {
            smokeChip.style.display = 'flex';
            smokeChip.style.background = 'var(--red)'; // Special color for smoke
            smokeChip.querySelector('.chip-name').style.color = 'var(--gray000)';
            smokeChip.querySelector('.chip-name').textContent = `${activeSmokeDetectors.length} aktiv`;
        } else {
            smokeChip.style.display = 'none';
        }
    }
}
// END: Replacement of function

  // Initialize Security Button Click Handlers
// START: Replace the old _initializeSecurityButton function with this new one
_initializeSecurityChip(chip) {
    if (!chip) return;

    chip.addEventListener('click', () => {
        const chipType = chip.getAttribute('data-type');
        const popup = chip.closest('.popup');
        if (!popup || !chipType) return;

        const tabMap = {
            'motion': 'bewegung-tab',
            'windows': 'fenster-tab',
            'smoke': 'rauchmelder-tab'
        };

        const targetTabId = tabMap[chipType];
        if (targetTabId) {
            const targetButton = popup.querySelector(`.tab-button[data-target="${targetTabId}"]`);
            if (targetButton) {
                targetButton.click(); // Simulate a click on the corresponding tab button
            }
        }
    });
}
// END: Replacement of function

  initializeCard(context) {
    // --- This section is the same as before ---
    const handleHashChange = async () => {
      const hash = window.location.hash || '#home';
      context.querySelectorAll('.popup').forEach(popup => popup.classList.remove('active'));
      context.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
      // Restore body scrolling when switching away from popups
      document.body.classList.remove('popup-open');

      if (hash && hash !== '#home') {
        const popupType = hash.substring(1);
        const popupId = popupType + '-popup';
        let targetPopup = context.querySelector('#' + popupId);
        
        if (!targetPopup) {
            // First, check if the popupType corresponds to a configured room.
            const isRoom = this._houseConfig && this._houseConfig.rooms && this._houseConfig.rooms[popupType];

            if (isRoom) {
                // It's a room. Create the popup dynamically with no initial content.
                // The content (like covers or placeholders) will be added by other functions.
                targetPopup = this.createPopupFromTemplate(popupId, popupType, ''); // Pass empty string for content
                if (targetPopup) {
                    await this.reinitializePopupContent(targetPopup);
                }
            } else {
                // It's a system page (like 'security' or 'admin'). Try to fetch its HTML file.
                try {
                    const response = await fetch(`/local/dashview/${popupType}.html`);
                    if (response.ok) {
                        const html = await response.text();
                        targetPopup = this.createPopupFromTemplate(popupId, popupType, html);
                    } else {
                        // If the system page HTML doesn't exist, create a generic placeholder.
                        const content = `<div class="placeholder">Content for ${this.getPopupTitleForType(popupType)}</div>`;
                        targetPopup = this.createPopupFromTemplate(popupId, popupType, content);
                    }
                    if (targetPopup) {
                        await this.reinitializePopupContent(targetPopup);
                    }
                } catch (err) {
                    console.error(`[DashView] Error creating popup for ${popupType}:`, err);
                    const errorContent = `<div class="placeholder">Error loading: ${err.message}</div>`;
                    targetPopup = this.createPopupFromTemplate(popupId, popupType, errorContent);
                }
            }
        }
        
        if (targetPopup) {
            targetPopup.classList.add('active');
            // Prevent body scrolling when popup is active
            document.body.classList.add('popup-open');
        }
      }

      const activeButton = context.querySelector(`.nav-button[data-hash="${hash}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
      }
    };
    window.addEventListener('hashchange', handleHashChange, true);
    handleHashChange();

    context.addEventListener('click', (e) => {
        const target = e.target.closest('[data-hash]');
        if (target) {
            e.preventDefault();
            const newHash = target.getAttribute('data-hash');
            if (window.location.hash !== newHash) {
               window.location.hash = newHash;
            }
        }
        // In the initializeCard function, within the e.target.closest logic:

        const saveThresholdsBtn = e.target.closest('#save-thresholds-config');
        if (saveThresholdsBtn) {
            this.saveThresholdsConfig();
        }
        const kioskButton = e.target.closest('.kiosk-button');
        if (kioskButton) {
            this.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true }));
        }

        const trainCard = e.target.closest('.train-departure-card');
        if (trainCard) {
            window.location.hash = '#bahn';
        }
        const saveDwdBtn = e.target.closest('#save-dwd-config');
        if (saveDwdBtn) {
            this.saveDwdConfig();
        }
        const reloadDwdBtn = e.target.closest('#reload-dwd-config');
        if (reloadDwdBtn) {
            this.loadDwdConfig();
        }
        // Handle info card badge clicks (only badges, not full sections)
        const infoBadge = e.target.closest('.info-badge');
        if (infoBadge) {
            const infoSection = infoBadge.closest('.info-section');
            if (infoSection) {
                if (infoSection.classList.contains('motion-section') || infoSection.classList.contains('windows-section')) {
                    window.location.hash = '#security';
                } else if (infoSection.classList.contains('dryer-section')) {
                    window.location.hash = '#waschkeller';
                }
            }
        }

        // Handle header room button clicks
        const roomButton = e.target.closest('.header-room-button');
        if (roomButton) {
            const navigationPath = roomButton.getAttribute('data-navigation');
            if (navigationPath && navigationPath !== '#unknown') {
                window.location.hash = navigationPath;
            }
        }

        // Handle admin config buttons
        const reloadConfigBtn = e.target.closest('#reload-config');
        if (reloadConfigBtn) {
            // Reset admin state and reload - Principle 12
            this._adminLocalState.isLoaded = false;
            this.loadAdminConfiguration();
        }

        const saveRoomsBtn = e.target.closest('#save-rooms-config');
        if (saveRoomsBtn) {
            this.saveRoomsConfiguration();
        }

        const saveHouseBtn = e.target.closest('#save-house-config');
        if (saveHouseBtn) {
            this.saveHouseConfiguration();
        }

        const reloadHouseBtn = e.target.closest('#reload-house-config');
        if (reloadHouseBtn) {
            this.loadAdminConfiguration();
        }

        const saveWeatherEntityBtn = e.target.closest('#save-weather-entity');
        if (saveWeatherEntityBtn) {
            this.saveWeatherEntityConfiguration();
        }

        const reloadWeatherBtn = e.target.closest('#reload-weather-config');
        if (reloadWeatherBtn) {
            // Reset weather admin state and reload - Principle 12
            this._adminLocalState.weatherEntity = null;
            this.loadWeatherEntityConfiguration();
        }

        // Handle motion setup buttons
        const reloadMotionSensorsBtn = e.target.closest('#reload-motion-sensors');
        if (reloadMotionSensorsBtn) {
            this.loadMotionSensorSetup();
        }

        const saveMotionSensorConfigBtn = e.target.closest('#save-motion-sensor-config');
        if (saveMotionSensorConfigBtn) {
            this.saveMotionSensorConfig();
        }

        // Handle cover setup buttons
        const reloadCoverEntitiesBtn = e.target.closest('#reload-cover-entities');
        if (reloadCoverEntitiesBtn) {
            this.loadCoverSetup();
        }

        const saveCoverConfigBtn = e.target.closest('#save-cover-config');
        if (saveCoverConfigBtn) {
            this.saveCoverConfig();
        }

        // Handle light setup buttons
        const reloadLightEntitiesBtn = e.target.closest('#reload-light-entities');
        if (reloadLightEntitiesBtn) {
            this.loadLightSetup();
        }

        const saveLightConfigBtn = e.target.closest('#save-light-config');
        if (saveLightConfigBtn) {
            this.saveLightConfig();
        }

        // Handle window setup buttons
        const reloadWindowSensorsBtn = e.target.closest('#reload-window-sensors');
        if (reloadWindowSensorsBtn) {
            this.loadWindowSensorSetup();
        }

        const saveWindowSensorConfigBtn = e.target.closest('#save-window-sensor-config');
        if (saveWindowSensorConfigBtn) {
            this.saveWindowSensorConfig();
        }

        // Handle smoke detector setup buttons
        const reloadSmokeDetectorSensorsBtn = e.target.closest('#reload-smoke-detector-sensors');
        if (reloadSmokeDetectorSensorsBtn) {
            this.loadSmokeDetectorSetup();
        }

        const saveSmokeDetectorConfigBtn = e.target.closest('#save-smoke-detector-sensor-config');
        if (saveSmokeDetectorConfigBtn) {
            this.saveSmokeDetectorConfig();
        }

        // Handle vibration setup buttons
        const reloadVibrationSensorsBtn = e.target.closest('#reload-vibration-sensors');
        if (reloadVibrationSensorsBtn) {
            this.loadVibrationSetup();
        }

        const saveVibrationConfigBtn = e.target.closest('#save-vibration-sensor-config');
        if (saveVibrationConfigBtn) {
            this.saveVibrationConfig();
        }
        const reloadTemperaturSensorsBtn = e.target.closest('#reload-temperatur-sensors');
        if (reloadTemperaturSensorsBtn) {
            this.loadTemperaturSensorSetup();
        }
        const saveTemperaturSensorConfigBtn = e.target.closest('#save-temperatur-sensor-config');
        if (saveTemperaturSensorConfigBtn) {
            this.saveTemperaturSensorConfig();
        }
        const reloadHumiditySensorsBtn = e.target.closest('#reload-humidity-sensors');
        if (reloadHumiditySensorsBtn) {
            this.loadHumiditySensorSetup();
        }
        const saveHumiditySensorConfigBtn = e.target.closest('#save-humidity-sensor-config');
        if (saveHumiditySensorConfigBtn) {
            this.saveHumiditySensorConfig();
        }
        // Handle room maintenance buttons
        const reloadRoomBtn = e.target.closest('#reload-room-maintenance');
        if (reloadRoomBtn) {
            this.loadRoomMaintenance();
        }

        const saveRoomSensorBtn = e.target.closest('.room-sensor-save-button');
        if (saveRoomSensorBtn) {
            const roomKey = saveRoomSensorBtn.dataset.roomId;
            this.saveRoomCombinedSensor(roomKey);
        }
    });
  }
// Replace the old loadDwdConfig function with this one

async loadDwdConfig() {
  const shadow = this.shadowRoot;
  const statusEl = shadow.getElementById('dwd-config-status');
  const inputEl = shadow.getElementById('dwd-sensor-entity');
  if (!statusEl || !inputEl) return;

  // Use the config object already loaded by loadConfiguration()
  // This is more efficient and avoids potential race conditions.
  const dwdSensor = this._integrationsConfig?.dwd_sensor || '';
  inputEl.value = dwdSensor;
  this._setStatusMessage(statusEl, '✓ Configuration loaded', 'success');
}

async saveDwdConfig() {
    const shadow = this.shadowRoot;
    const statusEl = shadow.getElementById('dwd-config-status');
    const inputEl = shadow.getElementById('dwd-sensor-entity');
    if (!statusEl || !inputEl) return;

    const sensorEntity = inputEl.value.trim();
    if (!this._validateEntityId(sensorEntity)) {
        this._setStatusMessage(statusEl, '✗ Invalid Entity ID format.', 'error');
        return;
    }

    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    try {
        const configToSave = { dwd_sensor: sensorEntity };
        await this._hass.callApi('POST', 'dashview/config', {
            type: 'integrations',
            config: configToSave
        });
        this._setStatusMessage(statusEl, '✓ DWD configuration saved!', 'success');
        
        // Update the running config and refresh the card
        if (!this._integrationsConfig) this._integrationsConfig = {};
        this._integrationsConfig.dwd_sensor = sensorEntity;
        this._watchedEntities.add(sensorEntity); // Start watching the new entity
        this.updateDwdWarningCard();
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error saving DWD config: ${e.message}`, 'error');
    }
}

async updateDwdWarningCard() {
    const shadow = this.shadowRoot;
    if (!shadow || !this._hass) return;

    const containers = shadow.querySelectorAll('.dwd-warning-card-container');
    if (containers.length === 0) return;

    const sensorEntity = this._integrationsConfig?.dwd_sensor;
    if (!sensorEntity) {
        containers.forEach(container => container.innerHTML = '');
        return;
    }

    const dwdState = this._hass.states[sensorEntity];
    if (!dwdState || dwdState.state === '0' || dwdState.state === 'unavailable') {
        containers.forEach(container => container.innerHTML = ''); // Hide card if no warning
        return;
    }

    const template = `
      {% set dwdstate = states('${sensorEntity}') %}
      {% if dwdstate != "unavailable" %}
      {% set dwdcount = state_attr('${sensorEntity}', 'warning_count') | int(0) %}
      {% if dwdcount >= 1 %}
      <ha-alert alert-type="{% if dwdstate | int >= 2 %}error{% else %}warning{% endif %}" title="Wetterwarnung (DWD)">
      {% for i in range(1, dwdcount + 1) %}
        {% set name = state_attr('${sensorEntity}', 'warning_' ~ i ~ '_name') %}
        {% set level = state_attr('${sensorEntity}', 'warning_' ~ i ~ '_level') | int %}
        {% set end_time = state_attr('${sensorEntity}', 'warning_' ~ i ~ '_end') %}
        {% set level_text = {
            0: 'Information vor', 1: 'Warnung vor', 2: 'Warnung vor markantem', 
            3: 'Unwetterwarnung vor', 4: 'Achtung! Extremem Unwetter -'
           }.get(level, 'Warnung vor') 
        %}
        {{ level_text }} {{ name }} bis {{ as_timestamp(end_time) | timestamp_custom('%d.%m %H:%M Uhr') }}.
      {% endfor %}
      <a href="https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html?ort=dreieich" target="_blank" rel="noopener noreferrer" style="color: var(--primary-color); text-decoration: none;">Weitere Informationen</a>
      </ha-alert>
      {% endif %}{% endif %}
    `;

    try {
        const renderedHtml = await this._hass.callApi('POST', 'template', { template });
        const cardModStyle = "margin: 8px; border: none; border-radius: 12px;";
        const content = `<div style="${cardModStyle}">${renderedHtml}</div>`;
        containers.forEach(container => {
            container.innerHTML = content;
        });
    } catch (e) {
        console.error("Error rendering DWD template:", e);
        const errorContent = `<div class="placeholder error">Error rendering DWD warning.</div>`;
        containers.forEach(container => {
            container.innerHTML = errorContent;
        });
    }
}

async loadTemperaturSensorSetup() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('temperatur-setup-status');
    this._setStatusMessage(statusElement, 'Loading temperatur sensors from Home Assistant...', 'loading');

    try {
        const [entitiesByRoom, houseConfig] = await Promise.all([
            this._hass.callApi('GET', `dashview/config?type=entities_by_room&label=${this._entityLabels.TEMPERATUR}`),
            this._hass.callApi('GET', 'dashview/config?type=house')
        ]);

        this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
        this._renderTemperaturSensorSetup(entitiesByRoom, this._adminLocalState.houseConfig);
        this._setStatusMessage(statusElement, '✓ Temperatur sensors loaded successfully', 'success');
    } catch (error) {
        console.error('[DashView] Error loading temperatur sensor setup:', error);
        const errorMessage = error?.error || JSON.stringify(error);
        this._setStatusMessage(statusElement, `✗ Error loading temperatur sensors: ${errorMessage}`, 'error');
    }
}


_renderTemperaturSensorSetup(entitiesByRoom, houseConfig) {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('temperatur-sensors-by-room');
    if (!container) return;
    let html = '';
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
        html = `<div class="placeholder"><p>No sensors with "Temperatur" label found.</p></div>`;
    } else {
        Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
            html += `<div class="room-config"><h6>${areaData.name}</h6><div class="entity-list">`;
            areaData.entities.forEach(entity => {
                const isConfigured = this._isTemperaturSensorConfigured(entity.entity_id, houseConfig);
                const checkedAttr = isConfigured ? 'checked' : '';
                html += `<div class="entity-list-item"><label class="checkbox-label"><input type="checkbox" data-entity-id="${entity.entity_id}" data-room="${areaData.name}" ${checkedAttr}><span class="checkmark"></span>${entity.name}</label><span class="entity-id">${entity.entity_id}</span></div>`;
            });
            html += `</div></div>`;
        });
    }
    container.innerHTML = html;
}

_isTemperaturSensorConfigured(entityId, houseConfig) {
    if (!houseConfig || !houseConfig.rooms) return false;
    return Object.values(houseConfig.rooms).some(room =>
        room.header_entities && room.header_entities.some(headerEntity =>
            headerEntity.entity === entityId && headerEntity.entity_type === 'temperatur'
        )
    );
}

async saveTemperaturSensorConfig() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('temperatur-setup-status');
    const checkboxes = shadow.querySelectorAll('#temperatur-sensors-by-room input[type="checkbox"]');
    this._setStatusMessage(statusElement, 'Saving temperatur sensor configuration...', 'loading');
    try {
        if (!this._adminLocalState.houseConfig) this._adminLocalState.houseConfig = { rooms: {} };
        Object.values(this._adminLocalState.houseConfig.rooms).forEach(room => {
            if (room.header_entities) room.header_entities = room.header_entities.filter(entity => entity.entity_type !== 'temperatur');
        });
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const entityId = checkbox.getAttribute('data-entity-id');
                const roomName = checkbox.getAttribute('data-room');
                let roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);
                if (!this._adminLocalState.houseConfig.rooms[roomKey]) {
                    this._adminLocalState.houseConfig.rooms[roomKey] = { friendly_name: roomName, icon: "mdi:home-outline", floor: "ground_floor", header_entities: [] };
                }
                if (!this._adminLocalState.houseConfig.rooms[roomKey].header_entities) {
                    this._adminLocalState.houseConfig.rooms[roomKey].header_entities = [];
                }
                this._adminLocalState.houseConfig.rooms[roomKey].header_entities.push({ entity: entityId, entity_type: 'temperatur', icon: 'mdi:thermometer' });
            }
        });
        await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
        this._setStatusMessage(statusElement, '✓ Temperatur sensor configuration saved!', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error saving configuration: ${error.message}`, 'error');
    }
}
// In custom_components/dashview/www/dashview-panel.js

// In custom_components/dashview/www/dashview-panel.js

_renderTemperatureGraph(graphContainer, historyData) {
  if (!graphContainer || !historyData || !Array.isArray(historyData) || historyData.length < 2) {
      graphContainer.innerHTML = ''; // Clear if no data or invalid data
      return;
  }

  const temperatures = historyData.map(d => parseFloat(d.state)).filter(t => !isNaN(t));
  if (temperatures.length < 2) {
      graphContainer.innerHTML = ''; // Not enough valid data points to draw a line
      return;
  }

  const minTemp = Math.min(...temperatures);
  const maxTemp = Math.max(...temperatures);
  const tempRange = maxTemp - minTemp || 1;

  const minIndex = temperatures.indexOf(minTemp);
  const maxIndex = temperatures.indexOf(maxTemp);

  const svgWidth = 100;
  const svgHeight = 85;

  const points = historyData.map((d, i) => {
      const x = (i / (historyData.length - 1)) * svgWidth;
      const y = svgHeight - ((parseFloat(d.state) - minTemp) / tempRange) * svgHeight;
      return { x, y };
  });

  // Generate the path for the smoothed line
  let pathD = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
      const x_mid = (points[i].x + points[i+1].x) / 2;
      const y_mid = (points[i].y + points[i+1].y) / 2;
      const cp_x1 = (x_mid + points[i].x) / 2;
      const cp_x2 = (x_mid + points[i+1].x) / 2;
      pathD += ` C ${cp_x1} ${points[i].y}, ${cp_x2} ${points[i+1].y}, ${points[i+1].x} ${points[i+1].y}`;
  }
  const filledPathD = `${pathD} V ${svgHeight} H ${points[0].x} Z`;

  // Create SVG circle elements for each data point
  const pointsSVG = points.map(p =>
    `<circle cx="${p.x}" cy="${p.y}" r="1.5" class="graph-point" />`
  ).join('');

  // Create text labels for the min and max values
  const minLabelY = points[minIndex].y + 6; // Position below the point
  const maxLabelY = points[maxIndex].y - 3; // Position above the point
  const extremaLabelsSVG = `
    <text x="${points[minIndex].x}" y="${minLabelY}" class="graph-label-extrema" text-anchor="middle">${minTemp.toFixed(1)}°</text>
    <text x="${points[maxIndex].x}" y="${maxLabelY}" class="graph-label-extrema" text-anchor="middle">${maxTemp.toFixed(1)}°</text>
  `;

  // Set the new SVG content
  graphContainer.innerHTML = `
      <svg viewBox="0 0 ${svgWidth} ${svgHeight}" preserveAspectRatio="none" style="width: 100%; height: 100%; overflow: visible;">
          <defs>
              <linearGradient id="graph-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" style="stop-color:var(--blue); stop-opacity:0.4" />
                  <stop offset="100%" style="stop-color:var(--blue); stop-opacity:0.05" />
              </linearGradient>
          </defs>
          <path d="${filledPathD}" class="graph-fill" />
          <path d="${pathD}" class="graph-path" />
          ${pointsSVG}
          ${extremaLabelsSVG}
      </svg>
  `;
}// Add this new method to the DashviewPanel class
async updateThermostatCard(popup, roomKey) {
  if (!this._hass || !this._houseConfig.rooms || !roomKey) return;

  const roomConfig = this._houseConfig.rooms[roomKey];
  const card = popup.querySelector('.thermostat-card');
  if (!roomConfig || !card) return;

  // Find temperature and humidity sensors configured for the room
  const tempSensorConfig = roomConfig.header_entities?.find(e => e.entity_type === 'temperatur');
  const humSensorConfig = roomConfig.header_entities?.find(e => e.entity_type === 'humidity');
  const tempEntityId = tempSensorConfig?.entity;
  const humEntityId = humSensorConfig?.entity;

  const tempElement = card.querySelector('.temperature');
  const humElement = card.querySelector('.humidity');
  const nameElement = card.querySelector('.thermostat-name');

  // Set the room name on the card
  nameElement.textContent = roomConfig.friendly_name || roomKey;

  // Update the temperature value
  if (tempEntityId && this._hass.states[tempEntityId]) {
      const tempState = this._hass.states[tempEntityId];
      const tempValue = parseFloat(tempState.state);

      if (!isNaN(tempValue)) {
          tempElement.textContent = `${tempValue.toFixed(1)}°`;
      } else {
          tempElement.textContent = '--°';
      }

      // Fetch history for the graph using the backend endpoint
      try {
          const history = await this._hass.callApi('GET', `dashview/config?type=history&entity_id=${tempEntityId}`);
          const graphContainer = card.querySelector('.thermostat-graph');
          if (history && graphContainer) {
              this._renderTemperatureGraph(graphContainer, history);
          }
      } catch (e) {
          console.error("Error fetching history for thermostat graph:", e);
      }

  } else {
      tempElement.textContent = '--°';
  }

  // Update the humidity value
  if (humEntityId && this._hass.states[humEntityId]) {
      const humState = this._hass.states[humEntityId];
      const humValue = parseFloat(humState.state);
      if (!isNaN(humValue)) {
          humElement.textContent = `${Math.round(humValue)}%`;
      } else {
          humElement.textContent = '--%';
      }
  } else {
      humElement.textContent = '--%';
  }
}
// END: Add Temperatur Sensor Functions

// START: Add Humidity Sensor Functions
async loadHumiditySensorSetup() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('humidity-setup-status');
    this._setStatusMessage(statusElement, 'Loading humidity sensors from Home Assistant...', 'loading');
    try {
        const [entitiesByRoom, houseConfig] = await Promise.all([
            this._hass.callApi('GET', `dashview/config?type=entities_by_room&label=${this._entityLabels.HUMIDITY}`),
            this._hass.callApi('GET', 'dashview/config?type=house')
        ]);
        this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
        this._renderHumiditySensorSetup(entitiesByRoom, this._adminLocalState.houseConfig);
        this._setStatusMessage(statusElement, '✓ Humidity sensors loaded successfully', 'success');
    } catch (error) {
        console.error('[DashView] Error loading humidity sensor setup:', error);
        const errorMessage = error?.error || JSON.stringify(error);
        this._setStatusMessage(statusElement, `✗ Error loading humidity sensors: ${errorMessage}`, 'error');
    }
}


_renderHumiditySensorSetup(entitiesByRoom, houseConfig) {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('humidity-sensors-by-room');
    if (!container) return;
    let html = '';
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
        html = `<div class="placeholder"><p>No sensors with "Humidity" label found.</p></div>`;
    } else {
        Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
            html += `<div class="room-config"><h6>${areaData.name}</h6><div class="entity-list">`;
            areaData.entities.forEach(entity => {
                const isConfigured = this._isHumiditySensorConfigured(entity.entity_id, houseConfig);
                const checkedAttr = isConfigured ? 'checked' : '';
                html += `<div class="entity-list-item"><label class="checkbox-label"><input type="checkbox" data-entity-id="${entity.entity_id}" data-room="${areaData.name}" ${checkedAttr}><span class="checkmark"></span>${entity.name}</label><span class="entity-id">${entity.entity_id}</span></div>`;
            });
            html += `</div></div>`;
        });
    }
    container.innerHTML = html;
}

_isHumiditySensorConfigured(entityId, houseConfig) {
    if (!houseConfig || !houseConfig.rooms) return false;
    return Object.values(houseConfig.rooms).some(room =>
        room.header_entities && room.header_entities.some(headerEntity =>
            headerEntity.entity === entityId && headerEntity.entity_type === 'humidity'
        )
    );
}

async saveHumiditySensorConfig() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('humidity-setup-status');
    const checkboxes = shadow.querySelectorAll('#humidity-sensors-by-room input[type="checkbox"]');
    this._setStatusMessage(statusElement, 'Saving humidity sensor configuration...', 'loading');
    try {
        if (!this._adminLocalState.houseConfig) this._adminLocalState.houseConfig = { rooms: {} };
        Object.values(this._adminLocalState.houseConfig.rooms).forEach(room => {
            if (room.header_entities) room.header_entities = room.header_entities.filter(entity => entity.entity_type !== 'humidity');
        });
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const entityId = checkbox.getAttribute('data-entity-id');
                const roomName = checkbox.getAttribute('data-room');
                let roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);
                if (!this._adminLocalState.houseConfig.rooms[roomKey]) {
                    this._adminLocalState.houseConfig.rooms[roomKey] = { friendly_name: roomName, icon: "mdi:home-outline", floor: "ground_floor", header_entities: [] };
                }
                if (!this._adminLocalState.houseConfig.rooms[roomKey].header_entities) {
                    this._adminLocalState.houseConfig.rooms[roomKey].header_entities = [];
                }
                this._adminLocalState.houseConfig.rooms[roomKey].header_entities.push({ entity: entityId, entity_type: 'humidity', icon: 'mdi:water-percent' });
            }
        });
        await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
        this._setStatusMessage(statusElement, '✓ Humidity sensor configuration saved!', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error saving configuration: ${error.message}`, 'error');
    }
}  
  // Method to update weather components
  // Main entry point to update all weather components in the popup
  async updateWeatherComponents(shadow) {
    if (!this._hass) return;
    
    // Fetch fresh forecast data first
    await this._fetchWeatherForecasts();

    const weatherEntityId = this._getCurrentWeatherEntityId();
    const weatherState = this._hass.states[weatherEntityId];
    if (!weatherState) return;

    // Update the various parts of the popup
    this.updateCurrentWeather(shadow, weatherState);
    this.updateHourlyForecast(shadow, this._weatherForecasts.hourly);
    this.initializeDailyForecast(shadow, this._weatherForecasts.daily);
    this.updateDwdWarningCard();
  }

  // Method to update current weather display
  updateCurrentWeather(shadow, weatherState) {
    // By using querySelector with the '#' to indicate an ID, this code will now
    // work correctly whether 'shadow' is the shadowRoot or a regular element.
    const iconElement = shadow.querySelector('#current-weather-icon');
    const tempElement = shadow.querySelector('#current-temperature');
    const conditionElement = shadow.querySelector('#current-condition');
    const feelsLikeElement = shadow.querySelector('#feels-like-temp');
    const humidityElement = shadow.querySelector('#humidity');
    const windElement = shadow.querySelector('#wind-speed');

    if (iconElement && weatherState.state) {
      iconElement.src = `/local/weather_icons/${weatherState.state}.svg`;
      iconElement.alt = weatherState.state;
    }

    if (tempElement && weatherState.attributes.temperature) {
      tempElement.textContent = `${Math.round(weatherState.attributes.temperature)}°C`;
    }

    if (conditionElement) {
      conditionElement.textContent = this.translateWeatherCondition(weatherState.state);
    }

    if (feelsLikeElement && weatherState.attributes.apparent_temperature) {
      feelsLikeElement.textContent = `${Math.round(weatherState.attributes.apparent_temperature)}°C`;
    }

    if (humidityElement && weatherState.attributes.humidity) {
      humidityElement.textContent = `${weatherState.attributes.humidity}%`;
    }

    if (windElement && weatherState.attributes.wind_speed) {
      windElement.textContent = `${Math.round(weatherState.attributes.wind_speed)} km/h`;
    }
  }

  // This function is now simpler, just rendering the data it's given
  updateHourlyForecast(shadow, hourlyData) {
    const container = shadow.querySelector('#hourly-forecast');
    if (!container || !hourlyData) return;

    container.innerHTML = '';
    
    const next8Hours = hourlyData.slice(0, 8);
    
    next8Hours.forEach(forecast => {
      const hourlyItem = document.createElement('div');
      hourlyItem.className = 'hourly-item';
      const date = new Date(forecast.datetime);
      const timeString = date.getHours().toString().padStart(2, '0') + ':00';
      
      hourlyItem.innerHTML = `
        <div class="hourly-time">${timeString}</div>
        <div class="hourly-icon">
          <img src="/local/weather_icons/${forecast.condition}.svg" alt="${forecast.condition}" width="32" height="32">
        </div>
        <div class="hourly-temp">${Math.round(forecast.temperature)}°</div>
      `;
      container.appendChild(hourlyItem);
    });
  }

  // This function now correctly sets up the click events
// This function now correctly sets up the click events
  initializeDailyForecast(shadow, dailyData) {
    const tabs = shadow.querySelectorAll('.forecast-tab');
    const content = shadow.querySelector('#daily-forecast-content');
    
    // FIX: Add a check to ensure elements exist before proceeding
    if (!tabs.length || !content) {
      console.error('[DashView] Daily forecast tabs or content container not found.');
      return;
    }

    // This function will be called by the event listeners and for the initial render.
    const updateForecastDisplay = (dayIndex) => {
        // First, update the active state on the tabs
        tabs.forEach(t => {
            t.classList.toggle('active', parseInt(t.dataset.day) === dayIndex);
        });

        // Now, render the content based on the selected day
        this.showDailyForecast(content, dailyData, dayIndex);
    };

    // Always attach click listeners so the tabs are interactive.
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const dayIndex = parseInt(tab.dataset.day);
        updateForecastDisplay(dayIndex);
      });
    });

    // Explicitly render the initial state for "Heute" (day 0)
    // This replaces the problematic tabs[0].click()
    updateForecastDisplay(0);
  }

  // This function now correctly renders the selected day's forecast
  showDailyForecast(container, dailyData, dayIndex) {
    if (!dailyData || dailyData.length <= dayIndex) {
      container.innerHTML = '<div>Keine Daten verfügbar</div>';
      return;
    }

    const dayForecast = dailyData[dayIndex];

    container.innerHTML = `
      <div class="daily-forecast">
        <div class="daily-icon">
          <img src="/local/weather_icons/${dayForecast.condition}.svg" alt="${dayForecast.condition}" width="50" height="50">
        </div>
        <div class="daily-info">
          <div class="daily-condition">${this.translateWeatherCondition(dayForecast.condition)}</div>
          <div class="daily-temps">
            <span class="daily-high">${Math.round(dayForecast.temperature)}°C</span>
            <span class="daily-low">${dayForecast.templow ? Math.round(dayForecast.templow) + '°C' : ''}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Helper method to get daily forecast data
  getDailyForecast(forecastData, dayIndex) {
    if (!forecastData || dayIndex < 0) return null;

    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + dayIndex);
    targetDate.setHours(12, 0, 0, 0); // Use noon time for daily forecast

    // Find the forecast closest to noon of the target day
    let closestForecast = null;
    let minTimeDiff = Infinity;

    forecastData.forEach(forecast => {
      const forecastDate = new Date(forecast.datetime);
      const timeDiff = Math.abs(forecastDate.getTime() - targetDate.getTime());
      
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestForecast = forecast;
      }
    });

    return closestForecast;
  }

  // Helper method to translate weather conditions to German
  translateWeatherCondition(condition) {
    const translations = {
      'clear-night': 'Klare Nacht',
      'cloudy': 'Bewölkt',
      'fog': 'Nebel',
      'hail': 'Hagel',
      'lightning': 'Gewitter',
      'lightning-rainy': 'Gewitter mit Regen',
      'partlycloudy': 'Teilweise bewölkt',
      'pouring': 'Stark regnerisch',
      'rainy': 'Regnerisch',
      'snowy': 'Schnee',
      'snowy-rainy': 'Schneeregen',
      'sunny': 'Sonnig',
      'windy': 'Windig',
      'windy-variant': 'Windig'
    };
    
    return translations[condition] || condition;
  }
  
  // Update Pollen Card with sensor data
  updatePollenCard(shadow) {
    const pollenButtons = shadow.querySelectorAll('.pollen-button');
    if (!pollenButtons || pollenButtons.length === 0) return;
    
    pollenButtons.forEach(button => {
      const sensorId = button.getAttribute('data-sensor');
      const sensorEntity = this._hass.states[sensorId];
      
      if (sensorEntity) {
        const sensorValue = parseFloat(sensorEntity.state) || 0;
        const nameElement = button.querySelector('.pollen-name');
        const stateElement = button.querySelector('.pollen-state');
        
        // Determine state text based on sensor value
        let stateText = 'n/a';
        if (sensorValue === 0) {
          stateText = 'n/a';
        } else if (sensorValue < 2) {
          stateText = 'Niedrig';
        } else if (sensorValue < 3) {
          stateText = 'Moderat';
        } else {
          stateText = 'Hoch';
        }
        
        // Update state text
        stateElement.textContent = stateText;
        
        // Determine background color based on sensor value
        let backgroundColor = '#dddddd'; // Default gray
        if (sensorValue === 0) {
          backgroundColor = '#dddddd';
        } else if (sensorValue < 2) {
          backgroundColor = '#d6f5d6'; // Light green
        } else if (sensorValue < 3) {
          backgroundColor = '#fff4cc'; // Light yellow
        } else {
          backgroundColor = '#f8d0d0'; // Light red
        }
        
        // Update button styling
        button.style.backgroundColor = backgroundColor;
        
        // Show/hide button based on sensor value
        if (sensorValue > 0) {
          button.style.display = 'flex';
        } else {
          button.style.display = 'none';
        }
      } else {
        // If sensor doesn't exist, hide the button
        button.style.display = 'none';
      }
    });
  }
  
  // Check if entity is a room header entity
  _isRoomHeaderEntity(entityId) {
    if (!this._houseConfig || !this._houseConfig.rooms) return false;
    
    return Object.values(this._houseConfig.rooms).some(roomConfig => {
      return roomConfig.header_entities && roomConfig.header_entities.some(entityConfig => {
        return entityConfig.entity === entityId;
      });
    });
  }
  
  // Update room header icons - Principle 3
  updateRoomHeaderIcons(shadow) {
    if (!this._houseConfig || !this._houseConfig.rooms) return;
    
    const roomHeaderIconsContainer = shadow.querySelector('.room-header-cards');
    if (!roomHeaderIconsContainer) return;
    
    // Generate room header cards for all active rooms
    const roomCardsHTML = this._generateRoomHeaderCards();
    roomHeaderIconsContainer.innerHTML = roomCardsHTML;
  }

  // Update room header entities in active popups
  updateRoomHeaderEntitiesInPopups(shadow, changedEntityId) {
    if (!this._houseConfig || !this._houseConfig.rooms) return;

    // Find which room the entity belongs to
    let roomKey = null;
    Object.entries(this._houseConfig.rooms).forEach(([key, roomConfig]) => {
      if (roomConfig.header_entities && roomConfig.header_entities.some(e => e.entity === changedEntityId)) {
        roomKey = key;
      }
    });

    if (!roomKey) return;

    // Check if the room popup is currently active
    const roomPopup = shadow.querySelector(`#${roomKey}-popup`);
    if (roomPopup && roomPopup.classList.contains('active')) {
      // Re-render the room header entities in this popup
      const roomConfig = this._houseConfig.rooms[roomKey];
      const roomHeaderEntitiesHTML = this._generateRoomHeaderEntitiesForPopup(roomConfig);
      
      const existingContainer = roomPopup.querySelector('.room-header-entities');
      if (existingContainer) {
        existingContainer.outerHTML = roomHeaderEntitiesHTML || '';
      } else if (roomHeaderEntitiesHTML) {
        // Add as first child of popup body
        const popupBody = roomPopup.querySelector('.popup-body');
        if (popupBody) {
          const container = document.createElement('div');
          container.innerHTML = roomHeaderEntitiesHTML;
          popupBody.insertBefore(container, popupBody.firstChild);
        }
      }
    }
  }
  
  // Generate room header cards for active rooms
  _generateRoomHeaderCards() {
    if (!this._houseConfig || !this._houseConfig.rooms) return '';
    
    const activeRooms = this._getActiveRooms();
    if (activeRooms.length === 0) return '<div class="no-activity">No active rooms with entities</div>';
    
    return activeRooms.map(room => {
      const iconsHTML = this._generateRoomIcons(room.config);
      // If iconsHTML is empty, create the fallback message.
      const containerContent = iconsHTML 
          ? iconsHTML 
          : `<div class="no-activity" style="text-align: left; padding: 0 8px; width: 100%;">No active header entities for ${room.config.friendly_name}</div>`;
      
      return `
        <div class="room-header-card" data-room="${room.key}">
          <div class="room-name">${room.config.friendly_name}</div>
          <div class="room-icons-container">
            ${containerContent}
          </div>
        </div>
      `;
    }).join('');
  }
  
  // Get active rooms (rooms with active sensors or room header entities)
  _getActiveRooms() {
    if (!this._houseConfig || !this._houseConfig.rooms) return [];
    
    return Object.entries(this._houseConfig.rooms)
      .filter(([roomKey, roomConfig]) => {
        // Check if room has combined sensor active
        const sensorEntity = this._hass.states[roomConfig.combined_sensor];
        const isRoomActive = sensorEntity && sensorEntity.state === 'on';
        
        // Or check if room has header entities configured
        const hasHeaderEntities = roomConfig.header_entities && 
                                  Array.isArray(roomConfig.header_entities) && 
                                  roomConfig.header_entities.length > 0;
        
        return isRoomActive || hasHeaderEntities;
      })
      .map(([roomKey, roomConfig]) => ({ key: roomKey, config: roomConfig }));
  }
  
  // Generate room icons HTML
  _generateRoomIcons(roomConfig) {
    if (!roomConfig.header_entities || !Array.isArray(roomConfig.header_entities)) {
      return '';
    }
    
    return roomConfig.header_entities.map(entityConfig => {
      const entity = this._hass.states[entityConfig.entity];
      const iconClass = this._getIconForEntityType(entityConfig.entity_type);
      const stateClass = this._getStateClassForEntity(entity, entityConfig.entity_type);
      
      return `
        <div class="room-header-icon ${entityConfig.entity_type} ${stateClass}" 
             data-entity="${entityConfig.entity}" 
             data-type="${entityConfig.entity_type}"
             title="${entityConfig.entity}">
          <i class="mdi ${iconClass}"></i>
        </div>
      `;
    }).join('');
  }

  // Generate room header entities for popup using the new format specification
  _generateRoomHeaderEntitiesForPopup(roomConfig) {
    if (!roomConfig.header_entities || !Array.isArray(roomConfig.header_entities)) {
      return '';
    }

    // Filter to only show active/relevant entities based on display logic
    const activeEntities = roomConfig.header_entities.filter(entityConfig => {
      const entity = this._hass.states[entityConfig.entity];
      if (!entity) return false;
      
      return this._shouldDisplayHeaderEntity(entity, entityConfig.entity_type);
    });

    if (activeEntities.length === 0) {
      return '';
    }

    // Generate the horizontal stack of entity cards
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
            <i class="mdi ${icon}"></i>
          </div>
          <div class="chip-name" style="color: ${textColor};">${name}</div>
        </div>
      `;
    }).join('');

    return `
      <div class="room-header-entities">
        <div class="header-entities-container">
          ${entityCards}
        </div>
      </div>
    `;
  }
  
  // Get icon for entity type
  _getIconForEntityType(entityType) {
    const iconMap = {
      'motion': 'mdi-motion-sensor',
      'window': 'mdi-window-open',
      'smoke': 'mdi-smoke-detector',
      'vibration': 'mdi-vibrate',
      'music': 'mdi-music',
      'tv': 'mdi-television',
      'dishwasher': 'mdi-dishwasher',
      'washing': 'mdi-washing-machine',
      'dryer': 'mdi-tumble-dryer',
      'freezer': 'mdi-fridge-outline',
      'mower': 'mdi-robot-mower'
    };
    return iconMap[entityType] || 'mdi-help-circle';
  }
  
  // Get state class for entity
  _getStateClassForEntity(entity, entityType) {
    if (!entity) return 'unknown';
    
    // Handle different entity types
    switch (entityType) {
      case 'motion':
      case 'window':
      case 'smoke':
      case 'vibration':
        return entity.state === 'on' ? 'active' : 'inactive';
      case 'music':
      case 'tv':
        return ['playing', 'on'].includes(entity.state) ? 'active' : 'inactive';
      case 'dishwasher':
      case 'washing':
        return ['Run', 'run', 'running'].includes(entity.state) ? 'active' : 'inactive';
      case 'dryer':
        return entity.state === 'on' ? 'active' : 'inactive';
      case 'freezer':
        return entity.state === 'on' ? 'active' : 'inactive';  // Door alarm
      case 'mower':
        return ['mowing', 'cutting'].includes(entity.state) ? 'active' : 'inactive';
      default:
        return entity.state === 'on' ? 'active' : 'inactive';
    }
  }

  // Determine if header entity should be displayed based on the template logic
  _shouldDisplayHeaderEntity(entity, entityType) {
    if (!entity) return false;

    const state = entity.state;
    
    switch (entityType) {
      case 'motion':
        return true; // Always show motion sensors
      case 'music':
      case 'tv':
        return state === 'playing';
      case 'dishwasher':
      case 'washing':
        return ['Run', 'run', 'running'].includes(state);
      case 'freezer':
        // Check for alarm states
        const doorAlarm = this._hass.states['sensor.gefrierschrank_door_alarm_freezer']?.state;
        const tempAlarm = this._hass.states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
        return (doorAlarm === 'present' || tempAlarm === 'present');
      case 'mower':
        const error = entity.attributes?.error;
        return ['cleaning', 'error'].includes(state) && error !== 'OFF_DISABLED';
      default:
        return state === 'on';
    }
  }

  // Get display name for header entity based on template logic
  _getHeaderEntityName(entity, entityType) {
    if (!entity) return '–';

    switch (entityType) {
      case 'dishwasher':
        const remaining = this._hass.states['sensor.geschirrspuler_remaining_program_time'];
        if (!remaining || !remaining.state || ['unknown', 'unavailable'].includes(remaining.state)) {
          return 'Unknown';
        }
        const end = new Date(remaining.state).getTime();
        const now = new Date().getTime();
        const diffMin = Math.round((end - now) / 60000);
        return diffMin > 0 ? `in ${diffMin}m` : 'Ready';

      case 'motion':
        const lastChanged = new Date(entity.last_changed);
        const currentTime = new Date();
        const diffSec = Math.floor((currentTime - lastChanged) / 1000);
        if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
        if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
        return `${Math.floor(diffSec / 86400)}d ago`;

      case 'mower':
        const state = entity.state;
        const error = entity.attributes?.error;

        const errorMessages = {
          'Wheel motor blocked': 'Radmotor blockiert',
          'Wheel motor overloaded': 'Radmotor überlastet',
          'Cutting system blocked': 'Mähwerk blockiert',
          'No loop signal': 'Kein Schleifensignal',
          'Upside down': 'Mäher umgekippt',
          'Battery problem': 'Batterieproblem',
          'Collision sensor problem': 'Kollisionssensor defekt',
          'Lift sensor problem': 'Anhebesensor defekt',
          'Charging station blocked': 'Ladestation blockiert',
          'Outside working area': 'Außerhalb des Arbeitsbereichs',
          'Trapped': 'Mäher festgefahren',
          'Low battery': 'Batterie fast leer',
          'OFF_HATCH_CLOSED': 'Klappe offen'
        };

        const stateDescriptions = {
          'cleaning': 'Mäht',
          'error': errorMessages[error] || 'Fehler',
          'returning': 'Fährt zur Ladestation',
          'paused': 'Pause',
          'docked': 'Geparkt',
          'idle': 'Bereit'
        };

        return stateDescriptions[state] || state;

      default:
        return entity.attributes?.friendly_name || '–';
    }
  }

  // Get icon for header entity based on template logic
  _getHeaderEntityIcon(entity, entityType) {
    switch (entityType) {
      case 'motion':
        return entity.state === 'off' ? 'mdi-motion-sensor-off' : 'mdi-motion-sensor';
      case 'window':
        return 'mdi-window-open-variant';
      case 'smoke':
        return 'mdi-smoke-detector-variant-alert';
      case 'music':
        return 'mdi-music-note';
      case 'tv':
        return 'mdi-television-play';
      case 'dishwasher':
        return 'mdi-dishwasher';
      case 'freezer':
        const doorAlarm = this._hass.states['sensor.gefrierschrank_door_alarm_freezer']?.state;
        const tempAlarm = this._hass.states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
        return (doorAlarm === 'present' || tempAlarm === 'present') ? 'mdi-alert-circle' : 'mdi-fridge';
      case 'mower':
        return 'mdi-robot-mower';
      default:
        return 'mdi-help-circle-outline';
    }
  }

  // Get background color for header entity based on template logic
  _getHeaderEntityBackground(entity, entityType) {
    if (entityType === 'smoke') return 'var(--red)';
    
    if (entityType === 'freezer') {
      const doorAlarm = this._hass.states['sensor.gefrierschrank_door_alarm_freezer']?.state;
      const tempAlarm = this._hass.states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
      return (doorAlarm === 'present' || tempAlarm === 'present') ? 'var(--active-big)' : 'transparent';
    }
    
    if (entityType === 'mower') {
      return entity.state === 'error' ? 'var(--red)' : 'var(--active-big)';
    }
    
    if (entityType === 'motion') {
      return entity.state === 'off' ? 'var(--gray000)' : 'var(--active-big)';
    }
    
    return 'var(--active-big)';
  }

  // Get text color for header entity based on template logic
  _getHeaderEntityTextColor(entity, entityType) {
    if (entityType === 'motion' && entity.state === 'off') {
      return 'var(--gray800)';
    }
    return 'var(--gray000)';
  }
  
  // Popup icon mapping for different popup types
  getPopupIconForType(popupType) {
    // For rooms, the icon MUST come from the house config - Principle 13
    if (this._houseConfig && this._houseConfig.rooms && this._houseConfig.rooms[popupType]) {
      return this._processIconName(this._houseConfig.rooms[popupType].icon);
    }

    // Keep a fallback map ONLY for non-room popups (e.g., system views)
    const iconMap = {
      'security': 'mdi-security',
      'weather': 'mdi-weather-partly-cloudy',
      'music': 'mdi-music',
      'admin': 'mdi-cog',
      'calendar': 'mdi-calendar',
      'settings': 'mdi-cog',
      'bahn': 'mdi-train'
    };
    return iconMap[popupType] || 'mdi-help-circle';
  }

  // Get popup title for different popup types
  getPopupTitleForType(popupType) {
    // For rooms, the title MUST come from the house config - Principle 13
    if (this._houseConfig && this._houseConfig.rooms && this._houseConfig.rooms[popupType]) {
      return this._houseConfig.rooms[popupType].friendly_name;
    }

    // Keep a fallback map ONLY for non-room popups (e.g., system views)
    const titleMap = {
      'security': 'Sicherheit',
      'weather': 'Wetter',
      'music': 'Medien',
      'admin': 'Admin View',
      'calendar': 'Kalender',
      'settings': 'Einstellungen',
      'bahn': 'Bahn'
    };
    return titleMap[popupType] || popupType.charAt(0).toUpperCase() + popupType.slice(1);
  }

  // Create popup using template
  createPopupFromTemplate(popupId, popupType, content) {
    const context = this.shadowRoot;
    const template = context.querySelector('#popup-template');
    if (!template) {
      console.error('[DashView] Popup template not found');
      return null;
    }

    // Create popup container
    const popup = document.createElement('div');
    popup.id = popupId;
    popup.className = 'popup';

    // Clone template content
    const templateContent = template.content.cloneNode(true);
    
    // Set icon and title
    const iconElement = templateContent.querySelector('.popup-icon');
    const titleElement = templateContent.querySelector('.popup-title');
    const bodyElement = templateContent.querySelector('.popup-body');
    
    iconElement.className = `popup-icon mdi ${this.getPopupIconForType(popupType)}`;
    titleElement.textContent = this.getPopupTitleForType(popupType);
    bodyElement.innerHTML = content;

    // Check if the room has covers and inject the card
const roomConfig = this._houseConfig && this._houseConfig.rooms ? this._houseConfig.rooms[popupType] : null;
    if (roomConfig) { // Check if the popup corresponds to a configured room
        // Add room header entities first (just under the header)
        const roomHeaderEntitiesHTML = this._generateRoomHeaderEntitiesForPopup(roomConfig);
        if (roomHeaderEntitiesHTML) {
            const headerEntitiesContainer = document.createElement('div');
            headerEntitiesContainer.innerHTML = roomHeaderEntitiesHTML;
            bodyElement.appendChild(headerEntitiesContainer);
        }

        // --- CORRECTED COVERS BLOCK ---
        if (roomConfig.covers && roomConfig.covers.length > 0) {
            fetch('/local/dashview/templates/room-covers-card.html')
                .then(response => response.text())
                .then(html => {
                    const coversContainer = document.createElement('div');
                    coversContainer.innerHTML = html;
                    bodyElement.appendChild(coversContainer);
                    // Initialize the content that was just added to fix the race condition.
                    this._initializeDynamicContent(coversContainer);
                }).catch(err => console.error('[DashView] Error loading covers card template:', err));
        } 
        
        // --- CORRECTED LIGHTS BLOCK ---
        if (roomConfig.lights && roomConfig.lights.length > 0) {
            fetch('/local/dashview/templates/room-lights-card.html')
                .then(response => response.text())
                .then(html => {
                    const lightsContainer = document.createElement('div');
                    lightsContainer.innerHTML = html;
                    bodyElement.appendChild(lightsContainer);
                    // Initialize the content that was just added to fix the race condition.
                    this._initializeDynamicContent(lightsContainer);
                }).catch(err => console.error('[DashView] Error loading lights card template:', err));
        }
        const hasTempSensor = roomConfig.header_entities?.some(e => e.entity_type === 'temperatur');
        const hasHumSensor = roomConfig.header_entities?.some(e => e.entity_type === 'humidity');
    
        if (hasTempSensor || hasHumSensor) {
            fetch('/local/dashview/templates/room-thermostat-card.html')
                .then(response => response.text())
                .then(html => {
                    const thermostatContainer = document.createElement('div');
                    thermostatContainer.innerHTML = html;
                    bodyElement.appendChild(thermostatContainer);
                    // Initialize the new content
                    this._initializeDynamicContent(thermostatContainer);
                }).catch(err => console.error('[DashView] Error loading thermostat card template:', err));
        }
        
        // --- CORRECTED MEDIA PLAYER BLOCK ---
        if (roomConfig.media_players && roomConfig.media_players.length > 0) {
            fetch('/local/dashview/templates/room-media-player-card.html')
                .then(response => response.text())
                .then(html => {
                    const mediaPlayerContainer = document.createElement('div');
                    mediaPlayerContainer.innerHTML = html;
                    bodyElement.appendChild(mediaPlayerContainer);
                    // Initialize the content that was just added to fix the race condition.
                    this._initializeDynamicContent(mediaPlayerContainer);
                }).catch(err => console.error('[DashView] Error loading media player card template:', err));
        }
    }

    popup.appendChild(templateContent);
    context.appendChild(popup);
    
    return popup;
  }

  // Close popup function
  closePopup() {
    const context = this.shadowRoot;
    const activePopup = context.querySelector('.popup.active');
    if (activePopup) {
      activePopup.classList.remove('active');
      // Restore body scrolling when popup is closed
      document.body.classList.remove('popup-open');
      // Update URL to home without triggering hashchange event
      if (window.location.hash !== '#home') {
        history.replaceState(null, null, '#home');
      }
      // Update nav button states
      context.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));
      const homeButton = context.querySelector('.nav-button[data-hash="#home"]');
      if (homeButton) {
        homeButton.classList.add('active');
      }
    }
  }

  // Generic Content Initialization Dispatcher - Systemic popup initialization fix
  _initializeDynamicContent(container) {
    if (!container) return;
    console.log(`[DashView] Initializing dynamic content in`, container);

    for (const [selector, initializer] of Object.entries(this._componentInitializers)) {
      const elements = container.querySelectorAll(selector);
      if (elements.length > 0) {
        console.log(`[DashView] Found dynamic component(s) with selector: ${selector}`);
        elements.forEach(element => {
          try {
            // Call the registered initializer function for the found element
            initializer(element);
          } catch (error) {
            console.error(`[DashView] Error initializing component for selector "${selector}":`, error);
          }
        });
      }
    }
  }

  async reinitializePopupContent(popup) {
    if (!this._houseConfig || Object.keys(this._houseConfig).length === 0) {
      await this.loadConfiguration();
    }

    const closeBtn = popup.querySelector('.popup-close');
    if (closeBtn) {
      closeBtn.onclick = () => this.closePopup();
    }
    popup.querySelectorAll('.tabs-container').forEach(container => {
      const tabButtons = container.querySelectorAll('.tab-button');
      const tabContents = container.querySelectorAll('.tab-content');
      tabButtons.forEach(button => {
        button.addEventListener('click', () => {
          const targetId = button.getAttribute('data-target');
          tabButtons.forEach(btn => btn.classList.remove('active'));
          button.classList.add('active');
          tabContents.forEach(content => content.classList.toggle('active', content.id === targetId));
          
          // Keep existing tab logic for admin panel
          if (targetId === 'house-setup-tab') {
            setTimeout(() => this.loadAdminConfiguration(), 100);
          }
          if (targetId === 'integrations-tab') {
            setTimeout(() => this.loadDwdConfig(), 100);
          }
          if (targetId === 'motion-setup-tab') {
            setTimeout(() => this.loadMotionSensorSetup(), 100);
          }
          if (targetId === 'cover-setup-tab') {
            setTimeout(() => this.loadCoverSetup(), 100);
          }
          if (targetId === 'light-setup-tab') {
            setTimeout(() => this.loadLightSetup(), 100);
          }
          if (targetId === 'window-setup-tab') {
            setTimeout(() => this.loadWindowSensorSetup(), 100);
          }
          if (targetId === 'smoke-detector-setup-tab') {
            setTimeout(() => this.loadSmokeDetectorSetup(), 100);
          }
          if (targetId === 'vibration-setup-tab') {
            setTimeout(() => this.loadVibrationSetup(), 100);
          }
          if (targetId === 'header-buttons-tab') {
            setTimeout(() => this.loadAdminConfiguration(), 100);
          }
          if (targetId === 'temperatur-setup-tab') {
            setTimeout(() => this.loadTemperaturSensorSetup(), 100);
            // Add this line to load the threshold values
            setTimeout(() => this.loadThresholdsConfig(), 100);
          }
          if (targetId === 'humidity-setup-tab') {
              setTimeout(() => this.loadHumiditySensorSetup(), 100);
          }  
          if (targetId === 'room-maintenance-tab') {
            setTimeout(() => this.loadRoomMaintenance(), 100);
          }
          if (targetId === 'media-player-maintenance-tab') {
            setTimeout(() => this.loadRoomMediaPlayerMaintenance(), 100);
          }
          if (targetId === 'weather-tab') {
            setTimeout(() => this.loadWeatherEntityConfiguration(), 100);
          }
        });
      });
      if(tabButtons.length > 0) tabButtons[0].click();
    });

    // --- REPLACED old patch logic with a single call to the new dispatcher ---
    this._initializeDynamicContent(popup);
  }

  // Force refresh all entities within a popup - Issue #75 fix
  _forceRefreshPopupEntities(popup) {
    if (!this._hass || !popup) return;
    
    const shadow = this.shadowRoot;
    if (!shadow) return;
    
    // Get the popup ID to determine which entities to refresh
    const popupId = popup.id;
    
    try {
      // Weather popup entities
      if (popupId === 'weather-popup') {
        const weatherEntityId = this._getCurrentWeatherEntityId();
        console.log(`[DashView] Force refreshing weather popup entities`);
        
        // Update weather components immediately
        this._updateComponentForEntity(weatherEntityId);
        
        // Update pollen card entities
        const pollenEntities = [
          'sensor.pollenflug_birke_92',
          'sensor.pollenflug_erle_92', 
          'sensor.pollenflug_hasel_92',
          'sensor.pollenflug_esche_92',
          'sensor.pollenflug_roggen_92',
          'sensor.pollenflug_graeser_92',
          'sensor.pollenflug_beifuss_92',
          'sensor.pollenflug_ambrosia_92'
        ];
        
        pollenEntities.forEach(entityId => {
          this._updateComponentForEntity(entityId);
        });
      }
      
      // Security popup entities  
      if (popupId === 'security-popup') {
        console.log(`[DashView] Force refreshing security popup entities`);
        
        // Update motion sensors from configuration
        const allMotionSensors = this._getAllEntitiesByType('motion');
        allMotionSensors.forEach(entityId => {
          this._updateComponentForEntity(entityId);
        });
        
        // Update window sensors from configuration
        const allWindowSensors = this._getAllEntitiesByType('window');
        allWindowSensors.forEach(entityId => {
          this._updateComponentForEntity(entityId);
        });
      }
      
      // For other popups, refresh common entities that might be displayed
      console.log(`[DashView] Force refreshing entities for popup: ${popupId}`);
      
    } catch (error) {
      console.warn(`[DashView] Error force refreshing popup entities:`, error);
    }
  }

  // Generic configuration loader - Principle 2 (DRY)
  async _loadConfigFromAPI(configTypes = ['floors', 'rooms']) {
    if (!this._hass) {
      throw new Error('Home Assistant not available');
    }

    const promises = configTypes.map(type => 
      this._hass.callApi('GET', `dashview/config?type=${type}`)
        .catch(error => {
          console.error(`[DashView] Error loading ${type} config:`, error);
          return {}; // Return empty config on error
        })
    );

    const results = await Promise.all(promises);
    const config = {};
    
    configTypes.forEach((type, index) => {
      config[type] = results[index] || {};
    });

    return config;
  }

  // Fetch the weather entity ID from the API
  async _fetchWeatherEntityId() {
      if (!this._hass) return;
      try {
          const response = await this._hass.callApi('GET', 'dashview/config?type=weather_entity');
          if (response && response.weather_entity) {
              this._weatherEntityId = response.weather_entity;
              console.log('[DashView] Fetched weather entity from config:', this._weatherEntityId);
          }
      } catch (error) {
          console.error('[DashView] Error fetching weather entity config, using default:', error);
          // Fallback to default if API call fails
          this._weatherEntityId = 'weather.forecast_home';
      }
  }

  // Add this new method to the DashviewPanel class
  async _fetchWeatherForecasts() {
      if (!this._hass) return;
  
      const entityId = this._getCurrentWeatherEntityId();
      if (!entityId) return;
  
      try {
          console.log(`[DashView] Fetching daily and hourly forecasts for ${entityId} using callService`);
  
          // Use hass.callService to get the daily forecast, with return_response as the 4th argument
          const dailyResponse = await this._hass.callService('weather', 'get_forecasts', {
              entity_id: entityId, // Corrected: Use entity_id directly
              type: 'daily'
          }, true); // The 'true' for return_response is correct for some modern HA versions.
  
          // Use hass.callService to get the hourly forecast, with return_response as the 4th argument
          const hourlyResponse = await this._hass.callService('weather', 'get_forecasts', {
              entity_id: entityId, // Corrected: Use entity_id directly
              type: 'hourly'
          }, true);
  
          // The response is structured like { "weather.forecast_home": { "forecast": [...] } }
          this._weatherForecasts.daily = dailyResponse?.[entityId]?.forecast || [];
          this._weatherForecasts.hourly = hourlyResponse?.[entityId]?.forecast || [];
  
          console.log('[DashView] Forecasts updated successfully via callService');
      } catch (error) {
          console.error(`[DashView] Error fetching weather forecasts for ${entityId} via callService:`, error);
          this._weatherForecasts.daily = [];
          this._weatherForecasts.hourly = [];
      }
  }
  // Load configuration from centralized API - Principle 1 & 2
// Load configuration from centralized API - Principle 1 & 2
  async loadConfiguration() {
    try {
      // Fetch all necessary configurations in parallel for efficiency
      const [houseConfig, integrationsConfig] = await Promise.all([
        this._hass.callApi('GET', 'dashview/config?type=house').catch(e => ({})),
        this._hass.callApi('GET', 'dashview/config?type=integrations').catch(e => ({}))
      ]);

      if (houseConfig && Object.keys(houseConfig).length > 0) {
        this._houseConfig = houseConfig;
        console.log('[DashView] House configuration loaded successfully');
      } else {
        console.warn('[DashView] House configuration is empty or failed to load.');
        this._houseConfig = {}; // Ensure it's an object to prevent errors
      }

      if (integrationsConfig && Object.keys(integrationsConfig).length > 0) {
        this._integrationsConfig = integrationsConfig;
        console.log('[DashView] Integrations configuration loaded successfully');
      } else {
        // This is normal if no integrations are configured yet
        this._integrationsConfig = {}; // Ensure it's an object
      }

    } catch (error) {
      console.error('[DashView] Error loading primary configurations:', error);
      this._houseConfig = {};
      this._integrationsConfig = {};
    }
  }
  // Update header buttons based on sensor states
  async updateHeaderButtons(shadow) {
    if (!this._houseConfig || Object.keys(this._houseConfig).length === 0) {
      if (!this._floorsConfig || Object.keys(this._floorsConfig).length === 0) {
        await this.loadConfiguration();
      }
    }

    const container = shadow.getElementById('header-buttons');
    if (!container) return;

    // Create button container with scrollable styling
    container.innerHTML = `
      <div class="header-buttons-scroll">
        ${this.generateHeaderButtonsHTML()}
      </div>
    `;
  }

  // Get room icon from storage/mapping - Principle 11
  _getRoomIconFromStorage(roomKey) {
    // Room icon mapping based on storage configuration
    const roomIconMap = {
      'wohnzimmer': 'mdi:sofa',
      'buero': 'mdi:desk',
      'kueche': 'mdi:chef-hat',
      'eingangsflur': 'mdi:door-open',
      'gaesteklo': 'mdi:toilet',
      'treppe_erdgeschoss': 'mdi:stairs',
      'kids': 'mdi:teddy-bear',
      'kinderzimmer': 'mdi:teddy-bear',
      'kinderbad': 'mdi:shower',
      'flur': 'mdi:floor-plan',
      'aupair': 'mdi:bed',
      'schlafzimmer': 'mdi:bed-double',
      'partykeller': 'mdi:party-popper',
      'heizungskeller': 'mdi:heating-coil',
      'kellerflur': 'mdi:floor-plan',
      'waschkeller': 'mdi:washing-machine',
      'serverraum': 'mdi:server-network',
      'buero_keller': 'mdi:desk',
      'sauna': 'mdi:sauna',
      'aussen': 'mdi:tree'
    };
    
    return roomIconMap[roomKey] || 'mdi:home-outline';
  }

  // Process MDI icon names - Principle 11
  _processIconName(iconName) {
    if (!iconName) return 'mdi-help-circle';
    
    // Remove mdi: prefix and ensure mdi- prefix
    let processedIcon = iconName.replace('mdi:', '').replace('mdi-', '');
    if (!processedIcon.startsWith('mdi-')) {
      processedIcon = 'mdi-' + processedIcon;
    }
    
    return processedIcon;
  }

  // Generate HTML for header buttons
  generateHeaderButtonsHTML() {
    if (!this._hass) {
      return '<div class="loading-message">Loading...</div>';
    }

    // Try to use new house configuration first
    if (this._houseConfig && Object.keys(this._houseConfig).length > 0) {
      return this._generateHeaderButtonsFromHouseConfig();
    }

    // Fallback to legacy configuration
    if (!this._floorsConfig || !this._roomsConfig) {
      return '<div class="loading-message">Loading...</div>';
    }

    return this._generateHeaderButtonsFromLegacyConfig();
  }

  // Generate header buttons from new house configuration
// Generate header buttons from new house configuration
  _generateHeaderButtonsFromHouseConfig() {
    console.log('[DashView Debug] Generating header buttons from houseConfig.');
    let buttonsHTML = '';
    const rooms = this._houseConfig.rooms || {};
    const floors = this._houseConfig.floors || {};

    // 1. Group rooms by their assigned floor
    const roomsByFloor = {};
    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
      const floorKey = roomConfig.floor;
      if (!roomsByFloor[floorKey]) {
        roomsByFloor[floorKey] = [];
      }
      roomsByFloor[floorKey].push({ key: roomKey, config: roomConfig });
    });
    console.log('[DashView Debug] Rooms grouped by floor:', roomsByFloor);

    // 2. Iterate through each floor to find active rooms
    Object.entries(roomsByFloor).forEach(([floorKey, floorRooms]) => {
      console.log(`[DashView Debug] Processing floor: ${floorKey}`);
      const floorConfig = floors[floorKey];
      if (!floorConfig) {
        console.warn(`[DashView Debug] No config found for floor: ${floorKey}. Skipping.`);
        return;
      }

      // 3. Find all rooms on this floor that have an active entity
      const activeRooms = floorRooms.filter(room => {
        const config = room.config;
        if (!this._hass || !this._hass.states) return false;

        // Check Lights
        if (config.lights && config.lights.some(entityId => this._hass.states[entityId]?.state === 'on')) {
            console.log(`[DashView Debug] Active light found in room: ${room.key}`);
            return true;
        }

        // Check Media Players
        if (config.media_players && config.media_players.some(playerConfig => this._hass.states[playerConfig.entity]?.state === 'playing')) {
            console.log(`[DashView Debug] Active media player found in room: ${room.key}`);
            return true;
        }

        // Check Header Entities (motion, smoke, vibration)
        if (config.header_entities && config.header_entities.some(entityConfig => {
            const entityState = this._hass.states[entityConfig.entity];
            if (entityState && entityState.state === 'on' && ['motion', 'smoke', 'vibration'].includes(entityConfig.entity_type)) {
                console.log(`[DashView Debug] Active header entity (${entityConfig.entity_type}) found in room: ${room.key}`);
                return true;
            }
            return false;
        })) {
            return true;
        }

        return false;
      });
      console.log(`[DashView Debug] Active rooms for floor ${floorKey}:`, activeRooms.map(r => r.key));

      // 4. If at least one room is active, display the floor and room icons
      if (activeRooms.length > 0) {
        const floorIcon = this._processIconName(floorConfig.icon || 'mdi:help-circle-outline');

        // Add the floor icon button
        buttonsHTML += `
          <button class="header-floor-button" data-floor="${floorKey}">
            <i class="mdi ${floorIcon}"></i>
          </button>
        `;

        // Add the icon buttons ONLY for the active rooms
        activeRooms.forEach(room => {
          const roomConfig = room.config;
          const roomIcon = this._processIconName(roomConfig.icon || 'mdi:home-outline');
          buttonsHTML += `
              <button class="header-room-button" 
                      data-room="${room.key}" 
                      data-floor="${floorKey}"
                      data-navigation="#${room.key}"
                      title="${roomConfig.friendly_name}">
                <i class="mdi ${roomIcon}"></i>
              </button>
            `;
        });
      }
    });

    console.log('[DashView Debug] Final generated buttons HTML:', buttonsHTML);
    return buttonsHTML || '<div class="no-activity">No active rooms</div>';
  }

  // Generate header buttons from legacy configuration (for backward compatibility)
  _generateHeaderButtonsFromLegacyConfig() {
    let buttonsHTML = '';
    const floors = this._roomsConfig.floors || {};
    const floorIcons = this._floorsConfig.floor_icons || {};
    const floorSensors = this._floorsConfig.floor_sensors || {};

    // Generate buttons for each floor
    Object.entries(floors).forEach(([floorName, sensors]) => {
      const floorSensor = floorSensors[floorName];
      const floorIcon = this._processIconName(floorIcons[floorName] || 'mdi:help-circle-outline');
      
      // Check if floor sensor is active
      const floorEntity = this._hass.states[floorSensor];
      const isFloorActive = floorEntity && floorEntity.state === 'on';

      if (isFloorActive) {
        // Add floor button
        buttonsHTML += `
          <button class="header-floor-button" data-floor="${floorName}">
            <i class="mdi ${floorIcon}"></i>
          </button>
        `;

        // Add room buttons for this floor
        sensors.forEach(sensor => {
          const sensorEntity = this._hass.states[sensor];
          const isRoomActive = sensorEntity && sensorEntity.state === 'on';

          if (isRoomActive) {
            // Extract room key from sensor name (e.g., binary_sensor.combined_sensor_wohnzimmer -> wohnzimmer)
            const roomKey = sensor.replace('binary_sensor.combined_sensor_', '');
            // Get icon from storage mapping first, fallback to entity attribute, then to default
            const storageIcon = this._getRoomIconFromStorage(roomKey);
            const entityIcon = sensorEntity.attributes?.icon;
            const roomIcon = this._processIconName(entityIcon || storageIcon);
            const roomType = sensorEntity.attributes?.room_type || '#' + roomKey;
            
            buttonsHTML += `
              <button class="header-room-button" data-sensor="${sensor}" data-navigation="${roomType}">
                <i class="mdi ${roomIcon}"></i>
              </button>
            `;
          }
        });
      }
    });

    return buttonsHTML || '<div class="no-activity">No active rooms</div>';
  }

  // Load configuration for admin interface - Principle 1, 2 & 12
  async loadAdminConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');

    if (!statusElement) return;
    
    if (!this._hass) {
      this._setStatusMessage(statusElement, '✗ Home Assistant not available', 'error');
      return;
    }

    // Load configuration once and store in local state - Principle 12
    if (!this._adminLocalState.isLoaded) {
      this._setStatusMessage(statusElement, 'Loading configuration...', 'loading');

      try {
        // Try to load new house configuration first
        const houseConfig = await this._loadConfigFromAPI(['house']);
        if (houseConfig.house && Object.keys(houseConfig.house).length > 0) {
          this._adminLocalState.houseConfig = houseConfig.house;
          this._adminLocalState.isLoaded = true;
          
          // Populate house config textarea
          const houseConfigTextarea = shadow.getElementById('house-config');
          if (houseConfigTextarea) {
            houseConfigTextarea.value = JSON.stringify(houseConfig.house, null, 2);
          }
          
          this._setStatusMessage(statusElement, '✓ House configuration loaded successfully', 'success');
          this._updateAdminSummary(); // <-- ADD THIS LINE
          console.log('[DashView] Admin house configuration loaded successfully');
          return;
        }
        
        // Fallback to legacy configuration for backward compatibility
        const config = await this._loadConfigFromAPI(['floors', 'rooms']);
        
        // Store in local state, not directly in textareas
        this._adminLocalState.floorsConfig = config.floors;
        this._adminLocalState.roomsConfig = config.rooms;
        this._adminLocalState.isLoaded = true;

        // Populate textareas with loaded configuration - Principle 12
        const floorsTextarea = shadow.getElementById('floors-config');
        const roomsTextarea = shadow.getElementById('rooms-config');
        
        if (floorsTextarea && config.floors) {
          floorsTextarea.value = JSON.stringify(config.floors, null, 2);
        }
        
        if (roomsTextarea && config.rooms) {
          roomsTextarea.value = JSON.stringify(config.rooms, null, 2);
        }

        this._setStatusMessage(statusElement, '✓ Legacy configuration loaded successfully', 'success');
        this._updateAdminSummary(); // <-- ADD THIS LINE
        console.log('[DashView] Admin legacy configuration loaded successfully');
      } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error loading configuration: ${error.message}`, 'error');
        console.error('[DashView] Error loading admin configuration:', error);
        return;
      }
    }

    // Render the form using LOCAL state - Principle 12
    this._renderAdminForm();
  }

  // Helper method for status messages - Principle 2 & 6
  _setStatusMessage(element, message, type) {
    if (!element) return;
    
    element.textContent = message;
    element.style.background = '';
    
    switch (type) {
      case 'success':
        element.style.background = 'var(--green)';
        break;
      case 'error':
        element.style.background = 'var(--red)';
        break;
      case 'loading':
        element.style.background = 'var(--yellow)';
        break;
      default:
        break;
    }
  }

  // Render admin form from local state - Principle 12
  _renderAdminForm() {
    const shadow = this.shadowRoot;
    const floorsTextarea = shadow.getElementById('floors-config');
    const roomsTextarea = shadow.getElementById('rooms-config');

    if (!floorsTextarea || !roomsTextarea) return;

    // Set values from local state
    floorsTextarea.value = JSON.stringify(this._adminLocalState.floorsConfig, null, 2);
    roomsTextarea.value = JSON.stringify(this._adminLocalState.roomsConfig, null, 2);

    // Setup input listeners to update local state only
    floorsTextarea.oninput = (e) => {
      try {
        this._adminLocalState.floorsConfig = JSON.parse(e.target.value);
      } catch (error) {
        // Invalid JSON, keep local state unchanged
        console.warn('[DashView] Invalid floors JSON in textarea');
      }
    };

    roomsTextarea.oninput = (e) => {
      try {
        this._adminLocalState.roomsConfig = JSON.parse(e.target.value);
      } catch (error) {
        // Invalid JSON, keep local state unchanged
        console.warn('[DashView] Invalid rooms JSON in textarea');
      }
    };
  }

  // Input validation helpers - Principle 10
  _validateEntityId(entityId) {
    if (!entityId || typeof entityId !== 'string') return false;
    const entityPattern = /^[a-z_]+\.[a-z0-9_]+$/;
    return entityPattern.test(entityId);
  }

  _sanitizeHtml(input) {
    if (!input || typeof input !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  _validateConfigStructure(config, requiredFields) {
    if (!config || typeof config !== 'object') return false;
    return requiredFields.every(field => config.hasOwnProperty(field));
  }

  // Generic configuration saver with enhanced validation - Principle 2 & 10
  async _saveConfigViaAPI(configType, configData, validationFn) {
    if (!this._hass) {
      throw new Error('Home Assistant not available');
    }

    // Basic type validation
    if (!configType || typeof configType !== 'string') {
      throw new Error('Invalid configuration type');
    }

    if (!configData || typeof configData !== 'object') {
      throw new Error('Invalid configuration data');
    }

    // Validate configuration if validator provided
    if (validationFn && !validationFn(configData)) {
      throw new Error(`Invalid ${configType} configuration structure`);
    }

    // Save via centralized API - Principle 1
    await this._hass.callApi('POST', 'dashview/config', {
      type: configType,
      config: configData
    });

    console.log(`[DashView] ${configType} configuration saved successfully`);
  }

  // Save floors configuration - Principle 1, 2 & 12
  // Save rooms configuration - Principle 1, 2 & 12
  async saveRoomsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');

    if (!statusElement) return;

    this._setStatusMessage(statusElement, 'Saving rooms configuration...', 'loading');

    try {
      // Use local state for saving - Principle 12
      const configData = this._adminLocalState.roomsConfig;
      
      // Use generic saver with validation - Principle 2
      await this._saveConfigViaAPI('rooms', configData, (data) => 
        data && data.floors
      );

      this._setStatusMessage(statusElement, '✓ Rooms configuration saved successfully', 'success');

      // Update runtime configuration
      this._roomsConfig = configData;
      if (this._hass) {
        this.updateHeaderButtons(shadow);
      }

    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error saving rooms config: ${error.message}`, 'error');
      console.error('[DashView] Error saving rooms config:', error);
    }
  }

  // Save house configuration - Principle 1, 2 & 12
  async saveHouseConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('house-config-status');

    if (!statusElement) return;

    this._setStatusMessage(statusElement, 'Saving house configuration...', 'loading');

    try {
      // Get config from textarea
      const houseConfigTextarea = shadow.getElementById('house-config');
      const configText = houseConfigTextarea?.value || '';
      
      if (!configText.trim()) {
        this._setStatusMessage(statusElement, '✗ House configuration is empty', 'error');
        return;
      }

      let configData;
      try {
        configData = JSON.parse(configText);
      } catch (parseError) {
        this._setStatusMessage(statusElement, '✗ Invalid JSON format', 'error');
        return;
      }

      // Use generic saver with validation - Principle 2
      await this._saveConfigViaAPI('house', configData, (data) => 
        data && data.rooms && data.floors
      );

      this._setStatusMessage(statusElement, '✓ House configuration saved successfully', 'success');

      // Update runtime configuration
      this._houseConfig = configData;
      if (this._hass) {
        this.updateHeaderButtons(shadow);
      }

    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error saving house config: ${error.message}`, 'error');
      console.error('[DashView] Error saving house config:', error);
    }
  }

  // Load weather entity configuration - Principle 1, 2 & 12
  async loadWeatherEntityConfiguration() {
    const shadow = this.shadowRoot;
    const weatherSelector = shadow.getElementById('weather-entity-selector');

    if (!weatherSelector || !this._hass) return;

    try {
      // Get all weather entities from Home Assistant
      const weatherEntities = this._getWeatherEntities();
      
      // Fetch the current entity from the API for the admin panel
      await this._fetchWeatherEntityId(); 
      const currentEntity = this._weatherEntityId;
      
      // Store in local admin state for UI stability
      this._adminLocalState.weatherEntity = currentEntity;
      
      // Populate dropdown using local state
      this._populateWeatherEntityDropdown(weatherSelector, weatherEntities, this._adminLocalState.weatherEntity);
      
      console.log('[DashView] Weather entity configuration loaded successfully for admin panel');
    } catch (error) {
      console.error('[DashView] Error loading weather entity configuration for admin:', error);
    }
  }

  // Get all weather entities from Home Assistant states
  _getWeatherEntities() {
    if (!this._hass) return [];
    
    const weatherEntities = [];
    for (const entityId in this._hass.states) {
      if (entityId.startsWith('weather.')) {
        const entity = this._hass.states[entityId];
        weatherEntities.push({
          entityId: entityId,
          friendlyName: entity.attributes.friendly_name || entityId
        });
      }
    }
    
    return weatherEntities.sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
  }

  // Get current configured weather entity with fallback - Principle 1 & 6
  _getCurrentWeatherEntityId() {
    // No longer reads from a sensor, just returns the stored property
    return this._weatherEntityId || 'weather.forecast_home'; // Fallback for safety
  }

  // Populate weather entity dropdown
  _populateWeatherEntityDropdown(selector, weatherEntities, currentEntity) {
    // Clear existing options
    selector.innerHTML = '';
    
    if (weatherEntities.length === 0) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'No weather entities found';
      option.disabled = true;
      selector.appendChild(option);
      return;
    }
    
    // Add options for each weather entity
    weatherEntities.forEach(entity => {
      const option = document.createElement('option');
      option.value = entity.entityId;
      option.textContent = entity.friendlyName;
      option.selected = entity.entityId === currentEntity;
      selector.appendChild(option);
    });
    
    // Add event listener to update local state on change - Principle 12
    selector.removeEventListener('change', this._weatherEntityChangeHandler);
    this._weatherEntityChangeHandler = (e) => {
      this._adminLocalState.weatherEntity = e.target.value;
    };
    selector.addEventListener('change', this._weatherEntityChangeHandler);
  }

  // Save weather entity configuration - Principle 1, 2 & 12
  async saveWeatherEntityConfiguration() {
    const shadow = this.shadowRoot;
    const weatherSelector = shadow.getElementById('weather-entity-selector');
    const statusElement = shadow.querySelector('#weather-status');

    if (!weatherSelector || !this._hass) return;
    const selectedEntity = this._adminLocalState.weatherEntity || weatherSelector.value;

    if (!selectedEntity) {
        this._setStatusMessage(statusElement, '✗ No weather entity selected', 'error');
        return;
    }

    try {
        await this._hass.callService('dashview', 'set_weather_entity', {
            entity_id: selectedEntity
        });
        
        // 1. Update the panel's main internal state
        this._weatherEntityId = selectedEntity;

        // 2. FIX: Also update the admin panel's local state to prevent reverting on reload
        this._adminLocalState.weatherEntity = selectedEntity;

        this._setStatusMessage(statusElement, '✓ Weather entity saved successfully', 'success');
        
        // 3. FIX: Trigger a manual update of ALL weather components, not just the popup
        this._updateWeatherButton(this.shadowRoot);
        this.updateWeatherComponents(this.shadowRoot);

    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error saving weather entity: ${error.message}`, 'error');
    }
  }

  // Motion Setup Functions - Motion admin functionality
  async loadMotionSensorSetup() {
      const shadow = this.shadowRoot;
      const statusElement = shadow.getElementById('motion-setup-status');
      this._setStatusMessage(statusElement, 'Loading motion sensors from Home Assistant...', 'loading');
  
      try {
          const [entitiesByRoom, houseConfig] = await Promise.all([
              this._hass.callApi('GET', `dashview/config?type=entities_by_room&label=${this._entityLabels.MOTION}`),
              this._hass.callApi('GET', 'dashview/config?type=house')
          ]);
  
          this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
          this._renderMotionSensorSetup(entitiesByRoom, this._adminLocalState.houseConfig);
          this._setStatusMessage(statusElement, '✓ Motion sensors loaded successfully', 'success');
      } catch (error) {
          console.error('[DashView] Error loading motion sensor setup:', error);
          const errorMessage = error?.error || JSON.stringify(error);
          this._setStatusMessage(statusElement, `✗ Error loading motion sensors: ${errorMessage}`, 'error');
      }
  }

  _renderMotionSensorSetup(entitiesByRoom, houseConfig) {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('motion-sensors-by-room');
    
    if (!container) return;

    let html = '';
    
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
      html = `<div class="placeholder">
        <p>No motion sensors with "Motion" label found.</p>
        <p><strong>To fix this:</strong></p>
        <ol>
          <li>Go to <strong>Settings → Labels</strong> in Home Assistant</li>
          <li>Create a label called "Motion" (case-insensitive)</li>
          <li>Assign this label to your motion sensor entities</li>
          <li>Click "Reload Motion Sensors" above</li>
        </ol>
        <p><small>Supported label names: Motion, motion, MOTION, bewegung, etc.</small></p>
      </div>`;
    } else {
      Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
        html += `
          <div class="room-config">
            <h6>${areaData.name}</h6>
            <div class="entity-list">
        `;
        
        areaData.entities.forEach(entity => {
          // Check if this entity is already configured in the house config
          const isConfigured = this._isMotionSensorConfigured(entity.entity_id, houseConfig);
          const checkedAttr = isConfigured ? 'checked' : '';
          
          html += `
            <div class="entity-list-item">
              <label class="checkbox-label">
                <input type="checkbox" data-entity-id="${entity.entity_id}" data-room="${areaData.name}" ${checkedAttr}>
                <span class="checkmark"></span>
                ${entity.name}
              </label>
              <span class="entity-id">${entity.entity_id}</span>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
    }
    
    container.innerHTML = html;
  }

  _isMotionSensorConfigured(entityId, houseConfig) {
    if (!houseConfig || !houseConfig.rooms) return false;
    
    return Object.values(houseConfig.rooms).some(room => {
      return room.header_entities && room.header_entities.some(headerEntity => 
        headerEntity.entity === entityId && headerEntity.entity_type === 'motion'
      );
    });
  }

  async saveMotionSensorConfig() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('motion-setup-status');
    const checkboxes = shadow.querySelectorAll('#motion-sensors-by-room input[type="checkbox"]');
    
    this._setStatusMessage(statusElement, 'Saving motion sensor configuration...', 'loading');

    try {
      // Ensure we have a house config to work with
      if (!this._adminLocalState.houseConfig) {
        this._adminLocalState.houseConfig = { rooms: {} };
      }

      // First, remove all existing motion sensors from room configurations
      Object.values(this._adminLocalState.houseConfig.rooms).forEach(room => {
        if (room.header_entities) {
          room.header_entities = room.header_entities.filter(entity => entity.entity_type !== 'motion');
        }
      });

      // Add selected motion sensors to the appropriate rooms
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const entityId = checkbox.getAttribute('data-entity-id');
          const roomName = checkbox.getAttribute('data-room');
          
          // Find or create the room configuration based on room name
          let roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);
          
          if (!this._adminLocalState.houseConfig.rooms[roomKey]) {
            this._adminLocalState.houseConfig.rooms[roomKey] = {
              friendly_name: roomName,
              icon: "mdi:home-outline",
              floor: "ground_floor",
              combined_sensor: "",
              lights: [],
              covers: [],
              media_players: [],
              header_entities: []
            };
          }

          if (!this._adminLocalState.houseConfig.rooms[roomKey].header_entities) {
            this._adminLocalState.houseConfig.rooms[roomKey].header_entities = [];
          }

          // Add the motion sensor
          this._adminLocalState.houseConfig.rooms[roomKey].header_entities.push({
            entity: entityId,
            entity_type: 'motion',
            icon: 'mdi:motion-sensor'
          });
        }
      });

      // Save the updated configuration
      await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Motion sensor configuration saved successfully!', 'success');
      
    } catch (error) {
      console.error('[DashView] Error saving motion sensor configuration:', error);
      this._setStatusMessage(statusElement, `✗ Error saving configuration: ${error.message}`, 'error');
    }
  }

  _findRoomKeyByName(roomName) {
    if (!this._adminLocalState.houseConfig || !this._adminLocalState.houseConfig.rooms) return null;
    
    return Object.keys(this._adminLocalState.houseConfig.rooms).find(key => 
      this._adminLocalState.houseConfig.rooms[key].friendly_name === roomName
    );
  }

  _createRoomKeyFromName(roomName) {
    return roomName.toLowerCase()
      .replace(/[äöüß]/g, match => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[match]))
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '');
  }

  // Cover Setup Functions - Following same pattern as motion sensors
  async loadCoverSetup() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('cover-setup-status');
    this._setStatusMessage(statusElement, 'Loading covers from Home Assistant...', 'loading');

    try {
      // Use domain-based API call instead of label-based
      const [entitiesByRoom, houseConfig] = await Promise.all([
        this._hass.callApi('GET', 'dashview/config?type=entities_by_room&domain=cover'),
        this._hass.callApi('GET', 'dashview/config?type=house')
      ]);

      this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
      this._renderCoverSetup(entitiesByRoom, this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Covers loaded successfully', 'success');
    } catch (error) {
      console.error('[DashView] Error loading cover setup:', error);
      this._setStatusMessage(statusElement, `✗ Error loading covers: ${error.message}`, 'error');
    }
  }

  _renderCoverSetup(entitiesByRoom, houseConfig) {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('covers-by-room');
    
    if (!container) return;

    let html = '';
    
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
      html = '<div class="placeholder">No cover entities found in Home Assistant rooms. Make sure your covers are assigned to rooms in Home Assistant.</div>';
    } else {
      Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
        html += `
          <div class="room-config">
            <h6>${areaData.name}</h6>
            <div class="entity-list">
        `;
        
        areaData.entities.forEach(entity => {
          // Check if this entity is already configured in the house config
          const isConfigured = this._isCoverConfigured(entity.entity_id, houseConfig);
          const checkedAttr = isConfigured ? 'checked' : '';
          
          html += `
            <div class="entity-list-item">
              <label class="checkbox-label">
                <input type="checkbox" data-entity-id="${entity.entity_id}" data-room="${areaData.name}" ${checkedAttr}>
                <span class="checkmark"></span>
                ${entity.name}
              </label>
              <span class="entity-id">${entity.entity_id}</span>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
    }
    
    container.innerHTML = html;
  }

  _isCoverConfigured(entityId, houseConfig) {
    if (!houseConfig || !houseConfig.rooms) return false;
    
    return Object.values(houseConfig.rooms).some(room => {
      return room.covers && room.covers.includes(entityId);
    });
  }

  async saveCoverConfig() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('cover-setup-status');
    const checkboxes = shadow.querySelectorAll('#covers-by-room input[type="checkbox"]');
    
    this._setStatusMessage(statusElement, 'Saving cover configuration...', 'loading');

    try {
      // Ensure we have a house config to work with
      if (!this._adminLocalState.houseConfig) {
        this._adminLocalState.houseConfig = { rooms: {} };
      }

      // First, remove all existing covers from room configurations
      Object.values(this._adminLocalState.houseConfig.rooms).forEach(room => {
        room.covers = [];
      });

      // Add selected covers to the appropriate rooms
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const entityId = checkbox.getAttribute('data-entity-id');
          const roomName = checkbox.getAttribute('data-room');
          
          // Find or create the room configuration based on room name
          let roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);
          
          if (!this._adminLocalState.houseConfig.rooms[roomKey]) {
            this._adminLocalState.houseConfig.rooms[roomKey] = {
              friendly_name: roomName,
              icon: "mdi:home-outline",
              floor: "ground_floor",
              combined_sensor: "",
              lights: [],
              covers: [],
              media_players: [],
              header_entities: []
            };
          }

          if (!this._adminLocalState.houseConfig.rooms[roomKey].covers) {
            this._adminLocalState.houseConfig.rooms[roomKey].covers = [];
          }

          // Add the cover entity
          this._adminLocalState.houseConfig.rooms[roomKey].covers.push(entityId);
        }
      });

      // Save the updated configuration
      await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Cover configuration saved successfully!', 'success');
      
    } catch (error) {
      console.error('[DashView] Error saving cover configuration:', error);
      this._setStatusMessage(statusElement, `✗ Error saving configuration: ${error.message}`, 'error');
    }
  }

  // Light Setup Functions - Following same pattern as covers
  async loadLightSetup() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('light-setup-status');
    this._setStatusMessage(statusElement, 'Loading lights from Home Assistant...', 'loading');

    try {
      // Use domain-based API call instead of label-based
      const [entitiesByRoom, houseConfig] = await Promise.all([
        this._hass.callApi('GET', 'dashview/config?type=entities_by_room&domain=light'),
        this._hass.callApi('GET', 'dashview/config?type=house')
      ]);

      this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
      this._renderLightSetup(entitiesByRoom, this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Lights loaded successfully', 'success');
    } catch (error) {
      console.error('[DashView] Error loading light setup:', error);
      this._setStatusMessage(statusElement, `✗ Error loading lights: ${error.message}`, 'error');
    }
  }

  _renderLightSetup(entitiesByRoom, houseConfig) {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('lights-by-room');
    
    if (!container) return;

    let html = '';
    
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
      html = '<div class="placeholder">No light entities found in Home Assistant rooms. Make sure your lights are assigned to rooms in Home Assistant.</div>';
    } else {
      Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
        html += `
          <div class="room-config">
            <h6>${areaData.name}</h6>
            <div class="entity-list">
        `;
        
        areaData.entities.forEach(entity => {
          // Check if this entity is already configured in the house config
          const isConfigured = this._isLightConfigured(entity.entity_id, houseConfig);
          const checkedAttr = isConfigured ? 'checked' : '';
          
          html += `
            <div class="entity-list-item">
              <label class="checkbox-label">
                <input type="checkbox" data-entity-id="${entity.entity_id}" data-room="${areaData.name}" ${checkedAttr}>
                <span class="checkmark"></span>
                ${entity.name}
              </label>
              <span class="entity-id">${entity.entity_id}</span>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
    }
    
    container.innerHTML = html;
  }

  _isLightConfigured(entityId, houseConfig) {
    if (!houseConfig || !houseConfig.rooms) return false;
    
    return Object.values(houseConfig.rooms).some(room => {
      return room.lights && room.lights.includes(entityId);
    });
  }

  async saveLightConfig() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('light-setup-status');
    const checkboxes = shadow.querySelectorAll('#lights-by-room input[type="checkbox"]');
    
    this._setStatusMessage(statusElement, 'Saving light configuration...', 'loading');

    try {
      // Ensure we have a house config to work with
      if (!this._adminLocalState.houseConfig) {
        this._adminLocalState.houseConfig = { rooms: {} };
      }

      // First, remove all existing lights from room configurations
      Object.values(this._adminLocalState.houseConfig.rooms).forEach(room => {
        room.lights = [];
      });

      // Add selected lights to the appropriate rooms
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const entityId = checkbox.getAttribute('data-entity-id');
          const roomName = checkbox.getAttribute('data-room');
          
          // Find or create the room configuration based on room name
          let roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);
          
          if (!this._adminLocalState.houseConfig.rooms[roomKey]) {
            this._adminLocalState.houseConfig.rooms[roomKey] = {
              friendly_name: roomName,
              icon: "mdi:home-outline",
              floor: "ground_floor",
              combined_sensor: "",
              lights: [],
              covers: [],
              media_players: [],
              header_entities: []
            };
          }

          if (!this._adminLocalState.houseConfig.rooms[roomKey].lights) {
            this._adminLocalState.houseConfig.rooms[roomKey].lights = [];
          }

          // Add the light entity
          this._adminLocalState.houseConfig.rooms[roomKey].lights.push(entityId);
        }
      });

      // Save the updated configuration
      await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Light configuration saved successfully!', 'success');
      
    } catch (error) {
      console.error('[DashView] Error saving light configuration:', error);
      this._setStatusMessage(statusElement, `✗ Error saving configuration: ${error.message}`, 'error');
    }
  }

  // Window Setup Functions - Following same pattern as motion sensors
  async loadWindowSensorSetup() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('window-setup-status');
    this._setStatusMessage(statusElement, 'Loading window sensors from Home Assistant...', 'loading');

    try {
      const [entitiesByRoom, houseConfig] = await Promise.all([
        this._hass.callApi('GET', `dashview/config?type=entities_by_room&label=${this._entityLabels.WINDOW}`),
        this._hass.callApi('GET', 'dashview/config?type=house')
      ]);

      this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
      this._renderWindowSensorSetup(entitiesByRoom, this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Window sensors loaded successfully', 'success');
    } catch (error) {
      console.error('[DashView] Error loading window sensor setup:', error);
      this._setStatusMessage(statusElement, `✗ Error loading window sensors: ${error.message}`, 'error');
    }
  }

  _renderWindowSensorSetup(entitiesByRoom, houseConfig) {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('window-sensors-by-room');
    
    if (!container) return;

    let html = '';
    
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
      html = `<div class="placeholder">
        <p>No window sensors with "Fenster" label found.</p>
        <p><strong>To fix this:</strong></p>
        <ol>
          <li>Go to <strong>Settings → Labels</strong> in Home Assistant</li>
          <li>Create a label called "Fenster" (case-insensitive)</li>
          <li>Assign this label to your window sensor entities</li>
          <li>Click "Reload Window Sensors" above</li>
        </ol>
        <p><small>Supported label names: Fenster, fenster, FENSTER, Window, window, etc.</small></p>
      </div>`;
    } else {
      Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
        html += `
          <div class="room-config">
            <h6>${areaData.name}</h6>
            <div class="entity-list">
        `;
        
        areaData.entities.forEach(entity => {
          const isConfigured = this._isWindowSensorConfigured(entity.entity_id, houseConfig);
          const checkedAttr = isConfigured ? 'checked' : '';
          
          html += `
            <div class="entity-list-item">
              <label class="checkbox-label">
                <input type="checkbox" data-entity-id="${entity.entity_id}" data-room="${areaData.name}" ${checkedAttr}>
                <span class="checkmark"></span>
                ${entity.name}
              </label>
              <span class="entity-id">${entity.entity_id}</span>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
    }
    
    container.innerHTML = html;
  }

  _isWindowSensorConfigured(entityId, houseConfig) {
    if (!houseConfig || !houseConfig.rooms) return false;
    
    return Object.values(houseConfig.rooms).some(room => {
      return room.header_entities && room.header_entities.some(headerEntity => 
        headerEntity.entity === entityId && headerEntity.entity_type === 'window'
      );
    });
  }

  async saveWindowSensorConfig() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('window-setup-status');
    const checkboxes = shadow.querySelectorAll('#window-sensors-by-room input[type="checkbox"]');
    
    this._setStatusMessage(statusElement, 'Saving window sensor configuration...', 'loading');

    try {
      if (!this._adminLocalState.houseConfig) {
        this._adminLocalState.houseConfig = { rooms: {} };
      }

      // Remove all existing window sensors from room configurations
      Object.values(this._adminLocalState.houseConfig.rooms).forEach(room => {
        if (room.header_entities) {
          room.header_entities = room.header_entities.filter(entity => entity.entity_type !== 'window');
        }
      });

      // Add selected window sensors to the appropriate rooms
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const entityId = checkbox.getAttribute('data-entity-id');
          const roomName = checkbox.getAttribute('data-room');
          
          let roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);
          
          if (!this._adminLocalState.houseConfig.rooms[roomKey]) {
            this._adminLocalState.houseConfig.rooms[roomKey] = {
              friendly_name: roomName,
              icon: "mdi:home-outline",
              floor: "ground_floor",
              combined_sensor: "",
              lights: [],
              covers: [],
              media_players: [],
              header_entities: []
            };
          }

          if (!this._adminLocalState.houseConfig.rooms[roomKey].header_entities) {
            this._adminLocalState.houseConfig.rooms[roomKey].header_entities = [];
          }

          this._adminLocalState.houseConfig.rooms[roomKey].header_entities.push({
            entity: entityId,
            entity_type: 'window',
            icon: 'mdi:window-open'
          });
        }
      });

      await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Window sensor configuration saved successfully!', 'success');
      
    } catch (error) {
      console.error('[DashView] Error saving window sensor configuration:', error);
      this._setStatusMessage(statusElement, `✗ Error saving configuration: ${error.message}`, 'error');
    }
  }

  // Smoke Detector Setup Functions - Following same pattern as motion sensors
  async loadSmokeDetectorSetup() {
      const shadow = this.shadowRoot;
      const statusElement = shadow.getElementById('smoke-detector-setup-status');
      this._setStatusMessage(statusElement, 'Loading smoke detectors from Home Assistant...', 'loading');
  
      try {
          const [entitiesByRoom, houseConfig] = await Promise.all([
              this._hass.callApi('GET', `dashview/config?type=entities_by_room&label=${this._entityLabels.SMOKE}`),
              this._hass.callApi('GET', 'dashview/config?type=house')
          ]);
  
          this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
          this._renderSmokeDetectorSetup(entitiesByRoom, this._adminLocalState.houseConfig);
          this._setStatusMessage(statusElement, '✓ Smoke detectors loaded successfully', 'success');
      } catch (error) {
          console.error('[DashView] Error loading smoke detector setup:', error);
          const errorMessage = error?.error || JSON.stringify(error);
          this._setStatusMessage(statusElement, `✗ Error loading smoke detectors: ${errorMessage}`, 'error');
      }
  }

  _renderSmokeDetectorSetup(entitiesByRoom, houseConfig) {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('smoke-detector-sensors-by-room');
    
    if (!container) return;

    let html = '';
    
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
      html = `<div class="placeholder">
        <p>No smoke detectors with "Rauchmelder" label found.</p>
        <p><strong>To fix this:</strong></p>
        <ol>
          <li>Go to <strong>Settings → Labels</strong> in Home Assistant</li>
          <li>Create a label called "Rauchmelder" (case-insensitive)</li>
          <li>Assign this label to your smoke detector entities</li>
          <li>Click "Reload Smoke Detectors" above</li>
        </ol>
        <p><small>Supported label names: Rauchmelder, rauchmelder, RAUCHMELDER, Smoke, smoke, etc.</small></p>
      </div>`;
    } else {
      Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
        html += `
          <div class="room-config">
            <h6>${areaData.name}</h6>
            <div class="entity-list">
        `;
        
        areaData.entities.forEach(entity => {
          const isConfigured = this._isSmokeDetectorConfigured(entity.entity_id, houseConfig);
          const checkedAttr = isConfigured ? 'checked' : '';
          
          html += `
            <div class="entity-list-item">
              <label class="checkbox-label">
                <input type="checkbox" data-entity-id="${entity.entity_id}" data-room="${areaData.name}" ${checkedAttr}>
                <span class="checkmark"></span>
                ${entity.name}
              </label>
              <span class="entity-id">${entity.entity_id}</span>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
    }
    
    container.innerHTML = html;
  }

  _isSmokeDetectorConfigured(entityId, houseConfig) {
    if (!houseConfig || !houseConfig.rooms) return false;
    
    return Object.values(houseConfig.rooms).some(room => {
      return room.header_entities && room.header_entities.some(headerEntity => 
        headerEntity.entity === entityId && headerEntity.entity_type === 'smoke'
      );
    });
  }

  async saveSmokeDetectorConfig() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('smoke-detector-setup-status');
    const checkboxes = shadow.querySelectorAll('#smoke-detector-sensors-by-room input[type="checkbox"]');
    
    this._setStatusMessage(statusElement, 'Saving smoke detector configuration...', 'loading');

    try {
      if (!this._adminLocalState.houseConfig) {
        this._adminLocalState.houseConfig = { rooms: {} };
      }

      // Remove all existing smoke detector sensors from room configurations
      Object.values(this._adminLocalState.houseConfig.rooms).forEach(room => {
        if (room.header_entities) {
          room.header_entities = room.header_entities.filter(entity => entity.entity_type !== 'smoke');
        }
      });

      // Add selected smoke detector sensors to the appropriate rooms
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const entityId = checkbox.getAttribute('data-entity-id');
          const roomName = checkbox.getAttribute('data-room');
          
          let roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);
          
          if (!this._adminLocalState.houseConfig.rooms[roomKey]) {
            this._adminLocalState.houseConfig.rooms[roomKey] = {
              friendly_name: roomName,
              icon: "mdi:home-outline",
              floor: "ground_floor",
              combined_sensor: "",
              lights: [],
              covers: [],
              media_players: [],
              header_entities: []
            };
          }

          if (!this._adminLocalState.houseConfig.rooms[roomKey].header_entities) {
            this._adminLocalState.houseConfig.rooms[roomKey].header_entities = [];
          }

          this._adminLocalState.houseConfig.rooms[roomKey].header_entities.push({
            entity: entityId,
            entity_type: 'smoke',
            icon: 'mdi:smoke-detector'
          });
        }
      });

      await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Smoke detector configuration saved successfully!', 'success');
      
    } catch (error) {
      console.error('[DashView] Error saving smoke detector configuration:', error);
      this._setStatusMessage(statusElement, `✗ Error saving configuration: ${error.message}`, 'error');
    }
  }

  // Vibration Setup Functions - Following same pattern as motion sensors
  async loadVibrationSetup() {
      const shadow = this.shadowRoot;
      const statusElement = shadow.getElementById('vibration-setup-status');
      this._setStatusMessage(statusElement, 'Loading vibration sensors from Home Assistant...', 'loading');
  
      try {
          const [entitiesByRoom, houseConfig] = await Promise.all([
              this._hass.callApi('GET', `dashview/config?type=entities_by_room&label=${this._entityLabels.VIBRATION}`),
              this._hass.callApi('GET', 'dashview/config?type=house')
          ]);
  
          this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
          this._renderVibrationSetup(entitiesByRoom, this._adminLocalState.houseConfig);
          this._setStatusMessage(statusElement, '✓ Vibration sensors loaded successfully', 'success');
      } catch (error) {
          console.error('[DashView] Error loading vibration sensor setup:', error);
          const errorMessage = error?.error || JSON.stringify(error);
          this._setStatusMessage(statusElement, `✗ Error loading vibration sensors: ${errorMessage}`, 'error');
      }
  }

  _renderVibrationSetup(entitiesByRoom, houseConfig) {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('vibration-sensors-by-room');
    
    if (!container) return;

    let html = '';
    
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
      html = `<div class="placeholder">
        <p>No vibration sensors with "Vibration" label found.</p>
        <p><strong>To fix this:</strong></p>
        <ol>
          <li>Go to <strong>Settings → Labels</strong> in Home Assistant</li>
          <li>Create a label called "Vibration" (case-insensitive)</li>
          <li>Assign this label to your vibration sensor entities</li>
          <li>Click "Reload Vibration Sensors" above</li>
        </ol>
        <p><small>Supported label names: Vibration, vibration, VIBRATION, etc.</small></p>
      </div>`;
    } else {
      Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
        html += `
          <div class="room-config">
            <h6>${areaData.name}</h6>
            <div class="entity-list">
        `;
        
        areaData.entities.forEach(entity => {
          const isConfigured = this._isVibrationSensorConfigured(entity.entity_id, houseConfig);
          const checkedAttr = isConfigured ? 'checked' : '';
          
          html += `
            <div class="entity-list-item">
              <label class="checkbox-label">
                <input type="checkbox" data-entity-id="${entity.entity_id}" data-room="${areaData.name}" ${checkedAttr}>
                <span class="checkmark"></span>
                ${entity.name}
              </label>
              <span class="entity-id">${entity.entity_id}</span>
            </div>
          `;
        });
        
        html += `
            </div>
          </div>
        `;
      });
    }
    
    container.innerHTML = html;
  }

  _isVibrationSensorConfigured(entityId, houseConfig) {
    if (!houseConfig || !houseConfig.rooms) return false;
    
    return Object.values(houseConfig.rooms).some(room => {
      return room.header_entities && room.header_entities.some(headerEntity => 
        headerEntity.entity === entityId && headerEntity.entity_type === 'vibration'
      );
    });
  }

  async saveVibrationConfig() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('vibration-setup-status');
    const checkboxes = shadow.querySelectorAll('#vibration-sensors-by-room input[type="checkbox"]');
    
    this._setStatusMessage(statusElement, 'Saving vibration sensor configuration...', 'loading');

    try {
      if (!this._adminLocalState.houseConfig) {
        this._adminLocalState.houseConfig = { rooms: {} };
      }

      // Remove all existing vibration sensors from room configurations
      Object.values(this._adminLocalState.houseConfig.rooms).forEach(room => {
        if (room.header_entities) {
          room.header_entities = room.header_entities.filter(entity => entity.entity_type !== 'vibration');
        }
      });

      // Add selected vibration sensors to the appropriate rooms
      checkboxes.forEach(checkbox => {
        if (checkbox.checked) {
          const entityId = checkbox.getAttribute('data-entity-id');
          const roomName = checkbox.getAttribute('data-room');
          
          let roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);
          
          if (!this._adminLocalState.houseConfig.rooms[roomKey]) {
            this._adminLocalState.houseConfig.rooms[roomKey] = {
              friendly_name: roomName,
              icon: "mdi:home-outline",
              floor: "ground_floor",
              combined_sensor: "",
              lights: [],
              covers: [],
              media_players: [],
              header_entities: []
            };
          }

          if (!this._adminLocalState.houseConfig.rooms[roomKey].header_entities) {
            this._adminLocalState.houseConfig.rooms[roomKey].header_entities = [];
          }

          this._adminLocalState.houseConfig.rooms[roomKey].header_entities.push({
            entity: entityId,
            entity_type: 'vibration',
            icon: 'mdi:vibrate'
          });
        }
      });

      await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Vibration sensor configuration saved successfully!', 'success');
      
    } catch (error) {
      console.error('[DashView] Error saving vibration sensor configuration:', error);
      this._setStatusMessage(statusElement, `✗ Error saving configuration: ${error.message}`, 'error');
    }
  }

  // Floor Maintenance Functions - Principle 1, 2 & 12
  // Room Maintenance Functions - Principle 1, 2 & 12
  async loadRoomMaintenance() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('room-maintenance-status');

    if (!statusElement) return;

    if (!this._hass) {
      this._setStatusMessage(statusElement, '✗ Home Assistant not available', 'error');
      return;
    }

    this._setStatusMessage(statusElement, 'Loading rooms and sensors...', 'loading');

    try {
      // Fetch HA rooms, available sensors, and current house config
      const [haRooms, combinedSensors, houseConfigResponse] = await Promise.all([
        this._hass.callApi('GET', 'dashview/config?type=ha_rooms'),
        this._hass.callApi('GET', 'dashview/config?type=combined_sensors'),
        this._hass.callApi('GET', 'dashview/config?type=house')
      ]);

      this._adminLocalState.houseConfig = houseConfigResponse || { rooms: {}, floors: {} };

      // Render the new list with dropdowns
      this._renderHARoomsList(haRooms, combinedSensors);
      this._setStatusMessage(statusElement, '✓ Rooms loaded successfully', 'success');
      this._updateAdminSummary();
      console.log('[DashView] Room maintenance loaded successfully');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error loading configuration: ${error.message}`, 'error');
      console.error('[DashView] Error loading room maintenance:', error);
    }
  }

  _renderHARoomsList(haRooms, combinedSensors) {
    const shadow = this.shadowRoot;
    const roomsContainer = shadow.getElementById('rooms-list');
    
    if (!roomsContainer) return;

    if (!haRooms || haRooms.length === 0) {
      roomsContainer.innerHTML = '<p>No rooms found in Home Assistant areas.</p>';
      return;
    }

    // Store HA rooms data for later use
    this._adminLocalState.haRooms = haRooms;

    const roomsConfig = this._adminLocalState.houseConfig.rooms || {};
    let roomsHTML = '';

    haRooms.forEach(room => {
      const roomKey = room.area_id;
      const currentSensor = roomsConfig[roomKey]?.combined_sensor || '';

      const optionsHTML = combinedSensors.map(sensor =>
        `<option value="${sensor.entity_id}" ${currentSensor === sensor.entity_id ? 'selected' : ''}>
          ${sensor.friendly_name}
        </option>`
      ).join('');

      roomsHTML += `
        <div class="floor-item">
          <div class="floor-info">
            <div class="floor-name">${room.name}</div>
            <div class="floor-details">ID: ${room.area_id}</div>
          </div>
          <div class="setting-row">
            <select class="dropdown-selector" id="room-sensor-${roomKey}">
              <option value="">-- No Sensor --</option>
              ${optionsHTML}
            </select>
            <button class="save-button room-sensor-save-button" data-room-id="${roomKey}">Save</button>
          </div>
        </div>
      `;
    });
    roomsContainer.innerHTML = roomsHTML;
  }

  // New function to save a single room's sensor
  async saveRoomCombinedSensor(roomKey) {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('room-maintenance-status');
    const selector = shadow.getElementById(`room-sensor-${roomKey}`);

    if (!roomKey || !selector) {
      this._setStatusMessage(statusElement, '✗ Could not find room to save.', 'error');
      return;
    }

    const selectedSensor = selector.value;
    const houseConfig = this._adminLocalState.houseConfig;

    try {
      // Get the HA room data from stored state or fetch if not available
      let haRoom = null;
      if (this._adminLocalState.haRooms) {
        haRoom = this._adminLocalState.haRooms.find(room => room.area_id === roomKey);
      } else {
        const haRooms = await this._hass.callApi('GET', 'dashview/config?type=ha_rooms');
        haRoom = haRooms.find(room => room.area_id === roomKey);
      }
      
      // Ensure room exists in config, create if not
      if (!houseConfig.rooms[roomKey]) {
        houseConfig.rooms[roomKey] = {
          friendly_name: haRoom ? haRoom.name : roomKey,
          icon: haRoom ? haRoom.icon : 'mdi:home-outline',
          floor: null, // Needs manual assignment in House Setup
          lights: [],
          covers: [],
          media_players: []
        };
      }

      // Update the sensor for the specific room  
      houseConfig.rooms[roomKey].combined_sensor = selectedSensor;

      this._setStatusMessage(statusElement, `Saving sensor for ${haRoom ? haRoom.name : roomKey}...`, 'loading');
      await this._saveConfigViaAPI('house', houseConfig);
      this._adminLocalState.houseConfig = houseConfig; // Update local state
      this._setStatusMessage(statusElement, `✓ Sensor for ${haRoom ? haRoom.name : roomKey} saved successfully!`, 'success');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error saving sensor: ${error.message}`, 'error');
    }
  }

  // Media Player Management Methods
  async loadRoomMediaPlayerMaintenance() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('media-player-status');

    if (!statusElement || !this._hass) {
      this._setStatusMessage(statusElement, '✗ Home Assistant not available', 'error');
      return;
    }

    this._setStatusMessage(statusElement, 'Loading configuration...', 'loading');

    try {
      // Fetch house config and all available media players
      const [houseConfigResponse, allPlayersResponse] = await Promise.all([
        this._hass.callApi('GET', 'dashview/config?type=house'),
        this._hass.callApi('GET', 'dashview/config?type=available_media_players')
      ]);
      
      this._adminLocalState.houseConfig = houseConfigResponse || { rooms: {}, floors: {} };
      this._adminLocalState.allMediaPlayers = allPlayersResponse || [];

      // Render the new UI
      this._renderMediaPlayerAssignments();

      // Add event listener for the new save button
      shadow.getElementById('save-all-media-assignments').onclick = () => {
        this.saveAllMediaPlayerAssignments();
      };
      
      // Keep reload button functionality
      shadow.getElementById('reload-media-players').onclick = () => this.loadRoomMediaPlayerMaintenance();

      this._setStatusMessage(statusElement, '✓ Ready', 'success');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error: ${error.message}`, 'error');
    }
  }

  _renderMediaPlayerAssignments() {
    const shadow = this.shadowRoot;
    const container = shadow.getElementById('media-player-assignment-list');
    const rooms = this._adminLocalState.houseConfig.rooms || {};
    const allPlayers = this._adminLocalState.allMediaPlayers || [];

    if (!container) return;
    container.innerHTML = ''; // Clear previous content

    // Create a reverse map to easily find which room a player is in
    const playerToRoomMap = new Map();
    for (const [roomKey, roomConfig] of Object.entries(rooms)) {
        (roomConfig.media_players || []).forEach(player => {
            playerToRoomMap.set(player.entity, roomKey);
        });
    }

    // Create a dropdown option for each room
    const roomOptions = Object.entries(rooms).map(([roomKey, roomConfig]) => 
        `<option value="${roomKey}">${roomConfig.friendly_name || roomKey}</option>`
    ).join('');

    // Generate a row for each available media player
    allPlayers.forEach(player => {
        const assignedRoomKey = playerToRoomMap.get(player.entity_id) || '';
        
        const item = document.createElement('div');
        item.className = 'floor-item'; // Re-using existing style for consistency
        item.innerHTML = `
            <div class="floor-info">
                <div class="floor-name">${player.friendly_name}</div>
                <div class="floor-details">${player.entity_id}</div>
            </div>
            <div class="setting-row">
                <select class="dropdown-selector player-room-selector" data-entity-id="${player.entity_id}">
                    <option value="">-- Unassigned --</option>
                    ${roomOptions}
                </select>
            </div>
        `;
        
        // Set the currently assigned room as selected in the dropdown
        const selector = item.querySelector('.player-room-selector');
        if (selector) {
            selector.value = assignedRoomKey;
        }

        container.appendChild(item);
    });
  }

  async saveAllMediaPlayerAssignments() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('media-player-status');
    this._setStatusMessage(statusElement, 'Saving all media player assignments...', 'loading');

    const houseConfig = this._adminLocalState.houseConfig;

    // 1. Clear all existing media player assignments from all rooms
    for (const roomKey in houseConfig.rooms) {
        if (houseConfig.rooms[roomKey].media_players) {
            houseConfig.rooms[roomKey].media_players = [];
        }
    }

    // 2. Iterate through the UI and rebuild the assignments
    const selectors = shadow.querySelectorAll('.player-room-selector');
    selectors.forEach(selector => {
        const entityId = selector.dataset.entityId;
        const roomKey = selector.value;

        // If a room is selected (i.e., not "Unassigned")
        if (roomKey && houseConfig.rooms[roomKey]) {
            // Ensure the media_players array exists
            if (!houseConfig.rooms[roomKey].media_players) {
                houseConfig.rooms[roomKey].media_players = [];
            }
            // Add the player to the selected room
            houseConfig.rooms[roomKey].media_players.push({ entity: entityId });
        }
    });

    // 3. Save the entire updated houseConfig
    try {
        await this._hass.callApi('POST', 'dashview/config', houseConfig);
        this._adminLocalState.houseConfig = houseConfig; // Update local state
        this._setStatusMessage(statusElement, '✓ All assignments saved successfully!', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error saving assignments: ${error.message}`, 'error');
    }
  }

  // Update configuration summary - Principle 12
  _updateAdminSummary() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    const container = shadow.getElementById('config-summary-container');
    
    if (!container) return;

    // Handle both new house config and legacy formats
    let floors = {};
    let rooms = {};
    
    if (this._adminLocalState.houseConfig) {
      // New house configuration format
      floors = this._adminLocalState.houseConfig.floors || {};
      rooms = this._adminLocalState.houseConfig.rooms || {};
    } else if (this._adminLocalState.floorsConfig && this._adminLocalState.roomsConfig) {
      // Legacy configuration format
      floors = this._adminLocalState.floorsConfig.floor_icons ? 
        this._adminLocalState.floorsConfig.floor_icons : {};
      rooms = this._adminLocalState.roomsConfig || {};
    } else {
      container.innerHTML = '<p>Could not load configuration summary.</p>';
      return;
    }

    const stats = {
      Floors: Object.keys(floors).length,
      Rooms: Object.keys(rooms).length,
    };

    // Check floor-room consistency
    let consistencyHTML = '';
    if (this._adminLocalState.houseConfig) {
      const consistencyReport = this._checkFloorRoomConsistency(this._adminLocalState.houseConfig);
      
      if (!consistencyReport.isConsistent) {
        consistencyHTML += '<div class="consistency-warning"><h6>⚠️ Floor-Room Link Issues:</h6>';
        
        if (consistencyReport.orphanedRooms.length > 0) {
          consistencyHTML += '<div class="warning-item">';
          consistencyHTML += `<strong>Orphaned Rooms (${consistencyReport.orphanedRooms.length}):</strong> `;
          consistencyHTML += consistencyReport.orphanedRooms.map(r => 
            `${r.roomKey} → ${r.invalidFloor || 'No Floor'}`
          ).join(', ');
          consistencyHTML += '</div>';
        }
        
        if (consistencyReport.unusedFloors.length > 0) {
          consistencyHTML += '<div class="info-item">';
          consistencyHTML += `<strong>Unused Floors (${consistencyReport.unusedFloors.length}):</strong> `;
          consistencyHTML += consistencyReport.unusedFloors.join(', ');
          consistencyHTML += '</div>';
        }
        
        consistencyHTML += '</div>';
      } else {
        consistencyHTML += '<div class="consistency-ok">✅ All room-floor links are valid</div>';
      }
    }

    const entityCounts = {};

    // Initialize counters for known entity types
    const knownEntityTypes = [
      'motion', 'window', 'smoke', 'vibration', 'music', 'tv',
      'dishwasher', 'washing', 'dryer', 'freezer', 'mower',
      'lights', 'covers', 'media_players'
    ];
    knownEntityTypes.forEach(type => entityCounts[type] = 0);

    Object.values(rooms).forEach(room => {
      if (room.lights) entityCounts.lights += room.lights.length;
      if (room.covers) entityCounts.covers += room.covers.length;
      if (room.media_players) entityCounts.media_players += room.media_players.length;

      if (room.header_entities) {
        room.header_entities.forEach(entity => {
          if (entityCounts.hasOwnProperty(entity.entity_type)) {
            entityCounts[entity.entity_type]++;
          }
        });
      }
    });

    let summaryHTML = '';
    Object.entries(stats).forEach(([name, count]) => {
      summaryHTML += `<div class="summary-item"><strong>${name}:</strong><span>${count}</span></div>`;
    });

    Object.entries(entityCounts).forEach(([type, count]) => {
      if (count > 0) {
        const name = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        summaryHTML += `<div class="summary-item"><strong>${name}:</strong><span>${count}</span></div>`;
      }
    });

    if (summaryHTML === '') {
      container.innerHTML = '<p>No items found in configuration.</p>';
    } else {
      container.innerHTML = consistencyHTML + summaryHTML;
    }
  }
// ADD THESE TWO NEW FUNCTIONS to the DashviewPanel class:

  // Initialize the lights card with entities and event listeners
  // --- REPLACE THE EXISTING _initializeLightsCard FUNCTION WITH THIS ---
  _initializeLightsCard(popup, roomKey, lightEntities) {
    const card = popup.querySelector('.lights-card');
    if (!card) return;

    const individualContainer = card.querySelector('.individual-lights-container');
    const rowTemplate = popup.querySelector('#light-row-template');

    if (!individualContainer || !rowTemplate) return;

    individualContainer.innerHTML = ''; // Clear any existing
    lightEntities.forEach(entityId => {
        const row = rowTemplate.content.cloneNode(true).querySelector('.light-row');
        row.dataset.entityId = entityId;

        const nameEl = row.querySelector('.light-name');
        const entityState = this._hass.states[entityId];
        nameEl.textContent = entityState ? entityState.attributes.friendly_name || entityId : entityId;
        
        // Add click listener to the entire row to toggle the light
        row.addEventListener('click', () => {
            this._hass.callService('light', 'toggle', { entity_id: entityId });
        });
        
        individualContainer.appendChild(row);
        this.updateLightsCard(popup, entityId); // Initial update for this row
    });

    // Initial update for the main count
    const countEl = card.querySelector('.lights-count');
    const totalCount = lightEntities.length;
    const onCount = lightEntities.filter(id => this._hass.states[id]?.state === 'on').length;
    countEl.textContent = `${onCount} / ${totalCount}`;
  }

  // --- REPLACE THE EXISTING updateLightsCard FUNCTION WITH THIS --
// Add this new method to the DashviewPanel class
//...
  // --- REPLACE THE EXISTING updateLightsCard FUNCTION WITH THIS --
// Add this new method to the DashviewPanel class
  updateLightsCard(popup, changedEntityId) {
    if (!this._hass || !changedEntityId) return;

    const roomKey = Object.keys(this._houseConfig.rooms).find(key =>
        this._houseConfig.rooms[key].lights?.includes(changedEntityId)
    );

    if (!roomKey) return;

    const card = popup.querySelector('.lights-card');
    if (!card) return;

    // Update the individual light row
    const lightRow = card.querySelector(`.light-row[data-entity-id="${changedEntityId}"]`);
    if (lightRow) {
        const entityState = this._hass.states[changedEntityId];
        const isOn = entityState && entityState.state === 'on';

        // Update icon
        const iconEl = lightRow.querySelector('.mdi');
        if (iconEl) {
            iconEl.className = isOn ? 'mdi mdi-lightbulb' : 'mdi mdi-lightbulb-off';
        }
        
        // Update state label
        const stateLabelEl = lightRow.querySelector('.light-state-label');
        if (stateLabelEl) {
            if (isOn) {
                let label = 'An';
                if (entityState.attributes && typeof entityState.attributes.brightness === 'number') {
                    const brightnessPercent = Math.round((entityState.attributes.brightness / 255) * 100);
                    label += ` - ${brightnessPercent}%`;
                }
                stateLabelEl.textContent = label;
            } else {
                stateLabelEl.textContent = 'Aus';
            }
        }

        // Update card state for styling
        lightRow.setAttribute('state', isOn ? 'on' : 'off');
    }

    // Update the total count in the header
    const countEl = card.querySelector('.lights-count');
    const lightEntities = this._houseConfig.rooms[roomKey].lights;
    if (countEl && lightEntities) {
        const onCount = lightEntities.filter(id => this._hass.states[id]?.state === 'on').length;
        const totalCount = lightEntities.length;
        countEl.textContent = `${onCount} / ${totalCount}`;
    }
  }

  // Initialize the covers card with entities and event listeners
  _initializeCoversCard(popup, roomKey, coverEntities) {
    const card = popup.querySelector('.covers-card');
    if (!card) return;

    const mainSlider = card.querySelector('.main-slider');
    const mainLabel = card.querySelector('.main-position-label');
    const positionButtons = card.querySelectorAll('.cover-position-buttons button');
    const individualContainer = card.querySelector('.individual-covers-container');
    const rowTemplate = popup.querySelector('#cover-row-template');
    if (!mainSlider || !individualContainer || !rowTemplate) return;

    const masterEntity = coverEntities[0];

    // Setup main slider
    mainSlider.addEventListener('input', (e) => {
        const position = e.target.value;
        mainLabel.textContent = `${position}%`;
    });
    mainSlider.addEventListener('change', (e) => {
        const position = e.target.value;
        coverEntities.forEach(entityId => {
            this._hass.callService('cover', 'set_cover_position', { entity_id: entityId, position: position });
        });
    });

    // Setup position buttons
    positionButtons.forEach(button => {
        button.addEventListener('click', () => {
            const position = button.dataset.position;
            coverEntities.forEach(entityId => {
                this._hass.callService('cover', 'set_cover_position', { entity_id: entityId, position: position });
            });
        });
    });

    // Create individual cover rows
    individualContainer.innerHTML = ''; // Clear any existing
    coverEntities.forEach(entityId => {
        const row = rowTemplate.content.cloneNode(true).querySelector('.cover-row');
        const nameEl = row.querySelector('.cover-name');
        const sliderEl = row.querySelector('.cover-slider');
        const labelEl = row.querySelector('.cover-position-label');

        row.dataset.entityId = entityId;

        const entityState = this._hass.states[entityId];
        nameEl.textContent = entityState ? entityState.attributes.friendly_name : entityId;

        sliderEl.addEventListener('change', (e) => {
            this._hass.callService('cover', 'set_cover_position', { entity_id: entityId, position: e.target.value });
        });
        sliderEl.addEventListener('input', (e) => {
            labelEl.textContent = `${e.target.value}%`;
        });
        
        individualContainer.appendChild(row);
    });

    // Initial update
    this.updateCoverCard(popup, masterEntity); // Update main slider
    coverEntities.forEach(entityId => this.updateCoverCard(popup, entityId)); // Update individual rows
  }

  // Initialize room media player card
  _initializeMediaPlayerCard(popup, roomKey, mediaPlayerEntities) {
    const card = popup.querySelector('.media-player-card');
    if (!card) return;

    const mediaPlayerContainer = card.querySelector('.media-player-container');
    if (!mediaPlayerContainer) return;

    // Generate media player content for the primary media player
    const primaryPlayer = mediaPlayerEntities[0];
    const entityId = primaryPlayer.entity;
    
    // Create media player content structure
    const mediaPlayerContent = `
      <!-- Preset Buttons -->
      <div class="media-presets">
        <button class="media-preset-button" 
                data-entity="${entityId}"
                data-content-id="spotify:playlist:37i9dQZF1DX4sWSpwq3LiO"
                data-content-type="custom">
            <span class="preset-name">Dinner Jazz</span>
        </button>
        <button class="media-preset-button" 
                data-entity="${entityId}"
                data-content-id="spotify:playlist:37i9dQZF1DXdPec7aLTmlC"
                data-content-type="custom">
            <span class="preset-name">Happy Hits</span>
        </button>
        <button class="media-preset-button" 
                data-entity="${entityId}"
                data-content-id="spotify:album:5ht7ItJgpBH7W6vJ5BqpPr"
                data-content-type="custom">
            <span class="preset-name">Karneval</span>
        </button>
      </div>
      
      <!-- Media Display -->
      <div class="media-display" data-entity="${entityId}">
        <div class="media-image">
          <img src="" alt="Media Cover" class="media-cover">
        </div>
        <div class="media-info">
          <div class="media-title">Kein Titel</div>
          <div class="media-artist">Unbekannt</div>
        </div>
      </div>
      
      <!-- Media Controls -->
      <div class="media-controls" data-entity="${entityId}">
        <button class="media-control-button" data-action="media_previous_track">
          <i class="mdi mdi-skip-previous"></i>
        </button>
        <button class="media-control-button play-pause" data-action="media_play_pause">
          <i class="mdi mdi-play"></i>
        </button>
        <button class="media-control-button" data-action="media_next_track">
          <i class="mdi mdi-skip-next"></i>
        </button>
      </div>
      
      <!-- Volume Control -->
      <div class="media-volume-control">
        ${mediaPlayerEntities.map(player => {
          const entity = this._hass.states[player.entity];
          const friendlyName = entity ? entity.attributes.friendly_name : player.entity;
          return `
            <div class="volume-row">
              <span class="volume-label">${friendlyName}</span>
              <div class="volume-slider-container">
                <input type="range" class="volume-slider" 
                       data-entity="${player.entity}"
                       min="0" max="100" value="50">
              </div>
              <span class="volume-value">50%</span>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    mediaPlayerContainer.innerHTML = mediaPlayerContent;
    
    // Initialize media player controls for this card
    this._initializeMediaPlayerControls(popup);
    
    console.log(`[DashView] Initialized media player card for room ${roomKey} with ${mediaPlayerEntities.length} players`);
  }

  // Initialize media player controls
  _initializeMediaPlayerControls(popup) {
    if (!this._hass) return;
    
    console.log('[DashView] Initializing media player controls');
    
    // Initialize preset buttons
    const presetButtons = popup.querySelectorAll('.media-preset-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const entity = button.dataset.entity;
        const contentId = button.dataset.contentId;
        const contentType = button.dataset.contentType;
        
        if (entity && contentId) {
          this._hass.callService('media_player', 'play_media', {
            entity_id: entity,
            media_content_id: contentId,
            media_content_type: contentType
          });
        }
      });
    });
    
    // Initialize media control buttons
    const controlButtons = popup.querySelectorAll('.media-control-button');
    controlButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mediaControls = button.closest('.media-controls');
        const entity = mediaControls.dataset.entity;
        const action = button.dataset.action;
        
        if (entity && action) {
          this._hass.callService('media_player', action, {
            entity_id: entity
          });
        }
      });
    });
    
    // Initialize volume sliders
    const volumeSliders = popup.querySelectorAll('.volume-slider');
    volumeSliders.forEach(slider => {
      // Update volume display on input
      slider.addEventListener('input', (e) => {
        const volumeValue = e.target.closest('.volume-row').querySelector('.volume-value');
        volumeValue.textContent = `${e.target.value}%`;
      });
      
      // Set volume on change
      slider.addEventListener('change', (e) => {
        const entity = e.target.dataset.entity;
        const volume = parseFloat(e.target.value) / 100;
        
        if (entity && volume >= 0 && volume <= 1) {
          this._hass.callService('media_player', 'volume_set', {
            entity_id: entity,
            volume_level: volume
          });
        }
      });
    });
    
    // Initialize media displays for all entities
    const mediaDisplays = popup.querySelectorAll('.media-display');
    mediaDisplays.forEach(display => {
      const entity = display.dataset.entity;
      if (entity) {
        this.updateMediaPlayerDisplay(popup, entity);
      }
    });
    
    // Initialize volume controls for all entities
    volumeSliders.forEach(slider => {
      const entity = slider.dataset.entity;
      if (entity) {
        this.updateMediaPlayerVolume(popup, entity);
      }
    });
  }

  // Update media player display (image, title, artist)
  updateMediaPlayerDisplay(popup, entityId) {
    if (!this._hass || !entityId.startsWith('media_player.')) return;
    
    const entityState = this._hass.states[entityId];
    if (!entityState) return;
    
    const display = popup.querySelector(`.media-display[data-entity="${entityId}"]`);
    if (!display) return;
    
    const mediaImage = display.querySelector('.media-cover');
    const mediaTitle = display.querySelector('.media-title');
    const mediaArtist = display.querySelector('.media-artist');
    
    // Update media image
    if (mediaImage && entityState.attributes.entity_picture) {
      mediaImage.src = entityState.attributes.entity_picture;
      mediaImage.style.display = 'block';
    } else if (mediaImage) {
      mediaImage.style.display = 'none';
    }
    
    // Update title and artist
    const title = entityState.attributes.media_title || 'Kein Titel';
    const artist = entityState.attributes.media_artist || 'Unbekannt';
    
    if (mediaTitle) mediaTitle.textContent = title;
    if (mediaArtist) mediaArtist.textContent = artist;
    
    // Update play/pause button
    const controls = popup.querySelector(`.media-controls[data-entity="${entityId}"]`);
    if (controls) {
      const playPauseButton = controls.querySelector('.play-pause i');
      if (playPauseButton) {
        const isPlaying = ['playing', 'on'].includes(entityState.state);
        playPauseButton.className = isPlaying ? 'mdi mdi-pause' : 'mdi mdi-play';
      }
    }
  }

  // Update media player volume control
  updateMediaPlayerVolume(popup, entityId) {
    if (!this._hass || !entityId.startsWith('media_player.')) return;
    
    const entityState = this._hass.states[entityId];
    if (!entityState) return;
    
    const volumeSlider = popup.querySelector(`.volume-slider[data-entity="${entityId}"]`);
    const volumeValue = volumeSlider?.closest('.volume-row')?.querySelector('.volume-value');
    
    if (!volumeSlider || !volumeValue) return;
    
    const volumeLevel = entityState.attributes.volume_level || 0;
    const volumePercent = Math.round(volumeLevel * 100);
    
    if (volumeSlider.value != volumePercent) {
      volumeSlider.value = volumePercent;
    }
    volumeValue.textContent = `${volumePercent}%`;
  }

  // Update media player in all open popups
  updateMediaPlayerInPopups(shadow, entityId) {
    // Update media player display in music popup
    const musicPopup = shadow.querySelector('#music-popup');
    if (musicPopup && musicPopup.classList.contains('active')) {
      this.updateMediaPlayerDisplay(musicPopup, entityId);
      this.updateMediaPlayerVolume(musicPopup, entityId);
    }
    
    // Also update any room popups that might contain media player controls
    const activePopups = shadow.querySelectorAll('.popup.active');
    activePopups.forEach(popup => {
      const mediaDisplays = popup.querySelectorAll(`.media-display[data-entity="${entityId}"]`);
      const volumeSliders = popup.querySelectorAll(`.volume-slider[data-entity="${entityId}"]`);
      
      if (mediaDisplays.length > 0 || volumeSliders.length > 0) {
        this.updateMediaPlayerDisplay(popup, entityId);
        this.updateMediaPlayerVolume(popup, entityId);
      }
    });
  }

  // Generate music popup content with room tabs and media player cards
  _generateMusicPopupContent(popup) {
    if (!this._houseConfig?.rooms) {
      console.warn('[DashView] No room configuration available for music popup');
      return;
    }

    // 1. Find all rooms with media players
    const roomsWithMediaPlayers = [];
    Object.entries(this._houseConfig.rooms).forEach(([roomId, roomConfig]) => {
      if (roomConfig.media_players && Array.isArray(roomConfig.media_players) && roomConfig.media_players.length > 0) {
        roomsWithMediaPlayers.push({
          id: roomId,
          friendly_name: roomConfig.friendly_name || roomConfig.name || roomId,
          icon: roomConfig.icon || 'mdi-music',
          media_players: roomConfig.media_players
        });
      }
    });

    if (roomsWithMediaPlayers.length === 0) {
      console.log('[DashView] No rooms with media players found');
      popup.innerHTML = `
        <div class="popup-header">
          <h2>Musik</h2>
          <button class="popup-close">&times;</button>
        </div>
        <div class="popup-body">
          <div style="padding: 40px; text-align: center; color: var(--gray800);">
            <p>No music players are defined yet. Please configure them in the admin panel.</p>
          </div>
        </div>
      `;
      return;
    }

    // 2. Find existing music container or create new structure
    const existingContainer = popup.querySelector('.music-tab-container');
    const tabContainer = existingContainer ? 
      existingContainer.querySelector('#music-room-tabs') : 
      null;
    const contentContainer = existingContainer ? 
      existingContainer.querySelector('#music-tab-content') : 
      null;

    if (!tabContainer || !contentContainer) {
      console.log('[DashView] Music container structure not found, content generation skipped');
      return;
    }

    // 3. Clear existing content and generate new tabs and room content
    tabContainer.innerHTML = '';
    contentContainer.innerHTML = '';

    roomsWithMediaPlayers.forEach((room, index) => {
      // Create text-based tab button
      const tabButton = document.createElement('button');
      tabButton.className = `music-tab-button ${index === 0 ? 'active' : ''}`;
      tabButton.dataset.roomId = room.id;
      tabButton.textContent = room.friendly_name; // Use friendly_name for visible text
      tabContainer.appendChild(tabButton);

      // Create room content
      const roomContent = document.createElement('div');
      roomContent.className = `music-room-content ${index === 0 ? 'active' : ''}`;
      roomContent.id = `music-room-${room.id}`;
      roomContent.dataset.roomId = room.id;
      roomContent.innerHTML = this._generateMusicRoomHTML(room);
      contentContainer.appendChild(roomContent);
    });

    // 4. Setup Event Listeners
    this._setupMusicTabSwitching(popup);

    // 5. Initialize controls for the initially active tab
    const activeRoomContent = contentContainer.querySelector('.music-room-content.active');
    if (activeRoomContent) {
        this._initializeMediaPlayerControls(activeRoomContent);
    }
  }

  _generateMusicRoomHTML(room) {
    const primaryPlayer = room.media_players[0];
    if (!primaryPlayer) return '';
    const entityId = primaryPlayer.entity;

    const presetButtons = `
        <button class="media-preset-button" data-entity="${entityId}" data-content-id="spotify:playlist:37i9dQZF1DX4sWSpwq3LiO" data-content-type="custom"><span class="preset-name">Dinner Jazz</span></button>
        <button class="media-preset-button" data-entity="${entityId}" data-content-id="spotify:playlist:37i9dQZF1DXdPec7aLTmlC" data-content-type="custom"><span class="preset-name">Happy Hits</span></button>
    `;

    return `
        <div class="media-room-card" data-room="${room.id}">
            <div class="media-presets">${presetButtons}</div>
            <div class="media-display" data-entity="${entityId}">
                <div class="media-image"><img src="" alt="Media Cover" class="media-cover"></div>
                <div class="media-info">
                    <div class="media-title">Kein Titel</div>
                    <div class="media-artist">Unbekannt</div>
                </div>
            </div>
            <div class="media-controls" data-entity="${entityId}">
                <button class="media-control-button" data-action="media_previous_track"><i class="mdi mdi-skip-previous"></i></button>
                <button class="media-control-button play-pause" data-action="media_play_pause"><i class="mdi mdi-play"></i></button>
                <button class="media-control-button" data-action="media_next_track"><i class="mdi mdi-skip-next"></i></button>
            </div>
            <div class="media-volume-control">
                ${room.media_players.map(p => {
                  const entityState = this._hass.states[p.entity];
                  const friendlyName = entityState?.attributes?.friendly_name || p.entity;
                  return `
                    <div class="volume-row">
                        <span class="volume-label">${friendlyName}</span>
                        <div class="volume-slider-container">
                            <input type="range" class="volume-slider" data-entity="${p.entity}" min="0" max="100" value="50">
                        </div>
                        <span class="volume-value">50%</span>
                    </div>
                    `
                }).join('')}
            </div>
        </div>
    `;
  }

  _setupMusicTabSwitching(popup) {
      // The selector here is changed from '.music-tab-chip' to the correct '.music-tab-button'
      const tabButtons = popup.querySelectorAll('.music-tab-button');
      const roomContents = popup.querySelectorAll('.music-room-content');

      tabButtons.forEach(button => {
          button.addEventListener('click', () => {
              const roomId = button.dataset.roomId;

              tabButtons.forEach(c => c.classList.remove('active'));
              button.classList.add('active');

              roomContents.forEach(content => {
                  const isActive = content.dataset.roomId === roomId;
                  content.classList.toggle('active', isActive);
                  if (isActive) {
                      this._initializeMediaPlayerControls(content);
                  }
              });
          });
      });
  }
  // Update sliders and labels when a cover's state changes
  updateCoverCard(shadow, entityId) {
    if (!this._hass || !entityId.startsWith('cover.')) return;

    const entityState = this._hass.states[entityId];
    if (!entityState) return;
    
    const position = entityState.attributes.current_position ?? 0;
    const roundedPosition = Math.round(position);

    // Update individual row
    const row = shadow.querySelector(`.cover-row[data-entity-id="${entityId}"]`);
    if (row) {
        const sliderEl = row.querySelector('.cover-slider');
        const labelEl = row.querySelector('.cover-position-label');
        if (sliderEl.value != roundedPosition) sliderEl.value = roundedPosition;
        labelEl.textContent = `${roundedPosition}%`;
    }

    // Update main slider if this is the master entity
    const mainSlider = shadow.querySelector('.main-slider');
    const roomConfig = Object.values(this._houseConfig.rooms).find(r => r.covers && r.covers[0] === entityId);
    if (mainSlider && roomConfig) {
        if (mainSlider.value != roundedPosition) mainSlider.value = roundedPosition;
        shadow.querySelector('.main-position-label').textContent = `${roundedPosition}%`;
    }
  }

  // Floor-Room Link Integrity Helper Methods
  _findOrphanedRooms(houseConfig) {
    const floors = houseConfig?.floors || {};
    const rooms = houseConfig?.rooms || {};
    const orphanedRooms = [];

    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
      if (!roomConfig.floor || !floors[roomConfig.floor]) {
        orphanedRooms.push({
          roomKey,
          roomConfig,
          invalidFloor: roomConfig.floor || null
        });
      }
    });

    return orphanedRooms;
  }

  _checkFloorRoomConsistency(houseConfig) {
    const floors = houseConfig?.floors || {};
    const rooms = houseConfig?.rooms || {};
    
    const orphanedRooms = this._findOrphanedRooms(houseConfig);
    
    // Find unused floors
    const usedFloors = new Set();
    Object.values(rooms).forEach(roomConfig => {
      if (roomConfig.floor && floors[roomConfig.floor]) {
        usedFloors.add(roomConfig.floor);
      }
    });
    
    const unusedFloors = Object.keys(floors).filter(floorKey => !usedFloors.has(floorKey));
    
    return {
      isConsistent: orphanedRooms.length === 0,
      orphanedRooms: orphanedRooms.map(o => ({
        roomKey: o.roomKey,
        invalidFloor: o.invalidFloor
      })),
      unusedFloors,
      totalFloors: Object.keys(floors).length,
      totalRooms: Object.keys(rooms).length,
      validRooms: Object.keys(rooms).length - orphanedRooms.length
    };
  }

  _validateRoomFloorReference(roomConfig, houseConfig) {
    const floors = houseConfig?.floors || {};
    return roomConfig.floor && floors[roomConfig.floor];
  }

  // Method to handle floor deletion and its impact on rooms
  _handleFloorDeletion(floorKey, houseConfig) {
    const rooms = houseConfig?.rooms || {};
    const impactedRooms = [];

    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
      if (roomConfig.floor === floorKey) {
        impactedRooms.push(roomKey);
      }
    });

    return {
      impactedRooms,
      canDelete: impactedRooms.length === 0,
      warningMessage: impactedRooms.length > 0 
        ? `Warning: Deleting floor '${floorKey}' will orphan ${impactedRooms.length} room(s): ${impactedRooms.join(', ')}`
        : null
    };
  }

  // Method to auto-fix orphaned rooms by assigning them to the first available floor
  _autoFixOrphanedRooms(houseConfig) {
    const floors = houseConfig?.floors || {};
    const rooms = houseConfig?.rooms || {};
    const floorKeys = Object.keys(floors);
    
    if (floorKeys.length === 0) {
      return { success: false, message: 'No floors available to assign orphaned rooms to' };
    }

    const orphanedRooms = this._findOrphanedRooms(houseConfig);
    const fixedRooms = [];
    const defaultFloor = floorKeys[0]; // Use first available floor as default

    orphanedRooms.forEach(({ roomKey, roomConfig }) => {
      rooms[roomKey].floor = defaultFloor;
      fixedRooms.push(roomKey);
    });

    return {
      success: true,
      fixedRooms,
      assignedFloor: floors[defaultFloor]?.friendly_name || defaultFloor,
      message: `Assigned ${fixedRooms.length} orphaned room(s) to '${floors[defaultFloor]?.friendly_name || defaultFloor}'`
    };
  }
}

// Enhanced debug toolkit implementation - Principle 6
window.DashViewDebug = {
  diagnose: () => {
    const panel = document.querySelector('dashview-panel');
    if (!panel) {
      console.log('[DashView] Panel not found');
      return;
    }
    
    console.log('[DashView] Diagnostic Report:');
    console.log('- Content Ready:', panel._contentReady);
    console.log('- HASS Available:', !!panel._hass);
    console.log('- Floors Config:', Object.keys(panel._floorsConfig).length > 0);
    console.log('- Rooms Config:', Object.keys(panel._roomsConfig).length > 0);
    console.log('- Admin State Loaded:', panel._adminLocalState?.isLoaded);
    console.log('- Entity Subscriptions:', panel._entitySubscriptions.size);
    console.log('- Last Entity States:', panel._lastEntityStates.size);
  },
  
  getStatus: () => {
    const panel = document.querySelector('dashview-panel');
    if (!panel) return null;
    
    return {
      contentReady: panel._contentReady,
      hassAvailable: !!panel._hass,
      floorsConfigLoaded: Object.keys(panel._floorsConfig).length > 0,
      roomsConfigLoaded: Object.keys(panel._roomsConfig).length > 0,
      adminStateLoaded: panel._adminLocalState?.isLoaded || false,
      entitySubscriptions: panel._entitySubscriptions.size,
      lastEntityStates: panel._lastEntityStates.size
    };
  },
  
  performanceProfile: () => {
    const panel = document.querySelector('dashview-panel');
    if (!panel) {
      console.error('[DashView] Panel not found');
      return;
    }
    
    console.log('[DashView] Performance Profile:');
    console.time('[DashView] State Update');
    panel._handleHassUpdate();
    console.timeEnd('[DashView] State Update');
  },
  
  testComponent: (componentName) => {
    console.log(`[DashView] Testing component: ${componentName}`);
    const panel = document.querySelector('dashview-panel');
    if (!panel) {
      console.error('[DashView] Panel not found');
      return;
    }
    
    switch (componentName) {
      case 'config':
        panel.loadConfiguration().then(() => {
          console.log('[DashView] Config test completed');
        }).catch(e => {
          console.error('[DashView] Config test failed:', e);
        });
        break;
      case 'admin':
        panel.loadAdminConfiguration();
        console.log('[DashView] Admin test initiated');
        break;
      case 'weather':
        panel._updateWeatherButton(panel.shadowRoot);
        console.log('[DashView] Weather component test completed');
        break;
      case 'person':
        panel._updatePersonButton(panel.shadowRoot);
        console.log('[DashView] Person component test completed');
        break;
      default:
        console.log('[DashView] Available components: config, admin, weather, person');
    }
  },
  
  simulateError: (errorType) => {
    console.log(`[DashView] Simulating ${errorType} error`);
    const panel = document.querySelector('dashview-panel');
    if (!panel) {
      console.error('[DashView] Panel not found');
      return;
    }
    
    switch (errorType) {
      case 'network':
        console.log('[DashView] Network error simulation - check browser network tab');
        break;
      case 'config':
        panel._adminLocalState.isLoaded = false;
        console.log('[DashView] Config error simulated - admin state reset');
        break;
      default:
        console.log('[DashView] Available error types: network, config');
    }
  },
  
  resetState: () => {
    const panel = document.querySelector('dashview-panel');
    if (!panel) {
      console.error('[DashView] Panel not found');
      return;
    }
    
    panel._adminLocalState.isLoaded = false;
    panel._lastEntityStates.clear();
    console.log('[DashView] Panel state reset');
  }
};

customElements.define('dashview-panel', DashviewPanel);
