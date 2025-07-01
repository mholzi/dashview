// custom_components/dashview/www/lib/ui/EntityDetailManager.js

export class EntityDetailManager {
  constructor(panel) {
    this._panel = panel;
    this._hass = panel._hass;
    this._config = panel._houseConfig;
    this._shadowRoot = panel.shadowRoot;
    this._templateCache = new Map();
    this._contentStrategies = new Map();
    this._initializeContentStrategies();
  }

  setHass(hass) {
    this._hass = hass;
  }

  /**
   * Main orchestration method for populating entity detail popup content
   * @param {HTMLElement} popupElement - The popup element
   * @param {string} entityId - The entity ID to show details for
   */
  async populatePopupContent(popupElement, entityId) {
    console.log('[EntityDetailManager] Populating popup content for:', entityId);
    
    try {
      // 1. Entity Analysis Phase
      const entityType = this._detectEntityType(entityId);
      const strategy = this._selectContentStrategy(entityType, entityId);
      const context = this._buildRenderingContext(entityId, entityType);
      
      console.log('[EntityDetailManager] Using strategy:', strategy.constructor.name, 'for type:', entityType);
      
      // 2. Template Loading Phase
      if (strategy.getRequiredTemplates) {
        const templatePaths = strategy.getRequiredTemplates();
        await this._loadRequiredTemplates(templatePaths);
      }
      
      // 3. Content Injection Phase
      const contentContainer = popupElement.querySelector('#entity-popup-content');
      if (contentContainer) {
        await strategy.renderContent(contentContainer, entityId, context);
        
        // 4. Enhancement Phase
        if (strategy.initializeInteractions) {
          strategy.initializeInteractions(contentContainer, entityId);
        }
        this._applyPopupSpecificEnhancements(contentContainer, entityType);
      }
      
    } catch (error) {
      console.error('[EntityDetailManager] Error populating popup:', error);
      await this._handleRenderingError(error, entityId, popupElement);
    }
  }

  /**
   * Intelligent entity type detection
   * @param {string} entityId - The entity ID
   * @returns {string} The detected entity type
   */
  _detectEntityType(entityId) {
    if (!entityId) return 'generic';
    
    // 1. Configuration-based detection
    const configType = this._getEntityTypeFromConfig(entityId);
    if (configType && configType !== entityId.split('.')[0]) {
      return configType;
    }
    
    // 2. Domain-based detection
    const domain = entityId.split('.')[0];
    
    // 3. Label-based detection for binary sensors
    if (domain === 'binary_sensor') {
      const entityState = this._hass.states[entityId];
      if (entityState?.attributes?.device_class) {
        const deviceClass = entityState.attributes.device_class.toLowerCase();
        const labelMapping = {
          'motion': this._panel._entityLabels.MOTION,
          'door': 'door',
          'window': this._panel._entityLabels.WINDOW,
          'smoke': this._panel._entityLabels.SMOKE,
          'vibration': this._panel._entityLabels.VIBRATION
        };
        if (labelMapping[deviceClass]) {
          return labelMapping[deviceClass];
        }
      }
      
      // Fallback to name analysis for binary sensors
      const friendlyName = entityState?.attributes?.friendly_name?.toLowerCase() || '';
      if (friendlyName.includes('motion') || friendlyName.includes('bewegung')) {
        return this._panel._entityLabels.MOTION;
      }
      if (friendlyName.includes('fenster') || friendlyName.includes('window')) {
        return this._panel._entityLabels.WINDOW;
      }
      if (friendlyName.includes('rauch') || friendlyName.includes('smoke')) {
        return this._panel._entityLabels.SMOKE;
      }
    }
    
    // 4. Sensor type detection
    if (domain === 'sensor') {
      const entityState = this._hass.states[entityId];
      const unitOfMeasurement = entityState?.attributes?.unit_of_measurement;
      
      if (unitOfMeasurement === '°C' || unitOfMeasurement === '°F') {
        return this._panel._entityLabels.TEMPERATUR;
      }
      if (unitOfMeasurement === '%' && entityState?.attributes?.device_class === 'humidity') {
        return this._panel._entityLabels.HUMIDITY;
      }
    }
    
    // 5. Return domain as fallback
    return domain;
  }

