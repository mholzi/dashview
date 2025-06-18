// Test for security panel configuration-based entity detection
class SecurityPanelConfigTests {
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

    // Mock DashView panel with house configuration
    createMockPanel() {
        const panel = {
            _houseConfig: {
                rooms: {
                    wohnzimmer: {
                        header_entities: [
                            { entity: "binary_sensor.fenster_terrasse", entity_type: "window" },
                            { entity: "binary_sensor.fenster_wohnzimmer_contact", entity_type: "window" },
                            { entity: "binary_sensor.rauchmelder_wohnzimmer_smoke", entity_type: "smoke" }
                        ]
                    },
                    buero: {
                        header_entities: [
                            { entity: "binary_sensor.motion_buro_presence_sensor_1", entity_type: "motion" },
                            { entity: "binary_sensor.fenster_buero_contact", entity_type: "window" },
                            { entity: "binary_sensor.vibration_buero_vibration", entity_type: "vibration" }
                        ]
                    },
                    kueche: {
                        header_entities: [
                            { entity: "binary_sensor.motion_kuche_presence_sensor_1", entity_type: "motion" },
                            { entity: "binary_sensor.fenster_kuche", entity_type: "window" }
                        ]
                    }
                }
            },
            // Copy the methods from dashview-panel.js
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
            },
            _isEntityOfType(entityId, entityType) {
                if (!this._houseConfig || !this._houseConfig.rooms) return false;
                
                for (const room of Object.values(this._houseConfig.rooms)) {
                    if (room.header_entities && Array.isArray(room.header_entities)) {
                        for (const entityConfig of room.header_entities) {
                            if (entityConfig.entity === entityId && entityConfig.entity_type === entityType) {
                                return true;
                            }
                        }
                    }
                }
                return false;
            }
        };
        return panel;
    }

    // Test that window entities are correctly identified from configuration
    testWindowEntityDetection() {
        console.log('\n[DashView] Testing window entity detection from configuration...');
        
        const panel = this.createMockPanel();
        
        // Test _getAllEntitiesByType for windows
        const windowEntities = panel._getAllEntitiesByType('window');
        const expectedWindows = [
            'binary_sensor.fenster_terrasse',
            'binary_sensor.fenster_wohnzimmer_contact',
            'binary_sensor.fenster_buero_contact',
            'binary_sensor.fenster_kuche'
        ];
        
        this.assert(windowEntities.length === 4, `Found 4 window entities (got ${windowEntities.length})`);
        
        expectedWindows.forEach(expectedEntity => {
            this.assert(
                windowEntities.includes(expectedEntity),
                `Window entity ${expectedEntity} found in configuration`
            );
        });
        
        // Test _isEntityOfType for windows
        this.assert(
            panel._isEntityOfType('binary_sensor.fenster_terrasse', 'window'),
            'binary_sensor.fenster_terrasse correctly identified as window'
        );
        
        this.assert(
            !panel._isEntityOfType('binary_sensor.fenster_terrasse', 'motion'),
            'binary_sensor.fenster_terrasse correctly not identified as motion'
        );
        
        // Test that hardcoded pattern would miss entities not matching pattern
        const hardcodedMatches = windowEntities.filter(entity => entity.startsWith('binary_sensor.fenster'));
        this.assert(
            hardcodedMatches.length === windowEntities.length,
            'All window entities happen to match old hardcoded pattern (but config-based is more flexible)'
        );
    }

    // Test that motion entities are correctly identified from configuration
    testMotionEntityDetection() {
        console.log('\n[DashView] Testing motion entity detection from configuration...');
        
        const panel = this.createMockPanel();
        
        // Test _getAllEntitiesByType for motion
        const motionEntities = panel._getAllEntitiesByType('motion');
        const expectedMotion = [
            'binary_sensor.motion_buro_presence_sensor_1',
            'binary_sensor.motion_kuche_presence_sensor_1'
        ];
        
        this.assert(motionEntities.length === 2, `Found 2 motion entities (got ${motionEntities.length})`);
        
        expectedMotion.forEach(expectedEntity => {
            this.assert(
                motionEntities.includes(expectedEntity),
                `Motion entity ${expectedEntity} found in configuration`
            );
        });
        
        // Test _isEntityOfType for motion
        this.assert(
            panel._isEntityOfType('binary_sensor.motion_buro_presence_sensor_1', 'motion'),
            'binary_sensor.motion_buro_presence_sensor_1 correctly identified as motion'
        );
        
        this.assert(
            !panel._isEntityOfType('binary_sensor.motion_buro_presence_sensor_1', 'window'),
            'binary_sensor.motion_buro_presence_sensor_1 correctly not identified as window'
        );
    }

    // Test configuration vs hardcoded approach flexibility
    testConfigurationFlexibility() {
        console.log('\n[DashView] Testing configuration-based approach flexibility...');
        
        // Create panel with non-standard entity naming
        const flexiblePanel = {
            _houseConfig: {
                rooms: {
                    room1: {
                        header_entities: [
                            { entity: "binary_sensor.custom_window_sensor", entity_type: "window" },
                            { entity: "binary_sensor.different_motion_detector", entity_type: "motion" },
                            { entity: "binary_sensor.door_contact_sensor", entity_type: "window" } // Door treated as window
                        ]
                    }
                }
            },
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
                return [...new Set(entities)];
            }
        };
        
        // Configuration-based approach should find all configured entities
        const configWindows = flexiblePanel._getAllEntitiesByType('window');
        this.assert(
            configWindows.includes('binary_sensor.custom_window_sensor'),
            'Configuration-based approach finds custom window sensor'
        );
        
        this.assert(
            configWindows.includes('binary_sensor.door_contact_sensor'),
            'Configuration-based approach finds door sensor configured as window'
        );
        
        // Hardcoded approach would miss these
        const hardcodedWindows = configWindows.filter(entity => entity.startsWith('binary_sensor.fenster'));
        this.assert(
            hardcodedWindows.length === 0,
            'Hardcoded approach would miss custom-named window sensors'
        );
        
        this.assert(
            configWindows.length === 2,
            'Configuration-based approach correctly finds all 2 window entities regardless of naming'
        );
    }

    async runAllTests() {
        console.log('🛡️  Running Security Panel Configuration Tests...');
        
        this.testWindowEntityDetection();
        this.testMotionEntityDetection();
        this.testConfigurationFlexibility();
        
        const failedTests = this.testResults.filter(result => !result.passed);
        if (failedTests.length === 0) {
            console.log('✅ All Security Panel Configuration tests passed!');
            return true;
        } else {
            console.error(`❌ ${failedTests.length} tests failed:`);
            failedTests.forEach(test => console.error(`  - ${test.test}`));
            return false;
        }
    }
}

// Auto-run tests if this file is executed directly
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SecurityPanelConfigTests;
} else {
    // Run tests
    const tests = new SecurityPanelConfigTests();
    tests.runAllTests().then(success => {
        if (!success) {
            process?.exit(1);
        }
    });
}