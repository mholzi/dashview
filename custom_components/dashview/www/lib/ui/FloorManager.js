// custom_components/dashview/www/lib/ui/FloorManager.js

import { GestureDetector } from '../utils/GestureDetector.js';
import { calculateTimeDifferenceShort } from '../utils/time-utils.js';
import { SimpleYamlParser } from '../utils/yaml-parser.js';

// Gesture detection constants
const LONG_TAP_DURATION = 500; // ms
const LONG_TAP_TOLERANCE = 10; // pixels

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
    
    // Initialize gesture detector for long-tap functionality
    this._gestureDetector = new GestureDetector({
      longTapDuration: LONG_TAP_DURATION,
      longTapTolerance: LONG_TAP_TOLERANCE,
      enableVisualFeedback: true
    });
    
    
    
    // Template cache for person cards
    this._templateCache = new Map();
  }

  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Clean up resources to prevent memory leaks
   */
  /**
   * Add trend indicators to sensor cards for temperature and humidity
   * @param {HTMLElement} card - The sensor card element
   * @param {string} entityId - The entity ID
   * @param {string} cardType - The card type (temperatur, humidity, etc.)
   * @param {string} cardSize - 'small' or 'big'
   */
  async _addTrendIndicatorToCard(card, entityId, cardType, cardSize) {
    // Only add trends to temperature and humidity sensors
    if (!['temperatur', 'humidity'].includes(cardType) || !this._panel._trendAnalysisManager) {
      return;
    }
    
    try {
      const trendData = await this._panel._trendAnalysisManager.getTrendData(entityId);
      const trendIndicator = this._panel._trendAnalysisManager.getTrendIndicator(trendData);
      const patternAlert = this._panel._trendAnalysisManager.getPatternAlert(trendData);
      
      // Remove existing trend indicators
      const existingTrend = card.querySelector('.trend-indicator');
      if (existingTrend) {
        existingTrend.remove();
      }
      
      const existingPattern = card.querySelector('.pattern-alert');
      if (existingPattern) {
        existingPattern.remove();
      }
      
      // Add trend indicator if available and meaningful
      if (trendIndicator && trendIndicator.text !== '→ stable') {
        const trendElement = document.createElement('div');
        trendElement.className = 'trend-indicator';
        trendElement.style.cssText = `
          color: ${trendIndicator.color};
          font-size: ${cardSize === 'small' ? '0.6em' : '0.7em'};
          display: flex;
          align-items: center;
          gap: 2px;
          margin-top: 2px;
        `;
        trendElement.innerHTML = `<i class="mdi ${trendIndicator.icon}" style="font-size: 1.1em;"></i><span>${trendIndicator.text}</span>`;
        trendElement.title = `${cardType === 'temperatur' ? 'Temperature' : 'Humidity'} trend: ${trendIndicator.text} (${trendIndicator.confidence} confidence)`;
        
        const labelElement = card.querySelector(`.sensor-${cardSize}-label`);
        if (labelElement) {
          labelElement.appendChild(trendElement);
        }
      }
      
      // Add pattern alert if available
      if (patternAlert) {
        const alertElement = document.createElement('div');
        alertElement.className = 'pattern-alert';
        alertElement.style.cssText = `
          color: ${patternAlert.color};
          font-size: ${cardSize === 'small' ? '0.55em' : '0.65em'};
          display: flex;
          align-items: center;
          gap: 2px;
          margin-top: 1px;
          opacity: 0.9;
        `;
        alertElement.innerHTML = `<i class="mdi ${patternAlert.icon}" style="font-size: 1em;"></i><span>${patternAlert.description}</span>`;
        alertElement.title = `Pattern: ${patternAlert.description} (${patternAlert.severity} severity)`;
        
        const nameElement = card.querySelector(`.sensor-${cardSize}-name`);
        if (nameElement) {
          nameElement.appendChild(alertElement);
        }
      }
    } catch (error) {
      console.warn(`[FloorManager] Error adding trend indicator to ${entityId}:`, error);
    }
  }

  dispose() {
    console.log('[FloorManager] Disposing and cleaning up resources');
    
    // Clean up gesture detector
    if (this._gestureDetector) {
      this._gestureDetector.dispose();
      this._gestureDetector = null;
    }
    
    // Clean up context menu manager
    
    // Clear swipe state maps
    if (this._motionCardSwipeStates) {
      this._motionCardSwipeStates.clear();
    }
    
    // Clear template cache
    if (this._templateCache) {
      this._templateCache.clear();
    }
    
    // Clear references
    this._panel = null;
    this._hass = null;
    this._houseConfig = null;
    this._shadowRoot = null;
  }

  /**
   * Load and cache a template file
   * @param {string} templateName - Name of the template file (without .html extension)
   * @returns {Promise<string>} Template content
   */
  async _loadTemplate(templateName) {
    if (this._templateCache.has(templateName)) {
      return this._templateCache.get(templateName);
    }
    
    try {
      const response = await fetch(`/local/dashview/templates/${templateName}.html`);
      if (!response.ok) {
        throw new Error(`Failed to load template: ${response.status} ${response.statusText}`);
      }
      const template = await response.text();
      this._templateCache.set(templateName, template);
      return template;
    } catch (error) {
      console.error(`[FloorManager] Error loading template ${templateName}:`, error);
      // Return fallback template if loading fails
      return this._getFallbackPersonCardTemplate();
    }
  }

  /**
   * Get fallback person card template structure
   * @returns {string} Fallback template HTML
   */
  _getFallbackPersonCardTemplate() {
    return `
      <div class="person-card" data-entity-id="{{entity_id}}" data-hash="#entity-details-{{entity_id}}">
        <div class="person-card-header">
          <div class="person-avatar">
            <i class="mdi mdi-account person-avatar-icon"></i>
          </div>
          <div class="person-info">
            <div class="person-name">{{friendly_name}}</div>
            <div class="person-location">{{location_display}}</div>
          </div>
          <div class="person-status-badge {{state_class}}">
            <i class="mdi {{state_icon}}"></i>
            <span>{{state_display}}</span>
          </div>
        </div>
        
        <div class="person-card-body">
          <div class="person-activity">
            <div class="person-activity-item">
              <i class="mdi mdi-clock-outline"></i>
              <span class="person-last-seen">{{last_seen_display}}</span>
            </div>
            <div class="person-activity-item person-battery-item {{battery_class}}">
              <i class="mdi mdi-battery person-battery-icon" data-battery-level="{{battery_level}}"></i>
              <span class="person-battery">{{battery_level}}%</span>
            </div>
          </div>
          
          <div class="person-quick-actions">
            <button class="person-quick-action-btn person-presence-toggle" 
                    data-action="toggle-presence" 
                    data-person-id="{{entity_id}}"
                    data-current-state="{{state}}"
                    title="Toggle {{toggle_action}}">
              <i class="mdi {{toggle_icon}}"></i>
            </button>
          </div>
        </div>
        
        <div class="person-card-footer {{activity_class}}">
          <div class="person-current-activity">
            <i class="mdi mdi-calendar-clock"></i>
            <span class="person-activity-text">{{current_activity}}</span>
          </div>
        </div>
      </div>
    `;
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
    gridContainer.querySelectorAll('.sensor-small-card').forEach(async (card) => {
        const entityId = card.dataset.entityId;
        if (entityId) {
            const cardType = card.dataset.type;
            const { name, label, icon, cardClass } = this._getCardDisplayData(entityId, cardType);
            card.className = `sensor-small-card ${cardClass}`; // Update class for styling
            
            // Use motion-specific label for swipeable sensors, otherwise use regular label
            const displayLabel = this._swipeableTypes.includes(cardType) ? this._getMotionCardLabel(entityId, cardType) : label;
            card.querySelector('.sensor-small-label').textContent = displayLabel;
            card.querySelector('.sensor-small-icon-cell i').className = `mdi ${this._panel._processIconName(icon)}`;
            
            // Add trend indicators for temperature and humidity sensors
            await this._addTrendIndicatorToCard(card, entityId, cardType, 'small');
            
            // Initialize swipe handlers for swipeable cards if not already done
            if (this._swipeableTypes.includes(cardType) && !card.dataset.swipeInitialized) {
                this._initializeMotionCardSwipeHandlers(card);
            }
        }
    });

    // Update big sensor cards
    gridContainer.querySelectorAll('.sensor-big-card').forEach(async (card) => {
        const entityId = card.dataset.entityId;
        if (entityId) {
            const cardType = card.dataset.type;
            const { name, label, icon, cardClass } = this._getCardDisplayData(entityId, cardType);
            card.className = `sensor-big-card ${cardClass}`; // Update class for styling
            card.querySelector('.sensor-big-label').textContent = label; // Update only the text
            card.querySelector('.sensor-big-icon-cell i').className = `mdi ${this._panel._processIconName(icon)}`;
            
            // Add trend indicators for temperature and humidity sensors
            await this._addTrendIndicatorToCard(card, entityId, cardType, 'big');
        }
    });

    // Update person cards
    gridContainer.querySelectorAll('.person-card').forEach(card => {
        const entityId = card.dataset.entityId;
        if (entityId) {
            this._updatePersonCard(card, entityId);
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
    
    // Update custom cards in main dashboard
    this.renderCustomCardsMain();
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

  async renderFloorLayout(floorId) {
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

    const cardPromises = layoutConfig.map(async (slot) => {
        if (slot.type === 'empty') {
            return `<div style="grid-area: ${slot.grid_area};"></div>`;
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
                cardHTML = await this._renderRoomSwipeCard(floorId, slot.grid_area);
            } else if (slot.type === 'garbage') {
                cardHTML = this._renderGarbageSwipeCard(slot.grid_area);
            } else if (slot.type === 'person_cards') {
                cardHTML = await this._renderPersonCardsContainer(slot.grid_area);
            } else if (slot.type === 'custom_card' && slot.custom_card_id) {
                cardHTML = await this._renderCustomCard(slot.custom_card_id, slot.grid_area, true);
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
            if (slot.type === 'person_card' && slot.person_id) {
                cardHTML = await this._renderSinglePersonCard(slot.person_id, slot.grid_area);
            } else if (slot.type === 'custom_card' && slot.custom_card_id) {
                cardHTML = await this._renderCustomCard(slot.custom_card_id, slot.grid_area, false);
            } else {
                const entityId = entityProvider(slot.type);
                if (entityId) {
                    cardHTML = this._generateSmallSensorCardHTML(entityId, slot.grid_area);
                } else {
                    // No entity available - keep slot empty
                    cardHTML = `<div style="grid-area: ${slot.grid_area};"></div>`;
                }
            }
        }
        return cardHTML;
    });

    const cardHTMLArray = await Promise.all(cardPromises);
    const gridHTML = cardHTMLArray.join('');

    gridContainer.innerHTML = gridHTML;

    this._initializeSwiper(gridContainer);

    gridContainer.querySelectorAll('.sensor-small-card, .sensor-big-card, .room-card, .garbage-card, .person-card').forEach(card => {
        this._initializeCardListeners(card);
        // Initialize swipe handlers for motion, door, smoke, cover, and light sensor cards
        if (card.classList.contains('sensor-small-card')) {
            const type = card.dataset.type;
            if (type === 'motion' || type === 'door' || type === 'other_door' || type === 'smoke' || type === 'cover' || type === 'light') {
                this._initializeMotionCardSwipeHandlers(card);
            }
        }
        // Initialize person card interactions
        if (card.classList.contains('person-card')) {
            this._initializePersonCardHandlers(card);
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
              <div class="sensor-big-label">${label}</div>
          </div>
      </div>
    `;
  }

  async _renderRoomSwipeCard(floorId, gridArea) {
    const roomsOnFloor = Object.entries(this._houseConfig.rooms || {})
        .filter(([, roomConfig]) => roomConfig.floor === floorId)
        .map(([roomKey, roomConfig]) => ({ key: roomKey, ...roomConfig }));

    if (roomsOnFloor.length === 0) {
        return `<div class="placeholder-card placeholder-big" style="grid-area: ${gridArea};">No rooms on this floor.</div>`;
    }

    const cardsHTMLArray = await Promise.all(roomsOnFloor.map(room => this._generateRoomCardHTML(room)));
    const cardsHTML = cardsHTMLArray.join('');

    return `
      <div class="room-swipe-card-container" style="grid-area: ${gridArea};">
          <div class="swiper-container">
              <div class="swiper-wrapper">${cardsHTML}</div>
              <div class="swiper-pagination"></div>
          </div>
      </div>
    `;
  }

  async _generateRoomCardHTML(room) {
    const roomName = room.friendly_name || 'Room';
    const roomIcon = this._panel._processIconName(room.icon || 'mdi:home-city');
    const navPath = `#${room.key}`;
    const tempSensor = room.header_entities?.find(e => e.entity_type === 'temperatur')?.entity;
    const humSensor = room.header_entities?.find(e => e.entity_type === 'humidity')?.entity;
    const tempState = tempSensor && this._hass.states[tempSensor];
    const humState = humSensor && this._hass.states[humSensor];
    
    let tempHumHTML = '';
    if (tempState && tempState.state !== 'unavailable') {
      tempHumHTML += `<i class="mdi mdi-thermometer"></i> ${parseFloat(tempState.state).toFixed(1)}°`;
    }
    if (humState && humState.state !== 'unavailable') {
      tempHumHTML += ` <span style="font-size:0.8em;opacity:0.7">${parseFloat(humState.state).toFixed(0)}%</span>`;
    }

    // Add trend indicators for temperature and humidity
    let trendHTML = '';
    try {
      if (tempSensor && this._panel._trendAnalysisManager) {
        const tempTrendData = await this._panel._trendAnalysisManager.getTrendData(tempSensor);
        const tempIndicator = this._panel._trendAnalysisManager.getTrendIndicator(tempTrendData);
        if (tempIndicator && tempIndicator.text !== '→ stable') {
          trendHTML += `<span class="trend-indicator temp-trend" style="color: ${tempIndicator.color}; font-size: 0.7em; margin-left: 4px;" title="Temperature trend: ${tempIndicator.text}">${tempIndicator.text}</span>`;
        }
      }
      
      if (humSensor && this._panel._trendAnalysisManager) {
        const humTrendData = await this._panel._trendAnalysisManager.getTrendData(humSensor);
        const humIndicator = this._panel._trendAnalysisManager.getTrendIndicator(humTrendData);
        if (humIndicator && humIndicator.text !== '→ stable') {
          trendHTML += `<span class="trend-indicator hum-trend" style="color: ${humIndicator.color}; font-size: 0.7em; margin-left: 4px;" title="Humidity trend: ${humIndicator.text}">💧${humIndicator.text}</span>`;
        }
      }
    } catch (error) {
      console.warn('[FloorManager] Error getting trend data for room card:', error);
    }

    const cardStateClass = this._isRoomActive(room) ? 'is-on' : 'is-off';

    return `
      <div class="swiper-slide">
        <div class="room-card ${cardStateClass}" data-navigation-path="${navPath}">
          <div class="room-card-grid">
            <div class="room-card-name">${roomName}</div>
            <div class="room-card-icon-cell"><i class="mdi ${roomIcon}"></i></div>
            <div class="room-card-temp">${tempHumHTML}${trendHTML}</div>
          </div>
        </div>
      </div>`;
  }

  _initializeCardListeners(cardElement) {
    if (!cardElement) return;
    
    // Use gesture detector for both tap and long-tap functionality
    this._gestureDetector.attachToElement(cardElement, {
      onTap: (element, event) => {
        // Maintain existing click functionality
        const entityId = element.dataset.entityId;
        const navPath = element.dataset.navigationPath;
        if (navPath) {
          window.location.hash = navPath;
        } else if (entityId) {
          this._hass.callService('homeassistant', 'toggle', { entity_id: entityId });
        }
      },
      
      onLongTap: (element, event) => {
        // Long-tap now opens entity details popup directly
        const entityId = element.dataset.entityId;
        const navPath = element.dataset.navigationPath;
        
        if (entityId) {
          console.log('[FloorManager] Long-tap detected on entity:', entityId);
          // Open entity details popup
          window.location.hash = `#entity-details-${entityId}`;
        } else if (navPath) {
          console.log('[FloorManager] Long-tap detected on room card');
          // Open room popup
          window.location.hash = navPath;
        }
      },
      
      onLongTapStart: (element, event) => {
        // Optional: Additional feedback when long-tap starts
        console.log('[FloorManager] Long-tap started on element');
      }
    });
  }

  /**
   * Get display data for temperature and humidity sensors
   * @param {Object} entityState - The entity state object
   * @param {string} type - The entity type (temperatur or humidity)
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getTemperatureHumidityDisplayData(entityState, type) {
    const { TEMPERATUR, HUMIDITY } = this._panel._entityLabels;
    
    if (type === TEMPERATUR) {
      const tempValue = parseFloat(entityState?.state);
      return {
        name: 'Temperatur',
        label: isNaN(tempValue) ? '--°' : `${tempValue.toFixed(1)}°`,
        icon: 'mdi:thermometer',
        cardClass: ''
      };
    } else if (type === HUMIDITY) {
      const humValue = parseFloat(entityState?.state);
      return {
        name: 'Luftfeuchtigkeit',
        label: isNaN(humValue) ? '--%' : `${Math.round(humValue)}%`,
        icon: 'mdi:water-percent',
        cardClass: ''
      };
    }
    
    return this._getDefaultDisplayData(entityState, type);
  }

  /**
   * Get display data for light entities
   * @param {Object} entityState - The entity state object
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getLightDisplayData(entityState) {
    const isOn = entityState?.state === 'on';
    const icon = isOn ? 
      (entityState?.attributes.icon || 'mdi:lightbulb') : 
      (entityState?.attributes.icon || 'mdi:lightbulb-outline');
    
    let label = 'Aus';
    let cardClass = '';
    
    if (isOn) {
      label = entityState.attributes.brightness ? 
        `${Math.round(entityState.attributes.brightness / 2.55)}%` : 
        'An';
      cardClass = 'active-light';
    }
    
    return {
      name: entityState?.attributes.friendly_name || 'Light',
      label,
      icon,
      cardClass
    };
  }

  /**
   * Get display data for cover entities
   * @param {Object} entityState - The entity state object
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getCoverDisplayData(entityState) {
    const position = entityState?.attributes.current_position || 0;
    const isOpen = position > 20;
    
    let icon, label, cardClass = '';
    
    if (isOpen) {
      icon = 'mdi:window-shutter-open';
      label = `Offen - ${position}%`;
      // Don't set cardClass here as global logic will handle 'is-on'
    } else {
      icon = 'mdi:window-shutter';
      label = `Geschlossen - ${position}%`;
    }
    
    return {
      name: entityState?.attributes.friendly_name || 'Cover',
      label,
      icon,
      cardClass
    };
  }

  /**
   * Get display data for general binary sensors (motion, window, smoke, vibration)
   * @param {Object} entityState - The entity state object
   * @param {string} type - The entity type
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getGeneralSensorDisplayData(entityState, type) {
    const { MOTION, WINDOW, SMOKE, VIBRATION } = this._panel._entityLabels;
    const isOn = entityState.state === 'on';
    
    let icon, label, name;
    
    switch (type) {
      case MOTION:
        icon = isOn ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
        label = isOn ? 'Erkannt' : 'Klar';
        name = 'Motion';
        break;
      case WINDOW:
        icon = isOn ? 'mdi:window-open-variant' : 'mdi:window-closed';
        label = isOn ? 'Offen' : 'Geschlossen';
        name = 'Window';
        break;
      case SMOKE:
        icon = isOn ? 'mdi:smoke-detector-variant-alert' : 'mdi:smoke-detector-variant';
        label = isOn ? 'Erkannt' : 'Klar';
        name = 'Smoke Detector';
        break;
      case VIBRATION:
        icon = isOn ? 'mdi:vibrate' : 'mdi:vibrate-off';
        label = isOn ? 'Erkannt' : 'Klar';
        name = 'Vibration';
        break;
      default:
        return this._getDefaultDisplayData(entityState, type);
    }
    
    return {
      name: entityState?.attributes.friendly_name || name,
      label,
      icon,
      cardClass: ''
    };
  }

  /**
   * Get display data for media player entities
   * @param {Object} entityState - The entity state object
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getMediaPlayerDisplayData(entityState) {
    const state = entityState?.state;
    let label;
    
    if (state === 'playing') {
      label = 'Playing';
    } else if (['idle', 'standby', 'off'].includes(state)) {
      label = 'Aus';
    } else {
      label = state ? state.charAt(0).toUpperCase() + state.slice(1) : 'N/A';
    }
    
    return {
      name: entityState?.attributes.friendly_name || 'Media Player',
      label,
      icon: 'mdi:music',
      cardClass: ''
    };
  }

  /**
   * Get display data for door entities
   * @param {Object} entityState - The entity state object
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getDoorDisplayData(entityState) {
    const doorState = entityState?.state?.toLowerCase();
    let icon, label, cardClass;
    
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
      label = entityState?.state ? 
        entityState.state.charAt(0).toUpperCase() + entityState.state.slice(1) : 
        'N/A';
      cardClass = '';
    }
    
    return {
      name: entityState?.attributes.friendly_name || 'Door',
      label,
      icon,
      cardClass
    };
  }

  /**
   * Get display data for appliance entities (hoover, mower)
   * @param {Object} entityState - The entity state object
   * @param {string} type - The entity type (hoover or mower)
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getApplianceDisplayData(entityState, type) {
    if (type === 'hoover') {
      return this._getVacuumDisplayData(entityState);
    } else if (type === 'mower') {
      return this._getMowerDisplayData(entityState);
    }
    
    return this._getDefaultDisplayData(entityState, type);
  }

  /**
   * Get default display data for unknown or unhandled entity types
   * @param {Object} entityState - The entity state object
   * @param {string} type - The entity type
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getDefaultDisplayData(entityState, type) {
    let label = entityState?.state || 'N/A';
    let cardClass = '';
    
    // German translations for common states
    if (entityState?.state === 'on') {
      label = 'An';
      cardClass = 'is-on';
    } else if (entityState?.state === 'off') {
      label = 'Aus';
    } else if (entityState?.state === 'unavailable') {
      label = 'Nicht verfügbar';
      cardClass = 'is-unavailable';
    } else if (entityState?.state === 'unknown') {
      label = 'Unbekannt';
    } else if (entityState?.state === 'idle') {
      label = 'Bereit';
    } else if (entityState?.state === 'active') {
      label = 'Aktiv';
      cardClass = 'is-on';
    } else if (entityState?.state === 'locked') {
      label = 'Verriegelt';
    } else if (entityState?.state === 'unlocked') {
      label = 'Zu';
      cardClass = 'is-on';
    } else if (entityState?.state === 'open') {
      label = 'Offen';
      cardClass = 'is-on';
    } else if (entityState?.state === 'closed') {
      label = 'Geschlossen';
    } else if (entityState?.state) {
      // For numeric states, keep the value as is
      const numericValue = parseFloat(entityState.state);
      if (!isNaN(numericValue)) {
        label = entityState.state;
      } else {
        // Capitalize first letter for other states
        label = entityState.state.charAt(0).toUpperCase() + entityState.state.slice(1);
      }
    }
    
    // Try to get a better icon based on entity domain or custom icon
    let icon = this._getIconForEntityType(entityState, type);
    
    // Add type-specific card class for better styling
    const typeCardClass = this._getTypeSpecificCardClass(type);
    const finalCardClass = [cardClass, typeCardClass].filter(Boolean).join(' ').trim();
    
    return {
      name: entityState?.attributes.friendly_name || this._getTypeDisplayName(type),
      label,
      icon,
      cardClass: finalCardClass
    };
  }

  /**
   * Get appropriate icon for entity type with fallback logic
   * @param {Object} entityState - The entity state object
   * @param {string} type - The entity type
   * @returns {string} Icon name
   */
  _getIconForEntityType(entityState, type) {
    // First try to use custom icon from entity attributes
    if (entityState?.attributes?.icon) {
      return entityState.attributes.icon;
    }
    
    // Domain-based icon mapping for common entity types
    const domain = type.includes('.') ? type.split('.')[0] : type;
    const iconMap = {
      'climate': 'mdi:thermostat',
      'switch': 'mdi:toggle-switch',
      'fan': 'mdi:fan',
      'alarm_control_panel': 'mdi:shield-home',
      'lock': 'mdi:lock',
      'binary_sensor': 'mdi:radiobox-marked',
      'sensor': 'mdi:gauge',
      'input_boolean': 'mdi:toggle-switch',
      'input_select': 'mdi:format-list-bulleted',
      'input_number': 'mdi:numeric',
      'input_text': 'mdi:form-textbox',
      'automation': 'mdi:robot',
      'script': 'mdi:script-text',
      'scene': 'mdi:palette',
      'timer': 'mdi:timer',
      'counter': 'mdi:counter',
      'device_tracker': 'mdi:map-marker',
      'person': 'mdi:account',
      'zone': 'mdi:map-marker-radius',
      'sun': 'mdi:white-balance-sunny',
      'weather': 'mdi:weather-partly-cloudy',
      'camera': 'mdi:camera',
      'vacuum': 'mdi:robot-vacuum',
      'lawn_mower': 'mdi:robot-mower',
      'water_heater': 'mdi:water-boiler',
      'humidifier': 'mdi:air-humidifier',
      'air_quality': 'mdi:air-filter'
    };
    
    return iconMap[domain] || 'mdi:help-circle';
  }

  /**
   * Get type-specific CSS class for better visual differentiation
   * @param {string} type - The entity type
   * @returns {string} CSS class name
   */
  _getTypeSpecificCardClass(type) {
    const domain = type.includes('.') ? type.split('.')[0] : type;
    const classMap = {
      'climate': 'climate-entity',
      'switch': 'switch-entity',
      'fan': 'fan-entity',
      'alarm_control_panel': 'alarm-entity',
      'lock': 'lock-entity',
      'binary_sensor': 'binary-sensor-entity',
      'sensor': 'sensor-entity',
      'vacuum': 'vacuum-entity',
      'lawn_mower': 'mower-entity',
      'device_tracker': 'tracker-entity',
      'person': 'person-entity'
    };
    
    return classMap[domain] || 'unknown-entity';
  }

  /**
   * Get display name for entity type
   * @param {string} type - The entity type
   * @returns {string} Friendly display name
   */
  _getTypeDisplayName(type) {
    const domain = type.includes('.') ? type.split('.')[0] : type;
    const nameMap = {
      'climate': 'Klima',
      'switch': 'Schalter',
      'fan': 'Lüfter',
      'alarm_control_panel': 'Alarmanlage',
      'lock': 'Schloss',
      'binary_sensor': 'Binärer Sensor',
      'sensor': 'Sensor',
      'input_boolean': 'Eingabe (Boolean)',
      'input_select': 'Auswahl',
      'input_number': 'Eingabe (Zahl)',
      'input_text': 'Eingabe (Text)',
      'automation': 'Automatisierung',
      'script': 'Skript',
      'scene': 'Szene',
      'timer': 'Timer',
      'counter': 'Zähler',
      'device_tracker': 'Geräteverfolgung',
      'person': 'Person',
      'zone': 'Zone',
      'sun': 'Sonne',
      'weather': 'Wetter',
      'camera': 'Kamera',
      'vacuum': 'Staubsauger',
      'lawn_mower': 'Rasenmäher',
      'water_heater': 'Warmwasserbereiter',
      'humidifier': 'Luftbefeuchter',
      'air_quality': 'Luftqualität'
    };
    
    return nameMap[domain] || type;
  }

  /**
   * Get card display data for entities - acts as dispatcher to type-specific functions
   * @param {string} entityId - The entity ID
   * @param {string} type - The entity type
   * @returns {Object} Display data object with name, label, icon, cardClass
   */
  _getCardDisplayData(entityId, type) {
    const entityState = this._hass.states[entityId];

    // Handle unavailable entities first
    if (!entityState || entityState.state === 'unavailable') {
      return {
        name: entityState?.attributes.friendly_name || entityId,
        label: 'Nicht verfügbar',
        icon: 'mdi:help-circle',
        cardClass: 'is-unavailable'
      };
    }

    // Get type-specific display data
    const { TEMPERATUR, HUMIDITY, LIGHT, MOTION, WINDOW, COVER, SMOKE, VIBRATION } = this._panel._entityLabels;
    let displayData;

    // Dispatch to appropriate type-specific function
    if (type === TEMPERATUR || type === HUMIDITY) {
      displayData = this._getTemperatureHumidityDisplayData(entityState, type);
    } else if (type === LIGHT) {
      displayData = this._getLightDisplayData(entityState);
    } else if (type === COVER) {
      displayData = this._getCoverDisplayData(entityState);
    } else if ([MOTION, WINDOW, SMOKE, VIBRATION].includes(type)) {
      displayData = this._getGeneralSensorDisplayData(entityState, type);
    } else if (type === 'media_player') {
      displayData = this._getMediaPlayerDisplayData(entityState);
    } else if (type === 'hoover' || type === 'mower') {
      displayData = this._getApplianceDisplayData(entityState, type);
    } else if (type?.toLowerCase() === 'door' || type?.toLowerCase() === 'other_door' || 
               (type?.toLowerCase() === 'lock' && entityId.toLowerCase().includes('door'))) {
      displayData = this._getDoorDisplayData(entityState);
    } else {
      displayData = this._getDefaultDisplayData(entityState, type);
    }

    // Apply global state-based classes
    let globalCardClass = '';
    if (entityState.state === 'on' || 
        entityState.state === 'Run' || 
        entityState.state === 'playing' || 
        (type === 'cover' && entityState.state === 'open')) {
      globalCardClass = 'is-on';
    }

    // Merge global class with type-specific class
    const finalCardClass = [globalCardClass, displayData.cardClass]
      .filter(Boolean)
      .join(' ')
      .trim();

    return {
      ...displayData,
      cardClass: finalCardClass
    };
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
        return { icon: 'mdi:home-floor-a', label: 'Zimmerreinigung', cardClass: 'vacuum-room-cleaning' };
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
      return { name: 'Mower', icon: 'mdi:robot-mower-outline', label: 'Nicht verfügbar', cardClass: 'is-unavailable' };
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

    // Handle error states - only if the entity state is "error" AND there is a valid error message
    if (state === 'error' && (isValidError(error) || isValidError(lastError))) {
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
      return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-alert', label: errorMessage, cardClass: 'mower-error' };
    }

    // Handle normal states
    switch (state) {
      case 'mowing':
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower', label: 'Mäht', cardClass: 'is-on' };
      case 'cleaning':
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower', label: 'Mäht', cardClass: 'mower-cleaning' };
      case 'charging':
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: `Lädt ${batteryLevel || 0}%`, cardClass: '' };
      case 'docked':
      case 'parked':
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: 'Geparkt', cardClass: '' };
      case 'going_home':
      case 'returning':
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: 'Kehrt zurück', cardClass: 'is-on' };
      case 'paused':
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: 'Pausiert', cardClass: 'is-on' };
      case 'idle':
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: 'Bereit', cardClass: '' };
      case 'error':
        // Generic error state when no specific error message is available
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-alert', label: 'Fehler', cardClass: 'mower-error' };
      case 'ok':
        // Use activity if available
        if (activity) {
          switch (activity.toLowerCase()) {
            case 'mowing':
              return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower', label: 'Mäht', cardClass: 'is-on' };
            case 'cleaning':
              return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower', label: 'Mäht', cardClass: 'mower-cleaning' };
            case 'charging':
              return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: `Lädt ${batteryLevel || 0}%`, cardClass: '' };
            case 'parked':
              return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: 'Geparkt', cardClass: '' };
            case 'going_home':
              return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: 'Kehrt zurück', cardClass: 'is-on' };
            case 'none':
              return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: 'Bereit', cardClass: '' };
          }
        }
        return { name: entityState?.attributes.friendly_name || 'Mower', icon: 'mdi:robot-mower-outline', label: 'Bereit', cardClass: '' };
    }

    // Fallback
    return { 
      name: entityState?.attributes.friendly_name || 'Mower',
      icon: 'mdi:robot-mower-outline', 
      label: state ? state.charAt(0).toUpperCase() + state.slice(1) : 'Unbekannt', 
      cardClass: '' 
    };
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
      return calculateTimeDifferenceShort(entityState.last_changed);
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

  /**
   * Render a container for multiple person cards (for big slots)
   * @param {string} gridArea - The CSS grid area
   * @returns {Promise<string>} HTML for person cards container
   */
  async _renderPersonCardsContainer(gridArea) {
    if (!this._houseConfig.persons) {
      return `<div style="grid-area: ${gridArea};" class="person-cards-empty">
        <i class="mdi mdi-account-group"></i>
        <h4>No Person Cards</h4>
        <p>Configure persons in the admin panel to display person cards here.</p>
      </div>`;
    }

    const enabledPersons = Object.entries(this._houseConfig.persons)
      .filter(([personId, config]) => config.enabled)
      .map(([personId, config]) => ({ personId, config }));

    if (enabledPersons.length === 0) {
      return `<div style="grid-area: ${gridArea};" class="person-cards-empty">
        <i class="mdi mdi-account-off"></i>
        <h4>No Enabled Persons</h4>
        <p>Enable persons in the admin panel to display their cards.</p>
      </div>`;
    }

    const personsPromises = enabledPersons.map(({ personId, config }) => 
      this._generatePersonCardHTML(personId, config)
    );
    const personsHTML = (await Promise.all(personsPromises)).join('');

    return `
      <div style="grid-area: ${gridArea};" class="person-cards-section">
        <h3><i class="mdi mdi-account-group"></i> People</h3>
        <div class="person-cards-container">
          ${personsHTML}
        </div>
      </div>
    `;
  }

  /**
   * Render a single person card (for small slots)
   * @param {string} personId - The person entity ID
   * @param {string} gridArea - The CSS grid area
   * @returns {Promise<string>} HTML for single person card
   */
  async _renderSinglePersonCard(personId, gridArea) {
    const personConfig = this._houseConfig.persons?.[personId];
    if (!personConfig || !personConfig.enabled) {
      return `<div style="grid-area: ${gridArea};"></div>`;
    }

    const cardHTML = await this._generatePersonCardHTML(personId, personConfig);
    return `<div style="grid-area: ${gridArea};">${cardHTML}</div>`;
  }

  /**
   * Generate HTML for a person card using template data
   * @param {string} personId - The person entity ID
   * @param {Object} personConfig - Person configuration from admin panel
   * @returns {Promise<string>} HTML for person card
   */
  async _generatePersonCardHTML(personId, personConfig) {
    const personEntity = this._hass.states[personId];
    if (!personEntity) {
      return `<div class="person-card-error">Person ${personId} not found</div>`;
    }

    // Get location data
    const locationData = this._getPersonLocationData(personConfig);
    
    // Get battery data
    const batteryData = this._getPersonBatteryData(personConfig);
    
    // Get current activity
    const currentActivity = this._getPersonCurrentActivity(personConfig);
    
    // Format template data
    const templateData = {
      entity_id: personId,
      friendly_name: personConfig.friendly_name || personEntity.attributes.friendly_name || personId,
      state: personEntity.state,
      state_class: personEntity.state.toLowerCase().replace('_', ''),
      state_icon: this._getPersonStateIcon(personEntity.state),
      state_display: this._formatPersonState(personEntity.state),
      location_display: locationData.current,
      last_seen_display: this._formatLastSeen(personEntity.last_updated),
      battery_level: batteryData.level,
      battery_class: batteryData.level ? 'visible' : 'hidden',
      toggle_action: personEntity.state === 'home' ? 'Away' : 'Home',
      toggle_icon: personEntity.state === 'home' ? 'mdi-home-export-outline' : 'mdi-home-import-outline',
      current_activity: currentActivity,
      activity_class: currentActivity ? '' : 'hidden'
    };

    // Load and populate person card template
    return await this._populatePersonCardTemplate(templateData);
  }

  /**
   * Get location data for a person
   * @param {Object} personConfig - Person configuration
   * @returns {Object} Location data
   */
  _getPersonLocationData(personConfig) {
    if (!personConfig.device_trackers || personConfig.device_trackers.length === 0) {
      return { current: 'Unknown', lastSeen: null };
    }

    // Use first available device tracker
    for (const trackerId of personConfig.device_trackers) {
      const trackerEntity = this._hass.states[trackerId];
      if (trackerEntity) {
        return {
          current: this._formatLocationName(trackerEntity.state),
          lastSeen: trackerEntity.last_changed
        };
      }
    }

    return { current: 'Unknown', lastSeen: null };
  }

  /**
   * Get battery data for a person
   * @param {Object} personConfig - Person configuration
   * @returns {Object} Battery data
   */
  _getPersonBatteryData(personConfig) {
    if (!personConfig.sensors) {
      return { level: null, color: '#666' };
    }

    // Look for battery sensor
    for (const sensorId of personConfig.sensors) {
      const sensorEntity = this._hass.states[sensorId];
      if (sensorEntity && sensorEntity.attributes.device_class === 'battery') {
        const level = parseInt(sensorEntity.state, 10);
        if (isNaN(level)) {
          return { level: null, color: '#666' };
        }
        const color = level > 50 ? '#4CAF50' : level > 20 ? '#FF9800' : '#F44336';
        return { level, color };
      }
    }

    return { level: null, color: '#666' };
  }

  /**
   * Get current activity for a person
   * @param {Object} personConfig - Person configuration
   * @returns {string|null} Current activity text
   */
  _getPersonCurrentActivity(personConfig) {
    // This would need calendar integration - placeholder for now
    return null;
  }

  /**
   * Populate person card template with data
   * @param {Object} data - Template data
   * @returns {Promise<string>} Populated HTML
   */
  async _populatePersonCardTemplate(data) {
    try {
      const template = await this._loadTemplate('person-card');
      
      // Replace all placeholders with actual data
      return template
        .replace(/\{\{entity_id\}\}/g, data.entity_id)
        .replace(/\{\{friendly_name\}\}/g, data.friendly_name)
        .replace(/\{\{state\}\}/g, data.state)
        .replace(/\{\{state_class\}\}/g, data.state_class)
        .replace(/\{\{state_icon\}\}/g, data.state_icon)
        .replace(/\{\{state_display\}\}/g, data.state_display)
        .replace(/\{\{location_display\}\}/g, data.location_display)
        .replace(/\{\{last_seen_display\}\}/g, data.last_seen_display)
        .replace(/\{\{battery_level\}\}/g, data.battery_level || '')
        .replace(/\{\{battery_class\}\}/g, data.battery_class || 'hidden')
        .replace(/\{\{toggle_action\}\}/g, data.toggle_action)
        .replace(/\{\{toggle_icon\}\}/g, data.toggle_icon)
        .replace(/\{\{current_activity\}\}/g, data.current_activity || '')
        .replace(/\{\{activity_class\}\}/g, data.activity_class || 'hidden');
    } catch (error) {
      console.error('[FloorManager] Error populating person card template:', error);
      // Fallback to hardcoded template
      return this._getFallbackPersonCardTemplate()
        .replace(/\{\{entity_id\}\}/g, data.entity_id)
        .replace(/\{\{friendly_name\}\}/g, data.friendly_name)
        .replace(/\{\{state\}\}/g, data.state)
        .replace(/\{\{state_class\}\}/g, data.state_class)
        .replace(/\{\{state_icon\}\}/g, data.state_icon)
        .replace(/\{\{state_display\}\}/g, data.state_display)
        .replace(/\{\{location_display\}\}/g, data.location_display)
        .replace(/\{\{last_seen_display\}\}/g, data.last_seen_display)
        .replace(/\{\{battery_level\}\}/g, data.battery_level || '')
        .replace(/\{\{battery_class\}\}/g, data.battery_class || 'hidden')
        .replace(/\{\{toggle_action\}\}/g, data.toggle_action)
        .replace(/\{\{toggle_icon\}\}/g, data.toggle_icon)
        .replace(/\{\{current_activity\}\}/g, data.current_activity || '')
        .replace(/\{\{activity_class\}\}/g, data.activity_class || 'hidden');
    }
  }

  /**
   * Initialize event handlers for person cards
   * @param {HTMLElement} card - The person card element
   */
  _initializePersonCardHandlers(card) {
    // Handle popup opening (main card click)
    card.addEventListener('click', (e) => {
      // Don't trigger popup if clicking on action buttons
      if (e.target.closest('.person-quick-action-btn')) {
        return;
      }
      
      const entityId = card.dataset.entityId;
      if (entityId) {
        window.location.hash = `#entity-details-${entityId}`;
      }
    });

    // Handle quick actions
    const toggleButton = card.querySelector('.person-presence-toggle');
    if (toggleButton) {
      toggleButton.addEventListener('click', (e) => {
        e.stopPropagation();
        this._handlePersonPresenceToggle(toggleButton);
      });
    }
  }

  /**
   * Handle person presence toggle action
   * @param {HTMLElement} button - The toggle button
   */
  async _handlePersonPresenceToggle(button) {
    const personId = button.dataset.personId;
    const currentState = button.dataset.currentState;
    
    if (!personId || !this._hass) return;
    
    try {
      const newState = currentState === 'home' ? 'not_home' : 'home';
      
      await this._hass.callService('person', 'set_location', {
        entity_id: personId,
        location: newState
      });
      
      console.log(`[FloorManager] Person ${personId} presence toggled to ${newState}`);
      
      // Update button visual feedback
      button.style.opacity = '0.6';
      setTimeout(() => {
        button.style.opacity = '1';
      }, 300);
      
    } catch (error) {
      console.error('[FloorManager] Error toggling person presence:', error);
      
      // Visual error feedback
      button.style.background = '#F44336';
      setTimeout(() => {
        button.style.background = '';
      }, 1000);
    }
  }

  // Helper methods for person data formatting

  _getPersonStateIcon(state) {
    const stateIcons = {
      'home': 'mdi-home',
      'away': 'mdi-home-export-outline',
      'not_home': 'mdi-home-export-outline',
      'unknown': 'mdi-help-circle'
    };
    return stateIcons[state.toLowerCase()] || 'mdi-account';
  }

  _formatPersonState(state) {
    const stateNames = {
      'home': 'Home',
      'away': 'Away',
      'not_home': 'Away',
      'unknown': 'Unknown'
    };
    return stateNames[state.toLowerCase()] || state;
  }

  _formatLocationName(rawLocation) {
    if (!rawLocation) return 'Unknown';
    
    const locationMap = {
      'home': 'Home',
      'away': 'Away',
      'not_home': 'Away',
      'unknown': 'Unknown'
    };

    return locationMap[rawLocation.toLowerCase()] || rawLocation;
  }

  _formatLastSeen(timestamp) {
    if (!timestamp) return 'Unknown';
    
    // Use time utilities if available
    if (this._panel._timeUtils && this._panel._timeUtils.calculateTimeDifferenceShort) {
      return this._panel._timeUtils.calculateTimeDifferenceShort(timestamp);
    }
    
    // Fallback calculation
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    
    if (diffMinutes < 1) return 'Jetzt';
    if (diffMinutes < 60) return `vor ${diffMinutes}m`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `vor ${diffHours}h`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `vor ${diffDays} Tagen`;
  }

  /**
   * Update an existing person card with current data
   * @param {HTMLElement} card - The person card element
   * @param {string} entityId - The person entity ID
   */
  _updatePersonCard(card, entityId) {
    const personConfig = this._houseConfig.persons?.[entityId];
    if (!personConfig || !personConfig.enabled) return;

    const personEntity = this._hass.states[entityId];
    if (!personEntity) return;

    try {
      // Get updated data
      const locationData = this._getPersonLocationData(personConfig);
      const batteryData = this._getPersonBatteryData(personConfig);

      // Update person name
      const nameEl = card.querySelector('.person-name');
      if (nameEl) {
        nameEl.textContent = personConfig.friendly_name || personEntity.attributes.friendly_name || entityId;
      }

      // Update location
      const locationEl = card.querySelector('.person-location');
      if (locationEl) {
        locationEl.textContent = locationData.current;
      }

      // Update status badge
      const statusBadge = card.querySelector('.person-status-badge');
      if (statusBadge) {
        statusBadge.className = `person-status-badge ${personEntity.state.toLowerCase().replace('_', '')}`;
        const statusIcon = statusBadge.querySelector('i');
        const statusText = statusBadge.querySelector('span');
        if (statusIcon) statusIcon.className = `mdi ${this._getPersonStateIcon(personEntity.state)}`;
        if (statusText) statusText.textContent = this._formatPersonState(personEntity.state);
      }

      // Update last seen
      const lastSeenEl = card.querySelector('.person-last-seen');
      if (lastSeenEl) {
        lastSeenEl.textContent = this._formatLastSeen(personEntity.last_updated);
      }

      // Update battery level
      const batteryEl = card.querySelector('.person-battery');
      const batteryIcon = card.querySelector('.person-activity-item i[class*="mdi-battery"]');
      const batteryItem = card.querySelector('.person-battery-item');
      
      if (batteryData.level) {
        if (batteryEl) batteryEl.textContent = `${batteryData.level}%`;
        if (batteryIcon) {
          // Remove old battery color classes
          batteryIcon.classList.remove('battery-high', 'battery-medium', 'battery-low', 'battery-unknown');
          // Add appropriate battery color class
          if (batteryData.level > 50) {
            batteryIcon.classList.add('battery-high');
          } else if (batteryData.level > 20) {
            batteryIcon.classList.add('battery-medium');
          } else {
            batteryIcon.classList.add('battery-low');
          }
        }
        if (batteryItem) {
          batteryItem.classList.remove('hidden');
          batteryItem.classList.add('visible');
        }
      } else {
        if (batteryItem) {
          batteryItem.classList.remove('visible');
          batteryItem.classList.add('hidden');
        }
      }

      // Update toggle button
      const toggleButton = card.querySelector('.person-presence-toggle');
      if (toggleButton) {
        toggleButton.dataset.currentState = personEntity.state;
        toggleButton.title = `Toggle ${personEntity.state === 'home' ? 'Away' : 'Home'}`;
        const toggleIcon = toggleButton.querySelector('i');
        if (toggleIcon) {
          toggleIcon.className = `mdi ${personEntity.state === 'home' ? 'mdi-home-export-outline' : 'mdi-home-import-outline'}`;
        }
      }

    } catch (error) {
      console.error(`[FloorManager] Error updating person card for ${entityId}:`, error);
    }
  }

  /**
   * Render a custom card from YAML configuration
   * @param {string} customCardId - The ID of the custom card
   * @param {string} gridArea - The CSS grid area
   * @param {boolean} isBigSlot - Whether this is a big slot
   * @returns {Promise<string>} HTML for the custom card
   */
  async _renderCustomCard(customCardId, gridArea, isBigSlot) {
    try {
      const customCards = this._houseConfig.custom_cards || {};
      const cardConfig = customCards[customCardId];
      
      if (!cardConfig) {
        console.warn(`[FloorManager] Custom card '${customCardId}' not found`);
        return `<div style="grid-area: ${gridArea};" class="custom-card-error">
          <div class="error-content">
            <i class="mdi mdi-alert-circle"></i>
            <span>Card not found: ${customCardId}</span>
          </div>
        </div>`;
      }

      // Parse YAML configuration
      let parsedConfig;
      try {
        parsedConfig = SimpleYamlParser.parse(cardConfig.yaml_config);
      } catch (yamlError) {
        console.error(`[FloorManager] YAML parsing error for card '${customCardId}':`, yamlError);
        return `<div style="grid-area: ${gridArea};" class="custom-card-error">
          <div class="error-content">
            <i class="mdi mdi-alert-circle"></i>
            <span>YAML Error: ${yamlError.message}</span>
          </div>
        </div>`;
      }

      // Extract entity IDs for state management
      const entityIds = SimpleYamlParser.extractEntityIds(parsedConfig);
      if (entityIds.length > 0) {
        this._panel._stateManager.watchEntities(entityIds, () => {
          this._updateCustomCard(customCardId, gridArea);
        });
      }

      // Create custom card wrapper
      const sizeClass = isBigSlot ? 'custom-card-big' : 'custom-card-small';
      const cardElementId = `custom-card-${customCardId}-${gridArea.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      return `<div style="grid-area: ${gridArea};" class="custom-card-wrapper ${sizeClass}" id="${cardElementId}" data-custom-card-id="${customCardId}">
        <div class="custom-card-content" data-card-config='${JSON.stringify(parsedConfig)}'>
          ${this._renderLovelaceCard(parsedConfig, cardElementId)}
        </div>
      </div>`;

    } catch (error) {
      console.error(`[FloorManager] Error rendering custom card '${customCardId}':`, error);
      return `<div style="grid-area: ${gridArea};" class="custom-card-error">
        <div class="error-content">
          <i class="mdi mdi-alert-circle"></i>
          <span>Render Error</span>
        </div>
      </div>`;
    }
  }

  /**
   * Render a Home Assistant Lovelace card from parsed config
   * @param {Object} config - Parsed card configuration
   * @param {string} elementId - Unique element ID
   * @returns {string} HTML for the Lovelace card
   */
  _renderLovelaceCard(config, elementId) {
    try {
      // For now, render basic card types that don't require complex HA frontend integration
      switch (config.type) {
        case 'markdown':
          return this._renderMarkdownCard(config);
        case 'entity':
          return this._renderEntityCard(config);
        case 'button':
          return this._renderButtonCard(config);
        case 'picture':
          return this._renderPictureCard(config);
        default:
          // For complex card types, create a placeholder that can be enhanced later
          return `<div class="custom-card-placeholder">
            <div class="placeholder-header">
              <i class="mdi mdi-card-text-outline"></i>
              <span>${config.type || 'Custom'} Card</span>
            </div>
            <div class="placeholder-content">
              <p>Card type: ${config.type}</p>
              ${config.entity ? `<p>Entity: ${config.entity}</p>` : ''}
              ${config.title ? `<p>Title: ${config.title}</p>` : ''}
            </div>
          </div>`;
      }
    } catch (error) {
      console.error('[FloorManager] Error rendering Lovelace card:', error);
      return `<div class="custom-card-error">
        <i class="mdi mdi-alert"></i>
        <span>Card render error</span>
      </div>`;
    }
  }

  /**
   * Render a markdown card
   */
  _renderMarkdownCard(config) {
    const content = config.content || '';
    const title = config.title || '';
    
    // Simple markdown-to-HTML conversion for basic formatting
    let htmlContent = content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\n/g, '<br>');

    // Replace entity state templates like {{ states('sensor.temperature') }}
    htmlContent = this._replaceEntityTemplates(htmlContent);

    return `<div class="markdown-card">
      ${title ? `<div class="card-header">${title}</div>` : ''}
      <div class="markdown-content">${htmlContent}</div>
    </div>`;
  }

  /**
   * Render an entity card
   */
  _renderEntityCard(config) {
    const entityId = config.entity;
    if (!entityId) {
      return '<div class="entity-card-error">No entity specified</div>';
    }

    const entityState = this._hass.states[entityId];
    if (!entityState) {
      return `<div class="entity-card-error">Entity not found: ${entityId}</div>`;
    }

    const name = config.name || entityState.attributes.friendly_name || entityId;
    const icon = config.icon || entityState.attributes.icon || 'mdi:help-circle';
    const showState = config.show_state !== false;

    return `<div class="entity-card" data-entity-id="${entityId}">
      <div class="entity-card-content">
        <i class="mdi ${this._panel._processIconName(icon)}"></i>
        <div class="entity-info">
          <div class="entity-name">${name}</div>
          ${showState ? `<div class="entity-state">${entityState.state}</div>` : ''}
        </div>
      </div>
    </div>`;
  }

  /**
   * Render a button card
   */
  _renderButtonCard(config) {
    const name = config.name || 'Button';
    const icon = config.icon || 'mdi:gesture-tap';
    const entityId = config.entity;

    return `<div class="button-card" ${entityId ? `data-entity-id="${entityId}"` : ''}>
      <div class="button-content">
        <i class="mdi ${this._panel._processIconName(icon)}"></i>
        <span class="button-name">${name}</span>
      </div>
    </div>`;
  }

  /**
   * Render a picture card
   */
  _renderPictureCard(config) {
    const image = config.image || '';
    const title = config.title || '';

    if (!image) {
      return '<div class="picture-card-error">No image specified</div>';
    }

    return `<div class="picture-card">
      ${title ? `<div class="card-header">${title}</div>` : ''}
      <img src="${image}" alt="${title}" class="picture-content" />
    </div>`;
  }

  /**
   * Replace entity state templates in content
   */
  _replaceEntityTemplates(content) {
    return content.replace(/\{\{\s*states\(['"]([^'"]+)['"]\)\s*\}\}/g, (match, entityId) => {
      const entityState = this._hass.states[entityId];
      return entityState ? entityState.state : 'unavailable';
    });
  }

  /**
   * Update a custom card when its entities change
   */
  _updateCustomCard(customCardId, gridArea) {
    const cardElementId = `custom-card-${customCardId}-${gridArea.replace(/[^a-zA-Z0-9]/g, '')}`;
    const cardElement = this._shadowRoot.getElementById(cardElementId);
    
    if (cardElement) {
      const contentElement = cardElement.querySelector('.custom-card-content');
      if (contentElement) {
        try {
          const config = JSON.parse(contentElement.dataset.cardConfig);
          const newContent = this._renderLovelaceCard(config, cardElementId);
          contentElement.innerHTML = newContent;
        } catch (error) {
          console.error(`[FloorManager] Error updating custom card ${customCardId}:`, error);
        }
      }
    }
  }

  /**
   * Render custom cards for the main dashboard (not in grid layout)
   */
  async renderCustomCardsMain() {
    const container = this._shadowRoot.querySelector('#custom-cards-main-container');
    if (!container) return;

    const customCards = this._houseConfig.custom_cards || {};
    
    // If no custom cards configured, hide the container
    if (Object.keys(customCards).length === 0) {
      container.innerHTML = '';
      return;
    }

    // Render all visible custom cards
    const cardPromises = Object.entries(customCards)
      .filter(([cardId, cardConfig]) => cardConfig.visible !== false) // Only include visible cards
      .map(async ([cardId, cardConfig]) => {
        return await this._renderCustomCardMain(cardId, cardConfig);
      });

    const cardHTMLArray = await Promise.all(cardPromises);
    container.innerHTML = cardHTMLArray.filter(html => html).join('');
  }

  /**
   * Render a single custom card for the main dashboard
   * @param {string} customCardId - The ID of the custom card
   * @param {Object} cardConfig - The card configuration
   * @returns {Promise<string>} HTML for the custom card
   */
  async _renderCustomCardMain(customCardId, cardConfig) {
    try {
      if (!cardConfig) {
        console.warn(`[FloorManager] Custom card '${customCardId}' not found`);
        return `<div class="custom-card-main-item custom-card-error">
          <div class="error-content">
            <i class="mdi mdi-alert-circle"></i>
            <span>Card not found: ${customCardId}</span>
          </div>
        </div>`;
      }

      // Parse YAML configuration
      let parsedConfig;
      try {
        parsedConfig = SimpleYamlParser.parse(cardConfig.yaml_config);
      } catch (yamlError) {
        console.error(`[FloorManager] YAML parsing error for card '${customCardId}':`, yamlError);
        return `<div class="custom-card-main-item custom-card-error">
          <div class="error-content">
            <i class="mdi mdi-alert-circle"></i>
            <span>YAML Error: ${yamlError.message}</span>
          </div>
        </div>`;
      }

      // Extract entity IDs for state management
      const entityIds = SimpleYamlParser.extractEntityIds(parsedConfig);
      if (entityIds.length > 0) {
        this._panel._stateManager.watchEntities(entityIds, () => {
          this._updateCustomCardMain(customCardId);
        });
      }

      // Create custom card wrapper for main dashboard
      const cardElementId = `custom-card-main-${customCardId.replace(/[^a-zA-Z0-9]/g, '')}`;
      
      return `<div class="custom-card-main-item" id="${cardElementId}" data-custom-card-id="${customCardId}">
        <div class="custom-card-content" data-card-config='${JSON.stringify(parsedConfig)}'>
          ${this._renderLovelaceCard(parsedConfig, cardElementId)}
        </div>
      </div>`;

    } catch (error) {
      console.error(`[FloorManager] Error rendering main custom card '${customCardId}':`, error);
      return `<div class="custom-card-main-item custom-card-error">
        <div class="error-content">
          <i class="mdi mdi-alert-circle"></i>
          <span>Error: ${error.message}</span>
        </div>
      </div>`;
    }
  }

  /**
   * Update a custom card in the main dashboard when its entities change
   */
  _updateCustomCardMain(customCardId) {
    const cardElementId = `custom-card-main-${customCardId.replace(/[^a-zA-Z0-9]/g, '')}`;
    const cardElement = this._shadowRoot.querySelector(`#${cardElementId}`);
    if (cardElement) {
      const contentElement = cardElement.querySelector('.custom-card-content');
      if (contentElement) {
        const configAttr = contentElement.getAttribute('data-card-config');
        if (configAttr) {
          try {
            const parsedConfig = JSON.parse(configAttr);
            contentElement.innerHTML = this._renderLovelaceCard(parsedConfig, cardElementId);
          } catch (error) {
            console.error(`[FloorManager] Error updating main custom card ${customCardId}:`, error);
          }
        }
      }
    }
  }
}
