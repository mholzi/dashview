// Test configuration summary functionality - Principle 7 & 12
console.log('[DashView] Running Configuration Summary tests...');

// Mock shadow DOM element
function createMockElement(tag, id = null) {
    return {
        tagName: tag.toUpperCase(),
        id: id,
        innerHTML: '',
        querySelector: (selector) => {
            if (selector === `#${id}`) return this;
            return null;
        },
        getElementById: (searchId) => {
            if (searchId === id) return this;
            return null;
        }
    };
}

// Mock DashView panel class for testing
class MockConfigSummaryPanel {
    constructor() {
        this._adminLocalState = {
            floorsConfig: null,
            roomsConfig: null,
            houseConfig: null,
            isLoaded: false
        };
        
        // Mock shadow root
        this.shadowRoot = {
            getElementById: (id) => {
                if (id === 'config-summary-container') {
                    return createMockElement('div', id);
                }
                return null;
            }
        };
    }

    // Update configuration summary - Principle 12
    _updateAdminSummary() {
        const shadow = this.shadowRoot;
        if (!shadow) return;

        const container = shadow.getElementById('config-summary-container');
        
        if (!container) return;

        // Handle both new house config and legacy formats
        let floors = {};
        let rooms = {};
        
        if (this._adminLocalState.houseConfig) {
            // New house configuration format
            floors = this._adminLocalState.houseConfig.floors || {};
            rooms = this._adminLocalState.houseConfig.rooms || {};
        } else if (this._adminLocalState.floorsConfig && this._adminLocalState.roomsConfig) {
            // Legacy configuration format
            floors = this._adminLocalState.floorsConfig.floor_icons ? 
                this._adminLocalState.floorsConfig.floor_icons : {};
            rooms = this._adminLocalState.roomsConfig || {};
        } else {
            container.innerHTML = '<p>Could not load configuration summary.</p>';
            return;
        }

        const stats = {
            Floors: Object.keys(floors).length,
            Rooms: Object.keys(rooms).length,
        };

        const entityCounts = {};

        // Initialize counters for known entity types
        const knownEntityTypes = [
            'motion', 'window', 'smoke', 'vibration', 'music', 'tv',
            'dishwasher', 'washing', 'dryer', 'freezer', 'mower',
            'lights', 'covers', 'media_players'
        ];
        knownEntityTypes.forEach(type => entityCounts[type] = 0);

        Object.values(rooms).forEach(room => {
            if (room.lights) entityCounts.lights += room.lights.length;
            if (room.covers) entityCounts.covers += room.covers.length;
            if (room.media_players) entityCounts.media_players += room.media_players.length;

            if (room.header_entities) {
                room.header_entities.forEach(entity => {
                    if (entityCounts.hasOwnProperty(entity.entity_type)) {
                        entityCounts[entity.entity_type]++;
                    }
                });
            }
        });

        let summaryHTML = '';
        Object.entries(stats).forEach(([name, count]) => {
            summaryHTML += `<div class="summary-item"><strong>${name}:</strong><span>${count}</span></div>`;
        });

        Object.entries(entityCounts).forEach(([type, count]) => {
            if (count > 0) {
                const name = type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                summaryHTML += `<div class="summary-item"><strong>${name}:</strong><span>${count}</span></div>`;
            }
        });

        if (summaryHTML === '') {
            container.innerHTML = '<p>No items found in configuration.</p>';
        } else {
            container.innerHTML = summaryHTML;
        }
        
        return container.innerHTML; // Return for testing
    }
}

// Test class for configuration summary functionality
class ConfigSummaryTests {
    constructor() {
        this.testsPassed = 0;
        this.testsFailed = 0;
    }

    assert(condition, message) {
        if (condition) {
            this.testsPassed++;
            console.log(`✓ ${message}`);
        } else {
            this.testsFailed++;
            console.error(`✗ ${message}`);
        }
    }

