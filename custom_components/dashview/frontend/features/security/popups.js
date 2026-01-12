/**
 * Dashview Popups Module
 * Contains render methods for all popup content (Security, Battery, Weather, Media, Admin)
 */

import {
  getEnabledEntitiesSortedByLastChanged,
  isStateOn,
  isStateOpen,
  calculateTimeDifference,
  getFriendlyName,
  formatLastChanged
} from '../../utils/index.js';
import { t } from '../../utils/i18n.js';

export function renderSecurityPopupContent(component, html) {
  if (!component.hass) return html``;

  // Helper to get all entities with a label that are not explicitly disabled and allocated to a room
  // Uses sparse map pattern: missing/undefined = enabled, false = disabled
  const filterByCurrentLabel = (enabledMap, labelId) => {
    if (!labelId) return enabledMap;
    const filtered = {};
    // Look at ALL entities in registry with the matching label
    component._entityRegistry.forEach(entityReg => {
      if (entityReg.labels && entityReg.labels.includes(labelId)) {
        const entityId = entityReg.entity_id;
        // Skip explicitly disabled entities (false), include all others (undefined/true)
        if (enabledMap[entityId] === false) return;
        // Skip entities not allocated to a room
        const areaId = component._getAreaIdForEntity(entityId);
        if (!areaId) return;
        filtered[entityId] = true;
      }
    });
    return filtered;
  };

  // Get enabled windows - sorted by last changed, filtered by current label
  const enabledWindows = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(component._enabledWindows, component._windowLabelId),
    component.hass,
    (state) => ({ isOpen: isStateOn(state) })
  );

  // Get enabled motion sensors - sorted by last changed, filtered by current label
  const enabledMotion = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(component._enabledMotionSensors, component._motionLabelId),
    component.hass,
    (state) => ({ isActive: isStateOn(state) })
  );

  // Get enabled garages - sorted by last changed, filtered by current label
  const enabledGarages = getEnabledEntitiesSortedByLastChanged(
    filterByCurrentLabel(component._enabledGarages, component._garageLabelId),
    component.hass,
    (state) => ({ isOpen: isStateOpen(state) })
  );

  // Count active entities
  const openWindowsCount = enabledWindows.filter(w => w.isOpen).length;
  const activeMotionCount = enabledMotion.filter(m => m.isActive).length;
  const openGaragesCount = enabledGarages.filter(g => g.isOpen).length;

  // Format last changed time using utility
  const formatLastChanged = (lastChanged) => {
    if (!lastChanged) return "";

    const last = new Date(lastChanged);
    if (isNaN(last.getTime())) return "";

    const now = new Date();
    const diffMs = now - last;

    if (isNaN(diffMs) || diffMs < 0) return "";

    const { days, hours, minutes } = calculateTimeDifference(diffMs);

    if (isNaN(minutes)) return "";

    if (days >= 2) return `${days} days ago`;
    if (days >= 1) return `Yesterday`;
    if (hours >= 1) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  // Sort entities by last_changed (most recent first)
  const sortByLastChangedTime = (entities) => {
    return [...entities].sort((a, b) => {
      const timeA = a.state?.last_changed ? new Date(a.state.last_changed).getTime() : 0;
      const timeB = b.state?.last_changed ? new Date(b.state.last_changed).getTime() : 0;
      return timeB - timeA; // Most recent first
    });
  };

  // Render entity card
  const renderEntityCard = (entity, type) => {
    const isActive = type === 'window' ? entity.isOpen : (type === 'garage' ? entity.isOpen : entity.isActive);
    let icon;
    if (type === 'window') {
      icon = entity.isOpen ? 'mdi:window-open' : 'mdi:window-closed';
    } else if (type === 'garage') {
      icon = entity.isOpen ? 'mdi:garage-open' : 'mdi:garage';
    } else {
      icon = entity.isActive ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off';
    }

    return html`
      <div
        class="security-entity-card ${isActive ? 'active' : 'inactive'}"
        @click=${() => component._showMoreInfo(entity.entityId)}
      >
        <div class="security-entity-icon">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="security-entity-content">
          <div class="security-entity-name">${getFriendlyName(entity.state, entity.entityId)}</div>
          <div class="security-entity-last-changed">${formatLastChanged(entity.state.last_changed)}</div>
        </div>
      </div>
    `;
  };

  // Render garage card with controls (matching room popup style)
  const renderGarageCard = (garage) => {
    const isOpen = garage.isOpen;
    const icon = isOpen ? 'mdi:garage-open' : 'mdi:garage';

    return html`
      <div class="popup-garage-item">
        <div class="popup-garage-item-header ${isOpen ? 'open' : 'closed'}">
          <div class="popup-garage-item-icon">
            <ha-icon icon="${icon}"></ha-icon>
          </div>
          <div class="popup-garage-item-info">
            <span class="popup-garage-item-name">${getFriendlyName(garage.state, garage.entityId)}</span>
            <span class="popup-garage-item-last-changed">${formatLastChanged(garage.state.last_changed)}</span>
          </div>
          <div class="popup-garage-item-controls">
            <button class="popup-garage-control-btn" @click=${(e) => { e.stopPropagation(); component._openGarage(garage.entityId); }}>
              <ha-icon icon="mdi:arrow-up"></ha-icon>
            </button>
            <button class="popup-garage-control-btn" @click=${(e) => { e.stopPropagation(); component._closeGarage(garage.entityId); }}>
              <ha-icon icon="mdi:arrow-down"></ha-icon>
            </button>
          </div>
        </div>
      </div>
    `;
  };

  return html`
    <!-- Security Tabs -->
    <div class="security-tabs">
      <button
        class="security-tab ${component._activeSecurityTab === 'windows' ? 'active' : ''}"
        @click=${() => component._activeSecurityTab = 'windows'}
      >
        <ha-icon icon="mdi:window-open"></ha-icon>
        <span>${openWindowsCount} von ${enabledWindows.length}</span>
      </button>
      <button
        class="security-tab ${component._activeSecurityTab === 'garage' ? 'active' : ''}"
        @click=${() => component._activeSecurityTab = 'garage'}
      >
        <ha-icon icon="mdi:garage"></ha-icon>
        <span>${openGaragesCount} von ${enabledGarages.length}</span>
      </button>
      <button
        class="security-tab ${component._activeSecurityTab === 'motion' ? 'active' : ''}"
        @click=${() => component._activeSecurityTab = 'motion'}
      >
        <ha-icon icon="mdi:motion-sensor"></ha-icon>
        <span>${activeMotionCount} von ${enabledMotion.length}</span>
      </button>
    </div>

    <!-- Windows Content -->
    ${component._activeSecurityTab === 'windows' ? html`
      ${enabledWindows.length === 0 ? html`
        <div class="security-empty-state">
          ${t('ui.errors.no_windows_enabled', 'Keine Fenster in der Admin-Konfiguration aktiviert.')}
        </div>
      ` : html`
        <!-- Open Windows -->
        ${enabledWindows.filter(w => w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.open_windows', 'Offene Fenster')}</h3>
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledWindows.filter(w => w.isOpen)).map(w => renderEntityCard(w, 'window'))}
          </div>
        ` : ''}

        <!-- Closed Windows -->
        ${enabledWindows.filter(w => !w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.closed_windows', 'Geschlossene Fenster')}</h3>
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledWindows.filter(w => !w.isOpen)).map(w => renderEntityCard(w, 'window'))}
          </div>
        ` : ''}
      `}
    ` : ''}

    <!-- Garage Content -->
    ${component._activeSecurityTab === 'garage' ? html`
      ${enabledGarages.length === 0 ? html`
        <div class="security-empty-state">
          ${t('ui.errors.no_garages_enabled', 'Keine Garagentore in der Admin-Konfiguration aktiviert.')}
        </div>
      ` : html`
        <!-- Open Garages -->
        ${enabledGarages.filter(g => g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.open_garages', 'Offene Garagentore')}</h3>
          <div class="security-garage-list">
            ${sortByLastChangedTime(enabledGarages.filter(g => g.isOpen)).map(g => renderGarageCard(g))}
          </div>
        ` : ''}

        <!-- Closed Garages -->
        ${enabledGarages.filter(g => !g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.closed_garages', 'Geschlossene Garagentore')}</h3>
          <div class="security-garage-list">
            ${sortByLastChangedTime(enabledGarages.filter(g => !g.isOpen)).map(g => renderGarageCard(g))}
          </div>
        ` : ''}
      `}
    ` : ''}

    <!-- Motion Content -->
    ${component._activeSecurityTab === 'motion' ? html`
      ${enabledMotion.length === 0 ? html`
        <div class="security-empty-state">
          ${t('ui.errors.no_motion_enabled', 'Keine Bewegungsmelder in der Admin-Konfiguration aktiviert.')}
        </div>
      ` : html`
        <!-- Active Motion -->
        ${enabledMotion.filter(m => m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">${t('sensor.motion.detected', 'Bewegung erkannt')}</h3>
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledMotion.filter(m => m.isActive)).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}

        <!-- Inactive Motion -->
        ${enabledMotion.filter(m => !m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">${t('sensor.motion.no_motion', 'Keine Bewegung')}</h3>
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledMotion.filter(m => !m.isActive)).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}
      `}
    ` : ''}
  `;
}


