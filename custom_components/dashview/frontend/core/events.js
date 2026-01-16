/**
 * Event Handler Utilities
 * Extracted from dashview-panel.js for modularity
 *
 * @module core/events
 */

/**
 * Get inverted slider position (left=100%, right=0%)
 * @param {Event} e - Mouse/touch event
 * @returns {number} Position percentage (0-100)
 */
export function getInvertedSliderPosition(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  return 100 - Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
}

/**
 * Get normal slider position (left=0%, right=100%)
 * @param {Event} e - Mouse/touch event
 * @returns {number} Position percentage (0-100)
 */
export function getSliderPosition(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  return Math.max(0, Math.min(100, Math.round(((e.clientX - rect.left) / rect.width) * 100)));
}

/**
 * Handle light slider touch start
 * @param {Object} panel - DashviewPanel instance
 * @param {TouchEvent} e - Touch event
 * @param {string} entityId - Entity ID
 */
export function handleLightSliderTouchStart(panel, e, entityId) {
  panel._lightSliderDragging = true;
  panel._lightSliderEntityId = entityId;
  panel._lightSliderStartX = e.touches[0].clientX;

  const item = e.currentTarget.closest('.popup-light-item');
  if (item) {
    item.classList.add('dragging');
    panel._lightSliderItem = item;
  }
}

/**
 * Handle light slider touch move
 * @param {Object} panel - DashviewPanel instance
 * @param {TouchEvent} e - Touch event
 * @param {string} entityId - Entity ID
 */
export function handleLightSliderTouchMove(panel, e, entityId) {
  if (!panel._lightSliderDragging || panel._lightSliderEntityId !== entityId) return;

  const slider = e.currentTarget;
  const rect = slider.getBoundingClientRect();
  const touchX = e.touches[0].clientX - rect.left;
  const percentage = Math.round((touchX / rect.width) * 100);
  const clampedPercentage = Math.max(1, Math.min(100, percentage));

  // Update visual immediately
  const sliderBg = panel._lightSliderItem?.querySelector('.popup-light-slider-bg');
  if (sliderBg) {
    sliderBg.style.width = `${clampedPercentage}%`;
  }

  // Update brightness display
  const brightnessEl = panel._lightSliderItem?.querySelector('.popup-light-brightness');
  if (brightnessEl) {
    brightnessEl.textContent = `${clampedPercentage}%`;
  }

  // Store value for touchend
  panel._lightSliderValue = clampedPercentage;

  // Prevent scrolling while dragging
  e.preventDefault();
}

/**
 * Handle light slider touch end
 * @param {Object} panel - DashviewPanel instance
 * @param {Function} setLightBrightness - Function to set light brightness
 */
export function handleLightSliderTouchEnd(panel, setLightBrightness) {
  if (!panel._lightSliderDragging) return;

  // Apply the final value
  if (panel._lightSliderValue !== undefined && panel._lightSliderEntityId) {
    setLightBrightness(panel._lightSliderEntityId, panel._lightSliderValue);
  }

  // Remove dragging class
  if (panel._lightSliderItem) {
    panel._lightSliderItem.classList.remove('dragging');
  }

  // Reset state
  panel._lightSliderDragging = false;
  panel._lightSliderEntityId = null;
  panel._lightSliderStartX = null;
  panel._lightSliderValue = undefined;
  panel._lightSliderItem = null;
}

/**
 * Handle light slider mouse down (desktop support)
 * SECURITY: Uses AbortController for guaranteed cleanup (Story 7.4, GitHub #1)
 * @param {Object} panel - DashviewPanel instance
 * @param {MouseEvent} e - Mouse event
 * @param {string} entityId - Entity ID
 * @param {Function} setLightBrightness - Function to set light brightness
 */
