/**
 * Room Popup Module
 * Renders the room detail popup with climate controls, lights, covers, media players, and garages
 */

import { renderPopupHeader } from '../../components/layout/index.js';
import { renderTemperatureChart } from '../../components/charts/index.js';
import { openMoreInfo } from '../../utils/helpers.js';
import { t } from '../../utils/i18n.js';
import { triggerHaptic } from '../../utils/haptic.js';
import { createLongPressHandlers } from '../../utils/long-press-handlers.js';

/**
 * Check if room data is still loading
 * Returns true if hass is not available or essential data services are not ready
 * @param {Object} component - DashviewPanel instance
 * @param {string} areaId - Area ID to check
 * @returns {boolean} True if loading
 */
function isRoomDataLoading(component, areaId) {
  // Check if hass is available
  if (!component.hass) return true;

  // Check if room data service indicates loading (if it exists)
  if (component._roomDataService?.isReady) {
    return component._roomDataService.isReady(areaId) === false;
  }

  // Check if states are populated (basic hass availability check)
  if (!component.hass.states || Object.keys(component.hass.states).length === 0) {
    return true;
  }

  return false;
}

/**
 * Render skeleton loaders for room popup while data is loading
 * @param {Function} html - Lit html template function
 * @returns {TemplateResult} Skeleton template
 */