// Long press duration in ms (matches room-popup)
const LONG_PRESS_DURATION = 500;

/**
 * Create long press handlers for an element
 */
function createLongPressHandlers(onTap, onLongPress) {
  let pressTimer = null;
  let isLongPress = false;
  let startX = 0;
  let startY = 0;

  const start = (e) => {
    isLongPress = false;
    const touch = e.touches?.[0] || e;
    startX = touch.clientX;
    startY = touch.clientY;
    pressTimer = setTimeout(() => {
      isLongPress = true;
      onLongPress();
    }, LONG_PRESS_DURATION);
  };

  const move = (e) => {
    if (!pressTimer) return;
    const touch = e.touches?.[0] || e;
    const dx = Math.abs(touch.clientX - startX);
    const dy = Math.abs(touch.clientY - startY);
    if (dx > 10 || dy > 10) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  const end = (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
      if (!isLongPress) {
        onTap();
      }
    }
    if (isLongPress) {
      e.preventDefault();
      e.stopPropagation();
    }
  };

  const cancel = () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  return {
    onTouchStart: start,
    onTouchMove: move,
    onTouchEnd: end,
    onTouchCancel: cancel,
    onMouseDown: start,
    onMouseUp: end,
    onMouseLeave: cancel,
  };
}

/**
 * Get the fill color for a light based on RGB color or default warm white
 */
