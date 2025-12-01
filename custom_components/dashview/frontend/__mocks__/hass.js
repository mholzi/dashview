import { vi } from 'vitest';

// Import fixtures
import areasFixture from '../__fixtures__/areas.json';
import entitiesFixture from '../__fixtures__/entities.json';
import devicesFixture from '../__fixtures__/devices.json';
import labelsFixture from '../__fixtures__/labels.json';
import settingsFixture from '../__fixtures__/settings.json';

/**
 * Default entity states for testing
 * Includes common entity types: light, sensor, binary_sensor, cover, climate, media_player
 */
const DEFAULT_STATES = {
  // Lights
  'light.wohnzimmer_decke': {
    entity_id: 'light.wohnzimmer_decke',
    state: 'on',
    attributes: {
      friendly_name: 'Wohnzimmer Deckenlampe',
      brightness: 200,
      color_temp: 370,
      supported_color_modes: ['color_temp', 'hs'],
      color_mode: 'color_temp'
    },
    last_changed: '2025-12-01T10:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'light.wohnzimmer_stehlampe': {
    entity_id: 'light.wohnzimmer_stehlampe',
    state: 'off',
    attributes: {
      friendly_name: 'Wohnzimmer Stehlampe',
      supported_color_modes: ['brightness'],
      color_mode: 'brightness'
    },
    last_changed: '2025-12-01T09:30:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'light.kueche_spots': {
    entity_id: 'light.kueche_spots',
    state: 'on',
    attributes: {
      friendly_name: 'Küche Spots',
      brightness: 255,
      supported_color_modes: ['brightness'],
      color_mode: 'brightness'
    },
    last_changed: '2025-12-01T08:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'light.schlafzimmer_decke': {
    entity_id: 'light.schlafzimmer_decke',
    state: 'off',
    attributes: {
      friendly_name: 'Schlafzimmer Deckenlampe',
      supported_color_modes: ['color_temp'],
      color_mode: 'color_temp'
    },
    last_changed: '2025-12-01T07:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'light.kinderzimmer_decke': {
    entity_id: 'light.kinderzimmer_decke',
    state: 'on',
    attributes: {
      friendly_name: 'Kinderzimmer Deckenlampe',
      brightness: 150,
      hs_color: [120, 100],
      supported_color_modes: ['hs'],
      color_mode: 'hs'
    },
    last_changed: '2025-12-01T10:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'light.arbeitszimmer_schreibtisch': {
    entity_id: 'light.arbeitszimmer_schreibtisch',
    state: 'on',
    attributes: {
      friendly_name: 'Arbeitszimmer Schreibtischlampe',
      brightness: 220,
      supported_color_modes: ['brightness'],
      color_mode: 'brightness'
    },
    last_changed: '2025-12-01T09:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'light.no_area_light': {
    entity_id: 'light.no_area_light',
    state: 'off',
    attributes: {
      friendly_name: 'Light Without Area',
      supported_color_modes: ['onoff']
    },
    last_changed: '2025-12-01T08:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Temperature Sensors
  'sensor.wohnzimmer_temperatur': {
    entity_id: 'sensor.wohnzimmer_temperatur',
    state: '21.5',
    attributes: {
      friendly_name: 'Wohnzimmer Temperatur',
      unit_of_measurement: '°C',
      device_class: 'temperature',
      state_class: 'measurement'
    },
    last_changed: '2025-12-01T10:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'sensor.kueche_temperatur': {
    entity_id: 'sensor.kueche_temperatur',
    state: '22.1',
    attributes: {
      friendly_name: 'Küche Temperatur',
      unit_of_measurement: '°C',
      device_class: 'temperature',
      state_class: 'measurement'
    },
    last_changed: '2025-12-01T09:55:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'sensor.schlafzimmer_temperatur': {
    entity_id: 'sensor.schlafzimmer_temperatur',
    state: '19.8',
    attributes: {
      friendly_name: 'Schlafzimmer Temperatur',
      unit_of_measurement: '°C',
      device_class: 'temperature',
      state_class: 'measurement'
    },
    last_changed: '2025-12-01T09:58:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Humidity Sensors
  'sensor.wohnzimmer_luftfeuchtigkeit': {
    entity_id: 'sensor.wohnzimmer_luftfeuchtigkeit',
    state: '45',
    attributes: {
      friendly_name: 'Wohnzimmer Luftfeuchtigkeit',
      unit_of_measurement: '%',
      device_class: 'humidity',
      state_class: 'measurement'
    },
    last_changed: '2025-12-01T10:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'sensor.bad_luftfeuchtigkeit': {
    entity_id: 'sensor.bad_luftfeuchtigkeit',
    state: '68',
    attributes: {
      friendly_name: 'Bad Luftfeuchtigkeit',
      unit_of_measurement: '%',
      device_class: 'humidity',
      state_class: 'measurement'
    },
    last_changed: '2025-12-01T09:50:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Binary Sensors - Motion
  'binary_sensor.wohnzimmer_bewegung': {
    entity_id: 'binary_sensor.wohnzimmer_bewegung',
    state: 'off',
    attributes: {
      friendly_name: 'Wohnzimmer Bewegungsmelder',
      device_class: 'motion'
    },
    last_changed: '2025-12-01T09:30:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'binary_sensor.flur_eg_bewegung': {
    entity_id: 'binary_sensor.flur_eg_bewegung',
    state: 'on',
    attributes: {
      friendly_name: 'Flur EG Bewegungsmelder',
      device_class: 'motion'
    },
    last_changed: '2025-12-01T09:59:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Binary Sensors - Window/Door
  'binary_sensor.wohnzimmer_fenster': {
    entity_id: 'binary_sensor.wohnzimmer_fenster',
    state: 'off',
    attributes: {
      friendly_name: 'Wohnzimmer Fenster',
      device_class: 'window'
    },
    last_changed: '2025-12-01T08:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'binary_sensor.schlafzimmer_fenster': {
    entity_id: 'binary_sensor.schlafzimmer_fenster',
    state: 'on',
    attributes: {
      friendly_name: 'Schlafzimmer Fenster',
      device_class: 'window'
    },
    last_changed: '2025-12-01T09:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'binary_sensor.haustuer': {
    entity_id: 'binary_sensor.haustuer',
    state: 'off',
    attributes: {
      friendly_name: 'Haustür',
      device_class: 'door'
    },
    last_changed: '2025-12-01T08:30:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Covers
  'cover.wohnzimmer_rollladen': {
    entity_id: 'cover.wohnzimmer_rollladen',
    state: 'open',
    attributes: {
      friendly_name: 'Wohnzimmer Rollladen',
      current_position: 100,
      device_class: 'shutter',
      supported_features: 15 // OPEN | CLOSE | STOP | SET_POSITION
    },
    last_changed: '2025-12-01T08:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'cover.schlafzimmer_rollladen': {
    entity_id: 'cover.schlafzimmer_rollladen',
    state: 'closed',
    attributes: {
      friendly_name: 'Schlafzimmer Rollladen',
      current_position: 0,
      device_class: 'shutter',
      supported_features: 15
    },
    last_changed: '2025-12-01T07:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'cover.kinderzimmer_rollladen': {
    entity_id: 'cover.kinderzimmer_rollladen',
    state: 'open',
    attributes: {
      friendly_name: 'Kinderzimmer Rollladen',
      current_position: 50,
      device_class: 'shutter',
      supported_features: 15
    },
    last_changed: '2025-12-01T08:30:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Climate
  'climate.wohnzimmer': {
    entity_id: 'climate.wohnzimmer',
    state: 'heat',
    attributes: {
      friendly_name: 'Wohnzimmer Heizung',
      current_temperature: 21.5,
      temperature: 22.0,
      min_temp: 5,
      max_temp: 30,
      hvac_modes: ['off', 'heat', 'auto'],
      hvac_mode: 'heat'
    },
    last_changed: '2025-12-01T09:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'climate.schlafzimmer': {
    entity_id: 'climate.schlafzimmer',
    state: 'heat',
    attributes: {
      friendly_name: 'Schlafzimmer Heizung',
      current_temperature: 19.8,
      temperature: 19.0,
      min_temp: 5,
      max_temp: 30,
      hvac_modes: ['off', 'heat', 'auto'],
      hvac_mode: 'heat'
    },
    last_changed: '2025-12-01T08:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Media Player
  'media_player.wohnzimmer_tv': {
    entity_id: 'media_player.wohnzimmer_tv',
    state: 'off',
    attributes: {
      friendly_name: 'Wohnzimmer TV',
      supported_features: 20925, // TURN_ON | TURN_OFF | VOLUME_MUTE | VOLUME_SET | SELECT_SOURCE
      source_list: ['HDMI 1', 'HDMI 2', 'Netflix', 'YouTube']
    },
    last_changed: '2025-12-01T09:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Test entities for edge cases
  'sensor.unavailable_sensor': {
    entity_id: 'sensor.unavailable_sensor',
    state: 'unavailable',
    attributes: {
      friendly_name: 'Unavailable Sensor'
    },
    last_changed: '2025-12-01T08:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },
  'sensor.multi_label_sensor': {
    entity_id: 'sensor.multi_label_sensor',
    state: '25.0',
    attributes: {
      friendly_name: 'Multi-Label Sensor',
      unit_of_measurement: '°C',
      device_class: 'temperature'
    },
    last_changed: '2025-12-01T10:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  },

  // Weather entity
  'weather.home': {
    entity_id: 'weather.home',
    state: 'sunny',
    attributes: {
      friendly_name: 'Home Weather',
      temperature: 18,
      humidity: 65,
      wind_speed: 12,
      forecast: [
        { datetime: '2025-12-01T12:00:00Z', temperature: 20, condition: 'sunny' },
        { datetime: '2025-12-01T18:00:00Z', temperature: 16, condition: 'cloudy' }
      ]
    },
    last_changed: '2025-12-01T10:00:00Z',
    last_updated: '2025-12-01T10:00:00Z'
  }
};

/**
 * Creates a mock Home Assistant instance for testing
 *
 * @param {Object} overrides - Custom overrides for default values
 * @param {string} [overrides.language] - UI language (default: 'en')
 * @param {Object} [overrides.states] - Entity states object (default: DEFAULT_STATES)
 * @param {Function} [overrides.callWS] - Custom WebSocket call implementation
 * @param {Function} [overrides.callService] - Custom service call implementation
 * @returns {Object} Mock hass object with mocked methods
 *
 * @example
 * // Basic usage with defaults
 * const hass = createMockHass();
 *
 * @example
 * // Override language and add custom state
 * const hass = createMockHass({
 *   language: 'de',
 *   states: {
 *     ...DEFAULT_STATES,
 *     'light.custom': {
 *       entity_id: 'light.custom',
 *       state: 'on',
 *       attributes: { friendly_name: 'Custom Light' }
 *     }
 *   }
 * });
 *
 * @example
 * // Use in tests with assertions
 * const hass = createMockHass();
 * await hass.callService('light', 'turn_on', { entity_id: 'light.wohnzimmer_decke' });
 * expect(hass.callService).toHaveBeenCalledWith('light', 'turn_on', { entity_id: 'light.wohnzimmer_decke' });
 *
 * @example
 * // Mock WebSocket responses
 * const hass = createMockHass();
 * const settings = await hass.callWS({ type: 'dashview/get_settings' });
 * expect(settings).toEqual(settingsFixture);
 */
export function createMockHass(overrides = {}) {
  /**
   * Mock WebSocket call handler
   * Handles all Dashview-specific and Home Assistant registry WebSocket messages
   *
   * Supported message types:
   * - dashview/get_settings: Returns settings fixture
   * - dashview/save_settings: Returns success confirmation
   * - config/area_registry/list: Returns areas fixture
   * - config/entity_registry/list: Returns entities fixture
   * - config/device_registry/list: Returns devices fixture
   * - config/label_registry/list: Returns labels fixture
   *
   * @param {Object} msg - WebSocket message object with 'type' property
   * @returns {Promise<Object>} Response data
   */
  const callWS = vi.fn().mockImplementation(async (msg) => {
    switch (msg.type) {
      // Dashview-specific messages
      case 'dashview/get_settings':
        return settingsFixture;
      case 'dashview/save_settings':
        return { success: true };

      // Home Assistant registry messages
      case 'config/area_registry/list':
        return areasFixture;
      case 'config/entity_registry/list':
        return entitiesFixture;
      case 'config/device_registry/list':
        return devicesFixture;
      case 'config/label_registry/list':
        return labelsFixture;

      // Default response for unhandled message types
      default:
        console.warn(`Unhandled WebSocket message type: ${msg.type}`);
        return {};
    }
  });

  /**
   * Mock service call handler
   * Simulates Home Assistant service calls (light.turn_on, cover.open, etc.)
   *
   * @param {string} domain - Service domain (e.g., 'light', 'cover', 'climate')
   * @param {string} service - Service name (e.g., 'turn_on', 'turn_off', 'open')
   * @param {Object} [data] - Service call data (e.g., { entity_id: 'light.example' })
   * @returns {Promise<void>} Resolves when service call completes
   *
   * @example
   * await hass.callService('light', 'turn_on', {
   *   entity_id: 'light.wohnzimmer_decke',
   *   brightness: 255
   * });
   */
  const callService = vi.fn().mockImplementation(async (domain, service, data) => {
    return Promise.resolve();
  });

  // Create default hass object
  const defaultHass = {
    language: 'en',
    states: { ...DEFAULT_STATES },
    callWS,
    callService
  };

  // Merge with overrides and return
  return { ...defaultHass, ...overrides };
}
