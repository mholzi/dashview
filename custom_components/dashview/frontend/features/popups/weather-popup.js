/**
 * Weather Popup Module
 * Renders the weather detail popup with current conditions, hourly forecast, and daily forecast
 */

import { renderPopupHeader } from '../../components/layout/index.js';
import { t } from '../../utils/i18n.js';
import { getWeatherIconUrl } from '../../assets/weather-icons.js';

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

  return html`
    <div class="weather-current-card">
      <div class="weather-current-title">${t('weather.current')}</div>
      <div class="weather-current-temp">${currentWeather.temperature !== null ? currentWeather.temperature.toFixed(1) : '--'}°C</div>
      <div class="weather-current-condition">${conditionText}${precipText}</div>
      <div class="weather-current-icon">
        <img src="${getWeatherIconUrl(condition)}" alt="${condition}" onerror="this.style.display='none'">
      </div>
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

          return html`
            <div class="weather-hourly-item">
              <div class="weather-hourly-time">${time}</div>
              <div class="weather-hourly-icon">
                <img src="${getWeatherIconUrl(condition)}" alt="${condition}" onerror="this.style.display='none'">
              </div>
              <div class="weather-hourly-temp">${temp}</div>
              ${wind ? html`<div class="weather-hourly-wind">${wind}</div>` : ''}
              ${rain ? html`<div class="weather-hourly-rain">${rain}</div>` : ''}
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

  return html`
    <div class="weather-forecast-card">
      <div class="weather-forecast-title">${titles[component._selectedForecastTab]}</div>
      <div class="weather-forecast-temp">${tempDisplay}C</div>
      <div class="weather-forecast-condition">${conditionSubtitle}</div>
      <div class="weather-forecast-icon">
        <img src="${getWeatherIconUrl(condition)}" alt="${condition}" onerror="this.style.display='none'">
      </div>
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

export default { renderWeatherPopup };