function getLightFillColor(state) {
  const rgbColor = state?.attributes?.rgb_color;
  const [r, g, b] = rgbColor || [255, 180, 107]; // Default warm white
  return `${r}, ${g}, ${b}`;
}

export function renderLightsPopupContent(component, html) {
  if (!component.hass) return html``;

  // Helper to get all entities with the light label, respecting explicit enable/disable
  const filterByLightLabel = () => {
    const filtered = {};
    const labelId = component._lightLabelId;
    if (!labelId) return filtered;

    // Exclude non-light domains
    const excludedDomains = ['automation', 'script', 'scene'];

    component._entityRegistry.forEach(entityReg => {
      if (entityReg.labels && entityReg.labels.includes(labelId)) {
        const entityId = entityReg.entity_id;
        const domain = entityId.split('.')[0];

        // Skip excluded domains
        if (excludedDomains.includes(domain)) return;

        // Skip only explicitly disabled entities (enabled by default)
        if (component._enabledLights[entityId] === false) return;
        filtered[entityId] = component._enabledLights[entityId] !== undefined ? component._enabledLights[entityId] : true;
      }
    });
    return filtered;
  };

  const enabledLightsMap = filterByLightLabel();
  const enabledLightIds = Object.keys(enabledLightsMap).filter(id => enabledLightsMap[id] !== false);

  // Get light states and info
  const lights = enabledLightIds.map(entityId => {
    const state = component.hass.states[entityId];
    if (!state) return null;

    const isOn = state.state === 'on';
    const brightness = state.attributes?.brightness;
    const brightnessPercent = brightness ? Math.round((brightness / 255) * 100) : 0;
    const isDimmable = state.attributes?.supported_color_modes?.some(
      mode => !['onoff'].includes(mode)
    ) ?? (brightness !== undefined);
    const friendlyName = state.attributes?.friendly_name || entityId;

    return {
      entityId,
      state,
      isOn,
      brightness,
      brightnessPercent,
      isDimmable,
      friendlyName,
      fillColor: getLightFillColor(state),
      lastChanged: state.last_changed ? new Date(state.last_changed).getTime() : 0,
      lastChangedText: formatLastChanged(state.last_changed),
    };
  }).filter(l => l !== null);

  // Sort by last changed (most recent first)
  lights.sort((a, b) => b.lastChanged - a.lastChanged);

  const lightsOn = lights.filter(l => l.isOn);
  const lightsOff = lights.filter(l => !l.isOn);

  // Render a single light card with interactive slider
  const renderLightCard = (light) => {
    const { entityId, isOn, brightnessPercent, isDimmable, friendlyName, fillColor, lastChangedText } = light;

    // Create long press handlers
    const longPress = createLongPressHandlers(
      () => component._toggleLight(entityId),
      () => component._showMoreInfo(entityId)
    );

    // Handle slider interaction
    const handleSliderInteraction = (e, isDrag = false) => {
      const sliderArea = e.currentTarget;
      const rect = sliderArea.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const percentage = Math.max(1, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));

      // Update visual immediately
      const card = sliderArea.closest('.lights-popup-card');
      const fill = card?.querySelector('.lights-popup-slider-fill');
      const labelValue = card?.querySelector('.lights-popup-label-value');

      if (fill) fill.style.width = `${percentage}%`;
      if (labelValue) labelValue.textContent = `${percentage}%`;

      if (!isDrag) {
        component._setLightBrightness(entityId, percentage);
      }

      return percentage;
    };

    // For dimmable lights that are ON: show slider
    if (isDimmable && isOn) {
      return html`
        <div class="lights-popup-card on has-slider">
          <div class="lights-popup-slider-fill"
               style="width: ${brightnessPercent}%; background: linear-gradient(90deg, rgba(${fillColor}, 0.9) 0%, rgba(${fillColor}, 0.7) 100%);"></div>
          <div class="lights-popup-header"
               style="cursor: pointer; user-select: none; -webkit-user-select: none;"
               @touchstart=${longPress.onTouchStart}
               @touchmove=${longPress.onTouchMove}
               @touchend=${longPress.onTouchEnd}
               @touchcancel=${longPress.onTouchCancel}
               @mousedown=${longPress.onMouseDown}
               @mouseup=${longPress.onMouseUp}
               @mouseleave=${longPress.onMouseLeave}>
            <div class="lights-popup-icon">
              <ha-icon icon="mdi:lightbulb"></ha-icon>
            </div>
            <div class="lights-popup-content">
              <div class="lights-popup-label"><span class="lights-popup-label-value">${brightnessPercent}%</span>${lastChangedText ? html` <span class="lights-popup-label-time">- ${lastChangedText}</span>` : ''}</div>
              <div class="lights-popup-name">${friendlyName}</div>
            </div>
          </div>
          <div class="lights-popup-slider-area"
               @click=${(e) => {
                 e.stopPropagation();
                 handleSliderInteraction(e);
               }}
               @touchstart=${(e) => {
                 const card = e.currentTarget.closest('.lights-popup-card');
                 card?.classList.add('dragging');
                 card._dragValue = null;
               }}
               @touchmove=${(e) => {
                 e.preventDefault();
                 const card = e.currentTarget.closest('.lights-popup-card');
                 card._dragValue = handleSliderInteraction(e, true);
               }}
               @touchend=${(e) => {
                 const card = e.currentTarget.closest('.lights-popup-card');
                 card?.classList.remove('dragging');
                 if (card?._dragValue !== null && card?._dragValue !== undefined) {
                   component._setLightBrightness(entityId, card._dragValue);
                 }
               }}
               @mousedown=${(e) => {
                 e.preventDefault();
                 e.stopPropagation();
                 const card = e.currentTarget.closest('.lights-popup-card');
                 const sliderArea = e.currentTarget;
                 card?.classList.add('dragging');
                 let dragValue = null;

                 const onMouseMove = (moveE) => {
                   const rect = sliderArea.getBoundingClientRect();
                   const percentage = Math.max(1, Math.min(100, Math.round(((moveE.clientX - rect.left) / rect.width) * 100)));
                   const fill = card?.querySelector('.lights-popup-slider-fill');
                   const labelValue = card?.querySelector('.lights-popup-label-value');
                   if (fill) fill.style.width = `${percentage}%`;
                   if (labelValue) labelValue.textContent = `${percentage}%`;
                   dragValue = percentage;
                 };

                 const onMouseUp = () => {
                   card?.classList.remove('dragging');
                   if (dragValue !== null) {
                     component._setLightBrightness(entityId, dragValue);
                   }
                   document.removeEventListener('mousemove', onMouseMove);
                   document.removeEventListener('mouseup', onMouseUp);
                 };

                 document.addEventListener('mousemove', onMouseMove);
                 document.addEventListener('mouseup', onMouseUp);
               }}>
          </div>
        </div>
      `;
    } else {
      // Non-dimmable or off: simple toggle with long press for more-info
      return html`
        <div class="lights-popup-card ${isOn ? 'on' : 'off'}"
             style="${isOn ? `background: linear-gradient(135deg, rgba(${fillColor}, 0.5) 0%, rgba(${fillColor}, 0.3) 100%);` : ''}">
          <div class="lights-popup-header"
               style="cursor: pointer; user-select: none; -webkit-user-select: none;"
               @touchstart=${longPress.onTouchStart}
               @touchmove=${longPress.onTouchMove}
               @touchend=${longPress.onTouchEnd}
               @touchcancel=${longPress.onTouchCancel}
               @mousedown=${longPress.onMouseDown}
               @mouseup=${longPress.onMouseUp}
               @mouseleave=${longPress.onMouseLeave}>
            <div class="lights-popup-icon">
              <ha-icon icon="${isOn ? 'mdi:lightbulb' : 'mdi:lightbulb-outline'}"></ha-icon>
            </div>
            <div class="lights-popup-content">
              <div class="lights-popup-label">${isOn ? (isDimmable && brightnessPercent ? `${brightnessPercent}%` : t('common.status.on')) : t('common.status.off')}${lastChangedText ? html` <span class="lights-popup-label-time">- ${lastChangedText}</span>` : ''}</div>
              <div class="lights-popup-name">${friendlyName}</div>
            </div>
          </div>
        </div>
      `;
    }
  };

  return html`
    <!-- Lights On Section -->
    ${lightsOn.length > 0 ? html`
      <h3 class="lights-popup-section-title">${t('ui.popups.lights.on_section')} (${lightsOn.length})</h3>
      <div class="lights-popup-list">
        ${lightsOn.map(l => renderLightCard(l))}
      </div>
    ` : ''}

    <!-- Lights Off Section -->
    ${lightsOff.length > 0 ? html`
      <h3 class="lights-popup-section-title">${t('ui.popups.lights.off_section')} (${lightsOff.length})</h3>
      <div class="lights-popup-list">
        ${lightsOff.map(l => renderLightCard(l))}
      </div>
    ` : ''}

    <!-- Empty State -->
    ${lights.length === 0 ? html`
      <div class="lights-popup-empty">
        <ha-icon icon="mdi:lightbulb-off-outline" style="--mdc-icon-size: 48px; color: var(--secondary-text-color);"></ha-icon>
        <div class="lights-popup-empty-text">${t('ui.errors.no_lights_enabled')}</div>
      </div>
    ` : ''}
  `;
}

