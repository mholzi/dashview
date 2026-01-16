import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RegistryStore, DEFAULT_REGISTRY, getRegistryStore } from './registry-store.js';
import { createMockHass } from '../__mocks__/hass.js';

describe('RegistryStore', () => {
  let store;
  let mockHass;

  beforeEach(async () => {
    // Reset modules to reset singleton
    vi.resetModules();

    // Dynamically import to get fresh instance
    const module = await import('./registry-store.js?t=' + Date.now());
    store = new module.RegistryStore();
    mockHass = createMockHass();
  });

  afterEach(() => {
    store.destroy();
  });

  describe('initialization', () => {
    it('should create store with default registry', () => {
      expect(store.all).toEqual(DEFAULT_REGISTRY);
    });

    it('should have empty areas initially', () => {
      expect(store.areas).toEqual([]);
    });

    it('should have empty floors initially', () => {
      expect(store.floors).toEqual([]);
    });

    it('should have empty entity registry initially', () => {
      expect(store.entityRegistry).toEqual([]);
    });

    it('should have empty device registry initially', () => {
      expect(store.deviceRegistry).toEqual([]);
    });

    it('should have empty labels initially', () => {
      expect(store.labels).toEqual([]);
    });

    it('should have empty scenes initially', () => {
      expect(store.scenes).toEqual([]);
    });

    it('should have null labelIds initially', () => {
      const expectedLabelIds = {
        light: null,
        mediaPlayer: null,
        motion: null,
        smoke: null,
        cover: null,
        garage: null,
        window: null,
        vibration: null,
        temperature: null,
        humidity: null,
        climate: null,
        roofWindow: null,
      };
      expect(store.labelIds).toEqual(expectedLabelIds);
    });

    it('should have areasLoading = false initially', () => {
      expect(store.get('areasLoading')).toBe(false);
    });

    it('should have entitiesLoading = false initially', () => {
      expect(store.get('entitiesLoading')).toBe(false);
    });

    it('should initialize with empty listeners set', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      expect(typeof unsubscribe).toBe('function');
      unsubscribe();
    });
  });

  describe('setHass', () => {
    it('should set the hass instance', () => {
      store.setHass(mockHass);
      expect(store._hass).toBe(mockHass);
    });

    it('should allow replacing hass instance', () => {
      const mockHass1 = createMockHass();
      const mockHass2 = createMockHass();
      store.setHass(mockHass1);
      store.setHass(mockHass2);
      expect(store._hass).toBe(mockHass2);
    });
  });

  describe('get(key)', () => {
    it('should return correct value for existing key', () => {
      expect(store.get('areas')).toEqual([]);
    });

    it('should return undefined for non-existent key', () => {
      expect(store.get('nonExistentKey')).toBeUndefined();
    });

    it('should return loading flags correctly', () => {
      expect(store.get('areasLoading')).toBe(false);
      expect(store.get('entitiesLoading')).toBe(false);
    });
  });

  describe('loadAreas', () => {
    it('should return early if hass is null', async () => {
      store.setHass(null);
      await store.loadAreas();
      expect(store.areas).toEqual([]);
      expect(store.floors).toEqual([]);
    });

    it('should return early if already loading', async () => {
      store.setHass(mockHass);
      store._data.areasLoading = true;

      await store.loadAreas();

      expect(mockHass.callWS).not.toHaveBeenCalled();
    });

    it('should load areas and floors from WebSocket', async () => {
      store.setHass(mockHass);

      await store.loadAreas();

      expect(mockHass.callWS).toHaveBeenCalledWith({ type: 'config/area_registry/list' });
      expect(mockHass.callWS).toHaveBeenCalledWith({ type: 'config/floor_registry/list' });
      expect(store.areas.length).toBeGreaterThan(0);
      expect(store.floors.length).toBeGreaterThan(0);
    });

    it('should set areasLoading flag during load', async () => {
      store.setHass(mockHass);

      const loadPromise = store.loadAreas();
      expect(store.get('areasLoading')).toBe(true);

      await loadPromise;
      expect(store.get('areasLoading')).toBe(false);
    });

    it('should notify listeners about areas', async () => {
      store.setHass(mockHass);
      const listener = vi.fn();
      store.subscribe(listener);

      await store.loadAreas();

      expect(listener).toHaveBeenCalledWith('areas', expect.any(Array));
    });

    it('should notify listeners about floors', async () => {
      store.setHass(mockHass);
      const listener = vi.fn();
      store.subscribe(listener);

      await store.loadAreas();

      expect(listener).toHaveBeenCalledWith('floors', expect.any(Array));
    });

    it('should handle WebSocket errors gracefully', async () => {
      const errorHass = createMockHass({
        callWS: vi.fn().mockRejectedValue(new Error('WebSocket error'))
      });
      store.setHass(errorHass);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await store.loadAreas();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Dashview: Failed to load areas:',
        expect.any(Error)
      );
      expect(store.get('areasLoading')).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should handle null response from WebSocket', async () => {
      const nullHass = createMockHass({
        callWS: vi.fn().mockResolvedValue(null)
      });
      store.setHass(nullHass);

      await store.loadAreas();

      expect(store.areas).toEqual([]);
      expect(store.floors).toEqual([]);
    });
  });

  describe('loadEntities', () => {
    it('should return early if hass is null', async () => {
      store.setHass(null);
      await store.loadEntities();
      expect(store.entityRegistry).toEqual([]);
    });

    it('should return early if already loading', async () => {
      store.setHass(mockHass);
      store._data.entitiesLoading = true;

      await store.loadEntities();

      expect(mockHass.callWS).not.toHaveBeenCalled();
    });

    it('should load entities, devices, and labels from WebSocket', async () => {
      store.setHass(mockHass);

      await store.loadEntities();

      expect(mockHass.callWS).toHaveBeenCalledWith({ type: 'config/entity_registry/list' });
      expect(mockHass.callWS).toHaveBeenCalledWith({ type: 'config/device_registry/list' });
      expect(mockHass.callWS).toHaveBeenCalledWith({ type: 'config/label_registry/list' });
      expect(store.entityRegistry.length).toBeGreaterThan(0);
      expect(store.deviceRegistry.length).toBeGreaterThan(0);
      expect(store.labels.length).toBeGreaterThan(0);
    });

    it('should set entitiesLoading flag during load', async () => {
      store.setHass(mockHass);

      const loadPromise = store.loadEntities();
      expect(store.get('entitiesLoading')).toBe(true);

      await loadPromise;
      expect(store.get('entitiesLoading')).toBe(false);
    });

    it('should call _resolveLabelIds after loading', async () => {
      store.setHass(mockHass);
      const spy = vi.spyOn(store, '_resolveLabelIds');

      await store.loadEntities();

      expect(spy).toHaveBeenCalled();
    });

    it('should call _extractScenes after loading', async () => {
      store.setHass(mockHass);
      const spy = vi.spyOn(store, '_extractScenes');

      await store.loadEntities();

      expect(spy).toHaveBeenCalled();
    });

    it('should call _extractWeatherEntities after loading', async () => {
      store.setHass(mockHass);
      const spy = vi.spyOn(store, '_extractWeatherEntities');

      await store.loadEntities();

      expect(spy).toHaveBeenCalled();
    });

    it('should notify listeners about entityRegistry', async () => {
      store.setHass(mockHass);
      const listener = vi.fn();
      store.subscribe(listener);

      await store.loadEntities();

      expect(listener).toHaveBeenCalledWith('entityRegistry', expect.any(Array));
    });

    it('should notify listeners about deviceRegistry', async () => {
      store.setHass(mockHass);
      const listener = vi.fn();
      store.subscribe(listener);

      await store.loadEntities();

      expect(listener).toHaveBeenCalledWith('deviceRegistry', expect.any(Array));
    });

    it('should notify listeners about labels', async () => {
      store.setHass(mockHass);
      const listener = vi.fn();
      store.subscribe(listener);

      await store.loadEntities();

      expect(listener).toHaveBeenCalledWith('labels', expect.any(Array));
    });

    it('should handle WebSocket errors gracefully', async () => {
      const errorHass = createMockHass({
        callWS: vi.fn().mockRejectedValue(new Error('WebSocket error'))
      });
      store.setHass(errorHass);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await store.loadEntities();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Dashview: Failed to load entities:',
        expect.any(Error)
      );
      expect(store.get('entitiesLoading')).toBe(false);

      consoleErrorSpy.mockRestore();
    });

    it('should handle null response from WebSocket', async () => {
      const nullHass = createMockHass({
        callWS: vi.fn().mockResolvedValue(null)
      });
      store.setHass(nullHass);

      await store.loadEntities();

      expect(store.entityRegistry).toEqual([]);
      expect(store.deviceRegistry).toEqual([]);
      expect(store.labels).toEqual([]);
    });
  });

  describe('loadAll', () => {
    it('should load areas and entities in parallel', async () => {
      store.setHass(mockHass);
      const loadAreasSpy = vi.spyOn(store, 'loadAreas');
      const loadEntitiesSpy = vi.spyOn(store, 'loadEntities');

      await store.loadAll();

      expect(loadAreasSpy).toHaveBeenCalled();
      expect(loadEntitiesSpy).toHaveBeenCalled();
    });

    it('should complete when both loads are done', async () => {
      store.setHass(mockHass);

      await store.loadAll();

      expect(store.areas.length).toBeGreaterThan(0);
      expect(store.entityRegistry.length).toBeGreaterThan(0);
    });
  });

  describe('_resolveLabelIds', () => {
    beforeEach(async () => {
      store.setHass(mockHass);
      await store.loadEntities();
    });

    it('should resolve exact match for label name', () => {
      expect(store.labelIds.light).toBe('light');
    });

    it('should resolve exact match for label_id', () => {
      expect(store.labelIds.motion).toBe('motion');
    });

    it('should resolve startsWith match for label name', () => {
      // Temperature label should be resolved
      expect(store.labelIds.temperature).toBe('temperature');
    });

    it('should resolve includes match for label name', () => {
      // Window label should be resolved
      expect(store.labelIds.window).toBe('window');
    });

    it('should resolve German pattern - licht', () => {
      const germanStore = new RegistryStore();
      germanStore.setHass(mockHass);
      germanStore._data.labels = [
        { label_id: 'licht_label', name: 'Licht', icon: 'mdi:lightbulb' }
      ];
      germanStore._resolveLabelIds();

      expect(germanStore.labelIds.light).toBe('licht_label');
    });

    it('should resolve German pattern - bewegung', () => {
      const germanStore = new RegistryStore();
      germanStore.setHass(mockHass);
      germanStore._data.labels = [
        { label_id: 'motion_label', name: 'Bewegung', icon: 'mdi:motion' }
      ];
      germanStore._resolveLabelIds();

      expect(germanStore.labelIds.motion).toBe('motion_label');
    });

    it('should resolve German pattern - temperatur', () => {
      const germanStore = new RegistryStore();
      germanStore.setHass(mockHass);
      germanStore._data.labels = [
        { label_id: 'temp_label', name: 'Temperatur', icon: 'mdi:thermometer' }
      ];
      germanStore._resolveLabelIds();

      expect(germanStore.labelIds.temperature).toBe('temp_label');
    });

    it('should resolve German pattern - luftfeuchtigkeit', () => {
      const germanStore = new RegistryStore();
      germanStore.setHass(mockHass);
      germanStore._data.labels = [
        { label_id: 'humidity_label', name: 'Luftfeuchtigkeit', icon: 'mdi:water' }
      ];
      germanStore._resolveLabelIds();

      expect(germanStore.labelIds.humidity).toBe('humidity_label');
    });

    it('should resolve German pattern - rollo', () => {
      const germanStore = new RegistryStore();
      germanStore.setHass(mockHass);
      germanStore._data.labels = [
        { label_id: 'cover_label', name: 'Rollo', icon: 'mdi:window-shutter' }
      ];
      germanStore._resolveLabelIds();

      expect(germanStore.labelIds.cover).toBe('cover_label');
    });

    it('should resolve German pattern - fenster', () => {
      const germanStore = new RegistryStore();
      germanStore.setHass(mockHass);
      germanStore._data.labels = [
        { label_id: 'window_label', name: 'Fenster', icon: 'mdi:window' }
      ];
      germanStore._resolveLabelIds();

      expect(germanStore.labelIds.window).toBe('window_label');
    });

    it('should resolve German pattern - fernseher', () => {
      const germanStore = new RegistryStore();
      germanStore.setHass(mockHass);
      germanStore._data.labels = [
        { label_id: 'tv_label', name: 'Fernseher', icon: 'mdi:tv' }
      ];
      germanStore._resolveLabelIds();

      expect(germanStore.labelIds.tv).toBe('tv_label');
    });

    it('should handle case-insensitive matching', () => {
      const caseStore = new RegistryStore();
      caseStore.setHass(mockHass);
      caseStore._data.labels = [
        { label_id: 'test_label', name: 'LIGHT', icon: 'mdi:lightbulb' }
      ];
      caseStore._resolveLabelIds();

      expect(caseStore.labelIds.light).toBe('test_label');
    });

    it('should not override already matched labels', () => {
      const multiStore = new RegistryStore();
      multiStore.setHass(mockHass);
      multiStore._data.labels = [
        { label_id: 'light_1', name: 'Light', icon: 'mdi:lightbulb' },
        { label_id: 'light_2', name: 'Lights', icon: 'mdi:lightbulb' }
      ];
      multiStore._resolveLabelIds();

      // Should match the first one only
      expect(multiStore.labelIds.light).toBe('light_1');
    });

    it('should notify listeners about labelIds', async () => {
      const newStore = new RegistryStore();
      newStore.setHass(mockHass);
      const listener = vi.fn();
      newStore.subscribe(listener);

      await newStore.loadEntities();

      expect(listener).toHaveBeenCalledWith('labelIds', expect.any(Object));
    });
  });

  describe('_extractScenes', () => {
    it('should extract scene entities from entity registry', async () => {
      const sceneStore = new RegistryStore();
      sceneStore.setHass(mockHass);
      sceneStore._data.entityRegistry = [
        { entity_id: 'scene.morning', name: 'Morning Scene', area_id: 'wohnzimmer' },
        { entity_id: 'scene.evening', name: 'Evening Scene', area_id: 'schlafzimmer' },
        { entity_id: 'light.test', name: 'Test Light', area_id: 'kueche' }
      ];

      sceneStore._extractScenes();

      expect(sceneStore.scenes).toHaveLength(2);
      expect(sceneStore.scenes[0].entity_id).toBe('scene.morning');
      expect(sceneStore.scenes[1].entity_id).toBe('scene.evening');
    });

    it('should use name, original_name, or entity_id as fallback', () => {
      const sceneStore = new RegistryStore();
      sceneStore.setHass(mockHass);
      sceneStore._data.entityRegistry = [
        { entity_id: 'scene.test1', name: 'Test Name', area_id: 'test' },
        { entity_id: 'scene.test2', original_name: 'Original Name', area_id: 'test' },
        { entity_id: 'scene.test3', area_id: 'test' }
      ];

      sceneStore._extractScenes();

      expect(sceneStore.scenes[0].name).toBe('Test Name');
      expect(sceneStore.scenes[1].name).toBe('Original Name');
      expect(sceneStore.scenes[2].name).toBe('test3');
    });

    it('should notify listeners about scenes', async () => {
      const sceneStore = new RegistryStore();
      sceneStore.setHass(mockHass);
      sceneStore._data.entityRegistry = [
        { entity_id: 'scene.test', name: 'Test', area_id: 'test' }
      ];
      const listener = vi.fn();
      sceneStore.subscribe(listener);

      sceneStore._extractScenes();

      expect(listener).toHaveBeenCalledWith('scenes', expect.any(Array));
    });
  });

  describe('_extractWeatherEntities', () => {
    it('should return early if hass is null', () => {
      store.setHass(null);
      store._extractWeatherEntities();

      expect(store.get('availableWeatherEntities')).toEqual([]);
    });

    it('should extract weather entities from hass.states', () => {
      const weatherHass = createMockHass({
        states: {
          'weather.home': {
            entity_id: 'weather.home',
            attributes: { friendly_name: 'Home Weather' }
          },
          'weather.forecast': {
            entity_id: 'weather.forecast',
            attributes: { friendly_name: 'Forecast' }
          },
          'light.test': {
            entity_id: 'light.test'
          }
        }
      });
      store.setHass(weatherHass);

      store._extractWeatherEntities();

      expect(store.get('availableWeatherEntities')).toHaveLength(2);
      expect(store.get('availableWeatherEntities')[0].entity_id).toBe('weather.home');
    });

    it('should use friendly_name or entity_id as fallback', () => {
      const weatherHass = createMockHass({
        states: {
          'weather.test1': {
            entity_id: 'weather.test1',
            attributes: { friendly_name: 'Test Weather' }
          },
          'weather.test2': {
            entity_id: 'weather.test2',
            attributes: {}
          }
        }
      });
      store.setHass(weatherHass);

      store._extractWeatherEntities();

      expect(store.get('availableWeatherEntities')[0].name).toBe('Test Weather');
      expect(store.get('availableWeatherEntities')[1].name).toBe('weather.test2');
    });

    it('should notify listeners about availableWeatherEntities', () => {
      const weatherHass = createMockHass({
        states: {
          'weather.test': { entity_id: 'weather.test', attributes: {} }
        }
      });
      store.setHass(weatherHass);
      const listener = vi.fn();
      store.subscribe(listener);

      store._extractWeatherEntities();

      expect(listener).toHaveBeenCalledWith('availableWeatherEntities', expect.any(Array));
    });
  });

  describe('getAreasForFloor', () => {
    beforeEach(async () => {
      store.setHass(mockHass);
      await store.loadAreas();
    });

    it('should filter areas by floor_id', () => {
      const erdgeschossAreas = store.getAreasForFloor('erdgeschoss');

      expect(erdgeschossAreas.length).toBeGreaterThan(0);
      erdgeschossAreas.forEach(area => {
        expect(area.floor_id).toBe('erdgeschoss');
      });
    });

    it('should return empty array for non-existent floor', () => {
      const result = store.getAreasForFloor('non_existent_floor');
      expect(result).toEqual([]);
    });

    it('should return multiple areas for the same floor', () => {
      const obergeschossAreas = store.getAreasForFloor('obergeschoss');

      expect(obergeschossAreas.length).toBeGreaterThan(1);
      obergeschossAreas.forEach(area => {
        expect(area.floor_id).toBe('obergeschoss');
      });
    });
  });

  describe('getEntitiesForAreaByLabel', () => {
    beforeEach(async () => {
      store.setHass(mockHass);
      await store.loadEntities();
    });

    it('should return empty array if labelId is null', () => {
      const result = store.getEntitiesForAreaByLabel('wohnzimmer', null);
      expect(result).toEqual([]);
    });

    it('should return empty array if labelId is undefined', () => {
      const result = store.getEntitiesForAreaByLabel('wohnzimmer', undefined);
      expect(result).toEqual([]);
    });

    it('should filter entities by area_id and label', () => {
      const lights = store.getEntitiesForAreaByLabel('wohnzimmer', 'light');

      expect(lights.length).toBeGreaterThan(0);
      lights.forEach(entity => {
        expect(entity.area_id).toBe('wohnzimmer');
        expect(entity.labels).toContain('light');
      });
    });

    it('should find entity with direct area_id', () => {
      const result = store.getEntitiesForAreaByLabel('wohnzimmer', 'light');

      const hasDirectArea = result.some(e => e.area_id === 'wohnzimmer');
      expect(hasDirectArea).toBe(true);
    });

    it('should find entity through device area_id when entity has no area_id', async () => {
      // Entities fixture already has entities that inherit area from device
      // Check if we can find an entity where area comes from device not entity
      const entitiesWithoutArea = store.entityRegistry.filter(e => !e.area_id && e.device_id);

      if (entitiesWithoutArea.length === 0) {
        // Add test entity without direct area_id but device has one
        store._data.entityRegistry.push({
          entity_id: 'light.indirect_area',
          device_id: 'device_001', // This device has area_id = 'wohnzimmer'
          area_id: null,
          labels: ['light']
        });
      }

      const result = store.getEntitiesForAreaByLabel('wohnzimmer', 'light');

      // Should have at least the existing lights with direct area_id
      expect(result.length).toBeGreaterThan(0);
      result.forEach(entity => {
        // Each entity should either have direct area or inherit from device
        const directArea = entity.area_id === 'wohnzimmer';
        const device = store.deviceRegistry.find(d => d.id === entity.device_id);
        const inheritedArea = device?.area_id === 'wohnzimmer';
        expect(directArea || inheritedArea).toBe(true);
      });
    });

    it('should not find entity when device has no area_id', () => {
      store._data.entityRegistry.push({
        entity_id: 'light.no_device_area',
        device_id: 'device_100', // This device has area_id = null
        area_id: null,
        labels: ['light']
      });

      const result = store.getEntitiesForAreaByLabel('wohnzimmer', 'light');

      const hasNoAreaEntity = result.some(e => e.entity_id === 'light.no_device_area');
      expect(hasNoAreaEntity).toBe(false);
    });

    it('should not find entity when device is not found', () => {
      store._data.entityRegistry.push({
        entity_id: 'light.missing_device',
        device_id: 'device_999', // This device doesn't exist
        area_id: null,
        labels: ['light']
      });

      const result = store.getEntitiesForAreaByLabel('wohnzimmer', 'light');

      const hasMissingDevice = result.some(e => e.entity_id === 'light.missing_device');
      expect(hasMissingDevice).toBe(false);
    });

    it('should return empty array for non-existent area', () => {
      const result = store.getEntitiesForAreaByLabel('non_existent', 'light');
      expect(result).toEqual([]);
    });

    it('should return empty array for non-existent label', () => {
      const result = store.getEntitiesForAreaByLabel('wohnzimmer', 'non_existent_label');
      expect(result).toEqual([]);
    });

    it('should handle entity with multiple labels', () => {
      const multiLabel = store.getEntitiesForAreaByLabel('arbeitszimmer', 'temperature');

      // sensor.multi_label_sensor has multiple labels including temperature
      const hasMultiLabel = multiLabel.some(e => e.entity_id === 'sensor.multi_label_sensor');
      expect(hasMultiLabel).toBe(true);
    });

    it('should only return entities that have the specified label', () => {
      const result = store.getEntitiesForAreaByLabel('wohnzimmer', 'motion');

      result.forEach(entity => {
        expect(entity.labels).toContain('motion');
      });
    });
  });

  describe('setWeatherForecasts', () => {
    it('should set daily forecasts', () => {
      const dailyData = [{ temp: 20 }];
      store.setWeatherForecasts(dailyData, undefined);

      expect(store.get('weatherForecasts')).toEqual(dailyData);
    });

    it('should set hourly forecasts', () => {
      const hourlyData = [{ temp: 18 }];
      store.setWeatherForecasts(undefined, hourlyData);

      expect(store.get('weatherHourlyForecasts')).toEqual(hourlyData);
    });

    it('should set both forecasts', () => {
      const dailyData = [{ temp: 20 }];
      const hourlyData = [{ temp: 18 }];
      store.setWeatherForecasts(dailyData, hourlyData);

      expect(store.get('weatherForecasts')).toEqual(dailyData);
      expect(store.get('weatherHourlyForecasts')).toEqual(hourlyData);
    });

    it('should notify listeners about daily forecasts', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      const dailyData = [{ temp: 20 }];

      store.setWeatherForecasts(dailyData, undefined);

      expect(listener).toHaveBeenCalledWith('weatherForecasts', dailyData);
    });

    it('should notify listeners about hourly forecasts', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      const hourlyData = [{ temp: 18 }];

      store.setWeatherForecasts(undefined, hourlyData);

      expect(listener).toHaveBeenCalledWith('weatherHourlyForecasts', hourlyData);
    });
  });

  describe('setThermostatHistory', () => {
    it('should set thermostat history for entity', () => {
      const history = [{ temp: 21 }];
      store.setThermostatHistory('climate.test', history);

      expect(store.get('thermostatHistory')['climate.test']).toEqual(history);
    });

    it('should update existing thermostat history', () => {
      const history1 = [{ temp: 21 }];
      const history2 = [{ temp: 22 }];

      store.setThermostatHistory('climate.test', history1);
      store.setThermostatHistory('climate.test', history2);

      expect(store.get('thermostatHistory')['climate.test']).toEqual(history2);
    });

    it('should maintain multiple thermostat histories', () => {
      const history1 = [{ temp: 21 }];
      const history2 = [{ temp: 19 }];

      store.setThermostatHistory('climate.test1', history1);
      store.setThermostatHistory('climate.test2', history2);

      expect(store.get('thermostatHistory')['climate.test1']).toEqual(history1);
      expect(store.get('thermostatHistory')['climate.test2']).toEqual(history2);
    });

    it('should notify listeners about thermostat history', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      const history = [{ temp: 21 }];

      store.setThermostatHistory('climate.test', history);

      expect(listener).toHaveBeenCalledWith('thermostatHistory', expect.any(Object));
    });
  });

  describe('subscribe', () => {
    it('should add listener to set', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store._notifyListeners('test', 'value');
      expect(listener).toHaveBeenCalledWith('test', 'value');
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      expect(typeof unsubscribe).toBe('function');
    });

    it('should remove listener when unsubscribe is called', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      unsubscribe();
      store._notifyListeners('test', 'value');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();

      store.subscribe(listener1);
      store.subscribe(listener2);

      store._notifyListeners('test', 'value');

      expect(listener1).toHaveBeenCalledWith('test', 'value');
      expect(listener2).toHaveBeenCalledWith('test', 'value');
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn().mockImplementation(() => {
        throw new Error('Listener error');
      });
      const goodListener = vi.fn();
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.subscribe(errorListener);
      store.subscribe(goodListener);

      store._notifyListeners('test', 'value');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Dashview: Registry listener error:',
        expect.any(Error)
      );
      expect(goodListener).toHaveBeenCalledWith('test', 'value');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('destroy', () => {
    it('should clear all listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.destroy();
      store._notifyListeners('test', 'value');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should unsubscribe from daily forecast', () => {
      const unsubscribe = vi.fn();
      store._dailyForecastUnsubscribe = unsubscribe;

      store.destroy();

      expect(unsubscribe).toHaveBeenCalled();
      expect(store._dailyForecastUnsubscribe).toBeNull();
    });

    it('should unsubscribe from hourly forecast', () => {
      const unsubscribe = vi.fn();
      store._hourlyForecastUnsubscribe = unsubscribe;

      store.destroy();

      expect(unsubscribe).toHaveBeenCalled();
      expect(store._hourlyForecastUnsubscribe).toBeNull();
    });

    it('should handle null unsubscribe functions', () => {
      store._dailyForecastUnsubscribe = null;
      store._hourlyForecastUnsubscribe = null;

      expect(() => store.destroy()).not.toThrow();
    });
  });

  describe('getRegistryStore singleton', () => {
    it('should return the same instance', async () => {
      // Import fresh module
      const { getRegistryStore } = await import('./registry-store.js?t=' + Date.now());

      const instance1 = getRegistryStore();
      const instance2 = getRegistryStore();

      expect(instance1).toBe(instance2);
    });

    it('should return RegistryStore instance', async () => {
      const { getRegistryStore, RegistryStore } = await import('./registry-store.js?t=' + Date.now());

      const instance = getRegistryStore();

      expect(instance).toBeInstanceOf(RegistryStore);
    });
  });

  describe('getters', () => {
    it('should return areas via getter', () => {
      store._data.areas = [{ area_id: 'test' }];
      expect(store.areas).toEqual([{ area_id: 'test' }]);
    });

    it('should return floors via getter', () => {
      store._data.floors = [{ floor_id: 'test' }];
      expect(store.floors).toEqual([{ floor_id: 'test' }]);
    });

    it('should return entityRegistry via getter', () => {
      store._data.entityRegistry = [{ entity_id: 'test' }];
      expect(store.entityRegistry).toEqual([{ entity_id: 'test' }]);
    });

    it('should return deviceRegistry via getter', () => {
      store._data.deviceRegistry = [{ device_id: 'test' }];
      expect(store.deviceRegistry).toEqual([{ device_id: 'test' }]);
    });

    it('should return labels via getter', () => {
      store._data.labels = [{ label_id: 'test' }];
      expect(store.labels).toEqual([{ label_id: 'test' }]);
    });

    it('should return labelIds via getter', () => {
      store._data.labelIds = { light: 'test' };
      expect(store.labelIds).toEqual({ light: 'test' });
    });

    it('should return scenes via getter', () => {
      store._data.scenes = [{ entity_id: 'scene.test' }];
      expect(store.scenes).toEqual([{ entity_id: 'scene.test' }]);
    });

    it('should return all data via getter', () => {
      expect(store.all).toBe(store._data);
    });
  });

  describe('edge cases', () => {
    it('should handle empty entity registry', async () => {
      const emptyHass = createMockHass({
        callWS: vi.fn().mockImplementation(async (msg) => {
          if (msg.type === 'config/entity_registry/list') return [];
          if (msg.type === 'config/device_registry/list') return [];
          if (msg.type === 'config/label_registry/list') return [];
          return [];
        })
      });
      store.setHass(emptyHass);

      await store.loadEntities();

      expect(store.entityRegistry).toEqual([]);
      expect(store.scenes).toEqual([]);
    });

    it('should handle empty areas registry', async () => {
      const emptyHass = createMockHass({
        callWS: vi.fn().mockImplementation(async (msg) => {
          if (msg.type === 'config/area_registry/list') return [];
          if (msg.type === 'config/floor_registry/list') return [];
          return [];
        })
      });
      store.setHass(emptyHass);

      await store.loadAreas();

      expect(store.areas).toEqual([]);
      expect(store.floors).toEqual([]);
    });

    it('should handle entity without labels array', () => {
      store._data.entityRegistry = [
        { entity_id: 'test.entity', area_id: 'test', labels: null }
      ];
      store._data.deviceRegistry = [];

      const result = store.getEntitiesForAreaByLabel('test', 'light');

      expect(result).toEqual([]);
    });

    it('should handle missing area_id and device_id', () => {
      store._data.entityRegistry = [
        { entity_id: 'test.entity', area_id: null, device_id: null, labels: ['light'] }
      ];

      const result = store.getEntitiesForAreaByLabel('test', 'light');

      expect(result).toEqual([]);
    });
  });

  // Story 7.8: Indexed lookups tests
  describe('indexed lookups (Story 7.8)', () => {
    describe('getEntityById', () => {
      it('should return entity by ID using O(1) lookup', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        const entity = store.getEntityById('light.wohnzimmer_decke');
        expect(entity).toBeDefined();
        expect(entity.entity_id).toBe('light.wohnzimmer_decke');
      });

      it('should return undefined for non-existent entity', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        const entity = store.getEntityById('non_existent_entity');
        expect(entity).toBeUndefined();
      });

      it('should build index when loadEntities is called', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        expect(store._entityById.size).toBeGreaterThan(0);
        expect(store._entityById.size).toBe(store.entityRegistry.length);
      });
    });

    describe('getDeviceById', () => {
      it('should return device by ID using O(1) lookup', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        const device = store.getDeviceById('device_001');
        expect(device).toBeDefined();
        // Fixture uses device_id, actual HA API uses id
        expect(device.device_id || device.id).toBe('device_001');
      });

      it('should return undefined for non-existent device', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        const device = store.getDeviceById('non_existent_device');
        expect(device).toBeUndefined();
      });

      it('should build index when loadEntities is called', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        expect(store._deviceById.size).toBeGreaterThan(0);
        expect(store._deviceById.size).toBe(store.deviceRegistry.length);
      });
    });

    describe('getAreaById', () => {
      it('should return area by ID using O(1) lookup', async () => {
        store.setHass(mockHass);
        await store.loadAreas();

        const area = store.getAreaById('wohnzimmer');
        expect(area).toBeDefined();
        expect(area.area_id).toBe('wohnzimmer');
      });

      it('should return undefined for non-existent area', async () => {
        store.setHass(mockHass);
        await store.loadAreas();

        const area = store.getAreaById('non_existent_area');
        expect(area).toBeUndefined();
      });

      it('should build index when loadAreas is called', async () => {
        store.setHass(mockHass);
        await store.loadAreas();

        expect(store._areaById.size).toBeGreaterThan(0);
        expect(store._areaById.size).toBe(store.areas.length);
      });
    });

    describe('getAreaIdForEntity', () => {
      it('should return area_id from entity directly', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        const areaId = store.getAreaIdForEntity('light.wohnzimmer_decke');
        expect(areaId).toBe('wohnzimmer');
      });

      it('should return area_id from device when entity has no area', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        // Add entity without area but with device that has area
        store._data.entityRegistry.push({
          entity_id: 'light.indirect_area',
          device_id: 'device_001',
          area_id: null,
          labels: ['light']
        });
        // Rebuild index
        store._entityById.set('light.indirect_area', store._data.entityRegistry.at(-1));

        const areaId = store.getAreaIdForEntity('light.indirect_area');
        expect(areaId).toBe('wohnzimmer');
      });

      it('should return null for non-existent entity', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        const areaId = store.getAreaIdForEntity('non_existent_entity');
        expect(areaId).toBeNull();
      });

      it('should return null when entity has no area and device has no area', async () => {
        store.setHass(mockHass);
        await store.loadEntities();

        store._data.entityRegistry.push({
          entity_id: 'light.no_area',
          device_id: 'device_100',
          area_id: null,
          labels: ['light']
        });
        store._entityById.set('light.no_area', store._data.entityRegistry.at(-1));

        const areaId = store.getAreaIdForEntity('light.no_area');
        expect(areaId).toBeNull();
      });
    });

    describe('_buildIndexes', () => {
      it('should rebuild all indexes when called', async () => {
        store.setHass(mockHass);
        await store.loadAll();

        // Clear indexes
        store._entityById.clear();
        store._deviceById.clear();
        store._areaById.clear();

        // Rebuild
        store._buildIndexes();

        expect(store._entityById.size).toBe(store.entityRegistry.length);
        expect(store._deviceById.size).toBe(store.deviceRegistry.length);
        expect(store._areaById.size).toBe(store.areas.length);
      });

      it('should clear area-label cache when building indexes', async () => {
        store.setHass(mockHass);
        await store.loadAll();

        // Populate cache
        store.getEntitiesForAreaByLabel('wohnzimmer', 'light');
        expect(store._areaLabelCache.size).toBeGreaterThan(0);

        // Rebuild indexes
        store._buildIndexes();

        expect(store._areaLabelCache.size).toBe(0);
      });
    });
  });

  // Story 7.8: Area-label caching tests
  describe('area-label caching (Story 7.8)', () => {
    it('should cache getEntitiesForAreaByLabel results', async () => {
      store.setHass(mockHass);
      await store.loadEntities();

      // First call should populate cache
      const result1 = store.getEntitiesForAreaByLabel('wohnzimmer', 'light');
      expect(store._areaLabelCache.has('wohnzimmer:light')).toBe(true);

      // Second call should return cached result
      const result2 = store.getEntitiesForAreaByLabel('wohnzimmer', 'light');
      expect(result1).toBe(result2); // Same reference
    });

    it('should invalidate cache when loadEntities is called', async () => {
      store.setHass(mockHass);
      await store.loadEntities();

      // Populate cache
      store.getEntitiesForAreaByLabel('wohnzimmer', 'light');
      expect(store._areaLabelCache.size).toBeGreaterThan(0);

      // Load entities again
      await store.loadEntities();

      expect(store._areaLabelCache.size).toBe(0);
    });

    it('should use indexed device lookup inside getEntitiesForAreaByLabel', async () => {
      store.setHass(mockHass);
      await store.loadEntities();

      // Add entity that inherits area from device
      store._data.entityRegistry.push({
        entity_id: 'light.device_area_test',
        device_id: 'device_001',
        area_id: null,
        labels: ['light']
      });
      store._entityById.set('light.device_area_test', store._data.entityRegistry.at(-1));

      // Clear cache to force fresh lookup
      store._areaLabelCache.clear();

      const result = store.getEntitiesForAreaByLabel('wohnzimmer', 'light');
      const hasDeviceAreaEntity = result.some(e => e.entity_id === 'light.device_area_test');
      expect(hasDeviceAreaEntity).toBe(true);
    });
  });
});
