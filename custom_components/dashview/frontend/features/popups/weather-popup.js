/**
 * Weather Popup Module
 * Renders the weather detail popup with current conditions, hourly forecast, daily forecast, and pollen
 */

import { renderPopupHeader } from '../../components/layout/index.js';
import { t, getCurrentLang } from '../../utils/i18n.js';
import { getWeatherIconUrl } from '../../assets/weather-icons.js';
import { detectPollenSensors, getPollenLevel, getPollenTrend, POLLEN_TYPES } from '../../services/pollen-service.js';

// ==================== UV Index Helpers ====================

/**
 * Get UV level info based on UV index value
 * Uses WHO standard UV index scale
 * @param {number} index - UV index value
 * @returns {{ level: string, color: string, translationKey: string }} Level info with color and i18n key
 */
function getUVLevel(index) {
  if (index <= 2) return { level: 'Low', color: '#4caf50', translationKey: 'weather.uv_low' };
  if (index <= 5) return { level: 'Moderate', color: '#ff9800', translationKey: 'weather.uv_moderate' };
  if (index <= 7) return { level: 'High', color: '#f44336', translationKey: 'weather.uv_high' };
  if (index <= 10) return { level: 'Very High', color: '#9c27b0', translationKey: 'weather.uv_very_high' };
  return { level: 'Extreme', color: '#e91e63', translationKey: 'weather.uv_extreme' };
}

/**
 * Get UV index from weather entity attributes
 * @param {Object} component - DashviewPanel instance
 * @returns {number|null} UV index value or null if not available
 */
function getUVIndexFromEntity(component) {
  if (!component.hass || !component._weatherEntity) return null;
  const entity = component.hass.states[component._weatherEntity];
  if (!entity || entity.attributes.uv_index === undefined || entity.attributes.uv_index === null) return null;
  return parseFloat(entity.attributes.uv_index);
}

/**
 * Render a UV footer row (reused by current weather and forecast cards)
 * @param {Function} html - Lit html template function
 * @param {number} uvIndex - UV index value
 * @param {string} label - Label text (e.g. "UV Index" or "Peak UV")
 * @returns {TemplateResult} UV row template
 */
function renderUVRow(html, uvIndex, label) {
  const uvInfo = getUVLevel(uvIndex);
  const levelText = t(uvInfo.translationKey) || uvInfo.level;
  const needsProtection = uvIndex > 2;

  return html`
    <div class="forecast-uv-row">
      <span class="forecast-uv-icon">☀️</span>
      <span class="forecast-uv-text">${label}</span>
      <span class="forecast-uv-value" style="color: ${uvInfo.color};">${uvIndex.toFixed(1)}</span>
      <span class="forecast-uv-level" style="background: ${uvInfo.color}20; color: ${uvInfo.color};">${levelText}</span>
      ${needsProtection ? html`<span class="forecast-uv-protection">${t('weather.uv_protection')}</span>` : ''}
    </div>
  `;
}

/**
 * Render the complete weather popup
 * @param {Object} component - DashviewPanel instance
 * @param {Function} html - Lit html template function
 * @returns {TemplateResult} Weather popup template
 */
