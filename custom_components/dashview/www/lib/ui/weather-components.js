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

        const popup = this._shadowRoot.querySelector('#weather-popup.active');
        if (!popup) return;

        await this._fetchWeatherForecasts();

        this._updateCurrentWeather(weatherState);
        this._updateHourlyForecast(this._forecasts.hourly);
        this._initializeDailyForecast(this._forecasts.daily);
        this.updatePollenCard(popup);
    }
    
    async _fetchWeatherForecasts() {
        if (!this._hass) return;
        const entityId = this._panel._getCurrentWeatherEntityId();
        if (!entityId) return;

        try {
            const dailyResponse = await this._hass.callWS({
                type: 'weather/subscribe_forecast',
                entity_id: entityId,
                forecast_type: 'daily'
            });

            const hourlyResponse = await this._hass.callWS({
                type: 'weather/subscribe_forecast',
                entity_id: entityId,
                forecast_type: 'hourly'
            });

            this._forecasts.daily = dailyResponse?.forecast || [];
            this._forecasts.hourly = hourlyResponse?.forecast || [];

        } catch (error) {
            console.error(`[WeatherManager] Error fetching forecasts for ${entityId}:`, error);
            this._forecasts.daily = [];
            this._forecasts.hourly = [];
        }
    }

    updatePollenCard(popup) {
        if (!popup || !this._hass) return;

        const weatherEntityId = this._panel._getCurrentWeatherEntityId();
        const weatherEntityBase = weatherEntityId.replace('weather.', '');

        popup.querySelectorAll('.pollen-button').forEach(button => {
            const pollenType = button.dataset.pollen;
            const sensorId = `sensor.${weatherEntityBase}_${pollenType}`;
            const sensorEntity = this._hass.states[sensorId];
            const stateElement = button.querySelector('.pollen-state');
            
            if (sensorEntity && sensorEntity.state !== 'unavailable') {
                const value = parseFloat(sensorEntity.state);
                if (value === 0) {
                    button.style.display = 'none';
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

        const container = popup.querySelector('.current-weather');
        if (!container) return;
    
        const { temperature, apparent_temperature, humidity, wind_speed } = weatherState.attributes;
    
        container.innerHTML = `
            <div class="daily-forecast">
                <div class="daily-icon"><img src="/local/weather_icons/${weatherState.state}.svg" width="50" height="50"></div>
                <div class="daily-info">
                    <div class="daily-condition">${this._translateWeatherCondition(weatherState.state)}</div>
                    <div class="daily-temps">
                        <span class="daily-high">${Math.round(temperature)}°C</span>
                        <span class="daily-low">Gefühlt ${Math.round(apparent_temperature)}°C</span>
                    </div>
                </div>
                <div class="weather-details">
                    <div class="detail-item">
                        <span class="detail-label">Luftfeuchtigkeit</span>
                        <span class="detail-value">${humidity}%</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Wind</span>
                        <span class="detail-value">${Math.round(wind_speed)} km/h</span>
                    </div>
                </div>
            </div>
        `;
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
                tab.addEventListener('click', () => {
                    const dayIndex = parseInt(tab.dataset.day, 10);
                    updateForecastDisplay(dayIndex);
                });
                tab.listenerAttached = true;
            }
        });
    
        // Ensure initial render for day 0
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
