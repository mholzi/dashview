/**
 * Weather Service
 * Provides methods for getting weather data, forecasts, and translations
 */

import { WEATHER_CONDITIONS, WEATHER_ICONS as IMPORTED_WEATHER_ICONS } from '../constants/index.js';
import { t } from '../utils/i18n.js';

// Use centralized constants - WEATHER_CONDITIONS maps to German translations
export const WEATHER_TRANSLATIONS = WEATHER_CONDITIONS;

// Re-export WEATHER_ICONS for consumers
export const WEATHER_ICONS = IMPORTED_WEATHER_ICONS;

/**
 * DWD warning level labels
 * Now uses i18n translation system
 */
export const DWD_WARNING_LABELS = {
  0: () => t('weather.warnings.information'),
  1: () => t('weather.warnings.warning'),
  2: () => t('weather.warnings.warning_marked'),
  3: () => t('weather.warnings.severe_warning'),
  4: () => t('weather.warnings.extreme_warning'),
};

/**
 * DWD warning icons
 */
export const DWD_WARNING_ICONS = {
  0: 'mdi:information',
  1: 'mdi:alert',
  2: 'mdi:alert',
  3: 'mdi:alert-octagon',
  4: 'mdi:alert-decagram',
};

/**
 * Get weather entity data
 * @param {Object} hass - Home Assistant instance
 * @param {string} weatherEntity - Configured weather entity ID
 * @returns {Object|null} Weather data object or null
 */
export function getWeather(hass, weatherEntity) {
  if (!hass) return null;

  // First try the configured entity
  if (weatherEntity) {
    const configuredEntity = hass.states[weatherEntity];
    if (configuredEntity) {
      return {
        entityId: weatherEntity,
        state: configuredEntity.state,
        temperature: configuredEntity.attributes.temperature,
        unit: configuredEntity.attributes.temperature_unit || "°C",
        forecast: configuredEntity.attributes.forecast || [],
      };
    }
  }

  // Fallback to common entity names
  const weatherEntities = [
    "weather.forecast_home",
    "weather.home",
    "weather.openweathermap",
    "weather.forecast",
  ];

  for (const entityId of weatherEntities) {
    const entity = hass.states[entityId];
    if (entity) {
      return {
        entityId: entityId,
        state: entity.state,
        temperature: entity.attributes.temperature,
        unit: entity.attributes.temperature_unit || "°C",
        forecast: entity.attributes.forecast || [],
      };
    }
  }

  // Try any weather entity
  const anyWeather = Object.values(hass.states).find((e) =>
    e.entity_id.startsWith("weather.")
  );
  if (anyWeather) {
    return {
      entityId: anyWeather.entity_id,
      state: anyWeather.state,
      temperature: anyWeather.attributes.temperature,
      unit: anyWeather.attributes.temperature_unit || "°C",
      forecast: anyWeather.attributes.forecast || [],
    };
  }

  return null;
}

/**
 * Translate weather condition using i18n
 * @param {string} state - Weather condition state
 * @returns {string} Translated condition
 */
export function translateWeatherCondition(state) {
  return t(`weather.conditions.${state}`, state);
}

/**
 * Get weather icon for condition
 * @param {string} state - Weather condition state
 * @returns {string} MDI icon name
 */
export function getWeatherIcon(state) {
  return WEATHER_ICONS[state] || "mdi:weather-partly-cloudy";
}

/**
 * Get current weather data from configured sensors
 * @param {Object} hass - Home Assistant instance
 * @param {string} tempEntity - Temperature sensor entity ID
 * @param {string} conditionEntity - Condition sensor entity ID
 * @param {string} weatherEntity - Fallback weather entity ID
 * @returns {Object|null} Current weather data
 */
export function getCurrentWeatherData(hass, tempEntity, conditionEntity, weatherEntity) {
  if (!hass) return null;

  // Try configured current weather entities first
  const tempState = tempEntity && hass.states[tempEntity];
  const conditionState = conditionEntity && hass.states[conditionEntity];

  if (tempState || conditionState) {
    return {
      temperature: tempState ? parseFloat(tempState.state) : null,
      condition: conditionState ? conditionState.state : null,
    };
  }

  // Fallback to main weather entity
  const weather = getWeather(hass, weatherEntity);
  if (weather) {
    return {
      temperature: weather.temperature,
      condition: weather.state,
    };
  }

  return null;
}

/**
 * Get hourly forecast data
 * @param {Object} hass - Home Assistant instance
 * @param {Array} hourlyForecasts - Fetched hourly forecasts array
 * @param {string} weatherEntity - Fallback weather entity ID
 * @returns {Array} Hourly forecast array
 */
export function getHourlyForecast(hass, hourlyForecasts, weatherEntity) {
  if (!hass) return [];

  // Use fetched hourly forecasts
  if (hourlyForecasts && hourlyForecasts.length > 0) {
    return hourlyForecasts.slice(0, 12);
  }

  // Fallback to main weather entity forecast attributes (older integrations)
  const weather = getWeather(hass, weatherEntity);
  if (weather && weather.forecast) {
    return weather.forecast.slice(0, 12);
  }

  return [];
}

