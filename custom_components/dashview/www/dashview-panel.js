class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    console.log('[DashView] Initializing DashView panel...');
    this.attachShadow({ mode: 'open' });
    this._contentReady = false;
    this._floorsConfig = {};
    this._roomsConfig = {};
    this._musicConfig = {};
    this._weatherEntity = null; // Will be loaded from persistent config
    this._coversConfig = {};
    this._lightsConfig = {};
    this._scenesConfig = {};
    this._roomNotificationsConfig = {};
    this._windowWeatherConfig = {};
    this._otherDevicesConfig = {};
    this._floorTabsConfig = {};
    this._debugMode = localStorage.getItem('dashview_debug') === 'true';
    this._activeMusicTab = null; // Track the currently active music tab
    this._volumeSliderInteraction = new Set(); // Track which volume sliders are being interacted with
    this._loadingErrors = [];
    this._version = '1.0.0-debug'; // Updated with debugging enhancements
    
    if (this._debugMode) {
      console.log('[DashView] Debug mode enabled');
    }
    console.log(`[DashView] Version: ${this._version}`);
  }

  // When the HASS object is passed to the panel, store it and update content
  set hass(hass) {
    if (this._debugMode) {
      console.log('[DashView] HASS object received:', !!hass);
    }
    
    const isFirstTime = !this._hass;
    this._hass = hass;
    
    // Initialize weather entity on first hass connection
    if (isFirstTime && hass) {
      this.initializeWeatherEntity();
    }
    
    if (this._contentReady) {
      this.updateElements();
    } else if (this._debugMode) {
      console.log('[DashView] Content not ready yet, deferring update');
    }
  }

  // Initialize weather entity from persistent storage
  async initializeWeatherEntity() {
    try {
      // Try to load the weather entity from the backend API
      const response = await fetch('/api/dashview/weather_config');
      if (response.ok) {
        const data = await response.json();
        if (data.weather_entity && this._hass && this._hass.states[data.weather_entity]) {
          this._weatherEntity = data.weather_entity;
          // Also cache in localStorage for faster subsequent loads
          localStorage.setItem('dashview_weather_entity', data.weather_entity);
          if (this._debugMode) {
            console.log('[DashView] Loaded weather entity from backend:', data.weather_entity);
          }
          return;
        }
      }
    } catch (error) {
      console.warn('[DashView] Could not load weather entity from backend:', error);
    }

    // Fallback: try to load from localStorage cache
    const cachedWeatherEntity = localStorage.getItem('dashview_weather_entity');
    if (cachedWeatherEntity && this._hass && this._hass.states[cachedWeatherEntity]) {
      this._weatherEntity = cachedWeatherEntity;
      if (this._debugMode) {
        console.log('[DashView] Loaded cached weather entity:', cachedWeatherEntity);
      }
    } else if (this._debugMode) {
      console.log('[DashView] No valid weather entity found, will use fallback logic');
    }
  }

  connectedCallback() {
    console.log('[DashView] Component connected to DOM');
    this._performStartupCheck();
    this.loadContent();
  }

  // Perform basic startup integrity checks
  _performStartupCheck() {
    if (this._debugMode) {
      console.log('[DashView] Performing startup checks...');
    }
    
    // Check if shadow DOM is available
    if (!this.shadowRoot) {
      console.error('[DashView] Shadow DOM not available');
      return false;
    }
    
    // Check if we're in a proper browser environment
    if (typeof fetch === 'undefined') {
      console.error('[DashView] Fetch API not available');
      return false;
    }
    
    // Check if localStorage is available for debug settings
    try {
      localStorage.getItem('test');
    } catch (e) {
      console.warn('[DashView] localStorage not available, debug settings won\'t persist');
    }
    
    if (this._debugMode) {
      console.log('[DashView] Startup checks passed');
    }
    
    return true;
  }

  async loadContent() {
    console.log('[DashView] Starting content load...');
    const shadow = this.shadowRoot;
    if (!shadow) {
      console.error('[DashView] No shadow root available');
      return;
    }

    // Clear any existing content
    shadow.innerHTML = '';

    try {
      console.log('[DashView] Fetching HTML resources...');
      // Fetch only the HTML content
      const htmlText = await fetch('/local/dashview/index.html').then(res => {
        if (!res.ok) throw new Error(`Failed to load HTML content: ${res.status} ${res.statusText}`);
        return res.text();
      });

      console.log('[DashView] Resources loaded successfully, building DOM...');

      // --- NEW INLINE CSS APPROACH ---
      console.log('[DashView] Loading stylesheets inline...');
      await this.loadStylesheetsInline(shadow);
      // --- END OF NEW APPROACH ---

      // Parse the HTML and extract just the body content for Shadow DOM
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlText, 'text/html');
      const bodyContent = doc.body.innerHTML;
      
      const content = document.createElement('div');
      content.innerHTML = bodyContent;
      shadow.appendChild(content);
      
      console.log('[DashView] Loading templates...');
      await this.loadTemplates(shadow);
      
      console.log('[DashView] Initializing card...');
      this.initializeCard(shadow);

      // Initialize cover interactions
      this.handleCoverInteractions();

      // Initialize light interactions
      this.handleLightInteractions();

      // Initialize other devices interactions
      this.handleOtherDevicesInteractions();

      this._contentReady = true;
      console.log('[DashView] Content ready, updating elements...');
      
      if (this._hass) {
        this.updateElements();
      } else {
        console.log('[DashView] HASS not available yet, waiting...');
      }

    } catch (error) {
      console.error('[DashView] Critical error loading panel:', error);
      this._loadingErrors.push({
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack
      });
      
      shadow.innerHTML = `
        <div style="color: red; padding: 16px; font-family: monospace; border: 1px solid #ff0000; background: #fff5f5;">
          <h3>🚫 DashView Loading Error</h3>
          <p><strong>Error:</strong> ${error.message}</p>
          <details style="margin-top: 10px;">
            <summary>Debug Information</summary>
            <pre style="margin-top: 10px; padding: 10px; background: #f5f5f5; overflow: auto;">${error.stack}</pre>
            <p><strong>Troubleshooting:</strong></p>
            <ul>
              <li>Check browser console for additional errors</li>
              <li>Verify files exist at /local/dashview/</li>
              <li>Check Home Assistant logs</li>
              <li>Enable debug mode: localStorage.setItem('dashview_debug', 'true')</li>
            </ul>
          </details>
        </div>
      `;
    }
  }

  // New method to find all data-template placeholders and load their HTML
  async loadTemplates(container) {
    const placeholders = container.querySelectorAll('[data-template]');
    console.log(`[DashView] Loading ${placeholders.length} templates...`);
    
    if (placeholders.length === 0) {
      console.warn('[DashView] No templates found to load');
    }
    
    for (const el of placeholders) {
      const templateName = el.dataset.template;
      try {
        if (this._debugMode) {
          console.log(`[DashView] Loading template: ${templateName}`);
        }
        const response = await fetch(`/local/dashview/templates/${templateName}.html`);
        if (response.ok) {
          el.innerHTML = await response.text();
          if (this._debugMode) {
            console.log(`[DashView] Template ${templateName} loaded successfully`);
          }
        } else {
          const errorMsg = `Failed to load template: ${templateName} (${response.status})`;
          console.error(`[DashView] ${errorMsg}`);
          el.innerHTML = `<div style="color: orange; padding: 8px; border: 1px dashed orange; background: #fff8e1;">${errorMsg}</div>`;
        }
      } catch (err) {
        const errorMsg = `Error loading template: ${templateName} - ${err.message}`;
        console.error(`[DashView] ${errorMsg}`, err);
        el.innerHTML = `<div style="color: red; padding: 8px; border: 1px solid red; background: #ffebee;">${errorMsg}</div>`;
      }
    }
    console.log('[DashView] All templates processed');
  }

  // New method to load stylesheets inline as <style> tags
  async loadStylesheetsInline(shadow) {
    const stylesheets = [
      {
        name: 'Google Fonts',
        url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&display=swap',
        critical: true
      },
      {
        name: 'Material Design Icons',
        url: 'https://cdn.jsdelivr.net/npm/@mdi/font@7.4.47/css/materialdesignicons.min.css',
        critical: true
      },
      {
        name: 'Main Stylesheet', 
        url: '/local/dashview/style.css',
        critical: true
      }
    ];

    for (const stylesheet of stylesheets) {
      try {
        console.log(`[DashView] Loading ${stylesheet.name}...`);
        
        const response = await fetch(stylesheet.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${stylesheet.name}: ${response.status} ${response.statusText}`);
        }
        
        const cssText = await response.text();
        
        // Create style element and inject CSS
        const styleElement = document.createElement('style');
        styleElement.setAttribute('data-source', stylesheet.name);
        styleElement.textContent = cssText;
        
        // Insert at the beginning of shadow root to ensure proper cascade
        shadow.insertBefore(styleElement, shadow.firstChild);
        
        console.log(`[DashView] ${stylesheet.name} loaded successfully (${cssText.length} characters)`);
        
      } catch (error) {
        console.error(`[DashView] Failed to load ${stylesheet.name}:`, error);
        
        if (stylesheet.critical) {
          // For critical stylesheets, create a fallback style element with basic styles
          const fallbackStyle = document.createElement('style');
          fallbackStyle.setAttribute('data-source', `${stylesheet.name} (fallback)`);
          
          if (stylesheet.name === 'Main Stylesheet') {
            // Provide essential fallback styles with CSS variables for Shadow DOM
            fallbackStyle.textContent = `
              :host {
                --primary-font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                --background: #f5f7fa;
                --gray000: #edeff2;
                --gray100: #e9eaec;
                --gray200: #d6d7d9;
                --gray800: #0f0f10;
                --gray500: #707173;
                --primary-text-color: #0f0f10;
                --secondary-text-color: #707173;
                font-family: var(--primary-font-family);
                background-color: var(--background);
                color: var(--primary-text-color);
                display: block;
                position: relative;
                min-height: 100vh;
              }
              body { 
                font-family: var(--primary-font-family); 
                background-color: var(--background);
                color: var(--primary-text-color);
                margin: 0;
                padding: 12px 0;
                padding-bottom: 90px;
              }
              .dashboard-container { 
                max-width: 500px; 
                margin: 0 auto; 
                padding: 0 12px;
                display: flex;
                flex-direction: column;
                gap: 12px;
                background-color: var(--background);
              }
              .placeholder {
                background-color: var(--gray000);
                border: 2px dashed var(--gray200);
                border-radius: 20px;
                padding: 16px;
                text-align: center;
                color: var(--secondary-text-color);
                font-size: 0.9em;
              }
              .popup { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 1000; }
              .popup-content { background: white; margin: 20px; padding: 20px; border-radius: 8px; }
            `;
          } else if (stylesheet.name === 'Material Design Icons') {
            // Provide fallback icons using Unicode symbols and CSS pseudo-elements
            fallbackStyle.textContent = `
              /* Material Design Icons Fallback - Using Unicode symbols */
              .mdi::before {
                display: inline-block;
                font-style: normal;
                font-variant: normal;
                text-rendering: auto;
                line-height: 1;
                font-family: system-ui, -apple-system, sans-serif;
              }
              
              /* Navigation Icons */
              .mdi-home::before { content: "🏠"; }
              .mdi-security::before { content: "🔒"; }
              .mdi-calendar::before { content: "📅"; }
              .mdi-music::before { content: "🎵"; }
              .mdi-cog::before { content: "⚙️"; }
              
              /* Common UI Icons */
              .mdi-menu::before { content: "☰"; }
              .mdi-close::before { content: "✕"; }
              .mdi-lightbulb::before { content: "💡"; }
              .mdi-help-circle-outline::before { content: "❓"; }
              .mdi-help-circle::before { content: "❓"; }
              
              /* Media Control Icons */
              .mdi-play::before { content: "▶️"; }
              .mdi-pause::before { content: "⏸️"; }
              .mdi-skip-backward::before { content: "⏮️"; }
              .mdi-skip-forward::before { content: "⏭️"; }
              
              /* Device Icons */  
              .mdi-devices::before { content: "📱"; }
              .mdi-robot-mower::before { content: "🤖"; }
              .mdi-robot-vacuum::before { content: "🤖"; }
              .mdi-dishwasher::before { content: "🍽️"; }
              .mdi-washing-machine::before { content: "👕"; }
              .mdi-tumble-dryer::before { content: "🌀"; }
              .mdi-tumble-dryer-off::before { content: "⭕"; }
              .mdi-printer::before { content: "🖨️"; }
              .mdi-printer-alert::before { content: "🖨️⚠️"; }
              .mdi-printer-pos::before { content: "🖨️"; }
              .mdi-fridge::before { content: "❄️"; }
              .mdi-thermometer::before { content: "🌡️"; }
              
              /* Door and Window Icons */
              .mdi-door::before { content: "🚪"; }
              .mdi-door-open::before { content: "🚪"; }
              .mdi-door-closed::before { content: "🚪"; }
              .mdi-door-closed-lock::before { content: "🔒"; }
              .mdi-door-sliding::before { content: "🚪"; }
              .mdi-door-sliding-open::before { content: "🚪"; }
              .mdi-window-open::before { content: "🪟"; }
              .mdi-window-closed::before { content: "🪟"; }
              
              /* Sensor Icons */
              .mdi-motion-sensor::before { content: "👁️"; }
              .mdi-motion-sensor-off::before { content: "👁️"; }
              .mdi-alert-circle::before { content: "⚠️"; }
              
              /* Ensure icons are properly sized */
              .nav-button .mdi::before,
              .header-button .mdi::before {
                font-size: 1.2em;
                vertical-align: middle;
              }
            `;
          }
          
          shadow.insertBefore(fallbackStyle, shadow.firstChild);
          console.log(`[DashView] Fallback styles applied for ${stylesheet.name}`);
        }
      }
    }
    
    console.log('[DashView] All stylesheets processed');
  }

  // New method to update elements based on hass state
  updateElements() {
    if (!this._hass) {
      console.log('[DashView] No HASS object available for updateElements');
      return;
    }
    
    if (this._debugMode) {
      console.log('[DashView] Updating elements with HASS state...');
    }
    
    const shadow = this.shadowRoot;
    if (!shadow) {
      console.error('[DashView] No shadow root available for updateElements');
      return;
    }

    try {
      // Update Weather Button
      this._safeUpdate('weather-button', () => {
        const weatherEntityId = this.getCurrentWeatherEntity();
        const weatherState = this._hass.states[weatherEntityId];
        if (weatherState) {
            const temp = (weatherState.forecast && weatherState.forecast.length > 0) ? weatherState.forecast[0].temperature : null;
            this._safeQueryUpdate(shadow, '.weather-button .name', el => el.textContent = temp ? `${temp.toFixed(1)}°C` : '-- °C');
            this._safeQueryUpdate(shadow, '.weather-button .label', el => el.innerHTML = weatherState.attributes && weatherState.attributes.temperature ? `${weatherState.attributes.temperature.toFixed(1)}<sup>°C</sup>` : '-- °C');
            this._safeQueryUpdate(shadow, '.weather-button .icon-container', el => el.innerHTML = `<img src="/local/weather_icons/${weatherState.state}.svg" width="40" height="40" alt="${weatherState.state}">`);
        } else if (this._debugMode) {
          console.warn(`[DashView] Weather entity not found: ${weatherEntityId}`);
        }
      });

      // Update Person Button
      this._safeUpdate('person-button', () => {
        const personState = this._hass.states['person.markus'];
        if (personState) {
            const img_src = personState.attributes && personState.attributes.entity_picture ? 
              personState.attributes.entity_picture : 
              (personState.state === 'home' ? '/local/weather_icons/IMG_0421.jpeg' : '/local/weather_icons/IMG_0422.jpeg');
            this._safeQueryUpdate(shadow, '.person-button .image-container', el => el.innerHTML = `<img src="${img_src}" width="45" height="45">`);
        } else if (this._debugMode) {
          console.warn('[DashView] Person entity not found: person.markus');
        }
      });

      // Update Train Departure Cards
      this._safeUpdate('train-departure-cards', () => this.updateTrainDepartureCards(shadow));
      
      // Update Info Card
      this._safeUpdate('info-card', () => this.updateInfoCard(shadow));
      
      // Update Weather Components
      this._safeUpdate('weather-components', () => this.updateWeatherComponents(shadow));
      
      // Update Music Popup
      this._safeUpdate('music-popup', () => this.updateMusicPopup(shadow));
      
      // Update Music Player States
      this._safeUpdate('music-player-states', () => this.updateMusicPlayerStates(shadow));

      // Update Room Media Players
      this._safeUpdate('room-media-players', () => this.updateRoomMediaPlayers(shadow));

      // Update Pollen Card
      this._safeUpdate('pollen-card', () => this.updatePollenCard(shadow));

      // Update Header Buttons
      this._safeUpdate('header-buttons', () => this.updateHeaderButtons(shadow));

      // Update Floor Tabs
      this._safeUpdate('floor-tabs', () => this.updateFloorTabs(shadow));

      // Update Cover Controls
      this._safeUpdate('cover-controls', () => this.updateCoverControls());

      // Update Cover Sections
      this._safeUpdate('cover-sections', () => this.updateCoverSections());

      // Update Light Controls
      this._safeUpdate('light-controls', () => this.updateLightControls());

      // Update Light Sections
      this._safeUpdate('light-sections', () => this.updateLightSections());
      
      // Update Other Devices Sections
      this._safeUpdate('other-devices-sections', () => this.updateOtherDevicesSections());
      
      // Update Other Devices Controls
      this._safeUpdate('other-devices-controls', () => this.updateOtherDevicesControls());
      
      // Update Scene Buttons
      this._safeUpdate('scene-buttons', () => this.updateSceneButtons(shadow));

      // Update Room Notifications
      this._safeUpdate('room-notifications', () => this.updateRoomNotifications(shadow));

      // Update Window/Weather Notifications
      this._safeUpdate('window-weather-notifications', () => this.updateWindowWeatherNotifications(shadow));

      // Update Alarm Card
      this._safeUpdate('alarm-card', () => this.updateAlarmCard(shadow));

      // Update Alarm Panel
      this._safeUpdate('alarm-panel', () => this.updateAlarmPanel(shadow));

      if (this._debugMode) {
        console.log('[DashView] Elements update completed successfully');
      }

    } catch (error) {
      console.error('[DashView] Critical error in updateElements:', error);
      this._showErrorOverlay(shadow, 'Update Error', error.message);
    }
  }

  // Helper method to safely execute update functions with error handling
  _safeUpdate(componentName, updateFn) {
    try {
      updateFn();
    } catch (error) {
      console.error(`[DashView] Error updating ${componentName}:`, error);
      if (this._debugMode) {
        console.error(`[DashView] Stack trace for ${componentName}:`, error.stack);
      }
    }
  }

  // Helper method to safely query and update DOM elements
  _safeQueryUpdate(container, selector, updateFn) {
    try {
      const element = container.querySelector(selector);
      if (element) {
        updateFn(element);
      } else if (this._debugMode) {
        console.warn(`[DashView] Element not found: ${selector}`);
      }
    } catch (error) {
      console.error(`[DashView] Error updating element ${selector}:`, error);
    }
  }

  // Helper method to show error overlay
  _showErrorOverlay(shadow, title, message) {
    const existingOverlay = shadow.querySelector('.dashview-error-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }
    
    const overlay = document.createElement('div');
    overlay.className = 'dashview-error-overlay';
    overlay.innerHTML = `
      <div style="position: fixed; top: 10px; right: 10px; background: #ff5722; color: white; padding: 12px; border-radius: 4px; z-index: 10000; max-width: 300px; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.3);">
        <strong>${title}</strong>
        <p style="margin: 8px 0 0 0; font-size: 12px;">${message}</p>
        <button onclick="this.parentElement.parentElement.remove()" style="background: none; border: 1px solid white; color: white; padding: 4px 8px; margin-top: 8px; cursor: pointer; border-radius: 2px;">Close</button>
      </div>
    `;
    shadow.appendChild(overlay);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (overlay.parentElement) {
        overlay.remove();
      }
    }, 10000);
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
    
    // Calculate time difference since last state change
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
    
    if (motionEntity.state === 'on') {
      prefixElement.textContent = 'Im Haus ist seit';
      section.classList.remove('hidden');
      badge.classList.add('green');
      badge.classList.remove('red');
      badgeElement.textContent = `${timeText}🏡`;
    } else {
      prefixElement.textContent = 'Die letzte Bewegung im Haus war vor';
      section.classList.remove('hidden');
      badge.classList.remove('green');
      badge.classList.add('red');
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
      
      // Handle closing popups with animation
      const currentActivePopups = context.querySelectorAll('.popup.active');
      currentActivePopups.forEach(popup => {
        popup.classList.remove('active');
      });
      
      context.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));

      if (hash && hash !== '#home') {
        const popupId = hash.substring(1) + '-popup';
        let targetPopup = context.querySelector('#' + popupId);
        if (!targetPopup) {
            targetPopup = document.createElement('div');
            targetPopup.id = popupId;
            targetPopup.className = 'popup';
            context.appendChild(targetPopup);
        }
        if (targetPopup.innerHTML.trim() === '') {
            try {
                const response = await fetch(`/local/dashview/${hash.substring(1)}.html`);
                if (!response.ok) throw new Error(`File not found`);
                const html = await response.text();
                targetPopup.innerHTML = html;
                this.reinitializePopupContent(targetPopup);
            } catch (err) {
                targetPopup.innerHTML = `<div class="popup-content"><span class="popup-close">&times;</span>Error loading: ${err.message}</div>`;
                 this.reinitializePopupContent(targetPopup);
            }
        } else {
            // For static popups like weather, also reinitialize content
            this.reinitializePopupContent(targetPopup);
        }
        
        // Add small delay to ensure previous popup animation completes, then show new popup
        setTimeout(() => {
          targetPopup.classList.add('active');
        }, currentActivePopups.length > 0 ? 50 : 0);
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


        const saveMusicBtn = e.target.closest('#save-music-config');
        if (saveMusicBtn) {
            this.saveMusicConfiguration();
        }

        const saveTemperatureBtn = e.target.closest('#save-temperature-config');
        if (saveTemperatureBtn) {
            this.saveTemperatureConfiguration();
        }

        const saveCoversBtn = e.target.closest('#save-covers-config');
        if (saveCoversBtn) {
            this.saveCoversConfiguration();
        }

        const saveScenesBtn = e.target.closest('#save-scenes-config');
        if (saveScenesBtn) {
            this.saveScenesConfiguration();
        }

        const saveRoomNotificationsBtn = e.target.closest('#save-room-notifications-config');
        if (saveRoomNotificationsBtn) {
            this.saveRoomNotificationsConfiguration();
        }

        const saveWindowWeatherBtn = e.target.closest('#save-window-weather-config');
        if (saveWindowWeatherBtn) {
            this.saveWindowWeatherConfiguration();
        }

        const saveOtherDevicesBtn = e.target.closest('#save-other-devices-config');
        if (saveOtherDevicesBtn) {
            this.saveOtherDevicesConfiguration();
        }

        const saveFloorTabsBtn = e.target.closest('#save-floor-tabs-config');
        if (saveFloorTabsBtn) {
            this.saveFloorTabsConfiguration();
        }

        const saveAlarmBtn = e.target.closest('#save-alarm-config');
        if (saveAlarmBtn) {
            this.saveAlarmConfiguration();
        }

        const saveWeatherEntityBtn = e.target.closest('#save-weather-entity');
        if (saveWeatherEntityBtn) {
            this.saveWeatherEntity();
        }

        // Handle scene button clicks
        const sceneButton = e.target.closest('.scene-button');
        if (sceneButton) {
            this.handleSceneButtonClick(sceneButton);
        }

        // Handle alarm mode button clicks
        const alarmButton = e.target.closest('.alarm-mode-button');
        if (alarmButton) {
            this.handleAlarmButtonClick(alarmButton);
        }
    });
  }
  
  // Method to update weather components
  updateWeatherComponents(shadow) {
    if (!this._hass) return;
    
    const weatherEntityId = this.getCurrentWeatherEntity();
    const weatherState = this._hass.states[weatherEntityId];
    if (!weatherState) return;

    // Update weather popup header icon
    const weatherPopupTitle = shadow.querySelector('#weather-popup h3');
    if (weatherPopupTitle && weatherState.state) {
      const currentIcon = weatherState.state;
      weatherPopupTitle.innerHTML = `<img src="/local/weather_icons/${currentIcon}.svg" alt="Weather" width="24" height="24" style="vertical-align: middle; margin-right: 8px;">Wetter`;
    }

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
    
    // Show next 9 hours of forecast (starting from hour 2 as per the provided code)
    const hourlyData = weatherState.attributes.forecast.slice(1, 10);
    
    hourlyData.forEach((forecast, index) => {
      const hourlyItem = document.createElement('div');
      hourlyItem.className = 'hourly-item';
      
      const date = new Date(forecast.datetime);
      const timeString = date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      const temp = forecast.temperature !== undefined ? `${forecast.temperature}°C` : '— °C';
      const wind = forecast.wind_speed !== undefined ? `${forecast.wind_speed.toFixed(1)} km/h` : '';
      const rain = forecast.precipitation !== undefined ? `${forecast.precipitation.toFixed(1)} mm` : '';
      const condition = forecast.condition || 'sunny';
      
      hourlyItem.innerHTML = `
        <div class="hourly-time">${timeString}</div>
        <div class="hourly-icon">
          <img src="/local/weather_icons/${condition}.svg" alt="${condition}" width="50" height="50">
        </div>
        <div class="hourly-temp">${temp}</div>
        <div class="hourly-wind">${wind}</div>
        <div class="hourly-rain">${rain}</div>
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
    if (!this._hass) return;
    
    // Define sensor mappings based on the provided configuration
    const sensorMappings = {
      0: { // Heute
        temp_sensor: 'sensor.temperature_forecast_today',
        condition_sensor: 'sensor.state_forecast_today',
        title: 'Heute'
      },
      1: { // Morgen
        temp_sensor: 'sensor.temperature_forecast_tomorrow', 
        condition_sensor: 'sensor.state_forecast_tomorrow',
        title: 'Morgen'
      },
      2: { // Übermorgen
        temp_sensor: 'sensor.temperature_forecast_day2',
        condition_sensor: 'sensor.state_forecast_day2', 
        title: 'Übermorgen'
      }
    };
    
    const mapping = sensorMappings[dayIndex];
    if (!mapping) {
      container.innerHTML = '<div>Keine Daten verfügbar</div>';
      return;
    }
    
    // Get sensor states with fallback to weather forecast if sensors don't exist
    const tempState = this._hass.states[mapping.temp_sensor];
    const conditionState = this._hass.states[mapping.condition_sensor];
    const precipitationState = this._hass.states['sensor.dreieich_precipitation'];
    
    // Fallback to weather forecast if sensors are not available
    let temp, condition;
    
    if (tempState?.state && tempState.state !== 'unavailable') {
      temp = parseFloat(tempState.state).toFixed(1) + '°C';
    } else if (weatherState?.attributes?.forecast && weatherState.attributes.forecast[dayIndex]) {
      // Fallback to weather forecast
      temp = Math.round(weatherState.attributes.forecast[dayIndex].temperature) + '°C';
    } else {
      temp = '— °C';
    }
    
    if (conditionState?.state && conditionState.state !== 'unavailable') {
      condition = conditionState.state;
    } else if (weatherState?.attributes?.forecast && weatherState.attributes.forecast[dayIndex]) {
      // Fallback to weather forecast
      condition = weatherState.attributes.forecast[dayIndex].condition;
    } else {
      condition = 'sunny';
    }
    
    // Condition translations
    const translations = {
      "sunny": "Sonnig", "clear-night": "Klar", "partlycloudy": "Teilweise bewölkt",
      "cloudy": "Bewölkt", "rainy": "Regnerisch", "pouring": "Starkregen", 
      "lightning": "Gewitter", "lightning-rainy": "Gewitter mit Regen",
      "windy": "Windig", "windy-variant": "Windig", "fog": "Nebel", "hail": "Hagel",
      "snowy": "Schnee", "snowy-rainy": "Schneeregen", "exceptional": "Außergewöhnlich"
    };
    
    let conditionText = translations[condition] || condition || "—";
    
    // Add precipitation if available
    const precipitation = precipitationState?.state;
    if (precipitation && !isNaN(parseFloat(precipitation)) && parseFloat(precipitation) > 0) {
      conditionText += ` – Niederschlag ${parseFloat(precipitation).toFixed(1)} mm`;
    }

    container.innerHTML = `
      <div class="daily-forecast">
        <div class="daily-icon">
          <img src="/local/weather_icons/${condition}.svg" alt="${condition}" width="120" height="120">
        </div>
        <div class="daily-info">
          <div class="daily-title">${mapping.title}</div>
          <div class="daily-temp">${temp}</div>
          <div class="daily-condition">${conditionText}</div>
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
  
  reinitializePopupContent(popup) {
    const closeBtn = popup.querySelector('.popup-close');
    if (closeBtn) {
        closeBtn.onclick = () => {
          // Remove active class to trigger slide-down animation
          popup.classList.remove('active');
          // Navigate back after animation completes
          setTimeout(() => {
            window.history.back();
          }, 300); // Match the CSS transition duration
        };
    }
    
    // Handle generic tabs
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
                // Load weather entity configuration when weather tab is activated
                if (targetId === 'weather-tab') {
                    setTimeout(() => this.loadWeatherEntityConfiguration(), 100);
                }
                // Load admin configuration when covers tab is activated
                if (targetId === 'covers-tab') {
                    setTimeout(() => this.loadAdminConfiguration(), 100);
                }
                // Load admin configuration when scenes tab is activated
                if (targetId === 'scenes-tab') {
                    setTimeout(() => this.loadAdminConfiguration(), 100);
                }
                // Load admin configuration when alarm tab is activated
                if (targetId === 'alarm-tab') {
                    setTimeout(() => this.loadAdminConfiguration(), 100);
                }
                // Load admin configuration when room notifications tab is activated
                if (targetId === 'room-notifications-tab') {
                    setTimeout(() => this.loadAdminConfiguration(), 100);
                }
                // Load admin configuration when other devices tab is activated
                if (targetId === 'other-devices-tab') {
                    setTimeout(() => this.loadAdminConfiguration(), 100);
                }
                // Load music configuration when music tab is activated
                if (targetId === 'music-tab') {
                    setTimeout(() => this.loadMusicAdminConfiguration(), 100);
                }
            });
        });
        if(tabButtons.length > 0) tabButtons[0].click();
    });
    
    // Handle weather popup specific initialization
    if (popup.id === 'weather-popup') {
        // Update all weather components when weather popup is opened
        this.updateWeatherComponents(this.shadowRoot);
    }
    
    // Handle admin popup specific initialization
    if (popup.id === 'admin-popup') {
        // Check if this admin popup has a weather tab and pre-load the configuration
        const weatherTab = popup.querySelector('#weather-tab');
        if (weatherTab) {
            // Load weather entity configuration immediately so it's ready when user clicks the tab
            setTimeout(() => this.loadWeatherEntityConfiguration(), 100);
        }
    }
    
    // Handle weather popup specific tabs
    const forecastTabs = popup.querySelectorAll('.forecast-tab');
    const forecastContent = popup.querySelector('#daily-forecast-content');
    if (forecastTabs.length > 0 && forecastContent) {
        forecastTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                forecastTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const dayIndex = parseInt(tab.dataset.day);
                const weatherEntityId = this.getCurrentWeatherEntity();
                const weatherState = this._hass ? this._hass.states[weatherEntityId] : null;
                if (weatherState) {
                    this.showDailyForecast(forecastContent, weatherState, dayIndex);
                }
            });
        });
        
        // Initialize with the first tab
        if (forecastTabs[0]) {
            forecastTabs[0].click();
        }
    }
  }

  // Load configuration from JSON files
  async loadConfiguration() {
    console.log('[DashView] Loading configuration files...');
    try {


      const [floorsResponse, roomsResponse, musicResponse, temperatureResponse, coversResponse, scenesResponse, lightsResponse, roomNotificationsResponse, windowWeatherResponse, otherDevicesResponse, floorTabsResponse, alarmResponse] = await Promise.all([


        fetch('/local/dashview/config/floors.json'),
        fetch('/local/dashview/config/rooms.json'),
        fetch('/local/dashview/config/music.json'),
        fetch('/local/dashview/config/temperature.json'),
        fetch('/local/dashview/config/covers.json'),
        fetch('/local/dashview/config/scenes.json'),
        fetch('/local/dashview/config/lights.json'),
        fetch('/local/dashview/config/room_notifications.json'),
        fetch('/local/dashview/config/other_devices.json'),
        fetch('/local/dashview/config/floor_tabs.json'),
        fetch('/local/dashview/config/window_weather_notifications.json'),
        fetch('/local/dashview/config/alarm.json'),

      ]);

      if (floorsResponse.ok && roomsResponse.ok) {
        this._floorsConfig = await floorsResponse.json();
        this._roomsConfig = await roomsResponse.json();
        console.log('[DashView] Floor and room configurations loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Floors config:', this._floorsConfig);
          console.log('[DashView] Rooms config:', this._roomsConfig);
        }
      } else {
        console.warn(`[DashView] Could not load floor/room configuration files - floors: ${floorsResponse.status}, rooms: ${roomsResponse.status}`);
        this._floorsConfig = {};
        this._roomsConfig = {};
      }

      // Load music configuration separately as it's optional
      if (musicResponse.ok) {
        this._musicConfig = await musicResponse.json();
        console.log('[DashView] Music configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Music config:', this._musicConfig);
        }
      } else {
        console.warn(`[DashView] Could not load music configuration file - status: ${musicResponse.status}`);
        this._musicConfig = {};
      }

      // Load temperature configuration separately as it's optional
      if (temperatureResponse.ok) {
        this._temperatureConfig = await temperatureResponse.json();
        console.log('[DashView] Temperature configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Temperature config:', this._temperatureConfig);
        }
      } else {
        console.warn(`[DashView] Could not load temperature configuration file - status: ${temperatureResponse.status}`);
        this._temperatureConfig = {};
      }

      // Load covers configuration separately as it's optional
      if (coversResponse.ok) {
        this._coversConfig = await coversResponse.json();
        console.log('[DashView] Covers configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Covers config:', this._coversConfig);
        }
      } else {
        console.warn(`[DashView] Could not load covers configuration file - status: ${coversResponse.status}`);
        this._coversConfig = {};
      }


      // Load lights configuration separately as it's optional
      if (lightsResponse.ok) {
        this._lightsConfig = await lightsResponse.json();
        console.log('[DashView] Lights configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Lights config:', this._lightsConfig);
        }
      } else {
        console.warn(`[DashView] Could not load lights configuration file - status: ${lightsResponse.status}`);
        this._lightsConfig = {};
      }

      // Load scenes configuration separately as it's optional
      if (scenesResponse.ok) {
        this._scenesConfig = await scenesResponse.json();
        console.log('[DashView] Scenes configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Scenes config:', this._scenesConfig);
        }
      } else {
        console.warn(`[DashView] Could not load scenes configuration file - status: ${scenesResponse.status}`);
        this._scenesConfig = {};

      }

      // Load room notifications configuration separately as it's optional
      if (roomNotificationsResponse.ok) {
        this._roomNotificationsConfig = await roomNotificationsResponse.json();
        console.log('[DashView] Room notifications configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Room notifications config:', this._roomNotificationsConfig);
        }
      } else {
        console.warn(`[DashView] Could not load room notifications configuration file - status: ${roomNotificationsResponse.status}`);
        this._roomNotificationsConfig = {};
      }

      // Load window/weather notifications configuration separately as it's optional
      if (windowWeatherResponse.ok) {
        this._windowWeatherConfig = await windowWeatherResponse.json();
        console.log('[DashView] Window/Weather notifications configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Window/Weather notifications config:', this._windowWeatherConfig);
        }
      } else {
        console.warn(`[DashView] Could not load window/weather notifications configuration file - status: ${windowWeatherResponse.status}`);
        this._windowWeatherConfig = {};
      }

      // Load other devices configuration separately as it's optional
      if (otherDevicesResponse.ok) {
        this._otherDevicesConfig = await otherDevicesResponse.json();
        console.log('[DashView] Other devices configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Other devices config:', this._otherDevicesConfig);
        }
      } else {
        console.warn(`[DashView] Could not load other devices configuration file - status: ${otherDevicesResponse.status}`);
        this._otherDevicesConfig = {};

      }

      // Load floor tabs configuration separately as it's optional
      if (floorTabsResponse.ok) {
        this._floorTabsConfig = await floorTabsResponse.json();
        console.log('[DashView] Floor tabs configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Floor tabs config:', this._floorTabsConfig);
        }
      } else {
        console.warn(`[DashView] Could not load floor tabs configuration file - status: ${floorTabsResponse.status}`);
        this._floorTabsConfig = {};
      }

      // Load alarm configuration separately as it's optional
      if (alarmResponse.ok) {
        this._alarmConfig = await alarmResponse.json();
        console.log('[DashView] Alarm configuration loaded successfully');
        if (this._debugMode) {
          console.log('[DashView] Alarm config:', this._alarmConfig);
        }
      } else {
        console.warn(`[DashView] Could not load alarm configuration file - status: ${alarmResponse.status}`);
        this._alarmConfig = {};
      }
    } catch (error) {
      console.error('[DashView] Error loading configuration:', error);
      this._floorsConfig = {};
      this._roomsConfig = {};
      this._musicConfig = {};
      this._temperatureConfig = {};
      this._coversConfig = {};
      this._lightsConfig = {};
      this._scenesConfig = {};
      this._roomNotificationsConfig = {};
      this._windowWeatherConfig = {};
      this._otherDevicesConfig = {};
      this._floorTabsConfig = {};
    }
  }

  // Update header buttons based on sensor states
  async updateHeaderButtons(shadow) {
    if (!this._floorsConfig || Object.keys(this._floorsConfig).length === 0) {
      await this.loadConfiguration();
    }

    const container = shadow.querySelector('[data-template="header-buttons"]');
    if (!container) return;

    // Create button container with scrollable styling
    container.innerHTML = `
      <div class="header-buttons-scroll">
        ${this.generateHeaderButtonsHTML()}
      </div>
    `;
  }

  // Generate HTML for header buttons
  generateHeaderButtonsHTML() {
    if (!this._hass || !this._floorsConfig || !this._roomsConfig) {
      return '<div class="loading-message">Loading...</div>';
    }

    let buttonsHTML = '';
    const floors = this._roomsConfig.floors || {};
    const floorIcons = this._floorsConfig.floor_icons || {};
    const floorSensors = this._floorsConfig.floor_sensors || {};

    // Generate buttons for each floor
    Object.entries(floors).forEach(([floorName, sensors]) => {
      const floorSensor = floorSensors[floorName];
      const floorIcon = floorIcons[floorName] || 'mdi:help-circle-outline';
      
      // Check if floor sensor is active
      const floorEntity = this._hass.states[floorSensor];
      const isFloorActive = floorEntity && floorEntity.state === 'on';

      if (isFloorActive) {
        // Add floor button
        buttonsHTML += `
          <button class="header-floor-button" data-floor="${floorName}">
            <i class="mdi ${floorIcon.replace('mdi:', '')}"></i>
          </button>
        `;

        // Add room buttons for this floor
        sensors.forEach(sensor => {
          const sensorEntity = this._hass.states[sensor];
          const isRoomActive = sensorEntity && sensorEntity.state === 'on';

          if (isRoomActive) {
            const roomIcon = sensorEntity.attributes?.icon || 'mdi:help-circle-outline';
            const roomType = sensorEntity.attributes?.room_type || '#unknown';
            
            buttonsHTML += `
              <button class="header-room-button" data-sensor="${sensor}" data-navigation="${roomType}">
                <i class="mdi ${roomIcon.replace('mdi:', '')}"></i>
              </button>
            `;
          }
        });
      }
    });

    return buttonsHTML || '<div class="no-activity">No active rooms</div>';
  }

  // Update Floor Tabs
  async updateFloorTabs(shadow) {
    if (!this._floorTabsConfig || Object.keys(this._floorTabsConfig).length === 0) {
      await this.loadConfiguration();
    }

    const container = shadow.querySelector('[data-template="floor-tabs"]');
    if (!container || !this._floorTabsConfig.floors || !this._floorTabsConfig.tabs) {
      if (container) {
        container.innerHTML = '<div class="loading-message">Floor tabs configuration not available</div>';
      }
      return;
    }

    // Generate the floor tabs HTML
    let floorTabsHTML = `
      <div class="floor-tabs-wrapper">
        <div class="floor-gap"></div>
    `;

    // Add each floor section
    for (const floor of this._floorTabsConfig.floors) {
      const isVisible = floor.default === 'show';
      floorTabsHTML += `
        <div class="floor-section" id="${floor.id}" style="display: ${isVisible ? 'block' : 'none'}">
          <div class="floor-content">
            <div class="floor-header-layout">
              <div class="floor-title">
                <span>Räume</span>
              </div>
              <div class="floor-tabs-buttons">
      `;

      // Add tab buttons
      for (let i = 0; i < this._floorTabsConfig.tabs.length; i++) {
        const tab = this._floorTabsConfig.tabs[i];
        const isActive = floor.active_tab === (i + 1);
        floorTabsHTML += `
          <button class="floor-tab-button ${isActive ? 'active' : ''}" 
                  data-target="${tab.target}" 
                  data-icon="${tab.icon}">
            <i class="mdi ${tab.icon}"></i>
          </button>
        `;
      }

      floorTabsHTML += `
              </div>
            </div>
            <div class="room-cards-container" id="room-cards-${floor.id}">
              <!-- Room cards will be populated here -->
            </div>
          </div>
        </div>
      `;
    }

    floorTabsHTML += `
        <div class="floor-gap-bottom"></div>
      </div>
    `;

    container.innerHTML = floorTabsHTML;

    // Set up tab switching functionality
    this.setupFloorTabSwitching(shadow);

    // Generate room cards for each floor
    this.generateRoomCards(shadow);
  }

  // Set up floor tab switching functionality
  setupFloorTabSwitching(shadow) {
    const tabButtons = shadow.querySelectorAll('.floor-tab-button');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const target = button.getAttribute('data-target');
        
        // Hide all floor sections
        const floorSections = shadow.querySelectorAll('.floor-section');
        floorSections.forEach(section => {
          section.style.display = 'none';
        });

        // Show target floor section
        const targetSection = shadow.getElementById(target);
        if (targetSection) {
          targetSection.style.display = 'block';
        }

        // Update active tab states for all floors
        const allTabButtons = shadow.querySelectorAll('.floor-tab-button');
        allTabButtons.forEach(btn => {
          btn.classList.remove('active');
        });

        // Set active tab in the visible floor
        const visibleFloor = shadow.querySelector('.floor-section[style*="block"]');
        if (visibleFloor) {
          const matchingButton = visibleFloor.querySelector(`[data-target="${target}"]`);
          if (matchingButton) {
            matchingButton.classList.add('active');
          }
        }
      });
    });
  }

  // Generate room cards based on configuration
  generateRoomCards(shadow) {
    if (!this._floorTabsConfig.room_cards) return;

    for (const [roomName, roomConfig] of Object.entries(this._floorTabsConfig.room_cards)) {
      // Find which floor this room belongs to
      const floor = this._floorTabsConfig.floors.find(f => f.room === roomName);
      if (!floor) continue;

      const container = shadow.getElementById(`room-cards-${floor.id}`);
      if (!container) continue;

      // Generate CSS grid areas from the grid template
      const gridAreas = roomConfig.grid_template_areas.split('\n').map(line => line.trim().replace(/'/g, '"'));
      const numRows = gridAreas.length;
      const rowHeights = gridAreas.map(row => row.includes('gap') ? '10px' : '76px');

      let roomCardHTML = `
        <div class="room-card-grid" style="
          width: 100%;
          grid-template-columns: 50% 50%;
          grid-template-rows: ${rowHeights.join(' ')};
          grid-template-areas: ${gridAreas.join(' ')};
          display: grid;
          place-items: stretch;
        ">
      `;

      // Add cards
      for (const card of roomConfig.cards) {
        if (card.template === 'floor_swipe') {
          roomCardHTML += `
            <div style="grid-area: ${card.grid};" class="floor-swipe-card">
              <div class="floor-swipe-content">Floor: ${card.entity}</div>
            </div>
          `;
        } else if (card.template === 'room_card') {
          roomCardHTML += `
            <div style="grid-area: ${card.grid};" class="room-card">
              <div class="room-card-content">Room: ${card.entity}</div>
            </div>
          `;
        } else {
          // Sensor cards
          const entityState = this._hass && this._hass.states ? this._hass.states[card.entity] : null;
          const entityName = entityState ? (entityState.attributes.friendly_name || card.entity) : card.entity;
          const entityValue = entityState ? entityState.state : 'unavailable';
          
          roomCardHTML += `
            <div style="grid-area: ${card.grid};" class="sensor-card ${card.template}">
              <div class="sensor-card-content">
                <div class="sensor-name">${entityName}</div>
                <div class="sensor-value">${entityValue}</div>
                <div class="sensor-type">${card.type}</div>
              </div>
            </div>
          `;
        }
      }

      roomCardHTML += '</div>';
      container.innerHTML = roomCardHTML;
    }
  }

  // Load music configuration for admin interface
  async loadMusicAdminConfiguration() {
    const shadow = this.shadowRoot;
    const musicTextarea = shadow.getElementById('music-config');

    if (!musicTextarea) return;

    try {
      const musicResponse = await fetch('/local/dashview/config/music.json');

      if (musicResponse.ok) {
        const musicConfig = await musicResponse.json();
        musicTextarea.value = JSON.stringify(musicConfig, null, 2);
        musicTextarea.placeholder = 'Music configuration loaded successfully';
      } else {
        throw new Error(`Failed to load music.json: ${musicResponse.status} ${musicResponse.statusText}`);
      }
    } catch (error) {
      console.error('[DashView] Error loading music configuration for admin:', error);
      musicTextarea.placeholder = 'Error loading music configuration: ' + error.message;
      musicTextarea.value = '';
    }
  }

  // Load configuration for admin interface
  async loadAdminConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const floorsTextarea = shadow.getElementById('floors-config');
    const roomsTextarea = shadow.getElementById('rooms-config');
    const musicTextarea = shadow.getElementById('music-config');
    const temperatureTextarea = shadow.getElementById('temperature-config');
    const coversTextarea = shadow.getElementById('covers-config');
    const scenesTextarea = shadow.getElementById('scenes-config');
    const roomNotificationsTextarea = shadow.getElementById('room-notifications-config');
    const windowWeatherTextarea = shadow.getElementById('window-weather-config');
    const otherDevicesTextarea = shadow.getElementById('other-devices-config');
    const floorTabsTextarea = shadow.getElementById('floor-tabs-config');
    const alarmTextarea = shadow.getElementById('alarm-config');

    if (!statusElement || !floorsTextarea || !roomsTextarea) return;

    statusElement.textContent = 'Loading configuration...';

    try {
      const [floorsResponse, roomsResponse, musicResponse, temperatureResponse, coversResponse, scenesResponse, roomNotificationsResponse, windowWeatherResponse, otherDevicesResponse, floorTabsResponse, alarmResponse] = await Promise.all([

        fetch('/local/dashview/config/floors.json'),
        fetch('/local/dashview/config/rooms.json'),
        fetch('/local/dashview/config/music.json'),
        fetch('/local/dashview/config/temperature.json'),
        fetch('/local/dashview/config/covers.json'),
        fetch('/local/dashview/config/scenes.json'),
        fetch('/local/dashview/config/room_notifications.json'),
        fetch('/local/dashview/config/window_weather_notifications.json'),
        fetch('/local/dashview/config/other_devices.json'),
        fetch('/local/dashview/config/floor_tabs.json'),
        fetch('/local/dashview/config/alarm.json'),
        fetch('/local/dashview/config/window_weather_notifications.json'),

      ]);

      if (floorsResponse.ok && roomsResponse.ok) {
        const floorsConfig = await floorsResponse.json();
        const roomsConfig = await roomsResponse.json();

        floorsTextarea.value = JSON.stringify(floorsConfig, null, 2);
        roomsTextarea.value = JSON.stringify(roomsConfig, null, 2);

        let statusMessage = '✓ Floor and room configurations loaded successfully';
        let configsLoaded = 2;

        // Load music configuration if available
        if (musicResponse.ok && musicTextarea) {
          const musicConfig = await musicResponse.json();
          musicTextarea.value = JSON.stringify(musicConfig, null, 2);
          configsLoaded++;
        }

        // Load temperature configuration if available
        if (temperatureResponse.ok && temperatureTextarea) {
          const temperatureConfig = await temperatureResponse.json();
          temperatureTextarea.value = JSON.stringify(temperatureConfig, null, 2);
          configsLoaded++;
        }

        // Load covers configuration if available
        if (coversResponse.ok && coversTextarea) {
          const coversConfig = await coversResponse.json();
          coversTextarea.value = JSON.stringify(coversConfig, null, 2);
          configsLoaded++;
        }

        // Load scenes configuration if available
        if (scenesResponse.ok && scenesTextarea) {
          const scenesConfig = await scenesResponse.json();
          scenesTextarea.value = JSON.stringify(scenesConfig, null, 2);
          configsLoaded++;
        }

        // Load room notifications configuration if available
        if (roomNotificationsResponse.ok && roomNotificationsTextarea) {
          const roomNotificationsConfig = await roomNotificationsResponse.json();
          roomNotificationsTextarea.value = JSON.stringify(roomNotificationsConfig, null, 2);
          configsLoaded++;
        }

        // Load window/weather notifications configuration if available
        if (windowWeatherResponse.ok && windowWeatherTextarea) {
          const windowWeatherConfig = await windowWeatherResponse.json();
          windowWeatherTextarea.value = JSON.stringify(windowWeatherConfig, null, 2);
          configsLoaded++;
        }

        // Load other devices configuration if available
        if (otherDevicesResponse.ok && otherDevicesTextarea) {
          const otherDevicesConfig = await otherDevicesResponse.json();
          otherDevicesTextarea.value = JSON.stringify(otherDevicesConfig, null, 2);
          configsLoaded++;
        }

        // Load floor tabs configuration if available
        if (floorTabsResponse.ok && floorTabsTextarea) {
          const floorTabsConfig = await floorTabsResponse.json();
          floorTabsTextarea.value = JSON.stringify(floorTabsConfig, null, 2);
          configsLoaded++;
        }

        // Load alarm configuration if available
        if (alarmResponse.ok && alarmTextarea) {
          const alarmConfig = await alarmResponse.json();
          alarmTextarea.value = JSON.stringify(alarmConfig, null, 2);
          configsLoaded++;
        }

        if (configsLoaded === 10) {
          statusMessage = '✓ All configurations loaded successfully';
        } else if (configsLoaded >= 3) {
          statusMessage = '✓ Floor, room, and optional configurations loaded successfully';
        } else {
          statusMessage += ' (music, temperature, covers, scenes, floor tabs, alarm, room notifications, window/weather notifications, and other devices configs optional)';
        }

        statusElement.textContent = statusMessage;
        statusElement.style.background = 'var(--green)';
      } else {
        throw new Error('Could not load configuration files');
      }
    } catch (error) {
      statusElement.textContent = '✗ Error loading configuration: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save floors configuration
  async saveFloorsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const floorsTextarea = shadow.getElementById('floors-config');

    if (!statusElement || !floorsTextarea) return;

    try {
      const configData = JSON.parse(floorsTextarea.value);
      
      // Validate structure
      if (!configData.floor_icons || !configData.floor_sensors) {
        throw new Error('Invalid floors configuration structure');
      }

      statusElement.textContent = '✓ Floors configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Reload the configuration for the header buttons
      this._floorsConfig = configData;
      if (this._hass) {
        this.updateHeaderButtons(shadow);
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving floors config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save rooms configuration
  async saveRoomsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const roomsTextarea = shadow.getElementById('rooms-config');

    if (!statusElement || !roomsTextarea) return;

    try {
      const configData = JSON.parse(roomsTextarea.value);
      
      // Validate structure
      if (!configData.floors) {
        throw new Error('Invalid rooms configuration structure');
      }

      statusElement.textContent = '✓ Rooms configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Reload the configuration for the header buttons
      this._roomsConfig = configData;
      if (this._hass) {
        this.updateHeaderButtons(shadow);
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving rooms config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }


  // Save music configuration
  async saveMusicConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const musicTextarea = shadow.getElementById('music-config');

    if (!statusElement || !musicTextarea) return;

    try {
      const configData = JSON.parse(musicTextarea.value);
      
      // Validate structure
      if (!configData.music_rooms || !configData.media_players || !configData.media_presets) {
        throw new Error('Invalid music configuration structure. Must include music_rooms, media_players, and media_presets.');
      }

      statusElement.textContent = '✓ Music configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for use in the music popup
      this._musicConfig = configData;
      
      // Update the music popup with the new configuration
      const shadow = this.shadowRoot;
      this.updateMusicPopup(shadow);

    } catch (error) {
      statusElement.textContent = '✗ Error saving music config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save temperature configuration
  async saveTemperatureConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const temperatureTextarea = shadow.getElementById('temperature-config');

    if (!statusElement || !temperatureTextarea) return;

    try {
      const configData = JSON.parse(temperatureTextarea.value);
      
      // Validate structure
      if (!configData.temperature_entities) {
        throw new Error('Invalid temperature configuration structure. Must include temperature_entities.');
      }

      // Validate that each room has proper sensor structure
      for (const [room, sensors] of Object.entries(configData.temperature_entities)) {
        if (!Array.isArray(sensors)) {
          throw new Error(`Invalid structure for room "${room}": must be an array of sensor objects.`);
        }
        for (const sensor of sensors) {
          if (!sensor.temperature_sensor || !sensor.humidity_sensor) {
            throw new Error(`Invalid sensor configuration for room "${room}": must include temperature_sensor and humidity_sensor.`);
          }
        }
      }

      statusElement.textContent = '✓ Temperature configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for future use
      this._temperatureConfig = configData;

    } catch (error) {
      statusElement.textContent = '✗ Error saving temperature config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save covers configuration
  async saveCoversConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const coversTextarea = shadow.getElementById('covers-config');

    if (!statusElement || !coversTextarea) return;

    try {
      const configData = JSON.parse(coversTextarea.value);
      
      // Validate structure
      if (!configData.room_covers) {
        throw new Error('Invalid covers configuration structure. Must include room_covers.');
      }

      // Validate that room_covers is an object
      if (typeof configData.room_covers !== 'object' || Array.isArray(configData.room_covers)) {
        throw new Error('room_covers must be an object mapping room names to arrays of cover entity IDs.');
      }

      // Validate that each room has an array of strings
      for (const [room, covers] of Object.entries(configData.room_covers)) {
        if (!Array.isArray(covers)) {
          throw new Error(`Invalid structure for room "${room}": must be an array of cover entity IDs.`);
        }
        for (const cover of covers) {
          if (typeof cover !== 'string' || !cover.startsWith('cover.')) {
            throw new Error(`Invalid cover entity ID "${cover}" in room "${room}": must be a string starting with "cover.".`);
          }
        }
      }

      statusElement.textContent = '✓ Covers configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for future use
      this._coversConfig = configData;

    } catch (error) {
      statusElement.textContent = '✗ Error saving covers config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save scenes configuration
  async saveScenesConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const scenesTextarea = shadow.getElementById('scenes-config');

    if (!statusElement || !scenesTextarea) return;

    try {
      const configData = JSON.parse(scenesTextarea.value);
      
      // Validate structure
      if (!configData.scene_entities_by_room) {
        throw new Error('Invalid scenes configuration structure. Must include scene_entities_by_room.');
      }

      // Validate that scene_entities_by_room is an object
      if (typeof configData.scene_entities_by_room !== 'object' || Array.isArray(configData.scene_entities_by_room)) {
        throw new Error('scene_entities_by_room must be an object mapping room names to scene configurations.');
      }

      // Validate that each room has valid scene configurations
      for (const [room, scenes] of Object.entries(configData.scene_entities_by_room)) {
        if (!scenes || typeof scenes !== 'object' || Array.isArray(scenes)) {
          throw new Error(`Invalid structure for room "${room}": must be an object with scene types as keys.`);
        }
        for (const [sceneType, entities] of Object.entries(scenes)) {
          if (!Array.isArray(entities)) {
            throw new Error(`Invalid structure for scene "${sceneType}" in room "${room}": must be an array of entity IDs.`);
          }
          for (const entity of entities) {
            if (typeof entity !== 'string') {
              throw new Error(`Invalid entity ID "${entity}" in scene "${sceneType}" for room "${room}": must be a string.`);
            }
          }
        }
      }

      statusElement.textContent = '✓ Scenes configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for future use
      this._scenesConfig = configData;
      
      // Update scene buttons
      if (this._hass) {
        this.updateSceneButtons(shadow);
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving scenes config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save room notifications configuration
  async saveRoomNotificationsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const roomNotificationsTextarea = shadow.getElementById('room-notifications-config');

    if (!statusElement || !roomNotificationsTextarea) return;

    try {
      const configData = JSON.parse(roomNotificationsTextarea.value);
      
      // Validate structure
      if (!configData.global_defaults || !configData.room_conditions) {
        throw new Error('Invalid room notifications configuration structure. Must include global_defaults and room_conditions.');
      }

      // Validate global_defaults
      if (typeof configData.global_defaults !== 'object' || Array.isArray(configData.global_defaults)) {
        throw new Error('global_defaults must be an object.');
      }

      if (typeof configData.global_defaults.temp_above !== 'number' || typeof configData.global_defaults.hum_above !== 'number') {
        throw new Error('global_defaults must contain temp_above and hum_above as numbers.');
      }

      // Validate room_conditions
      if (typeof configData.room_conditions !== 'object' || Array.isArray(configData.room_conditions)) {
        throw new Error('room_conditions must be an object mapping room names to sensor configurations.');
      }

      // Validate each room condition
      for (const [room, condition] of Object.entries(configData.room_conditions)) {
        if (!condition || typeof condition !== 'object' || Array.isArray(condition)) {
          throw new Error(`Invalid structure for room "${room}": must be an object with sensor configurations.`);
        }
        if (!condition.temp_sensor || !condition.hum_sensor) {
          throw new Error(`Room "${room}" must have temp_sensor and hum_sensor defined.`);
        }
        if (typeof condition.temp_sensor !== 'string' || typeof condition.hum_sensor !== 'string') {
          throw new Error(`Sensor IDs for room "${room}" must be strings.`);
        }
        if (condition.temp_above !== undefined && typeof condition.temp_above !== 'number') {
          throw new Error(`temp_above for room "${room}" must be a number if defined.`);
        }
        if (condition.hum_above !== undefined && typeof condition.hum_above !== 'number') {
          throw new Error(`hum_above for room "${room}" must be a number if defined.`);
        }
      }

      statusElement.textContent = '✓ Room notifications configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for future use
      this._roomNotificationsConfig = configData;
      
      // Update room notifications
      if (this._hass) {
        this.updateRoomNotifications(shadow);
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving room notifications config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save window/weather notifications configuration
  async saveWindowWeatherConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const windowWeatherTextarea = shadow.getElementById('window-weather-config');

    if (!statusElement || !windowWeatherTextarea) return;

    try {
      const configData = JSON.parse(windowWeatherTextarea.value);
      
      // Validate structure
      if (!configData.global_settings || !configData.notifications) {
        throw new Error('Invalid window/weather notifications configuration structure. Must include global_settings and notifications.');
      }

      // Validate global_settings
      if (typeof configData.global_settings !== 'object' || Array.isArray(configData.global_settings)) {
        throw new Error('global_settings must be an object.');
      }

      // Validate notifications array
      if (!Array.isArray(configData.notifications)) {
        throw new Error('notifications must be an array.');
      }

      // Validate each notification
      for (const notification of configData.notifications) {
        if (!notification.id || !notification.conditions || !notification.notification_type) {
          throw new Error('Each notification must have id, conditions, and notification_type.');
        }
        
        if (typeof notification.conditions !== 'object') {
          throw new Error('Notification conditions must be an object.');
        }
      }

      statusElement.textContent = '✓ Window/Weather notifications configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for future use
      this._windowWeatherConfig = configData;
      
      // Update window/weather notifications
      if (this._hass) {
        this.updateWindowWeatherNotifications(shadow);
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving window/weather notifications config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save other devices configuration
  async saveOtherDevicesConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const otherDevicesTextarea = shadow.getElementById('other-devices-config');

    if (!statusElement || !otherDevicesTextarea) return;

    try {
      const configData = JSON.parse(otherDevicesTextarea.value);

      // Validate configuration structure
      if (!configData.room_devices || typeof configData.room_devices !== 'object') {
        throw new Error('Configuration must have a "room_devices" object');
      }

      if (!Array.isArray(configData.excluded_rooms)) {
        throw new Error('Configuration must have an "excluded_rooms" array');
      }

      // Validate each room's device configuration
      for (const [room, devices] of Object.entries(configData.room_devices)) {
        if (!Array.isArray(devices)) {
          throw new Error(`Devices for room "${room}" must be an array`);
        }
        
        for (const device of devices) {
          if (!device.entity || typeof device.entity !== 'string') {
            throw new Error(`Invalid entity in room "${room}": must have a string "entity" property`);
          }
          if (!device.type || typeof device.type !== 'string') {
            throw new Error(`Invalid type in room "${room}": must have a string "type" property`);
          }
        }
      }

      statusElement.textContent = '✓ Other devices configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for future use
      this._otherDevicesConfig = configData;
      
      // Update other devices sections
      if (this._hass) {
        this.updateOtherDevicesSections();
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving other devices config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save floor tabs configuration
  async saveFloorTabsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const floorTabsTextarea = shadow.getElementById('floor-tabs-config');

    if (!statusElement || !floorTabsTextarea) return;

    try {
      const configData = JSON.parse(floorTabsTextarea.value);

      // Validate configuration structure
      if (!configData.floors || !Array.isArray(configData.floors)) {
        throw new Error('Configuration must have a "floors" array');
      }

      if (!configData.tabs || !Array.isArray(configData.tabs)) {
        throw new Error('Configuration must have a "tabs" array');
      }

      if (!configData.room_cards || typeof configData.room_cards !== 'object') {
        throw new Error('Configuration must have a "room_cards" object');
      }

      // Validate floors structure
      for (const floor of configData.floors) {
        if (!floor.id || !floor.room || !floor.default || typeof floor.active_tab !== 'number') {
          throw new Error('Each floor must have id, room, default, and active_tab properties');
        }
      }

      // Validate tabs structure
      for (const tab of configData.tabs) {
        if (!tab.icon || !tab.label || !tab.target) {
          throw new Error('Each tab must have icon, label, and target properties');
        }
      }

      statusElement.textContent = '✓ Floor tabs configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for future use
      this._floorTabsConfig = configData;
      
      // Update floor tabs display
      if (this._hass) {
        this.updateFloorTabs();
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving floor tabs config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save alarm configuration
  async saveAlarmConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const alarmTextarea = shadow.getElementById('alarm-config');

    if (!statusElement || !alarmTextarea) return;

    try {
      const configData = JSON.parse(alarmTextarea.value);

      // Validate configuration structure
      if (!configData.alarm_entity || typeof configData.alarm_entity !== 'string') {
        throw new Error('Configuration must have an "alarm_entity" string');
      }

      if (!configData.alarm_name || typeof configData.alarm_name !== 'string') {
        throw new Error('Configuration must have an "alarm_name" string');
      }

      if (!configData.conditional_states || !Array.isArray(configData.conditional_states)) {
        throw new Error('Configuration must have a "conditional_states" array');
      }

      if (!configData.alarm_modes || !Array.isArray(configData.alarm_modes)) {
        throw new Error('Configuration must have an "alarm_modes" array');
      }

      statusElement.textContent = '✓ Alarm configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for future use
      this._alarmConfig = configData;
      
      // Update alarm displays
      if (this._hass) {
        this.updateAlarmCard(shadow);
        this.updateAlarmPanel(shadow);
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving alarm config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Handle scene button clicks
  async handleSceneButtonClick(button) {
    if (!this._hass) return;

    const sceneType = button.getAttribute('data-scene-type');
    const room = button.getAttribute('data-room');
    const entitiesJson = button.getAttribute('data-entities');
    
    try {
      const entities = JSON.parse(entitiesJson);
      
      // Add visual feedback
      button.classList.add('scene-button-active');
      setTimeout(() => button.classList.remove('scene-button-active'), 200);
      
      console.log(`[DashView] Executing scene "${sceneType}" for room "${room}" with entities:`, entities);
      
      // Execute the scene action based on type
      if (sceneType === 'all_lights_out') {
        await this.turnOffLights(entities);
      } else if (sceneType.includes('cover') || sceneType === 'roof_window') {
        await this.toggleCovers(entities);
      } else if (sceneType === 'wohnzimmer_ambiente') {
        await this.setAmbientLights(entities);
      } else if (sceneType === 'dimm_desk') {
        await this.dimLights(entities);
      } else {
        // Default action: toggle entities
        await this.toggleEntities(entities);
      }
      
    } catch (error) {
      console.error('[DashView] Error executing scene:', error);
    }
  }

  // Handle alarm mode button clicks
  async handleAlarmButtonClick(button) {
    if (!this._hass) return;

    const entityId = button.getAttribute('data-entity');
    const mode = button.getAttribute('data-mode');
    
    try {
      // Add visual feedback
      button.style.opacity = '0.7';
      setTimeout(() => button.style.opacity = '1', 200);
      
      console.log(`[DashView] Setting alarm mode to "${mode}" for entity "${entityId}"`);
      
      // Call the alarm service based on the mode
      if (mode === 'disarmed') {
        await this._hass.callService('alarm_control_panel', 'alarm_disarm', { entity_id: entityId });
      } else if (mode === 'armed_away') {
        await this._hass.callService('alarm_control_panel', 'alarm_arm_away', { entity_id: entityId });
      } else if (mode === 'armed_night') {
        await this._hass.callService('alarm_control_panel', 'alarm_arm_night', { entity_id: entityId });
      } else if (mode === 'armed_custom_bypass') {
        await this._hass.callService('alarm_control_panel', 'alarm_arm_custom_bypass', { entity_id: entityId });
      }
      
    } catch (error) {
      console.error('[DashView] Error setting alarm mode:', error);
    }
  }

  // Turn off lights
  async turnOffLights(entities) {
    for (const entityId of entities) {
      if (entityId.startsWith('light.')) {
        this._hass.callService('light', 'turn_off', { entity_id: entityId });
      } else if (entityId.startsWith('switch.')) {
        this._hass.callService('switch', 'turn_off', { entity_id: entityId });
      }
    }
  }

  // Toggle covers (open/close)
  async toggleCovers(entities) {
    for (const entityId of entities) {
      if (entityId.startsWith('cover.')) {
        const state = this._hass.states[entityId];
        if (state) {
          const action = state.state === 'open' ? 'close_cover' : 'open_cover';
          this._hass.callService('cover', action, { entity_id: entityId });
        }
      }
    }
  }

  // Set ambient lighting
  async setAmbientLights(entities) {
    for (const entityId of entities) {
      if (entityId.startsWith('light.')) {
        this._hass.callService('light', 'turn_on', { 
          entity_id: entityId,
          brightness_pct: 30,
          color_temp: 400
        });
      }
    }
  }

  // Dim lights to low level
  async dimLights(entities) {
    for (const entityId of entities) {
      if (entityId.startsWith('light.')) {
        this._hass.callService('light', 'turn_on', { 
          entity_id: entityId,
          brightness_pct: 20
        });
      }
    }
  }

  // Toggle entities (generic)
  async toggleEntities(entities) {
    for (const entityId of entities) {
      if (entityId.startsWith('light.')) {
        this._hass.callService('light', 'toggle', { entity_id: entityId });
      } else if (entityId.startsWith('switch.')) {
        this._hass.callService('switch', 'toggle', { entity_id: entityId });
      } else if (entityId.startsWith('cover.')) {
        this._hass.callService('cover', 'toggle', { entity_id: entityId });
      }
    }
  }

  // Update cover sections for all rooms  
  async updateCoverSections() {
    if (!this._coversConfig || Object.keys(this._coversConfig).length === 0) {
      await this.loadConfiguration();
    }

    if (!this._coversConfig) return;

    const shadow = this.shadowRoot;
    
    // Map popup IDs to room names
    const roomMappings = {
      'kinderzimmer-cover-section': 'Kinderzimmer',
      'aupair-cover-section': 'Aupair', 
      'elternbereich-cover-section': 'Eltern'
    };

    // Update each cover section
    Object.entries(roomMappings).forEach(([sectionId, roomName]) => {
      const section = shadow.getElementById(sectionId);
      if (section) {
        const coverHTML = this.generateCoverSectionContent(roomName);
        section.innerHTML = coverHTML;
      }
    });
  }

  // Generate cover section content based on configuration and current room
  generateCoverSectionContent(room) {
    if (!this._coversConfig || !this._coversConfig.room_covers) {
      return '<div class="placeholder">Cover configuration not loaded</div>';
    }

    const roomCovers = this._coversConfig.room_covers[room] || [];
    const excludedRooms = this._coversConfig.excluded_rooms || [];
    
    // Check if room is in exclusion list or has no covers
    if (excludedRooms.includes(room) || roomCovers.length === 0) {
      return '';
    }

    // Get the primary cover entity (first in the list, or special handling for Aupair)
    const primaryCover = room === 'Aupair' ? 'cover.rollo_aupair_2' : roomCovers[0];

    let html = `
      <div class="cover-section" data-room="${room}">
        <div class="cover-expander-card">
          <div class="cover-header">
            <div class="cover-header-grid">
              <div class="cover-title">Rollos</div>
              <div class="cover-main-slider">
                <div class="cover-slider-container" data-entity="${primaryCover}">
                  <div class="cover-slider-track">
                    <div class="cover-slider-progress"></div>
                    <div class="cover-slider-thumb"></div>
                  </div>
                </div>
              </div>
              <div class="cover-position-display" data-entity="${primaryCover}">0%</div>
            </div>
          </div>
          <div class="cover-content" style="display: none;">
            <div class="cover-position-buttons">
              <button class="cover-position-btn" data-entity="${primaryCover}" data-position="0">0%</button>
              <button class="cover-position-btn" data-entity="${primaryCover}" data-position="25">25%</button>
              <button class="cover-position-btn" data-entity="${primaryCover}" data-position="50">50%</button>
              <button class="cover-position-btn" data-entity="${primaryCover}" data-position="75">75%</button>
              <button class="cover-position-btn" data-entity="${primaryCover}" data-position="100">100%</button>
            </div>`;

    // Add individual cover controls for each cover entity
    roomCovers.forEach(coverEntity => {
      html += `
            <div class="cover-item" data-entity="${coverEntity}">
              <div class="cover-item-grid">
                <div class="cover-item-name" data-entity="${coverEntity}">Loading...</div>
                <div class="cover-item-slider">
                  <div class="cover-slider-container" data-entity="${coverEntity}">
                    <div class="cover-slider-track">
                      <div class="cover-slider-progress"></div>
                      <div class="cover-slider-thumb"></div>
                    </div>
                  </div>
                </div>
                <div class="cover-item-position" data-entity="${coverEntity}">0%</div>
              </div>
            </div>`;
    });

    html += `
          </div>
        </div>
      </div>`;

    return html;
  }

  // Update scene buttons for all rooms and header
  async updateSceneButtons(shadow) {
    if (!this._scenesConfig || Object.keys(this._scenesConfig).length === 0) {
      await this.loadConfiguration();
    }

    if (!this._scenesConfig) return;

    // Update header scene buttons
    const headerContainer = shadow.querySelector('[data-template="scene-buttons"]:not([data-room])');
    if (headerContainer) {
      const headerHTML = this.generateSceneButtonsHTML('Header');
      headerContainer.innerHTML = headerHTML;
    }

    // Update room-specific scene buttons
    const roomContainers = shadow.querySelectorAll('[data-template="scene-buttons"][data-room]');
    roomContainers.forEach(container => {
      const room = container.getAttribute('data-room');
      const roomHTML = this.generateSceneButtonsHTML(room);
      container.innerHTML = roomHTML;
    });
  }

  // Generate scene buttons HTML for a specific room
  generateSceneButtonsHTML(room) {
    if (!this._scenesConfig || !this._scenesConfig.scene_entities_by_room) {
      return '<div class="loading-message">Scene configuration not loaded</div>';
    }

    const roomScenes = this._scenesConfig.scene_entities_by_room[room];
    if (!roomScenes || Object.keys(roomScenes).length === 0) {
      return '<div class="scene-buttons-empty">No scenes configured for this room</div>';
    }

    let html = '<div class="scene-buttons-container">';
    
    Object.entries(roomScenes).forEach(([sceneType, entities]) => {
      if (entities && entities.length > 0) {
        const buttonText = this.getSceneButtonText(sceneType);
        const buttonIcon = this.getSceneButtonIcon(sceneType);
        
        html += `
          <button class="scene-button" data-scene-type="${sceneType}" data-room="${room}" data-entities='${JSON.stringify(entities)}'>
            <div class="scene-button-icon">${buttonIcon}</div>
            <div class="scene-button-text">${buttonText}</div>
          </button>
        `;
      }
    });
    
    html += '</div>';
    return html;
  }

  // Get human-readable text for scene button
  getSceneButtonText(sceneType) {
    const textMap = {
      'all_lights_out': 'Alle Lichter aus',
      'wohnzimmer_ambiente': 'Ambiente',
      'all_covers': 'Alle Rollos',
      'roof_window': 'Dachfenster',
      'computer': 'Computer',
      'dimm_desk': 'Schreibtisch dimmen',
      'cover': 'Rollos'
    };
    return textMap[sceneType] || sceneType;
  }

  // Get icon for scene button
  getSceneButtonIcon(sceneType) {
    const iconMap = {
      'all_lights_out': '💡',
      'wohnzimmer_ambiente': '🕯️', 
      'all_covers': '🪟',
      'roof_window': '🏠',
      'computer': '💻',
      'dimm_desk': '🔅',
      'cover': '🪟'
    };
    return iconMap[sceneType] || '⚙️';
  }

  // Update room notifications for all rooms
  async updateRoomNotifications(shadow) {
    if (!this._roomNotificationsConfig || Object.keys(this._roomNotificationsConfig).length === 0) {
      await this.loadConfiguration();
    }

    if (!this._roomNotificationsConfig) return;

    // Update room-specific notifications
    const roomContainers = shadow.querySelectorAll('[data-template="room-notifications"][data-room]');
    roomContainers.forEach(container => {
      const room = container.getAttribute('data-room');
      const notificationHTML = this.generateRoomNotificationHTML(room);
      container.innerHTML = notificationHTML;
    });
  }

  // Generate room notification HTML for a specific room
  generateRoomNotificationHTML(room) {
    if (!this._roomNotificationsConfig || !this._roomNotificationsConfig.room_conditions) {
      return '<div class="room-notification-empty">Room notification configuration not loaded</div>';
    }

    const roomCondition = this._roomNotificationsConfig.room_conditions[room];
    if (!roomCondition) {
      return '<div class="room-notification-empty" style="display: none;"></div>';
    }

    if (!this._hass) {
      return '<div class="room-notification-loading">Loading notification data...</div>';
    }

    const tempSensor = this._hass.states[roomCondition.temp_sensor];
    const humSensor = this._hass.states[roomCondition.hum_sensor];

    if (!tempSensor || !humSensor) {
      return '<div class="room-notification-error" style="display: none;">Sensors not available</div>';
    }

    const temperature = parseFloat(tempSensor.state);
    const humidity = parseFloat(humSensor.state);
    const tempThreshold = roomCondition.temp_above || this._roomNotificationsConfig.global_defaults.temp_above;
    const humThreshold = roomCondition.hum_above || this._roomNotificationsConfig.global_defaults.hum_above;

    const tempExceeded = !isNaN(temperature) && temperature > tempThreshold;
    const humExceeded = !isNaN(humidity) && humidity > humThreshold;

    if (!tempExceeded && !humExceeded) {
      return '<div class="room-notification-hidden" style="display: none;"></div>';
    }

    const notificationType = this.getNotificationType(room);
    const notificationText = this.getNotificationText(notificationType);
    const detailText = this.getNotificationDetailText(temperature, humidity, tempExceeded, humExceeded, tempThreshold, humThreshold);

    return `
      <div class="room-notification-container">
        <div class="notification-grid">
          <div class="notification-icon">⚠️</div>
          <div class="notification-content">
            <div class="notification-title">${notificationText}</div>
            <div class="notification-details">${detailText}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Get notification type based on room
  getNotificationType(room) {
    const kellerRooms = ['Kellerraum', 'Partykeller', 'Wäschekeller', 'Serverraum', 'Heizungskeller'];
    const dachRooms = ['Eltern', 'Kinderzimmer', 'Kinderflur'];
    
    if (kellerRooms.includes(room)) {
      return 'keller';
    } else if (dachRooms.includes(room)) {
      return 'fenster_dach';
    }
    return 'standard';
  }

  // Get notification text based on type
  getNotificationText(notificationType) {
    const textMap = {
      'keller': 'Keller lüften!',
      'fenster_dach': 'Fenster im Dachgeschoss schliessen!',
      'standard': 'Bitte Raum lüften'
    };
    return textMap[notificationType] || 'Bitte Raum lüften';
  }

  // Get notification detail text
  getNotificationDetailText(temperature, humidity, tempExceeded, humExceeded, tempThreshold, humThreshold) {
    let details = [];
    
    if (tempExceeded) {
      details.push(`Temperatur: ${temperature}°C`);
    }
    
    if (humExceeded) {
      details.push(`Luftfeuchtigkeit: ${humidity}%`);
    }
    
    return details.join(' - ') || `Temperatur: ${temperature}°C, Luftfeuchtigkeit: ${humidity}%`;
  }

  // Update window/weather notifications
  async updateWindowWeatherNotifications(shadow) {
    if (!this._windowWeatherConfig || !this._windowWeatherConfig.notifications) return;

    // Find the window/weather notifications container
    const container = shadow.querySelector('.window-weather-notifications-container');
    if (!container) return;

    let hasActiveNotifications = false;
    let notificationsHTML = '';

    // Evaluate each notification
    for (const notification of this._windowWeatherConfig.notifications) {
      if (this.evaluateNotificationConditions(notification.conditions)) {
        hasActiveNotifications = true;
        notificationsHTML += this.generateWindowWeatherNotificationHTML(notification);
      }
    }

    if (hasActiveNotifications) {
      container.innerHTML = notificationsHTML;
      container.style.display = 'block';
    } else {
      container.style.display = 'none';
    }
  }

  // Evaluate notification conditions recursively
  evaluateNotificationConditions(conditions) {
    if (!conditions || !this._hass) return false;

    switch (conditions.type) {
      case 'and':
        return conditions.conditions && conditions.conditions.every(condition => 
          this.evaluateNotificationConditions(condition)
        );
      
      case 'or':
        return conditions.conditions && conditions.conditions.some(condition => 
          this.evaluateNotificationConditions(condition)
        );
      
      case 'state':
        const entity = this._hass.states[conditions.entity];
        return entity && entity.state === conditions.state;
      
      default:
        return false;
    }
  }

  // Generate HTML for window/weather notification
  generateWindowWeatherNotificationHTML(notification) {
    const tempSensor = this._hass.states[this._windowWeatherConfig.global_settings.temp_sensor];
    const humSensor = this._hass.states[this._windowWeatherConfig.global_settings.hum_sensor];
    
    let temperature = 'N/A';
    let humidity = 'N/A';
    let detailText = '';

    if (tempSensor && !isNaN(parseFloat(tempSensor.state))) {
      temperature = parseFloat(tempSensor.state).toFixed(1);
    }
    
    if (humSensor && !isNaN(parseFloat(humSensor.state))) {
      humidity = parseFloat(humSensor.state).toFixed(0);
    }

    // Use detail_override if provided, otherwise generate detail text
    if (notification.detail_override) {
      detailText = notification.detail_override;
    } else {
      // Generate detail text similar to the original template
      const tempAbove = this._windowWeatherConfig.global_settings.temp_above;
      const humAbove = this._windowWeatherConfig.global_settings.hum_above;
      
      if (temperature !== 'N/A' && tempAbove !== undefined && parseFloat(temperature) > tempAbove) {
        detailText += `Temperatur: ${temperature}°C`;
      }
      
      if (humidity !== 'N/A' && humAbove !== undefined && parseFloat(humidity) > humAbove) {
        if (detailText) detailText += ' - ';
        detailText += `Luftfeuchtigkeit: ${humidity}%`;
      }
      
      if (!detailText && temperature !== 'N/A' && humidity !== 'N/A') {
        detailText = `Temperatur: ${temperature}°C, Luftfeuchtigkeit: ${humidity}%`;
      }
    }

    return `
      <div class="temp-notification-container">
        <div class="notification-grid">
          <div class="notification-icon">${notification.icon || '⚠️'}</div>
          <div class="notification-content">
            <div class="notification-title">${notification.message}</div>
            <div class="notification-details">${detailText}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Update cover controls with current state
  updateCoverControls() {
    if (!this._hass || !this._coversConfig) return;

    const shadow = this.shadowRoot;
    
    // Update all cover position displays
    shadow.querySelectorAll('[data-entity^="cover."]').forEach(element => {
      const entityId = element.getAttribute('data-entity');
      const entity = this._hass.states[entityId];
      
      if (entity) {
        const position = entity.attributes.current_position || 0;
        
        // Update position displays
        if (element.classList.contains('cover-position-display') || element.classList.contains('cover-item-position')) {
          element.textContent = Math.floor(position) + '%';
        }
        
        // Update friendly names
        if (element.classList.contains('cover-item-name')) {
          element.textContent = entity.attributes.friendly_name || entityId;
        }
        
        // Update slider positions
        if (element.classList.contains('cover-slider-container')) {
          const progress = element.querySelector('.cover-slider-progress');
          const thumb = element.querySelector('.cover-slider-thumb');
          if (progress && thumb) {
            const percentage = Math.max(0, Math.min(100, position));
            progress.style.width = `${100 - percentage}%`; // Inverted for covers
            thumb.style.left = `${100 - percentage}%`;
          }
        }
      }
    });
  }

  // Handle cover control interactions
  handleCoverInteractions() {
    const shadow = this.shadowRoot;
    
    // Handle cover header clicks (expand/collapse)
    shadow.addEventListener('click', (e) => {
      const coverHeader = e.target.closest('.cover-header');
      if (coverHeader) {
        const coverSection = coverHeader.closest('.cover-section');
        const content = coverSection.querySelector('.cover-content');
        if (content) {
          const isExpanded = content.style.display !== 'none';
          content.style.display = isExpanded ? 'none' : 'block';
          coverSection.classList.toggle('expanded', !isExpanded);
        }
      }
      
      // Handle position button clicks
      const positionBtn = e.target.closest('.cover-position-btn');
      if (positionBtn) {
        const entityId = positionBtn.getAttribute('data-entity');
        const position = parseInt(positionBtn.getAttribute('data-position'));
        
        this._hass.callService('cover', 'set_cover_position', {
          entity_id: entityId,
          position: position
        });
      }
    });
    
    // Handle slider interactions
    shadow.addEventListener('pointerdown', (e) => {
      const sliderContainer = e.target.closest('.cover-slider-container');
      if (sliderContainer) {
        e.preventDefault();
        const entityId = sliderContainer.getAttribute('data-entity');
        
        const handleSliderMove = (moveEvent) => {
          const rect = sliderContainer.getBoundingClientRect();
          const percentage = Math.max(0, Math.min(100, 
            100 - ((moveEvent.clientX - rect.left) / rect.width * 100) // Inverted for covers
          ));
          
          // Update visual feedback immediately
          const progress = sliderContainer.querySelector('.cover-slider-progress');
          const thumb = sliderContainer.querySelector('.cover-slider-thumb');
          if (progress && thumb) {
            progress.style.width = `${100 - percentage}%`;
            thumb.style.left = `${100 - percentage}%`;
          }
        };
        
        const handleSliderEnd = (endEvent) => {
          const rect = sliderContainer.getBoundingClientRect();
          const percentage = Math.max(0, Math.min(100, 
            100 - ((endEvent.clientX - rect.left) / rect.width * 100) // Inverted for covers
          ));
          
          this._hass.callService('cover', 'set_cover_position', {
            entity_id: entityId,
            position: Math.round(percentage)
          });
          
          document.removeEventListener('pointermove', handleSliderMove);
          document.removeEventListener('pointerup', handleSliderEnd);
        };
        
        document.addEventListener('pointermove', handleSliderMove);
        document.addEventListener('pointerup', handleSliderEnd);
      }
    });
  }

  // Update light sections for all rooms  
  async updateLightSections() {
    if (!this._lightsConfig || Object.keys(this._lightsConfig).length === 0) {
      await this.loadConfiguration();
    }

    if (!this._lightsConfig) return;

    const shadow = this.shadowRoot;
    
    // Map popup IDs to room names
    const roomMappings = {
      'buro-light-section': 'Büro',
      'wohnzimmer-light-section': 'Wohnzimmer',
      'kueche-light-section': 'Küche',
      'kinderzimmer-light-section': 'Kinderzimmer',
      'gaesteklo-light-section': 'Gästeklo',
      'eingang-light-section': 'Eingang',
      'aupair-light-section': 'Aupair',
      'elternbereich-light-section': 'Eltern'
    };

    // Update each light section
    Object.entries(roomMappings).forEach(([sectionId, roomName]) => {
      const section = shadow.getElementById(sectionId);
      if (section) {
        const lightHTML = this.generateLightSectionContent(roomName);
        section.innerHTML = lightHTML;
      }
    });
  }

  // Generate light section content based on configuration and current room
  generateLightSectionContent(room) {
    if (!this._lightsConfig || !this._lightsConfig.room_lights) {
      return '<div class="placeholder">Light configuration not loaded</div>';
    }

    const roomLights = this._lightsConfig.room_lights[room] || [];
    const excludedRooms = this._lightsConfig.excluded_rooms || [];
    
    // Check if room is in exclusion list or has no lights
    if (excludedRooms.includes(room) || roomLights.length === 0) {
      return '';
    }

    // Get the primary light entity (first in the list)
    const primaryLight = roomLights[0];

    let html = `
      <div class="light-section" data-room="${room}">
        <div class="light-expander-card">
          <div class="light-header">
            <div class="light-header-grid">
              <div class="light-title">Licht</div>
              <div class="light-main-switch">
                <button class="light-all-toggle" data-room="${room}">
                  <i class="mdi mdi-lightbulb"></i>
                </button>
              </div>
              <div class="light-count-display" data-room="${room}">0 von ${roomLights.length} Lichter an</div>
            </div>
          </div>
          <div class="light-content" style="display: none;">
            <div class="light-controls">
    `;

    // Add individual light controls for each light entity
    roomLights.forEach(lightEntity => {
      html += `
            <div class="light-item" data-entity="${lightEntity}">
              <div class="light-item-grid">
                <div class="light-item-name" data-entity="${lightEntity}">Loading...</div>
                <div class="light-item-controls">
                  <button class="light-toggle-btn" data-entity="${lightEntity}">
                    <i class="mdi mdi-lightbulb"></i>
                  </button>
                </div>
                <div class="light-item-status" data-entity="${lightEntity}">--</div>
              </div>
            </div>`;
    });

    html += `
            </div>
          </div>
        </div>
      </div>`;

    return html;
  }

  // Update light controls with current state
  updateLightControls() {
    if (!this._hass || !this._lightsConfig) return;

    const shadow = this.shadowRoot;
    
    // Update all light displays
    shadow.querySelectorAll('[data-entity^="light."], [data-entity^="switch."]').forEach(element => {
      const entityId = element.getAttribute('data-entity');
      const entity = this._hass.states[entityId];
      
      if (entity) {
        // Update friendly names
        if (element.classList.contains('light-item-name')) {
          element.textContent = entity.attributes.friendly_name || entityId;
        }
        
        // Update status displays
        if (element.classList.contains('light-item-status')) {
          const isOn = entity.state === 'on';
          element.textContent = isOn ? 'Ein' : 'Aus';
          element.classList.toggle('on', isOn);
        }
        
        // Update toggle button states
        if (element.classList.contains('light-toggle-btn')) {
          const isOn = entity.state === 'on';
          element.classList.toggle('on', isOn);
        }
      }
    });
    
    // Update room light counts
    if (this._lightsConfig.room_lights) {
      Object.entries(this._lightsConfig.room_lights).forEach(([roomName, lights]) => {
        const countDisplay = shadow.querySelector(`[data-room="${roomName}"].light-count-display`);
        if (countDisplay && lights.length > 0) {
          let onCount = 0;
          lights.forEach(lightEntity => {
            const entity = this._hass.states[lightEntity];
            if (entity && entity.state === 'on') {
              onCount++;
            }
          });
          countDisplay.textContent = `${onCount} von ${lights.length} Lichter an`;
        }
      });
    }
  }

  // Handle light control interactions
  handleLightInteractions() {
    const shadow = this.shadowRoot;
    
    // Handle light header clicks (expand/collapse)
    shadow.addEventListener('click', (e) => {
      const lightHeader = e.target.closest('.light-header');
      if (lightHeader) {
        const lightSection = lightHeader.closest('.light-section');
        const content = lightSection.querySelector('.light-content');
        if (content) {
          const isExpanded = content.style.display !== 'none';
          content.style.display = isExpanded ? 'none' : 'block';
          lightSection.classList.toggle('expanded', !isExpanded);
        }
      }
      
      // Handle individual light toggle clicks
      const lightToggle = e.target.closest('.light-toggle-btn');
      if (lightToggle) {
        const entityId = lightToggle.getAttribute('data-entity');
        const entity = this._hass.states[entityId];
        
        if (entity) {
          const isOn = entity.state === 'on';
          const domain = entityId.startsWith('switch.') ? 'switch' : 'light';
          const service = isOn ? 'turn_off' : 'turn_on';
          
          this._hass.callService(domain, service, {
            entity_id: entityId
          });
        }
      }
      
      // Handle all lights toggle for room
      const allToggle = e.target.closest('.light-all-toggle');
      if (allToggle) {
        const roomName = allToggle.getAttribute('data-room');
        const roomLights = this._lightsConfig.room_lights[roomName] || [];
        
        if (roomLights.length > 0) {
          // Check if any lights are on
          let anyOn = false;
          roomLights.forEach(lightEntity => {
            const entity = this._hass.states[lightEntity];
            if (entity && entity.state === 'on') {
              anyOn = true;
            }
          });
          
          // Turn all on if none are on, otherwise turn all off
          const service = anyOn ? 'turn_off' : 'turn_on';
          
          roomLights.forEach(lightEntity => {
            const domain = lightEntity.startsWith('switch.') ? 'switch' : 'light';
            this._hass.callService(domain, service, {
              entity_id: lightEntity
            });
          });
        }
      }
    });
  }

  // Generate music popup content based on configuration
  generateMusicPopupContent() {
    if (!this._musicConfig || !this._musicConfig.music_rooms) {
      return '<div class="placeholder">Music configuration not loaded</div>';
    }

    const { music_rooms, media_players, media_presets } = this._musicConfig;
    
    // If no active tab is set, default to the first one
    if (!this._activeMusicTab && music_rooms.length > 0) {
      this._activeMusicTab = music_rooms[0].id;
    }
    
    let html = `
      <div class="music-tabs-container">
        <div class="music-tab-header">
          <div class="music-tab-buttons">
    `;

    // Generate tab buttons
    music_rooms.forEach((room, index) => {
      const isActive = room.id === this._activeMusicTab;
      html += `
        <button class="music-tab-button ${isActive ? 'active' : ''}" 
                data-room-id="${room.id}" 
                data-room="${room.room}">
          <i class="${room.icon}"></i>
          <span>${room.label}</span>
        </button>
      `;
    });

    html += `
          </div>
        </div>
        <div class="music-tab-content">
    `;

    // Generate tab content for each room
    music_rooms.forEach((room, index) => {
      const mediaPlayer = media_players[room.room];
      const isActive = room.id === this._activeMusicTab;
      if (mediaPlayer) {
        html += `
          <div class="music-room-content ${isActive ? 'active' : ''}" 
               data-room-id="${room.id}">
            <div class="music-presets">
        `;

        // Add preset buttons
        media_presets.forEach(preset => {
          html += `
            <button class="music-preset-button" 
                    data-media-player="${mediaPlayer.entity}"
                    data-content-id="${preset.media_content_id}">
              ${preset.name}
            </button>
          `;
        });

        html += `
            </div>
            <div class="music-controls">
              <div class="music-player-info" data-entity="${mediaPlayer.entity}">
                <div class="music-cover" data-entity="${mediaPlayer.entity}">
                  <img class="music-cover-image" src="" alt="Album Cover" style="display: none;">
                </div>
                <div class="music-title">No media playing</div>
                <div class="music-artist"></div>
              </div>
              <div class="music-control-buttons">
                <button class="music-control-btn" data-action="previous" data-entity="${mediaPlayer.entity}">
                  <i class="mdi mdi-skip-backward"></i>
                </button>
                <button class="music-control-btn play-pause" data-action="play_pause" data-entity="${mediaPlayer.entity}">
                  <i class="mdi mdi-play"></i>
                </button>
                <button class="music-control-btn" data-action="next" data-entity="${mediaPlayer.entity}">
                  <i class="mdi mdi-skip-forward"></i>
                </button>
              </div>
              <div class="music-volume-control">
                <span class="volume-label">${mediaPlayer.room_name}</span>
                <input type="range" class="volume-slider" 
                       data-entity="${mediaPlayer.entity}" 
                       min="0" max="100" value="0">
                <span class="volume-value">0%</span>
              </div>
        `;

        // Add second media player if exists
        if (mediaPlayer.entity2) {
          html += `
              <div class="music-volume-control">
                <span class="volume-label">${mediaPlayer.room_name2}</span>
                <input type="range" class="volume-slider" 
                       data-entity="${mediaPlayer.entity2}" 
                       min="0" max="100" value="0">
                <span class="volume-value">0%</span>
              </div>
          `;
        }

        html += `
            </div>
          </div>
        `;
      }
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // Update music popup with configuration
  updateMusicPopup(shadow) {
    const musicPopup = shadow.getElementById('music-popup');
    if (musicPopup) {
      const placeholderDiv = musicPopup.querySelector('.placeholder');
      if (placeholderDiv) {
        // Load configuration if not already loaded
        if (!this._musicConfig || Object.keys(this._musicConfig).length === 0) {
          this.loadConfiguration().then(() => {
            placeholderDiv.innerHTML = this.generateMusicPopupContent();
            this.setupMusicControls(musicPopup);
          });
        } else {
          placeholderDiv.innerHTML = this.generateMusicPopupContent();
          this.setupMusicControls(musicPopup);
        }
      }
    }
  }

  // Setup event listeners for music controls
  setupMusicControls(musicPopup) {
    // Tab switching
    const tabButtons = musicPopup.querySelectorAll('.music-tab-button');
    const tabContents = musicPopup.querySelectorAll('.music-room-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const roomId = button.dataset.roomId;
        
        // Store the active tab state
        this._activeMusicTab = roomId;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => {
          content.classList.toggle('active', content.dataset.roomId === roomId);
        });
      });
    });

    // Preset buttons
    const presetButtons = musicPopup.querySelectorAll('.music-preset-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mediaPlayer = button.dataset.mediaPlayer;
        const contentId = button.dataset.contentId;
        
        if (this._hass) {
          this._hass.callService('media_player', 'play_media', {
            entity_id: mediaPlayer,
            media_content_id: contentId,
            media_content_type: 'music'
          });
        }
      });
    });

    // Control buttons
    const controlButtons = musicPopup.querySelectorAll('.music-control-btn');
    controlButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const entity = button.dataset.entity;
        
        if (this._hass) {
          switch(action) {
            case 'play_pause':
              this._hass.callService('media_player', 'media_play_pause', {
                entity_id: entity
              });
              break;
            case 'previous':
              this._hass.callService('media_player', 'media_previous_track', {
                entity_id: entity
              });
              break;
            case 'next':
              this._hass.callService('media_player', 'media_next_track', {
                entity_id: entity
              });
              break;
          }
        }
      });
    });

    // Volume sliders
    const volumeSliders = musicPopup.querySelectorAll('.volume-slider');
    volumeSliders.forEach(slider => {
      slider.addEventListener('input', () => {
        const entity = slider.dataset.entity;
        const volume = slider.value / 100;
        const valueSpan = slider.parentElement.querySelector('.volume-value');
        
        valueSpan.textContent = slider.value + '%';
        
        if (this._hass) {
          this._hass.callService('media_player', 'volume_set', {
            entity_id: entity,
            volume_level: volume
          });
        }
      });
      
      // Track when user starts interacting with volume slider
      slider.addEventListener('mousedown', () => {
        this._volumeSliderInteraction.add(slider.dataset.entity);
      });
      
      slider.addEventListener('touchstart', () => {
        this._volumeSliderInteraction.add(slider.dataset.entity);
      });
      
      // Stop tracking interaction after a delay to allow state to update
      const stopInteractionTracking = () => {
        setTimeout(() => {
          this._volumeSliderInteraction.delete(slider.dataset.entity);
        }, 1000); // 1 second delay to allow Home Assistant state to update
      };
      
      slider.addEventListener('mouseup', stopInteractionTracking);
      slider.addEventListener('touchend', stopInteractionTracking);
      slider.addEventListener('change', stopInteractionTracking);
    });
  }

  // Update music player states in the popup
  updateMusicPlayerStates(shadow) {
    if (!this._hass || !this._musicConfig) return;
    
    const musicPopup = shadow.getElementById('music-popup');
    if (!musicPopup) return;

    const { music_rooms, media_players } = this._musicConfig;
    
    music_rooms.forEach(room => {
      const mediaPlayer = media_players[room.room];
      if (mediaPlayer) {
        // Update media info
        const playerInfo = musicPopup.querySelector(`[data-entity="${mediaPlayer.entity}"]`);
        if (playerInfo && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const titleElement = playerInfo.querySelector('.music-title');
          const artistElement = playerInfo.querySelector('.music-artist');
          const coverElement = playerInfo.querySelector('.music-cover-image');
          
          if (titleElement) {
            titleElement.textContent = state.attributes.media_title || 'No media playing';
          }
          if (artistElement) {
            artistElement.textContent = state.attributes.media_artist || '';
          }
          if (coverElement) {
            const entityPicture = state.attributes.entity_picture;
            if (entityPicture && state.attributes.media_title) {
              coverElement.src = entityPicture;
              coverElement.style.display = 'block';
            } else {
              coverElement.style.display = 'none';
            }
          }
        }

        // Update play/pause button
        const playPauseBtn = musicPopup.querySelector(`[data-action="play_pause"][data-entity="${mediaPlayer.entity}"]`);
        if (playPauseBtn && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const icon = playPauseBtn.querySelector('i');
          if (icon) {
            icon.className = state.state === 'playing' ? 'mdi mdi-pause' : 'mdi mdi-play';
          }
        }

        // Update volume slider (only if not being interacted with)
        const volumeSlider = musicPopup.querySelector(`[data-entity="${mediaPlayer.entity}"].volume-slider`);
        if (volumeSlider && this._hass.states[mediaPlayer.entity] && 
            !this._volumeSliderInteraction.has(mediaPlayer.entity)) {
          const state = this._hass.states[mediaPlayer.entity];
          const volumeLevel = state.attributes.volume_level || 0;
          volumeSlider.value = Math.round(volumeLevel * 100);
          
          const valueSpan = volumeSlider.parentElement.querySelector('.volume-value');
          if (valueSpan) {
            valueSpan.textContent = Math.round(volumeLevel * 100) + '%';
          }
        }

        // Update second media player if exists
        if (mediaPlayer.entity2) {
          const volumeSlider2 = musicPopup.querySelector(`[data-entity="${mediaPlayer.entity2}"].volume-slider`);
          if (volumeSlider2 && this._hass.states[mediaPlayer.entity2] && 
              !this._volumeSliderInteraction.has(mediaPlayer.entity2)) {
            const state = this._hass.states[mediaPlayer.entity2];
            const volumeLevel = state.attributes.volume_level || 0;
            volumeSlider2.value = Math.round(volumeLevel * 100);
            
            const valueSpan = volumeSlider2.parentElement.querySelector('.volume-value');
            if (valueSpan) {
              valueSpan.textContent = Math.round(volumeLevel * 100) + '%';
            }
          }
        }
      }
    });
  }

  // Update room media players in individual room popups
  updateRoomMediaPlayers(shadow) {
    if (!this._musicConfig || !this._musicConfig.media_players) {
      // Load configuration if not already loaded
      if (!this._musicConfig || Object.keys(this._musicConfig).length === 0) {
        this.loadConfiguration().then(() => {
          this.updateRoomMediaPlayers(shadow);
        });
      }
      return;
    }

    const { media_players, media_presets } = this._musicConfig;

    // Map popup IDs to room names in music config
    const roomMappings = {
      'buero-popup': 'Büro',
      'wohnzimmer-popup': 'Wohnzimmer',
      'elternbereich-popup': 'Eltern'
    };

    // Update each room popup that has a media player
    Object.entries(roomMappings).forEach(([popupId, roomName]) => {
      const popup = shadow.getElementById(popupId);
      if (popup && media_players[roomName]) {
        const placeholder = popup.querySelector('.placeholder');
        if (placeholder && placeholder.textContent.includes('Media Player')) {
          placeholder.innerHTML = this.generateRoomMediaPlayerContent(roomName, media_players[roomName], media_presets);
          this.setupRoomMediaPlayerControls(popup, media_players[roomName]);
        }
      }
    });
  }

  // Generate media player content for a specific room
  generateRoomMediaPlayerContent(roomName, mediaPlayer, mediaPresets) {
    let html = `
      <div class="room-media-player">
        <h4>Media Player - ${roomName}</h4>
        <div class="music-presets">
    `;

    // Add preset buttons
    mediaPresets.forEach(preset => {
      html += `
        <button class="music-preset-button" 
                data-media-player="${mediaPlayer.entity}"
                data-content-id="${preset.media_content_id}">
          ${preset.name}
        </button>
      `;
    });

    html += `
        </div>
        <div class="music-controls">
          <div class="music-player-info" data-entity="${mediaPlayer.entity}">
            <div class="music-cover" data-entity="${mediaPlayer.entity}">
              <img class="music-cover-image" src="" alt="Album Cover" style="display: none;">
            </div>
            <div class="music-title">No media playing</div>
            <div class="music-artist"></div>
          </div>
          <div class="music-control-buttons">
            <button class="music-control-btn" data-action="previous" data-entity="${mediaPlayer.entity}">
              <i class="mdi mdi-skip-backward"></i>
            </button>
            <button class="music-control-btn play-pause" data-action="play_pause" data-entity="${mediaPlayer.entity}">
              <i class="mdi mdi-play"></i>
            </button>
            <button class="music-control-btn" data-action="next" data-entity="${mediaPlayer.entity}">
              <i class="mdi mdi-skip-forward"></i>
            </button>
          </div>
          <div class="music-volume-control">
            <span class="volume-label">${mediaPlayer.room_name}</span>
            <input type="range" class="volume-slider" 
                   data-entity="${mediaPlayer.entity}" 
                   min="0" max="100" value="0">
            <span class="volume-value">0%</span>
          </div>
    `;

    // Add second media player if exists
    if (mediaPlayer.entity2) {
      html += `
          <div class="music-volume-control">
            <span class="volume-label">${mediaPlayer.room_name2}</span>
            <input type="range" class="volume-slider" 
                   data-entity="${mediaPlayer.entity2}" 
                   min="0" max="100" value="0">
            <span class="volume-value">0%</span>
          </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // Setup event listeners for room media player controls
  setupRoomMediaPlayerControls(roomPopup, mediaPlayer) {
    // Preset buttons
    const presetButtons = roomPopup.querySelectorAll('.music-preset-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mediaPlayerEntity = button.dataset.mediaPlayer;
        const contentId = button.dataset.contentId;
        
        if (this._hass && mediaPlayerEntity && contentId) {
          this._hass.callService('media_player', 'play_media', {
            entity_id: mediaPlayerEntity,
            media_content_id: contentId,
            media_content_type: 'music'
          });
        }
      });
    });

    // Control buttons
    const controlButtons = roomPopup.querySelectorAll('.music-control-btn');
    controlButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const entity = button.dataset.entity;
        
        if (this._hass) {
          switch(action) {
            case 'play_pause':
              this._hass.callService('media_player', 'media_play_pause', {
                entity_id: entity
              });
              break;
            case 'previous':
              this._hass.callService('media_player', 'media_previous_track', {
                entity_id: entity
              });
              break;
            case 'next':
              this._hass.callService('media_player', 'media_next_track', {
                entity_id: entity
              });
              break;
          }
        }
      });
    });

    // Volume sliders
    const volumeSliders = roomPopup.querySelectorAll('.volume-slider');
    volumeSliders.forEach(slider => {
      slider.addEventListener('input', () => {
        const entity = slider.dataset.entity;
        const volume = parseFloat(slider.value) / 100;
        
        if (this._hass && entity) {
          this._hass.callService('media_player', 'volume_set', {
            entity_id: entity,
            volume_level: volume
          });
        }
        
        // Update volume display
        const valueSpan = slider.parentElement.querySelector('.volume-value');
        if (valueSpan) {
          valueSpan.textContent = slider.value + '%';
        }
      });
      
      // Track when user starts interacting with volume slider
      slider.addEventListener('mousedown', () => {
        this._volumeSliderInteraction.add(slider.dataset.entity);
      });
      
      slider.addEventListener('touchstart', () => {
        this._volumeSliderInteraction.add(slider.dataset.entity);
      });
      
      // Stop tracking interaction after a delay to allow state to update
      const stopInteractionTracking = () => {
        setTimeout(() => {
          this._volumeSliderInteraction.delete(slider.dataset.entity);
        }, 1000); // 1 second delay to allow Home Assistant state to update
      };
      
      slider.addEventListener('mouseup', stopInteractionTracking);
      slider.addEventListener('touchend', stopInteractionTracking);
      slider.addEventListener('change', stopInteractionTracking);
    });
  }

  // Update media player states in room popups
  updateRoomMediaPlayerStates(shadow) {
    if (!this._hass || !this._musicConfig) return;

    const { media_players } = this._musicConfig;

    // Map popup IDs to room names in music config
    const roomMappings = {
      'buero-popup': 'Büro',
      'wohnzimmer-popup': 'Wohnzimmer',
      'elternbereich-popup': 'Eltern'
    };

    // Update each room popup that has a media player
    Object.entries(roomMappings).forEach(([popupId, roomName]) => {
      const popup = shadow.getElementById(popupId);
      const mediaPlayer = media_players[roomName];
      
      if (popup && mediaPlayer) {
        // Update media info
        const playerInfo = popup.querySelector(`[data-entity="${mediaPlayer.entity}"]`);
        if (playerInfo && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const titleElement = playerInfo.querySelector('.music-title');
          const artistElement = playerInfo.querySelector('.music-artist');
          const coverElement = playerInfo.querySelector('.music-cover-image');
          
          if (titleElement) {
            titleElement.textContent = state.attributes.media_title || 'No media playing';
          }
          if (artistElement) {
            artistElement.textContent = state.attributes.media_artist || '';
          }
          if (coverElement) {
            const entityPicture = state.attributes.entity_picture;
            if (entityPicture && state.attributes.media_title) {
              coverElement.src = entityPicture;
              coverElement.style.display = 'block';
            } else {
              coverElement.style.display = 'none';
            }
          }
        }

        // Update play/pause button
        const playPauseBtn = popup.querySelector(`[data-action="play_pause"][data-entity="${mediaPlayer.entity}"]`);
        if (playPauseBtn && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const icon = playPauseBtn.querySelector('i');
          if (icon) {
            icon.className = state.state === 'playing' ? 'mdi mdi-pause' : 'mdi mdi-play';
          }
        }

        // Update volume slider (only if not being interacted with)
        const volumeSlider = popup.querySelector(`[data-entity="${mediaPlayer.entity}"].volume-slider`);
        if (volumeSlider && this._hass.states[mediaPlayer.entity] && 
            !this._volumeSliderInteraction.has(mediaPlayer.entity)) {
          const state = this._hass.states[mediaPlayer.entity];
          const volumeLevel = state.attributes.volume_level || 0;
          volumeSlider.value = Math.round(volumeLevel * 100);
          
          const valueSpan = volumeSlider.parentElement.querySelector('.volume-value');
          if (valueSpan) {
            valueSpan.textContent = Math.round(volumeLevel * 100) + '%';
          }
        }

        // Update second media player if exists
        if (mediaPlayer.entity2) {
          const volumeSlider2 = popup.querySelector(`[data-entity="${mediaPlayer.entity2}"].volume-slider`);
          if (volumeSlider2 && this._hass.states[mediaPlayer.entity2] && 
              !this._volumeSliderInteraction.has(mediaPlayer.entity2)) {
            const state = this._hass.states[mediaPlayer.entity2];
            const volumeLevel = state.attributes.volume_level || 0;
            volumeSlider2.value = Math.round(volumeLevel * 100);
            
            const valueSpan = volumeSlider2.parentElement.querySelector('.volume-value');
            if (valueSpan) {
              valueSpan.textContent = Math.round(volumeLevel * 100) + '%';
            }
          }
        }
      }
    });
  }

  // Load weather entity configuration for admin interface
  async loadWeatherEntityConfiguration() {
    const shadow = this.shadowRoot;
    const weatherSelector = shadow.getElementById('weather-entity-selector');
    
    if (!weatherSelector || !this._hass) return;

    try {
      // Clear existing options
      weatherSelector.innerHTML = '';
      
      // Get all weather entities from Home Assistant
      const weatherEntities = Object.keys(this._hass.states)
        .filter(entityId => entityId.startsWith('weather.'))
        .sort();

      if (weatherEntities.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No weather entities found';
        option.disabled = true;
        weatherSelector.appendChild(option);
        return;
      }

      // Add weather entities to dropdown
      weatherEntities.forEach(entityId => {
        const option = document.createElement('option');
        option.value = entityId;
        const state = this._hass.states[entityId];
        const friendlyName = state.attributes.friendly_name || entityId;
        option.textContent = `${friendlyName} (${entityId})`;
        weatherSelector.appendChild(option);
      });

      // Get the configured weather entity from backend
      let configuredEntity = null;
      try {
        const response = await fetch('/api/dashview/weather_config');
        if (response.ok) {
          const data = await response.json();
          configuredEntity = data.weather_entity;
          // Update our cache
          if (configuredEntity && this._hass.states[configuredEntity]) {
            this._weatherEntity = configuredEntity;
            localStorage.setItem('dashview_weather_entity', configuredEntity);
          }
        }
      } catch (error) {
        console.warn('[DashView] Could not load weather entity config from backend:', error);
      }

      // Set the dropdown value
      if (configuredEntity && weatherEntities.includes(configuredEntity)) {
        weatherSelector.value = configuredEntity;
      } else {
        // Default to first weather entity if none configured or config not available
        weatherSelector.value = weatherEntities[0];
        if (!this._weatherEntity) {
          this._weatherEntity = weatherEntities[0];
        }
      }

    } catch (error) {
      console.error('Error loading weather entity configuration:', error);
      weatherSelector.innerHTML = '<option disabled>Error loading weather entities</option>';
    }
  }

  // Save weather entity configuration
  async saveWeatherEntity() {
    const shadow = this.shadowRoot;
    const weatherSelector = shadow.getElementById('weather-entity-selector');
    const saveButton = shadow.getElementById('save-weather-entity');
    
    if (!weatherSelector || !this._hass) return;

    const selectedEntity = weatherSelector.value;
    if (!selectedEntity) {
      alert('Please select a weather entity');
      return;
    }

    // Validate the selected entity exists
    if (!this._hass.states[selectedEntity]) {
      alert(`Weather entity "${selectedEntity}" not found in Home Assistant`);
      return;
    }

    const originalButtonText = saveButton.textContent;
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true;

    try {
      // Call the service to set the weather entity
      await this._hass.callService('dashview', 'set_weather_entity', {
        entity_id: selectedEntity
      });
      
      // Update our cache with the new weather entity
      this._weatherEntity = selectedEntity;
      
      // Cache in localStorage for persistence across page reloads
      localStorage.setItem('dashview_weather_entity', selectedEntity);
      
      // Show success feedback
      saveButton.textContent = 'Saved!';
      saveButton.style.background = 'var(--green)';
      
      // Reset button after 2 seconds
      setTimeout(() => {
        saveButton.textContent = originalButtonText;
        saveButton.disabled = false;
        saveButton.style.background = '';
      }, 2000);
      
      // Update the weather components with the new entity
      setTimeout(() => {
        this.updateWeatherComponents(shadow);
      }, 500);
      
    } catch (error) {
      console.error('Error saving weather entity:', error);
      saveButton.textContent = 'Error!';
      saveButton.style.background = 'var(--red)';
      
      // Reset button after 3 seconds
      setTimeout(() => {
        saveButton.textContent = originalButtonText;
        saveButton.disabled = false;
        saveButton.style.background = '';
      }, 3000);
      
      alert(`Error saving weather entity: ${error.message}`);
    }
  }

  // Get the currently configured weather entity
  getCurrentWeatherEntity() {
    if (!this._hass) return 'weather.forecast_home'; // fallback

    // If we have a cached weather entity from our configuration, use it
    if (this._weatherEntity && this._hass.states[this._weatherEntity]) {
      return this._weatherEntity;
    }
    
    // Fallback to first available weather entity or default
    const weatherEntities = Object.keys(this._hass.states)
      .filter(entityId => entityId.startsWith('weather.'));
    
    const defaultEntity = weatherEntities.length > 0 ? weatherEntities[0] : 'weather.forecast_home';
    
    // Store the default for future use (but don't save to localStorage as this is just a fallback)
    this._weatherEntity = defaultEntity;
    
    return defaultEntity;
  }

  // Update other devices sections for all rooms  
  async updateOtherDevicesSections() {
    if (!this._otherDevicesConfig || Object.keys(this._otherDevicesConfig).length === 0) {
      await this.loadConfiguration();
    }

    if (!this._otherDevicesConfig) return;

    const shadow = this.shadowRoot;
    
    // Map popup IDs to room names
    const roomMappings = {
      'buero-other-section': 'Büro',
      'wohnzimmer-other-section': 'Wohnzimmer',
      'kueche-other-section': 'Küche',
      'kinderzimmer-other-section': 'Kinderzimmer',
      'gaesteklo-other-section': 'Gästeklo',
      'eingang-other-section': 'Eingang',
      'aupair-other-section': 'Aupair',
      'elternbereich-other-section': 'Eltern'
    };

    // Update each other devices section
    Object.entries(roomMappings).forEach(([sectionId, roomName]) => {
      const section = shadow.getElementById(sectionId);
      if (section) {
        const otherHTML = this.generateOtherDevicesSectionContent(roomName);
        section.innerHTML = otherHTML;
      }
    });
  }

  // Generate other devices section content based on configuration and current room
  generateOtherDevicesSectionContent(room) {
    if (!this._otherDevicesConfig || !this._otherDevicesConfig.room_devices) {
      return '<div class="placeholder">Other devices configuration not loaded</div>';
    }

    const roomDevices = this._otherDevicesConfig.room_devices[room] || [];
    const excludedRooms = this._otherDevicesConfig.excluded_rooms || [];
    
    // Check if room is in exclusion list or has no devices
    if (excludedRooms.includes(room) || roomDevices.length === 0) {
      return '';
    }

    let html = `
      <div class="other-devices-section" data-room="${room}">
        <div class="other-devices-expander-card">
          <div class="other-devices-header">
            <div class="other-devices-header-grid">
              <div class="other-devices-title">Andere Geräte</div>
              <div class="other-devices-icon">
                <i class="mdi mdi-devices"></i>
              </div>
              <div class="other-devices-count-display" data-room="${room}">${roomDevices.length} Geräte</div>
            </div>
          </div>
          <div class="other-devices-content" style="display: none;">
            <div class="other-devices-grid">
    `;

    // Add individual device controls for each device entity
    roomDevices.forEach(device => {
      html += `
            <div class="other-device-card" data-entity="${device.entity}" data-type="${device.type}">
              <div class="other-device-card-content">
                <div class="other-device-icon" data-entity="${device.entity}" data-type="${device.type}">
                  <i class="mdi mdi-help-circle"></i>
                </div>
                <div class="other-device-info">
                  <div class="other-device-name" data-entity="${device.entity}">Loading...</div>
                  <div class="other-device-state" data-entity="${device.entity}" data-type="${device.type}">--</div>
                </div>
              </div>
            </div>`;
    });

    html += `
            </div>
          </div>
        </div>
      </div>`;

    return html;
  }

  // Update other devices controls with current state
  updateOtherDevicesControls() {
    if (!this._hass || !this._otherDevicesConfig) return;

    const shadow = this.shadowRoot;
    
    // Update all other device displays
    shadow.querySelectorAll('.other-device-card').forEach(element => {
      const entityId = element.getAttribute('data-entity');
      const deviceType = element.getAttribute('data-type');
      const entity = this._hass.states[entityId];
      
      if (entity) {
        // Update friendly names
        const nameElement = element.querySelector('.other-device-name');
        if (nameElement) {
          nameElement.textContent = entity.attributes.friendly_name || entityId;
        }
        
        // Update device icons
        const iconElement = element.querySelector('.other-device-icon i');
        if (iconElement) {
          const icon = this.getOtherDeviceIcon(entity, deviceType);
          iconElement.className = `mdi ${icon}`;
        }
        
        // Update status displays
        const stateElement = element.querySelector('.other-device-state');
        if (stateElement) {
          const stateText = this.getOtherDeviceState(entity, deviceType);
          stateElement.textContent = stateText;
          
          // Add state-based styling
          const isActive = this.isOtherDeviceActive(entity, deviceType);
          stateElement.classList.toggle('active', isActive);
          element.classList.toggle('active', isActive);
        }
      }
    });
  }

  // Get icon for other device based on type and state
  getOtherDeviceIcon(entity, deviceType) {
    const state = entity.state;
    const attributes = entity.attributes || {};
    
    switch (deviceType) {
      case 'mower':
        return 'mdi-robot-mower';
      case 'dishwasher':
        return 'mdi-dishwasher';
      case 'washing':
        return 'mdi-washing-machine';
      case 'cartridge':
        const cartridgeValue = parseFloat(state);
        if (isNaN(cartridgeValue)) return 'mdi-printer';
        if (cartridgeValue < 10) return 'mdi-printer-alert';
        if (cartridgeValue < 30) return 'mdi-printer-pos';
        return 'mdi-printer';
      case 'sliding_door':
        return state === 'on' ? 'mdi-door-sliding-open' : 'mdi-door-sliding';
      case 'window':
        return state === 'on' ? 'mdi-window-open' : 'mdi-window-closed';
      case 'motion':
        return state === 'on' ? 'mdi-motion-sensor' : 'mdi-motion-sensor-off';
      case 'dryer':
        return state === 'on' ? 'mdi-tumble-dryer' : 'mdi-tumble-dryer-off';
      case 'temp':
        return 'mdi-thermometer';
      case 'freezer':
        const alarmDoor = this._hass.states['sensor.gefrierschrank_door_alarm_freezer']?.state;
        const alarmTemp = this._hass.states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
        return (alarmDoor === 'present' || alarmTemp === 'present') ? 'mdi-alert-circle' : 'mdi-fridge';
      case 'hoover':
        return 'mdi-robot-vacuum';
      case 'printer':
        return 'mdi-printer';
      case 'door':
        const closedEntity = attributes.closed_entity || null;
        const lockState = state;
        
        if (closedEntity && this._hass.states[closedEntity]?.state === 'on') {
          return 'mdi-door-open';
        }
        
        if (lockState === 'locked') {
          return 'mdi-door-closed-lock';
        }
        
        if (lockState === 'unlocked' || lockState === 'off' || lockState === 'closed') {
          return 'mdi-door-closed';
        }
        
        return 'mdi-door';
      default:
        return entity.attributes?.icon?.replace('mdi:', 'mdi-') || 'mdi-help-circle';
    }
  }

  // Get state text for other device
  getOtherDeviceState(entity, deviceType) {
    const state = entity.state;
    const attributes = entity.attributes || {};
    const errorCode = attributes.error ? String(attributes.error) : '';

    switch (deviceType) {
      case 'light':
        return state === 'on' ? 'An' : 'Aus';
      case 'cartridge':
        const cartValue = parseFloat(state);
        return isNaN(cartValue) ? 'Unbekannt' : cartValue.toFixed(0) + '%';
      case 'sliding_door':
      case 'window':
        return state === 'on' ? 'Auf' : 'Zu';
      case 'motion':
        return state === 'on' ? 'Bewegung' : 'Keine Bewegung';
      case 'dryer':
        return state === 'on' ? 'Läuft' : 'Aus';
      case 'temp':
        const temp = parseFloat(state);
        return isNaN(temp) ? '' : temp.toFixed(1) + '°C';
      case 'freezer':
        const alarmDoor = this._hass.states['sensor.gefrierschrank_door_alarm_freezer']?.state;
        const alarmTemp = this._hass.states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
        return (alarmDoor === 'present' || alarmTemp === 'present') ? 'Alarm' : 'OK';
      case 'hoover':
        const errorMessages = {
          'No Error': 'Kein Fehler',
          'brush': 'Hauptbürste blockiert',
          'side_brush': 'Seitenbürste blockiert',
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
          'cleaning': 'Reinigt',
          'error': errorMessages[errorCode] || 'Fehler',
          'returning': 'Fährt zur Ladestation',
          'paused': errorMessages[errorCode] || 'Fehler',
          'docked': 'Geparkt',
          'idle': 'Bereit',
          'unavailable': 'Nicht erreichbar'
        };

        const normalizedState = (state || '').toLowerCase();
        return stateDescriptions[normalizedState] || state;
      case 'printer':
        switch (state) {
          case 'processing': return 'Druckt';
          case 'scanprocessing': return 'Scannt';
          case 'copying': return 'Kopiert';
          case 'canceljob': return 'Abbruch';
          case 'ready': return 'Bereit';
          case 'inpowersave': return 'Energiesparen';
          case 'off': return 'Aus';
          default: return state;
        }
      case 'door':
        const isOpen = attributes.closed_entity && this._hass.states[attributes.closed_entity]?.state === 'on';
        const lockState = state;

        if (isOpen) {
          return 'Auf';
        } else if (lockState === 'locked') {
          return 'Abgeschlossen';
        } else {
          return 'Zu';
        }
      case 'dishwasher':
        if (state !== 'run') {
          return 'Bereit';
        } else {
          const endTimeEntity = this._hass.states['sensor.geschirrspuler_remaining_program_time'];
          if (!endTimeEntity || !endTimeEntity.state) {
            return 'Unbekannt';
          }
          const end = new Date(endTimeEntity.state);
          if (isNaN(end.getTime())) {
            return 'Unbekannt';
          }
          const diff = Math.floor((end - new Date()) / 60000);
          if (diff <= 0) {
            return 'Fertig';
          }
          const h = Math.floor(diff / 60);
          const m = diff % 60;
          return (h > 0 ? h + 'h ' : '') + (m > 0 || h === 0 ? m + 'min' : '');
        }
      case 'washing':
        if (state !== 'run') {
          return 'Bereit';
        } else {
          const endTimeEntity = this._hass.states['sensor.waschmaschine_remaining_program_time'];
          if (!endTimeEntity || !endTimeEntity.state) {
            return 'Unbekannt';
          }
          const end = new Date(endTimeEntity.state);
          if (isNaN(end.getTime())) {
            return 'Unbekannt';
          }
          const diff = Math.floor((end - new Date()) / 60000);
          if (diff <= 0) {
            return 'Fertig';
          }
          const h = Math.floor(diff / 60);
          const m = diff % 60;
          return (h > 0 ? h + 'h ' : '') + (m > 0 || h === 0 ? m + 'min' : '');
        }
      case 'mower':
        const mowerErrorMessages = {
          "Wheel motor blocked": "Radmotor blockiert",
          "Wheel motor overloaded": "Radmotor überlastet",
          "Cutting system blocked": "Mähwerk blockiert",
          "NO_LOOP_SIGNAL": "Kein Schleifensignal",
          "Upside down": "Mäher umgekippt",
          "Battery problem": "Batterieproblem",
          "Collision sensor problem": "Kollisionssensor defekt",
          "Lift sensor problem": "Anhebesensor defekt",
          "Charging station blocked": "Ladestation blockiert",
          "Outside working area": "Außerhalb des Arbeitsbereichs",
          "Trapped": "Mäher festgefahren",
          "Low battery": "Batterie fast leer",
          "OFF_HATCH_CLOSED": "Klappe offen",
          "OFF_DISABLED": "Ausgeschaltet",
          "LIFTED": "Angehoben",
          "NO_MESSAGE": "Kein Kontakt"
        };

        const mowerStateDescriptions = {
          "cleaning": "Mäht",
          "error": errorCode ? (mowerErrorMessages[errorCode] || `${errorCode}`) : "Fehler",
          "returning": "Fährt zur Ladestation",
          "paused": "Pause",
          "docked": "Geparkt",
          "idle": "Bereit"
        };

        return mowerStateDescriptions[state] || state;
      default:
        return state;
    }
  }

  // Check if other device is in active state
  isOtherDeviceActive(entity, deviceType) {
    const state = entity.state;
    
    switch (deviceType) {
      case 'light':
        return state === 'on';
      case 'mower':
        return state === 'error' || state === 'cleaning';
      case 'dishwasher':
      case 'washing':
        return state === 'run' || state === 'error';
      case 'cartridge':
        const value = parseFloat(state);
        return !isNaN(value) && value < 20;
      case 'sliding_door':
      case 'window':
      case 'motion':
        return state === 'on';
      case 'dryer':
        return state === 'on';
      case 'freezer':
        const alarmDoor = this._hass.states['sensor.gefrierschrank_door_alarm_freezer']?.state;
        const alarmTemp = this._hass.states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
        return alarmDoor === 'present' || alarmTemp === 'present';
      case 'hoover':
        return state === 'error' || state === 'cleaning';
      case 'printer':
        const activeStates = ['processing', 'copying', 'scanprocessing', 'canceljob'];
        return activeStates.includes(state);
      case 'door':
        const closedState = entity.attributes.closed_entity 
          ? this._hass.states[entity.attributes.closed_entity]?.state
          : null;
        return closedState === 'on'; // Door is open
      default:
        return false;
    }
  }

  // Handle other devices control interactions
  handleOtherDevicesInteractions() {
    const shadow = this.shadowRoot;
    
    // Handle other devices header clicks (expand/collapse)
    shadow.addEventListener('click', (e) => {
      const otherDevicesHeader = e.target.closest('.other-devices-header');
      if (otherDevicesHeader) {
        const otherDevicesSection = otherDevicesHeader.closest('.other-devices-section');
        const content = otherDevicesSection.querySelector('.other-devices-content');
        if (content) {
          const isExpanded = content.style.display !== 'none';
          content.style.display = isExpanded ? 'none' : 'block';
          otherDevicesSection.classList.toggle('expanded', !isExpanded);
        }
      }
      
      // Handle individual device card clicks for more info
      const deviceCard = e.target.closest('.other-device-card');
      if (deviceCard) {
        const entityId = deviceCard.getAttribute('data-entity');
        
        if (this._hass && entityId) {
          // Show more info popup (Home Assistant's more-info dialog)
          const event = new CustomEvent('hass-more-info', {
            detail: { entityId: entityId },
            bubbles: true,
            composed: true
          });
          this.dispatchEvent(event);
        }
      }
    });
  }

  // Debug method to get component status - can be called from browser console
  getDebugStatus() {
    return {
      version: this._version,
      contentReady: this._contentReady,
      hasHass: !!this._hass,
      hassEntitiesCount: this._hass ? Object.keys(this._hass.states).length : 0,
      floorsConfigLoaded: Object.keys(this._floorsConfig).length > 0,
      roomsConfigLoaded: Object.keys(this._roomsConfig).length > 0,
      musicConfigLoaded: Object.keys(this._musicConfig).length > 0,
      temperatureConfigLoaded: Object.keys(this._temperatureConfig || {}).length > 0,
      coversConfigLoaded: Object.keys(this._coversConfig || {}).length > 0,
      scenesConfigLoaded: Object.keys(this._scenesConfig || {}).length > 0,
      otherDevicesConfigLoaded: Object.keys(this._otherDevicesConfig || {}).length > 0,
      debugMode: this._debugMode,
      loadingErrors: this._loadingErrors,
      shadowRoot: !!this.shadowRoot,
      connected: this.isConnected,
      weatherEntity: this.getCurrentWeatherEntity(),
      availableWeatherEntities: this._hass ? Object.keys(this._hass.states).filter(id => id.startsWith('weather.')) : []
    };
  }

  // Debug method to enable/disable debug mode
  setDebugMode(enabled) {
    this._debugMode = enabled;
    localStorage.setItem('dashview_debug', enabled.toString());
    console.log(`[DashView] Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  // Update alarm card (conditional display for main dashboard)
  async updateAlarmCard(shadow) {
    if (!this._alarmConfig || Object.keys(this._alarmConfig).length === 0) {
      await this.loadConfiguration();
    }

    if (!this._alarmConfig || !this._hass) return;

    const container = shadow.querySelector('[data-template="alarm-card"]');
    if (!container) return;

    const alarmEntity = this._hass.states[this._alarmConfig.alarm_entity];
    if (!alarmEntity) {
      container.innerHTML = '<div class="loading-message">Alarm entity not found</div>';
      return;
    }

    // Check if alarm should be shown (conditional states)
    const shouldShow = this._alarmConfig.conditional_states.includes(alarmEntity.state);
    
    if (!shouldShow) {
      container.innerHTML = '';
      return;
    }

    const alarmHTML = this.generateAlarmCardHTML(alarmEntity);
    container.innerHTML = alarmHTML;
  }

  // Update alarm panel (always visible in security popup)
  async updateAlarmPanel(shadow) {
    if (!this._alarmConfig || Object.keys(this._alarmConfig).length === 0) {
      await this.loadConfiguration();
    }

    if (!this._alarmConfig || !this._hass) return;

    const container = shadow.querySelector('[data-template="alarm-panel"]');
    if (!container) return;

    const alarmEntity = this._hass.states[this._alarmConfig.alarm_entity];
    if (!alarmEntity) {
      container.innerHTML = '<div class="loading-message">Alarm entity not found</div>';
      return;
    }

    const alarmHTML = this.generateAlarmPanelHTML(alarmEntity);
    container.innerHTML = alarmHTML;
  }

  // Generate HTML for conditional alarm card
  generateAlarmCardHTML(alarmEntity) {
    const config = this._alarmConfig;
    const state = alarmEntity.state;
    
    let backgroundColor = config.colors.background_normal;
    if (state === 'triggered') {
      backgroundColor = config.colors.background_triggered;
    } else if (state === 'pending') {
      backgroundColor = config.colors.background_pending;
    }

    return `
      <div class="alarm-card-mod" style="background: ${backgroundColor}; border-radius: 15px; padding: 3px; margin: 35px 8px;">
        <div class="alarm-button-card" style="background: ${backgroundColor}; padding: 15px; border-radius: 15px;">
          <div class="alarm-grid">
            <div class="alarm-icon" style="color: ${config.colors.default}; font-size: 30px;">🛡️</div>
            <div class="alarm-content">
              <div class="alarm-name" style="color: ${config.colors.default}; font-size: 14px; font-weight: 500;">${config.alarm_name}</div>
              <div class="alarm-state" style="color: ${config.colors.default}; font-size: 12px; opacity: 0.7;">${alarmEntity.state}</div>
            </div>
            <div class="alarm-controls">
              ${this.generateAlarmControlsHTML(alarmEntity)}
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // Generate HTML for alarm panel (always visible)
  generateAlarmPanelHTML(alarmEntity) {
    const config = this._alarmConfig;
    const state = alarmEntity.state;
    
    return `
      <div class="alarm-panel">
        <h4 style="color: var(--primary-text-color); margin-bottom: 15px;">${config.alarm_name}</h4>
        <div class="alarm-status" style="margin-bottom: 15px;">
          <div class="alarm-status-icon" style="font-size: 24px; margin-bottom: 8px;">🛡️</div>
          <div class="alarm-status-text" style="font-size: 16px; color: var(--primary-text-color);">Status: ${state}</div>
        </div>
        <div class="alarm-controls-panel">
          ${this.generateAlarmControlsHTML(alarmEntity)}
        </div>
      </div>
    `;
  }

  // Generate alarm controls HTML
  generateAlarmControlsHTML(alarmEntity) {
    const config = this._alarmConfig;
    const currentState = alarmEntity.state;
    
    return config.alarm_modes.map(mode => {
      const isActive = currentState === mode;
      const activeClass = isActive ? ' active' : '';
      const modeLabel = mode.replace('armed_', '').replace('_', ' ').toUpperCase();
      
      return `
        <button class="alarm-mode-button${activeClass}" 
                data-entity="${config.alarm_entity}" 
                data-mode="${mode}"
                style="margin: 2px; padding: 8px 12px; border: 1px solid #ccc; background: ${isActive ? config.colors.active : 'white'}; color: ${isActive ? 'white' : 'black'}; border-radius: 4px; cursor: pointer;">
          ${modeLabel}
        </button>
      `;
    }).join('');
  }
}

customElements.define('dashview-panel', DashviewPanel);

// Global helper functions for debugging DashView
window.DashViewDebug = {
  // Enable debug mode
  enableDebug() {
    localStorage.setItem('dashview_debug', 'true');
    console.log('[DashView] Debug mode enabled. Reload the page to see debug logs.');
  },
  
  // Disable debug mode
  disableDebug() {
    localStorage.setItem('dashview_debug', 'false');
    console.log('[DashView] Debug mode disabled.');
  },
  
  // Get status of all DashView panels on the page
  getStatus() {
    const panels = document.querySelectorAll('dashview-panel');
    return Array.from(panels).map((panel, index) => ({
      panelIndex: index,
      status: panel.getDebugStatus ? panel.getDebugStatus() : 'Debug methods not available'
    }));
  },
  
  // Force reload all DashView panels
  reload() {
    const panels = document.querySelectorAll('dashview-panel');
    panels.forEach(panel => {
      if (panel.loadContent) {
        console.log('[DashView] Reloading panel...');
        panel.loadContent();
      }
    });
  },
  
  // Check for common issues
  diagnose() {
    console.log('[DashView] Running diagnostics...');
    const issues = [];
    
    // Check if panels exist
    const panels = document.querySelectorAll('dashview-panel');
    if (panels.length === 0) {
      issues.push('No DashView panels found on page');
    }
    
    // Check if files are accessible
    const filesToCheck = [
      '/local/dashview/style.css',
      '/local/dashview/index.html',
      '/local/dashview/config/floors.json',
      '/local/dashview/config/rooms.json',
      '/local/dashview/config/music.json',
      '/local/dashview/config/temperature.json',
      '/local/dashview/config/covers.json'
    ];
    
    Promise.all(filesToCheck.map(async (file) => {
      try {
        const response = await fetch(file);
        console.log(`[DashView] ${file}: ${response.ok ? 'OK' : 'FAILED'} (${response.status})`);
        return { file, ok: response.ok, status: response.status };
      } catch (error) {
        console.error(`[DashView] ${file}: ERROR`, error);
        return { file, ok: false, error: error.message };
      }
    })).then(results => {
      const failed = results.filter(r => !r.ok);
      if (failed.length > 0) {
        console.warn('[DashView] File access issues found:', failed);
      } else {
        console.log('[DashView] All files accessible');
      }
    });
    
    if (issues.length > 0) {
      console.warn('[DashView] Issues found:', issues);
    } else {
      console.log('[DashView] No obvious issues detected');
    }
    
    return { issues, panelCount: panels.length };
  }
};

console.log('[DashView] Debug helpers available at window.DashViewDebug');
console.log('[DashView] Use DashViewDebug.enableDebug() to enable debug logging');
console.log('[DashView] Use DashViewDebug.diagnose() to check for common issues');
console.log('[DashView] Use DashViewDebug.getStatus() to see component status');
