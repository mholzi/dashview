// custom_components/dashview/www/lib/utils/validation-utils.js

export class ValidationUtils {
  constructor(hass, stateManager) {
    this._hass = hass;
    this._stateManager = stateManager;
    this._debounceTimers = new Map();
    this._validationCache = new Map();
    this._cacheExpiry = 30000; // 30 seconds
  }

  /**
   * Core validation types
   */
  static VALIDATION_TYPES = {
    ENTITY_ID: 'entity_id',
    ENTITY_EXISTS: 'entity_exists',
    NUMERIC_RANGE: 'numeric_range',
    REQUIRED: 'required',
    UNIQUE_KEY: 'unique_key',
    FORMAT: 'format'
  };

  /**
   * Validate entity ID format
   */
  validateEntityIdFormat(entityId) {
    if (!entityId || typeof entityId !== 'string') {
      return { valid: false, message: 'Entity ID ist erforderlich' };
    }

    const entityIdPattern = /^[a-z_]+\.[a-z0-9_]+$/;
    if (!entityIdPattern.test(entityId)) {
      return { 
        valid: false, 
        message: 'Ungültiges Entity ID Format. Erwartet: domain.object_id (z.B. light.wohnzimmer_lampe)' 
      };
    }

    return { valid: true };
  }

  /**
   * Validate if entity exists in Home Assistant (with caching and debouncing)
   */
  async validateEntityExists(entityId, callback, debounceMs = 500) {
    if (!entityId) {
      callback({ valid: false, message: 'Entity ID ist erforderlich' });
      return;
    }

    // Check format first
    const formatResult = this.validateEntityIdFormat(entityId);
    if (!formatResult.valid) {
      callback(formatResult);
      return;
    }

    // Check cache
    const cacheKey = `entity_exists_${entityId}`;
    const cached = this._validationCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < this._cacheExpiry) {
      callback(cached.result);
      return;
    }

    // Clear existing debounce timer
    if (this._debounceTimers.has(entityId)) {
      clearTimeout(this._debounceTimers.get(entityId));
    }

    // Set new debounce timer
    const timer = setTimeout(async () => {
      try {
        const exists = this._hass && this._hass.states && this._hass.states[entityId];
        const result = exists 
          ? { valid: true }
          : { valid: false, message: 'Entity nicht in Home Assistant gefunden' };

        // Cache result
        this._validationCache.set(cacheKey, {
          result,
          timestamp: Date.now()
        });

        callback(result);
      } catch (error) {
        console.error('[DashView] Entity validation error:', error);
        callback({ valid: false, message: 'Fehler bei der Entity-Überprüfung' });
      }
      
      this._debounceTimers.delete(entityId);
    }, debounceMs);

