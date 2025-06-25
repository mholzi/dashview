// custom_components/dashview/www/lib/ui/AdminManager.js

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
  }

  setHass(hass) {
    this._hass = hass;
  }

  loadTabContent(targetId) {
    const loadActionMap = {
      'house-setup-tab': () => this.loadHouseSetupTab(),
      'integrations-tab': () => this.loadDwdConfig(),
      'room-maintenance-tab': () => this.loadRoomMaintenance(),
      'media-player-maintenance-tab': () => this.loadRoomMediaPlayerMaintenance(),
      'weather-tab': () => this.loadWeatherEntityConfiguration(),
      'floor-layouts-tab': () => this.loadFloorLayoutEditor(),
      'motion-setup-tab': () => this.loadGenericSensorSetup(this._panel._entityLabels.MOTION, 'motion-setup-status', 'motion-sensors-by-room', 'Motion Sensors'),
      'window-setup-tab': () => this.loadGenericSensorSetup(this._panel._entityLabels.WINDOW, 'window-setup-status', 'window-sensors-by-room', 'Window Sensors'),
      'smoke-detector-setup-tab': () => this.loadGenericSensorSetup(this._panel._entityLabels.SMOKE, 'smoke-detector-setup-status', 'smoke-detector-sensors-by-room', 'Smoke Detectors'),
      'vibration-setup-tab': () => this.loadGenericSensorSetup(this._panel._entityLabels.VIBRATION, 'vibration-setup-status', 'vibration-sensors-by-room', 'Vibration Sensors'),
      'cover-setup-tab': () => this.loadGenericSensorSetup('cover', 'cover-setup-status', 'covers-by-room', 'Covers', true),
      'light-setup-tab': () => this.loadGenericSensorSetup('light', 'light-setup-status', 'lights-by-room', 'Lights', true),
      'temperatur-setup-tab': () => {
        this.loadGenericSensorSetup(this._panel._entityLabels.TEMPERATUR, 'temperatur-setup-status', 'temperatur-sensors-by-room', 'Temperature Sensors');
        this.loadThresholdsConfig();
      },
      'humidity-setup-tab': () => this.loadGenericSensorSetup(this._panel._entityLabels.HUMIDITY, 'humidity-setup-status', 'humidity-sensors-by-room', 'Humidity Sensors'),
    };

    if (loadActionMap[targetId]) {
      setTimeout(() => loadActionMap[targetId](), 50);
    }
  }

  initializeAdminEventListeners() {
    this._shadowRoot.addEventListener('click', (e) => {
        const buttonActions = {
            '#reload-house-config': () => this.loadHouseSetupTab(),
            '#save-house-config': () => this.saveHouseConfiguration(),
            '#save-weather-entity': () => this.saveWeatherEntityConfiguration(),
            '#reload-weather-config': () => this.loadWeatherEntityConfiguration(),
            '#save-motion-sensor-config': () => this.saveGenericSensorConfig(this._panel._entityLabels.MOTION, 'motion-setup-status', 'motion-sensors-by-room'),
            '#reload-motion-sensors': () => this.loadTabContent('motion-setup-tab'),
            '#save-cover-config': () => this.saveGenericSensorConfig('cover', 'cover-setup-status', 'covers-by-room', true),
            '#reload-cover-entities': () => this.loadTabContent('cover-setup-tab'),
            '#save-light-config': () => this.saveGenericSensorConfig('light', 'light-setup-status', 'lights-by-room', true),
            '#reload-light-entities': () => this.loadTabContent('light-setup-tab'),
            '#save-window-sensor-config': () => this.saveGenericSensorConfig(this._panel._entityLabels.WINDOW, 'window-setup-status', 'window-sensors-by-room'),
            '#reload-window-sensors': () => this.loadTabContent('window-setup-tab'),
            '#save-smoke-detector-sensor-config': () => this.saveGenericSensorConfig(this._panel._entityLabels.SMOKE, 'smoke-detector-setup-status', 'smoke-detector-sensors-by-room'),
            '#reload-smoke-detector-sensors': () => this.loadTabContent('smoke-detector-setup-tab'),
            '#save-vibration-sensor-config': () => this.saveGenericSensorConfig(this._panel._entityLabels.VIBRATION, 'vibration-setup-status', 'vibration-sensors-by-room'),
            '#reload-vibration-sensors': () => this.loadTabContent('vibration-setup-tab'),
            '#save-temperatur-sensor-config': () => this.saveGenericSensorConfig(this._panel._entityLabels.TEMPERATUR, 'temperatur-setup-status', 'temperatur-sensors-by-room'),
            '#reload-temperatur-sensors': () => this.loadTabContent('temperatur-setup-tab'),
            '#save-humidity-sensor-config': () => this.saveGenericSensorConfig(this._panel._entityLabels.HUMIDITY, 'humidity-setup-status', 'humidity-sensors-by-room'),
            '#reload-humidity-sensors': () => this.loadTabContent('humidity-setup-tab'),
            '#reload-room-maintenance': () => this.loadRoomMaintenance(),
            '#reload-media-players': () => this.loadRoomMediaPlayerMaintenance(),
            '#save-all-media-assignments': () => this.saveAllMediaPlayerAssignments(),
            '#save-dwd-config': () => this.saveDwdConfig(),
            '#reload-dwd-config': () => this.loadDwdConfig(),
            '#save-thresholds-config': () => this.saveThresholdsConfig(),
            '#save-floor-layouts': () => this.saveFloorLayouts(),
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
    });
  }

  // --- HELPER METHODS ---
  _setStatusMessage(element, message, type) {
    if (!element) return;
    element.textContent = message;
    element.className = 'status-display';
    if (type) element.classList.add(type);
  }

  async _saveConfigViaAPI(configType, configData) {
    await this._hass.callApi('POST', 'dashview/config', { type: configType, config: configData });
    console.log(`[DashView] ${configType} configuration saved.`);
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
  
  // --- FULLY IMPLEMENTED METHODS ---
  async loadWeatherEntityConfiguration() {
    const selector = this._shadowRoot.getElementById('weather-entity-selector');
    const statusEl = this._shadowRoot.getElementById('weather-status');
    if (!selector) return;

    if (!this._hass || !this._hass.states) {
        this._setStatusMessage(statusEl, 'Home Assistant data not yet available. Please wait a moment and click Reload.', 'loading');
        selector.innerHTML = '<option>Loading...</option>';
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
        this._updateAdminSummary();
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
        this._updateAdminSummary();
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  async loadGenericSensorSetup(entityIdentifier, statusElementId, containerElementId, headerText, useDomain = false) {
    const statusElement = this._shadowRoot.getElementById(statusElementId);
    const container = this._shadowRoot.getElementById(containerElementId);
    this._setStatusMessage(statusElement, `Loading ${headerText}...`, 'loading');

    try {
        const queryType = useDomain ? 'domain' : 'label';
        const [entitiesByRoom, houseConfig] = await Promise.all([
            this._hass.callApi('GET', `dashview/config?type=entities_by_room&${queryType}=${entityIdentifier}`),
            this._hass.callApi('GET', 'dashview/config?type=house')
        ]);
        
        this._adminLocalState.houseConfig = houseConfig || { rooms: {} };
        this._renderGenericSensorSetup(container, entitiesByRoom, houseConfig, entityIdentifier);
        this._setStatusMessage(statusElement, '✓ Loaded', 'success');
    } catch (error) {
        this._setStatusMessage(statusElement, `✗ Error: ${error.message}`, 'error');
        container.innerHTML = `<div class="placeholder"><p>Failed to load entities. Check console.</p></div>`;
    }
  }
  _initializeLayoutEditorEventListeners() {
    const container = this._shadowRoot.getElementById('floor-layout-editor-container');
    if (!container) return;

    container.addEventListener('change', (e) => {
      if (e.target.classList.contains('layout-type-selector')) {
        const slot = e.target.closest('.layout-slot');
        const entitySelector = slot.querySelector('.entity-selector');
        if (e.target.value === 'pinned') {
          entitySelector.style.display = 'block';
        } else {
          entitySelector.style.display = 'none';
        }
      }
    });
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
  }

  _isEntityInRoom(entityId, entityType, houseConfig) {
    if (!houseConfig?.rooms) return false;
    const isDomainBased = ['light', 'cover'].includes(entityType);
    const checkFunc = isDomainBased 
      ? (room, id) => room[entityType + 's']?.includes(id)
      : (room, id, type) => room.header_entities?.some(he => he.entity === id && he.entity_type === type);
      
    return Object.values(houseConfig.rooms).some(room => checkFunc(room, entityId, entityType));
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

  async loadDwdConfig() {
    const inputEl = this._shadowRoot.getElementById('dwd-sensor-entity');
    const statusEl = this._shadowRoot.getElementById('dwd-config-status');
    const integrationsConfig = await this._hass.callApi('GET', 'dashview/config?type=integrations');
    inputEl.value = integrationsConfig?.dwd_sensor || '';
    this._setStatusMessage(statusEl, '✓ Loaded', 'success');
  }

  async saveDwdConfig() {
    const inputEl = this._shadowRoot.getElementById('dwd-sensor-entity');
    const statusEl = this._shadowRoot.getElementById('dwd-config-status');
    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    try {
        await this._saveConfigViaAPI('integrations', { dwd_sensor: inputEl.value });
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
        const floors = houseConfig.floors || {};
        const layouts = houseConfig.floor_layouts || {};
        
        let editorHTML = '';
        for (const [floorId, floorConfig] of Object.entries(floors)) {
            const floorLayout = layouts[floorId] || [];
            const allEntities = this._getEntitiesForFloor(floorId);
            editorHTML += `<div class="config-section"><h5>${floorConfig.friendly_name || floorId}</h5><div class="floor-layout-grid" data-floor-id="${floorId}">`;
            for (const slot of floorLayout) {
                editorHTML += this._renderLayoutSlotEditor(slot, allEntities);
            }
            editorHTML += `</div></div>`;
        }
        container.innerHTML = editorHTML;
        this._setStatusMessage(statusEl, '✓ Loaded', 'success');
        this._initializeLayoutEditorEventListeners(); // Add this line
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }

  _renderLayoutSlotEditor(slot, entities) {
    const { grid_area, type, entity_id } = slot;
    const isBigSlot = grid_area.includes('-big');
    const isPinned = type === 'pinned';
    const entityOptions = entities.map(entity => `<option value="${entity.entity_id}" ${entity.entity_id === entity_id ? 'selected' : ''}>${entity.name} (${entity.entity_id})</option>`).join('');
    let typeOptions = `<option value="auto" ${type === 'auto' ? 'selected' : ''}>Automatic</option><option value="pinned" ${type === 'pinned' ? 'selected' : ''}>Pinned</option><option value="empty" ${type === 'empty' ? 'selected' : ''}>Empty</option>`;
    if (isBigSlot) typeOptions = `<option value="room_swipe_card" ${type === 'room_swipe_card' ? 'selected' : ''}>Room Swiper</option>${typeOptions}`;

    return `<div class="layout-slot" data-grid-area="${grid_area}" style="grid-area: ${grid_area};"><div class="slot-name">${grid_area}</div><div class="slot-config"><select class="layout-type-selector">${typeOptions}</select><select class="entity-selector" style="display: ${isPinned ? 'block' : 'none'};"><option value="">-- Select --</option>${entityOptions}</select></div></div>`;
  }

  async saveFloorLayouts() {
    const statusEl = this._shadowRoot.getElementById('floor-layouts-status');
    this._setStatusMessage(statusEl, 'Saving...', 'loading');
    const newLayouts = {};
    this._shadowRoot.querySelectorAll('.floor-layout-grid').forEach(grid => {
        const floorId = grid.dataset.floorId;
        newLayouts[floorId] = [];
        grid.querySelectorAll('.layout-slot').forEach(slot => {
            const gridArea = slot.dataset.gridArea;
            const type = slot.querySelector('.layout-type-selector').value;
            const entityId = slot.querySelector('.entity-selector').value;
            newLayouts[floorId].push({ grid_area: gridArea, type: type, entity_id: type === 'pinned' ? entityId : null });
        });
    });
    this._adminLocalState.houseConfig.floor_layouts = newLayouts;
    try {
        await this._saveConfigViaAPI('house', this._adminLocalState.houseConfig);
        this._setStatusMessage(statusEl, '✓ Saved!', 'success');
    } catch (e) {
        this._setStatusMessage(statusEl, `✗ Error: ${e.message}`, 'error');
    }
  }
// --- Room Maintenance ---
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

// --- Media Player Maintenance ---
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
      item.className = 'floor-item';
      item.innerHTML = `<div class="floor-info"><div class="floor-name">${player.friendly_name}</div><div class="floor-details">${player.entity_id}</div></div><div class="setting-row"><select class="dropdown-selector player-room-selector" data-entity-id="${player.entity_id}"><option value="">-- Unassigned --</option>${roomOptions}</select></div>`;
      item.querySelector('.player-room-selector').value = assignedRoomKey;
      container.appendChild(item);
  });
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

// --- Admin Summary ---
_updateAdminSummary() {
  const container = this._shadowRoot.getElementById('config-summary-container');
  if (!container) return;
  const houseConfig = this._adminLocalState.houseConfig || {};
  const floors = houseConfig.floors || {};
  const rooms = houseConfig.rooms || {};
  const stats = { Floors: Object.keys(floors).length, Rooms: Object.keys(rooms).length };
  
  let lightCount = 0, coverCount = 0, mediaPlayerCount = 0, headerEntityCount = 0;
  Object.values(rooms).forEach(room => {
      lightCount += room.lights?.length || 0;
      coverCount += room.covers?.length || 0;
      mediaPlayerCount += room.media_players?.length || 0;
      headerEntityCount += room.header_entities?.length || 0;
  });
  stats['Lights'] = lightCount;
  stats['Covers'] = coverCount;
  stats['Media Players'] = mediaPlayerCount;
  stats['Header Entities'] = headerEntityCount;

  let summaryHTML = '';
  Object.entries(stats).forEach(([name, count]) => {
      summaryHTML += `<div class="summary-item"><strong>${name}:</strong><span>${count}</span></div>`;
  });
  container.innerHTML = summaryHTML;
}

}
