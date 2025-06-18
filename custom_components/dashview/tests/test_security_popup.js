// Test for security popup functionality
class SecurityPopupTests {
    constructor() {
        this.testResults = [];
    }

    assert(condition, message) {
        if (condition) {
            console.log(`  ✓ ${message}`);
            this.testResults.push({ test: message, passed: true });
        } else {
            console.error(`  ✗ ${message}`);
            this.testResults.push({ test: message, passed: false });
        }
    }

    // Test entity type filtering
    testEntityTypeFiltering() {
        console.log('\n[DashView] Testing entity type filtering...');
        
        const panel = new MockDashViewPanel();
        
        // Test window entities
        const windowEntities = panel._getAllEntitiesByType('window');
        this.assert(
            windowEntities.includes('binary_sensor.fenster_terrasse'),
            'Should find window entities from house config'
        );
        this.assert(
            windowEntities.length === 1,
            'Should find exactly one window entity in mock config'
        );

        // Test motion entities  
        const motionEntities = panel._getAllEntitiesByType('motion');
        this.assert(
            motionEntities.includes('binary_sensor.motion_buro_presence_sensor_1'),
            'Should find motion entities from house config'
        );
        this.assert(
            motionEntities.length === 1,
            'Should find exactly one motion entity in mock config'
        );

        // Test non-existent entity type
        const nonExistentEntities = panel._getAllEntitiesByType('nonexistent');
        this.assert(
            nonExistentEntities.length === 0,
            'Should return empty array for non-existent entity type'
        );
    }

    // Test entity list rendering
    testEntityListRendering() {
        console.log('\n[DashView] Testing entity list rendering...');
        
        const panel = new MockDashViewPanel();
        panel.hass = this.createMockHass();
        
        // Create mock container
        const container = document.createElement('div');
        
        // Test rendering entities
        const entities = ['binary_sensor.fenster_terrasse'];
        panel._renderEntityList(container, entities);
        
        this.assert(
            container.children.length === 1,
            'Should render one entity item'
        );
        this.assert(
            container.querySelector('.entity-list-item') !== null,
            'Should create entity list item with correct class'
        );
        this.assert(
            container.querySelector('.entity-list-item').textContent === 'Terrasse Window',
            'Should use friendly name from HASS state'
        );

        // Test empty list
        const emptyContainer = document.createElement('div');
        panel._renderEntityList(emptyContainer, [], 'No entities found');
        
        this.assert(
            emptyContainer.querySelector('.entity-list-none') !== null,
            'Should show none message for empty list'
        );
        this.assert(
            emptyContainer.querySelector('.entity-list-none').textContent === 'No entities found',
            'Should show custom none message'
        );
    }

    // Test security list update
    testSecurityListUpdate() {
        console.log('\n[DashView] Testing security list update...');
        
        const panel = new MockDashViewPanel();
        panel.hass = this.createMockHass();
        
        // Create mock popup with security containers
        const popup = document.createElement('div');
        popup.innerHTML = `
            <div id="open-windows-list" class="entity-list"></div>
            <div id="closed-windows-list" class="entity-list"></div>
            <div id="active-motion-list" class="entity-list"></div>
            <div id="inactive-motion-list" class="entity-list"></div>
        `;
        
        // Update security lists
        panel.updateSecurityLists(popup);
        
        // Check open windows (fenster_terrasse is 'on')
        const openWindowsList = popup.querySelector('#open-windows-list');
        this.assert(
            openWindowsList.children.length === 1,
            'Should have one open window'
        );
        this.assert(
            openWindowsList.querySelector('.entity-list-item') !== null,
            'Should render open window as entity item'
        );

        // Check closed windows (none in mock)
        const closedWindowsList = popup.querySelector('#closed-windows-list');
        this.assert(
            closedWindowsList.querySelector('.entity-list-none') !== null,
            'Should show none message for closed windows'
        );

        // Check inactive motion (motion_buro_presence_sensor_1 is 'off')
        const inactiveMotionList = popup.querySelector('#inactive-motion-list');
        this.assert(
            inactiveMotionList.children.length === 1,
            'Should have one inactive motion sensor'
        );

        // Check active motion (none in mock)
        const activeMotionList = popup.querySelector('#active-motion-list');
        this.assert(
            activeMotionList.querySelector('.entity-list-none') !== null,
            'Should show none message for active motion'
        );
    }

