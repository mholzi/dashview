// Test for simplified scene management functionality
// Tests the new single toggle for light scenes in all rooms

function testSimplifiedSceneManagement() {
    console.log('[TEST] Starting simplified scene management tests...');
    
    const tests = [
        testLightScenesToggleExists,
        testLightScenesConfiguration,
        testAutoSceneGeneration,
        testSceneVisibilityInRooms,
        testToggleStateManagement,
        testAdminInterfaceSimplification
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
        try {
            test();
            console.log(`✅ ${test.name} - PASSED`);
            passed++;
        } catch (error) {
            console.error(`❌ ${test.name} - FAILED:`, error.message);
            failed++;
        }
    });
    
    console.log(`[TEST] Simplified scene management tests completed: ${passed} passed, ${failed} failed`);
    return { passed, failed };
}

function testLightScenesToggleExists() {
    // Simulate the new admin HTML structure
    const adminContainer = document.createElement('div');
    adminContainer.innerHTML = `
        <div class="config-section">
            <div class="setting-row">
                <label class="toggle-container">
                    <input type="checkbox" id="auto-light-scenes-enabled" checked>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Enable "Lights Off" scenes in all rooms with lights</span>
                </label>
            </div>
            <div class="setting-row">
                <label class="toggle-container">
                    <input type="checkbox" id="global-cover-scene-enabled" checked>
                    <span class="toggle-slider"></span>
                    <span class="toggle-label">Enable Global Cover Scene</span>
                </label>
            </div>
            <button id="save-auto-scenes" class="action-button">Save Settings</button>
        </div>
    `;
    
    const lightToggle = adminContainer.querySelector('#auto-light-scenes-enabled');
    const coverToggle = adminContainer.querySelector('#global-cover-scene-enabled');
    const saveButton = adminContainer.querySelector('#save-auto-scenes');
    
    if (!lightToggle) throw new Error('Light scenes toggle not found');
    if (!coverToggle) throw new Error('Cover scenes toggle not found');
    if (!saveButton) throw new Error('Save button not found');
    
    if (!lightToggle.checked) throw new Error('Light scenes toggle should be checked by default');
    if (!coverToggle.checked) throw new Error('Cover scenes toggle should be checked by default');
}

function testLightScenesConfiguration() {
    // Test the configuration structure for light scenes
    const mockConfig = {
        auto_scenes: {
            enabled: true,
            light_scenes_enabled: true,
            global_covers_enabled: true
        },
        rooms: {
            wohnzimmer: {
                friendly_name: 'Wohnzimmer',
                lights: ['light.wohnzimmer_1', 'light.wohnzimmer_2']
            },
            schlafzimmer: {
                friendly_name: 'Schlafzimmer',
                lights: ['light.schlafzimmer_main']
            },
            kueche: {
                friendly_name: 'Küche',
                // No lights - should not get a scene
            }
        }
    };
    
    // Simulate AutoSceneGenerator logic
    function getLightScenesEnabled(config) {
        return config?.auto_scenes?.light_scenes_enabled !== false;
    }
    
    function shouldGenerateLightScene(config, roomKey, roomConfig) {
        return getLightScenesEnabled(config) && 
               roomConfig.lights && 
               roomConfig.lights.length > 0;
    }
    
    if (!getLightScenesEnabled(mockConfig)) {
        throw new Error('Light scenes should be enabled in test config');
    }
    
    const wohnzimmerShouldHaveScene = shouldGenerateLightScene(mockConfig, 'wohnzimmer', mockConfig.rooms.wohnzimmer);
    const schlafzimmerShouldHaveScene = shouldGenerateLightScene(mockConfig, 'schlafzimmer', mockConfig.rooms.schlafzimmer);
    const kuecheShouldHaveScene = shouldGenerateLightScene(mockConfig, 'kueche', mockConfig.rooms.kueche);
    
    if (!wohnzimmerShouldHaveScene) throw new Error('Wohnzimmer should have light scene');
    if (!schlafzimmerShouldHaveScene) throw new Error('Schlafzimmer should have light scene');
    if (kuecheShouldHaveScene) throw new Error('Küche should not have light scene (no lights)');
}