    this._debounceTimers.set(entityId, timer);
  }

  /**
   * Validate numeric range
   */
  validateNumericRange(value, min, max, required = false) {
    if (!required && (value === '' || value === null || value === undefined)) {
      return { valid: true };
    }

    if (required && (value === '' || value === null || value === undefined)) {
      return { valid: false, message: 'Wert ist erforderlich' };
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { valid: false, message: 'Muss eine gültige Zahl sein' };
    }

    if (min !== undefined && numValue < min) {
      return { valid: false, message: `Wert muss mindestens ${min} sein` };
    }

    if (max !== undefined && numValue > max) {
      return { valid: false, message: `Wert darf höchstens ${max} sein` };
    }

    return { valid: true };
  }

  /**
   * Validate required field
   */
  validateRequired(value) {
    if (value === null || value === undefined || value === '' || 
        (Array.isArray(value) && value.length === 0)) {
      return { valid: false, message: 'Dieses Feld ist erforderlich' };
    }
    return { valid: true };
  }

  /**
   * Validate unique key in a list
   */
  validateUniqueKey(key, existingKeys, currentKey = null) {
    if (!key || typeof key !== 'string') {
      return { valid: false, message: 'Schlüssel ist erforderlich' };
    }

    const keyPattern = /^[a-z0-9_]+$/;
    if (!keyPattern.test(key)) {
      return { 
        valid: false, 
        message: 'Schlüssel darf nur Kleinbuchstaben, Zahlen und Unterstriche enthalten' 
      };
    }

    if (currentKey !== key && existingKeys.includes(key)) {
      return { valid: false, message: 'Dieser Schlüssel wird bereits verwendet' };
    }

    return { valid: true };
  }

  /**
   * Validate custom format with regex
   */
  validateFormat(value, pattern, message) {
    if (!value) {
      return { valid: true }; // Allow empty unless marked as required
    }

    if (!pattern.test(value)) {
      return { valid: false, message };
    }

    return { valid: true };
  }

  /**
   * Apply visual feedback to input element
   */
  applyValidationFeedback(input, validationResult, feedbackContainer = null) {
    if (!input) return;

    // Remove existing validation classes
    input.classList.remove('validation-error', 'validation-success', 'validation-warning');
    
    // Remove existing feedback elements
    const existingFeedback = input.parentNode.querySelector('.validation-message');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    if (validationResult.valid) {
      input.classList.add('validation-success');
      return;
    }

    // Apply error styling
    input.classList.add('validation-error');

    // Create feedback message element
    const feedbackElement = document.createElement('div');
    feedbackElement.className = 'validation-message validation-error-message';
    feedbackElement.textContent = validationResult.message;

    // Insert feedback message
    if (feedbackContainer) {
      feedbackContainer.appendChild(feedbackElement);
    } else {
      input.parentNode.insertBefore(feedbackElement, input.nextSibling);
    }
  }

  /**
   * Setup real-time validation for an input element
   */
  setupInputValidation(input, validationRules, options = {}) {
    if (!input) return;

    const {
      debounceMs = 300,
      validateOnBlur = true,
      validateOnInput = true,
      feedbackContainer = null
    } = options;

    let validationTimer;

    const performValidation = async () => {
      const value = input.value.trim();
      let allValid = true;
      let firstError = null;

      for (const rule of validationRules) {
        let result;

        switch (rule.type) {
          case ValidationUtils.VALIDATION_TYPES.ENTITY_ID:
            result = this.validateEntityIdFormat(value);
            break;

          case ValidationUtils.VALIDATION_TYPES.ENTITY_EXISTS:
            await new Promise((resolve) => {
              this.validateEntityExists(value, (res) => {
                result = res;
                resolve();
              }, 100); // Shorter debounce for immediate validation
            });
            break;

          case ValidationUtils.VALIDATION_TYPES.NUMERIC_RANGE:
            result = this.validateNumericRange(value, rule.min, rule.max, rule.required);
            break;

          case ValidationUtils.VALIDATION_TYPES.REQUIRED:
            result = this.validateRequired(value);
            break;

          case ValidationUtils.VALIDATION_TYPES.UNIQUE_KEY:
            result = this.validateUniqueKey(value, rule.existingKeys, rule.currentKey);
            break;

          case ValidationUtils.VALIDATION_TYPES.FORMAT:
            result = this.validateFormat(value, rule.pattern, rule.message);
            break;

          default:
            if (typeof rule.validator === 'function') {
              result = await rule.validator(value);
            } else {
              result = { valid: true };
            }
        }

        if (!result.valid) {
          allValid = false;
          if (!firstError) {
            firstError = result;
          }
          break; // Stop at first error
        }
      }

      const finalResult = allValid ? { valid: true } : firstError;
      this.applyValidationFeedback(input, finalResult, feedbackContainer);
      
      // Trigger custom event
      input.dispatchEvent(new CustomEvent('dashview-validation', {
        detail: { valid: finalResult.valid, message: finalResult.message }
      }));

      return finalResult;
    };

    if (validateOnInput) {
      input.addEventListener('input', () => {
        clearTimeout(validationTimer);
        validationTimer = setTimeout(performValidation, debounceMs);
      });
    }

    if (validateOnBlur) {
      input.addEventListener('blur', () => {
        clearTimeout(validationTimer);
        performValidation();
      });
    }

    // Initial validation if input has value
    if (input.value.trim()) {
      setTimeout(performValidation, 100);
    }

    return {
      validate: performValidation,
      destroy: () => {
        clearTimeout(validationTimer);
        input.classList.remove('validation-error', 'validation-success', 'validation-warning');
        const feedback = input.parentNode.querySelector('.validation-message');
        if (feedback) feedback.remove();
      }
    };
  }

  /**
   * Clear validation cache
   */
  clearCache() {
    this._validationCache.clear();
  }

  /**
   * Cleanup timers and cache
   */
  destroy() {
    // Clear all debounce timers
    for (const timer of this._debounceTimers.values()) {
      clearTimeout(timer);
    }
    this._debounceTimers.clear();
    this.clearCache();
  }
}