  /**
   * Get entity type from house configuration
   * @param {string} entityId - The entity ID
   * @returns {string} The entity type from config or domain fallback
   */
  _getEntityTypeFromConfig(entityId) {
    if (!this._config?.rooms) return null;
    
    for (const room of Object.values(this._config.rooms)) {
      // Check header entities
      const headerEntity = room.header_entities?.find(e => e.entity === entityId);
      if (headerEntity) return headerEntity.entity_type;
      
      // Check other entity lists
      if (room.lights?.includes(entityId)) return 'light';
      if (room.covers?.includes(entityId)) return 'cover';
      if (room.media_players?.some(mp => mp.entity === entityId)) return 'media_player';
    }
    
    return entityId.split('.')[0]; // fallback to domain
  }

  /**
   * Select the best content strategy for the entity
   * @param {string} entityType - The detected entity type
   * @param {string} entityId - The entity ID
   * @returns {Object} The content strategy instance
   */
  _selectContentStrategy(entityType, entityId) {
    // Priority order for strategy selection
    const strategyPriority = [
      entityType, // Exact type match
      entityId.split('.')[0], // Domain match
      'generic' // Fallback
    ];
    
    for (const type of strategyPriority) {
      if (this._contentStrategies.has(type)) {
        const strategy = this._contentStrategies.get(type);
        if (strategy.canHandle(entityType, entityId)) {
          return strategy;
        }
      }
    }
    
    // Ultimate fallback
    return this._contentStrategies.get('generic');
  }

  /**
   * Build rendering context for the entity
   * @param {string} entityId - The entity ID
   * @param {string} entityType - The detected entity type
   * @returns {Object} Rendering context
   */
  _buildRenderingContext(entityId, entityType) {
    const entityState = this._hass.states[entityId];
    const displayData = this._getEntityDisplayData(entityId, entityType);
    
    return {
      entityId,
      entityType,
      entityState,
      displayData,
      hass: this._hass,
      config: this._config,
      panel: this._panel
    };
  }

  /**
   * Get entity display data (extracted from FloorManager logic)
   * @param {string} entityId - The entity ID
   * @param {string} type - The entity type
   * @returns {Object} Display data {name, label, icon, cardClass}
   */
  _getEntityDisplayData(entityId, type) {
    const entityState = this._hass.states[entityId];
    
    let name = entityState?.attributes.friendly_name || entityId;
    let label = entityState?.state || 'N/A';
    let icon = 'mdi:help-circle';
    let cardClass = '';

    if (!entityState || entityState.state === 'unavailable') {
      return {
        name,
        label: 'Unavailable',
        icon,
        cardClass: 'is-unavailable'
      };
    }

    // Type-specific display data
    const typeDisplayData = this._getTypeSpecificDisplayData(entityState, type);
    if (typeDisplayData) {
      ({ name, label, icon, cardClass } = typeDisplayData);
    }

    // Apply global state classes
    if (entityState.state === 'on' || 
        entityState.state === 'Run' || 
        entityState.state === 'playing' || 
        (type === 'cover' && entityState.state === 'open')) {
      cardClass = cardClass ? `${cardClass} is-on` : 'is-on';
    }

    return { name, label, icon, cardClass };
  }

