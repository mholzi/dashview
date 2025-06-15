class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._contentReady = false;
    this._floorsConfig = {};
    this._roomsConfig = {};
    this._musicConfig = {};
    this._roomNotificationsConfig = {};
  }

  // When the HASS object is passed to the panel, store it and update content
  set hass(hass) {
    this._hass = hass;
    if (this._contentReady) {
      this.updateElements();
    }
  }

  connectedCallback() {
    this.loadContent();
  }

  async loadContent() {
    const shadow = this.shadowRoot;
    if (!shadow) return;

    try {
      const [styleText, htmlText] = await Promise.all([
        fetch('/local/dashview/style.css').then(res => res.ok ? res.text() : Promise.reject('Failed to load stylesheet')),
        fetch('/local/dashview/index.html').then(res => res.ok ? res.text() : Promise.reject('Failed to load HTML content'))
      ]);

      const style = document.createElement('style');
      style.textContent = styleText;
      shadow.appendChild(style);

      const content = document.createElement('div');
      content.innerHTML = htmlText;
      shadow.appendChild(content);
      
      await this.loadTemplates(shadow);
      this.initializeCard(shadow);

      this._contentReady = true;
      if (this._hass) {
        this.updateElements();
      }

    } catch (error) {
      shadow.innerHTML = `<div style="color: red; padding: 16px;">Error loading DashView panel: ${error.message}</div>`;
      console.error('Error loading DashView panel:', error);
    }
  }

  // New method to find all data-template placeholders and load their HTML
  async loadTemplates(container) {
    const placeholders = container.querySelectorAll('[data-template]');
    for (const el of placeholders) {
      const templateName = el.dataset.template;
      try {
        const response = await fetch(`/local/dashview/templates/${templateName}.html`);
        if (response.ok) {
          el.innerHTML = await response.text();
        } else {
          el.innerHTML = `Failed to load template: ${templateName}`;
        }
      } catch (err) {
        el.innerHTML = `Error loading template: ${templateName}`;
      }
    }
  }

  // New method to update elements based on hass state
  updateElements() {
    if (!this._hass) return;
    const shadow = this.shadowRoot;

    // Update Weather Button
    const weatherEntityId = this.getCurrentWeatherEntity();
    const weatherState = this._hass.states[weatherEntityId];
    if (weatherState) {
        const temp = (weatherState.forecast && weatherState.forecast.length > 0) ? weatherState.forecast[0].temperature : null;
        shadow.querySelector('.weather-button .name').textContent = temp ? `${temp.toFixed(1)}°C` : '-- °C';
        shadow.querySelector('.weather-button .label').innerHTML = weatherState.attributes.temperature ? `${weatherState.attributes.temperature.toFixed(1)}<sup>°C</sup>` : '-- °C';
        shadow.querySelector('.weather-button .icon-container').innerHTML = `<img src="/local/weather_icons/${weatherState.state}.svg" width="40" height="40" alt="${weatherState.state}">`;
    }

    // Update Person Button
    const personState = this._hass.states['person.markus'];
    if (personState) {
        const img_src = personState.attributes.entity_picture || (personState.state === 'home' ? '/local/weather_icons/IMG_0421.jpeg' : '/local/weather_icons/IMG_0422.jpeg');
        shadow.querySelector('.person-button .image-container').innerHTML = `<img src="${img_src}" width="45" height="45">`;
    }

    // Update Train Departure Cards
    this.updateTrainDepartureCards(shadow);
    
    // Update Info Card
    this.updateInfoCard(shadow);
    
    // Update Weather Components
    this.updateWeatherComponents(shadow);
    
    // Update Music Popup
    this.updateMusicPopup(shadow);
    
    // Update Music Player States
    this.updateMusicPlayerStates(shadow);

    // Update Room Media Players
    this.updateRoomMediaPlayers(shadow);

    // Update Pollen Card
    this.updatePollenCard(shadow);

    // Update Header Buttons
    this.updateHeaderButtons(shadow);

    // Update Room Notifications
    this.updateRoomNotifications(shadow);

  }

  // Method to check if it's a weekday
  isWeekday() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    return dayOfWeek >= 1 && dayOfWeek <= 5; // Monday = 1, Sunday = 0
  }

  // Method to evaluate conditions for a train card
  evaluateConditions(conditions) {
    if (!conditions || !this._hass) {
      return false;
    }

    const conditionList = conditions.split(',');
    
    for (const condition of conditionList) {
      const trimmedCondition = condition.trim();
      
      if (trimmedCondition === 'weekday') {
        if (!this.isWeekday()) return false;
        continue;
      }

      if (trimmedCondition.includes('=') && !trimmedCondition.includes('!=')) {
        const [entityId, expectedValue] = trimmedCondition.split('=');
        const entity = this._hass.states[entityId.trim()];
        if (!entity || entity.state !== expectedValue.trim()) return false;
      } else if (trimmedCondition.includes('>')) {
        const [entityId, minValue] = trimmedCondition.split('>');
        const entity = this._hass.states[entityId.trim()];
        if (!entity || parseFloat(entity.state) <= parseFloat(minValue.trim())) return false;
      } else if (trimmedCondition.includes('!=')) {
        const [entityId, excludedValue] = trimmedCondition.split('!=');
        const entity = this._hass.states[entityId.trim()];
        if (!entity || entity.state === excludedValue.trim()) return false;
      }
    }

    return true;
  }

  // Method to get next train departure
  getNextTrainDeparture(departureEntity, delayMin = 0) {
    if (!departureEntity || !departureEntity.attributes.next_departures) {
      return { time: '--:--', isDelayed: false };
    }

    const departures = departureEntity.attributes.next_departures;
    const now = new Date();

    for (const train of departures) {
      if (train.isCancelled) continue;

      const [hours, minutes] = train.scheduledDeparture.split(':').map(Number);
      const departureTime = new Date();
      departureTime.setHours(hours, minutes + (train.delayDeparture || 0), 0, 0);

      // Check if departure is far enough in the future
      const timeDiff = (departureTime - now) / (1000 * 60); // difference in minutes
      if (timeDiff >= delayMin) {
        const totalMinutes = hours * 60 + minutes + (train.delayDeparture || 0);
        const displayHours = Math.floor(totalMinutes / 60) % 24;
        const displayMinutes = totalMinutes % 60;
        
        return {
          time: `${String(displayHours).padStart(2, '0')}:${String(displayMinutes).padStart(2, '0')}`,
          isDelayed: (train.delayDeparture || 0) > 0
        };
      }
    }

    return { time: '--:--', isDelayed: false };
  }

  // Method to update train departure cards
  updateTrainDepartureCards(shadow) {
    const trainCards = shadow.querySelectorAll('.train-departure-card');
    
    trainCards.forEach(card => {
      const conditions = card.dataset.conditions;
      const departureSensor = card.dataset.departureSensor;
      const delayMin = parseInt(card.dataset.delayMin) || 0;

      // If HASS is not available yet, keep cards visible with placeholder
      if (!this._hass) {
        card.classList.remove('hidden');
        const timeElement = card.querySelector('.train-time');
        if (timeElement) {
          timeElement.textContent = '--:--';
        }
        return;
      }

      // Check if conditions are met
      const shouldShow = this.evaluateConditions(conditions);
      
      if (shouldShow) {
        card.classList.remove('hidden');
        
        // Update departure time
        const departureEntity = this._hass.states[departureSensor];
        const departure = this.getNextTrainDeparture(departureEntity, delayMin);
        
        const timeElement = card.querySelector('.train-time');
        if (timeElement) {
          timeElement.textContent = departure.time;
          
          if (departure.isDelayed) {
            timeElement.classList.add('delayed');
          } else {
            timeElement.classList.remove('delayed');
          }
        }
      } else {
        card.classList.add('hidden');
      }
    });
  }

  // Method to update info card sections
  updateInfoCard(shadow) {
    const infoCard = shadow.querySelector('.info-card');
    if (!infoCard || !this._hass) return;

    // Update Motion Section
    this.updateMotionSection(shadow);
    
    // Update Windows Section
    this.updateWindowsSection(shadow);
    
    // Update Dishwasher Section
    this.updateDishwasherSection(shadow);
    
    // Update Washing Machine Section
    this.updateWashingSection(shadow);
    
    // Update Vacuum Section
    this.updateVacuumSection(shadow);
    
    // Update Dryer Section
    this.updateDryerSection(shadow);
    
    // Update Solar Section
    this.updateSolarSection(shadow);
  }

  updateMotionSection(shadow) {
    const section = shadow.querySelector('.motion-section');
    if (!section) return;
    
    const motionEntity = this._hass.states['binary_sensor.motion_presence_home'];
    if (!motionEntity) {
      section.classList.add('hidden');
      return;
    }
    
    const prefixElement = section.querySelector('[data-type="motion-prefix"]');
    const badgeElement = section.querySelector('[data-type="motion-time"]');
    const badge = section.querySelector('.info-badge');
    
    // Calculate time difference since last state change
    const lastChanged = new Date(motionEntity.last_changed);
    const now = new Date();
    const diffSeconds = Math.floor((now - lastChanged) / 1000);
    
    let timeText = 'Unbekannt';
    if (diffSeconds < 60) {
      timeText = 'Jetzt';
    } else if (diffSeconds < 3600) {
      const minutes = Math.floor(diffSeconds / 60);
      timeText = `${minutes} Minuten`;
    } else if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      timeText = `${hours} Stunden`;
    } else {
      const days = Math.floor(diffSeconds / 86400);
      timeText = `${days} Tagen`;
    }
    
    if (motionEntity.state === 'on') {
      prefixElement.textContent = 'Im Haus ist seit';
      section.classList.remove('hidden');
      badge.classList.add('green');
      badge.classList.remove('red');
      badgeElement.textContent = `${timeText}🏡`;
    } else {
      prefixElement.textContent = 'Die letzte Bewegung im Haus war vor';
      section.classList.remove('hidden');
      badge.classList.remove('green');
      badge.classList.add('red');
      badgeElement.textContent = `${timeText}🏡`;
    }
  }

  updateWindowsSection(shadow) {
    const section = shadow.querySelector('.windows-section');
    if (!section) return;
    
    // Count open windows
    let openWindows = 0;
    Object.values(this._hass.states).forEach(entity => {
      if (entity.entity_id.includes('binary_sensor.fenster') && entity.state === 'on') {
        openWindows++;
      }
    });
    
    if (openWindows > 0) {
      section.classList.remove('hidden');
      const countElement = section.querySelector('[data-type="window-count"]');
      countElement.textContent = `${openWindows} 🪟`;
    } else {
      section.classList.add('hidden');
    }
  }

  updateDishwasherSection(shadow) {
    const section = shadow.querySelector('.dishwasher-section');
    if (!section) return;
    
    const dishwasherEntity = this._hass.states['sensor.geschirrspuler_operation_state'];
    if (!dishwasherEntity || dishwasherEntity.state !== 'run') {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    const timeElement = section.querySelector('[data-type="time-remaining"]');
    
    // Calculate remaining time
    const endTimeEntity = this._hass.states['sensor.geschirrspuler_remaining_program_time'];
    if (endTimeEntity && endTimeEntity.state) {
      const endTime = new Date(endTimeEntity.state);
      const now = new Date();
      if (endTime > now) {
        const diffMinutes = Math.floor((endTime - now) / (1000 * 60));
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
  }

  updateWashingSection(shadow) {
    const section = shadow.querySelector('.washing-section');
    if (!section) return;
    
    const washingEntity = this._hass.states['sensor.waschmaschine_operation_state'];
    if (!washingEntity) {
      section.classList.add('hidden');
      return;
    }
    
    const prefixElement = section.querySelector('[data-type="washing-prefix"]');
    const timeElement = section.querySelector('[data-type="washing-time"]');
    
    if (washingEntity.state === 'run') {
      prefixElement.textContent = 'Die Waschmaschine läuft noch';
      section.classList.remove('hidden');
      
      // Calculate remaining time
      const endTimeEntity = this._hass.states['sensor.waschmaschine_remaining_program_time'];
      if (endTimeEntity && endTimeEntity.state) {
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
    } else if (washingEntity.state === 'finished') {
      prefixElement.textContent = 'Die Waschmaschine ist fertig';
      timeElement.textContent = '👕';
      section.classList.remove('hidden');
    } else {
      section.classList.add('hidden');
    }
  }

  updateVacuumSection(shadow) {
    const section = shadow.querySelector('.vacuum-section');
    if (!section) return;
    
    const vacuumEntity = this._hass.states['vacuum.mova_e30_ultra'];
    if (!vacuumEntity || vacuumEntity.state !== 'cleaning') {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    const roomElement = section.querySelector('[data-type="room-name"]');
    
    // Room mapping
    const roomDict = {
      'Erdgeschoss': {
        1: 'Arbeitszimmer',
        2: 'Gästeklo',
        3: 'Küche',
        4: 'Wohnzimmer',
        5: 'Esszimmer',
        6: 'Flur'
      },
      'Keller': {
        1: 'Partykeller',
        2: 'Kellerflur',
        3: 'Raum 3',
        5: 'Waschkeller'
      },
      'Dachgeschoss': {
        1: 'Elternschlafzimmer',
        2: 'Klo',
        3: 'Ankleide',
        4: 'Badezimmer'
      },
      'Map 4': {
        1: 'Raum 1',
        2: 'Raum 2',
        3: 'Raum 3',
        4: 'Raum 4',
        5: 'Raum 5'
      }
    };
    
    const currentSegment = vacuumEntity.attributes.current_segment;
    const selectedMap = vacuumEntity.attributes.selected_map;
    
    let roomName = 'Reinigung läuft';
    if (selectedMap && roomDict[selectedMap] && currentSegment && roomDict[selectedMap][currentSegment]) {
      roomName = roomDict[selectedMap][currentSegment];
    }
    
    roomElement.textContent = roomName;
  }

  updateDryerSection(shadow) {
    const section = shadow.querySelector('.dryer-section');
    if (!section) return;
    
    const dryerEntity = this._hass.states['input_boolean.trockner_an'];
    if (!dryerEntity || dryerEntity.state !== 'on') {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
  }

  updateSolarSection(shadow) {
    const section = shadow.querySelector('.solar-section');
    if (!section) return;
    
    const solarEntity = this._hass.states['sensor.foxess_solar'];
    const batteryEntity = this._hass.states['sensor.foxess_bat_soc'];
    
    if (!solarEntity || !this.isNumber(solarEntity.state)) {
      section.classList.add('hidden');
      return;
    }
    
    section.classList.remove('hidden');
    
    const productionElement = section.querySelector('[data-type="solar-production"]');
    const batteryPrefixElement = section.querySelector('[data-type="battery-prefix"]');
    const batteryLevelElement = section.querySelector('[data-type="battery-level"]');
    const batterySuffixElement = section.querySelector('[data-type="battery-suffix"]');
    
    // Update solar production
    const solarValue = parseFloat(solarEntity.state);
    productionElement.textContent = `${solarValue.toFixed(1)} kWh ☀️`;
    
    // Update battery info
    if (batteryEntity && this.isNumber(batteryEntity.state)) {
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
  }

  // Helper method to check if a value is a number
  isNumber(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
  }

  initializeCard(context) {
    // --- This section is the same as before ---
    const handleHashChange = async () => {
      const hash = window.location.hash || '#home';
      context.querySelectorAll('.popup').forEach(popup => popup.classList.remove('active'));
      context.querySelectorAll('.nav-button').forEach(btn => btn.classList.remove('active'));

      if (hash && hash !== '#home') {
        const popupId = hash.substring(1) + '-popup';
        let targetPopup = context.querySelector('#' + popupId);
        if (!targetPopup) {
            targetPopup = document.createElement('div');
            targetPopup.id = popupId;
            targetPopup.className = 'popup';
            context.appendChild(targetPopup);
        }
        if (targetPopup.innerHTML.trim() === '') {
            try {
                const response = await fetch(`/local/dashview/${hash.substring(1)}.html`);
                if (!response.ok) throw new Error(`File not found`);
                const html = await response.text();
                targetPopup.innerHTML = html;
                this.reinitializePopupContent(targetPopup);
            } catch (err) {
                targetPopup.innerHTML = `<div class="popup-content"><span class="popup-close">&times;</span>Error loading: ${err.message}</div>`;
                 this.reinitializePopupContent(targetPopup);
            }
        } else {
            // For static popups like weather, also reinitialize content
            this.reinitializePopupContent(targetPopup);
        }
        targetPopup.classList.add('active');
      }

      const activeButton = context.querySelector(`.nav-button[data-hash="${hash}"]`);
      if (activeButton) {
        activeButton.classList.add('active');
      }
    };
    window.addEventListener('hashchange', handleHashChange, true);
    handleHashChange();

    context.addEventListener('click', (e) => {
        const target = e.target.closest('[data-hash]');
        if (target) {
            e.preventDefault();
            const newHash = target.getAttribute('data-hash');
            if (window.location.hash !== newHash) {
               window.location.hash = newHash;
            }
        }

        const kioskButton = e.target.closest('.kiosk-button');
        if (kioskButton) {
            this.dispatchEvent(new Event('hass-toggle-menu', { bubbles: true, composed: true }));
        }

        const trainCard = e.target.closest('.train-departure-card');
        if (trainCard) {
            window.location.hash = '#bahn';
        }

        // Handle info card section clicks
        const infoSection = e.target.closest('.info-section');
        if (infoSection) {
            if (infoSection.classList.contains('motion-section') || infoSection.classList.contains('windows-section')) {
                window.location.hash = '#security';
            } else if (infoSection.classList.contains('dryer-section')) {
                window.location.hash = '#waschkeller';
            }
        }

        // Handle header room button clicks
        const roomButton = e.target.closest('.header-room-button');
        if (roomButton) {
            const navigationPath = roomButton.getAttribute('data-navigation');
            if (navigationPath && navigationPath !== '#unknown') {
                window.location.hash = navigationPath;
            }
        }

        // Handle admin config buttons
        const reloadConfigBtn = e.target.closest('#reload-config');
        if (reloadConfigBtn) {
            this.loadAdminConfiguration();
        }

        const saveFloorsBtn = e.target.closest('#save-floors-config');
        if (saveFloorsBtn) {
            this.saveFloorsConfiguration();
        }

        const saveRoomsBtn = e.target.closest('#save-rooms-config');
        if (saveRoomsBtn) {
            this.saveRoomsConfiguration();
        }


        const saveMusicBtn = e.target.closest('#save-music-config');
        if (saveMusicBtn) {
            this.saveMusicConfiguration();
        }

        const saveRoomNotificationsBtn = e.target.closest('#save-room-notifications-config');
        if (saveRoomNotificationsBtn) {
            this.saveRoomNotificationsConfiguration();
        }

        const saveWeatherEntityBtn = e.target.closest('#save-weather-entity');
        if (saveWeatherEntityBtn) {
            this.saveWeatherEntity();
        }
    });
  }
  
  // Method to update weather components
  updateWeatherComponents(shadow) {
    if (!this._hass) return;
    
    const weatherEntityId = this.getCurrentWeatherEntity();
    const weatherState = this._hass.states[weatherEntityId];
    if (!weatherState) return;

    // Update current weather card
    this.updateCurrentWeather(shadow, weatherState);
    
    // Update hourly forecast
    this.updateHourlyForecast(shadow, weatherState);
    
    // Initialize daily forecast tabs
    this.initializeDailyForecast(shadow, weatherState);
  }

  // Method to update current weather display
  updateCurrentWeather(shadow, weatherState) {
    const iconElement = shadow.getElementById('current-weather-icon');
    const tempElement = shadow.getElementById('current-temperature');
    const conditionElement = shadow.getElementById('current-condition');
    const feelsLikeElement = shadow.getElementById('feels-like-temp');
    const humidityElement = shadow.getElementById('humidity');
    const windElement = shadow.getElementById('wind-speed');

    if (iconElement && weatherState.state) {
      iconElement.src = `/local/weather_icons/${weatherState.state}.svg`;
      iconElement.alt = weatherState.state;
    }

    if (tempElement && weatherState.attributes.temperature) {
      tempElement.textContent = `${Math.round(weatherState.attributes.temperature)}°C`;
    }

    if (conditionElement) {
      conditionElement.textContent = this.translateWeatherCondition(weatherState.state);
    }

    if (feelsLikeElement && weatherState.attributes.apparent_temperature) {
      feelsLikeElement.textContent = `${Math.round(weatherState.attributes.apparent_temperature)}°C`;
    }

    if (humidityElement && weatherState.attributes.humidity) {
      humidityElement.textContent = `${weatherState.attributes.humidity}%`;
    }

    if (windElement && weatherState.attributes.wind_speed) {
      windElement.textContent = `${Math.round(weatherState.attributes.wind_speed)} km/h`;
    }
  }

  // Method to update hourly forecast
  updateHourlyForecast(shadow, weatherState) {
    const container = shadow.getElementById('hourly-forecast');
    if (!container || !weatherState.attributes.forecast) return;

    container.innerHTML = '';
    
    // Show next 8 hours of forecast
    const hourlyData = weatherState.attributes.forecast.slice(0, 8);
    
    hourlyData.forEach(forecast => {
      const hourlyItem = document.createElement('div');
      hourlyItem.className = 'hourly-item';
      
      const date = new Date(forecast.datetime);
      const timeString = date.getHours().toString().padStart(2, '0') + ':00';
      
      hourlyItem.innerHTML = `
        <div class="hourly-time">${timeString}</div>
        <div class="hourly-icon">
          <img src="/local/weather_icons/${forecast.condition}.svg" alt="${forecast.condition}" width="32" height="32">
        </div>
        <div class="hourly-temp">${Math.round(forecast.temperature)}°</div>
      `;
      
      container.appendChild(hourlyItem);
    });
  }

  // Method to initialize daily forecast tabs
  initializeDailyForecast(shadow, weatherState) {
    const tabs = shadow.querySelectorAll('.forecast-tab');
    const content = shadow.getElementById('daily-forecast-content');
    
    if (!tabs.length || !content || !weatherState.attributes.forecast) return;

    // Add click handlers to tabs
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        
        const dayIndex = parseInt(tab.dataset.day);
        this.showDailyForecast(content, weatherState, dayIndex);
      });
    });

    // Show today's forecast by default
    this.showDailyForecast(content, weatherState, 0);
  }

  // Method to show daily forecast for a specific day
  showDailyForecast(container, weatherState, dayIndex) {
    if (!weatherState.attributes.forecast) return;

    // Get forecast for the specified day
    const dailyForecast = this.getDailyForecast(weatherState.attributes.forecast, dayIndex);
    
    if (!dailyForecast) {
      container.innerHTML = '<div>Keine Daten verfügbar</div>';
      return;
    }

    container.innerHTML = `
      <div class="daily-forecast">
        <div class="daily-icon">
          <img src="/local/weather_icons/${dailyForecast.condition}.svg" alt="${dailyForecast.condition}">
        </div>
        <div class="daily-info">
          <div class="daily-condition">${this.translateWeatherCondition(dailyForecast.condition)}</div>
          <div class="daily-temps">
            <span class="daily-high">${Math.round(dailyForecast.temperature)}°C</span>
            <span class="daily-low">${dailyForecast.templow ? Math.round(dailyForecast.templow) + '°C' : ''}</span>
          </div>
        </div>
      </div>
    `;
  }

  // Helper method to get daily forecast data
  getDailyForecast(forecastData, dayIndex) {
    if (!forecastData || dayIndex < 0) return null;

    const now = new Date();
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + dayIndex);
    targetDate.setHours(12, 0, 0, 0); // Use noon time for daily forecast

    // Find the forecast closest to noon of the target day
    let closestForecast = null;
    let minTimeDiff = Infinity;

    forecastData.forEach(forecast => {
      const forecastDate = new Date(forecast.datetime);
      const timeDiff = Math.abs(forecastDate.getTime() - targetDate.getTime());
      
      if (timeDiff < minTimeDiff) {
        minTimeDiff = timeDiff;
        closestForecast = forecast;
      }
    });

    return closestForecast;
  }

  // Helper method to translate weather conditions to German
  translateWeatherCondition(condition) {
    const translations = {
      'clear-night': 'Klare Nacht',
      'cloudy': 'Bewölkt',
      'fog': 'Nebel',
      'hail': 'Hagel',
      'lightning': 'Gewitter',
      'lightning-rainy': 'Gewitter mit Regen',
      'partlycloudy': 'Teilweise bewölkt',
      'pouring': 'Stark regnerisch',
      'rainy': 'Regnerisch',
      'snowy': 'Schnee',
      'snowy-rainy': 'Schneeregen',
      'sunny': 'Sonnig',
      'windy': 'Windig',
      'windy-variant': 'Windig'
    };
    
    return translations[condition] || condition;
  }
  
  // Update Pollen Card with sensor data
  updatePollenCard(shadow) {
    const pollenButtons = shadow.querySelectorAll('.pollen-button');
    if (!pollenButtons || pollenButtons.length === 0) return;
    
    pollenButtons.forEach(button => {
      const sensorId = button.getAttribute('data-sensor');
      const sensorEntity = this._hass.states[sensorId];
      
      if (sensorEntity) {
        const sensorValue = parseFloat(sensorEntity.state) || 0;
        const nameElement = button.querySelector('.pollen-name');
        const stateElement = button.querySelector('.pollen-state');
        
        // Determine state text based on sensor value
        let stateText = 'n/a';
        if (sensorValue === 0) {
          stateText = 'n/a';
        } else if (sensorValue < 2) {
          stateText = 'Niedrig';
        } else if (sensorValue < 3) {
          stateText = 'Moderat';
        } else {
          stateText = 'Hoch';
        }
        
        // Update state text
        stateElement.textContent = stateText;
        
        // Determine background color based on sensor value
        let backgroundColor = '#dddddd'; // Default gray
        if (sensorValue === 0) {
          backgroundColor = '#dddddd';
        } else if (sensorValue < 2) {
          backgroundColor = '#d6f5d6'; // Light green
        } else if (sensorValue < 3) {
          backgroundColor = '#fff4cc'; // Light yellow
        } else {
          backgroundColor = '#f8d0d0'; // Light red
        }
        
        // Update button styling
        button.style.backgroundColor = backgroundColor;
        
        // Show/hide button based on sensor value
        if (sensorValue > 0) {
          button.style.display = 'flex';
        } else {
          button.style.display = 'none';
        }
      } else {
        // If sensor doesn't exist, hide the button
        button.style.display = 'none';
      }
    });
  }
  
  reinitializePopupContent(popup) {
    const closeBtn = popup.querySelector('.popup-close');
    if (closeBtn) {
        closeBtn.onclick = () => window.history.back();
    }
    
    // Handle generic tabs
    popup.querySelectorAll('.tabs-container').forEach(container => {
        const tabButtons = container.querySelectorAll('.tab-button');
        const tabContents = container.querySelectorAll('.tab-content');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetId = button.getAttribute('data-target');
                tabButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                tabContents.forEach(content => content.classList.toggle('active', content.id === targetId));
                
                // Load admin configuration when header buttons tab is activated
                if (targetId === 'header-buttons-tab') {
                    setTimeout(() => this.loadAdminConfiguration(), 100);
                }
                // Load weather entity configuration when weather tab is activated
                if (targetId === 'weather-tab') {
                    setTimeout(() => this.loadWeatherEntityConfiguration(), 100);
                }
            });
        });
        if(tabButtons.length > 0) tabButtons[0].click();
    });
    
    // Handle weather popup specific initialization
    if (popup.id === 'weather-popup') {
        // Update all weather components when weather popup is opened
        this.updateWeatherComponents(this.shadowRoot);
    }
    
    // Handle weather popup specific tabs
    const forecastTabs = popup.querySelectorAll('.forecast-tab');
    const forecastContent = popup.querySelector('#daily-forecast-content');
    if (forecastTabs.length > 0 && forecastContent) {
        forecastTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                forecastTabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                const dayIndex = parseInt(tab.dataset.day);
                const weatherEntityId = this.getCurrentWeatherEntity();
                const weatherState = this._hass ? this._hass.states[weatherEntityId] : null;
                if (weatherState) {
                    this.showDailyForecast(forecastContent, weatherState, dayIndex);
                }
            });
        });
        
        // Initialize with the first tab
        if (forecastTabs[0]) {
            forecastTabs[0].click();
        }
    }
  }

  // Load configuration from JSON files
  async loadConfiguration() {
    try {
      const [floorsResponse, roomsResponse, musicResponse, roomNotificationsResponse] = await Promise.all([
        fetch('/local/dashview/config/floors.json'),
        fetch('/local/dashview/config/rooms.json'),
        fetch('/local/dashview/config/music.json'),
        fetch('/local/dashview/config/room_notifications.json')
      ]);

      if (floorsResponse.ok && roomsResponse.ok) {
        this._floorsConfig = await floorsResponse.json();
        this._roomsConfig = await roomsResponse.json();
      } else {
        console.warn('Could not load floor/room configuration files');
        this._floorsConfig = {};
        this._roomsConfig = {};
      }

      // Load music configuration separately as it's optional
      if (musicResponse.ok) {
        this._musicConfig = await musicResponse.json();
      } else {
        console.warn('Could not load music configuration file');
        this._musicConfig = {};
      }

      // Load room notifications configuration separately as it's optional
      if (roomNotificationsResponse.ok) {
        this._roomNotificationsConfig = await roomNotificationsResponse.json();
      } else {
        console.warn('Could not load room notifications configuration file');
        this._roomNotificationsConfig = {};
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      this._floorsConfig = {};
      this._roomsConfig = {};
      this._musicConfig = {};
      this._roomNotificationsConfig = {};
    }
  }

  // Update header buttons based on sensor states
  async updateHeaderButtons(shadow) {
    if (!this._floorsConfig || Object.keys(this._floorsConfig).length === 0) {
      await this.loadConfiguration();
    }

    const container = shadow.querySelector('[data-template="header-buttons"]');
    if (!container) return;

    // Create button container with scrollable styling
    container.innerHTML = `
      <div class="header-buttons-scroll">
        ${this.generateHeaderButtonsHTML()}
      </div>
    `;
  }

  // Generate HTML for header buttons
  generateHeaderButtonsHTML() {
    if (!this._hass || !this._floorsConfig || !this._roomsConfig) {
      return '<div class="loading-message">Loading...</div>';
    }

    let buttonsHTML = '';
    const floors = this._roomsConfig.floors || {};
    const floorIcons = this._floorsConfig.floor_icons || {};
    const floorSensors = this._floorsConfig.floor_sensors || {};

    // Generate buttons for each floor
    Object.entries(floors).forEach(([floorName, sensors]) => {
      const floorSensor = floorSensors[floorName];
      const floorIcon = floorIcons[floorName] || 'mdi:help-circle-outline';
      
      // Check if floor sensor is active
      const floorEntity = this._hass.states[floorSensor];
      const isFloorActive = floorEntity && floorEntity.state === 'on';

      if (isFloorActive) {
        // Add floor button
        buttonsHTML += `
          <button class="header-floor-button" data-floor="${floorName}">
            <i class="mdi ${floorIcon.replace('mdi:', '')}"></i>
          </button>
        `;

        // Add room buttons for this floor
        sensors.forEach(sensor => {
          const sensorEntity = this._hass.states[sensor];
          const isRoomActive = sensorEntity && sensorEntity.state === 'on';

          if (isRoomActive) {
            const roomIcon = sensorEntity.attributes?.icon || 'mdi:help-circle-outline';
            const roomType = sensorEntity.attributes?.room_type || '#unknown';
            
            buttonsHTML += `
              <button class="header-room-button" data-sensor="${sensor}" data-navigation="${roomType}">
                <i class="mdi ${roomIcon.replace('mdi:', '')}"></i>
              </button>
            `;
          }
        });
      }
    });

    return buttonsHTML || '<div class="no-activity">No active rooms</div>';
  }

  // Load configuration for admin interface
  async loadAdminConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const floorsTextarea = shadow.getElementById('floors-config');
    const roomsTextarea = shadow.getElementById('rooms-config');
    const musicTextarea = shadow.getElementById('music-config');
    const roomNotificationsTextarea = shadow.getElementById('room-notifications-config');

    if (!statusElement || !floorsTextarea || !roomsTextarea) return;

    statusElement.textContent = 'Loading configuration...';

    try {
      const [floorsResponse, roomsResponse, musicResponse, roomNotificationsResponse] = await Promise.all([
        fetch('/local/dashview/config/floors.json'),
        fetch('/local/dashview/config/rooms.json'),
        fetch('/local/dashview/config/music.json'),
        fetch('/local/dashview/config/room_notifications.json')
      ]);

      if (floorsResponse.ok && roomsResponse.ok) {
        const floorsConfig = await floorsResponse.json();
        const roomsConfig = await roomsResponse.json();

        floorsTextarea.value = JSON.stringify(floorsConfig, null, 2);
        roomsTextarea.value = JSON.stringify(roomsConfig, null, 2);

        // Load music configuration if available
        if (musicResponse.ok && musicTextarea) {
          const musicConfig = await musicResponse.json();
          musicTextarea.value = JSON.stringify(musicConfig, null, 2);
        }

        // Load room notifications configuration if available
        if (roomNotificationsResponse.ok && roomNotificationsTextarea) {
          const roomNotificationsConfig = await roomNotificationsResponse.json();
          roomNotificationsTextarea.value = JSON.stringify(roomNotificationsConfig, null, 2);
          statusElement.textContent = '✓ All configurations loaded successfully';
        } else {
          statusElement.textContent = '✓ Core configurations loaded successfully (optional configs may be missing)';
        }
        statusElement.style.background = 'var(--green)';
      } else {
        throw new Error('Could not load configuration files');
      }
    } catch (error) {
      statusElement.textContent = '✗ Error loading configuration: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save floors configuration
  async saveFloorsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const floorsTextarea = shadow.getElementById('floors-config');

    if (!statusElement || !floorsTextarea) return;

    try {
      const configData = JSON.parse(floorsTextarea.value);
      
      // Validate structure
      if (!configData.floor_icons || !configData.floor_sensors) {
        throw new Error('Invalid floors configuration structure');
      }

      statusElement.textContent = '✓ Floors configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Reload the configuration for the header buttons
      this._floorsConfig = configData;
      if (this._hass) {
        this.updateHeaderButtons(shadow);
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving floors config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save rooms configuration
  async saveRoomsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const roomsTextarea = shadow.getElementById('rooms-config');

    if (!statusElement || !roomsTextarea) return;

    try {
      const configData = JSON.parse(roomsTextarea.value);
      
      // Validate structure
      if (!configData.floors) {
        throw new Error('Invalid rooms configuration structure');
      }

      statusElement.textContent = '✓ Rooms configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Reload the configuration for the header buttons
      this._roomsConfig = configData;
      if (this._hass) {
        this.updateHeaderButtons(shadow);
      }

    } catch (error) {
      statusElement.textContent = '✗ Error saving rooms config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }


  // Save music configuration
  async saveMusicConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const musicTextarea = shadow.getElementById('music-config');

    if (!statusElement || !musicTextarea) return;

    try {
      const configData = JSON.parse(musicTextarea.value);
      
      // Validate structure
      if (!configData.music_rooms || !configData.media_players || !configData.media_presets) {
        throw new Error('Invalid music configuration structure. Must include music_rooms, media_players, and media_presets.');
      }

      statusElement.textContent = '✓ Music configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for use in the music popup
      this._musicConfig = configData;
      
      // Update the music popup with the new configuration
      const shadow = this.shadowRoot;
      this.updateMusicPopup(shadow);

    } catch (error) {
      statusElement.textContent = '✗ Error saving music config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Save room notifications configuration
  async saveRoomNotificationsConfiguration() {
    const shadow = this.shadowRoot;
    const statusElement = shadow.getElementById('config-status');
    const roomNotificationsTextarea = shadow.getElementById('room-notifications-config');

    if (!statusElement || !roomNotificationsTextarea) return;

    try {
      const configData = JSON.parse(roomNotificationsTextarea.value);
      
      // Validate structure
      if (!configData.global_thresholds || !configData.room_conditions) {
        throw new Error('Invalid room notifications configuration structure. Must include global_thresholds and room_conditions.');
      }

      statusElement.textContent = '✓ Room notifications configuration saved (Note: This is a frontend demo - actual save requires backend integration)';
      statusElement.style.background = 'var(--yellow)';

      // Store the configuration for use in room notifications
      this._roomNotificationsConfig = configData;
      
      // Update all room notifications with the new configuration
      this.updateRoomNotifications(shadow);

    } catch (error) {
      statusElement.textContent = '✗ Error saving room notifications config: ' + error.message;
      statusElement.style.background = 'var(--red)';
    }
  }

  // Generate music popup content based on configuration
  generateMusicPopupContent() {
    if (!this._musicConfig || !this._musicConfig.music_rooms) {
      return '<div class="placeholder">Music configuration not loaded</div>';
    }

    const { music_rooms, media_players, media_presets } = this._musicConfig;
    
    let html = `
      <div class="music-tabs-container">
        <div class="music-tab-header">
          <h4>Musik</h4>
          <div class="music-tab-buttons">
    `;

    // Generate tab buttons
    music_rooms.forEach((room, index) => {
      html += `
        <button class="music-tab-button ${index === 0 ? 'active' : ''}" 
                data-room-id="${room.id}" 
                data-room="${room.room}">
          <i class="${room.icon}"></i>
          <span>${room.label}</span>
        </button>
      `;
    });

    html += `
          </div>
        </div>
        <div class="music-tab-content">
    `;

    // Generate tab content for each room
    music_rooms.forEach((room, index) => {
      const mediaPlayer = media_players[room.room];
      if (mediaPlayer) {
        html += `
          <div class="music-room-content ${index === 0 ? 'active' : ''}" 
               data-room-id="${room.id}">
            <div class="music-presets">
        `;

        // Add preset buttons
        media_presets.forEach(preset => {
          html += `
            <button class="music-preset-button" 
                    data-media-player="${mediaPlayer.entity}"
                    data-content-id="${preset.media_content_id}">
              ${preset.name}
            </button>
          `;
        });

        html += `
            </div>
            <div class="music-controls">
              <div class="music-player-info" data-entity="${mediaPlayer.entity}">
                <div class="music-title">No media playing</div>
                <div class="music-artist"></div>
              </div>
              <div class="music-control-buttons">
                <button class="music-control-btn" data-action="previous" data-entity="${mediaPlayer.entity}">
                  <i class="mdi mdi-skip-backward"></i>
                </button>
                <button class="music-control-btn play-pause" data-action="play_pause" data-entity="${mediaPlayer.entity}">
                  <i class="mdi mdi-play"></i>
                </button>
                <button class="music-control-btn" data-action="next" data-entity="${mediaPlayer.entity}">
                  <i class="mdi mdi-skip-forward"></i>
                </button>
              </div>
              <div class="music-volume-control">
                <span class="volume-label">${mediaPlayer.room_name}</span>
                <input type="range" class="volume-slider" 
                       data-entity="${mediaPlayer.entity}" 
                       min="0" max="100" value="50">
                <span class="volume-value">50%</span>
              </div>
        `;

        // Add second media player if exists
        if (mediaPlayer.entity2) {
          html += `
              <div class="music-volume-control">
                <span class="volume-label">${mediaPlayer.room_name2}</span>
                <input type="range" class="volume-slider" 
                       data-entity="${mediaPlayer.entity2}" 
                       min="0" max="100" value="50">
                <span class="volume-value">50%</span>
              </div>
          `;
        }

        html += `
            </div>
          </div>
        `;
      }
    });

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // Update music popup with configuration
  updateMusicPopup(shadow) {
    const musicPopup = shadow.getElementById('music-popup');
    if (musicPopup) {
      const placeholderDiv = musicPopup.querySelector('.placeholder');
      if (placeholderDiv) {
        // Load configuration if not already loaded
        if (!this._musicConfig || Object.keys(this._musicConfig).length === 0) {
          this.loadConfiguration().then(() => {
            placeholderDiv.innerHTML = this.generateMusicPopupContent();
            this.setupMusicControls(musicPopup);
          });
        } else {
          placeholderDiv.innerHTML = this.generateMusicPopupContent();
          this.setupMusicControls(musicPopup);
        }
      }
    }
  }

  // Setup event listeners for music controls
  setupMusicControls(musicPopup) {
    // Tab switching
    const tabButtons = musicPopup.querySelectorAll('.music-tab-button');
    const tabContents = musicPopup.querySelectorAll('.music-room-content');
    
    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const roomId = button.dataset.roomId;
        
        // Update active tab button
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update active tab content
        tabContents.forEach(content => {
          content.classList.toggle('active', content.dataset.roomId === roomId);
        });
      });
    });

    // Preset buttons
    const presetButtons = musicPopup.querySelectorAll('.music-preset-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mediaPlayer = button.dataset.mediaPlayer;
        const contentId = button.dataset.contentId;
        
        if (this._hass) {
          this._hass.callService('media_player', 'play_media', {
            entity_id: mediaPlayer,
            media_content_id: contentId,
            media_content_type: 'music'
          });
        }
      });
    });

    // Control buttons
    const controlButtons = musicPopup.querySelectorAll('.music-control-btn');
    controlButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const entity = button.dataset.entity;
        
        if (this._hass) {
          switch(action) {
            case 'play_pause':
              this._hass.callService('media_player', 'media_play_pause', {
                entity_id: entity
              });
              break;
            case 'previous':
              this._hass.callService('media_player', 'media_previous_track', {
                entity_id: entity
              });
              break;
            case 'next':
              this._hass.callService('media_player', 'media_next_track', {
                entity_id: entity
              });
              break;
          }
        }
      });
    });

    // Volume sliders
    const volumeSliders = musicPopup.querySelectorAll('.volume-slider');
    volumeSliders.forEach(slider => {
      slider.addEventListener('input', () => {
        const entity = slider.dataset.entity;
        const volume = slider.value / 100;
        const valueSpan = slider.parentElement.querySelector('.volume-value');
        
        valueSpan.textContent = slider.value + '%';
        
        if (this._hass) {
          this._hass.callService('media_player', 'volume_set', {
            entity_id: entity,
            volume_level: volume
          });
        }
      });
    });
  }

  // Update music player states in the popup
  updateMusicPlayerStates(shadow) {
    if (!this._hass || !this._musicConfig) return;
    
    const musicPopup = shadow.getElementById('music-popup');
    if (!musicPopup) return;

    const { music_rooms, media_players } = this._musicConfig;
    
    music_rooms.forEach(room => {
      const mediaPlayer = media_players[room.room];
      if (mediaPlayer) {
        // Update media info
        const playerInfo = musicPopup.querySelector(`[data-entity="${mediaPlayer.entity}"]`);
        if (playerInfo && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const titleElement = playerInfo.querySelector('.music-title');
          const artistElement = playerInfo.querySelector('.music-artist');
          
          if (titleElement) {
            titleElement.textContent = state.attributes.media_title || 'No media playing';
          }
          if (artistElement) {
            artistElement.textContent = state.attributes.media_artist || '';
          }
        }

        // Update play/pause button
        const playPauseBtn = musicPopup.querySelector(`[data-action="play_pause"][data-entity="${mediaPlayer.entity}"]`);
        if (playPauseBtn && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const icon = playPauseBtn.querySelector('i');
          if (icon) {
            icon.className = state.state === 'playing' ? 'mdi mdi-pause' : 'mdi mdi-play';
          }
        }

        // Update volume slider
        const volumeSlider = musicPopup.querySelector(`[data-entity="${mediaPlayer.entity}"].volume-slider`);
        if (volumeSlider && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const volumeLevel = state.attributes.volume_level || 0;
          volumeSlider.value = Math.round(volumeLevel * 100);
          
          const valueSpan = volumeSlider.parentElement.querySelector('.volume-value');
          if (valueSpan) {
            valueSpan.textContent = Math.round(volumeLevel * 100) + '%';
          }
        }

        // Update second media player if exists
        if (mediaPlayer.entity2) {
          const volumeSlider2 = musicPopup.querySelector(`[data-entity="${mediaPlayer.entity2}"].volume-slider`);
          if (volumeSlider2 && this._hass.states[mediaPlayer.entity2]) {
            const state = this._hass.states[mediaPlayer.entity2];
            const volumeLevel = state.attributes.volume_level || 0;
            volumeSlider2.value = Math.round(volumeLevel * 100);
            
            const valueSpan = volumeSlider2.parentElement.querySelector('.volume-value');
            if (valueSpan) {
              valueSpan.textContent = Math.round(volumeLevel * 100) + '%';
            }
          }
        }
      }
    });
  }

  // Update room media players in individual room popups
  updateRoomMediaPlayers(shadow) {
    if (!this._musicConfig || !this._musicConfig.media_players) {
      // Load configuration if not already loaded
      if (!this._musicConfig || Object.keys(this._musicConfig).length === 0) {
        this.loadConfiguration().then(() => {
          this.updateRoomMediaPlayers(shadow);
        });
      }
      return;
    }

    const { media_players, media_presets } = this._musicConfig;

    // Map popup IDs to room names in music config
    const roomMappings = {
      'buero-popup': 'Büro',
      'wohnzimmer-popup': 'Wohnzimmer',
      'elternbereich-popup': 'Eltern'
    };

    // Update each room popup that has a media player
    Object.entries(roomMappings).forEach(([popupId, roomName]) => {
      const popup = shadow.getElementById(popupId);
      if (popup && media_players[roomName]) {
        const placeholder = popup.querySelector('.placeholder');
        if (placeholder && placeholder.textContent.includes('Media Player')) {
          placeholder.innerHTML = this.generateRoomMediaPlayerContent(roomName, media_players[roomName], media_presets);
          this.setupRoomMediaPlayerControls(popup, media_players[roomName]);
        }
      }
    });
  }

  // Generate media player content for a specific room
  generateRoomMediaPlayerContent(roomName, mediaPlayer, mediaPresets) {
    let html = `
      <div class="room-media-player">
        <h4>Media Player - ${roomName}</h4>
        <div class="music-presets">
    `;

    // Add preset buttons
    mediaPresets.forEach(preset => {
      html += `
        <button class="music-preset-button" 
                data-media-player="${mediaPlayer.entity}"
                data-content-id="${preset.media_content_id}">
          ${preset.name}
        </button>
      `;
    });

    html += `
        </div>
        <div class="music-controls">
          <div class="music-player-info" data-entity="${mediaPlayer.entity}">
            <div class="music-title">No media playing</div>
            <div class="music-artist"></div>
          </div>
          <div class="music-control-buttons">
            <button class="music-control-btn" data-action="previous" data-entity="${mediaPlayer.entity}">
              <i class="mdi mdi-skip-backward"></i>
            </button>
            <button class="music-control-btn play-pause" data-action="play_pause" data-entity="${mediaPlayer.entity}">
              <i class="mdi mdi-play"></i>
            </button>
            <button class="music-control-btn" data-action="next" data-entity="${mediaPlayer.entity}">
              <i class="mdi mdi-skip-forward"></i>
            </button>
          </div>
          <div class="music-volume-control">
            <span class="volume-label">${mediaPlayer.room_name}</span>
            <input type="range" class="volume-slider" 
                   data-entity="${mediaPlayer.entity}" 
                   min="0" max="100" value="50">
            <span class="volume-value">50%</span>
          </div>
    `;

    // Add second media player if exists
    if (mediaPlayer.entity2) {
      html += `
          <div class="music-volume-control">
            <span class="volume-label">${mediaPlayer.room_name2}</span>
            <input type="range" class="volume-slider" 
                   data-entity="${mediaPlayer.entity2}" 
                   min="0" max="100" value="50">
            <span class="volume-value">50%</span>
          </div>
      `;
    }

    html += `
        </div>
      </div>
    `;

    return html;
  }

  // Setup event listeners for room media player controls
  setupRoomMediaPlayerControls(roomPopup, mediaPlayer) {
    // Preset buttons
    const presetButtons = roomPopup.querySelectorAll('.music-preset-button');
    presetButtons.forEach(button => {
      button.addEventListener('click', () => {
        const mediaPlayerEntity = button.dataset.mediaPlayer;
        const contentId = button.dataset.contentId;
        
        if (this._hass && mediaPlayerEntity && contentId) {
          this._hass.callService('media_player', 'play_media', {
            entity_id: mediaPlayerEntity,
            media_content_id: contentId,
            media_content_type: 'music'
          });
        }
      });
    });

    // Control buttons
    const controlButtons = roomPopup.querySelectorAll('.music-control-btn');
    controlButtons.forEach(button => {
      button.addEventListener('click', () => {
        const action = button.dataset.action;
        const entity = button.dataset.entity;
        
        if (this._hass) {
          switch(action) {
            case 'play_pause':
              this._hass.callService('media_player', 'media_play_pause', {
                entity_id: entity
              });
              break;
            case 'previous':
              this._hass.callService('media_player', 'media_previous_track', {
                entity_id: entity
              });
              break;
            case 'next':
              this._hass.callService('media_player', 'media_next_track', {
                entity_id: entity
              });
              break;
          }
        }
      });
    });

    // Volume sliders
    const volumeSliders = roomPopup.querySelectorAll('.volume-slider');
    volumeSliders.forEach(slider => {
      slider.addEventListener('input', () => {
        const entity = slider.dataset.entity;
        const volume = parseFloat(slider.value) / 100;
        
        if (this._hass && entity) {
          this._hass.callService('media_player', 'volume_set', {
            entity_id: entity,
            volume_level: volume
          });
        }
        
        // Update volume display
        const valueSpan = slider.parentElement.querySelector('.volume-value');
        if (valueSpan) {
          valueSpan.textContent = slider.value + '%';
        }
      });
    });
  }

  // Update media player states in room popups
  updateRoomMediaPlayerStates(shadow) {
    if (!this._hass || !this._musicConfig) return;

    const { media_players } = this._musicConfig;

    // Map popup IDs to room names in music config
    const roomMappings = {
      'buero-popup': 'Büro',
      'wohnzimmer-popup': 'Wohnzimmer',
      'elternbereich-popup': 'Eltern'
    };

    // Update each room popup that has a media player
    Object.entries(roomMappings).forEach(([popupId, roomName]) => {
      const popup = shadow.getElementById(popupId);
      const mediaPlayer = media_players[roomName];
      
      if (popup && mediaPlayer) {
        // Update media info
        const playerInfo = popup.querySelector(`[data-entity="${mediaPlayer.entity}"]`);
        if (playerInfo && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const titleElement = playerInfo.querySelector('.music-title');
          const artistElement = playerInfo.querySelector('.music-artist');
          
          if (titleElement) {
            titleElement.textContent = state.attributes.media_title || 'No media playing';
          }
          if (artistElement) {
            artistElement.textContent = state.attributes.media_artist || '';
          }
        }

        // Update play/pause button
        const playPauseBtn = popup.querySelector(`[data-action="play_pause"][data-entity="${mediaPlayer.entity}"]`);
        if (playPauseBtn && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const icon = playPauseBtn.querySelector('i');
          if (icon) {
            icon.className = state.state === 'playing' ? 'mdi mdi-pause' : 'mdi mdi-play';
          }
        }

        // Update volume slider
        const volumeSlider = popup.querySelector(`[data-entity="${mediaPlayer.entity}"].volume-slider`);
        if (volumeSlider && this._hass.states[mediaPlayer.entity]) {
          const state = this._hass.states[mediaPlayer.entity];
          const volumeLevel = state.attributes.volume_level || 0;
          volumeSlider.value = Math.round(volumeLevel * 100);
          
          const valueSpan = volumeSlider.parentElement.querySelector('.volume-value');
          if (valueSpan) {
            valueSpan.textContent = Math.round(volumeLevel * 100) + '%';
          }
        }

        // Update second media player if exists
        if (mediaPlayer.entity2) {
          const volumeSlider2 = popup.querySelector(`[data-entity="${mediaPlayer.entity2}"].volume-slider`);
          if (volumeSlider2 && this._hass.states[mediaPlayer.entity2]) {
            const state = this._hass.states[mediaPlayer.entity2];
            const volumeLevel = state.attributes.volume_level || 0;
            volumeSlider2.value = Math.round(volumeLevel * 100);
            
            const valueSpan = volumeSlider2.parentElement.querySelector('.volume-value');
            if (valueSpan) {
              valueSpan.textContent = Math.round(volumeLevel * 100) + '%';
            }
          }
        }
      }
    });
  }

  // Load weather entity configuration for admin interface
  async loadWeatherEntityConfiguration() {
    const shadow = this.shadowRoot;
    const weatherSelector = shadow.getElementById('weather-entity-selector');
    
    if (!weatherSelector || !this._hass) return;

    try {
      // Clear existing options
      weatherSelector.innerHTML = '';
      
      // Get all weather entities from Home Assistant
      const weatherEntities = Object.keys(this._hass.states)
        .filter(entityId => entityId.startsWith('weather.'))
        .sort();

      if (weatherEntities.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'No weather entities found';
        option.disabled = true;
        weatherSelector.appendChild(option);
        return;
      }

      // Add weather entities to dropdown
      weatherEntities.forEach(entityId => {
        const option = document.createElement('option');
        option.value = entityId;
        const state = this._hass.states[entityId];
        const friendlyName = state.attributes.friendly_name || entityId;
        option.textContent = `${friendlyName} (${entityId})`;
        weatherSelector.appendChild(option);
      });

      // Get current configured weather entity
      const configuredSensor = this._hass.states[`sensor.dashview_configured_weather_entity`] || 
                              this._hass.states[`sensor.dashview_configured_weather`];
      if (configuredSensor && configuredSensor.state) {
        weatherSelector.value = configuredSensor.state;
      } else {
        // Default to first weather entity if none configured
        weatherSelector.value = weatherEntities[0];
      }

    } catch (error) {
      console.error('Error loading weather entity configuration:', error);
      weatherSelector.innerHTML = '<option disabled>Error loading weather entities</option>';
    }
  }

  // Save weather entity configuration
  async saveWeatherEntity() {
    const shadow = this.shadowRoot;
    const weatherSelector = shadow.getElementById('weather-entity-selector');
    const saveButton = shadow.getElementById('save-weather-entity');
    
    if (!weatherSelector || !this._hass) return;

    const selectedEntity = weatherSelector.value;
    if (!selectedEntity) {
      alert('Please select a weather entity');
      return;
    }

    // Validate the selected entity exists
    if (!this._hass.states[selectedEntity]) {
      alert(`Weather entity "${selectedEntity}" not found in Home Assistant`);
      return;
    }

    const originalButtonText = saveButton.textContent;
    saveButton.textContent = 'Saving...';
    saveButton.disabled = true;

    try {
      // Call the service to set the weather entity
      await this._hass.callService('dashview', 'set_weather_entity', {
        entity_id: selectedEntity
      });
      
      // Show success feedback
      saveButton.textContent = 'Saved!';
      saveButton.style.background = 'var(--green)';
      
      // Reset button after 2 seconds
      setTimeout(() => {
        saveButton.textContent = originalButtonText;
        saveButton.disabled = false;
        saveButton.style.background = '';
      }, 2000);
      
      // Update the weather components with the new entity
      setTimeout(() => {
        this.updateWeatherComponents(shadow);
      }, 500);
      
    } catch (error) {
      console.error('Error saving weather entity:', error);
      saveButton.textContent = 'Error!';
      saveButton.style.background = 'var(--red)';
      
      // Reset button after 3 seconds
      setTimeout(() => {
        saveButton.textContent = originalButtonText;
        saveButton.disabled = false;
        saveButton.style.background = '';
      }, 3000);
      
      alert(`Error saving weather entity: ${error.message}`);
    }
  }

  // Get the currently configured weather entity
  getCurrentWeatherEntity() {
    if (!this._hass) return 'weather.forecast_home'; // fallback

    const configuredSensor = this._hass.states[`sensor.dashview_configured_weather_entity`] || 
                            this._hass.states[`sensor.dashview_configured_weather`];
    if (configuredSensor && configuredSensor.state) {
      return configuredSensor.state;
    }
    
    // Fallback to first available weather entity or default
    const weatherEntities = Object.keys(this._hass.states)
      .filter(entityId => entityId.startsWith('weather.'));
    
    return weatherEntities.length > 0 ? weatherEntities[0] : 'weather.forecast_home';

  }

  // Update room notifications based on sensor states and thresholds
  updateRoomNotifications(shadow) {
    if (!this._hass || !this._roomNotificationsConfig || 
        !this._roomNotificationsConfig.room_conditions) {
      // Load configuration if not already loaded
      if (!this._roomNotificationsConfig || Object.keys(this._roomNotificationsConfig).length === 0) {
        this.loadConfiguration().then(() => {
          this.updateRoomNotifications(shadow);
        });
      }
      return;
    }

    const { global_thresholds, room_conditions } = this._roomNotificationsConfig;

    // Iterate through each room popup and update its notifications
    Object.keys(room_conditions).forEach(roomName => {
      const roomConfig = room_conditions[roomName];
      const popupId = this.getRoomPopupId(roomName);
      const roomPopup = shadow.getElementById(popupId);
      
      if (roomPopup) {
        const notificationDiv = roomPopup.querySelector('.room-notification');
        if (notificationDiv) {
          const notificationHTML = this.generateRoomNotificationHTML(roomName, roomConfig, global_thresholds);
          notificationDiv.innerHTML = notificationHTML;
        }
      }
    });
  }

  // Map room names to popup IDs
  getRoomPopupId(roomName) {
    const roomMappings = {
      'Wohnzimmer': 'wohnzimmer-popup',
      'Büro': 'buero-popup', 
      'Eltern': 'elternbereich-popup',
      'Kellerraum': 'keller-popup',
      'Sauna': 'sauna-popup',
      'Kinderbad': 'kinderbad-popup',
      'Partykeller': 'partykeller-popup'
    };
    return roomMappings[roomName] || `${roomName.toLowerCase()}-popup`;
  }

  // Generate HTML for room notification based on sensor states
  generateRoomNotificationHTML(roomName, roomConfig, globalThresholds) {
    if (!this._hass) return '';

    const tempSensor = this._hass.states[roomConfig.temp_sensor];
    const humSensor = this._hass.states[roomConfig.hum_sensor];
    
    if (!tempSensor && !humSensor) {
      return '<div style="display: none;"></div>';
    }

    const temperature = tempSensor ? parseFloat(tempSensor.state) : null;
    const humidity = humSensor ? parseFloat(humSensor.state) : null;
    const tempThreshold = roomConfig.temp_above || globalThresholds.temp_above_default;
    const humThreshold = roomConfig.hum_above || globalThresholds.hum_above_default;

    const tempExceeded = temperature !== null && temperature > tempThreshold;
    const humExceeded = humidity !== null && humidity > humThreshold;
    
    if (!tempExceeded && !humExceeded) {
      return '<div style="display: none;"></div>';
    }

    let displayText = '';
    if (tempExceeded) {
      displayText += `Temperatur: ${temperature}°C`;
    }
    if (humExceeded) {
      if (displayText) displayText += ' - ';
      displayText += `Luftfeuchtigkeit: ${humidity}%`;
    }

    return `
      <div class="notification-card" style="
        display: flex;
        align-items: center;
        background: var(--warning-color, #ff9800);
        border-radius: 8px;
        padding: 12px;
        margin: 8px 0;
        color: white;
        font-weight: 500;
      ">
        <div style="font-size: 24px; margin-right: 12px;">⚠️</div>
        <div>
          <div style="font-size: 16px; margin-bottom: 4px;">Bitte Raum lüften</div>
          <div style="font-size: 12px; opacity: 0.9;">${displayText}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('dashview-panel', DashviewPanel);
