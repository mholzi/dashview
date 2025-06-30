// custom_components/dashview/www/lib/ui/FloorManager.js

export class FloorManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._houseConfig = panel._houseConfig;
    this._shadowRoot = panel.shadowRoot;
    // Track swipe state for motion sensor cards (entityId -> showTime boolean)
    this._motionCardSwipeStates = new Map();
    // Define swipeable entity types as class constant
    this._swipeableTypes = ['motion', 'door', 'other_door', 'smoke', 'cover', 'light'];
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
            
            // Use motion-specific label for swipeable sensors, otherwise use regular label
            const displayLabel = this._swipeableTypes.includes(cardType) ? this._getMotionCardLabel(entityId, cardType) : label;
            card.querySelector('.sensor-small-label').textContent = displayLabel;
            card.querySelector('.sensor-small-icon-cell i').className = `mdi ${this._panel._processIconName(icon)}`;
            
            // Initialize swipe handlers for swipeable cards if not already done
            if (this._swipeableTypes.includes(cardType) && !card.dataset.swipeInitialized) {
                this._initializeMotionCardSwipeHandlers(card);
            }
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

        const isBigSlot = slot.grid_area.includes('-big');
        const entityProvider = (type) => {
            if (type === 'pinned' && slot.entity_id) return slot.entity_id;
            if (type === 'auto' && autoPlacementQueue.length > 0) return autoPlacementQueue.shift().entity_id;
            return null;
        };

        let cardHTML = '';

        if (isBigSlot) {
            if (slot.type === 'room_swipe_card') {
                cardHTML = this._renderRoomSwipeCard(floorId, slot.grid_area);
            } else if (slot.type === 'garbage') {
                cardHTML = this._renderGarbageSwipeCard(slot.grid_area);
            } else {
                const entityId = entityProvider(slot.type);
                if (entityId) {
                    cardHTML = this._generateBigSensorCardHTML(entityId, slot.grid_area);
                } else {
                    // No entity available - keep slot empty
                    cardHTML = `<div style="grid-area: ${slot.grid_area};"></div>`;
                }
            }
        } else {
            const entityId = entityProvider(slot.type);
            if (entityId) {
                cardHTML = this._generateSmallSensorCardHTML(entityId, slot.grid_area);
            } else {
                // No entity available - keep slot empty
                cardHTML = `<div style="grid-area: ${slot.grid_area};"></div>`;
            }
        }
        gridHTML += cardHTML;
    }

    gridContainer.innerHTML = gridHTML;

    this._initializeSwiper(gridContainer);

    gridContainer.querySelectorAll('.sensor-small-card, .sensor-big-card, .room-card, .garbage-card').forEach(card => {
        this._initializeCardListeners(card);
        // Initialize swipe handlers for motion, door, smoke, cover, and light sensor cards
        if (card.classList.contains('sensor-small-card')) {
            const type = card.dataset.type;
            if (type === 'motion' || type === 'door' || type === 'other_door' || type === 'smoke' || type === 'cover' || type === 'light') {
                this._initializeMotionCardSwipeHandlers(card);
            }
        }
    });
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
    
    // Use motion-specific label for swipeable sensors
    const displayLabel = this._swipeableTypes.includes(type) ? this._getMotionCardLabel(entityId, type) : label;

    return `
      <div class="sensor-small-card ${cardClass}" style="grid-area: ${gridArea};" data-entity-id="${entityId}" data-type="${type}">
          <div class="sensor-small-grid">
              <div class="sensor-small-icon-cell">
                  <i class="mdi ${this._panel._processIconName(icon)}"></i>
              </div>
              <div class="sensor-small-label">${displayLabel}</div>
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
    if (tempState && tempState.state !== 'unavailable') tempHumHTML += `<i class="mdi mdi-thermometer"></i> ${parseFloat(tempState.state).toFixed(1)}°`;
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
            const position = entityState?.attributes.current_position || 0;
            const isOpen = position > 20;
            
            if (isOpen) {
                icon = 'mdi:window-shutter-open';
                label = `Offen - ${position}%`;
                if (!cardClass.includes('is-on')) cardClass += ' is-on';
            } else {
                icon = 'mdi:window-shutter';
                label = `Geschlossen - ${position}%`;
                cardClass = cardClass.replace('is-on', '').trim();
            }
            break;
        case SMOKE:
            icon = entityState.state === 'on' ? 'mdi:smoke-detector-variant-alert' : 'mdi:smoke-detector-variant';
            label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
            break;
        case VIBRATION:
            icon = entityState.state === 'on' ? 'mdi:vibrate' : 'mdi:vibrate-off';
            label = entityState.state === 'on' ? 'Erkannt' : 'Klar';
            break;
        case 'media_player':
            icon = 'mdi:music';
            const state = entityState?.state;
            if (state === 'playing') {
                label = 'Playing';
            } else if (['idle', 'standby', 'off'].includes(state)) {
                label = 'Aus';
            } else {
                label = state ? state.charAt(0).toUpperCase() + state.slice(1) : 'N/A';
            }
            break;

        case 'hoover':
            const { icon: vacuumIcon, label: vacuumLabel, cardClass: vacuumCardClass } = this._getVacuumDisplayData(entityState);
            icon = vacuumIcon;
            label = vacuumLabel;
            cardClass = vacuumCardClass;
            break;

        case 'mower':
            const { icon: mowerIcon, label: mowerLabel, cardClass: mowerCardClass } = this._getMowerDisplayData(entityState);
            icon = mowerIcon;
            label = mowerLabel;
            cardClass = mowerCardClass;
            break;

        case 'other_door':
        case 'door':
            const doorState = entityState?.state?.toLowerCase();
            if (doorState === 'on' || doorState === 'open') {
                icon = 'mdi:door-open';
                label = 'Offen';
                cardClass = 'door-open';
            } else if (doorState === 'unlocked') {
                icon = 'mdi:door-closed';
                label = 'Zu';
                cardClass = 'door-unlocked';
            } else if (doorState === 'off' || doorState === 'closed' || doorState === 'locked') {
                icon = 'mdi:door-closed-lock';
                label = 'Abgeschlossen';
                cardClass = 'door-locked';
            } else {
                icon = 'mdi:door';
                label = entityState?.state ? entityState.state.charAt(0).toUpperCase() + entityState.state.slice(1) : 'N/A';
            }
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

  _renderGarbageSwipeCard(gridArea) {
    const garbageSensors = this._houseConfig.garbage_sensors || [];
    
    if (garbageSensors.length === 0) {
        return `<div class="placeholder-card placeholder-big" style="grid-area: ${gridArea};">No garbage sensors configured.</div>`;
    }

    // Sort sensors by next collection date
    const sortedSensors = this._getSortedGarbageSensors(garbageSensors);
    const cardsHTML = sortedSensors.map(sensor => this._generateGarbageCardHTML(sensor)).join('');

    return `
      <div class="garbage-swipe-card-container" style="grid-area: ${gridArea};">
          <div class="swiper-container">
              <div class="swiper-wrapper">${cardsHTML}</div>
              <div class="swiper-pagination"></div>
          </div>
      </div>
    `;
  }

  _getSortedGarbageSensors(garbageSensors) {
    const now = new Date();
    
    return garbageSensors
      .map(sensor => {
        const entityState = this._hass.states[sensor.entity];
        
        // The entity state contains the calculated text like "Heute", "Morgen", "X Tage"
        // Instead of trying to parse it as a date, use it directly
        const stateText = entityState?.state || 'Datum unbekannt';
        
        // Extract numeric days for sorting (if available)
        let daysUntil = 999; // Default for unknown/far future
        if (stateText === 'Heute') {
          daysUntil = 0;
        } else if (stateText === 'Morgen') {
          daysUntil = 1;
        } else {
          // Try to extract number from "X Tage" format
          const match = stateText.match(/^(\d+)\s+Tage?$/);
          if (match) {
            daysUntil = parseInt(match[1], 10);
          }
        }
        
        return {
          ...sensor,
          nextDate: null, // Not used anymore since we use entity state directly
          daysUntil,
          entityState,
          stateText
        };
      })
      .sort((a, b) => a.daysUntil - b.daysUntil);
  }

  _generateGarbageCardHTML(sensor) {
    const { entity, type, daysUntil, entityState, stateText } = sensor;
    const icon = this._getGarbageTypeIcon(type);
    const typeName = this._getGarbageTypeName(type);
    
    // Determine card styling based on urgency
    let cardClass = 'garbage-card';
    const now = new Date();
    const isToday = daysUntil === 0;
    const isTomorrow = daysUntil === 1;
    const isMorning = now.getHours() < 9;
    
    if (isToday && isMorning) {
      cardClass += ' garbage-urgent'; // Red styling
    } else if (isTomorrow) {
      cardClass += ' garbage-tomorrow'; // Green styling
    }

    // Use the entity state text directly (already contains "Heute", "Morgen", "X Tage")
    const dateText = stateText;

    return `
      <div class="swiper-slide">
        <div class="${cardClass}" data-entity-id="${entity}">
          <div class="garbage-card-grid">
            <div class="garbage-card-name">${typeName}</div>
            <div class="garbage-card-icon-cell"><i class="mdi ${this._panel._processIconName(icon)}"></i></div>
            <div class="garbage-card-date">${dateText}</div>
          </div>
        </div>
      </div>
    `;
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

  _getGarbageTypeName(type) {
    const garbageNames = {
      'biomuell': 'Biomüll',
      'hausmuell': 'Hausmüll',
      'gelber_sack': 'Gelber Sack',
      'altpapier': 'Altpapier',
      'restmuell': 'Restmüll',
      'wertstoff': 'Wertstoff',
      'sondermuell': 'Sondermüll'
    };
    return garbageNames[type] || 'Müll';
  }


  _getVacuumDisplayData(entityState) {
    if (!entityState) {
      return { icon: 'mdi:robot-vacuum-variant', label: 'Nicht verfügbar', cardClass: 'is-unavailable' };
    }

    const state = entityState.state?.toLowerCase();
    const status = entityState.attributes?.status?.toLowerCase();
    const error = entityState.attributes?.error;
    const batteryLevel = entityState.attributes?.battery_level;

    // Handle error states first
    if (state === 'error' || (error && error !== 'No error')) {
      let errorMessage = 'Fehler';
      if (error && error !== 'No error') {
        // Common Dreame vacuum error translations
        const errorTranslations = {
          'low_battery': 'Akku schwach',
          'stuck': 'Festgefahren',
          'dust_box_open': 'Staubbehälter offen',
          'no_dust_box': 'Staubbehälter fehlt',
          'water_box_empty': 'Wassertank leer',
          'mop_removed': 'Wischmopp entfernt',
          'cliff_sensor': 'Absturzsensor',
          'bumper_stuck': 'Stoßstange blockiert',
          'charge_found': 'Ladestation nicht gefunden',
          'low_water': 'Wenig Wasser',
          'dirty_mop': 'Schmutziger Mopp',
          'ai_detection': 'KI-Hindernis erkannt',
          'unknown_error': 'Unbekannter Fehler'
        };
        errorMessage = errorTranslations[error.toLowerCase()] || error;
      }
      return { icon: 'mdi:robot-vacuum-alert', label: errorMessage, cardClass: 'vacuum-error' };
    }

    // Handle specific vacuum states based on Dreame vacuum statuses
    switch (state) {
      case 'cleaning':
        return { icon: 'mdi:robot-vacuum', label: 'Saugt', cardClass: 'is-on' };
      case 'returning':
        return { icon: 'mdi:robot-vacuum-variant', label: 'Kehrt zurück', cardClass: 'is-on' };
      case 'charging':
        if (batteryLevel === 100) {
          return { icon: 'mdi:robot-vacuum-variant', label: 'Bereit', cardClass: '' };
        }
        return { icon: 'mdi:robot-vacuum-variant', label: `Lädt ${batteryLevel || 0}%`, cardClass: '' };
      case 'docked':
        return { icon: 'mdi:robot-vacuum-variant', label: 'Bereit', cardClass: '' };
      case 'idle':
        return { icon: 'mdi:robot-vacuum-variant', label: 'Bereit', cardClass: '' };
      case 'paused':
        return { icon: 'mdi:robot-vacuum-variant', label: 'Pausiert', cardClass: 'is-on' };
      case 'zone_cleaning':
        return { icon: 'mdi:robot-vacuum', label: 'Zonenreinigung', cardClass: 'is-on' };
      case 'spot_cleaning':
        return { icon: 'mdi:robot-vacuum', label: 'Punktreinigung', cardClass: 'is-on' };
      case 'mopping':
        return { icon: 'mdi:robot-vacuum', label: 'Wischt', cardClass: 'is-on' };
      case 'washing':
        return { icon: 'mdi:robot-vacuum-variant', label: 'Mopp wird gewaschen', cardClass: 'is-on' };
      case 'drying':
        return { icon: 'mdi:robot-vacuum-variant', label: 'Trocknet', cardClass: 'is-on' };
      case 'sleeping':
        return { icon: 'mdi:sleep', label: 'Ruhemodus', cardClass: '' };
      // Additional Dreame Mova 30 specific states
      case 'auto_cleaning':
        return { icon: 'mdi:robot-vacuum', label: 'Automatische Reinigung', cardClass: 'is-on' };
      case 'room_cleaning':
        return { icon: 'mdi:robot-vacuum', label: 'Zimmerreinigung', cardClass: 'is-on' };
      case 'edge_cleaning':
        return { icon: 'mdi:robot-vacuum', label: 'Kantenreinigung', cardClass: 'is-on' };
      case 'find_robot':
        return { icon: 'mdi:robot-vacuum-alert', label: 'Roboter suchen', cardClass: 'is-on' };
      case 'remote_control':
        return { icon: 'mdi:robot-vacuum', label: 'Fernsteuerung', cardClass: 'is-on' };
      case 'upgrade':
        return { icon: 'mdi:download', label: 'Update läuft', cardClass: 'is-on' };
      case 'off':
        return { icon: 'mdi:power-off', label: 'Ausgeschaltet', cardClass: '' };
      case 'standby':
        return { icon: 'mdi:robot-vacuum-variant', label: 'Standby', cardClass: '' };
      // Additional Dreame Mova 30 extended states
      case 'segment_cleaning':
        return { icon: 'mdi:robot-vacuum', label: 'Segmentreinigung', cardClass: 'is-on' };
      case 'fast_mapping':
        return { icon: 'mdi:map-outline', label: 'Schnelle Kartierung', cardClass: 'is-on' };
      case 'locating':
        return { icon: 'mdi:map-marker', label: 'Lokalisierung', cardClass: 'is-on' };
      case 'auto_empty':
        return { icon: 'mdi:delete-empty', label: 'Automatische Entleerung', cardClass: 'is-on' };
      case 'deep_cleaning':
        return { icon: 'mdi:robot-vacuum', label: 'Tiefenreinigung', cardClass: 'is-on' };
    }

    // Handle detailed status attribute if available
    if (status) {
      const statusTranslations = {
        'sleeping': 'Ruhemodus',
        'sweeping': 'Saugt',
        'mopping': 'Wischt',
        'sweeping_and_mopping': 'Saugt und wischt',
        'charging_completed': 'Vollgeladen',
        'charging': `Lädt ${batteryLevel || 0}%`,
        'docked': 'Bereit',
        'idle': 'Bereit',
        'returning': 'Kehrt zurück',
        'paused': 'Pausiert',
        // Additional Dreame Mova 30 status translations
        'auto_cleaning': 'Automatische Reinigung',
        'room_cleaning': 'Zimmerreinigung',
        'zone_cleaning': 'Zonenreinigung',
        'spot_cleaning': 'Punktreinigung',
        'edge_cleaning': 'Kantenreinigung',
        'fast_mapping': 'Schnelle Kartierung',
        'locating': 'Lokalisierung',
        'remote_control': 'Fernsteuerung',
        'find_robot': 'Roboter suchen',
        'upgrade': 'Update läuft',
        'washing': 'Mopp wird gewaschen',
        'drying': 'Trocknet',
        'standby': 'Standby',
        'off': 'Ausgeschaltet',
        'segment_cleaning': 'Segmentreinigung',
        'auto_empty': 'Automatische Entleerung',
        'deep_cleaning': 'Tiefenreinigung'
      };
      
      const translatedStatus = statusTranslations[status] || status;
      const activeStates = ['sweeping', 'mopping', 'sweeping_and_mopping', 'returning', 'paused', 
                           'auto_cleaning', 'room_cleaning', 'zone_cleaning', 'spot_cleaning', 'edge_cleaning', 
                           'fast_mapping', 'locating', 'remote_control', 'find_robot', 'upgrade', 'washing', 'drying',
                           'segment_cleaning', 'auto_empty', 'deep_cleaning'];
      
      return {
        icon: activeStates.includes(status) ? 'mdi:robot-vacuum' : 
              status === 'sleeping' ? 'mdi:sleep' : 'mdi:robot-vacuum-variant',
        label: translatedStatus,
        cardClass: activeStates.includes(status) ? 'is-on' : ''
      };
    }

    // Fallback
    return { 
      icon: 'mdi:robot-vacuum-variant', 
      label: state ? state.charAt(0).toUpperCase() + state.slice(1) : 'Unbekannt', 
      cardClass: '' 
    };
  }

  _getMowerDisplayData(entityState) {
    if (!entityState) {
      return { icon: 'mdi:robot-mower-outline', label: 'Nicht verfügbar', cardClass: 'is-unavailable' };
    }

    const state = entityState.state?.toLowerCase();
    const error = entityState.attributes?.error;
    const lastError = entityState.attributes?.last_error;
    const activity = entityState.attributes?.activity;
    const batteryLevel = entityState.attributes?.battery_level;

    // Helper function to check if error value indicates an actual error
    const isValidError = (errorValue) => {
      if (!errorValue) return false;
      if (typeof errorValue !== 'string') return false;
      const errorStr = errorValue.toLowerCase();
      return errorStr !== 'none' && errorStr !== 'no error' && errorStr !== 'ok' && errorStr !== '';
    };

    // Handle error states - only if there is a valid error
    if (isValidError(error) || isValidError(lastError)) {
      let errorMessage = 'Fehler';
      // Use actual error value, but exclude "none" values when determining current error
      const validError = isValidError(error) ? error : null;
      const validLastError = isValidError(lastError) ? lastError : null;
      const currentError = validError || validLastError;
      
      if (currentError && currentError !== 'OK') {
        // Common lawn mower error translations
        const errorTranslations = {
          'outside_working_area': 'Außerhalb Arbeitsbereich',
          'no_loop_signal': 'Kein Schleifensignal',
          'wrong_loop_signal': 'Falsches Schleifensignal',
          'loop_sensor_problem_front': 'Schleifensensor vorne defekt',
          'loop_sensor_problem_rear': 'Schleifensensor hinten defekt',
          'trapped': 'Eingeklemmt',
          'upside_down': 'Umgedreht',
          'low_battery': 'Akku schwach',
          'empty_battery': 'Akku leer',
          'no_drive': 'Antrieb defekt',
          'temporarily_lifted': 'Angehoben',
          'lifted': 'Angehoben',
          'blocked': 'Blockiert',
          'needs_service': 'Service erforderlich',
          'memory_circuit_problem': 'Speicherproblem',
          'charging_system_problem': 'Ladefehler',
          'stop_button_problem': 'Stop-Taste defekt',
          'tilt_sensor_problem': 'Neigungssensor defekt',
          'collision_sensor_problem': 'Kollisionssensor defekt',
          'charging_current_too_high': 'Ladestrom zu hoch',
          'electronic_problem': 'Elektronikfehler',
          'cutting_system_blocked': 'Mähwerk blockiert',
          'cutting_system_problem': 'Mähwerk defekt',
          'invalid_sub_device': 'Ungültiges Untergerät',
          'settings_restored': 'Einstellungen zurückgesetzt',
          'electronic_problem_2': 'Elektronikfehler 2',
          'unknown_error': 'Unbekannter Fehler'
        };
        errorMessage = errorTranslations[currentError.toLowerCase()] || currentError;
      }
      return { icon: 'mdi:robot-mower-alert', label: errorMessage, cardClass: 'mower-error' };
    }

    // Handle normal states
    switch (state) {
      case 'mowing':
        return { icon: 'mdi:robot-mower', label: 'Mäht', cardClass: 'is-on' };
      case 'charging':
        return { icon: 'mdi:robot-mower-outline', label: `Lädt ${batteryLevel || 0}%`, cardClass: '' };
      case 'docked':
      case 'parked':
        return { icon: 'mdi:robot-mower-outline', label: 'Geparkt', cardClass: '' };
      case 'going_home':
      case 'returning':
        return { icon: 'mdi:robot-mower-outline', label: 'Kehrt zurück', cardClass: 'is-on' };
      case 'paused':
        return { icon: 'mdi:robot-mower-outline', label: 'Pausiert', cardClass: 'is-on' };
      case 'idle':
        return { icon: 'mdi:robot-mower-outline', label: 'Bereit', cardClass: '' };
      case 'ok':
        // Use activity if available
        if (activity) {
          switch (activity.toLowerCase()) {
            case 'mowing':
              return { icon: 'mdi:robot-mower', label: 'Mäht', cardClass: 'is-on' };
            case 'charging':
              return { icon: 'mdi:robot-mower-outline', label: `Lädt ${batteryLevel || 0}%`, cardClass: '' };
            case 'parked':
              return { icon: 'mdi:robot-mower-outline', label: 'Geparkt', cardClass: '' };
            case 'going_home':
              return { icon: 'mdi:robot-mower-outline', label: 'Kehrt zurück', cardClass: 'is-on' };
            case 'none':
              return { icon: 'mdi:robot-mower-outline', label: 'Bereit', cardClass: '' };
          }
        }
        return { icon: 'mdi:robot-mower-outline', label: 'Bereit', cardClass: '' };
    }

    // Fallback
    return { 
      icon: 'mdi:robot-mower-outline', 
      label: state ? state.charAt(0).toUpperCase() + state.slice(1) : 'Unbekannt', 
      cardClass: '' 
    };
  }

  _calculateTimeDifference(lastChanged) {
    const now = new Date();
    const diffSeconds = Math.floor((now - new Date(lastChanged)) / 1000);
    if (diffSeconds < 60) return 'Jetzt';
    if (diffSeconds < 3600) return `vor ${Math.floor(diffSeconds / 60)}m`;
    if (diffSeconds < 86400) return `vor ${Math.floor(diffSeconds / 3600)}h`;
    return `vor ${Math.floor(diffSeconds / 86400)} Tagen`;
  }

  _getMotionCardLabel(entityId, type) {
    const entityState = this._hass.states[entityId];
    if (!entityState) {
      return this._getCardDisplayData(entityId, type).label;
    }

    // Check if this entity type supports swipe to show time
    if (!this._swipeableTypes.includes(type)) {
      return this._getCardDisplayData(entityId, type).label;
    }

    const showTime = this._motionCardSwipeStates.get(entityId) || false;
    if (showTime) {
      return this._calculateTimeDifference(entityState.last_changed);
    } else {
      return this._getCardDisplayData(entityId, type).label;
    }
  }

  _initializeMotionCardSwipeHandlers(card) {
    const entityId = card.dataset.entityId;
    const type = card.dataset.type;
    
    // Check if this entity type supports swipe to show time
    if (!this._swipeableTypes.includes(type)) return;

    let startX = 0;
    let startTime = 0;
    const SWIPE_THRESHOLD = 50;
    const TIME_THRESHOLD = 300;

    const handleTouchStart = (e) => {
      startX = e.type === 'touchstart' ? e.touches[0].clientX : e.clientX;
      startTime = Date.now();
    };

    const handleTouchEnd = (e) => {
      const endX = e.type === 'touchend' ? e.changedTouches[0].clientX : e.clientX;
      const endTime = Date.now();
      const deltaX = endX - startX;
      const deltaTime = endTime - startTime;

      // Check if it's a valid swipe (sufficient distance and speed)
      if (Math.abs(deltaX) > SWIPE_THRESHOLD && deltaTime < TIME_THRESHOLD) {
        // Toggle swipe state
        const currentState = this._motionCardSwipeStates.get(entityId) || false;
        this._motionCardSwipeStates.set(entityId, !currentState);
        
        // Update the label
        const labelElement = card.querySelector('.sensor-small-label');
        if (labelElement) {
          labelElement.textContent = this._getMotionCardLabel(entityId, type);
        }
      }
    };

    // Add both touch and mouse events for broader compatibility
    card.addEventListener('touchstart', handleTouchStart, { passive: true });
    card.addEventListener('touchend', handleTouchEnd, { passive: true });
    card.addEventListener('mousedown', handleTouchStart);
    card.addEventListener('mouseup', handleTouchEnd);
    
    // Mark as initialized to avoid duplicate handlers
    card.dataset.swipeInitialized = 'true';
  }
}
