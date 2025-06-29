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
            console.log(`[WeatherManager] Fetching forecasts for ${entityId}`);
            
            // Strategy 1: Try the official Home Assistant weather.get_forecasts service (recommended approach)
            const serviceData = await this._tryServiceAPI(entityId);
            if (serviceData) {
                this._forecasts.daily = serviceData.daily || [];
                this._forecasts.hourly = serviceData.hourly || [];
                console.log(`[WeatherManager] Service API: Fetched ${this._forecasts.daily.length} daily and ${this._forecasts.hourly.length} hourly forecasts`);
                return;
            }

            // Strategy 2: Try to get data from template sensor attributes (fallback for custom setups)
            const templateData = await this._tryTemplateSensorData(entityId);
            if (templateData) {
                this._forecasts.daily = templateData.daily || [];
                this._forecasts.hourly = templateData.hourly || [];
                console.log(`[WeatherManager] Template sensors: Fetched ${this._forecasts.daily.length} daily and ${this._forecasts.hourly.length} hourly forecasts`);
                return;
            }

            console.warn(`[WeatherManager] No forecast data available from any source for ${entityId}`);
            this._forecasts.daily = [];
            this._forecasts.hourly = [];

        } catch (error) {
            console.error(`[WeatherManager] Error fetching forecasts for ${entityId}:`, error);
            this._forecasts.daily = [];
            this._forecasts.hourly = [];
        }
    }


    async _tryServiceAPI(entityId) {
        try {
            console.log(`[WeatherManager] Trying service API for ${entityId}`);
            
            // Use official Home Assistant weather.get_forecasts service
            const dailyResponse = await this._hass.callService('weather', 'get_forecasts', {
                entity_id: entityId,
                type: 'daily'
            }, true);

            const hourlyResponse = await this._hass.callService('weather', 'get_forecasts', {
                entity_id: entityId,
                type: 'hourly'
            }, true);

            // Extract forecast data from service response
            const dailyForecasts = dailyResponse?.response?.[entityId]?.forecast || dailyResponse?.[entityId]?.forecast || [];
            const hourlyForecasts = hourlyResponse?.response?.[entityId]?.forecast || hourlyResponse?.[entityId]?.forecast || [];

            if (dailyForecasts.length > 0 || hourlyForecasts.length > 0) {
                return {
                    daily: dailyForecasts,
                    hourly: hourlyForecasts
                };
            }

            return null;
        } catch (error) {
            console.log(`[WeatherManager] Service API failed:`, error.message);
            return null;
        }
    }

    async _tryTemplateSensorData(entityId) {
        try {
            console.log(`[WeatherManager] Trying template sensor data approach for ${entityId}`);
            
            const entityBase = entityId.replace('weather.', '');
            
            // Look for template sensors that might contain forecast data
            const possibleHourlySensors = [
                'sensor.hourly_forecast',
                `sensor.weather_forecast_hourly_${entityBase}`,
                'sensor.weather_forecast_hourly'
            ];
            
            let hourlyEntity = null;
            let hourlyForecastSensor = null;
            for (const sensorName of possibleHourlySensors) {
                if (this._hass.states[sensorName]) {
                    hourlyEntity = this._hass.states[sensorName];
                    hourlyForecastSensor = sensorName;
                    break;
                }
            }
            
            let hourlyForecasts = [];
            let dailyForecasts = [];

            // Extract hourly data from template sensor attributes (user's approach)
            if (hourlyEntity && hourlyEntity.attributes && hourlyEntity.attributes.forecast) {
                hourlyForecasts = hourlyEntity.attributes.forecast;
                console.log(`[WeatherManager] Found hourly forecast data in ${hourlyForecastSensor}: ${hourlyForecasts.length} items`);
            }

            // Try to construct daily forecasts from individual template sensors
            const dailyTemplateSensors = [
                { temp: `sensor.temperature_forecast_today`, condition: `sensor.state_forecast_today` },
                { temp: `sensor.temperature_forecast_tomorrow`, condition: `sensor.state_forecast_tomorrow` },
                { temp: `sensor.temperature_forecast_day2`, condition: `sensor.state_forecast_day2` }
            ];

            for (let i = 0; i < dailyTemplateSensors.length; i++) {
                const { temp, condition } = dailyTemplateSensors[i];
                const tempEntity = this._hass.states[temp];
                const conditionEntity = this._hass.states[condition];
                
                if (tempEntity && conditionEntity && tempEntity.state !== 'unavailable') {
                    const forecastDate = new Date();
                    forecastDate.setDate(forecastDate.getDate() + i);
                    
                    dailyForecasts.push({
                        datetime: forecastDate.toISOString(),
                        temperature: parseFloat(tempEntity.state) || 20,
                        condition: conditionEntity.state || 'unknown',
                        templow: parseFloat(tempEntity.state) - 5 // Estimate, could be improved
                    });
                }
            }

            if (hourlyForecasts.length > 0 || dailyForecasts.length > 0) {
                console.log(`[WeatherManager] Template sensors: ${dailyForecasts.length} daily, ${hourlyForecasts.length} hourly forecasts`);
                return {
                    daily: dailyForecasts,
                    hourly: hourlyForecasts
                };
            }

            return null;
        } catch (error) {
            console.log(`[WeatherManager] Template sensor approach failed:`, error.message);
            return null;
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
        if (!container) {
            console.warn('[WeatherManager] Hourly forecast container not found');
            return;
        }
        
        if (!hourlyData || !Array.isArray(hourlyData) || hourlyData.length === 0) {
            console.warn('[WeatherManager] No hourly forecast data available:', hourlyData);
            container.innerHTML = '<div class="hourly-item">Keine stündlichen Daten verfügbar</div>';
            return;
        }
        
        console.log(`[WeatherManager] Rendering ${hourlyData.length} hourly forecasts`);
        container.innerHTML = '';
        const next8Hours = hourlyData.slice(0, 8);
        
        next8Hours.forEach((forecast, index) => {
            try {
                const item = document.createElement('div');
                item.className = 'hourly-item';
                
                // Handle different datetime formats
                let timeString = 'N/A';
                try {
                    const dateTime = new Date(forecast.datetime);
                    if (!isNaN(dateTime.getTime())) {
                        timeString = dateTime.getHours().toString().padStart(2, '0') + ':00';
                    }
                } catch (timeError) {
                    console.warn(`[WeatherManager] Invalid datetime for forecast ${index}:`, forecast.datetime);
                    timeString = `${index}h`;
                }
                
                // Handle missing or invalid temperature
                let tempString = 'N/A';
                if (typeof forecast.temperature === 'number') {
                    tempString = `${Math.round(forecast.temperature)}°`;
                } else if (forecast.temperature && !isNaN(parseFloat(forecast.temperature))) {
                    tempString = `${Math.round(parseFloat(forecast.temperature))}°`;
                }
                
                // Handle missing condition
                const condition = forecast.condition || 'unknown';
                
                item.innerHTML = `
                    <div class="hourly-time">${timeString}</div>
                    <div class="hourly-icon"><img src="/local/weather_icons/${condition}.svg" alt="${condition}" width="32" height="32" onerror="this.src='/local/weather_icons/unknown.svg'"></div>
                    <div class="hourly-temp">${tempString}</div>
                `;
                container.appendChild(item);
            } catch (error) {
                console.error(`[WeatherManager] Error rendering hourly forecast ${index}:`, error, forecast);
            }
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
        if (!container) {
            console.warn('[WeatherManager] Daily forecast container not found');
            return;
        }
        
        if (!dailyData || !Array.isArray(dailyData) || dailyData.length <= dayIndex) {
            console.warn(`[WeatherManager] No daily forecast data for day ${dayIndex}:`, dailyData);
            container.innerHTML = '<div class="daily-forecast">Keine Tagesdaten verfügbar</div>';
            return;
        }
        
        const forecast = dailyData[dayIndex];
        console.log(`[WeatherManager] Rendering daily forecast for day ${dayIndex}:`, forecast);
        
        try {
            // Handle missing or invalid temperature
            let highTemp = 'N/A';
            if (typeof forecast.temperature === 'number') {
                highTemp = `${Math.round(forecast.temperature)}°C`;
            } else if (forecast.temperature && !isNaN(parseFloat(forecast.temperature))) {
                highTemp = `${Math.round(parseFloat(forecast.temperature))}°C`;
            }
            
            // Handle missing or invalid low temperature
            let lowTemp = '';
            if (forecast.templow) {
                if (typeof forecast.templow === 'number') {
                    lowTemp = `${Math.round(forecast.templow)}°C`;
                } else if (!isNaN(parseFloat(forecast.templow))) {
                    lowTemp = `${Math.round(parseFloat(forecast.templow))}°C`;
                }
            }
            
            // Handle missing condition
            const condition = forecast.condition || 'unknown';
            const translatedCondition = this._translateWeatherCondition(condition);
            
            container.innerHTML = `
                <div class="daily-forecast">
                  <div class="daily-icon"><img src="/local/weather_icons/${condition}.svg" width="50" height="50" onerror="this.src='/local/weather_icons/unknown.svg'"></div>
                  <div class="daily-info">
                    <div class="daily-condition">${translatedCondition}</div>
                    <div class="daily-temps">
                      <span class="daily-high">${highTemp}</span>
                      ${lowTemp ? `<span class="daily-low">${lowTemp}</span>` : ''}
                    </div>
                  </div>
                </div>`;
        } catch (error) {
            console.error(`[WeatherManager] Error rendering daily forecast for day ${dayIndex}:`, error, forecast);
            container.innerHTML = '<div class="daily-forecast">Fehler beim Laden der Tagesdaten</div>';
        }
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
