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
  
  /**
   * Initializes the floor tabs and renders the initial layout for the default floor.
   */
  initializeFloorTabs() {
    const container = this._shadowRoot.getElementById('floor-tabs-container');
    if (!container) return;

    container.innerHTML = ''; // Clear existing content

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

  /**
   * Renders the entire layout for a specific floor based on its configuration.
   * This is the main rendering engine for the dashboard.
   */
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
        } else { // Small slot
            const entityId = entityProvider(slot.type);
            if (entityId) cardHTML = this._generateSmallSensorCardHTML(entityId, slot.grid_area);
        }
        gridHTML += cardHTML;
    }

    gridContainer.innerHTML = gridHTML;
    
    // Re-initialize event listeners for the newly created cards
    gridContainer.querySelectorAll('.sensor-small-card, .sensor-big-card, .room-card').forEach(card => this._initializeCardListeners(card));
    gridContainer.querySelectorAll('.swiper-container').forEach(container => this._initializeSwiper(container));
  }
  
  /**
   * Gathers all entities associated with a specific floor from the house configuration.
   */
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
    for (const room of Object.values(this._houseConfig.rooms || {})) {
        if (room.header_entities?.some(e => e.entity === entityId)) {
            return room.header_entities.find(e => e.entity === entityId).entity_type;
        }
        if (room.lights?.includes(entityId)) return 'light';
        if (room.covers?.includes(entityId)) return 'cover';
        if (room.media_players?.some(mp => mp.entity === entityId)) return 'media_player';
    }
    return entityId.split('.')[0];
  }

  // --- CARD GENERATION AND INITIALIZATION ---

  _generateSmallSensorCardHTML(entityId, gridArea) {
    const type = this._getEntityTypeFromConfig(entityId);
    const { name, label, icon, cardStyle, iconStyle, imgCellStyle, labelStyle, nameStyle } = this._getCardDisplayData(entityId, type, false);

    return `
      <div class="sensor-small-card" style="grid-area: ${gridArea}; ${cardStyle}" data-entity-id="${entityId}" data-type="${type}">
          <div class="sensor-small-grid">
              <div class="sensor-small-icon-cell" style="${imgCellStyle}">
                  <i class="mdi ${this._panel._processIconName(icon)}" style="${iconStyle}"></i>
              </div>
              <div class="sensor-small-label" style="${labelStyle}">${label}</div>
              <div class="sensor-small-name" style="${nameStyle}">${name}</div>
          </div>
      </div>
    `;
  }

  _generateBigSensorCardHTML(entityId, gridArea) {
    const type = this._getEntityTypeFromConfig(entityId);
    const { name, label, icon, cardStyle, iconStyle, imgCellStyle, labelStyle, nameStyle } = this._getCardDisplayData(entityId, type, true);

    return `
      <div class="sensor-big-card" style="grid-area: ${gridArea}; ${cardStyle}" data-entity-id="${entityId}" data-type="${type}">
          <div class="sensor-big-grid">
              <div class="sensor-big-name" style="${nameStyle}">${name}</div>
              <div class="sensor-big-icon-cell" style="${imgCellStyle}">
                  <i class="mdi ${this._panel._processIconName(icon)}" style="${iconStyle}"></i>
              </div>
              <div class="sensor-big-label-wrapper">
                  <div class="sensor-big-label" style="${labelStyle}">${label}</div>
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

  _initializeSwiper(container) { /* ... same swiper logic from original file ... */ }
  _getCardDisplayData(entityId, type, isBigCard) { /* ... same logic from original file ... */ return { name, label, icon, cardStyle, iconStyle, imgCellStyle, labelStyle, nameStyle }; }
  _isRoomActive(roomConfig) { /* ... same logic from original file ... */ return false; }
}
