/**
 * Room Popup Tests
 * Tests for loading states and skeleton loaders (Story 7.14)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the imports
vi.mock('../../components/layout/index.js', () => ({
  renderPopupHeader: vi.fn(() => '')
}));

vi.mock('../../components/charts/index.js', () => ({
  renderTemperatureChart: vi.fn(() => '')
}));

vi.mock('../../utils/helpers.js', () => ({
  openMoreInfo: vi.fn()
}));

vi.mock('../../utils/i18n.js', () => ({
  t: vi.fn((key) => key)
}));

// Import the module after mocking
import { renderRoomPopup } from './room-popup.js';

describe('room-popup', () => {
  // Create a mock html template function
  const html = (strings, ...values) => {
    let result = '';
    strings.forEach((str, i) => {
      result += str;
      if (i < values.length) {
        const value = values[i];
        if (typeof value === 'function') {
          result += '[function]';
        } else if (value === '') {
          result += '';
        } else {
          result += String(value);
        }
      }
    });
    return result;
  };

  describe('Loading States (Story 7.14)', () => {
    it('returns empty string when no popup room (AC5 - graceful handling)', () => {
      const component = {
        _popupRoom: null,
        hass: { states: {} }
      };

      const result = renderRoomPopup(component, html);
      expect(result).toBe('');
    });

    it('shows skeleton when hass is not available (AC1)', () => {
      const component = {
        _popupRoom: { area_id: 'test_area', name: 'Test Room' },
        hass: null,
        _getAreaIcon: vi.fn(() => 'mdi:home'),
        _handlePopupOverlayClick: vi.fn(),
        _closeRoomPopup: vi.fn()
      };

      const result = renderRoomPopup(component, html);
      expect(result).toContain('popup-skeleton');
      expect(result).toContain('shimmer');
    });

    it('shows skeleton when hass.states is empty (AC1)', () => {
      const component = {
        _popupRoom: { area_id: 'test_area', name: 'Test Room' },
        hass: { states: {} },
        _getAreaIcon: vi.fn(() => 'mdi:home'),
        _handlePopupOverlayClick: vi.fn(),
        _closeRoomPopup: vi.fn()
      };

      const result = renderRoomPopup(component, html);
      expect(result).toContain('popup-skeleton');
    });

    it('shows skeleton when _roomDataService.isReady returns false (AC1)', () => {
      const component = {
        _popupRoom: { area_id: 'test_area', name: 'Test Room' },
        hass: { states: { 'light.test': { state: 'on' } } },
        _roomDataService: {
          isReady: vi.fn(() => false)
        },
        _getAreaIcon: vi.fn(() => 'mdi:home'),
        _handlePopupOverlayClick: vi.fn(),
        _closeRoomPopup: vi.fn()
      };

      const result = renderRoomPopup(component, html);
      expect(result).toContain('popup-skeleton');
      expect(component._roomDataService.isReady).toHaveBeenCalledWith('test_area');
    });

    it('shows content when data is ready (AC5 - loading clears)', () => {
      const component = {
        _popupRoom: { area_id: 'test_area', name: 'Test Room' },
        hass: { states: { 'light.test': { state: 'on' } } },
        _getAreaIcon: vi.fn(() => 'mdi:home'),
        _handlePopupOverlayClick: vi.fn(),
        _closeRoomPopup: vi.fn(),
        _getRoomPopupChips: vi.fn(() => []),
        _getEnabledLightsForRoom: vi.fn(() => []),
        _getEnabledCoversForRoom: vi.fn(() => []),
        _getEnabledRoofWindowsForRoom: vi.fn(() => []),
        _sceneButtons: [],
        _getEnabledClimatesForRoom: vi.fn(() => []),
        _getEnabledTemperatureSensorsForRoom: vi.fn(() => []),
        _getEnabledHumiditySensorsForRoom: vi.fn(() => []),
        _getEnabledMediaPlayersForRoom: vi.fn(() => []),
        _getEnabledTVsForRoom: vi.fn(() => []),
        _getEnabledLocksForRoom: vi.fn(() => []),
        _getEnabledGaragesForRoom: vi.fn(() => []),
        _getEnabledAppliancesForArea: vi.fn(() => []),
        _getRoomClimateNotification: vi.fn(() => null),
        _popupLightExpanded: false,
        _popupCoverExpanded: false,
        _popupRoofWindowExpanded: false,
        _popupMediaExpanded: false,
        _popupTVExpanded: false,
        _popupGarageExpanded: false,
        _popupDevicesExpanded: false
      };

      const result = renderRoomPopup(component, html);
      // Should not contain skeleton when data is ready
      expect(result).not.toContain('popup-skeleton');
    });

    it('shows content when _roomDataService.isReady returns true (AC5)', () => {
      const component = {
        _popupRoom: { area_id: 'test_area', name: 'Test Room' },
        hass: { states: { 'light.test': { state: 'on' } } },
        _roomDataService: {
          isReady: vi.fn(() => true)
        },
        _getAreaIcon: vi.fn(() => 'mdi:home'),
        _handlePopupOverlayClick: vi.fn(),
        _closeRoomPopup: vi.fn(),
        _getRoomPopupChips: vi.fn(() => []),
        _getEnabledLightsForRoom: vi.fn(() => []),
        _getEnabledCoversForRoom: vi.fn(() => []),
        _getEnabledRoofWindowsForRoom: vi.fn(() => []),
        _sceneButtons: [],
        _getEnabledClimatesForRoom: vi.fn(() => []),
        _getEnabledTemperatureSensorsForRoom: vi.fn(() => []),
        _getEnabledHumiditySensorsForRoom: vi.fn(() => []),
        _getEnabledMediaPlayersForRoom: vi.fn(() => []),
        _getEnabledTVsForRoom: vi.fn(() => []),
        _getEnabledLocksForRoom: vi.fn(() => []),
        _getEnabledGaragesForRoom: vi.fn(() => []),
        _getEnabledAppliancesForArea: vi.fn(() => []),
        _getRoomClimateNotification: vi.fn(() => null),
        _popupLightExpanded: false,
        _popupCoverExpanded: false,
        _popupRoofWindowExpanded: false,
        _popupMediaExpanded: false,
        _popupTVExpanded: false,
        _popupGarageExpanded: false,
        _popupDevicesExpanded: false
      };

      const result = renderRoomPopup(component, html);
      expect(result).not.toContain('popup-skeleton');
    });

    it('skeleton contains shimmer class for CSS animation (AC4)', () => {
      const component = {
        _popupRoom: { area_id: 'test_area', name: 'Test Room' },
        hass: null,
        _getAreaIcon: vi.fn(() => 'mdi:home'),
        _handlePopupOverlayClick: vi.fn(),
        _closeRoomPopup: vi.fn()
      };

      const result = renderRoomPopup(component, html);
      // Verify shimmer class is present for CSS-only animation
      expect(result).toContain('shimmer');
    });

    it('skeleton has correct structure (AC2, AC3)', () => {
      const component = {
        _popupRoom: { area_id: 'test_area', name: 'Test Room' },
        hass: null,
        _getAreaIcon: vi.fn(() => 'mdi:home'),
        _handlePopupOverlayClick: vi.fn(),
        _closeRoomPopup: vi.fn()
      };

      const result = renderRoomPopup(component, html);

      // Verify skeleton structure matches actual popup structure
      expect(result).toContain('popup-skeleton-chips');
      expect(result).toContain('popup-skeleton-chip');
      expect(result).toContain('popup-skeleton-actions');
      expect(result).toContain('popup-skeleton-action');
      expect(result).toContain('popup-skeleton-section');
      expect(result).toContain('popup-skeleton-section-header');
      expect(result).toContain('popup-skeleton-icon');
      expect(result).toContain('popup-skeleton-title');
      expect(result).toContain('popup-skeleton-count');
      expect(result).toContain('popup-skeleton-items');
      expect(result).toContain('popup-skeleton-item');
    });
  });
});
