// custom_components/dashview/www/lib/ui/info-card-manager.js

import { calculateTimeDifferenceLong } from '../utils/time-utils.js';

export class InfoCardManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._shadowRoot = panel.shadowRoot;
    this._config = panel._houseConfig;
    this._integrationsConfig = panel._integrationsConfig;

    this._sections = [
      { selector: '.motion-section', handler: this._updateMotionSection },
      { selector: '.windows-section', handler: this._updateWindowsSection },
      { selector: '.dishwasher-section', handler: this._updateDishwasherSection },
      { selector: '.washing-section', handler: this._updateWashingSection },
      { selector: '.vacuum-section', handler: this._updateVacuumSection },
      { selector: '.dryer-section', handler: this._updateDryerSection },
      { selector: '.solar-section', handler: this._updateSolarSection },
      { selector: '.train-departures-container', handler: this._updateTrainDepartureCards },
      { selector: '#notifications-container', handler: this._updateTemperatureNotifications },
      { selector: '.dwd-warning-card-container', handler: this._updateDwdWarningCard },
      { selector: '.hoover-section', handler: this._updateHooverSection },
      { selector: '.mower-section', handler: this._updateMowerSection }
    ];
  }

  setHass(hass) {
    this._hass = hass;
  }

  update() {
    if (!this._hass) return;

    for (const sectionConfig of this._sections) {
      const sectionElement = this._shadowRoot.querySelector(sectionConfig.selector);
      if (sectionElement) {
        sectionConfig.handler.call(this, sectionElement);
      }
    }
  }

  _formatDwdWarning(dwdEntity) {
    if (!dwdEntity || dwdEntity.state === '0' || dwdEntity.state === 'unavailable') {
      return '';
    }

    const warningCount = parseInt(dwdEntity.attributes.warning_count, 10);
    if (warningCount === 0) {
      return '';
    }

    let content = '';
    const levelToText = {
      0: 'Information vor',
      1: 'Warnung vor',
      2: 'Warnung vor markantem',
      3: 'Unwetterwarnung vor',
      4: 'Achtung! Extremem Unwetter -'
    };

    for (let i = 1; i <= warningCount; i++) {
      const level = dwdEntity.attributes[`warning_${i}_level`];
      const name = dwdEntity.attributes[`warning_${i}_name`];
      const end = new Date(dwdEntity.attributes[`warning_${i}_end`]);
      const now = new Date();
      const endDay = new Date(end).setHours(0, 0, 0, 0);
      const today = new Date().setHours(0, 0, 0, 0);
      const tomorrow = new Date(today).setDate(new Date(today).getDate() + 1);

      let timeString = '';
      if (endDay === today) {
        timeString = '';
      } else if (endDay === tomorrow) {
        timeString = ' morgen um ';
      } else {
        timeString = ` ${end.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })} um `;
      }

      content += `${levelToText[level] || ''} ${name} bis ${timeString}${end.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}&nbsp;Uhr. `;
    }

    return content + '<a href="https://www.dwd.de/DE/wetter/warnungen_gemeinden/warnWetter_node.html?ort=dreieich" target="_blank">Weitere Informationen</a>';
  }

  _updateDwdWarningCard(container) {
    const dwdSensorId = this._integrationsConfig?.dwd_sensor;
    if (!dwdSensorId) {
      container.innerHTML = '';
      return;
    }

    const dwdEntity = this._hass.states[dwdSensorId];
    if (!dwdEntity || dwdEntity.state === '0' || dwdEntity.state === 'unavailable') {
      container.innerHTML = '';
      return;
    }

    const warningText = this._formatDwdWarning(dwdEntity);
    if (!warningText) {
        container.innerHTML = '';
        return;
    }

    container.innerHTML = `
        <div class="notification-card" style="border-color: var(--yellow);">
            <div class="notification-icon" style="color: var(--yellow);"><i class="mdi mdi-weather-hurricane"></i></div>
            <div class="notification-info">
                <div class="notification-title">${dwdEntity.attributes.warning_headline || 'Wetterwarnung'}</div>
                <div class="notification-details">
                    <span>${warningText}</span>
                </div>
            </div>
        </div>
    `;
  }
  
  _updateTemperatureNotifications(container) {
    container.innerHTML = '';
    const threshold = this._config?.temperature_threshold;

    if (!threshold) {
        container.style.display = 'none';
        return;
    }

    const tempSensors = this._panel._getAllEntitiesByType('temperatur');
    const highTempRooms = [];

    tempSensors.forEach(entityId => {
        const entity = this._hass.states[entityId];
        if (entity && parseFloat(entity.state) > threshold) {
            const roomKey = this._panel._getRoomKeyForEntity(entityId);
            const roomName = this._config.rooms[roomKey]?.friendly_name || roomKey || 'Unknown';
            highTempRooms.push(`${roomName} (${parseFloat(entity.state).toFixed(1)}°C)`);
        }
    });

    if (highTempRooms.length > 0) {
        const card = document.createElement('div');
        card.className = 'notification-card';
        card.innerHTML = `
            <div class="notification-icon"><i class="mdi mdi-thermometer-alert"></i></div>
            <div class="notification-info">
                <div class="notification-title">Hohe Temperatur Warnung</div>
                <div class="notification-details">
                    <span>${highTempRooms.join(', ')}</span>
                </div>
            </div>
        `;
        container.appendChild(card);
        container.style.display = 'flex';
    } else {
        container.style.display = 'none';
    }
  }

  _isWeekday() {
    const day = new Date().getDay();
    return day >= 1 && day <= 5;
  }

  _evaluateConditions(conditions) {
    if (!conditions || !this._hass) return false;
    const conditionList = conditions.split(',');
    
    for (const condition of conditionList) {
        const trimmed = condition.trim();
        if (trimmed === 'weekday') {
            if (!this._isWeekday()) return false;
            continue;
        }
        if (trimmed.includes('!=')) {
            const [entityId, value] = trimmed.split('!=').map(s => s.trim());
            if (this._hass.states[entityId]?.state == value) return false;
        } else if (trimmed.includes('>')) {
            const [entityId, value] = trimmed.split('>').map(s => s.trim());
            if (parseFloat(this._hass.states[entityId]?.state) <= parseFloat(value)) return false;
        } else if (trimmed.includes('<')) {
            const [entityId, value] = trimmed.split('<').map(s => s.trim());
            if (parseFloat(this._hass.states[entityId]?.state) >= parseFloat(value)) return false;
        } else if (trimmed.includes('=')) {
            const [entityId, value] = trimmed.split('=').map(s => s.trim());
            if (this._hass.states[entityId]?.state != value) return false;
        }
    }
    return true;
  }

  _getNextTrainDeparture(departureEntity, delayMin = 0) {
    if (!departureEntity?.attributes?.next_departures) return { time: '--:--', isDelayed: false };
    const now = new Date();
    for (const train of departureEntity.attributes.next_departures) {
        if (train.isCancelled) continue;
        const [hours, minutes] = train.scheduledDeparture.split(':').map(Number);
        const departureTime = new Date();
        departureTime.setHours(hours, minutes + (train.delayDeparture || 0), 0, 0);
        if ((departureTime - now) / 60000 >= delayMin) {
            const displayHours = String(departureTime.getHours()).padStart(2, '0');
            const displayMinutes = String(departureTime.getMinutes()).padStart(2, '0');
            return {
                time: `${displayHours}:${displayMinutes}`,
                isDelayed: (train.delayDeparture || 0) > 0
            };
        }
    }
    return { time: '--:--', isDelayed: false };
  }

  _updateTrainDepartureCards(container) {
    container.querySelectorAll('.train-departure-card').forEach(card => {
        const shouldShow = this._evaluateConditions(card.dataset.conditions);
        card.classList.toggle('hidden', !shouldShow);

        if (shouldShow) {
            const departureEntity = this._hass.states[card.dataset.departureSensor];
            const departure = this._getNextTrainDeparture(departureEntity, parseInt(card.dataset.delayMin, 10));
            const timeEl = card.querySelector('.train-time');
            if (timeEl) {
                timeEl.textContent = departure.time;
                timeEl.classList.toggle('delayed', departure.isDelayed);
            }
        }
    });
  }

  _updateMotionSection(section) {
    const motionEntity = this._hass.states['binary_sensor.motion_presence_home'];
    if (!motionEntity) {
      section.classList.add('hidden');
      return;
    }

    const prefix = section.querySelector('[data-type="motion-prefix"]');
    const badge = section.querySelector('[data-type="motion-time"]');
    const suffix = section.querySelector('[data-type="motion-suffix"]');
    const badgeContainer = section.querySelector('.info-badge');
    const timeText = calculateTimeDifferenceLong(motionEntity.last_changed);

    if (motionEntity.state === 'on') {
      prefix.textContent = 'Im Haus ist seit';
      suffix.textContent = 'Bewegung.';
      badgeContainer.classList.add('green');
      badgeContainer.classList.remove('red');
    } else {
      prefix.textContent = 'Die letzte Bewegung im Haus war vor';
      suffix.textContent = '.';
      badgeContainer.classList.remove('green');
      badgeContainer.classList.add('red');
    }
    badge.textContent = `${timeText}🏡`;
    section.classList.remove('hidden');
  }

  _updateWindowsSection(section) {
    const openWindows = this._panel._getAllEntitiesByType(this._panel._entityLabels.WINDOW)
      .filter(id => this._hass.states[id]?.state === 'on').length;

    if (openWindows > 0) {
      section.querySelector('[data-type="window-count"]').textContent = `${openWindows} 🪟`;
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }

  _updateDishwasherSection(section) {
    const dishwasherEntity = this._hass.states['sensor.geschirrspuler_operation_state'];
    if (dishwasherEntity?.state !== 'Run') {
      section.classList.add('hidden');
      return;
    }

    const timeElement = section.querySelector('[data-type="time-remaining"]');
    const endTimeEntity = this._hass.states['sensor.geschirrspuler_remaining_program_time'];
    if (endTimeEntity?.state) {
      const endTime = new Date(endTimeEntity.state);
      const now = new Date();
      if (endTime > now) {
        const diffMinutes = Math.floor((endTime - now) / 60000);
        const hours = Math.floor(diffMinutes / 60);
        const remainingMinutes = diffMinutes % 60;
        let timeText = '';
        if (hours > 0) timeText += `${hours}h`;
        if (remainingMinutes > 0 || hours === 0) timeText += `${remainingMinutes}min`;
        timeElement.textContent = timeText || 'Ready';
      } else {
        timeElement.textContent = 'Ready';
      }
    } else {
      timeElement.textContent = 'Unknown';
    }
    section.classList.remove('hidden');
  }

  _updateWashingSection(section) {
    const washingEntity = this._hass.states['sensor.waschmaschine_operation_state'];
    if (!washingEntity || !['Run', 'finished'].includes(washingEntity.state)) {
      section.classList.add('hidden');
      return;
    }

    const prefixElement = section.querySelector('[data-type="washing-prefix"]');
    const timeElement = section.querySelector('[data-type="washing-time"]');

    if (washingEntity.state === 'Run') {
      prefixElement.textContent = 'Die Waschmaschine läuft noch';
      const endTimeEntity = this._hass.states['sensor.waschmaschine_remaining_program_time'];
      if (endTimeEntity?.state) {
        const endTime = new Date(endTimeEntity.state);
        const now = new Date();
        if (endTime > now) {
          const diffMinutes = Math.floor((endTime - now) / (1000 * 60));
          const hours = Math.floor(diffMinutes / 60);
          const remainingMinutes = diffMinutes % 60;
          let timeText = '';
          if (hours > 0) timeText += `${hours}h`;
          if (remainingMinutes > 0 || hours === 0) timeText += `${remainingMinutes}min`;
          timeElement.textContent = `${timeText}👕` || 'Ready👕';
        } else {
          timeElement.textContent = 'Ready👕';
        }
      } else {
        timeElement.textContent = 'Unknown👕';
      }
    } else { 
      prefixElement.textContent = 'Die Waschmaschine ist fertig';
      timeElement.textContent = '👕';
    }
    section.classList.remove('hidden');
  }

  _updateVacuumSection(section) {
    const vacuumEntity = this._hass.states['vacuum.mova_e30_ultra'];
    if (vacuumEntity?.state !== 'cleaning') {
      section.classList.add('hidden');
      return;
    }
    const roomElement = section.querySelector('[data-type="room-name"]');
    const roomDict={'Erdgeschoss':{1:'Arbeitszimmer',2:'Gästeklo',3:'Küche',4:'Wohnzimmer',5:'Esszimmer',6:'Flur'},'Keller':{1:'Partykeller',2:'Kellerflur',3:'Raum 3',5:'Waschkeller'},'Dachgeschoss':{1:'Elternschlafzimmer',2:'Klo',3:'Ankleide',4:'Badezimmer'},'Map 4':{1:'Raum 1',2:'Raum 2',3:'Raum 3',4:'Raum 4',5:'Raum 5'}};
    const currentSegment = vacuumEntity.attributes.current_segment;
    const selectedMap = vacuumEntity.attributes.selected_map;
    let roomName = 'Reinigung läuft';
    if (selectedMap && roomDict[selectedMap] && currentSegment && roomDict[selectedMap][currentSegment]) {
      roomName = roomDict[selectedMap][currentSegment];
    }
    roomElement.textContent = roomName;
    section.classList.remove('hidden');
  }

  _updateDryerSection(section) {
    const dryerEntity = this._hass.states['input_boolean.trockner_an'];
    if (dryerEntity?.state !== 'on') {
      section.classList.add('hidden');
      return;
    }
    section.classList.remove('hidden');
  }

  _updateSolarSection(section) {
    const solarEntity = this._hass.states['sensor.foxess_solar'];
    const batteryEntity = this._hass.states['sensor.foxess_bat_soc'];
    if (!solarEntity || !this._panel.isNumber(solarEntity.state)) {
        section.classList.add('hidden');
        return;
    }
    
    const productionElement = section.querySelector('[data-type="solar-production"]');
    const batteryPrefixElement = section.querySelector('[data-type="battery-prefix"]');
    const batteryLevelElement = section.querySelector('[data-type="battery-level"]');
    const batterySuffixElement = section.querySelector('[data-type="battery-suffix"]');
    
    productionElement.textContent = `${parseFloat(solarEntity.state).toFixed(1)} kWh ☀️`;
    
    if (batteryEntity && this._panel.isNumber(batteryEntity.state)) {
        const batteryLevel = parseFloat(batteryEntity.state);
        if (batteryLevel < 50) {
            batteryPrefixElement.textContent = 'und die Batterie ist zu';
            batteryPrefixElement.style.marginLeft = '0px';
            batteryLevelElement.textContent = `${Math.round(batteryLevel)}% 🔋`;
            batteryLevelElement.style.display = 'inline';
            batterySuffixElement.textContent = 'geladen.';
            batterySuffixElement.style.display = 'inline';
        } else {
            batteryPrefixElement.textContent = '.';
            batteryPrefixElement.style.marginLeft = '-5px';
            batteryLevelElement.style.display = 'none';
            batterySuffixElement.style.display = 'none';
        }
    } else {
        batteryPrefixElement.textContent = '.';
        batteryPrefixElement.style.marginLeft = '-5px';
        batteryLevelElement.style.display = 'none';
        batterySuffixElement.style.display = 'none';
    }
    section.classList.remove('hidden');
  }

  _updateHooverSection(section) {
    const hooverEntities = this._panel._getAllEntitiesByType('hoover');
    if (hooverEntities.length === 0) {
      section.classList.add('hidden');
      return;
    }

    // Find any active hoover
    const activeHoover = hooverEntities.find(entityId => {
      const entity = this._hass.states[entityId];
      return entity && ['cleaning', 'returning', 'error'].includes(entity.state?.toLowerCase());
    });

    if (!activeHoover) {
      section.classList.add('hidden');
      return;
    }

    const entity = this._hass.states[activeHoover];
    const statusElement = section.querySelector('[data-type="hoover-status"]');
    
    if (statusElement) {
      const state = entity.state?.toLowerCase();
      let statusText = '';
      
      if (state === 'cleaning') {
        statusText = 'saugt 🤖';
      } else if (state === 'returning') {
        statusText = 'kehrt zurück 🤖';
      } else if (state === 'error') {
        statusText = 'hat einen Fehler 🤖';
      } else {
        statusText = `ist ${entity.state} 🤖`;
      }
      
      statusElement.textContent = statusText;
    }
    
    section.classList.remove('hidden');
  }

  _updateMowerSection(section) {
    const mowerEntities = this._panel._getAllEntitiesByType('mower');
    if (mowerEntities.length === 0) {
      section.classList.add('hidden');
      return;
    }

    // Find any active mower
    const activeMower = mowerEntities.find(entityId => {
      const entity = this._hass.states[entityId];
      return entity && ['mowing', 'cleaning', 'returning', 'error', 'going_home', 'docked'].includes(entity.state?.toLowerCase());
    });

    if (!activeMower) {
      section.classList.add('hidden');
      return;
    }

    const entity = this._hass.states[activeMower];
    const statusElement = section.querySelector('[data-type="mower-status"]');
    
    if (statusElement) {
      const state = entity.state?.toLowerCase();
      let statusText = '';
      
      if (state === 'mowing' || state === 'cleaning') {
        statusText = 'mäht 🚜';
      } else if (state === 'docked') {
        statusText = 'parkt 🚜';
      } else if (state === 'returning' || state === 'going_home') {
        statusText = 'kehrt zurück 🚜';
      } else if (state === 'error') {
        statusText = 'hat einen Fehler 🚜';
      } else {
        statusText = `ist ${entity.state} 🚜`;
      }
      
      statusElement.textContent = statusText;
    }
    
    section.classList.remove('hidden');
  }

}
