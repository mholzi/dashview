// custom_components/dashview/www/lib/ui/info-card-manager.js

export class InfoCardManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._shadowRoot = panel.shadowRoot;

    // A configuration array defines each section of the info card.
    // To add a new section, you only need to add an object here.
    this._sections = [
      { selector: '.motion-section', handler: this._updateMotionSection },
      { selector: '.windows-section', handler: this._updateWindowsSection },
      { selector: '.dishwasher-section', handler: this._updateDishwasherSection },
      { selector: '.washing-section', handler: this._updateWashingSection },
      { selector: '.vacuum-section', handler: this._updateVacuumSection },
      { selector: '.dryer-section', handler: this._updateDryerSection },
      { selector: '.solar-section', handler: this._updateSolarSection },
    ];
  }

  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Main update function. Loops through the defined sections and updates them.
   */
  update() {
    const infoCard = this._shadowRoot.querySelector('.info-card');
    if (!infoCard || !this._hass) return;

    for (const sectionConfig of this._sections) {
      const sectionElement = this._shadowRoot.querySelector(sectionConfig.selector);
      if (sectionElement) {
        // Call the specific handler function for the section, binding the context.
        sectionConfig.handler.call(this, sectionElement);
      }
    }
  }

  // --- Private Update Handlers for each section ---

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
    const timeText = this._calculateTimeDifference(motionEntity.last_changed);

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
    const openWindows = this._panel._getAllEntitiesByType('window')
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
    if (dishwasherEntity?.state !== 'run') {
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
    if (!washingEntity || !['run', 'finished'].includes(washingEntity.state)) {
      section.classList.add('hidden');
      return;
    }

    const prefixElement = section.querySelector('[data-type="washing-prefix"]');
    const timeElement = section.querySelector('[data-type="washing-time"]');

    if (washingEntity.state === 'run') {
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
    } else { // 'finished'
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

  // --- Helper Methods ---

  _calculateTimeDifference(lastChanged) {
    const now = new Date();
    const diffSeconds = Math.floor((now - new Date(lastChanged)) / 1000);
    if (diffSeconds < 60) return 'Jetzt';
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)} Minuten`;
    if (diffSeconds < 86400) return `${Math.floor(diffSeconds / 3600)} Stunden`;
    return `${Math.floor(diffSeconds / 86400)} Tagen`;
  }
}
