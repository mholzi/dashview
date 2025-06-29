// custom_components/dashview/www/lib/ui/AutoSceneGenerator.js

export class AutoSceneGenerator {
    constructor(panel) {
        this._panel = panel;
        this._hass = panel._hass;
        this._config = panel._houseConfig;
        this._shadowRoot = panel.shadowRoot;
    }

    setHass(hass) {
        this._hass = hass;
    }

    /**
     * Generate auto-scenes for all rooms with light entities
     * @param {boolean} enabled - Whether auto-scene generation is enabled
     * @returns {Array} Array of generated scenes
     */
    generateAutoScenes(enabled = true) {
        if (!enabled || !this._config?.rooms) return [];

        const autoScenes = [];
        
        Object.entries(this._config.rooms).forEach(([roomKey, roomConfig]) => {
            // Generate lights off scenes for rooms with lights
            if (roomConfig.lights && roomConfig.lights.length > 0) {
                const lightScene = this._createRoomLightsOffScene(roomKey, roomConfig);
                if (lightScene) {
                    autoScenes.push(lightScene);
                }
            }
            
            // Generate cover scenes for rooms with covers
            if (roomConfig.covers && roomConfig.covers.length > 0) {
                const coverScene = this._createRoomCoversScene(roomKey, roomConfig);
                if (coverScene) {
                    autoScenes.push(coverScene);
                }
            }
        });

        // Generate global cover scene if enabled and covers exist
        if (this._getGlobalCoverSceneEnabled()) {
            const globalCoverScene = this._createGlobalCoverScene();
            if (globalCoverScene) {
                autoScenes.push(globalCoverScene);
            }
        }

        return autoScenes;
    }

    /**
     * Create an "All Lights Off" scene for a specific room
     * @param {string} roomKey - The room identifier
     * @param {Object} roomConfig - The room configuration
     * @returns {Object|null} Generated scene object or null
     */
    _createRoomLightsOffScene(roomKey, roomConfig) {
        if (!roomConfig.lights || roomConfig.lights.length === 0) {
            return null;
        }

        // Filter out any invalid entities
        const validLightEntities = roomConfig.lights.filter(entityId => {
            return this._hass?.states?.[entityId] !== undefined;
        });

        if (validLightEntities.length === 0) {
            return null;
        }

        const roomName = roomConfig.friendly_name || roomKey;
        
        return {
            id: `dashview_auto_${roomKey}_lights_off`,
            name: `${roomName} - Lichter aus`,
            icon: 'mdi:lightbulb-off',
            type: 'auto_room_lights_off',
            entities: validLightEntities,
            room_key: roomKey,
            auto_generated: true,
            description: `Automatically generated scene to turn off all lights in ${roomName}`
        };
    }

    /**
     * Create a cover scene for a specific room
     * @param {string} roomKey - The room identifier
     * @param {Object} roomConfig - The room configuration
     * @returns {Object|null} Generated scene object or null
     */
    _createRoomCoversScene(roomKey, roomConfig) {
        if (!roomConfig.covers || roomConfig.covers.length === 0) {
            return null;
        }

        // Filter out any invalid entities
        const validCoverEntities = roomConfig.covers.filter(entityId => {
            return this._hass?.states?.[entityId] !== undefined;
        });

        if (validCoverEntities.length === 0) {
            return null;
        }

        const roomName = roomConfig.friendly_name || roomKey;
        
        return {
            id: `dashview_auto_${roomKey}_covers`,
            name: `${roomName} - Rollos`,
            icon: 'mdi:window-shutter',
            type: 'auto_room_covers',
            entities: validCoverEntities,
            room_key: roomKey,
            auto_generated: true,
            description: `Automatically generated scene to control all covers in ${roomName}`
        };
    }

    /**
     * Create a global cover scene for all covers in the house
     * @returns {Object|null} Generated scene object or null
     */
    _createGlobalCoverScene() {
        if (!this._config?.rooms) return null;

        // Collect all cover entities from all rooms
        const allCoverEntities = [];
        Object.values(this._config.rooms).forEach(roomConfig => {
            if (roomConfig.covers && roomConfig.covers.length > 0) {
                allCoverEntities.push(...roomConfig.covers);
            }
        });

        if (allCoverEntities.length === 0) return null;

        // Filter out any invalid entities
        const validCoverEntities = allCoverEntities.filter(entityId => {
            return this._hass?.states?.[entityId] !== undefined;
        });

        if (validCoverEntities.length === 0) return null;

        return {
            id: 'dashview_auto_global_covers',
            name: 'Alle Rollos',
            icon: 'mdi:window-shutter',
            type: 'auto_global_covers',
            entities: validCoverEntities,
            auto_generated: true,
            description: 'Automatically generated scene to control all covers in the house'
        };
    }

    /**
     * Get the global cover scene enabled status from configuration
     * @returns {boolean}
     */
    _getGlobalCoverSceneEnabled() {
        return this._config?.auto_scenes?.global_covers_enabled !== false; // Default to true
    }

    /**
     * Set the global cover scene enabled status
     * @param {boolean} enabled - Whether to enable global cover scene
     * @returns {Promise<boolean>} Success status
     */
    async setGlobalCoverSceneEnabled(enabled) {
        try {
            if (!this._config.auto_scenes) {
                this._config.auto_scenes = {};
            }
            
            this._config.auto_scenes.global_covers_enabled = enabled;
            
            // Update scenes based on enabled status
            await this.updateConfiguration(this._getAutoSceneEnabled());
            
            return true;
        } catch (error) {
            console.error('[AutoSceneGenerator] Error setting global cover scene enabled status:', error);
            return false;
        }
    }