export function handleLightSliderMouseDown(panel, e, entityId, setLightBrightness) {
  panel._lightSliderDragging = true;
  panel._lightSliderEntityId = entityId;

  const item = e.currentTarget.closest('.popup-light-item');
  if (item) {
    item.classList.add('dragging');
    panel._lightSliderItem = item;
  }

  // SECURITY: Create AbortController for this drag operation
  // This ensures listeners are removed even if panel unmounts during drag
  panel._dragAbortController = new AbortController();
  const { signal } = panel._dragAbortController;

  // Add global mouse event listeners
  const handleMouseMove = (moveEvent) => {
    if (!panel._lightSliderDragging) return;

    const slider = item.querySelector('.popup-light-slider-area');
    if (!slider) return;

    const rect = slider.getBoundingClientRect();
    const mouseX = moveEvent.clientX - rect.left;
    const percentage = Math.round((mouseX / rect.width) * 100);
    const clampedPercentage = Math.max(1, Math.min(100, percentage));

    // Update visual immediately
    const sliderBg = item.querySelector('.popup-light-slider-bg');
    if (sliderBg) {
      sliderBg.style.width = `${clampedPercentage}%`;
    }

    // Update brightness display
    const brightnessEl = item.querySelector('.popup-light-brightness');
    if (brightnessEl) {
      brightnessEl.textContent = `${clampedPercentage}%`;
    }

    panel._lightSliderValue = clampedPercentage;
  };

  const handleMouseUp = () => {
    try {
      // Apply the final value
      if (panel._lightSliderValue !== undefined && panel._lightSliderEntityId) {
        setLightBrightness(panel._lightSliderEntityId, panel._lightSliderValue);
      }

      // Remove dragging class
      if (panel._lightSliderItem) {
        panel._lightSliderItem.classList.remove('dragging');
      }

      // Reset state
      panel._lightSliderDragging = false;
      panel._lightSliderEntityId = null;
      panel._lightSliderValue = undefined;
      panel._lightSliderItem = null;
    } finally {
      // ALWAYS cleanup, even on error
      if (panel._dragAbortController) {
        panel._dragAbortController.abort();
        panel._dragAbortController = null;
      }
    }
  };

  // Use signal for automatic cleanup when abort() is called
  document.addEventListener('mousemove', handleMouseMove, { signal });
  document.addEventListener('mouseup', handleMouseUp, { signal });

  e.preventDefault();
}

/**
 * Cleanup drag listeners on panel (call from disconnectedCallback)
 * SECURITY: Ensures no memory leaks if panel unmounts during drag (Story 7.4, GitHub #1)
 * @param {Object} panel - DashviewPanel instance
 */
export function cleanupDragListeners(panel) {
  if (panel._dragAbortController) {
    panel._dragAbortController.abort();
    panel._dragAbortController = null;
  }
  // Reset drag state
  panel._lightSliderDragging = false;
  panel._lightSliderEntityId = null;
  panel._lightSliderValue = undefined;
  if (panel._lightSliderItem) {
    panel._lightSliderItem.classList.remove('dragging');
    panel._lightSliderItem = null;
  }
}

/**
 * Handle light slider click (non-drag click)
 * @param {Object} panel - DashviewPanel instance
 * @param {MouseEvent} e - Mouse event
 * @param {string} entityId - Entity ID
 * @param {Function} setLightBrightness - Function to set light brightness
 */
export function handleLightSliderClick(panel, e, entityId, setLightBrightness) {
  // Only handle click if not dragging
  if (panel._lightSliderDragging) return;

  const slider = e.currentTarget;
  const rect = slider.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const percentage = Math.round((clickX / rect.width) * 100);
  setLightBrightness(entityId, Math.max(1, Math.min(100, percentage)));
}

/**
 * Handle popup overlay click - close popup if clicking on overlay
 * @param {Event} e - Click event
 * @param {Function} closePopup - Function to close the popup
 */
export function handlePopupOverlayClick(e, closePopup) {
  if (e.target.classList.contains('popup-overlay')) {
    closePopup();
  }
}

/**
 * Handle entity search with debounce
 * @param {Object} panel - DashviewPanel instance
 * @param {string} roomId - Room/area ID
 * @param {string} query - Search query
 * @param {number} debounceMs - Debounce time in milliseconds (default 150)
 */
export function handleEntitySearch(panel, roomId, query, debounceMs = 150) {
  // Initialize state if not exists
  if (!panel._entitySearchTermsByRoom) {
    panel._entitySearchTermsByRoom = {};
  }
  if (!panel._entitySearchDebounceTimers) {
    panel._entitySearchDebounceTimers = {};
  }

  // Clear existing debounce timer for this room
  if (panel._entitySearchDebounceTimers[roomId]) {
    clearTimeout(panel._entitySearchDebounceTimers[roomId]);
  }

  // Set the search term immediately for input responsiveness
  panel._entitySearchTermsByRoom[roomId] = query;
  panel.requestUpdate();

  // Debounce the filtering
  panel._entitySearchDebounceTimers[roomId] = setTimeout(() => {
    panel.requestUpdate();
  }, debounceMs);
}

/**
 * Clear entity search for a room
 * @param {Object} panel - DashviewPanel instance
 * @param {string} roomId - Room/area ID
 */
export function clearEntitySearch(panel, roomId) {
  if (!panel._entitySearchTermsByRoom) {
    panel._entitySearchTermsByRoom = {};
  }
  panel._entitySearchTermsByRoom[roomId] = '';
  panel.requestUpdate();
}

/**
 * Filter entities by search term
 * @param {Array} entities - Array of entity objects
 * @param {string} searchTerm - Search term
 * @returns {Array} Filtered entities
 */
export function filterEntities(entities, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) return entities;

  const term = searchTerm.toLowerCase().trim();
  return entities.filter(entity => {
    const name = (entity.name || entity.friendly_name || '').toLowerCase();
    return name.includes(term);
  });
}

