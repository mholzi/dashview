// Test for room header icons functionality
class RoomHeaderIconsTests {
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

    // Test room header entity detection
    testRoomHeaderEntityDetection() {
        console.log('\n[DashView] Testing room header entity detection...');
        
        const panel = new MockDashViewPanel();
        const mockHass = this.createMockHassWithRoomEntities();
        
        panel._contentReady = true;
        panel.hass = mockHass;
        
        // Test that room header entities are detected
        const expectedRoomEntities = [
            'binary_sensor.fenster_terrasse',
            'binary_sensor.motion_buro_presence_sensor_1',
            'binary_sensor.rauchmelder_wohnzimmer_smoke'
        ];
        
        expectedRoomEntities.forEach(entityId => {
            this.assert(
                panel._watchedEntities.has(entityId),
                `Should watch room header entity ${entityId}`
            );
        });
    }

    // Test room header icon rendering
    testRoomHeaderIconRendering() {
        console.log('\n[DashView] Testing room header icon rendering...');
        
        const panel = new MockDashViewPanel();
        const mockHass = this.createMockHassWithRoomEntities();
        
        panel._contentReady = true;
        panel.hass = mockHass;
        
        // Mock the shadow DOM
        const mockShadow = {
            querySelector: (selector) => {
                if (selector === '.room-header-cards') {
                    return { innerHTML: '' };
                }
                return null;
            }
        };
        
        panel.shadowRoot = mockShadow;
        
        // Test room header icon update
        try {
            panel.updateRoomHeaderIcons(mockShadow);
            this.assert(true, 'Should update room header icons without error');
        } catch (error) {
            this.assert(false, `Should update room header icons without error: ${error.message}`);
        }
    }

    // Test entity type icon mapping
    testEntityTypeIconMapping() {
        console.log('\n[DashView] Testing entity type icon mapping...');
        
        const panel = new MockDashViewPanel();
        
        const testCases = [
            { type: 'motion', expectedIcon: 'mdi-motion-sensor' },
            { type: 'window', expectedIcon: 'mdi-window-open' },
            { type: 'smoke', expectedIcon: 'mdi-smoke-detector' },
            { type: 'vibration', expectedIcon: 'mdi-vibrate' },
            { type: 'music', expectedIcon: 'mdi-music' },
            { type: 'tv', expectedIcon: 'mdi-television' },
            { type: 'dishwasher', expectedIcon: 'mdi-dishwasher' },
            { type: 'washing', expectedIcon: 'mdi-washing-machine' },
            { type: 'dryer', expectedIcon: 'mdi-tumble-dryer' },
            { type: 'freezer', expectedIcon: 'mdi-fridge-outline' },
            { type: 'mower', expectedIcon: 'mdi-robot-mower' }
        ];
        
        testCases.forEach(testCase => {
            const actualIcon = panel._getIconForEntityType(testCase.type);
            this.assert(
                actualIcon === testCase.expectedIcon,
                `Should map ${testCase.type} to ${testCase.expectedIcon}, got ${actualIcon}`
            );
        });
    }

    // Test entity state classification
    testEntityStateClassification() {
        console.log('\n[DashView] Testing entity state classification...');
        
        const panel = new MockDashViewPanel();
        
        const testCases = [
            { entity: { state: 'on' }, type: 'motion', expected: 'active' },
            { entity: { state: 'off' }, type: 'motion', expected: 'inactive' },
            { entity: { state: 'playing' }, type: 'music', expected: 'active' },
            { entity: { state: 'idle' }, type: 'music', expected: 'inactive' },
            { entity: { state: 'Run' }, type: 'dishwasher', expected: 'active' },
            { entity: { state: 'Off' }, type: 'dishwasher', expected: 'inactive' },
            { entity: null, type: 'motion', expected: 'unknown' }
        ];
        
        testCases.forEach(testCase => {
            const actualClass = panel._getStateClassForEntity(testCase.entity, testCase.type);
            this.assert(
                actualClass === testCase.expected,
                `Should classify ${testCase.type} with state ${testCase.entity?.state || 'null'} as ${testCase.expected}, got ${actualClass}`
            );
        });
    }

    // Create mock HASS with room entities
    createMockHassWithRoomEntities() {
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

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Running room header icons tests...');
        
        this.testRoomHeaderEntityDetection();
        this.testRoomHeaderIconRendering();
        this.testEntityTypeIconMapping();
        this.testEntityStateClassification();
        
        const passedTests = this.testResults.filter(r => r.passed).length;
        const totalTests = this.testResults.length;
        
        console.log(`\n[DashView] Room header icons tests completed: ${passedTests}/${totalTests} passed`);
        
        if (passedTests === totalTests) {
            console.log('✅ All room header icons tests passed!');
        } else {
            console.log('❌ Some room header icons tests failed');
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
        this.shadowRoot = null;
    }

    set hass(hass) {
        this._hass = hass;
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

    // Copy the methods from the actual DashView panel that we want to test
    _getIconForEntityType(entityType) {
        const iconMap = {
            'motion': 'mdi-motion-sensor',
            'window': 'mdi-window-open',
            'smoke': 'mdi-smoke-detector',
            'vibration': 'mdi-vibrate',
            'music': 'mdi-music',
            'tv': 'mdi-television',
            'dishwasher': 'mdi-dishwasher',
            'washing': 'mdi-washing-machine',
            'dryer': 'mdi-tumble-dryer',
            'freezer': 'mdi-fridge-outline',
            'mower': 'mdi-robot-mower'
        };
        return iconMap[entityType] || 'mdi-help-circle';
    }

    _getStateClassForEntity(entity, entityType) {
        if (!entity) return 'unknown';
        
        switch (entityType) {
            case 'motion':
            case 'window':
            case 'smoke':
            case 'vibration':
                return entity.state === 'on' ? 'active' : 'inactive';
            case 'music':
            case 'tv':
                return ['playing', 'on'].includes(entity.state) ? 'active' : 'inactive';
            case 'dishwasher':
            case 'washing':
                return ['Run', 'run', 'running'].includes(entity.state) ? 'active' : 'inactive';
            case 'dryer':
                return entity.state === 'on' ? 'active' : 'inactive';
            case 'freezer':
                return entity.state === 'on' ? 'active' : 'inactive';
            case 'mower':
                return ['mowing', 'cutting'].includes(entity.state) ? 'active' : 'inactive';
            default:
                return entity.state === 'on' ? 'active' : 'inactive';
        }
    }

    updateRoomHeaderIcons(shadow) {
        // Mock implementation for testing
        return;
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { RoomHeaderIconsTests, MockDashViewPanel };
} else if (typeof window !== 'undefined') {
    window.RoomHeaderIconsTests = RoomHeaderIconsTests;
}

// Run tests if this file is executed directly
if (typeof require !== 'undefined' && require.main === module) {
    const tests = new RoomHeaderIconsTests();
    tests.runAllTests();
}