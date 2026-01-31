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
  formatLastChanged,
  openMoreInfo
} from '../../utils/index.js';
import { t } from '../../utils/i18n.js';
import { createLongPressHandlers } from '../../utils/long-press-handlers.js';

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

  // Render entity card with long-press to close popup first, then open HA details
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

    // Long press closes popup first then opens HA details; tap opens directly
    const entityLongPress = createLongPressHandlers(
      () => component._showMoreInfo(entity.entityId),
      () => {
        component._securityPopupOpen = false;
        component.requestUpdate();
        requestAnimationFrame(() => {
          openMoreInfo(component, entity.entityId);
        });
      }
    );

    return html`
      <div
        class="security-entity-card ${isActive ? 'active' : 'inactive'}"
        style="cursor: pointer; user-select: none; -webkit-user-select: none;"
        @touchstart=${entityLongPress.onTouchStart}
        @touchmove=${entityLongPress.onTouchMove}
        @touchend=${entityLongPress.onTouchEnd}
        @touchcancel=${entityLongPress.onTouchCancel}
        @mousedown=${entityLongPress.onMouseDown}
        @mouseup=${entityLongPress.onMouseUp}
        @mouseleave=${entityLongPress.onMouseLeave}
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
  // Long-press on info area opens HA details
  const renderGarageCard = (garage) => {
    const isOpen = garage.isOpen;
    const icon = isOpen ? 'mdi:garage-open' : 'mdi:garage';

    // Long press on garage info area to close popup and open HA details
    const garageLongPress = createLongPressHandlers(
      null, // No tap action on info area
      () => {
        component._securityPopupOpen = false;
        component.requestUpdate();
        requestAnimationFrame(() => {
          openMoreInfo(component, garage.entityId);
        });
      }
    );

    return html`
      <div class="popup-garage-item">
        <div class="popup-garage-item-header ${isOpen ? 'open' : 'closed'}">
          <div class="popup-garage-item-icon">
            <ha-icon icon="${icon}"></ha-icon>
          </div>
          <div class="popup-garage-item-info"
               style="cursor: pointer; user-select: none; -webkit-user-select: none;"
               @touchstart=${garageLongPress.onTouchStart}
               @touchmove=${garageLongPress.onTouchMove}
               @touchend=${garageLongPress.onTouchEnd}
               @touchcancel=${garageLongPress.onTouchCancel}
               @mousedown=${garageLongPress.onMouseDown}
               @mouseup=${garageLongPress.onMouseUp}
               @mouseleave=${garageLongPress.onMouseLeave}>
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

  // Get alarm information — auto-detect if not explicitly configured
  let alarmEntity = component._alarmEntity;
  if (!alarmEntity) {
    alarmEntity = Object.keys(component.hass.states).find(id => id.startsWith('alarm_control_panel.')) || '';
  }
  const alarmState = alarmEntity ? component.hass.states[alarmEntity] : null;

  return html`
    <!-- Security Tabs -->
    <div class="security-tabs">
      ${alarmEntity ? html`
        <button
          class="security-tab ${component._activeSecurityTab === 'alarm' ? 'active' : ''}"
          @click=${() => component._activeSecurityTab = 'alarm'}
        >
          <ha-icon icon="mdi:shield"></ha-icon>
          <span>Alarm</span>
        </button>
      ` : ''}
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

    <!-- Alarm Content -->
    ${component._activeSecurityTab === 'alarm' ? html`
      ${!alarmEntity || !alarmState ? html`
        <div class="security-empty-state">
          <ha-icon icon="mdi:shield-off"></ha-icon>
          <p>${t('ui.errors.no_alarm_configured')}</p>
        </div>
      ` : (() => {
        const state = alarmState.state;
        const attrs = alarmState.attributes || {};
        const codeRequired = attrs.code_arm_required || attrs.code_format;
        const supportedFeatures = attrs.supported_features || 0;
        // Standard alarm_control_panel feature flags
        const SUPPORT_ARM_HOME = 1;
        const SUPPORT_ARM_AWAY = 2;
        const SUPPORT_ARM_NIGHT = 4;
        const SUPPORT_TRIGGER = 8;
        // If supported_features is 0, assume all basic modes
        const supportsHome = supportedFeatures === 0 || (supportedFeatures & SUPPORT_ARM_HOME);
        const supportsAway = supportedFeatures === 0 || (supportedFeatures & SUPPORT_ARM_AWAY);
        const supportsNight = supportedFeatures === 0 || (supportedFeatures & SUPPORT_ARM_NIGHT);
        const isArmed = state.startsWith('armed_');
        const isDisarmed = state === 'disarmed';
        const isTriggered = state === 'triggered';
        const isPending = state === 'arming' || state === 'pending';
        // Open sensors (Alarmo-specific attribute)
        const openSensors = attrs.open_sensors || null;

        // State → color class mapping
        const stateColorClass = isDisarmed ? 'alarm-disarmed' :
          state === 'armed_home' ? 'alarm-armed-home' :
          (state === 'armed_away' || state === 'armed_night') ? 'alarm-armed-away' :
          isTriggered ? 'alarm-triggered' :
          isPending ? 'alarm-pending' : '';

        // State → icon
        const stateIcon = state === 'disarmed' ? 'mdi:shield-off' :
          state === 'armed_home' ? 'mdi:shield-home' :
          state === 'armed_away' ? 'mdi:shield-lock' :
          state === 'armed_night' ? 'mdi:shield-moon' :
          state === 'triggered' ? 'mdi:shield-alert' :
          'mdi:shield';

        // Arm/disarm handlers
        const callAlarmService = (service, code) => {
          const data = { entity_id: alarmEntity };
          if (code) data.code = code;
          component.hass.callService('alarm_control_panel', service, data);
        };

        const handleArmAction = (service) => {
          if (codeRequired && !isDisarmed) {
            // Need PIN to disarm — show PIN pad
            component._alarmPendingAction = service;
            component._alarmPinCode = '';
            component.requestUpdate();
          } else if (codeRequired && service === 'alarm_disarm') {
            component._alarmPendingAction = service;
            component._alarmPinCode = '';
            component.requestUpdate();
          } else {
            callAlarmService(service);
          }
        };

        const handlePinSubmit = () => {
          if (component._alarmPinCode && component._alarmPendingAction) {
            callAlarmService(component._alarmPendingAction, component._alarmPinCode);
            component._alarmPendingAction = null;
            component._alarmPinCode = '';
            component.requestUpdate();
          }
        };

        const handlePinDigit = (digit) => {
          if ((component._alarmPinCode || '').length < 8) {
            component._alarmPinCode = (component._alarmPinCode || '') + digit;
            component.requestUpdate();
          }
        };

        const handlePinBackspace = () => {
          component._alarmPinCode = (component._alarmPinCode || '').slice(0, -1);
          component.requestUpdate();
        };

        const handlePinCancel = () => {
          component._alarmPendingAction = null;
          component._alarmPinCode = '';
          component.requestUpdate();
        };

        const showingPinPad = !!component._alarmPendingAction;

        return html`
          <!-- Alarm State Banner -->
          <div class="alarm-state-display ${stateColorClass}">
            <div class="alarm-state-icon">
              <ha-icon icon="${stateIcon}"></ha-icon>
            </div>
            <div class="alarm-state-info">
              <div class="alarm-state-name">${attrs.friendly_name || 'Alarm'}</div>
              <div class="alarm-state-text">${t(`status.alarm.${state}`, state)}</div>
            </div>
          </div>

          ${showingPinPad ? html`
            <!-- PIN Code Entry -->
            <div class="alarm-pin-section">
              <div class="alarm-pin-display">
                ${(component._alarmPinCode || '').split('').map(() => html`<span class="alarm-pin-dot filled"></span>`)}
                ${Array(Math.max(0, 4 - (component._alarmPinCode || '').length)).fill(0).map(() => html`<span class="alarm-pin-dot"></span>`)}
              </div>
              <div class="alarm-pin-pad">
                ${[1,2,3,4,5,6,7,8,9].map(d => html`
                  <button class="alarm-pin-key" @click=${() => handlePinDigit(String(d))}>${d}</button>
                `)}
                <button class="alarm-pin-key alarm-pin-cancel" @click=${handlePinCancel}>
                  <ha-icon icon="mdi:close"></ha-icon>
                </button>
                <button class="alarm-pin-key" @click=${() => handlePinDigit('0')}>0</button>
                <button class="alarm-pin-key alarm-pin-backspace" @click=${handlePinBackspace}>
                  <ha-icon icon="mdi:backspace-outline"></ha-icon>
                </button>
              </div>
              <button
                class="alarm-pin-submit ${(component._alarmPinCode || '').length >= 4 ? '' : 'disabled'}"
                @click=${handlePinSubmit}
                ?disabled=${(component._alarmPinCode || '').length < 4}
              >${t('common.actions.confirm', 'Confirm')}</button>
            </div>
          ` : html`
            <!-- Arm/Disarm Controls -->
            <div class="alarm-controls">
              ${isDisarmed || isPending ? html`
                <!-- Arm buttons -->
                ${supportsHome ? html`
                  <button class="alarm-mode-btn alarm-mode-home" @click=${() => handleArmAction('alarm_arm_home')}>
                    <ha-icon icon="mdi:shield-home"></ha-icon>
                    <span>${t('status.alarm.armed_home', 'Home')}</span>
                  </button>
                ` : ''}
                ${supportsAway ? html`
                  <button class="alarm-mode-btn alarm-mode-away" @click=${() => handleArmAction('alarm_arm_away')}>
                    <ha-icon icon="mdi:shield-lock"></ha-icon>
                    <span>${t('status.alarm.armed_away', 'Away')}</span>
                  </button>
                ` : ''}
                ${supportsNight ? html`
                  <button class="alarm-mode-btn alarm-mode-night" @click=${() => handleArmAction('alarm_arm_night')}>
                    <ha-icon icon="mdi:shield-moon"></ha-icon>
                    <span>${t('status.alarm.armed_night', 'Night')}</span>
                  </button>
                ` : ''}
              ` : html`
                <!-- Disarm button -->
                <button class="alarm-mode-btn alarm-mode-disarm" @click=${() => handleArmAction('alarm_disarm')}>
                  <ha-icon icon="mdi:shield-off"></ha-icon>
                  <span>${t('status.alarm.disarmed', 'Disarm')}</span>
                </button>
              `}
            </div>

            ${openSensors && Object.keys(openSensors).length > 0 ? html`
              <!-- Open Sensors (blocking arming) -->
              <div class="alarm-open-sensors">
                <h4 class="alarm-open-sensors-title">
                  <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
                  ${t('status.alarm.openSensors', 'Open Sensors')}
                </h4>
                <div class="alarm-open-sensors-list">
                  ${Object.entries(openSensors).map(([entityId, name]) => html`
                    <div class="alarm-open-sensor-item">
                      <ha-icon icon="mdi:alert"></ha-icon>
                      <span>${name || entityId}</span>
                    </div>
                  `)}
                </div>
              </div>
            ` : ''}
          `}
        `;
      })()}
    ` : ''}

    <!-- Windows Content -->
    ${component._activeSecurityTab === 'windows' ? html`
      ${enabledWindows.length === 0 ? html`
        <div class="security-empty-state">
          ${t('ui.errors.no_windows_enabled')}
        </div>
      ` : html`
        <!-- Open Windows -->
        ${enabledWindows.filter(w => w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.open_windows')}</h3>
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledWindows.filter(w => w.isOpen)).map(w => renderEntityCard(w, 'window'))}
          </div>
        ` : ''}

        <!-- Closed Windows -->
        ${enabledWindows.filter(w => !w.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.closed_windows')}</h3>
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
          ${t('ui.errors.no_garages_enabled')}
        </div>
      ` : html`
        <!-- Open Garages -->
        ${enabledGarages.filter(g => g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.open_garages')}</h3>
          <div class="security-garage-list">
            ${sortByLastChangedTime(enabledGarages.filter(g => g.isOpen)).map(g => renderGarageCard(g))}
          </div>
        ` : ''}

        <!-- Closed Garages -->
        ${enabledGarages.filter(g => !g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.closed_garages')}</h3>
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
          ${t('ui.errors.no_motion_enabled')}
        </div>
      ` : html`
        <!-- Active Motion -->
        ${enabledMotion.filter(m => m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">${t('sensor.motion.detected')}</h3>
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledMotion.filter(m => m.isActive)).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}

        <!-- Inactive Motion -->
        ${enabledMotion.filter(m => !m.isActive).length > 0 ? html`
          <h3 class="security-subsection-title">${t('sensor.motion.no_motion')}</h3>
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledMotion.filter(m => !m.isActive)).map(m => renderEntityCard(m, 'motion'))}
          </div>
        ` : ''}
      `}
    ` : ''}
  `;
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
                 // Tap toggles light on/off (drag changes brightness)
                 component._toggleLight(entityId);
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
                 // If dragged, set brightness; otherwise tap = toggle (handled by click)
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
                   // If dragged, set brightness; otherwise click = toggle (handled by click event)
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
        <div class="battery-empty-text">${t('ui.sections.batteries_ok')}</div>
        <div class="battery-empty-subtext">${t('ui.sections.no_devices_under')} ${threshold}%</div>
      </div>
    `;
  }

  return html`
    <div class="battery-header-info">
      <span>${lowBatteryDevices.length} ${lowBatteryDevices.length === 1 ? t('ui.sections.device') : t('ui.sections.devices')} ${t('common.options.under')} ${threshold}%</span>
    </div>
    <div class="battery-device-list">
      ${lowBatteryDevices.map(device => {
        // Long press closes popup first then opens HA details; tap opens directly
        const batteryLongPress = createLongPressHandlers(
          () => component._showMoreInfo(device.entityId),
          () => {
            component._batteryPopupOpen = false;
            component.requestUpdate();
            requestAnimationFrame(() => {
              openMoreInfo(component, device.entityId);
            });
          }
        );

        return html`
        <div
          class="battery-device-card"
          style="cursor: pointer; user-select: none; -webkit-user-select: none;"
          @touchstart=${batteryLongPress.onTouchStart}
          @touchmove=${batteryLongPress.onTouchMove}
          @touchend=${batteryLongPress.onTouchEnd}
          @touchcancel=${batteryLongPress.onTouchCancel}
          @mousedown=${batteryLongPress.onMouseDown}
          @mouseup=${batteryLongPress.onMouseUp}
          @mouseleave=${batteryLongPress.onMouseLeave}
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
      `})}
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

  // Render a single cover card with long-press to open HA details
  const renderCoverCard = (cover) => {
    const coverLongPress = createLongPressHandlers(
      () => component._toggleCover(cover.entityId),
      () => {
        component._coversPopupOpen = false;
        component.requestUpdate();
        requestAnimationFrame(() => {
          openMoreInfo(component, cover.entityId);
        });
      }
    );

    return html`
    <div class="covers-popup-card ${cover.isOpen ? 'open' : 'closed'}">
      <div class="covers-popup-header"
           style="cursor: pointer; user-select: none; -webkit-user-select: none;"
           @touchstart=${coverLongPress.onTouchStart}
           @touchmove=${coverLongPress.onTouchMove}
           @touchend=${coverLongPress.onTouchEnd}
           @touchcancel=${coverLongPress.onTouchCancel}
           @mousedown=${coverLongPress.onMouseDown}
           @mouseup=${coverLongPress.onMouseUp}
           @mouseleave=${coverLongPress.onMouseLeave}>
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
  `};


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

  // Render a single TV card with long-press to open HA details
  const renderTVCard = (tv) => {
    const tvLongPress = createLongPressHandlers(
      () => component._toggleTV(tv.entityId),
      () => {
        component._tvsPopupOpen = false;
        component.requestUpdate();
        requestAnimationFrame(() => {
          openMoreInfo(component, tv.entityId);
        });
      }
    );

    return html`
    <div class="tvs-popup-card ${tv.isOn ? 'on' : 'off'}">
      <div class="tvs-popup-header"
           style="cursor: pointer; user-select: none; -webkit-user-select: none;"
           @touchstart=${tvLongPress.onTouchStart}
           @touchmove=${tvLongPress.onTouchMove}
           @touchend=${tvLongPress.onTouchEnd}
           @touchcancel=${tvLongPress.onTouchCancel}
           @mousedown=${tvLongPress.onMouseDown}
           @mouseup=${tvLongPress.onMouseUp}
           @mouseleave=${tvLongPress.onMouseLeave}>
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
  `};


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