    // Test house configuration summary
    testHouseConfigSummary() {
        console.log('[DashView] Testing house configuration summary...');
        
        const panel = new MockConfigSummaryPanel();
        
        // Set up mock house configuration
        panel._adminLocalState.houseConfig = {
            floors: {
                ground_floor: { name: 'Ground Floor', icon: 'mdi:home' },
                first_floor: { name: 'First Floor', icon: 'mdi:home-floor-1' }
            },
            rooms: {
                living_room: {
                    friendly_name: 'Living Room',
                    lights: ['light.living_room_1', 'light.living_room_2'],
                    covers: ['cover.living_room_blinds'],
                    media_players: ['media_player.living_room_tv'],
                    header_entities: [
                        { entity: 'binary_sensor.motion_living_room', entity_type: 'motion' },
                        { entity: 'binary_sensor.window_living_room', entity_type: 'window' }
                    ]
                },
                kitchen: {
                    friendly_name: 'Kitchen',
                    lights: ['light.kitchen_1'],
                    header_entities: [
                        { entity: 'sensor.dishwasher_status', entity_type: 'dishwasher' }
                    ]
                }
            }
        };
        
        const result = panel._updateAdminSummary();
        
        this.assert(result.includes('Floors:</strong><span>2</span>'), 'House config should show 2 floors');
        this.assert(result.includes('Rooms:</strong><span>2</span>'), 'House config should show 2 rooms');
        this.assert(result.includes('Lights:</strong><span>3</span>'), 'House config should show 3 lights');
        this.assert(result.includes('Covers:</strong><span>1</span>'), 'House config should show 1 cover');
        this.assert(result.includes('Media Players:</strong><span>1</span>'), 'House config should show 1 media player');
        this.assert(result.includes('Motion:</strong><span>1</span>'), 'House config should show 1 motion sensor');
        this.assert(result.includes('Window:</strong><span>1</span>'), 'House config should show 1 window sensor');
        this.assert(result.includes('Dishwasher:</strong><span>1</span>'), 'House config should show 1 dishwasher sensor');
    }

    // Test legacy configuration summary
    testLegacyConfigSummary() {
        console.log('[DashView] Testing legacy configuration summary...');
        
        const panel = new MockConfigSummaryPanel();
        
        // Set up mock legacy configuration
        panel._adminLocalState.floorsConfig = {
            floor_icons: {
                ground_floor: 'mdi:home',
                first_floor: 'mdi:home-floor-1'
            }
        };
        
        panel._adminLocalState.roomsConfig = {
            living_room: {
                friendly_name: 'Living Room',
                lights: ['light.living_room_1'],
                covers: ['cover.living_room_blinds']
            }
        };
        
        const result = panel._updateAdminSummary();
        
        this.assert(result.includes('Floors:</strong><span>2</span>'), 'Legacy config should show 2 floors');
        this.assert(result.includes('Rooms:</strong><span>1</span>'), 'Legacy config should show 1 room');
        this.assert(result.includes('Lights:</strong><span>1</span>'), 'Legacy config should show 1 light');
        this.assert(result.includes('Covers:</strong><span>1</span>'), 'Legacy config should show 1 cover');
    }

    // Test empty configuration summary
    testEmptyConfigSummary() {
        console.log('[DashView] Testing empty configuration summary...');
        
        const panel = new MockConfigSummaryPanel();
        
        // Set up empty configuration
        panel._adminLocalState.houseConfig = {
            floors: {},
            rooms: {}
        };
        
        const result = panel._updateAdminSummary();
        
        this.assert(result.includes('Floors:</strong><span>0</span>'), 'Empty config should show 0 floors');
        this.assert(result.includes('Rooms:</strong><span>0</span>'), 'Empty config should show 0 rooms');
    }

    // Test no configuration loaded
    testNoConfigSummary() {
        console.log('[DashView] Testing no configuration summary...');
        
        const panel = new MockConfigSummaryPanel();
        
        const result = panel._updateAdminSummary();
        
        this.assert(result.includes('Could not load configuration summary'), 'Should show error message when no config loaded');
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Starting configuration summary tests...');
        
        try {
            this.testHouseConfigSummary();
            this.testLegacyConfigSummary();
            this.testEmptyConfigSummary();
            this.testNoConfigSummary();
            
            console.log(`[DashView] Configuration summary tests completed: ${this.testsPassed} passed, ${this.testsFailed} failed`);
            return this.testsFailed === 0;
        } catch (error) {
            console.error('[DashView] Configuration summary test error:', error);
            return false;
        }
    }
}

// Run tests if called directly
if (typeof module === 'undefined') {
    const tests = new ConfigSummaryTests();
    tests.runAllTests().then(success => {
        process.exit(success ? 0 : 1);
    });
}

// Export for use by test runner
if (typeof module !== 'undefined') {
    module.exports = { ConfigSummaryTests };
}