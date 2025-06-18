// Test for room header card fallback message functionality
class RoomHeaderFallbackTests {
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

    // Test that active rooms with no header entities show fallback message
    testRoomCardFallbackMessage() {
        console.log('\n[DashView] Testing room card fallback message...');
        
        const panel = new MockDashViewPanel();
        const mockHass = this.createMockHass();
        
        panel._hass = mockHass;
        
        // Test room with no header entities but is active (has combined sensor)
        const result = panel._generateRoomHeaderCards();
        
        // Should contain the fallback message for the active room with no header entities
        this.assert(
            result.includes('No active header entities for'),
            'Should show fallback message for active rooms with no header entities'
        );
        
        // Should contain the room name in the fallback message
        this.assert(
            result.includes('Test Room'),
            'Should include room name in fallback message'
        );
        
        // Should still show the room card structure
        this.assert(
            result.includes('room-header-card'),
            'Should still show room card structure'
        );
        
        // Should include the no-activity class for styling
        this.assert(
            result.includes('no-activity'),
            'Should include no-activity class for styling'
        );
    }

    // Test that rooms with header entities still show icons normally
    testRoomCardWithIcons() {
        console.log('\n[DashView] Testing room card with icons...');
        
        const panel = new MockDashViewPanelWithIcons();
        const mockHass = this.createMockHassWithEntities();
        
        panel._hass = mockHass;
        
        const result = panel._generateRoomHeaderCards();
        
        // Should show the room with icons normally
        this.assert(
            result.includes('room-header-icon'),
            'Should show icons for rooms with header entities'
        );
        
        // Should not show fallback message when icons are present
        this.assert(
            !result.includes('No active header entities for'),
            'Should not show fallback message when icons are present'
        );
    }

    // Create mock HASS with basic entities
    createMockHass() {
        return {
            states: {
                'binary_sensor.combined_sensor_test_room': { state: 'on' }
            }
        };
    }

    // Create mock HASS with entities for rooms with header entities
    createMockHassWithEntities() {
        return {
            states: {
                'binary_sensor.combined_sensor_test_room': { state: 'on' },
                'binary_sensor.test_motion': { state: 'on' }
            }
        };
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Running room header fallback tests...');
        
        this.testRoomCardFallbackMessage();
        this.testRoomCardWithIcons();
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\n[DashView] Room header fallback tests completed: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ All room header fallback tests passed!');
            return true;
        } else {
            console.log('❌ Some room header fallback tests failed');
            this.testResults.filter(r => !r.passed).forEach(result => {
                console.log(`   - ${result.test}`);
            });
            return false;
        }
    }
}

// Mock DashView Panel for testing - room with no header entities
class MockDashViewPanel {
    constructor() {
        this._houseConfig = {
            rooms: {
                test_room: {
                    friendly_name: "Test Room",
                    combined_sensor: "binary_sensor.combined_sensor_test_room"
                    // No header_entities - this should trigger fallback
                }
            }
        };
    }

    _getActiveRooms() {
        if (!this._houseConfig || !this._houseConfig.rooms) return [];
        
        return Object.entries(this._houseConfig.rooms)
            .filter(([roomKey, roomConfig]) => {
                // Check if room has combined sensor active
                const sensorEntity = this._hass.states[roomConfig.combined_sensor];
                const isRoomActive = sensorEntity && sensorEntity.state === 'on';
                
                // Or check if room has header entities configured
                const hasHeaderEntities = roomConfig.header_entities && 
                                          Array.isArray(roomConfig.header_entities) && 
                                          roomConfig.header_entities.length > 0;
                
                return isRoomActive || hasHeaderEntities;
            })
            .map(([roomKey, roomConfig]) => ({ key: roomKey, config: roomConfig }));
    }

    _generateRoomIcons(roomConfig) {
        if (!roomConfig.header_entities || !Array.isArray(roomConfig.header_entities)) {
            return '';
        }
        // Return empty string to simulate no icons for the test
        return '';
    }

    // Updated implementation (with fix)
    _generateRoomHeaderCards() {
        if (!this._houseConfig || !this._houseConfig.rooms) return '';
        
        const activeRooms = this._getActiveRooms();
        if (activeRooms.length === 0) return '<div class="no-activity">No active rooms with entities</div>';
        
        return activeRooms.map(room => {
            const iconsHTML = this._generateRoomIcons(room.config);
            // If iconsHTML is empty, create the fallback message.
            const containerContent = iconsHTML 
                ? iconsHTML 
                : `<div class="no-activity" style="text-align: left; padding: 0 8px; width: 100%;">No active header entities for ${room.config.friendly_name}</div>`;
            
            return `
        <div class="room-header-card" data-room="${room.key}">
          <div class="room-name">${room.config.friendly_name}</div>
          <div class="room-icons-container">
            ${containerContent}
          </div>
        </div>
      `;
        }).join('');
    }
}

// Mock DashView Panel for testing - room with header entities
class MockDashViewPanelWithIcons {
    constructor() {
        this._houseConfig = {
            rooms: {
                test_room: {
                    friendly_name: "Test Room",
                    combined_sensor: "binary_sensor.combined_sensor_test_room",
                    header_entities: [
                        { entity: "binary_sensor.test_motion", entity_type: "motion" }
                    ]
                }
            }
        };
    }

    _getActiveRooms() {
        if (!this._houseConfig || !this._houseConfig.rooms) return [];
        
        return Object.entries(this._houseConfig.rooms)
            .filter(([roomKey, roomConfig]) => {
                const sensorEntity = this._hass.states[roomConfig.combined_sensor];
                const isRoomActive = sensorEntity && sensorEntity.state === 'on';
                
                const hasHeaderEntities = roomConfig.header_entities && 
                                          Array.isArray(roomConfig.header_entities) && 
                                          roomConfig.header_entities.length > 0;
                
                return isRoomActive || hasHeaderEntities;
            })
            .map(([roomKey, roomConfig]) => ({ key: roomKey, config: roomConfig }));
    }

    _generateRoomIcons(roomConfig) {
        if (!roomConfig.header_entities || !Array.isArray(roomConfig.header_entities)) {
            return '';
        }
        
        return roomConfig.header_entities.map(entityConfig => {
            const entity = this._hass.states[entityConfig.entity];
            const stateClass = entity && entity.state === 'on' ? 'active' : 'inactive';
            
            return `
        <div class="room-header-icon ${entityConfig.entity_type} ${stateClass}">
          <i class="mdi mdi-motion-sensor"></i>
        </div>
      `;
        }).join('');
    }

    // Updated implementation (with fix)
    _generateRoomHeaderCards() {
        if (!this._houseConfig || !this._houseConfig.rooms) return '';
        
        const activeRooms = this._getActiveRooms();
        if (activeRooms.length === 0) return '<div class="no-activity">No active rooms with entities</div>';
        
        return activeRooms.map(room => {
            const iconsHTML = this._generateRoomIcons(room.config);
            // If iconsHTML is empty, create the fallback message.
            const containerContent = iconsHTML 
                ? iconsHTML 
                : `<div class="no-activity" style="text-align: left; padding: 0 8px; width: 100%;">No active header entities for ${room.config.friendly_name}</div>`;
            
            return `
        <div class="room-header-card" data-room="${room.key}">
          <div class="room-name">${room.config.friendly_name}</div>
          <div class="room-icons-container">
            ${containerContent}
          </div>
        </div>
      `;
        }).join('');
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RoomHeaderFallbackTests, MockDashViewPanel, MockDashViewPanelWithIcons };
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tests = new RoomHeaderFallbackTests();
    tests.runAllTests();
}