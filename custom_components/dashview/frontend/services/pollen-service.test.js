/**
 * Pollen Service Tests
 * Tests for DWD Pollenflug integration
 */
import { describe, it, expect, vi } from 'vitest';
import {
  DWD_POLLEN_PATTERN,
  POLLEN_TYPES,
  detectPollenSensors,
  getPollenLevel,
  getPollenTrend,
} from './pollen-service.js';

describe('DWD_POLLEN_PATTERN', () => {
  it('matches valid DWD pollen sensor entity IDs', () => {
    expect(DWD_POLLEN_PATTERN.test('sensor.pollenflug_birke_124')).toBe(true);
    expect(DWD_POLLEN_PATTERN.test('sensor.pollenflug_graeser_124')).toBe(true);
    expect(DWD_POLLEN_PATTERN.test('sensor.pollenflug_ambrosia_42')).toBe(true);
  });

  it('does not match non-pollen sensors', () => {
    expect(DWD_POLLEN_PATTERN.test('sensor.temperature_living_room')).toBe(false);
    expect(DWD_POLLEN_PATTERN.test('sensor.pollenflug')).toBe(false);
    expect(DWD_POLLEN_PATTERN.test('binary_sensor.pollenflug_birke_124')).toBe(false);
  });

  it('extracts pollen type and region from entity ID', () => {
    const match = 'sensor.pollenflug_birke_124'.match(DWD_POLLEN_PATTERN);
    expect(match[1]).toBe('birke');
    expect(match[2]).toBe('124');
  });
});

describe('POLLEN_TYPES', () => {
  it('contains all 8 DWD pollen types', () => {
    const expectedTypes = ['erle', 'ambrosia', 'esche', 'birke', 'hasel', 'graeser', 'beifuss', 'roggen'];
    expectedTypes.forEach(type => {
      expect(POLLEN_TYPES[type]).toBeDefined();
      expect(POLLEN_TYPES[type].icon).toBeDefined();
      expect(POLLEN_TYPES[type].en).toBeDefined();
      expect(POLLEN_TYPES[type].de).toBeDefined();
    });
  });
});

describe('detectPollenSensors', () => {
  it('returns empty array when no pollen sensors exist', () => {
    const hass = {
      states: {
        'sensor.temperature': { state: '21.5', attributes: {} },
        'light.living_room': { state: 'on', attributes: {} },
      }
    };

    const result = detectPollenSensors(hass);
    expect(result).toEqual([]);
  });

  it('detects pollen sensors by standard entity ID pattern', () => {
    const hass = {
      states: {
        'sensor.pollenflug_birke_124': {
          state: '2',
          attributes: {
            state_tomorrow: 2.5,
            state_in_2_days: 3,
            state_today_desc: 'Mäßig',
            friendly_name: 'Pollenflug Birke 124',
          }
        },
        'sensor.pollenflug_graeser_124': {
          state: '1.5',
          attributes: {
            state_tomorrow: 1,
            state_in_2_days: 0.5,
            state_today_desc: 'Gering bis mäßig',
            friendly_name: 'Pollenflug Gräser 124',
          }
        },
        'sensor.temperature': { state: '21.5', attributes: {} },
      }
    };

    const result = detectPollenSensors(hass);

    expect(result).toHaveLength(2);
    expect(result[0].entityId).toBe('sensor.pollenflug_birke_124');
    expect(result[0].type).toBe('birke');
    expect(result[0].region).toBe('124');
    expect(result[0].value).toBe(2);
    expect(result[0].tomorrow).toBe(2.5);
    expect(result[0].dayAfter).toBe(3);
  });

  it('detects renamed sensors by attributes (attribute-based detection)', () => {
    const hass = {
      states: {
        // Renamed entity - no longer matches pattern
        'sensor.my_birch_pollen': {
          state: '2.5',
          attributes: {
            state_tomorrow: 3,
            state_in_2_days: 2,
            friendly_name: 'My Birch Pollen Sensor',
          }
        },
        // Another renamed entity with German name
        'sensor.graeser_allergie': {
          state: '1',
          attributes: {
            state_tomorrow: 1.5,
            state_in_2_days: 2,
            friendly_name: 'Gräser Allergie Sensor',
          }
        },
        'sensor.temperature': { state: '21.5', attributes: {} },
      }
    };

    const result = detectPollenSensors(hass);

    expect(result).toHaveLength(2);

    // Should detect birke from "birch" in entity ID
    const birke = result.find(s => s.type === 'birke');
    expect(birke).toBeDefined();
    expect(birke.value).toBe(2.5);

    // Should detect graeser from "graeser" in entity ID
    const graeser = result.find(s => s.type === 'graeser');
    expect(graeser).toBeDefined();
    expect(graeser.value).toBe(1);
  });

  it('detects sensors by friendly_name when entity ID has no type info', () => {
    const hass = {
      states: {
        'sensor.pollen_sensor_1': {
          state: '2',
          attributes: {
            state_tomorrow: 2.5,
            state_in_2_days: 3,
            friendly_name: 'Hazel Pollen Frankfurt',
          }
        },
      }
    };

    const result = detectPollenSensors(hass);

    expect(result).toHaveLength(1);
    expect(result[0].type).toBe('hasel'); // Detected from "Hazel" in friendly_name
  });

  it('skips sensors without required DWD attributes', () => {
    const hass = {
      states: {
        // Missing state_in_2_days - not a valid DWD sensor
        'sensor.fake_pollen': {
          state: '2',
          attributes: {
            state_tomorrow: 2.5,
            // missing state_in_2_days
          }
        },
        // Valid DWD sensor
        'sensor.pollenflug_birke_124': {
          state: '2',
          attributes: {
            state_tomorrow: 2.5,
            state_in_2_days: 3,
          }
        },
      }
    };

    const result = detectPollenSensors(hass);

    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe('sensor.pollenflug_birke_124');
  });

  it('skips sensors with out-of-range state values', () => {
    const hass = {
      states: {
        // State value too high - not a valid pollen sensor
        'sensor.weird_sensor': {
          state: '100',
          attributes: {
            state_tomorrow: 2.5,
            state_in_2_days: 3,
          }
        },
        // Valid DWD sensor
        'sensor.pollenflug_birke_124': {
          state: '2',
          attributes: {
            state_tomorrow: 2.5,
            state_in_2_days: 3,
          }
        },
      }
    };

    const result = detectPollenSensors(hass);

    expect(result).toHaveLength(1);
    expect(result[0].entityId).toBe('sensor.pollenflug_birke_124');
  });

  it('includes friendlyName in returned sensor objects', () => {
    const hass = {
      states: {
        'sensor.pollenflug_birke_124': {
          state: '2',
          attributes: {
            state_tomorrow: 2.5,
            state_in_2_days: 3,
            friendly_name: 'Birke Pollen Frankfurt',
          }
        },
      }
    };

    const result = detectPollenSensors(hass);

    expect(result[0].friendlyName).toBe('Birke Pollen Frankfurt');
  });

  it('returns empty array when hass is not provided', () => {
    expect(detectPollenSensors(null)).toEqual([]);
    expect(detectPollenSensors(undefined)).toEqual([]);
  });
});

