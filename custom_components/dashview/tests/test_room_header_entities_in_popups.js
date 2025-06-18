// Test for room header entities in individual room popups functionality
class RoomHeaderEntitiesInPopupsTests {
    constructor() {
        this.passed = 0;
        this.failed = 0;
    }

    assert(condition, message) {
        if (condition) {
            this.passed++;
            console.log(`✓ ${message}`);
        } else {
            this.failed++;
            console.error(`✗ ${message}`);
        }
    }

    // Test that room popups include header entities
    testRoomPopupHeaderEntities() {
        console.log('\n[DashView] Testing room popup includes header entities...');
        
        const panel = new MockDashViewPanel();
        
        // Test room configuration with header entities
        const roomConfig = {
            friendly_name: "Test Room",
            icon: "mdi-home",
            header_entities: [
                { entity: "binary_sensor.test_motion", entity_type: "motion" },
                { entity: "binary_sensor.test_window", entity_type: "window" },
                { entity: "sensor.test_dishwasher", entity_type: "dishwasher" }
            ]
        };
        
        // Mock HASS states
        panel._hass = {
            states: {
                'binary_sensor.test_motion': {
                    state: 'on',
                    last_changed: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
                    attributes: { friendly_name: 'Test Motion' }
                },
                'binary_sensor.test_window': {
                    state: 'on',
                    attributes: { friendly_name: 'Test Window' }
                },
                'sensor.test_dishwasher': {
                    state: 'running',
                    attributes: { friendly_name: 'Test Dishwasher' }
                },
                'sensor.geschirrspuler_remaining_program_time': {
                    state: new Date(Date.now() + 1800000).toISOString() // 30 minutes from now
                }
            }
        };
        
        // Generate room header entities HTML
        const headerEntitiesHTML = panel._generateRoomHeaderEntitiesForPopup(roomConfig);
        
        // Verify that HTML was generated
        this.assert(
            headerEntitiesHTML && headerEntitiesHTML.trim().length > 0,
            'Room header entities HTML should be generated'
        );
        
        // Verify the structure contains the correct classes
        this.assert(
            headerEntitiesHTML.includes('room-header-entities'),
            'HTML should contain room-header-entities wrapper'
        );
        
        this.assert(
            headerEntitiesHTML.includes('header-entities-container'),
            'HTML should contain header-entities-container'
        );
        
        this.assert(
            headerEntitiesHTML.includes('header-info-chip'),
            'HTML should contain header-info-chip elements'
        );
        
        // Verify motion sensor is displayed (always shown)
        this.assert(
            headerEntitiesHTML.includes('data-entity="binary_sensor.test_motion"'),
            'Motion sensor should be included'
        );
        
        // Verify window sensor is displayed (on state)
        this.assert(
            headerEntitiesHTML.includes('data-entity="binary_sensor.test_window"'),
            'Window sensor should be included when on'
        );
        
        // Verify dishwasher sensor is displayed (running state) 
        this.assert(
            headerEntitiesHTML.includes('data-entity="sensor.test_dishwasher"'),
            'Dishwasher sensor should be included when running'
        );
    }

    // Test header entity display logic for different states
    testHeaderEntityDisplayLogic() {
        console.log('\n[DashView] Testing header entity display logic...');
        
        const panel = new MockDashViewPanel();
        
        // Test motion sensor (always shown)
        panel._hass = {
            states: {
                'binary_sensor.motion_test': {
                    state: 'off',
                    last_changed: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
                    attributes: { friendly_name: 'Motion Test' }
                }
            }
        };
        
        const motionEntity = panel._hass.states['binary_sensor.motion_test'];
        
        // Motion should always be displayed
        this.assert(
            panel._shouldDisplayHeaderEntity(motionEntity, 'motion'),
            'Motion sensor should always be displayed'
        );
        
        // Test motion sensor name formatting
        const motionName = panel._getHeaderEntityName(motionEntity, 'motion');
        this.assert(
            motionName.includes('h ago'),
            'Motion sensor should show time since last motion'
        );
        
        // Test TV sensor (only when playing)
        panel._hass.states['media_player.test_tv'] = {
            state: 'playing',
            attributes: { friendly_name: 'Test TV' }
        };
        
        const tvEntity = panel._hass.states['media_player.test_tv'];
        this.assert(
            panel._shouldDisplayHeaderEntity(tvEntity, 'tv'),
            'TV should be displayed when playing'
        );
        
        // Test TV when not playing
        panel._hass.states['media_player.test_tv'].state = 'idle';
        this.assert(
            !panel._shouldDisplayHeaderEntity(tvEntity, 'tv'),
            'TV should not be displayed when not playing'
        );
    }

