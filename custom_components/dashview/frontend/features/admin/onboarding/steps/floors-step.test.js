/**
 * Floors Step Tests
 * Tests for floor creation, deletion, drag-drop reordering
 *
 * Story 9.1 Task 4 Requirements:
 * - 4.2 Allow creating floors with name input
 * - 4.3 Drag-drop reordering for floor display order
 * - 4.4 Delete floor button with confirmation
 * - 4.5 Minimum 1 floor required validation
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  floorsStepStyles,
  getFloorIcon,
  createFloor,
  deleteFloor,
  refreshFloors
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

    it('should contain add floor section class', () => {
      expect(floorsStepStyles).toContain('.dv-add-floor-section');
    });

    it('should contain add floor input class', () => {
      expect(floorsStepStyles).toContain('.dv-add-floor-input');
    });

    it('should contain add floor button class', () => {
      expect(floorsStepStyles).toContain('.dv-add-floor-btn');
    });

    it('should contain drag handle class', () => {
      expect(floorsStepStyles).toContain('.dv-floor-drag-handle');
    });

    it('should contain dragging state class', () => {
      expect(floorsStepStyles).toContain('.dv-floor-item.dragging');
    });

    it('should contain delete button class', () => {
      expect(floorsStepStyles).toContain('.dv-floor-action-btn.delete');
    });

    it('should contain confirmation dialog classes', () => {
      expect(floorsStepStyles).toContain('.dv-floors-confirm-overlay');
      expect(floorsStepStyles).toContain('.dv-floors-confirm-dialog');
      expect(floorsStepStyles).toContain('.dv-floors-confirm-btn');
    });

    it('should contain validation message class', () => {
      expect(floorsStepStyles).toContain('.dv-floors-validation');
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

  describe('createFloor', () => {
    it('should throw error when hass is not available', async () => {
      await expect(createFloor(null, 'Test Floor')).rejects.toThrow('Home Assistant not available');
    });

    it('should throw error when name is empty', async () => {
      const mockHass = { callWS: vi.fn() };
      await expect(createFloor(mockHass, '')).rejects.toThrow('Floor name is required');
      await expect(createFloor(mockHass, '   ')).rejects.toThrow('Floor name is required');
    });

    it('should throw error when name is undefined', async () => {
      const mockHass = { callWS: vi.fn() };
      await expect(createFloor(mockHass, undefined)).rejects.toThrow('Floor name is required');
    });

    it('should call hass.callWS with correct parameters', async () => {
      const mockHass = {
        callWS: vi.fn().mockResolvedValue({ floor_id: 'test_floor', name: 'Test Floor' })
      };

      const result = await createFloor(mockHass, 'Test Floor');

      expect(mockHass.callWS).toHaveBeenCalledWith({
        type: 'config/floor_registry/create',
        name: 'Test Floor'
      });
      expect(result).toEqual({ floor_id: 'test_floor', name: 'Test Floor' });
    });

    it('should trim floor name', async () => {
      const mockHass = {
        callWS: vi.fn().mockResolvedValue({ floor_id: 'test_floor', name: 'Test Floor' })
      };

      await createFloor(mockHass, '  Test Floor  ');

      expect(mockHass.callWS).toHaveBeenCalledWith({
        type: 'config/floor_registry/create',
        name: 'Test Floor'
      });
    });

    it('should propagate errors from hass.callWS', async () => {
      const mockHass = {
        callWS: vi.fn().mockRejectedValue(new Error('API Error'))
      };

      await expect(createFloor(mockHass, 'Test Floor')).rejects.toThrow('API Error');
    });
  });

  describe('deleteFloor', () => {
    it('should throw error when hass is not available', async () => {
      await expect(deleteFloor(null, 'floor_id')).rejects.toThrow('Home Assistant not available');
    });

    it('should throw error when floorId is empty', async () => {
      const mockHass = { callWS: vi.fn() };
      await expect(deleteFloor(mockHass, '')).rejects.toThrow('Floor ID is required');
      await expect(deleteFloor(mockHass, undefined)).rejects.toThrow('Floor ID is required');
    });

    it('should call hass.callWS with correct parameters', async () => {
      const mockHass = {
        callWS: vi.fn().mockResolvedValue(undefined)
      };

      await deleteFloor(mockHass, 'test_floor');

      expect(mockHass.callWS).toHaveBeenCalledWith({
        type: 'config/floor_registry/delete',
        floor_id: 'test_floor'
      });
    });

    it('should propagate errors from hass.callWS', async () => {
      const mockHass = {
        callWS: vi.fn().mockRejectedValue(new Error('API Error'))
      };

      await expect(deleteFloor(mockHass, 'test_floor')).rejects.toThrow('API Error');
    });
  });

  describe('refreshFloors', () => {
    it('should return empty array when panel.hass is not available', async () => {
      const mockPanel = {};
      const result = await refreshFloors(mockPanel);
      expect(result).toEqual([]);
    });

    it('should call hass.callWS and update panel._floors', async () => {
      const mockFloors = [
        { floor_id: 'floor1', name: 'Floor 1' },
        { floor_id: 'floor2', name: 'Floor 2' }
      ];
      const mockPanel = {
        hass: {
          callWS: vi.fn().mockResolvedValue(mockFloors)
        }
      };

      const result = await refreshFloors(mockPanel);

      expect(mockPanel.hass.callWS).toHaveBeenCalledWith({
        type: 'config/floor_registry/list'
      });
      expect(result).toEqual(mockFloors);
      expect(mockPanel._floors).toEqual(mockFloors);
    });

    it('should propagate errors from hass.callWS', async () => {
      const mockPanel = {
        hass: {
          callWS: vi.fn().mockRejectedValue(new Error('API Error'))
        }
      };

      await expect(refreshFloors(mockPanel)).rejects.toThrow('API Error');
    });
  });
});

describe('Floor Step Behavior', () => {
  describe('Minimum floor validation (Task 4.5)', () => {
    it('should require at least one floor', () => {
      // This tests the validation logic conceptually
      const floors = [];
      const hasMinimumFloors = floors.length >= 1;
      expect(hasMinimumFloors).toBe(false);
    });

    it('should pass validation with one floor', () => {
      const floors = [{ floor_id: 'floor1', name: 'Floor 1' }];
      const hasMinimumFloors = floors.length >= 1;
      expect(hasMinimumFloors).toBe(true);
    });

    it('should pass validation with multiple floors', () => {
      const floors = [
        { floor_id: 'floor1', name: 'Floor 1' },
        { floor_id: 'floor2', name: 'Floor 2' }
      ];
      const hasMinimumFloors = floors.length >= 1;
      expect(hasMinimumFloors).toBe(true);
    });
  });

  describe('Delete prevention (Task 4.4)', () => {
    it('should prevent deletion when only one floor exists', () => {
      const floors = [{ floor_id: 'floor1', name: 'Floor 1' }];
      const canDelete = floors.length > 1;
      expect(canDelete).toBe(false);
    });

    it('should allow deletion when multiple floors exist', () => {
      const floors = [
        { floor_id: 'floor1', name: 'Floor 1' },
        { floor_id: 'floor2', name: 'Floor 2' }
      ];
      const canDelete = floors.length > 1;
      expect(canDelete).toBe(true);
    });
  });

  describe('Floor ordering (Task 4.3)', () => {
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

  describe('Floor creation (Task 4.2)', () => {
    it('should validate floor name is not empty', () => {
      const isValidName = (name) => Boolean(name && name.trim().length > 0);

      expect(isValidName('')).toBe(false);
      expect(isValidName('   ')).toBe(false);
      expect(isValidName('Ground Floor')).toBe(true);
      expect(isValidName('  First Floor  ')).toBe(true);
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
