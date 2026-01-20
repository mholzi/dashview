/**
 * State Management Utilities
 * Extracted from dashview-panel.js for modularity
 *
 * @module core/state
 */

/**
 * Save panel settings to the settings store
 * @param {Object} panel - DashviewPanel instance
 * @param {Object} settingsStore - Settings store instance
 * @param {Object} debugLog - Debug logging function
 */
export function saveSettings(panel, settingsStore, debugLog) {
  if (!settingsStore) {
    console.warn("Dashview: Settings store not available");
    return;
  }
  // Don't save until settings have been loaded from backend
  // This prevents overwriting saved settings with empty defaults on reload
  if (!panel._settingsLoaded) {
    debugLog('panel', 'Skipping save - settings not yet loaded');
    return;
  }
  // Sync local properties to store and save
  settingsStore.update({
    enabledRooms: panel._enabledRooms,
    enabledLights: panel._enabledLights,
    enabledMotionSensors: panel._enabledMotionSensors,
    enabledSmokeSensors: panel._enabledSmokeSensors,
    enabledCovers: panel._enabledCovers,
    enabledMediaPlayers: panel._enabledMediaPlayers,
    enabledTVs: panel._enabledTVs,
    enabledLocks: panel._enabledLocks,
    enabledGarages: panel._enabledGarages,
    enabledWindows: panel._enabledWindows,
    enabledVibrationSensors: panel._enabledVibrationSensors,
    enabledTemperatureSensors: panel._enabledTemperatureSensors,
    enabledHumiditySensors: panel._enabledHumiditySensors,
    enabledClimates: panel._enabledClimates,
    enabledRoofWindows: panel._enabledRoofWindows,
    notificationTempThreshold: panel._notificationTempThreshold,
    notificationHumidityThreshold: panel._notificationHumidityThreshold,
    tempRapidChangeThreshold: panel._tempRapidChangeThreshold,
    tempRapidChangeWindowMinutes: panel._tempRapidChangeWindowMinutes,
    humidityRapidChangeThreshold: panel._humidityRapidChangeThreshold,
    humidityRapidChangeWindowMinutes: panel._humidityRapidChangeWindowMinutes,
    weatherEntity: panel._weatherEntity,
    weatherCurrentTempEntity: panel._weatherCurrentTempEntity,
    weatherCurrentStateEntity: panel._weatherCurrentStateEntity,
    weatherTodayTempEntity: panel._weatherTodayTempEntity,
    weatherTodayStateEntity: panel._weatherTodayStateEntity,
    weatherTomorrowTempEntity: panel._weatherTomorrowTempEntity,
    weatherTomorrowStateEntity: panel._weatherTomorrowStateEntity,
    weatherDay2TempEntity: panel._weatherDay2TempEntity,
    weatherDay2StateEntity: panel._weatherDay2StateEntity,
    weatherPrecipitationEntity: panel._weatherPrecipitationEntity,
    hourlyForecastEntity: panel._hourlyForecastEntity,
    dwdWarningEntity: panel._dwdWarningEntity,
    weatherRadarLat: panel._weatherRadarLat,
    weatherRadarLon: panel._weatherRadarLon,
    weatherRadarZoom: panel._weatherRadarZoom,
    weatherRadarTempUnit: panel._weatherRadarTempUnit,
    weatherRadarWindUnit: panel._weatherRadarWindUnit,
    floorOrder: panel._floorOrder,
    roomOrder: panel._roomOrder,
    floorCardConfig: panel._floorCardConfig,
    floorOverviewEnabled: panel._floorOverviewEnabled,
    garbageSensors: panel._garbageSensors,
    garbageDisplayFloor: panel._garbageDisplayFloor,
    infoTextConfig: panel._infoTextConfig,
    sceneButtons: panel._sceneButtons,
    roomSceneButtons: panel._roomSceneButtons,
    customLabels: panel._customLabels,
    enabledCustomEntities: panel._enabledCustomEntities,
    enabledAppliances: panel._enabledAppliances,
    trainDepartures: panel._trainDepartures,
    mediaPresets: panel._mediaPresets,
    userPhotos: panel._userPhotos,
    manualLanguage: panel._manualLanguage,
    // Category label mappings
    categoryLabels: {
      light: panel._lightLabelId,
      cover: panel._coverLabelId,
      roofWindow: panel._roofWindowLabelId,
      window: panel._windowLabelId,
      garage: panel._garageLabelId,
      motion: panel._motionLabelId,
      smoke: panel._smokeLabelId,
      vibration: panel._vibrationLabelId,
      temperature: panel._temperatureLabelId,
      humidity: panel._humidityLabelId,
      climate: panel._climateLabelId,
      mediaPlayer: panel._mediaPlayerLabelId,
      tv: panel._tvLabelId,
      lock: panel._lockLabelId,
    },
  }, true); // true = save immediately (debounced internally)
}

