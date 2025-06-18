// Test for entity persistence in .storage
class EntityPersistenceTests {
    constructor() {
        this.testResults = [];
    }

    assert(condition, message) {
        if (condition) {
            console.log(`✓ ${message}`);
            this.testResults.push({ test: message, passed: true });
        } else {
            console.error(`✗ ${message}`);
            this.testResults.push({ test: message, passed: false });
        }
    }

    // Test that room header entities are properly tracked
    testEntityTracking() {
        console.log('\n[DashView] Testing entity tracking...');
        
        const panel = new MockDashViewPanel();
        const mockHass = this.createMockHass();
        
        panel._contentReady = true;
        panel.hass = mockHass;
        
        // Verify that our new room header entities are in the watched entities set
        const roomHeaderEntities = [
            'binary_sensor.fenster_terrasse',
            'binary_sensor.motion_buro_presence_sensor_1',
            'binary_sensor.rauchmelder_wohnzimmer_smoke',
            'media_player.unnamed_room',
            'sensor.geschirrspuler_operation_state'
        ];
        
        roomHeaderEntities.forEach(entityId => {
            this.assert(
                panel._watchedEntities.has(entityId),
                `Entity ${entityId} should be tracked`
            );
        });
    }

    // Test that entities are stored in lastEntityStates (simulating .storage persistence)
    testEntityStatePersistence() {
        console.log('\n[DashView] Testing entity state persistence...');
        
        const panel = new MockDashViewPanel();
        const mockHass = this.createMockHass();
        
        panel._contentReady = true;
        panel.hass = mockHass;
        
        // Simulate the entity state initialization
        panel._watchedEntities.forEach(entityId => {
            const currentState = mockHass.states[entityId];
            if (currentState) {
                panel._lastEntityStates.set(entityId, { ...currentState });
            }
        });
        
        // Verify that entities are stored in _lastEntityStates (representing .storage)
        const testEntities = [
            'binary_sensor.fenster_terrasse',
            'binary_sensor.motion_buro_presence_sensor_1',
            'media_player.unnamed_room'
        ];
        
        testEntities.forEach(entityId => {
            this.assert(
                panel._lastEntityStates.has(entityId),
                `Entity ${entityId} should be persisted in state storage`
            );
            
            const storedState = panel._lastEntityStates.get(entityId);
            const currentState = mockHass.states[entityId];
            
            this.assert(
                storedState && storedState.state === currentState.state,
                `Stored state for ${entityId} should match current state`
            );
        });
    }

    // Test entity change detection and updates
    testEntityChangeDetection() {
        console.log('\n[DashView] Testing entity change detection...');
        
        const panel = new MockDashViewPanel();
        const mockHass = this.createMockHass();
        
        panel._contentReady = true;
        panel.hass = mockHass;
        
        // Initialize with current states
        panel._watchedEntities.forEach(entityId => {
            const currentState = mockHass.states[entityId];
            if (currentState) {
                panel._lastEntityStates.set(entityId, { ...currentState });
            }
        });
        
        // Change an entity state
        mockHass.states['binary_sensor.fenster_terrasse'].state = 'off'; // was 'on'
        
        // Check for changes (this would normally trigger updates)
        let hasChanges = false;
        for (const entityId of panel._watchedEntities) {
            const currentState = mockHass.states[entityId];
            const lastState = panel._lastEntityStates.get(entityId);
            
            if (currentState && lastState && currentState.state !== lastState.state) {
                hasChanges = true;
                panel._lastEntityStates.set(entityId, { ...currentState });
                break;
            }
        }
        
        this.assert(hasChanges, 'Should detect entity state changes');
        
        // Verify the changed state is updated in storage
        const updatedState = panel._lastEntityStates.get('binary_sensor.fenster_terrasse');
        this.assert(
            updatedState && updatedState.state === 'off',
            'Changed entity state should be updated in storage'
        );
    }

    createMockHass() {
        return {
            states: {
                'weather.forecast_home': { state: 'sunny' },
                'person.markus': { state: 'home' },
                'binary_sensor.fenster_terrasse': { state: 'on' },
                'binary_sensor.motion_buro_presence_sensor_1': { state: 'off' },
                'binary_sensor.rauchmelder_wohnzimmer_smoke': { state: 'off' },
                'media_player.unnamed_room': { state: 'playing' },
                'sensor.geschirrspuler_operation_state': { state: 'Run' },
                'binary_sensor.combined_sensor_wohnzimmer': { state: 'on' },
                'binary_sensor.combined_sensor_buero': { state: 'on' }
            }
        };
    }

    async runAllTests() {
        console.log('[DashView] Running entity persistence tests...');
        
        this.testEntityTracking();
        this.testEntityStatePersistence();
        this.testEntityChangeDetection();
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\n[DashView] Entity persistence tests completed: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ All entity persistence tests passed!');
        } else {
            console.log('❌ Some entity persistence tests failed');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`   - ${result.test}`);
            });
        }
    }
}

// Mock DashView Panel for testing
class MockDashViewPanel {
    constructor() {
        this._watchedEntities = new Set();
        this._lastEntityStates = new Map();
        this._houseConfig = {
            rooms: {
                wohnzimmer: {
                    friendly_name: "Wohnzimmer",
                    combined_sensor: "binary_sensor.combined_sensor_wohnzimmer",
                    header_entities: [
                        { entity: "binary_sensor.fenster_terrasse", entity_type: "window" },
                        { entity: "binary_sensor.rauchmelder_wohnzimmer_smoke", entity_type: "smoke" },
                        { entity: "media_player.unnamed_room", entity_type: "music" }
                    ]
                },
                buero: {
                    friendly_name: "Büro",
                    combined_sensor: "binary_sensor.combined_sensor_buero",
                    header_entities: [
                        { entity: "binary_sensor.motion_buro_presence_sensor_1", entity_type: "motion" }
                    ]
                },
                kueche: {
                    friendly_name: "Küche",
                    combined_sensor: "binary_sensor.combined_sensor_kueche",
                    header_entities: [
                        { entity: "sensor.geschirrspuler_operation_state", entity_type: "dishwasher" }
                    ]
                }
            }
        };
        this.shadowRoot = null;
    }

    set hass(hass) {
        this._hass = hass;
        
        // Simulate existing entity watching
        this._watchedEntities.add('weather.forecast_home');
        this._watchedEntities.add('person.markus');
        
        // Simulate adding room header entities
        if (this._houseConfig && this._houseConfig.rooms) {
            Object.values(this._houseConfig.rooms).forEach(roomConfig => {
                if (roomConfig.header_entities) {
                    roomConfig.header_entities.forEach(entityConfig => {
                        this._watchedEntities.add(entityConfig.entity);
                    });
                }
            });
        }
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { EntityPersistenceTests, MockDashViewPanel };
} else if (typeof window !== 'undefined') {
    window.EntityPersistenceTests = EntityPersistenceTests;
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tests = new EntityPersistenceTests();
    tests.runAllTests();
}