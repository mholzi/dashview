/**
 * Layout Step Tests
 * Tests for floor layout configuration step
 */

import { describe, it, expect, vi } from 'vitest';
import {
  layoutStepStyles,
  getFloorOrder,
  saveFloorOrder
} from './layout-step.js';

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
  }))
}));

describe('Layout Step', () => {
  describe('layoutStepStyles', () => {
    it('should export styles string', () => {
      expect(layoutStepStyles).toBeDefined();
      expect(typeof layoutStepStyles).toBe('string');
    });

    it('should contain layout step container class', () => {
      expect(layoutStepStyles).toContain('.dv-layout-step');
    });

    it('should contain floor item class', () => {
      expect(layoutStepStyles).toContain('.dv-layout-floor');
    });

    it('should contain floor order buttons class', () => {
      expect(layoutStepStyles).toContain('.dv-layout-order-btn');
    });

    it('should contain preview section class', () => {
      expect(layoutStepStyles).toContain('.dv-layout-preview');
    });

    it('should use CSS custom properties with dv prefix', () => {
      expect(layoutStepStyles).toContain('--dv-');
    });
  });

  describe('getFloorOrder', () => {
    it('should return empty array when no wizard state exists', () => {
      const mockPanel = {};
      const result = getFloorOrder(mockPanel);
      expect(result).toEqual([]);
    });

    it('should return empty array when floorOrder is undefined', () => {
      const mockPanel = {
        _wizardLayoutState: {}
      };
      const result = getFloorOrder(mockPanel);
      expect(result).toEqual([]);
    });

    it('should return floor order from wizard state', () => {
      const mockPanel = {
        _wizardLayoutState: {
          floorOrder: ['floor1', 'floor2', 'floor3']
        }
      };
      const result = getFloorOrder(mockPanel);
      expect(result).toEqual(['floor1', 'floor2', 'floor3']);
    });
  });

  describe('saveFloorOrder', () => {
    it('should call updateSettings with floor order', () => {
      const mockUpdateSettings = vi.fn();
      const mockSettingsStore = {
        settings: {},
        updateSettings: mockUpdateSettings
      };
      const floorOrder = ['floor1', 'floor2'];

      saveFloorOrder(floorOrder, mockSettingsStore);

      expect(mockUpdateSettings).toHaveBeenCalled();
      const updatedSettings = mockUpdateSettings.mock.calls[0][0];
      expect(updatedSettings.floorOrder).toEqual(['floor1', 'floor2']);
    });

    it('should preserve existing settings', () => {
      const mockUpdateSettings = vi.fn();
      const mockSettingsStore = {
        settings: { existingKey: 'value' },
        updateSettings: mockUpdateSettings
      };
      const floorOrder = ['floor1'];

      saveFloorOrder(floorOrder, mockSettingsStore);

      const updatedSettings = mockUpdateSettings.mock.calls[0][0];
      expect(updatedSettings.existingKey).toBe('value');
      expect(updatedSettings.floorOrder).toEqual(['floor1']);
    });

    it('should handle errors gracefully', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const mockSettingsStore = {
        settings: null,
        updateSettings: vi.fn(() => { throw new Error('Test error'); })
      };

      expect(() => {
        saveFloorOrder(['floor1'], mockSettingsStore);
      }).not.toThrow();

      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });
});