    // Create mock HASS object
    createMockHass() {
        return {
            states: {
                'binary_sensor.fenster_terrasse': { 
                    state: 'on',
                    attributes: { friendly_name: 'Terrasse Window' }
                },
                'binary_sensor.motion_buro_presence_sensor_1': { 
                    state: 'off',
                    attributes: { friendly_name: 'Office Motion Sensor' }
                }
            }
        };
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Running security popup tests...');
        
        this.testEntityTypeFiltering();
        this.testEntityListRendering();
        this.testSecurityListUpdate();
        
        console.log('\n[DashView] Security popup tests completed.');
        return this.testResults;
    }

    reportResults() {
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        if (passed === total) {
            console.log(`\n✅ All ${total} security popup tests passed!`);
            return true;
        } else {
            console.log(`\n❌ ${total - passed} out of ${total} security popup tests failed.`);
            return false;
        }
    }
}

// Mock DashView Panel for testing
class MockDashViewPanel {
    constructor() {
        this._watchedEntities = new Set();
        this._houseConfig = {
            rooms: {
                wohnzimmer: {
                    friendly_name: "Wohnzimmer",
                    combined_sensor: "binary_sensor.combined_sensor_wohnzimmer",
                    header_entities: [
                        { entity: "binary_sensor.fenster_terrasse", entity_type: "window" },
                        { entity: "binary_sensor.rauchmelder_wohnzimmer_smoke", entity_type: "smoke" }
                    ]
                },
                buero: {
                    friendly_name: "Büro",
                    combined_sensor: "binary_sensor.combined_sensor_buero",
                    header_entities: [
                        { entity: "binary_sensor.motion_buro_presence_sensor_1", entity_type: "motion" }
                    ]
                }
            }
        };
        this._hass = null;
        this.shadowRoot = null;
    }

    set hass(hass) {
        this._hass = hass;
    }

    // Implement the methods we're testing
    _getAllEntitiesByType(entityType) {
        if (!this._houseConfig || !this._houseConfig.rooms) return [];
        
        const entities = [];
        for (const room of Object.values(this._houseConfig.rooms)) {
            if (room.header_entities && Array.isArray(room.header_entities)) {
                for (const entityConfig of room.header_entities) {
                    if (entityConfig.entity_type === entityType) {
                        entities.push(entityConfig.entity);
                    }
                }
            }
        }
        return [...new Set(entities)]; // Return unique entity IDs
    }

    _renderEntityList(container, entityIds, noneMessage = "None") {
        if (!container) return;

        container.innerHTML = ''; // Clear previous content
        if (entityIds.length === 0) {
            container.innerHTML = `<div class="entity-list-none">${noneMessage}</div>`;
            return;
        }

        entityIds.forEach(entityId => {
            const entityState = this._hass.states[entityId];
            const friendlyName = entityState ? entityState.attributes.friendly_name || entityId : entityId;
            
            const item = document.createElement('div');
            item.className = 'entity-list-item';
            item.textContent = friendlyName;
            container.appendChild(item);
        });
    }

    updateSecurityLists(popup) {
        if (!this._hass || !popup) return;
        
        // --- Handle Windows ---
        const allWindows = this._getAllEntitiesByType('window');
        const openWindows = allWindows.filter(id => this._hass.states[id]?.state === 'on');
        const closedWindows = allWindows.filter(id => this._hass.states[id]?.state === 'off');

        const openWindowsList = popup.querySelector('#open-windows-list');
        const closedWindowsList = popup.querySelector('#closed-windows-list');
        
        this._renderEntityList(openWindowsList, openWindows, "Alle Fenster sind geschlossen.");
        this._renderEntityList(closedWindowsList, closedWindows, "Keine Fenster sind geschlossen.");

        // --- Handle Motion Sensors ---
        const allMotionSensors = this._getAllEntitiesByType('motion');
        const activeMotion = allMotionSensors.filter(id => this._hass.states[id]?.state === 'on');
        const inactiveMotion = allMotionSensors.filter(id => this._hass.states[id]?.state === 'off');

        const activeMotionList = popup.querySelector('#active-motion-list');
        const inactiveMotionList = popup.querySelector('#inactive-motion-list');

        this._renderEntityList(activeMotionList, activeMotion, "Keine Bewegung erkannt.");
        this._renderEntityList(inactiveMotionList, inactiveMotion, "Keine inaktiven Sensoren.");
    }
}

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SecurityPopupTests, MockDashViewPanel };
}

// Auto-run tests in browser environment
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', async () => {
        const testRunner = new SecurityPopupTests();
        await testRunner.runAllTests();
        const success = testRunner.reportResults();
        
        // Signal completion for automated testing
        if (window.dashviewTestCallback) {
            window.dashviewTestCallback(success);
        }
    });
}