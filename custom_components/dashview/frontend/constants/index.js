/**
 * Dashview Constants
 * Centralized constants for entity types, states, icons, and configuration
 */

// Entity domains
export const DOMAINS = {
  LIGHT: 'light',
  COVER: 'cover',
  CLIMATE: 'climate',
  SENSOR: 'sensor',
  BINARY_SENSOR: 'binary_sensor',
  MEDIA_PLAYER: 'media_player',
  WEATHER: 'weather',
  SCENE: 'scene',
  SCRIPT: 'script',
  LOCK: 'lock',
};

// Entity states
export const STATES = {
  ON: 'on',
  OFF: 'off',
  OPEN: 'open',
  CLOSED: 'closed',
  OPENING: 'opening',
  CLOSING: 'closing',
  PLAYING: 'playing',
  PAUSED: 'paused',
  IDLE: 'idle',
  UNAVAILABLE: 'unavailable',
  UNKNOWN: 'unknown',
  HEAT: 'heat',
  COOL: 'cool',
  HEATING: 'heating',
  COOLING: 'cooling',
  LOCKED: 'locked',
  UNLOCKED: 'unlocked',
  LOCKING: 'locking',
  UNLOCKING: 'unlocking',
};

// Binary sensor device classes
export const BINARY_SENSOR_CLASSES = {
  MOTION: 'motion',
  WINDOW: 'window',
  DOOR: 'door',
  SMOKE: 'smoke',
  VIBRATION: 'vibration',
  OCCUPANCY: 'occupancy',
  GARAGE_DOOR: 'garage_door',
  MOISTURE: 'moisture',
};

// Sensor device classes
export const SENSOR_CLASSES = {
  TEMPERATURE: 'temperature',
  HUMIDITY: 'humidity',
  BATTERY: 'battery',
};

// Cover device classes
export const COVER_CLASSES = {
  SHUTTER: 'shutter',
  BLIND: 'blind',
  CURTAIN: 'curtain',
  GARAGE: 'garage',
  WINDOW: 'window',
};

// Icons
export const ICONS = {
  // Lights
  LIGHT_ON: 'mdi:lightbulb-on',
  LIGHT_OFF: 'mdi:lightbulb-outline',
  LIGHT_GROUP: 'mdi:lightbulb-group',
  LED_STRIP: 'mdi:led-strip-variant',

  // Motion
  MOTION_ON: 'mdi:motion-sensor',
  MOTION_OFF: 'mdi:motion-sensor-off',

  // Smoke
  SMOKE_ON: 'mdi:smoke-detector-alert',
  SMOKE_OFF: 'mdi:smoke-detector',

  // Water Leak
  WATER_ALERT: 'mdi:water-alert',
  WATER_CHECK: 'mdi:water-check',

  // Covers
  SHUTTER_OPEN: 'mdi:window-shutter-open',
  SHUTTER_CLOSED: 'mdi:window-shutter',
  BLIND_OPEN: 'mdi:blinds-open',
  BLIND_CLOSED: 'mdi:blinds',

  // Windows
  WINDOW_OPEN: 'mdi:window-open',
  WINDOW_CLOSED: 'mdi:window-closed',
  ROOF_WINDOW_OPEN: 'mdi:window-open-variant',
  ROOF_WINDOW_CLOSED: 'mdi:window-closed-variant',

  // Garage
  GARAGE_OPEN: 'mdi:garage-open',
  GARAGE_CLOSED: 'mdi:garage',

  // Climate
  THERMOSTAT: 'mdi:thermostat',
  THERMOSTAT_OFF: 'mdi:thermostat-off',
  HEATING: 'mdi:fire',
  HEAT_WAVE: 'mdi:heat-wave',
  THERMOMETER: 'mdi:thermometer',
  HUMIDITY: 'mdi:water-percent',

  // Media
  SPEAKER: 'mdi:speaker',
  SPEAKER_PLAY: 'mdi:speaker-play',
  SPEAKER_PAUSE: 'mdi:speaker-pause',
  SPEAKER_OFF: 'mdi:speaker-off',

  // TV
  TV: 'mdi:television',
  TV_ON: 'mdi:television',
  TV_OFF: 'mdi:television-off',

  // Lock
  LOCK_LOCKED: 'mdi:lock',
  LOCK_UNLOCKED: 'mdi:lock-open',
  LOCK_LOCKING: 'mdi:lock-clock',
  LOCK_UNLOCKING: 'mdi:lock-clock',

  // Vibration
  VIBRATE_ON: 'mdi:vibrate',
  VIBRATE_OFF: 'mdi:vibrate-off',

  // Weather
  WEATHER: 'mdi:weather-partly-cloudy',

  // Navigation
  CHEVRON_UP: 'mdi:chevron-up',
  CHEVRON_DOWN: 'mdi:chevron-down',
  CHEVRON_LEFT: 'mdi:chevron-left',
  CHEVRON_RIGHT: 'mdi:chevron-right',
  CLOSE: 'mdi:close',
  PLUS: 'mdi:plus',
  MINUS: 'mdi:minus',

  // Actions
  POWER: 'mdi:power',
  PLAY: 'mdi:play',
  PAUSE: 'mdi:pause',
  STOP: 'mdi:stop',

  // Status
  BATTERY: 'mdi:battery',
  BATTERY_LOW: 'mdi:battery-low',
  BATTERY_CHECK: 'mdi:battery-check',
  ALERT: 'mdi:alert-circle',

  // Misc
  MAGNIFY: 'mdi:magnify',
  TRASH: 'mdi:trash-can',
  FLOOR_PLAN: 'mdi:floor-plan',
  DOOR: 'mdi:door',
  LAYERS: 'mdi:layers',
  SORT: 'mdi:sort',
  CARDS: 'mdi:card-multiple',
  VIEW_GRID: 'mdi:view-grid',
  HELP: 'mdi:help-circle',
  TEXT_BOX: 'mdi:text-box-outline',
  WASHING_MACHINE: 'mdi:washing-machine',
  DISHWASHER: 'mdi:dishwasher',
  DRYER: 'mdi:tumble-dryer',
  ROBOT_VACUUM: 'mdi:robot-vacuum',
};

