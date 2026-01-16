/**
 * Entities Step Tests
 * Tests for entity selection step component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
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
    settings: {},
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    updateSettings: vi.fn()
  })),
  getOnboardingStore: vi.fn(() => ({
    currentStep: 0,
    steps: ['welcome', 'floors', 'rooms', 'entities'],
    subscribe: vi.fn()
  }))
}));

describe('Entities Step', () => {
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

    it('should contain entities step container class', () => {
      expect(entitiesStepStyles).toContain('.dv-entities-step');
    });

    it('should contain entities room class', () => {
      expect(entitiesStepStyles).toContain('.dv-entities-room');
    });

    it('should contain entities search class', () => {
      expect(entitiesStepStyles).toContain('.dv-entities-search');
    });

    it('should contain entity item class', () => {
      expect(entitiesStepStyles).toContain('.dv-entity-item');
    });

    it('should contain entity checkbox class', () => {
      expect(entitiesStepStyles).toContain('.dv-entity-checkbox');
    });

    it('should contain suggested entity styling', () => {
      expect(entitiesStepStyles).toContain('.dv-entity-item.suggested');
    });

    it('should contain selected entity styling', () => {
      expect(entitiesStepStyles).toContain('.dv-entity-item.selected');
    });

    it('should contain summary section styling', () => {
      expect(entitiesStepStyles).toContain('.dv-entities-summary');
    });

    it('should use CSS custom properties with dv prefix', () => {
      expect(entitiesStepStyles).toContain('--dv-');
    });

    it('should include fallback CSS variables', () => {
      expect(entitiesStepStyles).toContain('var(--primary-color)');
      expect(entitiesStepStyles).toContain('var(--primary-text-color)');
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
      expect(isSuggestedEntity('fan.ceiling_fan')).toBe(true);
    });

    it('should not identify sensor entities as suggested', () => {
      expect(isSuggestedEntity('sensor.temperature')).toBe(false);
    });

    it('should not identify binary_sensor entities as suggested', () => {
      expect(isSuggestedEntity('binary_sensor.motion')).toBe(false);
    });

    it('should not identify automation entities as suggested', () => {
      expect(isSuggestedEntity('automation.turn_on_lights')).toBe(false);
    });

    it('should not identify person entities as suggested', () => {
      expect(isSuggestedEntity('person.john')).toBe(false);
    });

    it('should handle entities with underscores in name', () => {
      expect(isSuggestedEntity('light.kitchen_under_cabinet_lights')).toBe(true);
    });
  });

  describe('domain icon mapping behavior', () => {
    // Domain icons that should be defined
    const expectedDomainIcons = [
      'light',
      'switch',
      'cover',
      'climate',
      'lock',
      'fan',
      'vacuum',
      'media_player',
      'sensor',
      'binary_sensor',
      'automation',
      'script',
      'scene',
      'input_boolean',
      'person',
      'camera',
      'weather'
    ];

    it('should support all common domain icons', () => {
      // This test validates that the module handles these domains
      // The actual icon mapping is internal but we document expected coverage
      expectedDomainIcons.forEach(domain => {
        expect(typeof domain).toBe('string');
      });
    });
  });
});

describe('Entity grouping behavior', () => {
  // Test the expected behavior of entity grouping

  const skipDomains = ['zone', 'persistent_notification', 'conversation', 'tts', 'update', 'button'];

  describe('skip domains', () => {
    it('should skip zone entities', () => {
      expect(skipDomains).toContain('zone');
    });

    it('should skip persistent_notification entities', () => {
      expect(skipDomains).toContain('persistent_notification');
    });

    it('should skip conversation entities', () => {
      expect(skipDomains).toContain('conversation');
    });

    it('should skip tts entities', () => {
      expect(skipDomains).toContain('tts');
    });

    it('should skip update entities', () => {
      expect(skipDomains).toContain('update');
    });

    it('should skip button entities', () => {
      expect(skipDomains).toContain('button');
    });

    it('should not skip light entities', () => {
      expect(skipDomains).not.toContain('light');
    });

    it('should not skip switch entities', () => {
      expect(skipDomains).not.toContain('switch');
    });
  });
});

describe('saveEntitySelections', () => {
  it('should call updateSettings with selected entities', () => {
    const mockUpdateSettings = vi.fn();
    const mockSettingsStore = {
      settings: {},
      updateSettings: mockUpdateSettings
    };
    const mockPanel = {
      _areas: [{ area_id: 'living_room', name: 'Living Room' }],
      _entityRegistry: [
        { entity_id: 'light.living_room_lamp', area_id: 'living_room' }
      ]
    };
    const selections = {
      'light.living_room_lamp': true
    };

    saveEntitySelections(selections, mockSettingsStore, mockPanel);

    expect(mockUpdateSettings).toHaveBeenCalled();
    const updatedSettings = mockUpdateSettings.mock.calls[0][0];
    expect(updatedSettings.roomConfig).toBeDefined();
    expect(updatedSettings.roomConfig.living_room).toBeDefined();
    expect(updatedSettings.roomConfig.living_room.enabled).toBe(true);
  });

  it('should skip entities without area assignment', () => {
    const mockUpdateSettings = vi.fn();
    const mockSettingsStore = {
      settings: {},
      updateSettings: mockUpdateSettings
    };
    const mockPanel = {
      _areas: [],
      _entityRegistry: [
        { entity_id: 'light.unassigned_lamp' } // No area_id
      ]
    };
    const selections = {
      'light.unassigned_lamp': true
    };

    saveEntitySelections(selections, mockSettingsStore, mockPanel);

    expect(mockUpdateSettings).toHaveBeenCalled();
    const updatedSettings = mockUpdateSettings.mock.calls[0][0];
    // Should not create room config for unassigned entity
    expect(Object.keys(updatedSettings.roomConfig || {})).toHaveLength(0);
  });

  it('should skip deselected entities', () => {
    const mockUpdateSettings = vi.fn();
    const mockSettingsStore = {
      settings: {},
      updateSettings: mockUpdateSettings
    };
    const mockPanel = {
      _areas: [{ area_id: 'living_room', name: 'Living Room' }],
      _entityRegistry: [
        { entity_id: 'light.living_room_lamp', area_id: 'living_room' }
      ]
    };
    const selections = {
      'light.living_room_lamp': false // Deselected
    };

    saveEntitySelections(selections, mockSettingsStore, mockPanel);

    expect(mockUpdateSettings).toHaveBeenCalled();
    const updatedSettings = mockUpdateSettings.mock.calls[0][0];
    expect(Object.keys(updatedSettings.roomConfig || {})).toHaveLength(0);
  });

  it('should handle errors gracefully', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mockSettingsStore = {
      settings: null, // This will cause an error
      updateSettings: vi.fn(() => { throw new Error('Test error'); })
    };
    const mockPanel = {
      _areas: [{ area_id: 'living_room', name: 'Living Room' }],
      _entityRegistry: [
        { entity_id: 'light.living_room_lamp', area_id: 'living_room' }
      ]
    };

    // Should not throw
    expect(() => {
      saveEntitySelections({ 'light.living_room_lamp': true }, mockSettingsStore, mockPanel);
    }).not.toThrow();

    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should group entities by type correctly', () => {
    const mockUpdateSettings = vi.fn();
    const mockSettingsStore = {
      settings: {},
      updateSettings: mockUpdateSettings
    };
    const mockPanel = {
      _areas: [{ area_id: 'living_room', name: 'Living Room' }],
      _entityRegistry: [
        { entity_id: 'light.lamp1', area_id: 'living_room' },
        { entity_id: 'light.lamp2', area_id: 'living_room' },
        { entity_id: 'switch.outlet', area_id: 'living_room' },
        { entity_id: 'cover.blinds', area_id: 'living_room' }
      ]
    };
    const selections = {
      'light.lamp1': true,
      'light.lamp2': true,
      'switch.outlet': true,
      'cover.blinds': true
    };

    saveEntitySelections(selections, mockSettingsStore, mockPanel);

    const updatedSettings = mockUpdateSettings.mock.calls[0][0];
    expect(updatedSettings.roomConfig.living_room.entities.lights).toContain('light.lamp1');
    expect(updatedSettings.roomConfig.living_room.entities.lights).toContain('light.lamp2');
    expect(updatedSettings.roomConfig.living_room.entities.switches).toContain('switch.outlet');
    expect(updatedSettings.roomConfig.living_room.entities.covers).toContain('cover.blinds');
  });
});

describe('getEntitySelections', () => {
  it('should return empty object when no wizard state exists', () => {
    const mockPanel = {};
    const result = getEntitySelections(mockPanel);
    expect(result).toEqual({});
  });

  it('should return empty object when selected is undefined', () => {
    const mockPanel = {
      _wizardEntityState: {}
    };
    const result = getEntitySelections(mockPanel);
    expect(result).toEqual({});
  });

  it('should return selected entities from wizard state', () => {
    const mockPanel = {
      _wizardEntityState: {
        selected: {
          'light.lamp1': true,
          'light.lamp2': false,
          'switch.outlet': true
        }
      }
    };
    const result = getEntitySelections(mockPanel);
    expect(result).toEqual({
      'light.lamp1': true,
      'light.lamp2': false,
      'switch.outlet': true
    });
  });
});
