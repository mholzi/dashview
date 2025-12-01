/**
 * Weather Feature Module
 * Contains render methods for weather display, forecasts, and warnings
 */

import { getWeatherIcon, translateWeatherCondition } from '../../utils/icons.js';
import { t } from '../../utils/i18n.js';

/**
 * Render weather header summary
 * @param {Object} component - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Weather header HTML
 */
export function renderWeatherHeader(component, html) {
  if (!component.hass || !component._weatherEntity) return '';

  const weather = component.hass.states[component._weatherEntity];
  if (!weather) return '';

  const condition = weather.state;
  const temp = weather.attributes.temperature;
  const icon = getWeatherIcon(condition);
  const conditionText = translateWeatherCondition(condition);

  return html`
    <div class="weather-header" @click=${() => component._openWeatherPopup()}>
      <ha-icon icon="${icon}"></ha-icon>
      <span class="weather-temp">${temp}°</span>
      <span class="weather-condition">${conditionText}</span>
    </div>
  `;
}

/**
 * Render weather popup content with forecast
 * @param {Object} component - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} Weather popup HTML
 */
export function renderWeatherPopup(component, html) {
  if (!component.hass || !component._weatherEntity) {
    return html`
      <div class="weather-popup-empty">
        <ha-icon icon="mdi:weather-cloudy-alert"></ha-icon>
        <p>${t('weather.no_data')}</p>
      </div>
    `;
  }

  const weather = component.hass.states[component._weatherEntity];
  if (!weather) return '';

  const condition = weather.state;
  const temp = weather.attributes.temperature;
  const humidity = weather.attributes.humidity;
  const pressure = weather.attributes.pressure;
  const windSpeed = weather.attributes.wind_speed;
  const icon = getWeatherIcon(condition);
  const conditionText = translateWeatherCondition(condition);

  return html`
    <div class="weather-popup-content">
      <!-- Current Weather -->
      <div class="weather-current">
        <div class="weather-current-icon">
          <ha-icon icon="${icon}"></ha-icon>
        </div>
        <div class="weather-current-info">
          <div class="weather-current-temp">${temp}°C</div>
          <div class="weather-current-condition">${conditionText}</div>
        </div>
      </div>

      <!-- Weather Details -->
      <div class="weather-details">
        ${humidity !== undefined ? html`
          <div class="weather-detail">
            <ha-icon icon="mdi:water-percent"></ha-icon>
            <span>${humidity}%</span>
          </div>
        ` : ''}
        ${pressure !== undefined ? html`
          <div class="weather-detail">
            <ha-icon icon="mdi:gauge"></ha-icon>
            <span>${pressure} hPa</span>
          </div>
        ` : ''}
        ${windSpeed !== undefined ? html`
          <div class="weather-detail">
            <ha-icon icon="mdi:weather-windy"></ha-icon>
            <span>${windSpeed} km/h</span>
          </div>
        ` : ''}
      </div>

      <!-- Hourly Forecast -->
      ${component._weatherHourlyForecasts?.length > 0 ? html`
        <div class="weather-forecast-section">
          <h3 class="weather-forecast-title">${t('weather.hourly_forecast')}</h3>
          <div class="weather-hourly-scroll">
            ${component._weatherHourlyForecasts.slice(0, 12).map(forecast => {
              const time = new Date(forecast.datetime);
              const hour = time.getHours();
              return html`
                <div class="weather-hourly-item">
                  <div class="weather-hourly-time">${hour}:00</div>
                  <ha-icon icon="${getWeatherIcon(forecast.condition)}"></ha-icon>
                  <div class="weather-hourly-temp">${Math.round(forecast.temperature)}°</div>
                </div>
              `;
            })}
          </div>
        </div>
      ` : ''}

      <!-- Daily Forecast -->
      ${component._weatherForecasts?.length > 0 ? html`
        <div class="weather-forecast-section">
          <h3 class="weather-forecast-title">${t('weather.daily_forecast')}</h3>
          <div class="weather-daily-list">
            ${component._weatherForecasts.slice(0, 7).map(forecast => {
              const date = new Date(forecast.datetime);
              const dayName = date.toLocaleDateString('de-DE', { weekday: 'short' });
              return html`
                <div class="weather-daily-item">
                  <div class="weather-daily-day">${dayName}</div>
                  <ha-icon icon="${getWeatherIcon(forecast.condition)}"></ha-icon>
                  <div class="weather-daily-temps">
                    <span class="weather-daily-high">${Math.round(forecast.temperature)}°</span>
                    ${forecast.templow !== undefined ? html`
                      <span class="weather-daily-low">${Math.round(forecast.templow)}°</span>
                    ` : ''}
                  </div>
                </div>
              `;
            })}
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

/**
 * Render DWD weather warnings
 * @param {Object} component - The DashviewPanel instance
 * @param {Function} html - lit-html template function
 * @returns {TemplateResult} DWD warnings HTML
 */
export function renderDwdWarnings(component, html) {
  const warnings = component._getDwdWarnings();
  if (!warnings || warnings.length === 0) return '';

  // Get the highest warning level for the card styling
  const maxLevel = Math.max(...warnings.map(w => w.level));
  const maxLevelIcon = warnings.find(w => w.level === maxLevel)?.icon || 'mdi:alert';

  // Combine all warning texts
  const combinedWarnings = warnings.map(warning =>
    `${warning.levelLabel} ${warning.name}${warning.endLabel ? ` (${warning.endLabel})` : ''}`
  ).join(' • ');

  return html`
    <div class="dwd-warnings">
      <div class="dwd-warning level-${maxLevel}">
        <div class="dwd-warning-icon">
          <ha-icon icon="${maxLevelIcon}"></ha-icon>
        </div>
        <div class="dwd-warning-content">
          <div class="dwd-warning-title">${combinedWarnings}</div>
        </div>
      </div>
    </div>
  `;
}

// Re-export utilities for convenience
export { getWeatherIcon, translateWeatherCondition };
