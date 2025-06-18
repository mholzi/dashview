// Test for new sensor setup functionality (Fenster, Rauchmelder, Vibration)
class SensorSetupTests {
    constructor() {
        this.testResults = [];
    }

    // Helper assertion methods
    assert(condition, message) {
        if (condition) {
            console.log(`✓ ${message}`);
            this.testResults.push({ name: message, passed: true });
        } else {
            console.error(`✗ ${message}`);
            this.testResults.push({ name: message, passed: false });
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
                            { entity: "binary_sensor.rauchmelder_wohnzimmer_smoke", entity_type: "smoke" }
                        ]
                    },
                    buero: {
                        header_entities: [
                            { entity: "binary_sensor.fenster_buero_contact", entity_type: "window" },
                            { entity: "binary_sensor.vibration_buero_vibration", entity_type: "vibration" }
                        ]
                    },
                    kueche: {
                        header_entities: [
                            { entity: "binary_sensor.fenster_kuche", entity_type: "window" },
                            { entity: "binary_sensor.rauchmelder_kuche", entity_type: "smoke" },
                            { entity: "binary_sensor.vibration_kuche_door", entity_type: "vibration" }
                        ]
                    }
                }
            },
            
            // Include the helper methods from the main panel
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
            'binary_sensor.fenster_buero_contact',
            'binary_sensor.fenster_kuche'
        ];
        
        this.assert(windowEntities.length === 3, `Found 3 window entities (got ${windowEntities.length})`);
        
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
    }

    // Test that smoke detector entities are correctly identified from configuration
    testSmokeDetectorEntityDetection() {
        console.log('\n[DashView] Testing smoke detector entity detection from configuration...');
        
        const panel = this.createMockPanel();
        
        // Test _getAllEntitiesByType for smoke detectors
        const smokeDetectorEntities = panel._getAllEntitiesByType('smoke');
        const expectedSmokeDetectors = [
            'binary_sensor.rauchmelder_wohnzimmer_smoke',
            'binary_sensor.rauchmelder_kuche'
        ];
        
        this.assert(smokeDetectorEntities.length === 2, `Found 2 smoke detector entities (got ${smokeDetectorEntities.length})`);
        
        expectedSmokeDetectors.forEach(expectedEntity => {
            this.assert(
                smokeDetectorEntities.includes(expectedEntity),
                `Smoke detector entity ${expectedEntity} found in configuration`
            );
        });
        
        // Test _isEntityOfType for smoke detectors
        this.assert(
            panel._isEntityOfType('binary_sensor.rauchmelder_wohnzimmer_smoke', 'smoke'),
            'binary_sensor.rauchmelder_wohnzimmer_smoke correctly identified as smoke detector'
        );
        
        this.assert(
            !panel._isEntityOfType('binary_sensor.rauchmelder_wohnzimmer_smoke', 'window'),
            'binary_sensor.rauchmelder_wohnzimmer_smoke correctly not identified as window'
        );
    }

    // Test that vibration entities are correctly identified from configuration
    testVibrationEntityDetection() {
        console.log('\n[DashView] Testing vibration entity detection from configuration...');
        
        const panel = this.createMockPanel();
        
        // Test _getAllEntitiesByType for vibration sensors
        const vibrationEntities = panel._getAllEntitiesByType('vibration');
        const expectedVibrationSensors = [
            'binary_sensor.vibration_buero_vibration',
            'binary_sensor.vibration_kuche_door'
        ];
        
        this.assert(vibrationEntities.length === 2, `Found 2 vibration entities (got ${vibrationEntities.length})`);
        
        expectedVibrationSensors.forEach(expectedEntity => {
            this.assert(
                vibrationEntities.includes(expectedEntity),
                `Vibration entity ${expectedEntity} found in configuration`
            );
        });
        
        // Test _isEntityOfType for vibration sensors
        this.assert(
            panel._isEntityOfType('binary_sensor.vibration_buero_vibration', 'vibration'),
            'binary_sensor.vibration_buero_vibration correctly identified as vibration sensor'
        );
        
        this.assert(
            !panel._isEntityOfType('binary_sensor.vibration_buero_vibration', 'smoke'),
            'binary_sensor.vibration_buero_vibration correctly not identified as smoke detector'
        );
    }

    // Test configuration vs hardcoded approach flexibility
    testConfigurationFlexibility() {
        console.log('\n[DashView] Testing configuration-based approach flexibility...');
        
        const panel = this.createMockPanel();
        
        // Test custom-named entities that wouldn't match hardcoded patterns
        const configWindows = panel._getAllEntitiesByType('window');
        
        this.assert(
            configWindows.includes('binary_sensor.fenster_buero_contact'),
            'Configuration-based approach finds custom window sensor naming pattern'
        );
        
        this.assert(
            configWindows.includes('binary_sensor.fenster_kuche'),
            'Configuration-based approach finds entities regardless of naming convention'
        );
        
        this.assert(
            configWindows.length === 3,
            'Configuration-based approach correctly finds all 3 window entities regardless of naming'
        );

        // Test smoke detectors with different naming patterns
        const configSmokeDetectors = panel._getAllEntitiesByType('smoke');
        
        this.assert(
            configSmokeDetectors.includes('binary_sensor.rauchmelder_wohnzimmer_smoke'),
            'Configuration-based approach finds smoke detector with "smoke" suffix'
        );
        
        this.assert(
            configSmokeDetectors.includes('binary_sensor.rauchmelder_kuche'),
            'Configuration-based approach finds smoke detector without suffix'
        );

        // Test vibration sensors with different naming patterns
        const configVibrationSensors = panel._getAllEntitiesByType('vibration');
        
        this.assert(
            configVibrationSensors.includes('binary_sensor.vibration_buero_vibration'),
            'Configuration-based approach finds vibration sensor with "vibration" suffix'
        );
        
        this.assert(
            configVibrationSensors.includes('binary_sensor.vibration_kuche_door'),
            'Configuration-based approach finds vibration sensor with custom suffix'
        );
    }

    // Test that multiple entity types can coexist in room configuration
    testMultipleEntityTypesInRoom() {
        console.log('\n[DashView] Testing multiple entity types in single room...');
        
        const panel = this.createMockPanel();
        
        // Check that kitchen has all three types of sensors
        const kucheRoom = panel._houseConfig.rooms.kueche;
        
        this.assert(
            kucheRoom.header_entities.length === 3,
            'Kitchen room has 3 header entities'
        );
        
        const entityTypes = kucheRoom.header_entities.map(e => e.entity_type);
        
        this.assert(
            entityTypes.includes('window'),
            'Kitchen includes window sensor'
        );
        
        this.assert(
            entityTypes.includes('smoke'),
            'Kitchen includes smoke detector'
        );
        
        this.assert(
            entityTypes.includes('vibration'),
            'Kitchen includes vibration sensor'
        );
        
        // Verify that each type query returns the correct entity for this room
        const allWindows = panel._getAllEntitiesByType('window');
        const allSmoke = panel._getAllEntitiesByType('smoke');
        const allVibration = panel._getAllEntitiesByType('vibration');
        
        this.assert(
            allWindows.includes('binary_sensor.fenster_kuche'),
            'Kitchen window found in all windows query'
        );
        
        this.assert(
            allSmoke.includes('binary_sensor.rauchmelder_kuche'),
            'Kitchen smoke detector found in all smoke detectors query'
        );
        
        this.assert(
            allVibration.includes('binary_sensor.vibration_kuche_door'),
            'Kitchen vibration sensor found in all vibration sensors query'
        );
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Starting sensor setup tests for Fenster, Rauchmelder, Vibration...');
        
        this.testWindowEntityDetection();
        this.testSmokeDetectorEntityDetection();
        this.testVibrationEntityDetection();
        this.testConfigurationFlexibility();
        this.testMultipleEntityTypesInRoom();
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(result => result.passed).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`\n[DashView] Sensor setup tests completed:`);
        console.log(`  Total: ${totalTests}`);
        console.log(`  Passed: ${passedTests}`);
        console.log(`  Failed: ${failedTests}`);
        
        if (failedTests > 0) {
            console.log('\nFailed tests:');
            this.testResults.filter(result => !result.passed).forEach(result => {
                console.log(`  - ${result.name}`);
            });
            process.exit(1);
        } else {
            console.log('\n✅ All sensor setup tests passed!');
        }
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    const testRunner = new SensorSetupTests();
    testRunner.runAllTests();
}

// Export for use in other test files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SensorSetupTests;
}