/**
 * Configuration Health Checker
 */
export class ConfigHealthChecker {
  constructor(hass, configManager) {
    this._hass = hass;
    this._configManager = configManager;
  }

  /**
   * Perform comprehensive configuration health check
   */
  async performHealthCheck() {
    const issues = [];
    
    try {
      const houseConfig = await this._configManager.getConfig('house');
      
      if (houseConfig) {
        issues.push(...await this._checkRoomConsistency(houseConfig));
        issues.push(...await this._checkEntityReferences(houseConfig));
        issues.push(...await this._checkFloorConsistency(houseConfig));
        issues.push(...await this._checkSceneConsistency(houseConfig));
      }

      issues.push(...await this._checkWeatherConfiguration());
      issues.push(...await this._checkIntegrationSettings());

    } catch (error) {
      console.error('[DashView] Health check error:', error);
      issues.push({
        id: 'health_check_error',
        type: 'error',
        category: 'system',
        title: 'Fehler bei der Konsistenzprüfung',
        description: 'Ein Fehler ist bei der Überprüfung der Konfiguration aufgetreten.',
        fixable: false
      });
    }

    return {
      totalIssues: issues.length,
      errors: issues.filter(i => i.type === 'error').length,
      warnings: issues.filter(i => i.type === 'warning').length,
      issues
    };
  }

  async _checkRoomConsistency(houseConfig) {
    const issues = [];
    const rooms = houseConfig.rooms || {};
    const floors = houseConfig.floors || {};

    // Check for rooms not assigned to floors
    for (const [roomKey, room] of Object.entries(rooms)) {
      const assignedToFloor = Object.values(floors).some(floor => 
        floor.rooms && floor.rooms.includes(roomKey)
      );

      if (!assignedToFloor) {
        issues.push({
          id: `unassigned_room_${roomKey}`,
          type: 'warning',
          category: 'rooms',
          title: `Raum "${room.name}" nicht zugewiesen`,
          description: `Der Raum "${room.name}" (${roomKey}) ist keiner Etage zugeordnet.`,
          fixable: true,
          fixAction: 'assign_room_to_floor',
          fixData: { roomKey, roomName: room.name }
        });
      }
    }

    return issues;
  }

  async _checkEntityReferences(houseConfig) {
    const issues = [];
    const rooms = houseConfig.rooms || {};

    for (const [roomKey, room] of Object.entries(rooms)) {
      // Check entity references in room configuration
      const entityFields = [
        'room_lights', 'room_sensors', 'room_temperature_sensor',
        'room_humidity_sensor', 'room_covers', 'room_media_players'
      ];

      for (const field of entityFields) {
        const entities = room[field] || [];
        const entityList = Array.isArray(entities) ? entities : [entities].filter(Boolean);

        for (const entityId of entityList) {
          if (entityId && !this._hass.states[entityId]) {
            issues.push({
              id: `missing_entity_${roomKey}_${field}_${entityId}`,
              type: 'error',
              category: 'entities',
              title: `Entity nicht gefunden: ${entityId}`,
              description: `Entity "${entityId}" in Raum "${room.name}" (${field}) existiert nicht in Home Assistant.`,
              fixable: true,
              fixAction: 'remove_missing_entity',
              fixData: { roomKey, field, entityId, roomName: room.name }
            });
          }
        }
      }
    }

    return issues;
  }

