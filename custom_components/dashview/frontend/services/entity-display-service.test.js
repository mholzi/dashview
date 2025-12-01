import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityDisplayService } from './entity-display-service.js';

// Mock i18n module
vi.mock('../utils/i18n.js');

/**
 * Helper function to create mock entity state
 * @param {string} entityId - Entity ID
 * @param {string} state - Entity state
 * @param {Object} attributes - Entity attributes
 * @returns {Object} Mock state object
 */
function createMockState(entityId, state, attributes = {}) {
  return {
    entity_id: entityId,
    state,
    attributes: {
      friendly_name: attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' '),
      ...attributes,
    },
    last_changed: '2025-12-01T10:00:00Z',
    last_updated: '2025-12-01T10:00:00Z',
  };
}

describe('EntityDisplayService', () => {
  let service;

  beforeEach(() => {
    vi.resetModules();
    service = new EntityDisplayService();
  });

  describe('Initialization', () => {
    it('should initialize with empty registry and labels', () => {
      expect(service._entityRegistry).toEqual([]);
      expect(service._labelIds).toEqual({});
    });

    it('should set entity registry', () => {
      const registry = [
        { entity_id: 'light.test', labels: ['label1'] },
      ];
      service.setEntityRegistry(registry);
      expect(service._entityRegistry).toEqual(registry);
    });

    it('should set label IDs', () => {
      const labelIds = { motion: 'motion_label_id', light: 'light_label_id' };
      service.setLabelIds(labelIds);
      expect(service._labelIds).toEqual(labelIds);
    });

    it('should handle null registry gracefully', () => {
      service.setEntityRegistry(null);
      expect(service._entityRegistry).toEqual([]);
    });

    it('should handle null labelIds gracefully', () => {
      service.setLabelIds(null);
      expect(service._labelIds).toEqual({});
    });
  });

  describe('getEntityLabels', () => {
    beforeEach(() => {
      const registry = [
        { entity_id: 'light.test1', labels: ['label1', 'label2'] },
        { entity_id: 'light.test2', labels: [] },
        { entity_id: 'light.test3', labels: ['label3'] },
      ];
      service.setEntityRegistry(registry);
    });

    it('should return labels for existing entity', () => {
      const labels = service.getEntityLabels('light.test1');
      expect(labels).toEqual(['label1', 'label2']);
    });

    it('should return empty array for entity with no labels', () => {
      const labels = service.getEntityLabels('light.test2');
      expect(labels).toEqual([]);
    });

    it('should return undefined for non-existent entity', () => {
      const labels = service.getEntityLabels('light.nonexistent');
      expect(labels).toBeUndefined();
    });
  });

  describe('hasLabel', () => {
    beforeEach(() => {
      const registry = [
        { entity_id: 'binary_sensor.motion1', labels: ['motion_label', 'other_label'] },
        { entity_id: 'binary_sensor.motion2', labels: [] },
      ];
      const labelIds = {
        motion: 'motion_label',
        window: 'window_label',
      };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);
    });

    it('should return true when entity has the label', () => {
      const hasLabel = service.hasLabel('binary_sensor.motion1', 'motion');
      expect(hasLabel).toBe(true);
    });

    it('should return false when entity does not have the label', () => {
      const hasLabel = service.hasLabel('binary_sensor.motion2', 'motion');
      expect(hasLabel).toBe(false);
    });

    it('should return false when label type is not defined', () => {
      const hasLabel = service.hasLabel('binary_sensor.motion1', 'nonexistent');
      expect(hasLabel).toBe(false);
    });

    it('should return false when entity is not in registry', () => {
      const hasLabel = service.hasLabel('binary_sensor.nonexistent', 'motion');
      expect(hasLabel).toBe(false);
    });
  });

  describe('getDisplayInfo - Light entities', () => {
    it('should return display info for light ON without brightness', () => {
      const state = createMockState('light.test', 'on', {});
      const info = service.getDisplayInfo('light.test', state);

      expect(info).toEqual({
        icon: 'mdi:lightbulb',
        labelText: 'common.status.on',
        cardClass: 'active-light',
        friendlyName: 'test',
        state,
        entityId: 'light.test',
      });
    });

    it('should return display info for light ON with brightness', () => {
      const state = createMockState('light.test', 'on', { brightness: 128 });
      const info = service.getDisplayInfo('light.test', state);

      expect(info).toEqual({
        icon: 'mdi:lightbulb',
        labelText: 'common.status.on (50%)',
        cardClass: 'active-light',
        friendlyName: 'test',
        state,
        entityId: 'light.test',
      });
    });

    it('should calculate brightness percentage correctly', () => {
      const state = createMockState('light.test', 'on', { brightness: 255 });
      const info = service.getDisplayInfo('light.test', state);
      expect(info.labelText).toBe('common.status.on (100%)');
    });

    it('should return display info for light OFF', () => {
      const state = createMockState('light.test', 'off', {});
      const info = service.getDisplayInfo('light.test', state);

      expect(info).toEqual({
        icon: 'mdi:lightbulb',
        labelText: 'common.status.off',
        cardClass: 'inactive',
        friendlyName: 'test',
        state,
        entityId: 'light.test',
      });
    });

    it('should use custom icon when provided', () => {
      const state = createMockState('light.test', 'on', { icon: 'mdi:ceiling-light' });
      const info = service.getDisplayInfo('light.test', state);
      expect(info.icon).toBe('mdi:ceiling-light');
    });
  });

  describe('getDisplayInfo - Binary sensors by label', () => {
    beforeEach(() => {
      const registry = [
        { entity_id: 'binary_sensor.motion', labels: ['motion_label'] },
        { entity_id: 'binary_sensor.window', labels: ['window_label'] },
        { entity_id: 'binary_sensor.garage', labels: ['garage_label'] },
        { entity_id: 'binary_sensor.vibration', labels: ['vibration_label'] },
        { entity_id: 'binary_sensor.smoke', labels: ['smoke_label'] },
      ];
      const labelIds = {
        motion: 'motion_label',
        window: 'window_label',
        garage: 'garage_label',
        vibration: 'vibration_label',
        smoke: 'smoke_label',
      };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);
    });

    it('should return display info for motion sensor ON', () => {
      const state = createMockState('binary_sensor.motion', 'on', {});
      const info = service.getDisplayInfo('binary_sensor.motion', state);

      expect(info).toEqual({
        icon: 'mdi:motion-sensor',
        labelText: 'sensor.motion.detected',
        cardClass: 'active-gradient',
        friendlyName: 'motion',
        state,
        entityId: 'binary_sensor.motion',
      });
    });

    it('should return display info for motion sensor OFF', () => {
      const state = createMockState('binary_sensor.motion', 'off', {});
      const info = service.getDisplayInfo('binary_sensor.motion', state);

      expect(info).toEqual({
        icon: 'mdi:motion-sensor-off',
        labelText: 'sensor.motion.no_motion',
        cardClass: 'inactive',
        friendlyName: 'motion',
        state,
        entityId: 'binary_sensor.motion',
      });
    });

    it('should return display info for window sensor ON', () => {
      const state = createMockState('binary_sensor.window', 'on', {});
      const info = service.getDisplayInfo('binary_sensor.window', state);

      expect(info).toEqual({
        icon: 'mdi:window-open',
        labelText: 'sensor.window.on',
        cardClass: 'active-gradient',
        friendlyName: 'window',
        state,
        entityId: 'binary_sensor.window',
      });
    });

    it('should return display info for window sensor OFF', () => {
      const state = createMockState('binary_sensor.window', 'off', {});
      const info = service.getDisplayInfo('binary_sensor.window', state);

      expect(info).toEqual({
        icon: 'mdi:window-closed',
        labelText: 'sensor.window.off',
        cardClass: 'inactive',
        friendlyName: 'window',
        state,
        entityId: 'binary_sensor.window',
      });
    });

    it('should return display info for garage sensor ON', () => {
      const state = createMockState('binary_sensor.garage', 'on', {});
      const info = service.getDisplayInfo('binary_sensor.garage', state);

      expect(info).toEqual({
        icon: 'mdi:garage-open',
        labelText: 'sensor.garage.on',
        cardClass: 'active-gradient',
        friendlyName: 'garage',
        state,
        entityId: 'binary_sensor.garage',
      });
    });

    it('should return display info for garage sensor OFF', () => {
      const state = createMockState('binary_sensor.garage', 'off', {});
      const info = service.getDisplayInfo('binary_sensor.garage', state);

      expect(info).toEqual({
        icon: 'mdi:garage',
        labelText: 'sensor.garage.off',
        cardClass: 'inactive',
        friendlyName: 'garage',
        state,
        entityId: 'binary_sensor.garage',
      });
    });

    it('should return display info for vibration sensor ON', () => {
      const state = createMockState('binary_sensor.vibration', 'on', {});
      const info = service.getDisplayInfo('binary_sensor.vibration', state);

      expect(info).toEqual({
        icon: 'mdi:vibrate',
        labelText: 'sensor.vibration.on',
        cardClass: 'active-gradient',
        friendlyName: 'vibration',
        state,
        entityId: 'binary_sensor.vibration',
      });
    });

    it('should return display info for vibration sensor OFF', () => {
      const state = createMockState('binary_sensor.vibration', 'off', {});
      const info = service.getDisplayInfo('binary_sensor.vibration', state);

      expect(info).toEqual({
        icon: 'mdi:vibrate-off',
        labelText: 'sensor.vibration.off',
        cardClass: 'inactive',
        friendlyName: 'vibration',
        state,
        entityId: 'binary_sensor.vibration',
      });
    });

    it('should return display info for smoke sensor ON', () => {
      const state = createMockState('binary_sensor.smoke', 'on', {});
      const info = service.getDisplayInfo('binary_sensor.smoke', state);

      expect(info).toEqual({
        icon: 'mdi:smoke-detector-alert',
        labelText: 'sensor.smoke.on',
        cardClass: 'active-gradient',
        friendlyName: 'smoke',
        state,
        entityId: 'binary_sensor.smoke',
      });
    });

    it('should return display info for smoke sensor OFF', () => {
      const state = createMockState('binary_sensor.smoke', 'off', {});
      const info = service.getDisplayInfo('binary_sensor.smoke', state);

      expect(info).toEqual({
        icon: 'mdi:smoke-detector',
        labelText: 'sensor.smoke.off',
        cardClass: 'inactive',
        friendlyName: 'smoke',
        state,
        entityId: 'binary_sensor.smoke',
      });
    });
  });

  describe('getDisplayInfo - Climate entities', () => {
    it('should return display info for climate in heating state', () => {
      const state = createMockState('climate.test', 'heat', {
        current_temperature: 20.5,
        temperature: 22.0,
        hvac_action: 'heating',
      });
      const info = service.getDisplayInfo('climate.test', state);

      expect(info).toEqual({
        icon: 'mdi:thermostat',
        labelText: '20.5°C → 22°C',
        cardClass: 'active-light',
        friendlyName: 'test',
        state,
        entityId: 'climate.test',
      });
    });

    it('should return display info for climate in idle state', () => {
      const state = createMockState('climate.test', 'heat', {
        current_temperature: 22.0,
        temperature: 22.0,
        hvac_action: 'idle',
      });
      const info = service.getDisplayInfo('climate.test', state);

      expect(info).toEqual({
        icon: 'mdi:thermostat',
        labelText: '22°C → 22°C',
        cardClass: 'inactive',
        friendlyName: 'test',
        state,
        entityId: 'climate.test',
      });
    });

    it('should handle climate without hvac_action', () => {
      const state = createMockState('climate.test', 'heat', {
        current_temperature: 21.0,
        temperature: 22.0,
      });
      const info = service.getDisplayInfo('climate.test', state);

      expect(info.cardClass).toBe('inactive');
    });

    it('should handle climate with only current temperature', () => {
      const state = createMockState('climate.test', 'heat', {
        current_temperature: 21.0,
      });
      const info = service.getDisplayInfo('climate.test', state);
      expect(info.labelText).toBe('21°C');
    });

    it('should handle climate without temperatures', () => {
      const state = createMockState('climate.test', 'heat', {});
      const info = service.getDisplayInfo('climate.test', state);
      expect(info.labelText).toBe('heat');
    });

    it('should use custom icon when provided', () => {
      const state = createMockState('climate.test', 'heat', {
        icon: 'mdi:radiator',
        current_temperature: 20.0,
      });
      const info = service.getDisplayInfo('climate.test', state);
      expect(info.icon).toBe('mdi:radiator');
    });
  });

  describe('getDisplayInfo - Cover entities', () => {
    it('should return display info for cover with position', () => {
      const state = createMockState('cover.test', 'open', {
        current_position: 75,
      });
      const info = service.getDisplayInfo('cover.test', state);

      expect(info).toEqual({
        icon: 'mdi:window-shutter',
        labelText: '75%',
        cardClass: 'active-gradient',
        friendlyName: 'test',
        state,
        entityId: 'cover.test',
      });
    });

    it('should return display info for cover open without position', () => {
      const state = createMockState('cover.test', 'open', {});
      const info = service.getDisplayInfo('cover.test', state);

      expect(info).toEqual({
        icon: 'mdi:window-shutter',
        labelText: 'common.status.open',
        cardClass: 'active-gradient',
        friendlyName: 'test',
        state,
        entityId: 'cover.test',
      });
    });

    it('should return display info for cover closed', () => {
      const state = createMockState('cover.test', 'closed', {});
      const info = service.getDisplayInfo('cover.test', state);

      expect(info).toEqual({
        icon: 'mdi:window-shutter',
        labelText: 'common.status.closed',
        cardClass: 'inactive',
        friendlyName: 'test',
        state,
        entityId: 'cover.test',
      });
    });

    it('should handle position of 0', () => {
      const state = createMockState('cover.test', 'closed', {
        current_position: 0,
      });
      const info = service.getDisplayInfo('cover.test', state);
      expect(info.labelText).toBe('0%');
    });

    it('should use custom icon when provided', () => {
      const state = createMockState('cover.test', 'open', {
        icon: 'mdi:blinds',
        current_position: 50,
      });
      const info = service.getDisplayInfo('cover.test', state);
      expect(info.icon).toBe('mdi:blinds');
    });
  });

  describe('getDisplayInfo - Lock entities', () => {
    it('should return display info for locked state', () => {
      const state = createMockState('lock.test', 'locked', {});
      const info = service.getDisplayInfo('lock.test', state);

      expect(info).toEqual({
        icon: 'mdi:lock',
        labelText: 'lock.locked',
        cardClass: 'inactive',
        friendlyName: 'test',
        state,
        entityId: 'lock.test',
      });
    });

    it('should return display info for unlocked state', () => {
      const state = createMockState('lock.test', 'unlocked', {});
      const info = service.getDisplayInfo('lock.test', state);

      expect(info).toEqual({
        icon: 'mdi:lock-open',
        labelText: 'lock.unlocked',
        cardClass: 'active-gradient',
        friendlyName: 'test',
        state,
        entityId: 'lock.test',
      });
    });

    it('should return display info for locking state', () => {
      const state = createMockState('lock.test', 'locking', {});
      const info = service.getDisplayInfo('lock.test', state);

      expect(info).toEqual({
        icon: 'mdi:lock-clock',
        labelText: 'lock.locking',
        cardClass: 'inactive',
        friendlyName: 'test',
        state,
        entityId: 'lock.test',
      });
    });

    it('should return display info for unlocking state', () => {
      const state = createMockState('lock.test', 'unlocking', {});
      const info = service.getDisplayInfo('lock.test', state);

      expect(info).toEqual({
        icon: 'mdi:lock-clock',
        labelText: 'lock.unlocking',
        cardClass: 'inactive',
        friendlyName: 'test',
        state,
        entityId: 'lock.test',
      });
    });

    it('should use custom icon when provided', () => {
      const state = createMockState('lock.test', 'locked', {
        icon: 'mdi:lock-smart',
      });
      const info = service.getDisplayInfo('lock.test', state);
      expect(info.icon).toBe('mdi:lock-smart');
    });
  });

  describe('getDisplayInfo - Sensor entities', () => {
    it('should return display info for temperature sensor', () => {
      const registry = [
        { entity_id: 'sensor.temp', labels: ['temperature_label'] },
      ];
      const labelIds = { temperature: 'temperature_label' };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);

      const state = createMockState('sensor.temp', '21.5', {
        unit_of_measurement: '°C',
        device_class: 'temperature',
      });
      const info = service.getDisplayInfo('sensor.temp', state);

      expect(info).toEqual({
        icon: 'mdi:thermometer',
        labelText: '21.5°C',
        cardClass: 'inactive',
        friendlyName: 'temp',
        state,
        entityId: 'sensor.temp',
      });
    });

    it('should return display info for humidity sensor', () => {
      const registry = [
        { entity_id: 'sensor.humidity', labels: ['humidity_label'] },
      ];
      const labelIds = { humidity: 'humidity_label' };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);

      const state = createMockState('sensor.humidity', '45', {
        unit_of_measurement: '%',
        device_class: 'humidity',
      });
      const info = service.getDisplayInfo('sensor.humidity', state);

      expect(info).toEqual({
        icon: 'mdi:water-percent',
        labelText: '45%',
        cardClass: 'inactive',
        friendlyName: 'humidity',
        state,
        entityId: 'sensor.humidity',
      });
    });

    it('should return display info for generic sensor with device_class', () => {
      const state = createMockState('sensor.power', '150', {
        unit_of_measurement: 'W',
        device_class: 'power',
      });
      const info = service.getDisplayInfo('sensor.power', state);

      expect(info.icon).toBe('mdi:flash');
      expect(info.labelText).toBe('150W');
      expect(info.cardClass).toBe('inactive');
    });

    it('should return display info for sensor without unit', () => {
      const state = createMockState('sensor.test', '42', {});
      const info = service.getDisplayInfo('sensor.test', state);

      expect(info.labelText).toBe('42');
    });

    it('should use custom icon when provided', () => {
      const state = createMockState('sensor.test', '100', {
        icon: 'mdi:custom-icon',
        unit_of_measurement: '%',
      });
      const info = service.getDisplayInfo('sensor.test', state);
      expect(info.icon).toBe('mdi:custom-icon');
    });
  });

  describe('getDisplayInfo - Binary sensor (generic)', () => {
    it('should return display info for binary sensor ON', () => {
      const state = createMockState('binary_sensor.test', 'on', {});
      const info = service.getDisplayInfo('binary_sensor.test', state);

      expect(info).toEqual({
        icon: 'mdi:checkbox-marked-circle',
        labelText: 'common.status.on',
        cardClass: 'active-gradient',
        friendlyName: 'test',
        state,
        entityId: 'binary_sensor.test',
      });
    });

    it('should return display info for binary sensor OFF', () => {
      const state = createMockState('binary_sensor.test', 'off', {});
      const info = service.getDisplayInfo('binary_sensor.test', state);

      expect(info).toEqual({
        icon: 'mdi:checkbox-blank-circle-outline',
        labelText: 'common.status.off',
        cardClass: 'inactive',
        friendlyName: 'test',
        state,
        entityId: 'binary_sensor.test',
      });
    });

    it('should use custom icon when provided', () => {
      const state = createMockState('binary_sensor.test', 'on', {
        icon: 'mdi:custom-binary',
      });
      const info = service.getDisplayInfo('binary_sensor.test', state);
      expect(info.icon).toBe('mdi:custom-binary');
    });
  });

  describe('getDisplayInfo - Edge cases', () => {
    it('should return null for null entityId', () => {
      const state = createMockState('light.test', 'on', {});
      const info = service.getDisplayInfo(null, state);
      expect(info).toBeNull();
    });

    it('should return null for null state', () => {
      const info = service.getDisplayInfo('light.test', null);
      expect(info).toBeNull();
    });

    it('should return null for undefined entityId', () => {
      const state = createMockState('light.test', 'on', {});
      const info = service.getDisplayInfo(undefined, state);
      expect(info).toBeNull();
    });

    it('should return null for undefined state', () => {
      const info = service.getDisplayInfo('light.test', undefined);
      expect(info).toBeNull();
    });

    it('should handle entity with multiple labels (priority order)', () => {
      const registry = [
        { entity_id: 'binary_sensor.multi', labels: ['window_label', 'motion_label'] },
      ];
      const labelIds = {
        motion: 'motion_label',
        window: 'window_label',
      };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);

      const state = createMockState('binary_sensor.multi', 'on', {});
      const info = service.getDisplayInfo('binary_sensor.multi', state);

      // Motion has higher priority than window in the service logic
      expect(info.icon).toBe('mdi:motion-sensor');
      expect(info.labelText).toBe('sensor.motion.detected');
    });

    it('should fallback to entity type when no labels match', () => {
      const registry = [
        { entity_id: 'light.test', labels: ['unknown_label'] },
      ];
      const labelIds = {
        motion: 'motion_label',
      };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);

      const state = createMockState('light.test', 'on', {});
      const info = service.getDisplayInfo('light.test', state);

      expect(info.icon).toBe('mdi:lightbulb');
      expect(info.cardClass).toBe('active-light');
    });

    it('should use default display info for unknown entity type', () => {
      const state = createMockState('unknown.test', 'some_state', {});
      const info = service.getDisplayInfo('unknown.test', state);

      expect(info).toEqual({
        icon: 'mdi:help-circle',
        labelText: 'some_state',
        cardClass: 'inactive',
        friendlyName: 'test',
        state,
        entityId: 'unknown.test',
      });
    });

    it('should preserve friendly_name from state attributes', () => {
      const state = createMockState('light.test', 'on', {
        friendly_name: 'My Custom Light Name',
      });
      const info = service.getDisplayInfo('light.test', state);
      expect(info.friendlyName).toBe('My Custom Light Name');
    });

    it('should handle entity with empty labels array', () => {
      const registry = [
        { entity_id: 'light.test', labels: [] },
      ];
      service.setEntityRegistry(registry);

      const state = createMockState('light.test', 'on', {});
      const info = service.getDisplayInfo('light.test', state);

      // Should fallback to entity type
      expect(info.icon).toBe('mdi:lightbulb');
    });

    it('should handle brightness of 0', () => {
      const state = createMockState('light.test', 'on', { brightness: 0 });
      const info = service.getDisplayInfo('light.test', state);
      expect(info.labelText).toBe('common.status.on (0%)');
    });

    it('should handle brightness of 1 (minimum)', () => {
      const state = createMockState('light.test', 'on', { brightness: 1 });
      const info = service.getDisplayInfo('light.test', state);
      expect(info.labelText).toBe('common.status.on (0%)');
    });
  });

  describe('Icon selection tests', () => {
    it('should select correct icon for light entities', () => {
      const state = createMockState('light.test', 'on', {});
      const info = service.getDisplayInfo('light.test', state);
      expect(info.icon).toBe('mdi:lightbulb');
    });

    it('should select correct icons for motion sensors', () => {
      const registry = [
        { entity_id: 'binary_sensor.motion', labels: ['motion_label'] },
      ];
      const labelIds = { motion: 'motion_label' };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);

      const stateOn = createMockState('binary_sensor.motion', 'on', {});
      const infoOn = service.getDisplayInfo('binary_sensor.motion', stateOn);
      expect(infoOn.icon).toBe('mdi:motion-sensor');

      const stateOff = createMockState('binary_sensor.motion', 'off', {});
      const infoOff = service.getDisplayInfo('binary_sensor.motion', stateOff);
      expect(infoOff.icon).toBe('mdi:motion-sensor-off');
    });

    it('should select correct icons for window sensors', () => {
      const registry = [
        { entity_id: 'binary_sensor.window', labels: ['window_label'] },
      ];
      const labelIds = { window: 'window_label' };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);

      const stateOn = createMockState('binary_sensor.window', 'on', {});
      const infoOn = service.getDisplayInfo('binary_sensor.window', stateOn);
      expect(infoOn.icon).toBe('mdi:window-open');

      const stateOff = createMockState('binary_sensor.window', 'off', {});
      const infoOff = service.getDisplayInfo('binary_sensor.window', stateOff);
      expect(infoOff.icon).toBe('mdi:window-closed');
    });

    it('should select correct icons for climate entities', () => {
      const state = createMockState('climate.test', 'heat', {});
      const info = service.getDisplayInfo('climate.test', state);
      expect(info.icon).toBe('mdi:thermostat');
    });

    it('should select correct icon for cover entities', () => {
      const state = createMockState('cover.test', 'open', {});
      const info = service.getDisplayInfo('cover.test', state);
      expect(info.icon).toBe('mdi:window-shutter');
    });

    it('should select correct icons for lock entities by state', () => {
      let state = createMockState('lock.test', 'locked', {});
      let info = service.getDisplayInfo('lock.test', state);
      expect(info.icon).toBe('mdi:lock');

      state = createMockState('lock.test', 'unlocked', {});
      info = service.getDisplayInfo('lock.test', state);
      expect(info.icon).toBe('mdi:lock-open');

      state = createMockState('lock.test', 'locking', {});
      info = service.getDisplayInfo('lock.test', state);
      expect(info.icon).toBe('mdi:lock-clock');

      state = createMockState('lock.test', 'unlocking', {});
      info = service.getDisplayInfo('lock.test', state);
      expect(info.icon).toBe('mdi:lock-clock');
    });

    it('should select correct icon for temperature sensors', () => {
      const registry = [
        { entity_id: 'sensor.temp', labels: ['temperature_label'] },
      ];
      const labelIds = { temperature: 'temperature_label' };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);

      const state = createMockState('sensor.temp', '21', {
        unit_of_measurement: '°C',
        device_class: 'temperature',
      });
      const info = service.getDisplayInfo('sensor.temp', state);
      expect(info.icon).toBe('mdi:thermometer');
    });

    it('should select correct icon for humidity sensors', () => {
      const registry = [
        { entity_id: 'sensor.humidity', labels: ['humidity_label'] },
      ];
      const labelIds = { humidity: 'humidity_label' };
      service.setEntityRegistry(registry);
      service.setLabelIds(labelIds);

      const state = createMockState('sensor.humidity', '45', {
        unit_of_measurement: '%',
        device_class: 'humidity',
      });
      const info = service.getDisplayInfo('sensor.humidity', state);
      expect(info.icon).toBe('mdi:water-percent');
    });
  });
});
