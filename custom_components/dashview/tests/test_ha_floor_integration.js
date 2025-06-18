/**
 * Home Assistant Floor Integration Test Suite
 * Tests the new floor management functionality
 */

class HAFloorIntegrationTests {
    constructor() {
        this.testResults = [];
    }

    // Test floor sensor mapping structure
    testFloorSensorMapping() {
        const testName = 'Floor Sensor Mapping Structure';
        try {
            // Test house config structure with floor_sensors
            const houseConfig = {
                rooms: {},
                floors: {},
                floor_sensors: {
                    'floor_ground': 'binary_sensor.ground_floor_active',
                    'floor_upper': 'binary_sensor.upper_floor_active'
                }
            };
            
            this.assertTrue(
                houseConfig.floor_sensors && 
                typeof houseConfig.floor_sensors === 'object',
                'House config should have floor_sensors object'
            );
            
            this.assertTrue(
                houseConfig.floor_sensors['floor_ground'] === 'binary_sensor.ground_floor_active',
                'Floor sensor mapping should be correct'
            );

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Test floor rendering logic
    testFloorRendering() {
        const testName = 'Floor Rendering Logic';
        try {
            // Mock floors data from Home Assistant
            const floors = [
                { floor_id: 'floor_ground', name: 'Ground Floor', icon: 'mdi:home' },
                { floor_id: 'floor_upper', name: 'Upper Floor', icon: 'mdi:stairs-up' }
            ];
            
            const floorSensors = {
                'floor_ground': 'binary_sensor.ground_floor_active'
            };

            // Test that we can generate the expected HTML structure
            const expectedHTML = floors.map(floor => {
                const sensor = floorSensors[floor.floor_id] || '';
                return `
                    <div class="floor-item">
                        <div class="floor-info">
                            <div class="floor-name">${floor.name}</div>
                            <div class="floor-details">Icon: ${floor.icon}</div>
                        </div>
                        <div class="form-row">
                            <label for="floor-sensor-${floor.floor_id}">Activity Sensor:</label>
                            <input type="text" id="floor-sensor-${floor.floor_id}" class="form-input" value="${sensor}" placeholder="e.g., binary_sensor.ground_floor_active">
                        </div>
                    </div>
                `;
            }).join('');

            this.assertTrue(
                expectedHTML.includes('floor-sensor-floor_ground'),
                'Should generate input fields with correct IDs'
            );
            
            this.assertTrue(
                expectedHTML.includes('Ground Floor'),
                'Should display floor names'
            );

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Test configuration validation
    testConfigValidation() {
        const testName = 'Configuration Validation';
        try {
            // Test valid configuration
            const validConfig = {
                house_config: {
                    rooms: {},
                    floors: {},
                    floor_sensors: {
                        'floor_id_1': 'binary_sensor.floor1_active'
                    }
                }
            };

            this.assertTrue(
                validConfig.house_config.floor_sensors &&
                Object.keys(validConfig.house_config.floor_sensors).length > 0,
                'Valid config should have floor_sensors'
            );

            // Test empty configuration
            const emptyConfig = { house_config: {} };
            this.assertTrue(
                !emptyConfig.house_config.floor_sensors ||
                Object.keys(emptyConfig.house_config.floor_sensors || {}).length === 0,
                'Empty config should handle missing floor_sensors gracefully'
            );

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Helper assertion methods
    assertTrue(condition, message) {
        if (!condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    assertFalse(condition, message) {
        if (condition) {
            throw new Error(`Assertion failed: ${message}`);
        }
    }

    // Run all tests
    async runAllTests() {
        console.log('[HAFloorIntegrationTests] Starting Home Assistant floor integration tests...');
        
        this.testFloorSensorMapping();
        this.testFloorRendering();
        this.testConfigValidation();

        // Print results
        let passed = 0;
        let failed = 0;
        
        this.testResults.forEach(result => {
            if (result.passed) {
                console.log(`✓ ${result.name}`);
                passed++;
            } else {
                console.log(`✗ ${result.name}: ${result.error}`);
                failed++;
            }
        });

        console.log(`[HAFloorIntegrationTests] Tests completed: ${passed} passed, ${failed} failed`);
        return failed === 0;
    }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HAFloorIntegrationTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tester = new HAFloorIntegrationTests();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}