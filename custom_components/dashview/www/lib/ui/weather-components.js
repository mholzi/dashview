// custom_components/dashview/lib/ui/weather-components.js

export class WeatherComponents {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._shadowRoot = panel.shadowRoot;
        this._forecasts = { daily: null, hourly: null };
    }

    setHass(hass) {
        this._hass = hass;
    }

    async update() {
        if (!this._hass) return;

        const weatherEntityId = this._panel._getCurrentWeatherEntityId();
        const weatherState = this._hass.states[weatherEntityId];
        if (!weatherState) return;

        await this._fetchWeatherForecasts();

        this._updateCurrentWeather(weatherState);
        this._updateHourlyForecast(this._forecasts.hourly);
        this._initializeDailyForecast(this._forecasts.daily);
    }
    
    async _fetchWeatherForecasts() {
        if (!this._hass) return;
        const entityId = this._panel._getCurrentWeatherEntityId();
        if (!entityId) return;

        try {
            // FIX: The 'true' parameter for returning response is not needed for hass.callService
            const dailyResponse = await this._hass.callService('weather', 'get_forecasts', {
                target: { entity_id: entityId },
                type: 'daily'
            });

            const hourlyResponse = await this._hass.callService('weather', 'get_forecasts', {
                target: { entity_id: entityId },
                type: 'hourly'
            });

            this._forecasts.daily = dailyResponse?.[entityId]?.forecast || [];
            this._forecasts.hourly = hourlyResponse?.[entityId]?.forecast || [];
        } catch (error) {
            console.error(`[WeatherManager] Error fetching forecasts for ${entityId}:`, error);
            this._forecasts.daily = [];
            this._forecasts.hourly = [];
        }
    }

    // FIX: Add missing method
    updatePollenCard(popup) {
        if (!popup || !this._hass) return;
        const pollenButtons = popup.querySelectorAll('.pollen-button');
        pollenButtons.forEach(button => {
            const sensorId = button.dataset.sensor;
            const sensorEntity = this._hass.states[sensorId];
            const stateElement = button.querySelector('.pollen-state');
            
            if (sensorEntity && sensorEntity.state !== 'unavailable') {
                const value = parseFloat(sensorEntity.state);
                if (value === 0) {
                    button.style.display = 'none'; // Hide if no pollen
                    return;
                }
                button.style.display = 'flex';
                
                let stateText = 'n/a';
                let bgColor = '#dddddd';
                
                if (value < 2) { stateText = 'Niedrig'; bgColor = '#d6f5d6'; }
                else if (value < 3) { stateText = 'Moderat'; bgColor = '#fff4cc'; }
                else { stateText = 'Hoch'; bgColor = '#f8d0d0'; }
                
                if (stateElement) stateElement.textContent = stateText;
                button.style.backgroundColor = bgColor;
    
            } else {
                button.style.display = 'none';
            }
        });
    }

    _updateCurrentWeather(weatherState) {
        const popup = this._shadowRoot.querySelector('#weather-popup');
        if (!popup) return;

        const iconElement = popup.querySelector('#current-weather-icon');
        const tempElement = popup.querySelector('#current-temperature');
        const conditionElement = popup.querySelector('#current-condition');
        const feelsLikeElement = popup.querySelector('#feels-like-temp');
        const humidityElement = popup.querySelector('#humidity');
        const windElement = popup.querySelector('#wind-speed');

        if (iconElement) iconElement.src = `/local/weather_icons/${weatherState.state}.svg`;
        if (tempElement) tempElement.textContent = `${Math.round(weatherState.attributes.temperature)}°C`;
        if (conditionElement) conditionElement.textContent = this._translateWeatherCondition(weatherState.state);
        if (feelsLikeElement) feelsLikeElement.textContent = `${Math.round(weatherState.attributes.apparent_temperature)}°C`;
        if (humidityElement) humidityElement.textContent = `${weatherState.attributes.humidity}%`;
        if (windElement) windElement.textContent = `${Math.round(weatherState.attributes.wind_speed)} km/h`;
    }

    _updateHourlyForecast(hourlyData) {
        const container = this._shadowRoot.querySelector('#hourly-forecast');
        if (!container || !hourlyData) return;
        container.innerHTML = '';
        const next8Hours = hourlyData.slice(0, 8);
        next8Hours.forEach(forecast => {
            const item = document.createElement('div');
            item.className = 'hourly-item';
            const time = new Date(forecast.datetime).getHours().toString().padStart(2, '0') + ':00';
            item.innerHTML = `
                <div class="hourly-time">${time}</div>
                <div class="hourly-icon"><img src="/local/weather_icons/${forecast.condition}.svg" alt="${forecast.condition}" width="32" height="32"></div>
                <div class="hourly-temp">${Math.round(forecast.temperature)}°</div>
            `;
            container.appendChild(item);
        });
    }

    _initializeDailyForecast(dailyData) {
        const popup = this._shadowRoot.querySelector('#weather-popup');
        if (!popup) return;

        const tabs = popup.querySelectorAll('.forecast-tab');
        const content = popup.querySelector('#daily-forecast-content');
        if (!tabs.length || !content) return;

        const updateForecastDisplay = (dayIndex) => {
            tabs.forEach(t => t.classList.toggle('active', parseInt(t.dataset.day, 10) === dayIndex));
            this._showDailyForecast(content, dailyData, dayIndex);
        };

        tabs.forEach(tab => {
            if (!tab.listenerAttached) {
                tab.addEventListener('click', () => updateForecastDisplay(parseInt(tab.dataset.day, 10)));
                tab.listenerAttached = true;
            }
        });
        updateForecastDisplay(0);
    }

    _showDailyForecast(container, dailyData, dayIndex) {
        if (!dailyData || !Array.isArray(dailyData) || dailyData.length <= dayIndex) {
            container.innerHTML = '<div class="daily-forecast">No data</div>';
            return;
        }
        const forecast = dailyData[dayIndex];
        container.innerHTML = `
            <div class="daily-forecast">
              <div class="daily-icon"><img src="/local/weather_icons/${forecast.condition}.svg" width="50" height="50"></div>
              <div class="daily-info">
                <div class="daily-condition">${this._translateWeatherCondition(forecast.condition)}</div>
                <div class="daily-temps">
                  <span class="daily-high">${Math.round(forecast.temperature)}°C</span>
                  <span class="daily-low">${forecast.templow ? Math.round(forecast.templow) + '°C' : ''}</span>
                </div>
              </div>
            </div>`;
    }

    _translateWeatherCondition(condition) {
        const translations = {
            'clear-night': 'Klare Nacht', 'cloudy': 'Bewölkt', 'fog': 'Nebel',
            'hail': 'Hagel', 'lightning': 'Gewitter', 'lightning-rainy': 'Gewitter mit Regen',
            'partlycloudy': 'Teilweise bewölkt', 'pouring': 'Starkregen', 'rainy': 'Regnerisch',
            'snowy': 'Schnee', 'snowy-rainy': 'Schneeregen', 'sunny': 'Sonnig',
            'windy': 'Windig', 'windy-variant': 'Windig'
        };
        return translations[condition] || condition;
    }
}
