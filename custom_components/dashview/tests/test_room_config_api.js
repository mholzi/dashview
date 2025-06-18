// Test for room configuration API endpoints
class RoomConfigAPITests {
    constructor() {
        this.testResults = [];
    }

    assert(condition, testName, message) {
        if (condition) {
            console.log(`✓ ${testName}: ${message}`);
            this.testResults.push({ name: `${testName}: ${message}`, passed: true });
        } else {
            console.error(`✗ ${testName}: ${message}`);
            this.testResults.push({ name: `${testName}: ${message}`, passed: false, error: message });
        }
    }

    // Mock Home Assistant with areas and sensors
    createMockHass() {
        return {
            states: {
                async_all: (domain) => {
                    if (domain === 'binary_sensor') {
                        return [
                            {
                                entity_id: 'binary_sensor.combined_living_room',
                                name: 'Living Room Activity'
                            },
                            {
                                entity_id: 'binary_sensor.combined_kitchen',  
                                name: 'Kitchen Activity'
                            },
                            {
                                entity_id: 'binary_sensor.other_sensor',
                                name: 'Other Sensor'
                            }
                        ];
                    }
                    return [];
                }
            }
        };
    }

    // Mock Area Registry
    createMockAreaRegistry() {
        return {
            async_list_areas: () => [
                { id: 'living_room', name: 'Living Room', icon: 'mdi:sofa' },
                { id: 'kitchen', name: 'Kitchen', icon: 'mdi:chef-hat' },
                { id: 'bedroom', name: 'Bedroom', icon: null }
            ]
        };
    }

    // Test the ha_rooms API endpoint logic
    testHARoomsEndpoint() {
        const testName = 'HA Rooms API Endpoint';
        try {
            const mockAreaRegistry = this.createMockAreaRegistry();
            const areas = mockAreaRegistry.async_list_areas();
            
            const rooms = areas.map(area => ({
                area_id: area.id,
                name: area.name,
                icon: area.icon || "mdi:home-outline"
            }));
            
            const sortedRooms = rooms.sort((a, b) => a.name.localeCompare(b.name));

            this.assert(
                sortedRooms.length === 3,
                testName,
                'Should return 3 rooms from area registry'
            );

            this.assert(
                sortedRooms[0].name === 'Bedroom',
                testName,
                'Should sort rooms by name (Bedroom first)'
            );

            this.assert(
                sortedRooms[0].icon === 'mdi:home-outline',
                testName,
                'Should use default icon when area has none (Bedroom room has no icon)'
            );

            this.assert(
                sortedRooms[1].area_id === 'kitchen',
                testName,
                'Should include area_id in response'
            );

        } catch (error) {
            this.assert(false, testName, `Test failed: ${error.message}`);
        }
    }

    // Test the combined_sensors API endpoint logic
    testCombinedSensorsEndpoint() {
        const testName = 'Combined Sensors API Endpoint';
        try {
            const mockHass = this.createMockHass();
            const allSensors = mockHass.states.async_all('binary_sensor');
            
            const combinedSensors = allSensors
                .filter(entity => entity.entity_id.startsWith("binary_sensor.combined"))
                .map(entity => ({
                    entity_id: entity.entity_id,
                    friendly_name: entity.name || entity.entity_id
                }));
            
            const sortedSensors = combinedSensors.sort((a, b) => 
                a.friendly_name.localeCompare(b.friendly_name)
            );

            this.assert(
                sortedSensors.length === 2,
                testName,
                'Should return only combined sensors'
            );

            this.assert(
                sortedSensors[0].friendly_name === 'Kitchen Activity',
                testName,
                'Should sort sensors by friendly_name'
            );

            this.assert(
                sortedSensors[1].entity_id === 'binary_sensor.combined_living_room',
                testName,
                'Should include entity_id in response'
            );

            this.assert(
                !sortedSensors.some(s => s.entity_id === 'binary_sensor.other_sensor'),
                testName,
                'Should exclude non-combined sensors'
            );

        } catch (error) {
            this.assert(false, testName, `Test failed: ${error.message}`);
        }
    }

    // Test room maintenance workflow
    testRoomMaintenanceWorkflow() {
        const testName = 'Room Maintenance Workflow';
        try {
            // Simulate the new room maintenance workflow
            const haRooms = this.createMockAreaRegistry().async_list_areas();
            const combinedSensors = this.createMockHass().states.async_all('binary_sensor')
                .filter(entity => entity.entity_id.startsWith("binary_sensor.combined"));

            // Test room-sensor assignment
            const houseConfig = { rooms: {}, floors: {} };
            const roomKey = 'living_room';
            const selectedSensor = 'binary_sensor.combined_living_room';

            // Simulate room assignment
            if (!houseConfig.rooms[roomKey]) {
                houseConfig.rooms[roomKey] = {
                    friendly_name: roomKey,
                    icon: 'mdi:home-outline',
                    floor: null
                };
            }
            houseConfig.rooms[roomKey].combined_sensor = selectedSensor;

            this.assert(
                houseConfig.rooms[roomKey].combined_sensor === selectedSensor,
                testName,
                'Should assign sensor to room correctly'
            );

            this.assert(
                houseConfig.rooms[roomKey].icon === 'mdi:home-outline',
                testName,
                'Should set default icon for new room'
            );

        } catch (error) {
            this.assert(false, testName, `Test failed: ${error.message}`);
        }
    }

    runAllTests() {
        console.log('\n[DashView] Running Room Config API Tests...');
        
        this.testHARoomsEndpoint();
        this.testCombinedSensorsEndpoint();
        this.testRoomMaintenanceWorkflow();
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        console.log(`\n[DashView] Room Config API Tests: ${passed}/${total} passed`);
        
        if (passed === total) {
            console.log('✅ All Room Config API tests passed!');
            return true;
        } else {
            console.log('❌ Some Room Config API tests failed');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.error(`   ✗ ${result.name}: ${result.error}`);
            });
            return false;
        }
    }
}

// Run tests if executed directly
if (typeof window === 'undefined') {
    const tests = new RoomConfigAPITests();
    const success = tests.runAllTests();
    process.exit(success ? 0 : 1);
}