  /**
   * Get type-specific display data
   * @param {Object} entityState - The entity state
   * @param {string} type - The entity type
   * @returns {Object|null} Type-specific display data
   */
  _getTypeSpecificDisplayData(entityState, type) {
    const { TEMPERATUR, HUMIDITY, LIGHT, MOTION, WINDOW, COVER, SMOKE, VIBRATION } = this._panel._entityLabels;
    
    switch (type) {
      case TEMPERATUR:
        const tempValue = parseFloat(entityState.state);
        return {
          name: 'Temperatur',
          label: isNaN(tempValue) ? '--°' : `${tempValue.toFixed(1)}°`,
          icon: 'mdi:thermometer',
          cardClass: ''
        };
        
      case HUMIDITY:
        const humValue = parseFloat(entityState.state);
        return {
          name: 'Luftfeuchtigkeit',
          label: isNaN(humValue) ? '--%' : `${Math.round(humValue)}%`,
          icon: 'mdi:water-percent',
          cardClass: ''
        };
        
      case LIGHT:
        const isOn = entityState.state === 'on';
        const brightness = entityState.attributes?.brightness;
        return {
          name: entityState.attributes.friendly_name || 'Light',
          label: isOn ? (brightness ? `${Math.round(brightness / 2.55)}%` : 'An') : 'Aus',
          icon: isOn ? (entityState.attributes.icon || 'mdi:lightbulb') : 'mdi:lightbulb-outline',
          cardClass: isOn ? 'active-light' : ''
        };
        
      case MOTION:
        return {
          name: entityState.attributes.friendly_name || 'Motion Sensor',
          label: entityState.state === 'on' ? 'Erkannt' : 'Klar',
          icon: entityState.state === 'on' ? 'mdi:motion-sensor' : 'mdi:motion-sensor-off',
          cardClass: ''
        };
        
      case WINDOW:
        return {
          name: entityState.attributes.friendly_name || 'Window',
          label: entityState.state === 'on' ? 'Offen' : 'Geschlossen',
          icon: entityState.state === 'on' ? 'mdi:window-open-variant' : 'mdi:window-closed',
          cardClass: ''
        };
        
      case COVER:
        const position = entityState.attributes?.current_position || 0;
        const isOpen = position > 20;
        return {
          name: entityState.attributes.friendly_name || 'Cover',
          label: isOpen ? `Offen - ${position}%` : `Geschlossen - ${position}%`,
          icon: isOpen ? 'mdi:window-shutter-open' : 'mdi:window-shutter',
          cardClass: ''
        };
        
      case 'media_player':
        const state = entityState.state;
        let mediaLabel;
        if (state === 'playing') {
          mediaLabel = 'Playing';
        } else if (['idle', 'standby', 'off'].includes(state)) {
          mediaLabel = 'Aus';
        } else {
          mediaLabel = state ? state.charAt(0).toUpperCase() + state.slice(1) : 'N/A';
        }
        return {
          name: entityState.attributes.friendly_name || 'Media Player',
          label: mediaLabel,
          icon: 'mdi:music',
          cardClass: ''
        };
        
      default:
        return null;
    }
  }

  /**
   * Load required templates for strategies
   * @param {Array} templatePaths - Array of template paths
   */
  async _loadRequiredTemplates(templatePaths) {
    const loadPromises = templatePaths.map(path => this._loadTemplate(path));
    await Promise.all(loadPromises);
  }

  /**
   * Load template with caching
   * @param {string} templatePath - Path to template
   * @returns {Promise<string|null>} Template content or null
   */
  async _loadTemplate(templatePath) {
    if (this._templateCache.has(templatePath)) {
      return this._templateCache.get(templatePath);
    }
    
    try {
      const response = await fetch(templatePath);
      if (response.ok) {
        const content = await response.text();
        this._templateCache.set(templatePath, content);
        return content;
      }
    } catch (error) {
      console.error('[EntityDetailManager] Failed to load template:', templatePath, error);
    }
    
    return null;
  }

  /**
   * Apply popup-specific enhancements
   * @param {HTMLElement} container - The content container
   * @param {string} entityType - The entity type
   */
  _applyPopupSpecificEnhancements(container, entityType) {
    // Add entity-type specific CSS classes for styling
    container.classList.add(`entity-detail-${entityType}`);
    
    // Ensure proper component initialization
    if (this._panel._componentInitializers) {
      for (const [selector, initializer] of Object.entries(this._panel._componentInitializers)) {
        container.querySelectorAll(selector).forEach(element => {
          try {
            if (!element.dataset.initialized) {
              initializer(element);
              element.dataset.initialized = 'true';
            }
          } catch (error) {
            console.error('[EntityDetailManager] Error initializing component:', error);
          }
        });
      }
    }
  }

  /**
   * Handle rendering errors with fallback
   * @param {Error} error - The error that occurred
   * @param {string} entityId - The entity ID
   * @param {HTMLElement} popupElement - The popup element
   */
  async _handleRenderingError(error, entityId, popupElement) {
    console.warn('[EntityDetailManager] Rendering failed for', entityId, ':', error);
    
    const contentContainer = popupElement.querySelector('#entity-popup-content');
    if (contentContainer) {
      // Try generic strategy as fallback
      const genericStrategy = this._contentStrategies.get('generic');
      if (genericStrategy) {
        try {
          const context = this._buildRenderingContext(entityId, 'generic');
          await genericStrategy.renderContent(contentContainer, entityId, context);
        } catch (fallbackError) {
          // Ultimate fallback - show error message
          contentContainer.innerHTML = `
            <div class="entity-detail-error">
              <i class="mdi mdi-alert-circle"></i>
              <h4>Unable to load entity details</h4>
              <p>Entity ID: ${entityId}</p>
              <p>Error: ${error.message}</p>
            </div>
          `;
        }
      }
    }
  }

