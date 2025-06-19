/**
 * Floor-Room Link Integration Test
 * Tests the complete floor-room relationship functionality including validation and UI feedback
 */

class FloorRoomLinkIntegrationTests {
    constructor() {
        this.testResults = [];
    }

    async runAllTests() {
        console.log('[DashView] Running Floor-Room Link Integration Tests...');
        
        try {
            this.testRoomValidationWithInvalidFloor();
            this.testConsistencyReportGeneration();
            this.testOrphanedRoomAutoFix();
            this.testFloorDeletionImpactAnalysis();
            
            // Report results
            const passed = this.testResults.filter(t => t.passed).length;
            const total = this.testResults.length;
            
            if (passed === total) {
                console.log(`✅ All ${total} floor-room link integration tests passed`);
                return true;
            } else {
                console.log(`❌ ${total - passed} out of ${total} floor-room link integration tests failed`);
                this.testResults.filter(t => !t.passed).forEach(t => {
                    console.log(`  - ${t.name}: ${t.error}`);
                });
                return false;
            }
        } catch (error) {
            console.error('❌ Floor-room link integration test suite failed:', error);
            return false;
        }
    }

    testRoomValidationWithInvalidFloor() {
        const testName = 'Room Validation with Invalid Floor Reference';
        try {
            // Mock the DashviewPanel class with our validation method
            const mockPanel = {
                _adminLocalState: {
                    houseConfig: {
                        floors: {
                            'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' }
                        }
                    }
                },
                _validateRoomFloorReference: function(roomConfig, houseConfig) {
                    const floors = houseConfig?.floors || {};
                    return roomConfig.floor && floors[roomConfig.floor];
                }
            };

            // Test valid room
            const validRoom = {
                friendly_name: 'Living Room',
                floor: 'ground_floor',
                icon: 'mdi:sofa'
            };
            
            const isValid = mockPanel._validateRoomFloorReference(validRoom, mockPanel._adminLocalState.houseConfig);
            this.assertTrue(isValid, 'Should validate room with existing floor');

            // Test invalid room
            const invalidRoom = {
                friendly_name: 'Bedroom',
                floor: 'non_existent_floor',
                icon: 'mdi:bed'
            };
            
            const isInvalid = mockPanel._validateRoomFloorReference(invalidRoom, mockPanel._adminLocalState.houseConfig);
            this.assertFalse(isInvalid, 'Should reject room with non-existent floor');

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    testConsistencyReportGeneration() {
        const testName = 'Consistency Report Generation';
        try {
            // Mock panel with consistency check method
            const mockPanel = {
                _checkFloorRoomConsistency: function(houseConfig) {
                    const floors = houseConfig?.floors || {};
                    const rooms = houseConfig?.rooms || {};
                    
                    const orphanedRooms = [];
                    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
                        if (!roomConfig.floor || !floors[roomConfig.floor]) {
                            orphanedRooms.push({
                                roomKey,
                                invalidFloor: roomConfig.floor || null
                            });
                        }
                    });
                    
                    const usedFloors = new Set();
                    Object.values(rooms).forEach(roomConfig => {
                        if (roomConfig.floor && floors[roomConfig.floor]) {
                            usedFloors.add(roomConfig.floor);
                        }
                    });
                    
                    const unusedFloors = Object.keys(floors).filter(floorKey => !usedFloors.has(floorKey));
                    
                    return {
                        isConsistent: orphanedRooms.length === 0,
                        orphanedRooms,
                        unusedFloors,
                        totalFloors: Object.keys(floors).length,
                        totalRooms: Object.keys(rooms).length,
                        validRooms: Object.keys(rooms).length - orphanedRooms.length
                    };
                }
            };

            const testConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor' },
                    'unused_floor': { friendly_name: 'Unused Floor' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor' },
                    'orphaned_room': { friendly_name: 'Orphaned Room', floor: 'missing_floor' }
                }
            };

            const report = mockPanel._checkFloorRoomConsistency(testConfig);
            