export function renderWeatherPopup(component, html) {
  if (!component._weatherPopupOpen) return '';

  return html`
    <div class="popup-overlay" @click=${component._handleWeatherPopupOverlayClick}>
      <div class="popup-container">
        ${renderPopupHeader(html, {
          icon: 'mdi:white-balance-sunny',
          title: t('ui.tabs.weather'),
          onClose: component._closeWeatherPopup,
          iconStyle: 'background: var(--primary-color);'
        })}

        <div class="popup-content">
          ${renderCurrentWeather(component, html)}
          ${renderHourlyForecast(component, html)}
          ${renderForecastTabs(component, html)}
          ${renderForecastCard(component, html)}
          ${renderPollenForecast(component, html)}
          ${renderWeatherRadar(component, html)}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render current weather card
 */
function renderCurrentWeather(component, html) {
  const currentWeather = component._getCurrentWeatherData();
  if (!currentWeather) return '';

  const precipitation = component._getPrecipitation();
  const condition = currentWeather.condition || 'partlycloudy';
  const conditionText = component._translateWeatherCondition(condition);
  const precipText = precipitation > 0 ? ` – ${t('weather.precipitation')} ${precipitation.toFixed(1)} mm` : '';

  // Get UV index from weather entity attributes
  const uvIndex = getUVIndexFromEntity(component);
  const hasUV = uvIndex !== null && !isNaN(uvIndex);

  return html`
    <div class="weather-current-card ${hasUV ? 'has-uv' : ''}">
      <div class="weather-current-title">${t('weather.current')}</div>
      <div class="weather-current-temp">${currentWeather.temperature !== null ? currentWeather.temperature.toFixed(1) : '--'}°C</div>
      <div class="weather-current-condition">${conditionText}${precipText}</div>
      <div class="weather-current-icon">
        <img src="${getWeatherIconUrl(condition)}" alt="${condition}" onerror="this.style.display='none'">
      </div>
      ${hasUV ? html`<div class="weather-current-uv">${renderUVRow(html, uvIndex, t('weather.uv_index'))}</div>` : ''}
    </div>
  `;
}

/**
 * Render hourly forecast scroll
 */
function renderHourlyForecast(component, html) {
  const hourlyForecast = component._getHourlyForecast();

  if (hourlyForecast.length === 0) {
    return html`
      <p style="color: var(--secondary-text-color); padding: 16px; text-align: center;">
        ${t('weather.loading_forecast')}
      </p>
    `;
  }

  return html`
    <div class="weather-hourly-scroll">
      <div class="weather-hourly-container">
        ${hourlyForecast.slice(0, 10).map(forecast => {
          const dt = new Date(forecast.datetime);
          const time = dt.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', hour12: false });
          const condition = forecast.condition || 'partlycloudy';
          const temp = forecast.temperature !== undefined ? `${Math.round(forecast.temperature)}°C` : '—';
          const wind = forecast.wind_speed !== undefined ? `${Math.round(forecast.wind_speed)} km/h` : '';
          const rain = forecast.precipitation !== undefined && forecast.precipitation > 0 ? `${forecast.precipitation.toFixed(1)} mm` : '';

          const hasHourlyUV = forecast.uv_index !== undefined && forecast.uv_index !== null;
          const hourlyUVInfo = hasHourlyUV ? getUVLevel(forecast.uv_index) : null;

          return html`
            <div class="weather-hourly-item">
              <div class="weather-hourly-time">${time}</div>
              <div class="weather-hourly-icon">
                <img src="${getWeatherIconUrl(condition)}" alt="${condition}" onerror="this.style.display='none'">
              </div>
              <div class="weather-hourly-temp">${temp}</div>
              ${wind ? html`<div class="weather-hourly-wind">${wind}</div>` : ''}
              ${rain ? html`<div class="weather-hourly-rain">${rain}</div>` : ''}
              ${hasHourlyUV ? html`<div class="weather-hourly-uv" style="background: ${hourlyUVInfo.color}20; color: ${hourlyUVInfo.color};">UV ${Math.round(forecast.uv_index)}</div>` : ''}
            </div>
          `;
        })}
      </div>
    </div>
  `;
}

/**
 * Render forecast tabs (Today, Tomorrow, Day After)
 */
function renderForecastTabs(component, html) {
  return html`
    <div class="weather-forecast-tabs">
      <button class="weather-forecast-tab ${component._selectedForecastTab === 0 ? 'active' : ''}"
              @click=${() => { component._selectedForecastTab = 0; component.requestUpdate(); }}>${t('weather.today')}</button>
      <button class="weather-forecast-tab ${component._selectedForecastTab === 1 ? 'active' : ''}"
              @click=${() => { component._selectedForecastTab = 1; component.requestUpdate(); }}>${t('weather.tomorrow')}</button>
      <button class="weather-forecast-tab ${component._selectedForecastTab === 2 ? 'active' : ''}"
              @click=${() => { component._selectedForecastTab = 2; component.requestUpdate(); }}>${t('weather.day_after')}</button>
    </div>
  `;
}

/**
 * Render forecast card for selected day
 */
function renderForecastCard(component, html) {
  const types = ['today', 'tomorrow', 'day2'];
  const titles = [t('weather.today'), t('weather.tomorrow'), t('weather.day_after')];
  const forecast = component._getForecastData(types[component._selectedForecastTab]);

  if (!forecast) {
    return html`
      <div class="weather-forecast-card">
        <div class="weather-forecast-title">${titles[component._selectedForecastTab]}</div>
        <div class="weather-forecast-temp">--°C</div>
        <div class="weather-forecast-condition">${t('ui.errors.no_data')}</div>
      </div>
    `;
  }

  const condition = forecast.condition || 'partlycloudy';
  const conditionText = component._translateWeatherCondition(condition);

  // Build temperature display
  let tempDisplay = '--';
  if (forecast.tempHigh !== undefined && forecast.tempLow !== undefined) {
    tempDisplay = `${Math.round(forecast.tempHigh)}°`;
  } else if (forecast.temperature !== null && forecast.temperature !== undefined) {
    tempDisplay = `${Math.round(forecast.temperature)}°`;
  }

  // Build condition subtitle with high/low
  let conditionSubtitle = conditionText;
  if (forecast.tempHigh !== undefined && forecast.tempLow !== undefined) {
    conditionSubtitle = `${conditionText} – H: ${Math.round(forecast.tempHigh)}° L: ${Math.round(forecast.tempLow)}°`;
  }
  if (forecast.precipitation_probability !== undefined && forecast.precipitation_probability > 0) {
    conditionSubtitle += ` – ${Math.round(forecast.precipitation_probability)}% ${t('weather.rain')}`;
  }

  // Check for UV index in forecast data
  const forecastUV = forecast.uv_index !== undefined && forecast.uv_index !== null ? parseFloat(forecast.uv_index) : null;
  const hasForecastUV = forecastUV !== null && !isNaN(forecastUV);

  return html`
    <div class="weather-forecast-card ${hasForecastUV ? 'has-uv' : ''}">
      <div class="weather-forecast-title">${titles[component._selectedForecastTab]}</div>
      <div class="weather-forecast-temp">${tempDisplay}C</div>
      <div class="weather-forecast-condition">${conditionSubtitle}</div>
      <div class="weather-forecast-icon">
        <img src="${getWeatherIconUrl(condition)}" alt="${condition}" onerror="this.style.display='none'">
      </div>
      ${hasForecastUV ? html`<div class="weather-forecast-uv">${renderUVRow(html, forecastUV, t('weather.uv_peak'))}</div>` : ''}
    </div>
  `;
}

/**
 * Render weather radar iframe
 * Uses configurable settings for location, zoom, and units
 */
function renderWeatherRadar(component, html) {
  // Get radar settings from component (with fallbacks)
  const lat = component._weatherRadarLat ?? 50.0;
  const lon = component._weatherRadarLon ?? 8.7;
  const zoom = component._weatherRadarZoom ?? 9;
  const tempUnit = component._weatherRadarTempUnit || "°C";
  const windUnit = component._weatherRadarWindUnit || "km/h";

  // Build the Windy embed URL with configured settings
  const windyUrl = `https://embed.windy.com/embed2.html?lat=${lat.toFixed(3)}&lon=${lon.toFixed(3)}&zoom=${zoom}&level=surface&overlay=rain&product=radar&menu=&message=&marker=&calendar=now&pressure=&type=map&location=coordinates&detail=&metricWind=${windUnit}&metricTemp=${tempUnit}&radarRange=-1`;

  return html`
    <div class="weather-radar-card">
      <div class="weather-radar-title">${t('weather.rain_radar')}</div>
      <iframe
        class="weather-radar-iframe"
        src="${windyUrl}"
        frameborder="0">
      </iframe>
    </div>
  `;
}