  /**
   * Initialize content strategies
   */
  _initializeContentStrategies() {
    // Generic strategy (fallback)
    this._contentStrategies.set('generic', new GenericContentStrategy(this));
    
    // Domain-based strategies
    this._contentStrategies.set('light', new LightControlStrategy(this));
    this._contentStrategies.set('cover', new CoverControlStrategy(this));
    this._contentStrategies.set('media_player', new MediaPlayerControlStrategy(this));
    this._contentStrategies.set('climate', new ClimateControlStrategy(this));
    this._contentStrategies.set('weather', new WeatherDisplayStrategy(this));
    
    // Sensor strategies
    this._contentStrategies.set(this._panel._entityLabels.MOTION, new SensorDisplayStrategy(this));
    this._contentStrategies.set(this._panel._entityLabels.WINDOW, new SensorDisplayStrategy(this));
    this._contentStrategies.set(this._panel._entityLabels.TEMPERATUR, new ThermostatDisplayStrategy(this));
    this._contentStrategies.set(this._panel._entityLabels.HUMIDITY, new ThermostatDisplayStrategy(this));
  }
}

/**
 * Base class for content strategies
 */
class ContentStrategy {
  constructor(manager) {
    this._manager = manager;
    this._panel = manager._panel;
    this._hass = manager._hass;
  }

  canHandle(entityType, entityId) {
    return true; // Override in subclasses
  }

  getRequiredTemplates() {
    return []; // Override in subclasses if templates needed
  }

  async renderContent(container, entityId, context) {
    throw new Error('renderContent must be implemented by subclass');
  }

  initializeInteractions(container, entityId) {
    // Optional - override in subclasses
  }

  cleanup(container) {
    // Optional - override in subclasses
  }
}

/**
 * Generic content strategy - displays basic entity information
 */
class GenericContentStrategy extends ContentStrategy {
  canHandle(entityType, entityId) {
    return true; // Can handle any entity as fallback
  }

  async renderContent(container, entityId, context) {
    const { entityState, displayData } = context;
    
    let html = '<div class="entity-detail-generic">';
    
    // Current state section
    html += '<div class="entity-detail-state">';
    html += `<span class="entity-detail-state-label">Current State:</span>`;
    html += `<span class="entity-detail-state-value">${displayData.label}</span>`;
    html += '</div>';
    
    // Attributes section
    html += '<div class="entity-detail-attributes">';
    html += '<h4>Attributes</h4>';
    
    const attributes = entityState.attributes || {};
    const excludeAttrs = ['friendly_name', 'icon'];
    
    for (const [key, value] of Object.entries(attributes)) {
      if (!excludeAttrs.includes(key)) {
        const displayKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        html += `<div class="entity-detail-attribute">`;
        html += `<span class="entity-detail-attribute-key">${displayKey}:</span>`;
        html += `<span class="entity-detail-attribute-value">${this._formatAttributeValue(value)}</span>`;
        html += `</div>`;
      }
    }
    
    html += '</div>';
    
    // Entity info section
    html += '<div class="entity-detail-info">';
    html += '<h4>Entity Information</h4>';
    html += `<div class="entity-detail-attribute">`;
    html += `<span class="entity-detail-attribute-key">Entity ID:</span>`;
    html += `<span class="entity-detail-attribute-value">${entityId}</span>`;
    html += `</div>`;
    html += `<div class="entity-detail-attribute">`;
    html += `<span class="entity-detail-attribute-key">Domain:</span>`;
    html += `<span class="entity-detail-attribute-value">${entityId.split('.')[0]}</span>`;
    html += `</div>`;
    if (entityState.last_changed) {
      html += `<div class="entity-detail-attribute">`;
      html += `<span class="entity-detail-attribute-key">Last Changed:</span>`;
      html += `<span class="entity-detail-attribute-value">${new Date(entityState.last_changed).toLocaleString()}</span>`;
      html += `</div>`;
    }
    html += '</div>';
    
    html += '</div>';
    
    container.innerHTML = html;
  }

  _formatAttributeValue(value) {
    if (value === null || value === undefined) return 'N/A';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value, null, 2);
    return String(value);
  }
}

/**
 * Light control strategy - reuses existing light card logic
 */
class LightControlStrategy extends ContentStrategy {
  canHandle(entityType, entityId) {
    return entityId.startsWith('light.') || entityType === 'light';
  }

