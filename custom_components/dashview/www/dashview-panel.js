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
      '.media-container': (el) => this._initializeMediaPlayerControls(el.closest('.popup'))
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
          // Check if it's a window sensor based on configuration
          if (this._isEntityOfType(entityId, 'window')) {
            this.updateWindowsSection(shadow);
          } else if (entityId.startsWith('cover.')) {
            this.updateCoverCard(shadow, entityId);
          } else if (entityId.startsWith('media_player.')) {
            this.updateMediaPlayerInPopups(shadow, entityId);
          } else if (this._isRoomHeaderEntity(entityId)) {
            // Update room header icons in both main screen and active room popups
            this.updateRoomHeaderIcons(shadow);
            this.updateRoomHeaderEntitiesInPopups(shadow, entityId);
          } else {
            console.log(`[DashView] No specific handler for entity: ${entityId}`);
          }
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
  getNextTrainDeparture(departureEntity, delayMin = 0) {
    if (!departureEntity || !departureEntity.attributes.next_departures) {
      return { time: '--:--', isDelayed: false };
    }

    const departures = departureEntity.attributes.next_departures;
    const now = new Date();

    for (const train of departures) {
      if (train.isCancelled) continue;

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
  updateTrainDepartureCards(shadow) {
    const trainCards = shadow.querySelectorAll('.train-departure-card');
    
    trainCards.forEach(card => {
      const conditions = card.dataset.conditions;
      const departureSensor = card.dataset.departureSensor;
      const delayMin = parseInt(card.dataset.delayMin) || 0;

      // If HASS is not available yet, keep cards visible with placeholder
      if (!this._hass) {
        card.classList.remove('hidden');
        const timeElement = card.querySelector('.train-time');
        if (timeElement) {
          timeElement.textContent = '--:--';
        }
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
  }

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

        const kioskButton = e.target.closest('.kiosk-button');
        if (kioskButton) {
            this.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true }));
        }

        const trainCard = e.target.closest('.train-departure-card');
        if (trainCard) {
            window.location.hash = '#bahn';
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

        const saveFloorsBtn = e.target.closest('#save-floors-config');
        if (saveFloorsBtn) {
            this.saveFloorsConfiguration();
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

        // Handle floor maintenance buttons
        const reloadFloorMaintenanceBtn = e.target.closest('#reload-floor-maintenance');
        if (reloadFloorMaintenanceBtn) {
            this.loadFloorMaintenance();
        }

        const saveFloorSensorsBtn = e.target.closest('#save-floor-sensors');
        if (saveFloorSensorsBtn) {
            this.saveFloorSensors();
        }

        // Handle room maintenance buttons
        const reloadRoomBtn = e.target.closest('#reload-room-maintenance');
        if (reloadRoomBtn) {
            this.loadRoomMaintenance();
        }

        const saveRoomBtn = e.target.closest('#save-room-button');
        if (saveRoomBtn) {
            this.saveRoom();
        }

        const editRoomBtn = e.target.closest('.room-edit-button');
        if (editRoomBtn) {
            const roomKey = editRoomBtn.dataset.roomKey;
            this._startEditRoom(roomKey);
        }

        const deleteRoomBtn = e.target.closest('.room-delete-button');
        if (deleteRoomBtn) {
            const roomKey = deleteRoomBtn.dataset.roomKey;
            this.deleteRoom(roomKey);
        }

        const saveRoomSensorBtn = e.target.closest('.room-sensor-save-button');
        if (saveRoomSensorBtn) {
            const roomKey = saveRoomSensorBtn.dataset.roomId;
            this.saveRoomCombinedSensor(roomKey);
        }
    });
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
  initializeDailyForecast(shadow, dailyData) {
    const tabs = shadow.querySelectorAll('.forecast-tab');
    const content = shadow.querySelector('#daily-forecast-content');
    
    if (!tabs.length || !content || !dailyData || dailyData.length === 0) return;

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        // Remove active class from all tabs
        tabs.forEach(t => t.classList.remove('active'));
        // Add active class to the clicked tab
        tab.classList.add('active');
        
        const dayIndex = parseInt(tab.dataset.day);
        this.showDailyForecast(content, dailyData, dayIndex);
      });
    });

    // Show today's forecast by default
    // We can simulate a click on the first tab to initialize the view
    tabs[0].click();
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
            <i class="mdi ${icon}" style="color: var(--gray000);"></i>
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

        if (roomConfig.covers && roomConfig.covers.length > 0) {
            // If covers exist, fetch and add the interactive card
            fetch('/local/dashview/templates/room-covers-card.html')
                .then(response => response.text())
                .then(html => {
                    const coversContainer = document.createElement('div');
                    coversContainer.innerHTML = html;
                    bodyElement.appendChild(coversContainer);
                    // The new dispatcher system will handle initialization
                    // when reinitializePopupContent is called
                }).catch(err => console.error('[DashView] Error loading covers card template:', err));
        } else {
            // If no covers exist, add a placeholder
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder'; // Use existing placeholder style
            placeholder.textContent = 'No covers configured for this room.';
            bodyElement.appendChild(placeholder);
        }
        
        // Check if the room has media players and inject the card
        if (roomConfig.media_players && roomConfig.media_players.length > 0) {
            // If media players exist, fetch and add the interactive card
            fetch('/local/dashview/templates/room-media-player-card.html')
                .then(response => response.text())
                .then(html => {
                    const mediaPlayerContainer = document.createElement('div');
                    mediaPlayerContainer.innerHTML = html;
                    bodyElement.appendChild(mediaPlayerContainer);
                    // The new dispatcher system will handle initialization
                    // when reinitializePopupContent is called
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
          if (targetId === 'header-buttons-tab') {
            setTimeout(() => this.loadAdminConfiguration(), 100);
          }
          if (targetId === 'floor-maintenance-tab') {
            setTimeout(() => this.loadFloorMaintenance(), 100);
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
        console.log(`[DashView] Fetching daily and hourly forecasts for ${entityId} using callWS`);

        // Fetch daily forecast using the correct hass.callWS method
        const dailyForecasts = await this._hass.callWS({
            type: 'weather/subscribe_forecast',
            forecast_type: 'daily',
            entity_id: entityId
        });

        // Fetch hourly forecast using the correct hass.callWS method
        const hourlyForecasts = await this._hass.callWS({
            type: 'weather/subscribe_forecast',
            forecast_type: 'hourly',
            entity_id: entityId
        });
        
        // Store the forecasts from the response
        this._weatherForecasts.daily = dailyForecasts.forecast || [];
        this._weatherForecasts.hourly = hourlyForecasts.forecast || [];

        console.log('[DashView] Forecasts updated successfully via callWS');
    } catch (error) {
        console.error(`[DashView] Error fetching weather forecasts for ${entityId}:`, error);
        this._weatherForecasts.daily = [];
        this._weatherForecasts.hourly = [];
    }
  }

  // Load configuration from centralized API - Principle 1 & 2
  async loadConfiguration() {
    try {
      // Try to load new house configuration first
      const houseConfig = await this._loadConfigFromAPI(['house']);
      if (houseConfig.house && Object.keys(houseConfig.house).length > 0) {
        this._houseConfig = houseConfig.house;
        console.log('[DashView] House configuration loaded successfully');
        return;
      }
      
      // Fallback to old configuration for backward compatibility
      const config = await this._loadConfigFromAPI(['floors', 'rooms']);
      this._floorsConfig = config.floors;
      this._roomsConfig = config.rooms;
      console.log('[DashView] Legacy configuration loaded successfully');
    } catch (error) {
      console.error('[DashView] Error loading configuration:', error);
      this._floorsConfig = {};
      this._roomsConfig = {};
      this._houseConfig = {};
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
  _generateHeaderButtonsFromHouseConfig() {
    let buttonsHTML = '';
    const rooms = this._houseConfig.rooms || {};
    const floors = this._houseConfig.floors || {};

    // Group rooms by floor
    const roomsByFloor = {};
    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
      const floorKey = roomConfig.floor;
      if (!roomsByFloor[floorKey]) {
        roomsByFloor[floorKey] = [];
      }
      roomsByFloor[floorKey].push({ key: roomKey, config: roomConfig });
    });

    // Generate buttons for each floor
    Object.entries(roomsByFloor).forEach(([floorKey, floorRooms]) => {
      const floorConfig = floors[floorKey];
      if (!floorConfig) return;

      const floorSensor = floorConfig.floor_sensor;
      const floorIcon = this._processIconName(floorConfig.icon || 'mdi:help-circle-outline');
      
      // Check if floor sensor is active
      const floorEntity = this._hass.states[floorSensor];
      const isFloorActive = floorEntity && floorEntity.state === 'on';

      if (isFloorActive) {
        // Add floor button
        buttonsHTML += `
          <button class="header-floor-button" data-floor="${floorKey}">
            <i class="mdi ${floorIcon}"></i>
          </button>
        `;

        // Add room buttons for this floor
        floorRooms.forEach(room => {
          const roomConfig = room.config;
          const sensorEntity = this._hass.states[roomConfig.combined_sensor];
          const isRoomActive = sensorEntity && sensorEntity.state === 'on';

          if (isRoomActive) {
            // Use configured icon first, fallback to storage mapping, then to default
            const configuredIcon = roomConfig.icon;
            const storageIcon = this._getRoomIconFromStorage(room.key);
            const roomIcon = this._processIconName(configuredIcon || storageIcon);
            buttonsHTML += `
              <button class="header-room-button" 
                      data-room="${room.key}" 
                      data-floor="${floorKey}"
                      data-sensor="${roomConfig.combined_sensor}"
                      data-navigation="#${room.key}"
                      title="${roomConfig.friendly_name}">
                <i class="mdi ${roomIcon}"></i>
              </button>
            `;
          }
        });
      }
    });

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
  async saveFloorsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');

    if (!statusElement) return;

    this._setStatusMessage(statusElement, 'Saving floors configuration...', 'loading');

    try {
      // Use local state for saving - Principle 12
      const configData = this._adminLocalState.floorsConfig;
      
      // Use generic saver with validation - Principle 2
      await this._saveConfigViaAPI('floors', configData, (data) => 
        data && data.floor_icons && data.floor_sensors
      );

      this._setStatusMessage(statusElement, '✓ Floors configuration saved successfully', 'success');

      // Update runtime configuration
      this._floorsConfig = configData;
      if (this._hass) {
        this.updateHeaderButtons(shadow);
      }

    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error saving floors config: ${error.message}`, 'error');
      console.error('[DashView] Error saving floors config:', error);
    }
  }

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

  // Floor Maintenance Functions - Principle 1, 2 & 12
  async loadFloorMaintenance() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('floor-maintenance-status');

    if (!statusElement || !this._hass) {
        this._setStatusMessage(statusElement, '✗ Home Assistant not available', 'error');
        return;
    }

    this._setStatusMessage(statusElement, 'Loading floors from Home Assistant...', 'loading');

    try {
        // Fetch floors from Home Assistant floor registry
        const floors = await this._loadConfigFromAPI(['ha_floors']);
        
        // Fetch the current sensor configuration
        const houseConfig = this._adminLocalState.houseConfig || (await this._loadConfigFromAPI(['house'])).house || {};
        const floorSensors = houseConfig.floor_sensors || {};

        this._renderFloorsList(floors.ha_floors, floorSensors);

        this._setStatusMessage(statusElement, '✓ Floors loaded successfully', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error loading floors: ${error.message}`, 'error');
        console.error('[DashView] Error loading floors:', error);
    }
  }

  _renderFloorsList(floors, floorSensors) {
    const shadow = this.shadowRoot;
    const floorsContainer = shadow.getElementById('floors-list');
    
    if (!floorsContainer) return;

    if (!floors || floors.length === 0) {
        floorsContainer.innerHTML = '<p>No floors configured in Home Assistant.</p>';
        return;
    }

    let floorsHTML = '';
    floors.forEach(floor => {
        const sensor = floorSensors[floor.floor_id] || '';
        floorsHTML += `
            <div class="floor-item">
                <div class="floor-info">
                    <div class="floor-name">${floor.name}</div>
                    <div class="floor-details">Icon: ${floor.icon}</div>
                </div>
                <div class="form-row">
                    <label for="floor-sensor-${floor.floor_id}">Activity Sensor:</label>
                    <input type="text" id="floor-sensor-${floor.floor_id}" class="form-input" value="${sensor}" placeholder="e.g., binary_sensor.ground_floor_active">
                </div>
            </div>
        `;
    });

    floorsContainer.innerHTML = floorsHTML;
  }

  async saveFloorSensors() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('floor-maintenance-status');
    
    try {
        // Get current house config
        const houseConfig = this._adminLocalState.houseConfig || (await this._loadConfigFromAPI(['house'])).house || {};
        
        // Get the floors from Home Assistant
        const floors = await this._loadConfigFromAPI(['ha_floors']);
        const newFloorSensors = {};
        
        floors.ha_floors.forEach(floor => {
            const input = shadow.getElementById(`floor-sensor-${floor.floor_id}`);
            if (input && input.value) {
                newFloorSensors[floor.floor_id] = input.value.trim();
            }
        });

        houseConfig.floor_sensors = newFloorSensors;

        this._setStatusMessage(statusElement, 'Saving floor sensors...', 'loading');
        
        await this._saveConfigViaAPI('house', houseConfig, (data) => data && data.rooms);
        this._adminLocalState.houseConfig = houseConfig;
        this._setStatusMessage(statusElement, '✓ Floor sensors saved successfully', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error saving floor sensors: ${error.message}`, 'error');
    }
  }

  _startEditFloor(floorKey) {
    const shadow = this.shadowRoot;
    const floorsConfig = this._adminLocalState.floorsConfig || {};
    const floorIcons = floorsConfig.floor_icons || {};
    const floorSensors = floorsConfig.floor_sensors || {};

    if (!floorIcons[floorKey]) return;

    // Populate the form with the floor's data
    shadow.getElementById('editing-floor-key').value = floorKey;
    shadow.getElementById('new-floor-key').value = floorKey;
    shadow.getElementById('new-floor-name').value = floorKey; // Assuming key and name are the same initially
    shadow.getElementById('new-floor-icon').value = floorIcons[floorKey];
    shadow.getElementById('new-floor-sensor').value = floorSensors[floorKey] || '';

    // Disable the key field to prevent changing it during an edit
    shadow.getElementById('new-floor-key').disabled = true;
    shadow.getElementById('new-floor-name').focus();
  }

  async saveFloor() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('floor-maintenance-status');

    // Get the key of the floor being edited, if any
    const originalKey = shadow.getElementById('editing-floor-key').value;
    const isEditing = !!originalKey;
    
    // Get form values
    const floorKey = shadow.getElementById('new-floor-key').value.trim();
    const floorName = shadow.getElementById('new-floor-name').value.trim();
    const floorIcon = shadow.getElementById('new-floor-icon').value.trim();
    const floorSensor = shadow.getElementById('new-floor-sensor').value.trim();

    // Validate inputs
    if (!floorKey || !floorName || !floorIcon || !floorSensor) {
      this._setStatusMessage(statusElement, '✗ All fields are required', 'error');
      return;
    }

    const floorsConfig = this._adminLocalState.floorsConfig || {};
    const floorIcons = floorsConfig.floor_icons || {};

    // If not editing and key already exists, show error
    if (!isEditing && floorIcons[floorKey]) {
      this._setStatusMessage(statusElement, '✗ Floor with this key already exists', 'error');
      return;
    }

    this._setStatusMessage(statusElement, 'Saving floor...', 'loading');

    try {
      // Update local state
      if (!this._adminLocalState.floorsConfig) {
        this._adminLocalState.floorsConfig = { floor_icons: {}, floor_sensors: {} };
      }
      if (!this._adminLocalState.floorsConfig.floor_icons) {
        this._adminLocalState.floorsConfig.floor_icons = {};
      }
      if (!this._adminLocalState.floorsConfig.floor_sensors) {
        this._adminLocalState.floorsConfig.floor_sensors = {};
      }

      // If editing and the key has changed, we need to remove the old entry
      if (isEditing && originalKey !== floorKey) {
        delete this._adminLocalState.floorsConfig.floor_icons[originalKey];
        delete this._adminLocalState.floorsConfig.floor_sensors[originalKey];
      }

      this._adminLocalState.floorsConfig.floor_icons[floorKey] = floorIcon;
      this._adminLocalState.floorsConfig.floor_sensors[floorKey] = floorSensor;

      // Save to backend
      await this._saveConfigViaAPI('floors', this._adminLocalState.floorsConfig, (data) => 
        data && data.floor_icons && data.floor_sensors
      );

      // Clear form and reset editing state
      shadow.getElementById('editing-floor-key').value = '';
      shadow.getElementById('new-floor-key').value = '';
      shadow.getElementById('new-floor-name').value = '';
      shadow.getElementById('new-floor-icon').value = '';
      shadow.getElementById('new-floor-sensor').value = '';
      shadow.getElementById('new-floor-key').disabled = false; // Re-enable for next time

      // Refresh the floors list
      this._renderFloorsList();

      this._setStatusMessage(statusElement, '✓ Floor saved successfully', 'success');
      console.log('[DashView] Floor saved successfully:', floorKey);

    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error saving floor: ${error.message}`, 'error');
      console.error('[DashView] Error saving floor:', error);
    }
  }

  async deleteFloor(floorKey) {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('floor-maintenance-status');
    
    if (!floorKey) {
      this._setStatusMessage(statusElement, '✗ Floor key is required', 'error');
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the floor "${floorKey}"?`)) {
      return;
    }

    this._setStatusMessage(statusElement, 'Deleting floor...', 'loading');

    try {
      // Update local state
      if (this._adminLocalState.floorsConfig) {
        if (this._adminLocalState.floorsConfig.floor_icons) {
          delete this._adminLocalState.floorsConfig.floor_icons[floorKey];
        }
        if (this._adminLocalState.floorsConfig.floor_sensors) {
          delete this._adminLocalState.floorsConfig.floor_sensors[floorKey];
        }
      }

      // Save to backend
      await this._saveConfigViaAPI('floors', this._adminLocalState.floorsConfig, (data) => 
        data && data.floor_icons && data.floor_sensors
      );

      // Refresh the floors list
      this._renderFloorsList();

      this._setStatusMessage(statusElement, '✓ Floor deleted successfully', 'success');
      console.log('[DashView] Floor deleted successfully:', floorKey);

    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error deleting floor: ${error.message}`, 'error');
      console.error('[DashView] Error deleting floor:', error);
    }
  }

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

  _populateFloorDropdown() {
    const shadow = this.shadowRoot;
    const selector = shadow.getElementById('new-room-floor');
    if (!selector) return;

    selector.innerHTML = ''; // Clear existing options
    const floors = this._adminLocalState.houseConfig?.floors || {};

    if (Object.keys(floors).length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No floors configured';
        option.disabled = true;
        selector.appendChild(option);
        return;
    }

    for (const [floorKey, floorConfig] of Object.entries(floors)) {
        const option = document.createElement('option');
        option.value = floorKey;
        option.textContent = floorConfig.friendly_name || floorKey;
        selector.appendChild(option);
    }
  }

  _startEditRoom(roomKey) {
    const shadow = this.shadowRoot;
    const room = this._adminLocalState.houseConfig.rooms[roomKey];
    
    if (!room) return;

    // Populate the form with the room's data
    shadow.getElementById('editing-room-key').value = roomKey;
    shadow.getElementById('new-room-key').value = roomKey;
    shadow.getElementById('new-room-name').value = room.friendly_name;
    shadow.getElementById('new-room-icon').value = room.icon;
    shadow.getElementById('new-room-floor').value = room.floor;
    shadow.getElementById('new-room-sensor').value = room.combined_sensor;

    // Disable the key field to prevent changing it during an edit
    shadow.getElementById('new-room-key').disabled = true;
    shadow.getElementById('new-room-name').focus();
  }

  async saveRoom() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('room-maintenance-status');

    // Get the key of the room being edited, if any
    const originalKey = shadow.getElementById('editing-room-key').value;
    const isEditing = !!originalKey;

    // Get form values
    const newKey = shadow.getElementById('new-room-key').value.trim();
    const newRoomData = {
      friendly_name: shadow.getElementById('new-room-name').value.trim(),
      icon: shadow.getElementById('new-room-icon').value.trim(),
      floor: shadow.getElementById('new-room-floor').value, // .value is correct for a select dropdown
      combined_sensor: shadow.getElementById('new-room-sensor').value.trim(),
      lights: isEditing ? (this._adminLocalState.houseConfig.rooms[originalKey]?.lights || []) : [],
      covers: isEditing ? (this._adminLocalState.houseConfig.rooms[originalKey]?.covers || []) : [],
      media_players: isEditing ? (this._adminLocalState.houseConfig.rooms[originalKey]?.media_players || []) : [],
    };

    // Validate inputs
    if (!newKey || !newRoomData.friendly_name || !newRoomData.icon || !newRoomData.floor || !newRoomData.combined_sensor) {
      this._setStatusMessage(statusElement, '✗ All fields are required', 'error');
      return;
    }

    if (!isEditing && this._adminLocalState.houseConfig.rooms[newKey]) {
      this._setStatusMessage(statusElement, '✗ Room with this key already exists', 'error');
      return;
    }

    this._setStatusMessage(statusElement, 'Saving room...', 'loading');

    try {
      const updatedHouseConfig = JSON.parse(JSON.stringify(this._adminLocalState.houseConfig));

      if (isEditing && originalKey !== newKey) {
        delete updatedHouseConfig.rooms[originalKey];
      }
      updatedHouseConfig.rooms[newKey] = newRoomData;

      // Use the new, more direct API format by sending the entire config object.
      await this._hass.callApi('POST', 'dashview/config', updatedHouseConfig);

      // Update the local state with the successfully saved config
      this._adminLocalState.houseConfig = updatedHouseConfig;

      // Clear form and reset editing state
      shadow.getElementById('editing-room-key').value = '';
      shadow.getElementById('new-room-key').value = '';
      shadow.getElementById('new-room-name').value = '';
      shadow.getElementById('new-room-icon').value = '';
      shadow.getElementById('new-room-floor').value = '';
      shadow.getElementById('new-room-sensor').value = '';
      shadow.getElementById('new-room-key').disabled = false;

      this._renderRoomsList();
      this._setStatusMessage(statusElement, '✓ Room saved successfully', 'success');
      console.log('[DashView] Room saved successfully:', newKey);

    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error saving room: ${error.message}`, 'error');
      console.error('[DashView] Error saving room:', error);
    }
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

    // Ensure room exists in config, create if not
    if (!houseConfig.rooms[roomKey]) {
      houseConfig.rooms[roomKey] = {
        friendly_name: roomKey, // Or find a way to get the friendly name
        icon: 'mdi:home-outline',
        floor: null // Needs assignment
      };
    }

    // Update the sensor for the specific room
    houseConfig.rooms[roomKey].combined_sensor = selectedSensor;

    this._setStatusMessage(statusElement, `Saving sensor for ${roomKey}...`, 'loading');

    try {
      await this._saveConfigViaAPI('house', houseConfig);
      this._adminLocalState.houseConfig = houseConfig; // Update local state
      this._setStatusMessage(statusElement, `✓ Sensor for ${roomKey} saved successfully!`, 'success');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error saving sensor: ${error.message}`, 'error');
    }
  }

  async deleteRoom(roomKey) {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('room-maintenance-status');
    
    if (!roomKey) {
      this._setStatusMessage(statusElement, '✗ Room key is required', 'error');
      return;
    }

    // Confirm deletion
    if (!confirm(`Are you sure you want to delete the room "${roomKey}"?`)) {
      return;
    }

    this._setStatusMessage(statusElement, 'Deleting room...', 'loading');

    try {
      // Update local state
      if (this._adminLocalState.houseConfig && this._adminLocalState.houseConfig.rooms) {
        delete this._adminLocalState.houseConfig.rooms[roomKey];
      }

      // Save to backend
      await this._saveConfigViaAPI('house', this._adminLocalState.houseConfig, (data) => 
        data && data.rooms && data.floors
      );

      // Refresh the rooms list
      this._renderRoomsList();

      this._setStatusMessage(statusElement, '✓ Room deleted successfully', 'success');
      console.log('[DashView] Room deleted successfully:', roomKey);

    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error deleting room: ${error.message}`, 'error');
      console.error('[DashView] Error deleting room:', error);
    }
  }

  // Media Player Management Methods
  async loadRoomMediaPlayerMaintenance() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('media-player-status');
    const roomSelector = shadow.getElementById('room-media-player-selector');
    const assignmentSection = shadow.getElementById('media-player-assignment-section');

    if (!statusElement || !roomSelector || !assignmentSection) return;

    if (!this._hass) {
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

      // Populate the room selector dropdown
      roomSelector.innerHTML = '<option value="">-- Select a Room --</option>';
      for (const [roomKey, roomConfig] of Object.entries(this._adminLocalState.houseConfig.rooms)) {
        const option = document.createElement('option');
        option.value = roomKey;
        option.textContent = roomConfig.friendly_name || roomKey;
        roomSelector.appendChild(option);
      }

      // Add event listener for room selection
      roomSelector.onchange = (e) => {
        const roomKey = e.target.value;
        if (roomKey) {
          this._displayRoomMediaPlayers(roomKey);
          assignmentSection.style.display = 'block';
        } else {
          assignmentSection.style.display = 'none';
        }
      };

      // Add event listener for save button
      shadow.getElementById('save-room-media-players').onclick = () => {
        const selectedRoom = roomSelector.value;
        if (selectedRoom) this.saveRoomMediaPlayers(selectedRoom);
      };
      
      // Add event listener for reload button
      shadow.getElementById('reload-media-players').onclick = () => this.loadRoomMediaPlayerMaintenance();

      this._setStatusMessage(statusElement, '✓ Ready', 'success');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error: ${error.message}`, 'error');
    }
  }

  _displayRoomMediaPlayers(roomKey) {
    const shadow = this.shadowRoot;
    const room = this._adminLocalState.houseConfig.rooms[roomKey];
    if (!room) return;

    shadow.getElementById('selected-room-name').textContent = room.friendly_name || roomKey;
    const assignedContainer = shadow.getElementById('assigned-media-players');
    const availableContainer = shadow.getElementById('available-media-players');

    assignedContainer.innerHTML = '';
    availableContainer.innerHTML = '';

    const assignedIds = new Set((room.media_players || []).map(p => p.entity));

    (this._adminLocalState.allMediaPlayers || []).forEach(player => {
      const isAssigned = assignedIds.has(player.entity_id);
      const container = isAssigned ? assignedContainer : availableContainer;
      
      const item = document.createElement('div');
      item.className = 'entity-list-item';
      item.innerHTML = `
        <span>${player.friendly_name} (${player.entity_id})</span>
        <button class="action-button" data-entity-id="${player.entity_id}" data-action="${isAssigned ? 'remove' : 'add'}">
          ${isAssigned ? 'Remove' : 'Add'}
        </button>
      `;
      container.appendChild(item);
    });

    // Add click handlers for Add/Remove buttons
    shadow.querySelectorAll('#media-player-assignment-section .action-button').forEach(button => {
      button.onclick = (e) => {
        const entityId = e.target.dataset.entityId;
        const action = e.target.dataset.action;
        let players = room.media_players || [];

        if (action === 'add') {
          players.push({ entity: entityId });
        } else {
          players = players.filter(p => p.entity !== entityId);
        }
        this._adminLocalState.houseConfig.rooms[roomKey].media_players = players;
        this._displayRoomMediaPlayers(roomKey); // Re-render the lists
      };
    });
  }

  async saveRoomMediaPlayers(roomKey) {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('media-player-status');
    this._setStatusMessage(statusElement, 'Saving media player assignments...', 'loading');

    try {
      await this._hass.callApi('POST', 'dashview/config', this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, `✓ Assignments for ${roomKey} saved!`, 'success');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error saving: ${error.message}`, 'error');
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
      container.innerHTML = summaryHTML;
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
    const rowTemplate = card.querySelector('#cover-row-template');

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
