/**
 * Floor-Room Link Integrity Test Suite
 * Tests the integrity of the floor-room relationship and validation
 */

class FloorRoomLinkIntegrityTests {
    constructor() {
        this.testResults = [];
    }

    async runAllTests() {
        console.log('[DashView] Running Floor-Room Link Integrity Tests...');
        
        try {
            this.testOrphanedRoomDetection();
            this.testFloorDeletionImpact();
            this.testRoomFloorValidation();
            this.testFloorRoomConsistency();
            
            // Report results
            const passed = this.testResults.filter(t => t.passed).length;
            const total = this.testResults.length;
            
            if (passed === total) {
                console.log(`✅ All ${total} floor-room link integrity tests passed`);
                return true;
            } else {
                console.log(`❌ ${total - passed} out of ${total} floor-room link integrity tests failed`);
                this.testResults.filter(t => !t.passed).forEach(t => {
                    console.log(`  - ${t.name}: ${t.error}`);
                });
                return false;
            }
        } catch (error) {
            console.error('❌ Floor-room link integrity test suite failed:', error);
            return false;
        }
    }

    testOrphanedRoomDetection() {
        const testName = 'Orphaned Room Detection';
        try {
            // Test scenario: Room references a floor that doesn't exist
            const houseConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' },
                    'first_floor': { friendly_name: 'First Floor', icon: 'mdi:stairs-up' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor', icon: 'mdi:sofa' },
                    'bedroom': { friendly_name: 'Bedroom', floor: 'second_floor', icon: 'mdi:bed' }, // Orphaned - second_floor doesn't exist
                    'kitchen': { friendly_name: 'Kitchen', floor: 'ground_floor', icon: 'mdi:chef-hat' }
                }
            };

            const orphanedRooms = this.findOrphanedRooms(houseConfig);
            
            this.assertTrue(
                orphanedRooms.length === 1,
                'Should detect exactly one orphaned room'
            );
            
            this.assertTrue(
                orphanedRooms[0].roomKey === 'bedroom',
                'Should identify bedroom as orphaned room'
            );
            
            this.assertTrue(
                orphanedRooms[0].invalidFloor === 'second_floor',
                'Should identify second_floor as invalid floor reference'
            );

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    testFloorDeletionImpact() {
        const testName = 'Floor Deletion Impact Analysis';
        try {
            const houseConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' },
                    'first_floor': { friendly_name: 'First Floor', icon: 'mdi:stairs-up' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor', icon: 'mdi:sofa' },
                    'bedroom': { friendly_name: 'Bedroom', floor: 'first_floor', icon: 'mdi:bed' },
                    'office': { friendly_name: 'Office', floor: 'first_floor', icon: 'mdi:desk' }
                }
            };

            const impactedRooms = this.getFloorDeletionImpact(houseConfig, 'first_floor');
            
            this.assertTrue(
                impactedRooms.length === 2,
                'Should find 2 rooms impacted by first_floor deletion'
            );
            
            this.assertTrue(
                impactedRooms.includes('bedroom') && impactedRooms.includes('office'),
                'Should identify bedroom and office as impacted rooms'
            );

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    testRoomFloorValidation() {
        const testName = 'Room Floor Reference Validation';
        try {
            const houseConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' }
                }
            };

            // Test valid room
            const validRoom = {
                friendly_name: 'Living Room',
                floor: 'ground_floor',
                icon: 'mdi:sofa'
            };
            
            this.assertTrue(
                this.validateRoomFloorReference(validRoom, houseConfig),
                'Should validate room with existing floor reference'
            );

            // Test invalid room
            const invalidRoom = {
                friendly_name: 'Bedroom',
                floor: 'non_existent_floor',
                icon: 'mdi:bed'
            };
            
            this.assertFalse(
                this.validateRoomFloorReference(invalidRoom, houseConfig),
                'Should reject room with non-existent floor reference'
            );

            // Test room without floor
            const roomWithoutFloor = {
                friendly_name: 'Study',
                icon: 'mdi:desk'
            };
            
            this.assertFalse(
                this.validateRoomFloorReference(roomWithoutFloor, houseConfig),
                'Should reject room without floor assignment'
            );

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    testFloorRoomConsistency() {
        const testName = 'Floor-Room Configuration Consistency';
        try {
            const houseConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' },
                    'first_floor': { friendly_name: 'First Floor', icon: 'mdi:stairs-up' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor', icon: 'mdi:sofa' },
                    'kitchen': { friendly_name: 'Kitchen', floor: 'ground_floor', icon: 'mdi:chef-hat' },
                    'bedroom': { friendly_name: 'Bedroom', floor: 'first_floor', icon: 'mdi:bed' }
                }
            };

            const consistencyReport = this.checkFloorRoomConsistency(houseConfig);
            
            this.assertTrue(
                consistencyReport.isConsistent,
                'Should report consistent configuration'
            );
            
            this.assertTrue(
                consistencyReport.orphanedRooms.length === 0,
                'Should have no orphaned rooms'
            );
            
            this.assertTrue(
                consistencyReport.unusedFloors.length === 0,
                'Should have no unused floors'
            );

            // Test with inconsistent configuration
            const inconsistentConfig = {
                floors: {
                    'ground_floor': { friendly_name: 'Ground Floor', icon: 'mdi:home' },
                    'unused_floor': { friendly_name: 'Unused Floor', icon: 'mdi:stairs' }
                },
                rooms: {
                    'living_room': { friendly_name: 'Living Room', floor: 'ground_floor', icon: 'mdi:sofa' },
                    'orphaned_room': { friendly_name: 'Orphaned Room', floor: 'missing_floor', icon: 'mdi:bed' }
                }
            };

            const inconsistentReport = this.checkFloorRoomConsistency(inconsistentConfig);
            
            this.assertFalse(
                inconsistentReport.isConsistent,
                'Should report inconsistent configuration'
            );
            
            this.assertTrue(
                inconsistentReport.orphanedRooms.length === 1,
                'Should detect orphaned room'
            );
            
            this.assertTrue(
                inconsistentReport.unusedFloors.length === 1,
                'Should detect unused floor'
            );

            this.testResults.push({ name: testName, passed: true });
        } catch (error) {
            this.testResults.push({ name: testName, passed: false, error: error.message });
        }
    }

    // Helper methods for validation logic

    findOrphanedRooms(houseConfig) {
        const floors = houseConfig.floors || {};
        const rooms = houseConfig.rooms || {};
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
    }

    getFloorDeletionImpact(houseConfig, floorKey) {
        const rooms = houseConfig.rooms || {};
        const impactedRooms = [];

        Object.entries(rooms).forEach(([roomKey, roomConfig]) => {
            if (roomConfig.floor === floorKey) {
                impactedRooms.push(roomKey);
            }
        });

        return impactedRooms;
    }

    validateRoomFloorReference(roomConfig, houseConfig) {
        const floors = houseConfig.floors || {};
        return roomConfig.floor && floors[roomConfig.floor];
    }

    checkFloorRoomConsistency(houseConfig) {
        const floors = houseConfig.floors || {};
        const rooms = houseConfig.rooms || {};
        
        const orphanedRooms = this.findOrphanedRooms(houseConfig);
        
        // Find unused floors
        const usedFloors = new Set();
        Object.values(rooms).forEach(roomConfig => {
            if (roomConfig.floor && floors[roomConfig.floor]) {
                usedFloors.add(roomConfig.floor);
            }
        });
        
        const unusedFloors = Object.keys(floors).filter(floorKey => !usedFloors.has(floorKey));
        
        return {
            isConsistent: orphanedRooms.length === 0,
            orphanedRooms: orphanedRooms.map(o => o.roomKey),
            unusedFloors,
            totalFloors: Object.keys(floors).length,
            totalRooms: Object.keys(rooms).length,
            validRooms: Object.keys(rooms).length - orphanedRooms.length
        };
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
    module.exports = FloorRoomLinkIntegrityTests;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tester = new FloorRoomLinkIntegrityTests();
    tester.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}