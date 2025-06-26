// custom_components/dashview/www/lib/state-manager.js

export class StateManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = null;
    this._lastEntityStates = new Map();
    // This map will store which function to call when an entity changes.
    // Key: entityId, Value: callback function
    this._entityCallbacks = new Map();
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

        // An entity might be removed from Home Assistant
        if (!currentState) {
            if (lastState) { // It existed before, but not now
                hasChanged = true;
            }
        } else if (!lastState) { // It's a new entity we haven't seen
            hasChanged = true;
        } else {
            // Compare state and attributes for existing entities
            if (currentState.state !== lastState.state ||
                JSON.stringify(currentState.attributes) !== JSON.stringify(lastState.attributes)) {
                hasChanged = true;
            }
        }

        if (hasChanged) {
          // Use a deep copy to prevent reference issues.
          // This ensures that we are comparing against a true snapshot of the last state.
          const newStateSnapshot = currentState ? JSON.parse(JSON.stringify(currentState)) : null;
          this._lastEntityStates.set(entityId, newStateSnapshot);
          
          if (typeof callback === 'function') {
            callback(entityId, currentState);
          }
        }
      } catch (e) {
        console.error(`[StateManager] Error processing entity ${entityId}. This can happen if an entity has non-serializable attributes.`, e);
        // We catch the error here so that one faulty entity doesn't stop the entire update loop.
      }
    }
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
}
