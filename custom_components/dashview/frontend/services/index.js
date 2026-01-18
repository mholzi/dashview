/**
 * Services Index
 * Central export point for all service modules
 *
 * Services provide business logic and data processing,
 * separated from UI rendering concerns.
 *
 * Available Services:
 * - EntityDisplayService: Get display info (icons, labels, states) for entities
 * - RoomDataService: Get aggregated room data (motion, lights, temperature)
 */

// Entity Display Service
export {
  EntityDisplayService,
  getEntityDisplayService,
  getMotionDisplayInfo,
  getWindowDisplayInfo,
  getGarageDisplayInfo,
  getVibrationDisplayInfo,
  getSmokeDisplayInfo,
  getTemperatureDisplayInfo,
  getHumidityDisplayInfo,
  getLightDisplayInfo,
  getCoverDisplayInfo,
  getClimateDisplayInfo,
  getBinarySensorDisplayInfo,
  getSensorDisplayInfo,
  getDefaultDisplayInfo,
  SENSOR_ICONS,
  BINARY_SENSOR_ICONS,
  BINARY_SENSOR_LABELS,
} from './entity-display-service.js';

// Room Data Service
export {
  RoomDataService,
  getRoomDataService,
} from './room-data-service.js';

// Status Service
export {
  getWasherStatus,
  getMotionStatus,
  getGarageStatus,
  getWindowsStatus,
  getLightsOnStatus,
  getCoversStatus,
  getTVsStatus,
  getDishwasherStatus,
  getDryerStatus,
  getVacuumStatus,
  getBatteryLowStatus,
  getAllStatusItems,
} from './status-service.js';

// Weather Service
export {
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
} from './weather-service.js';

// Error Mapper Service
export {
  ERROR_TYPES,
  detectErrorType,
  mapError,
  getErrorDetails,
  isRecoverableError,
} from './error-mapper.js';
