/**
 * Dashview Home Module
 * Contains render methods for the Home tab (Räume section, Room Cards Grid, Floor Overview, Garbage Card)
 */

// Import utilities from shared modules
import { triggerHaptic } from '../../utils/haptic.js';
import { createSwipeHandlers } from '../../components/controls/swipeable.js';
import { getFloorIcon } from '../../utils/icons.js';
import { getEntityDisplayService } from '../../services/entity-display-service.js';
import { openMoreInfo, toggleLight, getFriendlyName } from '../../utils/helpers.js';

// Re-export for backwards compatibility
export { triggerHaptic };

/**
 * Render skeleton loading state for floor overview card
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Skeleton HTML
 */
export function renderFloorOverviewSkeleton(html) {
  return html`
    <div class="floor-overview-card loading">
      <div class="skeleton-slide">
        <div class="skeleton skeleton-name"></div>
        <div class="skeleton skeleton-icon"></div>
        <div class="skeleton skeleton-temp"></div>
      </div>
    </div>
  `;
}

/**
 * Render skeleton loading state for garbage card
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Skeleton HTML
 */
export function renderGarbageCardSkeleton(html) {
  return html`
    <div class="garbage-card loading">
      <div class="skeleton-slide">
        <div class="skeleton skeleton-icon"></div>
        <div class="skeleton skeleton-label"></div>
        <div class="skeleton skeleton-name"></div>
      </div>
    </div>
  `;
}

/**
 * Render skeleton loading state for room cards
 * @param {Function} html - lit-html template function
 * @param {boolean} isBig - Whether this is a big card
 * @returns {TemplateResult} Skeleton HTML
 */
export function renderRoomCardSkeleton(html, isBig = false) {
  return html`
    <div class="room-card ${isBig ? 'big' : 'small'} skeleton-card skeleton-room-card">
      <div class="skeleton-header">
        <div class="skeleton skeleton-text" style="width: 60px;"></div>
        <div class="skeleton skeleton-icon" style="width: 40px; height: 40px;"></div>
      </div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-text large" style="width: 50%;"></div>
        <div class="skeleton skeleton-text small"></div>
      </div>
    </div>
  `;
}

/**
 * Render DWD weather warnings in notification layout
 * @param {Object} component - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} DWD warnings HTML
 */
export function renderDwdWarnings(component, html) {
  const warnings = component._getDwdWarnings();
  if (!warnings || warnings.length === 0) return '';

  // Get the highest warning level for the card styling
  const maxLevel = Math.max(...warnings.map(w => w.level));
  const maxLevelIcon = warnings.find(w => w.level === maxLevel)?.icon || 'mdi:alert';

  // Combine all warning texts
  const combinedWarnings = warnings.map(warning =>
    `${warning.levelLabel} ${warning.name}${warning.endLabel ? ` (${warning.endLabel})` : ''}`
  ).join(' • ');

  return html`
    <div class="dwd-warnings">
      <div class="dwd-warning level-${maxLevel}">
        <div class="dwd-warning-icon">
          <ha-icon icon="${maxLevelIcon}"></ha-icon>
        </div>
        <div class="dwd-warning-content">
          <div class="dwd-warning-title">${combinedWarnings}</div>
        </div>
      </div>
    </div>
  `;
}

export function renderHomeTab(component, html) {
  return html`
    <div class="container">
      ${renderDwdWarnings(component, html)}
      ${renderTrainDepartures(component, html)}
      ${renderRaeumeSection(component, html)}
    </div>
  `;
}

/**
 * Render train departure notifications (uses popup-notification layout)
 * @param {Object} component - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Train departures HTML
 */
export function renderTrainDepartures(component, html) {
  const visibleTrains = component._getVisibleTrainDepartures();
  if (!visibleTrains || visibleTrains.length === 0) return '';

  return html`
    <div class="train-departures-section">
      ${visibleTrains.map(trainConfig => {
        const departure = component._getNextTrainDeparture(trainConfig);
        if (!departure) return '';

        return html`
          <div class="popup-notification train-notification">
            <div class="popup-notification-icon">🚆</div>
            <div class="popup-notification-title ${departure.isDelayed ? 'delayed' : ''}">${departure.time}</div>
            <div class="popup-notification-subtitle">${trainConfig.label || departure.destination}</div>
          </div>
        `;
      })}
    </div>
  `;
}

