import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { SettingsStore, DEFAULT_SETTINGS, getSettingsStore } from './settings-store.js';
import { createMockHass } from '../__mocks__/hass.js';

describe('SettingsStore', () => {
  let store;
  let mockHass;

  beforeEach(() => {
    vi.useFakeTimers();
    store = new SettingsStore();
    mockHass = createMockHass();
  });

  afterEach(() => {
    vi.useRealTimers();
    store.destroy();
  });

  describe('initialization', () => {
    it('should create store with default settings', () => {
      expect(store.all).toEqual(DEFAULT_SETTINGS);
    });

    it('should have loaded = false initially', () => {
      expect(store.loaded).toBe(false);
    });

    it('should have hasError = false initially', () => {
      expect(store.hasError).toBe(false);
    });

    it('should have lastError = null initially', () => {
      expect(store.lastError).toBe(null);
    });

    it('should initialize with empty listeners set', () => {
      // Test that subscribing works immediately after creation
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      store.set('weatherEntity', 'weather.test', false);
      expect(listener).toHaveBeenCalledWith('weatherEntity', 'weather.test');
      unsubscribe();
    });

    it('should have default settings structure with all required keys', () => {
      const settings = store.all;
      expect(settings).toHaveProperty('enabledRooms');
      expect(settings).toHaveProperty('enabledLights');
      expect(settings).toHaveProperty('weatherEntity');
      expect(settings).toHaveProperty('infoTextConfig');
      expect(settings).toHaveProperty('sceneButtons');
      expect(settings).toHaveProperty('floorOrder');
      expect(settings).toHaveProperty('categoryLabels');
    });

    it('should have infoTextConfig with all expected items', () => {
      const infoTextConfig = store.get('infoTextConfig');
      expect(infoTextConfig).toHaveProperty('motion');
      expect(infoTextConfig).toHaveProperty('garage');
      expect(infoTextConfig).toHaveProperty('washer');
      expect(infoTextConfig).toHaveProperty('windows');
      expect(infoTextConfig).toHaveProperty('batteryLow');
      expect(infoTextConfig.batteryLow).toHaveProperty('threshold');
    });
  });

  describe('setHass', () => {
    it('should set the hass instance', async () => {
      store.setHass(mockHass);
      // Load should succeed after setting hass
      await expect(store.load()).resolves.toHaveProperty('success', true);
    });

    it('should allow replacing hass instance', async () => {
      const mockHass1 = createMockHass();
      const mockHass2 = createMockHass();
      store.setHass(mockHass1);
      store.setHass(mockHass2);
      // Should use the new hass instance
      await expect(store.load()).resolves.toHaveProperty('success', true);
    });
  });

  describe('get(key)', () => {
    it('should return correct value for existing key', () => {
      expect(store.get('enabledRooms')).toEqual({});
    });

    it('should return undefined for non-existent key', () => {
      expect(store.get('nonExistentKey')).toBeUndefined();
    });

    it('should return nested object correctly', () => {
      const infoTextConfig = store.get('infoTextConfig');
      expect(infoTextConfig).toBeDefined();
      expect(infoTextConfig.motion).toHaveProperty('enabled');
    });

    it('should return array values correctly', () => {
      expect(store.get('floorOrder')).toEqual([]);
      expect(store.get('sceneButtons')).toEqual([]);
    });
  });

  describe('set(key, value)', () => {
    it('should update setting value', () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test');
      expect(store.get('weatherEntity')).toBe('weather.test');
    });

    it('should trigger save by default', async () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test');
      vi.advanceTimersByTime(500); // Debounce time
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dashview/save_settings'
        })
      );
    });

    it('should not trigger save when save=false', async () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test', false);
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).not.toHaveBeenCalled();
    });

    it('should notify listeners on change', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.set('weatherEntity', 'weather.test', false);
      expect(listener).toHaveBeenCalledWith('weatherEntity', 'weather.test');
    });

    it('should handle complex object values', () => {
      store.setHass(mockHass);
      const newConfig = { motion: { enabled: false }, garage: { enabled: true } };
      store.set('infoTextConfig', newConfig, false);
      expect(store.get('infoTextConfig')).toEqual(newConfig);
    });

    it('should handle array values', () => {
      store.setHass(mockHass);
      const floorOrder = ['floor1', 'floor2', 'floor3'];
      store.set('floorOrder', floorOrder, false);
      expect(store.get('floorOrder')).toEqual(floorOrder);
    });

    it('should handle null values', () => {
      store.setHass(mockHass);
      store.set('garbageDisplayFloor', null, false);
      expect(store.get('garbageDisplayFloor')).toBe(null);
    });
  });

  describe('update(updates)', () => {
    it('should update multiple settings at once', () => {
      store.setHass(mockHass);
      const updates = {
        weatherEntity: 'weather.new',
        notificationTempThreshold: 25
      };
      store.update(updates, false);
      expect(store.get('weatherEntity')).toBe('weather.new');
      expect(store.get('notificationTempThreshold')).toBe(25);
    });

    it('should trigger save by default', async () => {
      store.setHass(mockHass);
      const updates = { weatherEntity: 'weather.new' };
      store.update(updates);
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dashview/save_settings'
        })
      );
    });

    it('should not trigger save when save=false', async () => {
      store.setHass(mockHass);
      const updates = { weatherEntity: 'weather.new' };
      store.update(updates, false);
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).not.toHaveBeenCalled();
    });

    it('should notify listeners for each updated key', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      const updates = {
        weatherEntity: 'weather.new',
        notificationTempThreshold: 25
      };
      store.update(updates, false);
      expect(listener).toHaveBeenCalledWith('weatherEntity', 'weather.new');
      expect(listener).toHaveBeenCalledWith('notificationTempThreshold', 25);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should handle empty updates object', () => {
      store.setHass(mockHass);
      const updates = {};
      expect(() => store.update(updates, false)).not.toThrow();
    });
  });

  describe('load()', () => {
    it('should return error when no hass instance', async () => {
      const result = await store.load();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No Home Assistant instance');
    });

    it('should call WebSocket with correct type', async () => {
      store.setHass(mockHass);
      await store.load();
      expect(mockHass.callWS).toHaveBeenCalledWith({ type: 'dashview/get_settings' });
    });

    it('should set loaded = true after successful load', async () => {
      store.setHass(mockHass);
      await store.load();
      expect(store.loaded).toBe(true);
    });

    it('should merge loaded settings with defaults', async () => {
      store.setHass(mockHass);
      await store.load();
      // Settings should include defaults merged with loaded data
      expect(store.get('infoTextConfig')).toBeDefined();
      // Verify that default keys are still present
      expect(store.get('enabledRooms')).toBeDefined();
    });

    it('should not reload if already loaded', async () => {
      store.setHass(mockHass);
      const result1 = await store.load();
      expect(result1.success).toBe(true);

      mockHass.callWS.mockClear();
      const result2 = await store.load();
      expect(result2.success).toBe(true);
      expect(mockHass.callWS).not.toHaveBeenCalled();
    });

    it('should set hasError on load failure', async () => {
      const failingHass = createMockHass({
        callWS: vi.fn().mockRejectedValue(new Error('Network error'))
      });
      store.setHass(failingHass);

      const result = await store.load();
      expect(result.success).toBe(false);
      expect(store.hasError).toBe(true);
      expect(store.lastError).toBe('Network error');
    });

    it('should handle WebSocket errors gracefully', async () => {
      const failingHass = createMockHass({
        callWS: vi.fn().mockRejectedValue({ message: 'Connection failed' })
      });
      store.setHass(failingHass);

      const result = await store.load();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Connection failed');
    });

    it('should notify listeners after successful load', async () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setHass(mockHass);
      await store.load();

      expect(listener).toHaveBeenCalledWith('_loaded', true);
    });

    it('should clear previous error on successful load', async () => {
      const failingHass = createMockHass({
        callWS: vi.fn().mockRejectedValue(new Error('First error'))
      });
      store.setHass(failingHass);
      await store.load();
      expect(store.hasError).toBe(true);

      // Now succeed
      store._loaded = false; // Reset loaded state to allow reload
      store.setHass(mockHass);
      await store.load();
      expect(store.hasError).toBe(false);
      expect(store.lastError).toBe(null);
    });

    it('should deep merge infoTextConfig', async () => {
      const hassWithPartialConfig = createMockHass({
        callWS: vi.fn().mockResolvedValue({
          infoTextConfig: {
            motion: { enabled: false }
            // Other items missing
          }
        })
      });
      store.setHass(hassWithPartialConfig);
      await store.load();

      const config = store.get('infoTextConfig');
      expect(config.motion.enabled).toBe(false); // From loaded data
      expect(config.garage).toBeDefined(); // From defaults
      expect(config.batteryLow).toBeDefined(); // From defaults
    });

    it('should deep merge categoryLabels', async () => {
      const hassWithLabels = createMockHass({
        callWS: vi.fn().mockResolvedValue({
          categoryLabels: {
            light: 'custom_label_id'
            // Other categories missing
          }
        })
      });
      store.setHass(hassWithLabels);
      await store.load();

      const labels = store.get('categoryLabels');
      expect(labels.light).toBe('custom_label_id'); // From loaded data
      expect(labels.cover).toBe(null); // From defaults
    });
  });

  describe('save()', () => {
    it('should debounce multiple rapid calls', async () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test1');
      store.set('weatherEntity', 'weather.test2');
      store.set('weatherEntity', 'weather.test3');

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      // Should only call once
      const saveCalls = mockHass.callWS.mock.calls.filter(
        call => call[0].type === 'dashview/save_settings'
      );
      expect(saveCalls.length).toBe(1);
    });

    it('should send all current settings on save', async () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test');

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).toHaveBeenCalledWith({
        type: 'dashview/save_settings',
        settings: expect.objectContaining({
          weatherEntity: 'weather.test'
        })
      });
    });

    it('should not save if no hass instance', async () => {
      // Don't set hass
      store.set('weatherEntity', 'weather.test');

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      // Should not throw, just silently skip
      expect(mockHass.callWS).not.toHaveBeenCalled();
    });

    it('should handle save errors gracefully', async () => {
      const failingHass = createMockHass({
        callWS: vi.fn().mockRejectedValue(new Error('Save failed'))
      });
      store.setHass(failingHass);
      store.set('weatherEntity', 'weather.test');

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(store.lastError).toBe('Save failed');
    });

    it('should reset debounce timer on new changes', async () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test1');

      vi.advanceTimersByTime(250); // Half debounce time
      store.set('weatherEntity', 'weather.test2');

      vi.advanceTimersByTime(250); // Should not save yet
      expect(mockHass.callWS).not.toHaveBeenCalled();

      vi.advanceTimersByTime(250); // Now should save
      await vi.runAllTimersAsync();

      const saveCalls = mockHass.callWS.mock.calls.filter(
        call => call[0].type === 'dashview/save_settings'
      );
      expect(saveCalls.length).toBe(1);
    });

    it('should clear lastError on successful save', async () => {
      // First fail
      const failingHass = createMockHass({
        callWS: vi.fn().mockRejectedValue(new Error('First error'))
      });
      store.setHass(failingHass);
      store.set('weatherEntity', 'weather.test1');
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      expect(store.lastError).toBe('First error');

      // Now succeed
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test2');
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      expect(store.lastError).toBe(null);
    });
  });

  describe('saveNow()', () => {
    it('should save immediately without debounce', async () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test', false);

      const result = await store.saveNow();
      expect(result.success).toBe(true);
      expect(mockHass.callWS).toHaveBeenCalledWith({
        type: 'dashview/save_settings',
        settings: expect.objectContaining({
          weatherEntity: 'weather.test'
        })
      });
    });

    it('should cancel pending debounced save', async () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test1');

      // Before debounce completes, call saveNow
      await store.saveNow();

      // Advance timers - should not call again
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const saveCalls = mockHass.callWS.mock.calls.filter(
        call => call[0].type === 'dashview/save_settings'
      );
      expect(saveCalls.length).toBe(1);
    });

    it('should return error when no hass instance', async () => {
      const result = await store.saveNow();
      expect(result.success).toBe(false);
      expect(result.error).toBe('No Home Assistant instance');
    });

    it('should handle save errors', async () => {
      const failingHass = createMockHass({
        callWS: vi.fn().mockRejectedValue(new Error('Save failed'))
      });
      store.setHass(failingHass);

      const result = await store.saveNow();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Save failed');
      expect(store.lastError).toBe('Save failed');
    });
  });

  describe('toggleEnabled()', () => {
    it('should toggle false to true', () => {
      store.setHass(mockHass);
      store.toggleEnabled('enabledRooms', 'room.test');
      expect(store.get('enabledRooms')['room.test']).toBe(true);
    });

    it('should toggle true to false', () => {
      store.setHass(mockHass);
      store.set('enabledRooms', { 'room.test': true }, false);
      store.toggleEnabled('enabledRooms', 'room.test');
      expect(store.get('enabledRooms')['room.test']).toBe(false);
    });

    it('should toggle undefined to true', () => {
      store.setHass(mockHass);
      store.toggleEnabled('enabledLights', 'light.test');
      expect(store.get('enabledLights')['light.test']).toBe(true);
    });

    it('should preserve other entities in the map', () => {
      store.setHass(mockHass);
      store.set('enabledRooms', { 'room.existing': true }, false);
      store.toggleEnabled('enabledRooms', 'room.new');

      const rooms = store.get('enabledRooms');
      expect(rooms['room.existing']).toBe(true);
      expect(rooms['room.new']).toBe(true);
    });

    it('should trigger save', async () => {
      store.setHass(mockHass);
      store.toggleEnabled('enabledRooms', 'room.test');

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dashview/save_settings'
        })
      );
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.toggleEnabled('enabledRooms', 'room.test');

      expect(listener).toHaveBeenCalledWith(
        'enabledRooms',
        expect.objectContaining({ 'room.test': true })
      );
    });

    it('should handle non-existent map gracefully', () => {
      store.setHass(mockHass);
      // enabledRooms starts as {}
      expect(() => store.toggleEnabled('enabledRooms', 'room.test')).not.toThrow();
      expect(store.get('enabledRooms')['room.test']).toBe(true);
    });
  });

  describe('setEnabled()', () => {
    it('should set entity to enabled', () => {
      store.setHass(mockHass);
      store.setEnabled('enabledLights', 'light.test', true);
      expect(store.get('enabledLights')['light.test']).toBe(true);
    });

    it('should set entity to disabled', () => {
      store.setHass(mockHass);
      store.setEnabled('enabledLights', 'light.test', false);
      expect(store.get('enabledLights')['light.test']).toBe(false);
    });

    it('should preserve other entities in the map', () => {
      store.setHass(mockHass);
      store.set('enabledLights', { 'light.existing': true }, false);
      store.setEnabled('enabledLights', 'light.new', false);

      const lights = store.get('enabledLights');
      expect(lights['light.existing']).toBe(true);
      expect(lights['light.new']).toBe(false);
    });

    it('should trigger save', async () => {
      store.setHass(mockHass);
      store.setEnabled('enabledLights', 'light.test', true);

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dashview/save_settings'
        })
      );
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setEnabled('enabledLights', 'light.test', true);

      expect(listener).toHaveBeenCalledWith(
        'enabledLights',
        expect.objectContaining({ 'light.test': true })
      );
    });
  });

  describe('subscribe()', () => {
    it('should call listener on changes', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.set('weatherEntity', 'weather.test', false);
      expect(listener).toHaveBeenCalledWith('weatherEntity', 'weather.test');
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      store.set('weatherEntity', 'weather.test', false);
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      store.subscribe(listener1);
      store.subscribe(listener2);

      store.set('weatherEntity', 'weather.test', false);

      expect(listener1).toHaveBeenCalledWith('weatherEntity', 'weather.test');
      expect(listener2).toHaveBeenCalledWith('weatherEntity', 'weather.test');
    });

    it('should allow selective unsubscribe', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const unsubscribe1 = store.subscribe(listener1);
      store.subscribe(listener2);

      unsubscribe1();
      store.set('weatherEntity', 'weather.test', false);

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('weatherEntity', 'weather.test');
    });

    it('should handle listener exceptions gracefully', () => {
      const goodListener = vi.fn();
      const badListener = vi.fn(() => {
        throw new Error('Listener error');
      });

      store.subscribe(badListener);
      store.subscribe(goodListener);

      // Should not throw
      expect(() => store.set('weatherEntity', 'weather.test', false)).not.toThrow();

      // Both should have been called
      expect(badListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
    });

    it('should call listeners for each key in update()', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.update({
        weatherEntity: 'weather.new',
        notificationTempThreshold: 25
      }, false);

      expect(listener).toHaveBeenNthCalledWith(1, 'weatherEntity', 'weather.new');
      expect(listener).toHaveBeenNthCalledWith(2, 'notificationTempThreshold', 25);
    });

    it('should be called on toggleEnabled', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.toggleEnabled('enabledRooms', 'room.test');

      expect(listener).toHaveBeenCalledWith(
        'enabledRooms',
        expect.any(Object)
      );
    });

    it('should be called on setEnabled', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setEnabled('enabledLights', 'light.test', true);

      expect(listener).toHaveBeenCalledWith(
        'enabledLights',
        expect.any(Object)
      );
    });
  });

  describe('reset()', () => {
    it('should reset to default settings', () => {
      store.set('weatherEntity', 'weather.changed', false);
      store.set('notificationTempThreshold', 99, false);

      store.reset(false);

      expect(store.get('weatherEntity')).toBe(DEFAULT_SETTINGS.weatherEntity);
      expect(store.get('notificationTempThreshold')).toBe(DEFAULT_SETTINGS.notificationTempThreshold);
    });

    it('should trigger save by default', async () => {
      store.setHass(mockHass);
      store.reset();

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dashview/save_settings'
        })
      );
    });

    it('should not trigger save when save=false', async () => {
      store.setHass(mockHass);
      store.reset(false);

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).not.toHaveBeenCalled();
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.reset(false);

      expect(listener).toHaveBeenCalledWith('_reset', true);
    });

    it('should reset all settings including complex objects', () => {
      store.set('infoTextConfig', { motion: { enabled: false } }, false);
      store.set('floorOrder', ['custom1', 'custom2'], false);
      store.set('enabledRooms', { 'room.test': true }, false);

      store.reset(false);

      expect(store.get('infoTextConfig')).toEqual(DEFAULT_SETTINGS.infoTextConfig);
      expect(store.get('floorOrder')).toEqual(DEFAULT_SETTINGS.floorOrder);
      expect(store.get('enabledRooms')).toEqual(DEFAULT_SETTINGS.enabledRooms);
    });

    it('should not affect loaded state', () => {
      store._loaded = true;
      store.reset(false);
      // Loaded state should remain (it's not part of settings)
      expect(store.loaded).toBe(true);
    });
  });

  describe('destroy()', () => {
    it('should clear pending save timer', async () => {
      store.setHass(mockHass);
      store.set('weatherEntity', 'weather.test');

      store.destroy();

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      // Should not have saved
      expect(mockHass.callWS).not.toHaveBeenCalled();
    });

    it('should clear all listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.destroy();
      store.set('weatherEntity', 'weather.test', false);

      expect(listener).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        store.destroy();
        store.destroy();
      }).not.toThrow();
    });

    it('should cancel pending debounced save on destroy', async () => {
      store.setHass(mockHass);

      // Trigger a save that will be debounced
      store.set('weatherEntity', 'weather.test');

      // Destroy before debounce completes
      store.destroy();

      // Advance timers - the pending save should be cancelled
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      // No save should have happened because timer was cleared
      const saveCalls = mockHass.callWS.mock.calls.filter(
        call => call[0].type === 'dashview/save_settings'
      );
      expect(saveCalls.length).toBe(0);
    });
  });

  describe('getSettingsStore singleton', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = getSettingsStore();
      const instance2 = getSettingsStore();
      expect(instance1).toBe(instance2);
    });

    it('should return a SettingsStore instance', () => {
      const instance = getSettingsStore();
      expect(instance).toBeInstanceOf(SettingsStore);
    });

    it('should share state across singleton calls', () => {
      const instance1 = getSettingsStore();
      instance1.set('weatherEntity', 'weather.singleton', false);

      const instance2 = getSettingsStore();
      expect(instance2.get('weatherEntity')).toBe('weather.singleton');
    });
  });

  describe('edge cases', () => {
    it('should handle very rapid successive calls', async () => {
      store.setHass(mockHass);

      for (let i = 0; i < 100; i++) {
        store.set('weatherEntity', `weather.test${i}`);
      }

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const saveCalls = mockHass.callWS.mock.calls.filter(
        call => call[0].type === 'dashview/save_settings'
      );
      expect(saveCalls.length).toBe(1);
      expect(store.get('weatherEntity')).toBe('weather.test99');
    });

    it('should handle setting same value multiple times', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.set('weatherEntity', 'weather.test', false);
      store.set('weatherEntity', 'weather.test', false);
      store.set('weatherEntity', 'weather.test', false);

      // Should call listener each time (no deduplication)
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('should handle empty string values', () => {
      store.set('weatherEntity', '', false);
      expect(store.get('weatherEntity')).toBe('');
    });

    it('should handle zero values', () => {
      store.set('notificationTempThreshold', 0, false);
      expect(store.get('notificationTempThreshold')).toBe(0);
    });

    it('should handle large objects', () => {
      const largeConfig = {};
      for (let i = 0; i < 1000; i++) {
        largeConfig[`key${i}`] = `value${i}`;
      }

      store.set('customConfig', largeConfig, false);
      expect(store.get('customConfig')).toEqual(largeConfig);
    });

    it('should handle special characters in entity IDs', () => {
      store.setHass(mockHass);
      const specialId = 'room.test-123_äöü';
      store.toggleEnabled('enabledRooms', specialId);
      expect(store.get('enabledRooms')[specialId]).toBe(true);
    });

    it('should handle concurrent load and save', async () => {
      store.setHass(mockHass);

      const loadPromise = store.load();
      store.set('weatherEntity', 'weather.concurrent');

      await loadPromise;

      // Should not throw
      expect(store.loaded).toBe(true);
    });

    it('should handle WebSocket timeout gracefully', async () => {
      const slowHass = createMockHass({
        callWS: vi.fn().mockImplementation(() => {
          return new Promise((resolve) => {
            setTimeout(() => resolve({}), 10000);
          });
        })
      });

      store.setHass(slowHass);
      const loadPromise = store.load();

      // Should not hang the test
      vi.advanceTimersByTime(100);

      // Clean up
      vi.advanceTimersByTime(10000);
      await loadPromise;
    });

    it('should handle missing error message in exceptions', async () => {
      const failingHass = createMockHass({
        callWS: vi.fn().mockRejectedValue({}) // No message property
      });
      store.setHass(failingHass);

      const result = await store.load();
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to load settings');
    });

    it('should preserve object references in settings', () => {
      const customObj = { custom: true };
      store.set('customConfig', customObj, false);
      expect(store.get('customConfig')).toBe(customObj);
    });

    it('should handle unsubscribe of non-existent listener', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();

      // Calling again should be safe
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should handle deep nesting in settings', () => {
      const deepConfig = {
        level1: {
          level2: {
            level3: {
              level4: {
                value: 'deep'
              }
            }
          }
        }
      };

      store.set('deepConfig', deepConfig, false);
      expect(store.get('deepConfig')).toEqual(deepConfig);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical user flow: load -> modify -> save', async () => {
      store.setHass(mockHass);

      // Load settings
      await store.load();
      expect(store.loaded).toBe(true);

      // Modify settings
      store.set('weatherEntity', 'weather.modified');
      store.toggleEnabled('enabledRooms', 'room.test');

      // Wait for save
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      const saveCalls = mockHass.callWS.mock.calls.filter(
        call => call[0].type === 'dashview/save_settings'
      );
      expect(saveCalls.length).toBe(1);
      expect(saveCalls[0][0].settings).toMatchObject({
        weatherEntity: 'weather.modified',
        enabledRooms: { 'room.test': true }
      });
    });

    it('should handle admin panel workflow', async () => {
      store.setHass(mockHass);
      await store.load();

      const listener = vi.fn();
      store.subscribe(listener);

      // Enable multiple entities
      store.toggleEnabled('enabledLights', 'light.1');
      store.toggleEnabled('enabledLights', 'light.2');
      store.toggleEnabled('enabledLights', 'light.3');

      // Set thresholds
      store.set('notificationTempThreshold', 24);
      store.set('notificationHumidityThreshold', 65);

      // Configure weather
      store.set('weatherEntity', 'weather.home');

      expect(listener.mock.calls.length).toBeGreaterThan(0);

      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();

      expect(mockHass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dashview/save_settings'
        })
      );
    });

    it('should handle error recovery flow', async () => {
      // Start with failing connection
      const failingHass = createMockHass({
        callWS: vi.fn().mockRejectedValue(new Error('Connection failed'))
      });
      store.setHass(failingHass);

      const result1 = await store.load();
      expect(result1.success).toBe(false);
      expect(store.hasError).toBe(true);

      // Retry with working connection
      store._loaded = false;
      store.setHass(mockHass);
      const result2 = await store.load();
      expect(result2.success).toBe(true);
      expect(store.hasError).toBe(false);
    });

    it('should handle batch updates efficiently', () => {
      store.setHass(mockHass);
      const listener = vi.fn();
      store.subscribe(listener);

      // Batch update
      store.update({
        weatherEntity: 'weather.batch',
        notificationTempThreshold: 26,
        notificationHumidityThreshold: 70,
        garbageDisplayFloor: 'floor1'
      });

      // Should notify for each change
      expect(listener).toHaveBeenCalledTimes(4);

      // But only trigger one save
      vi.advanceTimersByTime(500);

      const saveCalls = mockHass.callWS.mock.calls.filter(
        call => call[0].type === 'dashview/save_settings'
      );
      expect(saveCalls.length).toBeLessThanOrEqual(1);
    });

    it('should handle component unmount scenario', () => {
      store.setHass(mockHass);
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      store.set('weatherEntity', 'weather.test');

      // Component unmounts
      unsubscribe();
      store.destroy();

      // Should not error on further changes
      expect(() => {
        store.set('weatherEntity', 'weather.after_destroy', false);
      }).not.toThrow();

      // Listener should not be called
      expect(listener).toHaveBeenCalledTimes(1); // Only the first call
    });
  });

  describe('Draft Mode', () => {
    beforeEach(() => {
      store.setHass(mockHass);
    });

    it('should start draft with snapshot of current values', () => {
      store.set('weatherEntity', 'weather.test', false);
      store.set('notificationTempThreshold', 25, false);

      store.startDraft('test-form', ['weatherEntity', 'notificationTempThreshold']);

      expect(store.isDraftActive()).toBe(true);
      expect(store.getDraftValue('weatherEntity')).toBe('weather.test');
      expect(store.getDraftValue('notificationTempThreshold')).toBe(25);
      expect(store.hasDraftChanges()).toBe(false);
    });

    it('should update draft values without saving', () => {
      store.startDraft('test-form', ['weatherEntity']);

      store.setDraftValue('weatherEntity', 'weather.modified');

      expect(store.getDraftValue('weatherEntity')).toBe('weather.modified');
      expect(store.get('weatherEntity')).toBe('weather.forecast_home'); // Original unchanged
      expect(store.hasDraftChanges()).toBe(true);
    });

    it('should commit draft and apply changes to settings', async () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.startDraft('test-form', ['weatherEntity', 'notificationTempThreshold']);
      store.setDraftValue('weatherEntity', 'weather.committed');
      store.setDraftValue('notificationTempThreshold', 30);

      store.commitDraft();

      expect(store.get('weatherEntity')).toBe('weather.committed');
      expect(store.get('notificationTempThreshold')).toBe(30);
      expect(store.isDraftActive()).toBe(false);

      // Should have triggered listeners
      expect(listener).toHaveBeenCalledWith('weatherEntity', 'weather.committed');
      expect(listener).toHaveBeenCalledWith('notificationTempThreshold', 30);

      // Should have triggered save
      vi.advanceTimersByTime(500);
      await vi.runAllTimersAsync();
      expect(mockHass.callWS).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'dashview/save_settings'
        })
      );
    });

    it('should discard draft and restore original values', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.set('weatherEntity', 'weather.original', false);
      store.startDraft('test-form', ['weatherEntity']);
      store.setDraftValue('weatherEntity', 'weather.modified');

      store.discardDraft();

      expect(store.get('weatherEntity')).toBe('weather.original');
      expect(store.isDraftActive()).toBe(false);
      expect(listener).toHaveBeenCalledWith('_draftDiscarded', true);
    });

    it('should detect changes correctly', () => {
      store.startDraft('test-form', ['weatherEntity']);

      expect(store.hasDraftChanges()).toBe(false);

      store.setDraftValue('weatherEntity', 'weather.changed');
      expect(store.hasDraftChanges()).toBe(true);

      // Change back to original
      store.setDraftValue('weatherEntity', 'weather.forecast_home');
      expect(store.hasDraftChanges()).toBe(false);
    });

    it('should handle complex object values in draft', () => {
      const complexValue = {
        motion: { enabled: true },
        garage: { enabled: false }
      };

      store.set('infoTextConfig', complexValue, false);
      store.startDraft('test-form', ['infoTextConfig']);

      const modifiedValue = {
        motion: { enabled: false },
        garage: { enabled: true }
      };
      store.setDraftValue('infoTextConfig', modifiedValue);

      expect(store.hasDraftChanges()).toBe(true);
      expect(store.getDraftValue('infoTextConfig')).toEqual(modifiedValue);
      expect(store.get('infoTextConfig')).toEqual(complexValue);
    });

    it('should notify listeners on draft changes', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.startDraft('test-form', ['weatherEntity']);
      listener.mockClear();

      store.setDraftValue('weatherEntity', 'weather.test');

      expect(listener).toHaveBeenCalledWith('_draft', expect.objectContaining({
        hasChanges: true
      }));
    });

    it('should do nothing when setting draft value without active draft', () => {
      expect(() => {
        store.setDraftValue('weatherEntity', 'weather.test');
      }).not.toThrow();

      expect(store.get('weatherEntity')).toBe('weather.forecast_home');
    });

    it('should return null for getDraftValue when no draft active', () => {
      expect(store.getDraftValue('weatherEntity')).toBe(null);
    });

    it('should handle array values in draft', () => {
      const arrayValue = ['floor1', 'floor2', 'floor3'];
      store.set('floorOrder', arrayValue, false);
      store.startDraft('test-form', ['floorOrder']);

      const modifiedArray = ['floor3', 'floor1', 'floor2'];
      store.setDraftValue('floorOrder', modifiedArray);

      expect(store.getDraftValue('floorOrder')).toEqual(modifiedArray);
      expect(store.get('floorOrder')).toEqual(arrayValue);
      expect(store.hasDraftChanges()).toBe(true);
    });

    it('should use structuredClone to avoid mutation', () => {
      const originalValue = { test: { nested: 'value' } };
      store.set('customConfig', originalValue, false);
      store.startDraft('test-form', ['customConfig']);

      const draftValue = store.getDraftValue('customConfig');
      draftValue.test.nested = 'modified';

      // Original should not be affected
      expect(store.get('customConfig').test.nested).toBe('value');
    });
  });
});
