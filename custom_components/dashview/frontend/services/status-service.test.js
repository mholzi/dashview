/**
 * Status Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWaterLeakStatus } from './status-service.js';

// Mock the i18n function
vi.mock('../utils/i18n.js', () => ({
  t: (key, params) => {
    const translations = {
      'status.water.noLeaks': 'No leaks detected',
      'status.water.leakDetected': 'LEAK DETECTED',
      'status.water.leaksDetected': 'leaks detected',
      'status.water.inLocation': `in ${params?.location || ''}`,
    };
    return translations[key] || key;
  }
}));

describe('getWaterLeakStatus', () => {
  describe('when water feature is disabled', () => {
    it('returns null when infoTextConfig.water is not enabled', () => {
      const hass = { states: {} };
      const infoTextConfig = { water: { enabled: false } };
      const enabledWaterLeakSensors = {};

      const result = getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors);

      expect(result).toBeNull();
    });

    it('returns null when infoTextConfig.water is undefined', () => {
      const hass = { states: {} };
      const infoTextConfig = {};
      const enabledWaterLeakSensors = {};

      const result = getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors);

      expect(result).toBeNull();
    });
  });

  describe('when no water leak sensors are enabled', () => {
    it('returns null when enabledWaterLeakSensors is empty', () => {
      const hass = {
        states: {
          'binary_sensor.kitchen_leak': {
            state: 'off',
            attributes: { device_class: 'moisture', friendly_name: 'Kitchen Leak Sensor' }
          }
        }
      };
      const infoTextConfig = { water: { enabled: true } };
      const enabledWaterLeakSensors = {};

      const result = getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors);

      expect(result).toBeNull();
    });
  });

  describe('when all sensors are dry', () => {
    it('returns ok status with no leaks message', () => {
      const hass = {
        states: {
          'binary_sensor.kitchen_leak': {
            state: 'off',
            attributes: { device_class: 'moisture', friendly_name: 'Kitchen Leak Sensor' },
            last_changed: new Date().toISOString()
          }
        }
      };
      const infoTextConfig = { water: { enabled: true } };
      const enabledWaterLeakSensors = { 'binary_sensor.kitchen_leak': true };

      const result = getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors);

      expect(result).not.toBeNull();
      expect(result.state).toBe('ok');
      expect(result.emoji).toBe('💧');
    });
  });

  describe('when one sensor detects a leak', () => {
    it('returns alert status with leak detected message', () => {
      const hass = {
        states: {
          'binary_sensor.kitchen_leak': {
            state: 'on',
            attributes: { device_class: 'moisture', friendly_name: 'Kitchen Leak Sensor' },
            last_changed: new Date().toISOString()
          }
        }
      };
      const infoTextConfig = { water: { enabled: true } };
      const enabledWaterLeakSensors = { 'binary_sensor.kitchen_leak': true };

      const result = getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors);

      expect(result).not.toBeNull();
      expect(result.state).toBe('alert');
      expect(result.emoji).toBe('💧');
      expect(result.clickAction).toBe('water');
    });
  });

  describe('when multiple sensors detect leaks', () => {
    it('returns alert status with count of leaks', () => {
      const hass = {
        states: {
          'binary_sensor.kitchen_leak': {
            state: 'on',
            attributes: { device_class: 'moisture', friendly_name: 'Kitchen Leak Sensor' },
            last_changed: new Date().toISOString()
          },
          'binary_sensor.bathroom_leak': {
            state: 'on',
            attributes: { device_class: 'moisture', friendly_name: 'Bathroom Leak Sensor' },
            last_changed: new Date().toISOString()
          },
          'binary_sensor.basement_leak': {
            state: 'off',
            attributes: { device_class: 'moisture', friendly_name: 'Basement Leak Sensor' },
            last_changed: new Date().toISOString()
          }
        }
      };
      const infoTextConfig = { water: { enabled: true } };
      const enabledWaterLeakSensors = {
        'binary_sensor.kitchen_leak': true,
        'binary_sensor.bathroom_leak': true,
        'binary_sensor.basement_leak': true
      };

      const result = getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors);

      expect(result).not.toBeNull();
      expect(result.state).toBe('alert');
      expect(result.badgeText).toContain('2');
    });
  });

  describe('with label filtering', () => {
    it('filters sensors by label when labelId is provided', () => {
      const hass = {
        states: {
          'binary_sensor.kitchen_leak': {
            state: 'on',
            attributes: { device_class: 'moisture', friendly_name: 'Kitchen Leak Sensor' },
            last_changed: new Date().toISOString()
          },
          'binary_sensor.bathroom_leak': {
            state: 'off',
            attributes: { device_class: 'moisture', friendly_name: 'Bathroom Leak Sensor' },
            last_changed: new Date().toISOString()
          }
        }
      };
      const infoTextConfig = { water: { enabled: true } };
      const enabledWaterLeakSensors = {
        'binary_sensor.kitchen_leak': true,
        'binary_sensor.bathroom_leak': true
      };
      const labelId = 'water_label';
      const entityHasLabel = (entityId, label) => entityId === 'binary_sensor.bathroom_leak';

      const result = getWaterLeakStatus(hass, infoTextConfig, enabledWaterLeakSensors, labelId, entityHasLabel);

      // Only bathroom_leak has the label, and it's off, so should be ok
      expect(result).not.toBeNull();
      expect(result.state).toBe('ok');
    });
  });
});