export function renderRaeumeSection(component, html) {
  // Use custom floor order if set, otherwise sort by level
  const sortedFloors = component._getOrderedFloors();

  // Set default active floor tab if not set
  if (!component._activeFloorTab && sortedFloors.length > 0) {
    component._activeFloorTab = sortedFloors[0].floor_id;
  }

  return html`
    <div class="raeume-section">
      <div class="raeume-header">
        <h2 class="raeume-title">Räume</h2>
        <div class="floor-tabs">
          ${sortedFloors.map(floor => html`
            <button
              class="floor-tab ${component._activeFloorTab === floor.floor_id ? 'active' : ''}"
              @click=${() => component._activeFloorTab = floor.floor_id}
              title="${floor.name}"
            >
              <ha-icon icon="${getFloorIcon(floor)}"></ha-icon>
            </button>
          `)}
        </div>
      </div>

      <!-- Room Cards Grid -->
      ${renderRoomCardsGrid(component, html)}
    </div>
  `;
}

export function renderFloorOverviewCard(component, html, floorId) {
  // Show skeleton while hass is not ready
  if (!component.hass || !component._areas || component._areas.length === 0) {
    return renderFloorOverviewSkeleton(html);
  }

  // Get all enabled rooms for this floor (enabled by default if not explicitly disabled)
  const roomsForFloor = component._getOrderedRoomsForFloor(floorId)
    .filter(area => component._enabledRooms[area.area_id] !== false);

  if (roomsForFloor.length === 0) {
    return html`
      <div class="floor-overview-card" style="display: flex; align-items: center; justify-content: center; background: var(--dv-gray000);">
        <span style="color: var(--secondary-text-color); font-size: 12px;">Keine Räume aktiviert</span>
      </div>
    `;
  }

  // Get current slide index for this floor
  const currentIndex = component._floorOverviewIndex[floorId] || 0;

  // Helper to get room data (temperature, humidity, motion state)
  const getRoomData = (room) => {
    const areaId = room.area_id;

    // Check motion sensors
    const motionSensors = component._getAreaMotionSensors(areaId).filter(s => s.enabled);
    const hasMotion = motionSensors.some(s => s.state === 'on');

    // Check lights
    const lights = component._getAreaLights(areaId).filter(l => l.enabled);
    const hasLightsOn = lights.some(l => l.state === 'on');

    // Get temperature
    const tempSensors = component._getAreaTemperatureSensors(areaId).filter(t => t.enabled);
    let temperature = null;
    if (tempSensors.length > 0 && component.hass?.states[tempSensors[0].entity_id]) {
      const tempState = component.hass.states[tempSensors[0].entity_id];
      const tempVal = parseFloat(tempState.state);
      if (!isNaN(tempVal)) {
        temperature = tempVal.toFixed(0);
      }
    }

    // Get humidity
    const humSensors = component._getAreaHumiditySensors(areaId).filter(h => h.enabled);
    let humidity = null;
    if (humSensors.length > 0 && component.hass?.states[humSensors[0].entity_id]) {
      const humState = component.hass.states[humSensors[0].entity_id];
      const humVal = parseFloat(humState.state);
      if (!isNaN(humVal)) {
        humidity = humVal.toFixed(0);
      }
    }

    // Active if motion or lights on
    const isActive = hasMotion || hasLightsOn;

    return { hasMotion, hasLightsOn, temperature, humidity, isActive };
  };

  const goToSlide = (index) => {
    if (index < 0) index = roomsForFloor.length - 1;
    if (index >= roomsForFloor.length) index = 0;
    triggerHaptic('selection');
    component._floorOverviewIndex = {
      ...component._floorOverviewIndex,
      [floorId]: index
    };
    component.requestUpdate();
  };

  const handleClick = (room) => {
    component._openRoomPopup(room.area_id);
  };

  // Create swipe handlers using the factory (persists state via element dataset)
  const swipeHandlers = createSwipeHandlers(
    () => goToSlide(currentIndex + 1),  // swipe left = next
    () => goToSlide(currentIndex - 1)   // swipe right = prev
  );

  return html`
    <div
      class="floor-overview-card"
      @touchstart=${swipeHandlers.handleTouchStart}
      @touchmove=${swipeHandlers.handleTouchMove}
      @touchend=${swipeHandlers.handleTouchEnd}
      @mousedown=${swipeHandlers.handleMouseDown}
      @mousemove=${swipeHandlers.handleMouseMove}
      @mouseup=${swipeHandlers.handleMouseUp}
      @mouseleave=${swipeHandlers.handleMouseLeave}
    >
      <div
        class="floor-overview-slides"
        style="transform: translateX(-${currentIndex * 100}%);"
      >
        ${roomsForFloor.map((room, idx) => {
          const data = getRoomData(room);
          return html`
            <div
              class="floor-overview-slide ${data.isActive ? 'active' : ''}"
              @click=${() => handleClick(room)}
            >
              <div class="floor-overview-slide-name">${room.name}</div>
              <div class="floor-overview-slide-icon">
                <ha-icon icon="${component._getAreaIcon(room)}"></ha-icon>
              </div>
              <div class="floor-overview-slide-temp">
                ${data.temperature ? html`${data.temperature}°` : ''}
                ${data.humidity ? html` <span class="floor-overview-slide-temp-humidity">${data.humidity}%</span>` : ''}
              </div>
            </div>
          `;
        })}
      </div>

      <!-- Pagination dots -->
      ${roomsForFloor.length > 1 ? html`
        <div class="floor-overview-pagination">
          ${roomsForFloor.map((_, idx) => html`
            <div
              class="floor-overview-dot ${idx === currentIndex ? 'active' : ''}"
              @click=${(e) => { e.stopPropagation(); goToSlide(idx); }}
            ></div>
          `)}
        </div>
      ` : ''}
    </div>
  `;
}

