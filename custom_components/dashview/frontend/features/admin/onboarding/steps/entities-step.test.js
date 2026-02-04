/**
 * Room Config Step Tests (formerly Entities Step)
 * Tests for room configuration step component
 *
 * This step allows users to enable/disable rooms (areas) for display in Dashview.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  SUGGESTED_DOMAINS,
  entitiesStepStyles,
  saveEntitySelections,
  getEntitySelections
} from './entities-step.js';

// Mock the shared module
vi.mock('../../shared.js', () => ({
  t: (key, fallback) => fallback
}));

// Mock stores
vi.mock('../../../../stores/index.js', () => ({
  getSettingsStore: vi.fn(() => ({
    get: vi.fn(() => ({})),
    set: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  })),
  getOnboardingStore: vi.fn(() => ({
    currentStep: 0,
    steps: ['welcome', 'floorOrder', 'roomOrder', 'labels', 'roomConfig', 'floorCards', 'review'],
    subscribe: vi.fn()
  }))
}));

describe('Room Config Step', () => {
  describe('SUGGESTED_DOMAINS', () => {
    it('should export suggested domains constant', () => {
      expect(SUGGESTED_DOMAINS).toBeDefined();
      expect(Array.isArray(SUGGESTED_DOMAINS)).toBe(true);
    });

    it('should include light domain', () => {
      expect(SUGGESTED_DOMAINS).toContain('light');
    });

    it('should include climate domain', () => {
      expect(SUGGESTED_DOMAINS).toContain('climate');
    });

    it('should include cover domain', () => {
      expect(SUGGESTED_DOMAINS).toContain('cover');
    });

    it('should include switch domain', () => {
      expect(SUGGESTED_DOMAINS).toContain('switch');
    });

    it('should include fan domain', () => {
      expect(SUGGESTED_DOMAINS).toContain('fan');
    });

    it('should have exactly 5 suggested domains', () => {
      expect(SUGGESTED_DOMAINS.length).toBe(5);
    });

    it('should not include sensor domain', () => {
      expect(SUGGESTED_DOMAINS).not.toContain('sensor');
    });

    it('should not include binary_sensor domain', () => {
      expect(SUGGESTED_DOMAINS).not.toContain('binary_sensor');
    });

    it('should not include automation domain', () => {
      expect(SUGGESTED_DOMAINS).not.toContain('automation');
    });
  });

  describe('entitiesStepStyles', () => {
    it('should export styles string', () => {
      expect(entitiesStepStyles).toBeDefined();
      expect(typeof entitiesStepStyles).toBe('string');
    });

    it('should contain room config step container class', () => {
      expect(entitiesStepStyles).toContain('.dv-room-config-step');
    });

    it('should contain room config floors class', () => {
      expect(entitiesStepStyles).toContain('.dv-room-config-floors');
    });

    it('should contain room config floor header class', () => {
      expect(entitiesStepStyles).toContain('.dv-room-config-floor-header');
    });

    it('should contain room config search class', () => {
      expect(entitiesStepStyles).toContain('.dv-room-config-search');
    });

    it('should contain room config hint class', () => {
      expect(entitiesStepStyles).toContain('.dv-room-config-hint');
    });

    it('should contain empty state class', () => {
      expect(entitiesStepStyles).toContain('.dv-room-config-empty');
    });

    it('should use CSS custom properties with dv prefix', () => {
      expect(entitiesStepStyles).toContain('--dv-');
    });

    it('should use dv-prefixed CSS variables', () => {
      expect(entitiesStepStyles).toContain('var(--dv-gray');
      expect(entitiesStepStyles).toContain('var(--dv-blue');
    });
  });

  describe('isSuggestedEntity (via SUGGESTED_DOMAINS)', () => {
    // Test the logic that would be used for entity suggestion checking
    const isSuggestedEntity = (entityId) => {
      const domain = entityId.split('.')[0];
      return SUGGESTED_DOMAINS.includes(domain);
    };

    it('should identify light entities as suggested', () => {
      expect(isSuggestedEntity('light.living_room')).toBe(true);
      expect(isSuggestedEntity('light.bedroom_lamp')).toBe(true);
    });

    it('should identify climate entities as suggested', () => {
      expect(isSuggestedEntity('climate.thermostat')).toBe(true);
    });

    it('should identify cover entities as suggested', () => {
      expect(isSuggestedEntity('cover.living_room_blinds')).toBe(true);
    });

    it('should identify switch entities as suggested', () => {
      expect(isSuggestedEntity('switch.outlet_1')).toBe(true);
    });

    it('should identify fan entities as suggested', () => {
      expect(isSuggestedEntity('fan.bedroom_fan')).toBe(true);
    });

    it('should not suggest sensor entities', () => {
      expect(isSuggestedEntity('sensor.temperature')).toBe(false);
    });

    it('should not suggest binary_sensor entities', () => {
      expect(isSuggestedEntity('binary_sensor.door')).toBe(false);
    });

    it('should not suggest automation entities', () => {
      expect(isSuggestedEntity('automation.morning_routine')).toBe(false);
    });
  });
});

describe('getEntitySelections', () => {
  it('should return empty object when no enabledRooms', () => {
    const mockPanel = {};
    const result = getEntitySelections(mockPanel);
    expect(result).toEqual({});
  });

  it('should return empty object when enabledRooms is undefined', () => {
    const mockPanel = {
      _enabledRooms: undefined
    };
    const result = getEntitySelections(mockPanel);
    expect(result).toEqual({});
  });

  it('should return enabled rooms from panel state', () => {
    const mockPanel = {
      _enabledRooms: {
        'living_room': true,
        'bedroom': false,
        'kitchen': true
      }
    };
    const result = getEntitySelections(mockPanel);
    expect(result).toEqual({
      'living_room': true,
      'bedroom': false,
      'kitchen': true
    });
  });
});

describe('saveEntitySelections', () => {
  it('should call set with enabledRooms', () => {
    const mockSet = vi.fn();
    const mockSettingsStore = {
      set: mockSet
    };
    const mockPanel = {};
    const enabledRooms = {
      'living_room': true,
      'bedroom': false
    };

    saveEntitySelections(enabledRooms, mockSettingsStore, mockPanel);

    expect(mockSet).toHaveBeenCalledWith('enabledRooms', {
      'living_room': true,
      'bedroom': false
    });
  });

  it('should save all enabled rooms', () => {
    const mockSet = vi.fn();
    const mockSettingsStore = {
      set: mockSet
    };
    const mockPanel = {};
    const enabledRooms = {
      'living_room': true,
      'kitchen': true,
      'bedroom': false
    };

    saveEntitySelections(enabledRooms, mockSettingsStore, mockPanel);

    const savedRooms = mockSet.mock.calls[0][1];
    expect(savedRooms.living_room).toBe(true);
    expect(savedRooms.kitchen).toBe(true);
    expect(savedRooms.bedroom).toBe(false);
  });

  it('should handle empty enabled rooms', () => {
    const mockSet = vi.fn();
    const mockSettingsStore = {
      set: mockSet
    };
    const mockPanel = {};

    saveEntitySelections({}, mockSettingsStore, mockPanel);

    expect(mockSet).toHaveBeenCalledWith('enabledRooms', {});
  });
});
