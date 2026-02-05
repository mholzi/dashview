/**
 * Anomaly Detector Service Tests
 * Tests for rate-of-change detection in temperature and humidity sensors
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock i18n — matches real t(key, fallbackOrParams, fallbackWhenParams) signature
vi.mock('../utils/i18n.js', () => ({
  t: vi.fn((key, fallbackOrParams = null, fallbackWhenParams = null) => {
    const translations = {
      'time.duration_1_hour': '1 hour',
      'time.duration_n_hours': '{{count}} hours',
      'time.duration_1_minute': '1 minute',
      'time.duration_n_minutes': '{{count}} minutes',
    };
    const isFallbackString = typeof fallbackOrParams === 'string';
    const fallback = isFallbackString ? fallbackOrParams : (fallbackWhenParams ?? key);
    const params = isFallbackString ? {} : (fallbackOrParams || {});
    const template = translations[key] || fallback;
    return template.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] ?? '');
  }),
}));

import {
  formatDuration,
  calculateRateOfChange,
  detectTemperatureAnomaly,
  detectHumidityAnomaly,
} from './anomaly-detector.js';

describe('formatDuration', () => {
  it('formats minutes less than 60 as minutes', () => {
    expect(formatDuration(30)).toBe('30 minutes');
    expect(formatDuration(45)).toBe('45 minutes');
    expect(formatDuration(1)).toBe('1 minute');
    expect(formatDuration(59)).toBe('59 minutes');
  });

  it('formats exactly 60 minutes as 1 hour', () => {
    expect(formatDuration(60)).toBe('1 hour');
  });

  it('formats whole hours correctly', () => {
    expect(formatDuration(120)).toBe('2 hours');
    expect(formatDuration(180)).toBe('3 hours');
  });

  it('formats fractional hours correctly', () => {
    expect(formatDuration(90)).toBe('1.5 hours');
    expect(formatDuration(150)).toBe('2.5 hours');
  });

  it('rounds minutes to whole numbers', () => {
    expect(formatDuration(29.7)).toBe('30 minutes');
    expect(formatDuration(44.2)).toBe('44 minutes');
  });
});

describe('calculateRateOfChange', () => {
  let mockNow;

  beforeEach(() => {
    // Mock Date.now() to return a fixed timestamp
    mockNow = 1700000000000; // Some fixed timestamp
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null for empty history', () => {
    expect(calculateRateOfChange([], 60)).toBeNull();
    expect(calculateRateOfChange(null, 60)).toBeNull();
    expect(calculateRateOfChange(undefined, 60)).toBeNull();
  });

  it('returns null for history with only one point', () => {
    const history = [{ time: mockNow - 30 * 60 * 1000, value: 20 }];
    expect(calculateRateOfChange(history, 60)).toBeNull();
  });

  it('returns null when less than 2 points within window', () => {
    // All points are outside the window
    const history = [
      { time: mockNow - 120 * 60 * 1000, value: 20 },
      { time: mockNow - 90 * 60 * 1000, value: 22 },
    ];
    expect(calculateRateOfChange(history, 60)).toBeNull();
  });

  it('calculates rising temperature change correctly', () => {
    const history = [
      { time: mockNow - 60 * 60 * 1000, value: 20 }, // 60 min ago: 20°C
      { time: mockNow - 30 * 60 * 1000, value: 22 }, // 30 min ago: 22°C
      { time: mockNow - 1 * 60 * 1000, value: 25 },  // 1 min ago: 25°C
    ];

    const result = calculateRateOfChange(history, 60);

    expect(result).not.toBeNull();
    expect(result.change).toBe(5); // 25 - 20 = 5
    expect(result.direction).toBe('rising');
    expect(result.duration).toBe(59); // ~59 minutes
  });

  it('calculates falling temperature change correctly', () => {
    const history = [
      { time: mockNow - 60 * 60 * 1000, value: 25 }, // 60 min ago: 25°C
      { time: mockNow - 30 * 60 * 1000, value: 22 }, // 30 min ago: 22°C
      { time: mockNow - 1 * 60 * 1000, value: 20 },  // 1 min ago: 20°C
    ];

    const result = calculateRateOfChange(history, 60);

    expect(result).not.toBeNull();
    expect(result.change).toBe(5); // |20 - 25| = 5
    expect(result.direction).toBe('falling');
  });

  it('only considers points within the time window', () => {
    const history = [
      { time: mockNow - 120 * 60 * 1000, value: 15 }, // 120 min ago (outside 60-min window)
      { time: mockNow - 60 * 60 * 1000, value: 20 },  // 60 min ago (edge of window)
      { time: mockNow - 30 * 60 * 1000, value: 22 },  // 30 min ago
      { time: mockNow - 1 * 60 * 1000, value: 25 },   // 1 min ago
    ];

    const result = calculateRateOfChange(history, 60);

    // Should use 20 as oldest (not 15 which is outside window)
    expect(result.change).toBe(5); // 25 - 20 = 5
  });

  it('returns null when duration is less than 1 minute', () => {
    const history = [
      { time: mockNow - 30 * 1000, value: 20 }, // 30 sec ago
      { time: mockNow - 10 * 1000, value: 25 }, // 10 sec ago
    ];

    const result = calculateRateOfChange(history, 60);
    expect(result).toBeNull();
  });

  it('handles humidity percentage changes', () => {
    const history = [
      { time: mockNow - 30 * 60 * 1000, value: 45 }, // 30 min ago: 45%
      { time: mockNow - 15 * 60 * 1000, value: 55 }, // 15 min ago: 55%
      { time: mockNow - 1 * 60 * 1000, value: 70 },  // 1 min ago: 70%
    ];

    const result = calculateRateOfChange(history, 30);

    expect(result).not.toBeNull();
    expect(result.change).toBe(25); // 70 - 45 = 25
    expect(result.direction).toBe('rising');
  });
});

describe('detectTemperatureAnomaly', () => {
  let mockNow;

  beforeEach(() => {
    mockNow = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no anomaly detected', () => {
    const history = [
      { time: mockNow - 60 * 60 * 1000, value: 20 },
      { time: mockNow - 1 * 60 * 1000, value: 22 },
    ];

    // 2°C change is below 5°C threshold
    const result = detectTemperatureAnomaly(history, 5, 60);
    expect(result).toBeNull();
  });

  it('detects anomaly when temperature rises above threshold', () => {
    const history = [
      { time: mockNow - 60 * 60 * 1000, value: 20 },
      { time: mockNow - 1 * 60 * 1000, value: 26 },
    ];

    // 6°C change exceeds 5°C threshold
    const result = detectTemperatureAnomaly(history, 5, 60);

    expect(result).not.toBeNull();
    expect(result.detected).toBe(true);
    expect(result.change).toBe(6);
    expect(result.direction).toBe('rising');
    expect(result.formattedDuration).toBe('59 minutes');
  });

  it('detects anomaly when temperature drops above threshold', () => {
    const history = [
      { time: mockNow - 60 * 60 * 1000, value: 25 },
      { time: mockNow - 1 * 60 * 1000, value: 19 },
    ];

    // 6°C drop exceeds 5°C threshold
    const result = detectTemperatureAnomaly(history, 5, 60);

    expect(result).not.toBeNull();
    expect(result.detected).toBe(true);
    expect(result.change).toBe(6);
    expect(result.direction).toBe('falling');
  });

  it('detects anomaly at exact threshold', () => {
    const history = [
      { time: mockNow - 60 * 60 * 1000, value: 20 },
      { time: mockNow - 1 * 60 * 1000, value: 25 },
    ];

    // Exactly 5°C change at 5°C threshold
    const result = detectTemperatureAnomaly(history, 5, 60);

    expect(result).not.toBeNull();
    expect(result.detected).toBe(true);
    expect(result.change).toBe(5);
  });

  it('returns null for insufficient data', () => {
    expect(detectTemperatureAnomaly([], 5, 60)).toBeNull();
    expect(detectTemperatureAnomaly(null, 5, 60)).toBeNull();
  });

  it('uses configured time window correctly', () => {
    const history = [
      { time: mockNow - 120 * 60 * 1000, value: 15 }, // Outside 60-min window
      { time: mockNow - 60 * 60 * 1000, value: 20 },
      { time: mockNow - 1 * 60 * 1000, value: 26 },
    ];

    const result = detectTemperatureAnomaly(history, 5, 60);

    // Should only see 6°C change (26-20), not 11°C (26-15)
    expect(result.change).toBe(6);
  });
});

describe('detectHumidityAnomaly', () => {
  let mockNow;

  beforeEach(() => {
    mockNow = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns null when no anomaly detected', () => {
    const history = [
      { time: mockNow - 30 * 60 * 1000, value: 50 },
      { time: mockNow - 1 * 60 * 1000, value: 60 },
    ];

    // 10% change is below 20% threshold
    const result = detectHumidityAnomaly(history, 20, 30);
    expect(result).toBeNull();
  });

  it('detects anomaly when humidity rises above threshold', () => {
    const history = [
      { time: mockNow - 30 * 60 * 1000, value: 50 },
      { time: mockNow - 1 * 60 * 1000, value: 75 },
    ];

    // 25% change exceeds 20% threshold
    const result = detectHumidityAnomaly(history, 20, 30);

    expect(result).not.toBeNull();
    expect(result.detected).toBe(true);
    expect(result.change).toBe(25);
    expect(result.direction).toBe('rising');
    expect(result.formattedDuration).toBe('29 minutes');
  });

  it('detects anomaly when humidity drops above threshold', () => {
    const history = [
      { time: mockNow - 30 * 60 * 1000, value: 80 },
      { time: mockNow - 1 * 60 * 1000, value: 55 },
    ];

    // 25% drop exceeds 20% threshold
    const result = detectHumidityAnomaly(history, 20, 30);

    expect(result).not.toBeNull();
    expect(result.detected).toBe(true);
    expect(result.change).toBe(25);
    expect(result.direction).toBe('falling');
  });

  it('detects anomaly at exact threshold', () => {
    const history = [
      { time: mockNow - 30 * 60 * 1000, value: 50 },
      { time: mockNow - 1 * 60 * 1000, value: 70 },
    ];

    // Exactly 20% change at 20% threshold
    const result = detectHumidityAnomaly(history, 20, 30);

    expect(result).not.toBeNull();
    expect(result.detected).toBe(true);
    expect(result.change).toBe(20);
  });

  it('returns null for insufficient data', () => {
    expect(detectHumidityAnomaly([], 20, 30)).toBeNull();
    expect(detectHumidityAnomaly(null, 20, 30)).toBeNull();
  });

  it('formats duration correctly for sub-hour windows', () => {
    const history = [
      { time: mockNow - 25 * 60 * 1000, value: 50 },
      { time: mockNow - 1 * 60 * 1000, value: 75 },
    ];

    const result = detectHumidityAnomaly(history, 20, 30);

    expect(result.formattedDuration).toBe('24 minutes');
  });
});

describe('Integration scenarios', () => {
  let mockNow;

  beforeEach(() => {
    mockNow = 1700000000000;
    vi.spyOn(Date, 'now').mockReturnValue(mockNow);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('handles real-world temperature drop scenario (open window)', () => {
    // Simulate temperature drop when window is opened
    const history = [
      { time: mockNow - 60 * 60 * 1000, value: 22.5 }, // 60 min ago: normal temp
      { time: mockNow - 50 * 60 * 1000, value: 22.3 }, // 50 min ago
      { time: mockNow - 40 * 60 * 1000, value: 21.8 }, // 40 min ago
      { time: mockNow - 30 * 60 * 1000, value: 20.5 }, // 30 min ago: window opened
      { time: mockNow - 20 * 60 * 1000, value: 18.2 }, // 20 min ago: rapid drop
      { time: mockNow - 10 * 60 * 1000, value: 17.0 }, // 10 min ago
      { time: mockNow - 1 * 60 * 1000, value: 16.5 },  // 1 min ago: 6°C drop
    ];

    const result = detectTemperatureAnomaly(history, 5, 60);

    expect(result).not.toBeNull();
    expect(result.detected).toBe(true);
    expect(result.change).toBe(6);
    expect(result.direction).toBe('falling');
  });

  it('handles real-world humidity spike scenario (shower running)', () => {
    // Simulate humidity spike when shower is running
    const history = [
      { time: mockNow - 30 * 60 * 1000, value: 55 }, // 30 min ago: normal
      { time: mockNow - 25 * 60 * 1000, value: 56 }, // 25 min ago
      { time: mockNow - 20 * 60 * 1000, value: 58 }, // 20 min ago: shower starts
      { time: mockNow - 15 * 60 * 1000, value: 65 }, // 15 min ago
      { time: mockNow - 10 * 60 * 1000, value: 72 }, // 10 min ago
      { time: mockNow - 5 * 60 * 1000, value: 78 },  // 5 min ago
      { time: mockNow - 1 * 60 * 1000, value: 82 },  // 1 min ago: 27% spike
    ];

    const result = detectHumidityAnomaly(history, 20, 30);

    expect(result).not.toBeNull();
    expect(result.detected).toBe(true);
    expect(result.change).toBe(27);
    expect(result.direction).toBe('rising');
  });

  it('does not trigger on gradual normal temperature changes', () => {
    // Normal daily temperature variation - should not trigger
    const history = [
      { time: mockNow - 60 * 60 * 1000, value: 20.0 },
      { time: mockNow - 50 * 60 * 1000, value: 20.3 },
      { time: mockNow - 40 * 60 * 1000, value: 20.8 },
      { time: mockNow - 30 * 60 * 1000, value: 21.2 },
      { time: mockNow - 20 * 60 * 1000, value: 21.8 },
      { time: mockNow - 10 * 60 * 1000, value: 22.3 },
      { time: mockNow - 1 * 60 * 1000, value: 22.8 },  // Only 2.8°C change
    ];

    const result = detectTemperatureAnomaly(history, 5, 60);
    expect(result).toBeNull();
  });
});
