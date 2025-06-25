// custom_components/dashview/www/lib/state-manager.js

export class StateManager {
    constructor(hass, panel) {
      this._hass = hass;
      this._panel = panel;
      this._lastEntityStates = new Map();
      this._watchedEntities = new Set();
      this._componentUpdaters = new Map();
    }
  
    set hass(hass) {
      this._hass = hass;
      this._handleHassUpdate();
    }
  
    _handleHassUpdate() {
      if (!this._hass) return;
      this._ensureInitialEntityStates();
      this._checkEntityChanges();
    }
  
    _ensureInitialEntityStates() {
      if (!this._hass) return;
  
      if (this._watchedEntities.size === 0) {
        console.warn('[StateManager] Watched entities set is empty. Cannot initialize states.');
        return;
      }
  
      let initializedCount = 0;
      for (const entityId of this._watchedEntities) {
        if (!this._lastEntityStates.has(entityId)) {
          const currentState = this._hass.states[entityId];
          this._lastEntityStates.set(entityId, currentState ? { ...currentState } : null);
          this._updateComponentForEntity(entityId);
          initializedCount++;
        }
      }
  
      if (initializedCount > 0) {
        console.log(`[StateManager] Initialized ${initializedCount} entities on first load.`);
      }
    }
  
    _checkEntityChanges() {
      if (this._watchedEntities.size === 0) return;
  
      let hasChanges = false;
      for (const entityId of this._watchedEntities) {
        const currentState = this._hass.states[entityId];
        const lastState = this._lastEntityStates.get(entityId);
  
        if (!lastState || !currentState || currentState.state !== lastState.state ||
            JSON.stringify(currentState.attributes) !== JSON.stringify(lastState.attributes)) {
          this._lastEntityStates.set(entityId, currentState ? { ...currentState } : null);
          this._updateComponentForEntity(entityId);
          hasChanges = true;
        }
      }
      if (hasChanges) {
        this._panel.updateHeaderButtons(this._panel.shadowRoot);
      }
    }
  
    _updateComponentForEntity(entityId) {
      const updater = this._componentUpdaters.get(entityId);
      if (updater) {
        try {
          updater(entityId);
        } catch (error) {
          console.error(`[StateManager] Error updating component for ${entityId}:`, error);
        }
      }
    }
  
    watchEntity(entityId, updateCallback) {
      this._watchedEntities.add(entityId);
      this._componentUpdaters.set(entityId, updateCallback);
    }
  }