/**
 * Category to property name mapping
 */
const CATEGORY_PROP_MAP = {
  light: '_lightLabelId',
  cover: '_coverLabelId',
  roofWindow: '_roofWindowLabelId',
  window: '_windowLabelId',
  garage: '_garageLabelId',
  motion: '_motionLabelId',
  smoke: '_smokeLabelId',
  waterLeak: '_waterLeakLabelId',
  vibration: '_vibrationLabelId',
  temperature: '_temperatureLabelId',
  humidity: '_humidityLabelId',
  climate: '_climateLabelId',
  mediaPlayer: '_mediaPlayerLabelId',
  tv: '_tvLabelId',
  lock: '_lockLabelId',
};

/**
 * Set a category's label mapping
 * @param {Object} panel - DashviewPanel instance
 * @param {string} category - Category key (light, cover, etc.)
 * @param {string|null} labelId - Label ID to map, or null to clear
 * @param {Function} saveSettingsFn - Function to save settings
 * @param {Function} updateRoomDataServiceLabelIdsFn - Function to update room data service
 */
export function setCategoryLabel(panel, category, labelId, saveSettingsFn, updateRoomDataServiceLabelIdsFn) {
  const prop = CATEGORY_PROP_MAP[category];
  if (prop) {
    panel[prop] = labelId;
    saveSettingsFn();

    // Update roomDataService with new label IDs
    updateRoomDataServiceLabelIdsFn();

    panel.requestUpdate();
    console.log(`Dashview: Set ${category} label to "${labelId}"`);
  }
}

/**
 * Update roomDataService with current label ID mappings
 * @param {Object} panel - DashviewPanel instance
 * @param {Object} roomDataService - Room data service instance
 */
export function updateRoomDataServiceLabelIds(panel, roomDataService) {
  if (roomDataService) {
    roomDataService.setLabelIds({
      light: panel._lightLabelId,
      cover: panel._coverLabelId,
      roofWindow: panel._roofWindowLabelId,
      window: panel._windowLabelId,
      garage: panel._garageLabelId,
      motion: panel._motionLabelId,
      smoke: panel._smokeLabelId,
      waterLeak: panel._waterLeakLabelId,
      vibration: panel._vibrationLabelId,
      temperature: panel._temperatureLabelId,
      humidity: panel._humidityLabelId,
      climate: panel._climateLabelId,
      mediaPlayer: panel._mediaPlayerLabelId,
      tv: panel._tvLabelId,
      lock: panel._lockLabelId,
    });
  }
}

/**
 * Update roomDataService with enabled entity maps
 * @param {Object} panel - DashviewPanel instance
 * @param {Object} roomDataService - Room data service instance
 */
export function updateRoomDataServiceEnabledMaps(panel, roomDataService) {
  if (roomDataService) {
    roomDataService.setEnabledMaps({
      enabledLights: panel._enabledLights,
      enabledMotionSensors: panel._enabledMotionSensors,
      enabledSmokeSensors: panel._enabledSmokeSensors,
      enabledWaterLeakSensors: panel._enabledWaterLeakSensors,
      enabledCovers: panel._enabledCovers,
      enabledGarages: panel._enabledGarages,
      enabledWindows: panel._enabledWindows,
      enabledVibrationSensors: panel._enabledVibrationSensors,
      enabledTemperatureSensors: panel._enabledTemperatureSensors,
      enabledHumiditySensors: panel._enabledHumiditySensors,
      enabledClimates: panel._enabledClimates,
      enabledRoofWindows: panel._enabledRoofWindows,
      enabledMediaPlayers: panel._enabledMediaPlayers,
      enabledTVs: panel._enabledTVs,
      enabledLocks: panel._enabledLocks,
    });
  }
}

/**
 * Build an enabled map from the registry for default-enabled behavior
 * Returns a map where all entities with the label are set to true unless explicitly disabled
 * @param {string} labelId - Label ID to filter by
 * @param {Object} existingMap - Existing enabled map (may have explicit false values)
 * @param {Array} entityRegistry - Entity registry array
 * @returns {Object} Map of entityId -> boolean
 */
export function buildEnabledMapFromRegistry(labelId, existingMap, entityRegistry) {
  if (!labelId) {
    return existingMap || {};
  }
  const map = {};
  entityRegistry.forEach(e => {
    if (e.labels && e.labels.includes(labelId)) {
      // Use existing value if set, otherwise default to true
      map[e.entity_id] = existingMap[e.entity_id] !== false;
    }
  });
  return map;
}