/**
 * Get forecast data for a specific day
 * @param {Object} hass - Home Assistant instance
 * @param {string} type - Forecast type ('today', 'tomorrow', 'day2')
 * @param {Array} forecasts - Fetched daily forecasts array
 * @param {string} weatherEntity - Fallback weather entity ID
 * @returns {Object|null} Forecast data for the day
 */
export function getForecastData(hass, type, forecasts, weatherEntity) {
  if (!hass) return null;

  // Use forecasts fetched via service call
  if (forecasts && forecasts.length > 0) {
    const index = type === 'today' ? 0 : (type === 'tomorrow' ? 1 : 2);
    const forecast = forecasts[index];
    if (forecast) {
      // Handle both temperature formats (some have templow/temperature, some have temp)
      const temp = forecast.temperature !== undefined ? forecast.temperature :
                   (forecast.templow !== undefined && forecast.temphigh !== undefined ?
                    (forecast.templow + forecast.temphigh) / 2 : null);
      return {
        temperature: temp,
        tempHigh: forecast.temphigh || forecast.temperature,
        tempLow: forecast.templow,
        condition: forecast.condition,
        precipitation: forecast.precipitation,
        precipitation_probability: forecast.precipitation_probability,
        wind_speed: forecast.wind_speed,
        datetime: forecast.datetime,
      };
    }
  }

  // Fallback to main weather entity attributes (older integrations)
  const weather = getWeather(hass, weatherEntity);
  if (weather && weather.forecast && weather.forecast.length > 0) {
    const index = type === 'today' ? 0 : (type === 'tomorrow' ? 1 : 2);
    const forecast = weather.forecast[index];
    if (forecast) {
      return {
        temperature: forecast.temperature,
        tempHigh: forecast.temphigh || forecast.temperature,
        tempLow: forecast.templow,
        condition: forecast.condition,
        precipitation: forecast.precipitation,
        precipitation_probability: forecast.precipitation_probability,
        wind_speed: forecast.wind_speed,
        datetime: forecast.datetime,
      };
    }
  }

  return null;
}

/**
 * Get precipitation value from sensor
 * @param {Object} hass - Home Assistant instance
 * @param {string} precipitationEntity - Precipitation sensor entity ID
 * @returns {number} Precipitation value
 */
export function getPrecipitation(hass, precipitationEntity) {
  if (!hass || !precipitationEntity) return 0;

  const entity = hass.states[precipitationEntity];
  if (entity) {
    return parseFloat(entity.state) || 0;
  }
  return 0;
}

/**
 * Get DWD weather warnings
 * @param {Object} hass - Home Assistant instance
 * @param {string} dwdWarningEntity - DWD warning sensor entity ID
 * @returns {Array} Array of warning objects
 */
export function getDwdWarnings(hass, dwdWarningEntity) {
  if (!hass || !dwdWarningEntity) return [];

  const entity = hass.states[dwdWarningEntity];
  if (!entity) return [];

  const warningLevel = parseInt(entity.state);
  if (isNaN(warningLevel) || warningLevel === 0) return [];

  const warningCount = entity.attributes?.warning_count || 0;
  if (warningCount === 0) return [];

  const warnings = [];

  for (let i = 1; i <= Math.min(warningCount, 3); i++) {
    const level = entity.attributes?.[`warning_${i}_level`];
    const name = entity.attributes?.[`warning_${i}_name`];
    const endTime = entity.attributes?.[`warning_${i}_end`];

    if (level !== undefined && name) {
      // Calculate time until end
      let endLabel = '';
      if (endTime) {
        const endDate = new Date(endTime);
        const now = new Date();
        const diffDays = Math.floor((endDate - now) / (1000 * 60 * 60 * 24));
        const endTimeStr = endDate.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

        if (diffDays === 0) {
          endLabel = t('common.time.until_time', { time: endTimeStr });
        } else if (diffDays === 1) {
          endLabel = t('common.time.until_tomorrow', { time: endTimeStr });
        } else {
          const endDateStr = endDate.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
          endLabel = t('common.time.until_date', { date: endDateStr, time: endTimeStr });
        }
      }

      const labelGetter = DWD_WARNING_LABELS[level] || DWD_WARNING_LABELS[1];
      warnings.push({
        level: level,
        levelLabel: labelGetter(),
        name: name,
        endTime: endTime,
        endLabel: endLabel,
        icon: DWD_WARNING_ICONS[level] || 'mdi:alert',
      });
    }
  }

  return warnings;
}

/**
 * Get person data (first person entity found)
 * @param {Object} hass - Home Assistant instance
 * @returns {Object|null} Person data or null
 */
export function getPerson(hass) {
  if (!hass) return null;

  const person = Object.values(hass.states).find((e) =>
    e.entity_id.startsWith("person.")
  );

  if (person) {
    return {
      name: person.attributes.friendly_name || person.entity_id,
      state: person.state,
      picture: person.attributes.entity_picture,
    };
  }
  return null;
}

export default {
  getWeather,
  translateWeatherCondition,
  getWeatherIcon,
  getCurrentWeatherData,
  getHourlyForecast,
  getForecastData,
  getPrecipitation,
  getDwdWarnings,
  getPerson,
  WEATHER_TRANSLATIONS,
  WEATHER_ICONS,
  DWD_WARNING_LABELS,
  DWD_WARNING_ICONS,
};