// Default thresholds and timing constants
export const THRESHOLDS = {
  // Sensor thresholds
  BATTERY_LOW: 20,
  BATTERY_CRITICAL: 10,
  TEMPERATURE_HIGH: 25,
  HUMIDITY_HIGH: 65,
  DEFAULT_TEMP_NOTIFICATION: 23,
  DEFAULT_HUMIDITY_NOTIFICATION: 60,

  // Rate-of-change thresholds (rapid change detection)
  DEFAULT_TEMP_RAPID_CHANGE: 5,            // °C change to trigger alert
  DEFAULT_TEMP_RAPID_CHANGE_WINDOW: 60,    // minutes
  DEFAULT_HUMIDITY_RAPID_CHANGE: 20,       // % change to trigger alert
  DEFAULT_HUMIDITY_RAPID_CHANGE_WINDOW: 30, // minutes

  // Open-too-long thresholds (duration alerts)
  DEFAULT_DOOR_OPEN_TOO_LONG_MINUTES: 30,     // minutes before door alert
  DEFAULT_WINDOW_OPEN_TOO_LONG_MINUTES: 120,  // minutes before window alert
  DEFAULT_GARAGE_OPEN_TOO_LONG_MINUTES: 30,   // minutes before garage alert

  // UI thresholds
  SWIPE_DISTANCE: 50,  // pixels

  // Timing (milliseconds)
  DEBOUNCE_MS: 500,
  TIME_UPDATE_INTERVAL: 1000,
};

