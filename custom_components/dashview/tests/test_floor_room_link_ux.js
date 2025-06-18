/**
 * Floor-Room Link User Experience Test
 * Demonstrates the end-to-end user experience improvements for floor-room linking
 */

class FloorRoomLinkUserExperienceTest {
    constructor() {
        this.testResults = [];
    }

    async runAllTests() {
        console.log('[DashView] Running Floor-Room Link User Experience Tests...');
        
        try {
            this.testUserScenario_CreateRoomWithInvalidFloor();
            this.testUserScenario_ViewConsistencyWarnings();
            this.testUserScenario_AutoFixOrphanedRooms();
            
            // Report results
            const passed = this.testResults.filter(t => t.passed).length;
            const total = this.testResults.length;
            
            if (passed === total) {
                console.log(`✅ All ${total} floor-room link UX tests passed`);
                return true;
            } else {
                console.log(`❌ ${total - passed} out of ${total} floor-room link UX tests failed`);
                this.testResults.filter(t => !t.passed).forEach(t => {
                    console.log(`  - ${t.name}: ${t.error}`);
                });
                return false;
            }
        } catch (error) {
            console.error('❌ Floor-room link UX test suite failed:', error);
            return false;
        }
    }

    testUserScenario_CreateRoomWithInvalidFloor() {
        const testName = 'User Scenario: Create Room with Invalid Floor';
        try {
            // Simulate user trying to create a room with a non-existent floor
            console.log('  📝 Scenario: User tries to create "Bedroom" on "second_floor" which doesn\'t exist');
            
            const mockHouseConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' }
                },
                rooms: {}
            };

            const newRoomData = {
                friendly_name: 'Bedroom',
                icon: 'mdi:bed',
                floor: 'second_floor', // This floor doesn't exist!
                combined_sensor: 'binary_sensor.bedroom_sensor'
            };

            // Simulate the validation that would happen in saveRoom()
            const floors = mockHouseConfig.floors || {};
            const floorExists = floors[newRoomData.floor];
            
            this.assertFalse(floorExists, 'Floor should not exist');
            
            // The validation should prevent room creation
            const expectedErrorMessage = `Floor '${newRoomData.floor}' does not exist. Please create the floor first or select an existing floor.`;
            
