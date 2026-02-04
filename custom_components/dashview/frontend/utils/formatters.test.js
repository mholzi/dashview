/**
 * Tests for utils/formatters.js
 * Covers all canonical date/time formatting functions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock i18n before importing formatters
vi.mock('./i18n.js', () => ({
  t: vi.fn((key, paramsOrFallback, fallback) => {
    // If second arg is a string, it's the fallback
    if (typeof paramsOrFallback === 'string') return paramsOrFallback;
    // If second arg is an object with params, use the third arg as fallback
    if (fallback) return fallback;
    // Return the key as-is
    return key;
  }),
}));

vi.mock('./helpers.js', () => ({
  calculateTimeDifference: vi.fn((ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const totalMinutes = Math.floor(totalSeconds / 60);
    const totalHours = Math.floor(totalMinutes / 60);
    const days = Math.floor(totalHours / 24);
    return {
      days,
      hours: totalHours,
      minutes: totalMinutes,
      seconds: totalSeconds,
      remainingHours: totalHours % 24,
      remainingMinutes: totalMinutes % 60,
      remainingSeconds: totalSeconds % 60,
    };
  }),
}));

import {
  formatGarageLastChanged,
  formatDate,
  formatLastChanged,
  formatAbsoluteTime,
  parseGarbageState,
  formatTimeAgo,
  formatDuration,
} from './formatters.js';

// ==================== formatTimeAgo ====================

describe('formatTimeAgo', () => {
  it('returns empty string for falsy input', () => {
    expect(formatTimeAgo(null)).toBe('');
    expect(formatTimeAgo(undefined)).toBe('');
    expect(formatTimeAgo('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatTimeAgo('not-a-date')).toBe('');
  });

  it('returns "Just now" for < 1 minute ago', () => {
    const now = new Date();
    expect(formatTimeAgo(now.toISOString())).toBe('Just now');
  });

  it('returns minutes ago for < 1 hour', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    expect(formatTimeAgo(fiveMinAgo.toISOString())).toMatch(/5.*ago|5m ago/);
  });

  it('returns hours ago for < 1 day', () => {
    const threeHrsAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(formatTimeAgo(threeHrsAgo.toISOString())).toMatch(/3.*ago|3h ago/);
  });

  it('returns "Yesterday" for 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatTimeAgo(oneDayAgo.toISOString())).toBe('Yesterday');
  });

  it('returns days ago for >= 2 days', () => {
    const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000);
    expect(formatTimeAgo(fiveDaysAgo.toISOString())).toMatch(/5.*ago|5 days ago/);
  });

  it('accepts Date objects', () => {
    const now = new Date();
    expect(formatTimeAgo(now)).toBe('Just now');
  });
});

// ==================== formatLastChanged ====================

describe('formatLastChanged', () => {
  it('returns empty string for falsy input', () => {
    expect(formatLastChanged(null)).toBe('');
    expect(formatLastChanged(undefined)).toBe('');
    expect(formatLastChanged('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatLastChanged('invalid')).toBe('');
  });

  it('returns "Just now" for < 1 minute ago', () => {
    const now = new Date();
    expect(formatLastChanged(now.toISOString())).toBe('Just now');
  });

  it('returns "Yesterday" for 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(formatLastChanged(oneDayAgo.toISOString())).toBe('Yesterday');
  });

  it('returns empty string for future dates', () => {
    const future = new Date(Date.now() + 60000);
    expect(formatLastChanged(future.toISOString())).toBe('');
  });
});

// ==================== formatGarageLastChanged ====================

describe('formatGarageLastChanged', () => {
  it('returns empty string for falsy input', () => {
    expect(formatGarageLastChanged(null)).toBe('');
    expect(formatGarageLastChanged(undefined)).toBe('');
    expect(formatGarageLastChanged('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatGarageLastChanged('not-valid')).toBe('');
  });

  it('formats minutes ago', () => {
    const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    const result = formatGarageLastChanged(tenMinAgo);
    expect(result).toMatch(/10.*ago|10m ago/);
  });

  it('formats hours ago', () => {
    const twoHrsAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const result = formatGarageLastChanged(twoHrsAgo);
    expect(result).toMatch(/2.*ago|2h ago/);
  });

  it('returns "Yesterday" for 1 day ago', () => {
    const oneDayAgo = new Date(Date.now() - 30 * 60 * 60 * 1000).toISOString();
    expect(formatGarageLastChanged(oneDayAgo)).toBe('Yesterday');
  });

  it('formats days ago for >= 2 days', () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(formatGarageLastChanged(threeDaysAgo)).toMatch(/3.*ago|3 days ago/);
  });
});

// ==================== formatDate ====================

describe('formatDate', () => {
  it('returns a non-empty string', () => {
    const result = formatDate();
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

// ==================== formatAbsoluteTime ====================

describe('formatAbsoluteTime', () => {
  it('returns empty string for falsy input', () => {
    expect(formatAbsoluteTime(null)).toBe('');
    expect(formatAbsoluteTime('')).toBe('');
  });

  it('returns empty string for invalid date', () => {
    expect(formatAbsoluteTime('bad-date')).toBe('');
  });

  it('returns a formatted date string for valid input', () => {
    const result = formatAbsoluteTime('2026-01-15T14:32:00Z');
    expect(result).toBeTruthy();
    expect(typeof result).toBe('string');
  });
});

// ==================== parseGarbageState ====================

describe('parseGarbageState', () => {
  it('parses "heute" as today (0 days)', () => {
    const result = parseGarbageState('heute');
    expect(result.days).toBe(0);
    expect(result.label).toBe('Today');
  });

  it('parses "today" as today (0 days)', () => {
    const result = parseGarbageState('today');
    expect(result.days).toBe(0);
    expect(result.label).toBe('Today');
  });

  it('parses "Heute" case-insensitively', () => {
    const result = parseGarbageState('Heute');
    expect(result.days).toBe(0);
    expect(result.label).toBe('Today');
  });

  it('parses "morgen" as tomorrow (1 day)', () => {
    const result = parseGarbageState('morgen');
    expect(result.days).toBe(1);
    expect(result.label).toBe('Tomorrow');
  });

  it('parses "tomorrow" as tomorrow (1 day)', () => {
    const result = parseGarbageState('tomorrow');
    expect(result.days).toBe(1);
    expect(result.label).toBe('Tomorrow');
  });

  it('parses numeric days from string', () => {
    const result = parseGarbageState('in 3 Tagen');
    expect(result.days).toBe(3);
    expect(result.label).toMatch(/3.*days|in 3 days/);
  });

  it('parses "0" as today', () => {
    const result = parseGarbageState('0 days');
    expect(result.days).toBe(0);
    expect(result.label).toBe('Today');
  });

  it('parses "1" as tomorrow', () => {
    const result = parseGarbageState('1 day');
    expect(result.days).toBe(1);
    expect(result.label).toBe('Tomorrow');
  });

  it('returns 99 days for unparseable input', () => {
    const result = parseGarbageState('no numbers here');
    expect(result.days).toBe(99);
  });
});

// ==================== formatDuration ====================

describe('formatDuration', () => {
  it('formats minutes only for < 1 hour', () => {
    const result = formatDuration(15 * 60 * 1000);
    expect(result).toBe('15min');
  });

  it('formats hours and minutes', () => {
    const result = formatDuration(2 * 60 * 60 * 1000 + 30 * 60 * 1000);
    expect(result).toBe('2h 30min');
  });

  it('formats hours only when minutes are 0', () => {
    const result = formatDuration(3 * 60 * 60 * 1000);
    expect(result).toBe('3h');
  });

  it('formats 0 milliseconds as "0min"', () => {
    const result = formatDuration(0);
    expect(result).toBe('0min');
  });
});