  getRequiredTemplates() {
    return ['/local/dashview/templates/room-lights-card.html'];
  }

  async renderContent(container, entityId, context) {
    // Load the lights card template
    const template = await this._manager._loadTemplate('/local/dashview/templates/room-lights-card.html');
    if (!template) {
      throw new Error('Failed to load light control template');
    }
    
    container.innerHTML = template;
    
    // Adapt for single entity
    const lightsList = container.querySelector('.lights-list');
    if (lightsList) {
      // Clear existing content and add single light
      lightsList.innerHTML = '';
      
      const lightRowTemplate = container.querySelector('#light-row-template');
      if (lightRowTemplate) {
        const row = lightRowTemplate.content.cloneNode(true).querySelector('.light-control-row');
        row.dataset.entityId = entityId;
        
        // Update row with entity data
        const { displayData, entityState } = context;
        row.querySelector('.light-name').textContent = displayData.name;
        row.querySelector('.light-icon').className = `light-icon mdi ${this._panel._processIconName(displayData.icon)}`;
        
        // Update toggle state
        const toggle = row.querySelector('.light-toggle');
        toggle.checked = entityState.state === 'on';
        
        // Update brightness slider if applicable
        const slider = row.querySelector('.light-brightness-slider');
        if (slider && entityState.attributes?.brightness !== undefined) {
          slider.value = Math.round(entityState.attributes.brightness / 2.55);
          slider.style.display = 'block';
        } else if (slider) {
          slider.style.display = 'none';
        }
        
        lightsList.appendChild(row);
      }
    }
  }

  initializeInteractions(container, entityId) {
    // Reuse existing lights card initialization logic
    if (this._panel._lightsManager) {
      this._panel._lightsManager.initializeForPopup(container, entityId);
    }
  }
}

/**
 * Cover control strategy - reuses existing cover card logic  
 */
class CoverControlStrategy extends ContentStrategy {
  canHandle(entityType, entityId) {
    return entityId.startsWith('cover.') || entityType === 'cover';
  }

  getRequiredTemplates() {
    return ['/local/dashview/templates/room-covers-card.html'];
  }

  async renderContent(container, entityId, context) {
    const template = await this._manager._loadTemplate('/local/dashview/templates/room-covers-card.html');
    if (!template) {
      throw new Error('Failed to load cover control template');
    }
    
    container.innerHTML = template;
    
    // Adapt for single entity - similar to light strategy
    const coversList = container.querySelector('.covers-list');
    if (coversList) {
      coversList.innerHTML = '';
      
      const coverRowTemplate = container.querySelector('#cover-row-template');
      if (coverRowTemplate) {
        const row = coverRowTemplate.content.cloneNode(true).querySelector('.cover-control-row');
        row.dataset.entityId = entityId;
        
        const { displayData, entityState } = context;
        row.querySelector('.cover-name').textContent = displayData.name;
        
        // Update position if available
        const positionSlider = row.querySelector('.cover-position-slider');
        if (positionSlider && entityState.attributes?.current_position !== undefined) {
          positionSlider.value = entityState.attributes.current_position;
        }
        
        coversList.appendChild(row);
      }
    }
  }

  initializeInteractions(container, entityId) {
    if (this._panel._coversManager) {
      this._panel._coversManager.initializeForPopup(container, entityId);
    }
  }
}

/**
 * Media player control strategy
 */
class MediaPlayerControlStrategy extends ContentStrategy {
  canHandle(entityType, entityId) {
    return entityId.startsWith('media_player.') || entityType === 'media_player';
  }

  getRequiredTemplates() {
    return ['/local/dashview/templates/room-media-player-card.html'];
  }

  async renderContent(container, entityId, context) {
    const template = await this._manager._loadTemplate('/local/dashview/templates/room-media-player-card.html');
    if (!template) {
      throw new Error('Failed to load media player template');
    }
    
    container.innerHTML = template;
    // Similar single-entity adaptation logic...
  }

  initializeInteractions(container, entityId) {
    if (this._panel._mediaPlayerManager) {
      this._panel._mediaPlayerManager.initializeForPopup(container, entityId);
    }
  }
}

/**
 * Climate control strategy
 */
class ClimateControlStrategy extends ContentStrategy {
  canHandle(entityType, entityId) {
    return entityId.startsWith('climate.') || entityType === 'climate';
  }

