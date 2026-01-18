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
  t: (key, fallback) => fallback,
  LABEL_CATEGORIES: [
    { key: 'light', prop: '_lightLabelId' },
    { key: 'cover', prop: '_coverLabelId' },
    { key: 'motion', prop: '_motionLabelId' }
  ]
}));

// Mock stores
vi.mock('../../../../stores/index.js', () => ({
  getSettingsStore: vi.fn(() => ({
    get: vi.fn((key) => null),
    settings: {},
    subscribe: vi.fn(),
    updateSettings: vi.fn()
  })),
  getOnboardingStore: vi.fn(() => ({
    currentStep: 6,
    steps: ['welcome', 'floorOrder', 'roomOrder', 'labels', 'roomConfig', 'floorCards', 'review'],
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

      expect(result.floorOrder.count).toBe(0);
      expect(result.floorOrder.names).toEqual([]);
      expect(result.roomOrder.total).toBe(0);
      expect(result.labels.mappedCount).toBe(0);
      expect(result.roomConfig.enabledCount).toBe(0);
      expect(result.floorCards.overviewsEnabled).toBe(0);
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

      expect(result.floorOrder.count).toBe(2);
      expect(result.floorOrder.names).toEqual(['Ground Floor', 'First Floor']);
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

      expect(result.roomOrder.total).toBe(3);
    });

    it('should count enabled rooms from wizard state', () => {
      const mockPanel = {
        _floors: [],
        _areas: [
          { area_id: 'area1' },
          { area_id: 'area2' },
          { area_id: 'area3' }
        ],
        _wizardRoomConfigState: {
          enabledRooms: {
            'area1': true,
            'area2': true,
            'area3': false
          }
        }
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.roomConfig.enabledCount).toBe(2);
      expect(result.roomConfig.total).toBe(3);
    });

    it('should count floor cards configuration', () => {
      const mockPanel = {
        _floors: [
          { floor_id: 'floor1', name: 'Ground' },
          { floor_id: 'floor2', name: 'Upstairs' }
        ],
        _areas: [],
        _wizardFloorCardsState: {
          floorOverviewEnabled: {
            'floor1': true,
            'floor2': false
          },
          floorCardConfig: {
            'floor1': { slot1: 'entity1', slot2: 'entity2' },
            'floor2': { slot1: 'entity3' }
          }
        }
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.floorCards.overviewsEnabled).toBe(1);
      expect(result.floorCards.slotsConfigured).toBe(3);
      expect(result.floorCards.floorsCount).toBe(2);
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
        _wizardRoomConfigState: {
          enabledRooms: {
            'area1': true,
            'area2': true
          }
        },
        _wizardFloorCardsState: {
          floorOverviewEnabled: { 'floor1': true },
          floorCardConfig: {}
        }
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.floorOrder.count).toBe(2);
      expect(result.roomOrder.total).toBe(3);
      expect(result.roomConfig.enabledCount).toBe(2);
      expect(result.floorCards.overviewsEnabled).toBe(1);
    });

    it('should show default floor order when no custom order', () => {
      const mockPanel = {
        _floors: [
          { floor_id: 'floor1', name: 'Ground' },
          { floor_id: 'floor2', name: 'Upstairs' }
        ],
        _areas: []
      };
      const result = generateReviewSummary(mockPanel);

      expect(result.floorOrder.names).toEqual(['Ground', 'Upstairs']);
      expect(result.floorOrder.isCustom).toBe(false);
    });
  });
});