export function renderBatteryPopupContent(component, html) {
  if (!component.hass) return html``;

  const lowBatteryDevices = component._getLowBatteryDevices();
  const threshold = component._infoTextConfig.batteryLow?.threshold || 20;

  // Get battery icon based on level
  const getBatteryIcon = (level) => {
    if (level <= 10) return 'mdi:battery-10';
    if (level <= 20) return 'mdi:battery-20';
    if (level <= 30) return 'mdi:battery-30';
    if (level <= 40) return 'mdi:battery-40';
    if (level <= 50) return 'mdi:battery-50';
    if (level <= 60) return 'mdi:battery-60';
    if (level <= 70) return 'mdi:battery-70';
    if (level <= 80) return 'mdi:battery-80';
    if (level <= 90) return 'mdi:battery-90';
    return 'mdi:battery';
  };

  // Get color based on level
  const getBatteryColor = (level) => {
    if (level <= 10) return 'var(--error-color, #f44336)';
    if (level <= 20) return 'var(--warning-color, #ff9800)';
    return 'var(--success-color, #4caf50)';
  };

  if (lowBatteryDevices.length === 0) {
    return html`
      <div class="battery-empty-state">
        <ha-icon icon="mdi:battery-check" style="--mdc-icon-size: 48px; color: var(--success-color, #4caf50);"></ha-icon>
        <div class="battery-empty-text">${t('ui.sections.batteries_ok', 'Alle Batterien in Ordnung')}</div>
        <div class="battery-empty-subtext">${t('ui.sections.no_devices_under', 'Keine Geräte unter')} ${threshold}%</div>
      </div>
    `;
  }

  return html`
    <div class="battery-header-info">
      <span>${lowBatteryDevices.length} ${lowBatteryDevices.length === 1 ? t('ui.sections.device', 'Gerät') : t('ui.sections.devices', 'Geräte')} ${t('common.options.under', 'unter')} ${threshold}%</span>
    </div>
    <div class="battery-device-list">
      ${lowBatteryDevices.map(device => html`
        <div
          class="battery-device-card"
          @click=${() => component._showMoreInfo(device.entityId)}
        >
          <div class="battery-device-icon" style="color: ${getBatteryColor(device.value)};">
            <ha-icon icon="${getBatteryIcon(device.value)}"></ha-icon>
          </div>
          <div class="battery-device-info">
            <div class="battery-device-name">${device.name}</div>
            <div class="battery-device-level" style="color: ${getBatteryColor(device.value)};">${device.value}%</div>
          </div>
          <div class="battery-device-bar">
            <div class="battery-device-bar-fill" style="width: ${device.value}%; background: ${getBatteryColor(device.value)};"></div>
          </div>
        </div>
      `)}
    </div>
  `;
}

