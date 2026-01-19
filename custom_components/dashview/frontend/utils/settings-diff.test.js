/**
 * Settings Diff Tests
 * Tests for delta calculation utility
 */

import { calculateDelta, applyDelta } from './settings-diff.js';

describe('calculateDelta', () => {
  describe('primitive value changes', () => {
    it('detects string value changes', () => {
      const oldSettings = { name: 'old' };
      const newSettings = { name: 'new' };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ name: 'new' });
    });

    it('detects number value changes', () => {
      const oldSettings = { count: 5 };
      const newSettings = { count: 10 };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ count: 10 });
    });

    it('detects boolean value changes', () => {
      const oldSettings = { enabled: true };
      const newSettings = { enabled: false };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ enabled: false });
    });

    it('ignores unchanged values', () => {
      const oldSettings = { name: 'same', count: 5 };
      const newSettings = { name: 'same', count: 5 };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({});
    });

    it('detects null value as deletion marker', () => {
      const oldSettings = { name: 'old', count: 5 };
      const newSettings = { name: 'old' }; // count removed
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ count: null });
    });

    it('detects new keys being added', () => {
      const oldSettings = { name: 'old' };
      const newSettings = { name: 'old', count: 5 };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ count: 5 });
    });
  });

  describe('nested object changes', () => {
    it('detects changes in nested objects using dot notation', () => {
      const oldSettings = { weather: { entity: 'weather.home', temp: 20 } };
      const newSettings = { weather: { entity: 'weather.office', temp: 20 } };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ 'weather.entity': 'weather.office' });
    });

    it('detects multiple nested changes', () => {
      const oldSettings = { config: { a: 1, b: 2 } };
      const newSettings = { config: { a: 10, b: 20 } };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ 'config.a': 10, 'config.b': 20 });
    });

    it('detects deeply nested changes', () => {
      const oldSettings = { level1: { level2: { level3: 'old' } } };
      const newSettings = { level1: { level2: { level3: 'new' } } };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ 'level1.level2.level3': 'new' });
    });

    it('detects new nested keys', () => {
      const oldSettings = { config: { a: 1 } };
      const newSettings = { config: { a: 1, b: 2 } };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ 'config.b': 2 });
    });

    it('detects removed nested keys', () => {
      const oldSettings = { config: { a: 1, b: 2 } };
      const newSettings = { config: { a: 1 } };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ 'config.b': null });
    });
  });

  describe('array handling', () => {
    it('replaces entire array when changed', () => {
      const oldSettings = { items: [1, 2, 3] };
      const newSettings = { items: [1, 2, 3, 4] };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ items: [1, 2, 3, 4] });
    });

    it('ignores unchanged arrays', () => {
      const oldSettings = { items: [1, 2, 3] };
      const newSettings = { items: [1, 2, 3] };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({});
    });

    it('replaces array when elements change order', () => {
      const oldSettings = { items: [1, 2, 3] };
      const newSettings = { items: [3, 2, 1] };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ items: [3, 2, 1] });
    });

    it('handles arrays of objects (replaces entire array)', () => {
      const oldSettings = { buttons: [{ id: 1, name: 'a' }] };
      const newSettings = { buttons: [{ id: 1, name: 'b' }] };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ buttons: [{ id: 1, name: 'b' }] });
    });
  });

  describe('edge cases', () => {
    it('returns empty object when settings are identical', () => {
      const settings = { a: 1, b: { c: 2 }, d: [3, 4] };
      const delta = calculateDelta(settings, settings);
      expect(delta).toEqual({});
    });

    it('handles null oldSettings (first save)', () => {
      const newSettings = { name: 'new', count: 5 };
      const delta = calculateDelta(null, newSettings);
      expect(delta).toEqual(null); // Full save needed
    });

    it('handles undefined oldSettings (first save)', () => {
      const newSettings = { name: 'new', count: 5 };
      const delta = calculateDelta(undefined, newSettings);
      expect(delta).toEqual(null); // Full save needed
    });

    it('handles empty objects', () => {
      const delta = calculateDelta({}, {});
      expect(delta).toEqual({});
    });

    it('handles newSettings being empty (clear all)', () => {
      const oldSettings = { name: 'old', count: 5 };
      const newSettings = {};
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ name: null, count: null });
    });

    it('compares by value not reference for objects', () => {
      const oldSettings = { config: { a: 1 } };
      const newSettings = { config: { a: 1 } }; // Different object, same content
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({});
    });
  });

  describe('special value types', () => {
    it('handles undefined values correctly', () => {
      const oldSettings = { a: undefined };
      const newSettings = { a: 1 };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ a: 1 });
    });

    it('treats undefined to null as a change', () => {
      const oldSettings = { a: undefined };
      const newSettings = { a: null };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ a: null });
    });

    it('handles zero values correctly', () => {
      const oldSettings = { count: 0 };
      const newSettings = { count: 1 };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ count: 1 });
    });

    it('handles empty string values correctly', () => {
      const oldSettings = { name: '' };
      const newSettings = { name: 'value' };
      const delta = calculateDelta(oldSettings, newSettings);
      expect(delta).toEqual({ name: 'value' });
    });
  });
});

