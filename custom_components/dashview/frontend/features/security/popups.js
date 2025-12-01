/**
 * Dashview Popups Module
 * Contains render methods for all popup content (Security, Battery, Weather, Media, Admin)
 */

import {
  getEnabledEntitiesSortedByLastChanged,
  isStateOn,
  isStateOpen,
  calculateTimeDifference,
  getFriendlyName
} from '../../utils/index.js';
import { t } from '../../utils/i18n.js';

export function renderSecurityPopupContent(component, html) {
  if (!component.hass) return html``;

  // Helper to filter enabled entities by current label
  const filterByCurrentLabel = (enabledMap, labelId) => {
    if (!labelId) return enabledMap;
    const filtered = {};
    Object.entries(enabledMap).forEach(([entityId, enabled]) => {
      // Skip only explicitly disabled entities (enabled by default)
      if (enabled === false) return;
      const entityReg = component._entityRegistry.find(e => e.entity_id === entityId);
      if (entityReg && entityReg.labels && entityReg.labels.includes(labelId)) {
        filtered[entityId] = enabled;
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
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledGarages.filter(g => g.isOpen)).map(g => renderEntityCard(g, 'garage'))}
          </div>
        ` : ''}

        <!-- Closed Garages -->
        ${enabledGarages.filter(g => !g.isOpen).length > 0 ? html`
          <h3 class="security-subsection-title">${t('ui.sections.closed_garages', 'Geschlossene Garagentore')}</h3>
          <div class="security-entity-list">
            ${sortByLastChangedTime(enabledGarages.filter(g => !g.isOpen)).map(g => renderEntityCard(g, 'garage'))}
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