describe('getPollenLevel', () => {
  it('returns correct level for value 0 (none)', () => {
    const result = getPollenLevel(0);
    expect(result.level).toBe('none');
    expect(result.dots).toBe(0);
    expect(result.color).toBe('var(--dv-pollen-none)');
  });

  it('returns correct level for value 0.5 (none to low)', () => {
    const result = getPollenLevel(0.5);
    expect(result.level).toBe('none-low');
    expect(result.dots).toBe(1);
    expect(result.color).toBe('var(--dv-pollen-none)');
  });

  it('returns correct level for value 1 (low)', () => {
    const result = getPollenLevel(1);
    expect(result.level).toBe('low');
    expect(result.dots).toBe(2);
    expect(result.color).toBe('var(--dv-pollen-low)');
  });

  it('returns correct level for value 1.5 (low to moderate)', () => {
    const result = getPollenLevel(1.5);
    expect(result.level).toBe('low-moderate');
    expect(result.dots).toBe(3);
    expect(result.color).toBe('var(--dv-pollen-low-moderate)');
  });

  it('returns correct level for value 2 (moderate)', () => {
    const result = getPollenLevel(2);
    expect(result.level).toBe('moderate');
    expect(result.dots).toBe(4);
    expect(result.color).toBe('var(--dv-pollen-moderate)');
  });

  it('returns correct level for value 2.5 (moderate to high)', () => {
    const result = getPollenLevel(2.5);
    expect(result.level).toBe('moderate-high');
    expect(result.dots).toBe(5);
    expect(result.color).toBe('var(--dv-pollen-moderate-high)');
  });

  it('returns correct level for value 3 (high)', () => {
    const result = getPollenLevel(3);
    expect(result.level).toBe('high');
    expect(result.dots).toBe(6);
    expect(result.color).toBe('var(--dv-pollen-high)');
  });

  it('handles values above 3', () => {
    const result = getPollenLevel(3.5);
    expect(result.level).toBe('high');
    expect(result.dots).toBe(6);
  });

  it('handles edge cases at boundaries', () => {
    expect(getPollenLevel(0.4).dots).toBe(0);
    expect(getPollenLevel(0.5).dots).toBe(1);
    expect(getPollenLevel(0.9).dots).toBe(1);
    expect(getPollenLevel(1.0).dots).toBe(2);
    expect(getPollenLevel(2.4).dots).toBe(4);
    expect(getPollenLevel(2.5).dots).toBe(5);
  });
});

describe('getPollenTrend', () => {
  it('returns "up" when tomorrow is significantly higher', () => {
    expect(getPollenTrend(1, 2)).toBe('up');
    expect(getPollenTrend(0, 1)).toBe('up');
    expect(getPollenTrend(1.5, 2.5)).toBe('up');
  });

  it('returns "down" when tomorrow is significantly lower', () => {
    expect(getPollenTrend(2, 1)).toBe('down');
    expect(getPollenTrend(3, 2)).toBe('down');
    expect(getPollenTrend(2.5, 1.5)).toBe('down');
  });

  it('returns "same" when values are within 0.5 threshold', () => {
    expect(getPollenTrend(1, 1)).toBe('same');
    expect(getPollenTrend(1, 1.3)).toBe('same');
    expect(getPollenTrend(2, 1.7)).toBe('same');
    expect(getPollenTrend(2, 2.4)).toBe('same');
  });

  it('handles edge cases at 0.5 boundary', () => {
    // Exactly at boundary - should be same
    expect(getPollenTrend(1, 1.5)).toBe('same');
    // Just over boundary - should be up
    expect(getPollenTrend(1, 1.6)).toBe('up');
    // Just under boundary for down
    expect(getPollenTrend(2, 1.4)).toBe('down');
  });
});
