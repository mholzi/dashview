// custom_components/dashview/www/lib/ui/FloorManager.js

export class FloorManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._houseConfig = panel._houseConfig;
    this._shadowRoot = panel.shadowRoot;
  }

  setHass(hass) {
    this._hass = hass;
  }

  initializeFloorTabs() {
    const container = this._shadowRoot.getElementById('floor-tabs-container');
    if (!container) return;

    container.innerHTML = ''; 

    const floors = Object.entries(this._houseConfig.floors || {}).sort(([, a], [, b]) => (a.level || 0) - (b.level || 0));
    if (floors.length === 0) {
      container.innerHTML = '<div class="placeholder">No floors are configured.</div>';
      return;
    }

    const header = document.createElement('div');
    header.className = 'floor-tabs-header';
    header.innerHTML = `
      <div class="floor-tabs-title">Räume</div>
      <div class="floor-tab-buttons-container"></div>
    `;
    const contentArea = document.createElement('div');
    contentArea.className = 'floor-content-area';
    container.append(header, contentArea);
    
    const buttonsContainer = header.querySelector('.floor-tab-buttons-container');

    const switchTab = (floorId) => {
        buttonsContainer.querySelectorAll('.floor-tab-button').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.targetFloor === floorId);
        });
        contentArea.querySelectorAll('.floor-content').forEach(content => {
            content.style.display = content.id === `floor-content-${floorId}` ? 'block' : 'none';
        });
        this.renderFloorLayout(floorId);
    };

    floors.forEach(([floorId, floorConfig], index) => {
      const button = document.createElement('button');
      button.className = `floor-tab-button ${index === 0 ? 'active' : ''}`;
      button.dataset.targetFloor = floorId;
      button.innerHTML = `<i class="mdi ${this._panel._processIconName(floorConfig.icon)}"></i>`;
      button.addEventListener('click', () => switchTab(floorId));
      buttonsContainer.appendChild(button);

      const floorContent = document.createElement('div');
      floorContent.className = 'floor-content';
      floorContent.id = `floor-content-${floorId}`;
      floorContent.style.display = index === 0 ? 'block' : 'none';
      floorContent.innerHTML = `<div class="room-grid" id="room-grid-${floorId}"></div>`;
      contentArea.appendChild(floorContent);
    });

    if (floors.length > 0) {
      this.renderFloorLayout(floors[0][0]);
    }
  }

  renderFloorLayout(floorId) {
    const gridContainer = this._shadowRoot.getElementById(`room-grid-${floorId}`);
    if (!gridContainer) return;

    const layoutConfig = this._houseConfig.floor_layouts?.[floorId] || [];
    if (layoutConfig.length === 0) {
        gridContainer.innerHTML = '<div class="placeholder">No layout defined for this floor.</div>';
        return;
    }

    const allEntitiesOnFloor = this._getEntitiesForFloor(floorId);
    const usageStats = this._houseConfig.entity_usage_stats || {};
    
    const rankedEntities = allEntitiesOnFloor
        .map(e => ({ ...e, count: usageStats[e.entity_id] || 0 }))
        .sort((a, b) => b.count - a.count);

    const pinnedEntities = new Set(layoutConfig.filter(s => s.type === 'pinned').map(s => s.entity_id));
    let autoPlacementQueue = rankedEntities.filter(e => !pinnedEntities.has(e.entity_id));

    let gridHTML = '';
    for (const slot of layoutConfig) {
        if (slot.type === 'empty') {
            gridHTML += `<div style="grid-area: ${slot.grid_area};"></div>`;
            continue;
        }
        
        let cardHTML = `<div class="placeholder-card ${slot.grid_area.includes('-big') ? 'placeholder-big' : 'placeholder-small'}" style="grid-area: ${slot.grid_area};"></div>`;
        
        const isBigSlot = slot.grid_area.includes('-big');
        const entityProvider = (type) => {
            if (type === 'pinned' && slot.entity_id) return slot.entity_id;
            if (type === 'auto' && autoPlacementQueue.length > 0) return autoPlacementQueue.shift().entity_id;
            return null;
        };

        if (isBigSlot) {
            if (slot.type === 'room_swipe_card') {
                cardHTML = this._renderRoomSwipeCard(floorId, slot.grid_area);
            } else {
                const entityId = entityProvider(slot.type);
                if (entityId) cardHTML = this._generateBigSensorCardHTML(entityId, slot.grid_area);
            }
        } else {
            const entityId = entityProvider(slot.type);
            if (entityId) cardHTML = this._generateSmallSensorCardHTML(entityId, slot.grid_area);
        }
        gridHTML += cardHTML;
    }

    gridContainer.innerHTML = gridHTML;
    
    gridContainer.querySelectorAll('.sensor-small-card, .sensor-big-card, .room-card').forEach(card => this._initializeCardListeners(card));
  }
  
  _getEntitiesForFloor(floorId) {
    const entities = new Set();
    const roomsOnFloor = Object.values(this._houseConfig.rooms || {}).filter(r => r.floor === floorId);

    for (const room of roomsOnFloor) {
        room.header_entities?.forEach(e => entities.add(e.entity));
        room.lights?.forEach(e => entities.add(e));
        room.covers?.forEach(e => entities.add(e));
        room.media_players?.forEach(mp => entities.add(mp.entity));
    }

    return Array.from(entities)
      .map(id => ({
        entity_id: id,
        name: this._hass.states[id]?.attributes.friendly_name || id
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  _getEntityTypeFromConfig(entityId) {
    if (!entityId) return 'unknown';
    for (const room of Object.values(this._houseConfig.rooms || {})) {
        const headerEntity = room.header_entities?.find(e => e.entity === entityId);
        if (headerEntity) return headerEntity.entity_type;
        if (room.lights?.includes(entityId)) return 'light';
        if (room.covers?.includes(entityId)) return 'cover';
        if (room.media_players?.some(mp => mp.entity === entityId)) return 'media_player';
    }
    return entityId.split('.')[0];
  }

  _generateSmallSensorCardHTML(entityId, gridArea) {
    const type = this._getEntityTypeFromConfig(entityId);
    // Use the corrected return object from _getCardDisplayData
    const { name, label, icon, cardClass } = this._getCardDisplayData(entityId, type, false);

    return `
      <div class="sensor-small-card ${cardClass}" style="grid-area: ${gridArea};" data-entity-id="${entityId}" data-type="${type}">
          <div class="sensor-small-grid">
              <div class="sensor-small-icon-cell">
                  <i class="mdi ${this._panel._processIconName(icon)}"></i>
              </div>
              <div class="sensor-small-label">${label}</div>
              <div class="sensor-small-name">${name}</div>
          </div>
      </div>
    `;
  }

  _generateBigSensorCardHTML(entityId, gridArea) {
    const type = this._getEntityTypeFromConfig(entityId);
    const { name, label, icon, cardClass } = this._getCardDisplayData(entityId, type, true);

    return `
      <div class="sensor-big-card ${cardClass}" style="grid-area: ${gridArea};" data-entity-id="${entityId}" data-type="${type}">
          <div class="sensor-big-grid">
              <div class="sensor-big-name">${name}</div>
              <div class="sensor-big-icon-cell">
                  <i class="mdi ${this._panel._processIconName(icon)}"></i>
              </div>
              <div class="sensor-big-label-wrapper">
                  <div class="sensor-big-label">${label}</div>
              </div>
          </div>
      </div>
    `;
  }

  _renderRoomSwipeCard(floorId, gridArea) {
    const roomsOnFloor = Object.entries(this._houseConfig.rooms || {})
        .filter(([, roomConfig]) => roomConfig.floor === floorId)
        .map(([roomKey, roomConfig]) => ({ key: roomKey, ...roomConfig }));

    if (roomsOnFloor.length === 0) {
        return `<div class="placeholder-card placeholder-big" style="grid-area: ${gridArea};">No rooms on this floor.</div>`;
    }

    const cardsHTML = roomsOnFloor.map(room => this._generateRoomCardHTML(room)).join('');

    return `
      <div class="room-swipe-card-container" style="grid-area: ${gridArea};">
          <div class="swiper-container">
              <div class="swiper-wrapper">${cardsHTML}</div>
              <div class="swiper-pagination"></div>
          </div>
      </div>
    `;
  }

  _generateRoomCardHTML(room) {
    const roomName = room.friendly_name || 'Room';
    const roomIcon = this._panel._processIconName(room.icon || 'mdi:home-city');
    const navPath = `#${room.key}`;
    const tempSensor = room.header_entities?.find(e => e.entity_type === 'temperatur')?.entity;
    const humSensor = room.header_entities?.find(e => e.entity_type === 'humidity')?.entity;
    const tempState = tempSensor && this._hass.states[tempSensor];
    const humState = humSensor && this._hass.states[humSensor];
    let tempHumHTML = '';
    if (tempState && tempState.state !== 'unavailable') tempHumHTML += `<i class="mdi mdi-thermometer"></i> ${parseFloat(tempState.state).toFixed(0)}°`;
    if (humState && humState.state !== 'unavailable') tempHumHTML += ` <span style="font-size:0.8em;opacity:0.7">${parseFloat(humState.state).toFixed(0)}%</span>`;

    const cardStateClass = this._isRoomActive(room) ? 'is-on' : 'is-off';

    return `
      <div class="swiper-slide">
        <div class="room-card ${cardStateClass}" data-navigation-path="${navPath}">
          <div class="room-card-grid">
            <div class="room-card-name">${roomName}</div>
            <div class="room-card-icon-cell"><i class="mdi ${roomIcon}"></i></div>
            <div class="room-card-temp">${tempHumHTML}</div>
          </div>
        </div>
      </div>`;
  }
  
  _initializeCardListeners(cardElement) {
    if (!cardElement) return;
    cardElement.addEventListener('click', () => {
      const entityId = cardElement.dataset.entityId;
      const navPath = cardElement.dataset.navigationPath;
      if (navPath) {
        window.location.hash = navPath;
      } else if (entityId) {
        this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
      }
    });
  }

  _getCardDisplayData(entityId, type) {
    const entityState = this._hass.states[entityId];
    
    // --- FIX: Robust defaults for all variables ---
    let name = entityState?.attributes.friendly_name || entityId;
    let label = entityState?.state || 'N/A'; // Default to the entity's state
    let icon = 'mdi:help-circle';
    let cardClass = '';

    if (!entityState || entityState.state === 'unavailable') {
        cardClass = 'is-unavailable';
        label = 'Unavailable';
    } else if (entityState.state === 'on' || entityState.state === 'Run' || entityState.state === 'playing') {
        cardClass = 'is-on';
    }

    switch (type) {
        case 'temperatur':
            const tempValue = parseFloat(entityState?.state);
            label = isNaN(tempValue) ? '--°' : `${tempValue.toFixed(1)}°`;
            name = 'Temperatur';
            icon = 'mdi:thermometer';
            break;
        case 'humidity':
            const humValue = parseFloat(entityState?.state);
            label = isNaN(humValue) ? '--%' : `${Math.round(humValue)}%`;
            name = 'Humidity';
            icon = 'mdi:water-percent';
            break;
        case 'light':
            icon = entityState?.attributes.icon || 'mdi:lightbulb';
            label = entityState?.state === 'on' ? `${entityState.attributes.brightness ? Math.round(entityState.attributes.brightness / 2.55) + '%' : 'On'}` : 'Off';
            if(entityState?.state === 'on') cardClass += ' active-light';
            break;
        case 'motion':
             icon = 'mdi:motion-sensor';
             label = entityState.state === 'on' ? 'Detected' : 'Clear';
             break;
        case 'cover':
            icon = 'mdi:window-shutter';
            label = entityState?.state === 'closed' ? 'Closed' : `${entityState?.attributes.current_position || 0}%`;
            break;
        // --- This default case is the critical fix ---
        default:
            // For any other binary sensor, just show its state
            if (entityState?.state === 'on' || entityState?.state === 'off') {
                label = entityState.state.charAt(0).toUpperCase() + entityState.state.slice(1);
            }
            console.warn(`[FloorManager] Using default card for unknown type: ${type}`);
            break;
    }

    return { name, label, icon, cardClass };
  }
  
  _isRoomActive(roomConfig) {
      if (!roomConfig || !this._hass) return false;
      const motionSensor = roomConfig.header_entities?.find(e => e.entity_type === 'motion')?.entity;
      if (motionSensor && this._hass.states[motionSensor]?.state === 'on') {
          return true;
      }
      return false;
   }
}
