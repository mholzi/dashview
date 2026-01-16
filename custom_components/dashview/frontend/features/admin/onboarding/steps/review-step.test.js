/**
 * Review Step Tests
 * Tests for review summary step
 */

import { describe, it, expect, vi } from 'vitest';
import {
  reviewStepStyles,
  generateReviewSummary
} from './review-step.js';

// Mock the shared module
vi.mock('../../shared.js', () => ({
  t: (key, fallback) => fallback
}));

// Mock stores
vi.mock('../../../../stores/index.js', () => ({
  getSettingsStore: vi.fn(() => ({
    settings: {},
    subscribe: vi.fn(),
    updateSettings: vi.fn()
  })),
  getOnboardingStore: vi.fn(() => ({
    currentStep: 6,
    steps: ['welcome', 'floors', 'rooms', 'entities', 'layout', 'weather', 'review'],
    goToStep: vi.fn(),
    subscribe: vi.fn()
  }))
}));

describe('Review Step', () => {
  describe('reviewStepStyles', () => {
    it('should export styles string', () => {
      expect(reviewStepStyles).toBeDefined();
      expect(typeof reviewStepStyles).toBe('string');
    });

    it('should contain review step container class', () => {
      expect(reviewStepStyles).toContain('.dv-review-step');
    });

    it('should contain review section class', () => {
      expect(reviewStepStyles).toContain('.dv-review-section');
    });

    it('should contain edit button class', () => {
      expect(reviewStepStyles).toContain('.dv-review-section-edit');
    });

    it('should contain success message class', () => {
      expect(reviewStepStyles).toContain('.dv-review-success');
    });

    it('should use CSS custom properties with dv prefix', () => {
      expect(reviewStepStyles).toContain('--dv-');
    });
  });

  describe('generateReviewSummary', () => {
    it('should handle empty panel state', () => {
      const mockPanel = {};
      const result = generateReviewSummary(mockPanel);

      expect(result.floors.count).toBe(0);
      expect(result.floors.names).toEqual([]);
      expect(result.rooms.total).toBe(0);
      expect(result.entities.selected).toBe(0);
      expect(result.weather.entityId).toBeUndefined();
      expect(result.weather.entityName).toBeNull();
    });

    it('should count floors correctly', () => {
      const mockPanel = {
        _floors: [
          { floor_id: 'floor1', name: 'Ground Floor' },
          { floor_id: 'floor2', name: 'First Floor' }
        ],
        _areas: []
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.floors.count).toBe(2);
      expect(result.floors.names).toEqual(['Ground Floor', 'First Floor']);
    });

    it('should count rooms correctly', () => {
      const mockPanel = {
        _floors: [
          { floor_id: 'floor1', name: 'Ground Floor' }
        ],
        _areas: [
          { area_id: 'area1', floor_id: 'floor1' },
          { area_id: 'area2', floor_id: 'floor1' },
          { area_id: 'area3', floor_id: 'floor1' }
        ]
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.rooms.total).toBe(3);
      expect(result.rooms.byFloor.floor1).toBe(3);
    });

    it('should count selected entities correctly', () => {
      const mockPanel = {
        _floors: [],
        _areas: [],
        _wizardEntityState: {
          selected: {
            'light.lamp1': true,
            'light.lamp2': true,
            'switch.outlet': false,
            'climate.thermostat': true
          }
        }
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.entities.selected).toBe(3);
    });

    it('should get weather entity info when selected', () => {
      const mockPanel = {
        _floors: [],
        _areas: [],
        _wizardWeatherState: {
          selectedEntity: 'weather.home'
        },
        hass: {
          states: {
            'weather.home': {
              state: 'sunny',
              attributes: {
                friendly_name: 'Home Weather'
              }
            }
          }
        }
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.weather.entityId).toBe('weather.home');
      expect(result.weather.entityName).toBe('Home Weather');
    });

    it('should handle weather entity not found in hass', () => {
      const mockPanel = {
        _floors: [],
        _areas: [],
        _wizardWeatherState: {
          selectedEntity: 'weather.missing'
        },
        hass: {
          states: {}
        }
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.weather.entityId).toBe('weather.missing');
      expect(result.weather.entityName).toBeNull();
    });

    it('should return null weather when no entity selected', () => {
      const mockPanel = {
        _floors: [],
        _areas: [],
        _wizardWeatherState: {
          selectedEntity: null
        }
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.weather.entityId).toBeNull();
      expect(result.weather.entityName).toBeNull();
    });

    it('should provide complete summary with all data', () => {
      const mockPanel = {
        _floors: [
          { floor_id: 'floor1', name: 'Ground' },
          { floor_id: 'floor2', name: 'Upstairs' }
        ],
        _areas: [
          { area_id: 'area1', floor_id: 'floor1' },
          { area_id: 'area2', floor_id: 'floor2' },
          { area_id: 'area3', floor_id: 'floor2' }
        ],
        _wizardEntityState: {
          selected: {
            'light.lamp1': true,
            'light.lamp2': true
          }
        },
        _wizardLayoutState: {
          floorOrder: ['floor2', 'floor1']
        },
        _wizardWeatherState: {
          selectedEntity: 'weather.home'
        },
        hass: {
          states: {
            'weather.home': {
              state: 'sunny',
              attributes: { friendly_name: 'Home' }
            }
          }
        }
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.floors.count).toBe(2);
      expect(result.rooms.total).toBe(3);
      expect(result.rooms.byFloor.floor1).toBe(1);
      expect(result.rooms.byFloor.floor2).toBe(2);
      expect(result.entities.selected).toBe(2);
      expect(result.weather.entityName).toBe('Home');
    });
  });
});