function renderRoomSkeleton(html) {
  return html`
    <div class="popup-skeleton" role="status" aria-busy="true" aria-label="Loading room data">
      <!-- Skeleton for chips row -->
      <div class="popup-skeleton-chips">
        <div class="popup-skeleton-chip shimmer"></div>
        <div class="popup-skeleton-chip shimmer"></div>
        <div class="popup-skeleton-chip shimmer"></div>
      </div>

      <!-- Skeleton for quick actions -->
      <div class="popup-skeleton-actions">
        <div class="popup-skeleton-action shimmer"></div>
        <div class="popup-skeleton-action shimmer"></div>
      </div>

      <!-- Skeleton for section (lights/covers/etc) -->
      <div class="popup-skeleton-section">
        <div class="popup-skeleton-section-header">
          <div class="popup-skeleton-icon shimmer"></div>
          <div class="popup-skeleton-title shimmer"></div>
          <div class="popup-skeleton-count shimmer"></div>
        </div>
        <div class="popup-skeleton-items">
          <div class="popup-skeleton-item shimmer"></div>
          <div class="popup-skeleton-item shimmer"></div>
          <div class="popup-skeleton-item shimmer"></div>
        </div>
      </div>

      <!-- Second skeleton section -->
      <div class="popup-skeleton-section">
        <div class="popup-skeleton-section-header">
          <div class="popup-skeleton-icon shimmer"></div>
          <div class="popup-skeleton-title shimmer"></div>
          <div class="popup-skeleton-count shimmer"></div>
        </div>
        <div class="popup-skeleton-items">
          <div class="popup-skeleton-item shimmer"></div>
          <div class="popup-skeleton-item shimmer"></div>
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the complete room popup
 * @param {Object} component - DashviewPanel instance
 * @param {Function} html - Lit html template function
 * @returns {TemplateResult} Room popup template
 */
export function renderRoomPopup(component, html) {
  if (!component._popupRoom) return '';

  const areaId = component._popupRoom.area_id;
  const isLoading = isRoomDataLoading(component, areaId);

  return html`
    <div class="popup-overlay" @click=${component._handlePopupOverlayClick}>
      <div class="popup-container">
        ${renderPopupHeader(html, {
          icon: component._getAreaIcon(component._popupRoom),
          title: component._popupRoom.name,
          onClose: component._closeRoomPopup
        })}

        ${isLoading ? renderRoomSkeleton(html) : html`
          ${renderChipsRow(component, html, areaId)}
          ${renderQuickActions(component, html, areaId)}
          ${renderClimateNotification(component, html, areaId)}
          ${renderThermostatSection(component, html, areaId)}
          ${renderTemperatureSection(component, html, areaId)}
          ${renderLightSection(component, html, areaId)}
          ${renderCoverSection(component, html, areaId)}
          ${renderMediaSection(component, html, areaId)}
          ${renderTVSection(component, html, areaId)}
          ${renderLockSection(component, html, areaId)}
          ${renderGarageSection(component, html, areaId)}
          ${renderApplianceSection(component, html, areaId)}
        `}

        <div class="popup-content">
          <!-- Additional content placeholder -->
        </div>
      </div>
    </div>
  `;
}

/**
 * Render the status chips row (motion, smoke, windows, etc.)
 */
function renderChipsRow(component, html, areaId) {
  const chips = component._getRoomPopupChips(areaId);
  if (chips.length === 0) return '';

  return html`
    <div class="popup-chips-row">
      ${chips.map(chip => html`
        <div class="popup-chip ${chip.type === 'smoke' ? 'smoke' : !chip.isActive ? 'inactive' : ''}">
          <div class="popup-chip-icon">
            <ha-icon icon="${chip.icon}"></ha-icon>
          </div>
          <div class="popup-chip-content">
            <span class="popup-chip-state">${chip.stateText}</span>
            <span class="popup-chip-time">${chip.timeAgo}</span>
          </div>
        </div>
      `)}
    </div>
  `;
}

/**
 * Render quick action buttons (all lights, all covers, and custom scene buttons)
 */
function renderQuickActions(component, html, areaId) {
  const lights = component._getEnabledLightsForRoom(areaId);
  const covers = component._getEnabledCoversForRoom(areaId);
  const locks = component._getEnabledLocksForRoom(areaId);
  const tvs = component._getEnabledTVsForRoom(areaId);
  const garages = component._getEnabledGaragesForRoom(areaId);
  const mediaPlayers = component._getEnabledMediaPlayersForRoom(areaId);

  // Get custom scene buttons assigned to this room
  const roomSceneButtons = (component._sceneButtons || []).filter(
    btn => btn.roomId === areaId && btn.entity
  );

  if (lights.length === 0 && covers.length === 0 && locks.length === 0 && tvs.length === 0 && garages.length === 0 && mediaPlayers.length === 0 && roomSceneButtons.length === 0) return '';

  const lightsOnCount = lights.filter(l => l.state === 'on').length;
  const anyLightsOn = lightsOnCount > 0;

  const coversOpenCount = covers.filter(c => c.state === 'open' || (c.position && c.position < 100)).length;
  const anyCoversOpen = coversOpenCount > 0;

  const anyLocksUnlocked = locks.some(l => l.state === 'unlocked');
  const anyTVsOn = tvs.some(tv => tv.state === 'on');
  const anyGaragesOpen = garages.some(g => g.state === 'open');
  const anyMediaPlaying = mediaPlayers.some(mp => mp.state === 'playing');

  // Handler for executing scene button action
  const executeSceneButton = (button) => {
    if (!button.entity || !component.hass) return;
    triggerHaptic('light');

    const [domain] = button.entity.split('.');

    if (button.actionType === 'scene') {
      component.hass.callService('scene', 'turn_on', { entity_id: button.entity });
    } else if (button.actionType === 'script') {
      component.hass.callService('script', 'turn_on', { entity_id: button.entity });
    } else {
      // Service call - toggle the entity
      if (domain === 'light' || domain === 'switch' || domain === 'input_boolean') {
        component.hass.callService(domain, 'toggle', { entity_id: button.entity });
      } else if (domain === 'cover') {
        const state = component.hass.states[button.entity];
        const isOpen = state?.state === 'open';
        component.hass.callService('cover', isOpen ? 'close_cover' : 'open_cover', { entity_id: button.entity });
      } else if (domain === 'automation') {
        component.hass.callService('automation', 'trigger', { entity_id: button.entity });
      } else {
        // Default: try to toggle
        component.hass.callService('homeassistant', 'toggle', { entity_id: button.entity });
      }
    }
  };

  return html`
    <div class="popup-scene-buttons">
      ${lights.length > 0 ? html`
        <button
          class="popup-scene-button ${anyLightsOn ? 'active' : ''}"
          @click=${() => { triggerHaptic('light'); component._toggleAllRoomLights(areaId, !anyLightsOn); }}
        >
          <ha-icon icon="${anyLightsOn ? 'mdi:lightbulb-off' : 'mdi:lightbulb-group'}"></ha-icon>
          <span>${anyLightsOn ? t('popup.actions.lights_off') : t('popup.actions.lights_on')}</span>
        </button>
      ` : ''}
      ${covers.length > 0 ? html`
        <button
          class="popup-scene-button ${anyCoversOpen ? '' : 'active'}"
          @click=${() => { triggerHaptic('light'); component._toggleAllRoomCovers(areaId, anyCoversOpen); }}
        >
          <ha-icon icon="${anyCoversOpen ? 'mdi:window-shutter' : 'mdi:window-shutter-open'}"></ha-icon>
          <span>${anyCoversOpen ? t('popup.actions.covers_close') : t('popup.actions.covers_open')}</span>
        </button>
      ` : ''}
      ${anyLocksUnlocked ? html`
        <button
          class="popup-scene-button"
          @click=${() => { triggerHaptic('light'); component._lockAllRoom(areaId); }}
        >
          <ha-icon icon="mdi:lock-open"></ha-icon>
          <span>${t('popup.actions.lock_all')}</span>
        </button>
      ` : ''}
      ${anyTVsOn ? html`
        <button
          class="popup-scene-button"
          @click=${() => { triggerHaptic('light'); component._turnOffAllRoomTVs(areaId); }}
        >
          <ha-icon icon="mdi:television-off"></ha-icon>
          <span>${t('popup.actions.tvs_off')}</span>
        </button>
      ` : ''}
      ${anyGaragesOpen ? html`
        <button
          class="popup-scene-button"
          @click=${() => { triggerHaptic('light'); component._closeAllRoomGarages(areaId); }}
        >
          <ha-icon icon="mdi:garage-open"></ha-icon>
          <span>${t('popup.actions.close_garages')}</span>
        </button>
      ` : ''}
      ${anyMediaPlaying ? html`
        <button
          class="popup-scene-button"
          @click=${() => { triggerHaptic('light'); component._stopAllRoomMedia(areaId); }}
        >
          <ha-icon icon="mdi:stop"></ha-icon>
          <span>${t('popup.actions.stop_media')}</span>
        </button>
      ` : ''}
      ${roomSceneButtons.map(button => html`
        <button
          class="popup-scene-button"
          @click=${() => executeSceneButton(button)}
        >
          <ha-icon icon="${button.icon || 'mdi:play'}"></ha-icon>
          <span>${button.label || 'Scene'}</span>
        </button>
      `)}
    </div>
  `;
}

/**
 * Render climate notification (temperature/humidity warnings and rate-of-change alerts)
 */
function renderClimateNotification(component, html, areaId) {
  const notification = component._getRoomClimateNotification(areaId);
  const rateOfChangeAlert = component._roomRateOfChangeAlert;

  if (!notification && !rateOfChangeAlert) return '';

  return html`
    ${notification ? html`
      <div class="popup-notification">
        <div class="popup-notification-icon">⚠️</div>
        <div class="popup-notification-title">${notification.title}</div>
        <div class="popup-notification-subtitle">${notification.subtitle}</div>
      </div>
    ` : ''}
    ${rateOfChangeAlert ? html`
      <div class="popup-notification">
        <div class="popup-notification-icon">⚠️</div>
        <div class="popup-notification-title">${rateOfChangeAlert.title}</div>
        <div class="popup-notification-subtitle">${rateOfChangeAlert.subtitle}</div>
      </div>
    ` : ''}
  `;
}

/**
 * Render thermostat section with temperature chart and controls
 */
function renderThermostatSection(component, html, areaId) {
  const climates = component._getEnabledClimatesForRoom(areaId);
  if (climates.length === 0) return '';

  return html`
    <div class="popup-thermostat-section">
      ${climates.map(climate => {
        const currentTemp = climate.currentTemp !== undefined && climate.currentTemp !== null
          ? Number(climate.currentTemp).toFixed(1) + '°'
          : '';
        const targetTemp = climate.targetTemp !== undefined && climate.targetTemp !== null
          ? climate.targetTemp + '°'
          : '-';

        const history = component._thermostatHistory[climate.entity_id] || [];

        return html`
          <div class="popup-thermostat-card">
            <div class="popup-thermostat-chart">
              ${renderTemperatureChart(html, history)}
            </div>
            <div class="popup-thermostat-content">
              <div class="popup-thermostat-temp">${currentTemp}</div>
              <div class="popup-thermostat-name">${climate.name}</div>
            </div>
            <div class="popup-thermostat-controls">
              <div class="popup-thermostat-btn2">
                <button
                  class="${climate.state === 'off' ? 'active' : ''}"
                  @click=${() => component._setThermostatHvacMode(climate.entity_id, 'off')}
                >
                  <ha-icon icon="mdi:power"></ha-icon>
                </button>
                <button
                  class="${climate.state === 'heat' ? 'active' : ''}"
                  @click=${() => component._setThermostatHvacMode(climate.entity_id, 'heat')}
                >
                  <ha-icon icon="mdi:heat-wave"></ha-icon>
                </button>
              </div>
              <div class="popup-thermostat-btn1 ${climate.state === 'off' ? 'hidden' : ''}">
                <button @click=${() => component._adjustThermostatTemp(climate.entity_id, 0.5)}>
                  <ha-icon icon="mdi:chevron-up"></ha-icon>
                </button>
                <button>${targetTemp}</button>
                <button @click=${() => component._adjustThermostatTemp(climate.entity_id, -0.5)}>
                  <ha-icon icon="mdi:chevron-down"></ha-icon>
                </button>
              </div>
            </div>
          </div>
        `;
      })}
    </div>
  `;
}

/**
 * Render temperature section (for rooms without climate entities)
 */
function renderTemperatureSection(component, html, areaId) {
  const climates = component._getEnabledClimatesForRoom(areaId);
  if (climates.length > 0) return '';

  const temperatureSensors = component._getEnabledTemperatureSensorsForRoom(areaId);
  if (temperatureSensors.length === 0) return '';

  const humiditySensors = component._getEnabledHumiditySensorsForRoom(areaId);

  return html`
    <div class="popup-temperature-section">
      ${temperatureSensors.map((tempSensor, index) => {
        const tempValue = tempSensor.state !== 'unavailable' && tempSensor.state !== 'unknown'
          ? Number(tempSensor.state).toFixed(1) + '°'
          : '--';

        const humiditySensor = humiditySensors[index] || humiditySensors[0];
        const humidityValue = humiditySensor &&
          humiditySensor.state !== 'unavailable' &&
          humiditySensor.state !== 'unknown'
            ? Number(humiditySensor.state).toFixed(0) + '%'
            : null;

        return html`
          <div class="popup-temperature-card">
            <div class="popup-temperature-temp">
              ${tempValue}${humidityValue ? html`<span class="popup-temperature-humidity">${humidityValue}</span>` : ''}
            </div>
            <div class="popup-temperature-name">${tempSensor.name}</div>
          </div>
        `;
      })}
    </div>
  `;
}

/**
 * Get the fill color for a light slider based on RGB color or default warm white
 * @param {Object} light - Light entity data with rgbColor
 * @returns {string} RGB color string for CSS
 */
function getLightFillColor(light) {
  const [r, g, b] = light.rgbColor || [255, 180, 107]; // Default warm white
  return `${r}, ${g}, ${b}`;
}

/**
 * Handle light slider interaction (click or drag)
 * @param {Event} e - Mouse/touch event
 * @param {Object} component - DashviewPanel instance
 * @param {string} entityId - Light entity ID
 * @param {boolean} isDrag - Whether this is a drag move (not final)
 * @param {number} [previousValue] - Previous brightness value for error recovery
 */
function handleLightSliderInteraction(e, component, entityId, isDrag = false, previousValue = null) {
  const sliderArea = e.currentTarget;
  const rect = sliderArea.getBoundingClientRect();
  const clientX = e.touches ? e.touches[0].clientX : e.clientX;
  const percentage = Math.max(1, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));

  // Update visual immediately
  const item = sliderArea.closest('.popup-light-item');
  const fill = item?.querySelector('.popup-light-slider-fill');
  const label = item?.querySelector('.popup-light-item-label');

  if (fill) fill.style.width = `${percentage}%`;
  if (label) label.textContent = `${percentage}%`;

  // Only call service on final interaction (not during drag)
  if (!isDrag) {
    // Store previous value for error recovery
    const restoreValue = previousValue !== null ? previousValue : percentage;

    component._setLightBrightness(entityId, percentage, (error) => {
      // On error, restore slider to previous state
      if (fill) fill.style.width = `${restoreValue}%`;
      if (label) label.textContent = `${restoreValue}%`;
      // Add visual error feedback
      if (item) {
        item.classList.add('error');
        setTimeout(() => item.classList.remove('error'), 2000);
      }
    });
  }

  return percentage;
}

/**
 * Render light section with expandable list and brightness sliders
 */
function renderLightSection(component, html, areaId) {
  const lights = component._getEnabledLightsForRoom(areaId);
  if (lights.length === 0) return '';

  const onCount = lights.filter(l => l.state === 'on').length;
  const totalCount = lights.length;

  return html`
    <div class="popup-light-section">
      <div class="popup-light-header" @click=${component._togglePopupLightExpanded}>
        <ha-icon icon="mdi:lightbulb"></ha-icon>
        <span class="popup-light-title">${t('ui.sections.light')}</span>
        <span class="popup-light-count">${t('popup.room.lights_count', { on: onCount, total: totalCount })}</span>
      </div>

      <div class="popup-light-content ${component._popupLightExpanded ? 'expanded' : ''}">
        ${lights.map(light => {
          const isOn = light.state === 'on';
          const isDimmable = light.isDimmable;
          const brightness = light.brightnessPercent || 0;
          const fillColor = getLightFillColor(light);

          // Create long press handlers for this light
          const longPress = createLongPressHandlers(
            () => component._toggleLight(light.entity_id),
            () => {
              // Close popup first so more-info dialog appears on top
              component._closeRoomPopup();
              // Small delay to ensure popup is hidden before more-info opens
              requestAnimationFrame(() => {
                openMoreInfo(component, light.entity_id);
              });
            }
          );

          // For dimmable lights that are on: show slider
          // For non-dimmable or off: show simple toggle button
          if (isDimmable && isOn) {
            return html`
              <div class="popup-light-item has-slider">
                <div class="popup-light-slider-fill"
                     style="width: ${brightness}%; background: linear-gradient(90deg, rgba(${fillColor}, 0.9) 0%, rgba(${fillColor}, 0.7) 100%);"></div>
                <div class="popup-light-item-header on"
                     style="cursor: pointer; user-select: none; -webkit-user-select: none;"
                     @touchstart=${longPress.onTouchStart}
                     @touchmove=${longPress.onTouchMove}
                     @touchend=${longPress.onTouchEnd}
                     @touchcancel=${longPress.onTouchCancel}
                     @mousedown=${longPress.onMouseDown}
                     @mouseup=${longPress.onMouseUp}
                     @mouseleave=${longPress.onMouseLeave}>
                  <div class="popup-light-item-icon">
                    <ha-icon icon="${light.icon}"></ha-icon>
                  </div>
                  <div class="popup-light-item-content">
                    <span class="popup-light-item-label">${brightness}%</span>
                    <span class="popup-light-item-name">${light.name}</span>
                  </div>
                  <div class="popup-light-slider-area"
                       @click=${(e) => {
                         e.stopPropagation();
                         // Tap toggles light on/off (drag changes brightness)
                         component._toggleLight(light.entity_id);
                       }}
                       @touchstart=${(e) => {
                         const item = e.currentTarget.closest('.popup-light-item');
                         item?.classList.add('dragging');
                         item._dragValue = null;
                         item._previousValue = brightness;
                       }}
                       @touchmove=${(e) => {
                         e.preventDefault();
                         const item = e.currentTarget.closest('.popup-light-item');
                         item._dragValue = handleLightSliderInteraction(e, component, light.entity_id, true);
                       }}
                       @touchend=${(e) => {
                         const item = e.currentTarget.closest('.popup-light-item');
                         item?.classList.remove('dragging');
                         // If dragged, set brightness; otherwise tap = toggle (handled by click)
                         if (item?._dragValue !== null && item?._dragValue !== undefined) {
                           const fill = item?.querySelector('.popup-light-slider-fill');
                           const label = item?.querySelector('.popup-light-item-label');
                           const previousValue = item._previousValue || brightness;
                           component._setLightBrightness(light.entity_id, item._dragValue, (error) => {
                             // Restore on error
                             if (fill) fill.style.width = `${previousValue}%`;
                             if (label) label.textContent = `${previousValue}%`;
                             item?.classList.add('error');
                             setTimeout(() => item?.classList.remove('error'), 2000);
                           });
                         }
                       }}
                       @mousedown=${(e) => {
                         e.preventDefault();
                         e.stopPropagation();
                         const item = e.currentTarget.closest('.popup-light-item');
                         const sliderArea = e.currentTarget;
                         item?.classList.add('dragging');
                         let dragValue = null;
                         const previousValue = brightness;

                         const onMouseMove = (moveE) => {
                           const rect = sliderArea.getBoundingClientRect();
                           const percentage = Math.max(1, Math.min(100, Math.round(((moveE.clientX - rect.left) / rect.width) * 100)));
                           const fill = item?.querySelector('.popup-light-slider-fill');
                           const label = item?.querySelector('.popup-light-item-label');
                           if (fill) fill.style.width = `${percentage}%`;
                           if (label) label.textContent = `${percentage}%`;
                           dragValue = percentage;
                         };

                         const onMouseUp = () => {
                           item?.classList.remove('dragging');
                           // If dragged, set brightness; otherwise click = toggle (handled by click event)
                           if (dragValue !== null) {
                             const fill = item?.querySelector('.popup-light-slider-fill');
                             const label = item?.querySelector('.popup-light-item-label');
                             component._setLightBrightness(light.entity_id, dragValue, (error) => {
                               // Restore on error
                               if (fill) fill.style.width = `${previousValue}%`;
                               if (label) label.textContent = `${previousValue}%`;
                               item?.classList.add('error');
                               setTimeout(() => item?.classList.remove('error'), 2000);
                             });
                           }
                           document.removeEventListener('mousemove', onMouseMove);
                           document.removeEventListener('mouseup', onMouseUp);
                         };

                         document.addEventListener('mousemove', onMouseMove);
                         document.addEventListener('mouseup', onMouseUp);
                       }}>
                  </div>
                </div>
              </div>
            `;
          } else {
            // Non-dimmable or off: simple toggle button with long press for more-info
            return html`
              <div class="popup-light-item">
                <div class="popup-light-item-header ${isOn ? 'on' : 'off'}"
                     style="${isOn ? `background: linear-gradient(135deg, rgba(${fillColor}, 0.5) 0%, rgba(${fillColor}, 0.3) 100%);` : ''} user-select: none; -webkit-user-select: none;"
                     @touchstart=${longPress.onTouchStart}
                     @touchmove=${longPress.onTouchMove}
                     @touchend=${longPress.onTouchEnd}
                     @touchcancel=${longPress.onTouchCancel}
                     @mousedown=${longPress.onMouseDown}
                     @mouseup=${longPress.onMouseUp}
                     @mouseleave=${longPress.onMouseLeave}>
                  <div class="popup-light-item-icon">
                    <ha-icon icon="${light.icon}"></ha-icon>
                  </div>
                  <div class="popup-light-item-content">
                    <span class="popup-light-item-label">${isOn ? (isDimmable && brightness ? `${brightness}%` : t('common.status.on')) : t('common.status.off')}</span>
                    <span class="popup-light-item-name">${light.name}</span>
                  </div>
                </div>
              </div>
            `;
          }
        })}
      </div>
    </div>
  `;
}

/**
 * Render cover/blind section with slider controls
 */
function renderCoverSection(component, html, areaId) {
  const covers = component._getEnabledCoversForRoom(areaId);
  if (covers.length === 0) return '';

  // Calculate average display position (accounting for inversion per cover)
  const avgDisplayPosition = Math.round(covers.reduce((sum, c) => {
    const displayPos = c.invertPosition ? (100 - (c.position || 0)) : (c.position || 0);
    return sum + displayPos;
  }, 0) / covers.length);

  return html`
    <div class="popup-cover-section">
      <div class="popup-cover-header">
        <span class="popup-cover-title" @click=${component._togglePopupCoverExpanded}>${t('ui.sections.covers')}</span>
        <div class="popup-cover-slider"
          @click=${(e) => component._handleAllCoversSliderClick(e, areaId)}
          @touchstart=${(e) => component._handleCoverSliderTouchStart(e, null, areaId)}
          @touchmove=${(e) => component._handleCoverSliderTouchMove(e)}
          @touchend=${(e) => component._handleCoverSliderTouchEnd(e)}
        >
          <div class="popup-cover-slider-fill" style="width: ${avgDisplayPosition}%"></div>
          <div class="popup-cover-slider-thumb" style="left: ${avgDisplayPosition}%"></div>
        </div>
        <span class="popup-cover-position" @click=${component._togglePopupCoverExpanded}>${avgDisplayPosition}%</span>
      </div>

      <div class="popup-cover-content ${component._popupCoverExpanded ? 'expanded' : ''}">
        <!-- Preset buttons -->
        <div class="popup-cover-presets">
          <button class="popup-cover-preset" @click=${() => component._setAllCoversPosition(areaId, 0)}>0%</button>
          <button class="popup-cover-preset" @click=${() => component._setAllCoversPosition(areaId, 25)}>25%</button>
          <button class="popup-cover-preset" @click=${() => component._setAllCoversPosition(areaId, 50)}>50%</button>
          <button class="popup-cover-preset" @click=${() => component._setAllCoversPosition(areaId, 75)}>75%</button>
          <button class="popup-cover-preset" @click=${() => component._setAllCoversPosition(areaId, 100)}>100%</button>
        </div>

        <!-- Individual covers -->
        ${covers.map(cover => {
          const displayPosition = cover.invertPosition ? (100 - (cover.position || 0)) : (cover.position || 0);
          return html`
          <div class="popup-cover-item">
            <span class="popup-cover-item-name">${cover.name}</span>
            <div class="popup-cover-slider"
              @click=${(e) => component._handleCoverSliderClick(e, cover.entity_id)}
              @touchstart=${(e) => component._handleCoverSliderTouchStart(e, cover.entity_id, null)}
              @touchmove=${(e) => component._handleCoverSliderTouchMove(e)}
              @touchend=${(e) => component._handleCoverSliderTouchEnd(e)}
            >
              <div class="popup-cover-slider-fill" style="width: ${displayPosition}%"></div>
              <div class="popup-cover-slider-thumb" style="left: ${displayPosition}%"></div>
            </div>
            <span class="popup-cover-position">${displayPosition}%</span>
          </div>
        `})}
      </div>
    </div>
  `;
}

/**
 * Render media player section
 */
function renderMediaSection(component, html, areaId) {
  const mediaPlayers = component._getEnabledMediaPlayersForRoom(areaId);
  if (mediaPlayers.length === 0) return '';

  const playingCount = mediaPlayers.filter(m => m.state === 'playing').length;
  const totalCount = mediaPlayers.length;

  return html`
    <div class="popup-media-section">
      <div class="popup-media-header" @click=${component._togglePopupMediaExpanded}>
        <ha-icon icon="mdi:music"></ha-icon>
        <span class="popup-media-title">${t('ui.sections.music')}</span>
        <span class="popup-media-count">${t('popup.room.media_count', { playing: playingCount, total: totalCount })}</span>
      </div>

      <div class="popup-media-content ${component._popupMediaExpanded ? 'expanded' : ''}">
        ${mediaPlayers.map(player => renderMediaPlayer(component, html, player))}
      </div>
    </div>
  `;
}

/**
 * Render a single media player card
 */
function renderMediaPlayer(component, html, player) {
  const isPlaying = player.state === 'playing';
  const isPaused = player.state === 'paused';
  const isActive = isPlaying || isPaused;
  const volumePercent = player.volume_level !== undefined ? Math.round(player.volume_level * 100) : 0;

  return html`
    <div class="popup-media-player">
      <div class="popup-media-player-name">${player.name}</div>

      ${isActive ? html`
        <!-- Artwork -->
        <div class="popup-media-artwork-container">
          ${player.entity_picture ? html`
            <img class="popup-media-artwork" src="${player.entity_picture}" alt="Album art">
          ` : html`
            <div class="popup-media-artwork-placeholder">
              <ha-icon icon="mdi:music"></ha-icon>
            </div>
          `}
        </div>

        <!-- Title and Artist -->
        <div class="popup-media-info">
          <div class="popup-media-track-title">${player.media_title || t('media.unknown_title')}</div>
          <div class="popup-media-track-artist">${player.media_artist || t('media.unknown_artist')}</div>
        </div>

        <!-- Controls -->
        <div class="popup-media-controls">
          <button class="popup-media-control-btn ${player.repeat !== 'off' ? 'active' : ''}"
                  @click=${() => component._mediaToggleRepeat(player.entity_id)}>
            <ha-icon icon="${player.repeat === 'one' ? 'mdi:repeat-once' : 'mdi:repeat'}"></ha-icon>
          </button>
          <button class="popup-media-control-btn"
                  @click=${() => component._mediaPrevious(player.entity_id)}>
            <ha-icon icon="mdi:skip-previous"></ha-icon>
          </button>
          <button class="popup-media-control-btn popup-media-play-btn"
                  @click=${() => component._mediaPlayPause(player.entity_id)}>
            <ha-icon icon="${isPlaying ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
          </button>
          <button class="popup-media-control-btn"
                  @click=${() => component._mediaNext(player.entity_id)}>
            <ha-icon icon="mdi:skip-next"></ha-icon>
          </button>
          <button class="popup-media-control-btn ${player.shuffle ? 'active' : ''}"
                  @click=${() => component._mediaToggleShuffle(player.entity_id)}>
            <ha-icon icon="mdi:shuffle"></ha-icon>
          </button>
        </div>

        <!-- Volume Slider -->
        <div class="popup-media-volume-row">
          <div class="popup-media-volume-icon">
            <ha-icon icon="${player.is_volume_muted ? 'mdi:volume-off' : volumePercent > 50 ? 'mdi:volume-high' : volumePercent > 0 ? 'mdi:volume-medium' : 'mdi:volume-low'}"></ha-icon>
          </div>
          <div class="popup-media-volume-slider"
            @click=${(e) => component._handleMediaVolumeSliderClick(e, player.entity_id)}
            @touchstart=${(e) => component._handleMediaVolumeSliderTouchStart(e, player.entity_id)}
            @touchmove=${(e) => component._handleMediaVolumeSliderTouchMove(e, player.entity_id)}
            @touchend=${(e) => component._handleMediaVolumeSliderTouchEnd(e)}
          >
            <div class="popup-media-volume-fill" style="width: ${volumePercent}%"></div>
            <div class="popup-media-volume-thumb" style="left: ${volumePercent}%"></div>
          </div>
          <div class="popup-media-volume-percent">${volumePercent}%</div>
        </div>
      ` : html`
        <div class="popup-media-idle">
          ${player.state === 'idle' ? t('media.idle') : player.state === 'off' ? t('media.off') : player.state}
        </div>
      `}
    </div>
  `;
}

/**
 * Render TV section (collapsible like lights)
 */
function renderTVSection(component, html, areaId) {
  const tvs = component._getEnabledTVsForRoom(areaId);
  if (tvs.length === 0) return '';

  const onCount = tvs.filter(t => t.state === 'on').length;
  const totalCount = tvs.length;

  return html`
    <div class="popup-tv-section">
      <div class="popup-tv-header" @click=${component._togglePopupTVExpanded}>
        <ha-icon icon="mdi:television"></ha-icon>
        <span class="popup-tv-title">${t('ui.sections.tvs')}</span>
        <span class="popup-tv-count">${t('popup.room.tv_count', { on: onCount, total: totalCount })}</span>
      </div>

      <div class="popup-tv-content ${component._popupTVExpanded ? 'expanded' : ''}">
        ${tvs.map(tv => html`
          <div class="popup-tv-item ${tv.state === 'on' ? 'on' : 'off'}"
               @click=${() => component._toggleTV(tv.entity_id)}>
            <div class="popup-tv-item-icon ${tv.entityPicture ? 'has-image' : ''}">
              ${tv.entityPicture ? html`
                <img class="popup-tv-item-image" src="${tv.entityPicture}" alt="">
              ` : html`
                <ha-icon icon="${tv.state === 'on' ? 'mdi:television' : 'mdi:television-off'}"></ha-icon>
              `}
            </div>
            <div class="popup-tv-item-content">
              <span class="popup-tv-item-name">${tv.state === 'on' ? (tv.mediaTitle || tv.source || t('common.status.on')) : t('common.status.off')}</span>
              <span class="popup-tv-item-state">${tv.name}</span>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}

/**
 * Render lock section
 */
function renderLockSection(component, html, areaId) {
  const locks = component._getEnabledLocksForRoom(areaId);
  if (locks.length === 0) return '';

  const unlockedCount = locks.filter(l => l.state === 'unlocked').length;
  const totalCount = locks.length;

  return html`
    <div class="popup-lock-section">
      <div class="popup-lock-header" @click=${component._togglePopupLockExpanded}>
        <ha-icon icon="mdi:lock"></ha-icon>
        <span class="popup-lock-title">${t('ui.sections.locks')}</span>
        <span class="popup-lock-count">${unlockedCount > 0 ? t('lock.count_unlocked', { count: unlockedCount }) : t('lock.all_locked')}</span>
      </div>

      <div class="popup-lock-content ${component._popupLockExpanded ? 'expanded' : ''}"
        ${locks.map(lock => html`
          <div class="popup-lock-item ${lock.state === 'unlocked' ? 'unlocked' : 'locked'}"
               @click=${() => component._toggleLock(lock.entity_id)}>
            <div class="popup-lock-item-icon">
              <ha-icon icon="${lock.icon}"></ha-icon>
            </div>
            <div class="popup-lock-item-content">
              <span class="popup-lock-item-name">${lock.name}</span>
              <span class="popup-lock-item-state">${lock.state === 'locked' ? t('lock.locked') : lock.state === 'unlocked' ? t('lock.unlocked') : lock.state}</span>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}

/**
 * Render garage section
 */
function renderGarageSection(component, html, areaId) {
  const garages = component._getEnabledGaragesForRoom(areaId);
  if (garages.length === 0) return '';

  const openCount = garages.filter(g => g.state === 'open').length;
  const totalCount = garages.length;

  return html`
    <div class="popup-garage-section">
      <div class="popup-garage-header" @click=${component._togglePopupGarageExpanded}>
        <ha-icon icon="mdi:garage"></ha-icon>
        <span class="popup-garage-title">${t('ui.sections.garage')}</span>
        <span class="popup-garage-count">${t('popup.room.garage_count', { open: openCount, total: totalCount })}</span>
      </div>

      <div class="popup-garage-content ${component._popupGarageExpanded ? 'expanded' : ''}">
        ${garages.map(garage => html`
          <div class="popup-garage-item">
            <div class="popup-garage-item-header ${garage.state === 'open' ? 'open' : 'closed'}">
              <div class="popup-garage-item-icon">
                <ha-icon icon="${garage.state === 'open' ? 'mdi:garage-open' : 'mdi:garage'}"></ha-icon>
              </div>
              <div class="popup-garage-item-info">
                <span class="popup-garage-item-name">${garage.name}</span>
                <span class="popup-garage-item-last-changed">${component._formatGarageLastChanged(garage.last_changed)}</span>
              </div>
              <div class="popup-garage-item-controls">
                <button class="popup-garage-control-btn" @click=${() => component._openGarage(garage.entity_id)}>
                  <ha-icon icon="mdi:arrow-up"></ha-icon>
                </button>
                <button class="popup-garage-control-btn" @click=${() => component._closeGarage(garage.entity_id)}>
                  <ha-icon icon="mdi:arrow-down"></ha-icon>
                </button>
              </div>
            </div>
          </div>
        `)}
      </div>
    </div>
  `;
}

/**
 * Render appliance/devices section (washers, dishwashers, dryers, etc.)
 * Uses 2-column grid layout matching Lovelace "Andere Geräte" section
 * Expandable like other popup sections
 */
function renderApplianceSection(component, html, areaId) {
  // Get enabled appliances for this room
  const appliances = component._getEnabledAppliancesForArea ? component._getEnabledAppliancesForArea(areaId) : [];
  if (appliances.length === 0) return '';

  // Count active devices
  const activeCount = appliances.filter(a => {
    const status = component._getApplianceStatus ? component._getApplianceStatus(a) : {};
    return status.isActive || status.isFinished;
  }).length;

  return html`
    <div class="popup-devices-section">
      <div class="popup-devices-header" @click=${component._togglePopupDevicesExpanded}>
        <ha-icon icon="mdi:devices"></ha-icon>
        <span class="popup-devices-title">${t('ui.sections.devices')}</span>
        <span class="popup-devices-count">${activeCount > 0 ? `${activeCount} ${t('common.status.active')}` : `${appliances.length} ${t('ui.sections.devices')}`}</span>
      </div>

      <div class="popup-devices-content ${component._popupDevicesExpanded ? 'expanded' : ''}">
        <div class="popup-devices-grid">
          ${appliances.map(appliance => renderDeviceCard(component, html, appliance))}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single device card (sensor_big style)
 * Matches the Lovelace sensor_big button-card template
 */
function renderDeviceCard(component, html, appliance) {
  // Get the status using the panel method
  const status = component._getApplianceStatus ? component._getApplianceStatus(appliance) : { text: 'Unknown', isActive: false };

  // Build CSS classes based on status
  const classes = ['popup-device-card'];
  if (status.isActive) classes.push('active');
  if (status.isFinished) classes.push('finished');
  if (status.isError) classes.push('error');
  if (status.isUnavailable) classes.push('unavailable');

  return html`
    <div class="${classes.join(' ')}">
      <div class="popup-device-card-icon">
        <ha-icon icon="${appliance.icon}"></ha-icon>
      </div>
      <div class="popup-device-card-status">${status.text}</div>
      ${status.remainingTime ? html`
        <div class="popup-device-card-time">${status.remainingTime}</div>
      ` : ''}
      <div class="popup-device-card-name">${appliance.name}</div>
    </div>
  `;
}

export default { renderRoomPopup };