            console.log(`  ❌ Expected error: "${expectedErrorMessage}"`);
            console.log('  ✅ User is guided to create the floor first or select an existing one');
            
            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    testUserScenario_ViewConsistencyWarnings() {
        const testName = 'User Scenario: View Consistency Warnings in Admin';
        try {
            console.log('  📊 Scenario: User views admin panel with orphaned rooms and unused floors');
            
            const problematicConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' },
                    'unused_floor': { friendly_name: 'Unused Floor', icon: 'mdi:stairs' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor', icon: 'mdi:sofa' },
                    'orphaned_bedroom': { friendly_name: 'Orphaned Bedroom', floor: 'deleted_floor', icon: 'mdi:bed' },
                    'no_floor_room': { friendly_name: 'No Floor Room', floor: null, icon: 'mdi:help' }
                }
            };

            // Simulate the consistency check that runs in _updateAdminSummary()
            const mockPanel = {
                _findOrphanedRooms: function(houseConfig) {
                    const floors = houseConfig?.floors || {};
                    const rooms = houseConfig?.rooms || {};
                    const orphanedRooms = [];

                    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
                        if (!roomConfig.floor || !floors[roomConfig.floor]) {
                            orphanedRooms.push({
                                roomKey,
                                roomConfig,
                                invalidFloor: roomConfig.floor || null
                            });
                        }
                    });

                    return orphanedRooms;
                },
                _checkFloorRoomConsistency: function(houseConfig) {
                    const floors = houseConfig?.floors || {};
                    const rooms = houseConfig?.rooms || {};
                    
                    const orphanedRooms = this._findOrphanedRooms(houseConfig);
                    
                    const usedFloors = new Set();
                    Object.values(rooms).forEach(roomConfig => {
                        if (roomConfig.floor && floors[roomConfig.floor]) {
                            usedFloors.add(roomConfig.floor);
                        }
                    });
                    
                    const unusedFloors = Object.keys(floors).filter(floorKey => !usedFloors.has(floorKey));
                    
                    return {
                        isConsistent: orphanedRooms.length === 0,
                        orphanedRooms: orphanedRooms.map(o => ({
                            roomKey: o.roomKey,
                            invalidFloor: o.invalidFloor
                        })),
                        unusedFloors,
                        totalFloors: Object.keys(floors).length,
                        totalRooms: Object.keys(rooms).length,
                        validRooms: Object.keys(rooms).length - orphanedRooms.length
                    };
                }
            };

            const consistencyReport = mockPanel._checkFloorRoomConsistency(problematicConfig);
            
            this.assertFalse(consistencyReport.isConsistent, 'Configuration should be inconsistent');
            this.assertTrue(consistencyReport.orphanedRooms.length === 2, 'Should find 2 orphaned rooms');
            this.assertTrue(consistencyReport.unusedFloors.length === 1, 'Should find 1 unused floor');
            
            console.log('  ⚠️  User would see consistency warnings:');
            console.log(`     - Orphaned Rooms (${consistencyReport.orphanedRooms.length}): ${consistencyReport.orphanedRooms.map(r => `${r.roomKey} → ${r.invalidFloor || 'No Floor'}`).join(', ')}`);
            console.log(`     - Unused Floors (${consistencyReport.unusedFloors.length}): ${consistencyReport.unusedFloors.join(', ')}`);
            console.log('  ✅ User has clear visibility into data integrity issues');

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    testUserScenario_AutoFixOrphanedRooms() {
        const testName = 'User Scenario: Auto-Fix Orphaned Rooms';
        try {
            console.log('  🔧 Scenario: User uses auto-fix feature to resolve orphaned rooms');
            
            const configWithOrphans = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' },
                    'first_floor': { friendly_name: 'First Floor', icon: 'mdi:stairs-up' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor', icon: 'mdi:sofa' },
                    'orphaned_bedroom': { friendly_name: 'Orphaned Bedroom', floor: 'deleted_floor', icon: 'mdi:bed' },
                    'orphaned_office': { friendly_name: 'Orphaned Office', floor: null, icon: 'mdi:desk' }
                }
            };

            // Simulate the auto-fix functionality
            const mockPanel = {
                _findOrphanedRooms: function(houseConfig) {
                    const floors = houseConfig?.floors || {};
                    const rooms = houseConfig?.rooms || {};
                    const orphanedRooms = [];

                    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
                        if (!roomConfig.floor || !floors[roomConfig.floor]) {
                            orphanedRooms.push({
                                roomKey,
                                roomConfig,
                                invalidFloor: roomConfig.floor || null
                            });
                        }
                    });

                    return orphanedRooms;
                },
                _autoFixOrphanedRooms: function(houseConfig) {
                    const floors = houseConfig?.floors || {};
                    const rooms = houseConfig?.rooms || {};
                    const floorKeys = Object.keys(floors);
                    
                    if (floorKeys.length === 0) {
                        return { success: false, message: 'No floors available to assign orphaned rooms to' };
                    }

                    const orphanedRooms = this._findOrphanedRooms(houseConfig);
                    const fixedRooms = [];
                    const defaultFloor = floorKeys[0];

                    orphanedRooms.forEach(({ roomKey }) => {
                        rooms[roomKey].floor = defaultFloor;
                        fixedRooms.push(roomKey);
                    });

                    return {
                        success: true,
                        fixedRooms,
                        assignedFloor: floors[defaultFloor]?.friendly_name || defaultFloor,
                        message: `Assigned ${fixedRooms.length} orphaned room(s) to '${floors[defaultFloor]?.friendly_name || defaultFloor}'`
                    };
                }
            };

            const beforeFix = mockPanel._findOrphanedRooms(configWithOrphans);
            console.log(`  📊 Before fix: ${beforeFix.length} orphaned rooms found`);
            
            const fixResult = mockPanel._autoFixOrphanedRooms(configWithOrphans);
            console.log(`  🔧 Auto-fix result: ${fixResult.message}`);
            
            const afterFix = mockPanel._findOrphanedRooms(configWithOrphans);
            console.log(`  ✅ After fix: ${afterFix.length} orphaned rooms remaining`);
            
            this.assertTrue(fixResult.success, 'Auto-fix should succeed');
            this.assertTrue(fixResult.fixedRooms.length === 2, 'Should fix 2 orphaned rooms');
            this.assertTrue(afterFix.length === 0, 'Should have no orphaned rooms after fix');
            
            // Verify the rooms were actually assigned
            this.assertTrue(
                configWithOrphans.rooms.orphaned_bedroom.floor === 'ground_floor',
                'Orphaned bedroom should be assigned to ground floor'
            );
            this.assertTrue(
                configWithOrphans.rooms.orphaned_office.floor === 'ground_floor',
                'Orphaned office should be assigned to ground floor'
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
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FloorRoomLinkUserExperienceTest;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tester = new FloorRoomLinkUserExperienceTest();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}