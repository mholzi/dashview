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
  update() {
    if (!this._shadowRoot) return;
    const activeTab = this._shadowRoot.querySelector('.floor-tab-button.active');
    if (!activeTab) return;

    const floorId = activeTab.dataset.targetFloor;
    const gridContainer = this._shadowRoot.getElementById(`room-grid-${floorId}`);
    if (!gridContainer) return;

    // --- NEW, MORE TARGETED LOGIC ---
    // Instead of re-rendering, find existing cards and update them individually.
    
    // Update small sensor cards
    gridContainer.querySelectorAll('.sensor-small-card').forEach(card => {
        const entityId = card.dataset.entityId;
        if (entityId) {
            const cardType = card.dataset.type;
            const { name, label, icon, cardClass } = this._getCardDisplayData(entityId, cardType);
            card.className = `sensor-small-card ${cardClass}`; // Update class for styling
            card.querySelector('.sensor-small-label').textContent = label; // Update only the text
            card.querySelector('.sensor-small-icon-cell i').className = `mdi ${this._panel._processIconName(icon)}`;
        }
    });

    // Update big sensor cards
    gridContainer.querySelectorAll('.sensor-big-card').forEach(card => {
        const entityId = card.dataset.entityId;
        if (entityId) {
            const cardType = card.dataset.type;
            const { name, label, icon, cardClass } = this._getCardDisplayData(entityId, cardType);
            card.className = `sensor-big-card ${cardClass}`; // Update class for styling
            card.querySelector('.sensor-big-label').textContent = label; // Update only the text
            card.querySelector('.sensor-big-icon-cell i').className = `mdi ${this._panel._processIconName(icon)}`;
        }
    });

    // Update room cards within the swiper
    gridContainer.querySelectorAll('.room-card').forEach(card => {
        const navPath = card.dataset.navigationPath;
        if (!navPath) return;

        const roomKey = navPath.substring(1);
        const roomConfig = this._houseConfig.rooms[roomKey];
        if (roomConfig) {
            const cardStateClass = this._isRoomActive(roomConfig) ? 'is-on' : 'is-off';
            // Only update the class, not the whole card.
            if (!card.classList.contains(cardStateClass)) {
                 card.classList.remove('is-on', 'is-off');
                 card.classList.add(cardStateClass);
            }
        }
    });
    // By not calling renderFloorLayout(), the swiper is NOT re-initialized, preserving its state.
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

    this._initializeSwiper(gridContainer);

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

    let name = entityState?.attributes.friendly_name || entityId;
    let label = entityState?.state || 'N/A';
    let icon = 'mdi:help-circle';
    let cardClass = '';

    if (!entityState || entityState.state === 'unavailable') {
        cardClass = 'is-unavailable';
        label = 'Unavailable';
    } else if (entityState.state === 'on' || entityState.state === 'Run' || entityState.state === 'playing' || (type === 'cover' && entityState.state === 'open')) {
        // This is the fix: added a check for covers being open
        cardClass = 'is-on';
    }

    const { TEMPERATUR, HUMIDITY, LIGHT, MOTION, WINDOW, COVER, SMOKE, VIBRATION } = this._panel._entityLabels;
    switch (type) {
        case TEMPERATUR:
            const tempValue = parseFloat(entityState?.state);
            label = isNaN(tempValue) ? '--°' : `${tempValue.toFixed(1)}°`;
            name = 'Temperatur';
            icon = 'mdi:thermometer';
            break;
        case HUMIDITY:
            const humValue = parseFloat(entityState?.state);
            label = isNaN(humValue) ? '--%' : `${Math.round(humValue)}%`;
            name = 'Luftfeuchtigkeit';
            icon = 'mdi:water-percent';
            break;
        case LIGHT:
            icon = entityState?.state === 'on' ? (entityState?.attributes.icon || 'mdi:lightbulb') : (entityState?.attributes.icon || 'mdi:lightbulb-outline');
            label = entityState?.state === 'on' ? `${entityState.attributes.brightness ? Math.round(entityState.attributes.brightness / 2.55) + '%' : 'An'}` : 'Aus';
            if(entityState?.state === 'on') cardClass += ' active-light';
            break;
        case MOTION:
             icon = entityState.state === 'on' ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
             label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
             break;
        case WINDOW:
             icon = entityState.state === 'on' ? 'mdi:window-open-variant' : 'mdi:window-closed';
             label = entityState.state === 'on' ? 'Offen' : 'Geschlossen';
             break;
        case COVER:
            icon = 'mdi:window-shutter';
            label = entityState?.state === 'closed' ? 'Geschlossen' : `${entityState?.attributes.current_position || 0}%`;
            break;
        case SMOKE:
            icon = entityState.state === 'on' ? 'mdi:smoke-detector-variant-alert' : 'mdi:smoke-detector-variant';
            label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
            break;
        case VIBRATION:
            icon = entityState.state === 'on' ? 'mdi:vibrate' : 'mdi:vibrate-off';
            label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
            break;

        default:
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
      const motionSensor = roomConfig.header_entities?.find(e => e.entity_type === this._panel._entityLabels.MOTION)?.entity;
      if (motionSensor && this._hass.states[motionSensor]?.state === 'on') {
          return true;
      }
      return false;
   }

  _initializeSwiper(container) {
    container.querySelectorAll('.swiper-container').forEach(swiperEl => {
      if (swiperEl.dataset.swiperInitialized) return;
      swiperEl.dataset.swiperInitialized = 'true';

      const wrapper = swiperEl.querySelector('.swiper-wrapper');
      const pagination = swiperEl.querySelector('.swiper-pagination');
      const slides = Array.from(wrapper.children);
      let currentIndex = 0;
      let startX = 0;
      let currentX = 0;
      let isDragging = false;

      if (slides.length <= 1) {
        if(pagination) pagination.style.display = 'none';
        return;
      }

      // Create pagination bullets
      if (pagination) {
        pagination.innerHTML = '';
        slides.forEach((_, i) => {
          const bullet = document.createElement('span');
          bullet.className = `swiper-pagination-bullet ${i === 0 ? 'swiper-pagination-bullet-active' : ''}`;
          bullet.addEventListener('click', () => {
            currentIndex = i;
            this._updateSwipePosition(wrapper, slides, currentIndex);
            this._updatePagination(pagination, slides, currentIndex);
          });
          pagination.appendChild(bullet);
        });
      }

      const onTouchStart = (e) => {
        isDragging = true;
        startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
        wrapper.style.transition = 'none';
      };

      const onTouchMove = (e) => {
        if (!isDragging) return;
        currentX = (e.type === 'touchmove' ? e.touches[0].clientX : e.clientX) - startX;
        const baseTranslate = -currentIndex * swiperEl.offsetWidth;
        wrapper.style.transform = `translateX(${baseTranslate + currentX}px)`;
      };

      const onTouchEnd = () => {
        if (!isDragging) return;
        isDragging = false;
        wrapper.style.transition = 'transform 0.3s ease';

        if (Math.abs(currentX) > swiperEl.offsetWidth / 4) {
          currentIndex = currentX < 0 ? Math.min(currentIndex + 1, slides.length - 1) : Math.max(currentIndex - 1, 0);
        }

        this._updateSwipePosition(wrapper, slides, currentIndex);
        this._updatePagination(pagination, slides, currentIndex);
        currentX = 0;
      };

      swiperEl.addEventListener('touchstart', onTouchStart, { passive: true });
      swiperEl.addEventListener('touchmove', onTouchMove, { passive: true });
      swiperEl.addEventListener('touchend', onTouchEnd);
      swiperEl.addEventListener('mousedown', onTouchStart);
      swiperEl.addEventListener('mousemove', onTouchMove);
      swiperEl.addEventListener('mouseup', onTouchEnd);
      swiperEl.addEventListener('mouseleave', onTouchEnd);
    });
  }

  _updateSwipePosition(wrapper, slides, index) {
    const newTranslate = -index * wrapper.offsetWidth;
    wrapper.style.transform = `translateX(${newTranslate}px)`;
    slides.forEach((slide, i) => {
        slide.classList.toggle('swiper-slide-active', i === index);
    });
  }

  _updatePagination(pagination, slides, index) {
    if (!pagination) return;
    Array.from(pagination.children).forEach((bullet, i) => {
      bullet.classList.toggle('swiper-pagination-bullet-active', i === index);
    });
  }
}
