// custom_components/dashview/lib/config-manager.js

export class ConfigManager {
    constructor() {
      this._hass = null;
    }
  
    /**
     * Receives the hass object from the panel.
     */
    setHass(hass) {
      this._hass = hass;
    }
  
    /**
     * Loads all required configurations from the backend in parallel.
     * @returns {Promise<object>} A promise that resolves to an object containing all configs.
     */
    async loadAll() {
      if (!this._hass) {
        throw new Error('[ConfigManager] HASS object is not set. Cannot load configuration.');
      }
  
      try {
        // Fetch all necessary configurations at the same time for efficiency.
        const [houseConfig, integrationsConfig, weatherEntityResponse] = await Promise.all([
          this._hass.callApi('GET', 'dashview/config?type=house').catch(e => {
            console.error('[ConfigManager] Failed to load house config.', e);
            return {}; // Return empty object on failure to prevent crashing.
          }),
          this._hass.callApi('GET', 'dashview/config?type=integrations').catch(e => {
            console.error('[ConfigManager] Failed to load integrations config.', e);
            return {};
          }),
          this._hass.callApi('GET', 'dashview/config?type=weather_entity').catch(e => {
            console.error('[ConfigManager] Failed to load weather entity.', e);
            return {};
          })
        ]);
  
        console.log('[ConfigManager] All configurations loaded successfully.');
  
        return {
          houseConfig: houseConfig || {},
          integrationsConfig: integrationsConfig || {},
          weatherEntityId: weatherEntityResponse?.weather_entity || 'weather.forecast_home' // Provide a safe default.
        };
  
      } catch (error) {
        console.error('[ConfigManager] A critical error occurred while loading configurations:', error);
        // Return a default/empty config object to prevent the entire panel from failing.
        return {
          houseConfig: {},
          integrationsConfig: {},
          weatherEntityId: 'weather.forecast_home'
        };
      }
    }
  }