// Entity type configurations for admin rendering
export const ENTITY_CONFIGS = {
  lights: {
    icon: ICONS.LIGHT_GROUP,
    title: 'Lights',
    activeLabel: 'on',
    getIcon: (entity) => entity.state === STATES.ON ? ICONS.LIGHT_ON : ICONS.LIGHT_OFF,
    getState: (entity) => entity.state,
    isActive: (entity) => entity.state === STATES.ON,
  },
  motionSensors: {
    icon: ICONS.MOTION_ON,
    title: 'Motion Sensors',
    activeLabel: 'detecting',
    getIcon: (entity) => entity.state === STATES.ON ? ICONS.MOTION_ON : ICONS.MOTION_OFF,
    getState: (entity) => entity.state,
    isActive: (entity) => entity.state === STATES.ON,
  },
  smokeSensors: {
    icon: ICONS.SMOKE_OFF,
    title: 'Smoke Detectors',
    activeLabel: 'detecting',
    getIcon: (entity) => entity.state === STATES.ON ? ICONS.SMOKE_ON : ICONS.SMOKE_OFF,
    getState: (entity) => entity.state,
    isActive: (entity) => entity.state === STATES.ON,
  },
  waterLeakSensors: {
    icon: ICONS.WATER_CHECK,
    title: 'Water Leak Sensors',
    activeLabel: 'wet',
    getIcon: (entity) => entity.state === STATES.ON ? ICONS.WATER_ALERT : ICONS.WATER_CHECK,
    getState: (entity) => entity.state,
    isActive: (entity) => entity.state === STATES.ON,
  },
  covers: {
    icon: ICONS.SHUTTER_CLOSED,
    title: 'Covers / Rollos',
    getIcon: (entity) => entity.state === STATES.OPEN ? ICONS.SHUTTER_OPEN : ICONS.SHUTTER_CLOSED,
    getState: (entity) => entity.position !== undefined ? `${entity.position}%` : entity.state,
    isActive: (entity) => entity.state === STATES.OPEN,
  },
  roofWindows: {
    icon: ICONS.ROOF_WINDOW_OPEN,
    title: 'Dachfenster / Roof Windows',
    getIcon: (entity) => entity.state === STATES.OPEN ? ICONS.ROOF_WINDOW_OPEN : ICONS.ROOF_WINDOW_CLOSED,
    getState: (entity) => entity.position !== undefined ? `${entity.position}%` : entity.state,
    isActive: (entity) => entity.state === STATES.OPEN,
  },
  garages: {
    icon: ICONS.GARAGE_CLOSED,
    title: 'Garages / Garagentore',
    getIcon: (entity) => entity.state === STATES.OPEN ? ICONS.GARAGE_OPEN : ICONS.GARAGE_CLOSED,
    getState: (entity) => entity.state,
    isActive: (entity) => entity.state === STATES.OPEN,
  },
  windows: {
    icon: ICONS.WINDOW_CLOSED,
    title: 'Windows / Fenster',
    getIcon: (entity) => entity.state === STATES.OPEN ? ICONS.WINDOW_OPEN : ICONS.WINDOW_CLOSED,
    getState: (entity) => entity.position !== undefined ? `${entity.position}%` : entity.state,
    isActive: (entity) => entity.state === STATES.OPEN,
  },
  vibrationSensors: {
    icon: ICONS.VIBRATE_ON,
    title: 'Vibration Sensors',
    activeLabel: 'detecting',
    getIcon: (entity) => entity.state === STATES.ON ? ICONS.VIBRATE_ON : ICONS.VIBRATE_OFF,
    getState: (entity) => entity.state,
    isActive: (entity) => entity.state === STATES.ON,
  },
  temperatureSensors: {
    icon: ICONS.THERMOMETER,
    title: 'Temperature Sensors',
    getIcon: () => ICONS.THERMOMETER,
    getState: (entity) => `${entity.state} ${entity.unit || '°C'}`,
    isActive: () => false,
  },
  humiditySensors: {
    icon: ICONS.HUMIDITY,
    title: 'Humidity Sensors',
    getIcon: () => ICONS.HUMIDITY,
    getState: (entity) => `${entity.state} ${entity.unit || '%'}`,
    isActive: () => false,
  },
  climates: {
    icon: ICONS.THERMOSTAT,
    title: 'Thermostats',
    getIcon: (entity) => {
      if (entity.hvacAction === STATES.HEATING) return ICONS.HEATING;
      if (entity.state === STATES.OFF) return ICONS.THERMOSTAT_OFF;
      return ICONS.THERMOSTAT;
    },
    getState: (entity) => {
      let state = entity.currentTemp !== undefined ? `${entity.currentTemp}°C` : entity.state;
      if (entity.targetTemp !== undefined) state += ` → ${entity.targetTemp}°C`;
      return state;
    },
    isActive: (entity) => entity.hvacAction === STATES.HEATING,
  },
  mediaPlayers: {
    icon: ICONS.SPEAKER,
    title: 'Media Players',
    activeLabel: 'playing',
    getIcon: (entity) => {
      if (entity.state === STATES.PLAYING) return ICONS.SPEAKER_PLAY;
      if (entity.state === STATES.PAUSED) return ICONS.SPEAKER_PAUSE;
      return ICONS.SPEAKER_OFF;
    },
    getState: (entity) => entity.state,
    isActive: (entity) => entity.state === STATES.PLAYING,
  },
  tvs: {
    icon: ICONS.TV,
    title: 'TVs / Fernseher',
    activeLabel: 'on',
    getIcon: (entity) => entity.state === STATES.ON ? ICONS.TV_ON : ICONS.TV_OFF,
    getState: (entity) => entity.source || entity.state,
    isActive: (entity) => entity.state === STATES.ON,
  },
  locks: {
    icon: ICONS.LOCK_LOCKED,
    title: 'Locks / Schlösser',
    activeLabel: 'unlocked',
    getIcon: (entity) => {
      if (entity.state === STATES.LOCKED) return ICONS.LOCK_LOCKED;
      if (entity.state === STATES.UNLOCKED) return ICONS.LOCK_UNLOCKED;
      if (entity.state === STATES.LOCKING) return ICONS.LOCK_LOCKING;
      if (entity.state === STATES.UNLOCKING) return ICONS.LOCK_UNLOCKING;
      return ICONS.LOCK_LOCKED;
    },
    getState: (entity) => {
      if (entity.state === STATES.LOCKED) return 'Verriegelt';
      if (entity.state === STATES.UNLOCKED) return 'Entriegelt';
      if (entity.state === STATES.LOCKING) return 'Verriegelt...';
      if (entity.state === STATES.UNLOCKING) return 'Entriegelt...';
      return entity.state;
    },
    isActive: (entity) => entity.state === STATES.UNLOCKED,
  },
};

