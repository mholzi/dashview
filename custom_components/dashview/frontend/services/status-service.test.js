/**
 * Status Service Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getWaterLeakStatus, getAlarmStatus } from './status-service.js';

// Mock the i18n function — supports 2-arg and 3-arg forms
vi.mock('../utils/i18n.js', () => ({
  t: (key, fallbackOrParams = null, fallbackWhenParams = null) => {
    const translations = {
      'status.water.noLeaks': 'No leaks detected',
      'status.water.leakDetected': 'LEAK DETECTED',
      'status.water.leaksDetected': 'leaks detected',
      'status.water.inLocation': `in ${typeof fallbackOrParams === 'object' ? fallbackOrParams?.location || '' : ''}`,
      'status.alarm.prefix': 'Alarm is',
      'status.alarm.disarmed': 'disarmed',
      'status.alarm.armed_home': 'armed (Home)',
      'status.alarm.armed_away': 'armed (Away)',
      'status.alarm.armed_night': 'armed (Night)',
      'status.alarm.triggered': 'ALARM TRIGGERED',
      'status.alarm.arming': 'arming…',
      'status.alarm.pending': 'pending…',
      'status.alarm.triggered_banner': 'ALARM TRIGGERED — Tap to view',
    };
    if (translations[key] !== undefined) return translations[key];
    // Fallback logic matching real t()
    if (typeof fallbackOrParams === 'string') return fallbackOrParams;
    return fallbackWhenParams ?? key;
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

describe('getAlarmStatus', () => {
  const makeHass = (entityId, state, attrs = {}) => ({
    states: {
      [entityId]: {
        state,
        attributes: attrs,
        last_changed: '2026-02-05T12:00:00Z',
      },
    },
  });

  const enabledConfig = { alarm: { enabled: true } };
  const disabledConfig = { alarm: { enabled: false } };
  const alarmEntity = 'alarm_control_panel.home';

  describe('when alarm feature is disabled', () => {
    it('returns null when alarm is not enabled', () => {
      const hass = makeHass(alarmEntity, 'disarmed');
      expect(getAlarmStatus(hass, disabledConfig, alarmEntity)).toBeNull();
    });

    it('returns null when hass is null', () => {
      expect(getAlarmStatus(null, enabledConfig, alarmEntity)).toBeNull();
    });
  });

  describe('when entity is missing', () => {
    it('returns null when entity does not exist in hass', () => {
      const hass = { states: {} };
      expect(getAlarmStatus(hass, enabledConfig, alarmEntity)).toBeNull();
    });
  });

  describe('auto-detection', () => {
    it('auto-detects alarm entity when none provided', () => {
      const hass = makeHass('alarm_control_panel.auto', 'disarmed');
      const result = getAlarmStatus(hass, enabledConfig, null);
      expect(result).not.toBeNull();
      expect(result.state).toBe('disarmed');
    });

    it('returns null when no alarm entity exists and none provided', () => {
      const hass = { states: { 'light.bedroom': { state: 'on' } } };
      expect(getAlarmStatus(hass, enabledConfig, null)).toBeNull();
    });
  });

  describe('state mapping', () => {
    it('maps disarmed state correctly', () => {
      const hass = makeHass(alarmEntity, 'disarmed');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.state).toBe('disarmed');
      expect(result.prefixText).toBe('Alarm is');
      expect(result.badgeText).toBe('disarmed');
      expect(result.emoji).toBe('🛡️');
      expect(result.isWarning).toBe(false);
      expect(result.isCritical).toBe(false);
      expect(result.clickAction).toBe('security');
      expect(result.alertId).toBeNull();
    });

    it('maps armed_home state correctly', () => {
      const hass = makeHass(alarmEntity, 'armed_home');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.state).toBe('armed_home');
      expect(result.prefixText).toBe('Alarm is');
      expect(result.badgeText).toBe('armed (Home)');
      expect(result.isWarning).toBe(false);
    });

    it('maps armed_away state correctly', () => {
      const hass = makeHass(alarmEntity, 'armed_away');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.badgeText).toBe('armed (Away)');
    });

    it('maps armed_night state correctly', () => {
      const hass = makeHass(alarmEntity, 'armed_night');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.badgeText).toBe('armed (Night)');
    });

    it('maps triggered state with critical flags', () => {
      const hass = makeHass(alarmEntity, 'triggered');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.state).toBe('triggered');
      expect(result.prefixText).toBe('⚠️');
      expect(result.badgeText).toBe('ALARM TRIGGERED');
      expect(result.emoji).toBe('🚨');
      expect(result.isWarning).toBe(true);
      expect(result.isCritical).toBe(true);
      expect(result.priority).toBe(100);
      expect(result.alertId).toBe(`alarm:${alarmEntity}`);
    });

    it('maps arming state correctly', () => {
      const hass = makeHass(alarmEntity, 'arming');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.state).toBe('arming');
      expect(result.prefixText).toBe('Alarm is');
      expect(result.badgeText).toBe('arming…');
      expect(result.isWarning).toBe(false);
    });

    it('maps pending state with warning flag', () => {
      const hass = makeHass(alarmEntity, 'pending');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.state).toBe('pending');
      expect(result.prefixText).toBe('Alarm is');
      expect(result.badgeText).toBe('pending…');
      expect(result.isWarning).toBe(true);
      expect(result.priority).toBe(90);
    });

    it('returns null for unknown alarm state', () => {
      const hass = makeHass(alarmEntity, 'unknown_state');
      expect(getAlarmStatus(hass, enabledConfig, alarmEntity)).toBeNull();
    });
  });

  describe('returned metadata', () => {
    it('includes entityLastChanged', () => {
      const hass = makeHass(alarmEntity, 'disarmed');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.entityLastChanged).toBe('2026-02-05T12:00:00Z');
    });

    it('non-triggered states have default priority 50', () => {
      const hass = makeHass(alarmEntity, 'armed_away');
      const result = getAlarmStatus(hass, enabledConfig, alarmEntity);
      expect(result.priority).toBe(50);
    });
  });
});
