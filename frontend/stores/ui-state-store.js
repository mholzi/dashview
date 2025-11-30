/**
 * UI State Store
 * Manages transient UI state that doesn't need to persist
 *
 * This store handles all temporary state like:
 * - Active tabs and navigation
 * - Open popups and modals
 * - Expanded/collapsed sections
 * - Search queries and focus states
 * - Current slide indices
 */

/**
 * Default UI state values
 */
export const DEFAULT_UI_STATE = {
  // Navigation
  activeTab: 'home',
  activeFloorTab: null,
  activeSecurityTab: 'windows',
  activeMediaTab: null,
  adminSubTab: 'rooms',

  // Popups and modals
  popupRoom: null,  // Currently open room popup (area_id)
  weatherPopupOpen: false,
  securityPopupOpen: false,
  batteryPopupOpen: false,
  adminPopupOpen: false,
  mediaPopupOpen: false,

  // Popup section expansion states
  popupLightExpanded: true,
  popupCoverExpanded: false,
  popupGarageExpanded: false,
  popupMediaExpanded: true,
  popupThermostatExpanded: true,
  popupRoofWindowExpanded: true,

  // Area/section expansion states
  expandedAreas: {},
  expandedCardSections: {},

  // Carousel/swipe indices
  floorOverviewIndex: {},  // { floorId: index }
  garbageCardIndex: 0,
  thermostatSwipeIndex: {},  // { roomId: index }
  selectedForecastTab: 0,

  // Search states
  garbageSearchQuery: '',
  garbageSearchFocused: false,
  infoTextSearchQuery: {},
  infoTextSearchFocused: {},
  sceneButtonSearchQuery: '',
  sceneButtonSearchFocused: false,
  iconSearchQuery: '',
  iconSearchFocused: false,
  roomSceneIconSearchQuery: '',
  roomSceneIconSearchFocused: false,
  roomSceneEntitySearchQuery: '',
  roomSceneEntitySearchFocused: false,

  // Editing states
  editingSceneButton: null,
  editingRoomSceneButton: null,
  openEntityDropdown: null,

  // Motion detection state
  motionDetected: false,
  lastMotionChangeTime: null,
  previousMotionState: null,

  // Time display
  currentTime: '',
};

/**
 * UI State Store class
 * Manages transient UI state with reactive updates
 */
export class UIStateStore {
  constructor() {
    this._state = { ...DEFAULT_UI_STATE };
    this._listeners = new Set();
  }

  /**
   * Get all UI state
   * @returns {Object}
   */
  get all() {
    return this._state;
  }

  /**
   * Get a specific state value
   * @param {string} key - State key
   * @returns {*} State value
   */
  get(key) {
    return this._state[key];
  }

  /**
   * Set a specific state value
   * @param {string} key - State key
   * @param {*} value - State value
   */
  set(key, value) {
    const oldValue = this._state[key];
    if (oldValue !== value) {
      this._state[key] = value;
      this._notifyListeners(key, value, oldValue);
    }
  }

  /**
   * Update multiple state values at once
   * @param {Object} updates - Object with key-value pairs to update
   */
  update(updates) {
    const changes = [];
    Object.entries(updates).forEach(([key, value]) => {
      const oldValue = this._state[key];
      if (oldValue !== value) {
        this._state[key] = value;
        changes.push({ key, value, oldValue });
      }
    });
    // Notify for all changes
    changes.forEach(({ key, value, oldValue }) => {
      this._notifyListeners(key, value, oldValue);
    });
  }

  /**
   * Toggle a boolean state value
   * @param {string} key - State key
   */
  toggle(key) {
    this.set(key, !this._state[key]);
  }

  /**
   * Set a value in a nested object state
   * @param {string} mapKey - The map state key
   * @param {string} itemKey - The item key within the map
   * @param {*} value - The value to set
   */
  setInMap(mapKey, itemKey, value) {
    const map = this._state[mapKey] || {};
    this._state[mapKey] = {
      ...map,
      [itemKey]: value,
    };
    this._notifyListeners(mapKey, this._state[mapKey]);
  }

  /**
   * Toggle a value in a nested object state
   * @param {string} mapKey - The map state key
   * @param {string} itemKey - The item key within the map
   */
  toggleInMap(mapKey, itemKey) {
    const map = this._state[mapKey] || {};
    this.setInMap(mapKey, itemKey, !map[itemKey]);
  }

  // ==================== Navigation Helpers ====================

  /**
   * Set active tab
   * @param {string} tab - Tab name
   */
  setActiveTab(tab) {
    this.set('activeTab', tab);
  }

  /**
   * Set active floor tab
   * @param {string} floorId - Floor ID
   */
  setActiveFloor(floorId) {
    this.set('activeFloorTab', floorId);
  }

  /**
   * Set admin sub-tab
   * @param {string} subTab - Sub-tab name
   */
  setAdminSubTab(subTab) {
    this.set('adminSubTab', subTab);
  }