    /**
     * Check if a scene is auto-generated
     * @param {Object} scene - Scene object
     * @returns {boolean}
     */
    isAutoGenerated(scene) {
        return scene.auto_generated === true || 
               scene.type === 'auto_room_lights_off' ||
               scene.type === 'auto_room_covers' ||
               scene.type === 'auto_global_covers' ||
               (scene.id && scene.id.startsWith('dashview_auto_'));
    }

    /**
     * Get all auto-generated scenes from current configuration
     * @returns {Array} Array of auto-generated scenes
     */
    getExistingAutoScenes() {
        if (!this._config?.scenes) return [];
        
        return this._config.scenes.filter(scene => this.isAutoGenerated(scene));
    }

    /**
     * Remove auto-generated scenes for a specific room
     * @param {string} roomKey - The room identifier
     * @returns {Array} Updated scenes array
     */
    removeRoomAutoScenes(roomKey) {
        if (!this._config?.scenes) return [];
        
        return this._config.scenes.filter(scene => {
            if (!this.isAutoGenerated(scene)) return true;
            if (scene.room_key === roomKey) return false;
            if (scene.id === `dashview_auto_${roomKey}_lights_off`) return false;
            return true;
        });
    }

    /**
     * Merge auto-generated scenes with existing manual scenes
     * @param {Array} autoScenes - Array of auto-generated scenes
     * @returns {Array} Combined scenes array
     */
    mergeWithExistingScenes(autoScenes) {
        if (!this._config?.scenes) {
            this._config.scenes = [];
        }

        // Remove existing auto-generated scenes
        const manualScenes = this._config.scenes.filter(scene => !this.isAutoGenerated(scene));
        
        // Combine manual scenes with new auto-generated scenes
        return [...manualScenes, ...autoScenes];
    }

    /**
     * Update the configuration with new auto-generated scenes
     * @param {boolean} enabled - Whether auto-scene generation is enabled
     * @returns {Promise<boolean>} Success status
     */
    async updateConfiguration(enabled = true) {
        try {
            const autoScenes = this.generateAutoScenes(enabled);
            const updatedScenes = this.mergeWithExistingScenes(autoScenes);
            
            // Update local configuration
            this._config.scenes = updatedScenes;
            
            // Save to backend
            const response = await fetch('/api/dashview/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'house',
                    config: this._config
                })
            });

            if (!response.ok) {
                console.error('[AutoSceneGenerator] Failed to save configuration:', response.statusText);
                return false;
            }

            console.log(`[AutoSceneGenerator] Successfully updated configuration with ${autoScenes.length} auto-generated scenes`);
            return true;
        } catch (error) {
            console.error('[AutoSceneGenerator] Error updating configuration:', error);
            return false;
        }
    }

    /**
     * Get auto-scene status for all rooms
     * @returns {Object} Status object with room auto-scene information
     */
    getAutoSceneStatus() {
        const status = {
            enabled: this._getAutoSceneEnabled(),
            rooms: {}
        };

        if (!this._config?.rooms) return status;

        Object.entries(this._config.rooms).forEach(([roomKey, roomConfig]) => {
            const hasLights = roomConfig.lights && roomConfig.lights.length > 0;
            const autoScene = this._config.scenes?.find(scene => 
                scene.room_key === roomKey && this.isAutoGenerated(scene)
            );

            status.rooms[roomKey] = {
                friendly_name: roomConfig.friendly_name || roomKey,
                has_lights: hasLights,
                light_count: roomConfig.lights?.length || 0,
                auto_scene_exists: !!autoScene,
                auto_scene_id: autoScene?.id || null,
                valid_entities: hasLights ? roomConfig.lights.filter(entityId => 
                    this._hass?.states?.[entityId] !== undefined
                ).length : 0
            };
        });

        return status;
    }

    /**
     * Get the current auto-scene enabled status from configuration
     * @returns {boolean}
     */
    _getAutoSceneEnabled() {
        return this._config?.auto_scenes?.enabled !== false; // Default to true
    }

    /**
     * Set the auto-scene enabled status
     * @param {boolean} enabled - Whether to enable auto-scenes
     * @returns {Promise<boolean>} Success status
     */
    async setAutoSceneEnabled(enabled) {
        try {
            if (!this._config.auto_scenes) {
                this._config.auto_scenes = {};
            }
            
            this._config.auto_scenes.enabled = enabled;
            
            // Update scenes based on enabled status
            await this.updateConfiguration(enabled);
            
            return true;
        } catch (error) {
            console.error('[AutoSceneGenerator] Error setting auto-scene enabled status:', error);
            return false;
        }
    }

    /**
     * Execute a room's auto-generated lights off scene
     * @param {string} roomKey - The room identifier
     * @returns {Promise<boolean>} Success status
     */
    async executeRoomLightsOff(roomKey) {
        const roomConfig = this._config?.rooms?.[roomKey];
        if (!roomConfig?.lights || roomConfig.lights.length === 0) {
            console.warn(`[AutoSceneGenerator] No lights found for room: ${roomKey}`);
            return false;
        }

        try {
            // Turn off all lights in the room
            await this._hass.callService('light', 'turn_off', {
                entity_id: roomConfig.lights
            });

            console.log(`[AutoSceneGenerator] Turned off lights in room: ${roomKey}`);
            return true;
        } catch (error) {
            console.error(`[AutoSceneGenerator] Error turning off lights in room ${roomKey}:`, error);
            return false;
        }
    }
}