  async renderContent(container, entityId, context) {
    // Custom climate control interface
    const { displayData, entityState } = context;
    
    let html = '<div class="entity-detail-climate">';
    html += `<div class="climate-current-temp">${entityState.attributes?.current_temperature || '--'}°</div>`;
    html += `<div class="climate-target-temp">${entityState.attributes?.temperature || '--'}°</div>`;
    html += `<div class="climate-mode">${entityState.state}</div>`;
    html += '</div>';
    
    container.innerHTML = html;
  }
}

/**
 * Weather display strategy
 */
class WeatherDisplayStrategy extends ContentStrategy {
  canHandle(entityType, entityId) {
    return entityId.startsWith('weather.') || entityType === 'weather';
  }

  async renderContent(container, entityId, context) {
    if (this._panel._weatherManager) {
      // Reuse weather manager for entity-specific weather data
      await this._panel._weatherManager.renderEntityWeather(container, entityId);
    }
  }
}

/**
 * Sensor display strategy with historical data support
 */
class SensorDisplayStrategy extends ContentStrategy {
  canHandle(entityType, entityId) {
    const sensorTypes = [
      this._panel._entityLabels.MOTION,
      this._panel._entityLabels.WINDOW,
      this._panel._entityLabels.SMOKE,
      this._panel._entityLabels.VIBRATION
    ];
    return sensorTypes.includes(entityType) || entityId.startsWith('binary_sensor.') || entityId.startsWith('sensor.');
  }

  async renderContent(container, entityId, context) {
    const { displayData, entityState } = context;
    
    let html = '<div class="entity-detail-sensor">';
    
    // Large state display
    html += '<div class="sensor-state-large">';
    html += `<i class="mdi ${this._panel._processIconName(displayData.icon)}"></i>`;
    html += `<span class="sensor-state-text">${displayData.label}</span>`;
    html += '</div>';
    
    // Historical data section
    html += '<div class="sensor-history">';
    html += '<h4>Historical Data</h4>';
    
    // Check if entity supports historical data
    if (this._panel._historicalDataManager?.supportsHistoricalData(entityId)) {
      html += '<div class="historical-chart-container">';
      html += '<div class="chart-loading">Loading historical data...</div>';
      html += '</div>';
    } else {
      html += '<div class="no-historical-data">';
      html += '<p>Historical data not available for this sensor type.</p>';
      html += '</div>';
    }
    
    html += '</div>';
    html += '</div>';
    
    container.innerHTML = html;
    
    // Load historical data for supported entities
    if (this._panel._historicalDataManager?.supportsHistoricalData(entityId)) {
      this._loadHistoricalChart(container, entityId);
    }
  }

  async _loadHistoricalChart(container, entityId) {
    const chartContainer = container.querySelector('.historical-chart-container');
    const loadingElement = chartContainer.querySelector('.chart-loading');
    
    try {
      console.log(`[SensorDisplayStrategy] Loading historical chart for ${entityId}`);
      
      // Fetch historical data
      const historicalData = await this._panel._historicalDataManager.fetchHistoricalData(entityId, 24);
      
      if (historicalData && historicalData.length > 0) {
        // Remove loading indicator
        if (loadingElement) {
          loadingElement.remove();
        }
        
        // Create chart
        await this._panel._historicalDataManager.createChart(chartContainer, entityId, historicalData);
      } else {
        // Show no data message
        chartContainer.innerHTML = '<div class="no-historical-data"><p>No historical data available for the last 24 hours.</p></div>';
      }
      
    } catch (error) {
      console.error(`[SensorDisplayStrategy] Error loading historical chart for ${entityId}:`, error);
      chartContainer.innerHTML = '<div class="chart-error"><p>Error loading historical data.</p></div>';
    }
  }
}

/**
 * Thermostat display strategy
 */
class ThermostatDisplayStrategy extends ContentStrategy {
  canHandle(entityType, entityId) {
    const thermostatTypes = [this._panel._entityLabels.TEMPERATUR, this._panel._entityLabels.HUMIDITY];
    return thermostatTypes.includes(entityType);
  }

  getRequiredTemplates() {
    return ['/local/dashview/templates/room-thermostat-card.html'];
  }

  async renderContent(container, entityId, context) {
    const template = await this._manager._loadTemplate('/local/dashview/templates/room-thermostat-card.html');
    if (template) {
      container.innerHTML = template;
      
      // Initialize thermostat display for single entity
      if (this._panel._thermostatManager) {
        await this._panel._thermostatManager.renderEntityThermostat(container, entityId);
      }
    }
  }
}