/**
 * Render covers popup content - shows all enabled covers with position control
 */
export function renderCoversPopupContent(component, html) {
  if (!component.hass) return html``;

  // Helper to get all cover entities with the cover label that are not explicitly disabled and allocated to a room
  // Uses sparse map pattern: missing/undefined = enabled, false = disabled
  const filterByCoverLabel = () => {
    const filtered = [];
    const labelId = component._coverLabelId;
    if (!labelId) return filtered;

    component._entityRegistry.forEach(entityReg => {
      if (entityReg.labels && entityReg.labels.includes(labelId)) {
        const entityId = entityReg.entity_id;
        // Only include cover domain entities
        if (!entityId.startsWith('cover.')) return;
        // Skip explicitly disabled entities (false), include all others (undefined/true)
        if (component._enabledCovers[entityId] === false) return;
        // Skip entities not allocated to a room
        const areaId = component._getAreaIdForEntity(entityId);
        if (!areaId) return;
        filtered.push(entityId);
      }
    });
    return filtered;
  };

  const enabledCoverIds = filterByCoverLabel();

  if (enabledCoverIds.length === 0) {
    return html`
      <div class="covers-empty-state">
        <ha-icon icon="mdi:window-shutter-alert"></ha-icon>
        <p>${t('ui.popups.covers.empty', 'No covers configured')}</p>
      </div>
    `;
  }

  // Get cover states - open means position < 80%
  const covers = enabledCoverIds
    .map(entityId => {
      const state = component.hass.states[entityId];
      if (!state) return null;
      const position = state.attributes?.current_position ?? (state.state === 'open' ? 0 : 100);
      // Open = position < 80 (cover is not fully closed)
      const isOpen = position < 80;
      return {
        entityId,
        name: state.attributes?.friendly_name || entityId.split('.')[1],
        state: state.state,
        position,
        isOpen,
      };
    })
    .filter(c => c !== null);

  // Sort by position (lower/more open first for open covers, higher first for closed)
  const coversOpen = covers.filter(c => c.isOpen).sort((a, b) => a.position - b.position);
  const coversClosed = covers.filter(c => !c.isOpen).sort((a, b) => b.position - a.position);

  // Render a single cover card
  const renderCoverCard = (cover) => html`
    <div class="covers-popup-card ${cover.isOpen ? 'open' : 'closed'}">
      <div class="covers-popup-header" @click=${() => component._toggleCover(cover.entityId)}>
        <div class="covers-popup-icon">
          <ha-icon icon="${cover.isOpen ? 'mdi:window-shutter-open' : 'mdi:window-shutter'}"></ha-icon>
        </div>
        <div class="covers-popup-content">
          <div class="covers-popup-name">${cover.name}</div>
          <div class="covers-popup-position">${cover.position}%</div>
        </div>
      </div>
      <div class="covers-popup-slider">
        <input
          type="range"
          min="0"
          max="100"
          .value=${cover.position}
          @change=${(e) => component._setCoverPosition(cover.entityId, parseInt(e.target.value))}
        />
      </div>
    </div>
  `;

  return html`
    <!-- Covers Open Section -->
    ${coversOpen.length > 0 ? html`
      <h3 class="lights-popup-section-title">${t('ui.popups.covers.open_section', 'Covers open')} (${coversOpen.length})</h3>
      <div class="covers-popup-list">
        ${coversOpen.map(c => renderCoverCard(c))}
      </div>
    ` : ''}

    <!-- Covers Closed Section -->
    ${coversClosed.length > 0 ? html`
      <h3 class="lights-popup-section-title">${t('ui.popups.covers.closed_section', 'Covers closed')} (${coversClosed.length})</h3>
      <div class="covers-popup-list">
        ${coversClosed.map(c => renderCoverCard(c))}
      </div>
    ` : ''}

    <!-- Empty State -->
    ${covers.length === 0 ? html`
      <div class="covers-empty-state">
        <ha-icon icon="mdi:window-shutter-alert"></ha-icon>
        <p>${t('ui.popups.covers.empty', 'No covers configured')}</p>
      </div>
    ` : ''}
  `;
}