export function renderRoomCardsGrid(component, html) {
  // Get the floor config for the active floor
  const floorConfig = component._floorCardConfig[component._activeFloorTab] || {};
  const hasConfig = Object.keys(floorConfig).length > 0;
  const floorOverviewEnabled = component._floorOverviewEnabled[component._activeFloorTab];
  const garbageEnabled = component._garbageDisplayFloor === component._activeFloorTab && component._garbageSensors.length > 0;

  // If no config and no floor overview and no garbage, show message
  if (!hasConfig && !floorOverviewEnabled && !garbageEnabled) {
    return html`
      <div style="text-align: center; padding: 24px; color: var(--secondary-text-color);">
        Keine Karten konfiguriert. Konfiguriere Karten im Admin-Bereich unter "Floor Cards".
      </div>
    `;
  }

  // Helper to get entity state info using EntityDisplayService
  const getEntityInfo = (entityId) => {
    if (!entityId || !component.hass?.states[entityId]) return null;

    const state = component.hass.states[entityId];

    // Use EntityDisplayService for display logic
    const displayService = getEntityDisplayService();
    displayService.setEntityRegistry(component._entityRegistry || []);
    displayService.setLabelIds({
      motion: component._motionLabelId,
      window: component._windowLabelId,
      garage: component._garageLabelId,
      vibration: component._vibrationLabelId,
      smoke: component._smokeLabelId,
      temperature: component._temperatureLabelId,
      humidity: component._humidityLabelId,
      light: component._lightLabelId,
      cover: component._coverLabelId,
      climate: component._climateLabelId,
    });

    const displayInfo = displayService.getDisplayInfo(entityId, state);
    if (!displayInfo) return null;

    return {
      labelText: displayInfo.labelText,
      cardClass: displayInfo.cardClass,
      icon: displayInfo.icon,
      friendlyName: displayInfo.friendlyName,
      state: displayInfo.state,
    };
  };

  // Helper to render a single card based on entity config
  const renderCard = (slotIndex, isBig, gridArea) => {
    const slotConfig = floorConfig[slotIndex];

    if (!slotConfig || !slotConfig.entity_id) {
      return html`<div class="room-card ${isBig ? 'big' : 'small'} inactive" style="grid-area: ${gridArea}; visibility: hidden;"></div>`;
    }

    // Check if this is an appliance - use appliance status for colors/state
    if (slotConfig.type === 'appliance' && slotConfig.appliance) {
      const appliance = slotConfig.appliance;
      const status = component._getApplianceStatus ? component._getApplianceStatus(appliance) : { text: 'Unknown', isActive: false };

      // For big slots, use the full device card layout
      if (isBig) {
        const classes = ['floor-device-card', 'big'];
        if (status.isActive) classes.push('active');
        if (status.isFinished) classes.push('finished');
        if (status.isError) classes.push('error');
        if (status.isUnavailable) classes.push('unavailable');

        return html`
          <div
            class="${classes.join(' ')}"
            style="grid-area: ${gridArea};"
          >
            <div class="floor-device-card-icon">
              <ha-icon icon="${appliance.icon || 'mdi:devices'}"></ha-icon>
            </div>
            <div class="floor-device-card-status">${status.text}</div>
            ${status.remainingTime ? html`
              <div class="floor-device-card-time">${status.remainingTime}</div>
            ` : ''}
            <div class="floor-device-card-name">${appliance.name}</div>
          </div>
        `;
      }

      // For small slots, use standard room-card layout with appliance status colors
      const cardClass = status.isActive ? 'appliance-active'
        : status.isFinished ? 'appliance-finished'
        : status.isError ? 'appliance-error'
        : status.isUnavailable ? 'appliance-unavailable'
        : 'inactive';

      return html`
        <div
          class="room-card small ${cardClass}"
          style="grid-area: ${gridArea};"
        >
          <div class="room-card-icon">
            <ha-icon icon="${appliance.icon || 'mdi:devices'}"></ha-icon>
          </div>
          <div class="room-card-content">
            <div class="room-card-label">${status.text}</div>
            <div class="room-card-name">${appliance.name}</div>
          </div>
        </div>
      `;
    }

    const entityInfo = getEntityInfo(slotConfig.entity_id);
    if (!entityInfo) {
      return html`<div class="room-card ${isBig ? 'big' : 'small'} inactive" style="grid-area: ${gridArea}; visibility: hidden;"></div>`;
    }

    const { labelText, cardClass, icon, friendlyName, state } = entityInfo;

    // Handle click - toggle for lights, more-info for others
    const handleClick = () => {
      const entityType = slotConfig.entity_id.split('.')[0];
      if (entityType === 'light') {
        toggleLight(component.hass, slotConfig.entity_id);
      } else {
        openMoreInfo(component, slotConfig.entity_id);
      }
    };

    return html`
      <div
        class="room-card ${isBig ? 'big' : 'small'} ${cardClass}"
        style="grid-area: ${gridArea};"
        @click=${handleClick}
      >
        ${isBig ? html`
          <!-- Big card: vertical layout with icon top-right -->
          <div class="room-card-icon">
            <ha-icon icon="${icon}"></ha-icon>
          </div>
          <div class="room-card-content">
            <div class="room-card-label">${labelText}</div>
            <div class="room-card-name">${friendlyName}</div>
          </div>
        ` : html`
          <!-- Small card: horizontal layout -->
          <div class="room-card-icon">
            <ha-icon icon="${icon}"></ha-icon>
          </div>
          <div class="room-card-content">
            <div class="room-card-label">${labelText}</div>
            <div class="room-card-name">${friendlyName}</div>
          </div>
        `}
      </div>
    `;
  };

  const gridStyle = `
    display: grid;
    grid-template-columns: 50% 50%;
    grid-template-rows: 76px 76px 76px 76px;
    grid-template-areas:
      "small1 big1"
      "big2 big1"
      "big2 small2"
      "small3 small4";
    gap: 0;
    margin-top: 12px;
  `;

  return html`
    <div style="${gridStyle}">
      ${renderCard(0, false, 'small1')}
      ${floorOverviewEnabled
        ? html`<div style="grid-area: big1; margin: 4px;">${renderFloorOverviewCard(component, html, component._activeFloorTab)}</div>`
        : renderCard(1, true, 'big1')
      }
      ${garbageEnabled
        ? html`<div style="grid-area: big2; margin: 4px;">${renderGarbageCard(component, html)}</div>`
        : renderCard(2, true, 'big2')
      }
      ${renderCard(3, false, 'small2')}
      ${renderCard(4, false, 'small3')}
      ${renderCard(5, false, 'small4')}
    </div>
  `;
}

