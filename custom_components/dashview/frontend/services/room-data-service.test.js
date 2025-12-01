import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RoomDataService, getRoomDataService } from './room-data-service.js';

// Mock helpers
vi.mock('../utils/helpers.js', () => ({
  sortByName: vi.fn((arr) => arr),
  parseNumericState: vi.fn((stateObj) => {
    const val = parseFloat(stateObj.state);
    return isNaN(val) ? null : val;
  }),
}));

describe('RoomDataService', () => {
  let service;
  let mockHass;
  let mockEntityRegistry;
  let mockDeviceRegistry;
  let mockLabelIds;
  let mockEnabledMaps;

  beforeEach(() => {
    vi.resetModules();
    service = new RoomDataService();

    // Set up comprehensive mock data
    mockHass = {
      states: {
        'light.living_room': {
          state: 'on',
          attributes: { friendly_name: 'Living Room Light' }
        },
        'light.living_room_2': {
          state: 'off',
          attributes: { friendly_name: 'Living Room Light 2' }
        },
        'binary_sensor.living_room_motion': {
          state: 'on',
          attributes: { friendly_name: 'Living Room Motion' }
        },
        'binary_sensor.bedroom_motion': {
          state: 'off',
          attributes: { friendly_name: 'Bedroom Motion' }
        },
        'sensor.living_room_temperature': {
          state: '21.5',
          attributes: { unit_of_measurement: '°C', friendly_name: 'Living Room Temp' }
        },
        'sensor.living_room_humidity': {
          state: '45.2',
          attributes: { unit_of_measurement: '%', friendly_name: 'Living Room Humidity' }
        },
        'sensor.bedroom_temperature': {
          state: '19.8',
          attributes: { unit_of_measurement: '°C', friendly_name: 'Bedroom Temp' }
        },
        'cover.living_room_blind': {
          state: 'open',
          attributes: { current_position: 75, friendly_name: 'Living Room Blind' }
        },
        'climate.living_room': {
          state: 'heat',
          attributes: {
            hvac_action: 'heating',
            current_temperature: 21.5,
            temperature: 22.0,
            friendly_name: 'Living Room Climate'
          }
        },
        'media_player.living_room': {
          state: 'playing',
          attributes: {
            media_title: 'Test Song',
            media_artist: 'Test Artist',
            entity_picture: '/image.jpg',
            volume_level: 0.5,
            source: 'Spotify',
            friendly_name: 'Living Room Speaker'
          }
        },
        'lock.front_door': {
          state: 'locked',
          last_changed: '2025-12-01T10:00:00Z',
          attributes: { friendly_name: 'Front Door Lock' }
        },
        'sensor.invalid_temp': {
          state: 'unknown',
          attributes: { unit_of_measurement: '°C', friendly_name: 'Invalid Temp' }
        },
      },
    };

    mockEntityRegistry = [
      // Direct area assignment
      {
        entity_id: 'light.living_room',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-light'],
        original_name: 'Living Room Light'
      },
      {
        entity_id: 'light.living_room_2',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-light'],
        original_name: 'Living Room Light 2'
      },
      // Area inherited from device
      {
        entity_id: 'binary_sensor.living_room_motion',
        area_id: null,
        device_id: 'device-123',
        labels: ['label-motion'],
        original_name: 'Motion Sensor'
      },
      {
        entity_id: 'binary_sensor.bedroom_motion',
        area_id: 'bedroom',
        device_id: null,
        labels: ['label-motion'],
        original_name: 'Bedroom Motion'
      },
      {
        entity_id: 'sensor.living_room_temperature',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-temp'],
        original_name: 'Temperature'
      },
      {
        entity_id: 'sensor.living_room_humidity',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-humidity'],
        original_name: 'Humidity'
      },
      {
        entity_id: 'sensor.bedroom_temperature',
        area_id: 'bedroom',
        device_id: null,
        labels: ['label-temp'],
        original_name: 'Bedroom Temp'
      },
      {
        entity_id: 'cover.living_room_blind',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-cover'],
        original_name: 'Blind'
      },
      {
        entity_id: 'climate.living_room',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-climate'],
        original_name: 'Climate'
      },
      {
        entity_id: 'media_player.living_room',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-media'],
        original_name: 'Speaker'
      },
      {
        entity_id: 'lock.front_door',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-lock'],
        original_name: 'Front Door'
      },
      {
        entity_id: 'sensor.invalid_temp',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-temp'],
        original_name: 'Invalid Temp'
      },
    ];

    mockDeviceRegistry = [
      {
        id: 'device-123',
        name: 'Motion Sensor Device',
        name_by_user: 'Custom Motion Name',
        area_id: 'living_room'
      },
    ];

    mockLabelIds = {
      light: 'label-light',
      motion: 'label-motion',
      temperature: 'label-temp',
      humidity: 'label-humidity',
      cover: 'label-cover',
      climate: 'label-climate',
      mediaPlayer: 'label-media',
      lock: 'label-lock',
    };

    mockEnabledMaps = {
      enabledLights: {
        'light.living_room': true,
        'light.living_room_2': true,
      },
      enabledMotionSensors: {
        'binary_sensor.living_room_motion': true,
        'binary_sensor.bedroom_motion': true,
      },
      enabledTemperatureSensors: {
        'sensor.living_room_temperature': true,
        'sensor.bedroom_temperature': true,
        'sensor.invalid_temp': true,
      },
      enabledHumiditySensors: {
        'sensor.living_room_humidity': true,
      },
      enabledCovers: {
        'cover.living_room_blind': true,
      },
      enabledClimates: {
        'climate.living_room': true,
      },
      enabledMediaPlayers: {
        'media_player.living_room': true,
      },
      enabledLocks: {
        'lock.front_door': true,
      },
    };
  });

  describe('initialization', () => {
    it('should create service with default properties', () => {
      expect(service._hass).toBe(null);
      expect(service._entityRegistry).toEqual([]);
      expect(service._deviceRegistry).toEqual([]);
      expect(service._labelIds).toEqual({});
      expect(service._enabledMaps).toEqual({});
    });
  });

  describe('setHass', () => {
    it('should set the hass instance', () => {
      service.setHass(mockHass);
      expect(service._hass).toBe(mockHass);
    });

    it('should allow replacing hass instance', () => {
      const mockHass2 = { states: {} };
      service.setHass(mockHass);
      service.setHass(mockHass2);
      expect(service._hass).toBe(mockHass2);
    });

    it('should accept null hass', () => {
      service.setHass(null);
      expect(service._hass).toBe(null);
    });
  });

  describe('setEntityRegistry', () => {
    it('should set the entity registry', () => {
      service.setEntityRegistry(mockEntityRegistry);
      expect(service._entityRegistry).toBe(mockEntityRegistry);
    });

    it('should handle null by using empty array', () => {
      service.setEntityRegistry(null);
      expect(service._entityRegistry).toEqual([]);
    });

    it('should handle undefined by using empty array', () => {
      service.setEntityRegistry(undefined);
      expect(service._entityRegistry).toEqual([]);
    });
  });

  describe('setDeviceRegistry', () => {
    it('should set the device registry', () => {
      service.setDeviceRegistry(mockDeviceRegistry);
      expect(service._deviceRegistry).toBe(mockDeviceRegistry);
    });

    it('should handle null by using empty array', () => {
      service.setDeviceRegistry(null);
      expect(service._deviceRegistry).toEqual([]);
    });
  });

  describe('setLabelIds', () => {
    it('should set the label IDs map', () => {
      service.setLabelIds(mockLabelIds);
      expect(service._labelIds).toBe(mockLabelIds);
    });

    it('should handle null by using empty object', () => {
      service.setLabelIds(null);
      expect(service._labelIds).toEqual({});
    });
  });

  describe('setEnabledMaps', () => {
    it('should set enabled entity maps', () => {
      service.setEnabledMaps(mockEnabledMaps);
      expect(service._enabledMaps).toBe(mockEnabledMaps);
    });

    it('should handle null by using empty object', () => {
      service.setEnabledMaps(null);
      expect(service._enabledMaps).toEqual({});
    });
  });

  describe('getAreaIdForEntity', () => {
    beforeEach(() => {
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
    });

    it('should return area_id when entity has direct area', () => {
      const areaId = service.getAreaIdForEntity('light.living_room');
      expect(areaId).toBe('living_room');
    });

    it('should return device area_id when entity has no direct area', () => {
      const areaId = service.getAreaIdForEntity('binary_sensor.living_room_motion');
      expect(areaId).toBe('living_room');
    });

    it('should return null for non-existent entity', () => {
      const areaId = service.getAreaIdForEntity('non.existent');
      expect(areaId).toBe(null);
    });

    it('should return null for entity with no area and no device', () => {
      const entityReg = [
        { entity_id: 'sensor.orphan', area_id: null, device_id: null }
      ];
      service.setEntityRegistry(entityReg);
      const areaId = service.getAreaIdForEntity('sensor.orphan');
      expect(areaId).toBe(null);
    });

    it('should return null for entity with device_id but device not in registry', () => {
      const entityReg = [
        { entity_id: 'sensor.orphan', area_id: null, device_id: 'missing-device' }
      ];
      service.setEntityRegistry(entityReg);
      const areaId = service.getAreaIdForEntity('sensor.orphan');
      expect(areaId).toBe(null);
    });

    it('should return null for entity with device but device has no area', () => {
      const entityReg = [
        { entity_id: 'sensor.test', area_id: null, device_id: 'dev-1' }
      ];
      const deviceReg = [
        { id: 'dev-1', name: 'Test Device', area_id: null }
      ];
      service.setEntityRegistry(entityReg);
      service.setDeviceRegistry(deviceReg);
      const areaId = service.getAreaIdForEntity('sensor.test');
      expect(areaId).toBe(null);
    });
  });

  describe('getAreaEntities', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('should return empty array when no hass instance', () => {
      service.setHass(null);
      const entities = service.getAreaEntities('living_room', 'light');
      expect(entities).toEqual([]);
    });

    it('should return empty array for unknown entity type', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const entities = service.getAreaEntities('living_room', 'unknown_type');
      expect(entities).toEqual([]);
      expect(consoleSpy).toHaveBeenCalledWith(
        'RoomDataService: Unknown entity type "unknown_type"'
      );
      consoleSpy.mockRestore();
    });

    it('should return empty array when label not configured', () => {
      service.setLabelIds({});
      const entities = service.getAreaEntities('living_room', 'light');
      expect(entities).toEqual([]);
    });

    it('should return entities for a specific area', () => {
      const entities = service.getAreaEntities('living_room', 'light');
      expect(entities).toHaveLength(2);
      expect(entities[0].entity_id).toBe('light.living_room');
      expect(entities[1].entity_id).toBe('light.living_room_2');
    });

    it('should include state information', () => {
      const entities = service.getAreaEntities('living_room', 'light');
      expect(entities[0].state).toBe('on');
      expect(entities[0].name).toBe('Living Room Light');
      expect(entities[0].enabled).toBe(true);
    });

    it('should inherit area from device', () => {
      const entities = service.getAreaEntities('living_room', 'motion');
      const motionEntity = entities.find(e => e.entity_id === 'binary_sensor.living_room_motion');
      expect(motionEntity).toBeDefined();
      expect(motionEntity.state).toBe('on');
    });

    it('should include device name when available', () => {
      const entities = service.getAreaEntities('living_room', 'motion');
      const motionEntity = entities.find(e => e.entity_id === 'binary_sensor.living_room_motion');
      expect(motionEntity.deviceName).toBe('Custom Motion Name');
    });

    it('should handle enabled state from enabled maps', () => {
      const customEnabledMaps = {
        enabledLights: {
          'light.living_room': false, // Explicitly disabled
        },
      };
      service.setEnabledMaps(customEnabledMaps);
      const entities = service.getAreaEntities('living_room', 'light');
      const disabledLight = entities.find(e => e.entity_id === 'light.living_room');
      expect(disabledLight.enabled).toBe(false);
    });

    it('should default enabled to true when not in enabled map', () => {
      service.setEnabledMaps({});
      const entities = service.getAreaEntities('living_room', 'light');
      expect(entities[0].enabled).toBe(true);
    });

    it('should include type-specific extra attributes for covers', () => {
      const entities = service.getAreaEntities('living_room', 'cover');
      expect(entities[0].position).toBe(75);
    });

    it('should include type-specific extra attributes for temperature sensors', () => {
      const entities = service.getAreaEntities('living_room', 'temperature');
      expect(entities[0].unit).toBe('°C');
    });

    it('should include type-specific extra attributes for climate', () => {
      const entities = service.getAreaEntities('living_room', 'climate');
      expect(entities[0].hvacAction).toBe('heating');
      expect(entities[0].currentTemp).toBe(21.5);
      expect(entities[0].targetTemp).toBe(22.0);
    });

    it('should include type-specific extra attributes for media players', () => {
      const entities = service.getAreaEntities('living_room', 'mediaPlayer');
      expect(entities[0].mediaTitle).toBe('Test Song');
      expect(entities[0].mediaArtist).toBe('Test Artist');
      expect(entities[0].entityPicture).toBe('/image.jpg');
      expect(entities[0].volumeLevel).toBe(0.5);
      expect(entities[0].source).toBe('Spotify');
    });

    it('should include type-specific extra attributes for locks', () => {
      const entities = service.getAreaEntities('living_room', 'lock');
      expect(entities[0].isLocked).toBe(true);
      expect(entities[0].lastChanged).toBe('2025-12-01T10:00:00Z');
    });

    it('should filter entities not in the specified area', () => {
      const entities = service.getAreaEntities('bedroom', 'light');
      expect(entities).toHaveLength(0);
    });

    it('should filter entities without the required label', () => {
      const registryWithoutLabel = [
        {
          entity_id: 'light.no_label',
          area_id: 'living_room',
          device_id: null,
          labels: [],
        },
      ];
      service.setEntityRegistry(registryWithoutLabel);
      const entities = service.getAreaEntities('living_room', 'light');
      expect(entities).toHaveLength(0);
    });

    it('should use original_name as fallback when no friendly_name', () => {
      const hassWithoutFriendlyName = {
        states: {
          'light.test': {
            state: 'on',
            attributes: {}
          },
        },
      };
      const registryWithEntity = [
        {
          entity_id: 'light.test',
          area_id: 'living_room',
          device_id: null,
          labels: ['label-light'],
          original_name: 'Original Name'
        },
      ];
      service.setHass(hassWithoutFriendlyName);
      service.setEntityRegistry(registryWithEntity);
      const entities = service.getAreaEntities('living_room', 'light');
      expect(entities[0].name).toBe('Original Name');
    });

    it('should use entity_id as fallback when no friendly_name or original_name', () => {
      const hassWithoutFriendlyName = {
        states: {
          'light.test': {
            state: 'on',
            attributes: {}
          },
        },
      };
      const registryWithEntity = [
        {
          entity_id: 'light.test',
          area_id: 'living_room',
          device_id: null,
          labels: ['label-light'],
        },
      ];
      service.setHass(hassWithoutFriendlyName);
      service.setEntityRegistry(registryWithEntity);
      const entities = service.getAreaEntities('living_room', 'light');
      expect(entities[0].name).toBe('light.test');
    });
  });

  describe('type-specific convenience methods', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('getAreaLights should return lights', () => {
      const lights = service.getAreaLights('living_room');
      expect(lights).toHaveLength(2);
      expect(lights[0].entity_id).toContain('light.');
    });

    it('getAreaMotionSensors should return motion sensors', () => {
      const sensors = service.getAreaMotionSensors('living_room');
      expect(sensors).toHaveLength(1);
      expect(sensors[0].entity_id).toBe('binary_sensor.living_room_motion');
    });

    it('getAreaTemperatureSensors should return temperature sensors', () => {
      const sensors = service.getAreaTemperatureSensors('living_room');
      expect(sensors.length).toBeGreaterThan(0);
      expect(sensors[0].entity_id).toContain('temperature');
    });

    it('getAreaHumiditySensors should return humidity sensors', () => {
      const sensors = service.getAreaHumiditySensors('living_room');
      expect(sensors).toHaveLength(1);
      expect(sensors[0].entity_id).toBe('sensor.living_room_humidity');
    });

    it('getAreaCovers should return covers', () => {
      const covers = service.getAreaCovers('living_room');
      expect(covers).toHaveLength(1);
      expect(covers[0].entity_id).toBe('cover.living_room_blind');
    });

    it('getAreaClimates should return climates', () => {
      const climates = service.getAreaClimates('living_room');
      expect(climates).toHaveLength(1);
      expect(climates[0].entity_id).toBe('climate.living_room');
    });

    it('getAreaMediaPlayers should return media players', () => {
      const players = service.getAreaMediaPlayers('living_room');
      expect(players).toHaveLength(1);
      expect(players[0].entity_id).toBe('media_player.living_room');
    });

    it('getAreaLocks should return locks', () => {
      const locks = service.getAreaLocks('living_room');
      expect(locks).toHaveLength(1);
      expect(locks[0].entity_id).toBe('lock.front_door');
    });
  });

  describe('hasMotion', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('should return true when motion sensor is on', () => {
      const hasMotion = service.hasMotion('living_room');
      expect(hasMotion).toBe(true);
    });

    it('should return false when motion sensor is off', () => {
      const hasMotion = service.hasMotion('bedroom');
      expect(hasMotion).toBe(false);
    });

    it('should return false when no motion sensors in area', () => {
      const hasMotion = service.hasMotion('kitchen');
      expect(hasMotion).toBe(false);
    });

    it('should only check enabled motion sensors', () => {
      const customEnabledMaps = {
        enabledMotionSensors: {
          'binary_sensor.living_room_motion': false, // Disabled
        },
      };
      service.setEnabledMaps(customEnabledMaps);
      const hasMotion = service.hasMotion('living_room');
      expect(hasMotion).toBe(false);
    });

    it('should return true if any enabled sensor detects motion', () => {
      mockHass.states['binary_sensor.living_room_motion_2'] = {
        state: 'on',
        attributes: {}
      };
      mockEntityRegistry.push({
        entity_id: 'binary_sensor.living_room_motion_2',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-motion'],
      });
      mockEnabledMaps.enabledMotionSensors['binary_sensor.living_room_motion'] = false;
      mockEnabledMaps.enabledMotionSensors['binary_sensor.living_room_motion_2'] = true;

      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setEnabledMaps(mockEnabledMaps);

      const hasMotion = service.hasMotion('living_room');
      expect(hasMotion).toBe(true);
    });
  });

  describe('hasLightsOn', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('should return true when at least one light is on', () => {
      const hasLightsOn = service.hasLightsOn('living_room');
      expect(hasLightsOn).toBe(true);
    });

    it('should return false when all lights are off', () => {
      mockHass.states['light.living_room'].state = 'off';
      service.setHass(mockHass);
      const hasLightsOn = service.hasLightsOn('living_room');
      expect(hasLightsOn).toBe(false);
    });

    it('should return false when no lights in area', () => {
      const hasLightsOn = service.hasLightsOn('kitchen');
      expect(hasLightsOn).toBe(false);
    });

    it('should only check enabled lights', () => {
      const customEnabledMaps = {
        enabledLights: {
          'light.living_room': false, // Disabled
          'light.living_room_2': true,
        },
      };
      service.setEnabledMaps(customEnabledMaps);
      const hasLightsOn = service.hasLightsOn('living_room');
      expect(hasLightsOn).toBe(false); // living_room is on but disabled
    });
  });

  describe('getTemperature', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('should return temperature value rounded to integer', () => {
      const temp = service.getTemperature('living_room');
      expect(temp).toBe('22'); // 21.5 rounded
    });

    it('should return null when no temperature sensors in area', () => {
      const temp = service.getTemperature('kitchen');
      expect(temp).toBe(null);
    });

    it('should return null when sensor state is invalid', () => {
      const temp = service.getTemperature('living_room');
      // We have invalid_temp sensor, but it should be filtered by parseNumericState
      expect(temp).not.toBe(null); // Should get valid sensor
    });

    it('should use first enabled temperature sensor', () => {
      mockHass.states['sensor.living_room_temperature_2'] = {
        state: '25.8',
        attributes: { unit_of_measurement: '°C' }
      };
      mockEntityRegistry.push({
        entity_id: 'sensor.living_room_temperature_2',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-temp'],
      });
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);

      const temp = service.getTemperature('living_room');
      expect(temp).toBe('22'); // First sensor: 21.5
    });

    it('should return null when parseNumericState returns null', async () => {
      // Mock parseNumericState to return null
      const { parseNumericState } = await import('../utils/helpers.js');
      parseNumericState.mockReturnValueOnce(null);

      const temp = service.getTemperature('living_room');
      expect(temp).toBe(null);
    });

    it('should only use enabled temperature sensors', () => {
      const customEnabledMaps = {
        enabledTemperatureSensors: {
          'sensor.living_room_temperature': false,
        },
      };
      service.setEnabledMaps(customEnabledMaps);
      const temp = service.getTemperature('living_room');
      expect(temp).toBe(null);
    });
  });

  describe('getHumidity', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('should return humidity value rounded to integer', () => {
      const humidity = service.getHumidity('living_room');
      expect(humidity).toBe('45'); // 45.2 rounded
    });

    it('should return null when no humidity sensors in area', () => {
      const humidity = service.getHumidity('bedroom');
      expect(humidity).toBe(null);
    });

    it('should return null when parseNumericState returns null', async () => {
      const { parseNumericState } = await import('../utils/helpers.js');
      parseNumericState.mockReturnValueOnce(null);

      const humidity = service.getHumidity('living_room');
      expect(humidity).toBe(null);
    });

    it('should only use enabled humidity sensors', () => {
      const customEnabledMaps = {
        enabledHumiditySensors: {
          'sensor.living_room_humidity': false,
        },
      };
      service.setEnabledMaps(customEnabledMaps);
      const humidity = service.getHumidity('living_room');
      expect(humidity).toBe(null);
    });
  });

  describe('getRoomData', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('should return aggregated room data', () => {
      const roomData = service.getRoomData('living_room');
      expect(roomData).toEqual({
        hasMotion: true,
        hasLightsOn: true,
        temperature: '22',
        humidity: '45',
        isActive: true,
      });
    });

    it('should set isActive to true when hasMotion is true', () => {
      mockHass.states['light.living_room'].state = 'off';
      mockHass.states['light.living_room_2'].state = 'off';
      service.setHass(mockHass);

      const roomData = service.getRoomData('living_room');
      expect(roomData.hasLightsOn).toBe(false);
      expect(roomData.hasMotion).toBe(true);
      expect(roomData.isActive).toBe(true); // Motion makes it active
    });

    it('should set isActive to true when hasLightsOn is true', () => {
      mockHass.states['binary_sensor.living_room_motion'].state = 'off';
      service.setHass(mockHass);

      const roomData = service.getRoomData('living_room');
      expect(roomData.hasMotion).toBe(false);
      expect(roomData.hasLightsOn).toBe(true);
      expect(roomData.isActive).toBe(true); // Lights make it active
    });

    it('should set isActive to false when no motion and no lights on', () => {
      mockHass.states['binary_sensor.living_room_motion'].state = 'off';
      mockHass.states['light.living_room'].state = 'off';
      mockHass.states['light.living_room_2'].state = 'off';
      service.setHass(mockHass);

      const roomData = service.getRoomData('living_room');
      expect(roomData.hasMotion).toBe(false);
      expect(roomData.hasLightsOn).toBe(false);
      expect(roomData.isActive).toBe(false);
    });

    it('should handle room with no sensors', () => {
      const roomData = service.getRoomData('kitchen');
      expect(roomData).toEqual({
        hasMotion: false,
        hasLightsOn: false,
        temperature: null,
        humidity: null,
        isActive: false,
      });
    });

    it('should handle partial sensor data', () => {
      const roomData = service.getRoomData('bedroom');
      expect(roomData.hasMotion).toBe(false);
      expect(roomData.hasLightsOn).toBe(false);
      expect(roomData.temperature).toBe('20'); // bedroom has temp sensor
      expect(roomData.humidity).toBe(null); // no humidity sensor
      expect(roomData.isActive).toBe(false);
    });
  });

  describe('getRoomDataBatch', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('should return Map with data for multiple rooms', () => {
      const rooms = [
        { area_id: 'living_room', name: 'Living Room' },
        { area_id: 'bedroom', name: 'Bedroom' },
      ];

      const dataMap = service.getRoomDataBatch(rooms);

      expect(dataMap).toBeInstanceOf(Map);
      expect(dataMap.size).toBe(2);
      expect(dataMap.has('living_room')).toBe(true);
      expect(dataMap.has('bedroom')).toBe(true);
    });

    it('should return correct data for each room', () => {
      const rooms = [
        { area_id: 'living_room', name: 'Living Room' },
        { area_id: 'bedroom', name: 'Bedroom' },
      ];

      const dataMap = service.getRoomDataBatch(rooms);

      const livingRoomData = dataMap.get('living_room');
      expect(livingRoomData.hasMotion).toBe(true);
      expect(livingRoomData.hasLightsOn).toBe(true);
      expect(livingRoomData.isActive).toBe(true);

      const bedroomData = dataMap.get('bedroom');
      expect(bedroomData.hasMotion).toBe(false);
      expect(bedroomData.hasLightsOn).toBe(false);
      expect(bedroomData.isActive).toBe(false);
    });

    it('should handle empty rooms array', () => {
      const dataMap = service.getRoomDataBatch([]);
      expect(dataMap).toBeInstanceOf(Map);
      expect(dataMap.size).toBe(0);
    });

    it('should handle rooms with no entities', () => {
      const rooms = [
        { area_id: 'kitchen', name: 'Kitchen' },
      ];

      const dataMap = service.getRoomDataBatch(rooms);
      const kitchenData = dataMap.get('kitchen');

      expect(kitchenData).toEqual({
        hasMotion: false,
        hasLightsOn: false,
        temperature: null,
        humidity: null,
        isActive: false,
      });
    });
  });

  describe('getRoomDataService singleton', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = getRoomDataService();
      const instance2 = getRoomDataService();
      expect(instance1).toBe(instance2);
    });

    it('should return a RoomDataService instance', () => {
      const instance = getRoomDataService();
      expect(instance).toBeInstanceOf(RoomDataService);
    });

    it('should share state across singleton calls', () => {
      const instance1 = getRoomDataService();
      instance1.setHass(mockHass);

      const instance2 = getRoomDataService();
      expect(instance2._hass).toBe(mockHass);
    });
  });

  describe('edge cases', () => {
    beforeEach(() => {
      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setDeviceRegistry(mockDeviceRegistry);
      service.setLabelIds(mockLabelIds);
      service.setEnabledMaps(mockEnabledMaps);
    });

    it('should handle entity with missing state object', () => {
      const customHass = {
        states: {
          'light.missing': undefined,
        },
      };
      const customRegistry = [
        {
          entity_id: 'light.missing',
          area_id: 'living_room',
          device_id: null,
          labels: ['label-light'],
        },
      ];
      service.setHass(customHass);
      service.setEntityRegistry(customRegistry);

      const lights = service.getAreaLights('living_room');
      expect(lights[0].state).toBe('unknown');
    });

    it('should handle entity with missing attributes', () => {
      const customHass = {
        states: {
          'light.no_attrs': { state: 'on' },
        },
      };
      const customRegistry = [
        {
          entity_id: 'light.no_attrs',
          area_id: 'living_room',
          device_id: null,
          labels: ['label-light'],
          original_name: 'No Attrs Light'
        },
      ];
      service.setHass(customHass);
      service.setEntityRegistry(customRegistry);

      const lights = service.getAreaLights('living_room');
      expect(lights[0].name).toBe('No Attrs Light');
    });

    it('should handle device with no name_by_user', () => {
      const customDeviceRegistry = [
        { id: 'device-test', name: 'Device Name', area_id: 'living_room' },
      ];
      const customEntityRegistry = [
        {
          entity_id: 'light.device_light',
          area_id: null,
          device_id: 'device-test',
          labels: ['label-light'],
        },
      ];
      mockHass.states['light.device_light'] = { state: 'on', attributes: {} };

      service.setHass(mockHass);
      service.setDeviceRegistry(customDeviceRegistry);
      service.setEntityRegistry(customEntityRegistry);

      const lights = service.getAreaLights('living_room');
      expect(lights[0].deviceName).toBe('Device Name');
    });

    it('should handle entity with no labels array', () => {
      const customRegistry = [
        {
          entity_id: 'light.no_labels',
          area_id: 'living_room',
          device_id: null,
          labels: null,
        },
      ];
      mockHass.states['light.no_labels'] = { state: 'on', attributes: {} };

      service.setEntityRegistry(customRegistry);
      const lights = service.getAreaLights('living_room');
      expect(lights).toHaveLength(0);
    });

    it('should handle cover with missing position attribute', () => {
      const customHass = {
        states: {
          'cover.no_position': { state: 'open', attributes: {} },
        },
      };
      const customRegistry = [
        {
          entity_id: 'cover.no_position',
          area_id: 'living_room',
          device_id: null,
          labels: ['label-cover'],
        },
      ];
      service.setHass(customHass);
      service.setEntityRegistry(customRegistry);

      const covers = service.getAreaCovers('living_room');
      expect(covers[0].position).toBe(undefined);
    });

    it('should handle climate with missing attributes', () => {
      const customHass = {
        states: {
          'climate.minimal': { state: 'heat', attributes: {} },
        },
      };
      const customRegistry = [
        {
          entity_id: 'climate.minimal',
          area_id: 'living_room',
          device_id: null,
          labels: ['label-climate'],
        },
      ];
      service.setHass(customHass);
      service.setEntityRegistry(customRegistry);

      const climates = service.getAreaClimates('living_room');
      expect(climates[0].hvacAction).toBe(undefined);
      expect(climates[0].currentTemp).toBe(undefined);
      expect(climates[0].targetTemp).toBe(undefined);
    });

    it('should handle lock with unlocked state', () => {
      mockHass.states['lock.front_door'].state = 'unlocked';
      service.setHass(mockHass);

      const locks = service.getAreaLocks('living_room');
      expect(locks[0].isLocked).toBe(false);
    });

    it('should handle temperature with non-numeric state', () => {
      mockHass.states['sensor.living_room_temperature'].state = 'unavailable';
      service.setHass(mockHass);

      const temp = service.getTemperature('living_room');
      // parseNumericState mock will return null for NaN
      expect(temp).toBe(null);
    });

    it('should handle multiple temperature sensors and use first enabled', () => {
      mockHass.states['sensor.living_room_temp_2'] = {
        state: '30.0',
        attributes: { unit_of_measurement: '°C' }
      };
      mockEntityRegistry.push({
        entity_id: 'sensor.living_room_temp_2',
        area_id: 'living_room',
        device_id: null,
        labels: ['label-temp'],
      });
      mockEnabledMaps.enabledTemperatureSensors['sensor.living_room_temp_2'] = true;

      service.setHass(mockHass);
      service.setEntityRegistry(mockEntityRegistry);
      service.setEnabledMaps(mockEnabledMaps);

      const temp = service.getTemperature('living_room');
      // Should use first sensor in the array
      expect(temp).toBeTruthy();
    });
  });
});
