/**
 * Mode Store Tests
 * Tests for mode management functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  ModeStore,
  getModeStore,
  resetModeStore,
  DEFAULT_MODE,
  MODE_SETTINGS_SCHEMA
} from './mode-store.js';

// Mock settings store
vi.mock('./settings-store.js', () => ({
  getSettingsStore: vi.fn(() => ({
    all: {
      enabledRooms: { room1: true, room2: true },
      enabledLights: { 'light.lamp1': true },
      floorOrder: ['floor1', 'floor2']
    },
    get: vi.fn((key) => {
      if (key === 'modeData') return null;
      return null;
    }),
    update: vi.fn()
  }))
}));

describe('Mode Store', () => {
  let store;

  beforeEach(() => {
    resetModeStore();
    store = getModeStore();
  });

  afterEach(() => {
    resetModeStore();
  });

  describe('Initialization', () => {
    it('should create singleton instance', () => {
      const store1 = getModeStore();
      const store2 = getModeStore();
      expect(store1).toBe(store2);
    });

    it('should have default mode on initialization', () => {
      expect(store.modes.default).toBeDefined();
      expect(store.modes.default.name).toBe('Default');
      expect(store.modes.default.deletable).toBe(false);
    });

    it('should have default as active mode', () => {
      expect(store.activeMode).toBe('default');
    });

    it('should not have manual override initially', () => {
      expect(store.isManualOverride).toBe(false);
    });
  });

  describe('DEFAULT_MODE', () => {
    it('should export DEFAULT_MODE constant', () => {
      expect(DEFAULT_MODE).toBeDefined();
      expect(DEFAULT_MODE.id).toBe('default');
      expect(DEFAULT_MODE.name).toBe('Default');
      expect(DEFAULT_MODE.deletable).toBe(false);
      expect(DEFAULT_MODE.settings).toEqual({});
    });
  });

  describe('MODE_SETTINGS_SCHEMA', () => {
    it('should export settings schema', () => {
      expect(MODE_SETTINGS_SCHEMA).toBeDefined();
      expect(MODE_SETTINGS_SCHEMA.dimmedUI).toBeDefined();
      expect(MODE_SETTINGS_SCHEMA.reducedAnimations).toBeDefined();
    });

    it('should have correct default values', () => {
      expect(MODE_SETTINGS_SCHEMA.dimmedUI.default).toBe(false);
      expect(MODE_SETTINGS_SCHEMA.enabledRoomsOverride.default).toBeNull();
    });
  });

  describe('createMode', () => {
    it('should create a new mode with unique ID', () => {
      const modeId = store.createMode('Night Mode');
      expect(modeId).toMatch(/^mode_\d+_[a-z0-9]+$/);
      expect(store.modes[modeId]).toBeDefined();
    });

    it('should set correct name', () => {
      const modeId = store.createMode('Night Mode');
      expect(store.modes[modeId].name).toBe('Night Mode');
    });

    it('should mark new mode as deletable', () => {
      const modeId = store.createMode('Night Mode');
      expect(store.modes[modeId].deletable).toBe(true);
    });

    it('should copy settings from base mode', () => {
      // First create a mode with settings
      const baseId = store.createMode('Base Mode');
      store.updateMode(baseId, {
        settings: { dimmedUI: true, reducedAnimations: true }
      });

      // Create mode based on it
      const newId = store.createMode('New Mode', baseId);
      expect(store.modes[newId].settings.dimmedUI).toBe(true);
      expect(store.modes[newId].settings.reducedAnimations).toBe(true);
    });

    it('should default to empty settings if base is default', () => {
      const modeId = store.createMode('New Mode', 'default');
      expect(store.modes[modeId].settings).toEqual({});
    });

    it('should use default base if not specified', () => {
      const modeId = store.createMode('New Mode');
      expect(store.modes[modeId].settings).toEqual({});
    });
  });

  describe('updateMode', () => {
    it('should update mode name', () => {
      const modeId = store.createMode('Original Name');
      store.updateMode(modeId, { name: 'Updated Name' });
      expect(store.modes[modeId].name).toBe('Updated Name');
    });

    it('should update mode settings', () => {
      const modeId = store.createMode('Test Mode');
      store.updateMode(modeId, {
        settings: { dimmedUI: true }
      });
      expect(store.modes[modeId].settings.dimmedUI).toBe(true);
    });

    it('should merge settings, not replace', () => {
      const modeId = store.createMode('Test Mode');
      store.updateMode(modeId, {
        settings: { dimmedUI: true }
      });
      store.updateMode(modeId, {
        settings: { reducedAnimations: true }
      });
      expect(store.modes[modeId].settings.dimmedUI).toBe(true);
      expect(store.modes[modeId].settings.reducedAnimations).toBe(true);
    });

    it('should return false for non-existent mode', () => {
      const result = store.updateMode('non_existent', { name: 'Test' });
      expect(result).toBe(false);
    });

    it('should return true on success', () => {
      const modeId = store.createMode('Test');
      const result = store.updateMode(modeId, { name: 'Updated' });
      expect(result).toBe(true);
    });

    it('should allow updating default mode name', () => {
      store.updateMode('default', { name: 'Home' });
      expect(store.modes.default.name).toBe('Home');
    });
  });

  describe('duplicateMode', () => {
    it('should create a copy with (Copy) suffix', () => {
      const originalId = store.createMode('Night Mode');
      const copyId = store.duplicateMode(originalId);

      expect(copyId).not.toBe(originalId);
      expect(store.modes[copyId].name).toBe('Night Mode (Copy)');
    });

    it('should copy settings from original', () => {
      const originalId = store.createMode('Night Mode');
      store.updateMode(originalId, {
        settings: { dimmedUI: true, defaultFloor: 'floor1' }
      });

      const copyId = store.duplicateMode(originalId);
      expect(store.modes[copyId].settings.dimmedUI).toBe(true);
      expect(store.modes[copyId].settings.defaultFloor).toBe('floor1');
    });

    it('should return null for non-existent mode', () => {
      const result = store.duplicateMode('non_existent');
      expect(result).toBeNull();
    });

    it('should allow duplicating default mode', () => {
      const copyId = store.duplicateMode('default');
      expect(copyId).toBeDefined();
      expect(store.modes[copyId].name).toBe('Default (Copy)');
      expect(store.modes[copyId].deletable).toBe(true);
    });
  });

  describe('deleteMode', () => {
    it('should delete a deletable mode', () => {
      const modeId = store.createMode('Test Mode');
      expect(store.modes[modeId]).toBeDefined();

      const result = store.deleteMode(modeId);
      expect(result).toBe(true);
      expect(store.modes[modeId]).toBeUndefined();
    });

    it('should not delete default mode', () => {
      const result = store.deleteMode('default');
      expect(result).toBe(false);
      expect(store.modes.default).toBeDefined();
    });

    it('should return false for non-existent mode', () => {
      const result = store.deleteMode('non_existent');
      expect(result).toBe(false);
    });

    it('should switch to default if deleting active mode', () => {
      const modeId = store.createMode('Active Mode');
      store.activateMode(modeId);
      expect(store.activeMode).toBe(modeId);

      store.deleteMode(modeId);
      expect(store.activeMode).toBe('default');
    });
  });

  describe('activateMode', () => {
    it('should activate an existing mode', () => {
      const modeId = store.createMode('Night Mode');
      const result = store.activateMode(modeId);

      expect(result).toBe(true);
      expect(store.activeMode).toBe(modeId);
    });

    it('should set manual override flag by default', () => {
      const modeId = store.createMode('Night Mode');
      store.activateMode(modeId);
      expect(store.isManualOverride).toBe(true);
    });

    it('should not set manual override when isManual=false', () => {
      const modeId = store.createMode('Night Mode');
      store.activateMode(modeId, false);
      expect(store.isManualOverride).toBe(false);
    });

    it('should return false for non-existent mode', () => {
      const result = store.activateMode('non_existent');
      expect(result).toBe(false);
    });

    it('should allow activating default mode', () => {
      const modeId = store.createMode('Night Mode');
      store.activateMode(modeId);
      const result = store.activateMode('default');

      expect(result).toBe(true);
      expect(store.activeMode).toBe('default');
    });
  });

  describe('getActiveMode', () => {
    it('should return the active mode object', () => {
      const modeId = store.createMode('Night Mode');
      store.activateMode(modeId);

      const activeMode = store.getActiveMode();
      expect(activeMode.id).toBe(modeId);
      expect(activeMode.name).toBe('Night Mode');
    });

    it('should return default mode if active is invalid', () => {
      store._activeMode = 'invalid_mode';
      const activeMode = store.getActiveMode();
      expect(activeMode.id).toBe('default');
    });
  });

  describe('getMode', () => {
    it('should return mode by ID', () => {
      const modeId = store.createMode('Test Mode');
      const mode = store.getMode(modeId);
      expect(mode.name).toBe('Test Mode');
    });

    it('should return null for non-existent mode', () => {
      const mode = store.getMode('non_existent');
      expect(mode).toBeNull();
    });
  });

  describe('modesList', () => {
    it('should return array of modes', () => {
      store.createMode('Mode 1');
      store.createMode('Mode 2');

      const list = store.modesList;
      expect(Array.isArray(list)).toBe(true);
      expect(list.length).toBe(3); // default + 2 custom
    });
  });

  describe('clearManualOverride', () => {
    it('should clear the manual override flag', () => {
      const modeId = store.createMode('Test Mode');
      store.activateMode(modeId);
      expect(store.isManualOverride).toBe(true);

      store.clearManualOverride();
      expect(store.isManualOverride).toBe(false);
    });
  });

  describe('getEffectiveSettings', () => {
    it('should merge base settings with mode overrides', () => {
      const modeId = store.createMode('Night Mode');
      store.updateMode(modeId, {
        settings: { dimmedUI: true }
      });
      store.activateMode(modeId);

      const effective = store.getEffectiveSettings();
      expect(effective.dimmedUI).toBe(true);
      expect(effective.enabledRooms).toBeDefined();
    });

    it('should apply floor order override', () => {
      const modeId = store.createMode('Custom Order');
      store.updateMode(modeId, {
        settings: { floorOrderOverride: ['floor2', 'floor1'] }
      });
      store.activateMode(modeId);

      const effective = store.getEffectiveSettings();
      expect(effective.floorOrder).toEqual(['floor2', 'floor1']);
    });

    it('should use base settings when no override', () => {
      const effective = store.getEffectiveSettings();
      expect(effective.enabledRooms).toEqual({ room1: true, room2: true });
    });
  });

  describe('subscribe', () => {
    it('should notify listeners on mode creation', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.createMode('Test Mode');
      expect(listener).toHaveBeenCalled();
    });

    it('should notify listeners on mode activation', () => {
      const listener = vi.fn();
      const modeId = store.createMode('Test Mode');

      store.subscribe(listener);
      listener.mockClear();

      store.activateMode(modeId);
      expect(listener).toHaveBeenCalled();
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      store.createMode('Test 1');
      expect(listener).toHaveBeenCalledTimes(1);

      unsubscribe();
      store.createMode('Test 2');
      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should handle listener errors gracefully', () => {
      const errorListener = vi.fn(() => { throw new Error('Test error'); });
      const goodListener = vi.fn();

      store.subscribe(errorListener);
      store.subscribe(goodListener);

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      store.createMode('Test Mode');

      expect(consoleSpy).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('reset', () => {
    it('should reset to initial state', () => {
      store.createMode('Mode 1');
      store.createMode('Mode 2');
      store.activateMode(Object.keys(store.modes)[1]);

      store.reset();

      expect(Object.keys(store.modes).length).toBe(1);
      expect(store.modes.default).toBeDefined();
      expect(store.activeMode).toBe('default');
      expect(store.isManualOverride).toBe(false);
    });
  });

  describe('resetModeStore', () => {
    it('should reset the singleton instance', () => {
      const store1 = getModeStore();
      store1.createMode('Test Mode');

      resetModeStore();

      const store2 = getModeStore();
      expect(store2).not.toBe(store1);
      expect(Object.keys(store2.modes).length).toBe(1);
    });
  });
});
