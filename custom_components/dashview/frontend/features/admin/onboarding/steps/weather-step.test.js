/**
 * Weather Step Tests
 * Tests for weather entity selection step
 */

import { describe, it, expect, vi } from 'vitest';
import {
  weatherStepStyles,
  getWeatherEntities,
  getWeatherSelection,
  saveWeatherEntity
} from './weather-step.js';

// Mock the shared module
vi.mock('../../shared.js', () => ({
  t: (key, fallback) => fallback
}));

// Mock stores
vi.mock('../../../../stores/index.js', () => ({
  getSettingsStore: vi.fn(() => ({
    settings: {},
    subscribe: vi.fn(),
    updateSettings: vi.fn()
  }))
}));

describe('Weather Step', () => {
  describe('weatherStepStyles', () => {
    it('should export styles string', () => {
      expect(weatherStepStyles).toBeDefined();
      expect(typeof weatherStepStyles).toBe('string');
    });

    it('should contain weather step container class', () => {
      expect(weatherStepStyles).toContain('.dv-weather-step');
    });

    it('should contain weather entity class', () => {
      expect(weatherStepStyles).toContain('.dv-weather-entity');
    });

    it('should contain selected state styling', () => {
      expect(weatherStepStyles).toContain('.dv-weather-entity.selected');
    });

    it('should contain preview section class', () => {
      expect(weatherStepStyles).toContain('.dv-weather-preview');
    });

    it('should use CSS custom properties with dv prefix', () => {
      expect(weatherStepStyles).toContain('--dv-');
    });
  });

  describe('getWeatherEntities', () => {
    it('should return empty array when hass is null', () => {
      const result = getWeatherEntities(null);
      expect(result).toEqual([]);
    });

    it('should return empty array when hass.states is null', () => {
      const result = getWeatherEntities({ states: null });
      expect(result).toEqual([]);
    });

    it('should return empty array when no weather entities exist', () => {
      const mockHass = {
        states: {
          'light.living_room': { state: 'on' },
          'sensor.temperature': { state: '22' }
        }
      };
      const result = getWeatherEntities(mockHass);
      expect(result).toEqual([]);
    });

    it('should return weather entities', () => {
      const mockHass = {
        states: {
          'weather.home': {
            state: 'sunny',
            attributes: {
              friendly_name: 'Home Weather',
              temperature: 22,
              temperature_unit: '°C'
            }
          },
          'light.living_room': { state: 'on' }
        }
      };
      const result = getWeatherEntities(mockHass);
      expect(result).toHaveLength(1);
      expect(result[0].entityId).toBe('weather.home');
      expect(result[0].friendlyName).toBe('Home Weather');
      expect(result[0].condition).toBe('sunny');
      expect(result[0].temperature).toBe(22);
    });

    it('should return multiple weather entities sorted by name', () => {
      const mockHass = {
        states: {
          'weather.backyard': {
            state: 'cloudy',
            attributes: {
              friendly_name: 'Backyard',
              temperature: 18
            }
          },
          'weather.home': {
            state: 'sunny',
            attributes: {
              friendly_name: 'Home',
              temperature: 22
            }
          }
        }
      };
      const result = getWeatherEntities(mockHass);
      expect(result).toHaveLength(2);
      expect(result[0].friendlyName).toBe('Backyard');
      expect(result[1].friendlyName).toBe('Home');
    });

    it('should use entity_id as fallback for friendly_name', () => {
      const mockHass = {
        states: {
          'weather.unknown': {
            state: 'rainy',
            attributes: {}
          }
        }
      };
      const result = getWeatherEntities(mockHass);
      expect(result[0].friendlyName).toBe('weather.unknown');
    });
  });

  describe('getWeatherSelection', () => {
    it('should return null when no wizard state exists', () => {
      const mockPanel = {};
      const result = getWeatherSelection(mockPanel);
      expect(result).toBeNull();
    });

    it('should return null when selectedEntity is undefined', () => {
      const mockPanel = {
        _wizardWeatherState: {}
      };
      const result = getWeatherSelection(mockPanel);
      expect(result).toBeNull();
    });

    it('should return selected entity from wizard state', () => {
      const mockPanel = {
        _wizardWeatherState: {
          selectedEntity: 'weather.home'
        }
      };
      const result = getWeatherSelection(mockPanel);
      expect(result).toBe('weather.home');
    });
  });

  describe('saveWeatherEntity', () => {
    it('should call updateSettings with weather entity', () => {
      const mockUpdateSettings = vi.fn();
      const mockSettingsStore = {
        settings: {},
        updateSettings: mockUpdateSettings
      };

      saveWeatherEntity('weather.home', mockSettingsStore);

      expect(mockUpdateSettings).toHaveBeenCalled();
      const updatedSettings = mockUpdateSettings.mock.calls[0][0];
      expect(updatedSettings.weatherEntity).toBe('weather.home');
    });

    it('should save null when no entity selected', () => {
      const mockUpdateSettings = vi.fn();
      const mockSettingsStore = {
        settings: {},
        updateSettings: mockUpdateSettings
      };

      saveWeatherEntity(null, mockSettingsStore);

      const updatedSettings = mockUpdateSettings.mock.calls[0][0];
      expect(updatedSettings.weatherEntity).toBeNull();
    });

    it('should preserve existing settings', () => {
      const mockUpdateSettings = vi.fn();
      const mockSettingsStore = {
        settings: { existingKey: 'value' },
        updateSettings: mockUpdateSettings
      };

      saveWeatherEntity('weather.home', mockSettingsStore);

      const updatedSettings = mockUpdateSettings.mock.calls[0][0];
      expect(updatedSettings.existingKey).toBe('value');
      expect(updatedSettings.weatherEntity).toBe('weather.home');
    });

    it('should handle errors gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockSettingsStore = {
        settings: null,
        updateSettings: vi.fn(() => { throw new Error('Test error'); })
      };

      expect(() => {
        saveWeatherEntity('weather.home', mockSettingsStore);
      }).not.toThrow();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