/**
 * Generic toggle helper for enabled entity settings
 * Note: Entities are enabled by default (when not in map or undefined)
 * Only explicit false means disabled
 * @param {Object} panel - DashviewPanel instance
 * @param {string} settingsKey - Property key (e.g., '_enabledLights')
 * @param {string} entityId - Entity ID to toggle
 * @param {Function} saveSettings - Function to save settings
 * @param {Function} updateEnabledMaps - Function to update room data service enabled maps
 */
export function toggleEntityEnabled(panel, settingsKey, entityId, saveSettings, updateEnabledMaps) {
  const isCurrentlyEnabled = panel[settingsKey][entityId] !== false;
  panel[settingsKey] = { ...panel[settingsKey], [entityId]: !isCurrentlyEnabled };
  saveSettings();
  updateEnabledMaps();
  panel.requestUpdate();
}

/**
 * Generic toggle helper for boolean properties
 * @param {Object} panel - DashviewPanel instance
 * @param {string} key - Property key
 */
export function toggleBoolProp(panel, key) {
  panel[key] = !panel[key];
  panel.requestUpdate();
}

/**
 * Toggle area expanded state
 * @param {Object} panel - DashviewPanel instance
 * @param {string} areaId - Area ID
 */
export function toggleAreaExpanded(panel, areaId) {
  panel._expandedAreas = {
    ...panel._expandedAreas,
    [areaId]: !panel._expandedAreas[areaId],
  };
  panel.requestUpdate();
}

/**
 * Toggle entity type section expanded state
 * @param {Object} panel - DashviewPanel instance
 * @param {string} areaId - Area ID
 * @param {string} typeKey - Entity type key
 */
export function toggleEntityTypeSection(panel, areaId, typeKey) {
  // Initialize if not exists
  if (!panel._expandedEntityTypes) {
    panel._expandedEntityTypes = {};
  }
  if (!panel._expandedEntityTypes[areaId]) {
    panel._expandedEntityTypes[areaId] = new Set();
  }

  // Toggle the typeKey in the Set
  if (panel._expandedEntityTypes[areaId].has(typeKey)) {
    panel._expandedEntityTypes[areaId].delete(typeKey);
  } else {
    panel._expandedEntityTypes[areaId].add(typeKey);
  }

  panel.requestUpdate();
}

/**
 * Handle floor reorder from drag-and-drop
 * @param {Object} panel - DashviewPanel instance
 * @param {Object} detail - Reorder event detail
 * @param {Function} saveSettings - Function to save settings
 */
export function handleFloorReorder(panel, detail, saveSettings) {
  const { order } = detail;
  const oldFloorOrder = [...(panel._floorOrder || [])];

  // If floorOrder is empty, initialize from available floors
  if (oldFloorOrder.length === 0 && panel._floors) {
    panel._floorOrder = panel._floors.map(f => f.floor_id);
  }

  // Apply new order
  panel._floorOrder = order;

  saveSettings();
  panel.requestUpdate();
}

/**
 * Handle room reorder from drag-and-drop within a floor
 * @param {Object} panel - DashviewPanel instance
 * @param {string|null} floorId - Floor ID (null for unassigned)
 * @param {Object} detail - Reorder event detail
 * @param {Function} saveSettings - Function to save settings
 */
export function handleRoomReorder(panel, floorId, detail, saveSettings) {
  const { order } = detail;
  const orderKey = floorId || '_unassigned';

  // Get current room order
  const roomOrder = { ...(panel._roomOrder || {}) };
  const oldRoomOrder = [...(roomOrder[orderKey] || [])];

  // If room order is empty, initialize from available areas
  if (oldRoomOrder.length === 0 && panel._areas) {
    const areasForFloor = panel._areas.filter(a => {
      if (floorId === null) {
        return !a.floor_id;
      }
      return a.floor_id === floorId;
    });
    roomOrder[orderKey] = areasForFloor.map(a => a.area_id);
  }

  // Apply new order
  roomOrder[orderKey] = order;
  panel._roomOrder = roomOrder;

  saveSettings();
  panel.requestUpdate();
}

/**
 * Handle media preset reorder from drag-and-drop
 * @param {Object} panel - DashviewPanel instance
 * @param {Object} detail - Reorder event detail
 * @param {Function} saveSettings - Function to save settings
 */
export function handleMediaPresetReorder(panel, detail, saveSettings) {
  const { order, oldIndex } = detail;
  const oldPresets = [...(panel._mediaPresets || [])];

  // Reorder presets based on new order (order contains indices as strings)
  const newPresets = order.map(indexStr => {
    const index = parseInt(indexStr, 10);
    return oldPresets[index];
  }).filter(Boolean);

  // Apply new order
  panel._mediaPresets = newPresets;

  saveSettings();
  panel.requestUpdate();
}