describe('applyDelta', () => {
  describe('primitive values', () => {
    it('applies simple value changes', () => {
      const base = { name: 'old', count: 5 };
      const delta = { name: 'new' };
      const result = applyDelta(base, delta);
      expect(result).toEqual({ name: 'new', count: 5 });
    });

    it('deletes keys with null value', () => {
      const base = { name: 'old', count: 5 };
      const delta = { count: null };
      const result = applyDelta(base, delta);
      expect(result).toEqual({ name: 'old' });
    });

    it('adds new keys', () => {
      const base = { name: 'old' };
      const delta = { count: 5 };
      const result = applyDelta(base, delta);
      expect(result).toEqual({ name: 'old', count: 5 });
    });
  });

  describe('nested changes via dot notation', () => {
    it('applies nested changes', () => {
      const base = { config: { a: 1, b: 2 } };
      const delta = { 'config.a': 10 };
      const result = applyDelta(base, delta);
      expect(result).toEqual({ config: { a: 10, b: 2 } });
    });

    it('creates nested structure if not exists', () => {
      const base = {};
      const delta = { 'config.a': 1 };
      const result = applyDelta(base, delta);
      expect(result).toEqual({ config: { a: 1 } });
    });

    it('deletes nested keys with null', () => {
      const base = { config: { a: 1, b: 2 } };
      const delta = { 'config.b': null };
      const result = applyDelta(base, delta);
      expect(result).toEqual({ config: { a: 1 } });
    });

    it('applies deeply nested changes', () => {
      const base = { l1: { l2: { l3: 'old' } } };
      const delta = { 'l1.l2.l3': 'new' };
      const result = applyDelta(base, delta);
      expect(result).toEqual({ l1: { l2: { l3: 'new' } } });
    });
  });

  describe('array handling', () => {
    it('replaces arrays entirely', () => {
      const base = { items: [1, 2, 3] };
      const delta = { items: [4, 5] };
      const result = applyDelta(base, delta);
      expect(result).toEqual({ items: [4, 5] });
    });

    it('deletes array with null', () => {
      const base = { items: [1, 2, 3] };
      const delta = { items: null };
      const result = applyDelta(base, delta);
      expect(result).toEqual({});
    });
  });

  describe('immutability', () => {
    it('does not modify the base object', () => {
      const base = { name: 'old', config: { a: 1 } };
      const baseCopy = JSON.parse(JSON.stringify(base));
      const delta = { name: 'new', 'config.a': 10 };
      applyDelta(base, delta);
      expect(base).toEqual(baseCopy);
    });

    it('does not modify the delta object', () => {
      const base = { name: 'old' };
      const delta = { name: 'new' };
      const deltaCopy = JSON.parse(JSON.stringify(delta));
      applyDelta(base, delta);
      expect(delta).toEqual(deltaCopy);
    });
  });

  describe('edge cases', () => {
    it('returns base copy when delta is empty', () => {
      const base = { name: 'old', count: 5 };
      const result = applyDelta(base, {});
      expect(result).toEqual(base);
      expect(result).not.toBe(base); // Should be a copy
    });

    it('handles null base', () => {
      const delta = { name: 'new' };
      const result = applyDelta(null, delta);
      expect(result).toEqual({ name: 'new' });
    });

    it('handles undefined base', () => {
      const delta = { name: 'new' };
      const result = applyDelta(undefined, delta);
      expect(result).toEqual({ name: 'new' });
    });
  });
});
