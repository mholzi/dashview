/**
 * Tests for Suggestion Engine (beta.11 — #53)
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock i18n
vi.mock('../utils/i18n.js', () => ({
  t: (key, params) => params ? `${key}:${JSON.stringify(params)}` : key,
}));

// Mock helpers
vi.mock('../utils/helpers.js', () => ({
  getDefaultEnabledEntityIds: (enabledMap) => {
    // Returns array of entity IDs that are enabled (value is true or truthy)
    if (!enabledMap || typeof enabledMap !== 'object') return [];
    return Object.keys(enabledMap).filter(id => enabledMap[id]);
  },
  filterEntitiesByState: (ids, hass, state) => {
    return ids.filter(id => hass.states[id]?.state === state);
  },
}));

// Clear storage between tests
beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
});

describe('suggestion-engine', () => {
  let evaluateSuggestions, dismissSuggestion, recordSuggestionAction;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('./suggestion-engine.js');
    evaluateSuggestions = mod.evaluateSuggestions;
    dismissSuggestion = mod.dismissSuggestion;
    recordSuggestionAction = mod.recordSuggestionAction;
  });

  // ── Helper: build a mock hass object ──
  function makeHass(states = {}) {
    return { states };
  }

  function makeContext(enabledIds = {}) {
    // Convert domain-based arrays to enabledMaps format
    // enabledIds format: { light: ['light.a', 'light.b'], climate: ['climate.x'] }
    // enabledMaps format: { enabledLights: { 'light.a': true }, enabledClimates: { ... } }
    const enabledMaps = {};
    if (enabledIds.light) {
      enabledMaps.enabledLights = Object.fromEntries(enabledIds.light.map(id => [id, true]));
    }
    if (enabledIds.climate) {
      enabledMaps.enabledClimates = Object.fromEntries(enabledIds.climate.map(id => [id, true]));
    }
    if (enabledIds.binary_sensor) {
      enabledMaps.enabledWindows = Object.fromEntries(enabledIds.binary_sensor.map(id => [id, true]));
    }
    return { enabledMaps };
  }

  // ── evaluateSuggestions ──

  describe('evaluateSuggestions()', () => {
    it('returns empty array when hass is null', () => {
      expect(evaluateSuggestions(null, {})).toEqual([]);
    });

    it('returns empty array when no rules match', () => {
      const hass = makeHass({
        'sun.sun': { state: 'above_horizon', attributes: {} },
      });
      const result = evaluateSuggestions(hass, makeContext());
      expect(result).toEqual([]);
    });

    it('returns max 2 suggestions', () => {
      // Even if all 3 rules could fire, cap at 2
      const hass = makeHass({
        'sun.sun': { state: 'below_horizon', attributes: {} },
        'light.living': { state: 'on', attributes: {} },
        'light.bedroom': { state: 'on', attributes: {} },
        'climate.ac': { state: 'cool', attributes: {} },
        'binary_sensor.window': { state: 'on', attributes: {} },
      });
      const ctx = makeContext({
        light: ['light.living', 'light.bedroom'],
        climate: ['climate.ac'],
        binary_sensor: ['binary_sensor.window'],
      });
      const result = evaluateSuggestions(hass, ctx);
      expect(result.length).toBeLessThanOrEqual(2);
    });

    it('suggestions have required shape', () => {
      const hass = makeHass({
        'sun.sun': { state: 'below_horizon', attributes: {} },
        'light.living': { state: 'on', attributes: {} },
        'light.bedroom': { state: 'on', attributes: {} },
      });
      const ctx = makeContext({ light: ['light.living', 'light.bedroom'] });
      const result = evaluateSuggestions(hass, ctx);

      result.forEach(s => {
        expect(s).toHaveProperty('id');
        expect(s).toHaveProperty('icon');
        expect(s).toHaveProperty('title');
        expect(s).toHaveProperty('level');
        expect(['info', 'warning']).toContain(s.level);
      });
    });
  });

  // ── Lights Left On rule ──

  describe('lights-left-on rule', () => {
    it('fires when 2+ lights are on late at night', () => {
      // Mock time to 23:30
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-31T23:30:00'));

      const hass = makeHass({
        'light.living': { state: 'on', attributes: {} },
        'light.bedroom': { state: 'on', attributes: {} },
        'light.kitchen': { state: 'on', attributes: {} },
      });
      const ctx = makeContext({ light: ['light.living', 'light.bedroom', 'light.kitchen'] });
      const result = evaluateSuggestions(hass, ctx);
      const lightsRule = result.find(s => s.id === 'lights-left-on');
      expect(lightsRule).toBeDefined();

      vi.useRealTimers();
    });

    it('does NOT fire during daytime', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-31T14:00:00'));

      const hass = makeHass({
        'light.living': { state: 'on', attributes: {} },
        'light.bedroom': { state: 'on', attributes: {} },
        'light.kitchen': { state: 'on', attributes: {} },
      });
      const ctx = makeContext({ light: ['light.living', 'light.bedroom', 'light.kitchen'] });
      const result = evaluateSuggestions(hass, ctx);
      const lightsRule = result.find(s => s.id === 'lights-left-on');
      expect(lightsRule).toBeUndefined();

      vi.useRealTimers();
    });
  });

  // ── AC/Windows Conflict rule ──

  describe('ac-windows-conflict rule', () => {
    it('fires when climate is active and windows are open', () => {
      const hass = makeHass({
        'climate.ac': { state: 'cool', attributes: {} },
        'binary_sensor.window_living': { state: 'on', attributes: {} },
      });
      const ctx = makeContext({
        climate: ['climate.ac'],
        binary_sensor: ['binary_sensor.window_living'],
      });
      const result = evaluateSuggestions(hass, ctx);
      const acRule = result.find(s => s.id === 'ac-windows-conflict');
      expect(acRule).toBeDefined();
      expect(acRule.level).toBe('warning');
    });

    it('does NOT fire when climate is off', () => {
      const hass = makeHass({
        'climate.ac': { state: 'off', attributes: {} },
        'binary_sensor.window_living': { state: 'on', attributes: {} },
      });
      const ctx = makeContext({
        climate: ['climate.ac'],
        binary_sensor: ['binary_sensor.window_living'],
      });
      const result = evaluateSuggestions(hass, ctx);
      const acRule = result.find(s => s.id === 'ac-windows-conflict');
      expect(acRule).toBeUndefined();
    });
  });

  // ── Dismissal & Cooldowns ──

  describe('dismissSuggestion()', () => {
    it('prevents rule from firing after dismissal', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-01-31T23:30:00'));

      const hass = makeHass({
        'light.living': { state: 'on', attributes: {} },
        'light.bedroom': { state: 'on', attributes: {} },
      });
      const ctx = makeContext({ light: ['light.living', 'light.bedroom'] });

      // First eval — should fire
      let result = evaluateSuggestions(hass, ctx);
      const lightsRule = result.find(s => s.id === 'lights-left-on');
      if (lightsRule) {
        // Dismiss it
        dismissSuggestion('lights-left-on', 60 * 60 * 1000);

        // Second eval — should be suppressed
        result = evaluateSuggestions(hass, ctx);
        expect(result.find(s => s.id === 'lights-left-on')).toBeUndefined();
      }

      vi.useRealTimers();
    });
  });

  describe('recordSuggestionAction()', () => {
    it('sets cooldown after action', () => {
      recordSuggestionAction('test_rule');
      const stored = JSON.parse(localStorage.getItem('dashview_suggestion_cooldowns') || '{}');
      expect(stored['test_rule']).toBeDefined();
      expect(typeof stored['test_rule']).toBe('number');
    });
  });
});
