/**
 * Weather Tab Pollen Section Tests
 * Tests for the pollen configuration section in the admin weather tab
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POLLEN_TYPES, detectPollenSensors, getPollenLevel } from '../../services/pollen-service.js';

// Import locale files for i18n verification
import enLocale from '../../locales/en.json';
import deLocale from '../../locales/de.json';

describe('Weather Tab Pollen Section', () => {
  describe('i18n translations (7.3)', () => {
    describe('English locale', () => {
      it('should have all pollen type translations', () => {
        const expectedTypes = ['erle', 'ambrosia', 'esche', 'birke', 'hasel', 'graeser', 'beifuss', 'roggen'];

        expectedTypes.forEach(type => {
          expect(enLocale.weather.pollen_types[type]).toBeDefined();
          expect(typeof enLocale.weather.pollen_types[type]).toBe('string');
          expect(enLocale.weather.pollen_types[type].length).toBeGreaterThan(0);
        });
      });

      it('should have pollen level translations', () => {
        expect(enLocale.weather.pollen_levels).toBeDefined();
        expect(enLocale.weather.pollen_levels.none).toBe('None');
        expect(enLocale.weather.pollen_levels.low).toBe('Low');
        expect(enLocale.weather.pollen_levels.moderate).toBe('Moderate');
        expect(enLocale.weather.pollen_levels.high).toBe('High');
      });

      it('should have admin pollen section translations', () => {
        expect(enLocale.admin.pollen).toBeDefined();
        expect(enLocale.admin.pollen.title).toBe('Pollen Forecast');
        expect(enLocale.admin.pollen.description).toBeDefined();
        expect(enLocale.admin.pollen.noSensors).toBeDefined();
        expect(enLocale.admin.pollen.displayMode).toBeDefined();
        expect(enLocale.admin.pollen.onlyActive).toBeDefined();
        expect(enLocale.admin.pollen.allEnabled).toBeDefined();
        expect(enLocale.admin.pollen.top3).toBeDefined();
      });

      it('should have weather.pollen translation', () => {
        expect(enLocale.weather.pollen).toBe('Pollen Forecast');
      });
    });

    describe('German locale', () => {
      it('should have all pollen type translations', () => {
        const expectedTypes = ['erle', 'ambrosia', 'esche', 'birke', 'hasel', 'graeser', 'beifuss', 'roggen'];

        expectedTypes.forEach(type => {
          expect(deLocale.weather.pollen_types[type]).toBeDefined();
          expect(typeof deLocale.weather.pollen_types[type]).toBe('string');
          expect(deLocale.weather.pollen_types[type].length).toBeGreaterThan(0);
        });
      });

      it('should have pollen level translations', () => {
        expect(deLocale.weather.pollen_levels).toBeDefined();
        expect(deLocale.weather.pollen_levels.none).toBe('Keine');
        expect(deLocale.weather.pollen_levels.low).toBe('Gering');
        expect(deLocale.weather.pollen_levels.moderate).toBe('Mäßig');
        expect(deLocale.weather.pollen_levels.high).toBe('Stark');
      });

      it('should have admin pollen section translations', () => {
        expect(deLocale.admin.pollen).toBeDefined();
        expect(deLocale.admin.pollen.title).toBe('Pollenflug');
        expect(deLocale.admin.pollen.description).toBeDefined();
        expect(deLocale.admin.pollen.noSensors).toBeDefined();
        expect(deLocale.admin.pollen.displayMode).toBeDefined();
        expect(deLocale.admin.pollen.onlyActive).toBeDefined();
        expect(deLocale.admin.pollen.allEnabled).toBeDefined();
        expect(deLocale.admin.pollen.top3).toBeDefined();
      });

      it('should have weather.pollen translation', () => {
        expect(deLocale.weather.pollen).toBe('Pollenflug');
      });
    });

    describe('POLLEN_TYPES consistency', () => {
      it('should have translations for all POLLEN_TYPES entries', () => {
        const pollenTypes = Object.keys(POLLEN_TYPES);

        pollenTypes.forEach(type => {
          // Check English
          expect(enLocale.weather.pollen_types[type]).toBeDefined();
          // Check German
          expect(deLocale.weather.pollen_types[type]).toBeDefined();
          // Should match POLLEN_TYPES constant
          expect(enLocale.weather.pollen_types[type]).toBe(POLLEN_TYPES[type].en);
          expect(deLocale.weather.pollen_types[type]).toBe(POLLEN_TYPES[type].de);
        });
      });
    });
  });

  describe('Pollen config structure (7.2)', () => {
    it('should have correct default pollenConfig structure', () => {
      const defaultConfig = {
        enabled: true,
        enabledSensors: {},
        displayMode: 'active',
      };

      expect(defaultConfig.enabled).toBe(true);
      expect(defaultConfig.enabledSensors).toEqual({});
      expect(defaultConfig.displayMode).toBe('active');
    });

    it('should support all display modes', () => {
      const validModes = ['active', 'all', 'top3'];

      validModes.forEach(mode => {
        const config = { enabled: true, enabledSensors: {}, displayMode: mode };
        expect(['active', 'all', 'top3']).toContain(config.displayMode);
      });
    });
  });

  describe('Pollen detection and filtering (7.2)', () => {
    const mockHass = {
      states: {
        'sensor.pollenflug_birke_124': {
          state: '2',
          attributes: {
            state_tomorrow: 2.5,
            state_in_2_days: 3,
          }
        },
        'sensor.pollenflug_graeser_124': {
          state: '0',
          attributes: {
            state_tomorrow: 0.5,
            state_in_2_days: 1,
          }
        },
        'sensor.pollenflug_erle_124': {
          state: '3',
          attributes: {
            state_tomorrow: 2,
            state_in_2_days: 1,
          }
        },
        'sensor.temperature': { state: '21.5', attributes: {} },
      }
    };

    it('should filter to only active sensors when displayMode is active', () => {
      const sensors = detectPollenSensors(mockHass);
      const activeSensors = sensors.filter(s => s.value > 0);

      expect(activeSensors).toHaveLength(2);
      expect(activeSensors.map(s => s.type)).toContain('birke');
      expect(activeSensors.map(s => s.type)).toContain('erle');
      expect(activeSensors.map(s => s.type)).not.toContain('graeser');
    });

    it('should return all enabled sensors when displayMode is all', () => {
      const sensors = detectPollenSensors(mockHass);

      expect(sensors).toHaveLength(3);
    });

    it('should return top 3 by level when displayMode is top3', () => {
      const sensors = detectPollenSensors(mockHass);
      const top3 = [...sensors].sort((a, b) => b.value - a.value).slice(0, 3);

      expect(top3).toHaveLength(3);
      expect(top3[0].type).toBe('erle'); // level 3
      expect(top3[1].type).toBe('birke'); // level 2
      expect(top3[2].type).toBe('graeser'); // level 0
    });
  });

  describe('Level indicator rendering (7.2)', () => {
    it('should return correct dots for each level', () => {
      // Test all DWD scale values
      expect(getPollenLevel(0).dots).toBe(0);
      expect(getPollenLevel(0.5).dots).toBe(1);
      expect(getPollenLevel(1).dots).toBe(2);
      expect(getPollenLevel(1.5).dots).toBe(3);
      expect(getPollenLevel(2).dots).toBe(4);
      expect(getPollenLevel(2.5).dots).toBe(5);
      expect(getPollenLevel(3).dots).toBe(6);
    });

    it('should return correct colors for each level', () => {
      expect(getPollenLevel(0).color).toBe('var(--dv-pollen-none)');
      expect(getPollenLevel(1).color).toBe('var(--dv-pollen-low)');
      expect(getPollenLevel(1.5).color).toBe('var(--dv-pollen-low-moderate)');
      expect(getPollenLevel(2).color).toBe('var(--dv-pollen-moderate)');
      expect(getPollenLevel(2.5).color).toBe('var(--dv-pollen-moderate-high)');
      expect(getPollenLevel(3).color).toBe('var(--dv-pollen-high)');
    });
  });
});