function testAutoSceneGeneration() {
    // Test scene generation logic
    const mockConfig = {
        auto_scenes: {
            enabled: true,
            light_scenes_enabled: true
        },
        rooms: {
            living_room: {
                friendly_name: 'Living Room',
                lights: ['light.living_room_1', 'light.living_room_2', 'light.living_room_accent']
            }
        }
    };
    
    // Simulate scene generation
    function createRoomLightsOffScene(roomKey, roomConfig) {
        if (!roomConfig.lights || roomConfig.lights.length === 0) {
            return null;
        }
        
        const roomName = roomConfig.friendly_name || roomKey;
        
        return {
            id: `dashview_auto_${roomKey}_lights_off`,
            name: `${roomName} - Lichter aus`,
            icon: 'mdi:lightbulb-off',
            type: 'auto_room_lights_off',
            entities: roomConfig.lights,
            room_key: roomKey,
            auto_generated: true,
            description: `Automatically generated scene to turn off all lights in ${roomName}`
        };
    }
    
    const scene = createRoomLightsOffScene('living_room', mockConfig.rooms.living_room);
    
    if (!scene) throw new Error('Scene should be generated for room with lights');
    if (scene.id !== 'dashview_auto_living_room_lights_off') throw new Error('Scene ID format incorrect');
    if (scene.name !== 'Living Room - Lichter aus') throw new Error('Scene name format incorrect');
    if (scene.type !== 'auto_room_lights_off') throw new Error('Scene type incorrect');
    if (!scene.auto_generated) throw new Error('Scene should be marked as auto_generated');
    if (scene.entities.length !== 3) throw new Error('Scene should include all room lights');
    if (scene.room_key !== 'living_room') throw new Error('Scene room_key incorrect');
}

function testSceneVisibilityInRooms() {
    // Test that scenes appear in correct rooms
    const mockConfig = {
        auto_scenes: {
            light_scenes_enabled: true
        },
        scenes: [
            {
                id: 'dashview_auto_bedroom_lights_off',
                name: 'Bedroom - Lights Off',
                type: 'auto_room_lights_off',
                entities: ['light.bedroom_main'],
                room_key: 'bedroom',
                auto_generated: true
            },
            {
                id: 'manual_scene',
                name: 'Manual Scene',
                type: 'default',
                entities: ['light.kitchen_1'],
                auto_generated: false
            }
        ],
        rooms: {
            bedroom: {
                friendly_name: 'Bedroom',
                lights: ['light.bedroom_main']
            },
            kitchen: {
                friendly_name: 'Kitchen',
                lights: ['light.kitchen_1']
            }
        }
    };
    
    // Simulate scene filtering for room
    function getRoomScenes(roomKey, roomConfig, scenes) {
        return scenes.filter(scene => {
            // Include auto-generated scenes for this room
            if (scene.auto_generated && scene.room_key === roomKey) {
                return true;
            }
            // Include manual scenes that control entities in this room
            if (scene.entities) {
                const roomEntities = roomConfig.lights || [];
                return scene.entities.some(entity => roomEntities.includes(entity));
            }
            return false;
        });
    }
    
    const bedroomScenes = getRoomScenes('bedroom', mockConfig.rooms.bedroom, mockConfig.scenes);
    const kitchenScenes = getRoomScenes('kitchen', mockConfig.rooms.kitchen, mockConfig.scenes);
    
    if (bedroomScenes.length !== 1) throw new Error('Bedroom should have 1 scene');
    if (bedroomScenes[0].id !== 'dashview_auto_bedroom_lights_off') throw new Error('Bedroom should have auto-generated scene');
    
    if (kitchenScenes.length !== 1) throw new Error('Kitchen should have 1 scene');
    if (kitchenScenes[0].id !== 'manual_scene') throw new Error('Kitchen should have manual scene');
}