/**
 * Render pollen forecast section
 * Shows enabled pollen types with current level, trend, and tomorrow's forecast
 * @param {Object} component - DashviewPanel instance
 * @param {Function} html - Lit html template function
 * @returns {TemplateResult} Pollen forecast template
 */
function renderPollenForecast(component, html) {
  // Get pollen config from component
  const pollenConfig = component._pollenConfig || { enabled: true, enabledSensors: {}, displayMode: 'active' };

  // If pollen is disabled entirely, don't render anything
  if (!pollenConfig.enabled) return '';

  // Detect all pollen sensors
  const allSensors = detectPollenSensors(component.hass);

  // Filter based on enabled sensors (default to all enabled)
  let sensors = allSensors.filter(sensor => {
    const isExplicitlyEnabled = pollenConfig.enabledSensors[sensor.entityId];
    // Default to enabled if not explicitly disabled
    return isExplicitlyEnabled !== false;
  });

  // Apply display mode filtering
  const displayMode = pollenConfig.displayMode || 'active';
  if (displayMode === 'active') {
    // Only show sensors with value > 0
    sensors = sensors.filter(s => s.value > 0);
  } else if (displayMode === 'top3') {
    // Sort by value descending and take top 3
    sensors = [...sensors].sort((a, b) => b.value - a.value).slice(0, 3);
  }
  // 'all' mode shows all enabled sensors

  // Don't render if no sensors to show
  if (sensors.length === 0) return '';

  // Get current language from i18n (respects admin language setting)
  const lang = getCurrentLang();

  return html`
    <div class="pollen-forecast-section">
      <div class="pollen-forecast-title">${t('weather.pollen') || 'Pollen Forecast'}</div>
      <div class="pollen-forecast-scroll">
        <div class="pollen-forecast-container">
          ${sensors.map(sensor => renderPollenItem(html, sensor, lang))}
        </div>
      </div>
    </div>
  `;
}

