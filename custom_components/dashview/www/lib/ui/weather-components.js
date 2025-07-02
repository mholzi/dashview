// custom_components/dashview/lib/ui/weather-components.js

export class WeatherComponents {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._shadowRoot = panel.shadowRoot;
        this._forecasts = { daily: null, hourly: null };
        
        // Forecast graph state
        this._currentView = 'hourly'; // 'hourly' or 'daily'
        this._currentParameter = 'temperature'; // 'temperature', 'precipitation', 'wind'
        this._chartInstance = null;
        this._chartInitialized = false;
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
        this._initializeForecastGraph(popup);
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
    
        const { temperature } = weatherState.attributes;
        
        // Get precipitation from sensor if available
        const precipitationSensor = this._hass.states['sensor.dreieich_precipitation'];
        const precipitationValue = precipitationSensor ? parseFloat(precipitationSensor.state) : 0;
        
        // Build condition text with precipitation info
        let conditionText = this._translateWeatherCondition(weatherState.state);
        if (!isNaN(precipitationValue) && precipitationValue > 0) {
            conditionText += ` – Niederschlag ${precipitationValue.toFixed(1)} mm`;
        }
    
        container.innerHTML = `
            <div class="weather-card-title">Aktuell</div>
            <div class="weather-card-temperature">${Math.round(temperature).toFixed(1)}°C</div>
            <div class="weather-card-condition">${conditionText}</div>
            <div class="weather-card-icon">
                <img src="/local/weather_icons/${weatherState.state}.svg" width="96" height="96">
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
                
                // Handle different datetime formats with timezone conversion
                let timeString = 'N/A';
                try {
                    const dtUTC = new Date(forecast.datetime);
                    if (!isNaN(dtUTC.getTime())) {
                        // Convert to Berlin timezone and format
                        const dtLocal = new Date(dtUTC.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }));
                        timeString = dtLocal.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
                    }
                } catch (timeError) {
                    console.warn(`[WeatherManager] Invalid datetime for forecast ${index}:`, forecast.datetime);
                    timeString = `${index}h`;
                }
                
                // Handle missing or invalid temperature with 1 decimal place
                let tempString = '— °C';
                if (typeof forecast.temperature === 'number') {
                    tempString = `${forecast.temperature.toFixed(1)}°C`;
                } else if (forecast.temperature && !isNaN(parseFloat(forecast.temperature))) {
                    tempString = `${parseFloat(forecast.temperature).toFixed(1)}°C`;
                }
                
                // Handle wind speed
                let windString = '';
                if (typeof forecast.wind_speed === 'number') {
                    windString = `${forecast.wind_speed.toFixed(1)} km/h`;
                } else if (forecast.wind_speed && !isNaN(parseFloat(forecast.wind_speed))) {
                    windString = `${parseFloat(forecast.wind_speed).toFixed(1)} km/h`;
                }
                
                // Handle precipitation 
                let rainString = '';
                if (typeof forecast.precipitation === 'number') {
                    rainString = `${forecast.precipitation.toFixed(1)} mm`;
                } else if (forecast.precipitation && !isNaN(parseFloat(forecast.precipitation))) {
                    rainString = `${parseFloat(forecast.precipitation).toFixed(1)} mm`;
                }
                
                // Handle missing condition
                const condition = forecast.condition || 'unknown';
                
                item.innerHTML = `
                    <div class="hourly-time">${timeString}</div>
                    <div class="hourly-icon">
                        <img src="/local/weather_icons/${condition}.svg" alt="${condition}" onerror="this.src='/local/weather_icons/unknown.svg'">
                    </div>
                    <div class="hourly-temp">${tempString}</div>
                    <div class="hourly-wind">${windString}</div>
                    <div class="hourly-rain">${rainString}</div>
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
            let tempValue = 'N/A';
            if (typeof forecast.temperature === 'number') {
                tempValue = forecast.temperature.toFixed(1);
            } else if (forecast.temperature && !isNaN(parseFloat(forecast.temperature))) {
                tempValue = parseFloat(forecast.temperature).toFixed(1);
            }
            
            // Handle missing condition
            const condition = forecast.condition || 'unknown';
            
            // Get precipitation from sensor if available
            const precipitationSensor = this._hass.states['sensor.dreieich_precipitation'];
            const precipitationValue = precipitationSensor ? parseFloat(precipitationSensor.state) : 0;
            
            // Build condition text with precipitation info
            let conditionText = this._translateWeatherCondition(condition);
            if (!isNaN(precipitationValue) && precipitationValue > 0) {
                conditionText += ` – Niederschlag ${precipitationValue.toFixed(1)} mm`;
            }
            