  async _checkFloorConsistency(houseConfig) {
    const issues = [];
    const floors = houseConfig.floors || {};
    const rooms = houseConfig.rooms || {};

    for (const [floorKey, floor] of Object.entries(floors)) {
      const floorRooms = floor.rooms || [];
      
      // Check for empty floors
      if (floorRooms.length === 0) {
        issues.push({
          id: `empty_floor_${floorKey}`,
          type: 'warning',
          category: 'floors',
          title: `Leere Etage: ${floor.name}`,
          description: `Die Etage "${floor.name}" (${floorKey}) hat keine zugewiesenen Räume.`,
          fixable: true,
          fixAction: 'remove_empty_floor',
          fixData: { floorKey, floorName: floor.name }
        });
      }

      // Check for references to non-existent rooms
      for (const roomKey of floorRooms) {
        if (!rooms[roomKey]) {
          issues.push({
            id: `missing_room_ref_${floorKey}_${roomKey}`,
            type: 'error',
            category: 'floors',
            title: `Ungültige Raumreferenz: ${roomKey}`,
            description: `Etage "${floor.name}" referenziert nicht existierenden Raum "${roomKey}".`,
            fixable: true,
            fixAction: 'remove_missing_room_ref',
            fixData: { floorKey, roomKey, floorName: floor.name }
          });
        }
      }
    }

    return issues;
  }

  async _checkSceneConsistency(houseConfig) {
    const issues = [];
    const scenes = houseConfig.scenes || {};

    for (const [sceneKey, scene] of Object.entries(scenes)) {
      const entities = scene.entities || {};
      
      for (const [entityId, entityConfig] of Object.entries(entities)) {
        // Check if entity exists
        if (!this._hass.states[entityId]) {
          issues.push({
            id: `scene_missing_entity_${sceneKey}_${entityId}`,
            type: 'error',
            category: 'scenes',
            title: `Scene Entity nicht gefunden: ${entityId}`,
            description: `Scene "${scene.name}" referenziert nicht existierende Entity "${entityId}".`,
            fixable: true,
            fixAction: 'remove_scene_entity',
            fixData: { sceneKey, entityId, sceneName: scene.name }
          });
        }
      }
    }

    return issues;
  }

  async _checkWeatherConfiguration() {
    const issues = [];
    
    try {
      const weatherEntity = await this._configManager.getConfig('weather_entity');
      
      if (weatherEntity && !this._hass.states[weatherEntity]) {
        issues.push({
          id: 'missing_weather_entity',
          type: 'error',
          category: 'weather',
          title: 'Wetter-Entity nicht gefunden',
          description: `Die konfigurierte Wetter-Entity "${weatherEntity}" existiert nicht in Home Assistant.`,
          fixable: true,
          fixAction: 'clear_weather_entity',
          fixData: { entityId: weatherEntity }
        });
      }
    } catch (error) {
      // Weather config might not exist, which is ok
    }

    return issues;
  }