// Weather condition translations (German)
export const WEATHER_CONDITIONS = {
  'clear-night': 'Klare Nacht',
  'cloudy': 'Bewölkt',
  'exceptional': 'Außergewöhnlich',
  'fog': 'Nebel',
  'hail': 'Hagel',
  'lightning': 'Gewitter',
  'lightning-rainy': 'Gewitter mit Regen',
  'partlycloudy': 'Teilweise bewölkt',
  'pouring': 'Starkregen',
  'rainy': 'Regnerisch',
  'snowy': 'Schnee',
  'snowy-rainy': 'Schneeregen',
  'sunny': 'Sonnig',
  'windy': 'Windig',
  'windy-variant': 'Windig',
};

// Weather icons mapping
export const WEATHER_ICONS = {
  'clear-night': 'mdi:weather-night',
  'cloudy': 'mdi:weather-cloudy',
  'exceptional': 'mdi:alert-circle-outline',
  'fog': 'mdi:weather-fog',
  'hail': 'mdi:weather-hail',
  'lightning': 'mdi:weather-lightning',
  'lightning-rainy': 'mdi:weather-lightning-rainy',
  'partlycloudy': 'mdi:weather-partly-cloudy',
  'pouring': 'mdi:weather-pouring',
  'rainy': 'mdi:weather-rainy',
  'snowy': 'mdi:weather-snowy',
  'snowy-rainy': 'mdi:weather-snowy-rainy',
  'sunny': 'mdi:weather-sunny',
  'windy': 'mdi:weather-windy',
  'windy-variant': 'mdi:weather-windy-variant',
};

// Floor icons mapping
export const FLOOR_ICONS = {
  'floor-0': 'mdi:home-floor-0',
  'floor-1': 'mdi:home-floor-1',
  'floor-2': 'mdi:home-floor-2',
  'floor-3': 'mdi:home-floor-3',
  'basement': 'mdi:home-floor-b',
  'ground': 'mdi:home-floor-g',
  'attic': 'mdi:home-roof',
  'default': 'mdi:layers',
};

// Room/Area icons mapping
export const AREA_ICONS = {
  'living_room': 'mdi:sofa',
  'bedroom': 'mdi:bed',
  'kitchen': 'mdi:silverware-fork-knife',
  'bathroom': 'mdi:shower',
  'office': 'mdi:desk',
  'garage': 'mdi:garage',
  'garden': 'mdi:flower',
  'balcony': 'mdi:balcony',
  'hallway': 'mdi:door',
  'stairs': 'mdi:stairs',
  'basement': 'mdi:home-floor-b',
  'attic': 'mdi:home-roof',
  'default': 'mdi:door',
};

// Debug configuration
export const DEBUG = {
  ENABLED: false,  // Set to true for development logging
  LOG_SETTINGS: false,
  LOG_REGISTRY: false,
  LOG_WEATHER: false,
};

/**
 * Debug logger - only logs when DEBUG.ENABLED is true
 * @param {string} category - Log category (e.g., 'settings', 'registry')
 * @param {...any} args - Arguments to log
 */
export function debugLog(category, ...args) {
  if (!DEBUG.ENABLED) return;

  const categoryKey = `LOG_${category.toUpperCase()}`;
  if (DEBUG[categoryKey] === false) return;

  console.log(`[Dashview:${category}]`, ...args);
}

// Re-export German text constants
export {
  STATUS_TEXT,
  UI_LABELS,
  ERROR_TEXT,
  TIME_FORMAT,
  DWD_WARNINGS,
  formatCount,
  formatOfTotal,
} from './german-text.js';

// Re-export changelog functions
export {
  CURRENT_VERSION,
  CHANGELOG,
  compareVersions,
  hasNewChanges,
  getNewChanges,
} from './changelog.js';
