// custom_components/dashview/www/lib/state-manager.js

export class StateManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = null;
    this._lastEntityStates = new Map();
    // This map will store which function to call when an entity changes.
    // Key: entityId, Value: callback function
    this._entityCallbacks = new Map();
    this._dirtyEntities = new Set(); // Track entities that have changed
    this._batchUpdateTimeout = null; // For batching multiple updates
  }

  setHass(hass) {
    this._hass = hass;
  }

  setConfig(houseConfig, integrationsConfig) {
    // Automatically register all entities found in the configuration
    this._registerEntitiesFromConfig(houseConfig, integrationsConfig);
  }

  /**
   * Registers a single entity or an array of entities to be watched.
   * @param {string|string[]} entityIds The entity ID or array of IDs.
   * @param {Function} callback The function to call when any of these entities change.
   */
  watchEntities(entityIds, callback) {
    const ids = Array.isArray(entityIds) ? entityIds : [entityIds];
    ids.forEach(id => {
      if (id) {
        this._entityCallbacks.set(id, callback);
      }
    });
  }

  /**
   * The main update loop. Called by the panel's hass setter.
   * It checks for changes in all watched entities and triggers their callbacks.
   * This version is more robust, using deep copies and improved error handling.
   */
handleHassUpdate() {
  if (!this._hass) return;

  for (const [entityId, callback] of this._entityCallbacks.entries()) {
    try {
      const currentState = this._hass.states[entityId];
      const lastState = this._lastEntityStates.get(entityId);

      let hasChanged = false;

      if (!currentState && lastState) { // Entity has been removed
          hasChanged = true;
      } else if (currentState && !lastState) { // Entity is new
          hasChanged = true;
      } else if (currentState && lastState) {
          // Compare state and relevant attributes without JSON.stringify
          if (currentState.state !== lastState.state || this._areAttributesChanged(currentState.attributes, lastState.attributes)) {
              hasChanged = true;
          }
      }

      if (hasChanged) {
        const newStateSnapshot = currentState ? JSON.parse(JSON.stringify(currentState)) : null;
        this._lastEntityStates.set(entityId, newStateSnapshot);
        
        // Track dirty entity and batch updates for performance
        this._dirtyEntities.add(entityId);
        
        // Clear existing timeout and set a new one for batched updates
        if (this._batchUpdateTimeout) {
          clearTimeout(this._batchUpdateTimeout);
        }
        
        this._batchUpdateTimeout = setTimeout(() => {
          this._processBatchedUpdates();
        }, 50); // 50ms batch window
        
        // Still call individual callback for backward compatibility
        if (typeof callback === 'function') {
          callback(entityId, currentState);
        }
      }
    } catch (e) {
      console.error(`[StateManager] Error processing entity ${entityId}.`, e);
    }
  }
}

// Add this helper method to the StateManager class
_areAttributesChanged(newAttrs, oldAttrs) {
    const oldKeys = Object.keys(oldAttrs);
    const newKeys = Object.keys(newAttrs);

    if (oldKeys.length !== newKeys.length) {
        return true;
    }

    for (const key of newKeys) {
        // This is a shallow comparison. For nested objects, a deep comparison might be needed,
        // but this is already a huge improvement.
        if (oldAttrs[key] !== newAttrs[key]) {
            return true;
        }
    }
    return false;
}
  
  /**
   * Automatically find and register all entities from the house configuration.
   */
  _registerEntitiesFromConfig(houseConfig, integrationsConfig) {
    if (!houseConfig || !houseConfig.rooms) return;

    // Watch all entities defined in any room's header_entities, lights, covers, etc.
    for (const room of Object.values(houseConfig.rooms)) {
        room.header_entities?.forEach(e => this.watchEntities(e.entity, (id) => this._panel.updateComponentForEntity(id)));
        this.watchEntities(room.lights, (id) => this._panel.updateComponentForEntity(id));
        this.watchEntities(room.covers, (id) => this._panel.updateComponentForEntity(id));
        this.watchEntities(room.media_players?.map(mp => mp.entity), (id) => this._panel.updateComponentForEntity(id));
    }
    
    // Watch other globally important entities
    const staticEntities = [
        this._panel._getCurrentWeatherEntityId(),
        integrationsConfig?.dwd_sensor,
        'binary_sensor.motion_presence_home',
        'sensor.geschirrspuler_operation_state',
        'sensor.geschirrspuler_remaining_program_time',
        'sensor.waschmaschine_operation_state',
        'sensor.waschmaschine_remaining_program_time',
        'vacuum.mova_e30_ultra',
        'input_boolean.trockner_an',
        'sensor.foxess_solar',
        'sensor.foxess_bat_soc',
    ];

    this.watchEntities(staticEntities, (id) => this._panel.updateComponentForEntity(id));

    console.log(`[StateManager] Now watching ${this._entityCallbacks.size} entities.`);
  }

  /**
   * Process batched entity updates efficiently
   */
  _processBatchedUpdates() {
    if (this._dirtyEntities.size === 0) return;
    
    console.log(`[StateManager] Processing batched updates for ${this._dirtyEntities.size} entities`);
    
    // Notify FloorManager about dirty entities for targeted updates
    if (this._panel._floorManager && typeof this._panel._floorManager.updateDirtyEntities === 'function') {
      this._panel._floorManager.updateDirtyEntities(Array.from(this._dirtyEntities));
    }
    
    // Clear dirty entities set
    this._dirtyEntities.clear();
    this._batchUpdateTimeout = null;
  }

  /**
   * Get current dirty entities (for debugging/monitoring)
   */
  getDirtyEntities() {
    return Array.from(this._dirtyEntities);
  }

  /**
   * Force immediate processing of dirty entities
   */
  flushUpdates() {
    if (this._batchUpdateTimeout) {
      clearTimeout(this._batchUpdateTimeout);
      this._processBatchedUpdates();
    }
  }
}
