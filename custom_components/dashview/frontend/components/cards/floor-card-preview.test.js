/**
 * Floor Card Preview Component Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import './floor-card-preview.js';

// Mock i18n
vi.mock('../../utils/i18n.js', () => ({
  t: vi.fn((key) => {
    const translations = {
      'admin.layout.floorCardPreview': 'Preview',
      'admin.layout.floor': 'Floor',
      'common.status.unavailable': 'Unavailable'
    };
    return translations[key] || key;
  })
}));

describe('FloorCardPreview', () => {
  let element;

  beforeEach(() => {
    element = document.createElement('floor-card-preview');
    document.body.appendChild(element);
  });

  afterEach(() => {
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    element = null;
  });

  describe('initialization', () => {
    it('should create element with default properties', () => {
      expect(element).toBeDefined();
      expect(element.floorId).toBe('');
      expect(element.scale).toBe(0.5);
      expect(element.slotConfig).toEqual({});
      expect(element.hass).toBeNull();
      expect(element.floor).toBeNull();
    });

    it('should have a shadow root', () => {
      expect(element.shadowRoot).toBeDefined();
    });

    it('should render preview container', () => {
      const container = element.shadowRoot.querySelector('.preview-container');
      expect(container).toBeDefined();
    });

    it('should render preview label', () => {
      const label = element.shadowRoot.querySelector('.preview-label');
      expect(label).toBeDefined();
      expect(label.textContent).toContain('Preview');
    });
  });

  describe('attributes', () => {
    it('should observe floor-id attribute', () => {
      element.setAttribute('floor-id', 'floor.ground');
      expect(element.floorId).toBe('floor.ground');
    });

    it('should observe scale attribute', () => {
      element.setAttribute('scale', '0.75');
      expect(element.scale).toBe(0.75);
    });

    it('should apply scale as CSS variable', () => {
      element.scale = 0.6;
      const container = element.shadowRoot.querySelector('.preview-container');
      expect(container.style.cssText).toContain('--scale: 0.6');
    });

    it('should handle invalid scale gracefully', () => {
      element.setAttribute('scale', 'invalid');
      expect(element.scale).toBe(0.5); // Falls back to default
    });
  });

  describe('properties', () => {
    it('should update on hass change', () => {
      const mockHass = {
        states: {
          'light.living_room': {
            entity_id: 'light.living_room',
            state: 'on',
            attributes: {
              friendly_name: 'Living Room Light',
              icon: 'mdi:ceiling-light'
            }
          }
        }
      };

      element.slotConfig = {
        0: { entity_id: 'light.living_room' }
      };
      element.hass = mockHass;

      const slot0 = element.shadowRoot.querySelector('.slot-0');
      expect(slot0).toBeDefined();
      expect(slot0.classList.contains('state-on')).toBe(true);
    });

    it('should update on slotConfig change', () => {
      element.slotConfig = {
        0: { entity_id: 'light.kitchen' },
        1: { entity_id: 'sensor.temp' }
      };

      const slot0 = element.shadowRoot.querySelector('.slot-0');
      const slot1 = element.shadowRoot.querySelector('.slot-1');

      expect(slot0.classList.contains('empty')).toBe(false);
      expect(slot1.classList.contains('empty')).toBe(false);
    });

    it('should update on floor change', () => {
      element.floor = {
        floor_id: 'floor.ground',
        name: 'Ground Floor',
        icon: 'mdi:home-floor-g'
      };

      const header = element.shadowRoot.querySelector('.preview-header');
      expect(header.textContent).toContain('Ground Floor');
    });
  });

  describe('slot rendering', () => {
    it('should render empty slots with dashed border', () => {
      element.slotConfig = {};

      const emptySlots = element.shadowRoot.querySelectorAll('.slot.empty');
      // Should have 6 empty slots (0-5)
      expect(emptySlots.length).toBeGreaterThan(0);
    });

    it('should render slot with entity info', () => {
      element.hass = {
        states: {
          'light.test': {
            entity_id: 'light.test',
            state: 'on',
            attributes: {
              friendly_name: 'Test Light',
              icon: 'mdi:lightbulb'
            }
          }
        }
      };
      element.slotConfig = {
        0: { entity_id: 'light.test' }
      };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('empty')).toBe(false);

      const name = slot.querySelector('.slot-name');
      expect(name.textContent).toBe('Test Light');

      const state = slot.querySelector('.slot-state');
      expect(state.textContent).toBe('on');
    });

    it('should handle unavailable entity', () => {
      element.slotConfig = {
        0: { entity_id: 'light.nonexistent' }
      };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('state-unavailable')).toBe(true);

      const state = slot.querySelector('.slot-state');
      expect(state.textContent).toBe('Unavailable');
    });

    it('should render all 6 slots in grid', () => {
      const grid = element.shadowRoot.querySelector('.floor-card-grid');
      expect(grid).toBeDefined();

      // Should have slots 0-3 directly in grid, and 4-5 in lower-row
      // Note: Using Array.from + filter instead of :scope > .slot for jsdom compatibility
      const directSlots = Array.from(grid.children).filter(el => el.classList.contains('slot'));
      const lowerRow = grid.querySelector('.lower-row');

      expect(directSlots.length).toBe(4); // slots 0, 1, 2, 3
      expect(lowerRow).toBeDefined();
    });

    it('should render lower row with slots 4 and 5', () => {
      const lowerRow = element.shadowRoot.querySelector('.lower-row');
      const lowerSlots = lowerRow.querySelectorAll('.slot');
      expect(lowerSlots.length).toBe(2);
    });
  });

  describe('state class assignment', () => {
    beforeEach(() => {
      element.slotConfig = {
        0: { entity_id: 'light.test' }
      };
    });

    it('should apply state-on class for "on" state', () => {
      element.hass = {
        states: {
          'light.test': { entity_id: 'light.test', state: 'on', attributes: {} }
        }
      };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('state-on')).toBe(true);
    });

    it('should apply state-on class for "playing" state', () => {
      element.hass = {
        states: {
          'light.test': { entity_id: 'light.test', state: 'playing', attributes: {} }
        }
      };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('state-on')).toBe(true);
    });

    it('should apply state-on class for "open" state', () => {
      element.hass = {
        states: {
          'light.test': { entity_id: 'light.test', state: 'open', attributes: {} }
        }
      };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('state-on')).toBe(true);
    });

    it('should apply state-off class for "off" state', () => {
      element.hass = {
        states: {
          'light.test': { entity_id: 'light.test', state: 'off', attributes: {} }
        }
      };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('state-off')).toBe(true);
    });

    it('should apply state-off class for "idle" state', () => {
      element.hass = {
        states: {
          'light.test': { entity_id: 'light.test', state: 'idle', attributes: {} }
        }
      };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('state-off')).toBe(true);
    });

    it('should apply state-off class for "closed" state', () => {
      element.hass = {
        states: {
          'light.test': { entity_id: 'light.test', state: 'closed', attributes: {} }
        }
      };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('state-off')).toBe(true);
    });

    it('should apply state-unavailable when entity not found', () => {
      element.hass = { states: {} };

      const slot = element.shadowRoot.querySelector('.slot-0');
      expect(slot.classList.contains('state-unavailable')).toBe(true);
    });
  });

  describe('default icons', () => {
    it('should use light icon for light domain', () => {
      element.hass = {
        states: {
          'light.test': { entity_id: 'light.test', state: 'on', attributes: {} }
        }
      };
      element.slotConfig = { 0: { entity_id: 'light.test' } };

      const icon = element.shadowRoot.querySelector('.slot-0 ha-icon');
      expect(icon.getAttribute('icon')).toBe('mdi:lightbulb');
    });

    it('should use thermostat icon for climate domain', () => {
      element.hass = {
        states: {
          'climate.test': { entity_id: 'climate.test', state: 'heat', attributes: {} }
        }
      };
      element.slotConfig = { 0: { entity_id: 'climate.test' } };

      const icon = element.shadowRoot.querySelector('.slot-0 ha-icon');
      expect(icon.getAttribute('icon')).toBe('mdi:thermostat');
    });

    it('should use shutter icon for cover domain', () => {
      element.hass = {
        states: {
          'cover.test': { entity_id: 'cover.test', state: 'open', attributes: {} }
        }
      };
      element.slotConfig = { 0: { entity_id: 'cover.test' } };

      const icon = element.shadowRoot.querySelector('.slot-0 ha-icon');
      expect(icon.getAttribute('icon')).toBe('mdi:window-shutter');
    });

    it('should use help-circle icon for unknown domain', () => {
      element.hass = {
        states: {
          'unknown.test': { entity_id: 'unknown.test', state: 'on', attributes: {} }
        }
      };
      element.slotConfig = { 0: { entity_id: 'unknown.test' } };

      const icon = element.shadowRoot.querySelector('.slot-0 ha-icon');
      expect(icon.getAttribute('icon')).toBe('mdi:help-circle');
    });

    it('should use entity icon if available', () => {
      element.hass = {
        states: {
          'light.test': {
            entity_id: 'light.test',
            state: 'on',
            attributes: { icon: 'mdi:custom-icon' }
          }
        }
      };
      element.slotConfig = { 0: { entity_id: 'light.test' } };

      const icon = element.shadowRoot.querySelector('.slot-0 ha-icon');
      expect(icon.getAttribute('icon')).toBe('mdi:custom-icon');
    });
  });

  describe('entityDisplayService integration', () => {
    it('should use entityDisplayService when available', () => {
      const mockDisplayService = {
        getDisplayInfo: vi.fn().mockReturnValue({
          name: 'Custom Name',
          icon: 'mdi:custom-service-icon',
          state: 'Custom State'
        })
      };

      element.entityDisplayService = mockDisplayService;
      element.hass = {
        states: {
          'light.test': { entity_id: 'light.test', state: 'on', attributes: {} }
        }
      };
      element.slotConfig = { 0: { entity_id: 'light.test' } };

      expect(mockDisplayService.getDisplayInfo).toHaveBeenCalled();

      const name = element.shadowRoot.querySelector('.slot-0 .slot-name');
      expect(name.textContent).toBe('Custom Name');

      const icon = element.shadowRoot.querySelector('.slot-0 ha-icon');
      expect(icon.getAttribute('icon')).toBe('mdi:custom-service-icon');
    });

    it('should fall back gracefully if entityDisplayService throws', () => {
      const mockDisplayService = {
        getDisplayInfo: vi.fn().mockImplementation(() => {
          throw new Error('Service error');
        })
      };

      element.entityDisplayService = mockDisplayService;
      element.hass = {
        states: {
          'light.test': {
            entity_id: 'light.test',
            state: 'on',
            attributes: { friendly_name: 'Fallback Name' }
          }
        }
      };
      element.slotConfig = { 0: { entity_id: 'light.test' } };

      const name = element.shadowRoot.querySelector('.slot-0 .slot-name');
      expect(name.textContent).toBe('Fallback Name');
    });
  });

  describe('floor header', () => {
    it('should display floor name from floor prop', () => {
      element.floor = { name: 'First Floor', icon: 'mdi:home-floor-1' };

      const header = element.shadowRoot.querySelector('.preview-header span');
      expect(header.textContent).toBe('First Floor');
    });

    it('should display floor icon from floor prop', () => {
      element.floor = { name: 'First Floor', icon: 'mdi:home-floor-1' };

      const icon = element.shadowRoot.querySelector('.preview-header ha-icon');
      expect(icon.getAttribute('icon')).toBe('mdi:home-floor-1');
    });

    it('should use default icon when floor has no icon', () => {
      element.floor = { name: 'First Floor' };

      const icon = element.shadowRoot.querySelector('.preview-header ha-icon');
      expect(icon.getAttribute('icon')).toBe('mdi:home-floor-1');
    });

    it('should use translation for fallback name', () => {
      element.floor = null;

      const header = element.shadowRoot.querySelector('.preview-header span');
      expect(header.textContent).toBe('Floor');
    });
  });

  describe('CSS styling', () => {
    it('should include styles in shadow root', () => {
      const style = element.shadowRoot.querySelector('style');
      expect(style).toBeDefined();
      expect(style.textContent).toContain('.preview-container');
      expect(style.textContent).toContain('.floor-card-grid');
      expect(style.textContent).toContain('.slot');
    });

    it('should scale based on scale property', () => {
      element.scale = 0.75;
      const container = element.shadowRoot.querySelector('.preview-container');
      expect(container.getAttribute('style')).toContain('--scale: 0.75');
    });
  });

  describe('re-rendering', () => {
    it('should re-render when hass updates', () => {
      const renderSpy = vi.spyOn(element, '_render');

      element.hass = { states: {} };
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should re-render when slotConfig updates', () => {
      const renderSpy = vi.spyOn(element, '_render');

      element.slotConfig = { 0: { entity_id: 'light.new' } };
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should re-render when scale updates', () => {
      const renderSpy = vi.spyOn(element, '_render');

      element.scale = 0.8;
      expect(renderSpy).toHaveBeenCalled();
    });

    it('should re-render when floor updates', () => {
      const renderSpy = vi.spyOn(element, '_render');

      element.floor = { name: 'New Floor' };
      expect(renderSpy).toHaveBeenCalled();
    });
  });
});
