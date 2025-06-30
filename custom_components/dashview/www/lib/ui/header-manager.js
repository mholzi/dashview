// custom_components/dashview/lib/ui/header-manager.js

export class HeaderManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._config = panel._houseConfig;
    this._shadowRoot = panel.shadowRoot;
  }

  setHass(hass) {
    this._hass = hass;
  }

  // ... (updateAll, updateWeatherButton, updateMediaHeaderButtons remain the same)
  updateAll() {
    this.updateHeaderButtons();
    this.updateWeatherButton();
    this.updateMediaHeaderButtons();
  }

  updateWeatherButton() {
    if (!this._hass || !this._shadowRoot) return;
    const weatherEntityId = this._panel._getCurrentWeatherEntityId();
    const weatherState = this._hass.states[weatherEntityId];
    if (!weatherState) return;

    try {
      const temp = (weatherState.forecast && weatherState.forecast.length > 0) ? weatherState.forecast[0].temperature : null;
      const nameElement = this._shadowRoot.querySelector('.weather-button .name');
      const labelElement = this._shadowRoot.querySelector('.weather-button .label');
      const iconElement = this._shadowRoot.querySelector('.weather-button .icon-container');

      if (nameElement) nameElement.textContent = temp ? `${temp.toFixed(1)}°C` : '-- °C';
      if (labelElement) labelElement.innerHTML = weatherState.attributes.temperature ? `${weatherState.attributes.temperature.toFixed(1)}<sup>°C</sup>` : '-- °C';
      if (iconElement) iconElement.innerHTML = `<img src="/local/weather_icons/${weatherState.state}.svg" width="40" height="40" alt="${weatherState.state}">`;
    } catch (error) {
      console.error('[HeaderManager] Error updating weather button:', error);
    }
  }

  updateMediaHeaderButtons() {
    if (!this._hass || !this._config) return;
    const container = this._shadowRoot.getElementById('media-header-buttons-container');
    if (!container) return;

    const allMediaPlayers = [];
    for (const [roomKey, roomConfig] of Object.entries(this._config.rooms || {})) {
        if (roomConfig.media_players) {
            for (const player of roomConfig.media_players) {
                allMediaPlayers.push({ entity_id: player.entity, room_key: roomKey });
            }
        }
    }
    const playingPlayers = allMediaPlayers.filter(p => this._hass.states[p.entity_id]?.state === 'playing');
    container.innerHTML = '';
    if (playingPlayers.length === 0) return;

    const scrollContainer = document.createElement('div');
    scrollContainer.className = 'media-header-scroll';
    playingPlayers.forEach(player => {
        const button = document.createElement('button');
        button.className = 'media-header-button';
        button.setAttribute('data-hash', `#${player.room_key}`);
        button.title = player.entity_id;
        const iconElement = document.createElement('i');
        iconElement.className = `mdi ${player.entity_id.includes('tv') ? 'mdi-television' : 'mdi-music'}`;
        button.appendChild(iconElement);
        scrollContainer.appendChild(button);
    });
    container.appendChild(scrollContainer);
  }

  updateHeaderButtons() {
    const container = this._shadowRoot.getElementById('header-buttons');
    if (!container) return;
    container.innerHTML = `<div class="header-buttons-scroll">${this._generateHeaderButtonsHTML()}</div>`;
  }

  _generateHeaderButtonsHTML() {
    if (!this._hass || !this._config?.rooms) return '<div class="no-activity">Loading...</div>';

    let buttonsHTML = '';
    const rooms = this._config.rooms || {};
    const floors = this._config.floors || {};

    const roomsByFloor = {};
    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
      const floorKey = roomConfig.floor;
      if (!roomsByFloor[floorKey]) roomsByFloor[floorKey] = [];
      roomsByFloor[floorKey].push({ key: roomKey, config: roomConfig });
    });

    const sortedFloorKeys = Object.keys(roomsByFloor)
        .sort((a, b) => {
            const floorALevel = floors[a]?.level ?? 0;
            const floorBLevel = floors[b]?.level ?? 0;
            return floorALevel - floorBLevel;
        });

    sortedFloorKeys.forEach(floorKey => {
      const floorRooms = roomsByFloor[floorKey];
      const floorConfig = floors[floorKey];
      if (!floorConfig) return;

      const activeRooms = floorRooms.filter(room => {
        const motionEntityConfig = room.config.header_entities?.find(e => e.entity_type === this._panel._entityLabels.MOTION);
        const hasActiveMotion = motionEntityConfig && this._hass.states[motionEntityConfig.entity]?.state === 'on';
        const hasActiveLights = (room.config.lights || []).some(lightId => this._hass.states[lightId]?.state === 'on');
        const hasPlayingMedia = (room.config.media_players || []).some(player => this._hass.states[player.entity]?.state === 'playing');
        return hasActiveMotion || hasActiveLights || hasPlayingMedia;
      });

      if (activeRooms.length > 0) {
        buttonsHTML += `<button class="header-floor-button" data-floor="${floorKey}"><i class="mdi ${this._panel._processIconName(floorConfig.icon)}"></i></button>`;
        activeRooms.forEach(room => {
          buttonsHTML += `<button class="header-room-button" data-room="${room.key}" data-floor="${floorKey}" data-hash="#${room.key}" title="${room.config.friendly_name}"><i class="mdi ${this._panel._processIconName(room.config.icon)}"></i></button>`;
        });
      }
    });

    return buttonsHTML || '<div class="no-activity">No active rooms</div>';
  }
}