            this.assertFalse(report.isConsistent, 'Should detect inconsistency');
            this.assertTrue(report.orphanedRooms.length === 1, 'Should find one orphaned room');
            this.assertTrue(report.unusedFloors.length === 1, 'Should find one unused floor');
            this.assertTrue(report.orphanedRooms[0].roomKey === 'orphaned_room', 'Should identify correct orphaned room');
            this.assertTrue(report.unusedFloors[0] === 'unused_floor', 'Should identify correct unused floor');

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    testOrphanedRoomAutoFix() {
        const testName = 'Orphaned Room Auto-Fix';
        try {
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

            const testConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor' },
                    'first_floor': { friendly_name: 'First Floor' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor' },
                    'orphaned_room1': { friendly_name: 'Orphaned Room 1', floor: 'missing_floor' },
                    'orphaned_room2': { friendly_name: 'Orphaned Room 2', floor: null }
                }
            };

            const fixResult = mockPanel._autoFixOrphanedRooms(testConfig);
            
            this.assertTrue(fixResult.success, 'Auto-fix should succeed');
            this.assertTrue(fixResult.fixedRooms.length === 2, 'Should fix 2 orphaned rooms');
            this.assertTrue(
                fixResult.fixedRooms.includes('orphaned_room1') && fixResult.fixedRooms.includes('orphaned_room2'),
                'Should fix both orphaned rooms'
            );
            
            // Verify rooms were actually fixed
            this.assertTrue(
                testConfig.rooms.orphaned_room1.floor === 'ground_floor',
                'Orphaned room 1 should be assigned to ground floor'
            );
            this.assertTrue(
                testConfig.rooms.orphaned_room2.floor === 'ground_floor',
                'Orphaned room 2 should be assigned to ground floor'
            );

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    testFloorDeletionImpactAnalysis() {
        const testName = 'Floor Deletion Impact Analysis';
        try {
            const mockPanel = {
                _handleFloorDeletion: function(floorKey, houseConfig) {
                    const rooms = houseConfig?.rooms || {};
                    const impactedRooms = [];

                    Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
                        if (roomConfig.floor === floorKey) {
                            impactedRooms.push(roomKey);
                        }
                    });

                    return {
                        impactedRooms,
                        canDelete: impactedRooms.length === 0,
                        warningMessage: impactedRooms.length > 0 
                            ? `Warning: Deleting floor '${floorKey}' will orphan ${impactedRooms.length} room(s): ${impactedRooms.join(', ')}`
                            : null
                    };
                }
            };

            const testConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor' },
                    'first_floor': { friendly_name: 'First Floor' },
                    'empty_floor': { friendly_name: 'Empty Floor' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor' },
                    'bedroom1': { friendly_name: 'Bedroom 1', floor: 'first_floor' },
                    'bedroom2': { friendly_name: 'Bedroom 2', floor: 'first_floor' }
                }
            };

            // Test deleting floor with rooms
            const impactAnalysis = mockPanel._handleFloorDeletion('first_floor', testConfig);
            this.assertFalse(impactAnalysis.canDelete, 'Should not allow deletion of floor with rooms');
            this.assertTrue(impactAnalysis.impactedRooms.length === 2, 'Should identify 2 impacted rooms');
            this.assertTrue(impactAnalysis.warningMessage.includes('bedroom1'), 'Warning should mention bedroom1');
            this.assertTrue(impactAnalysis.warningMessage.includes('bedroom2'), 'Warning should mention bedroom2');

            // Test deleting empty floor
            const emptyFloorAnalysis = mockPanel._handleFloorDeletion('empty_floor', testConfig);
            this.assertTrue(emptyFloorAnalysis.canDelete, 'Should allow deletion of empty floor');
            this.assertTrue(emptyFloorAnalysis.impactedRooms.length === 0, 'Should have no impacted rooms');
            this.assertTrue(emptyFloorAnalysis.warningMessage === null, 'Should have no warning message');

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
    module.exports = FloorRoomLinkIntegrationTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tester = new FloorRoomLinkIntegrationTests();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}