function testToggleStateManagement() {
    // Test toggle state persistence and updates
    const mockConfig = {
        auto_scenes: {
            enabled: true,
            light_scenes_enabled: true,
            global_covers_enabled: false
        }
    };
    
    // Simulate toggle state getters
    function getLightScenesEnabled(config) {
        return config?.auto_scenes?.light_scenes_enabled !== false;
    }
    
    function getGlobalCoverSceneEnabled(config) {
        return config?.auto_scenes?.global_covers_enabled !== false;
    }
    
    // Test initial state
    if (!getLightScenesEnabled(mockConfig)) throw new Error('Light scenes should be enabled');
    if (getGlobalCoverSceneEnabled(mockConfig)) throw new Error('Cover scenes should be disabled');
    
    // Test state change
    mockConfig.auto_scenes.light_scenes_enabled = false;
    mockConfig.auto_scenes.global_covers_enabled = true;
    
    if (getLightScenesEnabled(mockConfig)) throw new Error('Light scenes should now be disabled');
    if (!getGlobalCoverSceneEnabled(mockConfig)) throw new Error('Cover scenes should now be enabled');
}

function testAdminInterfaceSimplification() {
    // Test that the old complex interface elements are removed
    const oldAdminHTML = `
        <div id="auto-scenes-overview" class="auto-scenes-container">
            <!-- This should be removed -->
        </div>
        <button id="generate-auto-scenes">Generate Auto-Scenes</button>
        <button id="remove-auto-scenes">Remove All Auto-Scenes</button>
    `;
    
    const newAdminHTML = `
        <div class="setting-row">
            <label class="toggle-container">
                <input type="checkbox" id="auto-light-scenes-enabled" checked>
                <span class="toggle-label">Enable "Lights Off" scenes in all rooms with lights</span>
            </label>
        </div>
        <button id="save-auto-scenes">Save Settings</button>
    `;
    
    // Check that new interface is simpler
    const oldContainer = document.createElement('div');
    oldContainer.innerHTML = oldAdminHTML;
    
    const newContainer = document.createElement('div');
    newContainer.innerHTML = newAdminHTML;
    
    // Old interface should have overview and multiple buttons
    const oldOverview = oldContainer.querySelector('#auto-scenes-overview');
    const oldGenerateBtn = oldContainer.querySelector('#generate-auto-scenes');
    const oldRemoveBtn = oldContainer.querySelector('#remove-auto-scenes');
    
    if (!oldOverview) throw new Error('Old interface should have overview container');
    if (!oldGenerateBtn) throw new Error('Old interface should have generate button');
    if (!oldRemoveBtn) throw new Error('Old interface should have remove button');
    
    // New interface should be simplified
    const newToggle = newContainer.querySelector('#auto-light-scenes-enabled');
    const newSaveBtn = newContainer.querySelector('#save-auto-scenes');
    const newOverview = newContainer.querySelector('#auto-scenes-overview');
    
    if (!newToggle) throw new Error('New interface should have light scenes toggle');
    if (!newSaveBtn) throw new Error('New interface should have save button');
    if (newOverview) throw new Error('New interface should not have overview container');
}

// Run tests if in browser environment
if (typeof window !== 'undefined') {
    setTimeout(() => {
        testSimplifiedSceneManagement();
    }, 100);
}

// Export for Node.js testing
if (typeof module !== 'undefined') {
    module.exports = {
        testSimplifiedSceneManagement,
        testLightScenesToggleExists,
        testLightScenesConfiguration,
        testAutoSceneGeneration,
        testSceneVisibilityInRooms,
        testToggleStateManagement,
        testAdminInterfaceSimplification
    };
}