  async _checkIntegrationSettings() {
    const issues = [];
    
    try {
      const integrations = await this._configManager.getConfig('integrations');
      
      if (integrations && integrations.dwd && integrations.dwd.weather_entity) {
        const dwdEntity = integrations.dwd.weather_entity;
        if (!this._hass.states[dwdEntity]) {
          issues.push({
            id: 'missing_dwd_entity',
            type: 'warning',
            category: 'integrations',
            title: 'DWD Wetter-Entity nicht gefunden',
            description: `Die DWD Wetter-Entity "${dwdEntity}" existiert nicht in Home Assistant.`,
            fixable: true,
            fixAction: 'clear_dwd_entity',
            fixData: { entityId: dwdEntity }
          });
        }
      }
    } catch (error) {
      // Integration config might not exist, which is ok
    }

    return issues;
  }

  /**
   * Apply automated fix for an issue
   */
  async applyFix(issue) {
    try {
      switch (issue.fixAction) {
        case 'remove_missing_entity':
          return await this._fixRemoveMissingEntity(issue.fixData);
          
        case 'remove_missing_room_ref':
          return await this._fixRemoveMissingRoomRef(issue.fixData);
          
        case 'remove_empty_floor':
          return await this._fixRemoveEmptyFloor(issue.fixData);
          
        case 'remove_scene_entity':
          return await this._fixRemoveSceneEntity(issue.fixData);
          
        case 'clear_weather_entity':
          return await this._fixClearWeatherEntity(issue.fixData);
          
        case 'clear_dwd_entity':
          return await this._fixClearDwdEntity(issue.fixData);
          
        default:
          return { success: false, message: 'Unbekannte Fix-Aktion' };
      }
    } catch (error) {
      console.error('[DashView] Fix application error:', error);
      return { success: false, message: 'Fehler beim Anwenden der Korrektur' };
    }
  }

  async _fixRemoveMissingEntity(fixData) {
    const houseConfig = await this._configManager.getConfig('house');
    const room = houseConfig.rooms[fixData.roomKey];
    
    if (room && room[fixData.field]) {
      if (Array.isArray(room[fixData.field])) {
        room[fixData.field] = room[fixData.field].filter(id => id !== fixData.entityId);
      } else if (room[fixData.field] === fixData.entityId) {
        delete room[fixData.field];
      }
    }

    await this._configManager.saveConfig('house', houseConfig);
    return { success: true, message: `Entity "${fixData.entityId}" entfernt` };
  }

  async _fixRemoveMissingRoomRef(fixData) {
    const houseConfig = await this._configManager.getConfig('house');
    const floor = houseConfig.floors[fixData.floorKey];
    
    if (floor && floor.rooms) {
      floor.rooms = floor.rooms.filter(roomKey => roomKey !== fixData.roomKey);
    }

    await this._configManager.saveConfig('house', houseConfig);
    return { success: true, message: `Raumreferenz "${fixData.roomKey}" entfernt` };
  }

  async _fixRemoveEmptyFloor(fixData) {
    const houseConfig = await this._configManager.getConfig('house');
    delete houseConfig.floors[fixData.floorKey];

    await this._configManager.saveConfig('house', houseConfig);
    return { success: true, message: `Leere Etage "${fixData.floorName}" entfernt` };
  }

  async _fixRemoveSceneEntity(fixData) {
    const houseConfig = await this._configManager.getConfig('house');
    const scene = houseConfig.scenes[fixData.sceneKey];
    
    if (scene && scene.entities) {
      delete scene.entities[fixData.entityId];
    }

    await this._configManager.saveConfig('house', houseConfig);
    return { success: true, message: `Entity "${fixData.entityId}" aus Scene entfernt` };
  }

  async _fixClearWeatherEntity(fixData) {
    await this._configManager.saveConfig('weather_entity', null);
    return { success: true, message: 'Wetter-Entity Konfiguration gelöscht' };
  }

  async _fixClearDwdEntity(fixData) {
    const integrations = await this._configManager.getConfig('integrations') || {};
    if (integrations.dwd) {
      delete integrations.dwd.weather_entity;
    }
    
    await this._configManager.saveConfig('integrations', integrations);
    return { success: true, message: 'DWD Wetter-Entity Konfiguration gelöscht' };
  }
}