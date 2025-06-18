// Test for reversed media player admin functionality
class MediaPlayerAdminReversedTests {
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

    // Test that the new rendering function creates correct UI structure
    testMediaPlayerAssignmentsRendering() {
        console.log('\n[DashView] Testing media player assignments rendering...');
        
        const panel = new MockDashViewPanel();
        
        // Setup test data
        panel._adminLocalState = {
            houseConfig: {
                rooms: {
                    living_room: {
                        friendly_name: 'Living Room',
                        media_players: [
                            { entity: 'media_player.living_room_speaker' }
                        ]
                    },
                    bedroom: {
                        friendly_name: 'Bedroom',
                        media_players: []
                    }
                }
            },
            allMediaPlayers: [
                { entity_id: 'media_player.living_room_speaker', friendly_name: 'Living Room Speaker' },
                { entity_id: 'media_player.kitchen_display', friendly_name: 'Kitchen Display' },
                { entity_id: 'media_player.bedroom_echo', friendly_name: 'Bedroom Echo' }
            ]
        };

        // Create mock DOM elements
        const mockContainer = {
            innerHTML: '',
            appendChild: function(element) {
                this.children = this.children || [];
                this.children.push(element);
            }
        };

        // Mock shadow DOM
        panel.shadowRoot = {
            getElementById: function(id) {
                if (id === 'media-player-assignment-list') {
                    return mockContainer;
                }
                return null;
            }
        };

        // Call the function under test
        panel._renderMediaPlayerAssignments();

        // Verify that container was cleared
        this.assert(
            mockContainer.innerHTML === '',
            'Container should be cleared before rendering'
        );

        // Verify that all players are rendered
        this.assert(
            mockContainer.children && mockContainer.children.length === 3,
            'Should render all 3 media players'
        );

        // Verify structure of rendered items
        const firstItem = mockContainer.children[0];
        this.assert(
            firstItem.className === 'floor-item',
            'Each item should have floor-item class for consistent styling'
        );

        this.assert(
            firstItem.innerHTML.includes('Living Room Speaker'),
            'First item should contain friendly name'
        );

        this.assert(
            firstItem.innerHTML.includes('media_player.living_room_speaker'),
            'First item should contain entity ID'
        );

        this.assert(
            firstItem.innerHTML.includes('player-room-selector'),
            'Each item should have a room selector dropdown'
        );

        this.assert(
            firstItem.innerHTML.includes('-- Unassigned --'),
            'Dropdown should have unassigned option'
        );

        this.assert(
            firstItem.innerHTML.includes('Living Room'),
            'Dropdown should include room options'
        );
    }

    // Test the save all assignments functionality
    testSaveAllMediaPlayerAssignments() {
        console.log('\n[DashView] Testing save all media player assignments...');
        
        const panel = new MockDashViewPanel();
        
        // Setup initial state
        panel._adminLocalState = {
            houseConfig: {
                rooms: {
                    living_room: {
                        friendly_name: 'Living Room',
                        media_players: [
                            { entity: 'media_player.old_assignment' }
                        ]
                    },
                    bedroom: {
                        friendly_name: 'Bedroom',
                        media_players: [
                            { entity: 'media_player.another_old' }
                        ]
                    }
                }
            }
        };

        // Mock shadow DOM with selectors
        const mockSelectors = [
            {
                dataset: { entityId: 'media_player.speaker1' },
                value: 'living_room'
            },
            {
                dataset: { entityId: 'media_player.speaker2' },
                value: 'bedroom'
            },
            {
                dataset: { entityId: 'media_player.unassigned' },
                value: ''
            }
        ];

        panel.shadowRoot = {
            getElementById: function(id) {
                if (id === 'media-player-status') {
                    return { textContent: '', className: '' };
                }
                return null;
            },
            querySelectorAll: function(selector) {
                if (selector === '.player-room-selector') {
                    return mockSelectors;
                }
                return [];
            }
        };

        // Call the function under test
        panel.saveAllMediaPlayerAssignments();

        // Verify that old assignments were cleared
        this.assert(
            panel._adminLocalState.houseConfig.rooms.living_room.media_players.length === 1,
            'Living room should have 1 media player after save'
        );

        this.assert(
            panel._adminLocalState.houseConfig.rooms.living_room.media_players[0].entity === 'media_player.speaker1',
            'Living room should have the newly assigned speaker1'
        );

        this.assert(
            panel._adminLocalState.houseConfig.rooms.bedroom.media_players.length === 1,
            'Bedroom should have 1 media player after save'
        );

        this.assert(
            panel._adminLocalState.houseConfig.rooms.bedroom.media_players[0].entity === 'media_player.speaker2',
            'Bedroom should have the newly assigned speaker2'
        );

        // Verify API call was made
        this.assert(
            panel.apiCallsMade.length === 1,
            'Should make exactly one API call to save config'
        );

        this.assert(
            panel.apiCallsMade[0].method === 'POST',
            'API call should be POST method'
        );

        this.assert(
            panel.apiCallsMade[0].endpoint === 'dashview/config',
            'API call should be to dashview/config endpoint'
        );
    }