/**
 * Render a single pollen item
 * @param {Function} html - Lit html template function
 * @param {Object} sensor - Pollen sensor data
 * @param {string} lang - Language code (en/de)
 * @returns {TemplateResult} Pollen item template
 */
function renderPollenItem(html, sensor, lang) {
  const pollenType = POLLEN_TYPES[sensor.type];
  const levelInfo = getPollenLevel(sensor.value);
  const trend = getPollenTrend(sensor.value, sensor.tomorrow);

  // Get translated pollen type name
  const typeName = translatePollenType(sensor.type, lang);

  // Trend icon
  const trendIcon = trend === 'up' ? 'mdi:arrow-up' : trend === 'down' ? 'mdi:arrow-down' : 'mdi:minus';
  const trendColor = trend === 'up' ? 'var(--dv-red)' : trend === 'down' ? 'var(--dv-green)' : 'var(--dv-gray500)';

  return html`
    <div class="pollen-item">
      <div class="pollen-item-name">${typeName}</div>
      <div class="pollen-item-icon" style="color: ${levelInfo.color};">
        <ha-icon icon="${pollenType?.icon || 'mdi:flower'}"></ha-icon>
      </div>
      <div class="pollen-item-level">
        ${renderPollenDots(html, levelInfo.dots, levelInfo.color)}
      </div>
      <div class="pollen-item-trend" style="color: ${trendColor};">
        <ha-icon icon="${trendIcon}" style="--mdc-icon-size: 14px;"></ha-icon>
      </div>
    </div>
  `;
}

/**
 * Render pollen level dots (6 dots)
 * @param {Function} html - Lit html template function
 * @param {number} filled - Number of filled dots (0-6)
 * @param {string} color - Color for filled dots
 * @returns {TemplateResult} Level dots template
 */
function renderPollenDots(html, filled, color) {
  const dots = [];
  for (let i = 0; i < 6; i++) {
    const isFilled = i < filled;
    dots.push(html`<span class="pollen-dot ${isFilled ? 'filled' : ''}" style="${isFilled ? `background: ${color};` : ''}"></span>`);
  }
  return html`<div class="pollen-dots">${dots}</div>`;
}

/**
 * Translate pollen type name
 * Uses POLLEN_TYPES directly to ensure correct language is shown
 * (t() uses pre-loaded translations which may not match current interface language)
 * @param {string} type - Pollen type key (e.g., 'birke', 'graeser')
 * @param {string} lang - Language code (en/de)
 * @returns {string} Translated pollen type name
 */
function translatePollenType(type, lang) {
  // Use POLLEN_TYPES directly to respect current language
  const pollenType = POLLEN_TYPES[type];
  if (pollenType) {
    return lang === 'de' ? pollenType.de : pollenType.en;
  }

  // Last resort: capitalize the type
  return type.charAt(0).toUpperCase() + type.slice(1);
}

export default { renderWeatherPopup };