/**
 * Render TVs popup content - shows all enabled TVs with controls
 */
export function renderTVsPopupContent(component, html) {
  if (!component.hass) return html``;

  // Helper to get all entities with the TV label, respecting explicit enable/disable
  const filterByTVLabel = () => {
    const filtered = [];
    const labelId = component._tvLabelId;
    if (!labelId) return filtered;

    component._entityRegistry.forEach(entityReg => {
      if (entityReg.labels && entityReg.labels.includes(labelId)) {
        const entityId = entityReg.entity_id;
        // Skip only explicitly disabled entities (enabled by default)
        if (component._enabledTVs[entityId] === false) return;
        filtered.push(entityId);
      }
    });
    return filtered;
  };

  const enabledTVIds = filterByTVLabel();

  if (enabledTVIds.length === 0) {
    return html`
      <div class="tvs-empty-state">
        <ha-icon icon="mdi:television-off"></ha-icon>
        <p>${t('ui.popups.tvs.empty', 'No TVs configured')}</p>
      </div>
    `;
  }

  // Get TV states
  const tvs = enabledTVIds
    .map(entityId => {
      const state = component.hass.states[entityId];
      if (!state) return null;
      const isOn = state.state === 'on';
      return {
        entityId,
        name: state.attributes?.friendly_name || entityId.split('.')[1],
        state: state.state,
        isOn,
        source: state.attributes?.source || '',
        mediaTitle: state.attributes?.media_title || '',
        entityPicture: state.attributes?.entity_picture || null,
        volume: state.attributes?.volume_level,
      };
    })
    .filter(tv => tv !== null);

  // Sort by name within each group
  const tvsOn = tvs.filter(tv => tv.isOn).sort((a, b) => a.name.localeCompare(b.name));
  const tvsOff = tvs.filter(tv => !tv.isOn).sort((a, b) => a.name.localeCompare(b.name));

  // Render a single TV card
  const renderTVCard = (tv) => html`
    <div class="tvs-popup-card ${tv.isOn ? 'on' : 'off'}">
      <div class="tvs-popup-header" @click=${() => component._toggleTV(tv.entityId)}>
        <div class="tvs-popup-icon ${tv.entityPicture ? 'has-image' : ''}">
          ${tv.entityPicture ? html`
            <img class="tvs-popup-image" src="${tv.entityPicture}" alt="">
          ` : html`
            <ha-icon icon="${tv.isOn ? 'mdi:television' : 'mdi:television-off'}"></ha-icon>
          `}
        </div>
        <div class="tvs-popup-content">
          <div class="tvs-popup-title">${tv.isOn ? (tv.mediaTitle || tv.source || t('common.status.on', 'On')) : t('common.status.off', 'Off')}</div>
          <div class="tvs-popup-name">${tv.name}</div>
        </div>
      </div>
      ${tv.isOn && tv.volume !== undefined ? html`
        <div class="tvs-popup-volume">
          <ha-icon icon="mdi:volume-high"></ha-icon>
          <input
            type="range"
            min="0"
            max="100"
            .value=${Math.round(tv.volume * 100)}
            @change=${(e) => component._setTVVolume(tv.entityId, parseInt(e.target.value) / 100)}
          />
          <span class="tvs-popup-volume-text">${Math.round(tv.volume * 100)}%</span>
        </div>
      ` : ''}
    </div>
  `;

  return html`
    <!-- TVs On Section -->
    ${tvsOn.length > 0 ? html`
      <h3 class="lights-popup-section-title">${t('ui.popups.tvs.on_section', 'TVs on')} (${tvsOn.length})</h3>
      <div class="tvs-popup-list">
        ${tvsOn.map(tv => renderTVCard(tv))}
      </div>
    ` : ''}

    <!-- TVs Off Section -->
    ${tvsOff.length > 0 ? html`
      <h3 class="lights-popup-section-title">${t('ui.popups.tvs.off_section', 'TVs off')} (${tvsOff.length})</h3>
      <div class="tvs-popup-list">
        ${tvsOff.map(tv => renderTVCard(tv))}
      </div>
    ` : ''}

    <!-- Empty State -->
    ${tvs.length === 0 ? html`
      <div class="tvs-empty-state">
        <ha-icon icon="mdi:television-off"></ha-icon>
        <p>${t('ui.popups.tvs.empty', 'No TVs configured')}</p>
      </div>
    ` : ''}
  `;
}
