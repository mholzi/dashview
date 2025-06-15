class DashviewPanel extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._contentReady = false;
    this._floorsConfig = {};
    this._roomsConfig = {};
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
    

    // Update Pollen Card
    this.updatePollenCard(shadow);

    // Update Header Buttons
    this.updateHeaderButtons(shadow);

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
    
    if (motionEntity.state === 'on') {
      prefixElement.textContent = 'Im Haus ist seit';
      section.classList.remove('hidden');
      badge.classList.add('green');
      badge.classList.remove('red');
      badgeElement.textContent = 'Jetzt🏡';
    } else {
      prefixElement.textContent = 'Die letzte Bewegung im Haus war vor';
      section.classList.remove('hidden');
      badge.classList.remove('green');
      badge.classList.add('red');
      
      // Calculate time difference
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
      const [floorsResponse, roomsResponse] = await Promise.all([
        fetch('/local/dashview/config/floors.json'),
        fetch('/local/dashview/config/rooms.json')
      ]);

      if (floorsResponse.ok && roomsResponse.ok) {
        this._floorsConfig = await floorsResponse.json();
        this._roomsConfig = await roomsResponse.json();
      } else {
        console.warn('Could not load floor/room configuration files');
        this._floorsConfig = {};
        this._roomsConfig = {};
      }
    } catch (error) {
      console.error('Error loading configuration:', error);
      this._floorsConfig = {};
      this._roomsConfig = {};
    }
  }

  // Update header buttons based on sensor states
  async updateHeaderButtons(shadow) {
    if (!this._floorsConfig || Object.keys(this._floorsConfig).length === 0) {
      await this.loadConfiguration();
    }

    const container = shadow.getElementById('header-buttons');
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

    if (!statusElement || !floorsTextarea || !roomsTextarea) return;

    statusElement.textContent = 'Loading configuration...';

    try {
      const [floorsResponse, roomsResponse] = await Promise.all([
        fetch('/local/dashview/config/floors.json'),
        fetch('/local/dashview/config/rooms.json')
      ]);

      if (floorsResponse.ok && roomsResponse.ok) {
        const floorsConfig = await floorsResponse.json();
        const roomsConfig = await roomsResponse.json();

        floorsTextarea.value = JSON.stringify(floorsConfig, null, 2);
        roomsTextarea.value = JSON.stringify(roomsConfig, null, 2);

        statusElement.textContent = '✓ Configuration loaded successfully';
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
      const configuredSensor = this._hass.states[`sensor.dashview_configured_weather`];
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
    
    if (!weatherSelector || !this._hass) return;

    const selectedEntity = weatherSelector.value;
    if (!selectedEntity) {
      alert('Please select a weather entity');
      return;
    }

    try {
      // Call the service to set the weather entity
      await this._hass.callService('dashview', 'set_weather_entity', {
        entity_id: selectedEntity
      });
      
      // Show success message (could be improved with a proper status display)
      alert(`Weather entity saved: ${selectedEntity}`);
      
      // Update the weather components with the new entity
      this.updateWeatherComponents(shadow);
      
    } catch (error) {
      console.error('Error saving weather entity:', error);
      alert(`Error saving weather entity: ${error.message}`);
    }
  }

  // Get the currently configured weather entity
  getCurrentWeatherEntity() {
    if (!this._hass) return 'weather.forecast_home'; // fallback

    const configuredSensor = this._hass.states[`sensor.dashview_configured_weather`];
    if (configuredSensor && configuredSensor.state) {
      return configuredSensor.state;
    }
    
    // Fallback to first available weather entity or default
    const weatherEntities = Object.keys(this._hass.states)
      .filter(entityId => entityId.startsWith('weather.'));
    
    return weatherEntities.length > 0 ? weatherEntities[0] : 'weather.forecast_home';
  }
}

customElements.define('dashview-panel', DashviewPanel);