    // Test header entity icon mapping
    testHeaderEntityIcons() {
        console.log('\n[DashView] Testing header entity icon mapping...');
        
        const panel = new MockDashViewPanel();
        
        // Mock HASS states
        panel._hass = {
            states: {
                'binary_sensor.motion_test': { state: 'on' },
                'binary_sensor.motion_off': { state: 'off' }
            }
        };
        
        // Test motion sensor icons
        const motionOnIcon = panel._getHeaderEntityIcon(panel._hass.states['binary_sensor.motion_test'], 'motion');
        const motionOffIcon = panel._getHeaderEntityIcon(panel._hass.states['binary_sensor.motion_off'], 'motion');
        
        this.assert(
            motionOnIcon === 'mdi-motion-sensor',
            'Motion sensor should use mdi-motion-sensor when on'
        );
        
        this.assert(
            motionOffIcon === 'mdi-motion-sensor-off',
            'Motion sensor should use mdi-motion-sensor-off when off'
        );
        
        // Test other entity types
        const windowIcon = panel._getHeaderEntityIcon({}, 'window');
        const dishwasherIcon = panel._getHeaderEntityIcon({}, 'dishwasher');
        const mowerIcon = panel._getHeaderEntityIcon({}, 'mower');
        
        this.assert(
            windowIcon === 'mdi-window-open-variant',
            'Window should use correct icon'
        );
        
        this.assert(
            dishwasherIcon === 'mdi-dishwasher',
            'Dishwasher should use correct icon'
        );
        
        this.assert(
            mowerIcon === 'mdi-robot-mower',
            'Mower should use correct icon'
        );
    }

    // Test room without header entities
    testRoomWithoutHeaderEntities() {
        console.log('\n[DashView] Testing room without header entities...');
        
        const panel = new MockDashViewPanel();
        
        // Test room configuration without header entities
        const roomConfig = {
            friendly_name: "Empty Room",
            icon: "mdi-home"
        };
        
        // Generate room header entities HTML
        const headerEntitiesHTML = panel._generateRoomHeaderEntitiesForPopup(roomConfig);
        
        // Verify that no HTML was generated
        this.assert(
            !headerEntitiesHTML || headerEntitiesHTML.trim() === '',
            'Room without header entities should not generate HTML'
        );
    }

    // Run all tests
    async runAllTests() {
        console.log('[DashView] Running Room Header Entities in Popups tests...');
        
        this.testRoomPopupHeaderEntities();
        this.testHeaderEntityDisplayLogic();
        this.testHeaderEntityIcons();
        this.testRoomWithoutHeaderEntities();
        
        const total = this.passed + this.failed;
        console.log(`\n[DashView] Room Header Entities in Popups tests completed: ${this.passed}/${total} passed`);
        
        if (this.failed > 0) {
            throw new Error(`${this.failed} Room Header Entities in Popups tests failed`);
        }
    }
}

// Mock DashView Panel for testing
class MockDashViewPanel {
    constructor() {
        this._hass = null;
        this._houseConfig = { rooms: {} };
    }

    // Copy the actual methods from the main class for testing
    _generateRoomHeaderEntitiesForPopup(roomConfig) {
        if (!roomConfig.header_entities || !Array.isArray(roomConfig.header_entities)) {
            return '';
        }

        // Filter to only show active/relevant entities based on display logic
        const activeEntities = roomConfig.header_entities.filter(entityConfig => {
            const entity = this._hass.states[entityConfig.entity];
            if (!entity) return false;
            
            return this._shouldDisplayHeaderEntity(entity, entityConfig.entity_type);
        });

        if (activeEntities.length === 0) {
            return '';
        }

        // Generate the horizontal stack of entity cards
        const entityCards = activeEntities.map(entityConfig => {
            const entity = this._hass.states[entityConfig.entity];
            const name = this._getHeaderEntityName(entity, entityConfig.entity_type);
            const icon = this._getHeaderEntityIcon(entity, entityConfig.entity_type);
            const backgroundColor = this._getHeaderEntityBackground(entity, entityConfig.entity_type);
            const textColor = this._getHeaderEntityTextColor(entity, entityConfig.entity_type);

            return `
                <div class="header-info-chip" 
                     data-entity="${entityConfig.entity}" 
                     data-type="${entityConfig.entity_type}"
                     style="background: ${backgroundColor};">
                  <div class="chip-icon-container">
                    <i class="mdi ${icon}" style="color: var(--gray000);"></i>
                  </div>
                  <div class="chip-name" style="color: ${textColor};">${name}</div>
                </div>
            `;
        }).join('');

        return `
          <div class="room-header-entities">
            <div class="header-entities-container">
              ${entityCards}
            </div>
          </div>
        `;
    }

