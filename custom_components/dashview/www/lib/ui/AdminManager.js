// custom_components/dashview/www/lib/ui/AdminManager.js
import { AutoSceneGenerator } from './AutoSceneGenerator.js';
import { ValidationUtils, ConfigHealthChecker } from '../utils/validation-utils.js';

export class AdminManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._shadowRoot = panel.shadowRoot;

    this._adminLocalState = {
      houseConfig: null,
      weatherEntity: null,
      allMediaPlayers: [],
      haRooms: [],
      isLoaded: false
    };

    // Initialize AutoSceneGenerator
    this._autoSceneGenerator = new AutoSceneGenerator(panel);

    // Initialize validation utilities
    this._validationUtils = new ValidationUtils(this._hass, panel._stateManager);
    this._configHealthChecker = new ConfigHealthChecker(this._hass, panel._configManager);
    this._validationInstances = new Map(); // Track validation instances for cleanup

    // Make AdminManager self-sufficient
    this._entityLabels = {
        MOTION: 'motion', WINDOW: 'fenster', SMOKE: 'rauchmelder', VIBRATION: 'vibration',
        TEMPERATUR: 'temperatur', HUMIDITY: 'humidity', PRINTER: 'printer', DOOR: 'door',
        HOOVER: 'hoover', DISHWASHER: 'dishwasher', DRYER: 'dryer', CARTRIDGE: 'cartridge',
        LIGHT: 'light', SLIDING_DOOR: 'sliding_door', FREEZER: 'freezer', MOWER: 'mower'
    };
  }

  setHass(hass) {
    this._hass = hass;
    if (this._autoSceneGenerator) {
      this._autoSceneGenerator.setHass(hass);
    }
    if (this._validationUtils) {
      this._validationUtils._hass = hass;
    }
    if (this._configHealthChecker) {
      this._configHealthChecker._hass = hass;
    }
  }

  loadTabContent(targetId) {
    const loadActionMap = {
      'room-management-tab': () => this.loadRoomManagementTab(),
      'house-setup-tab': () => this.loadHouseSetupTab(),
      'integrations-tab': () => this.loadIntegrationsTab(),
      'room-maintenance-tab': () => this.loadRoomMaintenance(),
      'calendar-management-tab': () => this.loadCalendarManagement(),
      'person-management-tab': () => this.loadPersonManagement(),
      'floor-layouts-tab': () => this.loadFloorLayoutEditor(),
      'custom-cards-tab': () => this.loadCustomCards(),
      'scenes-tab': () => this.loadScenes(),
      'media-presets-tab': () => this.loadMediaPlayerPresets(),
      'sensor-management-tab': () => this.loadSensorManagementTab(),
      'device-management-tab': () => this.loadDeviceManagementTab(),
      'other-entities-tab': () => this.loadOtherEntitiesTab(),
      'garbage-tab': () => this.loadGarbageTab(),
      'config-health-tab': () => this.loadConfigurationHealthCheck(),
    };

    if (loadActionMap[targetId]) {
      setTimeout(() => {
        loadActionMap[targetId]();
        // Update Configuration Summary after loading any tab
        setTimeout(async () => await this._updateAdminSummary(), 100);
      }, 50);
    }
  }

  initializeAdminEventListeners() {
    // Initialize tooltips for all elements with data-tooltip attributes
    this._initializeTooltips();
    
    // Initialize the Configuration Summary on first load
    setTimeout(async () => await this._updateAdminSummary(), 200);
    
    this._shadowRoot.addEventListener('click', (e) => {
        const moveUpBtn = e.target.closest('.floor-move-up-button');
        if (moveUpBtn) {
            this._moveFloor(moveUpBtn.dataset.floorId, -1);
            return;
        }

        const moveDownBtn = e.target.closest('.floor-move-down-button');
        if (moveDownBtn) {
            this._moveFloor(moveDownBtn.dataset.floorId, 1);
            return;
        }

        const buttonActions = {
            '#reload-house-config': () => this.loadHouseSetupTab(),
            '#save-house-config': () => this.saveHouseConfiguration(),
            '#save-calendars': () => this.saveCalendarManagement(),
            '#reload-calendars': () => this.loadCalendarManagement(),
            '#save-persons': () => this.savePersonManagement(),
            '#reload-persons': () => this.loadPersonManagement(),
            '#add-person': () => this.addPersonConfiguration(),
            '#save-motion-sensor-config': () => this.saveGenericSensorConfig(this._entityLabels.MOTION, 'motion-setup-status', 'motion-sensors-by-room'),
            '#reload-motion-sensors': () => this.loadGenericSensorSetup({label: this._entityLabels.MOTION}, 'motion-setup-status', 'motion-sensors-by-room', 'Motion Sensors'),
            '#save-cover-config': () => this.saveGenericSensorConfig('cover', 'cover-setup-status', 'covers-by-room', true),
            '#reload-cover-entities': () => this.loadGenericSensorSetup({domain: 'cover'}, 'cover-setup-status', 'covers-by-room', 'Covers'),
            '#save-light-config': () => this.saveGenericSensorConfig('light', 'light-setup-status', 'lights-by-room', true),
            '#reload-light-entities': () => this.loadGenericSensorSetup({domain: 'light'}, 'light-setup-status', 'lights-by-room', 'Lights'),
            '#save-window-sensor-config': () => this.saveGenericSensorConfig(this._entityLabels.WINDOW, 'window-setup-status', 'window-sensors-by-room'),
            '#reload-window-sensors': () => this.loadGenericSensorSetup({label: this._entityLabels.WINDOW}, 'window-setup-status', 'window-sensors-by-room', 'Window Sensors'),
            '#save-smoke-detector-sensor-config': () => this.saveGenericSensorConfig(this._entityLabels.SMOKE, 'smoke-detector-setup-status', 'smoke-detector-sensors-by-room'),
            '#reload-smoke-detector-sensors': () => this.loadGenericSensorSetup({label: this._entityLabels.SMOKE}, 'smoke-detector-setup-status', 'smoke-detector-sensors-by-room', 'Smoke Detectors'),
            '#save-vibration-sensor-config': () => this.saveGenericSensorConfig(this._entityLabels.VIBRATION, 'vibration-setup-status', 'vibration-sensors-by-room'),
            '#reload-vibration-sensors': () => this.loadGenericSensorSetup({label: this._entityLabels.VIBRATION}, 'vibration-setup-status', 'vibration-sensors-by-room', 'Vibration Sensors'),
            '#save-door-sensor-config': () => this.saveGenericSensorConfig(this._entityLabels.DOOR, 'door-setup-status', 'door-sensors-by-room'),
            '#reload-door-sensors': () => this.loadGenericSensorSetup({label: this._entityLabels.DOOR}, 'door-setup-status', 'door-sensors-by-room', 'Door Sensors'),
            '#save-temperatur-sensor-config': () => this.saveGenericSensorConfig(this._entityLabels.TEMPERATUR, 'temperatur-setup-status', 'temperatur-sensors-by-room'),
            '#reload-temperatur-sensors': () => this.loadGenericSensorSetup({label: this._entityLabels.TEMPERATUR}, 'temperatur-setup-status', 'temperatur-sensors-by-room', 'Temperature Sensors'),
            '#save-humidity-sensor-config': () => this.saveGenericSensorConfig(this._entityLabels.HUMIDITY, 'humidity-setup-status', 'humidity-sensors-by-room'),
            '#reload-humidity-sensors': () => this.loadGenericSensorSetup({label: this._entityLabels.HUMIDITY}, 'humidity-setup-status', 'humidity-sensors-by-room', 'Humidity Sensors'),
            '#reload-room-maintenance': () => this.loadRoomMaintenance(),
            '#reload-media-players': () => this.loadRoomMediaPlayerMaintenance(),
            '#save-all-media-assignments': () => this.saveAllMediaPlayerAssignments(),
            '#save-thresholds-config': () => this.saveThresholdsConfig(),
            '#save-floor-layouts': () => this.saveFloorLayouts(),
            '#add-custom-card': () => this.addCustomCard(),
            '#save-custom-cards': () => this.saveCustomCards(),
            '#add-scene': () => {
              const name = this._shadowRoot.getElementById('new-scene-name').value;
              const id = this._shadowRoot.getElementById('new-scene-id').value;
              const icon = this._shadowRoot.getElementById('new-scene-icon').value;
              const type = this._shadowRoot.getElementById('new-scene-type').value;
              const entities = this._shadowRoot.getElementById('new-scene-entities').value.split('\n').map(e => e.trim()).filter(e => e);
          
              if (name && id && icon && type) {
                  if (!this._adminLocalState.houseConfig.scenes) {
                      this._adminLocalState.houseConfig.scenes = [];
                  }
                  this._adminLocalState.houseConfig.scenes.push({ name, id, icon, type, entities });
                  this._renderScenes();
              }
            },
            '#save-scenes': () => this.saveScenes(),
            '#add-media-preset': () => {
              const nameInput = this._shadowRoot.getElementById('new-preset-name');
              const idInput = this._shadowRoot.getElementById('new-preset-id');
              if (nameInput.value && idInput.value) {
                  if (!this._adminLocalState.houseConfig.media_presets) {
                      this._adminLocalState.houseConfig.media_presets = [];
                  }
                  this._adminLocalState.houseConfig.media_presets.push({
                      name: nameInput.value,
                      content_id: idInput.value
                  });
                  nameInput.value = '';
                  idInput.value = '';
                  this._renderMediaPlayerPresets();
              }
            },
            '#save-media-presets': () => this.saveMediaPlayerPresets(),
            '#add-hoover-entity': () => this.addOtherEntity('hoover'),
            '#save-hoover-entities': () => this.saveOtherEntities('hoover'),
            '#add-mower-entity': () => this.addOtherEntity('mower'),
            '#save-mower-entities': () => this.saveOtherEntities('mower'),
            '#add-other-door-entity': () => this.addOtherEntity('other_door'),
            '#save-other-door-entities': () => this.saveOtherEntities('other_door'),
            '#add-garbage-sensor': () => this.addGarbageSensor(),
            '#save-garbage-sensors': () => this.saveGarbageSensors(),
            '#reload-garbage-sensors': () => this.loadGarbageTab(),
            '#refresh-room-overview': () => this.refreshRoomOverview(),
            '#bulk-room-setup': () => this.bulkRoomSetup(),
            '#load-room-config': () => this.loadRoomConfiguration(),
            '#scan-room-entities': () => this.scanRoomEntities(),
            '#scan-all-rooms': () => this.scanAllRooms(),
            '#save-gesture-settings': () => this.saveGestureSettings(),
            '#reload-gesture-settings': () => this.loadGestureSettings(),
            '#reset-gesture-settings': () => this.resetGestureSettings(),
            '#test-haptic': () => this.testHapticFeedback(),
        };

        for (const selector in buttonActions) {
            if (e.target.closest(selector)) {
                buttonActions[selector]();
                return;
            }
        }
        
        const saveRoomSensorBtn = e.target.closest('.room-sensor-save-button');
        if (saveRoomSensorBtn) {
            const roomKey = saveRoomSensorBtn.dataset.roomId;
            this.saveRoomCombinedSensor(roomKey);
        }

        const removeEntityBtn = e.target.closest('.delete-button[data-entity-type]');
        if (removeEntityBtn) {
            const entityType = removeEntityBtn.dataset.entityType;
            const roomKey = removeEntityBtn.dataset.roomKey;
            const entityId = removeEntityBtn.dataset.entityId;
            this.removeOtherEntity(entityType, roomKey, entityId);
        }
    });
    
    // Initialize gesture settings range input listeners
    this._initializeGestureRangeInputs();
  }

  _setStatusMessage(element, message, type = 'default') {
    if (!element) return;
    
    // Clear any existing auto-clear timeout
    if (element._statusTimeout) {
      clearTimeout(element._statusTimeout);
      element._statusTimeout = null;
    }
    
    // Update the HTML structure for icon and text
    const iconSpan = element.querySelector('.status-icon') || document.createElement('span');
    const textSpan = element.querySelector('.status-text') || document.createElement('span');
    
    // Ensure proper structure exists
    if (!element.querySelector('.status-icon')) {
      iconSpan.className = 'status-icon mdi';
      element.appendChild(iconSpan);
    }
    
    if (!element.querySelector('.status-text')) {
      textSpan.className = 'status-text';
      element.appendChild(textSpan);
    }
    
    // Set the message text
    textSpan.textContent = message;
    
    // Reset classes and apply new status type
    element.className = 'status-display';
    
    if (type && type !== 'default') {
      element.classList.add(`status-${type}`);
      element.classList.add('has-icon');
      
      // Add transition effect
      element.classList.add('status-transition');
      setTimeout(() => {
        element.classList.remove('status-transition');
      }, 150);
    }
    
    // Auto-clear success and error messages after 4 seconds
    if (type === 'success' || type === 'error' || type === 'warning') {
      element._statusTimeout = setTimeout(() => {
        // Revert to ready state
        this._setStatusMessage(element, 'Ready', 'default');
      }, 4000);
    }
  }

  async _saveConfigViaAPI(configType, configData) {
    try {
      await this._hass.callApi('POST', 'dashview/config', { type: configType, config: configData });
      console.log(`[DashView] ${configType} configuration saved.`);
      return { status: 'success' };
    } catch (error) {
      console.error(`[DashView] Error saving ${configType} configuration:`, error);
      throw new Error(`Failed to save ${configType} configuration: ${error.message || 'Unknown error'}`);
    }
  }

  _findRoomKeyByName(roomName) {
    if (!this._adminLocalState.houseConfig?.rooms) return null;
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

  _getEntitiesForFloor(floorId) {
    const entities = new Set();
    const roomsOnFloor = Object.values(this._adminLocalState.houseConfig.rooms || {}).filter(r => r.floor === floorId);

    for(const room of roomsOnFloor) {
        if (room.header_entities) room.header_entities.forEach(e => entities.add(e.entity));
        if(room.lights) room.lights.forEach(e => entities.add(e));
        if(room.covers) room.covers.forEach(e => entities.add(e));
        if(room.media_players) room.media_players.forEach(mp => entities.add(mp.entity));
    }

    return Array.from(entities).map(id => ({
      entity_id: id,
      name: this._hass.states[id]?.attributes.friendly_name || id
    })).sort((a, b) => a.name.localeCompare(b.name));
  }
  
  async loadWeatherEntityConfiguration() {
    const selector = this._shadowRoot.getElementById('weather-entity-selector');
    const statusEl = this._shadowRoot.getElementById('weather-status');
    if (!selector) return;

    if (!this._hass || !this._hass.states) {
        this._setStatusMessage(statusEl, 'Loading weather entities...', 'loading');
        selector.innerHTML = '<option>Loading...</option>';
        // Retry after a short delay when hass becomes available
        setTimeout(() => this.loadWeatherEntityConfiguration(), 500);
        return;
    }

    this._setStatusMessage(statusEl, 'Loading...', 'loading');
    try {
        const weatherEntities = Object.keys(this._hass.states)
            .filter(id => id.startsWith('weather.'))
            .map(id => ({
                entityId: id,
                friendlyName: this._hass.states[id].attributes.friendly_name || id
            }))
            .sort((a, b) => a.friendlyName.localeCompare(b.friendlyName));
        
        const response = await this._hass.callApi('GET', 'dashview/config?type=weather_entity');
        const currentEntity = response.weather_entity;
        
        this._adminLocalState.weatherEntity = currentEntity;
        
        selector.innerHTML = '';
        if (weatherEntities.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No weather entities found';
            option.disabled = true;
            selector.appendChild(option);
        } else {
            weatherEntities.forEach(entity => {
                const option = document.createElement('option');
                option.value = entity.entityId;
                option.textContent = entity.friendlyName;
                option.selected = entity.entityId === currentEntity;
                selector.appendChild(option);
            });
        }
        
        // Add change event listener for auto-save
        if (!selector.hasAttribute('data-auto-save-listener')) {
            selector.addEventListener('change', () => {
                this.saveWeatherEntityConfiguration();
            });
            selector.setAttribute('data-auto-save-listener', 'true');
        }
        
        this._setStatusMessage(statusEl, '✓ Loaded', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
        console.error("[AdminManager] Error loading weather entity config:", e);
    }
  }

  async saveWeatherEntityConfiguration() {
    const statusEl = this._shadowRoot.getElementById('weather-status');
    const selector = this._shadowRoot.getElementById('weather-entity-selector');
    const selectedEntity = selector.value;
    if (!selectedEntity) {
        this._setStatusMessage(statusEl, '✗ No entity selected', 'error');
        return;
    }
    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    try {
        const houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
        houseConfig.weather_entity = selectedEntity;
        await this._saveConfigViaAPI('house', houseConfig);
        
        this._panel._weatherEntityId = selectedEntity;
        this._setStatusMessage(statusEl, '✓ Saved!', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }
  
  async loadHouseSetupTab() {
    const statusEl = this._shadowRoot.getElementById('house-config-status');
    const textarea = this._shadowRoot.getElementById('house-config');
    this._setStatusMessage(statusEl, 'Loading house configuration...', 'loading');
    try {
        const houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
        this._adminLocalState.houseConfig = houseConfig || { rooms: {}, floors: {} };
        textarea.value = JSON.stringify(this._adminLocalState.houseConfig, null, 2);
        this._setStatusMessage(statusEl, '✓ Loaded', 'success');
        await this._updateAdminSummary();
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  async saveHouseConfiguration() {
    const statusEl = this._shadowRoot.getElementById('house-config-status');
    const textarea = this._shadowRoot.getElementById('house-config');
    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    try {
        const configData = JSON.parse(textarea.value);
        await this._saveConfigViaAPI('house', configData);
        this._panel._houseConfig = configData;
        this._adminLocalState.houseConfig = configData;
        this._setStatusMessage(statusEl, '✓ Saved!', 'success');
        await this._updateAdminSummary();
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  async loadGenericSensorSetup(queryParams, statusElementId, containerElementId, headerText) {
    const statusElement = this._shadowRoot.getElementById(statusElementId);
    const container = this._shadowRoot.getElementById(containerElementId);
    this._setStatusMessage(statusElement, `Loading ${headerText}...`, 'loading');

    try {
        const queryString = Object.entries(queryParams).map(([key, value]) => `${key}=${value}`).join('&');
        const [entitiesByRoom, houseConfig] = await Promise.all([
            this._hass.callApi('GET', `dashview/config?type=entities_by_room&${queryString}`),
            this._hass.callApi('GET', 'dashview/config?type=house')
        ]);
        
        this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
        const entityType = queryParams.label || queryParams.domain;
        this._renderGenericSensorSetup(container, entitiesByRoom, houseConfig, entityType);
        this._setStatusMessage(statusElement, '✓ Loaded', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error: ${error.message}`, 'error');
        container.innerHTML = `<div class="placeholder"><p>Failed to load entities. Check console.</p></div>`;
    }
  }

  _renderGenericSensorSetup(container, entitiesByRoom, houseConfig, entityType) {
    if (!container) return;
    if (!entitiesByRoom || Object.keys(entitiesByRoom).length === 0) {
        container.innerHTML = `<div class="placeholder"><p>No entities found for type "${entityType}". Please check your Home Assistant labels or entity domains.</p></div>`;
        return;
    }
    let html = '';
    Object.entries(entitiesByRoom).forEach(([areaId, areaData]) => {
        html += `<div class="room-config"><h6>${areaData.name}</h6><div class="entity-list">`;
        areaData.entities.forEach(entity => {
            const isConfigured = this._isEntityInRoom(entity.entity_id, entityType, houseConfig);
            html += `
                <div class="entity-list-item">
                    <label class="checkbox-label">
                        <input type="checkbox" data-entity-id="${entity.entity_id}" data-room-name="${areaData.name}" ${isConfigured ? 'checked' : ''}>
                        <span class="checkmark"></span>${entity.name}
                    </label>
                    <span class="entity-id">${entity.entity_id}</span>
                </div>`;
        });
        html += `</div></div>`;
    });
    container.innerHTML = html;
    
    // Attach search functionality after rendering
    this._attachEntitySearchListener(container.id);
  }

  _isEntityInRoom(entityId, entityType, houseConfig) {
    if (!houseConfig?.rooms) return false;
    const isDomainBased = ['light', 'cover'].includes(entityType);
    const checkFunc = isDomainBased 
      ? (room, id) => room[entityType + 's']?.includes(id)
      : (room, id, type) => room.header_entities?.some(he => he.entity === id && he.entity_type === type);
      
    return Object.values(houseConfig.rooms).some(room => checkFunc(room, entityId, entityType));
  }

  /**
   * Attach search listener for entity filtering
   * @param {string} containerElementId - The container element ID to search within
   */
  _attachEntitySearchListener(containerElementId) {
    const searchInput = this._shadowRoot.querySelector(`input.entity-search-input[data-target="${containerElementId}"]`);
    if (!searchInput) return;

    // Remove existing listener to prevent duplicates
    searchInput.removeEventListener('input', searchInput._entitySearchHandler);
    
    // Create and attach new listener
    searchInput._entitySearchHandler = (event) => {
      this._filterEntityListDisplay(event.target, containerElementId);
    };
    
    searchInput.addEventListener('input', searchInput._entitySearchHandler);
    
    // Apply current search term if any (useful when switching tabs)
    if (searchInput.value) {
      this._filterEntityListDisplay(searchInput, containerElementId);
    }
    
    // Re-initialize tooltips for any newly rendered content
    this._initializeTooltips();
  }

  /**
   * Filter entity list display based on search term
   * @param {HTMLInputElement} inputElement - The search input element
   * @param {string} containerElementId - The container element ID to filter
   */
  _filterEntityListDisplay(inputElement, containerElementId) {
    const searchTerm = inputElement.value;
    const searchTermLower = searchTerm.toLowerCase().trim();
    const container = this._shadowRoot.getElementById(containerElementId);
    
    if (!container) return;

    // Get all entity list items
    const entityItems = container.querySelectorAll('.entity-list-item, .floor-item');
    const roomConfigs = container.querySelectorAll('.room-config');

    entityItems.forEach(item => {
      let isMatch = false;
      
      // Handle different item structures
      const label = item.querySelector('.checkbox-label');
      const entityId = item.querySelector('.entity-id');
      const entityName = item.querySelector('.entity-name, .floor-name');
      const floorDetails = item.querySelector('.floor-details');
      
      if (label && entityId) {
        // Standard sensor setup items
        const labelText = label.textContent.toLowerCase();
        const entityIdText = entityId.textContent.toLowerCase();
        isMatch = !searchTermLower || labelText.includes(searchTermLower) || entityIdText.includes(searchTermLower);
      } else if (entityName) {
        // Other entities and garbage sensors
        const nameText = entityName.textContent.toLowerCase();
        const idText = entityId ? entityId.textContent.toLowerCase() : '';
        const detailsText = floorDetails ? floorDetails.textContent.toLowerCase() : '';
        isMatch = !searchTermLower || nameText.includes(searchTermLower) || idText.includes(searchTermLower) || detailsText.includes(searchTermLower);
      } else {
        // Fallback: search all text content
        const allText = item.textContent.toLowerCase();
        isMatch = !searchTermLower || allText.includes(searchTermLower);
      }
      
      // Show/hide the entity item
      item.style.display = isMatch ? '' : 'none';
    });

    // Hide room sections that have no visible entities (only for sensor setups)
    roomConfigs.forEach(roomConfig => {
      const entityList = roomConfig.querySelector('.entity-list');
      if (!entityList) return;

      const visibleItems = entityList.querySelectorAll('.entity-list-item:not([style*="display: none"])');
      roomConfig.style.display = visibleItems.length > 0 ? '' : 'none';
    });

    // Update search result count (optional enhancement)
    this._updateSearchResultCount(containerElementId, searchTerm);
  }

  /**
   * Update search result count display (optional enhancement)
   * @param {string} containerElementId - The container element ID
   * @param {string} searchTerm - The current search term
   */
  _updateSearchResultCount(containerElementId, searchTerm) {
    const container = this._shadowRoot.getElementById(containerElementId);
    if (!container) return;
    
    // Find existing result count display
    let resultCountEl = container.querySelector('.search-result-count');
    
    if (!searchTerm) {
      // Hide the result count when search term is empty
      if (resultCountEl) {
        resultCountEl.style.display = 'none';
      }
      return;
    }
    
    const visibleItems = container.querySelectorAll('.entity-list-item:not([style*="display: none"])');
    
    // Create result count display if it doesn't exist
    if (!resultCountEl) {
      resultCountEl = document.createElement('div');
      resultCountEl.className = 'search-result-count';
      resultCountEl.style.cssText = 'font-size: 0.9em; color: var(--gray600); margin-bottom: 10px;';
      container.insertBefore(resultCountEl, container.firstChild);
    }

    const count = visibleItems.length;
    resultCountEl.textContent = count === 0 
      ? `No entities found for "${searchTerm}"` 
      : `${count} ${count === 1 ? 'entity' : 'entities'} found`;
    resultCountEl.style.display = 'block';
  }
  
  async saveGenericSensorConfig(entityType, statusElementId, containerElementId) {
    const statusElement = this._shadowRoot.getElementById(statusElementId);
    const checkboxes = this._shadowRoot.querySelectorAll(`#${containerElementId} input[type="checkbox"]`);
    const isDomainBased = ['light', 'cover'].includes(entityType);

    this._setStatusMessage(statusElement, 'Saving...', 'loading');
    try {
        const houseConfig = this._adminLocalState.houseConfig || { rooms: {} };
        const entityKey = isDomainBased ? entityType + 's' : 'header_entities';

        Object.values(houseConfig.rooms).forEach(room => {
            if (isDomainBased) {
                if (room[entityKey]) room[entityKey] = [];
            } else if (room.header_entities) {
                room.header_entities = room.header_entities.filter(he => he.entity_type !== entityType);
            }
        });

        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                const entityId = checkbox.dataset.entityId;
                const roomName = checkbox.dataset.roomName;
                const roomKey = this._findRoomKeyByName(roomName) || this._createRoomKeyFromName(roomName);

                if (!houseConfig.rooms[roomKey]) {
                  houseConfig.rooms[roomKey] = { friendly_name: roomName, icon: "mdi:home-outline", floor: null, lights: [], covers: [], media_players: [], header_entities: [] };
                }
                
                if (isDomainBased) {
                    if (!houseConfig.rooms[roomKey][entityKey]) houseConfig.rooms[roomKey][entityKey] = [];
                    houseConfig.rooms[roomKey][entityKey].push(entityId);
                } else {
                    if (!houseConfig.rooms[roomKey].header_entities) houseConfig.rooms[roomKey].header_entities = [];
                    houseConfig.rooms[roomKey].header_entities.push({ entity: entityId, entity_type: entityType });
                }
            }
        });

        await this._saveConfigViaAPI('house', houseConfig);
        this._adminLocalState.houseConfig = houseConfig;
        this._setStatusMessage(statusElement, '✓ Saved!', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error: ${error.message}`, 'error');
    }
  }

  /**
   * Load the integrations tab content - loads both weather and DWD configurations
   */
  loadIntegrationsTab() {
    console.log('[DashView] Loading Integrations tab - loading weather entity and DWD configurations');
    
    // Load both weather entity configuration and DWD configuration
    this.loadWeatherEntityConfiguration();
    this.loadDwdConfig();
  }

  async loadDwdConfig() {
    const selector = this._shadowRoot.getElementById('dwd-weather-warnings-selector');
    const statusEl = this._shadowRoot.getElementById('dwd-config-status');
    if (!selector || !statusEl) return;

    this._setStatusMessage(statusEl, 'Loading...', 'loading');
    try {
        const [dwdEntities, integrationsConfig] = await Promise.all([
            this._hass.callApi('GET', 'dashview/config?type=dwd_entities'),
            this._hass.callApi('GET', 'dashview/config?type=integrations')
        ]);

        const currentEntity = integrationsConfig?.dwd_weather_warnings_entity || '';

        selector.innerHTML = '';

        if (!dwdEntities || dwdEntities.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No DWD Weather Warnings entities found';
            option.disabled = true;
            selector.appendChild(option);
            this._setStatusMessage(statusEl, 'No entities found.', 'warning');
            return;
        }

        const noneOption = document.createElement('option');
        noneOption.value = '';
        noneOption.textContent = '-- None --';
        selector.appendChild(noneOption);

        dwdEntities.forEach(entity => {
            const option = document.createElement('option');
            option.value = entity.entity_id;
            option.textContent = entity.friendly_name;
            option.selected = entity.entity_id === currentEntity;
            selector.appendChild(option);
        });

        // Add change event listener for auto-save
        if (!selector.hasAttribute('data-auto-save-listener')) {
            selector.addEventListener('change', () => {
                this.saveDwdConfig();
            });
            selector.setAttribute('data-auto-save-listener', 'true');
        }

        this._setStatusMessage(statusEl, '✓ Loaded', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
        console.error("[AdminManager] Error loading DWD config:", e);
    }
  }

  async saveDwdConfig() {
    const selector = this._shadowRoot.getElementById('dwd-weather-warnings-selector');
    const statusEl = this._shadowRoot.getElementById('dwd-config-status');
    if (!selector || !statusEl) return;
    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    try {
        await this._saveConfigViaAPI('integrations', { dwd_weather_warnings_entity: selector.value });
        this._setStatusMessage(statusEl, '✓ Saved!', 'success');
    } catch(e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  async loadThresholdsConfig() {
    const tempInput = this._shadowRoot.getElementById('global-temp-threshold');
    const humidityInput = this._shadowRoot.getElementById('global-humidity-threshold');
    const statusEl = this._shadowRoot.getElementById('thresholds-config-status');
    this._setStatusMessage(statusEl, 'Loading...', 'loading');
    const houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
    tempInput.value = houseConfig.temperature_threshold || '';
    humidityInput.value = houseConfig.humidity_threshold || '';
    this._setStatusMessage(statusEl, '✓ Loaded', 'success');
  }

  async saveThresholdsConfig() {
    const tempInput = this._shadowRoot.getElementById('global-temp-threshold');
    const humidityInput = this._shadowRoot.getElementById('global-humidity-threshold');
    const statusEl = this._shadowRoot.getElementById('thresholds-config-status');
    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    try {
        const configToSave = await this._hass.callApi('GET', 'dashview/config?type=house');
        configToSave.temperature_threshold = parseFloat(tempInput.value);
        configToSave.humidity_threshold = parseFloat(humidityInput.value);
        await this._saveConfigViaAPI('house', configToSave);
        this._adminLocalState.houseConfig = configToSave;
        this._setStatusMessage(statusEl, '✓ Saved!', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  async loadFloorLayoutEditor() {
    const container = this._shadowRoot.getElementById('floor-layout-editor-container');
    const statusEl = this._shadowRoot.getElementById('floor-layouts-status');
    if (!container || !statusEl) return;

    this._setStatusMessage(statusEl, 'Loading...', 'loading');
    try {
        const houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
        this._adminLocalState.houseConfig = houseConfig;
        
        this._renderFloorLayoutEditor();
        this._setStatusMessage(statusEl, '✓ Loaded', 'success');
        this._initializeLayoutEditorEventListeners();
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  _renderFloorLayoutEditor() {
    const container = this._shadowRoot.getElementById('floor-layout-editor-container');
    if (!container) return;

    const floors = this._adminLocalState.houseConfig.floors || {};
    const layouts = this._adminLocalState.houseConfig.floor_layouts || {};

    const sortedFloors = Object.entries(floors).sort(([, a], [, b]) => (a.level || 0) - (b.level || 0));

    let editorHTML = '';
    sortedFloors.forEach(([floorId, floorConfig]) => {
        const floorLayout = layouts[floorId] || [];
        const allEntities = this._getEntitiesForFloor(floorId);
        
        editorHTML += `
            <div class="config-section">
                <div class="floor-item">
                    <div class="floor-info">
                        <div class="floor-name">${floorConfig.friendly_name || floorId}</div>
                        <div class="floor-details">Order Level: ${floorConfig.level || 0}</div>
                    </div>
                    <div class="floor-actions">
                        <button class="action-button floor-move-up-button" data-floor-id="${floorId}">▲</button>
                        <button class="action-button floor-move-down-button" data-floor-id="${floorId}">▼</button>
                    </div>
                </div>
                <details>
                    <summary>Edit Card Layout</summary>
                    <div class="floor-layout-grid" data-floor-id="${floorId}">
        `;
        for (const slot of floorLayout) {
            editorHTML += this._renderLayoutSlotEditor(slot, allEntities);
        }
        editorHTML += `</div></details></div>`;
    });
    container.innerHTML = editorHTML;
  }

  _initializeLayoutEditorEventListeners() {
    const container = this._shadowRoot.getElementById('floor-layout-editor-container');
    if (!container) return;

    container.addEventListener('change', (e) => {
      if (e.target.classList.contains('layout-type-selector')) {
        const slot = e.target.closest('.layout-slot');
        const entitySelector = slot.querySelector('.entity-selector');
        const customCardSelector = slot.querySelector('.custom-card-selector');
        
        if (e.target.value === 'pinned') {
          entitySelector.style.display = 'block';
          if (customCardSelector) customCardSelector.style.display = 'none';
        } else if (e.target.value === 'custom_card') {
          entitySelector.style.display = 'none';
          if (customCardSelector) customCardSelector.style.display = 'block';
        } else {
          entitySelector.style.display = 'none';
          if (customCardSelector) customCardSelector.style.display = 'none';
        }
      }
    });
  }

  _renderLayoutSlotEditor(slot, entities) {
    const { grid_area, type, entity_id, custom_card_id } = slot;
    const isBigSlot = grid_area.includes('-big');
    const isPinned = type === 'pinned';
    const isCustomCard = type === 'custom_card';
    const entityOptions = entities.map(entity => `<option value="${entity.entity_id}" ${entity.entity_id === entity_id ? 'selected' : ''}>${entity.name} (${entity.entity_id})</option>`).join('');
    
    // Generate custom card options
    const customCards = this._adminLocalState.houseConfig.custom_cards || {};
    const customCardOptions = Object.entries(customCards).map(([cardId, cardData]) => 
      `<option value="${cardId}" ${cardId === custom_card_id ? 'selected' : ''}>${cardData.name} (${cardId})</option>`
    ).join('');
    
    let typeOptions = `<option value="auto" ${type === 'auto' ? 'selected' : ''}>Automatic</option><option value="pinned" ${type === 'pinned' ? 'selected' : ''}>Pinned</option><option value="custom_card" ${type === 'custom_card' ? 'selected' : ''}>Custom Card</option><option value="empty" ${type === 'empty' ? 'selected' : ''}>Empty</option>`;
    if (isBigSlot) typeOptions = `<option value="room_swipe_card" ${type === 'room_swipe_card' ? 'selected' : ''}>Room Swiper</option><option value="garbage" ${type === 'garbage' ? 'selected' : ''}>Garbage</option>${typeOptions}`;

    return `<div class="layout-slot" data-grid-area="${grid_area}" style="grid-area: ${grid_area};"><div class="slot-name">${grid_area}</div><div class="slot-config"><select class="layout-type-selector">${typeOptions}</select><select class="entity-selector" style="display: ${isPinned ? 'block' : 'none'};"><option value="">-- Select Entity --</option>${entityOptions}</select><select class="custom-card-selector" style="display: ${isCustomCard ? 'block' : 'none'};"><option value="">-- Select Custom Card --</option>${customCardOptions}</select></div></div>`;
  }
  
  _moveFloor(floorId, direction) {
    const floors = this._adminLocalState.houseConfig.floors;
    const sortedFloors = Object.keys(floors).sort((a, b) => (floors[a].level || 0) - (floors[b].level || 0));
    
    const currentIndex = sortedFloors.indexOf(floorId);
    const newIndex = currentIndex + direction;

    if (newIndex >= 0 && newIndex < sortedFloors.length) {
        [sortedFloors[currentIndex], sortedFloors[newIndex]] = [sortedFloors[newIndex], sortedFloors[currentIndex]];
    }
    
    sortedFloors.forEach((id, index) => {
        if (floors[id]) {
            floors[id].level = index;
        }
    });
    
    this._renderFloorLayoutEditor();
    this._saveHouseConfig();
  }

  async _saveHouseConfig() {
    const statusEl = this._shadowRoot.getElementById('house-config-status') || this._shadowRoot.getElementById('floor-layouts-status');
    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    try {
        await this._saveConfigViaAPI('house', this._adminLocalState.houseConfig);
        this._setStatusMessage(statusEl, '✓ Saved!', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  async saveFloorLayouts() {
    const newLayouts = {};
    this._shadowRoot.querySelectorAll('.floor-layout-grid').forEach(grid => {
        const floorId = grid.dataset.floorId;
        newLayouts[floorId] = [];
        grid.querySelectorAll('.layout-slot').forEach(slot => {
            const gridArea = slot.dataset.gridArea;
            const type = slot.querySelector('.layout-type-selector').value;
            const entityId = slot.querySelector('.entity-selector').value;
            const customCardId = slot.querySelector('.custom-card-selector')?.value;
            
            const slotConfig = { 
              grid_area: gridArea, 
              type: type, 
              entity_id: type === 'pinned' ? entityId : null 
            };
            
            if (type === 'custom_card' && customCardId) {
              slotConfig.custom_card_id = customCardId;
            }
            
            newLayouts[floorId].push(slotConfig);
        });
    });
    this._adminLocalState.houseConfig.floor_layouts = newLayouts;
    await this._saveHouseConfig();
  }

  async loadScenes() {
    const statusEl = this._shadowRoot.getElementById('scenes-status');
    this._setStatusMessage(statusEl, 'Loading...', 'loading');
    try {
        const houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
        this._adminLocalState.houseConfig = houseConfig;
        
        // Update AutoSceneGenerator with latest config
        this._autoSceneGenerator._config = houseConfig;
        
        this._renderScenes();
        this._renderAutoScenes();
        this._initializeAutoSceneListeners();
        this._setStatusMessage(statusEl, '✓ Loaded', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  _renderScenes() {
    const container = this._shadowRoot.getElementById('scenes-list');
    if (!container) return;
    const scenes = this._adminLocalState.houseConfig?.scenes || [];
    container.innerHTML = '';
    scenes.forEach((scene, index) => {
        const item = document.createElement('div');
        item.className = 'floor-item';
        item.innerHTML = `
            <div class="floor-info">
                <div class="floor-name">${scene.name}</div>
                <div class="floor-details">${scene.id} (${scene.type})</div>
            </div>
            <div class="floor-actions">
                <button class="delete-button" data-index="${index}">Delete</button>
            </div>
        `;
        container.appendChild(item);
    });
  }

  async saveScenes() {
    const statusEl = this._shadowRoot.getElementById('scenes-status');
    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    const scenes = this._adminLocalState.houseConfig?.scenes || [];
    try {
        await this._saveConfigViaAPI('scenes', scenes);
        this._setStatusMessage(statusEl, '✓ Saved!', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  // Auto-Scene Management Methods
  _renderAutoScenes() {
    const lightScenesEnabled = this._autoSceneGenerator._getLightScenesEnabled();
    const lightScenesToggle = this._shadowRoot.getElementById('auto-light-scenes-enabled');
    if (lightScenesToggle) {
      lightScenesToggle.checked = lightScenesEnabled;
    }

    const globalCoverSceneEnabled = this._autoSceneGenerator._getGlobalCoverSceneEnabled();
    const globalCoverToggle = this._shadowRoot.getElementById('global-cover-scene-enabled');
    if (globalCoverToggle) {
      globalCoverToggle.checked = globalCoverSceneEnabled;
    }
  }


  _initializeAutoSceneListeners() {
    // Light scenes toggle
    const lightScenesToggle = this._shadowRoot.getElementById('auto-light-scenes-enabled');
    if (lightScenesToggle) {
      lightScenesToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        this._setStatusMessage(this._shadowRoot.getElementById('auto-scenes-status'), 
          'Updating light scenes...', 'loading');
        
        const success = await this._autoSceneGenerator.setLightScenesEnabled(enabled);
        if (success) {
          this._renderScenes(); // Refresh scene list
          this._setStatusMessage(this._shadowRoot.getElementById('auto-scenes-status'), 
            enabled ? '✓ Light scenes enabled in all rooms' : '✓ Light scenes disabled', 'success');
        } else {
          // Revert toggle on failure
          e.target.checked = !enabled;
          this._setStatusMessage(this._shadowRoot.getElementById('auto-scenes-status'), 
            '✗ Failed to toggle light scenes', 'error');
        }
      });
    }

    // Global cover scene toggle
    const globalCoverToggle = this._shadowRoot.getElementById('global-cover-scene-enabled');
    if (globalCoverToggle) {
      globalCoverToggle.addEventListener('change', async (e) => {
        const enabled = e.target.checked;
        this._setStatusMessage(this._shadowRoot.getElementById('auto-scenes-status'), 
          'Updating cover scene...', 'loading');
        
        const success = await this._autoSceneGenerator.setGlobalCoverSceneEnabled(enabled);
        if (success) {
          this._renderScenes(); // Refresh scene list
          this._setStatusMessage(this._shadowRoot.getElementById('auto-scenes-status'), 
            enabled ? '✓ Global cover scene enabled' : '✓ Global cover scene disabled', 'success');
        } else {
          // Revert toggle on failure
          e.target.checked = !enabled;
          this._setStatusMessage(this._shadowRoot.getElementById('auto-scenes-status'), 
            '✗ Failed to toggle global cover scene', 'error');
        }
      });
    }

    // Save auto-scenes settings button
    const saveBtn = this._shadowRoot.getElementById('save-auto-scenes');
    if (saveBtn) {
      saveBtn.addEventListener('click', async () => {
        const statusEl = this._shadowRoot.getElementById('auto-scenes-status');
        this._setStatusMessage(statusEl, 'Saving settings...', 'loading');
        
        // Force regeneration with current settings
        const success = await this._autoSceneGenerator.updateConfiguration(true);
        if (success) {
          this._adminLocalState.houseConfig = this._autoSceneGenerator._config;
          this._renderScenes(); // Refresh scene list
          this._setStatusMessage(statusEl, '✓ Settings saved and scenes updated', 'success');
        } else {
          this._setStatusMessage(statusEl, '✗ Failed to save settings', 'error');
        }
      });
    }
  }

async loadRoomMaintenance() {
  const statusElement = this._shadowRoot.getElementById('room-maintenance-status');
  this._setStatusMessage(statusElement, 'Loading...', 'loading');
  try {
      const [haRooms, combinedSensors, houseConfig] = await Promise.all([
          this._hass.callApi('GET', 'dashview/config?type=ha_rooms'),
          this._hass.callApi('GET', 'dashview/config?type=combined_sensors'),
          this._hass.callApi('GET', 'dashview/config?type=house')
      ]);
      this._adminLocalState.houseConfig = houseConfig || { rooms: {}, floors: {} };
      this._adminLocalState.haRooms = haRooms;
      this._renderHARoomsList(haRooms, combinedSensors);
      this._setStatusMessage(statusElement, '✓ Loaded', 'success');
  } catch (e) {
      this._setStatusMessage(statusElement, `✗ Error: ${e.message}`, 'error');
  }
}

_renderHARoomsList(haRooms, combinedSensors) {
  const roomsContainer = this._shadowRoot.getElementById('rooms-list');
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
      const optionsHTML = combinedSensors.map(sensor => `<option value="${sensor.entity_id}" ${currentSensor === sensor.entity_id ? 'selected' : ''}>${sensor.friendly_name}</option>`).join('');
      roomsHTML += `<div class="floor-item"><div class="floor-info"><div class="floor-name">${room.name}</div><div class="floor-details">ID: ${room.area_id}</div></div><div class="setting-row"><select class="dropdown-selector" id="room-sensor-${roomKey}"><option value="">-- No Sensor --</option>${optionsHTML}</select><button class="save-button room-sensor-save-button" data-room-id="${roomKey}">Save</button></div></div>`;
  });
  roomsContainer.innerHTML = roomsHTML;
}

async saveRoomCombinedSensor(roomKey) {
  const statusElement = this._shadowRoot.getElementById('room-maintenance-status');
  const selector = this._shadowRoot.getElementById(`room-sensor-${roomKey}`);
  const selectedSensor = selector.value;
  const houseConfig = this._adminLocalState.houseConfig;
  const haRoom = this._adminLocalState.haRooms.find(r => r.area_id === roomKey);
  
  if (!houseConfig.rooms[roomKey]) {
      houseConfig.rooms[roomKey] = { friendly_name: haRoom?.name || roomKey, icon: haRoom?.icon || 'mdi:home-outline', floor: null, lights: [], covers: [], media_players: [], header_entities: [] };
  }
  houseConfig.rooms[roomKey].combined_sensor = selectedSensor;
  this._setStatusMessage(statusElement, `Saving for ${haRoom?.name || roomKey}...`, 'loading');
  try {
      await this._saveConfigViaAPI('house', houseConfig);
      this._setStatusMessage(statusElement, `✓ Sensor for ${haRoom?.name || roomKey} saved!`, 'success');
  } catch (e) {
      this._setStatusMessage(statusElement, `✗ Error: ${e.message}`, 'error');
  }
}

async loadRoomMediaPlayerMaintenance() {
  const statusElement = this._shadowRoot.getElementById('media-player-status');
  this._setStatusMessage(statusElement, 'Loading...', 'loading');
  try {
      const [houseConfig, allPlayers] = await Promise.all([
          this._hass.callApi('GET', 'dashview/config?type=house'),
          this._hass.callApi('GET', 'dashview/config?type=available_media_players')
      ]);
      this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
      this._adminLocalState.allMediaPlayers = allPlayers || [];
      this._renderMediaPlayerAssignments();
      this._setStatusMessage(statusElement, '✓ Loaded', 'success');
  } catch(e) {
      this._setStatusMessage(statusElement, `✗ Error: ${e.message}`, 'error');
  }
}

_renderMediaPlayerAssignments() {
  const container = this._shadowRoot.getElementById('media-player-assignment-list');
  const rooms = this._adminLocalState.houseConfig.rooms || {};
  const allPlayers = this._adminLocalState.allMediaPlayers || [];
  container.innerHTML = '';

  const playerToRoomMap = new Map();
  for (const [roomKey, roomConfig] of Object.entries(rooms)) {
      (roomConfig.media_players || []).forEach(player => playerToRoomMap.set(player.entity, roomKey));
  }

  const roomOptions = Object.entries(rooms).map(([roomKey, roomConfig]) => `<option value="${roomKey}">${roomConfig.friendly_name || roomKey}</option>`).join('');

  allPlayers.forEach(player => {
      const assignedRoomKey = playerToRoomMap.get(player.entity_id) || '';
      const item = document.createElement('div');
      item.className = 'floor-item entity-list-item';
      item.innerHTML = `<div class="floor-info"><div class="floor-name">${player.friendly_name}</div><div class="floor-details entity-id">${player.entity_id}</div></div><div class="setting-row"><select class="dropdown-selector player-room-selector" data-entity-id="${player.entity_id}"><option value="">-- Unassigned --</option>${roomOptions}</select></div>`;
      item.querySelector('.player-room-selector').value = assignedRoomKey;
      container.appendChild(item);
  });

  // Attach search functionality after rendering
  this._attachEntitySearchListener('media-player-assignment-list');
}

async saveAllMediaPlayerAssignments() {
  const statusElement = this._shadowRoot.getElementById('media-player-status');
  this._setStatusMessage(statusElement, 'Saving...', 'loading');
  const houseConfig = this._adminLocalState.houseConfig;

  for (const roomKey in houseConfig.rooms) {
      if (houseConfig.rooms[roomKey].media_players) houseConfig.rooms[roomKey].media_players = [];
  }

  this._shadowRoot.querySelectorAll('.player-room-selector').forEach(selector => {
      const entityId = selector.dataset.entityId;
      const roomKey = selector.value;
      if (roomKey && houseConfig.rooms[roomKey]) {
          if (!houseConfig.rooms[roomKey].media_players) houseConfig.rooms[roomKey].media_players = [];
          houseConfig.rooms[roomKey].media_players.push({ entity: entityId });
      }
  });

  try {
      await this._saveConfigViaAPI('house', houseConfig);
      this._setStatusMessage(statusElement, '✓ Saved!', 'success');
  } catch (e) {
      this._setStatusMessage(statusElement, `✗ Error: ${e.message}`, 'error');
  }
}
async loadMediaPlayerPresets() {
  const statusEl = this._shadowRoot.getElementById('media-presets-status');
  this._setStatusMessage(statusEl, 'Loading...', 'loading');
  try {
      const houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
      this._adminLocalState.houseConfig = houseConfig;
      this._renderMediaPlayerPresets();
      this._setStatusMessage(statusEl, '✓ Loaded', 'success');
  } catch (e) {
      this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
  }
}

_renderMediaPlayerPresets() {
  const container = this._shadowRoot.getElementById('media-presets-list');
  if (!container) return;
  const presets = this._adminLocalState.houseConfig?.media_presets || [];
  container.innerHTML = '';
  presets.forEach((preset, index) => {
      const item = document.createElement('div');
      item.className = 'floor-item';
      item.innerHTML = `
          <div class="floor-info">
              <div class="floor-name">${preset.name}</div>
              <div class="floor-details">${preset.content_id}</div>
          </div>
          <div class="floor-actions">
              <button class="delete-button" data-index="${index}">Delete</button>
          </div>
      `;
      container.appendChild(item);
  });
}

async saveMediaPlayerPresets() {
  const statusEl = this._shadowRoot.getElementById('media-presets-status');
  this._setStatusMessage(statusEl, 'Saving...', 'loading');
  const presets = this._adminLocalState.houseConfig?.media_presets || [];
  try {
      await this._saveConfigViaAPI('media_presets', presets);
      this._setStatusMessage(statusEl, '✓ Saved!', 'success');
  } catch (e) {
      this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
  }
}

  async _updateAdminSummary() {
    const container = this._shadowRoot.getElementById('config-summary-container');
    if (!container) return;
    
    // If houseConfig is not loaded, fetch it
    if (!this._adminLocalState.houseConfig) {
      try {
        container.innerHTML = '<p>Loading configuration summary...</p>';
        this._adminLocalState.houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house') || {};
      } catch (error) {
        console.warn('[DashView] Could not load house config for summary:', error);
        container.innerHTML = '<p>Unable to load configuration data.</p>';
        return;
      }
    }
    
    const houseConfig = this._adminLocalState.houseConfig || {};
    const floors = houseConfig.floors || {};
    const rooms = houseConfig.rooms || {};
    const stats = { Floors: Object.keys(floors).length, Rooms: Object.keys(rooms).length };
    
    let lightCount = 0, coverCount = 0, mediaPlayerCount = 0, headerEntityCount = 0;
    let motionSensorCount = 0, windowSensorCount = 0, temperatureSensorCount = 0;
    let sceneCount = 0, customCardCount = 0, mediaPresetCount = 0;
    let calendarCount = 0, personCount = 0, garbageSensorCount = 0;
    
    Object.values(rooms).forEach(room => {
        lightCount += room.lights?.length || 0;
        coverCount += room.covers?.length || 0;
        mediaPlayerCount += room.media_players?.length || 0;
        headerEntityCount += room.header_entities?.length || 0;
        motionSensorCount += room.motion_sensors?.length || 0;
        windowSensorCount += room.window_sensors?.length || 0;
        temperatureSensorCount += room.temperatur_sensors?.length || 0;
    });
    
    sceneCount = houseConfig.scenes?.length || 0;
    customCardCount = Object.keys(houseConfig.custom_cards || {}).length;
    mediaPresetCount = houseConfig.media_presets?.length || 0;
    calendarCount = houseConfig.linked_calendars?.length || 0;
    personCount = Object.keys(houseConfig.persons || {}).length;
    garbageSensorCount = houseConfig.garbage_sensors?.length || 0;
    
    stats['Lights'] = lightCount;
    stats['Covers'] = coverCount;
    stats['Media Players'] = mediaPlayerCount;
    stats['Header Entities'] = headerEntityCount;
    stats['Motion Sensors'] = motionSensorCount;
    stats['Window Sensors'] = windowSensorCount;
    stats['Temperature Sensors'] = temperatureSensorCount;
    stats['Scenes'] = sceneCount;
    stats['Custom Cards'] = customCardCount;
    stats['Media Presets'] = mediaPresetCount;
    stats['Calendars'] = calendarCount;
    stats['Persons'] = personCount;
    stats['Garbage Sensors'] = garbageSensorCount;
  
    let summaryHTML = '';
    Object.entries(stats).forEach(([name, count]) => {
        summaryHTML += `<div class="summary-item"><strong>${name}:</strong><span>${count}</span></div>`;
    });
    container.innerHTML = summaryHTML;
  }

  async loadOtherEntitiesTab() {
    try {
        const [houseConfig, allEntities] = await Promise.all([
            this._hass.callApi('GET', 'dashview/config?type=house'),
            this._getAvailableEntities()
        ]);
        
        this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
        this._adminLocalState.allEntities = allEntities;
        
        this._populateRoomSelectors();
        this._populateVacuumSelectors();
        this._renderOtherEntities();
        
        this._setStatusMessage(this._shadowRoot.getElementById('hoover-setup-status'), '✓ Ready', 'success');
        this._setStatusMessage(this._shadowRoot.getElementById('mower-setup-status'), '✓ Ready', 'success');
        this._setStatusMessage(this._shadowRoot.getElementById('other-door-setup-status'), '✓ Ready', 'success');
    } catch (error) {
        console.error('[DashView] Error loading other entities:', error);
        this._setStatusMessage(this._shadowRoot.getElementById('hoover-setup-status'), `✗ Error: ${error.message}`, 'error');
        this._setStatusMessage(this._shadowRoot.getElementById('mower-setup-status'), `✗ Error: ${error.message}`, 'error');
        this._setStatusMessage(this._shadowRoot.getElementById('other-door-setup-status'), `✗ Error: ${error.message}`, 'error');
    }
  }

  async _getAvailableEntities() {
    if (!this._hass?.states) return [];
    
    const relevantDomains = ['vacuum', 'lawn_mower', 'binary_sensor', 'sensor', 'switch', 'device_tracker'];
    const entities = [];
    
    for (const entityId in this._hass.states) {
        const domain = entityId.split('.')[0];
        if (relevantDomains.includes(domain)) {
            const state = this._hass.states[entityId];
            entities.push({
                entity_id: entityId,
                friendly_name: state.attributes.friendly_name || entityId,
                domain: domain
            });
        }
    }
    
    return entities.sort((a, b) => a.friendly_name.localeCompare(b.friendly_name));
  }

  _populateRoomSelectors() {
    const rooms = this._adminLocalState.houseConfig.rooms || {};
    console.log('[DashView] Populating room selectors with rooms:', Object.keys(rooms));
    
    const roomOptions = Object.entries(rooms).map(([roomKey, roomConfig]) => 
        `<option value="${roomKey}">${roomConfig.friendly_name || roomKey}</option>`
    ).join('');
    
    ['hoover', 'mower', 'other-door'].forEach(type => {
        const selector = this._shadowRoot.getElementById(`new-${type}-room`);
        if (selector) {
            selector.innerHTML = '<option value="">Select Room</option>' + roomOptions;
            console.log(`[DashView] Populated ${type} room selector with ${Object.keys(rooms).length} rooms`);
        } else {
            console.warn(`[DashView] Could not find room selector for type: ${type}`);
        }
    });
  }

  _populateVacuumSelectors() {
    const allEntities = this._adminLocalState.allEntities || [];
    const vacuumEntities = allEntities.filter(entity => entity.domain === 'vacuum');
    
    console.log('[DashView] Populating vacuum selectors with', vacuumEntities.length, 'vacuum entities');
    
    const vacuumOptions = vacuumEntities.map(entity => 
        `<option value="${entity.entity_id}">${entity.friendly_name}</option>`
    ).join('');
    
    ['hoover', 'mower'].forEach(type => {
        const selector = this._shadowRoot.getElementById(`new-${type}-entity`);
        if (selector) {
            selector.innerHTML = '<option value="">Select Vacuum Entity</option>' + vacuumOptions;
            console.log(`[DashView] Populated ${type} entity selector with ${vacuumEntities.length} vacuum entities`);
        } else {
            console.warn(`[DashView] Could not find entity selector for type: ${type}`);
        }
    });
  }

  _renderOtherEntities() {
    const entityTypes = [
        { type: 'hoover', label: 'Hoover', containerId: 'hoover-entities-list' },
        { type: 'mower', label: 'Mower', containerId: 'mower-entities-list' },
        { type: 'other_door', label: 'Door', containerId: 'other-door-entities-list' }
    ];
    
    entityTypes.forEach(({ type, label, containerId }) => {
        const container = this._shadowRoot.getElementById(containerId);
        if (!container) return;
        
        const configuredEntities = this._getConfiguredEntitiesOfType(type);
        
        if (configuredEntities.length === 0) {
            container.innerHTML = `<div class="placeholder"><p>No ${label.toLowerCase()} entities configured yet.</p></div>`;
            return;
        }
        
        let html = '';
        configuredEntities.forEach(({ roomKey, roomName, entityId, entityName }) => {
            html += `
                <div class="entity-list-item">
                    <div class="entity-info">
                        <span class="entity-name">${entityName}</span>
                        <span class="entity-id">${entityId}</span>
                        <span class="entity-room">Room: ${roomName}</span>
                    </div>
                    <button class="delete-button" data-entity-type="${type}" data-room-key="${roomKey}" data-entity-id="${entityId}">Remove</button>
                </div>
            `;
        });
        
        container.innerHTML = html;
        
        // Attach search functionality after rendering
        this._attachEntitySearchListener(containerId);
    });
  }

  _getConfiguredEntitiesOfType(entityType) {
    const rooms = this._adminLocalState.houseConfig.rooms || {};
    const configuredEntities = [];
    
    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
        const headerEntities = roomConfig.header_entities || [];
        headerEntities.forEach(entity => {
            if (entity.entity_type === entityType) {
                const entityState = this._hass.states[entity.entity];
                configuredEntities.push({
                    roomKey,
                    roomName: roomConfig.friendly_name || roomKey,
                    entityId: entity.entity,
                    entityName: entityState?.attributes.friendly_name || entity.entity
                });
            }
        });
    });
    
    return configuredEntities;
  }

  addOtherEntity(entityType) {
    const roomSelector = this._shadowRoot.getElementById(`new-${entityType.replace('_', '-')}-room`);
    const entitySelector = this._shadowRoot.getElementById(`new-${entityType.replace('_', '-')}-entity`);
    
    const roomKey = roomSelector?.value?.trim();
    const entityId = entitySelector?.value?.trim();
    
    if (!roomKey || !entityId) {
        const statusId = entityType === 'other_door' ? 'other-door-setup-status' : `${entityType}-setup-status`;
        this._setStatusMessage(this._shadowRoot.getElementById(statusId), '✗ Please select room and enter entity ID', 'error');
        return;
    }
    
    // Basic entity ID validation
    if (!entityId.includes('.')) {
        const statusId = entityType === 'other_door' ? 'other-door-setup-status' : `${entityType}-setup-status`;
        this._setStatusMessage(this._shadowRoot.getElementById(statusId), '✗ Entity ID must contain a domain (e.g., vacuum.roomba)', 'error');
        return;
    }
    
    const houseConfig = this._adminLocalState.houseConfig;
    if (!houseConfig.rooms[roomKey]) {
        const statusId = entityType === 'other_door' ? 'other-door-setup-status' : `${entityType}-setup-status`;
        this._setStatusMessage(this._shadowRoot.getElementById(statusId), '✗ Room not found', 'error');
        return;
    }
    
    if (!houseConfig.rooms[roomKey].header_entities) {
        houseConfig.rooms[roomKey].header_entities = [];
    }
    
    const alreadyExists = houseConfig.rooms[roomKey].header_entities.some(
        entity => entity.entity === entityId && entity.entity_type === entityType
    );
    
    if (alreadyExists) {
        const statusId = entityType === 'other_door' ? 'other-door-setup-status' : `${entityType}-setup-status`;
        this._setStatusMessage(this._shadowRoot.getElementById(statusId), '✗ Entity already added to this room', 'error');
        return;
    }
    
    houseConfig.rooms[roomKey].header_entities.push({
        entity: entityId,
        entity_type: entityType
    });
    
    roomSelector.value = '';
    entitySelector.value = '';
    
    this._renderOtherEntities();
    
    const statusId = entityType === 'other_door' ? 'other-door-setup-status' : `${entityType}-setup-status`;
    this._setStatusMessage(this._shadowRoot.getElementById(statusId), '✓ Entity added (remember to save)', 'success');
  }

  async saveOtherEntities(entityType) {
    const statusId = entityType === 'other_door' ? 'other-door-setup-status' : `${entityType}-setup-status`;
    const statusElement = this._shadowRoot.getElementById(statusId);
    
    this._setStatusMessage(statusElement, 'Saving...', 'loading');
    
    try {
        await this._saveConfigViaAPI('house', this._adminLocalState.houseConfig);
        this._setStatusMessage(statusElement, '✓ Saved!', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error: ${error.message}`, 'error');
    }
  }

  removeOtherEntity(entityType, roomKey, entityId) {
    const houseConfig = this._adminLocalState.houseConfig;
    if (!houseConfig.rooms[roomKey]?.header_entities) return;
    
    houseConfig.rooms[roomKey].header_entities = houseConfig.rooms[roomKey].header_entities.filter(
        entity => !(entity.entity === entityId && entity.entity_type === entityType)
    );
    
    this._renderOtherEntities();
    
    const statusId = entityType === 'other_door' ? 'other-door-setup-status' : `${entityType}-setup-status`;
    this._setStatusMessage(this._shadowRoot.getElementById(statusId), '✓ Entity removed (remember to save)', 'success');
  }

  _getGarbageTypeIcon(type) {
    const garbageTypes = {
      'biomuell': 'mdi:leaf',
      'hausmuell': 'mdi:trash-can',
      'gelber_sack': 'mdi:recycle',
      'altpapier': 'mdi:newspaper',
      'restmuell': 'mdi:delete',
      'wertstoff': 'mdi:bottle-wine',
      'sondermuell': 'mdi:radioactive'
    };
    return garbageTypes[type] || 'mdi:trash-can';
  }

  async loadGarbageTab() {
    const statusElement = this._shadowRoot.getElementById('garbage-setup-status');
    this._setStatusMessage(statusElement, 'Loading...', 'loading');
    
    try {
      const houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
      this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
      this._renderGarbageSensors();
      this._setStatusMessage(statusElement, '✓ Ready', 'success');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error: ${error.message}`, 'error');
      console.error('[DashView] Error loading garbage sensors:', error);
    }
  }

  _renderGarbageSensors() {
    const container = this._shadowRoot.getElementById('garbage-sensors-list');
    if (!container) return;

    const garbageSensors = this._adminLocalState.houseConfig.garbage_sensors || [];
    
    if (garbageSensors.length === 0) {
      container.innerHTML = '<div class="placeholder"><p>No garbage sensors configured yet.</p></div>';
      return;
    }

    let html = '';
    garbageSensors.forEach((sensor, index) => {
      const icon = this._getGarbageTypeIcon(sensor.type);
      const entityState = this._hass?.states?.[sensor.entity];
      const entityName = entityState?.attributes?.friendly_name || sensor.entity;
      
      html += `
        <div class="entity-list-item">
          <div class="entity-info">
            <i class="mdi ${icon}" style="margin-right: 8px; color: var(--primary-text-color);"></i>
            <div>
              <span class="entity-name">${entityName}</span>
              <span class="entity-id">${sensor.entity}</span>
              <span class="entity-room">Type: ${sensor.type}</span>
            </div>
          </div>
          <button class="delete-button" data-index="${index}">Remove</button>
        </div>
      `;
    });
    
    container.innerHTML = html;

    // Add delete button event listeners
    container.querySelectorAll('.delete-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.removeGarbageSensor(index);
      });
    });

    // Attach search functionality after rendering
    this._attachEntitySearchListener('garbage-sensors-list');
  }

  addGarbageSensor() {
    const entityInput = this._shadowRoot.getElementById('new-garbage-sensor');
    const typeSelect = this._shadowRoot.getElementById('new-garbage-type');
    const statusElement = this._shadowRoot.getElementById('garbage-setup-status');

    const entityId = entityInput?.value?.trim();
    const type = typeSelect?.value;

    if (!entityId || !type) {
      this._setStatusMessage(statusElement, '✗ Please enter entity ID and select type', 'error');
      return;
    }

    // Basic entity ID validation
    if (!entityId.includes('.')) {
      this._setStatusMessage(statusElement, '✗ Entity ID must contain a domain (e.g., sensor.biomuell)', 'error');
      return;
    }

    const houseConfig = this._adminLocalState.houseConfig;
    if (!houseConfig.garbage_sensors) {
      houseConfig.garbage_sensors = [];
    }

    // Check if sensor already exists
    const exists = houseConfig.garbage_sensors.some(s => s.entity === entityId);
    if (exists) {
      this._setStatusMessage(statusElement, '✗ Sensor already exists', 'error');
      return;
    }

    houseConfig.garbage_sensors.push({
      entity: entityId,
      type: type
    });

    entityInput.value = '';
    typeSelect.value = '';

    this._renderGarbageSensors();
    this._setStatusMessage(statusElement, '✓ Sensor added (remember to save)', 'success');
  }

  removeGarbageSensor(index) {
    const houseConfig = this._adminLocalState.houseConfig;
    if (!houseConfig.garbage_sensors || index < 0 || index >= houseConfig.garbage_sensors.length) return;

    houseConfig.garbage_sensors.splice(index, 1);
    this._renderGarbageSensors();
    
    const statusElement = this._shadowRoot.getElementById('garbage-setup-status');
    this._setStatusMessage(statusElement, '✓ Sensor removed (remember to save)', 'success');
  }

  async saveGarbageSensors() {
    const statusElement = this._shadowRoot.getElementById('garbage-setup-status');
    this._setStatusMessage(statusElement, 'Saving...', 'loading');

    try {
      await this._saveConfigViaAPI('house', this._adminLocalState.houseConfig);
      this._setStatusMessage(statusElement, '✓ Saved!', 'success');
    } catch (error) {
      this._setStatusMessage(statusElement, `✗ Error: ${error.message}`, 'error');
    }
  }

  loadSensorManagementTab() {
    console.log('[DashView] Loading Sensor Management tab - consolidating all sensor types');
    
    // Load all sensor types
    this.loadGenericSensorSetup({label: this._entityLabels.MOTION}, 'motion-setup-status', 'motion-sensors-by-room', 'Motion Sensors');
    this.loadGenericSensorSetup({label: this._entityLabels.WINDOW}, 'window-setup-status', 'window-sensors-by-room', 'Window Sensors');
    this.loadGenericSensorSetup({label: this._entityLabels.SMOKE}, 'smoke-detector-setup-status', 'smoke-detector-sensors-by-room', 'Smoke Detectors');
    this.loadGenericSensorSetup({label: this._entityLabels.VIBRATION}, 'vibration-setup-status', 'vibration-sensors-by-room', 'Vibration Sensors');
    this.loadGenericSensorSetup({label: this._entityLabels.DOOR}, 'door-setup-status', 'door-sensors-by-room', 'Door Sensors');
    this.loadGenericSensorSetup({label: this._entityLabels.TEMPERATUR}, 'temperatur-setup-status', 'temperatur-sensors-by-room', 'Temperature Sensors');
    this.loadGenericSensorSetup({label: this._entityLabels.HUMIDITY}, 'humidity-setup-status', 'humidity-sensors-by-room', 'Humidity Sensors');
    
    // Load thresholds config for temperature section
    this.loadThresholdsConfig();
  }

  loadDeviceManagementTab() {
    console.log('[DashView] Loading Device Management tab - consolidating all device types');
    
    // Load all device types
    this.loadGenericSensorSetup({domain: 'light'}, 'light-setup-status', 'lights-by-room', 'Lights');
    this.loadGenericSensorSetup({domain: 'cover'}, 'cover-setup-status', 'covers-by-room', 'Covers');
    this.loadRoomMediaPlayerMaintenance();
  }

  /**
   * Initialize tooltip functionality for all elements with data-tooltip attributes
   */
  _initializeTooltips() {
    // Find all elements with data-tooltip attribute
    const tooltipElements = this._shadowRoot.querySelectorAll('[data-tooltip]');
    
    tooltipElements.forEach(element => {
      // Skip if already initialized
      if (element.hasAttribute('data-tooltip-initialized')) return;
      
      // Mark as initialized
      element.setAttribute('data-tooltip-initialized', 'true');
      
      // Add mouse events
      element.addEventListener('mouseenter', (e) => this._showTooltip(e));
      element.addEventListener('mouseleave', (e) => this._hideTooltip(e));
      
      // Add keyboard events for accessibility
      element.addEventListener('focus', (e) => this._showTooltip(e));
      element.addEventListener('blur', (e) => this._hideTooltip(e));
    });
  }

  /**
   * Show tooltip for an element
   * @param {Event} event - The mouse/focus event
   */
  _showTooltip(event) {
    const element = event.target;
    const tooltipText = element.dataset.tooltip;
    
    if (!tooltipText) return;

    // Remove any existing tooltip
    this._hideTooltip();

    // Create tooltip element
    const tooltip = document.createElement('div');
    tooltip.className = 'dashview-tooltip';
    tooltip.textContent = tooltipText;
    tooltip.id = 'dashview-active-tooltip';

    // Add tooltip to shadow root
    this._shadowRoot.appendChild(tooltip);

    // Position tooltip
    this._positionTooltip(tooltip, element);
  }

  /**
   * Hide active tooltip
   */
  _hideTooltip() {
    const existingTooltip = this._shadowRoot.getElementById('dashview-active-tooltip');
    if (existingTooltip) {
      existingTooltip.remove();
    }
  }

  /**
   * Position tooltip relative to target element
   * @param {HTMLElement} tooltip - The tooltip element
   * @param {HTMLElement} target - The target element
   */
  _positionTooltip(tooltip, target) {
    const targetRect = target.getBoundingClientRect();
    const shadowRect = this._shadowRoot.host.getBoundingClientRect();
    
    // Calculate position relative to shadow root container
    const left = targetRect.left - shadowRect.left + (targetRect.width / 2);
    const top = targetRect.top - shadowRect.top - 10; // 10px above element

    // Set initial position
    tooltip.style.left = left + 'px';
    tooltip.style.top = top + 'px';

    // Get tooltip dimensions after it's rendered
    requestAnimationFrame(() => {
      const tooltipRect = tooltip.getBoundingClientRect();
      const containerRect = this._shadowRoot.host.getBoundingClientRect();

      // Adjust horizontal position if tooltip goes off-screen
      let adjustedLeft = left - (tooltipRect.width / 2);
      if (adjustedLeft < 10) {
        adjustedLeft = 10;
      } else if (adjustedLeft + tooltipRect.width > containerRect.width - 10) {
        adjustedLeft = containerRect.width - tooltipRect.width - 10;
      }

      // Adjust vertical position if tooltip goes off-screen (show below instead)
      let adjustedTop = top - tooltipRect.height;
      if (adjustedTop < 10) {
        adjustedTop = targetRect.bottom - shadowRect.top + 10;
        tooltip.classList.add('tooltip-below');
      }

      tooltip.style.left = adjustedLeft + 'px';
      tooltip.style.top = adjustedTop + 'px';
    });
  }

  async loadCalendarManagement() {
    const statusElement = this._shadowRoot.getElementById('calendar-status');
    this._setStatusMessage(statusElement, 'Loading calendar configuration...', 'processing');
    
    try {
      // Fetch available calendars using authenticated API call
      const availableCalendars = await this._hass.callApi('GET', 'dashview/config?type=available_calendars');
      
      // Validate response data
      if (!Array.isArray(availableCalendars)) {
        throw new Error('Invalid response format: available calendars should be an array');
      }
      
      // Fetch current calendar configuration using authenticated API call
      const calendarConfig = await this._hass.callApi('GET', 'dashview/config?type=calendar_config');
      
      // Validate configuration response
      if (!calendarConfig || typeof calendarConfig !== 'object') {
        throw new Error('Invalid response format: calendar configuration should be an object');
      }
      
      const linkedCalendars = calendarConfig.linked_calendars || [];
      
      // Update admin local state
      if (!this._adminLocalState.houseConfig) {
        this._adminLocalState.houseConfig = {};
      }
      this._adminLocalState.houseConfig.linked_calendars = linkedCalendars;
      
      // Render calendar list
      const calendarList = this._shadowRoot.getElementById('calendar-list');
      calendarList.innerHTML = '';
      
      if (availableCalendars.length === 0) {
        calendarList.innerHTML = '<p class="no-data-message">No calendar entities found in Home Assistant.</p>';
      } else {
        availableCalendars.forEach(calendar => {
          const isChecked = linkedCalendars.includes(calendar.entity_id);
          const item = document.createElement('div');
          item.className = 'entity-list-item';
          item.innerHTML = `
            <label class="checkbox-container">
              <input type="checkbox" 
                     class="calendar-checkbox" 
                     data-entity-id="${calendar.entity_id}"
                     ${isChecked ? 'checked' : ''}>
              <span class="checkbox-checkmark"></span>
              <span class="entity-name">${calendar.friendly_name}</span>
              <span class="entity-id">${calendar.entity_id}</span>
            </label>
          `;
          calendarList.appendChild(item);
        });
      }
      
      this._setStatusMessage(statusElement, 'Calendar configuration loaded successfully', 'success');
    } catch (error) {
      console.error('[DashView] Error loading calendar configuration:', error);
      let errorMessage = 'Error loading calendar configuration';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      this._setStatusMessage(statusElement, errorMessage, 'error');
    }
  }
  
  async saveCalendarManagement() {
    const statusElement = this._shadowRoot.getElementById('calendar-status');
    this._setStatusMessage(statusElement, 'Saving calendar configuration...', 'processing');
    
    try {
      // Collect selected calendars
      const selectedCalendars = [];
      const checkboxes = this._shadowRoot.querySelectorAll('.calendar-checkbox:checked');
      checkboxes.forEach(checkbox => {
        selectedCalendars.push(checkbox.dataset.entityId);
      });
      
      // Update local state
      this._adminLocalState.houseConfig.linked_calendars = selectedCalendars;
      
      // Save to backend
      const response = await this._saveConfigViaAPI('calendar', selectedCalendars);
      
      if (response && response.status === 'success') {
        this._setStatusMessage(statusElement, 'Calendar configuration saved successfully', 'success');
        
        // Update the panel's house config
        if (this._panel._houseConfig) {
          this._panel._houseConfig.linked_calendars = selectedCalendars;
        }
      } else {
        throw new Error('Failed to save calendar configuration: Invalid response');
      }
    } catch (error) {
      console.error('[DashView] Error saving calendar configuration:', error);
      let errorMessage = 'Error saving calendar configuration';
      if (error.message) {
        errorMessage += `: ${error.message}`;
      }
      this._setStatusMessage(statusElement, errorMessage, 'error');
    }
  }

  async loadPersonManagement() {
    const statusElement = this._shadowRoot.getElementById('person-status');
    this._setStatusMessage(statusElement, 'Loading person configuration...', 'processing');
    
    try {
      // Fetch available persons using authenticated API call
      const availablePersons = await this._hass.callApi('GET', 'dashview/config?type=available_persons');
      
      // Fetch available device trackers using authenticated API call
      const availableTrackers = await this._hass.callApi('GET', 'dashview/config?type=available_device_trackers');
      
      // Fetch available sensors using authenticated API call
      const availableSensors = await this._hass.callApi('GET', 'dashview/config?type=available_sensors');
      
      // Fetch available calendars using authenticated API call
      const availableCalendars = await this._hass.callApi('GET', 'dashview/config?type=available_calendars');
      
      // Fetch current person configuration using authenticated API call
      const personConfig = await this._hass.callApi('GET', 'dashview/config?type=person_config');
      const persons = personConfig.persons || {};
      
      // Store for local use
      this._availablePersons = availablePersons;
      this._availableTrackers = availableTrackers;
      this._availableSensors = availableSensors;
      this._availableCalendars = availableCalendars;
      
      // Update admin local state
      if (!this._adminLocalState.houseConfig) {
        this._adminLocalState.houseConfig = {};
      }
      this._adminLocalState.houseConfig.persons = persons;
      
      // Populate person selector
      const personSelector = this._shadowRoot.getElementById('person-selector');
      personSelector.innerHTML = '<option value="">Select a person...</option>';
      
      availablePersons.forEach(person => {
        if (!persons[person.entity_id]) {
          const option = document.createElement('option');
          option.value = person.entity_id;
          option.textContent = person.friendly_name;
          personSelector.appendChild(option);
        }
      });
      
      // Render existing person configurations
      this._renderPersonConfigurations();
      
      this._setStatusMessage(statusElement, 'Person configuration loaded successfully', 'success');
    } catch (error) {
      console.error('[DashView] Error loading person configuration:', error);
      this._setStatusMessage(statusElement, 'Error loading person configuration', 'error');
    }
  }
  
  addPersonConfiguration() {
    const personSelector = this._shadowRoot.getElementById('person-selector');
    const selectedPersonId = personSelector.value;
    
    if (!selectedPersonId) return;
    
    const selectedPerson = this._availablePersons.find(p => p.entity_id === selectedPersonId);
    if (!selectedPerson) return;
    
    // Add to local state
    if (!this._adminLocalState.houseConfig.persons) {
      this._adminLocalState.houseConfig.persons = {};
    }
    
    this._adminLocalState.houseConfig.persons[selectedPersonId] = {
      enabled: true,
      friendly_name: selectedPerson.friendly_name,
      device_trackers: [],
      sensors: [],
      calendars: [],
      custom_modes: []
    };
    
    // Remove from selector
    personSelector.querySelector(`option[value="${selectedPersonId}"]`).remove();
    personSelector.value = '';
    
    // Re-render configurations
    this._renderPersonConfigurations();
  }
  
  _renderPersonConfigurations() {
    const container = this._shadowRoot.getElementById('person-configurations');
    const persons = this._adminLocalState.houseConfig.persons || {};
    
    container.innerHTML = '';
    
    Object.entries(persons).forEach(([personId, personConfig]) => {
      const personDiv = document.createElement('div');
      personDiv.className = 'person-config-card';
      personDiv.innerHTML = `
        <div class="person-config-header">
          <h6>${personConfig.friendly_name} (${personId})</h6>
          <div class="person-config-controls">
            <label class="toggle-container">
              <input type="checkbox" class="person-enabled-toggle" data-person-id="${personId}" ${personConfig.enabled ? 'checked' : ''}>
              <span class="toggle-slider"></span>
              <span class="toggle-label">Enabled</span>
            </label>
            <button class="delete-button" data-person-id="${personId}">
              <i class="mdi mdi-delete"></i>
            </button>
          </div>
        </div>
        
        <div class="person-config-content ${!personConfig.enabled ? 'disabled' : ''}">
          <div class="config-group">
            <label>Device Trackers:</label>
            <div class="multi-select-container">
              <select multiple class="multi-select-dropdown" data-person-id="${personId}" data-config-type="device_trackers">
                ${this._availableTrackers.map(tracker => `
                  <option value="${tracker.entity_id}" ${personConfig.device_trackers.includes(tracker.entity_id) ? 'selected' : ''}>
                    ${tracker.friendly_name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <div class="config-group">
            <label>Sensors:</label>
            <div class="multi-select-container">
              <select multiple class="multi-select-dropdown" data-person-id="${personId}" data-config-type="sensors" size="4">
                ${this._availableSensors.map(sensor => `
                  <option value="${sensor.entity_id}" ${personConfig.sensors.includes(sensor.entity_id) ? 'selected' : ''}>
                    ${sensor.friendly_name} ${sensor.unit_of_measurement ? `(${sensor.unit_of_measurement})` : ''}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <div class="config-group">
            <label>Calendars:</label>
            <div class="multi-select-container">
              <select multiple class="multi-select-dropdown" data-person-id="${personId}" data-config-type="calendars">
                ${this._availableCalendars.map(calendar => `
                  <option value="${calendar.entity_id}" ${personConfig.calendars.includes(calendar.entity_id) ? 'selected' : ''}>
                    ${calendar.friendly_name}
                  </option>
                `).join('')}
              </select>
            </div>
          </div>
          
          <div class="config-group">
            <label>Custom Modes:</label>
            <div class="custom-modes-container" data-person-id="${personId}">
              ${this._renderCustomModes(personConfig.custom_modes, personId)}
            </div>
            <button class="action-button add-mode-button" data-person-id="${personId}">Add Mode</button>
          </div>
        </div>
      `;
      
      container.appendChild(personDiv);
    });
    
    // Add event listeners
    this._addPersonConfigEventListeners();
  }
  
  _renderCustomModes(customModes, personId) {
    return customModes.map((mode, index) => `
      <div class="custom-mode-item" data-mode-index="${index}">
        <input type="text" class="form-input mode-name" placeholder="Mode Name" value="${mode.name || ''}" data-field="name">
        <input type="text" class="form-input mode-icon" placeholder="mdi:icon" value="${mode.icon || ''}" data-field="icon">
        <input type="text" class="form-input mode-service" placeholder="service.call" value="${mode.service || ''}" data-field="service">
        <button class="delete-button remove-mode" data-mode-index="${index}">
          <i class="mdi mdi-delete"></i>
        </button>
      </div>
    `).join('');
  }
  
  _addPersonConfigEventListeners() {
    // Enable/disable toggles
    this._shadowRoot.querySelectorAll('.person-enabled-toggle').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const personId = e.target.dataset.personId;
        const enabled = e.target.checked;
        this._adminLocalState.houseConfig.persons[personId].enabled = enabled;
        
        const content = e.target.closest('.person-config-card').querySelector('.person-config-content');
        if (enabled) {
          content.classList.remove('disabled');
        } else {
          content.classList.add('disabled');
        }
      });
    });
    
    // Delete person buttons
    this._shadowRoot.querySelectorAll('.delete-button[data-person-id]').forEach(button => {
      button.addEventListener('click', (e) => {
        const personId = e.target.closest('[data-person-id]').dataset.personId;
        delete this._adminLocalState.houseConfig.persons[personId];
        
        // Add back to selector
        const personSelector = this._shadowRoot.getElementById('person-selector');
        const person = this._availablePersons.find(p => p.entity_id === personId);
        if (person) {
          const option = document.createElement('option');
          option.value = person.entity_id;
          option.textContent = person.friendly_name;
          personSelector.appendChild(option);
        }
        
        this._renderPersonConfigurations();
      });
    });
    
    // Multi-select changes
    this._shadowRoot.querySelectorAll('.multi-select-dropdown').forEach(select => {
      select.addEventListener('change', (e) => {
        const personId = e.target.dataset.personId;
        const configType = e.target.dataset.configType;
        const selectedValues = Array.from(e.target.selectedOptions).map(option => option.value);
        
        this._adminLocalState.houseConfig.persons[personId][configType] = selectedValues;
      });
    });
    
    // Add mode buttons
    this._shadowRoot.querySelectorAll('.add-mode-button').forEach(button => {
      button.addEventListener('click', (e) => {
        const personId = e.target.dataset.personId;
        if (!this._adminLocalState.houseConfig.persons[personId].custom_modes) {
          this._adminLocalState.houseConfig.persons[personId].custom_modes = [];
        }
        this._adminLocalState.houseConfig.persons[personId].custom_modes.push({
          name: '',
          icon: '',
          service: ''
        });
        this._renderPersonConfigurations();
      });
    });
    
    // Custom mode input changes
    this._shadowRoot.querySelectorAll('.custom-mode-item input').forEach(input => {
      input.addEventListener('input', (e) => {
        const modeItem = e.target.closest('.custom-mode-item');
        const modeIndex = parseInt(modeItem.dataset.modeIndex);
        const field = e.target.dataset.field;
        const personId = e.target.closest('[data-person-id]').dataset.personId;
        
        this._adminLocalState.houseConfig.persons[personId].custom_modes[modeIndex][field] = e.target.value;
      });
    });
    
    // Remove mode buttons
    this._shadowRoot.querySelectorAll('.remove-mode').forEach(button => {
      button.addEventListener('click', (e) => {
        const modeIndex = parseInt(e.target.dataset.modeIndex);
        const personId = e.target.closest('[data-person-id]').dataset.personId;
        
        this._adminLocalState.houseConfig.persons[personId].custom_modes.splice(modeIndex, 1);
        this._renderPersonConfigurations();
      });
    });
  }
  
  async savePersonManagement() {
    const statusElement = this._shadowRoot.getElementById('person-status');
    this._setStatusMessage(statusElement, 'Saving person configuration...', 'processing');
    
    try {
      const personConfig = this._adminLocalState.houseConfig.persons || {};
      
      // Save to backend
      const response = await this._saveConfigViaAPI('persons', personConfig);
      
      if (response && response.status === 'success') {
        this._setStatusMessage(statusElement, 'Person configuration saved successfully', 'success');
        
        // Update the panel's house config
        if (this._panel._houseConfig) {
          this._panel._houseConfig.persons = personConfig;
        }
      } else {
        throw new Error('Failed to save person configuration');
      }
    } catch (error) {
      console.error('[DashView] Error saving person configuration:', error);
      this._setStatusMessage(statusElement, 'Error saving person configuration', 'error');
    }
  }

  // ===========================
  // CUSTOM CARDS MANAGEMENT
  // ===========================

  async loadCustomCards() {
    const statusEl = this._shadowRoot.getElementById('custom-cards-status');
    this._setStatusMessage(statusEl, 'Loading custom cards...', 'loading');
    
    try {
      const customCards = await this._hass.callApi('GET', 'dashview/config?type=custom_cards');
      this._adminLocalState.houseConfig.custom_cards = customCards || {};
      this._renderCustomCardsList();
      this._clearCustomCardInputs();
      this._setStatusMessage(statusEl, '✓ Loaded', 'success');
    } catch (e) {
      this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  _renderCustomCardsList() {
    const container = this._shadowRoot.getElementById('custom-cards-list');
    if (!container) return;

    const customCards = this._adminLocalState.houseConfig.custom_cards || {};
    let html = '';

    Object.entries(customCards).forEach(([cardId, cardData]) => {
      const isVisible = cardData.visible !== false; // Default to true for backward compatibility
      const visibilityIcon = isVisible ? 'eye' : 'eye-off';
      const visibilityLabel = isVisible ? 'Visible' : 'Hidden';
      
      html += `
        <div class="entity-list-item">
          <div class="entity-info">
            <div class="entity-name">${cardData.name}</div>
            <div class="entity-details">ID: ${cardId} • ${visibilityLabel}</div>
          </div>
          <div class="entity-actions">
            <button class="action-button" onclick="window.dashviewAdmin.toggleCustomCardVisibility('${cardId}')" title="Toggle visibility">
              <i class="mdi mdi-${visibilityIcon}"></i>
            </button>
            <button class="action-button" onclick="window.dashviewAdmin.editCustomCard('${cardId}')">Edit</button>
            <button class="action-button" onclick="window.dashviewAdmin.removeCustomCard('${cardId}')">Remove</button>
          </div>
        </div>
      `;
    });

    if (html === '') {
      html = '<div class="placeholder">No custom cards configured yet.</div>';
    }

    container.innerHTML = html;
    
    // Make AdminManager accessible for onclick handlers
    window.dashviewAdmin = this;
  }

  addCustomCard() {
    const idInput = this._shadowRoot.getElementById('new-card-id');
    const nameInput = this._shadowRoot.getElementById('new-card-name');
    const yamlInput = this._shadowRoot.getElementById('new-card-yaml');
    const visibleInput = this._shadowRoot.getElementById('new-card-visible');
    const statusEl = this._shadowRoot.getElementById('custom-cards-status');

    const cardId = idInput.value.trim();
    const cardName = nameInput.value.trim();
    const yamlConfig = yamlInput.value.trim();
    const isVisible = visibleInput ? visibleInput.checked : true; // Default to visible if checkbox not found

    // Basic validation
    if (!cardId || !cardName || !yamlConfig) {
      this._setStatusMessage(statusEl, 'All fields are required', 'error');
      return;
    }

    // Validate ID format (only lowercase, numbers, underscores)
    if (!/^[a-z0-9_]+$/.test(cardId)) {
      this._setStatusMessage(statusEl, 'Card ID must contain only lowercase letters, numbers, and underscores', 'error');
      return;
    }

    // Check for duplicate ID
    if (this._adminLocalState.houseConfig.custom_cards && this._adminLocalState.houseConfig.custom_cards[cardId]) {
      this._setStatusMessage(statusEl, 'Card ID already exists', 'error');
      return;
    }

    // Add card to local state
    if (!this._adminLocalState.houseConfig.custom_cards) {
      this._adminLocalState.houseConfig.custom_cards = {};
    }

    this._adminLocalState.houseConfig.custom_cards[cardId] = {
      name: cardName,
      yaml_config: yamlConfig,
      visible: isVisible
    };

    this._renderCustomCardsList();
    this._clearCustomCardInputs();
    this._setStatusMessage(statusEl, 'Card added successfully', 'success');
  }

  editCustomCard(cardId) {
    const card = this._adminLocalState.houseConfig.custom_cards[cardId];
    if (!card) return;

    const idInput = this._shadowRoot.getElementById('new-card-id');
    const nameInput = this._shadowRoot.getElementById('new-card-name');
    const yamlInput = this._shadowRoot.getElementById('new-card-yaml');
    const visibleInput = this._shadowRoot.getElementById('new-card-visible');

    idInput.value = cardId;
    nameInput.value = card.name;
    yamlInput.value = card.yaml_config;
    if (visibleInput) {
      visibleInput.checked = card.visible !== false; // Default to true for backward compatibility
    }

    // Make ID input read-only when editing
    idInput.readOnly = true;
    idInput.style.backgroundColor = '#f0f0f0';

    this._setStatusMessage(this._shadowRoot.getElementById('custom-cards-status'), 'Editing card...', 'processing');
  }

  removeCustomCard(cardId) {
    if (!this._adminLocalState.houseConfig.custom_cards) return;

    if (confirm(`Are you sure you want to remove the custom card "${cardId}"?`)) {
      delete this._adminLocalState.houseConfig.custom_cards[cardId];
      this._renderCustomCardsList();
      this._setStatusMessage(this._shadowRoot.getElementById('custom-cards-status'), 'Card removed', 'success');
    }
  }

  async saveCustomCards() {
    const statusEl = this._shadowRoot.getElementById('custom-cards-status');
    this._setStatusMessage(statusEl, 'Saving custom cards...', 'loading');

    try {
      await this._saveConfigViaAPI('custom_cards', this._adminLocalState.houseConfig.custom_cards || {});
      this._setStatusMessage(statusEl, '✓ Saved!', 'success');
      
      // Update main panel config
      if (this._panel._houseConfig) {
        this._panel._houseConfig.custom_cards = this._adminLocalState.houseConfig.custom_cards;
        // Update custom cards in main dashboard
        if (this._panel._floorManager) {
          this._panel._floorManager.renderCustomCardsMain();
        }
      }
    } catch (e) {
      this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  _clearCustomCardInputs() {
    const idInput = this._shadowRoot.getElementById('new-card-id');
    const nameInput = this._shadowRoot.getElementById('new-card-name');
    const yamlInput = this._shadowRoot.getElementById('new-card-yaml');
    const visibleInput = this._shadowRoot.getElementById('new-card-visible');

    if (idInput) {
      idInput.value = '';
      idInput.readOnly = false;
      idInput.style.backgroundColor = '';
    }
    if (nameInput) nameInput.value = '';
    if (yamlInput) yamlInput.value = '';
    if (visibleInput) visibleInput.checked = true; // Default to visible
  }

  toggleCustomCardVisibility(cardId) {
    if (!this._adminLocalState.houseConfig.custom_cards || !this._adminLocalState.houseConfig.custom_cards[cardId]) {
      return;
    }

    const card = this._adminLocalState.houseConfig.custom_cards[cardId];
    card.visible = !card.visible;
    
    this._renderCustomCardsList();
    this._setStatusMessage(this._shadowRoot.getElementById('custom-cards-status'), 
      `Card visibility ${card.visible ? 'enabled' : 'disabled'}`, 'success');
  }

  /**
   * Load configuration health check tab
   */
  async loadConfigurationHealthCheck() {
    const tabContent = this._shadowRoot.getElementById('admin-tab-content');
    
    // Show loading state
    tabContent.innerHTML = `
      <div class="config-health-loading">
        <h3>Konfiguration wird überprüft...</h3>
        <div class="loading-spinner"></div>
      </div>
    `;

    try {
      // Fetch health check data from backend
      const response = await fetch('/api/dashview/config?type=config_health');
      const healthData = await response.json();

      this._renderConfigurationHealthReport(healthData);
    } catch (error) {
      console.error('[DashView] Error loading configuration health check:', error);
      tabContent.innerHTML = `
        <div class="error-message">
          <h3>Fehler beim Laden der Konsistenzprüfung</h3>
          <p>Die Konfigurationsprüfung konnte nicht geladen werden: ${error.message}</p>
          <button onclick="this.closest('.admin-manager').dispatchEvent(new CustomEvent('reload-health-check'))">
            Erneut versuchen
          </button>
        </div>
      `;
    }
  }

  /**
   * Render configuration health report
   */
  _renderConfigurationHealthReport(healthData) {
    const tabContent = this._shadowRoot.getElementById('admin-tab-content');
    
    const hasIssues = healthData.totalIssues > 0;
    const fixableIssues = healthData.issues.filter(issue => issue.fixable);
    
    tabContent.innerHTML = `
      <div class="config-health-container">
        <h3>Konfiguration Konsistenzprüfung</h3>
        
        <div class="config-health-report">
          <div class="config-health-summary">
            <div class="health-stat total">
              <div class="health-stat-number">${healthData.totalIssues}</div>
              <div class="health-stat-label">Gesamt Probleme</div>
            </div>
            <div class="health-stat errors">
              <div class="health-stat-number">${healthData.errors}</div>
              <div class="health-stat-label">Fehler</div>
            </div>
            <div class="health-stat warnings">
              <div class="health-stat-number">${healthData.warnings}</div>
              <div class="health-stat-label">Warnungen</div>
            </div>
          </div>

          ${fixableIssues.length > 0 ? `
            <div class="health-fix-all-container">
              <span>Automatische Korrekturen verfügbar für ${fixableIssues.length} Problem(e)</span>
              <button class="health-fix-all-btn" id="fix-all-issues">
                Alle reparierbare Probleme beheben
              </button>
            </div>
          ` : ''}

          ${hasIssues ? `
            <div class="config-health-issues">
              ${healthData.issues.map(issue => this._renderHealthIssue(issue)).join('')}
            </div>
          ` : `
            <div class="no-issues-message">
              <i class="mdi mdi-check-circle" style="color: var(--green); font-size: 48px;"></i>
              <h4>Alles in Ordnung!</h4>
              <p>Keine Konfigurationsprobleme gefunden.</p>
            </div>
          `}
        </div>

        <div class="health-check-actions">
          <button id="refresh-health-check" class="secondary-button">
            <i class="mdi mdi-refresh"></i> Erneut prüfen
          </button>
        </div>
      </div>
    `;

    // Add event listeners
    this._setupHealthCheckEventListeners();
  }

  /**
   * Render individual health issue
   */
  _renderHealthIssue(issue) {
    return `
      <div class="health-issue ${issue.type}" data-issue-id="${issue.id}">
        <div class="health-issue-icon">
          <i class="mdi ${issue.type === 'error' ? 'mdi-alert-circle' : 'mdi-alert'}"></i>
        </div>
        <div class="health-issue-content">
          <div class="health-issue-title">${issue.title}</div>
          <div class="health-issue-description">${issue.description}</div>
          ${issue.fixable ? `
            <div class="health-issue-actions">
              <button class="health-fix-btn" data-fix-action="${issue.fixAction}" data-fix-data='${JSON.stringify(issue.fixData)}'>
                Reparieren
              </button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners for health check UI
   */
  _setupHealthCheckEventListeners() {
    // Refresh health check
    const refreshBtn = this._shadowRoot.getElementById('refresh-health-check');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.loadConfigurationHealthCheck();
      });
    }

    // Fix all issues
    const fixAllBtn = this._shadowRoot.getElementById('fix-all-issues');
    if (fixAllBtn) {
      fixAllBtn.addEventListener('click', async () => {
        await this._fixAllIssues();
      });
    }

    // Individual fix buttons
    this._shadowRoot.querySelectorAll('.health-fix-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const fixAction = e.target.dataset.fixAction;
        const fixData = JSON.parse(e.target.dataset.fixData);
        await this._applyFix(fixAction, fixData, e.target);
      });
    });
  }

  /**
   * Apply fix for all reparable issues
   */
  async _fixAllIssues() {
    const fixAllBtn = this._shadowRoot.getElementById('fix-all-issues');
    const originalText = fixAllBtn.textContent;
    
    fixAllBtn.disabled = true;
    fixAllBtn.textContent = 'Reparaturen werden angewandt...';

    try {
      const fixButtons = this._shadowRoot.querySelectorAll('.health-fix-btn');
      let successCount = 0;
      let totalFixes = fixButtons.length;

      for (const btn of fixButtons) {
        const fixAction = btn.dataset.fixAction;
        const fixData = JSON.parse(btn.dataset.fixData);
        
        const success = await this._applyFix(fixAction, fixData, btn);
        if (success) successCount++;
      }

      // Show summary
      const summaryMessage = `${successCount} von ${totalFixes} Reparaturen erfolgreich angewandt.`;
      this._showToast(summaryMessage, successCount === totalFixes ? 'success' : 'warning');

      // Refresh the health check
      setTimeout(() => {
        this.loadConfigurationHealthCheck();
      }, 1000);

    } catch (error) {
      console.error('[DashView] Error applying fixes:', error);
      this._showToast('Fehler beim Anwenden der Reparaturen', 'error');
    } finally {
      fixAllBtn.disabled = false;
      fixAllBtn.textContent = originalText;
    }
  }

  /**
   * Apply individual fix
   */
  async _applyFix(fixAction, fixData, buttonElement) {
    const originalText = buttonElement.textContent;
    
    buttonElement.disabled = true;
    buttonElement.textContent = 'Wird repariert...';

    try {
      const response = await fetch('/api/dashview/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'config_health_fix',
          config: {
            fixAction,
            fixData
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        buttonElement.textContent = 'Repariert ✓';
        buttonElement.style.background = 'var(--green)';
        this._showToast(result.message, 'success');
        
        // Remove the issue from display after a delay
        setTimeout(() => {
          const issueElement = buttonElement.closest('.health-issue');
          issueElement.style.opacity = '0.5';
          issueElement.style.pointerEvents = 'none';
        }, 1000);

        return true;
      } else {
        throw new Error(result.message || 'Unbekannter Fehler');
      }
    } catch (error) {
      console.error('[DashView] Error applying fix:', error);
      buttonElement.textContent = 'Fehler';
      buttonElement.style.background = 'var(--red)';
      this._showToast(`Fehler: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Setup validation for an input element
   */
  setupInputValidation(input, validationRules, options = {}) {
    if (!input || !this._validationUtils) return null;

    // Clean up existing validation
    const existingValidation = this._validationInstances.get(input);
    if (existingValidation) {
      existingValidation.destroy();
    }

    // Setup new validation
    const validation = this._validationUtils.setupInputValidation(input, validationRules, options);
    this._validationInstances.set(input, validation);

    return validation;
  }

  /**
   * Setup entity ID validation for an input
   */
  setupEntityIdValidation(input, options = {}) {
    return this.setupInputValidation(input, [
      { type: ValidationUtils.VALIDATION_TYPES.ENTITY_ID },
      { type: ValidationUtils.VALIDATION_TYPES.ENTITY_EXISTS }
    ], options);
  }

  /**
   * Setup unique key validation
   */
  setupUniqueKeyValidation(input, existingKeys, currentKey = null, options = {}) {
    return this.setupInputValidation(input, [
      { type: ValidationUtils.VALIDATION_TYPES.UNIQUE_KEY, existingKeys, currentKey }
    ], options);
  }

  /**
   * Setup numeric range validation
   */
  setupNumericValidation(input, min, max, required = false, options = {}) {
    return this.setupInputValidation(input, [
      { type: ValidationUtils.VALIDATION_TYPES.NUMERIC_RANGE, min, max, required }
    ], options);
  }

  /**
   * Show toast notification
   */
  _showToast(message, type = 'info') {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // Add to shadow root
    this._shadowRoot.appendChild(toast);

    // Show toast
    setTimeout(() => toast.classList.add('show'), 100);

    // Hide and remove toast
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 3000);
  }

  // =================================================================================
  // ROOM MANAGEMENT METHODS
  // =================================================================================

  /**
   * Load the room management tab with overview and configuration
   */
  async loadRoomManagementTab() {
    console.log('[DashView] Loading Room Management tab');
    
    try {
      this._setStatusMessage(this._shadowRoot.getElementById('room-overview-status'), 'Loading room overview...', 'loading');
      
      // Load house configuration
      const houseConfig = await this._hass.callApi('GET', 'dashview/config?type=house');
      this._adminLocalState.houseConfig = houseConfig || { rooms: {}, floors: {} };
      this._adminLocalState.isLoaded = true;
      
      // Populate room selectors
      this._populateRoomSelectors();
      
      // Load room overview
      await this.refreshRoomOverview();
      
      this._setStatusMessage(this._shadowRoot.getElementById('room-overview-status'), 'Ready', 'success');
    } catch (error) {
      console.error('[DashView] Room Management loading error:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load room management';
      if (error.message) {
        if (error.message.includes('401') || error.message.includes('403')) {
          errorMessage = 'Authentication error - please refresh the page';
        } else if (error.message.includes('404')) {
          errorMessage = 'Room management API not found';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timeout - please try again';
        } else {
          errorMessage = `Error: ${error.message}`;
        }
      }
      
      this._setStatusMessage(this._shadowRoot.getElementById('room-overview-status'), errorMessage, 'error');
    }
  }

  /**
   * Populate room selector dropdowns
   */
  _populateRoomSelectors() {
    const roomSelector = this._shadowRoot.getElementById('room-selector');
    const discoveryRoomSelector = this._shadowRoot.getElementById('discovery-room-selector');
    
    if (!roomSelector || !discoveryRoomSelector) {
      console.warn('[DashView] Room selector elements not found in DOM');
      return;
    }
    
    // Clear existing options (keep first default option)
    roomSelector.innerHTML = '<option value="">Select a room to configure...</option>';
    discoveryRoomSelector.innerHTML = '<option value="">Select room for discovery...</option><option value="all">All Rooms</option>';
    
    if (!this._adminLocalState.houseConfig?.rooms) {
      console.info('[DashView] No rooms found in house configuration');
      
      // Add helpful message when no rooms exist
      const noRoomsOption = document.createElement('option');
      noRoomsOption.value = '';
      noRoomsOption.textContent = 'No rooms configured - check Home Assistant areas';
      noRoomsOption.disabled = true;
      roomSelector.appendChild(noRoomsOption);
      
      return;
    }
    
    // Add room options
    const roomEntries = Object.entries(this._adminLocalState.houseConfig.rooms);
    console.log(`[DashView] Populating ${roomEntries.length} rooms in selectors`);
    
    roomEntries.forEach(([roomKey, roomData]) => {
      const roomName = roomData?.friendly_name || roomKey;
      
      const option1 = document.createElement('option');
      option1.value = roomKey;
      option1.textContent = roomName;
      roomSelector.appendChild(option1);
      
      const option2 = document.createElement('option');
      option2.value = roomKey;
      option2.textContent = roomName;
      discoveryRoomSelector.appendChild(option2);
    });
  }

  /**
   * Refresh room overview grid
   */
  async refreshRoomOverview() {
    console.log('[DashView] Refreshing room overview');
    
    const overviewGrid = this._shadowRoot.getElementById('room-overview-grid');
    if (!overviewGrid) return;
    
    this._setStatusMessage(this._shadowRoot.getElementById('room-overview-status'), 'Refreshing overview...', 'loading');
    
    try {
      // Get room configurations and entity counts
      const roomsData = await this._analyzeAllRooms();
      
      // Generate overview cards
      overviewGrid.innerHTML = roomsData.map(roomData => this._generateRoomOverviewCard(roomData)).join('');
      
      // Add click handlers
      overviewGrid.addEventListener('click', (e) => {
        // Handle configure button clicks specifically
        if (e.target.classList.contains('configure-btn')) {
          e.stopPropagation(); // Prevent room card click handler from firing
          const roomCard = e.target.closest('.room-overview-card');
          if (roomCard) {
            const roomKey = roomCard.dataset.roomKey;
            this._shadowRoot.getElementById('room-selector').value = roomKey;
            this.loadRoomConfiguration();
          }
          return;
        }
        
        // Handle room card clicks (but not configure button)
        const roomCard = e.target.closest('.room-overview-card');
        if (roomCard && !e.target.classList.contains('configure-btn')) {
          const roomKey = roomCard.dataset.roomKey;
          this._shadowRoot.getElementById('room-selector').value = roomKey;
          this.loadRoomConfiguration();
        }
      });
      
      this._setStatusMessage(this._shadowRoot.getElementById('room-overview-status'), `${roomsData.length} rooms analyzed`, 'success');
    } catch (error) {
      console.error('[DashView] Room overview refresh error:', error);
      this._setStatusMessage(this._shadowRoot.getElementById('room-overview-status'), 'Failed to refresh overview', 'error');
    }
  }

  /**
   * Analyze all rooms for completeness
   */
  async _analyzeAllRooms() {
    const rooms = this._adminLocalState.houseConfig?.rooms || {};
    const roomsData = [];
    
    for (const [roomKey, roomData] of Object.entries(rooms)) {
      const analysis = await this._analyzeRoomCompleteness(roomKey, roomData);
      roomsData.push({
        key: roomKey,
        name: roomData.friendly_name || roomKey,
        data: roomData,
        analysis
      });
    }
    
    return roomsData;
  }

  /**
   * Analyze room completeness and entity counts
   */
  async _analyzeRoomCompleteness(roomKey, roomData) {
    // Count configured entities
    const lights = roomData.lights?.length || 0;
    const covers = roomData.covers?.length || 0;
    const mediaPlayers = roomData.media_players?.length || 0;
    const headerEntities = roomData.header_entities?.length || 0;
    
    // Analyze potential entities from HA area
    const potentialEntities = await this._scanRoomForPotentialEntities(roomKey);
    
    // Calculate completeness score
    const totalConfigured = lights + covers + mediaPlayers + headerEntities;
    const totalPotential = potentialEntities.lights + potentialEntities.covers + 
                          potentialEntities.mediaPlayers + potentialEntities.sensors;
    
    const completeness = totalPotential > 0 ? Math.round((totalConfigured / totalPotential) * 100) : 100;
    
    return {
      lights,
      covers,
      mediaPlayers,
      headerEntities,
      totalConfigured,
      potentialEntities,
      completeness,
      issues: potentialEntities.issues || []
    };
  }

  /**
   * Generate room overview card HTML
   */
  _generateRoomOverviewCard(roomData) {
    const { key, name, analysis } = roomData;
    const { completeness, totalConfigured, potentialEntities, issues } = analysis;
    
    let statusClass = 'complete';
    let statusIcon = 'mdi:check-circle';
    let statusText = 'Complete';
    
    if (completeness < 50) {
      statusClass = 'incomplete';
      statusIcon = 'mdi:alert-circle';
      statusText = 'Needs Setup';
    } else if (completeness < 90) {
      statusClass = 'partial';
      statusIcon = 'mdi:progress-check';
      statusText = 'Partial';
    }
    
    return `
      <div class="room-overview-card ${statusClass}" data-room-key="${key}">
        <div class="room-card-header">
          <i class="mdi ${statusIcon}"></i>
          <h6>${name}</h6>
          <span class="completeness-badge">${completeness}%</span>
        </div>
        <div class="room-card-content">
          <div class="entity-summary">
            <div class="entity-count">
              <i class="mdi mdi-lightbulb"></i>
              <span>${analysis.lights}/${potentialEntities.lights} lights</span>
            </div>
            <div class="entity-count">
              <i class="mdi mdi-window-shutter"></i>
              <span>${analysis.covers}/${potentialEntities.covers} covers</span>
            </div>
            <div class="entity-count">
              <i class="mdi mdi-speaker"></i>
              <span>${analysis.mediaPlayers}/${potentialEntities.mediaPlayers} media</span>
            </div>
            <div class="entity-count">
              <i class="mdi mdi-motion-sensor"></i>
              <span>${analysis.headerEntities}/${potentialEntities.sensors} sensors</span>
            </div>
          </div>
          ${issues.length > 0 ? `
            <div class="room-issues">
              <i class="mdi mdi-alert"></i>
              <span>${issues.length} issue${issues.length !== 1 ? 's' : ''}</span>
            </div>
          ` : ''}
        </div>
        <div class="room-card-footer">
          <span class="status-text">${statusText}</span>
          <button class="configure-btn">Configure</button>
        </div>
      </div>
    `;
  }

  /**
   * Scan room for potential entities that could be configured
   */
  async _scanRoomForPotentialEntities(roomKey) {
    try {
      // Get entities by room from multiple domains and labels
      const [lightsData, coversData, mediaPlayersData, motionData, windowData, smokeData] = await Promise.all([
        fetch(`/api/dashview/config?type=entities_by_room&domain=light`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&domain=cover`).then(r => r.json()),
        fetch(`/api/dashview/config?type=available_media_players`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&label=motion`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&label=fenster`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&label=rauchmelder`).then(r => r.json())
      ]);
      
      const roomAreaData = lightsData[roomKey] || { entities: [] };
      const issues = [];
      
      // Count potential entities
      const lights = roomAreaData.entities?.filter(e => e.entity_id.startsWith('light.')).length || 0;
      const covers = coversData[roomKey]?.entities?.length || 0;
      
      // Media players need special handling as they're not grouped by room in the API
      const mediaPlayers = mediaPlayersData.filter(mp => {
        // Simple heuristic: check if media player name contains room name
        const roomName = this._adminLocalState.houseConfig?.rooms?.[roomKey]?.friendly_name || roomKey;
        return mp.friendly_name.toLowerCase().includes(roomName.toLowerCase());
      }).length;
      
      // Count sensors from different labels
      const motionSensors = motionData[roomKey]?.entities?.length || 0;
      const windowSensors = windowData[roomKey]?.entities?.length || 0;
      const smokeSensors = smokeData[roomKey]?.entities?.length || 0;
      const sensors = motionSensors + windowSensors + smokeSensors;
      
      // Check for missing label issues
      if (roomAreaData.entities?.length > 0 && sensors === 0) {
        issues.push('Entities found in HA area but none have DashView labels');
      }
      
      return { lights, covers, mediaPlayers, sensors, issues };
    } catch (error) {
      console.error('[DashView] Error scanning room for potential entities:', error);
      return { lights: 0, covers: 0, mediaPlayers: 0, sensors: 0, issues: ['Failed to scan room'] };
    }
  }

  /**
   * Load detailed configuration for selected room
   */
  async loadRoomConfiguration() {
    const roomSelector = this._shadowRoot.getElementById('room-selector');
    const roomDetailContainer = this._shadowRoot.getElementById('room-detail-container');
    
    if (!roomSelector?.value || !roomDetailContainer) return;
    
    const roomKey = roomSelector.value;
    const roomData = this._adminLocalState.houseConfig?.rooms?.[roomKey];
    
    if (!roomData) {
      roomDetailContainer.style.display = 'none';
      return;
    }
    
    try {
      // Show container
      roomDetailContainer.style.display = 'block';
      roomDetailContainer.innerHTML = '<div class="loading">Loading room configuration...</div>';
      
      // Get comprehensive room data
      const roomAnalysis = await this._analyzeRoomCompleteness(roomKey, roomData);
      const roomEntities = await this._getRoomEntitiesByType(roomKey);
      
      // Generate room configuration UI
      roomDetailContainer.innerHTML = this._generateRoomConfigurationUI(roomKey, roomData, roomAnalysis, roomEntities);
      
      // Add event listeners for room configuration
      this._addRoomConfigurationListeners(roomKey);
      
    } catch (error) {
      console.error('[DashView] Error loading room configuration:', error);
      roomDetailContainer.innerHTML = '<div class="error">Failed to load room configuration</div>';
    }
  }

  /**
   * Get room entities organized by type
   */
  async _getRoomEntitiesByType(roomKey) {
    try {
      const [lightsData, coversData, mediaPlayersData, motionData, windowData, smokeData, tempData, humidityData] = await Promise.all([
        fetch(`/api/dashview/config?type=entities_by_room&domain=light`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&domain=cover`).then(r => r.json()),
        fetch(`/api/dashview/config?type=available_media_players`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&label=motion`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&label=fenster`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&label=rauchmelder`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&label=temperatur`).then(r => r.json()),
        fetch(`/api/dashview/config?type=entities_by_room&label=humidity`).then(r => r.json())
      ]);
      
      const roomName = this._adminLocalState.houseConfig?.rooms?.[roomKey]?.friendly_name || roomKey;
      
      return {
        lights: lightsData[roomKey]?.entities || [],
        covers: coversData[roomKey]?.entities || [],
        mediaPlayers: mediaPlayersData.filter(mp => 
          mp.friendly_name.toLowerCase().includes(roomName.toLowerCase())
        ),
        motion: motionData[roomKey]?.entities || [],
        windows: windowData[roomKey]?.entities || [],
        smoke: smokeData[roomKey]?.entities || [],
        temperature: tempData[roomKey]?.entities || [],
        humidity: humidityData[roomKey]?.entities || []
      };
    } catch (error) {
      console.error('[DashView] Error getting room entities by type:', error);
      return { lights: [], covers: [], mediaPlayers: [], motion: [], windows: [], smoke: [], temperature: [], humidity: [] };
    }
  }

  /**
   * Generate room configuration UI
   */
  _generateRoomConfigurationUI(roomKey, roomData, analysis, entities) {
    const roomName = roomData.friendly_name || roomKey;
    
    return `
      <div class="room-config-header">
        <h5>Configure Room: ${roomName}</h5>
        <div class="room-config-stats">
          <span class="completeness">${analysis.completeness}% Complete</span>
          <span class="entity-count">${analysis.totalConfigured} entities configured</span>
        </div>
      </div>
      
      <div class="room-config-content">
        ${this._generateEntityTypeSection('Lights', 'lights', entities.lights, roomData.lights)}
        ${this._generateEntityTypeSection('Covers', 'covers', entities.covers, roomData.covers)}
        ${this._generateEntityTypeSection('Media Players', 'media_players', entities.mediaPlayers, roomData.media_players)}
        ${this._generateSensorSection(entities, roomData.header_entities)}
        
        <div class="room-config-actions">
          <button id="save-room-config" class="save-button" data-room-key="${roomKey}">Save Room Configuration</button>
          <button id="bulk-select-room" class="action-button" data-room-key="${roomKey}">Select All Suggested</button>
          <button id="clear-room-config" class="danger-button" data-room-key="${roomKey}">Clear All</button>
        </div>
      </div>
    `;
  }

  /**
   * Generate entity type section for room configuration
   */
  _generateEntityTypeSection(title, configKey, availableEntities, configuredEntities = []) {
    if (availableEntities.length === 0) {
      return `
        <div class="entity-type-section">
          <h6>${title} (0 found)</h6>
          <p class="no-entities">No ${title.toLowerCase()} found in this room's HA area.</p>
        </div>
      `;
    }
    
    return `
      <div class="entity-type-section">
        <h6>${title} (${availableEntities.length} found)</h6>
        <div class="entity-checkboxes">
          ${availableEntities.map(entity => {
            const isConfigured = configuredEntities.includes(entity.entity_id);
            return `
              <label class="entity-checkbox">
                <input type="checkbox" 
                       name="${configKey}" 
                       value="${entity.entity_id}"
                       ${isConfigured ? 'checked' : ''}>
                <span class="entity-name">${entity.name}</span>
                <span class="entity-id">${entity.entity_id}</span>
              </label>
            `;
          }).join('')}
        </div>
        <div class="section-actions">
          <button class="select-all-btn" data-section="${configKey}">Select All</button>
          <button class="clear-all-btn" data-section="${configKey}">Clear All</button>
        </div>
      </div>
    `;
  }

  /**
   * Generate sensor section with discovery status
   */
  _generateSensorSection(entities, configuredSensors = []) {
    const sensorTypes = [
      { key: 'motion', title: 'Motion Sensors', entities: entities.motion, icon: 'mdi:motion-sensor' },
      { key: 'windows', title: 'Window Sensors', entities: entities.windows, icon: 'mdi:window-open' },
      { key: 'smoke', title: 'Smoke Detectors', entities: entities.smoke, icon: 'mdi:smoke-detector' },
      { key: 'temperature', title: 'Temperature Sensors', entities: entities.temperature, icon: 'mdi:thermometer' },
      { key: 'humidity', title: 'Humidity Sensors', entities: entities.humidity, icon: 'mdi:water-percent' }
    ];
    
    return `
      <div class="entity-type-section sensors-section">
        <h6>Sensors & Header Entities</h6>
        ${sensorTypes.map(sensorType => {
          if (sensorType.entities.length === 0) {
            return `
              <div class="sensor-type-group missing">
                <div class="sensor-type-header">
                  <i class="${sensorType.icon}"></i>
                  <span>${sensorType.title}</span>
                  <span class="status-badge missing">0 found</span>
                </div>
                <div class="missing-label-help">
                  <span>No entities found. Add label "${this._getLabelForSensorType(sensorType.key)}" to entities in HA.</span>
                  <button class="help-btn" data-label="${this._getLabelForSensorType(sensorType.key)}">How to add labels</button>
                </div>
              </div>
            `;
          }
          
          return `
            <div class="sensor-type-group">
              <div class="sensor-type-header">
                <i class="${sensorType.icon}"></i>
                <span>${sensorType.title}</span>
                <span class="status-badge found">${sensorType.entities.length} found</span>
              </div>
              <div class="entity-checkboxes">
                ${sensorType.entities.map(entity => {
                  const isConfigured = configuredSensors.includes(entity.entity_id);
                  return `
                    <label class="entity-checkbox">
                      <input type="checkbox" 
                             name="header_entities" 
                             value="${entity.entity_id}"
                             ${isConfigured ? 'checked' : ''}>
                      <span class="entity-name">${entity.name}</span>
                      <span class="entity-id">${entity.entity_id}</span>
                    </label>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;
  }

  /**
   * Get DashView label for sensor type
   */
  _getLabelForSensorType(sensorType) {
    const labelMap = {
      'motion': 'motion',
      'windows': 'fenster',
      'smoke': 'rauchmelder',
      'temperature': 'temperatur',
      'humidity': 'humidity'
    };
    return labelMap[sensorType] || sensorType;
  }

  /**
   * Add event listeners for room configuration
   */
  _addRoomConfigurationListeners(roomKey) {
    const container = this._shadowRoot.getElementById('room-detail-container');
    if (!container) return;
    
    // Section-level select/clear all buttons
    container.addEventListener('click', (e) => {
      if (e.target.classList.contains('select-all-btn')) {
        const section = e.target.dataset.section;
        const checkboxes = container.querySelectorAll(`input[name="${section}"]`);
        checkboxes.forEach(cb => cb.checked = true);
      }
      
      if (e.target.classList.contains('clear-all-btn')) {
        const section = e.target.dataset.section;
        const checkboxes = container.querySelectorAll(`input[name="${section}"]`);
        checkboxes.forEach(cb => cb.checked = false);
      }
      
      if (e.target.id === 'save-room-config') {
        this._saveRoomConfiguration(roomKey);
      }
      
      if (e.target.id === 'bulk-select-room') {
        this._bulkSelectRoomEntities(roomKey);
      }
      
      if (e.target.id === 'clear-room-config') {
        this._clearRoomConfiguration(roomKey);
      }
      
      if (e.target.classList.contains('help-btn')) {
        const label = e.target.dataset.label;
        this._showLabelHelp(label);
      }
    });
  }

  /**
   * Save room configuration
   */
  async _saveRoomConfiguration(roomKey) {
    const container = this._shadowRoot.getElementById('room-detail-container');
    if (!container) return;
    
    try {
      // Collect selected entities by type
      const lights = Array.from(container.querySelectorAll('input[name="lights"]:checked')).map(cb => cb.value);
      const covers = Array.from(container.querySelectorAll('input[name="covers"]:checked')).map(cb => cb.value);
      const mediaPlayers = Array.from(container.querySelectorAll('input[name="media_players"]:checked')).map(cb => cb.value);
      const headerEntities = Array.from(container.querySelectorAll('input[name="header_entities"]:checked')).map(cb => cb.value);
      
      // Update local state
      const roomConfig = this._adminLocalState.houseConfig.rooms[roomKey];
      roomConfig.lights = lights;
      roomConfig.covers = covers;
      roomConfig.media_players = mediaPlayers;
      roomConfig.header_entities = headerEntities;
      
      // Save to backend
      const response = await fetch('/api/dashview/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'house',
          config: this._adminLocalState.houseConfig
        })
      });
      
      if (response.ok) {
        this._showToast(`Room "${roomConfig.friendly_name || roomKey}" configuration saved successfully`, 'success');
        await this.refreshRoomOverview(); // Refresh the overview
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      console.error('[DashView] Error saving room configuration:', error);
      this._showToast('Failed to save room configuration', 'error');
    }
  }

  /**
   * Bulk room setup with smart defaults
   */
  async bulkRoomSetup() {
    console.log('[DashView] Starting bulk room setup');
    
    try {
      let configuredRooms = 0;
      const rooms = this._adminLocalState.houseConfig?.rooms || {};
      
      for (const [roomKey, roomData] of Object.entries(rooms)) {
        const entities = await this._getRoomEntitiesByType(roomKey);
        
        // Apply smart defaults: select all found entities
        const hasChanges = this._applySmartDefaults(roomKey, roomData, entities);
        if (hasChanges) {
          configuredRooms++;
        }
      }
      
      if (configuredRooms > 0) {
        // Save all changes
        const response = await fetch('/api/dashview/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'house',
            config: this._adminLocalState.houseConfig
          })
        });
        
        if (response.ok) {
          this._showToast(`Bulk setup completed for ${configuredRooms} rooms`, 'success');
          await this.refreshRoomOverview();
        } else {
          throw new Error('Failed to save bulk configuration');
        }
      } else {
        this._showToast('No rooms needed configuration updates', 'info');
      }
    } catch (error) {
      console.error('[DashView] Bulk room setup error:', error);
      this._showToast('Bulk room setup failed', 'error');
    }
  }

  /**
   * Apply smart defaults to a room
   */
  _applySmartDefaults(roomKey, roomData, entities) {
    let hasChanges = false;
    
    // Lights: select all if none configured
    if (entities.lights.length > 0 && (!roomData.lights || roomData.lights.length === 0)) {
      roomData.lights = entities.lights.map(e => e.entity_id);
      hasChanges = true;
    }
    
    // Covers: select all if none configured
    if (entities.covers.length > 0 && (!roomData.covers || roomData.covers.length === 0)) {
      roomData.covers = entities.covers.map(e => e.entity_id);
      hasChanges = true;
    }
    
    // Media players: select all if none configured
    if (entities.mediaPlayers.length > 0 && (!roomData.media_players || roomData.media_players.length === 0)) {
      roomData.media_players = entities.mediaPlayers.map(e => e.entity_id);
      hasChanges = true;
    }
    
    // Sensors: prioritize motion, then windows, then smoke (smart selection)
    if (!roomData.header_entities || roomData.header_entities.length === 0) {
      const selectedSensors = [];
      
      // Add motion sensors (high priority)
      if (entities.motion.length > 0) {
        selectedSensors.push(...entities.motion.slice(0, 2).map(e => e.entity_id)); // Max 2 motion sensors
      }
      
      // Add window sensors (medium priority)
      if (entities.windows.length > 0 && selectedSensors.length < 3) {
        const remaining = 3 - selectedSensors.length;
        selectedSensors.push(...entities.windows.slice(0, remaining).map(e => e.entity_id));
      }
      
      // Add smoke detectors (low priority)
      if (entities.smoke.length > 0 && selectedSensors.length < 3) {
        const remaining = 3 - selectedSensors.length;
        selectedSensors.push(...entities.smoke.slice(0, remaining).map(e => e.entity_id));
      }
      
      if (selectedSensors.length > 0) {
        roomData.header_entities = selectedSensors;
        hasChanges = true;
      }
    }
    
    return hasChanges;
  }

  /**
   * Scan room for potential entities
   */
  async scanRoomEntities() {
    const discoveryRoomSelector = this._shadowRoot.getElementById('discovery-room-selector');
    if (!discoveryRoomSelector?.value) return;
    
    const roomKey = discoveryRoomSelector.value;
    
    if (roomKey === 'all') {
      return this.scanAllRooms();
    }
    
    await this._performRoomEntityScan(roomKey);
  }

  /**
   * Scan all rooms for potential entities
   */
  async scanAllRooms() {
    console.log('[DashView] Scanning all rooms for potential entities');
    
    const discoveryResults = this._shadowRoot.getElementById('discovery-results');
    const discoveryStatus = this._shadowRoot.getElementById('discovery-assistant-status');
    
    if (!discoveryResults) return;
    
    this._setStatusMessage(discoveryStatus, 'Scanning all rooms...', 'loading');
    
    try {
      const rooms = this._adminLocalState.houseConfig?.rooms || {};
      const scanResults = [];
      
      for (const [roomKey, roomData] of Object.entries(rooms)) {
        const result = await this._performRoomEntityScan(roomKey, false);
        if (result.suggestions.length > 0 || result.issues.length > 0) {
          scanResults.push(result);
        }
      }
      
      // Display consolidated results
      discoveryResults.innerHTML = this._generateDiscoveryResultsUI(scanResults, true);
      
      this._setStatusMessage(discoveryStatus, `Scanned ${Object.keys(rooms).length} rooms`, 'success');
    } catch (error) {
      console.error('[DashView] All rooms scan error:', error);
      this._setStatusMessage(discoveryStatus, 'Scan failed', 'error');
    }
  }

  /**
   * Perform entity scan for a specific room
   */
  async _performRoomEntityScan(roomKey, updateUI = true) {
    const roomData = this._adminLocalState.houseConfig?.rooms?.[roomKey];
    if (!roomData) return { suggestions: [], issues: [] };
    
    try {
      // Get all entities in the room's HA area
      const areaEntities = await this._getAreaEntities(roomKey);
      
      // Analyze entities for labeling suggestions
      const suggestions = this._analyzeEntitiesForSuggestions(areaEntities, roomData);
      const issues = this._identifyLabelingIssues(areaEntities, roomData);
      
      const result = {
        roomKey,
        roomName: roomData.friendly_name || roomKey,
        suggestions,
        issues,
        areaEntitiesCount: areaEntities.length
      };
      
      if (updateUI) {
        const discoveryResults = this._shadowRoot.getElementById('discovery-results');
        if (discoveryResults) {
          discoveryResults.innerHTML = this._generateDiscoveryResultsUI([result], false);
        }
      }
      
      return result;
    } catch (error) {
      console.error('[DashView] Room entity scan error:', error);
      return { suggestions: [], issues: [], roomKey, roomName: roomData.friendly_name || roomKey };
    }
  }

  /**
   * Get all entities in a room's HA area
   */
  async _getAreaEntities(roomKey) {
    try {
      // We need to get all entities for this area, not just specific domains
      // This requires a custom approach since the API filters by domain or label
      
      const allStates = await fetch('/api/states').then(r => r.json());
      const roomName = this._adminLocalState.houseConfig?.rooms?.[roomKey]?.friendly_name || roomKey;
      
      // For now, use a heuristic: entities with the room name in their entity_id or friendly_name
      const areaEntities = allStates.filter(state => {
        const entityId = state.entity_id.toLowerCase();
        const friendlyName = (state.attributes.friendly_name || '').toLowerCase();
        const roomNameLower = roomName.toLowerCase();
        
        return entityId.includes(roomNameLower) || friendlyName.includes(roomNameLower);
      });
      
      return areaEntities;
    } catch (error) {
      console.error('[DashView] Error getting area entities:', error);
      return [];
    }
  }

  /**
   * Analyze entities for DashView labeling suggestions
   */
  _analyzeEntitiesForSuggestions(entities, roomData) {
    const suggestions = [];
    
    entities.forEach(entity => {
      const suggestion = this._getSuggestionForEntity(entity);
      if (suggestion) {
        suggestions.push({
          entity_id: entity.entity_id,
          friendly_name: entity.attributes.friendly_name || entity.entity_id,
          current_labels: [], // Would need to fetch from entity registry
          suggested_label: suggestion.label,
          confidence: suggestion.confidence,
          reason: suggestion.reason
        });
      }
    });
    
    return suggestions;
  }

  /**
   * Get labeling suggestion for an entity
   */
  _getSuggestionForEntity(entity) {
    const entityId = entity.entity_id.toLowerCase();
    const friendlyName = (entity.attributes.friendly_name || '').toLowerCase();
    const deviceClass = entity.attributes.device_class;
    
    // Motion sensors
    if (entityId.includes('motion') || friendlyName.includes('motion') || 
        entityId.includes('bewegung') || friendlyName.includes('bewegung') ||
        deviceClass === 'motion') {
      return { label: 'motion', confidence: 'high', reason: 'Motion sensor detected' };
    }
    
    // Window sensors
    if (entityId.includes('window') || friendlyName.includes('window') ||
        entityId.includes('fenster') || friendlyName.includes('fenster') ||
        deviceClass === 'window') {
      return { label: 'fenster', confidence: 'high', reason: 'Window sensor detected' };
    }
    
    // Smoke detectors
    if (entityId.includes('smoke') || friendlyName.includes('smoke') ||
        entityId.includes('rauch') || friendlyName.includes('rauch') ||
        deviceClass === 'smoke') {
      return { label: 'rauchmelder', confidence: 'high', reason: 'Smoke detector detected' };
    }
    
    // Temperature sensors
    if (deviceClass === 'temperature' || entityId.includes('temp') || 
        friendlyName.includes('temp') || entityId.includes('temperatur')) {
      return { label: 'temperatur', confidence: 'medium', reason: 'Temperature sensor detected' };
    }
    
    // Humidity sensors
    if (deviceClass === 'humidity' || entityId.includes('humidity') ||
        entityId.includes('feuchte') || friendlyName.includes('humidity')) {
      return { label: 'humidity', confidence: 'medium', reason: 'Humidity sensor detected' };
    }
    
    return null;
  }

  /**
   * Identify labeling issues
   */
  _identifyLabelingIssues(entities, roomData) {
    const issues = [];
    
    // Check for entities that look like sensors but aren't configured
    const sensorLikeEntities = entities.filter(entity => {
      const entityId = entity.entity_id;
      return entityId.startsWith('binary_sensor.') || entityId.startsWith('sensor.');
    });
    
    const configuredEntities = [
      ...(roomData.lights || []),
      ...(roomData.covers || []),
      ...(roomData.media_players || []),
      ...(roomData.header_entities || [])
    ];
    
    const unconfiguredSensors = sensorLikeEntities.filter(entity => 
      !configuredEntities.includes(entity.entity_id)
    );
    
    if (unconfiguredSensors.length > 0) {
      issues.push({
        type: 'unconfigured_sensors',
        count: unconfiguredSensors.length,
        message: `${unconfiguredSensors.length} sensor(s) found but not configured in DashView`,
        entities: unconfiguredSensors.slice(0, 5) // Show first 5
      });
    }
    
    return issues;
  }

  /**
   * Generate discovery results UI
   */
  _generateDiscoveryResultsUI(scanResults, isMultiRoom) {
    if (scanResults.length === 0) {
      return '<div class="no-results">No labeling suggestions or issues found.</div>';
    }
    
    return `
      <div class="discovery-results-container">
        <h6>Discovery Results</h6>
        ${scanResults.map(result => this._generateRoomDiscoverySection(result)).join('')}
        
        ${scanResults.some(r => r.suggestions.length > 0) ? `
          <div class="discovery-actions">
            <button id="apply-all-suggestions" class="save-button">Apply All Suggestions</button>
            <button id="export-suggestions" class="action-button">Export Suggestions</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Generate room discovery section
   */
  _generateRoomDiscoverySection(result) {
    const { roomName, suggestions, issues } = result;
    
    return `
      <div class="room-discovery-section">
        <div class="room-discovery-header">
          <h7>${roomName}</h7>
          <span class="discovery-summary">
            ${suggestions.length} suggestions, ${issues.length} issues
          </span>
        </div>
        
        ${suggestions.length > 0 ? `
          <div class="suggestions-section">
            <h8>Labeling Suggestions:</h8>
            ${suggestions.map(suggestion => `
              <div class="suggestion-item">
                <div class="suggestion-entity">
                  <span class="entity-name">${suggestion.friendly_name}</span>
                  <span class="entity-id">${suggestion.entity_id}</span>
                </div>
                <div class="suggestion-label">
                  <span class="suggested-label">${suggestion.suggested_label}</span>
                  <span class="confidence ${suggestion.confidence}">${suggestion.confidence} confidence</span>
                </div>
                <div class="suggestion-actions">
                  <button class="apply-suggestion-btn" 
                          data-entity="${suggestion.entity_id}" 
                          data-label="${suggestion.suggested_label}">
                    Apply Label
                  </button>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}
        
        ${issues.length > 0 ? `
          <div class="issues-section">
            <h8>Issues Found:</h8>
            ${issues.map(issue => `
              <div class="issue-item">
                <i class="mdi mdi-alert"></i>
                <span>${issue.message}</span>
              </div>
            `).join('')}
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Bulk select all entities for a room
   */
  _bulkSelectRoomEntities(roomKey) {
    const container = this._shadowRoot.getElementById('room-detail-container');
    if (!container) return;
    
    // Select all checkboxes
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
    
    this._showToast('All available entities selected for room', 'info');
  }

  /**
   * Clear all room configuration
   */
  _clearRoomConfiguration(roomKey) {
    if (!confirm('Are you sure you want to clear all entity assignments for this room?')) {
      return;
    }
    
    const container = this._shadowRoot.getElementById('room-detail-container');
    if (!container) return;
    
    // Uncheck all checkboxes
    const checkboxes = container.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = false);
    
    this._showToast('Room configuration cleared', 'info');
  }

  /**
   * Show label help modal
   */
  _showLabelHelp(label) {
    const helpContent = this._getLabelHelpContent(label);
    
    // Create modal (simplified for now)
    this._showToast(`To add "${label}" label: Go to HA Settings > Devices & Services > Entities, select your entity, click "Labels" and add "${label}"`, 'info');
  }

  /**
   * Get help content for a specific label
   */
  _getLabelHelpContent(label) {
    const labelGuides = {
      'motion': 'Add the "motion" label to binary sensors that detect movement.',
      'fenster': 'Add the "fenster" label to binary sensors that detect window open/close state.',
      'rauchmelder': 'Add the "rauchmelder" label to binary sensors that detect smoke.',
      'temperatur': 'Add the "temperatur" label to sensors that measure temperature.',
      'humidity': 'Add the "humidity" label to sensors that measure humidity/moisture.'
    };
    
    return labelGuides[label] || `Add the "${label}" label to appropriate entities in Home Assistant.`;
  }

  /**
   * Cleanup validation instances
   */
  destroy() {
    // Clean up all validation instances
    for (const validation of this._validationInstances.values()) {
      validation.destroy();
    }
    this._validationInstances.clear();

    // Clean up validation utilities
    if (this._validationUtils) {
      this._validationUtils.destroy();
    }
  }

  // Gesture Settings Methods
  
  /**
   * Initialize range input listeners for gesture settings
   */
  _initializeGestureRangeInputs() {
    const rangeInputs = [
      { id: 'swipe-threshold', valueId: 'swipe-threshold-value', suffix: 'px' },
      { id: 'swipe-velocity', valueId: 'swipe-velocity-value', suffix: '' },
      { id: 'pinch-sensitivity', valueId: 'pinch-sensitivity-value', suffix: 'x' },
      { id: 'menu-timeout', valueId: 'menu-timeout-value', suffix: 's' },
      { id: 'long-press-duration', valueId: 'long-press-duration-value', suffix: 'ms' }
    ];

    rangeInputs.forEach(({ id, valueId, suffix }) => {
      const input = this._shadowRoot.getElementById(id);
      const valueDisplay = this._shadowRoot.getElementById(valueId);
      
      if (input && valueDisplay) {
        input.addEventListener('input', (e) => {
          valueDisplay.textContent = e.target.value + suffix;
        });
      }
    });
  }

  /**
   * Load gesture settings from configuration
   */
  async loadGestureSettings() {
    const statusEl = this._shadowRoot.getElementById('gesture-settings-status');
    this._setStatusMessage(statusEl, 'Loading gesture settings...', 'loading');
    
    try {
      const config = await this._hass.callApi('GET', 'dashview/config?type=gesture_settings') || {};
      this._populateGestureSettings(config);
      this._setStatusMessage(statusEl, '✓ Loaded', 'success');
    } catch (e) {
      console.warn('[AdminManager] Could not load gesture settings:', e);
      this._populateGestureSettings({}); // Use defaults
      this._setStatusMessage(statusEl, '✓ Using defaults', 'success');
    }
  }

  /**
   * Save gesture settings to configuration
   */
  async saveGestureSettings() {
    const statusEl = this._shadowRoot.getElementById('gesture-settings-status');
    this._setStatusMessage(statusEl, 'Saving gesture settings...', 'loading');
    
    try {
      const settings = this._collectGestureSettings();
      await this._hass.callApi('POST', 'dashview/config', {
        type: 'gesture_settings',
        data: settings
      });
      this._setStatusMessage(statusEl, '✓ Saved!', 'success');
      
      // Apply settings to existing gesture managers
      this._applyGestureSettings(settings);
      
    } catch (e) {
      this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  /**
   * Reset gesture settings to defaults
   */
  resetGestureSettings() {
    const defaults = this._getDefaultGestureSettings();
    this._populateGestureSettings(defaults);
    
    const statusEl = this._shadowRoot.getElementById('gesture-settings-status');
    this._setStatusMessage(statusEl, 'Reset to defaults', 'success');
  }

  /**
   * Test haptic feedback
   */
  testHapticFeedback() {
    if (!navigator.vibrate) {
      const statusEl = this._shadowRoot.getElementById('gesture-settings-status');
      this._setStatusMessage(statusEl, 'Haptic feedback not supported on this device', 'error');
      return;
    }

    const intensity = this._shadowRoot.getElementById('haptic-intensity').value;
    const patterns = {
      light: [10],
      medium: [20],
      strong: [50]
    };

    navigator.vibrate(patterns[intensity] || patterns.medium);
    
    const statusEl = this._shadowRoot.getElementById('gesture-settings-status');
    this._setStatusMessage(statusEl, `Haptic test (${intensity}) triggered`, 'success');
  }

  /**
   * Populate gesture settings form with values
   */
  _populateGestureSettings(settings) {
    const defaults = this._getDefaultGestureSettings();
    const config = { ...defaults, ...settings };

    // Range inputs
    const rangeInputs = [
      { id: 'swipe-threshold', key: 'swipeThreshold', valueId: 'swipe-threshold-value', suffix: 'px' },
      { id: 'swipe-velocity', key: 'swipeVelocityThreshold', valueId: 'swipe-velocity-value', suffix: '' },
      { id: 'pinch-sensitivity', key: 'pinchThreshold', valueId: 'pinch-sensitivity-value', suffix: 'x' },
      { id: 'menu-timeout', key: 'menuTimeout', valueId: 'menu-timeout-value', suffix: 's', scale: 1000 },
      { id: 'long-press-duration', key: 'longTapDuration', valueId: 'long-press-duration-value', suffix: 'ms' }
    ];

    rangeInputs.forEach(({ id, key, valueId, suffix, scale = 1 }) => {
      const input = this._shadowRoot.getElementById(id);
      const valueDisplay = this._shadowRoot.getElementById(valueId);
      
      if (input && valueDisplay) {
        const value = config[key] / scale;
        input.value = value;
        valueDisplay.textContent = value + suffix;
      }
    });

    // Checkbox inputs
    const checkboxes = [
      { id: 'haptic-enabled', key: 'enableHapticFeedback' },
      { id: 'floor-swipe-enabled', key: 'enableFloorSwipe' },
      { id: 'room-swipe-enabled', key: 'enableRoomSwipe' },
      { id: 'pinch-overview-enabled', key: 'enablePinchOverview' },
      { id: 'context-menus-enabled', key: 'enableContextMenus' },
      { id: 'enhanced-touch-targets', key: 'enableEnhancedTouchTargets' },
      { id: 'gesture-hints', key: 'enableGestureHints' },
      { id: 'gesture-animations', key: 'enableGestureAnimations' }
    ];

    checkboxes.forEach(({ id, key }) => {
      const checkbox = this._shadowRoot.getElementById(id);
      if (checkbox) {
        checkbox.checked = config[key];
      }
    });

    // Select inputs
    const selects = [
      { id: 'haptic-intensity', key: 'hapticIntensity' }
    ];

    selects.forEach(({ id, key }) => {
      const select = this._shadowRoot.getElementById(id);
      if (select) {
        select.value = config[key];
      }
    });
  }

  /**
   * Collect gesture settings from form
   */
  _collectGestureSettings() {
    return {
      swipeThreshold: parseInt(this._shadowRoot.getElementById('swipe-threshold').value),
      swipeVelocityThreshold: parseFloat(this._shadowRoot.getElementById('swipe-velocity').value),
      pinchThreshold: parseFloat(this._shadowRoot.getElementById('pinch-sensitivity').value),
      menuTimeout: parseInt(this._shadowRoot.getElementById('menu-timeout').value) * 1000,
      longTapDuration: parseInt(this._shadowRoot.getElementById('long-press-duration').value),
      enableHapticFeedback: this._shadowRoot.getElementById('haptic-enabled').checked,
      hapticIntensity: this._shadowRoot.getElementById('haptic-intensity').value,
      enableFloorSwipe: this._shadowRoot.getElementById('floor-swipe-enabled').checked,
      enableRoomSwipe: this._shadowRoot.getElementById('room-swipe-enabled').checked,
      enablePinchOverview: this._shadowRoot.getElementById('pinch-overview-enabled').checked,
      enableContextMenus: this._shadowRoot.getElementById('context-menus-enabled').checked,
      enableEnhancedTouchTargets: this._shadowRoot.getElementById('enhanced-touch-targets').checked,
      enableGestureHints: this._shadowRoot.getElementById('gesture-hints').checked,
      enableGestureAnimations: this._shadowRoot.getElementById('gesture-animations').checked
    };
  }

  /**
   * Get default gesture settings
   */
  _getDefaultGestureSettings() {
    return {
      swipeThreshold: 50,
      swipeVelocityThreshold: 0.3,
      pinchThreshold: 1.2,
      menuTimeout: 5000,
      longTapDuration: 500,
      enableHapticFeedback: true,
      hapticIntensity: 'medium',
      enableFloorSwipe: true,
      enableRoomSwipe: true,
      enablePinchOverview: true,
      enableContextMenus: true,
      enableEnhancedTouchTargets: true,
      enableGestureHints: true,
      enableGestureAnimations: true
    };
  }

  /**
   * Apply gesture settings to existing gesture managers
   */
  _applyGestureSettings(settings) {
    // Apply to FloorManager's gesture managers
    const floorManager = this._panel._floorManager;
    if (floorManager) {
      if (floorManager._floorGestureManager) {
        floorManager._floorGestureManager.swipeThreshold = settings.swipeThreshold;
        floorManager._floorGestureManager.swipeVelocityThreshold = settings.swipeVelocityThreshold;
        floorManager._floorGestureManager.pinchThreshold = settings.pinchThreshold;
        floorManager._floorGestureManager.enableHapticFeedback = settings.enableHapticFeedback;
      }
      
      if (floorManager._contextMenuManager) {
        floorManager._contextMenuManager.enableHapticFeedback = settings.enableHapticFeedback;
        floorManager._contextMenuManager.menuTimeout = settings.menuTimeout;
      }
      
      if (floorManager._gestureDetector) {
        floorManager._gestureDetector.longTapDuration = settings.longTapDuration;
      }
    }
    
    console.log('[AdminManager] Applied gesture settings to active managers');
  }

}
