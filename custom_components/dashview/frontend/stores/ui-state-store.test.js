import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UIStateStore, DEFAULT_UI_STATE, getUIStateStore } from './ui-state-store.js';

describe('UIStateStore', () => {
  let store;

  beforeEach(async () => {
    // Clear sessionStorage to prevent test pollution (dismissed alerts persist)
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.clear();
    }
    // Reset module to clear singleton
    await vi.resetModules();
    const { UIStateStore: FreshUIStateStore } = await import('./ui-state-store.js');
    store = new FreshUIStateStore();
  });

  describe('initialization', () => {
    it('should create store with default UI state', () => {
      expect(store.all).toEqual(DEFAULT_UI_STATE);
    });

    it('should initialize with correct navigation defaults', () => {
      expect(store.get('activeTab')).toBe('home');
      expect(store.get('activeFloorTab')).toBe(null);
      expect(store.get('activeSecurityTab')).toBe('windows');
      expect(store.get('activeMediaTab')).toBe(null);
      expect(store.get('adminSubTab')).toBe('rooms');
    });

    it('should initialize with all popups closed', () => {
      expect(store.get('popupRoom')).toBe(null);
      expect(store.get('weatherPopupOpen')).toBe(false);
      expect(store.get('securityPopupOpen')).toBe(false);
      expect(store.get('batteryPopupOpen')).toBe(false);
      expect(store.get('adminPopupOpen')).toBe(false);
      expect(store.get('mediaPopupOpen')).toBe(false);
    });

    it('should initialize with correct popup section expansion states', () => {
      expect(store.get('popupLightExpanded')).toBe(true);
      expect(store.get('popupCoverExpanded')).toBe(false);
      expect(store.get('popupGarageExpanded')).toBe(false);
      expect(store.get('popupMediaExpanded')).toBe(true);
      expect(store.get('popupThermostatExpanded')).toBe(true);
      expect(store.get('popupRoofWindowExpanded')).toBe(true);
    });

    it('should initialize with empty expansion maps', () => {
      expect(store.get('expandedAreas')).toEqual({});
      expect(store.get('expandedCardSections')).toEqual({});
    });

    it('should initialize with default carousel indices', () => {
      expect(store.get('floorOverviewIndex')).toEqual({});
      expect(store.get('garbageCardIndex')).toBe(0);
      expect(store.get('thermostatSwipeIndex')).toEqual({});
      expect(store.get('selectedForecastTab')).toBe(0);
    });

    it('should initialize with empty search states', () => {
      expect(store.get('garbageSearchQuery')).toBe('');
      expect(store.get('garbageSearchFocused')).toBe(false);
      expect(store.get('infoTextSearchQuery')).toEqual({});
      expect(store.get('infoTextSearchFocused')).toEqual({});
      expect(store.get('sceneButtonSearchQuery')).toBe('');
      expect(store.get('sceneButtonSearchFocused')).toBe(false);
      expect(store.get('iconSearchQuery')).toBe('');
      expect(store.get('iconSearchFocused')).toBe(false);
    });

    it('should initialize with empty editing states', () => {
      expect(store.get('editingSceneButton')).toBe(null);
      expect(store.get('editingRoomSceneButton')).toBe(null);
      expect(store.get('openEntityDropdown')).toBe(null);
    });

    it('should initialize with motion detection defaults', () => {
      expect(store.get('motionDetected')).toBe(false);
      expect(store.get('lastMotionChangeTime')).toBe(null);
      expect(store.get('previousMotionState')).toBe(null);
    });

    it('should initialize with empty listeners set', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      store.set('activeTab', 'floors');
      expect(listener).toHaveBeenCalledWith('activeTab', 'floors', 'home');
      unsubscribe();
    });
  });

  describe('core methods - get()', () => {
    it('should return correct value for existing key', () => {
      expect(store.get('activeTab')).toBe('home');
    });

    it('should return undefined for non-existent key', () => {
      expect(store.get('nonExistentKey')).toBeUndefined();
    });

    it('should return nested object correctly', () => {
      const expandedAreas = store.get('expandedAreas');
      expect(expandedAreas).toBeDefined();
      expect(expandedAreas).toEqual({});
    });

    it('should return object references', () => {
      const areas = store.get('expandedAreas');
      store.setInMap('expandedAreas', 'room1', true);
      // Should be a new reference after modification
      expect(store.get('expandedAreas')).not.toBe(areas);
    });
  });

  describe('core methods - set()', () => {
    it('should update state value', () => {
      store.set('activeTab', 'floors');
      expect(store.get('activeTab')).toBe('floors');
    });

    it('should notify listeners on change', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.set('activeTab', 'floors');
      expect(listener).toHaveBeenCalledWith('activeTab', 'floors', 'home');
    });

    it('should not notify listeners when value is unchanged', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.set('activeTab', 'home'); // Same as default
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle boolean values', () => {
      store.set('weatherPopupOpen', true);
      expect(store.get('weatherPopupOpen')).toBe(true);
    });

    it('should handle null values', () => {
      store.set('popupRoom', 'area1');
      store.set('popupRoom', null);
      expect(store.get('popupRoom')).toBe(null);
    });

    it('should handle number values', () => {
      store.set('garbageCardIndex', 5);
      expect(store.get('garbageCardIndex')).toBe(5);
    });

    it('should handle string values', () => {
      store.set('garbageSearchQuery', 'test query');
      expect(store.get('garbageSearchQuery')).toBe('test query');
    });

    it('should handle object values', () => {
      const newMap = { room1: true, room2: false };
      store.set('expandedAreas', newMap);
      expect(store.get('expandedAreas')).toEqual(newMap);
    });

    it('should provide oldValue in listener callback', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.set('garbageCardIndex', 3);
      expect(listener).toHaveBeenCalledWith('garbageCardIndex', 3, 0);
    });
  });

  describe('core methods - update()', () => {
    it('should update multiple state values at once', () => {
      store.update({
        activeTab: 'security',
        weatherPopupOpen: true,
        garbageCardIndex: 2
      });
      expect(store.get('activeTab')).toBe('security');
      expect(store.get('weatherPopupOpen')).toBe(true);
      expect(store.get('garbageCardIndex')).toBe(2);
    });

    it('should notify listeners for each updated key', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.update({
        activeTab: 'security',
        weatherPopupOpen: true
      });
      expect(listener).toHaveBeenCalledWith('activeTab', 'security', 'home');
      expect(listener).toHaveBeenCalledWith('weatherPopupOpen', true, false);
      expect(listener).toHaveBeenCalledTimes(2);
    });

    it('should only notify for changed values', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.update({
        activeTab: 'home', // Same as default
        weatherPopupOpen: true // Changed
      });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith('weatherPopupOpen', true, false);
    });

    it('should handle empty updates object', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.update({});
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('core methods - toggle()', () => {
    it('should toggle false to true', () => {
      store.toggle('weatherPopupOpen');
      expect(store.get('weatherPopupOpen')).toBe(true);
    });

    it('should toggle true to false', () => {
      store.set('weatherPopupOpen', true);
      store.toggle('weatherPopupOpen');
      expect(store.get('weatherPopupOpen')).toBe(false);
    });

    it('should toggle undefined to true', () => {
      store.toggle('newUndefinedKey');
      expect(store.get('newUndefinedKey')).toBe(true);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.toggle('weatherPopupOpen');
      expect(listener).toHaveBeenCalledWith('weatherPopupOpen', true, false);
    });
  });

  describe('nested maps - setInMap()', () => {
    it('should set value in nested map', () => {
      store.setInMap('expandedAreas', 'room1', true);
      expect(store.get('expandedAreas')['room1']).toBe(true);
    });

    it('should preserve other items in map', () => {
      store.setInMap('expandedAreas', 'room1', true);
      store.setInMap('expandedAreas', 'room2', false);
      const areas = store.get('expandedAreas');
      expect(areas['room1']).toBe(true);
      expect(areas['room2']).toBe(false);
    });

    it('should handle undefined map', () => {
      store.set('expandedAreas', undefined);
      store.setInMap('expandedAreas', 'room1', true);
      expect(store.get('expandedAreas')['room1']).toBe(true);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setInMap('expandedAreas', 'room1', true);
      expect(listener).toHaveBeenCalledWith(
        'expandedAreas',
        expect.objectContaining({ room1: true }),
        undefined
      );
    });

    it('should update existing value in map', () => {
      store.setInMap('expandedAreas', 'room1', true);
      store.setInMap('expandedAreas', 'room1', false);
      expect(store.get('expandedAreas')['room1']).toBe(false);
    });

    it('should handle floorOverviewIndex map', () => {
      store.setInMap('floorOverviewIndex', 'floor1', 2);
      store.setInMap('floorOverviewIndex', 'floor2', 1);
      const indices = store.get('floorOverviewIndex');
      expect(indices['floor1']).toBe(2);
      expect(indices['floor2']).toBe(1);
    });
  });

  describe('nested maps - toggleInMap()', () => {
    it('should toggle false to true in map', () => {
      store.setInMap('expandedAreas', 'room1', false);
      store.toggleInMap('expandedAreas', 'room1');
      expect(store.get('expandedAreas')['room1']).toBe(true);
    });

    it('should toggle true to false in map', () => {
      store.setInMap('expandedAreas', 'room1', true);
      store.toggleInMap('expandedAreas', 'room1');
      expect(store.get('expandedAreas')['room1']).toBe(false);
    });

    it('should toggle undefined to true in map', () => {
      store.toggleInMap('expandedAreas', 'room1');
      expect(store.get('expandedAreas')['room1']).toBe(true);
    });

    it('should preserve other items in map', () => {
      store.setInMap('expandedAreas', 'room1', true);
      store.setInMap('expandedAreas', 'room2', false);
      store.toggleInMap('expandedAreas', 'room1');
      const areas = store.get('expandedAreas');
      expect(areas['room1']).toBe(false);
      expect(areas['room2']).toBe(false);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.toggleInMap('expandedAreas', 'room1');
      expect(listener).toHaveBeenCalledWith(
        'expandedAreas',
        expect.objectContaining({ room1: true }),
        undefined
      );
    });
  });

  describe('navigation helpers - setActiveTab()', () => {
    it('should set active tab', () => {
      store.setActiveTab('floors');
      expect(store.get('activeTab')).toBe('floors');
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setActiveTab('security');
      expect(listener).toHaveBeenCalledWith('activeTab', 'security', 'home');
    });
  });

  describe('navigation helpers - setActiveFloor()', () => {
    it('should set active floor tab', () => {
      store.setActiveFloor('floor1');
      expect(store.get('activeFloorTab')).toBe('floor1');
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setActiveFloor('floor2');
      expect(listener).toHaveBeenCalledWith('activeFloorTab', 'floor2', null);
    });
  });

  describe('navigation helpers - setAdminSubTab()', () => {
    it('should set admin sub-tab', () => {
      store.setAdminSubTab('settings');
      expect(store.get('adminSubTab')).toBe('settings');
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setAdminSubTab('config');
      expect(listener).toHaveBeenCalledWith('adminSubTab', 'config', 'rooms');
    });
  });

  describe('popup helpers - openRoomPopup()', () => {
    it('should open room popup', () => {
      store.openRoomPopup('area1');
      expect(store.get('popupRoom')).toBe('area1');
    });

    it('should replace existing open room popup', () => {
      store.openRoomPopup('area1');
      store.openRoomPopup('area2');
      expect(store.get('popupRoom')).toBe('area2');
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.openRoomPopup('area1');
      expect(listener).toHaveBeenCalledWith('popupRoom', 'area1', null);
    });
  });

  describe('popup helpers - closeRoomPopup()', () => {
    it('should close room popup', () => {
      store.openRoomPopup('area1');
      store.closeRoomPopup();
      expect(store.get('popupRoom')).toBe(null);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.openRoomPopup('area1');
      store.subscribe(listener);
      store.closeRoomPopup();
      expect(listener).toHaveBeenCalledWith('popupRoom', null, 'area1');
    });
  });

  describe('popup helpers - togglePopup()', () => {
    it('should toggle popup from false to true', () => {
      store.togglePopup('weatherPopupOpen');
      expect(store.get('weatherPopupOpen')).toBe(true);
    });

    it('should toggle popup from true to false', () => {
      store.set('weatherPopupOpen', true);
      store.togglePopup('weatherPopupOpen');
      expect(store.get('weatherPopupOpen')).toBe(false);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.togglePopup('securityPopupOpen');
      expect(listener).toHaveBeenCalledWith('securityPopupOpen', true, false);
    });
  });

  describe('popup helpers - openPopup()', () => {
    it('should open specific popup', () => {
      store.openPopup('batteryPopupOpen');
      expect(store.get('batteryPopupOpen')).toBe(true);
    });

    it('should keep popup open if already open', () => {
      store.openPopup('batteryPopupOpen');
      const listener = vi.fn();
      store.subscribe(listener);
      store.openPopup('batteryPopupOpen'); // Already open
      expect(listener).not.toHaveBeenCalled(); // No change
    });
  });

  describe('popup helpers - closePopup()', () => {
    it('should close specific popup', () => {
      store.set('adminPopupOpen', true);
      store.closePopup('adminPopupOpen');
      expect(store.get('adminPopupOpen')).toBe(false);
    });

    it('should keep popup closed if already closed', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.closePopup('adminPopupOpen'); // Already closed
      expect(listener).not.toHaveBeenCalled(); // No change
    });
  });

  describe('popup helpers - closeAllPopups()', () => {
    it('should close all popups', () => {
      store.set('popupRoom', 'area1');
      store.set('weatherPopupOpen', true);
      store.set('securityPopupOpen', true);
      store.set('batteryPopupOpen', true);
      store.set('adminPopupOpen', true);
      store.set('mediaPopupOpen', true);

      store.closeAllPopups();

      expect(store.get('popupRoom')).toBe(null);
      expect(store.get('weatherPopupOpen')).toBe(false);
      expect(store.get('securityPopupOpen')).toBe(false);
      expect(store.get('batteryPopupOpen')).toBe(false);
      expect(store.get('adminPopupOpen')).toBe(false);
      expect(store.get('mediaPopupOpen')).toBe(false);
    });

    it('should notify listeners for each closed popup', () => {
      const listener = vi.fn();
      store.set('weatherPopupOpen', true);
      store.set('securityPopupOpen', true);

      store.subscribe(listener);
      store.closeAllPopups();

      // Should notify for changed values
      expect(listener).toHaveBeenCalledWith('weatherPopupOpen', false, true);
      expect(listener).toHaveBeenCalledWith('securityPopupOpen', false, true);
    });

    it('should not notify for popups already closed', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.closeAllPopups(); // All already closed

      // Should not notify for unchanged values
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('carousel helpers - setFloorOverviewIndex()', () => {
    it('should set floor overview slide index', () => {
      store.setFloorOverviewIndex('floor1', 2);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(2);
    });

    it('should handle multiple floors independently', () => {
      store.setFloorOverviewIndex('floor1', 1);
      store.setFloorOverviewIndex('floor2', 3);
      const indices = store.get('floorOverviewIndex');
      expect(indices['floor1']).toBe(1);
      expect(indices['floor2']).toBe(3);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setFloorOverviewIndex('floor1', 2);
      expect(listener).toHaveBeenCalledWith(
        'floorOverviewIndex',
        expect.objectContaining({ floor1: 2 }),
        undefined
      );
    });
  });

  describe('carousel helpers - nextFloorOverviewSlide()', () => {
    it('should increment slide index', () => {
      store.setFloorOverviewIndex('floor1', 0);
      store.nextFloorOverviewSlide('floor1', 5);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(1);
    });

    it('should wrap from last to first slide', () => {
      store.setFloorOverviewIndex('floor1', 4);
      store.nextFloorOverviewSlide('floor1', 5);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(0);
    });

    it('should handle floor with no current index', () => {
      store.nextFloorOverviewSlide('floor1', 5);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(1);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.setFloorOverviewIndex('floor1', 0);
      store.subscribe(listener);
      store.nextFloorOverviewSlide('floor1', 3);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('carousel helpers - prevFloorOverviewSlide()', () => {
    it('should decrement slide index', () => {
      store.setFloorOverviewIndex('floor1', 2);
      store.prevFloorOverviewSlide('floor1', 5);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(1);
    });

    it('should wrap from first to last slide', () => {
      store.setFloorOverviewIndex('floor1', 0);
      store.prevFloorOverviewSlide('floor1', 5);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(4);
    });

    it('should handle floor with no current index', () => {
      store.prevFloorOverviewSlide('floor1', 5);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(4);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.setFloorOverviewIndex('floor1', 2);
      store.subscribe(listener);
      store.prevFloorOverviewSlide('floor1', 5);
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('carousel helpers - setGarbageCardIndex()', () => {
    it('should set garbage card index', () => {
      store.setGarbageCardIndex(3);
      expect(store.get('garbageCardIndex')).toBe(3);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setGarbageCardIndex(2);
      expect(listener).toHaveBeenCalledWith('garbageCardIndex', 2, 0);
    });
  });

  describe('search helpers - setSearchQuery()', () => {
    it('should set search query', () => {
      store.setSearchQuery('garbageSearchQuery', 'test');
      expect(store.get('garbageSearchQuery')).toBe('test');
    });

    it('should handle empty string', () => {
      store.setSearchQuery('iconSearchQuery', '');
      expect(store.get('iconSearchQuery')).toBe('');
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setSearchQuery('sceneButtonSearchQuery', 'search term');
      expect(listener).toHaveBeenCalledWith('sceneButtonSearchQuery', 'search term', '');
    });
  });

  describe('search helpers - clearSearchQuery()', () => {
    it('should clear search query', () => {
      store.setSearchQuery('garbageSearchQuery', 'test');
      store.clearSearchQuery('garbageSearchQuery');
      expect(store.get('garbageSearchQuery')).toBe('');
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.setSearchQuery('iconSearchQuery', 'test');
      store.subscribe(listener);
      store.clearSearchQuery('iconSearchQuery');
      expect(listener).toHaveBeenCalledWith('iconSearchQuery', '', 'test');
    });
  });

  describe('search helpers - setSearchFocused()', () => {
    it('should set search focused state', () => {
      store.setSearchFocused('garbageSearchFocused', true);
      expect(store.get('garbageSearchFocused')).toBe(true);
    });

    it('should clear search focused state', () => {
      store.setSearchFocused('iconSearchFocused', true);
      store.setSearchFocused('iconSearchFocused', false);
      expect(store.get('iconSearchFocused')).toBe(false);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.setSearchFocused('sceneButtonSearchFocused', true);
      expect(listener).toHaveBeenCalledWith('sceneButtonSearchFocused', true, false);
    });
  });

  describe('expansion helpers - toggleAreaExpanded()', () => {
    it('should toggle area from undefined to true', () => {
      store.toggleAreaExpanded('area1');
      expect(store.get('expandedAreas')['area1']).toBe(true);
    });

    it('should toggle area from true to false', () => {
      store.setInMap('expandedAreas', 'area1', true);
      store.toggleAreaExpanded('area1');
      expect(store.get('expandedAreas')['area1']).toBe(false);
    });

    it('should preserve other areas', () => {
      store.setInMap('expandedAreas', 'area1', true);
      store.toggleAreaExpanded('area2');
      const areas = store.get('expandedAreas');
      expect(areas['area1']).toBe(true);
      expect(areas['area2']).toBe(true);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.toggleAreaExpanded('area1');
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('expansion helpers - toggleCardSectionExpanded()', () => {
    it('should toggle card section from undefined to true', () => {
      store.toggleCardSectionExpanded('section1');
      expect(store.get('expandedCardSections')['section1']).toBe(true);
    });

    it('should toggle card section from true to false', () => {
      store.setInMap('expandedCardSections', 'section1', true);
      store.toggleCardSectionExpanded('section1');
      expect(store.get('expandedCardSections')['section1']).toBe(false);
    });

    it('should preserve other sections', () => {
      store.setInMap('expandedCardSections', 'section1', true);
      store.toggleCardSectionExpanded('section2');
      const sections = store.get('expandedCardSections');
      expect(sections['section1']).toBe(true);
      expect(sections['section2']).toBe(true);
    });

    it('should notify listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.toggleCardSectionExpanded('section1');
      expect(listener).toHaveBeenCalled();
    });
  });

  describe('subscription - subscribe()', () => {
    it('should call listener on changes', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.set('activeTab', 'security');
      expect(listener).toHaveBeenCalledWith('activeTab', 'security', 'home');
    });

    it('should return unsubscribe function', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();
      store.set('activeTab', 'security');
      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      store.subscribe(listener1);
      store.subscribe(listener2);

      store.set('activeTab', 'floors');

      expect(listener1).toHaveBeenCalledWith('activeTab', 'floors', 'home');
      expect(listener2).toHaveBeenCalledWith('activeTab', 'floors', 'home');
    });

    it('should allow selective unsubscribe', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      const unsubscribe1 = store.subscribe(listener1);
      store.subscribe(listener2);

      unsubscribe1();
      store.set('activeTab', 'security');

      expect(listener1).not.toHaveBeenCalled();
      expect(listener2).toHaveBeenCalledWith('activeTab', 'security', 'home');
    });

    it('should handle listener exceptions gracefully', () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const goodListener = vi.fn();
      const badListener = vi.fn(() => {
        throw new Error('Listener error');
      });

      store.subscribe(badListener);
      store.subscribe(goodListener);

      expect(() => store.set('activeTab', 'floors')).not.toThrow();

      expect(badListener).toHaveBeenCalled();
      expect(goodListener).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Dashview: UI state listener error:',
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });

    it('should provide oldValue in listener callback', () => {
      const listener = vi.fn();
      store.set('garbageCardIndex', 5);
      store.subscribe(listener);
      store.set('garbageCardIndex', 7);
      expect(listener).toHaveBeenCalledWith('garbageCardIndex', 7, 5);
    });
  });

  describe('reset()', () => {
    it('should reset to default UI state', () => {
      store.set('activeTab', 'security');
      store.set('weatherPopupOpen', true);
      store.set('garbageCardIndex', 5);

      store.reset();

      expect(store.get('activeTab')).toBe(DEFAULT_UI_STATE.activeTab);
      expect(store.get('weatherPopupOpen')).toBe(DEFAULT_UI_STATE.weatherPopupOpen);
      expect(store.get('garbageCardIndex')).toBe(DEFAULT_UI_STATE.garbageCardIndex);
    });

    it('should notify listeners with _reset event', () => {
      const listener = vi.fn();
      store.subscribe(listener);
      store.reset();
      expect(listener).toHaveBeenCalledWith('_reset', true, false);
    });

    it('should reset all nested objects', () => {
      store.setInMap('expandedAreas', 'area1', true);
      store.setInMap('floorOverviewIndex', 'floor1', 5);

      store.reset();

      expect(store.get('expandedAreas')).toEqual(DEFAULT_UI_STATE.expandedAreas);
      expect(store.get('floorOverviewIndex')).toEqual(DEFAULT_UI_STATE.floorOverviewIndex);
    });

    it('should reset all popup states', () => {
      store.openRoomPopup('area1');
      store.set('weatherPopupOpen', true);
      store.set('securityPopupOpen', true);

      store.reset();

      expect(store.get('popupRoom')).toBe(null);
      expect(store.get('weatherPopupOpen')).toBe(false);
      expect(store.get('securityPopupOpen')).toBe(false);
    });
  });

  describe('destroy()', () => {
    it('should clear all listeners', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.destroy();
      store.set('activeTab', 'security');

      expect(listener).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      expect(() => {
        store.destroy();
        store.destroy();
      }).not.toThrow();
    });

    it('should not affect state values', () => {
      store.set('activeTab', 'security');
      store.destroy();
      expect(store.get('activeTab')).toBe('security');
    });
  });

  describe('getUIStateStore singleton', () => {
    it('should return the same instance on multiple calls', async () => {
      const { getUIStateStore: getStore } = await import('./ui-state-store.js');
      const instance1 = getStore();
      const instance2 = getStore();
      expect(instance1).toBe(instance2);
    });

    it('should return a UIStateStore instance', async () => {
      const module = await import('./ui-state-store.js');
      const instance = module.getUIStateStore();
      expect(instance).toBeInstanceOf(module.UIStateStore);
    });

    it('should share state across singleton calls', async () => {
      const { getUIStateStore: getStore } = await import('./ui-state-store.js');
      const instance1 = getStore();
      instance1.set('activeTab', 'singleton-test');

      const instance2 = getStore();
      expect(instance2.get('activeTab')).toBe('singleton-test');
    });
  });

  // ==================== Dismissed Alerts (Story 11.4) ====================

  describe('dismissed alerts - dismissedAlerts state', () => {
    it('should initialize with empty dismissedAlerts Map', () => {
      expect(store.get('dismissedAlerts')).toBeInstanceOf(Map);
      expect(store.get('dismissedAlerts').size).toBe(0);
    });
  });

  describe('dismissed alerts - dismissAlert()', () => {
    it('should add alert to dismissedAlerts Map', () => {
      const alertId = 'door:binary_sensor.front_door';
      const lastChanged = '2026-01-22T10:00:00Z';

      store.dismissAlert(alertId, lastChanged);

      const dismissedAlerts = store.get('dismissedAlerts');
      expect(dismissedAlerts.has(alertId)).toBe(true);
    });

    it('should store dismissedAt timestamp and entityLastChanged', () => {
      const alertId = 'window:binary_sensor.kitchen_window';
      const lastChanged = '2026-01-22T11:30:00Z';
      const beforeDismiss = Date.now();

      store.dismissAlert(alertId, lastChanged);

      const dismissedAlerts = store.get('dismissedAlerts');
      const dismissal = dismissedAlerts.get(alertId);

      expect(dismissal.entityLastChanged).toBe(lastChanged);
      expect(dismissal.dismissedAt).toBeGreaterThanOrEqual(beforeDismiss);
      expect(dismissal.dismissedAt).toBeLessThanOrEqual(Date.now());
    });

    it('should notify listeners when alert is dismissed', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.dismissAlert('battery:sensor.motion_battery', '2026-01-22T09:00:00Z');

      expect(listener).toHaveBeenCalledWith(
        'dismissedAlerts',
        expect.any(Map),
        expect.any(Map)
      );
    });

    it('should handle multiple dismissed alerts', () => {
      store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z');
      store.dismissAlert('window:binary_sensor.bedroom_window', '2026-01-22T10:30:00Z');
      store.dismissAlert('battery:sensor.temp_battery', '2026-01-22T11:00:00Z');

      const dismissedAlerts = store.get('dismissedAlerts');
      expect(dismissedAlerts.size).toBe(3);
    });

    it('should update existing dismissal if alert dismissed again', () => {
      const alertId = 'garage:cover.garage_door';
      store.dismissAlert(alertId, '2026-01-22T08:00:00Z');
      const firstDismissal = store.get('dismissedAlerts').get(alertId);

      // Dismiss again with new lastChanged
      store.dismissAlert(alertId, '2026-01-22T12:00:00Z');
      const secondDismissal = store.get('dismissedAlerts').get(alertId);

      expect(secondDismissal.entityLastChanged).toBe('2026-01-22T12:00:00Z');
      expect(secondDismissal.dismissedAt).toBeGreaterThanOrEqual(firstDismissal.dismissedAt);
    });
  });

  describe('dismissed alerts - isAlertDismissed()', () => {
    it('should return false for non-dismissed alert', () => {
      expect(store.isAlertDismissed('door:binary_sensor.front_door', '2026-01-22T10:00:00Z')).toBe(false);
    });

    it('should return true for dismissed alert with same lastChanged', () => {
      const alertId = 'door:binary_sensor.front_door';
      const lastChanged = '2026-01-22T10:00:00Z';

      store.dismissAlert(alertId, lastChanged);

      expect(store.isAlertDismissed(alertId, lastChanged)).toBe(true);
    });

    it('should return false when entity state changed (different lastChanged)', () => {
      const alertId = 'door:binary_sensor.front_door';
      const originalLastChanged = '2026-01-22T10:00:00Z';
      const newLastChanged = '2026-01-22T14:00:00Z';

      store.dismissAlert(alertId, originalLastChanged);

      // Entity state changed - alert should reappear
      expect(store.isAlertDismissed(alertId, newLastChanged)).toBe(false);
    });

    it('should return false when dismissal has expired', () => {
      const alertId = 'window:binary_sensor.kitchen_window';
      const lastChanged = '2026-01-22T10:00:00Z';

      store.dismissAlert(alertId, lastChanged);

      // Mock time to be 2 hours later (past 1 hour expiry)
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 2 * 60 * 60 * 1000);

      expect(store.isAlertDismissed(alertId, lastChanged)).toBe(false);

      Date.now = originalDateNow;
    });

    it('should return true when dismissal has not expired', () => {
      const alertId = 'battery:sensor.motion_battery';
      const lastChanged = '2026-01-22T10:00:00Z';

      store.dismissAlert(alertId, lastChanged);

      // Mock time to be 30 minutes later (within 1 hour expiry)
      const originalDateNow = Date.now;
      const dismissTime = Date.now();
      Date.now = vi.fn(() => dismissTime + 30 * 60 * 1000);

      expect(store.isAlertDismissed(alertId, lastChanged)).toBe(true);

      Date.now = originalDateNow;
    });

    it('should accept custom expiry duration - shorter expiry', () => {
      const alertId = 'door:binary_sensor.front_door';
      const lastChanged = '2026-01-22T10:00:00Z';

      store.dismissAlert(alertId, lastChanged);

      // Mock time to be 45 minutes later
      const originalDateNow = Date.now;
      const dismissTime = Date.now();
      Date.now = vi.fn(() => dismissTime + 45 * 60 * 1000);

      // With 30 minute expiry, should be expired
      expect(store.isAlertDismissed(alertId, lastChanged, 30 * 60 * 1000)).toBe(false);

      Date.now = originalDateNow;
    });

    it('should accept custom expiry duration - longer expiry', () => {
      const alertId = 'door:binary_sensor.back_door';
      const lastChanged = '2026-01-22T10:00:00Z';

      store.dismissAlert(alertId, lastChanged);

      // Mock time to be 45 minutes later
      const originalDateNow = Date.now;
      const dismissTime = Date.now();
      Date.now = vi.fn(() => dismissTime + 45 * 60 * 1000);

      // With 1 hour expiry, should still be valid
      expect(store.isAlertDismissed(alertId, lastChanged, 60 * 60 * 1000)).toBe(true);

      Date.now = originalDateNow;
    });

    it('should auto-remove expired dismissals from Map', () => {
      const alertId = 'garage:cover.garage_door';
      const lastChanged = '2026-01-22T10:00:00Z';

      store.dismissAlert(alertId, lastChanged);
      expect(store.get('dismissedAlerts').has(alertId)).toBe(true);

      // Mock time past expiry
      const originalDateNow = Date.now;
      Date.now = vi.fn(() => originalDateNow() + 2 * 60 * 60 * 1000);

      store.isAlertDismissed(alertId, lastChanged);

      // Alert should be removed from Map
      expect(store.get('dismissedAlerts').has(alertId)).toBe(false);

      Date.now = originalDateNow;
    });

    it('should auto-remove alert when state changed', () => {
      const alertId = 'water:binary_sensor.kitchen_leak';
      const originalLastChanged = '2026-01-22T10:00:00Z';
      const newLastChanged = '2026-01-22T15:00:00Z';

      store.dismissAlert(alertId, originalLastChanged);
      expect(store.get('dismissedAlerts').has(alertId)).toBe(true);

      store.isAlertDismissed(alertId, newLastChanged);

      // Alert should be removed from Map
      expect(store.get('dismissedAlerts').has(alertId)).toBe(false);
    });
  });

  describe('dismissed alerts - clearDismissedAlerts()', () => {
    it('should clear all dismissed alerts', () => {
      store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z');
      store.dismissAlert('window:binary_sensor.bedroom_window', '2026-01-22T10:30:00Z');
      store.dismissAlert('battery:sensor.temp_battery', '2026-01-22T11:00:00Z');

      expect(store.get('dismissedAlerts').size).toBe(3);

      store.clearDismissedAlerts();

      expect(store.get('dismissedAlerts').size).toBe(0);
    });

    it('should notify listeners when alerts are cleared', () => {
      store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z');

      const listener = vi.fn();
      store.subscribe(listener);

      store.clearDismissedAlerts();

      expect(listener).toHaveBeenCalledWith(
        'dismissedAlerts',
        expect.any(Map),
        expect.any(Map)
      );
    });

    it('should be safe to call when no alerts are dismissed', () => {
      expect(() => store.clearDismissedAlerts()).not.toThrow();
      expect(store.get('dismissedAlerts').size).toBe(0);
    });
  });

  describe('dismissed alerts - sessionStorage persistence', () => {
    beforeEach(() => {
      // Mock sessionStorage
      const storage = {};
      vi.stubGlobal('sessionStorage', {
        getItem: vi.fn((key) => storage[key] || null),
        setItem: vi.fn((key, value) => { storage[key] = value; }),
        removeItem: vi.fn((key) => { delete storage[key]; }),
        clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]); }),
      });
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it('should sync dismissed alerts to sessionStorage on dismiss', () => {
      store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z');

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'dashview_dismissed_alerts',
        expect.any(String)
      );
    });

    it('should sync to sessionStorage on clear', () => {
      store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z');
      vi.mocked(sessionStorage.setItem).mockClear();

      store.clearDismissedAlerts();

      expect(sessionStorage.setItem).toHaveBeenCalledWith(
        'dashview_dismissed_alerts',
        expect.any(String)
      );
    });

    it('should serialize Map to JSON array format', () => {
      store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z');

      const setItemCall = vi.mocked(sessionStorage.setItem).mock.calls[0];
      const serialized = JSON.parse(setItemCall[1]);

      expect(Array.isArray(serialized)).toBe(true);
      expect(serialized[0][0]).toBe('door:binary_sensor.front_door');
      expect(serialized[0][1]).toHaveProperty('dismissedAt');
      expect(serialized[0][1]).toHaveProperty('entityLastChanged');
    });

    it('should load dismissed alerts from sessionStorage on initialization', async () => {
      const storedData = JSON.stringify([
        ['door:binary_sensor.front_door', { dismissedAt: Date.now(), entityLastChanged: '2026-01-22T10:00:00Z' }],
        ['window:binary_sensor.bedroom_window', { dismissedAt: Date.now(), entityLastChanged: '2026-01-22T11:00:00Z' }],
      ]);

      vi.mocked(sessionStorage.getItem).mockReturnValue(storedData);

      // Create fresh store that should load from storage
      await vi.resetModules();
      const { UIStateStore: FreshUIStateStore } = await import('./ui-state-store.js');
      const freshStore = new FreshUIStateStore();
      freshStore._loadDismissedFromStorage();

      const dismissedAlerts = freshStore.get('dismissedAlerts');
      expect(dismissedAlerts.has('door:binary_sensor.front_door')).toBe(true);
      expect(dismissedAlerts.has('window:binary_sensor.bedroom_window')).toBe(true);
    });

    it('should handle sessionStorage errors gracefully', () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(sessionStorage.setItem).mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      expect(() => store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z')).not.toThrow();

      // Alert should still be in memory
      expect(store.get('dismissedAlerts').has('door:binary_sensor.front_door')).toBe(true);

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Dashview: Failed to save dismissed alerts',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle corrupted sessionStorage data gracefully', async () => {
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      vi.mocked(sessionStorage.getItem).mockReturnValue('invalid json {{{');

      await vi.resetModules();
      const { UIStateStore: FreshUIStateStore } = await import('./ui-state-store.js');
      const freshStore = new FreshUIStateStore();

      expect(() => freshStore._loadDismissedFromStorage()).not.toThrow();

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Dashview: Failed to load dismissed alerts',
        expect.any(Error)
      );

      consoleWarnSpy.mockRestore();
    });

    it('should handle null sessionStorage data', async () => {
      vi.mocked(sessionStorage.getItem).mockReturnValue(null);

      await vi.resetModules();
      const { UIStateStore: FreshUIStateStore } = await import('./ui-state-store.js');
      const freshStore = new FreshUIStateStore();
      freshStore._loadDismissedFromStorage();

      expect(freshStore.get('dismissedAlerts').size).toBe(0);
    });

    it('should automatically load dismissed alerts on construction (AC4 persistence)', async () => {
      // Pre-populate sessionStorage with dismissed alerts
      const storedAlerts = [
        ['door:binary_sensor.front_door', { dismissedAt: Date.now(), entityLastChanged: '2026-01-22T10:00:00Z' }],
        ['window:binary_sensor.bedroom_window', { dismissedAt: Date.now(), entityLastChanged: '2026-01-22T10:30:00Z' }],
      ];
      vi.mocked(sessionStorage.getItem).mockReturnValue(JSON.stringify(storedAlerts));

      await vi.resetModules();
      const { UIStateStore: FreshUIStateStore } = await import('./ui-state-store.js');

      // Creating new instance should automatically load from sessionStorage
      const freshStore = new FreshUIStateStore();

      // Verify alerts were loaded automatically (no manual _loadDismissedFromStorage call)
      expect(freshStore.get('dismissedAlerts').size).toBe(2);
      expect(freshStore.get('dismissedAlerts').has('door:binary_sensor.front_door')).toBe(true);
      expect(freshStore.get('dismissedAlerts').has('window:binary_sensor.bedroom_window')).toBe(true);
    });
  });

  describe('dismissed alerts - getDismissedCount()', () => {
    it('should return 0 when no alerts dismissed', () => {
      expect(store.getDismissedCount()).toBe(0);
    });

    it('should return count of dismissed alerts', () => {
      store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z');
      store.dismissAlert('window:binary_sensor.bedroom_window', '2026-01-22T10:30:00Z');

      expect(store.getDismissedCount()).toBe(2);
    });
  });

  describe('dismissed alerts - reset integration', () => {
    it('should clear dismissed alerts on reset', () => {
      store.dismissAlert('door:binary_sensor.front_door', '2026-01-22T10:00:00Z');
      store.dismissAlert('window:binary_sensor.bedroom_window', '2026-01-22T10:30:00Z');

      store.reset();

      expect(store.get('dismissedAlerts').size).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle same value set multiple times', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.set('activeTab', 'home');
      store.set('activeTab', 'home');
      store.set('activeTab', 'home');

      // Should not notify since value doesn't change
      expect(listener).not.toHaveBeenCalled();
    });

    it('should handle toggle on undefined key', () => {
      store.toggle('newUndefinedBoolean');
      expect(store.get('newUndefinedBoolean')).toBe(true);
    });

    it('should handle carousel wrap-around at maximum', () => {
      store.setFloorOverviewIndex('floor1', 9);
      store.nextFloorOverviewSlide('floor1', 10);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(0);
    });

    it('should handle carousel wrap-around at minimum', () => {
      store.setFloorOverviewIndex('floor1', 0);
      store.prevFloorOverviewSlide('floor1', 10);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(9);
    });

    it('should handle rapid successive calls', () => {
      for (let i = 0; i < 100; i++) {
        store.set('garbageCardIndex', i);
      }
      expect(store.get('garbageCardIndex')).toBe(99);
    });

    it('should handle empty string search queries', () => {
      store.setSearchQuery('garbageSearchQuery', 'test');
      store.setSearchQuery('garbageSearchQuery', '');
      expect(store.get('garbageSearchQuery')).toBe('');
    });

    it('should handle null values in popups', () => {
      store.openRoomPopup('area1');
      store.openRoomPopup(null);
      expect(store.get('popupRoom')).toBe(null);
    });

    it('should handle special characters in area IDs', () => {
      const specialId = 'area-test_123.äöü';
      store.toggleAreaExpanded(specialId);
      expect(store.get('expandedAreas')[specialId]).toBe(true);
    });

    it('should handle unsubscribe of non-existent listener', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);
      unsubscribe();

      // Calling again should be safe
      expect(() => unsubscribe()).not.toThrow();
    });

    it('should handle multiple popups open simultaneously', () => {
      store.openRoomPopup('area1');
      store.openPopup('weatherPopupOpen');
      store.openPopup('securityPopupOpen');
      store.openPopup('batteryPopupOpen');

      expect(store.get('popupRoom')).toBe('area1');
      expect(store.get('weatherPopupOpen')).toBe(true);
      expect(store.get('securityPopupOpen')).toBe(true);
      expect(store.get('batteryPopupOpen')).toBe(true);
    });

    it('should handle deep object values', () => {
      const deepObject = {
        level1: {
          level2: {
            level3: 'value'
          }
        }
      };
      store.set('customDeepState', deepObject);
      expect(store.get('customDeepState')).toEqual(deepObject);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical navigation flow', () => {
      const listener = vi.fn();
      store.subscribe(listener);

      store.setActiveTab('floors');
      store.setActiveFloor('floor1');
      store.openRoomPopup('bedroom');

      expect(store.get('activeTab')).toBe('floors');
      expect(store.get('activeFloorTab')).toBe('floor1');
      expect(store.get('popupRoom')).toBe('bedroom');
      expect(listener).toHaveBeenCalledTimes(3);
    });

    it('should handle floor carousel navigation', () => {
      store.setFloorOverviewIndex('floor1', 0);
      store.nextFloorOverviewSlide('floor1', 5);
      store.nextFloorOverviewSlide('floor1', 5);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(2);

      store.prevFloorOverviewSlide('floor1', 5);
      expect(store.get('floorOverviewIndex')['floor1']).toBe(1);
    });

    it('should handle search workflow', () => {
      store.setSearchQuery('garbageSearchQuery', 'paper');
      store.setSearchFocused('garbageSearchFocused', true);

      expect(store.get('garbageSearchQuery')).toBe('paper');
      expect(store.get('garbageSearchFocused')).toBe(true);

      store.clearSearchQuery('garbageSearchQuery');
      store.setSearchFocused('garbageSearchFocused', false);

      expect(store.get('garbageSearchQuery')).toBe('');
      expect(store.get('garbageSearchFocused')).toBe(false);
    });

    it('should handle popup management workflow', () => {
      store.openRoomPopup('living_room');
      store.openPopup('weatherPopupOpen');
      store.openPopup('securityPopupOpen');

      expect(store.get('popupRoom')).toBe('living_room');
      expect(store.get('weatherPopupOpen')).toBe(true);
      expect(store.get('securityPopupOpen')).toBe(true);

      store.closeAllPopups();

      expect(store.get('popupRoom')).toBe(null);
      expect(store.get('weatherPopupOpen')).toBe(false);
      expect(store.get('securityPopupOpen')).toBe(false);
    });

    it('should handle expansion states workflow', () => {
      store.toggleAreaExpanded('area1');
      store.toggleAreaExpanded('area2');
      store.toggleCardSectionExpanded('section1');

      expect(store.get('expandedAreas')['area1']).toBe(true);
      expect(store.get('expandedAreas')['area2']).toBe(true);
      expect(store.get('expandedCardSections')['section1']).toBe(true);

      store.toggleAreaExpanded('area1');

      expect(store.get('expandedAreas')['area1']).toBe(false);
      expect(store.get('expandedAreas')['area2']).toBe(true);
    });

    it('should handle component unmount scenario', () => {
      const listener = vi.fn();
      const unsubscribe = store.subscribe(listener);

      store.set('activeTab', 'security');

      // Component unmounts
      unsubscribe();
      store.destroy();

      // Should not error on further changes
      expect(() => {
        store.set('activeTab', 'home');
      }).not.toThrow();

      // Listener should not be called after unmount
      expect(listener).toHaveBeenCalledTimes(1); // Only the first call
    });

    it('should handle admin panel workflow', () => {
      store.setActiveTab('admin');
      store.setAdminSubTab('settings');
      store.openPopup('adminPopupOpen');

      expect(store.get('activeTab')).toBe('admin');
      expect(store.get('adminSubTab')).toBe('settings');
      expect(store.get('adminPopupOpen')).toBe(true);

      store.setAdminSubTab('rooms');
      store.closePopup('adminPopupOpen');

      expect(store.get('adminSubTab')).toBe('rooms');
      expect(store.get('adminPopupOpen')).toBe(false);
    });

    it('should handle multiple floor carousels independently', () => {
      store.setFloorOverviewIndex('floor1', 0);
      store.setFloorOverviewIndex('floor2', 2);
      store.setFloorOverviewIndex('floor3', 1);

      store.nextFloorOverviewSlide('floor1', 5);
      store.prevFloorOverviewSlide('floor2', 5);

      expect(store.get('floorOverviewIndex')['floor1']).toBe(1);
      expect(store.get('floorOverviewIndex')['floor2']).toBe(1);
      expect(store.get('floorOverviewIndex')['floor3']).toBe(1);
    });
  });
});
