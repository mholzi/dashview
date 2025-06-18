class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._contentReady = false;
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
  }

  // When the HASS object is passed to the panel, store it and update content
  set hass(hass) {
    this._hass = hass;
    if (this._contentReady) {
      this._handleHassUpdate();
    }
  }

  // Granular state management - Principle 3
  _handleHassUpdate() {
    if (!this._hass) return;

    // Ensure initial entity states are loaded (Issue #34 fix)
    this._ensureInitialEntityStates();

    // Check for entity changes and update only affected components
    this._checkEntityChanges();
  }

  // Get all cover entities from configuration
  _getAllCoverEntities() {
    const coverEntities = [];
    
    // Get covers from house configuration
    if (this._houseConfig && this._houseConfig.rooms) {
      Object.values(this._houseConfig.rooms).forEach(room => {
        if (room.covers && Array.isArray(room.covers)) {
          coverEntities.push(...room.covers);
        }
      });
    }
    
    return [...new Set(coverEntities)]; // Remove duplicates
  }

  // Ensure initial entity states are properly loaded - Issue #34 fix
  _ensureInitialEntityStates() {
    if (!this._hass) return;
    
    const weatherEntityId = this._getCurrentWeatherEntityId();
    const coverEntities = this._getAllCoverEntities();
    const entitiesToWatch = [
      weatherEntityId,
      'person.markus',
      'sensor.frankfurt_m_taunusanlage_departures_via_dreieich_buchschlag',
      'sensor.dreieich_buchschlag_departures_via_frankfurt_hbf',
      ...coverEntities
    ];

    // Force initial load of entity states if they're not already tracked
    let initializedCount = 0;
    for (const entityId of entitiesToWatch) {
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

  // Check for entity state changes - Principle 3
  _checkEntityChanges() {
    const weatherEntityId = this._getCurrentWeatherEntityId();
    const coverEntities = this._getAllCoverEntities();
    const entitiesToWatch = [
      weatherEntityId,
      'person.markus',
      'sensor.frankfurt_m_taunusanlage_departures_via_dreieich_buchschlag',
      'sensor.dreieich_buchschlag_departures_via_frankfurt_hbf',
      ...coverEntities
    ];

    let hasChanges = false;
    for (const entityId of entitiesToWatch) {
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
      const coverEntities = this._getAllCoverEntities();
      
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
        default:
          // Check if it's a cover entity
          if (coverEntities.includes(entityId)) {
            this.updateCoverControls(entityId);
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

  // Update cover controls when entity states change
  updateCoverControls(entityId) {
    // Find all active popups and update cover controls in them
    const shadow = this.shadowRoot;
    if (!shadow) return;

    const activePopups = shadow.querySelectorAll('.popup.active');
    activePopups.forEach(popup => {
      const sliders = popup.querySelectorAll(`.slider[data-entity="${entityId}"]`);
      sliders.forEach(slider => {
        const coverState = this._hass.states[entityId];
        if (coverState) {
          const position = coverState.attributes.current_position || 0;
          slider.value = position;
          const valueDisplay = slider.parentElement.querySelector('.slider-value');
          if (valueDisplay) {
            valueDisplay.textContent = Math.floor(position) + '%';
          }
        }
      });
    });
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

        /* Default to light mode variables */
        --background: #f5f7fa;
        --popupBG: #fafbfc;
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
          --popupBG: #28282A;
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
    `;
    shadow.appendChild(cssVariables);
  }

  async loadContent() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    try {
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

      // Load configuration before enabling entity watching
      await this.loadConfiguration();
      
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
    const badge = section.querySelector('.info-badge');
    
    if (motionEntity.state === 'on') {
      prefixElement.textContent = 'Im Haus ist seit';
      section.classList.remove('hidden');
      badge.classList.add('green');
      badge.classList.remove('red');
      badgeElement.textContent = 'Jetzt🏡';
    } else {
      prefixElement.textContent = 'Die letzte Bewegung im Haus war vor';
      section.classList.remove('hidden');
      badge.classList.remove('green');
      badge.classList.add('red');
      
      // Calculate time difference
      const lastChanged = new Date(motionEntity.last_changed);
      const now = new Date();
      const diffSeconds = Math.floor((now - lastChanged) / 1000);
      
      let timeText = 'Unbekannt';
      if (diffSeconds < 60) {
        timeText = 'Jetzt';
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        timeText = `${minutes} Minuten`;
      } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        timeText = `${hours} Stunden`;
      } else {
        const days = Math.floor(diffSeconds / 86400);
        timeText = `${days} Tagen`;
      }
      badgeElement.textContent = `${timeText}🏡`;
    }
  }

  updateWindowsSection(shadow) {
    const section = shadow.querySelector('.windows-section');
    if (!section) return;
    
    // Count open windows
    let openWindows = 0;
    Object.values(this._hass.states).forEach(entity => {
      if (entity.entity_id.includes('binary_sensor.fenster') && entity.state === 'on') {
        openWindows++;
      }
    });
    
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
            try {
                // Try to load content from external file first
                const response = await fetch(`/local/dashview/${popupType}.html`);
                if (response.ok) {
                    const html = await response.text();
                    targetPopup = this.createPopupFromTemplate(popupId, popupType, html);
                } else {
                    // If no external file, create with placeholder content
                    const content = `<div class="placeholder">Content for ${this.getPopupTitleForType(popupType)}</div>`;
                    targetPopup = this.createPopupFromTemplate(popupId, popupType, content);
                }
                
                if (targetPopup) {
                    this.reinitializePopupContent(targetPopup);
                }
            } catch (err) {
                console.error(`[DashView] Error creating popup for ${popupType}:`, err);
                const errorContent = `<div class="placeholder">Error loading: ${err.message}</div>`;
                targetPopup = this.createPopupFromTemplate(popupId, popupType, errorContent);
                if (targetPopup) {
                    this.reinitializePopupContent(targetPopup);
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

        // Handle info card section clicks
        const infoSection = e.target.closest('.info-section');
        if (infoSection) {
            if (infoSection.classList.contains('motion-section') || infoSection.classList.contains('windows-section')) {
                window.location.hash = '#security';
            } else if (infoSection.classList.contains('dryer-section')) {
                window.location.hash = '#waschkeller';
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

        const addFloorBtn = e.target.closest('#add-floor');
        if (addFloorBtn) {
            this.addFloor();
        }

        const deleteFloorBtn = e.target.closest('.delete-button');
        if (deleteFloorBtn) {
            const floorKey = deleteFloorBtn.dataset.floorKey;
            this.deleteFloor(floorKey);
        }
    });
  }
  
  // Method to update weather components
  updateWeatherComponents(shadow) {
    if (!this._hass) return;
    
    const weatherEntityId = this._getCurrentWeatherEntityId();
    const weatherState = this._hass.states[weatherEntityId];
    if (!weatherState) return;

    // Update current weather card
    this.updateCurrentWeather(shadow, weatherState);
    
    // Update hourly forecast
    this.updateHourlyForecast(shadow, weatherState);
    
    // Initialize daily forecast tabs
    this.initializeDailyForecast(shadow, weatherState);
  }

  // Method to update current weather display
  updateCurrentWeather(shadow, weatherState) {
    const iconElement = shadow.getElementById('current-weather-icon');
    const tempElement = shadow.getElementById('current-temperature');
    const conditionElement = shadow.getElementById('current-condition');
    const feelsLikeElement = shadow.getElementById('feels-like-temp');
    const humidityElement = shadow.getElementById('humidity');
    const windElement = shadow.getElementById('wind-speed');

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

  // Method to update hourly forecast
  updateHourlyForecast(shadow, weatherState) {
    const container = shadow.getElementById('hourly-forecast');
    if (!container || !weatherState.attributes.forecast) return;

    container.innerHTML = '';
    
    // Show next 8 hours of forecast
    const hourlyData = weatherState.attributes.forecast.slice(0, 8);
    
    hourlyData.forEach(forecast => {
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

  // Method to initialize daily forecast tabs
  initializeDailyForecast(shadow, weatherState) {
    const tabs = shadow.querySelectorAll('.forecast-tab');
    const content = shadow.getElementById('daily-forecast-content');
    
    if (!tabs.length || !content || !weatherState.attributes.forecast) return;

    // Add click handlers to tabs
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const dayIndex = parseInt(tab.dataset.day);
        this.showDailyForecast(content, weatherState, dayIndex);
      });
    });

    // Show today's forecast by default
    this.showDailyForecast(content, weatherState, 0);
  }

  // Method to show daily forecast for a specific day
  showDailyForecast(container, weatherState, dayIndex) {
    if (!weatherState.attributes.forecast) return;

    // Get forecast for the specified day
    const dailyForecast = this.getDailyForecast(weatherState.attributes.forecast, dayIndex);
    
    if (!dailyForecast) {
      container.innerHTML = '<div>Keine Daten verfügbar</div>';
      return;
    }

    container.innerHTML = `
      <div class="daily-forecast">
        <div class="daily-icon">
          <img src="/local/weather_icons/${dailyForecast.condition}.svg" alt="${dailyForecast.condition}">
        </div>
        <div class="daily-info">
          <div class="daily-condition">${this.translateWeatherCondition(dailyForecast.condition)}</div>
          <div class="daily-temps">
            <span class="daily-high">${Math.round(dailyForecast.temperature)}°C</span>
            <span class="daily-low">${dailyForecast.templow ? Math.round(dailyForecast.templow) + '°C' : ''}</span>
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
  
  // Popup icon mapping for different popup types
  getPopupIconForType(popupType) {
    const iconMap = {
      'security': 'mdi-security',
      'weather': 'mdi-weather-partly-cloudy',
      'music': 'mdi-music',
      'admin': 'mdi-cog',
      'calendar': 'mdi-calendar',
      'settings': 'mdi-cog',
      'bahn': 'mdi-train',
      // Room icons
      'buero': 'mdi-briefcase',
      'wohnzimmer': 'mdi-sofa',
      'kueche': 'mdi-stove',
      'kinderzimmer': 'mdi-toy-brick',
      'gaesteklo': 'mdi-toilet',
      'eingang': 'mdi-door',
      'aupair': 'mdi-account',
      'elternbereich': 'mdi-bed'
    };
    return iconMap[popupType] || 'mdi-help-circle';
  }

  // Get popup title for different popup types
  getPopupTitleForType(popupType) {
    const titleMap = {
      'security': 'Sicherheit',
      'weather': 'Wetter',
      'music': 'Medien',
      'admin': 'Admin View',
      'calendar': 'Kalender',
      'settings': 'Einstellungen',
      'bahn': 'Bahn',
      // Room titles
      'buero': 'Büro',
      'wohnzimmer': 'Wohnzimmer',
      'kueche': 'Küche',
      'kinderzimmer': 'Kinderzimmer',
      'gaesteklo': 'Gästeklo',
      'eingang': 'Eingang',
      'aupair': 'Aupair',
      'elternbereich': 'Elternbereich'
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

  reinitializePopupContent(popup) {
    const closeBtn = popup.querySelector('.popup-close');
    if (closeBtn) {
        closeBtn.onclick = () => this.closePopup();
    }
    
    // Initialize cover controls
    this.initializeCoverControls(popup);
    
    popup.querySelectorAll('.tabs-container').forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabContents = container.querySelectorAll('.tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                tabContents.forEach(content => content.classList.toggle('active', content.id === targetId));
                
                // Load admin configuration when header buttons tab is activated
                if (targetId === 'header-buttons-tab') {
                    setTimeout(() => this.loadAdminConfiguration(), 100);
                }
                
                // Load floor maintenance when floor maintenance tab is activated
                if (targetId === 'floor-maintenance-tab') {
                    setTimeout(() => this.loadFloorMaintenance(), 100);
                }
                
                // Load weather entity configuration when weather tab is activated
                if (targetId === 'weather-tab') {
                    setTimeout(() => this.loadWeatherEntityConfiguration(), 100);
                }
            });
        });
        if(tabButtons.length > 0) tabButtons[0].click();
    });
  }

  // Initialize cover controls functionality
  initializeCoverControls(popup) {
    if (!popup || !this._hass) return;

    // Handle expand/collapse button
    const expandButton = popup.querySelector('#expand-covers');
    const expandedControls = popup.querySelector('#expanded-covers');
    
    if (expandButton && expandedControls) {
      expandButton.addEventListener('click', () => {
        const isExpanded = expandedControls.style.display !== 'none';
        expandedControls.style.display = isExpanded ? 'none' : 'block';
        expandButton.classList.toggle('expanded', !isExpanded);
      });
    }

    // Initialize sliders and their values
    const sliders = popup.querySelectorAll('.slider');
    sliders.forEach(slider => {
      const valueDisplay = slider.parentElement.querySelector('.slider-value');
      const entityId = slider.getAttribute('data-entity');
      
      if (entityId && this._hass.states[entityId]) {
        const coverState = this._hass.states[entityId];
        const position = coverState.attributes.current_position || 0;
        slider.value = position;
        if (valueDisplay) {
          valueDisplay.textContent = Math.floor(position) + '%';
        }
      }

      // Update display when slider moves
      slider.addEventListener('input', (e) => {
        if (valueDisplay) {
          valueDisplay.textContent = Math.floor(e.target.value) + '%';
        }
      });

      // Set position when slider is released
      slider.addEventListener('change', (e) => {
        const entityId = e.target.getAttribute('data-entity');
        if (entityId) {
          this.setCoverPosition(entityId, parseInt(e.target.value));
        }
      });
    });

    // Handle position buttons
    const positionButtons = popup.querySelectorAll('.position-btn');
    const mainSlider = popup.querySelector('#main-cover-slider');
    
    positionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const position = parseInt(button.getAttribute('data-position'));
        const mainEntity = mainSlider ? mainSlider.getAttribute('data-entity') : null;
        
        if (mainEntity) {
          this.setCoverPosition(mainEntity, position);
          // Update main slider display
          if (mainSlider) {
            mainSlider.value = position;
            const valueDisplay = mainSlider.parentElement.querySelector('.slider-value');
            if (valueDisplay) {
              valueDisplay.textContent = position + '%';
            }
          }
        }
      });
    });

    // Update cover states periodically
    this.updateCoverStates(popup);
  }

  // Set cover position via Home Assistant service call
  setCoverPosition(entityId, position) {
    if (!this._hass) return;

    this._hass.callService('cover', 'set_cover_position', {
      entity_id: entityId,
      position: position
    }).catch(error => {
      console.error(`[DashView] Error setting cover position for ${entityId}:`, error);
    });
  }

  // Update cover states from Home Assistant
  updateCoverStates(popup) {
    if (!popup || !this._hass) return;

    const sliders = popup.querySelectorAll('.slider[data-entity]');
    sliders.forEach(slider => {
      const entityId = slider.getAttribute('data-entity');
      const coverState = this._hass.states[entityId];
      
      if (coverState) {
        const position = coverState.attributes.current_position || 0;
        slider.value = position;
        const valueDisplay = slider.parentElement.querySelector('.slider-value');
        if (valueDisplay) {
          valueDisplay.textContent = Math.floor(position) + '%';
        }
      }
    });
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
        // Re-initialize entity watching with new cover entities
        this._handleHassUpdate();
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
      
      // Load weather entity configuration only once - Principle 12
      if (!this._adminLocalState.weatherEntity) {
        this._adminLocalState.weatherEntity = this._getCurrentWeatherEntityId();
      }
      
      // Populate dropdown using local state
      this._populateWeatherEntityDropdown(weatherSelector, weatherEntities, this._adminLocalState.weatherEntity);
      
      console.log('[DashView] Weather entity configuration loaded successfully');
    } catch (error) {
      console.error('[DashView] Error loading weather entity configuration:', error);
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
    try {
      // Try to get from configured weather sensor
      const weatherSensor = this._hass.states['sensor.dashview_configured_weather'];
      if (weatherSensor && weatherSensor.state && this._hass.states[weatherSensor.state]) {
        return weatherSensor.state;
      }
    } catch (error) {
      console.warn('[DashView] Could not get current weather entity from sensor:', error);
    }
    
    // Fall back to hardcoded default for backward compatibility
    return 'weather.forecast_home';
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

    if (!weatherSelector || !this._hass) return;

    const selectedEntity = weatherSelector.value;
    if (!selectedEntity) {
      console.warn('[DashView] No weather entity selected');
      return;
    }

    try {
      // Call the service to save the weather entity
      await this._hass.callService('dashview', 'set_weather_entity', {
        entity_id: selectedEntity
      });
      
      // Update local state only after successful save - Principle 12
      this._adminLocalState.weatherEntity = selectedEntity;
      
      console.log('[DashView] Weather entity saved successfully:', selectedEntity);
      
      // Show success feedback (if there's a status element in weather tab)
      const statusElement = shadow.querySelector('#weather-status');
      if (statusElement) {
        this._setStatusMessage(statusElement, '✓ Weather entity saved successfully', 'success');
      }
      
    } catch (error) {
      console.error('[DashView] Error saving weather entity:', error);
      
      // Show error feedback
      const statusElement = shadow.querySelector('#weather-status');
      if (statusElement) {
        this._setStatusMessage(statusElement, `✗ Error saving weather entity: ${error.message}`, 'error');
      }
    }
  }

  // Floor Maintenance Functions - Principle 1, 2 & 12
  async loadFloorMaintenance() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('floor-maintenance-status');

    if (!statusElement) return;

    if (!this._hass) {
      this._setStatusMessage(statusElement, '✗ Home Assistant not available', 'error');
      return;
    }

    this._setStatusMessage(statusElement, 'Loading floor configuration...', 'loading');

    try {
      // Load floors configuration from API
      const config = await this._loadConfigFromAPI(['floors']);
      this._adminLocalState.floorsConfig = config.floors || {};

      // Render the floors list
      this._renderFloorsList();

      this._setStatusMessage(statusElement, '✓ Floor configuration loaded successfully', 'success');
      console.log('[DashView] Floor maintenance loaded successfully');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error loading floor configuration: ${error.message}`, 'error');
      console.error('[DashView] Error loading floor maintenance:', error);
    }
  }

  _renderFloorsList() {
    const shadow = this.shadowRoot;
    const floorsContainer = shadow.getElementById('floors-list');
    
    if (!floorsContainer) return;

    const floorsConfig = this._adminLocalState.floorsConfig || {};
    const floorIcons = floorsConfig.floor_icons || {};
    const floorSensors = floorsConfig.floor_sensors || {};

    if (Object.keys(floorIcons).length === 0) {
      floorsContainer.innerHTML = '<p>No floors configured. Add your first floor above.</p>';
      return;
    }

    let floorsHTML = '';
    Object.keys(floorIcons).forEach(floorKey => {
      const icon = floorIcons[floorKey] || 'mdi:help-circle';
      const sensor = floorSensors[floorKey] || 'Not set';
      
      floorsHTML += `
        <div class="floor-item">
          <div class="floor-info">
            <div class="floor-name">${floorKey}</div>
            <div class="floor-details">Icon: ${icon} | Sensor: ${sensor}</div>
          </div>
          <div class="floor-actions">
            <button class="delete-button" data-floor-key="${floorKey}">Delete</button>
          </div>
        </div>
      `;
    });

    floorsContainer.innerHTML = floorsHTML;
  }

  async addFloor() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('floor-maintenance-status');
    
    // Get form values
    const floorKey = shadow.getElementById('new-floor-key').value.trim();
    const floorName = shadow.getElementById('new-floor-name').value.trim();
    const floorIcon = shadow.getElementById('new-floor-icon').value.trim();
    const floorSensor = shadow.getElementById('new-floor-sensor').value.trim();

    // Validate inputs
    if (!floorKey) {
      this._setStatusMessage(statusElement, '✗ Floor key is required', 'error');
      return;
    }

    if (!floorIcon) {
      this._setStatusMessage(statusElement, '✗ Floor icon is required', 'error');
      return;
    }

    if (!floorSensor) {
      this._setStatusMessage(statusElement, '✗ Floor sensor is required', 'error');
      return;
    }

    // Check if floor already exists
    const floorsConfig = this._adminLocalState.floorsConfig || {};
    const floorIcons = floorsConfig.floor_icons || {};
    
    if (floorIcons[floorKey]) {
      this._setStatusMessage(statusElement, '✗ Floor with this key already exists', 'error');
      return;
    }

    this._setStatusMessage(statusElement, 'Adding floor...', 'loading');

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

      this._adminLocalState.floorsConfig.floor_icons[floorKey] = floorIcon;
      this._adminLocalState.floorsConfig.floor_sensors[floorKey] = floorSensor;

      // Save to backend
      await this._saveConfigViaAPI('floors', this._adminLocalState.floorsConfig, (data) => 
        data && data.floor_icons && data.floor_sensors
      );

      // Clear form
      shadow.getElementById('new-floor-key').value = '';
      shadow.getElementById('new-floor-name').value = '';
      shadow.getElementById('new-floor-icon').value = '';
      shadow.getElementById('new-floor-sensor').value = '';

      // Refresh the floors list
      this._renderFloorsList();

      this._setStatusMessage(statusElement, '✓ Floor added successfully', 'success');
      console.log('[DashView] Floor added successfully:', floorKey);

    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error adding floor: ${error.message}`, 'error');
      console.error('[DashView] Error adding floor:', error);
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