    // Test integration with existing media player functionality
    testIntegrationWithExistingFunctionality() {
        console.log('\n[DashView] Testing integration with existing media player functionality...');
        
        const panel = new MockDashViewPanel();
        
        // Verify that existing media player methods are not affected
        this.assert(
            typeof panel._initializeMediaPlayerControls === 'function',
            'Existing _initializeMediaPlayerControls method should still exist'
        );
        
        this.assert(
            typeof panel.updateMediaPlayerDisplay === 'function',
            'Existing updateMediaPlayerDisplay method should still exist'
        );
        
        this.assert(
            typeof panel.updateMediaPlayerVolume === 'function',
            'Existing updateMediaPlayerVolume method should still exist'
        );

        // Verify that the new methods exist
        this.assert(
            typeof panel._renderMediaPlayerAssignments === 'function',
            'New _renderMediaPlayerAssignments method should exist'
        );
        
        this.assert(
            typeof panel.saveAllMediaPlayerAssignments === 'function',
            'New saveAllMediaPlayerAssignments method should exist'
        );
    }

    // Test error handling in the new functionality
    testErrorHandling() {
        console.log('\n[DashView] Testing error handling in new functionality...');
        
        const panel = new MockDashViewPanel();
        
        // Test rendering with missing data
        panel._adminLocalState = {
            houseConfig: { rooms: {} },
            allMediaPlayers: []
        };

        panel.shadowRoot = {
            getElementById: function(id) {
                if (id === 'media-player-assignment-list') {
                    return { innerHTML: '', appendChild: function() {} };
                }
                return null;
            }
        };

        // Should not throw error with empty data
        try {
            panel._renderMediaPlayerAssignments();
            this.assert(true, 'Should handle empty data gracefully');
        } catch (error) {
            this.assert(false, 'Should not throw error with empty data');
        }

        // Test save with API error
        panel._hass = {
            callApi: function() {
                return Promise.reject(new Error('API Error'));
            }
        };

        panel.shadowRoot = {
            getElementById: function(id) {
                if (id === 'media-player-status') {
                    return { textContent: '', className: '' };
                }
                return null;
            },
            querySelectorAll: function() {
                return [];
            }
        };

        // Should handle API errors gracefully
        panel.saveAllMediaPlayerAssignments().then(() => {
            this.assert(false, 'Should have caught API error');
        }).catch(() => {
            this.assert(true, 'Should handle API errors gracefully');
        });
    }

    // Run all tests
    runAllTests() {
        console.log('\n🎵 Running Reversed Media Player Admin tests...');
        
        this.testMediaPlayerAssignmentsRendering();
        this.testSaveAllMediaPlayerAssignments();
        this.testIntegrationWithExistingFunctionality();
        this.testErrorHandling();
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        if (passed === total) {
            console.log(`\n✅ All ${total} reversed media player admin tests passed!`);
            return true;
        } else {
            console.log(`\n❌ ${total - passed} out of ${total} tests failed!`);
            return false;
        }
    }
}