    _shouldDisplayHeaderEntity(entity, entityType) {
        if (!entity) return false;

        const state = entity.state;
        
        switch (entityType) {
            case 'motion':
                return true; // Always show motion sensors
            case 'music':
            case 'tv':
                return state === 'playing';
            case 'dishwasher':
            case 'washing':
                return ['Run', 'run', 'running'].includes(state);
            case 'freezer':
                // Check for alarm states
                const doorAlarm = this._hass.states['sensor.gefrierschrank_door_alarm_freezer']?.state;
                const tempAlarm = this._hass.states['sensor.gefrierschrank_temperature_alarm_freezer']?.state;
                return (doorAlarm === 'present' || tempAlarm === 'present');
            case 'mower':
                const error = entity.attributes?.error;
                return ['cleaning', 'error'].includes(state) && error !== 'OFF_DISABLED';
            default:
                return state === 'on';
        }
    }

    _getHeaderEntityName(entity, entityType) {
        if (!entity) return '–';

        switch (entityType) {
            case 'dishwasher':
                const remaining = this._hass.states['sensor.geschirrspuler_remaining_program_time'];
                if (!remaining || !remaining.state || ['unknown', 'unavailable'].includes(remaining.state)) {
                    return 'Unknown';
                }
                const end = new Date(remaining.state).getTime();
                const now = new Date().getTime();
                const diffMin = Math.round((end - now) / 60000);
                return diffMin > 0 ? `in ${diffMin}m` : 'Ready';

            case 'motion':
                const lastChanged = new Date(entity.last_changed);
                const currentTime = new Date();
                const diffSec = Math.floor((currentTime - lastChanged) / 1000);
                if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
                if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
                return `${Math.floor(diffSec / 86400)}d ago`;

            default:
                return entity.attributes?.friendly_name || '–';
        }
    }

    _getHeaderEntityIcon(entity, entityType) {
        switch (entityType) {
            case 'motion':
                return entity.state === 'off' ? 'mdi-motion-sensor-off' : 'mdi-motion-sensor';
            case 'window':
                return 'mdi-window-open-variant';
            case 'smoke':
                return 'mdi-smoke-detector-variant-alert';
            case 'music':
                return 'mdi-music-note';
            case 'tv':
                return 'mdi-television-play';
            case 'dishwasher':
                return 'mdi-dishwasher';
            case 'mower':
                return 'mdi-robot-mower';
            default:
                return 'mdi-help-circle-outline';
        }
    }

    _getHeaderEntityBackground(entity, entityType) {
        if (entityType === 'smoke') return 'var(--red)';
        if (entityType === 'motion') {
            return entity.state === 'off' ? 'var(--gray000)' : 'var(--active-big)';
        }
        return 'var(--active-big)';
    }

    _getHeaderEntityTextColor(entity, entityType) {
        if (entityType === 'motion' && entity.state === 'off') {
            return 'var(--gray800)';
        }
        return 'var(--gray000)';
    }
}

// Export for Node.js testing
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RoomHeaderEntitiesInPopupsTests;
    
    // Run tests if this file is executed directly
    if (require.main === module) {
        (async () => {
            try {
                const tests = new RoomHeaderEntitiesInPopupsTests();
                await tests.runAllTests();
                console.log('All Room Header Entities in Popups tests passed! ✅');
            } catch (error) {
                console.error('Room Header Entities in Popups tests failed:', error.message);
                process.exit(1);
            }
        })();
    }
} else {
    // Browser environment - add to global scope
    window.RoomHeaderEntitiesInPopupsTests = RoomHeaderEntitiesInPopupsTests;
}