            // Determine title based on day index
            const titles = ['Heute', 'Morgen', 'Übermorgen'];
            const title = titles[dayIndex] || `Tag ${dayIndex + 1}`;
            
            container.innerHTML = `
                <div class="weather-card-title">${title}</div>
                <div class="weather-card-temperature">${tempValue}°C</div>
                <div class="weather-card-condition">${conditionText}</div>
                <div class="weather-card-icon">
                    <img src="/local/weather_icons/${condition}.svg" width="96" height="96" onerror="this.src='/local/weather_icons/unknown.svg'">
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

    /**
     * Render entity-specific weather data for popup context
     * @param {HTMLElement} container - The popup container
     * @param {string} entityId - The weather entity ID to render
     */
    async renderEntityWeather(container, entityId) {
        console.log('[WeatherComponents] Rendering entity weather for popup:', entityId);
        
        if (!this._hass || !entityId) {
            console.warn('[WeatherComponents] Cannot render entity weather: missing hass or entityId');
            return;
        }
        
        const entityState = this._hass.states[entityId];
        if (!entityState) {
            console.warn('[WeatherComponents] Weather entity not found:', entityId);
            return;
        }
        
        // Create entity-specific weather display
        let html = '<div class="entity-weather-display">';
        
        // Current weather display
        html += '<div class="weather-current-display">';
        html += `<div class="weather-icon">`;
        html += `<img src="/local/weather_icons/${entityState.state}.svg" width="96" height="96" alt="${entityState.state}">`;
        html += `</div>`;
        html += `<div class="weather-temperature">${Math.round(entityState.attributes.temperature || 0)}°C</div>`;
        html += `<div class="weather-condition">${this._translateWeatherCondition(entityState.state)}</div>`;
        html += '</div>';
        
        // Weather details
        html += '<div class="weather-details">';
        html += '<h4>Weather Details</h4>';
        
        const attributes = entityState.attributes || {};
        const weatherDetails = [
            { key: 'humidity', label: 'Luftfeuchtigkeit', unit: '%' },
            { key: 'pressure', label: 'Luftdruck', unit: ' hPa' },
            { key: 'wind_speed', label: 'Windgeschwindigkeit', unit: ' km/h' },
            { key: 'wind_bearing', label: 'Windrichtung', unit: '°' },
            { key: 'visibility', label: 'Sichtweite', unit: ' km' }
        ];
        
        weatherDetails.forEach(detail => {
            if (attributes[detail.key] !== undefined) {
                html += `<div class="weather-detail-item">`;
                html += `<span class="detail-label">${detail.label}:</span>`;
                html += `<span class="detail-value">${attributes[detail.key]}${detail.unit}</span>`;
                html += `</div>`;
            }
        });
        
        html += '</div>';
        
        // Forecast placeholder
        html += '<div class="weather-forecast-preview">';
        html += '<h4>Forecast Data</h4>';
        html += '<div class="forecast-placeholder">';
        html += '<p>Detailed weather forecast and historical data would be displayed here</p>';
        html += '</div>';
        html += '</div>';
        
        html += '</div>';
        
        container.innerHTML = html;
        
        // TODO: Implement detailed forecast data fetching and display
        console.log('[WeatherComponents] Entity weather rendering complete for:', entityId);
    }

    /**
     * Initialize forecast graph with controls and chart
     * @param {HTMLElement} popup - The weather popup element
     */
    _initializeForecastGraph(popup) {
        if (!popup) return;

        const graphContainer = popup.querySelector('.forecast-graph-container');
        if (!graphContainer) return;

        // Initialize controls if not already done
        if (!this._chartInitialized) {
            this._initializeForecastControls(popup);
            this._chartInitialized = true;
        }

        // Update the chart with current data
        this._updateForecastChart();
    }

    /**
     * Initialize forecast graph controls and event listeners
     * @param {HTMLElement} popup - The weather popup element
     */
    _initializeForecastControls(popup) {
        // View toggle buttons (hourly/daily)
        const viewToggleBtns = popup.querySelectorAll('.forecast-toggle-btn');
        viewToggleBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newView = e.target.dataset.view;
                if (newView && newView !== this._currentView) {
                    this._currentView = newView;
                    this._updateViewToggleState(popup);
                    this._updateForecastChart();
                }
            });
        });

        // Parameter toggle buttons (temperature/precipitation/wind)
        const paramBtns = popup.querySelectorAll('.parameter-btn');
        paramBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const newParam = e.target.dataset.param;
                if (newParam && newParam !== this._currentParameter) {
                    this._currentParameter = newParam;
                    this._updateParameterToggleState(popup);
                    this._updateForecastChart();
                }
            });
        });

        // Retry button
        const retryBtn = popup.querySelector('.forecast-retry-btn');
        if (retryBtn) {
            retryBtn.addEventListener('click', () => {
                this.update();
            });
        }

        console.log('[WeatherComponents] Forecast controls initialized');
    }

    /**
     * Update view toggle button states
     * @param {HTMLElement} popup - The weather popup element
     */
    _updateViewToggleState(popup) {
        const viewToggleBtns = popup.querySelectorAll('.forecast-toggle-btn');
        viewToggleBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.view === this._currentView);
        });
    }

    /**
     * Update parameter toggle button states
     * @param {HTMLElement} popup - The weather popup element
     */
    _updateParameterToggleState(popup) {
        const paramBtns = popup.querySelectorAll('.parameter-btn');
        paramBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.param === this._currentParameter);
        });
    }

    /**
     * Update forecast chart with current data and settings
     */
    _updateForecastChart() {
        const canvas = this._shadowRoot.querySelector('#forecast-chart');
        if (!canvas) {
            console.warn('[WeatherComponents] Forecast chart canvas not found');
            return;
        }

        const popup = this._shadowRoot.querySelector('#weather-popup.active');
        if (!popup) return;

        // Show loading state
        this._showForecastLoading(popup, true);

        try {
            // Check if Chart.js is available (access from parent window for Shadow DOM)
            const Chart = window.parent?.Chart || window.Chart || globalThis.Chart;
            if (typeof Chart === 'undefined' || !Chart) {
                console.error('[WeatherComponents] Chart.js library not loaded');
                this._showForecastFallback(popup);
                return;
            }

            // Get data based on current view
            const data = this._currentView === 'hourly' ? this._forecasts.hourly : this._forecasts.daily;
            
            if (!data || data.length === 0) {
                this._showForecastError(popup, 'Keine Vorhersagedaten verfügbar');
                return;
            }

            // Prepare chart data
            const chartData = this._prepareForecastChartData(data);
            
            if (!chartData) {
                this._showForecastError(popup, 'Fehler beim Verarbeiten der Vorhersagedaten');
                return;
            }

            // Validate canvas context
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                console.error('[WeatherComponents] Cannot get 2D context from canvas');
                this._showForecastFallback(popup);
                return;
            }

            // Create or update chart
            this._createForecastChart(canvas, chartData, Chart);
            
            // Hide loading/error states
            this._showForecastLoading(popup, false);
            this._showForecastError(popup, null);

        } catch (error) {
            console.error('[WeatherComponents] Error updating forecast chart:', error);
            
            // Determine the specific type of error for better user feedback
            if (error.name === 'ReferenceError' && error.message.includes('Chart')) {
                console.error('[WeatherComponents] Chart.js library error:', error);
                this._showForecastFallback(popup);
            } else if (error.message.includes('canvas') || error.message.includes('context')) {
                console.error('[WeatherComponents] Canvas rendering error:', error);
                this._showForecastFallback(popup);
            } else {
                this._showForecastError(popup, 'Fehler beim Laden des Diagramms');
            }
        }
    }

    /**
     * Prepare chart data based on current view and parameter
     * @param {Array} forecastData - Raw forecast data
     * @returns {Object} Chart.js compatible data object
     */
    _prepareForecastChartData(forecastData) {
        if (!forecastData || forecastData.length === 0) return null;

        const labels = [];
        const dataPoints = [];
        const borderColor = this._getParameterColor(this._currentParameter);
        const backgroundColor = this._getParameterColor(this._currentParameter, 0.1);

        // Limit data points for performance
        const maxDataPoints = this._currentView === 'hourly' ? 24 : 7;
        const limitedData = forecastData.slice(0, maxDataPoints);

        limitedData.forEach(item => {
            // Extract timestamp
            let timestamp;
            if (item.datetime) {
                timestamp = new Date(item.datetime);
            } else if (item.time) {
                timestamp = new Date(item.time);
            } else {
                return; // Skip items without valid timestamp
            }

            // Format label based on view
            let label;
            if (this._currentView === 'hourly') {
                label = timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
            } else {
                label = timestamp.toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric' });
            }

            // Extract data point based on parameter
            let value = null;
            switch (this._currentParameter) {
                case 'temperature':
                    value = item.temperature || item.temp;
                    break;
                case 'precipitation':
                    value = item.precipitation || item.rain || 0;
                    break;
                case 'wind':
                    value = item.wind_speed || item.windSpeed || 0;
                    break;
            }

            if (value !== null && !isNaN(value)) {
                labels.push(label);
                dataPoints.push(value);
            }
        });

        if (dataPoints.length === 0) {
            console.warn('[WeatherComponents] No valid data points found for parameter:', this._currentParameter);
            return null;
        }

        return {
            labels: labels,
            datasets: [{
                label: this._getParameterLabel(this._currentParameter),
                data: dataPoints,
                borderColor: borderColor,
                backgroundColor: backgroundColor,
                borderWidth: 2,
                fill: this._currentParameter === 'precipitation',
                tension: 0.4,
                pointRadius: 3,
                pointHoverRadius: 5,
                pointBackgroundColor: borderColor,
                pointBorderColor: '#fff',
                pointBorderWidth: 1
            }]
        };
    }

    /**
     * Create or update the Chart.js instance
     * @param {HTMLCanvasElement} canvas - Chart canvas element
     * @param {Object} data - Chart data
     * @param {Function} Chart - Chart.js constructor
     */
    _createForecastChart(canvas, data, Chart) {
        // Destroy existing chart if it exists
        if (this._chartInstance) {
            this._chartInstance.destroy();
        }

        const ctx = canvas.getContext('2d');
        
        // Chart.js configuration
        const config = {
            type: this._currentParameter === 'precipitation' ? 'bar' : 'line',
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: 'white',
                        bodyColor: 'white',
                        borderColor: 'rgba(0, 0, 0, 0.8)',
                        borderWidth: 1,
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                const unit = this._getParameterUnit(this._currentParameter);
                                return `${context.dataset.label}: ${value}${unit}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--secondary-text-color').trim(),
                            font: {
                                size: 11
                            }
                        }
                    },
                    y: {
                        beginAtZero: this._currentParameter === 'precipitation',
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--gray200').trim(),
                            borderDash: [2, 2]
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--secondary-text-color').trim(),
                            font: {
                                size: 11
                            },
                            callback: (value) => {
                                const unit = this._getParameterUnit(this._currentParameter);
                                return `${value}${unit}`;
                            }
                        }
                    }
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                }
            }
        };

        // Create new chart instance
        this._chartInstance = new Chart(ctx, config);
        console.log('[WeatherComponents] Forecast chart created successfully');
    }

    /**
     * Get color for weather parameter
     * @param {string} parameter - Parameter name
     * @param {number} alpha - Alpha value for background color
     * @returns {string} Color value
     */
    _getParameterColor(parameter, alpha = 1) {
        const colors = {
            temperature: alpha < 1 ? `rgba(255, 99, 132, ${alpha})` : '#ff6384',
            precipitation: alpha < 1 ? `rgba(54, 162, 235, ${alpha})` : '#36a2eb',
            wind: alpha < 1 ? `rgba(255, 206, 84, ${alpha})` : '#ffce56'
        };
        return colors[parameter] || '#999';
    }

    /**
     * Get label for weather parameter
     * @param {string} parameter - Parameter name
     * @returns {string} Localized label
     */
    _getParameterLabel(parameter) {
        const labels = {
            temperature: 'Temperatur',
            precipitation: 'Niederschlag',
            wind: 'Windgeschwindigkeit'
        };
        return labels[parameter] || parameter;
    }

    /**
     * Get unit for weather parameter
     * @param {string} parameter - Parameter name
     * @returns {string} Unit string
     */
    _getParameterUnit(parameter) {
        const units = {
            temperature: '°C',
            precipitation: 'mm',
            wind: 'km/h'
        };
        return units[parameter] || '';
    }

    /**
     * Show/hide forecast loading state
     * @param {HTMLElement} popup - Weather popup element
     * @param {boolean} show - Whether to show loading state
     */
    _showForecastLoading(popup, show) {
        const loadingEl = popup.querySelector('.forecast-loading');
        const canvas = popup.querySelector('#forecast-chart');
        
        if (loadingEl) {
            loadingEl.style.display = show ? 'block' : 'none';
        }
        if (canvas) {
            canvas.style.opacity = show ? '0.3' : '1';
        }
    }

    /**
     * Show/hide forecast error state
     * @param {HTMLElement} popup - Weather popup element
     * @param {string|null} message - Error message or null to hide
     */
    _showForecastError(popup, message) {
        const errorEl = popup.querySelector('.forecast-error');
        const canvas = popup.querySelector('#forecast-chart');
        
        if (errorEl) {
            if (message) {
                errorEl.style.display = 'block';
                const messageEl = errorEl.querySelector('p');
                if (messageEl) {
                    messageEl.textContent = message;
                }
            } else {
                errorEl.style.display = 'none';
            }
        }
        
        if (canvas) {
            canvas.style.opacity = message ? '0.3' : '1';
        }
    }

    /**
     * Show forecast data as table when chart fails (fallback)
     * @param {HTMLElement} popup - Weather popup element
     */
    _showForecastFallback(popup) {
        console.log('[WeatherComponents] Showing forecast data fallback (table view)');
        
        // Hide loading state
        this._showForecastLoading(popup, false);
        
        // Get data based on current view
        const data = this._currentView === 'hourly' ? this._forecasts.hourly : this._forecasts.daily;
        
        if (!data || data.length === 0) {
            this._showForecastError(popup, 'Keine Vorhersagedaten verfügbar');
            return;
        }

        // Find or create fallback container
        let fallbackContainer = popup.querySelector('.forecast-fallback');
        if (!fallbackContainer) {
            fallbackContainer = document.createElement('div');
            fallbackContainer.className = 'forecast-fallback';
            
            const chartContainer = popup.querySelector('.forecast-graph-content');
            if (chartContainer) {
                chartContainer.appendChild(fallbackContainer);
            }
        }

        // Hide canvas and error elements
        const canvas = popup.querySelector('#forecast-chart');
        const errorEl = popup.querySelector('.forecast-error');
        if (canvas) canvas.style.display = 'none';
        if (errorEl) errorEl.style.display = 'none';

        // Generate fallback table
        const tableHtml = this._generateForecastTable(data);
        fallbackContainer.innerHTML = `
            <div class="forecast-fallback-header">
                <i class="mdi mdi-table"></i>
                <p>Diagramm nicht verfügbar - Daten als Tabelle:</p>
            </div>
            ${tableHtml}
        `;
        
        fallbackContainer.style.display = 'block';
    }

    /**
     * Generate HTML table for forecast data
     * @param {Array} data - Forecast data
     * @returns {string} HTML table string
     */
    _generateForecastTable(data) {
        const parameterName = this._getParameterDisplayName(this._currentParameter);
        const unit = this._getParameterUnit(this._currentParameter);
        const maxRows = this._currentView === 'hourly' ? 12 : 7; // Limit rows for readability
        
        let tableHtml = `
            <table class="forecast-table">
                <thead>
                    <tr>
                        <th>Zeit</th>
                        <th>${parameterName}</th>
                    </tr>
                </thead>
                <tbody>
        `;

        data.slice(0, maxRows).forEach(item => {
            const time = this._formatForecastTime(item, this._currentView);
            const value = this._extractParameterValue(item, this._currentParameter);
            
            tableHtml += `
                <tr>
                    <td>${time}</td>
                    <td>${value}${unit}</td>
                </tr>
            `;
        });

        tableHtml += `
                </tbody>
            </table>
        `;

        return tableHtml;
    }

    /**
     * Get display name for parameter
     * @param {string} parameter - Parameter key
     * @returns {string} Display name
     */
    _getParameterDisplayName(parameter) {
        const names = {
            temperature: 'Temperatur',
            precipitation: 'Niederschlag',
            wind: 'Wind'
        };
        return names[parameter] || parameter;
    }

    /**
     * Format forecast time for table display
     * @param {Object} item - Forecast item
     * @param {string} view - hourly or daily
     * @returns {string} Formatted time
     */
    _formatForecastTime(item, view) {
        if (!item.datetime) return 'N/A';
        
        const date = new Date(item.datetime);
        
        if (view === 'hourly') {
            return date.toLocaleTimeString('de-DE', { 
                hour: '2-digit', 
                minute: '2-digit' 
            });
        } else {
            return date.toLocaleDateString('de-DE', { 
                weekday: 'short', 
                day: 'numeric',
                month: 'short'
            });
        }
    }

    /**
     * Extract parameter value from forecast item
     * @param {Object} item - Forecast item
     * @param {string} parameter - Parameter to extract
     * @returns {number} Parameter value
     */
    _extractParameterValue(item, parameter) {
        switch (parameter) {
            case 'temperature':
                return Math.round(item.temperature || 0);
            case 'precipitation':
                return Math.round((item.precipitation || 0) * 10) / 10;
            case 'wind':
                return Math.round((item.wind_speed || 0) * 10) / 10;
            default:
                return 0;
        }
    }

    /**
     * Cleanup chart instance when weather popup is closed
     */
    dispose() {
        if (this._chartInstance) {
            this._chartInstance.destroy();
            this._chartInstance = null;
        }
        this._chartInitialized = false;
        console.log('[WeatherComponents] Disposed forecast chart resources');
    }
}