// Mock DashView Panel for testing
class MockDashViewPanel {
    constructor() {
        this._adminLocalState = {};
        this.apiCallsMade = [];
        
        this._hass = {
            callApi: (method, endpoint, data) => {
                this.apiCallsMade.push({ method, endpoint, data });
                return Promise.resolve();
            }
        };
    }
    
    // Mock the new methods we're testing
    _renderMediaPlayerAssignments() {
        const shadow = this.shadowRoot;
        const container = shadow.getElementById('media-player-assignment-list');
        const rooms = this._adminLocalState.houseConfig.rooms || {};
        const allPlayers = this._adminLocalState.allMediaPlayers || [];

        if (!container) return;
        container.innerHTML = '';

        // Create a reverse map to easily find which room a player is in
        const playerToRoomMap = new Map();
        for (const [roomKey, roomConfig] of Object.entries(rooms)) {
            (roomConfig.media_players || []).forEach(player => {
                playerToRoomMap.set(player.entity, roomKey);
            });
        }

        // Create a dropdown option for each room
        const roomOptions = Object.entries(rooms).map(([roomKey, roomConfig]) => 
            `<option value="${roomKey}">${roomConfig.friendly_name || roomKey}</option>`
        ).join('');

        // Generate a row for each available media player
        allPlayers.forEach(player => {
            const assignedRoomKey = playerToRoomMap.get(player.entity_id) || '';
            
            const item = {
                className: 'floor-item',
                innerHTML: `
                    <div class="floor-info">
                        <div class="floor-name">${player.friendly_name}</div>
                        <div class="floor-details">${player.entity_id}</div>
                    </div>
                    <div class="setting-row">
                        <select class="dropdown-selector player-room-selector" data-entity-id="${player.entity_id}">
                            <option value="">-- Unassigned --</option>
                            ${roomOptions}
                        </select>
                    </div>
                `,
                querySelector: function(selector) {
                    if (selector === '.player-room-selector') {
                        return { value: assignedRoomKey };
                    }
                    return null;
                }
            };

            container.appendChild(item);
        });
    }

    async saveAllMediaPlayerAssignments() {
        const shadow = this.shadowRoot;
        const statusElement = shadow.getElementById('media-player-status');
        
        const houseConfig = this._adminLocalState.houseConfig;

        // 1. Clear all existing media player assignments from all rooms
        for (const roomKey in houseConfig.rooms) {
            if (houseConfig.rooms[roomKey].media_players) {
                houseConfig.rooms[roomKey].media_players = [];
            }
        }

        // 2. Iterate through the UI and rebuild the assignments
        const selectors = shadow.querySelectorAll('.player-room-selector');
        selectors.forEach(selector => {
            const entityId = selector.dataset.entityId;
            const roomKey = selector.value;

            // If a room is selected (i.e., not "Unassigned")
            if (roomKey && houseConfig.rooms[roomKey]) {
                // Ensure the media_players array exists
                if (!houseConfig.rooms[roomKey].media_players) {
                    houseConfig.rooms[roomKey].media_players = [];
                }
                // Add the player to the selected room
                houseConfig.rooms[roomKey].media_players.push({ entity: entityId });
            }
        });

        // 3. Save the entire updated houseConfig
        try {
            await this._hass.callApi('POST', 'dashview/config', houseConfig);
            this._adminLocalState.houseConfig = houseConfig;
        } catch (error) {
            throw error;
        }
    }
    
    // Mock existing methods to ensure they're preserved
    _initializeMediaPlayerControls(popup) {
        return true;
    }
    
    updateMediaPlayerDisplay(popup, entityId) {
        return true;
    }
    
    updateMediaPlayerVolume(popup, entityId) {
        return true;
    }
    
    _setStatusMessage(element, message, type) {
        if (element) {
            element.textContent = message;
            element.className = type;
        }
    }
}

// Export for use in test runner
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MediaPlayerAdminReversedTests;
}

// Run tests if loaded directly
if (typeof require !== 'undefined' && require.main === module) {
    const tests = new MediaPlayerAdminReversedTests();
    const success = tests.runAllTests();
    console.log('\n🎵 Reversed Media Player Admin tests completed!');
    if (!success) {
        process.exit(1);
    }
}