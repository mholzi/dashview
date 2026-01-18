/**
 * Floors Step Tests
 * Tests for floor order step - allows reordering floors from Home Assistant
 *
 * Note: Floor creation/deletion is handled in Home Assistant settings,
 * this step only handles display order configuration.
 */

import { describe, it, expect, vi } from 'vitest';
import {
  floorsStepStyles,
  getFloorIcon
} from './floors-step.js';

// Mock the shared module
vi.mock('../../shared.js', () => ({
  t: (key, fallback) => fallback
}));

// Mock stores
vi.mock('../../../../stores/index.js', () => ({
  getSettingsStore: vi.fn(() => ({
    get: vi.fn(() => []),
    set: vi.fn(),
    settings: {},
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    updateSettings: vi.fn()
  }))
}));

describe('Floors Step', () => {
  describe('floorsStepStyles', () => {
    it('should export styles string', () => {
      expect(floorsStepStyles).toBeDefined();
      expect(typeof floorsStepStyles).toBe('string');
    });

    it('should contain floors step container class', () => {
      expect(floorsStepStyles).toContain('.dv-floors-step');
    });

    it('should contain floor item class', () => {
      expect(floorsStepStyles).toContain('.dv-floor-item');
    });

    it('should contain floor list class', () => {
      expect(floorsStepStyles).toContain('.dv-floors-list');
    });

    it('should contain drag handle class', () => {
      expect(floorsStepStyles).toContain('.dv-floor-drag-handle');
    });

    it('should contain dragging state class', () => {
      expect(floorsStepStyles).toContain('.dv-floor-item.dragging');
    });

    it('should contain empty state class', () => {
      expect(floorsStepStyles).toContain('.dv-floors-empty');
    });

    it('should use CSS custom properties with dv prefix', () => {
      expect(floorsStepStyles).toContain('--dv-');
    });

    it('should include fallback CSS variables', () => {
      expect(floorsStepStyles).toContain('var(--primary-color)');
      expect(floorsStepStyles).toContain('var(--primary-text-color)');
    });
  });

  describe('getFloorIcon', () => {
    it('should return basement icon for basement floor', () => {
      expect(getFloorIcon({ name: 'Basement' }, 0)).toBe('mdi:home-floor-negative-1');
      expect(getFloorIcon({ name: 'Keller' }, 0)).toBe('mdi:home-floor-negative-1');
      expect(getFloorIcon({ name: 'Untergeschoss' }, 0)).toBe('mdi:home-floor-negative-1');
    });

    it('should return ground floor icon for ground floor', () => {
      expect(getFloorIcon({ name: 'Ground Floor' }, 0)).toBe('mdi:home-floor-0');
      expect(getFloorIcon({ name: 'Erdgeschoss' }, 0)).toBe('mdi:home-floor-0');
      expect(getFloorIcon({ name: 'EG' }, 0)).toBe('mdi:home-floor-0');
    });

    it('should return first floor icon for first floor', () => {
      expect(getFloorIcon({ name: 'First Floor' }, 0)).toBe('mdi:home-floor-1');
      expect(getFloorIcon({ name: 'Obergeschoss' }, 0)).toBe('mdi:home-floor-1');
      expect(getFloorIcon({ name: 'OG' }, 0)).toBe('mdi:home-floor-1');
      expect(getFloorIcon({ name: 'Floor 1' }, 0)).toBe('mdi:home-floor-1');
    });

    it('should return second floor icon for second floor', () => {
      expect(getFloorIcon({ name: 'Second Floor' }, 0)).toBe('mdi:home-floor-2');
      expect(getFloorIcon({ name: 'Floor 2' }, 0)).toBe('mdi:home-floor-2');
    });

    it('should return attic icon for attic floor', () => {
      expect(getFloorIcon({ name: 'Attic' }, 0)).toBe('mdi:home-floor-3');
      expect(getFloorIcon({ name: 'Dachgeschoss' }, 0)).toBe('mdi:home-floor-3');
      expect(getFloorIcon({ name: 'Floor 3' }, 0)).toBe('mdi:home-floor-3');
    });

    it('should return icon based on index for unknown floors', () => {
      expect(getFloorIcon({ name: 'Unknown' }, 0)).toBe('mdi:home-floor-0');
      expect(getFloorIcon({ name: 'Unknown' }, 1)).toBe('mdi:home-floor-1');
      expect(getFloorIcon({ name: 'Unknown' }, 2)).toBe('mdi:home-floor-2');
      expect(getFloorIcon({ name: 'Unknown' }, 3)).toBe('mdi:home-floor-3');
      expect(getFloorIcon({ name: 'Unknown' }, 4)).toBe('mdi:home-floor-0'); // Wraps around
    });

    it('should handle floor_id fallback', () => {
      expect(getFloorIcon({ floor_id: 'basement' }, 0)).toBe('mdi:home-floor-negative-1');
      expect(getFloorIcon({ floor_id: 'ground_floor' }, 0)).toBe('mdi:home-floor-0');
    });

    it('should handle empty floor object', () => {
      expect(getFloorIcon({}, 0)).toBe('mdi:home-floor-0');
      expect(getFloorIcon({}, 1)).toBe('mdi:home-floor-1');
    });

    it('should be case insensitive', () => {
      expect(getFloorIcon({ name: 'BASEMENT' }, 0)).toBe('mdi:home-floor-negative-1');
      expect(getFloorIcon({ name: 'ground floor' }, 0)).toBe('mdi:home-floor-0');
      expect(getFloorIcon({ name: 'ATTIC' }, 0)).toBe('mdi:home-floor-3');
    });
  });
});

describe('Floor Step Behavior', () => {
  describe('Floor ordering', () => {
    it('should maintain floor order after drag-drop', () => {
      const initialOrder = ['floor1', 'floor2', 'floor3'];

      // Simulate dragging floor3 to position 0
      const draggedId = 'floor3';
      const targetIndex = 0;
      const draggedIndex = initialOrder.indexOf(draggedId);

      const newOrder = [...initialOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);

      expect(newOrder).toEqual(['floor3', 'floor1', 'floor2']);
    });

    it('should not change order when dropping on same position', () => {
      const initialOrder = ['floor1', 'floor2', 'floor3'];
      const draggedId = 'floor2';
      const targetId = 'floor2';

      // When dragging to same position, order should not change
      const shouldUpdate = draggedId !== targetId;
      expect(shouldUpdate).toBe(false);
    });

    it('should handle reordering at end of list', () => {
      const initialOrder = ['floor1', 'floor2', 'floor3'];

      // Simulate dragging floor1 to position 2
      const draggedId = 'floor1';
      const targetIndex = 2;
      const draggedIndex = initialOrder.indexOf(draggedId);

      const newOrder = [...initialOrder];
      newOrder.splice(draggedIndex, 1);
      newOrder.splice(targetIndex, 0, draggedId);

      expect(newOrder).toEqual(['floor2', 'floor3', 'floor1']);
    });
  });

  describe('Area count per floor', () => {
    it('should count areas assigned to each floor', () => {
      const areas = [
        { area_id: 'living_room', floor_id: 'floor1' },
        { area_id: 'kitchen', floor_id: 'floor1' },
        { area_id: 'bedroom', floor_id: 'floor2' },
        { area_id: 'office', floor_id: null }
      ];

      const getAreaCount = (floorId) => {
        return areas.filter(a => a.floor_id === floorId).length;
      };

      expect(getAreaCount('floor1')).toBe(2);
      expect(getAreaCount('floor2')).toBe(1);
      expect(getAreaCount('floor3')).toBe(0);
    });
  });
});