export function renderGarbageCard(component, html) {
  // Show skeleton while hass is not ready
  if (!component.hass) {
    return renderGarbageCardSkeleton(html);
  }

  if (component._garbageSensors.length === 0) {
    return html`
      <div class="garbage-card" style="display: flex; align-items: center; justify-content: center; background: var(--dv-gray000);">
        <span style="color: var(--secondary-text-color); font-size: 12px;">Keine Sensoren ausgewählt</span>
      </div>
    `;
  }

  // Get sorted garbage data
  const garbageData = component._getGarbageData();

  if (garbageData.length === 0) {
    return html`
      <div class="garbage-card" style="display: flex; align-items: center; justify-content: center; background: var(--dv-gray000);">
        <span style="color: var(--secondary-text-color); font-size: 12px;">Keine Daten verfügbar</span>
      </div>
    `;
  }

  const currentIndex = component._garbageCardIndex || 0;

  const goToSlide = (index) => {
    if (index < 0) index = garbageData.length - 1;
    if (index >= garbageData.length) index = 0;
    triggerHaptic('selection');
    component._garbageCardIndex = index;
    component.requestUpdate();
  };

  // Create swipe handlers using the factory (persists state via element dataset)
  const swipeHandlers = createSwipeHandlers(
    () => goToSlide(currentIndex + 1),  // swipe left = next
    () => goToSlide(currentIndex - 1)   // swipe right = prev
  );

  return html`
    <div
      class="garbage-card"
      @touchstart=${swipeHandlers.handleTouchStart}
      @touchmove=${swipeHandlers.handleTouchMove}
      @touchend=${swipeHandlers.handleTouchEnd}
      @mousedown=${swipeHandlers.handleMouseDown}
      @mousemove=${swipeHandlers.handleMouseMove}
      @mouseup=${swipeHandlers.handleMouseUp}
      @mouseleave=${swipeHandlers.handleMouseLeave}
    >
      <div
        class="garbage-slides"
        style="transform: translateX(-${currentIndex * 100}%);"
      >
        ${garbageData.map((item, idx) => {
          let slideClass = '';
          const now = new Date();
          const hour = now.getHours();

          // Urgent: today before 9am (red)
          // Soon: tomorrow (green)
          if (item.days === 0 && hour < 9) {
            slideClass = 'urgent';
          } else if (item.days === 1) {
            slideClass = 'soon';
          }

          return html`
            <div class="garbage-slide ${slideClass}">
              <div class="garbage-slide-icon">
                <ha-icon icon="${item.icon}"></ha-icon>
              </div>
              <div class="garbage-slide-label">${item.label}</div>
              <div class="garbage-slide-name">${item.name}</div>
            </div>
          `;
        })}
      </div>

      ${garbageData.length > 1 ? html`
        <div class="garbage-pagination">
          ${garbageData.map((_, idx) => html`
            <div
              class="garbage-dot ${idx === currentIndex ? 'active' : ''}"
              @click=${(e) => { e.stopPropagation(); goToSlide(idx); }}
            ></div>
          `)}
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render the "Other Entities" section showing custom label entities as big cards
 * Similar to Räume section but for custom labeled entities like appliances, printers, etc.
 * @param {Object} component - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Other Entities section HTML
 */
export function renderOtherEntitiesSection(component, html) {
  if (!component.hass) return '';

  // Get all enabled custom labels
  const enabledLabels = component._getEnabledCustomLabels();
  if (enabledLabels.length === 0) return '';

  // Get all enabled custom entities across all labels
  const enabledEntities = [];
  enabledLabels.forEach(label => {
    // Get entities for this label from all areas
    component._areas.forEach(area => {
      const entities = component._getAreaCustomLabelEntities(area.area_id, label.label_id);
      entities.forEach(entity => {
        if (entity.enabled) {
          enabledEntities.push({
            ...entity,
            label,
            area,
          });
        }
      });
    });
  });

  // If no enabled entities, don't show the section
  if (enabledEntities.length === 0) return '';

  // Group entities by label for tab display
  const entitiesByLabel = {};
  enabledLabels.forEach(label => {
    entitiesByLabel[label.label_id] = enabledEntities.filter(e => e.label.label_id === label.label_id);
  });

  // Filter to only labels that have enabled entities
  const labelsWithEntities = enabledLabels.filter(label => entitiesByLabel[label.label_id].length > 0);

  if (labelsWithEntities.length === 0) return '';

  // Set default active tab if not set
  if (!component._activeCustomLabelTab && labelsWithEntities.length > 0) {
    component._activeCustomLabelTab = labelsWithEntities[0].label_id;
  }

  // Make sure active tab is valid
  if (!labelsWithEntities.find(l => l.label_id === component._activeCustomLabelTab)) {
    component._activeCustomLabelTab = labelsWithEntities[0].label_id;
  }

  const activeEntities = entitiesByLabel[component._activeCustomLabelTab] || [];

  return html`
    <div class="other-entities-section">
      <div class="other-entities-header">
        <h2 class="other-entities-title">Andere Geräte</h2>
        ${labelsWithEntities.length > 1 ? html`
          <div class="other-entities-tabs">
            ${labelsWithEntities.map(label => html`
              <button
                class="other-entities-tab ${component._activeCustomLabelTab === label.label_id ? 'active' : ''}"
                @click=${() => { component._activeCustomLabelTab = label.label_id; component.requestUpdate(); }}
                title="${label.name}"
              >
                <ha-icon icon="${label.icon}"></ha-icon>
              </button>
            `)}
          </div>
        ` : ''}
      </div>

      <!-- Entity Cards Grid -->
      ${renderOtherEntitiesGrid(component, html, activeEntities)}
    </div>
  `;
}

/**
 * Render entity cards grid for custom entities
 * Uses big card layout similar to room cards
 * @param {Object} component - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @param {Array} entities - Array of enabled custom entities
 * @returns {TemplateResult} Entity cards grid HTML
 */
function renderOtherEntitiesGrid(component, html, entities) {
  if (entities.length === 0) {
    return html`
      <div style="text-align: center; padding: 24px; color: var(--secondary-text-color);">
        Keine Geräte aktiviert.
      </div>
    `;
  }

  // Helper to get entity display info
  const getEntityDisplayInfo = (entity) => {
    const state = component.hass.states[entity.entity_id];
    if (!state) return null;

    const friendlyName = state.attributes?.friendly_name || entity.name;
    const icon = state.attributes?.icon || entity.icon || 'mdi:help-circle';
    const unit = state.attributes?.unit_of_measurement || '';
    let stateText = state.state;
    let cardClass = 'inactive';

    // Format state based on entity type
    const entityType = entity.entity_id.split('.')[0];

    if (entityType === 'sensor') {
      stateText = `${state.state}${unit ? ` ${unit}` : ''}`;
    } else if (state.state === 'on' || state.state === 'playing' || state.state === 'active') {
      cardClass = 'active-gradient';
      stateText = getGermanState(state.state);
    } else if (state.state === 'off' || state.state === 'idle' || state.state === 'standby') {
      stateText = getGermanState(state.state);
    }

    // Get child entity states
    const childStates = (entity.childEntities || []).map(childId => {
      const childState = component.hass.states[childId];
      if (!childState) return null;
      return {
        entity_id: childId,
        name: childState.attributes?.friendly_name || childId,
        state: childState.state,
        unit: childState.attributes?.unit_of_measurement || '',
        icon: childState.attributes?.icon || 'mdi:information',
      };
    }).filter(Boolean);

    return {
      friendlyName,
      icon,
      stateText,
      cardClass,
      state,
      childStates,
      area: entity.area,
    };
  };

  // German state translations
  const getGermanState = (state) => {
    const translations = {
      'on': 'An',
      'off': 'Aus',
      'playing': 'Läuft',
      'paused': 'Pausiert',
      'idle': 'Bereit',
      'standby': 'Standby',
      'active': 'Aktiv',
      'inactive': 'Inaktiv',
      'running': 'Läuft',
      'washing': 'Wäscht',
      'drying': 'Trocknet',
      'unavailable': 'Nicht verfügbar',
      'unknown': 'Unbekannt',
    };
    return translations[state.toLowerCase()] || state;
  };

  // Handle card click - open more-info dialog
  const handleCardClick = (entityId) => {
    openMoreInfo(component, entityId);
  };

  // Render a single entity card (big card style)
  const renderEntityCard = (entity, index) => {
    const displayInfo = getEntityDisplayInfo(entity);
    if (!displayInfo) return '';

    const { friendlyName, icon, stateText, cardClass, childStates, area } = displayInfo;
    const hasChildren = childStates.length > 0;

    return html`
      <div
        class="other-entity-card ${cardClass}"
        @click=${() => handleCardClick(entity.entity_id)}
      >
        <div class="other-entity-card-header">
          <div class="other-entity-card-area">${area?.name || ''}</div>
          <div class="other-entity-card-icon">
            <ha-icon icon="${icon}"></ha-icon>
          </div>
        </div>
        <div class="other-entity-card-content">
          <div class="other-entity-card-state">${stateText}</div>
          <div class="other-entity-card-name">${friendlyName}</div>
          ${hasChildren ? html`
            <div class="other-entity-card-children">
              ${childStates.map(child => html`
                <div class="other-entity-child-item">
                  <ha-icon icon="${child.icon}"></ha-icon>
                  <span class="child-value">${child.state}${child.unit ? ` ${child.unit}` : ''}</span>
                </div>
              `)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  };

  // Create a 2-column grid with big cards
  return html`
    <div class="other-entities-grid">
      ${entities.map((entity, idx) => renderEntityCard(entity, idx))}
    </div>
  `;
}