  // ==================== Popup Helpers ====================

  /**
   * Open room popup
   * @param {string} areaId - Area ID to open
   */
  openRoomPopup(areaId) {
    this.set('popupRoom', areaId);
  }

  /**
   * Close room popup
   */
  closeRoomPopup() {
    this.set('popupRoom', null);
  }

  /**
   * Toggle a popup
   * @param {string} popupKey - Popup state key (e.g., 'weatherPopupOpen')
   */
  togglePopup(popupKey) {
    this.toggle(popupKey);
  }

  /**
   * Open a specific popup
   * @param {string} popupKey - Popup state key
   */
  openPopup(popupKey) {
    this.set(popupKey, true);
  }

  /**
   * Close a specific popup
   * @param {string} popupKey - Popup state key
   */
  closePopup(popupKey) {
    this.set(popupKey, false);
  }

  /**
   * Close all popups
   */
  closeAllPopups() {
    this.update({
      popupRoom: null,
      weatherPopupOpen: false,
      securityPopupOpen: false,
      batteryPopupOpen: false,
      adminPopupOpen: false,
      mediaPopupOpen: false,
    });
  }

  // ==================== Carousel/Swipe Helpers ====================

  /**
   * Set floor overview slide index
   * @param {string} floorId - Floor ID
   * @param {number} index - Slide index
   */
  setFloorOverviewIndex(floorId, index) {
    this.setInMap('floorOverviewIndex', floorId, index);
  }

  /**
   * Go to next floor overview slide
   * @param {string} floorId - Floor ID
   * @param {number} totalSlides - Total number of slides
   */
  nextFloorOverviewSlide(floorId, totalSlides) {
    const current = this._state.floorOverviewIndex[floorId] || 0;
    const next = (current + 1) % totalSlides;
    this.setFloorOverviewIndex(floorId, next);
  }

  /**
   * Go to previous floor overview slide
   * @param {string} floorId - Floor ID
   * @param {number} totalSlides - Total number of slides
   */
  prevFloorOverviewSlide(floorId, totalSlides) {
    const current = this._state.floorOverviewIndex[floorId] || 0;
    const prev = current === 0 ? totalSlides - 1 : current - 1;
    this.setFloorOverviewIndex(floorId, prev);
  }

  /**
   * Set garbage card index
   * @param {number} index - Slide index
   */
  setGarbageCardIndex(index) {
    this.set('garbageCardIndex', index);
  }

  // ==================== Search Helpers ====================

  /**
   * Set search query
   * @param {string} key - Search query state key
   * @param {string} query - Search query value
   */
  setSearchQuery(key, query) {
    this.set(key, query);
  }

  /**
   * Clear search query
   * @param {string} key - Search query state key
   */
  clearSearchQuery(key) {
    this.set(key, '');
  }

  /**
   * Set search focus state
   * @param {string} key - Search focused state key
   * @param {boolean} focused - Whether focused
   */
  setSearchFocused(key, focused) {
    this.set(key, focused);
  }

  // ==================== Section Expansion Helpers ====================

  /**
   * Toggle area expansion
   * @param {string} areaId - Area ID
   */
  toggleAreaExpanded(areaId) {
    this.toggleInMap('expandedAreas', areaId);
  }

  /**
   * Toggle card section expansion
   * @param {string} sectionId - Section ID
   */
  toggleCardSectionExpanded(sectionId) {
    this.toggleInMap('expandedCardSections', sectionId);
  }

  // ==================== Subscription ====================

  /**
   * Subscribe to state changes
   * @param {Function} listener - Callback function (key, newValue, oldValue) => void
   * @returns {Function} Unsubscribe function
   */
  subscribe(listener) {
    this._listeners.add(listener);
    return () => this._listeners.delete(listener);
  }

  /**
   * Notify all listeners of a change
   * @param {string} key - Changed state key
   * @param {*} newValue - New value
   * @param {*} oldValue - Old value
   */
  _notifyListeners(key, newValue, oldValue) {
    this._listeners.forEach(listener => {
      try {
        listener(key, newValue, oldValue);
      } catch (e) {
        console.error('Dashview: UI state listener error:', e);
      }
    });
  }

  /**
   * Reset UI state to defaults
   */
  reset() {
    this._state = { ...DEFAULT_UI_STATE };
    this._notifyListeners('_reset', true, false);
  }

  /**
   * Cleanup
   */
  destroy() {
    this._listeners.clear();
  }
}

// Singleton instance
let uiStateStoreInstance = null;

/**
 * Get the singleton UI state store instance
 * @returns {UIStateStore}
 */
export function getUIStateStore() {
  if (!uiStateStoreInstance) {
    uiStateStoreInstance = new UIStateStore();
  }
  return uiStateStoreInstance;
}

export default UIStateStore;
